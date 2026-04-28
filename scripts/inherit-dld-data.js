const admin = require("firebase-admin");
const sa = require("../serviceAccountKey.json");
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

// Parent mapping — sub-communities inherit from parent
// Based on Dubai area knowledge
const PARENT_MAP = {
  // Al Barsha sub-areas
  "Al Barsha 1":          "Al Barsha",
  "Al Barsha 2":          "Al Barsha",
  "Al Barsha 3":          "Al Barsha",
  "Al Barsha First":      "Al Barsha",
  "Al Barsha Second":     "Al Barsha",
  "Al Barsha Third":      "Al Barsha",
  "Al Barsha South Fifth":"Al Barsha",
  "Al Barsha South Fourth":"Al Barsha",
  "Al Barshaa South Third":"Al Barsha",
  // Al Quoz sub-areas
  "Al Goze Fourth":       "Al Quoz",
  "Al Quoz Residential":  "Al Quoz",
  "Al Quoz First":        "Al Quoz",
  "Al Quoz Second":       "Al Quoz",
  "Al Quoz Third":        "Al Quoz",
  "Al Quoz Fourth":       "Al Quoz",
  "Al Quoz Industrial":   "Al Quoz",
  // Deira sub-areas
  "Al Mararr":            "Deira",
  "Al Merkadh":           "Deira",
  "Al Nahda (Dubai)":     "Deira",
  "Al Nahda First":       "Deira",
  "Al Nahda Second":      "Deira",
  "Al Rigga":             "Deira",
  "Al Sabkha":            "Deira",
  "Corniche Deira":       "Deira",
  "Hor Al Anz":           "Deira",
  "Hor Al Anz East":      "Deira",
  "Naif":                 "Deira",
  "Port Saeed":           "Deira",
  "Salah Al Din":         "Deira",
  "Al Muteena":           "Deira",
  "Al Hamriya":           "Deira",
  "Al Khabaisi":          "Deira",
  "Al Mamzar":            "Deira",
  "Abu Hail":             "Deira",
  // Bur Dubai sub-areas
  "Al Bada":              "Bur Dubai",
  "Al Fahidi":            "Bur Dubai",
  "Al Hamriya (Bur Dubai)":"Bur Dubai",
  "Al Jafiliya":          "Bur Dubai",
  "Al Karama":            "Al Karama",
  "Al Mankhool":          "Bur Dubai",
  "Al Rafa":              "Bur Dubai",
  "Al Raffa":             "Bur Dubai",
  "Al Satwa":             "Bur Dubai",
  "Al Wasl":              "Al Wasl",
  "Jumeirah 1":           "Jumeirah",
  "Jumeirah 2":           "Jumeirah",
  "Jumeirah 3":           "Jumeirah",
  "Umm Suqeim 1":         "Jumeirah",
  "Umm Suqeim 2":         "Jumeirah",
  "Umm Suqeim 3":         "Jumeirah",
  // Mirdif area
  "Al Khawaneej":         "Mirdif",
  "Al Mizhar First":      "Mirdif",
  "Al Mizhar Second":     "Mirdif",
  "Muhaisnah First":      "Mirdif",
  "Muhaisnah Second":     "Mirdif",
  "Muhaisnah Third":      "Mirdif",
  "Muhaisnah Fourth":     "Mirdif",
  // Al Rashidiya area
  "Al Manara":            "Jumeirah",
  "Al Rashidiya":         "Al Rashidiya",
  // JVC sub-areas
  "Jumeirah Village Circle":"Jumeirah Village Circle",
  // DSO area
  "Nadd Hessa":           "Dubai Silicon Oasis",
  "Liwan":                "Dubai Silicon Oasis",
  // Qusais area
  "Al Qusais First":      "Al Qusais",
  "Al Qusais Second":     "Al Qusais",
  "Al Qusais Third":      "Al Qusais",
  "Al Qusais Industrial": "Al Qusais",
  "Al Twar First":        "Al Qusais",
  "Al Twar Second":       "Al Qusais",
  "Al Twar Third":        "Al Qusais",
  // Springs/Meadows/Lakes area
  "The Springs":          "The Springs",
  "Meadows":              "The Meadows",
  "The Lakes":            "The Lakes",
  // Creek area
  "Al Jaddaf":            "Al Jaddaf",
  "Culture Village":      "Al Jaddaf",
  // Oud Metha area
  "Oud Metha":            "Oud Metha",
  "Umm Hurair First":     "Oud Metha",
  "Umm Hurair Second":    "Oud Metha",
  // Al Sufouh
  "Al Sufouh First":      "Al Sufouh",
  "Al Sufouh Second":     "Al Sufouh",
  "Palm Deira":           "Deira",
  "Palm Jumeirah":        "Palm Jumeirah",
  // Jumeirah Lakes Towers
  "Jumeirah Lakes Towers":"Jumeirah Lake Towers",
  // Business Bay
  "Business Bay":         "Business Bay",
};

