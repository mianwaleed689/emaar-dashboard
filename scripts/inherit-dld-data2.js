const admin = require("firebase-admin");
const sa = require("../serviceAccountKey.json");
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

// COMPREHENSIVE PARENT MAP — all 199 DLD communities
// Based on Dubai geography and area knowledge
const PARENT_MAP = {
  // ── AL BARSHA ────────────────────────────────────────────────
  "Al Barsha 1":"Al Barsha","Al Barsha 2":"Al Barsha","Al Barsha 3":"Al Barsha",
  "Al Barsha First":"Al Barsha","Al Barsha Second":"Al Barsha","Al Barsha Third":"Al Barsha",
  "Al Barsha South Fifth":"Al Barsha","Al Barsha South Fourth":"Al Barsha",
  "Al Barshaa South Third":"Al Barsha","Al Thanayah Fourth":"Al Barsha",
  "Al Thanyah Fifth":"Al Barsha","Al Thanyah Third":"Al Barsha",
  "Barsha Heights":"Al Barsha",
  // ── AL QUOZ ──────────────────────────────────────────────────
  "Al Goze Fourth":"Al Quoz","Al Quoz Residential":"Al Quoz",
  // ── DEIRA ────────────────────────────────────────────────────
  "Abu Hail":"Deira","Al Mararr":"Deira","Al Merkadh":"Deira",
  "Al Nahda (Dubai)":"Deira","Al Rigga":"Deira","Al Waheda":"Deira",
  "Hor Al Anz":"Deira","Port Saeed":"Deira","Palm Deira":"Deira",
  "Deira Islands":"Deira",
  // ── BUR DUBAI ────────────────────────────────────────────────
  "Al Bada":"Bur Dubai","Al Raffa":"Bur Dubai","Al Satwa":"Bur Dubai",
  "Al Safa":"Bur Dubai","Zaabeel First":"Bur Dubai","Zaabeel Second":"Bur Dubai",
  "Zabeel":"Bur Dubai","Trade Center 1":"DIFC","Trade Center First":"DIFC",
  "Trade Center Second":"DIFC","Dubai International Financial Center":"DIFC",
  // ── JUMEIRAH ─────────────────────────────────────────────────
  "Jumeirah 1":"Jumeirah","Jumeirah 2":"Jumeirah","Jumeirah 3":"Jumeirah",
  "Jumeirah Second":"Jumeirah","Umm Suqeim 1":"Jumeirah","Umm Suqeim 2":"Jumeirah",
  "Umm Suqeim 3":"Jumeirah","Um Suqaim Third":"Jumeirah","Al Manara":"Jumeirah",
  "Madinat Jumeirah Living":"Jumeirah","Jumeirah Garden City":"Jumeirah",
  "Jumeira Bay":"Palm Jumeirah","Pearl Jumeira":"Jumeirah","La Mer":"La Mer",
  "Port de La Mer":"La Mer",
  // ── PALM JUMEIRAH ────────────────────────────────────────────
  "Palm Jabal Ali":"Palm Jumeirah","Palm Jebel Ali":"Palm Jumeirah",
  // ── DUBAI MARINA ─────────────────────────────────────────────
  "Dubai Harbour":"Dubai Marina","DMCC Master Community":"Jumeirah Lake Towers",
  "DMCC-EZ1":"Jumeirah Lake Towers","DMCC-EZ2":"Jumeirah Lake Towers",
  "Bluewaters Island":"Dubai Marina",
  // ── JBR ──────────────────────────────────────────────────────
  "Jumeirah Beach Residence (JBR)":"Jumeirah Beach Residence",
  // ── BUSINESS BAY ─────────────────────────────────────────────
  "Business Bay Waterfront":"Business Bay","Dubai Water Canal":"Business Bay",
  // ── DOWNTOWN ─────────────────────────────────────────────────
  "Burj Khalifa":"Downtown Dubai","City Walk":"City Walk",
  // ── AL SUFOUH ────────────────────────────────────────────────
  "Sufouh Gardens":"Al Sufouh","TECOM Site B":"Al Sufouh","TECOM Site D":"Al Sufouh",
  "Dubai Science Park":"Al Sufouh","Dubai Studio City":"Dubai Production City",
  "Dubai Media City":"Al Sufouh",
  // ── DUBAI HILLS ESTATE ───────────────────────────────────────
  "DUBAI HILLS - CLUB VILLAS":"Dubai Hills Estate",
  "DUBAI HILLS - FAIRWAY VISTAS":"Dubai Hills Estate",
  "DUBAI HILLS - GOLF GROVE":"Dubai Hills Estate",
  "DUBAI HILLS - GOLF PLACE":"Dubai Hills Estate",
  "DUBAI HILLS - GOLF TERRACES":"Dubai Hills Estate",
  "DUBAI HILLS - MAPLE 1":"Dubai Hills Estate",
  "DUBAI HILLS - MAPLE 3":"Dubai Hills Estate",
  "DUBAI HILLS - PALM HILLS":"Dubai Hills Estate",
  "DUBAI HILLS - PARKWAY VISTAS":"Dubai Hills Estate",
  "DUBAI HILLS - SIDRA 1":"Dubai Hills Estate",
  "DUBAI HILLS - SIDRA 2":"Dubai Hills Estate",
  "DUBAI HILLS - SIDRA 3":"Dubai Hills Estate",
  "HADAEQ SHEIKH MOHAMMED BIN RASHID - DISRICT 7":"Dubai Hills Estate",
  "Hadaeq Sheikh Mohammed Bin Rashid":"Dubai Hills Estate",
  // ── ARABIAN RANCHES ──────────────────────────────────────────
  "Arabian Ranches - Golf Homes":"Arabian Ranches",
  "Arabian Ranches - Polo Homes":"Arabian Ranches",
  "Arabian Ranches 3":"Arabian Ranches III",
  "Arabian Ranches II":"Arabian Ranches",
  "Arabian Ranches II - AZALEA":"Arabian Ranches",
  "Arabian Ranches II - Camelia":"Arabian Ranches",
  "Arabian Ranches II - Dhalia":"Arabian Ranches",
  "Arabian Ranches II - LILA":"Arabian Ranches",
  "Arabian Ranches II - PALMA":"Arabian Ranches",
  "Arabian Ranches II - RASHA":"Arabian Ranches",
  "Arabian Ranches II - ROSA":"Arabian Ranches",
  "Arabian Ranches II - Reem Community":"Arabian Ranches",
  "Arabian Ranches II - SAMARA":"Arabian Ranches",
  "Arabian Ranches II - YASMIN":"Arabian Ranches",
  // ── THE SPRINGS / MEADOWS / LAKES ────────────────────────────
  "Springs - 1":"The Springs","Springs - 2":"The Springs","Springs - 3":"The Springs",
  "Springs - 4":"The Springs","Springs - 5":"The Springs","Springs - 6":"The Springs",
  "Springs - 7":"The Springs","Meadows 2":"The Meadows",
  "Lakes - Deema 1":"The Lakes","Lakes - Deema 2":"The Lakes",
  "Lakes - Deema 3":"The Lakes","Lakes - Deema 4":"The Lakes",
  "Lakes - Ghadeer":"The Lakes","The Greens":"The Springs",
  "The Views":"The Springs",
  // ── MIRDIF ───────────────────────────────────────────────────
  "Al Khawaneej":"Mirdif","Al Mizhar First":"Mirdif","Uptown Mirdif":"Mirdif",
  // ── DUBAI SILICON OASIS ──────────────────────────────────────
  "Liwan1":"Dubai Silicon Oasis","Liwan2":"Dubai Silicon Oasis",
  "Nadd Hessa":"Dubai Silicon Oasis",
  // ── AL JADDAF ────────────────────────────────────────────────
  "Jaddaf Waterfront":"Al Jaddaf","Culture Village (Jaddaf Waterfront)":"Al Jaddaf",
  "Sama Al Jadaf":"Al Jaddaf",
  // ── OUD METHA ────────────────────────────────────────────────
  "Dubai Health Care City Phase 1":"Oud Metha",
  "Dubai Health Care City Phase 2":"Oud Metha",
  // ── DUBAI INVESTMENT PARK ────────────────────────────────────
  "Dubai Investment Park First":"Dubai Investment Park",
  "Dubai Investment Park Second":"Dubai Investment Park",
  "Green Community":"Dubai Investment Park",
  "800 Villas":"Dubai Investment Park",
  // ── DUBAI SOUTH ──────────────────────────────────────────────
  "Dubai South Residential District":"Emaar South",
  "Golf Views (Dubai South)":"Emaar South",
  "The Pulse (Dubai South)":"Emaar South",
  "Dubai World Central":"Emaar South",
  "Down Town Jabal Ali":"Jebel Ali",
  "Jebel Ali":"Jebel Ali","Jebel Ali Village":"Jebel Ali",
  "JABEL ALI HILLS":"Jebel Ali","Saih Shuaib 2":"Emaar South",
  // ── EXPO LIVING ──────────────────────────────────────────────
  "Expo City Dubai":"Expo Living",
  // ── MBR CITY ─────────────────────────────────────────────────
  "District One (MBR City)":"Mohammed Bin Rashid City",
  "Mohammed Bin Rashid AL Maktoum City -District -1 Community":"Mohammed Bin Rashid City",
  "Mohammed Bin Rashid AL Maktoum District 11":"Mohammed Bin Rashid City",
  "Meydan":"Mohammed Bin Rashid City","Meydan City":"Mohammed Bin Rashid City",
  "Meydan One Community":"Mohammed Bin Rashid City",
  "Meydan Racecourse Community":"Mohammed Bin Rashid City",
  "Nad Al Sheba":"Mohammed Bin Rashid City","Nad Al Sheba Gardens":"Mohammed Bin Rashid City",
  "Nad Al Shiba First":"Mohammed Bin Rashid City","Nad Al Shiba Villas":"Mohammed Bin Rashid City",
  "Sobha Hartland 2":"Sobha Hartland","Sobha Reserve":"Sobha Hartland",
  // ── DUBAI CREEK HARBOUR ──────────────────────────────────────
  "Mina Rashid":"Dubai Creek Harbour","Rashid Yachts & Marina":"Dubai Creek Harbour",
  "Dubai Maritime City":"Dubai Creek Harbour",
  // ── VARIOUS ──────────────────────────────────────────────────
  "Jumeirah Islands":"Jumeirah Golf Estates","Jumeirah Park":"Jumeirah Golf Estates",
  "Jumeirah Golf Estates - Phase B":"Jumeirah Golf Estates",
  "DAMAC Lagoons":"DAMAC Hills","Remraam":"DAMAC Hills 2",
  "Villanova":"DAMAC Hills","Rukan":"DAMAC Hills 2","Serena":"DAMAC Hills",
  "Veneto":"DAMAC Hills","Badra":"DAMAC Hills",
  "Al Barari":"Al Barari","THE SUSTAINABLE CITY":"Al Barari",
  "City Of Arabia":"Dubailand","Falcon City":"Dubailand",
  "Living Legends":"Dubailand","Dubai Life Style City":"Dubailand",
  "Dubai Land Residence Complex":"Dubailand",
  "Wadi Al Safa 2":"Dubailand","Wadi Al Safa 3":"Dubailand",
  "Wadi Al Safa 4":"Dubailand","Wadi Al Safa 5":"Dubailand",
  "Wadi Al Safa 6":"Dubailand","Wadi Al Safa 7":"Dubailand",
  "Madinat Badr":"Dubailand","Majan":"Dubailand","Ghadeer Al tair":"Dubailand",
  "Al Yelayiss 1":"Tilal Al Ghaf","Al Yelayiss 2":"Tilal Al Ghaf","Al Yelayiss 4":"Tilal Al Ghaf",
  "Al Yufrah 1":"Tilal Al Ghaf",
  "Grand Polo Club":"Grand Polo Club & Resort",
  "The Heights CW":"The Heights",
  "The Oasis by Emaar":"The Oasis",
  "The Villa":"DAMAC Hills","Mudon":"Mudon",
  "Town Square":"Town Square","Motor City":"Motor City",
  "Dubai Sports City":"Dubai Sports City",
  "Nad Al Hamar":"Mirdif","Al Warqa Third":"Mirdif",
  "Muhaisanah":"Mirdif","Bukadra":"Ras Al Khor",
  "Ras Al Khor Industrial First":"Ras Al Khor",
  "Wasl 1":"Al Wasl","Wasl Gate":"Al Wasl",
  "WARSAN FIRST DEVELOPMENT":"International City",
  "International City Phase 1":"International City",
  "International City Phase 3":"International City",
  "Dubai Islands":"Deira",
  "Dubai South":"Emaar South",
  "Al Safa":"Jumeirah","Arjan":"Arjan",
  "Dubai Production City (IMPZ)":"Dubai Production City",
  "Dubiotech":"Dubai Production City",
  "Dubai Health Care City Phase 1":"Oud Metha",
  "Site A":"Dubai Investment Park",
  "The World":"Dubai Marina",
  "The Palmarosa":"Jumeirah Golf Estates",
  "Jumeirah Second":"Jumeirah",
  "Madinat Badr":"Dubailand",
  "Me'Aisem Second":"Dubai Production City",
};

