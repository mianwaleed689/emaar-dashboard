/**
 * INVESTMENT SCORE — one formula, applied to every community.
 *
 * ── WHY THIS EXISTS ─────────────────────────────────────────────────────────
 *
 * The stored `investmentScore` field on neighbourhoodScores was not comparable
 * across records. Different import scripts wrote it with different formulas:
 *
 *   scripts/add-missing-communities.js   yield 30 + liquidity 8 + ppsf 20
 *                                        + supply 15 + metro 4   (max ~77)
 *   scripts/data-quality-audit.js        base 40 + yield 20 + metro 12
 *                                        + ppsf 8 + amenities 16 + visa 5
 *
 * The second is the one that CHECKS the scores; it was never the one that wrote
 * most of them. Measured against the 281 cached community records:
 *
 *   131 of 281 stored scores differ from the audit formula by more than 10 pts
 *
 * And the batches diverge systematically. The 51 records tagged
 * `research-verified-2026` average a stored score of 79.9; the 198 tagged
 * `communities` average 55.7 — a 24-point gap on a 0-100 scale. Their mean
 * gross yields are 6.75% and 6.55%, essentially the same.
 *
 * The consequence, on a tab that ranks communities by this number:
 *
 *   39 of the top 50 came from that 51-record batch
 *    0 of the bottom 50 did
 *
 * So the ranking largely reflected WHICH IMPORT WROTE THE RECORD, not which
 * community is the better investment. An agent sorting by score and reading the
 * top of the list to a client was reading an artefact of the data pipeline.
 *
 * ── THE FIX ─────────────────────────────────────────────────────────────────
 *
 * Compute in the browser, from the underlying fields, with one formula. Every
 * community is then scored the same way regardless of which script created it,
 * and the stored field is ignored.
 *
 * ── ON MISSING INPUTS ───────────────────────────────────────────────────────
 *
 * Coverage is uneven: metro distance exists on 235 of 281 records, amenity
 * flags on 259. Scoring a missing input as zero would quietly punish a
 * community for a gap in OUR data and push it down the ranking — the same class
 * of error as the batch bias, arrived at differently.
 *
 * So a component is scored only when its input exists, and the total is scaled
 * by the points that were actually available. A community scored on four of six
 * components is directly comparable to one scored on six; what differs is
 * `coverage`, which the UI shows, so thin evidence is visible rather than
 * disguised as a confident number.
 *
 * Below 50 points of available inputs there is not enough to rank on, and the
 * function returns null rather than a number that looks like the others.
 *
 * ── WHAT THIS IS NOT ────────────────────────────────────────────────────────
 *
 * A DERIVED figure, not a measurement. The weights are our judgement — nothing
 * here is regressed against realised investor returns. They are stated, and the
 * per-component breakdown is returned so the UI can show the reasoning. A stated
 * assumption an agent can argue with beats a hidden one, which is the same
 * standard applied to the Risk tab's factor weights.
 */

/** Component weights. Stated here, shown on screen, and summing to 100. */
export const SCORE_WEIGHTS = {
  yield:        { max: 30, label: "Rental yield",       why: "What the property returns each year" },
  supplyRisk:   { max: 20, label: "Supply risk",        why: "Exposure to oversupply in the pipeline" },
  priceLevel:   { max: 15, label: "Entry price",        why: "Lower price per sqft is a cheaper way in" },
  connectivity: { max: 15, label: "Metro connectivity", why: "Distance to the nearest metro station" },
  amenity:      { max: 10, label: "Amenities",          why: "Beach, mall and school access" },
  goldenVisa:   { max: 10, label: "Golden Visa",        why: "Whether typical prices clear the AED 2m threshold" },
};

const MAX_TOTAL = Object.values(SCORE_WEIGHTS).reduce((n, w) => n + w.max, 0);

/** Minimum available points before a score means anything. */
export const MIN_COVERAGE_POINTS = 50;

const has = v => v !== null && v !== undefined && v !== "";

/**
 * Score one community record.
 *
 * @returns {null | {
 *   score: number,            // 0-100, scaled to the inputs available
 *   coverage: number,         // 0-1, share of the weighting actually scored
 *   scoredOn: number,         // components scored
 *   totalComponents: number,
 *   missing: string[],        // component keys with no input
 *   components: Array<{key,label,why,earned,max,available,detail}>,
 * }}
 */
