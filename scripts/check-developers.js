const admin = require("firebase-admin");
const sa = require("../serviceAccountKey.json");
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

async function run() {
  const snap = await db.collection("projects").get();
  const devCount = {};
  snap.docs.forEach(d=>{
    const dev = d.data().developer||"Unknown";
    devCount[dev]=(devCount[dev]||0)+1;
  });
  
  console.log("Total unique developers:", Object.keys(devCount).length);
  console.log("\nTop 20 developers:");
  Object.entries(devCount)
    .sort((a,b)=>b[1]-a[1])
    .slice(0,20)
    .forEach(([d,c])=>console.log(c.toString().padStart(4), d));
  process.exit(0);
}
run().catch(e=>{console.error(e);process.exit(1);});