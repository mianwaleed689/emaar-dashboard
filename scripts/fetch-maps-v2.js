const admin = require("firebase-admin");
const sa = require("../serviceAccountKey.json");
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

const GOOGLE_API_KEY = "AIzaSyAqv0r7D5Z1hnf0yrP1Ijxmat6HYTTRZmw";
const APPLY = process.argv.includes("--apply");
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function geocode(community) {
  const query = encodeURIComponent(community + " Dubai residential area UAE");
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${query}&key=${GOOGLE_API_KEY}&language=en&region=ae`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.status === "OK" && data.results.length > 0) {
    return data.results[0].geometry.location;
  }
  return null;
}

async function findNearestPlace(lat, lng, keyword, minRadiusM = 500) {
  // Search with increasing radius until we find something real
  for (const radius of [1000, 3000, 5000, 10000]) {
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&keyword=${encodeURIComponent(keyword)}&language=en&key=${GOOGLE_API_KEY}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.status === "OK" && data.results.length > 0) {
      // Filter out results with 0 distance or clearly wrong names
      const filtered = data.results.filter(p => {
        const name = p.name || "";
        // Skip websites, arabic-only names with no english, obvious non-matches
        if (name.includes("www.") || name.includes(".com")) return false;
        if (name.length < 3) return false;
        return true;
      });
      if (filtered.length === 0) continue;
      const place = filtered[0];

      // Get real distance
      const distUrl = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${lat},${lng}&destinations=place_id:${place.place_id}&mode=driving&key=${GOOGLE_API_KEY}&language=en`;
      const distRes = await fetch(distUrl);
      const distData = await distRes.json();
      let distKm = null;
      if (distData.status === "OK" && distData.rows[0]?.elements[0]?.status === "OK") {
        distKm = Math.round(distData.rows[0].elements[0].distance.value / 100) / 10;
      }
      if (distKm !== null && distKm > 0) {
        return { name: place.name, distKm, placeId: place.place_id };
      }
    }
    await sleep(100);
  }
  return null;
}

async function findMetro(lat, lng) {
  for (const radius of [1000, 2000, 5000, 8000]) {
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&keyword=dubai+metro+station&type=transit_station&language=en&key=${GOOGLE_API_KEY}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.status === "OK" && data.results.length > 0) {
      const place = data.results[0];
      const distUrl = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${lat},${lng}&destinations=place_id:${place.place_id}&mode=walking&key=${GOOGLE_API_KEY}`;
      const distRes = await fetch(distUrl);
      const distData = await distRes.json();
      let distKm = null;
      if (distData.status === "OK" && distData.rows[0]?.elements[0]?.status === "OK") {
        distKm = Math.round(distData.rows[0].elements[0].distance.value / 100) / 10;
      }
      if (distKm !== null && distKm > 0) {
        // Clean up metro name
        let name = place.name
          .replace("Metro Station", "").replace("metro station", "")
          .replace("Metro Bus Stop", "").replace(" - Oceanside","")
          .replace(" - Landside","").trim();
        return { name: name + " Metro", distKm };
      }
    }
    await sleep(100);
  }
  return null;
}

async function findBeach(lat, lng) {
  for (const radius of [2000, 5000, 10000, 20000]) {
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&keyword=public+beach+dubai&language=en&key=${GOOGLE_API_KEY}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.status === "OK" && data.results.length > 0) {
      const beach = data.results.find(p => {
        const n = p.name.toLowerCase();
        return n.includes("beach") || n.includes("corniche") || n.includes("waterfront");
      });
      if (!beach) continue;
      const distUrl = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${lat},${lng}&destinations=place_id:${beach.place_id}&mode=driving&key=${GOOGLE_API_KEY}`;
      const distRes = await fetch(distUrl);
      const distData = await distRes.json();
      let distKm = null;
      if (distData.status === "OK" && distData.rows[0]?.elements[0]?.status === "OK") {
        distKm = Math.round(distData.rows[0].elements[0].distance.value / 100) / 10;
      }
      if (distKm !== null && distKm > 0) return { name: beach.name, distKm };
    }
    await sleep(100);
  }
  return null;
}

async function findMall(lat, lng) {
  for (const radius of [2000, 5000, 10000]) {
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=shopping_mall&language=en&key=${GOOGLE_API_KEY}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.status === "OK" && data.results.length > 0) {
      const mall = data.results.find(p => {
        const n = p.name.toLowerCase();
        return (n.includes("mall") || n.includes("centre") || n.includes("center") || n.includes("plaza")) 
               && !n.includes("www") && p.name.length > 5;
      });
      if (!mall) continue;
      const distUrl = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${lat},${lng}&destinations=place_id:${mall.place_id}&mode=driving&key=${GOOGLE_API_KEY}`;
      const distRes = await fetch(distUrl);
      const distData = await distRes.json();
      let distKm = null;
      if (distData.status === "OK" && distData.rows[0]?.elements[0]?.status === "OK") {
        distKm = Math.round(distData.rows[0].elements[0].distance.value / 100) / 10;
      }
      if (distKm !== null && distKm > 0) return { name: mall.name, distKm };
    }
    await sleep(100);
  }
  return null;
}

async function findSchool(lat, lng) {
  for (const radius of [2000, 5000, 8000]) {
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=school&keyword=school&language=en&key=${GOOGLE_API_KEY}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.status === "OK" && data.results.length > 0) {
      const school = data.results.find(p => {
        const n = p.name.toLowerCase();
        return (n.includes("school") || n.includes("academy") || n.includes("college"))
               && !n.includes("www") && p.name.length > 5;
      });
      if (!school) continue;
      const distUrl = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${lat},${lng}&destinations=place_id:${school.place_id}&mode=driving&key=${GOOGLE_API_KEY}`;
      const distRes = await fetch(distUrl);
      const distData = await distRes.json();
      let distKm = null;
      if (distData.status === "OK" && distData.rows[0]?.elements[0]?.status === "OK") {
        distKm = Math.round(distData.rows[0].elements[0].distance.value / 100) / 10;
      }
      if (distKm !== null && distKm > 0) return { name: school.name, distKm };
    }
    await sleep(100);
  }
  return null;
}

