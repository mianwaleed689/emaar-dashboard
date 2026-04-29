const fs = require("fs");
const dash = fs.readFileSync("src/pages/EmaarDashboardV2.jsx","latin1");

// Find extraProjects definition
const lines = dash.split("\n");
lines.forEach((l,i)=>{
  if(l.includes("extraProjects")||l.includes("setExtraProjects")) {
    const clean = l.replace(/[^\x20-\x7E]/g,"").trim();
    if(clean.length>5) console.log(i+1, clean.substring(0,100));
  }
});