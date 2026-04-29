const fs = require("fs");
let src = fs.readFileSync("src/tabs/ProjectsTab.jsx","latin1");
const lines = src.split("\n");

// Check line 544 - is it complete?
console.log("Line 544:", lines[543].replace(/[^\x20-\x7E]/g,""));

// Fix it if truncated
if(lines[543].includes("map(p=>p.d") && !lines[543].includes("filter(Boolean))];")) {
  lines[543] = `              : ["All", ...new Set(rawProjects.filter(p => projMode === "All" || normalizeType(p)===projMode).map(p=>p.developer||"").filter(Boolean))];`;
  src = lines.join("\n");
  fs.writeFileSync("src/tabs/ProjectsTab.jsx", src, "latin1");
  console.log("Fixed line 544");
} else {
  console.log("Line 544 already complete");
}