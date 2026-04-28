const fs = require("fs");
const src = fs.readFileSync("src/pages/EmaarDashboardV2.jsx", "latin1");
const lines = src.split("\n");

console.log("=== NEIGHBOURHOODS TAB RENDER (4495-4510) ===");
lines.slice(4494, 4510).forEach((l,i) => console.log(4495+i, l.trim().replace(/[^\x20-\x7E]/g,"").substring(0,120)));

console.log("\n=== FIRESTORE QUERY (3390-3415) ===");
lines.slice(3389, 3415).forEach((l,i) => console.log(3390+i, l.trim().replace(/[^\x20-\x7E]/g,"").substring(0,120)));