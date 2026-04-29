const fs = require("fs");

// Fix checker - update tab name
let checker = fs.readFileSync("scripts/check-tab-connections.js","utf8");
checker = checker.replace('"STRLTRTab"', '"STRvsLTRTab"');
fs.writeFileSync("scripts/check-tab-connections.js", checker, "utf8");

// Check what Map tab currently does
try {
  const src = fs.readFileSync("src/tabs/MapTab.jsx","utf8");
  console.log("MapTab exists:", src.split("\n").length, "lines");
} catch(e) {
  console.log("MapTab missing - need to create");
}

// Check how Map is rendered in dashboard
const dash = fs.readFileSync("src/pages/EmaarDashboardV2.jsx","latin1");
const idx = dash.indexOf('tab === "Map"');
if(idx>-1) {
  console.log("\nMap render:");
  console.log(dash.substring(idx,idx+300).replace(/[^\x20-\x7E]/g,"").substring(0,250));
}