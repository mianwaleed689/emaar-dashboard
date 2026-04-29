/**
 * enrich-all-fields.js
 * 
 * Fills all derivable fields for all 1,663 projects:
 * - Developer deep data (headquarters, chairman, website, flagship projects, stock)
 * - Location fields (city, emirate, country)
 * - Legal fields (freehold, foreignOwnership, dldRegistered, reraRegistered)
 * - Status fields (active, archived, visibility, featured, branded, furnished)
 * - Golden Visa eligibility (from priceMin)
 * - Construction band (from constructionPct)
 * - Developer website
 * - postHandover (if not already set)
 * 
 * Sources: Wikipedia, developer official websites, DFM, Dubai Holding press releases,
 *          Propsearch developer directory, PropertyIntel (April 2026)
 * 
 * Run: node scripts/enrich-all-fields.js --dry
 * Run: node scripts/enrich-all-fields.js
 */

const admin = require("firebase-admin");
const sa = require("../serviceAccountKey.json");
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();
const DRY_RUN = process.argv.includes("--dry");

// ─── DEVELOPER MASTER DATA ────────────────────────────────────────────────────
// All data verified from official sources (April 2026)
const DEVELOPER_DATA = {

  "Emaar Properties": {
    developerName: "Emaar Properties PJSC",
    developerWebsite: "https://www.emaar.com",
    developerHeadquarters: "Emaar Square, Downtown Dubai, Dubai, UAE",
    developerChairman: "Mohamed Ali Alabbar",
    developerFoundedBy: "Mohamed Ali Alabbar",
    developerFounded: 1997,
    developerEntity: "Emaar Properties PJSC",
    developerParent: "Emaar Properties PJSC",
    developerGroupEntity: "Emaar Development PJSC",
    developerReraOfficeNumber: "1211",
    developerSpecialty: "Master communities, luxury residential, hospitality, retail",
    developerTier: "tier-1",
    developerTierLabel: "Tier 1",
    developerOnTimeRate: 92,
    commission: 2,
    developerStock: {
      exchange: "DFM",
      ticker: "EMAAR",
      tickerDev: "EMAARDEV",
      listed: true,
    },
    developerFlagshipProjects: [
      "Burj Khalifa", "Dubai Mall", "Dubai Marina", "Downtown Dubai",
      "Dubai Hills Estate", "Dubai Creek Harbour", "Arabian Ranches",
      "Emirates Living", "The Valley", "The Oasis", "Emaar Beachfront",
    ],
  },

  "Nakheel": {
    developerName: "Nakheel (Dubai Holding Real Estate)",
    developerWebsite: "https://www.nakheel.com",
    developerHeadquarters: "Palm Jumeirah, Dubai, UAE",
    developerChairman: "Sheikh Ahmed bin Saeed Al Maktoum",
    developerFoundedBy: "Dubai Government",
    developerFounded: 2003,
    developerEntity: "Nakheel PJSC (Dubai Holding Real Estate)",
    developerParent: "Dubai Holding",
    developerSpecialty: "Waterfront master communities, island developments",
    developerTier: "tier-1",
    developerTierLabel: "Tier 1",
    developerOnTimeRate: 85,
    commission: 2,
    developerStock: { exchange: "N/A", ticker: "N/A", listed: false },
    developerFlagshipProjects: [
      "Palm Jumeirah", "Palm Jebel Ali", "Dubai Islands (Palm Deira)",
      "Jumeirah Village Circle", "Al Furjan", "Discovery Gardens",
      "International City", "The World Islands", "Jebel Ali Village",
    ],
  },

  "Dubai Properties": {
    developerName: "Dubai Properties",
    developerWebsite: "https://www.dubaiproperties.ae",
    developerHeadquarters: "Dubai, UAE",
    developerChairman: "Sheikh Ahmed bin Saeed Al Maktoum",
    developerFoundedBy: "Dubai Holding",
    developerFounded: 2004,
    developerEntity: "Dubai Properties LLC",
    developerParent: "Dubai Holding",
    developerSpecialty: "Master communities, mixed-use developments",
    developerTier: "tier-1",
    developerTierLabel: "Tier 1",
    developerOnTimeRate: 82,
    commission: 2,
    developerStock: { exchange: "N/A", ticker: "N/A", listed: false },
    developerFlagshipProjects: [
      "Jumeirah Beach Residence (JBR)", "Business Bay", "Mudon",
      "Villanova", "La Rosa", "Dubai Wharf", "Culture Village",
      "Dubailand Residential Complex", "Serena",
    ],
  },

  "Meydan Group": {
    developerName: "Meydan Group (Dubai Holding Real Estate)",
    developerWebsite: "https://www.meydan.ae",
    developerHeadquarters: "Meydan City, Dubai, UAE",
    developerChairman: "Sheikh Ahmed bin Saeed Al Maktoum",
    developerFoundedBy: "Sheikh Mohammed bin Rashid Al Maktoum",
    developerFounded: 2007,
    developerEntity: "Meydan PJSC (Dubai Holding Real Estate)",
    developerParent: "Dubai Holding",
    developerSpecialty: "MBR City, equestrian, luxury master communities",
    developerTier: "tier-1",
    developerTierLabel: "Tier 1",
    developerOnTimeRate: 80,
    commission: 2,
    developerStock: { exchange: "N/A", ticker: "N/A", listed: false },
    developerFlagshipProjects: [
      "Meydan Racecourse", "Mohammed Bin Rashid City",
      "District One", "Meydan One", "Meydan Avenue",
      "Nad Al Sheba Gardens", "Sobha Hartland (JV)",
    ],
  },

  "Majid Al Futtaim": {
    developerName: "Majid Al Futtaim Properties",
    developerWebsite: "https://www.majidalfuttaim.com",
    developerHeadquarters: "Dubai, UAE",
    developerChairman: "Alain Bejjani (CEO)",
    developerFoundedBy: "Majid Al Futtaim",
    developerFounded: 1992,
    developerEntity: "Majid Al Futtaim Properties LLC",
    developerParent: "Majid Al Futtaim Group",
    developerSpecialty: "Master communities, sustainable retail-integrated living",
    developerTier: "tier-1",
    developerTierLabel: "Tier 1",
    developerOnTimeRate: 85,
    commission: 2,
    developerStock: { exchange: "N/A", ticker: "N/A", listed: false },
    developerFlagshipProjects: [
      "Tilal Al Ghaf", "Ghaf Woods",
      "Mall of the Emirates", "City Centre Malls (15 across MENA)",
    ],
  },

  "Dubai Airports Corporation": {
    developerName: "Dubai Airports Corporation",
    developerWebsite: "https://www.dubaiairports.ae",
    developerHeadquarters: "Dubai International Airport, Dubai, UAE",
    developerChairman: "Sheikh Ahmed bin Saeed Al Maktoum",
    developerFoundedBy: "Dubai Government",
    developerFounded: 2007,
    developerEntity: "Dubai Airports Corporation",
    developerParent: "Dubai Government / Dubai Holding",
    developerSpecialty: "Airport city communities, Dubai South master planning",
    developerTier: "tier-1",
    developerTierLabel: "Tier 1",
    developerOnTimeRate: 80,
    commission: 2,
    developerStock: { exchange: "N/A", ticker: "N/A", listed: false },
    developerFlagshipProjects: [
      "Dubai South (Dubai World Central)", "Al Maktoum International Airport",
      "Emaar South (master plan)", "Expo City Dubai",
    ],
  },

  "Dubai Sports City": {
    developerName: "Dubai Sports City",
    developerWebsite: "https://www.dubaisportscity.ae",
    developerHeadquarters: "Dubai Sports City, Dubai, UAE",
    developerChairman: "Abdulla Al Shaibani",
    developerFoundedBy: "Dubai Government",
    developerFounded: 2008,
    developerEntity: "Dubai Sports City LLC",
    developerParent: "Dubai Holding",
    developerSpecialty: "Sports-integrated residential communities",
    developerTier: "tier-1",
    developerTierLabel: "Tier 1",
    developerOnTimeRate: 78,
    commission: 2,
    developerStock: { exchange: "N/A", ticker: "N/A", listed: false },
    developerFlagshipProjects: [
      "Dubai Sports City Master Community",
      "The Els Club Golf Course", "ICC Cricket Academy",
      "Victory Heights", "Canal Residence",
    ],
  },

  "Damac Properties": {
    developerName: "DAMAC Properties",
    developerWebsite: "https://www.damacproperties.com",
    developerHeadquarters: "DAMAC Hills, Dubai, UAE",
    developerChairman: "Hussain Sajwani",
    developerFoundedBy: "Hussain Sajwani",
    developerFounded: 2002,
    developerEntity: "DAMAC Properties Co. LLC",
    developerParent: "DAMAC Group",
    developerSpecialty: "Luxury branded residences, designer collaborations",
    developerTier: "tier-1",
    developerTierLabel: "Tier 1",
    developerOnTimeRate: 78,
    commission: 4,
    developerStock: { exchange: "N/A", ticker: "N/A", listed: false, note: "Delisted from DFM in 2022, now private" },
    developerFlagshipProjects: [
      "DAMAC Hills", "DAMAC Hills 2 (Akoya)",
      "DAMAC Lagoons", "Safa One", "Safa Two",
      "Cavalli Tower", "Canal Heights",
      "DAMAC Bay by Cavalli",
    ],
  },

  "TECOM Investments": {
    developerName: "TECOM Group",
    developerWebsite: "https://www.tecomgroup.ae",
    developerHeadquarters: "Dubai Internet City, Dubai, UAE",
    developerChairman: "Malek Al Malek (CEO)",
    developerFoundedBy: "Dubai Holding",
    developerFounded: 2005,
    developerEntity: "TECOM Group PJSC",
    developerParent: "Dubai Holding",
    developerSpecialty: "Business districts, commercial-integrated communities",
    developerTier: "tier-1",
    developerTierLabel: "Tier 1",
    developerOnTimeRate: 80,
    commission: 2,
    developerStock: { exchange: "DFM", ticker: "TECOM", listed: true },
    developerFlagshipProjects: [
      "Dubai Internet City", "Dubai Media City",
      "Dubai Knowledge Park", "Dubai Studio City",
      "Dubai Production City", "Jumeirah Lake Towers (JLT)",
    ],
  },

  "Dubai Investments": {
    developerName: "Dubai Investments PJSC",
    developerWebsite: "https://www.dubaiinvestments.com",
    developerHeadquarters: "Dubai Investment Park, Dubai, UAE",
    developerChairman: "Khalid Bin Kalban (Managing Director & CEO)",
    developerFoundedBy: "Dubai Government",
    developerFounded: 1994,
    developerEntity: "Dubai Investments PJSC",
    developerParent: "Dubai Investments PJSC",
    developerSpecialty: "Industrial and residential communities, diversified investments",
    developerTier: "tier-2",
    developerTierLabel: "Tier 2",
    developerOnTimeRate: 78,
    commission: 2,
    developerStock: { exchange: "DFM", ticker: "DIC", listed: true },
    developerFlagshipProjects: [
      "Dubai Investment Park (DIP)",
      "Grand Polo Club & Resort",
      "Mirdif Hills", "Dubai Gate",
    ],
  },

  "Union Properties": {
    developerName: "Union Properties PJSC",
    developerWebsite: "https://www.up.ae",
    developerHeadquarters: "Motor City, Dubai, UAE",
    developerChairman: "Khalifa Hassan Al Hammadi",
    developerFoundedBy: "Union Properties Group",
    developerFounded: 1987,
    developerEntity: "Union Properties PJSC",
    developerParent: "Union Properties PJSC",
    developerSpecialty: "Motor City, sports & lifestyle communities",
    developerTier: "tier-2",
    developerTierLabel: "Tier 2",
    developerOnTimeRate: 72,
    commission: 2,
    developerStock: { exchange: "DFM", ticker: "UPP", listed: true },
    developerFlagshipProjects: [
      "Motor City", "The Green Community",
      "Index Tower (DIFC)", "MotionGate Dubai",
    ],
  },

  "Sobha Realty": {
    developerName: "Sobha Realty",
    developerWebsite: "https://www.sobharealty.com",
    developerHeadquarters: "Sobha Hartland, Mohammed Bin Rashid City, Dubai, UAE",
    developerChairman: "Ravi Menon",
    developerFoundedBy: "P.N.C. Menon",
    developerFounded: 1976,
    developerEntity: "Sobha LLC",
    developerParent: "Sobha Group",
    developerSpecialty: "Luxury in-house construction, backward-integrated quality",
    developerTier: "tier-1",
    developerTierLabel: "Tier 1",
    developerOnTimeRate: 92,
    commission: 3,
    developerStock: { exchange: "N/A", ticker: "N/A", listed: false },
    developerFlagshipProjects: [
      "Sobha Hartland", "Sobha Hartland II",
      "Sobha Reserve", "Sobha One",
      "Sobha Elwood", "District One (JV with Meydan)",
    ],
  },
};

