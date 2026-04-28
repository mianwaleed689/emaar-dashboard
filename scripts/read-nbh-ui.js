const fs = require("fs");
const src = fs.readFileSync("src/tabs/NeighbourhoodsTab.jsx", "latin1");
const lines = src.split("\n");
// Show lines 200-400 to see the UI
lines.slice(200, 400).forEach((l, i) => console.log(201+i, l.trim().substring(0,100)));