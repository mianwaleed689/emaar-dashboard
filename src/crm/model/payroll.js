/**
 * PAYROLL — WHAT EACH PERSON IS OWED THIS MONTH, AND THE FILE THE BANK NEEDS.
 * ═════════════════════════════════════════════════════════════════════════════
 *
 * WHAT THIS REPLACES
 * ──────────────────
 * Nothing. hr.js knows leave, gratuity and final settlement; commission.js knows
 * what a deal earned. Neither knows what to pay anybody on the 28th. A grep of
 * src/ for payroll, payslip, WPS and SIF returned nothing but the word "payment"
 * in the Stripe files, which is the agency paying US, not the agency paying its
 * staff.
 *
 * WHY A REAL ESTATE PAYROLL IS NOT A GENERIC PAYROLL
 * ──────────────────────────────────────────────────
 * An agent's pay is mostly not salary. It is a small fixed draw plus commission
 * that lands when the client's money lands — which is why commission.js tracks
 * four states and not a boolean. A generic payroll product asks you to type the
 * commission in, which means somebody re-keys it from a spreadsheet once a
 * month and the two numbers drift apart for ever.
 *
 * Here, `commissionEarned` is read from the same lines the Pipeline shows, and
 * ONLY in the `received` state — the agency has actually been paid. Paying an
 * agent commission on an invoice that has not been settled is lending them
 * money, and a brokerage that does it by accident finds out at the wrong time.
 * That rule is `PAYABLE_STATE` below, in one place, and it is the single most
 * important line in this file.
 *
 * WHAT IS STATUTORY AND WHAT IS POLICY
 * ────────────────────────────────────
 * Statutory figures come from hr.js LAW — they are not restated here. Anything
 * this file decides on its own is agency POLICY, is marked as such, and is
 * passed in rather than assumed, because two agencies will differ and neither
 * is wrong.
 *
 * ── THE WPS FILE: READ THIS BEFORE YOU TRUST IT ────────────────────────────
 *
 * UAE employers must pay salaries through the Wage Protection System. The
 * employer sends their bank or exchange house a SIF (Salary Information File);
 * the bank forwards it to MOHRE. A file the bank rejects is an annoyance; a
 * file it ACCEPTS with the wrong figures pays the wrong people the wrong money.
 *
 * The arithmetic below is tested and I stand behind it. THE FILE LAYOUT IS NOT
 * VERIFIED. Banks and exchange houses publish their own SIF specifications and
 * they differ in field order, header presence, date format and delimiter. I
 * have not seen the specification your bank issues.
 *
 * So `buildSIF()` returns `verified: false` and every caller must show that.
 * This is the same treatment the portal email parsers get in intake.js, for the
 * same reason: a plausible guess presented as fact is the one thing this
 * product must never do. Send one test file to your bank, and when they accept
 * it, set VERIFIED_BY_BANK and the warning goes away honestly.
 */

import { LAW } from "./hr.js";
import { computeCommission } from "./commission.js";

/* ── POLICY, NOT LAW ───────────────────────────────────────────────────────
   Nothing in this block is a statutory figure. Each agency sets these, and the
   defaults are the common Dubai brokerage arrangement, not a legal minimum. */
export const POLICY = {
  /* An agent is paid commission when the AGENCY has been paid, not when the
     invoice was raised. See the header. */
  payableState: "received",
  /* Whether an unpaid-leave day costs basic only or the full gross. Most
     contracts deduct on gross; some deduct on basic. Ask, do not assume. */
  deductUnpaidLeaveOn: "gross",
};

/** The commission state at which an agent may actually be paid. */
export const PAYABLE_STATE = POLICY.payableState;

const money = n => Math.round((Number(n) || 0) * 100) / 100;
const DAY = 86400000;

/* Calendar days in the month a date falls in — used for prorating a joiner or
   a leaver. UAE payroll conventionally divides by 30 for a daily RATE (see
   LAW.daysInMonthForPay) but prorates a part month on ACTUAL days worked over
   actual days in the month. Those are two different divisors doing two
   different jobs, and conflating them is a common spreadsheet error. */
