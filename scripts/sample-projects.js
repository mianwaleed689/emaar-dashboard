const admin = require("firebase-admin");
const sa = require("../serviceAccountKey.json");
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

async function run() {
  const snap = await db.collection("projects")
    .where("archived","!=",true)
    .limit(5).get();
  
  snap.docs.forEach(d=>{
    const p = d.data();
    console.log("\n=== PROJECT ===");
    console.log("Name:", p.name);
    console.log("Community:", p.community);
    console.log("Developer:", p.developer?.substring(0,40));
    console.log("Status:", p.status, "| Lifecycle:", p.lifecycle);
    console.log("Construction:", p.constructionPct+"%");
    console.log("Handover:", p.handoverQuarter||"--");
    console.log("Units:", p.totalUnits||"--");
    console.log("Price:", p.priceMin||"--");
    console.log("Yield:", p.grossYield||"--");
    console.log("Escrow:", p.escrowBank?.substring(0,30)||"--");
  });
  process.exit(0);
}
run().catch(e=>{console.error(e);process.exit(1);});