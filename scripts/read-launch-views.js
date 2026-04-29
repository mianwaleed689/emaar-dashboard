const fs = require("fs");
const src = fs.readFileSync("src/tabs/LaunchCalendarTab.jsx","latin1");
const lines = src.split("\n");
console.log("Lines:", lines.length);

// Show views and key UI elements
lines.forEach((l,i)=>{
  if(l.includes("newspaper")||l.includes("calendar")||l.includes("compare")||l.includes("view")||l.includes("modal")) {
    const clean = l.replace(/[^\x20-\x7E]/g,"").trim();
    if(clean.includes('"')&&clean.length>10) console.log(i+1, clean.substring(0,100));
  }
});