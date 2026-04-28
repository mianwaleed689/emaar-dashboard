const fs = require("fs");
const src = fs.readFileSync("src/tabs/NeighbourhoodsTab.jsx", "latin1");
const lines = src.split("\n");
lines.slice(84, 100).forEach((l, i) => console.log(85+i, JSON.stringify(l)));