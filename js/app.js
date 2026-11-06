const products = [
    {
        id: "floral",
        name: "Floral",
        category: "Elegante",
        price: 300,
        sizes: [35, 36, 37, 38, 39],
        description: "Sandalia blanca con delicado detalle floral.",
        image: "images/sandalia-floral.png"
    },
    {
        id: "negra",
        name: "Clásica Negra",
        category: "Casual",
        price: 300,
        sizes: [35, 36, 37, 38, 39],
        description: "Sandalia negra con banda fruncida y estilo moderno.",
        image: "images/sandalia-negra.png"
    },
    {
        id: "sandalias-casuales",
        name: "Sandalias casuales",
        category: "Casual",
        price: 280,
        sizes: [35, 36, 37, 38, 39],
        description: "Sandalias azules casuales, cómodas y elegantes.",
        image: "images/sandalias-casuales.png"
    },
    {
        id: "mono-cafe",
        name: "Moño Café",
        category: "Elegante",
        price: 200,
        sizes: [35, 36, 37, 38, 39],
        description: "Sandalia café con moño decorativo y plantilla floral.",
        image: "images/sandalia-mono-cafe.png"
    },
    {
        id: "trenzada-morada",
        name: "Trenzada Morada",
        category: "Casual",
        price: 180,
        sizes: [35, 36, 37, 38, 39],
        description: "Sandalia casual con banda trenzada color morado.",
        image: "images/sandalia-trenzada-morada.png"
    },
    {
        id: "azul-flecos",
        name: "Azul con Flecos",
        category: "Casual",
        price: 180,
        sizes: [35, 36, 37, 38, 39],
        description: "Sandalia azul con flecos y detalles decorativos.",
        image: "images/sandalia-azul-flecos.png"
    }
];

const CART_STORAGE_KEY = "mr-sandalias-cart";
const FAVORITES_STORAGE_KEY = "mr-sandalias-favorites";
const WHATSAPP_PHONE = "+505 85557483";
const currencyFormatter = new Intl.NumberFormat("es-NI", {
    style: "currency",
    currency: "NIO",
    currencyDisplay: "narrowSymbol"
});

let activeCategory = "todos";
let cart = loadCart();
let favoriteIds = loadFavorites();
let toastTimeout;

function loadFavorites() {
    try {
        const savedFavorites = JSON.parse(localStorage.getItem(FAVORITES_STORAGE_KEY) || "[]");
        if (!Array.isArray(savedFavorites)) {
            return [];
        }

        return [...new Set(savedFavorites.filter((id) => products.some((product) => product.id === id)))];
    } catch (error) {
        console.warn("No se pudieron recuperar los favoritos guardados.", error);
        return [];
    }
}

function saveFavorites() {
    try {
        localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favoriteIds));
        return true;
    } catch (error) {
        console.warn("No se pudieron guardar los favoritos en este navegador.", error);
        showToast("No se pudieron guardar tus favoritos en este navegador.");
        return false;
    }
}

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

function formatPrice(price) {
    return currencyFormatter.format(price);
}

function renderProducts(filteredProducts = products) {
    const grid = document.getElementById("product-grid");

    if (filteredProducts.length === 0) {
        grid.innerHTML = `
            <p class="col-span-full py-12 text-center text-brand-600">
                No encontramos sandalias con esos filtros. Prueba con otra búsqueda.
            </p>`;
        return;
    }

    grid.innerHTML = filteredProducts.map((product, index) => {
        const isFavorite = favoriteIds.includes(product.id);
        return `
        <article class="product-card overflow-hidden rounded-2xl border border-brand-100 bg-white shadow-sm" style="--card-index: ${Math.min(index, 6)}">
            <div class="product-image-wrap">
                <img
                    class="product-image"
                    src="${product.image}"
                    alt="Sandalia ${product.name}"
                    loading="lazy"
                >
                <span class="product-category">${product.category}</span>
                <button
                    type="button"
                    class="favorite-btn${isFavorite ? " is-favorite" : ""}"
                    data-product-id="${product.id}"
                    onclick="toggleFavorite('${product.id}')"
                    aria-label="${isFavorite ? "Quitar de" : "Agregar a"} favoritos: ${product.name}"
                    aria-pressed="${isFavorite}"
                    title="${isFavorite ? "Quitar de" : "Agregar a"} favoritos"
                >
                    <i class="fa-${isFavorite ? "solid" : "regular"} fa-heart" aria-hidden="true"></i>
                </button>
            </div>
            <div class="p-5">
                <div class="mb-2 flex items-start justify-between gap-3">
                    <h2 class="font-serif text-xl font-bold text-brand-800">${product.name}</h2>
                    <span class="whitespace-nowrap font-semibold text-brand-600">${formatPrice(product.price)}</span>
                </div>
                <p class="mb-5 min-h-10 text-sm leading-5 text-brand-600">${product.description}</p>
                <label class="mb-3 block text-sm font-medium text-brand-700" for="size-${product.id}">
                    Selecciona tu talla
                </label>
                <div class="flex gap-2">
                    <select id="size-${product.id}" class="product-size min-w-0 flex-1 rounded-lg border border-brand-200 bg-white px-3 py-2 text-sm text-brand-800">
                        <option value="">Talla</option>
                        ${product.sizes.map((size) => `<option value="${size}">${size}</option>`).join("")}
                    </select>
                    <button
                        type="button"
                        onclick="addToCart('${product.id}')"
                        class="add-to-cart rounded-lg bg-brand-800 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-600"
                    >
                        Agregar
                    </button>
                </div>
            </div>
        </article>
    `;
    }).join("");
}

