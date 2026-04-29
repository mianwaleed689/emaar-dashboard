const fs = require("fs");
const src = fs.readFileSync("src/tabs/ProjectsTab.jsx", "latin1");
const lines = src.split("\n");

// Find where community is shown on project card
lines.forEach((l,i) => {
  if(l.includes("p.community") && (l.includes("fontSize") || l.includes("style"))) {
    console.log(i+1, l.replace(/[^\x20-\x7E]/g,"").trim().substring(0,120));
  }
});