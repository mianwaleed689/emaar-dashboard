const admin=require("firebase-admin");
const sa=require("../serviceAccountKey.json");
if(!admin.apps.length)admin.initializeApp({credential:admin.credential.cert(sa)});
const db=admin.firestore();

async function main(){
  console.log("Loading yieldData...");
  const ySnap=await db.collection("yieldData").get();
  const yieldMap={};
  ySnap.docs.forEach(d=>{
    const data=d.data();
    const comm=(data.community||d.id).toLowerCase().replace(/_/g," ");
    yieldMap[comm]=data;
  });
  console.log("Loaded",Object.keys(yieldMap).length,"communities");

  const pSnap=await db.collection("projects").get();
  console.log("Total projects:",pSnap.size);

  let updated=0,noData=0;
  let batch=db.batch(),bc=0;

  pSnap.docs.forEach(doc=>{
    const p=doc.data();
    const comm=(p.masterProject||p.community||"").toLowerCase().trim();
    if(!comm){noData++;return;}

    const yd=yieldMap[comm];
    if(!yd||!yd.yields){noData++;return;}

    // Get bed types for this project
    const beds=p.beds||[];
    const ub=p.unitBreakdown||{};
    const bedKeyMap={"Studio":"studio","1BR":"1 B/R","2BR":"2 B/R","3BR":"3 B/R","4BR":"4 B/R","5BR":"5 B/R","6BR":"5 B/R"};

    // Calculate weighted average yield across bed types
    let totalUnits=0,weightedGross=0,weightedRent=0,weightedPrice=0;

    if(Object.keys(ub).length>0){
      Object.entries(ub).forEach(([bed,count])=>{
        const yk=bedKeyMap[bed];
        if(!yk||!yd.yields[yk])return;
        const y=yd.yields[yk];
        if(!y.grossYield)return;
        totalUnits+=count;
        weightedGross+=y.grossYield*count;
        if(y.annualRent) weightedRent+=y.annualRent*count;
        if(y.avgPrice) weightedPrice+=y.avgPrice*count;
      });
    }

    // Fallback to beds array if no unit breakdown
    if(totalUnits===0&&beds.length>0){
      beds.forEach(bed=>{
        const yk=bedKeyMap[bed];
        if(!yk||!yd.yields[yk])return;
        const y=yd.yields[yk];
        if(!y.grossYield)return;
        totalUnits+=1;
        weightedGross+=y.grossYield;
        if(y.annualRent) weightedRent+=y.annualRent;
        if(y.avgPrice) weightedPrice+=y.avgPrice;
      });
    }

    let grossYield,netYield,estimatedAnnualRent;

    if(totalUnits>0){
      grossYield=parseFloat((weightedGross/totalUnits).toFixed(1));
      const avgRent=weightedRent>0?Math.round(weightedRent/totalUnits):null;
      const avgPrice=weightedPrice>0?Math.round(weightedPrice/totalUnits):null;

      // Use actual project price if available
      let salePrice=avgPrice;
      if(p.ppsf>0&&p.sizeMin>0) salePrice=Math.round(p.ppsf*p.sizeMin);
      else if(p.priceMin>0) salePrice=p.priceMin;

      // Recalculate yield from actual price if we have it
      if(avgRent&&salePrice){
        const recalcYield=parseFloat((avgRent/salePrice*100).toFixed(1));
        // Sanity check - yield must be between 2% and 15%
        if(recalcYield>=2&&recalcYield<=10){
          grossYield=recalcYield;
          estimatedAnnualRent=avgRent;
        }
      }

      // Net yield
      const scImpact=p.serviceCharge>0&&p.sizeMin>0&&salePrice>0
        ?parseFloat((p.serviceCharge*p.sizeMin/salePrice*100).toFixed(1))
        :parseFloat((grossYield*0.12).toFixed(1));
      netYield=parseFloat(Math.max(grossYield-scImpact,grossYield*0.7).toFixed(1));

    } else {
      // Use community average
      grossYield=parseFloat((yd.avgGrossYield||0).toFixed(1));
      netYield=parseFloat((grossYield*0.82).toFixed(1));
    }

    // Final sanity check - cap at community average if too high
    if(!grossYield||grossYield<2){noData++;return;}
    if(grossYield>10) grossYield=parseFloat((yd.avgGrossYield||7.0).toFixed(1));
    if(netYield>grossYield||netYield<1) netYield=parseFloat((grossYield*0.82).toFixed(1));

    const updates={
      grossYield,
      netYield,
      yieldSource:yd.verified?"verified-community":"estimated-community",
      yieldUpdatedAt:new Date().toISOString(),
    };
    if(estimatedAnnualRent) updates.estimatedAnnualRent=estimatedAnnualRent;

    batch.update(doc.ref,updates);
    bc++;updated++;
    if(bc>=400){
      batch.commit();
      batch=db.batch();bc=0;
      console.log("Committed batch, updated so far:",updated);
    }
  });

  if(bc>0)await batch.commit();
  console.log("\nDone! Updated:",updated,"No data:",noData);
  process.exit(0);
}
main().catch(e=>{console.error(e);process.exit(1);});