const fs = require("fs");
const src = fs.readFileSync("src/tabs/NeighbourhoodsTab.jsx", "utf8");
const lines = src.split("\n");
console.log("Lines:", lines.length);
console.log("Has Facilities tab:", src.includes("facilities"));
console.log("Has Landmarks tab:", src.includes("landmarks"));
console.log("Has Lifestyle tab:", src.includes("lifestyle"));
console.log("Has old Location tab:", src.includes('"distances"'));
console.log("Non-ASCII count:", (src.match(/[^\x00-\x7F]/g)||[]).length);