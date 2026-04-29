const admin = require("firebase-admin");
const sa = require("../serviceAccountKey.json");
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

async function run() {
  const projSnap = await db.collection("projects").get();
  const nbhdSnap = await db.collection("neighbourhoodScores").get();
  
  const nbhdNames = new Set(nbhdSnap.docs.map(d=>d.data().community?.toLowerCase()));
  
  // Find unique communities in projects not in neighbourhoods
  const projComms = {};
  projSnap.docs.forEach(d=>{
    const p = d.data();
    if(p.archived) return;
    const c = p.community||"";
    if(!nbhdNames.has(c.toLowerCase())) {
      projComms[c]=(projComms[c]||0)+1;
    }
  });
  
  console.log("Communities in projects but NOT in neighbourhoodScores:");
  Object.entries(projComms).sort((a,b)=>b[1]-a[1]).forEach(([c,n])=>
    console.log(n.toString().padStart(5), c)
  );
  console.log("\nTotal missing:", Object.keys(projComms).length);
  
  // Also check which nbhd communities have no facilities
  const noFacilities = nbhdSnap.docs.filter(d=>{
    const n = d.data();
    return !n.nearestMall && !n.nearestHospital;
  }).map(d=>d.data().community);
  
  console.log("\nNeighbourhoods missing facilities:", noFacilities.length);
  noFacilities.slice(0,20).forEach(c=>console.log(" ", c));
  
  process.exit(0);
}
run().catch(e=>{console.error(e);process.exit(1);});