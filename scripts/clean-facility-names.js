const admin = require("firebase-admin");
const sa = require("../serviceAccountKey.json");
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

function cleanName(name) {
  if (!name) return null;
  // Strip SEO garbage after | or - or ,
  let clean = name.split("|")[0].split(" - ")[0].trim();
  // Remove trailing punctuation
  clean = clean.replace(/[.,;:]+$/, "").trim();
  return clean;
}

async function run() {
  const snap = await db.collection("neighbourhoodScores").get();
  const BATCH_SIZE = 400;
  const docs = snap.docs;
  let fixed = 0;

  for (let i = 0; i < docs.length; i += BATCH_SIZE) {
    const batch = db.batch();
    const chunk = docs.slice(i, i + BATCH_SIZE);

    chunk.forEach(d => {
      const n = d.data();
      const updates = {};

      // Clean all facility names
      const fields = [
        "nearestMetro","nearestSchool","nearestHospital","nearestMall",
        "nearestBeach","nearestSupermarket","nearestPark","nearestMosque",
        "nearestNursery","nearestPharmacy","nearestRestaurant","nearestSports",
      ];

      fields.forEach(f => {
        if (n[f]) {
          const cleaned = cleanName(n[f]);
          if (cleaned !== n[f]) updates[f] = cleaned;
        }
      });

      // Fix beach — if > 15km don't show as nearby
      if (n.distBeach && parseFloat(n.distBeach) > 15) {
        updates.hasBeach = false;
      }

      // Fix school — if > 8km flag it
      if (n.distSchool && parseFloat(n.distSchool) > 8) {
        updates.hasSchool = false;
      }

      // Clean sports nearby array names
      if (n.sportsNearby && Array.isArray(n.sportsNearby)) {
        const cleanedSports = n.sportsNearby.map(s => ({
          ...s,
          name: cleanName(s.name) || s.name,
        }));
        const changed = cleanedSports.some((s,i) => s.name !== n.sportsNearby[i].name);
        if (changed) updates.sportsNearby = cleanedSports;
      }

      if (Object.keys(updates).length > 0) {
        batch.update(d.ref, updates);
        fixed++;
      }
    });

    await batch.commit();
    console.log(`Batch ${Math.floor(i/BATCH_SIZE)+1} done`);
  }

  console.log("Total cleaned:", fixed);
  process.exit(0);
}
run().catch(e=>{console.error(e);process.exit(1);});