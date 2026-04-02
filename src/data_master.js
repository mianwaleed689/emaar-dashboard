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

// ── Import all developer identity + live stats ───────────────────────────────
export * from "./data_emaar_complete";
export * from "./data_damac";
export * from "./data_sobha";
export * from "./data_nakheel";
export * from "./data_meraas";
// Aliases for meraas typo fix (data_meraas.js uses 'meeraas' with double-e)
export { meeraasB as meraasB, meeraasC as meraasC, meeraasM as meraasM } from "./data_meraas";
export * from "./data_aldar";
export * from "./data_binghatti";

// ── Import project arrays ─────────────────────────────────────────────────────
import { emaarProjectsComplete }  from "./data_emaar_complete";
import { damacProjects }          from "./data_damac";
import { sobhaProjects }          from "./data_sobha";
import { nakheelProjects }        from "./data_nakheel";
import { meraasProjects }         from "./data_meraas";
import { aldarProjects }          from "./data_aldar";
import { binghattiProjects }      from "./data_binghatti";
// New developers — Session 1: verified from official sites + DLD Q1 2026
import { aziziProjects, aziziIdentity }         from "./data_azizi";
import { danubeProjects, danubeIdentity }       from "./data_danube";
import { samanaProjects, samanaIdentity }       from "./data_samana";
// Session 2: Beyond, Imtiaz, Ellington, Iman, Reportage, Wadan, Wasl, Mag, Vincitore, Nshama
import { beyondProjects, beyondIdentity }       from "./data_beyond";
import { imtiazProjects, imtiazIdentity }       from "./data_imtiaz";
import { ellingtonProjects, ellingtonIdentity } from "./data_ellington";
import { imanProjects, imanIdentity }           from "./data_iman";
import { reportageProjects, reportageIdentity } from "./data_reportage";
import { wadanProjects, wadanIdentity }         from "./data_wadan";
import { waslProjects, waslIdentity }           from "./data_wasl";
import { magProjects, magIdentity }             from "./data_mag";
import { vincitoreProjects, vincitoreIdentity } from "./data_vincitore";
import { nshamaProjects, nshamaIdentity }       from "./data_nshama";
import { omniyatProjects, omniyatIdentity }     from "./data_omniyat";
import { pantheonProjects, pantheonIdentity }   from "./data_pantheon";
import { selectProjects, selectIdentity }       from "./data_select";
export {
  aziziProjects, aziziIdentity, danubeProjects, danubeIdentity, samanaProjects, samanaIdentity,
  beyondProjects, beyondIdentity, imtiazProjects, imtiazIdentity, ellingtonProjects, ellingtonIdentity,
  imanProjects, imanIdentity, reportageProjects, reportageIdentity, wadanProjects, wadanIdentity,
  waslProjects, waslIdentity, magProjects, magIdentity, vincitoreProjects, vincitoreIdentity,
  nshamaProjects, nshamaIdentity,
  omniyatProjects, omniyatIdentity, pantheonProjects, pantheonIdentity, selectProjects, selectIdentity,
};

// ── Import community arrays ───────────────────────────────────────────────────
import { damacCommunities }       from "./data_damac";
import { sobhaCommunities }       from "./data_sobha";
import { nakheelCommunities }     from "./data_nakheel";
import { aldarCommunities }       from "./data_aldar";
import { binghattiCommunities }   from "./data_binghatti";

