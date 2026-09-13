const CATEGORY_TILE_IMG = {
  polos: "polo-08.jpg",
  shirts: "shirt-07.jpg",
  pullovers: "pullover-01.jpg",
  watches: "watch-01.jpg",
  sneakers: "sneaker-02.jpg",
  pants: "pants-01.jpg",
};

function renderCategoryGrid() {
  const el = document.getElementById("category-grid");
  el.innerHTML = CATEGORIES.map((c) => {
    const inCat = PRODUCTS.filter((p) => p.category === c.id);
    const count = inCat.length;
    const tileImg = CATEGORY_TILE_IMG[c.id] || (inCat[0] ? inCat[0].img : null);
    const imgHTML = tileImg
      ? `<img src="assets/images/${tileImg}" alt="${c.label}">`
      : `<span class="cat-tile-placeholder">${typeof icon === "function" ? icon("bag") : "🛍️"}</span>`;
    return `
      <a class="cat-tile reveal" href="products.html?category=${c.id}">
        <div class="cat-tile-img">${imgHTML}</div>
        <span class="cat-tile-label">${c.label}</span>
        <span class="cat-tile-count">${count} item${count === 1 ? "" : "s"}</span>
      </a>`;
  }).join("");
  if (typeof observeReveal === "function") observeReveal(".reveal", el);
}

function renderHomeSection(containerId, list, emptyMessage) {
  const el = document.getElementById(containerId);
  const section = el.closest("section");
  if (list.length === 0) {
    if (section) section.style.display = "none";
    return;
  }
  if (section) section.style.display = "";
  renderProductGrid(el, list);
}

function renderRecentlyViewedSection() {
  const section = document.getElementById("recently-viewed-section");
  const grid = document.getElementById("recently-viewed-grid");
  if (typeof getRecentlyViewedProducts !== "function") return;
  const items = getRecentlyViewedProducts(null, 8);
  if (items.length === 0) {
    section.style.display = "none";
    return;
  }
  section.style.display = "";
  renderProductGrid(grid, items);
  if (typeof observeReveal === "function") observeReveal(".reveal", grid);
}

async function initHome() {
  await initPage("home");

  const heroCountEl = document.getElementById("hero-count");
  const heroCatCountEl = document.getElementById("hero-cat-count");
  if (typeof animateCounterOnView === "function") {
    animateCounterOnView(heroCountEl, PRODUCTS.length);
    animateCounterOnView(heroCatCountEl, CATEGORIES.length);
  } else {
    heroCountEl.textContent = PRODUCTS.length;
    heroCatCountEl.textContent = CATEGORIES.length;
  }

  renderCategoryGrid();
  renderRecentlyViewedSection();

  const featured = PRODUCTS.filter((p) => p.featured && p.inStock !== false).slice(0, 8);
  const newArrivals = PRODUCTS.filter((p) => p.isNew && p.inStock !== false).slice(0, 8);
  const offers = PRODUCTS.filter((p) => p.inStock !== false && p.price < p.defaultPrice).slice(0, 8);

  renderHomeSection("featured-grid", featured);
  renderHomeSection("new-grid", newArrivals);
  renderHomeSection("offers-grid", offers);

  const waCta = document.getElementById("cta-whatsapp");
  if (waCta) waCta.href = waLink(`Hi ${STORE_CONFIG.storeName}, I'd like to hear about new arrivals and offers.`);

  if (typeof observeReveal === "function") observeReveal(".reveal");
  if (typeof init3DHero === "function") init3DHero();
}

document.addEventListener("DOMContentLoaded", initHome);
