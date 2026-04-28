const admin = require("firebase-admin");
const sa = require("../serviceAccountKey.json");
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

async function run() {
  const snap = await db.collection("neighbourhoodScores").get();
  
  let hasMetroName = 0, hasSchoolName = 0, hasHospitalName = 0, hasMallName = 0;
  let hasBeach = 0, hasCoords = 0;
  
  // Show sample of 10 verified communities
  const verified = snap.docs.filter(d=>d.data().tier==="verified").slice(0,10);
  
  console.log("=== SAMPLE VERIFIED COMMUNITIES ===");
  verified.forEach(d => {
    const n = d.data();
    console.log("\n", n.community);
    console.log("  Metro:   ", n.nearestMetro||"—", n.distMetro ? n.distMetro+"km" : "");
    console.log("  School:  ", n.nearestSchool||"—", n.distSchool ? n.distSchool+"km" : "");
    console.log("  Hospital:", n.nearestHospital||"—", n.distHospital ? n.distHospital+"km" : "");
    console.log("  Mall:    ", n.nearestMall||"—", n.distMall ? n.distMall+"km" : "");
    console.log("  Beach:   ", n.nearestBeach||"—", n.distBeach ? n.distBeach+"km" : "");
    console.log("  Airport: ", n.distAirport ? n.distAirport+"km" : "—");
    console.log("  Source:  ", n.dataSource||"—");
  });

  snap.docs.forEach(d => {
    const n = d.data();
    if(n.nearestMetro)   hasMetroName++;
    if(n.nearestSchool)  hasSchoolName++;
    if(n.nearestHospital)hasHospitalName++;
    if(n.nearestMall)    hasMallName++;
    if(n.distBeach)      hasBeach++;
    if(n.lat)            hasCoords++;
  });

  console.log("\n=== DATA COMPLETENESS ===");
  console.log("Total:", snap.size);
  console.log("Has metro name:   ", hasMetroName);
  console.log("Has school name:  ", hasSchoolName);
  console.log("Has hospital name:", hasHospitalName);
  console.log("Has mall name:    ", hasMallName);
  console.log("Has beach:        ", hasBeach);
  console.log("Has coordinates:  ", hasCoords);

  process.exit(0);
}
run().catch(e=>{console.error(e);process.exit(1);});