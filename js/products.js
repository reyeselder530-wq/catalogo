export const products = [
    {
        id: "floral",
        name: "Floral",
        category: "Elegante",
        price: 300,
        sizes: [35, 36, 37, 38, 39],
        description: "Sandalia blanca con delicado detalle floral.",
        image: "assets/images/elegantes/sandalia-floral.png"
    },
    {
        id: "negra",
        name: "Clásica Negra",
        category: "Casual",
        price: 300,
        sizes: [35, 36, 37, 38, 39],
        description: "Sandalia negra con banda fruncida y estilo moderno.",
        image: "assets/images/casuales/sandalia-negra.png"
    },
    {
        id: "sandalias-casuales",
        name: "Sandalias casuales",
        category: "Casual",
        price: 280,
        sizes: [35, 36, 37, 38, 39],
        description: "Sandalias azules casuales, cómodas y elegantes.",
        image: "assets/images/casuales/sandalias-casuales.png"
    },
    {
        id: "mono-cafe",
        name: "Moño Café",
        category: "Elegante",
        price: 200,
        sizes: [35, 36, 37, 38, 39],
        description: "Sandalia café con moño decorativo y plantilla floral.",
        image: "assets/images/elegantes/sandalia-mono-cafe.png"
    },
    {
        id: "trenzada-morada",
        name: "Trenzada Morada",
        category: "Casual",
        price: 180,
        sizes: [35, 36, 37, 38, 39],
        description: "Sandalia casual con banda trenzada color morado.",
        image: "assets/images/casuales/sandalia-trenzada-morada.png"
    },
    {
        id: "azul-flecos",
        name: "Azul con Flecos",
        category: "Casual",
        price: 180,
        sizes: [35, 36, 37, 38, 39],
        description: "Sandalia azul con flecos y detalles decorativos.",
        image: "assets/images/casuales/sandalia-azul-flecos.png"
    }
];

const currencyFormatter = new Intl.NumberFormat("es-NI", {
    style: "currency",
    currency: "NIO",
    currencyDisplay: "narrowSymbol"
});

export function formatPrice(price) {
    return currencyFormatter.format(price);
}

export function renderProducts(filteredProducts = products, favoriteIds = []) {
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
