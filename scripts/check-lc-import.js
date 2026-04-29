const fs = require("fs");
const dash = fs.readFileSync("src/pages/EmaarDashboardV2.jsx","latin1");

// Find import
const importLine = dash.split("\n").find(l=>l.includes("LaunchCalendarTab"));
console.log("Import:", importLine?.replace(/[^\x20-\x7E]/g,"").trim());

// Find render
const idx = dash.indexOf("LaunchCalendarTab");
console.log("\nRender area:");
console.log(dash.substring(idx-50,idx+300).replace(/[^\x20-\x7E]/g,"").substring(0,300));