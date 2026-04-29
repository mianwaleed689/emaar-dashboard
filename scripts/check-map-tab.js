const fs = require("fs");
const src = fs.readFileSync("src/tabs/CommunityMapTab.jsx","latin1");
const lines = src.split("\n");
console.log("CommunityMapTab lines:", lines.length);
console.log("Has liveNeighbourhoods:", src.includes("liveNeighbourhoods"));
console.log("Has neighbourhoodScores:", src.includes("neighbourhoodScores"));

// Show first 20 lines
lines.slice(0,15).forEach((l,i)=>console.log(i+1, l.replace(/[^\x20-\x7E]/g,"").substring(0,100)));

// Show how map renders community data
console.log("\n=== COMMUNITY DATA USAGE ===");
lines.forEach((l,i)=>{
  if(l.includes("community")||l.includes("yield")||l.includes("popup")||l.includes("marker")) {
    const clean = l.replace(/[^\x20-\x7E]/g,"").trim();
    if(clean.length>10) console.log(i+1, clean.substring(0,100));
  }
});