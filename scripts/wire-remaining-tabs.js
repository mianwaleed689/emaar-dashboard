const fs = require("fs");
const tabs = ["PriceHistoryTab","MarketTab","DeveloperHealthTab","IntelligenceTab","MarketingTab"];

tabs.forEach(tab => {
  try {
    let src = fs.readFileSync("src/tabs/"+tab+".jsx","latin1");
    
    // Add liveNeighbourhoods to signature
    src = src.replace(
      `function ${tab}({`,
      `function ${tab}({ liveNeighbourhoods=[],`
    );
    src = src.replace(
      `export default function ${tab}({`,
      `export default function ${tab}({ liveNeighbourhoods=[],`
    );
    
    // Add community lookup helper
    const HELPER = `
  const nbhdMap = React.useMemo(()=>{
    const m={};
    (liveNeighbourhoods||[]).forEach(n=>{if(n.community)m[n.community.toLowerCase()]=n;});
    return m;
  },[liveNeighbourhoods]);
  const getNbhd = c => nbhdMap[(c||"").toLowerCase()]||null;
`;
    
    // Insert after first useState or first const
    if(src.includes("useState(")) {
      const idx = src.indexOf("useState(");
      const lineEnd = src.indexOf("\n", idx);
      src = src.substring(0,lineEnd+1) + HELPER + src.substring(lineEnd+1);
    }
    
    fs.writeFileSync("src/tabs/"+tab+".jsx", src, "latin1");
    console.log(tab, "done. Non-ASCII:", (src.match(/[^\x00-\x7F]/g)||[]).length);
  } catch(e) {
    console.log(tab, "ERROR:", e.message);
  }
});

// Wire all to dashboard
let dash = fs.readFileSync("src/pages/EmaarDashboardV2.jsx","latin1");
const wirings = [
  { search: "tab === \"Price History\"", prop: "livePriceHistory={livePriceHistory}" },
  { search: "tab === \"Market\"",        prop: "liveMarketData={liveMarketData}" },
  { search: "tab === \"Developer Health\"", prop: "liveDevHealth={liveDevHealth}" },
  { search: "tab === \"Intelligence\"",  prop: "aiInsights={aiInsights}" },
  { search: "tab === \"Marketing\"",     prop: "allDevelopers={allDevelopers}" },
];

wirings.forEach(w => {
  const idx = dash.indexOf(w.prop);
  if(idx>-1 && !dash.substring(idx-100,idx).includes("liveNeighbourhoods")) {
    dash = dash.replace(w.prop, `liveNeighbourhoods={liveNeighbourhoods}\n              `+w.prop);
    console.log("Wired:", w.search);
  }
});

fs.writeFileSync("src/pages/EmaarDashboardV2.jsx", dash, "latin1");