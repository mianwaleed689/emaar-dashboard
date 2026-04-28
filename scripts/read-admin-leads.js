const fs = require("fs");

// Find the leads section in admin panel
const adminFiles = fs.readdirSync("src/admin", { recursive: true });
console.log("Admin files:", adminFiles.filter(f => f.includes("Lead") || f.includes("lead")).join("\n"));

// Check DataManagerV2 sections
const dm = fs.readFileSync("src/admin/DataManagerV2.jsx", "latin1");
const dmLines = dm.split("\n");
console.log("\nDataManagerV2 lines:", dmLines.length);
dmLines.forEach((l, i) => {
  if (l.includes("lead") || l.includes("Lead") || l.includes("agent") || l.includes("Agent") || l.includes("assign")) {
    console.log(i+1, l.trim().substring(0, 120));
  }
});