const fs = require("fs");
const path = require("path");

// Re-read the original CSV to find English name fields
const content = fs.readFileSync(path.join(__dirname,"../data/dld-projects-processed.json"),"utf8");
const projects = JSON.parse(content);

// Check description field for English content
const withDesc = projects.filter(p=>p.description&&p.description.trim()&&p.description!=="null");
console.log("With English description:", withDesc.length);

// Show sample
withDesc.slice(0,5).forEach(p=>{
  console.log("\nProject:", p.name?.substring(0,30));
  console.log("Description:", p.description?.substring(0,100));
  console.log("Community:", p.community, "| Master:", p.masterProject);
});

// Check masterProject field
const withMaster = projects.filter(p=>p.masterProject&&p.masterProject!=="null"&&p.masterProject.trim());
console.log("\nWith master project:", withMaster.length);
withMaster.slice(0,5).forEach(p=>console.log(p.masterProject?.substring(0,30).padEnd(30), "->", p.community));