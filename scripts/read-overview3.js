const fs = require("fs");
const lines = fs.readFileSync("src/tabs/OverviewTab.jsx", "latin1").split("\n");
lines.slice(200, 356).forEach((l, i) => console.log(201 + i, l));