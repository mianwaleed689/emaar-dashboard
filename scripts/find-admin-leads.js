const fs = require("fs");
const src = fs.readFileSync("src/admin/AdminPanel.jsx", "latin1");
const lines = src.split("\n");
lines.forEach((l, i) => {
  if (l.includes('"leads"') || l.includes('"Leads"') || l.includes("tab === \"leads\"") || l.includes("Leads tab")) {
    console.log(i+1, l.trim().substring(0,120));
  }
});