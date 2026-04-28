const fs = require("fs");
const content = fs.readFileSync("src/pages/EmaarDashboardV2.jsx", "latin1");
const lines = content.split("\n");

// Find tab state
lines.forEach((l, i) => {
  if (l.includes("setTab") && l.includes("useState")) {
    console.log(i+1, l.trim().substring(0,120));
  }
});