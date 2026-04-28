const admin = require("firebase-admin");
const sa = require("../serviceAccountKey.json");
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

async function run() {
  const snap = await db.collection("neighbourhoodScores").get();
  const batch = db.batch();
  let updated = 0;

  snap.docs.forEach(d => {
    const n = d.data();
    // DLD communities that have yield data inherited from parent
    if (n.tier === "dld-registry" && n.grossYield && parseFloat(n.grossYield) > 0) {
      batch.update(d.ref, { tier: "area-data" });
      updated++;
    }
  });

  await batch.commit();
  console.log("Updated to area-data tier:", updated);
  process.exit(0);
}
run().catch(e=>{console.error(e);process.exit(1);});