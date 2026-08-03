/**
 * HR — RUNNING THE COMPANY, ON UAE LAW.
 * ═════════════════════════════════════════════════════════════════════════════
 *
 * WHAT THIS REPLACES
 * ──────────────────
 * Nothing. A grep of src/ for payroll, annual leave, sick leave, attendance,
 * visa expiry, labour card, gratuity, end of service, employment contract and
 * appraisal returned nothing. TeamTab creates user accounts — name, email,
 * phone, temporary password — and shows a sales scoreboard. That is user
 * administration, not HR.
 *
 * WHY THE RULES LIVE IN CODE AND NOT IN SOMEBODY'S HEAD
 * ────────────────────────────────────────────────────
 * Sick leave in the UAE is not one entitlement, it is three bands: the first
 * fifteen days at full pay, the next thirty at half, the final forty-five
 * unpaid. Getting that wrong underpays a sick employee or overpays and has to
 * be clawed back. Gratuity is calculated on BASIC salary only — not the gross —
 * at twenty-one days a year for the first five years and thirty a year after,
 * capped at two years' pay. Every one of those is a place a spreadsheet gets it
 * wrong, and each mistake is somebody's money.
 *
 * So the rules are here, tested, with the reasoning in the return value. Every
 * calculation explains itself, because an employee querying their final
 * settlement deserves the arithmetic, not an assertion.
 *
 * THE PART NO GENERIC HR PRODUCT DOES
 * ───────────────────────────────────
 * A real estate agent must hold a valid broker card (BRN) to broker at all, and
 * a Trakheesi advertising permit is tied to a valid broker and agency licence.
 * So when an agent's BRN lapses, their live listings become non-compliant that
 * same day. `complianceRegister()` below is the only reason for HR and the CRM
 * to share a database — a standalone HR product cannot see the listings, and a
 * standalone CRM does not know the BRN expires on Thursday.
 *
 * EVERY FIGURE IS SOURCED
 * ───────────────────────
 * UAE Federal labour law as verified 2026-08-03; sources in PRODUCT_SPEC.md
 * §10. The statutory figures are held in LAW below, in one place, so that when
 * the law changes there is exactly one thing to edit and it is obvious what it
 * governs. They are NOT scattered through the functions.
 */

/* ── THE STATUTORY FIGURES, IN ONE PLACE ──────────────────────────────────── */
export const LAW = {
  annualLeaveDays:        30,   // calendar days, after one year of service
  sickFullPayDays:        15,   // first band  — full pay
  sickHalfPayDays:        30,   // second band — half pay
  sickUnpaidDays:         45,   // third band  — unpaid
  probationMaxMonths:      6,   // cannot be extended or renewed
  noticeMinDays:          30,   // statutory minimum
  noticeMaxDays:          90,   // maximum the parties may agree, then binding on both
  gratuityDaysFirst5:     21,   // days of BASIC pay per year, years 1–5
  gratuityDaysAfter5:     30,   // days of BASIC pay per year, year 6 onward
  gratuityMinYears:        1,   // no gratuity below one year of continuous service
  gratuityCapYears:        2,   // total capped at two years' remuneration
  daysInMonthForPay:      30,   // the conventional divisor for a daily rate
};

export const SICK_TOTAL_DAYS = LAW.sickFullPayDays + LAW.sickHalfPayDays + LAW.sickUnpaidDays; // 90

const DAY = 86400000;
const days  = (a, b) => Math.floor((new Date(b) - new Date(a)) / DAY);
const money = n => Math.round((Number(n) || 0) * 100) / 100;
const round = n => Math.round((Number(n) || 0) * 1000) / 1000;

/** Years of continuous service, as a fraction. */
export function serviceYears(joinedAt, until = Date.now()) {
  if (!joinedAt) return 0;
  return round(days(joinedAt, until) / 365.25);
}

