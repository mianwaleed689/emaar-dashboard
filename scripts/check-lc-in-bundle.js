const fs = require("fs");
const content = fs.readFileSync("dist/assets/index-NK1Xm9L9.js","utf8");

// Search for Launch Calendar specific strings
const searches = [
  "Session 16 World Class",
  "1,515 active projects",
  "LIFECYCLE_COLOR",
  "Handover Pipeline by Quarter",
  "launchDate",
];
searches.forEach(s=>{
  const idx = content.indexOf(s);
  console.log(s.padEnd(35), idx>-1?"FOUND at "+idx:"NOT FOUND");
});