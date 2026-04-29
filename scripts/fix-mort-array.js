const fs = require("fs");
let src = fs.readFileSync("src/tabs/MortgageTab.jsx","utf8");
const lines = src.split("\n");

// Fix line 220 — needs [{  before the first slider object
lines[219] = lines[219].replace(
  `              { label:"Property Price (AED)",`,
  `              {[{ label:"Property Price (AED)",`
);

src = lines.join("\n");
fs.writeFileSync("src/tabs/MortgageTab.jsx", src, "utf8");
console.log("Fixed. Line 219-221:");
lines.slice(218,221).forEach((l,i)=>console.log(219+i, l.substring(0,100)));