/**
 * DXB ANALYTICS — AUDIT LOG REST API
 * Firebase Cloud Function: https://us-central1-dxb-analytics.cloudfunctions.net/auditLogApi
 *
 * Endpoints:
 *   GET  /auditLogApi/logs        — fetch audit events
 *   GET  /auditLogApi/stats       — summary counts
 *   POST /auditLogApi/apikey      — generate new API key (admin only)
 *   GET  /auditLogApi/health      — health check (no auth)
 *
 * Auth: pass header  X-API-Key: <key>
 *       or query     ?apiKey=<key>
 *
 * Filter params for /logs:
 *   from      ISO date string  e.g. 2026-01-01
 *   to        ISO date string  e.g. 2026-03-31
 *   action    event type       e.g. tier_change
 *   actor     admin email      e.g. admin@dxb.ae
 *   ip        IP address       e.g. 1.2.3.4
 *   limit     max results      default 100, max 1000
 *   offset    pagination       default 0
 *   format    json|csv         default json
 */

const { onRequest } = require("firebase-functions/v2/https");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { createHash, randomBytes } = require("crypto");

initializeApp();
const db = getFirestore();

/* ─── CORS headers ─── */
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-API-Key",
  "Access-Control-Max-Age": "86400",
};

function cors(res) {
  Object.entries(CORS).forEach(([k, v]) => res.set(k, v));
}

/* ─── Auth helper ─── */
async function validateApiKey(req) {
  const key = req.headers["x-api-key"] || req.query.apiKey;
  if (!key) return { valid: false, reason: "Missing API key. Pass X-API-Key header or ?apiKey= query param." };

  try {
    const hash = createHash("sha256").update(key).digest("hex");
    const snap = await db.collection("adminSettings").doc("apiKeys").get();
    if (!snap.exists()) return { valid: false, reason: "No API keys configured. Generate one in Admin Panel → Audit Log → API Settings." };

    const keys = snap.data().keys || [];
    const found = keys.find(k => k.hash === hash && k.active !== false);
    if (!found) return { valid: false, reason: "Invalid or revoked API key." };

    // Update last used
    const updated = keys.map(k => k.hash === hash ? { ...k, lastUsed: new Date().toISOString(), useCount: (k.useCount || 0) + 1 } : k);
    db.collection("adminSettings").doc("apiKeys").set({ keys: updated }, { merge: true }).catch(() => {});

    return { valid: true, keyMeta: found };
  } catch (e) {
    return { valid: false, reason: "Auth check failed: " + e.message };
  }
}

/* ─── Convert Firestore docs to plain objects ─── */
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

/* ─── Convert logs array to CSV ─── */
function toCSV(logs) {
  const headers = ["id", "changedAt", "action", "changedBy", "ip", "uid", "from", "to", "newTier", "projectId", "communityKey", "tabKey", "exportedCount", "days", "urlSet", "threshold"];
  const rows = [headers.join(",")];
  for (const log of logs) {
    const row = headers.map(h => {
      const v = log[h];
      if (v === undefined || v === null) return "";
      const s = Array.isArray(v) ? v.join("|") : String(v);
      return `"${s.replace(/"/g, '""')}"`;
    });
    rows.push(row.join(","));
  }
  return rows.join("\n");
}

