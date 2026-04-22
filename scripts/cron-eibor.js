/**
 * DXB Analytics — EIBOR Cron Job
 * Session 9 — scripts/cron-eibor.js
 *
 * Fetches live EIBOR rates from UAE Central Bank (CBUAE)
 * Writes to Firestore: marketData/eibor
 *
 * Schedule: Daily at 11:30 AM UAE time (07:30 UTC)
 * Run manually: node scripts/cron-eibor.js
 * Run via GitHub Actions: see .github/workflows/cron-eibor.yml
 *
 * Iron Rule: NEVER run npx vercel --prod
 */

const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore }        = require("firebase-admin/firestore");
const https                   = require("https");

// ── Firebase Admin init ──────────────────────────────────────────────────────
const serviceAccount = require("./serviceAccountKey.json");

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

// ── CBUAE EIBOR endpoint ─────────────────────────────────────────────────────
// UAE Central Bank publishes EIBOR daily at:
// https://www.centralbank.ae/en/forex-eibor/eibor/
// We use their public JSON feed (no API key required)
const CBUAE_URL = "https://www.centralbank.ae/umbraco/Surface/Eibor/GetEiborData";

// ── Fetch helper ─────────────────────────────────────────────────────────────
function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        "User-Agent": "DXB-Analytics/1.0 (contact@dxbanalytics.com)",
        "Accept": "application/json",
      },
    };
    https.get(url, options, (res) => {
      let data = "";
      res.on("data", (chunk) => { data += chunk; });
      res.on("end", () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(new Error("JSON parse failed: " + e.message)); }
      });
    }).on("error", reject);
  });
}

// ── Parse CBUAE response → standard shape ───────────────────────────────────
// CBUAE returns an array of rate objects. We extract the 6 standard tenors.
function parseRates(data) {
  // CBUAE structure: [{ TenorName, TenorValue, Date }, ...]
  // TenorName examples: "Overnight", "1 Week", "1 Month", "3 Months", "6 Months", "12 Months"
  const tenorMap = {
    "Overnight":  "overnight",
    "1 Week":     "oneWeek",
    "1 Month":    "oneMonth",
    "3 Months":   "threeMonth",
    "6 Months":   "sixMonth",
    "12 Months":  "twelveMonth",
  };

  const rates = {};
  const rows = Array.isArray(data) ? data : (data.Data || data.data || []);

  rows.forEach((row) => {
    const key = tenorMap[row.TenorName] || tenorMap[row.Name] || null;
    if (key) {
      const val = parseFloat(row.TenorValue ?? row.Value ?? row.Rate ?? 0);
      if (!isNaN(val) && val > 0) rates[key] = val;
    }
  });

  return rates;
}

// ── Fallback rates (last verified 27 March 2026) ─────────────────────────────
// Used only if CBUAE fetch fails — keeps Firestore from being wiped with nulls
const FALLBACK_RATES = {
  overnight:   3.3755,
  oneWeek:     3.6728,
  oneMonth:    3.6426,
  threeMonth:  3.6387,
  sixMonth:    3.5999,
  twelveMonth: 3.8346,
};

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const now = new Date();
  const uaeTime = now.toLocaleString("en-AE", { timeZone: "Asia/Dubai" });
  console.log(`\n[DXB Analytics] EIBOR Cron — ${uaeTime}`);

  let rates = {};
  let source = "CBUAE";
  let usedFallback = false;

  try {
    console.log("Fetching from CBUAE...");
    const data = await fetchJSON(CBUAE_URL);
    rates = parseRates(data);

    // Validate — we need at least 3 tenors
    if (Object.keys(rates).length < 3) {
      throw new Error(`Only ${Object.keys(rates).length} tenors parsed — too few`);
    }

    console.log("Parsed rates:", rates);
  } catch (err) {
    console.warn("CBUAE fetch failed:", err.message);
    console.warn("Using fallback rates from last verified session");
    rates = FALLBACK_RATES;
    source = "CBUAE (fallback — fetch failed)";
    usedFallback = true;
  }

  // ── Write to Firestore: marketData/eibor ──────────────────────────────────
  const payload = {
    ...rates,
    updatedAt:    now.toISOString(),
    updatedAtUAE: uaeTime,
    source,
    usedFallback,
    fetchedBy:    "cron-eibor.js",
    // Freshness helpers for the dashboard badge
    freshness: {
      green:  7,   // days — show green badge if < 7 days old
      yellow: 30,  // days — show yellow badge if < 30 days old
      // > 30 days = red badge
    },
  };

  try {
    await db.collection("marketData").doc("eibor").set(payload, { merge: true });
    console.log("Firestore updated: marketData/eibor ✅");
    console.log("Payload:", JSON.stringify(payload, null, 2));
  } catch (err) {
    console.error("Firestore write failed:", err.message);
    process.exit(1);
  }

  if (usedFallback) {
    console.warn("\n⚠️  Fallback rates used — check CBUAE endpoint manually");
    console.warn("   URL:", CBUAE_URL);
  } else {
    console.log("\n✅  EIBOR rates updated successfully");
  }

  process.exit(0);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
