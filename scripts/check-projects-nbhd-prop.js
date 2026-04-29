const fs = require("fs");
const dash = fs.readFileSync("src/pages/EmaarDashboardV2.jsx","latin1");
const lines = dash.split("\n");

// Find ProjectsTab render and check liveNeighbourhoods prop
const idx = dash.indexOf('tab === "Projects"');
const chunk = dash.substring(idx, idx+600);
console.log("ProjectsTab props:");
console.log(chunk.replace(/[^\x20-\x7E]/g,"").substring(0,500));