/* ── LEAVE TYPES ──────────────────────────────────────────────────────────── */
export const LEAVE_TYPES = {
  annual:      { key: "annual",      label: "Annual leave",  paid: "full",
                 what: `${LAW.annualLeaveDays} calendar days a year once you pass one year of service.` },
  sick:        { key: "sick",        label: "Sick leave",    paid: "banded",
                 what: `Up to ${SICK_TOTAL_DAYS} days a year: first ${LAW.sickFullPayDays} at full pay, next ${LAW.sickHalfPayDays} at half, last ${LAW.sickUnpaidDays} unpaid. None during probation.` },
  maternity:   { key: "maternity",   label: "Maternity",     paid: "statutory", what: "As set by UAE law." },
  parental:    { key: "parental",    label: "Parental",      paid: "statutory", what: "As set by UAE law." },
  bereavement: { key: "bereavement", label: "Bereavement",   paid: "full",      what: "As set by UAE law." },
  hajj:        { key: "hajj",        label: "Hajj",          paid: "unpaid",    what: "Once in a career." },
  study:       { key: "study",       label: "Study",         paid: "statutory", what: "For employees in accredited study." },
  unpaid:      { key: "unpaid",      label: "Unpaid",        paid: "unpaid",
                 what: "By agreement. Unpaid days do not count toward gratuity service." },
};

/**
 * ANNUAL LEAVE — what this employee has, has taken, and may still book.
 *
 * Below one year of service the law's 30-day entitlement has not yet vested, so
 * this accrues pro-rata rather than pretending a new joiner has thirty days in
 * hand. Saying otherwise lets somebody book leave they have not earned and
 * turns their final settlement negative.
 */
export function annualLeaveBalance({ joinedAt, takenDays = 0, carriedOver = 0,
                                     asOf = Date.now() }) {
  const yrs = serviceYears(joinedAt, asOf);
  const vested = yrs >= 1;
  const accrued = vested
    ? LAW.annualLeaveDays
    : Math.floor(LAW.annualLeaveDays * Math.max(0, yrs));
  const entitlement = accrued + (Number(carriedOver) || 0);
  const remaining = money(entitlement - (Number(takenDays) || 0));
  return {
    vested, serviceYears: yrs, accrued, carriedOver, entitlement,
    taken: Number(takenDays) || 0, remaining,
    note: vested
      ? `${LAW.annualLeaveDays} days a year, ${carriedOver ? `plus ${carriedOver} carried over, ` : ""}${takenDays} taken.`
      : `Not yet at one year of service, so leave is accruing: ${accrued} of ${LAW.annualLeaveDays} days earned so far.`,
  };
}

/**
 * SICK LEAVE — the three bands, applied automatically.
 *
 * This is the calculation payroll most often gets wrong by hand, because the
 * bands run across a single absence: a 40-day illness is 15 days at full pay,
 * then 25 at half, not 40 at anything.
 */
export function sickLeaveEntitlement({ daysRequested = 0, alreadyTakenThisYear = 0,
                                       onProbation = false, monthlySalary = 0 }) {
  if (onProbation) {
    return {
      allowed: 0, refused: daysRequested, full: 0, half: 0, unpaid: 0, pay: 0,
      note: "There is no paid sick leave during probation under UAE law. " +
            "Any absence is unpaid unless the employer chooses otherwise.",
    };
  }
  const used  = Math.max(0, Number(alreadyTakenThisYear) || 0);
  const want  = Math.max(0, Number(daysRequested) || 0);
  const left  = Math.max(0, SICK_TOTAL_DAYS - used);
  const allowed = Math.min(want, left);
  const refused = want - allowed;

  /* Walk the bands from where this employee already stands in the year. */
  const bandTake = (start, size) => {
    const from = Math.max(used, start);
    const to   = Math.min(used + allowed, start + size);
    return Math.max(0, to - from);
  };
  const full   = bandTake(0, LAW.sickFullPayDays);
  const half   = bandTake(LAW.sickFullPayDays, LAW.sickHalfPayDays);
  const unpaid = bandTake(LAW.sickFullPayDays + LAW.sickHalfPayDays, LAW.sickUnpaidDays);

  const daily = (Number(monthlySalary) || 0) / LAW.daysInMonthForPay;
  const pay   = money(full * daily + half * daily * 0.5);

  return {
    allowed, refused, full, half, unpaid, pay,
    remainingAfter: left - allowed,
    note: [
      full   ? `${full} day${full === 1 ? "" : "s"} at full pay` : null,
      half   ? `${half} day${half === 1 ? "" : "s"} at half pay` : null,
      unpaid ? `${unpaid} day${unpaid === 1 ? "" : "s"} unpaid` : null,
      refused ? `${refused} day${refused === 1 ? "" : "s"} beyond the ${SICK_TOTAL_DAYS}-day annual limit` : null,
    ].filter(Boolean).join(", ") + ".",
  };
}

