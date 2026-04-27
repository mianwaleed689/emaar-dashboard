const fs = require("fs");
const lines = fs.readFileSync("src/tabs/MarketTab.jsx", "latin1").split("\n");
lines.slice(85, 105).forEach((l, i) => console.log(86 + i, l));
console.log("---total lines:", lines.length);