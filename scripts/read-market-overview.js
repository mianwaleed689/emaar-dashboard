const fs = require("fs");
["src/tabs/MarketTab.jsx", "src/tabs/OverviewTab.jsx"].forEach(f => {
  console.log("\n=== " + f + " ===");
  const lines = fs.readFileSync(f, "latin1").split("\n");
  lines.slice(0, 120).forEach((l, i) => console.log(i + 1, l));
});