/**
 * LEAD INTAKE — TURNING AN ENQUIRY FROM ANYWHERE INTO ONE LEAD.
 * ═════════════════════════════════════════════════════════════════════════════
 *
 * WHY THIS EXISTS
 * ───────────────
 * The CRM offers fifteen lead sources — Property Finder, Bayut, dubizzle, Meta,
 * Instagram, Google Ads, TikTok, referrals, walk-ins — and every one of them was
 * typed in by hand. There is no webhook anywhere in api/. So the "agency assigns
 * a lead to an agent" flow the owner asked about had an assign step and no
 * intake step: somebody re-keyed a Property Finder email into a form.
 *
 * THE RULE THIS FILE IS BUILT ON
 * ──────────────────────────────
 * Parse what you can read. Flag what you cannot. Never guess.
 *
 * A parser that silently mis-reads a budget is worse than no parser: the number
 * looks typed-in, nobody checks it, and an agent quotes a client the wrong
 * figure. So every extraction records what it found, what it could not find, and
 * the raw text it was given, and the lead carries a `needsReview` flag when
 * anything important is missing. A human confirming five fields in ten seconds
 * beats a machine inventing one of them.
 *
 * ON THE PORTAL FORMATS
 * ─────────────────────
 * The Property Finder, Bayut and dubizzle parsers below match the labelled
 * `Field: value` shape those notification emails use. They have NOT been
 * verified against a real message from any of the three — no sample was
 * available — so each is marked `verified: false` and every lead they produce
 * arrives flagged for review until somebody confirms the format against a real
 * email. That flag is the honest state, not a placeholder to be quietly
 * deleted.
 *
 * Meta's Lead Ads webhook is a documented JSON contract rather than an email,
 * so it is parsed structurally and does not carry the same caveat.
 */

/* ── SOURCES ───────────────────────────────────────────────────────────────
   `verified` records whether the parser has been checked against a real
   message from that source. It drives the review flag; it is not decoration. */
export const INTAKE_SOURCES = {
  propertyfinder: { key: "propertyfinder", label: "Property Finder", kind: "email", verified: false },
  bayut:          { key: "bayut",          label: "Bayut",           kind: "email", verified: false },
  dubizzle:       { key: "dubizzle",       label: "dubizzle",        kind: "email", verified: false },
  meta:           { key: "meta",           label: "Meta lead form",  kind: "json",  verified: true  },
  website:        { key: "website",        label: "Website form",    kind: "json",  verified: true  },
  manual:         { key: "manual",         label: "Entered by hand", kind: "manual",verified: true  },
};

/* ── PHONE ─────────────────────────────────────────────────────────────────
   A UAE mobile arrives as 0501234567, 501234567, +971 50 123 4567 or
   00971501234567. They are the same person, and a CRM that treats them as four
   different leads will show four different agents calling the same buyer. */
export function normalisePhone(raw) {
  const digits = String(raw || "").replace(/[^\d]/g, "");
  if (!digits) return null;
  let d = digits;
  if (d.startsWith("00")) d = d.slice(2);
  if (d.startsWith("971")) d = d.slice(3);
  else if (d.startsWith("0")) d = d.slice(1);
  /* A UAE mobile is 9 digits after the country code and starts with 5. Anything
     else is kept as given rather than mangled into a number that looks valid. */
  if (d.length === 9 && d.startsWith("5")) return "+971" + d;
  return "+" + digits.replace(/^0+/, "");
}

export const isUaeMobile = p => /^\+9715\d{8}$/.test(String(p || ""));

const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/;

/* ── FIELD EXTRACTION ──────────────────────────────────────────────────────
   Portal notification emails label their fields. Rather than one brittle
   regular expression per portal, this pulls `Label: value` pairs generically
   and then maps the labels each portal happens to use. A portal that renames
   "Mobile" to "Phone number" then costs one line here, not a rewrite. */
