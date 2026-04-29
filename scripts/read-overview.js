const fs = require("fs");
const src = fs.readFileSync("src/tabs/OverviewTab.jsx","latin1");
const lines = src.split("\n");
console.log("Lines:", lines.length);

// Find signature
lines.forEach((l,i)=>{
  if(l.includes("function OverviewTab")||l.includes("export default function")) {
    console.log(i+1, l.replace(/[^\x20-\x7E]/g,"").substring(0,120));
  }
});

// Find where KPI cards end / main content starts
lines.forEach((l,i)=>{
  if(l.includes("KPI")||l.includes("kpi")||l.includes("handleTabChange")) {
    console.log(i+1, l.replace(/[^\x20-\x7E]/g,"").trim().substring(0,100));
  }
});