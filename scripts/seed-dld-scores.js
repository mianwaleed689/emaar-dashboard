const admin = require("firebase-admin");
const sa = require("../serviceAccountKey.json");
const fs = require("fs");
const path = require("path");
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

const dataPath = path.join(__dirname, "../data/dld-area-stats.json");
const dldData = JSON.parse(fs.readFileSync(dataPath, "utf8"));
console.log("DLD areas loaded:", Object.keys(dldData).length);

function normalize(s) {
  return (s||"").toLowerCase().replace(/[^a-z0-9 ]/g,"").replace(/\s+/g," ").trim();
}

const dldLookup = {};
Object.entries(dldData).forEach(([area, stats]) => {
  dldLookup[normalize(area)] = { area, ...stats };
});

const MANUAL_MAP = {
  "jumeirah village circle":   "JUMEIRAH VILLAGE CIRCLE",
  "business bay":              "BUSINESS BAY",
  "dubai marina":              "DUBAI MARINA",
  "downtown dubai":            "BURJ KHALIFA",
  "palm jumeirah":             "PALM JUMEIRAH",
  "dubai hills estate":        "HADAEQ SHEIKH MOHAMMED BIN RASHID",
  "jumeirah lake towers":      "JUMEIRAH LAKES TOWERS",
  "dubai silicon oasis":       "DUBAI SILICON OASIS",
  "international city":        "INTERNATIONAL CITY PH 2 & 3",
  "al barsha":                 "AL BARSHA FIRST",
  "al furjan":                 "AL FURJAN",
  "discovery gardens":         "DISCOVERY GARDENS",
  "jumeirah village triangle": "JUMEIRAH VILLAGE TRIANGLE",
  "motor city":                "MOTOR CITY",
  "dubai sports city":         "DUBAI SPORTS CITY",
  "arjan":                     "ARJAN",
  "town square":               "TOWN SQUARE",
  "dubai production city":     "DUBAI PRODUCTION CITY",
  "mirdif":                    "MIRDIF",
  "deira":                     "AL RIGGA",
  "bur dubai":                 "AL KARAMA",
  "al karama":                 "AL KARAMA",
  "jumeirah":                  "JUMEIRAH FIRST",
  "al jaddaf":                 "AL JADDAF",
  "barsha heights":            "BARSHA HEIGHTS TECOM",
  "dubai investment park":     "DUBAI INVESTMENT PARK SECOND",
  "damac hills":               "DAMAC HILLS",
  "damac hills 2":             "DAMAC HILLS 2",
  "sobha hartland":            "SOBHA HARTLAND",
  "dubai creek harbour":       "DUBAI CREEK HARBOUR",
  "mohammed bin rashid city":  "MEYDAN",
  "emaar south":               "MADINAT AL MATAAR",
  "expo living":               "MADINAT AL MATAAR",
  "expo city dubai":           "MADINAT AL MATAAR",
  "jebel ali":                 "JABAL ALI FIRST",
  "jumeirah beach residence":  "JUMEIRAH BEACH RESIDENCE",
  "jumeirah beach residence jbr": "JUMEIRAH BEACH RESIDENCE",
  "palm deira":                "PALM DEIRA",
  "dubai harbour":             "DUBAI HARBOUR",
  "bluewaters island":         "BLUEWATERS ISLAND",
  "al sufouh":                 "AL SUFOUH SECOND",
  "city walk":                 "AL WASL",
  "la mer":                    "JUMEIRAH FIRST",
  "the world":                 "PALM JUMEIRAH",
  "wadi al safa 5":            "WADI AL SAFA 5",
  "wadi al safa 2":            "WADI AL SAFA 2",
  "dubailand":                 "DUBAI LAND RESIDENCE COMPLEX",
  "majan":                     "MAJAN",
  "liwan1":                    "LIWAN",
  "liwan2":                    "LIWAN",
  "al rigga":                  "AL RIGGA",
  "port saeed":                "PORT SAEED",
  "al qusais":                 "AL QUSAIS FIRST",
  "al rashidiya":              "AL RASHIDIYA",
  "ras al khor":               "RAS AL KHOR INDUSTRIAL FIRST",
  "difc":                      "BURJ KHALIFA",
  "al wasl":                   "AL WASL",
  "al quoz":                   "AL QUOZ INDUSTRIAL FIRST",
  "al barari":                 "WADI AL SAFA 5",
  "tilal al ghaf":             "WADI AL SAFA 5",
  "the springs":               "THE SPRINGS",
  "the meadows":               "MEADOWS",
  "the lakes":                 "THE LAKES",
  "arabian ranches":           "ARABIAN RANCHES",
  "mudon":                     "MUDON",
  "jumeirah golf estates":     "JUMEIRAH GOLF ESTATES",
  "al barsha 1":               "AL BARSHA FIRST",
  "al barsha 2":               "AL BARSHA SECOND",
  "al barsha 3":               "AL BARSHA THIRD",
};

