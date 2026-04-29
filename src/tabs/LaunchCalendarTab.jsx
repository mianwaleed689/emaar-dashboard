/* eslint-disable */
/* DXB ANALYTICS - LAUNCH CALENDAR TAB - Session 16 World Class Rebuild v3
   1,515 active projects from DLD + Emaar
   5 drawer tabs: Overview, Community Intel, Units, Developer, Timeline */

import React, { useState, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { T } from "../data";

const fmtP = n => n ? "AED "+Math.round(n).toLocaleString() : "--";
const fmtY = n => n ? parseFloat(n).toFixed(1)+"%" : "--";

const LIFECYCLE_COLOR = l => {
  if(l==="Announced")          return "#8B5CF6";
  if(l==="Early Construction") return "#F59E0B";
  if(l==="Under Construction") return "#10B981";
  if(l==="near-completion")    return "#06B6D4";
  if(l==="Completed")          return "#94A3B8";
  return "#64748B";
};

const LIFECYCLE_LABEL = l => {
  if(l==="near-completion") return "Near Completion";
  return l||"Unknown";
};

export default function LaunchCalendarTab({
  liveProjects=[], liveNeighbourhoods=[], extraProjects=[],
  handleTabChange, globalFilters={},
  lcView, setLcView,
}) {
  const [search,    setSearch]    = useState("");
  const [sortBy,    setSortBy]    = useState("handover");
  const [lifecycle, setLifecycle] = useState("all");
  const [selDev,    setSelDev]    = useState("all");
  const [selComm,   setSelComm]   = useState("all");
  const [selected,  setSelected]  = useState(null);
  const [drawerTab, setDrawerTab] = useState("overview");

  // Merge all projects
  const allProjects = useMemo(()=>[
    ...(liveProjects||[]),
    ...(extraProjects||[]),
  ].filter(p=>!p.archived),[liveProjects,extraProjects]);

  // Community lookup
  const nbhdMap = useMemo(()=>{
    const m={};
    (liveNeighbourhoods||[]).forEach(n=>{if(n.community)m[n.community.toLowerCase()]=n;});
    return m;
  },[liveNeighbourhoods]);
  const getNbhd = c => nbhdMap[(c||"").toLowerCase()]||null;

  // Unique developers and communities for filters
  const developers = useMemo(()=>
    ["all",...new Set(allProjects.map(p=>p.developer||"").filter(Boolean).sort())]
  ,[allProjects]);

  const communities = useMemo(()=>
    ["all",...new Set(allProjects.map(p=>p.community||"").filter(Boolean).sort())]
  ,[allProjects]);

  // Filtered projects
  const filtered = useMemo(()=>{
    let a = [...allProjects];
    if(search.trim()) a = a.filter(p=>
      (p.name||"").toLowerCase().includes(search.toLowerCase())||
      (p.community||"").toLowerCase().includes(search.toLowerCase())||
      (p.developer||"").toLowerCase().includes(search.toLowerCase())
    );
    if(lifecycle!=="all") a = a.filter(p=>p.lifecycle===lifecycle||(lifecycle==="near-completion"&&p.lifecycle==="near-completion"));
    if(selDev!=="all")    a = a.filter(p=>p.developer===selDev);
    if(selComm!=="all")   a = a.filter(p=>p.community===selComm);
    a.sort((x,y)=>{
      if(sortBy==="handover") {
        const getYear = p => p.handoverQuarter ? parseInt(p.handoverQuarter.split(" ")[1])*10+parseInt(p.handoverQuarter[1]) : 9999;
        return getYear(x)-getYear(y);
      }
      if(sortBy==="construction") return (y.constructionPct||0)-(x.constructionPct||0);
      if(sortBy==="units") return (y.totalUnits||0)-(x.totalUnits||0);
      if(sortBy==="name") return (x.name||"").localeCompare(y.name||"");
      return 0;
    });
    return a;
  },[allProjects,search,lifecycle,selDev,selComm,sortBy]);

  // Stats
  const totalUnits     = allProjects.reduce((s,p)=>s+(p.totalUnits||0),0);
  const announced      = allProjects.filter(p=>p.lifecycle==="Announced").length;
  const underConst     = allProjects.filter(p=>p.lifecycle==="Under Construction").length;
  const nearComp       = allProjects.filter(p=>p.lifecycle==="near-completion").length;
  const withHandover   = allProjects.filter(p=>p.handoverQuarter).length;

  // Chart  handover by quarter
  const handoverChart = useMemo(()=>{
    const qCount={};
    allProjects.filter(p=>p.handoverQuarter).forEach(p=>{
      qCount[p.handoverQuarter]=(qCount[p.handoverQuarter]||0)+1;
    });
    return Object.entries(qCount)
      .sort((a,b)=>a[0].localeCompare(b[0]))
      .slice(0,12)
      .map(([q,count])=>({q:q.replace(" 20","'"),count}));
  },[allProjects]);

  const selStyle = {padding:"6px 10px",background:"rgba(255,255,255,0.04)",border:"1px solid "+T.border,borderRadius:7,color:"#CBD5E1",fontSize:11,outline:"none",fontFamily:"'Outfit',sans-serif",maxWidth:160};

  const DRAWER_TABS = [
    {key:"overview",   label:"Overview"},
    {key:"community",  label:"Community Intel"},
    {key:"units",      label:"Units & Scale"},
    {key:"developer",  label:"Developer"},
    {key:"timeline",   label:"Timeline"},
  ];

  return (
    <div style={{display:"flex",gap:16,height:"calc(100vh - 140px)",paddingBottom:20}}>
      
      {/* LEFT  Project List */}
      <div style={{flex:1,display:"flex",flexDirection:"column",minWidth:0}}>
        
        {/* Header */}
        <div style={{marginBottom:12}}>
          <h2 style={{margin:0,fontSize:20,fontWeight:900,color:T.white,fontFamily:"'Fraunces',serif"}}>Launch Calendar</h2>
          <p style={{margin:"4px 0 0",fontSize:12,color:"#94A3B8"}}>
            {allProjects.length.toLocaleString()} active projects  {totalUnits.toLocaleString()} total units  {withHandover.toLocaleString()} with handover dates
          </p>
        </div>

        {/* KPI Row */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:12}}>
          {[
            {label:"Announced",        value:announced,   color:"#8B5CF6"},
            {label:"Under Construction",value:underConst, color:"#10B981"},
            {label:"Near Completion",  value:nearComp,    color:"#06B6D4"},
            {label:"Total Units",      value:totalUnits.toLocaleString(), color:T.gold},
          ].map((k,i)=>(
            <div key={i} style={{background:"rgba(255,255,255,0.02)",border:"1px solid "+T.border,borderRadius:10,padding:"10px 14px",position:"relative",overflow:"hidden"}}>
              <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:k.color}}/>
              <div style={{fontSize:9,fontWeight:700,color:"#64748B",textTransform:"uppercase",letterSpacing:0.8,marginBottom:3}}>{k.label}</div>
              <div style={{fontSize:18,fontWeight:900,color:k.color,fontFamily:"'Fraunces',serif"}}>{k.value}</div>
            </div>
          ))}
        </div>

        {/* Handover Chart */}
        {handoverChart.length>0&&(
          <div style={{background:"rgba(255,255,255,0.02)",border:"1px solid "+T.border,borderRadius:10,padding:"12px",marginBottom:12}}>
            <div style={{fontSize:11,fontWeight:700,color:T.white,marginBottom:8}}>Handover Pipeline by Quarter</div>
            <ResponsiveContainer width="100%" height={100}>
              <BarChart data={handoverChart} margin={{top:0,right:0,left:-30,bottom:0}}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} vertical={false}/>
                <XAxis dataKey="q" tick={{fontSize:8,fill:"#64748B"}}/>
                <YAxis tick={{fontSize:8,fill:"#64748B"}}/>
                <Tooltip contentStyle={{background:T.surface,border:"1px solid "+T.border,borderRadius:6,fontSize:10}} formatter={v=>[v+" projects","Handovers"]}/>
                <Bar dataKey="count" fill={T.gold} radius={[2,2,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Filters */}
        <div style={{display:"flex",gap:6,marginBottom:8,flexWrap:"wrap",alignItems:"center"}}>
          <div style={{flex:"1 1 180px",display:"flex",alignItems:"center",gap:8,padding:"6px 10px",background:"rgba(255,255,255,0.03)",border:"1px solid "+(search?T.gold:T.border),borderRadius:7}}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search project, developer, community..." style={{flex:1,background:"none",border:"none",outline:"none",color:T.white,fontSize:11,fontFamily:"'Outfit',sans-serif"}}/>
            {search&&<button type="button" onClick={()=>setSearch("")} style={{background:"none",border:"none",color:"#94A3B8",cursor:"pointer",fontSize:12}}>x</button>}
          </div>
          <select value={lifecycle} onChange={e=>setLifecycle(e.target.value)} style={selStyle}>
            <option value="all">All Stages</option>
            <option value="Announced">Announced</option>
            <option value="Early Construction">Early Construction</option>
            <option value="Under Construction">Under Construction</option>
            <option value="near-completion">Near Completion</option>
          </select>
          <select value={sortBy} onChange={e=>setSortBy(e.target.value)} style={selStyle}>
            <option value="handover">Earliest Handover</option>
            <option value="construction">Most Built</option>
            <option value="units">Most Units</option>
            <option value="name">A - Z</option>
          </select>
          <select value={selComm} onChange={e=>setSelComm(e.target.value)} style={{...selStyle,maxWidth:140}}>
            {communities.slice(0,50).map(c=><option key={c} value={c}>{c==="all"?"All Communities":c}</option>)}
          </select>
          <span style={{fontSize:11,color:"#94A3B8",marginLeft:"auto"}}>{filtered.length} projects</span>
        </div>

        {/* Project List */}
        <div style={{flex:1,overflowY:"auto",display:"flex",flexDirection:"column",gap:6}}>
          {filtered.slice(0,100).map((p,i)=>{
            const nbhd = getNbhd(p.community);
            const lcColor = LIFECYCLE_COLOR(p.lifecycle);
            const isSelected = selected?.id===p.id||selected?.name===p.name;
            return (
              <div key={p.id||p.name||i} onClick={()=>{setSelected(isSelected?null:p);setDrawerTab("overview");}}
                style={{background:isSelected?"rgba(212,168,67,0.06)":"rgba(255,255,255,0.02)",border:"1px solid "+(isSelected?"rgba(212,168,67,0.4)":T.border),borderRadius:10,padding:"12px 14px",cursor:"pointer",position:"relative",overflow:"hidden"}}
                onMouseEnter={e=>{if(!isSelected)e.currentTarget.style.borderColor="rgba(212,168,67,0.2)"}}
                onMouseLeave={e=>{if(!isSelected)e.currentTarget.style.borderColor=T.border}}
              >
                <div style={{position:"absolute",left:0,top:0,bottom:0,width:3,background:lcColor,borderRadius:"10px 0 0 10px"}}/>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
                  <div style={{flex:1,minWidth:0,paddingLeft:8}}>
                    <div style={{fontSize:13,fontWeight:700,color:T.white,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.name}</div>
                    <div style={{fontSize:11,color:"#94A3B8",marginTop:2}}>{p.developer}  {p.community}</div>
                  </div>
                  <div style={{display:"flex",gap:6,alignItems:"center",flexShrink:0,marginLeft:8}}>
                    <span style={{fontSize:9,padding:"2px 7px",borderRadius:4,background:lcColor+"20",color:lcColor,fontWeight:600}}>{LIFECYCLE_LABEL(p.lifecycle)}</span>
                    {p.handoverQuarter&&<span style={{fontSize:10,fontWeight:700,color:T.gold}}>{p.handoverQuarter}</span>}
                  </div>
                </div>
                <div style={{display:"flex",gap:12,alignItems:"center",paddingLeft:8,flexWrap:"wrap"}}>
                  {p.constructionPct>0&&(
                    <div style={{display:"flex",alignItems:"center",gap:6,flex:1,minWidth:120}}>
                      <div style={{flex:1,height:4,background:"rgba(255,255,255,0.06)",borderRadius:2,overflow:"hidden"}}>
                        <div style={{height:"100%",width:p.constructionPct+"%",background:lcColor,borderRadius:2}}/>
                      </div>
                      <span style={{fontSize:10,color:"#94A3B8",flexShrink:0}}>{p.constructionPct}%</span>
                    </div>
                  )}
                  {p.totalUnits>0&&<span style={{fontSize:10,color:"#94A3B8"}}>{p.totalUnits.toLocaleString()} units</span>}
                  {nbhd&&<span style={{fontSize:10,color:"#10B981"}}>{parseFloat(nbhd.grossYield||0).toFixed(1)}% yield</span>}
                  {p.escrowBank&&p.escrowBank!=="Local Bank"&&<span style={{fontSize:10,color:"#64748B",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:120}}>{p.escrowBank}</span>}
                </div>
              </div>
            );
          })}
          {filtered.length===0&&(
            <div style={{textAlign:"center",padding:"60px 20px",color:"#64748B"}}>
              <div style={{fontSize:24,marginBottom:8}}>?</div>
              <div style={{fontSize:13,fontWeight:600,color:"#94A3B8"}}>No projects found</div>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT  Project Detail Drawer */}
      {selected&&(
        <div style={{width:340,display:"flex",flexDirection:"column",background:"rgba(255,255,255,0.02)",border:"1px solid "+T.border,borderRadius:14,overflow:"hidden",flexShrink:0}}>
          
          {/* Drawer Header */}
          <div style={{padding:"16px",borderBottom:"1px solid "+T.border,position:"relative"}}>
            <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:LIFECYCLE_COLOR(selected.lifecycle)}}/>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginTop:4}}>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:15,fontWeight:800,color:T.white,fontFamily:"'Fraunces',serif",marginBottom:3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{selected.name}</div>
                <div style={{fontSize:11,color:"#94A3B8"}}>{selected.developer}</div>
              </div>
              <button type="button" onClick={()=>setSelected(null)} style={{background:"rgba(255,255,255,0.06)",border:"1px solid "+T.border,borderRadius:7,color:"#94A3B8",width:28,height:28,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0,marginLeft:8}}>x</button>
            </div>
            <div style={{display:"flex",gap:6,marginTop:8,flexWrap:"wrap"}}>
              <span style={{fontSize:9,padding:"2px 7px",borderRadius:4,background:LIFECYCLE_COLOR(selected.lifecycle)+"20",color:LIFECYCLE_COLOR(selected.lifecycle),fontWeight:600}}>{LIFECYCLE_LABEL(selected.lifecycle)}</span>
              {selected.handoverQuarter&&<span style={{fontSize:9,padding:"2px 7px",borderRadius:4,background:"rgba(212,168,67,0.12)",color:T.gold,fontWeight:600}}>{selected.handoverQuarter}</span>}
              {selected.community&&<span style={{fontSize:9,padding:"2px 7px",borderRadius:4,background:"rgba(255,255,255,0.06)",color:"#CBD5E1"}}>{selected.community}</span>}
            </div>
          </div>

          {/* Drawer Tabs */}
          <div style={{display:"flex",borderBottom:"1px solid "+T.border,overflowX:"auto"}}>
            {DRAWER_TABS.map(t=>(
              <button key={t.key} type="button" onClick={()=>setDrawerTab(t.key)}
                style={{padding:"9px 12px",background:"none",border:"none",borderBottom:drawerTab===t.key?"2px solid "+T.gold:"2px solid transparent",color:drawerTab===t.key?T.gold:"#64748B",fontSize:10,fontWeight:drawerTab===t.key?700:400,cursor:"pointer",whiteSpace:"nowrap",fontFamily:"'Outfit',sans-serif"}}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Drawer Content */}
          <div style={{flex:1,overflowY:"auto",padding:"14px"}}>
            
            {/* OVERVIEW TAB */}
            {drawerTab==="overview"&&(()=>{
              return (
                <div>
                  {selected.constructionPct>0&&(
                    <div style={{marginBottom:14}}>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                        <span style={{fontSize:10,color:"#64748B",textTransform:"uppercase",letterSpacing:0.7}}>Construction Progress</span>
                        <span style={{fontSize:12,fontWeight:700,color:LIFECYCLE_COLOR(selected.lifecycle)}}>{selected.constructionPct}%</span>
                      </div>
                      <div style={{height:8,background:"rgba(255,255,255,0.06)",borderRadius:4,overflow:"hidden"}}>
                        <div style={{height:"100%",width:selected.constructionPct+"%",background:LIFECYCLE_COLOR(selected.lifecycle),borderRadius:4,transition:"width 0.5s"}}/>
                      </div>
                    </div>
                  )}
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
                    {[
                      {label:"Status",       value:LIFECYCLE_LABEL(selected.lifecycle), color:LIFECYCLE_COLOR(selected.lifecycle)},
                      {label:"Handover",     value:selected.handoverQuarter||"TBD",     color:T.gold},
                      {label:"Total Units",  value:selected.totalUnits?selected.totalUnits.toLocaleString():"--", color:T.white},
                      {label:"Villas",       value:selected.villas>0?selected.villas:"--", color:T.white},
                      {label:"Escrow Bank",  value:selected.escrowBank||"--",           color:"#94A3B8"},
                      {label:"Launch Date",  value:selected.launchDate?selected.launchDate.substring(0,10):"--", color:"#94A3B8"},
                    ].map((m,i)=>(
                      <div key={i} style={{background:"rgba(255,255,255,0.03)",borderRadius:8,padding:"9px 11px"}}>
                        <div style={{fontSize:9,color:"#64748B",textTransform:"uppercase",letterSpacing:0.7,marginBottom:2}}>{m.label}</div>
                        <div style={{fontSize:12,fontWeight:600,color:m.color,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{m.value}</div>
                      </div>
                    ))}
                  </div>
                  {selected.description&&selected.description!=="null"&&(
                    <div style={{padding:"10px 12px",background:"rgba(255,255,255,0.02)",border:"1px solid "+T.border,borderRadius:8,fontSize:11,color:"#94A3B8",lineHeight:1.6}}>
                      {selected.description.substring(0,200)}{selected.description.length>200?"...":""}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* COMMUNITY INTEL TAB */}
            {drawerTab==="community"&&(()=>{
              const nbhd = getNbhd(selected.community);
              if(!nbhd) return (
                <div style={{textAlign:"center",padding:"30px 20px",color:"#64748B"}}>
                  <div style={{fontSize:12}}>No community data for {selected.community}</div>
                </div>
              );
              return (
                <div>
                  <div style={{background:"rgba(212,168,67,0.06)",border:"1px solid rgba(212,168,67,0.2)",borderRadius:10,padding:"12px",marginBottom:12}}>
                    <div style={{fontSize:14,fontWeight:700,color:T.white,fontFamily:"'Fraunces',serif",marginBottom:2}}>{nbhd.community}</div>
                    <div style={{fontSize:10,color:"#94A3B8"}}>{nbhd.tier==="verified"?"Verified Data":"Area Data"}  Score {nbhd.investmentScore||"--"}/100</div>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
                    {[
                      {label:"Gross Yield",   value:fmtY(nbhd.grossYield),   color:"#10B981"},
                      {label:"Net Yield",     value:fmtY(nbhd.netYield),     color:"#84CC16"},
                      {label:"Avg PPSF",      value:nbhd.avgPpsf?"AED "+Math.round(nbhd.avgPpsf).toLocaleString():"--", color:T.gold},
                      {label:"Supply Risk",   value:nbhd.supplyRisk||"--",   color:nbhd.supplyRisk==="Low"?"#10B981":"#F59E0B"},
                      {label:"DLD Txns",      value:nbhd.dldTransactions?nbhd.dldTransactions.toLocaleString():"--", color:"#94A3B8"},
                      {label:"Liquidity",     value:nbhd.liquidity||"--",    color:"#94A3B8"},
                    ].map((m,i)=>(
                      <div key={i} style={{background:"rgba(255,255,255,0.03)",borderRadius:8,padding:"9px 11px"}}>
                        <div style={{fontSize:9,color:"#64748B",textTransform:"uppercase",letterSpacing:0.7,marginBottom:2}}>{m.label}</div>
                        <div style={{fontSize:12,fontWeight:600,color:m.color}}>{m.value}</div>
                      </div>
                    ))}
                  </div>
                  {[
                    {label:"Metro",    value:nbhd.nearestMetro,    dist:nbhd.distMetro},
                    {label:"Mall",     value:nbhd.nearestMall,     dist:nbhd.distMall},
                    {label:"Hospital", value:nbhd.nearestHospital, dist:nbhd.distHospital},
                    {label:"School",   value:nbhd.nearestSchool,   dist:nbhd.distSchool},
                  ].filter(f=>f.value).map((f,i)=>(
                    <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:"1px solid "+T.border+"20"}}>
                      <span style={{fontSize:10,color:"#64748B",width:70}}>{f.label}</span>
                      <span style={{fontSize:11,color:T.white,flex:1}}>{f.value}</span>
                      <span style={{fontSize:11,fontWeight:600,color:T.gold}}>{f.dist?parseFloat(f.dist).toFixed(1)+"km":"--"}</span>
                    </div>
                  ))}
                  <button type="button" onClick={()=>handleTabChange&&handleTabChange("Neighbourhoods")}
                    style={{width:"100%",marginTop:12,padding:"9px",borderRadius:8,border:"1px solid "+T.gold,background:"rgba(212,168,67,0.08)",color:T.gold,fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>
                    View Full Community Profile
                  </button>
                </div>
              );
            })()}

            {/* UNITS TAB */}
            {drawerTab==="units"&&(()=>{
              return (
                <div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
                    {[
                      {label:"Total Units",  value:selected.totalUnits?selected.totalUnits.toLocaleString():"--", color:T.white},
                      {label:"Apartments",   value:selected.apartments||"--", color:"#63B3ED"},
                      {label:"Villas",       value:selected.villas||"--",     color:"#10B981"},
                      {label:"Buildings",    value:selected.buildings||"--",  color:"#94A3B8"},
                    ].map((m,i)=>(
                      <div key={i} style={{background:"rgba(255,255,255,0.03)",borderRadius:8,padding:"9px 11px"}}>
                        <div style={{fontSize:9,color:"#64748B",textTransform:"uppercase",letterSpacing:0.7,marginBottom:2}}>{m.label}</div>
                        <div style={{fontSize:16,fontWeight:700,color:m.color,fontFamily:"'Fraunces',serif"}}>{m.value}</div>
                      </div>
                    ))}
                  </div>
                  {selected.description&&(
                    <div style={{padding:"10px",background:"rgba(255,255,255,0.02)",border:"1px solid "+T.border,borderRadius:8,fontSize:11,color:"#94A3B8",lineHeight:1.6}}>
                      {selected.description.substring(0,300)}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* DEVELOPER TAB */}
            {drawerTab==="developer"&&(()=>{
              return (
                <div>
                  <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid "+T.border,borderRadius:10,padding:"14px",marginBottom:12}}>
                    <div style={{fontSize:15,fontWeight:700,color:T.white,fontFamily:"'Fraunces',serif",marginBottom:4}}>{selected.developer}</div>
                    <div style={{fontSize:10,color:"#94A3B8"}}>Developer #{selected.developerNumber||"--"}</div>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
                    {[
                      {label:"Escrow Bank",  value:selected.escrowBank||"--",       color:"#94A3B8"},
                      {label:"DLD Project #",value:selected.projectNumber||"--",    color:"#94A3B8"},
                      {label:"Master Dev",   value:selected.masterProject||"--",    color:"#CBD5E1"},
                      {label:"Source",       value:selected.dldImported?"DLD 2026":"Emaar", color:T.gold},
                    ].map((m,i)=>(
                      <div key={i} style={{background:"rgba(255,255,255,0.03)",borderRadius:8,padding:"9px 11px"}}>
                        <div style={{fontSize:9,color:"#64748B",textTransform:"uppercase",letterSpacing:0.7,marginBottom:2}}>{m.label}</div>
                        <div style={{fontSize:11,fontWeight:600,color:m.color,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{m.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* TIMELINE TAB */}
            {drawerTab==="timeline"&&(()=>{
              const pct = selected.constructionPct||0;
              const stages = [
                {label:"Registered",   done:true,         date:selected.launchDate?.substring(0,10)||""},
                {label:"Construction", done:pct>0,        date:pct>0?pct+"% complete":""},
                {label:"50% Built",    done:pct>=50,      date:pct>=50?"Reached":""},
                {label:"90% Built",    done:pct>=90,      date:pct>=90?"Near completion":""},
                {label:"Handover",     done:pct>=100,     date:selected.handoverQuarter||"TBD"},
              ];
              return (
                <div>
                  {stages.map((s,i)=>(
                    <div key={i} style={{display:"flex",gap:12,alignItems:"flex-start",marginBottom:12}}>
                      <div style={{display:"flex",flexDirection:"column",alignItems:"center"}}>
                        <div style={{width:20,height:20,borderRadius:"50%",background:s.done?"#10B981":"rgba(255,255,255,0.06)",border:"2px solid "+(s.done?"#10B981":T.border),display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                          {s.done&&<div style={{width:8,height:8,borderRadius:"50%",background:"#fff"}}/>}
                        </div>
                        {i<stages.length-1&&<div style={{width:2,height:20,background:s.done?"#10B981":"rgba(255,255,255,0.06)",margin:"2px 0"}}/>}
                      </div>
                      <div style={{paddingTop:2}}>
                        <div style={{fontSize:12,fontWeight:600,color:s.done?T.white:"#64748B"}}>{s.label}</div>
                        {s.date&&<div style={{fontSize:10,color:"#64748B",marginTop:1}}>{s.date}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}