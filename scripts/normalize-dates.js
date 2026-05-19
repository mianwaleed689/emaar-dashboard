
const admin=require('firebase-admin');
const sa=require('../serviceAccountKey.json');
if(!admin.apps.length)admin.initializeApp({credential:admin.credential.cert(sa)});
const db=admin.firestore();

function toQuarter(dateStr){
  if(!dateStr||dateStr==='null') return null;
  if(/^Q[1-4] 20[0-9]{2}$/.test(dateStr)) return dateStr;
  if(/^20[0-9]{2}-[0-9]{2}-[0-9]{2}$/.test(dateStr)){
    const [y,m]=dateStr.split('-').map(Number);
    const q=Math.ceil(m/3);
    return 'Q'+q+' '+y;
  }
  if(/^20[0-9]{2}$/.test(dateStr)) return 'Q4 '+dateStr;
  return null;
}

async function main(){
  const snap=await db.collection('projects').get();
  let batches=[db.batch()],bc=0,total=0,cleared=0;
  for(const doc of snap.docs){
    const p=doc.data();
    const raw=p.handoverDate||p.completionDate;
    if(raw && /^Q[1-4] 20[0-9]{2}$/.test(raw)) continue;
    const updates={};
    if(!raw||raw==='null'){
      if(raw==='null'){
        updates.handoverDate=admin.firestore.FieldValue.delete();
        updates.completionDate=admin.firestore.FieldValue.delete();
        cleared++;
      } else continue;
    } else {
      const q=toQuarter(raw);
      if(q){ updates.handoverDate=q; updates.completionDate=q; }
      else{ updates.handoverDate=admin.firestore.FieldValue.delete(); updates.completionDate=admin.firestore.FieldValue.delete(); cleared++; }
    }
    if(Object.keys(updates).length>0){
      batches[batches.length-1].update(doc.ref,updates);
      bc++;total++;
      if(bc>=400){
        await batches[batches.length-1].commit();
        console.log('Committed batch, total:',total);
        batches.push(db.batch());bc=0;
      }
    }
  }
  if(bc>0) await batches[batches.length-1].commit();
  console.log('Done! Converted:',total,'Cleared nulls:',cleared);
  process.exit(0);
}
main().catch(e=>{console.error(e);process.exit(1);});
