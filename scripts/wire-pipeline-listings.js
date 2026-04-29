const fs = require("fs");

// Wire Pipeline
let pipe = fs.readFileSync("src/tabs/PipelineTab.jsx","latin1");
pipe = pipe.replace(
  `function PipelineTab({`,
  `function PipelineTab({ liveNeighbourhoods=[],`
);
// Add community lookup
pipe = pipe.replace(
  `const gfCommunity`,
  `const nbhdMap = React.useMemo(()=>{
    const m={};
    (liveNeighbourhoods||[]).forEach(n=>{if(n.community)m[n.community.toLowerCase()]=n;});
    return m;
  },[liveNeighbourhoods]);
  const getNbhd = c => nbhdMap[(c||"").toLowerCase()]||null;
  const gfCommunity`
);
fs.writeFileSync("src/tabs/PipelineTab.jsx", pipe, "latin1");
console.log("Pipeline done");

// Wire Listings
let list = fs.readFileSync("src/tabs/ListingsTab.jsx","latin1");
list = list.replace(
  `function ListingsTab({`,
  `function ListingsTab({ liveNeighbourhoods=[],`
);
list = list.replace(
  `const [`,
  `const nbhdMap = React.useMemo(()=>{
    const m={};
    (liveNeighbourhoods||[]).forEach(n=>{if(n.community)m[n.community.toLowerCase()]=n;});
    return m;
  },[liveNeighbourhoods]);
  const getNbhd = c => nbhdMap[(c||"").toLowerCase()]||null;
  const [`
);
fs.writeFileSync("src/tabs/ListingsTab.jsx", list, "latin1");
console.log("Listings done");

// Wire Portfolio
let port = fs.readFileSync("src/tabs/PortfolioTab.jsx","latin1");
port = port.replace(
  `function PortfolioTab({`,
  `function PortfolioTab({ liveNeighbourhoods=[],`
);
fs.writeFileSync("src/tabs/PortfolioTab.jsx", port, "latin1");
console.log("Portfolio done");

// Wire all to dashboard
let dash = fs.readFileSync("src/pages/EmaarDashboardV2.jsx","latin1");

// Pipeline
const pipeSearch = `tab === "Pipeline"`;
const pipeIdx = dash.indexOf(pipeSearch);
if(pipeIdx>-1) {
  const chunk = dash.substring(pipeIdx, pipeIdx+500);
  if(!chunk.includes("liveNeighbourhoods")) {
    // Find first prop after Pipeline tab check
    const firstProp = chunk.match(/\n\s+([a-z][a-zA-Z]+)=/)?.[1];
    if(firstProp) {
      dash = dash.replace(
        `\n              ${firstProp}=`,
        `\n              liveNeighbourhoods={liveNeighbourhoods}\n              ${firstProp}=`
      );
      console.log("Pipeline wired via prop:", firstProp);
    }
  }
}

fs.writeFileSync("src/pages/EmaarDashboardV2.jsx", dash, "latin1");
console.log("Done");