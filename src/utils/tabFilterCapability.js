/**
 * WHICH GLOBAL FILTERS DOES EACH TAB ACTUALLY HONOUR?
 * ═════════════════════════════════════════════════════════════════════════════
 *
 * The global bar is fixed above all 34 tabs, but honouring it is opt-in per
 * tab. Until now nothing recorded who opted in, so the bar showed six controls
 * everywhere and the "N filters active" chip counted selections the page had
 * never applied.
 *
 * `honours` is a statement of FACT, verified against the code on 2026-07-31 —
 * not a statement of intent. The bar renders only these controls, so a user is
 * never offered one that does nothing on the page they are looking at.
 *
 * `target` is what the tab SHOULD support once wired. The gap between the two
 * is the remaining work, and it is visible here rather than buried.
 *
 * ── HOW TO WIRE A TAB ───────────────────────────────────────────────────────
 *
 *   1. Declare a field map in the tab (see utils/globalFilter.js)
 *   2. Run its records through applyGlobalFilters()
 *   3. Surface ignoredKeys() so the user is told what could not be applied
 *   4. Move those keys from `target` into `honours` here
 *
 * Keys: developer · community · type · beds · status · price
 *
 * @see TAB_STANDARD.md check 3 — every control does something
 * @see FILTER_AUDIT.md the measurement
 */

const ALL = ["developer", "community", "type", "beds", "status", "price"];

/** @type {Record<string,{honours:string[], target:string[], note?:string}>} */
export const TAB_FILTER_CAPABILITY = {
  // ── fully wired ───────────────────────────────────────────────────────────
  "Projects": {
    honours: ["developer", "community", "status", "beds", "price"],
    target: ALL,
    note: "The reference implementation. `type` is deliberately excluded — the " +
          "tab has its own type pills and applying both would double-filter.",
  },

  // ── partially wired ───────────────────────────────────────────────────────
  "Competitors":      { honours: ["developer"], target: ["developer", "community"] },
  "Developer Health": { honours: ["developer"], target: ["developer", "community"] },
  "Financials":       { honours: ["developer"], target: ["developer"] },
  "Price History":    { honours: ["community"], target: ["community", "type", "beds"] },
  "Risk":             { honours: ["community"], target: ["community", "developer"] },

  // ── receive the prop, read nothing (9 tabs) ───────────────────────────────
  "Map":              { honours: [], target: ["community", "developer", "type"] },
  "DLD Volumes":      { honours: [], target: ["community", "type", "status"] },
  "DXB Estimate":     { honours: [], target: ["community", "type", "beds"] },
  "Handover":         { honours: [], target: ["community", "developer", "status"] },
  "Investment Score": { honours: [], target: ["community"] },
  "Launch Calendar":  { honours: [], target: ["community", "developer", "status"] },
  "Service Charges":  { honours: [], target: ["community", "type"] },
  "STR vs LTR":       { honours: [], target: ["community", "beds"] },
  "Yields":           { honours: [], target: ["community", "type", "beds"] },

  // ── never passed the prop ─────────────────────────────────────────────────
  "Overview":         { honours: [], target: ["community", "developer"] },
  "Neighbourhoods":   { honours: [], target: ["community"] },
  "Market":           { honours: [], target: [] , note: "City-level aggregates; per-community filtering would be misleading." },
  "Currency":         { honours: [], target: [], note: "FX rates. No property dimension applies." },
  "Mortgage":         { honours: [], target: ["price"] },
  "Banking":          { honours: [], target: [], note: "EIBOR rates. No property dimension applies." },
  "Golden Visa":      { honours: [], target: ["community", "developer", "price"] },
  "Flip":             { honours: [], target: ["community", "type", "beds"] },
  "Portfolio":        { honours: [], target: [], note: "User's own holdings." },
  "My Leads":         { honours: [], target: [], note: "CRM records, not properties." },
  "Pipeline":         { honours: [], target: [], note: "CRM records, not properties." },
  "Team":             { honours: [], target: [], note: "Org members, not properties." },
  "Agency":           { honours: [], target: [], note: "Org performance, not properties." },
  "Listings":         { honours: [], target: ["community", "type", "beds", "price"] },
  "Compliance":       { honours: [], target: ["developer"] },
  "Data Quality":     { honours: [], target: [], note: "Meta-view of all records by design." },
  "Dev Portal":       { honours: [], target: ["developer"] },
  "Intelligence":     { honours: [], target: ["community", "developer"] },
  "Marketing":        { honours: [], target: ["community", "type", "beds"] },
};

/**
 * Which controls should the bar render for this tab?
 * Unknown tab -> render nothing rather than guess, so a new tab cannot
 * silently inherit six controls it does not honour.
 *
 * @param {string} tab
 * @returns {string[]}
 */
export function honouredKeys(tab) {
  return TAB_FILTER_CAPABILITY[tab]?.honours ?? [];
}

/** Does this tab honour any global filter at all? */
export function honoursAnything(tab) {
  return honouredKeys(tab).length > 0;
}

/** Keys this tab is meant to gain but has not yet — the remaining work. */
export function pendingKeys(tab) {
  const cap = TAB_FILTER_CAPABILITY[tab];
  if (!cap) return [];
  const have = new Set(cap.honours);
  return (cap.target || []).filter((k) => !have.has(k));
}

/** Progress across the whole app, for reporting. */
export function capabilitySummary() {
  const tabs = Object.keys(TAB_FILTER_CAPABILITY);
  const wired = tabs.filter((t) => honouredKeys(t).length > 0);
  const wanted = tabs.filter((t) => (TAB_FILTER_CAPABILITY[t].target || []).length > 0);
  const done = wanted.filter((t) => pendingKeys(t).length === 0);
  return {
    tabs: tabs.length,
    honouringSomething: wired.length,
    needingWork: wanted.length - done.length,
    deliberatelyNone: tabs.length - wanted.length,
  };
}
