const admin = require("firebase-admin");
const sa = require("../serviceAccountKey.json");
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

async function run() {
  // Check projects collection for community data
  const projects = await db.collection("projects").get();
  console.log("=== PROJECTS ===", projects.size, "total");
  
  const communities = {};
  projects.docs.forEach(d => {
    const data = d.data();
    const comm = data.community || data.location || data.area || "";
    if (comm) communities[comm] = (communities[comm]||0) + 1;
  });
  
  console.log("\n=== COMMUNITIES IN PROJECTS ===", Object.keys(communities).length, "unique");
  Object.entries(communities).sort((a,b)=>b[1]-a[1]).forEach(([c,n]) => console.log(" ", n, "x", c));

  process.exit(0);
}
run().catch(e => { console.error(e); process.exit(1); });