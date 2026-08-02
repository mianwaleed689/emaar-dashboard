/**
 * DXB Analytics — S9 FIX: EIBOR Auto-Fetch
 * File: api/cron-eibor.js
 *
 * FIX: CBUAE website is JS-rendered — server fetch gets empty HTML.
 * NEW APPROACH: 4 sources tried in order, first success wins:
 *   1. CBUAE JSON endpoint (direct API attempt)
 *   2. CBUAE HTML page scrape (parse table values)
 *   3. Investing.com EIBOR page scrape
 *   4. Hardcoded verified fallback (updated manually each quarter)
 *
 * Schedule: Daily 11:30AM UAE (07:30 UTC) — "30 7 * * *"
 * Iron Rule: NEVER run npx vercel --prod — use git push only
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

/* ── Hardcoded fallback ──────────────────────────────────────────────────────
   Refreshed 2026-08-02 from the CBUAE table, rates dated 31 July 2026. The
   previous block was from March and was five months stale, which understated a
   client's monthly payment on an AED 2M purchase by AED 285.

   HOW TO REFRESH THESE. The endpoint returns 403 to anything that is not a real
   browser — cookies do not help, the block is on the TLS fingerprint — so open
   https://www.centralbank.ae/en/forex-eibor/eibor-rates/ in an ordinary browser
   and read the top row of the table. Update FALLBACK_DATE in the same edit: the
   date is what stops the Mortgage tab presenting these as today's rates.
   See B-16 in LAUNCH_READINESS.md for why this is manual. */
const FALLBACK_DATE = "31 Jul 2026";
const FALLBACK = {
  overnight:   3.5286,
  oneWeek:     3.7847,
  oneMonth:    3.7818,
  threeMonth:  3.9399,
  sixMonth:    3.9520,
  twelveMonth: 4.2560,
};

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  "Accept":     "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.5",
};

/**
 * ── Source 1: the CBUAE rate table ──────────────────────────────────────────
 *
 * GetEiborData is the partial the EIBOR page fetches over AJAX and drops into
 * the DOM. It is what makes the page look JS-rendered, and it contains the
 * fully-formed rate table.
 *
 * It returns HTML. This function used to call res.json() on it, which throws
 * on the first character, and the throw landed in a bare `catch {}`. Sources 2
 * and 3 then failed for their own reasons — source 2 scrapes the JS-rendered
 * page this endpoint exists to populate, and investing.com now 404s — so the
 * job fell through to a hardcoded rate from March 2026 and logged a tick.
 *
 * That is the worst shape a failure can take: the cron fired every weekday,
 * returned 200, and published a five-month-old number as though it were live.
 * Verified against the endpoint on 2026-08-02, which served rates dated 31 July
 * 2026 — the data had been there the whole time.
 *
 * The table looks like this, with the dates in Arabic and the numbers plain:
 *
 *     Date | O/N | 1 Week | 1 Month | 3 Months | 6 Months | 1 Year | Value Date
 *     ...  | 3.528650 | 3.784680 | 3.781780 | 3.939870 | 3.951990 | 4.256020 | ...
 *
 * The first table on the page carries exactly one data row, the most recent.
 */
const TENOR_ORDER = ["overnight", "oneWeek", "oneMonth",
                     "threeMonth", "sixMonth", "twelveMonth"];

function parseEiborTable(html) {
  const strip = s => s.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

  for (const table of html.match(/<table[\s\S]*?<\/table>/gi) || []) {
    const rows = table.match(/<tr[\s\S]*?<\/tr>/gi) || [];
    if (rows.length < 2) continue;

    // Confirm this is the rate table and not some other grid on the page.
    const header = strip(rows[0]).toLowerCase();
    if (!/o\/n/.test(header) || !/1 ?week/.test(header)) continue;

    // Last data row is the newest — true whether the table holds one row or a
    // full month of them.
    for (let i = rows.length - 1; i >= 1; i--) {
      const cells = (rows[i].match(/<t[dh][\s\S]*?<\/t[dh]>/gi) || [])
        .map(strip).filter(Boolean);
      // Date, six rates, value date. Skip the two date columns.
      const nums = cells
        .map(c => parseFloat(c))
        .filter(v => Number.isFinite(v) && v > 0 && v < 20);
      if (nums.length < 6) continue;

      const rates = {};
      TENOR_ORDER.forEach((key, j) => {
        if (Number.isFinite(nums[j])) rates[key] = nums[j];
      });
      if (Object.keys(rates).length >= 4) {
        return { rates, asOf: cells[0] || null };
      }
    }
  }
  return null;
}

