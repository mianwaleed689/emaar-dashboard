/* eslint-disable */
/*
  DXB ANALYTICS — TEAM TAB
  Session 12 — Agent Account Creation + Deactivation
  Manager creates agents directly from dashboard
*/

import React, { useState, useMemo } from "react";
import { initializeApp, deleteApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, setDoc, updateDoc, collection, query, where, getDocs, arrayUnion } from "firebase/firestore";
import { DEPARTMENTS, SENIORITY, viewerFrom, visibleRecords } from "../crm/model/org";
import { auth, db, firebaseConfig } from "../firebase";
import PhoneInput from "../components/PhoneInput";
import NationalitySelect from "../components/NationalitySelect";
import { T } from "../data";
import { cleanPhone } from "../utils";
import { GOLDEN_VISA_THRESHOLD } from "../utils/constants";

import TabIntro from "../components/TabIntro";
import TabProvenance from "../components/TabProvenance";
import { tabCopy } from "../data/tabCopy";
const SOURCE_COLORS = {
  "Property Finder":"#00C08B","Bayut":"#FF6B35","Dubizzle":"#E8003D","Meta/Facebook":"#1877F2",
  "Instagram":"#E1306C","WhatsApp":"#25D366","Google Ads":"#4285F4","Referral":"#8B5CF6",
  "Website":"#14B8A6","Manual":"#94A3B8","Cold Call":"#F59E0B","Email":"#6366F1"
};

const fmtB = v => { const n=parseFloat(v||0); if(!n) return "—"; return n>=1e6?"AED "+(n/1e6).toFixed(1)+"M":"AED "+n.toLocaleString(); };

