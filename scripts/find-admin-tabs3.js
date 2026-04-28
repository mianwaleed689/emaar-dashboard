const fs = require("fs");
const src = fs.readFileSync("src/admin/AdminPanel.jsx", "latin1");

// Find the main nav tabs by looking for the sidebar nav array
const matches = src.match(/tab === ["']([^"']+)["']/g) || [];
const tabs = [...new Set(matches.map(m => m.match(/["']([^"']+)["']/)[1]))];
tabs.sort().forEach(t => console.log(t));