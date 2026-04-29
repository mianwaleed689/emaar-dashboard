const fs = require("fs");
const src = fs.readFileSync("src/tabs/FlipTab.jsx","utf8");
const lines = src.split("\n");
lines.slice(174,190).forEach((l,i)=>console.log(175+i, l.substring(0,120)));