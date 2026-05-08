const admin=require("firebase-admin");
const sa=require("../serviceAccountKey.json");
if(!admin.apps.length)admin.initializeApp({credential:admin.credential.cert(sa)});
const db=admin.firestore();
const FALLBACK_MAP={
"Madinat Al Mataar":"Dubai World Central",
"Jabal Ali First":"DMCC Master Community",
"Jabal Ali Industrial Second":"DMCC Master Community",
"The Heights":"Dubai Hills Estate",
"The Oasis":"Dubai Hills Estate",
"Al Barsha South Fourth":"Arjan",
"Al Barsha South Fifth":"Arjan",
"Al Warsan First":"International City Phase 1",
"Warsan Fourth":"International City Phase 1",
"Emaar South":"Dubai World Central",
"Al Khairan First":"Dubai Creek Harbour",
"Al Jadaf":"Jaddaf Waterfront",
"Dubailand":"Dubai Land Residence Complex",
"The World":"Palm Jumeirah",
"Saih Shuaib 1":"Dubai World Central",
"Dubai":"Business Bay",
"Al Thanyah Fifth":"DMCC Master Community",
"Al Kifaf":"Business Bay",
"The Palmarosa":"Dubai Hills Estate",
"Downtown Dubai":"DownTown Dubai"
};
function median(arr){if(!arr.length)return 0;const s=[...arr].sort((a,b)=>a-b);const m=Math.floor(s.length/2);return s.length%2?s[m]:Math.round((s[m-1]+s[m])/2);}
function percentile(arr,p){if(!arr.length)return 0;const s=[...arr].sort((a,b)=>a-b);const i=Math.floor((p/100)*s.length);return s[Math.min(i,s.length-1)];}
async function main(){
  const txSnap=await db.collection("transactions").get();
  const byComm={};
  txSnap.docs.forEach(d=>{
    const t=d.data();
    if(t.transGroup!=="Sales")return;
    if(t.propertyUsage&&!t.propertyUsage.includes("Residential"))return;
    if(!t.ppsf||t.ppsf<=0)return;
    if(!t.date||t.date<"2022-01-01")return;
    const comm=t.masterProject||t.areaName||"";
    if(comm){if(!byComm[comm])byComm[comm]=[];byComm[comm].push(Math.round(t.ppsf));}
  });
  const commStats={};
  Object.entries(byComm).forEach(([comm,arr])=>{
    commStats[comm]={median:median(arr),p25:percentile(arr,25),p75:percentile(arr,75),count:arr.length};
  });
  const projSnap=await db.collection("projects").get();
  let updated=0;let batch=db.batch();let bc=0;
  projSnap.docs.forEach(doc=>{
    const p=doc.data();
    if(p.ppsf>0||p.communityMedianPPSF>0)return;
    const comm=p.masterProject||p.community||p.area||"";
    const fallbackComm=FALLBACK_MAP[comm];
    if(!fallbackComm||!commStats[fallbackComm])return;
    const s=commStats[fallbackComm];
    batch.update(doc.ref,{communityMedianPPSF:s.median,communityP25PPSF:s.p25,communityP75PPSF:s.p75,communityTxCount:s.count,communityPPSFSource:"dld-transactions-nearby",communityPPSFNearby:fallbackComm,communityPPSFUpdatedAt:new Date().toISOString()});
    bc++;updated++;
    console.log("Fix: "+comm+" -> "+fallbackComm+" AED "+s.median);
    if(bc>=400){batch.commit();batch=db.batch();bc=0;}
  });
  if(bc>0)await batch.commit();
  console.log("Done:",updated);
  process.exit(0);
}
main().catch(e=>{console.error(e);process.exit(1);});