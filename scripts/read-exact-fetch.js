const fs = require("fs");
const content = fs.readFileSync("src/admin/AdminPanel.jsx", "latin1");
const lines = content.split("\n");
// Print exact lines 13049-13055 with JSON to see hidden chars
lines.slice(13048, 13056).forEach((l, i) => console.log(13049+i, JSON.stringify(l)));