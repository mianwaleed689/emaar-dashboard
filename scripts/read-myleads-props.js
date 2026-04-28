const fs = require("fs");
const src = fs.readFileSync("src/pages/EmaarDashboardV2.jsx", "latin1");
const lines = src.split("\n");
lines.forEach((l, i) => {
  if (l.includes("MyLeadsTab") || l.includes("myLeads") || l.includes("liveLeads") || l.includes("orgName") || l.includes("teamMembers")) {
    if (i > 4000) console.log(i+1, l.trim().substring(0, 120));
  }
});