/* eslint-disable */
/*
  DXB Analytics  MY LEADS TAB
  Session 11  4-Level Role-Aware CRM
  Owner / Director / Manager / Agent
  April 2026
*/

import React, { useState, useMemo, useCallback, useEffect } from "react";
import { collection, doc, addDoc, updateDoc, serverTimestamp, query, where, getDocs, arrayUnion } from "firebase/firestore";
import { db, auth } from "../firebase";
import { T } from "../data";
import { GOLDEN_VISA_THRESHOLD } from "../utils/constants";
import Papa from "papaparse";
import PhoneInput from "../components/PhoneInput";
import { responseTime, responseReport } from "../crm/model/intake";
import { viewerFrom, scopeFor, intentFor, visibleRecords, canSeeClientContact } from "../crm/model/org";
import NationalitySelect from "../components/NationalitySelect";

//  PIPELINE 
const PIPELINE = [
  { key:"Hot Case",        color:"#EF4444", bg:"rgba(239,68,68,0.1)" },
  { key:"New Lead",        color:"#3B82F6", bg:"rgba(59,130,246,0.1)" },
  { key:"Potential",       color:"#10B981", bg:"rgba(16,185,129,0.1)" },
  { key:"No Answer",       color:"#F59E0B", bg:"rgba(245,158,11,0.1)" },
  { key:"Low Budget",      color:"#8B5CF6", bg:"rgba(139,92,246,0.1)" },
  { key:"Non Potential",   color:"#6B7280", bg:"rgba(107,114,128,0.1)" },
  { key:"Whats app",       color:"#25D366", bg:"rgba(37,211,102,0.1)" },
  { key:"Resale/buy/Rent", color:"#14B8A6", bg:"rgba(20,184,166,0.1)" },
  { key:"EOI",             color:"#D4A843", bg:"rgba(212,168,67,0.1)" },
  { key:"Closed Deal",     color:"#10B981", bg:"rgba(16,185,129,0.15)" },
  { key:"Closed Outside",  color:"#EF4444", bg:"rgba(239,68,68,0.08)" },
];

/* These eleven stages are this agency's own, not an industry standard, and the
   tab never said what any of them meant — a new agent had to guess whether a
   buyer belonged in "Potential" or "Resale/buy/Rent". Written as instructions
   for when to use each one, so two agents on the same desk agree. */
const STAGE_MEANING = {
  "Hot Case":        "Ready now — viewing booked, offer being drafted, or asking to sign.",
  "New Lead":        "Just arrived. Nobody has spoken to them yet.",
  "Potential":       "You have spoken and they are genuinely looking. Keep working it.",
  "No Answer":       "You tried to reach them and could not. Try again before this goes quiet.",
  "Low Budget":      "Real buyer, but their budget does not reach what they asked for.",
  "Non Potential":   "Not a buyer — wrong market, testing prices, or a wrong number.",
  "Whats app":       "Only ever messaged you. No call has connected yet.",
  "Resale/buy/Rent": "Wants the resale market or a rental rather than a new launch.",
  "EOI":             "Expression of Interest lodged on a launch. Money or paperwork is in.",
  "Closed Deal":     "Signed with you. This is the only stage that counts as a sale.",
  "Closed Outside":  "Bought or rented, but not through you. Kept so the loss is visible.",
};

const SRC_COLOR = {
  "Property Finder":"#00C08B","Bayut":"#FF6B35","Dubizzle":"#E8003D",
  "Meta/Facebook":"#1877F2","Instagram":"#E1306C","WhatsApp":"#25D366",
  "Google Ads":"#4285F4","Referral":"#8B5CF6","Website":"#14B8A6",
  "Cold Call":"#F59E0B","TikTok":"#FF0050","LinkedIn":"#0A66C2",
  "Email Campaign":"#EA4335","Walk In":"#6B7280","Manual":"#94A3B8",
};

const LEAD_SOURCES   = Object.keys(SRC_COLOR);
const SERVICE_TYPES  = ["Buyer","Seller","Tenant","Investor"];
const REQUEST_TYPES  = ["Off-Plan","Ready","Resale","Rental","Investment","Commercial"];
const CHANNELS       = ["WhatsApp","Phone Call","Email","In Person","Video Call","Social DM"];
const NATS           = ["Indian","British","Russian","Chinese","French","Pakistani","Saudi","Egyptian","German","American","Italian","Canadian","Australian","Japanese","Korean","Emirati","Filipino","Lebanese","Jordanian","Other"];
const TIMELINES      = ["Immediate","1-3 months","3-6 months","6-12 months","Just browsing"];
const NOTE_TYPES     = ["Note","Call","Email","WhatsApp","Viewing","Offer","Follow Up","Status Update"];
const GV_MIN         = typeof GOLDEN_VISA_THRESHOLD !== "undefined" ? GOLDEN_VISA_THRESHOLD : 2000000;

const WA_TEMPLATES = [
  { label:"First Contact",   body:"Hello {name}, I came across your enquiry. I am {agent} from {org}. We have excellent options matching your requirements in Dubai. When would be a good time to connect?" },
  { label:"Follow Up",       body:"Hello {name}, following up on your property search. We have new listings matching your budget. Would you like to schedule a viewing this week?" },
  { label:"Viewing Confirm", body:"Hello {name}, confirming your property viewing. Please let me know if you need to reschedule. Looking forward to meeting you!" },
  { label:"Offer Made",      body:"Hello {name}, great news! We have submitted your offer. I will update you as soon as we hear back." },
  /* The threshold is read from GV_MIN rather than typed. This message goes to a
     buyer over WhatsApp, so a stale figure here is not a display bug — it is an
     agent telling a client they qualify for a visa when they do not. GV_MIN
     already existed in this file, derived from the shared constant, and the
     template ignored it. */
  { label:"Golden Visa",     body:`Hello {name}, based on your budget you qualify for the UAE Golden Visa (AED ${(GV_MIN/1e6).toFixed(0)}M+ property investment), which carries 10-year renewable residency. Eligibility is confirmed by ICP, not by us — shall I walk you through the requirements?` },
  { label:"Market Update",   body:"Hello {name}, prices in your preferred area have moved. I have great options within your budget. Shall we connect?" },
  { label:"EOI Follow Up",   body:"Hello {name}, thank you for your Expression of Interest. We have reviewed your request and have excellent options. When can we connect?" },
];

//  HELPERS 
const clnPhone  = p => String(p||"").replace(/[^0-9]/g,"");
/* The mask characters between the two halves had been stripped, so
   971501234567 rendered as "97167" — which reads as a real, short number
   rather than a hidden one. An agent could copy it and dial it. */
