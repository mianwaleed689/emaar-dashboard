const fs = require("fs");
const content = fs.readFileSync("data/dld-transactions.csv", "utf8");
const lines = content.split("\n");
console.log("Total rows:", lines.length);
console.log("\nHeaders:", lines[0]);
console.log("\nSample rows:");
lines.slice(1,5).forEach(l => console.log(l));