export function labelledFields(text) {
  const out = {};
  String(text || "").split(/\r?\n/).forEach(line => {
    const m = line.match(/^\s*([A-Za-z][A-Za-z /'&-]{1,38}?)\s*[:\t]\s*(.+?)\s*$/);
    if (m) {
      const key = m[1].toLowerCase().replace(/\s+/g, " ").trim();
      if (!(key in out)) out[key] = m[2].trim();
    }
  });
  return out;
}

const ALIASES = {
  name:     ["name", "client name", "full name", "customer name", "sender name", "from", "lead name", "contact name"],
  phone:    ["phone", "mobile", "phone number", "mobile number", "contact number", "tel", "telephone", "whatsapp"],
  email:    ["email", "e-mail", "email address", "sender email"],
  budget:   ["budget", "price", "max budget", "budget range", "asking price"],
  property: ["property", "listing", "reference", "ref", "property reference", "unit", "listing reference", "ad title", "title"],
  community:["location", "area", "community", "district", "neighbourhood"],
  message:  ["message", "enquiry", "comments", "note", "notes", "details"],
};

const pick = (fields, group) => {
  for (const a of ALIASES[group] || []) if (fields[a]) return fields[a];
  return null;
};

/** "AED 2,500,000", "2.5M", "2500000" → 2500000. Returns null when unsure. */
export function parseBudget(raw) {
  if (raw == null) return null;
  const s = String(raw).replace(/,/g, "").trim();
  const m = s.match(/(\d+(?:\.\d+)?)\s*([mMkK])?/);
  if (!m) return null;
  let n = parseFloat(m[1]);
  if (!Number.isFinite(n) || n <= 0) return null;
  const unit = (m[2] || "").toLowerCase();
  if (unit === "m") n *= 1e6;
  else if (unit === "k") n *= 1e3;
  /* A bare number below 1000 is far more likely to be a bedroom count, a page
     number or a reference than a budget. Refuse it rather than record AED 3. */
  if (!unit && n < 1000) return null;
  return Math.round(n);
}

/**
 * Turn anything into one lead.
 *
 * @returns {{
 *   lead: object,           // the canonical record
 *   found: string[],        // fields successfully read
 *   missing: string[],      // fields that could not be read
 *   needsReview: boolean,   // true if anything important is missing, or the
 *                           // parser has never been checked against a real message
 *   why: string,            // what a human should look at, in words
 * }}
 */
export function normaliseLead(sourceKey, payload = {}, opts = {}) {
  const source = INTAKE_SOURCES[sourceKey] || INTAKE_SOURCES.manual;
  const now = opts.now || new Date().toISOString();

  let raw = {};
  if (source.kind === "email") {
    const text = [payload.subject, payload.body, payload.text].filter(Boolean).join("\n");
    const f = labelledFields(text);
    raw = {
      name: pick(f, "name"),
      phone: pick(f, "phone"),
      email: pick(f, "email") || (text.match(EMAIL_RE) || [])[0] || null,
      budget: pick(f, "budget"),
      property: pick(f, "property"),
      community: pick(f, "community"),
      message: pick(f, "message"),
      rawText: text.slice(0, 4000),
    };
  } else if (sourceKey === "meta") {
    /* Meta Lead Ads deliver field_data: [{name, values:[...]}, ...]. */
    const fd = {};
    (payload.field_data || payload.fieldData || []).forEach(x => {
      if (x && x.name) fd[String(x.name).toLowerCase()] = (x.values || [])[0];
    });
    raw = {
      name: fd.full_name || fd.name || payload.name || null,
      phone: fd.phone_number || fd.phone || payload.phone || null,
      email: fd.email || payload.email || null,
      budget: fd.budget || payload.budget || null,
      property: fd.property || payload.property || null,
      community: fd.city || fd.location || payload.community || null,
      message: fd.message || null,
      campaign: payload.campaign_name || payload.adset_name || null,
      adName: payload.ad_name || null,
    };
  } else {
    raw = { ...payload };
  }

  const phone = normalisePhone(raw.phone);
  const budget = parseBudget(raw.budget);
  const name = (raw.name || "").toString().trim() || null;
  const email = raw.email && EMAIL_RE.test(raw.email) ? raw.email.trim() : null;

  const found = [], missing = [];
  (phone ? found : missing).push("phone");
  (name  ? found : missing).push("name");
  (email ? found : missing).push("email");
  (budget ? found : missing).push("budget");

  /* A lead with neither a phone nor an email cannot be worked at all — that is
     the only genuinely fatal gap. Everything else is worth chasing. */
  const unreachable = !phone && !email;
  const needsReview = unreachable || !source.verified || !name;

  const reasons = [];
  if (unreachable) reasons.push("no phone number and no email address, so nobody can contact them");
  if (!name) reasons.push("no name could be read");
  if (!source.verified) {
    reasons.push(`the ${source.label} parser has not yet been checked against a real message, so every field should be confirmed`);
  }
  if (!budget && raw.budget) reasons.push(`a budget of "${raw.budget}" was present but could not be read as an amount`);

  return {
    lead: {
      name: name || "Name not given",
      phone: phone || "",
      email: email || "",
      budget: budget || "",
      community: (raw.community || "").toString().trim(),
      property: (raw.property || "").toString().trim(),
      source: source.label,
      sourceKey: source.key,
      campaign: raw.campaign || "",
      adName: raw.adName || "",
      status: "New Lead",
      notes_log: raw.message
        ? [{ text: String(raw.message).slice(0, 2000), type: "Note", by: source.label, at: now }]
        : [],
      /* Kept so a human can always see what actually arrived. */
      intakeRaw: raw.rawText || "",
      intakeAt: now,
      needsReview,
      reviewReason: reasons.join("; "),
      createdAt: now,
      updatedAt: now,
    },
    found, missing, needsReview,
    why: reasons.length ? reasons.join("; ") : "Everything needed was read cleanly.",
  };
}

/**
 * DEDUPE.
 * The same buyer enquires on Property Finder and Bayut about two units in the
 * same tower within an hour. That is one person, and two agents ringing them
 * separately is how an agency looks disorganised. Matched on the phone, then
 * the email — never on the name, because "Mohammed" is not an identifier.
 */
export function findDuplicate(candidate, existing = [], withinHours = 720) {
  const phone = normalisePhone(candidate.phone);
  const email = (candidate.email || "").toLowerCase();
  const cutoff = Date.now() - withinHours * 3600000;

  return existing.find(l => {
    const age = new Date(l.createdAt || 0).getTime();
    if (age && age < cutoff) return false;
    if (phone && normalisePhone(l.phone) === phone) return true;
    if (email && (l.email || "").toLowerCase() === email) return true;
    return false;
  }) || null;
}

/* ── ROUTING ───────────────────────────────────────────────────────────────
   Who gets the lead. The rule is stated so an agency can see why a lead went
   where it did — "the system decided" is what makes agents distrust a CRM. */

export const ROUTING_RULES = [
  { key: "listing_owner", label: "The agent who owns the listing",
    what: "If the enquiry names a property one of your agents is marketing, it goes to them. They already know the unit." },
  { key: "community",     label: "An agent who covers that community",
    what: "Otherwise, whoever works the area — round-robin between them so it is shared evenly." },
  { key: "round_robin",   label: "Round-robin across the team",
    what: "Otherwise the next agent in turn, so nobody is skipped." },
  { key: "unassigned",    label: "Left in the unassigned pool",
    what: "If nobody is available, it waits rather than being given to somebody who cannot work it." },
];

/**
 * @param {object} lead
 * @param {Array}  agents   [{ id, name, communities: [], activeLeads: n, canBroker: bool }]
 * @param {Array}  listings [{ id, agentId, title, reference, community }]
 */
export function routeLead(lead, agents = [], listings = [], opts = {}) {
  /* An agent who cannot legally broker must not be given a lead. The broker
     card check is the same one the Listings tab uses. */
  const able = agents.filter(a => a.canBroker !== false);
  if (!able.length) {
    return { agentId: null, rule: "unassigned",
             why: agents.length
               ? "Every agent's broker card has lapsed, so nobody can lawfully take this."
               : "No agents are set up yet, so this waits in the unassigned pool." };
  }

  /* 1. The agent marketing the property they asked about. */
  const ref = `${lead.property || ""} ${lead.intakeRaw || ""}`.toLowerCase();
  if (ref.trim()) {
    const hit = listings.find(l =>
      (l.reference && ref.includes(String(l.reference).toLowerCase())) ||
      (l.title && l.title.length > 6 && ref.includes(l.title.toLowerCase())));
    const owner = hit && able.find(a => a.id === hit.agentId);
    if (owner) {
      return { agentId: owner.id, rule: "listing_owner",
               why: `${owner.name} is marketing ${hit.title || hit.reference}, so they already know the unit.` };
    }
  }

  /* 2. Somebody who covers that community, least busy first. */
  const community = (lead.community || "").toLowerCase().trim();
  if (community) {
    const covers = able.filter(a => (a.communities || [])
      .some(c => String(c).toLowerCase().includes(community) || community.includes(String(c).toLowerCase())));
    if (covers.length) {
      const pickAgent = [...covers].sort((a, b) => (a.activeLeads || 0) - (b.activeLeads || 0))[0];
      return { agentId: pickAgent.id, rule: "community",
               why: `${pickAgent.name} covers ${lead.community} and has the fewest open leads of the agents who do.` };
    }
  }

  /* 3. Least busy overall — which is round-robin that also self-corrects. */
  const next = [...able].sort((a, b) => (a.activeLeads || 0) - (b.activeLeads || 0))[0];
  return { agentId: next.id, rule: "round_robin",
           why: `${next.name} has the fewest open leads, so the next enquiry goes to them.` };
}

/* ── THE RESPONSE CLOCK ────────────────────────────────────────────────────
   Speed to first contact predicts conversion better than anything else an
   agency can measure, and almost nobody in Dubai measures it. It is only
   meaningful once somebody logs a call or a message, so an unworked lead
   reports as still running rather than as a fast response. */

export const RESPONSE_BANDS = [
  { key: "under5",  max: 5,    label: "Under 5 minutes",  colour: "#10B981" },
  { key: "under30", max: 30,   label: "Under 30 minutes", colour: "#3B82F6" },
  { key: "under2h", max: 120,  label: "Within 2 hours",   colour: "#F59E0B" },
  { key: "sameday", max: 1440, label: "Same day",         colour: "#F97316" },
  { key: "slow",    max: Infinity, label: "Over a day",   colour: "#EF4444" },
];

const CONTACT_TYPES = ["Call", "WhatsApp", "Email", "Viewing", "Offer"];

export function responseTime(lead, now = Date.now()) {
  const created = new Date(lead?.createdAt || lead?.intakeAt || 0).getTime();
  if (!created) return { known: false, note: "No arrival time recorded for this lead." };

  const first = (lead?.notes_log || [])
    .filter(n => CONTACT_TYPES.includes(n.type) && n.at)
    .map(n => new Date(n.at).getTime())
    .filter(t => t >= created)
    .sort((a, b) => a - b)[0];

  if (!first) {
    const waiting = Math.floor((now - created) / 60000);
    return {
      known: false, answered: false, waitingMinutes: waiting,
      note: waiting < 60
        ? `Still waiting — ${waiting} minute${waiting === 1 ? "" : "s"} since it arrived, nobody has made contact.`
        : `Still waiting — ${Math.floor(waiting / 60)} hour${Math.floor(waiting / 60) === 1 ? "" : "s"} since it arrived, nobody has made contact.`,
    };
  }

  const mins = Math.max(0, Math.round((first - created) / 60000));
  const band = RESPONSE_BANDS.find(b => mins <= b.max);
  return {
    known: true, answered: true, minutes: mins, band: band.key,
    label: band.label, colour: band.colour,
    note: mins < 60
      ? `Answered in ${mins} minute${mins === 1 ? "" : "s"}.`
      : `Answered in ${Math.floor(mins / 60)}h ${mins % 60}m.`,
  };
}

/** Per-agent and per-source response performance, for a manager's screen. */
export function responseReport(leads = [], now = Date.now()) {
  const answered = [], waiting = [];
  leads.forEach(l => {
    const r = responseTime(l, now);
    (r.answered ? answered : waiting).push({ lead: l, r });
  });

  const median = xs => {
    if (!xs.length) return null;
    const s = [...xs].sort((a, b) => a - b);
    const m = Math.floor(s.length / 2);
    return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2);
  };

  const mins = answered.map(x => x.r.minutes);
  const med = median(mins);

  return {
    total: leads.length,
    answered: answered.length,
    stillWaiting: waiting.length,
    medianMinutes: med,
    /* Median, not mean: one lead answered three weeks late would drag an
       average into uselessness while the typical response was four minutes. */
    headline: med == null
      ? (leads.length ? "Nothing has been answered yet, so there is no response time to report." : "No leads yet.")
      : med < 60
        ? `Half of your leads are answered within ${med} minute${med === 1 ? "" : "s"}.`
        : `Half of your leads take more than ${Math.floor(med / 60)}h ${med % 60}m to answer.`,
    worstWaiting: waiting.sort((a, b) => b.r.waitingMinutes - a.r.waitingMinutes)[0] || null,
  };
}
