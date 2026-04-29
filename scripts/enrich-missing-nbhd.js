const admin = require("firebase-admin");
const sa = require("../serviceAccountKey.json");
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

const FACILITIES = {
  "Al Barshaa South Second":  { nearestMall:"Mall of the Emirates", distMall:3.5, nearestHospital:"Mediclinic Parkview Hospital", distHospital:4.0, nearestSchool:"GEMS World Academy", distSchool:3.0, nearestMetro:"Mall of the Emirates Metro", distMetro:3.5, serviceCharge:12 },
  "Al Hebiah First":          { nearestMall:"Dubai Sports City Outlet", distMall:2.0, nearestHospital:"Mediclinic Parkview Hospital", distHospital:8.0, nearestSchool:"GEMS Metropole School", distSchool:2.5, nearestMetro:"Dubai Internet City Metro", distMetro:8.0, serviceCharge:14 },
  "Al Hebiah Second":         { nearestMall:"Circle Mall JVC", distMall:3.0, nearestHospital:"Mediclinic Parkview Hospital", distHospital:7.0, nearestSchool:"GEMS Metropole School", distSchool:2.0, nearestMetro:"Dubai Internet City Metro", distMetro:7.0, serviceCharge:15 },
  "Al Hebiah Sixth":          { nearestMall:"Dubai Sports City Outlet", distMall:1.5, nearestHospital:"Mediclinic Parkview Hospital", distHospital:8.5, nearestSchool:"GEMS Metropole School", distSchool:1.5, nearestMetro:"Dubai Internet City Metro", distMetro:9.0, serviceCharge:13 },
  "Al Jadaf":                 { nearestMall:"Wafi Mall", distMall:2.5, nearestHospital:"Rashid Hospital", distHospital:3.0, nearestSchool:"Gems Wellington Primary School", distSchool:2.0, nearestMetro:"Al Jadaf Metro", distMetro:0.5, serviceCharge:16 },
  "Al Kifaf":                 { nearestMall:"BurJuman Mall", distMall:1.5, nearestHospital:"Rashid Hospital", distHospital:2.0, nearestSchool:"Al Kifaf School", distSchool:0.5, nearestMetro:"BurJuman Metro", distMetro:1.0, serviceCharge:14 },
  "Al Safouh First":          { nearestMall:"Mall of the Emirates", distMall:3.0, nearestHospital:"Saudi German Hospital Dubai", distHospital:4.0, nearestSchool:"Dubai British School", distSchool:2.5, nearestMetro:"Dubai Internet City Metro", distMetro:2.0, serviceCharge:18 },
  "Al Safouh Second":         { nearestMall:"Mall of the Emirates", distMall:2.5, nearestHospital:"Saudi German Hospital Dubai", distHospital:3.5, nearestSchool:"Dubai British School", distSchool:2.0, nearestMetro:"Dubai Internet City Metro", distMetro:1.5, serviceCharge:18 },
  "Al Thanyah First":         { nearestMall:"Mall of the Emirates", distMall:2.0, nearestHospital:"Saudi German Hospital Dubai", distHospital:3.0, nearestSchool:"Dubai British School", distSchool:1.5, nearestMetro:"Dubai Internet City Metro", distMetro:1.0, serviceCharge:16 },
  "Al Warsan First":          { nearestMall:"Dragon Mart", distMall:2.0, nearestHospital:"Aster Hospital Mankhool", distHospital:8.0, nearestSchool:"GEMS Heritage Indian School", distSchool:3.0, nearestMetro:"Dubai Airport T3 Metro", distMetro:12.0, serviceCharge:10 },
  "Island 2":                 { nearestMall:"Festival City Mall", distMall:15.0, nearestHospital:"Rashid Hospital", distHospital:18.0, nearestSchool:"Deira International School", distSchool:16.0, nearestMetro:"Festival City Metro", distMetro:15.0, serviceCharge:25 },
  "Jabal Ali Industrial Second":{ nearestMall:"Ibn Battuta Mall", distMall:8.0, nearestHospital:"NMC Royal Hospital DIP", distHospital:5.0, nearestSchool:"GEMS United Indian School", distSchool:6.0, nearestMetro:"Jebel Ali Metro", distMetro:4.0, serviceCharge:8 },
  "Jebel Ali Industrial":     { nearestMall:"Ibn Battuta Mall", distMall:8.0, nearestHospital:"NMC Royal Hospital DIP", distHospital:5.0, nearestSchool:"GEMS United Indian School", distSchool:6.0, nearestMetro:"Jebel Ali Metro", distMetro:3.0, serviceCharge:8 },
  "Jumeirah First":           { nearestMall:"BurJuman Mall", distMall:4.0, nearestHospital:"Mediclinic City Hospital", distHospital:5.0, nearestSchool:"Jumeirah English Speaking School", distSchool:1.0, nearestMetro:"World Trade Centre Metro", distMetro:4.0, serviceCharge:15 },
  "Madinat Dubai Almelaheyah":{ nearestMall:"Festival City Mall", distMall:6.0, nearestHospital:"Rashid Hospital", distHospital:4.0, nearestSchool:"Deira International School", distSchool:5.0, nearestMetro:"Al Jadaf Metro", distMetro:3.0, serviceCharge:20 },
  "Madinat Hind 4":           { nearestMall:"Dubai Outlet Mall", distMall:5.0, nearestHospital:"Aster Clinic DAMAC Hills 2", distHospital:2.0, nearestSchool:"Fairgreen International School", distSchool:3.0, nearestMetro:"UAE Exchange Metro", distMetro:18.0, serviceCharge:10 },
  "Me'Aisem First":           { nearestMall:"City Centre Me'aisem", distMall:1.0, nearestHospital:"Mediclinic Parkview Hospital", distHospital:6.0, nearestSchool:"GEMS Metropole School", distSchool:2.0, nearestMetro:"Dubai Internet City Metro", distMetro:5.0, serviceCharge:12 },
  "Nadd Hessa":               { nearestMall:"Cedre Shopping Centre", distMall:2.0, nearestHospital:"Mediclinic Silicon Oasis", distHospital:1.5, nearestSchool:"GEMS Winchester School", distSchool:1.0, nearestMetro:"Silicon Oasis Metro", distMetro:2.0, serviceCharge:12 },
  "Saih Shuaib 1":            { nearestMall:"Ibn Battuta Mall", distMall:20.0, nearestHospital:"Mediclinic Parkview Hospital", distHospital:25.0, nearestSchool:"GEMS World Academy", distSchool:22.0, nearestMetro:"UAE Exchange Metro", distMetro:15.0, serviceCharge:8 },
  "The World":                { nearestMall:"Festival City Mall", distMall:20.0, nearestHospital:"Rashid Hospital", distHospital:22.0, nearestSchool:"Deira International School", distSchool:20.0, nearestMetro:"Festival City Metro", distMetro:20.0, serviceCharge:25 },
};

