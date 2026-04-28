const admin = require("firebase-admin");
const sa = require("../serviceAccountKey.json");
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

async function run() {
  // Get a sample project from each community to check yield/distance data
  const projects = await db.collection("projects").get();
  
  const commSample = {};
  projects.docs.forEach(d => {
    const data = d.data();
    const comm = data.community || "";
    if (!comm || comm === "Dubai") return;
    if (!commSample[comm]) commSample[comm] = data;
  });

  Object.entries(commSample).forEach(([comm, p]) => {
    console.log("\n=== " + comm + " ===");
    console.log("  grossYield:", p.grossYield, "| netYield:", p.netYield);
    console.log("  ppsf:", p.ppsf, "| serviceCharge:", p.serviceCharge);
    console.log("  distMetro:", p.distMetro, "| nearestMetro:", p.nearestMetro);
    console.log("  distBeach:", p.distBeach, "| distMall:", p.distMall);
    console.log("  distSchool:", p.distSchool, "| distHospital:", p.distHospital);
    console.log("  goldenVisa:", p.goldenVisa);
    console.log("  priceMin:", p.priceMin, "| priceMax:", p.priceMax);
  });

  process.exit(0);
}
run().catch(e => { console.error(e); process.exit(1); });