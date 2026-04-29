const fs = require("fs");
const src = fs.readFileSync("src/tabs/ProjectsTab.jsx","latin1");
const lines = src.split("\n");

let compLine=-1, showDevLine=-1;
lines.forEach((l,i)=>{
  if(l.includes("function ProjectsTab")) compLine=i+1;
  if(l.includes("showDevDrop")) { if(showDevLine===-1) showDevLine=i+1; }
});
console.log("ProjectsTab at:", compLine);
console.log("showDevDrop first at:", showDevLine);
console.log("Is inside component:", showDevLine>compLine?"YES":"NO - WRONG");