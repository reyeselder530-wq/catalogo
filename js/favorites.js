import { products } from "./products.js";

const FAVORITES_STORAGE_KEY = "mr-sandalias-favorites";
let favoriteIds = loadFavorites();

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

export function getFavoriteIds() {
    return favoriteIds;
}

export function toggleFavorite(productId) {
    const isFavorite = favoriteIds.includes(productId);
    favoriteIds = isFavorite
        ? favoriteIds.filter((id) => id !== productId)
        : [...favoriteIds, productId];

    try {
        localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favoriteIds));
        return { isFavorite: !isFavorite, saved: true };
    } catch (error) {
        console.warn("No se pudieron guardar los favoritos en este navegador.", error);
        return { isFavorite: !isFavorite, saved: false };
    }
}
