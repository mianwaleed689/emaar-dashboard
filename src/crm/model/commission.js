/**
 * COMMISSION — WHAT WAS BILLED, WHAT LANDED, WHO IS OWED.
 * ═════════════════════════════════════════════════════════════════════════════
 *
 * WHAT THIS REPLACES
 * ──────────────────
 * A single free-typed number on the deal, `deal.commission`. From that number
 * neither of the two questions this business runs on can be answered:
 *
 *     the agent : "what am I owed this month?"
 *     the owner : "what did we bill, and what has actually landed?"
 *
 * A commission-driven business whose software cannot answer those is not
 * running on its software.
 *
 * WHAT ONE NUMBER CANNOT HOLD
 * ───────────────────────────
 * · Two sides. On a resale, each side customarily pays 2% plus VAT to its OWN
 *   agent. If your agency represents both, that is two commissions on one deal,
 *   and they may be at different rates.
 * · VAT. Commission is VAT-rated in the UAE. The tax invoice is a legal
 *   document; a commission asked for without one is a recognised red flag.
 * · The agency/agent split — commonly 50/50, but it is set per agent by their
 *   contract, and a top biller's split is not a new joiner's.
 * · The Form I split, when a second agency shares the deal. Both agencies must
 *   be registered with the Land Department to be entitled to their share.
 * · Off-plan, where the DEVELOPER pays, at a rate that varies by project —
 *   roughly 2–8% — and often long after the SPA is signed.
 * · Three states. Invoiced is not received, and received is not paid out to the
 *   agent. Treating them as one number is how agencies lose track of money.
 *
 * WHY NO RATE IS HARD-CODED
 * ─────────────────────────
 * 2% and 5% are the customary and statutory figures TODAY. They are defaults
 * that an organisation overrides in its own settings, never constants compiled
 * into the app. A fee schedule that changes would otherwise silently turn this
 * file into a liar, which is the failure mode this codebase has been cleaning
 * up for weeks.
 *
 * Sources in PRODUCT_SPEC.md §10, verified 2026-08-03.
 */

/** Defaults an organisation starts with and can change. Not law, not constants. */
export const COMMISSION_DEFAULTS = {
  resaleRatePct:  2,     // customary, each side, on a resale
  rentalRatePct:  5,     // customary, of the annual rent
  offplanRatePct: null,  // set per project — the developer decides, so no default
  vatRatePct:     5,     // UAE VAT on the commission
  agentSplitPct:  50,    // agency/agent split; per-agent contracts override this
};

export const SIDES = {
  buyer:     { key: "buyer",     label: "Buyer side",     who: "The buyer pays you." },
  seller:    { key: "seller",    label: "Seller side",    who: "The seller pays you." },
  landlord:  { key: "landlord",  label: "Landlord side",  who: "The landlord pays you." },
  tenant:    { key: "tenant",    label: "Tenant side",    who: "The tenant pays you." },
  developer: { key: "developer", label: "Developer",      who: "The developer pays you. Usual on off-plan." },
};

/** The three states, which the old single number collapsed into one. */
export const STATES = {
  due:      { key: "due",      label: "Not invoiced yet", colour: "#6B7280",
              what: "The deal earned this, but no invoice has gone out." },
  invoiced: { key: "invoiced", label: "Invoiced",         colour: "#F59E0B",
              what: "A tax invoice has been issued. The money has not arrived." },
  received: { key: "received", label: "Received",         colour: "#3B82F6",
              what: "The agency has been paid. The agent has not." },
  paid:     { key: "paid",     label: "Agent paid",       colour: "#10B981",
              what: "The agent's share has been paid out. This line is closed." },
};

export const STATE_ORDER = ["due", "invoiced", "received", "paid"];

/**
 * What Accounts is being asked to do next on this line, and what they must
 * record when they do it.
 *
 * The states are not decoration — each one is a different real-world event with
 * a different piece of evidence behind it, and asking for that evidence at the
 * moment it exists is the only way it ever gets written down.
 */
export const NEXT_STATE = {
  due:      { to: "invoiced", action: "Raise the invoice",
              asks: "Invoice number",
              why: "A VAT invoice has to be issued before anybody can be chased for payment." },
  invoiced: { to: "received", action: "Mark as received",
              asks: "Date the money arrived",
              why: "Only mark this when the funds are actually in the account — the agent is told they are owed as soon as you do." },
  received: { to: "paid",     action: "Mark the agent paid",
              asks: "Date the agent was paid",
              why: "This closes the line and tells the agent their share has gone out." },
  paid:     null,
};

/** Can this line move on, and what would that mean? */
export function nextStep(line = {}) {
  const state = line.state || "due";
  const step = NEXT_STATE[state];
  if (!step) return { done: true, note: "This line is closed — invoiced, collected and paid out." };
  return { done: false, ...step, from: state };
}

/**
 * Move one line on, keeping a record of who and when.
 *
 * Going BACKWARDS is allowed — an invoice gets cancelled, a payment bounces,
 * and a system that refuses to admit that forces somebody to keep the truth in
 * a spreadsheet instead. But it is recorded as a correction rather than
 * silently overwritten, because money moving backwards is exactly the thing an
 * auditor will ask about.
 */
export function applyState(line = {}, to, by = {}, detail = "", now = new Date()) {
  const from = line.state || "due";
  const forward = STATE_ORDER.indexOf(to) > STATE_ORDER.indexOf(from);
  return {
    ...line,
    state: to,
    [`${to}At`]: now.toISOString(),
    ...(detail ? { [`${to}Ref`]: detail } : {}),
    history: [...(line.history || []), {
      from, to, at: now.toISOString(),
      by: by.name || "", byId: by.id || "",
      detail: detail || "",
      correction: !forward,
    }],
  };
}

