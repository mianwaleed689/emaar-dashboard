const fs = require("fs");

// Check current NeighbourhoodsTab
const files = ["src/tabs/NeighbourhoodsTab.jsx", "src/tabs/NeighborhoodsTab.jsx", "src/tabs/Neighbourhoods.jsx"];
files.forEach(f => {
  try {
    const src = fs.readFileSync(f, "latin1");
    console.log("Found:", f, "—", src.split("\n").length, "lines");
    src.split("\n").slice(0,20).forEach((l,i) => console.log(i+1, l));
  } catch(e) {}
});

// Check what tab name is used in dashboard
const dash = fs.readFileSync("src/pages/EmaarDashboardV2.jsx", "latin1");
const lines = dash.split("\n");
lines.forEach((l,i) => {
  if (l.includes("Neighbour") || l.includes("Neighbor")) {
    console.log(i+1, l.trim().substring(0,120));
  }
});