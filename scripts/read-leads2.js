const fs = require("fs");
const src = fs.readFileSync("src/tabs/MyLeadsTab.jsx", "latin1");
const lines = src.split("\n");
console.log("Total lines:", lines.length);
// Show key sections
lines.forEach((l, i) => {
  const t = l.trim();
  if (t.length > 5 && (
    t.includes("const ML_ST") || t.includes("status") && t.includes(":") && t.includes("color") ||
    t.includes("ML_SRC") || t.includes("Request") || t.includes("Channel") || 
    t.includes("Campaign") || t.includes("serviceFilter") || t.includes("Service Type") ||
    t.includes("activeStatusTab") || t.includes("Hot Case") || t.includes("No Answer") ||
    t.includes("addDoc") || t.includes("updateDoc") || t.includes("auth.currentUser")
  )) console.log(i+1, t.substring(0, 120));
});