const admin = require("firebase-admin");
const sa = require("../serviceAccountKey.json");
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

async function run() {
  const [projSnap, nbhdSnap] = await Promise.all([
    db.collection("projects").get(),
    db.collection("neighbourhoodScores").get()
  ]);

  const projects = projSnap.docs.map(d=>d.data()).filter(p=>!p.archived);
  const communities = new Set(nbhdSnap.docs.map(d=>d.data().community?.toLowerCase()));

  // Unique developers from DLD projects
  const devCount = {};
  projects.filter(p=>p.dldImported).forEach(p=>{
    const dev = p.developer||"Unknown";
    devCount[dev]=(devCount[dev]||0)+1;
  });

  // Unique communities from DLD projects
  const projComms = {};
  projects.filter(p=>p.dldImported).forEach(p=>{
    const c = p.community||"Unknown";
    projComms[c]=(projComms[c]||0)+1;
  });

  // Check which project communities are NOT in neighbourhoodScores
  const missing = Object.keys(projComms).filter(c=>
    !communities.has(c.toLowerCase())
  );

  console.log("=== DLD PROJECT DEVELOPERS ===");
  Object.entries(devCount).sort((a,b)=>b[1]-a[1]).forEach(([d,c])=>
    console.log(c.toString().padStart(5), d)
  );

  console.log("\n=== PROJECT COMMUNITIES ===");
  console.log("Total unique:", Object.keys(projComms).length);
  console.log("In neighbourhoodScores:", Object.keys(projComms).length-missing.length);
  console.log("NOT in neighbourhoodScores:", missing.length);
  
  console.log("\nMISSING communities (have projects but no neighbourhood data):");
  missing.sort((a,b)=>(projComms[b]||0)-(projComms[a]||0)).forEach(c=>
    console.log((projComms[c]||0).toString().padStart(5), c)
  );

  process.exit(0);
}
run().catch(e=>{console.error(e);process.exit(1);});