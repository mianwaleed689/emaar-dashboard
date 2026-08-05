/**
 * THE THREE WAYS A DUBAI DEAL ACTUALLY HAPPENS.
 * ═════════════════════════════════════════════════════════════════════════════
 *
 * WHY THIS FILE EXISTS
 * ────────────────────
 * PipelineTab shipped one five-stage pipeline for every deal in the business:
 *
 *     EOI → Booking → SPA → DLD → Completed
 *
 * That is an OFF-PLAN pipeline. The tab offered an "Off-Plan / Secondary"
 * filter, but both kinds of deal were pushed through those same five stages —
 * and a secondary sale has no Expression of Interest and no Sale & Purchase
 * Agreement. A rental has neither, plus a step (Ejari) that appeared nowhere in
 * the codebase except as a data source for the Yields tab.
 *
 * So a broker doing what most Dubai brokers spend most of their time doing —
 * resale and leasing — had no pipeline that described their work, and no place
 * to record a single one of the documents the law requires them to hold.
 *
 * THE DOCUMENTS ARE THE POINT
 * ───────────────────────────
 * Every stage below names the paperwork that stage requires. That is not
 * decoration. In Dubai the paperwork IS the process:
 *
 *   · Without a signed Form A a broker cannot lawfully advertise a property
 *     anywhere — not a portal, not social media, not a billboard.
 *   · Without a Trakheesi permit number on the advert itself, the advert is a
 *     RERA violation.
 *   · Without a current NOC from the developer the Land Department will not
 *     process the transfer, and an NOC is customarily valid about thirty days,
 *     which makes it a clock, not a checkbox.
 *
 * A CRM that lets a deal reach "transferred" without an NOC on file is not
 * recording the business — it is hiding the risk. Hence `blockedBy`.
 *
 * WHAT IS DELIBERATELY NOT HERE
 * ─────────────────────────────
 * No fees, no percentages, no timelines. Fee schedules change, and this file
 * would silently go stale and start lying. Money lives in commission.js, which
 * takes its rates from the organisation's own settings. The one figure that
 * appears here is the customary 10% deposit at Form F, and it is described as
 * customary rather than stated as law.
 *
 * Sources for the process itself are recorded in CRM_DESIGN.md §9 and
 * PRODUCT_SPEC.md §10, verified 2026-08-03.
 */

/* ── DOCUMENTS ─────────────────────────────────────────────────────────────
   `expiresInDays` is the customary validity where one exists. It drives the
   warning on the deal, so a coordinator learns an NOC is about to lapse before
   the trustee appointment, not at it. null means it does not expire.         */

export const DOCUMENTS = {
  FORM_A: {
    key: "FORM_A", label: "Form A",
    what: "The agreement between the seller and your agency. It sets your commission and whether the listing is exclusive.",
    why: "Nothing can be advertised without it. No portal, no social media, no billboard.",
    heldBy: "seller", expiresInDays: null,
  },
  FORM_B: {
    key: "FORM_B", label: "Form B",
    what: "The agreement between the buyer and your agency, appointing you to find and negotiate on their behalf.",
    why: "It is what entitles you to a commission from the buyer's side.",
    heldBy: "buyer", expiresInDays: null,
  },
  FORM_I: {
    key: "FORM_I", label: "Form I",
    what: "The agreement between two agencies working the same deal together.",
    why: "Both agencies must be registered with the Land Department to be entitled to their share.",
    heldBy: "agency", expiresInDays: null,
  },
  TRAKHEESI: {
    key: "TRAKHEESI", label: "Trakheesi permit",
    what: "The advertising permit issued by the Land Department against a signed Form A.",
    why: "Its number must appear on the advert, and the advert must match the permit. Advertising without one is a RERA violation.",
    heldBy: "agency", expiresInDays: null,   // set from the permit itself
  },
  FORM_F: {
    key: "FORM_F", label: "Form F (MOU)",
    what: "The binding contract of sale between buyer and seller, once an offer is accepted.",
    why: "This is the deal. A deposit — customarily 10% — is lodged at this point.",
    heldBy: "both", expiresInDays: null,
  },
  NOC: {
    key: "NOC", label: "Developer NOC",
    what: "The developer's No Objection Certificate, confirming service charges are settled.",
    why: "The Land Department will not transfer without a current one, and it does not stay current for long.",
    heldBy: "seller", expiresInDays: 30,
  },
  TITLE_DEED: {
    key: "TITLE_DEED", label: "Title deed",
    what: "The new owner's title, issued at the trustee office.",
    why: "This is the deal completing. Usually issued the same day as the transfer.",
    heldBy: "buyer", expiresInDays: null,
  },
  SPA: {
    key: "SPA", label: "SPA",
    what: "The Sale and Purchase Agreement with the developer, on an off-plan unit.",
    why: "The off-plan equivalent of the Form F. It carries the payment plan.",
    heldBy: "buyer", expiresInDays: null,
  },
  OQOOD: {
    key: "OQOOD", label: "Oqood registration",
    what: "Registration of the off-plan sale with the Land Department.",
    why: "Until it is registered the buyer's interest is not recorded against the unit.",
    heldBy: "buyer", expiresInDays: null,
  },
  TENANCY: {
    key: "TENANCY", label: "Tenancy contract",
    what: "The signed lease between landlord and tenant.",
    why: "Ejari cannot be registered without it.",
    heldBy: "both", expiresInDays: null,
  },
  EJARI: {
    key: "EJARI", label: "Ejari registration",
    what: "Registration of the tenancy with the Land Department.",
    why: "An unregistered tenancy cannot be enforced, and the tenant cannot connect utilities or sponsor a visa on it.",
    heldBy: "both", expiresInDays: null,
  },
};

