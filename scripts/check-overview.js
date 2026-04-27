const fs = require("fs");
const path = "src/tabs/OverviewTab.jsx";
const content = fs.readFileSync("src/tabs/OverviewTab.jsx", "utf8");
console.log("Current lines:", content.split("\n").length);
console.log("First line:", content.split("\n")[0]);