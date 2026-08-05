/* eslint-disable */
/*
  DXB Analytics  MY LEADS TAB
  Session 11  4-Level Role-Aware CRM
  Owner / Director / Manager / Agent
  April 2026
*/

import React, { useState, useMemo, useCallback, useEffect } from "react";
import { collection, doc, addDoc, updateDoc, deleteDoc, serverTimestamp, query, where, getDocs, arrayUnion } from "firebase/firestore";
import { db, auth } from "../firebase";
import { T } from "../data";
import { GOLDEN_VISA_THRESHOLD } from "../utils/constants";
import Papa from "papaparse";
import PhoneInput from "../components/PhoneInput";
import { responseTime, responseReport } from "../crm/model/intake";
import { viewerFrom, scopeFor, intentFor, visibleRecords, canSeeClientContact } from "../crm/model/org";
import { diary, statusOf, newViewing, OUTCOMES, VERDICTS, FEEDBACK_PROMPT } from "../crm/model/viewing";
import NationalitySelect from "../components/NationalitySelect";
import { LEAD_STAGES, STAGE_MEANING, LEAD_SOURCES, NOTE_TYPES,
         CLOSED_STAGES, WON_STAGE, madeContact } from "../crm/model/leads";
/* THE SCREEN IS BUILT FROM THE SYSTEM NOW, NOT FROM GUESSES.
   Measured before this: 1,672 text nodes at 10px and 670 at 9px on this one
   tab, eleven text colours, and 8,195 of 8,615 clickable things under 32px
   tall — on the screen an agent reads all day. See src/design/system.js. */
import { colour as C, type as TY, space as S, radius as R, state as ST, surface } from "../design/system";
import { useSystemCSS, useViewport, PageHead, Card, Figure, FigureRow, Btn, Chip, Dot,
         Field, Input, Select, Toolbar, DataList, Empty, Toast as DsToast, Sheet } from "../design/ui";

/*  THE STAGES LIVE IN THE MODEL NOW, NOT HERE.
    They used to be declared in this component, which a plain Node script
    cannot read — so the demo seed wrote its own list of eight and the two
    shared exactly one name. See src/crm/model/leads.js for what that cost. */
const PIPELINE = LEAD_STAGES;
const SERVICE_TYPES  = ["Buyer","Seller","Tenant","Investor"];
const REQUEST_TYPES  = ["Off-Plan","Ready","Resale","Rental","Investment","Commercial"];
const CHANNELS       = ["WhatsApp","Phone Call","Email","In Person","Video Call","Social DM"];
const NATS           = ["Indian","British","Russian","Chinese","French","Pakistani","Saudi","Egyptian","German","American","Italian","Canadian","Australian","Japanese","Korean","Emirati","Filipino","Lebanese","Jordanian","Other"];
const TIMELINES      = ["Immediate","1-3 months","3-6 months","6-12 months","Just browsing"];

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
/* Which stages are still work is the model's answer, not a list retyped here. */
const OPEN      = l => !CLOSED_STAGES.includes(l.status);
const contacted = madeContact;

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


/* THE VIEWS, IN THE ORDER A DESK IS ACTUALLY WORKED.
   These were nine chips across the top of the tab. As a list they cost one
   control, and each label says what it means — "Gone quiet" rather than
   "Stale", which every agency reads differently. */
const SMART_VIEWS = [
  { k:"all",         l:"All leads" },
  { k:"hot",         l:"Needs a call" },
  { k:"uncontacted", l:"Never contacted" },
  { k:"overdue",     l:"Follow-up due" },
  { k:"today",       l:"Came in today" },
  { k:"stale",       l:"Gone quiet" },
  { k:"my_leads",    l:"Mine" },
  { k:"unassigned",  l:"Nobody owns them" },
  { k:"golden_visa", l:"Golden Visa budget" },
];

const BUDGET_LABEL = {
  all:"Any budget", under1m:"Under AED 1M", "1to3m":"AED 1M – 3M",
  "3to5m":"AED 3M – 5M", "5to10m":"AED 5M – 10M", above10m:"Above AED 10M",
};

/* ── WHAT COLOUR IS ALLOWED TO MEAN ────────────────────────────────────────
   PIPELINE above gives all eleven stages a colour of their own: red, blue,
   green, amber, purple, grey, WhatsApp green, teal, gold. On a list of forty
   leads that is a bag of sweets, and none of it tells an agent anything —
   because a STAGE is a category, not a state. "Potential" is not good news
   and "No Answer" is not bad news; they are places on a board.

   The state on this screen is URGENCY, which attention() already works out and
   already says in words. So urgency carries the colour, and stage is a plain
   chip. The two exceptions are the two terminal facts an owner scans for: a
   deal won and a deal lost.

   The result is a screen where anything coloured is worth looking at. */
const STAGE_TONE = { "Closed Deal": "positive", "Closed Outside": "critical" };
const stageTone = s => STAGE_TONE[s] || "neutral";

/** A viewing's status, on the same four-tone scale. statusOf() decides; this
    only paints — so a viewing nobody has closed off reads the same red as a
    lead nobody has called. */
const viewingTone = st => st?.key === "unclosed" ? "critical"
                        : st?.needsFeedback      ? "warning"
                        : st?.key === "done"     ? "positive"
                        : st?.key === "scheduled"? "info" : "neutral";

/** Urgency, on the four-tone scale. attention() ranks; this only paints. */
const attentionTone = l => {
  const r = attention(l).rank;
  if (r <= 1) return "critical";
  if (r <= 3) return "warning";
  if (r === 9) return "neutral";
  return "positive";
};

/** A filter that is on, and can be taken off where it sits. */
const FilterChip = ({ label, onClear }) => (
  <button type="button" onClick={onClear} title="Remove this filter"
    className="ds-btn ds-focus"
    style={{display:"inline-flex",alignItems:"center",gap:7,padding:"5px 12px",
            borderRadius:R.pill,cursor:"pointer",background:C.accentSoft,
            border:`1px solid ${C.accentLine}`,color:C.accent,
            fontFamily:TY.small.fontFamily,fontSize:12.5,fontWeight:600,minHeight:30}}>
    {label} <span aria-hidden style={{opacity:.75}}>✕</span>
  </button>
);

const FilterPill = ({ on, onClick, tip, children }) => (
  <button type="button" onClick={onClick} title={tip}
    className="ds-btn ds-focus"
    style={{padding:`0 ${S.md}px`,minHeight:34,borderRadius:R.pill,cursor:"pointer",
            fontFamily:TY.small.fontFamily,fontSize:13,fontWeight:on?700:500,whiteSpace:"nowrap",
            border:`1px solid ${on?C.accentLine:C.line}`,
            background:on?C.accentSoft:"transparent",
            color:on?C.accent:C.textMuted}}>
    {children}
  </button>
);

const Picker = ({ label, value, onChange, options }) => (
  <div style={{flex:"1 1 180px",minWidth:170}}>
    <Field label={label}>
      <Select value={value} onChange={onChange}>
        {options.map(([v,l])=><option key={v} value={v}>{l}</option>)}
      </Select>
    </Field>
  </div>
);

//  ATOMS
const PBadge = ({status}) => (
  <Chip tone={stageTone(status)} title={STAGE_MEANING[status]||""}>{status||"New Lead"}</Chip>
);

/* A progress bar filled to an invented percentage told an agent nothing they
   could act on or repeat. The reason itself is shorter to read and is the
   instruction. */
