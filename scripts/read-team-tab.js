const fs = require("fs");
const src = fs.readFileSync("src/tabs/TeamTab.jsx", "latin1");
const lines = src.split("\n");
console.log("Lines:", lines.length);
lines.forEach((l, i) => console.log(i+1, l));