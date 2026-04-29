const fs = require("fs");
const dash = fs.readFileSync("src/pages/EmaarDashboardV2.jsx","latin1");
const idx = dash.indexOf('tab === "Launch Calendar"');
console.log(dash.substring(idx,idx+400).replace(/[^\x20-\x7E]/g,"").substring(0,350));