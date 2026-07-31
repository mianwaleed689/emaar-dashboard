/**
 * TAB SCORECARD — what "complete" means, checked mechanically.
 *
 * ── WHY ─────────────────────────────────────────────────────────────────────
 *
 * Tabs have been fixed one at a time, and each pass found more. That is not bad
 * luck; it is what happens without a written definition of done. "Complete" has
 * meant "the last thing I looked at is fixed".
 *
 * This encodes what the product actually promises, so every tab can be measured
 * against the same bar and the remaining work is a list rather than a feeling.
 *
 * ── THE STANDARD ────────────────────────────────────────────────────────────
 *
 * DXB Analytics sells to agents and agencies. An agent's job is to answer a
 * client who has already Googled the question. That means a tab is complete when
 * a user can act on it in front of a client without getting caught out:
 *
 *   1. SOURCED      every number carries a source, date or sample size
 *   2. HONEST       nothing the code itself flags as unverified or stale
 *   3. PROVENANCE   the tab visibly distinguishes measured from estimated
 *   4. CONSISTENT   uses the shared design system, not private primitives
 *   5. EMPTY STATE  says something useful when it has no data
 *   6. LIVE         reads real data, not a hardcoded array
 *
 * A tab failing 1 or 2 can mislead a client. Those are weighted heaviest.
 *
 *   node scripts/tab-scorecard.js
 *   node scripts/tab-scorecard.js --tab=Market
 */
const fs = require("fs");
const path = require("path");
const { analyse } = require("./lib/claims");

const ONLY = (process.argv.find(a => a.startsWith("--tab=")) || "").split("=")[1];

const TAB_DIR = "src/tabs";

/* Claim detection is shared with audit-claims.js — see scripts/lib/claims.js. */

/* Signals that a tab meets a criterion. */
const USES_PROVENANCE_UI = /SourceBadge|SourceList|classifyProvenance|isMeasured|valueSharedWith|provenance/;
const USES_DESIGN_SYSTEM = /components\/ui\/DataDisplay|from "\.\.\/components\/ui/;
const HAS_EMPTY_STATE = /SmartEmptyState|No data|not recorded|nothing to show|length === 0|length\s*===\s*0|!.*\.length/;
const READS_LIVE_DATA = /props|live[A-Z]|useFirestore|useAlmanac|useMarket|\{\s*\w+\s*=\s*\[\]\s*\}/;

function scoreFile(file) {
  const src = fs.readFileSync(file, "utf8");
  const { counts } = analyse(src);
  const { total: claims, sourced, unsourced, admitted } = counts;

  const checks = {
    sourced:    claims === 0 || unsourced === 0,
    honest:     admitted === 0,
    provenance: USES_PROVENANCE_UI.test(src),
    consistent: USES_DESIGN_SYSTEM.test(src),
    emptyState: HAS_EMPTY_STATE.test(src),
    live:       READS_LIVE_DATA.test(src),
  };

  /* Weighted: a tab that can mislead a client in front of them is worse than
     one that merely looks inconsistent. */
  const WEIGHTS = { sourced: 3, honest: 3, provenance: 2, consistent: 1, emptyState: 1, live: 2 };
  const max = Object.values(WEIGHTS).reduce((a, b) => a + b, 0);
  const got = Object.entries(checks).reduce((n, [k, ok]) => n + (ok ? WEIGHTS[k] : 0), 0);

  return {
    file, claims, sourced, unsourced, admitted, checks,
    score: Math.round((got / max) * 100),
    lines: src.split(/\r?\n/).length,
  };
}

/* src/tabs/index.js is a re-export barrel, not a tab. It cannot be sourced, has
   no data and shows nothing, so it scored 50% forever and sat in the "below the
   bar" count as work that could never be done. Counting it made the product look
   one tab worse than it is and hid a real tab behind a false one. */
const NOT_A_TAB = new Set(["index.js", "index.jsx"]);

const files = fs.readdirSync(TAB_DIR)
  .filter(f => /\.jsx?$/.test(f))
  .filter(f => !NOT_A_TAB.has(f))
  .filter(f => !ONLY || f.toLowerCase().includes(ONLY.toLowerCase()))
  .map(f => path.join(TAB_DIR, f));

/* Which of these files belong to tabs that are held back? A held tab is not
   sold, so averaging it in understates where the shipped product actually is —
   the five held tabs carry 67 of the 97 unsourced claims between them. Read
   through the shared parser so this cannot drift from the sidebar. */
const { readTabConfig } = require("./lib/tabConfig");
const heldFiles = new Set();
const unresolvedHeld = [];
readTabConfig().heldTabs.forEach(t => {
  const file = t.key.replace(/[^A-Za-z]/g, "") + "Tab.jsx";
  if (fs.existsSync(path.join(TAB_DIR, file))) heldFiles.add(file);
  else unresolvedHeld.push(t.key);
});

const results = files.map(scoreFile).sort((a, b) => a.score - b.score);
results.forEach(r => { r.held = heldFiles.has(path.basename(r.file)); });

const tick = ok => (ok ? "y" : "·");

console.log("\nTAB SCORECARD — measured against what this product promises an agent\n");
console.log("  score  src hon prv cns emp liv   unsourced  admitted   tab");
console.log("  " + "─".repeat(76));

results.forEach(r => {
  const c = r.checks;
  const name = path.basename(r.file);
  console.log(
    `  ${String(r.score).padStart(4)}%   ${tick(c.sourced)}   ${tick(c.honest)}   ${tick(c.provenance)}   ` +
    `${tick(c.consistent)}   ${tick(c.emptyState)}   ${tick(c.live)}    ` +
    `${String(r.unsourced).padStart(6)}    ${String(r.admitted).padStart(6)}   ${name}${r.held ? "   [held]" : ""}`
  );
});

const mean = rs => Math.round(rs.reduce((n, r) => n + r.score, 0) / (rs.length || 1));
const sum = (rs, k) => rs.reduce((n, r) => n + r[k], 0);

const shipped = results.filter(r => !r.held);
const held = results.filter(r => r.held);

console.log("  " + "─".repeat(76));
console.log(`  tabs measured        ${results.length}  (${shipped.length} shipped, ${held.length} held back)`);
console.log("");
console.log("  SHIPPED — what a paying agent can actually open");
console.log(`    average score      ${mean(shipped)}%`);
console.log(`    at the bar (75%+)  ${shipped.filter(r => r.score >= 75).length} of ${shipped.length}`);
console.log(`    below 70%          ${shipped.filter(r => r.score < 70).length}`);
console.log(`    unsourced claims   ${sum(shipped, "unsourced")}`);
console.log(`    self-admitted bad  ${sum(shipped, "admitted")}`);
if (held.length) {
  console.log("");
  console.log("  HELD BACK — not sold, not counted above");
  console.log(`    average score      ${mean(held)}%`);
  console.log(`    unsourced claims   ${sum(held, "unsourced")}`);
}
if (unresolvedHeld.length) {
  console.log("");
  console.log(`  WARNING: held tab(s) with no matching file — ${unresolvedHeld.join(", ")}`);
  console.log("  The name mapping in this script has drifted from src/config/tabs.js.");
}

console.log(`
  src  every number has a source, date or sample size
  hon  nothing the code itself flags as unverified or stale
  prv  visibly distinguishes measured data from estimates
  cns  uses the shared design system
  emp  says something useful when it has no data
  liv  reads real data rather than a hardcoded array
`);
