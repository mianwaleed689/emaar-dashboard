/**
 * UAE mortgage market reference data — single source of truth.
 *
 * Bank rates and regulatory caps were hardcoded inside MortgageTab with no
 * source and no as-of date, so nobody could tell whether a rate was current or
 * two years stale. One of the LTV caps was in fact a pre-2020 figure.
 *
 * Every entry below carries its source and the date it was verified. When you
 * refresh these, update `asOf` — the UI displays it, so a stale figure is
 * visible rather than silent.
 *
 * Verified: 2026-07-29
 */

export const MORTGAGE_DATA_AS_OF = "2026-07-29";

/**
 * CBUAE base rate and EIBOR.
 * EIBOR is read live from Firestore (tabData/eiborRates); these are the
 * fallbacks used only when that document is unavailable.
 */
export const RATE_BENCHMARKS = {
  cbuaeBaseRate: {
    value: 3.65,
    note: "Held since December 2025, following the US Federal Reserve",
    source: "Central Bank of the UAE",
    asOf: "2026-07-29",
  },
  eibor3mFallback: {
    value: 3.74,
    note: "Fallback only — live value comes from tabData/eiborRates",
    source: "EIBOR, 10 July 2026",
    asOf: "2026-07-10",
  },
};

/**
 * Loan-to-value caps set by CBUAE (Circular 31/2013, as amended by Board
 * Resolution 31/2/2020).
 *
 * CORRECTION 2026-07-29: expat `over5m` was 65, which is the pre-2020 figure.
 * The 2020 amendment raised it to 70. The old value forced a 35% deposit on
 * properties above AED 5M when the regulation requires 30%.
 */
export const LTV_RULES = {
  expat: {
    under5m: 80,        // verified 2026-07-29
    over5m: 70,         // verified 2026-07-29 (was 65 — pre-2020 figure)
    nonResident: 60,
    label: "Expat resident",
  },
  uae_national: {
    under5m: 85,        // verified 2026-07-29
    /* NOT INDEPENDENTLY VERIFIED. The 2020 amendment raised the expat bands by
       5 percentage points; the national band above AED 5M may have moved from
       70 to 75 in the same amendment. Left at 70 (the conservative reading)
       until confirmed against the CBUAE rulebook directly. */
    over5m: 70,
    nonResident: 85,
    label: "UAE national",
  },
  non_resident: {
    under5m: 60,
    over5m: 50,
    nonResident: 50,
    label: "Non-resident",
  },
};

/** Second or subsequent property, any value — CBUAE cap. */
export const LTV_SECOND_PROPERTY = 60;

/** Debt-burden ratio: CBUAE caps ALL monthly obligations at 50% of gross income. */
export const DBR_CAP = 0.50;

/**
 * Indicative bank rates. These move frequently — treat the `asOf` date as the
 * shelf life, and re-verify before quoting to a client.
 *
 * `variableMargin` is the spread added to 3-month EIBOR.
 */
export const BANK_RATES_SOURCE = "Compiled from MortgageCompare.ae, Mortgease, GCC Mortgages and bank published rates";

export const BANKS = [
  { bank: "ADCB",          fixed1y: 3.85, fixed3y: 4.15, fixed5y: 4.39, variableMargin: 1.55, maxLoan: 15000000, minSalary: 15000, processingFee: 1.0, islamic: false, salaryTransfer: true,  highlight: true,
    note: "Most competitive headline rate for salaried expats as of mid-2026. Mortgage One offers an offset facility." },
  { bank: "FAB",           fixed1y: 3.95, fixed3y: 4.19, fixed5y: 4.44, variableMargin: 1.45, maxLoan: 15000000, minSalary: 15000, processingFee: 1.0, islamic: false, salaryTransfer: true,  highlight: false,
    note: "First Abu Dhabi Bank. Fixed tenures up to five years. Competitive conventional pricing." },
  { bank: "Emirates NBD",  fixed1y: 3.99, fixed3y: 4.25, fixed5y: 4.49, variableMargin: 1.50, maxLoan: 25000000, minSalary: 15000, processingFee: 1.0, islamic: false, salaryTransfer: true,  highlight: false,
    note: "Finances up to 80% for expats, loans to AED 25M, terms to 25 years. Salary transfer unlocks relationship pricing." },
  { bank: "Dubai Islamic", fixed1y: 3.99, fixed3y: 4.25, fixed5y: 4.50, variableMargin: 1.55, maxLoan: 15000000, minSalary: 15000, processingFee: 1.0, islamic: true,  salaryTransfer: false, highlight: false,
    note: "Sharia-compliant Murabaha / Ijara. Profit rate rather than interest." },
  { bank: "HSBC UAE",      fixed1y: 4.09, fixed3y: 4.34, fixed5y: 4.59, variableMargin: 1.60, maxLoan: 15000000, minSalary: 15000, processingFee: 1.0, islamic: false, salaryTransfer: true,  highlight: false,
    note: "International banking relationships. Useful for overseas income documentation." },
  { bank: "Mashreq",       fixed1y: 4.10, fixed3y: 4.35, fixed5y: 4.59, variableMargin: 1.65, maxLoan: 12000000, minSalary: 15000, processingFee: 1.0, islamic: false, salaryTransfer: false, highlight: false,
    note: "No mandatory salary transfer. More flexible for self-employed applicants." },
];

/**
 * Additional lenders that appear on the Banking tab but not the Mortgage
 * comparison. Rates carried over from the existing Banking table.
 *
 * NOT INDEPENDENTLY VERIFIED — research confirms the market's best 1-year fixed
 * rates start around 3.49–3.99%, which makes these plausible, but I could not
 * confirm the specific figures per lender. Re-check before quoting.
 */
export const BANKS_ADDITIONAL = [
  { bank: "RAKBank",           fixed1y: 4.10, fixed3y: 4.35, fixed5y: 4.75, variableMargin: 1.65, verified: false },
  { bank: "Standard Chartered", fixed1y: 3.50, fixed3y: 4.00, fixed5y: 4.10, variableMargin: 1.40, verified: false },
];

/**
 * Resolve a lender's rates by name, tolerating the naming differences between
 * tabs ("FAB" vs "First Abu Dhabi Bank", "Mashreq" vs "Mashreq Bank").
 * Returns null when the lender isn't in the table.
 */
export function findBankRates(name) {
  if (!name) return null;
  const norm = String(name).toLowerCase().replace(/\s+bank$|\s+uae$/g, "").trim();
  const alias = {
    "first abu dhabi": "fab",
    "emirates nbd": "emirates nbd",
    "dubai islamic": "dubai islamic",
    "standard chartered": "standard chartered",
  };
  const key = alias[norm] || norm;
  return [...BANKS, ...BANKS_ADDITIONAL].find(b => {
    const bn = b.bank.toLowerCase().replace(/\s+bank$|\s+uae$/g, "").trim();
    return bn === key || bn === norm;
  }) || null;
}

/** Relationship discount for moving your salary account to the lender. */
export const SALARY_TRANSFER_DISCOUNT = {
  min: 0.10,
  max: 0.25,
  note: "Typical relationship pricing discount, in percentage points",
};
