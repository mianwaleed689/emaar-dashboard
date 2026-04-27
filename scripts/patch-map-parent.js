const fs = require("fs");

// ── PATCH 1: EmaarDashboardV2.jsx ──────────────────────────────────────────
const parentPath = "src/pages/EmaarDashboardV2.jsx";
let parent = fs.readFileSync(parentPath, "latin1");

// 1a. Add import after the last tab import line
parent = parent.replace(
  `import RoiCalculator from "../components/RoiCalculator";`,
  `import RoiCalculator from "../components/RoiCalculator";\nimport { useUserFacingCommunities } from "../lib/communities";`
);

// 1b. Add hook call after useFilters line
parent = parent.replace(
  `  const { filters: _gf, setFilter: _gSetOne, setFilters: _gSetMany } = useFilters();`,
  `  const { filters: _gf, setFilter: _gSetOne, setFilters: _gSetMany } = useFilters();\n  const { data: firestoreCommunities = [] } = useUserFacingCommunities();`
);

// 1c. Replace seedCommunities prop
parent = parent.replace(
  `seedCommunities={SEED_DATA.communities}`,
  `seedCommunities={firestoreCommunities.length > 0 ? firestoreCommunities : SEED_DATA.communities}`
);

fs.writeFileSync(parentPath, parent, "latin1");
console.log("Parent patched. Verifying...");
const pLines = parent.split("\n");
pLines.forEach((l, i) => {
  if (l.includes("useUserFacingCommunities") || l.includes("firestoreCommunities") || l.includes("seedCommunities"))
    console.log(i + 1, l.trim());
});

// ── PATCH 2: CommunityMapTab.jsx ───────────────────────────────────────────
const mapPath = "src/tabs/CommunityMapTab.jsx";
let map = fs.readFileSync(mapPath, "latin1");

// 2a. Remove COMMUNITY_COORDS from import (keep getProjectCoords, getPPSFColor, getVolumeColor)
map = map.replace(
  `import { COMMUNITY_COORDS, getProjectCoords, getPPSFColor, getVolumeColor } from "../utils/coordinates";`,
  `import { getProjectCoords, getPPSFColor, getVolumeColor } from "../utils/coordinates";`
);

// 2b. Replace COMMUNITY_COORDS lookup with Firestore coordinates field
map = map.replace(
  `coords: COMMUNITY_COORDS[c.community] || [25.1124, 55.2594],`,
  `coords: (c.coordinates ? [c.coordinates.lat, c.coordinates.lng] : null) || [25.1124, 55.2594],`
);

fs.writeFileSync(mapPath, map, "latin1");
console.log("\nMap tab patched. Verifying...");
const mLines = map.split("\n");
mLines.forEach((l, i) => {
  if (l.includes("COMMUNITY_COORDS") || l.includes("coordinates") || l.includes("getProjectCoords"))
    console.log(i + 1, l.trim());
});