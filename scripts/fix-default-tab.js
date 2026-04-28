const fs = require("fs");
let content = fs.readFileSync("src/pages/EmaarDashboardV2.jsx", "latin1");
const lines = content.split("\n");

// Read context around line 2819
console.log("Context around line 2819:");
lines.slice(2815, 2825).forEach((l, i) => console.log(2816+i, l));

// Find and replace
const idx = content.indexOf(`useState("Overview")`);
if (idx > -1) {
  const before = content.substring(idx-20, idx+40);
  console.log("\nExact context:", JSON.stringify(before));
  
  // Replace just this first occurrence (tab state)
  content = content.substring(0, idx) + 
    `useState(props.defaultTab || "Overview")` + 
    content.substring(idx + `useState("Overview")`.length);
  console.log("Fixed");
}

fs.writeFileSync("src/pages/EmaarDashboardV2.jsx", content, "latin1");
console.log("Written");