const WhyNow = ({lead}) => {
  const a=attention(lead), t=ST[attentionTone(lead)];
  return <span title="Why this lead sits where it does in the list"
    style={{...TY.small,fontSize:13,color:a.urgent?t.fg:C.textMuted,
            fontWeight:a.urgent?600:400,display:"flex",alignItems:"center",gap:6,minWidth:0}}>
    {a.urgent&&<Dot tone={attentionTone(lead)}/>}
    <span style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{a.reason}</span>
  </span>;
};

const EyePhone = ({phone}) => {
  const [show,setShow]=useState(false);
  return <span style={{display:"inline-flex",alignItems:"center",gap:6}}>
    <span style={{...TY.numeric,fontSize:14,color:C.text,letterSpacing:.2}}>{show?phone:maskPhone(phone)}</span>
    <button type="button" title={show?"Hide the number":"Show the number"}
      onClick={e=>{e.stopPropagation();setShow(v=>!v);}} className="ds-btn ds-focus"
      style={{background:"none",border:"none",cursor:"pointer",color:C.textMuted,
              padding:6,display:"inline-flex",borderRadius:R.control}}>
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">{show?<><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></>:<><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>}</svg>
    </button>
  </span>;
};

const Lbl = ({children}) => (
  <div style={{...TY.label,color:C.textMuted,marginBottom:6}}>{children}</div>
);
const Inp = ({value,onChange,placeholder,type="text",disabled=false}) => (
  <Input value={value} onChange={onChange} placeholder={placeholder} type={type} disabled={disabled}/>
);
const Sel = ({value,onChange,children,disabled=false}) => (
  <Select value={value||""} onChange={onChange} disabled={disabled}>{children}</Select>
);

/* A disclosure. The old one drew a coloured square that every caller left
   empty, so three blank boxes sat down the side of the panel. */
const Section = ({title,sub,open,onToggle,children}) => (
  <div style={{...surface(),marginBottom:S.md,overflow:"hidden"}}>
    <button type="button" onClick={onToggle} aria-expanded={open}
      className="ds-btn ds-focus"
      style={{width:"100%",display:"flex",alignItems:"center",gap:S.md,textAlign:"left",
              padding:`${S.md}px ${S.base}px`,minHeight:48,cursor:"pointer",background:"none",
              border:"none",borderBottom:open?`1px solid ${C.line}`:"none"}}>
      <span style={{flex:1,minWidth:0}}>
        <span style={{...TY.section,color:C.text,display:"block"}}>{title}</span>
        {sub&&<span style={{...TY.small,color:C.textMuted,display:"block",marginTop:2}}>{sub}</span>}
      </span>
      <span aria-hidden style={{color:C.textMuted,fontSize:13,transition:"transform .18s",
                                transform:open?"rotate(90deg)":"none"}}>▸</span>
    </button>
    {open&&<div style={{padding:S.base}}>{children}</div>}
  </div>
);

