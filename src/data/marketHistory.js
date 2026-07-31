/**
 * DUBAI PROPERTY MARKET — THE FULL CYCLE, 2002 TO TODAY
 *
 * ── WHY THIS EXISTS ─────────────────────────────────────────────────────────
 *
 * Almost every Dubai property portal shows the last twelve months. A few show
 * five years. Practically none show a buyer what happened in 2008, or that the
 * market then spent five years falling between 2014 and 2019 — the longest
 * downturn in its history — because that story does not help sell a unit today.
 *
 * It is, however, the single most useful thing an investor can know. A market
 * that has fallen 60% once and 30% again is not a market you enter without
 * understanding what caused each fall and what ended it.
 *
 * So this is the honest version: every era, what drove it, how far prices moved,
 * and what it teaches. Including the parts that are unflattering.
 *
 * ── ON PRECISION ────────────────────────────────────────────────────────────
 *
 * Pre-2020 figures are given as RANGES because that is how they are published.
 * Dubai had no single authoritative residential price index before the DLD and
 * private indices matured, so "prices fell 50–60% between 2008 and 2011" is the
 * honest statement and "prices fell 54.3%" is not. Where a precise number
 * exists it is given; where it does not, the range is shown rather than a
 * midpoint dressed up as a measurement.
 *
 * Transaction volumes from 2020 onward live in the marketMetrics collection and
 * come from DLD totals. Volumes quoted in this file for the same years may
 * differ, because published series vary in scope — some count residential sales
 * only, others include land, buildings, mortgages and gifts. Where that matters
 * it is said.
 *
 * Researched 2026-07-31.
 */

export const MARKET_HISTORY_AS_OF = "2026-07-31";

export const CYCLE_PHASE = {
  BOOM: "boom",
  CRASH: "crash",
  RECOVERY: "recovery",
  CORRECTION: "correction",
  MODERATION: "moderation",
};

export const PHASE_COLOR = {
  [CYCLE_PHASE.BOOM]: "#68D391",
  [CYCLE_PHASE.CRASH]: "#FC8181",
  [CYCLE_PHASE.RECOVERY]: "#63B3ED",
  [CYCLE_PHASE.CORRECTION]: "#F6AD55",
  [CYCLE_PHASE.MODERATION]: "#D4A843",
};

export const PHASE_LABEL = {
  [CYCLE_PHASE.BOOM]: "Boom",
  [CYCLE_PHASE.CRASH]: "Crash",
  [CYCLE_PHASE.RECOVERY]: "Recovery",
  [CYCLE_PHASE.CORRECTION]: "Correction",
  [CYCLE_PHASE.MODERATION]: "Moderation",
};

/**
 * The eras. Ordered oldest first.
 *
 * `priceMove` is the cumulative price change across the era, as published.
 * `lesson` is the part a client is actually paying for — what the era means for
 * a decision they are making now.
 */
