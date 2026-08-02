/**
 * LANDING PAGE FACTS — single source of truth
 * ═════════════════════════════════════════════════════════════════════════════
 *
 * Every number shown on the marketing site lives here, with the source it came
 * from and the date it was verified. Nothing on the landing page may be a bare
 * literal in JSX.
 *
 * ── WHY THIS FILE EXISTS ────────────────────────────────────────────────────
 *
 * Audited 2026-08-01. The landing page carried, as hardcoded literals:
 *
 *   "208 projects"        (7 places)  — the app's own Projects tab shows 1,552
 *   "13 Communities"                  — the registry holds 49
 *   "AED 919B"                        — the official DLD figure is AED 917B
 *   "23 Tools"                        — 8 of the 23 named do not work
 *   3 named testimonials              — no source, unverifiable
 *   a competitor table                — asserted Bayut has no DLD history. It does.
 *
 * `useState({ users: 24, projects: 208 })` meant none of it could ever update.
 *
 * ── THE RULE ────────────────────────────────────────────────────────────────
 *
 * A claim ships only with `source` and `verifiedAt`. If you cannot fill those
 * in, the claim does not go on the page. `status` marks anything not yet
 * independently checked.
 */

/* ── DUBAI MARKET — official DLD / UAE government figures ───────────────── */

export const MARKET_2025 = {
  totalValueAED: 917_000_000_000,
  totalValueLabel: "AED 917B",
  transactions: 270_000,
  transactionsLabel: "270,000+",
  salesTransactions: 214_912,
  salesTransactionsLabel: "214,912",
  growthYoY: "+20%",
  investorsThousands: 193.1,
  investmentValueLabel: "AED 680B",
  source: "Dubai Land Department, via UAE Public Debt Management Office",
  sourceUrl:
    "https://dmo.dof.gov.ae/en/news-and-publications/latest-press-releases/dubai-s-real-estate-market-records-new-historic-milestone-with-transactions-exceeding-aed917-billion-usd-2497-bn-in-2025/",
  verifiedAt: "2026-08-01",
  status: "verified",
};

export const MARKET_Q1_2026 = {
  valueLabel: "AED 252B",
  transactions: 60_303,
  growthYoY: "+31%",
  investors: 48_448,
  foreignInvestmentLabel: "AED 148.35B",
  publishedAt: "2026-04-09",
  source: "Dubai Land Department",
  sourceUrl:
    "https://dubailand.gov.ae/en/news-media/dubai-s-real-estate-transactions-surge-31-to-reach-aed-252-billion-in-q1-2026/",
  verifiedAt: "2026-08-01",
  status: "verified",
};

/* ── THE PLATFORM — counted from this codebase, not aspirational ────────── */

export const PLATFORM = {
  projects: {
    value: 1552,
    label: "1,552",
    note: "unique projects rendered by the Projects tab",
    source: "Firestore `projects` collection, deduplicated by id",
    verifiedAt: "2026-08-01",
    status: "verified",
  },
  communities: {
    value: 49,
    label: "49",
    note: "curated community records across 7 developers",
    source: "src/communities/*.communities.js",
    verifiedAt: "2026-08-01",
    status: "verified",
  },
  developers: {
    value: 7,
    label: "7",
    note: "developers with full curated community and financial coverage",
    source: "src/communities/index.js",
    verifiedAt: "2026-08-01",
    status: "verified",
  },
  dldRegisteredDevelopers: {
    value: 2317,
    label: "2,317",
    note: "developers in the DLD registry held locally",
    source: "DLD open data — developers export, 2026-07-01",
    verifiedAt: "2026-08-01",
    status: "verified",
  },
  languages: {
    value: 20,
    label: "20",
    note: "UI languages. The selector lists more; only these are complete.",
    source: "src/i18n",
    verifiedAt: "2026-08-01",
    status: "needs-recount",
  },
  financialYears: {
    value: 6,
    label: "6",
    note: "years of developer financials from published annual reports",
    source: "developer investor-relations reports",
    verifiedAt: "2026-08-01",
    status: "verified",
  },
};

