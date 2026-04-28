const fs = require("fs");
let content = fs.readFileSync("src/pages/EmaarDashboardV2.jsx", "latin1");

// Find the tab state initialization
const oldTab = `  const [tab, setTab] = useState("Overview");`;
const newTab = `  const [tab, setTab] = useState(props.defaultTab || "Overview");`;

if (content.includes(oldTab)) {
  content = content.replace(oldTab, newTab);
  console.log("FIX 1 done — defaultTab prop wired to tab state");
} else {
  // Try alternate patterns
  const patterns = [
    `const [tab, setTab] = useState("Overview")`,
    `useState("Overview")`,
  ];
  patterns.forEach(p => {
    const idx = content.indexOf(p);
    if (idx > -1) {
      const line = content.substring(0,idx).split("\n").length;
      console.log("Found pattern at line:", line, "->", p.substring(0,60));
    }
  });
}

// Fix function signature to accept props
const oldFunc = `export default function EmaarDashboardV2() {`;
const newFunc = `export default function EmaarDashboardV2(props) {`;

if (content.includes(oldFunc)) {
  content = content.replace(oldFunc, newFunc);
  console.log("FIX 2 done — props added to function signature");
} else {
  console.log("FIX 2 — function signature not found");
  const idx = content.indexOf("function EmaarDashboardV2");
  if (idx > -1) {
    const line = content.substring(0,idx).split("\n").length;
    console.log("Found at line:", line);
    console.log("Context:", content.substring(idx, idx+80));
  }
}

fs.writeFileSync("src/pages/EmaarDashboardV2.jsx", content, "latin1");
console.log("Written");