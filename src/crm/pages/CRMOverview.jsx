/* eslint-disable */
import React, { useMemo } from "react";
import { C, LEAD_STAGES, fmtAED, fmt, timeAgo, getStageCfg } from "../crmTokens";

function KPICard({ icon, label, value, sub, subColor, color }) {
  return (
    <div style={{
      background:C.card, border:`1px solid ${C.border}`, borderRadius:14,
      padding:"18px 20px", flex:1, minWidth:0, position:"relative", overflow:"hidden",
      transition:"border-color 0.2s, transform 0.2s",
    }}
      onMouseEnter={e=>{e.currentTarget.style.borderColor=C.borderHover;e.currentTarget.style.transform="translateY(-1px)";}}
      onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.transform="none";}}
    >
      <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,${color},transparent)`}} />
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
        <span style={{fontSize:11,color:C.textSec,fontWeight:500,letterSpacing:0.3,textTransform:"uppercase"}}>{label}</span>
        <div style={{width:34,height:34,borderRadius:10,background:`${color}18`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>{icon}</div>
      </div>
      <div style={{fontSize:30,fontWeight:800,color:C.white,fontFamily:C.serif,lineHeight:1}}>{value}</div>
      {sub&&<div style={{fontSize:11,color:subColor||C.textSec,marginTop:5}}>{sub}</div>}
    </div>
  );
}

function SectionHead({ title }) {
  return <div style={{fontSize:10,fontWeight:700,color:C.textMuted,letterSpacing:1.2,textTransform:"uppercase",marginBottom:10}}>{title}</div>;
}

function Widget({ title, icon, onViewAll, children, style={} }) {
  return (
    <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,overflow:"hidden",display:"flex",flexDirection:"column",...style}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 18px",borderBottom:`1px solid ${C.border}`}}>
        <div style={{display:"flex",alignItems:"center",gap:7}}>
          <span style={{fontSize:15}}>{icon}</span>
          <span style={{fontSize:13,fontWeight:600,color:C.white}}>{title}</span>
        </div>
        {onViewAll&&(
          <button type="button" onClick={onViewAll} style={{background:"none",border:"none",color:C.gold,fontSize:11,cursor:"pointer",display:"flex",alignItems:"center",gap:3,fontFamily:C.sans}}>
            View all <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        )}
      </div>
      <div style={{flex:1,overflow:"hidden"}}>{children}</div>
    </div>
  );
}

function EmptyWidget({ icon, text, sub }) {
  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"32px 20px",gap:8}}>
      <div style={{fontSize:28,opacity:0.25}}>{icon}</div>
      <div style={{fontSize:12,color:C.textSec,fontWeight:500}}>{text}</div>
      {sub&&<div style={{fontSize:10,color:C.textMuted}}>{sub}</div>}
    </div>
  );
}

function AgentCard({ agent, leads }) {
  const agentLeads = leads.filter(l=>l.assignedTo===agent.uid||l.createdBy===agent.uid);
  const hot = agentLeads.filter(l=>l.status==="Hot Case").length;
  const closed = agentLeads.filter(l=>l.status==="Closed Deal").length;
  return (
    <div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 16px",borderBottom:`1px solid ${C.border}`}}>
      <div style={{width:32,height:32,borderRadius:"50%",background:`linear-gradient(135deg,${C.gold},#9B7A2E)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:800,color:"#000",flexShrink:0}}>
        {(agent.name||agent.email||"A").charAt(0).toUpperCase()}
      </div>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontSize:12,fontWeight:600,color:C.white,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{agent.name||agent.email||"Agent"}</div>
        <div style={{fontSize:10,color:C.textSec}}>{agentLeads.length} leads</div>
      </div>
      <div style={{display:"flex",gap:8}}>
        {hot>0&&<span style={{fontSize:10,fontWeight:700,color:C.red,background:C.redDim,padding:"2px 6px",borderRadius:8}}>{hot} 🔥</span>}
        {closed>0&&<span style={{fontSize:10,fontWeight:700,color:C.green,background:C.greenDim,padding:"2px 6px",borderRadius:8}}>{closed} ✅</span>}
      </div>
    </div>
  );
}

