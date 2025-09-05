// Cart functionality with Rs currency
"use strict";

let cart = [];
let cartCount = 0;

// ----- Helpers -----
function formatINR(amount) {
  return `${(Math.round(amount * 100) / 100).toFixed(2)}`;
}

function moneyToNumber(text) {
  if (!text) return 0;
  const cleaned = String(text).replace(/[^\d.]/g, "");
  const num = parseFloat(cleaned);
  return Number.isFinite(num) ? num : 0;
}

function recalcCartCount() {
  cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
}

// ----- DOM Ready -----
document.addEventListener("DOMContentLoaded", function () {
  updateCartCount();
  setupAddToCartListeners();
  removeOldOnclickHandlers();
  setupCartEventDelegation();
});

// Remove old inline onclick handlers
function removeOldOnclickHandlers() {
  document.querySelectorAll(".add-to-cart").forEach((button) => {
    button.removeAttribute("onclick");
  });
}

// Set up event listeners for Add to Cart buttons
function setupAddToCartListeners() {
  document.querySelectorAll(".add-to-cart").forEach((button) => {
    button.addEventListener("click", function (e) {
      e.preventDefault();

      const productCard = this.closest(".product-card");
      if (!productCard) return;

      // Get product id, fallback to timestamp if missing
      let productId = parseInt(productCard.dataset.productId, 10);
      if (!Number.isFinite(productId)) {
        productId = Date.now(); // fallback unique id
      }

      const productName =
        productCard.querySelector("h3")?.textContent?.trim() || "Product";

      // Prefer data-price else parse from price text
      let productPrice = 0;
      if (productCard.dataset.price) {
        productPrice = parseFloat(productCard.dataset.price);
      } else {
        const priceText =
          productCard.querySelector(".price")?.textContent || "";
        productPrice = moneyToNumber(priceText);
      }

      const productImage = productCard.querySelector("img")?.src || "";

      if (!Number.isFinite(productPrice) || productPrice <= 0) {
        showNotification("Invalid product price");
        return;
      }

      addToCart(productId, productName, productPrice, productImage);
    });
  });
}

// Event delegation for cart actions
function setupCartEventDelegation() {
  document.addEventListener("click", function (e) {
    const removeBtn = e.target.closest(".remove-item");
    if (removeBtn) {
      e.preventDefault();
      const itemId = parseInt(removeBtn.dataset.id, 10);
      if (Number.isFinite(itemId)) removeFromCart(itemId);
      return;
    }

    const qtyBtn = e.target.closest(".quantity-btn");
    if (qtyBtn) {
      e.preventDefault();
      const itemId = parseInt(qtyBtn.dataset.id, 10);
      const action = qtyBtn.dataset.action;
      if (!Number.isFinite(itemId)) return;

      if (action === "increase") {
        changeQuantity(itemId, 1);
      } else if (action === "decrease") {
        changeQuantity(itemId, -1);
      }
      return;
    }
  });

  // Quantity input
  document.addEventListener("change", handleQuantityInput);
  document.addEventListener("input", handleQuantityInput);

  function handleQuantityInput(e) {
    const input = e.target;
    if (!input.classList.contains("quantity-input")) return;

    const itemId = parseInt(input.dataset.id, 10);
    let newQuantity = parseInt(input.value, 10);
    if (!Number.isFinite(newQuantity) || newQuantity < 1) {
      newQuantity = 1;
      input.value = "1";
    }
    updateQuantity(itemId, newQuantity);
  }
}

// Show a page section
function showPage(pageId) {
  document.querySelectorAll(".page-section").forEach((page) => {
    page.classList.remove("active");
  });

  document.getElementById(pageId)?.classList.add("active");

  if (pageId === "cart") updateCartDisplay();
  if (pageId === "checkout") updateCheckoutDisplay();

  window.scrollTo(0, 0);
}

// ----- Cart Ops -----
function addToCart(id, name, price, image) {
  const existingItem = cart.find((item) => item.id === id);

  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({ id, name, price, image, quantity: 1 });
  }

  recalcCartCount();
  updateCartCount();
  updateCartDisplay();
  updateCheckoutDisplay();

  showNotification(`${name} added to cart!`);
  setTimeout(() => showPage("cart"), 300);
}

