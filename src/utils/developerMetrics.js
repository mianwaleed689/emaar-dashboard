/**
 * DEVELOPER METRICS — computed from the project catalogue, not asserted.
 *
 * ── WHAT THIS REPLACES ──────────────────────────────────────────────────────
 *
 * CompetitorsTab carried hardcoded profiles with ten invented sub-scores per
 * developer:
 *
 *     scores: { overall:97, salesVolume:100, deliveryRecord:98,
 *               financialStrength:98, pricePoint:82, yieldPotential:72,
 *               brandStrength:100, landBank:95, offPlanStrength:95,
 *               communityQuality:98 }
 *
 * Nothing computed those numbers. Nothing updated them. "deliveryRecord: 98"
 * is a claim that a developer completes 98% of something, on time, measured
 * how — and there is no delivery data in this platform at all. Alongside them
 * sat "95%+ on-time delivery" and "140,000+ units delivered lifetime", neither
 * traceable to anything.
 *
 * A score with no formula is an opinion wearing the costume of a measurement,
 * and an agent who repeats it to a client is exposed the moment they are asked
 * where it came from.
 *
 * ── WHAT REPLACES IT ────────────────────────────────────────────────────────
 *
 * Only what the project catalogue can actually support. Measured across all
 * 1,728 projects on 2026-07-31: every one attributes to a developer, giving 615
 * distinct developers — Emaar 119 projects across 15 communities at a median
 * AED 2,007/sqft, DAMAC 59 across 11 at 1,482, Nakheel 53 across 12 at 1,492.
 *
 * Those are facts an agent can stand behind. Where a genuinely useful metric
 * has no data behind it — delivery record above all — this returns null and the
 * UI says so, rather than filling the gap with a number.
 */

/** Fields a project might carry its developer under, in order of preference. */
function developerOf(project) {
  return String(
    project?.developerActual || project?.developer || project?.developerName || ""
  ).trim();
}

function median(values) {
  const n = values.filter(v => Number.isFinite(v) && v > 0).sort((a, b) => a - b);
  if (!n.length) return null;
  const mid = Math.floor(n.length / 2);
  return n.length % 2 ? n[mid] : (n[mid - 1] + n[mid]) / 2;
}

/**
 * Compute per-developer metrics from the project catalogue.
 *
 * @param {Array} projects
 * @returns {Map<string, object>} keyed by developer name
 */
export function computeDeveloperMetrics(projects = []) {
  const acc = new Map();

  projects.forEach(p => {
    const name = developerOf(p);
    if (!name) return;

    if (!acc.has(name)) {
      acc.set(name, {
        name,
        projectCount: 0,
        communities: new Set(),
        ppsf: [],
        prices: [],
        stages: {},
        withHandover: 0,
      });
    }
    const d = acc.get(name);

    d.projectCount++;
    if (p.community) d.communities.add(String(p.community).trim());

    const ppsf = Number(p.ppsf);
    if (Number.isFinite(ppsf) && ppsf > 0) d.ppsf.push(ppsf);

    const price = Number(p.priceMin);
    if (Number.isFinite(price) && price > 0) d.prices.push(price);

    const stage = String(p.status || "Unknown").trim();
    d.stages[stage] = (d.stages[stage] || 0) + 1;

    if (p.handover || p.expectedHandover) d.withHandover++;
  });

  const totalProjects = projects.length || 1;

  const out = new Map();
  acc.forEach((d, name) => {
    out.set(name, {
      name,
      projectCount: d.projectCount,
      /* Share of the catalogue, not of the market. Named precisely because
         "market share" would imply transaction value, which this does not
         measure. */
      catalogueSharePct: (d.projectCount / totalProjects) * 100,
      communityCount: d.communities.size,
      communities: [...d.communities].sort(),
      medianPpsf: median(d.ppsf),
      ppsfSampleSize: d.ppsf.length,
      entryPrice: d.prices.length ? Math.min(...d.prices) : null,
      stages: d.stages,
      handoverKnownPct: d.projectCount ? (d.withHandover / d.projectCount) * 100 : 0,

      /* Deliberately null. There is no delivery-performance data in this
         platform, so any figure here would be invented. The UI must render
         "not recorded" rather than a number. */
      deliveryRecord: null,
      creditRating: null,
      unitsDeliveredLifetime: null,
    });
  });

  return out;
}

/** Top developers by project count. */
export function rankDevelopers(metrics, limit = 10) {
  return [...metrics.values()]
    .sort((a, b) => b.projectCount - a.projectCount)
    .slice(0, limit);
}

/**
 * Metrics for two developers side by side, with the fields that cannot be
 * computed listed explicitly so a comparison never looks more complete than it
 * is.
 */
export function compareDevelopers(metrics, nameA, nameB) {
  const a = metrics.get(nameA) || null;
  const b = metrics.get(nameB) || null;

  const COMPARABLE = [
    { key: "projectCount",      label: "Projects tracked",        format: v => v?.toLocaleString() ?? "—" },
    { key: "communityCount",    label: "Communities active in",   format: v => v?.toLocaleString() ?? "—" },
    { key: "medianPpsf",        label: "Median price per sqft",   format: v => (v ? `AED ${Math.round(v).toLocaleString()}` : "not recorded") },
    { key: "entryPrice",        label: "Lowest entry price",      format: v => (v ? `AED ${(v / 1e6).toFixed(2)}M` : "not recorded") },
    { key: "catalogueSharePct", label: "Share of tracked projects", format: v => (v ? `${v.toFixed(1)}%` : "—") },
  ];

  /* Named so the gap is visible. A comparison that silently omits delivery
     record implies we simply chose not to show it; saying it is unavailable is
     the honest version, and tells the agent what to ask the developer. */
  const NOT_AVAILABLE = [
    "On-time delivery record — no delivery data in this platform",
    "Credit rating — not tracked",
    "Units delivered lifetime — not tracked",
    "Buyer nationality mix — not tracked",
  ];

  return { a, b, comparable: COMPARABLE, notAvailable: NOT_AVAILABLE };
}
