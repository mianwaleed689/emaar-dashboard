const admin = require("firebase-admin");
const sa = require("../serviceAccountKey.json");
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

async function run() {
  const snap = await db.collection("neighbourhoodScores").get();
  const verified = snap.docs.filter(d=>d.data().tier==="verified");
  const dld = snap.docs.filter(d=>d.data().tier==="dld-registry");
  const noTier = snap.docs.filter(d=>!d.data().tier);
  
  console.log("=== TOTAL:", snap.size, "===");
  console.log("Verified (full data):", verified.length);
  console.log("DLD Registry:", dld.length);
  console.log("No tier:", noTier.length);
  
  // Check how many DLD still have null PPSF
  const nullPpsf = dld.filter(d=>!d.data().avgPpsf);
  const hasPpsf  = dld.filter(d=>d.data().avgPpsf);
  console.log("\nDLD with PPSF:", hasPpsf.length);
  console.log("DLD without PPSF:", nullPpsf.length);
  
  process.exit(0);
}
run().catch(e => { console.error(e); process.exit(1); });