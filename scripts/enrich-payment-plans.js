/**
 * enrich-payment-plans.js
 * 
 * Enriches all 1,515 Firestore projects with:
 * - paymentPlan (e.g. "80/20", "60/40", "90/10")
 * - paymentPlanDetails (full breakdown text)
 * - postHandover (boolean)
 * - marketSegment (if missing)
 * - commission (if missing)
 * 
 * Strategy:
 * 1. Project-level exact match (known named projects)
 * 2. Developer + community match
 * 3. Developer default fallback
 * 
 * Run: node scripts/enrich-payment-plans.js --dry
 * Run: node scripts/enrich-payment-plans.js
 */

const admin = require("firebase-admin");
const sa = require("../serviceAccountKey.json");
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

const DRY_RUN = process.argv.includes("--dry");
const BATCH_SIZE = 400;

// ─── PROJECT-LEVEL KNOWN DATA ─────────────────────────────────────────────────
// Sourced from Property Finder / Bayut / developer portals (April 2026)
const PROJECT_DATA = {
  // EMAAR - Dubai Hills Estate
  "Golf Grand":              { paymentPlan: "90/10", postHandover: false, priceMin: 1360000, marketSegment: "Premium" },
  "Elvira":                  { paymentPlan: "80/20", postHandover: false, priceMin: 2320000 },
  "Parkside Views":          { paymentPlan: "90/10", postHandover: false, priceMin: 1450000 },
  "Hills Park":              { paymentPlan: "80/20", postHandover: false, priceMin: 1210000 },
  "Park Field":              { paymentPlan: "70/30", postHandover: false, priceMin: 1060000 },
  "Lime Gardens":            { paymentPlan: "80/20", postHandover: false, priceMin: 1120000 },
  "Parkland":                { paymentPlan: "80/20", postHandover: false, priceMin: 1500000 },
  "Park Gate":               { paymentPlan: "90/10", postHandover: false, priceMin: 10400000, marketSegment: "Ultra Luxury" },
  "Vida Residences Hillside": { paymentPlan: "80/20", postHandover: false, priceMin: 1800000 },
  "Parkwood":                { paymentPlan: "80/20", postHandover: false, priceMin: 1750000 },
  "Hillsedge":               { paymentPlan: "80/20", postHandover: false, priceMin: 1840000 },

  // EMAAR - Beachfront
  "Beach Mansion":           { paymentPlan: "12/58/10/20", postHandover: true,  priceMin: 2300000, marketSegment: "Luxury" },
  "Palace Beach Residence":  { paymentPlan: "10/55/5/30",  postHandover: true,  priceMin: 2400000, marketSegment: "Luxury" },
  "Beachgate by Address":    { paymentPlan: "10/70/20",    postHandover: false, priceMin: 2700000, marketSegment: "Ultra Luxury" },
  "Address The Bay":         { paymentPlan: "90/10",       postHandover: false, priceMin: 2950000, marketSegment: "Ultra Luxury" },
  "Seapoint Tower 1":        { paymentPlan: "90/10",       postHandover: false, priceMin: 2700000, marketSegment: "Ultra Luxury" },
  "Seapoint Tower 2":        { paymentPlan: "90/10",       postHandover: false, priceMin: 2700000, marketSegment: "Ultra Luxury" },

  // EMAAR - The Valley
  "Orania":                  { paymentPlan: "75/25", postHandover: false, priceMin: 1530000 },
  "Farm Gardens":            { paymentPlan: "80/20", postHandover: false, priceMin: 5100000, marketSegment: "Premium" },
  "Elora":                   { paymentPlan: "80/20", postHandover: false, priceMin: 1600000 },
  "Velora 2":                { paymentPlan: "80/20", postHandover: false, priceMin: 2930000 },
  "Kaia":                    { paymentPlan: "80/20", postHandover: false, priceMin: 2720000 },
  "Vindera":                 { paymentPlan: "90/10", postHandover: false, priceMin: 3000000 },

  // EMAAR - Emaar South
  "Golf Lane":               { paymentPlan: "80/20", postHandover: false, priceMin: 4480000, marketSegment: "Premium" },
  "Greenway":                { paymentPlan: "90/10", postHandover: false, priceMin: 3150000 },
  "Golf Meadows":            { paymentPlan: "80/20", postHandover: false, priceMin: 1100000 },
  "Expo Golf Villas 6":      { paymentPlan: "80/20", postHandover: false, priceMin: 1470000 },
  "Fairway Villas 3":        { paymentPlan: "90/10", postHandover: false, priceMin: 4390000, marketSegment: "Premium" },
  "Fairway Villas 2":        { paymentPlan: "10/75/15", postHandover: false, priceMin: 3300000 },
  "Fairway Villas":          { paymentPlan: "40/60", postHandover: false, priceMin: 3010000 },
  "Greenville 2":            { paymentPlan: "80/20", postHandover: false, priceMin: 1200000 },

  // NAKHEEL - Active projects
  "Palm Jebel Ali":          { paymentPlan: "20/50/30", postHandover: false, priceMin: 2500000, marketSegment: "Ultra Luxury" },
  "Como Residences":         { paymentPlan: "20/60/20", postHandover: false, priceMin: 33000000, marketSegment: "Ultra Luxury" },
  "Rixos Dubai Islands":     { paymentPlan: "20/60/20", postHandover: false, priceMin: 2600000, marketSegment: "Ultra Luxury" },
  "Bay Grove Residences":    { paymentPlan: "20/60/20", postHandover: false, priceMin: 2000000, marketSegment: "Luxury" },
  "Naya at District One":    { paymentPlan: "20/60/20", postHandover: false, priceMin: 1715000, marketSegment: "Luxury" },
  "Jebel Ali Village":       { paymentPlan: "80/20",    postHandover: false, priceMin: 5500000, marketSegment: "Premium" },

  // DAMAC - Active projects
  "Safa One":                { paymentPlan: "90/10", postHandover: false, priceMin: 1620000, marketSegment: "Luxury" },
  "Canal Heights":           { paymentPlan: "60/40", postHandover: false, priceMin: 1250000, marketSegment: "Luxury" },
  "Canal Heights 2":         { paymentPlan: "60/40", postHandover: false, priceMin: 1230000, marketSegment: "Luxury" },
  "Canal Crown":             { paymentPlan: "75/25", postHandover: false, priceMin: 1120000, marketSegment: "Luxury" },
  "Chic Tower":              { paymentPlan: "80/20", postHandover: false, priceMin: 823000,  marketSegment: "Mid-Market" },
  "Harbour Lights":          { paymentPlan: "80/20", postHandover: false, priceMin: 1540000, marketSegment: "Luxury" },
  "DAMAC Bay 2":             { paymentPlan: "60/40", postHandover: false, priceMin: 2900000, marketSegment: "Ultra Luxury" },
  "Cavalli Couture":         { paymentPlan: "60/40", postHandover: false, priceMin: 16500000, marketSegment: "Ultra Luxury" },
  "Golf Greens":             { paymentPlan: "80/20", postHandover: false, priceMin: 980000,  marketSegment: "Mid-Market" },
  "DAMAC Casa":              { paymentPlan: "80/20", postHandover: false, priceMin: 2500000, marketSegment: "Luxury" },
  "Marine 2":                { paymentPlan: "70/30", postHandover: false, priceMin: 888000,  marketSegment: "Mid-Market" },
  "DAMAC Islands":           { paymentPlan: "70/30", postHandover: false, priceMin: 2450000, marketSegment: "Luxury" },
  "Marbella":                { paymentPlan: "60/40", postHandover: false, priceMin: 2950000, marketSegment: "Luxury" },
  "Utopia":                  { paymentPlan: "60/40", postHandover: false, priceMin: 18100000, marketSegment: "Ultra Luxury" },
  "The Sapphire":            { paymentPlan: "70/30", postHandover: false, priceMin: 2160000, marketSegment: "Luxury" },
  "Safa Gate":               { paymentPlan: "70/30", postHandover: false, priceMin: 1990000, marketSegment: "Luxury" },
  "Chelsea Residences":      { paymentPlan: "60/40", postHandover: false, priceMin: 2170000, marketSegment: "Luxury" },

  // SOBHA
  "Sobha Reserve":           { paymentPlan: "60/40", postHandover: false, priceMin: 9300000, marketSegment: "Ultra Luxury" },
  "Sobha Elwood":            { paymentPlan: "60/40", postHandover: false, priceMin: 7930000, marketSegment: "Ultra Luxury" },
  "Delphine Beach Residences": { paymentPlan: "60/40", postHandover: false, priceMin: 1110000, marketSegment: "Luxury" },

  // MAJID AL FUTTAIM
  "Ghaf Woods":              { paymentPlan: "60/40", postHandover: false, priceMin: 1200000, marketSegment: "Premium" },
  "Tilal Al Ghaf":           { paymentPlan: "60/40", postHandover: false, priceMin: 2000000, marketSegment: "Premium" },

  // MEYDAN
  "Opal Gardens":            { paymentPlan: "10/50/40", postHandover: false, priceMin: 6000000, marketSegment: "Ultra Luxury" },
  "Canal Front Residences":  { paymentPlan: "20/40/40", postHandover: false, priceMin: 2600000, marketSegment: "Luxury" },
};

