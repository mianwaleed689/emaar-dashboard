/**
 * MAP METRICS AND COLOUR SCALES
 *
 * ── WHAT MAKES THIS MAP DIFFERENT ───────────────────────────────────────────
 *
 * Every Dubai property map — DXB Interact, the portals, the agency tools —
 * plots price. Some plot transaction volume. All of them present every pin with
 * identical confidence, because none of them tracks how solid the underlying
 * number is.
 *
 * This one does. 94 of 193 communities have a price or a return counted from
 * Land Department records; the other 99 carry stored estimates. A map that draws
 * those two kinds of pin the same way is telling a comfortable lie.
 *
 * So provenance is a visual property here, not a footnote: measured communities
 * render solid, estimates render hollow. An agent can see, at a glance, which
 * parts of the city they can quote hard and which need a caveat — which is
 * exactly the conversation they are paid to have.
 *
 * ── ON QUANTILE BREAKS ──────────────────────────────────────────────────────
 *
 * Colour bands are quantiles, not equal intervals. Dubai's price distribution is
 * heavily skewed — a handful of communities above AED 4,000/sqft against a long
 * tail near 1,000 — so equal intervals would put four fifths of the city in one
 * colour and tell a reader nothing. Quantiles guarantee every band is populated.
 */

/** Metrics a user can paint the map by. */
export const MAP_METRICS = [
  {
    key: "netYield",
    label: "Net yield",
    unit: "%",
    hint: "After service charges, 5% vacancy and 5% management",
    get: c => num(c.netYield),
    format: v => `${v.toFixed(1)}%`,
    /* High yield is good, so the scale runs cool-to-warm with warm as high. */
    palette: ["#1E3A5F", "#2E6F9E", "#4BA3C7", "#7FD1AE", "#68D391"],
    goodHigh: true,
    /* Derived from the service charge, which no source publishes per community.
       Never measured, whatever the price and gross yield underneath it. */
    evidenced: false,
  },
  {
    key: "ppsf",
    label: "Price per sqft",
    unit: "AED",
    hint: "Community median, AED per square foot",
    get: c => num(c.medianPPSF ?? c.avgPpsf ?? c.ppsf),
    format: v => `AED ${Math.round(v).toLocaleString()}`,
    palette: ["#2D4A22", "#5A7D2A", "#B8A03A", "#D4A843", "#E8C468"],
    goodHigh: null,
    evidenced: true,
  },
  {
    key: "grossYield",
    label: "Gross yield",
    unit: "%",
    hint: "Before costs — shown for comparison with portal figures",
    get: c => num(c.grossYield),
    format: v => `${v.toFixed(1)}%`,
    palette: ["#1E3A5F", "#2E6F9E", "#4BA3C7", "#7FD1AE", "#68D391"],
    goodHigh: true,
    evidenced: true,
  },
  {
    key: "serviceCharge",
    label: "Service charge",
    unit: "AED/sqft",
    hint: "The cost that turns a good gross yield into an ordinary net one",
    get: c => num(c.serviceCharge),
    format: v => `AED ${v.toFixed(1)}`,
    /* High service charge is bad, so the warm end is the expensive end. */
    palette: ["#68D391", "#7FD1AE", "#E8C468", "#F6AD55", "#FC8181"],
    goodHigh: false,
    /* No per-community service charge rate is published anywhere. */
    evidenced: false,
  },
];

function num(v) {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/**
 * Quantile breakpoints for a metric across the given communities.
 * Returns null when there is not enough data to band meaningfully.
 */
export function quantileBreaks(communities, metric, bands = 5) {
  const values = (communities || [])
    .map(metric.get)
    .filter(v => v !== null)
    .sort((a, b) => a - b);

  if (values.length < bands) return null;

  const breaks = [];
  for (let i = 1; i < bands; i++) {
    breaks.push(values[Math.floor((i / bands) * values.length)]);
  }
  return { breaks, min: values[0], max: values[values.length - 1], count: values.length };
}

/** Which colour band a value falls into. */
export function bandFor(value, breaks) {
  if (value === null || !breaks) return null;
  let i = 0;
  while (i < breaks.breaks.length && value >= breaks.breaks[i]) i++;
  return i;
}

export function colourFor(value, metric, breaks) {
  const band = bandFor(value, breaks);
  if (band === null) return "#3A4553";          // no data — deliberately grey
  return metric.palette[Math.min(band, metric.palette.length - 1)];
}

/**
 * Legend rows with human labels and the count in each band, so a reader can see
 * the distribution rather than guess at it.
 */
export function legendFor(communities, metric, breaks) {
  if (!breaks) return [];
  const counts = new Array(metric.palette.length).fill(0);
  (communities || []).forEach(c => {
    const v = metric.get(c);
    const b = bandFor(v, breaks);
    if (b !== null) counts[Math.min(b, counts.length - 1)]++;
  });

  const edges = [breaks.min, ...breaks.breaks, breaks.max];
  return metric.palette.map((colour, i) => ({
    colour,
    from: edges[i],
    to: edges[i + 1],
    label: `${metric.format(edges[i])} – ${metric.format(edges[i + 1])}`,
    count: counts[i],
  }));
}

/**
 * Is this community's figure a measurement or an inherited estimate?
 *
 * This used to guess: it returned true whenever a free-text `source` field
 * happened to contain the string "dld", which is a claim about a label rather
 * than about the number. Since 2026-08-02 the answer is a fact —
 * measuredCommunity.js stamps `_ppsfEv` and `_yieldEv` on every community from
 * the counted Land Department datasets, and this reads those.
 *
 * The stored heuristics are kept as a fallback for any caller that has not run
 * a record through applyMeasured() yet.
 */
export function isMeasured(community) {
  if (!community) return false;
  const ev = [community._ppsfEv, community._yieldEv];
  if (ev.some(Boolean)) return ev.some(e => e === "measured" || e === "thin");

  if (community.verified === false) return false;
  if (Number(community.valueSharedWith) > 0) return false;
  const src = `${community.source || ""} ${community.scoreSource || ""}`.toLowerCase();
  return src.includes("dld");
}

/** Coordinates in either shape. Returns null when neither is usable. */
export function coordsOf(row) {
  const lat = Number(row?.lat ?? row?.coordinates?.lat);
  const lng = Number(row?.lng ?? row?.coordinates?.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  /* Dubai bounding box — guards against a transposed or zeroed pair putting a
     pin in the Gulf of Guinea. */
  if (lat < 24.4 || lat > 25.6 || lng < 54.5 || lng > 56.2) return null;
  return { lat, lng };
}

/** How much of the set can actually be drawn — stated, never hidden. */
export function coverage(communities) {
  const total = (communities || []).length;
  const plotted = (communities || []).filter(c => coordsOf(c)).length;
  const measured = (communities || []).filter(isMeasured).length;
  return { total, plotted, missing: total - plotted, measured, estimated: total - measured };
}
