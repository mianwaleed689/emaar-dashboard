const admin=require("firebase-admin");
const sa=require("../serviceAccountKey.json");
if(!admin.apps.length)admin.initializeApp({credential:admin.credential.cert(sa)});
const db=admin.firestore();

async function main(){
  const snap=await db.collection("projects").get();
  const batch=db.batch();
  let fixed=0;
  snap.docs.forEach(d=>{
    const p=d.data();
    const name=p.name||"";
    if(name.includes("Damac Lagoons")||name.includes("DAMAC Lagoons")){
      batch.update(d.ref,{community:"DAMAC Lagoons",masterProject:"DAMAC Lagoons"});
      fixed++;
    } else if(name.trim()==="NUMA RESERVE"){
      batch.update(d.ref,{community:"MBR City",masterProject:"MBR City"});
      fixed++;
    }
  });
  await batch.commit();
  console.log("Fixed",fixed,"projects");
  process.exit(0);
}
main().catch(e=>{console.error(e);process.exit(1);});