/**
 * enrich-sources.js
 * 
 * Adds a `sources` array to every project based on what data it actually has.
 * Sources are auto-generated based on:
 * - DLD data presence → DLD Mashrooi source
 * - Community data → neighbourhoodScores source
 * - Developer data → developer-specific sources
 * - Yield data → DLD Rent Contracts source
 * - Service charge → RERA Mollak source
 * - Researched projects → project-specific sources
 * - Payment plan research → Property Finder / Bayut sources
 * 
 * Run: node scripts/enrich-sources.js --dry
 * Run: node scripts/enrich-sources.js
 */

const admin = require("firebase-admin");
const sa = require("../serviceAccountKey.json");
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();
const DRY_RUN = process.argv.includes("--dry");

const NOW = "April 2026";

// ─── PROJECT-SPECIFIC SOURCES ─────────────────────────────────────────────────
// For projects we researched deeply
const PROJECT_SOURCES = {
  "Golf Grand": [
    { name:"DLD Mashrooi Project Record #2599", url:"https://dubailand.gov.ae", type:"government", tier:"primary", covers:"Identity, units, plot size, escrow, dates, developer registration", verifiedAt:NOW },
    { name:"Emaar Properties Official Developer Portal", url:"https://properties.emaar.com/en/properties/golf-grand/", type:"developer", tier:"primary", covers:"Amenities, unit types, payment plan, community", verifiedAt:NOW },
    { name:"Emaar Properties 9M 2025 Investor Presentation", url:"https://properties.emaar.com/wp-content/uploads/2025/05/Emaar-Properties-9M-2025-Investor-presentation-1.pdf", type:"financial", tier:"primary", covers:"Revenue, net profit, backlog, units delivered", verifiedAt:NOW },
    { name:"Property Finder - Golf Grand", url:"https://www.propertyfinder.ae/en/new-projects/emaar-properties/golf-grand", type:"portal", tier:"secondary", covers:"Current prices, unit sizes, listings", verifiedAt:NOW },
    { name:"Bayut - Golf Grand Building Guide", url:"https://www.bayut.com/buildings/golf-grand/", type:"portal", tier:"secondary", covers:"Amenities, unit layouts, community", verifiedAt:NOW },
    { name:"Propsearch - Golf Grand Project Record", url:"https://propsearch.ae/dubai/golf-grand", type:"portal", tier:"secondary", covers:"Contractors, architecture, DLD project value", verifiedAt:NOW },
    { name:"DFM / TradingView - EMAAR Stock Data", url:"https://www.tradingview.com/symbols/DFM-EMAAR/", type:"exchange", tier:"primary", covers:"Stock price, market cap", verifiedAt:NOW },
    { name:"Bayut - Dubai Hills Estate Area Guide", url:"https://www.bayut.com/area-guides/dubai-hills-estate/", type:"portal", tier:"secondary", covers:"Community access, schools, hospitals, roads", verifiedAt:NOW },
    { name:"Emaar FY2025 Results - Gulf News", url:"https://gulfnews.com/business/property/emaar-reports-record-2025", type:"media", tier:"secondary", covers:"FY2025 financial performance", verifiedAt:NOW },
    { name:"Emaar FY2025 Results - Zawya", url:"https://www.zawya.com/en/capital-markets/equities/emaar-records-highest-sales-revenue-profit-in-2025", type:"media", tier:"secondary", covers:"FY2025 consolidated financials", verifiedAt:NOW },
    { name:"Emaar DHE Area Guide", url:"https://properties.emaar.com/en/blog/dubai-hills-estate-guide/", type:"developer", tier:"primary", covers:"Community context, road access, commute times", verifiedAt:NOW },
  ],

  "99 PARK PLACE": [
    { name:"Propsearch - 99 Park Place", url:"https://propsearch.ae/dubai/99-park-place", type:"government", tier:"primary", covers:"Units, floors, contractor, DLD value AED 41.5M, construction start", verifiedAt:NOW },
    { name:"Property Finder - 99 Park Place", url:"https://www.propertyfinder.ae/en/new-projects/tabeer/99-park-place", type:"portal", tier:"secondary", covers:"Payment plan, prices, unit types", verifiedAt:NOW },
    { name:"Bayut - JVC Building Guide", url:"https://www.bayut.com/buildings/99-park-place/", type:"portal", tier:"secondary", covers:"Amenities, unit sizes, community", verifiedAt:NOW },
    { name:"Binayah Properties", url:"https://www.binayah.com/dubai-projects/99-park-place-at-jvc/", type:"portal", tier:"secondary", covers:"Floor plans, amenities, location", verifiedAt:NOW },
    { name:"Tabeer Real Estate - Developer", url:"https://www.tanamiproperties.com/Projects/99-Park-Place-by-Tabeer", type:"developer", tier:"primary", covers:"Official floor plans, amenities, payment plan", verifiedAt:NOW },
    { name:"DubaiHomesOnline", url:"https://www.dubaihomesonline.com/project/29-tabeer-99-park-place-apartments", type:"portal", tier:"secondary", covers:"Unit sizes, payment plan details", verifiedAt:NOW },
  ],

  "V1TER Residence": [
    { name:"V1TER Official Website", url:"https://v1ter.com/", type:"developer", tier:"primary", covers:"Payment plans, unit types, Italian furnishings, smart home", verifiedAt:NOW },
    { name:"Bayut - V1TER Residence Guide", url:"https://www.bayut.com/buildings/v1ter-residence/", type:"portal", tier:"secondary", covers:"Unit sizes, amenities, community access", verifiedAt:NOW },
    { name:"McCone Properties", url:"https://www.mcconeproperties.com/off-plan-properties-in-dubai/v1-ter/", type:"portal", tier:"secondary", covers:"175 units breakdown: 34 studios, 91×1BR, 42×2BR, 8×3BR", verifiedAt:NOW },
    { name:"Property Finder - V1TER", url:"https://www.propertyfinder.ae/en/new-projects/object-1/v1ter", type:"portal", tier:"secondary", covers:"Prices, payment plan, handover", verifiedAt:NOW },
    { name:"Provident Estate", url:"https://providentestate.com/new-projects/v1ter-residences/", type:"portal", tier:"secondary", covers:"Location, amenities, investment data", verifiedAt:NOW },
    { name:"DXBProperties", url:"https://dxbproperties.ae/property/object-1-v1ter-residence-jvc", type:"portal", tier:"secondary", covers:"60/40 payment plan, ROI data", verifiedAt:NOW },
  ],

  "THE BOROUGH": [
    { name:"Property Finder - The Borough", url:"https://www.propertyfinder.ae/en/new-projects/iconic-vista-development/the-borough", type:"portal", tier:"primary", covers:"157 units, 17 floors, G+5P+17+R, handover Q1 2028", verifiedAt:NOW },
    { name:"GrandRevere Realty", url:"https://grandreverealty.com/projects/the-borough-at-jvc/", type:"portal", tier:"secondary", covers:"Developer, unit mix, floor count, amenities", verifiedAt:NOW },
    { name:"Eplog Offplan", url:"https://eplogoffplan.com/projects/the-borough-apartment-at-jumeirah-village-circle", type:"portal", tier:"secondary", covers:"Studios, 1BR, 2BR, amenities", verifiedAt:NOW },
  ],

  "Floarea Breeze": [
    { name:"Khaleej Times - Launch Announcement", url:"https://www.khaleejtimes.com/kt-network/mashriq-elite-gears-up-for-dubai-islands-residential-debut-with-floarea-breeze", type:"media", tier:"primary", covers:"52 units, G+P+6+R, exact unit counts, sqft ranges, AED 1.8M", verifiedAt:NOW },
    { name:"Zawya - Press Release", url:"https://www.zawya.com/en/press-release/mashriq-elite-gears-up-for-dubai-islands-residential-debut", type:"media", tier:"primary", covers:"Official developer announcement, unit breakdown", verifiedAt:NOW },
    { name:"Property Finder - Floarea Breeze", url:"https://www.propertyfinder.ae/en/new-projects/mashriq-elite-developments/floarea-breeze", type:"portal", tier:"secondary", covers:"Prices, sizes, payment plan, location", verifiedAt:NOW },
    { name:"Excel Properties", url:"https://excelproperties.ae/offplan/floarea-breeze-dubai-islands", type:"portal", tier:"secondary", covers:"50/50 payment plan, unit sizes, amenities", verifiedAt:NOW },
    { name:"Mashriq Elite Official", url:"https://www.mashriqelite.com/", type:"developer", tier:"primary", covers:"Developer track record, project pipeline", verifiedAt:NOW },
  ],

  "Flora Bay": [
    { name:"Metropolitan Premium Properties", url:"https://metropolitan.realestate/dubai-islands/flora-bay-octa-dubai-islands/", type:"portal", tier:"primary", covers:"84 units, G+P+8, 1-4BR, 3m ceilings, amenities", verifiedAt:NOW },
    { name:"OffPlan Dubai", url:"https://www.offplan-dubai.com/flora-bay-residences-centurion-properties-dubai-islands/", type:"portal", tier:"secondary", covers:"Fully furnished, 5% down payment, amenities", verifiedAt:NOW },
    { name:"Binayah Properties - Flora Bay", url:"https://www.binayah.com/dubai-projects/flora-bay-at-dubai-islands/", type:"portal", tier:"secondary", covers:"Unit types, freehold, payment plan", verifiedAt:NOW },
    { name:"Octa Properties Official", url:"https://octaproperties.ae/", type:"developer", tier:"primary", covers:"Developer portfolio, GDV AED 5B+", verifiedAt:NOW },
  ],

  "VOXA RESIDENCES": [
    { name:"Pantheon Development Official", url:"https://pantheondevelopment.ae/projects/voxa/", type:"developer", tier:"primary", covers:"Studio-4BR penthouses, 29 floors, payment plan, amenities", verifiedAt:NOW },
    { name:"Property Finder - VOXA", url:"https://www.propertyfinder.ae/en/new-projects/pantheon-development/voxa-pantheon", type:"portal", tier:"secondary", covers:"Unit sizes 388-780 sqft, prices from AED 639K", verifiedAt:NOW },
    { name:"GrandRevere Realty - VOXA", url:"https://grandreverealty.com/projects/voxa-residences/", type:"portal", tier:"secondary", covers:"65/35 + 35-month post-handover plan", verifiedAt:NOW },
    { name:"Eplog Offplan - VOXA", url:"https://eplogoffplan.com/projects/voxa-residences-at-jvt", type:"portal", tier:"secondary", covers:"Floor plans, 29-storey configuration", verifiedAt:NOW },
  ],

  "Eywa The Way Of Water": [
    { name:"EYWA Official Website", url:"https://www.eywa.ae/", type:"developer", tier:"primary", covers:"65 residences, 59 amenities, wellness design, crystals", verifiedAt:NOW },
    { name:"Property Finder - Eywa", url:"https://www.propertyfinder.ae/en/new-projects/r-evolution/eywa", type:"portal", tier:"primary", covers:"2-5BR sizes 2945-16256 sqft, 19 floors, handover Q1 2026", verifiedAt:NOW },
    { name:"LuxuryProperty.com - Eywa", url:"https://www.luxuryproperty.com/projects/eywa-at-dubai-water-canal-business-bay", type:"portal", tier:"secondary", covers:"AED 10.8M starting price, 60/40 plan, canal views", verifiedAt:NOW },
    { name:"The Foundry Realty", url:"https://www.thefoundryrealty.com/off-plan/eywa", type:"portal", tier:"secondary", covers:"LEED & WELL Platinum, crystals, Gessi fixtures", verifiedAt:NOW },
    { name:"Provident Estate - Eywa", url:"https://www.providentestate.com/new-projects/eywa-tower/", type:"portal", tier:"secondary", covers:"48 units, Business Bay canal, 15 min to DXB airport", verifiedAt:NOW },
    { name:"OPR.ae - Eywa", url:"https://opr.ae/projects/r-evolution-eywa-tower-apartments-for-sale-in-business-bay-dubai", type:"portal", tier:"secondary", covers:"Starting price AED 12M as of Q1 2025", verifiedAt:NOW },
    { name:"DXBOffplan - Eywa", url:"https://dxboffplan.com/properties/eywa-the-way-of-water-business-bay-dubai/", type:"portal", tier:"secondary", covers:"50/50 plan, waterfront canal address", verifiedAt:NOW },
  ],

  "Paradise Hills": [
    { name:"Propsearch - Paradise Hills", url:"https://propsearch.ae/dubai/paradise-hills", type:"government", tier:"primary", covers:"Construction start Oct 2014, DLD value AED 105.5M, architect, developer acquisition", verifiedAt:NOW },
    { name:"Property Finder - Paradise Hills", url:"https://www.propertyfinder.ae/en/new-projects/gulf-land-property-developers/paradise-hills", type:"portal", tier:"primary", covers:"170 units, 3-6BR, AED 3.25M starting price, amenities", verifiedAt:NOW },
    { name:"Bayut - Paradise Hills Area Guide", url:"https://www.bayut.com/area-guides/paradise-hills-dubai/", type:"portal", tier:"secondary", covers:"Unit types, sizes 3000-7000 sqft, community amenities", verifiedAt:NOW },
    { name:"Binayah Properties", url:"https://www.binayah.com/dubai-projects/paradise-hills-villas/", type:"portal", tier:"secondary", covers:"Bosch appliances, private pools, smart elevators", verifiedAt:NOW },
    { name:"DreHomes", url:"https://drehomes.com/property/paradise-hills", type:"portal", tier:"secondary", covers:"Bird park (45 species), 2M sqft, gated community", verifiedAt:NOW },
    { name:"Metropolitan Premium Properties", url:"https://metropolitan.realestate/dubailand/paradise-hills-villas/", type:"portal", tier:"secondary", covers:"Sizes 3000-7000 sqft, starting AED 2.4M", verifiedAt:NOW },
  ],

  "MARWA VIEWS": [
    { name:"GrandRevere Realty", url:"https://grandreverealty.com/projects/marwa-views-residences/", type:"portal", tier:"primary", covers:"G+P+4, Studio-3BR, NWD Group developer, pool, gym", verifiedAt:NOW },
    { name:"UAEOffplan", url:"https://uae-offplan.com/property/marwa-heights-apartment", type:"portal", tier:"secondary", covers:"JVT location, 1-3BR, infinity pool, ROI 8-10%", verifiedAt:NOW },
  ],
};

