/* eslint-disable */
import React, { useState, useMemo, useCallback } from "react";
import { collection, addDoc } from "firebase/firestore";
import { db } from "../../firebase";
import { C, LEAD_STAGES, SOURCES, fmtAED, timeAgo, getStageCfg } from "../crmTokens";
import { CLAUDE_MODEL, CLAUDE_MAX_TOKENS, CLAUDE_OUTPUT_CONFIG, extractClaudeText, parseClaudeJson } from "../../utils/claude";

const SMART_TABS = [
  { key:"all",         label:"All",          filter:()=>true },
  { key:"today",       label:"Today",        filter:l=>{ const d=new Date(l.createdAt||0),t=new Date(); return d.toDateString()===t.toDateString(); }},
  { key:"my",          label:"My Leads",     filter:(l,uid)=>l.assignedTo===uid||l.createdBy===uid },
  { key:"uncontacted", label:"Uncontacted",  filter:l=>!l.lastContact },
  { key:"hot",         label:"Hot 🔥",       filter:l=>l.status==="Hot Case" },
  { key:"stale",       label:"Stale ⚠️",     filter:l=>l.lastContact&&(Date.now()-new Date(l.lastContact).getTime())>7*86400000&&!["Closed Deal","Closed Outside"].includes(l.status) },
  { key:"overdue",     label:"Overdue",      filter:l=>l.followUpDate&&new Date(l.followUpDate)<new Date()&&!["Closed Deal","Closed Outside"].includes(l.status) },
  { key:"unassigned",  label:"Unassigned",   filter:l=>!l.assignedTo },
];

function Chip({ label, color, bg, active, count, onClick }) {
  return (
    <button type="button" onClick={onClick} style={{
      display:"flex",alignItems:"center",gap:4,padding:"3px 10px",
      borderRadius:20,border:`1px solid ${active?color:"transparent"}`,
      background:active?bg:"none",cursor:"pointer",
      color:active?color:C.textSec,fontSize:11,fontWeight:active?600:400,
      fontFamily:C.sans,whiteSpace:"nowrap",transition:"all 0.12s",
    }}>
      <span style={{width:6,height:6,borderRadius:"50%",background:color,flexShrink:0}}/>
      {label}
      {count>0&&<span style={{fontSize:9,opacity:0.8,marginLeft:1}}>{count}</span>}
    </button>
  );
}