export function daysInMonth(year, month1to12) {
  return new Date(Date.UTC(year, month1to12, 0)).getUTCDate();
}

/** Whole days of overlap between [aFrom,aTo] and [bFrom,bTo], inclusive. */
function overlapDays(aFrom, aTo, bFrom, bTo) {
  const s = Math.max(new Date(aFrom).getTime(), new Date(bFrom).getTime());
  const e = Math.min(new Date(aTo).getTime(), new Date(bTo).getTime());
  if (e < s) return 0;
  return Math.floor((e - s) / DAY) + 1;
}

/**
 * How much of this month the person was actually employed for.
 *
 * Returns whole days and the divisor used, so a payslip can show the working
 * rather than assert a number. Somebody who joined on the 12th will ask.
 */
export function employedDays({ joinedAt, lastDay, year, month }) {
  const total = daysInMonth(year, month);
  const from  = Date.UTC(year, month - 1, 1);
  const to    = Date.UTC(year, month - 1, total);

  const start = joinedAt ? Math.max(new Date(joinedAt).getTime(), from) : from;
  const end   = lastDay  ? Math.min(new Date(lastDay).getTime(),  to)   : to;

  const worked = overlapDays(start, end, from, to);
  return {
    worked,
    inMonth: total,
    wholeMonth: worked === total,
    partial: worked > 0 && worked < total,
    /* A person who left before the month began, or joins after it ends. */
    notEmployed: worked === 0,
  };
}

/**
 * One person's pay for one month.
 *
 * `person`      { basic, allowances{}, joinedAt, lastDay, unpaidLeaveDays,
 *                 sickHalfPayDays, deductions[], id, name, iban, labourCardNo }
 * `lines`       that person's commission lines (from the deals they own)
 * `opts`        { year, month, policy }
 *
 * Every component carries a `why` so a payslip can explain itself. An employee
 * querying their pay deserves the arithmetic, not an assertion — same rule the
 * rest of hr.js follows.
 */
