const fs = require("fs");
const lines = fs.readFileSync("src/tabs/CommunityMapTab.jsx", "latin1").split("\n");
lines.slice(0, 100).forEach((l, i) => console.log(i + 1, l));