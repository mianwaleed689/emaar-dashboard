const fs = require("fs");
let src = fs.readFileSync("src/tabs/NeighbourhoodsTab.jsx", "latin1");

// Fix the data assembly — use liveNeighbourhoods as primary source
const oldAssembly = `const rawNbhFirestore = liveMarketData?.filter?.(d => d.type === "community") || [];
  const tier1Raw = rawNbhFirestore.length > 0 ? rawNbhFirestore : firestoreCommunities;
  const tier2Raw = Array.isArray(liveCommunityDataFull) ? liveCommunityDataFull : [];`;

const newAssembly = `// Use neighbourhoodScores (seeded) as primary source
  const rawNbhFirestore = Array.isArray(liveNeighbourhoods) && liveNeighbourhoods.length > 0
    ? liveNeighbourhoods
    : liveMarketData?.filter?.(d => d.type === "community") || [];
  const tier1Raw = rawNbhFirestore.length > 0 ? rawNbhFirestore : firestoreCommunities;
  const tier2Raw = Array.isArray(liveCommunityDataFull) ? liveCommunityDataFull : [];`;

if (src.includes(oldAssembly)) {
  src = src.replace(oldAssembly, newAssembly);
  console.log("Data assembly fixed — liveNeighbourhoods now primary source");
} else {
  console.log("Pattern not found — searching...");
  const idx = src.indexOf("rawNbhFirestore");
  console.log("Found at line:", src.substring(0,idx).split("\n").length);
}

// Also add liveNeighbourhoods to function props if not there
if (!src.includes("liveNeighbourhoods")) {
  src = src.replace(
    "liveMarketData,",
    "liveNeighbourhoods, liveMarketData,"
  );
  console.log("liveNeighbourhoods added to props");
} else {
  console.log("liveNeighbourhoods already in props");
}

fs.writeFileSync("src/tabs/NeighbourhoodsTab.jsx", src, "latin1");
console.log("Written");