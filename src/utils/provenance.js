/**
 * Single source of truth for "where did this number come from?"
 *
 * The database carries provenance in several inconsistent fields and the two
 * disagree with each other:
 *
 *   scoreSource : 259 "dld-real-data-2026", 22 absent
 *   source      : 198 "communities", 51 "research-verified-2026",
 *                  20 "dld-project-sync-2026", 10 "projects", 2 absent
 *   isSeedData  : boolean on 85 hardcoded fallback records
 *
 * Until those are reconciled at the data layer, this classifier resolves them
 * conservatively: a record is only called VERIFIED when a field explicitly says
 * the figure came from DLD transactions. Anything hand-researched, seeded, or
 * unattributed is labelled as such rather than presented as measured fact.
 */

export const PROVENANCE = {
  VERIFIED:  "verified",   // derived from DLD transaction data
  DERIVED:   "derived",    // computed from other records in our own database
  ESTIMATE:  "estimate",   // hand-researched or seeded figure
  UNSOURCED: "unsourced",  // no provenance recorded — treat with suspicion
};

const LABEL = {
  [PROVENANCE.VERIFIED]:  "DLD verified",
  [PROVENANCE.DERIVED]:   "Derived",
  [PROVENANCE.ESTIMATE]:  "Estimate",
  [PROVENANCE.UNSOURCED]: "Unsourced",
};

const COLOR = {
  [PROVENANCE.VERIFIED]:  "#10B981", // green
  [PROVENANCE.DERIVED]:   "#3B82F6", // blue
  [PROVENANCE.ESTIMATE]:  "#F59E0B", // amber
  [PROVENANCE.UNSOURCED]: "#64748B", // muted
};

/**
 * Classify a data record.
 * @returns {{level:string,label:string,color:string,detail:string,asOf:string|null}}
 */
export function classifyProvenance(row) {
  if (!row || typeof row !== "object") {
    return build(PROVENANCE.UNSOURCED, "No record", null);
  }

  // An explicit seed flag always wins — never dress a fallback as real data.
  if (row.isSeedData === true) {
    return build(PROVENANCE.ESTIMATE, row.source || "Seed data", asOfOf(row));
  }

  const source = String(row.source || "").toLowerCase();
  const scoreSource = String(row.scoreSource || "").toLowerCase();
  const combined = `${source} ${scoreSource}`;

  // Hand-researched figures must never be labelled verified, even when a second
  // field claims DLD provenance — the conservative reading wins.
  if (combined.includes("research")) {
    return build(PROVENANCE.ESTIMATE, row.source || row.scoreSource, asOfOf(row));
  }
  if (combined.includes("dld")) {
    return build(PROVENANCE.VERIFIED, row.source || row.scoreSource, asOfOf(row));
  }
  if (source === "communities" || source === "projects") {
    return build(PROVENANCE.DERIVED, `Computed from ${source}`, asOfOf(row));
  }
  if (source) {
    return build(PROVENANCE.DERIVED, row.source, asOfOf(row));
  }
  return build(PROVENANCE.UNSOURCED, "No source recorded", asOfOf(row));
}

function asOfOf(row) {
  const raw = row.asOf ?? row.asOfDate ?? row.updatedAt ?? row.syncedAt ?? row.verifiedAt ?? null;
  if (!raw) return null;
  if (typeof raw === "string") return raw.slice(0, 10);
  if (raw && typeof raw === "object" && raw.seconds) {
    return new Date(raw.seconds * 1000).toISOString().slice(0, 10);
  }
  if (raw && typeof raw === "object" && raw._seconds) {
    return new Date(raw._seconds * 1000).toISOString().slice(0, 10);
  }
  return null;
}

function build(level, detail, asOf) {
  return { level, label: LABEL[level], color: COLOR[level], detail: detail || LABEL[level], asOf };
}

/** True when a figure is solid enough to present without a caveat. */
export function isTrustworthy(row) {
  const { level } = classifyProvenance(row);
  return level === PROVENANCE.VERIFIED || level === PROVENANCE.DERIVED;
}
