const fs = require("fs");
const src = fs.readFileSync("src/tabs/YieldsTab.jsx", "latin1");
const lines = src.split("\n");
console.log("Lines:", lines.length);
lines.slice(0,30).forEach((l,i)=>console.log(i+1, l.replace(/[^\x20-\x7E]/g,"").substring(0,100)));