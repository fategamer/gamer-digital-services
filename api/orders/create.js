/**
 * POST /api/orders/create
 */
const {
  saveOrder,
  notifyTelegram,
  makeOrderId,
  normalizePhone,
  isValidKenyaPhone,
  hasUpstash,
} = require("../_lib/store");

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

  const phone = normalizePhone(body.phone || body.deliveryPhone);
  const amount = Math.round(Number(body.amount || body.price));
  const title = String(body.title || body.dealTitle || "Deal").slice(0, 80);
  const name = String(body.name || "").slice(0, 40);
  const ref = String(body.ref || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 16);
  const network = String(body.network || "Safaricom").slice(0, 20);
  const payMethod = String(body.payMethod || "pending").slice(0, 20);
  const gift = !!body.gift;
  const okoa = !!body.okoa;

  if (!isValidKenyaPhone(phone)) {
    return json(res, 400, { error: "Invalid delivery phone" });
  }
  if (!amount || amount < 1) {
    return json(res, 400, { error: "Invalid amount" });
  }

  const orderId =
    body.orderId && /^GDS-[A-Z0-9]{4}$/.test(body.orderId)
      ? body.orderId
      : makeOrderId();

  const order = {
    orderId,
    title,
    amount,
    phone,
    name,
    ref: ref || null,
    network,
    payMethod,
    gift,
    okoa,
    status: "pending_payment",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    mpesaReceipt: null,
    paidAt: null,
    deliveredAt: null,
  };

  await saveOrder(order);
  console.log("ORDER_CREATED", JSON.stringify(order));

  const lines = [
    gift ? "🎁 GIFT ORDER" : "🛒 NEW ORDER",
    `ID: ${orderId}`,
    `Deal: ${title}`,
    `Amount: Ksh ${amount}`,
    `${gift ? "Gift to" : "Deliver to"}: ${phone}`,
    name ? `Name: ${name}` : null,
    ref ? `Ref: ${ref}` : null,
    okoa ? "Okoa: yes" : null,
    `Network: ${network}`,
    `Pay: ${payMethod}`,
  ].filter(Boolean);

  try {
    await notifyTelegram(lines.join("\n"));
  } catch (e) {
    console.error("Telegram", e.message);
  }

  return json(res, 200, {
    ok: true,
    orderId,
    order,
    till: process.env.PUBLIC_TILL || "6872649",
    persistence: hasUpstash() ? "redis" : "memory",
  });
};
