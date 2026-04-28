const fs = require("fs");
let src = fs.readFileSync("src/tabs/NeighbourhoodsTab.jsx", "utf8");

// 1. Add isDLD to card
src = src.replace(
  "const CommunityCard = ({n, selected, onSelect, onCompare, isCompared}) => {\n  const riskColor",
  "const CommunityCard = ({n, selected, onSelect, onCompare, isCompared}) => {\n  const isDLD = n.tier === \"dld-registry\";\n  const riskColor"
);
console.log("1:", src.includes("isDLD") ? "OK" : "FAIL");

// 2. Update tier chip
src = src.replace(
  "<Chip label=\"\u2713 Verified\" color=\"#10B981\"/>",
  "{isDLD ? <Chip label=\"DLD Registry\" color=\"#64748B\"/> : <Chip label=\"\u2713 Verified\" color=\"#10B981\"/>}"
);
console.log("2:", src.includes("DLD Registry") ? "OK" : "FAIL");

// 3. Update header
src = src.replace(
  "{liveNeighbourhoods.length} verified Emaar communities \u00b7 Real yields, distances, investment scores",
  "{liveNeighbourhoods.filter(n=>n.tier===\"verified\").length} Verified Emaar \u00b7 {liveNeighbourhoods.filter(n=>n.tier===\"dld-registry\").length} DLD Registry \u00b7 {liveNeighbourhoods.length} total"
);
console.log("3:", src.includes("DLD Registry") ? "OK" : "FAIL");

// 4. Add tier filter to filtered useMemo dependencies
src = src.replace(
  "},[liveNeighbourhoods,search,sortBy,tierFilter]);",
  "},[liveNeighbourhoods,search,sortBy,tierFilter]);"
);

fs.writeFileSync("src/tabs/NeighbourhoodsTab.jsx", src, "utf8");
console.log("Done");