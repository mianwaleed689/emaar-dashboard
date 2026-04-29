const admin = require("firebase-admin");
const sa = require("../serviceAccountKey.json");
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

async function run() {
  const snap = await db.collection("neighbourhoodScores").get();
  const docs = snap.docs.map(d=>d.data());
  
  console.log("=== WHAT DATA WE HAVE FOR 259 COMMUNITIES ===\n");
  
  const fields = [
    { label:"Gross Yield (Bayut/DLD)",     check: d=>d.grossYield },
    { label:"DLD Transactions (liquidity)", check: d=>d.totalTransactions },
    { label:"Median PPSF (DLD)",           check: d=>d.avgPpsf },
    { label:"Supply Risk",                 check: d=>d.supplyRisk },
    { label:"Price Min/Max",               check: d=>d.priceMin||d.priceMax },
    { label:"Metro distance",              check: d=>d.distMetro },
    { label:"Investment Score (old)",      check: d=>d.investmentScore },
  ];
  
  fields.forEach(f => {
    const count = docs.filter(f.check).length;
    const pct = Math.round(count/docs.length*100);
    console.log(`${f.label.padEnd(35)} ${count}/259 (${pct}%)`);
  });

  console.log("\n=== WHAT WE ARE MISSING ===");
  console.log("Price appreciation % YoY    0/259 — need DLD historical data");
  console.log("Transaction count by area   ?/259 — check DLD volumes collection");
  
  // Check DLD volumes collection
  const dldSnap = await db.collection("dldVolumes").limit(3).get();
  console.log("\nDLD Volumes collection sample:");
  dldSnap.docs.forEach(d => {
    console.log(" ", d.id, JSON.stringify(d.data()).substring(0,150));
  });

  process.exit(0);
}
run().catch(e=>{console.error(e);process.exit(1);});