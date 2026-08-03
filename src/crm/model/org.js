/**
 * WHO SEES WHAT — DEPARTMENT, SENIORITY, AND SCOPE.
 * ═════════════════════════════════════════════════════════════════════════════
 *
 * THE STRUCTURAL MISTAKE THIS FIXES
 * ─────────────────────────────────
 * The application had ONE axis: `orgRole` — agent, manager, director, owner.
 * Every screen was then written as "if manager show more". That is why an owner
 * and an agent opened My Leads and saw almost the same thing, and it is why
 * there was nowhere at all to put an HR officer, a finance clerk, a listings
 * coordinator or a PRO.
 *
 * A brokerage is not a sales team with some extra people attached. It is a
 * company. The HR officer is not "an agent with fewer permissions" — they do a
 * different job, need a different screen, and must NOT see a client's phone
 * number. The conveyancing coordinator does not want deals grouped by agent;
 * they want every outstanding NOC in the company in one list.
 *
 * So there are three axes, not one:
 *
 *   DEPARTMENT  — which part of the company you work in
 *   SENIORITY   — staff, lead, manager, director, owner
 *   SCOPE       — how much of each thing you may see: own / team / org / none
 *
 * Scope is derived, never typed in by hand on a screen. Every tab asks
 * `scopeFor(user, "leads")` and renders accordingly, so a new department is a
 * table entry here rather than another `if` in four tabs.
 *
 * WHY PII IS ITS OWN GATE
 * ───────────────────────
 * Marketing needs to know that Property Finder converts better than Bayut. They
 * do not need the buyer's mobile number. Finance needs the commission on a deal,
 * not the client's passport. `canSeeClientContact()` is separate from scope for
 * exactly that reason — several departments legitimately need the FIGURES from
 * the sales data while having no business with the PEOPLE in it.
 */

/* ── DEPARTMENTS ───────────────────────────────────────────────────────────
   Every brokerage has most of these. A company that does not use one simply
   has nobody in it. `sales` is one department among several, not the default. */
export const DEPARTMENTS = {
  sales:        { key: "sales",        label: "Sales",
                  what: "Brokers and their managers. The only department that needs a broker card." },
  listings:     { key: "listings",     label: "Listings & marketing",
                  what: "Prepares listings, obtains Trakheesi permits, posts to the portals." },
  conveyancing: { key: "conveyancing", label: "Conveyancing",
                  what: "Takes a signed deal to the trustee office. Chases NOCs and paperwork." },
  finance:      { key: "finance",      label: "Finance",
                  what: "Invoices commission, collects it, runs payroll." },
  hr:           { key: "hr",           label: "HR",
                  what: "People, contracts, leave, documents, payroll input." },
  admin:        { key: "admin",        label: "Admin & PRO",
                  what: "Visas, licences, government relations, office administration." },
  management:   { key: "management",   label: "Management",
                  what: "Runs the company. Sees everything." },
  it:           { key: "it",           label: "IT",
                  what: "Systems and access. No commercial or personal data by default." },
};

/* ── SENIORITY ─────────────────────────────────────────────────────────────
   Independent of department. A finance manager and a sales manager are both
   `manager`; what they manage differs by department, not by rank. */
export const SENIORITY = {
  staff:    { key: "staff",    rank: 1, label: "Staff" },
  lead:     { key: "lead",     rank: 2, label: "Team leader" },
  manager:  { key: "manager",  rank: 3, label: "Manager" },
  director: { key: "director", rank: 4, label: "Director" },
  owner:    { key: "owner",    rank: 5, label: "Owner" },
};

export const SCOPE = { none: "none", own: "own", team: "team", org: "org" };

/* ── THE MATRIX ────────────────────────────────────────────────────────────
   For each department, how much of each thing they see at STAFF level.
   Seniority then widens it: a lead sees their team, a manager sees their
   department's whole area, a director or owner sees the organisation.

   `none` means the tab does not appear at all. An HR officer should not be
   given a Pipeline tab full of numbers they must ignore.                    */
const BASE = {
  //                leads      deals      listings   people     money      compliance
  sales:        { leads:"own",  deals:"own",  listings:"own",  people:"none", money:"own",  compliance:"own"  },
  listings:     { leads:"none", deals:"org",  listings:"org",  people:"none", money:"none", compliance:"org"  },
  conveyancing: { leads:"none", deals:"org",  listings:"none", people:"none", money:"none", compliance:"org"  },
  finance:      { leads:"none", deals:"org",  listings:"none", people:"none", money:"org",  compliance:"none" },
  hr:           { leads:"none", deals:"none", listings:"none", people:"org",  money:"none", compliance:"org"  },
  admin:        { leads:"none", deals:"none", listings:"none", people:"org",  money:"none", compliance:"org"  },
  management:   { leads:"org",  deals:"org",  listings:"org",  people:"org",  money:"org",  compliance:"org"  },
  it:           { leads:"none", deals:"none", listings:"none", people:"none", money:"none", compliance:"none" },
};

const WIDEN = { own: "team", team: "org", org: "org", none: "none" };

/**
 * How much of `area` this person may see.
 * area: leads | deals | listings | people | money | compliance
 */
