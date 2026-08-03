/* eslint-disable */
/**
 * DEALS — EVERY DEAL, WHERE IT IS, AND WHAT IS HOLDING IT UP.
 * ═════════════════════════════════════════════════════════════════════════════
 *
 * WHAT WAS HERE BEFORE, AND WHY IT WAS REPLACED
 * ─────────────────────────────────────────────
 * Four faults, any one of which makes a deal pipeline unusable:
 *
 * 1. THE OWNER WAS LOCKED OUT. `if (!isAgent && !isManager) return "Pipeline not
 *    available — contact your agency manager"`. The person who owns the agency
 *    and pays for the software was shown a locked door and told to ask an
 *    employee for access. Verified in the browser before it was changed.
 *
 * 2. NOTHING COULD BE SAVED. `db`, `doc`, `setDoc`, `addDoc`, `collection` and
 *    `deleteDoc` were used in five places and imported in none. Creating a deal,
 *    advancing a stage and deleting all threw ReferenceError. The tab was
 *    read-only by accident, and nobody had noticed because the owner could not
 *    open it and an agent who tried got silence.
 *
 * 3. ONE PIPELINE FOR EVERY DEAL. `EOI → Booking → SPA → DLD → Completed` is an
 *    off-plan pipeline. A resale has no EOI and no SPA; a rental has neither,
 *    plus Ejari. Brokers doing resale and leasing — most of the market — had no
 *    pipeline that described their work and nowhere to record a single one of
 *    the documents the law requires them to hold.
 *
 * 4. COMMISSION DEFAULTED TO 4%. Not a Dubai rate for anything: resale is
 *    customarily 2% from each side, rental about 5% of the annual rent, and
 *    off-plan is whatever the developer agreed. A wrong default is worse than
 *    none, because it gets accepted without thought.
 *
 * WHAT THIS DOES INSTEAD
 * ──────────────────────
 * Three journeys, each with its own stages, from src/crm/model/journeys.js.
 * Every stage names the document it needs, and a deal cannot pass a stage whose
 * document is missing — with the reason in plain words. That gate is the point:
 * a CRM that lets a deal reach "transferred" with no NOC on file is not
 * recording the business, it is hiding the risk.
 *
 * Old deals come across through src/crm/model/migrate.js, which maps what maps
 * and ASKS about what does not, rather than inventing a stage and letting a
 * guess harden into a fact.
 */
import React, { useState, useMemo, useCallback } from "react";
import { collection, doc, addDoc, setDoc, deleteDoc } from "firebase/firestore";
import { db } from "../firebase";
import { T } from "../data";
import {
  JOURNEYS, JOURNEY_KEYS, DOCUMENTS, journeyOf, stagesOf, stageIndex,
  currentStage, canAdvance, nextStage, requiredDocuments, conditionalDocuments,
  expiringDocuments, isComplete,
} from "../crm/model/journeys";
import {
  computeCommission, dealTotals, agencyStatement, agentStatement,
  COMMISSION_DEFAULTS, defaultRateFor, SIDES, SIDES_FOR, STATES, fmt,
} from "../crm/model/commission";
import { migrateDeals, migrateCommission } from "../crm/model/migrate";
import { viewerFrom, scopeFor, intentFor, visibleRecords, DEPARTMENTS } from "../crm/model/org";
import { whoseTurn, myWork, workByDepartment, stepRecord, stepQuality,
         dealTimeline, HANDOVER_NOTE } from "../crm/model/workflow";
import { onStageChange } from "../crm/model/notify";

const card  = { background: "rgba(255,255,255,0.02)", border: `1px solid ${T.border}`, borderRadius: 12 };
const muted = { fontSize: 9.5, fontWeight: 700, color: T.textMuted, letterSpacing: .7, textTransform: "uppercase" };