export function payFor(person = {}, lines = [], opts = {}) {
  const year   = opts.year;
  const month  = opts.month;
  const policy = { ...POLICY, ...(opts.policy || {}) };

  const basic      = money(person.basic);
  const allowances = person.allowances || {};
  const allowTotal = money(Object.values(allowances).reduce((a, b) => a + (Number(b) || 0), 0));
  const gross      = money(basic + allowTotal);

  const emp = employedDays({ joinedAt: person.joinedAt, lastDay: person.lastDay, year, month });

  /* ── PRORATION ─────────────────────────────────────────────────────────── */
  const factor  = emp.inMonth ? emp.worked / emp.inMonth : 0;
  const proBasic = money(basic * factor);
  const proAllow = money(allowTotal * factor);

  /* ── UNPAID LEAVE ──────────────────────────────────────────────────────
     The daily rate uses the statutory 30-day divisor, NOT the calendar month.
     A February day and a July day are worth the same in UAE payroll. */
  const dailyBase = policy.deductUnpaidLeaveOn === "basic" ? basic : gross;

  /* ROUND ONCE, AT THE END. Rounding the daily rate to fils and THEN
     multiplying loses a fil every few days: 10,000 ÷ 30 = 333.333…, rounded to
     333.33, times three days = 999.99 rather than 1,000.00. It is small, it is
     always in the employer's favour, and it happens to every employee every
     month — which is exactly the class of quiet error this file exists to
     stop. `dailyRate` below is for SHOWING on the payslip. `rateExact` is what
     the arithmetic uses. Never multiply the rounded one. */
  const rateExact = dailyBase / LAW.daysInMonthForPay;
  const dailyRate = money(rateExact);
  const unpaidDays = Math.max(0, Number(person.unpaidLeaveDays) || 0);
  const unpaidCut  = money(rateExact * unpaidDays);

  /* ── SICK LEAVE AT HALF PAY ────────────────────────────────────────────
     hr.js decides how many days fall in which band. Here we only price the
     half-pay band: the employee is paid, so it is a deduction of HALF a day's
     pay per day, not a whole one. Treating a half-pay day as unpaid is a way
     to underpay somebody who is ill, which is the exact failure hr.js exists
     to prevent. */
  const halfDays = Math.max(0, Number(person.sickHalfPayDays) || 0);
  const sickCut  = money(rateExact * halfDays * 0.5);

  /* ── COMMISSION ────────────────────────────────────────────────────────
     Only what the agency has actually collected. See PAYABLE_STATE. */
  const payableLines = (lines || []).filter(l => l.state === policy.payableState);
  const commission = money(payableLines.reduce((sum, l) => {
    const c = computeCommission(l);
    return sum + (Number(c.agentShare) || 0);
  }, 0));

  const notYetPayable = (lines || []).filter(l => l.state === "invoiced" || l.state === "due");

  /* ── OTHER DEDUCTIONS — always itemised, never a lump ───────────────── */
  const deductions = (person.deductions || [])
    .map(d => ({ label: d.label || "Deduction", amount: money(d.amount) }))
    .filter(d => d.amount > 0);
  const otherCuts = money(deductions.reduce((a, d) => a + d.amount, 0));

  const earnings = money(proBasic + proAllow + commission);
  const cuts     = money(unpaidCut + sickCut + otherCuts);
  const net      = money(earnings - cuts);

  return {
    personId: person.id || "",
    name: person.name || "",
    year, month,
    notEmployed: emp.notEmployed,

    /* Every line a payslip prints, with its reasoning. */
    components: [
      { label: "Basic salary", amount: proBasic,
        why: emp.wholeMonth ? "Full month."
           : `${emp.worked} of ${emp.inMonth} days employed this month.` },
      { label: "Allowances", amount: proAllow,
        why: Object.keys(allowances).length
           ? Object.entries(allowances).map(([k, v]) => `${k} ${money(v)}`).join(", ")
           : "None on record." },
      { label: "Commission", amount: commission,
        why: payableLines.length
           ? `${payableLines.length} deal${payableLines.length === 1 ? "" : "s"} where the agency has been paid.`
           : "No collected commission this month." },
    ],
    cuts: [
      ...(unpaidCut ? [{ label: "Unpaid leave", amount: unpaidCut,
        why: `${unpaidDays} day${unpaidDays === 1 ? "" : "s"} at ${dailyRate} (${policy.deductUnpaidLeaveOn} ÷ ${LAW.daysInMonthForPay}).` }] : []),
      ...(sickCut ? [{ label: "Sick leave at half pay", amount: sickCut,
        why: `${halfDays} day${halfDays === 1 ? "" : "s"} in the half-pay band — half a day's pay each, not a full day.` }] : []),
      ...deductions.map(d => ({ ...d, why: "Recorded against this person." })),
    ],

    basic: proBasic,
    allowances: proAllow,
    commission,
    earnings,
    deductions: cuts,
    net,

    employedDays: emp,
    dailyRate,

    /* What the agent has earned but cannot be paid yet, and why. Showing this
       stops the monthly "where is my commission" conversation. */
    pending: notYetPayable.map(l => ({
      state: l.state,
      amount: money(computeCommission(l).agentShare),
      why: l.state === "due" ? "Not invoiced yet." : "Invoiced, but the money has not arrived.",
    })),
  };
}

/** Every person's pay for one month, plus the totals the SIF must agree with. */
export function payrollRun(people = [], linesByPerson = {}, opts = {}) {
  const slips = people
    .map(p => payFor(p, linesByPerson[p.id] || [], opts))
    .filter(s => !s.notEmployed);

  return {
    year: opts.year, month: opts.month,
    slips,
    headcount: slips.length,
    totalNet:        money(slips.reduce((a, s) => a + s.net, 0)),
    totalEarnings:   money(slips.reduce((a, s) => a + s.earnings, 0)),
    totalDeductions: money(slips.reduce((a, s) => a + s.deductions, 0)),
    totalCommission: money(slips.reduce((a, s) => a + s.commission, 0)),
  };
}

/* ── WHAT A PERSON MUST HAVE BEFORE THEY CAN BE PAID BY WPS ───────────────
   Checked BEFORE the file is built, so the bank's rejection is not the first
   time anybody finds out. Each says what to do, not just what is wrong. */
