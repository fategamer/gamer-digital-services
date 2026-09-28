/**
 * GET /api/orders/list?pin=XXXX
 * Agent order list
 */
const { listOrders } = require("../_lib/store");

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.end(JSON.stringify(body));
}

module.exports = async function handler(req, res) {
  if (req.method !== "GET") return json(res, 405, { error: "Method not allowed" });

  const url = new URL(req.url, `http://${req.headers.host}`);
  const pin = url.searchParams.get("pin") || "";
  const expected = process.env.AGENT_PIN || "6872";

  if (pin !== expected) {
    return json(res, 401, { error: "Invalid PIN" });
  }

  const orders = await listOrders(80);
  return json(res, 200, { ok: true, count: orders.length, orders });
};
