const fs = require("fs");
const src = fs.readFileSync("src/tabs/NeighbourhoodsTab.jsx", "utf8");
const lines = src.split("\n");

// Find toolbar/filter section
lines.forEach((l,i) => {
  if(l.includes("select") || l.includes("filter") || l.includes("sort") || l.includes("Filter") || l.includes("Sort")) {
    const clean = l.trim().replace(/[^\x20-\x7E]/g,"");
    if(clean.length>10) console.log(i+1, clean.substring(0,120));
  }
});