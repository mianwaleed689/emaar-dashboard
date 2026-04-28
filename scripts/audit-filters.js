const fs = require("fs");
["DLDVolumesTab", "MarketTab", "OverviewTab"].forEach(tab => {
  const src = fs.readFileSync(`src/tabs/${tab}.jsx`, "latin1");
  const lines = src.split("\n");
  console.log(`\n=== ${tab} (${lines.length} lines) ===`);
  lines.forEach((l, i) => {
    const t = l.trim();
    if (t.length > 5 && !t.startsWith("//") && !t.startsWith("*") && (
      t.includes("useState") || t.includes("<select") || t.includes("<input") ||
      t.includes("filter") && t.includes("=>") || t.includes("sortBy") ||
      t.includes("setFilter") || t.includes("setSort") || t.includes("setSearch")
    )) console.log(i+1, t.substring(0,120));
  });
});