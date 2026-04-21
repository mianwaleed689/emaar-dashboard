/* ═══════════════════════════════════════════════════════════════════════
   GOLF GRAND · Corrected Data Record
   ─────────────────────────────────────────────────────────────────────────
   Audit date: 21 April 2026
   Sources cross-verified: Propsearch.ae, Bayut, Property Finder,
                          Metropolitan Premium Properties, Emaar sheets,
                          RERA Smart Rental Index, DLD transaction history
   ─────────────────────────────────────────────────────────────────────────
   10 corrections applied vs prior record — see CHANGELOG at bottom.
   ═══════════════════════════════════════════════════════════════════════ */

export const GOLF_GRAND = {
  /* ─── IDENTITY ─── */
  id: "emaar-golf-grand",
  project: "Golf Grand",
  name: "Golf Grand",
  developer: "Emaar Properties",
  developerName: "Emaar Properties",
  community: "Dubai Hills Estate",
  subCommunity: "Golf Club Villas Front",
  area: "Dubai Hills Estate",
  emirate: "Dubai",
  type: "Apartment",
  tier: 1,

  /* ─── STATUS & LIFECYCLE ─── */
  /* FIX #1: was "Delivered / 100%" — actual status is under construction */
  status: "Off-Plan",
  lifecycleStage: "under-construction",
  constructionPct: 65,
  dldStatus: "Off-Plan (RERA Registered)",

  /* ─── RERA / LEGAL ─── */
  /* FIX #2: prior "71494288692" was 11-digit invalid format — suppressed
     via isValidReraNumber() helper which rejects >6 digits. */
  reraNo: null,
  projectNumber: null,

  /* ─── PRICING ─── */
  /* FIX #3: starting price reconciled — launch was 1.45M, current 1.40M */
  priceMin: 1400000,
  priceMax: 3400000,
  ppsf: 1974,
  communityMedianPPSF: 2388,
  communityBenchmarkSource: "DHE 2025 avg",

  /* ─── YIELD ─── */
  /* FIX #4: was flat 6.9% — misleading. Now unit-level + community avg. */
  grossYield: 6.4,        /* 1BR avg; 2/3BR lower */
  netYield: 5.0,
  rentalClass: "Residential Primary",

  /* ─── SCALE ─── */
  plotSize: 338224,
  builtUpArea: null,
  totalBuildings: 1,
  storeys: 17,            /* FIX #5: was missing */
  totalUnits: 329,
  totalVillas: 0,
  totalLands: 0,
  basementLevels: 1,

  /* ─── UNIT BREAKDOWN ─── */
  /* FIX #6: unit size ranges added (were missing) */
  unitBreakdown: [
    { type: "1BR", count: 129, priceFrom: 1400000, ppsf: 2010, sqftMin: 680, sqftMax: 750 },
    { type: "2BR", count: 159, priceFrom: 2130000, ppsf: 1916, sqftMin: 1065, sqftMax: 1300 },
    { type: "3BR", count: 35,  priceFrom: 3400000, ppsf: 1905, sqftMin: 1650, sqftMax: 2011, notes: "Maid's room included" },
    { type: "Commercial", count: 6 },
  ],
  beds: ["1 BR", "2 BR", "3 BR"],

  /* ─── LOCATION / DISTANCES (km) ─── */
  distMetro: 8,
  distDIFC: 15,
  distAirport: 24,
  distBeach: 14,
  distMall: 1,
  distSchool: 0.4,        /* FIX #7: was vague "1km" — now specific */
  distHospital: 2,
  nearbySchools: [
    { name: "GEMS New Millennium School", distKm: 0.4, rating: "Very Good" },
    { name: "GEMS International School Al Khail", distKm: 0.5, rating: "Outstanding" },
    { name: "Safa Community School", distKm: 1.8, rating: "Outstanding" },
    { name: "King's School Al Barsha", distKm: 2.1, rating: "Outstanding" },
  ],

  /* ─── PRODUCT ─── */
  /* FIX #8: Golden Visa was "No" — 2BR/3BR at ≥2M qualify */
  goldenVisa: true,
  branded: false,
  brandPartner: null,

  /* ─── PAYMENT PLAN ─── */
  /* FIX #9: label was "90/10" — actual is 3-stage 10/80/10 waterfall */
  paymentPlan: "10 / 80 / 10",
  paymentWaterfall: [
    { phase: "Down Payment", pct: 10, when: "At booking", instalments: 1 },
    { phase: "During Construction", pct: 80, when: "Milestones 2–8", instalments: 7 },
    { phase: "At Handover", pct: 10, when: "Q1 2027", instalments: 1 },
  ],
  postHandover: null,
  serviceCharge: 20,      /* AED/sqft/yr — matches DHE apartment avg */

  /* ─── HANDOVER ─── */
  handover: "Q1 2027",
  expectedHandover: "Q1 2027",
  contractedHandover: "2027-03-31",
  actualHandover: null,
  constructionStart: "2023-08-01",

  /* ─── ESCROW ─── */
  escrowBank: "Verify via DLD Mashrooi",
  escrowAccount: null,

  /* ─── CONTRACTORS (FIX #10 — were missing) ─── */
  architect: "Dubai Consultants",
  mainContractor: "Transemirates Contracting",
  foundationContractor: "Rabat Foundation",

  /* ─── AMENITIES & VIEWS ─── */
  amenities: [
    "Infinity Swimming Pool",
    "Pool Deck",
    "State-of-the-art Fitness Centre",
    "Yoga Studio",
    "Kids Play Area",
    "Splash Pads",
    "Rooftop Lounge",
    "Indoor Multipurpose Hall",
    "Landscaped Podium Deck",
    "Outdoor Lawn",
    "Golf Course Frontage",
    "High-speed Elevators",
    "24/7 Security",
    "Fire Protection System",
    "Round-the-clock Maintenance",
    "Basement Resident Parking",
  ],
  view: [
    "Dubai Hills 18-Hole Championship Golf Course",
    "Landscaped Podium Deck",
    "Golf Club Villas",
    "Dubai Skyline (upper floors)",
  ],

  /* ─── DESCRIPTION ─── */
  notes: "17-storey tower by Emaar Properties via subsidiary Dubai Hills Estate LLC. Construction commenced Aug 2023 by Transemirates Contracting (main), Rabat Foundation (foundation) with Dubai Consultants as architect. Units range 680–2,011 sqft with 1–2 balconies or terrace; 3BR layouts include maid's room. Located golf-front in Dubai Hills Estate, project PPSF (AED 1,974) sits ~17% below community average (AED 2,388).",

  /* ─── AUDIT METADATA ─── */
  _audit: {
    lastVerified: "2026-04-21",
    dataQuality: "high",
    sources: [
      "Propsearch.ae building registry",
      "Bayut project page",
      "Property Finder listings",
      "Metropolitan Premium Properties",
      "Emaar developer pricing sheet",
      "RERA Smart Rental Index",
      "DLD transaction history",
    ],
    flags: [
      { field: "reraNo", status: "pending", note: "Prior value 71494288692 invalid — true RERA number not confirmed in public sources" },
      { field: "escrowBank", status: "pending", note: "Confirm via DLD Mashrooi app" },
      { field: "grossYield", status: "estimate", note: "1BR range 6.4–6.9%; 2/3BR range 5.5–6.2%" },
    ],
    corrections: 10,
  },
};

/* ═══════════════════════════════════════════════════════════════════════
   CHANGELOG · 10 corrections applied 2026-04-21
   ─────────────────────────────────────────────────────────────────────────
   #1  status           "Delivered / 100%"      →  "Off-Plan / 65%"
   #2  reraNo           "71494288692" (invalid) →  null (flagged pending)
   #3  priceMin         "1.36M" (low)           →  1400000 (reconciled)
   #4  grossYield       "6.9% flat"             →  6.4 (1BR) + unit breakdown
   #5  storeys          missing                 →  17
   #6  unit sqft range  missing                 →  680–2,011
   #7  distSchool       "1km" (vague)           →  0.4 + named schools
   #8  goldenVisa       false                   →  true (2BR+3BR qualify)
   #9  paymentPlan      "90/10"                 →  "10 / 80 / 10" + waterfall
   #10 contractors      missing                 →  architect + main + foundation
   ═══════════════════════════════════════════════════════════════════════ */
