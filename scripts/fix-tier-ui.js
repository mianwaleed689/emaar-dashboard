const fs = require("fs");
let src = fs.readFileSync("src/tabs/NeighbourhoodsTab.jsx", "utf8");

// Update tier filter options
src = src
  .replace(
    '<option value="verified">Verified Only</option>',
    '<option value="verified">Verified Only</option><option value="area-data">Area Data</option>'
  )
  // Update tier badge in CommunityCard
  .replace(
    'const isDLD    = n.tier==="dld-registry";',
    'const isDLD    = n.tier==="dld-registry";\n  const isArea   = n.tier==="area-data";'
  )
  // Update chip display
  .replace(
    '{isDLD ? <Chip label="DLD" color="#64748B"/> : <Chip label="v Verified" color="#10B981"/>}',
    '{n.tier==="verified" ? <Chip label="Verified" color="#10B981"/> : n.tier==="area-data" ? <Chip label="Area Data" color="#F59E0B"/> : <Chip label="DLD" color="#64748B"/>}'
  )
  // Update drawer header badge
  .replace(
    '{isDLD?<Chip label="DLD Registry" color="#64748B"/>:<Chip label="v Verified" color="#10B981"/>}',
    '{n.tier==="verified"?<Chip label="Verified" color="#10B981"/>:n.tier==="area-data"?<Chip label="Area Data" color="#F59E0B"/>:<Chip label="DLD Registry" color="#64748B"/>}'
  )
  // Update subtitle to show all 3 tiers
  .replace(
    '{verified.length} verified  {liveNeighbourhoods.filter(n=>n.tier==="dld-registry").length} DLD registry  {liveNeighbourhoods.length} total  Google Maps verified distances',
    '{liveNeighbourhoods.filter(n=>n.tier==="verified").length} verified · {liveNeighbourhoods.filter(n=>n.tier==="area-data").length} area data · {liveNeighbourhoods.filter(n=>n.tier==="dld-registry").length} DLD only · {liveNeighbourhoods.length} total'
  )
  // Update isDLD check for card metrics
  .replace(
    '{(isDLD ? [',
    '{(n.tier==="dld-registry" ? ['
  );

fs.writeFileSync("src/tabs/NeighbourhoodsTab.jsx", src, "utf8");
console.log("Done. Non-ASCII:", (src.match(/[^\x00-\x7F]/g)||[]).length);