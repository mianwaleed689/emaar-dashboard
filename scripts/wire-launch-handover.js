const fs = require("fs");

["LaunchCalendarTab","HandoverTab"].forEach(tab => {
  let src = fs.readFileSync("src/tabs/"+tab+".jsx","latin1");
  src = src.replace(
    `function ${tab}({`,
    `function ${tab}({ liveNeighbourhoods=[],`
  );
  const HELPER = `
  const nbhdMap = React.useMemo(()=>{
    const m={};
    (liveNeighbourhoods||[]).forEach(n=>{if(n.community)m[n.community.toLowerCase()]=n;});
    return m;
  },[liveNeighbourhoods]);
  const getNbhd = c => nbhdMap[(c||"").toLowerCase()]||null;
`;
  if(src.includes("useState(")) {
    const idx = src.indexOf("useState(");
    const lineEnd = src.indexOf("\n",idx);
    src = src.substring(0,lineEnd+1)+HELPER+src.substring(lineEnd+1);
  }
  fs.writeFileSync("src/tabs/"+tab+".jsx", src, "latin1");
  console.log(tab,"done");
});

// Wire to dashboard
let dash = fs.readFileSync("src/pages/EmaarDashboardV2.jsx","latin1");

// Launch Calendar
dash = dash.replace(
  `lcSearch={lcSearch}`,
  `liveNeighbourhoods={liveNeighbourhoods}\n              lcSearch={lcSearch}`
);

// Handover
dash = dash.replace(
  `tab === "Handover"`,
  `tab === "Handover"`
);
const hIdx = dash.indexOf('tab === "Handover"');
const hChunk = dash.substring(hIdx, hIdx+400);
const hProp = hChunk.match(/\n\s+([a-z][a-zA-Z]+)=/)?.[1];
if(hProp && !hChunk.includes("liveNeighbourhoods")) {
  dash = dash.replace(
    `\n              ${hProp}=`,
    `\n              liveNeighbourhoods={liveNeighbourhoods}\n              ${hProp}=`
  );
  console.log("Handover wired via:", hProp);
}

fs.writeFileSync("src/pages/EmaarDashboardV2.jsx", dash, "latin1");