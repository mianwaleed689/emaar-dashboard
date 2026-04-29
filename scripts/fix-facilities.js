const admin = require("firebase-admin");
const sa = require("../serviceAccountKey.json");
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

async function run() {
  const nbhdSnap = await db.collection("neighbourhoodScores").get();
  const nbhdMap = {};
  nbhdSnap.docs.forEach(d=>{ const n=d.data(); if(n.community) nbhdMap[n.community.toLowerCase()]=n; });

  const projSnap = await db.collection("projects").get();
  const toFix = projSnap.docs.filter(d=>{
    const p = d.data();
    return !p.archived && (!p.nearestMall || !p.nearestHospital || !p.serviceCharge);
  });
  console.log("Projects missing mall/hospital/sc:", toFix.length);

  let fixed=0;
  const BATCH_SIZE=400;
  for(let i=0;i<toFix.length;i+=BATCH_SIZE){
    const batch = db.batch();
    toFix.slice(i,i+BATCH_SIZE).forEach(d=>{
      const p = d.data();
      const nbhd = nbhdMap[(p.community||"").toLowerCase()];
      if(!nbhd) return;
      const updates = {};
      if(!p.nearestMall     && nbhd.nearestMall)     updates.nearestMall     = nbhd.nearestMall;
      if(!p.distMall        && nbhd.distMall)         updates.distMall        = parseFloat(nbhd.distMall);
      if(!p.nearestHospital && nbhd.nearestHospital)  updates.nearestHospital = nbhd.nearestHospital;
      if(!p.distHospital    && nbhd.distHospital)     updates.distHospital    = parseFloat(nbhd.distHospital);
      if(!p.nearestSchool   && nbhd.nearestSchool)    updates.nearestSchool   = nbhd.nearestSchool;
      if(!p.distSchool      && nbhd.distSchool)       updates.distSchool      = parseFloat(nbhd.distSchool);
      if(!p.serviceCharge   && nbhd.serviceCharge)    updates.serviceCharge   = nbhd.serviceCharge;
      if(!p.nearestBeach    && nbhd.nearestBeach)     updates.nearestBeach    = nbhd.nearestBeach;
      if(Object.keys(updates).length>0){ batch.update(d.ref,updates); fixed++; }
    });
    await batch.commit();
  }
  console.log("Fixed:", fixed);

  // Final completeness
  const snap2 = await db.collection("projects").get();
  const active = snap2.docs.map(d=>d.data()).filter(p=>!p.archived);
  const checks = [
    "nearestMall","nearestHospital","nearestSchool","serviceCharge","nearestMetro"
  ];
  checks.forEach(f=>{
    const c = active.filter(p=>p[f]).length;
    console.log(f.padEnd(20), c+"/"+active.length, Math.round(c/active.length*100)+"%");
  });
  process.exit(0);
}
run().catch(e=>{console.error(e);process.exit(1);});