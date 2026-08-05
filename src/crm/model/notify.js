/**
 * WHO GETS TOLD, AND WHAT THE MESSAGE ACTUALLY SAYS.
 * ═════════════════════════════════════════════════════════════════════════════
 *
 * THE BRIEF
 * ─────────
 * "If there is any update in the deal process or leads, whatever, in the whole
 * system, the concerned person or department or agent, manager, sales admin, HR,
 * anyone who is related should be notified."
 *
 * WHY THIS IS DERIVED, NOT LISTED
 * ───────────────────────────────
 * The obvious way to build this is a list: on stage X, message user Y. That list
 * goes stale the first time a stage is added or a department is renamed, and
 * then somebody stops being told and nobody notices — which is worse than no
 * notifications, because people stop checking manually once they believe the
 * system will tell them.
 *
 * So recipients are DERIVED from the workflow. whoseTurn() already knows which
 * department owns the next step; this asks it. A stage added to journeys.js gets
 * notifications for free, and a department renamed in org.js cannot leave
 * anybody silently uninformed.
 *
 * THE RULE FOR THE MESSAGE
 * ────────────────────────
 * Every notification says three things: what happened, why it concerns YOU, and
 * what to do about it. A message that says only "Deal updated" makes the reader
 * open the app to find out whether it matters, which is the work the
 * notification was supposed to save.
 *
 * WHAT IT DELIBERATELY WILL NOT DO
 * ────────────────────────────────
 * It will not tell somebody about a thing they cannot see. Recipients are
 * filtered through the same access model as every screen, so an agent is never
 * notified about a colleague's commission and Accounts is never notified about
 * a lead they have no scope for. A notification is a data leak with a bell on
 * it if that check is skipped.
 */
import { whoseTurn } from "./workflow.js";
import { currentStage, nextStage, stagesOf, isComplete } from "./journeys.js";
import { DEPARTMENTS, scopeFor, canSeeClientContact } from "./org.js";

export const URGENCY = {
  now:   { key: "now",   label: "Needs attention now", rank: 3, colour: "#EF4444" },
  soon:  { key: "soon",  label: "Soon",                rank: 2, colour: "#F59E0B" },
  fyi:   { key: "fyi",   label: "For information",     rank: 1, colour: "#3B82F6" },
};

/* ── THE EVENTS ────────────────────────────────────────────────────────────
   `audience` is resolved at send time, never a fixed list of names.
     turn      — the department that owns the step now
     agent     — the agent on the deal or lead
     manager   — that agent's manager
     dept:X    — everyone in department X
     self      — the person the event is about                                */
