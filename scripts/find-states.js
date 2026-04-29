const fs = require("fs");
const src = fs.readFileSync("src/tabs/ProjectsTab.jsx","latin1");
const lines = src.split("\n");

// Find the useState for showDevDrop
lines.forEach((l,i)=>{
  if(l.includes("showDevDrop")||l.includes("devSearch")||l.includes("commSearch2")) {
    console.log(i+1, l.replace(/[^\x20-\x7E]/g,"").trim().substring(0,100));
  }
});