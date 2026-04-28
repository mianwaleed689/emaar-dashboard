const fs = require("fs");
const src = fs.readFileSync("src/admin/AdminPanel.jsx", "latin1");
const lines = src.split("\n");

// Find all admin tabs
lines.forEach((l, i) => {
  if (l.includes('"id"') && l.includes('"label"') && l.includes('"icon"')) {
    console.log(i+1, l.trim().substring(0,120));
  }
});