const fs = require("fs");
const src = fs.readFileSync("src/pages/EmaarDashboardV2.jsx", "latin1");
const lines = src.split("\n");
lines.slice(5248, 5300).forEach((l, i) => console.log(5249+i, l));