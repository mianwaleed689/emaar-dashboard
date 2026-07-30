/**
 * Offline test for the developer-brand aggregation.
 *
 * Runs against synthetic records — no Firestore, no credentials, no quota.
 * Purpose: prove the cron reproduces the browser's grouping before it is ever
 * pointed at live data.
 *
 *   node scripts/test-developer-brands.js
 */
const {
  groupByParentBrand,
  normaliseTier,
  isSelectable,
} = require("../api/_cron/cron-developer-brands.js");

let failures = 0;
function check(label, actual, expected) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a === e) {
    console.log(`  PASS  ${label}`);
  } else {
    failures++;
    console.log(`  FAIL  ${label}\n          expected: ${e}\n          actual:   ${a}`);
  }
}

const pub = { visibility: "published", verified: true };

const records = [
  // Three DAMAC SPVs that must fold into one brand, summing projects.
  { id: "d1", data: { ...pub, name: "DAMAC Crescent LLC", parentBrand: "DAMAC Properties", totalProjects: 4, tier: "tier-1", communities: ["DAMAC Hills"] } },
  { id: "d2", data: { ...pub, name: "DAMAC Lagoons LLC",  parentBrand: "DAMAC Properties", totalProjects: 6, communities: ["DAMAC Lagoons", "DAMAC Hills"], ceo: "Hussain Sajwani" } },
  { id: "d3", data: { ...pub, name: "DAMAC Riverside LLC", parentBrand: "DAMAC Properties", totalProjects: 2, reliability: 88 } },

  // A tier-1 with more projects than DAMAC — must sort first on project count.
  { id: "e1", data: { ...pub, name: "Emaar Properties", totalProjects: 40, tier: "tier-1", communities: ["Dubai Hills Estate"] } },

  // tier-2 must sort below every tier-1 regardless of project count.
  { id: "s1", data: { ...pub, name: "Sobha Realty", totalProjects: 99, tier: "tier-2" } },

  // Untiered must sort last.
  { id: "x1", data: { ...pub, name: "Zed Developments", totalProjects: 1 } },

  // Excluded: unpublished.
  { id: "n1", data: { visibility: "draft", verified: true, name: "Hidden Co", totalProjects: 5 } },
  // Excluded: unverified.
  { id: "n2", data: { visibility: "published", verified: false, name: "Unverified Co", totalProjects: 5 } },
  // Excluded: no usable name.
  { id: "n3", data: { ...pub, totalProjects: 5 } },
];

const out = groupByParentBrand(records);

console.log("\nDeveloper brand aggregation\n");

/* 9 input records: 3 excluded, and the 3 DAMAC SPVs fold into 1 brand,
   leaving DAMAC + Emaar + Sobha + Zed = 4. */
check("excludes draft / unverified / nameless, folds SPVs", out.length, 4);

check(
  "sort order: tier-1 by projects, then tier-2, then untiered",
  out.map(b => b.name),
  ["Emaar Properties", "DAMAC Properties", "Sobha Realty", "Zed Developments"]
);

const damac = out.find(b => b.name === "DAMAC Properties");
check("three DAMAC SPVs fold into one brand", damac?._entityCount, 3);
check("project counts sum across SPVs (4+6+2)", damac?.totalProjects, 12);
check("brand id is slugified from parentBrand", damac?.id, "damac-properties");
check("child names retained for filter matching", damac?._childNames, [
  "damac crescent llc", "damac lagoons llc", "damac riverside llc",
]);
check("communities merged without duplicates", damac?.communities, ["DAMAC Hills", "DAMAC Lagoons"]);
check("first non-empty descriptive field wins (ceo from 2nd SPV)", damac?.ceo, "Hussain Sajwani");
check("tier inherited from whichever SPV carries it", damac?.tier, "tier-1");
check("highest reliability across SPVs wins", damac?.reliability, 88);

const emaar = out.find(b => b.name === "Emaar Properties");
check("brand without parentBrand keeps its document id", emaar?.id, "e1");

/* ── TIER NORMALISATION ────────────────────────────────────────────────────
 * The live data stores tiers in two formats. Measured across all 2,034 records
 * on 2026-07-30: 1,751 "unclassified", 30 "tier-3", 10 "2", 10 "tier-2", 9 "3",
 * 7 "1" — and ZERO spelled "tier-1". The dashboard only recognised the
 * hyphenated form, so 1,777 of 1,817 brands were unrankable.
 */
console.log("\nTier normalisation\n");
check('bare "1" becomes tier-1',          normaliseTier("1"), "tier-1");
check("numeric 1 becomes tier-1",         normaliseTier(1), "tier-1");
check('"tier-1" stays tier-1',            normaliseTier("tier-1"), "tier-1");
check('"Tier 2" becomes tier-2',          normaliseTier("Tier 2"), "tier-2");
check('"TIER_3" becomes tier-3',          normaliseTier("TIER_3"), "tier-3");
check('"unclassified" is absent, not a tier', normaliseTier("unclassified"), null);
check("empty string is absent",           normaliseTier(""), null);
check("null is absent",                   normaliseTier(null), null);
check("out-of-range tier is absent",      normaliseTier("9"), null);

/* The Emaar bug: eleven registry entities, one of them untiered and read first.
   "First non-empty wins" pinned the brand to "unclassified" and buried Dubai's
   largest developer at rank 41, below an 11-project competitor. */
const emaarLike = groupByParentBrand([
  { id: "a", data: { ...pub, name: "Emaar SPV One",   parentBrand: "Emaar Properties", tier: "unclassified", totalProjects: 100 } },
  { id: "b", data: { ...pub, name: "Emaar SPV Two",   parentBrand: "Emaar Properties", tier: "1",            totalProjects: 200 } },
  { id: "c", data: { ...pub, name: "Emaar SPV Three", parentBrand: "Emaar Properties", tier: "3",            totalProjects: 162 } },
]);
check("best tier across entities wins, not the first", emaarLike[0]?.tier, "tier-1");
check("projects still sum across all entities",        emaarLike[0]?.totalProjects, 462);

/* ── SELECTABILITY ─────────────────────────────────────────────────────────
 * 1,751 of 1,817 brands have zero projects — registry-only licence holders.
 * They made the dropdown 1,817 items long. They are held back, never deleted.
 */
console.log("\nDropdown selectability\n");
check("brand with projects is selectable",        isSelectable({ totalProjects: 5, tier: null }), true);
check("brand with a real tier is selectable",     isSelectable({ totalProjects: 0, tier: "tier-2" }), true);
check("registry-only brand is held back",         isSelectable({ totalProjects: 0, tier: null }), false);
check("zero projects + unclassified is held back", isSelectable({ totalProjects: 0, tier: normaliseTier("unclassified") }), false);

console.log(
  failures === 0
    ? `\nAll checks passed (${out.length} brands from ${records.length} records)\n`
    : `\n${failures} check(s) FAILED\n`
);
process.exit(failures === 0 ? 0 : 1);
