const fs = require("fs");
const src = fs.readFileSync("src/pages/EmaarDashboardV2.jsx", "latin1");
const lines = src.split("\n");

// Find ProjectsTab render and show all props
let inProjects = false;
lines.forEach((l,i) => {
  if(l.includes('tab === "Projects"')) inProjects = true;
  if(inProjects && l.includes("/>")) { inProjects = false; }
  if(inProjects) console.log(i+1, l.replace(/[^\x20-\x7E]/g,"").trim().substring(0,100));
});