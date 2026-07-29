// DXB Analytics — Single Proxy Function
// Handles: Claude AI + Yahoo Finance + Exchange Rates
// One function = stays within Vercel Hobby 12 function limit
//
// SECURITY:
//   ?service=claude  -> requires a valid Firebase ID token (it spends money).
//   ?service=stock   -> open (free, cached upstream), but origin-locked.
//   ?service=rates   -> open (free, cached upstream), but origin-locked.
// CORS is restricted to our own origins instead of "*", so a third-party site
// cannot call this endpoint from a visitor's browser.

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

// Returns the decoded token, or null after having already sent a 401.
async function requireAuth(req, res) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) {
    res.status(401).json({ error: "Sign in required" });
    return null;
  }
  try {
    return await admin.auth().verifyIdToken(token);
  } catch (err) {
    res.status(401).json({ error: "Invalid or expired session" });
    return null;
  }
}

module.exports = async function handler(req, res) {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { service } = req.query;

  // ── Claude AI Proxy (authenticated — this one is billed to us) ──
  if (service === 'claude') {
    if (req.method !== 'POST') return res.status(405).json({ error: 'POST required' });

    const user = await requireAuth(req, res);
    if (!user) return; // 401 already sent

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify(req.body),
      });
      const data = await response.json();
      return res.status(response.status).json(data);
    } catch (err) {
      return res.status(500).json({ error: 'Claude proxy error', message: err.message });
    }
  }

  // ── Yahoo Finance Stock Proxy ──
  if (service === 'stock') {
    const { symbol = 'EMAAR.DU', range = '1y', interval = '1d' } = req.query;
    res.setHeader('Cache-Control', 'public, s-maxage=300');
    try {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=${encodeURIComponent(interval)}&range=${encodeURIComponent(range)}`;
      const response = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });
      const data = await response.json();
      return res.status(200).json(data);
    } catch (err) {
      return res.status(500).json({ error: 'Stock proxy error', message: err.message });
    }
  }

  // ── Exchange Rates Proxy ──
  if (service === 'rates') {
    res.setHeader('Cache-Control', 'public, s-maxage=3600');
    try {
      const response = await fetch('https://open.er-api.com/v6/latest/AED');
      const data = await response.json();
      return res.status(200).json(data);
    } catch (err) {
      // Fallback static rates if API fails
      return res.status(200).json({
        result: 'success',
        base_code: 'AED',
        rates: {
          USD:0.2723, GBP:0.2154, EUR:0.2511, INR:22.65, RUB:24.94,
          CNY:1.977, PKR:76.28, SAR:1.0211, CHF:0.2417, CAD:0.3727,
          AUD:0.4235, JPY:40.82
        },
        time_last_update_utc: new Date().toUTCString()
      });
    }
  }

  return res.status(400).json({ error: 'Unknown service. Use ?service=claude|stock|rates' });
}
