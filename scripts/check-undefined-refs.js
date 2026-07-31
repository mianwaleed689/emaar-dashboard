/**
 * UNDEFINED IDENTIFIER CHECK — the bug class that keeps reaching production.
 *
 * ── WHY ─────────────────────────────────────────────────────────────────────
 *
 * The Market tab went down in production with "MARKET_TAB_SOURCES is not
 * defined". An edit inserted JSX referencing that constant, and a second edit
 * meant to create the constant silently no-opped because its text anchor said
 * "/* Shared palette" while the file said "/** Shared palette".
 *
 * The build passed. Vite bundles modules; it does not resolve free identifiers,
 * so an undefined SCREAMING_CASE constant is invisible until the component
 * renders. The same near-miss happened with `orgName` on the Overview call site
 * and was only caught by manually grepping for the declaration.
 *
 * A build that passes is not evidence that a tab renders. This is.
 *
 *   node scripts/check-undefined-refs.js
 *
 * Scope is deliberately narrow: SCREAMING_SNAKE_CASE identifiers, which are how
 * this codebase names module-level constants. That catches the real failure mode
 * without the false positives of a general scope analysis.
 */
const fs = require("fs");
const path = require("path");

const ROOTS = ["src/tabs", "src/components", "src/pages"];

/* Names that exist without being declared in the file. */
const GLOBALS = new Set([
  "JSON", "Math", "Object", "Array", "String", "Number", "Boolean", "Date",
  "Promise", "Map", "Set", "RegExp", "Error", "Infinity", "NaN",
  "React", "window", "document", "console", "localStorage", "sessionStorage",
  "URL", "URLSearchParams", "Intl", "Buffer",
]);

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.jsx?$/.test(e.name)) out.push(p);
  }
  return out;
}

function check(file) {
  const src = fs.readFileSync(file, "utf8");

  /* Strip comments so documentation naming a constant is not counted as a use. */
  const code = src
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/(^|[^:])\/\/.*$/gm, "$1 ");

  /* Every SCREAMING_SNAKE identifier that appears in the code. */
  const used = new Set();
  for (const m of code.matchAll(/\b([A-Z][A-Z0-9]*(?:_[A-Z0-9]+)+)\b/g)) used.add(m[1]);
  if (!used.size) return [];

  /* Everything declared here or imported. */
  const declared = new Set(GLOBALS);
  for (const m of code.matchAll(/\b(?:const|let|var|function|class)\s+([A-Z][A-Z0-9_]*)/g)) declared.add(m[1]);
  for (const m of code.matchAll(/import\s+([\s\S]*?)\s+from/g)) {
    for (const n of m[1].matchAll(/\b([A-Za-z_$][\w$]*)\b/g)) declared.add(n[1]);
  }
  /* Re-exports name an identifier without using it — `export { A } from './x'`
     is a pass-through, not a reference. Counting them produced two false
     positives in components/index.js, and a checker that cries wolf is one
     nobody runs. */
  for (const m of code.matchAll(/export\s*\{([^}]*)\}\s*from/g)) {
    for (const n of m[1].matchAll(/\b([A-Za-z_$][\w$]*)\b/g)) declared.add(n[1]);
  }
  /* Destructured from props or objects: { A, B } = something */
  for (const m of code.matchAll(/\{([^{}]*)\}\s*=/g)) {
    for (const n of m[1].matchAll(/\b([A-Z][A-Z0-9_]*)\b/g)) declared.add(n[1]);
  }
  /* Object keys and property access are not free identifiers. */
  const propertyOf = new Set();
  for (const m of code.matchAll(/\.\s*([A-Z][A-Z0-9_]*)\b/g)) propertyOf.add(m[1]);
  for (const m of code.matchAll(/\b([A-Z][A-Z0-9_]*)\s*:/g)) propertyOf.add(m[1]);

  return [...used].filter(n => !declared.has(n) && !propertyOf.has(n));
}

const files = ROOTS.flatMap(r => walk(r));
let failures = 0;

console.log("\nUNDEFINED IDENTIFIER CHECK — what the build cannot see\n");

files.forEach(f => {
  const missing = check(f);
  if (!missing.length) return;
  failures += missing.length;
  console.log(`  ${f}`);
  missing.forEach(n => console.log(`      ${n}  — used but never declared or imported`));
});

if (!failures) {
  console.log(`  ${files.length} files checked — no undefined module constants.\n`);
  process.exit(0);
}

console.log(`\n  ${failures} undefined reference(s). Each one throws when its tab renders.\n`);
process.exit(1);