export function scoreCommunity(n) {
  if (!n || typeof n !== "object") return null;

  const components = [];
  const add = (key, available, earned, detail) => {
    const w = SCORE_WEIGHTS[key];
    components.push({
      key, label: w.label, why: w.why,
      max: w.max,
      earned: available ? Math.max(0, Math.min(w.max, earned)) : 0,
      available,
      detail,
    });
  };

  /* Yield — the return itself, weighted heaviest. */
  const y = parseFloat(n.grossYield);
  const yOk = Number.isFinite(y) && y > 0;
  add("yield", yOk,
    y >= 9 ? 30 : y >= 8 ? 26 : y >= 7 ? 22 : y >= 6 ? 17 : y >= 5 ? 12 : 6,
    yOk ? `${y.toFixed(1)}% gross` : "no yield recorded");

  /* Supply risk — inverted: Low risk earns the points. */
  const sr = has(n.supplyRisk) ? String(n.supplyRisk).toLowerCase() : null;
  const srKnown = sr && sr !== "unknown";
  add("supplyRisk", !!srKnown,
    sr === "low" ? 20 : sr === "medium" ? 12 : 4,
    srKnown ? `${n.supplyRisk} supply risk` : "supply risk not assessed");

  /* Entry price — a lower price per sqft is a cheaper way into the market.
     Deliberately NOT a quality signal: an expensive community is not a worse
     investment, it is a larger cheque. */
  const p = Number(n.avgPpsf);
  const pOk = Number.isFinite(p) && p > 0;
  add("priceLevel", pOk,
    p < 1000 ? 15 : p < 1500 ? 13 : p < 2000 ? 10 : p < 3000 ? 7 : 4,
    pOk ? `AED ${Math.round(p).toLocaleString()}/sqft` : "no price recorded");

  /* Connectivity — metro distance where known, else the boolean flag. */
  const dm = parseFloat(n.distMetro);
  const dmOk = Number.isFinite(dm) && dm >= 0 && dm < 90;
  if (dmOk) {
    add("connectivity", true,
      dm < 0.5 ? 15 : dm < 1 ? 13 : dm < 2 ? 9 : dm < 3 ? 6 : dm < 5 ? 3 : 1,
      `${dm.toFixed(1)} km to metro`);
  } else if (has(n.hasMetro)) {
    add("connectivity", true, n.hasMetro ? 11 : 2,
      n.hasMetro ? "metro in the community" : "no metro");
  } else {
    add("connectivity", false, 0, "metro access unknown");
  }

  /* Amenity — only scored when the flags were actually populated. Absent flags
     are not the same as absent amenities. */
  const amenityKnown = has(n.hasBeach) || has(n.hasMall) || has(n.hasSchool);
  const amenityBits = [
    n.hasBeach  ? "beach"  : null,
    n.hasMall   ? "mall"   : null,
    n.hasSchool ? "school" : null,
  ].filter(Boolean);
  add("amenity", amenityKnown,
    (n.hasBeach ? 5 : 0) + (n.hasMall ? 3 : 0) + (n.hasSchool ? 2 : 0),
    amenityKnown ? (amenityBits.join(", ") || "none recorded") : "amenities not surveyed");

  /* Golden Visa — matters to a large share of Dubai buyers. */
  add("goldenVisa", has(n.goldenVisa), n.goldenVisa ? 10 : 0,
    has(n.goldenVisa) ? (n.goldenVisa ? "typically clears AED 2m" : "typically below AED 2m")
                      : "eligibility unknown");

  const availableMax = components.filter(c => c.available).reduce((s, c) => s + c.max, 0);
  if (availableMax < MIN_COVERAGE_POINTS) return null;

  const earned = components.reduce((s, c) => s + c.earned, 0);

  return {
    score: Math.round((earned / availableMax) * 100),
    coverage: availableMax / MAX_TOTAL,
    scoredOn: components.filter(c => c.available).length,
    totalComponents: components.length,
    missing: components.filter(c => !c.available).map(c => c.key),
    components,
  };
}

/** Label for a score. Kept here so the tab and any future consumer agree. */
export function scoreBand(score) {
  if (score >= 80) return { label: "Excellent", color: "#10B981" };
  if (score >= 70) return { label: "Good",      color: "#84CC16" };
  if (score >= 60) return { label: "Average",   color: "#D4A843" };
  if (score >= 50) return { label: "Below avg", color: "#F59E0B" };
  return { label: "Weak", color: "#EF4444" };
}
