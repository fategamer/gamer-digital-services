const {
  saveOrder,
  notifyTelegram,
  makeOrderId,
  normalizePhone,
  isValidKenyaPhone,
  storageMode,
} = require("../_lib/store");
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

  const phone = normalizePhone(body.phone || body.deliveryPhone);
  const amount = Math.round(Number(body.amount || body.price));
  const title = String(body.title || body.dealTitle || "Deal").slice(0, 80);
  const name = String(body.name || "").slice(0, 40);
  const ref = String(body.ref || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 16);
  const network = String(body.network || "Safaricom").slice(0, 20);
  const payMethod = String(body.payMethod || "till").slice(0, 20);
  const gift = !!body.gift;
  const okoa = !!body.okoa;
  const sendPrompt = body.sendPrompt !== false;

  if (!isValidKenyaPhone(phone)) return json(res, 400, { error: "Invalid delivery phone" });
  if (!amount || amount < 1) return json(res, 400, { error: "Invalid amount" });

  const orderId =
    body.orderId && /^GDS-[A-Z0-9]{4}$/.test(body.orderId) ? body.orderId : makeOrderId();

  const host = req.headers["x-forwarded-host"] || req.headers.host;
  const proto = req.headers["x-forwarded-proto"] || "https";
  const giftLink = gift ? `${proto}://${host}/gift.html?id=${orderId}` : null;

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
    giftStatus: gift ? "pending_accept" : null,
    status: gift ? "pending_accept" : "pending_payment",
    giftLink,
    promptSent: false,
    promptChannel: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    mpesaReceipt: null,
    paidAt: null,
    deliveredAt: null,
  };

  // Save FIRST so Accept/Decline works even if SMS is slow
  await saveOrder(order);

  let smsResult = null;
  if (gift && sendPrompt && giftLink) {
    const msg = giftSmsText({
      name: name || "Someone",
      title,
      amount,
      giftLink,
    });
    try {
      smsResult = await sendSms(phone, msg);
      order.promptSent = !!(smsResult && smsResult.ok);
      order.promptChannel = order.promptSent
        ? "sms"
        : hasSms()
          ? "sms_failed"
          : "not_configured";
      order.lastPromptAt = new Date().toISOString();
      await saveOrder(order);
    } catch (e) {
      console.error("SMS", e.message);
      smsResult = { ok: false, error: e.message };
      order.promptChannel = "sms_error";
      await saveOrder(order);
    }
  }

  console.log(
    "ORDER_CREATED",
    JSON.stringify({
      orderId,
      gift,
      promptSent: order.promptSent,
      storage: storageMode(),
    })
  );

  const lines = [
    gift ? "🎁 GIFT INVITE" : "🛒 NEW ORDER",
    `ID: ${orderId}`,
    `Deal: ${title}`,
    `Amount: Ksh ${amount}`,
    `${gift ? "Gift to" : "Deliver to"}: ${phone}`,
    name ? `From: ${name}` : null,
    gift && order.promptSent ? "SMS: SENT ✓" : null,
    gift && !order.promptSent
      ? "SMS: not sent — " + ((smsResult && smsResult.error) || order.promptChannel)
      : null,
    giftLink ? `Link: ${giftLink}` : null,
    `Store: ${storageMode()}`,
  ].filter(Boolean);

  try {
    await notifyTelegram(lines.join("\n"));
  } catch (e) {}

  return json(res, 200, {
    ok: true,
    orderId,
    order,
    till: process.env.PUBLIC_TILL || "6872649",
    giftLink,
    promptSent: !!order.promptSent,
    promptChannel: order.promptChannel,
    sms: smsResult
      ? {
          ok: !!smsResult.ok,
          error: smsResult.error || null,
          status: smsResult.status || null,
        }
      : null,
    smsConfigured: hasSms(),
    persistence: storageMode(),
  });
};
