const fs = require("fs");
const lines = fs.readFileSync("src/pages/EmaarDashboardV2.jsx", "latin1").split("\n");
// Show CommunityMapTab usage in context
lines.slice(4582, 4602).forEach((l, i) => console.log(4583 + i, l));
console.log("---");
// Check if communities hook already imported
lines.forEach((l, i) => {
  if (l.includes("useUserFacingCommunities") || l.includes("lib/communities"))
    console.log(i + 1, l.trim());
});