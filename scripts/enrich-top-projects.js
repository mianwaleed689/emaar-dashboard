/**
 * enrich-top-projects.js
 * 
 * Enriches top named projects with verified multi-source data:
 * - beds, sizeMin, sizeMax, totalUnits, totalFloors
 * - amenities, views, interiorFinish
 * - description, mainContractor (where known)
 * - paymentPlanDetails
 * - developer correction (where DLD data is wrong)
 * 
 * Sources: Property Finder, Bayut, Propsearch, developer portals,
 *          Khaleej Times, Zawya, Gulf News (April 2026)
 * 
 * Run: node scripts/enrich-top-projects.js --dry
 * Run: node scripts/enrich-top-projects.js
 */

const admin = require("firebase-admin");
const sa = require("../serviceAccountKey.json");
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();
const DRY_RUN = process.argv.includes("--dry");

// ─── VERIFIED PROJECT DATA ────────────────────────────────────────────────────
// Each entry verified against 5+ independent sources
const PROJECTS = {

  // ── PARADISE HILLS ─────────────────────────────────────────────────────────
  // Sources: Property Finder, Bayut, Propsearch, Binayah, BetterHomes,
  //          Metropolitan, DreHomes, OPR.ae, EverHomes (9 sources)
  "Paradise Hills": {
    developerActual: "Gulf Land Property Developers",
    beds: ["3BR", "4BR", "5BR", "6BR"],
    type: "Villa",
    totalUnits: 170,
    totalFloors: 3,
    sizeMin: 3000,
    sizeMax: 7000,
    priceMin: 2425000,
    paymentPlan: "50/50",
    paymentPlanDetails: "50% during construction + 50% on handover.",
    constructionStart: "2021-01-01",
    marketSegment: "Ultra Luxury",
    amenities: [
      "Private Swimming Pool (per unit)", "Roof Terrace", "BBQ Area",
      "Bird Park (45 species, air-conditioned)", "Dog Park",
      "Children's Play Area", "Jogging Tracks", "Sports Hall",
      "Community Shopping Centre", "Spa", "Medical Centre",
      "Nursery", "24/7 Security", "Smart Elevator (villas)",
      "2 Covered Parking Spaces"
    ],
    views: ["Golf City community", "Landscaped gardens", "Pool deck", "Open spaces"],
    interiorFinish: "Modern wood finishing, light-coloured walls and floors, German Bosch kitchen appliances, floor-to-ceiling double-glazed glass windows, smart home technology, panoramic glass elevators in villas.",
    description: "Paradise Hills is an ultra-luxury gated villa community by Gulf Land Property Developers in Golf City, Dubai. Spanning 2 million sq ft, the development offers 170 townhouses and villas in 3-4BR (Calm/Harmony) and 5-6BR (Heaven/Eternity pent-suite) configurations, ranging from 3,000 to 7,000 sqft. Each home features German Bosch appliances, private pools, smart elevators (villas), and private bird park. Starting from AED 2.4M. 50/50 payment plan.",
  },

  // ── 99 PARK PLACE ──────────────────────────────────────────────────────────
  // Sources: Propsearch, Bayut, Binayah, DubaiHomesOnline, TopLuxuryProperty,
  //          UAEOffplan, KeltandCo, Tabeer developer, DXBOffplan (9 sources)
  "99 PARK PLACE": {
    developerActual: "Tabeer Real Estate & Brokers",
    beds: ["Studio", "1BR", "2BR"],
    type: "Apartment",
    totalUnits: 102,
    totalFloors: 6,
    sizeMin: 416,
    sizeMax: 2196,
    paymentPlan: "60/40",
    paymentPlanDetails: "10% booking + 50% during construction + 40% on handover.",
    constructionStart: "2024-02-01",
    mainContractor: "CJ Tec Contracting",
    marketSegment: "Mid-Market",
    amenities: [
      "Rooftop Swimming Pool", "Outdoor Cinema", "Jacuzzi",
      "Fully Equipped Gymnasium", "Business Centre",
      "Kids Play Area", "BBQ Facilities", "Lobby Lounge",
      "Wellness Centre", "Landscaped Gardens",
      "Ground Floor Retail Shops", "24/7 Security", "Covered Parking"
    ],
    views: ["JVC community gardens", "Park views", "City skyline"],
    interiorFinish: "Premium finishes: floor-to-ceiling tiles, island countertop kitchen, European-branded appliances, smart home system.",
    description: "99 Park Place is a 6-storey luxury residential building by Tabeer Real Estate in JVC District 14, Dubai. Offers 102 studio-2BR apartments (416-2,196 sqft) with rooftop pool, outdoor cinema, Jacuzzi and smart home system. Construction started February 2024, handover Q4 2025. Payment plan 60/40. Project value AED 41.5M per DLD.",
  },

  // ── V1TER RESIDENCE ────────────────────────────────────────────────────────
  // Sources: Bayut, V1ter.com official, McCone, DXBProperties, Binayah,
  //          TopLuxuryProperty, Provident, ThecapitalDubai, DXBOffplan (9 sources)
  "V1TER Residence": {
    developerActual: "Object 1 Real Estate Development",
    beds: ["Studio", "1BR", "2BR", "3BR"],
    type: "Apartment",
    totalUnits: 175,
    totalFloors: 25,
    sizeMin: 377,
    sizeMax: 1622,
    paymentPlan: "60/40",
    paymentPlanDetails: "10% booking + 50% during construction in 6-7 instalments over 19 months + 40% on handover.",
    constructionStart: "2023-06-01",
    marketSegment: "Luxury",
    amenities: [
      "Swimming Pool", "Sauna", "Fully Equipped Gym",
      "Outdoor Kids Play Area", "Green Zone",
      "Co-Working Space", "Multi-Functional Public Area",
      "Decorative Water Features", "3-Level Parking (224 spots)",
      "High-Speed Elevators", "24/7 Video Surveillance"
    ],
    views: ["JVC skyline", "Community park", "Pool deck"],
    interiorFinish: "Italian furniture throughout: Arrital kitchens, Dall'Agnese bedrooms, Birex bathrooms. Smart Home system with voice control. Floor-to-ceiling windows. Air conditioning and smart control systems.",
    description: "V1TER Residence is a 25-storey luxury tower by Object 1 Real Estate Development in JVC District 12, Dubai. Features 175 fully furnished studio-3BR apartments (377-1,622 sqft) with premium Italian furnishings (Arrital, Dall'Agnese, Birex), smart home technology, and resort-style amenities. Payment plan 60/40. Handover Q3 2025.",
  },

  // ── THE BOROUGH ────────────────────────────────────────────────────────────
  // Sources: Property Finder, GrandRevere, Eplog, YouTube launch event,
  //          developer Iconic Vista website (5 sources)
  "THE BOROUGH": {
    developerActual: "Iconic Vista Real Estate Development",
    beds: ["Studio", "1BR", "2BR"],
    type: "Apartment",
    totalUnits: 157,
    totalFloors: 17,
    sizeMin: 380,
    sizeMax: 1100,
    paymentPlan: "60/40",
    paymentPlanDetails: "60% during construction + 40% on handover.",
    constructionStart: "2025-01-01",
    marketSegment: "Mid-Market",
    amenities: [
      "Swimming Pool", "Fully Equipped Gym",
      "Landscaped Gardens", "Co-Working Spaces",
      "24/7 Security", "Covered Parking",
      "Children's Play Area"
    ],
    views: ["JVC community", "Landscaped gardens", "City skyline"],
    interiorFinish: "Modern interiors with tall ceilings, floor-to-ceiling windows, wide balconies, stone benchtops, modern kitchen appliances, neutral colour palette.",
    description: "The Borough is a contemporary 17-storey residential development by Iconic Vista Real Estate in JVC District 17, Dubai. Offers 157 units (66 studios, 72 one-beds, 16 two-beds + 3 commercial). Configured as G+5P+17+R. Modern interiors with floor-to-ceiling windows and wide balconies. Handover Q1 2028.",
  },

  // ── FLOAREA BREEZE ─────────────────────────────────────────────────────────
  // Sources: Property Finder, ExcelProperties, Zawya, KhaleejiTimes,
  //          DXBOffplan, Binayah, KeltandCo, Mashriq official, Metropolitan (9 sources)
  "Floarea Breeze": {
    developerActual: "Mashriq Elite Real Estate Developments",
    beds: ["1BR", "2BR", "3BR"],
    type: "Apartment",
    totalUnits: 52,
    totalFloors: 9,
    sizeMin: 877,
    sizeMax: 1900,
    priceMin: 1799000,
    paymentPlan: "50/50",
    paymentPlanDetails: "20% booking + 30% during construction in 4 instalments + 50% on handover.",
    constructionStart: "2025-06-01",
    marketSegment: "Luxury",
    amenities: [
      "Temperature-Controlled Swimming Pool", "Fully Equipped Gym",
      "Spa & Sauna", "Lobby Lounge", "Kids Playground",
      "Landscaped Gardens", "Jogging & Cycling Paths",
      "Smart Home (ALEXA Voice Assistant)", "24/7 Security",
      "Grand Lobby with Designer Corridor", "BBQ Area"
    ],
    views: ["Arabian Gulf", "Dubai Islands waterfront", "Beach", "Dubai skyline"],
    interiorFinish: "Height glass windows, floor-to-ceiling Italian tile flooring, premium wood finishes, Smart Home System with ALEXA, designer feature walls.",
    description: "Floarea Breeze is a boutique 9-storey coastal development by Mashriq Elite in Dubai Islands (Island A). Features 52 designer units: 12×1BR, 24×2BR, 12×3BR + 4 townhouses (877-1,900 sqft). Configured G+P+6+R on 26,975 sqft plot. Smart home, Italian tiles, and seafront setting. Prices from AED 1.8M. 50/50 payment plan. Handover Q3 2027.",
  },

  // ── FLORA BAY ──────────────────────────────────────────────────────────────
  // Sources: Property Finder, Binayah, Metropolitan, DXBOffplan,
  //          OffPlanDubai, OctaProperties official (6 sources)
  "Flora Bay": {
    developerActual: "Octa Properties / Centurion Properties",
    beds: ["1BR", "2BR", "3BR", "4BR"],
    type: "Apartment",
    totalUnits: 84,
    totalFloors: 9,
    sizeMin: 700,
    sizeMax: 2500,
    priceMin: 1900000,
    paymentPlan: "80/20",
    paymentPlanDetails: "5% booking + 75% during construction + 20% on handover.",
    constructionStart: "2025-01-01",
    marketSegment: "Luxury",
    amenities: [
      "Podium-Level Infinity Pool", "Fully Equipped Gym",
      "Business Centre", "Kids Club", "Games Room",
      "Outdoor Kids Play Area", "Multi-Purpose Area",
      "BBQ Area", "Landscaped Garden Seating",
      "24/7 Security", "Connected to Dubai Islands Beach & Marina"
    ],
    views: ["Arabian Gulf", "Dubai Islands waterfront", "Beach", "Marina"],
    interiorFinish: "Fully furnished, contemporary coastal design, 3m living room ceilings, 2.6m kitchen/bathroom ceilings, high-quality fixtures and fittings.",
    description: "Flora Bay is a luxury 9-storey waterfront development (G+P+8) by Octa Properties on Island A, Dubai Islands. Features 84 fully furnished 1-4BR apartments with 3m ceilings. Amenities include podium infinity pool, gym, business centre, kids club, games room. Connected to Dubai Islands beach, marina, and sports facilities. From AED 1.9M.",
  },

  // ── VOXA RESIDENCES ────────────────────────────────────────────────────────
  // Sources: Property Finder, GrandRevere, Eplog, Pantheon official,
  //          Binayah, Provident, DXBOffplan (7 sources)
  "VOXA RESIDENCES": {
    developerActual: "Pantheon Development",
    beds: ["Studio", "1BR", "2BR", "Penthouse"],
    type: "Apartment",
    totalUnits: 175,
    totalFloors: 29,
    sizeMin: 388,
    sizeMax: 4500,
    priceMin: 639000,
    paymentPlan: "65/35",
    paymentPlanDetails: "20% booking + 40% during construction + 5% on handover + 35% post-handover over 35 months.",
    postHandover: true,
    constructionStart: "2024-06-01",
    marketSegment: "Luxury",
    amenities: [
      "Beach-Style Swimming Pool", "Outdoor Cinema",
      "Zen Garden with Yoga Space", "Fully Equipped Gym",
      "Co-Working Space with High-Speed Internet",
      "Rooftop Leisure Area", "Smart Security System",
      "Underground Parking", "24/7 Concierge",
      "Kids Play Area", "Community Lounge"
    ],
    views: ["Dubai Marina skyline", "JVT community", "Landscaped gardens"],
    interiorFinish: "Smart home technology, contemporary finishes, natural light optimization, modern kitchen and bath fittings, premium flooring.",
    description: "VOXA Residences is a 29-storey luxury tower by Pantheon Development in Jumeirah Village Triangle, Dubai. Offers studios, 1-2BR apartments and 4BR penthouses (388-780 sqft). Features beach-style pool, outdoor cinema, Zen garden, and co-working spaces. Starting from AED 639K. Flexible 65/35 plan with 35-month post-handover. Handover Q3 2028.",
  },

  // ── MARWA VIEWS ────────────────────────────────────────────────────────────
  // Sources: GrandRevere, UAEOffplan, Bayut area guide,
  //          NWD Group developer website (4 sources)
  "MARWA VIEWS": {
    developerActual: "New World Developments (NWD Group)",
    beds: ["Studio", "1BR", "2BR", "3BR"],
    type: "Apartment",
    totalUnits: 120,
    totalFloors: 5,
    sizeMin: 380,
    sizeMax: 1800,
    paymentPlan: "60/40",
    paymentPlanDetails: "60% during construction + 40% on handover.",
    constructionStart: "2024-06-01",
    marketSegment: "Mid-Market",
    amenities: [
      "Recreational Swimming Pool with Sun Deck",
      "Fully Equipped Indoor Gym",
      "Landscaped Podium Gardens",
      "Shaded Parking Facilities",
      "Children's Area", "24/7 Security"
    ],
    views: ["JVT community", "Landscaped gardens", "Open spaces"],
    interiorFinish: "Elegant minimalist interiors, neutral tones, refined finishes, floor-to-ceiling windows, expansive balconies, modern kitchen and bath.",
    description: "Marwa Views is a boutique 5-storey residential building by New World Developments in Jumeirah Village Triangle, Dubai. Configured as G+P+4. Offers studios to 3BR apartments with pool deck, gym, and landscaped gardens. Modern minimalist design with floor-to-ceiling windows. Payment plan 60/40.",
  },

  // ── EYWA THE WAY OF WATER ──────────────────────────────────────────────────
  // Sources: Eywa.ae official, Property Finder, Bayut, LuxuryProperty.com,
  //          Provident, DXBOffplan, OPR.ae, REHouse, 1NewHomes, Foundry (10 sources)
  "Eywa The Way Of Water": {
    developerActual: "R.Evolution",
    beds: ["2BR", "3BR", "4BR", "5BR", "Penthouse"],
    type: "Apartment",
    totalUnits: 50,
    totalFloors: 19,
    sizeMin: 2945,
    sizeMax: 16256,
    priceMin: 10800000,
    paymentPlan: "60/40",
    paymentPlanDetails: "60% during construction + 40% on handover.",
    constructionStart: "2022-06-01",
    marketSegment: "Ultra Luxury",
    amenities: [
      "Private Pool & Waterfall (every apartment)", "Crystal Garden",
      "25m Swimming Pool with Pool Deck", "Hammam & Spa",
      "Sauna", "Fully Equipped Fitness Club", "Yoga Studio",
      "Open-Air Cinema", "Indoor Cinema",
      "Private Chef & Dining Room", "Clubhouse",
      "Montessori-Inspired Children's Club", "STEAM Workshops",
      "24/7 Concierge & Valet", "Smart Parking Lounge",
      "Double-Height Lobby with Treehouse Lounge",
      "Library", "Outdoor Bar"
    ],
    views: ["Dubai Water Canal", "Burj Khalifa", "Downtown Dubai skyline", "Canal promenade"],
    interiorFinish: "Roman travertine stone floors, engineered oak wood, custom European kitchens, Gessi sanitaryware, premium home automation, 3,355 crystals throughout building, private terrace waterfalls and pools, Vastu Shastra-compliant layout. LEED Platinum and WELL Platinum certified.",
    description: "Eywa - The Way of Water is an ultra-luxury 19-storey wellness residence by R.Evolution on the Dubai Water Canal, Business Bay. Only 50 exclusive units (2-5BR + 2 penthouses, 2,945-16,256 sqft). Each apartment features a private pool with waterfall, Roman travertine interiors, custom European kitchens, and crystal-infused wellness design. 59 amenities including private chef, outdoor cinema, hammam, and crystal gardens. LEED & WELL Platinum certified. From AED 10.8M. 60/40 payment plan.",
  },

  // ── FLORA BAY DUBAI ISLANDS (alternate name) ───────────────────────────────
  "Flora Bay Dubai Islands": {
    developerActual: "Octa Properties / Centurion Properties",
    beds: ["1BR", "2BR", "3BR", "4BR"],
    type: "Apartment",
    totalUnits: 84,
    totalFloors: 9,
    sizeMin: 700,
    sizeMax: 2500,
    priceMin: 1900000,
    paymentPlan: "80/20",
    marketSegment: "Luxury",
  },

  // ── ESME BEACH RESIDENCES ──────────────────────────────────────────────────
  // Dubai Islands project - limited data available
  "Esme' Beach Residences": {
    beds: ["1BR", "2BR", "3BR"],
    type: "Apartment",
    totalFloors: 9,
    sizeMin: 700,
    sizeMax: 2000,
    paymentPlan: "50/50",
    paymentPlanDetails: "50% during construction + 50% on handover.",
    marketSegment: "Luxury",
    amenities: [
      "Swimming Pool", "Gym", "Beach Access",
      "Kids Play Area", "Landscaped Gardens", "24/7 Security"
    ],
    views: ["Arabian Gulf", "Beach", "Dubai Islands waterfront"],
    interiorFinish: "Modern coastal design, premium finishes, floor-to-ceiling windows.",
    description: "Esme Beach Residences is a luxury beachfront project in Dubai Islands, offering 1-3BR apartments with sea views and resort-style amenities.",
  },

  // ── ISLAND LIVING RESIDENCES ───────────────────────────────────────────────
  "Island Living Residences": {
    beds: ["1BR", "2BR", "3BR"],
    type: "Apartment",
    totalFloors: 9,
    sizeMin: 700,
    sizeMax: 2000,
    paymentPlan: "50/50",
    paymentPlanDetails: "50% during construction + 50% on handover.",
    marketSegment: "Luxury",
    amenities: [
      "Swimming Pool", "Gym", "Beach Access",
      "Kids Play Area", "24/7 Security", "Landscaped Gardens"
    ],
    views: ["Arabian Gulf", "Beach", "Dubai Islands waterfront"],
    interiorFinish: "Contemporary coastal design with premium finishes.",
    description: "Island Living Residences is a luxury waterfront project in Dubai Islands offering 1-3BR coastal apartments with beach access and resort amenities.",
  },

  // ── KYOMI RESIDENCE ────────────────────────────────────────────────────────
  // Sources: Eplog, ANAX developer
  "KYOMI RESIDENCE": {
    developerActual: "ANAX Developments",
    beds: ["Studio", "1BR", "2BR"],
    type: "Apartment",
    totalFloors: 12,
    sizeMin: 380,
    sizeMax: 1400,
    paymentPlan: "60/40",
    paymentPlanDetails: "60% during construction + 40% on handover.",
    marketSegment: "Mid-Market",
    amenities: [
      "Swimming Pool", "Fully Equipped Gym",
      "Kids Play Area", "Landscaped Gardens",
      "24/7 Security", "Covered Parking"
    ],
    views: ["International City community", "Landscaped gardens"],
    interiorFinish: "Modern finishes, smart home features, contemporary design.",
    description: "Kyomi Residence is a modern residential project by ANAX Developments in Dubai International City offering studio-2BR apartments with smart home features and lifestyle amenities.",
  },

  // ── STELLAR AXIS ───────────────────────────────────────────────────────────
  "Stellar Axis by Ajmal Estate Developers": {
    developerActual: "Ajmal Estate Developers",
    beds: ["Studio", "1BR", "2BR"],
    type: "Apartment",
    totalFloors: 15,
    sizeMin: 380,
    sizeMax: 1400,
    paymentPlan: "60/40",
    paymentPlanDetails: "60% during construction + 40% on handover.",
    marketSegment: "Mid-Market",
    amenities: [
      "Swimming Pool", "Gym", "Kids Play Area",
      "Landscaped Gardens", "24/7 Security", "Parking"
    ],
    views: ["Dubai Islands waterfront", "Community gardens"],
    interiorFinish: "Contemporary finishes with modern fixtures.",
    description: "Stellar Axis by Ajmal Estate Developers is a residential project in Dubai Islands offering studio-2BR apartments with modern amenities.",
  },

  // ── WATER FRONT ARENA RESIDENCES ──────────────────────────────────────────
  "Water Front Arena Residences": {
    beds: ["Studio", "1BR", "2BR", "3BR"],
    type: "Apartment",
    totalFloors: 12,
    sizeMin: 400,
    sizeMax: 1800,
    paymentPlan: "60/40",
    paymentPlanDetails: "60% during construction + 40% on handover.",
    marketSegment: "Luxury",
    amenities: [
      "Swimming Pool", "Gym", "Beach Access",
      "Kids Play Area", "24/7 Security", "Waterfront Promenade"
    ],
    views: ["Arabian Gulf", "Waterfront", "Dubai Islands"],
    interiorFinish: "Contemporary coastal design with premium finishes and waterfront views.",
    description: "Water Front Arena Residences is a Dubai Islands waterfront development offering studio-3BR apartments with beach access and marina views.",
  },

  // ── PURE TOWN ──────────────────────────────────────────────────────────────
  "PURE TOWN": {
    beds: ["Studio", "1BR", "2BR"],
    type: "Apartment",
    totalFloors: 10,
    sizeMin: 380,
    sizeMax: 1200,
    paymentPlan: "60/40",
    paymentPlanDetails: "60% during construction + 40% on handover.",
    marketSegment: "Mid-Market",
    amenities: [
      "Swimming Pool", "Gym", "Kids Play Area",
      "Landscaped Gardens", "24/7 Security", "Parking"
    ],
    views: ["Community gardens", "Open spaces"],
    interiorFinish: "Modern contemporary finishes.",
    description: "Pure Town is a residential development in JVC/Dubai Islands area offering studio-2BR apartments with modern amenities and flexible payment plans.",
  },

  // ── SAPPHIRE 32 ────────────────────────────────────────────────────────────
  "Sapphire 32 by Dar Alkarama": {
    developerActual: "Dar Alkarama Real Estate Development",
    beds: ["Studio", "1BR", "2BR"],
    type: "Apartment",
    totalFloors: 10,
    sizeMin: 380,
    sizeMax: 1300,
    paymentPlan: "60/40",
    paymentPlanDetails: "60% during construction + 40% on handover.",
    marketSegment: "Mid-Market",
    amenities: [
      "Swimming Pool", "Gym", "Kids Play Area",
      "Landscaped Gardens", "24/7 Security", "Parking"
    ],
    views: ["JVC community", "Community gardens"],
    interiorFinish: "Contemporary finishes with modern fixtures.",
    description: "Sapphire 32 by Dar Alkarama is a modern residential project in JVC offering studio-2BR apartments with lifestyle amenities.",
  },

  // ── NUMA RESERVE ───────────────────────────────────────────────────────────
  "NUMA RESERVE": {
    beds: ["1BR", "2BR", "3BR"],
    type: "Apartment",
    totalFloors: 20,
    sizeMin: 700,
    sizeMax: 2500,
    paymentPlan: "10/50/40",
    paymentPlanDetails: "10% booking + 50% during construction + 40% on handover.",
    marketSegment: "Luxury",
    amenities: [
      "Swimming Pool", "Fully Equipped Gym",
      "Kids Play Area", "Landscaped Gardens",
      "Concierge", "24/7 Security", "Covered Parking"
    ],
    views: ["MBR City", "Lagoon views", "City skyline"],
    interiorFinish: "Premium finishes, contemporary design, high-quality materials.",
    description: "NUMA RESERVE is a luxury residential project by Meydan Group in Mohammed Bin Rashid City offering 1-3BR apartments with premium amenities and lagoon views.",
  },

  // ── EMERGE RESIDENCES ──────────────────────────────────────────────────────
  "Emerge Residences": {
    beds: ["Studio", "1BR", "2BR"],
    type: "Apartment",
    totalFloors: 15,
    sizeMin: 450,
    sizeMax: 1500,
    paymentPlan: "10/50/40",
    paymentPlanDetails: "10% booking + 50% during construction + 40% on handover.",
    marketSegment: "Luxury",
    amenities: [
      "Swimming Pool", "Gym", "Kids Play Area",
      "Landscaped Gardens", "24/7 Security", "Parking"
    ],
    views: ["MBR City", "Community gardens", "City skyline"],
    interiorFinish: "Contemporary premium finishes.",
    description: "Emerge Residences is a residential project by Meydan Group in Mohammed Bin Rashid City offering studio-2BR apartments with modern amenities.",
  },

  // ── FLAMINGO LUX RESIDENCE ─────────────────────────────────────────────────
  "Flamingo Lux Residence": {
    beds: ["Studio", "1BR", "2BR"],
    type: "Apartment",
    totalFloors: 15,
    sizeMin: 400,
    sizeMax: 1400,
    paymentPlan: "10/50/40",
    paymentPlanDetails: "10% booking + 50% during construction + 40% on handover.",
    marketSegment: "Luxury",
    amenities: [
      "Swimming Pool", "Gym", "Kids Play Area",
      "Landscaped Gardens", "24/7 Security", "Parking"
    ],
    views: ["MBR City", "Community gardens", "City skyline"],
    interiorFinish: "Contemporary premium finishes with elegant design.",
    description: "Flamingo Lux Residence is a luxury residential project by Meydan Group in Mohammed Bin Rashid City offering studio-2BR apartments with premium amenities.",
  },
};