/* ── TOOLS — only what actually works may be advertised ─────────────────── */

/**
 * status:
 *   live    — backed by real data, safe to sell
 *   partial — real data, but incomplete or estimated. Ship with the caveat.
 *   soon    — built, not yet connected to a source. MUST NOT be advertised.
 *
 * Derived from TAB_AUDIT.md, verified against live Firestore 2026-07-29.
 */
export const TOOLS = [
  { name: "Projects",         status: "live",    desc: "1,552 projects with price, yield, escrow and construction stage" },
  { name: "Neighbourhoods",   status: "live",    desc: "Community-level comparison across Dubai" },
  { name: "Investment Score", status: "live",    desc: "Ranked community scoring" },
  { name: "DLD Volumes",      status: "live",    desc: "Transaction volume by area, straight from DLD" },
  { name: "Yields",           status: "live",    desc: "Gross and net rental yields by community" },
  { name: "Currency",         status: "live",    desc: "Live FX, refreshed hourly" },
  { name: "My Leads",         status: "live",    desc: "Built-in CRM — no portal gives you this" },
  { name: "Team",             status: "live",    desc: "Multi-user agency accounts" },
  { name: "Data Quality",     status: "live",    desc: "See exactly how complete every record is" },

  { name: "Map",              status: "partial", desc: "Geographic view. Yield coverage is incomplete." },
  { name: "Price History",    status: "partial", desc: "Historic pricing by community" },
  { name: "DXB Estimate",     status: "partial", desc: "Valuation estimate — labelled as an estimate" },
  { name: "Golden Visa",      status: "partial", desc: "Auto-flags AED 2M+ eligible projects" },
  { name: "Mortgage",         status: "partial", desc: "Live EIBOR calculator. Bank spreads are indicative." },
  { name: "Flip",             status: "partial", desc: "Resale margin model" },
  { name: "Launch Calendar",  status: "partial", desc: "Upcoming launches" },
  { name: "Dev Portal",       status: "partial", desc: "Developer directory" },
  { name: "Overview",         status: "partial", desc: "Portfolio-wide summary" },

  { name: "Service Charges",  status: "soon",    desc: "DLD service-charge data acquired, not yet wired" },
  { name: "Handover",         status: "soon",    desc: "Handover timelines" },
  { name: "Developer Health", status: "soon",    desc: "Developer market share from DLD attribution" },
  { name: "Competitors",      status: "soon",    desc: "Developer-vs-developer comparison" },
  { name: "Risk",             status: "soon",    desc: "Multi-factor risk scoring" },
  { name: "Market",           status: "soon",    desc: "Macro market indicators" },
  { name: "STR vs LTR",       status: "soon",    desc: "Short vs long-term letting — needs a short-let data source" },
  { name: "Portfolio",        status: "soon",    desc: "Track your own holdings" },
  { name: "Financials",       status: "soon",    desc: "Developer financial statements" },
];

export const TOOL_COUNTS = {
  live: TOOLS.filter((t) => t.status === "live").length,
  partial: TOOLS.filter((t) => t.status === "partial").length,
  soon: TOOLS.filter((t) => t.status === "soon").length,
  get sellable() {
    return this.live + this.partial;
  },
};

/* ── COMPETITORS — verified, because naming them raises the bar ─────────── */

/**
 * The previous table claimed Bayut and Property Finder had no DLD transaction
 * history and no verified yields. Both are false: Bayut publishes DLD-sourced
 * sales and rental history at property level, and TruEstimate produces
 * valuations and rental yields from DLD data. Asserting otherwise about a named
 * competitor is false comparative advertising, not marketing.
 *
 * Every row below is checked. Where a rival genuinely has the feature, we say so.
 */
