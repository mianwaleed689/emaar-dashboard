const admin = require("firebase-admin");
const sa = require("../serviceAccountKey.json");
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

// Check what collection the dashboard reads developers from
// It reads from "developers" collection with verified:true and visibility:published
async function run() {
  // Check existing developers collection
  const snap = await db.collection("developers").get();
  console.log("Developers collection:", snap.size);
  
  if(snap.size>0) {
    const sample = snap.docs[0].data();
    console.log("Sample fields:", Object.keys(sample).join(", "));
    console.log("Has verified:", "verified" in sample);
    console.log("Has visibility:", "visibility" in sample);
  }

  // Update all our seeded developers with required fields
  const batch = db.batch();
  snap.docs.forEach(d=>{
    const data = d.data();
    batch.update(d.ref, {
      verified:   true,
      visibility: "published",
      active:     true,
      totalProjects: data.projects||0,
      communities: data.areas||[],
      reliability: data.onTime||80,
      classification: data.tier===1?"tier1":data.tier===2?"tier2":"tier3",
    });
  });
  await batch.commit();
  console.log("Updated all developers with required fields");

  // Verify
  const snap2 = await db.collection("developers").where("verified","==",true).get();
  console.log("Verified developers:", snap2.size);
  process.exit(0);
}
run().catch(e=>{console.error(e);process.exit(1);});