/* eslint-disable */
/* AGENCY TAB — Agency profile, team, RERA card, commission splits */

import React from "react";
/* These were used and never imported. Every write in this file threw
   ReferenceError: saving the agency profile, saving commission splits,
   changing an agent's role and removing an agent from the organisation. The
   tab was read-only by accident and nothing said so — the identical fault
   that made the Pipeline tab unable to save anything. */
import { doc, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import { viewerFrom, canSeePay } from "../crm/model/org";
import { evidenceCoverage } from "../crm/model/documents";
import { requiredDocuments } from "../crm/model/journeys";
import { T } from "../data";
import { SvgIcons } from "../components/Icons";
import { cleanPhone } from "../utils/helpers";

import TabIntro from "../components/TabIntro";
import TabProvenance from "../components/TabProvenance";
import { tabCopy } from "../data/tabCopy";
/**
 * FOUND YOUR AGENCY — the step from a personal account to a brokerage.
 *
 * Creates the organisation, then attaches the current user to it as its owner.
 * That second write touches orgId, orgRole, department and seniority, which are
 * privileged fields frozen for the record's owner precisely so nobody can
 * promote themselves. The rule in firestore.rules opens exactly one path
 * through that freeze: you must currently belong to no agency, the organisation
 * must already name you as its ownerId, and only those four fields may move.
 * So this cannot be used to join somebody else's agency or to climb inside your
 * own — which is why the organisation is written FIRST and the user second.
 */
function FoundYourAgency({ firebaseUser }) {
  const [form, setForm] = React.useState({ name:"", reraNo:"", tradeLicense:"", phone:"" });
  const [busy, setBusy]   = React.useState(false);
  const [error, setError] = React.useState("");
  const [done, setDone]   = React.useState(false);

  const field = { width:"100%", padding:"10px 13px", background:"rgba(255,255,255,0.04)",
                  border:`1px solid ${T.border}`, borderRadius:9, color:T.textPrimary,
                  fontSize:13, fontFamily:"'Outfit',sans-serif", outline:"none", boxSizing:"border-box" };

  const create = async () => {
    /* The same licensing check the agency signup makes. Brokerage in Dubai is
       licensed: one of an ORN/RERA number or a trade licence, not both, because
       a new brokerage often holds the licence before the ORN comes through. */
    if (!form.name.trim())  { setError("Your agency needs a name"); return; }
    if (!form.reraNo.trim() && !form.tradeLicense.trim()) {
      setError("Enter your RERA/ORN number or your trade licence — at least one is required"); return;
    }
    if (!form.phone.trim()) { setError("A contact phone number is required"); return; }
    const uid = firebaseUser?.uid;
    if (!uid) { setError("You appear to be signed out. Reload and try again."); return; }

    setBusy(true); setError("");
    try {
      const orgId = "org_" + form.name.toLowerCase().replace(/[^a-z0-9]/g,"_").slice(0,20)
                  + "_" + Date.now().toString(36);
      const now = new Date().toISOString();

      await setDoc(doc(db, "organisations", orgId), {
        orgId,
        name:         form.name.trim(),
        reraNo:       form.reraNo.trim()       || null,
        tradeLicense: form.tradeLicense.trim() || null,
        phone:        form.phone.trim()        || null,
        city:         "Dubai",
        ownerEmail:   firebaseUser?.email || null,
        /* The security rule reads this field, so it is not optional. */
        ownerId:      uid,
        seatsUsed:    1,
        agentCount:   0,
        createdAt:    now,
        createdVia:   "converted_from_individual",
      });

      await setDoc(doc(db, "users", uid), {
        orgId, orgRole:"owner", department:"management", seniority:"owner", updatedAt: now,
      }, { merge: true });

      setDone(true);
      setTimeout(() => window.location.reload(), 1600);
    } catch (e) {
      console.error(e);
      setError("Could not create the agency: " + (e?.message || "unknown error"));
    }
    setBusy(false);
  };

  if (done) return (
    <div style={{ padding:"70px 20px", textAlign:"center" }}>
      <div style={{ fontSize:17, fontWeight:700, color:T.green, marginBottom:8, fontFamily:"'Fraunces',serif" }}>
        {form.name.trim()} is registered
      </div>
      <div style={{ fontSize:12.5, color:T.textMuted }}>
        You are its owner. Reloading so your agency appears…
      </div>
    </div>
  );

  return (
    <div style={{ maxWidth:520, margin:"36px auto", padding:"0 16px" }}>
      <h1 style={{ fontFamily:"'Fraunces',serif", fontSize:21, fontWeight:900, color:T.white, margin:0 }}>
        Register your agency
      </h1>
      <p style={{ fontSize:12.5, color:T.textSecondary, lineHeight:1.7, margin:"10px 0 20px" }}>
        Your account is set up for one person. Registering an agency lets you add
        your team, give each of them a department and a role, and see everybody's
        leads, deals and commission in one place. You keep this account and
        everything already in it — you become the agency's owner.
      </p>

      <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
        {[["name","Agency name","Better Homes Dubai", true],
          ["reraNo","RERA / ORN number","BRN-XXXXX", false],
          ["tradeLicense","Trade licence number","DED-XXXXXXX", false],
          ["phone","Office phone","+971 4 XXX XXXX", true]].map(([k,label,ph,req]) => (
          <label key={k} style={{ display:"block" }}>
            <span style={{ fontSize:10.5, fontWeight:700, color:T.textMuted, letterSpacing:0.5,
                           textTransform:"uppercase", display:"block", marginBottom:5 }}>
              {label}{req ? " *" : ""}
            </span>
            <input value={form[k]} placeholder={ph} style={field}
              onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))}/>
          </label>
        ))}
        <div style={{ fontSize:10.5, color:T.textMuted, lineHeight:1.6, marginTop:-4 }}>
          One of the RERA/ORN number or the trade licence is enough — a new
          brokerage often holds the licence before the ORN comes through.
        </div>

        {error && (
          <div style={{ fontSize:11.5, color:"#FCA5A5", padding:"9px 12px", lineHeight:1.6,
                        background:"rgba(239,68,68,0.07)", border:"1px solid rgba(239,68,68,0.22)",
                        borderRadius:8 }}>{error}</div>
        )}

        <button type="button" onClick={create} disabled={busy}
          style={{ padding:"11px", borderRadius:9, border:"none", marginTop:2,
                   background: busy ? "rgba(212,168,67,0.3)" : "linear-gradient(135deg,#D4A843,#B8902E)",
                   color:"#0A0E1A", fontSize:13, fontWeight:700,
                   cursor: busy ? "wait" : "pointer", fontFamily:"'Outfit',sans-serif" }}>
          {busy ? "Registering…" : "Register the agency"}
        </button>
      </div>
    </div>
  );
}