export function scopeFor(user = {}, area) {
  if (user.platformAdmin) return SCOPE.org;

  const dept = user.department || legacyDepartment(user);
  const base = (BASE[dept] || BASE.sales)[area] || SCOPE.none;
  if (base === SCOPE.none) {
    /* One exception. Anybody who manages people needs to approve their leave and
       see their absence, whatever department they sit in. */
    if (area === "people" && rankOf(user) >= SENIORITY.manager.rank) return SCOPE.team;
    return SCOPE.none;
  }

  /* Seniority widens by exactly one step, and only director and above reach the
     whole organisation. An earlier version widened twice for a manager, which
     handed a sales manager every lead in the company — so the team view, the
     one thing a sales manager actually needs, could never be reached by anyone.
     A manager runs a team. Seeing across teams is what a director is for. */
  const rank = rankOf(user);
  if (rank >= SENIORITY.director.rank) return SCOPE.org;
  if (rank >= SENIORITY.lead.rank)     return WIDEN[base];
  return base;
}

export const rankOf = user =>
  SENIORITY[user?.seniority || legacySeniority(user)]?.rank || SENIORITY.staff.rank;

/* ── BACKWARD COMPATIBILITY ────────────────────────────────────────────────
   Existing users carry only `orgRole`. Nobody has a department yet, so one is
   inferred rather than demanding the whole company be re-entered before the
   app works. Everyone lands in sales except the owner and director, who become
   management — which is what they were being treated as anyway.             */
function legacyDepartment(user = {}) {
  const r = user.orgRole || "";
  if (r === "owner" || r === "director") return "management";
  return "sales";
}
function legacySeniority(user = {}) {
  const r = user.orgRole || "";
  if (r === "owner")    return "owner";
  if (r === "director") return "director";
  if (r === "manager")  return "manager";
  return "staff";
}

/**
 * May this person see a client's name, phone and email?
 *
 * Separate from scope on purpose. Marketing needs to know Property Finder
 * converts better than Bayut; they have no business with the buyer's mobile
 * number. Finance needs the commission on a deal, not the client's passport.
 */
export function canSeeClientContact(user = {}) {
  if (user.platformAdmin) return true;
  const dept = user.department || legacyDepartment(user);
  return ["sales", "conveyancing", "management"].includes(dept);
}

/** May this person see what anybody else earns? */
export function canSeePay(user = {}, aboutUserId) {
  if (user.platformAdmin) return true;
  if (user.id && user.id === aboutUserId) return true;          // always your own
  const dept = user.department || legacyDepartment(user);
  return ["hr", "finance", "management"].includes(dept);
}

/** Which tabs this person should be offered at all. */
export function visibleAreas(user = {}) {
  return ["leads", "deals", "listings", "people", "money", "compliance"]
    .filter(a => scopeFor(user, a) !== SCOPE.none);
}

/* ── WHAT EACH SCREEN BECOMES ──────────────────────────────────────────────
   The same tab, four jobs. This is the answer to "how will Leads look for an
   agent versus a manager versus the owner" — it is one tab whose question
   changes with who opened it. */
export const VIEW_INTENT = {
  leads: {
    own:  { title: "My leads",        question: "Who do I call next?" },
    team: { title: "My team's leads", question: "Who is idle, who is drowning, and what is unassigned?" },
    org:  { title: "All leads",       question: "Which sources are worth the money, and which team converts them?" },
  },
  deals: {
    own:  { title: "My deals",        question: "What is blocking mine, and what am I owed?" },
    team: { title: "My team's deals", question: "What will close this month, and who needs help?" },
    org:  { title: "All deals",       question: "What did we bill, what landed, and what is stuck?" },
  },
  listings: {
    own:  { title: "My listings",     question: "Can each of mine be advertised?" },
    team: { title: "Team listings",   question: "What stock do we hold, and what is not compliant?" },
    org:  { title: "All listings",    question: "Are we advertising anything we should not be?" },
  },
  people: {
    own:  { title: "Me",              question: "My leave, my documents, my payslips." },
    team: { title: "My team",         question: "Who is off, whose documents expire, who needs a review?" },
    org:  { title: "Everyone",        question: "The whole company — every department, not only sales." },
  },
  money: {
    own:  { title: "My commission",   question: "What am I owed, and when does it land?" },
    team: { title: "Team commission", question: "What has my team earned and invoiced?" },
    org:  { title: "Revenue",         question: "Billed, collected, outstanding, owed to agents." },
  },
  compliance: {
    own:  { title: "My compliance",   question: "Is my broker card current? Are my permits live?" },
    team: { title: "Team compliance", question: "Whose documents lapse this month?" },
    org:  { title: "Compliance",      question: "What expires, and what is already out of date?" },
  },
};

export const intentFor = (user, area) => {
  const s = scopeFor(user, area);
  return s === SCOPE.none ? null : VIEW_INTENT[area]?.[s] || null;
};

/**
 * Filter any list of records to what this person may see.
 * `teamIds` is the set of user ids reporting to them.
 */
export function visibleRecords(user = {}, area, records = [], opts = {}) {
  const scope = scopeFor(user, area);
  if (scope === SCOPE.none) return [];
  if (scope === SCOPE.org)  return records;

  const uid = user.id || user.uid;
  const ownerField = opts.ownerField || "agentId";
  if (scope === SCOPE.own) {
    return records.filter(r => r[ownerField] === uid || r.assignedTo === uid || r.createdBy === uid);
  }
  const team = new Set([uid, ...(opts.teamIds || [])]);
  return records.filter(r => team.has(r[ownerField]) || team.has(r.assignedTo));
}
