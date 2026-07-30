/**
 * Offline data-quality audit. Reads data-audit/cache/*.json only — zero
 * Firestore reads. Run scripts/cache-collections.js first.
 *
 *   node scripts/audit-data-quality.js
 *
 * Answers, with counts rather than impressions:
 *   1. Duplicate projects by name
 *   2. Do project `stage` values match the filter options offered in the UI?
 *   3. Coordinate coverage — how many records would silently vanish from the map
 *   4. Developer `tier` field formats
 *   5. Duplicate / junk community rows
 *   6. Overlap between the competing community lists
 */
const fs = require("fs");
const path = require("path");

const DIR = path.join(__dirname, "..", "data-audit", "cache");
const load = n => {
  const f = path.join(DIR, `${n}.json`);
  if (!fs.existsSync(f)) {
    console.error(`Missing cache: ${n}.json — run: node scripts/cache-collections.js`);
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(f, "utf8")).docs;
};

const norm = s => String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const h = t => console.log(`\n${"═".repeat(74)}\n  ${t}\n${"═".repeat(74)}`);

const projects = load("projects");
const developers = load("developers");
const nbh = load("neighbourhoodScores");
const communities = load("communities");

/* ─────────────────────────────────────────────────────────────── 1. DUPES ── */
h("1. DUPLICATE PROJECTS (same name, different document)");
const byName = new Map();
projects.forEach(p => {
  const k = norm(p.name);
  if (!k) return;
  if (!byName.has(k)) byName.set(k, []);
  byName.get(k).push(p);
});
const dupes = [...byName.entries()].filter(([, v]) => v.length > 1);
console.log(`  projects:                 ${projects.length}`);
console.log(`  distinct names:           ${byName.size}`);
console.log(`  names with duplicates:    ${dupes.length}`);
console.log(`  extra documents:          ${dupes.reduce((n, [, v]) => n + v.length - 1, 0)}`);
const noName = projects.filter(p => !norm(p.name)).length;
if (noName) console.log(`  projects with NO name:    ${noName}`);
if (dupes.length) {
  console.log("\n  worst offenders:");
  dupes.sort((a, b) => b[1].length - a[1].length).slice(0, 12).forEach(([k, v]) => {
    const devs = [...new Set(v.map(p => p.developer || p.developerId || "?"))].join(", ").slice(0, 40);
    const archived = v.filter(p => p.archived === true).length;
    console.log(`    ${String(v[0].name).slice(0, 38).padEnd(40)} x${String(v.length).padStart(2)}  ` +
                `archived:${archived}  dev: ${devs}`);
  });
}

/* ────────────────────────────────────────────────────── 2. STAGE / FILTER ── */
h("2. PROJECT STAGE vs THE FILTER OPTIONS THE UI OFFERS");
/* Options offered by the Projects tab filter. */
const FILTER_OPTIONS = ["announced", "under-construction", "recently-delivered", "historical"];
const stageVals = {}, statusVals = {}, lifecycleVals = {};
projects.forEach(p => {
  const s = p.stage === undefined ? "(field absent)" : String(p.stage);
  stageVals[s] = (stageVals[s] || 0) + 1;
  const st = p.status === undefined ? "(absent)" : String(p.status);
  statusVals[st] = (statusVals[st] || 0) + 1;
  const lc = p.lifecycleStage === undefined ? "(absent)" : String(p.lifecycleStage);
  lifecycleVals[lc] = (lifecycleVals[lc] || 0) + 1;
});
const show = (label, obj) => {
  console.log(`\n  ${label}`);
  Object.entries(obj).sort((a, b) => b[1] - a[1]).slice(0, 10)
    .forEach(([k, v]) => console.log(`    ${k.slice(0, 40).padEnd(42)}${String(v).padStart(5)}`));
};
show("`stage` values:", stageVals);
show("`status` values:", statusVals);
show("`lifecycleStage` values:", lifecycleVals);
console.log("\n  filter options offered by the UI, and whether any record matches:");
FILTER_OPTIONS.forEach(opt => {
  const hits = projects.filter(p =>
    norm(p.stage) === norm(opt) || norm(p.status) === norm(opt) || norm(p.lifecycleStage) === norm(opt)
  ).length;
  console.log(`    ${opt.padEnd(24)}${hits === 0 ? "NO RECORDS MATCH  <-- dead filter option" : hits + " records"}`);
});

