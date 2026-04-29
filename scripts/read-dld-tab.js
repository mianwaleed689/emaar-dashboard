const fs = require("fs");
const src = fs.readFileSync("src/tabs/DLDVolumesTab.jsx","latin1");
const lines = src.split("\n");
console.log("Lines:", lines.length);
lines.slice(0,20).forEach((l,i)=>console.log(i+1,l.replace(/[^\x20-\x7E]/g,"").substring(0,100)));
console.log("\n=== DATA SOURCES ===");
lines.forEach((l,i)=>{
  if(l.includes("SEED")||l.includes("live")||l.includes("data")||l.includes("community")) {
    const clean = l.replace(/[^\x20-\x7E]/g,"").trim();
    if(clean.length>10) console.log(i+1, clean.substring(0,100));
  }
});