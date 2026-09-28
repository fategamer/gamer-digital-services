/**
 * POST /api/mpesa/callback
 * Safaricom STK result + optional Telegram notify
 */
function json(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

async function notifyTelegram(record) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;

  const status = record.paid ? "✅ PAID" : "❌ FAILED";
  const text = [
    `${status} · Gamer Digital`,
    `Order: ${record.orderId || "—"}`,
    `Amount: Ksh ${record.amount ?? "—"}`,
    `Receipt: ${record.mpesaReceipt || "—"}`,
    `Phone: ${record.phone || "—"}`,
    `Desc: ${record.resultDesc || ""}`,
    `Time: ${record.at}`,
  ].join("\n");

  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      disable_web_page_preview: true,
    }),
  });
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
    console.log("M-Pesa callback (unexpected shape)", JSON.stringify(body));
    return json(res, 200, { ResultCode: 0, ResultDesc: "Accepted" });
  }

  const resultCode = stk.ResultCode;
  const resultDesc = stk.ResultDesc;
  const checkoutId = stk.CheckoutRequestID;
  const merchantId = stk.MerchantRequestID;

  let amount = null;
  let mpesaReceipt = null;
  let phone = null;
  let transactionDate = null;
  let accountReference = null;

  if (stk.CallbackMetadata && Array.isArray(stk.CallbackMetadata.Item)) {
    for (const item of stk.CallbackMetadata.Item) {
      if (item.Name === "Amount") amount = item.Value;
      if (item.Name === "MpesaReceiptNumber") mpesaReceipt = item.Value;
      if (item.Name === "PhoneNumber") phone = item.Value;
      if (item.Name === "TransactionDate") transactionDate = item.Value;
      if (item.Name === "AccountReference") accountReference = item.Value;
    }
  }

  const orderId = accountReference || null;

  const record = {
    at: new Date().toISOString(),
    resultCode,
    resultDesc,
    orderId,
    checkoutId,
    merchantId,
    amount,
    mpesaReceipt,
    phone,
    transactionDate,
    paid: resultCode === 0,
  };

  console.log("MPESA_STK_RESULT", JSON.stringify(record));

  // Telegram (preferred)
  try {
    await notifyTelegram(record);
  } catch (e) {
    console.error("Telegram notify failed", e.message);
  }

  // Generic webhook
  const notify = process.env.MPESA_NOTIFY_URL;
  if (notify) {
    try {
      await fetch(notify, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(record),
      });
    } catch (e) {
      console.error("Notify URL failed", e.message);
    }
  }

  return json(res, 200, { ResultCode: 0, ResultDesc: "Accepted" });
};
