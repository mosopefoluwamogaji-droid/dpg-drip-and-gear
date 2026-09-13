// DPG Drip and Gear — server
// No npm dependencies required (uses only Node's built-in modules), so
// `npm install` is optional and `node server.js` runs it directly.
//
// What it does:
//  - Serves the static storefront from /public
//  - GET  /api/config            -> public store settings (name, contact info)
//  - GET  /api/products          -> full catalog with LIVE prices merged in
//  - POST /api/admin/login       -> { password } -> { token }   (12h session)
//  - PUT  /api/admin/prices      -> [auth] { updates:[{id,price}] } -> saves to disk
//  - POST /api/admin/logout      -> [auth] invalidates the token
//
// Live prices are stored in data/prices.json on the server's disk, so a price
// change made from /admin.html is saved centrally and shown to every visitor
// immediately — not just the device that made the edit.

const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { CATEGORIES, PRODUCTS } = require("./catalog.js");

const ROOT = __dirname;
const PUBLIC_DIR = path.join(ROOT, "public");
const DATA_DIR = process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : path.join(ROOT, "data");
const PRICES_FILE = path.join(DATA_DIR, "prices.json");
const STOCK_FILE = path.join(DATA_DIR, "stock.json");
const REVIEWS_FILE = path.join(DATA_DIR, "reviews.json");
const CUSTOM_PRODUCTS_FILE = path.join(DATA_DIR, "custom-products.json");
const ADMIN_FILE = path.join(DATA_DIR, "admin.json");
const UPLOAD_DIR = path.join(PUBLIC_DIR, "assets", "images", "custom");
const CONFIG_FILE = path.join(ROOT, "config.json");

const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours
const sessions = new Map(); // token -> expiry timestamp

// ---------------- bootstrap ----------------

function readJSON(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (e) {
    return fallback;
  }
}

function writeJSONAtomic(file, obj) {
  const tmp = file + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(obj, null, 2));
  fs.renameSync(tmp, file);
}

function hashPassword(password, salt) {
  return crypto.scryptSync(password, salt, 64).toString("hex");
}

function ensureBootstrapped() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(PRICES_FILE)) writeJSONAtomic(PRICES_FILE, {});
  if (!fs.existsSync(STOCK_FILE)) writeJSONAtomic(STOCK_FILE, {}); // id -> "sold_out" (absence = in stock)
  if (!fs.existsSync(REVIEWS_FILE)) writeJSONAtomic(REVIEWS_FILE, []); // array of review objects
  if (!fs.existsSync(CUSTOM_PRODUCTS_FILE)) writeJSONAtomic(CUSTOM_PRODUCTS_FILE, []); // admin-added products
  if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

  if (!fs.existsSync(ADMIN_FILE)) {
    const config = readJSON(CONFIG_FILE, {});
    const initialPassword = process.env.ADMIN_PASSWORD || config.adminPassword || "change-me";
    const salt = crypto.randomBytes(16).toString("hex");
    const hash = hashPassword(initialPassword, salt);
    writeJSONAtomic(ADMIN_FILE, { salt, hash });
    console.log("[setup] Admin account created from " + (process.env.ADMIN_PASSWORD ? "the ADMIN_PASSWORD environment variable." : "config.json's adminPassword."));
    console.log("[setup] To change it later: delete data/admin.json, edit config.json, restart.");
  }
}

// ---------------- data helpers ----------------

function getLivePrices() {
  return readJSON(PRICES_FILE, {});
}

function getCustomProducts() {
  return readJSON(CUSTOM_PRODUCTS_FILE, []);
}

function getAllProductMeta() {
  // Static catalog.js items, tagged isCustom:false, plus admin-added items.
  return PRODUCTS.map((p) => ({ ...p, isCustom: false })).concat(getCustomProducts());
}

function getStockMap() {
  return readJSON(STOCK_FILE, {});
}

function getReviews() {
  return readJSON(REVIEWS_FILE, []);
}

