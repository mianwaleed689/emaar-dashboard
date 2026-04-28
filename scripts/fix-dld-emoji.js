const fs = require("fs");
const p = "src/tabs/DLDVolumesTab.jsx";
let src = fs.readFileSync(p, "latin1");

// Fix corrupted emoji on the view toggle button
src = src.replace(
  `{view === "table" ? "=Ê Chart" : "=Ë Table"}`,
  `{view === "table" ? "Chart View" : "Table View"}`
);

fs.writeFileSync(p, src, "latin1");
console.log("Fixed. Lines:", src.split("\n").length);