/* ══════════════════════════════════════════════════
   MAIN HANDLER
══════════════════════════════════════════════════ */
exports.auditLogApi = onRequest({ region: "us-central1", cors: false }, async (req, res) => {
  cors(res);

  // Preflight
  if (req.method === "OPTIONS") return res.status(204).send("");

  const path = req.path.replace(/^\/+/, "").split("/")[0] || "logs";

  /* ── Health check — no auth ── */
  if (path === "health") {
    return res.status(200).json({
      status: "ok",
      service: "DXB Analytics Audit Log API",
      version: "1.0.0",
      project: "dxb-analytics",
      timestamp: new Date().toISOString(),
      endpoints: {
        "GET /health":  "This health check",
        "GET /logs":    "Fetch audit events (auth required)",
        "GET /stats":   "Summary counts (auth required)",
        "POST /apikey": "Generate new API key (admin auth required)",
      },
    });
  }

  /* ── All other routes require auth ── */
  const auth = await validateApiKey(req);
  if (!auth.valid) {
    return res.status(401).json({
      error: "Unauthorized",
      message: auth.reason,
      docs: "https://emaar-dashboard.vercel.app/admin → Audit Log → API Settings",
    });
  }

  /* ── GET /logs ── */
  if (path === "logs" && req.method === "GET") {
    try {
      const {
        from, to, action, actor, ip,
        limit: limitStr = "100",
        offset: offsetStr = "0",
        format = "json",
      } = req.query;

      const limitN = Math.min(parseInt(limitStr) || 100, 1000);
      const offsetN = parseInt(offsetStr) || 0;

      // Fetch from Firestore (ordered by changedAt desc)
      let query = db.collection("auditLog").orderBy("changedAt", "desc").limit(limitN + offsetN + 500);
      const snap = await query.get();

      let logs = [];
      snap.forEach(d => logs.push({ id: d.id, ...plainify(d.data()) }));

      // Apply filters (Firestore free tier can't multi-index, so filter in memory)
      if (from)   logs = logs.filter(l => l.changedAt >= from);
      if (to)     logs = logs.filter(l => l.changedAt <= to + "T23:59:59Z");
      if (action) logs = logs.filter(l => l.action === action);
      if (actor)  logs = logs.filter(l => (l.changedBy || "").toLowerCase().includes(actor.toLowerCase()));
      if (ip)     logs = logs.filter(l => (l.ip || "") === ip);

      // Pagination
      const total = logs.length;
      logs = logs.slice(offsetN, offsetN + limitN);

      // Log this API access (best effort)
      db.collection("auditLog").doc(`${Date.now()}_api`).set({
        action: "api_access",
        endpoint: "/logs",
        changedBy: auth.keyMeta?.label || "api",
        changedAt: new Date().toISOString(),
        resultCount: logs.length,
      }).catch(() => {});

      if (format === "csv") {
        res.set("Content-Type", "text/csv");
        res.set("Content-Disposition", `attachment; filename="audit-log-${new Date().toISOString().slice(0,10)}.csv"`);
        return res.status(200).send(toCSV(logs));
      }

      return res.status(200).json({
        ok: true,
        meta: {
          total,
          returned: logs.length,
          offset: offsetN,
          limit: limitN,
          filters: { from, to, action, actor, ip },
          generatedAt: new Date().toISOString(),
        },
        data: logs,
      });
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
        if (now - t < 86400000) today++;
        if (now - t < 7 * 86400000) thisWeek++;
        if (l.ip && l.ip !== "unknown") withIP++;
      }

      // Unique actors
      const actors = [...new Set(logs.map(l => l.changedBy).filter(Boolean))];

      return res.status(200).json({
        ok: true,
        stats: {
          total: logs.length,
          today,
          thisWeek,
          ipTracked: withIP,
          uniqueActors: actors.length,
          actors,
          byAction: counts,
        },
        generatedAt: new Date().toISOString(),
      });
    } catch (e) {
      return res.status(500).json({ error: "Internal error", message: e.message });
    }
  }

  /* ── POST /apikey ── */
  if (path === "apikey" && req.method === "POST") {
    try {
      const { label = "API Key", revokeHash } = req.body || {};

      const snap = await db.collection("adminSettings").doc("apiKeys").get();
      let keys = snap.exists() ? (snap.data().keys || []) : [];

      // Revoke existing key
      if (revokeHash) {
        keys = keys.map(k => k.hash === revokeHash ? { ...k, active: false, revokedAt: new Date().toISOString() } : k);
        await db.collection("adminSettings").doc("apiKeys").set({ keys }, { merge: true });
        return res.status(200).json({ ok: true, message: "Key revoked." });
      }

      // Generate new key
      const rawKey = "dxb_" + randomBytes(24).toString("hex");
      const hash = createHash("sha256").update(rawKey).digest("hex");
      keys.push({ hash, label, createdAt: new Date().toISOString(), active: true, useCount: 0 });
      await db.collection("adminSettings").doc("apiKeys").set({ keys }, { merge: true });

      // Log it
      db.collection("auditLog").doc(`${Date.now()}_apikeygen`).set({
        action: "api_key_generated",
        changedBy: auth.keyMeta?.label || "api",
        changedAt: new Date().toISOString(),
        label,
      }).catch(() => {});

      return res.status(200).json({
        ok: true,
        message: "Store this key — it will not be shown again.",
        apiKey: rawKey,
        label,
        createdAt: new Date().toISOString(),
      });
    } catch (e) {
      return res.status(500).json({ error: "Internal error", message: e.message });
    }
  }

  return res.status(404).json({
    error: "Not found",
    availableEndpoints: ["GET /health", "GET /logs", "GET /stats", "POST /apikey"],
  });
});
