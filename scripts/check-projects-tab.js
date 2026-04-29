const fs = require("fs");
const src = fs.readFileSync("src/pages/EmaarDashboardV2.jsx", "latin1");
const lines = src.split("\n");

// Find Projects tab
let start = -1, end = -1;
lines.forEach((l,i) => {
  if(l.includes('tab === "Projects"') && start===-1) start = i;
});
console.log("Projects tab starts at line:", start);
lines.slice(start, start+30).forEach((l,i) => 
  console.log(start+i+1, l.replace(/[^\x20-\x7E]/g,"").substring(0,100))
);