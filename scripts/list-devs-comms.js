const admin = require("firebase-admin");
const sa = require("../serviceAccountKey.json");
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

async function run() {
  const snap = await db.collection("projects").get();
  const projects = snap.docs.map(d=>d.data()).filter(p=>!p.archived);

  const devCount = {};
  const commCount = {};

  projects.forEach(p=>{
    const dev = p.developer||"Unknown";
    const comm = p.community||"Unknown";
    devCount[dev]=(devCount[dev]||0)+1;
    commCount[comm]=(commCount[comm]||0)+1;
  });

  console.log("=== DEVELOPERS ("+Object.keys(devCount).length+" total) ===");
  Object.entries(devCount).sort((a,b)=>b[1]-a[1]).forEach(([d,c])=>
    console.log(c.toString().padStart(5)+" projects  "+d)
  );

  console.log("\n=== COMMUNITIES ("+Object.keys(commCount).length+" total) ===");
  Object.entries(commCount).sort((a,b)=>b[1]-a[1]).forEach(([c,n])=>
    console.log(n.toString().padStart(5)+" projects  "+c)
  );

  process.exit(0);
}
run().catch(e=>{console.error(e);process.exit(1);});