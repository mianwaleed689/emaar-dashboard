/**
 * DXB Analytics — Session 11: Yields Auto-Calculate
 * File: api/cron-yields.js
 *
 * Vercel Serverless Function — Weekly Sunday 7AM UAE (03:00 UTC)
 * Schedule in vercel.json: "0 3 * * 0"
 *
 * Flow:
 *   1. For each of 11 Emaar communities:
 *      a. Search Bayut locations API to get location ID
 *      b. Search for-rent listings (studio/1BR/2BR/3BR)
 *      c. Compute avg annual rent per unit type
 *      d. Get avg sale price from emaarProjects in data.js
 *      e. Compute gross yield = (avg annual rent / avg sale price) × 100
 *   2. Store results in Firestore: communityData/{communityId}
 *   3. Yields tab reads from Firestore — kills static emaarYields
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

// ── Bayut API config ─────────────────────────────────────────────────────────
const BAYUT_HOST = "uae-real-estate2.p.rapidapi.com";
const BAYUT_BASE = `https://${BAYUT_HOST}`;

// ── Emaar communities to track ───────────────────────────────────────────────
// community name (as on Bayut) → district code + avg sale price fallbacks
const COMMUNITIES = [
  { name: "Dubai Hills Estate",      district: "DHE", query: "Dubai Hills Estate",      avgSaleFallback: { studio: 900000,  apt1: 1529388, apt2: 2200000, apt3: 3500000, villa: 4500000  } },
  { name: "Dubai Creek Harbour",     district: "DCH", query: "Dubai Creek Harbour",     avgSaleFallback: { studio: 900000,  apt1: 1750000, apt2: 2500000, apt3: 3500000, villa: null     } },
  { name: "Emaar Beachfront",        district: "EBF", query: "Emaar Beachfront",        avgSaleFallback: { studio: null,    apt1: 3200000, apt2: 5000000, apt3: 7000000, villa: null     } },
  { name: "Emaar South",             district: "ES",  query: "Emaar South",             avgSaleFallback: { studio: 600000,  apt1: 900000,  apt2: 1400000, apt3: 2000000, villa: 3500000  } },
  { name: "The Valley",              district: "TV",  query: "The Valley Dubai",        avgSaleFallback: { studio: null,    apt1: null,    apt2: null,    apt3: null,    villa: 3000000  } },
  { name: "Grand Polo Club",         district: "GPC", query: "Grand Polo Club Dubai",   avgSaleFallback: { studio: null,    apt1: null,    apt2: null,    apt3: null,    villa: 5670000  } },
  { name: "Rashid Yachts & Marina",  district: "RYM", query: "Rashid Yachts Marina",    avgSaleFallback: { studio: null,    apt1: 2100000, apt2: 3000000, apt3: 4500000, villa: null     } },
  { name: "The Oasis",               district: "TO",  query: "The Oasis Dubai",         avgSaleFallback: { studio: null,    apt1: null,    apt2: null,    apt3: null,    villa: 13830000 } },
  { name: "Business Bay",            district: "BB",  query: "Business Bay Dubai",      avgSaleFallback: { studio: 700000,  apt1: 1500000, apt2: 2500000, apt3: 3500000, villa: null     } },
  { name: "The Heights CW",          district: "TH",  query: "The Heights Country Club",avgSaleFallback: { studio: null,    apt1: null,    apt2: null,    apt3: null,    villa: 2500000  } },
  { name: "Expo Living",             district: "EL",  query: "Expo Living Dubai",       avgSaleFallback: { studio: 500000,  apt1: 800000,  apt2: 1200000, apt3: 1800000, villa: null     } },
];

// Unit type → Bayut rooms parameter (0 = studio)
const UNIT_TYPES = [
  { key: "studio", label: "Studio", rooms: [0] },
  { key: "apt1",   label: "1 BR",   rooms: [1] },
  { key: "apt2",   label: "2 BR",   rooms: [2] },
  { key: "apt3",   label: "3 BR",   rooms: [3] },
];

// ── Bayut API fetch helper ────────────────────────────────────────────────────
async function bayutRequest(path, body = null, method = "GET") {
  const apiKey = process.env.BAYUT_RAPIDAPI_KEY;
  if (!apiKey) throw new Error("BAYUT_RAPIDAPI_KEY env var not set");

  const opts = {
    method,
    headers: {
      "x-rapidapi-key":  apiKey,
      "x-rapidapi-host": BAYUT_HOST,
      "Content-Type":    "application/json",
    },
    signal: AbortSignal.timeout(15000),
  };
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(`${BAYUT_BASE}${path}`, opts);
  if (!res.ok) throw new Error(`Bayut API ${method} ${path} → HTTP ${res.status}`);
  return res.json();
}

// ── Step 1: Get Bayut location ID for a community name ───────────────────────
async function getLocationId(query) {
  try {
    const data = await bayutRequest(`/locations_search?query=${encodeURIComponent(query)}`);
    const results = data.results || [];
    // Prefer community-level results in Dubai
    const community = results.find(r =>
      r.full?.city?.name === "Dubai" &&
      (r.level === "community" || r.level === "sub_community")
    );
    if (community) return community.id;
    // Fallback: first Dubai result
    const dubai = results.find(r => r.full?.city?.name === "Dubai");
    return dubai?.id || null;
  } catch (err) {
    console.warn(`[S11] getLocationId("${query}") failed:`, err.message);
    return null;
  }
}

// ── Step 2: Get avg annual rent for a unit type in a location ────────────────
async function getAvgRent(locationId, rooms) {
  try {
    const data = await bayutRequest("/properties_search?page=0", {
      purpose:       "for-rent",
      categories:    ["apartments", "villas", "townhouses"],
      locations_ids: [locationId],
      rooms,
      index:         "popular",
    }, "POST");

    const results = data.results || [];
    if (results.length === 0) return null;

    // Filter out outliers (>0, <10M AED/yr)
    const validPrices = results
      .map(p => p.price)
      .filter(p => p > 0 && p < 10000000);

    if (validPrices.length === 0) return null;

    // Return median (more robust than mean)
    validPrices.sort((a, b) => a - b);
    const mid = Math.floor(validPrices.length / 2);
    const median = validPrices.length % 2 === 0
      ? (validPrices[mid - 1] + validPrices[mid]) / 2
      : validPrices[mid];

    return Math.round(median);
  } catch (err) {
    console.warn(`[S11] getAvgRent(${locationId}, ${rooms}) failed:`, err.message);
    return null;
  }
}

// ── Step 3: Compute gross yield ───────────────────────────────────────────────
function computeGrossYield(annualRent, salePrice) {
  if (!annualRent || !salePrice) return null;
  return parseFloat(((annualRent / salePrice) * 100).toFixed(2));
}

// ── Process one community ─────────────────────────────────────────────────────
async function processCommunity(community) {
  console.log(`[S11] Processing: ${community.name}`);

  // Get Bayut location ID
  const locationId = await getLocationId(community.query);
  if (!locationId) {
    console.warn(`[S11] No location ID found for ${community.name} — using fallback yields`);
    // Return fallback data
    return {
      community:  community.name,
      district:   community.district,
      locationId: null,
      usedFallback: true,
      yields:     {},
      rents:      {},
      updatedAt:  new Date().toISOString(),
    };
  }

  console.log(`[S11] ${community.name} → locationId: ${locationId}`);

  // Get rent for each unit type
  const yieldData = {};
  const rentData  = {};

  for (const unit of UNIT_TYPES) {
    const avgRent  = await getAvgRent(locationId, unit.rooms);
    const salePrice = community.avgSaleFallback[unit.key];
    const grossYield = computeGrossYield(avgRent, salePrice);

    rentData[unit.key]  = avgRent;
    yieldData[unit.key] = grossYield;

    console.log(`[S11]   ${unit.label}: rent=${avgRent ? `AED ${avgRent.toLocaleString()}/yr` : "N/A"} | yield=${grossYield ? `${grossYield}%` : "N/A"}`);

    // Rate limit — small delay between requests
    await new Promise(r => setTimeout(r, 300));
  }

  return {
    community:    community.name,
    district:     community.district,
    locationId,
    usedFallback: false,
    rents:        rentData,   // Annual rent in AED per unit type
    yields:       yieldData,  // Gross yield % per unit type
    salePrices:   community.avgSaleFallback,
    source:       "Bayut API (uae-real-estate2.p.rapidapi.com)",
    updatedAt:    new Date().toISOString(),
    updatedAtUAE: new Date().toLocaleString("en-AE", { timeZone: "Asia/Dubai" }),
  };
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
  console.log(`[S11 YIELDS] triggered — ${uaeTime}`);

  // Check Bayut API key
  if (!process.env.BAYUT_RAPIDAPI_KEY) {
    return res.status(500).json({
      ok: false,
      error: "BAYUT_RAPIDAPI_KEY not set in Vercel environment variables",
    });
  }

  const results    = [];
  const errors     = [];
  const batch      = db.batch();

  // Process communities — 3 at a time to respect rate limits
  for (let i = 0; i < COMMUNITIES.length; i += 3) {
    const chunk = COMMUNITIES.slice(i, i + 3);
    const chunkResults = await Promise.allSettled(chunk.map(processCommunity));

    chunkResults.forEach((result, idx) => {
      const community = chunk[idx];
      if (result.status === "fulfilled" && result.value) {
        const data = result.value;
        results.push(data);

        // Write to Firestore: communityData/{districtCode}
        const docRef = db.collection("communityData").doc(community.district);
        batch.set(docRef, data, { merge: true });
      } else {
        const errMsg = result.reason?.message || "Unknown error";
        console.error(`[S11] Failed: ${community.name}:`, errMsg);
        errors.push({ community: community.name, error: errMsg });
      }
    });

    // Delay between chunks to respect Bayut rate limits
    if (i + 3 < COMMUNITIES.length) {
      await new Promise(r => setTimeout(r, 1000));
    }
  }

  // Also write a summary document for the Yields tab
  const summaryRef = db.collection("tabData").doc("yieldSummary");
  batch.set(summaryRef, {
    communities: results,
    updatedAt:   now.toISOString(),
    updatedAtUAE: uaeTime,
    fetchedBy:   "api/cron-yields.js",
    totalProcessed: results.length,
    errors,
  });

  // Commit all Firestore writes
  try {
    await batch.commit();
    console.log(`[S11 YIELDS] Firestore updated: ${results.length} communities ✅`);
  } catch (err) {
    console.error("[S11 YIELDS] Firestore batch write failed:", err.message);
    return res.status(500).json({ ok: false, error: err.message });
  }

  return res.status(200).json({
    ok:             true,
    communitiesProcessed: results.length,
    errors:         errors.length,
    updatedAt:      now.toISOString(),
    uaeTime,
    summary:        results.map(r => ({
      community: r.community,
      yields:    r.yields,
      usedFallback: r.usedFallback,
    })),
  });
};