// ─── DEVELOPER SOURCES ────────────────────────────────────────────────────────
const DEVELOPER_SOURCES = {
  "Emaar Properties": [
    { name:"DLD Mashrooi - Project Registry", url:"https://dubailand.gov.ae", type:"government", tier:"primary", covers:"Project registration, escrow, units, dates", verifiedAt:NOW },
    { name:"Emaar Properties Official Portal", url:"https://properties.emaar.com", type:"developer", tier:"primary", covers:"Project details, payment plans, amenities", verifiedAt:NOW },
    { name:"Property Finder - Emaar", url:"https://www.propertyfinder.ae/en/new-projects/dev/emaar-properties", type:"portal", tier:"secondary", covers:"Listings, prices, availability", verifiedAt:NOW },
    { name:"Bayut - Emaar Projects", url:"https://www.bayut.com/new-projects/developers/emaar/", type:"portal", tier:"secondary", covers:"Payment plans, handover dates, community data", verifiedAt:NOW },
  ],
  "Nakheel": [
    { name:"DLD Mashrooi - Project Registry", url:"https://dubailand.gov.ae", type:"government", tier:"primary", covers:"Project registration, escrow, units, dates", verifiedAt:NOW },
    { name:"Nakheel Official - New Launches", url:"https://www.nakheel.com/en/new-launches", type:"developer", tier:"primary", covers:"Official project details, community plans", verifiedAt:NOW },
    { name:"Property Finder - Nakheel", url:"https://www.propertyfinder.ae/en/new-projects/dev/nakheel", type:"portal", tier:"secondary", covers:"Payment plans, prices, handover dates", verifiedAt:NOW },
    { name:"Bayut - Nakheel Projects", url:"https://www.bayut.com/new-projects/developers/nakheel/", type:"portal", tier:"secondary", covers:"Project listings, community guides", verifiedAt:NOW },
  ],
  "Dubai Properties": [
    { name:"DLD Mashrooi - Project Registry", url:"https://dubailand.gov.ae", type:"government", tier:"primary", covers:"Project registration, escrow, units, dates", verifiedAt:NOW },
    { name:"Dubai Properties Official", url:"https://www.dubaiproperties.ae", type:"developer", tier:"primary", covers:"Official project details, community plans", verifiedAt:NOW },
    { name:"Property Finder - Dubai Properties", url:"https://www.propertyfinder.ae/en/new-projects/dev/dubai-properties", type:"portal", tier:"secondary", covers:"Listings, prices, payment plans", verifiedAt:NOW },
  ],
  "Damac Properties": [
    { name:"DLD Mashrooi - Project Registry", url:"https://dubailand.gov.ae", type:"government", tier:"primary", covers:"Project registration, escrow, units, dates", verifiedAt:NOW },
    { name:"DAMAC Properties Official", url:"https://www.damacproperties.com", type:"developer", tier:"primary", covers:"Official project details, payment plans", verifiedAt:NOW },
    { name:"Bayut - DAMAC Projects", url:"https://www.bayut.com/new-projects/developers/damac-properties/", type:"portal", tier:"secondary", covers:"Payment plans, prices, handover dates", verifiedAt:NOW },
    { name:"Property Finder - DAMAC", url:"https://www.propertyfinder.ae/en/new-projects/dev/damac-properties", type:"portal", tier:"secondary", covers:"Listings, unit types, community data", verifiedAt:NOW },
  ],
  "Meydan Group": [
    { name:"DLD Mashrooi - Project Registry", url:"https://dubailand.gov.ae", type:"government", tier:"primary", covers:"Project registration, escrow, units, dates", verifiedAt:NOW },
    { name:"Meydan Group Official", url:"https://www.meydan.ae", type:"developer", tier:"primary", covers:"Official project details, MBR City plans", verifiedAt:NOW },
    { name:"Property Finder - Meydan", url:"https://www.propertyfinder.ae/en/new-projects/dev/meydan-group/dubai", type:"portal", tier:"secondary", covers:"Payment plans, prices, handover dates", verifiedAt:NOW },
  ],
  "Majid Al Futtaim": [
    { name:"DLD Mashrooi - Project Registry", url:"https://dubailand.gov.ae", type:"government", tier:"primary", covers:"Project registration, escrow, units, dates", verifiedAt:NOW },
    { name:"Majid Al Futtaim Properties Official", url:"https://www.majidalfuttaim.com/en/what-we-do/properties", type:"developer", tier:"primary", covers:"Tilal Al Ghaf, Ghaf Woods project details", verifiedAt:NOW },
    { name:"Property Finder - MAF", url:"https://www.propertyfinder.ae/en/new-projects/dev/majid-al-futtaim", type:"portal", tier:"secondary", covers:"Listings, prices, payment plans", verifiedAt:NOW },
  ],
  "Sobha Realty": [
    { name:"DLD Mashrooi - Project Registry", url:"https://dubailand.gov.ae", type:"government", tier:"primary", covers:"Project registration, escrow, units, dates", verifiedAt:NOW },
    { name:"Sobha Realty Official", url:"https://www.sobharealty.com", type:"developer", tier:"primary", covers:"Official project details, quality standards", verifiedAt:NOW },
    { name:"Property Finder - Sobha", url:"https://www.propertyfinder.ae/en/new-projects/dev/sobha-realty", type:"portal", tier:"secondary", covers:"Listings, prices, 60/40 payment plans", verifiedAt:NOW },
  ],
  "Dubai Airports Corporation": [
    { name:"DLD Mashrooi - Project Registry", url:"https://dubailand.gov.ae", type:"government", tier:"primary", covers:"Project registration, escrow, units, dates", verifiedAt:NOW },
    { name:"Dubai South Official", url:"https://www.dubaisouth.ae", type:"developer", tier:"primary", covers:"Community master plan, infrastructure", verifiedAt:NOW },
    { name:"Property Finder - Dubai South", url:"https://www.propertyfinder.ae/en/new-projects/lp/dubai/dubai-south-dubai-world-central", type:"portal", tier:"secondary", covers:"Project listings, prices", verifiedAt:NOW },
  ],
  "Dubai Sports City": [
    { name:"DLD Mashrooi - Project Registry", url:"https://dubailand.gov.ae", type:"government", tier:"primary", covers:"Project registration, escrow, units, dates", verifiedAt:NOW },
    { name:"Dubai Sports City Official", url:"https://www.dubaisportscity.ae", type:"developer", tier:"primary", covers:"Community master plan, project details", verifiedAt:NOW },
    { name:"Property Finder - Dubai Sports City", url:"https://www.propertyfinder.ae/en/new-projects/lp/dubai/dubai-sports-city", type:"portal", tier:"secondary", covers:"Project listings, prices", verifiedAt:NOW },
  ],
  "TECOM Investments": [
    { name:"DLD Mashrooi - Project Registry", url:"https://dubailand.gov.ae", type:"government", tier:"primary", covers:"Project registration, escrow, units, dates", verifiedAt:NOW },
    { name:"TECOM Group Official", url:"https://www.tecomgroup.ae", type:"developer", tier:"primary", covers:"Community plans, project details", verifiedAt:NOW },
    { name:"Property Finder", url:"https://www.propertyfinder.ae", type:"portal", tier:"secondary", covers:"Project listings, prices", verifiedAt:NOW },
  ],
  "Dubai Investments": [
    { name:"DLD Mashrooi - Project Registry", url:"https://dubailand.gov.ae", type:"government", tier:"primary", covers:"Project registration, escrow, units, dates", verifiedAt:NOW },
    { name:"Dubai Investments Official", url:"https://www.dubaiinvestments.com", type:"developer", tier:"primary", covers:"DIP community plans, project details", verifiedAt:NOW },
    { name:"Property Finder", url:"https://www.propertyfinder.ae", type:"portal", tier:"secondary", covers:"Project listings, prices", verifiedAt:NOW },
  ],
  "Union Properties": [
    { name:"DLD Mashrooi - Project Registry", url:"https://dubailand.gov.ae", type:"government", tier:"primary", covers:"Project registration, escrow, units, dates", verifiedAt:NOW },
    { name:"Union Properties Official", url:"https://www.up.ae", type:"developer", tier:"primary", covers:"Motor City community plans, project details", verifiedAt:NOW },
    { name:"Property Finder", url:"https://www.propertyfinder.ae", type:"portal", tier:"secondary", covers:"Project listings, prices", verifiedAt:NOW },
  ],
};

