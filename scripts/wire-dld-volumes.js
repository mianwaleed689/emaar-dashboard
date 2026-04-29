const fs = require("fs");
let src = fs.readFileSync("src/tabs/DLDVolumesTab.jsx","latin1");

// 1. Add liveNeighbourhoods to imports/signature
src = src.replace(
  `export default function DLDVolumesTab({`,
  `export default function DLDVolumesTab({ liveNeighbourhoods=[],`
);

// If no export default, try function declaration
src = src.replace(
  `function DLDVolumesTab({`,
  `function DLDVolumesTab({ liveNeighbourhoods=[],`
);

// 2. Replace seed data usage with real neighbourhood data
// Find where SEED_DATA is used and replace with liveNeighbourhoods
src = src.replace(
  `const rawData = liveDLDVolumes?.length > 0 ? liveDLDVolumes : SEED_DLD;`,
  `// Use real DLD data from neighbourhoodScores
  const dldFromNbhd = (liveNeighbourhoods||[])
    .filter(n => n.dldTransactions > 0)
    .map(n => ({
      community:    n.community,
      transactions: n.dldTransactions || 0,
      value:        n.dldAvgValue ? Math.round(n.dldAvgValue * n.dldTransactions / 1e9 * 10) / 10 : 0,
      avgPpsf:      n.dldPpsf || n.avgPpsf || 0,
      offPlanPct:   n.dldOffplanPct || 0,
      sector:       n.area || "Dubai",
      yoyGrowth:    n.yoyGrowth || 0,
      grossYield:   parseFloat(n.grossYield||0),
      investScore:  n.investmentScore || 0,
      liquidity:    n.liquidity || "Unknown",
    }))
    .sort((a,b) => b.transactions - a.transactions);
  const rawData = dldFromNbhd.length > 0 ? dldFromNbhd : (liveDLDVolumes?.length > 0 ? liveDLDVolumes : SEED_DLD);`
);

// Also try alternate variable name
src = src.replace(
  `const data = liveDLDVolumes?.length > 0 ? liveDLDVolumes : SEED_DLD;`,
  `const dldFromNbhd = (liveNeighbourhoods||[])
    .filter(n => n.dldTransactions > 0)
    .map(n => ({
      community:    n.community,
      transactions: n.dldTransactions || 0,
      value:        n.dldAvgValue ? Math.round(n.dldAvgValue * n.dldTransactions / 1e9 * 10) / 10 : 0,
      avgPpsf:      n.dldPpsf || n.avgPpsf || 0,
      offPlanPct:   n.dldOffplanPct || 0,
      sector:       n.area || "Dubai",
      yoyGrowth:    n.yoyGrowth || 0,
      grossYield:   parseFloat(n.grossYield||0),
      investScore:  n.investmentScore || 0,
      liquidity:    n.liquidity || "Unknown",
    }))
    .sort((a,b) => b.transactions - a.transactions);
  const data = dldFromNbhd.length > 0 ? dldFromNbhd : (liveDLDVolumes?.length > 0 ? liveDLDVolumes : SEED_DLD);`
);

fs.writeFileSync("src/tabs/DLDVolumesTab.jsx", src, "latin1");
console.log("Done. Lines:", src.split("\n").length);

// Wire to dashboard
let dash = fs.readFileSync("src/pages/EmaarDashboardV2.jsx","latin1");
if(dash.includes("liveDLDVolumes={liveDLDVolumes}") && !dash.includes("liveNeighbourhoods={liveNeighbourhoods}\n              liveDLDVolumes")) {
  dash = dash.replace(
    `liveDLDVolumes={liveDLDVolumes}`,
    `liveNeighbourhoods={liveNeighbourhoods}
              liveDLDVolumes={liveDLDVolumes}`
  );
  fs.writeFileSync("src/pages/EmaarDashboardV2.jsx", dash, "latin1");
  console.log("DLD Volumes wired to dashboard");
}