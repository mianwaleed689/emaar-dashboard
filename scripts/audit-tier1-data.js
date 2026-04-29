const fs = require("fs");
const dash = fs.readFileSync("src/pages/EmaarDashboardV2.jsx","latin1");

["InvestmentScoreTab","GoldenVisaTab","ServiceChargesTab","DXBEstimateTab"].forEach(tab => {
  const src = fs.readFileSync("src/tabs/"+tab+".jsx","latin1");
  
  // Find seed data
  const seedLines = src.split("\n").filter(l=>l.includes("SEED")||l.includes("hardcoded")||l.includes("community:")||l.includes("score:"));
  console.log("\n=== "+tab+" SEED DATA (first 5) ===");
  seedLines.slice(0,5).forEach(l=>console.log(" ",l.replace(/[^\x20-\x7E]/g,"").trim().substring(0,100)));
  
  // Find how dashboard calls it
  const idx = dash.indexOf('tab === "'+tab.replace("Tab","").replace(/([A-Z])/g," $1").trim()+'"');
  if(idx>-1) {
    console.log("Dashboard call found at idx:", idx);
    console.log(dash.substring(idx,idx+200).replace(/[^\x20-\x7E]/g,"").substring(0,200));
  }
});