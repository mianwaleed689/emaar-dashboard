/* ═══════════════════════════════════════════════════════════════════
   DXB ANALYTICS — COORDINATES
   Extracted from EmaarDashboardV2.jsx
   Single source of truth for all Dubai community + project coords
   Previously duplicated in 3 places — now deduplicated
   ═══════════════════════════════════════════════════════════════════ */

/* ─── DEFAULT FALLBACK (Downtown Dubai center) ─── */
export const DEFAULT_COORDS = [25.1972, 55.2744];

/* ─── 20 SEED COMMUNITIES — accurate Dubai coordinates ─── */
export const COMMUNITY_COORDS = {
  "Jumeirah Village Circle":    [25.0607, 55.2088],
  "JVC":                        [25.0607, 55.2088],
  "Dubai Marina":               [25.0807, 55.1429],
  "Business Bay":               [25.1854, 55.2719],
  "Downtown Dubai":             [25.1972, 55.2744],
  "Dubai Hills Estate":         [25.1124, 55.2594],
  "Dubai Hills":                [25.1124, 55.2594],
  "Palm Jumeirah":              [25.1124, 55.1390],
  "Jumeirah Lake Towers":       [25.0699, 55.1478],
  "JLT":                        [25.0699, 55.1478],
  "Arabian Ranches":            [25.0517, 55.2699],
  "International City":         [25.1621, 55.4121],
  "Dubai Creek Harbour":        [25.1942, 55.3556],
  "Al Furjan":                  [25.0255, 55.1494],
  "Dubai South":                [24.8972, 55.1615],
  "Mohammed Bin Rashid City":   [25.1740, 55.3310],
  "MBR City":                   [25.1740, 55.3310],
  "Sobha Hartland":             [25.1825, 55.3427],
  "Tilal Al Ghaf":              [25.0308, 55.2290],
  "Discovery Gardens":          [25.0366, 55.1318],
  "Dubai Silicon Oasis":        [25.1175, 55.3796],
  "DSO":                        [25.1175, 55.3796],
  "Arjan":                      [25.0552, 55.2178],
  "DAMAC Hills 2":              [24.9729, 55.3035],
  "Emaar Beachfront":           [25.0882, 55.1385],
};

/* ─── EXTENDED COMMUNITIES — all other Dubai areas ─── */
export const EXTENDED_COMMUNITY_COORDS = {
  "DIFC":                       [25.2100, 55.2800],
  "City Walk":                  [25.2000, 55.2550],
  "Jumeirah":                   [25.1900, 55.2200],
  "Jumeirah 1":                 [25.1900, 55.2200],
  "Jumeirah 2":                 [25.1900, 55.2400],
  "Jumeirah 3":                 [25.1900, 55.2100],
  "Mirdif":                     [25.2200, 55.4200],
  "Al Quoz":                    [25.1500, 55.2200],
  "Bur Dubai":                  [25.2600, 55.2900],
  "Deira":                      [25.2700, 55.3200],
  "Al Barsha":                  [25.1100, 55.2000],
  "The Greens":                 [25.0900, 55.1700],
  "The Views":                  [25.0900, 55.1750],
  "The Meadows":                [25.0650, 55.1700],
  "The Springs":                [25.0550, 55.1750],
  "The Lakes":                  [25.0500, 55.1600],
  "Arabian Ranches 2":          [25.0300, 55.2800],
  "Arabian Ranches 3":          [25.0530, 55.2690],
  "Dubailand":                  [25.0400, 55.3800],
  "Motor City":                 [25.0520, 55.2380],
  "Sports City":                [25.0400, 55.2300],
  "Dubai Sports City":          [25.0400, 55.2300],
  "DAMAC Hills":                [25.0300, 55.2500],
  "Mudon":                      [25.0200, 55.2500],
  "Town Square":                [25.0000, 55.2800],
  "The Valley":                 [25.0100, 55.5000],
  "The Oasis":                  [25.0200, 55.1800],
  "Emaar South":                [24.8980, 55.1640],
  "Dubai World Central":        [24.8972, 55.1615],
  "Jebel Ali":                  [24.9900, 55.0700],
  "Dubai Industrial City":      [24.9500, 55.1500],
  "Rashid Yachts & Marina":     [25.2200, 55.3100],
  "Dubai Islands":              [25.2900, 55.3300],
  "Palm Deira":                 [25.2900, 55.3300],
  "Bluewaters":                 [25.0800, 55.1200],
  "Dubai Harbour":              [25.0800, 55.1300],
  "Grand Polo Club":            [24.8500, 55.4200],
  "Yas Island":                 [24.4900, 54.6100],
  "Saadiyat Island":            [24.5300, 54.4300],
  "Reem Island":                [24.5000, 54.4000],
  "Creek Waters":               [25.1876, 55.3344],
  "Nad Al Sheba":               [25.1600, 55.3100],
  "Meydan":                     [25.1700, 55.3000],
  "Al Safa":                    [25.1700, 55.2400],
  "Umm Suqeim":                 [25.1400, 55.2000],
  "Madinat Jumeirah":           [25.1400, 55.1850],
};

