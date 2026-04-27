const fs = require("fs");
const lines = fs.readFileSync("src/pages/EmaarDashboardV2.jsx", "latin1").split("\n");
lines.slice(2313, 2320).forEach((l, i) => console.log(2314 + i, l));