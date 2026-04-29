const fs = require("fs");
let dash = fs.readFileSync("src/pages/EmaarDashboardV2.jsx","latin1");

// Fix LaunchCalendarTab props — our new tab needs liveProjects + extraProjects separately
// It already gets merged liveProjects, just need to add handleTabChange
dash = dash.replace(
  `liveNeighbourhoods={liveNeighbourhoods}
              liveProjects={[...(Array.isArray(liveProjects)?liveProjects:[]),...(Array.isArray(extraProjects)?extraProjects:[])]}
              lcSearch={lcSearch}`,
  `liveNeighbourhoods={liveNeighbourhoods}
              liveProjects={liveProjects}
              extraProjects={extraProjects}
              handleTabChange={handleTabChange}
              lcSearch={lcSearch}`
);

fs.writeFileSync("src/pages/EmaarDashboardV2.jsx", dash, "latin1");
console.log("Done");