const fs = require("fs");
const lines = fs.readFileSync("src/pages/EmaarDashboardV2.jsx", "latin1").split("\n");
lines.forEach((l, i) => {
  if (l.includes("seedCommunities") || l.includes("CommunityMapTab") || l.includes("SEED_DATA.communities"))
    console.log(i + 1, l.trim());
});