// ── Import developer live stats ───────────────────────────────────────────────
import {
}                                 from "./data_emaar_complete";
import { damacIdentity,    damacLive }    from "./data_damac";
import { sobhaIdentity,    sobhaLive }    from "./data_sobha";
import { nakheelIdentity,  nakheelLive }  from "./data_nakheel";
import { meraasIdentity,   meraasLive }   from "./data_meraas";
import { aldarIdentity,    aldarLive }    from "./data_aldar";
import { binghattiIdentity,binghattiLive} from "./data_binghatti";

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
  {
    id:           "damac",
    officialUrl:  "https://www.damacproperties.com",
    name:         "DAMAC Properties",
    tier:         "T1",
    color:        "#C8A951",
    type:         "Private",
    listed:       false,
    ticker:       null,
    salesFY2025:  36.0,
    rank:         4,
    projectCount: 23,
    communities:  ["DAMAC Hills","DAMAC Hills 2","DAMAC Lagoons","DAMAC Islands","DAMAC Riverside","DAMAC Sun City" /* Limited verification — monitor official launch */,"Business Bay","Dubai Harbour","Dubai Maritime City"],
    primaryMarket:"Dubai",
    hasLiveData:  true,
    dataFile:     "data_damac",
  },
  {
    id:           "sobha",
    officialUrl:  "https://sobharealty.com",
    name:         "Sobha Realty",
    tier:         "T1",
    color:        T.purple,
    type:         "Private",
    listed:       false,
    ticker:       null,
    salesFY2025:  30.0,
    rank:         5,
    projectCount: 18,
    communities:  ["Sobha Hartland","Sobha Hartland II","Dubai Harbour","JLT","Sobha Reserve"],
    primaryMarket:"Dubai + UAQ",
    hasLiveData:  true,
    dataFile:     "data_sobha",
  },
  {
    id:           "nakheel",
    officialUrl:  "https://www.nakheel.com",
    name:         "Nakheel",
    tier:         "T1",
    color:        T.green,
    type:         "Government (Dubai Holding)",
    listed:       false,
    ticker:       null,
    salesFY2025:  24.6,
    rank:         6,
    projectCount: 12,
    communities:  ["Palm Jumeirah","Palm Jebel Ali","Dubai Islands","JVC","Al Furjan","Nad Al Sheba"],
    primaryMarket:"Dubai",
    hasLiveData:  true,
    dataFile:     "data_nakheel",
  },
  {
    id:           "meraas",
    officialUrl:  "https://www.meraas.com",
    name:         "Meraas",
    tier:         "T1",
    color:        T.orange,
    type:         "Government (Dubai Holding)",
    listed:       false,
    ticker:       null,
    salesFY2025:  20.9,
    rank:         7,
    projectCount: 11,
    communities:  ["City Walk","Bluewaters Island","La Mer","Port de La Mer","Jumeira Bay","Madinat Jumeirah Living","The Acres","Cherrywoods","Dubai Harbour"],
    primaryMarket:"Dubai",
    hasLiveData:  true,
    dataFile:     "data_meraas",
  },
  {
    id:           "aldar",
    officialUrl:  "https://www.aldar.com",
    name:         "Aldar Properties",
    tier:         "T1",
    color:        "#06B6D4",
    type:         "Public (ADX)",
    listed:       true,
    ticker:       "ALDAR.AE",
    salesFY2025:  40.6,
    rank:         2,   // #2 UAE by sales value FY2025 — AED 40.6B confirmed
    projectCount: 10,
    communities:  ["Yas Island","Saadiyat Island","Reem Island","Al Maryah Island","Fahid Island","Athlon"],
    primaryMarket:"Abu Dhabi + Dubai",
    hasLiveData:  true,
    dataFile:     "data_aldar",
  },
  {
    id:           "binghatti",
    officialUrl:  "https://binghatti.com",
    name:         "Binghatti",
    tier:         "T2",
    color:        T.blue,
    type:         "Private",
    listed:       false,
    ticker:       null,
    sukukListed:  "Nasdaq Dubai + LSE (bonds only)",
    salesFY2025:  26.0,
    rank:         3,   // #3 Dubai by sales value est. AED 26B, #1 by unit count
    projectCount: 10,
    communities:  ["Business Bay","Downtown Dubai","JVC","Silicon Oasis","Palm Jumeirah","MBR City"],
    primaryMarket:"Dubai",
    hasLiveData:  true,
    dataFile:     "data_binghatti",
  },
  // ── New developers added April 2026 ──────────────────────────────────────
  { id:"azizi",     officialUrl:"https://www.azizidevelopments.com", name:"Azizi Developments",  tier:"T2", color:"#16A085", type:"Private",  listed:false, ticker:null, salesFY2025:8.5,  rank:8,  projectCount:30, communities:["Dubai South","Meydan One","Palm Jumeirah","Al Furjan","Dubai Studio City","Al Jaddaf","Sheikh Zayed Road","Dubai Islands","Jebel Ali Free Zone"], primaryMarket:"Dubai", hasLiveData:false, dataFile:"data_azizi"    },
  { id:"danube",    officialUrl:"https://danubeproperties.com",      name:"Danube Properties",   tier:"T2", color:"#E74C3C", type:"Private",  listed:false, ticker:null, salesFY2025:7.2,  rank:9,  projectCount:29, communities:["JVC","Business Bay","JLT","Al Furjan","Dubai Sports City","Dubai Silicon Oasis","Dubai Maritime City","Al Sufouh","International City"], primaryMarket:"Dubai", hasLiveData:false, dataFile:"data_danube"   },
  { id:"samana",    officialUrl:"https://www.samanadevelopers.com",  name:"Samana Developers",   tier:"T2", color:"#2980B9", type:"Private",  listed:false, ticker:null, salesFY2025:4.8,  rank:10, projectCount:25, communities:["JVC","Arjan","Majan","Dubai Studio City","Dubai Production City","Discovery Gardens","MBR City","Dubai Islands","Al Furjan"], primaryMarket:"Dubai", hasLiveData:false, dataFile:"data_samana"   },
  { id:"beyond",    officialUrl:"https://beyonddevelopments.ae",     name:"Beyond Developments", tier:"T1", color:"#1ABC9C", type:"Private",  listed:false, ticker:null, salesFY2025:6.2,  rank:11, projectCount:8,  communities:["Dubai Maritime City","Palm Jumeirah","Dubai Islands"],                        primaryMarket:"Dubai", hasLiveData:false, dataFile:"data_beyond"   },
  { id:"imtiaz",    officialUrl:"https://imtiaz.ae",                 name:"Imtiaz Developments", tier:"T2", color:"#8E44AD", type:"Private",  listed:false, ticker:null, salesFY2025:3.1,  rank:12, projectCount:21, communities:["Dubai Islands","JVC","Dubai Land","Al Furjan","Jumeirah Garden City"],          primaryMarket:"Dubai", hasLiveData:false, dataFile:"data_imtiaz"   },
  { id:"ellington", officialUrl:"https://ellingtonproperties.ae",    name:"Ellington Properties",tier:"T1", color:"#2C3E50", type:"Private",  listed:false, ticker:null, salesFY2025:5.4,  rank:13, projectCount:17, communities:["Dubai Islands","Palm Jumeirah","MBR City","JVC","JLT","Business Bay","Al Jaddaf","Sobha Hartland","Dubai Hills Estate"], primaryMarket:"Dubai", hasLiveData:false, dataFile:"data_ellington"},
  { id:"iman",      officialUrl:"https://www.imandevelopers.com",    name:"Iman Developers",     tier:"T2", color:"#D35400", type:"Private",  listed:false, ticker:null, salesFY2025:1.8,  rank:14, projectCount:2,  communities:["Motor City","MBR City"],                                                       primaryMarket:"Dubai", hasLiveData:false, dataFile:"data_iman"      },
  { id:"reportage", officialUrl:"https://reportageuae.com",          name:"Reportage Properties",tier:"T2", color:"#27AE60", type:"Private",  listed:false, ticker:null, salesFY2025:2.1,  rank:15, projectCount:8,  communities:["Dubailand","Dubai Investment Park","Downtown Jebel Ali"],                       primaryMarket:"Dubai", hasLiveData:false, dataFile:"data_reportage" },
  { id:"wadan",     officialUrl:"https://www.wadan.ae",       name:"Wadan Developments",  tier:"T3", color:"#7F8C8D", type:"Private",  listed:false, ticker:null, salesFY2025:0.8,  rank:16, projectCount:2,  communities:["Dubai Land Residence Complex"],                                                primaryMarket:"Dubai", hasLiveData:false, dataFile:"data_wadan"    },
  { id:"wasl",      officialUrl:"https://www.wasl.ae",               name:"Wasl Properties",     tier:"T2", color:"#16A085", type:"Government",listed:false, ticker:null, salesFY2025:2.8,  rank:17, projectCount:3,  communities:["Sheikh Zayed Road","Business Bay","Jebel Ali Village"],                        primaryMarket:"Dubai", hasLiveData:false, dataFile:"data_wasl"     },
  { id:"mag",       officialUrl:"https://mag.global",                name:"MAG Group",           tier:"T2", color:"#C0392B", type:"Private",  listed:false, ticker:null, salesFY2025:3.4,  rank:18, projectCount:5,  communities:["MBR City","Business Bay","Al Furjan","JLT","Dubai South"],                     primaryMarket:"Dubai", hasLiveData:false, dataFile:"data_mag"      },
  { id:"vincitore", officialUrl:"https://vincitore.ae",              name:"Vincitore",           tier:"T3", color:"#9B59B6", type:"Private",  listed:false, ticker:null, salesFY2025:1.2,  rank:19, projectCount:8,  communities:["Arjan","Dubai Sports City","Dubai Science Park"],                              primaryMarket:"Dubai", hasLiveData:false, dataFile:"data_vincitore"},
  { id:"nshama",    officialUrl:"https://nshama.ae",                 name:"Nshama",              tier:"T2", color:"#E67E22", type:"Private",  listed:false, ticker:null, salesFY2025:2.2,  rank:20, projectCount:4,  communities:["Town Square"],                                                                 primaryMarket:"Dubai", hasLiveData:false, dataFile:"data_nshama"   },,
  { id:"omniyat",   officialUrl:"https://www.omniyat.com",              name:"Omniyat",             tier:"T1", color:"#B8860B", type:"Private",   listed:false, ticker:null, salesFY2025:12.0, rank:21, projectCount:11, communities:["Palm Jumeirah","Business Bay"], primaryMarket:"Dubai", hasLiveData:false, dataFile:"data_omniyat"  },
  { id:"pantheon",  officialUrl:"https://pantheondevelopment.ae",       name:"Pantheon Development",tier:"T3", color:"#E67E22", type:"Private",   listed:false, ticker:null, salesFY2025:0.6,  rank:22, projectCount:6,  communities:["JVC","Ras Al Khaimah"], primaryMarket:"Dubai+RAK", hasLiveData:false, dataFile:"data_pantheon" },
  { id:"select",    officialUrl:"https://www.select-group.ae",          name:"Select Group",        tier:"T2", color:"#1A5276", type:"Private",   listed:false, ticker:null, salesFY2025:1.5,  rank:23, projectCount:6,  communities:["Business Bay","Dubai Marina"], primaryMarket:"Dubai", hasLiveData:false, dataFile:"data_select"   },
];

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
  ...emaarProjectsComplete.map(p => ({ ...p, developerId: p.developerId || "emaar" })),
  ...damacProjects.map(p => ({ ...p, developerId: p.developerId || "damac" })),
  ...sobhaProjects.map(p => ({ ...p, developerId: p.developerId || "sobha" })),
  ...nakheelProjects.map(p => ({ ...p, developerId: p.developerId || "nakheel" })),
  ...meraasProjects.map(p => ({ ...p, developerId: p.developerId || "meraas" })),
  ...aldarProjects.map(p => ({ ...p, developerId: p.developerId || "aldar" })),
  ...binghattiProjects.map(p => ({ ...p, developerId: p.developerId || "binghatti" })),
  // Session 1 developers
  ...aziziProjects.map(p => ({ ...p, developerId: "azizi" })),
  ...danubeProjects.map(p => ({ ...p, developerId: "danube" })),
  ...samanaProjects.map(p => ({ ...p, developerId: "samana" })),
  // Session 2 developers
  ...beyondProjects.map(p => ({ ...p, developerId: "beyond" })),
  ...imtiazProjects.map(p => ({ ...p, developerId: "imtiaz" })),
  ...ellingtonProjects.map(p => ({ ...p, developerId: "ellington" })),
  ...imanProjects.map(p => ({ ...p, developerId: "iman" })),
  ...reportageProjects.map(p => ({ ...p, developerId: "reportage" })),
  ...wadanProjects.map(p => ({ ...p, developerId: "wadan" })),
  ...waslProjects.map(p => ({ ...p, developerId: "wasl" })),
  ...magProjects.map(p => ({ ...p, developerId: "mag" })),
  ...vincitoreProjects.map(p => ({ ...p, developerId: "vincitore" })),
  ...nshamaProjects.map(p => ({ ...p, developerId: "nshama" })),
  ...omniyatProjects.map(p => ({ ...p, developerId: "omniyat" })),
  ...pantheonProjects.map(p => ({ ...p, developerId: "pantheon" })),
  ...selectProjects.map(p => ({ ...p, developerId: "select" })),
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
  { district:"GPC",  name:"Grand Polo Club & Resort",          lat:24.9800, lng:55.1750, color:T.red,     developer:"emaar",    projects:12, type:"Polo Lifestyle" },
  { district:"RYM",  name:"Rashid Yachts & Marina",   lat:25.2650, lng:55.2850, color:T.cyan,    developer:"emaar",    projects:22, type:"Marina Heritage" },
  { district:"TO",   name:"The Oasis",                lat:25.0100, lng:55.1900, color:T.teal,    developer:"emaar",    projects:11, type:"Ultra-Luxury Villas" },
  { district:"BB",   name:"Business Bay",             lat:25.1850, lng:55.2650, color:T.orange,  developer:"shared",   projects:8,  type:"CBD" },
  { district:"TH",   name:"The Heights CW",           lat:25.0600, lng:55.2000, color:"#A78BFA", developer:"emaar",    projects:3,  type:"Wellness Community" },
  { district:"DT",   name:"Downtown Dubai",           lat:25.1972, lng:55.2744, color:T.gold,    developer:"emaar",    projects:5,  type:"Iconic CBD" },
  { district:"DM",   name:"Dubai Marina",             lat:25.0800, lng:55.1400, color:T.blue,    developer:"emaar",    projects:2,  type:"Waterfront" },
  { district:"AR3",  name:"Arabian Ranches 3",        lat:25.0550, lng:55.2700, color:T.green,   developer:"emaar",    projects:15, type:"Family Villas" },
  // ── DAMAC ──────────────────────────────────────────────────────────────────
  { district:"DH",   name:"DAMAC Hills",              lat:25.0260, lng:55.2320, color:"#C8A951", developer:"damac",    projects:5,  type:"Golf Community" },
  { district:"DH2",  name:"DAMAC Hills 2",            lat:24.9900, lng:55.3600, color:"#C8A951", developer:"damac",    projects:4,  type:"Family Community" },
  { district:"DLG",  name:"DAMAC Lagoons",            lat:25.0200, lng:55.2700, color:"#C8A951", developer:"damac",    projects:4,  type:"Lagoon Community" },
  { district:"DI2",  name:"DAMAC Islands",            lat:25.0380, lng:55.3200, color:"#C8A951", developer:"damac",    projects:2,  type:"Island Living" },
  { district:"DSC",  name:"DAMAC Sun City" /* Limited verification — monitor official launch */,         lat:25.0250, lng:55.3100, color:"#C8A951", developer:"damac",    projects:1,  type:"Wellness Townhouses" },
  { district:"DRP",  name:"DAMAC Riverside",          lat:25.0050, lng:55.2150, color:"#C8A951", developer:"damac",    projects:2,  type:"Riverside" },
  { district:"DMC",  name:"Dubai Maritime City",      lat:25.2350, lng:55.2650, color:"#C8A951", developer:"damac",    projects:2,  type:"Maritime" },
  { district:"DHR",  name:"Dubai Harbour",            lat:25.0990, lng:55.1340, color:"#C8A951", developer:"shared",   projects:5,  type:"Marina Hub" },
  // ── SOBHA ──────────────────────────────────────────────────────────────────
  { district:"SH",   name:"Sobha Hartland",           lat:25.2000, lng:55.3420, color:T.purple,  developer:"sobha",    projects:5,  type:"Urban Luxury" },
  { district:"SH2",  name:"Sobha Hartland II",        lat:25.1950, lng:55.3500, color:T.purple,  developer:"sobha",    projects:4,  type:"New Phase" },
  { district:"SR",   name:"Sobha Reserve",            lat:25.0750, lng:55.3900, color:T.purple,  developer:"sobha",    projects:2,  type:"Ultra Luxury Villas" },
  { district:"JLT",  name:"JLT",                      lat:25.0720, lng:55.1400, color:T.purple,  developer:"sobha",    projects:1,  type:"Urban Towers" },
  // ── NAKHEEL ────────────────────────────────────────────────────────────────
  { district:"PJ",   name:"Palm Jumeirah",            lat:25.1124, lng:55.1390, color:T.green,   developer:"nakheel",  projects:4,  type:"Iconic Island" },
  { district:"PJA",  name:"Palm Jebel Ali",           lat:25.0100, lng:55.0200, color:T.green,   developer:"nakheel",  projects:3,  type:"New Mega Island" },
  { district:"DI",   name:"Dubai Islands",            lat:25.3200, lng:55.3800, color:T.green,   developer:"nakheel",  projects:3,  type:"Waterfront City" },
  { district:"JVC",  name:"Jumeirah Village Circle",  lat:25.0580, lng:55.2100, color:T.green,   developer:"shared",   projects:10, type:"Affordable Community" },
  { district:"AF",   name:"Al Furjan",                lat:25.0190, lng:55.1340, color:T.green,   developer:"nakheel",  projects:2,  type:"Family Community" },
  { district:"NAS",  name:"Nad Al Sheba",             lat:25.1700, lng:55.3700, color:T.green,   developer:"nakheel",  projects:2,  type:"Luxury Villas" },
  // ── MERAAS ─────────────────────────────────────────────────────────────────
  { district:"CW",   name:"City Walk",                lat:25.2000, lng:55.2450, color:T.orange,  developer:"meraas",   projects:3,  type:"Urban Lifestyle" },
  { district:"BW",   name:"Bluewaters Island",        lat:25.0830, lng:55.1220, color:T.orange,  developer:"meraas",   projects:2,  type:"Island Destination" },
  { district:"LM",   name:"La Mer",                   lat:25.2200, lng:55.2750, color:T.orange,  developer:"meraas",   projects:2,  type:"Beachfront" },
  { district:"PLM",  name:"Port de La Mer",           lat:25.2180, lng:55.2700, color:T.orange,  developer:"meraas",   projects:2,  type:"Mediterranean Marina" },
  { district:"JB",   name:"Jumeira Bay Island",       lat:25.2300, lng:55.2500, color:T.orange,  developer:"meraas",   projects:1,  type:"Ultra-Luxury Island" },
  { district:"MJL",  name:"Madinat Jumeirah Living",  lat:25.1530, lng:55.1850, color:T.orange,  developer:"meraas",   projects:2,  type:"Family Luxury" },
  { district:"TA",   name:"The Acres",                lat:25.0400, lng:55.3000, color:T.orange,  developer:"meraas",   projects:2,  type:"Eco Villas" },
  { district:"CHW",  name:"Cherrywoods",              lat:25.0150, lng:55.2600, color:T.orange,  developer:"meraas",   projects:1,  type:"Townhouses" },
  // ── ALDAR ──────────────────────────────────────────────────────────────────
  { district:"YI",   name:"Yas Island",               lat:24.4860, lng:54.6070, color:"#06B6D4", developer:"aldar",    projects:4,  type:"Entertainment + Residential" },
  { district:"SAI",  name:"Saadiyat Island",          lat:24.5380, lng:54.4340, color:"#06B6D4", developer:"aldar",    projects:3,  type:"Cultural Ultra-Luxury" },
  { district:"RI",   name:"Reem Island",              lat:24.5050, lng:54.3980, color:"#06B6D4", developer:"aldar",    projects:2,  type:"Urban Residential" },
  { district:"AMI",  name:"Al Maryah Island",         lat:24.5000, lng:54.3870, color:"#06B6D4", developer:"aldar",    projects:1,  type:"Financial District" },
  { district:"ATH",  name:"Athlon",                   lat:25.0900, lng:55.3800, color:"#06B6D4", developer:"aldar",    projects:2,  type:"Active Lifestyle" },
  // ── BINGHATTI ──────────────────────────────────────────────────────────────
  { district:"SO",   name:"Silicon Oasis",            lat:25.1180, lng:55.3780, color:T.blue,    developer:"binghatti", projects:2, type:"Tech Community" },
  { district:"MBR",  name:"MBR City",                 lat:25.1900, lng:55.3200, color:T.blue,    developer:"binghatti", projects:2, type:"Mixed-Use" },
  // ── NEW COMMUNITIES ────────────────────────────────────────────────────────
  { district:"SE",   name:"Sobha Elwood",             lat:25.0620, lng:55.3800, color:T.purple,  developer:"sobha",     projects:2, type:"Luxury Villa Community" },
  { district:"SSI",  name:"Sobha Siniya Island",      lat:25.5697, lng:55.5672, color:T.purple,  developer:"sobha",     projects:3, type:"Island Beachfront (UAQ)" },
  { district:"FI",   name:"Fahid Island",             lat:24.4200, lng:54.4000, color:"#06B6D4", developer:"aldar",     projects:2, type:"Coastal Wellness Island" },
  { district:"D3",   name:"Dubai Design District",    lat:25.1862, lng:55.2530, color:T.orange,  developer:"meraas",    projects:2, type:"Creative Hub Residential" },
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
  { id:"GPC",  name:"Grand Polo Club & Resort",          developer:"emaar",    avgPpsf:1770, avgYield:5.5, district:"GPC", projectCount:12, location:"DIP 2",         type:"Polo Lifestyle" },
  { id:"RYM",  name:"Rashid Yachts & Marina",   developer:"emaar",    avgPpsf:3000, avgYield:5.0, district:"RYM", projectCount:22, location:"Bur Dubai",     type:"Marina Heritage" },
  { id:"TO",   name:"The Oasis",                developer:"emaar",    avgPpsf:1921, avgYield:3.5, district:"TO",  projectCount:11, location:"Dubailand",     type:"Ultra-Luxury Villas" },
  { id:"BB",   name:"Business Bay",             developer:"shared",   avgPpsf:2200, avgYield:6.7, district:"BB",  projectCount:8,  location:"CBD",           type:"Mixed" },
  { id:"TH",   name:"The Heights CW",           developer:"emaar",    avgPpsf:1136, avgYield:5.5, district:"TH",  projectCount:3,  location:"DIP Corridor",  type:"Wellness" },
  { id:"EL",   name:"Expo Living",              developer:"emaar",    avgPpsf:900,  avgYield:6.0, district:"EL",  projectCount:2,  location:"Dubai South",   type:"Expo Legacy" },
  { id:"DT",   name:"Downtown Dubai",           developer:"emaar",    avgPpsf:3200, avgYield:5.0, district:"DT",  projectCount:5,  location:"Downtown",      type:"Iconic CBD" },
  { id:"DM",   name:"Dubai Marina",             developer:"emaar",    avgPpsf:2400, avgYield:6.0, district:"DM",  projectCount:2,  location:"Marina",        type:"Waterfront" },
  { id:"AR3",  name:"Arabian Ranches 3",        developer:"emaar",    avgPpsf:2000, avgYield:5.0, district:"AR3", projectCount:15, location:"Dubailand",     type:"Family Villas" },
  // ── DAMAC ──────────────────────────────────────────────────────────────────
  { id:"DH",   name:"DAMAC Hills",              developer:"damac",    avgPpsf:1600, avgYield:5.8, district:"DH",  projectCount:5,  location:"Dubailand",     type:"Golf Community" },
  { id:"DH2",  name:"DAMAC Hills 2",            developer:"damac",    avgPpsf:1000, avgYield:6.5, district:"DH2", projectCount:4,  location:"Dubailand",     type:"Family Community" },
  { id:"DLG",  name:"DAMAC Lagoons",            developer:"damac",    avgPpsf:1200, avgYield:5.5, district:"DLG", projectCount:4,  location:"Dubailand",     type:"Lagoon Villas" },
  { id:"DI2",  name:"DAMAC Islands",            developer:"damac",    avgPpsf:803,  avgYield:5.0, district:"DI2", projectCount:2,  location:"Dubailand",     type:"Island Villas" },
  { id:"DSC",  name:"DAMAC Sun City" /* Limited verification — monitor official launch */,        developer:"damac",    avgPpsf:1100, avgYield:5.5, district:"DSC", projectCount:1,  location:"Dubailand",     type:"Wellness Townhouses" },
  { id:"DHR",  name:"Dubai Harbour",            developer:"shared",   avgPpsf:3500, avgYield:6.0, district:"DHR", projectCount:5,  location:"JBR Area",      type:"Marina Hub" },
  { id:"DMC",  name:"Dubai Maritime City",      developer:"damac",    avgPpsf:2200, avgYield:5.5, district:"DMC", projectCount:2,  location:"Bur Dubai",     type:"Maritime" },
  // ── SOBHA ──────────────────────────────────────────────────────────────────
  { id:"SH",   name:"Sobha Hartland",           developer:"sobha",    avgPpsf:2800, avgYield:6.8, district:"SH",  projectCount:5,  location:"MBR City",      type:"Urban Luxury" },
  { id:"SH2",  name:"Sobha Hartland II",        developer:"sobha",    avgPpsf:2000, avgYield:6.0, district:"SH2", projectCount:4,  location:"MBR City",      type:"New Phase" },
  { id:"SR",   name:"Sobha Reserve",            developer:"sobha",    avgPpsf:1250, avgYield:5.5, district:"SR",  projectCount:2,  location:"Dubailand",     type:"Ultra Luxury" },
  { id:"JLT",  name:"JLT",                      developer:"sobha",    avgPpsf:1300, avgYield:7.5, district:"JLT", projectCount:1,  location:"New Dubai",     type:"Urban Towers" },
  { id:"SE",   name:"Sobha Elwood",             developer:"sobha",    avgPpsf:1850, avgYield:5.2, district:"SE",  projectCount:2,  location:"Dubailand/Al Ain Rd", type:"Luxury Villa Community", emirate:"Dubai" },
  { id:"SSI",  name:"Sobha Siniya Island",      developer:"sobha",    avgPpsf:1800, avgYield:6.0, district:"SSI", projectCount:3,  location:"Siniya Island, UAQ",  type:"Island Beachfront", emirate:"UAQ" },
  // ── NAKHEEL ────────────────────────────────────────────────────────────────
  { id:"PJ",   name:"Palm Jumeirah",            developer:"nakheel",  avgPpsf:4200, avgYield:5.2, district:"PJ",  projectCount:4,  location:"Palm",          type:"Iconic Island" },
  { id:"PJA",  name:"Palm Jebel Ali",           developer:"nakheel",  avgPpsf:2800, avgYield:4.5, district:"PJA", projectCount:3,  location:"Jebel Ali",     type:"New Mega Island" },
  { id:"DI",   name:"Dubai Islands",            developer:"nakheel",  avgPpsf:2200, avgYield:5.5, district:"DI",  projectCount:3,  location:"Deira",         type:"Waterfront City" },
  { id:"JVC",  name:"Jumeirah Village Circle",  developer:"shared",   avgPpsf:1200, avgYield:7.8, district:"JVC", projectCount:10, location:"New Dubai",     type:"Affordable" },
  { id:"AF",   name:"Al Furjan",                developer:"nakheel",  avgPpsf:1100, avgYield:7.2, district:"AF",  projectCount:2,  location:"Jebel Ali",     type:"Family" },
  // ── MERAAS ─────────────────────────────────────────────────────────────────
  { id:"CW",   name:"City Walk",                developer:"meraas",   avgPpsf:3200, avgYield:5.8, district:"CW",  projectCount:3,  location:"Jumeirah",      type:"Urban Lifestyle" },
  { id:"BW",   name:"Bluewaters Island",        developer:"meraas",   avgPpsf:3800, avgYield:5.5, district:"BW",  projectCount:2,  location:"JBR",           type:"Island Destination" },
  { id:"PLM",  name:"Port de La Mer",           developer:"meraas",   avgPpsf:2600, avgYield:6.2, district:"PLM", projectCount:2,  location:"Jumeirah",      type:"Marina" },
  { id:"MJL",  name:"Madinat Jumeirah Living",  developer:"meraas",   avgPpsf:2400, avgYield:6.0, district:"MJL", projectCount:2,  location:"Jumeirah",      type:"Family Luxury" },
  { id:"TA",   name:"The Acres",                developer:"meraas",   avgPpsf:1800, avgYield:5.5, district:"TA",  projectCount:2,  location:"Dubailand",     type:"Eco Villas" },
  { id:"D3",   name:"Dubai Design District",     developer:"meraas",   avgPpsf:2800, avgYield:6.5, district:"D3",  projectCount:2,  location:"Al Quoz Canal",     type:"Creative Hub Residential" },
  // ── ALDAR ──────────────────────────────────────────────────────────────────
  { id:"YI",   name:"Yas Island",               developer:"aldar",    avgPpsf:2200, avgYield:6.2, district:"YI",  projectCount:4,  location:"Abu Dhabi",     type:"Entertainment" },
  { id:"SAI",  name:"Saadiyat Island",          developer:"aldar",    avgPpsf:4800, avgYield:4.8, district:"SAI", projectCount:3,  location:"Abu Dhabi",     type:"Cultural Luxury" },
  { id:"RI",   name:"Reem Island",              developer:"aldar",    avgPpsf:1800, avgYield:7.0, district:"RI",  projectCount:2,  location:"Abu Dhabi",     type:"Urban" },
  { id:"ATH",  name:"Athlon",                   developer:"aldar",    avgPpsf:1900, avgYield:6.8, district:"ATH", projectCount:2,  location:"Dubailand",     type:"Active Lifestyle" },
  { id:"FI",   name:"Fahid Island",              developer:"aldar",    avgPpsf:2800, avgYield:5.5, district:"FI",  projectCount:2,  location:"Abu Dhabi Coast",   type:"Coastal Wellness Island", emirate:"Abu Dhabi" },
  // ── BINGHATTI ──────────────────────────────────────────────────────────────
  { id:"SO",   name:"Silicon Oasis",            developer:"binghatti",avgPpsf:850,  avgYield:8.5, district:"SO",  projectCount:2,  location:"Tech Hub",      type:"Affordable" },
  { id:"MBR",  name:"MBR City",                 developer:"binghatti",avgPpsf:2600, avgYield:6.0, district:"MBR", projectCount:2,  location:"Nad Al Sheba",  type:"Mixed-Use" },
];

// Quick lookup: district code → community object
export const communityByDistrict = Object.fromEntries(
  (allCommunities||[]).filter(c => c && c.id).map(c => [c.id, c])
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
    (allDevelopers||[]).filter(d => d && d.id).map(d => [d.id, allProjects.filter(p => p.developerId === d.id).length])
  ),
  byCommunity:     Object.fromEntries(
    (allCommunities||[]).filter(c => c && c.id).map(c => [c.id, allProjects.filter(p => (getDistrictCode(p.community) || p.district) === c.id).length])
  ),
  byStatus: {
    delivered:         allProjects.filter(p => p.status === "Delivered").length,
    underConstruction: allProjects.filter(p => p.status === "Under Construction").length,
    offPlan:           allProjects.filter(p => p.status === "Off Plan" || p.status === "Off-Plan").length,
  },
  branded:           allProjects.filter(p => p.branded === true).length,
  ultraLuxury:       allProjects.filter(p => p.tier?.includes("Ultra")).length,
};

