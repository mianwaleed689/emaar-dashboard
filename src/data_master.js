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
  "Grand Polo Club & Resort": "GPC",   // alias
  "Rashid Yachts & Marina":   "RYM",
  "Rashid Yachts & Marina":            "RYM",   // legacy alias — use canonical above
  "The Oasis":                "TO",
  "Business Bay":             "BB",
  "The Heights CW":           "TH",
  "Expo Living":              "EL",
  "Downtown Dubai":           "DT",
  "Downtown":                 "DT",    // alias — always resolve to Downtown Dubai
  "Dubai Marina":             "DM",
  "Arabian Ranches 3":        "AR3",
  "Mina Rashid":              "RYM",
  "Rashid Yachts & Marina":   "RYM",   // canonical alias
  "Expo City":                "EC",
  "Zabeel":                   "ZB",
  "Zabeel":                   "ZB",
  "Expo City":                "EL",    // Expo City = same as Expo Living district
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
  // Aldar new communities
  "Fahid Island":             "FI",
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
  { district:"RYM",  name:"Mina Rashid",               lat:25.2650, lng:55.2850, color:T.cyan,    developer:"emaar",    projects:22, type:"Marina Heritage" },
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
  { id:"RYM",  name:"Mina Rashid",               developer:"emaar",    avgPpsf:2800, avgYield:5.2, district:"RYM", projectCount:22, location:"Bur Dubai",     type:"Marina Heritage" },
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

