const form = document.getElementById("tracking-form");
const codeInput = document.getElementById("tracking-code");
const submitButton = document.getElementById("tracking-submit");
const message = document.getElementById("tracking-message");
const result = document.getElementById("tracking-result");

const statusLabels = {
    pendiente: "Pendiente",
    preparado: "Preparado",
    enviado: "Enviado",
    entregado: "Entregado"
};

function showMessage(text, isError = false) {
    message.textContent = text;
    message.classList.toggle("is-error", isError);
}

function renderOrder(order) {
    document.getElementById("result-code").textContent = order.code;
    const status = document.getElementById("result-status");
    status.textContent = statusLabels[order.status] || "En actualización";
    status.dataset.status = order.status;
    document.getElementById("result-updated").textContent =
        `Última actualización: ${new Intl.DateTimeFormat("es-NI", {
            dateStyle: "long",
            timeStyle: "short"
        }).format(new Date(order.updatedAt))}`;

    const items = document.getElementById("result-items");
    items.replaceChildren(...order.items.map((item) => {
        const row = document.createElement("li");
        row.textContent = `${item.name}${item.color ? ` · Color ${item.color}` : ""} · Talla ${item.size} · Cantidad ${item.quantity}`;
        return row;
    }));
    result.classList.remove("hidden");
}

async function lookupOrder(code) {
    submitButton.disabled = true;
    submitButton.textContent = "Buscando...";
    result.classList.add("hidden");
    showMessage("");

    try {
        const response = await fetch("/api/orders", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "lookup", code })
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || "No se pudo consultar el pedido.");
        }
        renderOrder(data);
    } catch (error) {
        showMessage(error.message || "No se pudo consultar el pedido. Intenta de nuevo.", true);
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = "Consultar";
    }
}

form.addEventListener("submit", (event) => {
    event.preventDefault();
    const code = codeInput.value.trim();
    if (!code) {
        showMessage("Escribe tu código de seguimiento.", true);
        codeInput.focus();
        return;
    }
    lookupOrder(code);
});

const queryCode = new URLSearchParams(window.location.search).get("codigo");
if (queryCode) {
    codeInput.value = queryCode;
    lookupOrder(queryCode);
}
