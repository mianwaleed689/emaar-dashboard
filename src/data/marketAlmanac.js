/**
 * DUBAI PROPERTY ALMANAC — the record, moment by moment
 *
 * ── WHAT THIS IS ────────────────────────────────────────────────────────────
 *
 * A dated record of what happened in Dubai property and what it did to the
 * market. Not a price chart — a chart tells you the market fell in 2008. This
 * tells you it fell because credit vanished in September 2008, that Dubai World
 * then asked to suspend repayment on about USD 25 billion in November 2009,
 * that roughly 450 projects were abandoned, and that home prices ended 64% below
 * their mid-2008 peak.
 *
 * That is the difference between data and education, and it is the thing no
 * Dubai property site publishes — because none of them benefits from a buyer
 * reading about 2009.
 *
 * ── THE RULE ────────────────────────────────────────────────────────────────
 *
 * Every figure carries a named source. No entry may be added without one. Where
 * sources disagree, both are given with their scope rather than a midpoint. An
 * entry with `sources: []` is a bug, not a draft.
 *
 * ── HOW TO ADD A PERIOD ─────────────────────────────────────────────────────
 *
 * Append to ALMANAC. `id` is `YYYY` or `YYYY-MM`. Fill only what you can source;
 * every field is optional except `id`, `label` and `sources`. Missing fields
 * render as "not recorded" rather than as zero, so a gap in the record is
 * visible rather than silently filled.
 *
 * Coverage today is deliberately partial: the pivotal moments are in, and the
 * routine months are not. The UI states how many periods are covered so the
 * gaps are honest.
 */

export const ALMANAC_AS_OF = "2026-07-31";

/** What kind of moment this was — drives colour and grouping. */
export const MOMENT = {
  REFORM: "reform",       // a law or regulation changed
  RECORD: "record",       // an all-time high
  SHOCK: "shock",         // a sudden negative event
  RECOVERY: "recovery",   // the market turning back up
  MILESTONE: "milestone", // structurally significant, neither good nor bad
};

export const MOMENT_COLOR = {
  [MOMENT.REFORM]: "#9F7AEA",
  [MOMENT.RECORD]: "#68D391",
  [MOMENT.SHOCK]: "#FC8181",
  [MOMENT.RECOVERY]: "#63B3ED",
  [MOMENT.MILESTONE]: "#D4A843",
};

export const MOMENT_LABEL = {
  [MOMENT.REFORM]: "Reform",
  [MOMENT.RECORD]: "Record",
  [MOMENT.SHOCK]: "Shock",
  [MOMENT.RECOVERY]: "Recovery",
  [MOMENT.MILESTONE]: "Milestone",
};

/**
 * The record. Newest last.
 *
 * metrics    — what the numbers were
 * whatHappened — the event, in plain language
 * effect     — what it did to the market, specifically
 * whoInvested — who was buying, where that is documented
 * lesson     — why it matters to someone deciding today
 * sources    — every claim above must trace to one of these
 */
