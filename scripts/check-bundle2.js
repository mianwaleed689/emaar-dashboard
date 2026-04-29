const fs = require("fs");
const files = fs.readdirSync("dist/assets").filter(f=>f.endsWith(".js"));
console.log("JS files:", files);

// Check the main bundle
const main = files.find(f=>f.startsWith("index"));
if(main) {
  const content = fs.readFileSync("dist/assets/"+main,"utf8");
  console.log("\nFile:", main, Math.round(content.length/1024)+"KB");
  const checks = ["Handover Pipeline","LIFECYCLE_COLOR","DXB Daily","NEXT LAUNCH","Session 16"];
  checks.forEach(s=>console.log(s.padEnd(25), content.includes(s)?"FOUND":"NOT FOUND"));
}