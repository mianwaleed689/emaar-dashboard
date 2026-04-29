const admin = require("firebase-admin");
const sa = require("../serviceAccountKey.json");
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

async function run() {
  // Load community data
  const nbhdSnap = await db.collection("neighbourhoodScores").get();
  const nbhdMap = {};
  nbhdSnap.docs.forEach(d=>{
    const n = d.data();
    if(n.community) nbhdMap[n.community.toLowerCase()] = n;
  });
  console.log("Communities loaded:", Object.keys(nbhdMap).length);

  // Load projects missing yield/ppsf
  const projSnap = await db.collection("projects").get();
  const projects = projSnap.docs.filter(d=>{
    const p = d.data();
    return !p.archived && (!p.grossYield || !p.ppsf || !p.avgPpsf);
  });
  console.log("Projects needing enrichment:", projects.length);

  let enriched = 0;
  const BATCH_SIZE = 400;
  
  for(let i=0;i<projects.length;i+=BATCH_SIZE) {
    const batch = db.batch();
    projects.slice(i,i+BATCH_SIZE).forEach(d=>{
      const p = d.data();
      const comm = (p.community||"").toLowerCase();
      const nbhd = nbhdMap[comm];
      if(!nbhd) return;

      const updates = {};
      if(!p.grossYield && nbhd.grossYield) updates.grossYield = parseFloat(nbhd.grossYield);
      if(!p.netYield && nbhd.netYield)     updates.netYield   = parseFloat(nbhd.netYield);
      if(!p.ppsf && nbhd.avgPpsf)          updates.ppsf       = nbhd.avgPpsf;
      if(!p.avgPpsf && nbhd.avgPpsf)       updates.avgPpsf    = nbhd.avgPpsf;
      if(!p.serviceCharge && nbhd.serviceCharge) updates.serviceCharge = nbhd.serviceCharge;
      if(!p.distMetro && nbhd.distMetro)   updates.distMetro  = nbhd.distMetro;
      if(!p.nearestMetro && nbhd.nearestMetro) updates.nearestMetro = nbhd.nearestMetro;
      if(!p.nearestMall && nbhd.nearestMall)   updates.nearestMall  = nbhd.nearestMall;
      if(!p.distMall && nbhd.distMall)     updates.distMall   = nbhd.distMall;
      if(!p.investmentScore && nbhd.investmentScore) updates.investmentScore = nbhd.investmentScore;
      
      // Estimate price from PPSF if missing
      if(!p.priceMin && nbhd.avgPpsf) {
        // Typical 1BR size 700sqft
        updates.priceMin = Math.round(nbhd.avgPpsf * 700 / 50000) * 50000;
        updates.communityMedianPPSF = nbhd.avgPpsf;
        updates.communityEnriched = true;
        updates.communitySource = "neighbourhoodScores";
      }

      if(Object.keys(updates).length>0) {
        batch.update(d.ref, updates);
        enriched++;
      }
    });
    await batch.commit();
    console.log(`Batch ${Math.floor(i/BATCH_SIZE)+1} done — enriched: ${enriched}`);
  }

  console.log("\nTotal enriched:", enriched);
  process.exit(0);
}
run().catch(e=>{console.error(e);process.exit(1);});