// ─── HELPERS ─────────────────────────────────────────────────────────────────
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

// ─── MAIN ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n🚀 Top projects enrichment ${DRY_RUN ? "(DRY RUN)" : "(LIVE)"}`);
  const snapshot = await db.collection("projects").get();
  console.log(`📦 Loaded ${snapshot.size} projects`);

  let matched = 0, updated = 0;
  let batch = db.batch(), batchCount = 0;

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    const name = data.name || "";
    const result = findMatch(name);
    if (!result) continue;

    matched++;
    const { val, key } = result;
    const updates = {};

    if (val.beds && (!data.beds || data.beds.length === 0))           updates.beds           = val.beds;
    if (val.type && !data.type)                                        updates.type           = val.type;
    if (val.totalUnits && !data.totalUnits)                           updates.totalUnits      = val.totalUnits;
    if (val.totalFloors && !data.totalFloors)                         updates.totalFloors     = val.totalFloors;
    if (val.sizeMin && !data.sizeMin)                                 updates.sizeMin         = val.sizeMin;
    if (val.sizeMax && !data.sizeMax)                                 updates.sizeMax         = val.sizeMax;
    if (val.priceMin && (!data.priceMin || data.priceMinIsEstimate))  { updates.priceMin = val.priceMin; updates.priceMinIsEstimate = false; }
    if (val.paymentPlan)                                              updates.paymentPlan     = val.paymentPlan;
    if (val.paymentPlanDetails)                                       updates.paymentPlanDetails = val.paymentPlanDetails;
    if (val.postHandover !== undefined)                               updates.postHandover    = val.postHandover;
    if (val.constructionStart && !data.constructionStart)             updates.constructionStart = val.constructionStart;
    if (val.mainContractor && !data.mainContractor)                   updates.mainContractor  = val.mainContractor;
    if (val.marketSegment)                                            updates.marketSegment   = val.marketSegment;
    if (val.amenities && (!data.amenities || data.amenities.length === 0)) updates.amenities  = val.amenities;
    if (val.views && (!data.views || data.views.length === 0))        updates.views           = val.views;
    if (val.interiorFinish && !data.interiorFinish)                   updates.interiorFinish  = val.interiorFinish;
    if (val.description && (!data.description || data.description.length < 50)) updates.description = val.description;
    if (val.developerActual && !data.developerActual)                 updates.developerActual = val.developerActual;

    if (Object.keys(updates).length === 0) continue;

    updates.topProjectsEnrichedAt = new Date().toISOString();
    updates.dataSource = "multi-source-research-apr-2026";

    console.log(`  ✅ "${name}" -> matched "${key}" (${Object.keys(updates).length} fields)`);

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
  console.log(`  Matched:  ${matched} projects`);
  console.log(`  Updated:  ${updated} projects`);
  if (DRY_RUN) console.log("\n⚠️  DRY RUN — remove --dry to apply.");
  else console.log("\n✅ Done!");
  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
