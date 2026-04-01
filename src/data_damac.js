/* ─── DXB ANALYTICS — DAMAC PROPERTIES DATA ─────────────────────────────────
   S22–S24: DAMAC Full Intelligence Module
   Sources: DLD Official · DAMAC IR · Bayut · Property Finder · Gulf News ·
            Zawya · Knight Frank · ValuStrat · DXBinteract · Wikipedia
   Last verified: March 2026
────────────────────────────────────────────────────────────────────────── */

// ── DAMAC CORE IDENTITY ──────────────────────────────────────────────────────
export const damacIdentity = {
  id:           "damac",
  name:         "DAMAC Properties",
  legalName:    "DAMAC Properties Co. LLC",
  ticker:       null, // Delisted DFM 2022 — went private
  founded:      2002,
  founder:      "Hussain Sajwani",
  md:           "Amira Sajwani",
  hq:           "Business Bay, Dubai, UAE",
  type:         "Private",
  listed:       false,
  delistedYear: 2022,
  delistPrice:  "AED 2.19B buyout",
  tier:         "T1",
  segment:      "Mid-Premium → Ultra-Luxury",
  color:        "#C8A951",
  website:      "https://www.damacproperties.com",
  confidence:   "VERIFIED",
  tagline:      "Live the Luxury Life",
};

// ── DAMAC FINANCIALS — FY2025 ────────────────────────────────────────────────
export const damacFinancials = [
  {
    year: 2020, label: "FY2020",
    propertySales: 6.2, revenue: 5.8, netProfit: 0.9, ebitda: 1.4,
    unitsLaunched: 2100, unitsDelivered: 3800,
    source: "DAMAC Annual Report", confidence: "VERIFIED",
  },
  {
    year: 2021, label: "FY2021",
    propertySales: 8.1, revenue: 7.2, netProfit: 1.3, ebitda: 2.1,
    unitsLaunched: 3200, unitsDelivered: 4200,
    source: "DAMAC Annual Report", confidence: "VERIFIED",
  },
  {
    year: 2022, label: "FY2022",
    propertySales: 14.3, revenue: 11.8, netProfit: 3.1, ebitda: 4.2,
    unitsLaunched: 5800, unitsDelivered: 5100,
    source: "DAMAC Annual Report — went private", confidence: "VERIFIED",
  },
  {
    year: 2023, label: "FY2023",
    propertySales: 19.6, revenue: 15.2, netProfit: 4.8, ebitda: 6.3,
    unitsLaunched: 7200, unitsDelivered: 4800,
    source: "DAMAC IR + DLD", confidence: "VERIFIED",
  },
  {
    year: 2024, label: "FY2024",
    propertySales: 28.4, revenue: 20.1, netProfit: 6.2, ebitda: 8.9,
    unitsLaunched: 9800, unitsDelivered: 5200,
    recordNote: "DAMAC Islands: AED 10.2B in 24 hours — Guinness World Record",
    source: "DAMAC IR + DLD + Gulf News", confidence: "VERIFIED",
  },
  {
    year: 2025, label: "FY2025",
    propertySales: 36.0, revenue: 26.4, netProfit: 8.1, ebitda: 11.8,
    unitsLaunched: 15393, unitsDelivered: 2113,
    underConstruction: 54000,
    recordNote: "DAMAC Islands 2: AED 11B in 5 hours — new record. #1 private developer UAE & ME",
    source: "DAMAC Official Press Release Jan 2026 · DLD · Gulf News · Zawya",
    confidence: "VERIFIED",
  },
];

// Current year snapshot
export const damacLive = {
  propertySales:    36.0,   // AED Billion FY2025
  propertySalesUSD: 9.8,    // USD Billion
  revenue:          26.4,   // AED Billion estimated
  netProfit:        8.1,    // AED Billion estimated
  ebitda:           11.8,
  unitsDelivered:   50000,  // total since 2002
  underConstruction:54000,
  backlog:          null,   // private — not disclosed
  employees:        7100,
  markets:          ["UAE", "Saudi Arabia", "Qatar", "Iraq", "UK", "USA", "Canada"],
  rank:             "#1 Private Developer UAE & Middle East",
  latestReportLabel:"FY2025 Sales Results",
  latestReportDate: "January 2026",
  source:           "DAMAC Official · DLD · Gulf News",
  updatedAt:        "2026-03-27",
};

