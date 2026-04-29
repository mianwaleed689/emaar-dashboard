const fs = require("fs");
let src = fs.readFileSync("src/pages/EmaarDashboardV2.jsx","latin1");

// Check if STRvsLTRTab is already imported
const hasImport = src.includes("STRvsLTRTab");
console.log("Has STRvsLTRTab import:", hasImport);

// Find how STR vs LTR tab is rendered
const idx = src.indexOf('tab === "STR vs LTR"');
if(idx>-1) {
  console.log("STR render found:");
  console.log(src.substring(idx,idx+300).replace(/[^\x20-\x7E]/g,"").substring(0,250));
}