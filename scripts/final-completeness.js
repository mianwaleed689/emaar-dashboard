const admin = require("firebase-admin");
const sa = require("../serviceAccountKey.json");
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

async function run() {
  const snap = await db.collection("neighbourhoodScores").get();
  const docs = snap.docs.map(d=>d.data());
  
  console.log("=== FINAL DATA COMPLETENESS ===");
  console.log("Total communities:", docs.length);
  console.log("");
  
  const fields = [
    { label:"Coordinates",      check: d=>d.lat&&d.lng },
    { label:"PPSF",             check: d=>d.avgPpsf },
    { label:"Gross Yield",      check: d=>d.grossYield },
    { label:"Investment Score", check: d=>d.investmentScore },
    { label:"Metro (named)",    check: d=>d.nearestMetro },
    { label:"School (named)",   check: d=>d.nearestSchool },
    { label:"Hospital (named)", check: d=>d.nearestHospital },
    { label:"Mall (named)",     check: d=>d.nearestMall },
    { label:"Beach",            check: d=>d.nearestBeach||d.distBeach },
    { label:"Supermarket",      check: d=>d.nearestSupermarket },
    { label:"Park",             check: d=>d.nearestPark },
    { label:"Mosque",           check: d=>d.nearestMosque },
    { label:"Nursery",          check: d=>d.nearestNursery },
    { label:"Pharmacy",         check: d=>d.nearestPharmacy },
    { label:"Sports",           check: d=>d.nearestSports },
    { label:"Restaurant",       check: d=>d.nearestRestaurant },
    { label:"Landmarks (12)",   check: d=>d.landmarks },
    { label:"Airport dist",     check: d=>d.distAirport },
  ];

  fields.forEach(f => {
    const count = docs.filter(f.check).length;
    const pct   = Math.round(count/docs.length*100);
    const bar   = "█".repeat(Math.round(pct/5))+"░".repeat(20-Math.round(pct/5));
    const status = pct===100?"✅":pct>=80?"🟡":"❌";
    console.log(`${status} ${f.label.padEnd(20)} ${bar} ${count}/${docs.length} (${pct}%)`);
  });
  process.exit(0);
}
run().catch(e=>{console.error(e);process.exit(1);});