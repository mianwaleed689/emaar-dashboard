const fs = require("fs");

const tab = `/* eslint-disable */
/* DXB ANALYTICS - HANDOVER TAB - Session 16 World Class Rebuild
   1,265 projects with handover dates — construction tracking */

import React, { useState, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { T } from "../data";

const fmtP = n => n ? "AED "+Math.round(n).toLocaleString() : "--";
const fmtY = n => n ? parseFloat(n).toFixed(1)+"%" : "--";

const PCT_COLOR = p => {
  if(p>=90) return "#10B981";
  if(p>=50) return "#D4A843";
  if(p>=20) return "#F59E0B";
  return "#94A3B8";
};

const QUARTER_SORT = q => {
  if(!q) return 9999;
  const [qPart, year] = q.split(" ");
  return parseInt(year)*10 + parseInt(qPart.replace("Q",""));
};

export default function HandoverTab({
  liveProjects=[], liveHandover=[], liveNeighbourhoods=[],
  extraProjects=[], handleTabChange, globalFilters={},
}) {
  const [search,   setSearch]   = useState("");
  const [sortBy,   setSortBy]   = useState("handover");
  const [yearF,    setYearF]    = useState("all");
  const [pctF,     setPctF]     = useState("all");
  const [selected, setSelected] = useState(null);
  const [drawerTab,setDrawerTab]= useState("overview");

  // Merge all projects
  const allProjects = useMemo(()=>[
    ...(liveProjects||[]),
    ...(extraProjects||[]),
    ...(liveHandover||[]),
  ].filter(p=>!p.archived&&p.handoverQuarter),[liveProjects,extraProjects,liveHandover]);

  // Community lookup
  const nbhdMap = useMemo(()=>{
    const m={};
    (liveNeighbourhoods||[]).forEach(n=>{if(n.community)m[n.community.toLowerCase()]=n;});
    return m;
  },[liveNeighbourhoods]);
  const getNbhd = c => nbhdMap[(c||"").toLowerCase()]||null;

  // Filtered
  const filtered = useMemo(()=>{
    let a = [...allProjects];
    if(search.trim()) a = a.filter(p=>
      (p.name||"").toLowerCase().includes(search.toLowerCase())||
      (p.community||"").toLowerCase().includes(search.toLowerCase())||
      (p.developer||"").toLowerCase().includes(search.toLowerCase())
    );
    if(yearF!=="all") a = a.filter(p=>p.handoverQuarter?.includes(yearF));
    if(pctF==="90+")  a = a.filter(p=>(p.constructionPct||0)>=90);
    if(pctF==="50-90")a = a.filter(p=>(p.constructionPct||0)>=50&&(p.constructionPct||0)<90);
    if(pctF==="<50")  a = a.filter(p=>(p.constructionPct||0)<50);
    a.sort((x,y)=>{
      if(sortBy==="handover")    return QUARTER_SORT(x.handoverQuarter)-QUARTER_SORT(y.handoverQuarter);
      if(sortBy==="construction")return (y.constructionPct||0)-(x.constructionPct||0);
      if(sortBy==="units")       return (y.totalUnits||0)-(x.totalUnits||0);
      if(sortBy==="name")        return (x.name||"").localeCompare(y.name||"");
      return 0;
    });
    return a;
  },[allProjects,search,yearF,pctF,sortBy]);

  // Stats
  const totalUnits   = allProjects.reduce((s,p)=>s+(p.totalUnits||0),0);
  const nearComp     = allProjects.filter(p=>(p.constructionPct||0)>=90).length;
  const midConst     = allProjects.filter(p=>(p.constructionPct||0)>=50&&(p.constructionPct||0)<90).length;
  const early        = allProjects.filter(p=>(p.constructionPct||0)<50).length;
  const avgPct       = allProjects.length ? Math.round(allProjects.reduce((s,p)=>s+(p.constructionPct||0),0)/allProjects.length) : 0;

  // Years for filter
  const years = useMemo(()=>{
    const ys = new Set(allProjects.map(p=>p.handoverQuarter?.split(" ")[1]).filter(Boolean));
    return ["all",...[...ys].sort()];
  },[allProjects]);

  // Chart by quarter
  const chartData = useMemo(()=>{
    const qCount={};
    allProjects.forEach(p=>{
      if(p.handoverQuarter) qCount[p.handoverQuarter]=(qCount[p.handoverQuarter]||0)+1;
    });
    return Object.entries(qCount)
      .sort((a,b)=>QUARTER_SORT(a[0])-QUARTER_SORT(b[0]))
      .slice(0,12)
      .map(([q,count])=>({q:q.replace(" 20","'"),count,
        fill:(()=>{const y=parseInt(q.split(" ")[1]);return y<=2025?"#94A3B8":y===2026?"#D4A843":y===2027?"#10B981":"#63B3ED";})()
      }));
  },[allProjects]);

  const selStyle={padding:"6px 10px",background:"rgba(255,255,255,0.04)",border:"1px solid "+T.border,borderRadius:7,color:"#CBD5E1",fontSize:11,outline:"none",fontFamily:"'Outfit',sans-serif"};

  const DRAWER_TABS=[
    {key:"overview",  label:"Overview"},
    {key:"community", label:"Community"},
    {key:"legal",     label:"Buyer Rights"},
    {key:"developer", label:"Developer"},
  ];

  return (
    <div style={{display:"flex",gap:16,height:"calc(100vh - 140px)",paddingBottom:20}}>

      {/* LEFT */}
      <div style={{flex:1,display:"flex",flexDirection:"column",minWidth:0}}>

        {/* Header */}
        <div style={{marginBottom:12}}>
          <h2 style={{margin:0,fontSize:20,fontWeight:900,color:T.white,fontFamily:"'Fraunces',serif"}}>Handover Tracker</h2>
          <p style={{margin:"4px 0 0",fontSize:12,color:"#94A3B8"}}>
            {allProjects.length.toLocaleString()} projects with handover dates · {totalUnits.toLocaleString()} total units · Avg construction: {avgPct}%
          </p>
        </div>

        {/* KPIs */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:12}}>
          {[
            {label:"Near Completion 90%+", value:nearComp,   color:"#10B981"},
            {label:"Under Construction",   value:midConst,   color:"#D4A843"},
            {label:"Early Stage",          value:early,      color:"#94A3B8"},
            {label:"Avg Progress",         value:avgPct+"%", color:"#63B3ED"},
          ].map((k,i)=>(
            <div key={i} style={{background:"rgba(255,255,255,0.02)",border:"1px solid "+T.border,borderRadius:10,padding:"10px 14px",position:"relative",overflow:"hidden"}}>
              <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:k.color}}/>
              <div style={{fontSize:9,fontWeight:700,color:"#64748B",textTransform:"uppercase",letterSpacing:0.8,marginBottom:3}}>{k.label}</div>
              <div style={{fontSize:18,fontWeight:900,color:k.color,fontFamily:"'Fraunces',serif"}}>{k.value}</div>
            </div>
          ))}
        </div>

        {/* Chart */}
        {chartData.length>0&&(
          <div style={{background:"rgba(255,255,255,0.02)",border:"1px solid "+T.border,borderRadius:10,padding:"12px",marginBottom:12}}>
            <div style={{fontSize:11,fontWeight:700,color:T.white,marginBottom:8}}>Handover Schedule by Quarter</div>
            <ResponsiveContainer width="100%" height={100}>
              <BarChart data={chartData} margin={{top:0,right:0,left:-30,bottom:0}}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} vertical={false}/>
                <XAxis dataKey="q" tick={{fontSize:8,fill:"#64748B"}}/>
                <YAxis tick={{fontSize:8,fill:"#64748B"}}/>
                <Tooltip contentStyle={{background:T.surface,border:"1px solid "+T.border,borderRadius:6,fontSize:10}} formatter={v=>[v+" projects","Handovers"]}/>
                <Bar dataKey="count" radius={[2,2,0,0]}>
                  {chartData.map((d,i)=>(
                    <cell key={i} fill={d.fill}/>
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Filters */}
        <div style={{display:"flex",gap:6,marginBottom:8,flexWrap:"wrap",alignItems:"center"}}>
          <div style={{flex:"1 1 180px",display:"flex",alignItems:"center",gap:8,padding:"6px 10px",background:"rgba(255,255,255,0.03)",border:"1px solid "+(search?T.gold:T.border),borderRadius:7}}>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search project, developer, community..." style={{flex:1,background:"none",border:"none",outline:"none",color:T.white,fontSize:11,fontFamily:"'Outfit',sans-serif"}}/>
            {search&&<button type="button" onClick={()=>setSearch("")} style={{background:"none",border:"none",color:"#94A3B8",cursor:"pointer",fontSize:12}}>x</button>}
          </div>
          <select value={yearF} onChange={e=>setYearF(e.target.value)} style={selStyle}>
            {years.map(y=><option key={y} value={y}>{y==="all"?"All Years":y}</option>)}
          </select>
          <select value={pctF} onChange={e=>setPctF(e.target.value)} style={selStyle}>
            <option value="all">All Progress</option>
            <option value="90+">90%+ Near Completion</option>
            <option value="50-90">50-90% Under Construction</option>
            <option value="<50">Below 50%</option>
          </select>
          <select value={sortBy} onChange={e=>setSortBy(e.target.value)} style={selStyle}>
            <option value="handover">Earliest Handover</option>
            <option value="construction">Most Built</option>
            <option value="units">Most Units</option>
            <option value="name">A - Z</option>
          </select>
          <span style={{fontSize:11,color:"#94A3B8",marginLeft:"auto"}}>{filtered.length} projects</span>
        </div>

        {/* Project List */}
        <div style={{flex:1,overflowY:"auto",display:"flex",flexDirection:"column",gap:6}}>
          {filtered.slice(0,100).map((p,i)=>{
            const pct = p.constructionPct||0;
            const pColor = PCT_COLOR(pct);
            const nbhd = getNbhd(p.community);
            const isSelected = selected?.id===p.id||selected?.name===p.name;
            return (
              <div key={p.id||p.name||i} onClick={()=>{setSelected(isSelected?null:p);setDrawerTab("overview");}}
                style={{background:isSelected?"rgba(212,168,67,0.06)":"rgba(255,255,255,0.02)",border:"1px solid "+(isSelected?"rgba(212,168,67,0.4)":T.border),borderRadius:10,padding:"12px 14px",cursor:"pointer"}}
                onMouseEnter={e=>{if(!isSelected)e.currentTarget.style.borderColor="rgba(212,168,67,0.2)"}}
                onMouseLeave={e=>{if(!isSelected)e.currentTarget.style.borderColor=T.border}}
              >
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:13,fontWeight:700,color:T.white,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.name}</div>
                    <div style={{fontSize:11,color:"#94A3B8",marginTop:2}}>{p.developer} · {p.community}</div>
                  </div>
                  <div style={{display:"flex",gap:6,alignItems:"center",flexShrink:0,marginLeft:8}}>
                    <span style={{fontSize:11,fontWeight:700,color:T.gold}}>{p.handoverQuarter}</span>
                    {p.totalUnits>0&&<span style={{fontSize:10,color:"#94A3B8"}}>{p.totalUnits.toLocaleString()} units</span>}
                  </div>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <div style={{flex:1,height:6,background:"rgba(255,255,255,0.06)",borderRadius:3,overflow:"hidden"}}>
                    <div style={{height:"100%",width:pct+"%",background:pColor,borderRadius:3}}/>
                  </div>
                  <span style={{fontSize:11,fontWeight:700,color:pColor,width:36,textAlign:"right"}}>{pct}%</span>
                  {nbhd&&<span style={{fontSize:10,color:"#10B981"}}>{parseFloat(nbhd.grossYield||0).toFixed(1)}% yield</span>}
                </div>
              </div>
            );
          })}
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

          {/* Header */}
          <div style={{padding:"16px",borderBottom:"1px solid "+T.border}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:15,fontWeight:800,color:T.white,fontFamily:"'Fraunces',serif",marginBottom:3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{selected.name}</div>
                <div style={{fontSize:11,color:"#94A3B8"}}>{selected.community} · {selected.handoverQuarter}</div>
              </div>
              <button type="button" onClick={()=>setSelected(null)} style={{background:"rgba(255,255,255,0.06)",border:"1px solid "+T.border,borderRadius:7,color:"#94A3B8",width:28,height:28,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0,marginLeft:8}}>x</button>
            </div>
            {/* Progress bar */}
            <div style={{marginTop:10}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                <span style={{fontSize:10,color:"#64748B"}}>Construction Progress</span>
                <span style={{fontSize:11,fontWeight:700,color:PCT_COLOR(selected.constructionPct||0)}}>{selected.constructionPct||0}%</span>
              </div>
              <div style={{height:8,background:"rgba(255,255,255,0.06)",borderRadius:4,overflow:"hidden"}}>
                <div style={{height:"100%",width:(selected.constructionPct||0)+"%",background:PCT_COLOR(selected.constructionPct||0),borderRadius:4}}/>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div style={{display:"flex",borderBottom:"1px solid "+T.border}}>
            {DRAWER_TABS.map(t=>(
              <button key={t.key} type="button" onClick={()=>setDrawerTab(t.key)}
                style={{padding:"9px 12px",background:"none",border:"none",borderBottom:drawerTab===t.key?"2px solid "+T.gold:"2px solid transparent",color:drawerTab===t.key?T.gold:"#64748B",fontSize:10,fontWeight:drawerTab===t.key?700:400,cursor:"pointer",whiteSpace:"nowrap",fontFamily:"'Outfit',sans-serif"}}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div style={{flex:1,overflowY:"auto",padding:"14px"}}>

            {drawerTab==="overview"&&(
              <div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
                  {[
                    {label:"Handover",    value:selected.handoverQuarter||"TBD",  color:T.gold},
                    {label:"Units",       value:selected.totalUnits?selected.totalUnits.toLocaleString():"--", color:T.white},
                    {label:"Villas",      value:selected.villas||"--",            color:"#94A3B8"},
                    {label:"Progress",    value:(selected.constructionPct||0)+"%",color:PCT_COLOR(selected.constructionPct||0)},
                    {label:"Escrow Bank", value:selected.escrowBank||"--",        color:"#94A3B8"},
                    {label:"DLD Proj #",  value:selected.projectNumber||"--",     color:"#64748B"},
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
              const nbhd = getNbhd(selected.community);
              if(!nbhd) return <div style={{textAlign:"center",padding:"30px",color:"#64748B",fontSize:12}}>No community data for {selected.community}</div>;
              return (
                <div>
                  <div style={{background:"rgba(212,168,67,0.06)",border:"1px solid rgba(212,168,67,0.2)",borderRadius:10,padding:"12px",marginBottom:12}}>
                    <div style={{fontSize:14,fontWeight:700,color:T.white,fontFamily:"'Fraunces',serif",marginBottom:2}}>{nbhd.community}</div>
                    <div style={{fontSize:10,color:"#94A3B8"}}>Score: {nbhd.investmentScore||"--"}/100 · {nbhd.supplyRisk||"--"} Supply Risk</div>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
                    {[
                      {label:"Gross Yield", value:fmtY(nbhd.grossYield),  color:"#10B981"},
                      {label:"Avg PPSF",    value:nbhd.avgPpsf?"AED "+Math.round(nbhd.avgPpsf).toLocaleString():"--", color:T.gold},
                      {label:"DLD Txns",    value:nbhd.dldTransactions?.toLocaleString()||"--", color:"#94A3B8"},
                      {label:"Liquidity",   value:nbhd.liquidity||"--",   color:"#94A3B8"},
                    ].map((m,i)=>(
                      <div key={i} style={{background:"rgba(255,255,255,0.03)",borderRadius:8,padding:"9px 11px"}}>
                        <div style={{fontSize:9,color:"#64748B",textTransform:"uppercase",letterSpacing:0.7,marginBottom:2}}>{m.label}</div>
                        <div style={{fontSize:12,fontWeight:600,color:m.color}}>{m.value}</div>
                      </div>
                    ))}
                  </div>
                  <button type="button" onClick={()=>handleTabChange&&handleTabChange("Neighbourhoods")}
                    style={{width:"100%",padding:"9px",borderRadius:8,border:"1px solid "+T.gold,background:"rgba(212,168,67,0.08)",color:T.gold,fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>
                    View Community Profile
                  </button>
                </div>
              );
            })()}

            {drawerTab==="legal"&&(
              <div>
                <div style={{fontSize:11,fontWeight:700,color:T.white,marginBottom:10}}>UAE Buyer Protection Laws</div>
                {[
                  {law:"Law 8/2007",  title:"Escrow Protection",    desc:"Developer must hold buyer funds in RERA-approved escrow. Cannot use for other projects."},
                  {law:"Law 13/2008", title:"Interim Property Register", desc:"Off-plan properties registered from contract signing. You have rights from day 1."},
                  {law:"Law 19/2017", title:"Cancelled Projects",   desc:"RERA can cancel stalled projects and refund buyers from escrow."},
                  {law:"Law 25/2025", title:"Handover Guarantee",   desc:"Developer liable for delays. Standard compensation: 7-9% annual on purchase price."},
                ].map((l,i)=>(
                  <div key={i} style={{marginBottom:10,padding:"10px 12px",background:"rgba(255,255,255,0.02)",border:"1px solid "+T.border,borderRadius:8}}>
                    <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:4}}>
                      <span style={{fontSize:9,padding:"1px 6px",borderRadius:4,background:"rgba(212,168,67,0.12)",color:T.gold,fontWeight:700}}>{l.law}</span>
                      <span style={{fontSize:11,fontWeight:600,color:T.white}}>{l.title}</span>
                    </div>
                    <div style={{fontSize:10,color:"#94A3B8",lineHeight:1.6}}>{l.desc}</div>
                  </div>
                ))}
                <div style={{padding:"10px 12px",background:"rgba(16,185,129,0.06)",border:"1px solid rgba(16,185,129,0.2)",borderRadius:8,fontSize:11,color:"#94A3B8",lineHeight:1.6}}>
                  <span style={{color:"#10B981",fontWeight:600}}>If your handover is delayed:</span> Contact developer in writing, file with RERA, claim compensation via Real Estate Tribunal.
                </div>
              </div>
            )}

            {drawerTab==="developer"&&(
              <div>
                <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid "+T.border,borderRadius:10,padding:"14px",marginBottom:12}}>
                  <div style={{fontSize:15,fontWeight:700,color:T.white,fontFamily:"'Fraunces',serif",marginBottom:4}}>{selected.developer||"Unknown Developer"}</div>
                  <div style={{fontSize:10,color:"#94A3B8"}}>Developer #{selected.developerNumber||"--"}</div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                  {[
                    {label:"Escrow Bank",  value:selected.escrowBank||"--",    color:"#94A3B8"},
                    {label:"Source",       value:selected.dldImported?"DLD 2026":"Emaar", color:T.gold},
                    {label:"Master Dev",   value:selected.masterProject||"--", color:"#CBD5E1"},
                    {label:"Project #",    value:selected.projectNumber||"--", color:"#64748B"},
                  ].map((m,i)=>(
                    <div key={i} style={{background:"rgba(255,255,255,0.03)",borderRadius:8,padding:"9px 11px"}}>
                      <div style={{fontSize:9,color:"#64748B",textTransform:"uppercase",letterSpacing:0.7,marginBottom:2}}>{m.label}</div>
                      <div style={{fontSize:11,fontWeight:600,color:m.color,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{m.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}`;

const clean = tab.replace(/[^\x00-\x7F]/g,"");
fs.writeFileSync("src/tabs/HandoverTab.jsx", clean, "utf8");
console.log("Done. Lines:", clean.split("\n").length, "Non-ASCII:", (clean.match(/[^\x00-\x7F]/g)||[]).length);