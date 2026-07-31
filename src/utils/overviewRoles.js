/**
 * WHO IS LOOKING AT THE OVERVIEW, AND WHAT THEY CAME FOR
 *
 * ── THE PROBLEM ─────────────────────────────────────────────────────────────
 *
 * The Overview opened with "193 communities · 31% DLD verified". That is a fact
 * about the PRODUCT, and it answers "should I trust this platform?" — a question
 * someone asks once, on their first visit.
 *
 * But this is the screen they see every morning. An agent between viewings does
 * not need the coverage statistics; they need to know who to call. An agency
 * owner logging in monthly is asking whether the AED 500 is earning its keep,
 * and nothing on the page told them.
 *
 * The role selector existed, sat at the BOTTOM, and changed four links. It
 * should sit at the top and change the page.
 *
 * ── DEFAULTING RATHER THAN ASKING ───────────────────────────────────────────
 *
 * The platform already knows who you are: orgRole is "agent", "manager" or
 * "viewer", set at signup or when an invite is accepted. Asking a user to pick
 * a role the system already knows is a question with a right answer, which is a
 * question worth not asking.
 *
 * They can still switch — a manager who also sells wants the agent view — but
 * they land on theirs.
 */

import { SEATS } from "../config/pricing";

export const VIEW = {
  AGENT: "agent",
  AGENCY: "agency",
  RESEARCH: "research",
};

export const VIEW_META = {
  [VIEW.AGENT]: {
    key: VIEW.AGENT,
    label: "My desk",
    color: "#63B3ED",
    hint: "Your pipeline, your communities, what changed",
    /* What this view answers, in the order an agent asks it at 8am. */
    answers: "Who do I call, what moved, what can I pitch",
  },
  [VIEW.AGENCY]: {
    key: VIEW.AGENCY,
    label: "My agency",
    color: "#D4A843",
    hint: "Team activity, seats and pipeline",
    answers: "Is my team using this, and is it earning its keep",
  },
  [VIEW.RESEARCH]: {
    key: VIEW.RESEARCH,
    label: "Market research",
    color: "#68D391",
    hint: "Coverage, confidence and where the returns are",
    answers: "What does this platform know, and can I trust it",
  },
};

/** Ordered for the selector. */
export const VIEWS = [VIEW.AGENT, VIEW.AGENCY, VIEW.RESEARCH];

/**
 * Which view this person should land on.
 *
 * A manager sees the agency view because their question is about the team. An
 * agent sees their desk. Anyone without an organisation — an individual
 * subscriber or a trial — gets research, because they have no pipeline or team
 * for the other two to describe.
 */
export function defaultViewFor({ orgRole, userRole, orgId } = {}) {
  const role = String(orgRole || "").toLowerCase();

  if (role === "manager" || role === "owner") return VIEW.AGENCY;
  if (role === "agent") return VIEW.AGENT;

  /* No org: nothing to show on the agency view and no pipeline on the agent
     view, so research is the only one with anything in it. */
  if (!orgId) return VIEW.RESEARCH;

  const u = String(userRole || "").toLowerCase();
  if (u === "manager" || u === "admin" || u === "superadmin") return VIEW.AGENCY;

  return VIEW.AGENT;
}

/**
 * Which views are worth offering this person.
 *
 * Someone with no organisation is not shown "My agency" — an empty team panel
 * teaches nothing and makes the product look broken. Better to offer two real
 * views than three where one is always blank.
 */
export function availableViews({ orgId } = {}) {
  if (!orgId) return [VIEW.AGENT, VIEW.RESEARCH];
  return VIEWS;
}

/**
 * Summarise a team for the agency view.
 *
 * Seat figures come from the organisation record written at signup
 * (seatsIncluded / seatsUsed). An agency paying for ten seats and using three
 * is the single most useful thing to put in front of the person holding the
 * card — it is either a reason to add agents or a reason to downgrade, and
 * hiding it does not change which.
 */
export function summariseTeam({ teamMembers = [], org = null } = {}) {
  const members = Array.isArray(teamMembers) ? teamMembers : [];
  const active = members.filter(m => String(m.status || "active").toLowerCase() === "active");

  /* ── FALLING BACK TO THE PLAN ───────────────────────────────────────────
   * seatsIncluded is written at signup, but every organisation created before
   * that field existed carries neither it nor seatsUsed — and those are exactly
   * the paying customers already on the platform.
   *
   * Without a fallback the agency panel shows "Seats in use: 1" with nothing to
   * compare it against, which is the one number on that view worth showing.
   * Deriving the allowance from the plan makes it work for existing orgs
   * without a data migration, and a migration can follow at leisure.
   *
   * "trial" and "free" are legacy plan values that predate the current tiers;
   * both are single-seat, which is what SEATS returns for anything unrecognised.
   */
  const seatsIncluded = Number(org?.seatsIncluded) || SEATS[org?.plan] || null;

  /* Prefer the counted members over the stored counter: the counter can drift
     if an increment fails, whereas the member list is the fact. */
  const seatsUsed = members.length || Number(org?.seatsUsed) || null;

  return {
    memberCount: members.length,
    activeCount: active.length,
    seatsIncluded,
    seatsUsed,
    seatsFree: seatsIncluded && seatsUsed ? Math.max(0, seatsIncluded - seatsUsed) : null,
    /* Stated so an owner can see whether they are paying for capacity they do
       not use, rather than having to work it out. */
    utilisationPct: seatsIncluded && seatsUsed
      ? Math.round((seatsUsed / seatsIncluded) * 100)
      : null,
  };
}

/**
 * The communities an agent actually works, inferred from what they have
 * touched, so "your communities" means theirs rather than the top of a citywide
 * list they have no connection to.
 */
export function myCommunities({ listings = [], myPortfolio = [], watchlist = [], communities = [] } = {}) {
  const names = new Set();
  const add = rows => (Array.isArray(rows) ? rows : []).forEach(r => {
    const c = r?.community || r?.communityName || r?.area;
    if (c) names.add(String(c).toLowerCase().trim());
  });
  add(listings); add(myPortfolio); add(watchlist);

  if (!names.size) return [];

  return communities.filter(c =>
    names.has(String(c.name || c.community || c.id || "").toLowerCase().trim())
  );
}