/* ─── ALL COMMUNITIES — merged lookup ─── */
export const ALL_COMMUNITY_COORDS = {
  ...COMMUNITY_COORDS,
  ...EXTENDED_COMMUNITY_COORDS,
};

/* ─── PROJECT-LEVEL COORDINATES ─── */
export const PROJECT_COORDS = {
  "Creek Waters": [25.1876, 55.3344], "Creek Waters 2": [25.1890, 55.3360],
  "Creek Horizon": [25.1860, 55.3320], "Creek Beach": [25.1920, 55.3380],
  "Creek Palace": [25.1840, 55.3300], "Harbour Gate": [25.1950, 55.3400],
  "Address Harbour Point": [25.1930, 55.3390], "Creek Edge": [25.1870, 55.3350],
  "Dubai Hills": [25.1124, 55.2594], "Golf Grand": [25.1050, 55.2650],
  "Elvira": [25.1070, 55.2570], "Lime Gardens": [25.1090, 55.2530],
  "Greenside": [25.1030, 55.2510], "Parkside Hills": [25.1000, 55.2480],
  "The Acres": [24.9800, 55.2000], "The Oasis": [25.0200, 55.1800],
  "Emaar South": [24.8980, 55.1640], "Greenview": [24.9000, 55.1660],
  "Urbana": [24.8950, 55.1600], "Expo Golf Villas": [24.8900, 55.1580],
  "Emaar Beachfront": [25.0780, 55.1340], "Address Beach Resort": [25.0800, 55.1360],
  "Marina Shores": [25.0760, 55.1320], "Beach Mansion": [25.0820, 55.1380],
  "Grand Polo Club": [24.8500, 55.4200], "The Valley": [25.0000, 55.5000],
  "Sunridge": [25.0100, 55.5100], "Farm Gardens": [25.0050, 55.4950],
  "Alana": [25.0080, 55.5050], "Orania": [24.9950, 55.4900],
  "Downtown Dubai": [25.1972, 55.2744], "The Grand": [25.1950, 55.2720],
  "Palace Residences": [25.1990, 55.2760], "IL Primo": [25.1960, 55.2730],
  "Act One Act Two": [25.1980, 55.2750], "Forte": [25.1940, 55.2710],
  "Opera District": [25.1930, 55.2700], "Address Residences": [25.1970, 55.2740],
  "Business Bay": [25.1867, 55.2653], "The Crest": [25.1850, 55.2640],
  "Arabian Ranches": [25.0530, 55.2690], "Ruba": [25.0550, 55.2710],
  "Mudon": [25.0200, 55.2500], "Nima": [25.0220, 55.2520],
  "Rashid Yachts": [25.2200, 55.3100], "Elvire": [25.1080, 55.2560],
  "Park Lane": [25.1110, 55.2580], "Golf Place": [25.1060, 55.2620],
};

/* ─── COORDINATE RESOLVER — single function to get coords for any project ─── */
export const getProjectCoords = (project) => {
  // 1. Direct lat/lng on project
  if (project.lat && project.lng) return [project.lat, project.lng];
  if (project.latitude && project.longitude) return [project.latitude, project.longitude];
  if (project.coords && project.coords.length === 2) return project.coords;

  // 2. Exact project name match
  if (PROJECT_COORDS[project.name]) return PROJECT_COORDS[project.name];
  if (PROJECT_COORDS[project.project]) return PROJECT_COORDS[project.project];

  // 3. Community lookup
  if (ALL_COMMUNITY_COORDS[project.community]) return ALL_COMMUNITY_COORDS[project.community];

  // 4. Partial community name match
  const commLower = (project.community || "").toLowerCase();
  const partialMatch = Object.entries(ALL_COMMUNITY_COORDS).find(([key]) =>
    key.toLowerCase().includes(commLower) || commLower.includes(key.toLowerCase().split(" ").slice(0, 2).join(" "))
  );
  if (partialMatch) return partialMatch[1];

  // 5. Default — Downtown Dubai center
  console.warn("DXB Map: No coords for", project.community, "— using Downtown default");
  return DEFAULT_COORDS;
};

/* ─── MAP LAYER HELPERS ─── */
export const getPPSFColor = (ppsf) => {
  if (ppsf >= 3500) return "#F59E0B";
  if (ppsf >= 2500) return "#D4A843";
  if (ppsf >= 1800) return "#14B8A6";
  if (ppsf >= 1400) return "#3B82F6";
  return "#10B981";
};

export const getVolumeColor = (volume) => {
  if (volume >= 10000) return "#EF4444";
  if (volume >= 3000)  return "#F97316";
  if (volume >= 1500)  return "#F59E0B";
  if (volume >= 800)   return "#10B981";
  return "#3B82F6";
};