/* ── PROBATION AND NOTICE ─────────────────────────────────────────────────── */

export function probationStatus({ joinedAt, probationMonths = LAW.probationMaxMonths,
                                  asOf = Date.now() }) {
  const capped = Math.min(Number(probationMonths) || 0, LAW.probationMaxMonths);
  const ends = new Date(joinedAt);
  ends.setMonth(ends.getMonth() + capped);
  const left = days(asOf, ends);
  return {
    months: capped,
    cappedByLaw: (Number(probationMonths) || 0) > LAW.probationMaxMonths,
    endsAt: ends.toISOString().slice(0, 10),
    onProbation: left > 0,
    daysLeft: left,
    note: left > 0
      ? `On probation for another ${left} day${left === 1 ? "" : "s"}, ending ${ends.toISOString().slice(0, 10)}.`
      : `Probation ended ${Math.abs(left)} day${Math.abs(left) === 1 ? "" : "s"} ago.`,
    warning: (Number(probationMonths) || 0) > LAW.probationMaxMonths
      ? `A probation of ${probationMonths} months exceeds the ${LAW.probationMaxMonths}-month maximum, which cannot be extended or renewed. It has been capped.`
      : null,
  };
}

export function noticePeriod({ contractNoticeDays = LAW.noticeMinDays, resignedOn }) {
  const agreed = Number(contractNoticeDays) || LAW.noticeMinDays;
  const applied = Math.min(Math.max(agreed, LAW.noticeMinDays), LAW.noticeMaxDays);
  const last = resignedOn ? new Date(new Date(resignedOn).getTime() + applied * DAY) : null;
  return {
    agreed, applied,
    lastWorkingDay: last ? last.toISOString().slice(0, 10) : null,
    note: `${applied} days' notice. The statutory minimum is ${LAW.noticeMinDays}; up to ${LAW.noticeMaxDays} may be agreed and then binds both sides.`,
    warning: agreed < LAW.noticeMinDays
      ? `The contract says ${agreed} days, below the ${LAW.noticeMinDays}-day statutory minimum. ${LAW.noticeMinDays} has been applied.`
      : agreed > LAW.noticeMaxDays
      ? `The contract says ${agreed} days, above the ${LAW.noticeMaxDays}-day maximum. ${LAW.noticeMaxDays} has been applied.`
      : null,
  };
}

/**
 * END-OF-SERVICE GRATUITY.
 *
 * On BASIC salary only. Twenty-one days per year for the first five years,
 * thirty per year thereafter, capped at two years' remuneration, and nothing
 * below one year of continuous service.
 *
 * The workings are returned because this is the number an employee is most
 * likely to challenge, and they are entitled to see how it was reached.
 */
export function gratuity({ basicMonthlySalary = 0, joinedAt, lastDay = Date.now(),
                           unpaidLeaveDays = 0 }) {
  const basic = Number(basicMonthlySalary) || 0;
  const daily = basic / LAW.daysInMonthForPay;
  const grossDays = days(joinedAt, lastDay) - (Number(unpaidLeaveDays) || 0);
  const yrs = round(Math.max(0, grossDays) / 365.25);

  if (yrs < LAW.gratuityMinYears) {
    return {
      years: yrs, amount: 0, capped: false, dailyRate: money(daily), workings: [],
      note: `No gratuity is due below ${LAW.gratuityMinYears} year of continuous service. This is ${yrs} years.`,
    };
  }

  const first5 = Math.min(yrs, 5);
  const after5 = Math.max(0, yrs - 5);
  const d1 = first5 * LAW.gratuityDaysFirst5;
  const d2 = after5 * LAW.gratuityDaysAfter5;
  const raw = money((d1 + d2) * daily);
  const cap = money(basic * 12 * LAW.gratuityCapYears);
  const amount = Math.min(raw, cap);

  const workings = [
    `Basic salary ${money(basic).toLocaleString()} ÷ ${LAW.daysInMonthForPay} = ${money(daily).toLocaleString()} a day`,
    `${first5.toFixed(2)} years × ${LAW.gratuityDaysFirst5} days = ${round(d1)} days`,
    ...(after5 > 0 ? [`${after5.toFixed(2)} further years × ${LAW.gratuityDaysAfter5} days = ${round(d2)} days`] : []),
    `${round(d1 + d2)} days × ${money(daily).toLocaleString()} = ${raw.toLocaleString()}`,
    ...(raw > cap ? [`capped at ${LAW.gratuityCapYears} years' pay = ${cap.toLocaleString()}`] : []),
  ];

  return {
    years: yrs, dailyRate: money(daily), daysAccrued: round(d1 + d2),
    raw, cap, amount, capped: raw > cap, workings,
    note: raw > cap
      ? `Capped at ${LAW.gratuityCapYears} years' remuneration.`
      : `${round(d1 + d2)} days of basic pay across ${yrs} years of service.`,
  };
}

