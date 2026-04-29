const fs = require("fs");
const src = fs.readFileSync("src/tabs/MyLeadsTab.jsx","latin1");
const lines = src.split("\n");

// Find where community field is in lead form/cards
console.log("=== COMMUNITY REFERENCES ===");
lines.forEach((l,i)=>{
  if(l.includes("community")&&(l.includes("lead")||l.includes("budget")||l.includes("suggest"))) {
    console.log(i+1, l.replace(/[^\x20-\x7E]/g,"").trim().substring(0,100));
  }
});

// Find lead budget fields
console.log("\n=== BUDGET FIELDS ===");
lines.forEach((l,i)=>{
  if(l.includes("budget")||l.includes("Budget")||l.includes("price")||l.includes("Price")) {
    const clean = l.replace(/[^\x20-\x7E]/g,"").trim();
    if(clean.length>5) console.log(i+1, clean.substring(0,100));
  }
});

// Find lead object structure
console.log("\n=== LEAD FIELDS ===");
lines.forEach((l,i)=>{
  if(l.includes("lead.")||l.includes("l.community")||l.includes("l.budget")) {
    console.log(i+1, l.replace(/[^\x20-\x7E]/g,"").trim().substring(0,100));
  }
});