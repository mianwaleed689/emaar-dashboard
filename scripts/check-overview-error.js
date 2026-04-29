const fs = require("fs");
const src = fs.readFileSync("src/tabs/OverviewTab.jsx","latin1");
const lines = src.split("\n");

// Find line 162 area
lines.slice(155,170).forEach((l,i)=>console.log(155+i+1, l.replace(/[^\x20-\x7E]/g,"").substring(0,100)));