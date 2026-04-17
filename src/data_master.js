/**
 * DXB ANALYTICS — MASTER DATA FILE
 * src/data_master.js
 *
 * THE SINGLE SOURCE OF TRUTH for all developers, projects, and communities.
 *
 * What this file does:
 *   1. Imports all 7 developer data files
 *   2. Exports unified allProjects[], allDevelopers[], allCommunities[]
 *   3. Exports developer lookup helpers
 *   4. Exports extended communityCoords[] covering all 7 developers
 *   5. Exports the community→district bridge (commKeyMap)
 *
 * Usage in dashboard:
 *   import { allProjects, allDevelopers, allCommunities, getProjectsByDeveloper, getCommunityData } from "./data_master";
 *
 * Iron Rule: NEVER import directly from individual data_*.js files in components.
 *            Always import from data_master.js — this is the only door.
 *
 * Iron Rule: NEVER run npx vercel --prod — use git push only
 */

// ── Re-export T theme ────────────────────────────────────────────────────────
export { T } from "./theme";

// ── Government Portal Links ───────────────────────────────────────────────────
export const GOVT_PORTALS = {
  dldDubai:         "https://dubailand.gov.ae",
  oqoodRegistry:    "https://oqood.dubailand.gov.ae",
  reraServiceCharge:"https://dubailand.gov.ae/en/eservices/service-charge-index",
  dldTransactions:  "https://transactions.dubailand.gov.ae",
  adrecAbuDhabi:    "https://www.adrec.ae",
  dtcmHolidayHomes: "https://dtcm.gov.ae/en/services/holiday-homes",
  bayutNewProjects:  "https://www.bayut.com/new-projects/uae/",
  propertyFinder:   "https://www.propertyfinder.ae/en/new-projects",
};
import { T } from "./theme";

// ── Import Emaar developer identity + live stats ─────────────────────────────
export * from "./data_emaar_complete";

// ── Import Emaar project array ────────────────────────────────────────────────
import { emaarProjectsComplete }  from "./data_emaar_complete";

// ── Emaar community array is exported directly from data_emaar_complete ──────

// ── Emaar live stats imported via data_emaar_complete above ──────────────────

// Also keep backward compat for existing imports of emaarProjects
export { emaarProjectsComplete as emaarProjects } from "./data_emaar_complete";

// ── Keep all data.js exports for backward compatibility ───────────────────────
// (financials, communityROI, topDevelopers, emaarRisks, dubaiMarket etc)
export * from "./data";

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 1: DEVELOPER REGISTRY
// The definitive list of all 7 developers with live stats
// ─────────────────────────────────────────────────────────────────────────────

export const allDevelopers = [
  {
    id:           "emaar",
    officialUrl:  "https://properties.emaar.com/en/",
    name:         "Emaar Properties",
    tier:         "T1",
    color:        T.gold,
    type:         "Public (DFM)",
    listed:       true,
    ticker:       "EMAAR.AE",
    salesFY2025:  80.4,   // AED Billion
    rank:         1,
    projectCount: 208,
    communities:  ["Dubai Hills Estate","Dubai Creek Harbour","Emaar Beachfront","Emaar South","The Valley","Grand Polo Club & Resort","Rashid Yachts & Marina","The Oasis","Business Bay","The Heights CW","Expo Living","Downtown Dubai","Dubai Marina","Arabian Ranches 3"],
    primaryMarket:"Dubai",
    hasLiveData:  true,
    dataFile:     "data_emaar_complete",
  },
];
// ── Other developers will be added back in future sessions ───────────────────

// Quick lookup: developerId → developer object
export const developerById = Object.fromEntries(
  (allDevelopers || []).filter(d => d && d.id).map(d => [d.id, d])
);

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 2: UNIFIED PROJECT REGISTRY
// All 303 projects across all 7 developers in one array
// Each project guaranteed to have: id, developerId, name, community,
//   district, type, beds, status, handover, price, ppsf, payment,
//   construction, branded, brand, tier, source, confidence
// ─────────────────────────────────────────────────────────────────────────────

