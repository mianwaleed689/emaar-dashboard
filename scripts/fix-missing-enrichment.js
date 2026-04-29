const admin = require("firebase-admin");
const sa = require("../serviceAccountKey.json");
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

async function run() {
  // Add 2 missing communities
  const batch1 = db.batch();
  [
    {community:"The World Islands", lat:25.1833, lng:55.2167, grossYield:4.5, avgPpsf:4000, supplyRisk:"High", tier:"dld-registry"},
    {community:"Jebel Ali Industrial", lat:24.9833, lng:55.1167, grossYield:5.0, avgPpsf:900, supplyRisk:"Low", tier:"dld-registry"},
  ].forEach(n=>{
    const id = n.community.toLowerCase().replace(/[^a-z0-9]+/g,"-");
    batch1.set(db.collection("neighbourhoodScores").doc(id),{
      ...n, investmentScore:45, updatedAt:new Date().toISOString()
    });
  });
  await batch1.commit();
  console.log("Added 2 missing communities");

  // Load ALL neighbourhoodScores
  const nbhdSnap = await db.collection("neighbourhoodScores").get();
  const nbhdMap = {};
  nbhdSnap.docs.forEach(d=>{
    const n = d.data();
    if(n.community) nbhdMap[n.community.toLowerCase()] = n;
  });
  console.log("Total communities:", Object.keys(nbhdMap).length);

  // Force re-enrich ALL projects missing nearestMetro
  const projSnap = await db.collection("projects").get();
  const toEnrich = projSnap.docs.filter(d=>{
    const p = d.data();
    return !p.archived && !p.nearestMetro;
  });
  console.log("Projects to re-enrich:", toEnrich.length);

  let enriched = 0;
  const BATCH_SIZE = 400;
  for(let i=0;i<toEnrich.length;i+=BATCH_SIZE){
    const batch = db.batch();
    toEnrich.slice(i,i+BATCH_SIZE).forEach(d=>{
      const p = d.data();
      const nbhd = nbhdMap[(p.community||"").toLowerCase()];
      if(!nbhd) return;
      const updates = {
        nearestMetro:    nbhd.nearestMetro||null,
        distMetro:       nbhd.distMetro?parseFloat(nbhd.distMetro):null,
        nearestMall:     nbhd.nearestMall||null,
        distMall:        nbhd.distMall?parseFloat(nbhd.distMall):null,
        nearestHospital: nbhd.nearestHospital||null,
        nearestSchool:   nbhd.nearestSchool||null,
        nearestBeach:    nbhd.nearestBeach||null,
        serviceCharge:   nbhd.serviceCharge||null,
        goldenVisa:      nbhd.goldenVisa||false,
        supplyRisk:      nbhd.supplyRisk||null,
        liquidity:       nbhd.liquidity||null,
        grossYield:      nbhd.grossYield?parseFloat(nbhd.grossYield):null,
        netYield:        nbhd.netYield?parseFloat(nbhd.netYield):null,
        ppsf:            nbhd.avgPpsf||null,
        avgPpsf:         nbhd.avgPpsf||null,
        investmentScore: nbhd.investmentScore||null,
        coordinates:     nbhd.lat&&nbhd.lng?{lat:nbhd.lat,lng:nbhd.lng}:null,
        priceMin:        nbhd.avgPpsf?Math.round(nbhd.avgPpsf*700/50000)*50000:null,
        priceMinIsEstimate: true,
        communityEnriched: true,
      };
      // Remove nulls
      Object.keys(updates).forEach(k=>updates[k]===null&&delete updates[k]);
      if(Object.keys(updates).length>0){ batch.update(d.ref,updates); enriched++; }
    });
    await batch.commit();
  }
  console.log("Re-enriched:", enriched);

  // Final check
  const snap2 = await db.collection("projects").get();
  const active2 = snap2.docs.map(d=>d.data()).filter(p=>!p.archived&&!p.nearestMetro);
  console.log("Still missing metro:", active2.length);
  if(active2.length>0) {
    const comms = [...new Set(active2.map(p=>p.community))];
    console.log("Communities:", comms.join(", "));
  }
  process.exit(0);
}
run().catch(e=>{console.error(e);process.exit(1);});