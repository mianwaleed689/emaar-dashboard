/**
 * VIEWINGS — THE THING AN AGENT ACTUALLY SPENDS THEIR WEEK DOING.
 * ═════════════════════════════════════════════════════════════════════════════
 *
 * WHY THIS EXISTS
 * ───────────────
 * A viewing was a note. `notes_log` accepted a type of "Viewing", so somebody
 * could write "showed them 1104" and that was the entire record. It had no date,
 * so nothing could remind anybody. No listing, so nobody could tell a seller how
 * many people had been through. No outcome, so a no-show looked exactly like a
 * viewing that went well. And no feedback, so the single most common question in
 * this business — the seller ringing to ask what people said — had no answer
 * anywhere in the system.
 *
 * An agent's week IS viewings. Modelling them as free text meant the product had
 * no idea what its main users were doing all day.
 *
 * THE TWO FAILURES THIS IS SHAPED AROUND
 * ──────────────────────────────────────
 * 1. THE VIEWING NOBODY WROTE UP. It happened, the buyer said something useful,
 *    and three days later nobody can remember it. Feedback is chased, because a
 *    viewing without it is worth almost nothing to the seller who is paying you.
 *
 * 2. THE DOUBLE BOOKING. Two viewings at the same hour in different communities
 *    is a client left standing outside a building. Clashes are detected on the
 *    agent, not the property.
 */
const DAY = 86400000;
const HOUR = 3600000;

export const OUTCOMES = {
  scheduled: { key: "scheduled", label: "Booked",        colour: "#3B82F6",
               what: "Arranged and not yet happened." },
  done:      { key: "done",      label: "Viewed",        colour: "#10B981",
               what: "They saw it. Feedback is what makes this worth having." },
  noshow:    { key: "noshow",    label: "Did not turn up", colour: "#F59E0B",
               what: "Nobody came. Worth recording — a lead that no-shows twice is telling you something." },
  cancelled: { key: "cancelled", label: "Cancelled",     colour: "#6B7280",
               what: "Called off before it happened." },
};

/** How a buyer left it. Deliberately blunt — "positive" tells a seller nothing. */
export const VERDICTS = {
  offering:   { key: "offering",   label: "Wants to make an offer", weight: 5 },
  interested: { key: "interested", label: "Interested, thinking",   weight: 4 },
  maybe:      { key: "maybe",      label: "Might suit, not sure",   weight: 3 },
  wrong:      { key: "wrong",      label: "Not what they wanted",   weight: 2 },
  price:      { key: "price",      label: "Liked it, price too high", weight: 2 },
  no:         { key: "no",         label: "Definitely not",         weight: 1 },
};

export const isPast = (v, now = Date.now()) => new Date(v?.at || 0).getTime() < now;

/**
 * What state a viewing is really in — which is not always what was typed.
 * A viewing still marked "Booked" three days after it was due did not stay
 * booked; somebody forgot to close it off, and that is worth saying.
 */
export function statusOf(viewing, now = Date.now()) {
  const at = new Date(viewing?.at || 0).getTime();
  const outcome = viewing?.outcome || "scheduled";

  if (outcome !== "scheduled") {
    const needsFeedback = outcome === "done" && !(viewing.feedback || "").trim();
    return {
      key: outcome, label: OUTCOMES[outcome]?.label || outcome,
      colour: OUTCOMES[outcome]?.colour || "#6B7280",
      needsFeedback,
      note: needsFeedback
        ? "Viewed, but nothing was written down. The seller will ask what they said."
        : OUTCOMES[outcome]?.what || "",
    };
  }

  if (at > now) {
    const hours = Math.round((at - now) / HOUR);
    return {
      key: "scheduled", label: "Booked", colour: "#3B82F6", needsFeedback: false,
      note: hours <= 24
        ? `In ${hours} hour${hours === 1 ? "" : "s"}.`
        : `In ${Math.round((at - now) / DAY)} days.`,
    };
  }

  const overdue = Math.floor((now - at) / HOUR);
  return {
    key: "unclosed", label: "Not written up", colour: "#EF4444", needsFeedback: true,
    note: overdue < 24
      ? "This was due earlier today and has not been closed off. Did they come, and what did they say?"
      : `This was ${Math.floor(overdue / 24)} days ago and still says Booked. Close it off — did they come?`,
  };
}

/**
 * DOUBLE BOOKINGS.
 * Detected on the AGENT, because the same agent cannot be in Marina and JVC at
 * once. Two agents showing the same unit an hour apart is fine and common.
 */
