const fs = require("fs");
let dash = fs.readFileSync("src/pages/EmaarDashboardV2.jsx","latin1");
const lines = dash.split("\n");

// Insert liveNeighbourhoods before line 4589 (the closing />)
// Line 4588 is index 4587, line 4589 is index 4588
console.log("Line 4588:", lines[4587].replace(/[^\x20-\x7E]/g,"").trim());
console.log("Line 4589:", lines[4588].replace(/[^\x20-\x7E]/g,"").trim());

// Insert after line 4588 (index 4587)
lines.splice(4588, 0, `              liveNeighbourhoods={liveNeighbourhoods}`);

// Verify
console.log("\nAfter insertion:");
lines.slice(4586,4592).forEach((l,i)=>
  console.log(4587+i, l.replace(/[^\x20-\x7E]/g,"").substring(0,100))
);

dash = lines.join("\n");
fs.writeFileSync("src/pages/EmaarDashboardV2.jsx", dash, "latin1");
console.log("\nDone");