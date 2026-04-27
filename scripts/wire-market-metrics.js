const fs = require("fs");

// ── 1. CREATE useMarketMetrics hook ──────────────────────────────
const hook = `/**
 * useMarketMetrics - returns market metrics from Firestore
 * src/hooks/useMarketMetrics.js
 *
 * Reads from the "marketMetrics" collection (seeded in Session 7).
 * Categories: "market" | "marketChart" | "overviewKpi"
 *
 * Example:
 *   const { data: metrics } = useMarketMetrics("market");
 *   // -> [{ id, metric, value, change, source, ... }, ...]
 */

import { useFirestoreCollection } from "./useFirestoreCollection";

export function useMarketMetrics(category = null) {
  return useFirestoreCollection({
    name: "marketMetrics",
    cacheKey: "marketMetrics:" + (category || "all"),
    filter: (d) => category ? d.category === category : true,
    sort: (a, b) => {
      // For chart data, sort by year
      if (a.year && b.year) return String(a.year).localeCompare(String(b.year));
      return 0;
    },
  });
}

export function useMarketKpis() {
  return useMarketMetrics("market");
}

export function useMarketChart() {
  return useMarketMetrics("marketChart");
}

export function useOverviewKpis() {
  return useMarketMetrics("overviewKpi");
}

export default useMarketMetrics;
`;

fs.writeFileSync("src/hooks/useMarketMetrics.js", hook, "utf8");
console.log("Created src/hooks/useMarketMetrics.js");

// ── 2. UPDATE hooks/index.js to export the new hook ──────────────
let index = fs.readFileSync("src/hooks/index.js", "latin1");
if (!index.includes("useMarketMetrics")) {
  index = index.trimEnd() + "\nexport * from \"./useMarketMetrics\";\n";
  fs.writeFileSync("src/hooks/index.js", index, "latin1");
  console.log("Updated src/hooks/index.js");
} else {
  console.log("hooks/index.js already has useMarketMetrics");
}

// ── 3. PATCH MarketTab.jsx ────────────────────────────────────────
let market = fs.readFileSync("src/tabs/MarketTab.jsx", "latin1");

// Add import
market = market.replace(
  `import SEED_DATA from "../utils/seedData";`,
  `import { useMarketKpis, useMarketChart } from "../hooks/useMarketMetrics";`
);

// Add hooks inside function, before the stats derivation
market = market.replace(
  `            /* ── Live market stats from Firestore ── */`,
  `  const { data: firestoreKpis = [] } = useMarketKpis();\n  const { data: firestoreChart = [] } = useMarketChart();\n\n            /* ── Live market stats from Firestore ── */`
);

// Replace SEED_DATA.market fallback with Firestore
market = market.replace(
  `return live.length > 0 ? live : SEED_DATA.market;`,
  `return live.length > 0 ? live : firestoreKpis;`
);

// Replace chartData to use firestoreChart
market = market.replace(
  `const chartData = stats.filter(d => d.year && d.type === "annual")`,
  `const chartData = (firestoreChart.length > 0 ? firestoreChart : stats.filter(d => d.year && d.type === "annual"))`
);

fs.writeFileSync("src/tabs/MarketTab.jsx", market, "latin1");
console.log("Patched src/tabs/MarketTab.jsx");

// ── 4. PATCH OverviewTab.jsx ─────────────────────────────────────
let overview = fs.readFileSync("src/tabs/OverviewTab.jsx", "latin1");

// Add import
overview = overview.replace(
  `import SEED_DATA from "../utils/seedData";`,
  `import { useOverviewKpis, useMarketKpis } from "../hooks/useMarketMetrics";`
);

// Add hooks inside function after the matchingCommunities block
// Find the OvKPI component definition as anchor
overview = overview.replace(
  `            const OvKPI = ({ label, value, sub, color, icon, onClick, delay }) => (`,
  `  const { data: firestoreOverviewKpis = [] } = useOverviewKpis();\n  const { data: firestoreMarketKpis = [] } = useMarketKpis();\n\n            const OvKPI = ({ label, value, sub, color, icon, onClick, delay }) => (`
);

// Replace SEED_DATA.overviewKpis fallback
overview = overview.replace(
  `return live.length > 0 ? live : SEED_DATA.overviewKpis;`,
  `return live.length > 0 ? live : firestoreOverviewKpis;`
);

// Replace SEED_DATA.communities yield fallback
overview = overview.replace(
  `SEED_DATA.communities.map(c => ({ community: c.community, tenantProfile: c.tenantProfile, gross: c.grossYield }));`,
  `[];  // Session 6: communities now from Firestore via liveYields prop`
);

// Replace SEED_DATA.dldVolumes fallback
overview = overview.replace(
  `const dldDisplayRaw = liveDLDVolumes?.length > 0 ? liveDLDVolumes : SEED_DATA.dldVolumes;`,
  `const dldDisplayRaw = liveDLDVolumes?.length > 0 ? liveDLDVolumes : [];  // Session 8: dldVolumes migration pending`
);

fs.writeFileSync("src/tabs/OverviewTab.jsx", overview, "latin1");
console.log("Patched src/tabs/OverviewTab.jsx");

// ── 5. VERIFY no more SEED_DATA in patched files ─────────────────
console.log("\nVerifying SEED_DATA removal:");
["src/tabs/MarketTab.jsx", "src/tabs/OverviewTab.jsx"].forEach(f => {
  const lines = fs.readFileSync(f, "latin1").split("\n");
  const found = lines.filter(l => l.includes("SEED_DATA"));
  if (found.length === 0) {
    console.log("  ✅", f, "— clean");
  } else {
    found.forEach((l, i) => console.log("  ⚠️ ", f, "still has:", l.trim()));
  }
});