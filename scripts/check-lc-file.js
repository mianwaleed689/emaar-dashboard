const fs = require("fs");
const src = fs.readFileSync("src/tabs/LaunchCalendarTab.jsx","utf8");
console.log("File size:", src.length, "bytes");
console.log("Lines:", src.split("\n").length);
console.log("Has new design:", src.includes("Session 16 World Class"));
console.log("Has old design:", src.includes("DXB Daily")||src.includes("NEXT LAUNCH"));
console.log("\nFirst 3 lines:");
src.split("\n").slice(0,3).forEach((l,i)=>console.log(i+1,l));