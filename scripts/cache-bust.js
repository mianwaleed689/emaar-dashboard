const fs = require("fs");

// Add version comment to force new bundle hash
let src = fs.readFileSync("src/tabs/LaunchCalendarTab.jsx","utf8");
src = src.replace(
  "/* DXB ANALYTICS - LAUNCH CALENDAR TAB - Session 16 World Class Rebuild",
  "/* DXB ANALYTICS - LAUNCH CALENDAR TAB - Session 16 World Class Rebuild v3"
);
fs.writeFileSync("src/tabs/LaunchCalendarTab.jsx", src, "utf8");

// Also touch the dashboard to force new bundle
let dash = fs.readFileSync("src/pages/EmaarDashboardV2.jsx","latin1");
// Add a comment somewhere to force rebuild
dash = dash.replace(
  "/* eslint-disable */",
  "/* eslint-disable */ /* v"+Date.now()+" */"
);
fs.writeFileSync("src/pages/EmaarDashboardV2.jsx", dash, "latin1");
console.log("Cache bust done");