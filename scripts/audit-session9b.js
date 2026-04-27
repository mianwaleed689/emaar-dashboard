const fs = require("fs");

// Find all SEED_DATA references in DLDVolumesTab
const dld = fs.readFileSync("src/tabs/DLDVolumesTab.jsx", "latin1");
const dldLines = dld.split("\n");
console.log("=== DLDVolumesTab SEED_DATA refs ===");
dldLines.forEach((l, i) => { if (l.includes("SEED_DATA") || l.includes("liveDLD") || l.includes("dldVolumes")) console.log(i+1, l.trim()); });

// Find all SEED_DATA references in PriceHistoryTab
const ph = fs.readFileSync("src/tabs/PriceHistoryTab.jsx", "latin1");
const phLines = ph.split("\n");
console.log("\n=== PriceHistoryTab SEED_DATA refs ===");
phLines.forEach((l, i) => { if (l.includes("SEED_DATA") || l.includes("livePriceHistory") || l.includes("priceHistory") || l.includes("liveMarket")) console.log(i+1, l.trim()); });