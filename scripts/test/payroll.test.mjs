/**
 * PAYROLL — what each person is owed, and the file the bank needs.
 *
 * The two things that make a real estate payroll different from any other:
 * commission is most of an agent's pay, and it must not be paid until the
 * agency has actually been paid. Everything else here is the arithmetic that
 * a spreadsheet gets wrong — part months, the 30-day divisor, and the
 * half-pay sick band.
 *
 *     node scripts/test/payroll.test.mjs
 */
import { POLICY, PAYABLE_STATE, daysInMonth, employedDays, payFor, payrollRun,
         wpsReadiness, buildSIF, sifToText, VERIFIED_BY_BANK, WPS_REQUIRED }
  from "../../src/crm/model/payroll.js";
import { LAW } from "../../src/crm/model/hr.js";

let pass = 0, fail = 0;
const ok = (n, c, got) => {
  if (c) { pass++; console.log(`  ✓ ${n}`); }
  else { fail++; console.log(`  ✗ ${n}${got !== undefined ? `  →  ${JSON.stringify(got)}` : ""}`); }
};
const head = t => console.log(`\n── ${t} ${"─".repeat(Math.max(0, 58 - t.length))}`);

/* A resale at 2,000,000 × 2% = 40,000 gross; 50/50 split = 20,000 to the agent. */
const line = (state, base = 2000000) => ({ base, ratePct: 2, agentSplitPct: 50, state });

const AGENT = {
  id: "a1", name: "Agent One", basic: 6000,
  allowances: { housing: 3000, transport: 1000 },
  joinedAt: "2024-01-01",
  labourCardNo: "78412300099", iban: "AE070331234567890123456", agentId: "ADCBAEAA",
};

/* ── THE CALENDAR ─────────────────────────────────────────────────────────── */
head("PART MONTHS");

ok("February 2025 has 28 days", daysInMonth(2025, 2) === 28, daysInMonth(2025, 2));
ok("February 2024 has 29 — it was a leap year", daysInMonth(2024, 2) === 29, daysInMonth(2024, 2));
ok("July has 31", daysInMonth(2026, 7) === 31);

ok("somebody employed all month gets the whole month",
   employedDays({ joinedAt: "2020-01-01", year: 2026, month: 6 }).wholeMonth);

const joined12 = employedDays({ joinedAt: "2026-06-12", year: 2026, month: 6 });
ok("joining on the 12th of a 30-day month is 19 days, not 18",
   joined12.worked === 19, joined12);
ok("  and it is flagged partial", joined12.partial);

const left10 = employedDays({ joinedAt: "2020-01-01", lastDay: "2026-06-10", year: 2026, month: 6 });
ok("leaving on the 10th is 10 days — the last day is worked, not excluded",
   left10.worked === 10, left10);

ok("somebody who left before the month is not employed in it",
   employedDays({ joinedAt: "2020-01-01", lastDay: "2026-05-04", year: 2026, month: 6 }).notEmployed);

/* ── THE RULE THAT MATTERS MOST ───────────────────────────────────────────── */
head("COMMISSION IS PAID WHEN THE AGENCY HAS BEEN PAID");

ok("the payable state is 'received', not 'invoiced'", PAYABLE_STATE === "received", PAYABLE_STATE);

const onlyDue = payFor(AGENT, [line("due")], { year: 2026, month: 6 });
ok("a deal not yet invoiced pays no commission", onlyDue.commission === 0, onlyDue.commission);

const onlyInvoiced = payFor(AGENT, [line("invoiced")], { year: 2026, month: 6 });
ok("an INVOICED deal still pays no commission — the money has not arrived",
   onlyInvoiced.commission === 0, onlyInvoiced.commission);

const received = payFor(AGENT, [line("received")], { year: 2026, month: 6 });
ok("a received deal pays the agent 20,000", received.commission === 20000, received.commission);

ok("what is not payable yet is still shown, with the reason",
   onlyInvoiced.pending.length === 1 &&
   /has not arrived/.test(onlyInvoiced.pending[0].why), onlyInvoiced.pending);

