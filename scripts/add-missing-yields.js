const admin=require("firebase-admin");
const sa=require("../serviceAccountKey.json");
if(!admin.apps.length)admin.initializeApp({credential:admin.credential.cert(sa)});
const db=admin.firestore();

const MISSING_COMMUNITIES=[
  {community:"Dubai Investment Park",tier:"affordable",avgGrossYield:7.8,yields:{"studio":{annualRent:38000,avgPrice:480000,grossYield:7.9},"1 B/R":{annualRent:55000,avgPrice:720000,grossYield:7.6},"2 B/R":{annualRent:78000,avgPrice:1050000,grossYield:7.4},"3 B/R":{annualRent:105000,avgPrice:1400000,grossYield:7.5}}},
  {community:"Ras Al Khor",tier:"affordable",avgGrossYield:7.2,yields:{"1 B/R":{annualRent:52000,avgPrice:720000,grossYield:7.2},"2 B/R":{annualRent:75000,avgPrice:1050000,grossYield:7.1},"3 B/R":{annualRent:105000,avgPrice:1500000,grossYield:7.0}}},
  {community:"Dubailand",tier:"affordable",avgGrossYield:7.5,yields:{"studio":{annualRent:35000,avgPrice:450000,grossYield:7.8},"1 B/R":{annualRent:52000,avgPrice:700000,grossYield:7.4},"2 B/R":{annualRent:72000,avgPrice:980000,grossYield:7.3},"3 B/R":{annualRent:95000,avgPrice:1300000,grossYield:7.3}}},
  {community:"Dubai South Residential District",tier:"affordable",avgGrossYield:8.2,yields:{"studio":{annualRent:38000,avgPrice:450000,grossYield:8.4},"1 B/R":{annualRent:55000,avgPrice:680000,grossYield:8.1},"2 B/R":{annualRent:78000,avgPrice:960000,grossYield:8.1},"3 B/R":{annualRent:105000,avgPrice:1300000,grossYield:8.1}}},
  {community:"Palm Jabal Ali",tier:"luxury",avgGrossYield:5.8,yields:{"3 B/R":{annualRent:280000,avgPrice:4800000,grossYield:5.8},"4 B/R":{annualRent:380000,avgPrice:6500000,grossYield:5.8},"5 B/R":{annualRent:500000,avgPrice:8500000,grossYield:5.9}}},
  {community:"Madinat Al Mataar",tier:"affordable",avgGrossYield:7.8,yields:{"studio":{annualRent:36000,avgPrice:450000,grossYield:8.0},"1 B/R":{annualRent:52000,avgPrice:680000,grossYield:7.6},"2 B/R":{annualRent:75000,avgPrice:980000,grossYield:7.7},"3 B/R":{annualRent:100000,avgPrice:1350000,grossYield:7.4}}},
  {community:"Emaar South",tier:"midTier",avgGrossYield:7.2,yields:{"1 B/R":{annualRent:55000,avgPrice:780000,grossYield:7.1},"2 B/R":{annualRent:78000,avgPrice:1100000,grossYield:7.1},"3 B/R":{annualRent:120000,avgPrice:1700000,grossYield:7.1},"4 B/R":{annualRent:180000,avgPrice:2500000,grossYield:7.2}}},
  {community:"Tilal Al Ghaf",tier:"premium",avgGrossYield:6.2,yields:{"3 B/R":{annualRent:165000,avgPrice:2700000,grossYield:6.1},"4 B/R":{annualRent:220000,avgPrice:3600000,grossYield:6.1},"5 B/R":{annualRent:300000,avgPrice:4800000,grossYield:6.3}}},
  {community:"Dubai Harbour",tier:"luxury",avgGrossYield:5.5,yields:{"1 B/R":{annualRent:120000,avgPrice:2200000,grossYield:5.5},"2 B/R":{annualRent:175000,avgPrice:3200000,grossYield:5.5},"3 B/R":{annualRent:250000,avgPrice:4500000,grossYield:5.6}}},
  {community:"Wadi Al Safa 3",tier:"affordable",avgGrossYield:7.4,yields:{"studio":{annualRent:33000,avgPrice:430000,grossYield:7.7},"1 B/R":{annualRent:48000,avgPrice:660000,grossYield:7.3},"2 B/R":{annualRent:68000,avgPrice:940000,grossYield:7.2}}},
  {community:"Dubai Islands",tier:"midTier",avgGrossYield:7.0,yields:{"1 B/R":{annualRent:85000,avgPrice:1200000,grossYield:7.1},"2 B/R":{annualRent:120000,avgPrice:1750000,grossYield:6.9},"3 B/R":{annualRent:170000,avgPrice:2500000,grossYield:6.8}}},
  {community:"Al Yelayiss 1",tier:"affordable",avgGrossYield:7.0,yields:{"1 B/R":{annualRent:48000,avgPrice:680000,grossYield:7.1},"2 B/R":{annualRent:70000,avgPrice:1000000,grossYield:7.0},"3 B/R":{annualRent:95000,avgPrice:1380000,grossYield:6.9}}},
  {community:"The World Islands",tier:"luxury",avgGrossYield:5.2,yields:{"2 B/R":{annualRent:180000,avgPrice:3500000,grossYield:5.1},"3 B/R":{annualRent:260000,avgPrice:5000000,grossYield:5.2},"4 B/R":{annualRent:380000,avgPrice:7200000,grossYield:5.3}}},
  {community:"Jumeirah",tier:"premium",avgGrossYield:5.8,yields:{"1 B/R":{annualRent:95000,avgPrice:1600000,grossYield:5.9},"2 B/R":{annualRent:140000,avgPrice:2400000,grossYield:5.8},"3 B/R":{annualRent:200000,avgPrice:3500000,grossYield:5.7},"4 B/R":{annualRent:280000,avgPrice:4800000,grossYield:5.8}}},
  {community:"Jumeirah Lakes Towers",tier:"midTier",avgGrossYield:7.8,yields:{"studio":{annualRent:52000,avgPrice:650000,grossYield:8.0},"1 B/R":{annualRent:75000,avgPrice:960000,grossYield:7.8},"2 B/R":{annualRent:108000,avgPrice:1400000,grossYield:7.7},"3 B/R":{annualRent:150000,avgPrice:1950000,grossYield:7.7}}},
  {community:"Nad Al Shiba First",tier:"midTier",avgGrossYield:6.8,yields:{"3 B/R":{annualRent:150000,avgPrice:2200000,grossYield:6.8},"4 B/R":{annualRent:200000,avgPrice:3000000,grossYield:6.7},"5 B/R":{annualRent:270000,avgPrice:4000000,grossYield:6.8}}},
  {community:"Dubai Production City",tier:"affordable",avgGrossYield:8.0,yields:{"studio":{annualRent:40000,avgPrice:490000,grossYield:8.2},"1 B/R":{annualRent:58000,avgPrice:720000,grossYield:8.1},"2 B/R":{annualRent:82000,avgPrice:1030000,grossYield:8.0},"3 B/R":{annualRent:110000,avgPrice:1380000,grossYield:8.0}}},
  {community:"Jabal Ali First",tier:"affordable",avgGrossYield:7.5,yields:{"1 B/R":{annualRent:48000,avgPrice:640000,grossYield:7.5},"2 B/R":{annualRent:68000,avgPrice:920000,grossYield:7.4},"3 B/R":{annualRent:95000,avgPrice:1280000,grossYield:7.4}}},
  {community:"Liwan",tier:"affordable",avgGrossYield:7.8,yields:{"studio":{annualRent:32000,avgPrice:400000,grossYield:8.0},"1 B/R":{annualRent:46000,avgPrice:590000,grossYield:7.8},"2 B/R":{annualRent:65000,avgPrice:840000,grossYield:7.7}}},
  {community:"Wadi Al Safa 5",tier:"affordable",avgGrossYield:7.4,yields:{"studio":{annualRent:33000,avgPrice:440000,grossYield:7.5},"1 B/R":{annualRent:48000,avgPrice:660000,grossYield:7.3},"2 B/R":{annualRent:68000,avgPrice:940000,grossYield:7.2}}},
];

async function main(){
  const batch=db.batch();
  const now=new Date().toISOString();
  MISSING_COMMUNITIES.forEach(c=>{
    const id=c.community.replace(/\s+/g,"_");
    const ref=db.collection("yieldData").doc(id);
    Object.values(c.yields).forEach(y=>{if(y.annualRent&&y.avgPrice)y.txCount=0;});
    batch.set(ref,{...c,source:"Market Benchmark 2025-2026",verified:false,updatedAt:now});
  });
  await batch.commit();
  console.log("Added",MISSING_COMMUNITIES.length,"communities to yieldData");
  process.exit(0);
}
main().catch(e=>{console.error(e);process.exit(1);});