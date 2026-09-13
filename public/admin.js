const TOKEN_KEY = "dpg_admin_token";
let CATEGORIES = [];
let PRODUCTS = [];
let pendingChanges = {}; // id -> { price?, inStock? } (unsaved)

function getToken() {
  return sessionStorage.getItem(TOKEN_KEY);
}
function setToken(t) {
  sessionStorage.setItem(TOKEN_KEY, t);
}
function clearToken() {
  sessionStorage.removeItem(TOKEN_KEY);
}

async function api(path, options = {}) {
  const headers = Object.assign({ "Content-Type": "application/json" }, options.headers || {});
  const token = getToken();
  if (token) headers["Authorization"] = "Bearer " + token;
  const res = await fetch(path, { ...options, headers });
  if (res.status === 401) {
    clearToken();
    showLogin("Session expired — please sign in again.");
    throw new Error("Unauthorized");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

document.addEventListener("DOMContentLoaded", () => {
  if (getToken()) {
    showAdmin();
  }

  document.getElementById("login-btn").addEventListener("click", attemptLogin);
  document.getElementById("password-input").addEventListener("keydown", (e) => {
    if (e.key === "Enter") attemptLogin();
  });
  document.getElementById("logout-link").addEventListener("click", async (e) => {
    e.preventDefault();
    try {
      await api("/api/admin/logout", { method: "POST" });
    } catch (e) {}
    clearToken();
    location.reload();
  });
});

async function attemptLogin() {
  const val = document.getElementById("password-input").value;
  const btn = document.getElementById("login-btn");
  btn.disabled = true;
  btn.textContent = "Signing in…";
  try {
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: val }),
    });
    if (!res.ok) {
      document.getElementById("login-error").style.display = "block";
      btn.disabled = false;
      btn.textContent = "Sign in";
      return;
    }
    const data = await res.json();
    setToken(data.token);
    showAdmin();
  } catch (e) {
    document.getElementById("login-error").textContent = "Could not reach the server. Try again.";
    document.getElementById("login-error").style.display = "block";
    btn.disabled = false;
    btn.textContent = "Sign in";
  }
}

function showLogin(message) {
  document.getElementById("admin-panel").style.display = "none";
  document.getElementById("login-screen").style.display = "block";
  if (message) {
    const err = document.getElementById("login-error");
    err.textContent = message;
    err.style.display = "block";
  }
}

async function showAdmin() {
  document.getElementById("login-screen").style.display = "none";
  document.getElementById("admin-panel").style.display = "block";
  await initAdminPanel();
}

async function initAdminPanel() {
  const data = await api("/api/products");
  CATEGORIES = data.categories;
  PRODUCTS = data.products;

  const filter = document.getElementById("cat-filter");
  filter.innerHTML =
    `<option value="all">All categories</option>` +
    CATEGORIES.map((c) => `<option value="${c.id}">${c.label}</option>`).join("");
  filter.addEventListener("change", renderTable);

  const newCategorySelect = document.getElementById("new-category");
  newCategorySelect.innerHTML = CATEGORIES.map((c) => `<option value="${c.id}">${c.label}</option>`).join("");

  document.getElementById("save-btn").addEventListener("click", saveChanges);
  document.getElementById("reset-all-btn").addEventListener("click", resetAll);
  document.getElementById("add-product-form").addEventListener("submit", submitNewProduct);
  document.getElementById("new-image").addEventListener("change", previewNewImage);

  renderTable();
  await loadReviewQueue();
}

function previewNewImage(e) {
  const file = e.target.files[0];
  const preview = document.getElementById("new-image-preview");
  if (!file) {
    preview.style.display = "none";
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    preview.src = reader.result;
    preview.style.display = "block";
  };
  reader.readAsDataURL(file);
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function submitNewProduct(e) {
  e.preventDefault();
  const statusEl = document.getElementById("add-product-status");
  const imageFile = document.getElementById("new-image").files[0];
  const name = document.getElementById("new-name").value.trim();
  const category = document.getElementById("new-category").value;
  const price = Number(document.getElementById("new-price").value);
  const desc = document.getElementById("new-desc").value.trim();
  const sizesRaw = document.getElementById("new-sizes").value.trim();
  const sizes = sizesRaw ? sizesRaw.split(",").map((s) => s.trim()).filter(Boolean) : [];

  if (!name || !category || !Number.isFinite(price) || !imageFile) {
    statusEl.textContent = "Please fill in name, category, price, and a photo.";
    return;
  }

  statusEl.textContent = "Uploading…";
  try {
    const imageBase64 = await fileToBase64(imageFile);
    const data = await api("/api/admin/products", {
      method: "POST",
      body: JSON.stringify({ name, category, price, desc, sizes, image: imageBase64 }),
    });
    PRODUCTS = data.products;
    statusEl.textContent = `Added "${data.product.name}" — it's live now, under New Arrivals.`;
    document.getElementById("add-product-form").reset();
    document.getElementById("new-image-preview").style.display = "none";
    renderTable();
  } catch (err) {
    statusEl.textContent = "Could not add product: " + err.message;
  }
}

async function removeProduct(id, btn) {
  if (!confirm("Remove this product from the live store? This can't be undone.")) return;
  btn.disabled = true;
  try {
    const data = await api("/api/admin/products", { method: "DELETE", body: JSON.stringify({ id }) });
    PRODUCTS = data.products;
    renderTable();
  } catch (e) {
    alert("Could not remove product: " + e.message);
    btn.disabled = false;
  }
}

async function loadReviewQueue() {
  const data = await api("/api/admin/reviews");
  const reviews = data.reviews;
  const pendingCount = reviews.filter((r) => r.status === "pending").length;
  document.getElementById("review-queue-count").textContent =
    pendingCount === 0 ? "No pending reviews" : pendingCount + " awaiting approval";

  const list = document.getElementById("reviews-admin-list");
  if (reviews.length === 0) {
    list.innerHTML = '<p style="color:var(--ink-soft);font-size:0.9rem;">No reviews yet.</p>';
    return;
  }

  list.innerHTML = reviews
    .map((r) => {
      const stars = "★".repeat(r.rating) + "☆".repeat(5 - r.rating);
      const date = new Date(r.createdAt).toLocaleDateString();
      return `
        <div class="review-card ${r.status}" data-id="${r.id}">
          <div class="review-card-top">
            <span class="review-card-product">${r.productName}</span>
            <span class="status-tag ${r.status}">${r.status}</span>
          </div>
          <div class="review-card-top">
            <span class="review-card-name">${r.name}</span>
            <span class="review-card-stars">${stars}</span>
          </div>
          <p class="review-card-comment">${r.comment}</p>
          <div class="review-card-actions">
            ${r.status === "pending" ? `<button class="btn-approve" data-action="approve">Approve</button>` : ""}
            <button class="btn-reject" data-action="reject">${r.status === "pending" ? "Reject" : "Delete"}</button>
          </div>
          <p style="font-size:0.72rem;color:var(--ink-soft);margin:8px 0 0;">${date}</p>
        </div>`;
    })
    .join("");

  list.querySelectorAll(".review-card").forEach((card) => {
    const id = card.dataset.id;
    card.querySelectorAll("button").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const action = btn.dataset.action;
        btn.disabled = true;
        try {
          await api(`/api/admin/reviews/${action}`, { method: "POST", body: JSON.stringify({ id }) });
          await loadReviewQueue();
        } catch (e) {
          alert("Could not update review: " + e.message);
          btn.disabled = false;
        }
      });
    });
  });
}

