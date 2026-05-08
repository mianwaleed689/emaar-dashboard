var fs=require("fs");
var c=fs.readFileSync("src/admin/DataManagerV2/CommunitiesSection.jsx","utf8");
var o="    aliases: [],\n    cadastralCode: \"\",";
var n="    cadastralCode: \"\",";
if(!c.includes(o)){console.log("ERROR: not found");process.exit(1);}
fs.writeFileSync("src/admin/DataManagerV2/CommunitiesSection.jsx",c.replace(o,n),"utf8");
console.log("Done - duplicate aliases key removed");