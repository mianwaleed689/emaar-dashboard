const fs = require("fs");
const distFiles = fs.readdirSync("dist/assets").filter(f=>f.endsWith(".js"));
console.log("All JS files in dist:");
distFiles.forEach(f=>{
  const size = fs.statSync("dist/assets/"+f).size;
  const content = fs.readFileSync("dist/assets/"+f,"utf8");
  const hasLC = content.includes("LaunchCalendar")||content.includes("Launch Calendar");
  const hasNew = content.includes("Session 16 World Class");
  const hasOld = content.includes("DXB Daily")||content.includes("NEXT LAUNCH");
  console.log(f.padEnd(40), Math.round(size/1024)+"KB", 
    hasLC?"HAS_LC":"", hasNew?"NEW":"", hasOld?"OLD":"");
});