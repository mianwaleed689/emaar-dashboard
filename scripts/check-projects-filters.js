const fs = require("fs");
const src = fs.readFileSync("src/tabs/ProjectsTab.jsx","latin1");
const lines = src.split("\n");

// Find where developer filter is built
lines.forEach((l,i)=>{
  if(l.includes("allDevelopers")||l.includes("developer")||l.includes("setDev")||l.includes("projDev")) {
    const clean = l.replace(/[^\x20-\x7E]/g,"").trim();
    if(clean.length>5) console.log(i+1, clean.substring(0,100));
  }
});