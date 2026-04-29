const admin = require("firebase-admin");
const sa = require("../serviceAccountKey.json");
const fs = require("fs");
const path = require("path");
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

const unitSizes = JSON.parse(fs.readFileSync(path.join(__dirname,"../data/dld-unit-sizes.json"),"utf8"));
const rentData  = JSON.parse(fs.readFileSync(path.join(__dirname,"../data/dld-rent-data.json"),"utf8"));
const scData    = JSON.parse(fs.readFileSync(path.join(__dirname,"../data/dld-service-charges.json"),"utf8"));

// Normalize keys for matching
const normalize = s => (s||"").toUpperCase().trim().replace(/\s+/g," ");
const unitMap = {};
Object.entries(unitSizes).forEach(([k,v])=>{ unitMap[normalize(k)]=v; });
const rentMap = {};
Object.entries(rentData).forEach(([k,v])=>{ rentMap[normalize(k)]=v; });
const scMap = {};
Object.entries(scData).forEach(([k,v])=>{ scMap[normalize(k)]=v; });

console.log("Unit data:", Object.keys(unitMap).length);
console.log("Rent data:", Object.keys(rentMap).length);
console.log("SC data:",   Object.keys(scMap).length);

async function run() {
  const snap = await db.collection("projects").get();
  const docs = snap.docs.filter(d=>!d.data().archived);
  console.log("Projects:", docs.length);

  let unitMatched=0, rentMatched=0, scMatched=0;
  const BATCH_SIZE=400;

  for(let i=0;i<docs.length;i+=BATCH_SIZE){
    const batch = db.batch();
    docs.slice(i,i+BATCH_SIZE).forEach(d=>{
      const p = d.data();
      const updates = {};
      const projName = normalize(p.name);
      const commName = normalize(p.community);

      // 1. Unit sizes from DLD
      const unitInfo = unitMap[projName];
      if(unitInfo && unitInfo.unitCount >= 2) {
        if(!p.sizeMin || p.sizeMin===0) { updates.sizeMin = unitInfo.minSizeSqft; }
        if(!p.sizeMax || p.sizeMax===0) { updates.sizeMax = unitInfo.maxSizeSqft; }
        if(!p.unitSizeAvgSqFt)          { updates.unitSizeAvgSqFt = unitInfo.avgSizeSqft; }
        if(!p.beds || !p.beds.length)   { updates.beds = unitInfo.beds; }
        updates.dldUnitCount = unitInfo.unitCount;
        updates.dldUnitDataSource = "DLD Registered Units 2026";
        unitMatched++;
      }

      // 2. Real rent data → real yield
      const rentInfo = rentMap[commName];
      if(rentInfo && rentInfo.sampleCount >= 3) {
        const avgRent = rentInfo.avgAnnualRent;
        // Calculate yield: rent / (PPSF × avg size)
        const ppsf = p.ppsf || p.avgPpsf || 0;
        const avgSize = unitInfo?.avgSizeSqft || rentInfo.avgSizeSqft || 750;
        if(ppsf > 0 && avgSize > 0) {
          const propValue = ppsf * avgSize;
          const grossYield = Math.round((avgRent / propValue) * 1000) / 10;
          if(grossYield >= 3 && grossYield <= 15) {
            updates.grossYield = grossYield;
            updates.grossYieldSource = "DLD Rent Contracts 2026";
            updates.grossYieldIsEstimate = false;
            updates.avgAnnualRent = avgRent;
            rentMatched++;
          }
        }
      }

      // 3. Real service charges
      const scInfo = scMap[commName];
      if(scInfo) {
        // Service charge budget total / estimated units = per unit charge
        // Convert to per sqft estimate
        updates.serviceChargeBudget = scInfo.serviceChargeBudget;
        updates.serviceChargeSource = "RERA Mollak 2023+";
        scMatched++;
      }

      if(Object.keys(updates).length>0) batch.update(d.ref, updates);
    });
    await batch.commit();
    console.log("Batch "+Math.floor(i/BATCH_SIZE+1)+" done");
  }

  console.log("\n=== RESULTS ===");
  console.log("Unit size matched:", unitMatched);
  console.log("Yield matched:", rentMatched);
  console.log("SC matched:", scMatched);

  // Final check
  const snap2 = await db.collection("projects").get();
  const active = snap2.docs.map(d=>d.data()).filter(p=>!p.archived);
  const checks = [
    {label:"Real yield",  count:active.filter(p=>p.grossYieldSource==="DLD Rent Contracts 2026").length},
    {label:"Unit sizes",  count:active.filter(p=>p.sizeMin>0).length},
    {label:"Beds",        count:active.filter(p=>p.beds&&p.beds.length>0).length},
  ];
  checks.forEach(c=>console.log(c.label.padEnd(15), c.count+"/"+active.length));
  process.exit(0);
}
run().catch(e=>{console.error(e);process.exit(1);});