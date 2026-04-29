const fs = require("fs");
const src = fs.readFileSync("src/tabs/ProjectsTab.jsx","latin1");
const lines = src.split("\n");

let compLine=-1, defLine=-1;
lines.forEach((l,i)=>{
  if(l.includes("function ProjectsTab")) compLine=i+1;
  if(l.includes("getCommunityData =")&&!l.includes("//")) defLine=i+1;
});
console.log("Component starts:", compLine);
console.log("getCommunityData defined:", defLine);
console.log("Is inside:", defLine>compLine?"YES":"NO - STILL OUTSIDE");

// Show lines around definition
if(defLine>0) {
  lines.slice(defLine-5,defLine+3).forEach((l,i)=>
    console.log(defLine-4+i, l.replace(/[^\x20-\x7E]/g,"").substring(0,100))
  );
}