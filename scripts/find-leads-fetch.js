const fs = require("fs");
const src = fs.readFileSync("src/pages/EmaarDashboardV2.jsx", "latin1");
const lines = src.split("\n");
lines.forEach((l, i) => {
  if (l.includes("leads") && (
    l.includes("onSnapshot") || l.includes("collection") ||
    l.includes("liveLeads") || l.includes("myLeads") ||
    l.includes("setLive") || l.includes("setMy") ||
    l.includes("where(") || l.includes("query(") ||
    l.includes("orgId") || l.includes("assignedTo")
  )) {
    console.log(i+1, l.trim().substring(0, 120));
  }
});