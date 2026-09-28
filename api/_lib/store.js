/**
 * Order store — Upstash Redis if configured, else in-memory (warm instances only).
 * Always safe to call; degrades gracefully.
 */

const memory = globalThis.__GDS_ORDERS || (globalThis.__GDS_ORDERS = new Map());
const memoryList = globalThis.__GDS_ORDER_LIST || (globalThis.__GDS_ORDER_LIST = []);

function hasUpstash() {
  return !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

async function redis(command, args = []) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  const r = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify([command, ...args]),
  });
  const data = await r.json();
  if (data.error) throw new Error(data.error);
  return data.result;
}

async function saveOrder(order) {
  const id = order.orderId;
  const payload = JSON.stringify(order);

  memory.set(id, order);
  memoryList.unshift(id);
  if (memoryList.length > 200) memoryList.pop();

  if (hasUpstash()) {
    try {
      await redis("SET", [`gds:order:${id}`, payload]);
      await redis("ZADD", ["gds:orders", Date.now(), id]);
      await redis("LTRIM", ["gds:orderids", 0, 199]); // keep list small if used
    } catch (e) {
      console.error("Upstash save failed", e.message);
    }
  }
  return order;
}

async function getOrder(orderId) {
  if (memory.has(orderId)) return memory.get(orderId);
  if (hasUpstash()) {
    try {
      const raw = await redis("GET", [`gds:order:${orderId}`]);
      if (raw) {
        const o = typeof raw === "string" ? JSON.parse(raw) : raw;
        memory.set(orderId, o);
        return o;
      }
    } catch (e) {
      console.error("Upstash get failed", e.message);
    }
  }
  return null;
}

async function updateOrder(orderId, patch) {
  const existing = (await getOrder(orderId)) || { orderId };
  const next = { ...existing, ...patch, updatedAt: new Date().toISOString() };
  return saveOrder(next);
}

async function listOrders(limit = 50) {
  if (hasUpstash()) {
    try {
      // newest first by score
      const ids = await redis("ZREVRANGE", ["gds:orders", 0, limit - 1]);
      const out = [];
      for (const id of ids || []) {
        const o = await getOrder(id);
        if (o) out.push(o);
      }
      if (out.length) return out;
    } catch (e) {
      console.error("Upstash list failed", e.message);
    }
  }
  return memoryList.slice(0, limit).map((id) => memory.get(id)).filter(Boolean);
}

async function notifyTelegram(text) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return false;
  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      disable_web_page_preview: true,
    }),
  });
  return r.ok;
}

function makeOrderId() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let id = "GDS-";
  for (let i = 0; i < 4; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return id;
}

function normalizePhone(raw) {
  let p = String(raw || "").replace(/\D/g, "");
  if (p.startsWith("254") && p.length === 12) p = "0" + p.slice(3);
  if (p.startsWith("2540") && p.length === 13) p = p.slice(3);
  return p;
}

function isValidKenyaPhone(p) {
  return /^0[17]\d{8}$/.test(p);
}

module.exports = {
  saveOrder,
  getOrder,
  updateOrder,
  listOrders,
  notifyTelegram,
  makeOrderId,
  normalizePhone,
  isValidKenyaPhone,
  hasUpstash,
};
