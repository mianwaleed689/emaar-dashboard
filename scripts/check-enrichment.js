const admin = require("firebase-admin");
const sa = require("../serviceAccountKey.json");
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

async function run() {
  const snap = await db.collection("projects").get();
  const active = snap.docs.map(d=>d.data()).filter(p=>!p.archived);
  
  const withYield = active.filter(p=>p.grossYield>0).length;
  const withPpsf  = active.filter(p=>p.ppsf>0||p.avgPpsf>0).length;
  const withPrice = active.filter(p=>p.priceMin>0).length;
  const withScore = active.filter(p=>p.investmentScore>0).length;
  
  console.log("=== PROJECT DATA COMPLETENESS ===");
  console.log("Total active:", active.length);
  console.log("With yield:  ", withYield+"/"+active.length, Math.round(withYield/active.length*100)+"%");
  console.log("With PPSF:   ", withPpsf+"/"+active.length,  Math.round(withPpsf/active.length*100)+"%");
  console.log("With price:  ", withPrice+"/"+active.length, Math.round(withPrice/active.length*100)+"%");
  console.log("With score:  ", withScore+"/"+active.length, Math.round(withScore/active.length*100)+"%");

  // Sample DLD project
  console.log("\n=== SAMPLE DLD PROJECT ===");
  const sample = active.filter(p=>p.dldImported&&p.grossYield>0)[0];
  if(sample) {
    console.log("Name:", sample.name);
    console.log("Community:", sample.community);
    console.log("Yield:", sample.grossYield+"%");
    console.log("PPSF:", sample.ppsf||sample.avgPpsf);
    console.log("Price:", sample.priceMin);
    console.log("Score:", sample.investmentScore);
    console.log("Metro:", sample.nearestMetro, sample.distMetro+"km");
  }
  process.exit(0);
}
run().catch(e=>{console.error(e);process.exit(1);});