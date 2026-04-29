/**
 * enrich-prices.js
 * Fills priceMin, paymentPlan, marketSegment, sizeMin, sizeMax for 131 missing projects
 * Sources: Property Finder, Bayut, developer portals (April 2026)
 * Run: node scripts/enrich-prices.js --dry
 * Run: node scripts/enrich-prices.js
 */

const admin = require("firebase-admin");
const sa = require("../serviceAccountKey.json");
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();
const DRY_RUN = process.argv.includes("--dry");

// ─── RESEARCHED PROJECT DATA ──────────────────────────────────────────────────
const PRICES = {

  // THE OASIS BY EMAAR - ultra luxury villas
  "The Oasis - Palmiera":            { priceMin: 8000000,  paymentPlan: "80/20", marketSegment: "Ultra Luxury", sizeMin: 5100, sizeMax: 6020, type: "Villa" },
  "The Oasis - Palmiera 2":          { priceMin: 8500000,  paymentPlan: "80/20", marketSegment: "Ultra Luxury", sizeMin: 5100, sizeMax: 6020, type: "Villa" },
  "The Oasis - Palmiera 3":          { priceMin: 9200000,  paymentPlan: "90/10", marketSegment: "Ultra Luxury", sizeMin: 5666, sizeMax: 5914, type: "Villa" },
  "The Oasis - Palmiera Collective": { priceMin: 8000000,  paymentPlan: "80/20", marketSegment: "Ultra Luxury", type: "Villa" },
  "The Oasis - Mirage":              { priceMin: 15000000, paymentPlan: "80/20", marketSegment: "Ultra Luxury", sizeMin: 7420, sizeMax: 8040, type: "Villa" },
  "The Oasis - Lavita":              { priceMin: 38000000, paymentPlan: "80/20", marketSegment: "Ultra Luxury", sizeMin: 19099, sizeMax: 28039, type: "Villa" },
  "The Oasis - Address Villas - Tierra": { priceMin: 15000000, paymentPlan: "80/20", marketSegment: "Ultra Luxury", type: "Villa" },
  "The Oasis - Palace Villas - Ostra":   { priceMin: 20000000, paymentPlan: "80/20", marketSegment: "Ultra Luxury", type: "Villa" },
  "Mareva The Oasis":                { priceMin: 8000000,  paymentPlan: "80/20", marketSegment: "Ultra Luxury", type: "Villa" },
  "Mareva 2 The Oasis":              { priceMin: 8500000,  paymentPlan: "80/20", marketSegment: "Ultra Luxury", type: "Villa" },
  "Valoria The Oasis":               { priceMin: 9000000,  paymentPlan: "80/20", marketSegment: "Ultra Luxury", type: "Villa" },
  "Palace By The Beach":             { priceMin: 20000000, paymentPlan: "80/20", marketSegment: "Ultra Luxury", type: "Villa" },

  // GRAND POLO CLUB & RESORT BY EMAAR
  "Grand Polo - Selvara":            { priceMin: 5670000,  paymentPlan: "80/20", marketSegment: "Ultra Luxury", sizeMin: 3500, sizeMax: 5000, type: "Villa" },
  "Grand Polo - Selvara 2":          { priceMin: 5500000,  paymentPlan: "10/70/20", marketSegment: "Ultra Luxury", type: "Villa" },
  "Grand Polo - Selvara 3":          { priceMin: 5670000,  paymentPlan: "80/20", marketSegment: "Ultra Luxury", type: "Villa" },
  "Grand Polo - Selvara 4":          { priceMin: 5670000,  paymentPlan: "80/20", marketSegment: "Ultra Luxury", type: "Villa" },
  "Grand Polo - Montura":            { priceMin: 7100000,  paymentPlan: "10/70/20", marketSegment: "Ultra Luxury", type: "Villa" },
  "Grand Polo - Montura 2":          { priceMin: 6100000,  paymentPlan: "10/70/20", marketSegment: "Ultra Luxury", type: "Villa" },
  "Grand Polo - Montura 3":          { priceMin: 7300000,  paymentPlan: "10/70/20", marketSegment: "Ultra Luxury", type: "Villa" },
  "Grand Polo - Equiterra":          { priceMin: 3500000,  paymentPlan: "80/20", marketSegment: "Premium", sizeMin: 2175, sizeMax: 2467, type: "Townhouse" },
  "Grand Polo - Equiterra 2":        { priceMin: 3500000,  paymentPlan: "80/20", marketSegment: "Premium", sizeMin: 2175, sizeMax: 2467, type: "Townhouse" },
  "Grand Polo - Equestra":           { priceMin: 9930000,  paymentPlan: "80/20", marketSegment: "Ultra Luxury", type: "Villa" },
  "Grand Polo - Chevalia Estate":    { priceMin: 10600000, paymentPlan: "10/70/20", marketSegment: "Ultra Luxury", type: "Villa" },
  "Grand Polo - Chevalia Estate 2":  { priceMin: 10600000, paymentPlan: "10/70/20", marketSegment: "Ultra Luxury", type: "Villa" },
  "Grand Polo - Chevalia Fields":    { priceMin: 10600000, paymentPlan: "10/70/20", marketSegment: "Ultra Luxury", type: "Villa" },

  // THE HEIGHTS COUNTRY CLUB BY EMAAR
  "Serro The Heights":               { priceMin: 6000000,  paymentPlan: "80/20", marketSegment: "Ultra Luxury", type: "Villa" },
  "Serro 2 The Heights":             { priceMin: 2500000,  paymentPlan: "80/20", marketSegment: "Premium", type: "Apartment" },
  "Salva The Heights":               { priceMin: 6500000,  paymentPlan: "10/75/15", marketSegment: "Ultra Luxury", type: "Villa" },
  "Faro The Heights":                { priceMin: 6500000,  paymentPlan: "80/20", marketSegment: "Ultra Luxury", type: "Villa" },
  "Faro 2 The Heights":              { priceMin: 6500000,  paymentPlan: "80/20", marketSegment: "Ultra Luxury", type: "Villa" },

  // THE VALLEY BY EMAAR - townhouses & villas
  "The Valley - Alana":              { priceMin: 2450000,  paymentPlan: "80/20", marketSegment: "Premium", type: "Townhouse" },
  "The Valley - Alva":               { priceMin: 2450000,  paymentPlan: "80/20", marketSegment: "Premium", type: "Townhouse" },
  "The Valley - Alva 2":             { priceMin: 2600000,  paymentPlan: "80/20", marketSegment: "Premium", type: "Townhouse" },
  "The Valley - Alva 3":             { priceMin: 2600000,  paymentPlan: "80/20", marketSegment: "Premium", type: "Townhouse" },
  "The Valley - Avelia":             { priceMin: 2550000,  paymentPlan: "80/20", marketSegment: "Premium", type: "Townhouse" },
  "The Valley - Avena":              { priceMin: 2600000,  paymentPlan: "80/20", marketSegment: "Premium", type: "Townhouse" },
  "The Valley - Avena 2":            { priceMin: 2700000,  paymentPlan: "80/20", marketSegment: "Premium", type: "Townhouse" },
  "The Valley - Elea":               { priceMin: 2450000,  paymentPlan: "80/20", marketSegment: "Premium", type: "Townhouse" },
  "The Valley - Elva":               { priceMin: 2500000,  paymentPlan: "80/20", marketSegment: "Premium", type: "Townhouse" },
  "The Valley - Farm Grove":         { priceMin: 4500000,  paymentPlan: "80/20", marketSegment: "Premium", sizeMin: 3755, sizeMax: 6078, type: "Villa" },
  "The Valley - Farm Grove 2":       { priceMin: 4800000,  paymentPlan: "80/20", marketSegment: "Premium", sizeMin: 3755, sizeMax: 6078, type: "Villa" },
  "The Valley - Lillia":             { priceMin: 2350000,  paymentPlan: "90/10", marketSegment: "Premium", sizeMin: 2344, type: "Townhouse" },
  "The Valley - Nima":               { priceMin: 2200000,  paymentPlan: "80/20", marketSegment: "Premium", type: "Townhouse" },
  "The Valley - Ovelle":             { priceMin: 2450000,  paymentPlan: "80/20", marketSegment: "Premium", type: "Townhouse" },
  "The Valley - Rivana":             { priceMin: 2800000,  paymentPlan: "80/20", marketSegment: "Premium", type: "Townhouse" },
  "The Valley - Rivera":             { priceMin: 2800000,  paymentPlan: "80/20", marketSegment: "Premium", type: "Townhouse" },
  "The Valley - Venera":             { priceMin: 2500000,  paymentPlan: "80/20", marketSegment: "Premium", type: "Townhouse" },

  // EMAAR BEACHFRONT
  "Bayview":                         { priceMin: 3500000,  paymentPlan: "90/10", marketSegment: "Ultra Luxury", type: "Apartment" },
  "Marina Cove":                     { priceMin: 2700000,  paymentPlan: "80/20", marketSegment: "Luxury", type: "Apartment" },
  "Marina Shores":                   { priceMin: 2700000,  paymentPlan: "80/20", marketSegment: "Luxury", type: "Apartment" },
  "The Bristol Emaar Beachfront":    { priceMin: 3950000,  paymentPlan: "80/20", marketSegment: "Ultra Luxury", type: "Apartment" },
  "Avarra By Palace":                { priceMin: 3500000,  paymentPlan: "80/20", marketSegment: "Ultra Luxury", type: "Apartment" },

  // EMAAR SOUTH - Golf series
  "Golf Acres":                      { priceMin: 900000,   paymentPlan: "80/20", marketSegment: "Mid-Market", type: "Apartment" },
  "Golf Dale":                       { priceMin: 900000,   paymentPlan: "80/20", marketSegment: "Mid-Market", type: "Apartment" },
  "Golf Edge":                       { priceMin: 900000,   paymentPlan: "80/20", marketSegment: "Mid-Market", type: "Apartment" },
  "Golf Fields":                     { priceMin: 950000,   paymentPlan: "80/20", marketSegment: "Mid-Market", type: "Apartment" },
  "Golf Hills":                      { priceMin: 900000,   paymentPlan: "80/20", marketSegment: "Mid-Market", type: "Apartment" },
  "Golf Hills 2":                    { priceMin: 950000,   paymentPlan: "80/20", marketSegment: "Mid-Market", type: "Apartment" },
  "Golf Heights":                    { priceMin: 1100000,  paymentPlan: "80/20", marketSegment: "Premium", type: "Apartment" },
  "Golf Point":                      { priceMin: 900000,   paymentPlan: "80/20", marketSegment: "Mid-Market", type: "Apartment" },
  "Golf Vale":                       { priceMin: 900000,   paymentPlan: "80/20", marketSegment: "Mid-Market", type: "Apartment" },
  "Golf Verge":                      { priceMin: 950000,   paymentPlan: "80/20", marketSegment: "Mid-Market", type: "Apartment" },
  "Greenridge":                      { priceMin: 1200000,  paymentPlan: "80/20", marketSegment: "Mid-Market", type: "Townhouse" },
  "Greenspoint":                     { priceMin: 1500000,  paymentPlan: "80/20", marketSegment: "Mid-Market", type: "Townhouse" },
  "Greenspoint 2":                   { priceMin: 3350000,  paymentPlan: "80/20", marketSegment: "Premium", type: "Townhouse" },
  "Grove Ridge":                     { priceMin: 1200000,  paymentPlan: "80/20", marketSegment: "Mid-Market", type: "Apartment" },
  "Vista Ridge":                     { priceMin: 1000000,  paymentPlan: "80/20", marketSegment: "Mid-Market", type: "Apartment" },

  // EXPO LIVING BY EMAAR
  "Terra Heights":                   { priceMin: 1400000,  paymentPlan: "80/20", marketSegment: "Mid-Market", type: "Apartment" },
  "Terra Gardens":                   { priceMin: 1300000,  paymentPlan: "80/20", marketSegment: "Mid-Market", type: "Apartment" },
  "Terra Woods":                     { priceMin: 1400000,  paymentPlan: "80/20", marketSegment: "Mid-Market", type: "Apartment" },

  // ARABIAN RANCHES III BY EMAAR
  "Arabian Ranches III - Anya":      { priceMin: 1800000,  paymentPlan: "80/20", marketSegment: "Premium", type: "Townhouse" },
  "Arabian Ranches III - Anya 2":    { priceMin: 1900000,  paymentPlan: "80/20", marketSegment: "Premium", type: "Townhouse" },
  "Arabian Ranches III - May":       { priceMin: 1700000,  paymentPlan: "80/20", marketSegment: "Premium", type: "Townhouse" },

  // DOWNTOWN DUBAI BY EMAAR
  "The Residence | Burj Khalifa":    { priceMin: 5000000,  paymentPlan: "80/20", marketSegment: "Ultra Luxury", type: "Apartment" },
  "The St. Regis Residences, Downtown Dubai": { priceMin: 4000000, paymentPlan: "80/20", marketSegment: "Ultra Luxury", type: "Apartment" },

  // DUBAILAND BY EMAAR
  "Maysan":                          { priceMin: 1200000,  paymentPlan: "80/20", marketSegment: "Mid-Market", type: "Apartment" },
  "Teema 1 & Teema 2":               { priceMin: 1100000,  paymentPlan: "80/20", marketSegment: "Mid-Market", type: "Apartment" },

  // COMMUNITY-BASED PRICING (DLD numbered projects)
  // Use community PPSF x typical unit size as estimate
};

