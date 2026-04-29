const fs = require("fs");
const src = fs.readFileSync("src/tabs/LaunchCalendarTab.jsx","latin1");
const lines = src.split("\n");

console.log("Lines:", lines.length);
console.log("\n=== DATA SOURCES ===");
lines.forEach((l,i)=>{
  if(l.includes("SEED")||l.includes("launch")||l.includes("Launch")||l.includes("liveProjects")) {
    const clean = l.replace(/[^\x20-\x7E]/g,"").trim();
    if(clean.length>5) console.log(i+1, clean.substring(0,100));
  }
});

console.log("\n=== DASHBOARD PROPS ===");
const dash = fs.readFileSync("src/pages/EmaarDashboardV2.jsx","latin1");
const idx = dash.indexOf('tab === "Launch Calendar"');
console.log(dash.substring(idx,idx+500).replace(/[^\x20-\x7E]/g,"").substring(0,400));