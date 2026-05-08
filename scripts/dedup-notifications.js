const admin=require("firebase-admin");
const sa=require("../serviceAccountKey.json");
if(!admin.apps.length)admin.initializeApp({credential:admin.credential.cert(sa)});
const db=admin.firestore();
async function main(){
  const snap=await db.collection("notifications").get();
  console.log("Total notifications:",snap.size);
  const seen=new Set();
  const toDelete=[];
  snap.docs.forEach(doc=>{
    const d=doc.data();
    const key=[d.date||"",d.type||"",d.projectName||"global"].join("_");
    if(seen.has(key)){toDelete.push(doc.id);}
    else{seen.set ? seen.add(key) : seen.add(key);}
  });
  console.log("Duplicates to delete:",toDelete.length);
  if(toDelete.length===0){console.log("Already clean");process.exit(0);}
  const batch=db.batch();
  toDelete.forEach(id=>batch.delete(db.collection("notifications").doc(id)));
  await batch.commit();
  console.log("Deleted",toDelete.length,"duplicate notifications");
  process.exit(0);
}
main().catch(e=>{console.error(e);process.exit(1);});