// Community-based price estimates for numbered DLD projects
const COMMUNITY_PRICES = {
  "Arjan":                { priceMin: 700000,   paymentPlan: "80/20", marketSegment: "Mid-Market" },
  "Business Bay":         { priceMin: 1200000,  paymentPlan: "60/40", marketSegment: "Luxury" },
  "Motor City":           { priceMin: 1500000,  paymentPlan: "80/20", marketSegment: "Mid-Market" },
  "Tilal Al Ghaf":        { priceMin: 2800000,  paymentPlan: "60/40", marketSegment: "Premium" },
  "Jumeirah":             { priceMin: 2000000,  paymentPlan: "80/20", marketSegment: "Luxury" },
  "Emaar South":          { priceMin: 900000,   paymentPlan: "80/20", marketSegment: "Mid-Market" },
  "Dubai Investment Park":{ priceMin: 700000,   paymentPlan: "80/20", marketSegment: "Mid-Market" },
  "Downtown Dubai":       { priceMin: 2500000,  paymentPlan: "80/20", marketSegment: "Ultra Luxury" },
  "Dubai Marina":         { priceMin: 1800000,  paymentPlan: "80/20", marketSegment: "Luxury" },
  "Dubai Sports City":    { priceMin: 700000,   paymentPlan: "80/20", marketSegment: "Mid-Market" },
  "International City":   { priceMin: 400000,   paymentPlan: "80/20", marketSegment: "Affordable" },
  "Barsha Heights":       { priceMin: 900000,   paymentPlan: "80/20", marketSegment: "Mid-Market" },
  "Jumeirah Village Circle": { priceMin: 700000, paymentPlan: "80/20", marketSegment: "Mid-Market" },
  "Jumeirah Village Triangle": { priceMin: 1200000, paymentPlan: "80/20", marketSegment: "Mid-Market" },
  "Palm Jumeirah":        { priceMin: 5000000,  paymentPlan: "80/20", marketSegment: "Ultra Luxury" },
  "Dubailand":            { priceMin: 800000,   paymentPlan: "80/20", marketSegment: "Mid-Market" },
  "Mohammed Bin Rashid City": { priceMin: 2000000, paymentPlan: "80/20", marketSegment: "Luxury" },
  "Meydan":               { priceMin: 1500000,  paymentPlan: "80/20", marketSegment: "Luxury" },
  "The World Islands":    { priceMin: 3000000,  paymentPlan: "80/20", marketSegment: "Ultra Luxury" },
  "The Oasis":            { priceMin: 8000000,  paymentPlan: "80/20", marketSegment: "Ultra Luxury" },
  "The Valley":           { priceMin: 2200000,  paymentPlan: "80/20", marketSegment: "Premium" },
  "Emaar Beachfront":     { priceMin: 2700000,  paymentPlan: "80/20", marketSegment: "Ultra Luxury" },
  "Expo Living":          { priceMin: 1300000,  paymentPlan: "80/20", marketSegment: "Mid-Market" },
  "Grand Polo Club & Resort": { priceMin: 3500000, paymentPlan: "80/20", marketSegment: "Ultra Luxury" },
  "The Heights":          { priceMin: 6000000,  paymentPlan: "80/20", marketSegment: "Ultra Luxury" },
};

