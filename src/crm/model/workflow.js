/**
 * WHO DOES WHAT, AT EVERY STEP, AND WHO IT GOES TO NEXT.
 * ═════════════════════════════════════════════════════════════════════════════
 *
 * WHAT THIS IS FOR
 * ────────────────
 * The owner's brief, in his words: a system where *"each and every individual's
 * work is defined and everyone knows what to do"*, from assigning the lead
 * through to the commission landing — and where *"no one will come to each other
 * asking what is this and what is this thing"*.
 *
 * journeys.js already says what a deal must PRODUCE at each stage — the Form A,
 * the permit, the NOC, the title deed. It does not say WHO produces it, what
 * that person actually has to DO, or who it passes to afterwards. Without that,
 * a deal sits still and everybody assumes somebody else has it. This file is
 * that missing half.
 *
 * THE SHAPE OF ONE STEP
 * ─────────────────────
 *   department  whose job this is — a department, not a named person, because
 *               staff change and the job does not
 *   does        the instruction, written as an instruction. Not "NOC stage" but
 *               "Ask the developer for the NOC and pay their fee."
 *   records     what has to be written down when it is finished, so the next
 *               person is not left guessing what was agreed
 *   produces    the document that must be on file before the deal moves on
 *
 * WHY THE TABLE IS SEPARATE FROM THE STAGES
 * ─────────────────────────────────────────
 * Two files can drift. A stage added to journeys.js with no entry here would
 * silently become a step nobody owns — the exact failure this is meant to
 * prevent. So a test asserts every stage of every journey has an entry, and the
 * build is only honest as long as that passes.
 */
import { JOURNEYS, DOCUMENTS, stagesOf, stageIndex, currentStage,
         canAdvance, isComplete } from "./journeys.js";
import { DEPARTMENTS } from "./org.js";

/* ── WHO OWNS EACH STEP ─────────────────────────────────────────────────────
   Departments are the org.js keys, so a person's record decides what lands on
   their desk. `sales` means the agent who owns the deal; every other
   department means anyone in it. */
export const RESPONSIBILITY = {
  secondary: {
    form_a: {
      department: "sales",
      does: "Get the owner to sign Form A. Agree the commission and whether it is exclusive before anything is advertised.",
      records: "What commission was agreed, and whether the listing is exclusive.",
    },
    permit: {
      department: "salesAdmin",
      does: "Apply for the Trakheesi advertising permit against the signed Form A, and record its number and expiry date.",
      records: "The permit number and the date it expires.",
    },
    published: {
      department: "listings",
      does: "Post the listing to the portals with the permit number on the advert, and note where it went.",
      records: "Which portals it was posted to, and the date.",
    },
    buyer_side: {
      department: "sales",
      does: "Sign Form B with the buyer. If another agency is involved, sign Form I before anyone shows the property.",
      records: "Who is acting for the buyer, and the agreed split if a second agency is on the deal.",
    },
    viewings: {
      department: "sales",
      does: "Show the property. Log every viewing with the date and what the buyer said.",
      records: "Who viewed, when, and their feedback — the seller will ask.",
    },
    offer: {
      department: "sales",
      does: "Put the offer to the seller in writing and get their answer in writing.",
      records: "The agreed price and any conditions.",
    },
    mou: {
      department: "salesAdmin",
      does: "Draw up Form F, get both parties to sign, and confirm the deposit is lodged.",
      records: "The signing date, the deposit amount, and where it is held.",
    },
    noc: {
      department: "conveyancing",
      does: "Ask the developer for the NOC and pay their fee. Chase it — it takes days and expires in about thirty.",
      records: "The date it was issued and the date it expires.",
    },
    trustee: {
      department: "conveyancing",
      does: "Book the trustee appointment and confirm the manager's cheques are drawn correctly before the day.",
      records: "The appointment date and time, and which cheques are prepared.",
    },
    transferred: {
      department: "conveyancing",
      does: "Attend the transfer, and collect the new title deed.",
      records: "The transfer date and the title deed number.",
    },
    paid: {
      department: "finance",
      does: "Raise the tax invoice, chase the payment, and pay the agent their share once it lands.",
      records: "The invoice number, the date the money arrived, and the date the agent was paid.",
    },
  },

  offplan: {
    eoi: {
      department: "sales",
      does: "Take the Expression of Interest and the cheque, and confirm with the developer that it is registered.",
      records: "The EOI reference and what was paid.",
    },
    booking: {
      department: "sales",
      does: "Hold a specific unit with the developer and confirm it in writing.",
      records: "The unit number, the price held, and until when.",
    },
    spa: {
      department: "salesAdmin",
      does: "Get the SPA issued by the developer, signed by the buyer, and check the payment plan matches what was sold.",
      records: "The signing date and the payment plan as it actually reads.",
    },
    oqood: {
      department: "conveyancing",
      does: "Register the sale with the Land Department and obtain the Oqood certificate.",
      records: "The Oqood reference and the registration date.",
    },
    payments: {
      department: "finance",
      does: "Track each construction milestone and warn the buyer before every instalment falls due.",
      records: "Which instalments are paid, and the next date due.",
    },
    handover: {
      department: "conveyancing",
      does: "Coordinate the snagging and the handover, and confirm the keys are with the buyer.",
      records: "The handover date and anything outstanding from snagging.",
    },
    paid: {
      department: "finance",
      does: "Invoice the developer and chase it. On off-plan this can land long after the SPA.",
      records: "The invoice number, when it was paid, and the agent's share.",
    },
  },

  rental: {
    form_a: {
      department: "sales",
      does: "Get the landlord to sign Form A and agree the commission before advertising.",
      records: "The asking rent, the number of cheques accepted, and the commission agreed.",
    },
    permit: {
      department: "salesAdmin",
      does: "Apply for the Trakheesi permit and record its number and expiry.",
      records: "The permit number and expiry date.",
    },
    published: {
      department: "listings",
      does: "Post to the portals with the permit number on the advert.",
      records: "Which portals, and the date.",
    },
    viewings: {
      department: "sales",
      does: "Show the property and log every viewing.",
      records: "Who viewed, when, and their feedback.",
    },
    offer: {
      department: "sales",
      does: "Agree rent, cheques and term with the landlord in writing.",
      records: "The agreed rent, number of cheques, and the term.",
    },
    contract: {
      department: "salesAdmin",
      does: "Draw up the tenancy contract and get both parties to sign it.",
      records: "The signing date and the contract term.",
    },
    ejari: {
      department: "salesAdmin",
      does: "Register the tenancy with Ejari and obtain the certificate.",
      records: "The Ejari number and the registration date.",
    },
    keys: {
      department: "sales",
      does: "Hand over the keys and record the meter readings and the condition.",
      records: "The handover date and the meter readings.",
    },
    paid: {
      department: "finance",
      does: "Invoice both sides where applicable, collect, and pay the agent.",
      records: "The invoice number, when it was paid, and the agent's share.",
    },
  },
};

