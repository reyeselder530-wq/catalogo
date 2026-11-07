async function createTrackedOrder() {
    const checkoutButton = document.querySelector("#cart-drawer button[onclick='checkoutWhatsApp()']");
    if (checkoutButton) {
        checkoutButton.disabled = true;
        checkoutButton.setAttribute("aria-busy", "true");
    }

    try {
        const response = await fetch("/api/orders", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                action: "create",
                items: cart.map(({ productId, size, quantity }) => ({ productId, size, quantity }))
            })
        });
        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.error || "No se pudo registrar el pedido.");
        }

        const lines = cart.map((item) => {
            const product = products.find((entry) => entry.id === item.productId);
            const imageUrl = new URL(product.image, window.location.href).href;
            return `- ${product.name} | Talla ${item.size} | Cantidad: ${item.quantity} | ${formatPrice(product.price * item.quantity)}\nFoto: ${imageUrl}`;
        });
        const message = [
            "Hola, quiero confirmar este pedido:",
            "",
            ...lines,
            "",
            `Total: ${formatPrice(result.total)}`,
            `Código de seguimiento: ${result.code}`
        ].join("\n");
        const phone = WHATSAPP_PHONE.replace(/\D/g, "");

        cart = [];
        saveCart();
        renderCart();
        document.getElementById("order-confirmation-code").textContent = result.code;
        document.getElementById("order-track-link").href =
            `/seguimiento.html?codigo=${encodeURIComponent(result.code)}`;
        document.getElementById("order-whatsapp-link").href =
            `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
        document.getElementById("order-confirmation").classList.remove("hidden");
        toggleCart();
    } catch (error) {
        console.error("No se pudo registrar el pedido para seguimiento.", error);
        showToast(error.message || "No se pudo registrar el pedido. Intenta de nuevo.");
    } finally {
        if (checkoutButton) {
            checkoutButton.disabled = false;
            checkoutButton.removeAttribute("aria-busy");
        }
    }
}

function trackedCheckout() {
    if (cart.length === 0) {
        showToast("Agrega al menos un producto antes de finalizar tu pedido.");
        return;
    }

    const phone = WHATSAPP_PHONE.replace(/\D/g, "");
    if (!/^\d{10,15}$/.test(phone)) {
        showToast("Configura el número de WhatsApp de la tienda en app.js.");
        return;
    }

    createTrackedOrder();
}

function closeOrderConfirmation() {
    document.getElementById("order-confirmation").classList.add("hidden");
}

window.checkoutWhatsApp = trackedCheckout;
window.closeOrderConfirmation = closeOrderConfirmation;

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !document.getElementById("order-confirmation").classList.contains("hidden")) {
        closeOrderConfirmation();
    }
});
