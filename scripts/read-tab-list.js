const fs = require("fs");
const src = fs.readFileSync("src/pages/EmaarDashboardV2.jsx", "latin1");
const lines = src.split("\n");
lines.slice(5730, 5820).forEach((l, i) => console.log(5731+i, l.trim().substring(0,100)));