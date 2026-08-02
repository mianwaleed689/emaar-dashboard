/**
 * api/_cron/cron-sync-market.js — live price per square foot per community.
 *
 * Fetches asking prices from Bayut for 49 communities and writes them to
 * Firestore `liveMarketData`, which the dashboard reads on load.
 *
 * WHAT THIS FILE USED TO HIDE. It contained no console statements at all — 184
 * lines, zero output — so a run produced a 200 and nothing else. When a
 * community's fetch failed it silently substituted that community's hardcoded
 * `benchmark` and stamped it with the current `syncedAt`, which made a constant
 * indistinguishable from a live price. All 49 could fall back and the run still
 * looked identical to a perfect one, while the header above claimed the
 * dashboard "always shows fresh prices".
 *
 * The counts were written to a `cronLogs` document, but nothing surfaced them,
 * so in practice nobody could tell. It now logs what it did, and says so loudly
 * when the live source gave it nothing. Same principle as the EIBOR cron: a job
 * that cannot report is a job you cannot trust.
 *
 * Schedule: see vercel.json.
 */

const { initializeApp, getApps, cert } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

function getDb() {
  if (!getApps().length) {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID || "dxb-analytics",
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      }),
    });
  }
  return getFirestore();
}

/* Was `BAYUT_RAPIDAPI_KEY || BAYUT_RAPIDAPI_KEY` — the same name twice, so the
   intended fallback never applied. Both names exist in the project. */
const BAYUT_KEY = process.env.BAYUT_RAPIDAPI_KEY || process.env.RAPIDAPI_KEY;
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// 49 communities with Bayut location IDs
const COMMUNITIES = [
  { name: "Dubai Hills Estate",     id: "9",    district: "DHE",  benchmark: 2400 },
  { name: "Dubai Creek Harbour",    id: "3951", district: "DCH",  benchmark: 2200 },
  { name: "Emaar Beachfront",       id: "3594", district: "EBF",  benchmark: 3800 },
  { name: "Downtown Dubai",         id: "5",    district: "DT",   benchmark: 3200 },
  { name: "Business Bay",           id: "3",    district: "BB",   benchmark: 2100 },
  { name: "Dubai Marina",           id: "4",    district: "DM",   benchmark: 2400 },
  { name: "Palm Jumeirah",          id: "10",   district: "PJ",   benchmark: 4500 },
  { name: "Jumeirah Village Circle",id: "6",    district: "JVC",  benchmark: 1100 },
  { name: "Jumeirah Lake Towers",   id: "7",    district: "JLT",  benchmark: 1300 },
  { name: "Arabian Ranches",        id: "15",   district: "AR",   benchmark: 2800 },
  { name: "Arabian Ranches 2",      id: "3397", district: "AR2",  benchmark: 2600 },
  { name: "Arabian Ranches 3",      id: "5765", district: "AR3",  benchmark: 2400 },
  { name: "Emaar South",            id: "3869", district: "ES",   benchmark: 1300 },
  { name: "The Valley",             id: "5802", district: "TV",   benchmark: 1400 },
  { name: "Grand Polo Club",        id: "6116", district: "GPC",  benchmark: 1700 },
  { name: "The Oasis",              id: "6079", district: "TO",   benchmark: 1600 },
  { name: "Rashid Yachts Marina",   id: "5972", district: "RYM",  benchmark: 2800 },
  { name: "DAMAC Hills",            id: "2197", district: "DH",   benchmark: 1600 },
  { name: "DAMAC Hills 2",          id: "4536", district: "DH2",  benchmark: 1000 },
  { name: "Sobha Hartland",         id: "3913", district: "SH",   benchmark: 2200 },
  { name: "Sobha Hartland 2",       id: "5997", district: "SH2",  benchmark: 2000 },
  { name: "Mohammed Bin Rashid City",id:"2",    district: "MBR",  benchmark: 2600 },
  { name: "Dubai South",            id: "3378", district: "DS",   benchmark: 1100 },
  { name: "Jumeirah Golf Estates",  id: "2091", district: "JGE",  benchmark: 2200 },
  { name: "Town Square",            id: "3377", district: "TS",   benchmark: 900  },
  { name: "The Springs",            id: "11",   district: "SP",   benchmark: 1400 },
  { name: "The Meadows",            id: "12",   district: "ME",   benchmark: 1700 },
  { name: "Emirates Hills",         id: "13",   district: "EH",   benchmark: 4000 },
  { name: "Al Barsha",              id: "8",    district: "AB",   benchmark: 1200 },
  { name: "Meydan",                 id: "3515", district: "MY",   benchmark: 1800 },
  { name: "Tilal Al Ghaf",          id: "5764", district: "TAG",  benchmark: 2200 },
  { name: "Dubai Islands",          id: "5902", district: "DI",   benchmark: 2800 },
  { name: "Palm Jebel Ali",         id: "6001", district: "PJA",  benchmark: 3200 },
  { name: "Dubai Harbour",          id: "3594", district: "DHR",  benchmark: 3500 },
  { name: "City Walk",              id: "3407", district: "CW",   benchmark: 2800 },
  { name: "Bluewaters Island",      id: "3715", district: "BW",   benchmark: 3500 },
  { name: "Al Furjan",              id: "2090", district: "AF",   benchmark: 1200 },
  { name: "Dubai Production City",  id: "1923", district: "DPC",  benchmark: 900  },
  { name: "International City",     id: "1524", district: "IC",   benchmark: 600  },
  { name: "Discovery Gardens",      id: "1525", district: "DG",   benchmark: 750  },
  { name: "Motor City",             id: "1771", district: "MC",   benchmark: 1000 },
  { name: "Sports City",            id: "1772", district: "SC",   benchmark: 950  },
  { name: "Silicon Oasis",          id: "1526", district: "SO",   benchmark: 850  },
  { name: "Mudon",                  id: "3518", district: "MU",   benchmark: 1500 },
  { name: "Villanova",              id: "4180", district: "VN",   benchmark: 1400 },
  { name: "Yas Island",             id: "6098", district: "YI",   benchmark: 2000 },
  { name: "Saadiyat Island",        id: "6097", district: "SI",   benchmark: 3200 },
  { name: "Al Reem Island",         id: "6096", district: "RI",   benchmark: 1400 },
  { name: "Al Maryah Island",       id: "6095", district: "MI",   benchmark: 2600 },
];

