const fs = require("fs");
let src = fs.readFileSync("src/tabs/NeighbourhoodsTab.jsx", "latin1");

const old = "            const rawNbhFirestore = liveMarketData?.filter?.(d => d.type === \"community\") || [];\r\n            const tier1Raw = rawNbhFirestore.length > 0 ? rawNbhFirestore : firestoreCommunities;\r\n            const tier2Raw = Array.isArray(liveCommunityDataFull) ? liveCommunityDataFull : [];";

const neww = "            // Use neighbourhoodScores as primary source\r\n            const rawNbhFirestore = (Array.isArray(liveNeighbourhoods) && liveNeighbourhoods.length > 0)\r\n              ? liveNeighbourhoods\r\n              : liveMarketData?.filter?.(d => d.type === \"community\") || [];\r\n            const tier1Raw = rawNbhFirestore.length > 0 ? rawNbhFirestore : firestoreCommunities;\r\n            const tier2Raw = Array.isArray(liveCommunityDataFull) ? liveCommunityDataFull : [];";

if (src.includes(old)) {
  src = src.replace(old, neww);
  console.log("Fixed — liveNeighbourhoods now primary source");
} else {
  console.log("Still not matching — checking char by char...");
  const idx = src.indexOf("const rawNbhFirestore");
  console.log("Found at char:", idx);
  console.log("Exact:", JSON.stringify(src.substring(idx, idx+120)));
}

fs.writeFileSync("src/tabs/NeighbourhoodsTab.jsx", src, "latin1");
console.log("Written");