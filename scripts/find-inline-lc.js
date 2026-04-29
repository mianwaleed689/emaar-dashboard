const fs = require("fs");
const dash = fs.readFileSync("src/pages/EmaarDashboardV2.jsx","latin1");
const lines = dash.split("\n");

// Find inline LC code
lines.forEach((l,i)=>{
  if(l.includes("DXB Daily")||l.includes("NEXT LAUNCH")||l.includes("EOI OPEN")||l.includes("newspaper")) {
    const clean = l.replace(/[^\x20-\x7E]/g,"").trim();
    if(clean.length>5) console.log(i+1, clean.substring(0,100));
  }
});