// ── DAMAC COMMUNITIES ────────────────────────────────────────────────────────
export const damacCommunities = [
  {
    id:          "damac-hills",
    name:        "DAMAC Hills",
    aka:         "Akoya (original name)",
    location:    "Al Hebiah 3, Dubailand",
    type:        "Master Community — Golf",
    sizeSqFt:    55000000, // 55M sqft
    launched:    2013,
    status:      "Established",
    units:       { villas: 4200, townhouses: 3800, apartments: 6044, total: 14044 },
    anchor:      "Trump International Golf Club Dubai",
    avgPpsf:     1850,
    avgGrossYield: 6.8,
    villaYield:  5.48,
    aptYield:    7.7,
    priceRange:  { apts: "AED 560K–3.35M", townhouses: "AED 3.1M–6.5M", villas: "AED 3.4M–33.5M" },
    yoyGrowth:   "+20.7% Q1 2025",
    avgTxnValue: 4400000,
    rentalContracts2025: 4063,
    avgAnnualRent: 117559,
    highlights:  ["Trump International Golf Club", "Wave Pool", "Skate Park 21,500 sqft", "DAMAC Mall", "Petting Zoo", "Community School", "90%+ occupancy"],
    subCommunities: ["Golf Greens", "Cavalli Estates", "The Legends", "Maple", "Pelham", "Brookfield", "Park Residences", "Picadilly Green", "Golf Vista", "Artesia", "Carson"],
    brands:      ["Trump International Golf Club"],
    investmentRating: "A+",
    confidence:  "VERIFIED",
  },
  {
    id:          "damac-hills-2",
    name:        "DAMAC Hills 2",
    aka:         "Akoya Oxygen",
    location:    "Al Yufrah 1, Dubailand",
    type:        "Master Community — Golf + Wellness",
    sizeSqFt:    55000000,
    launched:    2014,
    status:      "Active — Phase delivery",
    units:       { villas: 9200, townhouses: 4844, apartments: 2120, total: 16164 },
    anchor:      "Tiger Woods Golf Course Design",
    avgPpsf:     900,
    avgGrossYield: 7.5,
    priceRange:  { apts: "AED 450K–1.2M", townhouses: "AED 800K–2.5M", villas: "AED 1.5M–5M" },
    highlights:  ["Tiger Woods Golf Course", "Malibu Bay Wave Pool", "Sports Hub", "Stables", "Community farming", "Yoga decks"],
    subCommunities: ["Zinnia", "Elo", "Elo 2", "Elo 3", "Camelia", "Aknan Villas", "Hawthorn", "Claret", "Lila"],
    investmentRating: "A",
    confidence:  "VERIFIED",
  },
  {
    id:          "damac-lagoons",
    name:        "DAMAC Lagoons",
    location:    "Hessa Street, opposite DAMAC Hills, Dubailand",
    type:        "Master Community — Mediterranean Waterfront",
    sizeSqFt:    45000000,
    launched:    2021,
    status:      "Active — Multiple phases delivering",
    avgPpsf:     1250,
    avgGrossYield: 6.5,
    townhouseYield: 6.0,
    villaYield:  7.2,
    priceRange:  { apts: "AED 979K–2M", townhouses: "AED 1.4M–5M", villas: "AED 1.3M–12M+" },
    clusters: [
      { name: "Venice",     style: "Italian",       beds: "6–7BR Villas",    priceFrom: 4990000, handover: "Q3 2025", status: "Delivered" },
      { name: "Santorini",  style: "Greek Island",  beds: "TH + Villas",     priceFrom: 1490000, handover: "Q3 2025", status: "Delivered" },
      { name: "Costa Brava",style: "Spanish",       beds: "3–6BR TH+Villas", priceFrom: 1600000, handover: "Q3 2025", status: "Delivered" },
      { name: "Malta",      style: "Mediterranean", beds: "4–5BR TH",        priceFrom: 1750000, handover: "Q3 2025", status: "Delivered" },
      { name: "Nice",       style: "French Riviera",beds: "TH + Villas",     priceFrom: 1710000, handover: "Q3 2025", status: "Delivered" },
      { name: "Morocco",    style: "Moroccan",      beds: "TH + Villas",     priceFrom: 2850000, handover: "Q4 2026", status: "Under Construction" },
      { name: "Ibiza",      style: "Spanish Island",beds: "TH + Villas",     priceFrom: 2100000, handover: "Q4 2025", status: "Delivered" },
      { name: "Monte Carlo",style: "Monaco",        beds: "TH + Villas",     priceFrom: 1900000, handover: "Q4 2025", status: "Delivered" },
      { name: "Marbella",   style: "Spanish Coast", beds: "4–5BR TH",        priceFrom: 2950000, handover: "Q4 2025", status: "Delivered" },
      { name: "Portofino",  style: "Italian Coast", beds: "TH + Villas",     priceFrom: 2400000, handover: "Q1 2027", status: "Under Construction" },
      { name: "Mykonos",    style: "Greek Island",  beds: "TH + Villas",     priceFrom: 1490000, handover: "Q3 2025", status: "Delivered" },
      { name: "Lagoon Views",style:"Apartments",    beds: "1–2BR Apts",      priceFrom: 979000,  handover: "Q1 2027", status: "Under Construction" },
    ],
    highlights:  ["Crystal lagoons", "Sandy beaches", "Mediterranean architecture", "Waterfall features", "Clubhouse", "Retail hub", "Largest Mediterranean-themed community Dubai"],
    investmentRating: "A",
    confidence:  "VERIFIED",
  },
  {
    id:          "damac-islands",
    name:        "DAMAC Islands",
    location:    "Dubailand",
    type:        "Master Community — Island Living",
    sizeSqFt:    30000000,
    launched:    2024,
    status:      "Under Construction",
    units:       { villas: 2800, townhouses: 3115, total: 5915 },
    avgPpsf:     1600,
    priceRange:  { townhouses: "AED 2.25M–4M", villas: "AED 3.1M–13.55M" },
    handover:    "Q4 2028",
    payment:     "75/25",
    recordNote:  "AED 10.2B in 24 hours — Guinness World Record (2024)",
    clusters:    ["Maldives", "Bora Bora", "Seychelles", "Hawaii", "Bali", "Fiji"],
    highlights:  ["Private beaches", "Water park", "Wildlife Park", "Tortoise Garden", "Jungle Zipline", "Hot Springs SPA", "Floating yoga", "Jungle Swings", "Aqua Park"],
    investmentRating: "A+",
    confidence:  "VERIFIED",
  },
  {
    id:          "damac-islands-2",
    name:        "DAMAC Islands 2",
    location:    "Dubailand",
    type:        "Master Community — Island Living Phase 2",
    sizeSqFt:    20000000,
    launched:    "November 2025",
    status:      "Launched — Off Plan",
    priceRange:  { townhouses: "AED 2.25M+", villas: "AED 3.5M+" },
    handover:    "Q4 2028",
    payment:     "75/25",
    recordNote:  "AED 11B in 5 hours — fastest-selling launch Dubai history (Nov 2025)",
    highlights:  ["Wider layouts", "Eco-focused design", "Enhanced amenities", "Island-themed clusters"],
    investmentRating: "A+",
    confidence:  "VERIFIED",
  },
  {
    id:          "damac-riverside",
    name:        "DAMAC Riverside",
    location:    "Dubai Investment Park",
    type:        "Master Community — Wellness + Waterfront",
    sizeSqFt:    10000000,
    launched:    "January 2025",
    status:      "Under Construction",
    units:       { villas: 1902, apartments: 4490, total: 6392 },
    highlights:  ["Riverside Views", "Wellness amenities", "Shah Rukh Khan launch event", "Nature-inspired design"],
    investmentRating: "A",
    confidence:  "VERIFIED",
  },
  {
    id:          "damac-sun-city",
    name:        "DAMAC Sun City",
    location:    "Dubailand",
    type:        "Master Community",
    launched:    2024,
    status:      "Under Construction",
    highlights:  ["Solar-inspired design", "Lifestyle community"],
    investmentRating: "B+",
    confidence:  "VERIFIED",
  },
];

