const fs = require("fs");
let dash = fs.readFileSync("src/pages/EmaarDashboardV2.jsx","latin1");
const lines = dash.split("\n");

// Find where allDevelopers is loaded
lines.forEach((l,i)=>{
  if(l.includes("allDevelopers")||l.includes("setAllDevelopers")) {
    const clean = l.replace(/[^\x20-\x7E]/g,"").trim();
    if(clean.length>5) console.log(i+1, clean.substring(0,100));
  }
});