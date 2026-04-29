const fs = require("fs");
let src = fs.readFileSync("src/pages/EmaarDashboardV2.jsx","latin1");

// Fix duplicate handleTabChange in InvestmentScoreTab
src = src.replace(
  `liveNeighbourhoods={liveNeighbourhoods}
              handleTabChange={handleTabChange}
              invScSort={invScSort}`,
  `liveNeighbourhoods={liveNeighbourhoods}
              invScSort={invScSort}`
);

// Fix duplicate handleTabChange in GoldenVisaTab  
src = src.replace(
  `liveNeighbourhoods={liveNeighbourhoods}
              handleTabChange={handleTabChange}
              gvCategory={gvCategory}`,
  `liveNeighbourhoods={liveNeighbourhoods}
              gvCategory={gvCategory}`
);

fs.writeFileSync("src/pages/EmaarDashboardV2.jsx", src, "latin1");
console.log("Fixed duplicates");