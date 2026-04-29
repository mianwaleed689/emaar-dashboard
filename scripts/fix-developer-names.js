const admin = require("firebase-admin");
const sa = require("../serviceAccountKey.json");
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

// Better developer name mapping from DLD numbers/codes to real names
const DEV_FIX = {
  "-":                    null,  // delete these
  "1":                    null,
  "2":                    null,
  "3":                    null,
  "Unknown Developer":    null,
  "Business Bay Developer": "Damac Properties",
  "Liwan":                "Dubai Properties",
  "Dubai Land Residences":"Dubai Properties",
  "Dubai Aviation City":  "Dubai Airports",
  "Marsa Real Estate":    "Dubai Properties",
};

// Fix using masterProject/community to infer developer
const MASTER_TO_DEV = {
  "Downtown Dubai":       "Emaar Properties",
  "Dubai Hills Estate":   "Emaar Properties",
  "Emaar Beachfront":     "Emaar Properties",
  "Arabian Ranches":      "Emaar Properties",
  "Dubai Creek Harbour":  "Emaar Properties",
  "Emaar South":          "Emaar Properties",
  "Palm Jumeirah":        "Nakheel",
  "Palm Deira":           "Nakheel",
  "Jabal Ali Village":    "Nakheel",
  "Al Furjan":            "Nakheel",
  "Jumeirah Village Circle":"Nakheel",
  "Jumeirah Village Triangle":"Nakheel",
  "Discovery Gardens":    "Nakheel",
  "Dubai Sports City":    "Dubai Sports City",
  "Motor City":           "Union Properties",
  "Business Bay":         "Damac Properties",
  "DAMAC HILLS 2":        "Damac Properties",
  "Dubailand":            "Dubai Properties",
  "Meydan":               "Meydan Group",
  "Dubai Silicon Oasis":  "Dubai Silicon Oasis Authority",
};

async function run() {
  const snap = await db.collection("projects").get();
  const docs = snap.docs;
  let fixed = 0;
  const BATCH_SIZE = 400;

  for(let i=0;i<docs.length;i+=BATCH_SIZE) {
    const batch = db.batch();
    docs.slice(i,i+BATCH_SIZE).forEach(d=>{
      const p = d.data();
      const dev = p.developer||"";
      
      // Skip if already good
      if(DEV_FIX[dev]===undefined && dev.length>3 && !/^\d+$/.test(dev)) return;
      
      let newDev = DEV_FIX[dev];
      
      // Try to infer from master project
      if(newDev===null||newDev===undefined) {
        const master = p.masterProject||"";
        for(const [key,val] of Object.entries(MASTER_TO_DEV)) {
          if(master.toLowerCase().includes(key.toLowerCase())) {
            newDev = val;
            break;
          }
        }
      }
      
      // Try community
      if(!newDev) {
        const comm = p.community||"";
        for(const [key,val] of Object.entries(MASTER_TO_DEV)) {
          if(comm.toLowerCase().includes(key.toLowerCase())) {
            newDev = val;
            break;
          }
        }
      }

      // Last resort
      if(!newDev) newDev = "Dubai Real Estate Developer";

      batch.update(d.ref, { developer: newDev });
      fixed++;
    });
    await batch.commit();
    console.log(`Batch ${Math.floor(i/BATCH_SIZE)+1} done`);
  }

  console.log("Fixed developers:", fixed);
  
  // Show remaining bad names
  const snap2 = await db.collection("projects").get();
  const devs = new Set(snap2.docs.map(d=>d.data().developer||""));
  const bad = [...devs].filter(d=>!d||d.length<=2||/^\d+$/.test(d));
  console.log("Remaining bad:", bad);
  process.exit(0);
}
run().catch(e=>{console.error(e);process.exit(1);});