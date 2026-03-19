/**
 * DXB Analytics — Live Data Sync
 * 
 * This Cloud Function runs on Firebase and syncs live data from:
 * 1. Dubai Pulse DLD API — real transaction data
 * 2. Bayut RapidAPI — live listings & prices
 * 3. BuyOrSell24 API — building/community data
 * 4. ExchangeRate API — currency rates
 * 
 * Schedule: Runs daily at 6am UAE time
 * Deploy: firebase deploy --only functions
 * 
 * SETUP:
 * 1. Apply for Dubai Pulse API key at https://www.dubaipulse.gov.ae
 * 2. Set secrets: firebase functions:secrets:set DUBAI_PULSE_KEY
 * 3. Deploy
 */

const { onSchedule } = require("firebase-functions/v2/scheduler");
const { setGlobalOptions } = require("firebase-functions/v2");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

setGlobalOptions({ region: "me-central1" }); // Dubai region

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const BAYUT_API_KEY = "420de140camsh35f3baf70380d11p1e0c92jsn00005ba30591";
const EXCHANGE_API_KEY = "60dc1d50c587d667a41d415d";
// Dubai Pulse key — set via: firebase functions:secrets:set DUBAI_PULSE_KEY
// const DUBAI_PULSE_KEY = process.env.DUBAI_PULSE_KEY;

// Dubai community → Bayut location ID mapping
const COMMUNITY_LOCATION_IDS = {
  "Downtown Dubai":     "5269",
  "Dubai Marina":       "5247", 
  "Dubai Hills Estate": "7982",
  "Dubai Creek Harbour":"7183",
  "Emaar Beachfront":   "7978",
  "Jumeirah Village Circle": "7164",
  "Business Bay":       "5251",
  "Palm Jumeirah":      "5460",
  "Arabian Ranches III":"7110",
  "The Valley":         "7957",
  "The Oasis":          "8012",
  "Al Furjan":          "7120",
  "DAMAC Hills":        "7185",
  "Arjan":              "7131",
  "Dubai South":        "7205",
  "JBR":                "5256",
};

// Dubai Pulse area name → DLD area code mapping
const DLD_AREA_CODES = {
  "Downtown Dubai":      "DOWNTOWN DUBAI",
  "Dubai Marina":        "DUBAI MARINA",
  "Dubai Hills Estate":  "DUBAI HILLS ESTATE",
  "Business Bay":        "BUSINESS BAY",
  "Jumeirah Village Circle": "JUMEIRAH VILLAGE CIRCLE",
  "Palm Jumeirah":       "PALM JUMEIRAH",
};

