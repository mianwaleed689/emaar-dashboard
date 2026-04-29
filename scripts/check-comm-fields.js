const admin = require("firebase-admin");
const sa = require("../serviceAccountKey.json");
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

async function run() {
  const comms = ["Palm Deira","Dubailand","DAMAC Hills 2","Emaar South","Palm Jumeirah","Al Jadaf","Dubai Silicon Oasis"];
  
  for(const c of comms) {
    const snap = await db.collection("neighbourhoodScores").where("community","==",c).limit(1).get();
    if(snap.empty) { console.log(c, "NOT FOUND"); continue; }
    const n = snap.docs[0].data();
    console.log(c.padEnd(25), "| metro:", n.nearestMetro||"MISSING", "| mall:", n.nearestMall||"MISSING", "| yield:", n.grossYield||"MISSING");
  }
  process.exit(0);
}
run().catch(e=>{console.error(e);process.exit(1);});