export const EVENTS = {
  deal_moved: {
    key: "deal_moved", area: "deals", urgency: "now",
    audience: ["turn"],
    title: c => `${c.dealName} is with you`,
    body:  c => `${c.byName || "Someone"} moved it to ${c.stageLabel}. ${c.does}`,
    /* The previous owner is told too, but only that it landed — they have
       finished, so it is information, not a task. */
    alsoTell: ["byId"],
    alsoBody: c => `${c.dealName} moved on to ${c.stageLabel}, now with ${c.departmentLabel}.`,
  },

  deal_blocked: {
    key: "deal_blocked", area: "deals", urgency: "now",
    audience: ["turn"],
    title: c => `${c.dealName} is stuck`,
    /* The reason alone leaves the reader knowing they have a problem and not
       what to do about it. The instruction goes with it. */
    body:  c => `${c.blockedBy} ${c.does || ""}`.trim(),
  },

  deal_stalled: {
    key: "deal_stalled", area: "deals", urgency: "soon",
    audience: ["turn", "manager"],
    title: c => `${c.dealName} has not moved in ${c.days} days`,
    body:  c => `It is still at ${c.stageLabel}, with ${c.departmentLabel}. ${c.does}`,
  },

  document_expiring: {
    key: "document_expiring", area: "deals", urgency: "now",
    audience: ["turn", "dept:conveyancing"],
    title: c => `${c.documentLabel} on ${c.dealName} ${c.expired ? "has expired" : "expires soon"}`,
    body:  c => `${c.note} Reissue it before the transfer, or the appointment is wasted.`,
  },

  lead_assigned: {
    key: "lead_assigned", area: "leads", urgency: "now",
    audience: ["agent"],
    title: c => `New ${c.source} lead — ${c.leadName}`,
    body:  c => [
      c.routingWhy || "It has been assigned to you.",
      c.community ? `They are asking about ${c.community}.` : "",
      c.budget ? `Budget ${c.budget}.` : "",
      "Call them now — speed to first contact is the strongest thing you control.",
      c.needsReview ? "Some details could not be read from the enquiry, so check them against the original." : "",
    ].filter(Boolean).join(" "),
  },

  lead_unanswered: {
    key: "lead_unanswered", area: "leads", urgency: "now",
    audience: ["agent"],
    escalateAfterHours: 4, escalateTo: ["manager"],
    title: c => `${c.leadName} has been waiting ${c.waited}`,
    body:  c => "Nobody has called, messaged or emailed them yet. Speed to first contact is the strongest thing you control.",
  },

  viewing_tomorrow: {
    key: "viewing_tomorrow", area: "leads", urgency: "soon",
    audience: ["agent"],
    title: c => `${c.count} viewing${c.count === 1 ? "" : "s"} tomorrow`,
    body:  c => `${c.list} Confirm with each client tonight — a client who forgets is a wasted morning.`,
  },

  viewing_unwritten: {
    key: "viewing_unwritten", area: "leads", urgency: "now",
    audience: ["agent"],
    title: c => `${c.propertyName || "A viewing"} was never written up`,
    body:  c => `${c.note} The seller will ask what they said, and right now there is no answer on file.`,
  },

  viewing_clash: {
    key: "viewing_clash", area: "leads", urgency: "now",
    audience: ["agent"],
    title: c => "Two viewings too close together",
    body:  c => c.note,
  },

  lead_unassigned: {
    key: "lead_unassigned", area: "leads", urgency: "now",
    audience: ["dept:salesAdmin", "manager"],
    title: c => `${c.leadName} has nobody working it`,
    body:  c => c.routingWhy || "It could not be routed automatically. Give it to somebody.",
  },

  listing_not_compliant: {
    key: "listing_not_compliant", area: "listings", urgency: "now",
    audience: ["agent", "dept:salesAdmin", "dept:listings"],
    title: c => `${c.listingTitle} is advertised but not compliant`,
    body:  c => `${c.reason} Take it down or fix the paperwork today.`,
  },

  permit_expiring: {
    key: "permit_expiring", area: "listings", urgency: "soon",
    audience: ["dept:salesAdmin", "dept:listings", "agent"],
    title: c => `Trakheesi permit on ${c.listingTitle} expires in ${c.days} days`,
    body:  c => "Renew it before it lapses — the advert becomes a violation the day it does.",
  },

  brn_expiring: {
    key: "brn_expiring", area: "compliance", urgency: "now",
    audience: ["self", "dept:hr", "manager"],
    title: c => `${c.personName}'s broker card expires in ${c.days} days`,
    body:  c => "Renewal needs the RERA exam re-sat and DREI continuing development, applied for through Trakheesi. Start now — every listing they hold stops being compliant the day it lapses.",
  },

  document_expiry_person: {
    key: "document_expiry_person", area: "compliance", urgency: "soon",
    audience: ["self", "dept:hr", "dept:admin"],
    title: c => `${c.personName}'s ${c.documentLabel} expires in ${c.days} days`,
    body:  c => c.why || "Renew it before it lapses.",
  },

  commission_received: {
    key: "commission_received", area: "money", urgency: "fyi",
    audience: ["agent", "dept:finance"],
    title: c => `${c.dealName} — commission received`,
    body:  c => `${c.amount} landed. ${c.agentShare} is due to ${c.agentName}.`,
  },

  commission_paid: {
    key: "commission_paid", area: "money", urgency: "fyi",
    audience: ["agent"],
    title: c => `You have been paid on ${c.dealName}`,
    body:  c => `${c.agentShare} paid out.`,
  },

  leave_requested: {
    key: "leave_requested", area: "people", urgency: "soon",
    audience: ["manager", "dept:hr"],
    title: c => `${c.personName} has requested ${c.days} days' ${c.leaveType}`,
    body:  c => `${c.dates}. ${c.balanceNote || ""} Approve or decline it so they can plan, and so cover can be arranged.`.replace(/\s+/g, " ").trim(),
  },

  leave_decided: {
    key: "leave_decided", area: "people", urgency: "fyi",
    audience: ["self"],
    title: c => `Your leave was ${c.approved ? "approved" : "declined"}`,
    body:  c => `${c.dates}${c.reason ? ` — ${c.reason}` : ""}. ${c.approved
      ? "It has been taken off your balance and your team can see you are away."
      : "Speak to your manager if you need to discuss it."}`,
  },
};

/* ── WHO ───────────────────────────────────────────────────────────────────
   `people` is the roster: [{ id, name, department, seniority, managerId }]. */

function resolveAudience(tokens = [], ctx = {}, people = []) {
  const out = new Map();
  const add = (id, why) => { if (id && !out.has(id)) out.set(id, { userId: id, why }); };

  tokens.forEach(token => {
    if (token === "turn" && ctx.turnDepartment) {
      if (ctx.turnDepartment === "sales") {
        add(ctx.agentId, `You are the agent on ${ctx.dealName || "this"}.`);
      } else {
        people.filter(p => p.department === ctx.turnDepartment)
              .forEach(p => add(p.id, `It is with ${DEPARTMENTS[ctx.turnDepartment]?.label || ctx.turnDepartment}.`));
      }
    } else if (token === "agent") {
      add(ctx.agentId, "You own this one.");
    } else if (token === "self") {
      add(ctx.personId, "This is about you.");
    } else if (token === "manager") {
      const who = people.find(p => p.id === (ctx.agentId || ctx.personId));
      add(who?.managerId, "Someone who reports to you.");
    } else if (token.startsWith("dept:")) {
      const d = token.slice(5);
      people.filter(p => p.department === d)
            .forEach(p => add(p.id, `${DEPARTMENTS[d]?.label || d} handles this.`));
    } else if (token === "byId") {
      add(ctx.byId, "You moved it on.");
    }
  });

  /* Never tell somebody about their own action. */
  if (ctx.byId) out.delete(ctx.byId);
  return [...out.values()];
}

