let activeCategory = "all";
let searchTerm = "";

function getCategoryFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get("category") || "all";
}

function renderCatFilters() {
  const nav = document.getElementById("cat-filters");
  const allBtn = `<button data-cat="all" class="${activeCategory === "all" ? "active" : ""}">All</button>`;
  const catBtns = CATEGORIES.map(
    (c) => `<button data-cat="${c.id}" class="${activeCategory === c.id ? "active" : ""}">${c.label}</button>`
  ).join("");
  nav.innerHTML = allBtn + catBtns;
  nav.querySelectorAll("button").forEach((btn) => {
    btn.addEventListener("click", () => {
      activeCategory = btn.dataset.cat;
      const url = new URL(window.location);
      if (activeCategory === "all") url.searchParams.delete("category");
      else url.searchParams.set("category", activeCategory);
      window.history.replaceState({}, "", url);
      renderCatFilters();
      renderBreadcrumbs();
      applyFilters();
    });
  });
}

function renderBreadcrumbs() {
  const el = document.getElementById("page-breadcrumbs");
  if (!el) return;
  const cat = CATEGORIES.find((c) => c.id === activeCategory);
  const parts = [`<a href="index.html">Home</a>`, `<a href="products.html">Products</a>`];
  if (cat) parts.push(`<span>${cat.label}</span>`);
  el.innerHTML = parts.join('<span class="crumb-sep">/</span>');
}

function applyFilters() {
  let list = activeCategory === "all" ? PRODUCTS : PRODUCTS.filter((p) => p.category === activeCategory);
  if (searchTerm.trim()) {
    const q = searchTerm.trim().toLowerCase();
    list = list.filter((p) => p.name.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q));
  }
  document.getElementById("result-count").textContent = list.length + " items";
  const grid = document.getElementById("grid");
  if (list.length === 0) {
    grid.innerHTML = '<p class="empty-msg">No items match your search.</p>';
    return;
  }
  renderProductGrid(grid, list);
  if (typeof observeReveal === "function") observeReveal(".reveal", grid);
}

async function initProducts() {
  await initPage("products");
  activeCategory = getCategoryFromURL();
  renderCatFilters();
  renderBreadcrumbs();
  applyFilters();

  document.getElementById("search-input").addEventListener("input", (e) => {
    searchTerm = e.target.value;
    applyFilters();
  });
}

document.addEventListener("DOMContentLoaded", initProducts);
