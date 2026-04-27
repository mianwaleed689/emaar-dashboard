const fs = require("fs");
const lines = fs.readFileSync("src/pages/EmaarDashboardV2.jsx", "latin1").split("\n");
// Find SEED_DATA definition
lines.forEach((l, i) => {
  if (l.includes("SEED_DATA") && (l.includes("const") || l.includes("={") || l.includes("= {")))
    console.log(i + 1, l.trim());
});