/** POST { orderId } — resend gift SMS to friend */
const { getOrder, updateOrder } = require("../_lib/store");
const { hasSms, sendSms, giftSmsText } = require("../_lib/sms");

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
  const orderId = String(body.orderId || "");
  if (!orderId) return json(res, 400, { error: "orderId required" });

  const order = await getOrder(orderId);
  if (!order) return json(res, 404, { error: "Order not found" });
  if (!order.gift) return json(res, 400, { error: "Not a gift order" });

  const host = req.headers["x-forwarded-host"] || req.headers.host;
  const proto = req.headers["x-forwarded-proto"] || "https";
  const giftLink =
    order.giftLink || `${proto}://${host}/gift.html?id=${orderId}`;

  if (!hasSms()) {
    return json(res, 200, {
      ok: false,
      error: "SMS not configured",
      giftLink,
      smsConfigured: false,
    });
  }

  const msg = giftSmsText({
    name: order.name,
    title: order.title,
    amount: order.amount,
    giftLink,
  });
  const sms = await sendSms(order.phone, msg);
  await updateOrder(orderId, {
    promptSent: !!sms.ok,
    promptChannel: sms.ok ? "sms" : "sms_failed",
    lastPromptAt: new Date().toISOString(),
  });

  return json(res, 200, {
    ok: !!sms.ok,
    sms,
    giftLink,
    orderId,
    phone: order.phone,
  });
};
