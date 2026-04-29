const fs = require("fs");
let checker = fs.readFileSync("scripts/check-tab-connections.js","utf8");
checker = checker.replace('"MapTab"', '"CommunityMapTab"');
fs.writeFileSync("scripts/check-tab-connections.js", checker, "utf8");
console.log("Fixed checker");