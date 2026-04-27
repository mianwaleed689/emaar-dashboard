const fs = require("fs");
const src = fs.readFileSync("src/pages/EmaarDashboardV2.jsx", "latin1");
const lines = src.split("\n");

// Show the dldVolumes snapshot listener area
console.log("=== dldVolumes listener (lines 3535-3560) ===");
lines.slice(3534, 3560).forEach((l, i) => console.log(3535+i, l));

// Show PriceHistoryTab usage
console.log("\n=== PriceHistoryTab usage ===");
lines.forEach((l, i) => { if (l.includes("PriceHistoryTab") || l.includes("phCommunity") || l.includes("livePriceHistory")) console.log(i+1, l.trim()); });

// Show lines around 2413 (state declarations)
console.log("\n=== State declarations area (2410-2430) ===");
lines.slice(2409, 2430).forEach((l, i) => console.log(2410+i, l));