export default function CRMOverview({ myLeads, myLeadsLoading, teamMembers, deals, userName, quote, onNavigate, orgName, isManager, staleCount }) {
  const leads = myLeads || [];
  const dealsArr = deals || [];

  const stats = useMemo(()=>{
    const closed = leads.filter(l=>l.status==="Closed Deal").length;
    const hot = leads.filter(l=>l.status==="Hot Case").length;
    const uncontacted = leads.filter(l=>!l.lastContact).length;
    const pipeline = dealsArr.reduce((s,d)=>s+parseFloat(d.price||d.value||0),0);
    const conversion = leads.length>0?((closed/leads.length)*100).toFixed(1):"0.0";
    const commissions = dealsArr.filter(d=>d.stage==="Contracted").reduce((s,d)=>s+parseFloat(d.commission||0),0);
    return {total:leads.length,hot,closed,uncontacted,pipeline,conversion,commissions,deals:dealsArr.length};
  },[leads,dealsArr]);

  const stageCounts = useMemo(()=>{
    const m={};
    leads.forEach(l=>{m[l.status||"New Lead"]=(m[l.status||"New Lead"]||0)+1;});
    return Object.entries(m).sort((a,b)=>b[1]-a[1]).slice(0,7);
  },[leads]);

  const agents = useMemo(()=>(teamMembers||[]).filter(m=>["agent"].includes(m.orgRole||m.role)).slice(0,5),[teamMembers]);

  const recentLeads = useMemo(()=>leads.slice(0,5),[leads]);

  const greeting = ()=>{
    const h=new Date().getHours();
    if(h<12) return "Good morning";
    if(h<17) return "Good afternoon";
    return "Good evening";
  };

  // Community intel from leads
  const topCommunities = useMemo(()=>{
    const m={};
    leads.forEach(l=>{if(l.community)m[l.community]=(m[l.community]||0)+1;});
    return Object.entries(m).sort((a,b)=>b[1]-a[1]).slice(0,5);
  },[leads]);

  return (
    <div style={{flex:1,overflowY:"auto",padding:"20px 24px",display:"flex",flexDirection:"column",gap:20}}>

      {/* Hero */}
      <div style={{
        background:`linear-gradient(135deg,#0F1A2E,#0A1528)`,
        border:`1px solid ${C.goldBorder}`,
        borderRadius:16,padding:"18px 24px",
        display:"flex",alignItems:"center",justifyContent:"space-between",gap:20,
      }}>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <div style={{width:46,height:46,borderRadius:13,background:C.surfaceAlt,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>
            {new Date().getHours()<17?"☀️":"🌙"}
          </div>
          <div>
            <h1 style={{margin:0,fontSize:22,fontWeight:800,color:C.white}}>
              {greeting()}, <span style={{color:C.gold}}>{userName}</span>
            </h1>
            <p style={{margin:"4px 0 0",fontSize:11,color:C.textSec,fontStyle:"italic",maxWidth:500}}>
              "{quote.text}" — {quote.author}
            </p>
          </div>
        </div>
        <div style={{display:"flex",gap:10,flexShrink:0}}>
          {[
            {label:"Today",val:new Date().toLocaleDateString("en-AE",{weekday:"short",day:"numeric",month:"short"}),color:C.border},
            {label:"Commissions",val:fmtAED(stats.commissions),color:C.goldBorder,textColor:C.gold},
            ...(orgName?[{label:"Agency",val:orgName,color:"rgba(0,191,165,0.2)",textColor:C.teal}]:[]),
          ].map((b,i)=>(
            <div key={i} style={{background:C.card,border:`1px solid ${b.color}`,borderRadius:10,padding:"8px 14px",textAlign:"right"}}>
              <div style={{fontSize:13,fontWeight:700,color:b.textColor||C.white}}>{b.val}</div>
              <div style={{fontSize:10,color:C.textSec,marginTop:1}}>{b.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div>
        <SectionHead title="CRM Overview" />
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
          <KPICard icon="👥" label="Total Leads" value={fmt(stats.total)} sub={`${stats.uncontacted} uncontacted`} subColor={C.yellow} color={C.blue} />
          <KPICard icon="🔥" label="Hot Leads" value={fmt(stats.hot)} sub={`${staleCount} stale alerts`} subColor={staleCount>0?C.yellow:C.textSec} color={C.red} />
          <KPICard icon="🤝" label="Active Deals" value={fmt(stats.deals)} sub={fmtAED(stats.pipeline)+" pipeline"} subColor={C.gold} color={C.teal} />
          <KPICard icon="📈" label="Conversion" value={stats.conversion+"%"} sub={`${stats.closed} closed deals`} subColor={C.green} color={C.green} />
        </div>
      </div>

      {/* Stale alert bar */}
      {staleCount>0&&(
        <div style={{background:"rgba(251,191,36,0.06)",border:`1px solid rgba(251,191,36,0.2)`,borderRadius:12,padding:"12px 18px",display:"flex",alignItems:"center",gap:12}}>
          <span style={{fontSize:18}}>⚠️</span>
          <div style={{flex:1}}>
            <span style={{fontSize:13,fontWeight:700,color:C.yellow}}>{staleCount} leads</span>
            <span style={{fontSize:12,color:C.textSec}}> have had no contact in 7+ days</span>
          </div>
          <button type="button" onClick={()=>onNavigate("leads")} style={{padding:"7px 14px",background:C.yellowDim,border:`1px solid rgba(251,191,36,0.3)`,borderRadius:8,color:C.yellow,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:C.sans}}>
            View Stale Leads →
          </button>
        </div>
      )}

      {/* Main grid */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}}>

        {/* Stage breakdown */}
        <Widget title="Leads by Stage" icon="🎯" onViewAll={()=>onNavigate("leads")}>
          {stageCounts.length===0?(
            <EmptyWidget icon="📋" text="No stage data yet" />
          ):(
            <div style={{padding:"12px 16px",display:"flex",flexDirection:"column",gap:8}}>
              {stageCounts.map(([stage,count])=>{
                const cfg=getStageCfg(stage);
                const pct=Math.round((count/(leads.length||1))*100);
                return (
                  <div key={stage}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                      <div style={{display:"flex",alignItems:"center",gap:5}}>
                        <span style={{width:6,height:6,borderRadius:"50%",background:cfg.color,display:"inline-block"}}/>
                        <span style={{fontSize:11,color:C.textSec}}>{stage}</span>
                      </div>
                      <span style={{fontSize:11,fontWeight:700,color:C.white}}>{count}</span>
                    </div>
                    <div style={{height:3,background:C.surfaceAlt,borderRadius:2,overflow:"hidden"}}>
                      <div style={{width:pct+"%",height:"100%",background:cfg.color,borderRadius:2,transition:"width 0.6s ease"}}/>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Widget>

        {/* Top communities from leads */}
        <Widget title="Top Communities" icon="🏙️">
          {topCommunities.length===0?(
            <EmptyWidget icon="📍" text="No community data yet" sub="Add leads with communities to see data" />
          ):(
            <div style={{padding:"8px 0"}}>
              {topCommunities.map(([comm,cnt],i)=>(
                <div key={comm} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 16px",borderBottom:`1px solid ${C.border}`}}>
                  <span style={{fontSize:11,color:C.textMuted,width:16,fontWeight:700}}>#{i+1}</span>
                  <div style={{flex:1}}>
                    <div style={{fontSize:12,fontWeight:600,color:C.white}}>{comm}</div>
                    <div style={{fontSize:10,color:C.textSec}}>{cnt} {cnt===1?"lead":"leads"}</div>
                  </div>
                  <div style={{width:50,height:3,background:C.surfaceAlt,borderRadius:2,overflow:"hidden"}}>
                    <div style={{width:Math.round((cnt/(topCommunities[0][1]||1))*100)+"%",height:"100%",background:C.gold,borderRadius:2}}/>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Widget>

        {/* Quick Actions */}
        <Widget title="Quick Actions" icon="⚡">
          <div style={{padding:"6px 6px"}}>
            {[
              {icon:"👤",label:"Add Lead",sub:"Create a new lead",color:C.blue,tab:"leads"},
              {icon:"🎯",label:"New Opportunity",sub:"Start tracking a deal",color:C.purple,tab:"opportunities"},
              {icon:"📞",label:"Log Call",sub:"Record a call activity",color:C.teal,tab:"activities"},
              {icon:"📅",label:"Schedule Meeting",sub:"Plan a meeting",color:C.gold,tab:"activities"},
              {icon:"🤝",label:"New Deal",sub:"EOI → Contracted pipeline",color:C.green,tab:"deals"},
              {icon:"🏠",label:"Project Match",sub:"Match lead to 1,552 projects",color:C.orange,tab:"leads"},
            ].map(qa=>(
              <button key={qa.label} type="button" className="crm-qa"
                onClick={()=>onNavigate(qa.tab)}
                style={{display:"flex",alignItems:"center",gap:10,padding:"9px 12px",width:"100%",background:"none",border:"none",borderRadius:8,cursor:"pointer",transition:"background 0.15s",fontFamily:C.sans,textAlign:"left"}}
              >
                <div style={{width:32,height:32,borderRadius:9,background:`${qa.color}18`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0}}>{qa.icon}</div>
                <div>
                  <div style={{fontSize:12,fontWeight:600,color:C.white}}>{qa.label}</div>
                  <div style={{fontSize:10,color:C.textSec}}>{qa.sub}</div>
                </div>
                <svg style={{marginLeft:"auto",color:C.textMuted}} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            ))}
          </div>
        </Widget>
      </div>

      {/* Bottom grid */}
      <div style={{display:"grid",gridTemplateColumns:isManager&&agents.length>0?"1fr 1fr":"1fr",gap:12}}>

        {/* Recent leads */}
        <Widget title="Recent Leads" icon="🕐" onViewAll={()=>onNavigate("leads")}>
          {recentLeads.length===0?(
            <EmptyWidget icon="👥" text="No leads yet" sub="Add your first lead to get started" />
          ):(
            <div>
              {recentLeads.map((lead,i)=>{
                const cfg=getStageCfg(lead.status);
                return (
                  <div key={lead.id||i} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 16px",borderBottom:`1px solid ${C.border}`,cursor:"pointer"}}
                    className="crm-row"
                  >
                    <span style={{width:8,height:8,borderRadius:"50%",background:cfg.color,flexShrink:0}}/>
                    <div style={{width:30,height:30,borderRadius:"50%",background:C.surfaceAlt,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:C.gold,flexShrink:0}}>
                      {(lead.name||"?").charAt(0).toUpperCase()}
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:12,fontWeight:600,color:C.white,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{lead.name||"—"}</div>
                      <div style={{fontSize:10,color:C.textSec}}>{lead.phone||lead.email||lead.source||"—"}</div>
                    </div>
                    <div style={{fontSize:12,fontWeight:700,color:C.gold,flexShrink:0}}>{lead.budget?fmtAED(lead.budget):"—"}</div>
                    <span style={{fontSize:10,padding:"2px 7px",borderRadius:10,background:cfg.bg,color:cfg.color,fontWeight:600,whiteSpace:"nowrap"}}>{lead.status||"New Lead"}</span>
                    <span style={{fontSize:10,color:C.textMuted,width:60,textAlign:"right",flexShrink:0}}>{timeAgo(lead.createdAt||lead.updatedAt)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </Widget>

        {/* Agent leaderboard — managers only */}
        {isManager&&agents.length>0&&(
          <Widget title="Team Performance" icon="🏆" onViewAll={()=>onNavigate("leads")}>
            {agents.map(agent=><AgentCard key={agent.uid} agent={agent} leads={leads} />)}
          </Widget>
        )}
      </div>

    </div>
  );
}
