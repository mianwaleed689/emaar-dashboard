const fs = require("fs");
const src = fs.readFileSync("src/tabs/ProjectsTab.jsx","latin1");
const lines = src.split("\n");

// Find devOptions building
lines.forEach((l,i)=>{
  if(l.includes("devOptions")||l.includes("projDev")||l.includes("developer")) {
    const clean = l.replace(/[^\x20-\x7E]/g,"").trim();
    if(clean.includes("Option")||clean.includes("option")||clean.includes("select")) {
      console.log(i+1, clean.substring(0,100));
    }
  }
});