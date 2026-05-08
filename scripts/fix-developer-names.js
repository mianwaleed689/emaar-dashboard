const admin=require("firebase-admin");
const sa=require("../serviceAccountKey.json");
if(!admin.apps.length)admin.initializeApp({credential:admin.credential.cert(sa)});
const db=admin.firestore();

const MAP={
  "dubai creek harbour l.l.c":"Emaar Properties",
  "emaar":"Emaar Properties",
  "damac prime development l.l.c":"DAMAC Properties",
  "damac mry investment l.l.c":"DAMAC Properties",
  "ellington properties development l.l.c":"Ellington Properties",
  "danube properties development l.l.c":"Danube Properties",
  "sobha l.l.c":"Sobha Realty",
  "aurora spv 2 l.l.c":"Aurora Real Estate",
  "samana premium real estate development l.l.c":"Samana Developers",
  "nshama properties owned by nshmi development one person company l.l.c":"Nshama",
  "imtiaz south real estate development l.l.c":"Imtiaz",
  "imtiaz luxury real estate development l.l.c":"Imtiaz",
  "imtiaz ghd real estate development l.l.c":"Imtiaz",
  "zazen property development l.l.c":"Zazen Homes",
  "nas estates l.l.c":"Nas Estates",
  "dubai south properties dwc llc":"Dubai South Properties",
  "acube real estate development l l c":"Acube Real Estate",
  "marquis home developer l.l.c":"Marquis Developers",
  "prestige gardens real estate development l.l.c":"Prestige Properties",
  "prestige sanctuary real estate development l.l.c":"Prestige Properties",
  "rabdan gardens real estate developments l.l.c":"Rabdan",
  "rabdan square developments l.l.c":"Rabdan",
  "majid developments l.l.c":"Majid Al Futtaim",
  "hre real estate development":"HRE Real Estate",
  "continental investments lmd":"Continental Investments",
  "roz real estate development":"Roz Real Estate",
  "empire real estate developments":"Empire Real Estate",
  "green properties development co.":"Green Properties",
  "fakhruddin properties development l.l.c":"Fakhruddin Properties",
  "saas properties l.l.c":"Saas Properties",
  "park 1 l.l.c":"Park Group",
  "myra real estate deveiopment l.l.c":"Myra Real Estate",
};

function canonicalName(raw){
  if(!raw)return null;
  var k=raw.toLowerCase().trim();
  if(MAP[k])return MAP[k];
  for(var pattern in MAP){
    if(k.includes(pattern))return MAP[pattern];
  }
  return null;
}

async function main(){
  const snap=await db.collection("projects").get();
  console.log("Total projects:",snap.size);
  var fixed=0;
  var batch=db.batch();
  var batchCount=0;
  var batches=[];
  snap.docs.forEach(doc=>{
    var p=doc.data();
    var current=p.developerActual||p.developer||p.developerName||"";
    var canonical=canonicalName(current);
    if(canonical && canonical!==current){
      batch.update(doc.ref,{developerActual:canonical});
      batchCount++;
      fixed++;
      console.log("Fix: "+current+" -> "+canonical);
      if(batchCount>=400){batches.push(batch);batch=db.batch();batchCount=0;}
    }
  });
  if(batchCount>0)batches.push(batch);
  for(var b of batches)await b.commit();
  console.log("Fixed",fixed,"projects");
  process.exit(0);
}
main().catch(e=>{console.error(e);process.exit(1);});