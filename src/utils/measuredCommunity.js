/**
 * MEASURED COMMUNITY FIGURES — the real ones, keyed by community name.
 * ═════════════════════════════════════════════════════════════════════════════
 *
 * ── THE PROBLEM ─────────────────────────────────────────────────────────────
 *
 * The 193 community records the app renders carry figures that were assigned,
 * not measured. Counted in the running app on 2026-08-02:
 *
 *     gross yield ......  15 distinct values across 193 communities
 *     service charge ...  15 distinct values across 193 communities
 *
 * 43% of communities carried one of just two numbers — 5.5% or 6.5%. Dubai
 * Harbour, Dubai Marina and Emaar Beachfront were all exactly 6.5%.
 *
 * Compared against Land Department records (GAP_ANALYSIS.md), the stored price
 * per square foot was out by a median of 15%, with 28 of 82 matched communities
 * off by more than 25% and nine by more than 50%. Palm Jumeirah showed AED
 * 1,902/sqft against a measured 3,719. Every `DUBAI HILLS - …` sub-community
 * carried the parent's 2,461 when Golf Grove is really 1,238.
 *
 * The yield error also ran ONE WAY: of the fourteen largest gaps, thirteen
 * quoted a higher yield than the transactions support.
 *
 * ── WHAT THIS DOES ──────────────────────────────────────────────────────────
 *
 * Looks a community up in the two computed datasets and returns the measured
 * figure with the number of records behind it. A caller can then prefer the
 * measured value and show how it was arrived at.
 *
 * It returns null when nothing was measured. That is deliberate — the caller
 * must decide whether to fall back or to show nothing, rather than silently
 * receiving an invented number.
 *
 *     price per sqft   src/data/communityHierarchy.json  (95 master + 72 area)
 *     gross yield      src/data/yieldsDld.json           (290 results)
 */
import HIER from "../data/communityHierarchy.json";
import YIELDS from "../data/yieldsDld.json";

const norm = s => String(s ?? "").toLowerCase().replace(/[^a-z0-9]+/g, "");

/**
 * ── NAME ALIASES ────────────────────────────────────────────────────────────
 *
 * The Land Department's name for a place is often not the name the market uses.
 * Each entry below maps a market name to the DLD name, WITH THE REASON.
 *
 * These are written by hand on purpose. Automatic fuzzy matching was tried and
 * rejected — it bought 15 extra matches and produced these:
 *
 *     Sobha Hartland 2               -> SOBHA HARTLAND        different community
 *     DUBAI HILLS - SIDRA 3          -> SIDRA 1 + SIDRA 2     different sub-communities
 *     Al Barsha 1 / 2 / 3            -> all -> Al Barsha First conflates three
 *     Dubai Health Care City Phase 1 -> Phase 2               wrong phase
 *
 * That is precisely the defect this file exists to remove: one community's
 * figures shown under another community's name. A missing figure is honest; a
 * confidently wrong one is not.
 *
 * DELIBERATELY NOT ALIASED, and why:
 *
 *     Dubai Investment Park   DLD splits it into First and Second, two areas of
 *                             very different size. Picking one would be a guess.
 *     Arabian Ranches         DLD holds 1, II and 3 separately. They price
 *                             differently; pooling them would mislead.
 *     Meydan City             Maps to Meydan One and Meydan Racecourse, two
 *                             distinct master communities.
 *     Al Sufouh               The only near name is Sufouh Gardens, which is one
 *                             sub-community inside it, not the whole area.
 *     Emaar Beachfront        No DLD master community exists under any name.
 */
const ALIASES = {
  /* DLD misspells Jumeirah as "Jumeriah" in this record, and appends the acronym. */
  "jumeirahbeachresidence":      "Jumeriah Beach Residence  - JBR",
  "jumeirahbeachresidencejbr":   "Jumeriah Beach Residence  - JBR",

  /* IMPZ was renamed Dubai Production City in 2021. DLD kept the original name. */
  "dubaiproductioncity":         "International Media Production Zone",
  "dubaiproductioncityimpz":     "International Media Production Zone",

  /* Market prefixes "Dubai"; DLD does not. Same master community. */
  "dubaisiliconoasis":           "Silicon Oasis",

  /* Spelling variant of the same area — one D in the DLD record. */
  "aljaddaf":                    "Al Jadaf",

  /* Expo City Dubai — DLD records it in capitals without "Dubai". */
  "expocitydubai":               "EXPO CITY",

  /* ── DLD area names ──────────────────────────────────────────────────────
     For these three, DLD files the place under its official area name and never
     under its market name. The mapping is standard across the Dubai industry.
     They resolve to an AREA, which is a wider footprint than the market name
     implies — measured() reports `level` so the screen can say so. */
  "jumeirahlaketowers":          "Al Thanyah Fifth",
  "mohammedbinrashidcity":       "Hadaeq Sheikh Mohammed Bin Rashid",
  "internationalcity":           "Al Warsan First",
};

