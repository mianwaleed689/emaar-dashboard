const fs = require("fs");
const content = fs.readFileSync("dist/assets/index-NK1Xm9L9.js","utf8");

// Find the old LC code context
const idx = content.indexOf("DXB Daily");
if(idx>-1) {
  console.log("Found OLD code at index:", idx);
  console.log("Context:", content.substring(idx-200,idx+200).replace(/[^\x20-\x7E]/g,"").substring(0,300));
}

// Also check source maps or any reference
const idx2 = content.indexOf("NEXT LAUNCH");
if(idx2>-1) {
  console.log("\nNEXT LAUNCH at:", idx2);
  console.log("Context:", content.substring(idx2-100,idx2+200).replace(/[^\x20-\x7E]/g,"").substring(0,200));
}