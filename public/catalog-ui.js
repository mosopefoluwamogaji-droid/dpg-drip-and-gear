// Shared product card + modal UI. Depends on common.js having already
// loaded STORE_CONFIG / CATEGORIES / PRODUCTS.

let selectedSize = null;
let currentProductId = null;
let selectedReviewStars = 0;

function skeletonCardsHTML(count = 8) {
  return Array(count)
    .fill(0)
    .map(
      () => `
      <div class="card skeleton-card">
        <div class="card-img skeleton-block"></div>
        <div class="card-body">
          <span class="skeleton-line skeleton-line-sm"></span>
          <span class="skeleton-line skeleton-line-lg"></span>
          <span class="skeleton-line skeleton-line-md"></span>
        </div>
      </div>`
    )
    .join("");
}

function productCardHTML(p) {
  const cat = CATEGORIES.find((c) => c.id === p.category);
  const soldOut = p.inStock === false;
  const onSale = !soldOut && p.price < p.defaultPrice;
  const rating = p.rating && p.rating.count > 0
    ? `<span class="card-rating">${starString(p.rating.average)} <span class="card-rating-count">(${p.rating.count})</span></span>`
    : "";
  const hasSizes = p.sizes && p.sizes.length > 0;
  const quickAddBtn = !soldOut && !hasSizes
    ? `<button class="card-add-btn" data-action="quick-add" title="Add to cart">${typeof icon === "function" ? icon("cart") : "🛒"} Add</button>`
    : "";
  return `
    <div class="card reveal ${soldOut ? "card-sold-out" : ""}" data-id="${p.id}">
      <div class="card-img">
        ${soldOut ? '<span class="sold-badge">Sold out</span>' : ""}
        ${!soldOut && onSale ? '<span class="sale-badge">Offer</span>' : ""}
        <img src="assets/images/${p.img}" alt="${p.name}" loading="lazy">
        ${quickAddBtn}
      </div>
      <div class="card-body">
        <span class="card-cat">${cat ? cat.label : ""}</span>
        <span class="card-name">${p.name}</span>
        ${rating}
        <span class="card-price-row">
          <span class="card-price">${formatPrice(p.price)}</span>
          ${onSale ? `<span class="card-price-was">${formatPrice(p.defaultPrice)}</span>` : ""}
        </span>
      </div>
    </div>`;
}

function starString(average) {
  const rounded = Math.round(average * 2) / 2; // nearest half star
  let out = "";
  for (let i = 1; i <= 5; i++) {
    if (rounded >= i) out += "★";
    else if (rounded >= i - 0.5) out += "⯨";
    else out += "☆";
  }
  return `<span class="stars">${out}</span>`;
}

function renderProductGrid(containerEl, list) {
  containerEl.innerHTML = list.map(productCardHTML).join("");
  containerEl.querySelectorAll(".card").forEach((card) => {
    card.addEventListener("click", () => openProductModal(card.dataset.id));
    const quickAddBtn = card.querySelector(".card-add-btn");
    if (quickAddBtn) {
      quickAddBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        addToCart(card.dataset.id, null, 1);
        flashAdded(quickAddBtn);
      });
    }
  });
  if (typeof observeReveal === "function") observeReveal(".reveal", containerEl);
}

function flashAdded(btn) {
  const original = btn.textContent;
  btn.textContent = "✓ Added";
  btn.classList.add("added");
  setTimeout(() => {
    btn.textContent = original;
    btn.classList.remove("added");
  }, 1200);
}

