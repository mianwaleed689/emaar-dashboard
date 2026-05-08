var fs=require("fs");
var c=fs.readFileSync("src/tabs/ProjectsTab.jsx","utf8");
var o="if (projSearch && !JSON.stringify(p).toLowerCase().includes(projSearch.toLowerCase())) return false;";
var n="if (projSearch) { var q=projSearch.toLowerCase(); var h=[(p.project||p.name||\"\"),(p.developerActual||p.developer||p.developerName||\"\"),(p.community||p.area||\"\"),(p.masterCommunity||\"\"),(p.type||\"\"),(p.masterProject||\"\"),(String(p.reraNo||p.projectNumber||\"\"))].join(\" \").toLowerCase(); if(!h.includes(q)) return false; }";
if(!c.includes(o)){console.log("ERROR: not found");process.exit(1);}
fs.writeFileSync("src/tabs/ProjectsTab.jsx",c.replace(o,n),"utf8");
console.log("Done - search fix applied");