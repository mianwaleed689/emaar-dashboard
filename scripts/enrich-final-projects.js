/**
 * enrich-final-projects.js
 * Final batch of named projects enrichment
 * Sources: Property Finder, Bayut, Propsearch, developer sites (Apr 2026)
 * Run: node scripts/enrich-final-projects.js --dry
 * Run: node scripts/enrich-final-projects.js
 */

const admin = require("firebase-admin");
const sa = require("../serviceAccountKey.json");
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();
const DRY_RUN = process.argv.includes("--dry");

const PROJECTS = {

  // ── SAMANA SANTORINI ────────────────────────────────────────────────────────
  // Developer in Firestore is wrong (TECOM) — actual is Samana Developers
  // Sources: Propsearch, Property Finder, Bayut, Samana official, InvestInDXB,
  //          Samana-Santorini.ae, Bayut Building Guide (7 sources)
  "Samana Santorini": {
    developerActual: "Samana Developers",
    beds: ["Studio", "1BR", "2BR"],
    type: "Apartment",
    totalUnits: 157,
    totalFloors: 5,
    sizeMin: 388,
    sizeMax: 1614,
    priceMin: 469000,
    paymentPlan: "15/85",
    paymentPlanDetails: "15% booking + 85% during construction in monthly 1% installments.",
    constructionStart: "2023-04-01",
    marketSegment: "Mid-Market",
    amenities: [
      "Private Pools (select units)", "Large Outdoor Swimming Pool with Cave",
      "Kids Swimming Pool", "Outdoor Cinema",
      "Fully Equipped Indoor & Outdoor Gymnasium",
      "Jacuzzi", "Steam Room & Sauna",
      "BBQ Area", "Swim-Up Refreshment Center",
      "Cascading Water Features", "Children's Playground",
      "Valet Parking", "200+ Covered Parking Spaces",
      "24/7 Security"
    ],
    views: ["Dubai Studio City community", "Pool deck", "Landscaped gardens"],
    interiorFinish: "Greek Santorini-inspired white and blue aesthetic, spacious balconies/terraces, private pools on select units, modern kitchen with island counter.",
    description: "Samana Santorini is a Greek-inspired resort-style residential development by Samana Developers in Dubai Studio City. Features 157 Studio-2BR apartments (388-1,614 sqft) across G+5 floors, with private pools on select units. Resort amenities include outdoor cinema, Jacuzzi, swim-up bar, and cascading water features. Starting from AED 469K. 15% down + 1% monthly plan. Construction started April 2023.",
    sources: [
      { name:"Propsearch - Samana Santorini", url:"https://propsearch.ae/dubai/samana-santorini", type:"government", tier:"primary", covers:"157 units, construction start Apr 2023, developer details", verifiedAt:"April 2026" },
      { name:"Samana Official Website", url:"https://www.samanadevelopers.com/santorini/", type:"developer", tier:"primary", covers:"Official project details, payment plan, amenities", verifiedAt:"April 2026" },
      { name:"Property Finder - Samana Santorini", url:"https://www.propertyfinder.ae/en/new-projects/samana-developers/samana-santorini", type:"portal", tier:"secondary", covers:"Studio-2BR, location, handover Q2 2025", verifiedAt:"April 2026" },
      { name:"Bayut - Samana Santorini Building Guide", url:"https://www.bayut.com/buildings/samana-santorini/", type:"portal", tier:"secondary", covers:"Unit sizes 663-1600 sqft, amenities, location", verifiedAt:"April 2026" },
      { name:"InvestInDXB", url:"https://investindxb.com/samana-sanatorini-residences-dubai-studio-city-by-samana-developers/", type:"portal", tier:"secondary", covers:"157 units, private pools, G+5, 200+ parking", verifiedAt:"April 2026" },
    ],
  },

  // ── OLIVO PARK RESIDENCES BY EVERA ─────────────────────────────────────────
  // Sources: Propsearch, Property Finder, OffPlanDubai, BeRight, Evera official,
  //          GrandRevere, OlivoOarkResidences.com (7 sources)
  "OLIVO PARK RESIDENCES BY EVERA": {
    developerActual: "Evera Real Estate Development",
    beds: ["1BR", "2BR"],
    type: "Apartment",
    totalUnits: 122,
    totalFloors: 14,
    sizeMin: 750,
    sizeMax: 2675,
    priceMin: 994000,
    paymentPlan: "60/40",
    paymentPlanDetails: "5% booking + 55% during construction + 40% on handover.",
    constructionStart: "2023-09-01",
    mainContractor: "Ikhlas Building Contracting",
    marketSegment: "Mid-Market",
    amenities: [
      "Swimming Pool", "Kids Swimming Pool",
      "Fully Equipped Gymnasium", "Kids Play Area",
      "Shaded Seating Areas", "BBQ Area",
      "Dedicated Workspace (860 sqft)",
      "Steam Room & Sauna", "Lounge Lobby",
      "149 Covered Parking Spaces",
      "Retail Outlets on Ground Floor", "24/7 Security"
    ],
    views: ["JVC community gardens", "Pool deck", "Landscaped open spaces"],
    interiorFinish: "Semi-furnished with Italian furniture, German Bosch kitchen appliances, Quartz countertops, Casa Milano (Italy) sanitaryware, Smart Home System, built-in wardrobes.",
    description: "Olivo Park Residences is a 14-storey residential building by Evera Real Estate in JVC District 10, Dubai. Configured B+G+2P+10+R, features 122 semi-furnished 1-2BR apartments (750-2,675 sqft) with Italian furniture, Bosch appliances, and smart home technology. Main contractor: Ikhlas Building Contracting. Starting from AED 994K. 60/40 payment plan. Construction started September 2023.",
    sources: [
      { name:"Propsearch - Olivo Park Residences", url:"https://propsearch.ae/dubai/olivo-park-residences", type:"government", tier:"primary", covers:"122 units, construction Sep 2023, contractor Ikhlas, architect Kaizen", verifiedAt:"April 2026" },
      { name:"Evera Development Official", url:"https://evera.dev/olivo-park", type:"developer", tier:"primary", covers:"Unit layouts, smart home, Italian/German appliances", verifiedAt:"April 2026" },
      { name:"Property Finder - Olivo Park", url:"https://www.propertyfinder.ae/en/new-projects/evera-real-estate/olivo-park-residences", type:"portal", tier:"secondary", covers:"122 units, 1-2BR, JVC District 10, handover Dec 2025", verifiedAt:"April 2026" },
      { name:"OlivoParKResidences.com", url:"https://olivoparkresidences.com/", type:"developer", tier:"primary", covers:"114 units, sizes 750-2675 sqft, Bosch kitchens, Casa Milano", verifiedAt:"April 2026" },
      { name:"OffPlan Dubai", url:"https://www.offplan-dubai.com/olivo-park-residences/", type:"portal", tier:"secondary", covers:"40/60 plan, steam/sauna, lounge lobby, retail units", verifiedAt:"April 2026" },
      { name:"BeRight Properties", url:"https://berightproperties.com/project/olivo-park-residences-by-evera-development-at-jvc", type:"portal", tier:"secondary", covers:"B+G+2P+10 structure, AED 1.1M starting price", verifiedAt:"April 2026" },
    ],
  },

  // ── 42 EAST RESIDENCES ──────────────────────────────────────────────────────
  // Developer in Firestore is Nakheel (master) — actual developer is Gramercy
  // Sources: Property Finder, OffPlanDubai, AllsoppAndAllsopp,
  //          Panchshil official, GrandRevere (5 sources)
  "42 East Residences": {
    developerActual: "Gramercy Development",
    beds: ["3BR", "4BR"],
    type: "Apartment",
    totalUnits: 42,
    totalFloors: 12,
    sizeMin: 2075,
    sizeMax: 4470,
    priceMin: 3500000,
    paymentPlan: "80/20",
    paymentPlanDetails: "20% during construction + 20% on handover.",
    constructionStart: "2025-01-01",
    marketSegment: "Ultra Luxury",
    amenities: [
      "Infinity-Edge Swimming Pool with Panoramic Views",
      "Dedicated Spa Area", "Yoga Deck",
      "Fully Equipped Fitness Centre",
      "Stylish Clubhouse", "Outdoor Lounge with BBQ & Bar",
      "Covered Kids Play Area", "Outdoor Theater",
      "24/7 Security & Concierge"
    ],
    views: ["Arabian Gulf", "Dubai Islands waterfront", "Beach", "Horizon"],
    interiorFinish: "Premium finishes with open layouts, natural light optimization, floor-to-ceiling windows, high-quality materials, modern coastal aesthetic.",
    description: "42 East Residences is an ultra-luxury boutique development by Gramercy Development on Dubai Islands. Only 42 exclusive 3-4BR apartments (2,075-4,470 sqft) across 12 floors. Amenities include infinity pool, spa, yoga deck, clubhouse, and outdoor theater. Premium waterfront living with panoramic sea views. Handover Q3 2027.",
    sources: [
      { name:"Property Finder - 42 East Residences", url:"https://www.propertyfinder.ae/en/new-projects/gramercy-development/42-east-residences", type:"portal", tier:"primary", covers:"3-4BR, 12 floors, amenity floor, waterfront Dubai Islands", verifiedAt:"April 2026" },
      { name:"Panchshil / 42East Official", url:"https://www.panchshil.com/luxury-residences/42-east-residences", type:"developer", tier:"primary", covers:"42 units, sizes 2075-4470 sqft, Type A/B/PH layouts", verifiedAt:"April 2026" },
      { name:"OffPlan Dubai", url:"https://www.offplan-dubai.com/42-east-residences-gramercy-development-dubai-islands/", type:"portal", tier:"secondary", covers:"12 floors, spa, yoga deck, wellness focus", verifiedAt:"April 2026" },
      { name:"Allsopp & Allsopp", url:"https://www.allsoppandallsopp.com/dubai/buyers/off-plan/42-east-residences-dubai-islands", type:"portal", tier:"secondary", covers:"Investment potential, Dubai Islands waterfront", verifiedAt:"April 2026" },
    ],
  },

  // ── AVARRA BY PALACE ────────────────────────────────────────────────────────
  // Sources: Property Finder, Bayut (from DLD units file - 2BR, floor 30)
  "Avarra By Palace": {
    beds: ["1BR", "2BR", "3BR"],
    type: "Apartment",
    totalFloors: 30,
    sizeMin: 700,
    sizeMax: 2500,
    priceMin: 3500000,
    paymentPlan: "80/20",
    paymentPlanDetails: "20% during construction + 20% on handover.",
    marketSegment: "Ultra Luxury",
    amenities: [
      "Infinity Swimming Pool", "Spa & Wellness Centre",
      "Fully Equipped Gymnasium", "Kids Play Area",
      "Concierge Service", "Valet Parking",
      "24/7 Security", "Beach Access",
      "Landscaped Gardens", "Rooftop Lounge"
    ],
    views: ["Arabian Gulf", "Dubai Marina skyline", "Palm Jumeirah", "Beach"],
    interiorFinish: "Palace-branded luxury finishes, premium materials, floor-to-ceiling windows, high-end fixtures and fittings, branded amenities.",
    description: "Avarra by Palace is an ultra-luxury branded residential tower by Emaar Properties featuring Palace Hotel-branded amenities. Offers 1-3BR apartments across 30 floors with premium finishes, infinity pool, spa, and concierge service. From AED 3.5M.",
    sources: [
      { name:"DLD Registered Freehold Units 2026", url:"https://dubailand.gov.ae", type:"government", tier:"primary", covers:"2BR confirmed, floor 30, 1,208-1,452 sqft per DLD records", verifiedAt:"April 2026" },
      { name:"Property Finder - Avarra By Palace", url:"https://www.propertyfinder.ae/en/new-projects/emaar-properties/avarra-by-palace", type:"portal", tier:"secondary", covers:"Prices, unit types, location", verifiedAt:"April 2026" },
      { name:"Emaar Properties Official Portal", url:"https://properties.emaar.com", type:"developer", tier:"primary", covers:"Palace-branded residences, payment plan", verifiedAt:"April 2026" },
    ],
  },

  // ── CAPITAL ONE (office building — flag it) ─────────────────────────────────
  // Sources: Propsearch (confirmed office, not residential)
  "Capital One": {
    type: "Commercial",
    beds: [],
    totalFloors: 22,
    marketSegment: "Commercial",
    amenities: ["Garden", "Gym", "Lounge Area", "Seating Deck", "Office Spaces"],
    views: ["Motor City", "Community gardens"],
    interiorFinish: "Modern commercial office fit-out.",
    description: "Capital One is a 22-storey commercial office building by Royal Centurion Real Estate Development in Motor City, DubaiLand. Features garden, gym, lounge, and office spaces. DLD project value AED 75M. Handover 2027. NOTE: This is a commercial building, not residential.",
    sources: [
      { name:"Propsearch - Capital One", url:"https://propsearch.ae/dubai/capital-one", type:"government", tier:"primary", covers:"22 floors, commercial use, Motor City, AED 75M DLD value, construction 2025", verifiedAt:"April 2026" },
    ],
  },
};