function AgencyTab({
  orgId, orgRole, orgProfile, firebaseUser,
  orgProfileForm, setOrgProfileForm,
  orgProfileSaving, setOrgProfileSaving,
  orgProfileSaved, setOrgProfileSaved,
  reraCard,
  teamMembers, deals, myLeads,
  showInviteAgent, setShowInviteAgent,
  inviteEmail, setInviteEmail,
  inviteLoading, setInviteLoading,
  inviteSent, setInviteSent,
  agentRoleChanging, setAgentRoleChanging,
  commSplits, setCommSplits,
  commSaving, setCommSaving,
}) {
  const _copy = tabCopy("Agency");
  const [strictSaving, setStrictSaving] = React.useState(false);


            /* An agency OWNER is not the string "manager". These gates predate
               owners existing: signup used to record the founder as a manager, so
               comparing to that one word happened to work. Now that the founder is
               written as an owner — which is what they are — the literal check
               locked them out of their own agency. */
            const isManager = orgRole === "owner" || orgRole === "director" || orgRole === "manager";

            /* canSeePay is the model's answer to who may look at what people
               earn — HR, finance and management. A sales manager runs a team;
               they do not set the agency's commission structure. */
            const _mine = (teamMembers || []).find(m => (m.uid || m.id) === firebaseUser?.uid);
            const maySeeSplits = canSeePay(viewerFrom({
              firebaseUser, orgRole,
              department: _mine?.department, seniority: _mine?.seniority }));
            const rowCols = maySeeSplits
              ? "minmax(120px,1fr) 90px 110px 110px 110px 75px 36px"
              : "minmax(120px,1fr) 90px 110px 110px 75px 36px";

            /* SOMEBODY WITH NO AGENCY IS NOT SOMEBODY WITHOUT PERMISSION.
               An individual who signed up through the landing page has no orgId,
               so they fell into the "Manager access only" message below and
               stopped there. There was no way in the product to create an
               agency afterwards, and Firebase will not let them re-register the
               same email, so their only route was to abandon the account.

               It is also the natural way this business grows: a solo agent takes
               on two people and becomes an agency. That is the step from AED 300
               to AED 500, and it used to be a dead end. */
            if (!orgId) return <FoundYourAgency firebaseUser={firebaseUser} />;

            if (!isManager) return (
              <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"80px 20px", textAlign:"center" }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={T.textMuted} strokeWidth="1.5" strokeLinecap="round" style={{ marginBottom:16 }}><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
                <div style={{ fontSize:16, fontWeight:700, color:T.textPrimary, marginBottom:6 }}>Manager access only</div>
                <div style={{ fontSize:12, color:T.textMuted }}>This section is for agency managers only</div>
              </div>
            );

            // Save org profile
            const saveOrgProfile = async () => {
              if (!orgId || !orgProfileForm.name.trim()) return;
              setOrgProfileSaving(true);
              try {
                await setDoc(doc(db, "organisations", orgId), {
                  name:         orgProfileForm.name.trim(),
                  reraNo:       orgProfileForm.reraNo.trim()       || null,
                  tradeLicense: orgProfileForm.tradeLicense.trim() || null,
                  phone:        orgProfileForm.phone.trim()        || null,
                  ownerEmail:   orgProfileForm.email.trim()        || null,
                  website:      orgProfileForm.website.trim()      || null,
                  notes:        orgProfileForm.notes.trim()        || null,
                  updatedAt:    new Date().toISOString(),
                }, { merge: true });
                setOrgProfileSaved(true);
                setTimeout(() => setOrgProfileSaved(false), 2500);
              } catch(e) { console.error(e); }
              setOrgProfileSaving(false);
            };

            /* ── REQUIRE THE DOCUMENT, NOT JUST THE TICK ─────────────────────
               A stage gate that only asks "did somebody tick this?" is not a
               gate. Turning this on makes the file itself the thing that opens
               the gate. It is off until the agency turns it on, because an
               agency arriving with years of ticked rows and no files is
               mid-migration, and refusing to move any of their deals on the
               morning they switch over is an outage rather than a control.
               The figure beside the switch is what makes the decision safe:
               how much of what the product currently calls "received" has a
               file behind it. */
            /* requiredDocuments returns the document DEFINITIONS, not their
               keys — passing them straight through looked up deal.documents by
               object and found nothing, so this read a confident 0% on an
               agency with hundreds of ticked documents. Only the gating
               documents are counted: conditional ones never block a stage, so
               a missing file behind one changes nothing about this decision. */
            const coverage = evidenceCoverage(deals || [], d => requiredDocuments(d).map(x => x.key));
            const strictOn = Boolean(orgProfile?.requireDocumentFiles);
            /* Every manager should see the figure — it is their teams' paperwork.
               Flipping it stops deals across the whole agency, which is the
               owner's call, not one sales manager's. */
            const maySetStrict = orgRole === "owner" || orgRole === "director";
            const setStrict = async (on) => {
              if (!orgId) return;
              setStrictSaving(true);
              try {
                await setDoc(doc(db, "organisations", orgId),
                  { requireDocumentFiles: on, updatedAt: new Date().toISOString() },
                  { merge: true });
              } catch (e) { console.error("[agency] could not save the document rule:", e); }
              setStrictSaving(false);
            };

            // Save commission split for an agent
            const saveCommSplit = async (agentUid, pct) => {
              if (!orgId) return;
              setCommSaving(s => ({...s, [agentUid]: true}));
              try {
                const updated = { ...commSplits, [agentUid]: parseFloat(pct)||50 };
                /* One document per agent rather than a map on the organisation.
                   As a map, anybody who could read the organisation record could
                   read what every colleague earns, because Firestore rules
                   cannot restrict a single field. Per-document, a manager reads
                   the agency's and an agent reads only their own. */
                await setDoc(doc(db, "organisations", orgId, "commissionSplits", agentUid),
                  { pct: parseFloat(pct) || 50, agentUid,
                    updatedAt: new Date().toISOString() }, { merge: true });
                setCommSplits(updated);
              } catch(e) { console.error(e); }
              setCommSaving(s => ({...s, [agentUid]: false}));
            };

            // Change agent role
            const changeAgentRole = async (agentUid, newRole) => {
              setAgentRoleChanging(s => ({...s, [agentUid]: true}));
              try {
                await setDoc(doc(db, "users", agentUid), { orgRole: newRole, updatedAt: new Date().toISOString() }, { merge: true });
              } catch(e) { console.error(e); }
              setAgentRoleChanging(s => ({...s, [agentUid]: false}));
            };

            // Remove agent from org
            const removeAgent = async (agentUid) => {
              if (!window.confirm("Remove this agent from the organisation?")) return;
              try {
                await setDoc(doc(db, "users", agentUid), { orgId: null, orgRole: null, updatedAt: new Date().toISOString() }, { merge: true });
              } catch(e) { console.error(e); }
            };

            // RERA helpers
            const reraStatus = (expiry) => {
              if (!expiry) return { label:"Not set", color:T.textMuted };
              const days = Math.ceil((new Date(expiry) - new Date()) / (1000*60*60*24));
              if (days <= 0)  return { label:"Expired",    color:T.red };
              if (days <= 30) return { label:`${days}d`,   color:"#F97316" };
              if (days <= 60) return { label:`${days}d`,   color:"#F59E0B" };
              return { label:"Valid",       color:T.green };
            };

            /* Everyone in the agency, not only the two job titles this happened
               to list. An owner or a director is a person on the roster and
               commonly holds a broker card of their own, so excluding them hid
               the founder from their own agency's people — and hid whether
               their BRN was about to expire. */
            const agents = teamMembers.filter(u =>
              ["agent", "manager", "director", "owner"].includes(u.orgRole));
            const plan = orgProfile?.plan || "free";
            const planColors = { free:T.textMuted, pro:T.teal, enterprise:"#8B5CF6" };

            return (<>

            {_copy && <TabIntro title={_copy.title} what={_copy.what} detail={_copy.detail} includes={_copy.includes} excludes={_copy.excludes} warning={_copy.warning}/>}


              {/* ── Header ── */}
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20, flexWrap:"wrap", gap:12 }}>
                <div>
                  <h1 style={{ fontFamily:"'Fraunces',serif", fontSize:22, fontWeight:900, color:T.white, margin:0 }}>Agency Hub</h1>
                  <p style={{ fontSize:12, color:T.textMuted, margin:"4px 0 0" }}>
                    {orgProfile?.name || "Your Organisation"} ·&nbsp;
                    <span style={{ color:planColors[plan]||T.textMuted, fontWeight:600, textTransform:"capitalize" }}>{plan} plan</span>
                    &nbsp;· {agents.length} members
                  </p>
                </div>
              </div>

              {/* ── Top row: Profile + Stats ── */}
              <div style={{ display:"grid", gridTemplateColumns:"minmax(0,1fr) min(320px,36%)", gap:16, marginBottom:16, alignItems:"start" }}>

                {/* Agency Profile Editor */}
                <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:14, overflow:"hidden" }}>
                  <div style={{ padding:"14px 18px", borderBottom:`1px solid ${T.border}`, display:"flex", alignItems:"center", gap:10 }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={T.gold} strokeWidth="2" strokeLinecap="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
                    <div style={{ fontSize:13, fontWeight:700, color:T.white }}>Agency Profile</div>
                    {orgProfile?.status && (
                      <span style={{ marginLeft:"auto", fontSize:9, fontWeight:700, padding:"2px 8px", borderRadius:10, background:orgProfile.status==="active"?"rgba(16,185,129,0.12)":"rgba(239,68,68,0.12)", color:orgProfile.status==="active"?T.green:T.red, textTransform:"uppercase" }}>
                        {orgProfile.status}
                      </span>
                    )}
                  </div>
                  <div style={{ padding:"18px", display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                    {[
                      { key:"name",         label:"Agency Name *",        placeholder:"Better Homes Dubai"        },
                      { key:"reraNo",       label:"RERA Broker Number",   placeholder:"BRN-XXXXX"                 },
                      { key:"tradeLicense", label:"Trade License",        placeholder:"DED-XXXXXXX"               },
                      { key:"phone",        label:"Phone",                placeholder:"+971 4 XXX XXXX"           },
                      { key:"email",        label:"Contact Email",        placeholder:"info@agency.ae"            },
                      { key:"website",      label:"Website",              placeholder:"www.agency.ae"             },
                    ].map(({key,label,placeholder}) => (
                      <div key={key}>
                        <div style={{ fontSize:10, fontWeight:600, color:T.textMuted, marginBottom:5, letterSpacing:0.3 }}>{label}</div>
                        <input value={orgProfileForm[key]||""} onChange={e=>setOrgProfileForm(f=>({...f,[key]:e.target.value}))}
                          placeholder={placeholder}
                          style={{ width:"100%", padding:"9px 12px", background:T.bg, border:`1px solid rgba(212,168,67,0.15)`, borderRadius:8, color:T.textPrimary, fontSize:12, fontFamily:"'Outfit',sans-serif", outline:"none", boxSizing:"border-box" }}/>
                      </div>
                    ))}
                    <div style={{ gridColumn:"1/-1" }}>
                      <div style={{ fontSize:10, fontWeight:600, color:T.textMuted, marginBottom:5 }}>Notes</div>
                      <textarea value={orgProfileForm.notes||""} onChange={e=>setOrgProfileForm(f=>({...f,notes:e.target.value}))} rows={2}
                        placeholder="Internal notes about this agency..."
                        style={{ width:"100%", padding:"9px 12px", background:T.bg, border:`1px solid rgba(212,168,67,0.15)`, borderRadius:8, color:T.textPrimary, fontSize:12, fontFamily:"'Outfit',sans-serif", outline:"none", resize:"vertical", boxSizing:"border-box" }}/>
                    </div>
                  </div>
                  <div style={{ padding:"0 18px 18px", display:"flex", justifyContent:"flex-end" }}>
                    <button type="button" onClick={saveOrgProfile} disabled={orgProfileSaving||!orgProfileForm.name}
                      style={{ display:"flex", alignItems:"center", gap:8, padding:"9px 20px", borderRadius:8, border:`1px solid ${T.gold}`, background:"rgba(212,168,67,0.1)", color:T.gold, fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"'Outfit',sans-serif", opacity:(orgProfileSaving||!orgProfileForm.name)?0.5:1 }}>
                      {orgProfileSaved ? (
                        <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>Saved</>
                      ) : orgProfileSaving ? "Saving..." : (
                        <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>Save Profile</>
                      )}
                    </button>
                  </div>
                </div>

                {/* Org stats panel */}
                <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                  {[
                    { label:"Total Agents",     value:agents.filter(u=>u.orgRole==="agent").length,            color:T.gold    },
                    { label:"Total Leads",      value:myLeads.length,                                          color:T.teal    },
                    { label:"Open Deals",       value:deals.filter(d=>d.stage!=="Completed").length,           color:"#8B5CF6" },
                    { label:"Commission Earned",value:`AED ${Math.round(deals.filter(d=>d.stage==="Completed").reduce((a,d)=>a+(parseFloat(d.commission)||0),0)).toLocaleString()}`, color:"#10B981" },
                  ].map((s,i) => (
                    <div key={i} style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:10, padding:"12px 16px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                      <div style={{ fontSize:11, color:T.textMuted }}>{s.label}</div>
                      <div style={{ fontSize:16, fontWeight:900, color:s.color, fontFamily:"'Fraunces',serif" }}>{s.value}</div>
                    </div>
                  ))}
                  {/* RERA Summary */}
                  <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:10, padding:"12px 16px" }}>
                    <div style={{ fontSize:11, fontWeight:700, color:T.white, marginBottom:8 }}>Team RERA Status</div>
                    {[
                      { label:"Valid",      count:agents.filter(u=>{const s=reraStatus(u.reraCard?.expiry); return s.color===T.green;}).length,    color:T.green    },
                      { label:"Expiring",   count:agents.filter(u=>{const s=reraStatus(u.reraCard?.expiry); return s.color==="amber"||s.color==="#F59E0B"||s.color==="#F97316";}).length, color:"#F59E0B" },
                      { label:"Expired",    count:agents.filter(u=>{const s=reraStatus(u.reraCard?.expiry); return s.color===T.red;}).length,       color:T.red      },
                      { label:"Not set",    count:agents.filter(u=>!u.reraCard?.expiry).length,                                                      color:T.textMuted },
                    ].map(({label,count,color},i) => (
                      <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"5px 0", borderBottom:i<3?`1px solid ${T.border}`:"none" }}>
                        <span style={{ fontSize:11, color }}>{label}</span>
                        <span style={{ fontSize:13, fontWeight:700, color }}>{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* ── PAPERWORK RULE ── */}
              <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:14, overflow:"hidden" }}>
                <div style={{ padding:"14px 18px", borderBottom:`1px solid ${T.border}`, display:"flex", alignItems:"center", gap:10 }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={T.gold} strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                  <div style={{ fontSize:13, fontWeight:700, color:T.white }}>Paperwork rule</div>
                </div>
                <div style={{ padding:"16px 18px", display:"grid", gap:18, gridTemplateColumns:"minmax(0,1fr) 210px", alignItems:"start" }}>
                  <div>
                    <div style={{ fontSize:12.5, color:T.textSecondary, lineHeight:1.75 }}>
                      A deal cannot pass a stage until that stage's paperwork is
                      on file. Today "on file" means somebody ticked it. Turn
                      this on and it means the document itself is attached —
                      which is the difference between finding out an NOC expired
                      before the trustee appointment rather than at it.
                    </div>
                    <div style={{ marginTop:12, display:"flex", alignItems:"center", gap:12, flexWrap:"wrap" }}>
                      <button type="button" onClick={() => maySetStrict && setStrict(!strictOn)}
                        disabled={strictSaving || !maySetStrict}
                        title={maySetStrict ? "" : "Only the agency owner or a director can change this"}
                        style={{ position:"relative", width:44, height:24, borderRadius:12, flexShrink:0,
                                 border:`1px solid ${strictOn ? T.gold : T.border}`,
                                 background: strictOn ? "rgba(212,168,67,0.25)" : "rgba(255,255,255,0.04)",
                                 opacity: maySetStrict ? 1 : 0.45,
                                 cursor: !maySetStrict ? "not-allowed" : strictSaving ? "wait" : "pointer", padding:0 }}>
                        <span style={{ position:"absolute", top:2, left: strictOn ? 22 : 2, width:18, height:18,
                                       borderRadius:"50%", background: strictOn ? T.gold : T.textMuted,
                                       transition:"left .15s" }}/>
                      </button>
                      <div style={{ fontSize:12, fontWeight:700, color: strictOn ? T.gold : T.textMuted }}>
                        {strictOn ? "The file is required" : "A tick is enough"}
                      </div>
                      {!maySetStrict && (
                        <div style={{ fontSize:10.5, color:T.textMuted }}>
                          Set by the agency owner
                        </div>
                      )}
                    </div>
                    {/* The number that makes this a decision rather than a gamble. */}
                    <div style={{ marginTop:12, fontSize:11.5, lineHeight:1.75,
                                  color: coverage.ticked === 0 ? T.textMuted
                                       : coverage.ready ? T.green : "#F59E0B" }}>
                      {coverage.ticked === 0
                        ? "Nothing has been marked received yet, so turning this on would change nothing today."
                        : coverage.ready
                          ? `All ${coverage.filed} documents marked received have a file behind them. Turning this on blocks nothing that is not already blocked.`
                          : `${coverage.unevidenced} of ${coverage.ticked} documents marked received have no file attached. Turn this on and every deal waiting on one of them stops where it is until somebody attaches the paper.`}
                    </div>
                  </div>
                  <div style={{ background:T.bg, border:`1px solid ${T.border}`, borderRadius:10, padding:"14px 16px" }}>
                    <div style={{ fontSize:26, fontWeight:900, fontFamily:"'Fraunces',serif",
                                  color: coverage.ticked === 0 ? T.textMuted : coverage.ready ? T.green : "#F59E0B" }}>
                      {coverage.ticked === 0 ? "—" : `${coverage.pct}%`}
                    </div>
                    <div style={{ fontSize:10.5, color:T.textMuted, lineHeight:1.6, marginTop:4 }}>
                      of received paperwork has the actual document behind it
                    </div>
                    <div style={{ fontSize:10.5, color:T.textMuted, marginTop:8, paddingTop:8, borderTop:`1px solid ${T.border}` }}>
                      {coverage.filed} filed · {coverage.unevidenced} ticked only
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Agent Roster ── */}
              <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:14, overflow:"hidden" }}>
                <div style={{ padding:"14px 18px", borderBottom:`1px solid ${T.border}`, display:"flex", alignItems:"center", gap:10 }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={T.teal} strokeWidth="2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                  <div style={{ fontSize:13, fontWeight:700, color:T.white }}>Agent Roster</div>
                  <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:8 }}>
                    <div style={{ fontSize:10, color:T.textMuted }}>{agents.length} members</div>
                    <button type="button" onClick={()=>{setShowInviteAgent(true);setInviteSent(false);setInviteEmail("");}}
                      style={{ display:"flex", alignItems:"center", gap:5, padding:"5px 12px", borderRadius:6, border:`1px solid ${T.gold}`, background:"rgba(212,168,67,0.08)", color:T.gold, fontSize:10, fontWeight:700, cursor:"pointer" }}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                      Invite Agent
                    </button>
                  </div>
                </div>

                {/* Column headers */}
                <div style={{ display:"grid", gridTemplateColumns:rowCols, minWidth:660, gap:8, padding:"8px 18px", fontSize:9, fontWeight:700, color:T.textMuted, textTransform:"uppercase", letterSpacing:0.8, borderBottom:`1px solid ${T.border}` }}>
                  <div>Agent</div><div>Role</div><div>RERA Card</div><div>Expiry</div>{maySeeSplits && <div>Comm Split</div>}<div>Leads</div><div></div>
                </div>

                {agents.length === 0 ? (
                  <div style={{ padding:"48px 20px", textAlign:"center" }}>
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={T.textMuted} strokeWidth="1.5" strokeLinecap="round" style={{ marginBottom:10 }}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
                    <div style={{ fontSize:13, color:T.textMuted }}>No agents yet — ask your admin to assign agents to this organisation</div>
                  </div>
                ) : agents.map((agent, i) => {
                  const agentLeads   = myLeads.filter(l => l.assignedTo === agent.uid).length;
                  const rStatus      = reraStatus(agent.reraCard?.expiry);
                  const split        = commSplits[agent.uid] ?? 50;
                  const isSaving     = commSaving[agent.uid] || false;
                  const isChanging   = agentRoleChanging[agent.uid] || false;

                  return (
                    <div key={agent.uid} style={{ display:"grid", gridTemplateColumns:rowCols, minWidth:660, gap:8, padding:"13px 18px", alignItems:"center", borderBottom:`1px solid ${T.border}`, background:i%2===0?"transparent":"rgba(255,255,255,0.01)" }}>

                      {/* Agent info */}
                      <div style={{ display:"flex", alignItems:"center", gap:10, minWidth:0 }}>
                        <div style={{ width:32, height:32, borderRadius:"50%", background:"rgba(212,168,67,0.1)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700, color:T.gold, flexShrink:0 }}>
                          {(agent.name||agent.email||"?").slice(0,2).toUpperCase()}
                        </div>
                        <div style={{ minWidth:0 }}>
                          <div style={{ fontSize:12, fontWeight:600, color:T.textPrimary, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{agent.name || agent.email?.split("@")[0] || "Agent"}</div>
                          <div style={{ fontSize:10, color:T.textMuted, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{agent.email||"—"}</div>
                        </div>
                      </div>

                      {/* Role selector */}
                      <div>
                        <select value={agent.orgRole||"agent"} onChange={e=>changeAgentRole(agent.uid, e.target.value)} disabled={isChanging}
                          style={{ width:"100%", padding:"5px 8px", background:T.surfaceAlt, border:`1px solid ${T.border}`, borderRadius:6, color:T.textPrimary, fontSize:11, fontFamily:"'Outfit',sans-serif", cursor:"pointer", outline:"none" }}>
                          <option value="agent">Agent</option>
                          <option value="manager">Manager</option>
                          <option value="viewer">Viewer</option>
                        </select>
                      </div>

                      {/* RERA card number */}
                      <div style={{ fontSize:11, color:T.textSecondary, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                        {agent.reraCard?.number || <span style={{ color:T.textMuted }}>—</span>}
                      </div>

                      {/* RERA expiry with status */}
                      <div>
                        {agent.reraCard?.expiry ? (
                          <div>
                            <div style={{ fontSize:11, color:rStatus.color, fontWeight:600 }}>{rStatus.label}</div>
                            <div style={{ fontSize:9, color:T.textMuted }}>{new Date(agent.reraCard.expiry).toLocaleDateString("en-AE",{day:"2-digit",month:"short",year:"numeric"})}</div>
                          </div>
                        ) : (
                          <span style={{ fontSize:10, color:T.textMuted }}>Not set</span>
                        )}
                      </div>

                      {/* Commission split — pay, and gated as pay.
                          This tab is open to anybody whose orgRole is "manager",
                          which in a real agency is the marketing manager and the
                          HR manager as much as a sales manager. Verified on the
                          seeded company: the marketing manager could read every
                          agent's split. */}
                      {maySeeSplits && (
                      <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                        <input type="number" min="0" max="100"
                          value={commSplits[agent.uid] ?? 50}
                          onChange={e => setCommSplits(s => ({...s, [agent.uid]: e.target.value}))}
                          style={{ width:46, padding:"5px 6px", background:T.bg, border:`1px solid rgba(212,168,67,0.2)`, borderRadius:6, color:T.gold, fontSize:11, fontFamily:"'Outfit',sans-serif", outline:"none", textAlign:"center" }}/>
                        <span style={{ fontSize:10, color:T.textMuted }}>%</span>
                        <button type="button" onClick={()=>saveCommSplit(agent.uid, commSplits[agent.uid]??50)} disabled={isSaving}
                          style={{ padding:"4px 8px", borderRadius:5, border:`1px solid rgba(212,168,67,0.3)`, background:"rgba(212,168,67,0.08)", color:T.gold, fontSize:9, fontWeight:700, cursor:"pointer", opacity:isSaving?0.5:1 }}>
                          {isSaving ? "..." : "Save"}
                        </button>
                      </div>
                      )}

                      {/* Lead count */}
                      <div style={{ fontSize:12, fontWeight:600, color:agentLeads>0?T.textPrimary:T.textMuted, textAlign:"center" }}>
                        {agentLeads}
                      </div>

                      {/* Remove */}
                      <div>
                        <button type="button" onClick={()=>removeAgent(agent.uid)}
                          style={{ width:28, height:28, borderRadius:6, border:`1px solid rgba(239,68,68,0.2)`, background:"transparent", color:"rgba(239,68,68,0.5)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* ── Invite Agent Modal (Session 11) ── */}
              {showInviteAgent && (
                <div style={{ position:"fixed", inset:0, background:"rgba(4,9,15,0.85)", zIndex:2000, display:"flex", alignItems:"center", justifyContent:"center", backdropFilter:"blur(8px)" }} onClick={e=>{if(e.target===e.currentTarget)setShowInviteAgent(false);}}>
                  <div style={{ background:T.surface, borderRadius:14, border:`1px solid ${T.border}`, width:"95%", maxWidth:420 }} onClick={e=>e.stopPropagation()}>
                    <div style={{ padding:"22px 24px", borderBottom:`1px solid ${T.border}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                      <div>
                        <div style={{ fontFamily:"'Fraunces',serif", fontSize:17, fontWeight:900, color:T.gold }}>Invite Agent</div>
                        <div style={{ fontSize:11, color:T.textMuted, marginTop:2 }}>Generate an invite link to join your agency</div>
                      </div>
                      <button type="button" onClick={()=>setShowInviteAgent(false)}
                        style={{ background:T.surfaceAlt, border:`1px solid ${T.border}`, borderRadius:7, color:T.textMuted, width:30, height:30, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      </button>
                    </div>
                    <div style={{ padding:"20px 24px" }}>
                      {inviteSent ? (
                        <div style={{ textAlign:"center", padding:"12px 0" }}>
                          <div style={{ width:44, height:44, borderRadius:"50%", background:"rgba(16,185,129,0.1)", border:"2px solid rgba(16,185,129,0.3)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 12px" }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={T.green} strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                          </div>
                          <div style={{ fontSize:13, fontWeight:700, color:T.green, marginBottom:6 }}>Invite link ready</div>
                          <div style={{ padding:"10px 14px", background:T.surfaceAlt, borderRadius:8, fontSize:11, color:T.gold, wordBreak:"break-all", marginBottom:12 }}>
                            {typeof window!=="undefined"?window.location.origin:""}/agency/signup?org={orgId}&email={encodeURIComponent(inviteEmail)}
                          </div>
                          <button type="button" onClick={()=>{ if(typeof navigator!=="undefined") navigator.clipboard?.writeText(`${window.location.origin}/agency/signup?org=${orgId}&email=${encodeURIComponent(inviteEmail)}`); }}
                            style={{ padding:"8px 20px", borderRadius:7, border:`1px solid ${T.gold}`, background:"rgba(212,168,67,0.1)", color:T.gold, fontSize:11, fontWeight:700, cursor:"pointer" }}>
                            Copy Link
                          </button>
                        </div>
                      ) : (
                        <>
                          <div style={{ fontSize:11, fontWeight:600, color:T.textMuted, marginBottom:8 }}>Agent Email Address</div>
                          <input value={inviteEmail} onChange={e=>setInviteEmail(e.target.value)} placeholder="agent@email.com" type="email"
                            style={{ width:"100%", padding:"11px 14px", background:T.bg, border:`1px solid rgba(212,168,67,0.15)`, borderRadius:9, color:T.textPrimary, fontSize:13, fontFamily:"'Outfit',sans-serif", outline:"none", marginBottom:14, boxSizing:"border-box" }}/>
                          <div style={{ padding:"10px 14px", background:"rgba(20,184,166,0.06)", border:"1px solid rgba(20,184,166,0.15)", borderRadius:8, fontSize:11, color:T.textMuted, marginBottom:16, lineHeight:1.5 }}>
                            Agent signs up at the generated link and is automatically assigned to <strong style={{ color:T.gold }}>{orgProfile?.name}</strong>.
                          </div>
                          <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
                            <button type="button" onClick={()=>setShowInviteAgent(false)}
                              style={{ padding:"9px 18px", borderRadius:7, border:`1px solid ${T.border}`, background:"transparent", color:T.textMuted, fontSize:12, cursor:"pointer" }}>
                              Cancel
                            </button>
                            <button type="button" disabled={!inviteEmail.trim()||inviteLoading}
                              onClick={()=>{ setInviteLoading(true); setTimeout(()=>{ setInviteSent(true); setInviteLoading(false); },300); }}
                              style={{ padding:"9px 20px", borderRadius:7, border:`1px solid ${T.gold}`, background:"rgba(212,168,67,0.1)", color:T.gold, fontSize:12, fontWeight:700, cursor:"pointer", opacity:(!inviteEmail.trim()||inviteLoading)?0.5:1 }}>
                              {inviteLoading ? "Generating..." : "Generate Link"}
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}
            {_copy?.provenance && <TabProvenance {..._copy.provenance}/>}
            </>);
}

export default AgencyTab;
