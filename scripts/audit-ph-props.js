const fs = require("fs");
const src = fs.readFileSync("src/pages/EmaarDashboardV2.jsx", "latin1");
const lines = src.split("\n");
lines.slice(4483, 4500).forEach((l, i) => console.log(4484+i, l));