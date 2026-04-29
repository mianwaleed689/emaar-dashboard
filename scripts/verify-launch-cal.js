const fs = require("fs");
const src = fs.readFileSync("src/tabs/LaunchCalendarTab.jsx","utf8");
console.log("Lines:", src.split("\n").length);
console.log("Has new design:", src.includes("Session 16 World Class"));
console.log("Has old newspaper:", src.includes("newspaper"));
console.log("Has drawer tabs:", src.includes("DRAWER_TABS"));
console.log("Has lifecycle color:", src.includes("LIFECYCLE_COLOR"));
console.log("First 5 lines:");
src.split("\n").slice(0,5).forEach((l,i)=>console.log(i+1,l));