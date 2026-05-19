const admin=require('firebase-admin');
const sa=require('../serviceAccountKey.json');
if(!admin.apps.length)admin.initializeApp({credential:admin.credential.cert(sa)});
const db=admin.firestore();
const C=[{"m": "The Wilds Residences", "h": "Q2 2029", "pp": "65/35", "b": ["3BR", "4BR", "5BR", "6BR"], "s": 3562, "p": 5500000, "u": 1700}, {"m": "Park Residency", "h": "Q3 2029", "pp": "20/80", "b": ["Studio", "1BR", "2BR", "3BR"], "s": 400, "p": 538891}];
async function main(){
  const snap=await db.collection('projects').get();
  const nm={};
  snap.docs.forEach(d=>{ nm[(d.data().name||'').toLowerCase().trim()]=d; });
  let batch=db.batch(),bc=0,updated=0,nf=0;
  const now=new Date().toISOString();
  for(const c of C){
    const doc=nm[c.m.toLowerCase().trim()];
    if(!doc){nf++;console.log('NOT FOUND:',c.m);continue;}
    const p=doc.data();
    const u={dataEnrichedAt:now,dataSource:'web-verified-2025'};
    if(c.mc) u.masterCommunity=c.mc;
    if(c.h&&!p.handoverDate&&!p.completionDate){u.handoverDate=c.h;u.completionDate=c.h;}
    if(c.pp&&(!p.paymentPlan||p.paymentPlan==='20/60/20'||p.paymentPlan==='20/80'))u.paymentPlan=c.pp;
    if(c.b&&(!p.beds||p.beds.length===0))u.beds=c.b;
    if(c.s&&(!p.sizeMin||p.sizeMin<=0))u.sizeMin=c.s;
    if(c.p&&c.p>0&&(!p.priceMin||p.priceMin<=0))u.priceMin=c.p;
    if(c.u&&(!p.totalUnits||p.totalUnits<=0))u.totalUnits=c.u;
    if(Object.keys(u).length>2){
      batch.update(doc.ref,u);bc++;updated++;
      console.log('OK',c.m,'|',Object.keys(u).filter(k=>k!='dataEnrichedAt'&&k!='dataSource').join(','));
    } else console.log('SKIP:',c.m);
  }
  if(bc>0)await batch.commit();
  console.log('Done! Updated:',updated,'Not found:',nf);
  process.exit(0);
}
main().catch(e=>{console.error(e);process.exit(1);});
