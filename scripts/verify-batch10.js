const admin=require('firebase-admin');
const sa=require('../serviceAccountKey.json');
if(!admin.apps.length)admin.initializeApp({credential:admin.credential.cert(sa)});
const db=admin.firestore();
const C=[{"m": "Binghatti Hills", "h": "Q4 2025", "pp": "70/30", "b": ["Studio", "1BR", "2BR", "3BR"], "s": 400, "p": 778000, "mc": "Dubai Science Park"}, {"m": "Binghatti Phantom", "h": "Q4 2025", "pp": "70/30", "b": ["1BR", "2BR", "3BR"], "s": 791, "p": 999999, "mc": "Jumeirah Village Circle"}, {"m": "Binghatti Phoenix", "h": "Q3 2025", "pp": "70/30", "b": ["Studio", "1BR", "2BR"], "s": 400, "p": 600000, "mc": "Jumeirah Village Circle"}, {"m": "Binghatti Royale", "h": "Q4 2025", "pp": "70/30", "b": ["Studio", "1BR", "2BR", "3BR"], "s": 400, "p": 1221874, "mc": "Jumeirah Village Circle"}, {"m": "Sobha Reserve", "h": "Q2 2026", "pp": "60/40", "b": ["4BR", "5BR", "6BR"], "s": 4000, "p": 9300000, "mc": "Dubailand"}, {"m": "Sobha One", "h": "Q4 2026", "pp": "60/40", "b": ["1BR", "2BR", "3BR"], "s": 700, "p": 1500000, "mc": "Mohammed Bin Rashid City"}, {"m": "Sobha Creek Vistas Heights", "h": "Q2 2026", "pp": "60/40", "b": ["1BR", "2BR", "3BR"], "s": 611, "p": 1200000, "mc": "Mohammed Bin Rashid City"}, {"m": "Palm Jebel Ali - Frond I", "h": "Q4 2027", "pp": "80/20", "b": ["4BR", "5BR", "6BR"], "s": 4000, "p": 12000000, "mc": "Palm Jebel Ali"}, {"m": "Palm Jebel Ali - Frond J", "h": "Q4 2027", "pp": "80/20", "b": ["4BR", "5BR", "6BR"], "s": 4000, "p": 12000000, "mc": "Palm Jebel Ali"}, {"m": "Palm Jebel Ali - Frond L", "h": "Q4 2027", "pp": "80/20", "b": ["4BR", "5BR", "6BR"], "s": 4000, "p": 12000000, "mc": "Palm Jebel Ali"}];
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
    if(c.mc&&!p.masterCommunity) u.masterCommunity=c.mc;
    if(c.h&&!p.handoverDate&&!p.completionDate){u.handoverDate=c.h;u.completionDate=c.h;}
    if(c.pp&&(!p.paymentPlan||p.paymentPlan==='20/60/20'||p.paymentPlan==='20/80'))u.paymentPlan=c.pp;
    if(c.b&&(!p.beds||p.beds.length===0))u.beds=c.b;
    if(c.s&&(!p.sizeMin||p.sizeMin<=0))u.sizeMin=c.s;
    if(c.p&&c.p>0&&(!p.priceMin||p.priceMin<=0))u.priceMin=c.p;
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
