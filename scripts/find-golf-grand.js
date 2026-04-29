const admin = require("firebase-admin");
const sa = require("../serviceAccountKey.json");
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

async function run() {
  const snap = await db.collection("projects").get();
  const projects = snap.docs.map(d=>({id:d.id,...d.data()}));
  
  const found = projects.filter(p=>
    (p.name||"").toLowerCase().includes("golf") ||
    (p.name||"").toLowerCase().includes("grand")
  );
  
  console.log("Found:", found.length);
  found.forEach(p=>console.log(
    (p.name||"").substring(0,40).padEnd(40),
    "| dev:", (p.developer||"").substring(0,20).padEnd(20),
    "| comm:", (p.community||"").substring(0,20),
    "| status:", p.status||"--",
    "| handover:", p.handoverQuarter||"--"
  ));
  process.exit(0);
}
run().catch(e=>{console.error(e);process.exit(1);});