const maskPhone = p => { if(!p) return ""; const c=clnPhone(p); if(c.length<6) return p; return c.slice(0,3)+" •••• "+c.slice(-2); };
const fmtB      = b => { const n=parseFloat(b||0); if(!n) return ""; return n>=1e6?"AED "+(n/1e6).toFixed(1)+"M":"AED "+n.toLocaleString(); };
const fmtD      = d => { if(!d) return ""; try { return new Date(d).toLocaleDateString("en-AE",{day:"2-digit",month:"short",year:"2-digit"}); } catch(e){return "";} };
const daysAgo   = d => !d ? 999 : Math.floor((Date.now()-new Date(d).getTime())/86400000);
const escCSV    = v => '"'+String(v==null?"":v).replace(/"/g,'""')+'"';

/* HOW THE CALL ORDER IS DECIDED — AND WHY IT IS NO LONGER A SCORE
 * ═══════════════════════════════════════════════════════════════════════════
 * This was `aiScore()`: a hand-written weighted sum sold to paying customers
 * as artificial intelligence. No model was ever involved. It awarded 25 points
 * for holding both a phone and an email, 20 for a budget above five million,
 * 20 for being under a day old, 15 for an "Immediate" timeline — and 5 points
 * for having a nationality recorded, so a lead's Hot/Warm/Cold label moved
 * according to whether somebody had filled in an ethnicity field. The weights
 * were invented. Nobody could defend the difference between 69 and 70, and yet
 * 70 was the line between "Hot" and "Warm", and it drove the Hot counter, the
 * Hot view, the agent leaderboard and a sort option.
 *
 * It also decayed on the calendar alone. The same buyer, unchanged, lost the
 * twenty freshness points within a week. An agent who watches a serious client
 * fade from Hot to Warm while nothing about that client has changed learns,
 * correctly, to ignore the label.
 *
 * What replaces it is a RULE, printed on screen above the list, in the order
 * an agent actually works a desk: nobody has called them yet, or a promise has
 * been broken, or they have gone quiet. Every lead carries its reason in plain
 * words on its own row. There is no number to argue with because there is no
 * number — and no claim of intelligence that the code cannot support.
 */
const OPEN      = l => !["Closed Deal","Closed Outside","Non Potential"].includes(l.status);
const contacted = l => (l.notes_log||[]).some(n=>["Call","WhatsApp","Email","Viewing","Offer"].includes(n.type));

/** The order, in the words shown to the user. Printed in full by CALL_ORDER. */
const CALL_ORDER = [
  "Came in today and nobody has called yet",
  "A follow-up you promised is due or overdue",
  "Never contacted, whatever its age",
  "No contact for more than 7 days",
  "Everything else, most recently touched first",
];

/** Lower rank = call sooner. `reason` is rendered verbatim on the row. */
function attention(l) {
  if(!OPEN(l)) return { rank:9, reason:l.status==="Closed Deal"?"Closed — won":"Closed", urgent:false, color:T.textMuted };
  const age   = l.createdAt ? daysAgo(l.createdAt) : null;
  const quiet = (l.updatedAt||l.createdAt) ? daysAgo(l.updatedAt||l.createdAt) : null;
  const due   = l.followUpDate ? Math.floor((Date.now()-new Date(l.followUpDate).getTime())/86400000) : null;
  const day   = n => n===1?"1 day":`${n} days`;

  if(!contacted(l)&&age===0)  return { rank:0, reason:"Came in today, not called yet", urgent:true,  color:"#EF4444" };
  if(due!=null&&due>=0)       return { rank:1, reason:due===0?"Follow-up due today":`Follow-up was due ${day(due)} ago`, urgent:true, color:"#EF4444" };
  if(!contacted(l))           return { rank:2, reason:age==null?"Never contacted":`Never contacted — ${day(age)} old`, urgent:true, color:"#F59E0B" };
  if(quiet!=null&&quiet>7)    return { rank:3, reason:`No contact for ${day(quiet)}`, urgent:true,  color:"#F59E0B" };
  if(age===0)                 return { rank:4, reason:"Came in today", urgent:false, color:"#10B981" };
  return { rank:5, reason:quiet===0?"Spoke today":quiet==null?"In progress":`Last spoke ${day(quiet)} ago`, urgent:false, color:T.textSecondary };
}

//  ATOMS 
const PBadge = ({status}) => {
  const p=PIPELINE.find(x=>x.key===status)||PIPELINE[1];
  return <span style={{fontSize:10,padding:"2px 8px",borderRadius:10,background:p.bg,color:p.color,fontWeight:700,whiteSpace:"nowrap"}}>{status||"New Lead"}</span>;
};

/* A progress bar filled to an invented percentage told an agent nothing they
   could act on or repeat. The reason itself is shorter to read and is the
   instruction. */
const WhyNow = ({lead}) => {
  const a=attention(lead);
  return <span title="Why this lead sits where it does in the list"
    style={{fontSize:10,color:a.color,fontWeight:a.urgent?700:500,whiteSpace:"nowrap",
            overflow:"hidden",textOverflow:"ellipsis",display:"block"}}>
    {a.urgent?"● ":""}{a.reason}
  </span>;
};

const EyePhone = ({phone}) => {
  const [show,setShow]=useState(false);
  return <span style={{display:"inline-flex",alignItems:"center",gap:4}}>
    <span style={{fontSize:11,color:T.textSecondary,fontFamily:"monospace"}}>{show?phone:maskPhone(phone)}</span>
    <button type="button" onClick={e=>{e.stopPropagation();setShow(v=>!v);}} style={{background:"none",border:"none",cursor:"pointer",color:T.textMuted,padding:"1px 3px",display:"inline-flex"}}>
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">{show?<><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></>:<><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>}</svg>
    </button>
  </span>;
};

const Lbl = ({children}) => <div style={{fontSize:10,color:T.textMuted,marginBottom:4,fontWeight:600,textTransform:"uppercase",letterSpacing:0.5}}>{children}</div>;
const Inp = ({value,onChange,placeholder,type="text",disabled=false}) => (
  <input type={type} value={value||""} onChange={e=>onChange(e.target.value)} placeholder={placeholder} disabled={disabled}
    style={{width:"100%",padding:"8px 10px",background:disabled?"rgba(255,255,255,0.02)":"rgba(255,255,255,0.04)",border:"1px solid "+T.border,borderRadius:7,color:T.white,fontSize:12,outline:"none",boxSizing:"border-box",fontFamily:"'Outfit',sans-serif"}}/>
);
const Sel = ({value,onChange,children,disabled=false}) => (
  <select value={value||""} onChange={e=>onChange(e.target.value)} disabled={disabled}
    style={{width:"100%",padding:"8px 10px",background:disabled?"rgba(255,255,255,0.02)":"rgba(255,255,255,0.04)",border:"1px solid "+T.border,borderRadius:7,color:T.white,fontSize:12,outline:"none",fontFamily:"'Outfit',sans-serif"}}>
    {children}
  </select>
);

const Section = ({icon,title,sub,color,open,onToggle,children}) => (
  <div style={{background:"rgba(255,255,255,0.02)",border:"1px solid "+T.border,borderRadius:10,marginBottom:10,overflow:"hidden"}}>
    <div style={{padding:"11px 14px",display:"flex",alignItems:"center",gap:10,cursor:"pointer",borderBottom:open?"1px solid "+T.border:"none"}} onClick={onToggle}>
      {/* Every caller passes icon="" — this rendered three empty coloured squares.
          A bar in the section's colour reads as deliberate; a blank box does not. */}
      <div style={{width:icon?28:3,height:28,borderRadius:icon?6:2,background:color+(icon?"18":"AA"),display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
        {icon?<span style={{fontSize:14}}>{icon}</span>:null}
      </div>
      <div style={{flex:1}}>
        <div style={{fontSize:12,fontWeight:700,color:T.white}}>{title}</div>
        {sub&&<div style={{fontSize:10,color:T.textMuted,marginTop:1}}>{sub}</div>}
      </div>
      <div style={{color:T.textMuted,fontSize:12,transition:"transform 0.2s",transform:open?"rotate(90deg)":"none"}}>▸</div>
    </div>
    {open&&<div style={{padding:"14px"}}>{children}</div>}
  </div>
);

// 
// MAIN COMPONENT
// 
export default function MyLeadsTab({ liveNeighbourhoods=[],
  myLeads=[], orgRole, userRole, orgId, orgName,
  listings=[], teamMembers=[], firebaseUser,
  leadSortBy, setLeadSortBy,
  selectedLead, setSelectedLead,
  handleTabChange,
}) {

  /* WHO IS LOOKING, AND HOW MUCH OF THE DESK THEY SEE.
     ─────────────────────────────────────────────────────────────────────────
     This was five booleans off `orgRole`, and every difference between an agent
     and an owner was an `if` further down the file. That is why the two of them
     saw almost the same screen, and why there was nowhere at all to put a sales
     admin or an accounts clerk.

     Now the tab asks src/crm/model/org.js one question — how much of "leads"
     may this person see — and renders that. A department added to the model is
     a table entry there, not another conditional here. */
  const me     = useMemo(() => viewerFrom({ firebaseUser, orgRole, userRole, teamMembers }),
                         [firebaseUser, orgRole, userRole, teamMembers]);
  const scope  = scopeFor(me, "leads");
  const intent = intentFor(me, "leads");
  const seeContacts = canSeeClientContact(me);

  const isSuperAdmin = me.platformAdmin;
  const isAgent      = scope === "own";
  /* Judging other people is its own permission, not a job title.
     The LEADERBOARD ranks colleagues and shows pipeline value, so it needs both
     the whole agency's leads AND the right to see money — which is why a sales
     admin, who sees every lead, does not get it.
     AGENT PERFORMANCE is counts without money, so a team lead gets it too. */
  const seesLeaderboard = scope === "org" && scopeFor(me, "money") === "org";
  const seesTeamPerformance = scope === "org" || scope === "team";
  const canManage    = scope === "org" || scope === "team";
  const canSee       = scope !== "none";
  const currentUid   = firebaseUser?.uid||auth?.currentUser?.uid||"";
  const currentEmail = firebaseUser?.email||auth?.currentUser?.email||"";

  //  State 
  const [smartView,    setSmartView]   = useState("all");
  const [activeStage,  setActiveStage] = useState("all");
  const [view,         setView]        = useState("table");
  const [showHelp,     setShowHelp]    = useState(false);
  const [showAdd,      setShowAdd]     = useState(false);
  const [showWA,       setShowWA]      = useState(false);
  const [showAssign,   setShowAssign]  = useState(null);
  const [drawerTab,    setDrawerTab]   = useState("profile");
  const [aiSearch,     setAiSearch]    = useState("");
  const [filterSource, setFilterSource]= useState("all");
  const [filterBudget, setFilterBudget]= useState("all");
  const [filterService,setFilterService]=useState("all");
  const [filterAgent,  setFilterAgent] = useState("all");
  const [filterManager,setFilterManager]=useState("all");
  const [toast,        setToast]       = useState(null);
  const [saving,       setSaving]      = useState(false);
  const [noteText2,    setNoteText2]   = useState("");
  const [noteType2,    setNoteType2]   = useState("Note");
  const [savingNote,   setSavingNote]  = useState(false);
  const [openSec,      setOpenSec]     = useState({contact:true,request:true,agent:false,extra:false});

  
  // Community suggestions based on lead budget
  const getCommunitySuggestions = React.useCallback((budget) => {
    const b = parseFloat(budget||0);
    if(!b || !liveNeighbourhoods.length) return [];
    // Suggest communities where typical 1BR (750sqft) fits in budget
    return liveNeighbourhoods
      .filter(n => {
        const typicalPrice = (n.avgPpsf||0) * 750;
        return typicalPrice > 0 && typicalPrice <= b * 1.2 && typicalPrice >= b * 0.5;
      })
      .sort((a,b) => (b.investmentScore||0)-(a.investmentScore||0))
      .slice(0,5);
  }, [liveNeighbourhoods]);
  const EMPTY={name:"",phone:"",email:"",budget:"",requestType:"",serviceType:"Buyer",
    project:"",source:"Manual",channel:"WhatsApp",campaign:"",status:"New Lead",
    nationality:"",language:"",timeline:"",community:"",bedrooms:"",comment:"",
    agentId:"",agentName:"",adName:"",adAccount:""};
  const [form,setForm]=useState(EMPTY);
  const F=(k,v)=>setForm(p=>({...p,[k]:v}));

  //  Derived lists 
  const agents = useMemo(()=>(
    (teamMembers||[]).filter(m=>m.orgRole==="agent"||m.role==="agent")
  ),[teamMembers]);

  const managers = useMemo(()=>(
    (teamMembers||[]).filter(m=>m.orgRole==="manager"||m.orgRole==="director"||m.orgRole==="owner")
  ),[teamMembers]);

  //  Toast 
  const notify = useCallback((msg,type="success")=>{
    setToast({msg,type});
    setTimeout(()=>setToast(null),3000);
  },[]);

  /* THE FILTER THAT MAKES SCOPE REAL.
     An agent's desk is their own leads; a manager's is their team's; a
     director, an owner, sales admin and the platform admin see the agency's.
     Every counter, chip, board and export below reads `allLeads`, so scoping
     here scopes the whole tab rather than each figure separately — which is
     how a "total" quietly ends up counting rows the viewer cannot open. */
  const allLeads  = useMemo(
    () => visibleRecords(me, "leads", myLeads || [], { ownerField: "assignedTo", teamIds: me.teamIds }),
    [me, myLeads]);

  //  Counts 
  const stageCounts = useMemo(()=>{
    const c={};
    PIPELINE.forEach(p=>{c[p.key]=allLeads.filter(l=>(l.status||"New Lead")===p.key).length;});
    return c;
  },[allLeads]);

  //  Smart view filter 
  const smartFiltered = useMemo(()=>{
    let a=[...allLeads];
    if(smartView==="today")       a=a.filter(l=>daysAgo(l.createdAt)<1);
    if(smartView==="my_leads")    a=a.filter(l=>l.assignedTo===currentUid||l.createdBy===currentUid);
    if(smartView==="hot")         a=a.filter(l=>attention(l).urgent);
    if(smartView==="stale")       a=a.filter(l=>!["Closed Deal","Closed Outside"].includes(l.status)&&daysAgo(l.updatedAt||l.createdAt)>7);
    if(smartView==="overdue")     a=a.filter(l=>l.followUpDate&&new Date(l.followUpDate)<new Date()&&!["Closed Deal","Closed Outside"].includes(l.status));
    if(smartView==="uncontacted") a=a.filter(l=>!(l.notes_log||[]).some(n=>["Call","WhatsApp","Email"].includes(n.type)));
    if(smartView==="unassigned")  a=a.filter(l=>!l.assignedTo||l.assignedTo==="");
    if(smartView==="golden_visa") a=a.filter(l=>parseFloat(l.budget||0)>=GV_MIN);
    return a;
  },[allLeads,smartView,currentUid]);

  //  Main filter 
  const filtered = useMemo(()=>{
    let a=[...smartFiltered];
    if(activeStage!=="all")  a=a.filter(l=>(l.status||"New Lead")===activeStage);
    if(filterAgent!=="all")  a=a.filter(l=>l.assignedTo===filterAgent);
    if(filterManager!=="all") a=a.filter(l=>l.managerId===filterManager);
    if(filterService!=="all") a=a.filter(l=>(l.serviceType||l.type||"")===filterService);
    if(filterSource!=="all")  a=a.filter(l=>l.source===filterSource);
    if(filterBudget!=="all"){
      const b=l=>parseFloat(l.budget||0);
      if(filterBudget==="under1m")  a=a.filter(l=>b(l)<1e6);
      if(filterBudget==="1to3m")    a=a.filter(l=>b(l)>=1e6&&b(l)<3e6);
      if(filterBudget==="3to5m")    a=a.filter(l=>b(l)>=3e6&&b(l)<5e6);
      if(filterBudget==="5to10m")   a=a.filter(l=>b(l)>=5e6&&b(l)<1e7);
      if(filterBudget==="above10m") a=a.filter(l=>b(l)>=1e7);
    }
    if(aiSearch.trim()){
      const q=aiSearch.trim().toLowerCase();
      a=a.filter(l=>(l.name||"").toLowerCase().includes(q)||(l.phone||"").includes(q)||(l.email||"").toLowerCase().includes(q)||(l.community||"").toLowerCase().includes(q)||(l.assignedToName||"").toLowerCase().includes(q));
    }
    const sorted=[...a];
    /* Call order: the rule first, then the one who has waited longest inside
       the same reason — so two uncontacted leads are not left in arbitrary order. */
    if(leadSortBy==="score")   sorted.sort((a,b)=>attention(a).rank-attention(b).rank
                                              || daysAgo(b.updatedAt||b.createdAt)-daysAgo(a.updatedAt||a.createdAt));
    else if(leadSortBy==="budget") sorted.sort((a,b)=>parseFloat(b.budget||0)-parseFloat(a.budget||0));
    else if(leadSortBy==="name")   sorted.sort((a,b)=>(a.name||"").localeCompare(b.name||""));
    else sorted.sort((a,b)=>new Date(b.createdAt||0)-new Date(a.createdAt||0));
    return sorted;
  },[smartFiltered,activeStage,filterAgent,filterManager,filterService,filterSource,filterBudget,aiSearch,leadSortBy]);

  //  KPIs 
  const kTotal    = allLeads.length;
  const kToday    = allLeads.filter(l=>daysAgo(l.createdAt)<1).length;
  const kHot      = allLeads.filter(l=>attention(l).urgent).length;
  const kClosed   = allLeads.filter(l=>l.status==="Closed Deal").length;
  const kStale    = allLeads.filter(l=>!["Closed Deal","Closed Outside","Non Potential"].includes(l.status)&&daysAgo(l.updatedAt||l.createdAt)>7).length;
  const kPipeline = allLeads.reduce((s,l)=>s+parseFloat(l.budget||0),0);
  const kUnassigned = allLeads.filter(l=>!l.assignedTo).length;
  const kConvRate = kTotal>0?Math.round((kClosed/kTotal)*100):0;
  const kResponse = useMemo(()=>responseReport(allLeads),[allLeads]);

  //  Agent performance (manager/owner/director) 
  const agentPerf = useMemo(()=>{
    if(!canManage) return [];
    return agents.map(agent=>{
      const uid=agent.uid||agent.id;
      const aLeads=allLeads.filter(l=>l.assignedTo===uid);
      const closed=aLeads.filter(l=>l.status==="Closed Deal").length;
      const hot=aLeads.filter(l=>attention(l).urgent).length;
      const stale=aLeads.filter(l=>!["Closed Deal","Closed Outside"].includes(l.status)&&daysAgo(l.updatedAt||l.createdAt)>7).length;
      const conv=aLeads.length>0?((closed/aLeads.length)*100).toFixed(1):"0.0";
      const pipeline=aLeads.reduce((s,l)=>s+parseFloat(l.budget||0),0);
      const lastAct=aLeads.reduce((latest,l)=>{const d=new Date(l.updatedAt||l.createdAt||0);return d>latest?d:latest;},new Date(0));
      return {...agent,total:aLeads.length,closed,hot,stale,conv,pipeline,lastActive:lastAct.getTime()>0?lastAct:null};
    }).sort((a,b)=>b.closed-a.closed);
  },[agents,allLeads,canManage]);

  //  Leaderboard (owner view)  ranked by combined score 
  const leaderboard = useMemo(()=>{
    if(!seesLeaderboard) return [];
    /* This ranked the agency's own staff by (closed × 10) + (conversion × 2) +
       (pipeline in millions × 0.5), capped at fifty million. Those five numbers
       were invented — nothing in the business decided that one closed deal is
       worth five points of conversion rate. An owner reading that column was
       being handed a judgement of their people with no basis behind it.
       Ranking is now by deals actually closed, then by conversion, and the
       Score column is gone. Both are facts the agent can dispute. */
    return [...agentPerf].sort((a,b)=>b.closed-a.closed
                                  || parseFloat(b.conv||0)-parseFloat(a.conv||0)
                                  || b.total-a.total);
  },[agentPerf,seesLeaderboard]);

  //  Source stats 
  const srcStats = useMemo(()=>{
    const m={};
    allLeads.forEach(l=>{const s=l.source||"Manual";if(!m[s])m[s]={t:0,c:0};m[s].t++;if(l.status==="Closed Deal")m[s].c++;});
    return Object.entries(m).map(([s,d])=>({src:s,total:d.t,closed:d.c,rate:d.t>0?Math.round(d.c*100/d.t):0})).sort((a,b)=>b.total-a.total);
  },[allLeads]);

  //  Property matching 
  const matched = useMemo(()=>{
    if(!selectedLead||!listings) return [];
    const b=parseFloat(selectedLead.budget||0);
    return (listings||[]).filter(l=>{
      const lp=parseFloat(l.price||l.priceMin||0);
      return (b>0?lp<=b*1.25&&lp>=b*0.6:true)&&(selectedLead.community?(l.community||"").toLowerCase().includes((selectedLead.community||"").toLowerCase()):true);
    }).slice(0,4);
  },[selectedLead,listings]);

  //  Save lead 
  const saveLead = useCallback(async()=>{
    if(!form.name||!form.phone){notify("Name and phone are required","error");return;}
    setSaving(true);
    try{
      const agentId   = form.agentId||(isAgent?currentUid:"");
      const agentName = form.agentName||(isAgent?(firebaseUser?.displayName||currentEmail):"");
      await addDoc(collection(db,"leads"),{
        name:form.name.trim(),phone:form.phone.trim(),email:form.email.trim(),
        budget:parseFloat(form.budget)||0,
        requestType:form.requestType,serviceType:form.serviceType,type:form.serviceType,
        project:form.project,source:form.source,channel:form.channel,
        campaign:form.campaign,adName:form.adName,adAccount:form.adAccount,
        status:form.status||"New Lead",
        nationality:form.nationality,language:form.language,
        timeline:form.timeline,community:form.community,
        bedrooms:form.bedrooms,comment:form.comment,
        assignedTo:agentId,assignedToName:agentName,
        orgId:orgId||"",
        createdBy:currentUid,
        createdAt:new Date().toISOString(),
        updatedAt:new Date().toISOString(),
        tags:[],
        notes_log:[{text:"Lead created",type:"Note",by:currentEmail,at:new Date().toISOString()}],
      });
      setForm(EMPTY);setShowAdd(false);notify("Lead saved successfully");
    }catch(e){console.error(e);notify("Save failed: "+e.message,"error");}
    setSaving(false);
  },[form,isAgent,currentUid,currentEmail,orgId,notify]);

  //  Update status 
  const updateStatus = useCallback(async(leadId,newStatus)=>{
    try{
      const entry={text:"Status changed to "+newStatus,type:"Status Update",by:currentEmail,at:new Date().toISOString()};
      await updateDoc(doc(db,"leads",leadId),{status:newStatus,updatedAt:new Date().toISOString(),notes_log:arrayUnion(entry)});
      if(selectedLead?.id===leadId) setSelectedLead(l=>({...l,status:newStatus,notes_log:[...(l.notes_log||[]),entry]}));
      notify("Status updated");
    }catch(e){notify("Update failed","error");}
  },[currentEmail,selectedLead,setSelectedLead,notify]);

  //  Assign lead 
  const assignLead = useCallback(async(leadId,agent)=>{
    try{
      const entry={text:"Lead assigned to "+agent.name,type:"Note",by:currentEmail,at:new Date().toISOString()};
      await updateDoc(doc(db,"leads",leadId),{
        assignedTo:agent.uid||agent.id,assignedToName:agent.name,
        managerId:agent.managerId||"",
        directorId:agent.directorId||"",
        assignedAt:new Date().toISOString(),
        updatedAt:new Date().toISOString(),notes_log:arrayUnion(entry),
      });
      if(selectedLead?.id===leadId) setSelectedLead(l=>({...l,assignedTo:agent.uid||agent.id,assignedToName:agent.name}));
      setShowAssign(null);notify("Lead assigned to "+agent.name);
// Send in-platform notification to agent
try{
  const {addDoc:aDoc,collection:col,getFirestore}=await import("firebase/firestore");
  const fdb=getFirestore();
  await aDoc(col(fdb,"notifications"),{
    userId:agent.uid||agent.id,
    type:"lead_assigned",
    icon:"👤",
    title:"New lead assigned to you",
    body:"Lead: "+(selectedLead?.name||leadId),
    read:false,
    priority:"high",
    createdAt:new Date().toISOString(),
  });
}catch(e){console.warn("Notif failed",e);}
    }catch(e){notify("Assign failed","error");}
  },[currentEmail,selectedLead,setSelectedLead,notify]);

  //  Add note 
  const addNote = useCallback(async(leadId)=>{
    if(!noteText2.trim()) return;
    setSavingNote(true);
    try{
      const entry={text:noteText2.trim(),type:noteType2,by:currentEmail,at:new Date().toISOString()};
      await updateDoc(doc(db,"leads",leadId),{notes_log:arrayUnion(entry),updatedAt:new Date().toISOString()});
      if(selectedLead?.id===leadId) setSelectedLead(l=>({...l,notes_log:[...(l.notes_log||[]),entry]}));
      setNoteText2("");notify("Note added");
    }catch(e){notify("Note failed","error");}
    setSavingNote(false);
  },[noteText2,noteType2,currentEmail,selectedLead,setSelectedLead,notify]);

  //  Export CSV 
  const exportCSV = useCallback(()=>{
    const h=["ID","Name","Phone","Email","Budget","Service","Request","Status","Source","Channel","AD Name","AD Account","Nationality","Community","Timeline","Agent","Why it needs attention","Created","Updated"];
    const rows=filtered.map(l=>[l.id||"",l.name||"",l.phone||"",l.email||"",l.budget||"",l.serviceType||l.type||"",l.requestType||"",l.status||"",l.source||"",l.channel||"",l.adName||"",l.adAccount||"",l.nationality||"",l.community||"",l.timeline||"",l.assignedToName||"",attention(l).reason,l.createdAt?new Date(l.createdAt).toLocaleDateString("en-GB"):"",l.updatedAt?new Date(l.updatedAt).toLocaleDateString("en-GB"):""].map(v=>escCSV(v)));
    const csv=[h.join(","),...rows.map(r=>r.join(","))].join("\n");
    const blob=new Blob([csv],{type:"text/csv"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");
    a.href=url;a.download="DXB_Leads_"+new Date().toISOString().slice(0,10)+".csv";a.click();URL.revokeObjectURL(url);
  },[filtered]);

  //  Send WA 
  const sendWA = useCallback((tmpl,lead)=>{
    if(!lead?.phone) return;
    const msg=tmpl.body
      .replace("{name}",lead.name||"")
      .replace("{agent}",firebaseUser?.displayName||"Agent")
      .replace("{org}",orgName||"DXB Analytics");
    window.open("https://wa.me/"+clnPhone(lead.phone)+"?text="+encodeURIComponent(msg),"_blank");
    setShowWA(false);
  },[orgName,firebaseUser]);

  //  Access guard 
  /* Departments that have no business with leads — Accounts, HR, IT — are told
     so plainly rather than shown an empty desk that looks like a fault. */
  if(!canSee) return (
    <div style={{padding:"70px 20px",textAlign:"center"}}>
      <div style={{fontSize:15,fontWeight:700,color:T.white,marginBottom:7,fontFamily:"'Fraunces',serif"}}>
        Leads are not part of your role
      </div>
      <div style={{fontSize:12,color:T.textSecondary,maxWidth:430,margin:"0 auto",lineHeight:1.7}}>
        This desk belongs to the sales floor. If that is wrong, your department is
        set incorrectly on your record — HR or your manager can change it.
      </div>
    </div>
  );


  return (
    <div style={{paddingBottom:80}}>

      {/*  WHAT THIS TAB IS  ─────────────────────────────────────────────────
          TAB_CLARITY.md check 1: a reader must learn what the thing IS before
          meeting a single control. This tab opened straight onto nine filter
          chips, eleven stage pills and five dropdowns, and explained none of
          them. An agent joining the agency could not tell you the difference
          between "Hot Case", "Potential" and "EOI".                          */}
      <div style={{padding:"14px 4px 12px",borderBottom:"1px solid "+T.border}}>
        <div style={{display:"flex",alignItems:"baseline",gap:10,flexWrap:"wrap",marginBottom:6}}>
          {/* The title says whose desk this is. An owner opening a screen headed
              "My leads" that in fact holds the whole agency's is being told
              something untrue about what they are looking at. */}
          <h2 style={{margin:0,fontSize:17,fontWeight:800,color:T.white,fontFamily:"'Fraunces',serif"}}>
            {intent?.title || "Leads"}
          </h2>
          <button type="button" onClick={()=>setShowHelp(v=>!v)}
            style={{background:"none",border:"1px solid "+T.border,borderRadius:14,padding:"3px 11px",
                    color:showHelp?T.gold:T.textSecondary,fontSize:11,cursor:"pointer",
                    fontFamily:"'Outfit',sans-serif"}}>
            {showHelp?"Hide the guide":"What do these mean?"}
          </button>
        </div>
        <div style={{fontSize:12,color:T.textSecondary,lineHeight:1.6,maxWidth:760}}>
          {intent?.question} {scope==="own"
            ? "These are the leads assigned to you."
            : scope==="team"
            ? "These are your team's leads — everyone who reports to you, and your own."
            : "Every enquiry the agency has taken."}{" "}
          The list is your own data — nothing here comes from the Land Department
          or any portal, and nothing is estimated or predicted.
        </div>

        {showHelp&&(
          <div style={{marginTop:12,display:"flex",gap:12,flexWrap:"wrap"}}>

            {/* Check 10: an agent's last question is always "so what do I do?" */}
            <div style={{flex:"1 1 330px",minWidth:280,background:"rgba(255,255,255,0.02)",
                         border:"1px solid "+T.border,borderRadius:10,padding:"12px 14px"}}>
              <div style={{fontSize:9.5,fontWeight:700,color:T.textMuted,letterSpacing:.7,
                           textTransform:"uppercase",marginBottom:7}}>How the order is decided</div>
              <div style={{fontSize:11.5,color:T.textSecondary,lineHeight:1.6,marginBottom:8}}>
                Choose <b style={{color:T.white}}>Call order</b> in the sort box and the list
                works top to bottom, in this order:
              </div>
              <ol style={{margin:0,paddingLeft:17,fontSize:11.5,color:T.textSecondary,lineHeight:1.75}}>
                {CALL_ORDER.map(r=><li key={r}>{r}</li>)}
              </ol>
              <div style={{fontSize:10.5,color:T.textMuted,lineHeight:1.6,marginTop:9,
                           borderTop:"1px solid "+T.border,paddingTop:8}}>
                That is the whole rule. There is no score, no model and no prediction of
                who will buy — every lead simply carries the reason it sits where it does,
                in words, on its own row.
              </div>
            </div>

            {/* Check 9: the meanings are one click away, not in anybody's head. */}
            <div style={{flex:"1 1 330px",minWidth:280,background:"rgba(255,255,255,0.02)",
                         border:"1px solid "+T.border,borderRadius:10,padding:"12px 14px"}}>
              <div style={{fontSize:9.5,fontWeight:700,color:T.textMuted,letterSpacing:.7,
                           textTransform:"uppercase",marginBottom:7}}>What each stage means</div>
              <div style={{display:"flex",flexDirection:"column",gap:5}}>
                {PIPELINE.map(p=>(
                  <div key={p.key} style={{display:"flex",gap:8,alignItems:"baseline"}}>
                    <span style={{width:6,height:6,borderRadius:"50%",background:p.color,
                                  display:"inline-block",flexShrink:0,transform:"translateY(-1px)"}}/>
                    <span style={{fontSize:11,color:p.color,fontWeight:600,width:112,flexShrink:0}}>{p.key}</span>
                    <span style={{fontSize:11,color:T.textSecondary,lineHeight:1.5}}>{STAGE_MEANING[p.key]}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Check 3: say where the edge is before a customer finds it. */}
            <div style={{flex:"1 1 100%",fontSize:10.5,color:T.textMuted,lineHeight:1.65,
                         background:"rgba(255,255,255,0.015)",border:"1px solid "+T.border,
                         borderRadius:10,padding:"11px 14px"}}>
              <b style={{color:T.textSecondary}}>What this tab does not do.</b>{" "}
              It does not tell you who is likely to buy — nobody can, and a platform that
              claims to is guessing. It does not check whether a phone number is real, chase
              anyone automatically, or read your calls. A lead only moves down the list when
              somebody logs a call, a message or a viewing against it, so the order is only
              as honest as the notes your team keeps. Budgets are what the client said, not
              what they have been approved for by a bank.
            </div>
          </div>
        )}
      </div>

      {/*  SMART VIEW TABS  ────────────────────────────────────────────────
          Nine views, eleven stage pills and five dropdowns used to render over
          an empty desk — twenty-seven controls, every counter reading zero,
          nothing to filter. Filters only appear once there is something to
          filter.                                                            */}
      {allLeads.length>0&&(
      <div style={{display:"flex",gap:0,borderBottom:"1px solid "+T.border,overflowX:"auto",paddingLeft:4}}>
        {/* "Hot" was whatever the invented score put above 70. It is now the plain
            thing an agent means by it: somebody is waiting on you. */}
        {[
          {k:"all",         l:"All",             t:"Every lead you are allowed to see"},
          {k:"today",       l:"Came in today",   t:"Leads created in the last 24 hours"},
          {k:"my_leads",    l:"Mine",            t:"Leads assigned to you, or that you created"},
          {k:"uncontacted", l:"Never contacted", t:"No call, message or email has ever been logged against these"},
          {k:"hot",         l:"Needs a call",    t:"Uncontacted, or a follow-up is overdue, or silent for more than a week"},
          {k:"stale",       l:"Gone quiet",      t:"Still open, but nothing has been logged for over 7 days"},
          {k:"overdue",     l:"Follow-up due",   t:"You set a follow-up date and it has passed"},
          ...(canManage?[{k:"unassigned",l:"Unassigned",t:"Nobody owns these yet — they belong to no agent"}]:[]),
          {k:"golden_visa", l:"Golden Visa",     t:`Budget at or above AED ${(GV_MIN/1e6).toFixed(0)}M, the property route to a 10-year visa. ICP confirms eligibility, not us.`},
        ].map(v=>{
          const active=smartView===v.k;
          return <button key={v.k} type="button" title={v.t} onClick={()=>{setSmartView(v.k);setActiveStage("all");}}
            style={{padding:"10px 14px",border:"none",borderBottom:active?"2px solid "+T.gold:"2px solid transparent",background:"transparent",color:active?T.white:T.textMuted,fontSize:12,fontWeight:active?600:400,cursor:"pointer",whiteSpace:"nowrap",fontFamily:"'Outfit',sans-serif",transition:"color 0.15s"}}>
            {v.l}{v.k==="unassigned"&&kUnassigned>0?<span style={{marginLeft:5,fontSize:10,background:"rgba(239,68,68,0.15)",color:"#EF4444",padding:"1px 5px",borderRadius:8}}>{kUnassigned}</span>:null}
          </button>;
        })}
      </div>
      )}

      {/*  TOOLBAR  */}
      <div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 4px",borderBottom:"1px solid "+T.border,flexWrap:"wrap"}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:13,fontWeight:700,color:T.white}}>{orgName||"Leads"}</span>
          <span style={{fontSize:13,color:T.textMuted,fontWeight:700}}>{kTotal.toLocaleString()}</span>
        </div>
        {/* Searching, switching view, exporting and messaging all need leads to
            act on. On an empty desk they left "Reports" looking selected while
            the empty state rendered — a control that lies about what is on
            screen. Only Add survives, because Add is the only thing to do. */}
        {allLeads.length>0&&(
        <div style={{flex:"1 1 240px",display:"flex",alignItems:"center",gap:8,padding:"6px 12px",background:"rgba(255,255,255,0.03)",border:"1px solid "+(aiSearch?T.gold:T.border),borderRadius:8,cursor:"text"}} onClick={()=>document.getElementById("crm-search")?.focus()}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={T.textMuted} strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input id="crm-search" value={aiSearch} onChange={e=>setAiSearch(e.target.value)} placeholder="Search name, phone, agent, area..."
            style={{flex:1,background:"none",border:"none",outline:"none",color:T.white,fontSize:12,fontFamily:"'Outfit',sans-serif"}}/>
          {aiSearch&&<button type="button" onClick={()=>setAiSearch("")} style={{background:"none",border:"none",color:T.textMuted,cursor:"pointer",fontSize:14}} aria-label="Clear search" title="Clear search">✕</button>}
        </div>
        )}
        {allLeads.length>0&&(
        <div style={{display:"flex",gap:2,background:"rgba(255,255,255,0.03)",border:"1px solid "+T.border,borderRadius:7,padding:2,marginLeft:"auto"}}>
          {/* These three carried empty icon strings, so all three rendered as blank
              22×12px boxes. Two entire views of this tab — the board and the
              reports — were unreachable unless you happened to click nothing. */}
          {[{k:"table",  l:"List",   tip:"Every lead in one list, in call order"},
            {k:"kanban", l:"Board",  tip:"The same leads as cards, in columns by stage"},
            {k:"analytics", l:"Reports", tip:"Where your leads come from, and how each agent is doing"}].map(v=>(
            <button key={v.k} type="button" onClick={()=>setView(v.k)} title={v.tip}
              style={{padding:"5px 12px",borderRadius:5,border:view===v.k?"1px solid "+T.gold:"1px solid transparent",background:view===v.k?"rgba(212,168,67,0.15)":"transparent",color:view===v.k?T.gold:T.textMuted,cursor:"pointer",fontSize:11,fontWeight:view===v.k?700:500,fontFamily:"'Outfit',sans-serif",whiteSpace:"nowrap"}}>{v.l}</button>
          ))}
        </div>
        )}
        {allLeads.length>0&&<>
        <button type="button" onClick={exportCSV} title="Download the leads currently shown as a spreadsheet. Filters apply — you get what is on screen, not everything."
          style={{padding:"6px 11px",borderRadius:7,border:"1px solid "+T.border,background:"transparent",color:T.textSecondary,fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>Export</button>
        <button type="button" onClick={()=>setShowWA(true)} title="Open WhatsApp with a ready-written message for the selected lead"
          style={{padding:"6px 11px",borderRadius:7,border:"1px solid rgba(37,211,102,0.3)",background:"rgba(37,211,102,0.07)",color:"#25D366",fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>WhatsApp</button>
        </>}
        <button type="button" onClick={()=>setShowAdd(true)} title="Record a new enquiry" style={{padding:"7px 16px",borderRadius:7,border:"none",background:"linear-gradient(135deg,#D4A843,#B8902E)",color:"#0A0E1A",fontSize:12,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:5,marginLeft:allLeads.length===0?"auto":undefined}}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Add
        </button>
      </div>

      {/*  PIPELINE PILLS  */}
      {allLeads.length>0&&(
      <div style={{display:"flex",gap:0,borderBottom:"1px solid "+T.border,overflowX:"auto",paddingLeft:4,background:"rgba(255,255,255,0.01)"}}>
        <button type="button" onClick={()=>setActiveStage("all")} style={{padding:"7px 12px",border:"none",borderBottom:activeStage==="all"?"2px solid "+T.gold:"2px solid transparent",background:"transparent",color:activeStage==="all"?T.white:T.textMuted,fontSize:11,fontWeight:activeStage==="all"?600:400,cursor:"pointer",whiteSpace:"nowrap",fontFamily:"'Outfit',sans-serif"}}>All</button>
        {PIPELINE.map(p=>{
          const count=stageCounts[p.key]||0;
          const active=activeStage===p.key;
          return <button key={p.key} type="button" title={STAGE_MEANING[p.key]||p.key} onClick={()=>setActiveStage(active?"all":p.key)}
            style={{padding:"7px 12px",border:"none",borderBottom:active?"2px solid "+p.color:"2px solid transparent",background:"transparent",color:active?p.color:T.textMuted,fontSize:11,fontWeight:active?600:400,cursor:"pointer",whiteSpace:"nowrap",fontFamily:"'Outfit',sans-serif",display:"flex",alignItems:"center",gap:5}}>
            <span style={{width:6,height:6,borderRadius:"50%",background:p.color,display:"inline-block"}}/>
            {p.key} <span style={{fontSize:10,color:active?p.color:T.textMuted}}>{count}</span>
          </button>;
        })}
      </div>
      )}

      {/*  FILTER ROW  */}
      {allLeads.length>0&&(
      <div style={{display:"flex",gap:8,padding:"8px 4px",borderBottom:"1px solid "+T.border,flexWrap:"wrap",alignItems:"center",background:"rgba(255,255,255,0.01)"}}>
        {scope==="org"&&managers.length>0&&(
          <select value={filterManager} onChange={e=>setFilterManager(e.target.value)} style={{padding:"5px 8px",background:"rgba(255,255,255,0.04)",border:"1px solid "+(filterManager!=="all"?T.gold:T.border),borderRadius:6,color:T.textSecondary,fontSize:11,outline:"none",fontFamily:"'Outfit',sans-serif"}}>
            <option value="all">All Managers</option>
            {managers.map(m=><option key={m.uid||m.id} value={m.uid||m.id}>{m.name}</option>)}
          </select>
        )}
        {canManage&&agents.length>0&&(
          <select value={filterAgent} onChange={e=>setFilterAgent(e.target.value)} style={{padding:"5px 8px",background:"rgba(255,255,255,0.04)",border:"1px solid "+(filterAgent!=="all"?T.gold:T.border),borderRadius:6,color:T.textSecondary,fontSize:11,outline:"none",fontFamily:"'Outfit',sans-serif"}}>
            <option value="all">All Agents</option>
            {agents.map(a=><option key={a.uid||a.id} value={a.uid||a.id}>{a.name}</option>)}
          </select>
        )}
        <select value={filterService} onChange={e=>setFilterService(e.target.value)} style={{padding:"5px 8px",background:"rgba(255,255,255,0.04)",border:"1px solid "+T.border,borderRadius:6,color:T.textSecondary,fontSize:11,outline:"none",fontFamily:"'Outfit',sans-serif"}}>
          <option value="all">All Types</option>
          {SERVICE_TYPES.map(t=><option key={t} value={t}>{t}</option>)}
        </select>
        <select value={filterSource} onChange={e=>setFilterSource(e.target.value)} style={{padding:"5px 8px",background:"rgba(255,255,255,0.04)",border:"1px solid "+T.border,borderRadius:6,color:T.textSecondary,fontSize:11,outline:"none",fontFamily:"'Outfit',sans-serif"}}>
          <option value="all">All Sources</option>
          {LEAD_SOURCES.map(s=><option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filterBudget} onChange={e=>setFilterBudget(e.target.value)} style={{padding:"5px 8px",background:"rgba(255,255,255,0.04)",border:"1px solid "+T.border,borderRadius:6,color:T.textSecondary,fontSize:11,outline:"none",fontFamily:"'Outfit',sans-serif"}}>
          <option value="all">All Budgets</option>
          <option value="under1m">Under AED 1M</option>
          <option value="1to3m">AED 1M - 3M</option>
          <option value="3to5m">AED 3M - 5M</option>
          <option value="5to10m">AED 5M - 10M</option>
          <option value="above10m">Above AED 10M</option>
        </select>
        <select value={leadSortBy||"date"} onChange={e=>setLeadSortBy&&setLeadSortBy(e.target.value)} style={{padding:"5px 8px",background:"rgba(255,255,255,0.04)",border:"1px solid "+T.border,borderRadius:6,color:T.textSecondary,fontSize:11,outline:"none",fontFamily:"'Outfit',sans-serif"}}>
          <option value="date">Newest first</option>
          <option value="score">Call order</option>
          <option value="budget">Biggest budget first</option>
          <option value="name">Name A–Z</option>
        </select>
        {(aiSearch||activeStage!=="all"||filterAgent!=="all"||filterManager!=="all"||filterService!=="all"||filterSource!=="all"||filterBudget!=="all")&&(
          <div style={{display:"flex",gap:6,alignItems:"center",marginLeft:"auto",flexWrap:"wrap"}}>
            {/* Each of these chips ended in a "remove" cross that had been stripped
                out, leaving a clickable chip with no sign it could be clicked. */}
            {activeStage!=="all"&&<span title="Click to remove this filter" style={{fontSize:10,padding:"2px 8px",borderRadius:10,background:"rgba(212,168,67,0.15)",color:T.gold,cursor:"pointer"}} onClick={()=>setActiveStage("all")}>{activeStage} ✕</span>}
            {filterAgent!=="all"&&<span title="Click to remove this filter" style={{fontSize:10,padding:"2px 8px",borderRadius:10,background:"rgba(139,92,246,0.15)",color:"#8B5CF6",cursor:"pointer"}} onClick={()=>setFilterAgent("all")}>{agents.find(a=>(a.uid||a.id)===filterAgent)?.name||"Agent"} ✕</span>}
            {filterManager!=="all"&&<span title="Click to remove this filter" style={{fontSize:10,padding:"2px 8px",borderRadius:10,background:"rgba(59,130,246,0.15)",color:"#3B82F6",cursor:"pointer"}} onClick={()=>setFilterManager("all")}>{managers.find(m=>(m.uid||m.id)===filterManager)?.name||"Manager"} ✕</span>}
            <button type="button" onClick={()=>{setAiSearch("");setActiveStage("all");setFilterAgent("all");setFilterManager("all");setFilterService("all");setFilterSource("all");setFilterBudget("all");}} style={{fontSize:10,padding:"2px 10px",borderRadius:10,background:"rgba(252,129,129,0.1)",border:"1px solid rgba(252,129,129,0.3)",color:"#FC8181",cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>Clear all</button>
            <span style={{fontSize:10,color:T.textMuted}}>{filtered.length} results</span>
          </div>
        )}
      </div>
      )}

      {/*  MAIN CONTENT  */}
      <div style={{display:"grid",gridTemplateColumns:selectedLead?"1fr 360px":"1fr",gap:0,alignItems:"start"}}>

        {/*  TABLE VIEW  ─────────────────────────────────────────────────────
            With no leads at all, the board drew eleven empty stage columns each
            reading "No leads", and the reports drew seven zeroes and an empty
            leaderboard. There is nothing to board or report on, so all three
            views land on the same honest empty desk.                         */}
        {(view==="table"||allLeads.length===0)&&(
          <div>
            {/* Column headings over nothing are furniture. They appear with the rows. */}
            {allLeads.length>0&&(
            <div style={{display:"grid",gridTemplateColumns:"72px 2fr 110px 130px 110px 130px 140px 48px",padding:"8px 4px",borderBottom:"1px solid "+T.border,background:"rgba(255,255,255,0.02)"}}>
              {[["ID","The reference this lead was given when it was created"],
                ["NAME","The client, and underneath it the reason this lead sits where it does in the list"],
                ["STATUS","Where this lead has reached. Open the guide above for what each stage means."],
                ["BUDGET","What the client says they will spend. Not checked against a bank."],
                ["SERVICE","Whether they are buying, selling, renting or investing"],
                ["SOURCE","Where the enquiry came from — a portal, an ad, a referral, or a walk-in"],
                ["AGENT","Who owns this lead. Blank means nobody does."],[" ",""]].map(([h,tip],i)=>(
                <div key={i} title={tip} style={{fontSize:9,fontWeight:700,color:T.textMuted,textTransform:"uppercase",letterSpacing:0.7,paddingLeft:i===0?4:0}}>{h}</div>
              ))}
            </div>
            )}
            {allLeads.length===0&&(
              /* An empty desk is the first thing a new customer sees, so it says
                 what the tab will do for them rather than only that it is empty. */
              <div style={{padding:"38px 20px 44px",textAlign:"center"}}>
                <div style={{fontSize:15,fontWeight:700,color:T.white,marginBottom:7,fontFamily:"'Fraunces',serif"}}>
                  No leads on this desk yet
                </div>
                <div style={{fontSize:12,color:T.textSecondary,marginBottom:18,lineHeight:1.7,maxWidth:430,margin:"0 auto 18px"}}>
                  Add an enquiry and it appears here with the reason it needs attention —
                  never called, follow-up overdue, or gone quiet — so you always know who
                  to ring first. Nothing is filled in for you and nothing is guessed.
                </div>
                <button type="button" onClick={()=>setShowAdd(true)} title="Record the first enquiry"
                  style={{padding:"10px 24px",borderRadius:8,border:"none",background:"linear-gradient(135deg,#D4A843,#B8902E)",color:"#0A0E1A",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>Add the first lead</button>
              </div>
            )}
            {filtered.length===0&&allLeads.length>0&&<div style={{padding:"40px 20px",textAlign:"center",color:T.textMuted,fontSize:13}}>No leads match your current filters</div>}
            {filtered.map((lead,i)=>{
              const stale=!["Closed Deal","Closed Outside","Non Potential"].includes(lead.status)&&daysAgo(lead.updatedAt||lead.createdAt)>7;
              const isSel=selectedLead?.id===lead.id;
              const isGV=parseFloat(lead.budget||0)>=GV_MIN;
              return (
                <div key={lead.id||i} onClick={()=>setSelectedLead(isSel?null:lead)}
                  style={{display:"grid",gridTemplateColumns:"72px 2fr 110px 130px 110px 130px 140px 48px",padding:"11px 4px",borderBottom:"1px solid "+T.border+"40",cursor:"pointer",background:isSel?"rgba(212,168,67,0.04)":"transparent",transition:"background 0.1s",borderLeft:isSel?"3px solid "+T.gold:"3px solid transparent"}}
                  onMouseEnter={e=>!isSel&&(e.currentTarget.style.background="rgba(255,255,255,0.02)")}
                  onMouseLeave={e=>!isSel&&(e.currentTarget.style.background="transparent")}
                >
                  <div style={{display:"flex",alignItems:"center",gap:4,paddingLeft:4}}>
                    <div style={{width:7,height:7,borderRadius:"50%",background:sc.color,flexShrink:0}}/>
                    <span style={{fontSize:10,color:T.textMuted}}>#{(lead.id||"").slice(-4)||String(i+1).padStart(4,"0")}</span>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    <div style={{width:22,height:22,borderRadius:"50%",background:"rgba(255,255,255,0.07)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:10,fontWeight:700,color:T.textMuted}}>{(lead.name||"?")[0].toUpperCase()}</div>
                    <div>
                      <div style={{display:"flex",alignItems:"center",gap:4}}>
                        <span style={{fontSize:12,fontWeight:500,color:T.white}}>{lead.name||"Unnamed"}</span>
                      </div>
                      <div style={{display:"flex",gap:6,marginTop:1,alignItems:"center",minWidth:0}}>
                        <WhyNow lead={lead}/>
                        {(()=>{ const r=responseTime(lead);
                          if(!r.answered) return null;
                          return <span title={`How long this lead waited for a first call, message or email. ${r.note}`}
                            style={{fontSize:9,color:r.colour,whiteSpace:"nowrap"}}>{r.minutes<60?`${r.minutes}m`:`${Math.floor(r.minutes/60)}h`}</span>;
                        })()}
                        {isGV&&<span title={`Budget is at or above AED ${(GV_MIN/1e6).toFixed(0)}M, the property route to a 10-year Golden Visa. Eligibility is confirmed by ICP, not by us.`}
                          style={{fontSize:9,color:T.gold,whiteSpace:"nowrap"}}>Golden Visa</span>}
                      </div>
                    </div>
                  </div>
                  <div style={{alignSelf:"center"}}><PBadge status={lead.status||"New Lead"}/></div>
                  <div style={{fontSize:12,fontWeight:700,color:T.gold,alignSelf:"center"}}>{fmtB(lead.budget)}</div>
                  <div style={{fontSize:11,color:lead.serviceType||lead.type?"#A78BFA":T.textMuted,alignSelf:"center",fontWeight:lead.serviceType||lead.type?600:400}}>{lead.serviceType||lead.type||""}</div>
                  <div style={{display:"flex",alignItems:"center",gap:4,alignSelf:"center"}}>
                    <div style={{width:6,height:6,borderRadius:"50%",background:SRC_COLOR[lead.source]||"#94A3B8",flexShrink:0}}/>
                    <span style={{fontSize:10,color:T.textMuted}}>{lead.source||""}</span>
                  </div>
                  <div style={{alignSelf:"center"}}>
                    {lead.assignedToName
                      ?<span style={{fontSize:10,color:"#8B5CF6",fontWeight:600,background:"rgba(139,92,246,0.1)",padding:"2px 7px",borderRadius:8}}>{lead.assignedToName}</span>
                      :canManage
                        ?<button type="button" onClick={e=>{e.stopPropagation();setShowAssign(lead);}} style={{fontSize:10,color:T.textMuted,background:"rgba(255,255,255,0.05)",border:"1px dashed "+T.border,padding:"2px 7px",borderRadius:8,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>+ Assign</button>
                        :<span style={{fontSize:10,color:T.textMuted}}>—</span>
                    }
                  </div>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"center"}}>
                    {lead.phone&&<a href={"https://wa.me/"+clnPhone(lead.phone)} target="_blank" rel="noopener noreferrer" onClick={e=>e.stopPropagation()} style={{padding:"3px 6px",borderRadius:5,background:"rgba(37,211,102,0.1)",border:"1px solid rgba(37,211,102,0.2)",textDecoration:"none",fontSize:9,color:"#25D366",fontWeight:700}}>WA</a>}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/*  KANBAN VIEW  */}
        {view==="kanban"&&allLeads.length>0&&(
          <div style={{overflowX:"auto",padding:"12px 0"}}>
            <div style={{display:"flex",gap:10,minWidth:"max-content",alignItems:"start"}}>
              {PIPELINE.map(p=>{
                const cols=filtered.filter(l=>(l.status||"New Lead")===p.key);
                return (
                  <div key={p.key} style={{width:210,flexShrink:0}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:7,padding:"7px 10px",background:p.bg,borderRadius:7,border:"1px solid "+p.color+"25"}}>
                      <div style={{display:"flex",alignItems:"center",gap:5}}>
                        <div style={{width:7,height:7,borderRadius:"50%",background:p.color}}/>
                        <span style={{fontSize:11,fontWeight:600,color:p.color}}>{p.key}</span>
                      </div>
                      <span style={{fontSize:10,color:p.color,background:p.color+"15",padding:"1px 6px",borderRadius:8}}>{cols.length}</span>
                    </div>
                    <div style={{display:"flex",flexDirection:"column",gap:5,maxHeight:540,overflowY:"auto"}}>
                      {cols.map((lead,i)=>{
                        const att=attention(lead);
                        const stale=daysAgo(lead.updatedAt||lead.createdAt)>7;
                        return (
                          <div key={lead.id||i} onClick={()=>setSelectedLead(selectedLead?.id===lead.id?null:lead)}
                            style={{background:"rgba(255,255,255,0.03)",border:"1px solid "+(stale?"rgba(239,68,68,0.2)":T.border),borderRadius:8,padding:"9px 10px",cursor:"pointer"}}
                            onMouseEnter={e=>(e.currentTarget.style.borderColor=p.color+"50")}
                            onMouseLeave={e=>(e.currentTarget.style.borderColor=stale?"rgba(239,68,68,0.2)":T.border)}
                          >
                            <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                              <span style={{fontSize:11,fontWeight:500,color:T.white,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",flex:1}}>{lead.name||"Unnamed"}</span>
                              <div title={att.reason} style={{width:6,height:6,borderRadius:"50%",background:att.color,flexShrink:0,marginTop:3}}/>
                            </div>
                            <div style={{fontSize:11,fontWeight:700,color:T.gold,marginBottom:4}}>{fmtB(lead.budget)}</div>
                            {/* The card used to show only the word "Stale". This says what
                                is actually true of the lead, in the same space. */}
                            <div style={{fontSize:9,color:att.color,fontWeight:att.urgent?700:400,marginBottom:4,
                                         overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{att.reason}</div>
                            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                              <span style={{fontSize:9,color:SRC_COLOR[lead.source]||T.textMuted}}>{lead.source||"Manual"}</span>
                            </div>
                            {lead.assignedToName&&<div style={{fontSize:9,color:"#8B5CF6",marginTop:3,fontWeight:600}}>{lead.assignedToName}</div>}
                          </div>
                        );
                      })}
                      {cols.length===0&&<div style={{padding:"14px",textAlign:"center",color:T.textMuted,fontSize:10,border:"1px dashed "+T.border+"50",borderRadius:7}}>No leads</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/*  ANALYTICS VIEW  */}
        {view==="analytics"&&allLeads.length>0&&(
          <div style={{padding:"14px 4px",display:"flex",flexDirection:"column",gap:14}}>

            {/* KPI Cards */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(130px,1fr))",gap:8}}>
              {/* Every one of these carried a bare number and an abbreviation.
                  "Conv. Rate 4%" in red told an owner their agent was failing;
                  1–3% is normal for portal leads in Dubai, so the colour was a
                  judgement with nothing behind it. Each card now says what it
                  counts, and none of them judges. */}
              {[
                {l:"Leads",        v:kTotal,  c:T.gold,    n:"Every enquiry on record, open and closed."},
                {l:"Came in today",v:kToday,  c:"#0EA5E9", n:"Created in the last 24 hours."},
                {l:"Need a call",  v:kHot,    c:"#EF4444", n:"Uncontacted, overdue, or silent over a week."},
                {l:"Deals closed", v:kClosed, c:"#10B981", n:"Marked Closed Deal. The only stage that counts as a sale."},
                {l:"Gone quiet",   v:kStale,  c:"#F59E0B", n:"Still open, nothing logged for more than 7 days."},
                {l:"% that closed",v:kConvRate+"%", c:T.white,
                 n:`${kClosed} closed out of ${kTotal}. Your own history — not an outside benchmark.`},
                /* SPEED TO FIRST CONTACT. It predicts conversion better than
                   anything else an agency can measure, and almost nobody in
                   Dubai measures it. Median rather than mean, so one lead
                   answered three weeks late does not bury a typical four
                   minutes. */
                {l:"Typical reply time",
                 v:kResponse.medianMinutes==null ? "—"
                   : kResponse.medianMinutes<60 ? `${kResponse.medianMinutes} min`
                   : `${Math.floor(kResponse.medianMinutes/60)}h ${kResponse.medianMinutes%60}m`,
                 c:kResponse.medianMinutes==null ? T.textMuted
                   : kResponse.medianMinutes<=30 ? "#10B981"
                   : kResponse.medianMinutes<=120 ? "#F59E0B" : "#EF4444",
                 n:`${kResponse.headline}${kResponse.stillWaiting ? ` ${kResponse.stillWaiting} still waiting for a first reply.` : ""}`},
                {l:"Budget of open leads",
                 v:kPipeline>=1e9?"AED "+(kPipeline/1e9).toFixed(1)+"B":kPipeline>=1e6?"AED "+(kPipeline/1e6).toFixed(1)+"M":"AED "+kPipeline.toLocaleString(),
                 c:T.gold, n:"What clients say they will spend. Not money earned, and not bank-approved."},
              ].map((k,i)=>(
                <div key={i} title={k.n} style={{background:"rgba(255,255,255,0.03)",border:"1px solid "+T.border,borderRadius:9,padding:"10px 12px",position:"relative",overflow:"hidden"}}>
                  <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:k.c,opacity:0.8}}/>
                  <div style={{fontSize:9,fontWeight:700,color:T.textMuted,textTransform:"uppercase",letterSpacing:0.7,marginBottom:3}}>{k.l}</div>
                  <div style={{fontSize:20,fontWeight:900,color:k.c,fontFamily:"'Fraunces',serif"}}>{k.v}</div>
                  <div style={{fontSize:9.5,color:T.textMuted,marginTop:4,lineHeight:1.45}}>{k.n}</div>
                </div>
              ))}
            </div>

            {/*  OWNER LEADERBOARD  */}
            {seesLeaderboard&&leaderboard.length>0&&(
              <div style={{background:"rgba(255,255,255,0.02)",border:"1px solid "+T.gold+"40",borderRadius:12,overflow:"hidden"}}>
                <div style={{padding:"14px 16px",borderBottom:"1px solid "+T.border,background:"rgba(212,168,67,0.05)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div>
                    <div style={{fontSize:13,fontWeight:700,color:T.gold}}>Agent leaderboard</div>
                    <div style={{fontSize:11,color:T.textMuted,marginTop:2}}>
                      Ranked by deals closed, then by the share of their leads that closed.
                      Your agency average is {kConvRate}% — the colour on each row compares
                      that agent against your own agency, not an outside benchmark.
                    </div>
                  </div>
                  <div style={{fontSize:11,color:T.textMuted}}>{agents.length} agents</div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"32px 2fr 1fr 1fr 1fr 1.2fr",padding:"8px 16px",background:"rgba(255,255,255,0.02)",borderBottom:"1px solid "+T.border}}>
                  {["#","Agent","Leads","Closed","% closed","Budget of open leads"].map((h,i)=>(
                    <div key={i} style={{fontSize:9,fontWeight:700,color:T.textMuted,textTransform:"uppercase",letterSpacing:0.7}}>{h}</div>
                  ))}
                </div>
                {leaderboard.slice(0,10).map((agent,i)=>(
                  <div key={agent.uid||agent.id||i}
                    style={{display:"grid",gridTemplateColumns:"32px 2fr 1fr 1fr 1fr 1.2fr",padding:"12px 16px",borderBottom:i<leaderboard.length-1?"1px solid "+T.border+"40":"none",background:i===0?"rgba(212,168,67,0.03)":i===1?"rgba(212,168,67,0.015)":"transparent"}}
                    onMouseEnter={e=>(e.currentTarget.style.background="rgba(255,255,255,0.02)")}
                    onMouseLeave={e=>(e.currentTarget.style.background=i===0?"rgba(212,168,67,0.03)":i===1?"rgba(212,168,67,0.015)":"transparent")}
                  >
                    <div style={{fontSize:12,fontWeight:700,color:i===0?"#F59E0B":i===1?"#94A3B8":i===2?"#B97333":T.textMuted,alignSelf:"center"}}>{i+1}</div>
                    <div>
                      <div style={{fontSize:12,fontWeight:600,color:T.white}}>{agent.name||"Agent"}</div>
                      <div style={{fontSize:10,color:T.textMuted}}>{agent.email||""}</div>
                    </div>
                    <div style={{fontSize:13,fontWeight:700,color:T.gold,alignSelf:"center"}}>{agent.total}</div>
                    <div style={{fontSize:13,color:"#10B981",fontWeight:700,alignSelf:"center"}}>{agent.closed}</div>
                    {/* Was green above 10%, red below 5% — invented cut-offs that painted
                        a normal portal-lead conversion rate as failure. Now measured
                        against this agency's own average, which is a real comparison. */}
                    <div title={`Agency average is ${kConvRate}%`}
                      style={{fontSize:13,color:parseFloat(agent.conv)>=kConvRate?"#10B981":T.textSecondary,fontWeight:700,alignSelf:"center"}}>{agent.conv}%</div>
                    <div title="Total stated budget of this agent's leads that are not closed. It is what the clients say they will spend, not money earned."
                      style={{fontSize:11,color:T.gold,fontWeight:600,alignSelf:"center"}}>{agent.pipeline>=1e6?"AED "+(agent.pipeline/1e6).toFixed(1)+"M":"AED "+agent.pipeline.toLocaleString()}</div>
                  </div>
                ))}
              </div>
            )}

            {/*  AGENT PERFORMANCE TABLE (manager/director)  */}
            {seesTeamPerformance&&agentPerf.length>0&&(
              <div style={{background:"rgba(255,255,255,0.02)",border:"1px solid "+T.border,borderRadius:12,overflow:"hidden"}}>
                <div style={{padding:"14px 16px",borderBottom:"1px solid "+T.border,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div style={{fontSize:13,fontWeight:700,color:T.white}}>Agent Performance</div>
                  <div style={{fontSize:11,color:T.textMuted}}>{agents.length} agents  {allLeads.length} leads</div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr 1fr 1fr 1fr",padding:"8px 16px",background:"rgba(255,255,255,0.02)",borderBottom:"1px solid "+T.border}}>
                  {["Agent","Leads","Hot","Closed","Conv%","Stale","Last Active"].map((h,i)=>(
                    <div key={i} style={{fontSize:9,fontWeight:700,color:T.textMuted,textTransform:"uppercase",letterSpacing:0.7}}>{h}</div>
                  ))}
                </div>
                {agentPerf.map((agent,i)=>(
                  <div key={agent.uid||agent.id||i}
                    style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr 1fr 1fr 1fr",padding:"12px 16px",borderBottom:i<agentPerf.length-1?"1px solid "+T.border+"40":"none",cursor:"pointer"}}
                    onMouseEnter={e=>(e.currentTarget.style.background="rgba(255,255,255,0.02)")}
                    onMouseLeave={e=>(e.currentTarget.style.background="transparent")}
                    onClick={()=>setFilterAgent(agent.uid||agent.id||"all")}
                  >
                    <div>
                      <div style={{fontSize:12,fontWeight:600,color:T.white}}>{agent.name||"Agent"}</div>
                      <div style={{fontSize:10,color:T.textMuted}}>{agent.email||""}</div>
                    </div>
                    <div style={{fontSize:13,fontWeight:700,color:T.gold,alignSelf:"center"}}>{agent.total}</div>
                    <div style={{fontSize:13,color:"#10B981",fontWeight:600,alignSelf:"center"}}>{agent.hot}</div>
                    <div style={{fontSize:13,color:"#10B981",fontWeight:700,alignSelf:"center"}}>{agent.closed}</div>
                    <div style={{fontSize:13,color:parseFloat(agent.conv)>=10?"#10B981":parseFloat(agent.conv)>=5?"#D4A843":"#EF4444",fontWeight:700,alignSelf:"center"}}>{agent.conv}%</div>
                    <div style={{fontSize:13,color:agent.stale>0?"#EF4444":T.textMuted,fontWeight:agent.stale>0?700:400,alignSelf:"center"}}>{agent.stale}</div>
                    <div style={{fontSize:11,color:T.textMuted,alignSelf:"center"}}>{agent.lastActive?fmtD(agent.lastActive):"Never"}</div>
                  </div>
                ))}
                {agentPerf.length===0&&<div style={{padding:"20px",textAlign:"center",color:T.textMuted,fontSize:12}}>No agents in your team yet</div>}
              </div>
            )}

            {/* Source Performance */}
            <div style={{background:"rgba(255,255,255,0.02)",border:"1px solid "+T.border,borderRadius:12,padding:"16px"}}>
              <div style={{fontSize:13,fontWeight:700,color:T.white,marginBottom:14}}>Source Performance</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(130px,1fr))",gap:8}}>
                {srcStats.slice(0,8).map((s,i)=>(
                  <div key={i} style={{background:"rgba(255,255,255,0.03)",borderRadius:8,padding:"10px"}}>
                    <div style={{fontSize:11,fontWeight:700,color:SRC_COLOR[s.src]||T.textMuted,marginBottom:5,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.src}</div>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end"}}>
                      <div><div style={{fontSize:18,fontWeight:900,color:T.white,fontFamily:"'Fraunces',serif",lineHeight:1}}>{s.total}</div><div style={{fontSize:9,color:T.textMuted}}>leads</div></div>
                      <div style={{textAlign:"right"}}><div style={{fontSize:14,fontWeight:900,color:s.rate>=10?"#10B981":s.rate>=5?"#D4A843":"#EF4444",fontFamily:"'Fraunces',serif",lineHeight:1}}>{s.rate}%</div><div style={{fontSize:9,color:T.textMuted}}>closed</div></div>
                    </div>
                    <div style={{height:2,background:T.border,borderRadius:1,marginTop:7}}><div style={{height:"100%",width:Math.min(s.total,100)+"%",background:SRC_COLOR[s.src]||T.gold,borderRadius:1,opacity:0.7}}/></div>
                  </div>
                ))}
                {srcStats.length===0&&<div style={{color:T.textMuted,fontSize:12,padding:"20px",textAlign:"center"}}>No source data yet</div>}
              </div>
            </div>

            {/* Pipeline Distribution */}
            <div style={{background:"rgba(255,255,255,0.02)",border:"1px solid "+T.border,borderRadius:12,padding:"16px"}}>
              <div style={{fontSize:13,fontWeight:700,color:T.white,marginBottom:14}}>Pipeline Distribution</div>
              {PIPELINE.map(p=>{
                const count=allLeads.filter(l=>(l.status||"New Lead")===p.key).length;
                const pct=allLeads.length>0?Math.round(count*100/allLeads.length):0;
                return(
                  <div key={p.key} style={{marginBottom:8}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                      <div style={{display:"flex",alignItems:"center",gap:6}}><div style={{width:6,height:6,borderRadius:"50%",background:p.color}}/><span style={{fontSize:11,color:T.textSecondary}}>{p.key}</span></div>
                      <span style={{fontSize:11,fontWeight:700,color:p.color}}>{count} <span style={{color:T.textMuted,fontWeight:400}}>({pct}%)</span></span>
                    </div>
                    <div style={{height:4,borderRadius:2,background:"rgba(255,255,255,0.05)"}}><div style={{height:"100%",width:pct+"%",borderRadius:2,background:p.color,opacity:0.85,transition:"width 0.8s"}}/></div>
                  </div>
                );
              })}
            </div>

          </div>
        )}

        {/*  LEAD DETAIL DRAWER  */}
        {selectedLead&&(
          <div style={{background:"rgba(255,255,255,0.02)",borderLeft:"1px solid "+T.border,display:"flex",flexDirection:"column",maxHeight:"calc(100vh - 160px)",position:"sticky",top:0,overflowY:"auto"}}>
            <div style={{padding:"13px 15px",borderBottom:"1px solid "+T.border,background:"rgba(255,255,255,0.02)"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:7}}>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <div style={{width:30,height:30,borderRadius:"50%",background:"rgba(255,255,255,0.07)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:12,fontWeight:700,color:T.textMuted}}>{(selectedLead.name||"?")[0].toUpperCase()}</div>
                  <div>
                    <div style={{fontSize:14,fontWeight:700,color:T.white}}>{selectedLead.name||"Unnamed"}</div>
                    <PBadge status={selectedLead.status||"New Lead"}/>
                  </div>
                </div>
                <button type="button" onClick={()=>setSelectedLead(null)} style={{background:"none",border:"none",color:T.textMuted,cursor:"pointer",fontSize:18}} aria-label="Close lead details" title="Close lead details">✕</button>
              </div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                {selectedLead.phone&&<a href={"https://wa.me/"+clnPhone(selectedLead.phone)} target="_blank" rel="noopener noreferrer" style={{fontSize:10,padding:"4px 10px",borderRadius:7,background:"rgba(37,211,102,0.1)",border:"1px solid rgba(37,211,102,0.25)",color:"#25D366",textDecoration:"none",fontWeight:600}}>WhatsApp</a>}
                {selectedLead.phone&&<a href={"tel:"+selectedLead.phone} style={{fontSize:10,padding:"4px 10px",borderRadius:7,background:"rgba(99,179,237,0.1)",border:"1px solid rgba(99,179,237,0.25)",color:"#63B3ED",textDecoration:"none",fontWeight:600}}>Call</a>}
                {canManage&&<button type="button" onClick={()=>setShowAssign(selectedLead)} style={{fontSize:10,padding:"4px 10px",borderRadius:7,background:"rgba(139,92,246,0.1)",border:"1px solid rgba(139,92,246,0.3)",color:"#8B5CF6",cursor:"pointer",fontFamily:"'Outfit',sans-serif",fontWeight:600}}>Reassign</button>}
                {parseFloat(selectedLead.budget||0)>=GV_MIN&&<span style={{fontSize:10,padding:"4px 8px",borderRadius:7,background:"rgba(212,168,67,0.15)",color:T.gold,fontWeight:700}}> Golden Visa</span>}
              </div>
              <div style={{marginTop:8}}>
                <div style={{fontSize:9,color:T.textMuted,marginBottom:4,fontWeight:700,textTransform:"uppercase",letterSpacing:0.5}}>Change Status</div>
                <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                  {PIPELINE.map(p=>(
                    <button key={p.key} type="button" onClick={()=>updateStatus(selectedLead.id,p.key)}
                      style={{fontSize:9,padding:"3px 7px",borderRadius:8,border:"1px solid "+((selectedLead.status||"New Lead")===p.key?p.color:T.border),background:(selectedLead.status||"New Lead")===p.key?p.bg:"transparent",color:(selectedLead.status||"New Lead")===p.key?p.color:T.textMuted,cursor:"pointer",fontWeight:(selectedLead.status||"New Lead")===p.key?700:400,fontFamily:"'Outfit',sans-serif"}}>
                      {p.key}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div style={{display:"flex",borderBottom:"1px solid "+T.border}}>
              {[{k:"profile",l:"Profile"},{k:"activity",l:"Activity"},{k:"match",l:"Matches"}].map(t=>(
                <button key={t.k} type="button" onClick={()=>setDrawerTab(t.k)} style={{flex:1,padding:"8px 0",border:"none",borderBottom:drawerTab===t.k?"2px solid "+T.gold:"2px solid transparent",background:"transparent",color:drawerTab===t.k?T.gold:T.textMuted,fontSize:11,fontWeight:drawerTab===t.k?600:400,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>{t.l}</button>
              ))}
            </div>
            <div style={{padding:"13px 15px",flex:1}}>
              {drawerTab==="profile"&&(()=>{
                const att=attention(selectedLead);
                return (
                  <div>
                    {/* Was "AI LEAD SCORE — 65/100 Warm", a number with no defensible
                        basis. This states the fact and the next action instead. */}
                    <div style={{padding:"10px 12px",borderRadius:8,background:att.color+"0E",border:"1px solid "+att.color+"25",marginBottom:12}}>
                      <div style={{fontSize:9,color:T.textMuted,fontWeight:700,textTransform:"uppercase",letterSpacing:0.7,marginBottom:3}}>Why this one now</div>
                      <div style={{fontSize:13,fontWeight:700,color:att.color,lineHeight:1.35}}>{att.reason}</div>
                      <div style={{fontSize:10,color:T.textMuted,marginTop:5,lineHeight:1.5}}>
                        {att.urgent
                          ? "This is one of the leads the list puts first. Log a call or a message below and it moves down."
                          : "Nothing is overdue on this one. It sits below anything uncontacted or overdue."}
                      </div>
                    </div>
                    {[
                      {label:"Phone",       value:selectedLead.phone,   link:"tel:"+selectedLead.phone},
                      {label:"WhatsApp",    value:selectedLead.phone?"Open":null, link:selectedLead.phone?"https://wa.me/"+clnPhone(selectedLead.phone):null, ext:true},
                      {label:"Email",       value:selectedLead.email,   link:selectedLead.email?"mailto:"+selectedLead.email:null},
                      {label:"Budget",      value:fmtB(selectedLead.budget)},
                      {label:"Service",     value:selectedLead.serviceType||selectedLead.type||""},
                      {label:"Request",     value:selectedLead.requestType||""},
                      {label:"Project",     value:selectedLead.project||""},
                      {label:"Source",      value:selectedLead.source||""},
                      {label:"Channel",     value:selectedLead.channel||""},
                      {label:"Campaign",    value:selectedLead.campaign||""},
                      {label:"AD Name",     value:selectedLead.adName||""},
                      {label:"AD Account",  value:selectedLead.adAccount||""},
                      {label:"Nationality", value:selectedLead.nationality||""},
                      {label:"Community",   value:selectedLead.community||""},
                      {label:"Timeline",    value:selectedLead.timeline||""},
                      {label:"Assigned To", value:selectedLead.assignedToName||"Unassigned",color:"#8B5CF6"},
                      {label:"Added",       value:fmtD(selectedLead.createdAt)},
                    ].map((f,i)=>(
                      <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"5px 0",borderBottom:"1px solid "+T.border+"30"}}>
                        <span style={{fontSize:11,color:T.textMuted,flexShrink:0}}>{f.label}</span>
                        {f.link
                          ?<a href={f.link} target={f.ext?"_blank":"_self"} rel="noopener noreferrer" style={{fontSize:11,color:T.gold,fontWeight:600,textDecoration:"none"}}>{f.value}</a>
                          :<span style={{fontSize:11,color:f.color||T.white,fontWeight:600,textAlign:"right",maxWidth:160,overflow:"hidden",textOverflow:"ellipsis"}}>{f.value||""}</span>
                        }
                      </div>
                    ))}
                    {selectedLead.comment&&<div style={{marginTop:9,padding:"8px 10px",background:"rgba(255,255,255,0.03)",borderRadius:7,fontSize:11,color:T.textSecondary,lineHeight:1.6}}><div style={{fontSize:9,color:T.textMuted,marginBottom:3,fontWeight:700,textTransform:"uppercase",letterSpacing:0.5}}>Comment</div>{selectedLead.comment}</div>}
                  </div>
                );
              })()}
              {drawerTab==="activity"&&(
                <div>
                  <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:12,maxHeight:260,overflowY:"auto"}}>
                    {(selectedLead.notes_log||[]).length===0&&<div style={{padding:"20px",textAlign:"center",color:T.textMuted,fontSize:11}}>No activity yet</div>}
                    {[...(selectedLead.notes_log||[])].reverse().map((n,i)=>(
                      <div key={i} style={{padding:"7px 10px",background:"rgba(255,255,255,0.03)",borderRadius:7,borderLeft:"2px solid "+T.gold}}>
                        <div style={{fontSize:11,color:T.white,marginBottom:2}}>{n.text}</div>
                        <div style={{fontSize:9,color:T.textMuted}}>{n.type||"Note"}  {n.by||"Agent"}  {fmtD(n.at)}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{borderTop:"1px solid "+T.border,paddingTop:10}}>
                    <select value={noteType2} onChange={e=>setNoteType2(e.target.value)} style={{width:"100%",padding:"6px 8px",background:"rgba(255,255,255,0.04)",border:"1px solid "+T.border,borderRadius:6,color:T.textSecondary,fontSize:11,outline:"none",marginBottom:6,fontFamily:"'Outfit',sans-serif"}}>
                      {NOTE_TYPES.map(t=><option key={t} value={t}>{t}</option>)}
                    </select>
                    <textarea value={noteText2} onChange={e=>setNoteText2(e.target.value)} placeholder="Add activity note..." rows={3} style={{width:"100%",padding:"7px 9px",background:"rgba(255,255,255,0.04)",border:"1px solid "+T.border,borderRadius:6,color:T.white,fontSize:12,outline:"none",resize:"none",boxSizing:"border-box",marginBottom:7,fontFamily:"'Outfit',sans-serif"}}/>
                    <button type="button" onClick={()=>addNote(selectedLead.id)} disabled={!noteText2.trim()||savingNote} style={{width:"100%",padding:"7px",borderRadius:6,border:"none",background:!noteText2.trim()?"rgba(212,168,67,0.2)":"rgba(212,168,67,0.9)",color:"#0A0E1A",fontSize:12,fontWeight:700,cursor:!noteText2.trim()?"not-allowed":"pointer",fontFamily:"'Outfit',sans-serif"}}>{savingNote?"Saving...":"Save Note"}</button>
                  </div>
                </div>
              )}
              {drawerTab==="match"&&(
                <div>
                  
                  {/* Community Suggestions */}
                  {selectedLead?.budget && (() => {
                    const suggestions = getCommunitySuggestions(selectedLead.budget);
                    if(!suggestions.length) return null;
                    return (
                      <div style={{marginTop:12,padding:"12px",background:"rgba(212,168,67,0.04)",border:"1px solid rgba(212,168,67,0.2)",borderRadius:10}}>
                        <div style={{fontSize:10,fontWeight:700,color:T.gold,letterSpacing:0.8,textTransform:"uppercase",marginBottom:8}}>
                          Recommended Communities for {selectedLead.budget?("AED "+(parseFloat(selectedLead.budget)/1e6).toFixed(1)+"M budget"):"this budget"}
                        </div>
                        <div style={{display:"flex",flexDirection:"column",gap:6}}>
                          {suggestions.map(n=>(
                            <div key={n.community} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 10px",background:"rgba(255,255,255,0.03)",borderRadius:8,border:"1px solid "+T.border+"40"}}>
                              <div>
                                <div style={{fontSize:11,fontWeight:600,color:T.white}}>{n.community}</div>
                                <div style={{fontSize:10,color:"#94A3B8",marginTop:1}}>
                                  {n.grossYield}% yield  AED {Math.round(n.avgPpsf).toLocaleString()}/sqft
                                  {n.goldenVisa?"  GV":""}
                                  {n.hasMetro?"  Metro":""}
                                </div>
                              </div>
                              <div style={{textAlign:"right",flexShrink:0}}>
                                <div style={{width:32,height:32,borderRadius:"50%",background:"rgba(212,168,67,0.1)",border:"1px solid rgba(212,168,67,0.3)",display:"flex",alignItems:"center",justifyContent:"center"}}>
                                  <span style={{fontSize:10,fontWeight:700,color:T.gold}}>{n.investmentScore||"--"}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                  <div style={{fontSize:11,color:T.textMuted,marginBottom:10}}>{matched.length>0?"Properties matching budget + area:":"No listings match yet."}</div>
                  {matched.map((l,i)=>(
                    <div key={i} style={{padding:"9px 11px",background:"rgba(255,255,255,0.03)",borderRadius:7,marginBottom:7,border:"1px solid "+T.border}}>
                      <div style={{fontSize:12,fontWeight:600,color:T.white,marginBottom:3}}>{l.title||l.name||"Property"}</div>
                      <div style={{display:"flex",justifyContent:"space-between"}}><span style={{fontSize:11,color:T.textMuted}}>{l.community||""}</span><span style={{fontSize:12,fontWeight:700,color:T.gold}}>{fmtB(l.price||l.priceMin)}</span></div>
                    </div>
                  ))}
                  {matched.length===0&&<button type="button" onClick={()=>handleTabChange?.("Projects")} style={{width:"100%",padding:"8px",borderRadius:7,border:"1px solid "+T.border,background:"rgba(212,168,67,0.06)",color:T.gold,fontSize:11,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>Browse Projects </button>}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/*  ADD LEAD MODAL  */}
      {showAdd&&(
        <div style={{position:"fixed",inset:0,background:"rgba(4,9,15,0.9)",zIndex:2000,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={e=>{if(e.target===e.currentTarget)setShowAdd(false);}}>
          <div style={{background:"#0D1117",borderRadius:14,border:"1px solid "+T.border,width:"100%",maxWidth:620,maxHeight:"92vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
            <div style={{padding:"15px 20px",borderBottom:"1px solid "+T.border,display:"flex",justifyContent:"space-between",alignItems:"center",position:"sticky",top:0,background:"#0D1117",zIndex:1}}>
              <div style={{fontFamily:"'Fraunces',serif",fontSize:15,fontWeight:900,color:T.white}}>Add New Lead</div>
              <button type="button" onClick={()=>setShowAdd(false)} style={{background:"rgba(255,255,255,0.06)",border:"1px solid "+T.border,borderRadius:7,color:T.textMuted,width:28,height:28,cursor:"pointer",fontSize:16,display:"flex",alignItems:"center",justifyContent:"center"}} aria-label="Close" title="Close">✕</button>
            </div>
            <div style={{padding:20}}>
              <div style={{marginBottom:10}}>
                <div style={{fontSize:11,fontWeight:700,color:T.white,marginBottom:10,paddingBottom:6,borderBottom:"1px solid "+T.border}}>Contact Information</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                  <div><Lbl>Full Name *</Lbl><Inp value={form.name} onChange={v=>F("name",v)} placeholder="Client full name"/></div>
                  <div><Lbl>Phone *</Lbl><PhoneInput value={form.phone} onChange={v=>F("phone",v)} /></div>
                  <div><Lbl>Email</Lbl><Inp value={form.email} onChange={v=>F("email",v)} placeholder="email@example.com" type="email"/></div>
                  <div><Lbl>Budget (AED)</Lbl><Inp value={form.budget} onChange={v=>F("budget",v)} placeholder="e.g. 2000000" type="number"/></div>
                </div>
              </div>
              <Section icon="" title="Request Information" sub="Project and classification details" color="#818CF8" open={openSec.request} onToggle={()=>setOpenSec(s=>({...s,request:!s.request}))}>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                  <div><Lbl>Request Type</Lbl><Sel value={form.requestType} onChange={v=>F("requestType",v)}><option value="">Select...</option>{REQUEST_TYPES.map(t=><option key={t} value={t}>{t}</option>)}</Sel></div>
                  <div><Lbl>Service Type</Lbl><Sel value={form.serviceType} onChange={v=>F("serviceType",v)}><option value="">Select...</option>{SERVICE_TYPES.map(t=><option key={t} value={t}>{t}</option>)}</Sel></div>
                  <div style={{gridColumn:"1/-1"}}><Lbl>Project</Lbl><Inp value={form.project} onChange={v=>F("project",v)} placeholder="Project name"/></div>
                  <div><Lbl>Lead Source</Lbl><Sel value={form.source} onChange={v=>F("source",v)}><option value="">Select...</option>{LEAD_SOURCES.map(s=><option key={s} value={s}>{s}</option>)}</Sel></div>
                  <div><Lbl>Channel</Lbl><Sel value={form.channel} onChange={v=>F("channel",v)}><option value="">Select...</option>{CHANNELS.map(c=><option key={c} value={c}>{c}</option>)}</Sel></div>
                  <div style={{gridColumn:"1/-1"}}><Lbl>Campaign</Lbl><Inp value={form.campaign} onChange={v=>F("campaign",v)} placeholder="Campaign name"/></div>
                  <div><Lbl>AD Name</Lbl><Inp value={form.adName} onChange={v=>F("adName",v)} placeholder="Ad name"/></div>
                  <div><Lbl>AD Account</Lbl><Inp value={form.adAccount} onChange={v=>F("adAccount",v)} placeholder="Ad account"/></div>
                  <div style={{gridColumn:"1/-1"}}><Lbl>Comment</Lbl><textarea value={form.comment} onChange={e=>F("comment",e.target.value)} placeholder="Additional notes..." rows={3} style={{width:"100%",padding:"8px 10px",background:"rgba(255,255,255,0.04)",border:"1px solid "+T.border,borderRadius:7,color:T.white,fontSize:12,outline:"none",resize:"none",boxSizing:"border-box",fontFamily:"'Outfit',sans-serif"}}/></div>
                </div>
              </Section>
              <Section icon="" title="Agent Information" sub="Assign to a sales agent" color="#FB923C" open={openSec.agent} onToggle={()=>setOpenSec(s=>({...s,agent:!s.agent}))}>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                  <div>
                    <Lbl>Assign To Agent</Lbl>
                    <Sel value={form.agentId} onChange={v=>{const agent=agents.find(a=>(a.uid||a.id)===v);F("agentId",v);if(agent)F("agentName",agent.name);}}>
                      <option value="">Unassigned</option>
                      {isAgent&&<option value={currentUid}>Myself</option>}
                      {agents.filter(a=>(a.uid||a.id)!==currentUid).map(a=><option key={a.uid||a.id} value={a.uid||a.id}>{a.name}</option>)}
                    </Sel>
                  </div>
                  <div><Lbl>Pipeline Status</Lbl><Sel value={form.status} onChange={v=>F("status",v)}>{PIPELINE.map(p=><option key={p.key} value={p.key}>{p.key}</option>)}</Sel></div>
                </div>
              </Section>
              <Section icon="" title="Additional Details" sub="Community, nationality, timeline" color="#10B981" open={openSec.extra} onToggle={()=>setOpenSec(s=>({...s,extra:!s.extra}))}>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
                  <div><Lbl>Nationality</Lbl><NationalitySelect value={form.nationality} onChange={v=>F("nationality",v)} /></div>
                  <div><Lbl>Community</Lbl><Inp value={form.community} onChange={v=>F("community",v)} placeholder="e.g. Dubai Marina"/></div>
                  <div><Lbl>Timeline</Lbl><Sel value={form.timeline} onChange={v=>F("timeline",v)}><option value="">Select...</option>{TIMELINES.map(t=><option key={t} value={t}>{t}</option>)}</Sel></div>
                </div>
              </Section>
              <button type="button" disabled={!form.name||!form.phone||saving} onClick={saveLead}
                style={{width:"100%",padding:"12px",borderRadius:8,border:"none",background:(!form.name||!form.phone)?"rgba(212,168,67,0.3)":"linear-gradient(135deg,#D4A843,#B8902E)",color:"#0A0E1A",fontSize:14,fontWeight:700,cursor:(!form.name||!form.phone)?"not-allowed":"pointer",fontFamily:"'Outfit',sans-serif"}}>
                {saving?"Saving...":"Save Lead"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/*  ASSIGN MODAL  */}
      {showAssign&&(
        <div style={{position:"fixed",inset:0,background:"rgba(4,9,15,0.88)",zIndex:2100,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={e=>{if(e.target===e.currentTarget)setShowAssign(null);}}>
          <div style={{background:"#0D1117",borderRadius:14,border:"1px solid "+T.border,width:"100%",maxWidth:400,padding:22}} onClick={e=>e.stopPropagation()}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
              <div>
                <div style={{fontFamily:"'Fraunces',serif",fontSize:15,fontWeight:900,color:T.white}}>Assign Lead</div>
                <div style={{fontSize:11,color:T.textMuted,marginTop:2}}>{showAssign.name||"Lead"}</div>
              </div>
              <button type="button" onClick={()=>setShowAssign(null)} style={{background:"rgba(255,255,255,0.06)",border:"1px solid "+T.border,borderRadius:7,color:T.textMuted,width:28,height:28,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}} aria-label="Close" title="Close">✕</button>
            </div>
            {agents.length===0&&<div style={{padding:"20px",textAlign:"center",color:T.textMuted,fontSize:12}}>No agents in your team yet. Create agents from the Team tab.</div>}
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {agents.map(agent=>(
                <button key={agent.uid||agent.id} type="button" onClick={()=>assignLead(showAssign.id,agent)}
                  style={{padding:"12px 14px",borderRadius:9,border:"1px solid "+(showAssign.assignedTo===(agent.uid||agent.id)?"#8B5CF6":T.border),background:showAssign.assignedTo===(agent.uid||agent.id)?"rgba(139,92,246,0.1)":"rgba(255,255,255,0.03)",textAlign:"left",cursor:"pointer",display:"flex",alignItems:"center",gap:12}}
                  onMouseEnter={e=>(e.currentTarget.style.background="rgba(139,92,246,0.1)")}
                  onMouseLeave={e=>(e.currentTarget.style.background=showAssign.assignedTo===(agent.uid||agent.id)?"rgba(139,92,246,0.1)":"rgba(255,255,255,0.03)")}
                >
                  <div style={{width:34,height:34,borderRadius:"50%",background:"rgba(139,92,246,0.15)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:700,color:"#8B5CF6",flexShrink:0}}>{(agent.name||"A")[0].toUpperCase()}</div>
                  <div>
                    <div style={{fontSize:13,fontWeight:600,color:T.white}}>{agent.name||"Agent"}</div>
                    <div style={{fontSize:10,color:T.textMuted}}>{agent.email||""}</div>
                  </div>
                  {showAssign.assignedTo===(agent.uid||agent.id)&&<span style={{marginLeft:"auto",fontSize:10,color:"#8B5CF6",fontWeight:700}}>Current</span>}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/*  WA TEMPLATES MODAL  */}
      {showWA&&(
        <div style={{position:"fixed",inset:0,background:"rgba(4,9,15,0.9)",zIndex:2100,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={e=>{if(e.target===e.currentTarget)setShowWA(false);}}>
          <div style={{background:"#0D1117",borderRadius:14,border:"1px solid "+T.border,width:"100%",maxWidth:480,padding:22}} onClick={e=>e.stopPropagation()}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
              <div>
                <div style={{fontFamily:"'Fraunces',serif",fontSize:15,fontWeight:900,color:T.white}}>WhatsApp Templates</div>
                <div style={{fontSize:11,color:T.textMuted,marginTop:2}}>{filtered.filter(l=>l.phone).length} leads with phone</div>
              </div>
              <button type="button" onClick={()=>setShowWA(false)} style={{background:"rgba(255,255,255,0.06)",border:"1px solid "+T.border,borderRadius:7,color:T.textMuted,width:28,height:28,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}} aria-label="Close" title="Close">✕</button>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:7}}>
              {WA_TEMPLATES.map((tmpl,i)=>(
                <button key={i} type="button" onClick={()=>{const lead=selectedLead||filtered.find(l=>l.phone);if(lead)sendWA(tmpl,lead);else{notify("No leads with phone","error");setShowWA(false);}}} style={{padding:"11px 13px",borderRadius:8,border:"1px solid rgba(37,211,102,0.2)",background:"rgba(37,211,102,0.04)",textAlign:"left",cursor:"pointer"}} onMouseEnter={e=>(e.currentTarget.style.background="rgba(37,211,102,0.1)")} onMouseLeave={e=>(e.currentTarget.style.background="rgba(37,211,102,0.04)")}>
                  <div style={{fontSize:12,fontWeight:700,color:"#25D366",marginBottom:3}}>{tmpl.label}</div>
                  <div style={{fontSize:10,color:T.textMuted,lineHeight:1.5}}>{tmpl.body.slice(0,100)}...</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/*  TOAST  */}
      {toast&&<div style={{position:"fixed",bottom:24,right:24,padding:"11px 18px",background:toast.type==="error"?"rgba(239,68,68,0.15)":"rgba(16,185,129,0.15)",border:"1px solid "+(toast.type==="error"?"#EF4444":"#10B981"),borderRadius:9,color:toast.type==="error"?"#EF4444":"#10B981",fontSize:12,fontWeight:600,zIndex:9999,boxShadow:"0 8px 32px rgba(0,0,0,0.4)"}}>{toast.msg}</div>}

    </div>
  );
}