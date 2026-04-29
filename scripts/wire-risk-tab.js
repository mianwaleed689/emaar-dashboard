const fs = require("fs");
let src = fs.readFileSync("src/tabs/RiskTab.jsx","latin1");

// Add liveNeighbourhoods to signature
src = src.replace(
  `function RiskTab({ riskTabView`,
  `function RiskTab({ liveNeighbourhoods=[], riskTabView`
);

// Add community risk lookup after gfCommunity
src = src.replace(
  `React.useEffect(() => {
    if (gfCommunity && riskCommunity2 !== gfCommunity) {
      setRiskCommunity2(gfCommunity);
    }`,
  `// Real community risk data from neighbourhoodScores
  const communityRiskMap = React.useMemo(() => {
    const map = {};
    (liveNeighbourhoods||[]).forEach(n => {
      map[n.community] = {
        supplyRisk:     n.supplyRisk || "Unknown",
        investScore:    n.investmentScore || 0,
        grossYield:     parseFloat(n.grossYield||0),
        dldTransactions:n.dldTransactions || 0,
        liquidity:      n.liquidity || "Unknown",
        avgPpsf:        n.avgPpsf || 0,
        goldenVisa:     n.goldenVisa || false,
      };
    });
    return map;
  }, [liveNeighbourhoods]);

  const getRealRisk = (community) => communityRiskMap[community] || null;
  
  React.useEffect(() => {
    if (gfCommunity && riskCommunity2 !== gfCommunity) {
      setRiskCommunity2(gfCommunity);
    }`
);

// Wire community dropdown to use real communities
src = src.replace(
  `const communities = ["All", ...`,
  `const communities = liveNeighbourhoods.length>0 
    ? ["All", ...liveNeighbourhoods.filter(n=>n.supplyRisk).map(n=>n.community).sort()]
    : ["All", ...`
);

fs.writeFileSync("src/tabs/RiskTab.jsx", src, "latin1");
console.log("Done. Non-ASCII:", (src.match(/[^\x00-\x7F]/g)||[]).length);

// Wire to dashboard
let dash = fs.readFileSync("src/pages/EmaarDashboardV2.jsx","latin1");
const riskIdx = dash.indexOf("riskTabView={riskTabView}");
if(riskIdx>-1 && !dash.includes("liveNeighbourhoods={liveNeighbourhoods}\n              riskTabView")) {
  dash = dash.replace(
    `riskTabView={riskTabView}`,
    `liveNeighbourhoods={liveNeighbourhoods}
              riskTabView={riskTabView}`
  );
  fs.writeFileSync("src/pages/EmaarDashboardV2.jsx", dash, "latin1");
  console.log("Risk wired");
}