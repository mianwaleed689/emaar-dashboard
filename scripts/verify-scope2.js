const fs = require("fs");
const src = fs.readFileSync("src/tabs/ProjectsTab.jsx","latin1");
const lines = src.split("\n");

let defLine = -1, useLine1 = -1, useLine2 = -1, compLine = -1;
lines.forEach((l,i)=>{
  if(l.includes("getCommunityData =")) defLine = i+1;
  if(l.includes("getCommunityData(p)") && useLine1===-1) useLine1 = i+1;
  if(l.includes("getCommunityData(selectedProject)")) useLine2 = i+1;
  if(l.includes("function ProjectsTab")) compLine = i+1;
});

console.log("ProjectsTab function at line:", compLine);
console.log("getCommunityData DEFINED at line:", defLine);
console.log("getCommunityData USED at lines:", useLine1, useLine2);
console.log("Is defined AFTER component start:", defLine > compLine ? "YES" : "NO - STILL WRONG");