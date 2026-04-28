const fs = require("fs");
const content = fs.readFileSync("src/admin/AdminPanel.jsx", "latin1");
const lines = content.split("\n");
lines.slice(13060, 13120).forEach((l, i) => console.log(13061+i, l.trim().substring(0,100)));