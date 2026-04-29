const fs = require("fs");
const src = fs.readFileSync("src/tabs/HandoverTab.jsx","latin1");
const lines = src.split("\n");

console.log("=== DATA SOURCES ===");
lines.forEach((l,i)=>{
  if(l.includes("liveHandover")||l.includes("liveProjects")||l.includes("SEED")||l.includes("handover")) {
    const clean = l.replace(/[^\x20-\x7E]/g,"").trim();
    if(clean.length>5) console.log(i+1, clean.substring(0,100));
  }
});

// Check dashboard props passed to Handover
const dash = fs.readFileSync("src/pages/EmaarDashboardV2.jsx","latin1");
const idx = dash.indexOf('tab === "Handover"');
console.log("\n=== DASHBOARD PROPS ===");
console.log(dash.substring(idx,idx+400).replace(/[^\x20-\x7E]/g,"").substring(0,350));