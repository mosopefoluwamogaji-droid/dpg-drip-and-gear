// Shared cart, used across every page. Cart lives in the browser (localStorage)
// since there's no user-account/checkout backend — it exists purely to let a
// customer collect several items and send them to WhatsApp as one message.

const CART_KEY = "dpg_cart";

function getCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY) || "[]");
  } catch (e) {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  renderCartBadge();
}

function addToCart(productId, size, qty = 1) {
  const cart = getCart();
  const existing = cart.find((line) => line.productId === productId && line.size === (size || null));
  if (existing) {
    existing.qty += qty;
  } else {
    cart.push({ productId, size: size || null, qty });
  }
  saveCart(cart);
}

function updateCartQty(index, qty) {
  const cart = getCart();
  if (!cart[index]) return;
  if (qty <= 0) {
    cart.splice(index, 1);
  } else {
    cart[index].qty = qty;
  }
  saveCart(cart);
  renderCartDrawerContents();
}

function removeCartLine(index) {
  const cart = getCart();
  cart.splice(index, 1);
  saveCart(cart);
  renderCartDrawerContents();
}

function clearCart() {
  saveCart([]);
  renderCartDrawerContents();
}

function cartCount() {
  return getCart().reduce((sum, line) => sum + line.qty, 0);
}

function cartLinesWithProducts() {
  const cart = getCart();
  return cart
    .map((line, index) => {
      const product = PRODUCTS.find((p) => p.id === line.productId);
      return product ? { ...line, index, product } : null;
    })
    .filter(Boolean);
}

function cartTotal() {
  return cartLinesWithProducts().reduce((sum, l) => sum + l.product.price * l.qty, 0);
}

function renderCartBadge() {
  const badge = document.getElementById("cart-count-badge");
  if (!badge) return;
  const count = cartCount();
  badge.textContent = count;
  badge.style.display = count > 0 ? "flex" : "none";
}

function ensureCartDrawerMounted() {
  if (document.getElementById("cart-drawer")) return;
  const div = document.createElement("div");
  div.innerHTML = `
    <div class="cart-backdrop hidden" id="cart-backdrop">
      <aside class="cart-drawer" id="cart-drawer">
        <div class="cart-drawer-head">
          <h3>Your picks</h3>
          <button class="modal-close" id="cart-close">&times;</button>
        </div>
        <div class="cart-drawer-body" id="cart-drawer-body"></div>
        <div class="cart-drawer-foot" id="cart-drawer-foot"></div>
      </aside>
    </div>`;
  document.body.appendChild(div.firstElementChild);

  document.getElementById("cart-close").addEventListener("click", closeCartDrawer);
  document.getElementById("cart-backdrop").addEventListener("click", (e) => {
    if (e.target.id === "cart-backdrop") closeCartDrawer();
  });
}

function renderCartDrawerContents() {
  const body = document.getElementById("cart-drawer-body");
  const foot = document.getElementById("cart-drawer-foot");
  if (!body || !foot) return;

  const lines = cartLinesWithProducts();

  if (lines.length === 0) {
    body.innerHTML = '<p class="cart-empty">Your cart is empty. Add a few items to check out together.</p>';
    foot.innerHTML = "";
    return;
  }

  body.innerHTML = lines
    .map(
      (l) => `
      <div class="cart-line" data-index="${l.index}">
        <img src="assets/images/${l.product.img}" alt="${l.product.name}">
        <div class="cart-line-info">
          <span class="cart-line-name">${l.product.name}</span>
          ${l.size ? `<span class="cart-line-size">Size: ${l.size}</span>` : ""}
          <span class="cart-line-price">${formatPrice(l.product.price)}</span>
          <div class="cart-qty">
            <button data-action="dec">−</button>
            <span>${l.qty}</span>
            <button data-action="inc">+</button>
          </div>
        </div>
        <button class="cart-remove" data-action="remove" title="Remove">&times;</button>
      </div>`
    )
    .join("");

  const total = cartTotal();
  const message = buildCartWhatsAppMessage(lines, total);
  foot.innerHTML = `
    <div class="cart-total-row"><span>Total</span><strong>${formatPrice(total)}</strong></div>
    <a class="btn btn-primary cart-checkout-btn" href="${waLink(message)}" target="_blank" rel="noopener">Checkout via WhatsApp</a>
    <button class="cart-clear-btn" id="cart-clear-btn">Clear cart</button>`;

  body.querySelectorAll(".cart-line").forEach((lineEl) => {
    const index = Number(lineEl.dataset.index);
    const line = lines.find((l) => l.index === index);
    lineEl.querySelectorAll("button").forEach((btn) => {
      btn.addEventListener("click", () => {
        const action = btn.dataset.action;
        if (action === "inc") updateCartQty(index, line.qty + 1);
        if (action === "dec") updateCartQty(index, line.qty - 1);
        if (action === "remove") removeCartLine(index);
      });
    });
  });

  const clearBtn = document.getElementById("cart-clear-btn");
  if (clearBtn) clearBtn.addEventListener("click", clearCart);
}

function buildCartWhatsAppMessage(lines, total) {
  const itemLines = lines
    .map((l, i) => {
      const sizeText = l.size ? `, Size: ${l.size}` : "";
      return `${i + 1}. ${l.product.name}${sizeText} × ${l.qty} — ${formatPrice(l.product.price * l.qty)}`;
    })
    .join("\n");
  return `Hi ${STORE_CONFIG.storeName}, I'd like to order:\n\n${itemLines}\n\nTotal: ${formatPrice(total)}\n\nPlease confirm availability.`;
}

function openCartDrawer() {
  ensureCartDrawerMounted();
  renderCartDrawerContents();
  document.getElementById("cart-backdrop").classList.remove("hidden");
}

function closeCartDrawer() {
  const el = document.getElementById("cart-backdrop");
  if (el) el.classList.add("hidden");
}
