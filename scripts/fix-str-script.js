const fs = require("fs");

// Read the script and fix the template literal issue
let content = fs.readFileSync("scripts/create-str-ltr-tab.js", "utf8");

// Fix the problematic line by replacing template literals with string concat
content = content.replace(
  "STR estimates based on ${propSize}sqft property at ${occupancy}% occupancy. STR premium for ${selected.community}: ${((selected.premium-1)*100).toFixed(0)}% above LTR rates.",
  `"+propSize+"sqft property at "+occupancy+"% occupancy. STR premium for "+selected.community+": "+((selected.premium-1)*100).toFixed(0)+"% above LTR rates.`
);

fs.writeFileSync("scripts/create-str-ltr-tab.js", content, "utf8");
console.log("Fixed");