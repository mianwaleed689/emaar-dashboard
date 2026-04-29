const fs = require("fs");
const dash = fs.readFileSync("src/pages/EmaarDashboardV2.jsx","latin1");
const lines = dash.split("\n");

// Check if liveNeighbourhoods already added
const hasIt = dash.includes("liveNeighbourhoods={liveNeighbourhoods}");
console.log("Has liveNeighbourhoods:", hasIt);

// Count how many times
const matches = (dash.match(/liveNeighbourhoods=\{liveNeighbourhoods\}/g)||[]).length;
console.log("Occurrences:", matches);

// Show line 4588 area
lines.slice(4585,4595).forEach((l,i)=>
  console.log(4586+i, l.replace(/[^\x20-\x7E]/g,"").substring(0,100))
);