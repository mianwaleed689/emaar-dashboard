const fs = require("fs");
const lines = [];
const add = (s) => lines.push(s);

// Read current file
const src = fs.readFileFileSync("src/tabs/DLDVolumesTab.jsx", "latin1").split("\n");

// Find the filter block start and end
const filterStart = src.findIndex(l => l.includes("Filters") && l.includes("{/*"));
const filterEnd = src.findIndex((l, i) => i > filterStart && l.includes("</div>") && src[i+1]?.trim().startsWith("{/*"));
console.log("Filter block:", filterStart+1, "to", filterEnd+1);
src.slice(filterStart, filterEnd+2).forEach((l,i) => console.log(filterStart+1+i, l));