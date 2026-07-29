/**
 * DXB Analytics — Server-side email sender
 * File: api/send-email.js
 *
 * POST /api/send-email   body: { to, subject, bodyText }
 *
 * Why this exists: the Resend API key must never reach the browser. Any key in
 * frontend code is compiled into the public JS bundle and can be downloaded by
 * anyone. This endpoint keeps the key on the server; the browser only asks the
 * server to send.
 *
 * Requires the caller to be an authenticated admin.
 *
 * Env vars (set in Vercel — note: NO "VITE_" prefix, that would publish them):
 *   RESEND_API_KEY   — the Resend key
 *   EMAIL_FROM       — e.g. "DXB Analytics <noreply@yourdomain.ae>"
 */

const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
    }),
  });
}

const ALLOWED_ORIGINS = [
  "https://emaar-dashboard.vercel.app",
  "http://localhost:5173",
  "http://localhost:3000",
];

const FROM = process.env.EMAIL_FROM || "DXB Analytics <onboarding@resend.dev>";

// Body text is plain text rendered inside a pre-wrap block. Escape it so a
// stray "<" cannot break the layout or inject markup.
function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderEmail(bodyText) {
  return `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px">
    <div style="border-bottom:2px solid #D4A843;padding-bottom:12px;margin-bottom:20px">
      <h2 style="color:#D4A843;margin:0;font-size:18px">DXB Analytics</h2>
      <p style="color:#64748B;margin:4px 0 0;font-size:11px">Dubai Real Estate Intelligence — Dubai, UAE</p>
    </div>
    <div style="color:#1E293B;font-size:14px;line-height:1.7;white-space:pre-wrap">${escapeHtml(bodyText)}</div>
    <div style="border-top:1px solid #E2E8F0;margin-top:24px;padding-top:12px;color:#94A3B8;font-size:11px">
      DXB Analytics — Dubai Real Estate Intelligence
    </div>
  </div>`;
}

module.exports = async function handler(req, res) {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  // ── Caller must be a signed-in admin ──
  const header = req.headers.authorization || "";
  const idToken = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!idToken) return res.status(401).json({ error: "Sign in required" });

  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    const callerDoc = await admin.firestore().doc(`users/${decoded.uid}`).get();
    const role = callerDoc.exists ? callerDoc.data()?.role : null;
    if (role !== "admin" && role !== "superAdmin") {
      return res.status(403).json({ error: "Not authorised" });
    }
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired session" });
  }

  if (!process.env.RESEND_API_KEY) {
    return res.status(500).json({ error: "Email is not configured (RESEND_API_KEY missing)" });
  }

  // ── Validate input ──
  const { to, subject, bodyText } = req.body || {};
  if (typeof to !== "string" || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(to)) {
    return res.status(400).json({ error: "A valid 'to' address is required" });
  }
  if (typeof subject !== "string" || !subject.trim() || subject.length > 200) {
    return res.status(400).json({ error: "'subject' is required (max 200 chars)" });
  }
  if (typeof bodyText !== "string" || !bodyText.trim() || bodyText.length > 20000) {
    return res.status(400).json({ error: "'bodyText' is required (max 20000 chars)" });
  }

  try {
    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: FROM, to, subject, html: renderEmail(bodyText) }),
    });

    const data = await resendRes.json().catch(() => ({}));
    if (!resendRes.ok) {
      // Surface the real reason so "sent" never means "silently failed".
      return res.status(resendRes.status).json({
        error: "Email provider rejected the message",
        detail: data?.message || data?.name || "unknown",
      });
    }
    return res.status(200).json({ ok: true, id: data?.id || null });
  } catch (err) {
    return res.status(500).json({ error: "Email send failed", message: err.message });
  }
};
