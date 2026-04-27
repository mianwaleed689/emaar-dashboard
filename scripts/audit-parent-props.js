const fs = require("fs");
const src = fs.readFileSync("src/pages/EmaarDashboardV2.jsx", "latin1");
const lines = src.split("\n");

console.log("=== liveDLDVolumes in parent ===");
lines.forEach((l, i) => { if (l.includes("liveDLDVolumes") || l.includes("dldVolumes")) console.log(i+1, l.trim()); });

console.log("\n=== priceHistory / liveMarketData in parent ===");
lines.forEach((l, i) => { if (l.includes("priceHistory") || l.includes("liveMarketData")) console.log(i+1, l.trim()); });

console.log("\n=== Firestore hooks imported ===");
lines.forEach((l, i) => { if (l.includes("useMarket") || l.includes("useDLD") || l.includes("usePriceHistory") || l.includes("useFirestore")) console.log(i+1, l.trim()); });