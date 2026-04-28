const fs = require("fs");
let content = fs.readFileSync("src/pages/EmaarDashboardV2.jsx", "latin1");
const lines = content.split("\n");

// Find ALL useState("Overview") occurrences
let idx = 0;
let count = 0;
while (true) {
  idx = content.indexOf('useState("Overview")', idx);
  if (idx === -1) break;
  const line = content.substring(0, idx).split("\n").length;
  const context = content.substring(idx-60, idx+60);
  console.log(`\nOccurrence ${++count} at line ${line}:`);
  console.log(context.replace(/\n/g,"\\n"));
  idx++;
}