async function fetchCommunityPPSF(community) {
  try {
    const url = `https://unofficial-bayut-api.p.rapidapi.com/search?purpose=for-sale&categoryExternalID=4&lang=en&sort=price-asc&page=0&hitsPerPage=20&locationExternalIDs=${community.id}`;
    const r = await fetch(url, {
      headers: {
        "x-rapidapi-key": BAYUT_KEY,
        "x-rapidapi-host": "unofficial-bayut-api.p.rapidapi.com",
      },
      signal: AbortSignal.timeout(6000),
    });
    if (!r.ok) return null;
    const data = await r.json();
    const hits = (data?.hits || []).filter(h => h.price > 0 && h.area > 0);
    if (hits.length < 3) return null;

    const ppsfValues = hits.map(h => Math.round(h.price / h.area)).filter(v => v > 300 && v < 15000);
    if (ppsfValues.length < 2) return null;

    ppsfValues.sort((a, b) => a - b);
    const trimmed = ppsfValues.slice(Math.floor(ppsfValues.length * 0.1), Math.ceil(ppsfValues.length * 0.9));
    const avg = Math.round(trimmed.reduce((s, v) => s + v, 0) / trimmed.length);
    const median = trimmed[Math.floor(trimmed.length / 2)];

    return { avg, median, sampleSize: hits.length, source: "Bayut" };
  } catch {
    return null;
  }
}

module.exports = async function handler(req, res) {
  const authHeader = req.headers.authorization;
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const db = getDb();
  const results = { updated: 0, benchmark: 0, errors: [] };
  const syncedAt = new Date().toISOString();

  console.log(`[sync-market] started — ${COMMUNITIES.length} communities`);
  if (!BAYUT_KEY) {
    /* Worth its own line: without a key every community falls back, and the
       run would otherwise look successful. */
    console.error("[sync-market] no Bayut API key in the environment — every " +
                  "community will fall back to its hardcoded benchmark");
  }

  // Process communities in batches of 5 to respect rate limits
  const batchSize = 5;
  const marketData = {};

  for (let i = 0; i < COMMUNITIES.length; i += batchSize) {
    const batch = COMMUNITIES.slice(i, i + batchSize);
    await Promise.all(batch.map(async (community) => {
      const live = await fetchCommunityPPSF(community);
      if (live) {
        marketData[community.district] = {
          community: community.name,
          district: community.district,
          ppsf: live.avg,
          ppsfMedian: live.median,
          sampleSize: live.sampleSize,
          benchmark: community.benchmark,
          source: "Bayut Live",
          isLive: true,
          checkedAt: syncedAt,
          syncedAt,
        };
        results.updated++;
      } else {
        /* `syncedAt` here would say the price was checked just now, when in
           fact nothing was fetched and this is a constant from the table at the
           top of this file. `isLive` and `checkedAt` let a reader tell the
           difference; `syncedAt` is kept for the existing dashboard fields. */
        marketData[community.district] = {
          community: community.name,
          district: community.district,
          ppsf: community.benchmark,
          benchmark: community.benchmark,
          source: "Benchmark — not a live price",
          isLive: false,
          checkedAt: syncedAt,
          syncedAt,
        };
        results.benchmark++;
      }
    }));
    await sleep(300);
  }

  // Save all to Firestore as single document for fast dashboard reads
  await db.collection("liveMarketData").doc("latest").set({
    communities: marketData,
    totalCommunities: COMMUNITIES.length,
    liveCount: results.updated,
    benchmarkCount: results.benchmark,
    syncedAt,
  });

  // Also save per-community docs for granular access
  const firestoreBatch = db.batch();
  Object.entries(marketData).forEach(([district, data]) => {
    const ref = db.collection("liveMarketData").doc(district);
    firestoreBatch.set(ref, data);
  });
  await firestoreBatch.commit();

  // Log the cron run
  await db.collection("cronLogs").add({
    type: "sync-market",
    updated: results.updated,
    benchmark: results.benchmark,
    syncedAt,
  });

  if (results.updated === 0) {
    console.error(`[sync-market] NOT ONE live price — all ${results.benchmark} ` +
                  `communities fell back to hardcoded benchmarks. The dashboard ` +
                  `is showing constants, not the market.`);
  } else if (results.benchmark > results.updated) {
    console.warn(`[sync-market] only ${results.updated} of ${COMMUNITIES.length} ` +
                 `communities returned a live price; ${results.benchmark} fell back`);
  } else {
    console.log(`[sync-market] ${results.updated} live, ${results.benchmark} benchmark`);
  }

  return res.status(200).json({
    success: true,
    message: `Market sync complete: ${results.updated} live, ${results.benchmark} from benchmark`,
    ...results,
    syncedAt,
  });
};
