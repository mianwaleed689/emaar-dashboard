const fs = require("fs");
const p = "src/tabs/NeighbourhoodsTab.jsx";
let s = fs.readFileSync(p, "latin1");
s = s.replace(/import SEED_DATA from ["']\.\.\/utils\/seedData["'];\r?\n/, "");
fs.writeFileSync(p, s, "latin1");
const lines = s.split("\n");
lines.forEach((l, i) => { if (l.includes("SEED_DATA")) console.log(i + 1, l.trim()); });
console.log("Done - SEED_DATA lines shown above (none = clean)");