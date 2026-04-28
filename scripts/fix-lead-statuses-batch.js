const admin = require("firebase-admin");
const sa = require("../serviceAccountKey.json");
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

const STATUS_MAP = {
  "New":       "New Lead",
  "Contacted": "Potential",
  "Viewing":   "Potential",
  "Offer":     "EOI",
  "Won":       "Closed Deal",
  "Lost":      "Closed Outside",
};

async function run() {
  console.log("Fixing lead statuses in batches...");
  let total = 0;
  let lastDoc = null;

  while (true) {
    // Fetch 400 at a time (batch write limit is 500)
    let q = db.collection("leads").limit(400);
    if (lastDoc) q = q.startAfter(lastDoc);

    const snap = await q.get();
    if (snap.empty) break;

    const batch = db.batch();
    let batchCount = 0;

    snap.docs.forEach(d => {
      const status = d.data().status;
      if (STATUS_MAP[status]) {
        batch.update(d.ref, {
          status:    STATUS_MAP[status],
          updatedAt: new Date().toISOString(),
        });
        batchCount++;
      }
    });

    if (batchCount > 0) {
      await batch.commit();
      total += batchCount;
      console.log("Fixed", total, "leads so far...");
    }

    lastDoc = snap.docs[snap.docs.length - 1];

    // If we got fewer than 400 we are done
    if (snap.docs.length < 400) break;
  }

  console.log("\nDone. Total fixed:", total);
  process.exit(0);
}
run().catch(e => { console.error(e); process.exit(1); });