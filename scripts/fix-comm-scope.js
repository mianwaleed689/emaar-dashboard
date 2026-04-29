const fs = require("fs");
let src = fs.readFileSync("src/tabs/ProjectsTab.jsx","latin1");

// Remove the misplaced communityMap and getCommunityData from top of file
src = src.replace(
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

  const MODES = [`,
  `const MODES = [`
);

// Now add it INSIDE the ProjectsTab function — after the function signature opens
// Find the right place — after the first useState inside ProjectsTab
src = src.replace(
  `function ProjectsTab({`,
  `function ProjectsTab({`
);

// Add after the component opens and first useState
const INJECT = `
  // Community intelligence lookup — MUST be inside component
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
`;

// Insert after the component signature — find a unique string right after
src = src.replace(
  `  /* Phase 2.4 Batch 2: derive which communities match the global filter state.`,
  INJECT + `  /* Phase 2.4 Batch 2: derive which communities match the global filter state.`
);

fs.writeFileSync("src/tabs/ProjectsTab.jsx", src, "latin1");

// Verify
const lines = src.split("\n");
lines.forEach((l,i)=>{
  if(l.includes("getCommunityData =")) console.log("getCommunityData defined at line:", i+1);
  if(l.includes("function ProjectsTab")) console.log("ProjectsTab at line:", i+1);
});