function getApprovedReviews(productId) {
  return getReviews().filter((r) => r.productId === productId && r.status === "approved");
}

function getReviewSummaries() {
  // productId -> { average, count }
  const summaries = {};
  for (const r of getReviews()) {
    if (r.status !== "approved") continue;
    if (!summaries[r.productId]) summaries[r.productId] = { total: 0, count: 0 };
    summaries[r.productId].total += r.rating;
    summaries[r.productId].count += 1;
  }
  const result = {};
  for (const [id, s] of Object.entries(summaries)) {
    result[id] = { average: Math.round((s.total / s.count) * 10) / 10, count: s.count };
  }
  return result;
}

function getProductsWithLivePrices() {
  const overrides = getLivePrices();
  const stock = getStockMap();
  const reviewSummaries = getReviewSummaries();
  return getAllProductMeta().map((p) => ({
    ...p,
    price: overrides[p.id] != null ? overrides[p.id] : p.defaultPrice,
    inStock: stock[p.id] !== "sold_out",
    rating: reviewSummaries[p.id] || { average: 0, count: 0 },
  }));
}

function getPublicConfig() {
  const config = readJSON(CONFIG_FILE, {});
  return {
    storeName: config.storeName,
    whatsappNumber: config.whatsappNumber,
    phoneNumber: config.phoneNumber,
    email: config.email,
    currency: config.currency,
    returnPolicy: config.returnPolicy,
    deliveryNote: config.deliveryNote,
  };
}

// ---------------- auth helpers ----------------

function makeSession() {
  const token = crypto.randomBytes(24).toString("hex");
  sessions.set(token, Date.now() + SESSION_TTL_MS);
  return token;
}

function checkAuth(req) {
  const header = req.headers["authorization"] || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return false;
  const expiry = sessions.get(token);
  if (!expiry || expiry < Date.now()) {
    sessions.delete(token);
    return false;
  }
  return token;
}

function verifyPassword(password) {
  const record = readJSON(ADMIN_FILE, null);
  if (!record) return false;
  const attempt = hashPassword(password, record.salt);
  // constant-time-ish comparison
  const a = Buffer.from(attempt, "hex");
  const b = Buffer.from(record.hash, "hex");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

// ---------------- request body helper ----------------

function readBody(req, maxBytes = 1_000_000) {
  return new Promise((resolve, reject) => {
    let chunks = [];
    let size = 0;
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > maxBytes) {
        reject(new Error("Body too large"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => {
      const raw = Buffer.concat(chunks).toString("utf8");
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch (e) {
        reject(new Error("Invalid JSON body"));
      }
    });
    req.on("error", reject);
  });
}

function sendJSON(res, status, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
  });
  res.end(body);
}

// ---------------- static file serving ----------------

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".webmanifest": "application/manifest+json",
};

function serveStatic(req, res, urlPath) {
  let filePath = urlPath === "/" ? "/index.html" : urlPath;
  filePath = path.normalize(filePath).replace(/^(\.\.[/\\])+/, "");
  const fullPath = path.join(PUBLIC_DIR, filePath);

  if (!fullPath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    return res.end("Forbidden");
  }

  fs.readFile(fullPath, (err, data) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      return res.end("Not found");
    }
    const ext = path.extname(fullPath).toLowerCase();
    res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
    res.end(data);
  });
}

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 40);
}

const ALLOWED_IMAGE_EXT = { jpeg: "jpg", jpg: "jpg", png: "png", webp: "webp" };

