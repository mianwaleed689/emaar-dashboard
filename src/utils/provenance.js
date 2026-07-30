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

  /* A DLD claim is only honoured when the record does not contradict it.
   *
   * MEASURED across all 281 neighbourhoodScores rows on 2026-07-30:
   *   279 rows claim a DLD source
   *    93 of those also carry `verified: false`
   *   134 of those share an identical (PPSF, grossYield) pair with another
   *       community — 12 Dubai Hills sub-communities all read exactly
   *       PPSF 2,461 / yield 6.90%, which cannot be a per-community
   *       measurement
   *
   * Twelve distinct sub-communities do not share a median price to the dirham.
   * Those figures are an area-level estimate applied downward, so presenting
   * them as "DLD verified" overstates what is known. Both contradictions
   * demote the row to ESTIMATE.
   *
   * `valueSharedWith` is stamped by markSharedValues() below, which needs the
   * whole set to spot duplication and so cannot live in a per-row classifier.
   */
  if (combined.includes("dld")) {
    if (row.verified === false) {
      return build(PROVENANCE.ESTIMATE, "Claims DLD but flagged unverified", asOfOf(row));
    }
    if (Number(row.valueSharedWith) > 0) {
      return build(
        PROVENANCE.ESTIMATE,
        `Area-level figure, shared with ${row.valueSharedWith} other communit${Number(row.valueSharedWith) === 1 ? "y" : "ies"}`,
        asOfOf(row)
      );
    }
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

/**
 * Stamp `valueSharedWith` on each row: how many OTHER rows carry an identical
 * price-and-yield pair.
 *
 * Why this is needed: a median price per square foot is a measurement of one
 * community. When several communities report the same figure to the dirham AND
 * the same yield to two decimal places, the number was applied to them, not
 * measured from each. That is a legitimate area-level estimate — it just must
 * not be displayed as a verified per-community fact.
 *
 * Measured 2026-07-30: 135 of 281 communities (48%) carry a pair shared with at
 * least one other, across 44 groups. The largest are 12 Dubai Hills
 * sub-communities at PPSF 2,461 / 6.90%, 11 Al Barsha South and Al Jadaf rows at
 * 1,400 / 6.5%, and 11 Arabian Ranches rows at 1,476 / 6.0%.
 *
 * Call this once after loading the collection, before rendering. Returns new
 * objects; the input is not mutated.
 *
 * @param {Array<object>} rows
 * @returns {Array<object>} same rows with `valueSharedWith` added
 */
export function markSharedValues(rows) {
  if (!Array.isArray(rows)) return [];

  const pairOf = r => {
    const ppsf = r.medianPPSF ?? r.avgPpsf ?? r.ppsf;
    const yld = r.grossYield;
    if (!(Number(ppsf) > 0) || !(Number(yld) > 0)) return null;
    return `${ppsf}|${yld}`;
  };

  const counts = new Map();
  rows.forEach(r => {
    const k = pairOf(r);
    if (k) counts.set(k, (counts.get(k) || 0) + 1);
  });

  return rows.map(r => {
    const k = pairOf(r);
    /* Subtract self: 0 means this figure is unique to this community. */
    const shared = k ? (counts.get(k) || 1) - 1 : 0;
    return { ...r, valueSharedWith: shared };
  });
}
