const fs = require("fs");
const src = fs.readFileSync("src/pages/EmaarDashboardV2.jsx", "latin1");
const lines = src.split("\n");
lines.slice(4495, 4520).forEach((l, i) => console.log(4496+i, l.trim().substring(0,120)));