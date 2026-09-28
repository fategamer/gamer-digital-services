/**
 * POST /api/mpesa/stk
 * Body: { phone, amount, orderId, dealTitle, deliveryPhone }
 * Triggers Safaricom STK Push (Lipa Na M-Pesa Online)
 */
const BASE = {
  sandbox: "https://sandbox.safaricom.co.ke",
  production: "https://api.safaricom.co.ke",
};

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.end(JSON.stringify(body));
}

function to254(phone) {
  let p = String(phone || "").replace(/\D/g, "");
  if (p.startsWith("0") && p.length === 10) p = "254" + p.slice(1);
  if (p.startsWith("254") && p.length === 12) return p;
  return null;
}

async function getToken(env, key, secret) {
  const auth = Buffer.from(`${key}:${secret}`).toString("base64");
  const url = `${BASE[env]}/oauth/v1/generate?grant_type=client_credentials`;
  const r = await fetch(url, {
    headers: { Authorization: `Basic ${auth}` },
  });
  const data = await r.json();
  if (!data.access_token) {
    throw new Error(data.errorMessage || data.error_description || "Token failed");
  }
  return data.access_token;
}

module.exports = async function handler(req, res) {
  if (req.method === "OPTIONS") {
    return json(res, 204, {});
  }
  if (req.method !== "POST") {
    return json(res, 405, { error: "Method not allowed" });
  }

  const env = (process.env.MPESA_ENV || "sandbox").toLowerCase();
  const key = process.env.MPESA_CONSUMER_KEY;
  const secret = process.env.MPESA_CONSUMER_SECRET;
  const shortcode = process.env.MPESA_SHORTCODE;
  const passkey = process.env.MPESA_PASSKEY;
  const txType =
    process.env.MPESA_TRANSACTION_TYPE || "CustomerBuyGoodsOnline"; // Buy Goods till

  if (!key || !secret || !shortcode || !passkey) {
    return json(res, 503, {
      error: "M-Pesa not configured",
      hint: "Set MPESA_CONSUMER_KEY, MPESA_CONSUMER_SECRET, MPESA_SHORTCODE, MPESA_PASSKEY on Vercel",
    });
  }

  let body = req.body;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch {
      return json(res, 400, { error: "Invalid JSON" });
    }
  }
  body = body || {};

  const phone254 = to254(body.phone);
  const amount = Math.round(Number(body.amount));
  const orderId = String(body.orderId || "").slice(0, 12);
  const dealTitle = String(body.dealTitle || "Deal").slice(0, 40);

  if (!phone254) {
    return json(res, 400, { error: "Invalid phone. Use 07XXXXXXXX or 01XXXXXXXX" });
  }
  if (!amount || amount < 1) {
    return json(res, 400, { error: "Invalid amount" });
  }
  if (!orderId) {
    return json(res, 400, { error: "orderId required" });
  }

  // Callback must be publicly reachable HTTPS
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  const proto = req.headers["x-forwarded-proto"] || "https";
  const callbackUrl =
    process.env.MPESA_CALLBACK_URL || `${proto}://${host}/api/mpesa/callback`;

  try {
    const token = await getToken(env, key, secret);
    const timestamp = new Date()
      .toISOString()
      .replace(/[^0-9]/g, "")
      .slice(0, 14);
    const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString(
      "base64"
    );

    const payload = {
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: txType,
      Amount: amount,
      PartyA: phone254,
      PartyB: shortcode,
      PhoneNumber: phone254,
      CallBackURL: callbackUrl,
      AccountReference: orderId,
      TransactionDesc: dealTitle,
    };

    const stkUrl = `${BASE[env]}/mpesa/stkpush/v1/processrequest`;
    const stkRes = await fetch(stkUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    const stkData = await stkRes.json();

    if (stkData.ResponseCode === "0" || stkData.ResponseCode === 0) {
      return json(res, 200, {
        ok: true,
        orderId,
        checkoutRequestId: stkData.CheckoutRequestID,
        merchantRequestId: stkData.MerchantRequestID,
        customerMessage: stkData.CustomerMessage || "Check your phone for M-Pesa prompt",
      });
    }

    return json(res, 400, {
      ok: false,
      error: stkData.errorMessage || stkData.ResponseDescription || "STK Push failed",
      details: stkData,
    });
  } catch (err) {
    console.error("STK error", err);
    return json(res, 500, { error: err.message || "STK Push error" });
  }
};