/** Every stage's responsibility, or null if the table has drifted from journeys.js. */
export const responsibilityFor = (journeyKey, stageKey) =>
  RESPONSIBILITY[journeyKey]?.[stageKey] || null;

/* ── WHOSE TURN IS IT ───────────────────────────────────────────────────────
   The single question this whole file exists to answer, and the one that
   currently gets asked out loud across an office. */

/** Has the money actually landed, and has the agent been paid their share? */
const moneyIn = deal => {
  const lines = deal?.commissionLines;
  if (!Array.isArray(lines) || lines.length === 0) return false;
  return lines.every(l => l.state === "paid");
};

export function whoseTurn(deal, now = Date.now()) {
  const journey = deal?.journey || "secondary";

  /* A deal reaching the last stage is NOT the same as a deal being finished.
     The final stage is "Commission received" — a target, not an accomplished
     fact. Treating arrival at it as completion made Accounts' work invisible:
     the instruction to raise the invoice and chase the payment sat on a stage
     that, the moment it was reached, dropped off everybody's desk. A deal is
     done when the money is in AND the agent has been paid their share. */
  if (isComplete(deal) && moneyIn(deal)) {
    return { done: true, department: null,
             summary: "Finished. The commission was received and the agent has been paid." };
  }

  const stage = currentStage(deal);
  const r = responsibilityFor(journey, stage.key);
  const gate = canAdvance(deal);

  /* A blocked stage is still the SAME person's turn — it is their job to
     unblock it. Saying "waiting on documents" without naming an owner is how a
     deal sits for three weeks. */
  return {
    done: false,
    stageKey: stage.key,
    stageLabel: stage.label,
    department: r?.department || "sales",
    departmentLabel: DEPARTMENTS[r?.department || "sales"]?.label || "Sales",
    does: r?.does || stage.what,
    records: r?.records || "",
    blocked: !gate.ok,
    blockedBy: gate.ok ? "" : gate.reason,
    /* One line for a card. */
    summary: `${DEPARTMENTS[r?.department || "sales"]?.label || "Sales"} — ${r?.does || stage.what}`,
  };
}

/**
 * WHAT IS ON MY DESK RIGHT NOW.
 *
 * Across every deal in the agency, the ones waiting on this person's
 * department. This is the list that replaces walking over and asking.
 */
