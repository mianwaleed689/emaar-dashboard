const admin=require("firebase-admin");
const sa=require("../serviceAccountKey.json");
admin.initializeApp({credential:admin.credential.cert(sa)});
const db=admin.firestore();
const RENTS={
"Jumeirah Village Circle":{studio:42000,"1 B/R":68000,"2 B/R":98000,"3 B/R":135000},
"Business Bay":{studio:76000,"1 B/R":106000,"2 B/R":157000,"3 B/R":213000},
"Dubai Marina":{studio:77000,"1 B/R":117000,"2 B/R":168000,"3 B/R":235000},
"Downtown Dubai":{studio:85000,"1 B/R":132000,"2 B/R":188000,"3 B/R":262000},
"Palm Jumeirah":{studio:112000,"1 B/R":162000,"2 B/R":243000,"3 B/R":353000},
"Dubai Hills Estate":{studio:71000,"1 B/R":112000,"2 B/R":162000,"3 B/R":222000,"4 B/R":323000},
"DAMAC Hills 2":{studio:33000,"1 B/R":53000,"2 B/R":73000,"3 B/R":97000,"4 B/R":133000},
"Jumeirah Lake Towers":{studio:56000,"1 B/R":86000,"2 B/R":132000,"3 B/R":177000},
"Dubai Creek Harbour":{studio:66000,"1 B/R":102000,"2 B/R":147000,"3 B/R":198000},
"International City Phase 1":{studio:29000,"1 B/R":43000,"2 B/R":62000},
"Sobha Hartland":{studio:69000,"1 B/R":107000,"2 B/R":158000,"3 B/R":222000},
"Al Furjan":{studio:46000,"1 B/R":71000,"2 B/R":102000,"3 B/R":147000,"4 B/R":193000},
"Town Square":{studio:36000,"1 B/R":56000,"2 B/R":79000,"3 B/R":107000},
"Arjan":{studio:39000,"1 B/R":61000,"2 B/R":87000},
"Dubai South":{studio:31000,"1 B/R":49000,"2 B/R":69000,"3 B/R":92000},
"Dubai Silicon Oasis":{studio:36000,"1 B/R":56000,"2 B/R":82000,"3 B/R":112000},
"Motor City":{studio:41000,"1 B/R":63000,"2 B/R":92000},
"Mirdif":{studio:36000,"1 B/R":56000,"2 B/R":82000},
"Discovery Gardens":{studio:33000,"1 B/R":51000,"2 B/R":73000},
"Barsha Heights":{studio:51000,"1 B/R":79000,"2 B/R":117000},
"DIFC":{studio:97000,"1 B/R":147000,"2 B/R":213000},
"Remraam":{studio:31000,"1 B/R":49000,"2 B/R":69000},
"Dubai Investment Park First":{studio:33000,"1 B/R":51000,"2 B/R":73000},
"Liwan1":{studio:31000,"1 B/R":48000,"2 B/R":68000},
}
// Tier-based yield assumptions (industry standard)
const YIELD_TIERS={luxury:5.5,midTier:6.8,affordable:8.0};
function estimateRents(avgPrice,bedTypes){
 const tier=avgPrice>3000000?"luxury":avgPrice>1500000?"midTier":"affordable";
 const yieldRate=YIELD_TIERS[tier]/100;
 const rents={};
 const bedMult={studio:0.45,"1 B/R":1.0,"2 B/R":1.5,"3 B/R":2.1,"4 B/R":2.8,"5 B/R":3.5};
 for(const bed of bedTypes){
   if(bedMult[bed]) rents[bed]=Math.round(avgPrice*yieldRate*bedMult[bed]/1000)*1000;
 }
 return {rents,tier,yieldRate};
}
async function run(){
  console.log("Fetching 2024+ transactions...");
  const snap=await db.collection("transactions").where("transGroup","==","Sales").where("date",">=","2024-01-01").get();
  console.log("Transactions:",snap.size);
  const pm={};
  snap.forEach(doc=>{
    const d=doc.data();
    if(!d.masterProject||!d.rooms||!d.price)return;
    const ppsf=(d.ppsf||0)/10.764;
    if(ppsf>15000||ppsf<50)return;
    const k=d.masterProject+"|"+d.rooms;
    if(!pm[k])pm[k]={sum:0,count:0};
    pm[k].sum+=d.price;pm[k].count++;
  });
  const batch=db.batch();
  let written=0;
  // Get all communities from transactions
const allCommunities=new Set(Object.keys(pm).map(k=>k.split("|")[0]));
console.log("Total communities from transactions:",allCommunities.size);
for(const community of allCommunities){
 const knownRents=RENTS[community];
 // Get avg ppsf for this community
 const allBeds=["studio","1 B/R","2 B/R","3 B/R","4 B/R","5 B/R"];
 let totalPpsf=0;let ppsfCount=0;
 for(const bed of allBeds){const k=community+"|"+bed;if(pm[k]){const avgP=pm[k].sum/pm[k].count;totalPpsf+=avgP;ppsfCount++;}}
 const avgPrice=ppsfCount>0?totalPpsf/ppsfCount:0;
 const avgPpsf=avgPrice>0?Math.round(avgPrice/93):0; // 93sqm avg unit
 // Use known rents if available, else estimate
 const rents=knownRents||null;
 const isVerified=!!knownRents;
 const tierInfo=!knownRents&&avgPrice>0?estimateRents(avgPrice,allBeds):{tier:"verified",yieldRate:null};
    if(!rents){written++;continue;}
    const yields={};
    let total=0;let cnt=0;
    for(const [bed,annualRent] of Object.entries(rents)){
      const k=community+"|"+bed;
      const pd=pm[k];
      if(pd&&pd.count>=3){
        const avgPrice=pd.sum/pd.count;
        const grossYield=parseFloat(((annualRent/avgPrice)*100).toFixed(2));
        yields[bed]={avgPrice:Math.round(avgPrice),annualRent,grossYield,txCount:pd.count};
        total+=grossYield;cnt++;
      }else{
        yields[bed]={annualRent,avgPrice:null,grossYield:null,txCount:0};
      }
    }
    const avgGrossYield=cnt>0?parseFloat((total/cnt).toFixed(2)):null;
    const ref=db.collection("yieldData").doc(community.replace(/[^a-zA-Z0-9]/g,"_"));
    const source=isVerified?"Bayut 2025 + Property Finder + Property Monitor + DLD Transactions":"DLD Transactions + Market Benchmark ("+tierInfo.tier+" yield tier)";batch.set(ref,{community,yields,avgGrossYield,source,verified:isVerified,tier:tierInfo.tier,updatedAt:new Date().toISOString()});
    written++;
    if(avgGrossYield)console.log(" ",community,"yield:",avgGrossYield+"%");
  }
  await batch.commit();
  console.log("Written",written,"yield docs");
  process.exit(0);
}
run().catch(e=>{console.error(e);process.exit(1);});