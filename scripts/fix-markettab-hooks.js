const fs = require("fs");
const p = "src/tabs/MarketTab.jsx";
let s = fs.readFileSync(p, "latin1");

// Insert hook calls just before the stats IIFE
const anchor = `            /* \u00e2\u0080\u0094\u00e2\u0080\u0094 Live market stats from Firestore \u00e2\u0080\u0094\u00e2\u0080\u0094 */`;
const replacement = `  const { data: firestoreKpis = [] } = useMarketKpis();\n  const { data: firestoreChart = [] } = useMarketChart();\n\n            /* \u00e2\u0080\u0094\u00e2\u0080\u0094 Live market stats from Firestore \u00e2\u0080\u0094\u00e2\u0080\u0094 */`;

if (s.includes(anchor)) {
  s = s.replace(anchor, replacement);
  fs.writeFileSync(p, s, "latin1");
  console.log("Inserted hook calls.");
} else {
  // Try inserting at line 46 directly
  const lines = s.split("\n");
  lines.splice(45, 0, "  const { data: firestoreKpis = [] } = useMarketKpis();");
  lines.splice(46, 0, "  const { data: firestoreChart = [] } = useMarketChart();");
  lines.splice(47, 0, "");
  s = lines.join("\n");
  fs.writeFileSync(p, s, "latin1");
  console.log("Inserted via line splice.");
}

// Verify
const lines = s.split("\n");
lines.slice(44, 55).forEach((l, i) => console.log(45 + i, l));