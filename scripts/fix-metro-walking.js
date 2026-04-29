const admin = require("firebase-admin");
const sa = require("../serviceAccountKey.json");
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

const GOOGLE_API_KEY = "AIzaSyAqv0r7D5Z1hnf0yrP1Ijxmat6HYTTRZmw";
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function findMetroWalking(lat, lng) {
  for (const radius of [500, 1000, 2000, 3000]) {
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&keyword=metro+station&type=transit_station&language=en&key=${GOOGLE_API_KEY}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.status !== "OK" || !data.results.length) { await sleep(80); continue; }
    
    // Get distances for top 3 results
    const top3 = data.results.slice(0, 3);
    const destStr = top3.map(p => `place_id:${p.place_id}`).join("|");
    const distUrl = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${lat},${lng}&destinations=${encodeURIComponent(destStr)}&mode=walking&key=${GOOGLE_API_KEY}`;
    const distRes = await fetch(distUrl);
    const distData = await distRes.json();
    
    if (distData.status === "OK") {
      let best = null;
      distData.rows[0].elements.forEach((el, i) => {
        if (el.status === "OK") {
          const distKm = Math.round(el.distance.value / 100) / 10;
          const name = top3[i].name
            .replace(" Metro Station","")
            .replace(" Station","")
            .replace("Metro Bus Stop","")
            .trim() + " Metro";
          if (!best || distKm < best.distKm) {
            best = { name, distKm };
          }
        }
      });
      if (best && best.distKm > 0) return best;
    }
    await sleep(100);
  }
  return null;
}

async function run() {
  const snap = await db.collection("neighbourhoodScores").get();
  const communities = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  
  // Only re-fetch metro for communities where distance seems wrong
  // or where we know there's a closer station
  const toFix = communities.filter(c => c.lat && c.lng && c.nearestMetro);
  
  console.log("Re-fetching metro (walking distance) for", toFix.length, "communities...\n");
  
  let fixed = 0;
  for (let i = 0; i < toFix.length; i++) {
    const comm = toFix[i];
    try {
      const metro = await findMetroWalking(comm.lat, comm.lng);
      if (metro && Math.abs(metro.distKm - parseFloat(comm.distMetro||99)) > 0.3) {
        await db.collection("neighbourhoodScores").doc(comm.id).update({
          nearestMetro: metro.name,
          distMetro:    metro.distKm,
          hasMetro:     metro.distKm <= 1.5,
          updatedAt:    new Date().toISOString(),
        });
        console.log(`[${i+1}] ${comm.community}: ${comm.nearestMetro} ${comm.distMetro}km -> ${metro.name} ${metro.distKm}km`);
        fixed++;
      } else {
        process.stdout.write(".");
      }
      await sleep(300);
    } catch(e) {
      console.log(`\n[${i+1}] ${comm.community}: ERROR ${e.message}`);
    }
  }
  
  console.log(`\n\nFixed: ${fixed} communities with corrected metro data`);
  process.exit(0);
}
run().catch(e=>{console.error(e);process.exit(1);});