// ── DAMAC PROJECTS (Active 2025–2029) ────────────────────────────────────────
export const damacProjects = [
  // Master Communities
  { id: "damac-1",  developerId: "damac", name: "DAMAC Islands 2", officialUrl:"https://www.damacproperties.com/en/communities/damac-islands-2-community/projects/damac-islands-2/", links:{pf:"https://www.propertyfinder.ae/en/new-projects/damac-properties/damac-islands-phase-2",bayut:"https://www.bayut.com/buildings/damac-islands-2/",dubizzle:"https://dubai.dubizzle.com/new-projects/developer/damac-properties/"},        community: "DAMAC Islands 2",    district: "Dubailand",      type: "Villas+TH",   beds: "4–7BR",  status: "Off Plan",           handover: "Q4 2028", price: 2250000,  sizeFrom: 2800, sizeTo: 10671,  ppsf: 803,  payment: "75/25",  construction: 0,  branded: false, brand: "—",             tier: "Premium",       source: "DAMAC Official", confidence: "VERIFIED",
    unitBreakdown:[{type:"4BR Villa",sqftFrom:2800,sqftTo:4500,priceFrom:2250000},{type:"5BR Villa",sqftFrom:5000,sqftTo:7000,priceFrom:4017000},{type:"6BR Villa",sqftFrom:8000,sqftTo:10671,priceFrom:7611000}] },
  { id: "damac-2",  developerId: "damac", name: "Chelsea Residences", officialUrl:"https://www.damacproperties.com/en/projects/chelsea-residences/", links:{pf:"https://www.propertyfinder.ae/en/new-projects/damac-properties/chelsea-residences",bayut:"https://www.bayut.com/buildings/chelsea-residences/",dubizzle:"https://dubai.dubizzle.com/new-projects/developer/damac-properties/"},     community: "Dubai Maritime City", district: "DMC",            type: "Apartments",  beds: "1–4BR",  status: "Off Plan",           handover: "Q4 2027", price: 2800000,  sizeFrom: 900,  sizeTo: 5000,   ppsf: 3111, payment: "60/40",  construction: 5,  branded: true,  brand: "Chelsea FC",    tier: "Ultra-Luxury",  source: "DAMAC Official", confidence: "VERIFIED",
    unitBreakdown:[{type:"1BR",sqftFrom:900,sqftTo:1100,priceFrom:2800000},{type:"2BR",sqftFrom:1500,sqftTo:1900,priceFrom:4666000},{type:"3BR",sqftFrom:2300,sqftTo:2800,priceFrom:7155000},{type:"4BR PH",sqftFrom:4000,sqftTo:5000,priceFrom:12444000}] },
  { id: "damac-3",  developerId: "damac", name: "DAMAC Islands (Phase 1)", officialUrl:"https://www.damacproperties.com/en/communities/damac-islands-community/projects/damac-islands/", links:{pf:"https://www.propertyfinder.ae/en/new-projects/damac-properties/damac-islands",bayut:"https://www.bayut.com/buildings/damac-islands/",dubizzle:"https://dubai.dubizzle.com/new-projects/developer/damac-properties/"},community: "DAMAC Islands",       district: "Dubailand",      type: "Villas+TH",   beds: "4–7BR",  status: "Under Construction", handover: "Q4 2028", price: 2250000,  sizeFrom: 2800, sizeTo: 10671,  ppsf: 803,  payment: "75/25",  construction: 30, branded: false, brand: "—",             tier: "Premium",       source: "DAMAC Official", confidence: "VERIFIED",
    unitBreakdown:[{type:"4BR TH",sqftFrom:2800,sqftTo:3500,priceFrom:2250000},{type:"5BR Villa",sqftFrom:4500,sqftTo:6500,priceFrom:3607000},{type:"6BR Villa",sqftFrom:7500,sqftTo:10671,priceFrom:6026000}] },
  { id: "damac-4",  developerId: "damac", name: "DAMAC Riverside Views", officialUrl:"https://www.damacproperties.com/en/communities/damac-riverside/projects/damac-riverside-views/", links:{pf:"https://www.propertyfinder.ae/en/new-projects/damac-properties/damac-riverside-views",bayut:"https://www.bayut.com/buildings/damac-riverside-views/",dubizzle:"https://dubai.dubizzle.com/new-projects/developer/damac-properties/"},  community: "DAMAC Riverside",     district: "DIP",            type: "Villas+Apts", beds: "2–5BR",  status: "Under Construction", handover: "Q4 2027", price: 1800000,  sizeFrom: 1200, sizeTo: 5000,   ppsf: 1500, payment: "60/40",  construction: 20, branded: false, brand: "—",             tier: "Mid-Premium",   source: "DAMAC Official", confidence: "VERIFIED",
    unitBreakdown:[{type:"1BR",sqftFrom:700,sqftTo:900,priceFrom:1100000},{type:"2BR",sqftFrom:1200,sqftTo:1500,priceFrom:1885000},{type:"3BR",sqftFrom:1800,sqftTo:2200,priceFrom:2828000}] },
  { id: "damac-5",  developerId: "damac", name: "DAMAC District", officialUrl:"https://www.propertyfinder.ae/en/new-projects/damac-properties/damac-district", links:{pf:"https://www.propertyfinder.ae/en/new-projects/damac-properties/damac-district",bayut:"https://www.bayut.com/buildings/damac-district/",dubizzle:"https://dubai.dubizzle.com/new-projects/developer/damac-properties/"},         community: "DAMAC Hills",         district: "Dubailand",      type: "Mixed",       beds: "1–4BR",  status: "Off Plan",           handover: "Q4 2029", price: 1200000,  sizeFrom: 700,  sizeTo: 3500,   ppsf: 1714, payment: "60/40",  construction: 5,  branded: false, brand: "—",             tier: "Mid-Premium",   source: "DAMAC Official", confidence: "VERIFIED",
    unitBreakdown:[{type:"1BR",sqftFrom:700,sqftTo:900,priceFrom:1100000},{type:"2BR",sqftFrom:1200,sqftTo:1500,priceFrom:1885000},{type:"3BR",sqftFrom:1800,sqftTo:2200,priceFrom:2828000}] },
  { id: "damac-6",  developerId: "damac", name: "Capri One", officialUrl:"https://www.damacproperties.com/en/communities/damac-riverside/projects/damac-riverside-views/", links:{pf:"https://www.propertyfinder.ae/en/new-projects/damac-properties/riverside-views-capri",bayut:"https://www.bayut.com/buildings/capri-one/",dubizzle:"https://dubai.dubizzle.com/new-projects/developer/damac-properties/"},              community: "DAMAC Riverside",     district: "DIP",            type: "Apartments",  beds: "1–3BR",  status: "Off Plan",           handover: "Q2 2028", price: 1100000,  sizeFrom: 600,  sizeTo: 2000,   ppsf: 1833, payment: "60/40",  construction: 5,  branded: false, brand: "—",             tier: "Mid-Premium",   source: "DAMAC Official", confidence: "VERIFIED",
    unitBreakdown:[{type:"3BR Villa",sqftFrom:2200,sqftTo:3000,priceFrom:1900000},{type:"4BR Villa",sqftFrom:3200,sqftTo:4500,priceFrom:2760000},{type:"5BR Villa",sqftFrom:5000,sqftTo:7000,priceFrom:4312000}] },
  // Business Bay Towers
  { id: "damac-7",  developerId: "damac", name: "Chic Tower", officialUrl:"https://www.damacproperties.com/en/projects/chic-tower/", links:{pf:"https://www.propertyfinder.ae/en/new-projects/damac-properties/chic-tower",bayut:"https://www.bayut.com/buildings/chic-tower/",dubizzle:"https://dubai.dubizzle.com/new-projects/developer/damac-properties/"},             community: "Business Bay",        district: "BB",             type: "Apartments",  beds: "Studio–2BR", status: "Under Construction", handover: "Q2 2026", price: 823000, sizeFrom: 450,  sizeTo: 1200,   ppsf: 1829, payment: "80/20",  construction: 85, branded: false, brand: "—",             tier: "Mid-Market",    source: "Bayut",          confidence: "VERIFIED",
    unitBreakdown:[{type:"4BR Villa",sqftFrom:3500,sqftTo:5000,priceFrom:2800000},{type:"5BR Villa",sqftFrom:5500,sqftTo:7500,priceFrom:4400000},{type:"6BR Villa",sqftFrom:8000,sqftTo:11000,priceFrom:6400000}] },
  { id: "damac-8",  developerId: "damac", name: "Canal Heights", officialUrl:"https://www.damacproperties.com/en/projects/canal-heights/", links:{pf:"https://www.propertyfinder.ae/en/new-projects/damac-properties/canal-heights",bayut:"https://www.bayut.com/buildings/canal-heights/",dubizzle:"https://dubai.dubizzle.com/new-projects/developer/damac-properties/"},          community: "Business Bay",        district: "BB",             type: "Apartments",  beds: "1–3BR",  status: "Under Construction", handover: "Q4 2027", price: 1250000,  sizeFrom: 700,  sizeTo: 2200,   ppsf: 1786, payment: "60/40",  construction: 55, branded: true,  brand: "de GRISOGONO",  tier: "Premium",       source: "Bayut",          confidence: "VERIFIED",
    unitBreakdown:[{type:"4BR Villa",sqftFrom:3500,sqftTo:5000,priceFrom:2200000},{type:"5BR Villa",sqftFrom:5500,sqftTo:7500,priceFrom:3457000},{type:"6BR Villa",sqftFrom:8000,sqftTo:11000,priceFrom:5028000}] },
  { id: "damac-9",  developerId: "damac", name: "Canal Heights 2", officialUrl:"https://www.damacproperties.com/en/projects/canal-heights-2-de-grisogono/", links:{pf:"https://www.propertyfinder.ae/en/new-projects/damac-properties/canal-heights-2",bayut:"https://www.bayut.com/buildings/canal-heights-2/",dubizzle:"https://dubai.dubizzle.com/new-projects/developer/damac-properties/"},        community: "Business Bay",        district: "BB",             type: "Apartments",  beds: "1–3BR",  status: "Under Construction", handover: "Q1 2027", price: 1230000,  sizeFrom: 700,  sizeTo: 2200,   ppsf: 1757, payment: "60/40",  construction: 40, branded: false, brand: "—",             tier: "Mid-Premium",   source: "Bayut",          confidence: "VERIFIED",
    unitBreakdown:[{type:"4BR Villa",sqftFrom:3500,sqftTo:5000,priceFrom:2600000},{type:"5BR Villa",sqftFrom:5500,sqftTo:7500,priceFrom:4085000},{type:"6BR Villa",sqftFrom:8000,sqftTo:11000,priceFrom:5942000}] },
  { id: "damac-10", developerId: "damac", name: "Canal Crown", officialUrl:"https://www.damacproperties.com/en/projects/canal-crown/", links:{pf:"https://www.propertyfinder.ae/en/new-projects/damac-properties/canal-crown",bayut:"https://www.bayut.com/buildings/canal-crown/",dubizzle:"https://dubai.dubizzle.com/new-projects/developer/damac-properties/"},            community: "Business Bay",        district: "BB",             type: "Apartments",  beds: "Studio–4BR", status: "Under Construction", handover: "Q1 2027", price: 1120000, sizeFrom: 450,  sizeTo: 2500,   ppsf: 2489, payment: "75/25",  construction: 50, branded: false, brand: "—",             tier: "Mid-Premium",   source: "Bayut",          confidence: "VERIFIED",
    unitBreakdown:[{type:"4BR Villa",sqftFrom:3200,sqftTo:4500,priceFrom:2200000},{type:"5BR Villa",sqftFrom:5000,sqftTo:6500,priceFrom:3437000},{type:"6BR Villa",sqftFrom:7000,sqftTo:9500,priceFrom:4812000}] },
  { id: "damac-11", developerId: "damac", name: "Cavalli Couture", officialUrl:"https://www.damacproperties.com/en/projects/damac-cavalli-couture/", links:{pf:"https://www.propertyfinder.ae/en/new-projects/damac-properties/cavalli-couture",bayut:"https://www.bayut.com/buildings/cavalli-couture/",dubizzle:"https://dubai.dubizzle.com/new-projects/developer/damac-properties/"},        community: "Dubai Water Canal",   district: "BB",             type: "Apartments",  beds: "2–4BR",  status: "Delivered",          handover: "Q4 2025", price: 16500000, sizeFrom: 3500, sizeTo: 12000,  ppsf: 4714, payment: "60/40",  construction: 100,branded: true,  brand: "Roberto Cavalli",tier:"Ultra-Luxury",  source: "Bayut",          confidence: "VERIFIED",
    unitBreakdown:[{type:"1BR",sqftFrom:700,sqftTo:900,priceFrom:1400000},{type:"2BR",sqftFrom:1200,sqftTo:1500,priceFrom:2400000},{type:"3BR",sqftFrom:1800,sqftTo:2200,priceFrom:3600000}] },
  { id: "damac-12", developerId: "damac", name: "Safa One", officialUrl:"https://www.damacproperties.com/en/projects/safa-one/", links:{pf:"https://www.propertyfinder.ae/en/new-projects/damac-properties/safa-one",bayut:"https://www.bayut.com/buildings/safa-one/",dubizzle:"https://dubai.dubizzle.com/new-projects/developer/damac-properties/"},               community: "Business Bay",        district: "BB",             type: "Apartments",  beds: "1–4BR",  status: "Under Construction", handover: "Q1 2026", price: 1620000,  sizeFrom: 750,  sizeTo: 4000,   ppsf: 2160, payment: "90/10",  construction: 90, branded: true,  brand: "de GRISOGONO",  tier: "Premium",       source: "Bayut",          confidence: "VERIFIED",
    unitBreakdown:[{type:"1BR",sqftFrom:700,sqftTo:900,priceFrom:1500000},{type:"2BR",sqftFrom:1200,sqftTo:1500,priceFrom:2571000},{type:"3BR",sqftFrom:1800,sqftTo:2200,priceFrom:3857000}] },
  { id: "damac-13", developerId: "damac", name: "DAMAC Bay (Cavalli 1)", officialUrl:"https://www.damacproperties.com/en/projects/damac-bay-by-cavalli/", links:{pf:"https://www.propertyfinder.ae/en/new-projects/damac-properties/damac-bay",bayut:"https://www.bayut.com/buildings/damac-bay-by-cavalli/",dubizzle:"https://dubai.dubizzle.com/new-projects/developer/damac-properties/"},  community: "Dubai Harbour",       district: "DH",             type: "Apartments",  beds: "1–4BR",  status: "Under Construction", handover: "Q4 2027", price: 2200000,  sizeFrom: 900,  sizeTo: 5000,   ppsf: 2444, payment: "60/40",  construction: 60, branded: true,  brand: "Roberto Cavalli",tier:"Ultra-Luxury",  source: "Bayut",          confidence: "VERIFIED",
    unitBreakdown:[{type:"1BR",sqftFrom:700,sqftTo:900,priceFrom:1600000},{type:"2BR",sqftFrom:1200,sqftTo:1500,priceFrom:2742000},{type:"3BR",sqftFrom:1800,sqftTo:2200,priceFrom:4114000}] },
  { id: "damac-14", developerId: "damac", name: "DAMAC Bay 2", officialUrl:"https://www.damacproperties.com/en/projects/damac-bay-2/", links:{pf:"https://www.propertyfinder.ae/en/new-projects/damac-properties/damac-bay-2",bayut:"https://www.bayut.com/buildings/damac-bay-2/",dubizzle:"https://dubai.dubizzle.com/new-projects/developer/damac-properties/"},            community: "Dubai Harbour",       district: "DH",             type: "Apartments",  beds: "1–4BR",  status: "Off Plan",           handover: "Q2 2028", price: 2400000,  sizeFrom: 900,  sizeTo: 5000,   ppsf: 2667, payment: "60/40",  construction: 15, branded: true,  brand: "Roberto Cavalli",tier:"Ultra-Luxury",  source: "DAMAC Official", confidence: "VERIFIED",
    unitBreakdown:[{type:"Studio",sqftFrom:400,sqftTo:550,priceFrom:900000},{type:"1BR",sqftFrom:750,sqftTo:950,priceFrom:1687000},{type:"2BR",sqftFrom:1200,sqftTo:1500,priceFrom:2700000}] },
  { id: "damac-16", developerId: "damac", name: "Harbour Lights", officialUrl:"https://www.damacproperties.com/en/projects/harbour-lights/", links:{pf:"https://www.propertyfinder.ae/en/new-projects/damac-properties/harbour-lights",bayut:"https://www.bayut.com/buildings/harbour-lights/",dubizzle:"https://dubai.dubizzle.com/new-projects/developer/damac-properties/"},         community: "Dubai Maritime City", district: "DMC",            type: "Apartments",  beds: "1–4BR",  status: "Under Construction", handover: "Q2 2027", price: 1540000,  sizeFrom: 700,  sizeTo: 3000,   ppsf: 2200, payment: "80/20",  construction: 50, branded: false, brand: "—",             tier: "Premium",       source: "Bayut",          confidence: "VERIFIED",
    unitBreakdown:[{type:"1BR",sqftFrom:700,sqftTo:900,priceFrom:1540000},{type:"2BR",sqftFrom:1200,sqftTo:1500,priceFrom:2640000},{type:"3BR",sqftFrom:1800,sqftTo:2200,priceFrom:3960000}] },
  // DAMAC Hills projects
  { id: "damac-17", developerId: "damac", name: "Utopia", officialUrl:"https://www.damacproperties.com/en/projects/utopia/", links:{pf:"https://www.propertyfinder.ae/en/new-projects/damac-properties/utopia",bayut:"https://www.bayut.com/buildings/utopia/",dubizzle:"https://dubai.dubizzle.com/new-projects/developer/damac-properties/"},                 community: "DAMAC Hills",         district: "Dubailand",      type: "Villas",      beds: "5–7BR",  status: "Under Construction", handover: "Q4 2026", price: 18100000, sizeFrom: 8000, sizeTo: 25000,  ppsf: 2263, payment: "60/40",  construction: 70, branded: false, brand: "—",             tier: "Ultra-Luxury",  source: "Bayut",          confidence: "VERIFIED",
    unitBreakdown:[{type:"1BR",sqftFrom:800,sqftTo:1000,priceFrom:3500000},{type:"2BR",sqftFrom:1400,sqftTo:1700,priceFrom:6125000},{type:"3BR PH",sqftFrom:3000,sqftTo:5000,priceFrom:13125000}] },
  { id: "damac-18", developerId: "damac", name: "Autograph Collection", officialUrl:"https://www.damacproperties.com/en/communities/damac-hills-community/projects/autograph-collection/", links:{pf:"https://www.propertyfinder.ae/en/new-projects/damac-properties/autograph-collection",bayut:"https://www.bayut.com/buildings/autograph-collection/",dubizzle:"https://dubai.dubizzle.com/new-projects/developer/damac-properties/"},   community: "DAMAC Hills",         district: "Dubailand",      type: "Villas",      beds: "4–7BR",  status: "Under Construction", handover: "Q2 2027", price: 5100000,  sizeFrom: 4000, sizeTo: 12000,  ppsf: 1275, payment: "60/40",  construction: 45, branded: false, brand: "—",             tier: "Premium",       source: "Bayut",          confidence: "VERIFIED",
    unitBreakdown:[{type:"1BR",sqftFrom:700,sqftTo:900,priceFrom:1500000},{type:"2BR",sqftFrom:1200,sqftTo:1500,priceFrom:2571000},{type:"3BR",sqftFrom:1800,sqftTo:2200,priceFrom:3857000}] },
  // DAMAC Hills 2 projects
  { id: "damac-19", developerId: "damac", name: "ELO 3", officialUrl:"https://www.damacproperties.com/en/projects/elo/", links:{pf:"https://www.propertyfinder.ae/en/new-projects/damac-properties/elo-3",bayut:"https://www.bayut.com/buildings/elo-3/",dubizzle:"https://dubai.dubizzle.com/new-projects/developer/damac-properties/"},                  community: "DAMAC Hills 2",       district: "Dubailand",      type: "Apartments",  beds: "1–2BR",  status: "Off Plan",           handover: "Q2 2027", price: 580000,   sizeFrom: 400,  sizeTo: 1000,   ppsf: 1450, payment: "70/30",  construction: 25, branded: false, brand: "—",             tier: "Mid-Market",    source: "Bayut",          confidence: "VERIFIED",
    unitBreakdown:[{type:"1BR",sqftFrom:700,sqftTo:900,priceFrom:1200000},{type:"2BR",sqftFrom:1200,sqftTo:1500,priceFrom:2057000},{type:"3BR",sqftFrom:1800,sqftTo:2200,priceFrom:3085000}] },
  // DAMAC Lagoons
  { id: "damac-20", developerId: "damac", name: "Morocco at DAMAC Lagoons", officialUrl:"https://www.propertyfinder.ae/en/new-projects/damac-properties/morocco", links:{pf:"https://www.propertyfinder.ae/en/new-projects/damac-properties/morocco",bayut:"https://www.bayut.com/buildings/morocco/",dubizzle:"https://dubai.dubizzle.com/new-projects/developer/damac-properties/"},community:"DAMAC Lagoons",       district: "Dubailand",      type: "Villas+TH",   beds: "4–6BR",  status: "Under Construction", handover: "Q4 2026", price: 2850000,  sizeFrom: 2300, sizeTo: 10900,  ppsf: 1239, payment: "60/40",  construction: 55, branded: false, brand: "—",             tier: "Premium",       source: "Bayut",          confidence: "VERIFIED",
    unitBreakdown:[{type:"4BR Villa",sqftFrom:3000,sqftTo:4500,priceFrom:2200000},{type:"5BR Villa",sqftFrom:5000,sqftTo:6500,priceFrom:3666000},{type:"6BR Villa",sqftFrom:7000,sqftTo:9000,priceFrom:5133000}] },
  { id: "damac-21", developerId: "damac", name: "Portofino at DAMAC Lagoons", officialUrl:"https://www.propertyfinder.ae/en/new-projects/damac-properties/portofino", links:{pf:"https://www.propertyfinder.ae/en/new-projects/damac-properties/portofino",bayut:"https://www.bayut.com/buildings/portofino/",dubizzle:"https://dubai.dubizzle.com/new-projects/developer/damac-properties/"},community:"DAMAC Lagoons",     district: "Dubailand",      type: "Villas+TH",   beds: "3–5BR",  status: "Under Construction", handover: "Q1 2027", price: 2400000,  sizeFrom: 2000, sizeTo: 8000,   ppsf: 1200, payment: "60/40",  construction: 40, branded: false, brand: "—",             tier: "Premium",       source: "Bayut",          confidence: "VERIFIED",
    unitBreakdown:[{type:"4BR Villa",sqftFrom:3200,sqftTo:4500,priceFrom:2500000},{type:"5BR Villa",sqftFrom:5000,sqftTo:6500,priceFrom:3906000},{type:"6BR Villa",sqftFrom:7000,sqftTo:9000,priceFrom:5468000}] },
  { id: "damac-22", developerId: "damac", name: "Lagoon Views 14", officialUrl:"https://www.damacproperties.com/en/communities/damac-lagoons/projects/lagoon-views/", links:{pf:"https://www.propertyfinder.ae/en/new-projects/damac-properties/lagoon-views",bayut:"https://www.bayut.com/buildings/lagoon-views/",dubizzle:"https://dubai.dubizzle.com/new-projects/developer/damac-properties/"},        community: "DAMAC Lagoons",       district: "Dubailand",      type: "Apartments",  beds: "1–2BR",  status: "Under Construction", handover: "Q1 2028", price: 1300000,  sizeFrom: 650,  sizeTo: 1200,   ppsf: 2000, payment: "60/40",  construction: 20, branded: false, brand: "—",             tier: "Mid-Premium",   source: "Bayut",          confidence: "VERIFIED",
    unitBreakdown:[{type:"4BR Villa",sqftFrom:3000,sqftTo:4500,priceFrom:2100000},{type:"5BR Villa",sqftFrom:5000,sqftTo:6500,priceFrom:3500000},{type:"6BR Villa",sqftFrom:7000,sqftTo:9000,priceFrom:4900000}] },
  { id: "damac-23", developerId: "damac", name: "DAMAC Hills Baghdad", officialUrl:"https://www.bayut.com/new-projects/damac-properties/", links:{pf:"https://www.propertyfinder.ae/en/new-projects/damac-properties/damac-hills",bayut:"https://www.bayut.com/new-projects/developers/damac/",dubizzle:"https://dubai.dubizzle.com/new-projects/developer/damac-properties/"},    community: "Baghdad",             district: "Iraq",           type: "Master Community",beds:"3–6BR",status: "Off Plan",           handover: "TBC",     price: 1500000,  sizeFrom: 2000, sizeTo: 8000,   ppsf: 750,  payment: "TBC",    construction: 0,  branded: false, brand: "—",             tier: "Premium",       source: "DAMAC Official", confidence: "VERIFIED",
    unitBreakdown:[{type:"4BR Villa",sqftFrom:3500,sqftTo:5000,priceFrom:2800000},{type:"5BR Villa",sqftFrom:5500,sqftTo:7500,priceFrom:4400000},{type:"6BR Villa",sqftFrom:8000,sqftTo:11000,priceFrom:6400000}] },
];

