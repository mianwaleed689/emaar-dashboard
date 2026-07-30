/**
 * Dubai market facts — single source of truth.
 *
 * These figures were previously hardcoded independently in MarketTab.jsx and
 * OverviewTab.jsx. They drifted: correcting the average PPSF in one left the
 * other showing a stale value that was ~10% too high.
 *
 * Every entry carries its source and as-of date. Anything that could not be
 * traced to a published source is marked `verified: false` — those must not be
 * quoted to a client until sourced.
 *
 * Verified 2026-07-29 against DLD, ValuStrat and press coverage.
 */

export const MARKET_FACTS = {
  totalValue2025: {
    value: "AED 917B",
    change: "+20% YoY",
    note: "Sales + mortgages + gifts",
    source: "Dubai Land Department, FY2025",
    asOf: "2025-12-31",
    verified: true,
  },
  investments2025: {
    value: "AED 680B",
    change: "+29% YoY",
    note: "258,600 deals — investments only, excludes mortgages and gifts",
    source: "Dubai Land Department, FY2025",
    asOf: "2025-12-31",
    verified: true,
  },
  totalTransactions2025: {
    value: "270,000+",
    change: "+20% YoY",
    note: "5th consecutive record year",
    source: "Dubai Land Department, FY2025",
    asOf: "2025-12-31",
    verified: true,
  },
  avgPpsf2025: {
    value: "AED 1,692",
    change: "+19.8% YoY",
    note: "Citywide residential median, 192,808 transactions",
    source: "Dubai Land Department transaction data, FY2025",
    asOf: "2025-12-31",
    verified: true,
  },
  capitalValueGrowth2025: {
    value: "+19.8%",
    change: "Villas +25.1% · Apartments +14.2%",
    note: "ValuStrat Price Index 240.4 points (index, not AED/sqft)",
    source: "ValuStrat VPI, December 2025",
    asOf: "2025-12-31",
    verified: true,
  },
  investorBase2025: {
    value: "193,100",
    change: "+24% YoY",
    note: "Including 129,600 new investors (+23%)",
    source: "Dubai Land Department, FY2025",
    asOf: "2025-12-31",
    verified: true,
  },
  womenInvestors2025: {
    value: "AED 154B",
    change: "+31% value · +24% deals",
    note: "76,700 deals",
    source: "Dubai Land Department, FY2025",
    asOf: "2025-12-31",
    verified: true,
  },
  residentialSales2025: {
    value: "214,912",
    change: "+18.9% volume · +30.7% value",
    note: "AED 682.5B in sales · up from 180,860 deals in 2024",
    source: "Dubai Land Department, FY2025",
    asOf: "2025-12-31",
    verified: true,
  },
  mortgageDeals2025: {
    value: "50,974",
    change: "+22.5% YoY",
    note: "AED 179.26B in mortgage transactions",
    source: "Dubai Land Department, FY2025",
    asOf: "2025-12-31",
    verified: true,
  },
  giftTransactions2025: {
    value: "9,556",
    change: "AED 57.25B",
    note: "Gift transfers — the third component of the AED 917B total",
    source: "Dubai Land Department, FY2025",
    asOf: "2025-12-31",
    verified: true,
  },
  q4_2025Record: {
    value: "AED 187.47B",
    change: "Highest quarter on record",
    note: "Dec AED 64.82B · Nov AED 64.22B · Oct AED 58.43B",
    source: "Dubai Land Department, Q4 2025",
    asOf: "2025-12-31",
    verified: true,
  },
  yieldApartments2025: {
    value: "7.2%",
    change: "Gross rental yield",
    note: "Apartments outperform villas on yield",
    source: "REIDIN / DXB Interact, 2025",
    asOf: "2025-12-31",
    verified: true,
  },
  yieldVillas2025: {
    value: "4.9%",
    change: "Gross rental yield",
    note: "Lower yield, higher capital growth (+25.1% in 2025)",
    source: "REIDIN / DXB Interact, 2025",
    asOf: "2025-12-31",
    verified: true,
  },
  offPlanShare2025: {
    value: "over 70%",
    change: "of total transactions",
    note: "Off-plan dominated 2025 volume",
    source: "Khaleej Times / DLD, FY2025",
    asOf: "2025-12-31",
    verified: true,
  },
  q1_2026Value: {
    value: "AED 252B",
    change: "+31% YoY",
    note: "Q1 2026 transactions",
    source: "Dubai Land Department, Q1 2026",
    asOf: "2026-03-31",
    verified: true,
  },

  /* ── UNVERIFIED — could not be traced to a published source ──
     Do not quote these to a client until sourced. Left in place rather than
     deleted, in case they come from a subscription report we cannot reach. */
  activeDevelopers2025: {
    value: "228",
    change: "+40% from 163 in 2024",
    /* UNVERIFIED. Do NOT label this "RERA registered" — the RERA registry holds
       2,200+ licensed developer entities as of January 2026. 228 plausibly means
       developers who launched projects during 2025, which is a different measure
       and needs its own source before being quoted. */
    note: "UNVERIFIED — RERA registry holds 2,200+ licensed developers",
    source: null,
    asOf: null,
    verified: false,
  },
  unitsLaunched2025: {
    value: "131,504",
    change: "By Oct 2025",
    note: "UNVERIFIED — no published source found",
    source: null,
    asOf: null,
    verified: false,
  },
  avgGrossYield2025: {
    value: "6.55%",
    change: "Apts 7.2% · Villas 4.9%",
    note: "UNVERIFIED — REIDIN is paywalled, figure not independently confirmed",
    source: "REIDIN (unconfirmed)",
    asOf: "2025-12-31",
    verified: false,
  },
  /* ── 2026 ────────────────────────────────────────────────────────────────
     Everything above is FY2025 and carries a 2025-12-31 as-of date. Added
     2026-07-30 so the Overview is not presenting a seven-month-old picture as
     the current one. */

  q1_2026Value: {
    value: "AED 252B",
    change: "+31% YoY",
    note: "60,303 transactions, +6% volume — value growing faster than volume",
    source: "Dubai Land Department, reported Q1 2026",
    asOf: "2026-03-31",
    verified: true,
  },
  q1_2026Ppsf: {
    value: "AED 1,759",
    change: "+12.5% YoY",
    note: "Citywide average price per square foot, Q1 2026",
    source: "Q1 2026 market reporting",
    asOf: "2026-03-31",
    verified: true,
  },
};

