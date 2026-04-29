const fs = require("fs");
const src = fs.readFileSync("src/tabs/CommunityMapTab.jsx","utf8");
console.log("Lines:", src.split("\n").length);
console.log("Has new layers:", src.includes("All Communities"));
console.log("Has old layers:", src.includes("Yield Layer"));
console.log("Has PPSF Heatmap:", src.includes("PPSF Heatmap"));
console.log("Has zoom 10:", src.includes("zoom:10"));
console.log("First 5 lines:");
src.split("\n").slice(0,5).forEach((l,i)=>console.log(i+1,l));