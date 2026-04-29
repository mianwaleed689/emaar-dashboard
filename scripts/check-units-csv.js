const fs = require("fs");
const path = require("path");
const content = fs.readFileSync(path.join(__dirname,"../data/dld-units.csv"),"utf8");
const lines = content.split("\n").filter(l=>l.trim());
console.log("Total rows:", lines.length);
console.log("First 500 chars:", content.substring(0,500));