const APPLY = process.argv.includes("--apply");
console.log(APPLY ? "APPLYING" : "DRY RUN");

async function run() {
  const verifiedSnap = await db.collection("neighbourhoodScores").where("tier","==","verified").get();
  const verifiedMap = {};
  verifiedSnap.docs.forEach(d => {
    verifiedMap[d.data().community.toLowerCase()] = d.data();
  });

  const dldSnap = await db.collection("neighbourhoodScores").where("tier","==","dld-registry").get();
  
  const batch = db.batch();
  let updated = 0;
  let noParent = [];

  function calcScore(u) {
    let score = 40;
    const grossY = parseFloat(u.grossYield||0);
    const distM  = parseFloat(u.distMetro||99);
    const ppsf   = u.avgPpsf||0;
    if(grossY>=9) score+=20; else if(grossY>=8) score+=18; else if(grossY>=7) score+=15; else if(grossY>=6) score+=12; else if(grossY>=5) score+=8;
    if(distM<0.5) score+=12; else if(distM<1) score+=10; else if(distM<2) score+=7; else if(distM<3) score+=5; else if(distM<5) score+=2;
    if(ppsf>=4000) score+=8; else if(ppsf>=3000) score+=7; else if(ppsf>=2000) score+=5; else if(ppsf>=1500) score+=3; else if(ppsf>=1000) score+=1;
    if(u.hasBeach)  score+=8;
    if(u.hasMall)   score+=3;
    if(u.hasSchool) score+=2;
    if(u.hasMetro)  score+=3;
    if(u.goldenVisa)score+=5;
    return Math.min(100, Math.round(score));
  }

  dldSnap.docs.forEach(d => {
    const n = d.data();
    const comm = n.community;
    const parentName = PARENT_MAP[comm];
    const source = parentName ? verifiedMap[parentName.toLowerCase()] : verifiedMap[comm.toLowerCase()];

    if (source) {
      const update = {
        grossYield:      source.grossYield,
        netYield:        source.netYield,
        serviceCharge:   source.serviceCharge,
        supplyRisk:      source.supplyRisk,
        distMetro:       source.distMetro,
        distBeach:       source.distBeach,
        distMall:        source.distMall,
        distSchool:      source.distSchool,
        distHospital:    source.distHospital,
        distAirport:     source.distAirport,
        nearestMetro:    source.nearestMetro,
        hasBeach:        source.hasBeach,
        hasSchool:       source.hasSchool,
        hasMall:         source.hasMall,
        hasMetro:        source.hasMetro,
        goldenVisa:      source.goldenVisa,
        avgPpsf:         n.avgPpsf || source.avgPpsf,
        parentCommunity: parentName || null,
        updatedAt:       new Date().toISOString(),
      };
      update.investmentScore = calcScore(update);
      if(APPLY) batch.update(d.ref, update);
      updated++;
    } else {
      noParent.push(comm);
    }
  });

  console.log("Updated:", updated);
  console.log("Still no parent:", noParent.length);
  if(noParent.length) { console.log("Missing:"); noParent.forEach(c=>console.log(" ",c)); }

  if(APPLY) {
    await batch.commit();
    console.log("Committed");
  }
  process.exit(0);
}
run().catch(e=>{console.error(e);process.exit(1);});