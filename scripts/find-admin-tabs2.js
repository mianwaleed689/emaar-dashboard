const fs = require("fs");
const src = fs.readFileSync("src/admin/AdminPanel.jsx", "latin1");
const lines = src.split("\n");

// Find admin tab definitions
lines.forEach((l, i) => {
  if ((l.includes("id:") || l.includes("tab:")) && l.includes("label:")) {
    const clean = l.trim().replace(/[^\x20-\x7E]/g, "");
    if (clean.length > 10) console.log(i+1, clean.substring(0,120));
  }
});

// Also find setTab calls
lines.forEach((l, i) => {
  if (l.includes("setTab(") && l.includes('"')) {
    const clean = l.trim().replace(/[^\x20-\x7E]/g, "");
    console.log(i+1, clean.substring(0,80));
  }
});