function filterProducts() {
    const searchTerm = document.getElementById("search-input").value.trim().toLocaleLowerCase("es");
    const selectedSize = document.getElementById("size-filter").value;
    const filteredProducts = products.filter((product) => {
        const matchesCategory = activeCategory === "todos"
            || (activeCategory === "favoritos"
                ? favoriteIds.includes(product.id)
                : product.category === activeCategory);
        const matchesSearch = `${product.name} ${product.category} ${product.description}`
            .toLocaleLowerCase("es")
            .includes(searchTerm);
        const matchesSize = selectedSize === "todos" || product.sizes.includes(Number(selectedSize));
        return matchesCategory && matchesSearch && matchesSize;
    });

    renderProducts(filteredProducts);
}

function filterCategory(category) {
    activeCategory = category;
    document.querySelectorAll(".cat-btn").forEach((button) => {
        const isSelected = button.getAttribute("onclick") === `filterCategory('${category}')`;
        button.classList.toggle("cat-btn-active", isSelected);
        button.setAttribute("aria-pressed", String(isSelected));
    });
    filterProducts();
}

function toggleFavorite(productId) {
    const isFavorite = favoriteIds.includes(productId);
    favoriteIds = isFavorite
        ? favoriteIds.filter((id) => id !== productId)
        : [...favoriteIds, productId];
    saveFavorites();
    filterProducts();

    if (!isFavorite) {
        const favoriteButton = document.querySelector(`.favorite-btn[data-product-id="${productId}"]`);
        if (favoriteButton) {
            favoriteButton.classList.add("is-animating");
            favoriteButton.addEventListener("animationend", () => {
                favoriteButton.classList.remove("is-animating");
            }, { once: true });
        }
    }
}

function addToCart(productId) {
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

function changeQuantity(productId, size, amount) {
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

function removeFromCart(productId, size) {
    cart = cart.filter((item) => item.productId !== productId || item.size !== size);
    saveCart();
    renderCart();
}

function renderCart() {
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

function toggleCart() {
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

function checkoutWhatsApp() {
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

function showToast(message) {
    let toast = document.getElementById("store-toast");
    if (!toast) {
        toast = document.createElement("div");
        toast.id = "store-toast";
        toast.className = "store-toast";
        toast.setAttribute("role", "status");
        toast.setAttribute("aria-live", "polite");
        document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.classList.add("is-visible");
    window.clearTimeout(toastTimeout);
    toastTimeout = window.setTimeout(() => toast.classList.remove("is-visible"), 3200);
}

function setupStoreSharing() {
    const shareUrl = new URL(window.location.href);
    shareUrl.search = "";
    shareUrl.hash = "catalogo";

    document.getElementById("share-whatsapp").href =
        `https://wa.me/?text=${encodeURIComponent(`Mira la tienda M/R Sandalias: ${shareUrl.href}`)}`;
    document.getElementById("share-facebook").href =
        `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl.href)}`;

    document.getElementById("copy-store-link").addEventListener("click", async () => {
        try {
            await navigator.clipboard.writeText(shareUrl.href);
            document.querySelector(".share-menu").open = false;
            showToast("Enlace de la tienda copiado.");
        } catch (error) {
            console.warn("No se pudo copiar el enlace de la tienda.", error);
            showToast("No se pudo copiar. Prueba compartir por WhatsApp o Facebook.");
        }
    });
}

window.toggleCart = toggleCart;
window.filterProducts = filterProducts;
window.filterCategory = filterCategory;
window.toggleFavorite = toggleFavorite;
window.addToCart = addToCart;
window.changeQuantity = changeQuantity;
window.removeFromCart = removeFromCart;
window.checkoutWhatsApp = checkoutWhatsApp;

function showCatalog() {
    document.body.classList.remove("landing-view");
}

document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (event) => {
        const targetId = link.getAttribute("href").slice(1);
        if (targetId === "inicio") {
            document.body.classList.add("landing-view");
            window.scrollTo({ top: 0, behavior: "smooth" });
            return;
        }

        if (["catalogo", "nosotros", "contacto"].includes(targetId)) {
            showCatalog();
        }
    });
});

window.addEventListener("hashchange", () => {
    const targetId = window.location.hash.slice(1);
    document.body.classList.toggle(
        "landing-view",
        !["catalogo", "nosotros", "contacto"].includes(targetId)
    );
});

document.body.classList.toggle(
    "landing-view",
    !["catalogo", "nosotros", "contacto"].includes(window.location.hash.slice(1))
);

const siteHeader = document.querySelector(".site-header");
const compactHeaderOnScroll = () => {
    siteHeader.classList.toggle("is-compact", window.scrollY > 40);
};

window.addEventListener("scroll", compactHeaderOnScroll, { passive: true });
compactHeaderOnScroll();

setupStoreSharing();
renderProducts();
renderCart();
document.querySelectorAll(".cat-btn").forEach((button) => button.setAttribute("aria-pressed", "false"));
document.querySelector(".cat-btn").setAttribute("aria-pressed", "true");

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !document.getElementById("cart-drawer").classList.contains("translate-x-full")) {
        toggleCart();
    }
});
