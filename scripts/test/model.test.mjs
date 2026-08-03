/**
 * The CRM model, checked against the law and against real deals.
 *
 * These three files decide what a deal may do, what an agency bills, and what
 * an employee is paid when they leave. Two of those are somebody's money, so
 * they are not shipped on the strength of them looking right.
 *
 *     node scripts/test/model.test.mjs
 */
import { JOURNEYS, DOCUMENTS, canAdvance, requiredDocuments, conditionalDocuments,
         allDocuments, expiringDocuments, currentStage, progressOf,
         isComplete } from "../../src/crm/model/journeys.js";
import { computeCommission, dealTotals, agentStatement, agencyStatement,
         SIDES_FOR, fmt } from "../../src/crm/model/commission.js";
import { canAdvertise, complianceProgress, listingCompliance, PORTALS,
         POSTED_NOTE, LISTING_REQUIREMENTS } from "../../src/crm/model/listing.js";
import { LAW, SICK_TOTAL_DAYS, annualLeaveBalance, sickLeaveEntitlement,
         probationStatus, noticePeriod, gratuity, finalSettlement,
         complianceRegister, canBroker } from "../../src/crm/model/hr.js";

let pass = 0, fail = 0;
const ok = (name, cond, got) => {
  if (cond) { pass++; console.log(`  ✓ ${name}`); }
  else { fail++; console.log(`  ✗ ${name}${got !== undefined ? `  →  got ${JSON.stringify(got)}` : ""}`); }
};
const near = (a, b, tol = 1) => Math.abs(a - b) <= tol;
const head = t => console.log(`\n── ${t} ${"─".repeat(Math.max(0, 60 - t.length))}`);

/* One frozen instant for the whole run.
   `ago(-9)` used to build a date from Date.now(), and the function under test
   then called Date.now() again a few milliseconds later — so a gap of 9 days
   measured 8.9999 days, Math.floor took it to 8, and "expires in 9 days"
   failed at random. A test that fails intermittently is worse than no test,
   because it trains you to re-run instead of read. Every date here is measured
   from NOW, and NOW is passed into anything that would otherwise ask the clock. */
const NOW  = Date.now();
const ago  = n => new Date(NOW - n * 86400000).toISOString();

/* ════════════════════════ JOURNEYS ════════════════════════ */
head("JOURNEYS — the deal cannot skip its paperwork");

const resale = { journey: "secondary", stage: "form_a", documents: {} };
ok("a resale with no Form A cannot advertise", canAdvance(resale).ok === false);
ok("  and it says why in words", /seller signs Form A/.test(canAdvance(resale).reason),
   canAdvance(resale).reason);

resale.documents.FORM_A = { receivedAt: ago(2) };
ok("with Form A signed it advances", canAdvance(resale).ok === true);

const atPermit = { journey: "secondary", stage: "permit", documents: { FORM_A: { receivedAt: ago(2) } } };
ok("cannot publish without a Trakheesi permit", canAdvance(atPermit).ok === false);
ok("  names the permit", /Trakheesi/.test(canAdvance(atPermit).reason), canAdvance(atPermit).reason);

const atTransfer = { journey: "secondary", stage: "transferred", documents: {} };
ok("cannot complete without a title deed", canAdvance(atTransfer).ok === false);

const atNoc = { journey: "secondary", stage: "noc", documents: {} };
ok("cannot reach the trustee without an NOC", canAdvance(atNoc).ok === false);
ok("  explains the Land Department will refuse",
   /Land Department will not transfer/.test(canAdvance(atNoc).reason), canAdvance(atNoc).reason);

/* An NOC is customarily good for about 30 days — the clock that costs
   appointments. */
const nocOld = { journey: "secondary", stage: "trustee",
                 documents: { NOC: { receivedAt: ago(34) } } };
const exp = expiringDocuments(nocOld, NOW);
ok("a 34-day-old NOC reports as expired", exp[0]?.expired === true, exp[0]);
ok("  and says how many days ago", /expired 4 days ago/.test(exp[0]?.note || ""), exp[0]?.note);

const nocFresh = { journey: "secondary", stage: "trustee",
                   documents: { NOC: { receivedAt: ago(26) } } };
ok("a 26-day-old NOC warns with 4 days left", expiringDocuments(nocFresh, NOW)[0]?.daysLeft === 4,
   expiringDocuments(nocFresh, NOW)[0]?.daysLeft);

