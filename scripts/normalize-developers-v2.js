/**
 * normalize-developers-v2.js
 * 
 * Second pass normalization - cleans up remaining messy DLD legal names
 * Groups all subsidiary/SPV entities under parent brand names
 */

const admin = require("firebase-admin");
const sa = require("../serviceAccountKey.json");
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();
const DRY_RUN = process.argv.includes("--dry");

const NORMALIZE = {
  // DAMAC variants
  "Damac Prime Development L.L.C":           "DAMAC Properties",
  "Damac Prime Development":                 "DAMAC Properties",
  "Damac Crest Development":                 "DAMAC Properties",
  "Damac Canal One Property Development":    "DAMAC Properties",
  "Damac C S L Investment":                  "DAMAC Properties",
  "Damac J R Two Investment":                "DAMAC Properties",
  "Damac J W F Investment":                  "DAMAC Properties",
  "Damac P S L Investment":                  "DAMAC Properties",
  "Damac Mdn Investment":                    "DAMAC Properties",
  "Damac Business Real Estate Co.":          "DAMAC Properties",

  // EMAAR variants
  "Dwtc Emaar":                              "Emaar Properties",
  "Emaar Bawadi (L L C)":                    "Emaar Properties",
  "Dubai Creek Harbour L.L.C":              "Emaar Properties",
  "Dubai Hills Estate L.L.C":               "Emaar Properties",
  "Mina Rashid Properties L.L.C":           "Emaar Properties",

  // SAMANA variants
  "Samana Si Holding Limited Dubai Branch": "Samana Developers",
  "Samana Platinum Real Estate Development":"Samana Developers",
  "Samana World Real Estate Development":   "Samana Developers",

  // IMTIAZ variants
  "Imtiaz Ghd Real Estate Development":     "Imtiaz Developments",
  "Imtiaz Sunset Real Estate Development":  "Imtiaz Developments",
  "Imtiaz Cove Real Estate Development":    "Imtiaz Developments",
  "Imtiaz Gi Real Estate Development":      "Imtiaz Developments",
  "Imtiaz Ug Real Estate Development":      "Imtiaz Developments",
  "Imtiaz Bwg Real Estate Development":     "Imtiaz Developments",
  "Imtiaz Luxury Real Estate Development":  "Imtiaz Developments",

  // ELLINGTON variants
  "Ellington Properties Development L.L.C": "Ellington Properties",
  "Ellington Dutco Real Estate":            "Ellington Properties",
  "Ellington Sb Development":               "Ellington Properties",
  "Ellington Pcfc Developers":              "Ellington Properties",
  "Ellington Karma Developers":             "Ellington Properties",
  "Ellington Sb Development":               "Ellington Properties",
  "Northacre Ellington Development":        "Ellington Properties",
  "Dutco Ellington Canal Front Real Estate":"Ellington Properties",

  // REPORTAGE variants
  "Reportage Plus A Real Estate Development L.L.C": "Reportage Properties",
  "Reportage Plus A Real Estate Development":        "Reportage Properties",

  // BINGHATTI variants
  "Binghatti Developers Fze":               "Binghatti",

  // AURORA variants
  "Aurora Spv 1":                           "Aurora Real Estate",
  "Aurora Spv 2":                           "Aurora Real Estate",
  "Aurora Spv 3":                           "Aurora Real Estate",
  "Aurora Spv 1 L.L.C":                     "Aurora Real Estate",
  "Aurora Spv 3 L.L.C":                     "Aurora Real Estate",

  // PRESTIGE variants
  "Prestige One Luxury Real Estate":        "Prestige Properties",
  "Prestige Harbour Real Estate Development":"Prestige Properties",
  "Prestige Luxe Real Estate Development":  "Prestige Properties",
  "Prestige The Boulevard Real Estate Development": "Prestige Properties",
  "Prestige The One Real Estate Development":"Prestige Properties",
  "Prestige The Parkway Real Estate Development": "Prestige Properties",
  "Prestige The Place Real Estate Development": "Prestige Properties",
  "Prestige The Seaside Real Estate Development": "Prestige Properties",
  "Prestige The Waterway Real Estate Development": "Prestige Properties",

  // MARQUIS variants
  "Marquis Home Developer":                 "Marquis Developers",
  "Marquis Circle Real Estate Developer":   "Marquis Developers",
  "Marquis Star Development":               "Marquis Developers",

  // VINCITORE variants
  "Vincitore Premium Real Estate Development": "Vincitore",
  "Vincitore Elite Real Estate Development":   "Vincitore",
  "Vincitore Luxury Real Estate Development":  "Vincitore",

  // MAG variants
  "Mag Of Life Fz-":                        "MAG Property Development",
  "Mag 10 Property Development Dmcc":       "MAG Property Development",
  "Mag Park Real Estate Development L.L.C-Fz": "MAG Property Development",
  "Mag Palace Properties Development":      "MAG Property Development",
  "Mag Property Development":               "MAG Property Development",

  // AHS variants
  "A H S Canal Development":               "AHS Development",
  "Ahs Canal Two Real Estate Development":  "AHS Development",
  "Ahs Canal Three Development":            "AHS Development",
  "A H S Palm Development":                "AHS Development",
  "Ahs Tower Holding Development L.L.C S.O.C": "AHS Development",

  // EXPO CITY variants
  "Expo City Al Waha Residences Development Fzco": "Expo City Dubai",
  "Expo City Mangrove Residences Development Fzco": "Expo City Dubai",
  "Expo City Sky Residences Development Fzco": "Expo City Dubai",
  "Expo City Sidr Residences Development Fzco": "Expo City Dubai",
  "Expo City Valley Apartments Fzco":       "Expo City Dubai",
  "Expo City Valley Development Fzco":      "Expo City Dubai",

  // CONDOR variants
  "Condor Golf Links 18 Real Estate Development": "Condor Developers",
  "Condor Concept 7 View Real Estate Development": "Condor Developers",
  "Condor Island Living Real Estate Development L.L.C": "Condor Developers",

  // AGP variants
  "Agp Assets Real Estate Developments":   "AGP Properties",
  "Agp Ark Real Estate Development":        "AGP Properties",
  "Agp Builders Real Estate Development":   "AGP Properties",

  // IRTH variants
  "Irth Development":                       "Irth Developments",
  "Irth Elite Development":                 "Irth Developments",
  "Irth Signature Development":             "Irth Developments",
  "Irth Urban Two Development L.L.C":       "Irth Developments",

  // MERAAS variants
  "Citywalk Residential 1 L.L.C":          "Meraas",
  "La Mer Central Property Co.":            "Meraas",
  "La Mer North Property Co.":              "Meraas",

  // NAKHEEL variants
  "Nakheel And Excelsior Real Estate":      "Nakheel",
  "International City ( L.L.C )":          "Nakheel",
  "Jebel Ali Village":                      "Nakheel",
  "The Palm - Jumeirah Co.":               "Nakheel",

  // SELECT GROUP variants
  "Select Global Development L.L.C":       "Select Group",

  // OBJECT ONE variants
  "Object 1 Real Estate Development":       "Object One",
  "Obj1 Real Estate Development L.L.C":     "Object One",

  // OCTA variants
  "Octa Di Development Co.":               "Octa Properties",
  "Octa Properties / Centurion Properties": "Octa Properties",

  // SOBHA variants
  "Sobha L.L.C":                            "Sobha Realty",

  // LEOS variants
  "Leos Sof Real Estate Development":       "Leos Developments",

  // ARADA variants
  "Arada Developments L.L.C":              "Arada Developments",
  "Arada Developments L.L.C S.O.C":        "Arada Developments",

  // Clean up remaining L.L.C suffixes for known brands
  "Zazen Property Development":            "Zazen Homes",
  "Pantheon Development":                   "Pantheon Real Estate",
  "Pantheon Elysee Real Estate Development L.L.C": "Pantheon Real Estate",
  "Pantheon Elysee Real Estate Development": "Pantheon Real Estate",

  // TECOM
  "TECOM Investments":                      "Dubai Holdings (TECOM)",
  "Dubai Sports City":                      "Dubai Sports City",
  "Dubai Islands":                          "Nakheel",
};

