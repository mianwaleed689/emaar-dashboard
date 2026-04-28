const fs = require("fs");
const content = fs.readFileSync("src/pages/EmaarDashboardV2.jsx", "latin1");
const lines = content.split("\n");
lines.slice(2299, 2310).forEach((l, i) => console.log(2300+i, l));