const fs = require("fs");
const src = fs.readFileSync("src/tabs/ProjectsTab.jsx", "latin1");
const lines = src.split("\n");
console.log("Lines:", lines.length);
console.log("\nFirst 20 lines:");
lines.slice(0,20).forEach((l,i)=>console.log(i+1, l.replace(/[^\x20-\x7E]/g,"").substring(0,100)));

console.log("\nProps received:");
lines.forEach((l,i)=>{
  if(l.includes("liveNeighbourhoods")||l.includes("neighbourhoodScores")||l.includes("community")) {
    const clean = l.replace(/[^\x20-\x7E]/g,"").trim();
    if(clean.length>5) console.log(i+1, clean.substring(0,100));
  }
});