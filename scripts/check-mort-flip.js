const fs = require("fs");

// Check Mortgage - what inputs does it have
const mort = fs.readFileSync("src/tabs/MortgageTab.jsx","latin1");
const mortLines = mort.split("\n");
console.log("=== MORTGAGE - Key inputs ===");
mortLines.forEach((l,i)=>{
  if(l.includes("mortPrice")||l.includes("mortProp")||l.includes("avmCommunity")||l.includes("community")) {
    console.log(i+1, l.replace(/[^\x20-\x7E]/g,"").trim().substring(0,100));
  }
});

// Check Flip - what inputs does it have  
const flip = fs.readFileSync("src/tabs/FlipTab.jsx","latin1");
const flipLines = flip.split("\n");
console.log("\n=== FLIP - Key inputs ===");
flipLines.forEach((l,i)=>{
  if(l.includes("flipBuy")||l.includes("flipSell")||l.includes("community")||l.includes("ppsf")) {
    console.log(i+1, l.replace(/[^\x20-\x7E]/g,"").trim().substring(0,100));
  }
});

// Check how dashboard calls them
const dash = fs.readFileSync("src/pages/EmaarDashboardV2.jsx","latin1");
const mortIdx = dash.indexOf("MortgageTab");
const flipIdx = dash.indexOf("FlipTab");
console.log("\n=== MORTGAGE dashboard call ===");
console.log(dash.substring(mortIdx, mortIdx+300).replace(/[^\x20-\x7E]/g,"").substring(0,250));
console.log("\n=== FLIP dashboard call ===");
console.log(dash.substring(flipIdx, flipIdx+300).replace(/[^\x20-\x7E]/g,"").substring(0,250));