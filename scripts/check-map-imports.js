const fs = require("fs");
const src = fs.readFileSync("src/tabs/CommunityMapTab.jsx", "latin1");
const lines = src.split("\n");
// Show first 30 lines to see imports
lines.slice(0, 30).forEach((l, i) => console.log(i+1, l.trim().substring(0,120)));