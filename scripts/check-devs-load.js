const fs = require("fs");
const dash = fs.readFileSync("src/pages/EmaarDashboardV2.jsx","latin1");
const lines = dash.split("\n");

// Show lines around 3520-3530
lines.slice(3515,3535).forEach((l,i)=>console.log(3516+i, l.replace(/[^\x20-\x7E]/g,"").substring(0,100)));