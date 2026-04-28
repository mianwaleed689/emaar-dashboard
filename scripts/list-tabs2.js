const fs = require("fs");
const src = fs.readFileSync("src/pages/EmaarDashboardV2.jsx", "latin1");
const lines = src.split("\n");

lines.forEach((l, i) => {
  if (l.includes('"key"') || l.includes('key:')) {
    if (l.includes('"label"') || l.includes('label:')) {
      console.log(i+1, l.trim().substring(0,100));
    }
  }
});