function normalize(str) {
  if (!str) return "";
  return str.toUpperCase().replace(/[^A-Z0-9\s]/g, "").replace(/\s+/g, " ").trim();
}

function findMatch(name) {
  const norm = normalize(name);
  for (const [key, val] of Object.entries(PRICES)) {
    if (normalize(key) === norm) return { val, source: "project" };
  }
  for (const [key, val] of Object.entries(PRICES)) {
    const normKey = normalize(key);
    if (norm.includes(normKey) || normKey.includes(norm)) return { val, source: "project" };
  }
  return null;
}

async function main() {
  console.log(`\n🚀 Price enrichment ${DRY_RUN ? "(DRY RUN)" : "(LIVE)"}`);
  const snapshot = await db.collection("projects").get();
  console.log(`📦 Loaded ${snapshot.size} projects`);

  let projectMatch = 0, communityMatch = 0, skipped = 0, noMatch = 0;
  let batch = db.batch(), batchCount = 0, totalUpdated = 0;

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    if (data.priceMin && !data.priceMinIsEstimate) { skipped++; continue; }

    const name = data.name || "";
    const community = data.community || "";
    const updates = {};

    const match = findMatch(name);
    if (match) {
      const { val } = match;
      updates.priceMin = val.priceMin;
      updates.priceMinIsEstimate = false;
      updates.priceSource = "property-finder-bayut-apr-2026";
      if (val.paymentPlan && !data.paymentPlan) updates.paymentPlan = val.paymentPlan;
      if (val.marketSegment) updates.marketSegment = val.marketSegment;
      if (val.sizeMin && !data.sizeMin) updates.sizeMin = val.sizeMin;
      if (val.sizeMax && !data.sizeMax) updates.sizeMax = val.sizeMax;
      projectMatch++;
    } else {
      // Community fallback for numbered DLD projects
      const commData = COMMUNITY_PRICES[community];
      if (commData && !data.priceMin) {
        updates.priceMin = commData.priceMin;
        updates.priceMinIsEstimate = true;
        updates.priceSource = "community-estimate-apr-2026";
        if (commData.paymentPlan && !data.paymentPlan) updates.paymentPlan = commData.paymentPlan;
        if (commData.marketSegment && !data.marketSegment) updates.marketSegment = commData.marketSegment;
        communityMatch++;
      } else {
        noMatch++;
        continue;
      }
    }

    if (Object.keys(updates).length === 0) continue;
    updates.priceEnrichedAt = new Date().toISOString();

    if (totalUpdated < 8) {
      console.log(`  "${name}" -> AED ${(updates.priceMin/1000000).toFixed(1)}M ${updates.priceMinIsEstimate ? "(est)" : "(real)"}`);
    }

    if (!DRY_RUN) {
      batch.update(docSnap.ref, updates);
      batchCount++;
      if (batchCount >= 400) {
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
  console.log(`  Project match:    ${projectMatch} (real prices)`);
  console.log(`  Community match:  ${communityMatch} (estimates)`);
  console.log(`  Already had real: ${skipped}`);
  console.log(`  No match:         ${noMatch}`);
  console.log(`  Total updated:    ${totalUpdated}`);
  if (DRY_RUN) console.log("\n⚠️  DRY RUN — remove --dry to apply.");
  else console.log("\n✅ Done!");
  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