// ─── 1. BAYUT LIVE LISTINGS SYNC ─────────────────────────────────────────────
async function syncBayutListings() {
  console.log("Starting Bayut listings sync...");
  const results = {};
  
  for (const [community, locationId] of Object.entries(COMMUNITY_LOCATION_IDS)) {
    try {
      // Fetch sale listings for 1BR, 2BR, 3BR
      const bedTypes = [
        { beds: "1", label: "1BR" },
        { beds: "2", label: "2BR" },
        { beds: "3", label: "3BR" },
      ];
      
      const communityData = { community, listings: [], avgPrice: 0, avgPpsf: 0, lastUpdated: new Date().toISOString() };
      
      for (const { beds, label } of bedTypes) {
        const url = `https://unofficial-bayut-api.p.rapidapi.com/search?locationExternalIDs=${locationId}&purpose=for-sale&categoryExternalID=4&lang=en&sort=price-asc&page=0&hitsPerPage=6&rooms=${beds}`;
        const res = await fetch(url, {
          headers: {
            "x-rapidapi-key": BAYUT_API_KEY,
            "x-rapidapi-host": "unofficial-bayut-api.p.rapidapi.com"
          }
        });
        
        if (!res.ok) continue;
        const data = await res.json();
        const hits = data?.hits || [];
        
        if (hits.length > 0) {
          const prices = hits.map(h => h.price).filter(Boolean);
          const areas = hits.map(h => h.area).filter(Boolean);
          const avgP = prices.reduce((a, b) => a + b, 0) / prices.length;
          const avgA = areas.reduce((a, b) => a + b, 0) / areas.length;
          
          communityData.listings.push({
            beds: label,
            avgPrice: Math.round(avgP),
            avgArea: Math.round(avgA),
            avgPpsf: avgA > 0 ? Math.round(avgP / avgA) : 0,
            count: hits.length,
            minPrice: Math.min(...prices),
            maxPrice: Math.max(...prices),
          });
        }
        
        // Rate limit — wait 500ms between calls
        await new Promise(r => setTimeout(r, 500));
      }
      
      // Calculate community avg PPSF
      const ppsfValues = communityData.listings.map(l => l.avgPpsf).filter(Boolean);
      communityData.avgPpsf = ppsfValues.length > 0 
        ? Math.round(ppsfValues.reduce((a, b) => a + b, 0) / ppsfValues.length)
        : 0;
      
      results[community] = communityData;
      
      // Save to Firestore
      await db.collection("liveMarketData").doc(community.replace(/ /g, "_")).set({
        ...communityData,
        source: "Bayut.com via RapidAPI",
        syncedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
      
      console.log(`✅ ${community}: AED ${communityData.avgPpsf}/sqft`);
      
    } catch (err) {
      console.error(`❌ Bayut sync failed for ${community}:`, err.message);
    }
  }
  
  // Save summary
  await db.collection("syncLog").add({
    type: "bayut_listings",
    communities: Object.keys(results).length,
    completedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  
  return results;
}

// ─── 2. DUBAI PULSE DLD TRANSACTIONS SYNC ────────────────────────────────────
async function syncDLDTransactions(dubaipulseKey) {
  if (!dubaipulseKey) {
    console.log("⚠️ Dubai Pulse API key not set — skipping DLD sync");
    return;
  }
  
  console.log("Starting DLD transactions sync...");
  
  try {
    // Get auth token
    const tokenRes = await fetch(
      "https://api.dubaipulse.gov.ae/oauth/client_credential/accesstoken?grant_type=client_credentials",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `client_id=${dubaipulseKey.split(":")[0]}&client_secret=${dubaipulseKey.split(":")[1]}`,
      }
    );
    const tokenData = await tokenRes.json();
    const token = tokenData.access_token;
    if (!token) throw new Error("Failed to get Dubai Pulse token");
    
    // Get transactions for last 30 days by area
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString().split("T")[0];
    
    for (const [community, areaName] of Object.entries(DLD_AREA_CODES)) {
      try {
        const url = `https://api.dubaipulse.gov.ae/open/dld/dld_transactions-open-api?filter=instance_date>='${thirtyDaysAgo}' AND area_en='${areaName}' AND trans_group_en='Sales'&limit=1000`;
        const res = await fetch(url, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        
        if (!res.ok) continue;
        const data = await res.json();
        const records = data?.records || [];
        
        if (records.length === 0) continue;
        
        // Calculate stats
        const prices = records.map(r => parseFloat(r.trans_value)).filter(p => p > 0);
        const areas = records.map(r => parseFloat(r.procedure_area)).filter(a => a > 0);
        const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
        const avgArea = areas.reduce((a, b) => a + b, 0) / areas.length;
        
        const dldData = {
          community,
          areaName,
          transactionCount: records.length,
          avgPrice: Math.round(avgPrice),
          avgArea: Math.round(avgArea),
          avgPpsf: avgArea > 0 ? Math.round(avgPrice / avgArea) : 0,
          totalValue: Math.round(prices.reduce((a, b) => a + b, 0)),
          period: `Last 30 days from ${thirtyDaysAgo}`,
          source: "Dubai Pulse / Dubai Land Department",
          syncedAt: admin.firestore.FieldValue.serverTimestamp(),
        };
        
        await db.collection("dldLiveData").doc(community.replace(/ /g, "_")).set(dldData, { merge: true });
        console.log(`✅ DLD ${community}: ${records.length} transactions, AED ${dldData.avgPpsf}/sqft`);
        
      } catch (err) {
        console.error(`❌ DLD sync failed for ${community}:`, err.message);
      }
    }
    
  } catch (err) {
    console.error("❌ DLD auth failed:", err.message);
  }
}

// ─── 3. EXCHANGE RATES SYNC ───────────────────────────────────────────────────
async function syncExchangeRates() {
  try {
    const res = await fetch(`https://v6.exchangerate-api.com/v6/${EXCHANGE_API_KEY}/latest/AED`);
    const data = await res.json();
    if (data.rates) {
      await db.collection("liveRates").doc("exchange").set({
        rates: data.rates,
        base: "AED",
        updatedAt: data.time_last_update_utc,
        syncedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      console.log("✅ Exchange rates synced");
    }
  } catch (err) {
    console.error("❌ Exchange rate sync failed:", err.message);
  }
}

// ─── 4. COMMUNITY LIVE PPSF UPDATE ───────────────────────────────────────────
async function updateCommunityPPSF() {
  // Combine Bayut + DLD data to update community PPSF in tabData
  const snapshot = await db.collection("liveMarketData").get();
  const updates = [];
  
  snapshot.forEach(doc => {
    const data = doc.data();
    if (data.avgPpsf > 0) {
      updates.push({
        community: data.community,
        avgPpsf: data.avgPpsf,
        source: "Bayut live listings",
        updatedAt: new Date().toISOString(),
      });
    }
  });
  
  // Also check DLD data
  const dldSnapshot = await db.collection("dldLiveData").get();
  dldSnapshot.forEach(doc => {
    const data = doc.data();
    const existing = updates.find(u => u.community === data.community);
    if (existing) {
      // Average Bayut asking price with DLD transaction price
      existing.avgPpsf = Math.round((existing.avgPpsf + data.avgPpsf) / 2);
      existing.source = "Bayut + DLD average";
    } else if (data.avgPpsf > 0) {
      updates.push({
        community: data.community,
        avgPpsf: data.avgPpsf,
        source: "DLD transactions",
        updatedAt: new Date().toISOString(),
      });
    }
  });
  
  // Save combined update
  await db.collection("liveMarketData").doc("_summary").set({
    communities: updates,
    lastSyncedAt: admin.firestore.FieldValue.serverTimestamp(),
    totalCommunities: updates.length,
  });
  
  console.log(`✅ Updated PPSF for ${updates.length} communities`);
}

// ─── SCHEDULED FUNCTION — Runs daily 6am UAE ─────────────────────────────────
exports.syncLiveData = onSchedule({
  schedule: "0 6 * * *",
  timeZone: "Asia/Dubai",
  memory: "512MiB",
  timeoutSeconds: 300,
}, async () => {
  console.log("🔄 Starting DXB Analytics daily data sync...");
  
  const DUBAI_PULSE_KEY = process.env.DUBAI_PULSE_KEY || "";
  
  // Run all syncs
  await Promise.allSettled([
    syncBayutListings(),
    syncDLDTransactions(DUBAI_PULSE_KEY),
    syncExchangeRates(),
  ]);
  
  // Update community summary
  await updateCommunityPPSF();
  
  console.log("✅ Daily sync complete");
});

// ─── HTTP TRIGGER — Manual sync from Admin panel ──────────────────────────────
exports.manualSync = require("firebase-functions/v2/https").onRequest(
  { memory: "512MiB", timeoutSeconds: 300 },
  async (req, res) => {
    // Verify admin token
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (token !== process.env.ADMIN_SYNC_TOKEN) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    try {
      await syncBayutListings();
      await syncExchangeRates();
      const summary = await db.collection("liveMarketData").doc("_summary").get();
      res.json({ success: true, data: summary.data() });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);
