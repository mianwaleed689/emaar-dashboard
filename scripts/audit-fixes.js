const admin = require("firebase-admin");
const sa = require("../serviceAccountKey.json");
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

async function run() {
  // 1. Check orgs missing ownerEmail
  const orgs = await db.collection("organisations").get();
  console.log("=== ORGS MISSING OWNER EMAIL ===");
  orgs.docs.forEach(d => {
    const data = d.data();
    if (!data.ownerEmail) console.log(" ", d.id, "—", data.name, "| ownerId:", data.ownerId||"none");
  });

  // 2. Check lead status breakdown
  const leads = await db.collection("leads").limit(500).get();
  console.log("\n=== LEAD STATUS BREAKDOWN ===");
  const statuses = {};
  leads.docs.forEach(d => {
    const s = d.data().status || "undefined";
    statuses[s] = (statuses[s]||0) + 1;
  });
  Object.entries(statuses).sort((a,b)=>b[1]-a[1]).forEach(([s,c]) => console.log(" ", c, "x", s));

  process.exit(0);
}
run().catch(e => { console.error(e); process.exit(1); });