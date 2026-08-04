/**
 * MARKETING — which sources are worth the money.
 *
 * The two things this must never do: invent a cost for a channel nobody has
 * told it about, and name a "best" channel when spend is unknown — because
 * "best" without cost silently means "loudest".
 *
 *     node scripts/test/marketing.test.mjs
 */
import { sourcePerformance, marketingTotals, demandByArea, headline }
  from "../../src/crm/model/marketing.js";

let pass = 0, fail = 0;
const ok = (n, c, got) => {
  if (c) { pass++; console.log(`  ✓ ${n}`); }
  else { fail++; console.log(`  ✗ ${n}${got !== undefined ? `  →  ${JSON.stringify(got)}` : ""}`); }
};
const head = t => console.log(`\n── ${t} ${"─".repeat(Math.max(0, 58 - t.length))}`);

const lead = (source, status, budget, community) => ({ source, status, budget, community });

/* Property Finder: 10 leads, 2 won, 3 lost, 5 still open.
   Bayut:           10 leads, 0 won, 6 lost, 4 open. */
const LEADS = [
  ...Array(2).fill(0).map(() => lead("Property Finder", "Won", 2000000, "Dubai Marina")),
  ...Array(3).fill(0).map(() => lead("Property Finder", "Lost", 1500000, "Dubai Marina")),
  ...Array(5).fill(0).map(() => lead("Property Finder", "Contacted", 1800000, "JVC")),
  ...Array(6).fill(0).map(() => lead("Bayut", "Lost", 900000, "JVC")),
  ...Array(4).fill(0).map(() => lead("Bayut", "New Lead", 1100000, "Business Bay")),
];

/* ── AGGREGATES ONLY ──────────────────────────────────────────────────────── */
head("IT NEVER HANDS BACK A CLIENT");

const withNames = [{ source: "Bayut", status: "Won", name: "Ahmed Khan",
                     phone: "+971500000000", email: "a@b.com", budget: 1000000 }];
const rows0 = sourcePerformance(withNames);
ok("a row carries no name, phone or email",
   !JSON.stringify(rows0).match(/Ahmed|97150|a@b\.com/), rows0[0]);

/* ── CONVERSION ───────────────────────────────────────────────────────────── */
head("CONVERSION IS MEASURED AGAINST WHAT SETTLED");

const rows = sourcePerformance(LEADS);
const pf = rows.find(r => r.source === "Property Finder");
const by = rows.find(r => r.source === "Bayut");

ok("Property Finder has 10 leads", pf.leads === 10, pf.leads);
ok("  2 won, 3 lost, 5 still open", pf.won === 2 && pf.lost === 3 && pf.open === 5, pf);
ok("conversion counts only the 5 that settled, so 40%",
   pf.conversionPct === 40, pf.conversionPct);
ok("  a lead still being worked has not failed",
   pf.settled === 5, pf.settled);
ok("and the share of everything sent is reported too, at 20%",
   pf.wonOfAllPct === 20, pf.wonOfAllPct);
ok("Bayut converted nothing", by.won === 0 && by.conversionPct === 0, by.conversionPct);
ok("sorted by what closed, not by what arrived",
   rows[0].source === "Property Finder", rows.map(r => r.source));

/* ── COST IS NEVER INVENTED ───────────────────────────────────────────────── */
head("A CHANNEL NOBODY PRICED HAS NO PRICE");

ok("cost per lead is null when spend is unknown", pf.costPerLead === null, pf.costPerLead);
ok("  not zero, which would read as free", pf.costPerLead !== 0);
ok("spend is null too", pf.spend === null, pf.spend);

const priced = sourcePerformance(LEADS, { "Property Finder": 20000, "Bayut": 12000 });
const pf2 = priced.find(r => r.source === "Property Finder");
const by2 = priced.find(r => r.source === "Bayut");
ok("with spend, cost per lead is 20,000 over 10 = 2,000", pf2.costPerLead === 2000, pf2.costPerLead);
ok("cost per DEAL is 20,000 over 2 = 10,000", pf2.costPerWon === 10000, pf2.costPerWon);
ok("a channel that closed nothing has no cost per deal",
   by2.costPerWon === null, by2.costPerWon);
ok("  and its spend is reported as having bought nothing",
   by2.spentWithNothingWon === 12000, by2.spentWithNothingWon);

/* ── TOTALS ───────────────────────────────────────────────────────────────── */
head("THE AGENCY-WIDE PICTURE");

const t = marketingTotals(priced);
ok("20 leads in total", t.leads === 20, t.leads);
ok("2 won of 11 settled — 18.2%", t.conversionPct === 18.2, t.conversionPct);
ok("32,000 spent", t.spend === 32000, t.spend);
ok("12,000 of it closed nothing", t.wasted === 12000, t.wasted);
ok("cost per deal across the agency is 16,000", t.costPerWon === 16000, t.costPerWon);

const partial = marketingTotals(sourcePerformance(LEADS, { "Bayut": 12000 }));
ok("spend coverage is stated, not implied", partial.spendCoverage === "1 of 2", partial.spendCoverage);
ok("  and the total is flagged incomplete", partial.spendComplete === false);

/* ── THE HEADLINE REFUSES TO FLATTER ──────────────────────────────────────── */
head("IT WILL NOT NAME A WINNER WITHOUT COSTS");

ok("with no spend at all it says so rather than ranking",
   /not what anything cost/.test(headline(rows, marketingTotals(rows))),
   headline(rows, marketingTotals(rows)));

ok("with partial spend it says which channels are comparable",
   /only comparable/.test(headline(sourcePerformance(LEADS, { Bayut: 12000 }), partial)),
   headline(sourcePerformance(LEADS, { Bayut: 12000 }), partial));

ok("with full spend it leads on the money that bought nothing",
   /closed nothing/.test(headline(priced, t)), headline(priced, t));

const good = sourcePerformance(
  [lead("Referral", "Won", 3000000), lead("Referral", "Won", 2000000)],
  { Referral: 4000 });
ok("and only names a best channel once every channel has a cost",
   /lowest of any channel/.test(headline(good, marketingTotals(good))),
   headline(good, marketingTotals(good)));

ok("an empty agency is told there is nothing to judge",
   /nothing to judge/.test(headline([], {})), headline([], {}));

/* ── DEMAND ───────────────────────────────────────────────────────────────── */
head("WHERE THE DEMAND IS");

const areas = demandByArea(LEADS);
ok("JVC leads on volume with 11", areas[0].area === "JVC" && areas[0].leads === 11, areas[0]);
ok("average budget is only over leads that stated one",
   areas.find(a => a.area === "Dubai Marina").averageBudget === 1700000,
   areas.find(a => a.area === "Dubai Marina"));
ok("a lead with no community is not silently dropped",
   demandByArea([lead("Bayut", "Won", 100)])[0].area === "Not recorded");

console.log(`\n${fail ? "✗" : "✓"} marketing — ${pass} passed, ${fail} failed\n`);
process.exit(fail ? 1 : 0);
