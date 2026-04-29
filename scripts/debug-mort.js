const fs = require("fs");
const src = fs.readFileSync("src/tabs/MortgageTab.jsx","utf8");
const lines = src.split("\n");
lines.slice(213,230).forEach((l,i)=>console.log(214+i, l.substring(0,120)));