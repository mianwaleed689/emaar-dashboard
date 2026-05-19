const admin=require('firebase-admin');
const sa=require('../serviceAccountKey.json');
if(!admin.apps.length)admin.initializeApp({credential:admin.credential.cert(sa)});
const db=admin.firestore();
const FIXES=[{"m": "Avarra By Palace", "mc": "Business Bay", "h": "Q2 2031", "pp": "80/20", "b": ["1BR", "2BR", "3BR", "4BR"], "s": 789, "p": 2700000}, {"m": "Damac Islands 2 - Antigua 1", "mc": "DAMAC Islands"}, {"m": "Golf Fields", "mc": "Emaar South", "h": "Q1 2030", "pp": "80/20", "b": ["1BR", "2BR", "3BR"], "s": 672, "p": 1100000}, {"m": "Golf Vale", "mc": "Emaar South", "h": "Q1 2030", "pp": "80/20", "b": ["1BR", "2BR", "3BR"], "s": 672, "p": 1090000}, {"m": "Grove Ridge", "mc": "Emaar South"}, {"m": "Vista Ridge", "mc": "Emaar South"}, {"m": "Discovery Dunes", "clearSize": true}, {"m": "International City Lake District", "clearSize": true}, {"m": "Eome", "clearSize": true}, {"m": "The Heart Of Europe", "clearSize": true}];

async function main(){
  const snap=await db.collection('projects').get();
  const nm={};
  snap.docs.forEach(d=>{ nm[(d.data().name||'').toLowerCase().trim()]=d; });
  let batch=db.batch(),bc=0,updated=0,nf=0;
  const now=new Date().toISOString();
  
  for(const f of FIXES){
    const doc=nm[f.m.toLowerCase().trim()];
    if(!doc){ nf++;console.log('NOT FOUND:',f.m);continue; }
    const p=doc.data();
    const u={dataEnrichedAt:now};
    
    if(f.mc) u.masterCommunity=f.mc;
    if(f.h&&!p.handoverDate) { u.handoverDate=f.h; u.completionDate=f.h; }
    if(f.pp&&(!p.paymentPlan||p.paymentPlan==='20/60/20'||p.paymentPlan==='20/80')) u.paymentPlan=f.pp;
    if(f.b&&(!p.beds||p.beds.length===0)) u.beds=f.b;
    if(f.s&&(!p.sizeMin||p.sizeMin<=0)) u.sizeMin=f.s;
    if(f.p&&(!p.priceMin||p.priceMin<=0)) u.priceMin=f.p;
    if(f.clearSize) u.sizeMin=admin.firestore.FieldValue.delete();
    
    if(Object.keys(u).length>1){
      batch.update(doc.ref,u);bc++;updated++;
      console.log('OK',f.m,'|',Object.keys(u).filter(k=>k!='dataEnrichedAt').join(','));
      if(bc>=400){ await batch.commit();batch=db.batch();bc=0; }
    }
  }
  if(bc>0) await batch.commit();
  console.log('Done! Updated:',updated,'Not found:',nf);
  process.exit(0);
}
main().catch(e=>{console.error(e);process.exit(1);});
