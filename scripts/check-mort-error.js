const fs = require("fs");

// Fix MortgageTab
let mort = fs.readFileSync("src/tabs/MortgageTab.jsx","utf8");
const mortLines = mort.split("\n");
console.log("MortgageTab lines 182-195:");
mortLines.slice(181,195).forEach((l,i)=>console.log(182+i, l.substring(0,100)));