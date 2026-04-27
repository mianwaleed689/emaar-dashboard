const fs = require("fs");
const lines = fs.readFileSync("src/tabs/MarketTab.jsx", "latin1").split("\n");
lines.slice(44, 58).forEach((l, i) => console.log(45 + i, l));