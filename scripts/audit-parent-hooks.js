const fs = require("fs");
const lines = fs.readFileSync("src/pages/EmaarDashboardV2.jsx", "latin1").split("\n");
// Show first 40 lines for imports
lines.slice(0, 40).forEach((l, i) => console.log(i + 1, l));
console.log("---");
// Find where hooks are called (useCommunities, useDevelopers etc)
lines.forEach((l, i) => {
  if (l.includes("useCommunities") || l.includes("useDevelopers") || l.includes("useProjects"))
    console.log(i + 1, l.trim());
});