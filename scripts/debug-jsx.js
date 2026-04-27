const fs = require("fs");
const lines = fs.readFileSync("src/tabs/MarketTab.jsx", "latin1").split("\n");
lines.slice(115, 130).forEach((l, i) => console.log(116 + i, l));