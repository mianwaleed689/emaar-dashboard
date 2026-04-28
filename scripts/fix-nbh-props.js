const fs = require("fs");
let content = fs.readFileSync("src/pages/EmaarDashboardV2.jsx", "latin1");

const oldNbh = `            <NeighbourhoodsTab
              nbhSearch={nbhSearch} setNbhSearch={setNbhSearch}
              nbhTypeFilter={nbhTypeFilter} setNbhTypeFilter={setNbhTypeFilter}
              nbhYieldFilter={nbhYieldFilter} setNbhYieldFilter={setNbhYieldFilter}
              nbhRiskFilter={nbhRiskFilter} setNbhRiskFilter={setNbhRiskFilter}
              nbhSort={nbhSort} setNbhSort={setNbhSort}
              nbhView={nbhView} setNbhView={setNbhView}
              nbhCompare={nbhCompare} setNbhCompare={setNbhCompare}
              liveNeighbourhoods={liveNeighbourhoods}
              liveCommunityROI={liveCommunityROI}
              liveMarketData={liveMarketData}
              globalFilters={_gf}
              allDevelopers={allDevelopers}
              handleTabChange={handleTabChange}
              selectedNbhd={selectedNbhd} setSelectedNbhd={setSelectedNbhd}
            />`;

const newNbh = `            <NeighbourhoodsTab
              liveNeighbourhoods={liveNeighbourhoods}
              handleTabChange={handleTabChange}
              selectedNbhd={selectedNbhd} setSelectedNbhd={setSelectedNbhd}
            />`;

if (content.includes(oldNbh)) {
  content = content.replace(oldNbh, newNbh);
  console.log("NeighbourhoodsTab props updated");
} else {
  console.log("Pattern not found — trying partial match");
  const idx = content.indexOf("nbhSearch={nbhSearch}");
  if (idx > -1) console.log("Found nbhSearch at line:", content.substring(0,idx).split("\n").length);
}

fs.writeFileSync("src/pages/EmaarDashboardV2.jsx", content, "latin1");
console.log("Written");