const money = n => Math.round((Number(n) || 0) * 100) / 100;
const pct   = (amount, p) => money((Number(amount) || 0) * (Number(p) || 0) / 100);

/**
 * Work out one commission line, end to end, and show every step.
 *
 * The `workings` array is not decoration. An agent who disputes their payout
 * and an owner who is asked to justify an invoice both need the arithmetic, and
 * "trust the number" is what the old field asked of them.
 *
 * @param {object} line
 * @param {number} line.base            price of the sale, or the ANNUAL rent on a lease
 * @param {number} line.ratePct         commission rate applied to base
 * @param {number} [line.vatRatePct]    VAT on the commission
 * @param {number} [line.agentSplitPct] the agent's share of what the agency keeps
 * @param {number} [line.collabPct]     share going to a collaborating agency under Form I
 */
export function computeCommission(line = {}) {
  const {
    base = 0, ratePct = 0,
    vatRatePct   = COMMISSION_DEFAULTS.vatRatePct,
    agentSplitPct = COMMISSION_DEFAULTS.agentSplitPct,
    collabPct = 0,
  } = line;

  const gross = pct(base, ratePct);              // what is charged, before VAT
  const vat   = pct(gross, vatRatePct);          // VAT is collected, never earned
  const invoiced = money(gross + vat);           // the face of the tax invoice

  /* A Form I share comes off the top: it is another agency's money, and it was
     never ours to split with our own agent. */
  const collab   = pct(gross, collabPct);
  const netToUs  = money(gross - collab);

  const agentShare  = pct(netToUs, agentSplitPct);
  const agencyShare = money(netToUs - agentShare);

  const workings = [
    `${fmt(base)} × ${ratePct}% = ${fmt(gross)} commission`,
    `+ ${vatRatePct}% VAT (${fmt(vat)}) = ${fmt(invoiced)} on the invoice`,
    ...(collabPct ? [`− ${collabPct}% to the collaborating agency (${fmt(collab)}) = ${fmt(netToUs)} to us`] : []),
    `${fmt(netToUs)} split ${agentSplitPct}/${100 - agentSplitPct} = ${fmt(agentShare)} agent, ${fmt(agencyShare)} agency`,
  ];

  return { base, ratePct, vatRatePct, gross, vat, invoiced, collabPct, collab,
           netToUs, agentSplitPct, agentShare, agencyShare, workings };
}

/** A deal can carry more than one line — both sides of the same sale. */
export function dealTotals(lines = []) {
  const t = { gross: 0, vat: 0, invoiced: 0, collab: 0, netToUs: 0,
              agentShare: 0, agencyShare: 0,
              byState: { due: 0, invoiced: 0, received: 0, paid: 0 } };
  lines.forEach(l => {
    const c = computeCommission(l);
    t.gross += c.gross; t.vat += c.vat; t.invoiced += c.invoiced;
    t.collab += c.collab; t.netToUs += c.netToUs;
    t.agentShare += c.agentShare; t.agencyShare += c.agencyShare;
    t.byState[l.state || "due"] = money((t.byState[l.state || "due"] || 0) + c.gross);
  });
  Object.keys(t).forEach(k => { if (typeof t[k] === "number") t[k] = money(t[k]); });
  return t;
}

/**
 * What one agent is owed — the question the old single number could not answer.
 * "Owed" means the agency HAS the money and the agent does not: state
 * `received`. Anything earlier is not owed yet, and saying otherwise sets up an
 * argument on payday.
 */
export function agentStatement(lines = [], agentId) {
  const mine = lines.filter(l => l.agentId === agentId);
  const sum  = ks => money(mine.filter(l => ks.includes(l.state || "due"))
                               .reduce((a, l) => a + computeCommission(l).agentShare, 0));
  return {
    deals:      mine.length,
    earnedNotInvoiced: sum(["due"]),
    awaitingClient:    sum(["invoiced"]),
    owedToYou:         sum(["received"]),
    paidToYou:         sum(["paid"]),
    note: "Owed to you means the agency has been paid and your share has not gone out yet. " +
          "Anything still with the client is not owed until it lands.",
  };
}

/** The owner's question: what did we bill, and what actually landed. */
export function agencyStatement(lines = []) {
  const sum = ks => money(lines.filter(l => ks.includes(l.state || "due"))
                               .reduce((a, l) => a + computeCommission(l).gross, 0));
  const outstanding = sum(["invoiced"]);
  return {
    lines: lines.length,
    notYetInvoiced: sum(["due"]),
    outstanding,
    collected:      sum(["received", "paid"]),
    owedToAgents:   money(lines.filter(l => (l.state || "due") === "received")
                               .reduce((a, l) => a + computeCommission(l).agentShare, 0)),
    note: outstanding > 0
      ? `${fmt(outstanding)} has been invoiced and not paid. That is the figure to chase.`
      : "Nothing invoiced is outstanding.",
  };
}

export function fmt(n) {
  const v = Number(n) || 0;
  return v >= 1e6 ? `AED ${(v / 1e6).toFixed(2)}M`
       : `AED ${v.toLocaleString("en-AE", { maximumFractionDigits: 0 })}`;
}

/** Sensible starting rate for a journey, from the org's settings. */
export function defaultRateFor(journey, settings = COMMISSION_DEFAULTS) {
  if (journey === "rental")  return settings.rentalRatePct;
  if (journey === "offplan") return settings.offplanRatePct;   // null on purpose
  return settings.resaleRatePct;
}

/** Which sides make sense on which journey — so no impossible option is offered. */
export const SIDES_FOR = {
  secondary: ["buyer", "seller"],
  offplan:   ["developer", "buyer"],
  rental:    ["landlord", "tenant"],
};