ok("resale has no EOI stage", !JOURNEYS.secondary.stages.some(s => s.key === "eoi"));
ok("resale has no SPA stage", !JOURNEYS.secondary.stages.some(s => s.key === "spa"));
ok("off-plan has both", JOURNEYS.offplan.stages.some(s => s.key === "eoi")
                      && JOURNEYS.offplan.stages.some(s => s.key === "spa"));
ok("rental requires Ejari", JOURNEYS.rental.stages.some(s => (s.requires||[]).includes("EJARI")));
ok("every stage of every journey has a plain-English 'what'",
   Object.values(JOURNEYS).every(j => j.stages.every(s => s.what && s.what.length > 12)));
ok("every stage that requires a document explains the block",
   Object.values(JOURNEYS).every(j => j.stages.every(s => !(s.requires||[]).length || s.blockedBy)));
ok("every journey ends at commission received",
   Object.values(JOURNEYS).every(j => j.stages[j.stages.length - 1].key === "paid"));
/* Form A, Trakheesi, Form F, NOC, title deed — five that block. */
ok("resale lists 5 blocking documents", requiredDocuments({ journey: "secondary" }).length === 5,
   requiredDocuments({ journey: "secondary" }).length);
ok("Form B and Form I show as conditional, not blocking",
   conditionalDocuments({ journey: "secondary" }).map(d => d.key).join(",") === "FORM_B,FORM_I",
   conditionalDocuments({ journey: "secondary" }).map(d => d.key));
ok("  each says when it applies",
   conditionalDocuments({ journey: "secondary" }).every(d => d.when && d.when.length > 10));
ok("  and a missing Form B never blocks the deal",
   canAdvance({ journey: "secondary", stage: "buyer_side", documents: {} }).ok === true);
ok("a coordinator sees all seven on the deal", allDocuments({ journey: "secondary" }).length === 7,
   allDocuments({ journey: "secondary" }).length);
ok("progress at the first stage is 0%", progressOf({ journey: "secondary", stage: "form_a" }) === 0);
ok("progress at the last stage is 100%", progressOf({ journey: "secondary", stage: "paid" }) === 100);
ok("a completed deal cannot advance further",
   canAdvance({ journey: "secondary", stage: "paid", documents: {} }).ok === false);

/* ════════════════════════ COMMISSION ════════════════════════ */
head("COMMISSION — two sides, VAT, splits, states");

/* A real resale: AED 3.5M, 2% each side, 5% VAT, 50/50 split. */
const c = computeCommission({ base: 3_500_000, ratePct: 2, vatRatePct: 5, agentSplitPct: 50 });
ok("2% of AED 3.5M is AED 70,000", c.gross === 70000, c.gross);
ok("5% VAT is AED 3,500", c.vat === 3500, c.vat);
ok("the invoice is AED 73,500", c.invoiced === 73500, c.invoiced);
ok("the agent's half is AED 35,000", c.agentShare === 35000, c.agentShare);
ok("the agency's half is AED 35,000", c.agencyShare === 35000, c.agencyShare);
ok("VAT is never split with the agent", c.agentShare + c.agencyShare === c.gross);
ok("the workings are shown", c.workings.length >= 3, c.workings.length);

/* A Form I collaboration: the other agency's half comes off the top. */
const col = computeCommission({ base: 3_500_000, ratePct: 2, agentSplitPct: 50, collabPct: 50 });
ok("a 50% Form I share leaves AED 35,000 with us", col.netToUs === 35000, col.netToUs);
ok("  the agent gets half of what is left, not half of the whole",
   col.agentShare === 17500, col.agentShare);

/* Rental is on the ANNUAL rent, not the sale price. */
const rent = computeCommission({ base: 180_000, ratePct: 5, agentSplitPct: 50 });
ok("5% of AED 180,000 annual rent is AED 9,000", rent.gross === 9000, rent.gross);

/* Both sides of one deal. */
const both = dealTotals([
  { base: 3_500_000, ratePct: 2, agentSplitPct: 50, state: "received" },
  { base: 3_500_000, ratePct: 2, agentSplitPct: 50, state: "invoiced" },
]);
ok("representing both sides bills AED 140,000", both.gross === 140000, both.gross);