function renderTable() {
  const catVal = document.getElementById("cat-filter").value;
  const list = catVal === "all" ? PRODUCTS : PRODUCTS.filter((p) => p.category === catVal);

  const body = document.getElementById("price-table-body");
  body.innerHTML = list
    .map((p) => {
      const cat = CATEGORIES.find((c) => c.id === p.category);
      const soldOut = p.inStock === false;
      return `
        <tr data-id="${p.id}">
          <td><img src="assets/images/${p.img}" alt=""></td>
          <td>${p.name}${p.isCustom ? ' <span style="font-size:0.7rem;color:var(--brass-deep);">(added)</span>' : ""}</td>
          <td>${cat ? cat.label : ""}</td>
          <td><input type="number" min="0" step="500" value="${p.price}"></td>
          <td>
            <select class="stock-select ${soldOut ? "is-sold-out" : ""}">
              <option value="in" ${!soldOut ? "selected" : ""}>In stock</option>
              <option value="out" ${soldOut ? "selected" : ""}>Sold out</option>
            </select>
          </td>
          <td>${p.isCustom ? `<button type="button" class="btn-remove-product">Remove</button>` : ""}</td>
        </tr>`;
    })
    .join("");

  body.querySelectorAll("tr").forEach((row) => {
    const id = row.dataset.id;
    const priceInput = row.querySelector("input[type=number]");
    const stockSelect = row.querySelector("select.stock-select");
    const removeBtn = row.querySelector(".btn-remove-product");

    priceInput.addEventListener("input", () => {
      pendingChanges[id] = Object.assign({}, pendingChanges[id], { price: Number(priceInput.value) });
      row.classList.add("row-changed");
      updateStatus();
    });

    stockSelect.addEventListener("change", () => {
      const inStock = stockSelect.value === "in";
      stockSelect.classList.toggle("is-sold-out", !inStock);
      pendingChanges[id] = Object.assign({}, pendingChanges[id], { inStock });
      row.classList.add("row-changed");
      updateStatus();
    });

    if (removeBtn) {
      removeBtn.addEventListener("click", () => removeProduct(id, removeBtn));
    }
  });
}

function updateStatus(text) {
  const count = Object.keys(pendingChanges).length;
  document.getElementById("save-status").textContent =
    text || (count === 0 ? "No unsaved changes" : count + " price" + (count > 1 ? "s" : "") + " changed — not saved yet");
}

async function saveChanges() {
  const updates = Object.entries(pendingChanges).map(([id, fields]) => Object.assign({ id }, fields));
  if (updates.length === 0) return;

  const status = document.getElementById("save-status");
  status.textContent = "Saving…";
  try {
    const data = await api("/api/admin/prices", {
      method: "PUT",
      body: JSON.stringify({ updates }),
    });
    PRODUCTS = data.products;
    pendingChanges = {};
    renderTable();
    document.querySelectorAll(".row-changed").forEach((r) => r.classList.remove("row-changed"));
    status.textContent = "Saved — now live for everyone ✓";
    setTimeout(() => updateStatus(), 2200);
  } catch (e) {
    status.textContent = "Could not save: " + e.message;
  }
}

async function resetAll() {
  if (!confirm("Reset every price on the LIVE site back to its default catalog value?")) return;
  try {
    const data = await api("/api/admin/reset-prices", { method: "POST" });
    PRODUCTS = data.products;
    pendingChanges = {};
    renderTable();
    updateStatus("Reset — now live for everyone ✓");
    setTimeout(() => updateStatus(), 2200);
  } catch (e) {
    updateStatus("Could not reset: " + e.message);
  }
}
