const fs = require("fs");
const p = "src/tabs/CommunityMapTab.jsx";
let s = fs.readFileSync(p, "latin1");

s = s.replace(
  `coords: (c.coordinates ? [c.coordinates.lat, c.coordinates.lng] : null) || [25.1124, 55.2594],`,
  `coords: (c.coordinates?.lat && c.coordinates?.lng) ? [c.coordinates.lat, c.coordinates.lng] : [25.1124, 55.2594],`
);

fs.writeFileSync(p, s, "latin1");
console.log("Done. Verifying...");
const lines = s.split("\n");
lines.forEach((l, i) => { if (l.includes("coords:")) console.log(i + 1, l.trim()); });