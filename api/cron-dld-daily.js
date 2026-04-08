/**
 * DXB Analytics — Session 13: DLD Daily Transactions
 * File: api/cron-dld-daily.js
 *
 * Vercel Serverless Function — Daily at 7AM UAE (03:00 UTC)
 * Schedule in vercel.json: "0 3 * * *"
 *
 * Flow:
 *   1. Authenticate with Dubai Pulse OAuth2 (client_credentials)
 *   2. Fetch yesterday's DLD sale transactions
 *   3. Aggregate by community (count, avg price, total value, avg ppsf)
 *   4. Update communityData/{id} with transactionCount30d, lastSaleDate, avgPrice
 *   5. Detect price anomalies >20% spike vs 30-day average → alert admin
 *   6. Update marketData/global rolling totals
 *   7. Foundation for 228-developer auto-population (S14)
 *
 * DLD API Docs: https://www.dubaipulse.gov.ae/data/dld-transactions/dld_transactions-open-api
 *
 * Required env vars:
 *   DLD_API_KEY    — from Dubai Pulse portal (free registration)
 *   DLD_API_SECRET — from Dubai Pulse portal
 *   FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY
 *   CRON_SECRET
 *
 * Iron Rule: NEVER run npx vercel --prod — use git push only
 */

const { initializeApp, cert, getApps } = require("firebase-admin/app");
const { getFirestore }                  = require("firebase-admin/firestore");

// ── Firebase Admin singleton ─────────────────────────────────────────────────
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

// ── DLD API Config ────────────────────────────────────────────────────────────
const DLD_BASE      = "https://api.dubaipulse.gov.ae";
const DLD_TOKEN_URL = `${DLD_BASE}/oauth/client_credential/accesstoken?grant_type=client_credentials`;
const DLD_TXN_URL   = `${DLD_BASE}/open/dld/dld_transactions-open-api`;

// ── Community name mapping: DLD area_name_en → our district code ──────────────
// These are the actual area names as they appear in DLD data
const COMMUNITY_MAP = {
  // Dubai Hills Estate
  "DUBAI HILLS ESTATE":       "DHE",
  "DUBAI HILLS":               "DHE",
  // Dubai Creek Harbour
  "DUBAI CREEK HARBOUR":      "DCH",
  "CREEK HARBOUR":             "DCH",
  "DUBAI CREEK ISLAND":        "DCH",
  // Emaar Beachfront
  "EMAAR BEACHFRONT":          "EBF",
  "DUBAI HARBOUR":             "EBF",
  // Emaar South
  "EMAAR SOUTH":               "ES",
  // The Valley
  "THE VALLEY":                "TV",
  "VALLEY":                    "TV",
  // Grand Polo Club
  "GRAND POLO CLUB":           "GPC",
  "DUBAI INVESTMENT PARK 2":   "GPC",
  // Rashid Yachts & Marina
  "RASHID YACHTS AND MARINA":  "RYM",
  "RASHID YACHTS & MARINA":    "RYM",
  "PORT RASHID":               "RYM",
  // The Oasis
  "THE OASIS":                 "TO",
  // Business Bay
  "BUSINESS BAY":              "BB",
  // The Heights CW
  "THE HEIGHTS COUNTRY CLUB":  "TH",
  "THE HEIGHTS":               "TH",
  // Expo Living
  "EXPO CITY":                 "EL",
  "EXPO LIVING":               "EL",
  "EXPO 2020":                 "EL",
};

// ── Step 1: Get DLD OAuth2 access token ──────────────────────────────────────
async function getDLDToken() {
  const apiKey    = process.env.DLD_API_KEY;
  const apiSecret = process.env.DLD_API_SECRET;

  if (!apiKey || !apiSecret) {
    throw new Error("DLD_API_KEY or DLD_API_SECRET not set in environment variables");
  }

  const res = await fetch(DLD_TOKEN_URL, {
    method:  "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body:    `client_id=${encodeURIComponent(apiKey)}&client_secret=${encodeURIComponent(apiSecret)}`,
    signal:  AbortSignal.timeout(10000),
  });

  if (!res.ok) throw new Error(`DLD token fetch HTTP ${res.status}`);
  const data = await res.json();

  if (!data.access_token) throw new Error("No access_token in DLD response");
  console.log(`[S13] DLD token obtained (expires in ${data.expires_in || "?"} seconds)`);
  return data.access_token;
}

