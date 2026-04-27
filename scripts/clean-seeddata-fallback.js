const fs = require("fs");
const p = "src/pages/EmaarDashboardV2.jsx";
let s = fs.readFileSync(p, "latin1");
s = s.replace(
  `seedCommunities={firestoreCommunities.length > 0 ? firestoreCommunities : SEED_DATA.communities}`,
  `seedCommunities={firestoreCommunities}`
);
fs.writeFileSync(p, s, "latin1");
console.log("Done.");
const lines = s.split("\n");
lines.forEach((l, i) => { if (l.includes("seedCommunities")) console.log(i + 1, l.trim()); });