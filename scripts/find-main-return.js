const fs = require("fs");
const src = fs.readFileSync("src/pages/EmaarDashboardV2.jsx", "latin1");
const lines = src.split("\n");
// Find the main return statement
lines.forEach((l, i) => {
  if ((l.includes("if (authLoading)") || l.includes("if(authLoading)") || l.includes("authLoading)")) && l.includes("return")) {
    console.log(i+1, l.trim().substring(0,120));
  }
});
// Also find isSuspended return
lines.forEach((l, i) => {
  if (l.includes("isSuspended") && l.includes("return")) {
    console.log(i+1, l.trim().substring(0,120));
  }
});