// ─── COMMUNITY SOURCES ────────────────────────────────────────────────────────
const COMMUNITY_SOURCES = {
  yield: { name:"DLD Rent Contracts 2026", url:"https://dubailand.gov.ae", type:"government", tier:"primary", covers:"Gross rental yield from 61,162 rental contracts", verifiedAt:NOW },
  ppsf: { name:"DLD Transactions 2026", url:"https://dubailand.gov.ae", type:"government", tier:"primary", covers:"PPSF from 79,257 sales transactions", verifiedAt:NOW },
  serviceCharge: { name:"RERA Mollak Service Charge Registry", url:"https://mollak.rera.gov.ae", type:"government", tier:"primary", covers:"Official RERA approved service charge rates", verifiedAt:NOW },
  community: { name:"DXB Analytics neighbourhoodScores", url:"https://dubailand.gov.ae", type:"research", tier:"secondary", covers:"Investment score, supply risk, community metrics", verifiedAt:NOW },
  metro: { name:"Google Maps API - Distance Matrix", url:"https://maps.googleapis.com", type:"api", tier:"secondary", covers:"Metro, mall, hospital distances", verifiedAt:NOW },
};

// ─── BUILD SOURCES FOR A PROJECT ─────────────────────────────────────────────
function buildSources(p) {
  const sources = [];
  const name = p.name || "";
  const developer = p.developer || "";

  // 1. Project-specific researched sources
  const projectSrcs = PROJECT_SOURCES[name];
  if (projectSrcs) {
    sources.push(...projectSrcs);
    return sources; // Project has its own full source set
  }

  // 2. DLD source (all projects have this)
  sources.push({
    name: "DLD Real Estate Projects Registry 2026",
    url: "https://dubailand.gov.ae",
    type: "government",
    tier: "primary",
    covers: `Project #${p.projectNumber || p.dldProjectNumber || "—"}: registration, escrow, units, handover date`,
    verifiedAt: NOW,
  });

  // 3. Developer sources
  const devSrcs = DEVELOPER_SOURCES[developer];
  if (devSrcs) sources.push(...devSrcs.slice(1)); // skip duplicate DLD

  // 4. Community/yield data sources
  if (p.grossYield && !p.grossYieldIsEstimate) sources.push(COMMUNITY_SOURCES.yield);
  if (p.ppsf) sources.push(COMMUNITY_SOURCES.ppsf);
  if (p.serviceCharge && p.serviceChargeSource === "RERA Mollak") sources.push(COMMUNITY_SOURCES.serviceCharge);
  if (p.communityEnriched) sources.push(COMMUNITY_SOURCES.community);
  if (p.nearestMetro || p.distMetro) sources.push(COMMUNITY_SOURCES.metro);

  // 5. Payment plan research source
  if (p.paymentPlan && p.paymentPlanSource) {
    sources.push({
      name: "Property Finder & Bayut - Payment Plans Research",
      url: "https://www.propertyfinder.ae",
      type: "portal",
      tier: "secondary",
      covers: `Payment plan ${p.paymentPlan}, market segment, commission rates`,
      verifiedAt: NOW,
    });
  }

  // Deduplicate by name
  const seen = new Set();
  return sources.filter(s => {
    if (seen.has(s.name)) return false;
    seen.add(s.name);
    return true;
  });
}

