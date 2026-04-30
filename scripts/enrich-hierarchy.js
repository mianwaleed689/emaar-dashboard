/**
 * enrich-hierarchy.js — VERIFIED VERSION
 * 
 * Adds masterCommunity and masterDeveloper fields to all 1,663 projects.
 * 
 * Verified against: DLD, Nakheel.com, Bayut, Propsearch.ae, MAF official website
 * 
 * Run dry: node scripts/enrich-hierarchy.js --dry
 * Run live: node scripts/enrich-hierarchy.js
 */

const admin = require("firebase-admin");
const sa = require("../serviceAccountKey.json");
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();
const DRY_RUN = process.argv.includes("--dry");

const MASTER_COMMUNITY = {
  // NAKHEEL MASTER COMMUNITIES
  "Palm Deira": "Dubai Islands", "Deira Islands": "Dubai Islands", "Dubai Islands": "Dubai Islands",
  "Palm Jumeirah": "Palm Jumeirah",
  "Emaar Beachfront": "Emaar Beachfront",
  "Dubai Harbour": "Dubai Harbour",
  "Jumeirah Village Circle": "Jumeirah Village Circle",
  "Jumeirah Village Triangle": "Jumeirah Village Triangle",
  "Al Furjan": "Al Furjan",
  "Discovery Gardens": "Discovery Gardens",
  "Jumeirah Garden City": "Al Furjan",
  "Jumeirah Islands": "Jumeirah Islands",
  "International City": "International City", "Academic City": "International City",
  "The World Islands": "The World Islands", "The World Project": "The World Islands",
  "Jebel Ali": "Jebel Ali", "Jebel Ali Industrial": "Jebel Ali", "Jebel Ali Village": "Jebel Ali",

  // EMAAR MASTER COMMUNITIES
  "Downtown Dubai": "Downtown Dubai", "DIFC": "Downtown Dubai",
  "Business Bay": "Business Bay",
  "Dubai Creek Harbour": "Dubai Creek Harbour", "The Lagoons": "Dubai Creek Harbour",
  "Ras Al Khor": "Dubai Creek Harbour", "Al Jadaf": "Dubai Creek Harbour",
  "Dubai Hills Estate": "Dubai Hills Estate", "Dubai Hills": "Dubai Hills Estate",
  "Dubai Marina": "Dubai Marina",
  "Jumeirah Lake Towers": "Dubai Marina", "JLT": "Dubai Marina", "Jumeirah Lakes Towers": "Dubai Marina",
  "Jumeirah Beach Residence": "Dubai Marina", "JBR": "Dubai Marina",
  "Arabian Ranches": "Arabian Ranches", "Arabian Ranches II": "Arabian Ranches", "Arabian Ranches III": "Arabian Ranches",
  "The Valley": "The Valley",
  "Emaar South": "Dubai South",
  "The Oasis": "The Oasis",

  // DUBAI HOLDING / TECOM
  "Dubai Sports City": "Dubai Sports City", "Motor City": "Dubai Sports City",
  "Dubai Production City": "Dubai Production City", "International Media Production Zone": "Dubai Production City",
  "Dubai Studio City": "Dubai Studio City",
  "Arjan": "Arjan",

  // DUBAILAND ZONE
  "Dubailand": "Dubailand", "Dubai Land Residence Complex": "Dubailand",
  "Liwan": "Dubailand", "Majan": "Dubailand", "Al Barari": "Dubailand",
  "DAMAC Lagoons": "DAMAC Lagoons",

  // STANDALONE MASTER COMMUNITIES
  "Tilal Al Ghaf": "Tilal Al Ghaf",
  "DAMAC Hills": "DAMAC Hills",
  "DAMAC Hills 2": "DAMAC Hills 2", "Akoya Oxygen": "DAMAC Hills 2",
  "DAMAC Islands": "DAMAC Islands",
  "Mohammed Bin Rashid City": "Mohammed Bin Rashid City",
  "Sobha Hartland": "Mohammed Bin Rashid City", "Sobha Hartland 2": "Mohammed Bin Rashid City",
  "District One": "Mohammed Bin Rashid City", "Meydan": "Mohammed Bin Rashid City",

  // DUBAI SOUTH
  "Dubai South": "Dubai South", "Dubai World Central": "Dubai South",
  "Expo City": "Dubai South", "Expo 2020": "Dubai South",

  // MERAAS
  "City Walk": "City Walk", "Bluewaters Island": "Bluewaters Island",
  "La Mer": "La Mer", "Port De La Mer": "La Mer",
  "Al Seef": "Al Seef", "Nad Al Sheba": "Nad Al Sheba",

  // OLD DUBAI
  "Bur Dubai": "Bur Dubai", "Al Karama": "Bur Dubai",
  "Deira": "Deira", "Al Warsan": "Al Warsan", "Al Nahda": "Al Nahda",

  // INVESTMENT ZONES
  "Dubai Investment Park": "Dubai Investment Park",
  "Dubai Silicon Oasis": "Dubai Silicon Oasis", "DSO": "Dubai Silicon Oasis",
  "Dubai Healthcare City": "Dubai Healthcare City",
  "Dubai Maritime City": "Dubai Maritime City",

  // JUMEIRAH AREA
  "Jumeirah": "Jumeirah", "Umm Suqeim": "Jumeirah", "Al Wasl": "Jumeirah",
  "Al Sufouh": "Al Sufouh", "Barsha Heights": "Barsha Heights",
};

