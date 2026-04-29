const fs = require("fs");
const path = require("path");
const admin = require("firebase-admin");
const sa = require("../serviceAccountKey.json");
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

const unitSizes = JSON.parse(fs.readFileSync(path.join(__dirname,"../data/dld-unit-sizes.json"),"utf8"));
const rentData  = JSON.parse(fs.readFileSync(path.join(__dirname,"../data/dld-rent-data.json"),"utf8"));

const normalize = s => (s||"").toUpperCase().trim().replace(/\s+/g," ");

async function run() {
  const snap = await db.collection("projects").get();
  const projects = snap.docs.map(d=>d.data()).filter(p=>!p.archived).slice(0,20);
  
  console.log("=== PROJECT NAME vs DLD UNIT NAMES ===");
  projects.forEach(p=>{
    const pName = normalize(p.name);
    const match = unitSizes[p.name] || unitSizes[pName];
    console.log("Project:", p.name?.substring(0,30).padEnd(30), "| Match:", match?"YES":"NO");
  });

  console.log("\n=== SAMPLE DLD UNIT NAMES ===");
  Object.keys(unitSizes).slice(0,15).forEach(k=>console.log(" ", k));

  console.log("\n=== COMMUNITY NAME vs RENT DATA AREAS ===");
  const commNames = [...new Set(snap.docs.map(d=>d.data().community))].slice(0,10);
  commNames.forEach(c=>{
    const match = rentData[c] || rentData[normalize(c)];
    console.log("Community:", (c||"").padEnd(30), "| Match:", match?"YES":"NO");
  });

  console.log("\n=== SAMPLE RENT DATA AREAS ===");
  Object.keys(rentData).slice(0,15).forEach(k=>console.log(" ", k));
  
  process.exit(0);
}
run().catch(e=>{console.error(e);process.exit(1);});