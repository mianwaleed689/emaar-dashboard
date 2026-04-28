const fs = require("fs");
const src = fs.readFileSync("src/pages/EmaarDashboardV2.jsx", "latin1");
const lines = src.split("\n");

// Find TeamTab usage
console.log("=== TeamTab props ===");
lines.forEach((l, i) => {
  if (l.includes("TeamTab")) console.log(i+1, l.trim().substring(0,120));
});

// Find firebase imports
console.log("\n=== Firebase imports ===");
lines.slice(0, 30).forEach((l, i) => {
  if (l.includes("firebase") || l.includes("import")) console.log(i+1, l.trim().substring(0,120));
});

// Find auth imports
const firebase = fs.readFileSync("src/firebase.js", "latin1");
console.log("\n=== src/firebase.js ===");
firebase.split("\n").forEach((l, i) => console.log(i+1, l));