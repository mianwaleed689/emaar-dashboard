const fs = require("fs");
const c = fs.readFileSync("src/tabs/ProjectsTab.jsx", "utf8");
console.log("commOptionsByTier present: " + c.includes("commOptionsByTier"));
console.log("optgroup present: " + c.includes("optgroup"));
const oldPattern = "{(commOptions || [" + String.fromCharCode(34) + "All" + String.fromCharCode(34) + "]).map(c =>";
console.log("old dropdown still there: " + c.includes(oldPattern));