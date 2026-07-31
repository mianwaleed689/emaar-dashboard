/* eslint-disable */
/* DXB ANALYTICS - YIELDS TAB - Session 15 World Class Rebuild
   Data: 259 communities from neighbourhoodScores collection
   Real verified yields from Bayut/Driven/Knight Frank Q1 2026 */

import React, { useState, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from "recharts";
import { T } from "../data";
import SourceBadge from "../components/SourceBadge";

const fmtY  = n => n ? parseFloat(n).toFixed(1)+"%" : "--";
const fmtP  = n => n ? "AED "+Math.round(n).toLocaleString() : "--";
const fmtD  = n => n ? parseFloat(n).toFixed(1)+" km" : "--";

const YIELD_COLOR = y => parseFloat(y||0)>=8?"#10B981":parseFloat(y||0)>=6?"#84CC16":parseFloat(y||0)>=5?"#D4A843":"#94A3B8";

export default function YieldsTab({ liveNeighbourhoods=[], handleTabChange, globalFilters={} }) {
  const [search,      setSearch]      = useState("");
  const [sortBy,      setSortBy]      = useState("gross");
  const [typeFilter,  setTypeFilter]  = useState("all");
  const [yieldFilter, setYieldFilter] = useState("all");
  const [metroOnly,   setMetroOnly]   = useState(false);
  const [gvOnly,      setGvOnly]      = useState(false);
  const [selected,    setSelected]    = useState(null);

  // Filter communities with yield data
  const withYield = useMemo(() => 
    (liveNeighbourhoods||[]).filter(n => parseFloat(n.grossYield||0) > 0)
  , [liveNeighbourhoods]);

  const filtered = useMemo(() => {
    let a = [...withYield];
    if(search.trim()) a = a.filter(n=>(n.community||"").toLowerCase().includes(search.toLowerCase()));
    if(yieldFilter==="8+") a = a.filter(n=>parseFloat(n.grossYield||0)>=8);
    if(yieldFilter==="7+") a = a.filter(n=>parseFloat(n.grossYield||0)>=7);
    if(yieldFilter==="6+") a = a.filter(n=>parseFloat(n.grossYield||0)>=6);
    if(yieldFilter==="<5") a = a.filter(n=>parseFloat(n.grossYield||0)<5);
    if(metroOnly) a = a.filter(n=>n.hasMetro||parseFloat(n.distMetro||99)<=1.5);
    if(gvOnly)    a = a.filter(n=>n.goldenVisa);
    a.sort((x,y)=>{
      if(sortBy==="gross")    return parseFloat(y.grossYield||0)-parseFloat(x.grossYield||0);
      if(sortBy==="net")      return parseFloat(y.netYield||0)-parseFloat(x.netYield||0);
      if(sortBy==="score")    return (y.investmentScore||0)-(x.investmentScore||0);
      if(sortBy==="ppsf_asc") return (x.avgPpsf||0)-(y.avgPpsf||0);
      if(sortBy==="liquidity")return (y.dldTransactions||0)-(x.dldTransactions||0);
      if(sortBy==="name")     return (x.community||"").localeCompare(y.community||"");
      return 0;
    });
    return a;
  }, [withYield,search,sortBy,yieldFilter,metroOnly,gvOnly]);

  // Stats
  const avgGross = withYield.length ? (withYield.reduce((s,n)=>s+parseFloat(n.grossYield||0),0)/withYield.length).toFixed(1) : 0;
  const avgNet   = withYield.length ? (withYield.reduce((s,n)=>s+parseFloat(n.netYield||0),0)/withYield.length).toFixed(1) : 0;
  const topYield = [...withYield].sort((a,b)=>parseFloat(b.grossYield||0)-parseFloat(a.grossYield||0))[0];
  const high8    = withYield.filter(n=>parseFloat(n.grossYield||0)>=8).length;
  const high7    = withYield.filter(n=>parseFloat(n.grossYield||0)>=7).length;

  // Chart data  top 15
  const chartData = filtered.slice(0,15).map(n=>({
    name: (n.community||"").length>12?(n.community||"").substring(0,12)+"...":n.community,
    gross: parseFloat(n.grossYield||0),
    net:   parseFloat(n.netYield||0),
    fill:  YIELD_COLOR(n.grossYield),
  }));

  const selStyle = {padding:"6px 10px",background:"rgba(255,255,255,0.04)",border:"1px solid "+T.border,borderRadius:7,color:"#CBD5E1",fontSize:11,outline:"none",fontFamily:"'Outfit',sans-serif"};
  const Pill = ({active,onClick,label}) => (
    <button type="button" onClick={onClick} style={{padding:"5px 10px",borderRadius:7,border:"1px solid "+(active?T.gold:T.border),background:active?"rgba(212,168,67,0.1)":"rgba(255,255,255,0.03)",color:active?T.gold:"#94A3B8",fontSize:11,fontWeight:active?600:400,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>
      {label}
    </button>
  );

  return (
    <div style={{paddingBottom:60}}>

      {/* HEADER */}
      <div style={{marginBottom:16}}>
        <h2 style={{margin:0,fontSize:20,fontWeight:900,color:T.white,fontFamily:"'Fraunces',serif"}}>Rental Yields</h2>
        <p style={{margin:"4px 0 0",fontSize:12,color:"#94A3B8"}}>
          {withYield.length} communities tracked  Dubai average {avgGross}% gross  Sources: Bayut 2025, Driven Properties, Knight Frank Q1 2026
        </p>
      </div>

      {/* KPI CARDS */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:16}}>
        {[
          {label:"Dubai Avg Gross",  value:avgGross+"%",            color:"#10B981", hint:"All communities"},
          {label:"Dubai Avg Net",    value:avgNet+"%",              color:"#84CC16", hint:"After service charges"},
          {label:"8%+ High Yield",   value:high8+" communities",    color:T.gold,    hint:"Top performers"},
          {label:"Best Yield",       value:topYield?fmtY(topYield.grossYield):"--", color:"#10B981", hint:topYield?.community||""},
        ].map((k,i)=>(
          <div key={i} style={{background:"rgba(255,255,255,0.02)",border:"1px solid "+T.border,borderRadius:12,padding:"14px 16px",position:"relative",overflow:"hidden"}}>
            <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:k.color,opacity:0.8}}/>
            <div style={{fontSize:9,fontWeight:700,color:"#64748B",textTransform:"uppercase",letterSpacing:0.8,marginBottom:4}}>{k.label}</div>
            <div style={{fontSize:18,fontWeight:900,color:k.color,fontFamily:"'Fraunces',serif",marginBottom:2}}>{k.value}</div>
            <div style={{fontSize:10,color:"#64748B"}}>{k.hint}</div>
          </div>
        ))}
      </div>

      {/* CHART */}
      {chartData.length>0&&(
        <div style={{background:"rgba(255,255,255,0.02)",border:"1px solid "+T.border,borderRadius:12,padding:"16px",marginBottom:16}}>
          <div style={{fontSize:12,fontWeight:700,color:T.white,marginBottom:12}}>Top 15 Communities by Yield</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} margin={{top:5,right:10,left:-20,bottom:40}}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} vertical={false}/>
              <XAxis dataKey="name" tick={{fontSize:8,fill:"#64748B"}} angle={-35} textAnchor="end"/>
              <YAxis tick={{fontSize:9,fill:"#64748B"}} domain={[0,12]}/>
              <Tooltip contentStyle={{background:T.surface,border:"1px solid "+T.border,borderRadius:8,fontSize:11}} formatter={(v,n)=>[v+"%",n==="gross"?"Gross Yield":"Net Yield"]}/>
              <ReferenceLine y={parseFloat(avgGross)} stroke="#D4A843" strokeDasharray="4 4" label={{value:"Dubai Avg",fill:"#D4A843",fontSize:9}}/>
              <Bar dataKey="gross" name="Gross Yield" radius={[3,3,0,0]} fill="#10B981">
                {chartData.map((d,i)=>(
                  <Cell key={i} fill={d.fill}/>
                ))}
              </Bar>
              <Bar dataKey="net" name="Net Yield" radius={[3,3,0,0]} fill="#84CC16" opacity={0.6}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* TOOLBAR */}
      <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:10,flexWrap:"wrap"}}>
        <div style={{flex:"1 1 200px",display:"flex",alignItems:"center",gap:8,padding:"7px 12px",background:"rgba(255,255,255,0.03)",border:"1px solid "+(search?T.gold:T.border),borderRadius:8}}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search community..." style={{flex:1,background:"none",border:"none",outline:"none",color:T.white,fontSize:12,fontFamily:"'Outfit',sans-serif"}}/>
          {search&&<button type="button" onClick={()=>setSearch("")} style={{background:"none",border:"none",color:"#94A3B8",cursor:"pointer",fontSize:14}}>x</button>}
        </div>
        <select value={yieldFilter} onChange={e=>setYieldFilter(e.target.value)} style={selStyle}>
          <option value="all">All Yields</option>
          <option value="8+">8%+ High Yield</option>
          <option value="7+">7%+ Good Yield</option>
          <option value="6+">6%+ Mid Yield</option>
          <option value="<5">Below 5%</option>
        </select>
        <select value={sortBy} onChange={e=>setSortBy(e.target.value)} style={selStyle}>
          <option value="gross">Highest Gross Yield</option>
          <option value="net">Highest Net Yield</option>
          <option value="score">Best Score</option>
          <option value="ppsf_asc">Most Affordable</option>
          <option value="liquidity">Most Liquid</option>
          <option value="name">A - Z</option>
        </select>
      </div>

      {/* FILTER PILLS */}
      <div style={{display:"flex",gap:6,marginBottom:14,flexWrap:"wrap",alignItems:"center"}}>
        <Pill active={metroOnly} onClick={()=>setMetroOnly(v=>!v)} label="Metro Access"/>
        <Pill active={gvOnly}    onClick={()=>setGvOnly(v=>!v)}    label="Golden Visa"/>
        {(metroOnly||gvOnly||yieldFilter!=="all"||search)&&(
          <button type="button" onClick={()=>{setMetroOnly(false);setGvOnly(false);setYieldFilter("all");setSearch("");}} style={{fontSize:10,padding:"4px 10px",borderRadius:8,border:"1px solid rgba(239,68,68,0.3)",background:"rgba(239,68,68,0.08)",color:"#EF4444",cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>Clear</button>
        )}
        <span style={{fontSize:11,color:"#94A3B8",marginLeft:"auto"}}>{filtered.length} communities</span>
      </div>

      {/* YIELD TABLE */}
      <div style={{background:"rgba(255,255,255,0.02)",border:"1px solid "+T.border,borderRadius:14,overflow:"hidden"}}>
        {/* Header */}
        <div style={{display:"grid",gridTemplateColumns:"28px 2fr 80px 80px 90px 100px 90px 80px",padding:"10px 16px",fontSize:9,fontWeight:700,color:"#64748B",textTransform:"uppercase",letterSpacing:0.8,borderBottom:"1px solid "+T.border,background:"rgba(255,255,255,0.02)"}}>
          {["#","Community","Gross","Net","PPSF","Transactions","Score","Metro"].map((h,i)=>(
            <div key={i} style={{textAlign:i>1?"center":"left"}}>{h}</div>
          ))}
        </div>

        {/* Rows */}
        {filtered.slice(0,100).map((n,i)=>(
          <div key={n.community||i}
            onClick={()=>setSelected(selected?.community===n.community?null:n)}
            style={{display:"grid",gridTemplateColumns:"28px 2fr 80px 80px 90px 100px 90px 80px",padding:"11px 16px",alignItems:"center",borderBottom:i<filtered.length-1?"1px solid "+T.border+"30":"none",cursor:"pointer",background:selected?.community===n.community?"rgba(212,168,67,0.04)":"transparent"}}
            onMouseEnter={e=>e.currentTarget.style.background="rgba(212,168,67,0.03)"}
            onMouseLeave={e=>e.currentTarget.style.background=selected?.community===n.community?"rgba(212,168,67,0.04)":"transparent"}
          >
            {/* Rank */}
            <div style={{fontSize:10,color:"#64748B",fontWeight:600}}>{i+1}</div>
            {/* Community */}
            <div>
              <div style={{fontSize:12,fontWeight:600,color:T.white}}>{n.community}</div>
              <div style={{display:"flex",gap:4,marginTop:2,flexWrap:"wrap"}}>
                <span style={{fontSize:9,padding:"1px 5px",borderRadius:4,background:n.tier==="verified"?"rgba(16,185,129,0.12)":"rgba(100,116,139,0.12)",color:n.tier==="verified"?"#10B981":"#64748B",fontWeight:600}}>
                  {n.tier==="verified"?"Verified":n.tier==="area-data"?"Area Data":"DLD"}
                </span>
                {n.goldenVisa&&<span style={{fontSize:9,padding:"1px 5px",borderRadius:4,background:"rgba(212,168,67,0.12)",color:T.gold,fontWeight:600}}>GV</span>}
                {n.hasMetro&&<span style={{fontSize:9,padding:"1px 5px",borderRadius:4,background:"rgba(16,185,129,0.1)",color:"#10B981",fontWeight:600}}>Metro</span>}
              </div>
            </div>
            {/* Gross Yield */}
            <div style={{textAlign:"center"}}>
              <span style={{fontSize:13,fontWeight:700,color:YIELD_COLOR(n.grossYield),fontFamily:"'Fraunces',serif"}}>{fmtY(n.grossYield)}</span>
            </div>
            {/* Net Yield */}
            <div style={{textAlign:"center",fontSize:12,fontWeight:600,color:"#CBD5E1"}}>{fmtY(n.netYield)}</div>
            {/* PPSF */}
            <div style={{textAlign:"center",fontSize:11,color:T.gold}}>{n.avgPpsf?"AED "+Math.round(n.avgPpsf).toLocaleString():"--"}</div>
            {/* DLD Transactions */}
            <div style={{textAlign:"center"}}>
              {n.dldTransactions?(
                <div>
                  <div style={{fontSize:11,fontWeight:600,color:"#94A3B8"}}>{n.dldTransactions.toLocaleString()}</div>
                  <div style={{fontSize:9,color:n.liquidity==="Very High"||n.liquidity==="High"?"#10B981":"#64748B"}}>{n.liquidity||""}</div>
                </div>
              ):<span style={{fontSize:10,color:"#64748B"}}>--</span>}
            </div>
            {/* Score */}
            <div style={{textAlign:"center"}}>
              <div style={{width:32,height:32,borderRadius:"50%",background:"rgba(212,168,67,0.1)",border:"1px solid rgba(212,168,67,0.3)",display:"inline-flex",alignItems:"center",justifyContent:"center"}}>
                <span style={{fontSize:10,fontWeight:700,color:T.gold}}>{n.investmentScore||"--"}</span>
              </div>
            </div>
            {/* Metro */}
            <div style={{textAlign:"center",fontSize:10,color:"#94A3B8"}}>{n.distMetro?parseFloat(n.distMetro).toFixed(1)+"km":"--"}</div>
          </div>
        ))}
      </div>

      {/* SELECTED COMMUNITY DETAIL */}
      {selected&&(
        <div style={{marginTop:12,background:"rgba(212,168,67,0.04)",border:"1px solid rgba(212,168,67,0.2)",borderRadius:14,padding:"20px"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
            <div>
              <div style={{fontSize:18,fontWeight:700,color:T.white,fontFamily:"'Fraunces',serif",marginBottom:4}}>{selected.community}</div>
              <div style={{fontSize:11,color:"#94A3B8"}}>{selected.nearestMetro||"Dubai"}  {selected.supplyRisk||"Unknown"} Supply Risk</div>
            </div>
            <div style={{display:"flex",gap:8,alignItems:"center"}}>
              <button type="button" onClick={()=>handleTabChange&&handleTabChange("Neighbourhoods")} style={{padding:"8px 14px",borderRadius:8,border:"1px solid "+T.gold,background:"rgba(212,168,67,0.08)",color:T.gold,fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>View Community</button>
              <button type="button" onClick={()=>setSelected(null)} style={{background:"rgba(255,255,255,0.06)",border:"1px solid "+T.border,borderRadius:8,color:"#94A3B8",width:32,height:32,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>x</button>
            </div>
          </div>
          {/* Where these figures came from — estimates must not read as measured data. */}
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10,flexWrap:"wrap"}}>
            <SourceBadge row={selected}/>
            {selected.netYield!=null&&(
              <span style={{fontSize:9,color:"#64748B",fontFamily:"'Outfit',sans-serif"}}>
                net = gross less service charge, 5% vacancy, 5% management
              </span>
            )}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:14}}>
            {[
              {label:"Gross Yield",    value:fmtY(selected.grossYield),    color:YIELD_COLOR(selected.grossYield)},
              {label:"Net Yield",      value:selected.netYield!=null?fmtY(selected.netYield):"—",      color:"#CBD5E1"},
              {label:"Avg PPSF",       value:fmtP(selected.avgPpsf),       color:T.gold},
              {label:"Service Charge", value:selected.serviceCharge?"AED "+selected.serviceCharge+"/sqft":"--", color:"#94A3B8"},
              {label:"DLD Txns",       value:selected.dldTransactions?selected.dldTransactions.toLocaleString():"--", color:"#94A3B8"},
              {label:"Liquidity",      value:selected.liquidity||"--",     color:selected.liquidity==="Very High"||selected.liquidity==="High"?"#10B981":"#F59E0B"},
              {label:"Inv Score",      value:selected.investmentScore||"--", color:T.gold},
              {label:"Supply Risk",    value:selected.supplyRisk||"--",    color:selected.supplyRisk==="Low"?"#10B981":"#F59E0B"},
            ].map((m,i)=>(
              <div key={i} style={{background:"rgba(255,255,255,0.03)",borderRadius:8,padding:"10px 12px"}}>
                <div style={{fontSize:9,color:"#64748B",textTransform:"uppercase",letterSpacing:0.7,marginBottom:3}}>{m.label}</div>
                <div style={{fontSize:14,fontWeight:700,color:m.color,fontFamily:"'Fraunces',serif"}}>{m.value}</div>
              </div>
            ))}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
            {[
              {label:"Metro",    value:selected.nearestMetro,    dist:selected.distMetro},
              {label:"Mall",     value:selected.nearestMall,     dist:selected.distMall},
              {label:"Hospital", value:selected.nearestHospital, dist:selected.distHospital},
            ].map((f,i)=>(
              <div key={i} style={{background:"rgba(255,255,255,0.03)",borderRadius:8,padding:"8px 10px"}}>
                <div style={{fontSize:9,color:"#64748B",textTransform:"uppercase",letterSpacing:0.7,marginBottom:2}}>{f.label}</div>
                <div style={{fontSize:11,fontWeight:600,color:T.white,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{f.value||"--"}</div>
                <div style={{fontSize:10,color:"#94A3B8"}}>{f.dist?parseFloat(f.dist).toFixed(1)+" km":"--"}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* EMPTY STATE */}
      {liveNeighbourhoods.length===0&&(
        <div style={{padding:"60px 20px",textAlign:"center"}}>
          <div style={{fontSize:32,marginBottom:12}}>?</div>
          <div style={{fontSize:16,fontWeight:700,color:T.white,marginBottom:6}}>Loading yield data...</div>
          <div style={{fontSize:12,color:"#94A3B8"}}>Connecting to 259 community database</div>
        </div>
      )}

      {/* SOURCES */}
      <div style={{marginTop:16,paddingTop:12,borderTop:"1px solid "+T.border,display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}}>
        <span style={{fontSize:10,color:"#64748B"}}>Sources:</span>
        {["Bayut H1 2025","Driven Properties Q1 2026","Knight Frank Q1 2025","Dubai Land Department","GuestReady STR Data"].map((s,i)=>(
          <span key={i} style={{fontSize:10,color:"#64748B",padding:"2px 8px",borderRadius:8,border:"1px solid rgba(255,255,255,0.06)"}}>{s}</span>
        ))}
      </div>

    </div>
  );
}