/* ──────────────────────────────────────────────────────── 3. COORDINATES ── */
h("3. COORDINATE COVERAGE (records that would vanish from the map)");
const coordStats = (rows, label) => {
  let flat = 0, nested = 0, both = 0, none = 0;
  rows.forEach(r => {
    const f = Number.isFinite(Number(r.lat)) && Number.isFinite(Number(r.lng));
    const n = r.coordinates && Number.isFinite(Number(r.coordinates.lat)) && Number.isFinite(Number(r.coordinates.lng));
    if (f && n) both++; else if (f) flat++; else if (n) nested++; else none++;
  });
  console.log(`\n  ${label} (${rows.length} records)`);
  console.log(`    lat/lng at top level only:      ${flat}`);
  console.log(`    coordinates.lat/lng only:       ${nested}`);
  console.log(`    both present:                   ${both}`);
  console.log(`    NO usable coordinates:          ${none}`);
  if (nested > 0) {
    console.log(`    -> ${nested} record(s) are invisible to any code reading r.lat directly`);
  }
};
coordStats(nbh, "neighbourhoodScores");
coordStats(communities, "communities");
coordStats(projects, "projects");

/* ────────────────────────────────────────────────────────────── 4. TIERS ── */
h("4. DEVELOPER `tier` FIELD FORMATS");
const tiers = {};
developers.forEach(d => {
  const t = d.tier === undefined ? "(absent)" : JSON.stringify(d.tier);
  tiers[t] = (tiers[t] || 0) + 1;
});
Object.entries(tiers).sort((a, b) => b[1] - a[1]).forEach(([k, v]) =>
  console.log(`  ${k.padEnd(20)}${String(v).padStart(6)}`));
const canonical = t => {
  const s = String(t ?? "").trim().toLowerCase().replace(/^tier[\s_-]*/, "");
  return ["1", "2", "3"].includes(s) ? `tier-${s}` : null;
};
const rankable = developers.filter(d => ["tier-1", "tier-2", "tier-3"].includes(d.tier)).length;
const rankableAfter = developers.filter(d => canonical(d.tier)).length;
console.log(`\n  rankable by the dashboard's original map:  ${rankable}`);
console.log(`  rankable after normalisation:             ${rankableAfter}`);

/* ───────────────────────────────────────────────────────── 5. COMMUNITIES ── */
h("5. DUPLICATE AND SUSPECT COMMUNITY ROWS");
const cName = new Map();
nbh.forEach(n => {
  const k = norm(n.name || n.community || n.id);
  if (!k) return;
  if (!cName.has(k)) cName.set(k, []);
  cName.get(k).push(n);
});
const cDupes = [...cName.entries()].filter(([, v]) => v.length > 1);
console.log(`  neighbourhoodScores rows:   ${nbh.length}`);
console.log(`  distinct names:             ${cName.size}`);
console.log(`  duplicated names:          ${cDupes.length}`);
cDupes.slice(0, 10).forEach(([, v]) =>
  console.log(`    ${String(v[0].name || v[0].id).slice(0, 44).padEnd(46)} x${v.length}`));

/* Rows sharing an identical median PPSF are a signal of copied, not measured, data. */
const byPpsf = new Map();
nbh.forEach(n => {
  const p = n.medianPPSF ?? n.avgPpsf ?? n.ppsf;
  if (!(Number(p) > 0)) return;
  const k = String(p);
  if (!byPpsf.has(k)) byPpsf.set(k, []);
  byPpsf.get(k).push(n.name || n.id);
});
const shared = [...byPpsf.entries()].filter(([, v]) => v.length > 2).sort((a, b) => b[1].length - a[1].length);
console.log(`\n  groups of 3+ communities sharing an identical PPSF: ${shared.length}`);
shared.slice(0, 6).forEach(([p, names]) =>
  console.log(`    PPSF ${String(p).padEnd(8)} x${String(names.length).padStart(2)}  ${names.slice(0, 4).join(", ").slice(0, 60)}`));

/* ───────────────────────────────────────────────────────────── 6. OVERLAP ── */
h("6. OVERLAP BETWEEN THE TWO COMMUNITY LISTS");
const setA = new Set(nbh.map(n => norm(n.name || n.id)).filter(Boolean));
const setB = new Set(communities.map(c => norm(c.name || c.id)).filter(Boolean));
const inBoth = [...setA].filter(x => setB.has(x));
console.log(`  neighbourhoodScores names:  ${setA.size}`);
console.log(`  communities names:          ${setB.size}`);
console.log(`  present in both:            ${inBoth.length}`);
console.log(`  only in neighbourhoodScores:${setA.size - inBoth.length}`);
console.log(`  only in communities:        ${setB.size - inBoth.length}`);

console.log("\n" + "═".repeat(74));
console.log("  Audit complete — no Firestore reads were used.");
console.log("═".repeat(74) + "\n");
