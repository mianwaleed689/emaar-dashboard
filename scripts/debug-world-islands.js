const admin = require("firebase-admin");
const sa = require("../serviceAccountKey.json");
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

async function run() {
  // Check The World Islands in neighbourhoodScores
  const snap = await db.collection("neighbourhoodScores")
    .where("community","==","The World Islands").get();
  if(snap.empty) { console.log("The World Islands NOT in neighbourhoodScores"); }
  else {
    const n = snap.docs[0].data();
    console.log("nearestMall:", n.nearestMall||"MISSING");
    console.log("nearestHospital:", n.nearestHospital||"MISSING");
    console.log("serviceCharge:", n.serviceCharge||"MISSING");
  }

  // Check the project
  const pSnap = await db.collection("projects").where("name","==","The World Project 2586").get();
  if(!pSnap.empty) {
    const p = pSnap.docs[0].data();
    console.log("\nProject community field:", p.community);
    console.log("Project nearestMall:", p.nearestMall||"MISSING");
  }
  process.exit(0);
}
run().catch(e=>{console.error(e);process.exit(1);});