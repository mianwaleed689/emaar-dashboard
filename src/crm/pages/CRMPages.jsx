/* eslint-disable */
import React, { useState, useMemo } from "react";
import { collection, addDoc } from "firebase/firestore";
import { db } from "../../firebase";
import { C, OPP_STAGES, DEAL_STAGES, ACTIVITY_TYPES, fmtAED, fmt, timeAgo, getStageCfg } from "../crmTokens";

// ─── Shared ───────────────────────────────────────
function PageHeader({ title, sub, actions }) {
  return (
    <div style={{padding:"16px 22px",borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
      <div>
        <div style={{fontSize:18,fontWeight:800,color:C.white}}>{title}</div>
        {sub&&<div style={{fontSize:12,color:C.textSec,marginTop:2}}>{sub}</div>}
      </div>
      <div style={{display:"flex",gap:10}}>{actions}</div>
    </div>
  );
}
function StatPill({ val, label, color }) {
  return (
    <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:"8px 16px",textAlign:"center",minWidth:90}}>
      <div style={{fontSize:18,fontWeight:800,color:color||C.gold}}>{val}</div>
      <div style={{fontSize:10,color:C.textSec,marginTop:1}}>{label}</div>
    </div>
  );
}
const AddBtn = ({onClick,label})=>(
  <button type="button" onClick={onClick} style={{padding:"8px 16px",background:`linear-gradient(135deg,${C.gold},#9B7A2E)`,border:"none",borderRadius:8,color:"#000",fontSize:12,fontWeight:800,cursor:"pointer",fontFamily:C.sans}}>
    {label}
  </button>
);
const inp = {width:"100%",padding:"9px 12px",background:C.surfaceAlt,border:`1px solid ${C.border}`,borderRadius:8,color:C.text,fontSize:12,fontFamily:C.sans,outline:"none",boxSizing:"border-box"};

