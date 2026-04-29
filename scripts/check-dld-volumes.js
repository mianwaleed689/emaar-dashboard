const admin = require("firebase-admin");
const sa = require("../serviceAccountKey.json");
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

async function run() {
  const snap = await db.collection("dldVolumes").get();
  console.log("DLD Volumes total docs:", snap.size);
  
  // Show all fields available
  const sample = snap.docs[0].data();
  console.log("\nFields available:", Object.keys(sample).join(", "));
  
  // Show top 20 by transactions
  const docs = snap.docs.map(d=>d.data()).sort((a,b)=>(b.transactions||0)-(a.transactions||0));
  console.log("\nTop 20 communities by transaction volume:");
  docs.slice(0,20).forEach(d => {
    console.log(`  ${d.community.padEnd(30)} | txns: ${(d.transactions||0).toLocaleString()} | ppsf: ${d.avgPpsf}`);
  });

  process.exit(0);
}
run().catch(e=>{console.error(e);process.exit(1);});