function getLiquidity(txns) {
  if(txns>=3000) return "Very High";
  if(txns>=1000) return "High";
  if(txns>=500)  return "Medium";
  if(txns>=100)  return "Low";
  return "Very Low";
}

function calcRealScore(n, dld) {
  let score = 0;
  const y = parseFloat(n.grossYield||0);
  if(y>=9) score+=30; else if(y>=8) score+=26; else if(y>=7) score+=22; else if(y>=6) score+=16; else if(y>=5) score+=10; else score+=5;
  const txns = dld?.txns||0;
  if(txns>=3000) score+=25; else if(txns>=1000) score+=20; else if(txns>=500) score+=14; else if(txns>=200) score+=8; else if(txns>=50) score+=4;
  const ppsf = dld?.ppsf||n.avgPpsf||0;
  if(ppsf>=3000) score+=12; else if(ppsf>=2000) score+=16; else if(ppsf>=1500) score+=18; else if(ppsf>=1000) score+=20; else if(ppsf>=700) score+=16; else score+=8;
  const risk = n.supplyRisk||"Unknown";
  if(risk==="Low") score+=15; else if(risk==="Medium") score+=10; else if(risk==="High") score+=3; else score+=7;
  const distM = parseFloat(n.distMetro||99);
  if(distM<0.5) score+=10; else if(distM<1) score+=8; else if(distM<2) score+=6; else if(distM<3) score+=4; else if(distM<5) score+=2;
  return Math.min(100, Math.round(score));
}

async function run() {
  const snap = await db.collection("neighbourhoodScores").get();
  const docs = snap.docs;
  let matched=0, unmatched=0;

  const allUpdates = docs.map(d => {
    const n = d.data();
    const normComm = normalize(n.community);
    let dldKey = MANUAL_MAP[normComm];
    let dld = dldKey ? dldData[dldKey] : null;
    if(!dld) { const r = dldLookup[normComm]; if(r) { dld=r; dldKey=r.area; } }
    if(!dld) {
      const pk = Object.keys(dldLookup).find(k=>k.includes(normComm)||normComm.includes(k));
      if(pk) { dld=dldLookup[pk]; dldKey=dld.area; }
    }
    if(dld) matched++; else unmatched++;
    const newScore = calcRealScore(n, dld);
    return {
      ref: d.ref,
      updates: {
        investmentScore:  newScore,
        dldTransactions:  dld?.txns||null,
        dldPpsf:          dld?.ppsf||null,
        dldOffplanPct:    dld?.offplanPct||null,
        dldAvgValue:      dld?.avgValue||null,
        liquidity:        getLiquidity(dld?.txns||0),
        dldAreaName:      dldKey||null,
        scoreSource:      "dld-real-data-2026",
        avgPpsf:          (dld?.ppsf&&dld.ppsf>0&&Math.abs(dld.ppsf-(n.avgPpsf||0))<2000)?dld.ppsf:n.avgPpsf,
        updatedAt:        new Date().toISOString(),
      }
    };
  });

  // Commit in batches of 400
  for(let i=0;i<allUpdates.length;i+=400) {
    const batch = db.batch();
    allUpdates.slice(i,i+400).forEach(({ref,updates})=>batch.update(ref,updates));
    await batch.commit();
    console.log(`Batch ${Math.floor(i/400)+1} committed`);
  }

  console.log("\nMatched to DLD:", matched, "| No match:", unmatched);
  
  // Show top 10 scored
  const scored = allUpdates.sort((a,b)=>b.updates.investmentScore-a.updates.investmentScore).slice(0,10);
  console.log("\nTop 10 by real DLD score:");
  scored.forEach(({ref,updates})=>console.log(" score:",updates.investmentScore,"| txns:",updates.dldTransactions,"| ppsf:",updates.dldPpsf));
  
  process.exit(0);
}
run().catch(e=>{console.error(e);process.exit(1);});