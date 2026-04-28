const admin = require("firebase-admin");
const sa = require("../serviceAccountKey.json");
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

// Fix specific data issues
async function run() {
  const snap = await db.collection("neighbourhoodScores").get();
  const batch = db.batch();
  let fixed = 0;

  snap.docs.forEach(d => {
    const n = d.data();
    const updates = {};

    // Fix waterfront communities that should have hasBeach=true
    const waterfrontCommunities = [
      "The World","Dubai Harbour","Bluewaters Island",
      "Palm Jumeirah","Jumeirah Beach Residence",
      "Jumeirah Beach Residence (JBR)","La Mer",
      "Pearl Jumeira","Dubai Islands","Mina Rashid",
      "Rashid Yachts & Marina","Emaar Beachfront",
      "Dubai Creek Harbour","Dubai Marina",
      "Al Sufouh","Jumeirah","Port de La Mer",
    ];
    if (waterfrontCommunities.includes(n.community) && !n.hasBeach) {
      updates.hasBeach = true;
      updates.distBeach = updates.distBeach || 0.5;
    }

    if (Object.keys(updates).length > 0) {
      batch.update(d.ref, updates);
      console.log("Fixed:", n.community, JSON.stringify(updates));
      fixed++;
    }
  });

  await batch.commit();
  console.log("\nFixed:", fixed, "communities");
  process.exit(0);
}
run().catch(e=>{console.error(e);process.exit(1);});