const lines = [
  { agentId: "a1", base: 3_500_000, ratePct: 2, agentSplitPct: 50, state: "received" },
  { agentId: "a1", base: 2_000_000, ratePct: 2, agentSplitPct: 50, state: "invoiced" },
  { agentId: "a1", base: 1_000_000, ratePct: 2, agentSplitPct: 50, state: "paid" },
  { agentId: "a2", base: 5_000_000, ratePct: 2, agentSplitPct: 60, state: "received" },
];
const st = agentStatement(lines, "a1");
ok("an agent is owed only what the agency has actually collected",
   st.owedToYou === 35000, st.owedToYou);
ok("  money still with the client is not owed yet", st.awaitingClient === 20000, st.awaitingClient);
ok("  and what was already paid is separate", st.paidToYou === 10000, st.paidToYou);

const ag = agencyStatement(lines);
ok("the agency sees what is outstanding", ag.outstanding === 40000, ag.outstanding);
ok("  and what it owes its agents", ag.owedToAgents === 95000, ag.owedToAgents);
ok("  with a sentence naming the chase figure", /invoiced and not paid/.test(ag.note), ag.note);

ok("off-plan offers the developer as a payer", SIDES_FOR.offplan.includes("developer"));
ok("a resale never offers 'landlord'", !SIDES_FOR.secondary.includes("landlord"));

/* ════════════════════════ HR ════════════════════════ */
head("HR — UAE law, where the arithmetic is somebody's money");

ok("annual leave is 30 days", LAW.annualLeaveDays === 30);
ok("sick leave totals 90 days", SICK_TOTAL_DAYS === 90);
ok("  in bands of 15 / 30 / 45",
   LAW.sickFullPayDays === 15 && LAW.sickHalfPayDays === 30 && LAW.sickUnpaidDays === 45);

const newJoiner = annualLeaveBalance({ joinedAt: ago(120), takenDays: 0, asOf: NOW });
ok("a 4-month joiner has not vested 30 days", newJoiner.vested === false);
ok("  they have accrued about 9", near(newJoiner.accrued, 9, 2), newJoiner.accrued);
const settled = annualLeaveBalance({ joinedAt: ago(800), takenDays: 12, carriedOver: 5, asOf: NOW });
ok("a settled employee has 30 + 5 − 12 = 23 left", settled.remaining === 23, settled.remaining);

/* The calculation payroll gets wrong by hand: bands run ACROSS one absence. */
const sick40 = sickLeaveEntitlement({ daysRequested: 40, alreadyTakenThisYear: 0,
                                      monthlySalary: 15000 });
ok("a 40-day illness is 15 full + 25 half, not 40 of anything",
   sick40.full === 15 && sick40.half === 25 && sick40.unpaid === 0,
   { full: sick40.full, half: sick40.half, unpaid: sick40.unpaid });
/* AED 15,000 ÷ 30 = AED 500 a day. 15 × 500 = 7,500, plus 25 × 500 × ½ = 6,250. */
ok("  and pays AED 7,500 + AED 6,250 = AED 13,750",
   sick40.pay === 13750, sick40.pay);
ok("  stated in words", /15 days at full pay, 25 days at half pay/.test(sick40.note), sick40.note);

const sick10more = sickLeaveEntitlement({ daysRequested: 10, alreadyTakenThisYear: 10,
                                          monthlySalary: 15000 });
ok("someone 10 days in gets 5 more at full pay, then half",
   sick10more.full === 5 && sick10more.half === 5,
   { full: sick10more.full, half: sick10more.half });

const sickProb = sickLeaveEntitlement({ daysRequested: 5, onProbation: true, monthlySalary: 15000 });
ok("there is no paid sick leave during probation", sickProb.pay === 0 && sickProb.allowed === 0);
ok("  and it says so", /no paid sick leave during probation/i.test(sickProb.note), sickProb.note);

const sickOver = sickLeaveEntitlement({ daysRequested: 20, alreadyTakenThisYear: 85, monthlySalary: 15000 });
ok("the 90-day annual limit is enforced", sickOver.allowed === 5 && sickOver.refused === 15,
   { allowed: sickOver.allowed, refused: sickOver.refused });

const prob = probationStatus({ joinedAt: ago(30), probationMonths: 9, asOf: NOW });
ok("a 9-month probation is capped at 6", prob.months === 6, prob.months);
ok("  with a warning explaining why", /cannot be extended or renewed/.test(prob.warning || ""), prob.warning);

const n = noticePeriod({ contractNoticeDays: 15, resignedOn: ago(0) });
ok("15 days' notice is raised to the statutory 30", n.applied === 30, n.applied);
ok("120 days' notice is capped at 90",
   noticePeriod({ contractNoticeDays: 120 }).applied === 90);