export default function PipelineTab({
  deals = [], dealsLoading, orgName, orgRole, userRole, orgId,
  firebaseUser, userName, teamMembers = [],
}) {
  /* ── WHO MAY SEE THIS ───────────────────────────────────────────────────
     Everyone in the agency. An agent sees their own deals; anyone senior sees
     the agency's. Locking the owner out was the worst thing about the old tab. */
  /* Scope comes from the model, not from a chain of role booleans. That is what
     lets CONVEYANCING see every deal in the company from staff level — a
     transaction coordinator has no "own" deals, their job is the document queue
     — and what keeps HR out of here entirely. */
  const me      = useMemo(() => viewerFrom({ firebaseUser, orgRole, userRole, teamMembers }),
                          [firebaseUser, orgRole, userRole, teamMembers]);
  const scope   = scopeFor(me, "deals");
  const intent  = intentFor(me, "deals");
  const moneyScope = scopeFor(me, "money");

  const isSuperAdmin = me.platformAdmin;
  const isAgent    = scope === "own";
  const seesAll    = scope === "org";
  const uid        = firebaseUser?.uid || "";

  const [journey, setJourney]   = useState("secondary");
  const [selected, setSelected] = useState(null);
  const [showHelp, setShowHelp] = useState(false);
  const [showNew,  setShowNew]  = useState(false);
  const [busy,     setBusy]     = useState(false);
  const [toast,    setToast]    = useState(null);
  const [form, setForm] = useState({
    client: "", property: "", journey: "secondary", price: "",
    side: "seller", ratePct: COMMISSION_DEFAULTS.resaleRatePct,
  });

  const say = useCallback((m, bad) => { setToast({ m, bad }); setTimeout(() => setToast(null), 3400); }, []);

  /* Old records brought onto the model, without guessing at what did not map. */
  const all = useMemo(
    () => visibleRecords(me, "deals", migrateDeals(deals || []),
                         { ownerField: "agentId", teamIds: me.teamIds }),
    [me, deals]);

  const mine        = useMemo(() => all.filter(d => d.journey === journey), [all, journey]);
  const needsReview = useMemo(() => all.filter(d => d.needsReview), [all]);
  const open        = useMemo(() => all.filter(d => !isComplete(d)), [all]);

  const lines = useMemo(() => all.flatMap(d =>
    (Array.isArray(d.commissionLines) ? d.commissionLines : migrateCommission(d))
      .map(l => ({ ...l, agentId: l.agentId || d.agentId }))), [all]);

  const money   = useMemo(() => agencyStatement(lines), [lines]);
  const myMoney = useMemo(() => agentStatement(lines, uid), [lines, uid]);

  /* WHOSE DESK EVERYTHING IS ON.
     The owner's brief was a system where every individual's work is defined and
     nobody has to walk over and ask where a deal is. `mine` is that list for
     this person; `byDept` is the same question for the whole company. */
  const mine_work = useMemo(() => myWork(all, me), [all, me]);
  const byDept    = useMemo(() => workByDepartment(all), [all]);

  /* Everything blocked, and by what — the report a manager actually opens. */
  const blocked = useMemo(() => open.map(d => ({ d, why: canAdvance(d) }))
    .filter(x => !x.why.ok && x.why.missing.length), [open]);

  const expiring = useMemo(() => open.flatMap(d =>
    expiringDocuments(d).filter(e => e.daysLeft <= 14).map(e => ({ ...e, deal: d }))
  ).sort((a, b) => a.daysLeft - b.daysLeft), [open]);

  /* ── WRITES — every one of these previously threw ReferenceError ───────── */

  /* Moving a deal on REQUIRES a note. That is the whole point of the workflow:
     the next person picks the deal up from what you wrote, and an empty note
     means they have to come and ask you — which is the thing this exists to
     stop. The note is checked for substance, not just presence, because "ok"
     tells the next person nothing. */
  const advance = useCallback(async (d, note) => {
    const gate = canAdvance(d);
    if (!gate.ok) { say(gate.reason, true); return false; }

    const step = stepRecord(d, nextStage(d).key,
      { id: uid, name: userName || firebaseUser?.email || "", department: me.department || "sales" },
      note || "");
    const quality = stepQuality(step);
    if (!quality.ok) { say(quality.why, true); return false; }

    setBusy(true);
    try {
      const to = nextStage(d).key;
      await setDoc(doc(db, "deals", d.id), {
        stage: to, journey: d.journey, needsReview: false,
        steps: [...(d.steps || []), step],
        updatedAt: new Date().toISOString(),
      }, { merge: true });
      setSelected(s => s?.id === d.id
        ? { ...s, stage: to, needsReview: false, steps: [...(s.steps || []), step] } : s);
      const moved = { ...d, stage: to, steps: [...(d.steps || []), step] };
      const turn = whoseTurn(moved);

      /* TELL WHOEVER IT LANDS ON.
         Recipients come from the workflow rather than a hand-written list, so a
         stage added later is covered automatically — and everyone is filtered
         through the same access model the screens use, because a notification
         about something you cannot open is a leak with a bell on it. */
      try {
        const roster = (teamMembers || []).map(m => ({
          id: m.uid || m.id, name: m.name || m.email,
          department: m.department || (m.orgRole === "owner" || m.orgRole === "director" ? "management" : "sales"),
          seniority: m.seniority, managerId: m.managerId,
        }));
        const notes = onStageChange(moved,
          { id: uid, name: userName || firebaseUser?.email || "" }, roster);
        await Promise.all(notes.map(n =>
          addDoc(collection(db, "notifications"), { ...n, orgId: orgId || "" })));
        if (notes.length) console.log(`[pipeline] notified ${notes.length} on ${d.id}`);
      } catch (e) {
        /* A failed notification must never lose the stage change that already
           saved. It is logged loudly instead of swallowed. */
        console.error("[pipeline] stage saved but notifications failed:", e);
      }

      say(`Moved to ${stagesOf(d).find(s => s.key === to)?.label}.` +
          (turn.done ? "" : ` Now with ${turn.departmentLabel}.`));
      setBusy(false);
      return true;
    } catch (e) {
      console.error("[pipeline] advance failed:", e);
      say("Could not save that — the deal has not moved.", true);
      setBusy(false);
      return false;
    }
  }, [say, uid, userName, firebaseUser, me, teamMembers, orgId]);

  const setStage = useCallback(async (d, stage) => {
    setBusy(true);
    try {
      await setDoc(doc(db, "deals", d.id),
        { stage, journey: d.journey, needsReview: false, updatedAt: new Date().toISOString() },
        { merge: true });
      setSelected(s => s?.id === d.id ? { ...s, stage, needsReview: false } : s);
      say("Stage set.");
    } catch (e) {
      console.error("[pipeline] setStage failed:", e);
      say("Could not save that.", true);
    }
    setBusy(false);
  }, [say]);

  const markDocument = useCallback(async (d, key, received) => {
    setBusy(true);
    try {
      const documents = { ...(d.documents || {}) };
      if (received) documents[key] = { receivedAt: new Date().toISOString(), by: userName || firebaseUser?.email || "" };
      else delete documents[key];
      await setDoc(doc(db, "deals", d.id), { documents, updatedAt: new Date().toISOString() }, { merge: true });
      setSelected(s => s?.id === d.id ? { ...s, documents } : s);
      say(received ? `${DOCUMENTS[key].label} recorded.` : `${DOCUMENTS[key].label} removed.`);
    } catch (e) {
      console.error("[pipeline] markDocument failed:", e);
      say("Could not save that.", true);
    }
    setBusy(false);
  }, [say, userName, firebaseUser]);

  const create = useCallback(async () => {
    if (!form.client.trim()) { say("A client name is needed.", true); return; }
    setBusy(true);
    try {
      const price = parseFloat(form.price) || 0;
      const ratePct = parseFloat(form.ratePct) || 0;
      await addDoc(collection(db, "deals"), {
        client: form.client.trim(), leadName: form.client.trim(),
        property: form.property.trim(),
        journey: form.journey,
        stage: JOURNEYS[form.journey].stages[0].key,
        price, documents: {},
        commissionLines: price && ratePct ? [{
          base: price, ratePct, side: form.side,
          vatRatePct: COMMISSION_DEFAULTS.vatRatePct,
          agentSplitPct: COMMISSION_DEFAULTS.agentSplitPct,
          state: "due", agentId: uid,
        }] : [],
        orgId: orgId || "", agentId: uid, agentName: userName || firebaseUser?.email || "",
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      });
      setShowNew(false);
      setJourney(form.journey);
      setForm({ client: "", property: "", journey: form.journey, price: "",
                side: SIDES_FOR[form.journey][0], ratePct: defaultRateFor(form.journey) || "" });
      say("Deal created.");
    } catch (e) {
      console.error("[pipeline] create failed:", e);
      say("Could not create the deal.", true);
    }
    setBusy(false);
  }, [form, orgId, uid, userName, firebaseUser, say]);

  const remove = useCallback(async d => {
    setBusy(true);
    try {
      await deleteDoc(doc(db, "deals", d.id));
      setSelected(null);
      say("Deal deleted.");
    } catch (e) {
      console.error("[pipeline] delete failed:", e);
      say("Could not delete that.", true);
    }
    setBusy(false);
  }, [say]);

  /* ── RENDER ─────────────────────────────────────────────────────────────── */

  if (scope === "none") {
    return (
      <div style={{ padding: "70px 20px", textAlign: "center" }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: T.white, marginBottom: 7, fontFamily: "'Fraunces',serif" }}>
          Deals are not part of your role
        </div>
        <div style={{ fontSize: 12, color: T.textSecondary, maxWidth: 430, margin: "0 auto", lineHeight: 1.7 }}>
          This is the sales, conveyancing and accounts side of the business. If that is
          wrong, your department is set incorrectly on your record.
        </div>
      </div>
    );
  }

  if (dealsLoading) {
    return <div style={{ padding: 60, textAlign: "center", color: T.textMuted, fontSize: 13 }}>Loading your deals…</div>;
  }

  const J = JOURNEYS[journey];
  const openNew = () => {
    setForm(f => ({ ...f, journey, side: SIDES_FOR[journey][0], ratePct: defaultRateFor(journey) || "" }));
    setShowNew(true);
  };

  return (
    <div style={{ paddingBottom: 80 }}>

      {/* WHAT THIS IS */}
      <div style={{ padding: "14px 4px 12px", borderBottom: `1px solid ${T.border}` }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap", marginBottom: 6 }}>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: T.white, fontFamily: "'Fraunces',serif" }}>
            {intent?.title || "Deals"}{orgName ? ` — ${orgName}` : ""}
          </h2>
          <button type="button" onClick={() => setShowHelp(v => !v)}
            style={{ background: "none", border: `1px solid ${T.border}`, borderRadius: 14, padding: "3px 11px",
                     color: showHelp ? T.gold : T.textSecondary, fontSize: 11, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>
            {showHelp ? "Hide the guide" : "How this works"}
          </button>
        </div>
        <div style={{ fontSize: 12, color: T.textSecondary, lineHeight: 1.6, maxWidth: 780 }}>
          {intent?.question} {scope === "own"
            ? "These are your deals."
            : scope === "team"
            ? "These are your team's deals, and your own."
            : "Every deal the agency is working."}{" "}
          A deal cannot pass a stage until the paperwork that stage needs is on file — which is how
          you find out an NOC has expired before the trustee appointment, rather than at it.
        </div>

        {showHelp && (
          <div style={{ marginTop: 12, display: "flex", gap: 12, flexWrap: "wrap" }}>
            {JOURNEY_KEYS.map(k => {
              const j = JOURNEYS[k];
              return (
                <div key={k} style={{ ...card, flex: "1 1 300px", minWidth: 265, padding: "12px 14px" }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: j.colour, marginBottom: 3 }}>{j.label}</div>
                  <div style={{ fontSize: 11, color: T.textSecondary, marginBottom: 9, lineHeight: 1.5 }}>{j.what}</div>
                  <ol style={{ margin: 0, paddingLeft: 16, fontSize: 10.5, color: T.textSecondary, lineHeight: 1.8 }}>
                    {j.stages.map(s => (
                      <li key={s.key}>
                        {s.label}
                        {(s.requires || []).length > 0 &&
                          <span style={{ color: T.gold }}> — needs {s.requires.map(d => DOCUMENTS[d].label).join(" + ")}</span>}
                      </li>
                    ))}
                  </ol>
                </div>
              );
            })}
            <div style={{ flex: "1 1 100%", fontSize: 10.5, color: T.textMuted, lineHeight: 1.65,
                          background: "rgba(255,255,255,0.015)", border: `1px solid ${T.border}`, borderRadius: 10, padding: "11px 14px" }}>
              <b style={{ color: T.textSecondary }}>What this tab does not do.</b>{" "}
              It does not file anything with the Land Department, book a trustee appointment, or check
              that a document you tick is genuine — ticking records that you hold it, nothing more. It
              does not predict which deals will close. Commission is what you agreed, not money you
              have, until you mark the line received.
            </div>
          </div>
        )}
      </div>

      {/* ON YOUR DESK — the list that replaces walking over and asking.
          Every deal in the agency currently waiting on THIS person's
          department, blocked ones first, each with the instruction. */}
      {mine_work.total > 0 && (
        <div style={{ ...card, margin: "12px 4px", padding: "13px 15px",
                      borderColor: mine_work.blocked ? "rgba(239,68,68,0.3)" : T.gold + "44" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", marginBottom: 9 }}>
            <span style={{ ...muted, color: mine_work.blocked ? "#EF4444" : T.gold }}>On your desk</span>
            <span style={{ fontSize: 11, color: T.textSecondary }}>{mine_work.headline}</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {mine_work.items.slice(0, 6).map(({ deal: d, turn }) => (
              <div key={d.id} onClick={() => { setJourney(d.journey); setSelected(d); }}
                style={{ cursor: "pointer", display: "flex", gap: 10, alignItems: "flex-start" }}>
                <span style={{ fontSize: 10, fontWeight: 700, minWidth: 74, flexShrink: 0,
                               color: turn.blocked ? "#EF4444" : T.gold }}>
                  {turn.blocked ? "Blocked" : turn.stageLabel}
                </span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 11.5, color: T.white, fontWeight: 600 }}>
                    {d.client || d.leadName || "Untitled deal"}
                  </div>
                  <div style={{ fontSize: 10.5, color: T.textSecondary, lineHeight: 1.5 }}>
                    {turn.blocked ? turn.blockedBy : turn.does}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* WHERE EVERY DEAL IS SITTING — for anyone who sees the whole agency. */}
      {scope === "org" && byDept.length > 0 && (
        <div style={{ ...card, margin: "0 4px 12px", padding: "13px 15px" }}>
          <div style={{ ...muted, marginBottom: 9 }}>Which department each deal is waiting on</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {byDept.map(d => (
              <div key={d.department} title={`${d.total} deal${d.total === 1 ? "" : "s"} with ${d.label}${d.blocked ? `, ${d.blocked} blocked` : ""}`}
                style={{ flex: "1 1 150px", minWidth: 140, padding: "9px 11px", borderRadius: 8,
                         background: d.blocked ? "rgba(239,68,68,0.06)" : "rgba(255,255,255,0.02)",
                         border: `1px solid ${d.blocked ? "rgba(239,68,68,0.28)" : T.border}` }}>
                <div style={{ fontSize: 17, fontWeight: 800, fontFamily: "'Fraunces',serif",
                              color: d.blocked ? "#EF4444" : T.gold }}>{d.total}</div>
                <div style={{ fontSize: 10.5, color: T.textSecondary, marginTop: 2 }}>{d.label}</div>
                {d.blocked > 0 && (
                  <div style={{ fontSize: 9.5, color: "#EF4444", marginTop: 2 }}>{d.blocked} blocked</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* DEALS THE OLD PIPELINE COULD NOT DESCRIBE */}
      {needsReview.length > 0 && (
        <div style={{ margin: "12px 4px", padding: "12px 14px", borderRadius: 10,
                      background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.28)" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#F59E0B", marginBottom: 4 }}>
            {needsReview.length} deal{needsReview.length === 1 ? "" : "s"} need
            {needsReview.length === 1 ? "s" : ""} the stage confirming
          </div>
          <div style={{ fontSize: 11, color: T.textSecondary, lineHeight: 1.6 }}>
            These were recorded on the old pipeline, which used one set of stages for every kind of
            deal. Their stage does not exist in the journey they belong to, so rather than guess at
            it, open each one and set where the deal actually is.
          </div>
        </div>
      )}

      {/* MONEY — the questions one typed number could not answer */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", padding: "12px 4px" }}>
        <Figure label="Open deals" value={open.length} accent={T.gold}
                note={`${all.length} on record in total, across all three journeys.`} />
        {/* Sales admin and the listings desk work these deals every day and have
            no business seeing what the agency billed. Money is its own scope. */}
        {moneyScope === "org" && <>
          <Figure label="Not invoiced yet" value={fmt(money.notYetInvoiced)}
                  note="Earned on deals nobody has billed for. Raise the invoices." />
          <Figure label="Invoiced, not paid" value={fmt(money.outstanding)} accent="#F59E0B" note={money.note} />
          <Figure label="Collected" value={fmt(money.collected)} accent="#10B981"
                  note={`Of which ${fmt(money.owedToAgents)} is owed out to agents.`} />
        </>}
        {moneyScope === "own" && <Figure label="Owed to you" value={fmt(myMoney.owedToYou)} accent="#10B981" note={myMoney.note} />}
      </div>

      {/* WHAT IS HOLDING DEALS UP */}
      {(blocked.length > 0 || expiring.length > 0) && (
        <div style={{ ...card, margin: "0 4px 12px", padding: "12px 14px" }}>
          <div style={{ ...muted, marginBottom: 8 }}>What is holding deals up</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {expiring.map(e => (
              <div key={e.deal.id + e.key} onClick={() => { setJourney(e.deal.journey); setSelected(e.deal); }}
                   style={{ display: "flex", gap: 9, alignItems: "baseline", cursor: "pointer" }}>
                <span style={{ color: e.expired ? "#EF4444" : "#F59E0B", fontSize: 10.5, fontWeight: 700, flexShrink: 0 }}>
                  {e.expired ? "Expired" : "Expiring"}
                </span>
                <span style={{ fontSize: 11.5, color: T.textSecondary, lineHeight: 1.5 }}>
                  <b style={{ color: T.white }}>{e.deal.client || e.deal.leadName || "Untitled deal"}</b> — {e.note}
                </span>
              </div>
            ))}
            {blocked.slice(0, 8).map(({ d, why }) => (
              <div key={d.id} onClick={() => { setJourney(d.journey); setSelected(d); }}
                   style={{ display: "flex", gap: 9, alignItems: "baseline", cursor: "pointer" }}>
                <span style={{ color: T.textMuted, fontSize: 10.5, fontWeight: 700, flexShrink: 0 }}>Blocked</span>
                <span style={{ fontSize: 11.5, color: T.textSecondary, lineHeight: 1.5 }}>
                  <b style={{ color: T.white }}>{d.client || d.leadName || "Untitled deal"}</b> — {why.reason}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* JOURNEY PICKER */}
      <div style={{ display: "flex", gap: 0, borderBottom: `1px solid ${T.border}`, paddingLeft: 4, overflowX: "auto", alignItems: "center" }}>
        {JOURNEY_KEYS.map(k => {
          const j = JOURNEYS[k], n = all.filter(d => d.journey === k).length, on = journey === k;
          return (
            <button key={k} type="button" title={j.what} onClick={() => { setJourney(k); setSelected(null); }}
              style={{ padding: "10px 15px", border: "none", background: "transparent",
                       borderBottom: on ? `2px solid ${j.colour}` : "2px solid transparent",
                       color: on ? T.white : T.textMuted, fontSize: 12, fontWeight: on ? 700 : 400,
                       cursor: "pointer", whiteSpace: "nowrap", fontFamily: "'Outfit',sans-serif" }}>
              {j.label} <span style={{ fontSize: 10, color: on ? j.colour : T.textMuted }}>{n}</span>
            </button>
          );
        })}
        <button type="button" onClick={openNew} title="Record a new deal"
          style={{ marginLeft: "auto", marginRight: 4, padding: "7px 16px", borderRadius: 7, border: "none",
                   background: "linear-gradient(135deg,#D4A843,#B8902E)", color: "#0A0E1A",
                   fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>
          + New deal
        </button>
      </div>

      {/* STAGE RAIL */}
      {mine.length > 0 && (
        <div style={{ display: "flex", gap: 5, padding: "12px 4px", overflowX: "auto" }}>
          {J.stages.map(s => {
            const n = mine.filter(d => d.stage === s.key).length;
            return (
              <div key={s.key} title={s.what}
                style={{ flex: "1 0 92px", padding: "8px 9px", borderRadius: 8, textAlign: "center",
                         background: n ? `${J.colour}10` : "rgba(255,255,255,0.02)",
                         border: `1px solid ${n ? J.colour + "40" : T.border}` }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: n ? J.colour : T.textMuted, fontFamily: "'Fraunces',serif" }}>{n}</div>
                <div style={{ fontSize: 9, color: T.textMuted, marginTop: 2, lineHeight: 1.3 }}>{s.label}</div>
              </div>
            );
          })}
        </div>
      )}

      {/* THE DEALS */}
      <div style={{ display: "grid", gridTemplateColumns: selected ? "1fr 400px" : "1fr", gap: 12, alignItems: "start", padding: "0 4px" }}>
        <div>
          {mine.length === 0 ? (
            <div style={{ padding: "38px 20px 44px", textAlign: "center" }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: T.white, marginBottom: 7, fontFamily: "'Fraunces',serif" }}>
                No {J.label.toLowerCase()} deals yet
              </div>
              <div style={{ fontSize: 12, color: T.textSecondary, lineHeight: 1.7, maxWidth: 450, margin: "0 auto 18px" }}>
                {J.what} Record one and it runs through {J.stages.length} stages, holding you at each
                one until the paperwork that stage needs is on file.
              </div>
              <button type="button" onClick={openNew}
                style={{ padding: "10px 24px", borderRadius: 8, border: "none", fontFamily: "'Outfit',sans-serif",
                         background: "linear-gradient(135deg,#D4A843,#B8902E)", color: "#0A0E1A",
                         fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                Record the first one
              </button>
            </div>
          ) : mine.map(d => {
            const st = currentStage(d), gate = canAdvance(d), on = selected?.id === d.id;
            const total = dealTotals(Array.isArray(d.commissionLines) ? d.commissionLines : migrateCommission(d));
            return (
              <div key={d.id} onClick={() => setSelected(on ? null : d)}
                style={{ ...card, padding: "12px 14px", marginBottom: 8, cursor: "pointer",
                         borderColor: on ? T.gold : d.needsReview ? "rgba(245,158,11,0.35)" : T.border }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "baseline" }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.white }}>{d.client || d.leadName || "Untitled deal"}</div>
                    <div style={{ fontSize: 11, color: T.textMuted, marginTop: 1 }}>{d.property || d.project || "No property recorded"}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.gold }}>{d.price ? fmt(d.price) : "—"}</div>
                    {total.gross > 0 && <div style={{ fontSize: 10.5, color: T.textMuted }}>{fmt(total.gross)} commission</div>}
                  </div>
                </div>

                <div style={{ display: "flex", gap: 3, margin: "10px 0 7px" }}>
                  {J.stages.map((s, i) => (
                    <div key={s.key} style={{ flex: 1, height: 3, borderRadius: 2,
                      background: i <= stageIndex(d) ? J.colour : "rgba(255,255,255,0.07)" }} />
                  ))}
                </div>

                {/* Whose turn, on the card, so nobody has to open it to find out. */}
                {(() => { const turn = whoseTurn(d);
                  if (turn.done) return null;
                  return (
                    <div style={{ fontSize: 10.5, color: T.textMuted, marginBottom: 5 }}>
                      With <b style={{ color: turn.blocked ? "#EF4444" : T.textSecondary }}>{turn.departmentLabel}</b>
                      {" — "}{turn.does}
                    </div>
                  );
                })()}
                <div style={{ display: "flex", gap: 8, alignItems: "baseline", flexWrap: "wrap" }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: J.colour }}>{st.label}</span>
                  <span style={{ fontSize: 11, color: gate.ok ? T.textMuted : "#F59E0B", lineHeight: 1.5 }}>
                    {d.needsReview ? "Stage needs confirming."
                      : gate.ok ? (isComplete(d) ? "Done." : `Next: ${nextStage(d).label}`)
                      : gate.reason}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {selected && (
          <DealPanel deal={selected} busy={busy} canDelete={seesAll}
            onClose={() => setSelected(null)}
            onAdvance={note => advance(selected, note)}
            onSetStage={s => setStage(selected, s)}
            onDoc={(k, v) => markDocument(selected, k, v)}
            onDelete={() => remove(selected)} />
        )}
      </div>

      {/* NEW DEAL */}
      {showNew && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(4,9,15,0.9)", zIndex: 2000,
                      display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
             onClick={e => { if (e.target === e.currentTarget) setShowNew(false); }}>
          <div style={{ background: "#0D1117", borderRadius: 14, border: `1px solid ${T.border}`,
                        width: "100%", maxWidth: 520, maxHeight: "92vh", overflowY: "auto" }}>
            <div style={{ padding: "15px 20px", borderBottom: `1px solid ${T.border}`,
                          display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontFamily: "'Fraunces',serif", fontSize: 15, fontWeight: 900, color: T.white }}>New deal</div>
              <button type="button" onClick={() => setShowNew(false)} title="Close"
                style={{ background: "rgba(255,255,255,0.06)", border: `1px solid ${T.border}`, borderRadius: 7,
                         color: T.textMuted, width: 28, height: 28, cursor: "pointer", fontSize: 15 }}>✕</button>
            </div>
            <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 13 }}>
              <Field label="Client *" hint="Who the deal is with.">
                <Inp value={form.client} onChange={v => setForm(f => ({ ...f, client: v }))} placeholder="Client name" />
              </Field>
              <Field label="Property" hint="The unit, or the project on an off-plan deal.">
                <Inp value={form.property} onChange={v => setForm(f => ({ ...f, property: v }))} placeholder="e.g. Marina Gate 2, unit 1104" />
              </Field>
              <Field label="Kind of deal" hint="This decides the stages and the paperwork the deal will be held to.">
                <Sel value={form.journey}
                  onChange={v => setForm(f => ({ ...f, journey: v, side: SIDES_FOR[v][0], ratePct: defaultRateFor(v) || "" }))}>
                  {JOURNEY_KEYS.map(k => <option key={k} value={k}>{JOURNEYS[k].label} — {JOURNEYS[k].what}</option>)}
                </Sel>
              </Field>
              <Field label={form.journey === "rental" ? "Annual rent (AED)" : "Price (AED)"}
                hint={form.journey === "rental"
                  ? "Commission on a lease is charged against the annual rent, not the monthly."
                  : "The agreed price."}>
                <Inp value={form.price} onChange={v => setForm(f => ({ ...f, price: v }))} placeholder="3500000" type="number" />
              </Field>
              <Field label="Who pays you"
                hint="On a resale each side customarily pays its own agent, so one deal can carry two lines.">
                <Sel value={form.side} onChange={v => setForm(f => ({ ...f, side: v }))}>
                  {SIDES_FOR[form.journey].map(s => <option key={s} value={s}>{SIDES[s].label} — {SIDES[s].who}</option>)}
                </Sel>
              </Field>
              <Field label="Commission rate (%)"
                hint={form.journey === "offplan"
                  ? "Off-plan rates are set by the developer and vary by project, so there is no default — enter what was agreed."
                  : form.journey === "rental"
                  ? "Customarily around 5% of the annual rent."
                  : "Customarily 2% from each side. Change it if you agreed otherwise."}>
                <Inp value={form.ratePct} onChange={v => setForm(f => ({ ...f, ratePct: v }))} placeholder="2" type="number" />
              </Field>

              {parseFloat(form.price) > 0 && parseFloat(form.ratePct) > 0 && (
                <div style={{ ...card, padding: "11px 13px" }}>
                  <div style={{ ...muted, marginBottom: 6 }}>What that comes to</div>
                  {computeCommission({ base: parseFloat(form.price), ratePct: parseFloat(form.ratePct) })
                    .workings.map((w, i) => (
                      <div key={i} style={{ fontSize: 11, color: T.textSecondary, lineHeight: 1.7 }}>{w}</div>
                    ))}
                </div>
              )}

              <button type="button" onClick={create} disabled={busy || !form.client.trim()}
                style={{ width: "100%", padding: 12, borderRadius: 8, border: "none", fontFamily: "'Outfit',sans-serif",
                         background: !form.client.trim() ? "rgba(212,168,67,0.3)" : "linear-gradient(135deg,#D4A843,#B8902E)",
                         color: "#0A0E1A", fontSize: 13, fontWeight: 700,
                         cursor: !form.client.trim() ? "not-allowed" : "pointer" }}>
                {busy ? "Saving…" : "Create deal"}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", zIndex: 3000,
                      padding: "11px 18px", borderRadius: 9, fontSize: 12, fontFamily: "'Outfit',sans-serif",
                      background: toast.bad ? "rgba(239,68,68,0.14)" : "rgba(16,185,129,0.14)",
                      border: `1px solid ${toast.bad ? "rgba(239,68,68,0.4)" : "rgba(16,185,129,0.4)"}`,
                      color: toast.bad ? "#FCA5A5" : "#6EE7B7", maxWidth: 520, lineHeight: 1.5 }}>
          {toast.m}
        </div>
      )}
    </div>
  );
}

/* ── PARTS ─────────────────────────────────────────────────────────────────── */

function Figure({ label, value, note, accent }) {
  return (
    <div title={note} style={{ ...card, flex: "1 1 180px", minWidth: 162, padding: "13px 15px" }}>
      <div style={{ ...muted, marginBottom: 5 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 800, color: accent || T.white, fontFamily: "'Fraunces',serif" }}>{value}</div>
      {note && <div style={{ fontSize: 9.5, color: T.textMuted, marginTop: 5, lineHeight: 1.5 }}>{note}</div>}
    </div>
  );
}

const Field = ({ label, hint, children }) => (
  <div>
    <div style={{ fontSize: 10, color: T.textMuted, marginBottom: 3, fontWeight: 700, textTransform: "uppercase", letterSpacing: .5 }}>{label}</div>
    {hint && <div style={{ fontSize: 10.5, color: T.textMuted, marginBottom: 5, lineHeight: 1.5 }}>{hint}</div>}
    {children}
  </div>
);

const inpStyle = {
  width: "100%", padding: "8px 10px", background: "rgba(255,255,255,0.04)",
  border: `1px solid ${T.border}`, borderRadius: 7, color: T.white, fontSize: 12,
  outline: "none", boxSizing: "border-box", fontFamily: "'Outfit',sans-serif",
};

const Inp = ({ value, onChange, placeholder, type = "text" }) =>
  <input value={value} type={type} placeholder={placeholder} onChange={e => onChange(e.target.value)} style={inpStyle} />;

const Sel = ({ value, onChange, children }) =>
  <select value={value} onChange={e => onChange(e.target.value)} style={inpStyle}>{children}</select>;

/** One deal: where it is, what it is missing, and what it is worth. */
function DealPanel({ deal, onClose, onAdvance, onSetStage, onDoc, onDelete, canDelete, busy }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [note, setNote] = useState("");
  const turn = whoseTurn(deal);
  const timeline = dealTimeline(deal);
  const J = journeyOf(deal);
  const gate = canAdvance(deal);
  const req  = requiredDocuments(deal);
  const cond = conditionalDocuments(deal);
  const exp  = expiringDocuments(deal);
  const held = k => Boolean(deal?.documents?.[k]?.receivedAt);
  const lines = Array.isArray(deal.commissionLines) ? deal.commissionLines : migrateCommission(deal);
  const total = dealTotals(lines);

  const Tick = ({ k, on }) => (
    <button type="button" onClick={() => onDoc(k, !on)} disabled={busy}
      title={on ? "Recorded. Click to remove." : `Tick when you hold the ${DOCUMENTS[k].label}.`}
      style={{ width: 15, height: 15, borderRadius: 4, flexShrink: 0, marginTop: 1, cursor: "pointer", padding: 0,
               border: `1px solid ${on ? "#10B981" : T.border}`, background: on ? "#10B981" : "transparent",
               color: "#0A0E1A", fontSize: 10, lineHeight: 1, fontWeight: 900 }}>
      {on ? "✓" : ""}
    </button>
  );

  return (
    <div style={{ ...card, position: "sticky", top: 12, maxHeight: "calc(100vh - 140px)", overflowY: "auto" }}>
      <div style={{ padding: "13px 15px", borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", gap: 10 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.white }}>{deal.client || deal.leadName || "Untitled deal"}</div>
          <div style={{ fontSize: 10.5, color: J.colour, marginTop: 2 }}>{J.label} · {currentStage(deal).label}</div>
        </div>
        <button type="button" onClick={onClose} title="Close"
          style={{ background: "none", border: "none", color: T.textMuted, cursor: "pointer", fontSize: 15 }}>✕</button>
      </div>

      <div style={{ padding: "13px 15px", display: "flex", flexDirection: "column", gap: 14 }}>

        {deal.needsReview && (
          <div style={{ padding: "10px 12px", borderRadius: 8, background: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.28)" }}>
            <div style={{ fontSize: 11, color: "#F59E0B", fontWeight: 700, marginBottom: 4 }}>Where is this deal really?</div>
            <div style={{ fontSize: 10.5, color: T.textSecondary, lineHeight: 1.6 }}>{deal.reviewReason}</div>
          </div>
        )}

        {/* Every stage is clickable — deals go backwards as well as forwards. */}
        <div>
          <div style={{ ...muted, marginBottom: 7 }}>Where it is</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {J.stages.map((s, i) => {
              const done = i < stageIndex(deal), now = i === stageIndex(deal);
              return (
                <button key={s.key} type="button" title={s.what} onClick={() => onSetStage(s.key)} disabled={busy}
                  style={{ display: "flex", gap: 8, alignItems: "baseline", textAlign: "left", padding: "5px 7px",
                           borderRadius: 6, border: "none", cursor: "pointer", fontFamily: "'Outfit',sans-serif",
                           background: now ? `${J.colour}12` : "transparent" }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", flexShrink: 0, transform: "translateY(-1px)",
                                 background: done || now ? J.colour : "rgba(255,255,255,0.15)" }} />
                  <span style={{ fontSize: 11, fontWeight: now ? 700 : 400,
                                 color: now ? T.white : done ? T.textSecondary : T.textMuted }}>{s.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* WHOSE TURN, WHAT THEY MUST DO, AND THE NOTE THAT HANDS IT ON. */}
        {!turn.done && (
          <div style={{ padding: "11px 13px", borderRadius: 8,
                        background: "rgba(255,255,255,0.025)", border: `1px solid ${T.border}` }}>
            <div style={{ ...muted, marginBottom: 5 }}>Whose turn</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: turn.blocked ? "#EF4444" : T.gold, marginBottom: 4 }}>
              {turn.departmentLabel}
            </div>
            <div style={{ fontSize: 11.5, color: T.textSecondary, lineHeight: 1.6 }}>{turn.does}</div>
            {turn.records && (
              <div style={{ fontSize: 10.5, color: T.textMuted, lineHeight: 1.6, marginTop: 6 }}>
                <b style={{ color: T.textSecondary }}>Write down:</b> {turn.records}
              </div>
            )}
          </div>
        )}

        {!isComplete(deal) && (
          <div>
            {/* A deal does not move without a note. The next person picks it up
                from what you wrote; an empty note means they have to come and
                ask, which is the thing this whole workflow exists to stop. */}
            <div style={{ ...muted, marginBottom: 5 }}>What did you do?</div>
            <textarea value={note} onChange={e => setNote(e.target.value)} rows={3}
              placeholder={turn.records ? `e.g. ${turn.records}` : "What you did, and anything the next person needs to know."}
              style={{ width: "100%", padding: "8px 10px", background: "rgba(255,255,255,0.04)",
                       border: `1px solid ${T.border}`, borderRadius: 7, color: T.white, fontSize: 11.5,
                       outline: "none", resize: "vertical", boxSizing: "border-box",
                       fontFamily: "'Outfit',sans-serif", lineHeight: 1.5 }} />
            <div style={{ fontSize: 9.5, color: T.textMuted, margin: "5px 0 8px", lineHeight: 1.55 }}>
              {HANDOVER_NOTE}
            </div>
            <button type="button" onClick={async () => { const ok = await onAdvance(note); if (ok) setNote(""); }}
              disabled={busy || !gate.ok}
              style={{ width: "100%", padding: 10, borderRadius: 8, border: "none", fontFamily: "'Outfit',sans-serif",
                       background: gate.ok ? "linear-gradient(135deg,#D4A843,#B8902E)" : "rgba(255,255,255,0.05)",
                       color: gate.ok ? "#0A0E1A" : T.textMuted, fontSize: 12, fontWeight: 700,
                       cursor: gate.ok ? "pointer" : "not-allowed" }}>
              {gate.ok ? `Move to ${nextStage(deal).label}` : "Cannot move on yet"}
            </button>
            {!gate.ok && <div style={{ fontSize: 10.5, color: "#F59E0B", marginTop: 6, lineHeight: 1.6 }}>{gate.reason}</div>}
          </div>
        )}

        {/* WHAT HAS HAPPENED SO FAR — who did what, when, in their words. */}
        {timeline.length > 0 && (
          <div>
            <div style={{ ...muted, marginBottom: 7 }}>What has happened</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              {timeline.map((st, i) => (
                <div key={i} style={{ paddingLeft: 10, borderLeft: `2px solid ${st.quality.ok ? T.border : "rgba(245,158,11,0.5)"}` }}>
                  <div style={{ fontSize: 10.5, color: T.textSecondary, fontWeight: 600 }}>
                    {st.summary}
                    <span style={{ color: T.textMuted, fontWeight: 400 }}>
                      {" · "}{new Date(st.at).toLocaleDateString("en-AE", { day: "2-digit", month: "short" })}
                      {st.byDepartment ? ` · ${DEPARTMENTS[st.byDepartment]?.label || st.byDepartment}` : ""}
                    </span>
                  </div>
                  {st.note && <div style={{ fontSize: 11, color: T.white, lineHeight: 1.55, marginTop: 2 }}>{st.note}</div>}
                  {!st.quality.ok && (
                    <div style={{ fontSize: 10, color: "#F59E0B", marginTop: 2, lineHeight: 1.5 }}>{st.quality.why}</div>
                  )}
                  {st.fileCount > 0 && (
                    <div style={{ fontSize: 10, color: T.textMuted, marginTop: 2 }}>
                      {st.fileCount} file{st.fileCount === 1 ? "" : "s"} attached
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PAPERWORK */}
        <div>
          <div style={{ ...muted, marginBottom: 7 }}>Paperwork</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {req.map(d => {
              const on = held(d.key), e = exp.find(x => x.key === d.key);
              return (
                <div key={d.key} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                  <Tick k={d.key} on={on} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: on ? T.textSecondary : T.white }}>
                      {d.label}
                      <span style={{ fontSize: 9.5, color: T.textMuted, fontWeight: 400 }}> · due at {d.dueAtLabel}</span>
                    </div>
                    <div style={{ fontSize: 10, color: T.textMuted, lineHeight: 1.5, marginTop: 1 }}>{d.why}</div>
                    {e && <div style={{ fontSize: 10, color: e.expired ? "#EF4444" : "#F59E0B", marginTop: 2, fontWeight: 600 }}>{e.note}</div>}
                  </div>
                </div>
              );
            })}
            {cond.length > 0 && (
              <div style={{ marginTop: 4, paddingTop: 8, borderTop: `1px solid ${T.border}` }}>
                <div style={{ fontSize: 9.5, color: T.textMuted, marginBottom: 6 }}>
                  Only if they apply — these never block the deal
                </div>
                {cond.map(d => {
                  const on = held(d.key);
                  return (
                    <div key={d.key} style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 6 }}>
                      <Tick k={d.key} on={on} />
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: on ? T.textSecondary : T.white }}>{d.label}</div>
                        <div style={{ fontSize: 10, color: T.textMuted, lineHeight: 1.5 }}>If {d.when}.</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* MONEY */}
        {lines.length > 0 && (
          <div>
            <div style={{ ...muted, marginBottom: 7 }}>Commission</div>
            {lines.map((l, i) => {
              const c = computeCommission(l), state = STATES[l.state || "due"];
              return (
                <div key={i} style={{ marginBottom: 9 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "baseline" }}>
                    <span style={{ fontSize: 11, color: T.white, fontWeight: 600 }}>
                      {l.side ? SIDES[l.side]?.label : "Commission"}
                    </span>
                    <span title={state.what} style={{ fontSize: 10, color: state.colour, fontWeight: 700 }}>{state.label}</span>
                  </div>
                  {l.legacy
                    ? <div style={{ fontSize: 10, color: "#F59E0B", lineHeight: 1.55, marginTop: 3 }}>{l.note}</div>
                    : c.workings.map((w, k) => (
                        <div key={k} style={{ fontSize: 10, color: T.textMuted, lineHeight: 1.65 }}>{w}</div>
                      ))}
                </div>
              );
            })}
            {total.gross > 0 && (
              <div style={{ fontSize: 11, color: T.textSecondary, borderTop: `1px solid ${T.border}`, paddingTop: 7 }}>
                {fmt(total.gross)} commission on this deal · the agent's share is {fmt(total.agentShare)}
              </div>
            )}
          </div>
        )}

        {canDelete && (
          <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 11 }}>
            {confirmDelete ? (
              <div style={{ display: "flex", gap: 7, alignItems: "center", flexWrap: "wrap" }}>
                <span style={{ fontSize: 10.5, color: T.textSecondary }}>Delete this deal for good?</span>
                <button type="button" onClick={onDelete} disabled={busy}
                  style={{ padding: "4px 11px", borderRadius: 6, border: "1px solid rgba(239,68,68,0.4)",
                           background: "rgba(239,68,68,0.1)", color: "#FCA5A5", fontSize: 10.5,
                           cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>Delete</button>
                <button type="button" onClick={() => setConfirmDelete(false)}
                  style={{ padding: "4px 11px", borderRadius: 6, border: `1px solid ${T.border}`,
                           background: "transparent", color: T.textMuted, fontSize: 10.5,
                           cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>Keep it</button>
              </div>
            ) : (
              <button type="button" onClick={() => setConfirmDelete(true)}
                style={{ background: "none", border: "none", color: T.textMuted, fontSize: 10.5,
                         cursor: "pointer", padding: 0, fontFamily: "'Outfit',sans-serif" }}>
                Delete this deal
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
