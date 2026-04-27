const fs = require("fs");
const files = [
  "src/tabs/NeighbourhoodsTab.jsx",
  "src/tabs/DXBEstimateTab.jsx",
  "src/tabs/CommunityMapTab.jsx",
  "src/pages/EmaarDashboardV2.jsx"
];
let allClean = true;
files.forEach(f => {
  const lines = fs.readFileSync(f, "latin1").split("\n");
  lines.forEach((l, i) => {
    if (l.includes("COMMUNITY_COORDS") || l.includes("SEED_DATA.communities")) {
      console.log("PROBLEM:", f, i + 1, l.trim());
      allClean = false;
    }
  });
});
if (allClean) console.log("All clean - no COMMUNITY_COORDS or SEED_DATA.communities remaining.");