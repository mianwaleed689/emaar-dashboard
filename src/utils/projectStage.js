/**
 * Canonical project lifecycle stage — one rule, used by BOTH the filter and the
 * badge on the card.
 *
 * ── THE BUG THIS FIXES ──────────────────────────────────────────────────────
 *
 * The Projects tab filtered on the raw `lifecycleStage` field:
 *
 *     if (projLifecycle !== "All" && p.lifecycleStage !== projLifecycle) return false;
 *
 * …while the badge printed on each card was DERIVED from `status` and
 * `constructionPct`. Two different vocabularies for the same idea, so a project
 * could display "Under Construction" and then disappear when the user filtered
 * for Under Construction.
 *
 * Measured across all 1,728 project documents on 2026-07-30:
 *
 *     lifecycleStage present ...... 31      (all of them "under-construction")
 *     lifecycleStage absent ....... 1,697
 *     stage field ................. does not exist on any document
 *     status ...................... "Off-Plan" 1,576 · "Ready" 152
 *     constructionPct ............. present on all 1,728
 *
 * So of the four options the dropdown offered — announced, under-construction,
 * recently-delivered, historical — THREE matched zero records, and the fourth
 * matched only 31 of 1,728. Filtering was effectively broken.
 *
 * Deriving from the fields that actually carry data gives:
 *
 *     under-construction .......... 1,216
 *     announced ................... 351
 *     completed ................... 161
 *                                   ─────
 *                                   1,728
 *
 * ── ON "HISTORICAL" ─────────────────────────────────────────────────────────
 *
 * The old dropdown also offered "Historical / Completed" as distinct from
 * "Recently Delivered". Nothing in the data distinguishes a recent handover from
 * an old one — there is no verified delivery date — so both options could not be
 * honestly supported. They are collapsed into one COMPLETED stage rather than
 * offering a filter that silently returns nothing.
 */

/** Canonical stage values. */
export const PROJECT_STAGES = {
  ANNOUNCED: "announced",
  UNDER_CONSTRUCTION: "under-construction",
  COMPLETED: "completed",
};

/** Order matters — this drives the dropdown. */
export const PROJECT_STAGE_OPTIONS = [
  { value: PROJECT_STAGES.ANNOUNCED,          label: "Announced / Pre-Launch" },
  { value: PROJECT_STAGES.UNDER_CONSTRUCTION, label: "Under Construction" },
  { value: PROJECT_STAGES.COMPLETED,          label: "Completed / Ready" },
];

/** Short label for the card badge. */
export const PROJECT_STAGE_LABELS = {
  [PROJECT_STAGES.ANNOUNCED]: "Announced",
  [PROJECT_STAGES.UNDER_CONSTRUCTION]: "Under Construction",
  [PROJECT_STAGES.COMPLETED]: "Ready",
};

/** Ready / Off-Plan, the two-way split several tabs display. */
export const PROJECT_STAGE_TO_STATUS = {
  [PROJECT_STAGES.ANNOUNCED]: "Off-Plan",
  [PROJECT_STAGES.UNDER_CONSTRUCTION]: "Off-Plan",
  [PROJECT_STAGES.COMPLETED]: "Ready",
};

function toPct(v) {
  if (v === undefined || v === null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/**
 * Map any legacy lifecycleStage spelling onto a canonical stage.
 * Returns null when the value is not recognised, so derivation takes over
 * rather than a typo becoming its own invisible category.
 */
function fromLegacyStage(raw) {
  const s = String(raw || "").toLowerCase().trim();
  if (!s) return null;
  if (s === "announced" || s === "launching" || s === "pre-launch") return PROJECT_STAGES.ANNOUNCED;
  if (s === "under-construction" || s === "under construction") return PROJECT_STAGES.UNDER_CONSTRUCTION;
  if (s === "recently-delivered" || s === "historical" || s === "completed" || s === "delivered") {
    return PROJECT_STAGES.COMPLETED;
  }
  return null;
}

/**
 * The single source of truth for a project's stage.
 *
 * Precedence:
 *   1. An explicit, recognised `lifecycleStage` — someone set it deliberately.
 *   2. `status === "Ready"` or construction at 100% — it is built.
 *   3. Construction under way — under construction.
 *   4. Otherwise announced.
 *
 * @param {object} p a project record
 * @returns {string} one of PROJECT_STAGES
 */
export function projectStage(p) {
  if (!p) return PROJECT_STAGES.ANNOUNCED;

  const legacy = fromLegacyStage(p.lifecycleStage);
  if (legacy) return legacy;

  const pct = toPct(p.constructionPct);
  const status = String(p.status || "").toLowerCase().trim();

  if (status === "ready" || (pct !== null && pct >= 100)) return PROJECT_STAGES.COMPLETED;
  if (pct !== null && pct > 0) return PROJECT_STAGES.UNDER_CONSTRUCTION;
  return PROJECT_STAGES.ANNOUNCED;
}

/** Does this project match a selected filter value? "All" matches everything. */
export function matchesStageFilter(p, selected) {
  if (!selected || selected === "All") return true;
  const canonical = fromLegacyStage(selected) || selected;
  return projectStage(p) === canonical;
}

/** Ready / Off-Plan for a project, derived from the same single rule. */
export function projectStatusLabel(p) {
  return PROJECT_STAGE_TO_STATUS[projectStage(p)] || "Off-Plan";
}
