const admin = require("firebase-admin");
const sa = require("../serviceAccountKey.json");
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

async function run() {
  // Check what communities have missing data in projects
  const snap = await db.collection("projects").get();
  const active = snap.docs.map(d=>d.data()).filter(p=>!p.archived&&!p.nearestMetro);
  
  const commMissing = {};
  active.forEach(p=>{
    const c = p.community||"Unknown";
    commMissing[c]=(commMissing[c]||0)+1;
  });
  
  console.log("Projects missing community data:", active.length);
  console.log("\nTop communities missing data:");
  Object.entries(commMissing).sort((a,b)=>b[1]-a[1]).slice(0,15)
    .forEach(([c,n])=>console.log(n.toString().padStart(5), c));
  
  process.exit(0);
}
run().catch(e=>{console.error(e);process.exit(1);});