function updateCartCount() {
  recalcCartCount();
  const cartCountElement = document.querySelector(".cart-count");
  if (cartCountElement) {
    cartCountElement.textContent = String(cartCount);
  }
}

function updateCartDisplay() {
  const cartItemsElement = document.getElementById("cart-items");
  const cartTotalElement = document.getElementById("cart-total");
  if (!cartItemsElement || !cartTotalElement) return;

  if (cart.length === 0) {
    cartItemsElement.innerHTML =
      '<p class="empty-cart-message">Your cart is empty</p>';
    cartTotalElement.textContent = formatINR(0);
    return;
  }

  let cartHTML = "";
  let total = 0;

  cart.forEach((item) => {
    const itemTotal = item.price * item.quantity;
    total += itemTotal;

    cartHTML += `
      <div class="cart-item" data-item-id="${item.id}">
        <img src="${item.image}" alt="${item.name}">
        <div class="item-details">
          <h3>${item.name}</h3>
          <span class="item-price">${formatINR(item.price)}</span>
        </div>
        <div class="item-quantity">
          <button type="button" class="quantity-btn" data-action="decrease" data-id="${item.id}">-</button>
          <input type="number" class="quantity-input" value="${item.quantity}" min="1" data-id="${item.id}">
          <button type="button" class="quantity-btn" data-action="increase" data-id="${item.id}">+</button>
        </div>
        <button type="button" class="remove-item" data-id="${item.id}"><i class="fas fa-trash"></i></button>
      </div>`;
  });

  cartItemsElement.innerHTML = cartHTML;
  cartTotalElement.textContent = formatINR(total);
}

function updateCheckoutDisplay() {
  const checkoutItemsElement = document.getElementById("checkout-items");
  const checkoutTotalElement = document.getElementById("checkout-total");
  if (!checkoutItemsElement || !checkoutTotalElement) return;

  if (cart.length === 0) {
    checkoutItemsElement.innerHTML = "<p>Your cart is empty</p>";
    checkoutTotalElement.textContent = formatINR(0);
    return;
  }

  let checkoutHTML = "";
  let total = 0;

  cart.forEach((item) => {
    const itemTotal = item.price * item.quantity;
    total += itemTotal;
    checkoutHTML += `<div class="summary-item"><span>${item.name} x${item.quantity}</span><span>${formatINR(itemTotal)}</span></div>`;
  });

  checkoutItemsElement.innerHTML = checkoutHTML;
  checkoutTotalElement.textContent = formatINR(total);
}

function changeQuantity(id, delta) {
  const item = cart.find((i) => i.id === id);
  if (!item) return;

  item.quantity = Math.max(1, item.quantity + delta);

  recalcCartCount();
  updateCartCount();
  updateCartDisplay();
  updateCheckoutDisplay();
}

function updateQuantity(id, quantity) {
  const item = cart.find((i) => i.id === id);
  if (!item) return;

  item.quantity = Math.max(1, quantity);

  recalcCartCount();
  updateCartCount();
  updateCartDisplay();
  updateCheckoutDisplay();
}

function removeFromCart(id) {
  const index = cart.findIndex((i) => i.id === id);
  if (index === -1) return;

  const removed = cart[index];
  cart.splice(index, 1);

  recalcCartCount();
  updateCartCount();
  updateCartDisplay();
  updateCheckoutDisplay();

  showNotification(`${removed.name} removed from cart!`);
}

// Place order
function placeOrder() {
  const name = document.getElementById("name")?.value?.trim();
  const email = document.getElementById("email")?.value?.trim();
  const address = document.getElementById("address")?.value?.trim();
  const cardNumber = document.getElementById("card-number")?.value?.trim();

  if (!name || !email || !address || !cardNumber) {
    showNotification("Please fill in all required fields");
    return;
  }

  if (cart.length === 0) {
    showNotification("Your cart is empty");
    return;
  }

  showNotification("Order placed successfully!");
  cart = [];
  recalcCartCount();
  updateCartCount();
  showPage("confirmation");
}

// Show notification
function showNotification(message) {
  document.querySelectorAll(".notification").forEach((n) => n.remove());

  const notification = document.createElement("div");
  notification.className = "notification";
  notification.textContent = message;
  document.body.appendChild(notification);

  requestAnimationFrame(() => notification.classList.add("show"));

  setTimeout(() => {
    notification.classList.remove("show");
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}
