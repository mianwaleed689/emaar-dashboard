const fs = require("fs");
const path = require("path");

// Read already-processed JSON
const projects = JSON.parse(fs.readFileSync(path.join(__dirname,"../data/dld-projects-processed.json"),"utf8"));
const isArabic = s => /[\u0600-\u06FF]/.test(s||"");

// Fix names — use masterProject for Arabic names
const fixed = projects.map(p => {
  let name = p.name||"";
  if(isArabic(name)) {
    const master = p.masterProject||"";
    const desc   = p.description||"";
    const num    = p.projectNumber||p.dldProjectId||"";
    const d = desc.toLowerCase();
    const type = d.includes("villa")?"Villas":d.includes("residential")||d.includes("apartment")?"Residences":d.includes("tower")?"Tower":"Project";
    name = master&&master!=="null" ? master+" - "+type+" "+num : "DLD Project "+num;
  }
  return {...p, name};
});

const arabic = fixed.filter(p=>isArabic(p.name||"")).length;
const withHandover = fixed.filter(p=>p.handoverQuarter).length;
console.log("Total:", fixed.length, "| Still Arabic:", arabic, "| With handover:", withHandover);
console.log("\nSample:");
fixed.slice(0,8).forEach(p=>console.log(
  p.name?.substring(0,35).padEnd(35),
  "| comm:", p.community?.substring(0,18).padEnd(18),
  "| handover:", (p.handoverQuarter||"--").padEnd(8),
  "| pct:", p.constructionPct+"%"
));

fs.writeFileSync(path.join(__dirname,"../data/dld-projects-processed.json"), JSON.stringify(fixed,null,2),"utf8");
console.log("\nUpdated and saved");