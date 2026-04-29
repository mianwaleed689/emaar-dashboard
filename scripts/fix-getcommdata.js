const fs = require("fs");
let src = fs.readFileSync("src/tabs/ProjectsTab.jsx","latin1");

// Add communityMap and getCommunityData after the MODES constant
src = src.replace(
  `const MODES = [`,
  `// Community intelligence lookup
  const communityMap = React.useMemo(() => {
    const map = {};
    (liveNeighbourhoods||[]).forEach(n => {
      if(n.community) map[n.community.toLowerCase()] = n;
    });
    return map;
  }, [liveNeighbourhoods]);

  const getCommunityData = (project) => {
    const key = (project?.community||"").toLowerCase();
    return communityMap[key] || null;
  };

  const MODES = [`
);

fs.writeFileSync("src/tabs/ProjectsTab.jsx", src, "latin1");
console.log("Done. Has getCommunityData:", src.includes("getCommunityData = "));