const admin = require("firebase-admin");
const sa = require("../serviceAccountKey.json");
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

async function run() {
  const [projSnap, nbhdSnap] = await Promise.all([
    db.collection("projects").get(),
    db.collection("neighbourhoodScores").get()
  ]);

  const projects = projSnap.docs.map(d=>d.data());
  const active   = projects.filter(p=>!p.archived);
  const dld      = projects.filter(p=>p.dldImported&&!p.archived);
  const emaar    = projects.filter(p=>!p.dldImported);
  const withHandover = active.filter(p=>p.handoverQuarter);
  const offplan  = active.filter(p=>p.status==="Off-Plan"||p.status==="Announced");

  const nbhds    = nbhdSnap.docs.map(d=>d.data());
  const verified = nbhds.filter(n=>n.tier==="verified");
  const areaData = nbhds.filter(n=>n.tier==="area-data");
  const dldReg   = nbhds.filter(n=>n.tier==="dld-registry");

  console.log("=== PROJECTS ===");
  console.log("Total projects:    ", projSnap.size);
  console.log("Active projects:   ", active.length);
  console.log("Emaar projects:    ", emaar.length);
  console.log("DLD projects:      ", dld.length);
  console.log("With handover:     ", withHandover.length);
  console.log("Off-plan/Announced:", offplan.length);
  console.log("Archived (old):    ", projects.filter(p=>p.archived).length);

  console.log("\n=== COMMUNITIES ===");
  console.log("Total communities: ", nbhdSnap.size);
  console.log("Verified:          ", verified.length);
  console.log("Area Data:         ", areaData.length);
  console.log("DLD Registry:      ", dldReg.length);

  // Communities with projects
  const commWithProjs = new Set(active.map(p=>p.community).filter(Boolean));
  console.log("Communities with projects:", commWithProjs.size);

  process.exit(0);
}
run().catch(e=>{console.error(e);process.exit(1);});