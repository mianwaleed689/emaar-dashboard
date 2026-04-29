const fs = require("fs");
const src = fs.readFileSync("src/tabs/ProjectsTab.jsx", "latin1");
const lines = src.split("\n");

// Show component signature + first detail tab
console.log("=== SIGNATURE (219-240) ===");
lines.slice(218,240).forEach((l,i)=>console.log(218+i+1, l.replace(/[^\x20-\x7E]/g,"").substring(0,100)));

// Show detail tab nav buttons
console.log("\n=== DETAIL TAB BUTTONS ===");
lines.forEach((l,i)=>{
  if(l.includes("projDetailTab") && l.includes("key") && l.includes("label")) {
    console.log(i+1, l.replace(/[^\x20-\x7E]/g,"").trim().substring(0,120));
  }
});

// Show closing of ProjectsTab render around line 4575
console.log("\n=== DETAIL TABS ARRAY ===");
lines.forEach((l,i)=>{
  if(l.includes('"identity"')&&l.includes("label")) {
    lines.slice(i-2,i+15).forEach((ll,j)=>console.log(i+j-1, ll.replace(/[^\x20-\x7E]/g,"").substring(0,100)));
  }
});