/**
 * FINAL SETTLEMENT — the whole of what an agency owes somebody who leaves.
 *
 * Unused annual leave is encashed; outstanding commission is included, because
 * in this industry it is usually the largest line and the one most often
 * forgotten. Deductions are listed rather than netted silently.
 */
export function finalSettlement({ basicMonthlySalary = 0, monthlySalary = 0,
                                  joinedAt, lastDay = Date.now(),
                                  unusedLeaveDays = 0, outstandingCommission = 0,
                                  deductions = [], unpaidLeaveDays = 0 }) {
  const g = gratuity({ basicMonthlySalary, joinedAt, lastDay, unpaidLeaveDays });
  const dailyGross = (Number(monthlySalary) || 0) / LAW.daysInMonthForPay;
  const leaveEncashment = money((Number(unusedLeaveDays) || 0) * dailyGross);
  const ded = (deductions || []).reduce((a, d) => a + (Number(d.amount) || 0), 0);
  const total = money(g.amount + leaveEncashment + (Number(outstandingCommission) || 0) - ded);

  return {
    gratuity: g,
    leaveEncashment,
    leaveDays: Number(unusedLeaveDays) || 0,
    outstandingCommission: money(outstandingCommission),
    deductions: deductions || [],
    deductionsTotal: money(ded),
    total,
    lines: [
      { label: `End-of-service gratuity (${g.years} years)`, amount: g.amount },
      { label: `Unused annual leave (${unusedLeaveDays} days)`, amount: leaveEncashment },
      { label: "Outstanding commission", amount: money(outstandingCommission) },
      ...(deductions || []).map(d => ({ label: d.label || "Deduction", amount: -Math.abs(Number(d.amount) || 0) })),
    ].filter(l => l.amount !== 0),
  };
}

/* ── OFFBOARDING ──────────────────────────────────────────────────────────
   The step every generic HR product misses is the last one. An agent's leads,
   listings and live deals belong to the agency, and their BRN has to be moved
   or cancelled or the agency carries a broker it no longer employs.          */

export const OFFBOARDING_STEPS = [
  { key: "notice",      label: "Notice acknowledged",     owner: "hr",
    what: "Resignation accepted in writing, last working day agreed." },
  { key: "leads",       label: "Leads reassigned",        owner: "manager",
    what: "Every open lead moved to another agent. Nothing is left owned by a leaver." },
  { key: "listings",    label: "Listings reassigned",     owner: "manager",
    what: "Listings moved. A listing under a departed broker's BRN is not compliant." },
  { key: "deals",       label: "Live deals handed over",  owner: "manager",
    what: "Deals in progress transferred, with the commission split agreed in writing first." },
  { key: "property",    label: "Company property returned", owner: "hr",
    what: "Laptop, phone, keys, access cards." },
  { key: "access",      label: "System access revoked",   owner: "hr",
    what: "On the last working day, not before and not a week after." },
  { key: "brn",         label: "BRN transferred or cancelled", owner: "hr",
    what: "The broker card is tied to your agency. It must be moved or cancelled." },
  { key: "settlement",  label: "Final settlement paid",   owner: "finance",
    what: "Gratuity, unused leave, outstanding commission, less any deductions." },
  { key: "visa",        label: "Visa cancelled",          owner: "hr",
    what: "Labour contract and residence visa cancelled with MOHRE and immigration." },
];

