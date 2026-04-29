const fs = require("fs");
const src = fs.readFileSync("src/tabs/FlipTab.jsx","utf8");
const lines = src.split("\n");
lines.slice(170,190).forEach((l,i)=>console.log(170+i+1, l.substring(0,100)));