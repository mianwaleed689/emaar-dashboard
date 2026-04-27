const fs = require("fs");
const lines = fs.readFileSync("src/tabs/DXBEstimateTab.jsx", "latin1").split("\n");
lines.forEach((l, i) => { if (l.includes("BASE_PPSF") || l.includes("SEED_DATA") || l.includes("import")) console.log(i + 1, l.trim()); });