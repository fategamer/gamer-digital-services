/**
 * POST /api/orders/update
 * Body: { pin, orderId, status: 'paid'|'delivered'|'cancelled', mpesaReceipt? }
 */
const { updateOrder, getOrder, notifyTelegram } = require("../_lib/store");

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.end(JSON.stringify(body));
}

module.exports = async function handler(req, res) {
  if (req.method === "OPTIONS") return json(res, 204, {});
  if (req.method !== "POST") return json(res, 405, { error: "Method not allowed" });

  let body = req.body;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch {
      return json(res, 400, { error: "Invalid JSON" });
    }
  }
  body = body || {};

  const expected = process.env.AGENT_PIN || "6872";
  if (body.pin !== expected) return json(res, 401, { error: "Invalid PIN" });

  const orderId = String(body.orderId || "");
  if (!orderId) return json(res, 400, { error: "orderId required" });

  const existing = await getOrder(orderId);
  if (!existing) return json(res, 404, { error: "Order not found (may have expired from memory — use Redis for persistence)" });

  const status = String(body.status || "").toLowerCase();
  const allowed = ["pending_payment", "paid", "delivered", "cancelled"];
  if (!allowed.includes(status)) {
    return json(res, 400, { error: "status must be pending_payment|paid|delivered|cancelled" });
  }

  const patch = { status };
  if (body.mpesaReceipt) patch.mpesaReceipt = String(body.mpesaReceipt).slice(0, 30);
  if (status === "paid") patch.paidAt = new Date().toISOString();
  if (status === "delivered") patch.deliveredAt = new Date().toISOString();

  const order = await updateOrder(orderId, patch);

  try {
    await notifyTelegram(
      `📌 ORDER ${status.toUpperCase()}\nID: ${orderId}\nDeal: ${order.title}\nPhone: ${order.phone}\nKsh ${order.amount}`
    );
  } catch (e) {}

  return json(res, 200, { ok: true, order });
};
