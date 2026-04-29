const admin = require("firebase-admin");
const sa = require("../serviceAccountKey.json");
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

async function run() {
  const snap = await db.collection("projects").get();
  const active = snap.docs.map(d=>d.data()).filter(p=>!p.archived);
  
  // Show field completeness
  const fields = ["name","community","developer","handoverQuarter","constructionPct","totalUnits","priceMin","grossYield","escrowBank","lifecycle","status","description"];
  console.log("Active projects:", active.length);
  console.log("\nField completeness:");
  fields.forEach(f=>{
    const count = active.filter(p=>p[f]&&p[f]!==0&&p[f]!=="null"&&p[f]!=="").length;
    console.log(f.padEnd(20), count+"/"+active.length);
  });

  // Sample 3 DLD projects
  console.log("\n=== 3 DLD SAMPLE PROJECTS ===");
  active.filter(p=>p.dldImported).slice(0,3).forEach(p=>{
    console.log("\nName:", p.name?.substring(0,40));
    console.log("Community:", p.community, "| Master:", p.masterProject?.substring(0,30));
    console.log("Developer:", p.developer?.substring(0,40));
    console.log("Handover:", p.handoverQuarter, "| Construction:", p.constructionPct+"%");
    console.log("Units:", p.totalUnits, "| Escrow:", p.escrowBank?.substring(0,30));
  });
  process.exit(0);
}
run().catch(e=>{console.error(e);process.exit(1);});