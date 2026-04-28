const admin = require("firebase-admin");
const sa = require("../serviceAccountKey.json");
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

const GOOGLE_API_KEY = "AIzaSyAqv0r7D5Z1hnf0yrP1Ijxmat6HYTTRZmw";
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function findPlace(lat, lng, type, keyword, minRadius=1000) {
  for (const radius of [minRadius, 2000, 5000, 8000]) {
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=${type}${keyword?"&keyword="+encodeURIComponent(keyword):""}&language=en&key=${GOOGLE_API_KEY}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.status !== "OK" || !data.results.length) { await sleep(80); continue; }

    const place = data.results.find(p => {
      const n = p.name || "";
      if (n.includes("www.") || n.length < 3) return false;
      return true;
    });
    if (!place) { await sleep(80); continue; }

    const distUrl = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${lat},${lng}&destinations=place_id:${place.place_id}&mode=driving&key=${GOOGLE_API_KEY}`;
    const distRes = await fetch(distUrl);
    const distData = await distRes.json();
    if (distData.status === "OK" && distData.rows[0]?.elements[0]?.status === "OK") {
      const distKm = Math.round(distData.rows[0].elements[0].distance.value / 100) / 10;
      if (distKm > 0) return { name: place.name, distKm };
    }
    await sleep(80);
  }
  return null;
}

async function findSupermarket(lat, lng) {
  // Prioritize major supermarket chains in Dubai
  for (const radius of [1000, 2000, 4000]) {
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=supermarket&language=en&key=${GOOGLE_API_KEY}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.status !== "OK" || !data.results.length) { await sleep(80); continue; }
    const chains = ["carrefour","spinneys","lulu","waitrose","choithrams","géant","geant","union coop","al maya","viva","west zone","grandiose"];
    const major = data.results.find(p => chains.some(c => p.name.toLowerCase().includes(c)));
    const place = major || data.results[0];
    if (!place || place.name.length < 3) continue;
    const distUrl = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${lat},${lng}&destinations=place_id:${place.place_id}&mode=driving&key=${GOOGLE_API_KEY}`;
    const distRes = await fetch(distUrl);
    const distData = await distRes.json();
    if (distData.status === "OK" && distData.rows[0]?.elements[0]?.status === "OK") {
      const distKm = Math.round(distData.rows[0].elements[0].distance.value / 100) / 10;
      if (distKm > 0) return { name: place.name, distKm };
    }
    await sleep(80);
  }
  return null;
}

async function findPark(lat, lng) {
  for (const radius of [1000, 3000, 6000]) {
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=park&language=en&key=${GOOGLE_API_KEY}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.status !== "OK" || !data.results.length) { await sleep(80); continue; }
    const park = data.results.find(p => {
      const n = p.name.toLowerCase();
      return (n.includes("park") || n.includes("garden") || n.includes("green") || n.includes("reserve")) && p.name.length > 3;
    }) || data.results[0];
    if (!park || park.name.length < 3) continue;
    const distUrl = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${lat},${lng}&destinations=place_id:${park.place_id}&mode=driving&key=${GOOGLE_API_KEY}`;
    const distRes = await fetch(distUrl);
    const distData = await distRes.json();
    if (distData.status === "OK" && distData.rows[0]?.elements[0]?.status === "OK") {
      const distKm = Math.round(distData.rows[0].elements[0].distance.value / 100) / 10;
      if (distKm > 0) return { name: park.name, distKm };
    }
    await sleep(80);
  }
  return null;
}

async function findMosque(lat, lng) {
  for (const radius of [500, 1000, 2000, 4000]) {
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=mosque&language=en&key=${GOOGLE_API_KEY}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.status !== "OK" || !data.results.length) { await sleep(80); continue; }
    const mosque = data.results.find(p => p.name.length > 3) || data.results[0];
    if (!mosque) continue;
    const distUrl = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${lat},${lng}&destinations=place_id:${mosque.place_id}&mode=walking&key=${GOOGLE_API_KEY}`;
    const distRes = await fetch(distUrl);
    const distData = await distRes.json();
    if (distData.status === "OK" && distData.rows[0]?.elements[0]?.status === "OK") {
      const distKm = Math.round(distData.rows[0].elements[0].distance.value / 100) / 10;
      if (distKm >= 0) return { name: mosque.name, distKm };
    }
    await sleep(80);
  }
  return null;
}

