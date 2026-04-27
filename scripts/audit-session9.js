const fs = require("fs");

// Check DLDVolumesTab
const dld = fs.readFileSync("src/tabs/DLDVolumesTab.jsx", "latin1");
const dldLines = dld.split("\n");
console.log("=== DLDVolumesTab.jsx ===");
console.log("Total lines:", dldLines.length);
dldLines.slice(0, 20).forEach((l, i) => console.log(i+1, l));

// Check PriceHistoryTab
const ph = fs.readFileSync("src/tabs/PriceHistoryTab.jsx", "latin1");
const phLines = ph.split("\n");
console.log("\n=== PriceHistoryTab.jsx ===");
console.log("Total lines:", phLines.length);
phLines.slice(0, 20).forEach((l, i) => console.log(i+1, l));