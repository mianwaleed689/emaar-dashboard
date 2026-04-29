const fs = require("fs");
const src = fs.readFileSync("src/tabs/ProjectsTab.jsx","latin1");
const lines = src.split("\n");
lines.slice(529,555).forEach((l,i)=>console.log(530+i, l.replace(/[^\x20-\x7E]/g,"").substring(0,120)));