async function findNursery(lat, lng) {
  for (const radius of [1000, 3000, 5000]) {
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&keyword=nursery+dubai&language=en&key=${GOOGLE_API_KEY}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.status !== "OK" || !data.results.length) { await sleep(80); continue; }
    const nursery = data.results.find(p => {
      const n = p.name.toLowerCase();
      return (n.includes("nursery") || n.includes("kindergarten") || n.includes("early learning") || n.includes("montessori")) && p.name.length > 3;
    });
    if (!nursery) continue;
    const distUrl = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${lat},${lng}&destinations=place_id:${nursery.place_id}&mode=driving&key=${GOOGLE_API_KEY}`;
    const distRes = await fetch(distUrl);
    const distData = await distRes.json();
    if (distData.status === "OK" && distData.rows[0]?.elements[0]?.status === "OK") {
      const distKm = Math.round(distData.rows[0].elements[0].distance.value / 100) / 10;
      if (distKm > 0) return { name: nursery.name, distKm };
    }
    await sleep(80);
  }
  return null;
}

async function findPharmacy(lat, lng) {
  for (const radius of [500, 1000, 2000]) {
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=pharmacy&language=en&key=${GOOGLE_API_KEY}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.status !== "OK" || !data.results.length) { await sleep(80); continue; }
    const place = data.results.find(p => p.name.length > 3) || data.results[0];
    if (!place) continue;
    const distUrl = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${lat},${lng}&destinations=place_id:${place.place_id}&mode=driving&key=${GOOGLE_API_KEY}`;
    const distRes = await fetch(distUrl);
    const distData = await distRes.json();
    if (distData.status === "OK" && distData.rows[0]?.elements[0]?.status === "OK") {
      const distKm = Math.round(distData.rows[0].elements[0].distance.value / 100) / 10;
      if (distKm >= 0) return { name: place.name, distKm };
    }
    await sleep(80);
  }
  return null;
}

async function findGym(lat, lng) {
  for (const radius of [500, 1000, 2000, 3000]) {
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=gym&language=en&key=${GOOGLE_API_KEY}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.status !== "OK" || !data.results.length) { await sleep(80); continue; }
    const place = data.results.find(p => p.name.length > 3) || data.results[0];
    if (!place) continue;
    const distUrl = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${lat},${lng}&destinations=place_id:${place.place_id}&mode=driving&key=${GOOGLE_API_KEY}`;
    const distRes = await fetch(distUrl);
    const distData = await distRes.json();
    if (distData.status === "OK" && distData.rows[0]?.elements[0]?.status === "OK") {
      const distKm = Math.round(distData.rows[0].elements[0].distance.value / 100) / 10;
      if (distKm >= 0) return { name: place.name, distKm };
    }
    await sleep(80);
  }
  return null;
}

async function findRestaurant(lat, lng) {
  for (const radius of [500, 1000, 2000]) {
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=restaurant&language=en&rankby=prominence&key=${GOOGLE_API_KEY}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.status !== "OK" || !data.results.length) { await sleep(80); continue; }
    const place = data.results.find(p => p.name.length > 3 && (p.rating||0) >= 4.0) || data.results[0];
    if (!place) continue;
    const distUrl = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${lat},${lng}&destinations=place_id:${place.place_id}&mode=walking&key=${GOOGLE_API_KEY}`;
    const distRes = await fetch(distUrl);
    const distData = await distRes.json();
    if (distData.status === "OK" && distData.rows[0]?.elements[0]?.status === "OK") {
      const distKm = Math.round(distData.rows[0].elements[0].distance.value / 100) / 10;
      if (distKm >= 0) return { name: place.name, distKm, rating: place.rating };
    }
    await sleep(80);
  }
  return null;
}

async function run() {
  const snap = await db.collection("neighbourhoodScores").get();
  const communities = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  console.log("Fetching extended facilities for", communities.length, "communities...\n");

  let done = 0;
  for (let i = 0; i < communities.length; i++) {
    const comm = communities[i];
    if (!comm.lat || !comm.lng) { console.log(`[${i+1}] ${comm.community}: no coords`); continue; }

    try {
      const [supermarket, park, mosque, nursery, pharmacy, gym, restaurant] = await Promise.all([
        findSupermarket(comm.lat, comm.lng),
        findPark(comm.lat, comm.lng),
        findMosque(comm.lat, comm.lng),
        findNursery(comm.lat, comm.lng),
        findPharmacy(comm.lat, comm.lng),
        findGym(comm.lat, comm.lng),
        findRestaurant(comm.lat, comm.lng),
      ]);

      await db.collection("neighbourhoodScores").doc(comm.id).update({
        nearestSupermarket: supermarket?.name || null,
        distSupermarket:    supermarket?.distKm || null,
        hasSupermarket:     supermarket ? supermarket.distKm <= 2 : false,
        nearestPark:        park?.name || null,
        distPark:           park?.distKm || null,
        hasPark:            park ? park.distKm <= 2 : false,
        nearestMosque:      mosque?.name || null,
        distMosque:         mosque?.distKm || null,
        nearestNursery:     nursery?.name || null,
        distNursery:        nursery?.distKm || null,
        hasNursery:         nursery ? nursery.distKm <= 3 : false,
        nearestPharmacy:    pharmacy?.name || null,
        distPharmacy:       pharmacy?.distKm || null,
        nearestGym:         gym?.name || null,
        distGym:            gym?.distKm || null,
        nearestRestaurant:  restaurant?.name || null,
        distRestaurant:     restaurant?.distKm || null,
        restaurantRating:   restaurant?.rating || null,
        updatedAt:          new Date().toISOString(),
      });

      done++;
      console.log(`[${i+1}/${communities.length}] ${comm.community} | Supermarket: ${supermarket?.name||"—"} ${supermarket?.distKm||""}km | Park: ${park?.name||"—"} | Mosque: ${mosque?.name||"—"}`);
      await sleep(400);
    } catch(e) {
      console.log(`[${i+1}] ${comm.community}: ERROR ${e.message}`);
    }
  }

  console.log("\nDone:", done, "communities updated with extended facilities");
  process.exit(0);
}
run().catch(e=>{console.error(e);process.exit(1);});