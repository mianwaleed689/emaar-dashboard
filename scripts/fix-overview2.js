const fs = require("fs");
const p = "src/tabs/OverviewTab.jsx";
let s = fs.readFileSync(p, "latin1");

const oldStr = `                      : (SEED_DATA.communities.reduce((a,b) => a + (parseFloat(b.grossYield)||0), 0) / SEED_DATA.communities.length).toFixed(1) + "%"}`;
const newStr = `                      : "—"}  /* Session 8: live avg yield pending */`;

if (s.includes(oldStr)) {
  s = s.replace(oldStr, newStr);
  fs.writeFileSync(p, s, "latin1");
  console.log("Replaced.");
} else {
  console.log("No match - dumping line 177:");
  const lines = s.split("\n");
  console.log(JSON.stringify(lines[176]));
}

const remaining = s.split("\n").filter(l => l.includes("SEED_DATA"));
console.log(remaining.length === 0 ? "✅ Clean" : "⚠️  Still has " + remaining.length + " references");