const fs = require("fs");
const path = require("path");
const projects = JSON.parse(fs.readFileSync(path.join(__dirname,"../data/dld-projects-processed.json"),"utf8"));

const yearCount = {};
projects.forEach(p=>{
  if(p.handoverQuarter) {
    const year = p.handoverQuarter.split(" ")[1];
    yearCount[year]=(yearCount[year]||0)+1;
  } else {
    yearCount["No date"]=(yearCount["No date"]||0)+1;
  }
});

console.log("Handover distribution:");
Object.entries(yearCount).sort().forEach(([y,c])=>console.log(y.padEnd(10), c));