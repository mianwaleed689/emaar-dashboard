const fs = require("fs");
let dash = fs.readFileSync("src/pages/EmaarDashboardV2.jsx","latin1");
// Find OverviewTab render and add liveNeighbourhoods
if(!dash.includes("liveNeighbourhoods={liveNeighbourhoods}\n              liveMarketData")) {
  dash = dash.replace(
    `liveMarketData={liveMarketData}`,
    `liveNeighbourhoods={liveNeighbourhoods}
              liveMarketData={liveMarketData}`
  );
  fs.writeFileSync("src/pages/EmaarDashboardV2.jsx", dash, "latin1");
  console.log("Overview wired");
}