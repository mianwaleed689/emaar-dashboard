const fs = require("fs");
const src = fs.readFileSync("src/pages/EmaarDashboardV2.jsx", "latin1");
const lines = src.split("\n");
lines.slice(3395, 3430).forEach((l,i) => console.log(3396+i, l.replace(/[^\x20-\x7E]/g,"").substring(0,120)));