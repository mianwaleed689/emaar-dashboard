const fs = require("fs");
let src = fs.readFileSync("src/tabs/ProjectsTab.jsx","latin1");
const lines = src.split("\n");

// Check if communityMap or nbhdMap exists
lines.forEach((l,i)=>{
  if(l.includes("communityMap")||l.includes("nbhdMap")||l.includes("liveNeighbourhoods")) {
    console.log(i+1, l.replace(/[^\x20-\x7E]/g,"").trim().substring(0,100));
  }
});