/* ── THE COMPLIANCE REGISTER ──────────────────────────────────────────────
   Why HR and the CRM share a database. Nothing else in either half can answer
   "which of my live listings stop being legal this month".                   */

export const EXPIRY_WARN_DAYS = [90, 60, 30];

export const TRACKED_EXPIRIES = [
  { key: "brn",          label: "Broker card (BRN)",  scope: "person",
    why: "An agent whose BRN has lapsed cannot lawfully broker, and their listings stop being compliant the same day. Renewal means re-sitting the RERA exam and completing DREI continuing development, applied for through Trakheesi — start a month early." },
  { key: "visa",         label: "Residence visa",     scope: "person",
    why: "An expired visa stops the employee working and carries fines." },
  { key: "emiratesId",   label: "Emirates ID",        scope: "person", why: "Required for most transactions and renewals." },
  { key: "labourCard",   label: "Labour card",        scope: "person", why: "MOHRE work permit. Must match the visa." },
  { key: "passport",     label: "Passport",           scope: "person", why: "A visa cannot be renewed against a short-dated passport." },
  { key: "medical",      label: "Medical insurance",  scope: "person", why: "Mandatory cover in Dubai." },
  { key: "orn",          label: "Agency ORN",         scope: "org",
    why: "The agency's registration. Every Trakheesi permit is issued against it." },
  { key: "tradeLicence", label: "Trade licence",      scope: "org", why: "The company cannot trade without it." },
  { key: "trakheesi",    label: "Advertising permit", scope: "listing",
    why: "The advert must carry a live permit number. An expired permit makes a published listing a violation." },
];

/**
 * Everything expiring, worst first, in words somebody can act on.
 * `subjects` is a flat list: { id, name, kind: 'person'|'org'|'listing', expiries: { brn: '2026-09-01', ... } }
 */
export function complianceRegister(subjects = [], asOf = Date.now()) {
  const defs = Object.fromEntries(TRACKED_EXPIRIES.map(t => [t.key, t]));
  const rows = [];

  subjects.forEach(s => {
    Object.entries(s.expiries || {}).forEach(([key, date]) => {
      const def = defs[key];
      if (!def || !date) return;
      const left = days(asOf, date);
      const level = left < 0 ? "expired" : left <= 30 ? "urgent" : left <= 60 ? "soon" : left <= 90 ? "watch" : "ok";
      if (level === "ok") return;
      rows.push({
        subjectId: s.id, subject: s.name, kind: s.kind || def.scope,
        key, label: def.label, why: def.why, expiresOn: date, daysLeft: left, level,
        note: left < 0
          ? `${def.label} for ${s.name} expired ${Math.abs(left)} day${Math.abs(left) === 1 ? "" : "s"} ago.`
          : left === 0 ? `${def.label} for ${s.name} expires today.`
          : `${def.label} for ${s.name} expires in ${left} day${left === 1 ? "" : "s"}.`,
      });
    });
  });

  rows.sort((a, b) => a.daysLeft - b.daysLeft);
  const count = l => rows.filter(r => r.level === l).length;
  return {
    rows,
    expired: count("expired"), urgent: count("urgent"),
    soon: count("soon"), watch: count("watch"),
    /* The sentence an owner needs on a dashboard. */
    headline: rows.length === 0
      ? "Nothing expires in the next 90 days."
      : count("expired") > 0
        ? `${count("expired")} document${count("expired") === 1 ? " has" : "s have"} already expired.`
        : `${count("urgent")} expire within 30 days.`,
  };
}

/**
 * Can this agent legally hold a listing today? The question that makes one
 * database out of two products.
 */
export function canBroker(person, asOf = Date.now()) {
  const brn = person?.expiries?.brn;
  if (!brn) return { ok: false, reason: `No broker card (BRN) recorded for ${person?.name || "this agent"}. A BRN is required to broker in Dubai.` };
  const left = days(asOf, brn);
  if (left < 0) return { ok: false, daysLeft: left, reason: `Broker card expired ${Math.abs(left)} day${Math.abs(left) === 1 ? "" : "s"} ago. Any listing held under it is not compliant.` };
  if (left <= 30) return { ok: true, warn: true, daysLeft: left, reason: `Broker card expires in ${left} days. Renewal should already be under way.` };
  return { ok: true, warn: false, daysLeft: left, reason: "" };
}
