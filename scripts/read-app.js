const fs = require("fs");
const src = fs.readFileSync("src/App.jsx", "latin1");
console.log("Lines:", src.split("\n").length);
src.split("\n").forEach((l, i) => console.log(i+1, l));