/** Market name -> the key the DLD datasets are actually filed under. */
const resolve = name => {
  const k = norm(name);
  const a = ALIASES[k];
  return { key: a ? norm(a) : k, aliased: !!a, dldName: a || null };
};

/* ── price per square foot, most recent year ──────────────────────────────── */
const PPSF = (() => {
  const m = new Map();
  for (const e of (HIER.entities || [])) {
    const last = e.s?.[e.s.length - 1];
    if (!last) continue;
    const k = norm(e.n);
    const prev = m.get(k);
    /* A name can exist as both an area and a master community — Business Bay,
       Palm Jumeirah and four others do. Prefer the master community: it is what
       an agent means when they say the name, and it is the deeper sample. */
    const rank = e.l === "master" ? 3 : e.l === "area" ? 2 : 1;
    if (!prev || rank > prev.rank || (rank === prev.rank && last.n > prev.n)) {
      m.set(k, { ppsf: last.ppsf, n: last.n, year: last.year, level: e.l, rank,
                 changePct: e.c, changeFrom: e.cf, name: e.n });
    }
  }
  return m;
})();

/* ── gross yield, pooled across unit types within a community ─────────────── */
const YIELD = (() => {
  const m = new Map();
  for (const r of (YIELDS.y || [])) {
    const k = norm(r.m);
    if (!m.has(k)) m.set(k, []);
    m.get(k).push(r);
  }
  const out = new Map();
  for (const [k, rows] of m) {
    const g = rows.map(r => r.g).sort((a, b) => a - b);
    out.set(k, {
      grossYield: g[Math.floor(g.length / 2)],
      saleN: rows.reduce((a, r) => a + r.sn, 0),
      rentN: rows.reduce((a, r) => a + r.rn, 0),
      unitTypes: rows.length,
      name: rows[0].m,
    });
  }
  return out;
})();

/** Measured price per square foot, or null. */
export function measuredPpsf(community) {
  const { key, aliased, dldName } = resolve(community);
  const hit = PPSF.get(key);
  return hit ? { ...hit, aliased, dldName } : null;
}

/** Measured gross yield, or null. */
export function measuredYield(community) {
  const { key, aliased, dldName } = resolve(community);
  const hit = YIELD.get(key);
  return hit ? { ...hit, aliased, dldName } : null;
}

/**
 * Everything measured for a community, with a flag per figure so the caller can
 * label what is real and what is still the stored estimate.
 */
export function measured(community) {
  const p = measuredPpsf(community);
  const y = measuredYield(community);
  if (!p && !y) return null;
  return {
    ppsf: p?.ppsf ?? null,
    ppsfSampleN: p?.n ?? null,
    ppsfYear: p?.year ?? null,
    ppsfChangePct: p?.changePct ?? null,
    ppsfChangeFrom: p?.changeFrom ?? null,
    level: p?.level ?? null,
    grossYield: y?.grossYield ?? null,
    yieldSaleN: y?.saleN ?? null,
    yieldRentN: y?.rentN ?? null,
    unitTypes: y?.unitTypes ?? null,
    hasPpsf: !!p,
    hasYield: !!y,
    /* True when the market name differs from the Land Department's. The screen
       should say which record it read, so the figure can be checked. */
    aliased: !!(p?.aliased || y?.aliased),
    dldName: p?.dldName || y?.dldName || null,
  };
}

/**
 * ── EVIDENCE LEVELS ─────────────────────────────────────────────────────────
 * How a figure on screen was arrived at. Shared so every screen showing
 * community figures labels them the same way.
 */
