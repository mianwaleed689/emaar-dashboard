const admin = require("firebase-admin");
const sa = require("../serviceAccountKey.json");
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

async function run() {
  const snap = await db.collection("projects").get();
  const projects = snap.docs.map(d=>({id:d.id,...d.data()}));
  
  // Check completeness of key fields
  const fields = [
    "priceMin","priceMax","ppsf","handover","handoverDate",
    "launchDate","grossYield","totalUnits","constructionPct",
    "paymentPlan","reraNo","community","developer"
  ];
  
  console.log("FIELD COMPLETENESS:");
  fields.forEach(f => {
    const count = projects.filter(p=>p[f]&&p[f]!==0&&p[f]!=="").length;
    console.log(f.padEnd(20), count+"/"+projects.length);
  });
  
  // Show 3 most complete projects
  console.log("\n=== TOP 3 MOST COMPLETE PROJECTS ===");
  const scored = projects.map(p=>({
    name: p.name||p.project,
    community: p.community,
    completeness: p.dataCompleteness||0,
    priceMin: p.priceMin,
    handover: p.handover||p.handoverDate,
    yield: p.grossYield,
    ppsf: p.ppsf,
    units: p.totalUnits,
  })).sort((a,b)=>b.completeness-a.completeness);
  
  scored.slice(0,5).forEach(p=>console.log(
    p.name?.substring(0,30).padEnd(30),
    "| price:", p.priceMin||"--",
    "| handover:", p.handover||"--",
    "| yield:", p.yield||"--",
    "| units:", p.units||"--"
  ));
  
  process.exit(0);
}
run().catch(e=>{console.error(e);process.exit(1);});