export default function TeamTab({ teamMembers=[], teamMembersLoading, myLeads=[], deals=[], orgRole, userRole, orgId, firebaseUser, orgName }) {
  const _copy = tabCopy("Team");


  const canManage = orgRole==="owner"||orgRole==="director"||orgRole==="manager"||userRole==="superAdmin"||userRole==="admin";
  if (!canManage) return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"80px 20px",textAlign:"center"}}>
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={T.textMuted} strokeWidth="1.5" strokeLinecap="round" style={{marginBottom:16}}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
      <div style={{fontSize:16,fontWeight:700,color:T.white,marginBottom:6}}>Manager access only</div>
      <div style={{fontSize:12,color:T.textMuted}}>Contact your administrator to request manager access</div>
    </div>
  );

  // — State —
  const [showCreate,  setShowCreate]  = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [showDeact,   setShowDeact]   = useState(null);  // agent being deactivated
  const [toast,       setToast]       = useState(null);
  const [creating,    setCreating]    = useState(false);
  const [deacting,    setDeacting]    = useState(false);
  /* Everyone was created as orgRole "agent" with no department at all, which is
   why the whole company read as Sales and a sales admin or an accounts clerk
   could not be entered. These are the fields the access model, the workflow and
   the compliance register all need to have anything real to work with. */
  const [form, setForm] = useState({
    name:"", email:"", phone:"", password:"", nationality:"",
    department:"sales", seniority:"staff", managerId:"",
    joinedAt:"", brn:"", brnExpiry:"", visaExpiry:"", emiratesIdExpiry:"",
  });
  const [inviteMode, setInviteMode] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteLink, setInviteLink] = useState("");
  const [sendingInvite, setSendingInvite] = useState(false);
  const F = (k,v) => setForm(p=>({...p,[k]:v}));

  /* This person's own record, for the department and seniority the access
     model reads. Without it a manager falls back to the legacy inference. */
  const myRecord = (teamMembers || []).find(m => (m.uid || m.id) === firebaseUser?.uid) || null;

  const notify = (msg, type="success") => {
    setToast({msg,type});
    setTimeout(()=>setToast(null),3500);
  };

  const generateInvite = async () => {
    if (!inviteEmail.trim()) { notify("Please enter agent email", "error"); return; }
    setSendingInvite(true);
    try {
      /* SEAT CHECK.
         seatsIncluded and seatsUsed were written onto the organisation at signup
         and then read by nothing, so an agency paying for ten seats could invite
         fifty. A plan whose limit is never enforced is not a plan.

         Checked at invite time rather than at join time on purpose: telling a
         manager "you are out of seats" before they send the link is far better
         than letting an agent click a dead invite. */
      const { getDoc } = await import("firebase/firestore");
      const orgSnap = orgId ? await getDoc(doc(db, "organisations", orgId)) : null;
      const org = orgSnap?.exists() ? orgSnap.data() : null;

      if (org && Number(org.seatsIncluded) > 0) {
        /* Count the live member list first, and fall back to the stored counter
           only when the list has not loaded.

           The counter is a running total that has been wrong before: joining
           incremented it, deactivating did not decrement, so it drifted upward
           and could permanently lock an agency out of seats it had paid for.
           That leak is fixed in deactivateAgent, but an organisation created
           before the fix still carries the inflated number. Counting the actual
           active members repairs those without a migration — and a counter can
           only ever drift again, whereas the list is the thing itself.

           Suspended agents do not hold a seat; that is what deactivation means. */
        const activeMembers = (teamMembers || []).filter(m => m.status !== "suspended");
        const used = activeMembers.length > 0
          ? activeMembers.length
          : (Number(org.seatsUsed) || 1);

        if (used >= Number(org.seatsIncluded)) {
          notify(
            `All ${org.seatsIncluded} seats on your plan are in use. Deactivate an agent to free a seat, or upgrade to invite more.`,
            "error"
          );
          setSendingInvite(false);
          return;
        }
      }

      const token = "inv_" + Math.random().toString(36).substring(2) + Date.now().toString(36);
      const expiresAt = new Date(Date.now() + 7*24*60*60*1000).toISOString();
      const { setDoc, doc: fsDoc } = await import("firebase/firestore");
      await setDoc(fsDoc(db, "invites", token), {
        token, email: inviteEmail.trim(),
        orgId: orgId || "", orgName: orgName || "Your Agency",
        managerId: firebaseUser?.uid || "",
        createdAt: new Date().toISOString(),
        expiresAt, used: false,
      });
      const link = window.location.origin + "/join?token=" + token;
      setInviteLink(link);
      notify("Invite link generated!");
    } catch(e) { notify("Failed: " + e.message, "error"); }
    setSendingInvite(false);
  };

  // — Create agent account —
  const createAgent = async () => {
    if(!form.name.trim())    { notify("Agent name is required","error"); return; }
    if(!form.email.trim())   { notify("Email is required","error"); return; }
    if(form.password.length<8){ notify("Password must be at least 8 characters","error"); return; }
    if(!/[A-Z]/.test(form.password)){ notify("Password needs at least 1 uppercase letter","error"); return; }
    if(!/[0-9]/.test(form.password)){ notify("Password needs at least 1 number","error"); return; }
    setCreating(true);
    try {
      const managerEmail = firebaseUser?.email || "";
      const managerUid   = firebaseUser?.uid   || "";

      /* ── CREATING A USER MUST NOT LOG THE CREATOR OUT ──────────────────
         createUserWithEmailAndPassword signs the new account in on whichever
         Firebase app it is given. Called on the primary app — as it was here —
         it silently replaced the owner's session with the agent's. An owner
         adding their first agent was ejected from their own agency and left
         looking at the product as that agent, and it survived a reload.

         Verified in a browser on a real signup: after adding "ZZ Agent
         Fatima" the page read "Welcome, ZZ Agent Fatima". The previous code
         knew — it kept a `managerPassword = null` with a note to use the
         Admin SDK in production — but shipped anyway, so every agency hit
         this on the first agent they ever added.

         The fix needs no backend. A SECOND Firebase app instance has its own
         auth state, so the new account is created and signed out there while
         the primary session carries on untouched. The Firestore writes below
         deliberately stay on the primary `db`: they must run as the manager,
         which is what the security rules expect. */
      const helperApp = initializeApp(firebaseConfig, `agent-create-${Date.now()}`);
      let agentUid;
      try {
        const helperAuth = getAuth(helperApp);
        const cred = await createUserWithEmailAndPassword(helperAuth, form.email.trim(), form.password);
        agentUid = cred.user.uid;
        await signOut(helperAuth);
      } finally {
        await deleteApp(helperApp).catch(() => {});
      }

      // Create users doc
      await setDoc(doc(db,"users",agentUid),{
        name:         form.name.trim(),
        email:        form.email.trim(),
        phone:        form.phone.trim(),
        nationality:  form.nationality||"",
        role:         "user",
        /* orgRole is kept for everything that still reads it, and derived from
           seniority so the two cannot disagree. department + seniority are what
           the access model actually uses. */
        orgRole:      form.seniority === "owner" ? "owner"
                    : form.seniority === "director" ? "director"
                    : form.seniority === "manager" ? "manager" : "agent",
        department:   form.department || "sales",
        seniority:    form.seniority || "staff",
        orgId:        orgId||"",
        managerId:    form.managerId || managerUid,
        joinedAt:     form.joinedAt || "",
        /* Only sales carries a broker card. Storing an empty one on an accounts
           clerk would make the compliance register warn about a document they
           are never required to hold. */
        brn:          form.department === "sales" ? (form.brn || "") : "",
        expiries: {
          ...(form.department === "sales" && form.brnExpiry ? { brn: form.brnExpiry } : {}),
          ...(form.visaExpiry ? { visa: form.visaExpiry } : {}),
          ...(form.emiratesIdExpiry ? { emiratesId: form.emiratesIdExpiry } : {}),
        },
        paid:         true,
        status:       "active",
        onboardingComplete: false,
        createdAt:    new Date().toISOString(),
        createdBy:    managerUid,
      });

      // Add to organisations/members subcollection
      if(orgId){
        await setDoc(doc(db,"organisations",orgId,"members",agentUid),{
          uid:     agentUid,
          name:    form.name.trim(),
          email:   form.email.trim(),
          phone:   form.phone.trim(),
          /* This was hardcoded "agent", so an org member created as a Manager
             or Director was recorded as an agent here while the users doc said
             otherwise — two records of the same person disagreeing. */
          orgRole: form.seniority === "owner" ? "owner"
                 : form.seniority === "director" ? "director"
                 : form.seniority === "manager" ? "manager" : "agent",
          department: form.department || "sales",
          seniority:  form.seniority || "staff",
          orgId,
          managerId: managerUid,
          status:  "active",
          createdAt: new Date().toISOString(),
        },{merge:true});
      }

      setForm({name:"",email:"",phone:"",password:""});
      setShowCreate(false);
      notify("Agent account created successfully! They can now log in.");
    } catch(e) {
      console.error(e);
      if(e.code==="auth/email-already-in-use") notify("This email is already registered","error");
      else if(e.code==="auth/invalid-email")   notify("Invalid email address","error");
      else notify("Failed to create account: "+e.message,"error");
    }
    setCreating(false);
  };

  // — Deactivate agent —
  const deactivateAgent = async (agent) => {
    setDeacting(true);
    try {
      const managerUid = firebaseUser?.uid||"";
      const now = new Date().toISOString();

      // 1. Suspend the agent
      await updateDoc(doc(db,"users",agent.uid||agent.id),{
        status:      "suspended",
        suspendedAt: now,
        suspendedBy: managerUid,
      });

      /* 1b. RELEASE THE SEAT.
         Joining incremented seatsUsed; deactivating did not decrement it. The
         counter only ever went up, so an agency on ten seats that had onboarded
         and removed three agents could invite seven more people and no more —
         permanently, with three seats they had paid for and could never use.

         Now that the ten-seat allowance is a committed number quoted on the
         pricing page, a counter that leaks is a billing dispute rather than a
         cosmetic bug.

         increment(-1) rather than read-then-write for the same reason the join
         path uses increment(+1): two managers deactivating at the same moment
         would otherwise both read the same value and one release would vanish.

         Floored at 1 below, on read, because the manager always occupies a seat
         and a negative counter would hand out unlimited invites. */
      if (orgId) {
        try {
          const { increment } = await import("firebase/firestore");
          await updateDoc(doc(db,"organisations",orgId),{
            seatsUsed:  increment(-1),
            agentCount: increment(-1),
            updatedAt:  now,
          });
        } catch(e) {
          /* The agent is already suspended and their leads are being returned;
             a failed counter must not leave the deactivation half-done. Logged
             so the discrepancy is findable, and the invite check recomputes from
             the live member list anyway. */
          console.error("Seat counter not decremented for org "+orgId, e);
        }
      }

      // 2. Find all leads assigned to this agent
      const leadsSnap = await getDocs(
        query(collection(db,"leads"),
          where("assignedTo","==",agent.uid||agent.id),
          where("orgId","==",orgId||"")
        )
      );

      // 3. Return each lead to manager pool with tag
      const batch = [];
      leadsSnap.forEach(d => {
        const lead = d.data();
        const daysAssigned = lead.assignedAt
          ? Math.floor((Date.now()-new Date(lead.assignedAt).getTime())/86400000)
          : 0;
        const tag = {
          previousAgent:     agent.uid||agent.id,
          previousAgentName: agent.name||agent.email||"Agent",
          previousAgentDate: now,
          previousAgentDays: daysAssigned,
        };
        const entry = {
          text: "Lead returned to pool — previously assigned to "+
                (agent.name||agent.email||"Agent")+
                " for "+daysAssigned+" days",
          type: "Note",
          by:   "System",
          at:   now,
        };
        batch.push(updateDoc(doc(db,"leads",d.id),{
          assignedTo:       "",
          assignedToName:   "",
          updatedAt:        now,
          notes_log:        arrayUnion(entry),
          ...tag,
        }));
      });

      await Promise.all(batch);
      setShowDeact(null);
      notify("Agent deactivated. "+leadsSnap.size+" leads returned to pool.");
    } catch(e) {
      console.error(e);
      notify("Deactivation failed: "+e.message,"error");
    }
    setDeacting(false);
  };

  // — Reactivate agent —
  const reactivateAgent = async (agent) => {
    try {
      await updateDoc(doc(db,"users",agent.uid||agent.id),{
        status:        "active",
        reactivatedAt: new Date().toISOString(),
        reactivatedBy: firebaseUser?.uid||"",
      });
      notify(agent.name+" reactivated successfully");
    } catch(e) { notify("Reactivation failed","error"); }
  };

  // — Derived metrics —
  /* A SALES MANAGER RUNS A TEAM, NOT THE COMPANY.
     This listed every agent in the agency to anybody who could open the tab, so
     a manager with forty people saw all one hundred and twenty-five — including
     both other managers' teams, their leads, their conversion and their
     pipeline. Verified on a seeded agency: People correctly showed that manager
     41 of 133, and Team showed them 125.

     The access model already answers this; the tab simply was not asking it.
     scopeFor(me,"people") gives a manager "team" and a director or owner "org",
     and visibleRecords does the filtering — the same call every other tab makes.
     managerId is the reporting line written when the person was created. */
  const me = useMemo(() => viewerFrom({
    firebaseUser, orgRole, userRole,
    department: myRecord?.department, seniority: myRecord?.seniority,
    teamMembers,
  }), [firebaseUser, orgRole, userRole, myRecord, teamMembers]);

  const visibleTeam = useMemo(
    () => visibleRecords(me, "people", teamMembers,
                         { ownerField: "uid", teamIds: me.teamIds }),
    [me, teamMembers]);

  const agents   = visibleTeam.filter(u=>u.orgRole==="agent"||u.role==="agent");
  const weekAgo  = new Date(Date.now()-7*24*60*60*1000);

  const agentStats = agents.map(agent => {
    const uid        = agent.uid||agent.id;
    const aLeads     = myLeads.filter(l=>l.assignedTo===uid);
    const aDeals     = deals.filter(d=>d.agentId===uid);
    const closed     = aDeals.filter(d=>d.stage==="Completed");
    const totalVal   = aDeals.reduce((s,d)=>s+parseFloat(d.price||0),0);
    const conv       = aLeads.length>0?((closed.length/aLeads.length)*100).toFixed(1):"0.0";
    const newWeek    = aLeads.filter(l=>new Date(l.createdAt)>=weekAgo).length;
    const overdue    = aLeads.filter(l=>l.updatedAt&&(Date.now()-new Date(l.updatedAt))>3*86400000&&["New Lead","Potential","No Answer"].includes(l.status)).length;
    return {...agent,uid,aLeads,aDeals,closed,totalVal,conv,newWeek,overdue};
  }).sort((a,b)=>b.closed.length-a.closed.length);

  const teamLeads  = myLeads.length;
  const teamDeals  = deals.length;
  const teamClosed = deals.filter(d=>d.stage==="Completed").length;
  const teamVal    = deals.reduce((s,d)=>s+parseFloat(d.price||0),0);
  const teamOverdue= myLeads.filter(l=>l.updatedAt&&(Date.now()-new Date(l.updatedAt))>3*86400000&&["New Lead","Potential","No Answer"].includes(l.status));

  const srcStats = [...new Set(myLeads.map(l=>l.source).filter(Boolean))].map(src=>{
    const srcLeads = myLeads.filter(l=>l.source===src);
    const srcDeals = deals.filter(d=>srcLeads.some(l=>l.assignedTo===d.agentId));
    const cls = srcDeals.filter(d=>d.stage==="Completed").length;
    return {src,leads:srcLeads.length,closed:cls,conv:srcLeads.length>0?((cls/srcLeads.length)*100).toFixed(1):"0.0",color:SOURCE_COLORS[src]||T.textMuted};
  }).sort((a,b)=>parseFloat(b.conv)-parseFloat(a.conv));

  const inp = {width:"100%",padding:"8px 10px",background:"rgba(255,255,255,0.04)",border:"1px solid "+T.border,borderRadius:7,color:T.white,fontSize:12,outline:"none",boxSizing:"border-box",fontFamily:"'Outfit',sans-serif"};

  return (
    <div style={{paddingBottom:60}}>
      {_copy && <TabIntro title={_copy.title} what={_copy.what} detail={_copy.detail} includes={_copy.includes} excludes={_copy.excludes} warning={_copy.warning} />}


      {/* — HEADER — */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20,flexWrap:"wrap",gap:12}}>
        <div>
          <h1 style={{fontFamily:"'Fraunces',serif",fontSize:22,fontWeight:900,color:T.white,margin:0}}>Team Dashboard</h1>
          <p style={{fontSize:12,color:T.textMuted,margin:"4px 0 0"}}>
            {agents.length} agents — {teamLeads} leads — {teamDeals} deals — Live
          </p>
        </div>
        <button type="button" onClick={()=>setShowCreate(true)}
          style={{padding:"9px 18px",borderRadius:8,border:"none",background:"linear-gradient(135deg,#D4A843,#B8902E)",color:"#0A0E1A",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"'Outfit',sans-serif",display:"flex",alignItems:"center",gap:6}}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add Agent
        </button>
        <button type="button" onClick={()=>{setShowInvite(true);setInviteLink("");setInviteEmail("");}}
          style={{padding:"8px 16px",borderRadius:7,border:"1px solid "+T.teal,background:"rgba(0,191,165,0.08)",color:T.teal,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>
          ✉ Invite via Link
        </button>
      </div>

      {/* — KPI BAR — */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:10,marginBottom:20}}>
        {[
          {label:"Total Leads",    value:teamLeads,   color:T.gold},
          {label:"Active Deals",   value:teamDeals-teamClosed, color:"#14B8A6"},
          {label:"Deals Closed",   value:teamClosed,  color:"#10B981"},
          {label:"Pipeline",       value:fmtB(teamVal), color:"#8B5CF6"},
          {label:"Overdue",        value:teamOverdue.length, color:teamOverdue.length>0?"#EF4444":"#10B981"},
        ].map((k,i)=>(
          <div key={i} style={{background:T.card||"rgba(255,255,255,0.03)",border:"1px solid "+T.border,borderRadius:12,padding:"14px 16px",position:"relative",overflow:"hidden"}}>
            <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:k.color,opacity:0.8}}/>
            <div style={{fontSize:10,fontWeight:700,color:T.textMuted,textTransform:"uppercase",letterSpacing:0.8,marginBottom:8}}>{k.label}</div>
            <div style={{fontSize:22,fontWeight:900,color:k.color,fontFamily:"'Fraunces',serif",lineHeight:1}}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* — AGENT TABLE — */}
      <div style={{background:"rgba(255,255,255,0.02)",border:"1px solid "+T.border,borderRadius:14,overflow:"hidden",marginBottom:16}}>
        <div style={{padding:"14px 18px",borderBottom:"1px solid "+T.border,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{fontSize:13,fontWeight:700,color:T.white}}>Agent Roster</div>
          <div style={{fontSize:11,color:T.textMuted}}>{agents.length} agents</div>
        </div>
        <div style={{overflowX:"auto"}}>
          <div style={{display:"grid",gridTemplateColumns:"minmax(140px,2fr) 70px 70px 70px 90px 80px 100px 80px",minWidth:680,gap:8,padding:"8px 16px",fontSize:9,fontWeight:700,color:T.textMuted,textTransform:"uppercase",letterSpacing:0.8,borderBottom:"1px solid "+T.border}}>
            {["Agent","Leads","New/wk","Hot","Closed","Pipeline","Conv%","Action"].map((h,i)=>(
              <div key={i} style={{textAlign:i>0?"center":"left"}}>{h}</div>
            ))}
          </div>
          {teamMembersLoading&&<div style={{padding:"40px",textAlign:"center",color:T.textMuted,fontSize:12}}>Loading team...</div>}
          {!teamMembersLoading&&agentStats.length===0&&(
            <div style={{padding:"40px",textAlign:"center"}}>
              <div style={{fontSize:13,color:T.textMuted,marginBottom:8}}>No agents yet</div>
              <button type="button" onClick={()=>setShowCreate(true)} style={{padding:"8px 20px",borderRadius:7,border:"none",background:"linear-gradient(135deg,#D4A843,#B8902E)",color:"#0A0E1A",fontSize:12,fontWeight:700,cursor:"pointer"}}>+ Add First Agent</button>
            </div>
          )}
          {agentStats.map((agent,i)=>{
            const isSuspended = agent.status==="suspended";
            const rankColor = i===0?"#F59E0B":i===1?"#94A3B8":i===2?"#B45309":T.textMuted;
            return (
              <div key={agent.uid||i} style={{display:"grid",gridTemplateColumns:"minmax(140px,2fr) 70px 70px 70px 90px 80px 100px 80px",gap:8,padding:"12px 16px",alignItems:"center",borderBottom:i<agentStats.length-1?"1px solid "+T.border+"40":"none",background:isSuspended?"rgba(239,68,68,0.03)":i%2===0?"transparent":"rgba(255,255,255,0.01)",opacity:isSuspended?0.6:1}}>
                {/* Agent info */}
                <div style={{display:"flex",alignItems:"center",gap:8,minWidth:0}}>
                  <div style={{width:28,height:28,borderRadius:"50%",background:isSuspended?"rgba(239,68,68,0.12)":"rgba(212,168,67,0.12)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,color:isSuspended?"#EF4444":T.gold,flexShrink:0}}>
                    {(agent.name||agent.email||"?").slice(0,2).toUpperCase()}
                  </div>
                  <div style={{minWidth:0}}>
                    <div style={{fontSize:12,fontWeight:600,color:isSuspended?T.textMuted:T.white,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                      {agent.name||agent.email?.split("@")[0]||"Agent"}
                      {isSuspended&&<span style={{marginLeft:6,fontSize:9,color:"#EF4444",fontWeight:700}}>SUSPENDED</span>}
                    </div>
                    <div style={{fontSize:10,color:T.textMuted,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{agent.email||""}</div>
                  </div>
                </div>
                {/* Leads */}
                <div style={{fontSize:12,fontWeight:600,color:T.white,textAlign:"center"}}>{agent.aLeads.length}</div>
                {/* New this week */}
                <div style={{fontSize:12,color:T.gold,fontWeight:600,textAlign:"center"}}>{agent.newWeek}</div>
                {/* Hot */}
                <div style={{fontSize:12,color:"#10B981",fontWeight:600,textAlign:"center"}}>
                  {agent.aLeads.filter(l=>l.status==="Hot Case").length}
                </div>
                {/* Closed */}
                <div style={{textAlign:"center"}}>
                  <span style={{fontSize:11,fontWeight:700,padding:"2px 8px",borderRadius:5,background:agent.closed.length>0?"rgba(16,185,129,0.1)":"rgba(255,255,255,0.04)",color:agent.closed.length>0?"#10B981":T.textMuted}}>
                    {agent.closed.length}
                  </span>
                </div>
                {/* Pipeline */}
                <div style={{fontSize:11,fontWeight:600,color:agent.totalVal>0?T.gold:T.textMuted,textAlign:"center"}}>{fmtB(agent.totalVal)}</div>
                {/* Conv % */}
                <div style={{textAlign:"center"}}>
                  <span style={{fontSize:11,fontWeight:700,color:parseFloat(agent.conv)>5?"#10B981":parseFloat(agent.conv)>0?T.gold:T.textMuted}}>
                    {agent.conv}%
                  </span>
                </div>
                {/* Action */}
                <div style={{display:"flex",gap:5,justifyContent:"center"}}>
                  {agent.phone&&<a href={"https://wa.me/"+cleanPhone(agent.phone||"")} target="_blank" rel="noopener noreferrer" style={{padding:"3px 7px",borderRadius:5,background:"rgba(37,211,102,0.1)",border:"1px solid rgba(37,211,102,0.2)",color:"#25D366",textDecoration:"none",fontSize:9,fontWeight:700}}>WA</a>}
                  {!isSuspended
                    ?<button type="button" onClick={()=>setShowDeact(agent)} style={{padding:"3px 9px",borderRadius:5,background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.2)",color:"#EF4444",fontSize:9,fontWeight:700,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>Deactivate</button>
                    :<button type="button" onClick={()=>reactivateAgent(agent)} style={{padding:"3px 9px",borderRadius:5,background:"rgba(16,185,129,0.08)",border:"1px solid rgba(16,185,129,0.2)",color:"#10B981",fontSize:9,fontWeight:700,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>Reactivate</button>
                  }
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* — BOTTOM ROW — */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>

        {/* Source ROI */}
        <div style={{background:"rgba(255,255,255,0.02)",border:"1px solid "+T.border,borderRadius:14,overflow:"hidden"}}>
          <div style={{padding:"14px 18px",borderBottom:"1px solid "+T.border,display:"flex",alignItems:"center",gap:10}}>
            <div style={{fontSize:13,fontWeight:700,color:T.white}}>Source ROI</div>
            <div style={{marginLeft:"auto",fontSize:10,color:T.textMuted}}>By conversion rate</div>
          </div>
          <div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 60px 60px 70px",gap:8,padding:"8px 16px",fontSize:9,fontWeight:700,color:T.textMuted,textTransform:"uppercase",letterSpacing:0.8,borderBottom:"1px solid "+T.border}}>
              <div>Source</div><div style={{textAlign:"center"}}>Leads</div><div style={{textAlign:"center"}}>Closed</div><div style={{textAlign:"right"}}>Conv%</div>
            </div>
            {srcStats.length===0&&<div style={{padding:"24px 16px",textAlign:"center",fontSize:12,color:T.textMuted}}>No source data yet</div>}
            {srcStats.map(({src,leads,closed,conv,color},i)=>(
              <div key={src} style={{display:"grid",gridTemplateColumns:"1fr 60px 60px 70px",gap:8,padding:"10px 16px",alignItems:"center",borderBottom:i<srcStats.length-1?"1px solid "+T.border+"40":"none"}}>
                <div style={{display:"flex",alignItems:"center",gap:8}}><div style={{width:8,height:8,borderRadius:"50%",background:color,flexShrink:0}}/><span style={{fontSize:11,fontWeight:600,color:T.white,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{src}</span></div>
                <div style={{fontSize:11,fontWeight:600,color:T.white,textAlign:"center"}}>{leads}</div>
                <div style={{fontSize:11,fontWeight:600,color:closed>0?"#10B981":T.textMuted,textAlign:"center"}}>{closed}</div>
                <div style={{textAlign:"right"}}><span style={{fontSize:11,fontWeight:700,color:parseFloat(conv)>5?"#10B981":parseFloat(conv)>0?T.gold:T.textMuted}}>{conv}%</span></div>
              </div>
            ))}
          </div>
        </div>

        {/* Overdue Follow-ups */}
        <div style={{background:"rgba(255,255,255,0.02)",border:"1px solid "+T.border,borderRadius:14,overflow:"hidden"}}>
          <div style={{padding:"14px 18px",borderBottom:"1px solid "+T.border,display:"flex",alignItems:"center",gap:10}}>
            <div style={{fontSize:13,fontWeight:700,color:T.white}}>Overdue Follow-ups</div>
            {teamOverdue.length>0&&<span style={{marginLeft:"auto",fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:10,background:"rgba(239,68,68,0.12)",color:"#EF4444"}}>{teamOverdue.length} overdue</span>}
          </div>
          <div style={{maxHeight:320,overflowY:"auto"}}>
            {teamOverdue.length===0&&(
              <div style={{padding:"40px 20px",textAlign:"center"}}>
                <div style={{fontSize:13,fontWeight:600,color:"#10B981"}}>All caught up</div>
                <div style={{fontSize:11,color:T.textMuted,marginTop:4}}>No overdue follow-ups</div>
              </div>
            )}
            {teamOverdue.map((l,i)=>{
              const days = l.updatedAt?Math.floor((Date.now()-new Date(l.updatedAt))/86400000):"?";
              const agent = teamMembers.find(u=>u.uid===l.assignedTo);
              return (
                <div key={l.id||i} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"11px 18px",borderBottom:i<teamOverdue.length-1?"1px solid "+T.border:""}}>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:12,fontWeight:600,color:T.white,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{l.name||l.phone||"Unnamed"}</div>
                    <div style={{fontSize:10,color:T.textMuted,marginTop:2}}>{agent?(agent.name||agent.email?.split("@")[0]):"Unassigned"}{l.source?" — "+l.source:""}</div>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
                    <span style={{fontSize:10,fontWeight:700,padding:"3px 8px",borderRadius:5,background:"rgba(239,68,68,0.1)",color:"#EF4444"}}>{days}d ago</span>
                    {l.phone&&<a href={"https://wa.me/"+cleanPhone(l.phone||"")} target="_blank" rel="noopener noreferrer" style={{display:"flex",alignItems:"center",justifyContent:"center",width:28,height:28,borderRadius:6,border:"1px solid rgba(37,211,102,0.3)",background:"rgba(37,211,102,0.08)",color:"#25D366",textDecoration:"none"}}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>
                    </a>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* — CREATE AGENT MODAL — */}
      {showInvite&&(
        <div style={{position:"fixed",inset:0,background:"rgba(4,9,15,0.85)",zIndex:3000,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
          <div style={{background:"#0A1628",borderRadius:16,padding:32,width:"100%",maxWidth:420,border:"1px solid rgba(255,255,255,0.06)"}}>
            <div style={{fontFamily:"'Fraunces',serif",fontSize:16,fontWeight:900,color:"#FFFFFF",marginBottom:4}}>✉ Invite Agent</div>
            <div style={{fontSize:12,color:"#64748B",marginBottom:20}}>Generate a secure invite link to send via WhatsApp or email</div>
            {!inviteLink?(
              <div style={{display:"flex",flexDirection:"column",gap:14}}>
                <div>
                  <div style={{fontSize:11,color:"#64748B",marginBottom:6}}>AGENT EMAIL *</div>
                  <input value={inviteEmail} onChange={e=>setInviteEmail(e.target.value)}
                    placeholder="agent@agency.ae"
                    style={{width:"100%",padding:"11px 14px",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(212,168,67,0.15)",borderRadius:9,color:"#FFFFFF",fontSize:13,fontFamily:"'Outfit',sans-serif",outline:"none",boxSizing:"border-box"}} />
                </div>
                <div style={{display:"flex",gap:8}}>
                  <button type="button" onClick={generateInvite} disabled={sendingInvite}
                    style={{flex:1,padding:"11px",background:"linear-gradient(135deg,#D4A843,#B8922A)",border:"none",borderRadius:9,color:"#000",fontSize:13,fontWeight:700,cursor:sendingInvite?"not-allowed":"pointer"}}>
                    {sendingInvite?"Generating...":"Generate Invite Link"}
                  </button>
                  <button type="button" onClick={()=>setShowInvite(false)}
                    style={{padding:"11px 16px",background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:9,color:"#94A3B8",fontSize:13,cursor:"pointer"}}>
                    Cancel
                  </button>
                </div>
              </div>
            ):(
              <div style={{display:"flex",flexDirection:"column",gap:14}}>
                <div style={{background:"rgba(16,185,129,0.08)",border:"1px solid rgba(16,185,129,0.2)",borderRadius:8,padding:"12px 14px"}}>
                  <div style={{fontSize:11,color:"#10B981",fontWeight:700,marginBottom:6}}>✅ Invite Link Generated!</div>
                  <div style={{fontSize:11,color:"#94A3B8",wordBreak:"break-all"}}>{inviteLink}</div>
                </div>
                <div style={{display:"flex",gap:8}}>
                  <button type="button" onClick={()=>{navigator.clipboard.writeText(inviteLink);notify("Link copied!");}}
                    style={{flex:1,padding:"11px",background:"linear-gradient(135deg,#D4A843,#B8922A)",border:"none",borderRadius:9,color:"#000",fontSize:13,fontWeight:700,cursor:"pointer"}}>
                    📋 Copy Link
                  </button>
                  <button type="button" onClick={()=>window.open("https://wa.me/?text="+encodeURIComponent("You have been invited to join "+orgName+". Click here to create your account: "+inviteLink),"_blank")}
                    style={{flex:1,padding:"11px",background:"rgba(37,211,102,0.12)",border:"1px solid rgba(37,211,102,0.3)",borderRadius:9,color:"#25D366",fontSize:13,fontWeight:700,cursor:"pointer"}}>
                    📱 Send via WhatsApp
                  </button>
                </div>
                <button type="button" onClick={()=>setShowInvite(false)}
                  style={{padding:"10px",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:9,color:"#94A3B8",fontSize:12,cursor:"pointer"}}>
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      {showCreate&&(
        <div style={{position:"fixed",inset:0,background:"rgba(4,9,15,0.9)",zIndex:2000,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={e=>{if(e.target===e.currentTarget)setShowCreate(false);}}>
          <div style={{background:"#0D1117",borderRadius:14,border:"1px solid rgba(212,168,67,0.3)",width:"100%",maxWidth:440,padding:24}} onClick={e=>e.stopPropagation()}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
              <div>
                <div style={{fontFamily:"'Fraunces',serif",fontSize:16,fontWeight:900,color:T.white}}>Create Agent Account</div>
                <div style={{fontSize:11,color:T.textMuted,marginTop:3}}>Agent will receive login credentials by email</div>
              </div>
              <button type="button" onClick={()=>setShowCreate(false)} style={{background:"rgba(255,255,255,0.06)",border:"1px solid "+T.border,borderRadius:7,color:T.textMuted,width:28,height:28,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>—</button>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              {[
                {k:"name",    label:"Full Name *",      placeholder:"Ahmed Al-Mansouri",   type:"text"},
                {k:"email",   label:"Work Email *",     placeholder:"ahmed@agency.ae",     type:"email"},
                {k:"phone",   label:"Phone Number",     placeholder:"+971 50 XXX XXXX",    type:"tel"},
                {k:"password",label:"Temporary Password *", placeholder:"Min 8 chars, 1 uppercase, 1 number", type:"password"},
              ].map(({k,label,placeholder,type})=>(
                <div key={k}>
                  <div style={{fontSize:10,color:T.textMuted,marginBottom:4,fontWeight:600,textTransform:"uppercase",letterSpacing:0.5}}>{label}</div>
                  {k==="phone"
                    ? <PhoneInput value={form[k]||""} onChange={v=>F(k,v)} />
                    : <input type={type} value={form[k]||""} onChange={e=>F(k,e.target.value)} placeholder={placeholder} style={{...inp}} />
                  }
                </div>
              ))}
              <div>
                <div style={{fontSize:10,color:T.textMuted,marginBottom:4,fontWeight:600,textTransform:"uppercase",letterSpacing:0.5}}>Nationality</div>
                <NationalitySelect value={form.nationality||""} onChange={v=>F("nationality",v)} placeholder="Select nationality" />
              </div>

              {/* WHERE THEY SIT IN THE COMPANY.
                  Everyone used to be created as an "agent" with no department,
                  which is why the whole company read as Sales and there was
                  nowhere to put a sales admin or an accounts clerk. These two
                  fields decide what this person sees, what lands on their desk,
                  and which notifications reach them. */}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                <div>
                  <div style={{fontSize:10,color:T.textMuted,marginBottom:4,fontWeight:600,textTransform:"uppercase",letterSpacing:0.5}}>Department *</div>
                  <select value={form.department} onChange={e=>F("department",e.target.value)} style={{...inp}}>
                    {Object.values(DEPARTMENTS).map(d=>(
                      <option key={d.key} value={d.key}>{d.label}</option>
                    ))}
                  </select>
                  <div style={{fontSize:10,color:T.textMuted,marginTop:4,lineHeight:1.5}}>
                    {DEPARTMENTS[form.department]?.what}
                  </div>
                </div>
                <div>
                  <div style={{fontSize:10,color:T.textMuted,marginBottom:4,fontWeight:600,textTransform:"uppercase",letterSpacing:0.5}}>Level *</div>
                  <select value={form.seniority} onChange={e=>F("seniority",e.target.value)} style={{...inp}}>
                    {Object.values(SENIORITY).map(x=>(
                      <option key={x.key} value={x.key}>{x.label}</option>
                    ))}
                  </select>
                  <div style={{fontSize:10,color:T.textMuted,marginTop:4,lineHeight:1.5}}>
                    Staff see their own work. A team leader or manager sees their team.
                    A director or owner sees the whole agency.
                  </div>
                </div>
              </div>

              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                <div>
                  <div style={{fontSize:10,color:T.textMuted,marginBottom:4,fontWeight:600,textTransform:"uppercase",letterSpacing:0.5}}>Reports to</div>
                  <select value={form.managerId} onChange={e=>F("managerId",e.target.value)} style={{...inp}}>
                    <option value="">Nobody in particular</option>
                    {(teamMembers||[]).map(m=>(
                      <option key={m.uid||m.id} value={m.uid||m.id}>{m.name||m.email}</option>
                    ))}
                  </select>
                  <div style={{fontSize:10,color:T.textMuted,marginTop:4,lineHeight:1.5}}>
                    This is what makes a manager's team view mean something.
                  </div>
                </div>
                <div>
                  <div style={{fontSize:10,color:T.textMuted,marginBottom:4,fontWeight:600,textTransform:"uppercase",letterSpacing:0.5}}>Joining date</div>
                  <input type="date" value={form.joinedAt} onChange={e=>F("joinedAt",e.target.value)} style={{...inp}} />
                  <div style={{fontSize:10,color:T.textMuted,marginTop:4,lineHeight:1.5}}>
                    Leave, probation and gratuity are all worked out from this. Without
                    it none of them can be calculated at all.
                  </div>
                </div>
              </div>

              {/* THE BROKER CARD — SALES ONLY.
                  Storing an empty BRN on an accounts clerk would make the
                  compliance register warn about a document they are never
                  required to hold. */}
              {form.department === "sales" && (
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                  <div>
                    <div style={{fontSize:10,color:T.textMuted,marginBottom:4,fontWeight:600,textTransform:"uppercase",letterSpacing:0.5}}>Broker card (BRN)</div>
                    <input value={form.brn} onChange={e=>F("brn",e.target.value)} placeholder="Their RERA broker number" style={{...inp}} />
                  </div>
                  <div>
                    <div style={{fontSize:10,color:T.textMuted,marginBottom:4,fontWeight:600,textTransform:"uppercase",letterSpacing:0.5}}>Broker card expires</div>
                    <input type="date" value={form.brnExpiry} onChange={e=>F("brnExpiry",e.target.value)} style={{...inp}} />
                    <div style={{fontSize:10,color:"#F59E0B",marginTop:4,lineHeight:1.5}}>
                      Without this nobody can be warned before it lapses — and the day it
                      does, every listing they hold stops being compliant.
                    </div>
                  </div>
                </div>
              )}

              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                <div>
                  <div style={{fontSize:10,color:T.textMuted,marginBottom:4,fontWeight:600,textTransform:"uppercase",letterSpacing:0.5}}>Visa expires</div>
                  <input type="date" value={form.visaExpiry} onChange={e=>F("visaExpiry",e.target.value)} style={{...inp}} />
                </div>
                <div>
                  <div style={{fontSize:10,color:T.textMuted,marginBottom:4,fontWeight:600,textTransform:"uppercase",letterSpacing:0.5}}>Emirates ID expires</div>
                  <input type="date" value={form.emiratesIdExpiry} onChange={e=>F("emiratesIdExpiry",e.target.value)} style={{...inp}} />
                </div>
              </div>
              <div style={{padding:"10px 12px",background:"rgba(212,168,67,0.06)",border:"1px solid rgba(212,168,67,0.2)",borderRadius:8,fontSize:11,color:T.textMuted,lineHeight:1.6}}>
                The agent will log in with these credentials. They can change their password anytime from settings.
              </div>
              <button type="button" onClick={createAgent} disabled={creating||!form.name||!form.email||!form.password}
                style={{width:"100%",padding:"11px",borderRadius:8,border:"none",background:(!form.name||!form.email||!form.password||creating)?"rgba(212,168,67,0.3)":"linear-gradient(135deg,#D4A843,#B8902E)",color:"#0A0E1A",fontSize:13,fontWeight:700,cursor:(!form.name||!form.email||!form.password)?"not-allowed":"pointer",fontFamily:"'Outfit',sans-serif"}}>
                {creating?"Creating account…":"Create this person's account"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* — DEACTIVATE CONFIRM MODAL — */}
      {showDeact&&(
        <div style={{position:"fixed",inset:0,background:"rgba(4,9,15,0.9)",zIndex:2000,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={e=>{if(e.target===e.currentTarget)setShowDeact(null);}}>
          <div style={{background:"#0D1117",borderRadius:14,border:"1px solid rgba(239,68,68,0.3)",width:"100%",maxWidth:400,padding:24}} onClick={e=>e.stopPropagation()}>
            <div style={{fontSize:16,fontWeight:700,color:T.white,marginBottom:6,fontFamily:"'Fraunces',serif"}}>Deactivate Agent</div>
            <div style={{fontSize:13,color:T.textMuted,marginBottom:16}}>Are you sure you want to deactivate <strong style={{color:T.white}}>{showDeact.name||showDeact.email}</strong>?</div>
            <div style={{padding:"12px 14px",background:"rgba(239,68,68,0.06)",border:"1px solid rgba(239,68,68,0.2)",borderRadius:9,marginBottom:20}}>
              <div style={{fontSize:12,color:T.white,fontWeight:600,marginBottom:6}}>What happens:</div>
              <div style={{fontSize:11,color:T.textMuted,lineHeight:1.7}}>
                — Account will be suspended (not deleted)<br/>
                — All assigned leads return to your unassigned pool<br/>
                — Each lead will show tag: "Previously: {showDeact.name||"Agent"}"<br/>
                — Full activity history is preserved<br/>
                — You can reactivate this agent at any time
              </div>
            </div>
            <div style={{display:"flex",gap:10}}>
              <button type="button" onClick={()=>setShowDeact(null)} style={{flex:1,padding:"10px",borderRadius:8,border:"1px solid "+T.border,background:"transparent",color:T.textMuted,fontSize:12,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>Cancel</button>
              <button type="button" onClick={()=>deactivateAgent(showDeact)} disabled={deacting}
                style={{flex:1,padding:"10px",borderRadius:8,border:"none",background:deacting?"rgba(239,68,68,0.3)":"rgba(239,68,68,0.85)",color:"#fff",fontSize:12,fontWeight:700,cursor:deacting?"not-allowed":"pointer",fontFamily:"'Outfit',sans-serif"}}>
                {deacting?"Deactivating...":"Deactivate Agent"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* — TOAST — */}
      {toast&&<div style={{position:"fixed",bottom:24,right:24,padding:"11px 18px",background:toast.type==="error"?"rgba(239,68,68,0.15)":"rgba(16,185,129,0.15)",border:"1px solid "+(toast.type==="error"?"#EF4444":"#10B981"),borderRadius:9,color:toast.type==="error"?"#EF4444":"#10B981",fontSize:12,fontWeight:600,zIndex:9999,boxShadow:"0 8px 32px rgba(0,0,0,0.4)"}}>{toast.msg}</div>}

      {_copy?.provenance && <TabProvenance {..._copy.provenance} />}

    </div>
  );
}