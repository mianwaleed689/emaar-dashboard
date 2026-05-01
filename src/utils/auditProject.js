/* ═══════════════════════════════════════════════════════════════════════
   DXB ANALYTICS — PROJECT DATA AUDIT HELPER
   ─────────────────────────────────────────────────────────────────────────
   Auto-flags common data errors across your project catalog.
   Runs in milliseconds per project. Scales to 1000s.

   USAGE:
     import { auditProject, auditCatalog } from "./utils/auditProject";

     // Single project
     const issues = auditProject(projectRecord);
     // → [{ severity: "error", field: "status", msg: "..." }, ...]

     // Entire catalog
     const report = auditCatalog(SEED_PROJECTS);
     // → { totalProjects, byRaised, topIssues, perProject }

   WHY THIS MATTERS AT SCALE:
     - Catches Golf Grand-style errors (invalid RERA, stage mismatches,
       Golden Visa flag wrong) BEFORE they hit production
     - Runs as a pre-commit hook or CI step
     - Prioritizes which projects need manual review
   ═══════════════════════════════════════════════════════════════════════ */

const GOLDEN_VISA_THRESHOLD = 2000000;
const COMMUNITY_YIELD_BENCHMARK = {
  "Dubai Hills Estate": 6.01,
  "Downtown Dubai": 5.8,
  "Dubai Marina": 6.5,
  "Business Bay": 7.0,
  "JVC": 7.5,
  "Palm Jumeirah": 5.0,
};

/* ═══ INDIVIDUAL AUDIT RULES ═══ */

