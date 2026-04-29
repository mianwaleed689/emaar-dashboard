const admin = require("firebase-admin");
const sa = require("../serviceAccountKey.json");
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

// Map DLD area names to our community names
const AREA_MAP = {
  "Jabal Ali First":          "Jebel Ali",
  "Marsa Dubai":              "Dubai Marina",
  "Burj Khalifa":             "Downtown Dubai",
  "Al Hebiah Fourth":         "Dubai Sports City",
  "Al Hebiah Fifth":          "Dubai Sports City",
  "Al Hebiah Third":          "Motor City",
  "Al Barsha South Fourth":   "Jumeirah Village Circle",
  "Al Barsha South Fifth":    "Jumeirah Village Triangle",
  "Al Barshaa South Third":   "Arjan",
  "Wadi Al Safa 5":           "Tilal Al Ghaf",
  "Wadi Al Safa 3":           "Dubailand",
  "Wadi Al Safa 2":           "Dubailand",
  "Wadi Al Safa 4":           "Dubailand",
  "Wadi Al Safa 7":           "Dubailand",
  "Madinat Al Mataar":        "Emaar South",
  "Hadaeq Sheikh Mohammed Bin Rashid": "Dubai Hills Estate",
  "Al Khairan First":         "Dubai Creek Harbour",
  "Nad Al Shiba First":       "Mohammed Bin Rashid City",
  "Al Merkadh":               "Meydan",
  "Bukadra":                  "Ras Al Khor",
  "Al Yelayiss 1":            "Tilal Al Ghaf",
  "Al Yelayiss 2":            "Tilal Al Ghaf",
  "Al Yelayiss 4":            "Tilal Al Ghaf",
  "Al Yufrah 1":              "Tilal Al Ghaf",
  "Al Satwa":                 "Bur Dubai",
  "Trade Center First":       "DIFC",
  "Trade Center Second":      "DIFC",
  "Zaabeel First":            "Zabeel",
  "Zaabeel Second":           "Zabeel",
  "Um Suqaim Third":          "Jumeirah",
  "Jumeirah Second":          "Jumeirah",
  "Palm Jabal Ali":           "Palm Jumeirah",
  "Dubai Investment Park First": "Dubai Investment Park",
  "Dubai Investment Park Second":"Dubai Investment Park",
  "Saih Shuaib 2":            "Emaar South",
  "Me'Aisem Second":          "Dubai Production City",
  "Ghadeer Al tair":          "Dubailand",
  "Al Thanyah Third":         "Barsha Heights",
  "Al Thanyah Fifth":         "Barsha Heights",
  "World Islands":            "The World",
};

// Update projects collection to use correct community names
async function run() {
  const snap = await db.collection("projects").where("dldImported","==",true).get();
  const BATCH_SIZE = 400;
  const docs = snap.docs;
  let updated = 0;

  for(let i=0;i<docs.length;i+=BATCH_SIZE) {
    const batch = db.batch();
    docs.slice(i,i+BATCH_SIZE).forEach(d=>{
      const p = d.data();
      const mapped = AREA_MAP[p.community];
      if(mapped) {
        batch.update(d.ref, { community: mapped, dldAreaName: p.community });
        updated++;
      }
    });
    await batch.commit();
  }
  console.log("Updated community names:", updated);

  // Re-run sync
  console.log("\nRe-running community sync...");
  process.exit(0);
}
run().catch(e=>{console.error(e);process.exit(1);});