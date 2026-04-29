const fs = require("fs");
const path = require("path");
const projects = JSON.parse(fs.readFileSync(path.join(__dirname,"../data/dld-projects-processed.json"),"utf8"));

// Check for English names
const withArabic = projects.filter(p=>/[\u0600-\u06FF]/.test(p.name||"")).length;
const withEnglish = projects.filter(p=>!/[\u0600-\u06FF]/.test(p.name||"")&&p.name).length;

console.log("Arabic names:", withArabic);
console.log("English names:", withEnglish);

// Show some with English names
console.log("\nSample English projects:");
projects.filter(p=>!/[\u0600-\u06FF]/.test(p.name||"")&&p.name).slice(0,10).forEach(p=>
  console.log(p.name?.substring(0,35).padEnd(35), "| community:", p.community?.substring(0,20), "| handover:", p.handoverQuarter||"--")
);