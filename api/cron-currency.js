const { initializeApp, cert, getApps } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
if (!getApps().length) { initializeApp({ credential: cert({ projectId: process.env.FIREBASE_PROJECT_ID, clientEmail: process.env.FIREBASE_CLIENT_EMAIL, privateKey: (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n") }) }); }
const db = getFirestore();
const CURRENCIES = ["USD","EUR","GBP","INR","PKR","SAR","QAR","KWD","BHD","OMR","EGP","CNY","RUB"];
module.exports = async (req, res) => {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  try {
    const r = await fetch("https://api.exchangerate-api.com/v4/latest/AED", { signal: AbortSignal.timeout(10000) });
    if (!r.ok) throw new Error(`API HTTP ${r.status}`);
    const data = await r.json();
    const rates = {};
    CURRENCIES.forEach(c => { if (data.rates[c]) rates[c] = { rate: data.rates[c], aedPer1: (1/data.rates[c]).toFixed(4) }; });
    await db.collection("marketData").doc("currency").set({ base: "AED", rates, lastUpdated: new Date().toISOString(), source: "exchangerate-api.com" }, { merge: true });
    return res.status(200).json({ ok: true, ratesUpdated: Object.keys(rates).length, rates });
  } catch (err) { return res.status(500).json({ ok: false, error: err.message }); }
};