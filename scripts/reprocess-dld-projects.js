const fs = require("fs");
const path = require("path");
const content = fs.readFileSync("/mnt/user-data/uploads/Real_Estate_Projects_2026-04-29.csv","utf8");

// Re-process with better name handling
const lines = content.split("\n").filter(l=>l.trim());
const parse = line => {
  const cols=[]; let cur="",inQ=false;
  for(const c of line){if(c==="\"")inQ=!inQ;else if(c===","&&!inQ){cols.push(cur);cur="";}else cur+=c;}
  cols.push(cur); return cols;
};

const isArabic = s => /[\u0600-\u06FF]/.test(s||"");
const cleanName = (arabicName, desc, master, projectNum) => {
  // If description gives building details, use master + project number
  if(isArabic(arabicName)) {
    if(master && master!=="null" && master.trim()) {
      // Extract building type from description
      const d = (desc||"").toLowerCase();
      const type = d.includes("villa")?"Villas":d.includes("apartment")||d.includes("residential")?"Residences":d.includes("tower")?"Tower":"Project";
      return master.trim()+" - "+type+" "+projectNum;
    }
    return "Project "+projectNum;
  }
  return arabicName;
};

const projects = [];
for(let i=1;i<lines.length;i++){
  const c = parse(lines[i]);
  const status = c[1]||"";
  if(status!=="ACTIVE"&&status!=="NOT_STARTED"&&status!=="PENDING"&&status!=="CONDITIONAL_ACTIVATING") continue;

  const pct     = parseInt(c[26])||0;
  const units   = parseInt(c[19])||0;
  const villas  = parseInt(c[20])||0;
  const rawName = c[7]||"";
  const desc    = c[31]||"";
  const master  = c[18]||"";
  const projNum = c[30]||c[11]||"";

  let lifecycle = "Off-Plan";
  if(pct>=100) lifecycle="Completed";
  else if(pct>=50) lifecycle="Under Construction";
  else if(pct>0) lifecycle="Early Construction";
  else lifecycle="Announced";

  // Get best English name
  const name = isArabic(rawName) ? cleanName(rawName,desc,master,projNum) : rawName;

  let handoverQuarter = null;
  const hdDate = c[8]||c[34]||"";
  if(hdDate&&hdDate!=="null") {
    try {
      const d = new Date(hdDate);
      if(!isNaN(d.getTime())&&d.getFullYear()>=2024) {
        handoverQuarter = "Q"+Math.ceil((d.getMonth()+1)/3)+" "+d.getFullYear();
      }
    }catch(e){}
  }

  let launchDate = c[15]||"";
  if(launchDate==="null") launchDate="";

  projects.push({
    dldProjectId:   c[11]||"",
    projectNumber:  projNum,
    name,
    rawNameArabic:  isArabic(rawName)?rawName:"",
    developer:      c[32]||c[2]||"",
    developerNumber:c[13]||"",
    community:      c[22]||"",
    masterProject:  master==="null"?"":master,
    status:         status==="ACTIVE"?"Off-Plan":status==="NOT_STARTED"?"Announced":"Pending",
    lifecycle,
    constructionPct:pct,
    totalUnits:     units+villas,
    apartments:     units,
    villas,
    escrowBank:     c[9]==="null"?"":c[9]||"",
    launchDate,
    handoverDate:   hdDate==="null"?"":hdDate,
    handoverQuarter,
    description:    desc,
    source:         "DLD-2026",
    dldImported:    true,
    importedAt:     new Date().toISOString(),
  });
}

console.log("Total projects:", projects.length);
const arabic = projects.filter(p=>/[\u0600-\u06FF]/.test(p.name||"")).length;
const withHandover = projects.filter(p=>p.handoverQuarter).length;
console.log("Still Arabic names:", arabic);
console.log("With handover:", withHandover);
console.log("\nSample:");
projects.slice(0,8).forEach(p=>console.log(
  p.name?.substring(0,35).padEnd(35),
  "| comm:", p.community?.substring(0,18).padEnd(18),
  "| handover:", (p.handoverQuarter||"--").padEnd(8),
  "| pct:", p.constructionPct+"%"
));

fs.writeFileSync("data/dld-projects-processed.json", JSON.stringify(projects,null,2),"utf8");
console.log("\nSaved");