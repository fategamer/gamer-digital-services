/**
 * Send SMS via Africa's Talking (Kenya).
 * Env: AT_USERNAME, AT_API_KEY, AT_FROM (optional sender ID / shortcode)
 */

function hasSms() {
  return !!(process.env.AT_API_KEY && process.env.AT_USERNAME);
}

function toIntl(phone) {
  let p = String(phone || "").replace(/\D/g, "");
  if (p.startsWith("0") && p.length === 10) p = "254" + p.slice(1);
  if (!p.startsWith("254")) p = "254" + p;
  return "+" + p;
}

async function sendSms(toPhone, message) {
  if (!hasSms()) {
    return { ok: false, error: "SMS not configured (set AT_USERNAME + AT_API_KEY)" };
  }

  const username = process.env.AT_USERNAME;
  const apiKey = process.env.AT_API_KEY;
  const from = process.env.AT_FROM || ""; // optional

  const body = new URLSearchParams();
  body.set("username", username);
  body.set("to", toIntl(toPhone));
  body.set("message", message.slice(0, 480));
  if (from) body.set("from", from);

  const r = await fetch("https://api.africastalking.com/version1/messaging", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
      apiKey: apiKey,
    },
    body: body.toString(),
  });

  const text = await r.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text };
  }

  if (!r.ok) {
    console.error("SMS_FAIL", r.status, text.slice(0, 300));
    return { ok: false, error: "SMS API error " + r.status, data };
  }

  const recipients =
    data?.SMSMessageData?.Recipients || data?.SMSMessageData?.recipients || [];
  const first = recipients[0];
  const status = first?.status || first?.statusCode || "Unknown";
  const ok =
    String(status).toLowerCase().includes("success") ||
    String(status) === "100" ||
    r.ok;

  console.log("SMS_SENT", toPhone, status);
  return { ok, status, data, to: toIntl(toPhone) };
}

function giftSmsText({ name, title, amount, giftLink }) {
  const who = name ? name : "Someone";
  return (
    who +
    " wants to gift you " +
    (title || "data") +
    (amount ? " (Ksh " + amount + ")" : "") +
    ". Accept or Decline: " +
    giftLink +
    " — Gamer Digital"
  );
}

module.exports = { hasSms, sendSms, giftSmsText, toIntl };
