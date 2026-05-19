const admin=require('firebase-admin');
const sa=require('../serviceAccountKey.json');
if(!admin.apps.length)admin.initializeApp({credential:admin.credential.cert(sa)});
const db=admin.firestore();
const C=[{"m": "Bottega Nove By Lalav", "h": "Q2 2026", "pp": "40/60", "b": ["2BR", "3BR"], "u": 54, "p": 0}, {"m": "Hearth Heights By Enawt Real Estate Development", "mc": "Jumeirah Village Circle"}, {"m": "Ayami Residence, By Ayat Development", "h": "Q4 2028", "pp": "50/50", "b": ["Studio", "1BR", "2BR"], "s": 380, "p": 475000, "u": 376}, {"m": "Zyra Hills", "h": "Q2 2028", "b": ["Studio", "1BR", "2BR", "3BR"], "s": 375, "p": 557000}, {"m": "Rr Grand", "h": "Q2 2027", "b": ["Studio", "1BR", "2BR"], "u": 72, "p": 0}, {"m": "Noore", "h": "Q2 2027", "b": ["1BR", "2BR", "3BR"], "s": 769, "p": 1300000}];
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
      if(bc>=400){await batch.commit();batch=db.batch();bc=0;}
    } else console.log('SKIP (already has data):',c.m);
  }
  if(bc>0)await batch.commit();
  console.log('Done! Updated:',updated,'Not found:',nf);
  process.exit(0);
}
main().catch(e=>{console.error(e);process.exit(1);});
