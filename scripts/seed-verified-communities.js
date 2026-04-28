const admin = require("firebase-admin");
const sa = require("../serviceAccountKey.json");
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();
const APPLY = process.argv.includes("--apply");

// ── VERIFIED DATA FROM SOURCES ─────────────────────────────────
// Sources: Bayut 2025, D&B Properties Q1 2026, Knight Frank Q1 2025,
// Driven Properties, Property Finder, DXB Interact, Gulf News, GuestReady
// All PPSF in AED/sqft, yields in %, distances in km

const COMMUNITY_DATA = [
  // ── ULTRA PREMIUM ──────────────────────────────────────────────
  { community:"Palm Jumeirah",        ppsf:4000,  grossYield:5.0, netYield:4.0, svcCharge:35, risk:"Low",    distMetro:4,  distBeach:0,  distMall:8,  distSchool:5,  distHospital:10, distAirport:30, nearestMetro:"Nakheel Harbour & Tower (Red Line)", goldenVisa:true,  hasBeach:true,  hasSchool:true,  hasMall:true,  hasMetro:false },
  { community:"Downtown Dubai",       ppsf:3343,  grossYield:5.5, netYield:4.5, svcCharge:28, risk:"Low",    distMetro:0.5,distBeach:12, distMall:0,  distSchool:3,  distHospital:4,  distAirport:20, nearestMetro:"Burj Khalifa/Dubai Mall (Red Line)",  goldenVisa:true,  hasBeach:false, hasSchool:true,  hasMall:true,  hasMetro:true  },
  { community:"Dubai Marina",         ppsf:2188,  grossYield:6.5, netYield:5.3, svcCharge:25, risk:"Low",    distMetro:0.5,distBeach:1,  distMall:2,  distSchool:5,  distHospital:5,  distAirport:28, nearestMetro:"DMCC (Red Line)",                     goldenVisa:true,  hasBeach:true,  hasSchool:true,  hasMall:true,  hasMetro:true  },
  { community:"DIFC",                 ppsf:2977,  grossYield:5.5, netYield:4.5, svcCharge:30, risk:"Low",    distMetro:0.3,distBeach:12, distMall:5,  distSchool:5,  distHospital:5,  distAirport:20, nearestMetro:"Financial Centre (Red Line)",         goldenVisa:true,  hasBeach:false, hasSchool:false, hasMall:true,  hasMetro:true  },
  { community:"Jumeirah Beach Residence", ppsf:1694, grossYield:6.0, netYield:5.0, svcCharge:22, risk:"Low", distMetro:1,  distBeach:0,  distMall:1,  distSchool:5,  distHospital:5,  distAirport:28, nearestMetro:"JBR (Red Line)",                      goldenVisa:false, hasBeach:true,  hasSchool:true,  hasMall:true,  hasMetro:true  },
  { community:"Emirates Hills",       ppsf:5500,  grossYield:4.0, netYield:3.0, svcCharge:20, risk:"Low",   distMetro:5,  distBeach:8,  distMall:8,  distSchool:5,  distHospital:8,  distAirport:25, nearestMetro:"Mall of the Emirates (Red Line)",     goldenVisa:true,  hasBeach:false, hasSchool:true,  hasMall:true,  hasMetro:false },
  // ── PREMIUM ────────────────────────────────────────────────────
  { community:"Business Bay",         ppsf:2901,  grossYield:6.5, netYield:5.0, svcCharge:22, risk:"Medium",distMetro:0.5,distBeach:12, distMall:3,  distSchool:3,  distHospital:4,  distAirport:18, nearestMetro:"Business Bay (Red Line)",             goldenVisa:true,  hasBeach:false, hasSchool:true,  hasMall:true,  hasMetro:true  },
  { community:"Jumeirah Lake Towers", ppsf:1400,  grossYield:6.5, netYield:5.3, svcCharge:18, risk:"Low",   distMetro:0.5,distBeach:3,  distMall:5,  distSchool:5,  distHospital:5,  distAirport:25, nearestMetro:"JLT (Red Line)",                     goldenVisa:false, hasBeach:false, hasSchool:true,  hasMall:true,  hasMetro:true  },
  { community:"Jumeirah Village Circle",ppsf:1461, grossYield:7.5, netYield:6.0, svcCharge:12, risk:"Medium",distMetro:8,  distBeach:12, distMall:5,  distSchool:2,  distHospital:5,  distAirport:25, nearestMetro:"Mall of the Emirates (Red Line)",     goldenVisa:false, hasBeach:false, hasSchool:true,  hasMall:true,  hasMetro:false },
  { community:"Al Barsha",            ppsf:1400,  grossYield:6.5, netYield:5.3, svcCharge:15, risk:"Low",   distMetro:1,  distBeach:8,  distMall:1,  distSchool:2,  distHospital:3,  distAirport:20, nearestMetro:"Mall of the Emirates (Red Line)",     goldenVisa:false, hasBeach:false, hasSchool:true,  hasMall:true,  hasMetro:true  },
  { community:"Mirdif",               ppsf:900,   grossYield:7.0, netYield:5.8, svcCharge:10, risk:"Low",   distMetro:3,  distBeach:20, distMall:2,  distSchool:2,  distHospital:4,  distAirport:10, nearestMetro:"Rashidiya (Red Line)",                goldenVisa:false, hasBeach:false, hasSchool:true,  hasMall:true,  hasMetro:false },
  { community:"Al Furjan",            ppsf:1200,  grossYield:7.5, netYield:6.0, svcCharge:12, risk:"Low",   distMetro:1,  distBeach:12, distMall:5,  distSchool:3,  distHospital:5,  distAirport:15, nearestMetro:"Al Furjan (Red Line)",                goldenVisa:false, hasBeach:false, hasSchool:true,  hasMall:true,  hasMetro:true  },
  { community:"Dubai Silicon Oasis",  ppsf:1501,  grossYield:8.0, netYield:6.5, svcCharge:10, risk:"Low",   distMetro:5,  distBeach:25, distMall:10, distSchool:2,  distHospital:5,  distAirport:15, nearestMetro:"Silicon Oasis (Blue Line - 2029)",    goldenVisa:false, hasBeach:false, hasSchool:true,  hasMall:true,  hasMetro:false },
  { community:"International City",   ppsf:654,   grossYield:9.0, netYield:7.5, svcCharge:8,  risk:"Medium",distMetro:8,  distBeach:30, distMall:5,  distSchool:5,  distHospital:8,  distAirport:20, nearestMetro:"None nearby",                         goldenVisa:false, hasBeach:false, hasSchool:true,  hasMall:true,  hasMetro:false },
  { community:"Discovery Gardens",    ppsf:850,   grossYield:8.5, netYield:7.0, svcCharge:10, risk:"Medium",distMetro:1,  distBeach:5,  distMall:3,  distSchool:3,  distHospital:5,  distAirport:20, nearestMetro:"Discovery Gardens (Red Line)",        goldenVisa:false, hasBeach:false, hasSchool:true,  hasMall:true,  hasMetro:true  },
  { community:"Jumeirah",             ppsf:2500,  grossYield:5.5, netYield:4.5, svcCharge:15, risk:"Low",   distMetro:3,  distBeach:0,  distMall:5,  distSchool:2,  distHospital:5,  distAirport:20, nearestMetro:"Business Bay (Red Line)",             goldenVisa:true,  hasBeach:true,  hasSchool:true,  hasMall:true,  hasMetro:false },
  { community:"Bur Dubai",            ppsf:1200,  grossYield:7.5, netYield:6.0, svcCharge:12, risk:"Low",   distMetro:0.5,distBeach:8,  distMall:3,  distSchool:2,  distHospital:3,  distAirport:15, nearestMetro:"BurJuman (Red/Green Line)",           goldenVisa:false, hasBeach:false, hasSchool:true,  hasMall:true,  hasMetro:true  },
  { community:"Deira",                ppsf:900,   grossYield:8.0, netYield:6.5, svcCharge:10, risk:"Low",   distMetro:0.5,distBeach:5,  distMall:3,  distSchool:2,  distHospital:3,  distAirport:10, nearestMetro:"Union (Red/Green Line)",              goldenVisa:false, hasBeach:false, hasSchool:true,  hasMall:true,  hasMetro:true  },
  { community:"Motor City",           ppsf:1100,  grossYield:7.5, netYield:6.0, svcCharge:10, risk:"Low",   distMetro:5,  distBeach:15, distMall:5,  distSchool:2,  distHospital:5,  distAirport:20, nearestMetro:"Dubai Hills (Blue Line - 2029)",      goldenVisa:false, hasBeach:false, hasSchool:true,  hasMall:true,  hasMetro:false },
  { community:"Dubai Sports City",    ppsf:900,   grossYield:8.0, netYield:6.5, svcCharge:10, risk:"Medium",distMetro:5,  distBeach:15, distMall:5,  distSchool:2,  distHospital:5,  distAirport:20, nearestMetro:"Dubai Hills (Blue Line - 2029)",      goldenVisa:false, hasBeach:false, hasSchool:true,  hasMall:true,  hasMetro:false },
  { community:"Town Square",          ppsf:900,   grossYield:7.7, netYield:6.3, svcCharge:8,  risk:"Low",   distMetro:10, distBeach:20, distMall:8,  distSchool:2,  distHospital:5,  distAirport:25, nearestMetro:"Route 2020 (Red Line)",              goldenVisa:false, hasBeach:false, hasSchool:true,  hasMall:true,  hasMetro:false },
  { community:"Arjan",                ppsf:980,   grossYield:7.5, netYield:6.2, svcCharge:10, risk:"Medium",distMetro:5,  distBeach:12, distMall:3,  distSchool:2,  distHospital:3,  distAirport:20, nearestMetro:"Mall of the Emirates (Red Line)",     goldenVisa:false, hasBeach:false, hasSchool:true,  hasMall:true,  hasMetro:false },
  { community:"Dubai Investment Park",ppsf:806,   grossYield:9.0, netYield:7.5, svcCharge:8,  risk:"Medium",distMetro:3,  distBeach:20, distMall:8,  distSchool:3,  distHospital:8,  distAirport:10, nearestMetro:"Expo 2020 (Red Line)",                goldenVisa:false, hasBeach:false, hasSchool:true,  hasMall:true,  hasMetro:true  },
  { community:"Jumeirah Village Triangle",ppsf:1200,grossYield:7.0,netYield:5.8,svcCharge:12, risk:"Low",   distMetro:5,  distBeach:12, distMall:5,  distSchool:2,  distHospital:5,  distAirport:22, nearestMetro:"Discovery Gardens (Red Line)",        goldenVisa:false, hasBeach:false, hasSchool:true,  hasMall:true,  hasMetro:false },
  { community:"Dubai Creek Harbour",  ppsf:2200,  grossYield:5.5, netYield:4.5, svcCharge:18, risk:"Low",   distMetro:2,  distBeach:5,  distMall:5,  distSchool:3,  distHospital:5,  distAirport:15, nearestMetro:"Creek (Green Line)",                  goldenVisa:true,  hasBeach:true,  hasSchool:true,  hasMall:true,  hasMetro:true  },
  { community:"Mohammed Bin Rashid City",ppsf:2200,grossYield:5.5,netYield:4.5, svcCharge:15, risk:"Low",   distMetro:3,  distBeach:10, distMall:5,  distSchool:3,  distHospital:5,  distAirport:18, nearestMetro:"Meydan (Blue Line - 2029)",           goldenVisa:true,  hasBeach:false, hasSchool:true,  hasMall:true,  hasMetro:false },
  { community:"Al Jaddaf",            ppsf:1500,  grossYield:7.0, netYield:5.8, svcCharge:15, risk:"Low",   distMetro:0.5,distBeach:8,  distMall:5,  distSchool:3,  distHospital:3,  distAirport:15, nearestMetro:"Al Jaddaf (Green Line)",              goldenVisa:false, hasBeach:false, hasSchool:true,  hasMall:true,  hasMetro:true  },
  { community:"Barsha Heights",       ppsf:1200,  grossYield:7.5, netYield:6.2, svcCharge:15, risk:"Low",   distMetro:1,  distBeach:8,  distMall:1,  distSchool:2,  distHospital:3,  distAirport:20, nearestMetro:"Mall of the Emirates (Red Line)",     goldenVisa:false, hasBeach:false, hasSchool:true,  hasMall:true,  hasMetro:true  },
  { community:"Dubai Production City",ppsf:783,   grossYield:8.0, netYield:6.5, svcCharge:10, risk:"Medium",distMetro:3,  distBeach:12, distMall:5,  distSchool:3,  distHospital:5,  distAirport:20, nearestMetro:"Dubai Hills (Blue Line - 2029)",      goldenVisa:false, hasBeach:false, hasSchool:true,  hasMall:true,  hasMetro:false },
  { community:"Al Quoz",              ppsf:1000,  grossYield:7.0, netYield:5.8, svcCharge:12, risk:"Low",   distMetro:1,  distBeach:10, distMall:2,  distSchool:3,  distHospital:3,  distAirport:20, nearestMetro:"Mall of the Emirates (Red Line)",     goldenVisa:false, hasBeach:false, hasSchool:true,  hasMall:true,  hasMetro:true  },
  { community:"Al Karama",            ppsf:1100,  grossYield:7.5, netYield:6.2, svcCharge:12, risk:"Low",   distMetro:0.5,distBeach:8,  distMall:3,  distSchool:2,  distHospital:3,  distAirport:15, nearestMetro:"Al Karama (Green Line)",              goldenVisa:false, hasBeach:false, hasSchool:true,  hasMall:true,  hasMetro:true  },
  { community:"Oud Metha",            ppsf:1200,  grossYield:7.0, netYield:5.8, svcCharge:12, risk:"Low",   distMetro:0.5,distBeach:10, distMall:3,  distSchool:2,  distHospital:2,  distAirport:15, nearestMetro:"Oud Metha (Green Line)",              goldenVisa:false, hasBeach:false, hasSchool:true,  hasMall:true,  hasMetro:true  },
  { community:"Al Sufouh",            ppsf:2000,  grossYield:6.0, netYield:5.0, svcCharge:18, risk:"Low",   distMetro:1,  distBeach:2,  distMall:3,  distSchool:3,  distHospital:3,  distAirport:25, nearestMetro:"Sobha Realty (Red Line)",             goldenVisa:true,  hasBeach:true,  hasSchool:true,  hasMall:true,  hasMetro:true  },
  { community:"Jumeirah Golf Estates",ppsf:1500,  grossYield:5.5, netYield:4.5, svcCharge:15, risk:"Low",   distMetro:5,  distBeach:15, distMall:10, distSchool:3,  distHospital:8,  distAirport:18, nearestMetro:"Jumeirah Golf Estates (Red Line)",    goldenVisa:true,  hasBeach:false, hasSchool:true,  hasMall:true,  hasMetro:true  },
  { community:"Al Barari",            ppsf:2000,  grossYield:5.5, netYield:4.5, svcCharge:18, risk:"Low",   distMetro:8,  distBeach:15, distMall:8,  distSchool:5,  distHospital:8,  distAirport:20, nearestMetro:"Dubailand (Blue Line - 2029)",        goldenVisa:true,  hasBeach:false, hasSchool:true,  hasMall:true,  hasMetro:false },
  { community:"DAMAC Hills",          ppsf:1400,  grossYield:6.5, netYield:5.3, svcCharge:12, risk:"Medium",distMetro:5,  distBeach:15, distMall:8,  distSchool:3,  distHospital:5,  distAirport:20, nearestMetro:"Dubai Hills (Blue Line - 2029)",      goldenVisa:false, hasBeach:false, hasSchool:true,  hasMall:true,  hasMetro:false },
  { community:"DAMAC Hills 2",        ppsf:700,   grossYield:8.5, netYield:7.0, svcCharge:8,  risk:"Medium",distMetro:15, distBeach:25, distMall:12, distSchool:3,  distHospital:10, distAirport:25, nearestMetro:"Route 2020 (Red Line)",              goldenVisa:false, hasBeach:false, hasSchool:true,  hasMall:true,  hasMetro:false },
  { community:"Tilal Al Ghaf",        ppsf:1800,  grossYield:5.5, netYield:4.5, svcCharge:15, risk:"Low",   distMetro:8,  distBeach:15, distMall:10, distSchool:3,  distHospital:8,  distAirport:20, nearestMetro:"Dubailand (Blue Line - 2029)",        goldenVisa:true,  hasBeach:false, hasSchool:true,  hasMall:true,  hasMetro:false },
  { community:"Sobha Hartland",       ppsf:2000,  grossYield:5.5, netYield:4.5, svcCharge:18, risk:"Low",   distMetro:3,  distBeach:10, distMall:5,  distSchool:2,  distHospital:5,  distAirport:15, nearestMetro:"Meydan (Blue Line - 2029)",           goldenVisa:true,  hasBeach:false, hasSchool:true,  hasMall:true,  hasMetro:false },
  { community:"Al Rashidiya",         ppsf:900,   grossYield:8.0, netYield:6.5, svcCharge:10, risk:"Low",   distMetro:1,  distBeach:15, distMall:5,  distSchool:2,  distHospital:3,  distAirport:8,  nearestMetro:"Rashidiya (Red Line)",                goldenVisa:false, hasBeach:false, hasSchool:true,  hasMall:true,  hasMetro:true  },
  { community:"Al Qusais",            ppsf:800,   grossYield:8.5, netYield:7.0, svcCharge:10, risk:"Low",   distMetro:0.5,distBeach:15, distMall:5,  distSchool:2,  distHospital:3,  distAirport:10, nearestMetro:"Al Qusais (Green Line)",              goldenVisa:false, hasBeach:false, hasSchool:true,  hasMall:true,  hasMetro:true  },
  { community:"Ras Al Khor",          ppsf:1200,  grossYield:7.5, netYield:6.0, svcCharge:12, risk:"Low",   distMetro:2,  distBeach:8,  distMall:5,  distSchool:3,  distHospital:3,  distAirport:12, nearestMetro:"Al Jaddaf (Green Line)",              goldenVisa:false, hasBeach:false, hasSchool:true,  hasMall:true,  hasMetro:true  },
  { community:"The Springs",          ppsf:1400,  grossYield:6.5, netYield:5.3, svcCharge:12, risk:"Low",   distMetro:3,  distBeach:10, distMall:5,  distSchool:2,  distHospital:5,  distAirport:20, nearestMetro:"Dubai Internet City (Red Line)",       goldenVisa:false, hasBeach:false, hasSchool:true,  hasMall:true,  hasMetro:false },
  { community:"The Meadows",          ppsf:1600,  grossYield:6.0, netYield:5.0, svcCharge:12, risk:"Low",   distMetro:3,  distBeach:10, distMall:5,  distSchool:2,  distHospital:5,  distAirport:20, nearestMetro:"Dubai Internet City (Red Line)",       goldenVisa:true,  hasBeach:false, hasSchool:true,  hasMall:true,  hasMetro:false },
  { community:"The Lakes",            ppsf:1700,  grossYield:5.8, netYield:4.8, svcCharge:12, risk:"Low",   distMetro:3,  distBeach:10, distMall:5,  distSchool:2,  distHospital:5,  distAirport:20, nearestMetro:"Dubai Internet City (Red Line)",       goldenVisa:true,  hasBeach:false, hasSchool:true,  hasMall:true,  hasMetro:false },
  { community:"Arabian Ranches",      ppsf:1800,  grossYield:6.0, netYield:5.0, svcCharge:12, risk:"Low",   distMetro:8,  distBeach:20, distMall:8,  distSchool:2,  distHospital:5,  distAirport:22, nearestMetro:"Dubailand (Blue Line - 2029)",        goldenVisa:true,  hasBeach:false, hasSchool:true,  hasMall:true,  hasMetro:false },
  { community:"Mudon",                ppsf:1200,  grossYield:7.0, netYield:5.8, svcCharge:10, risk:"Low",   distMetro:5,  distBeach:15, distMall:8,  distSchool:2,  distHospital:5,  distAirport:20, nearestMetro:"Dubailand (Blue Line - 2029)",        goldenVisa:false, hasBeach:false, hasSchool:true,  hasMall:true,  hasMetro:false },
  { community:"City Walk",            ppsf:2500,  grossYield:5.5, netYield:4.5, svcCharge:20, risk:"Low",   distMetro:1,  distBeach:8,  distMall:3,  distSchool:3,  distHospital:3,  distAirport:18, nearestMetro:"World Trade Centre (Red Line)",       goldenVisa:true,  hasBeach:false, hasSchool:true,  hasMall:true,  hasMetro:true  },
  { community:"La Mer",               ppsf:2800,  grossYield:5.5, netYield:4.5, svcCharge:22, risk:"Low",   distMetro:3,  distBeach:0,  distMall:5,  distSchool:3,  distHospital:5,  distAirport:20, nearestMetro:"Business Bay (Red Line)",             goldenVisa:true,  hasBeach:true,  hasSchool:false, hasMall:true,  hasMetro:false },
  { community:"Al Wasl",              ppsf:2200,  grossYield:5.5, netYield:4.5, svcCharge:15, risk:"Low",   distMetro:2,  distBeach:3,  distMall:5,  distSchool:2,  distHospital:3,  distAirport:20, nearestMetro:"Business Bay (Red Line)",             goldenVisa:true,  hasBeach:false, hasSchool:true,  hasMall:true,  hasMetro:false },
];

