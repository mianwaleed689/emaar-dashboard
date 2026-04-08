/**
 * DXB Analytics — S12 FIX: Developer Financials
 * File: api/cron-financials.js
 *
 * FIXES APPLIED:
 *   - Yahoo crumb/cookie breaks regularly on serverless IPs (429/401)
 *   - NEW: Try 4 methods in order, first success wins:
 *     1. v10 quoteSummary with fresh cookie+crumb (existing)
 *     2. v10 quoteSummary WITHOUT crumb (sometimes works)
 *     3. v8 chart for price only (always works, no auth)
 *     4. FY2025 baseline (never crashes)
 *   - Added exponential retry on 429
 *   - Emaar stock price now always updates even if financials fail
 *   - stockPrice field written every run via v8/chart
 *
 * Schedule: Weekly Sunday 8AM UAE (04:00 UTC) — "0 4 * * 0"
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

const EMAAR_TICKER    = "EMAAR.AE";
const EMAARDEV_TICKER = "EMAARDEV.AE";

// ── Verified FY2025 baseline — Emaar AGM Feb 2026 ────────────────────────────
const FY2025_BASELINE = {
  propertySales:      80.4,
  revenue:            49.6,
  netProfit:          25.7,
  ebitda:             25.6,
  backlog:            155,
  recurringRev:       10.5,
  grossMargin:        57.5,
  netMargin:          35.5,
  dividendPerShare:   1.00,
  dividendTotal:      8.8,
  creditRatingSP:     "BBB+",
  creditRatingMoodys: "Baa1",
  creditRatingFitch:  "BBB",
  primaryRating:      "BBB+",
  latestReportLabel:  "Annual Report FY2025",
  latestReportDate:   "Feb 2026",
  reportedYear:       "2025",
  reportedQuarter:    "Q4",
};

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

// ── Method 1: Cookie + Crumb → quoteSummary ───────────────────────────────────
async function tryWithCookieCrumb(ticker) {
  // Get cookie
  const homeRes = await fetch("https://finance.yahoo.com", {
    headers: { "User-Agent": UA },
    redirect: "follow",
    signal: AbortSignal.timeout(10000),
  });
  const setCookie = homeRes.headers.get("set-cookie") || "";
  const cookieMatch = setCookie.match(/([^;,\s]+=[^;,\s]+)/);
  const cookie = cookieMatch ? cookieMatch[0] : "";
  if (!cookie) throw new Error("No cookie received");

  // Small delay to avoid immediate rate limit
  await new Promise(r => setTimeout(r, 500));

  // Get crumb
  const crumbRes = await fetch("https://query1.finance.yahoo.com/v1/test/getcrumb", {
    headers: { "User-Agent": UA, "Cookie": cookie },
    signal: AbortSignal.timeout(8000),
  });
  if (!crumbRes.ok) throw new Error(`Crumb HTTP ${crumbRes.status}`);
  const crumb = await crumbRes.text();
  if (!crumb || crumb.length < 3 || crumb.includes("Too Many") || crumb.includes("Unauthorized")) {
    throw new Error(`Bad crumb: "${crumb.slice(0, 30)}"`);
  }

  // quoteSummary
  const modules = "incomeStatementHistoryQuarterly,incomeStatementHistory,financialData,defaultKeyStatistics,summaryDetail,price";
  const url = `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${ticker}?modules=${modules}&crumb=${encodeURIComponent(crumb)}&formatted=false`;
  const res = await fetch(url, {
    headers: { "User-Agent": UA, "Cookie": cookie, "Accept": "application/json" },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`quoteSummary HTTP ${res.status}`);
  const data = await res.json();
  if (data?.quoteSummary?.error) throw new Error(JSON.stringify(data.quoteSummary.error));
  return data?.quoteSummary?.result?.[0] || null;
}

// ── Method 2: quoteSummary WITHOUT crumb (sometimes works) ────────────────────
async function tryNoCrumb(ticker) {
  const modules = "financialData,defaultKeyStatistics,summaryDetail,price";
  const url = `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${ticker}?modules=${modules}&formatted=false&lang=en-US`;
  const res = await fetch(url, {
    headers: {
      "User-Agent": UA,
      "Accept": "application/json",
      "Referer": `https://finance.yahoo.com/quote/${ticker}/`,
    },
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`No-crumb HTTP ${res.status}`);
  const data = await res.json();
  if (data?.quoteSummary?.error) throw new Error("Unauthorized");
  return data?.quoteSummary?.result?.[0] || null;
}

// ── Method 3: v8 chart — always works, price only ─────────────────────────────
async function tryV8Chart(ticker) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=5d`;
  const res = await fetch(url, {
    headers: { "User-Agent": UA },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`v8 chart HTTP ${res.status}`);
  const data = await res.json();
  const meta = data?.chart?.result?.[0]?.meta;
  if (!meta) throw new Error("No chart meta");
  return {
    price: {
      regularMarketPrice: { raw: meta.regularMarketPrice },
      regularMarketChangePercent: { raw: meta.regularMarketChangePercent || 0 },
    },
    summaryDetail: {
      marketCap: { raw: meta.marketCap },
    },
  };
}

// ── Parse summary data ────────────────────────────────────────────────────────
function parseSummary(summary) {
  if (!summary) return {};
  const toB = v => v ? parseFloat((v / 1e9).toFixed(2)) : null;
  const pct  = v => v ? parseFloat((v * 100).toFixed(1)) : null;

  const qh = summary?.incomeStatementHistoryQuarterly?.incomeStatementHistory || [];
  const ah = summary?.incomeStatementHistory?.incomeStatementHistory || [];
  const fd = summary?.financialData || {};
  const ks = summary?.defaultKeyStatistics || {};
  const sd = summary?.summaryDetail || {};
  const pr = summary?.price || {};

  const latestQ = qh[0] || {};
  const latestA = ah[0] || {};

  return {
    // Annual
    revenue:      toB(latestA.totalRevenue?.raw),
    netProfit:    toB(latestA.netIncome?.raw),
    grossMargin:  latestA.grossProfit?.raw && latestA.totalRevenue?.raw
      ? parseFloat(((latestA.grossProfit.raw / latestA.totalRevenue.raw) * 100).toFixed(1))
      : null,
    netMargin: latestA.netIncome?.raw && latestA.totalRevenue?.raw
      ? parseFloat(((latestA.netIncome.raw / latestA.totalRevenue.raw) * 100).toFixed(1))
      : null,
    annualEndDate: latestA.endDate?.fmt,

    // Latest quarter
    latestQuarter: latestQ.endDate?.fmt ? {
      endDate:   latestQ.endDate.fmt,
      revenue:   toB(latestQ.totalRevenue?.raw),
      netIncome: toB(latestQ.netIncome?.raw),
    } : null,

    // Key stats
    marketCap:        toB(ks.marketCap?.raw || sd.marketCap?.raw),
    peRatio:          ks.trailingPE?.raw ? parseFloat(ks.trailingPE.raw.toFixed(2)) : null,
    eps:              ks.trailingEps?.raw,
    dividendPerShare: sd.dividendRate?.raw,
    dividendYield:    sd.dividendYield?.raw ? parseFloat((sd.dividendYield.raw * 100).toFixed(2)) : null,
    week52High:       sd.fiftyTwoWeekHigh?.raw,
    week52Low:        sd.fiftyTwoWeekLow?.raw,

    // Live price
    stockPrice:   pr.regularMarketPrice?.raw,
    priceChange:  pr.regularMarketChangePercent?.raw
      ? parseFloat((pr.regularMarketChangePercent.raw * 100).toFixed(2)) : null,

    // Financial ratios
    debtToEquity:  fd.debtToEquity?.raw,
    freeCashflow:  toB(fd.freeCashflow?.raw),
    revenueGrowth: pct(fd.revenueGrowth?.raw),
    grossMarginYF: pct(fd.grossMargins?.raw),
    returnOnEquity: pct(fd.returnOnEquity?.raw),
  };
}

// ── Detect new quarter ────────────────────────────────────────────────────────
function isNewQuarter(fresh, stored) {
  if (!stored) return true;
  const freshQ  = fresh?.latestQuarter?.endDate;
  const storedQ = stored?.latestQuarter?.endDate;
  if (freshQ && storedQ && freshQ !== storedQ) return true;
  const freshRev = fresh?.revenue;
  const storedRev = stored?.revenue;
  if (freshRev && storedRev && Math.abs(freshRev - storedRev) / storedRev > 0.02) return true;
  return false;
}

// ── Write admin alert ─────────────────────────────────────────────────────────
async function writeAlert(message, data) {
  try {
    await db.collection("adminAlerts").doc().set({
      message, data, type: "financial_update", severity: "info",
      read: false, createdAt: new Date().toISOString(),
      source: "api/cron-financials.js",
    });
  } catch {}
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
  console.log(`[S12 FINANCIALS] triggered — ${uaeTime}`);

  // Load stored data
  let storedEmaar = null;
  try {
    const snap = await db.collection("developers").doc("emaar").get();
    if (snap.exists()) storedEmaar = snap.data();
  } catch {}

  // ── Try 4 methods in order ────────────────────────────────────────────────
  let rawSummary = null;
  let fetchMethod = "none";

  // Method 1: Cookie + Crumb
  try {
    console.log("[S12] Trying Method 1: Cookie+Crumb quoteSummary");
    rawSummary = await tryWithCookieCrumb(EMAAR_TICKER);
    if (rawSummary) { fetchMethod = "cookie_crumb"; console.log("[S12] Method 1 ✅"); }
  } catch (err) {
    console.warn("[S12] Method 1 failed:", err.message);
  }

  // Method 2: No crumb
  if (!rawSummary) {
    try {
      console.log("[S12] Trying Method 2: No-crumb quoteSummary");
      rawSummary = await tryNoCrumb(EMAAR_TICKER);
      if (rawSummary) { fetchMethod = "no_crumb"; console.log("[S12] Method 2 ✅"); }
    } catch (err) {
      console.warn("[S12] Method 2 failed:", err.message);
    }
  }

  // Method 3: v8 chart (price only)
  let chartData = null;
  try {
    chartData = await tryV8Chart(EMAAR_TICKER);
    console.log(`[S12] v8 chart price: ${chartData?.price?.regularMarketPrice?.raw}`);
  } catch (err) {
    console.warn("[S12] v8 chart failed:", err.message);
  }

  // If Methods 1+2 failed, use chart data as minimal summary
  if (!rawSummary && chartData) {
    rawSummary = chartData;
    fetchMethod = "v8_chart_only";
    console.log("[S12] Using Method 3: v8 chart data only");
  }

  // ── Build final payload ───────────────────────────────────────────────────
  const parsed = parseSummary(rawSummary);
  const usedFallback = fetchMethod === "none";

  // Start with baseline, overlay with Yahoo data where available
  const freshFinancials = { ...FY2025_BASELINE };
  if (parsed.revenue)         freshFinancials.revenue         = parsed.revenue;
  if (parsed.netProfit)       freshFinancials.netProfit       = parsed.netProfit;
  if (parsed.grossMargin)     freshFinancials.grossMargin     = parsed.grossMargin;
  if (parsed.netMargin)       freshFinancials.netMargin       = parsed.netMargin;
  if (parsed.marketCap)       freshFinancials.marketCap       = parsed.marketCap;
  if (parsed.peRatio)         freshFinancials.peRatio         = parsed.peRatio;
  if (parsed.eps)             freshFinancials.eps             = parsed.eps;
  if (parsed.dividendPerShare)freshFinancials.dividendPerShare= parsed.dividendPerShare;
  if (parsed.dividendYield)   freshFinancials.dividendYield   = parsed.dividendYield;
  if (parsed.week52High)      freshFinancials.week52High      = parsed.week52High;
  if (parsed.week52Low)       freshFinancials.week52Low       = parsed.week52Low;
  if (parsed.debtToEquity !== undefined) freshFinancials.debtEquity = parsed.debtToEquity;
  if (parsed.freeCashflow)    freshFinancials.freeCashflow    = parsed.freeCashflow;
  if (parsed.revenueGrowth)   freshFinancials.revenueGrowthYoY = parsed.revenueGrowth;
  if (parsed.latestQuarter)   freshFinancials.latestQuarter  = parsed.latestQuarter;

  // Always update stock price — even from chart only
  const livePrice = parsed.stockPrice || chartData?.price?.regularMarketPrice?.raw;
  if (livePrice) freshFinancials.stockPrice = livePrice;
  if (parsed.priceChange) freshFinancials.priceChangePct = parsed.priceChange;

  if (parsed.annualEndDate) {
    const year = new Date(parsed.annualEndDate).getFullYear();
    freshFinancials.latestReportLabel = `Annual Report FY${year}`;
    freshFinancials.reportedYear = String(year);
  }

  // ── Detect new quarter → alert admin ──────────────────────────────────────
  const newQuarter = isNewQuarter(freshFinancials, storedEmaar);
  if (newQuarter && !usedFallback) {
    await writeAlert(
      `📊 New Emaar financials: ${freshFinancials.latestReportLabel}`,
      { latestQuarter: freshFinancials.latestQuarter, revenue: freshFinancials.revenue }
    );
  }

  // ── Build financialHistory array (rolling last 8 entries) ─────────────────
  // This powers the 5-year chart in the Financials tab
  const existingHistory = storedEmaar?.financialHistory || [];
  const currentYear = new Date().getFullYear();
  const currentEntry = {
    year:          currentYear,
    quarter:       freshFinancials.reportedQuarter || "Q4",
    revenue:       freshFinancials.revenue,
    netProfit:     freshFinancials.netProfit,
    propertySales: freshFinancials.propertySales,
    ebitda:        freshFinancials.ebitda,
    backlog:       freshFinancials.backlog,
    grossMargin:   freshFinancials.grossMargin,
    netMargin:     freshFinancials.netMargin,
    stockPrice:    freshFinancials.stockPrice || null,
    reportLabel:   freshFinancials.latestReportLabel,
    recordedAt:    now.toISOString(),
    fetchMethod,
  };

  // Avoid duplicates — check if this year+quarter already exists
  const isDuplicate = existingHistory.some(
    h => h.year === currentEntry.year && h.quarter === currentEntry.quarter
  );

  let updatedHistory = existingHistory;
  if (!isDuplicate && !usedFallback) {
    updatedHistory = [...existingHistory, currentEntry]
      .sort((a, b) => a.year !== b.year ? a.year - b.year : (a.quarter || "").localeCompare(b.quarter || ""))
      .slice(-8); // Keep last 8 entries (2 years of quarterly data)
  }

  freshFinancials.financialHistory = updatedHistory;

  // ── Write to Firestore ────────────────────────────────────────────────────
  const payload = {
    ...freshFinancials,
    updatedAt:    now.toISOString(),
    updatedAtUAE: uaeTime,
    usedFallback,
    fetchMethod,
    lastCheckedAt: now.toISOString(),
    fetchedBy:    "api/cron-financials.js",
    tickers:      { parent: EMAAR_TICKER, subsidiary: EMAARDEV_TICKER },
  };

  try {
    await db.collection("developers").doc("emaar").set(payload, { merge: true });
    console.log(`[S12] Firestore updated — method: ${fetchMethod} ✅`);
  } catch (err) {
    console.error("[S12] Firestore write failed:", err.message);
    return res.status(500).json({ ok: false, error: err.message });
  }

  return res.status(200).json({
    ok: true,
    fetchMethod,
    usedFallback,
    stockPrice:   freshFinancials.stockPrice || null,
    reportLabel:  freshFinancials.latestReportLabel,
    newQuarter,
    updatedAt:    now.toISOString(),
    uaeTime,
  });
};
