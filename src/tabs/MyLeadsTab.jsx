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
const maskPhone = p => { if(!p) return ""; const c=clnPhone(p); if(c.length<6) return p; return c.slice(0,3)+""+c.slice(-2); };
const fmtB      = b => { const n=parseFloat(b||0); if(!n) return ""; return n>=1e6?"AED "+(n/1e6).toFixed(1)+"M":"AED "+n.toLocaleString(); };
const fmtD      = d => { if(!d) return ""; try { return new Date(d).toLocaleDateString("en-AE",{day:"2-digit",month:"short",year:"2-digit"}); } catch(e){return "";} };
const daysAgo   = d => !d ? 999 : Math.floor((Date.now()-new Date(d).getTime())/86400000);
const escCSV    = v => '"'+String(v==null?"":v).replace(/"/g,'""')+'"';

function aiScore(l) {
  let s=0;
  if(l.phone&&l.email) s+=25; else if(l.phone||l.email) s+=10;
  const b=parseFloat(l.budget||0);
  if(b>=5000000) s+=20; else if(b>=GV_MIN) s+=15; else if(b>=1000000) s+=10;
  const d=daysAgo(l.createdAt); if(d<1) s+=20; else if(d<3) s+=15; else if(d<7) s+=10;
  const n=(l.notes_log||[]).length; if(n>=3) s+=10; else if(n>=1) s+=5;
  if(l.timeline==="Immediate") s+=15; else if(l.timeline==="1-3 months") s+=10;
  if(l.nationality) s+=5;
  return { score:Math.min(100,s), color:s>=70?"#10B981":s>=40?"#D4A843":"#EF4444", label:s>=70?"Hot":s>=40?"Warm":"Cold" };
}

//  ATOMS 
const PBadge = ({status}) => {
  const p=PIPELINE.find(x=>x.key===status)||PIPELINE[1];
  return <span style={{fontSize:10,padding:"2px 8px",borderRadius:10,background:p.bg,color:p.color,fontWeight:700,whiteSpace:"nowrap"}}>{status||"New Lead"}</span>;
};

const ScoreBar = ({lead}) => {
  const sc=aiScore(lead);
  return <div style={{display:"flex",alignItems:"center",gap:4}}>
    <div style={{width:32,height:3,borderRadius:2,background:"rgba(255,255,255,0.08)",overflow:"hidden"}}>
      <div style={{height:"100%",width:sc.score+"%",background:sc.color,borderRadius:2}}/>
    </div>
    <span style={{fontSize:9,color:sc.color,fontWeight:700}}>{sc.label}</span>
  </div>;
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
      <div style={{width:28,height:28,borderRadius:6,background:color+"18",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
        <span style={{fontSize:14}}>{icon}</span>
      </div>
      <div style={{flex:1}}>
        <div style={{fontSize:12,fontWeight:700,color:T.white}}>{title}</div>
        {sub&&<div style={{fontSize:10,color:T.textMuted,marginTop:1}}>{sub}</div>}
      </div>
      <div style={{color:T.textMuted,fontSize:12,transition:"transform 0.2s",transform:open?"rotate(90deg)":"none"}}></div>
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

  //  Role resolution 
  const isSuperAdmin = userRole==="superAdmin"||userRole==="admin";
  const isOwner      = orgRole==="owner";
  const isDirector   = orgRole==="director";
  const isManager    = orgRole==="manager";
  const isAgent      = orgRole==="agent";
  const canManage    = isSuperAdmin||isOwner||isDirector||isManager;
  const canSee       = canManage||isAgent;
  const currentUid   = firebaseUser?.uid||auth?.currentUser?.uid||"";
  const currentEmail = firebaseUser?.email||auth?.currentUser?.email||"";

  //  State 
  const [smartView,    setSmartView]   = useState("all");
  const [activeStage,  setActiveStage] = useState("all");
  const [view,         setView]        = useState("table");
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

  //  Counts 
  const stageCounts = useMemo(()=>{
    const c={};
    PIPELINE.forEach(p=>{c[p.key]=(myLeads||[]).filter(l=>(l.status||"New Lead")===p.key).length;});
    return c;
  },[myLeads]);

  //  Smart view filter 
  const smartFiltered = useMemo(()=>{
    let a=[...(myLeads||[])];
    if(smartView==="today")       a=a.filter(l=>daysAgo(l.createdAt)<1);
    if(smartView==="my_leads")    a=a.filter(l=>l.assignedTo===currentUid||l.createdBy===currentUid);
    if(smartView==="hot")         a=a.filter(l=>aiScore(l).score>=70);
    if(smartView==="stale")       a=a.filter(l=>!["Closed Deal","Closed Outside"].includes(l.status)&&daysAgo(l.updatedAt||l.createdAt)>7);
    if(smartView==="overdue")     a=a.filter(l=>l.followUpDate&&new Date(l.followUpDate)<new Date()&&!["Closed Deal","Closed Outside"].includes(l.status));
    if(smartView==="uncontacted") a=a.filter(l=>!(l.notes_log||[]).some(n=>["Call","WhatsApp","Email"].includes(n.type)));
    if(smartView==="unassigned")  a=a.filter(l=>!l.assignedTo||l.assignedTo==="");
    if(smartView==="golden_visa") a=a.filter(l=>parseFloat(l.budget||0)>=GV_MIN);
    return a;
  },[myLeads,smartView,currentUid]);

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
    if(leadSortBy==="score")   sorted.sort((a,b)=>aiScore(b).score-aiScore(a).score);
    else if(leadSortBy==="budget") sorted.sort((a,b)=>parseFloat(b.budget||0)-parseFloat(a.budget||0));
    else if(leadSortBy==="name")   sorted.sort((a,b)=>(a.name||"").localeCompare(b.name||""));
    else sorted.sort((a,b)=>new Date(b.createdAt||0)-new Date(a.createdAt||0));
    return sorted;
  },[smartFiltered,activeStage,filterAgent,filterManager,filterService,filterSource,filterBudget,aiSearch,leadSortBy]);

  //  KPIs 
  const allLeads  = myLeads||[];
  const kTotal    = allLeads.length;
  const kToday    = allLeads.filter(l=>daysAgo(l.createdAt)<1).length;
  const kHot      = allLeads.filter(l=>aiScore(l).score>=70&&!["Closed Deal","Closed Outside"].includes(l.status)).length;
  const kClosed   = allLeads.filter(l=>l.status==="Closed Deal").length;
  const kStale    = allLeads.filter(l=>!["Closed Deal","Closed Outside","Non Potential"].includes(l.status)&&daysAgo(l.updatedAt||l.createdAt)>7).length;
  const kPipeline = allLeads.reduce((s,l)=>s+parseFloat(l.budget||0),0);
  const kUnassigned = allLeads.filter(l=>!l.assignedTo).length;
  const kConvRate = kTotal>0?Math.round((kClosed/kTotal)*100):0;

  //  Agent performance (manager/owner/director) 
  const agentPerf = useMemo(()=>{
    if(!canManage) return [];
    return agents.map(agent=>{
      const uid=agent.uid||agent.id;
      const aLeads=allLeads.filter(l=>l.assignedTo===uid);
      const closed=aLeads.filter(l=>l.status==="Closed Deal").length;
      const hot=aLeads.filter(l=>aiScore(l).score>=70).length;
      const stale=aLeads.filter(l=>!["Closed Deal","Closed Outside"].includes(l.status)&&daysAgo(l.updatedAt||l.createdAt)>7).length;
      const conv=aLeads.length>0?((closed/aLeads.length)*100).toFixed(1):"0.0";
      const pipeline=aLeads.reduce((s,l)=>s+parseFloat(l.budget||0),0);
      const lastAct=aLeads.reduce((latest,l)=>{const d=new Date(l.updatedAt||l.createdAt||0);return d>latest?d:latest;},new Date(0));
      return {...agent,total:aLeads.length,closed,hot,stale,conv,pipeline,lastActive:lastAct.getTime()>0?lastAct:null};
    }).sort((a,b)=>b.closed-a.closed);
  },[agents,allLeads,canManage]);

  //  Leaderboard (owner view)  ranked by combined score 
  const leaderboard = useMemo(()=>{
    if(!isOwner&&!isSuperAdmin) return [];
    return [...agentPerf].map(a=>{
      const convScore  = parseFloat(a.conv||0);
      const pipeScore  = Math.min(a.pipeline/1000000,50); // cap at 50M
      const combined   = (a.closed*10)+(convScore*2)+(pipeScore*0.5);
      return {...a,combined:Math.round(combined)};
    }).sort((a,b)=>b.combined-a.combined);
  },[agentPerf,isOwner,isSuperAdmin]);

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
    const h=["ID","Name","Phone","Email","Budget","Service","Request","Status","Source","Channel","AD Name","AD Account","Nationality","Community","Timeline","Agent","Score","Created","Updated"];
    const rows=filtered.map(l=>[l.id||"",l.name||"",l.phone||"",l.email||"",l.budget||"",l.serviceType||l.type||"",l.requestType||"",l.status||"",l.source||"",l.channel||"",l.adName||"",l.adAccount||"",l.nationality||"",l.community||"",l.timeline||"",l.assignedToName||"",aiScore(l).score,l.createdAt?new Date(l.createdAt).toLocaleDateString("en-GB"):"",l.updatedAt?new Date(l.updatedAt).toLocaleDateString("en-GB"):""].map(v=>escCSV(v)));
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
  if(!canSee) return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:400,gap:12,textAlign:"center"}}>
      <div style={{fontSize:36}}></div>
      <div style={{fontSize:16,fontWeight:700,color:T.white}}>CRM Access Required</div>
      <div style={{fontSize:12,color:T.textMuted,maxWidth:300}}>Your account does not have CRM access. Contact your administrator.</div>
    </div>
  );

  return (
    <div style={{paddingBottom:80}}>

      {/*  SMART VIEW TABS  */}
      <div style={{display:"flex",gap:0,borderBottom:"1px solid "+T.border,overflowX:"auto",paddingLeft:4}}>
        {[
          {k:"all",         l:"All"},
          {k:"today",       l:"Today"},
          {k:"my_leads",    l:"My Leads"},
          {k:"uncontacted", l:"Uncontacted"},
          {k:"hot",         l:"Hot"},
          {k:"stale",       l:"Stale"},
          {k:"overdue",     l:"Overdue"},
          ...(canManage?[{k:"unassigned",l:"Unassigned"}]:[]),
          {k:"golden_visa", l:"Golden Visa"},
        ].map(v=>{
          const active=smartView===v.k;
          return <button key={v.k} type="button" onClick={()=>{setSmartView(v.k);setActiveStage("all");}}
            style={{padding:"10px 14px",border:"none",borderBottom:active?"2px solid "+T.gold:"2px solid transparent",background:"transparent",color:active?T.white:T.textMuted,fontSize:12,fontWeight:active?600:400,cursor:"pointer",whiteSpace:"nowrap",fontFamily:"'Outfit',sans-serif",transition:"color 0.15s"}}>
            {v.l}{v.k==="unassigned"&&kUnassigned>0?<span style={{marginLeft:5,fontSize:10,background:"rgba(239,68,68,0.15)",color:"#EF4444",padding:"1px 5px",borderRadius:8}}>{kUnassigned}</span>:null}
          </button>;
        })}
      </div>

      {/*  TOOLBAR  */}
      <div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 4px",borderBottom:"1px solid "+T.border,flexWrap:"wrap"}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:13,fontWeight:700,color:T.white}}>{orgName||"Leads"}</span>
          <span style={{fontSize:13,color:T.textMuted,fontWeight:700}}>{kTotal.toLocaleString()}</span>
        </div>
        <div style={{flex:"1 1 240px",display:"flex",alignItems:"center",gap:8,padding:"6px 12px",background:"rgba(255,255,255,0.03)",border:"1px solid "+(aiSearch?T.gold:T.border),borderRadius:8,cursor:"text"}} onClick={()=>document.getElementById("crm-search")?.focus()}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={T.textMuted} strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input id="crm-search" value={aiSearch} onChange={e=>setAiSearch(e.target.value)} placeholder="Search name, phone, agent, area..."
            style={{flex:1,background:"none",border:"none",outline:"none",color:T.white,fontSize:12,fontFamily:"'Outfit',sans-serif"}}/>
          {aiSearch&&<button type="button" onClick={()=>setAiSearch("")} style={{background:"none",border:"none",color:T.textMuted,cursor:"pointer",fontSize:14}}></button>}
        </div>
        <div style={{display:"flex",gap:2,background:"rgba(255,255,255,0.03)",border:"1px solid "+T.border,borderRadius:7,padding:2,marginLeft:"auto"}}>
          {[{k:"table",icon:""},{k:"kanban",icon:""},{k:"analytics",icon:""}].map(v=>(
            <button key={v.k} type="button" onClick={()=>setView(v.k)} style={{padding:"5px 10px",borderRadius:5,border:view===v.k?"1px solid "+T.gold:"1px solid transparent",background:view===v.k?"rgba(212,168,67,0.15)":"transparent",color:view===v.k?T.gold:T.textMuted,cursor:"pointer",fontSize:13}}>{v.icon}</button>
          ))}
        </div>
        <button type="button" onClick={exportCSV} style={{padding:"6px 11px",borderRadius:7,border:"1px solid "+T.border,background:"transparent",color:T.textSecondary,fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>Export</button>
        <button type="button" onClick={()=>setShowWA(true)} style={{padding:"6px 11px",borderRadius:7,border:"1px solid rgba(37,211,102,0.3)",background:"rgba(37,211,102,0.07)",color:"#25D366",fontSize:11,fontWeight:600,cursor:"pointer"}}>Bulk WA</button>
        <button type="button" onClick={()=>setShowAdd(true)} style={{padding:"7px 16px",borderRadius:7,border:"none",background:"linear-gradient(135deg,#D4A843,#B8902E)",color:"#0A0E1A",fontSize:12,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:5}}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Add
        </button>
      </div>

      {/*  PIPELINE PILLS  */}
      <div style={{display:"flex",gap:0,borderBottom:"1px solid "+T.border,overflowX:"auto",paddingLeft:4,background:"rgba(255,255,255,0.01)"}}>
        <button type="button" onClick={()=>setActiveStage("all")} style={{padding:"7px 12px",border:"none",borderBottom:activeStage==="all"?"2px solid "+T.gold:"2px solid transparent",background:"transparent",color:activeStage==="all"?T.white:T.textMuted,fontSize:11,fontWeight:activeStage==="all"?600:400,cursor:"pointer",whiteSpace:"nowrap",fontFamily:"'Outfit',sans-serif"}}>All</button>
        {PIPELINE.map(p=>{
          const count=stageCounts[p.key]||0;
          const active=activeStage===p.key;
          return <button key={p.key} type="button" onClick={()=>setActiveStage(active?"all":p.key)}
            style={{padding:"7px 12px",border:"none",borderBottom:active?"2px solid "+p.color:"2px solid transparent",background:"transparent",color:active?p.color:T.textMuted,fontSize:11,fontWeight:active?600:400,cursor:"pointer",whiteSpace:"nowrap",fontFamily:"'Outfit',sans-serif",display:"flex",alignItems:"center",gap:5}}>
            <span style={{width:6,height:6,borderRadius:"50%",background:p.color,display:"inline-block"}}/>
            {p.key} <span style={{fontSize:10,color:active?p.color:T.textMuted}}>{count}</span>
          </button>;
        })}
      </div>

      {/*  FILTER ROW  */}
      <div style={{display:"flex",gap:8,padding:"8px 4px",borderBottom:"1px solid "+T.border,flexWrap:"wrap",alignItems:"center",background:"rgba(255,255,255,0.01)"}}>
        {(isOwner||isDirector||isSuperAdmin)&&managers.length>0&&(
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
          <option value="date">Latest First</option>
          <option value="score">AI Score</option>
          <option value="budget">Budget High-Low</option>
          <option value="name">Name A-Z</option>
        </select>
        {(aiSearch||activeStage!=="all"||filterAgent!=="all"||filterManager!=="all"||filterService!=="all"||filterSource!=="all"||filterBudget!=="all")&&(
          <div style={{display:"flex",gap:6,alignItems:"center",marginLeft:"auto",flexWrap:"wrap"}}>
            {activeStage!=="all"&&<span style={{fontSize:10,padding:"2px 8px",borderRadius:10,background:"rgba(212,168,67,0.15)",color:T.gold,cursor:"pointer"}} onClick={()=>setActiveStage("all")}>{activeStage} </span>}
            {filterAgent!=="all"&&<span style={{fontSize:10,padding:"2px 8px",borderRadius:10,background:"rgba(139,92,246,0.15)",color:"#8B5CF6",cursor:"pointer"}} onClick={()=>setFilterAgent("all")}>{agents.find(a=>(a.uid||a.id)===filterAgent)?.name||"Agent"} </span>}
            {filterManager!=="all"&&<span style={{fontSize:10,padding:"2px 8px",borderRadius:10,background:"rgba(59,130,246,0.15)",color:"#3B82F6",cursor:"pointer"}} onClick={()=>setFilterManager("all")}>{managers.find(m=>(m.uid||m.id)===filterManager)?.name||"Manager"} </span>}
            <button type="button" onClick={()=>{setAiSearch("");setActiveStage("all");setFilterAgent("all");setFilterManager("all");setFilterService("all");setFilterSource("all");setFilterBudget("all");}} style={{fontSize:10,padding:"2px 10px",borderRadius:10,background:"rgba(252,129,129,0.1)",border:"1px solid rgba(252,129,129,0.3)",color:"#FC8181",cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>Clear all</button>
            <span style={{fontSize:10,color:T.textMuted}}>{filtered.length} results</span>
          </div>
        )}
      </div>

      {/*  MAIN CONTENT  */}
      <div style={{display:"grid",gridTemplateColumns:selectedLead?"1fr 360px":"1fr",gap:0,alignItems:"start"}}>

        {/*  TABLE VIEW  */}
        {view==="table"&&(
          <div>
            <div style={{display:"grid",gridTemplateColumns:"72px 2fr 110px 130px 110px 130px 140px 48px",padding:"8px 4px",borderBottom:"1px solid "+T.border,background:"rgba(255,255,255,0.02)"}}>
              {["ID","NAME","STATUS","BUDGET","SERVICE","SOURCE","AGENT",""].map((h,i)=>(
                <div key={i} style={{fontSize:9,fontWeight:700,color:T.textMuted,textTransform:"uppercase",letterSpacing:0.7,paddingLeft:i===0?4:0}}>{h}</div>
              ))}
            </div>
            {allLeads.length===0&&(
              <div style={{padding:"80px 20px",textAlign:"center"}}>
                <div style={{fontSize:40,marginBottom:12}}></div>
                <div style={{fontSize:16,fontWeight:700,color:T.white,marginBottom:6}}>No leads yet</div>
                <div style={{fontSize:12,color:T.textMuted,marginBottom:16}}>Add your first lead to start managing your pipeline</div>
                <button type="button" onClick={()=>setShowAdd(true)} style={{padding:"10px 24px",borderRadius:8,border:"none",background:"linear-gradient(135deg,#D4A843,#B8902E)",color:"#0A0E1A",fontSize:13,fontWeight:700,cursor:"pointer"}}>+ Add First Lead</button>
              </div>
            )}
            {filtered.length===0&&allLeads.length>0&&<div style={{padding:"40px 20px",textAlign:"center",color:T.textMuted,fontSize:13}}>No leads match your current filters</div>}
            {filtered.map((lead,i)=>{
              const sc=aiScore(lead);
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
                      <div style={{display:"flex",gap:4,marginTop:1}}>
                        <ScoreBar lead={lead}/>
                        {isGV&&<span style={{fontSize:9,color:T.gold}}>GV</span>}
                        {stale&&<span style={{fontSize:9,color:"#EF4444"}}>Stale</span>}
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
                        :<span style={{fontSize:10,color:T.textMuted}}></span>
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
        {view==="kanban"&&(
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
                        const sc=aiScore(lead);
                        const stale=daysAgo(lead.updatedAt||lead.createdAt)>7;
                        return (
                          <div key={lead.id||i} onClick={()=>setSelectedLead(selectedLead?.id===lead.id?null:lead)}
                            style={{background:"rgba(255,255,255,0.03)",border:"1px solid "+(stale?"rgba(239,68,68,0.2)":T.border),borderRadius:8,padding:"9px 10px",cursor:"pointer"}}
                            onMouseEnter={e=>(e.currentTarget.style.borderColor=p.color+"50")}
                            onMouseLeave={e=>(e.currentTarget.style.borderColor=stale?"rgba(239,68,68,0.2)":T.border)}
                          >
                            <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                              <span style={{fontSize:11,fontWeight:500,color:T.white,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",flex:1}}>{lead.name||"Unnamed"}</span>
                              <div style={{width:6,height:6,borderRadius:"50%",background:sc.color,flexShrink:0,marginTop:3}}/>
                            </div>
                            <div style={{fontSize:11,fontWeight:700,color:T.gold,marginBottom:4}}>{fmtB(lead.budget)}</div>
                            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                              <span style={{fontSize:9,color:SRC_COLOR[lead.source]||T.textMuted}}>{lead.source||"Manual"}</span>
                              {stale&&<span style={{fontSize:9,color:"#EF4444"}}>Stale</span>}
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
        {view==="analytics"&&(
          <div style={{padding:"14px 4px",display:"flex",flexDirection:"column",gap:14}}>

            {/* KPI Cards */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(130px,1fr))",gap:8}}>
              {[
                {l:"Total Leads",  v:kTotal,   c:T.gold},
                {l:"New Today",    v:kToday,   c:"#0EA5E9"},
                {l:"Hot Leads",    v:kHot,     c:"#10B981"},
                {l:"Closed Deals", v:kClosed,  c:"#10B981"},
                {l:"Stale 7d+",    v:kStale,   c:"#EF4444"},
                {l:"Conv. Rate",   v:kConvRate+"%",c:kConvRate>=10?"#10B981":kConvRate>=5?"#D4A843":"#EF4444"},
                {l:"Pipeline",     v:kPipeline>=1e9?"AED "+(kPipeline/1e9).toFixed(1)+"B":kPipeline>=1e6?"AED "+(kPipeline/1e6).toFixed(1)+"M":"AED "+kPipeline.toLocaleString(),c:T.gold},
              ].map((k,i)=>(
                <div key={i} style={{background:"rgba(255,255,255,0.03)",border:"1px solid "+T.border,borderRadius:9,padding:"10px 12px",position:"relative",overflow:"hidden"}}>
                  <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:k.c,opacity:0.8}}/>
                  <div style={{fontSize:9,fontWeight:700,color:T.textMuted,textTransform:"uppercase",letterSpacing:0.7,marginBottom:3}}>{k.l}</div>
                  <div style={{fontSize:20,fontWeight:900,color:k.c,fontFamily:"'Fraunces',serif"}}>{k.v}</div>
                </div>
              ))}
            </div>

            {/*  OWNER LEADERBOARD  */}
            {(isOwner||isSuperAdmin)&&leaderboard.length>0&&(
              <div style={{background:"rgba(255,255,255,0.02)",border:"1px solid "+T.gold+"40",borderRadius:12,overflow:"hidden"}}>
                <div style={{padding:"14px 16px",borderBottom:"1px solid "+T.border,background:"rgba(212,168,67,0.05)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div>
                    <div style={{fontSize:13,fontWeight:700,color:T.gold}}> Agent Leaderboard</div>
                    <div style={{fontSize:11,color:T.textMuted,marginTop:2}}>Ranked by closed deals  conversion rate  pipeline value</div>
                  </div>
                  <div style={{fontSize:11,color:T.textMuted}}>{agents.length} agents</div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"32px 2fr 1fr 1fr 1fr 1fr 1fr",padding:"8px 16px",background:"rgba(255,255,255,0.02)",borderBottom:"1px solid "+T.border}}>
                  {["#","Agent","Leads","Closed","Conv%","Pipeline","Score"].map((h,i)=>(
                    <div key={i} style={{fontSize:9,fontWeight:700,color:T.textMuted,textTransform:"uppercase",letterSpacing:0.7}}>{h}</div>
                  ))}
                </div>
                {leaderboard.slice(0,10).map((agent,i)=>(
                  <div key={agent.uid||agent.id||i}
                    style={{display:"grid",gridTemplateColumns:"32px 2fr 1fr 1fr 1fr 1fr 1fr",padding:"12px 16px",borderBottom:i<leaderboard.length-1?"1px solid "+T.border+"40":"none",background:i===0?"rgba(212,168,67,0.03)":i===1?"rgba(212,168,67,0.015)":"transparent"}}
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
                    <div style={{fontSize:13,color:parseFloat(agent.conv)>=10?"#10B981":parseFloat(agent.conv)>=5?"#D4A843":"#EF4444",fontWeight:700,alignSelf:"center"}}>{agent.conv}%</div>
                    <div style={{fontSize:11,color:T.gold,fontWeight:600,alignSelf:"center"}}>{agent.pipeline>=1e6?"AED "+(agent.pipeline/1e6).toFixed(1)+"M":"AED "+agent.pipeline.toLocaleString()}</div>
                    <div style={{fontSize:13,color:T.gold,fontWeight:900,alignSelf:"center",fontFamily:"'Fraunces',serif"}}>{agent.combined}</div>
                  </div>
                ))}
              </div>
            )}

            {/*  AGENT PERFORMANCE TABLE (manager/director)  */}
            {(isManager||isDirector)&&agentPerf.length>0&&(
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
                <button type="button" onClick={()=>setSelectedLead(null)} style={{background:"none",border:"none",color:T.textMuted,cursor:"pointer",fontSize:18}}></button>
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
                const sc=aiScore(selectedLead);
                return (
                  <div>
                    <div style={{padding:"9px 12px",borderRadius:8,background:sc.color+"0E",border:"1px solid "+sc.color+"25",marginBottom:12,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <div>
                        <div style={{fontSize:9,color:T.textMuted,fontWeight:700,textTransform:"uppercase",letterSpacing:0.7,marginBottom:2}}>AI LEAD SCORE</div>
                        <div style={{fontFamily:"'Fraunces',serif",fontSize:18,fontWeight:800,color:sc.color}}>{sc.score}/100  {sc.label}</div>
                      </div>
                      <div style={{width:38,height:38,borderRadius:"50%",border:"2px solid "+sc.color,display:"flex",alignItems:"center",justifyContent:"center",background:sc.color+"12",flexShrink:0}}>
                        <span style={{fontSize:12,fontWeight:800,color:sc.color,fontFamily:"'Fraunces',serif"}}>{sc.score}</span>
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
              <button type="button" onClick={()=>setShowAdd(false)} style={{background:"rgba(255,255,255,0.06)",border:"1px solid "+T.border,borderRadius:7,color:T.textMuted,width:28,height:28,cursor:"pointer",fontSize:16,display:"flex",alignItems:"center",justifyContent:"center"}}></button>
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
              <button type="button" onClick={()=>setShowAssign(null)} style={{background:"rgba(255,255,255,0.06)",border:"1px solid "+T.border,borderRadius:7,color:T.textMuted,width:28,height:28,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}></button>
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
              <button type="button" onClick={()=>setShowWA(false)} style={{background:"rgba(255,255,255,0.06)",border:"1px solid "+T.border,borderRadius:7,color:T.textMuted,width:28,height:28,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}></button>
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