export const COMPARISON = {
  columns: ["Bayut", "Property Finder", "DXBinteract", "DXB Analytics"],
  rows: [
    { capability: "Property listings",            values: ["yes", "yes", "no", "no"] },
    { capability: "DLD transaction history",      values: ["yes", "yes", "yes", "yes"] },
    { capability: "Free to use",                  values: ["yes", "yes", "yes", "partial"] },
    { capability: "Developer financials (6 yr)",  values: ["no", "no", "no", "yes"] },
    { capability: "3 ROI models (hold/STR/flip)", values: ["no", "no", "no", "yes"] },
    { capability: "3-project side-by-side",       values: ["no", "no", "no", "yes"] },
    { capability: "WhatsApp-ready client report", values: ["no", "no", "no", "yes"] },
    { capability: "Golden Visa filter",           values: ["no", "no", "no", "yes"] },
    { capability: "Built-in CRM / leads",         values: ["no", "no", "no", "yes"] },
  ],
  note:
    "Bayut and Property Finder are listing portals with strong DLD-backed " +
    "market data. DXBinteract publishes DLD transactions free. We are not a " +
    "portal — we are the workbench you use after you have found the property.",
  source: "Public product pages and press coverage, checked 2026-08-01",
  verifiedAt: "2026-08-01",
  status: "verified",
};

/* ── SOCIAL PROOF ───────────────────────────────────────────────────────── */

/**
 * Deliberately empty.
 *
 * The page carried three named testimonials — Ahmed Al Rashidi, James
 * Whitfield, Fatima Al Zaabi — with photos, job titles and quantified results
 * ("3 extra deals last quarter", "80% faster research"). They were hardcoded
 * literals with no source, against a user base of 26 accounts.
 *
 * Fabricated testimonials breach UAE consumer protection law and the
 * equivalent in the UK and US. Add entries here only with the customer's
 * written consent and a real, checkable name.
 */
export const TESTIMONIALS = [];

/* ── DATA PROVENANCE — what we actually stand on ────────────────────────── */

export const DATA_SOURCES = [
  { name: "Dubai Land Department", detail: "Transactions, projects, developers, service charges" },
  { name: "Ejari", detail: "Registered rental contracts" },
  { name: "Developer annual reports", detail: "Audited financials, 6 years" },
  { name: "UAE Central Bank", detail: "Live EIBOR" },
];

/* ── THE COMPLIANCE ENGINE — the thing nobody else has ──────────────────── */

/**
 * src/hooks/useLegalCitation.js resolves a UAE legal reference to the version
 * in force *on the day you ask*, and switches itself when a law is superseded.
 * From the hook's own docs:
 *
 *   On 2026-05-31 → Federal Law 5/1985 Art. 295
 *   On 2026-06-01 → the Decree 25/2025 replacement, automatically
 *
 * Portals give you a price. This gives you a price you can defend in a
 * meeting, with the instrument it rests on.
 */
export const LEGAL = {
  citationCount: 19,
  instruments: [
    { ref: "Law 8/2007",              topic: "Escrow accounts for off-plan" },
    { ref: "Law 9/2007",              topic: "Developer deposit obligations" },
    { ref: "Law 13/2008",            topic: "Interim register (Oqood)" },
    { ref: "Law 19/2020",            topic: "Project cancellation" },
    { ref: "Decree 43/2013",         topic: "Rent increase index" },
    { ref: "Decree 41/2013",         topic: "Holiday-home licensing" },
    { ref: "Decree 33/2020",         topic: "Rental disputes tribunal" },
    { ref: "CBUAE Circular 31/2013", topic: "Mortgage loan-to-value caps" },
    { ref: "Civil Code / Decree 25/2025", topic: "Damages, good faith, contract" },
  ],
  source: "src/config/legalCitations.seed.js",
  verifiedAt: "2026-08-01",
  status: "verified",
};

/* ── AUTOMATION — it maintains itself ───────────────────────────────────── */

export const AUTOMATION = {
  jobs: [
    { time: "03:00", name: "DLD daily",        detail: "New Land Department transactions" },
    { time: "04:00", name: "Weekly digest",    detail: "Mondays — your market summary" },
    { time: "05:00", name: "Yields",           detail: "Rental yields recomputed" },
    { time: "05:00", name: "Financials",       detail: "Developer results" },
    { time: "06:00", name: "Market sync",      detail: "Live asking prices by community" },
    { time: "07:00", name: "EIBOR",            detail: "Weekdays — central bank rate" },
    { time: "08:00", name: "Launch scan",      detail: "New off-plan launches" },
    { time: "08:50", name: "Market almanac",   detail: "Long-run market context" },
  ],
  source: "vercel.json crons",
  verifiedAt: "2026-08-01",
  status: "verified",
};