// Also apply regex cleanup for remaining L.L.C suffixes
function cleanName(name) {
  if (!name) return name;
  return name
    .replace(/\s+L\.L\.C\s*-?\s*Fz$/i, '')
    .replace(/\s+L\.L\.C\.?\s*S\.O\.C\.?\s*$/i, '')
    .replace(/\s+L\.L\.C\.?\s*$/i, '')
    .replace(/\s+LLC\s*$/i, '')
    .replace(/\s+Fzco\s*$/i, '')
    .replace(/\s+Dmcc\s*$/i, '')
    .replace(/\s+Fze?\s*$/i, '')
    .replace(/\s+Dwc\s*Llc\s*$/i, '')
    .replace(/\s+\(L\s*L\s*C\)\s*$/i, '')
    .replace(/\s+-\s*Dubai Branch\s*$/i, '')
    .replace(/\s+Dubai Branch\s*$/i, '')
    .replace(/\s+Real Estate Development\s*$/i, '')
    .replace(/\s+Real Estate\s*$/i, '')
    .replace(/\s+Property Development\s*$/i, '')
    .replace(/\s+Properties Development\s*$/i, '')
    .replace(/\s+Developers\s*$/i, '')
    .replace(/\s+Developer\s*$/i, '')
    .replace(/\s+Development\s*$/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Brands that should NOT be stripped (they need the full name)
const PROTECTED = new Set([
  'Emaar Properties', 'DAMAC Properties', 'Nakheel', 'Azizi Developments',
  'Samana Developers', 'Danube Properties', 'Ellington Properties',
  'Leos Developments', 'Imtiaz Developments', 'Reportage Properties',
  'Dubai Properties', 'Sobha Realty', 'Majid Al Futtaim', 'Meraas',
  'Deyaar', 'Object One', 'Select Group', 'Tiger Properties',
  'Frontline Real Estate', 'Octa Properties', 'Nshama', 'Binghatti',
  'Meydan', 'Prescott', 'Arada Developments', 'Taraf Development',
]);

async function main() {
  console.log(`Developer normalization v2 ${DRY_RUN ? "(DRY RUN)" : "(LIVE)"}\n`);
  const snap = await db.collection("projects").get();
  console.log(`Loaded ${snap.size} projects`);

  let batch = db.batch(), bc = 0, updated = 0;

  for (const doc of snap.docs) {
    const current = doc.data().developerActual || doc.data().developer || "";
    if (!current || PROTECTED.has(current)) continue;

    // Check explicit map first
    let normalized = NORMALIZE[current];

    // Then try regex cleanup
    if (!normalized) {
      const cleaned = cleanName(current);
      if (cleaned && cleaned !== current && cleaned.length > 3) {
        normalized = cleaned;
      }
    }

    if (!normalized || normalized === current) continue;

    if (updated < 10) console.log(`"${current}" → "${normalized}"`);

    if (!DRY_RUN) {
      batch.update(doc.ref, { developerActual: normalized });
      bc++;
      if (bc >= 400) { await batch.commit(); batch = db.batch(); bc = 0; }
    }
    updated++;
  }

  if (!DRY_RUN && bc > 0) await batch.commit();
  console.log(`\nNormalized: ${updated} projects`);
  if (DRY_RUN) console.log("DRY RUN — remove --dry to apply");
  else console.log("Done!");
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
