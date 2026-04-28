const fs = require("fs");
const src = fs.readFileSync("src/tabs/NeighbourhoodsTab.jsx", "latin1");
const lines = src.split("\n");
// Show first 80 lines
lines.slice(0, 80).forEach((l, i) => console.log(i+1, l));