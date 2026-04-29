const fs = require("fs");
const content = fs.readFileSync("dist/assets/index-NK1Xm9L9.js","utf8");

// Check if new LC code is there (minified)
const searches = [
  "Handover Pipeline by Quarter",
  "LIFECYCLE_COLOR",
  "allProjects",
  "drawerTab",
  "1,515 active",
];
searches.forEach(s=>{
  const idx = content.indexOf(s);
  console.log(s.padEnd(35), idx>-1?"FOUND":"NOT FOUND");
});