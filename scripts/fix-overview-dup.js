const fs = require("fs");
let src = fs.readFileSync("src/tabs/OverviewTab.jsx","latin1");
src = src.replace(
  `function OverviewTab({ liveNeighbourhoods=[], liveNeighbourhoods=[],`,
  `function OverviewTab({ liveNeighbourhoods=[],`
);
fs.writeFileSync("src/tabs/OverviewTab.jsx", src, "latin1");
console.log("Fixed");