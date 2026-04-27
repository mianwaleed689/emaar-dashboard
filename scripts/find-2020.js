const fs = require("fs");
const lines = fs.readFileSync("src/tabs/MarketTab.jsx", "latin1").split("\n");
lines.forEach((l, i) => { if (l.includes("DLD 2020")) console.log(i + 1, JSON.stringify(l)); });