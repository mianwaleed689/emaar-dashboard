/**
 * ACCESS — WHO CAN GET IN, AND WHAT THEY CAN REACH.
 *
 * WHY THIS IS A SEPARATE THING
 * ────────────────────────────
 * An IT administrator in a brokerage does a job nothing in this product served.
 * They add and remove accounts, fix "why can't Fatima see the pipeline", and
 * make sure the person who left on Thursday cannot still log in on Friday.
 *
 * org.js gives the IT department "none" on every business area — leads, deals,
 * listings, people, money, compliance — and that is right. IT has no business
 * reading a client's phone number or an agent's salary. But "no business data"
 * was implemented as "no product at all": an IT administrator logged in and
 * had two tabs, neither of which did anything for them.
 *
 * So administering ACCOUNTS is its own axis, at right angles to seeing DATA.
 * This module answers three questions and refuses the fourth:
 *
 *   who has access        every account, its role, its department, its state
 *   what can they reach   the effective permission matrix, per person
 *   what is broken        accounts that will cause a support call
 *   what do they earn     NOT ANSWERED. Nothing here returns pay, a personal
 *                         document, a client, or the content of any deal.
 *
 * The last line is the point. An access console that quietly becomes a way to
 * read the company's data is worse than no access console.
 */

import { DEPARTMENTS, SENIORITY, scopeFor, viewerFrom } from "./org.js";

/** Who may administer accounts. Deliberately not the same list as isManager. */
export function canAdministerAccounts(user = {}) {
  if (user.platformAdmin) return true;
  const dept = user.department;
  const sen  = user.seniority;
  /* IT administers accounts without reading business data. An owner or a
     director may too, because somebody has to be able to when IT is on leave —
     and they already hold every scope this would grant. A sales manager may
     not: they run a team, and handing them role assignment is how a department
     boundary quietly stops meaning anything. */
  return dept === "it" || sen === "owner" || sen === "director";
}

const AREAS = ["leads", "deals", "listings", "people", "money", "compliance"];

/**
 * What one person can actually reach, area by area.
 *
 * Computed from the same scopeFor the product uses, so this screen cannot
 * drift from the behaviour it describes — if it says a person sees the whole
 * agency's deals, that is because the product would give them the whole
 * agency's deals.
 */
export function effectiveAccess(person = {}) {
  const viewer = viewerFrom({
    firebaseUser: { uid: person.uid || person.id },
    orgRole: person.orgRole,
    userRole: person.role,
    department: person.department,
    seniority: person.seniority,
  });
  const areas = {};
  for (const a of AREAS) areas[a] = scopeFor(viewer, a);

  return {
    uid: person.uid || person.id,
    name: person.name || person.email || "Unnamed",
    email: person.email || "",
    department: person.department || "(not set)",
    departmentLabel: DEPARTMENTS[person.department]?.label || person.department || "Not set",
    seniority: person.seniority || "(not set)",
    seniorityLabel: SENIORITY[person.seniority]?.label || person.seniority || "Not set",
    orgRole: person.orgRole || "(not set)",
    status: person.status || "active",
    suspended: person.status === "suspended",
    areas,
    /* A one-line summary, because a matrix of six scopes is not readable at a
       glance and "what can this person actually do" is the question asked. */
    reach: summarise(areas),
  };
}

function summarise(areas) {
  const org  = AREAS.filter(a => areas[a] === "org");
  const team = AREAS.filter(a => areas[a] === "team");
  const own  = AREAS.filter(a => areas[a] === "own");
  if (!org.length && !team.length && !own.length) return "Nothing — this account can sign in and see no agency data.";
  const parts = [];
  if (org.length)  parts.push(`the whole agency's ${list(org)}`);
  if (team.length) parts.push(`their team's ${list(team)}`);
  if (own.length)  parts.push(`their own ${list(own)}`);
  return `Sees ${parts.join(", and ")}.`;
}

const list = a => a.length === 1 ? a[0]
  : `${a.slice(0, -1).join(", ")} and ${a[a.length - 1]}`;