// 
// MAIN COMPONENT
// 
export default function MyLeadsTab({
  myDepartment, mySeniority, liveNeighbourhoods=[],
  myLeads=[], viewings=[], orgRole, userRole, orgId, orgName,
  listings=[], teamMembers=[], firebaseUser,
  leadSortBy, setLeadSortBy,
  selectedLead, setSelectedLead,
  handleTabChange,
}) {
  /* The design system's stylesheet — hover, focus rings and the phone rules,
     none of which can be expressed as an inline style. Injected once however
     many screens use it. `phone` decides list versus cards. */
  useSystemCSS();
  const { phone, width } = useViewport();

  /* WHO IS LOOKING, AND HOW MUCH OF THE DESK THEY SEE.
     ─────────────────────────────────────────────────────────────────────────
     This was five booleans off `orgRole`, and every difference between an agent
     and an owner was an `if` further down the file. That is why the two of them
     saw almost the same screen, and why there was nowhere at all to put a sales
     admin or an accounts clerk.

     Now the tab asks src/crm/model/org.js one question — how much of "leads"
     may this person see — and renders that. A department added to the model is
     a table entry there, not another conditional here. */
  const me     = useMemo(() => viewerFrom({ firebaseUser, orgRole, userRole, teamMembers,
                                            department: myDepartment, seniority: mySeniority }),
                         [firebaseUser, orgRole, userRole, teamMembers, myDepartment, mySeniority]);
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
  const [showFilters,  setShowFilters] = useState(false);
  const [showMore,     setShowMore]    = useState(false);
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

  /* How many filters are narrowing the list. Shown on the Filters button so it
     is obvious the list is not everything — the commonest confusion in any
     filtered table is not knowing a filter is on. */
  /* With a lead open the list becomes a rail rather than a squeezed table. */
  const compact = Boolean(selectedLead);

  const activeFilterCount = [activeStage,filterService,filterSource,filterBudget,
                             filterAgent,filterManager].filter(v=>v&&v!=="all").length;
  const clearFilters = useCallback(()=>{
    setActiveStage("all"); setFilterService("all"); setFilterSource("all");
    setFilterBudget("all"); setFilterAgent("all"); setFilterManager("all");
  },[]);

  /* THIS WEEK. An agent's week is viewings, and the product had no idea they
     existed — a viewing was a line of free text in the notes. */
  const myWeek = useMemo(()=>diary(viewings||[], currentUid),[viewings,currentUid]);
  const [showBook, setShowBook] = useState(null);   // the lead being booked for
  const [bookAt,   setBookAt]   = useState("");
  const [bookWhat, setBookWhat] = useState("");
  const [writeUp,  setWriteUp]  = useState(null);   // the viewing being closed off

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

  /* BOOKING ONE, AND CLOSING IT OFF.
     Both are small writes, and both matter more than their size: without the
     first there is no diary, and without the second the seller's question has
     no answer. */
  const bookViewing = useCallback(async()=>{
    if(!showBook||!bookAt){ notify("Pick a date and time","error"); return; }
    try{
      await addDoc(collection(db,"viewings"), newViewing({
        lead: showBook,
        listing: { id:"", title: bookWhat.trim() },
        agentId: currentUid, agentName: firebaseUser?.displayName||currentEmail, at: bookAt, orgId,
      }));
      /* It also goes on the lead, so the lead's own history reads as one story
         rather than the viewing living somewhere the agent has to remember. */
      await updateDoc(doc(db,"leads",showBook.id),{
        notes_log: arrayUnion({
          text:`Viewing booked${bookWhat.trim()?` — ${bookWhat.trim()}`:""} for ${new Date(bookAt).toLocaleString("en-AE",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"})}`,
          type:"Viewing", by:currentEmail, at:new Date().toISOString(),
        }),
        updatedAt:new Date().toISOString(),
      });
      setShowBook(null); setBookAt(""); setBookWhat("");
      notify("Viewing booked");
    }catch(e){ console.error("[leads] booking failed:",e); notify("Could not book that","error"); }
  },[showBook,bookAt,bookWhat,currentUid,firebaseUser,currentEmail,orgId,notify]);

  const removeViewing = useCallback(async(v)=>{
    try{
      await deleteDoc(doc(db,"viewings",v.id));
      setWriteUp(null);
      notify("Viewing removed");
    }catch(e){ console.error("[leads] could not remove viewing:",e); notify("Could not remove it","error"); }
  },[notify]);

  const closeOffViewing = useCallback(async(outcome,feedback,verdict)=>{
    if(!writeUp) return;
    if(outcome==="done" && !(feedback||"").trim()){
      notify("Say what they told you — the seller will ask","error"); return;
    }
    try{
      await updateDoc(doc(db,"viewings",writeUp.id),{
        outcome, feedback:(feedback||"").trim(), verdict:verdict||"",
        closedAt:new Date().toISOString(), updatedAt:new Date().toISOString(),
      });
      setWriteUp(null);
      notify(outcome==="done"?"Written up.":"Recorded.");
    }catch(e){ console.error("[leads] write-up failed:",e); notify("Could not save that","error"); }
  },[writeUp,notify]);

  /* DELETING A LEAD.
     The rules have always allowed a manager to delete one; the UI never offered
     it, so a lead could be created and never removed. In a CRM holding people's
     names and phone numbers that is not a missing convenience — a client asking
     to be taken off your books had no way to be, short of somebody opening the
     Firebase console.

     Managers and above only. An agent should not be able to erase a record of a
     client the agency has spoken to. */
  const [confirmDelete, setConfirmDelete] = useState(null);
  const deleteLead = useCallback(async(lead)=>{
    try{
      /* THEIR VIEWINGS GO WITH THEM.
         A viewing carries the client's name. Deleting the lead and leaving the
         viewings behind means the person is still in the system, in the diary,
         after being removed — which defeats the point of the deletion and is
         the wrong answer if they asked to be taken off your books. */
      const mine = (viewings||[]).filter(v=>v.leadId===lead.id);
      await Promise.all(mine.map(v=>deleteDoc(doc(db,"viewings",v.id))));
      await deleteDoc(doc(db,"leads",lead.id));
      setSelectedLead(null); setConfirmDelete(null);
      notify(mine.length
        ? `Lead deleted, along with ${mine.length} viewing${mine.length===1?"":"s"}.`
        : "Lead deleted");
    }catch(e){
      console.error("[leads] delete failed:",e);
      notify("Could not delete that lead","error");
    }
  },[notify,setSelectedLead,viewings]);

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
    <div className="ds-root" style={{padding:`${S.page}px ${S.lg}px`}}>
      <Empty title="Leads are not part of your role"
        what="This desk belongs to the sales floor. If that is wrong, your department is set incorrectly on your record — HR or your manager can change it."/>
    </div>
  );


  return (
    <div className="ds-root" style={{paddingBottom:S.page,maxWidth:1560}}>

      {/*  WHAT THIS TAB IS  ─────────────────────────────────────────────────
          One title, not two. The page used to print its heading at 17px and the
          sentence explaining it at 12px, then hand the reader nine filter chips,
          eleven stage pills and five dropdowns — all at 9 to 11px.

          The title says whose desk this is: an owner opening a screen headed
          "My leads" that in fact holds the whole agency's is being told
          something untrue about what they are looking at.                    */}
      <PageHead
        title={intent?.title || "Leads"}
        count={allLeads.length
          ? `${allLeads.length.toLocaleString()} ${allLeads.length===1?"lead":"leads"}${kHot?` · ${kHot} need a call`:""}`
          : null}
        question={`${scope==="own"
            ? "The leads assigned to you."
            : scope==="team"
            ? "Your team's leads — everyone who reports to you, and your own."
            : "Every enquiry the agency has taken."} Your own data: nothing here comes from the Land Department or any portal, and nothing is estimated or predicted.`}
        action={<>
          <Btn onClick={()=>setShowHelp(v=>!v)}>
            {showHelp?"Hide the guide":"What do these mean?"}
          </Btn>
          {allLeads.length>0&&<Btn variant="primary" onClick={()=>setShowAdd(true)}
            title="Record a new enquiry">+ Add a lead</Btn>}
        </>}>

        {showHelp&&(
          <div style={{marginTop:S.lg,display:"grid",gap:S.md,
                       gridTemplateColumns:"repeat(auto-fit, minmax(320px, 1fr))"}}>

            <Card title="How the order is decided">
              <p style={{...TY.small,color:C.textMuted,margin:`0 0 ${S.md}px`}}>
                Choose <b style={{color:C.text}}>Call order</b> in the sort box and the list
                works top to bottom, in this order:
              </p>
              <ol style={{margin:0,paddingLeft:20,...TY.small,color:C.text,lineHeight:1.85}}>
                {CALL_ORDER.map(r=><li key={r}>{r}</li>)}
              </ol>
              <p style={{...TY.small,color:C.textFaint,margin:`${S.md}px 0 0`,paddingTop:S.md,
                         borderTop:`1px solid ${C.line}`}}>
                That is the whole rule. There is no score, no model and no prediction of
                who will buy — every lead simply carries the reason it sits where it does,
                in words, on its own row.
              </p>
            </Card>

            {/* The meanings are one click away, not in anybody's head. The dots
                that used to sit here were eleven different colours; the stage
                is a category, so it no longer pretends to be a state. */}
            <Card title="What each stage means">
              <dl style={{margin:0,display:"grid",gap:S.sm}}>
                {PIPELINE.map(p=>(
                  <div key={p.key} style={{display:"flex",gap:S.md,alignItems:"baseline",flexWrap:"wrap"}}>
                    <dt style={{...TY.smallStrong,color:C.text,width:118,flexShrink:0}}>{p.key}</dt>
                    <dd style={{...TY.small,color:C.textMuted,margin:0,flex:"1 1 180px"}}>{STAGE_MEANING[p.key]}</dd>
                  </div>
                ))}
              </dl>
            </Card>

            <div style={{gridColumn:"1 / -1"}}>
              <Card title="What this tab does not do">
                <p style={{...TY.small,color:C.textMuted,margin:0}}>
                  It does not tell you who is likely to buy — nobody can, and a platform that
                  claims to is guessing. It does not check whether a phone number is real, chase
                  anyone automatically, or read your calls. A lead only moves down the list when
                  somebody logs a call, a message or a viewing against it, so the order is only
                  as honest as the notes your team keeps. Budgets are what the client said, not
                  what they have been approved for by a bank.
                </p>
              </Card>
            </div>
          </div>
        )}
      </PageHead>

      {/* THIS WEEK — the diary an agent did not have.
          Shown whenever there is something in it, above the lead list, because
          a viewing at eleven matters more this morning than a lead list does. */}
      {myWeek.total > 0 && (
        <div style={{marginBottom:S.lg}}>
        <Card title="This week" note={myWeek.headline} tone={myWeek.unclosed?"critical":undefined}>
          {myWeek.clashes.map((c,i)=>(
            <p key={i} style={{...TY.small,color:ST.critical.fg,margin:`0 0 ${S.sm}px`}}>{c.note}</p>
          ))}

          <div style={{display:"flex",flexDirection:"column",gap:S.base}}>
            {myWeek.days.slice(0,4).map(day=>(
              <div key={day.date}>
                <div style={{...TY.label,color:C.textMuted,marginBottom:S.sm}}>
                  {new Date(day.date).toLocaleDateString("en-AE",{weekday:"long",day:"2-digit",month:"short"})}
                </div>
                {/* Any viewing opens, not only overdue ones — a booked viewing has
                    to be cancellable and reschedulable, which was not possible at
                    all until now. */}
                <div style={{display:"flex",flexDirection:"column",gap:2}}>
                {day.items.map(v=>(
                  <button key={v.id} type="button" onClick={()=>setWriteUp(v)}
                    className="ds-row ds-focus ds-tap"
                    title="Open this viewing"
                    style={{display:"flex",gap:S.md,alignItems:"center",flexWrap:"wrap",
                            width:"100%",textAlign:"left",minHeight:38,padding:`${S.sm}px ${S.sm}px`,
                            background:"none",border:"none",borderRadius:R.control,cursor:"pointer"}}>
                    <span style={{...TY.numeric,fontSize:14,color:C.textMuted,minWidth:52,flexShrink:0}}>
                      {new Date(v.at).toLocaleTimeString("en-AE",{hour:"2-digit",minute:"2-digit"})}
                    </span>
                    <span style={{...TY.small,color:C.text,minWidth:0,flex:"1 1 auto"}}>
                      {v.propertyName||"A property"}{v.leadName?` · ${v.leadName}`:""}
                    </span>
                    <Chip tone={viewingTone(v.status)} title={v.status.note}>
                      {v.status.label}
                    </Chip>
                  </button>
                ))}
                </div>
              </div>
            ))}
          </div>

          {myWeek.unclosed>0 && (
            <p style={{...TY.small,color:ST.critical.fg,margin:`${S.md}px 0 0`,paddingTop:S.md,
                       borderTop:`1px solid ${C.line}`}}>
              Tap a viewing marked “Not written up” to close it off. {FEEDBACK_PROMPT}
            </p>
          )}
        </Card>
        </div>
      )}

      {/*  ONE ROW OF CONTROLS  ──────────────────────────────────────────────
          This was FOUR rows and roughly twenty-seven controls before a single
          lead was visible: nine "smart view" chips, a toolbar, eleven pipeline
          pills mostly reading zero, and five dropdowns. Two of those rows did
          overlapping jobs — a chip called "Needs a call" and a pill called
          "Hot Case" are both filters, sitting in different places, styled
          differently.

          An agent opening this had to read the whole control panel before
          finding out who to ring.

          Rebuilt on progressive disclosure: everything the immediate task needs
          on one line, everything else one click away.

            search · the view · filters (with a count) · order · how to look
                                                                             */}
      {allLeads.length>0&&(
      <Toolbar>
        {/* SEARCH — first, because it is what people reach for first, and wide
            because a phone gives it the whole row. */}
        <div style={{flex:"1 1 260px",minWidth:phone?"100%":220}}>
          <Input value={aiSearch} onChange={setAiSearch}
            placeholder="Search a name, a phone number, an area…"/>
        </div>

        {/* THE VIEW — one dropdown replacing nine chips. Same power, one control,
            and each option says what it means rather than relying on a word like
            "Stale" that every agency reads differently. */}
        <div style={{flex:"0 1 190px",minWidth:170}}>
          <Select value={smartView} onChange={v=>{setSmartView(v);setActiveStage("all");}}>
            {SMART_VIEWS.filter(v=>v.k!=="unassigned"||canManage).map(v=>(
              <option key={v.k} value={v.k}>{v.l}{v.k==="hot"&&kHot?` (${kHot})`:""}{v.k==="unassigned"&&kUnassigned?` (${kUnassigned})`:""}</option>
            ))}
          </Select>
        </div>

        {/* FILTERS — the eleven pills and four dropdowns, behind one button that
            says how many are on. Nothing is lost; it is simply not shouted. */}
        <Btn onClick={()=>setShowFilters(v=>!v)}
          title="Narrow by stage, type, source, budget or agent">
          Filters{activeFilterCount?` · ${activeFilterCount}`:""}
        </Btn>

        <div style={{flex:"0 1 185px",minWidth:165}}>
          <Select value={leadSortBy||"date"} onChange={v=>setLeadSortBy&&setLeadSortBy(v)}>
            <option value="score">Call order</option>
            <option value="date">Newest first</option>
            <option value="budget">Biggest budget first</option>
            <option value="name">Name A–Z</option>
          </Select>
        </div>

        {/* List / Board / Reports. A board of eleven columns cannot work on a
            phone and pretending otherwise is how you get sideways scrolling,
            so the phone gets the list and the reports. */}
        <div style={{display:"flex",gap:2,background:C.panelSunk,border:`1px solid ${C.line}`,
                     borderRadius:R.control,padding:3,marginLeft:phone?0:"auto"}}>
          {[{k:"table",l:"List",tip:"Every lead in one list, in the order you chose"},
            {k:"kanban",l:"Board",tip:"The same leads as cards, in columns by stage",desktopOnly:true},
            {k:"analytics",l:"Reports",tip:"Where your leads come from, and how each agent is doing"}]
            .filter(v=>!(v.desktopOnly&&phone)).map(v=>(
            <button key={v.k} type="button" onClick={()=>setView(v.k)} title={v.tip}
              className="ds-btn ds-focus"
              style={{padding:`0 ${S.md}px`,minHeight:30,borderRadius:6,cursor:"pointer",
                      fontFamily:TY.small.fontFamily,fontSize:13,
                      border:view===v.k?`1px solid ${C.accentLine}`:"1px solid transparent",
                      fontWeight:view===v.k?700:500,
                      background:view===v.k?C.accentSoft:"transparent",
                      color:view===v.k?C.accent:C.textMuted,whiteSpace:"nowrap"}}>{v.l}</button>
          ))}
        </div>

        {/* Export and WhatsApp are things you do occasionally. They were sitting
            at the same weight as the search box. */}
        <div style={{position:"relative"}}>
          <Btn onClick={()=>setShowMore(v=>!v)} title="More actions">⋯</Btn>
          {showMore&&(
            <div style={{position:"absolute",right:0,top:44,zIndex:60,...surface(true),
                         padding:S.xs,minWidth:230,boxShadow:"0 12px 34px rgba(0,0,0,.5)"}}>
              {[["Export what is on screen",()=>{exportCSV();setShowMore(false);}],
                ["WhatsApp the selected lead",()=>{setShowWA(true);setShowMore(false);}]].map(([l,fn])=>(
                <button key={l} type="button" onClick={fn} className="ds-btn ds-focus"
                  style={{display:"block",width:"100%",textAlign:"left",padding:`${S.md}px ${S.md}px`,
                          borderRadius:6,border:"none",background:"none",color:C.text,
                          ...TY.small,fontSize:14,cursor:"pointer",minHeight:40}}>{l}</button>
              ))}
            </div>
          )}
        </div>

      </Toolbar>
      )}

      {/* WHAT IS CURRENTLY NARROWING THE LIST.
          Only appears when something is on, and every one of them is removable
          where it sits — the old chips were clickable with no sign they were. */}
      {allLeads.length>0&&activeFilterCount>0&&(
        <div style={{display:"flex",gap:S.sm,alignItems:"center",flexWrap:"wrap",
                     marginBottom:S.base}}>
          <span style={{...TY.small,color:C.textMuted}}>
            Showing {filtered.length} of {allLeads.length}
          </span>
          {activeStage!=="all"&&<FilterChip label={activeStage} onClear={()=>setActiveStage("all")}/>}
          {filterService!=="all"&&<FilterChip label={filterService} onClear={()=>setFilterService("all")}/>}
          {filterSource!=="all"&&<FilterChip label={filterSource} onClear={()=>setFilterSource("all")}/>}
          {filterBudget!=="all"&&<FilterChip label={BUDGET_LABEL[filterBudget]||filterBudget} onClear={()=>setFilterBudget("all")}/>}
          {filterAgent!=="all"&&<FilterChip label={agents.find(a=>(a.uid||a.id)===filterAgent)?.name||"Agent"} onClear={()=>setFilterAgent("all")}/>}
          {filterManager!=="all"&&<FilterChip label={managers.find(m=>(m.uid||m.id)===filterManager)?.name||"Manager"} onClear={()=>setFilterManager("all")}/>}
          <Btn variant="ghost" onClick={clearFilters}>Clear all</Btn>
        </div>
      )}

      {/* THE FILTER PANEL — opened on demand, and it hides any stage with
          nothing in it. Eleven pills reading zero taught an agent that the
          numbers do not mean anything. */}
      {allLeads.length>0&&showFilters&&(
        <div style={{marginBottom:S.lg}}>
        <Card title="Narrow the list">
          <div style={{marginBottom:S.lg}}>
            <Lbl>Stage</Lbl>
            <div style={{display:"flex",gap:S.sm,flexWrap:"wrap"}}>
              <FilterPill on={activeStage==="all"} onClick={()=>setActiveStage("all")}
                tip="Every stage">All {allLeads.length}</FilterPill>
              {PIPELINE.filter(p=>(stageCounts[p.key]||0)>0).map(p=>(
                <FilterPill key={p.key} on={activeStage===p.key}
                  tip={STAGE_MEANING[p.key]}
                  onClick={()=>setActiveStage(activeStage===p.key?"all":p.key)}>
                  {p.key} {stageCounts[p.key]}
                </FilterPill>
              ))}
            </div>
            {PIPELINE.some(p=>!(stageCounts[p.key]||0)) && (
              <div style={{...TY.small,color:C.textFaint,marginTop:S.sm}}>
                Stages with nobody in them are not shown.
              </div>
            )}
          </div>

          <div style={{display:"flex",gap:S.md,flexWrap:"wrap"}}>
            {scope==="org"&&managers.length>0&&(
              <Picker label="Manager" value={filterManager} onChange={setFilterManager}
                options={[["all","All managers"],...managers.map(m=>[m.uid||m.id,m.name])]}/>
            )}
            {canManage&&agents.length>0&&(
              <Picker label="Agent" value={filterAgent} onChange={setFilterAgent}
                options={[["all","All agents"],...agents.map(a=>[a.uid||a.id,a.name])]}/>
            )}
            <Picker label="Looking to" value={filterService} onChange={setFilterService}
              options={[["all","Buy, sell, rent or invest"],...SERVICE_TYPES.map(t=>[t,t])]}/>
            <Picker label="Came from" value={filterSource} onChange={setFilterSource}
              options={[["all","Any source"],...LEAD_SOURCES.map(x=>[x,x])]}/>
            <Picker label="Budget" value={filterBudget} onChange={setFilterBudget}
              options={Object.entries(BUDGET_LABEL)}/>
          </div>
        </Card>
        </div>
      )}

      {/*  MAIN CONTENT  */}
      {/* When a lead is open, the panel is what is being read and the list is
          only there to switch between people. So the list gets a fixed narrow
          rail and the panel takes everything else. The other way round left
          580px of empty rail beside a 400px panel doing all the work. */}
      <div style={{display:"grid",
                   /* minmax(0,1fr), never plain 1fr. A grid track's default
                      min-width is auto, so a plain 1fr grows to fit the widest
                      thing inside it — which meant the grid's own horizontal
                      scroller never engaged and the whole page went 18px
                      sideways instead. */
                   gridTemplateColumns:(selectedLead&&!phone)?"320px minmax(0,1fr)":"minmax(0,1fr)",
                   gap:S.base,alignItems:"start"}}>

        {/*  TABLE VIEW  ─────────────────────────────────────────────────────
            With no leads at all, the board drew eleven empty stage columns each
            reading "No leads", and the reports drew seven zeroes and an empty
            leaderboard. There is nothing to board or report on, so all three
            views land on the same honest empty desk.                         */}
        {(view==="table"||allLeads.length===0)&&(
          <div>
            {allLeads.length===0&&(
              /* An empty desk is the first thing a new customer sees, so it says
                 what the tab will do for them rather than only that it is empty. */
              <Empty title="No leads on this desk yet"
                what="Add an enquiry and it appears here with the reason it needs attention — never called, follow-up overdue, or gone quiet — so you always know who to ring first. Nothing is filled in for you and nothing is guessed."
                action={<Btn variant="primary" onClick={()=>setShowAdd(true)}>Add the first lead</Btn>}/>
            )}

            {filtered.length===0&&allLeads.length>0&&(
              <Empty title="No leads match what you have chosen"
                what="Every filter you have on is listed above the list. Take one off, or clear them all, to widen it again."
                action={activeFilterCount?<Btn onClick={clearFilters}>Clear all filters</Btn>:null}/>
            )}

            {/* ONE DESCRIPTION OF THE DATA, TWO SHAPES ON SCREEN.
                This was a hand-built CSS grid whose seven fixed columns came to
                672px. At 390px it took the whole page 350px sideways, so an
                agent standing in an apartment could not read their own list;
                and with the detail panel open the columns collapsed into each
                other and the headings ran together as "CLIENTSTAGE".

                DataList renders a table where there is room and cards where
                there is not, off this one definition — so there is nothing to
                keep in step. `compact` (the panel is open) is treated exactly
                like a phone, because 320px of rail is a phone.               */}
            {filtered.length>0&&(
              <DataList
                rows={filtered}
                rowKey={(l,i)=>l.id||i}
                onRowClick={l=>setSelectedLead(selectedLead?.id===l.id?null:l)}
                stack={compact} dense={compact}
                columns={[
                  /* ONE LINE PER LEAD. The name and the reason used to be
                     stacked in one cell with a 32px avatar beside them, which
                     made every row 81px tall — seven leads on a 900px screen
                     out of 418. The reason is a fact about the lead, so it
                     gets its own column and can be scanned down like any
                     other. The avatar was decoration and is gone. */
                  { key:"client", head:"Client", width:172, phone:"title",
                    cell:l=>{
                      const isGV=parseFloat(l.budget||0)>=GV_MIN;
                      return (
                        <span style={{display:"flex",alignItems:"center",gap:S.sm,minWidth:0}}>
                          <Dot tone={attentionTone(l)}/>
                          <span style={{...TY.smallStrong,color:C.text,overflow:"hidden",
                                        textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                            {l.name||"Unnamed"}
                          </span>
                          {isGV&&<span title={`Budget is at or above AED ${(GV_MIN/1e6).toFixed(0)}M, the property route to a 10-year Golden Visa. Eligibility is confirmed by ICP, not by us.`}
                            style={{...TY.label,fontSize:12,color:C.accent,flexShrink:0}}>GV</span>}
                        </span>
                      );
                    }},
                  { key:"why", head:"Why it is next", width:218, phone:"sub",
                    cell:l=><WhyNow lead={l}/> },
                  { key:"stage", head:"Stage", width:118, phone:"trail",
                    cell:l=><PBadge status={l.status||"New Lead"}/> },
                  { key:"budget", head:"Budget", width:104, align:"right", phone:"meta",
                    cell:l=><span style={{...TY.numeric,fontSize:13,color:C.text}}>{fmtB(l.budget)||"—"}</span> },
                  { key:"service", head:"Looking to", width:92, phone:"meta",
                    cell:l=><span style={{color:l.serviceType||l.type?C.text:C.textFaint}}>
                      {l.serviceType||l.type||"—"}</span> },
                  { key:"source", head:"Came from", width:112, phone:"meta",
                    /* The dot here was one of fifteen brand colours — Bayut
                       orange, Dubizzle red, Instagram pink. A source is not a
                       state, so it is now simply its name. */
                    cell:l=><span style={{color:C.textMuted}}>{l.source||"—"}</span> },
                  { key:"reply", head:"Answered in", width:88, align:"right", wide:true,
                    cell:l=>{ const r=responseTime(l);
                      if(!r.answered) return <span style={{color:C.textFaint}}>—</span>;
                      return <span title={`How long this lead waited for a first call, message or email. ${r.note}`}
                        style={{...TY.numeric,fontSize:13,color:C.textMuted}}>
                        {r.minutes<60?`${r.minutes}m`:`${Math.floor(r.minutes/60)}h`}</span>; } },
                  { key:"agent", head:"Agent", width:124, phone:"meta",
                    cell:l=>l.assignedToName
                      ? <span style={{color:C.text}}>{l.assignedToName}</span>
                      : canManage
                        ? <button type="button" onClick={e=>{e.stopPropagation();setShowAssign(l);}}
                            className="ds-focus"
                            style={{...TY.small,fontSize:13,color:C.accent,background:"none",cursor:"pointer",
                                    border:`1px dashed ${C.accentLine}`,borderRadius:R.control,
                                    padding:"0 10px",height:30}}>Assign</button>
                        : <span style={{color:C.textFaint}}>Nobody</span> },
                  { key:"wa", head:" ", width:52, align:"center",
                    cell:l=>l.phone
                      ? <a href={"https://wa.me/"+clnPhone(l.phone)} target="_blank" rel="noopener noreferrer"
                          onClick={e=>e.stopPropagation()} title={`Message ${l.name||"this lead"} on WhatsApp`}
                          className="ds-focus"
                          style={{display:"inline-flex",alignItems:"center",justifyContent:"center",
                                  minWidth:36,height:30,borderRadius:R.control,textDecoration:"none",
                                  border:`1px solid ${C.line}`,color:C.textMuted,...TY.label,fontSize:12}}>
                          WA</a>
                      : null },
                ].filter(c=>(!compact||["client","why"].includes(c.key)) && (!c.wide||width>=1500))}
              />
            )}
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
                              <span style={{fontSize:9,color:C.textMuted}}>{lead.source||"Manual"}</span>
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
                    <div style={{fontSize:11,fontWeight:700,color:C.text,marginBottom:5,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.src}</div>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end"}}>
                      <div><div style={{fontSize:18,fontWeight:900,color:T.white,fontFamily:"'Fraunces',serif",lineHeight:1}}>{s.total}</div><div style={{fontSize:9,color:T.textMuted}}>leads</div></div>
                      <div style={{textAlign:"right"}}><div style={{fontSize:14,fontWeight:900,color:s.rate>=10?"#10B981":s.rate>=5?"#D4A843":"#EF4444",fontFamily:"'Fraunces',serif",lineHeight:1}}>{s.rate}%</div><div style={{fontSize:9,color:T.textMuted}}>closed</div></div>
                    </div>
                    <div style={{height:2,background:T.border,borderRadius:1,marginTop:7}}><div style={{height:"100%",width:Math.min(s.total,100)+"%",background:C.accent,borderRadius:1,opacity:0.7}}/></div>
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
          <div style={{...surface(),display:"flex",flexDirection:"column",
                       maxHeight:phone?undefined:"calc(100vh - 150px)",
                       position:phone?"static":"sticky",top:0,overflowY:"auto"}}>
            <div style={{padding:`${S.md}px ${S.base}px`,borderBottom:`1px solid ${C.line}`,
                         background:C.groundAlt,position:"sticky",top:0,zIndex:2}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",
                           gap:S.md,marginBottom:S.md}}>
                <div style={{minWidth:0}}>
                  <div style={{...TY.title,fontSize:19,color:C.text}}>{selectedLead.name||"Unnamed"}</div>
                  <div style={{display:"flex",gap:S.sm,alignItems:"center",marginTop:6,flexWrap:"wrap"}}>
                    <PBadge status={selectedLead.status||"New Lead"}/>
                    {parseFloat(selectedLead.budget||0)>=GV_MIN&&(
                      <Chip tone="info" title={`Budget is at or above AED ${(GV_MIN/1e6).toFixed(0)}M, the property route to a 10-year Golden Visa. Eligibility is confirmed by ICP, not by us.`}>Golden Visa</Chip>
                    )}
                  </div>
                </div>
                <Btn variant="ghost" onClick={()=>setSelectedLead(null)} title="Close lead details">✕</Btn>
              </div>

              {/* The three things you do next, at the same weight, because they
                  are the same kind of thing. They were WhatsApp green, a blue
                  Call and a purple Reassign — three brand palettes in a 300px
                  panel, none of which meant anything. */}
              <div style={{display:"flex",gap:S.sm,flexWrap:"wrap",marginBottom:S.md}}>
                {selectedLead.phone&&(
                  <a href={"https://wa.me/"+clnPhone(selectedLead.phone)} target="_blank" rel="noopener noreferrer"
                     className="ds-btn ds-focus"
                     style={{display:"inline-flex",alignItems:"center",minHeight:34,padding:`0 ${S.md}px`,
                             borderRadius:R.control,border:`1px solid ${C.line}`,color:C.text,
                             textDecoration:"none",...TY.smallStrong}}>WhatsApp</a>
                )}
                {selectedLead.phone&&(
                  <a href={"tel:"+selectedLead.phone} className="ds-btn ds-focus"
                     style={{display:"inline-flex",alignItems:"center",minHeight:34,padding:`0 ${S.md}px`,
                             borderRadius:R.control,border:`1px solid ${C.line}`,color:C.text,
                             textDecoration:"none",...TY.smallStrong}}>Call</a>
                )}
                {canManage&&<Btn onClick={()=>setShowAssign(selectedLead)}>Reassign</Btn>}
              </div>

              {/* CHANGING THE STAGE.
                  This was eleven chips wrapped across a narrow panel — the same
                  crowding the filter bar had, in a third of the width. One
                  control, and the meaning of whatever is chosen is printed
                  under it rather than hidden in a tooltip. */}
              <Field label="Stage" hint={STAGE_MEANING[selectedLead.status||"New Lead"]}>
                <Select value={selectedLead.status||"New Lead"}
                  onChange={v=>updateStatus(selectedLead.id,v)}>
                  {PIPELINE.map(p=><option key={p.key} value={p.key}>{p.key}</option>)}
                </Select>
              </Field>
            </div>

            <div style={{display:"flex",gap:2,padding:S.xs,borderBottom:`1px solid ${C.line}`}}>
              {[{k:"profile",l:"Profile"},{k:"activity",l:"Activity"},{k:"match",l:"Matches"}].map(t=>(
                <button key={t.k} type="button" onClick={()=>setDrawerTab(t.k)}
                  className="ds-btn ds-focus"
                  style={{flex:1,minHeight:36,border:"none",borderRadius:R.control,
                          background:drawerTab===t.k?C.accentSoft:"transparent",
                          color:drawerTab===t.k?C.accent:C.textMuted,
                          ...TY.smallStrong,cursor:"pointer"}}>{t.l}</button>
              ))}
            </div>
            <div style={{padding:S.base,flex:1}}>

              {drawerTab==="profile"&&(()=>{
                const att=attention(selectedLead);
                return (
                  <div>
                    {/* Was "AI LEAD SCORE — 65/100 Warm", a number with no defensible
                        basis. This states the fact and the next action instead. */}
                    {(()=>{ const t=ST[attentionTone(selectedLead)]; return (
                    <div style={{padding:`${S.md}px ${S.base}px`,borderRadius:R.control,
                                 background:t.bg,border:`1px solid ${t.line}`,marginBottom:S.base}}>
                      <div style={{...TY.label,color:C.textMuted,marginBottom:5}}>Why this one now</div>
                      <div style={{...TY.bodyStrong,color:t.fg}}>{att.reason}</div>
                      <div style={{...TY.small,color:C.textMuted,marginTop:6}}>
                        {att.urgent
                          ? "This is one of the leads the list puts first. Log a call or a message below and it moves down."
                          : "Nothing is overdue on this one. It sits below anything uncontacted or overdue."}
                      </div>
                    </div>); })()}
                    <div style={{marginBottom:S.base}}>
                      <Btn variant="primary" full
                        onClick={()=>{setShowBook(selectedLead);setBookAt("");setBookWhat("");}}
                        title="Arrange a viewing. It goes in your week and on this lead's history.">
                        Book a viewing
                      </Btn>
                    </div>
                    {/* Seventeen fields in one flat column meant a 660px eye-run
                        from every label to its value, and blank rows that said
                        nothing at all. Now three groups in two columns, and a
                        missing value states which kind of missing it is.

                        `chase` marks what an agent should go and get: no email
                        on a buyer is a gap. The ad-tracking fields are not —
                        a walk-in has no campaign, and printing "Campaign: not
                        given" on every manual lead is noise, not information. */}
                    {[
                      {group:"How to reach them", fields:[
                        {label:"Phone",       value:selectedLead.phone,   link:"tel:"+selectedLead.phone, chase:true},
                        {label:"WhatsApp",    value:selectedLead.phone?"Open":null, link:selectedLead.phone?"https://wa.me/"+clnPhone(selectedLead.phone):null, ext:true},
                        {label:"Email",       value:selectedLead.email,   link:selectedLead.email?"mailto:"+selectedLead.email:null, chase:true},
                        {label:"Nationality", value:selectedLead.nationality||"", chase:true},
                      ]},
                      {group:"What they are after", fields:[
                        {label:"Budget",      value:fmtB(selectedLead.budget), chase:true},
                        {label:"Service",     value:selectedLead.serviceType||selectedLead.type||"", chase:true},
                        {label:"Community",   value:selectedLead.community||"", chase:true},
                        {label:"Timeline",    value:selectedLead.timeline||"", chase:true},
                        {label:"Request",     value:selectedLead.requestType||""},
                        {label:"Project",     value:selectedLead.project||""},
                      ]},
                      {group:"Where it came from", fields:[
                        {label:"Source",      value:selectedLead.source||""},
                        {label:"Channel",     value:selectedLead.channel||""},
                        {label:"Campaign",    value:selectedLead.campaign||""},
                        {label:"AD Name",     value:selectedLead.adName||""},
                        {label:"AD Account",  value:selectedLead.adAccount||""},
                        {label:"Assigned To", value:selectedLead.assignedToName||"Unassigned"},
                        {label:"Added",       value:fmtD(selectedLead.createdAt)},
                      ]},
                    ].map(sec=>{
                      /* A field shows if it has a value, or if it is one an agent
                         ought to chase. Everything else stays out of the way. */
                      const show=sec.fields.filter(f=>f.value||f.chase);
                      if(!show.length) return null;
                      return (
                        <div key={sec.group} style={{marginBottom:S.lg}}>
                          <div style={{...TY.label,color:C.textMuted,marginBottom:S.sm}}>{sec.group}</div>
                          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(250px,1fr))",
                                       columnGap:S.xl,rowGap:0}}>
                            {show.map((f,i)=>(
                              <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",
                                                   gap:S.md,minHeight:30,padding:`${S.xs}px 0`,
                                                   borderBottom:`1px solid ${C.line}`}}>
                                <span style={{...TY.small,color:C.textMuted,flexShrink:0}}>{f.label}</span>
                                {f.link
                                  ?<a href={f.link} target={f.ext?"_blank":"_self"} rel="noopener noreferrer"
                                      className="ds-focus"
                                      style={{...TY.smallStrong,color:C.accent,textDecoration:"none",
                                              overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{f.value}</a>
                                  :f.value
                                    ?<span style={{...TY.smallStrong,color:C.text,textAlign:"right",
                                                   overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{f.value}</span>
                                    :<span title="Nobody has recorded this yet. Ask the client next time you speak to them."
                                           style={{...TY.small,color:C.textFaint,whiteSpace:"nowrap"}}>not asked yet</span>
                                }
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                    {selectedLead.comment&&(
                      <div style={{marginTop:S.md,padding:`${S.md}px ${S.base}px`,
                                   background:C.panelSunk,borderRadius:R.control,
                                   border:`1px solid ${C.line}`}}>
                        <div style={{...TY.label,color:C.textMuted,marginBottom:5}}>Comment</div>
                        <div style={{...TY.small,color:C.text}}>{selectedLead.comment}</div>
                      </div>)}
                  </div>
                );
              })()}

              {/* Removing somebody sits at the foot of their record, after
                  everything you would want to read before deciding. It was
                  the first control under the tabs, above the client's own
                  details, which is the wrong thing to offer first. */}
              {drawerTab==="profile"&&canManage&&(
                <div style={{marginBottom:12}}>
                  {confirmDelete?.id===selectedLead.id ? (
                    <div style={{display:"flex",gap:7,alignItems:"center",flexWrap:"wrap"}}>
                      <span style={{fontSize:10.5,color:T.textSecondary}}>Delete {selectedLead.name||"this lead"} for good?</span>
                      <button type="button" onClick={()=>deleteLead(selectedLead)}
                        style={{padding:"4px 11px",borderRadius:6,border:"1px solid rgba(239,68,68,0.4)",
                                background:"rgba(239,68,68,0.1)",color:"#FCA5A5",fontSize:10.5,cursor:"pointer",
                                fontFamily:"'Outfit',sans-serif"}}>Delete</button>
                      <button type="button" onClick={()=>setConfirmDelete(null)}
                        style={{padding:"4px 11px",borderRadius:6,border:"1px solid "+T.border,background:"transparent",
                                color:T.textMuted,fontSize:10.5,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>Keep it</button>
                    </div>
                  ) : (
                    <button type="button" onClick={()=>setConfirmDelete(selectedLead)}
                      title="Remove this lead entirely, along with any viewings booked for them. Use it when a client asks to be taken off your books."
                      style={{background:"none",border:"none",color:T.textMuted,fontSize:10.5,cursor:"pointer",
                              padding:0,fontFamily:"'Outfit',sans-serif"}}>
                      Delete this lead
                    </button>
                  )}
                </div>
              )}

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

      {/* BOOK A VIEWING */}
      {showBook && (
        <div style={{position:"fixed",inset:0,background:"rgba(4,9,15,0.9)",zIndex:2100,display:"flex",
                     alignItems:"center",justifyContent:"center",padding:20}}
             onClick={e=>{if(e.target===e.currentTarget)setShowBook(null);}}>
          <div style={{background:"#0D1117",borderRadius:14,border:"1px solid "+T.border,width:"100%",maxWidth:430,padding:22}}>
            <div style={{fontFamily:"'Fraunces',serif",fontSize:15,fontWeight:900,color:T.white,marginBottom:3}}>
              Book a viewing
            </div>
            <div style={{fontSize:11,color:T.textMuted,marginBottom:16}}>With {showBook.name||"this lead"}</div>

            <div style={{fontSize:10,color:T.textMuted,marginBottom:4,fontWeight:700,textTransform:"uppercase",letterSpacing:.5}}>When</div>
            <input type="datetime-local" value={bookAt} onChange={e=>setBookAt(e.target.value)}
              style={{width:"100%",padding:"9px 11px",background:"rgba(255,255,255,0.04)",border:"1px solid "+T.border,
                      borderRadius:7,color:T.white,fontSize:12,outline:"none",boxSizing:"border-box",
                      fontFamily:"'Outfit',sans-serif",marginBottom:12}}/>

            <div style={{fontSize:10,color:T.textMuted,marginBottom:4,fontWeight:700,textTransform:"uppercase",letterSpacing:.5}}>What are you showing them</div>
            <input value={bookWhat} onChange={e=>setBookWhat(e.target.value)}
              placeholder="e.g. Marina Gate 2, unit 1104"
              style={{width:"100%",padding:"9px 11px",background:"rgba(255,255,255,0.04)",border:"1px solid "+T.border,
                      borderRadius:7,color:T.white,fontSize:12,outline:"none",boxSizing:"border-box",
                      fontFamily:"'Outfit',sans-serif",marginBottom:8}}/>
            <div style={{fontSize:10,color:T.textMuted,lineHeight:1.55,marginBottom:16}}>
              It goes in your week and on this lead&rsquo;s history, and you will be reminded
              the evening before.
            </div>

            <div style={{display:"flex",gap:8}}>
              <button type="button" onClick={bookViewing} disabled={!bookAt}
                style={{flex:1,padding:"10px",borderRadius:8,border:"none",fontFamily:"'Outfit',sans-serif",
                        background:bookAt?"linear-gradient(135deg,#D4A843,#B8902E)":"rgba(212,168,67,0.3)",
                        color:"#0A0E1A",fontSize:12,fontWeight:700,cursor:bookAt?"pointer":"not-allowed"}}>
                Book it
              </button>
              <button type="button" onClick={()=>setShowBook(null)}
                style={{padding:"10px 16px",borderRadius:8,border:"1px solid "+T.border,background:"transparent",
                        color:T.textMuted,fontSize:12,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WRITE IT UP */}
      {writeUp && <WriteUp viewing={writeUp} onClose={()=>setWriteUp(null)} onSave={closeOffViewing}
                           onRemove={()=>removeViewing(writeUp)} canRemove={canManage}/>}

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

/**
 * CLOSING OFF A VIEWING.
 *
 * The one screen that decides whether the seller can ever be told what people
 * said. "Viewed" with no feedback is refused — not to be awkward, but because a
 * viewing with no record of what was said is worth almost nothing to the person
 * paying the commission.
 */
function WriteUp({ viewing, onClose, onSave, onRemove, canRemove }) {
  const [outcome,  setOutcome]  = useState("done");
  const [feedback, setFeedback] = useState("");
  const [verdict,  setVerdict]  = useState("");

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(4,9,15,0.9)",zIndex:2100,display:"flex",
                 alignItems:"center",justifyContent:"center",padding:20}}
         onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div style={{background:"#0D1117",borderRadius:14,border:"1px solid "+T.border,width:"100%",
                   maxWidth:460,padding:22,maxHeight:"90vh",overflowY:"auto"}}>
        <div style={{fontFamily:"'Fraunces',serif",fontSize:15,fontWeight:900,color:T.white,marginBottom:3}}>
          How did it go?
        </div>
        <div style={{fontSize:11,color:T.textMuted,marginBottom:16}}>
          {viewing.propertyName||"The viewing"}{viewing.leadName?` with ${viewing.leadName}`:""}
          {" \u00b7 "}
          {new Date(viewing.at).toLocaleString("en-AE",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"})}
        </div>

        <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:14}}>
          {["done","noshow","cancelled"].map(k=>(
            <button key={k} type="button" onClick={()=>setOutcome(k)} title={OUTCOMES[k].what}
              style={{padding:"6px 13px",borderRadius:14,cursor:"pointer",fontFamily:"'Outfit',sans-serif",
                      border:"1px solid "+(outcome===k?OUTCOMES[k].colour:T.border),fontSize:11,
                      fontWeight:outcome===k?700:500,
                      background:outcome===k?OUTCOMES[k].colour+"1A":"transparent",
                      color:outcome===k?OUTCOMES[k].colour:T.textMuted}}>
              {OUTCOMES[k].label}
            </button>
          ))}
        </div>

        {outcome==="done" && (<>
          <div style={{fontSize:10,color:T.textMuted,marginBottom:5,fontWeight:700,textTransform:"uppercase",letterSpacing:.5}}>
            How did they leave it
          </div>
          <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:14}}>
            {Object.values(VERDICTS).map(v=>(
              <button key={v.key} type="button" onClick={()=>setVerdict(v.key)}
                style={{padding:"5px 11px",borderRadius:13,cursor:"pointer",fontFamily:"'Outfit',sans-serif",
                        border:"1px solid "+(verdict===v.key?T.gold:T.border),fontSize:10.5,
                        fontWeight:verdict===v.key?700:500,
                        background:verdict===v.key?"rgba(212,168,67,0.14)":"transparent",
                        color:verdict===v.key?T.gold:T.textMuted}}>
                {v.label}
              </button>
            ))}
          </div>

          <div style={{fontSize:10,color:T.textMuted,marginBottom:4,fontWeight:700,textTransform:"uppercase",letterSpacing:.5}}>
            What did they say
          </div>
          <textarea value={feedback} onChange={e=>setFeedback(e.target.value)} rows={4}
            placeholder="Their actual words, as close as you can get them."
            style={{width:"100%",padding:"9px 11px",background:"rgba(255,255,255,0.04)",border:"1px solid "+T.border,
                    borderRadius:7,color:T.white,fontSize:11.5,outline:"none",resize:"vertical",
                    boxSizing:"border-box",fontFamily:"'Outfit',sans-serif",lineHeight:1.5}}/>
          <div style={{fontSize:10,color:T.textMuted,margin:"6px 0 14px",lineHeight:1.55}}>{FEEDBACK_PROMPT}</div>
        </>)}

        {outcome==="noshow" && (
          <div style={{fontSize:11,color:T.textSecondary,lineHeight:1.6,marginBottom:14}}>
            Recorded as a no-show. Worth knowing &mdash; a lead that fails to turn up twice is
            telling you something about how serious they are.
          </div>
        )}

        <div style={{display:"flex",gap:8}}>
          <button type="button" onClick={()=>onSave(outcome,feedback,verdict)}
            style={{flex:1,padding:"10px",borderRadius:8,border:"none",fontFamily:"'Outfit',sans-serif",
                    background:"linear-gradient(135deg,#D4A843,#B8902E)",color:"#0A0E1A",
                    fontSize:12,fontWeight:700,cursor:"pointer"}}>
            Save
          </button>
          <button type="button" onClick={onClose}
            style={{padding:"10px 16px",borderRadius:8,border:"1px solid "+T.border,background:"transparent",
                    color:T.textMuted,fontSize:12,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>
            Not now
          </button>
        </div>

        {canRemove && (
          <button type="button" onClick={onRemove}
            title="Remove it from the diary entirely. Cancelling keeps the record; removing does not."
            style={{background:"none",border:"none",color:T.textMuted,fontSize:10.5,cursor:"pointer",
                    padding:"12px 0 0",fontFamily:"'Outfit',sans-serif"}}>
            Remove this viewing
          </button>
        )}
      </div>
    </div>
  );
}