/* ── A WORKED ANSWER — computed from the DLD + Ejari exports held locally ── */

/**
 * The product's actual job, in one card. These figures come from
 * data-audit/yields-dld.json: median DLD sale price against median registered
 * Ejari rent, same 2024+ window, both sides with a stated sample size.
 *
 * Both sides now come from the complete DLD export — all 10 rent-contract parts
 * are held. Rebuilding on the full record left the yield unchanged at 5.16%
 * while the rent sample grew from 1,631 to 4,136.
 */
export const WORKED_EXAMPLE = {
  question: "Client asks: what does a 2-bed in Dubai Hills actually return?",
  community: "Dubai Hills Estate",
  unit: "2 bedroom apartment",
  medianSaleLabel: "AED 2.71M",
  saleSampleN: 2197,
  medianRentLabel: "AED 140,000",
  rentSampleN: 4136,
  grossYieldLabel: "5.16%",
  window: "sales and rents since Jan 2024",
  sources: ["Dubai Land Department", "Ejari registered contracts"],
  legalNote: "Mortgage cap per CBUAE Circular 31/2013",
  caveat: "Both sides from the complete DLD export.",
  verifiedAt: "2026-08-01",
  status: "computed",
};

/* ── AUDIENCES — three surfaces, not one ────────────────────────────────── */

export const AUDIENCES = [
  {
    key: "agent",
    title: "Agents",
    line: "Walk into the meeting with the answer already prepared.",
    points: [
      "1,552 projects with price, yield, escrow and build stage",
      "Built-in CRM — leads, notes and follow-ups in the same place",
      "Send a full project breakdown to WhatsApp in one tap",
      "Compare three projects side by side",
    ],
  },
  {
    key: "agency",
    title: "Agencies",
    line: "One source of truth your whole team quotes from.",
    points: [
      "Multi-user team accounts",
      "Shared lead pipeline",
      "Every agent citing the same verified figures",
      "Agency-level performance view",
    ],
  },
  {
    key: "developer",
    title: "Developers",
    line: "Claim your projects. Control what the market sees.",
    points: [
      "Claim and verify your developments",
      "See how your pricing sits against the comparable set",
      "Track absorption against DLD transactions",
      "Reach agents already searching your communities",
    ],
  },
];

/* ── EMAAR FY2025 — shown in the hero dashboard mockup ──────────────────── */

export const EMAAR_FY2025 = {
  propertySalesLabel: "AED 80.4B",
  propertySalesGrowth: "+16%",
  revenueLabel: "AED 49.6B",
  revenueGrowth: "+40%",
  /* PRECISION: AED 25.7B is net profit BEFORE tax. After tax it is AED 22.3B.
     The hero mockup labels it simply "Net Profit", which overstates by 3.4B.
     Label it "Net profit before tax" wherever it appears. */
  netProfitBeforeTaxLabel: "AED 25.7B",
  netProfitBeforeTaxGrowth: "+36%",
  netProfitAfterTaxLabel: "AED 22.3B",
  backlogLabel: "AED 155B",
  dividendLabel: "AED 8.8B",
  source: "Emaar Properties FY2025 results",
  sourceUrl: "https://www.emaar.com/en/blog/emaar-properties-announces-100-dividend-payout-of-aed-8-8billion-us-2-4-billion-at-annual-general-meeting",
  verifiedAt: "2026-08-01",
  status: "verified",
};

/* ── 27 YEARS OF DUBAI, EVERY CYCLE ─────────────────────────────────────── */

/**
 * The single most under-sold thing in this product.
 *
 * Counted from the DLD transaction export: continuous coverage from 2000 to
 * 2026 with over a thousand transactions in every single year. That is not
 * "recent comparables" — it is both crashes, the COVID dip and the current
 * run, on record, with the source attached.
 *
 * Anyone can tell a client the market is strong. Only someone holding 2009
 * can tell them what happens when it isn't.
 *
 * Note the 2009 row: volume ROSE to 38,613 while value COLLAPSED to AED 83B.
 * That is distressed selling, and it is the most useful teaching moment in
 * Dubai real estate.
 */
