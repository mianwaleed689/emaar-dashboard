const fs = require("fs");
let src = fs.readFileSync("src/tabs/ProjectsTab.jsx","latin1");
const lines = src.split("\n");

// Fix line 544 - complete the truncated line
lines[543] = `              : ["All", ...new Set(rawProjects.filter(p => projMode === "All" || normalizeType(p)===projMode).map(p=>p.developer||"").filter(Boolean))];`;

// Remove line 548 (stray )]; ) - it's now at index 547
lines.splice(547, 1);

src = lines.join("\n");
fs.writeFileSync("src/tabs/ProjectsTab.jsx", src, "latin1");
console.log("Fixed. Lines:", lines.length);
console.log("Lines 542-550:");
lines.slice(541,550).forEach((l,i)=>console.log(542+i, l.replace(/[^\x20-\x7E]/g,"").substring(0,120)));