const fs = require("fs");
const src = fs.readFileSync("src/admin/PlatformLeadsTab.jsx", "latin1");
const lines = src.split("\n");
lines.slice(300, 600).forEach((l, i) => console.log(301+i, l));