const APPLY = process.argv.includes("--apply");
console.log(APPLY ? "APPLYING" : "DRY RUN");

async function run() {
  // Load all verified communities as lookup
  const verifiedSnap = await db.collection("neighbourhoodScores").where("tier","==","verified").get();
  const verifiedMap = {};
  verifiedSnap.docs.forEach(d => {
    verifiedMap[d.data().community.toLowerCase()] = d.data();
  });

  // Load all DLD communities
  const dldSnap = await db.collection("neighbourhoodScores").where("tier","==","dld-registry").get();
  
  const batch = db.batch();
  let updated = 0;
  let noParent = 0;

  dldSnap.docs.forEach(d => {
    const n = d.data();
    const comm = n.community;
    
    // Find parent
    const parentName = PARENT_MAP[comm];
    const parentData = parentName ? verifiedMap[parentName.toLowerCase()] : null;
    
    // Also try direct match in verified
    const directMatch = verifiedMap[comm.toLowerCase()];
    
    const source = directMatch || parentData;
    
    if (source) {
      // Inherit data from parent but keep own PPSF if available
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
        avgPpsf:         n.avgPpsf || source.avgPpsf, // keep own PPSF if available
        parentCommunity: parentName || null,
        updatedAt:       new Date().toISOString(),
      };

      // Calc investment score
      let score = 40;
      const grossY = parseFloat(update.grossYield||0);
      const distM  = parseFloat(update.distMetro||99);
      const ppsf   = update.avgPpsf||0;
      if (grossY>=9) score+=20; else if(grossY>=8) score+=18; else if(grossY>=7) score+=15; else if(grossY>=6) score+=12; else if(grossY>=5) score+=8;
      if (distM<0.5) score+=12; else if(distM<1) score+=10; else if(distM<2) score+=7; else if(distM<3) score+=5; else if(distM<5) score+=2;
      if (ppsf>=4000) score+=8; else if(ppsf>=3000) score+=7; else if(ppsf>=2000) score+=5; else if(ppsf>=1500) score+=3; else if(ppsf>=1000) score+=1;
      if (update.hasBeach) score+=8;
      if (update.hasMall)  score+=3;
      if (update.hasSchool)score+=2;
      if (update.hasMetro) score+=3;
      if (update.goldenVisa) score+=5;
      update.investmentScore = Math.min(100, Math.round(score));

      console.log("UPDATE:", comm.padEnd(35), "← parent:", (parentName||"direct").padEnd(25), "| score:", update.investmentScore);
      if (APPLY) batch.update(d.ref, update);
      updated++;
    } else {
      console.log("NO PARENT:", comm);
      noParent++;
    }
  });

  console.log("\nUpdated:", updated, "| No parent found:", noParent);

  if (APPLY) {
    await batch.commit();
    console.log("Committed");
  } else {
    console.log("Run with --apply to apply");
  }
  process.exit(0);
}
run().catch(e => { console.error(e); process.exit(1); });