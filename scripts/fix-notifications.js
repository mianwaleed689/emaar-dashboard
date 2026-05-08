var fs=require("fs");
var c=fs.readFileSync("scripts/sync-notifications.js","utf8");
var o="    const ref = db.collection(\"notifications\").doc();";
var n="    const docId=[today,n.type,(n.projectName||\"global\")].join(\"_\").replace(/[^a-zA-Z0-9_-]/g,\"_\").substring(0,100); const ref=db.collection(\"notifications\").doc(docId);";
if(!c.includes(o)){console.log("ERROR: not found");process.exit(1);}
fs.writeFileSync("scripts/sync-notifications.js",c.replace(o,n),"utf8");
console.log("Done");