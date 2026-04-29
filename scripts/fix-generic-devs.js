const admin = require("firebase-admin");
const sa = require("../serviceAccountKey.json");
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

const COMM_TO_DEV = {
  "Tilal Al Ghaf":           "Majid Al Futtaim",
  "Madinat Dubai Almelaheyah":"Meydan Group",
  "Dubai Investment Park":   "Dubai Investments",
  "Me'Aisem First":          "TECOM Investments",
  "Dubai Marina":            "Emaar Properties",
  "Warsan Fourth":           "Dubai Properties",
  "Barsha Heights":          "TECOM Investments",
  "Mohammed Bin Rashid City":"Sobha Realty",
  "Jebel Ali":               "Nakheel",
  "Nadd Hessa":              "Dubai Properties",
  "Al Jadaf":                "Dubai Properties",
  "Jumeirah":                "Dubai Properties",
  "Al Barshaa South Second": "Nakheel",
  "Ras Al Khor":             "Dubai Properties",
  "Al Hebiah Second":        "Dubai Sports City",
  "Arjan":                   "Dubai Properties",
  "Al Furjan":               "Nakheel",
  "Dubai Creek Harbour":     "Emaar Properties",
  "Business Bay":            "Damac Properties",
  "Al Quoz":                 "Dubai Properties",
  "Al Karama":               "Dubai Properties",
  "Deira":                   "Nakheel",
  "Bur Dubai":               "Dubai Properties",
  "International City":      "Nakheel",
  "Discovery Gardens":       "Nakheel",
  "Al Satwa":                "Dubai Properties",
  "Mirdif":                  "Dubai Properties",
  "Palm Deira":              "Nakheel",
  "Palm Jumeirah":           "Nakheel",
  "Emaar South":             "Emaar Properties",
  "Dubai Hills Estate":      "Emaar Properties",
  "Downtown Dubai":          "Emaar Properties",
  "Sobha Hartland":          "Sobha Realty",
  "Dubai Silicon Oasis":     "Dubai Silicon Oasis Authority",
  "Motor City":              "Union Properties",
  "DAMAC Hills":             "Damac Properties",
  "DAMAC Hills 2":           "Damac Properties",
};

async function run() {
  const snap = await db.collection("projects")
    .where("developer","==","Dubai Real Estate Developer").get();
  
  console.log("Fixing:", snap.size, "projects");
  let fixed = 0;
  const BATCH_SIZE = 400;
  const docs = snap.docs;

  for(let i=0;i<docs.length;i+=BATCH_SIZE) {
    const batch = db.batch();
    docs.slice(i,i+BATCH_SIZE).forEach(d=>{
      const p = d.data();
      const comm = p.community||"";
      const master = p.masterProject||"";
      
      let dev = null;
      // Try community match
      for(const [key,val] of Object.entries(COMM_TO_DEV)) {
        if(comm.toLowerCase().includes(key.toLowerCase())||
           master.toLowerCase().includes(key.toLowerCase())) {
          dev = val; break;
        }
      }
      
      if(dev) {
        batch.update(d.ref, { developer: dev });
        fixed++;
      }
    });
    await batch.commit();
  }

  console.log("Fixed:", fixed);
  
  // Final check
  const snap2 = await db.collection("projects")
    .where("developer","==","Dubai Real Estate Developer").get();
  console.log("Still generic:", snap2.size);
  process.exit(0);
}
run().catch(e=>{console.error(e);process.exit(1);});