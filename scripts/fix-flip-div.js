const fs = require("fs");
let src = fs.readFileSync("src/tabs/FlipTab.jsx","utf8");
const lines = src.split("\n");

// Remove the extra </div> at line 179 (index 178)
lines.splice(178, 1);

src = lines.join("\n");
fs.writeFileSync("src/tabs/FlipTab.jsx", src, "utf8");
console.log("Removed extra div. Lines now:", lines.length);
console.log("Lines 174-183:");
lines.slice(173,183).forEach((l,i)=>console.log(174+i, l.substring(0,100)));