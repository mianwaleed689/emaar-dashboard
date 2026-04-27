const fs = require("fs");
const lines = fs.readFileSync("src/pages/EmaarDashboardV2.jsx", "latin1").split("\n");
lines.slice(754, 900).forEach((l, i) => console.log(754 + i + 1, l));