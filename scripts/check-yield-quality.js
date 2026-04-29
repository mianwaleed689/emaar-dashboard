const admin = require("firebase-admin");
const sa = require("../serviceAccountKey.json");
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

async function run() {
  const snap = await db.collection("projects").get();
  const active = snap.docs.map(d=>d.data()).filter(p=>!p.archived);
  
  const realYield = active.filter(p=>p.grossYieldSource==="DLD Rent Contracts 2026");
  const estYield  = active.filter(p=>p.grossYield>0&&p.grossYieldSource!=="DLD Rent Contracts 2026");
  const noYield   = active.filter(p=>!p.grossYield);

  console.log("=== YIELD DATA QUALITY ===");
  console.log("Real DLD yield:      ", realYield.length, "("+Math.round(realYield.length/active.length*100)+"%)");
  console.log("Estimated yield:     ", estYield.length,  "("+Math.round(estYield.length/active.length*100)+"%)");
  console.log("No yield:            ", noYield.length);

  // Sample real yield projects
  console.log("\nSample real yield projects:");
  realYield.slice(0,5).forEach(p=>console.log(
    (p.name||"").substring(0,30).padEnd(30),
    "| yield:", p.grossYield+"%",
    "| rent:", p.avgAnnualRent?.toLocaleString()||"--",
    "| comm:", (p.community||"").substring(0,20)
  ));

  // Yield distribution
  const high = realYield.filter(p=>p.grossYield>=7).length;
  const mid  = realYield.filter(p=>p.grossYield>=5&&p.grossYield<7).length;
  const low  = realYield.filter(p=>p.grossYield<5).length;
  console.log("\nYield distribution (real data):");
  console.log("7%+:", high, "| 5-7%:", mid, "| <5%:", low);
  process.exit(0);
}
run().catch(e=>{console.error(e);process.exit(1);});