// ── Step 2: Fetch yesterday's sale transactions ───────────────────────────────
async function fetchYesterdayTransactions(token) {
  // Yesterday in UAE timezone (UTC+4)
  const now = new Date();
  const uaeOffset = 4 * 60 * 60 * 1000;
  const uaeNow = new Date(now.getTime() + uaeOffset);
  const yesterday = new Date(uaeNow);
  yesterday.setDate(yesterday.getDate() - 1);
  const dateStr = yesterday.toISOString().split("T")[0]; // YYYY-MM-DD

  console.log(`[S13] Fetching DLD transactions for: ${dateStr}`);

  // Filter: sales only (procedure_name_en = "Sales") on that date
  // Columns: instance_date, area_name_en, actual_worth, procedure_area, trans_group_en, procedure_name_en
  const params = new URLSearchParams({
    filter:  `instance_date=${dateStr} AND trans_group_en=Sales`,
    column:  "instance_date,area_name_en,actual_worth,procedure_area,trans_group_en,procedure_name_en",
    limit:   "10000",  // Max per call — DLD typically has 500-800 sales/day
  });

  const url = `${DLD_TXN_URL}?${params}`;
  const res = await fetch(url, {
    headers: {
      "Authorization": `Bearer ${token}`,
      "Accept":        "application/json",
    },
    signal: AbortSignal.timeout(30000),
  });

  if (!res.ok) throw new Error(`DLD transactions fetch HTTP ${res.status}`);
  const data = await res.json();

  const records = data.result?.records || data.records || data || [];
  console.log(`[S13] Fetched ${records.length} transactions for ${dateStr}`);
  return { records, dateStr };
}

// ── Step 3: Aggregate by community ───────────────────────────────────────────
function aggregateByCommunity(records) {
  const communityStats = {};

  for (const record of records) {
    const areaRaw = (record.area_name_en || "").toUpperCase().trim();
    const districtCode = COMMUNITY_MAP[areaRaw];

    if (!districtCode) continue; // Not an Emaar community we track

    const price = parseFloat(record.actual_worth || 0);
    const area  = parseFloat(record.procedure_area || 0);
    if (price <= 0) continue;

    if (!communityStats[districtCode]) {
      communityStats[districtCode] = {
        district:    districtCode,
        areaName:    record.area_name_en,
        txnCount:    0,
        totalValue:  0,
        prices:      [],
        areas:       [],
      };
    }

    const c = communityStats[districtCode];
    c.txnCount++;
    c.totalValue += price;
    c.prices.push(price);
    if (area > 0) c.areas.push(area);
  }

  // Compute aggregates
  const result = {};
  for (const [code, c] of Object.entries(communityStats)) {
    const avgPrice = c.prices.reduce((a, b) => a + b, 0) / c.prices.length;
    const medianPrice = c.prices.sort((a, b) => a - b)[Math.floor(c.prices.length / 2)];
    const avgArea  = c.areas.length > 0
      ? c.areas.reduce((a, b) => a + b, 0) / c.areas.length
      : null;
    const avgPpsf  = avgArea ? (avgPrice / avgArea) * 10.764 : null; // m² to sqft

    result[code] = {
      district:    code,
      areaName:    c.areaName,
      txnCount:    c.txnCount,
      totalValue:  Math.round(c.totalValue),
      avgPrice:    Math.round(avgPrice),
      medianPrice: Math.round(medianPrice),
      avgPpsf:     avgPpsf ? Math.round(avgPpsf) : null,
      minPrice:    Math.round(Math.min(...c.prices)),
      maxPrice:    Math.round(Math.max(...c.prices)),
    };
  }

  return result;
}

// ── Step 4: Load stored 30-day data from Firestore ───────────────────────────
async function loadStoredCommunityData(districtCodes) {
  const stored = {};
  const promises = districtCodes.map(async (code) => {
    try {
      const snap = await db.collection("communityData").doc(code).get();
      if (snap.exists()) stored[code] = snap.data();
    } catch (err) {
      console.warn(`[S13] Could not load communityData/${code}:`, err.message);
    }
  });
  await Promise.all(promises);
  return stored;
}

// ── Step 5: Detect price anomaly >20% spike ───────────────────────────────────
function detectAnomaly(todayAvg, storedAvg30d) {
  if (!storedAvg30d || storedAvg30d <= 0 || !todayAvg) return null;
  const changePct = ((todayAvg - storedAvg30d) / storedAvg30d) * 100;
  if (Math.abs(changePct) > 20) {
    return {
      changePct:   parseFloat(changePct.toFixed(1)),
      direction:   changePct > 0 ? "spike" : "drop",
      todayAvg,
      storedAvg30d,
    };
  }
  return null;
}

