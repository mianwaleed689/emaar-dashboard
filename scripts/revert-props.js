const fs = require("fs");
let content = fs.readFileSync("src/pages/EmaarDashboardV2.jsx", "latin1");

// Revert props — function doesn't need props param since tab reads from URL
const old = `export default function EmaarDashboardV2(props) {`;
const newf = `export default function EmaarDashboardV2() {`;

if (content.includes(old)) {
  content = content.replace(old, newf);
  console.log("Reverted props param — not needed");
} else {
  console.log("Already clean");
}

// Also revert the projDetailTab fix that accidentally replaced wrong useState
// Check if it was changed
const idx = content.indexOf("useState(props.defaultTab");
if (idx > -1) {
  content = content.replace(
    `useState(props.defaultTab || "Overview")`,
    `useState("Overview")`
  );
  console.log("Reverted accidental projDetailTab change");
}

fs.writeFileSync("src/pages/EmaarDashboardV2.jsx", content, "latin1");
console.log("Written");