ok("60 days agreed is honoured", noticePeriod({ contractNoticeDays: 60 }).applied === 60);

/* GRATUITY — basic only, 21 days/yr for 5 years then 30, capped at 2 years' pay. */
const g3 = gratuity({ basicMonthlySalary: 12000, joinedAt: ago(Math.round(3 * 365.25)), lastDay: NOW });
ok("3 years on AED 12,000 basic = 63 days = AED 25,200",
   near(g3.amount, 25200, 60), g3.amount);
ok("  computed on basic only, at AED 400 a day", g3.dailyRate === 400, g3.dailyRate);

const g8 = gratuity({ basicMonthlySalary: 12000, joinedAt: ago(Math.round(8 * 365.25)), lastDay: NOW });
ok("8 years = 5×21 + 3×30 = 195 days = AED 78,000", near(g8.amount, 78000, 120), g8.amount);

const g11m = gratuity({ basicMonthlySalary: 12000, joinedAt: ago(330), lastDay: NOW });
ok("under one year of service earns no gratuity", g11m.amount === 0, g11m.amount);
ok("  and says why", /below 1 year of continuous service/.test(g11m.note), g11m.note);

const gLong = gratuity({ basicMonthlySalary: 10000, joinedAt: ago(Math.round(30 * 365.25)), lastDay: NOW });
ok("30 years is capped at 2 years' pay = AED 240,000", gLong.amount === 240000, gLong.amount);
ok("  and reports that it was capped", gLong.capped === true);
ok("  the workings show the cap", gLong.workings.some(w => /capped/.test(w)), gLong.workings);

const fs = finalSettlement({
  basicMonthlySalary: 12000, monthlySalary: 20000,
  joinedAt: ago(Math.round(3 * 365.25)), lastDay: NOW, unusedLeaveDays: 12,
  outstandingCommission: 45000, deductions: [{ label: "Salary advance", amount: 5000 }],
});
ok("a final settlement adds gratuity + leave + commission − deductions",
   near(fs.total, 25200 + 8000 + 45000 - 5000, 80), fs.total);
ok("  and itemises every line", fs.lines.length === 4, fs.lines.length);
ok("  showing the deduction as negative", fs.lines.some(l => l.amount === -5000));

/* THE COMPLIANCE REGISTER — the reason HR and the CRM share a database. */
head("COMPLIANCE — where HR meets RERA");

const reg = complianceRegister([
  { id: "u1", name: "Sara", kind: "person", expiries: { brn: ago(-12), visa: ago(-200) } },
  { id: "u2", name: "Omar", kind: "person", expiries: { brn: ago(9) } },        // lapsed
  { id: "o1", name: "The agency", kind: "org", expiries: { orn: ago(-45) } },
], NOW);
ok("an expired broker card is surfaced", reg.expired === 1, reg.expired);
ok("  worst first", reg.rows[0].subject === "Omar", reg.rows[0].subject);
ok("  in words", /Broker card \(BRN\) for Omar expired 9 days ago/.test(reg.rows[0].note), reg.rows[0].note);
ok("a BRN 12 days out is urgent", reg.rows.some(r => r.subject === "Sara" && r.key === "brn" && r.level === "urgent"));
ok("a visa 200 days out is not raised yet", !reg.rows.some(r => r.key === "visa"));
ok("the headline names the expired count", /has already expired/.test(reg.headline), reg.headline);

ok("an agent with a lapsed BRN cannot broker",
   canBroker({ name: "Omar", expiries: { brn: ago(9) } }, NOW).ok === false);
ok("  and is told their listings are affected",
   /listing held under it is not compliant/.test(canBroker({ name: "Omar", expiries: { brn: ago(9) } }, NOW).reason));
ok("an agent 20 days from expiry can still broker, with a warning",
   canBroker({ name: "Sara", expiries: { brn: ago(-20) } }, NOW).ok === true &&
   canBroker({ name: "Sara", expiries: { brn: ago(-20) } }, NOW).warn === true);
ok("an agent with no BRN recorded cannot broker",
   canBroker({ name: "New", expiries: {} }, NOW).ok === false);

/* ════════════════════════ LISTINGS ════════════════════════ */
head("LISTINGS — nothing may be advertised without the paperwork");