async function findHospital(lat, lng) {
  for (const radius of [2000, 5000, 10000]) {
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=hospital&language=en&key=${GOOGLE_API_KEY}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.status === "OK" && data.results.length > 0) {
      const hosp = data.results.find(p => {
        const n = p.name.toLowerCase();
        return (n.includes("hospital") || n.includes("medical") || n.includes("clinic") || n.includes("health"))
               && !n.includes("www") && p.name.length > 5;
      });
      if (!hosp) continue;
      const distUrl = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${lat},${lng}&destinations=place_id:${hosp.place_id}&mode=driving&key=${GOOGLE_API_KEY}`;
      const distRes = await fetch(distUrl);
      const distData = await distRes.json();
      let distKm = null;
      if (distData.status === "OK" && distData.rows[0]?.elements[0]?.status === "OK") {
        distKm = Math.round(distData.rows[0].elements[0].distance.value / 100) / 10;
      }
      if (distKm !== null && distKm > 0) return { name: hosp.name, distKm };
    }
    await sleep(100);
  }
  return null;
}

// Dubai International Airport coordinates
const DXB = { lat: 25.2532, lng: 55.3657 };
function calcAirportDist(lat, lng) {
  const dLat = (lat - DXB.lat) * 111;
  const dLng = (lng - DXB.lng) * 111 * Math.cos(lat * Math.PI/180);
  return Math.round(Math.sqrt(dLat*dLat + dLng*dLng) * 10) / 10;
}

async function run() {
  console.log(APPLY ? "APPLYING TO ALL" : "DRY RUN (first 5)");

  const snap = await db.collection("neighbourhoodScores").get();
  const communities = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  const toProcess = APPLY ? communities : communities.slice(0, 5);

  console.log("Processing:", toProcess.length, "communities\n");

  let success = 0, failed = 0;

  for (let i = 0; i < toProcess.length; i++) {
    const comm = toProcess[i];
    console.log(`[${i+1}/${toProcess.length}] ${comm.community}`);

    try {
      const coords = await geocode(comm.community);
      if (!coords) { console.log("  SKIP - geocode failed"); failed++; continue; }
      await sleep(150);

      const [metro, school, hospital, mall, beach] = await Promise.all([
        findMetro(coords.lat, coords.lng).then(r => { sleep(150); return r; }),
        findSchool(coords.lat, coords.lng).then(r => { sleep(150); return r; }),
        findHospital(coords.lat, coords.lng).then(r => { sleep(150); return r; }),
        findMall(coords.lat, coords.lng).then(r => { sleep(150); return r; }),
        findBeach(coords.lat, coords.lng).then(r => { sleep(150); return r; }),
      ]);

      const airportDist = calcAirportDist(coords.lat, coords.lng);

      console.log(`  Metro:    ${metro    ? metro.name    + " " + metro.distKm    + "km" : "—"}`);
      console.log(`  School:   ${school   ? school.name   + " " + school.distKm   + "km" : "—"}`);
      console.log(`  Hospital: ${hospital ? hospital.name + " " + hospital.distKm + "km" : "—"}`);
      console.log(`  Mall:     ${mall     ? mall.name     + " " + mall.distKm     + "km" : "—"}`);
      console.log(`  Beach:    ${beach    ? beach.name    + " " + beach.distKm    + "km" : "—"}`);
      console.log(`  Airport:  ${airportDist}km`);

      if (APPLY) {
        await db.collection("neighbourhoodScores").doc(comm.id).update({
          lat: coords.lat, lng: coords.lng,
          distMetro:       metro?.distKm    ?? null,
          nearestMetro:    metro?.name      ?? null,
          hasMetro:        metro ? metro.distKm <= 1.5 : false,
          distSchool:      school?.distKm   ?? null,
          nearestSchool:   school?.name     ?? null,
          hasSchool:       school ? school.distKm <= 3 : false,
          distHospital:    hospital?.distKm ?? null,
          nearestHospital: hospital?.name   ?? null,
          hasHospital:     hospital ? hospital.distKm <= 5 : false,
          distMall:        mall?.distKm     ?? null,
          nearestMall:     mall?.name       ?? null,
          hasMall:         mall ? mall.distKm <= 3 : false,
          distBeach:       beach?.distKm    ?? null,
          nearestBeach:    beach?.name      ?? null,
          hasBeach:        beach ? beach.distKm <= 2 : false,
          distAirport:     airportDist,
          dataSource:      "google-maps-api-2026",
          updatedAt:       new Date().toISOString(),
        });
      }
      success++;
      await sleep(500); // Rate limit protection between communities
    } catch(e) {
      console.log("  ERROR:", e.message);
      failed++;
    }
  }

  console.log(`\n=== DONE === Success: ${success} | Failed: ${failed}`);
  process.exit(0);
}
run().catch(e => { console.error(e); process.exit(1); });