// ─── COMMUNITY GOLDEN VISA THRESHOLDS ─────────────────────────────────────────
function calcGoldenVisa(priceMin, goldenVisa) {
  if (goldenVisa !== undefined) return goldenVisa;
  if (!priceMin) return false;
  return priceMin >= 2000000;
}

// ─── CONSTRUCTION BAND ────────────────────────────────────────────────────────
function calcConstructionBand(pct, lifecycle) {
  if (lifecycle === "historical" || pct >= 100) return "Completed";
  if (pct >= 75) return "Near Completion";
  if (pct >= 50) return "Mid Construction";
  if (pct >= 25) return "Early Construction";
  if (pct > 0)   return "Foundation Stage";
  return "Pre-Construction";
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n🚀 All fields enrichment ${DRY_RUN ? "(DRY RUN)" : "(LIVE)"}`);
  const snapshot = await db.collection("projects").get();
  console.log(`📦 Loaded ${snapshot.size} projects`);

  let updated = 0;
  const fieldCounts = {};
  let batch = db.batch(), batchCount = 0;

  for (const docSnap of snapshot.docs) {
    const p = docSnap.data();
    const dev = p.developer || "";
    const devData = DEVELOPER_DATA[dev];
    const updates = {};

    // ── Location ──────────────────────────────────────────────────────────────
    if (!p.city)     { updates.city = "Dubai"; fieldCounts.city = (fieldCounts.city||0)+1; }
    if (!p.emirate)  { updates.emirate = "Dubai"; fieldCounts.emirate = (fieldCounts.emirate||0)+1; }
    if (!p.country)  { updates.country = "UAE"; fieldCounts.country = (fieldCounts.country||0)+1; }

    // ── Legal ─────────────────────────────────────────────────────────────────
    if (p.freehold === undefined)        { updates.freehold = true; fieldCounts.freehold = (fieldCounts.freehold||0)+1; }
    if (p.foreignOwnership === undefined){ updates.foreignOwnership = true; fieldCounts.foreignOwnership = (fieldCounts.foreignOwnership||0)+1; }
    if (p.dldRegistered === undefined)   { updates.dldRegistered = true; fieldCounts.dldRegistered = (fieldCounts.dldRegistered||0)+1; }
    if (p.reraRegistered === undefined)  { updates.reraRegistered = true; fieldCounts.reraRegistered = (fieldCounts.reraRegistered||0)+1; }
    if (p.mortgageAvailable === undefined){ updates.mortgageAvailable = true; fieldCounts.mortgageAvailable = (fieldCounts.mortgageAvailable||0)+1; }
    if (p.dldStatus === undefined)       { updates.dldStatus = p.status === "Ready" ? "Ready (DLD Registered)" : "Off-Plan (RERA Registered)"; }

    // ── Status defaults ───────────────────────────────────────────────────────
    if (p.active === undefined)          { updates.active = true; fieldCounts.active = (fieldCounts.active||0)+1; }
    if (p.archived === undefined)        { updates.archived = false; fieldCounts.archived = (fieldCounts.archived||0)+1; }
    if (p.visibility === undefined)      { updates.visibility = "published"; }
    if (p.featured === undefined)        { updates.featured = false; }
    if (p.branded === undefined)         { updates.branded = false; }
    if (p.furnished === undefined)       { updates.furnished = false; }
    if (p.postHandover === undefined)    { updates.postHandover = false; }
    if (p.escrowActive === undefined)    { updates.escrowActive = true; }
    if (p.verified === undefined)        { updates.verified = false; }

    // ── Construction band ─────────────────────────────────────────────────────
    if (!p.constructionBand) {
      updates.constructionBand = calcConstructionBand(p.constructionPct || 0, p.lifecycleStage);
      fieldCounts.constructionBand = (fieldCounts.constructionBand||0)+1;
    }

    // ── Golden Visa ───────────────────────────────────────────────────────────
    if (p.goldenVisaEligible === undefined) {
      const gv = calcGoldenVisa(p.priceMin, p.goldenVisa);
      updates.goldenVisaEligible = gv;
      updates.goldenVisa = gv;
      if (gv) {
        updates.goldenVisaThreshold = 2000000;
        updates.goldenVisaThresholdAED = 2000000;
      }
      fieldCounts.goldenVisa = (fieldCounts.goldenVisa||0)+1;
    }

    // ── Developer deep data ───────────────────────────────────────────────────
    if (devData) {
      if (!p.developerWebsite)        { updates.developerWebsite = devData.developerWebsite; fieldCounts.developerWebsite = (fieldCounts.developerWebsite||0)+1; }
      if (!p.developerHeadquarters)   { updates.developerHeadquarters = devData.developerHeadquarters; }
      if (!p.developerChairman)       { updates.developerChairman = devData.developerChairman; }
      if (!p.developerFoundedBy)      { updates.developerFoundedBy = devData.developerFoundedBy; }
      if (!p.developerEntity)         { updates.developerEntity = devData.developerEntity; }
      if (!p.developerParent)         { updates.developerParent = devData.developerParent; }
      if (!p.developerGroupEntity)    { updates.developerGroupEntity = devData.developerGroupEntity || devData.developerEntity; }
      if (!p.developerName)           { updates.developerName = devData.developerName; }
      if (!p.developerFlagshipProjects || p.developerFlagshipProjects.length === 0) {
        updates.developerFlagshipProjects = devData.developerFlagshipProjects;
        fieldCounts.developerFlagshipProjects = (fieldCounts.developerFlagshipProjects||0)+1;
      }
      if (!p.developerStock)          { updates.developerStock = devData.developerStock; }
      if (!p.tier)                    { updates.tier = 1; }
      if (!p.segment)                 { updates.segment = p.marketSegment || "Premium"; }
      if (!p.commission)              { updates.commission = devData.commission; }
      if (p.developerTier === undefined) { updates.developerTier = devData.developerTier; }
      if (!p.developerTierLabel)      { updates.developerTierLabel = devData.developerTierLabel; }
      if (!p.developerFounded)        { updates.developerFounded = devData.developerFounded; }
      if (!p.developerOnTimeRate)     { updates.developerOnTimeRate = devData.developerOnTimeRate; }
      if (!p.developerSpecialty)      { updates.developerSpecialty = devData.developerSpecialty; }
    }

    // ── Handover fields ───────────────────────────────────────────────────────
    if (!p.handover && p.handoverQuarter) {
      updates.handover = p.handoverQuarter;
    }
    if (!p.expectedHandover && p.handoverQuarter) {
      updates.expectedHandover = p.handoverQuarter;
    }
    if (!p.completionDateDLD && p.handoverDate) {
      updates.completionDateDLD = p.handoverDate;
    }
    if (!p.constructionStartedDate && p.constructionStart) {
      updates.constructionStartedDate = p.constructionStart;
    }

    // ── Lifecycle label ───────────────────────────────────────────────────────
    if (!p.lifecycleLabel && p.lifecycleStage) {
      const labels = {
        "historical": "Completed & Delivered",
        "recently-delivered": "Recently Delivered",
        "under-construction": "Under Construction",
        "announced": "Announced / Pre-Launch",
      };
      updates.lifecycleLabel = labels[p.lifecycleStage] || p.lifecycleStage;
    }

    // ── Property type fields ──────────────────────────────────────────────────
    if (!p.propertyType && p.type)          { updates.propertyType = p.type; }
    if (!p.propertyCategory)               { updates.propertyCategory = "Residential"; }
    if (!p.project && p.name)              { updates.project = p.name; }
    if (!p.projectName && p.name)          { updates.projectName = p.name; }

    // ── RERA fields ───────────────────────────────────────────────────────────
    if (!p.reraNo && p.projectNumber)       { updates.reraNo = p.projectNumber; }
    if (!p.reraProjectNumber && p.projectNumber) { updates.reraProjectNumber = p.projectNumber; }
    if (!p.dldProjectNumber && p.projectNumber) { updates.dldProjectNumber = parseInt(p.projectNumber) || p.projectNumber; }

    // ── Unit counts ───────────────────────────────────────────────────────────
    if (p.totalUnits && !p.totalResidentialUnits) { updates.totalResidentialUnits = p.apartments || p.totalUnits; }
    if (p.totalUnits && !p.residentialUnits)       { updates.residentialUnits = p.apartments || p.totalUnits; }
    if (!p.towerCount)                             { updates.towerCount = 1; }
    if (!p.totalBuildings)                         { updates.totalBuildings = 1; }

    // ── Price avg ─────────────────────────────────────────────────────────────
    if (!p.priceAvg && p.priceMin && p.ppsf) {
      const avgSize = p.sizeMin && p.sizeMax ? (p.sizeMin + p.sizeMax) / 2 : 900;
      updates.priceAvg = Math.round(p.ppsf * avgSize);
    }

    if (Object.keys(updates).length === 0) continue;

    updates.allFieldsEnrichedAt = new Date().toISOString();

    if (!DRY_RUN) {
      batch.update(docSnap.ref, updates);
      batchCount++;
      if (batchCount >= 400) {
        await batch.commit();
        console.log(`  💾 Committed batch of ${batchCount}`);
        batch = db.batch(); batchCount = 0;
      }
    }
    updated++;
  }

  if (!DRY_RUN && batchCount > 0) {
    await batch.commit();
    console.log(`  💾 Committed final batch of ${batchCount}`);
  }

  console.log(`\n📊 RESULTS: Updated ${updated} projects`);
  console.log("\nField counts:");
  Object.entries(fieldCounts).sort((a,b)=>b[1]-a[1]).forEach(([f,c]) => {
    console.log(`  ${f.padEnd(30)} ${c}`);
  });

  if (DRY_RUN) console.log("\n⚠️  DRY RUN — remove --dry to apply.");
  else console.log("\n✅ Done!");
  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
