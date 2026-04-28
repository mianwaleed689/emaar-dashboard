const fs = require("fs");
const src = fs.readFileSync("src/admin/PlatformLeadsTab.jsx", "latin1");
const lines = src.split("\n");
console.log("Lines:", lines.length);
// Show structure
lines.forEach((l, i) => {
  if (l.includes("function ") || l.includes("useState") || l.includes("collection") || 
      l.includes("export") || l.includes("return (")) {
    if (i < 50) console.log(i+1, l.trim().substring(0,100));
  }
});

// Also check how it is used in AdminPanel
const admin = fs.readFileSync("src/admin/AdminPanel.jsx", "latin1");
const adminLines = admin.split("\n");
console.log("\n=== AdminPanel PlatformLeads usage ===");
adminLines.forEach((l, i) => {
  if (l.includes("PlatformLead") || l.includes("Platform Lead") || l.includes("Sales Pipeline")) {
    console.log(i+1, l.trim().substring(0,120));
  }
});