/* ── THE THREE JOURNEYS ────────────────────────────────────────────────────
   `requires`  — documents that must exist before the deal LEAVES this stage.
   `blockedBy` — the plain-English reason shown when it cannot advance.
   `owner`     — whose job this stage is. Drives the role-shaped views.        */

export const JOURNEYS = {
  secondary: {
    key: "secondary",
    label: "Resale",
    what: "A completed property sold by its owner to a new buyer.",
    colour: "#3B82F6",
    stages: [
      { key: "form_a",     label: "Form A signed",       owner: "agent",
        what: "The seller has appointed you. You may now advertise.",
        requires: ["FORM_A"],
        blockedBy: "You cannot advertise this property until the seller signs Form A." },
      { key: "permit",     label: "Permit issued",       owner: "coordinator",
        what: "The Land Department has issued the advertising permit.",
        requires: ["TRAKHEESI"],
        blockedBy: "The advert needs a Trakheesi permit number before it can go anywhere." },
      { key: "published",  label: "Published",           owner: "coordinator",
        what: "Live on the portals, with the permit number on the advert.",
        requires: [] },
      /* Form B and Form I are conditional, not universal: you may be acting for
         the seller only, and there may be no second agency. Making them hard
         requirements would block honest deals. But leaving them out entirely
         meant they never appeared on the deal at all — and Form B is what
         entitles you to the buyer's commission, while an unsigned Form I is how
         a collaborating agency's share becomes an argument after completion.
         So they are listed as conditional: visible, never blocking. */
      { key: "buyer_side", label: "Buyer engaged",       owner: "agent",
        what: "A buyer is working with you, or a second agency has joined the deal.",
        requires: [],
        optional: [
          { doc: "FORM_B", when: "you are acting for the buyer as well as, or instead of, the seller" },
          { doc: "FORM_I", when: "a second agency is sharing this deal with you" },
        ] },
      { key: "viewings",   label: "Viewings",            owner: "agent",
        what: "The property is being shown.",
        requires: [] },
      { key: "offer",      label: "Offer accepted",      owner: "agent",
        what: "Price and terms agreed between the parties.",
        requires: [] },
      { key: "mou",        label: "Form F signed",       owner: "agent",
        what: "The binding contract is signed and the deposit is lodged.",
        requires: ["FORM_F"],
        blockedBy: "Nothing is binding until Form F is signed by both parties." },
      { key: "noc",        label: "NOC received",        owner: "coordinator",
        what: "The developer confirms service charges are settled.",
        requires: ["NOC"],
        blockedBy: "The Land Department will not transfer without a current NOC." },
      { key: "trustee",    label: "Trustee booked",      owner: "coordinator",
        what: "The transfer appointment is set, and the cheques are ready.",
        requires: [] },
      { key: "transferred",label: "Transferred",         owner: "coordinator",
        what: "Ownership has moved. The buyer holds the new title deed.",
        requires: ["TITLE_DEED"],
        blockedBy: "The deal is not done until the title deed is issued." },
      { key: "paid",       label: "Commission received", owner: "finance",
        what: "The money is in. This is the only stage that means you were paid.",
        requires: [] },
    ],
  },

  offplan: {
    key: "offplan",
    label: "Off-plan",
    what: "A unit bought from the developer before it is built.",
    colour: "#8B5CF6",
    stages: [
      { key: "eoi",        label: "EOI",                 owner: "agent",
        what: "The buyer has registered interest, usually with a refundable cheque.",
        requires: [] },
      { key: "booking",    label: "Booking",             owner: "agent",
        what: "A specific unit is held for the buyer.",
        requires: [] },
      { key: "spa",        label: "SPA signed",          owner: "agent",
        what: "The contract with the developer is signed, carrying the payment plan.",
        requires: ["SPA"],
        blockedBy: "The unit is not the buyer's until the SPA is signed." },
      { key: "oqood",      label: "Registered (Oqood)",  owner: "coordinator",
        what: "The sale is recorded against the unit at the Land Department.",
        requires: ["OQOOD"],
        blockedBy: "Until Oqood registration the buyer's interest is not on record." },
      { key: "payments",   label: "On payment plan",     owner: "coordinator",
        what: "Construction milestones are being paid as they fall due.",
        requires: [] },
      { key: "handover",   label: "Handed over",         owner: "coordinator",
        what: "The unit is complete and the keys are with the buyer.",
        requires: [] },
      { key: "paid",       label: "Commission received", owner: "finance",
        what: "The developer has paid. On off-plan this can be long after the SPA.",
        requires: [] },
    ],
  },

  rental: {
    key: "rental",
    label: "Rental",
    what: "A property leased to a tenant.",
    colour: "#10B981",
    stages: [
      { key: "form_a",     label: "Form A signed",       owner: "agent",
        what: "The landlord has appointed you. You may now advertise.",
        requires: ["FORM_A"],
        blockedBy: "You cannot advertise this property until the landlord signs Form A." },
      { key: "permit",     label: "Permit issued",       owner: "coordinator",
        what: "The Land Department has issued the advertising permit.",
        requires: ["TRAKHEESI"],
        blockedBy: "The advert needs a Trakheesi permit number before it can go anywhere." },
      { key: "published",  label: "Published",           owner: "coordinator",
        what: "Live on the portals, with the permit number on the advert.",
        requires: [] },
      { key: "viewings",   label: "Viewings",            owner: "agent",
        what: "The property is being shown.",
        requires: [] },
      { key: "offer",      label: "Offer accepted",      owner: "agent",
        what: "Rent, cheques and term agreed.",
        requires: [] },
      { key: "contract",   label: "Contract signed",     owner: "agent",
        what: "The tenancy contract is signed by both parties.",
        requires: ["TENANCY"],
        blockedBy: "Ejari cannot be registered without a signed tenancy contract." },
      { key: "ejari",      label: "Ejari registered",    owner: "coordinator",
        what: "The tenancy is registered with the Land Department.",
        requires: ["EJARI"],
        blockedBy: "An unregistered tenancy cannot be enforced, and the tenant cannot connect utilities on it." },
      { key: "keys",       label: "Keys handed over",    owner: "agent",
        what: "The tenant has moved in.",
        requires: [] },
      { key: "paid",       label: "Commission received", owner: "finance",
        what: "The money is in.",
        requires: [] },
    ],
  },
};

