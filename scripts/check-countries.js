const fs = require("fs");
const src = fs.readFileSync("src/data/countries.js", "utf8");
const matches = src.match(/{ code:"/g);
console.log("Total countries:", matches ? matches.length : 0);

// Check what major countries might be missing
const known = ["Palestine","Kosovo","Vatican","Taiwan","Western Sahara","Northern Cyprus"];
known.forEach(c => {
  console.log(c + ":", src.includes(c) ? "present" : "MISSING");
});