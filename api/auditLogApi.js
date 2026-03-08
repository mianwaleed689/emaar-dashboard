/**
 * DXB ANALYTICS — AUDIT LOG REST API
 * Vercel Serverless Function (free, no credit card)
 * URL: https://emaar-dashboard.vercel.app/api/auditLogApi
 */

const { initializeApp, getApps, cert } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { createHash, randomBytes } = require("crypto");

// Init Firebase Admin (once)
function getDB() {
  if (!getApps().length) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    initializeApp({ credential: cert(serviceAccount) });
  }
  return getFirestore();
}

/* ─── CORS ─── */
function setCORS(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-API-Key");
}

/* ─── Auth helper ─── */
async function validateApiKey(req, db) {
  const key = req.headers["x-api-key"] || req.query.apiKey;
  if (!key) return { valid: false, reason: "Missing API key. Pass X-API-Key header or ?apiKey= query param." };
  try {
    const hash = createHash("sha256").update(key).digest("hex");
    const snap = await db.collection("adminSettings").doc("apiKeys").get();
    if (!snap.exists) return { valid: false, reason: "No API keys configured. Generate one in Admin Panel → Audit Log." };
    const keys = snap.data().keys || [];
    const found = keys.find(k => k.hash === hash && k.active !== false);
    if (!found) return { valid: false, reason: "Invalid or revoked API key." };
    // Update usage stats
    const updated = keys.map(k => k.hash === hash ? { ...k, lastUsed: new Date().toISOString(), useCount: (k.useCount || 0) + 1 } : k);
    db.collection("adminSettings").doc("apiKeys").set({ keys: updated }, { merge: true }).catch(() => {});
    return { valid: true, keyMeta: found };
  } catch (e) {
    return { valid: false, reason: "Auth check failed: " + e.message };
  }
}

/* ─── Helpers ─── */
function plainify(data) {
  if (!data) return data;
  if (typeof data.toDate === "function") return data.toDate().toISOString();
  if (Array.isArray(data)) return data.map(plainify);
  if (typeof data === "object") {
    const out = {};
    for (const [k, v] of Object.entries(data)) out[k] = plainify(v);
    return out;
  }
  return data;
}

function toCSV(logs) {
  const headers = ["id","changedAt","action","changedBy","ip","uid","from","to","newTier","projectId","communityKey","tabKey","exportedCount"];
  const rows = [headers.join(",")];
  for (const log of logs) {
    rows.push(headers.map(h => {
      const v = log[h];
      if (v == null) return "";
      return `"${String(Array.isArray(v) ? v.join("|") : v).replace(/"/g, '""')}"`;
    }).join(","));
  }
  return rows.join("\n");
}