export const JOURNEY_KEYS = Object.keys(JOURNEYS);

/* ── HELPERS ─────────────────────────────────────────────────────────────── */

export const journeyOf = deal => JOURNEYS[deal?.journey] || JOURNEYS.secondary;

export const stagesOf = deal => journeyOf(deal).stages;

export const stageIndex = deal => {
  const s = stagesOf(deal).findIndex(x => x.key === deal?.stage);
  return s < 0 ? 0 : s;
};

export const currentStage = deal => stagesOf(deal)[stageIndex(deal)];

export const isComplete = deal => stageIndex(deal) >= stagesOf(deal).length - 1;

/** Documents this deal MUST have, in the order they fall due. These block. */
export function requiredDocuments(deal) {
  const seen = new Set();
  const out = [];
  stagesOf(deal).forEach(st => (st.requires || []).forEach(d => {
    if (!seen.has(d)) { seen.add(d); out.push({ ...DOCUMENTS[d], required: true, dueAtStage: st.key, dueAtLabel: st.label }); }
  }));
  return out;
}

/** Documents that apply only in some circumstances. Shown, never blocking. */
export function conditionalDocuments(deal) {
  const out = [];
  stagesOf(deal).forEach(st => (st.optional || []).forEach(o => {
    out.push({ ...DOCUMENTS[o.doc], required: false, when: o.when,
               dueAtStage: st.key, dueAtLabel: st.label });
  }));
  return out;
}

