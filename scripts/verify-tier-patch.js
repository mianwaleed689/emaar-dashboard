const fs = require("fs");
const c = fs.readFileSync("src/tabs/ProjectsTab.jsx", "utf8");
console.log("commOptionsByTier defined: " + c.includes("commOptionsByTier ="));
console.log("optgroup in JSX: " + c.includes("<optgroup"));
console.log("Consumer Communities label: " + c.includes("Consumer Communities"));

// Count occurrences of each
const optgroupCount = (c.match(/<optgroup/g) || []).length;
console.log("Total <optgroup> tags: " + optgroupCount);

// Check old flat dropdown is gone
const oldFlatPattern = "{(commOptions || [\"All\"]).map(c =>";
console.log("Old flat dropdown still present: " + c.includes(oldFlatPattern));