export function myWork(deals = [], viewer = {}, now = Date.now()) {
  /* The same legacy inference the rest of the model uses, so a viewer with no
     department recorded lands in the same place everywhere. */
  const dept = viewer.department
    || (viewer.orgRole === "owner" || viewer.orgRole === "director" ? "management"
        : viewer.orgRole ? "sales" : null);
  const uid = viewer.id || viewer.uid;

  const items = [];
  (deals || []).forEach(d => {
    const turn = whoseTurn(d, now);
    if (turn.done) return;
    /* Sales work belongs to the agent ON the deal, not to everyone in sales —
       an agent should not open their desk and find a colleague's viewings. */
    const mine = turn.department === "sales"
      ? (dept === "sales" && (d.agentId === uid || d.assignedTo === uid))
      : turn.department === dept;
    /* Deliberately NO escape hatch for platform admins or owners. A desk lists
       what YOU must do. An owner is not the one signing the Form A, and filling
       their desk with every step in the company would make it useless — the
       whole-company view is workByDepartment(), which is a different question. */
    if (!mine) return;
    items.push({ deal: d, turn });
  });

  /* Blocked first — those are the ones costing time. */
  items.sort((a, b) => (b.turn.blocked ? 1 : 0) - (a.turn.blocked ? 1 : 0));

  const blocked = items.filter(i => i.turn.blocked).length;
  return {
    items, total: items.length, blocked,
    headline: items.length === 0
      ? "Nothing is waiting on you."
      : blocked
        ? `${items.length} deal${items.length === 1 ? "" : "s"} waiting on you — ${blocked} of them blocked.`
        : `${items.length} deal${items.length === 1 ? "" : "s"} waiting on you.`,
  };
}

/** Everything waiting on every department — a manager's or owner's view. */
export function workByDepartment(deals = [], now = Date.now()) {
  const by = {};
  (deals || []).forEach(d => {
    const t = whoseTurn(d, now);
    if (t.done) return;
    const k = t.department;
    by[k] = by[k] || { department: k, label: t.departmentLabel, total: 0, blocked: 0, deals: [] };
    by[k].total++;
    if (t.blocked) by[k].blocked++;
    by[k].deals.push({ deal: d, turn: t });
  });
  return Object.values(by).sort((a, b) => b.blocked - a.blocked || b.total - a.total);
}

/* ── THE RECORD OF WHAT WAS DONE ────────────────────────────────────────────
   Every stage change writes one of these. It is the answer to "where are we and
   who did what", and it is why nobody has to ask. */

/**
 * @param {object} deal
 * @param {string} toStage
 * @param {object} by      { id, name, department }
 * @param {string} note    what was actually done — required
 * @param {Array}  files   [{ name, url, size, type }]
 */
export function stepRecord(deal, toStage, by = {}, note = "", files = [], now = new Date()) {
  const from = currentStage(deal);
  const stages = stagesOf(deal);
  const to = stages.find(s => s.key === toStage) || from;
  const r = responsibilityFor(deal?.journey || "secondary", from.key);

  return {
    at: now.toISOString(),
    fromStage: from.key, fromLabel: from.label,
    toStage: to.key, toLabel: to.label,
    byId: by.id || "", byName: by.name || "", byDepartment: by.department || "",
    note: String(note || "").trim(),
    files: (files || []).map(f => ({ name: f.name, url: f.url, size: f.size, type: f.type })),
    /* What the person completing this step was asked to record, kept alongside
       what they actually wrote — so a thin note is visible as a thin note. */
    wasAskedToRecord: r?.records || "",
  };
}

/** Has this step been recorded properly, or waved through? */
export function stepQuality(step) {
  const note = (step?.note || "").trim();
  if (!note) {
    return { ok: false, why: "No note was left, so the next person has to ask what happened." };
  }
  if (note.length < 12) {
    return { ok: false, why: `The note is "${note}" — too short to tell the next person anything.` };
  }
  return { ok: true, why: "" };
}

/** The whole history of a deal, newest first, for the timeline on screen. */
export function dealTimeline(deal) {
  const steps = [...(deal?.steps || [])].sort((a, b) => new Date(b.at) - new Date(a.at));
  return steps.map(s => ({
    ...s,
    quality: stepQuality(s),
    fileCount: (s.files || []).length,
    summary: `${s.byName || "Someone"} moved it from ${s.fromLabel} to ${s.toLabel}`,
  }));
}

/**
 * How long each stage actually took — so an agency can see where deals stall
 * rather than believing whoever complains loudest.
 */
export function stageDurations(deal) {
  const steps = [...(deal?.steps || [])].sort((a, b) => new Date(a.at) - new Date(b.at));
  const out = [];
  let prev = deal?.createdAt ? new Date(deal.createdAt) : null;
  steps.forEach(s => {
    const at = new Date(s.at);
    if (prev) {
      const days = Math.max(0, Math.round((at - prev) / 86400000));
      out.push({ stage: s.fromLabel, days, by: s.byName, department: s.byDepartment });
    }
    prev = at;
  });
  return out;
}

/** Everything the workflow needs a person to have been told. */
export const HANDOVER_NOTE =
  "When you move a deal on, say what you actually did and attach the paperwork. " +
  "The next person picks it up from your note — if it is empty they have to come " +
  "and ask you, which is the thing this is here to stop.";