/**
 * Accounts that will cause a support call, or already should have.
 *
 * Ordered by what actually hurts: work stranded on a disabled account first,
 * because that is a deal nobody is working and nobody knows it. Cosmetic gaps
 * last.
 */
export function accountHealth(people = [], { leads = [], deals = [], listings = [] } = {}) {
  const problems = [];
  const byId = new Map(people.map(p => [p.uid || p.id, p]));

  const heldBy = (id) => ({
    leads:    leads.filter(l => l.assignedTo === id || l.agentId === id).length,
    deals:    deals.filter(d => d.agentId === id).length,
    listings: listings.filter(l => l.agentId === id).length,
  });

  for (const p of people) {
    const id = p.uid || p.id;

    /* THE ONE THAT COSTS MONEY. Somebody left, their account was disabled, and
       their pipeline stayed with them — invisible to everyone, chased by
       nobody. */
    if (p.status === "suspended") {
      const h = heldBy(id);
      const total = h.leads + h.deals + h.listings;
      if (total > 0) {
        problems.push({
          severity: "high", uid: id, name: p.name || p.email,
          what: "Disabled, but still holding live work",
          detail: `${[h.leads && `${h.leads} lead${h.leads === 1 ? "" : "s"}`,
                      h.deals && `${h.deals} deal${h.deals === 1 ? "" : "s"}`,
                      h.listings && `${h.listings} listing${h.listings === 1 ? "" : "s"}`]
                     .filter(Boolean).join(", ")} are assigned to an account that cannot sign in.`,
          fix: "Reassign the work, then leave the account disabled.",
        });
      }
    }

    if (!p.department) {
      problems.push({
        severity: "medium", uid: id, name: p.name || p.email,
        what: "No department",
        detail: "Their access is being guessed from their job title rather than read from their record.",
        fix: "Set a department in Team so what they can see is decided rather than inferred.",
      });
    }

    if (p.department === "sales" && p.seniority === "staff" && !p.managerId) {
      problems.push({
        severity: "medium", uid: id, name: p.name || p.email,
        what: "No manager",
        detail: "Nobody's team includes them, so their leads appear on no manager's board.",
        fix: "Set who they report to in Team.",
      });
    }

    if (p.managerId && !byId.has(p.managerId)) {
      problems.push({
        severity: "medium", uid: id, name: p.name || p.email,
        what: "Reports to somebody who is not here",
        detail: "Their manager is not in this agency, so their work rolls up to nobody.",
        fix: "Point them at a manager who is.",
      });
    }

    if (p.status !== "suspended" && !p.lastLoginAt && !p.lastLogin) {
      problems.push({
        severity: "low", uid: id, name: p.name || p.email,
        what: "Has never signed in",
        detail: "The account exists and has never been used.",
        fix: "Check the invitation reached them, or disable the seat.",
      });
    }
  }

  /* Two accounts on one address is a support call waiting to happen: whichever
     one they remember is the one they will swear is broken. */
  const seen = new Map();
  for (const p of people) {
    const e = (p.email || "").trim().toLowerCase();
    if (!e) continue;
    if (seen.has(e)) {
      problems.push({
        severity: "medium", uid: p.uid || p.id, name: p.name || e,
        what: "Duplicate email address",
        detail: `${e} is on more than one account.`,
        fix: "Disable the one nobody uses.",
      });
    } else seen.set(e, p);
  }

  const order = { high: 0, medium: 1, low: 2 };
  problems.sort((a, b) => order[a.severity] - order[b.severity]);
  return problems;
}

/** Headline counts for the console, so nothing has to be counted by eye. */
export function accessSummary(people = [], problems = []) {
  const active    = people.filter(p => p.status !== "suspended");
  const suspended = people.filter(p => p.status === "suspended");
  const noDept    = people.filter(p => !p.department);
  const neverIn   = active.filter(p => !p.lastLoginAt && !p.lastLogin);
  return {
    accounts: people.length,
    active: active.length,
    suspended: suspended.length,
    noDepartment: noDept.length,
    neverSignedIn: neverIn.length,
    highSeverity: problems.filter(p => p.severity === "high").length,
    problems: problems.length,
  };
}