const v0 = canAdvertise({}, null, null, NOW);
ok("a bare listing cannot be advertised", v0.ok === false);
ok("  every reason is given, not just the first", v0.blocking.length === 2, v0.blocking.length);
ok("  Form A is named", v0.blocking.some(x => x.key === "formA"));
ok("  the Trakheesi permit is named", v0.blocking.some(x => x.key === "permitNumber"));
ok("  the summary fits one row", /2 things stop this being advertised/.test(v0.summary), v0.summary);

ok("Form A alone is not enough — the permit is still missing",
   canAdvertise({ formA: { signedAt: ago(3) } }, null, null, NOW).blocking.map(x => x.key).join() === "permitNumber",
   canAdvertise({ formA: { signedAt: ago(3) } }, null, null, NOW).blocking.map(x => x.key));

const good = { formA: { signedAt: ago(10) }, permitNumber: "71-2026-4412", permitExpiresAt: ago(-40) };
ok("Form A + a live permit clears it", canAdvertise(good, null, null, NOW).ok === true, canAdvertise(good, null, null, NOW).blocking);

const expired = { ...good, permitExpiresAt: ago(6) };
const ve = canAdvertise(expired, null, null, NOW);
ok("an expired permit blocks it", ve.ok === false);
ok("  saying how long ago, and that adverts are now a violation",
   /expired 6 days ago/.test(ve.blocking[0].fail) && /violation/.test(ve.blocking[0].fail),
   ve.blocking[0].fail);

const vs = canAdvertise({ ...good, permitExpiresAt: ago(-9) }, null, null, NOW);
ok("a permit 9 days out warns but does not block", vs.ok === true && vs.warnings.length === 1);
ok("  with the days remaining", /expires in 9 days/.test(vs.warnings[0].note), vs.warnings[0].note);

ok("a permit with no expiry recorded warns nobody will be told",
   /nobody will be warned/.test(canAdvertise({ formA: { signedAt: ago(10) }, permitNumber: "X" }, null, null, NOW).warnings[0]?.note || ""));

/* The link between HR and listings — why they share a database. */
const vb = canAdvertise(good, { name: "Omar", expiries: { brn: ago(5) } }, null, NOW);
ok("a lapsed broker card blocks that agent's listing", vb.ok === false);
ok("  naming the broker card", vb.blocking.some(x => x.key === "brokerValid"));
ok("an agent 20 days from BRN expiry warns only",
   canAdvertise(good, { name: "Sara", expiries: { brn: ago(-20) } }, null, NOW).ok === true);
ok("an expired agency ORN blocks everything",
   canAdvertise(good, null, { expiries: { orn: ago(15) } }, NOW).ok === false);

const prog = complianceProgress(good, { name: "S", expiries: { brn: ago(-200) } });
ok("progress is 4 of 4 when everything is in place", prog.done === 4 && prog.total === 4, prog);

/* The number that should frighten an owner. */
const agency = listingCompliance(
  [{ id: "1", agentId: "a", ...good, postedTo: ["pf", "bayut"] },   // live and compliant
   { id: "2", agentId: "a", ...expired, postedTo: ["pf"] },         // LIVE ON AN EXPIRED PERMIT
   { id: "3", agentId: "a" }],                                      // draft, nothing done
  { a: { name: "Sara", expiries: { brn: ago(-300) } } }, NOW);
ok("an agency is told how many adverts are running that should not be",
   agency.violating === 1, agency.violating);
ok("  and to take them down",
   /marked as posted but/.test(agency.headline) && /[Tt]ake it down/.test(agency.headline), agency.headline);
/* Of the three: one is live and compliant, one is live on an expired permit,
   one is an untouched draft. So one clear and two blocked — and only the live
   one that breaches counts as a violation. A draft nobody advertised is not. */
ok("  one is clear, two are blocked", agency.clear === 1 && agency.blocked === 2,
   { clear: agency.clear, blocked: agency.blocked });
ok("  a draft that was never advertised is not a violation",
   agency.violatingRows.every(r => r.listing.id !== "3"));

ok("the portal buttons state plainly that nothing is published for you",
   /does not publish to portals/.test(POSTED_NOTE) && /changes nothing on the portal/.test(POSTED_NOTE));
ok("three portals are offered", PORTALS.length === 3, PORTALS.length);
ok("every requirement explains itself in plain words",
   LISTING_REQUIREMENTS.every(r => r.what.length > 30 && r.fail.length > 30));

console.log(`\n${"═".repeat(64)}`);
console.log(`  ${pass} passed, ${fail} failed`);
console.log("═".repeat(64));
process.exit(fail ? 1 : 0);
