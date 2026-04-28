const admin = require("firebase-admin");
const sa = require("../serviceAccountKey.json");
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

const GOOGLE_API_KEY = "AIzaSyAqv0r7D5Z1hnf0yrP1Ijxmat6HYTTRZmw";
const sleep = ms => new Promise(r => setTimeout(r, ms));

// Better beach search — use specific Dubai beaches
async function findBeach(lat, lng) {
  // Search for known Dubai beaches and JBR waterfront
  const keywords = ["beach dubai", "public beach", "JBR beach", "corniche beach"];
  for (const kw of keywords) {
    for (const radius of [3000, 8000, 15000, 25000]) {
      const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&keyword=${encodeURIComponent(kw)}&language=en&key=${GOOGLE_API_KEY}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.status === "OK" && data.results.length > 0) {
        const beach = data.results.find(p => {
          const n = p.name.toLowerCase();
          return (n.includes("beach") || n.includes("corniche") || n.includes("waterfront") || n.includes("jbr")) && p.name.length > 3;
        });
        if (!beach) continue;
        const distUrl = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${lat},${lng}&destinations=place_id:${beach.place_id}&mode=driving&key=${GOOGLE_API_KEY}`;
        const distRes = await fetch(distUrl);
        const distData = await distRes.json();
        if (distData.status === "OK" && distData.rows[0]?.elements[0]?.status === "OK") {
          const distKm = Math.round(distData.rows[0].elements[0].distance.value / 100) / 10;
          if (distKm > 0) return { name: beach.name, distKm };
        }
        await sleep(100);
      }
    }
  }
  return null;
}

async function run() {
  const snap = await db.collection("neighbourhoodScores").get();
  const communities = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  
  console.log("Fixing beach distances for", communities.length, "communities...\n");
  
  let fixed = 0;
  for (let i = 0; i < communities.length; i++) {
    const comm = communities[i];
    if (!comm.lat || !comm.lng) continue;
    
    try {
      const beach = await findBeach(comm.lat, comm.lng);
      if (beach) {
        await db.collection("neighbourhoodScores").doc(comm.id).update({
          distBeach:    beach.distKm,
          nearestBeach: beach.name,
          hasBeach:     beach.distKm <= 2,
          updatedAt:    new Date().toISOString(),
        });
        fixed++;
        console.log(`[${i+1}] ${comm.community}: ${beach.name} ${beach.distKm}km`);
      } else {
        console.log(`[${i+1}] ${comm.community}: no beach found`);
      }
      await sleep(400);
    } catch(e) {
      console.log(`[${i+1}] ${comm.community}: ERROR ${e.message}`);
    }
  }
  
  console.log("\nFixed:", fixed, "communities with beach data");
  process.exit(0);
}
run().catch(e=>{console.error(e);process.exit(1);});