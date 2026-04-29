const fs = require("fs");
const src = fs.readFileSync("src/tabs/LaunchCalendarTab.jsx","latin1");
const lines = src.split("\n");

// Check what data it uses
console.log("=== DATA ===");
lines.forEach((l,i)=>{
  if(l.includes("liveNeighbourhoods")||l.includes("getNbhd")||l.includes("community")||l.includes("SEED_LAUNCH")) {
    const clean = l.replace(/[^\x20-\x7E]/g,"").trim();
    if(clean.length>5) console.log(i+1, clean.substring(0,100));
  }
});

// Check what views it has
console.log("\n=== VIEWS/MODES ===");
lines.forEach((l,i)=>{
  if(l.includes("newspaper")||l.includes("calendar")||l.includes("comparison")||l.includes("mode")||l.includes("view")) {
    const clean = l.replace(/[^\x20-\x7E]/g,"").trim();
    if(clean.length>5&&clean.includes('"')) console.log(i+1, clean.substring(0,100));
  }
});