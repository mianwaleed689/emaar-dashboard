const fs = require("fs");
const src = fs.readFileSync("src/tabs/ProjectsTab.jsx","latin1");
const lines = src.split("\n");

// Find the component start and first few lines
let compLine = -1;
lines.forEach((l,i)=>{ if(l.includes("function ProjectsTab")) compLine=i; });
console.log("Component starts at:", compLine+1);
console.log("Lines after component start:");
lines.slice(compLine, compLine+20).forEach((l,i)=>
  console.log(compLine+i+1, l.replace(/[^\x20-\x7E]/g,"").substring(0,100))
);