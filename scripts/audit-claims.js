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

const DETAIL = process.argv.includes("--detail");
const ONLY = (process.argv.find(a => a.startsWith("--file=")) || "").split("=")[1];

const ROOTS = ["src/tabs", "src/components", "src/pages", "src/data"];

/** A claim is a string literal containing a figure a reader would act on. */
const CLAIM = /"[^"]*?(?:AED\s?[\d,]+|\d+(?:\.\d+)?%|\b\d{1,3}(?:,\d{3})+\b)[^"]*"/g;

/** Words that indicate provenance sits nearby. */
const PROVENANCE = /source|sourced|asOf|as of|verified|DLD|Land Department|ValuStrat|REIDIN|Knight Frank|Provident|Central Bank|CBUAE|Bayut|Property Monitor|n\s*=|sample|published|reported|per\s+\w+\s+20\d\d|20\d\d-\d\d-\d\d|\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\s+20\d\d|FY20\d\d|Q[1-4]\s?20\d\d/i;

/** Lines that are styling, not content. */
const NOISE = /rgba?\(|#[0-9a-fA-F]{3,8}|px|borderRadius|fontSize|gridTemplate|padding|margin|width|height|zIndex|opacity|translate|viewBox|strokeWidth|d="M|linear-gradient|cubic-bezier|@media|keyframes/;

/** Admissions that the code already knows a figure is bad. */
const ADMISSION = /unverified|no published source|stale|not confirmed|could not be traced|do not quote|placeholder|dummy|fake|TODO|FIXME|hardcoded/i;

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
  const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);
  const findings = [];
  let inBlockComment = false;

  lines.forEach((line, i) => {
    const trimmed = line.trim();

    /* Track block comments so documentation about a fix is not itself flagged. */
    if (inBlockComment) {
      if (trimmed.includes("*/")) inBlockComment = false;
      return;
    }
    if (trimmed.startsWith("/*") && !trimmed.includes("*/")) { inBlockComment = true; return; }
    if (trimmed.startsWith("//") || trimmed.startsWith("*") || trimmed.startsWith("/*")) return;
    if (NOISE.test(line)) return;

    const claims = line.match(CLAIM);
    if (!claims) return;

    /* Provenance may sit on the same line or within three lines either side —
       a caption, an asOf, a source prop. */
    const context = lines.slice(Math.max(0, i - 3), i + 4).join(" ");
    const hasProvenance = PROVENANCE.test(context);
    const admits = ADMISSION.test(context);

    claims.forEach(c => {
      const claim = c.slice(1, -1).trim();
      if (claim.length < 4) return;
      findings.push({
        line: i + 1,
        claim: claim.length > 74 ? claim.slice(0, 74) + "…" : claim,
        hasProvenance,
        admits,
        severity: admits ? "ADMITTED" : hasProvenance ? "ok" : "UNSOURCED",
      });
    });
  });

  return findings;
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
