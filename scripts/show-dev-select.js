const fs = require("fs");
let src = fs.readFileSync("src/tabs/ProjectsTab.jsx","latin1");
const lines = src.split("\n");

// Show lines around 1037
lines.slice(1030,1060).forEach((l,i)=>console.log(1031+i, l.replace(/[^\x20-\x7E]/g,"").substring(0,100)));