async function tryDirectAPI() {
  const urls = [
    "https://www.centralbank.ae/umbraco/Surface/Eibor/GetEiborData",
    "https://www.centralbank.ae/en/forex-eibor/eibor-rates/?outputType=json",
  ];

  for (const url of urls) {
    try {
      const res = await fetch(url, {
        headers: { ...HEADERS, "Accept": "text/html,application/json,*/*" },
        signal: AbortSignal.timeout(12000),
      });
      if (!res.ok) {
        console.warn(`[S9] Source 1 ${res.status} from ${url}`);
        continue;
      }
      const body = await res.text();

      // HTML first — this is what the endpoint actually serves.
      const parsed = parseEiborTable(body);
      if (parsed) {
        console.log(`[S9] Source 1 (CBUAE table) success — rates dated ${parsed.asOf || "unknown"}`);
        return { rates: parsed.rates, source: "CBUAE EIBOR table", asOf: parsed.asOf };
      }

      // Kept in case CBUAE ever serves JSON here again.
      try {
        const data = JSON.parse(body);
        const rows = Array.isArray(data) ? data : (data?.Data || data?.data || data?.result || []);
        const rates = parseRateRows(rows);
        if (Object.keys(rates).length >= 4) {
          console.log("[S9] Source 1 (CBUAE JSON) success");
          return { rates, source: "CBUAE Direct API" };
        }
      } catch { /* not JSON — expected */ }

      console.warn(`[S9] Source 1 reached ${url} but found no rate table`);
    } catch (err) {
      console.warn(`[S9] Source 1 error on ${url}:`, err.message);
    }
  }
  return null;
}

// ── Source 2: CBUAE HTML page — parse table ───────────────────────────────────
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

// ── Source 3: Investing.com EIBOR rates page ──────────────────────────────────
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

    // Investing.com shows rates in a table — parse 4-decimal numbers in 1-10% range
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

// ── Parse rate rows from JSON ──────────────────────────────────────────────────
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

// ── Check if fallback needs updating (>30 days old) ──────────────────────────
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

// ── Main handler ──────────────────────────────────────────────────────────────
module.exports = async (req, res) => {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = req.headers["authorization"] || "";
    if (auth !== `Bearer ${cronSecret}`) return res.status(401).json({ error: "Unauthorized" });
  }

  const now     = new Date();
  const uaeTime = now.toLocaleString("en-AE", { timeZone: "Asia/Dubai" });
  console.log(`[S9 EIBOR] triggered — ${uaeTime}`);

  // Try sources in order — first success wins
  let result = null;
  let usedFallback = false;

  result = await tryDirectAPI();
  if (!result) result = await tryCBUAEHTML();
  if (!result) result = await tryInvestingCom();

  if (!result) {
    console.warn("[S9] All sources failed — using hardcoded fallback");
    result = { rates: FALLBACK, source: "Hardcoded fallback (CBUAE Mar 2026)" };
    usedFallback = true;
  }

  const { rates, source } = result;

  // Always ensure all 6 tenors present — fill any gaps from fallback
  const finalRates = { ...FALLBACK, ...rates };

  /* Which tenors are real and which came from the hardcoded block. A partial
     fetch used to be indistinguishable from a complete one. */
  const liveTenors = Object.keys(rates || {});
  const fallbackTenors = Object.keys(FALLBACK).filter(k => !liveTenors.includes(k));

  const payload = {
    ...finalRates,
    updatedAt:    now.toISOString(),
    updatedAtUAE: uaeTime,
    source,
    usedFallback,
    liveTenors,
    fallbackTenors,
    rateDate:     result.asOf || (usedFallback ? FALLBACK_DATE : null),
    fetchedBy:    "api/cron-eibor.js",
    freshness:    { greenDays: 1, yellowDays: 7 },
  };

  /* ── asOf MUST DESCRIBE THE RATE, NOT THE JOB ──────────────────────────────
     This read `asOf: now.toLocaleDateString(...)` unconditionally. On every
     fallback it stamped today's date onto the hardcoded March 2026 rate, so the
     Mortgage tab — which reads this document — displayed a five-month-old
     number as if it had been fetched that morning. The job ran, wrote a false
     date, logged a tick, and nothing downstream could tell.

     A date here now means the date of the rate. When the rate is the hardcoded
     fallback, that is the date the fallback was captured, not today. */
  const tabDataPayload = {
    "1m":    finalRates.oneMonth,
    "3m":    finalRates.threeMonth,
    "6m":    finalRates.sixMonth,
    "1y":    finalRates.twelveMonth,
    asOf:    usedFallback
               ? FALLBACK_DATE
               : (result.asOf || now.toLocaleDateString("en-AE",
                   { day: "numeric", month: "short", year: "numeric" })),
    source:  usedFallback ? "Fallback — not live" : "UAE Central Bank",
    usedFallback,
    stale:   usedFallback,
    updatedAt: now.toISOString(),
    updatedBy: "cron",
  };

  try {
    await db.collection("marketData").doc("eibor").set(payload, { merge: true });
    // Write 2: tabData/eiborRates - the one Mortgage tab actually reads
    await db.collection("tabData").doc("eiborRates").set(tabDataPayload, { merge: true });
    if (usedFallback) {
      console.error(`[S9 EIBOR] WROTE STALE FALLBACK from ${FALLBACK_DATE} — ` +
                    `every live source failed. The rate on the Mortgage tab is ` +
                    `not current. This is a failure, not a success.`);
    } else {
      console.log(`[S9 EIBOR] Firestore updated — ${source}, rates dated ` +
                  `${result.asOf || "today"} ✅`);
    }
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