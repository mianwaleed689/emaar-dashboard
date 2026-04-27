const admin = require("firebase-admin");
const sa = require("../serviceAccountKey.json");
admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

async function run() {
  // Find JLT doc by community name
  const snap = await db.collection("dldVolumes").where("community", "==", "Jumeirah Lake Towers (JLT)").get();
  if (!snap.empty) {
    console.log("Found JLT doc id:", snap.docs[0].id);
    await snap.docs[0].ref.update({ offPlanPct: 42, yoyGrowth: 7.1, sector: "New Dubai", updatedAt: admin.firestore.FieldValue.serverTimestamp() });
    console.log("Updated JLT");
  } else {
    // List all dldVolumes IDs to find it
    const all = await db.collection("dldVolumes").get();
    console.log("All IDs:", all.docs.map(d => d.id).join("\n"));
  }
  process.exit(0);
}
run().catch(e => { console.error(e); process.exit(1); });