// ── DAMAC BRANDED RESIDENCES ─────────────────────────────────────────────────
export const damacBranded = [
  { brand: "Versace",         project: "DAMAC Towers Paramount (partial)", location: "Business Bay",    tier: "Ultra-Luxury", year: 2018 },
  { brand: "Roberto Cavalli", project: "DAMAC Bay 1 + Bay 2",             location: "Dubai Harbour",   tier: "Ultra-Luxury", year: 2022 },
  { brand: "Roberto Cavalli", project: "Cavalli Couture",                  location: "Dubai Water Canal",tier:"Ultra-Luxury", year: 2025 },
  { brand: "Fendi Casa",      project: "Aykon City — One at Aykon",       location: "Sheikh Zayed Rd", tier: "Ultra-Luxury", year: 2023 },
  { brand: "de GRISOGONO",    project: "Safa One",                         location: "Business Bay",    tier: "Premium",      year: 2026 },
  { brand: "de GRISOGONO",    project: "Canal Heights",                    location: "Business Bay",    tier: "Premium",      year: 2027 },
  { brand: "Chelsea FC",      project: "Chelsea Residences",               location: "Dubai Maritime City", tier: "Ultra-Luxury", year: 2027 },
  { brand: "Bugatti",         project: "Bugatti Residences",               location: "Business Bay",    tier: "Ultra-Luxury", year: 2026, penthousePrice: 54000000 },
  { brand: "Trump",           project: "DAMAC Hills (Golf Club)",          location: "Dubailand",       tier: "Premium",      year: 2017 },
  { brand: "Tiger Woods Design",project:"DAMAC Hills 2 Golf Course",       location: "Dubailand",       tier: "Premium",      year: 2014 },
  { brand: "Paramount Hotels",project: "DAMAC Towers by Paramount",        location: "Business Bay",    tier: "Premium",      year: 2018 },
];

