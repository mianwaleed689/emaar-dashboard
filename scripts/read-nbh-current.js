const fs = require("fs");
const src = fs.readFileSync("src/tabs/NeighbourhoodsTab.jsx", "latin1");
console.log("Current lines:", src.split("\n").length);
// Show props
src.split("\n").slice(0,15).forEach((l,i)=>console.log(i+1,l));