export const allProjects = [
  ...emaarProjectsComplete.map(p => ({ ...p, developerId: "emaar" })),
  // Other developers will be added back in future sessions
];

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 3: COMMUNITY → DISTRICT CODE BRIDGE
// Maps community full name → Firestore district key
// Used to connect projects → communityData/{district} → liveMarketData
// ─────────────────────────────────────────────────────────────────────────────

export const commKeyMap = {
  // Emaar
  "Dubai Hills Estate":       "DHE",
  "Dubai Creek Harbour":      "DCH",
  "Emaar Beachfront":         "EBF",
  "Emaar South":              "ES",
  "The Valley":               "TV",
  "Grand Polo Club & Resort":          "GPC",
  "Rashid Yachts & Marina":   "RYM",
  "The Oasis":                "TO",
  "Business Bay":             "BB",
  "The Heights CW":           "TH",
  "Expo Living":              "EL",
  "Downtown Dubai":           "DT",
  "Downtown":                 "DT",    // alias — always resolve to Downtown Dubai
  "Dubai Marina":             "DM",
  "Arabian Ranches 3":        "AR3",
  "Mina Rashid":              "MR",
  "Expo City":                "EC",
  "Zabeel":                   "ZB",
  // DAMAC
  "DAMAC Hills":              "DH",
  "DAMAC Hills 2":            "DH2",
  "DAMAC Lagoons":            "DLG",
  "DAMAC Islands":            "DI2",
  "DAMAC Islands 2":          "DI2",
  "DAMAC Riverside":          "DRP",
  "DAMAC Sun City" /* Limited verification — monitor official launch */:           "DSC",
  "Dubai Maritime City":      "DMC",
  "Dubai Harbour":            "DHR",
  // Sobha
  "Sobha Hartland":           "SH",
  "Sobha Hartland I":         "SH",    // alias
  "Sobha Hartland II":        "SH2",
  "Sobha Reserve":            "SR",
  "JLT":                      "JLT",
  "Jumeirah Lake Towers":     "JLT",   // alias
  // Nakheel
  "Palm Jumeirah":            "PJ",
  "Palm Jebel Ali":           "PJA",
  "Dubai Islands":            "DI",
  "JVC":                      "JVC",
  "Jumeirah Village Circle":  "JVC",   // alias
  "Al Furjan":                "AF",
  "Nad Al Sheba":             "NAS",
  // Meraas
  "City Walk":                "CW",
  "Bluewaters Island":        "BW",
  "Bluewaters":               "BW",    // alias
  "La Mer":                   "LM",
  "Port de La Mer":           "PLM",
  "Jumeira Bay":              "JB",
  "Jumeira Bay Island":       "JB",    // alias
  "Madinat Jumeirah Living":  "MJL",
  "The Acres":                "TA",
  "Cherrywoods":              "CHW",
  // Aldar
  "Yas Island":               "YI",
  "Saadiyat Island":          "SAI",
  "Reem Island":              "RI",
  "Al Maryah Island":         "AMI",
  "Fahid Island":             "FI",
  "Athlon":                   "ATH",
  // Binghatti
  "Silicon Oasis":            "SO",
  "Dubai Silicon Oasis":      "SO",    // alias
  "MBR City":                 "MBR",
  "Mohammed Bin Rashid City": "MBR",   // alias
  // Sobha new communities
  "Sobha Elwood":             "SE",
  "Sobha Siniya Island":      "SSI",
  "Siniya Island":            "SSI",   // alias
  // Meraas new communities
  "Dubai Design District":    "D3",
  "d3":                       "D3",    // alias
  "Design District":          "D3",    // alias
};