function LeadTableRow({ lead, onSelect, selected }) {
  const cfg = getStageCfg(lead.status);
  return (
    <div onClick={()=>onSelect(lead)}
      className="crm-row"
      style={{
        display:"grid",
        gridTemplateColumns:"8px 1fr 120px 130px 100px 100px 85px 70px",
        gap:0,padding:"0 16px",height:50,
        background:selected?C.surfaceAlt:"none",
        borderBottom:`1px solid ${C.border}`,
        cursor:"pointer",transition:"background 0.1s",alignItems:"center",
      }}
    >
      <span style={{width:8,height:8,borderRadius:"50%",background:cfg.color,flexShrink:0}}/>
      <div style={{minWidth:0,paddingRight:8}}>
        <div style={{fontSize:13,fontWeight:600,color:C.white,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{lead.name||"—"}</div>
        <div style={{fontSize:10,color:C.textSec}}>{lead.phone||lead.email||"—"}</div>
      </div>
      <div><span style={{fontSize:10,fontWeight:600,padding:"3px 8px",borderRadius:12,background:cfg.bg,color:cfg.color}}>{lead.status||"New Lead"}</span></div>
      <div style={{fontSize:12,fontWeight:700,color:C.gold}}>{lead.budget?fmtAED(lead.budget):"—"}</div>
      <div style={{fontSize:11,color:C.textSec,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{lead.source||"—"}</div>
      <div style={{fontSize:11,color:C.textSec,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{lead.community||"—"}</div>
      <div style={{fontSize:10,color:C.textMuted}}>{timeAgo(lead.lastContact||lead.updatedAt||lead.createdAt)}</div>
      <div onClick={e=>e.stopPropagation()}>
        <button type="button" onClick={()=>{if(lead.phone)window.open(`https://wa.me/${lead.phone.replace(/\D/g,"")}`, "_blank");}} style={{
          background:C.waDim,border:"1px solid rgba(37,211,102,0.25)",
          borderRadius:6,color:C.wa,fontSize:10,fontWeight:700,
          padding:"3px 8px",cursor:"pointer",fontFamily:C.sans,
        }}>WA</button>
      </div>
    </div>
  );
}

function LeadGridCard({ lead, onSelect }) {
  const cfg = getStageCfg(lead.status);
  return (
    <div onClick={()=>onSelect(lead)}
      className="crm-card"
      style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:"14px 16px",cursor:"pointer",transition:"all 0.15s"}}
    >
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <div style={{width:32,height:32,borderRadius:"50%",background:C.surfaceAlt,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,color:C.gold,flexShrink:0}}>
            {(lead.name||"?").charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{fontSize:13,fontWeight:600,color:C.white}}>{lead.name||"—"}</div>
            <div style={{fontSize:10,color:C.textSec}}>{lead.phone||"—"}</div>
          </div>
        </div>
        <span style={{fontSize:10,fontWeight:600,padding:"3px 8px",borderRadius:10,background:cfg.bg,color:cfg.color,whiteSpace:"nowrap"}}>{lead.status||"New Lead"}</span>
      </div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
        <span style={{fontSize:13,fontWeight:700,color:C.gold}}>{lead.budget?fmtAED(lead.budget):"No budget"}</span>
        <span style={{fontSize:10,color:C.textSec}}>{lead.source||"—"}</span>
      </div>
      {lead.community&&<div style={{fontSize:10,color:C.textSec,marginBottom:8}}>📍 {lead.community}</div>}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",paddingTop:8,borderTop:`1px solid ${C.border}`}}>
        <span style={{fontSize:10,color:C.textMuted}}>{timeAgo(lead.lastContact||lead.updatedAt)}</span>
        <button type="button" onClick={e=>{e.stopPropagation();if(lead.phone)window.open(`https://wa.me/${lead.phone.replace(/\D/g,"")}`, "_blank");}} style={{background:C.waDim,border:"1px solid rgba(37,211,102,0.25)",borderRadius:6,color:C.wa,fontSize:10,fontWeight:700,padding:"3px 8px",cursor:"pointer",fontFamily:C.sans}}>
          WA
        </button>
      </div>
    </div>
  );
}

function AddLeadModal({ onClose, onSave, orgId, firebaseUser, notify }) {
  const [form, setForm] = useState({name:"",phone:"",email:"",budget:"",source:"Manual",status:"New Lead",community:"",nationality:"",serviceType:"Buyer",comment:""});
  const [saving, setSaving] = useState(false);
  const F = (k,v) => setForm(p=>({...p,[k]:v}));
  const inp = {width:"100%",padding:"9px 12px",background:C.surfaceAlt,border:`1px solid ${C.border}`,borderRadius:8,color:C.text,fontSize:12,fontFamily:C.sans,outline:"none",boxSizing:"border-box"};

  const save = async () => {
    if(!form.name.trim()&&!form.phone.trim()){notify("Name or phone required","error");return;}
    setSaving(true);
    try {
      await addDoc(collection(db,"leads"),{
        ...form,budget:parseFloat(form.budget)||0,
        orgId:orgId||"",createdBy:firebaseUser?.uid||"",
        createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),
        tags:[],notes_log:[{text:"Lead created",type:"Note",by:firebaseUser?.email||"",at:new Date().toISOString()}],
      });
      onSave();onClose();
    } catch(e){notify("Failed: "+e.message,"error");}
    setSaving(false);
  };

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",zIndex:3000,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{background:C.surface,borderRadius:16,border:`1px solid ${C.border}`,width:"100%",maxWidth:520,maxHeight:"90vh",overflowY:"auto"}}>
        <div style={{padding:"18px 22px",borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <div style={{fontSize:15,fontWeight:700,color:C.white}}>Add New Lead</div>
            <div style={{fontSize:11,color:C.textSec}}>Fill in the lead details below</div>
          </div>
          <button type="button" onClick={onClose} style={{background:C.surfaceAlt,border:`1px solid ${C.border}`,borderRadius:8,width:30,height:30,cursor:"pointer",color:C.textSec,fontSize:16,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
        </div>
        <div style={{padding:"18px 22px",display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          {[
            {k:"name",l:"Full Name *",p:"Client full name"},
            {k:"phone",l:"Phone",p:"+971 50 XXX XXXX"},
            {k:"email",l:"Email",p:"email@example.com"},
            {k:"budget",l:"Budget (AED)",p:"2000000",type:"number"},
            {k:"community",l:"Community",p:"Dubai Hills, JVC..."},
            {k:"nationality",l:"Nationality",p:"Emirati, British..."},
          ].map(f=>(
            <div key={f.k}>
              <div style={{fontSize:10,color:C.textSec,marginBottom:4,textTransform:"uppercase",letterSpacing:0.4}}>{f.l}</div>
              <input type={f.type||"text"} style={inp} value={form[f.k]} onChange={e=>F(f.k,e.target.value)} placeholder={f.p} />
            </div>
          ))}
          <div>
            <div style={{fontSize:10,color:C.textSec,marginBottom:4,textTransform:"uppercase",letterSpacing:0.4}}>Source</div>
            <select style={{...inp}} value={form.source} onChange={e=>F("source",e.target.value)}>
              {SOURCES.map(s=><option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <div style={{fontSize:10,color:C.textSec,marginBottom:4,textTransform:"uppercase",letterSpacing:0.4}}>Status</div>
            <select style={{...inp}} value={form.status} onChange={e=>F("status",e.target.value)}>
              {LEAD_STAGES.map(s=><option key={s.key} value={s.key}>{s.key}</option>)}
            </select>
          </div>
          <div style={{gridColumn:"1/-1"}}>
            <div style={{fontSize:10,color:C.textSec,marginBottom:4,textTransform:"uppercase",letterSpacing:0.4}}>Comment</div>
            <textarea style={{...inp,height:72,resize:"vertical"}} value={form.comment} onChange={e=>F("comment",e.target.value)} placeholder="Additional notes..." />
          </div>
        </div>
        <div style={{padding:"14px 22px",borderTop:`1px solid ${C.border}`,display:"flex",gap:8,justifyContent:"flex-end"}}>
          <button type="button" onClick={onClose} style={{padding:"9px 18px",borderRadius:8,border:`1px solid ${C.border}`,background:"none",color:C.textSec,fontSize:12,cursor:"pointer",fontFamily:C.sans}}>Cancel</button>
          <button type="button" onClick={save} disabled={saving} style={{padding:"9px 22px",borderRadius:8,background:`linear-gradient(135deg,${C.gold},#9B7A2E)`,border:"none",color:"#000",fontSize:12,fontWeight:800,cursor:"pointer",fontFamily:C.sans}}>
            {saving?"Saving...":"Save Lead"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CRMLeads({ myLeads, myLeadsLoading, teamMembers, firebaseUser, orgId, notify }) {
  const [smartTab, setSmartTab] = useState("all");
  const [stageFilter, setStageFilter] = useState("All");
  const [view, setView] = useState("table");
  const [search, setSearch] = useState("");
  const [aiQuery, setAiQuery] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiFiltered, setAiFiltered] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [sortBy, setSortBy] = useState("createdAt");
  const uid = firebaseUser?.uid;

  const stageCounts = useMemo(()=>{
    const m={};
    (myLeads||[]).forEach(l=>{m[l.status||"New Lead"]=(m[l.status||"New Lead"]||0)+1;});
    return m;
  },[myLeads]);

  const tabCounts = useMemo(()=>{
    const leads=myLeads||[];
    return {
      all:leads.length,
      today:leads.filter(l=>{const d=new Date(l.createdAt||0),t=new Date();return d.toDateString()===t.toDateString();}).length,
      my:leads.filter(l=>l.assignedTo===uid||l.createdBy===uid).length,
      uncontacted:leads.filter(l=>!l.lastContact).length,
      hot:leads.filter(l=>l.status==="Hot Case").length,
      stale:leads.filter(l=>l.lastContact&&(Date.now()-new Date(l.lastContact).getTime())>7*86400000).length,
      overdue:leads.filter(l=>l.followUpDate&&new Date(l.followUpDate)<new Date()).length,
      unassigned:leads.filter(l=>!l.assignedTo).length,
    };
  },[myLeads,uid]);

  const filtered = useMemo(()=>{
    let arr = aiFiltered || myLeads || [];
    const tab = SMART_TABS.find(t=>t.key===smartTab);
    if(tab) arr=arr.filter(l=>tab.filter(l,uid));
    if(stageFilter!=="All") arr=arr.filter(l=>l.status===stageFilter);
    if(search.trim()){
      const q=search.toLowerCase();
      arr=arr.filter(l=>(l.name||"").toLowerCase().includes(q)||(l.phone||"").includes(q)||(l.email||"").toLowerCase().includes(q)||(l.community||"").toLowerCase().includes(q));
    }
    return arr.sort((a,b)=>sortBy==="budget"?(b.budget||0)-(a.budget||0):new Date(b.createdAt||0)-new Date(a.createdAt||0));
  },[myLeads,smartTab,stageFilter,search,aiFiltered,uid,sortBy]);

  const runAI = async () => {
    if(!aiQuery.trim()){setAiFiltered(null);return;}
    setAiLoading(true);
    try {
      const resp = await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          model: CLAUDE_MODEL,
          max_tokens: CLAUDE_MAX_TOKENS,
          output_config: CLAUDE_OUTPUT_CONFIG,
          system:"You are a CRM filter assistant. Given a natural language query and leads, return ONLY a JSON array of matching lead IDs. Nothing else. Example: [\"id1\",\"id2\"]",
          messages:[{role:"user",content:`Query: "${aiQuery}"\n\nLeads:\n${JSON.stringify((myLeads||[]).slice(0,200).map(l=>({id:l.id,name:l.name,status:l.status,budget:l.budget,source:l.source,community:l.community})))}`}]
        })
      });
      const data = await resp.json();
      const ids = parseClaudeJson(extractClaudeText(data), []);
      if (!Array.isArray(ids)) throw new Error("AI returned an unexpected shape");
      setAiFiltered((myLeads||[]).filter(l=>ids.includes(l.id)));
      notify(`AI found ${ids.length} matching leads`);
    } catch(e){notify("AI filter failed","error");setAiFiltered(null);}
    setAiLoading(false);
  };

  const clearFilters = () => {setSmartTab("all");setStageFilter("All");setSearch("");setAiFiltered(null);setAiQuery("");};

  const inp = {padding:"7px 10px",background:C.surfaceAlt,border:`1px solid ${C.border}`,borderRadius:8,color:C.text,fontSize:12,fontFamily:C.sans,outline:"none"};

  return (
    <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>

      {/* Smart tabs */}
      <div style={{display:"flex",alignItems:"center",padding:"0 16px",borderBottom:`1px solid ${C.border}`,overflowX:"auto",flexShrink:0}}>
        {SMART_TABS.map(tab=>{
          const cnt=tabCounts[tab.key]||0;
          const active=smartTab===tab.key;
          return (
            <button key={tab.key} type="button" onClick={()=>setSmartTab(tab.key)} style={{
              display:"flex",alignItems:"center",gap:5,padding:"10px 12px",
              background:"none",border:"none",cursor:"pointer",
              borderBottom:active?`2px solid ${C.gold}`:"2px solid transparent",
              color:active?C.gold:C.textSec,fontSize:12,fontWeight:active?600:400,
              fontFamily:C.sans,whiteSpace:"nowrap",marginBottom:-1,
            }}>
              {tab.label}
              {cnt>0&&(
                <span style={{
                  background:tab.key==="hot"?C.redDim:tab.key==="stale"?C.yellowDim:C.surfaceAlt,
                  color:tab.key==="hot"?C.red:tab.key==="stale"?C.yellow:C.textSec,
                  borderRadius:10,padding:"1px 6px",fontSize:9,fontWeight:700,
                }}>
                  {cnt>999?"999+":cnt}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Toolbar */}
      <div style={{padding:"10px 16px",borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",gap:8,flexShrink:0,flexWrap:"wrap"}}>
        {/* AI Filter */}
        <div style={{flex:1,position:"relative",minWidth:180,maxWidth:420}}>
          <span style={{position:"absolute",left:9,top:"50%",transform:"translateY(-50%)",fontSize:13}}>✨</span>
          <input
            value={aiQuery}
            onChange={e=>setAiQuery(e.target.value)}
            onKeyDown={e=>e.key==="Enter"&&runAI()}
            placeholder="Ask AI to filter leads... e.g. hot leads over AED 5M in JVC"
            style={{...inp,paddingLeft:30,width:"100%"}}
          />
          {aiQuery&&<button type="button" onClick={()=>{setAiQuery("");setAiFiltered(null);}} style={{position:"absolute",right:8,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:C.textSec,cursor:"pointer",fontSize:14}}>×</button>}
        </div>
        <button type="button" onClick={runAI} disabled={aiLoading||!aiQuery.trim()} style={{padding:"7px 12px",background:C.purpleDim,border:`1px solid rgba(139,92,246,0.3)`,borderRadius:8,color:C.purple,fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:C.sans,display:"flex",alignItems:"center",gap:5}}>
          {aiLoading?<span style={{animation:"spin 1s linear infinite",display:"inline-block"}}>⟳</span>:"⌘"}
          {aiLoading?"Filtering...":"AI Filter"}
        </button>

        {/* Search */}
        <div style={{position:"relative"}}>
          <span style={{position:"absolute",left:8,top:"50%",transform:"translateY(-50%)",color:C.textMuted,fontSize:11}}>🔍</span>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search..." style={{...inp,paddingLeft:26,width:160}} />
        </div>

        {/* Sort */}
        <select value={sortBy} onChange={e=>setSortBy(e.target.value)} style={{...inp}}>
          <option value="createdAt">Latest</option>
          <option value="budget">Budget ↓</option>
        </select>

        {/* Views */}
        <div style={{display:"flex",background:C.surfaceAlt,borderRadius:8,overflow:"hidden",border:`1px solid ${C.border}`}}>
          {[{k:"table",i:"⊞"},{k:"grid",i:"⊟"},{k:"list",i:"☰"}].map(v=>(
            <button key={v.k} type="button" onClick={()=>setView(v.k)} style={{padding:"6px 10px",background:view===v.k?C.gold:"none",border:"none",color:view===v.k?"#000":C.textSec,cursor:"pointer",fontSize:13}}>
              {v.i}
            </button>
          ))}
        </div>

        <span style={{fontSize:11,color:C.textSec,whiteSpace:"nowrap"}}>{filtered.length} leads</span>
        <button type="button" onClick={()=>setShowAdd(true)} style={{padding:"7px 16px",background:`linear-gradient(135deg,${C.gold},#9B7A2E)`,border:"none",borderRadius:8,color:"#000",fontSize:12,fontWeight:800,cursor:"pointer",fontFamily:C.sans}}>
          + Add
        </button>
      </div>

      {/* Stage chips */}
      <div style={{display:"flex",alignItems:"center",gap:5,padding:"8px 16px",borderBottom:`1px solid ${C.border}`,overflowX:"auto",flexShrink:0}}>
        <Chip label="All" color={C.textSec} bg={C.surfaceAlt} active={stageFilter==="All"} count={0} onClick={()=>setStageFilter("All")} />
        {LEAD_STAGES.map(s=>(
          <Chip key={s.key} label={s.key} color={s.color} bg={s.bg} active={stageFilter===s.key} count={stageCounts[s.key]||0} onClick={()=>setStageFilter(stageFilter===s.key?"All":s.key)} />
        ))}
      </div>

      {/* Content */}
      <div style={{flex:1,overflowY:"auto"}}>
        {myLeadsLoading?(
          <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"60%",gap:10,color:C.textSec}}>
            <span style={{animation:"spin 1s linear infinite",display:"inline-block",fontSize:18}}>⟳</span>
            Loading leads...
          </div>
        ):filtered.length===0?(
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"60%",gap:12}}>
            <div style={{fontSize:36,opacity:0.2}}>🔍</div>
            <div style={{fontSize:15,fontWeight:600,color:C.textSec}}>No leads found</div>
            <div style={{fontSize:12,color:C.textMuted}}>Try adjusting your filters or search criteria.</div>
            <div style={{display:"flex",gap:10,marginTop:8}}>
              <button type="button" onClick={clearFilters} style={{padding:"8px 16px",background:C.surfaceAlt,border:`1px solid ${C.border}`,borderRadius:8,color:C.textSec,fontSize:12,cursor:"pointer",fontFamily:C.sans}}>
                🔄 Clear Filters
              </button>
              <button type="button" onClick={()=>setShowAdd(true)} style={{padding:"8px 16px",background:`linear-gradient(135deg,${C.gold},#9B7A2E)`,border:"none",borderRadius:8,color:"#000",fontSize:12,fontWeight:800,cursor:"pointer",fontFamily:C.sans}}>
                + Add Lead
              </button>
            </div>
          </div>
        ):view==="table"?(
          <div>
            <div style={{display:"grid",gridTemplateColumns:"8px 1fr 120px 130px 100px 100px 85px 70px",gap:0,padding:"7px 16px",background:C.surface,borderBottom:`1px solid ${C.border}`,position:"sticky",top:0,zIndex:10}}>
              {["","Name","Status","Budget","Source","Community","Last Contact",""].map((h,i)=>(
                <div key={i} style={{fontSize:9,fontWeight:700,color:C.textMuted,textTransform:"uppercase",letterSpacing:0.5}}>{h}</div>
              ))}
            </div>
            {filtered.map((l,i)=><LeadTableRow key={l.id||i} lead={l} onSelect={setSelectedLead} selected={selectedLead?.id===l.id} />)}
          </div>
        ):view==="grid"?(
          <div style={{padding:16,display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:10}}>
            {filtered.map((l,i)=><LeadGridCard key={l.id||i} lead={l} onSelect={setSelectedLead} />)}
          </div>
        ):(
          <div style={{padding:"0 16px"}}>
            {filtered.map((l,i)=>{
              const cfg=getStageCfg(l.status);
              return (
                <div key={l.id||i} onClick={()=>setSelectedLead(l)} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 0",borderBottom:`1px solid ${C.border}`,cursor:"pointer"}} className="crm-row">
                  <span style={{width:8,height:8,borderRadius:"50%",background:cfg.color,flexShrink:0}}/>
                  <div style={{width:34,height:34,borderRadius:"50%",background:C.surfaceAlt,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,color:C.gold,flexShrink:0}}>
                    {(l.name||"?").charAt(0).toUpperCase()}
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:13,fontWeight:600,color:C.white,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{l.name}</div>
                    <div style={{fontSize:10,color:C.textSec}}>{l.phone} · {l.source}</div>
                  </div>
                  <div style={{fontSize:12,fontWeight:700,color:C.gold}}>{l.budget?fmtAED(l.budget):"—"}</div>
                  <span style={{fontSize:10,padding:"3px 8px",borderRadius:10,background:cfg.bg,color:cfg.color,fontWeight:600,whiteSpace:"nowrap"}}>{l.status||"New Lead"}</span>
                  <span style={{fontSize:10,color:C.textMuted,width:70,textAlign:"right",flexShrink:0}}>{timeAgo(l.updatedAt||l.createdAt)}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showAdd&&<AddLeadModal onClose={()=>setShowAdd(false)} onSave={()=>notify("Lead added!")} orgId={orgId} firebaseUser={firebaseUser} notify={notify} />}
    </div>
  );
}
