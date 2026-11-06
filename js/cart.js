import { products, formatPrice } from "./products.js";
import { showToast } from "./animations.js";

const CART_STORAGE_KEY = "mr-sandalias-cart";
const WHATSAPP_PHONE = "+505 85557483";
let cart = loadCart();

function loadCart() {
    try {
        const savedCart = JSON.parse(localStorage.getItem(CART_STORAGE_KEY) || "[]");
        if (!Array.isArray(savedCart)) {
            return [];
        }

        return savedCart.filter((item) => {
            const product = products.find((entry) => entry.id === item.productId);
            return product
                && product.sizes.includes(Number(item.size))
                && Number.isInteger(item.quantity)
                && item.quantity > 0;
        }).map((item) => ({
            productId: item.productId,
            size: Number(item.size),
            quantity: item.quantity
        }));
    } catch (error) {
        console.warn("No se pudo recuperar el carrito guardado.", error);
        return [];
    }
}

function saveCart() {
    try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch (error) {
        console.warn("No se pudo guardar el carrito en este navegador.", error);
    }
}

export function renderCart() {
    const cartItems = document.getElementById("cart-items");
    const itemCount = cart.reduce((total, item) => total + item.quantity, 0);
    const total = cart.reduce((sum, item) => {
        const product = products.find((entry) => entry.id === item.productId);
        return sum + (product ? product.price * item.quantity : 0);
    }, 0);

    document.getElementById("cart-counter").textContent = String(itemCount);
    document.getElementById("cart-total").textContent = formatPrice(total);

    if (cart.length === 0) {
        cartItems.innerHTML = `
            <div class="flex h-full flex-col items-center justify-center text-center text-brand-600">
                <i class="fa-solid fa-bag-shopping mb-4 text-4xl text-brand-200"></i>
                <p class="font-medium">Tu carrito está vacío</p>
                <p class="mt-1 text-sm">Agrega tus modelos favoritos para verlos aquí.</p>
            </div>`;
        return;
    }

    cartItems.innerHTML = cart.map((item) => {
        const product = products.find((entry) => entry.id === item.productId);
        return `
            <article class="flex gap-4 border-b border-brand-100 pb-4">
                <img class="cart-image" src="${product.image}" alt="" loading="lazy">
                <div class="min-w-0 flex-1">
                    <div class="flex items-start justify-between gap-2">
                        <div>
                            <h3 class="font-semibold text-brand-800">${product.name}</h3>
                            <p class="text-sm text-brand-600">Talla ${item.size}</p>
                        </div>
                        <button
                            type="button"
                            onclick="removeFromCart('${item.productId}', ${item.size})"
                            class="text-brand-400 transition-colors hover:text-red-600"
                            aria-label="Quitar ${product.name}, talla ${item.size}"
                        >
                            <i class="fa-regular fa-trash-can"></i>
                        </button>
                    </div>
                    <div class="mt-3 flex items-center justify-between">
                        <div class="flex items-center gap-3">
                            <button type="button" onclick="changeQuantity('${item.productId}', ${item.size}, -1)" class="quantity-btn" aria-label="Reducir cantidad">
                                <i class="fa-solid fa-minus"></i>
                            </button>
                            <span class="min-w-4 text-center text-sm font-semibold">${item.quantity}</span>
                            <button type="button" onclick="changeQuantity('${item.productId}', ${item.size}, 1)" class="quantity-btn" aria-label="Aumentar cantidad">
                                <i class="fa-solid fa-plus"></i>
                            </button>
                        </div>
                        <span class="text-sm font-semibold text-brand-700">${formatPrice(product.price * item.quantity)}</span>
                    </div>
                </div>
            </article>`;
    }).join("");
}

export function addToCart(productId) {
    const product = products.find((entry) => entry.id === productId);
    const sizeSelect = document.getElementById(`size-${productId}`);
    const size = Number(sizeSelect.value);

    if (!product || !size) {
        showToast("Selecciona una talla antes de agregar el producto.");
        sizeSelect.focus();
        return;
    }

    const existingItem = cart.find((item) => item.productId === productId && item.size === size);
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ productId, size, quantity: 1 });
    }

    saveCart();
    renderCart();
    showToast(`${product.name}, talla ${size}, se agregó al carrito.`);
}

export function changeQuantity(productId, size, amount) {
    const item = cart.find((entry) => entry.productId === productId && entry.size === size);
    if (!item) {
        return;
    }

    item.quantity += amount;
    if (item.quantity <= 0) {
        cart = cart.filter((entry) => entry !== item);
    }

    saveCart();
    renderCart();
}

export function removeFromCart(productId, size) {
    cart = cart.filter((item) => item.productId !== productId || item.size !== size);
    saveCart();
    renderCart();
}

export function toggleCart() {
    const drawer = document.getElementById("cart-drawer");
    const overlay = document.getElementById("cart-overlay");
    const isOpening = drawer.classList.contains("translate-x-full");

    drawer.classList.toggle("translate-x-full", !isOpening);
    overlay.classList.toggle("hidden", !isOpening);
    overlay.classList.toggle("is-visible", isOpening);
    document.body.classList.toggle("overflow-hidden", isOpening);
    drawer.setAttribute("aria-hidden", String(!isOpening));
    overlay.setAttribute("aria-hidden", String(!isOpening));
}

export function checkoutWhatsApp() {
    if (cart.length === 0) {
        showToast("Agrega al menos un producto antes de finalizar tu pedido.");
        return;
    }

    const phone = WHATSAPP_PHONE.replace(/\D/g, "");
    if (!/^\d{10,15}$/.test(phone)) {
        showToast("Configura el número de WhatsApp de la tienda en app.js.");
        return;
    }

    const lines = cart.map((item) => {
        const product = products.find((entry) => entry.id === item.productId);
        const imageUrl = new URL(product.image, window.location.href).href;
        return `- ${product.name} | Talla ${item.size} | Cantidad: ${item.quantity} | ${formatPrice(product.price * item.quantity)}\nFoto: ${imageUrl}`;
    });
    const total = cart.reduce((sum, item) => {
        const product = products.find((entry) => entry.id === item.productId);
        return sum + product.price * item.quantity;
    }, 0);
    const message = [
        "Hola, quiero realizar este pedido:",
        "",
        ...lines,
        "",
        `Total: ${formatPrice(total)}`
    ].join("\n");

    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
}
