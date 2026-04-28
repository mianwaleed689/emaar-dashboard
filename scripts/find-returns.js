const fs = require("fs");
const src = fs.readFileSync("src/pages/EmaarDashboardV2.jsx", "latin1");
const lines = src.split("\n");
// Find return statements near login/auth
lines.forEach((l, i) => {
  if (l.trim().startsWith("return") && i > 3700) {
    console.log(i+1, l.trim().substring(0,120));
  }
});