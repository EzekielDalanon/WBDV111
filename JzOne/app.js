const AUTH_KEY = "jzoneLoggedIn";
const ROLE_KEY = "jzoneRole";
const USER_EMAIL_KEY = "jzoneUserEmail";
const CART_KEY = "jzoneCart";
const CHECKOUT_KEY = "jzoneCheckout";

function isLoggedIn() {
    return localStorage.getItem(AUTH_KEY) === "true" && localStorage.getItem(ROLE_KEY) === "user";
}

function showMessage(message, onClose) {
    const existingModal = document.querySelector(".site-message");

    if (existingModal) {
        existingModal.remove();
    }

    const modal = document.createElement("div");
    modal.className = "site-message";
    modal.innerHTML = `
        <div class="site-message-box" role="alertdialog" aria-modal="true">
            <p>${message}</p>
            <button type="button" class="btn">OK</button>
        </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector("button").addEventListener("click", () => {
        modal.remove();

        if (onClose) {
            onClose();
        }
    });
}

function requireLogin() {
    if (!isLoggedIn()) {
        showMessage("Please login as user first and fill up your email before adding to cart or checkout.", () => {
            window.location.href = "login.html";
        });
        return false;
    }

    return true;
}

function setupProtectedPage() {
    if (document.querySelector("[data-protected-user-page]")) {
        requireLogin();
    }
}

function setupPublicOrderButtons() {
    document.querySelectorAll("[data-public-order-login]").forEach((button) => {
        button.addEventListener("click", (event) => {
            event.preventDefault();
            showMessage("Please login as user first before placing an order.", () => {
                window.location.href = "login.html";
            });
        });
    });
}

function getCart() {
    return JSON.parse(localStorage.getItem(CART_KEY) || "[]");
}

function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    localStorage.removeItem(CHECKOUT_KEY);
}

function formatPrice(price) {
    return "PHP " + Number(price).toLocaleString("en-PH");
}

function addToCart(item) {
    if (!requireLogin()) {
        return;
    }

    const cart = getCart();
    const existingItem = cart.find((cartItem) => cartItem.id === item.id);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ ...item, quantity: 1, selected: true });
    }

    saveCart(cart);
    renderCart();
    showMessage(item.name + " added to cart.");
}

function setupAuthForms() {
    const loginForm = document.querySelector("[data-login-form]");
    const signupForm = document.querySelector("[data-signup-form]");
    const logoutLink = document.querySelector("[data-logout]");

    if (loginForm) {
        loginForm.addEventListener("submit", (event) => {
            event.preventDefault();
            const email = loginForm.querySelector('input[type="email"]').value.trim();
            const password = loginForm.querySelector('input[type="password"]').value.trim();

            if (!email || !password) {
                showMessage("Please fill up your email and password.");
                return;
            }

            localStorage.setItem(AUTH_KEY, "true");
            localStorage.setItem(ROLE_KEY, "user");
            localStorage.setItem(USER_EMAIL_KEY, email);
            window.location.href = "user-account.html";
        });
    }

    if (signupForm) {
        signupForm.addEventListener("submit", (event) => {
            event.preventDefault();
            const email = signupForm.querySelector('input[type="email"]').value.trim();
            const password = signupForm.querySelector('input[type="password"]').value.trim();
            const confirmPassword = signupForm.querySelectorAll('input[type="password"]')[1].value.trim();

            if (!email || !password || !confirmPassword) {
                showMessage("Please fill up your email and password.");
                return;
            }

            if (password !== confirmPassword) {
                showMessage("Password and confirm password must match.");
                return;
            }

            localStorage.setItem(AUTH_KEY, "true");
            localStorage.setItem(ROLE_KEY, "user");
            localStorage.setItem(USER_EMAIL_KEY, email);
            window.location.href = "user-account.html";
        });
    }

    if (logoutLink) {
        logoutLink.addEventListener("click", () => {
            localStorage.removeItem(AUTH_KEY);
            localStorage.removeItem(ROLE_KEY);
            localStorage.removeItem(USER_EMAIL_KEY);
            localStorage.removeItem(CHECKOUT_KEY);
        });
    }
}

function setupAddToCartButtons() {
    document.querySelectorAll("[data-add-cart]").forEach((button) => {
        button.addEventListener("click", (event) => {
            event.preventDefault();
            addToCart({
                id: button.dataset.id,
                name: button.dataset.name,
                price: Number(button.dataset.price),
                category: button.dataset.category,
                description: button.dataset.description
            });
        });
    });
}

function renderCart() {
    const cartList = document.querySelector("[data-cart-list]");
    const cartSummary = document.querySelector("[data-cart-summary]");
    const checkoutButton = document.querySelector("[data-checkout-button]");
    const cartCount = document.querySelector("[data-cart-count]");

    if (!cartList || !cartSummary || !checkoutButton) {
        return;
    }

    if (!requireLogin()) {
        return;
    }

    const cart = getCart();
    const itemCount = cart.reduce((total, item) => total + item.quantity, 0);
    const selectedItems = cart.filter((item) => item.selected);
    const selectedTotal = selectedItems.reduce((total, item) => total + item.price * item.quantity, 0);

    if (cartCount) {
        cartCount.textContent = itemCount + (itemCount === 1 ? " item" : " items");
    }

    if (cart.length === 0) {
        cartList.innerHTML = '<p class="empty-message">Your cart is empty. Add products or services first.</p>';
        cartSummary.innerHTML = '<p class="empty-message">No items selected.</p>';
        checkoutButton.classList.add("disabled");
        checkoutButton.setAttribute("aria-disabled", "true");
        return;
    }

    cartList.innerHTML = cart.map((item) => `
        <div class="order-item cart-row">
            <label class="cart-select">
                <input type="checkbox" data-cart-select="${item.id}" ${item.selected ? "checked" : ""}>
                <span>
                    <strong>${item.name}</strong>
                    <small>Qty: ${item.quantity} | ${item.category}</small>
                </span>
            </label>
            <div class="cart-actions">
                <button type="button" class="qty-btn" data-cart-qty="${item.id}" data-change="-1">-</button>
                <span>${item.quantity}</span>
                <button type="button" class="qty-btn" data-cart-qty="${item.id}" data-change="1">+</button>
                <button type="button" class="remove-btn" data-cart-remove="${item.id}">Remove</button>
            </div>
            <div class="order-item-price">${formatPrice(item.price * item.quantity)}</div>
        </div>
    `).join("");

    cartSummary.innerHTML = selectedItems.length
        ? selectedItems.map((item) => `
            <div class="summary-line">
                <span>${item.name} x ${item.quantity}</span>
                <span>${formatPrice(item.price * item.quantity)}</span>
            </div>
        `).join("") + `
            <div class="total">
                <span>Total</span>
                <span>${formatPrice(selectedTotal)}</span>
            </div>
        `
        : '<p class="empty-message">Select at least one item to checkout.</p>';

    checkoutButton.classList.toggle("disabled", selectedItems.length === 0);
    checkoutButton.setAttribute("aria-disabled", selectedItems.length === 0 ? "true" : "false");
}

function setupCartControls() {
    const cartSection = document.querySelector("[data-cart-list]");
    const checkoutButton = document.querySelector("[data-checkout-button]");

    if (!cartSection || !checkoutButton) {
        return;
    }

    cartSection.addEventListener("change", (event) => {
        const checkbox = event.target.closest("[data-cart-select]");

        if (!checkbox) {
            return;
        }

        const cart = getCart().map((item) => item.id === checkbox.dataset.cartSelect
            ? { ...item, selected: checkbox.checked }
            : item
        );

        saveCart(cart);
        renderCart();
    });

    cartSection.addEventListener("click", (event) => {
        const quantityButton = event.target.closest("[data-cart-qty]");
        const removeButton = event.target.closest("[data-cart-remove]");
        let cart = getCart();

        if (quantityButton) {
            const change = Number(quantityButton.dataset.change);
            cart = cart.map((item) => item.id === quantityButton.dataset.cartQty
                ? { ...item, quantity: Math.max(1, item.quantity + change) }
                : item
            );
        }

        if (removeButton) {
            cart = cart.filter((item) => item.id !== removeButton.dataset.cartRemove);
        }

        saveCart(cart);
        renderCart();
    });

    checkoutButton.addEventListener("click", (event) => {
        event.preventDefault();

        if (!requireLogin()) {
            return;
        }

        const selectedItems = getCart().filter((item) => item.selected);

        if (selectedItems.length === 0) {
            showMessage("Please select at least one product or service to checkout.");
            return;
        }

        localStorage.setItem(CHECKOUT_KEY, JSON.stringify(selectedItems));
        window.location.href = "order.html";
    });
}

function renderOrderPage() {
    const orderList = document.querySelector("[data-order-list]");
    const orderSummary = document.querySelector("[data-order-summary]");
    const orderCount = document.querySelector("[data-order-count]");
    const orderForm = document.querySelector("[data-order-form]");

    if (!orderList || !orderSummary || !orderForm) {
        return;
    }

    if (!requireLogin()) {
        return;
    }

    const checkoutItems = JSON.parse(localStorage.getItem(CHECKOUT_KEY) || "[]");
    const items = checkoutItems.length ? checkoutItems : getCart().filter((item) => item.selected);
    const deliveryFee = items.length ? 80 : 0;
    const subtotal = items.reduce((total, item) => total + item.price * item.quantity, 0);

    if (orderCount) {
        orderCount.textContent = items.length + (items.length === 1 ? " item" : " items");
    }

    if (items.length === 0) {
        orderList.innerHTML = '<p class="empty-message">No selected items yet. Go to your cart and choose what to checkout.</p>';
        orderSummary.innerHTML = '<p class="empty-message">No order total available.</p>';
        orderForm.querySelector("button").disabled = true;
        return;
    }

    orderList.innerHTML = items.map((item) => `
        <div class="order-item">
            <div class="order-item-info">
                <h4>${item.name}</h4>
                <p>Qty: ${item.quantity} | ${item.category}</p>
            </div>
            <div class="order-item-price">${formatPrice(item.price * item.quantity)}</div>
        </div>
    `).join("");

    orderSummary.innerHTML = items.map((item) => `
        <div class="summary-line">
            <span>${item.name} x ${item.quantity}</span>
            <span>${formatPrice(item.price * item.quantity)}</span>
        </div>
    `).join("") + `
        <div class="summary-line muted">
            <span>Delivery Fee</span>
            <span>${formatPrice(deliveryFee)}</span>
        </div>
        <div class="total">
            <span>Total</span>
            <span>${formatPrice(subtotal + deliveryFee)}</span>
        </div>
    `;

    orderForm.addEventListener("submit", (event) => {
        event.preventDefault();
        const orderedIds = new Set(items.map((item) => item.id));
        const remainingCart = getCart().filter((item) => !orderedIds.has(item.id));

        saveCart(remainingCart);
        localStorage.removeItem(CHECKOUT_KEY);
        showMessage("Your order has been placed.", () => {
            window.location.href = "user-cart.html";
        });
    });
}

document.addEventListener("DOMContentLoaded", () => {
    setupAuthForms();
    setupProtectedPage();
    setupPublicOrderButtons();
    setupAddToCartButtons();
    renderCart();
    setupCartControls();
    renderOrderPage();
});
