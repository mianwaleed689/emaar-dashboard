/**
 * CLAIM AUDIT — find every number on screen that has nothing behind it.
 *
 * ── WHY THIS EXISTS ─────────────────────────────────────────────────────────
 *
 * The "87% cash transactions" figure was wrong, and it was wrong in SIX places.
 * It was found one at a time, over several rounds, because each search looked
 * for a phrase rather than the number. Two of those places even carried their
 * own captions admitting the figure was stale or unsourceable — and rendered it
 * anyway.
 *
 * Thirty-two tabs remain. Finding their errors the same way means finding them
 * one at a time, in front of a customer.
 *
 * So this reads every tab and flags user-visible numeric claims that have no
 * source, no date, and no sample size anywhere near them. It is a heuristic, not
 * a proof — its job is to produce a ranked worklist rather than a verdict.
 *
 *   node scripts/audit-claims.js              # summary by file
 *   node scripts/audit-claims.js --detail     # every flagged line
 *   node scripts/audit-claims.js --file=X     # one file
 *
 * Reads source only. Touches nothing, needs no credentials, costs no quota.
 */
const fs = require("fs");
const path = require("path");
const { analyse } = require("./lib/claims");

const DETAIL = process.argv.includes("--detail");
const ONLY = (process.argv.find(a => a.startsWith("--file=")) || "").split("=")[1];

const ROOTS = ["src/tabs", "src/components", "src/pages", "src/data"];

/* Claim detection lives in scripts/lib/claims.js so this tool and the
   scorecard cannot disagree about the same file. */

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.(jsx?|js)$/.test(e.name)) out.push(p);
  }
  return out;
}

function auditFile(file) {
  const { claims } = analyse(fs.readFileSync(file, "utf8"));
  return claims.map(c => ({
    line: c.line,
    claim: c.text,
    severity: c.severity,
    admits: c.severity === "ADMITTED",
    hasProvenance: c.severity === "ok",
  }));
}

const files = ROOTS.flatMap(r => walk(r)).filter(f => !ONLY || f.includes(ONLY));

const report = files
  .map(f => ({ file: f, findings: auditFile(f) }))
  .map(r => ({
    ...r,
    unsourced: r.findings.filter(x => x.severity === "UNSOURCED").length,
    admitted: r.findings.filter(x => x.severity === "ADMITTED").length,
    ok: r.findings.filter(x => x.severity === "ok").length,
  }))
  .filter(r => r.findings.length)
  .sort((a, b) => (b.admitted * 10 + b.unsourced) - (a.admitted * 10 + a.unsourced));

const tot = k => report.reduce((n, r) => n + r[k], 0);

console.log("\nCLAIM AUDIT — user-visible numbers and whether anything backs them\n");
console.log(`  files scanned      ${files.length}`);
console.log(`  numeric claims     ${tot("unsourced") + tot("admitted") + tot("ok")}`);
console.log(`  with provenance    ${tot("ok")}`);
console.log(`  UNSOURCED          ${tot("unsourced")}`);
console.log(`  SELF-ADMITTED bad  ${tot("admitted")}   <- the code says these are wrong and shows them anyway`);

console.log("\n─── WORST FILES ────────────────────────────────────────────────");
console.log("  admitted  unsourced  ok   file");
report.slice(0, 22).forEach(r => {
  console.log(
    `  ${String(r.admitted).padStart(8)}  ${String(r.unsourced).padStart(9)}  ${String(r.ok).padStart(3)}   ${r.file}`
  );
});

if (DETAIL) {
  console.log("\n─── FLAGGED CLAIMS ─────────────────────────────────────────────");
  report.forEach(r => {
    const bad = r.findings.filter(f => f.severity !== "ok");
    if (!bad.length) return;
    console.log(`\n${r.file}`);
    bad.slice(0, 30).forEach(f =>
      console.log(`  ${String(f.line).padStart(5)}  ${f.severity.padEnd(9)} ${f.claim}`)
    );
    if (bad.length > 30) console.log(`  … and ${bad.length - 30} more`);
  });
}

console.log("\nHeuristic, not proof: a claim counts as sourced if a source, date or");
console.log("sample size appears within three lines. Use it to rank the work, then read.\n");
