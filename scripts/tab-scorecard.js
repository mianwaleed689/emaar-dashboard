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

const ONLY = (process.argv.find(a => a.startsWith("--tab=")) || "").split("=")[1];

const TAB_DIR = "src/tabs";

const CLAIM = /"[^"]*?(?:AED\s?[\d,]+|\d+(?:\.\d+)?%|\b\d{1,3}(?:,\d{3})+\b)[^"]*"/g;
const PROVENANCE_TEXT = /source|asOf|as of|verified|DLD|Land Department|ValuStrat|REIDIN|Knight Frank|Provident|Central Bank|CBUAE|Property Monitor|n\s*=|sample|published|reported|20\d\d-\d\d-\d\d|FY20\d\d|Q[1-4]\s?20\d\d/i;
const NOISE = /rgba?\(|#[0-9a-fA-F]{3,8}|px|borderRadius|fontSize|gridTemplate|padding|margin|width|height|zIndex|opacity|viewBox|strokeWidth|d="M|gradient|keyframes/;
const ADMISSION = /unverified|no published source|stale|not confirmed|could not be traced|do not quote|placeholder|dummy|fake\b|hardcoded/i;

/* Signals that a tab meets a criterion. */
const USES_PROVENANCE_UI = /SourceBadge|SourceList|classifyProvenance|isMeasured|valueSharedWith|provenance/;
const USES_DESIGN_SYSTEM = /components\/ui\/DataDisplay|from "\.\.\/components\/ui/;
const HAS_EMPTY_STATE = /SmartEmptyState|No data|not recorded|nothing to show|length === 0|length\s*===\s*0|!.*\.length/;
const READS_LIVE_DATA = /props|live[A-Z]|useFirestore|useAlmanac|useMarket|\{\s*\w+\s*=\s*\[\]\s*\}/;

function scoreFile(file) {
  const src = fs.readFileSync(file, "utf8");
  const lines = src.split(/\r?\n/);

  let claims = 0, sourced = 0, admitted = 0;
  let inBlock = false;

  lines.forEach((line, i) => {
    const t = line.trim();
    if (inBlock) { if (t.includes("*/")) inBlock = false; return; }
    /* JSX comments open with "{/*" — see audit-claims.js. */
    if (/^\{?\/\*/.test(t) && !t.includes("*/")) { inBlock = true; return; }
    if (t.startsWith("//") || t.startsWith("*") || /^\{?\/\*/.test(t)) return;
    if (NOISE.test(line)) return;

    const found = line.match(CLAIM);
    if (!found) return;

    const ctx = lines.slice(Math.max(0, i - 3), i + 4).join(" ");
    const hasProv = PROVENANCE_TEXT.test(ctx);
    const admits = ADMISSION.test(ctx);

    found.forEach(c => {
      if (c.length < 6) return;
      claims++;
      if (admits) admitted++;
      else if (hasProv) sourced++;
    });
  });

  const unsourced = claims - sourced - admitted;

  const checks = {
    sourced:    claims === 0 || unsourced === 0,
    honest:     admitted === 0,
    provenance: USES_PROVENANCE_UI.test(src),
    consistent: USES_DESIGN_SYSTEM.test(src),
    emptyState: HAS_EMPTY_STATE.test(src),
    live:       READS_LIVE_DATA.test(src),
  };

  /* Weighted: a tab that can mislead a client is worse than one that looks
     inconsistent. Sourced and honest carry three times the weight. */
  const WEIGHTS = { sourced: 3, honest: 3, provenance: 2, consistent: 1, emptyState: 1, live: 2 };
  const max = Object.values(WEIGHTS).reduce((a, b) => a + b, 0);
  const got = Object.entries(checks).reduce((n, [k, ok]) => n + (ok ? WEIGHTS[k] : 0), 0);

  return {
    file, claims, sourced, unsourced, admitted, checks,
    score: Math.round((got / max) * 100),
    lines: lines.length,
  };
}

const files = fs.readdirSync(TAB_DIR)
  .filter(f => /\.jsx?$/.test(f))
  .filter(f => !ONLY || f.toLowerCase().includes(ONLY.toLowerCase()))
  .map(f => path.join(TAB_DIR, f));

const results = files.map(scoreFile).sort((a, b) => a.score - b.score);

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
    `${String(r.unsourced).padStart(6)}    ${String(r.admitted).padStart(6)}   ${name}`
  );
});

const avg = Math.round(results.reduce((n, r) => n + r.score, 0) / (results.length || 1));
const failing = results.filter(r => r.score < 70);

console.log("  " + "─".repeat(76));
console.log(`  tabs measured        ${results.length}`);
console.log(`  average score        ${avg}%`);
console.log(`  below 70%            ${failing.length}`);
console.log(`  total unsourced      ${results.reduce((n, r) => n + r.unsourced, 0)}`);
console.log(`  total self-admitted  ${results.reduce((n, r) => n + r.admitted, 0)}`);

console.log(`
  src  every number has a source, date or sample size
  hon  nothing the code itself flags as unverified or stale
  prv  visibly distinguishes measured data from estimates
  cns  uses the shared design system
  emp  says something useful when it has no data
  liv  reads real data rather than a hardcoded array
`);
