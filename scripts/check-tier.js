const admin = require("firebase-admin");
const sa = require("../serviceAccountKey.json");
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

async function run() {
  const snap = await db.collection("neighbourhoodScores")
    .where("community","in",["The World","Dubai Harbour","Bluewaters Island"])
    .get();
  snap.docs.forEach(d => {
    const n = d.data();
    console.log(n.community, "| tier:", n.tier, "| yield:", n.grossYield, "| ppsf:", n.avgPpsf);
  });
  process.exit(0);
}
run().catch(e=>{console.error(e);process.exit(1);});