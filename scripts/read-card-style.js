const fs = require("fs");
const src = fs.readFileSync("src/tabs/NeighbourhoodsTab.jsx","latin1");
const lines = src.split("\n");

// Show CommunityCard component (lines 43-140)
lines.slice(42,140).forEach((l,i)=>console.log(42+i+1, l.replace(/[^\x20-\x7E]/g,"").substring(0,100)));