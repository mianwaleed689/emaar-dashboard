const fs = require("fs");
const src = fs.readFileSync("src/pages/EmaarDashboardV2.jsx", "latin1");
const lines = src.split("\n");

// Find old neighbourhood drawer
lines.forEach((l, i) => {
  if (l.includes("Location") && l.includes("Projects") && l.includes("Overview") && l.includes("Investment")) {
    console.log(i+1, l.replace(/[^\x20-\x7E]/g,"").substring(0,120));
  }
});

// Also search for old drawer component
lines.forEach((l, i) => {
  if (l.includes("NbhDrawer") || l.includes("NeighbourhoodDrawer") || l.includes("nbhd-drawer") || 
      (l.includes("selectedNbhd") && l.includes("drawer"))) {
    console.log(i+1, l.replace(/[^\x20-\x7E]/g,"").substring(0,120));
  }
});