const RULES = [
  /* ─── RERA format ─── */
  {
    id: "rera-format",
    severity: "error",
    check: (p) => {
      const num = p.reraNo || p.projectNumber;
      if (!num) return null;
      const s = String(num).trim();
      if (s.length > 6) return `RERA number "${s}" is ${s.length} digits — real RERA project numbers are 3-6 digits. Likely a DLD unit/listing ID.`;
      if (/^(\d)\1+$/.test(s)) return `RERA number "${s}" contains only repeating digits — likely placeholder.`;
      if (/^(1234|5678|0000|9999)/.test(s)) return `RERA number "${s}" looks like a test placeholder.`;
      return null;
    },
  },

  /* ─── Status vs construction % mismatch ─── */
  {
    id: "status-vs-pct",
    severity: "error",
    check: (p) => {
      if (p.status === "Ready" && p.constructionPct != null && p.constructionPct < 100) {
        return `Marked "Ready" but constructionPct is ${p.constructionPct}%.`;
      }
      if (p.constructionPct === 100 && p.expectedHandover) {
        const year = String(p.expectedHandover).match(/20\d{2}/);
        const currentYear = new Date().getFullYear();
        if (year && parseInt(year[0]) > currentYear) {
          return `constructionPct is 100% but expectedHandover is ${p.expectedHandover} (future). Status inconsistent.`;
        }
      }
      return null;
    },
  },

  /* ─── Lifecycle vs construction % mismatch ─── */
  {
    id: "lifecycle-mismatch",
    severity: "warning",
    check: (p) => {
      if (p.lifecycleStage === "recently-delivered" && (p.constructionPct || 0) < 90) {
        return `lifecycleStage is "recently-delivered" but constructionPct is ${p.constructionPct}%.`;
      }
      if (p.lifecycleStage === "under-construction" && p.constructionPct >= 100) {
        return `lifecycleStage "under-construction" conflicts with constructionPct ${p.constructionPct}%.`;
      }
      return null;
    },
  },

  /* ─── Golden Visa eligibility check ─── */
  {
    id: "golden-visa-wrong",
    severity: "warning",
    check: (p) => {
      if (p.priceMin >= GOLDEN_VISA_THRESHOLD && p.goldenVisa === false) {
        return `priceMin is AED ${(p.priceMin / 1000000).toFixed(2)}M (≥ threshold) but goldenVisa=false. Should be true.`;
      }
      /* Partial — 1BR below threshold, larger units above */
      if (p.unitBreakdown?.length > 0) {
        const someAbove = p.unitBreakdown.some(u => (u.priceFrom || 0) >= GOLDEN_VISA_THRESHOLD);
        if (someAbove && p.goldenVisa === false) {
          return `Some unit types have priceFrom ≥ AED 2M (Golden Visa threshold) but goldenVisa=false.`;
        }
      }
      return null;
    },
  },

  /* ─── Yield sanity vs community benchmark ─── */
  {
    id: "yield-outlier",
    severity: "warning",
    check: (p) => {
      const bench = COMMUNITY_YIELD_BENCHMARK[p.community];
      if (!bench || !p.grossYield) return null;
      const diff = Math.abs(p.grossYield - bench);
      if (diff > 2.5) {
        return `grossYield ${p.grossYield}% is ${diff.toFixed(1)}pp off community benchmark (${p.community}: ${bench}%). Verify.`;
      }
      return null;
    },
  },

  /* ─── Unit breakdown totals vs totalUnits ─── */
  {
    id: "unit-count-mismatch",
    severity: "warning",
    check: (p) => {
      if (!p.unitBreakdown?.length || !p.totalUnits) return null;
      const sum = p.unitBreakdown.reduce((s, u) => s + (u.count || 0), 0);
      if (Math.abs(sum - p.totalUnits) > p.totalUnits * 0.02) {
        return `unitBreakdown sums to ${sum} but totalUnits is ${p.totalUnits}. Drift > 2%.`;
      }
      return null;
    },
  },

  /* ─── PPSF vs priceMin/sqft sanity ─── */
  {
    id: "ppsf-sanity",
    severity: "info",
    check: (p) => {
      if (!p.ppsf || !p.unitBreakdown?.length) return null;
      const smallest = p.unitBreakdown[0];
      if (smallest.priceFrom && smallest.sqftMin) {
        const computed = smallest.priceFrom / smallest.sqftMin;
        const reported = smallest.ppsf || p.ppsf;
        const pctDiff = Math.abs(computed - reported) / reported;
        if (pctDiff > 0.15) {
          return `Smallest unit PPSF reported as ${reported} but computed from priceFrom/sqftMin is ~${Math.round(computed)}. Verify.`;
        }
      }
      return null;
    },
  },

  /* ─── Payment plan label sanity ─── */
  {
    id: "payment-plan-format",
    severity: "info",
    check: (p) => {
      if (!p.paymentPlan) return null;
      const s = String(p.paymentPlan);
      /* "90/10" commonly refers to pre/post-handover split but obscures
         whether it's 10/80/10 or 20/70/10 etc. Prefer full waterfall. */
      if (/^\d+\s*\/\s*\d+$/.test(s) && !p.paymentWaterfall) {
        return `paymentPlan "${s}" is a 2-stage label but paymentWaterfall is missing. Consider explicit 3-stage breakdown.`;
      }
      return null;
    },
  },

  /* ─── Required fields ─── */
  {
    id: "missing-core-fields",
    severity: "error",
    check: (p) => {
      const required = ["id", "project", "developer", "community", "type"];
      const missing = required.filter(f => !p[f]);
      if (missing.length) return `Missing required fields: ${missing.join(", ")}.`;
      return null;
    },
  },

  /* ─── Data staleness ─── */
  {
    id: "stale-data",
    severity: "info",
    check: (p) => {
      const verified = p._audit?.lastVerified;
      if (!verified) return `No _audit.lastVerified timestamp — verification status unknown.`;
      const days = (Date.now() - new Date(verified)) / 86400000;
      if (days > 180) return `Data last verified ${Math.round(days)} days ago — consider re-verifying.`;
      return null;
    },
  },

  /* ─── Distance range sanity ─── */
  {
    id: "distance-sanity",
    severity: "warning",
    check: (p) => {
      const checks = [
        ["distMetro", 50], ["distDIFC", 80], ["distAirport", 80],
        ["distBeach", 50], ["distMall", 30], ["distSchool", 20], ["distHospital", 30],
      ];
      for (const [field, max] of checks) {
        if (p[field] != null && (p[field] < 0 || p[field] > max)) {
          return `${field}=${p[field]}km is outside plausible range (0–${max}km).`;
        }
      }
      return null;
    },
  },
];

