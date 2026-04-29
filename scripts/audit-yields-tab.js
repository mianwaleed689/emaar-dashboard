const fs = require("fs");
const src = fs.readFileSync("src/tabs/YieldsTab.jsx", "latin1");
const lines = src.split("\n");

// Check data sources
console.log("=== DATA SOURCES ===");
lines.forEach((l,i)=>{
  if(l.includes("liveYields")||l.includes("SEED_DATA")||l.includes("yieldData")||l.includes("communityROI")) {
    console.log(i+1, l.replace(/[^\x20-\x7E]/g,"").trim().substring(0,100));
  }
});

// Check what it renders — KPIs, charts etc
console.log("\n=== MAIN RENDERS ===");
lines.forEach((l,i)=>{
  if(l.includes("<KPI")||l.includes("<Chart")||l.includes("<Section")||l.includes("BarChart")||l.includes("grossYield")) {
    console.log(i+1, l.replace(/[^\x20-\x7E]/g,"").trim().substring(0,100));
  }
});

// Check what happens when no data
console.log("\n=== EMPTY STATE ===");
lines.forEach((l,i)=>{
  if(l.includes("SmartEmpty")||l.includes("no data")||l.includes("length===0")||l.includes("length == 0")) {
    console.log(i+1, l.replace(/[^\x20-\x7E]/g,"").trim().substring(0,100));
  }
});