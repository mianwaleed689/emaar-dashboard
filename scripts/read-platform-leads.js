const fs = require("fs");

// Read PlatformLeadsTab
const admin = fs.readFileSync("src/admin/PlatformLeadsTab.jsx", "latin1");
const adminLines = admin.split("\n");
console.log("=== PlatformLeadsTab.jsx ===");
console.log("Lines:", adminLines.length);
adminLines.slice(0, 100).forEach((l, i) => console.log(i+1, l));