const fs = require("fs");
const src = fs.readFileSync("src/pages/EmaarDashboardV2.jsx", "latin1");
const lines = src.split("\n");

// Find how NeighbourhoodsTab is rendered and what props it gets
lines.forEach((l, i) => {
  if (l.includes("NeighbourhoodsTab") || l.includes("liveNeighbourhoods") || l.includes("neighbourhoodScores")) {
    const clean = l.trim().replace(/[^\x20-\x7E]/g, "");
    console.log(i+1, clean.substring(0,120));
  }
});