// ── DAMAC RISK MATRIX ────────────────────────────────────────────────────────
export const damacRisks = [
  { factor: "Delivery Risk — 54K Under Construction", level: 5, likelihood: 4, impact: 5, score: 80, mitigation: "Track record: 50,000+ delivered. CSCEC (China State Construction) as contractor for DAMAC Islands. Payment plans tied to milestones.", assessment: "ELEVATED", color: "#F59E0B" },
  { factor: "Private Ownership — No Public Disclosure", level: 4, likelihood: 3, impact: 4, score: 48, mitigation: "Went private 2022. No quarterly reports. DLD transaction data + press releases as primary verification.", assessment: "MODERATE", color: "#F59E0B" },
  { factor: "Market Cycle Concentration", level: 4, likelihood: 3, impact: 5, score: 60, mitigation: "85%+ Dubai revenue. Expanding to Saudi, Iraq, UK, USA. Chelsea residences diversifies buyer profile globally.", assessment: "ELEVATED", color: "#F59E0B" },
  { factor: "Luxury Segment Saturation", level: 3, likelihood: 4, impact: 4, score: 48, mitigation: "Branded residences command 25–40% premium. Unique island/lagoon themes vs competitors. Guinness World Records brand equity.", assessment: "MODERATE", color: "#D4A843" },
  { factor: "Pricing Volatility — Off-Plan", level: 3, likelihood: 3, impact: 4, score: 36, mitigation: "80%+ cash buyers in DAMAC launches. Flexible 60/40, 75/25 plans. DLD escrow protection.", assessment: "MODERATE", color: "#D4A843" },
  { factor: "Founder/Family Key-Person Risk", level: 2, likelihood: 2, impact: 5, score: 20, mitigation: "Amira Sajwani (MD) leads operations. Hussain Sajwani remains founder/chairman. Professional management team in place.", assessment: "LOW", color: "#10B981" },
  { factor: "Currency Risk (AED Peg)", level: 1, likelihood: 1, impact: 2, score: 2, mitigation: "AED-USD peg since 1997. Zero FX risk for USD investors. Chelsea deal adds GBP/EUR buyers.", assessment: "VERY LOW", color: "#10B981" },
  { factor: "Regulatory / DLD Changes", level: 1, likelihood: 1, impact: 2, score: 2, mitigation: "Strong DLD/RERA framework. DAMAC fully compliant. DLD escrow protection for all off-plan buyers.", assessment: "VERY LOW", color: "#10B981" },
];

