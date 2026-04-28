const fs = require("fs");
const src = fs.readFileSync("src/pages/EmaarDashboardV2.jsx", "latin1");
const lines = src.split("\n");
// Find sidebar tab groups
lines.forEach((l, i) => {
  if (l.includes("label:") && (l.includes("key:") || l.includes('"id"'))) {
    const clean = l.trim().replace(/[^\x20-\x7E]/g, "");
    if (clean.length > 10) console.log(i+1, clean.substring(0,100));
  }
});