export const ALMANAC = [
  {
    id: "2002-05",
    label: "May 2002",
    moment: MOMENT.REFORM,
    headline: "Freehold ownership opens Dubai to the world",
    whatHappened:
      "Dubai permitted foreign nationals to own property outright in designated areas for the first time. Before this there was effectively no international property market here.",
    effect:
      "Created the market. Everything that follows — two booms and two falls — traces back to the demand this unlocked.",
    lesson:
      "Dubai's property market is roughly one generation old. Long-run averages carry less weight here than in London or New York, because the run is short.",
    sources: ["UAE freehold legislation, 2002"],
  },
  {
    id: "2008-09",
    label: "September 2008",
    moment: MOMENT.SHOCK,
    headline: "The boom stops",
    metrics: {
      priceChange: "−50% over the following period; −64% from the mid-2008 peak",
    },
    whatHappened:
      "The global financial crisis reached Dubai. Credit was withdrawn, and the speculative off-plan demand that had driven prices several hundred per cent since 2003 disappeared almost at once.",
    effect:
      "Prices tumbled roughly 50%. Deutsche Bank measured home prices 64% below their mid-2008 peak. Around 450 projects across the emirate were abandoned, and stalled construction sites became a common sight.",
    whoInvested:
      "Buying stopped. Much of the preceding volume had been speculative — units bought off-plan and resold before completion, sometimes repeatedly — and that demand had no reason to remain.",
    lesson:
      "The steepest part of a rise is the least stable. The 2007–08 surge was driven largely by people who never intended to own the asset, and it was the first thing to vanish.",
    sources: [
      "Deutsche Bank AG — home prices 64% below mid-2008 peak",
      "Published market histories of the 2008–09 crisis",
    ],
  },
  {
    id: "2009-11",
    label: "November 2009",
    moment: MOMENT.SHOCK,
    headline: "Dubai World seeks a debt standstill",
    whatHappened:
      "Dubai World — the state-controlled holding company that then owned Nakheel — asked to suspend repayments on approximately USD 25–26 billion of debt.",
    effect:
      "Global markets moved. The cost of insuring Dubai's debt against default rose and bond prices fell; Nakheel's Islamic bond dropped more than 20 points to 87. Dubai and Abu Dhabi bourses fell. Nakheel had posted a first-half loss of AED 13.4 billion (USD 3.65 billion) and halted work on projects including the Deira and Jebel Ali islands.",
    lesson:
      "The crash had a second act more than a year after the first. Recovery from a credit event is rarely a single moment, and the developer you buy from matters as much as the community.",
    sources: [
      "Al Jazeera, 25 November 2009 — Dubai World seeks debt moratorium",
      "Bloomberg / Arabian Business — Nakheel H1 loss AED 13.4bn; wrote off USD 21.4bn after the crash",
    ],
  },
  {
    id: "2013-10",
    label: "October 2013",
    moment: MOMENT.REFORM,
    headline: "Central Bank caps mortgage lending",
    whatHappened:
      "The UAE Central Bank issued mortgage regulations limiting loan-to-value: up to 80% for citizens on a first home under AED 5 million, 75% for expatriates on the same terms, and no more than 50% of value for off-plan property before construction begins.",
    effect:
      "Directly constrained the leverage that had amplified the 2008 crash. This is the regulation, alongside escrow accounts and RERA oversight, that separates the structure of today's market from 2008's.",
    lesson:
      "When someone says this market is different now, this is a large part of what they mean. It is a real structural change, and it is also not a guarantee.",
    sources: [
      "UAE Central Bank mortgage regulations, October 2013",
      "CBUAE Circular 31/2013, later amended by Board Resolution 31/2/2020",
    ],
  },
  {
    id: "2013-11",
    label: "November 2013",
    moment: MOMENT.MILESTONE,
    headline: "Dubai wins Expo 2020",
    metrics: {
      transactions: "77,641 (FY2013)",
      value: "AED 143.47B (FY2013)",
    },
    whatHappened:
      "Dubai won the right to host Expo 2020, at the end of a year that set records: 77,641 transactions worth AED 143.47 billion, both all-time highs at the time.",
    effect:
      "Optimism carried into 2014. Much of the win had already been priced in — values had risen substantially over the preceding year in anticipation. Prices rose roughly 25–30% between 2012 and 2014, recovering about half the ground lost in the crash.",
    whoInvested:
      "Regional capital seeking safety amid instability in Egypt and Syria, alongside genuine employment growth from diversification into tourism, logistics and finance.",
    lesson:
      "Anticipated news is priced before it is announced. By the time an event is confirmed, the gain is often already in the number.",
    sources: [
      "CEIC — Dubai transactions all-time high 77,641 units and AED 143,466.68mn in 2013",
      "Published market histories — Expo 2020 bid won November 2013",
    ],
  },
  {
    id: "2014-2019",
    label: "2014 – 2019",
    moment: MOMENT.SHOCK,
    headline: "The long correction — the downturn nobody talks about",
    metrics: { priceChange: "−25% to −35% from the mid-2014 peak" },
    whatHappened:
      "After peaking in mid-2014 the market fell for close to five years — the longest downturn in its history. Oversupply, the oil price collapse, a stronger dollar and the introduction of VAT in 2018 all pressed in the same direction.",
    effect:
      "Prices ended roughly a quarter to a third below their 2014 peak. There was no crash headline. The market simply drifted lower while supply kept arriving.",
    lesson:
      "This, not 2008, is the scenario most likely to catch a buyer out: a slow decline with no obvious moment to exit. Supply caused it then, and supply is the pressure point again in 2026.",
    sources: ["Published market histories — mid-2014 peak to 2019 trough"],
  },
  {
    id: "2020-03",
    label: "March 2020",
    moment: MOMENT.SHOCK,
    headline: "COVID-19 closes the market",
    metrics: { priceChange: "−5% to −10%", transactions: "~51,414 (FY2020)" },
    whatHappened:
      "Borders closed and transactions stalled. Dubai then reopened to visitors far earlier than most competing cities and introduced remote-work permits and expanded golden visa routes.",
    effect:
      "A shallow dip rather than a collapse, and short-lived. The policy response converted a health crisis into a migration event.",
    lesson:
      "The mildest downturn in the record, and the one that set up the strongest rise. The response mattered more than the shock.",
    sources: ["Dubai Land Department transaction data, FY2020"],
  },
  {
    id: "2022-12",
    label: "December 2022",
    moment: MOMENT.RECORD,
    headline: "A record year closes above AED 528 billion",
    metrics: {
      transactions: "9,073 in December; 122,658 across FY2022",
      value: "AED 25.39B in December; AED 528B across FY2022",
      medianPpsf: "AED 1,378 all-type median (December)",
      priceChange: "+1.7% in December alone; +12.7% YoY capital values",
    },
    whatHappened:
      "December closed a record-breaking year. Residential prices rose a further 1.7% in the month, defying the usual end-of-year slowdown. Average property values crossed AED 2 million for the first time in four years.",
    effect:
      "Off-plan continued a steep upward trajectory, reaching nearly 44% of total sales value for the year as investor confidence surged.",
    whoInvested:
      "Demand concentrated in core communities — Dubai Marina, Downtown Dubai, Palm Jumeirah and Business Bay for apartments; Dubai Hills Estate and Arabian Ranches for villas.",
    lesson:
      "A record December is not the same as a sustainable one. This month is the clearest example in the record of momentum outrunning seasonality — worth remembering when a single strong month is presented as a trend.",
    sources: [
      "DXB Interact — 9,073 deals, AED 25.39B, all-type median AED 1,378/sqft, December 2022",
      "Property Monitor — residential prices +1.7% in December 2022",
      "ValuStrat — residential capital values +12.7% YoY to December 2022",
    ],
  },
  {
    id: "2025-12",
    label: "FY2025",
    moment: MOMENT.RECORD,
    headline: "Fifth consecutive record year",
    metrics: {
      transactions: "270,000+",
      value: "AED 917B (sales, mortgages and gifts)",
      medianPpsf: "AED 1,692 citywide residential median",
      priceChange: "+19.8% capital values (ValuStrat VPI)",
    },
    whatHappened:
      "AED 917 billion across more than 270,000 transactions, with 193,100 active investors including 129,600 new ones — the largest investor base in DLD records.",
    effect:
      "Sales alone reached AED 682.5B across 214,912 deals; mortgages AED 179.26B across 50,974.",
    lesson:
      "Five consecutive records is remarkable, and is by definition the longest this market has ever run without a pause.",
    sources: [
      "Dubai Land Department, FY2025",
      "ValuStrat VPI, December 2025 — index 240.4 points",
    ],
  },
  {
    id: "2026-03",
    label: "Q1 2026",
    moment: MOMENT.MILESTONE,
    headline: "Growth continues, but slower",
    metrics: {
      transactions: "60,303",
      value: "AED 252B",
      medianPpsf: "AED 1,759 citywide average",
      priceChange: "+31% value YoY, +6% volume YoY; PPSF +12.5% YoY",
    },
    whatHappened:
      "Another quarterly value record, but with value growing far faster than volume — a sign of a market maturing rather than accelerating.",
    effect:
      "Consensus growth for the full year is 5–8%, well below 2025's 19.8%. Some 131,234 units are expected in 2026 and 200,000–300,000 by 2028. Mortgage-funded activity has risen to 36% of transactions.",
    lesson:
      "Growth slowing from 20% to 5–8% is not a downturn. What to watch is whether supply outruns absorption in the communities carrying the heaviest delivery — the mechanism that produced 2014–2019.",
    sources: [
      "Dubai Land Department, Q1 2026 reporting",
      "Provident Estate monthly reports, compiled from DLD records",
      "2026 supply and price outlooks",
    ],
  },
];

/** Periods covered, so the UI can state coverage honestly rather than imply completeness. */
export function almanacCoverage() {
  const years = new Set(ALMANAC.map(e => String(e.id).slice(0, 4)));
  return {
    entries: ALMANAC.length,
    years: years.size,
    earliest: ALMANAC[0]?.label ?? null,
    latest: ALMANAC[ALMANAC.length - 1]?.label ?? null,
  };
}

/** Every distinct source cited, for a bibliography view. */
export function allSources() {
  const set = new Set();
  ALMANAC.forEach(e => (e.sources || []).forEach(s => set.add(s)));
  return [...set].sort();
}

/** Entries of a given moment type. */
export function byMoment(moment) {
  return ALMANAC.filter(e => e.moment === moment);
}