export const CYCLES = {
  firstYear: 2000,
  lastYear: 2026,
  years: 27,
  transactionsInSpan: 875_690,
  note: "Continuous DLD coverage, every year above 1,000 transactions.",
  phases: [
    { years: "2002",      label: "Freehold opens",   detail: "Foreign ownership permitted" },
    { years: "2003–2008", label: "The first boom",   detail: "AED 5B → 128B", peak: true },
    { years: "2009–2011", label: "The crash",        detail: "Value halved; volume rose on distressed sales", crash: true },
    { years: "2012–2014", label: "Recovery",         detail: "Back to AED 133B" },
    { years: "2015–2019", label: "The long plateau", detail: "Flat for five years" },
    { years: "2020",      label: "COVID",            detail: "AED 84.5B — the modern low", crash: true },
    { years: "2021–2025", label: "The run",          detail: "AED 157B → 456B", peak: true },
  ],
  chart: [
    { y: "2008", v: 127.7 }, { y: "2009", v: 83.3 },  { y: "2011", v: 86.2 },
    { y: "2014", v: 132.6 }, { y: "2020", v: 84.5 },  { y: "2022", v: 250.2 },
    { y: "2024", v: 393.6 }, { y: "2025", v: 455.8 },
  ],
  source: "DLD transaction export, counted 2026-08-01",
  verifiedAt: "2026-08-01",
  status: "verified",
};

/* ── WHO IT TEACHES ─────────────────────────────────────────────────────── */

/**
 * The product does not just store data — it settles arguments. Each audience
 * arrives with a different question and leaves able to defend the answer.
 */
export const EDUCATES = [
  {
    key: "agent",
    who: "The agent",
    q: "\"Is this actually a good buy?\"",
    line: "Walk in already holding the answer — and the evidence behind it.",
    points: [
      "Net yield after service charges, vacancy and management — not the brochure's gross",
      "27 years of comparable history, so you can show a client 2009, not just 2025",
      "The exact law your advice rests on, always the version in force",
      "Leads, notes and follow-ups in the same place you did the research",
    ],
  },
  {
    key: "client",
    who: "The client",
    q: "\"Why should I believe you?\"",
    line: "Because every figure carries its source, its sample size and its date.",
    points: [
      "Clickable sources on every number — Land Department, Ejari, audited reports",
      "Sample size shown, so a yield from 11 sales never looks like one from 2,000",
      "Estimates labelled as estimates, never dressed up as measurements",
      "The full breakdown sent to WhatsApp, readable without an account",
    ],
  },
  {
    key: "agency",
    who: "The agency",
    q: "\"Why does every agent quote a different number?\"",
    line: "One source of truth your whole team answers from.",
    points: [
      "Up to 10 agent seats under one agency",
      "Every agent citing the same verified figures",
      "Agency dashboard across your whole team's pipeline",
      "Invite and remove agents yourself",
    ],
  },
];

/* ── PRICING ────────────────────────────────────────────────────────────── */

/**
 * Re-exported from src/config/pricing.js — the declared single source of
 * truth, created after "a pricing bug across 15 hardcoded locations in 4
 * files". Repriced 2026-07-31 to the agent/agency model.
 *
 * DO NOT restate a price here. The landing page reads config/pricing.js
 * directly, so a change there moves the marketing site too.
 *
 * Stale prices still live in BillingTab.jsx (99/499), SharedUI.jsx (99/499)
 * and PlatformLeadsTab.jsx (299). Those are the same defect this file exists
 * to prevent and should be pointed at config/pricing.js.
 */
export const PRICING_META = {
  trialDays: 7,
  trialNote: "No card required",
  /* Anything dated in the future is roadmap, never an included feature. */
  roadmap: [
    { feature: "PDF reports", eta: "Q4 2026" },
    { feature: "API access",  eta: "Q4 2026" },
  ],
};
