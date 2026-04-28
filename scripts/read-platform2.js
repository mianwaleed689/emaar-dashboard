const fs = require("fs");
const src = fs.readFileSync("src/admin/PlatformLeadsTab.jsx", "latin1");
const lines = src.split("\n");
// Read lines 100-300
lines.slice(100, 300).forEach((l, i) => console.log(101+i, l));