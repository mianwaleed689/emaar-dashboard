const fs = require("fs");
const src = fs.readFileSync("src/tabs/MyLeadsTab.jsx", "latin1");
const lines = src.split("\n");
console.log("Lines:", lines.length);
// Show structure
lines.forEach((l, i) => {
  if (l.includes("function ") || l.includes("const ML_") || l.includes("PIPELINE") || 
      l.includes("useState") || l.includes("return (") || l.includes("export default")) {
    console.log(i+1, l.trim().substring(0,100));
  }
});