var fs=require("fs");
var c=fs.readFileSync("src/pages/EmaarDashboardV2.jsx","utf8");
var o="activeProjects={extraProjects?.length > 0 ? extraProjects : []}";
var n="activeProjects={[...(Array.isArray(liveProjects)?liveProjects:[]),...(Array.isArray(extraProjects)?extraProjects:[]),...(Array.isArray(developmentsData)?developmentsData:[])]}";
if(!c.includes(o)){console.log("ERROR: not found");process.exit(1);}
fs.writeFileSync("src/pages/EmaarDashboardV2.jsx",c.replace(o,n),"utf8");
console.log("Done - map now receives full merged project list");