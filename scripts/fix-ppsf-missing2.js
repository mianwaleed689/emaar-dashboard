const admin=require("firebase-admin");
const sa=require("../serviceAccountKey.json");
if(!admin.apps.length)admin.initializeApp({credential:admin.credential.cert(sa)});
const db=admin.firestore();
const FIXES={
"Madinat Al Mataar":1575,"Jabal Ali First":1444,"Jabal Ali Industrial Second":1444,
"The Heights":1983,"The Oasis":1983,"Al Barsha South Fourth":1311,"Al Barsha South Fifth":1311,
"Al Warsan First":533,"Warsan Fourth":533,"Emaar South":1575,"Al Khairan First":2040,
"Al Jadaf":1691,"Dubailand":1242,"The World":1689,"Saih Shuaib 1":1575,
"Dubai":1797,"Al Thanyah Fifth":1444,"Al Kifaf":1797,"The Palmarosa":1983,"Downtown Dubai":1804
};
async function main(){
  const snap=await db.collection("projects").get();
  let updated=0;let batch=db.batch();let bc=0;
  snap.docs.forEach(doc=>{
    const p=doc.data();
    const comm=p.masterProject||p.community||p.area||"";
    const val=FIXES[comm];
    if(!val)return;
    batch.update(doc.ref,{communityMedianPPSF:val,communityPPSFSource:"dld-transactions-nearby",communityPPSFUpdatedAt:new Date().toISOString()});
    bc++;updated++;
    if(bc>=400){batch.commit();batch=db.batch();bc=0;}
  });
  if(bc>0)await batch.commit();
  console.log("Done:",updated);
  process.exit(0);
}
main().catch(e=>{console.error(e);process.exit(1);});