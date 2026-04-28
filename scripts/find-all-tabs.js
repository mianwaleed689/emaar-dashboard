const fs = require("fs");
const src = fs.readFileSync("src/pages/EmaarDashboardV2.jsx", "latin1");

// Find all tab keys by looking for tab === "X" patterns
const matches = src.match(/tab === ["']([^"']+)["']/g) || [];
const tabs = [...new Set(matches.map(m => m.match(/["']([^"']+)["']/)[1]))];
tabs.sort().forEach(t => console.log(t));