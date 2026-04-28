const fs = require("fs");
const src = fs.readFileSync("src/admin/PlatformLeadsTab.jsx", "latin1");
const lines = src.split("\n");
lines.slice(600, 900).forEach((l, i) => console.log(601+i, l));