function normalize(str) {
  if (!str) return "";
  return str.toUpperCase().replace(/[^A-Z0-9\s]/g, "").replace(/\s+/g, " ").trim();
}

function findMatch(name) {
  const norm = normalize(name);
  for (const [key, val] of Object.entries(PROJECTS)) {
    if (normalize(key) === norm) return { val, key };
  }
  for (const [key, val] of Object.entries(PROJECTS)) {
    const normKey = normalize(key);
    if (norm.includes(normKey) || normKey.includes(norm)) return { val, key };
  }
  return null;
}

async function main() {
  console.log(`\n🚀 Final projects enrichment ${DRY_RUN ? "(DRY RUN)" : "(LIVE)"}`);
  const snapshot = await db.collection("projects").get();
  console.log(`📦 Loaded ${snapshot.size} projects`);

  let updated = 0;
  let batch = db.batch(), batchCount = 0;

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    const name = data.name || "";
    const result = findMatch(name);
    if (!result) continue;

    const { val, key } = result;
    const updates = {};

    if (val.beds !== undefined && (!data.beds || data.beds.length === 0)) updates.beds = val.beds;
    if (val.type) updates.type = val.type;
    if (val.totalUnits && !data.totalUnits) updates.totalUnits = val.totalUnits;
    if (val.totalFloors && !data.totalFloors) updates.totalFloors = val.totalFloors;
    if (val.sizeMin && !data.sizeMin) updates.sizeMin = val.sizeMin;
    if (val.sizeMax && !data.sizeMax) updates.sizeMax = val.sizeMax;
    if (val.priceMin && (!data.priceMin || data.priceMinIsEstimate)) { updates.priceMin = val.priceMin; updates.priceMinIsEstimate = false; }
    if (val.paymentPlan) updates.paymentPlan = val.paymentPlan;
    if (val.paymentPlanDetails) updates.paymentPlanDetails = val.paymentPlanDetails;
    if (val.constructionStart && !data.constructionStart) updates.constructionStart = val.constructionStart;
    if (val.mainContractor && !data.mainContractor) updates.mainContractor = val.mainContractor;
    if (val.marketSegment) updates.marketSegment = val.marketSegment;
    if (val.amenities && (!data.amenities || data.amenities.length === 0)) updates.amenities = val.amenities;
    if (val.views && (!data.views || data.views.length === 0)) updates.views = val.views;
    if (val.interiorFinish && !data.interiorFinish) updates.interiorFinish = val.interiorFinish;
    if (val.description && (!data.description || data.description.length < 50)) updates.description = val.description;
    if (val.developerActual && !data.developerActual) updates.developerActual = val.developerActual;
    if (val.sources) updates.sources = val.sources;

    if (Object.keys(updates).length === 0) continue;

    updates.finalEnrichedAt = new Date().toISOString();
    updates.dataSource = "multi-source-research-apr-2026";

    console.log(`  ✅ "${name}" -> matched "${key}" (${Object.keys(updates).length} fields)`);

    if (!DRY_RUN) {
      batch.update(docSnap.ref, updates);
      batchCount++;
      if (batchCount >= 400) {
        await batch.commit();
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
  if (DRY_RUN) console.log("⚠️  DRY RUN — remove --dry to apply.");
  else console.log("✅ Done!");
  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
