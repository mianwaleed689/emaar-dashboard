const admin = require("firebase-admin");
const sa = require("../serviceAccountKey.json");
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

async function run() {
  // Check neighbourhoodScores collection
  const nbh = await db.collection("neighbourhoodScores").limit(5).get();
  console.log("=== neighbourhoodScores ===", nbh.size, "docs");
  nbh.docs.forEach(d => {
    const data = d.data();
    console.log(" ", d.id, "| fields:", Object.keys(data).join(", "));
  });

  // Check communityData
  const cd = await db.collection("communityData").limit(3).get();
  console.log("\n=== communityData ===", cd.size, "docs");
  cd.docs.forEach(d => console.log(" ", d.id, "| fields:", Object.keys(d.data()).join(", ")));

  // Check communityROI
  const roi = await db.collection("communityROI").limit(3).get();
  console.log("\n=== communityROI ===", roi.size, "docs");
  roi.docs.forEach(d => console.log(" ", d.id, "| fields:", Object.keys(d.data()).join(", ")));

  // Check tabData for neighbourhoods
  const tab = await db.collection("tabData").get();
  console.log("\n=== tabData ===", tab.size, "docs");
  tab.docs.forEach(d => console.log(" ", d.id));

  process.exit(0);
}
run().catch(e => { console.error(e); process.exit(1); });