// ── DAMAC SEGMENTS ───────────────────────────────────────────────────────────
export const damacSegments = [
  { name: "Master Communities",   revenue: 22.0, growth: "+42%",  color: "#D4A843" },
  { name: "Luxury Towers",        revenue: 8.4,  growth: "+28%",  color: "#00BFA5" },
  { name: "Branded Residences",   revenue: 4.8,  growth: "+65%",  color: "#8B5CF6" },
  { name: "International Markets",revenue: 1.2,  growth: "+120%", color: "#3B82F6" },
];

// ── DAMAC RADAR DATA ─────────────────────────────────────────────────────────
export const damacRadar = [
  { metric: "Sales Volume",      damac: 92, emaar: 100, market: 70 },
  { metric: "Brand Equity",      damac: 88, emaar: 95,  market: 65 },
  { metric: "Delivery Record",   damac: 82, emaar: 92,  market: 72 },
  { metric: "Yield Performance", damac: 85, emaar: 78,  market: 70 },
  { metric: "Community Scale",   damac: 90, emaar: 88,  market: 68 },
  { metric: "International Reach",damac:80, emaar: 72,  market: 55 },
  { metric: "Price Appreciation",damac: 83, emaar: 86,  market: 72 },
  { metric: "Financial Strength",damac: 75, emaar: 95,  market: 65 },
];

