const fs = require("fs");
const src = fs.readFileSync("src/tabs/ProjectsTab.jsx","latin1");
const lines = src.split("\n");

// Show context around showDevDrop definition
lines.slice(1040,1055).forEach((l,i)=>console.log(1041+i, l.replace(/[^\x20-\x7E]/g,"").substring(0,100)));