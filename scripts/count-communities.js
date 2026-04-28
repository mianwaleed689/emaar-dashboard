const admin = require("firebase-admin");
const sa = require("../serviceAccountKey.json");
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

async function run() {
  const snap = await db.collection("neighbourhoodScores").get();
  const verified = snap.docs.filter(d=>d.data().tier==="verified");
  const dld = snap.docs.filter(d=>d.data().tier==="dld-registry");
  
  console.log("=== TOTAL:", snap.size, "communities ===");
  console.log("Verified (Emaar):", verified.length);
  console.log("DLD Registry:", dld.length);
  
  console.log("\n=== VERIFIED COMMUNITIES ===");
  verified.forEach(d => {
    const n = d.data();
    console.log(" ", n.community, "| score:", n.investmentScore, "| ppsf:", n.avgPpsf, "| yield:", n.grossYield);
  });

  console.log("\n=== DLD REGISTRY SAMPLE (first 10) ===");
  dld.slice(0,10).forEach(d => {
    const n = d.data();
    console.log(" ", n.community, "| medianPPSF:", n.avgPpsf, "| txns:", n.totalTransactions);
  });

  process.exit(0);
}
run().catch(e => { console.error(e); process.exit(1); });