function saveUploadedImage(base64Data, mimeType, idHint) {
  const match = /^data:image\/(\w+);base64,(.+)$/.exec(base64Data) || [null, (mimeType || "").split("/")[1], base64Data];
  const rawExt = (match[1] || "jpg").toLowerCase();
  const ext = ALLOWED_IMAGE_EXT[rawExt];
  if (!ext) throw new Error("Only JPG, PNG, or WEBP images are supported");
  const dataPart = match[2] || base64Data;
  const buffer = Buffer.from(dataPart, "base64");
  if (buffer.length === 0) throw new Error("Image data is empty");
  if (buffer.length > 6_000_000) throw new Error("Image is too large (max 6MB)");
  const filename = `${idHint}-${Date.now().toString(36)}.${ext}`;
  fs.writeFileSync(path.join(UPLOAD_DIR, filename), buffer);
  return "custom/" + filename;
}

// ---------------- routes ----------------

async function handleApi(req, res, urlPath) {
  // GET /api/config
  if (req.method === "GET" && urlPath === "/api/config") {
    return sendJSON(res, 200, getPublicConfig());
  }

  // GET /api/products
  if (req.method === "GET" && urlPath === "/api/products") {
    return sendJSON(res, 200, { categories: CATEGORIES, products: getProductsWithLivePrices() });
  }

  // POST /api/admin/login
  if (req.method === "POST" && urlPath === "/api/admin/login") {
    let body;
    try {
      body = await readBody(req);
    } catch (e) {
      return sendJSON(res, 400, { error: "Invalid request body" });
    }
    if (!body.password || !verifyPassword(body.password)) {
      return sendJSON(res, 401, { error: "Wrong password" });
    }
    const token = makeSession();
    return sendJSON(res, 200, { token });
  }

  // POST /api/admin/logout
  if (req.method === "POST" && urlPath === "/api/admin/logout") {
    const token = checkAuth(req);
    if (token) sessions.delete(token);
    return sendJSON(res, 200, { ok: true });
  }

  // PUT /api/admin/prices
  // Each update may include `price` (number), `inStock` (boolean), or both.
  if (req.method === "PUT" && urlPath === "/api/admin/prices") {
    if (!checkAuth(req)) return sendJSON(res, 401, { error: "Not signed in" });
    let body;
    try {
      body = await readBody(req);
    } catch (e) {
      return sendJSON(res, 400, { error: "Invalid request body" });
    }
    const updates = Array.isArray(body.updates) ? body.updates : [];
    const validIds = new Set(getAllProductMeta().map((p) => p.id));
    const overrides = getLivePrices();
    const stock = getStockMap();

    for (const u of updates) {
      if (!u || typeof u.id !== "string" || !validIds.has(u.id)) {
        return sendJSON(res, 400, { error: `Unknown product id: ${u && u.id}` });
      }
      if (u.price !== undefined) {
        const price = Number(u.price);
        if (!Number.isFinite(price) || price < 0) {
          return sendJSON(res, 400, { error: `Invalid price for ${u.id}` });
        }
        overrides[u.id] = Math.round(price);
      }
      if (u.inStock !== undefined) {
        if (u.inStock) {
          delete stock[u.id]; // absence = in stock
        } else {
          stock[u.id] = "sold_out";
        }
      }
    }

    writeJSONAtomic(PRICES_FILE, overrides);
    writeJSONAtomic(STOCK_FILE, stock);
    return sendJSON(res, 200, { ok: true, products: getProductsWithLivePrices() });
  }

  // POST /api/admin/reset-prices
  if (req.method === "POST" && urlPath === "/api/admin/reset-prices") {
    if (!checkAuth(req)) return sendJSON(res, 401, { error: "Not signed in" });
    writeJSONAtomic(PRICES_FILE, {});
    return sendJSON(res, 200, { ok: true, products: getProductsWithLivePrices() });
  }

  // GET /api/reviews?productId=xyz  -> approved reviews for one product
  if (req.method === "GET" && urlPath === "/api/reviews") {
    const parsed = new URL(req.url, "http://localhost");
    const productId = parsed.searchParams.get("productId");
    if (!productId) return sendJSON(res, 400, { error: "productId is required" });
    const reviews = getApprovedReviews(productId).sort((a, b) => b.createdAt - a.createdAt);
    const summaries = getReviewSummaries();
    return sendJSON(res, 200, { reviews, summary: summaries[productId] || { average: 0, count: 0 } });
  }

  // POST /api/reviews  -> customer submits a review (goes to pending, not shown until approved)
  if (req.method === "POST" && urlPath === "/api/reviews") {
    let body;
    try {
      body = await readBody(req);
    } catch (e) {
      return sendJSON(res, 400, { error: "Invalid request body" });
    }
    const validIds = new Set(getAllProductMeta().map((p) => p.id));
    const productId = String(body.productId || "");
    const name = String(body.name || "").trim().slice(0, 60);
    const comment = String(body.comment || "").trim().slice(0, 600);
    const rating = Number(body.rating);

    if (!validIds.has(productId)) return sendJSON(res, 400, { error: "Unknown product" });
    if (!name) return sendJSON(res, 400, { error: "Name is required" });
    if (!comment) return sendJSON(res, 400, { error: "Review text is required" });
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return sendJSON(res, 400, { error: "Rating must be a whole number from 1 to 5" });
    }

    const reviews = getReviews();
    reviews.push({
      id: crypto.randomBytes(8).toString("hex"),
      productId,
      name,
      rating,
      comment,
      status: "pending",
      createdAt: Date.now(),
    });
    writeJSONAtomic(REVIEWS_FILE, reviews);
    return sendJSON(res, 200, { ok: true, message: "Thanks! Your review will appear after it's approved." });
  }

  // GET /api/admin/reviews -> every review (pending + approved), for the moderation queue
  if (req.method === "GET" && urlPath === "/api/admin/reviews") {
    if (!checkAuth(req)) return sendJSON(res, 401, { error: "Not signed in" });
    const productNames = new Map(getAllProductMeta().map((p) => [p.id, p.name]));
    const reviews = getReviews()
      .map((r) => ({ ...r, productName: productNames.get(r.productId) || r.productId }))
      .sort((a, b) => b.createdAt - a.createdAt);
    return sendJSON(res, 200, { reviews });
  }

  // POST /api/admin/reviews/approve  { id }
  if (req.method === "POST" && urlPath === "/api/admin/reviews/approve") {
    if (!checkAuth(req)) return sendJSON(res, 401, { error: "Not signed in" });
    let body;
    try {
      body = await readBody(req);
    } catch (e) {
      return sendJSON(res, 400, { error: "Invalid request body" });
    }
    const reviews = getReviews();
    const review = reviews.find((r) => r.id === body.id);
    if (!review) return sendJSON(res, 404, { error: "Review not found" });
    review.status = "approved";
    writeJSONAtomic(REVIEWS_FILE, reviews);
    return sendJSON(res, 200, { ok: true });
  }

  // POST /api/admin/reviews/reject  { id }  — removes it entirely
  if (req.method === "POST" && urlPath === "/api/admin/reviews/reject") {
    if (!checkAuth(req)) return sendJSON(res, 401, { error: "Not signed in" });
    let body;
    try {
      body = await readBody(req);
    } catch (e) {
      return sendJSON(res, 400, { error: "Invalid request body" });
    }
    const reviews = getReviews().filter((r) => r.id !== body.id);
    writeJSONAtomic(REVIEWS_FILE, reviews);
    return sendJSON(res, 200, { ok: true });
  }

  // POST /api/admin/products — add a new product (with photo). Always lands in
  // the "New Arrivals" section (isNew: true) since it's something just coming in.
  if (req.method === "POST" && urlPath === "/api/admin/products") {
    if (!checkAuth(req)) return sendJSON(res, 401, { error: "Not signed in" });
    let body;
    try {
      body = await readBody(req, 8_000_000); // images are base64, so allow more room
    } catch (e) {
      return sendJSON(res, 400, { error: e.message === "Body too large" ? "Image is too large" : "Invalid request body" });
    }

    const name = String(body.name || "").trim().slice(0, 80);
    const desc = String(body.desc || "").trim().slice(0, 300);
    const category = String(body.category || "");
    const price = Number(body.price);
    const sizes = Array.isArray(body.sizes)
      ? body.sizes.map((s) => String(s).trim()).filter(Boolean).slice(0, 10)
      : [];

    if (!name) return sendJSON(res, 400, { error: "Product name is required" });
    if (!CATEGORIES.some((c) => c.id === category)) return sendJSON(res, 400, { error: "Unknown category" });
    if (!Number.isFinite(price) || price < 0) return sendJSON(res, 400, { error: "Invalid price" });
    if (!body.image) return sendJSON(res, 400, { error: "A product photo is required" });

    const existingIds = new Set(getAllProductMeta().map((p) => p.id));
    let id = slugify(name) || "product";
    let suffix = 1;
    let candidate = id;
    while (existingIds.has(candidate)) {
      suffix += 1;
      candidate = `${id}-${suffix}`;
    }
    id = candidate;

    let imgPath;
    try {
      imgPath = saveUploadedImage(body.image, body.imageType, id);
    } catch (e) {
      return sendJSON(res, 400, { error: e.message });
    }

    const product = {
      id,
      category,
      name,
      desc: desc || name,
      defaultPrice: Math.round(price),
      img: imgPath,
      isNew: true,
      featured: false,
      isCustom: true,
    };
    if (sizes.length) product.sizes = sizes;

    const custom = getCustomProducts();
    custom.push(product);
    writeJSONAtomic(CUSTOM_PRODUCTS_FILE, custom);

    return sendJSON(res, 200, { ok: true, product, products: getProductsWithLivePrices() });
  }

  // DELETE /api/admin/products  { id } — only removes admin-added products;
  // the original photographed catalog in catalog.js can't be deleted this way.
  if (req.method === "DELETE" && urlPath === "/api/admin/products") {
    if (!checkAuth(req)) return sendJSON(res, 401, { error: "Not signed in" });
    let body;
    try {
      body = await readBody(req);
    } catch (e) {
      return sendJSON(res, 400, { error: "Invalid request body" });
    }
    const custom = getCustomProducts();
    const match = custom.find((p) => p.id === body.id);
    if (!match) return sendJSON(res, 404, { error: "Custom product not found (built-in catalog items can't be deleted here)" });

    const remaining = custom.filter((p) => p.id !== body.id);
    writeJSONAtomic(CUSTOM_PRODUCTS_FILE, remaining);

    // tidy up: image file, any price/stock override, and its reviews
    try {
      const imgFile = path.join(PUBLIC_DIR, "assets", "images", match.img);
      if (fs.existsSync(imgFile)) fs.unlinkSync(imgFile);
    } catch (e) {}
    const prices = getLivePrices();
    if (prices[body.id] != null) { delete prices[body.id]; writeJSONAtomic(PRICES_FILE, prices); }
    const stock = getStockMap();
    if (stock[body.id] != null) { delete stock[body.id]; writeJSONAtomic(STOCK_FILE, stock); }
    const reviews = getReviews().filter((r) => r.productId !== body.id);
    writeJSONAtomic(REVIEWS_FILE, reviews);

    return sendJSON(res, 200, { ok: true, products: getProductsWithLivePrices() });
  }

  sendJSON(res, 404, { error: "Not found" });
}

// ---------------- server ----------------

ensureBootstrapped();
const config = readJSON(CONFIG_FILE, {});
const PORT = process.env.PORT || config.port || 3000;

const server = http.createServer(async (req, res) => {
  const urlPath = decodeURIComponent(req.url.split("?")[0]);

  if (urlPath.startsWith("/api/")) {
    try {
      await handleApi(req, res, urlPath);
    } catch (e) {
      sendJSON(res, 500, { error: "Server error" });
    }
    return;
  }

  serveStatic(req, res, urlPath);
});

server.listen(PORT, () => {
  console.log(`DPG Drip and Gear server running at http://localhost:${PORT}`);
});
