/**
 * MARKETING — WHICH SOURCES ARE WORTH THE MONEY.
 *
 * WHAT THIS IS FOR
 * ────────────────
 * A marketing manager has one question the rest of the product cannot answer:
 * of everything we spend, what actually turns into a deal. Not how many leads
 * arrived — how many became money, and what each one cost.
 *
 * AGGREGATES ONLY, ON PURPOSE
 * ───────────────────────────
 * Nothing here returns a client's name, phone or email, and that is a design
 * decision rather than an omission. src/crm/model/org.js draws the line
 * already: marketing needs to know Property Finder converts better than Bayut
 * and has no business with the buyer's mobile number. So this takes leads in
 * and gives counts, rates and money out. A marketing screen built on these
 * functions cannot leak a client even by accident, because it is never handed
 * one.
 *
 * WHAT IT REFUSES TO INVENT
 * ─────────────────────────
 * Spend is passed IN. There is no advertising-platform integration in this
 * product — no Meta, no Google, no Property Finder billing API — so the only
 * honest source of what a channel cost is the agency typing it. Where spend is
 * not known, cost per lead is `null` and the caller must show that it is
 * unknown rather than print a zero. A zero would read as "free".
 */

/** Won and lost are the only two outcomes that settle a lead. */
const WON  = ["won", "closed", "closed won"];
const LOST = ["lost", "closed lost", "dead", "low budget"];

const isWon  = s => WON.includes(String(s || "").toLowerCase());
const isLost = s => LOST.includes(String(s || "").toLowerCase());

const money = n => Math.round((Number(n) || 0) * 100) / 100;
const pct   = (a, b) => (b > 0 ? Math.round((a / b) * 1000) / 10 : 0);

/**
 * Per-source performance.
 *
 * `spend` is { [source]: amountForThePeriod }. Anything missing stays unknown.
 * Sorted by what converted, not by what arrived — a hundred leads that close
 * nothing is a worse channel than ten that close three, and sorting by volume
 * hides exactly that.
 */
export function sourcePerformance(leads = [], spend = {}) {
  const bySource = new Map();

  for (const l of leads) {
    const key = (l.source || "Unknown").trim() || "Unknown";
    if (!bySource.has(key)) {
      bySource.set(key, { source: key, leads: 0, won: 0, lost: 0, open: 0, budgetTotal: 0, budgetKnown: 0 });
    }
    const r = bySource.get(key);
    r.leads++;
    if (isWon(l.status)) r.won++;
    else if (isLost(l.status)) r.lost++;
    else r.open++;
    const b = Number(l.budget) || 0;
    if (b > 0) { r.budgetTotal += b; r.budgetKnown++; }
  }

  const rows = [...bySource.values()].map(r => {
    const settled = r.won + r.lost;
    const spent = spend[r.source];
    const known = typeof spent === "number" && spent > 0;
    return {
      ...r,
      /* Conversion is measured against SETTLED leads, not all of them. A lead
         still being worked has not failed, and counting it as a failure makes
         every recent channel look worse than an old one. */
      settled,
      conversionPct: pct(r.won, settled),
      /* Also reported against everything, because "of all the leads this
         channel sent, how many closed" is the question a finance director
         actually asks. */
      wonOfAllPct: pct(r.won, r.leads),
      averageBudget: r.budgetKnown ? money(r.budgetTotal / r.budgetKnown) : null,
      spend: known ? money(spent) : null,
      costPerLead: known ? money(spent / r.leads) : null,
      costPerWon:  known && r.won > 0 ? money(spent / r.won) : null,
      /* Spend recorded against a channel that closed nothing is the number a
         marketing manager needs to see first. */
      spentWithNothingWon: known && r.won === 0 ? money(spent) : 0,
    };
  });

  rows.sort((a, b) => b.won - a.won || b.leads - a.leads);
  return rows;
}

/** The agency-wide totals, so a row can be read as a share of the whole. */
export function marketingTotals(rows = []) {
  const t = rows.reduce((acc, r) => ({
    leads: acc.leads + r.leads,
    won: acc.won + r.won,
    lost: acc.lost + r.lost,
    open: acc.open + r.open,
    spend: acc.spend + (r.spend || 0),
    spendKnownFor: acc.spendKnownFor + (r.spend != null ? 1 : 0),
    wasted: acc.wasted + r.spentWithNothingWon,
  }), { leads: 0, won: 0, lost: 0, open: 0, spend: 0, spendKnownFor: 0, wasted: 0 });

  return {
    ...t,
    spend: money(t.spend),
    wasted: money(t.wasted),
    settled: t.won + t.lost,
    conversionPct: pct(t.won, t.won + t.lost),
    costPerLead: t.spend > 0 && t.leads ? money(t.spend / t.leads) : null,
    costPerWon:  t.spend > 0 && t.won   ? money(t.spend / t.won)   : null,
    /* Stated so a screen can say "spend is known for 3 of 8 channels" rather
       than implying the total is the whole marketing budget. */
    spendCoverage: rows.length ? `${t.spendKnownFor} of ${rows.length}` : "none",
    spendComplete: rows.length > 0 && t.spendKnownFor === rows.length,
  };
}

/** Where the demand is, by community. Aggregate — never a client. */
export function demandByArea(leads = [], limit = 8) {
  const m = new Map();
  for (const l of leads) {
    const k = (l.community || "Not recorded").trim() || "Not recorded";
    if (!m.has(k)) m.set(k, { area: k, leads: 0, won: 0, budgetTotal: 0, budgetKnown: 0 });
    const r = m.get(k);
    r.leads++;
    if (isWon(l.status)) r.won++;
    const b = Number(l.budget) || 0;
    if (b > 0) { r.budgetTotal += b; r.budgetKnown++; }
  }
  return [...m.values()]
    .map(r => ({ ...r, averageBudget: r.budgetKnown ? money(r.budgetTotal / r.budgetKnown) : null }))
    .sort((a, b) => b.leads - a.leads)
    .slice(0, limit);
}

/**
 * The sentence a marketing manager should read first.
 *
 * Deliberately refuses to be upbeat when the data does not support it, and
 * refuses to rank channels at all when spend is unknown for most of them —
 * "best value" without cost is just "most leads", which is the claim that
 * makes agencies keep paying for the loudest channel.
 */
export function headline(rows = [], totals = {}) {
  if (!rows.length) return "No leads on record yet, so there is nothing to judge a channel by.";

  const best = rows.find(r => r.costPerWon != null);
  const dead = rows.filter(r => r.spentWithNothingWon > 0);

  if (!totals.spendComplete) {
    const known = totals.spendKnownFor || 0;
    return known === 0
      ? `${totals.leads} leads from ${rows.length} channels. No spend recorded, so this shows what arrived and what closed — not what anything cost.`
      : `Spend is recorded for ${totals.spendCoverage} channels, so cost per deal is only comparable across those.`;
  }
  if (dead.length) {
    return `${dead.map(d => d.source).join(", ")} took AED ${totals.wasted.toLocaleString("en-AE")} and closed nothing this period.`;
  }
  if (best) {
    return `${best.source} is closing at AED ${best.costPerWon.toLocaleString("en-AE")} a deal, the lowest of any channel.`;
  }
  return `${totals.leads} leads, ${totals.won} closed.`;
}
