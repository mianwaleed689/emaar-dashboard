const fs = require("fs");
const src = fs.readFileSync("src/admin/AdminPanel.jsx", "latin1");
const lines = src.split("\n");
lines.slice(17174, 17195).forEach((l, i) => console.log(17175+i, l));