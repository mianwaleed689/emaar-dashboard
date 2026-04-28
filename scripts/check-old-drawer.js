const fs = require("fs");
const src = fs.readFileSync("src/pages/EmaarDashboardV2.jsx", "latin1");
const lines = src.split("\n");

// Check what selectedNbhd does — is there an old drawer?
lines.forEach((l, i) => {
  if (l.includes("selectedNbhd") || l.includes("NbhdDrawer") || l.includes("neighbourhood-drawer")) {
    const clean = l.replace(/[^\x20-\x7E]/g,"").trim();
    if(clean.length>5) console.log(i+1, clean.substring(0,120));
  }
});