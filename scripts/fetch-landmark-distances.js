const admin = require("firebase-admin");
const sa = require("../serviceAccountKey.json");
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

const GOOGLE_API_KEY = "AIzaSyAqv0r7D5Z1hnf0yrP1Ijxmat6HYTTRZmw";
const sleep = ms => new Promise(r => setTimeout(r, ms));

// Fixed coordinates for key Dubai landmarks
const LANDMARKS = {
  dubaiMall:        { lat: 25.1972, lng: 55.2796, name: "Dubai Mall" },
  burjKhalifa:      { lat: 25.1972, lng: 55.2744, name: "Burj Khalifa" },
  palmJumeirah:     { lat: 25.1124, lng: 55.1390, name: "Palm Jumeirah" },
  dubaiMarina:      { lat: 25.0800, lng: 55.1402, name: "Dubai Marina" },
  dxbAirport:       { lat: 25.2532, lng: 55.3657, name: "DXB Airport" },
  alMaktoumAirport: { lat: 24.8966, lng: 55.1614, name: "Al Maktoum Airport" },
  expoCityDubai:    { lat: 24.9674, lng: 55.1562, name: "Expo City Dubai" },
  burjAlArab:       { lat: 25.1412, lng: 55.1853, name: "Burj Al Arab" },
  mallOfEmirates:   { lat: 25.1181, lng: 55.2003, name: "Mall of the Emirates" },
  globalVillage:    { lat: 25.0694, lng: 55.3017, name: "Global Village" },
  dubaiFrame:       { lat: 25.2353, lng: 55.3002, name: "Dubai Frame" },
  difc:             { lat: 25.2097, lng: 55.2797, name: "DIFC" },
};

async function getDistances(lat, lng, destinations) {
  // Build destinations string from coordinates
  const destStr = Object.values(destinations)
    .map(d => `${d.lat},${d.lng}`)
    .join("|");
  
  const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${lat},${lng}&destinations=${encodeURIComponent(destStr)}&mode=driving&key=${GOOGLE_API_KEY}&language=en&units=metric`;
  
  const res = await fetch(url);
  const data = await res.json();
  
  if (data.status !== "OK") return null;
  
  const result = {};
  const keys = Object.keys(destinations);
  data.rows[0].elements.forEach((el, i) => {
    if (el.status === "OK") {
      result[keys[i]] = {
        distKm:   Math.round(el.distance.value / 100) / 10,
        duration: Math.round(el.duration.value / 60), // minutes
        name:     destinations[keys[i]].name,
      };
    }
  });
  return result;
}

async function run() {
  const snap = await db.collection("neighbourhoodScores").get();
  const communities = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  
  console.log("Fetching landmark distances for", communities.length, "communities...\n");
  
  let fixed = 0;
  for (let i = 0; i < communities.length; i++) {
    const comm = communities[i];
    if (!comm.lat || !comm.lng) { console.log(`[${i+1}] ${comm.community}: no coords`); continue; }
    
    try {
      const dists = await getDistances(comm.lat, comm.lng, LANDMARKS);
      if (!dists) { console.log(`[${i+1}] ${comm.community}: API error`); continue; }
      
      await db.collection("neighbourhoodScores").doc(comm.id).update({
        landmarks: {
          dubaiMall:        dists.dubaiMall        || null,
          burjKhalifa:      dists.burjKhalifa      || null,
          palmJumeirah:     dists.palmJumeirah     || null,
          dubaiMarina:      dists.dubaiMarina      || null,
          dxbAirport:       dists.dxbAirport       || null,
          alMaktoumAirport: dists.alMaktoumAirport || null,
          expoCityDubai:    dists.expoCityDubai    || null,
          burjAlArab:       dists.burjAlArab       || null,
          mallOfEmirates:   dists.mallOfEmirates   || null,
          globalVillage:    dists.globalVillage    || null,
          dubaiFrame:       dists.dubaiFrame       || null,
          difc:             dists.difc             || null,
        },
        updatedAt: new Date().toISOString(),
      });
      fixed++;
      
      // Show sample
      if (dists.dubaiMall) {
        console.log(`[${i+1}] ${comm.community} | Dubai Mall: ${dists.dubaiMall.distKm}km (${dists.dubaiMall.duration}min) | Airport: ${dists.dxbAirport?.distKm}km`);
      }
      
      await sleep(300);
    } catch(e) {
      console.log(`[${i+1}] ${comm.community}: ERROR ${e.message}`);
    }
  }
  
  console.log("\nDone:", fixed, "communities with landmark distances");
  process.exit(0);
}
run().catch(e=>{console.error(e);process.exit(1);});