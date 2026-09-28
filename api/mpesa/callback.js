/**
 * POST /api/mpesa/callback — STK result → mark order paid + Telegram
 */
const { updateOrder, getOrder, notifyTelegram } = require("../_lib/store");

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return json(res, 405, { ResultCode: 1, ResultDesc: "Method not allowed" });
  }

  let body = req.body;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch {
      body = {};
    }
  }

  const stk = body.Body && body.Body.stkCallback;
  if (!stk) {
    console.log("M-Pesa callback unexpected", JSON.stringify(body));
    return json(res, 200, { ResultCode: 0, ResultDesc: "Accepted" });
  }

  const resultCode = stk.ResultCode;
  let amount = null;
  let mpesaReceipt = null;
  let phone = null;
  let accountReference = null;

  if (stk.CallbackMetadata && Array.isArray(stk.CallbackMetadata.Item)) {
    for (const item of stk.CallbackMetadata.Item) {
      if (item.Name === "Amount") amount = item.Value;
      if (item.Name === "MpesaReceiptNumber") mpesaReceipt = item.Value;
      if (item.Name === "PhoneNumber") phone = item.Value;
      if (item.Name === "AccountReference") accountReference = item.Value;
    }
  }

  const orderId = accountReference || null;
  const paid = resultCode === 0;

  console.log(
    "MPESA_STK_RESULT",
    JSON.stringify({ orderId, paid, amount, mpesaReceipt, phone, resultDesc: stk.ResultDesc })
  );

  if (orderId && paid) {
    try {
      await updateOrder(orderId, {
        status: "paid",
        mpesaReceipt,
        paidAt: new Date().toISOString(),
        payMethod: "stk",
        amount: amount != null ? amount : undefined,
      });
    } catch (e) {
      console.error("update order", e.message);
    }
  }

  const existing = orderId ? await getOrder(orderId) : null;
  const text = [
    paid ? "✅ STK PAID" : "❌ STK FAILED",
    `Order: ${orderId || "—"}`,
    existing ? `Deal: ${existing.title}` : null,
    `Amount: Ksh ${amount ?? existing?.amount ?? "—"}`,
    `Receipt: ${mpesaReceipt || "—"}`,
    `Phone: ${phone || existing?.phone || "—"}`,
    existing?.phone ? `Deliver to: ${existing.phone}` : null,
    stk.ResultDesc || "",
  ]
    .filter(Boolean)
    .join("\n");

  try {
    await notifyTelegram(text);
  } catch (e) {
    console.error("Telegram", e.message);
  }

  const notify = process.env.MPESA_NOTIFY_URL;
  if (notify) {
    try {
      await fetch(notify, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, paid, amount, mpesaReceipt, phone }),
      });
    } catch (e) {}
  }

  return json(res, 200, { ResultCode: 0, ResultDesc: "Accepted" });
};
