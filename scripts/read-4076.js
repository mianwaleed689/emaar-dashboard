const fs = require("fs");
const src = fs.readFileSync("src/pages/EmaarDashboardV2.jsx", "latin1");
const lines = src.split("\n");
lines.slice(4070, 4090).forEach((l, i) => console.log(4071+i, l));