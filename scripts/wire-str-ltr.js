const fs = require("fs");
let src = fs.readFileSync("src/pages/EmaarDashboardV2.jsx","latin1");

src = src.replace(
  `liveSTRData={liveSTRData}`,
  `liveSTRData={liveSTRData}
              liveNeighbourhoods={liveNeighbourhoods}
              handleTabChange={handleTabChange}`
);

fs.writeFileSync("src/pages/EmaarDashboardV2.jsx", src, "latin1");
console.log("STR vs LTR wired");