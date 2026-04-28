const fs = require("fs");
const content = fs.readFileSync("src/admin/AdminPanel.jsx", "latin1");
const lines = content.split("\n");
// Read 30 lines before the fetch to find function start
lines.slice(13030, 13075).forEach((l, i) => console.log(13031+i, l.trim().substring(0,100)));