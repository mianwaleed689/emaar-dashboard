const fs = require("fs");
let src = fs.readFileSync("src/pages/EmaarDashboardV2.jsx", "latin1");

// Clean up stray comments
src = src.replace("// neighbourhoodScores  load from collection (259 docs)\n", "");
src = src.replace("// neighbourhoodScores  direct collection listener (259 docs)\n\n", "");

fs.writeFileSync("src/pages/EmaarDashboardV2.jsx", src, "latin1");
console.log("Cleaned");