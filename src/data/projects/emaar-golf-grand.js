/* ═══════════════════════════════════════════════════════════════════════
   GOLF GRAND · Emaar Properties · Dubai Hills Estate
   ─────────────────────────────────────────────────────────────────────────
   Last verified: 2026-04-21
   Audit status: CORRECTED (10 fixes applied vs original data.js record)
   ═══════════════════════════════════════════════════════════════════════ */

const project = {
  /* ─── IDENTITY ─── */
  id: "emaar-golf-grand",
  project: "Golf Grand",
  name: "Golf Grand",
  developer: "Emaar Properties",
  developerName: "Emaar Properties",
  developerId: "emaar-properties",
  community: "Dubai Hills Estate",
  subCommunity: "Golf Club Villas Front",
  area: "Dubai Hills Estate",
  district: "DHE",
  emirate: "Dubai",
  type: "Apartment",
  tier: 1,

  /* ─── STATUS & LIFECYCLE ─── */
  status: "Off-Plan",
  lifecycleStage: "under-construction",
  constructionPct: 65,
  dldStatus: "Off-Plan (RERA Registered)",

  /* ─── RERA ─── */
  reraNo: null,
  projectNumber: null,

  /* ─── PRICING ─── */
  priceMin: 1400000,
  priceMax: 3400000,
  price: 1400000,
  ppsf: 1974,
  communityMedianPPSF: 2388,
  communityBenchmarkSource: "DHE 2025 avg",

  /* ─── YIELD ─── */
  grossYield: 6.4,
  netYield: 5.0,
  rentalClass: "Residential Primary",
  gross: 6.4,
  yield: 6.4,

  /* ─── SCALE ─── */
  plotSize: 338224,
  builtUpArea: null,
  totalBuildings: 1,
  storeys: 17,
  totalUnits: 329,
  totalVillas: 0,
  totalLands: 0,
  basementLevels: 1,
  sizeFrom: 680,
  sizeTo: 2011,

  /* ─── UNIT BREAKDOWN ─── */
  unitBreakdown: [
    { type: "1BR", count: 129, priceFrom: 1400000, ppsf: 2010, sqftMin: 680, sqftMax: 750 },
    { type: "2BR", count: 159, priceFrom: 2130000, ppsf: 1916, sqftMin: 1065, sqftMax: 1300 },
    { type: "3BR", count: 35,  priceFrom: 3400000, ppsf: 1905, sqftMin: 1650, sqftMax: 2011, notes: "Maid's room" },
    { type: "Commercial", count: 6 },
  ],
  beds: ["1 BR", "2 BR", "3 BR"],

  /* ─── LOCATION ─── */
  distMetro: 8,
  distDIFC: 15,
  distAirport: 24,
  distBeach: 14,
  distMall: 1,
  distSchool: 0.4,
  distHospital: 2,
  nearbySchools: [
    { name: "GEMS New Millennium School", distKm: 0.4, rating: "Very Good" },
    { name: "GEMS International School Al Khail", distKm: 0.5, rating: "Outstanding" },
    { name: "Safa Community School", distKm: 1.8, rating: "Outstanding" },
    { name: "King's School Al Barsha", distKm: 2.1, rating: "Outstanding" },
  ],

  /* ─── PRODUCT ─── */
  goldenVisa: true,
  branded: false,
  brandPartner: null,
  brand: "—",

  /* ─── PAYMENT ─── */
  paymentPlan: "10 / 80 / 10",
  payment: "10/80/10",
  paymentWaterfall: [
    { phase: "Down Payment", pct: 10, when: "At booking", instalments: 1 },
    { phase: "During Construction", pct: 80, when: "Milestones 2–8", instalments: 7 },
    { phase: "At Handover", pct: 10, when: "Q1 2027", instalments: 1 },
  ],
  postHandover: null,
  serviceCharge: 20,

  /* ─── HANDOVER ─── */
  handover: "Q1 2027",
  expectedHandover: "Q1 2027",
  contractedHandover: "2027-03-31",
  actualHandover: null,
  constructionStart: "2023-08-01",

  /* ─── ESCROW ─── */
  escrowBank: "Verify via DLD Mashrooi",
  escrowAccount: null,

  /* ─── CONSTRUCTION TEAM ─── */
  architect: "Dubai Consultants",
  mainContractor: "Transemirates Contracting",
  foundationContractor: "Rabat Foundation",

  /* ─── AMENITIES ─── */
  amenities: [
    "Infinity Swimming Pool", "Pool Deck", "State-of-the-art Fitness Centre",
    "Yoga Studio", "Kids Play Area", "Splash Pads", "Rooftop Lounge",
    "Indoor Multipurpose Hall", "Landscaped Podium Deck", "Outdoor Lawn",
    "Golf Course Frontage", "High-speed Elevators", "24/7 Security",
    "Fire Protection System", "Round-the-clock Maintenance", "Basement Resident Parking",
  ],
  view: [
    "Dubai Hills 18-Hole Championship Golf Course",
    "Landscaped Podium Deck",
    "Golf Club Villas",
    "Dubai Skyline (upper floors)",
  ],

  /* ─── LINKS ─── */
  emaarUrl: "https://www.propertyfinder.ae/en/new-projects/emaar-properties/golf-grand",

  /* ─── DESCRIPTION ─── */
  notes: "17-storey tower by Emaar Properties. Construction commenced Aug 2023 by Transemirates Contracting with Dubai Consultants as architect. Units 680–2,011 sqft. Golf-front location; project PPSF sits ~17% below community average.",

  /* ─── AUDIT METADATA ─── */
  _audit: {
    lastVerified: "2026-04-21",
    dataQuality: "high",
    sources: [
      "Propsearch.ae building registry",
      "Bayut project page",
      "Property Finder listings",
      "Metropolitan Premium Properties",
      "Emaar developer sheet",
      "RERA Smart Rental Index",
    ],
    flags: [
      { field: "reraNo", status: "pending", note: "Prior value 71494288692 invalid — true RERA number not confirmed" },
      { field: "escrowBank", status: "pending", note: "Confirm via DLD Mashrooi app" },
      { field: "grossYield", status: "estimate", note: "1BR avg; 2/3BR lower" },
    ],
    corrections: 10,
  },
};

export default project;