// Helper: get district code from community name (case-insensitive)
export function getDistrictCode(communityName = "") {
  return commKeyMap[communityName]
    || commKeyMap[communityName.trim()]
    || Object.entries(commKeyMap).find(
        ([k]) => k.toLowerCase() === communityName.toLowerCase()
       )?.[1]
    || null;
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 4: HELPER FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

// Get all projects for a specific developer
export function getProjectsByDeveloper(developerId) {
  return allProjects.filter(p => p.developerId === developerId);
}

// Get all projects in a specific community (canonical name)
export function getProjectsByCommunity(communityName) {
  const districtCode = getDistrictCode(communityName);
  return allProjects.filter(p =>
    p.community === communityName ||
    p.community === Object.keys(commKeyMap).find(k => commKeyMap[k] === districtCode) ||
    (districtCode && p.district === districtCode)
  );
}

// Validate project belongs to correct developer for its community
export function validateProjectMapping(project) {
  const distCode = getDistrictCode(project.community);
  const community = allCommunities.find(c => c.id === distCode);
  if (!community) return { valid: false, reason: "Community not found: " + project.community };
  if (community.developer === "shared") return { valid: true };
  if (community.developer !== project.developerId) {
    return { valid: false, reason: "Developer mismatch: project=" + project.developerId + " community=" + community.developer };
  }
  return { valid: true };
}

// Get developer object by id
export function getDeveloper(developerId) {
  return developerById[developerId] || null;
}

// Format project for Firestore write
// Ensures all required fields present before writing to projects/{id}
export function toFirestoreProject(project) {
  const dev = getDeveloper(project.developerId);
  return {
    id:             project.id,
    developerId:    project.developerId,
    developerName:  dev?.name || project.developerId,
    name:           project.name,
    community:      project.community,
    communityId:    project.communityId || getDistrictCode(project.community) || null,
    district:       project.district || getDistrictCode(project.community) || "—",
    emirate:        project.emirate || "Dubai",
    type:           project.type,
    beds:           project.beds,
    status:         project.status,
    availability:   project.availability || "Available",
    handover:       project.handover,
    handoverQ:      project.handoverQ || null,
    handoverYear:   project.handoverYear || null,
    price:          project.price || 0,
    sizeFrom:       project.sizeFrom || 0,
    sizeTo:         project.sizeTo || 0,
    ppsf:           project.ppsf || 0,
    payment:        project.payment || "—",
    construction:   project.construction || 0,
    branded:        project.branded || false,
    brand:          project.brand || "—",
    tier:           project.tier || "—",
    source:         project.source || "DXB Analytics",
    confidence:     project.confidence || "VERIFIED",
    unitBreakdown:  project.unitBreakdown || [],
    officialUrl:    project.officialUrl || project.emaarUrl || null,
    dldPermitNo:    project.dldPermitNo || null,
    escrowAccount:  project.escrowAccount || null,
    brochureUrl:    project.brochureUrl || null,
    floorPlanUrl:   project.floorPlanUrl || null,
    masterPlanUrl:  project.masterPlanUrl || null,
    amenities:      project.amenities || [],
    images:         project.images || [],
    tags:           project.tags || [],
    addedViaRadar:  false,
    fromFirestore:  false,
    seededAt:       new Date().toISOString(),
    updatedAt:      new Date().toISOString(),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 5: EXTENDED COMMUNITY COORDINATES
// All developers' communities with map pins
// Extends the Emaar-only communityCoords from data.js
// ─────────────────────────────────────────────────────────────────────────────

export const allCommunityCoords = [
  // ── EMAAR ──────────────────────────────────────────────────────────────────
  { district:"DHE",  name:"Dubai Hills Estate",       lat:25.1267, lng:55.2367, color:T.gold,    developer:"emaar",    projects:34, type:"Master Community" },
  { district:"DCH",  name:"Dubai Creek Harbour",      lat:25.2048, lng:55.3480, color:T.blue,    developer:"emaar",    projects:35, type:"Waterfront" },
  { district:"EBF",  name:"Emaar Beachfront",         lat:25.0785, lng:55.1330, color:T.gold,    developer:"emaar",    projects:11, type:"Beachfront Island" },
  { district:"ES",   name:"Emaar South",              lat:24.9650, lng:55.1520, color:T.purple,  developer:"emaar",    projects:24, type:"Golf & Airport" },
  { district:"EL",   name:"Expo Living",              lat:24.9700, lng:55.1380, color:T.teal,    developer:"emaar",    projects:2,  type:"Expo Legacy" },
  { district:"TV",   name:"The Valley",               lat:25.0250, lng:55.3150, color:T.orange,  developer:"emaar",    projects:30, type:"Suburban Villas" },
  { district:"GPC",  name:"Grand Polo Club & Resort", lat:24.9800, lng:55.1750, color:T.red,     developer:"emaar",    projects:12, type:"Polo Lifestyle" },
  { district:"RYM",  name:"Rashid Yachts & Marina",   lat:25.2650, lng:55.2850, color:T.cyan,    developer:"emaar",    projects:22, type:"Marina Heritage" },
  { district:"TO",   name:"The Oasis",                lat:25.0100, lng:55.1900, color:T.teal,    developer:"emaar",    projects:11, type:"Ultra-Luxury Villas" },
  { district:"BB",   name:"Business Bay",             lat:25.1850, lng:55.2650, color:T.orange,  developer:"shared",   projects:8,  type:"CBD" },
  { district:"TH",   name:"The Heights CW",           lat:25.0600, lng:55.2000, color:"#A78BFA", developer:"emaar",    projects:3,  type:"Wellness Community" },
  { district:"DT",   name:"Downtown Dubai",           lat:25.1972, lng:55.2744, color:T.gold,    developer:"emaar",    projects:5,  type:"Iconic CBD" },
  { district:"DM",   name:"Dubai Marina",             lat:25.0800, lng:55.1400, color:T.blue,    developer:"emaar",    projects:2,  type:"Waterfront" },
  { district:"AR3",  name:"Arabian Ranches 3",        lat:25.0550, lng:55.2700, color:T.green,   developer:"emaar",    projects:15, type:"Family Villas" },
  { district:"MR",   name:"Mina Rashid",               lat:25.2670, lng:55.2870, color:T.cyan,    developer:"emaar",    projects:22, type:"Marina Heritage" },
  { district:"EC",   name:"Expo City",                 lat:24.9700, lng:55.1380, color:T.teal,    developer:"emaar",    projects:2,  type:"Expo Legacy" },
  { district:"ZB",   name:"Zabeel",                    lat:25.2050, lng:55.2950, color:T.gold,    developer:"emaar",    projects:1,  type:"Urban Luxury" },
];

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 6: UNIFIED COMMUNITY LIST
// For the Communities tab and the developer switcher community filter
// ─────────────────────────────────────────────────────────────────────────────

export const allCommunities = [
  // ── EMAAR ──────────────────────────────────────────────────────────────────
  { id:"DHE",  name:"Dubai Hills Estate",       developer:"emaar",    avgPpsf:2400, avgYield:5.8, district:"DHE", projectCount:34, location:"New Dubai",     type:"Master Community" },
  { id:"DCH",  name:"Dubai Creek Harbour",      developer:"emaar",    avgPpsf:2500, avgYield:5.5, district:"DCH", projectCount:35, location:"Old Dubai",     type:"Waterfront" },
  { id:"EBF",  name:"Emaar Beachfront",         developer:"emaar",    avgPpsf:4250, avgYield:5.6, district:"EBF", projectCount:11, location:"Dubai Harbour", type:"Beachfront Island" },
  { id:"ES",   name:"Emaar South",              developer:"emaar",    avgPpsf:1400, avgYield:6.2, district:"ES",  projectCount:24, location:"Dubai South",   type:"Golf & Airport" },
  { id:"TV",   name:"The Valley",               developer:"emaar",    avgPpsf:1200, avgYield:6.0, district:"TV",  projectCount:30, location:"Dubailand",     type:"Suburban Villas" },
  { id:"GPC",  name:"Grand Polo Club & Resort", developer:"emaar",    avgPpsf:1770, avgYield:5.5, district:"GPC", projectCount:12, location:"DIP 2",         type:"Polo Lifestyle" },
  { id:"RYM",  name:"Rashid Yachts & Marina",   developer:"emaar",    avgPpsf:3000, avgYield:5.0, district:"RYM", projectCount:22, location:"Bur Dubai",     type:"Marina Heritage" },
  { id:"TO",   name:"The Oasis",                developer:"emaar",    avgPpsf:1921, avgYield:3.5, district:"TO",  projectCount:11, location:"Dubailand",     type:"Ultra-Luxury Villas" },
  { id:"BB",   name:"Business Bay",             developer:"shared",   avgPpsf:2200, avgYield:6.7, district:"BB",  projectCount:8,  location:"CBD",           type:"Mixed" },
  { id:"TH",   name:"The Heights CW",           developer:"emaar",    avgPpsf:1136, avgYield:5.5, district:"TH",  projectCount:3,  location:"DIP Corridor",  type:"Wellness" },
  { id:"EL",   name:"Expo Living",              developer:"emaar",    avgPpsf:900,  avgYield:6.0, district:"EL",  projectCount:2,  location:"Dubai South",   type:"Expo Legacy" },
  { id:"DT",   name:"Downtown Dubai",           developer:"emaar",    avgPpsf:3200, avgYield:5.0, district:"DT",  projectCount:5,  location:"Downtown",      type:"Iconic CBD" },
  { id:"DM",   name:"Dubai Marina",             developer:"emaar",    avgPpsf:2400, avgYield:6.0, district:"DM",  projectCount:2,  location:"Marina",        type:"Waterfront" },
  { id:"AR3",  name:"Arabian Ranches 3",        developer:"emaar",    avgPpsf:2000, avgYield:5.0, district:"AR3", projectCount:15, location:"Dubailand",     type:"Family Villas" },
  { id:"MR",   name:"Mina Rashid",               developer:"emaar",    avgPpsf:2800, avgYield:5.2, district:"MR",  projectCount:22, location:"Bur Dubai",     type:"Marina Heritage" },
  { id:"EC",   name:"Expo City",                 developer:"emaar",    avgPpsf:3000, avgYield:5.5, district:"EC",  projectCount:2,  location:"Dubai South",   type:"Expo Legacy" },
  { id:"ZB",   name:"Zabeel",                    developer:"emaar",    avgPpsf:3500, avgYield:5.0, district:"ZB",  projectCount:1,  location:"Downtown",      type:"Urban Luxury" },
  // ── Other developer communities reserved for future sessions ───────────────
];

// Quick lookup: district code → community object
export const communityByDistrict = Object.fromEntries(
  (allCommunities||[]).filter(c=>c&&c.id).map(c => [c.id, c])
);

// Quick lookup: community name → community object (handles aliases)
export function getCommunityData(communityName) {
  const distCode = getDistrictCode(communityName);
  if (distCode) return communityByDistrict[distCode] || null;
  return allCommunities.find(c => c.name === communityName) || null;
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 7: FIRESTORE SEEDER PAYLOAD
// Call this once from Admin Panel → Data Manager → Seed Projects
// Writes all 303 projects to Firestore projects/{id}
// After seeding, Admin Panel can CRUD any project from any developer
// ─────────────────────────────────────────────────────────────────────────────

export function getAllProjectsForFirestore() {
  return allProjects.map(toFirestoreProject);
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 8: PROJECT STATS SUMMARY
// Pre-computed counts for dashboard KPIs
// ─────────────────────────────────────────────────────────────────────────────

export const projectStats = {
  total:           allProjects.length,
  byDeveloper:     Object.fromEntries(
    (allDevelopers||[]).filter(d=>d&&d.id).map(d => [d.id, allProjects.filter(p => p.developerId === d.id).length])
  ),
  byCommunity:     Object.fromEntries(
    (allCommunities||[]).filter(c=>c&&c.id).map(c => [c.id, allProjects.filter(p => (getDistrictCode(p.community) || p.district) === c.id).length])
  ),
  byStatus: {
    delivered:         allProjects.filter(p => p.status === "Delivered").length,
    underConstruction: allProjects.filter(p => p.status === "Under Construction").length,
    offPlan:           allProjects.filter(p => p.status === "Off Plan" || p.status === "Off-Plan").length,
  },
  branded:           allProjects.filter(p => p.branded === true).length,
  ultraLuxury:       allProjects.filter(p => p.tier?.includes("Ultra")).length,
};


// ─────────────────────────────────────────────────────────────────────────────
// STUB EXPORTS — Placeholder exports for developer data not yet implemented
// These prevent import errors in EmaarDashboardV2.jsx
// ─────────────────────────────────────────────────────────────────────────────

// DAMAC
export const damacIdentity           = { id:"damac",      name:"DAMAC Properties",    color:"#E84393", tier:"T1" };
export const damacLive               = {};
export const damacProjects           = [];
export const damacCommunities        = [];
export const damacFinancials         = {};
export const damacFinancialHistory   = [];
export const damacYields             = [];
export const damacRisks              = [];
export const damacSegments           = [];
export const damacRadar              = [];
export const damacHealthScore        = null;
export const damacBadges             = [];
export const damacMegaProjects       = [];
export const damacAnnualData         = [];
export const damacKeyMetrics         = {};
export const damacSalesData          = [];
export const damacDeliveryData       = [];

// Sobha
export const sobhaIdentity           = { id:"sobha",      name:"Sobha Realty",         color:"#8B5CF6", tier:"T1" };
export const sobhaLive               = {};
export const sobhaProjects           = [];
export const sobhaCommunities        = [];
export const sobhaFinancials         = {};
export const sobhaFinancialHistory   = [];
export const sobhaYields             = [];
export const sobhaRisks              = [];
export const sobhaSegments           = [];
export const sobhaRadar              = [];
export const sobhaHealthScore        = null;
export const sobhaBadges             = [];
export const sobhaMegaProjects       = [];
export const sobhaAnnualData         = [];
export const sobhaKeyMetrics         = {};
export const sobhaSalesData          = [];
export const sobhaDeliveryData       = [];

// Nakheel
export const nakheelIdentity         = { id:"nakheel",    name:"Nakheel",              color:"#10B981", tier:"T1" };
export const nakheelLive             = {};
export const nakheelProjects         = [];
export const nakheelCommunities      = [];
export const nakheelFinancials       = {};
export const nakheelFinancialHistory = [];
export const nakheelYields           = [];
export const nakheelRisks            = [];
export const nakheelSegments         = [];
export const nakheelRadar            = [];
export const nakheelHealthScore      = null;
export const nakheelBadges           = [];
export const nakheelMegaProjects     = [];
export const nakheelAnnualData       = [];
export const nakheelKeyMetrics       = {};
export const nakheelSalesData        = [];
export const nakheelDeliveryData     = [];

// Meraas
export const meraasIdentity          = { id:"meraas",     name:"Meraas",               color:"#3B82F6", tier:"T1" };
export const meraasLive              = {};
export const meraasProjects          = [];
export const meraasCommunities       = [];
export const meraasFinancials        = {};
export const meraasFinancialHistory  = [];
export const meraasYields            = [];
export const meraasRisks             = [];
export const meraasSegments          = [];
export const meraasRadar             = [];
export const meraasHealthScore       = null;
export const meraasBadges            = [];
export const meraasMegaProjects      = [];
export const meraasAnnualData        = [];
export const meraasKeyMetrics        = {};
export const meraasSalesData         = [];
export const meraasDeliveryData      = [];

// Binghatti
export const binghattiIdentity           = { id:"binghatti",  name:"Binghatti",            color:"#F59E0B", tier:"T2" };
export const binghattiLive               = {};
export const binghattiProjects           = [];
export const binghattiCommunities        = [];
export const binghattiFinancials         = {};
export const binghattiFinancialHistory   = [];
export const binghattiYields             = [];
export const binghattiRisks             = [];
export const binghattiSegments           = [];
export const binghattiRadar              = [];
export const binghattiHealthScore        = null;
export const binghattiBadges             = [];
export const binghattiMegaProjects       = [];
export const binghattiAnnualData         = [];
export const binghattiKeyMetrics         = {};
export const binghattiSalesData          = [];
export const binghattiDeliveryData       = [];

// Aldar
export const aldarIdentity           = { id:"aldar",      name:"Aldar Properties",     color:"#06B6D4", tier:"T1" };
export const aldarLive               = {};
export const aldarProjects           = [];
export const aldarCommunities        = [];
export const aldarFinancials         = {};
export const aldarFinancialHistory   = [];
export const aldarYields             = [];
export const aldarRisks              = [];
export const aldarSegments           = [];
export const aldarRadar              = [];
export const aldarHealthScore        = null;
export const aldarBadges             = [];
export const aldarMegaProjects       = [];
export const aldarAnnualData         = [];
export const aldarKeyMetrics         = {};
export const aldarSalesData          = [];
export const aldarDeliveryData       = [];

// Azizi
export const aziziIdentity           = { id:"azizi",      name:"Azizi Developments",   color:"#EF4444", tier:"T2" };
export const aziziLive               = {};
export const aziziProjects           = [];
export const aziziCommunities        = [];
export const aziziFinancials         = {};
export const aziziFinancialHistory   = [];
export const aziziYields             = [];
export const aziziRisks              = [];
export const aziziSegments           = [];
export const aziziRadar              = [];
export const aziziHealthScore        = null;
export const aziziBadges             = [];
export const aziziMegaProjects       = [];
export const aziziAnnualData         = [];
export const aziziKeyMetrics         = {};
export const aziziSalesData          = [];
export const aziziDeliveryData       = [];

// Danube
export const danubeIdentity          = { id:"danube",     name:"Danube Properties",    color:"#F97316", tier:"T2" };
export const danubeLive              = {};
export const danubeProjects          = [];
export const danubeCommunities       = [];
export const danubeFinancials        = {};
export const danubeFinancialHistory  = [];
export const danubeYields            = [];
export const danubeRisks             = [];
export const danubeSegments          = [];
export const danubeRadar             = [];
export const danubeHealthScore       = null;
export const danubeBadges            = [];
export const danubeMegaProjects      = [];
export const danubeAnnualData        = [];
export const danubeKeyMetrics        = {};
export const danubeSalesData         = [];
export const danubeDeliveryData      = [];

// Ellington
export const ellingtonIdentity           = { id:"ellington",  name:"Ellington Properties", color:"#A78BFA", tier:"T2" };
export const ellingtonLive               = {};
export const ellingtonProjects           = [];
export const ellingtonCommunities        = [];
export const ellingtonFinancials         = {};
export const ellingtonFinancialHistory   = [];
export const ellingtonYields             = [];
export const ellingtonRisks              = [];
export const ellingtonSegments           = [];
export const ellingtonRadar              = [];
export const ellingtonHealthScore        = null;
export const ellingtonBadges             = [];
export const ellingtonMegaProjects       = [];
export const ellingtonAnnualData         = [];
export const ellingtonKeyMetrics         = {};
export const ellingtonSalesData          = [];
export const ellingtonDeliveryData       = [];
