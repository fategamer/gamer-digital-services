/**
 * POST /api/mpesa/callback
 * Safaricom posts STK result here.
 * AccountReference = our Order ID (GDS-XXXX)
 */
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

  // Always acknowledge so Safaricom stops retrying
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

  // AccountReference is what we sent as orderId
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

  // Log for Vercel function logs — open Vercel → Deployments → Functions → Logs
  console.log("MPESA_STK_RESULT", JSON.stringify(record));

  // Optional: forward to a webhook / Google Sheet / Telegram if you set MPESA_NOTIFY_URL
  const notify = process.env.MPESA_NOTIFY_URL;
  if (notify) {
    try {
      await fetch(notify, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(record),
      });
    } catch (e) {
      console.error("Notify failed", e.message);
    }
  }

  return json(res, 200, { ResultCode: 0, ResultDesc: "Accepted" });
};
