const fs = require("fs");
const lines = fs.readFileSync("src/pages/EmaarDashboardV2.jsx", "latin1").split("\n");
lines.forEach((l, i) => {
  if (l.includes("useHook") || l.includes("= use") || l.includes("hooks/use"))
    console.log(i + 1, l.trim());
});