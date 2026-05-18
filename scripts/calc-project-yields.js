const admin=require("firebase-admin");
const sa=require("../serviceAccountKey.json");
if(!admin.apps.length)admin.initializeApp({credential:admin.credential.cert(sa)});
const db=admin.firestore();

function getBedKey(beds){
  if(!beds||beds.length===0)return null;
  const order=["Studio","1BR","2BR","3BR","4BR","5BR"];
  const yieldKeys={"Studio":"studio","1BR":"1 B/R","2BR":"2 B/R","3BR":"3 B/R","4BR":"4 B/R","5BR":"5 B/R"};
  for(const b of order){
    if(beds.includes(b))return yieldKeys[b];
  }
  return yieldKeys[beds[0]]||null;
}

function getWeightedYield(yieldData,beds,unitBreakdown){
  if(!yieldData||!yieldData.yields)return null;
  const yieldKeys={"Studio":"studio","1BR":"1 B/R","2BR":"2 B/R","3BR":"3 B/R","4BR":"4 B/R","5BR":"5 B/R"};
  
  // If we have unit breakdown, do weighted average
  if(unitBreakdown&&Object.keys(unitBreakdown).length>0){
    let totalUnits=0,weightedRent=0,weightedPrice=0,hasPrice=false;
    Object.entries(unitBreakdown).forEach(([bed,count])=>{
      const yk=yieldKeys[bed];
      if(!yk)return;
      const yd=yieldData.yields[yk];
      if(!yd||!yd.annualRent)return;
      totalUnits+=count;
      weightedRent+=yd.annualRent*count;
      if(yd.avgPrice){weightedPrice+=yd.avgPrice*count;hasPrice=true;}
    });
    if(totalUnits>0){
      return {
        annualRent:Math.round(weightedRent/totalUnits),
        avgPrice:hasPrice?Math.round(weightedPrice/totalUnits):null
      };
    }
  }
  
  // Fallback: use most common bed type
  if(beds&&beds.length>0){
    const yk=yieldKeys[beds[0]];
    if(yk&&yieldData.yields[yk]){
      const yd=yieldData.yields[yk];
      return {annualRent:yd.annualRent,avgPrice:yd.avgPrice};
    }
  }
  
  // Last resort: community average
  if(yieldData.avgGrossYield)return {avgGrossYield:yieldData.avgGrossYield};
  return null;
}

async function main(){
  console.log("Loading yieldData...");
  const ySnap=await db.collection("yieldData").get();
  const yieldMap={};
  ySnap.docs.forEach(d=>{
    const data=d.data();
    const comm=(data.community||d.id).toLowerCase().replace(/_/g," ");
    yieldMap[comm]=data;
  });
  console.log("Loaded",Object.keys(yieldMap).length,"communities with yield data");

  console.log("Loading projects...");
  const pSnap=await db.collection("projects").get();
  console.log("Total projects:",pSnap.size);

  let updated=0,noYield=0,noComm=0;
  let batch=db.batch(),bc=0;

  pSnap.docs.forEach(doc=>{
    const p=doc.data();
    const comm=(p.masterProject||p.community||"").toLowerCase().trim();
    if(!comm){noComm++;return;}

    // Find yield data for community
    const yd=yieldMap[comm]||yieldMap[comm.replace(/\s+/g,"_")];
    if(!yd){noYield++;return;}

    // Get rent and price from yield data
    const yResult=getWeightedYield(yd,p.beds,p.unitBreakdown);
    if(!yResult){noYield++;return;}

    // Calculate prices
    const annualRent=yResult.annualRent;
    
    // Project sale price: prefer real transaction PPSF × size, then priceMin, then yieldData avgPrice
    let salePrice=null;
    if(p.ppsf>0&&p.sizeMin>0) salePrice=Math.round(p.ppsf*p.sizeMin);
    else if(p.priceMin>0) salePrice=p.priceMin;
    else if(yResult.avgPrice) salePrice=yResult.avgPrice;

    let grossYield=null,netYield=null,estimatedAnnualRent=null;

    if(yResult.avgGrossYield){
      // Use community avg if no per-bed data
      grossYield=parseFloat(yResult.avgGrossYield.toFixed(1));
      netYield=p.serviceCharge>0&&p.sizeMin>0&&salePrice>0
        ?parseFloat((grossYield-(p.serviceCharge*p.sizeMin/salePrice*100)).toFixed(1))
        :parseFloat((grossYield*0.8).toFixed(1));
    } else if(annualRent&&salePrice){
      grossYield=parseFloat((annualRent/salePrice*100).toFixed(1));
      // Net yield = gross - service charge impact
      const scImpact=p.serviceCharge>0&&p.sizeMin>0
        ?(p.serviceCharge*p.sizeMin/salePrice*100)
        :(grossYield*0.15); // estimate 15% of gross as service charges
      netYield=parseFloat((grossYield-scImpact).toFixed(1));
      estimatedAnnualRent=annualRent;
    }

    if(!grossYield||grossYield<=0||grossYield>30){noYield++;return;}
    if(netYield<0)netYield=parseFloat((grossYield*0.7).toFixed(1));

    const updates={
      grossYield,
      netYield,
      yieldSource:yd.verified?"verified-community":"estimated-community",
      yieldUpdatedAt:new Date().toISOString(),
    };
    if(estimatedAnnualRent) updates.estimatedAnnualRent=estimatedAnnualRent;
    if(salePrice&&!p.priceMin) updates.priceMin=salePrice;

    batch.update(doc.ref,updates);
    bc++;updated++;
    if(bc>=400){
      batch.commit();
      batch=db.batch();bc=0;
      console.log("Committed batch, updated so far:",updated);
    }
  });

  if(bc>0)await batch.commit();

  console.log("\nDone!");
  console.log("Updated with yields:",updated);
  console.log("No community match:",noComm);
  console.log("No yield data:",noYield);
  process.exit(0);
}
main().catch(e=>{console.error(e);process.exit(1);});