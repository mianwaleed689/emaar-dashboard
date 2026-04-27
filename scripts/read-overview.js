const fs = require("fs");
const lines = fs.readFileSync("src/tabs/OverviewTab.jsx", "latin1").split("\n");
console.log("Total lines:", lines.length);
lines.slice(0, 50).forEach((l, i) => console.log(i + 1, l));