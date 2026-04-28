const admin = require("firebase-admin");
const sa = require("../serviceAccountKey.json");
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

async function run() {
  const snap = await db.collection("neighbourhoodScores")
    .where("community","==","Jumeirah").get();
  if(!snap.empty) {
    await snap.docs[0].ref.update({ hasBeach: true });
    console.log("Fixed: Jumeirah hasBeach = true");
  }
  process.exit(0);
}
run().catch(e=>{console.error(e);process.exit(1);});