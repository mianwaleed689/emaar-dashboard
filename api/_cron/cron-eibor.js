/**
 * DXB Analytics â€” S9 FIX: EIBOR Auto-Fetch
 * File: api/cron-eibor.js
 *
 * FIX: CBUAE website is JS-rendered â€” server fetch gets empty HTML.
 * NEW APPROACH: 4 sources tried in order, first success wins:
 *   1. CBUAE JSON endpoint (direct API attempt)
 *   2. CBUAE HTML page scrape (parse table values)
 *   3. Investing.com EIBOR page scrape
 *   4. Hardcoded verified fallback (updated manually each quarter)
 *
 * Schedule: Daily 11:30AM UAE (07:30 UTC) â€” "30 7 * * *"
 * Iron Rule: NEVER run npx vercel --prod â€” use git push only
 */

const { initializeApp, cert, getApps } = require("firebase-admin/app");
const { getFirestore }                  = require("firebase-admin/firestore");

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId:   process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey:  (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
    }),
  });
}
const db = getFirestore();

// â”€â”€ Verified fallback â€” updated from CBUAE website March 2026 â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Source: https://www.centralbank.ae/en/forex-eibor/eibor-rates/
const FALLBACK = {
  overnight:   3.3755,
  oneWeek:     3.6728,
  oneMonth:    3.6426,
  threeMonth:  3.6387,
  sixMonth:    3.5999,
  twelveMonth: 3.8346,
};

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  "Accept":     "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.5",
};

