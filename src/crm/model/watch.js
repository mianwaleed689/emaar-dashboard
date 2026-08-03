/**
 * WHAT NOBODY HAS NOTICED YET.
 * ═════════════════════════════════════════════════════════════════════════════
 *
 * WHY THIS EXISTS
 * ───────────────
 * Of the fifteen notification events, only four fire from something a human
 * does — a deal moving, a commission being invoiced, received or paid. The
 * other eleven describe things that happen because time passed: a broker card
 * approaching expiry, a Trakheesi permit lapsing, an NOC going stale, a lead
 * nobody has answered, a deal that has not moved in a fortnight.
 *
 * Those were built, tested, and had nothing to trigger them. A notification
 * system that only reports what somebody already knows they did is not much of
 * a notification system.
 *
 * THE HARD PART IS NOT NOTICING — IT IS NOT NAGGING
 * ─────────────────────────────────────────────────
 * A broker card ninety days from expiry is ninety days of "your broker card
 * expires soon" if the sweep is naive. People mute a channel that behaves like
 * that, and then miss the one message that mattered. So each warning fires ONCE
 * per threshold: at ninety days, at sixty, at thirty, and once when it has
 * actually lapsed. Every notification carries a `dedupeKey` naming exactly which
 * of those it is, and the sweep is given the keys already sent.
 *
 * That also makes the whole thing safe to run twice, which matters because a
 * cron that has failed halfway is the normal case, not the exception.
 */
import { canBroker, TRACKED_EXPIRIES } from "./hr.js";
import { canAdvertise } from "./listing.js";
import { expiringDocuments, currentStage, isComplete } from "./journeys.js";
import { whoseTurn } from "./workflow.js";
import { notificationsFor } from "./notify.js";
import { responseTime } from "./intake.js";

const DAY = 86400000;
const daysUntil = (d, now) => d ? Math.floor((new Date(d).getTime() - now) / DAY) : null;

/** The thresholds a warning fires at, and nowhere in between. */
export const THRESHOLDS = [90, 60, 30, 14, 7, 0];

/**
 * Which threshold a given "days remaining" falls into, or null if it is not at
 * one. 47 days out is between 60 and 30, so nothing fires — the sixty-day
 * warning already went, and the thirty-day one has not come due.
 */
export function thresholdFor(days, previouslySentDays = []) {
  if (days == null) return null;
  if (days < 0) return "expired";
  const hit = THRESHOLDS.find(t => days <= t && !previouslySentDays.includes(t));
  return hit == null ? null : hit;
}

const key = (...parts) => parts.filter(x => x !== null && x !== undefined).join(":");

/**
 * Everything that should be reported right now, across one agency.
 *
 * Pure: give it the data and the keys already sent, get back the notifications
 * to write. No Firestore, no clock beyond what is passed in — which is why it
 * can be tested properly and the cron around it stays a thin shell.
 *
 * @param {object} data  { people, deals, listings, leads, org }
 * @param {Set}    sent  dedupeKeys already notified
 */