/**
 * Build the notifications for one event.
 *
 * @returns {Array<{userId, why, title, body, urgency, area, event, at}>}
 */
export function notificationsFor(eventKey, ctx = {}, people = [], now = new Date()) {
  const ev = EVENTS[eventKey];
  if (!ev) return [];

  const recipients = resolveAudience(ev.audience, ctx, people);

  /* THE CHECK THAT MAKES THIS SAFE.
     A notification about something the recipient cannot open is a data leak
     with a bell on it. Everyone is filtered through the same access model the
     screens use — so Accounts is never messaged about a lead, and an agent is
     never messaged about a colleague's commission. */
  const allowed = recipients.filter(r => {
    const person = people.find(p => p.id === r.userId);
    if (!person) return false;
    if (ev.area === "compliance" || ev.area === "people") return true;   // about them, or their job
    return scopeFor(person, ev.area) !== "none";
  });

  const title = typeof ev.title === "function" ? ev.title(ctx) : ev.title;
  const body  = typeof ev.body  === "function" ? ev.body(ctx)  : ev.body;

  /* FIELD NAMES MATCH WHAT THE APP ALREADY READS.
     The dashboard's notification listener orders by `createdAt`, and Firestore
     OMITS any document missing the field it orders by — so a notification
     written with only `at` would never have appeared at all, silently. The
     existing panel also renders `message`, not `body`. Both are emitted, with
     the richer names kept alongside, and a test asserts the pair stays in step
     because this is exactly the kind of mismatch that fails invisibly. */
  const base = allowed.map(r => ({
    userId: r.userId, why: r.why,
    title, body, message: body,
    urgency: ev.urgency, area: ev.area, event: eventKey, type: eventKey,
    at: now.toISOString(), createdAt: now.toISOString(), read: false,
    dealId: ctx.dealId || null, leadId: ctx.leadId || null, listingId: ctx.listingId || null,
  }));

  /* Some events also tell the person who just finished — as information, not a
     task, and with different wording. */
  if (ev.alsoTell && ctx.byId) {
    const alsoBody = typeof ev.alsoBody === "function" ? ev.alsoBody(ctx) : ev.alsoBody;
    base.push({
      userId: ctx.byId, why: "You moved it on.",
      title, body: alsoBody || body, message: alsoBody || body,
      urgency: "fyi", area: ev.area, event: eventKey, type: eventKey,
      at: now.toISOString(), createdAt: now.toISOString(), read: false,
      dealId: ctx.dealId || null, leadId: ctx.leadId || null, listingId: ctx.listingId || null,
    });
  }

  return base;
}

/**
 * The notifications a stage change produces — the common case, built straight
 * off the workflow so it cannot drift from whose turn it actually is.
 */
export function onStageChange(deal, by = {}, people = [], now = new Date(), opts = {}) {
  /* Carries the agency's paperwork rule, because the choice below is between
     announcing "moved" and announcing "blocked". Without it a deal whose next
     document is ticked but not filed was announced as moving while the board
     showed it stuck — and the person told it moved is the one who then does
     nothing about it. */
  const turn = whoseTurn(deal, now.getTime(), opts);
  const stage = currentStage(deal);
  const dealName = deal.client || deal.leadName || "A deal";

  if (turn.done) {
    return notificationsFor("commission_received", {
      dealId: deal.id, dealName, agentId: deal.agentId,
      agentName: deal.agentName || "the agent",
      amount: "The commission", agentShare: "Their share", byId: by.id,
    }, people, now);
  }

  const ctx = {
    dealId: deal.id, dealName,
    agentId: deal.agentId, byId: by.id, byName: by.name,
    stageLabel: stage.label, does: turn.does,
    turnDepartment: turn.department, departmentLabel: turn.departmentLabel,
    blockedBy: turn.blockedBy,
  };

  return turn.blocked
    ? notificationsFor("deal_blocked", ctx, people, now)
    : notificationsFor("deal_moved", ctx, people, now);
}

/** Sort what somebody has waiting: most urgent, then newest. */
export function inbox(notifications = [], userId) {
  return notifications
    .filter(n => n.userId === userId)
    .sort((a, b) => (URGENCY[b.urgency]?.rank || 0) - (URGENCY[a.urgency]?.rank || 0)
                 || new Date(b.at) - new Date(a.at));
}

export function inboxSummary(notifications = [], userId) {
  const mine = inbox(notifications, userId).filter(n => !n.read);
  const now = mine.filter(n => n.urgency === "now").length;
  return {
    unread: mine.length, urgent: now,
    headline: mine.length === 0 ? "Nothing needs you."
      : now ? `${now} thing${now === 1 ? "" : "s"} need${now === 1 ? "s" : ""} you now.`
      : `${mine.length} update${mine.length === 1 ? "" : "s"}.`,
  };
}
