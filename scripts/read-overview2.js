const fs = require("fs");
const lines = fs.readFileSync("src/tabs/OverviewTab.jsx", "latin1").split("\n");
lines.slice(100, 200).forEach((l, i) => console.log(101 + i, l));