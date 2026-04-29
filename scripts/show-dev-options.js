const fs = require("fs");
let src = fs.readFileSync("src/tabs/ProjectsTab.jsx","latin1");
const lines = src.split("\n");

// Show line 532 context
lines.slice(529,536).forEach((l,i)=>console.log(530+i, l.replace(/[^\x20-\x7E]/g,"").substring(0,120)));