const fs = require("fs");
let src = fs.readFileSync("src/pages/EmaarDashboardV2.jsx", "latin1");

// Find YieldsTab render and add liveNeighbourhoods prop
src = src.replace(
  `tab === "Yields"`,
  `tab === "Yields"`
);

// Find how YieldsTab is currently called
const idx = src.indexOf('tab === "Yields"');
const chunk = src.substring(idx, idx+300);
console.log("Yields tab render:", chunk.replace(/[^\x20-\x7E]/g,"").substring(0,200));