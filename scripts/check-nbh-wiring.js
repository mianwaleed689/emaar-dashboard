const fs = require("fs");
const src = fs.readFileSync("src/tabs/NeighbourhoodsTab.jsx", "latin1");
const lines = src.split("\n");
// Find where liveNeighbourhoods is used
lines.forEach((l, i) => {
  if (l.includes("liveNeighbourhoods") || l.includes("rawNbh") || l.includes("tier") || l.includes("Tier")) {
    if (i < 200) console.log(i+1, l.trim().substring(0,120));
  }
});