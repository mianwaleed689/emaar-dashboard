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
  nextStep, applyState,
} from "../crm/model/commission";
import { migrateDeals, migrateCommission } from "../crm/model/migrate";
import { viewerFrom, scopeFor, intentFor, visibleRecords, DEPARTMENTS } from "../crm/model/org";
import { whoseTurn, myWork, workByDepartment, stepRecord, stepQuality,
         dealTimeline, HANDOVER_NOTE } from "../crm/model/workflow";
import { onStageChange, notificationsFor } from "../crm/model/notify";
import { checkFile, documentRecord, isOnFile, humanSize, ACCEPT_ATTR } from "../crm/model/documents";
/* The screen is built from the system now. See src/design/system.js. */
import { colour as C, type as TY, space as S, radius as R, state as ST, surface, density as DEN } from "../design/system";
import { useSystemCSS, useViewport, PageHead, Card as DsCard, Figure as DsFigure, FigureRow,
         Btn, Chip, Dot, DataList, Empty, Toolbar } from "../design/ui";
import { putFile, fileUrl, removeFile, documentPath, storageStatus } from "../services/storage";

const card  = surface();
const muted = { ...TY.label, color: C.textMuted };

export default function PipelineTab({
  myDepartment, mySeniority,
  deals = [], dealsLoading, orgName, orgRole, userRole, orgId,
  firebaseUser, userName, teamMembers = [], orgProfile,
}) {
  /* The agency decides whether a tick is enough or the file has to be there.
     Off by default — see journeys.js#holds for why turning it on is the
     agency's call and not a default we impose on their first morning. */
  useSystemCSS();
  const { phone, width } = useViewport();
  const strict = Boolean(orgProfile?.requireDocumentFiles);
  const gateOpts = useMemo(() => ({ strict }), [strict]);
  /* ── WHO MAY SEE THIS ───────────────────────────────────────────────────
     Everyone in the agency. An agent sees their own deals; anyone senior sees
     the agency's. Locking the owner out was the worst thing about the old tab. */
  /* Scope comes from the model, not from a chain of role booleans. That is what
     lets CONVEYANCING see every deal in the company from staff level — a
     transaction coordinator has no "own" deals, their job is the document queue
     — and what keeps HR out of here entirely. */
  const me      = useMemo(() => viewerFrom({ firebaseUser, orgRole, userRole, teamMembers,
                                             department: myDepartment, seniority: mySeniority }),
                          [firebaseUser, orgRole, userRole, teamMembers, myDepartment, mySeniority]);
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
  /* Clicking a segment of the funnel narrows the list to that stage. The rail
     used to be eleven read-only boxes: it told you nine deals were sitting at
     "Permit issued" and then made you find them yourself. */
  const [stageFilter, setStageFilter] = useState(null);
  /* Same for the department strip: it said 25 deals were sitting with Sales
     admin and then left you to find them. */
  const [deptFilter, setDeptFilter] = useState(null);
  const shown = useMemo(() => {
    /* The department strip counts every journey, so clicking it has to show
       every journey — otherwise you click "25 with Sales admin" and get four,
       because the other twenty-one are off-plan and rental. The count you
       press and the list you get are the same set. */
    if (deptFilter) return all.filter(d => whoseTurn(d, Date.now(), gateOpts).department === deptFilter);
    return stageFilter ? mine.filter(d => d.stage === stageFilter) : mine;
  }, [all, mine, stageFilter, deptFilter, gateOpts]);
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
  const mine_work = useMemo(() => myWork(all, me, Date.now(), gateOpts), [all, me, gateOpts]);
  const byDept    = useMemo(() => workByDepartment(all, Date.now(), gateOpts), [all, gateOpts]);

  /* Everything blocked, and by what — the report a manager actually opens. */
  const blocked = useMemo(() => open.map(d => ({ d, why: canAdvance(d, gateOpts) }))
    .filter(x => !x.why.ok && x.why.missing.length), [open, gateOpts]);

  /* See the blockers panel below for why this is not simply blocked.length. */
  const showBlocked = blocked.length > 0 && all.length > 1;

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
    const gate = canAdvance(d, gateOpts);
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
      const turn = whoseTurn(moved, Date.now(), gateOpts);

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
          { id: uid, name: userName || firebaseUser?.email || "" }, roster,
          new Date(), gateOpts);
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

  /* Attaching a file writes the same document record markDocument writes, plus
     the file itself. One shape either way, so nothing downstream has to know
     whether a document arrived as a tick or as paper. */
  const attachDocument = useCallback(async (d, key, record) => {
    setBusy(true);
    try {
      const documents = { ...(d.documents || {}), [key]: record };
      await setDoc(doc(db, "deals", d.id), { documents, updatedAt: new Date().toISOString() }, { merge: true });
      setSelected(s2 => s2?.id === d.id ? { ...s2, documents } : s2);
      say(`${DOCUMENTS[key]?.label || "Document"} attached — ${record.file?.name || "file"}.`);
    } catch (e) {
      console.error("[pipeline] attachDocument failed:", e);
      say("Could not save that file.", true);
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

  /* ACCOUNTS MOVING A LINE ALONG.
     due → invoiced → received → paid. Each step is a different real-world event
     with a different piece of evidence, and asking for that evidence at the
     moment it exists is the only way it gets written down at all. The two that
     concern other people also notify them: the agent is told when the money
     lands, and again when their share goes out. */
  const moveCommission = useCallback(async (d, index, to, detail) => {
    setBusy(true);
    try {
      const lines = [...(Array.isArray(d.commissionLines) ? d.commissionLines : migrateCommission(d))];
      lines[index] = applyState(lines[index], to,
        { id: uid, name: userName || firebaseUser?.email || "" }, detail || "");

      await setDoc(doc(db, "deals", d.id),
        { commissionLines: lines, updatedAt: new Date().toISOString() }, { merge: true });
      setSelected(s => s?.id === d.id ? { ...s, commissionLines: lines } : s);

      if (to === "received" || to === "paid") {
        try {
          const roster = (teamMembers || []).map(m => ({
            id: m.uid || m.id, name: m.name || m.email,
            department: m.department || (m.orgRole === "owner" || m.orgRole === "director" ? "management" : "sales"),
            seniority: m.seniority, managerId: m.managerId,
          }));
          const c = computeCommission(lines[index]);
          const notes = notificationsFor(
            to === "received" ? "commission_received" : "commission_paid",
            { dealId: d.id, dealName: d.client || d.leadName || "A deal",
              agentId: d.agentId, agentName: d.agentName || "the agent",
              amount: fmt(c.gross), agentShare: fmt(c.agentShare), byId: uid },
            roster);
          await Promise.all(notes.map(n =>
            addDoc(collection(db, "notifications"), { ...n, orgId: orgId || "" })));
        } catch (e) {
          console.error("[pipeline] commission saved but notifications failed:", e);
        }
      }
      say(to === "paid" ? "Agent marked as paid." : `Marked ${STATES[to].label.toLowerCase()}.`);
    } catch (e) {
      console.error("[pipeline] commission state change failed:", e);
      say("Could not save that. Nothing has changed.", true);
    }
    setBusy(false);
  }, [say, uid, userName, firebaseUser, teamMembers, orgId]);

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

      {/* WHAT THIS IS. One title, the count, and the one action — on one line. */}
      <PageHead
        title={intent?.title || "Deals"}
        count={all.length ? `${open.length} open · ${all.length} on record${blocked.length ? ` · ${blocked.length} blocked` : ""}` : null}
        question={`${scope === "own"
            ? "Your deals."
            : scope === "team"
            ? "Your team's deals, and your own."
            : "Every deal the agency is working."} A deal cannot pass a stage until the paperwork that stage needs is on file — which is how you find out an NOC has expired before the trustee appointment, rather than at it.`}
        action={<>
          <Btn onClick={() => setShowHelp(v => !v)}>{showHelp ? "Hide the guide" : "How this works"}</Btn>
          <Btn variant="primary" onClick={openNew} title="Record a new deal">+ New deal</Btn>
        </>}>

        {showHelp && (
          <div style={{ marginTop: S.lg, display: "grid", gap: S.md,
                        gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))" }}>
            {JOURNEY_KEYS.map(k => {
              const j = JOURNEYS[k];
              return (
                <DsCard key={k} title={j.label} note={j.what}>
                  <ol style={{ margin: 0, paddingLeft: 18, ...TY.small, color: C.text, lineHeight: 1.9 }}>
                    {j.stages.map(s => (
                      <li key={s.key}>
                        {s.label}
                        {(s.requires || []).length > 0 &&
                          <span style={{ color: C.textMuted }}> — needs {s.requires.map(d => DOCUMENTS[d].label).join(" + ")}</span>}
                      </li>
                    ))}
                  </ol>
                </DsCard>
              );
            })}
            <div style={{ gridColumn: "1 / -1" }}>
              <DsCard title="What this tab does not do">
                <p style={{ ...TY.small, color: C.textMuted, margin: 0 }}>
                  It does not file anything with the Land Department, book a trustee appointment, or check
                  that a document you tick is genuine — ticking records that you hold it, nothing more. It
                  does not predict which deals will close. Commission is what you agreed, not money you
                  have, until you mark the line received.
                </p>
              </DsCard>
            </div>
          </div>
        )}
      </PageHead>

      {/* ON YOUR DESK — the list that replaces walking over and asking.
          Every deal in the agency currently waiting on THIS person's
          department, blocked ones first, each with the instruction. */}
      {mine_work.total > 0 && (
        <div style={{ marginBottom: S.lg }}>
        <DsCard title="On your desk" note={mine_work.headline}
          tone={mine_work.blocked ? "critical" : undefined} pad={false}>
          <DataList
            rows={mine_work.items.slice(0, 6)}
            rowKey={x => x.deal.id}
            onRowClick={x => { setJourney(x.deal.journey); setSelected(x.deal); }}
            columns={[
              { key: "state", head: " ", width: 128, phone: "trail",
                cell: x => <Chip tone={x.turn.blocked ? "critical" : "neutral"}>
                  {x.turn.blocked ? "Blocked" : x.turn.stageLabel}</Chip> },
              { key: "deal", head: "Deal", width: 190, phone: "title",
                cell: x => <span style={{ ...TY.smallStrong, color: C.text }}>
                  {x.deal.client || x.deal.leadName || "Untitled deal"}</span> },
              { key: "do", head: "What to do", phone: "sub",
                cell: x => <span style={{ color: x.turn.blocked ? ST.critical.fg : C.textMuted }}>
                  {x.turn.blocked ? x.turn.blockedBy : x.turn.does}</span> },
            ]}/>
        </DsCard>
        </div>
      )}

      {/* WHERE EVERY DEAL IS SITTING — for anyone who sees the whole agency.

          ONE LINE, NOT FIVE CARDS. Five 27px figures in their own bordered
          boxes inside another bordered box cost 170px of the screen to say
          five short facts, and pushed the deals — the thing the tab is for —
          below the fold. A department with nothing blocked has nothing to
          report, so it says its number quietly and gets out of the way. */}
      {scope === "org" && byDept.length > 0 && (
        <div style={{ display: "flex", gap: S.sm, flexWrap: "wrap", alignItems: "center",
                      marginBottom: S.base }}>
          <span style={{ ...TY.label, color: C.textMuted, marginRight: S.xs }}>Waiting on</span>
          {byDept.map(d => (
            <button key={d.department} type="button" className="ds-btn ds-focus"
              title={`${d.total} deal${d.total === 1 ? "" : "s"} with ${d.label}${d.blocked ? `, ${d.blocked} blocked` : ""}`}
              onClick={() => setDeptFilter(f => f === d.department ? null : d.department)}
              style={{ display: "inline-flex", alignItems: "center", gap: S.sm, minHeight: 32,
                       padding: `0 ${S.md}px`, borderRadius: R.control, cursor: "pointer",
                       background: deptFilter === d.department ? C.accentSoft : C.panelSunk,
                       border: `1px solid ${deptFilter === d.department ? C.accentLine
                                          : d.blocked ? ST.critical.line : C.line}`,
                       fontFamily: TY.small.fontFamily, fontSize: 13 }}>
              <span style={{ ...TY.numeric, fontSize: 14, color: C.text }}>{d.total}</span>
              <span style={{ color: C.textMuted }}>{d.label}</span>
              {d.blocked > 0 && (
                <span style={{ ...TY.numeric, fontSize: 12.5, color: ST.critical.fg }}>
                  {d.blocked} blocked
                </span>
              )}
            </button>
          ))}
          {deptFilter && <Btn variant="ghost" onClick={() => setDeptFilter(null)}>Show every department</Btn>}
        </div>
      )}

      {/* DEALS THE OLD PIPELINE COULD NOT DESCRIBE */}
      {needsReview.length > 0 && (
        <div style={{ marginBottom: S.lg }}>
        <DsCard tone="warning"
          title={`${needsReview.length} deal${needsReview.length === 1 ? "" : "s"} need${needsReview.length === 1 ? "s" : ""} the stage confirming`}>
          <p style={{ ...TY.small, color: C.textMuted, margin: 0 }}>
            These were recorded on the old pipeline, which used one set of stages for every kind of
            deal. Their stage does not exist in the journey they belong to, so rather than guess at
            it, open each one and set where the deal actually is.
          </p>
        </DsCard>
        </div>
      )}

      {/* MONEY — the questions one typed number could not answer */}
      <div style={{ display: "flex", gap: S.md, flexWrap: "wrap", marginBottom: S.lg }}>
        <Figure label="Open deals" value={open.length}
                note={`${all.length} on record in total, across all three journeys.`} />
        {/* Sales admin and the listings desk work these deals every day and have
            no business seeing what the agency billed. Money is its own scope. */}
        {moneyScope === "org" && <>
          <Figure label="Not invoiced yet" value={fmt(money.notYetInvoiced)}
                  note="Earned on deals nobody has billed for. Raise the invoices." />
          <Figure label="Invoiced, not paid" value={fmt(money.outstanding)} tone={money.outstanding>0?"warning":undefined} note={money.note} />
          <Figure label="Collected" value={fmt(money.collected)} tone="positive"
                  note={`Of which ${fmt(money.owedToAgents)} is owed out to agents.`} />
        </>}
        {moneyScope === "own" && <Figure label="Owed to you" value={fmt(myMoney.owedToYou)} tone="positive" note={myMoney.note} />}
      </div>

      {/* JOURNEY PICKER — the same segmented control My Leads uses for its
          views, so two screens in the same product stop inventing two ways to
          switch between three things. */}
      <Toolbar>
        <div style={{ display: "flex", gap: 2, background: C.panelSunk,
                      border: `1px solid ${C.line}`, borderRadius: R.control, padding: 3 }}>
          {JOURNEY_KEYS.map(k => {
            const j = JOURNEYS[k], n = all.filter(d => d.journey === k).length, on = journey === k;
            return (
              <button key={k} type="button" title={j.what} onClick={() => { setJourney(k); setSelected(null); setStageFilter(null); }}
                className="ds-btn ds-focus"
                style={{ padding: `0 ${S.base}px`, minHeight: 32, borderRadius: 6, cursor: "pointer",
                         fontFamily: TY.small.fontFamily, fontSize: 13, fontWeight: on ? 700 : 500,
                         border: on ? `1px solid ${C.accentLine}` : "1px solid transparent",
                         background: on ? C.accentSoft : "transparent",
                         color: on ? C.accent : C.textMuted, whiteSpace: "nowrap" }}>
                {j.label} <span style={{ ...TY.numeric, fontSize: 12.5, opacity: .75 }}>{n}</span>
              </button>
            );
          })}
        </div>

        {/* THE FUNNEL, AS A FUNNEL.
            Eleven boxes each with a number and a wrapped label took a whole
            band of the screen to say what a single line says better. Each
            stage is now a segment whose width is its share, so the shape of
            the funnel is the shape you see — and stages holding nothing take
            up nothing rather than eleven equal boxes mostly reading zero. */}
        {mine.length > 0 && (
          <div style={{ display: "flex", flex: "1 1 320px", minWidth: 260, gap: 2,
                        alignItems: "stretch", height: 34 }}>
            {J.stages.map(s => {
              const n = mine.filter(d => d.stage === s.key).length;
              if (!n) return null;
              /* A segment holding one deal out of thirty-five is 12px wide, and
                 a label in 12px of space is three characters and an ellipsis —
                 which reads as damage rather than as data. Below a tenth of the
                 journey a segment shows its number only, and the name stays in
                 the tooltip where it is still readable. */
              const showLabel = n / mine.length >= 0.1;
              return (
                <button key={s.key} type="button" title={`${n} at ${s.label}. ${s.what}`}
                  onClick={() => setStageFilter(f => f === s.key ? null : s.key)}
                  className="ds-btn ds-focus"
                  style={{ flex: `${n} 1 0`, minWidth: 34, borderRadius: 6, cursor: "pointer",
                           display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                           border: `1px solid ${stageFilter === s.key ? C.accentLine : C.line}`,
                           background: stageFilter === s.key ? C.accentSoft : C.panelSunk,
                           color: stageFilter === s.key ? C.accent : C.text,
                           overflow: "hidden", whiteSpace: "nowrap",
                           fontFamily: TY.small.fontFamily, fontSize: 12.5, fontWeight: 600 }}>
                  <span style={{ ...TY.numeric, fontSize: 13 }}>{n}</span>
                  {showLabel && (
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis",
                                   color: stageFilter === s.key ? C.accent : C.textMuted }}>{s.label}</span>
                  )}
                </button>
              );
            })}
          </div>
        )}
        {stageFilter && <Btn variant="ghost" onClick={() => setStageFilter(null)}>Show every stage</Btn>}
      </Toolbar>

      {/* THE DEALS */}
      <div style={{ display: "grid", gap: S.base, alignItems: "start",
                   gridTemplateColumns: (selected && !phone) ? "minmax(0,1fr) 420px" : "minmax(0,1fr)" }}>
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
          ) : (
            /* A CARD PER DEAL WAS A CARD TOO MANY.
               Each one carried the client, the property, the price, an
               eleven-segment progress bar, whose desk it is, the stage and the
               blocker — 145px tall, so five deals filled the screen out of
               sixty-nine. None of it lined up, so you could not run an eye
               down "which are blocked" or "which are worth the most".

               The progress bar went with it: eleven 3px segments said where a
               deal is less precisely than the stage name beside them, and it
               was the only thing on the row that could not be read. */
            <DataList
              rows={shown}
              rowKey={d => d.id}
              onRowClick={d => setSelected(selected?.id === d.id ? null : d)}
              stack={Boolean(selected) && !phone}
              maxHeightOffset={360}
              columns={[
                { key: "client", head: "Client", width: 176, phone: "title",
                  cell: d => {
                    const turn = whoseTurn(d, Date.now(), gateOpts);
                    return (
                      <span style={{ display: "flex", alignItems: "center", gap: S.sm, minWidth: 0 }}>
                        {!turn.done && <Dot tone={turn.blocked ? "critical" : "neutral"}/>}
                        <span style={{ ...TY.smallStrong, color: C.text, overflow: "hidden",
                                       textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {d.client || d.leadName || "Untitled deal"}
                        </span>
                      </span>
                    );
                  }},
                { key: "property", head: "Property", width: 190, phone: "sub",
                  cell: d => <span style={{ color: d.property || d.project ? C.textMuted : C.textFaint }}>
                    {d.property || d.project || "No property recorded"}</span> },
                { key: "stage", head: "Stage", width: 148, phone: "trail",
                  cell: d => <Chip tone={d.needsReview ? "warning" : "neutral"} title={currentStage(d).what}>
                    {currentStage(d).label}</Chip> },
                { key: "next", head: "What is holding it", width: 250, phone: "meta",
                  cell: d => {
                    const gate = canAdvance(d, gateOpts);
                    const tone = d.needsReview ? "warning" : gate.ok ? null : "critical";
                    const text = d.needsReview ? "Stage needs confirming."
                      : gate.ok ? (isComplete(d) ? "Done." : `Next: ${nextStage(d).label}`)
                      : gate.reason;
                    /* A blocker sentence is longer than its column, so the full
                       one is on hover as well as in the panel. Truncating the
                       one thing somebody needs to act on without offering it
                       anywhere is how a row becomes decoration. */
                    return <span title={text} style={{ color: tone ? ST[tone].fg : C.textMuted }}>{text}</span>;
                  }},
                { key: "desk", head: "Whose desk", width: 134, phone: "meta",
                  cell: d => { const turn = whoseTurn(d, Date.now(), gateOpts);
                    return turn.done
                      ? <span style={{ color: C.textFaint }}>Finished</span>
                      : <span title={turn.does} style={{ color: C.text }}>{turn.departmentLabel}</span>; }},
                { key: "price", head: "Price", width: 108, align: "right", phone: "meta",
                  cell: d => <span style={{ ...TY.numeric, fontSize: 13, color: C.text }}>
                    {d.price ? fmt(d.price) : "—"}</span> },
                { key: "comm", head: "Commission", width: 116, align: "right", wide: true, phone: "meta",
                  cell: d => { const t = dealTotals(Array.isArray(d.commissionLines) ? d.commissionLines : migrateCommission(d));
                    return <span style={{ ...TY.numeric, fontSize: 13, color: t.gross > 0 ? C.textMuted : C.textFaint }}>
                      {t.gross > 0 ? fmt(t.gross) : "—"}</span>; }},
              ].filter(c => (!selected || phone || ["client", "stage"].includes(c.key))
                         && (!c.wide || width >= 1500) && (moneyScope === "org" || c.key !== "comm"))}
            />
          )}
        </div>

        {selected && (
          <DealPanel deal={selected} busy={busy} canDelete={seesAll}
            onClose={() => setSelected(null)}
            onAdvance={note => advance(selected, note)}
            onSetStage={s => setStage(selected, s)}
            onDoc={(k, v) => markDocument(selected, k, v)}
            onAttach={(k, rec) => attachDocument(selected, k, rec)}
            orgId={orgId} userName={userName} firebaseUser={firebaseUser}
            canMoveMoney={moneyScope === "org"} strict={strict}
            onMoney={(i, to, detail) => moveCommission(selected, i, to, detail)}
            onDelete={() => remove(selected)} />
        )}
      </div>

      /* MOVED BELOW THE LIST. This is a summary of the same deals the grid
         above now shows, and the grid carries a "What is holding it" column of
         its own — so as the first thing on the screen it pushed the deals off
         the fold to repeat what they were about to say. It earns its place
         underneath, where it condenses all three journeys rather than the one
         being looked at. */

      {/* WHAT IS HOLDING DEALS UP

          A summary that lists everything it summarises is not a summary. With
          a single deal on the books, this panel printed the same sentence the
          deal card below it already prints, and the department strip above
          prints a third time — an agent reads three lines and looks for three
          problems. The blocked list therefore appears once there is more than
          one deal to condense; it still spans all three journeys, which the
          list below does not, so it earns its place as soon as it has anything
          to add.

          An expiring or expired document is not summary — it is a deadline,
          and it shows whatever the count. */}
      {(showBlocked || expiring.length > 0) && (
        <div style={{ marginBottom: S.lg }}>
        <DsCard title="What is holding deals up"
          note={blocked.length > 8 ? `The 8 most urgent of ${blocked.length}. The rest are on the list below.` : null}
          pad={false}>
          <DataList
            rows={[
              ...expiring.map(e => ({ k: e.deal.id + e.key, deal: e.deal,
                tone: e.expired ? "critical" : "warning",
                label: e.expired ? "Expired" : "Expiring", why: e.note })),
              ...(showBlocked ? blocked.slice(0, 8).map(({ d, why }) => ({
                k: d.id, deal: d, tone: "critical", label: "Blocked", why: why.reason })) : []),
            ]}
            rowKey={r => r.k}
            onRowClick={r => { setJourney(r.deal.journey); setSelected(r.deal); }}
            columns={[
              { key: "what", head: " ", width: 96, phone: "trail",
                cell: r => <Chip tone={r.tone}>{r.label}</Chip> },
              { key: "deal", head: "Deal", width: 190, phone: "title",
                cell: r => <span style={{ ...TY.smallStrong, color: C.text }}>
                  {r.deal.client || r.deal.leadName || "Untitled deal"}</span> },
              { key: "why", head: "Why", phone: "sub",
                cell: r => <span style={{ color: C.textMuted }}>{r.why}</span> },
            ]}/>
        </DsCard>
        </div>
      )}

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

/* Tone, not a hex. A figure is coloured because it carries a STATE, not
   because a colour would look nice there — see system.js rule 2. */
function Figure({ label, value, note, tone }) {
  return (
    <div style={{ ...surface(), flex: "1 1 190px", minWidth: 170, padding: S.base }}>
      <DsFigure value={value} label={label} note={note} tone={tone} small/>
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
function DealPanel({ deal, onClose, onAdvance, onSetStage, onDoc, onDelete, canDelete, busy,
                    canMoveMoney, onMoney, onAttach, orgId, userName, firebaseUser, strict }) {
  const [moneyRef, setMoneyRef] = useState({});
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [note, setNote] = useState("");
  const turn = whoseTurn(deal, Date.now(), { strict });
  const timeline = dealTimeline(deal);
  const J = journeyOf(deal);
  const gate = canAdvance(deal, { strict });
  const req  = requiredDocuments(deal);
  const cond = conditionalDocuments(deal);
  const exp  = expiringDocuments(deal);
  /* What the row shows has to be what the gate enforces. Showing a row green
     while the gate refuses to move the deal is the kind of disagreement people
     stop trusting a product over. */
  const held = k => strict
    ? isOnFile(deal?.documents?.[k])
    : Boolean(deal?.documents?.[k]?.receivedAt);
  const lines = Array.isArray(deal.commissionLines) ? deal.commissionLines : migrateCommission(deal);
  const total = dealTotals(lines);

  /* ATTACHING THE ACTUAL PAPER.
     The tick beside this says somebody asserts the document exists. This puts
     the document there. Both are kept: an agency mid-migration has years of
     ticks with no files, and blocking all of them overnight is not a migration
     it is an outage. What changes is that the file is now possible, visible,
     and countable — see documents.js for the coverage figure that tells an
     owner when it is safe to require them. */
  const Attach = ({ k, doc }) => {
    const filed = isOnFile(doc);
    const inputRef = React.useRef(null);
    const [busy, setBusy] = React.useState(false);
    const [err, setErr] = React.useState("");

    const choose = async (e) => {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (!file) return;
      const check = checkFile(file);
      if (!check.ok) { setErr(check.reason); return; }
      setErr(""); setBusy(true);
      try {
        const path = documentPath(deal.orgId || orgId, deal.id, k, file.name);
        const { backend } = await putFile(path, file);
        await onAttach(k, documentRecord({ file, path, backend, by: userName || firebaseUser?.email }));
      } catch (e2) {
        console.error("[pipeline] attach failed", e2);
        setErr("That did not save. Try again, or a smaller file.");
      }
      setBusy(false);
    };

    const open = async () => {
      try {
        const url = await fileUrl(doc.file.path);
        if (url) window.open(url, "_blank", "noopener");
        else setErr("The file is not in this browser. It was attached before storage was connected.");
      } catch { setErr("Could not open that file."); }
    };

    return (
      <div style={{ marginTop: 3 }}>
        <input ref={inputRef} type="file" accept={ACCEPT_ATTR} onChange={choose} style={{ display: "none" }}/>
        {filed ? (
          <div style={{ display: "flex", gap: 7, alignItems: "baseline", flexWrap: "wrap" }}>
            <button type="button" onClick={open}
              style={{ background: "none", border: "none", padding: 0, cursor: "pointer",
                       color: T.gold, fontSize: 10.5, textDecoration: "underline" }}>
              {doc.file.name}
            </button>
            <span style={{ fontSize: 9.5, color: T.textMuted }}>
              {humanSize(doc.file.size)} · {doc.by || "someone"} · {new Date(doc.file.uploadedAt || doc.receivedAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
            </span>
            <button type="button" onClick={() => inputRef.current?.click()} disabled={busy}
              style={{ background: "none", border: "none", padding: 0, cursor: "pointer",
                       color: T.textMuted, fontSize: 9.5 }}>replace</button>
          </div>
        ) : (
          <button type="button" onClick={() => inputRef.current?.click()} disabled={busy}
            style={{ padding: "2px 8px", borderRadius: 5, cursor: "pointer",
                     border: `1px solid ${T.border}`, background: "transparent",
                     color: T.textMuted, fontSize: 9.5, fontFamily: "'Outfit',sans-serif" }}>
            {busy ? "attaching…" : "attach the file"}
          </button>
        )}
        {err && <div style={{ fontSize: 9.5, color: "#FCA5A5", marginTop: 3, lineHeight: 1.5 }}>{err}</div>}
      </div>
    );
  };

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
                    <Attach k={d.key} doc={(deal.documents || {})[d.key]} />
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
                        <Attach k={d.key} doc={(deal.documents || {})[d.key]} />
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

                  {/* THE QUEUE ACCOUNTS ACTUALLY WORKS.
                      The four states were modelled and shown from the start, and
                      nothing let anybody click them — so the tab told Accounts
                      "what can be invoiced, what is outstanding, who is owed a
                      payout" and gave them no way to answer it. */}
                  {canMoveMoney && (() => {
                    const step = nextStep(l);
                    /* The audit trail is rendered whether the line is open or
                       closed. An earlier version returned early once it was
                       paid, so the record of who invoiced it and when the money
                       landed disappeared at exactly the moment somebody would
                       want to check it. */
                    const history = (l.history || []).length > 0 && (
                      <div style={{ marginTop: 6 }}>
                        {l.history.map((h, k) => (
                          <div key={k} style={{ fontSize: 9.5, lineHeight: 1.5,
                                                color: h.correction ? "#F59E0B" : T.textMuted }}>
                            {h.correction ? "Corrected back to " : "Moved to "}{STATES[h.to]?.label || h.to}
                            {h.by ? ` by ${h.by}` : ""}
                            {h.detail ? ` — ${h.detail}` : ""}
                            {" · "}{new Date(h.at).toLocaleDateString("en-AE", { day: "2-digit", month: "short" })}
                          </div>
                        ))}
                      </div>
                    );

                    if (step.done) {
                      return (
                        <div style={{ marginTop: 7, paddingTop: 7, borderTop: `1px solid ${T.border}` }}>
                          <div style={{ fontSize: 10, color: "#10B981" }}>{step.note}</div>
                          {history}
                        </div>
                      );
                    }
                    return (
                      <div style={{ marginTop: 7, paddingTop: 7, borderTop: `1px solid ${T.border}` }}>
                        <div style={{ fontSize: 10, color: T.textMuted, lineHeight: 1.55, marginBottom: 5 }}>{step.why}</div>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                          <input value={moneyRef[i] || ""} onChange={e => setMoneyRef(m => ({ ...m, [i]: e.target.value }))}
                            placeholder={step.asks}
                            style={{ flex: "1 1 130px", minWidth: 110, padding: "5px 8px",
                                     background: "rgba(255,255,255,0.04)", border: `1px solid ${T.border}`,
                                     borderRadius: 6, color: T.white, fontSize: 10.5, outline: "none",
                                     fontFamily: "'Outfit',sans-serif" }} />
                          <button type="button" disabled={busy}
                            onClick={() => { onMoney(i, step.to, moneyRef[i] || ""); setMoneyRef(m => ({ ...m, [i]: "" })); }}
                            title={step.why}
                            style={{ padding: "5px 12px", borderRadius: 6, border: "none", cursor: "pointer",
                                     background: STATES[step.to].colour, color: "#0A0E1A",
                                     fontSize: 10.5, fontWeight: 700, fontFamily: "'Outfit',sans-serif",
                                     whiteSpace: "nowrap" }}>
                            {step.action}
                          </button>
                        </div>
                        {history}
                      </div>
                    );
                  })()}
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
