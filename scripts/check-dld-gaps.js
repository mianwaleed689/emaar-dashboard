const admin = require("firebase-admin");
const sa = require("../serviceAccountKey.json");
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

async function run() {
  const snap = await db.collection("neighbourhoodScores").where("tier","==","dld-registry").get();
  
  // Show what fields exist vs missing
  let hasPpsf=0, hasYield=0, hasMetro=0, hasDist=0, hasScore=0;
  const samples = [];
  
  snap.docs.forEach(d => {
    const n = d.data();
    if(n.avgPpsf)     hasPpsf++;
    if(n.grossYield)  hasYield++;
    if(n.distMetro)   hasMetro++;
    if(n.distBeach!=null) hasDist++;
    if(n.investmentScore) hasScore++;
    if(samples.length < 20) samples.push(n.community);
  });
  
  console.log("=== DLD REGISTRY:", snap.size, "communities ===");
  console.log("Has PPSF:",          hasPpsf,  "missing:", snap.size-hasPpsf);
  console.log("Has Yield:",         hasYield, "missing:", snap.size-hasYield);
  console.log("Has Metro dist:",    hasMetro, "missing:", snap.size-hasMetro);
  console.log("Has distances:",     hasDist,  "missing:", snap.size-hasDist);
  console.log("Has score:",         hasScore, "missing:", snap.size-hasScore);
  
  console.log("\n=== SAMPLE COMMUNITY NAMES ===");
  samples.forEach(c => console.log(" ", c));
  
  process.exit(0);
}
run().catch(e => { console.error(e); process.exit(1); });