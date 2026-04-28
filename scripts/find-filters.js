const fs = require("fs");
const src = fs.readFileSync("src/tabs/DLDVolumesTab.jsx", "latin1");
const lines = src.split("\n");

// Find the filter section
lines.forEach((l, i) => {
  if (l.includes("Filters") || l.includes("filterSector") || l.includes("Search community") || l.includes("sortBy")) {
    console.log(i+1, l.trim().substring(0, 100));
  }
});
console.log("\nTotal lines:", lines.length);