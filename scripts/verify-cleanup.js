const admin = require("firebase-admin");
const sa = require("../serviceAccountKey.json");
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

async function run() {
  const snap = await db.collection("projects").get();
  const active = snap.docs.map(d=>d.data()).filter(p=>!p.archived);
  const isArabic = s => /[\u0600-\u06FF]/.test(s||"");
  
  const arabicDev   = active.filter(p=>isArabic(p.developer||"")).length;
  const arabicBank  = active.filter(p=>isArabic(p.escrowBank||"")).length;
  const badName     = active.filter(p=>!p.name||p.name===".").length;
  
  console.log("Arabic developers remaining:", arabicDev);
  console.log("Arabic banks remaining:", arabicBank);
  console.log("Bad names remaining:", badName);
  
  // Sample 5 DLD projects
  console.log("\nSample projects:");
  active.filter(p=>p.dldImported).slice(0,5).forEach(p=>
    console.log(
      (p.name||"").substring(0,30).padEnd(30),
      "| dev:", (p.developer||"").substring(0,20).padEnd(20),
      "| bank:", (p.escrowBank||"").substring(0,20),
      "| handover:", p.handoverQuarter||"--"
    )
  );
  process.exit(0);
}
run().catch(e=>{console.error(e);process.exit(1);});