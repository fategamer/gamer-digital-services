/**
 * GET /api/mpesa/status
 * Health check: are Daraja env vars present? (does not expose secrets)
 */
module.exports = async function handler(req, res) {
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "*");
  const configured = !!(
    process.env.MPESA_CONSUMER_KEY &&
    process.env.MPESA_CONSUMER_SECRET &&
    process.env.MPESA_SHORTCODE &&
    process.env.MPESA_PASSKEY
  );
  res.end(
    JSON.stringify({
      ok: true,
      mpesaConfigured: configured,
      env: process.env.MPESA_ENV || "sandbox",
      shortcodeSet: !!process.env.MPESA_SHORTCODE,
    })
  );
};
