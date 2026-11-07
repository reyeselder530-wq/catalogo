const identity = window.netlifyIdentity;
const adminMessage = document.getElementById("admin-message");
const ordersList = document.getElementById("orders-list");
const loginButton = document.getElementById("admin-login");
const logoutButton = document.getElementById("admin-logout");
const refreshButton = document.getElementById("refresh-orders");
const orderStatuses = ["pendiente", "preparado", "enviado", "entregado"];

function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (character) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "\"": "&quot;",
        "'": "&#39;"
    })[character]);
}

function setMessage(text, isError = false) {
    adminMessage.textContent = text;
    adminMessage.classList.toggle("is-error", isError);
}

async function requestOrders(payload) {
    const user = identity.currentUser();
    if (!user) {
        throw new Error("Inicia sesión para administrar los pedidos.");
    }

    const token = await user.jwt();
    const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.error || "No se pudo completar la operación.");
    }
    return data;
}

function renderOrders(orders) {
    if (orders.length === 0) {
        ordersList.innerHTML = '<div class="order-admin-empty">Aún no hay pedidos registrados.</div>';
        return;
    }

    ordersList.innerHTML = orders.map((order) => {
        const options = orderStatuses.map((status) => `
            <option value="${status}"${order.status === status ? " selected" : ""}>
                ${status.charAt(0).toUpperCase()}${status.slice(1)}
            </option>`).join("");
        const items = order.items.map((item) =>
            `<li>${escapeHtml(item.name)} · Talla ${item.size} · Cantidad ${item.quantity}</li>`
        ).join("");
        const createdAt = new Intl.DateTimeFormat("es-NI", {
            dateStyle: "medium",
            timeStyle: "short"
        }).format(new Date(order.createdAt));

        return `
            <article class="order-admin-card" data-code="${escapeHtml(order.code)}">
                <div class="order-admin-card-heading">
                    <div><span class="tracking-label">Código</span><strong>${escapeHtml(order.code.match(/.{1,4}/g).join("-"))}</strong></div>
                    <span class="order-admin-date">${createdAt}</span>
                </div>
                <ul>${items}</ul>
                <div class="order-admin-controls">
                    <label>
                        <span>Estado</span>
                        <select class="order-status-select">${options}</select>
                    </label>
                    <button type="button" class="order-save-button">Guardar estado</button>
                </div>
            </article>`;
    }).join("");
    ordersList.classList.remove("hidden");
}

async function loadOrders() {
    ordersList.classList.add("hidden");
    setMessage("Cargando pedidos...");
    try {
        const data = await requestOrders({ action: "list" });
        renderOrders(data.orders);
        setMessage(`${data.orders.length} pedido(s) en total.`);
        refreshButton.classList.remove("hidden");
        logoutButton.classList.remove("hidden");
        loginButton.classList.add("hidden");
    } catch (error) {
        setMessage(error.message || "No se pudieron cargar los pedidos.", true);
    }
}

loginButton.addEventListener("click", () => identity.open("login"));
logoutButton.addEventListener("click", () => identity.logout());
refreshButton.addEventListener("click", loadOrders);

ordersList.addEventListener("click", async (event) => {
    const button = event.target.closest(".order-save-button");
    if (!button) {
        return;
    }

    const card = button.closest(".order-admin-card");
    const code = card.dataset.code;
    const status = card.querySelector(".order-status-select").value;
    button.disabled = true;
    try {
        await requestOrders({ action: "update", code, status });
        setMessage(`El pedido ${code.match(/.{1,4}/g).join("-")} ahora está ${status}.`);
        await loadOrders();
    } catch (error) {
        setMessage(error.message || "No se pudo actualizar el estado.", true);
        button.disabled = false;
    }
});

identity.on("init", (user) => {
    if (user) {
        loadOrders();
    }
});
identity.on("login", () => loadOrders());
identity.on("logout", () => {
    ordersList.classList.add("hidden");
    refreshButton.classList.add("hidden");
    logoutButton.classList.add("hidden");
    loginButton.classList.remove("hidden");
    setMessage("Inicia sesión con la cuenta administrativa para ver los pedidos.");
});
identity.init();
