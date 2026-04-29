const fs = require("fs");
let src = fs.readFileSync("src/pages/EmaarDashboardV2.jsx","latin1");

// Investment Score Tab
src = src.replace(
  `invScSearch={invScSearch} setInvScSearch={setInvScSearch}`,
  `invScSearch={invScSearch} setInvScSearch={setInvScSearch}
              liveNeighbourhoods={liveNeighbourhoods}
              handleTabChange={handleTabChange}`
);

// Golden Visa Tab  
src = src.replace(
  `gvView={gvView} setGvView={setGvView}`,
  `gvView={gvView} setGvView={setGvView}
              liveNeighbourhoods={liveNeighbourhoods}
              handleTabChange={handleTabChange}`
);

// Service Charges Tab
src = src.replace(
  `liveServiceCharges={liveServiceCharges}`,
  `liveServiceCharges={liveServiceCharges}
              liveNeighbourhoods={liveNeighbourhoods}
              handleTabChange={handleTabChange}`
);

// DXB Estimate Tab - find it
const avmIdx = src.indexOf("avmCommunity={avmCommunity}");
if(avmIdx>-1) {
  src = src.replace(
    `avmCommunity={avmCommunity}`,
    `avmCommunity={avmCommunity}
              liveNeighbourhoods={liveNeighbourhoods}
              handleTabChange={handleTabChange}`
  );
}

fs.writeFileSync("src/pages/EmaarDashboardV2.jsx", src, "latin1");
console.log("All 4 tabs wired");