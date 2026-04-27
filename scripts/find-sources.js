const fs = require("fs");
const lines = fs.readFileSync("src/tabs/MarketTab.jsx", "latin1").split("\n");
lines.forEach((l, i) => { if (l.includes("ources")) console.log(i + 1, l.trim()); });