const MASTER_DEVELOPER_LABEL = {
  "Nakheel": "Nakheel",
  "Nakheel Properties": "Nakheel",
  "Nakheel PJSC": "Nakheel",
  "Emaar Properties": "Emaar Properties",
  "Emaar Development P.J.S.C.": "Emaar Properties",
  "Emaar Development PJSC": "Emaar Properties",
  "Dubai Hills Estate L.L.C": "Emaar Properties (Dubai Hills Estate JV)",
  "Dubai Hills Estate LLC": "Emaar Properties (Dubai Hills Estate JV)",
  "Dubai Properties": "Dubai Holding (Dubai Properties)",
  "Dubai Holding": "Dubai Holding",
  "Meraas": "Dubai Holding (Meraas)",
  "Meraas Holding": "Dubai Holding (Meraas)",
  "TECOM Group": "Dubai Holding (TECOM)",
  "TECOM Investments": "Dubai Holding (TECOM)",
  "Majid Al Futtaim": "Majid Al Futtaim",
  "Majid Al Futtaim Properties": "Majid Al Futtaim",
  "DAMAC Properties": "DAMAC Properties",
  "Damac Properties": "DAMAC Properties",
  "DAMAC Real Estate Development": "DAMAC Properties",
  "Meydan Group": "Meydan Group",
  "Meydan": "Meydan Group",
  "Sobha Realty": "Sobha Realty",
  "Sobha LLC": "Sobha Realty",
  "Union Properties": "Union Properties",
  "Dubai Sports City": "Dubai Sports City (Government)",
  "Dubai South": "Dubai South (Government)",
  "Dubai World Central": "Dubai South (Government)",
  "Dubai Silicon Oasis Authority": "Dubai Silicon Oasis Authority",
  "Dubai Silicon Oasis": "Dubai Silicon Oasis Authority",
  "Dubai Airports Corporation": "Emaar Properties (Emaar South)",
  "Dubai South Real Estate": "Dubai South (Government)",
};

async function main() {
  console.log(`\n Hierarchy enrichment ${DRY_RUN ? "(DRY RUN)" : "(LIVE)"}`);
  const snap = await db.collection("projects").get();
  console.log(`Loaded ${snap.size} projects\n`);

  let updated = 0, skipped = 0;
  let batch = db.batch(), bc = 0;
  const unmapped = new Set();

  for (const doc of snap.docs) {
    const p = doc.data();
    const community = (p.community || "").trim();
    const developer = (p.developer || "").trim();
    const updates = {};

    if (!p.masterCommunity) {
      const mc = MASTER_COMMUNITY[community];
      updates.masterCommunity = mc || community;
      if (!mc && community) unmapped.add(community);
    }

    if (!p.masterDeveloper && developer) {
      updates.masterDeveloper = MASTER_DEVELOPER_LABEL[developer] || developer;
    }

    if (!p.developerActual && developer) {
      updates.developerActual = developer;
    }

    if (Object.keys(updates).length === 0) { skipped++; continue; }

    if (updated < 8) {
      console.log(`"${p.name}" (${community})`);
      Object.entries(updates).forEach(([k,v]) => console.log(`  ${k}: ${v}`));
    }

    if (!DRY_RUN) {
      batch.update(doc.ref, updates);
      bc++;
      if (bc >= 400) { await batch.commit(); batch = db.batch(); bc = 0; console.log("Committed batch"); }
    }
    updated++;
  }

  if (!DRY_RUN && bc > 0) await batch.commit();

  console.log(`\nUpdated: ${updated} | Skipped: ${skipped}`);
  if (unmapped.size > 0) {
    console.log(`\nUnmapped communities (set to self - ${unmapped.size}):`);
    [...unmapped].sort().forEach(c => console.log(`  - "${c}"`));
  }
  if (DRY_RUN) console.log("\nDRY RUN - remove --dry to apply.");
  else console.log("\nDone!");
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
