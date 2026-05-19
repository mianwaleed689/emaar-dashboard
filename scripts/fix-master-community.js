const admin=require('firebase-admin');
const sa=require('../serviceAccountKey.json');
if(!admin.apps.length)admin.initializeApp({credential:admin.credential.cert(sa)});
const db=admin.firestore();

const MAP={
  "Al Barsha South Fifth": "Al Barsha",
  "Al Barsha South Fourth": "Al Barsha",
  "Al Barshaa South Third": "Al Barsha",
  "Al Hebiah Fifth": "Dubai Sports City",
  "Al Hebiah First": "Dubai Sports City",
  "Al Jadaf": "Al Jadaf",
  "Al Khairan First": "Dubai Creek Harbour",
  "Al Kifaf": "Al Kifaf",
  "Al Satwa": "Al Satwa",
  "Al Thanyah Fifth": "Jumeirah Golf Estates",
  "Al Warsan First": "Al Warsan",
  "Al Wasl": "Al Wasl",
  "Al Yelayiss 1": "Town Square",
  "Al Yelayiss 2": "Town Square",
  "Bukadra": "Bukadra",
  "Burj Khalifa": "Downtown Dubai",
  "Business Bay": "Business Bay",
  "Dubai Investment Park First": "Dubai Investment Park",
  "Dubai Investment Park Second": "Dubai Investment Park",
  "Hadaeq Sheikh Mohammed Bin Rashid": "Dubai Hills Estate",
  "Jabal Ali First": "Jebel Ali",
  "Jabal Ali Industrial Second": "Jebel Ali",
  "Madinat Al Mataar": "Dubai South",
  "Madinat Dubai Almelaheyah": "Dubai Maritime City",
  "Me'Aisem First": "Jumeirah Golf Estates",
  "Nad Al Hamar": "Nad Al Hamar",
  "Nad Al Shiba First": "Nad Al Sheba",
  "Palm Deira": "Dubai Islands",
  "Ras Al Khor Industrial First": "Ras Al Khor",
  "Saih Shuaib 1": "Jebel Ali",
  "Saih Shuaib 2": "Jebel Ali",
  "Trade Center Second": "Trade Centre",
  "Wadi Al Safa 2": "Dubailand",
  "Wadi Al Safa 3": "Dubailand",
  "Wadi Al Safa 5": "Dubailand",
  "Warsan Fourth": "Al Warsan",
  "Zaabeel Second": "Zabeel"
};

async function main(){
  const snap=await db.collection('projects').get();
  let batch=db.batch(),bc=0,updated=0,skipped=0,unknown=new Set();
  
  for(const doc of snap.docs){
    const p=doc.data();
    if(p.masterCommunity) continue; // already has it
    const c=p.community||'';
    const mc=MAP[c];
    if(!mc){ unknown.add(c); skipped++; continue; }
    batch.update(doc.ref,{masterCommunity:mc});
    bc++;updated++;
    if(bc>=400){
      await batch.commit();
      console.log('Committed batch, updated so far:',updated);
      batch=db.batch();bc=0;
    }
  }
  if(bc>0) await batch.commit();
  console.log('Done! Updated:',updated,'Skipped:',skipped);
  if(unknown.size>0) console.log('Unknown communities:',[...unknown].sort().join(', '));
  process.exit(0);
}
main().catch(e=>{console.error(e);process.exit(1);});
