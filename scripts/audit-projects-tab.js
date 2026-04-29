const fs = require("fs");
const src = fs.readFileSync("src/tabs/ProjectsTab.jsx", "latin1");
const lines = src.split("\n");

// Check what props it accepts
const propLine = lines.findIndex(l=>l.includes("function ProjectsTab") || l.includes("export default function"));
console.log("=== COMPONENT SIGNATURE ===");
lines.slice(propLine, propLine+5).forEach((l,i)=>console.log(propLine+i+1, l.replace(/[^\x20-\x7E]/g,"").substring(0,120)));

// Check if it uses neighbourhood data
const hasNbhd = src.includes("liveNeighbourhoods") || src.includes("neighbourhoodScore");
console.log("\nUses neighbourhood data:", hasNbhd);

// Check what detail tabs exist
console.log("\n=== DETAIL TABS ===");
lines.forEach((l,i)=>{
  if(l.includes("projDetailTab") && l.includes("===")) {
    console.log(i+1, l.replace(/[^\x20-\x7E]/g,"").trim().substring(0,100));
  }
});

// Check project card fields shown
console.log("\n=== KEY METRICS SHOWN ===");
lines.forEach((l,i)=>{
  if((l.includes("grossYield")||l.includes("investScore")||l.includes("communityScore")||l.includes("distMetro"))&&l.includes("p.")) {
    console.log(i+1, l.replace(/[^\x20-\x7E]/g,"").trim().substring(0,100));
  }
});