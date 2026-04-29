const fs = require("fs");
let src = fs.readFileSync("src/tabs/ProjectsTab.jsx","latin1");

// Find where developer select is rendered
const lines = src.split("\n");
lines.forEach((l,i)=>{
  if(l.includes("projDev")&&l.includes("select")) {
    console.log(i+1, l.replace(/[^\x20-\x7E]/g,"").substring(0,100));
  }
});