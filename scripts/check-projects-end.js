const fs = require("fs");
const dash = fs.readFileSync("src/pages/EmaarDashboardV2.jsx","latin1");
const lines = dash.split("\n");
lines.slice(4579,4600).forEach((l,i)=>
  console.log(4580+i, l.replace(/[^\x20-\x7E]/g,"").substring(0,100))
);