// ── Step 6: Write admin alert ─────────────────────────────────────────────────
async function writeAdminAlert(message, data) {
  try {
    await db.collection("adminAlerts").doc().set({
      message,
      data,
      type:         "price_anomaly",
      severity:     "warning",
      read:         false,
      createdAt:    new Date().toISOString(),
      createdAtUAE: new Date().toLocaleString("en-AE", { timeZone: "Asia/Dubai" }),
      source:       "api/cron-dld-daily.js",
    });
  } catch (err) {
    console.warn("[S13] Failed to write admin alert:", err.message);
  }
}

// ── Main handler ──────────────────────────────────────────────────────────────
module.exports = async (req, res) => {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  // Verify cron secret
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = req.headers["authorization"] || "";
    if (auth !== `Bearer ${cronSecret}`) return res.status(401).json({ error: "Unauthorized" });
  }

  const now     = new Date();
  const uaeTime = now.toLocaleString("en-AE", { timeZone: "Asia/Dubai" });
  console.log(`[S13 DLD] triggered — ${uaeTime}`);

  // ── Step 1: Get DLD token ────────────────────────────────────────────────
  let token;
  try {
    token = await getDLDToken();
  } catch (err) {
    console.error("[S13] Token error:", err.message);
    return res.status(500).json({ ok: false, error: `DLD auth failed: ${err.message}` });
  }

  // ── Step 2: Fetch yesterday's transactions ───────────────────────────────
  let records, dateStr;
  try {
    ({ records, dateStr } = await fetchYesterdayTransactions(token));
  } catch (err) {
    console.error("[S13] Fetch error:", err.message);
    return res.status(500).json({ ok: false, error: `DLD fetch failed: ${err.message}` });
  }

  if (records.length === 0) {
    console.log("[S13] No transactions found — likely weekend/holiday. Skipping.");
    return res.status(200).json({
      ok:       true,
      message:  "No transactions found — weekend or holiday",
      dateStr,
      updatedAt: now.toISOString(),
    });
  }

  // ── Step 3: Aggregate by community ──────────────────────────────────────
  const todayStats = aggregateByCommunity(records);
  const districtCodes = Object.keys(todayStats);
  console.log(`[S13] Found data for ${districtCodes.length} Emaar communities:`, districtCodes);

  // ── Step 4: Load stored 30-day averages ─────────────────────────────────
  const storedData = await loadStoredCommunityData(districtCodes);

  // ── Step 5: Anomaly detection + Firestore updates ────────────────────────
  const batch     = db.batch();
  const anomalies = [];
  const updates   = [];

  for (const [code, today] of Object.entries(todayStats)) {
    const stored = storedData[code] || {};

    // Rolling 30-day avg price (weighted update)
    const prevAvg30d    = stored.avgPrice30d || today.avgPrice;
    const newAvg30d     = Math.round((prevAvg30d * 29 + today.avgPrice) / 30);

    // Rolling 30-day transaction count
    const prevCount30d  = stored.transactionCount30d || 0;
    const newCount30d   = prevCount30d + today.txnCount;

    // Anomaly check
    const anomaly = detectAnomaly(today.avgPrice, stored.avgPrice30d);
    if (anomaly) {
      const msg = `⚠️ Price ${anomaly.direction} in ${today.areaName}: ${anomaly.changePct > 0 ? "+" : ""}${anomaly.changePct}% vs 30d avg`;
      console.warn(`[S13] ANOMALY: ${msg}`);
      anomalies.push({ district: code, ...anomaly, areaName: today.areaName });
      await writeAdminAlert(msg, { district: code, ...anomaly, dateStr });
    }

    // Write to Firestore: communityData/{districtCode}
    const docRef = db.collection("communityData").doc(code);
    const payload = {
      district:             code,
      areaName:             today.areaName,
      // Today's data
      lastSaleDate:         dateStr,
      lastTxnCount:         today.txnCount,
      lastAvgPrice:         today.avgPrice,
      lastMedianPrice:      today.medianPrice,
      lastTotalValue:       today.totalValue,
      lastAvgPpsf:          today.avgPpsf,
      lastMinPrice:         today.minPrice,
      lastMaxPrice:         today.maxPrice,
      // Rolling 30-day aggregates
      transactionCount30d:  newCount30d,
      avgPrice30d:          newAvg30d,
      // Metadata
      updatedAt:            now.toISOString(),
      updatedAtUAE:         uaeTime,
      fetchedBy:            "api/cron-dld-daily.js",
      source:               "Dubai Pulse DLD Transactions API",
    };

    batch.set(docRef, payload, { merge: true });
    updates.push({ district: code, txnCount: today.txnCount, avgPrice: today.avgPrice });
  }

  // ── Step 6: Also update marketData/global with rolling totals ────────────
  // Accumulate total daily transactions for market overview
  const totalTodayTxns  = records.length;
  const totalTodayValue = records.reduce((s, r) => s + parseFloat(r.actual_worth || 0), 0);

  const globalRef = db.collection("marketData").doc("global");
  batch.set(globalRef, {
    lastDLDFetchDate:  dateStr,
    lastDLDTxnCount:   totalTodayTxns,
    lastDLDTotalValue: Math.round(totalTodayValue),
    dldFetchedBy:      "api/cron-dld-daily.js",
    dldUpdatedAt:      now.toISOString(),
  }, { merge: true });

  // ── Step 7 (S14): Update transaction counts per developer ────────────────
  // Aggregate today's raw records by developer_name
  const devTxnCounts = {};
  const devTxnValues = {};
  for (const record of records) {
    const devName = (record.developer_name || record.developer || "").toUpperCase().trim();
    if (!devName) continue;
    devTxnCounts[devName] = (devTxnCounts[devName] || 0) + 1;
    devTxnValues[devName] = (devTxnValues[devName] || 0) + parseFloat(record.actual_worth || 0);
  }

  // FIX: Pre-load ALL developer docs in ONE batch read — no queries inside loop
  // Build a name→docId lookup map first, then write in batch
  const uniqueDevNames = Object.keys(devTxnCounts);
  if (uniqueDevNames.length > 0) {
    try {
      // Load all existing developer docs in a single getDocs call
      const allDevsSnap = await db.collection("developers").get();
      const devNameToDocId = {};
      allDevsSnap.forEach(doc => {
        const data = doc.data();
        // Map both the stored name (any case) and slug to docId
        const storedName = (data.name || "").toUpperCase().trim();
        if (storedName) devNameToDocId[storedName] = doc.id;
        // Also map common abbreviations
        const slug = doc.id.toUpperCase().replace(/-/g, " ");
        devNameToDocId[slug] = doc.id;
      });

      // Now match each DLD developer name to a Firestore doc — no queries
      for (const [devName, txnCount] of Object.entries(devTxnCounts)) {
        // Try exact match first, then partial match
        let docId = devNameToDocId[devName];

        if (!docId) {
          // Try partial: does any stored name start with first 6 chars of devName?
          const prefix = devName.slice(0, 6);
          const matchKey = Object.keys(devNameToDocId).find(k => k.startsWith(prefix));
          if (matchKey) docId = devNameToDocId[matchKey];
        }

        if (!docId) {
          // Create a new slug-based doc for unknown developers
          docId = devName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 50);
        }

        const devRef = db.collection("developers").doc(docId);
        batch.set(devRef, {
          lastDailyTxnCount: txnCount,
          lastDailyTxnValue: Math.round(devTxnValues[devName] || 0),
          lastTxnDate:       dateStr,
          dldName:           devName, // Store original DLD name for future matching
          updatedAt:         now.toISOString(),
        }, { merge: true });
      }

      console.log(`[S13] Developer txn counts queued for ${uniqueDevNames.length} developers`);
    } catch (err) {
      console.warn("[S13] Developer update skipped:", err.message);
      // Non-fatal — community data still written
    }
  }

  // ── Step 7: Commit all writes ────────────────────────────────────────────
  try {
    await batch.commit();
    console.log(`[S13] Firestore batch committed: ${updates.length} communities + global ✅`);
  } catch (err) {
    console.error("[S13] Firestore batch failed:", err.message);
    return res.status(500).json({ ok: false, error: err.message });
  }

  return res.status(200).json({
    ok:              true,
    dateStr,
    totalTransactions: totalTodayTxns,
    communitiesUpdated: updates.length,
    anomaliesDetected: anomalies.length,
    anomalies,
    updates,
    updatedAt:       now.toISOString(),
    uaeTime,
  });
};
