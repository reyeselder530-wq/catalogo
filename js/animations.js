let toastTimeout;

export function showToast(message) {
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

export function setupStoreSharing() {
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

export function initializeMotion(toggleCart) {
    const showCatalog = () => document.body.classList.remove("landing-view");
    const updateLandingView = () => {
        const targetId = window.location.hash.slice(1);
        document.body.classList.toggle(
            "landing-view",
            !["catalogo", "nosotros", "contacto"].includes(targetId)
        );
    };

    document.querySelectorAll('a[href^="#"]').forEach((link) => {
        link.addEventListener("click", () => {
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

    window.addEventListener("hashchange", updateLandingView);
    updateLandingView();

    const siteHeader = document.querySelector(".site-header");
    const compactHeaderOnScroll = () => {
        siteHeader.classList.toggle("is-compact", window.scrollY > 40);
    };

    window.addEventListener("scroll", compactHeaderOnScroll, { passive: true });
    compactHeaderOnScroll();

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && !document.getElementById("cart-drawer").classList.contains("translate-x-full")) {
            toggleCart();
        }
    });
}
