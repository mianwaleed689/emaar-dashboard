/**
 * CANONICAL TAXONOMY — one answer per question, for every filter in the product.
 *
 * ── THE CONFUSION THIS ENDS ─────────────────────────────────────────────────
 *
 * A project's type is currently stored in THREE fields that disagree. Measured
 * across all 1,728 projects on 2026-07-31:
 *
 *     propertyType   Apartment 1272 · Villa 210 · Townhouse 61 · empty 184
 *     type           Apartment 1255 · Villa 220 · Townhouse 68 · empty 184
 *     dldClass       empty on all 1,728
 *
 * The same projects, classified differently depending on which field a tab
 * happens to read. Seventeen projects are an apartment in one field and
 * something else in the other. A client filtering for villas on one tab and
 * another on a second tab gets different answers, and neither is wrong — they
 * are reading different columns.
 *
 * This module decides once. Every filter reads from here.
 *
 * ── WHAT IS DELIBERATELY NOT OFFERED ────────────────────────────────────────
 *
 * Hotel apartments, serviced apartments and plots have NO data behind them —
 * `dldClass` is empty on every record and nothing else distinguishes them. They
 * are therefore not offered as filters. Offering a filter that matches nothing
 * is the fault already fixed on the Projects tab, where three of four stage
 * options returned zero results.
 *
 * When the DLD feed supplies unit classes, add them here and every tab gains
 * them at once.
 */

/* ── PROPERTY TYPE ─────────────────────────────────────────────────────────── */

export const PROPERTY_TYPE = {
  APARTMENT: "apartment",
  VILLA: "villa",
  TOWNHOUSE: "townhouse",
  COMMERCIAL: "commercial",
  UNKNOWN: "unknown",
};

export const PROPERTY_TYPE_LABEL = {
  [PROPERTY_TYPE.APARTMENT]: "Apartment",
  [PROPERTY_TYPE.VILLA]: "Villa",
  [PROPERTY_TYPE.TOWNHOUSE]: "Townhouse",
  [PROPERTY_TYPE.COMMERCIAL]: "Commercial",
  [PROPERTY_TYPE.UNKNOWN]: "Type not recorded",
};

const TYPE_ALIASES = {
  apartment: PROPERTY_TYPE.APARTMENT,
  apartments: PROPERTY_TYPE.APARTMENT,
  flat: PROPERTY_TYPE.APARTMENT,
  residential: PROPERTY_TYPE.APARTMENT,
  villa: PROPERTY_TYPE.VILLA,
  villas: PROPERTY_TYPE.VILLA,
  townhouse: PROPERTY_TYPE.TOWNHOUSE,
  townhouses: PROPERTY_TYPE.TOWNHOUSE,
  "town house": PROPERTY_TYPE.TOWNHOUSE,
  commercial: PROPERTY_TYPE.COMMERCIAL,
  office: PROPERTY_TYPE.COMMERCIAL,
  retail: PROPERTY_TYPE.COMMERCIAL,
};

/**
 * The project's type, resolved once.
 *
 * Precedence is `propertyType`, then `type`, then `dldClass`. propertyType wins
 * because it is the more specific name and the field the admin editor writes;
 * where the two disagree this makes the choice explicit rather than leaving it
 * to whichever tab loaded first.
 */
export function propertyTypeOf(project) {
  const candidates = [project?.propertyType, project?.type, project?.dldClass];
  for (const raw of candidates) {
    const key = String(raw || "").toLowerCase().trim();
    if (key && TYPE_ALIASES[key]) return TYPE_ALIASES[key];
  }
  return PROPERTY_TYPE.UNKNOWN;
}

/**
 * Filter options built from the data, so an option can never match zero rows.
 * Counts travel with the labels — a client picking "Villa (210)" knows what
 * they are about to see.
 */
export function propertyTypeOptions(projects = []) {
  const counts = new Map();
  projects.forEach(p => {
    const t = propertyTypeOf(p);
    counts.set(t, (counts.get(t) || 0) + 1);
  });

  return [...counts.entries()]
    .filter(([, n]) => n > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([value, count]) => ({
      value,
      count,
      label: `${PROPERTY_TYPE_LABEL[value]} (${count.toLocaleString()})`,
      /* Unknown is offered LAST and named honestly. 184 projects carry no type
         at all; hiding them would make the filtered totals stop adding up. */
      isGap: value === PROPERTY_TYPE.UNKNOWN,
    }));
}

/* ── SALE TYPE ─────────────────────────────────────────────────────────────── */

export const SALE_TYPE = {
  OFF_PLAN: "off-plan",
  READY: "ready",
};

export const SALE_TYPE_LABEL = {
  [SALE_TYPE.OFF_PLAN]: "Off-plan",
  [SALE_TYPE.READY]: "Ready / secondary",
};

/**
 * Off-plan or ready.
 *
 * Measured: status holds "Off-Plan" 1,576 and "Ready" 152 — clean, unlike the
 * type fields. Construction percentage is the tie-breaker where status is
 * missing, because a project at 100% built is ready whatever the label says.
 */
export function saleTypeOf(project) {
  const status = String(project?.status || "").toLowerCase().trim();
  if (status.includes("ready") || status.includes("complete")) return SALE_TYPE.READY;
  if (status.includes("off")) return SALE_TYPE.OFF_PLAN;

  const pct = Number(project?.constructionPct);
  if (Number.isFinite(pct) && pct >= 100) return SALE_TYPE.READY;
  return SALE_TYPE.OFF_PLAN;
}

export function saleTypeOptions(projects = []) {
  const counts = new Map();
  projects.forEach(p => {
    const t = saleTypeOf(p);
    counts.set(t, (counts.get(t) || 0) + 1);
  });
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([value, count]) => ({
      value,
      count,
      label: `${SALE_TYPE_LABEL[value]} (${count.toLocaleString()})`,
    }));
}

/* ── APPLYING FILTERS ──────────────────────────────────────────────────────── */

/**
 * Apply a filter set to projects. Every filter reads through the resolvers
 * above, so two tabs cannot disagree about what a villa is.
 *
 * @param {Array} projects
 * @param {{propertyType?:string, saleType?:string, community?:string, developer?:string}} filters
 */
export function applyFilters(projects = [], filters = {}) {
  const norm = s => String(s || "").toLowerCase().trim();

  return projects.filter(p => {
    if (filters.propertyType && filters.propertyType !== "All"
        && propertyTypeOf(p) !== filters.propertyType) return false;

    if (filters.saleType && filters.saleType !== "All"
        && saleTypeOf(p) !== filters.saleType) return false;

    if (filters.community && filters.community !== "All"
        && norm(p.community) !== norm(filters.community)) return false;

    if (filters.developer && filters.developer !== "All") {
      const dev = norm(p.developerActual || p.developer || p.developerName);
      if (dev !== norm(filters.developer)) return false;
    }

    return true;
  });
}

/**
 * What a filter combination will return, BEFORE the user applies it.
 *
 * The point is to make an empty result impossible to reach by accident: a
 * combination yielding nothing can be disabled or labelled "0" rather than
 * leaving a client staring at a blank list wondering if the product is broken.
 */
export function previewCount(projects, filters) {
  return applyFilters(projects, filters).length;
}
