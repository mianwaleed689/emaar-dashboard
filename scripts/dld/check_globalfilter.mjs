/**
 * Self-check for src/utils/globalFilter.js — the global filter contract.
 *
 *   node scripts/dld/check_globalfilter.mjs
 *
 * Plain node, no test runner, no new dependencies. The repo's `test` script
 * points at react-scripts, which does not work in a Vite project.
 */
import { pathToFileURL } from "node:url";

const M = await import(
  pathToFileURL("C:/Users/TAD/emaar-dashboard/src/utils/globalFilter.js").href
);
const {
  applyGlobalFilters, deriveOptions, supportedKeys, ignoredKeys,
  activeSupportedKeys, normBeds, countIfSelected,
} = M;

let pass = 0, fail = 0;
const eq = (name, got, want) => {
  const g = JSON.stringify(got), w = JSON.stringify(want);
  if (g === w) { pass++; console.log(`  ok   ${name}`); }
  else { fail++; console.log(`  FAIL ${name}\n         got  ${g}\n         want ${w}`); }
};

// ── fixtures ────────────────────────────────────────────────────────────────
const PROJECTS = [
  { id: 1, developer: "Emaar Properties", community: "Dubai Hills Estate", status: "Ready",    beds: ["1 B/R", "2 B/R"], priceMin: 1500000 },
  { id: 2, developer: "Emaar Properties", community: "Downtown Dubai",     status: "Off-Plan", beds: ["2 BR"],           priceMin: 3200000 },
  { id: 3, developer: "DAMAC",            community: "DAMAC Hills",        status: "Off-Plan", beds: ["studio"],         priceMin: 800000  },
  { id: 4, developer: "Nakheel",          community: "Palm Jumeirah",      status: "Ready",    beds: [],                 /* no price */    },
];

const FULL = {
  developer: { get: p => [p.developer, p.developerName] },
  community: { get: p => p.community },
  status:    { get: p => p.status },
  beds:      { get: p => p.beds, compare: "beds" },
  price:     { get: p => p.priceMin },
};
// a tab that only understands community — e.g. Price History
const THIN = { community: { get: p => p.community } };

const ids = rs => rs.map(r => r.id);

// ── 1. the contract itself ──────────────────────────────────────────────────
console.log("\ncontract");
eq("supportedKeys(FULL)", supportedKeys(FULL),
   ["developer", "community", "beds", "status", "price"]);
eq("supportedKeys(THIN)", supportedKeys(THIN), ["community"]);
eq("a tab with no map supports nothing", supportedKeys(null), []);

// ── 2. unsupported keys must NOT drop rows ──────────────────────────────────
console.log("\nunsupported keys are ignored, never applied");
const f = { developer: "Emaar Properties", beds: "2 BR", community: "all" };
eq("FULL honours developer+beds", ids(applyGlobalFilters(PROJECTS, f, FULL)), [1, 2]);
eq("THIN cannot honour them -> all rows survive",
   ids(applyGlobalFilters(PROJECTS, f, THIN)), [1, 2, 3, 4]);
eq("THIN reports what it ignored", ignoredKeys(f, THIN), ["developer", "beds"]);
eq("FULL ignores nothing", ignoredKeys(f, FULL), []);
eq("activeSupportedKeys(THIN)", activeSupportedKeys(f, THIN), []);

// ── 3. bed vocabularies collapse ────────────────────────────────────────────
console.log("\nbed vocabulary");
eq('"2 B/R"',            normBeds("2 B/R"),            "2br");
eq('"2 BR"',             normBeds("2 BR"),             "2br");
eq('"2 bed rooms+hall"', normBeds("2 bed rooms+hall"), "2br");
eq('"Studio"',           normBeds("Studio"),           "studio");
eq("2 B/R matches 2 BR across records",
   ids(applyGlobalFilters(PROJECTS, { beds: "2 bed rooms+hall" }, FULL)), [1, 2]);

// ── 4. missing data is an explicit decision ─────────────────────────────────
console.log("\nmissing data");
eq("no price -> excluded by default",
   ids(applyGlobalFilters(PROJECTS, { priceMin: 1000000 }, FULL)), [1, 2]);
const LENIENT = { ...FULL, price: { get: p => p.priceMin, onMissing: "include" } };
eq("no price -> included when the tab says so",
   ids(applyGlobalFilters(PROJECTS, { priceMin: 1000000 }, LENIENT)), [1, 2, 4]);
eq("no beds -> excluded by default",
   ids(applyGlobalFilters(PROJECTS, { beds: "1 BR" }, FULL)), [1]);

// ── 5. price ranges ─────────────────────────────────────────────────────────
console.log("\nprice");
eq("min only",  ids(applyGlobalFilters(PROJECTS, { priceMin: 1000000 }, FULL)), [1, 2]);
eq("max only",  ids(applyGlobalFilters(PROJECTS, { priceMax: 1000000 }, FULL)), [3]);
eq("min+max",   ids(applyGlobalFilters(PROJECTS, { priceMin: 1000000, priceMax: 2000000 }, FULL)), [1]);

// ── 6. "all" and empty mean no filter ───────────────────────────────────────
console.log("\nno-op values");
eq('"all"',   ids(applyGlobalFilters(PROJECTS, { developer: "all" }, FULL)), [1, 2, 3, 4]);
eq("empty",   ids(applyGlobalFilters(PROJECTS, { developer: "" }, FULL)),    [1, 2, 3, 4]);
eq("no filters at all", ids(applyGlobalFilters(PROJECTS, {}, FULL)),         [1, 2, 3, 4]);

// ── 7. options come from the data and carry counts ──────────────────────────
console.log("\nderived options");
eq("developer options, by frequency",
   deriveOptions(PROJECTS, FULL.developer).map(o => [o.value, o.count]),
   [["emaar properties", 2], ["damac", 1], ["nakheel", 1]]);
eq("labels carry counts",
   deriveOptions(PROJECTS, FULL.developer)[0].label, "Emaar Properties (2)");
eq("no zero-count option is ever emitted",
   deriveOptions(PROJECTS, FULL.status).every(o => o.count > 0), true);
eq("a field nothing populates yields no options",
   deriveOptions(PROJECTS, { get: p => p.propertyType }), []);
eq("limit keeps the most common",
   deriveOptions(PROJECTS, FULL.developer, { limit: 1 }).map(o => o.value),
   ["emaar properties"]);

// ── 8. look-ahead counts ────────────────────────────────────────────────────
console.log("\nlook-ahead");
eq("count if DAMAC selected",
   countIfSelected(PROJECTS, {}, FULL, "developer", "DAMAC"), 1);
eq("count if DAMAC selected while Ready is active",
   countIfSelected(PROJECTS, { status: "Ready" }, FULL, "developer", "DAMAC"), 0);

// ── 9. robustness ───────────────────────────────────────────────────────────
console.log("\nrobustness");
eq("null records", applyGlobalFilters(null, { developer: "x" }, FULL), []);
eq("records containing null",
   ids(applyGlobalFilters([null, PROJECTS[0]], { developer: "Emaar Properties" }, FULL)), [1]);
eq("a throwing accessor does not crash",
   ids(applyGlobalFilters(PROJECTS, { developer: "x" },
       { developer: { get: () => { throw new Error("boom"); } } })), []);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
