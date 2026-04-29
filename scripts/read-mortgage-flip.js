const fs = require("fs");
["MortgageTab","FlipTab"].forEach(tab => {
  const src = fs.readFileSync("src/tabs/"+tab+".jsx","latin1");
  const lines = src.split("\n");
  console.log("\n=== "+tab+" ("+lines.length+" lines) ===");
  lines.slice(0,20).forEach((l,i)=>console.log(i+1,l.replace(/[^\x00-\x7F]/g,"").substring(0,100)));
});