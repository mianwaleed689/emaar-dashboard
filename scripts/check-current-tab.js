const fs = require("fs");
const src = fs.readFileSync("src/tabs/NeighbourhoodsTab.jsx", "utf8");
const lines = src.split("\n");

console.log("Total lines:", lines.length);
console.log("\n=== FIRST 20 LINES ===");
lines.slice(0,20).forEach((l,i)=>console.log(i+1,l));

console.log("\n=== TAB DEFINITIONS ===");
lines.forEach((l,i)=>{
  if(l.includes("Overview") || l.includes("Investment") || l.includes("Location") || l.includes("Facilities") || l.includes("Landmarks") || l.includes("Lifestyle")) {
    console.log(i+1, l.trim().substring(0,100));
  }
});