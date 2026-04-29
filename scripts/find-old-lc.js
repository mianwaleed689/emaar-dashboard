const fs = require("fs");
const dash = fs.readFileSync("src/pages/EmaarDashboardV2.jsx","latin1");
const hasNewspaper = dash.includes("newspaper");
const hasOldLC = dash.includes("NEXT LAUNCH")||dash.includes("EOI OPEN")||dash.includes("DXB Daily");
console.log("Dashboard has newspaper:", hasNewspaper);
console.log("Dashboard has old LC inline:", hasOldLC);
console.log("Launch Calendar tab render:");
const idx = dash.indexOf('tab === "Launch Calendar"');
console.log(dash.substring(idx,idx+600).replace(/[^\x20-\x7E]/g,"").substring(0,500));