export const EV = {
  MEASURED: "measured",   // counted from Land Department records
  THIN:     "thin",       // counted, but from few sales
  ESTIMATE: "estimate",   // the stored value — nobody measured it
  NONE:     "none",       // no figure at all
};

/**
 * Fold the measured figures over one stored community record.
 *
 * Both the Neighbourhoods list and the Map render the same communities, so they
 * must render the same numbers. They did not: the Map read the raw stored
 * fields while Neighbourhoods read measured ones, which would have shown Dubai
 * Marina at 6.5% on one screen and 5.1% on the other. A client who spots two
 * screens disagreeing about one community stops trusting both.
 */
export function applyMeasured(n) {
  const m = measured(n.community || n.name);
  const out = { ...n, _m: m };

  if (m?.hasPpsf) {
    out.avgPpsf   = m.ppsf;
    out._ppsfEv   = m.ppsfSampleN < THIN_EVIDENCE_BELOW ? EV.THIN : EV.MEASURED;
    out._ppsfN    = m.ppsfSampleN;
    out._ppsfYear = m.ppsfYear;
  } else {
    out._ppsfEv = n.avgPpsf ? EV.ESTIMATE : EV.NONE;
  }

  if (m?.hasYield) {
    out.grossYield = m.grossYield;
    const n0 = Math.min(m.yieldSaleN, m.yieldRentN);
    out._yieldEv    = n0 < THIN_EVIDENCE_BELOW ? EV.THIN : EV.MEASURED;
    out._yieldSaleN = m.yieldSaleN;
    out._yieldRentN = m.yieldRentN;
  } else {
    out._yieldEv = n.grossYield ? EV.ESTIMATE : EV.NONE;
  }

  /* Service charge is never measured — no per-community rate is published — and
     net return is derived from it, so both stay estimates however good the
     price and gross return underneath them are. */
  out._scEv  = n.serviceCharge ? EV.ESTIMATE : EV.NONE;
  out._netEv = n.netYield      ? EV.ESTIMATE : EV.NONE;

  out._hasMeasured = !!(m?.hasPpsf || m?.hasYield);
  return out;
}

/** True when a figure came from counted records rather than a stored guess. */
export const isEvidenced = ev => ev === EV.MEASURED || ev === EV.THIN;

/** How much of a community list the measured data actually covers. */
export function coverage(names = []) {
  let ppsf = 0, yld = 0;
  for (const n of names) {
    if (measuredPpsf(n)) ppsf++;
    if (measuredYield(n)) yld++;
  }
  return { total: names.length, ppsf, yield: yld };
}

/**
 * City-wide reference points, computed from the same records.
 *
 * A number on its own tells an agent nothing. "AED 1,900 per square foot" only
 * means something next to "the middle of Dubai is 1,735". These are the
 * quartiles across the 95 master communities and the 290 yield results.
 */
export const DUBAI_BENCHMARK = {
  ppsf:  { p25: 1422, median: 1735, p75: 2470, basis: "95 master communities, most recent year on record" },
  yield: { p25: 4.9,  median: 5.7,  p75: 6.7,  basis: "290 community and unit-type combinations" },
};

/** Where a figure sits against the rest of Dubai — for a plain-words label. */
export function versusDubai(value, kind) {
  const b = DUBAI_BENCHMARK[kind];
  if (!b || !Number.isFinite(value)) return null;
  if (value >= b.p75)    return { band: "high",   label: "Top quarter of Dubai" };
  if (value >= b.median) return { band: "above",  label: "Above the Dubai middle" };
  if (value >= b.p25)    return { band: "below",  label: "Below the Dubai middle" };
  return { band: "low", label: "Bottom quarter of Dubai" };
}

/**
 * Under this many sales, a median still moves a lot if one unusual deal lands in
 * it. The builder already discards anything below 10; this is the higher bar at
 * which a figure is worth quoting to a client without checking it first.
 */
export const THIN_EVIDENCE_BELOW = 30;

export const MEASURED_META = {
  ppsfSource: "Dubai Land Department sale transactions",
  yieldSource: "Dubai Land Department sales and registered Ejari tenancy contracts",
  generated: HIER.generated,
  ppsfEntities: (HIER.entities || []).length,
  yieldResults: (YIELDS.y || []).length,
};