ok("  and it carries the amount, so nobody has to work it out",
   onlyInvoiced.pending[0].amount === 20000, onlyInvoiced.pending[0]);

const mixed = payFor(AGENT, [line("received"), line("invoiced"), line("due")], { year: 2026, month: 6 });
ok("only the collected one counts", mixed.commission === 20000, mixed.commission);
ok("  and both of the others are listed as pending", mixed.pending.length === 2, mixed.pending);

/* ── THE ARITHMETIC ───────────────────────────────────────────────────────── */
head("WHAT A FULL MONTH COMES TO");

const full = payFor(AGENT, [], { year: 2026, month: 6 });
ok("basic is the whole 6,000", full.basic === 6000, full.basic);
ok("allowances add to 4,000", full.allowances === 4000, full.allowances);
ok("nothing is deducted", full.deductions === 0, full.deductions);
ok("net is 10,000", full.net === 10000, full.net);

const part = payFor({ ...AGENT, joinedAt: "2026-06-12" }, [], { year: 2026, month: 6 });
ok("a joiner on the 12th is prorated on ACTUAL days (19/30), not the 30-day divisor",
   part.basic === 3800, part.basic);
ok("  and the payslip says why",
   /19 of 30 days employed/.test(part.components[0].why), part.components[0].why);

/* ── THE DIVISOR THAT IS NOT THE CALENDAR ─────────────────────────────────── */
head("A DAY OFF COSTS THE SAME IN FEBRUARY AS IN JULY");

const feb = payFor({ ...AGENT, unpaidLeaveDays: 3 }, [], { year: 2026, month: 2 });
const jul = payFor({ ...AGENT, unpaidLeaveDays: 3 }, [], { year: 2026, month: 7 });
ok("unpaid leave uses the statutory 30-day divisor, so the cut matches",
   feb.dailyRate === jul.dailyRate, [feb.dailyRate, jul.dailyRate]);
ok("  the SHOWN rate is rounded to fils", feb.dailyRate === 333.33, feb.dailyRate);
ok("  but the deduction is computed from the exact rate, not the shown one",
   payFor({ ...AGENT, unpaidLeaveDays: 3 }, [], { year: 2026, month: 7 }).deductions === 1000,
   "double rounding would give 999.99");
ok("  three days costs 1,000", jul.deductions === 1000, jul.deductions);
ok("  and the payslip shows the working",
   /÷ 30/.test(jul.cuts[0].why), jul.cuts[0].why);

const onBasic = payFor({ ...AGENT, unpaidLeaveDays: 3 }, [],
                       { year: 2026, month: 7, policy: { deductUnpaidLeaveOn: "basic" } });
ok("an agency that deducts on basic gets a smaller cut, not the same one",
   onBasic.deductions === 600, onBasic.deductions);
ok("  because that is policy, not law", POLICY.deductUnpaidLeaveOn === "gross");

/* ── THE BAND THAT UNDERPAYS SICK PEOPLE ──────────────────────────────────── */
head("HALF PAY IS HALF, NOT NOTHING");

const sick = payFor({ ...AGENT, sickHalfPayDays: 10 }, [], { year: 2026, month: 7 });
ok("ten half-pay days cost half a day each, not a whole one",
   sick.deductions === Math.round(10 * (10000 / 30) * 0.5 * 100) / 100, sick.deductions);
ok("  and nothing like a full day, which would be 3,333.33",
   sick.deductions < 10 * (10000 / 30) * 0.75, sick.deductions);
