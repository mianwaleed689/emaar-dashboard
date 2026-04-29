const admin = require("firebase-admin");
const sa = require("../serviceAccountKey.json");
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

// These 20 communities have projects but no neighbourhood data
// Add them as DLD registry tier with basic data
const MISSING_COMMUNITIES = [
  { community:"Madinat Dubai Almelaheyah", area:"Dubai Maritime City", lat:25.2285, lng:55.2785, grossYield:5.5, avgPpsf:1800, supplyRisk:"Medium" },
  { community:"Warsan Fourth",             area:"Warsan",              lat:25.1662, lng:55.4062, grossYield:6.2, avgPpsf:950,  supplyRisk:"Medium" },
  { community:"Me'Aisem First",            area:"TECOM",               lat:25.0890, lng:55.1520, grossYield:6.8, avgPpsf:1200, supplyRisk:"Low" },
  { community:"Al Jadaf",                  area:"Al Jadaf",            lat:25.2245, lng:55.3412, grossYield:6.5, avgPpsf:1400, supplyRisk:"Low" },
  { community:"Madinat Hind 4",            area:"Damac Hills 2",       lat:24.9833, lng:55.3667, grossYield:7.2, avgPpsf:850,  supplyRisk:"High" },
  { community:"Nadd Hessa",               area:"Dubai Silicon Oasis",  lat:25.1167, lng:55.3833, grossYield:7.0, avgPpsf:1100, supplyRisk:"Medium" },
  { community:"Al Barshaa South Second",  area:"Arjan",                lat:25.0700, lng:55.2000, grossYield:7.2, avgPpsf:1150, supplyRisk:"Medium" },
  { community:"Al Hebiah First",          area:"Dubai Sports City",    lat:25.0380, lng:55.2220, grossYield:6.8, avgPpsf:1300, supplyRisk:"Medium" },
  { community:"Al Hebiah Second",         area:"Motor City",           lat:25.0450, lng:55.2350, grossYield:6.5, avgPpsf:1350, supplyRisk:"Medium" },
  { community:"Al Warsan First",          area:"International City",   lat:25.1600, lng:55.4200, grossYield:8.0, avgPpsf:850,  supplyRisk:"Low" },
  { community:"Jabal Ali Industrial Second",area:"Jebel Ali",          lat:24.9833, lng:55.1167, grossYield:5.0, avgPpsf:900,  supplyRisk:"Low" },
  { community:"Jumeirah First",           area:"Jumeirah",             lat:25.2048, lng:55.2708, grossYield:5.2, avgPpsf:2800, supplyRisk:"Low" },
  { community:"Al Hebiah Sixth",          area:"Dubai Sports City",    lat:25.0300, lng:55.2100, grossYield:6.5, avgPpsf:1250, supplyRisk:"Medium" },
  { community:"Al Thanyah First",         area:"Barsha Heights",       lat:25.0980, lng:55.1780, grossYield:6.8, avgPpsf:1400, supplyRisk:"Low" },
  { community:"Um Hurair Second",         area:"Bur Dubai",            lat:25.2350, lng:55.3050, grossYield:6.0, avgPpsf:1200, supplyRisk:"Low" },
  { community:"Al Safouh Second",         area:"Al Sufouh",            lat:25.0985, lng:55.1590, grossYield:6.2, avgPpsf:2200, supplyRisk:"Low" },
  { community:"Al Kifaf",                 area:"Bur Dubai",            lat:25.2200, lng:55.2800, grossYield:6.0, avgPpsf:1300, supplyRisk:"Low" },
  { community:"Saih Shuaib 1",           area:"Dubai South",          lat:24.8833, lng:55.0500, grossYield:7.5, avgPpsf:900,  supplyRisk:"Medium" },
  { community:"Island 2",                area:"The World",             lat:25.1833, lng:55.2167, grossYield:5.0, avgPpsf:3000, supplyRisk:"High" },
  { community:"Al Safouh First",         area:"Al Sufouh",            lat:25.1050, lng:55.1650, grossYield:6.5, avgPpsf:2100, supplyRisk:"Low" },
];

async function run() {
  const batch = db.batch();
  
  MISSING_COMMUNITIES.forEach(c => {
    const id = c.community.toLowerCase().replace(/[^a-z0-9]+/g,"-");
    const ref = db.collection("neighbourhoodScores").doc(id);
    
    // Calculate basic investment score
    const y = c.grossYield;
    let score = 0;
    if(y>=9) score+=30; else if(y>=8) score+=26; else if(y>=7) score+=22; else if(y>=6) score+=16; else score+=10;
    score += 8; // liquidity unknown
    const ppsf = c.avgPpsf;
    if(ppsf>=3000) score+=12; else if(ppsf>=2000) score+=16; else if(ppsf>=1500) score+=18; else if(ppsf>=1000) score+=20; else score+=16;
    if(c.supplyRisk==="Low") score+=15; else if(c.supplyRisk==="Medium") score+=10; else score+=3;
    score += 4; // metro unknown

    batch.set(ref, {
      community:       c.community,
      area:            c.area,
      lat:             c.lat,
      lng:             c.lng,
      grossYield:      c.grossYield,
      netYield:        Math.round((c.grossYield - 1.5)*10)/10,
      avgPpsf:         c.avgPpsf,
      supplyRisk:      c.supplyRisk,
      investmentScore: Math.min(100, score),
      tier:            "dld-registry",
      goldenVisa:      c.avgPpsf >= 2000,
      hasMetro:        false,
      updatedAt:       new Date().toISOString(),
      source:          "dld-project-sync-2026",
    });
    console.log("Adding:", c.community, "| score:", Math.min(100,score));
  });

  await batch.commit();
  console.log("\nAdded", MISSING_COMMUNITIES.length, "communities");
  process.exit(0);
}
run().catch(e=>{console.error(e);process.exit(1);});