/**
 * H1 2026 is deliberately NOT stated as a single figure.
 *
 * Checked on 2026-07-30, three published sources give three different answers
 * because each measures a different scope:
 *
 *   49,401 transactions / AED 182.9B   Provident Estate, residential
 *   79,281 transactions / AED 221.4B   residential sales
 *   86,005 transactions / AED 286.43B  Dubai Chronicle, all residential
 *                                       (71,570 units + 7,301 buildings
 *                                        + 7,134 land parcels)
 *
 * They are not contradictory so much as differently scoped — land parcels and
 * whole buildings account for most of the spread. Picking one and printing it as
 * "H1 2026" would be false precision, so the Overview shows the range with each
 * scope named, and leans on Q1 2026 above, which is corroborated.
 *
 * The same applies to yield: Dubai Chronicle states plainly that 2026 yield
 * figures "have not yet been finalized by the market bodies that publish them."
 * The most recent confirmed citywide figure is 7.0% (apartments 5.7%). The
 * platform therefore leads with its OWN computed median net yield, which is
 * defensible because the calculation is shown, rather than quoting a market
 * number nobody has published yet.
 */
export const H1_2026_RANGE = {
  label: "H1 2026 transactions",
  low: { value: "49,401", aed: "AED 182.9B", scope: "Residential", source: "Provident Estate" },
  high: { value: "86,005", aed: "AED 286.43B", scope: "All residential incl. land and buildings", source: "Dubai Chronicle" },
  note: "Published H1 2026 totals differ by scope — land parcels and whole buildings account for most of the spread.",
  asOf: "2026-06-30",
  provisional: true,
};

/** True when a fact is safe to present without a caveat. */
export function isVerified(key) {
  return MARKET_FACTS[key]?.verified === true;
}