export const MARKET_ERAS = [
  {
    id: "freehold",
    from: 2002,
    to: 2003,
    phase: CYCLE_PHASE.RECOVERY,
    title: "Freehold opens the market",
    driver: "Foreign nationals permitted to own property outright for the first time.",
    priceMove: null,
    priceLabel: "Market forms",
    detail:
      "Before 2002 there was effectively no international property market in Dubai. The freehold decree created one overnight, and everything that follows — the booms and both crashes — traces back to the demand it unlocked.",
    lesson:
      "Dubai's property market is young. Its entire recorded history is roughly one human generation, which is why long-run averages here carry less weight than they would in London or New York.",
    source: "UAE freehold legislation, 2002",
  },
  {
    id: "first-boom",
    from: 2003,
    to: 2008,
    phase: CYCLE_PHASE.BOOM,
    title: "The first boom",
    driver: "Freehold demand, easy credit, and speculative off-plan flipping.",
    priceMove: { low: 300, high: 400, direction: "up" },
    priceLabel: "+300% to +400%",
    detail:
      "Prices rose several hundred per cent in five years, with some communities up more than 230% and a final year that added nearly 59% on its own. Much of the volume was speculative: units were bought off-plan and resold before completion, sometimes several times over.",
    lesson:
      "The steepest part of a rise is usually the least stable. The 2007–08 surge was driven by people who never intended to own the asset, and it was the first thing to disappear.",
    source: "Published market histories of the 2003–2008 period",
  },
  {
    id: "crash",
    from: 2008,
    to: 2011,
    phase: CYCLE_PHASE.CRASH,
    title: "The crash",
    driver: "Global financial crisis. Credit withdrawn, construction halted, speculative demand gone.",
    priceMove: { low: 50, high: 60, direction: "down" },
    priceLabel: "−50% to −60%",
    detail:
      "Values fell by half or more, with some communities down 50–60% inside eighteen months. Projects stopped mid-build. This is the event every subsequent Dubai regulation — escrow accounts, RERA oversight, mortgage caps — was written in response to.",
    lesson:
      "This is the number to hold in mind when a market is described as one-way. It has happened here, within living memory, and it took roughly six years to recover the lost ground.",
    source: "Published market histories; 60% peak-to-trough is the consensus figure",
  },
  {
    id: "recovery-2011",
    from: 2011,
    to: 2014,
    phase: CYCLE_PHASE.RECOVERY,
    title: "Recovery and the Expo bid",
    driver: "Regional capital seeking safety, then the Expo 2020 win in November 2013.",
    priceMove: { low: 25, high: 30, direction: "up" },
    priceLabel: "+25% to +30%",
    detail:
      "Transaction volumes climbed from 2012 and prime communities such as Downtown and Dubai Marina had recovered their 2008 highs by 2013–14. The Expo announcement in late 2013 added a burst of optimism that carried into the following year.",
    lesson:
      "Recovery was neither quick nor even. Prime areas regained their peaks years before secondary ones, which is the pattern to expect if it happens again.",
    source: "Published market histories; Expo 2020 bid won November 2013",
  },
  {
    id: "long-correction",
    from: 2014,
    to: 2019,
    phase: CYCLE_PHASE.CORRECTION,
    title: "The long correction",
    driver: "Oversupply, the oil price collapse, a stronger dollar, and VAT from 2018.",
    priceMove: { low: 25, high: 35, direction: "down" },
    priceLabel: "−25% to −35%",
    detail:
      "The longest downturn in Dubai's property history — close to five years of grinding decline rather than a single shock. Prices ended roughly a quarter to a third below their mid-2014 peak. There was no crash headline; the market simply drifted down while supply kept arriving.",
    lesson:
      "The more dangerous scenario for a Dubai investor is not a crash but this: a slow decline with no obvious moment to exit. Supply was the cause then, and supply is the pressure point again in 2026.",
    source: "Published market histories; mid-2014 peak to 2019 trough",
  },
  {
    id: "covid",
    from: 2020,
    to: 2020,
    phase: CYCLE_PHASE.CRASH,
    title: "COVID-19",
    driver: "Borders closed, transactions stalled, then one of the earliest reopenings globally.",
    priceMove: { low: 5, high: 10, direction: "down" },
    priceLabel: "−5% to −10%",
    detail:
      "A shallow dip rather than a collapse, and short-lived. Dubai reopened to visitors far earlier than most competing cities and introduced remote-work and golden visa routes that turned a health crisis into a migration event.",
    lesson:
      "The mildest downturn in the record, and the one that set up the strongest rise. Policy response mattered more than the shock itself.",
    source: "DLD transaction data, 2020",
  },
  {
    id: "boom-2021",
    from: 2021,
    to: 2024,
    phase: CYCLE_PHASE.BOOM,
    title: "The second boom",
    driver: "Visa reform, remote-work migration, capital relocation, and population growth.",
    priceMove: { low: 70, high: 80, direction: "up" },
    priceLabel: "+70% to +80%",
    detail:
      "Citywide values rose roughly 75% from February 2021. Transaction volumes went from about 51,000 in 2020 to 226,000 in 2024. Golden visas, remote-work permits and 100% foreign company ownership each widened the buyer base rather than deepening the same one.",
    lesson:
      "Unlike 2003–08, this rise came with population growth and end-user demand behind it, not only speculation. That is the strongest argument that it is structurally different — and it is an argument, not a guarantee.",
    source: "DLD transaction data; citywide growth measured from February 2021",
  },
  {
    id: "record-2025",
    from: 2025,
    to: 2025,
    phase: CYCLE_PHASE.BOOM,
    title: "Record year",
    driver: "Fifth consecutive record. Off-plan dominant, investor base at an all-time high.",
    priceMove: { low: 19, high: 20, direction: "up" },
    priceLabel: "+19.8%",
    detail:
      "AED 917B across more than 270,000 transactions, with 193,100 active investors including 129,600 new ones. Capital values rose 19.8% on the ValuStrat index.",
    lesson:
      "Five consecutive records is remarkable and is also, by definition, the longest the market has ever run without a pause.",
    source: "Dubai Land Department, FY2025; ValuStrat VPI December 2025",
  },
  {
    id: "moderation-2026",
    from: 2026,
    to: 2026,
    phase: CYCLE_PHASE.MODERATION,
    title: "Moderation",
    driver: "Record supply arriving against still-strong demand.",
    priceMove: { low: 5, high: 8, direction: "up" },
    priceLabel: "+5% to +8% forecast",
    detail:
      "Q1 2026 set another value record at AED 252B, but consensus growth for the year is 5–8%, well below 2025's 19.8%. Some 131,234 units are expected in 2026 and 200,000–300,000 by 2028. Mortgage-funded activity has risen to 36% of transactions from a much lower base.",
    lesson:
      "Growth slowing from 20% to 5–8% is not a downturn. The thing to watch is whether supply outruns absorption in the communities carrying the heaviest delivery — the same mechanism that produced 2014–2019.",
    source: "Q1 2026 DLD reporting; 2026 supply and price forecasts",
  },
];

/** Every downward era, including the shallow 2020 dip. */
export const DRAWDOWNS = MARKET_ERAS.filter(e => e.priceMove?.direction === "down");

/**
 * The two SUBSTANTIAL falls — 2008–11 and 2014–19.
 *
 * COVID is deliberately excluded from this list. At 5–10% over a few months it
 * was a dip, not a drawdown, and lumping it in with a 60% crash would flatter
 * the 60% by association and overstate the 8%. The threshold is a 20% floor.
 */
export const MAJOR_DRAWDOWNS = DRAWDOWNS.filter(e => e.priceMove.low >= 20);

/** Total span the record covers, computed so it never goes stale. */
export function historySpanYears() {
  const first = MARKET_ERAS[0].from;
  const last = MARKET_ERAS[MARKET_ERAS.length - 1].to;
  return last - first;
}

/** Era containing a given year, or null. */
export function eraForYear(year) {
  return MARKET_ERAS.find(e => year >= e.from && year <= e.to) || null;
}