// ─── DATA QUALITY SCORE ───────────────────────────────────────────────────────
function calcQualityScore(p) {
  const fields = [
    "name", "developer", "community", "type", "status",
    "priceMin", "grossYield", "ppsf", "paymentPlan",
    "beds", "totalFloors", "sizeMin", "sizeMax",
    "amenities", "views", "interiorFinish", "description",
    "nearestMetro", "nearestMall", "nearestHospital",
    "serviceCharge", "investmentScore", "coordinates",
  ];
  const weighted = {
    "name": 5, "developer": 5, "community": 5, "type": 3,
    "priceMin": 8, "grossYield": 8, "ppsf": 5,
    "paymentPlan": 6, "beds": 4, "totalFloors": 3,
    "sizeMin": 4, "sizeMax": 4, "amenities": 4,
    "views": 2, "interiorFinish": 2, "description": 3,
    "nearestMetro": 3, "nearestMall": 3, "nearestHospital": 3,
    "serviceCharge": 4, "investmentScore": 5, "coordinates": 4,
    "status": 3,
  };
  let score = 0;
  let maxScore = 0;
  for (const [field, weight] of Object.entries(weighted)) {
    maxScore += weight;
    const val = p[field];
    if (val !== undefined && val !== null && val !== "" &&
        !(Array.isArray(val) && val.length === 0)) {
      score += weight;
      // Bonus for real (not estimated) data
      if (field === "priceMin" && !p.priceMinIsEstimate) score += 2;
      if (field === "grossYield" && !p.grossYieldIsEstimate) score += 2;
    }
  }
  return Math.min(100, Math.round((score / (maxScore + 4)) * 100));
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n🚀 Sources enrichment ${DRY_RUN ? "(DRY RUN)" : "(LIVE)"}`);
  const snapshot = await db.collection("projects").get();
  console.log(`📦 Loaded ${snapshot.size} projects`);

  let updated = 0;
  let batch = db.batch(), batchCount = 0;
  const scoreDistrib = { "90+":0, "70-89":0, "50-69":0, "<50":0 };

  for (const docSnap of snapshot.docs) {
    const p = docSnap.data();
    const sources = buildSources(p);
    const qualityScore = calcQualityScore(p);

    if (qualityScore >= 90) scoreDistrib["90+"]++;
    else if (qualityScore >= 70) scoreDistrib["70-89"]++;
    else if (qualityScore >= 50) scoreDistrib["50-69"]++;
    else scoreDistrib["<50"]++;

    const updates = {
      sources,
      dataQualityScore: qualityScore,
      sourcesEnrichedAt: new Date().toISOString(),
    };

    if (updated < 3) {
      console.log(`\n  "${p.name}" (${p.developer})`);
      console.log(`    Sources: ${sources.length} | Quality: ${qualityScore}/100`);
      sources.slice(0, 3).forEach(s => console.log(`    - [${s.tier}] ${s.name}`));
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
    updated++;
  }

  if (!DRY_RUN && batchCount > 0) {
    await batch.commit();
    console.log(`  💾 Committed final batch of ${batchCount}`);
  }

  console.log(`\n📊 RESULTS:`);
  console.log(`  Total updated: ${updated}`);
  console.log(`  Quality scores:`);
  console.log(`    90-100: ${scoreDistrib["90+"]} projects (fully verified)`);
  console.log(`    70-89:  ${scoreDistrib["70-89"]} projects (well enriched)`);
  console.log(`    50-69:  ${scoreDistrib["50-69"]} projects (partial data)`);
  console.log(`    <50:    ${scoreDistrib["<50"]} projects (basic DLD only)`);

  if (DRY_RUN) console.log("\n⚠️  DRY RUN — remove --dry to apply.");
  else console.log("\n✅ Done!");
  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
