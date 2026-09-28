/**
 * Africa's Talking SMS (Kenya)
 * Env:
 *   AT_USERNAME   - "sandbox" or your app username
 *   AT_API_KEY    - API key from AT dashboard
 *   AT_FROM       - optional sender ID / shortcode (live)
 *   AT_SANDBOX=1  - force sandbox endpoint even if username is not sandbox
 */

function hasSms() {
  return !!(process.env.AT_API_KEY && process.env.AT_USERNAME);
}

function isSandbox() {
  if (process.env.AT_SANDBOX === "1" || process.env.AT_SANDBOX === "true") return true;
  return String(process.env.AT_USERNAME || "").toLowerCase() === "sandbox";
}

function apiBase() {
  return isSandbox()
    ? "https://api.sandbox.africastalking.com/version1/messaging"
    : "https://api.africastalking.com/version1/messaging";
}

function toIntl(phone) {
  let p = String(phone || "").replace(/\D/g, "");
  if (p.startsWith("0") && p.length === 10) p = "254" + p.slice(1);
  if (p.startsWith("2540")) p = "254" + p.slice(4);
  if (!p.startsWith("254")) p = "254" + p.replace(/^0/, "");
  return "+" + p;
}

async function sendSms(toPhone, message) {
  if (!hasSms()) {
    return {
      ok: false,
      error: "SMS not configured — set AT_USERNAME and AT_API_KEY on Vercel",
    };
  }

  const username = process.env.AT_USERNAME.trim();
  const apiKey = process.env.AT_API_KEY.trim();
  const from = (process.env.AT_FROM || "").trim();

  const body = new URLSearchParams();
  body.set("username", username);
  body.set("to", toIntl(toPhone));
  body.set("message", String(message).slice(0, 460));
  if (from && !isSandbox()) body.set("from", from);

  let r;
  try {
    r = await fetch(apiBase(), {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
        apiKey: apiKey,
      },
      body: body.toString(),
    });
  } catch (e) {
    console.error("SMS_NETWORK", e.message);
    return { ok: false, error: "SMS network error: " + e.message };
  }

  const text = await r.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text };
  }

  const recipients =
    (data && data.SMSMessageData && (data.SMSMessageData.Recipients || data.SMSMessageData.recipients)) ||
    [];
  const first = recipients[0] || {};
  const status = String(first.status || first.statusCode || (r.ok ? "Success" : "Failed"));
  const statusCode = String(first.statusCode || "");

  // AT success codes: 100 / Success
  const ok =
    r.ok &&
    (/success/i.test(status) ||
      statusCode === "100" ||
      status === "100" ||
      (recipients.length > 0 && !/fail|invalid|reject/i.test(status)));

  if (!ok) {
    console.error("SMS_FAIL", r.status, text.slice(0, 400));
    const errMsg =
      (data && data.SMSMessageData && data.SMSMessageData.Message) ||
      first.status ||
      "SMS failed " + r.status;
    return { ok: false, error: String(errMsg), status, data, to: toIntl(toPhone) };
  }

  console.log("SMS_OK", toIntl(toPhone), status);
  return { ok: true, status, data, to: toIntl(toPhone) };
}

function giftSmsText({ name, title, amount, giftLink }) {
  const who = (name && String(name).trim()) || "Someone";
  return (
    who +
    " wants to gift you " +
    (title || "data") +
    (amount != null ? " (Ksh " + amount + ")" : "") +
    ". Accept or Decline: " +
    giftLink +
    " — Gamer Digital"
  );
}

module.exports = { hasSms, sendSms, giftSmsText, toIntl, isSandbox };
