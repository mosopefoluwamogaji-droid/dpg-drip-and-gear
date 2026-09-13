// Shared across all pages: loads store config + catalog once, renders the
// header/footer, and exposes helpers other page scripts build on.

let STORE_CONFIG = {};
let CATEGORIES = [];
let PRODUCTS = [];

async function loadStoreData() {
  const [configRes, productsRes] = await Promise.all([
    fetch("/api/config"),
    fetch("/api/products"),
  ]);
  STORE_CONFIG = await configRes.json();
  const data = await productsRes.json();
  CATEGORIES = data.categories;
  PRODUCTS = data.products;
}

function formatPrice(n) {
  return (STORE_CONFIG.currency || "₦") + Number(n).toLocaleString("en-NG");
}

function waLink(message) {
  return `https://wa.me/${STORE_CONFIG.whatsappNumber}?text=${encodeURIComponent(message)}`;
}
function telLink() {
  return `tel:${(STORE_CONFIG.phoneNumber || "").replace(/\s+/g, "")}`;
}
function mailLink(subject) {
  return `mailto:${STORE_CONFIG.email}${subject ? "?subject=" + encodeURIComponent(subject) : ""}`;
}

function renderHeader(activePage) {
  const el = document.getElementById("site-header");
  if (!el) return;
  const catLinks = CATEGORIES.map(
    (c) => `<a href="products.html?category=${c.id}">${c.label}</a>`
  ).join("");

  const navLinksHTML = `
    <a href="index.html" class="${activePage === "home" ? "active" : ""}">Home</a>
    <a href="products.html" class="${activePage === "products" ? "active" : ""}">Products</a>
    <a href="about.html" class="${activePage === "about" ? "active" : ""}">About</a>
    <a href="contact.html" class="${activePage === "contact" ? "active" : ""}">Contact</a>`;

  el.innerHTML = `
    <div class="topbar">
      <div class="topbar-inner">
        <span>Order by WhatsApp or call — nationwide delivery</span>
        <span class="topbar-contact"><a href="${telLink()}">${STORE_CONFIG.phoneNumber || ""}</a></span>
      </div>
    </div>
    <header class="site-header">
      <div class="header-inner">
        <a class="brand" href="index.html"><img src="assets/brand/logo-header.png" alt="${STORE_CONFIG.storeName || "DPG"}"></a>
        <nav class="main-nav">${navLinksHTML}</nav>
        <button class="cart-icon-btn" id="cart-icon-btn" aria-label="Cart">
          ${typeof icon === "function" ? icon("cart") : "🛒"}<span class="cart-count-badge" id="cart-count-badge"></span>
        </button>
        <button class="nav-toggle" id="nav-toggle" aria-label="Menu" aria-expanded="false">
          <span></span><span></span><span></span>
        </button>
        <a class="btn btn-primary btn-small header-wa" href="${waLink("Hi " + (STORE_CONFIG.storeName || "") + ", I have a question about your products.")}" target="_blank" rel="noopener">Chat on WhatsApp</a>
      </div>
      <nav class="cat-strip">${catLinks}</nav>
      <nav class="mobile-nav" id="mobile-nav">
        ${navLinksHTML}
        <a class="btn btn-primary btn-small" href="${waLink("Hi " + (STORE_CONFIG.storeName || "") + ", I have a question about your products.")}" target="_blank" rel="noopener">Chat on WhatsApp</a>
      </nav>
    </header>`;

  const toggle = document.getElementById("nav-toggle");
  const mobileNav = document.getElementById("mobile-nav");
  toggle.addEventListener("click", () => {
    const isOpen = mobileNav.classList.toggle("open");
    toggle.classList.toggle("open", isOpen);
    toggle.setAttribute("aria-expanded", String(isOpen));
  });

  const cartBtn = document.getElementById("cart-icon-btn");
  if (cartBtn && typeof openCartDrawer === "function") {
    cartBtn.addEventListener("click", openCartDrawer);
  }
  if (typeof renderCartBadge === "function") renderCartBadge();
}

function renderFooter() {
  const el = document.getElementById("site-footer");
  if (!el) return;
  el.innerHTML = `
    <footer class="site-footer">
      <div class="footer-inner">
        <div class="footer-brand">
          <strong>${STORE_CONFIG.storeName || ""}</strong>
          <p>${STORE_CONFIG.deliveryNote || ""} ${STORE_CONFIG.returnPolicy || ""}</p>
        </div>
        <div class="footer-col">
          <h4>Shop</h4>
          <a href="products.html">All Products</a>
          ${CATEGORIES.map((c) => `<a href="products.html?category=${c.id}">${c.label}</a>`).join("")}
        </div>
        <div class="footer-col">
          <h4>Company</h4>
          <a href="about.html">About Us</a>
          <a href="contact.html">Contact</a>
        </div>
        <div class="footer-col">
          <h4>Reach us</h4>
          <a href="${telLink()}">${STORE_CONFIG.phoneNumber || ""}</a>
          <a href="${mailLink()}">${STORE_CONFIG.email || ""}</a>
          <a href="${waLink("Hi " + (STORE_CONFIG.storeName || "") + "!")}" target="_blank" rel="noopener">WhatsApp us</a>
        </div>
      </div>
      <div class="footer-bottom">© ${new Date().getFullYear()} ${STORE_CONFIG.storeName || ""}. All rights reserved.</div>
    </footer>`;
}

async function initPage(activePage) {
  try {
    await loadStoreData();
  } catch (e) {
    document.body.innerHTML = '<p style="padding:40px;font-family:sans-serif;">Could not load the store. Please refresh the page.</p>';
    throw e;
  }
  renderHeader(activePage);
  renderFooter();
  initBackToTop();
}

function initBackToTop() {
  if (document.getElementById("back-to-top-btn")) return;
  const btn = document.createElement("button");
  btn.id = "back-to-top-btn";
  btn.className = "back-to-top";
  btn.setAttribute("aria-label", "Back to top");
  btn.innerHTML = typeof icon === "function" ? icon("arrowUp") : "↑";
  document.body.appendChild(btn);

  const toggleVisible = () => {
    btn.classList.toggle("visible", window.scrollY > 480);
  };
  window.addEventListener("scroll", toggleVisible, { passive: true });
  toggleVisible();

  btn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}
