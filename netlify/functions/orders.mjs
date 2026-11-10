import { getStore } from "@netlify/blobs";
import { getUser } from "@netlify/identity";
import { randomBytes } from "node:crypto";

const ORDER_STORE = "mr-orders";
const CODE_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
const ORDER_STATUSES = ["pendiente", "preparado", "enviado", "entregado"];

class ClientInputError extends Error {
    constructor(statusCode, message) {
        super(message);
        this.statusCode = statusCode;
    }
}

function respond(statusCode, body) {
    return new Response(JSON.stringify(body), {
        status: statusCode,
        headers: { "Content-Type": "application/json; charset=utf-8" }
    });
}

async function readBody(request) {
    const text = await request.text();
    if (text.length > 12_000) {
        throw new ClientInputError(413, "La solicitud es demasiado grande.");
    }

    try {
        return JSON.parse(text);
    } catch {
        throw new ClientInputError(400, "La solicitud no tiene un formato válido.");
    }
}

function isOrderAdmin(user, adminEmail) {
    const userEmail = user?.email?.toLowerCase();
    return Boolean(userEmail && adminEmail && userEmail === adminEmail);
}

function generateCode() {
    return Array.from(randomBytes(12), (value) => CODE_ALPHABET[value & 31]).join("");
}

function formatCode(code) {
    return code.match(/.{1,4}/g).join("-");
}

function normalizeCode(value) {
    if (typeof value !== "string") {
        return "";
    }

    return value.replace(/-/g, "").trim().toUpperCase();
}

function isValidCode(code) {
    return /^[2-9A-HJ-NP-Z]{12}$/.test(code);
}

async function getCatalog(request) {
    const response = await fetch(new URL("/data/products.json", request.url));
    if (!response.ok) {
        throw new Error("No se pudo validar el catálogo de productos.");
    }

    const catalog = await response.json();
    if (!Array.isArray(catalog.products)) {
        throw new Error("El catálogo no tiene un formato válido.");
    }
    return catalog.products;
}

async function createOrder(request, body) {
    if (!Array.isArray(body.items) || body.items.length === 0 || body.items.length > 20) {
        return respond(400, { error: "Agrega productos válidos para crear el pedido." });
    }

    const catalog = await getCatalog(request);
    const items = [];
    for (const requestedItem of body.items) {
        if (!requestedItem || typeof requestedItem !== "object") {
            return respond(400, { error: "Uno de los productos no es válido." });
        }
        const product = catalog.find((entry) => entry.id === requestedItem.productId);
        const size = Number(requestedItem.size);
        const quantity = Number(requestedItem.quantity);
        if (!product || !Array.isArray(product.sizes) || !Number.isFinite(product.price) || product.price < 0
            || !product.sizes.includes(size)
            || !Number.isInteger(quantity) || quantity < 1 || quantity > 20) {
            return respond(400, { error: "Uno de los productos, tallas o cantidades ya no es válido." });
        }

        const variants = product.variants;
        if (variants !== undefined && (!Array.isArray(variants) || variants.length === 0
            || variants.some((variant) => !variant || typeof variant.name !== "string" || !variant.name.trim()))) {
            return respond(500, { error: "Las variantes del catálogo no tienen un formato válido." });
        }
        if (requestedItem.variant !== undefined && typeof requestedItem.variant !== "string") {
            return respond(400, { error: "El color seleccionado no es válido." });
        }
        const variantName = typeof requestedItem.variant === "string" ? requestedItem.variant : "";
        const selectedVariant = variants?.length
            ? variants.find((variant) => variant.name === variantName) || (!variantName ? variants[0] : null)
            : null;
        if ((variants?.length && !selectedVariant) || (!variants?.length && variantName)) {
            return respond(400, { error: "El color seleccionado ya no está disponible." });
        }

        items.push({
            productId: product.id,
            name: product.name,
            ...(selectedVariant ? { color: selectedVariant.name } : {}),
            size,
            quantity,
            unitPrice: product.price
        });
    }

    const total = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    const store = getStore(ORDER_STORE);
    let code;
    let key;
    let existing;
    do {
        code = generateCode();
        key = `order:${code}`;
        existing = await store.get(key);
    } while (existing);

    const createdAt = new Date().toISOString();
    await store.setJSON(key, {
        code,
        items,
        total,
        status: "pendiente",
        createdAt,
        updatedAt: createdAt,
        history: [{ status: "pendiente", at: createdAt }]
    });

    return respond(201, { code: formatCode(code), status: "pendiente", total });
}

async function lookupOrder(body) {
    const code = normalizeCode(body.code);
    if (!isValidCode(code)) {
        return respond(400, { error: "Escribe un código de seguimiento válido." });
    }

    const store = getStore(ORDER_STORE);
    const order = await store.get(`order:${code}`, { type: "json" });
    if (!order) {
        return respond(404, { error: "No encontramos un pedido con ese código." });
    }

    return respond(200, {
        code: formatCode(order.code),
        status: order.status,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        items: order.items.map(({ name, color, size, quantity }) => ({ name, color, size, quantity })),
        total: order.total
    });
}

async function listOrders() {
    const store = getStore(ORDER_STORE);
    const { blobs } = await store.list({ prefix: "order:" });
    const orders = await Promise.all(blobs.map(({ key }) => store.get(key, { type: "json" })));
    orders.sort((first, second) => second.createdAt.localeCompare(first.createdAt));
    return respond(200, { orders });
}

async function updateOrder(body) {
    const code = normalizeCode(body.code);
    if (!isValidCode(code) || !ORDER_STATUSES.includes(body.status)) {
        return respond(400, { error: "El código o el nuevo estado no son válidos." });
    }

    const store = getStore(ORDER_STORE);
    const key = `order:${code}`;
    const order = await store.get(key, { type: "json" });
    if (!order) {
        return respond(404, { error: "No encontramos ese pedido." });
    }

    const updatedAt = new Date().toISOString();
    order.status = body.status;
    order.updatedAt = updatedAt;
    order.history.push({ status: body.status, at: updatedAt });
    await store.setJSON(key, order);
    return respond(200, { ok: true });
}

export default async (request) => {
    if (request.method !== "POST") {
        return respond(405, { error: "Método no permitido." });
    }

    try {
        const body = await readBody(request);
        if (!body || typeof body !== "object" || Array.isArray(body)) {
            return respond(400, { error: "La solicitud no tiene un formato válido." });
        }

        if (body.action === "create") {
            return await createOrder(request, body);
        }
        if (body.action === "lookup") {
            return await lookupOrder(body);
        }
        if (body.action === "list" || body.action === "update") {
            const adminEmail = process.env.ORDER_ADMIN_EMAIL?.trim().toLowerCase();
            if (!adminEmail) {
                return respond(503, { error: "Falta configurar ORDER_ADMIN_EMAIL en las variables de Netlify." });
            }
            const user = await getUser();
            if (!user) {
                return respond(401, { error: "Inicia sesión para administrar los pedidos." });
            }
            if (!isOrderAdmin(user, adminEmail)) {
                return respond(403, { error: "No tienes permiso para administrar pedidos." });
            }
            return body.action === "list"
                ? await listOrders()
                : await updateOrder(body);
        }

        return respond(400, { error: "La acción solicitada no es válida." });
    } catch (error) {
        if (error instanceof ClientInputError) {
            return respond(error.statusCode, { error: error.message });
        }
        console.error("Error en el servicio de seguimiento de pedidos.", error);
        return respond(500, { error: "No se pudo procesar la solicitud. Intenta de nuevo." });
    }
};
