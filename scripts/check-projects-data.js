const admin = require("firebase-admin");
const sa = require("../serviceAccountKey.json");
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

async function run() {
  const snap = await db.collection("projects").get();
  const projects = snap.docs.map(d=>({id:d.id,...d.data()}));
  
  console.log("Total projects:", projects.length);
  
  // Check what fields exist
  const withLaunch   = projects.filter(p=>p.launchDate||p.projectStartDate);
  const withHandover = projects.filter(p=>p.handover||p.handoverQuarter||p.expectedHandover);
  const withPrice    = projects.filter(p=>p.priceMin||p.price);
  const offPlan      = projects.filter(p=>p.status==="Off-Plan"||p.isOffPlan);
  
  console.log("With launchDate:   ", withLaunch.length);
  console.log("With handover:     ", withHandover.length);
  console.log("With price:        ", withPrice.length);
  console.log("Off-Plan status:   ", offPlan.length);
  
  // Show sample project fields
  console.log("\n=== SAMPLE PROJECT FIELDS ===");
  const sample = projects[0];
  console.log("Fields:", Object.keys(sample).join(", "));
  console.log("\nSample:", JSON.stringify(sample, null, 2).substring(0,500));
  
  process.exit(0);
}
run().catch(e=>{console.error(e);process.exit(1);});