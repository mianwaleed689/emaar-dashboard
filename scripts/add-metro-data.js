const admin = require("firebase-admin");
const sa = require("../serviceAccountKey.json");
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

const METRO_DATA = {
  "Palm Deira":         { nearestMetro:"Al Rigga Metro Station",           distMetro:8.5,  hasMetro:false },
  "Dubailand":          { nearestMetro:"Centrepoint Metro Station",         distMetro:12.0, hasMetro:false },
  "DAMAC Hills 2":      { nearestMetro:"UAE Exchange Metro Station",        distMetro:18.0, hasMetro:false },
  "Emaar South":        { nearestMetro:"UAE Exchange Metro Station",        distMetro:15.0, hasMetro:false },
  "Palm Jumeirah":      { nearestMetro:"Nakheel Harbour & Tower Metro",     distMetro:2.0,  hasMetro:true  },
  "Al Jadaf":           { nearestMetro:"Al Jadaf Metro Station",            distMetro:0.5,  hasMetro:true  },
  "Dubai Silicon Oasis":{ nearestMetro:"Silicon Oasis Metro Station",       distMetro:1.5,  hasMetro:true  },
  "The World Islands":  { nearestMetro:"Palm Jumeirah Metro",               distMetro:15.0, hasMetro:false },
  "Jebel Ali Industrial":{ nearestMetro:"Jebel Ali Metro Station",          distMetro:3.0,  hasMetro:true  },
};

async function run() {
  // Update neighbourhoodScores
  let updated = 0;
  for(const [comm, metro] of Object.entries(METRO_DATA)) {
    const snap = await db.collection("neighbourhoodScores").where("community","==",comm).get();
    if(snap.empty) { console.log("Not found:", comm); continue; }
    const batch = db.batch();
    snap.docs.forEach(d=>batch.update(d.ref, metro));
    await batch.commit();
    console.log("Updated:", comm, "| metro:", metro.nearestMetro, metro.distMetro+"km");
    updated++;
  }
  console.log("\nUpdated", updated, "communities");

  // Now re-enrich projects
  const nbhdSnap = await db.collection("neighbourhoodScores").get();
  const nbhdMap = {};
  nbhdSnap.docs.forEach(d=>{ const n=d.data(); if(n.community) nbhdMap[n.community.toLowerCase()]=n; });

  const projSnap = await db.collection("projects").get();
  const toEnrich = projSnap.docs.filter(d=>!d.data().archived&&!d.data().nearestMetro);
  console.log("\nProjects still missing metro:", toEnrich.length);

  let enriched=0;
  const BATCH_SIZE=400;
  for(let i=0;i<toEnrich.length;i+=BATCH_SIZE){
    const batch = db.batch();
    toEnrich.slice(i,i+BATCH_SIZE).forEach(d=>{
      const p = d.data();
      const nbhd = nbhdMap[(p.community||"").toLowerCase()];
      if(!nbhd||!nbhd.nearestMetro) return;
      const updates = {
        nearestMetro:    nbhd.nearestMetro,
        distMetro:       parseFloat(nbhd.distMetro)||null,
        hasMetro:        nbhd.hasMetro||false,
        nearestMall:     nbhd.nearestMall||null,
        distMall:        nbhd.distMall?parseFloat(nbhd.distMall):null,
        nearestHospital: nbhd.nearestHospital||null,
        nearestSchool:   nbhd.nearestSchool||null,
        serviceCharge:   nbhd.serviceCharge||null,
        goldenVisa:      nbhd.goldenVisa||false,
        supplyRisk:      nbhd.supplyRisk||null,
        grossYield:      nbhd.grossYield?parseFloat(nbhd.grossYield):null,
        ppsf:            nbhd.avgPpsf||null,
        investmentScore: nbhd.investmentScore||null,
        coordinates:     nbhd.lat&&nbhd.lng?{lat:nbhd.lat,lng:nbhd.lng}:null,
        priceMin:        nbhd.avgPpsf?Math.round(nbhd.avgPpsf*700/50000)*50000:null,
        priceMinIsEstimate:true,
      };
      Object.keys(updates).forEach(k=>updates[k]===null&&delete updates[k]);
      if(Object.keys(updates).length>0){ batch.update(d.ref,updates); enriched++; }
    });
    await batch.commit();
  }
  console.log("Enriched:", enriched);
  process.exit(0);
}
run().catch(e=>{console.error(e);process.exit(1);});