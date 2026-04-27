const fs = require("fs");
const lines = fs.readFileSync("src/tabs/MarketTab.jsx", "latin1").split("\n");
lines.slice(232, 248).forEach((l, i) => console.log(233 + i, l));