export function sweep(data = {}, sent = new Set(), now = Date.now()) {
  const { people = [], deals = [], listings = [], leads = [], org = null } = data;
  const out = [];
  const at = new Date(now);

  const push = (dedupeKey, event, ctx) => {
    if (sent.has(dedupeKey)) return;
    const notes = notificationsFor(event, ctx, people, at);
    notes.forEach(n => out.push({ ...n, dedupeKey }));
  };

  /* ── BROKER CARDS ─────────────────────────────────────────────────────
     Only sales carries one. Warning an accounts clerk that they have no
     broker card would be noise about a document they never need. */
  people.filter(p => p.department === "sales").forEach(p => {
    const days = daysUntil(p.expiries?.brn, now);
    if (days == null) return;
    const t = thresholdFor(days);
    if (t == null) return;
    push(key("brn_expiring", p.id, t), "brn_expiring",
         { personId: p.id, personName: p.name, agentId: p.id, days: Math.max(0, days) });
  });

  /* ── EVERYONE'S DOCUMENTS ─────────────────────────────────────────────
     Visa, Emirates ID, labour card, passport, medical — every department. */
  const personDocs = TRACKED_EXPIRIES.filter(t => t.scope === "person" && t.key !== "brn");
  people.forEach(p => {
    personDocs.forEach(def => {
      const days = daysUntil(p.expiries?.[def.key], now);
      if (days == null) return;
      const t = thresholdFor(days);
      if (t == null) return;
      push(key("doc", def.key, p.id, t), "document_expiry_person",
           { personId: p.id, personName: p.name, documentLabel: def.label,
             days: Math.max(0, days), why: def.why });
    });
  });

  /* ── LISTINGS ─────────────────────────────────────────────────────────
     Two different problems. A permit approaching expiry is a warning. A
     listing that is ADVERTISED while not compliant is happening now. */
  listings.forEach(l => {
    const agent = people.find(p => p.id === l.agentId) || null;
    const verdict = canAdvertise(l, agent, org, now);
    const posted = (l.postedTo || l.publishedTo || []).length > 0;

    if (posted && !verdict.ok) {
      /* No threshold — this is live and wrong. It repeats daily on purpose,
         because it is not a reminder, it is a violation running right now. */
      const day = new Date(now).toISOString().slice(0, 10);
      push(key("not_compliant", l.id, day), "listing_not_compliant",
           { listingId: l.id, listingTitle: l.title || l.community || "A listing",
             agentId: l.agentId, reason: verdict.blocking[0]?.fail || verdict.summary });
    }

    const days = daysUntil(l.permitExpiresAt, now);
    if (days != null && days >= 0) {
      const t = thresholdFor(days);
      if (t != null) {
        push(key("permit", l.id, t), "permit_expiring",
             { listingId: l.id, listingTitle: l.title || l.community || "A listing",
               agentId: l.agentId, days });
      }
    }
  });

  /* ── DEALS ────────────────────────────────────────────────────────────── */
  deals.filter(d => !isComplete(d)).forEach(d => {
    const dealName = d.client || d.leadName || "A deal";
    const turn = whoseTurn(d, now);

    /* A document on the deal going stale — an NOC is the one that costs a
       trustee appointment. */
    expiringDocuments(d, now).forEach(e => {
      if (e.daysLeft > 14) return;
      const t = e.expired ? "expired" : thresholdFor(e.daysLeft);
      if (t == null) return;
      push(key("dealdoc", d.id, e.key, t), "document_expiring",
           { dealId: d.id, dealName, agentId: d.agentId,
             documentLabel: e.label, note: e.note, expired: e.expired,
             turnDepartment: turn.department });
    });

    /* Not moved in a fortnight. Measured from the last recorded step rather
       than from `updatedAt`, because updatedAt changes when somebody merely
       opens and re-saves the record — which would hide a stall. */
    const steps = d.steps || [];
    const lastMoved = steps.length
      ? new Date(steps[steps.length - 1].at).getTime()
      : new Date(d.createdAt || 0).getTime();
    if (lastMoved) {
      const idle = Math.floor((now - lastMoved) / DAY);
      if (idle >= 14) {
        const band = idle >= 30 ? 30 : 14;
        push(key("stalled", d.id, currentStage(d).key, band), "deal_stalled",
             { dealId: d.id, dealName, agentId: d.agentId, days: idle,
               stageLabel: turn.stageLabel, departmentLabel: turn.departmentLabel,
               does: turn.does, turnDepartment: turn.department });
      }
    }
  });

  /* ── LEADS ────────────────────────────────────────────────────────────
     The one that earns money. Speed to first contact predicts conversion
     better than anything else an agency controls. */
  leads.filter(l => !["Closed Deal", "Closed Outside", "Non Potential"].includes(l.status))
       .forEach(l => {
    const leadName = l.name || "A lead";

    if (!l.assignedTo) {
      const day = new Date(now).toISOString().slice(0, 10);
      push(key("unassigned", l.id, day), "lead_unassigned",
           { leadId: l.id, leadName, routingWhy: l.routingWhy });
      return;
    }

    const r = responseTime(l, now);
    if (!r.answered && r.waitingMinutes != null) {
      const hours = Math.floor(r.waitingMinutes / 60);
      /* Once at four hours, once at a day. Beyond that the manager's report is
         the right place for it, not another message. */
      const band = hours >= 24 ? 24 : hours >= 4 ? 4 : null;
      if (band) {
        push(key("unanswered", l.id, band), "lead_unanswered",
             { leadId: l.id, leadName, agentId: l.assignedTo,
               waited: band >= 24 ? "more than a day" : `${hours} hours` });
      }
    }
  });

  return out;
}

/** A one-line summary for the cron log, so a silent night is distinguishable
    from a broken one. */
export function sweepSummary(notifications = []) {
  const byEvent = {};
  notifications.forEach(n => { byEvent[n.event] = (byEvent[n.event] || 0) + 1; });
  const parts = Object.entries(byEvent).map(([e, n]) => `${e} ${n}`);
  return notifications.length
    ? `${notifications.length} sent — ${parts.join(", ")}`
    : "nothing due";
}
