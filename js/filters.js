import { products, renderProducts } from "./products.js";
import { getFavoriteIds } from "./favorites.js";

let activeCategory = "todos";

export function filterProducts() {
    const searchTerm = document.getElementById("search-input").value.trim().toLocaleLowerCase("es");
    const selectedSize = document.getElementById("size-filter").value;
    const favoriteIds = getFavoriteIds();
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

    renderProducts(filteredProducts, favoriteIds);
}

export function filterCategory(category) {
    activeCategory = category;
    document.querySelectorAll(".cat-btn").forEach((button) => {
        const isSelected = button.getAttribute("onclick") === `filterCategory('${category}')`;
        button.classList.toggle("cat-btn-active", isSelected);
        button.setAttribute("aria-pressed", String(isSelected));
    });
    filterProducts();
}

export function initializeFilters() {
    document.querySelectorAll(".cat-btn").forEach((button) => {
        button.setAttribute("aria-pressed", String(
            button.getAttribute("onclick") === "filterCategory('todos')"
        ));
    });
    filterProducts();
}
