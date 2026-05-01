const admin=require('firebase-admin');
const sa=require('../serviceAccountKey.json');
admin.initializeApp({credential:admin.credential.cert(sa)});
const db=admin.firestore();
async function run(){
  const snap=await db.collection('yieldData').get();
  console.log('yieldData docs:',snap.size);
  const communities=[];
  snap.forEach(doc=>{
    const d=doc.data();
    if(!d.avgGrossYield||d.avgGrossYield>12||d.avgGrossYield<3)return;
    const yields={};
    const rents={};
    const salePrices={};
    Object.entries(d.yields||{}).forEach(([bed,data])=>{
      if(data.grossYield&&data.grossYield>0&&data.grossYield<=12){
        yields[bed]=data.grossYield;
        if(data.annualRent)rents[bed]=data.annualRent;
        if(data.avgPrice)salePrices[bed]=data.avgPrice;
      }
    });
    if(Object.keys(yields).length===0)return;
    communities.push({
      community:d.community,
      yields,rents,salePrices,
      source:d.source,
      verified:d.verified||false,
      tier:d.tier,
      updatedAt:d.updatedAt
    });
  });
  console.log('Valid communities:',communities.length);
  communities.forEach(c=>console.log(' ',c.community,c.yields));
  await db.collection('tabData').doc('yieldSummary').set({communities,updatedAt:new Date().toISOString()});
  console.log('Written to tabData/yieldSummary');
  process.exit(0);
}
run().catch(e=>{console.error(e);process.exit(1);});