// ─── DEVELOPER DEFAULTS ────────────────────────────────────────────────────────
// Used when no project-level match found
const DEVELOPER_DEFAULTS = {
  "Emaar Properties": {
    paymentPlan: "80/20",
    paymentPlanDetails: "20% during construction + 10% on handover. Standard Emaar construction-linked plan.",
    postHandover: false,
    commission: 2,
    marketSegment: "Premium",
  },
  "Nakheel": {
    paymentPlan: "20/60/20",
    paymentPlanDetails: "20% booking + 60% during construction + 20% on handover.",
    postHandover: false,
    commission: 2,
    marketSegment: "Luxury",
  },
  "Dubai Properties": {
    paymentPlan: "80/20",
    paymentPlanDetails: "Typically 10% booking + 70% during construction + 20% on handover.",
    postHandover: false,
    commission: 2,
    marketSegment: "Mid-Market",
  },
  "Meydan Group": {
    paymentPlan: "10/50/40",
    paymentPlanDetails: "10% booking + 50% during construction + 40% on handover.",
    postHandover: false,
    commission: 2,
    marketSegment: "Luxury",
  },
  "Majid Al Futtaim": {
    paymentPlan: "60/40",
    paymentPlanDetails: "60% during construction + 40% on handover.",
    postHandover: false,
    commission: 2,
    marketSegment: "Premium",
  },
  "Dubai Airports Corporation": {
    paymentPlan: "80/20",
    paymentPlanDetails: "Standard construction-linked plan: 20% on handover.",
    postHandover: false,
    commission: 2,
    marketSegment: "Mid-Market",
  },
  "Dubai Sports City": {
    paymentPlan: "80/20",
    paymentPlanDetails: "Standard construction-linked plan.",
    postHandover: false,
    commission: 2,
    marketSegment: "Mid-Market",
  },
  "Damac Properties": {
    paymentPlan: "60/40",
    paymentPlanDetails: "60% during construction + 40% on handover. Some projects offer post-handover options.",
    postHandover: false,
    commission: 4,
    marketSegment: "Luxury",
  },
  "TECOM Investments": {
    paymentPlan: "80/20",
    paymentPlanDetails: "Standard construction-linked plan.",
    postHandover: false,
    commission: 2,
    marketSegment: "Mid-Market",
  },
  "Dubai Investments": {
    paymentPlan: "80/20",
    paymentPlanDetails: "Standard construction-linked plan.",
    postHandover: false,
    commission: 2,
    marketSegment: "Mid-Market",
  },
  "Union Properties": {
    paymentPlan: "80/20",
    paymentPlanDetails: "Standard construction-linked plan.",
    postHandover: false,
    commission: 2,
    marketSegment: "Mid-Market",
  },
  "Sobha Realty": {
    paymentPlan: "60/40",
    paymentPlanDetails: "60% during construction + 40% on handover. DLD fee waiver on all projects.",
    postHandover: false,
    commission: 3,
    marketSegment: "Premium",
  },
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function normalize(str) {
  if (!str) return "";
  return str.toUpperCase().replace(/[^A-Z0-9\s]/g, "").replace(/\s+/g, " ").trim();
}

function findProjectMatch(projectName) {
  const normName = normalize(projectName);
  for (const [key, val] of Object.entries(PROJECT_DATA)) {
    if (normalize(key) === normName) return val;
  }
  // Partial match
  for (const [key, val] of Object.entries(PROJECT_DATA)) {
    const normKey = normalize(key);
    if (normName.includes(normKey) || normKey.includes(normName)) return val;
  }
  return null;
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n🚀 Payment plan enrichment ${DRY_RUN ? "(DRY RUN)" : "(LIVE)"}`);

  const snapshot = await db.collection("projects").get();
  console.log(`📦 Loaded ${snapshot.size} projects`);

  let projectMatch = 0, devDefault = 0, noMatch = 0, skipped = 0;
  let batch = db.batch(), batchCount = 0, totalUpdated = 0;

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    const name = data.name || data.projectName || "";
    const developer = data.developer || "";

    // Already has payment plan
    if (data.paymentPlan) { skipped++; continue; }

    const updates = {};

    // Try project-level match first
    const projectMatch_ = findProjectMatch(name);
    if (projectMatch_) {
      if (projectMatch_.paymentPlan) updates.paymentPlan = projectMatch_.paymentPlan;
      if (projectMatch_.postHandover !== undefined) updates.postHandover = projectMatch_.postHandover;
      if (projectMatch_.priceMin && !data.priceMin) updates.priceMin = projectMatch_.priceMin;
      if (projectMatch_.marketSegment && !data.marketSegment) updates.marketSegment = projectMatch_.marketSegment;
      updates.paymentPlanSource = "project-research-2026";
      projectMatch++;
    } else {
      // Fall back to developer default
      const devDef = DEVELOPER_DEFAULTS[developer];
      if (devDef) {
        if (devDef.paymentPlan)        updates.paymentPlan        = devDef.paymentPlan;
        if (devDef.paymentPlanDetails) updates.paymentPlanDetails = devDef.paymentPlanDetails;
        if (devDef.postHandover !== undefined) updates.postHandover = devDef.postHandover;
        if (devDef.commission && !data.commission) updates.commission = devDef.commission;
        if (devDef.marketSegment && !data.marketSegment) updates.marketSegment = devDef.marketSegment;
        updates.paymentPlanSource = "developer-default-2026";
        devDefault++;
      } else {
        noMatch++;
        continue;
      }
    }

    if (Object.keys(updates).length === 0) continue;

    updates.paymentPlanEnrichedAt = new Date().toISOString();

    if (totalUpdated < 5) {
      const src = updates.paymentPlanSource;
      console.log(`  [${src}] "${name}" (${developer}) -> ${updates.paymentPlan}`);
    }

    if (!DRY_RUN) {
      batch.update(docSnap.ref, updates);
      batchCount++;
      if (batchCount >= BATCH_SIZE) {
        await batch.commit();
        console.log(`  💾 Committed batch of ${batchCount}`);
        batch = db.batch(); batchCount = 0;
      }
    }
    totalUpdated++;
  }

  if (!DRY_RUN && batchCount > 0) {
    await batch.commit();
    console.log(`  💾 Committed final batch of ${batchCount}`);
  }

  console.log(`\n📊 RESULTS:`);
  console.log(`  Project-level match: ${projectMatch}`);
  console.log(`  Developer default:   ${devDefault}`);
  console.log(`  No match:            ${noMatch}`);
  console.log(`  Already had plan:    ${skipped}`);
  console.log(`  Total updated:       ${totalUpdated}`);

  if (DRY_RUN) {
    console.log("\n⚠️  DRY RUN — no writes made. Remove --dry to apply.");
  } else {
    console.log("\n✅ Done!");
  }
  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
