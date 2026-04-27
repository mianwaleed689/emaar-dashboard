const fs = require("fs");
let s = fs.readFileSync("src/tabs/OverviewTab.jsx", "latin1");

// 1. Replace SEED_DATA.communities avg yield calculation with 0 fallback
s = s.replace(
  /: \(SEED_DATA\.communities\.reduce\([^)]+\)[^}]+\}"/,
  `: "—"  /* Session 8: live yield avg pending */"`
);

// 2. Replace SEED_DATA.launches with empty array
s = s.replace(
  `{SEED_DATA.launches.filter(l => l.status === "EOI Open" || l.status === "Upcoming").slice(0,3).map((l, i) => (`,
  `{[].map((l, i) => (  /* Session 8: launches migration pending */`
);

fs.writeFileSync("src/tabs/OverviewTab.jsx", s, "latin1");

// Verify
const lines = s.split("\n");
const found = lines.filter(l => l.includes("SEED_DATA"));
if (found.length === 0) {
  console.log("✅ OverviewTab.jsx — fully clean");
} else {
  found.forEach(l => console.log("⚠️  Still has:", l.trim()));
}