const admin = require("firebase-admin");
const sa = require("../serviceAccountKey.json");
const fs = require("fs");
const path = require("path");
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

const unitSizes = JSON.parse(fs.readFileSync(path.join(__dirname,"../data/dld-unit-sizes.json"),"utf8"));
const rentData  = JSON.parse(fs.readFileSync(path.join(__dirname,"../data/dld-rent-data.json"),"utf8"));
const scData    = JSON.parse(fs.readFileSync(path.join(__dirname,"../data/dld-service-charges.json"),"utf8"));

// Reverse map — branded name → DLD zone name
const BRANDED_TO_DLD = {
  "Jumeirah Village Circle":   "Al Barsha South Fourth",
  "Jumeirah Village Triangle": "Al Barsha South Fifth",
  "Arjan":                     "Al Barshaa South Third",
  "Barsha Heights":            "Al Thanyah Third",
  "Dubai Marina":              "Marsa Dubai",
  "Downtown Dubai":            "Burj Khalifa",
  "Business Bay":              "Business Bay",
  "Dubai Hills Estate":        "Hadaeq Sheikh Mohammed Bin Rashid",
  "Emaar South":               "Madinat Al Mataar",
  "Dubailand":                 "Wadi Al Safa 3",
  "Jebel Ali":                 "Jabal Ali First",
  "Dubai Sports City":         "Al Hebiah Fourth",
  "Motor City":                "Al Hebiah Second",
  "Dubai Production City":     "Me'Aisem First",
  "International City":        "Al Warsan First",
  "Dubai Investment Park":     "Dubai Investment Park Second",
  "Meydan":                    "Al Merkadh",
  "Mohammed Bin Rashid City":  "Nad Al Shiba First",
  "Ras Al Khor":               "Ras Al Khor Industrial First",
  "Al Jadaf":                  "Al Jadaf",
  "Al Wasl":                   "Al Wasl",
  "Jumeirah":                  "Jumeirah First",
  "Al Sufouh":                 "Al Safouh Second",
  "DAMAC Hills 2":             "Madinat Hind 4",
  "Tilal Al Ghaf":             "Al Yelayiss 2",
  "Palm Jumeirah":             "Palm Jumeirah",
  "Palm Deira":                "Palm Deira",
  "Al Furjan":                 "Al Furjan",
  "Bur Dubai":                 "Al Karama",
  "Dubai Silicon Oasis":       "Dubai Silicon Oasis",
  "Dubai Creek Harbour":       "Al Khairan First",
  "Al Barsha":                 "Al Barsha First",
  "Discovery Gardens":         "Discovery Gardens",
  "DIFC":                      "Trade Center First",
  "Mirdif":                    "Mirdif",
  "Dubai South":               "Madinat Al Mataar",
};

const normalize = s => (s||"").toUpperCase().trim().replace(/\s+/g," ");

// Build rent lookup with both branded and DLD names
const rentLookup = {};
Object.entries(rentData).forEach(([k,v])=>{
  rentLookup[normalize(k)] = v;
});
// Add branded name lookups
Object.entries(BRANDED_TO_DLD).forEach(([branded,dld])=>{
  const dldData = rentLookup[normalize(dld)];
  if(dldData) rentLookup[normalize(branded)] = dldData;
});

const scLookup = {};
Object.entries(scData).forEach(([k,v])=>{ scLookup[normalize(k)]=v; });
Object.entries(BRANDED_TO_DLD).forEach(([branded,dld])=>{
  const data = scLookup[normalize(dld)];
  if(data) scLookup[normalize(branded)] = data;
});

// Unit sizes lookup by project name (exact match)
const unitLookup = {};
Object.entries(unitSizes).forEach(([k,v])=>{ unitLookup[normalize(k)]=v; });

console.log("Rent lookup keys:", Object.keys(rentLookup).length);
console.log("SC lookup keys:", Object.keys(scLookup).length);

async function run() {
  const snap = await db.collection("projects").get();
  const docs = snap.docs.filter(d=>!d.data().archived);

  let unitMatched=0, rentMatched=0, scMatched=0;
  const BATCH_SIZE=400;

  for(let i=0;i<docs.length;i+=BATCH_SIZE){
    const batch = db.batch();
    docs.slice(i,i+BATCH_SIZE).forEach(d=>{
      const p = d.data();
      const updates = {};
      const projName = normalize(p.name);
      const commName = normalize(p.community);

      // 1. Unit sizes — match by project name
      const unitInfo = unitLookup[projName];
      if(unitInfo && unitInfo.unitCount>=2) {
        if(!p.sizeMin||p.sizeMin===0) updates.sizeMin = unitInfo.minSizeSqft;
        if(!p.sizeMax||p.sizeMax===0) updates.sizeMax = unitInfo.maxSizeSqft;
        if(!p.unitSizeAvgSqFt)        updates.unitSizeAvgSqFt = unitInfo.avgSizeSqft;
        if(!p.beds||!p.beds.length)   updates.beds = unitInfo.beds;
        updates.dldUnitCount = unitInfo.unitCount;
        unitMatched++;
      }

      // 2. Real rent → real yield
      const rentInfo = rentLookup[commName];
      if(rentInfo && rentInfo.sampleCount>=2) {
        const avgRent = rentInfo.avgAnnualRent;
        const ppsf = p.ppsf||p.avgPpsf||0;
        const avgSize = unitInfo?.avgSizeSqft||750;
        if(ppsf>0&&avgSize>0) {
          const propValue = ppsf * avgSize;
          const grossYield = Math.round((avgRent/propValue)*1000)/10;
          if(grossYield>=3&&grossYield<=15) {
            updates.grossYield = grossYield;
            updates.grossYieldSource = "DLD Rent Contracts 2026";
            updates.grossYieldIsEstimate = false;
            updates.avgAnnualRent = avgRent;
            rentMatched++;
          }
        }
      }

      // 3. Service charges
      const scInfo = scLookup[commName];
      if(scInfo) {
        updates.serviceChargeBudget = scInfo.serviceChargeBudget;
        updates.serviceChargeSource = "RERA Mollak";
        scMatched++;
      }

      if(Object.keys(updates).length>0) batch.update(d.ref, updates);
    });
    await batch.commit();
    console.log("Batch "+Math.floor(i/BATCH_SIZE+1)+" — units:"+unitMatched+" rent:"+rentMatched+" sc:"+scMatched);
  }

  console.log("\n=== FINAL ===");
  console.log("Unit matched:", unitMatched);
  console.log("Yield matched:", rentMatched);
  console.log("SC matched:", scMatched);
  process.exit(0);
}
run().catch(e=>{console.error(e);process.exit(1);});