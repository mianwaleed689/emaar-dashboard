#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════
   DXB ANALYTICS — PROJECT CATALOG AUDIT
   ─────────────────────────────────────────────────────────────────────────
   Runs at commit time. Fails the commit if any project has error-level
   issues (invalid RERA, status mismatch, missing required fields, etc.)
   ─────────────────────────────────────────────────────────────────────────
   USAGE:
     node scripts/audit-projects.js
     node scripts/audit-projects.js --verbose    (show all issues incl. info)
     node scripts/audit-projects.js --ci         (exit 1 on errors, for CI)
   ─────────────────────────────────────────────────────────────────────────
   WIRE INTO EXISTING PRE-COMMIT:
     In your existing pre-commit hook, add:
       node scripts/audit-projects.js --ci || exit 1
   ═══════════════════════════════════════════════════════════════════════ */

import { auditCatalog, printAuditReport } from "../src/utils/auditProject.js";
import { allProjects } from "../src/data/projects/index.js";

const args = process.argv.slice(2);
const verbose = args.includes("--verbose");
const ci = args.includes("--ci");

console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("  DXB ANALYTICS — Project Catalog Audit");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

const report = auditCatalog(allProjects);
printAuditReport(report);

/* ─── VERBOSE MODE: show every project's issues ─── */
if (verbose) {
  console.log("\n━━━ FULL ISSUE LIST ━━━\n");
  Object.entries(report.perProject).forEach(([id, issues]) => {
    console.log(`\n${id}:`);
    issues.forEach(i => {
      const badge = i.severity === "error" ? "🔴" : i.severity === "warning" ? "🟡" : "🔵";
      console.log(`  ${badge} [${i.ruleId}] ${i.msg}`);
    });
  });
}

/* ─── CI MODE: fail build on errors ─── */
if (ci) {
  if (report.bySeverity.error > 0) {
    console.error(`\n❌ COMMIT BLOCKED: ${report.bySeverity.error} error(s) in project catalog.`);
    console.error("   Fix errors above or run 'node scripts/audit-projects.js --verbose' for details.\n");
    process.exit(1);
  } else {
    console.log(`\n✅ Catalog clean — ${report.cleanProjects}/${report.totalProjects} projects verified.\n`);
    process.exit(0);
  }
}

console.log("\nRun with --verbose to see every issue. Run with --ci to use as a gate.\n");
