/**
 * Statistics for the Overview tab, computed from live data.
 *
 * ── WHY THIS EXISTS ─────────────────────────────────────────────────────────
 *
 * The Overview tab used to state market figures as literal strings inside the
 * component — "Avg yield 6.55%", "Q1 2026: AED 252B (+31% YoY)", "EIBOR 3.59%",
 * "Q1 2026 avg PPSF: AED 1,759". Written in April 2026, still on screen in
 * July, with no as-of date and no way for a reader to tell how old they were.
 * Several had already moved: independent H1 2026 reporting puts Dubai-wide
 * gross yield near 6.8% and off-plan share at ~70%, against the 65% stored here.
 *
 * A number a client cannot date is a number they cannot trust. So the headline
 * figures are now computed from the data the platform actually holds, and every
 * market figure that cannot be computed carries its source and as-of date from
 * src/data/marketFacts.js rather than being retyped into the view.
 *
 * The distinction that matters:
 *   COVERAGE  — what we hold. Computed here, always current by construction.
 *   MARKET    — what Dubai is doing. Sourced, dated, and never invented.
 */

import { classifyProvenance, PROVENANCE } from "./provenance";

/** Median of an array of numbers. Returns null on an empty set. */
function median(values) {
  const nums = values.map(Number).filter(n => Number.isFinite(n) && n > 0).sort((a, b) => a - b);
  if (!nums.length) return null;
  const mid = Math.floor(nums.length / 2);
  return nums.length % 2 ? nums[mid] : (nums[mid - 1] + nums[mid]) / 2;
}

const ppsfOf = c => c.medianPPSF ?? c.avgPpsf ?? c.ppsf;

/**
 * Everything the Overview needs about our own coverage.
 *
 * @param {object} input
 * @param {Array}  input.communities     investor-facing communities (the 193)
 * @param {Array}  input.allCommunities  annotated set including admin districts
 * @param {Array}  input.projects        project records
 * @param {Array}  input.developers      developer brands
 */
export function computeCoverage({ communities = [], allCommunities = [], projects = [], developers = [] } = {}) {
  const withPrice = communities.filter(c => Number(ppsfOf(c)) > 0);
  const withYield = communities.filter(c => Number(c.grossYield) > 0);
  const withNet = communities.filter(c => Number(c.netYield) > 0);

  /* Provenance mix — the honest headline. classifyProvenance already demotes a
     DLD claim that the record itself contradicts, so these counts reflect what
     can actually be stood behind rather than what the source field asserts. */
  let verified = 0, estimate = 0, derived = 0, unsourced = 0;
  communities.forEach(c => {
    const { level } = classifyProvenance(c);
    if (level === PROVENANCE.VERIFIED) verified++;
    else if (level === PROVENANCE.DERIVED) derived++;
    else if (level === PROVENANCE.ESTIMATE) estimate++;
    else unsourced++;
  });

  const administrative = Math.max(0, allCommunities.length - communities.length);

  return {
    communityCount: communities.length,
    administrativeCount: administrative,
    totalScored: allCommunities.length || communities.length,

    projectCount: projects.length,
    developerCount: developers.length,

    medianPPSF: median(withPrice.map(ppsfOf)),
    ppsfSampleSize: withPrice.length,

    medianGrossYield: median(withYield.map(c => c.grossYield)),
    grossYieldSampleSize: withYield.length,

    medianNetYield: median(withNet.map(c => c.netYield)),
    netYieldSampleSize: withNet.length,

    provenance: { verified, derived, estimate, unsourced },
    verifiedShare: communities.length ? verified / communities.length : 0,
  };
}

/**
 * Communities ranked by net yield, for the "where the returns are" panel.
 *
 * Net rather than gross deliberately: gross yield ignores service charges, and
 * service charges are exactly what separates a headline number from what an
 * owner actually banks. Rows without a computed net yield are excluded rather
 * than shown with a gross figure standing in for one.
 */
export function topByNetYield(communities = [], limit = 6) {
  return communities
    .filter(c => Number(c.netYield) > 0 && Number(ppsfOf(c)) > 0)
    .slice()
    .sort((a, b) => Number(b.netYield) - Number(a.netYield))
    .slice(0, limit);
}

/** Communities with the deepest transaction evidence behind their figures. */
export function bestEvidenced(communities = [], limit = 6) {
  return communities
    .filter(c => classifyProvenance(c).level === PROVENANCE.VERIFIED && Number(ppsfOf(c)) > 0)
    .slice()
    .sort((a, b) => Number(ppsfOf(b)) - Number(ppsfOf(a)))
    .slice(0, limit);
}

/**
 * How fresh is the platform? Reads the most recent timestamp we can find across
 * the live feeds, so "last updated" is observed rather than asserted.
 */
export function computeFreshness({ communities = [], marketData = null, eibor = null } = {}) {
  const stamps = [];
  const push = v => {
    if (!v) return;
    const d = typeof v === "string" ? new Date(v)
      : v?.seconds ? new Date(v.seconds * 1000)
      : v?._seconds ? new Date(v._seconds * 1000)
      : null;
    if (d && !Number.isNaN(d.getTime())) stamps.push(d);
  };

  communities.forEach(c => push(c.updatedAt || c.syncedAt || c.asOf));
  push(marketData?.syncedAt || marketData?.updatedAt);
  push(eibor?.asOf || eibor?.updatedAt || eibor?.syncedAt);

  if (!stamps.length) return { latest: null, ageDays: null };
  const latest = new Date(Math.max(...stamps.map(d => d.getTime())));
  const ageDays = Math.floor((Date.now() - latest.getTime()) / 86400000);
  return { latest, ageDays };
}

/** Format a number as AED with sensible magnitude. */
export function formatAED(n, { decimals = 0 } = {}) {
  const v = Number(n);
  if (!Number.isFinite(v)) return "—";
  if (Math.abs(v) >= 1e9) return `AED ${(v / 1e9).toFixed(1)}B`;
  if (Math.abs(v) >= 1e6) return `AED ${(v / 1e6).toFixed(2)}M`;
  return `AED ${v.toLocaleString(undefined, { maximumFractionDigits: decimals })}`;
}

/** Percentage with one decimal, or an em dash when absent. */
export function formatPct(n) {
  const v = Number(n);
  return Number.isFinite(v) ? `${v.toFixed(1)}%` : "—";
}
