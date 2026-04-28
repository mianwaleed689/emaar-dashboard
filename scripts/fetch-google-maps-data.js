const admin = require("firebase-admin");
const sa = require("../serviceAccountKey.json");
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

const GOOGLE_API_KEY = "AIzaSyAqv0r7D5Z1hnf0yrP1Ijxmat6HYTTRZmw";
const APPLY = process.argv.includes("--apply");

// Sleep helper to avoid rate limits
const sleep = ms => new Promise(r => setTimeout(r, ms));

// Geocode a community name to coordinates
async function geocode(community) {
  const query = encodeURIComponent(community + " Dubai UAE");
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${query}&key=${GOOGLE_API_KEY}`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.status === "OK" && data.results.length > 0) {
    const loc = data.results[0].geometry.location;
    return { lat: loc.lat, lng: loc.lng };
  }
  return null;
}

// Find nearest place of a type and return name + distance
async function findNearest(lat, lng, type, keyword) {
  const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&rankby=distance&type=${type}${keyword ? "&keyword=" + encodeURIComponent(keyword) : ""}&key=${GOOGLE_API_KEY}`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.status === "OK" && data.results.length > 0) {
    const place = data.results[0];
    const name = place.name;
    // Get distance using Distance Matrix
    const distUrl = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${lat},${lng}&destinations=place_id:${place.place_id}&mode=driving&key=${GOOGLE_API_KEY}`;
    const distRes = await fetch(distUrl);
    const distData = await distRes.json();
    let distKm = null;
    if (distData.status === "OK" && distData.rows[0].elements[0].status === "OK") {
      distKm = Math.round(distData.rows[0].elements[0].distance.value / 100) / 10;
    }
    return { name, distKm };
  }
  return null;
}

// Find nearest metro station
async function findMetro(lat, lng) {
  const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&rankby=distance&keyword=dubai+metro+station&key=${GOOGLE_API_KEY}`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.status === "OK" && data.results.length > 0) {
    const place = data.results[0];
    const distUrl = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${lat},${lng}&destinations=place_id:${place.place_id}&mode=walking&key=${GOOGLE_API_KEY}`;
    const distRes = await fetch(distUrl);
    const distData = await distRes.json();
    let distKm = null;
    if (distData.status === "OK" && distData.rows[0].elements[0].status === "OK") {
      distKm = Math.round(distData.rows[0].elements[0].distance.value / 100) / 10;
    }
    return { name: place.name, distKm };
  }
  return null;
}

async function run() {
  console.log(APPLY ? "APPLYING" : "DRY RUN (first 3 communities only)");

  const snap = await db.collection("neighbourhoodScores").get();
  const communities = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  
  const toProcess = APPLY ? communities : communities.slice(0, 3);
  console.log("Processing:", toProcess.length, "communities");

  let success = 0;
  let failed = 0;

  for (const comm of toProcess) {
    try {
      console.log("\nProcessing:", comm.community);

      // Step 1: Geocode
      const coords = await geocode(comm.community);
      if (!coords) { console.log("  SKIP - could not geocode"); failed++; continue; }
      console.log("  Coords:", coords.lat.toFixed(4), coords.lng.toFixed(4));
      await sleep(200);

      // Step 2: Metro
      const metro = await findMetro(coords.lat, coords.lng);
      console.log("  Metro:", metro ? metro.name + " " + metro.distKm + "km" : "none");
      await sleep(200);

      // Step 3: School
      const school = await findNearest(coords.lat, coords.lng, "school", "international school");
      console.log("  School:", school ? school.name + " " + school.distKm + "km" : "none");
      await sleep(200);

      // Step 4: Hospital
      const hospital = await findNearest(coords.lat, coords.lng, "hospital", null);
      console.log("  Hospital:", hospital ? hospital.name + " " + hospital.distKm + "km" : "none");
      await sleep(200);

      // Step 5: Mall
      const mall = await findNearest(coords.lat, coords.lng, "shopping_mall", null);
      console.log("  Mall:", mall ? mall.name + " " + mall.distKm + "km" : "none");
      await sleep(200);

      // Step 6: Beach
      const beach = await findNearest(coords.lat, coords.lng, "natural_feature", "beach");
      console.log("  Beach:", beach ? beach.name + " " + beach.distKm + "km" : "none");
      await sleep(200);

      if (APPLY) {
        await db.collection("neighbourhoodScores").doc(comm.id).update({
          // Coordinates
          lat: coords.lat,
          lng: coords.lng,
          // Metro
          distMetro:    metro?.distKm || null,
          nearestMetro: metro?.name   || null,
          hasMetro:     metro ? metro.distKm <= 1.5 : false,
          // School
          distSchool:   school?.distKm  || null,
          nearestSchool:school?.name    || null,
          hasSchool:    school ? school.distKm <= 3 : false,
          // Hospital
          distHospital:    hospital?.distKm || null,
          nearestHospital: hospital?.name   || null,
          hasHospital:     hospital ? hospital.distKm <= 5 : false,
          // Mall
          distMall:    mall?.distKm || null,
          nearestMall: mall?.name   || null,
          hasMall:     mall ? mall.distKm <= 3 : false,
          // Beach
          distBeach:   beach?.distKm || null,
          nearestBeach:beach?.name   || null,
          hasBeach:    beach ? beach.distKm <= 2 : false,
          // Airport (DXB) — fixed coords
          distAirport: Math.round(Math.sqrt(Math.pow((coords.lat - 25.2532)*111,2) + Math.pow((coords.lng - 55.3657)*111,2)) * 10) / 10,
          updatedAt:   new Date().toISOString(),
          dataSource:  "google-maps-api-2026",
        });
      }

      success++;
      await sleep(300); // Rate limit protection
    } catch(e) {
      console.log("  ERROR:", e.message);
      failed++;
    }
  }

  console.log("\n=== DONE ===");
  console.log("Success:", success, "| Failed:", failed);
  process.exit(0);
}
run().catch(e => { console.error(e); process.exit(1); });