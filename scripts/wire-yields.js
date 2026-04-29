const fs = require("fs");
let src = fs.readFileSync("src/pages/EmaarDashboardV2.jsx", "latin1");

// Add liveNeighbourhoods and handleTabChange to YieldsTab
src = src.replace(
  `liveYieldsData={liveYieldsData}`,
  `liveYieldsData={liveYieldsData}
              liveNeighbourhoods={liveNeighbourhoods}
              handleTabChange={handleTabChange}`
);

fs.writeFileSync("src/pages/EmaarDashboardV2.jsx", src, "latin1");
console.log("Done");