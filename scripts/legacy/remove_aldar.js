/**
 * Remove all Aldar data from Firestore
 * Run: node remove_aldar.js
 */
const admin = require("firebase-admin");
const serviceAccount = require("C:/Users/TAD/serviceAccount.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: "dxb-analytics",
});

const db = admin.firestore();

async function removeAldar() {
  console.log("Removing Aldar from Firestore...\n");

  // 1. Delete developer profile
  await db.collection("developers").doc("aldar").delete();
  console.log("✅ Deleted developers/aldar");

  // 2. Delete all aldar projects from projects collection
  const snap = await db.collection("projects").get();
  const batch = db.batch();
  let count = 0;
  snap.forEach(doc => {
    const data = doc.data();
    if (doc.id.startsWith("aldar_") || data.developerId === "aldar" || data.developer === "Aldar Properties") {
      batch.delete(doc.ref);
      count++;
    }
  });
  await batch.commit();
  console.log(`✅ Deleted ${count} Aldar projects from projects collection`);

  // 3. Delete from projectData collection too
  const snap2 = await db.collection("projectData").get();
  const batch2 = db.batch();
  let count2 = 0;
  snap2.forEach(doc => {
    const data = doc.data();
    if (doc.id.startsWith("aldar_") || data.developerId === "aldar" || data.developer === "Aldar Properties") {
      batch2.delete(doc.ref);
      count2++;
    }
  });
  await batch2.commit();
  console.log(`✅ Deleted ${count2} Aldar projects from projectData collection`);

  console.log("\n🎉 Aldar completely removed from Firestore!");
  process.exit(0);
}

removeAldar().catch(err => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});