/** Everything a coordinator should see on the deal, required first. */
export const allDocuments = deal =>
  [...requiredDocuments(deal), ...conditionalDocuments(deal)];

/**
 * Which document a deal holds. `deal.documents` is { FORM_A: {...}, ... }.
 *
 * Under `strict` a tick is not enough — the file has to be there. That is the
 * agency's setting, not ours: an agency arriving with years of ticked rows and
 * no files is mid-migration, and refusing to move any of their deals on the
 * morning they switch over is an outage, not a control. See
 * documents.js#evidenceCoverage for the number that tells them when it is safe.
 */
const holds = (deal, key, strict) => {
  const d = deal?.documents?.[key];
  if (!d) return false;
  return strict ? Boolean(d.file && d.file.path) : Boolean(d.receivedAt);
};

/**
 * Can this deal move to the next stage — and if not, say why in words a
 * coordinator can act on. This is the whole reason the model exists.
 */
export function canAdvance(deal, { strict = false } = {}) {
  if (isComplete(deal)) {
    return { ok: false, reason: "This deal is already at its final stage.", missing: [] };
  }
  const stage = currentStage(deal);
  const missing = (stage.requires || []).filter(d => !holds(deal, d, strict));
  if (missing.length) {
    /* Under strict, "Missing Form A" is wrong and infuriating when Form A is
       ticked — the person is looking at a tick. Name what is actually wanted. */
    const ticked = strict
      ? missing.filter(d => deal?.documents?.[d]?.receivedAt)
      : [];
    const label = keys => keys.map(d => DOCUMENTS[d].label).join(" and ");
    return {
      ok: false,
      missing,
      unevidenced: ticked,
      reason: ticked.length === missing.length
        ? `${label(ticked)} ${ticked.length === 1 ? "is" : "are"} ticked but no file was ever attached. Attach ${ticked.length === 1 ? "it" : "them"} to move on.`
        : stage.blockedBy || `Missing ${label(missing)}.`,
    };
  }
  return { ok: true, missing: [], unevidenced: [], reason: "" };
}

export function nextStage(deal) {
  const s = stagesOf(deal);
  return s[Math.min(stageIndex(deal) + 1, s.length - 1)];
}

/**
 * Documents on this deal that expire, and how long they have left.
 * An NOC that lapses two days before the trustee appointment costs the client
 * the appointment, so this is surfaced on the deal, not buried in a file list.
 */
export function expiringDocuments(deal, now = Date.now()) {
  const out = [];
  Object.values(DOCUMENTS).forEach(def => {
    const held = deal?.documents?.[def.key];
    if (!held?.receivedAt) return;
    const days = held.expiresAt
      ? Math.floor((new Date(held.expiresAt).getTime() - now) / 86400000)
      : def.expiresInDays != null
        ? def.expiresInDays - Math.floor((now - new Date(held.receivedAt).getTime()) / 86400000)
        : null;
    if (days == null) return;
    out.push({
      key: def.key, label: def.label, daysLeft: days,
      expired: days < 0,
      note: days < 0 ? `${def.label} expired ${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"} ago — it must be reissued.`
          : days === 0 ? `${def.label} expires today.`
          : `${def.label} expires in ${days} day${days === 1 ? "" : "s"}.`,
    });
  });
  return out.sort((a, b) => a.daysLeft - b.daysLeft);
}

/** Percentage through the journey — for a progress bar, not for a score. */
export const progressOf = deal =>
  Math.round((stageIndex(deal) / (stagesOf(deal).length - 1)) * 100);
