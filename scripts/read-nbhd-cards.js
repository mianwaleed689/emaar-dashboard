const fs = require("fs");
const src = fs.readFileSync("src/tabs/NeighbourhoodsTab.jsx","latin1");
const lines = src.split("\n");

// Find card rendering
lines.forEach((l,i)=>{
  if(l.includes("card")||l.includes("Card")||l.includes("gridTemplate")) {
    const clean = l.replace(/[^\x20-\x7E]/g,"").trim();
    if(clean.length>10) console.log(i+1, clean.substring(0,100));
  }
});