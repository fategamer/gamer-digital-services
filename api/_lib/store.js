/**
 * Durable order store:
 * 1) Upstash Redis (if env set)
 * 2) GitHub file data/orders.json (if GITHUB_TOKEN set) — works for this repo
 * 3) Memory fallback
 */

const memory = globalThis.__GDS_ORDERS || (globalThis.__GDS_ORDERS = new Map());
const memoryList = globalThis.__GDS_ORDER_LIST || (globalThis.__GDS_ORDER_LIST = []);

const GH_OWNER = process.env.GITHUB_ORDERS_OWNER || "fategamer";
const GH_REPO = process.env.GITHUB_ORDERS_REPO || "gamer-digital-services";
const GH_PATH = process.env.GITHUB_ORDERS_PATH || "data/orders.json";
const GH_BRANCH = process.env.GITHUB_ORDERS_BRANCH || "main";

function hasUpstash() {
  return !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

function hasGitHub() {
  return !!process.env.GITHUB_TOKEN;
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

async function ghHeaders() {
  return {
    Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
    Accept: "application/vnd.github+json",
    "Content-Type": "application/json",
    "User-Agent": "gamer-digital-services",
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

async function ghReadOrders() {
  const url = `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/${GH_PATH}?ref=${GH_BRANCH}`;
  const r = await fetch(url, { headers: await ghHeaders() });
  if (r.status === 404) return { orders: [], sha: null };
  if (!r.ok) throw new Error("GitHub read failed " + r.status);
  const data = await r.json();
  const text = Buffer.from(data.content.replace(/\n/g, ""), "base64").toString("utf8");
  let orders = [];
  try {
    const parsed = JSON.parse(text);
    orders = Array.isArray(parsed) ? parsed : parsed.orders || [];
  } catch {
    orders = [];
  }
  return { orders, sha: data.sha };
}

async function ghWriteOrders(orders, sha) {
  const body = {
    message: `orders: sync ${orders[0]?.orderId || "update"}`,
    content: Buffer.from(JSON.stringify(orders.slice(0, 150), null, 2)).toString("base64"),
    branch: GH_BRANCH,
  };
  if (sha) body.sha = sha;
  const url = `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/${GH_PATH}`;
  const r = await fetch(url, {
    method: "PUT",
    headers: await ghHeaders(),
    body: JSON.stringify(body),
  });
  if (!r.ok) {
    const err = await r.text();
    throw new Error("GitHub write failed " + r.status + " " + err.slice(0, 200));
  }
  return true;
}

async function saveOrder(order) {
  const id = order.orderId;
  memory.set(id, order);
  memoryList.unshift(id);
  if (memoryList.length > 200) memoryList.pop();

  if (hasUpstash()) {
    try {
      await redis("SET", [`gds:order:${id}`, JSON.stringify(order)]);
      await redis("ZADD", ["gds:orders", Date.now(), id]);
    } catch (e) {
      console.error("Upstash save", e.message);
    }
  }

  if (hasGitHub()) {
    try {
      const { orders, sha } = await ghReadOrders();
      const idx = orders.findIndex((o) => o.orderId === id);
      if (idx >= 0) orders[idx] = order;
      else orders.unshift(order);
      await ghWriteOrders(orders.slice(0, 150), sha);
    } catch (e) {
      console.error("GitHub save", e.message);
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
      console.error("Upstash get", e.message);
    }
  }

  if (hasGitHub()) {
    try {
      const { orders } = await ghReadOrders();
      const o = orders.find((x) => x.orderId === orderId);
      if (o) {
        memory.set(orderId, o);
        return o;
      }
    } catch (e) {
      console.error("GitHub get", e.message);
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
      const ids = await redis("ZREVRANGE", ["gds:orders", 0, limit - 1]);
      const out = [];
      for (const id of ids || []) {
        const o = await getOrder(id);
        if (o) out.push(o);
      }
      if (out.length) return out;
    } catch (e) {
      console.error("Upstash list", e.message);
    }
  }

  if (hasGitHub()) {
    try {
      const { orders } = await ghReadOrders();
      if (orders.length) return orders.slice(0, limit);
    } catch (e) {
      console.error("GitHub list", e.message);
    }
  }

  return memoryList
    .slice(0, limit)
    .map((id) => memory.get(id))
    .filter(Boolean);
}

async function notifyTelegram(text) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return false;
  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: true }),
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

function storageMode() {
  if (hasUpstash()) return "redis";
  if (hasGitHub()) return "github";
  return "memory";
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
  hasGitHub,
  storageMode,
};