async function run() {
  let updated=0;
  for(const [comm, data] of Object.entries(FACILITIES)) {
    const snap = await db.collection("neighbourhoodScores").where("community","==",comm).get();
    if(snap.empty) { console.log("Not found:", comm); continue; }
    const batch = db.batch();
    snap.docs.forEach(d=>batch.update(d.ref,{
      ...data,
      hasMetro: data.distMetro<=2,
      updatedAt: new Date().toISOString(),
    }));
    await batch.commit();
    console.log("Updated:", comm);
    updated++;
  }
  console.log("\nTotal updated:", updated);

  // Re-enrich projects with these communities
  const nbhdSnap = await db.collection("neighbourhoodScores").get();
  const nbhdMap = {};
  nbhdSnap.docs.forEach(d=>{ const n=d.data(); if(n.community) nbhdMap[n.community.toLowerCase()]=n; });

  const projSnap = await db.collection("projects").get();
  const toFix = projSnap.docs.filter(d=>{
    const p = d.data();
    return !p.archived && (!p.nearestMall||!p.nearestHospital||!p.serviceCharge);
  });
  console.log("\nProjects needing re-enrichment:", toFix.length);

  let fixed=0;
  const BATCH_SIZE=400;
  for(let i=0;i<toFix.length;i+=BATCH_SIZE){
    const batch = db.batch();
    toFix.slice(i,i+BATCH_SIZE).forEach(d=>{
      const p = d.data();
      const nbhd = nbhdMap[(p.community||"").toLowerCase()];
      if(!nbhd) return;
      const updates = {};
      if(!p.nearestMall&&nbhd.nearestMall)         updates.nearestMall=nbhd.nearestMall;
      if(!p.distMall&&nbhd.distMall)               updates.distMall=parseFloat(nbhd.distMall);
      if(!p.nearestHospital&&nbhd.nearestHospital) updates.nearestHospital=nbhd.nearestHospital;
      if(!p.distHospital&&nbhd.distHospital)       updates.distHospital=parseFloat(nbhd.distHospital);
      if(!p.nearestSchool&&nbhd.nearestSchool)     updates.nearestSchool=nbhd.nearestSchool;
      if(!p.serviceCharge&&nbhd.serviceCharge)     updates.serviceCharge=nbhd.serviceCharge;
      if(Object.keys(updates).length>0){ batch.update(d.ref,updates); fixed++; }
    });
    await batch.commit();
  }
  console.log("Projects re-enriched:", fixed);

  // Final check
  const snap2 = await db.collection("projects").get();
  const active = snap2.docs.map(d=>d.data()).filter(p=>!p.archived);
  ["nearestMall","nearestHospital","serviceCharge","nearestSchool"].forEach(f=>{
    const c=active.filter(p=>p[f]).length;
    console.log(f.padEnd(20),c+"/"+active.length,Math.round(c/active.length*100)+"%");
  });
  process.exit(0);
}
run().catch(e=>{console.error(e);process.exit(1);});