const fs = require("fs");

// Check lead migration status
const admin = require("firebase-admin");
const sa = require("../serviceAccountKey.json");
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

async function run() {
  const leads = await db.collection("leads").limit(500).get();
  const statuses = {};
  leads.docs.forEach(d => {
    const s = d.data().status || "undefined";
    statuses[s] = (statuses[s]||0) + 1;
  });
  console.log("=== LEAD STATUS SAMPLE (500) ===");
  Object.entries(statuses).sort((a,b)=>b[1]-a[1]).forEach(([s,c]) => console.log(" ", c, "x", s));
  process.exit(0);
}
run().catch(e => { console.error(e); process.exit(1); });