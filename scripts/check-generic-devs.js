const admin = require("firebase-admin");
const sa = require("../serviceAccountKey.json");
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

async function run() {
  const snap = await db.collection("projects")
    .where("developer","==","Dubai Real Estate Developer").get();
  
  console.log("Generic developer projects:", snap.size);
  console.log("\nSample communities:");
  const commCount = {};
  snap.docs.forEach(d=>{
    const c = d.data().community||"Unknown";
    commCount[c]=(commCount[c]||0)+1;
  });
  Object.entries(commCount).sort((a,b)=>b[1]-a[1]).slice(0,15)
    .forEach(([c,n])=>console.log(n.toString().padStart(4), c));
  
  // Show sample projects
  console.log("\nSample projects:");
  snap.docs.slice(0,5).forEach(d=>{
    const p=d.data();
    console.log(p.name?.substring(0,35).padEnd(35), "| comm:", p.community?.substring(0,20), "| master:", p.masterProject?.substring(0,20));
  });
  process.exit(0);
}
run().catch(e=>{console.error(e);process.exit(1);});