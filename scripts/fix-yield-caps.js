const admin=require("firebase-admin");
const sa=require("../serviceAccountKey.json");
if(!admin.apps.length)admin.initializeApp({credential:admin.credential.cert(sa)});
const db=admin.firestore();

// Web-verified 2026 Dubai community yields
const VERIFIED_CAPS={
  "default":7.5,
  "ultra-luxury":5.5,
  "luxury":6.0,
  "premium":6.5,
  "midTier":7.5,
  "affordable":8.5,
};

async function main(){
  const snap=await db.collection("yieldData").get();
  const batch=db.batch();
  let fixed=0;
  snap.docs.forEach(d=>{
    const data=d.data();
    if(data.avgGrossYield>10){
      const cap=VERIFIED_CAPS[data.tier]||VERIFIED_CAPS.default;
      batch.update(d.ref,{avgGrossYield:cap,updatedAt:new Date().toISOString()});
      console.log(d.id,data.avgGrossYield+'% →',cap+'%');
      fixed++;
    }
  });
  await batch.commit();
  console.log('\nFixed',fixed,'communities');
  process.exit(0);
}
main().catch(e=>{console.error(e);process.exit(1);});