export function clashes(viewings = [], gapMinutes = 60) {
  const out = [];
  const byAgent = {};
  viewings.filter(v => (v.outcome || "scheduled") === "scheduled" && v.at)
          .forEach(v => { (byAgent[v.agentId] = byAgent[v.agentId] || []).push(v); });

  Object.values(byAgent).forEach(list => {
    const sorted = [...list].sort((a, b) => new Date(a.at) - new Date(b.at));
    for (let i = 1; i < sorted.length; i++) {
      const gap = (new Date(sorted[i].at) - new Date(sorted[i - 1].at)) / 60000;
      if (gap < gapMinutes) {
        out.push({
          first: sorted[i - 1], second: sorted[i], gapMinutes: Math.round(gap),
          note: `${Math.round(gap)} minutes between ${sorted[i - 1].propertyName || "a viewing"} and ` +
                `${sorted[i].propertyName || "another"}. One of these clients will be left waiting.`,
        });
      }
    }
  });
  return out;
}

/** One agent's week, in the order they will walk it. */
export function diary(viewings = [], agentId, from = Date.now(), days = 7) {
  const to = from + days * DAY;
  const mine = viewings
    .filter(v => v.agentId === agentId && v.at)
    .filter(v => {
      const t = new Date(v.at).getTime();
      if (t >= from - DAY && t <= to) return true;
      /* A viewing nobody ever wrote up STAYS in the diary however old it is.
         Windowing it out after a day would hide precisely the item that needs
         action — the one that still says "Booked" from last Tuesday and that
         the seller is about to ring about. Outstanding work does not age out
         of the list just because the date passed. */
      return statusOf(v, from).key === "unclosed";
    })
    .sort((a, b) => new Date(a.at) - new Date(b.at));

  const byDay = {};
  mine.forEach(v => {
    const d = new Date(v.at).toISOString().slice(0, 10);
    (byDay[d] = byDay[d] || []).push({ ...v, status: statusOf(v, from) });
  });

  const unclosed = mine.filter(v => statusOf(v, from).key === "unclosed");
  return {
    days: Object.entries(byDay).map(([date, items]) => ({ date, items })),
    total: mine.length,
    unclosed: unclosed.length,
    clashes: clashes(mine),
    headline: mine.length === 0
      ? "Nothing booked this week."
      : unclosed.length
        ? `${mine.length} viewing${mine.length === 1 ? "" : "s"} — ${unclosed.length} still to be written up.`
        : `${mine.length} viewing${mine.length === 1 ? "" : "s"} this week.`,
  };
}

/**
 * WHAT TO TELL THE SELLER.
 * The question every owner asks, and the one an agency most often cannot answer
 * because the record was a note in somebody's head.
 */
export function sellerReport(viewings = [], listingId, now = Date.now()) {
  const all = viewings.filter(v => v.listingId === listingId);
  const done = all.filter(v => v.outcome === "done");
  const withFeedback = done.filter(v => (v.feedback || "").trim());
  const noshows = all.filter(v => v.outcome === "noshow").length;

  const verdicts = {};
  done.forEach(v => { if (v.verdict) verdicts[v.verdict] = (verdicts[v.verdict] || 0) + 1; });

  const priceObjections = (verdicts.price || 0);
  const wrongProperty = (verdicts.wrong || 0);

  return {
    booked: all.length, viewed: done.length, noshows,
    withFeedback: withFeedback.length,
    missingFeedback: done.length - withFeedback.length,
    verdicts,
    /* The honest reading. If most people who saw it liked it and said the price
       was too high, that is a price conversation, not a marketing one — and it
       is the thing an agent finds hardest to say without evidence. */
    reading: done.length === 0
      ? "Nobody has viewed it yet."
      : priceObjections >= Math.max(2, done.length / 2)
        ? `${priceObjections} of ${done.length} viewers liked it and said the price was too high. That is a price conversation, not a marketing one.`
        : wrongProperty >= Math.max(2, done.length / 2)
          ? `${wrongProperty} of ${done.length} said it was not what they were looking for. The advert may be attracting the wrong buyer.`
          : `${done.length} viewed, ${withFeedback.length} with feedback recorded.`,
    warning: done.length - withFeedback.length > 0
      ? `${done.length - withFeedback.length} viewing${done.length - withFeedback.length === 1 ? "" : "s"} ${done.length - withFeedback.length === 1 ? "has" : "have"} no feedback, so this report is incomplete.`
      : "",
  };
}

/** A viewing record, built from a lead and a listing. */
export function newViewing({ lead, listing, agentId, agentName, at, orgId }) {
  return {
    orgId: orgId || "",
    leadId: lead?.id || "", leadName: lead?.name || "",
    listingId: listing?.id || "", propertyName: listing?.title || listing?.community || "",
    agentId, agentName: agentName || "",
    at: at ? new Date(at).toISOString() : "",
    outcome: "scheduled", feedback: "", verdict: "",
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  };
}

export const FEEDBACK_PROMPT =
  "What did they actually say? The seller will ask, and \"positive\" is not an " +
  "answer they can act on.";
