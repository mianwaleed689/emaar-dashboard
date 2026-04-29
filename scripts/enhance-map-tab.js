const fs = require("fs");
let src = fs.readFileSync("src/tabs/CommunityMapTab.jsx","latin1");

// 1. Add liveNeighbourhoods to signature
src = src.replace(
  `function CommunityMapTab({ activeProjects, liveCommunityROI, setTab, seedCommunities, globalFilters`,
  `function CommunityMapTab({ activeProjects, liveCommunityROI, setTab, seedCommunities, liveNeighbourhoods=[], globalFilters`
);

// 2. Add community lookup after existing state
src = src.replace(
  `const [mapLayer, setMapLayer] = React.useState("yield");`,
  `const [mapLayer, setMapLayer] = React.useState("yield");
  
  // Community intelligence lookup from neighbourhoodScores
  const nbhdMap = React.useMemo(() => {
    const map = {};
    (liveNeighbourhoods||[]).forEach(n => {
      if(n.community) map[n.community.toLowerCase()] = n;
    });
    return map;
  }, [liveNeighbourhoods]);
  
  const getNbhd = (communityName) => nbhdMap[(communityName||"").toLowerCase()] || null;`
);

// 3. Enhance the popup content for project markers to include community data
src = src.replace(
  `const roi = (liveCommunityROI && liveCommunityROI[project.community]) || {};`,
  `const roi = (liveCommunityROI && liveCommunityROI[project.community]) || {};
      const nbhd = getNbhd(project.community);`
);

fs.writeFileSync("src/tabs/CommunityMapTab.jsx", src, "latin1");
console.log("Map tab enhanced. Non-ASCII:", (src.match(/[^\x00-\x7F]/g)||[]).length);

// Wire to dashboard
let dash = fs.readFileSync("src/pages/EmaarDashboardV2.jsx","latin1");
dash = dash.replace(
  `seedCommunities={`,
  `liveNeighbourhoods={liveNeighbourhoods}
              seedCommunities={`
);
fs.writeFileSync("src/pages/EmaarDashboardV2.jsx", dash, "latin1");
console.log("Map tab wired to dashboard");