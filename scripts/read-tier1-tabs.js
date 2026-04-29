const fs = require("fs");
["InvestmentScoreTab","GoldenVisaTab","ServiceChargesTab","DXBEstimateTab"].forEach(tab => {
  const src = fs.readFileSync("src/tabs/"+tab+".jsx","latin1");
  const lines = src.split("\n");
  console.log("\n=== "+tab+" ("+lines.length+" lines) ===");
  lines.slice(0,15).forEach((l,i)=>console.log(i+1, l.replace(/[^\x20-\x7E]/g,"").substring(0,100)));
});