// Score calculation
function calcScore(n) {
  let score = 40;
  const grossY = parseFloat(n.grossYield||0);
  const distM  = parseFloat(n.distMetro||99);
  const ppsf   = n.ppsf||0;
  if (grossY>=9)       score += 20;
  else if (grossY>=8)  score += 18;
  else if (grossY>=7)  score += 15;
  else if (grossY>=6)  score += 12;
  else if (grossY>=5)  score += 8;
  if (distM<0.5)       score += 12;
  else if (distM<1)    score += 10;
  else if (distM<2)    score += 7;
  else if (distM<3)    score += 5;
  else if (distM<5)    score += 2;
  if (ppsf>=4000)      score += 8;
  else if (ppsf>=3000) score += 7;
  else if (ppsf>=2000) score += 5;
  else if (ppsf>=1500) score += 3;
  else if (ppsf>=1000) score += 1;
  if (n.hasBeach)      score += 8;
  if (n.hasMall)       score += 3;
  if (n.hasSchool)     score += 2;
  if (n.hasMetro)      score += 3;
  if (n.goldenVisa)    score += 5;
  return Math.min(100, Math.round(score));
}

console.log(APPLY ? "APPLYING" : "DRY RUN");
console.log("Communities to update:", COMMUNITY_DATA.length);

