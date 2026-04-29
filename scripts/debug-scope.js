const fs = require("fs");
const src = fs.readFileSync("src/tabs/ProjectsTab.jsx","latin1");
const lines = src.split("\n");

// Find where communityMap is defined
lines.forEach((l,i)=>{
  if(l.includes("communityMap")||l.includes("getCommunityData =")) {
    console.log(i+1, l.replace(/[^\x20-\x7E]/g,"").trim().substring(0,100));
  }
});

// Find function ProjectsTab signature
lines.forEach((l,i)=>{
  if(l.includes("function ProjectsTab")) {
    console.log("ProjectsTab at line:", i+1);
  }
});

// Find MODES constant
lines.forEach((l,i)=>{
  if(l.includes("const MODES")) {
    console.log("MODES at line:", i+1);
  }
});