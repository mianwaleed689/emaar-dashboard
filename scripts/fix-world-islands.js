const admin = require("firebase-admin");
const sa = require("../serviceAccountKey.json");
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

async function run() {
  // Fix The World Islands in neighbourhoodScores
  const nbhdSnap = await db.collection("neighbourhoodScores")
    .where("community","==","The World Islands").get();
  
  if(!nbhdSnap.empty) {
    await nbhdSnap.docs[0].ref.update({
      nearestMall:     "Festival City Mall",
      distMall:        20.0,
      nearestHospital: "Rashid Hospital",
      distHospital:    22.0,
      nearestSchool:   "Deira International School",
      distSchool:      20.0,
      nearestMetro:    "Palm Jumeirah Metro",
      distMetro:       15.0,
      serviceCharge:   25,
      hasMetro:        false,
    });
    console.log("Updated The World Islands");
  }

  // Now fix the project directly
  const projSnap = await db.collection("projects")
    .where("community","==","The World Islands").get();
  
  const batch = db.batch();
  projSnap.docs.forEach(d=>{
    batch.update(d.ref,{
      nearestMall:     "Festival City Mall",
      distMall:        20.0,
      nearestHospital: "Rashid Hospital",
      distHospital:    22.0,
      nearestSchool:   "Deira International School",
      distSchool:      20.0,
      serviceCharge:   25,
    });
  });
  await batch.commit();
  console.log("Fixed", projSnap.size, "World Islands projects");
  process.exit(0);
}
run().catch(e=>{console.error(e);process.exit(1);});