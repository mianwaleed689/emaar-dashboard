const fs = require("fs");
const src = fs.readFileSync("src/tabs/NeighbourhoodsTab.jsx", "latin1");
const lines = src.split("\n");
console.log("Lines:", lines.length);
// Show structure
lines.forEach((l, i) => {
  if (l.includes("function ") || l.includes("const [") || l.includes("return (") || 
      l.includes("useState") || l.includes("// ──") || l.includes("/* ──") || l.includes("{/*")) {
    if (i < 100) console.log(i+1, l.trim().substring(0,100));
  }
});