export const WPS_REQUIRED = [
  { key: "labourCardNo", label: "Labour card number",
    fix: "The 14-digit personal number on the MOHRE labour card. WPS identifies the employee by this, not by name." },
  { key: "iban",         label: "IBAN",
    fix: "The employee's own UAE account. WPS will not pay a third party's account." },
  { key: "agentId",      label: "Bank or exchange routing code",
    fix: "The code for the institution holding the employee's account. Their bank publishes it." },
];

export function wpsReadiness(people = []) {
  return people.map(p => {
    const missing = WPS_REQUIRED.filter(r => !String(p[r.key] || "").trim());
    return {
      personId: p.id || "", name: p.name || "",
      ready: missing.length === 0,
      missing: missing.map(m => ({ label: m.label, fix: m.fix })),
    };
  });
}

/* ── THE SIF ──────────────────────────────────────────────────────────────
   Read the header of this file before using the output. The layout below
   follows the commonly published EDR/SCR structure, but it has NOT been
   checked against your bank's specification, so it is returned unverified. */
export const VERIFIED_BY_BANK = false;

export const SIF_CAVEAT =
  "This file has not been checked against your bank's WPS specification. " +
  "Field order, date format and delimiter differ between banks and exchange houses. " +
  "Send one test file, and once your bank accepts it this warning can be removed.";

const two = n => String(n).padStart(2, "0");

/**
 * Build a WPS SIF from a completed payroll run.
 *
 * Returns the rows AND the caveat. Callers must surface `verified:false` —
 * there is no version of this that quietly presents a guess as a bank file.
 */
export function buildSIF(run, employer = {}, opts = {}) {
  const { year, month } = run;
  const period = `${year}${two(month)}`;
  const last   = daysInMonth(year, month);
  const from   = `${year}-${two(month)}-01`;
  const to     = `${year}-${two(month)}-${two(last)}`;

  const ready  = [];
  const blocked = [];

  for (const s of run.slips) {
    const p = (opts.peopleById || {})[s.personId] || {};
    const missing = WPS_REQUIRED.filter(r => !String(p[r.key] || "").trim());
    if (missing.length) {
      blocked.push({ name: s.name, personId: s.personId,
                     missing: missing.map(m => m.label) });
      continue;
    }
    ready.push({
      recordType: "EDR",
      labourCardNo: p.labourCardNo,
      agentId: p.agentId,
      iban: p.iban,
      payFrom: from,
      payTo: to,
      daysInPeriod: s.employedDays.worked,
      /* WPS splits pay into fixed and variable. Commission is variable by
         definition — it is not guaranteed and it is not part of the contract
         salary. Putting it in the fixed column misstates the contract. */
      fixed: money(s.basic + s.allowances),
      variable: money(s.commission),
      leaveDays: 0,
      net: s.net,
    });
  }

  const control = {
    recordType: "SCR",
    employerId: employer.establishmentId || "",
    employerBank: employer.agentId || "",
    createdDate: opts.createdDate || to,
    salaryMonth: period,
    records: ready.length,
    /* The control total must equal the sum of the records actually IN the
       file, not the payroll run — otherwise a blocked employee silently
       unbalances it and the bank rejects the lot. */
    total: money(ready.reduce((a, r) => a + r.net, 0)),
    currency: "AED",
  };

  return {
    verified: VERIFIED_BY_BANK,
    caveat: SIF_CAVEAT,
    period,
    records: ready,
    control,
    /* Never silently dropped. These people do not get paid this run. */
    blocked,
    complete: blocked.length === 0,
  };
}

/** The SIF as delimited text, in the order the records were built. */
export function sifToText(sif, delimiter = ",") {
  const rows = sif.records.map(r => [
    r.recordType, r.labourCardNo, r.agentId, r.iban, r.payFrom, r.payTo,
    r.daysInPeriod, r.fixed, r.variable, r.leaveDays,
  ].join(delimiter));

  const c = sif.control;
  rows.push([c.recordType, c.employerId, c.employerBank, c.createdDate,
             c.salaryMonth, c.records, c.total, c.currency].join(delimiter));

  return rows.join("\r\n");
}