ok("  which is 1,666.67, not 3,333.33", sick.deductions === 1666.67, sick.deductions);
ok("  and the payslip says so explicitly",
   /half a day's pay each, not a full day/.test(sick.cuts[0].why), sick.cuts[0].why);

/* ── ITEMISED, NEVER A LUMP ───────────────────────────────────────────────── */
head("DEDUCTIONS ARE NAMED");

const withCuts = payFor({ ...AGENT, deductions: [
  { label: "Salary advance", amount: 2000 }, { label: "Fine", amount: 250 } ] },
  [], { year: 2026, month: 7 });
ok("both deductions are listed separately", withCuts.cuts.length === 2, withCuts.cuts);
ok("  and total 2,250", withCuts.deductions === 2250, withCuts.deductions);
ok("  net drops to 7,750", withCuts.net === 7750, withCuts.net);

/* ── THE RUN ──────────────────────────────────────────────────────────────── */
head("THE WHOLE COMPANY");

const PEOPLE = [
  AGENT,
  { id: "a2", name: "Agent Two", basic: 5000, joinedAt: "2023-05-01",
    labourCardNo: "78412300100", iban: "AE070331234567890123457", agentId: "ADCBAEAA" },
  { id: "x9", name: "Left In May", basic: 5000, joinedAt: "2022-01-01", lastDay: "2026-05-20" },
];
const run = payrollRun(PEOPLE, { a1: [line("received")] }, { year: 2026, month: 6 });

ok("the leaver is not in the run", run.headcount === 2, run.headcount);
ok("  and is not silently counted in the total",
   run.totalNet === 10000 + 20000 + 5000, run.totalNet);
ok("commission is totalled separately", run.totalCommission === 20000, run.totalCommission);

/* ── WPS ──────────────────────────────────────────────────────────────────── */
head("NOBODY IS PAID BY WPS WITHOUT THESE");

const readiness = wpsReadiness(PEOPLE);
ok("the two with full details are ready",
   readiness.filter(r => r.ready).length === 2, readiness.map(r => r.ready));
ok("the third is not, and it says exactly what is missing",
   readiness[2].missing.length === WPS_REQUIRED.length, readiness[2].missing);
ok("  and each one says how to fix it",
   readiness[2].missing.every(m => m.fix && m.fix.length > 20));

const sif = buildSIF(run, { establishmentId: "13579246801", agentId: "ADCBAEAA" },
                     { peopleById: Object.fromEntries(PEOPLE.map(p => [p.id, p])) });

ok("the file is returned UNVERIFIED against any bank spec",
   sif.verified === false && VERIFIED_BY_BANK === false, sif.verified);
ok("  and carries a caveat saying what to do about it",
   /send one test file/i.test(sif.caveat), sif.caveat);

ok("two employee records made it in", sif.records.length === 2, sif.records.length);
ok("the salary month is YYYYMM", sif.period === "202606", sif.period);
ok("commission goes in the VARIABLE column, not fixed",
   sif.records[0].variable === 20000 && sif.records[0].fixed === 10000, sif.records[0]);
ok("  because it is not contractual salary", sif.records[1].variable === 0, sif.records[1]);

ok("the control total is the sum of the records IN THE FILE",
   sif.control.total === sif.records.reduce((a, r) => a + r.net, 0), sif.control.total);
ok("  which is 35,000 for the two included", sif.control.total === 35000, sif.control.total);
ok("the record count agrees with the rows", sif.control.records === sif.records.length);

/* The whole point: a person missing a labour card is not quietly dropped. */
const runWithGap = payrollRun([AGENT, { id: "n0", name: "No Card", basic: 4000, joinedAt: "2024-01-01" }],
                              {}, { year: 2026, month: 6 });
const gapSif = buildSIF(runWithGap, { establishmentId: "1", agentId: "X" },
                        { peopleById: { a1: AGENT, n0: { id: "n0", name: "No Card" } } });
ok("somebody who cannot be paid is reported, not skipped in silence",
   gapSif.blocked.length === 1 && gapSif.blocked[0].name === "No Card", gapSif.blocked);
ok("  and the file knows it is incomplete", gapSif.complete === false);
ok("  while the ready one still goes through", gapSif.records.length === 1);

const text = sifToText(sif);
ok("the text has one row per employee plus a control row",
   text.split("\r\n").length === 3, text.split("\r\n").length);
ok("the last row is the SCR", text.split("\r\n")[2].startsWith("SCR"));
ok("employee rows are EDR", text.split("\r\n")[0].startsWith("EDR"));
ok("the currency is stated", /AED/.test(text));

console.log(`\n${fail ? "✗" : "✓"} payroll — ${pass} passed, ${fail} failed\n`);
process.exit(fail ? 1 : 0);
