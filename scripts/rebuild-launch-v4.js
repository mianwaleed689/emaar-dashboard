const fs = require("fs");

const tab = `/* eslint-disable */
/* DXB ANALYTICS - LAUNCH CALENDAR TAB - Session 16 World Class v4
   Rich project cards matching Neighbourhoods tab style */

import React, { useState, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { T } from "../data";

const fmtP = n => n ? "AED "+Math.round(n).toLocaleString() : "--";
const fmtY = n => n ? parseFloat(n).toFixed(1)+"%" : "--";
const fmtD = n => n ? parseFloat(n).toFixed(1)+" km" : "--";

const LC_COLOR = l => {
  if(l==="Announced")           return "#8B5CF6";
  if(l==="Early Construction")  return "#F59E0B";
  if(l==="Under Construction")  return "#10B981";
  if(l==="near-completion")     return "#06B6D4";
  return "#94A3B8";
};

const LC_LABEL = l => l==="near-completion"?"Near Completion":l||"Unknown";

const QUARTER_SORT = q => {
  if(!q) return 9999;
  const parts = q.split(" ");
  return parseInt(parts[1]||0)*10+parseInt((parts[0]||"Q9").replace("Q",""));
};

const Chip = ({label,color}) => (
  <span style={{fontSize:9,padding:"2px 6px",borderRadius:4,background:color+"18",color,fontWeight:600,display:"inline-block"}}>
    {label}
  </span>
);

const ScoreBadge = ({score}) => score ? (
  <div style={{width:36,height:36,borderRadius:"50%",background:"rgba(212,168,67,0.1)",border:"2px solid rgba(212,168,67,0.4)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
    <span style={{fontSize:10,fontWeight:800,color:T.gold}}>{score}</span>
  </div>
) : null;

const ProjectCard = ({p, nbhd, selected, onSelect}) => {
  const lcColor = LC_COLOR(p.lifecycle);
  const isSelected = selected;

  return (
    <div onClick={()=>onSelect(p)}
      style={{background:isSelected?"rgba(212,168,67,0.06)":"rgba(255,255,255,0.02)",border:"1px solid "+(isSelected?"rgba(212,168,67,0.4)":T.border),borderRadius:12,padding:"14px",cursor:"pointer",position:"relative",overflow:"hidden"}}
      onMouseEnter={e=>{if(!isSelected){e.currentTarget.style.background="rgba(255,255,255,0.04)";e.currentTarget.style.borderColor="rgba(212,168,67,0.2)";}}}
      onMouseLeave={e=>{if(!isSelected){e.currentTarget.style.background="rgba(255,255,255,0.02)";e.currentTarget.style.borderColor=T.border;}}}
    >
      {/* Top color bar */}
      <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:"linear-gradient(90deg,"+lcColor+","+lcColor+"40)"}}/>

      {/* Header */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
        <div style={{flex:1,minWidth:0,paddingRight:8}}>
          <div style={{fontSize:13,fontWeight:700,color:T.white,marginBottom:4,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.name}</div>
          <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
            <Chip label={LC_LABEL(p.lifecycle)} color={lcColor}/>
            {p.handoverQuarter&&<Chip label={p.handoverQuarter} color={T.gold}/>}
            {nbhd?.goldenVisa&&<Chip label="GV" color={T.gold}/>}
            {nbhd?.hasMetro&&<Chip label="Metro" color="#10B981"/>}
            {p.dldImported&&<Chip label="DLD" color="#64748B"/>}
          </div>
        </div>
        <ScoreBadge score={nbhd?.investmentScore}/>
      </div>

      {/* Metrics grid */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:10}}>
        {[
          {label:"Community Yield", value:fmtY(nbhd?.grossYield),                          color:nbhd?.grossYield>=7?"#10B981":T.gold},
          {label:"Avg PPSF",        value:nbhd?.avgPpsf?"AED "+Math.round(nbhd.avgPpsf).toLocaleString():"--", color:T.gold},
          {label:"Total Units",     value:p.totalUnits?p.totalUnits.toLocaleString():"--",  color:T.white},
          {label:"Escrow Bank",     value:p.escrowBank&&p.escrowBank!=="Local Bank"?p.escrowBank.replace(" Bank","").replace(" (PJSC)","").substring(0,18):"--", color:"#94A3B8"},
        ].map((m,i)=>(
          <div key={i} style={{background:"rgba(255,255,255,0.03)",borderRadius:7,padding:"7px 9px"}}>
            <div style={{fontSize:9,fontWeight:700,color:"#64748B",textTransform:"uppercase",letterSpacing:0.5,marginBottom:2}}>{m.label}</div>
            <div style={{fontSize:12,fontWeight:700,color:m.color,fontFamily:"'Fraunces',serif"}}>{m.value}</div>
          </div>
        ))}
      </div>

      {/* Construction progress */}
      {(p.constructionPct||0)>0&&(
        <div style={{marginBottom:8}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
            <span style={{fontSize:9,color:"#64748B",textTransform:"uppercase",letterSpacing:0.5}}>Construction</span>
            <span style={{fontSize:10,fontWeight:700,color:lcColor}}>{p.constructionPct}%</span>
          </div>
          <div style={{height:4,background:"rgba(255,255,255,0.06)",borderRadius:2,overflow:"hidden"}}>
            <div style={{height:"100%",width:p.constructionPct+"%",background:lcColor,borderRadius:2}}/>
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{fontSize:10,color:"#94A3B8",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",flex:1}}>{p.developer} · {p.community}</div>
        {nbhd?.supplyRisk&&(
          <span style={{fontSize:9,padding:"1px 6px",borderRadius:4,background:nbhd.supplyRisk==="Low"?"rgba(16,185,129,0.1)":"rgba(245,158,11,0.1)",color:nbhd.supplyRisk==="Low"?"#10B981":"#F59E0B",fontWeight:600,flexShrink:0,marginLeft:6}}>{nbhd.supplyRisk} Risk</span>
        )}
      </div>
    </div>
  );
};

export default function LaunchCalendarTab({
  liveProjects=[], liveNeighbourhoods=[], extraProjects=[],
  handleTabChange, globalFilters={},
  lcView, setLcView,
}) {
  const [search,    setSearch]    = useState("");
  const [sortBy,    setSortBy]    = useState("handover");
  const [lifecycle, setLifecycle] = useState("all");
  const [selComm,   setSelComm]   = useState("all");
  const [selected,  setSelected]  = useState(null);
  const [drawerTab, setDrawerTab] = useState("overview");
  const [viewMode,  setViewMode]  = useState("grid");

  // Merge + deduplicate
  const allProjects = useMemo(()=>{
    const seen = new Set();
    return [...(liveProjects||[]),...(extraProjects||[])]
      .filter(p=>!p.archived)
      .filter(p=>{
        const key = p.id||p.name;
        if(seen.has(key)) return false;
        seen.add(key); return true;
      });
  },[liveProjects,extraProjects]);

  // Community lookup
  const nbhdMap = useMemo(()=>{
    const m={};
    (liveNeighbourhoods||[]).forEach(n=>{if(n.community)m[n.community.toLowerCase()]=n;});
    return m;
  },[liveNeighbourhoods]);
  const getNbhd = c => nbhdMap[(c||"").toLowerCase()]||null;

  const communities = useMemo(()=>
    ["all",...new Set(allProjects.map(p=>p.community||"").filter(Boolean).sort())]
  ,[allProjects]);

  const filtered = useMemo(()=>{
    let a = [...allProjects];
    if(search.trim()) a = a.filter(p=>
      (p.name||"").toLowerCase().includes(search.toLowerCase())||
      (p.community||"").toLowerCase().includes(search.toLowerCase())||
      (p.developer||"").toLowerCase().includes(search.toLowerCase())
    );
    if(lifecycle!=="all") a = a.filter(p=>p.lifecycle===lifecycle);
    if(selComm!=="all")   a = a.filter(p=>p.community===selComm);
    a.sort((x,y)=>{
      if(sortBy==="handover")    return QUARTER_SORT(x.handoverQuarter)-QUARTER_SORT(y.handoverQuarter);
      if(sortBy==="construction")return (y.constructionPct||0)-(x.constructionPct||0);
      if(sortBy==="units")       return (y.totalUnits||0)-(x.totalUnits||0);
      if(sortBy==="score")       return (getNbhd(y.community)?.investmentScore||0)-(getNbhd(x.community)?.investmentScore||0);
      if(sortBy==="name")        return (x.name||"").localeCompare(y.name||"");
      return 0;
    });
    return a;
  },[allProjects,search,lifecycle,selComm,sortBy]);

  // Stats
  const totalUnits = allProjects.reduce((s,p)=>s+(p.totalUnits||0),0);
  const announced  = allProjects.filter(p=>p.lifecycle==="Announced").length;
  const underConst = allProjects.filter(p=>p.lifecycle==="Under Construction").length;
  const nearComp   = allProjects.filter(p=>p.lifecycle==="near-completion").length;

  // Chart
  const chartData = useMemo(()=>{
    const qCount={};
    allProjects.filter(p=>p.handoverQuarter).forEach(p=>{
      qCount[p.handoverQuarter]=(qCount[p.handoverQuarter]||0)+1;
    });
    return Object.entries(qCount)
      .sort((a,b)=>QUARTER_SORT(a[0])-QUARTER_SORT(b[0]))
      .filter(([q])=>parseInt(q.split(" ")[1])>=2025&&parseInt(q.split(" ")[1])<=2028)
      .map(([q,count])=>({q:q.replace(" 20","'"),count}));
  },[allProjects]);

  const selStyle={padding:"6px 10px",background:"rgba(255,255,255,0.04)",border:"1px solid "+T.border,borderRadius:7,color:"#CBD5E1",fontSize:11,outline:"none",fontFamily:"'Outfit',sans-serif"};

  const DRAWER_TABS=[
    {key:"overview",  label:"Overview"},
    {key:"community", label:"Community"},
    {key:"developer", label:"Developer"},
    {key:"timeline",  label:"Timeline"},
  ];

  return (
    <div style={{display:"flex",gap:16,height:"calc(100vh - 140px)",paddingBottom:20}}>

      {/* LEFT PANEL */}
      <div style={{flex:1,display:"flex",flexDirection:"column",minWidth:0}}>

        {/* Header */}
        <div style={{marginBottom:12}}>
          <h2 style={{margin:0,fontSize:20,fontWeight:900,color:T.white,fontFamily:"'Fraunces',serif"}}>Launch Calendar</h2>
          <p style={{margin:"4px 0 0",fontSize:12,color:"#94A3B8"}}>
            {allProjects.length.toLocaleString()} active projects · {totalUnits.toLocaleString()} total units · DLD + Emaar data
          </p>
        </div>

        {/* KPIs */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:12}}>
          {[
            {label:"Announced",         value:announced,   color:"#8B5CF6", onClick:()=>setLifecycle("Announced")},
            {label:"Under Construction",value:underConst,  color:"#10B981", onClick:()=>setLifecycle("Under Construction")},
            {label:"Near Completion",   value:nearComp,    color:"#06B6D4", onClick:()=>setLifecycle("near-completion")},
            {label:"Total Units",       value:totalUnits.toLocaleString(), color:T.gold, onClick:()=>setLifecycle("all")},
          ].map((k,i)=>(
            <div key={i} onClick={k.onClick} style={{background:"rgba(255,255,255,0.02)",border:"1px solid "+T.border,borderRadius:10,padding:"10px 14px",position:"relative",overflow:"hidden",cursor:"pointer"}}
              onMouseEnter={e=>e.currentTarget.style.borderColor=k.color+"60"}
              onMouseLeave={e=>e.currentTarget.style.borderColor=T.border}
            >
              <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:k.color}}/>
              <div style={{fontSize:9,fontWeight:700,color:"#64748B",textTransform:"uppercase",letterSpacing:0.8,marginBottom:3}}>{k.label}</div>
              <div style={{fontSize:18,fontWeight:900,color:k.color,fontFamily:"'Fraunces',serif"}}>{k.value}</div>
            </div>
          ))}
        </div>

        {/* Chart */}
        {chartData.length>0&&(
          <div style={{background:"rgba(255,255,255,0.02)",border:"1px solid "+T.border,borderRadius:10,padding:"12px",marginBottom:12}}>
            <div style={{fontSize:11,fontWeight:700,color:T.white,marginBottom:8}}>Handover Pipeline 2025-2028</div>
            <ResponsiveContainer width="100%" height={90}>
              <BarChart data={chartData} margin={{top:0,right:0,left:-30,bottom:0}}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} vertical={false}/>
                <XAxis dataKey="q" tick={{fontSize:8,fill:"#64748B"}}/>
                <YAxis tick={{fontSize:8,fill:"#64748B"}}/>
                <Tooltip contentStyle={{background:T.surface,border:"1px solid "+T.border,borderRadius:6,fontSize:10}} formatter={v=>[v+" projects","Handovers"]}/>
                <Bar dataKey="count" fill={T.gold} radius={[2,2,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Toolbar */}
        <div style={{display:"flex",gap:6,marginBottom:10,flexWrap:"wrap",alignItems:"center"}}>
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
            <option value="score">Best Score</option>
            <option value="units">Most Units</option>
            <option value="name">A - Z</option>
          </select>
          <select value={selComm} onChange={e=>setSelComm(e.target.value)} style={{...selStyle,maxWidth:150}}>
            {communities.slice(0,60).map(c=><option key={c} value={c}>{c==="all"?"All Communities":c}</option>)}
          </select>
          {/* View toggle */}
          <div style={{display:"flex",gap:2,background:"rgba(255,255,255,0.03)",border:"1px solid "+T.border,borderRadius:7,padding:2}}>
            {["grid","list"].map(v=>(
              <button key={v} type="button" onClick={()=>setViewMode(v)}
                style={{padding:"4px 10px",borderRadius:5,border:"none",background:viewMode===v?"rgba(212,168,67,0.15)":"transparent",color:viewMode===v?T.gold:"#64748B",fontSize:11,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>
                {v==="grid"?"Grid":"List"}
              </button>
            ))}
          </div>
          <span style={{fontSize:11,color:"#94A3B8"}}>{filtered.length} projects</span>
        </div>

        {/* Project Cards */}
        <div style={{flex:1,overflowY:"auto"}}>
          {viewMode==="grid"?(
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:12}}>
              {filtered.slice(0,120).map((p,i)=>(
                <ProjectCard key={p.id||p.name||i} p={p} nbhd={getNbhd(p.community)}
                  selected={selected?.id===p.id||selected?.name===p.name}
                  onSelect={p=>{setSelected(prev=>prev?.name===p.name?null:p);setDrawerTab("overview");}}
                />
              ))}
            </div>
          ):(
            <div style={{display:"flex",flexDirection:"column",gap:6}}>
              {filtered.slice(0,150).map((p,i)=>{
                const nbhd=getNbhd(p.community);
                const lcColor=LC_COLOR(p.lifecycle);
                const isSelected=selected?.id===p.id||selected?.name===p.name;
                return (
                  <div key={p.id||p.name||i} onClick={()=>{setSelected(isSelected?null:p);setDrawerTab("overview");}}
                    style={{background:isSelected?"rgba(212,168,67,0.06)":"rgba(255,255,255,0.02)",border:"1px solid "+(isSelected?"rgba(212,168,67,0.4)":T.border),borderRadius:10,padding:"10px 14px",cursor:"pointer",display:"flex",alignItems:"center",gap:12}}
                    onMouseEnter={e=>{if(!isSelected)e.currentTarget.style.borderColor="rgba(212,168,67,0.2)"}}
                    onMouseLeave={e=>{if(!isSelected)e.currentTarget.style.borderColor=T.border}}
                  >
                    <div style={{width:3,height:40,borderRadius:2,background:lcColor,flexShrink:0}}/>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:12,fontWeight:700,color:T.white,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.name}</div>
                      <div style={{fontSize:10,color:"#94A3B8",marginTop:2}}>{p.developer} · {p.community}</div>
                    </div>
                    <div style={{display:"flex",gap:10,alignItems:"center",flexShrink:0}}>
                      {nbhd?.grossYield&&<span style={{fontSize:11,fontWeight:700,color:"#10B981"}}>{parseFloat(nbhd.grossYield).toFixed(1)}%</span>}
                      {p.handoverQuarter&&<span style={{fontSize:10,color:T.gold,fontWeight:600}}>{p.handoverQuarter}</span>}
                      {p.constructionPct>0&&<span style={{fontSize:10,color:lcColor}}>{p.constructionPct}%</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {filtered.length===0&&(
            <div style={{textAlign:"center",padding:"60px 20px",color:"#64748B"}}>
              <div style={{fontSize:13,fontWeight:600,color:"#94A3B8"}}>No projects found</div>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT DRAWER */}
      {selected&&(
        <div style={{width:340,display:"flex",flexDirection:"column",background:"rgba(255,255,255,0.02)",border:"1px solid "+T.border,borderRadius:14,overflow:"hidden",flexShrink:0}}>
          <div style={{padding:"16px",borderBottom:"1px solid "+T.border,position:"relative"}}>
            <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:LC_COLOR(selected.lifecycle)}}/>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginTop:4}}>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:14,fontWeight:800,color:T.white,fontFamily:"'Fraunces',serif",marginBottom:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{selected.name}</div>
                <div style={{fontSize:11,color:"#94A3B8"}}>{selected.developer}</div>
              </div>
              <button type="button" onClick={()=>setSelected(null)} style={{background:"rgba(255,255,255,0.06)",border:"1px solid "+T.border,borderRadius:7,color:"#94A3B8",width:28,height:28,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0,marginLeft:8}}>x</button>
            </div>
            <div style={{display:"flex",gap:6,marginTop:8,flexWrap:"wrap"}}>
              <Chip label={LC_LABEL(selected.lifecycle)} color={LC_COLOR(selected.lifecycle)}/>
              {selected.handoverQuarter&&<Chip label={selected.handoverQuarter} color={T.gold}/>}
              {selected.community&&<Chip label={selected.community} color="#64748B"/>}
            </div>
            {selected.constructionPct>0&&(
              <div style={{marginTop:10}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                  <span style={{fontSize:9,color:"#64748B",textTransform:"uppercase",letterSpacing:0.5}}>Construction</span>
                  <span style={{fontSize:10,fontWeight:700,color:LC_COLOR(selected.lifecycle)}}>{selected.constructionPct}%</span>
                </div>
                <div style={{height:6,background:"rgba(255,255,255,0.06)",borderRadius:3,overflow:"hidden"}}>
                  <div style={{height:"100%",width:selected.constructionPct+"%",background:LC_COLOR(selected.lifecycle),borderRadius:3}}/>
                </div>
              </div>
            )}
          </div>

          <div style={{display:"flex",borderBottom:"1px solid "+T.border,overflowX:"auto"}}>
            {DRAWER_TABS.map(t=>(
              <button key={t.key} type="button" onClick={()=>setDrawerTab(t.key)}
                style={{padding:"9px 12px",background:"none",border:"none",borderBottom:drawerTab===t.key?"2px solid "+T.gold:"2px solid transparent",color:drawerTab===t.key?T.gold:"#64748B",fontSize:10,fontWeight:drawerTab===t.key?700:400,cursor:"pointer",whiteSpace:"nowrap",fontFamily:"'Outfit',sans-serif"}}>
                {t.label}
              </button>
            ))}
          </div>

          <div style={{flex:1,overflowY:"auto",padding:"14px"}}>
            {drawerTab==="overview"&&(
              <div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
                  {[
                    {label:"Handover",   value:selected.handoverQuarter||"TBD",   color:T.gold},
                    {label:"Units",      value:selected.totalUnits?.toLocaleString()||"--", color:T.white},
                    {label:"Villas",     value:selected.villas||"--",             color:"#94A3B8"},
                    {label:"Progress",   value:(selected.constructionPct||0)+"%", color:LC_COLOR(selected.lifecycle)},
                    {label:"Escrow",     value:(selected.escrowBank||"--").replace(" (PJSC)","").replace(" Bank","").substring(0,20), color:"#94A3B8"},
                    {label:"DLD Proj #", value:selected.projectNumber||"--",      color:"#64748B"},
                  ].map((m,i)=>(
                    <div key={i} style={{background:"rgba(255,255,255,0.03)",borderRadius:8,padding:"9px 11px"}}>
                      <div style={{fontSize:9,color:"#64748B",textTransform:"uppercase",letterSpacing:0.7,marginBottom:2}}>{m.label}</div>
                      <div style={{fontSize:12,fontWeight:600,color:m.color,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{m.value}</div>
                    </div>
                  ))}
                </div>
                {selected.description&&selected.description!=="null"&&(
                  <div style={{padding:"10px",background:"rgba(255,255,255,0.02)",border:"1px solid "+T.border,borderRadius:8,fontSize:11,color:"#94A3B8",lineHeight:1.6}}>
                    {selected.description.substring(0,250)}
                  </div>
                )}
              </div>
            )}

            {drawerTab==="community"&&(()=>{
              const nbhd=getNbhd(selected.community);
              if(!nbhd) return <div style={{textAlign:"center",padding:"30px",color:"#64748B",fontSize:12}}>No data for {selected.community}</div>;
              return (
                <div>
                  <div style={{background:"rgba(212,168,67,0.06)",border:"1px solid rgba(212,168,67,0.2)",borderRadius:10,padding:"12px",marginBottom:12}}>
                    <div style={{fontSize:14,fontWeight:700,color:T.white,fontFamily:"'Fraunces',serif",marginBottom:2}}>{nbhd.community}</div>
                    <div style={{fontSize:10,color:"#94A3B8"}}>Score {nbhd.investmentScore||"--"}/100 · {nbhd.supplyRisk||"--"} Risk</div>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
                    {[
                      {label:"Gross Yield", value:fmtY(nbhd.grossYield),   color:"#10B981"},
                      {label:"Net Yield",   value:fmtY(nbhd.netYield),     color:"#84CC16"},
                      {label:"Avg PPSF",    value:nbhd.avgPpsf?"AED "+Math.round(nbhd.avgPpsf).toLocaleString():"--", color:T.gold},
                      {label:"Supply Risk", value:nbhd.supplyRisk||"--",   color:nbhd.supplyRisk==="Low"?"#10B981":"#F59E0B"},
                      {label:"Metro",       value:nbhd.nearestMetro||"--", color:"#94A3B8"},
                      {label:"DLD Txns",    value:nbhd.dldTransactions?.toLocaleString()||"--", color:"#94A3B8"},
                    ].map((m,i)=>(
                      <div key={i} style={{background:"rgba(255,255,255,0.03)",borderRadius:8,padding:"9px 11px"}}>
                        <div style={{fontSize:9,color:"#64748B",textTransform:"uppercase",letterSpacing:0.7,marginBottom:2}}>{m.label}</div>
                        <div style={{fontSize:12,fontWeight:600,color:m.color,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{m.value}</div>
                      </div>
                    ))}
                  </div>
                  {[
                    {label:"Metro",    value:nbhd.nearestMetro,    dist:nbhd.distMetro},
                    {label:"Mall",     value:nbhd.nearestMall,     dist:nbhd.distMall},
                    {label:"Hospital", value:nbhd.nearestHospital, dist:nbhd.distHospital},
                  ].filter(f=>f.value).map((f,i)=>(
                    <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:"1px solid "+T.border+"20"}}>
                      <span style={{fontSize:10,color:"#64748B",width:60}}>{f.label}</span>
                      <span style={{fontSize:11,color:T.white,flex:1}}>{f.value}</span>
                      <span style={{fontSize:11,fontWeight:600,color:T.gold}}>{fmtD(f.dist)}</span>
                    </div>
                  ))}
                  <button type="button" onClick={()=>handleTabChange&&handleTabChange("Neighbourhoods")}
                    style={{width:"100%",marginTop:10,padding:"9px",borderRadius:8,border:"1px solid "+T.gold,background:"rgba(212,168,67,0.08)",color:T.gold,fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>
                    View Community Profile
                  </button>
                </div>
              );
            })()}

            {drawerTab==="developer"&&(
              <div>
                <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid "+T.border,borderRadius:10,padding:"14px",marginBottom:12}}>
                  <div style={{fontSize:15,fontWeight:700,color:T.white,fontFamily:"'Fraunces',serif",marginBottom:4}}>{selected.developer||"Unknown"}</div>
                  <div style={{fontSize:10,color:"#94A3B8"}}>Developer #{selected.developerNumber||"--"}</div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                  {[
                    {label:"Escrow Bank",  value:(selected.escrowBank||"--").replace(" (PJSC)",""), color:"#94A3B8"},
                    {label:"Source",       value:selected.dldImported?"DLD 2026":"Emaar",           color:T.gold},
                    {label:"Master Proj",  value:selected.masterProject||"--",                      color:"#CBD5E1"},
                    {label:"Project #",    value:selected.projectNumber||"--",                      color:"#64748B"},
                  ].map((m,i)=>(
                    <div key={i} style={{background:"rgba(255,255,255,0.03)",borderRadius:8,padding:"9px 11px"}}>
                      <div style={{fontSize:9,color:"#64748B",textTransform:"uppercase",letterSpacing:0.7,marginBottom:2}}>{m.label}</div>
                      <div style={{fontSize:11,fontWeight:600,color:m.color,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{m.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {drawerTab==="timeline"&&(()=>{
              const pct=selected.constructionPct||0;
              const stages=[
                {label:"Registered",    done:true,    date:selected.launchDate?.substring(0,10)||""},
                {label:"Construction",  done:pct>0,   date:pct>0?pct+"% complete":""},
                {label:"50% Complete",  done:pct>=50, date:""},
                {label:"90% Complete",  done:pct>=90, date:"Near handover"},
                {label:"Handover",      done:pct>=100,date:selected.handoverQuarter||"TBD"},
              ];
              return (
                <div>
                  {stages.map((s,i)=>(
                    <div key={i} style={{display:"flex",gap:12,alignItems:"flex-start",marginBottom:14}}>
                      <div style={{display:"flex",flexDirection:"column",alignItems:"center"}}>
                        <div style={{width:20,height:20,borderRadius:"50%",background:s.done?"#10B981":"rgba(255,255,255,0.06)",border:"2px solid "+(s.done?"#10B981":T.border),display:"flex",alignItems:"center",justifyContent:"center"}}>
                          {s.done&&<div style={{width:8,height:8,borderRadius:"50%",background:"#fff"}}/>}
                        </div>
                        {i<stages.length-1&&<div style={{width:2,height:18,background:s.done?"#10B981":"rgba(255,255,255,0.06)",margin:"2px 0"}}/>}
                      </div>
                      <div style={{paddingTop:1}}>
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
}`;

const clean = tab.replace(/[^\x00-\x7F]/g,"");
fs.writeFileSync("src/tabs/LaunchCalendarTab.jsx", clean, "utf8");
console.log("Done. Lines:", clean.split("\n").length, "Non-ASCII:", (clean.match(/[^\x00-\x7F]/g)||[]).length);