function ensureModalMounted() {
  if (document.getElementById("modal-backdrop")) return;
  const div = document.createElement("div");
  div.innerHTML = `
    <div class="modal-backdrop hidden" id="modal-backdrop">
      <div class="modal">
        <div class="modal-img"><img id="modal-img" src="" alt=""></div>
        <div class="modal-info">
          <button class="modal-close" id="modal-close">&times;</button>
          <nav class="breadcrumbs modal-breadcrumbs" id="modal-breadcrumbs"></nav>
          <span class="modal-cat" id="modal-cat"></span>
          <h3 id="modal-name"></h3>
          <p class="modal-desc" id="modal-desc"></p>
          <div class="modal-price-row">
            <span class="modal-price" id="modal-price"></span>
            <span class="modal-price-was" id="modal-price-was"></span>
          </div>

          <p class="sold-out-msg" id="modal-soldout" style="display:none;">This item is currently sold out. Check back soon, or ask us about similar items on WhatsApp.</p>

          <div class="size-row" id="size-row">
            <span class="label">Select size</span>
            <div class="size-opts" id="size-opts"></div>
          </div>

          <div class="cta-row" id="modal-cta-row">
            <button class="btn btn-secondary" id="btn-add-to-cart">${typeof icon === "function" ? icon("cart") : "🛒"} Add to Cart</button>
          </div>
          <p class="or-divider" id="modal-or-divider">or order just this item now</p>
          <div class="cta-row" id="modal-single-row">
            <a class="btn btn-primary" id="btn-whatsapp" target="_blank" rel="noopener">Chat on WhatsApp</a>
            <a class="btn btn-secondary" id="btn-call">Call to order</a>
          </div>

          <p class="note-return">7-day return accepted on unsealed items. No online payment — orders are confirmed directly with our team by call or WhatsApp.</p>

          <div class="reviews-section">
            <h4>Ratings &amp; Reviews</h4>
            <div id="reviews-summary" class="reviews-summary"></div>
            <div id="reviews-list" class="reviews-list"></div>

            <details class="review-form-toggle">
              <summary>Write a review</summary>
              <form id="review-form" class="review-form">
                <div class="review-star-picker" id="review-star-picker">
                  <button type="button" data-star="1">★</button>
                  <button type="button" data-star="2">★</button>
                  <button type="button" data-star="3">★</button>
                  <button type="button" data-star="4">★</button>
                  <button type="button" data-star="5">★</button>
                </div>
                <input type="text" id="review-name" placeholder="Your name" maxlength="60" required>
                <textarea id="review-comment" placeholder="What did you think?" maxlength="600" required></textarea>
                <button type="submit" class="btn btn-secondary btn-small">Submit review</button>
                <p class="review-status" id="review-status"></p>
              </form>
            </details>
          </div>
        </div>
      </div>
    </div>`;
  document.body.appendChild(div.firstElementChild);

  document.getElementById("modal-close").addEventListener("click", closeProductModal);
  document.getElementById("modal-backdrop").addEventListener("click", (e) => {
    if (e.target.id === "modal-backdrop") closeProductModal();
  });

  document.getElementById("btn-add-to-cart").addEventListener("click", () => {
    addToCart(currentProductId, selectedSize, 1);
    const btn = document.getElementById("btn-add-to-cart");
    const original = btn.textContent;
    btn.textContent = "✓ Added to cart";
    setTimeout(() => (btn.textContent = original), 1400);
  });

  document.getElementById("review-star-picker").querySelectorAll("button").forEach((btn) => {
    btn.addEventListener("click", () => {
      selectedReviewStars = Number(btn.dataset.star);
      paintStarPicker();
    });
  });

  document.getElementById("review-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const statusEl = document.getElementById("review-status");
    const name = document.getElementById("review-name").value.trim();
    const comment = document.getElementById("review-comment").value.trim();
    if (!selectedReviewStars) {
      statusEl.textContent = "Please pick a star rating.";
      return;
    }
    if (!name || !comment) {
      statusEl.textContent = "Please fill in your name and a comment.";
      return;
    }
    statusEl.textContent = "Sending…";
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: currentProductId, name, rating: selectedReviewStars, comment }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not submit review");
      statusEl.textContent = data.message || "Thanks — your review will appear after approval.";
      document.getElementById("review-form").reset();
      selectedReviewStars = 0;
      paintStarPicker();
    } catch (err) {
      statusEl.textContent = "Could not send your review: " + err.message;
    }
  });
}

function paintStarPicker() {
  document.getElementById("review-star-picker").querySelectorAll("button").forEach((btn) => {
    btn.classList.toggle("selected", Number(btn.dataset.star) <= selectedReviewStars);
  });
}

async function loadReviewsForModal(productId) {
  const summaryEl = document.getElementById("reviews-summary");
  const listEl = document.getElementById("reviews-list");
  summaryEl.textContent = "Loading reviews…";
  listEl.innerHTML = "";
  try {
    const res = await fetch("/api/reviews?productId=" + encodeURIComponent(productId));
    const data = await res.json();
    if (data.summary.count > 0) {
      summaryEl.innerHTML = `${starString(data.summary.average)} <strong>${data.summary.average}</strong> out of 5 · ${data.summary.count} review${data.summary.count > 1 ? "s" : ""}`;
    } else {
      summaryEl.textContent = "No reviews yet — be the first to leave one.";
    }
    if (data.reviews.length === 0) {
      listEl.innerHTML = "";
    } else {
      listEl.innerHTML = data.reviews
        .map(
          (r) => `
        <div class="review-item">
          <div class="review-item-top">
            <span class="review-name">${escapeHTML(r.name)}</span>
            ${starString(r.rating)}
          </div>
          <p class="review-comment">${escapeHTML(r.comment)}</p>
        </div>`
        )
        .join("");
    }
  } catch (e) {
    summaryEl.textContent = "Could not load reviews right now.";
  }
}

