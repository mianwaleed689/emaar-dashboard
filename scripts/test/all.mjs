/**
 * Every check, in one command.
 *
 *     node scripts/test/all.mjs
 *
 * Four separate suites had grown up and it was becoming possible to run three
 * of them and believe everything was green. Anything added under scripts/test
 * that ends in .test.mjs is picked up automatically, so a new suite cannot be
 * forgotten by not being listed here.
 *
 * The rules audit is included deliberately: tenant isolation is the one failure
 * that would end the business, and it belongs in the same command as everything
 * else rather than in somebody's memory.
 */
import { readdirSync } from "fs";
import { spawnSync } from "child_process";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const here = dirname(fileURLToPath(import.meta.url));

const suites = readdirSync(here)
  .filter(f => f.endsWith(".test.mjs"))
  .sort()
  .map(f => ({ name: f.replace(".test.mjs", ""), path: join(here, f) }));

suites.push({ name: "firestore rules (tenant isolation)", path: join(here, "audit-rules.mjs") });

let failed = 0;
const results = [];

for (const s of suites) {
  const r = spawnSync(process.execPath, [s.path], { encoding: "utf8", cwd: join(here, "..", "..") });
  const out = (r.stdout || "") + (r.stderr || "");
  const m = out.match(/(\d+) passed, (\d+) failed/);
  const review = out.match(/(\d+) NEED REVIEW/);

  const ok = r.status === 0;
  if (!ok) failed++;

  results.push({
    name: s.name, ok,
    detail: m ? `${m[1]} passed, ${m[2]} failed`
          : review ? `${review[1]} needing review`
          : ok ? "passed" : "FAILED",
    out,
  });
}

console.log("\nDXB ANALYTICS — ALL CHECKS\n");
results.forEach(r =>
  console.log(`  ${r.ok ? "✓" : "✗"} ${r.name.padEnd(36)} ${r.detail}`));

if (failed) {
  console.log("\n── OUTPUT FROM WHAT FAILED ─────────────────────────────────");
  results.filter(r => !r.ok).forEach(r => {
    console.log(`\n### ${r.name}`);
    /* Only the failing lines — a wall of ticks buries the one thing to read. */
    r.out.split("\n").filter(l => /✗|Error|FAILED|NEED REVIEW|line\s+\d+/.test(l))
         .slice(0, 25).forEach(l => console.log("  " + l));
  });
}

const total = results.reduce((n, r) => {
  const m = r.detail.match(/^(\d+) passed/);
  return n + (m ? parseInt(m[1], 10) : 0);
}, 0);

console.log(`\n${"═".repeat(62)}`);
console.log(`  ${total} assertions across ${suites.length} suites · ${failed ? `${failed} SUITE${failed === 1 ? "" : "S"} FAILING` : "all green"}`);
console.log("═".repeat(62));
process.exit(failed ? 1 : 0);
