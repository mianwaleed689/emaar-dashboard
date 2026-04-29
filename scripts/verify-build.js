const fs = require("fs");
const distFiles = fs.readdirSync("dist/assets").filter(f=>f.endsWith(".js")&&!f.includes("vendor"));
distFiles.forEach(f=>{
  const content = fs.readFileSync("dist/assets/"+f,"utf8");
  const hasNew = content.includes("Session 16 World Class");
  const hasOld = content.includes("DXB Daily")||content.includes("NEXT LAUNCH");
  if(hasNew||hasOld) console.log(f,"| new:",hasNew,"| old:",hasOld);
});