// ─── Opportunities ────────────────────────────────
export function CRMOpportunities({ myLeads, firebaseUser, orgId, notify }) {
  const [showAdd, setShowAdd] = useState(false);

  const opps = useMemo(()=>(myLeads||[]).filter(l=>l.budget>=1000000&&["Hot Case","EOI","Interested","Potential"].includes(l.status)),[myLeads]);
  const totalVal = useMemo(()=>opps.reduce((s,l)=>s+(l.budget||0),0),[opps]);

  const byStage = useMemo(()=>{
    const g={};
    OPP_STAGES.forEach(s=>g[s.key]=[]);
    opps.forEach(l=>{
      const stage=l.status==="Hot Case"?"Qualified":l.status==="EOI"?"Proposal":l.status==="Interested"?"New":"Qualified";
      if(g[stage])g[stage].push(l);
    });
    return g;
  },[opps]);

  return (
    <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
      <PageHeader title="Opportunities" sub={`${opps.length} opportunities · Pipeline: ${fmtAED(totalVal)}`}
        actions={[
          <StatPill key="open" val={opps.length} label="Open" color={C.orange}/>,
          <StatPill key="val" val={fmtAED(totalVal)} label="Pipeline" color={C.gold}/>,
          <AddBtn key="add" onClick={()=>setShowAdd(true)} label="+ New Opportunity"/>,
        ]}
      />
      {/* Kanban */}
      <div style={{flex:1,overflowX:"auto",display:"flex",gap:12,padding:16}}>
        {OPP_STAGES.map(stage=>{
          const cards=byStage[stage.key]||[];
          const stageVal=cards.reduce((s,l)=>s+(l.budget||0),0);
          return (
            <div key={stage.key} style={{flexShrink:0,width:240,display:"flex",flexDirection:"column",gap:8}}>
              <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:"10px 14px",borderTop:`2px solid ${stage.color}`}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <span style={{fontSize:12,fontWeight:700,color:C.white}}>{stage.key}</span>
                  <span style={{fontSize:11,fontWeight:700,color:stage.color,background:`${stage.color}20`,borderRadius:10,padding:"1px 7px"}}>{cards.length}</span>
                </div>
                {stageVal>0&&<div style={{fontSize:10,color:C.gold,marginTop:3}}>{fmtAED(stageVal)}</div>}
              </div>
              <div style={{flex:1,overflowY:"auto",display:"flex",flexDirection:"column",gap:7}}>
                {cards.length===0?(
                  <div style={{background:C.card,border:`1px dashed ${C.border}`,borderRadius:10,padding:"20px",textAlign:"center",color:C.textMuted,fontSize:11}}>Drop here</div>
                ):cards.map((l,i)=>(
                  <div key={l.id||i} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:"12px 14px",cursor:"pointer",transition:"border-color 0.15s"}}
                    onMouseEnter={e=>e.currentTarget.style.borderColor=stage.color+"50"}
                    onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}
                  >
                    <div style={{fontSize:12,fontWeight:700,color:C.white,marginBottom:5}}>{l.name}</div>
                    <div style={{fontSize:13,fontWeight:800,color:C.gold,marginBottom:4}}>{fmtAED(l.budget)}</div>
                    {l.community&&<div style={{fontSize:10,color:C.textSec}}>📍 {l.community}</div>}
                    <div style={{display:"flex",justifyContent:"space-between",marginTop:8,paddingTop:7,borderTop:`1px solid ${C.border}`}}>
                      <span style={{fontSize:9,color:C.textMuted}}>{l.source}</span>
                      <span style={{fontSize:9,color:C.textMuted}}>{timeAgo(l.updatedAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Deals ────────────────────────────────────────
export function CRMDeals({ deals, firebaseUser, orgId, notify }) {
  const [stageFilter, setStageFilter] = useState("All");
  const [payFilter, setPayFilter] = useState("All");
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({leadName:"",project:"",unit:"",value:"",commission:"",stage:"EOI",paymentStatus:"Pending",developerName:"",notes:""});
  const [saving, setSaving] = useState(false);
  const F=(k,v)=>setForm(p=>({...p,[k]:v}));

  const filtered = useMemo(()=>{
    let arr=deals||[];
    if(stageFilter!=="All")arr=arr.filter(d=>d.stage===stageFilter);
    if(payFilter!=="All")arr=arr.filter(d=>d.paymentStatus===payFilter);
    return arr;
  },[deals,stageFilter,payFilter]);

  const totalVal = useMemo(()=>filtered.reduce((s,d)=>s+parseFloat(d.price||d.value||0),0),[filtered]);
  const totalComm = useMemo(()=>filtered.reduce((s,d)=>s+parseFloat(d.commission||0),0),[filtered]);

  const save = async()=>{
    if(!form.leadName.trim()){notify("Client name required","error");return;}
    setSaving(true);
    try {
      await addDoc(collection(db,"deals"),{...form,value:parseFloat(form.value)||0,commission:parseFloat(form.commission)||0,orgId:orgId||"",agentId:firebaseUser?.uid||"",createdAt:new Date().toISOString()});
      notify("Deal created!");setShowAdd(false);
    } catch(e){notify("Failed: "+e.message,"error");}
    setSaving(false);
  };

  return (
    <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
      <PageHeader title="Deals" sub={`${filtered.length} deals · ${fmtAED(totalVal)} total value`}
        actions={[
          <StatPill key="deals" val={filtered.length} label="Total" color={C.blue}/>,
          <StatPill key="val" val={fmtAED(totalVal)} label="Value" color={C.gold}/>,
          <StatPill key="comm" val={fmtAED(totalComm)} label="Commission" color={C.green}/>,
          <AddBtn key="add" onClick={()=>setShowAdd(true)} label="+ Add Deal"/>,
        ]}
      />
      {/* Filters */}
      <div style={{display:"flex",alignItems:"center",gap:8,padding:"10px 18px",borderBottom:`1px solid ${C.border}`,flexShrink:0,flexWrap:"wrap"}}>
        <div style={{display:"flex",background:C.surfaceAlt,borderRadius:8,overflow:"hidden",border:`1px solid ${C.border}`}}>
          {["All",...DEAL_STAGES.map(s=>s.key)].map(s=>{
            const cfg=DEAL_STAGES.find(d=>d.key===s);
            return <button key={s} type="button" onClick={()=>setStageFilter(s)} style={{padding:"6px 12px",background:stageFilter===s?(cfg?.bg||C.goldDim):"none",border:"none",color:stageFilter===s?(cfg?.color||C.gold):C.textSec,fontSize:11,fontWeight:stageFilter===s?700:400,cursor:"pointer",fontFamily:C.sans}}>{s}</button>;
          })}
        </div>
        <div style={{display:"flex",background:C.surfaceAlt,borderRadius:8,overflow:"hidden",border:`1px solid ${C.border}`}}>
          {["All","Collected","Partial","Pending"].map(s=>(
            <button key={s} type="button" onClick={()=>setPayFilter(s)} style={{padding:"6px 12px",background:payFilter===s?C.goldDim:"none",border:"none",color:payFilter===s?C.gold:C.textSec,fontSize:11,fontWeight:payFilter===s?700:400,cursor:"pointer",fontFamily:C.sans}}>{s}</button>
          ))}
        </div>
      </div>
      {/* Table */}
      <div style={{flex:1,overflowY:"auto"}}>
        {filtered.length===0?(
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"60%",gap:12}}>
            <div style={{fontSize:36,opacity:0.2}}>🤝</div>
            <div style={{fontSize:14,fontWeight:600,color:C.textSec}}>No deals found</div>
            <AddBtn onClick={()=>setShowAdd(true)} label="+ Create First Deal"/>
          </div>
        ):(
          <>
            <div style={{display:"grid",gridTemplateColumns:"1fr 130px 130px 120px 110px 90px",gap:0,padding:"7px 18px",background:C.surface,borderBottom:`1px solid ${C.border}`,position:"sticky",top:0,zIndex:10}}>
              {["Deal","Stage","Value","Commission","Payment","Date"].map((h,i)=>(
                <div key={i} style={{fontSize:9,fontWeight:700,color:C.textMuted,textTransform:"uppercase",letterSpacing:0.4}}>{h}</div>
              ))}
            </div>
            {filtered.map((deal,i)=>{
              const cfg=DEAL_STAGES.find(s=>s.key===deal.stage)||{color:C.textSec,bg:C.surfaceAlt};
              const payColor=deal.paymentStatus==="Collected"?C.green:deal.paymentStatus==="Partial"?C.orange:C.yellow;
              return (
                <div key={deal.id||i} style={{display:"grid",gridTemplateColumns:"1fr 130px 130px 120px 110px 90px",gap:0,padding:"12px 18px",borderBottom:`1px solid ${C.border}`,alignItems:"center",cursor:"pointer",transition:"background 0.1s"}}
                  className="crm-row"
                >
                  <div>
                    <div style={{fontSize:13,fontWeight:600,color:C.white}}>{deal.project||deal.leadName||"Deal"}</div>
                    <div style={{fontSize:10,color:C.textSec}}>{deal.unit||deal.developerName||"—"}</div>
                  </div>
                  <span style={{fontSize:10,fontWeight:700,padding:"3px 9px",borderRadius:12,background:cfg.bg,color:cfg.color,width:"fit-content"}}>{deal.stage}</span>
                  <div style={{fontSize:13,fontWeight:700,color:C.gold}}>{fmtAED(deal.price||deal.value||0)}</div>
                  <div style={{fontSize:12,color:C.green,fontWeight:600}}>{fmtAED(deal.commission||0)}</div>
                  <span style={{fontSize:11,color:payColor,fontWeight:600}}>{deal.paymentStatus||"Pending"}</span>
                  <span style={{fontSize:10,color:C.textMuted}}>{deal.createdAt?new Date(deal.createdAt).toLocaleDateString("en-AE"):"—"}</span>
                </div>
              );
            })}
          </>
        )}
      </div>

      {showAdd&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",zIndex:3000,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
          <div style={{background:C.surface,borderRadius:16,border:`1px solid ${C.border}`,width:"100%",maxWidth:480,maxHeight:"90vh",overflowY:"auto"}}>
            <div style={{padding:"16px 20px",borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div style={{fontSize:14,fontWeight:700,color:C.white}}>Create New Deal</div>
              <button type="button" onClick={()=>setShowAdd(false)} style={{background:"none",border:"none",color:C.textSec,fontSize:18,cursor:"pointer"}}>×</button>
            </div>
            <div style={{padding:"16px 20px",display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              {[{k:"leadName",l:"Client Name *",p:"Client name"},{k:"project",l:"Project",p:"Project name"},{k:"unit",l:"Unit No.",p:"e.g. 1204"},{k:"developerName",l:"Developer",p:"Developer name"},{k:"value",l:"Deal Value (AED)",p:"2500000",type:"number"},{k:"commission",l:"Commission (AED)",p:"50000",type:"number"}].map(f=>(
                <div key={f.k}>
                  <div style={{fontSize:10,color:C.textSec,marginBottom:4,textTransform:"uppercase",letterSpacing:0.4}}>{f.l}</div>
                  <input type={f.type||"text"} style={inp} value={form[f.k]} onChange={e=>F(f.k,e.target.value)} placeholder={f.p}/>
                </div>
              ))}
              <div>
                <div style={{fontSize:10,color:C.textSec,marginBottom:4,textTransform:"uppercase",letterSpacing:0.4}}>Stage</div>
                <select style={inp} value={form.stage} onChange={e=>F("stage",e.target.value)}>
                  {DEAL_STAGES.map(s=><option key={s.key} value={s.key}>{s.key}</option>)}
                </select>
              </div>
              <div>
                <div style={{fontSize:10,color:C.textSec,marginBottom:4,textTransform:"uppercase",letterSpacing:0.4}}>Payment</div>
                <select style={inp} value={form.paymentStatus} onChange={e=>F("paymentStatus",e.target.value)}>
                  {["Pending","Partial","Collected"].map(s=><option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div style={{gridColumn:"1/-1"}}>
                <div style={{fontSize:10,color:C.textSec,marginBottom:4,textTransform:"uppercase",letterSpacing:0.4}}>Notes</div>
                <textarea style={{...inp,height:60,resize:"vertical"}} value={form.notes} onChange={e=>F("notes",e.target.value)} placeholder="Deal notes..."/>
              </div>
            </div>
            <div style={{padding:"12px 20px",borderTop:`1px solid ${C.border}`,display:"flex",gap:8,justifyContent:"flex-end"}}>
              <button type="button" onClick={()=>setShowAdd(false)} style={{padding:"8px 16px",borderRadius:8,border:`1px solid ${C.border}`,background:"none",color:C.textSec,fontSize:12,cursor:"pointer",fontFamily:C.sans}}>Cancel</button>
              <AddBtn onClick={save} label={saving?"Creating...":"Create Deal"}/>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Activities ───────────────────────────────────
export function CRMActivities({ firebaseUser, orgId, notify, myLeads }) {
  const [tab, setTab] = useState("pending");
  const [showAdd, setShowAdd] = useState(false);
  const [actType, setActType] = useState("call");
  const [form, setForm] = useState({title:"",notes:"",date:new Date().toISOString().split("T")[0],time:"10:00",leadId:""});
  const F=(k,v)=>setForm(p=>({...p,[k]:v}));

  return (
    <div style={{flex:1,display:"flex",overflow:"hidden"}}>
      {/* Main */}
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        <div style={{display:"flex",borderBottom:`1px solid ${C.border}`,flexShrink:0}}>
          {[{k:"pending",l:"Pending & Overdue"},{k:"upcoming",l:"Upcoming"},{k:"done",l:"Completed"}].map(t=>(
            <button key={t.k} type="button" onClick={()=>setTab(t.k)} style={{padding:"14px 20px",background:"none",border:"none",borderBottom:tab===t.k?`2px solid ${C.gold}`:"2px solid transparent",color:tab===t.k?C.gold:C.textSec,fontSize:13,fontWeight:tab===t.k?600:400,cursor:"pointer",fontFamily:C.sans}}>
              {t.l}
            </button>
          ))}
        </div>
        <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:12}}>
          <div style={{fontSize:36,opacity:0.2}}>✅</div>
          <div style={{fontSize:15,fontWeight:600,color:C.textSec}}>No pending activities</div>
          <div style={{fontSize:12,color:C.textMuted}}>All caught up!</div>
          <button type="button" onClick={()=>setShowAdd(true)} style={{marginTop:8,padding:"9px 18px",background:`linear-gradient(135deg,${C.gold},#9B7A2E)`,border:"none",borderRadius:8,color:"#000",fontSize:12,fontWeight:800,cursor:"pointer",fontFamily:C.sans}}>
            + Log Activity
          </button>
        </div>
      </div>

      {/* Right panel */}
      <div style={{width:260,borderLeft:`1px solid ${C.border}`,display:"flex",flexDirection:"column"}}>
        <div style={{padding:"14px 16px",borderBottom:`1px solid ${C.border}`}}>
          <div style={{fontSize:13,fontWeight:700,color:C.white}}>⚡ Quick Actions</div>
        </div>
        <div style={{padding:"6px",overflowY:"auto"}}>
          {ACTIVITY_TYPES.map(t=>(
            <button key={t.key} type="button" onClick={()=>{setActType(t.key);setShowAdd(true);}} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",width:"100%",background:"none",border:"none",borderRadius:8,cursor:"pointer",transition:"background 0.15s",fontFamily:C.sans,textAlign:"left"}}
              className="crm-qa"
            >
              <div style={{width:34,height:34,borderRadius:9,background:`${t.color}18`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,flexShrink:0}}>{t.icon}</div>
              <div>
                <div style={{fontSize:12,fontWeight:600,color:C.white}}>{t.label}</div>
                <div style={{fontSize:10,color:C.textSec}}>Record a {t.key} activity</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Add Modal */}
      {showAdd&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",zIndex:3000,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
          <div style={{background:C.surface,borderRadius:16,border:`1px solid ${C.border}`,width:"100%",maxWidth:400}}>
            <div style={{padding:"16px 20px",borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between"}}>
              <div style={{fontSize:14,fontWeight:700,color:C.white}}>Log Activity</div>
              <button type="button" onClick={()=>setShowAdd(false)} style={{background:"none",border:"none",color:C.textSec,fontSize:18,cursor:"pointer"}}>×</button>
            </div>
            <div style={{padding:"16px 20px",display:"flex",flexDirection:"column",gap:12}}>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                {ACTIVITY_TYPES.map(t=>(
                  <button key={t.key} type="button" onClick={()=>setActType(t.key)} style={{display:"flex",alignItems:"center",gap:4,padding:"5px 10px",borderRadius:20,background:actType===t.key?`${t.color}20`:C.surfaceAlt,border:`1px solid ${actType===t.key?t.color:"transparent"}`,color:actType===t.key?t.color:C.textSec,fontSize:11,cursor:"pointer",fontFamily:C.sans}}>
                    {t.icon} {t.label.split(" ")[0]}
                  </button>
                ))}
              </div>
              <div>
                <div style={{fontSize:10,color:C.textSec,marginBottom:4,textTransform:"uppercase",letterSpacing:0.4}}>Title *</div>
                <input style={inp} value={form.title} onChange={e=>F("title",e.target.value)} placeholder="Activity title"/>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                <div>
                  <div style={{fontSize:10,color:C.textSec,marginBottom:4,textTransform:"uppercase",letterSpacing:0.4}}>Date</div>
                  <input type="date" style={inp} value={form.date} onChange={e=>F("date",e.target.value)}/>
                </div>
                <div>
                  <div style={{fontSize:10,color:C.textSec,marginBottom:4,textTransform:"uppercase",letterSpacing:0.4}}>Time</div>
                  <input type="time" style={inp} value={form.time} onChange={e=>F("time",e.target.value)}/>
                </div>
              </div>
              <div>
                <div style={{fontSize:10,color:C.textSec,marginBottom:4,textTransform:"uppercase",letterSpacing:0.4}}>Linked Lead</div>
                <select style={inp} value={form.leadId} onChange={e=>F("leadId",e.target.value)}>
                  <option value="">No lead selected</option>
                  {(myLeads||[]).slice(0,50).map(l=><option key={l.id} value={l.id}>{l.name||l.phone}</option>)}
                </select>
              </div>
              <div>
                <div style={{fontSize:10,color:C.textSec,marginBottom:4,textTransform:"uppercase",letterSpacing:0.4}}>Notes</div>
                <textarea style={{...inp,height:70,resize:"vertical"}} value={form.notes} onChange={e=>F("notes",e.target.value)} placeholder="Activity notes..."/>
              </div>
            </div>
            <div style={{padding:"12px 20px",borderTop:`1px solid ${C.border}`,display:"flex",gap:8,justifyContent:"flex-end"}}>
              <button type="button" onClick={()=>setShowAdd(false)} style={{padding:"8px 16px",borderRadius:8,border:`1px solid ${C.border}`,background:"none",color:C.textSec,fontSize:12,cursor:"pointer",fontFamily:C.sans}}>Cancel</button>
              <AddBtn onClick={()=>{notify("Activity logged!");setShowAdd(false);}} label="Log Activity"/>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
