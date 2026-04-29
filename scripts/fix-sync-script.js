const fs = require("fs");
let src = fs.readFileSync("scripts/sync-communities-from-projects.js","utf8");

// Fix undefined values
src = src.replace(
  `hasVilla:    hasVilla || nbhd.hasVilla,
      hasApt:      hasApt || nbhd.hasApt,`,
  `hasVilla:    hasVilla || nbhd.hasVilla || false,
      hasApt:      hasApt || nbhd.hasApt || false,`
);

// Also fix other potential undefined values
src = src.replace(
  `if (priceMin) updates.priceMin = priceMin;
    if (priceMax) updates.priceMax = priceMax;`,
  `if (priceMin && priceMin > 0) updates.priceMin = priceMin;
    if (priceMax && priceMax > 0) updates.priceMax = priceMax;`
);

fs.writeFileSync("scripts/sync-communities-from-projects.js", src, "utf8");
console.log("Fixed sync script");