/* ═══ PUBLIC API ═══ */

/**
 * Audit a single project record. Returns array of issues.
 * @param {object} p - project record
 * @returns {Array<{ruleId, severity, field, msg}>}
 */
export function auditProject(p) {
  if (!p) return [{ ruleId: "null-project", severity: "error", msg: "Project is null/undefined" }];
  const issues = [];
  for (const rule of RULES) {
    try {
      const msg = rule.check(p);
      if (msg) issues.push({ ruleId: rule.id, severity: rule.severity, msg });
    } catch (err) {
      issues.push({ ruleId: rule.id, severity: "error", msg: `Rule crashed: ${err.message}` });
    }
  }
  return issues;
}

/**
 * Audit an entire catalog. Returns aggregated report.
 * @param {Array<object>} projects
 * @returns {object}
 */
export function auditCatalog(projects) {
  const report = {
    totalProjects: projects.length,
    auditedAt: new Date().toISOString(),
    byRuleId: {},
    bySeverity: { error: 0, warning: 0, info: 0 },
    topOffenders: [],     /* projects with most issues */
    cleanProjects: 0,
    perProject: {},
  };

  projects.forEach(p => {
    const issues = auditProject(p);
    const id = p?.id || p?.project || "unknown";
    if (issues.length === 0) {
      report.cleanProjects++;
    } else {
      report.perProject[id] = issues;
    }
    issues.forEach(i => {
      report.bySeverity[i.severity] = (report.bySeverity[i.severity] || 0) + 1;
      report.byRuleId[i.ruleId] = (report.byRuleId[i.ruleId] || 0) + 1;
    });
  });

  /* Top offenders — sorted by error count descending */
  report.topOffenders = Object.entries(report.perProject)
    .map(([id, issues]) => ({
      id,
      errorCount: issues.filter(i => i.severity === "error").length,
      warningCount: issues.filter(i => i.severity === "warning").length,
      totalIssues: issues.length,
    }))
    .sort((a, b) => (b.errorCount * 10 + b.warningCount) - (a.errorCount * 10 + a.warningCount))
    .slice(0, 20);

  return report;
}

/**
 * Pretty-print an audit report to the console.
 * @param {object} report
 */
export function printAuditReport(report) {
  console.log(`\n━━━ DXB ANALYTICS — CATALOG AUDIT ━━━`);
  console.log(`Audited: ${report.totalProjects} projects at ${report.auditedAt}`);
  console.log(`Clean: ${report.cleanProjects} (${((report.cleanProjects / report.totalProjects) * 100).toFixed(1)}%)`);
  console.log(`\nIssues by severity:`);
  console.log(`  Errors:   ${report.bySeverity.error || 0}`);
  console.log(`  Warnings: ${report.bySeverity.warning || 0}`);
  console.log(`  Info:     ${report.bySeverity.info || 0}`);
  console.log(`\nTop 5 rule violations:`);
  Object.entries(report.byRuleId)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .forEach(([ruleId, count]) => console.log(`  ${ruleId.padEnd(25)} ${count}`));
  console.log(`\nTop 10 offenders:`);
  report.topOffenders.slice(0, 10).forEach(o => {
    console.log(`  ${o.id.padEnd(40)} E:${o.errorCount} W:${o.warningCount}`);
  });
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
}

export default { auditProject, auditCatalog, printAuditReport };