function escapeHTML(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function openProductModal(id) {
  const p = PRODUCTS.find((x) => x.id === id);
  if (!p) return;
  ensureModalMounted();
  selectedSize = p.sizes ? p.sizes[0] : null;
  currentProductId = id;
  selectedReviewStars = 0;
  paintStarPicker();
  document.getElementById("review-form").reset();
  document.getElementById("review-status").textContent = "";
  loadReviewsForModal(id);
  trackRecentlyViewed(id);

  const cat = CATEGORIES.find((c) => c.id === p.category);
  document.getElementById("modal-breadcrumbs").innerHTML =
    `<a href="index.html">Home</a><span class="crumb-sep">/</span>` +
    (cat ? `<a href="products.html?category=${cat.id}">${cat.label}</a><span class="crumb-sep">/</span>` : "") +
    `<span>${escapeHTML(p.name)}</span>`;
  document.getElementById("modal-img").src = "assets/images/" + p.img;
  document.getElementById("modal-img").alt = p.name;
  document.getElementById("modal-cat").textContent = cat ? cat.label : "";
  document.getElementById("modal-name").textContent = p.name;
  document.getElementById("modal-desc").textContent = p.desc;
  document.getElementById("modal-price").textContent = formatPrice(p.price);

  const soldOut = p.inStock === false;
  const onSale = !soldOut && p.price < p.defaultPrice;
  document.getElementById("modal-price-was").textContent = onSale ? formatPrice(p.defaultPrice) : "";
  document.getElementById("modal-soldout").style.display = soldOut ? "block" : "none";
  document.getElementById("modal-cta-row").style.display = soldOut ? "none" : "flex";
  document.getElementById("modal-or-divider").style.display = soldOut ? "none" : "block";
  document.getElementById("modal-single-row").style.display = soldOut ? "none" : "flex";

  const sizeRow = document.getElementById("size-row");
  const sizeOpts = document.getElementById("size-opts");
  if (!soldOut && p.sizes && p.sizes.length) {
    sizeRow.style.display = "block";
    sizeOpts.innerHTML = p.sizes
      .map((s) => `<button data-size="${s}" class="${s === selectedSize ? "selected" : ""}">${s}</button>`)
      .join("");
    sizeOpts.querySelectorAll("button").forEach((btn) => {
      btn.addEventListener("click", () => {
        selectedSize = btn.dataset.size;
        sizeOpts.querySelectorAll("button").forEach((b) => b.classList.toggle("selected", b === btn));
        updateModalContactLinks(p);
      });
    });
  } else {
    sizeRow.style.display = "none";
  }

  updateModalContactLinks(p);
  document.getElementById("modal-backdrop").classList.remove("hidden");
}

function updateModalContactLinks(p) {
  const sizeText = selectedSize ? ` (Size: ${selectedSize})` : "";
  const message = `Hi ${STORE_CONFIG.storeName}, I'm interested in: ${p.name}${sizeText} — ${formatPrice(p.price)}. Is it available?`;
  document.getElementById("btn-whatsapp").href = waLink(message);
  document.getElementById("btn-call").href = telLink();
}

function closeProductModal() {
  const el = document.getElementById("modal-backdrop");
  if (el) el.classList.add("hidden");
}

// ---------- Recently viewed ----------
const RECENTLY_VIEWED_KEY = "dpg_recently_viewed";
const RECENTLY_VIEWED_MAX = 10;

function trackRecentlyViewed(productId) {
  let ids = getRecentlyViewedIds().filter((id) => id !== productId);
  ids.unshift(productId);
  ids = ids.slice(0, RECENTLY_VIEWED_MAX);
  localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(ids));
}

function getRecentlyViewedIds() {
  try {
    return JSON.parse(localStorage.getItem(RECENTLY_VIEWED_KEY) || "[]");
  } catch (e) {
    return [];
  }
}

function getRecentlyViewedProducts(excludeId, limit = 8) {
  return getRecentlyViewedIds()
    .filter((id) => id !== excludeId)
    .map((id) => PRODUCTS.find((p) => p.id === id))
    .filter(Boolean)
    .slice(0, limit);
}

// Show skeleton placeholders immediately (before data has loaded) in any
// known grid container, so the page never looks empty/broken while fetching.
document.addEventListener("DOMContentLoaded", () => {
  ["grid", "featured-grid", "new-grid", "offers-grid"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = skeletonCardsHTML(id === "grid" ? 8 : 4);
  });
});
