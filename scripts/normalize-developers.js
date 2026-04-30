/**
 * normalize-developers.js
 * 
 * Cleans up messy DLD legal entity names → clean brand names
 * Updates developerActual field for all projects
 * 
 * Run dry: node scripts/normalize-developers.js --dry
 * Run live: node scripts/normalize-developers.js
 */

const admin = require("firebase-admin");
const sa = require("../serviceAccountKey.json");
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();
const DRY_RUN = process.argv.includes("--dry");

// DLD legal name → clean brand name
const DEV_NORMALIZE = {
  // EMAAR group
  "Emaar Development P.J.S.C.":                          "Emaar Properties",
  "Emaar Development PJSC":                               "Emaar Properties",
  "Emaar Properties (P.J.S.C)":                          "Emaar Properties",
  "Emaar Properties P.J.S.C":                            "Emaar Properties",
  "Emaar Properties PJSC":                               "Emaar Properties",
  "Emaar Dubai South Dwc Llc":                           "Emaar Properties",
  "Dubai Hills Estate L.L.C":                            "Emaar Properties",
  "Dubai Hills Estate LLC":                              "Emaar Properties",
  "Dubai Creek Harbour L.L.C":                           "Emaar Properties",
  "Dubai Creek Harbour LLC":                             "Emaar Properties",
  "Mina Rashid Properties L.L.C":                        "Emaar Properties",
  "Emaar South":                                         "Emaar Properties",
  "Dhre 2 Bts L.L.C":                                   "Emaar Properties",

  // NAKHEEL
  "Nakheel Properties":                                  "Nakheel",
  "Nakheel PJSC":                                        "Nakheel",
  "The Palm - Jebel Ali Co. (L.L.C)":                   "Nakheel",
  "The Palm Jebel Ali Co LLC":                           "Nakheel",

  // DAMAC group
  "Damac Elite Investment Co. L.L.C":                    "DAMAC Properties",
  "Damac Mry Investment L.L.C":                          "DAMAC Properties",
  "Damac Crescent Properties":                           "DAMAC Properties",
  "DAMAC Real Estate Development":                       "DAMAC Properties",
  "Damac Properties":                                    "DAMAC Properties",

  // AZIZI
  "Azizi Developments L.L.C":                           "Azizi Developments",
  "Azizi Developments LLC":                              "Azizi Developments",

  // BINGHATTI
  "Binghatti Developers Fze":                            "Binghatti",
  "Binghatti Developers":                                "Binghatti",
  "Binghatti Properties":                                "Binghatti",

  // SOBHA
  "Sobha L.L.C":                                        "Sobha Realty",
  "Sobha LLC":                                          "Sobha Realty",
  "Sobha Realty L.L.C":                                 "Sobha Realty",

  // DANUBE
  "Danube Properties Development L.L.C":                "Danube Properties",
  "Danube Properties Development LLC":                   "Danube Properties",

  // SAMANA — multiple legal entities
  "Samana International Real Estate Development L.L.C": "Samana Developers",
  "Samana Signature Real Estate Developments L.L.C":    "Samana Developers",
  "Samana Star Real Estate Development L.L.C":          "Samana Developers",
  "Samana Developers L.L.C":                            "Samana Developers",

  // ELLINGTON
  "Ellington Properties Development L.L.C":             "Ellington Properties",
  "Ellington Properties Development LLC":               "Ellington Properties",

  // NSHAMA
  "Nshama Properties Owned By Nshmi Development One Person Company L.L.C": "Nshama",
  "Nshama Development":                                 "Nshama",

  // DUBAI PROPERTIES (Dubai Holding)
  "Dubai Properties":                                   "Dubai Properties",
  "Dubai Properties Group":                             "Dubai Properties",

  // MERAAS
  "Citywalk Residential 1 L.L.C":                      "Meraas",
  "Meraas Holding L.L.C":                              "Meraas",

  // DUBAI SOUTH
  "Dubai South Properties Dwc Llc":                     "Dubai South Properties",
  "Dubai South Properties":                             "Dubai South Properties",
  "Dubai Airports Corporation":                         "Emaar Properties",

  // MAJID AL FUTTAIM
  "Majid Al Futtaim Tilal Al Ghaf Phase A L.L.C":      "Majid Al Futtaim",
  "Majid Al Futtaim Properties L.L.C":                 "Majid Al Futtaim",

  // DEYAAR
  "Deyaar Development (P.J.S.C)":                      "Deyaar",
  "Deyaar Development PJSC":                            "Deyaar",

  // SELECT GROUP
  "Select Global Development L.L.C":                   "Select Group",

  // REPORTAGE
  "Reportage Prime Properties L.L.C":                  "Reportage Properties",
  "Reportage Properties L.L.C":                        "Reportage Properties",

  // IMTIAZ
  "Imtiaz Real Estate Investment And Development L.L.C": "Imtiaz Developments",

  // OBJECT ONE / OBJ1
  "Object One Real Estate Development L.L.C":          "Object One",
  "Obj1 Real Estate Development L.L.C":                "Object One",

  // TIGER
  "Tiger Properties":                                   "Tiger Properties",

  // ISLAND OASIS (Octa Properties)
  "Island Oasis Properties":                            "Octa Properties",

  // FRONT LINE
  "Front Line Investment Management L.L.C":             "Frontline Real Estate",

  // IMAN
  "Iman Developers L.L.C":                             "Iman Developers",

  // LEOS
  "Leos Development L.L.C":                            "Leos Developments",

  // JAG
  "Jag Development L.L.C":                             "JAG Developments",

  // DIGO
  "Digo Real Estate Development (Br Of Invest Group Overseas (L L C) )": "Digo Real Estate",

  // MEYDAN
  "Meydan Group":                                       "Meydan",
};

async function main() {
  console.log(`\nDeveloper name normalizer ${DRY_RUN ? "(DRY RUN)" : "(LIVE)"}\n`);
  const snap = await db.collection("projects").get();
  console.log(`Loaded ${snap.size} projects`);

  let updated = 0, skipped = 0;
  let batch = db.batch(), bc = 0;
  const unknown = new Set();

  for (const doc of snap.docs) {
    const p = doc.data();
    const current = p.developerActual || p.developer || "";
    const normalized = DEV_NORMALIZE[current];

    if (!normalized) {
      if (current) unknown.add(current);
      skipped++;
      continue;
    }

    if (normalized === current) { skipped++; continue; }

    if (updated < 10) {
      console.log(`"${p.name}": "${current}" → "${normalized}"`);
    }

    if (!DRY_RUN) {
      batch.update(doc.ref, { developerActual: normalized });
      bc++;
      if (bc >= 400) {
        await batch.commit();
        batch = db.batch(); bc = 0;
        console.log("Committed batch");
      }
    }
    updated++;
  }

  if (!DRY_RUN && bc > 0) await batch.commit();

  console.log(`\nNormalized: ${updated} | Skipped: ${skipped}`);

  if (unknown.size > 0 && unknown.size <= 50) {
    console.log(`\nUnknown developer names (${unknown.size}) — add to map if needed:`);
    [...unknown].sort().forEach(d => console.log(`  "${d}"`));
  }

  if (DRY_RUN) console.log("\nDRY RUN — remove --dry to apply.");
  else console.log("\nDone!");
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
