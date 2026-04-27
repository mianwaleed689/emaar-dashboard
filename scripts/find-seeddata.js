const fs = require("fs");
const lines = fs.readFileSync("src/tabs/OverviewTab.jsx", "latin1").split("\n");
lines.forEach((l, i) => { if (l.includes("SEED_DATA")) console.log(i + 1, l); });