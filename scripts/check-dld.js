const fs = require("fs");
const lines = fs.readFileSync("src/tabs/DLDVolumesTab.jsx", "latin1").split("\n");
console.log("Lines:", lines.length);
console.log("Line 1:", lines[0]);