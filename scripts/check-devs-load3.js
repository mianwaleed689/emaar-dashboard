const fs = require("fs");
const dash = fs.readFileSync("src/pages/EmaarDashboardV2.jsx","latin1");
const lines = dash.split("\n");
lines.slice(3455,3496).forEach((l,i)=>console.log(3456+i, l.replace(/[^\x20-\x7E]/g,"").substring(0,100)));