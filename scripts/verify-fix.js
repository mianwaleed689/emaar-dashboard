const fs = require("fs");
const src = fs.readFileSync("src/pages/EmaarDashboardV2.jsx", "latin1");
const lines = src.split("\n");

console.log("=== CHECKING LINES 3396-3425 ===");
lines.slice(3395, 3425).forEach((l,i) => 
  console.log(3396+i, l.replace(/[^\x20-\x7E]/g,"").substring(0,100))
);