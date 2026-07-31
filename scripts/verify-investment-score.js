/**
 * VERIFY THE INVESTMENT SCORE — does the new formula actually fix the bias?
 *
 * The stored `investmentScore` ranked communities by which import script wrote
 * them. This checks that the replacement in src/utils/investmentScore.js does
 * not, by measuring the same thing that exposed the original:
 *
 *   - how far stored and computed scores diverge
 *   - whether one import batch still dominates the top of the ranking
 *   - how many communities cannot be scored at all
 *
 * Run after any change to the weights. A formula nobody re-measures is how the
 * original drifted in the first place.
 *
 *   node scripts/verify-investment-score.js
 *
 * Reads the cached copy of neighbourhoodScores so it costs no Firestore quota —
 * this project has been taken down by read exhaustion before.
 */
const fs = require("fs");

const CACHE = "data-audit/cache/neighbourhoodScores.json";

/* The util is ESM and this is CommonJS. Rather than duplicate the formula —
   which is the exact fault being fixed — the source is read and evaluated. If
   this breaks, it breaks loudly rather than silently scoring differently. */
function loadScorer() {
  const src = fs.readFileSync("src/utils/investmentScore.js", "utf8");
  const cjs = src
    .replace(/export const /g, "const ")
    .replace(/export function /g, "function ")
    + "\nmodule.exports = { scoreCommunity, scoreBand, SCORE_WEIGHTS };";
  const m = { exports: {} };
  new Function("module", "exports", cjs)(m, m.exports);
  return m.exports;
}

const { scoreCommunity } = loadScorer();
const raw = JSON.parse(fs.readFileSync(CACHE, "utf8"));
const rows = Array.isArray(raw) ? raw : (raw.docs || Object.values(raw));

const scored = rows.map(n => ({ n, r: scoreCommunity(n) }));
const ok = scored.filter(s => s.r);
const unscored = scored.filter(s => !s.r);

const avg = a => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);

console.log("\nINVESTMENT SCORE — stored field vs computed formula\n");
console.log(`  records            ${rows.length}`);
console.log(`  scored             ${ok.length}`);
console.log(`  cannot be scored   ${unscored.length}  (too few inputs)`);

/* ── Batch bias: the fault being fixed ─────────────────────────────────────── */
const bySource = {};
scored.forEach(s => {
  const k = s.n.source || "(none)";
  (bySource[k] = bySource[k] || []).push(s);
});

console.log("\n  MEAN SCORE BY IMPORT BATCH — these should be close together");
console.log("  batch                       n    stored   computed   yield");
Object.entries(bySource).sort((a, b) => b[1].length - a[1].length).forEach(([src, list]) => {
  const stored = avg(list.map(s => s.n.investmentScore || 0));
  const comp = avg(list.filter(s => s.r).map(s => s.r.score));
  const yld = avg(list.map(s => parseFloat(s.n.grossYield) || 0));
  console.log(`  ${src.padEnd(26)} ${String(list.length).padStart(3)} ${stored.toFixed(1).padStart(8)} ${comp.toFixed(1).padStart(10)} ${yld.toFixed(2).padStart(7)}%`);
});

/* ── Does one batch still own the top of the ranking? ──────────────────────── */
function batchShareOfTop(getScore, label) {
  const ranked = [...scored].filter(s => s.r).sort((a, b) => getScore(b) - getScore(a));
  const top = ranked.slice(0, 50);
  const counts = {};
  top.forEach(s => { const k = s.n.source || "(none)"; counts[k] = (counts[k] || 0) + 1; });
  const totals = {};
  scored.filter(s => s.r).forEach(s => { const k = s.n.source || "(none)"; totals[k] = (totals[k] || 0) + 1; });
  console.log(`\n  TOP 50 BY ${label}`);
  Object.entries(counts).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => {
    const pool = totals[k] || 0;
    const expected = Math.round(50 * pool / ranked.length);
    console.log(`    ${k.padEnd(26)} ${String(v).padStart(3)} of ${String(pool).padStart(3)} in pool   (even split would be ~${expected})`);
  });
}

batchShareOfTop(s => s.n.investmentScore || 0, "THE STORED FIELD (the old ranking)");
batchShareOfTop(s => s.r.score, "THE COMPUTED SCORE (the new ranking)");

/* ── Coverage ──────────────────────────────────────────────────────────────── */
const cov = ok.map(s => s.r.coverage);
console.log(`\n  COVERAGE — share of the weighting actually scored`);
console.log(`    mean               ${(avg(cov) * 100).toFixed(0)}%`);
console.log(`    fully scored       ${ok.filter(s => s.r.coverage === 1).length}`);
console.log(`    scored on 5 of 6   ${ok.filter(s => s.r.scoredOn === 5).length}`);
console.log(`    scored on 4 of 6   ${ok.filter(s => s.r.scoredOn === 4).length}`);

const missCount = {};
ok.forEach(s => s.r.missing.forEach(m => { missCount[m] = (missCount[m] || 0) + 1; }));
if (Object.keys(missCount).length) {
  console.log("\n  MOST-MISSING COMPONENTS");
  Object.entries(missCount).sort((a, b) => b[1] - a[1])
    .forEach(([k, v]) => console.log(`    ${k.padEnd(16)} missing on ${v} communities`));
}

console.log("");
