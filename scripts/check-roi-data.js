const admin = require("firebase-admin");
const sa = require("../serviceAccountKey.json");
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

async function run() {
  // Get all communityROI docs
  const roi = await db.collection("communityROI").get();
  console.log("=== communityROI ===", roi.size, "total docs");
  roi.docs.slice(0,5).forEach(d => {
    const data = d.data();
    console.log("\n", d.id);
    console.log(" grossYield:", data.grossYield);
    console.log(" netYield:", data.netYield);
    console.log(" avgPpsf:", data.avgPpsf);
    console.log(" serviceCharge:", data.serviceCharge);
    console.log(" riskLevel:", data.riskLevel);
    console.log(" occupancy:", data.occupancy);
  });

  // Get communities sample
  const comm = await db.collection("communities").limit(3).get();
  console.log("\n=== communities sample ===");
  comm.docs.forEach(d => {
    const data = d.data();
    console.log("\n", d.id, "| name:", data.name);
    console.log(" fields:", Object.keys(data).join(", "));
  });

  process.exit(0);
}
run().catch(e => { console.error(e); process.exit(1); });