// â”€â”€ Source 1: CBUAE direct JSON API â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
async function tryDirectAPI() {
  const urls = [
    "https://www.centralbank.ae/umbraco/Surface/Eibor/GetEiborData",
    "https://www.centralbank.ae/en/forex-eibor/eibor-rates/?outputType=json",
  ];

  for (const url of urls) {
    try {
      const res = await fetch(url, {
        headers: { ...HEADERS, "Accept": "application/json, */*" },
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) continue;
      const data = await res.json();
      const rows = Array.isArray(data) ? data : (data?.Data || data?.data || data?.result || []);
      const rates = parseRateRows(rows);
      if (Object.keys(rates).length >= 4) {
        console.log("[S9] Source 1 (CBUAE JSON) success");
        return { rates, source: "CBUAE Direct API" };
      }
    } catch {}
  }
  return null;
}

// â”€â”€ Source 2: CBUAE HTML page â€” parse table â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
async function tryCBUAEHTML() {
  try {
    const res = await fetch("https://www.centralbank.ae/en/forex-eibor/eibor-rates/", {
      headers: HEADERS,
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) return null;
    const html = await res.text();

    // Parse rate values from HTML table
    // Pattern: look for numeric rate values next to tenor labels
    const rates = {};
    const patterns = [
      { key: "overnight",   regex: /overnight[^<]*<[^>]+>\s*([\d.]+)/i },
      { key: "oneWeek",     regex: /1\s*week[^<]*<[^>]+>\s*([\d.]+)/i },
      { key: "oneMonth",    regex: /1\s*month[^<]*<[^>]+>\s*([\d.]+)/i },
      { key: "threeMonth",  regex: /3\s*months?[^<]*<[^>]+>\s*([\d.]+)/i },
      { key: "sixMonth",    regex: /6\s*months?[^<]*<[^>]+>\s*([\d.]+)/i },
      { key: "twelveMonth", regex: /12\s*months?[^<]*<[^>]+>\s*([\d.]+)/i },
    ];

    // Also try JSON embedded in page
    const jsonMatch = html.match(/"overnight"[^}]*"rate"\s*:\s*([\d.]+)/i) ||
                      html.match(/EIBOR[^{]*\{([^}]*)\}/i);

    for (const p of patterns) {
      const m = html.match(p.regex);
      if (m) {
        const val = parseFloat(m[1]);
        if (val > 0 && val < 20) rates[p.key] = val;
      }
    }

    // Try alternate pattern: all numbers that look like rates (2-6%) near EIBOR context
    if (Object.keys(rates).length < 3) {
      const rateMatches = html.match(/(\d\.\d{4})/g) || [];
      const validRates = rateMatches
        .map(parseFloat)
        .filter(r => r > 1 && r < 10)
        .slice(0, 6);

      const keys = ["overnight", "oneWeek", "oneMonth", "threeMonth", "sixMonth", "twelveMonth"];
      if (validRates.length >= 4) {
        validRates.forEach((r, i) => { if (keys[i]) rates[keys[i]] = r; });
      }
    }

    if (Object.keys(rates).length >= 4) {
      console.log("[S9] Source 2 (CBUAE HTML) success");
      return { rates, source: "CBUAE HTML scrape" };
    }
  } catch (err) {
    console.warn("[S9] Source 2 failed:", err.message);
  }
  return null;
}

// â”€â”€ Source 3: Investing.com EIBOR rates page â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
async function tryInvestingCom() {
  try {
    const res = await fetch("https://www.investing.com/rates-bonds/uae-interbank-rate", {
      headers: {
        ...HEADERS,
        "Referer": "https://www.investing.com/",
        "X-Requested-With": "XMLHttpRequest",
      },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;
    const html = await res.text();

    // Investing.com shows rates in a table â€” parse 4-decimal numbers in 1-10% range
    const rateMatches = html.match(/(\d\.\d{2,4})/g) || [];
    const validRates = [...new Set(rateMatches.map(parseFloat))]
      .filter(r => r > 1.5 && r < 8)
      .slice(0, 6);

    if (validRates.length >= 4) {
      const keys = ["overnight", "oneWeek", "oneMonth", "threeMonth", "sixMonth", "twelveMonth"];
      const rates = {};
      validRates.forEach((r, i) => { if (keys[i]) rates[keys[i]] = r; });
      console.log("[S9] Source 3 (Investing.com) success");
      return { rates, source: "Investing.com" };
    }
  } catch (err) {
    console.warn("[S9] Source 3 failed:", err.message);
  }
  return null;
}

// â”€â”€ Parse rate rows from JSON â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function parseRateRows(rows) {
  const TENOR_MAP = {
    "Overnight": "overnight", "Over Night": "overnight",
    "1 Week": "oneWeek",     "One Week": "oneWeek",
    "1 Month": "oneMonth",   "One Month": "oneMonth",
    "3 Months": "threeMonth","Three Month": "threeMonth", "3 Month": "threeMonth",
    "6 Months": "sixMonth",  "Six Month": "sixMonth",     "6 Month": "sixMonth",
    "12 Months": "twelveMonth","12 Month": "twelveMonth", "One Year": "twelveMonth",
  };
  const rates = {};
  rows.forEach(row => {
    const name  = (row.TenorName || row.Name || row.tenor || row.label || "").trim();
    const value = row.TenorValue || row.Value || row.Rate || row.rate || row.value || 0;
    const key   = TENOR_MAP[name];
    if (key) {
      const parsed = parseFloat(value);
      if (!isNaN(parsed) && parsed > 0 && parsed < 20) rates[key] = parsed;
    }
  });
  return rates;
}

// â”€â”€ Check if fallback needs updating (>30 days old) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
async function checkFallbackAge() {
  try {
    const snap = await db.collection("marketData").doc("eibor").get();
    if (!snap.exists()) return true;
    const data = snap.data();
    if (!data.updatedAt) return true;
    const age = Date.now() - new Date(data.updatedAt).getTime();
    return age > 30 * 24 * 60 * 60 * 1000; // >30 days
  } catch { return true; }
}

// â”€â”€ Main handler â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
module.exports = async (req, res) => {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = req.headers["authorization"] || "";
    if (auth !== `Bearer ${cronSecret}`) return res.status(401).json({ error: "Unauthorized" });
  }

  const now     = new Date();
  const uaeTime = now.toLocaleString("en-AE", { timeZone: "Asia/Dubai" });
  console.log(`[S9 EIBOR] triggered â€” ${uaeTime}`);

  // Try sources in order â€” first success wins
  let result = null;
  let usedFallback = false;

  result = await tryDirectAPI();
  if (!result) result = await tryCBUAEHTML();
  if (!result) result = await tryInvestingCom();

  if (!result) {
    console.warn("[S9] All sources failed â€” using hardcoded fallback");
    result = { rates: FALLBACK, source: "Hardcoded fallback (CBUAE Mar 2026)" };
    usedFallback = true;
  }

  const { rates, source } = result;

  // Always ensure all 6 tenors present â€” fill any gaps from fallback
  const finalRates = { ...FALLBACK, ...rates };

  const payload = {
    ...finalRates,
    updatedAt:    now.toISOString(),
    updatedAtUAE: uaeTime,
    source,
    usedFallback,
    fetchedBy:    "api/cron-eibor.js",
    freshness:    { greenDays: 1, yellowDays: 7 },
  };

  // Build admin-compatible payload for tabData/eiborRates
  // (Mortgage tab reads from this doc via liveEiborRates in EmaarDashboardV2)
  const tabDataPayload = {
    "1m":    finalRates.oneMonth,
    "3m":    finalRates.threeMonth,
    "6m":    finalRates.sixMonth,
    "1y":    finalRates.twelveMonth,
    asOf:    now.toLocaleDateString("en-AE", { day: "numeric", month: "short", year: "numeric" }),
    source:  source.includes("Hardcoded") ? "Fallback" : "UAE Central Bank",
    updatedAt: now.toISOString(),
    updatedBy: "cron",
  };

  try {
    await db.collection("marketData").doc("eibor").set(payload, { merge: true });
    // Write 2: tabData/eiborRates - the one Mortgage tab actually reads
    await db.collection("tabData").doc("eiborRates").set(tabDataPayload, { merge: true });
    console.log(`[S9 EIBOR] Firestore updated â€” source: ${source} âœ…`);
  } catch (err) {
    console.error("[S9 EIBOR] Firestore write failed:", err.message);
    return res.status(500).json({ ok: false, error: err.message });
  }

  return res.status(200).json({
    ok: true, usedFallback, source,
    rates: finalRates,
    updatedAt: now.toISOString(),
    uaeTime,
  });
};