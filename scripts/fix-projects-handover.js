const fs = require("fs");
let dash = fs.readFileSync("src/pages/EmaarDashboardV2.jsx","latin1");

// Fix Handover tab to get ALL projects (liveProjects + extraProjects)
dash = dash.replace(
  `liveNeighbourhoods={liveNeighbourhoods}
              liveHandover={liveHandover}
              liveProjects={Array.isArray(extraProjects) ? extraProjects : []}`,
  `liveNeighbourhoods={liveNeighbourhoods}
              liveHandover={liveHandover}
              liveProjects={[...(Array.isArray(liveProjects)?liveProjects:[]),...(Array.isArray(extraProjects)?extraProjects:[])]}`
);

// Also fix Launch Calendar if it has same issue
dash = dash.replace(
  `liveNeighbourhoods={liveNeighbourhoods}
              lcSearch={lcSearch}`,
  `liveNeighbourhoods={liveNeighbourhoods}
              liveProjects={[...(Array.isArray(liveProjects)?liveProjects:[]),...(Array.isArray(extraProjects)?extraProjects:[])]}
              lcSearch={lcSearch}`
);

fs.writeFileSync("src/pages/EmaarDashboardV2.jsx", dash, "latin1");
console.log("Fixed — Handover + LaunchCalendar now get all projects");