const fs = require("fs");
const src = fs.readFileSync("src/tabs/NeighbourhoodsTab.jsx", "latin1");
const lines = src.split("\n");
// Show last 100 lines to see main render
lines.slice(580, 687).forEach((l, i) => console.log(581+i, l.trim().substring(0,100)));