/* ══════════════════════════════════════════════════
   MAIN HANDLER
══════════════════════════════════════════════════ */
module.exports = async function handler(req, res) {
  setCORS(res);
  if (req.method === "OPTIONS") return res.status(204).end();

  let db;
  try {
    db = getDB();
  } catch (e) {
    return res.status(500).json({ error: "Firebase init failed", message: e.message, hint: "Check FIREBASE_SERVICE_ACCOUNT env variable in Vercel." });
  }

  const path = (req.query.path || req.url.split("/api/auditLogApi/")[1] || "").replace(/^\/+/, "").split("?")[0] || "health";

  /* ── Health check ── */
  if (path === "health" || path === "") {
    return res.status(200).json({
      status: "ok",
      service: "DXB Analytics Audit Log API",
      version: "1.0.0",
      host: "vercel",
      timestamp: new Date().toISOString(),
      endpoints: {
        "GET /health":  "This health check (no auth)",
        "GET /logs":    "Fetch audit events (auth required)",
        "GET /stats":   "Summary counts (auth required)",
        "POST /apikey": "Generate/revoke API key (auth required)",
      },
    });
  }

  /* ── Auth required for all other routes ── */
  const auth = await validateApiKey(req, db);
  if (!auth.valid) {
    return res.status(401).json({ error: "Unauthorized", message: auth.reason });
  }

  /* ── GET /logs ── */
  if (path === "logs" && req.method === "GET") {
    try {
      const { from, to, action, actor, ip, limit: lim = "100", offset: off = "0", format = "json" } = req.query;
      const limitN = Math.min(parseInt(lim) || 100, 1000);
      const offsetN = parseInt(off) || 0;

      const snap = await db.collection("auditLog").orderBy("changedAt", "desc").limit(limitN + offsetN + 500).get();
      let logs = [];
      snap.forEach(d => logs.push({ id: d.id, ...plainify(d.data()) }));

      if (from)   logs = logs.filter(l => l.changedAt >= from);
      if (to)     logs = logs.filter(l => l.changedAt <= to + "T23:59:59Z");
      if (action) logs = logs.filter(l => l.action === action);
      if (actor)  logs = logs.filter(l => (l.changedBy || "").toLowerCase().includes(actor.toLowerCase()));
      if (ip)     logs = logs.filter(l => (l.ip || "") === ip);

      const total = logs.length;
      logs = logs.slice(offsetN, offsetN + limitN);

      if (format === "csv") {
        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", `attachment; filename="audit-log-${new Date().toISOString().slice(0,10)}.csv"`);
        return res.status(200).send(toCSV(logs));
      }

      return res.status(200).json({ ok: true, meta: { total, returned: logs.length, offset: offsetN, limit: limitN }, data: logs });
    } catch (e) {
      return res.status(500).json({ error: "Internal error", message: e.message });
    }
  }

  /* ── GET /stats ── */
  if (path === "stats" && req.method === "GET") {
    try {
      const snap = await db.collection("auditLog").get();
      const logs = [];
      snap.forEach(d => logs.push(d.data()));
      const now = Date.now();
      const counts = {};
      let thisWeek = 0, today = 0, withIP = 0;
      for (const l of logs) {
        counts[l.action] = (counts[l.action] || 0) + 1;
        const t = new Date(l.changedAt || 0).getTime();
        if (now - t < 86400000)        today++;
        if (now - t < 7 * 86400000)    thisWeek++;
        if (l.ip && l.ip !== "unknown") withIP++;
      }
      const actors = [...new Set(logs.map(l => l.changedBy).filter(Boolean))];
      return res.status(200).json({ ok: true, stats: { total: logs.length, today, thisWeek, ipTracked: withIP, uniqueActors: actors.length, actors, byAction: counts }, generatedAt: new Date().toISOString() });
    } catch (e) {
      return res.status(500).json({ error: "Internal error", message: e.message });
    }
  }

  /* ── POST /apikey ── */
  if (path === "apikey" && req.method === "POST") {
    try {
      const { label = "API Key", revokeHash } = req.body || {};
      const snap = await db.collection("adminSettings").doc("apiKeys").get();
      let keys = snap.exists ? (snap.data().keys || []) : [];

      if (revokeHash) {
        keys = keys.map(k => k.hash === revokeHash ? { ...k, active: false, revokedAt: new Date().toISOString() } : k);
        await db.collection("adminSettings").doc("apiKeys").set({ keys }, { merge: true });
        return res.status(200).json({ ok: true, message: "Key revoked." });
      }

      const rawKey = "dxb_" + randomBytes(24).toString("hex");
      const hash = createHash("sha256").update(rawKey).digest("hex");
      keys.push({ hash, label, createdAt: new Date().toISOString(), active: true, useCount: 0 });
      await db.collection("adminSettings").doc("apiKeys").set({ keys }, { merge: true });

      db.collection("auditLog").doc(`${Date.now()}_apikeygen`).set({
        action: "api_key_generated", changedBy: auth.keyMeta?.label || "api",
        changedAt: new Date().toISOString(), label,
      }).catch(() => {});

      return res.status(200).json({ ok: true, message: "Store this key — shown once only.", apiKey: rawKey, label, createdAt: new Date().toISOString() });
    } catch (e) {
      return res.status(500).json({ error: "Internal error", message: e.message });
    }
  }

  return res.status(404).json({ error: "Not found", availableEndpoints: ["GET /health", "GET /logs", "GET /stats", "POST /apikey"] });
};