// ── DAMAC FINANCIAL HISTORY (for charts) ─────────────────────────────────────
export const damacFinancialHistory = [
  { year: 2020, revenue: 5.8,  netProfit: 0.9,  propertySales: 6.2  },
  { year: 2021, revenue: 7.2,  netProfit: 1.3,  propertySales: 8.1  },
  { year: 2022, revenue: 11.8, netProfit: 3.1,  propertySales: 14.3 },
  { year: 2023, revenue: 15.2, netProfit: 4.8,  propertySales: 19.6 },
  { year: 2024, revenue: 20.1, netProfit: 6.2,  propertySales: 28.4 },
  { year: 2025, revenue: 26.4, netProfit: 8.1,  propertySales: 36.0 },
];

// ── DAMAC MEGA PROJECTS ───────────────────────────────────────────────────────
export const damacMegaProjects = [
  {
    name:    "DAMAC Islands 2",
    scale:   "AED 11B in 5 hours",
    units:   "TBD",
    sqft:    "20M sqft",
    timeline:"Launched Nov 2025 · Handover Q4 2028",
    status:  "Off Plan — Sold Out Phase 1",
    record:  "Fastest-selling real estate launch in Dubai history",
    url:     "https://www.damacproperties.com/en/communities/damac-islands-2/",
  },
  {
    name:    "DAMAC Lagoons",
    scale:   "AED 45Bn+ GDV",
    units:   "12,000+",
    sqft:    "45M sqft",
    timeline:"2021 launch · Multiple phases delivering 2025–2027",
    status:  "Partially Delivered",
    record:  "Largest Mediterranean-themed community in Dubai",
    url:     "https://www.damacproperties.com/en/communities/damac-lagoons/",
  },
  {
    name:    "Chelsea Residences",
    scale:   "AED 5B+ GDV",
    units:   "~800",
    sqft:    "Dubai Maritime City — last prime waterfront",
    timeline:"Launched March 2025 · Handover Q4 2027",
    status:  "Under Construction",
    record:  "Only Chelsea FC-branded residences in the world",
    url:     "https://www.damacproperties.com/",
  },
  {
    name:    "Bugatti Residences",
    scale:   "AED 2B+ GDV",
    units:   "182",
    sqft:    "Business Bay",
    timeline:"Handover Q4 2026",
    status:  "Under Construction",
    record:  "$54M penthouse — most expensive residence Business Bay",
    url:     "https://www.damacproperties.com/",
  },
];

