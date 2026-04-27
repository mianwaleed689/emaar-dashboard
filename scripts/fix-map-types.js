const fs = require("fs");
const p = "src/tabs/CommunityMapTab.jsx";
let s = fs.readFileSync(p, "latin1");

// Parse numeric fields when building communityData from Firestore docs
s = s.replace(
  `ppsf: c.avgPpsf || 1500,`,
  `ppsf: parseFloat(c.avgPpsf) || 1500,`
);
s = s.replace(
  `volume: Math.round((c.grossYield || 6) * 1000),`,
  `volume: Math.round((parseFloat(c.grossYield) || 6) * 1000),`
);
s = s.replace(
  `yoy: c.grossYield >= 8 ? 45 : c.grossYield >= 7 ? 30 : c.grossYield >= 6 ? 20 : 12,`,
  `yoy: parseFloat(c.grossYield) >= 8 ? 45 : parseFloat(c.grossYield) >= 7 ? 30 : parseFloat(c.grossYield) >= 6 ? 20 : 12,`
);
s = s.replace(
  `radius: Math.max(600, Math.min(1800, (c.avgPpsf || 1500) / 2)),`,
  `radius: Math.max(600, Math.min(1800, (parseFloat(c.avgPpsf) || 1500) / 2)),`
);
s = s.replace(
  `grossYield: c.grossYield,`,
  `grossYield: parseFloat(c.grossYield) || 0,`
);
s = s.replace(
  `netYield: c.netYield,`,
  `netYield: parseFloat(c.netYield) || 0,`
);

fs.writeFileSync(p, s, "latin1");
console.log("Done.");