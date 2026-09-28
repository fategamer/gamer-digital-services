const { getOrder, updateOrder, notifyTelegram } = require("../_lib/store");

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS, GET");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.end(JSON.stringify(body));
}

module.exports = async function handler(req, res) {
  if (req.method === "OPTIONS") return json(res, 204, {});

  if (req.method === "GET") {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const orderId = String(url.searchParams.get("orderId") || "");
    if (!orderId) return json(res, 400, { error: "orderId required" });
    const order = await getOrder(orderId);
    if (!order) {
      return json(res, 404, {
        error: "Gift not found. Orders need GITHUB_TOKEN or Redis on Vercel to persist.",
      });
    }
    return json(res, 200, {
      ok: true,
      order: {
        orderId: order.orderId,
        title: order.title,
        amount: order.amount,
        phone: order.phone,
        name: order.name,
        gift: order.gift,
        giftStatus: order.giftStatus || (order.gift ? "pending_accept" : null),
        status: order.status,
        network: order.network,
      },
    });
  }

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

  const orderId = String(body.orderId || "");
  const action = String(body.action || "").toLowerCase();
  if (!orderId) return json(res, 400, { error: "orderId required" });
  if (action !== "accept" && action !== "decline") {
    return json(res, 400, { error: "action must be accept or decline" });
  }

  const order = await getOrder(orderId);
  if (!order) {
    return json(res, 404, {
      error: "Gift not found. Set GITHUB_TOKEN on Vercel so gifts persist.",
    });
  }

  if (order.giftStatus === "accepted" || order.giftStatus === "declined") {
    return json(res, 200, {
      ok: true,
      already: true,
      giftStatus: order.giftStatus,
      order,
    });
  }

  const giftStatus = action === "accept" ? "accepted" : "declined";
  const patch = {
    giftStatus,
    giftRespondedAt: new Date().toISOString(),
  };
  if (action === "accept") {
    patch.status = "pending_payment";
  } else {
    patch.status = "cancelled";
  }

  const updated = await updateOrder(orderId, patch);

  try {
    await notifyTelegram(
      (action === "accept" ? "✅ GIFT ACCEPTED — pay till" : "❌ GIFT DECLINED") +
        `\nOrder: ${orderId}\nDeal: ${order.title}\nPhone: ${order.phone}\nKsh ${order.amount}`
    );
  } catch (e) {}

  return json(res, 200, { ok: true, giftStatus, order: updated });
};
