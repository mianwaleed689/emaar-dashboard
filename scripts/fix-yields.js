const admin=require("firebase-admin");
const sa=require("../serviceAccountKey.json");
if(!admin.apps.length)admin.initializeApp({credential:admin.credential.cert(sa)});
const db=admin.firestore();

async function main(){
  const now=new Date().toISOString();
  const batch=db.batch();

  // Fix Al Furjan
  batch.set(db.collection("yieldData").doc("Al_Furjan"),{
    community:"Al Furjan",tier:"midTier",avgGrossYield:8.0,
    yields:{
      "studio":{annualRent:46000,avgPrice:550000,grossYield:8.4,txCount:0},
      "1 B/R":{annualRent:71000,avgPrice:880000,grossYield:8.1,txCount:108},
      "2 B/R":{annualRent:102000,avgPrice:1300000,grossYield:7.8,txCount:88},
      "3 B/R":{annualRent:147000,avgPrice:1950000,grossYield:7.5,txCount:31},
      "4 B/R":{annualRent:193000,avgPrice:2800000,grossYield:6.9,txCount:11}
    },
    source:"Bayut 2025 + Property Finder + DLD Transactions",verified:true,updatedAt:now
  });

  // Add The World communities
  batch.set(db.collection("yieldData").doc("The_World"),{
    community:"The World",tier:"ultra-luxury",avgGrossYield:5.2,
    yields:{
      "2 B/R":{annualRent:180000,avgPrice:3500000,grossYield:5.1,txCount:0},
      "3 B/R":{annualRent:260000,avgPrice:5000000,grossYield:5.2,txCount:0},
      "4 B/R":{annualRent:380000,avgPrice:7200000,grossYield:5.3,txCount:0},
      "5 B/R":{annualRent:520000,avgPrice:10000000,grossYield:5.2,txCount:0}
    },
    source:"Market Benchmark 2025-2026",verified:false,updatedAt:now
  });

  batch.set(db.collection("yieldData").doc("Dubai"),{
    community:"Dubai",tier:"midTier",avgGrossYield:6.5,
    yields:{
      "1 B/R":{annualRent:85000,avgPrice:1300000,grossYield:6.5,txCount:0},
      "2 B/R":{annualRent:125000,avgPrice:1900000,grossYield:6.6,txCount:0},
      "3 B/R":{annualRent:180000,avgPrice:2750000,grossYield:6.5,txCount:0}
    },
    source:"Market Benchmark 2025-2026",verified:false,updatedAt:now
  });

  batch.set(db.collection("yieldData").doc("DAMAC_Lagoons"),{
    community:"DAMAC Lagoons",tier:"midTier",avgGrossYield:6.8,
    yields:{
      "3 B/R":{annualRent:130000,avgPrice:1900000,grossYield:6.8,txCount:0},
      "4 B/R":{annualRent:175000,avgPrice:2600000,grossYield:6.7,txCount:0},
      "5 B/R":{annualRent:240000,avgPrice:3600000,grossYield:6.7,txCount:0}
    },
    source:"Market Benchmark 2025-2026",verified:false,updatedAt:now
  });

  batch.set(db.collection("yieldData").doc("Mohammed_Bin_Rashid_AL_Maktoum_District_11"),{
    community:"Mohammed Bin Rashid AL Maktoum District 11",tier:"premium",avgGrossYield:6.2,
    yields:{
      "3 B/R":{annualRent:170000,avgPrice:2750000,grossYield:6.2,txCount:0},
      "4 B/R":{annualRent:240000,avgPrice:3850000,grossYield:6.2,txCount:0},
      "5 B/R":{annualRent:330000,avgPrice:5300000,grossYield:6.2,txCount:0}
    },
    source:"Market Benchmark 2025-2026",verified:false,updatedAt:now
  });

  await batch.commit();
  console.log("Done - fixed Al Furjan and added missing communities");
  process.exit(0);
}
main().catch(e=>{console.error(e);process.exit(1);});