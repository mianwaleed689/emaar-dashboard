const fs = require("fs");
const src = fs.readFileSync("src/tabs/ProjectsTab.jsx","latin1");
const lines = src.split("\n");

// Find getCommunityData references
lines.forEach((l,i)=>{
  if(l.includes("getCommunityData")) {
    console.log(i+1, l.replace(/[^\x20-\x7E]/g,"").trim().substring(0,100));
  }
});