const { storageMode, hasUpstash, hasGitHub } = require("./_lib/store");
const { hasSms } = require("./_lib/sms");

module.exports = async function handler(req, res) {
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.end(
    JSON.stringify({
      ok: true,
      service: "gamer-digital-services",
      mpesa: !!(process.env.MPESA_CONSUMER_KEY && process.env.MPESA_PASSKEY),
      telegram: !!(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID),
      sms: hasSms(),
      redis: hasUpstash(),
      githubStore: hasGitHub(),
      storage: storageMode(),
      time: new Date().toISOString(),
    })
  );
};
