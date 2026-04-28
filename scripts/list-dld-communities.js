const admin = require("firebase-admin");
const sa = require("../serviceAccountKey.json");
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

async function run() {
  const snap = await db.collection("neighbourhoodScores").where("tier","==","dld-registry").get();
  const communities = snap.docs.map(d=>d.data().community).sort();
  console.log("ALL DLD REGISTRY COMMUNITIES:", communities.length);
  communities.forEach(c => console.log(c));
  process.exit(0);
}
run().catch(e => { console.error(e); process.exit(1); });