const admin = require("firebase-admin");
const sa = require("../serviceAccountKey.json");
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

async function run() {
  const snap = await db.collection("neighbourhoodScores").get();
  const verified = snap.docs.filter(d=>d.data().tier==="verified");
  const dld      = snap.docs.filter(d=>d.data().tier==="dld-registry");
  
  // Check completeness
  const complete = snap.docs.filter(d=>{
    const n = d.data();
    return n.grossYield && n.avgPpsf && n.distMetro!=null && n.investmentScore;
  });
  
  const missingYield = snap.docs.filter(d=>!d.data().grossYield);
  const missingPpsf  = snap.docs.filter(d=>!d.data().avgPpsf);
  const missingScore = snap.docs.filter(d=>!d.data().investmentScore);

  console.log("=== FINAL COUNT ===");
  console.log("Total communities:    ", snap.size);
  console.log("Verified (full data): ", verified.length);
  console.log("DLD Registry:         ", dld.length);
  console.log("\n=== DATA COMPLETENESS ===");
  console.log("Fully complete:       ", complete.length);
  console.log("Missing yield:        ", missingYield.length);
  console.log("Missing PPSF:         ", missingPpsf.length);
  console.log("Missing score:        ", missingScore.length);

  if(missingYield.length) {
    console.log("\nMissing yield:");
    missingYield.forEach(d=>console.log(" ",d.data().community));
  }
  if(missingPpsf.length) {
    console.log("\nMissing PPSF:");
    missingPpsf.slice(0,10).forEach(d=>console.log(" ",d.data().community));
    if(missingPpsf.length>10) console.log("  ...and", missingPpsf.length-10, "more");
  }

  process.exit(0);
}
run().catch(e=>{console.error(e);process.exit(1);});