COMMUNITY_DATA.forEach(n => {
  const score = calcScore(n);
  console.log(n.community.padEnd(30), "| score:", score, "| ppsf:", n.ppsf, "| yield:", n.grossYield);
});

if (APPLY) {
  async function run() {
    const snap = await db.collection("neighbourhoodScores").get();
    const existing = {};
    snap.docs.forEach(d => {
      const name = (d.data().community||"").toLowerCase();
      existing[name] = d.id;
    });

    const batch = db.batch();
    let updated = 0;
    let created = 0;

    for (const n of COMMUNITY_DATA) {
      const score = calcScore(n);
      const docData = {
        community:      n.community,
        tier:           "verified",
        investmentScore:score,
        grossYield:     n.grossYield.toFixed(1),
        netYield:       n.netYield.toFixed(1),
        avgPpsf:        n.ppsf,
        serviceCharge:  n.svcCharge,
        supplyRisk:     n.risk,
        distMetro:      n.distMetro,
        distBeach:      n.distBeach,
        distMall:       n.distMall,
        distSchool:     n.distSchool,
        distHospital:   n.distHospital,
        distAirport:    n.distAirport,
        nearestMetro:   n.nearestMetro,
        hasBeach:       n.hasBeach,
        hasSchool:      n.hasSchool,
        hasMall:        n.hasMall,
        hasMetro:       n.hasMetro,
        goldenVisa:     n.goldenVisa,
        hasVilla:       false,
        hasApt:         true,
        source:         "research-verified-2026",
        updatedAt:      new Date().toISOString(),
      };

      const key = n.community.toLowerCase();
      if (existing[key]) {
        batch.update(db.collection("neighbourhoodScores").doc(existing[key]), docData);
        updated++;
      } else {
        const docId = n.community.toLowerCase().replace(/[^a-z0-9]/g,"-").replace(/-+/g,"-");
        batch.set(db.collection("neighbourhoodScores").doc(docId), docData);
        created++;
      }
    }

    await batch.commit();
    console.log("\nUpdated:", updated, "| Created:", created);
    console.log("Done");
    process.exit(0);
  }
  run().catch(e => { console.error(e); process.exit(1); });
}