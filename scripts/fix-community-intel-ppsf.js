var fs=require("fs");
var c=fs.readFileSync("src/tabs/ProjectsTab.jsx","utf8");
var o="{label:\"Avg PPSF\",       value:fmtP(cn.avgPpsf),        color:T.gold},";
var n="{label:\"Avg PPSF\",       value:fmtP(selectedProject.communityMedianPPSF||selectedProject.ppsf||cn.avgPpsf),        color:T.gold},";
if(!c.includes(o)){console.log("ERROR: not found");process.exit(1);}
fs.writeFileSync("src/tabs/ProjectsTab.jsx",c.replace(o,n),"utf8");
console.log("Done - Community Intel PPSF now uses real DLD transaction data");