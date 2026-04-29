const fs = require("fs");
let dash = fs.readFileSync("src/pages/EmaarDashboardV2.jsx","latin1");

// Add liveNeighbourhoods prop to ProjectsTab
dash = dash.replace(
  `              showMoreFilters={showMoreFilters} setShowMoreFilters={setShowMoreFilters}
            />
          )}


          {/*  MAP TAB  */}`,
  `              showMoreFilters={showMoreFilters} setShowMoreFilters={setShowMoreFilters}
              liveNeighbourhoods={liveNeighbourhoods}
            />
          )}


          {/*  MAP TAB  */}`
);

fs.writeFileSync("src/pages/EmaarDashboardV2.jsx", dash, "latin1");
console.log("Added liveNeighbourhoods to ProjectsTab");
console.log("Verify:", dash.includes("setShowMoreFilters={setShowMoreFilters}\n              liveNeighbourhoods={liveNeighbourhoods}"));