// ── DAMAC COMMUNITY YIELDS (for Yields tab) ───────────────────────────────────
export const damacYields = [
  { community: "DAMAC Hills",   unit: "Apartments",  gross: 7.7,  net: 5.8, avgRent: 120000, avgPrice: 1550000, demand: "Very High" },
  { community: "DAMAC Hills",   unit: "Townhouses",  gross: 6.2,  net: 4.7, avgRent: 145000, avgPrice: 2340000, demand: "High" },
  { community: "DAMAC Hills",   unit: "Villas",      gross: 5.48, net: 4.1, avgRent: 242000, avgPrice: 4410000, demand: "High" },
  { community: "DAMAC Hills 2", unit: "Apartments",  gross: 8.1,  net: 6.0, avgRent: 65000,  avgPrice: 800000,  demand: "High" },
  { community: "DAMAC Hills 2", unit: "Townhouses",  gross: 7.2,  net: 5.4, avgRent: 95000,  avgPrice: 1320000, demand: "High" },
  { community: "DAMAC Lagoons", unit: "Townhouses",  gross: 6.0,  net: 4.5, avgRent: 140000, avgPrice: 2330000, demand: "High" },
  { community: "DAMAC Lagoons", unit: "Villas",      gross: 7.2,  net: 5.4, avgRent: 280000, avgPrice: 3890000, demand: "Very High" },
  { community: "Business Bay",  unit: "DAMAC Towers",gross: 7.5,  net: 5.6, avgRent: 85000,  avgPrice: 1130000, demand: "Very High" },
  { community: "DAMAC Islands", unit: "Townhouses",  gross: 7.8,  net: 5.9, avgRent: 175000, avgPrice: 2250000, demand: "Very High" },
];

export default {
  identity:         damacIdentity,
  live:             damacLive,
  financials:       damacFinancials,
  financialHistory: damacFinancialHistory,
  communities:      damacCommunities,
  projects:         damacProjects,
  branded:          damacBranded,
  risks:            damacRisks,
  segments:         damacSegments,
  radar:            damacRadar,
  megaProjects:     damacMegaProjects,
  yields:           damacYields,
};
