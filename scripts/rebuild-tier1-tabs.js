const fs = require("fs");

// ══════════════════════════════════════════════════════
// 1. INVESTMENT SCORE TAB
// ══════════════════════════════════════════════════════
const investmentScore = `/* eslint-disable */
/* DXB ANALYTICS - INVESTMENT SCORE TAB - Session 15
   Real scores from neighbourhoodScores — DLD data powered */

import React, { useState, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { T } from "../data";

const fmtY = n => n ? parseFloat(n).toFixed(1)+"%" : "--";
const fmtP = n => n ? "AED "+Math.round(n).toLocaleString() : "--";

const scoreColor = s => s>=80?"#10B981":s>=70?"#84CC16":s>=60?"#D4A843":s>=50?"#F59E0B":"#EF4444";
const scoreLabel = s => s>=80?"Excellent":s>=70?"Good":s>=60?"Average":s>=50?"Below Avg":"Poor";

export default function InvestmentScoreTab({ liveNeighbourhoods=[], handleTabChange, globalFilters={} }) {
  const [search,   setSearch]   = useState("");
  const [sortBy,   setSortBy]   = useState("score");
  const [minScore, setMinScore] = useState("all");
  const [gvOnly,   setGvOnly]   = useState(false);
  const [selected, setSelected] = useState(null);

  const withScore = useMemo(() =>
    liveNeighbourhoods.filter(n => n.investmentScore > 0)
  , [liveNeighbourhoods]);

  const filtered = useMemo(() => {
    let a = [...withScore];
    if(search.trim()) a = a.filter(n=>(n.community||"").toLowerCase().includes(search.toLowerCase()));
    if(minScore==="80") a = a.filter(n=>n.investmentScore>=80);
    if(minScore==="70") a = a.filter(n=>n.investmentScore>=70);
    if(minScore==="60") a = a.filter(n=>n.investmentScore>=60);
    if(gvOnly) a = a.filter(n=>n.goldenVisa);
    a.sort((x,y)=>{
      if(sortBy==="score")  return (y.investmentScore||0)-(x.investmentScore||0);
      if(sortBy==="yield")  return parseFloat(y.grossYield||0)-parseFloat(x.grossYield||0);
      if(sortBy==="liquid") return (y.dldTransactions||0)-(x.dldTransactions||0);
      if(sortBy==="name")   return (x.community||"").localeCompare(y.community||"");
      return 0;
    });
    return a;
  }, [withScore,search,sortBy,minScore,gvOnly]);

  const avgScore  = withScore.length ? Math.round(withScore.reduce((s,n)=>s+(n.investmentScore||0),0)/withScore.length) : 0;
  const excellent = withScore.filter(n=>n.investmentScore>=80).length;
  const good      = withScore.filter(n=>n.investmentScore>=70&&n.investmentScore<80).length;
  const topComm   = [...withScore].sort((a,b)=>(b.investmentScore||0)-(a.investmentScore||0))[0];

  const chartData = filtered.slice(0,12).map(n=>({
    name: (n.community||"").length>10?(n.community||"").substring(0,10)+"...":n.community,
    score: n.investmentScore||0,
    fill: scoreColor(n.investmentScore||0),
  }));

  const selStyle = {padding:"6px 10px",background:"rgba(255,255,255,0.04)",border:"1px solid "+T.border,borderRadius:7,color:"#CBD5E1",fontSize:11,outline:"none",fontFamily:"'Outfit',sans-serif"};

  return (
    <div style={{paddingBottom:60}}>
      <div style={{marginBottom:16}}>
        <h2 style={{margin:0,fontSize:20,fontWeight:900,color:T.white,fontFamily:"'Fraunces',serif"}}>Investment Score</h2>
        <p style={{margin:"4px 0 0",fontSize:12,color:"#94A3B8"}}>
          {withScore.length} communities scored · DLD data powered · 5 factors: Yield + Liquidity + Value + Risk + Location
        </p>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:16}}>
        {[
          {label:"Avg Score",      value:avgScore+"/100",    color:scoreColor(avgScore)},
          {label:"Excellent 80+",  value:excellent+" areas", color:"#10B981"},
          {label:"Good 70+",       value:good+" areas",      color:"#84CC16"},
          {label:"Top Community",  value:topComm?.community||"--", color:T.gold},
        ].map((k,i)=>(
          <div key={i} style={{background:"rgba(255,255,255,0.02)",border:"1px solid "+T.border,borderRadius:12,padding:"14px 16px",position:"relative",overflow:"hidden"}}>
            <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:k.color}}/>
            <div style={{fontSize:9,fontWeight:700,color:"#64748B",textTransform:"uppercase",letterSpacing:0.8,marginBottom:4}}>{k.label}</div>
            <div style={{fontSize:16,fontWeight:900,color:k.color,fontFamily:"'Fraunces',serif"}}>{k.value}</div>
          </div>
        ))}
      </div>

      {chartData.length>0&&(
        <div style={{background:"rgba(255,255,255,0.02)",border:"1px solid "+T.border,borderRadius:12,padding:"16px",marginBottom:16}}>
          <div style={{fontSize:12,fontWeight:700,color:T.white,marginBottom:12}}>Top 12 Investment Score Rankings</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chartData} margin={{top:5,right:10,left:-20,bottom:35}}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} vertical={false}/>
              <XAxis dataKey="name" tick={{fontSize:8,fill:"#64748B"}} angle={-35} textAnchor="end"/>
              <YAxis tick={{fontSize:9,fill:"#64748B"}} domain={[0,100]}/>
              <Tooltip contentStyle={{background:T.surface,border:"1px solid "+T.border,borderRadius:8,fontSize:11}} formatter={v=>[v+"/100","Score"]}/>
              <Bar dataKey="score" radius={[3,3,0,0]}>
                {chartData.map((d,i)=>(
                  <cell key={i} fill={d.fill}/>
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:10,flexWrap:"wrap"}}>
        <div style={{flex:"1 1 200px",display:"flex",alignItems:"center",gap:8,padding:"7px 12px",background:"rgba(255,255,255,0.03)",border:"1px solid "+(search?T.gold:T.border),borderRadius:8}}>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search community..." style={{flex:1,background:"none",border:"none",outline:"none",color:T.white,fontSize:12,fontFamily:"'Outfit',sans-serif"}}/>
          {search&&<button type="button" onClick={()=>setSearch("")} style={{background:"none",border:"none",color:"#94A3B8",cursor:"pointer",fontSize:14}}>x</button>}
        </div>
        <select value={minScore} onChange={e=>setMinScore(e.target.value)} style={selStyle}>
          <option value="all">All Scores</option>
          <option value="80">80+ Excellent</option>
          <option value="70">70+ Good</option>
          <option value="60">60+ Average</option>
        </select>
        <select value={sortBy} onChange={e=>setSortBy(e.target.value)} style={selStyle}>
          <option value="score">Highest Score</option>
          <option value="yield">Highest Yield</option>
          <option value="liquid">Most Liquid</option>
          <option value="name">A - Z</option>
        </select>
        <button type="button" onClick={()=>setGvOnly(v=>!v)} style={{padding:"6px 12px",borderRadius:7,border:"1px solid "+(gvOnly?T.gold:T.border),background:gvOnly?"rgba(212,168,67,0.1)":"rgba(255,255,255,0.03)",color:gvOnly?T.gold:"#94A3B8",fontSize:11,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>Golden Visa</button>
        <span style={{fontSize:11,color:"#94A3B8",marginLeft:"auto"}}>{filtered.length} communities</span>
      </div>

      <div style={{background:"rgba(255,255,255,0.02)",border:"1px solid "+T.border,borderRadius:14,overflow:"hidden"}}>
        <div style={{display:"grid",gridTemplateColumns:"28px 2fr 70px 80px 80px 90px 80px",padding:"10px 16px",fontSize:9,fontWeight:700,color:"#64748B",textTransform:"uppercase",letterSpacing:0.8,borderBottom:"1px solid "+T.border,background:"rgba(255,255,255,0.02)"}}>
          {["#","Community","Score","Grade","Yield","Transactions","PPSF"].map((h,i)=>(
            <div key={i} style={{textAlign:i>1?"center":"left"}}>{h}</div>
          ))}
        </div>
        {filtered.slice(0,100).map((n,i)=>(
          <div key={n.community||i} onClick={()=>setSelected(selected?.community===n.community?null:n)}
            style={{display:"grid",gridTemplateColumns:"28px 2fr 70px 80px 80px 90px 80px",padding:"11px 16px",alignItems:"center",borderBottom:i<filtered.length-1?"1px solid "+T.border+"30":"none",cursor:"pointer",background:selected?.community===n.community?"rgba(212,168,67,0.04)":"transparent"}}
            onMouseEnter={e=>e.currentTarget.style.background="rgba(212,168,67,0.03)"}
            onMouseLeave={e=>e.currentTarget.style.background=selected?.community===n.community?"rgba(212,168,67,0.04)":"transparent"}
          >
            <div style={{fontSize:10,color:"#64748B",fontWeight:600}}>{i+1}</div>
            <div>
              <div style={{fontSize:12,fontWeight:600,color:T.white}}>{n.community}</div>
              <div style={{display:"flex",gap:4,marginTop:2}}>
                {n.tier==="verified"&&<span style={{fontSize:9,padding:"1px 5px",borderRadius:4,background:"rgba(16,185,129,0.12)",color:"#10B981",fontWeight:600}}>Verified</span>}
                {n.goldenVisa&&<span style={{fontSize:9,padding:"1px 5px",borderRadius:4,background:"rgba(212,168,67,0.12)",color:T.gold,fontWeight:600}}>GV</span>}
                {n.hasMetro&&<span style={{fontSize:9,padding:"1px 5px",borderRadius:4,background:"rgba(16,185,129,0.1)",color:"#10B981",fontWeight:600}}>Metro</span>}
              </div>
            </div>
            <div style={{textAlign:"center"}}>
              <div style={{width:36,height:36,borderRadius:"50%",background:scoreColor(n.investmentScore)+"18",border:"2px solid "+scoreColor(n.investmentScore),display:"inline-flex",alignItems:"center",justifyContent:"center"}}>
                <span style={{fontSize:11,fontWeight:800,color:scoreColor(n.investmentScore),fontFamily:"'Fraunces',serif"}}>{n.investmentScore}</span>
              </div>
            </div>
            <div style={{textAlign:"center",fontSize:10,fontWeight:600,color:scoreColor(n.investmentScore)}}>{scoreLabel(n.investmentScore)}</div>
            <div style={{textAlign:"center",fontSize:12,fontWeight:700,color:parseFloat(n.grossYield||0)>=7?"#10B981":T.gold}}>{fmtY(n.grossYield)}</div>
            <div style={{textAlign:"center",fontSize:11,color:"#94A3B8"}}>{n.dldTransactions?n.dldTransactions.toLocaleString():"--"}</div>
            <div style={{textAlign:"center",fontSize:11,color:T.gold}}>{n.avgPpsf?"AED "+Math.round(n.avgPpsf).toLocaleString():"--"}</div>
          </div>
        ))}
      </div>

      {selected&&(
        <div style={{marginTop:12,background:"rgba(212,168,67,0.04)",border:"1px solid rgba(212,168,67,0.2)",borderRadius:14,padding:"20px"}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:14}}>
            <div>
              <div style={{fontSize:18,fontWeight:700,color:T.white,fontFamily:"'Fraunces',serif"}}>{selected.community}</div>
              <div style={{fontSize:11,color:"#94A3B8",marginTop:2}}>{selected.scoreSource==="dld-real-data-2026"?"Score powered by real DLD data":"Score based on research data"}</div>
            </div>
            <div style={{display:"flex",gap:8,alignItems:"center"}}>
              <button type="button" onClick={()=>handleTabChange&&handleTabChange("Neighbourhoods")} style={{padding:"8px 14px",borderRadius:8,border:"1px solid "+T.gold,background:"rgba(212,168,67,0.08)",color:T.gold,fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>Full Profile</button>
              <button type="button" onClick={()=>setSelected(null)} style={{background:"rgba(255,255,255,0.06)",border:"1px solid "+T.border,borderRadius:8,color:"#94A3B8",width:32,height:32,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>x</button>
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:8}}>
            {[
              {label:"Score",       value:selected.investmentScore+"/100", color:scoreColor(selected.investmentScore)},
              {label:"Gross Yield", value:fmtY(selected.grossYield),       color:"#10B981"},
              {label:"DLD Txns",    value:selected.dldTransactions?selected.dldTransactions.toLocaleString():"--", color:"#94A3B8"},
              {label:"Avg PPSF",    value:fmtP(selected.avgPpsf),          color:T.gold},
              {label:"Supply Risk", value:selected.supplyRisk||"--",       color:selected.supplyRisk==="Low"?"#10B981":"#F59E0B"},
            ].map((m,i)=>(
              <div key={i} style={{background:"rgba(255,255,255,0.03)",borderRadius:8,padding:"10px 12px"}}>
                <div style={{fontSize:9,color:"#64748B",textTransform:"uppercase",letterSpacing:0.7,marginBottom:3}}>{m.label}</div>
                <div style={{fontSize:13,fontWeight:700,color:m.color,fontFamily:"'Fraunces',serif"}}>{m.value}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{marginTop:16,paddingTop:12,borderTop:"1px solid "+T.border,display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}}>
        <span style={{fontSize:10,color:"#64748B"}}>Score formula:</span>
        {["30% Gross Yield","25% DLD Liquidity","20% PPSF Value","15% Supply Risk","10% Metro Access"].map((s,i)=>(
          <span key={i} style={{fontSize:10,color:"#64748B",padding:"2px 8px",borderRadius:8,border:"1px solid rgba(255,255,255,0.06)"}}>{s}</span>
        ))}
      </div>
    </div>
  );
}`;

fs.writeFileSync("src/tabs/InvestmentScoreTab.jsx", investmentScore, "utf8");
console.log("InvestmentScoreTab done. Non-ASCII:", (investmentScore.match(/[^\x00-\x7F]/g)||[]).length);

// ══════════════════════════════════════════════════════
// 2. GOLDEN VISA TAB
// ══════════════════════════════════════════════════════
const goldenVisa = `/* eslint-disable */
/* DXB ANALYTICS - GOLDEN VISA TAB - Session 15
   UAE 10-year Golden Visa — AED 2M+ property investment */

import React, { useState, useMemo } from "react";
import { T } from "../data";

const fmtP = n => n ? "AED "+Math.round(n).toLocaleString() : "--";
const fmtY = n => n ? parseFloat(n).toFixed(1)+"%" : "--";

export default function GoldenVisaTab({ liveNeighbourhoods=[], liveProjects=[], handleTabChange, globalFilters={} }) {
  const [search,  setSearch]  = useState("");
  const [sortBy,  setSortBy]  = useState("score");
  const [typeF,   setTypeF]   = useState("all");
  const [selected,setSelected]= useState(null);

  const GV_THRESHOLD = 2000000;

  const gvCommunities = useMemo(() =>
    liveNeighbourhoods.filter(n => n.goldenVisa === true)
  , [liveNeighbourhoods]);

  const filtered = useMemo(() => {
    let a = [...gvCommunities];
    if(search.trim()) a = a.filter(n=>(n.community||"").toLowerCase().includes(search.toLowerCase()));
    a.sort((x,y)=>{
      if(sortBy==="score")  return (y.investmentScore||0)-(x.investmentScore||0);
      if(sortBy==="yield")  return parseFloat(y.grossYield||0)-parseFloat(x.grossYield||0);
      if(sortBy==="ppsf")   return (y.avgPpsf||0)-(x.avgPpsf||0);
      if(sortBy==="name")   return (x.community||"").localeCompare(y.community||"");
      return 0;
    });
    return a;
  }, [gvCommunities,search,sortBy]);

  // GV eligible projects
  const gvProjects = useMemo(() =>
    (liveProjects||[]).filter(p => (p.priceMin||0) >= GV_THRESHOLD || (p.avgPpsf||0) >= 1800)
  , [liveProjects]);

  const selStyle = {padding:"6px 10px",background:"rgba(255,255,255,0.04)",border:"1px solid "+T.border,borderRadius:7,color:"#CBD5E1",fontSize:11,outline:"none",fontFamily:"'Outfit',sans-serif"};

  return (
    <div style={{paddingBottom:60}}>
      <div style={{marginBottom:16}}>
        <h2 style={{margin:0,fontSize:20,fontWeight:900,color:T.white,fontFamily:"'Fraunces',serif"}}>Golden Visa</h2>
        <p style={{margin:"4px 0 0",fontSize:12,color:"#94A3B8"}}>
          {gvCommunities.length} eligible communities · AED 2M+ property investment qualifies for UAE 10-year residency
        </p>
      </div>

      <div style={{background:"linear-gradient(135deg,rgba(212,168,67,0.12),rgba(212,168,67,0.04))",border:"1px solid rgba(212,168,67,0.3)",borderRadius:14,padding:"20px",marginBottom:16}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:16}}>
          <div>
            <div style={{fontSize:11,color:"#94A3B8",marginBottom:8,fontWeight:600}}>What You Get</div>
            {["10-year UAE residency","Sponsor family members","No minimum stay required","Path to permanent residency","Business setup benefits"].map((b,i)=>(
              <div key={i} style={{fontSize:11,color:T.white,marginBottom:4,display:"flex",alignItems:"center",gap:6}}>
                <span style={{color:T.gold,fontSize:10}}>+</span>{b}
              </div>
            ))}
          </div>
          <div>
            <div style={{fontSize:11,color:"#94A3B8",marginBottom:8,fontWeight:600}}>Requirements</div>
            {["Minimum AED 2,000,000 property value","Freehold property only","Property must be ready (not off-plan)","Title deed in investor name","Valid UAE entry permit"].map((r,i)=>(
              <div key={i} style={{fontSize:11,color:T.white,marginBottom:4,display:"flex",alignItems:"center",gap:6}}>
                <span style={{color:"#94A3B8",fontSize:10}}>-</span>{r}
              </div>
            ))}
          </div>
          <div>
            <div style={{fontSize:11,color:"#94A3B8",marginBottom:8,fontWeight:600}}>Stats</div>
            {[
              {label:"Eligible Communities", value:gvCommunities.length},
              {label:"Min Investment",        value:"AED 2,000,000"},
              {label:"Visa Duration",         value:"10 Years"},
              {label:"Renewal",               value:"Renewable"},
              {label:"Family Members",        value:"Spouse + Children"},
            ].map((s,i)=>(
              <div key={i} style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                <span style={{fontSize:10,color:"#94A3B8"}}>{s.label}</span>
                <span style={{fontSize:10,fontWeight:600,color:T.gold}}>{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:14,flexWrap:"wrap"}}>
        <div style={{flex:"1 1 200px",display:"flex",alignItems:"center",gap:8,padding:"7px 12px",background:"rgba(255,255,255,0.03)",border:"1px solid "+(search?T.gold:T.border),borderRadius:8}}>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search community..." style={{flex:1,background:"none",border:"none",outline:"none",color:T.white,fontSize:12,fontFamily:"'Outfit',sans-serif"}}/>
          {search&&<button type="button" onClick={()=>setSearch("")} style={{background:"none",border:"none",color:"#94A3B8",cursor:"pointer",fontSize:14}}>x</button>}
        </div>
        <select value={sortBy} onChange={e=>setSortBy(e.target.value)} style={selStyle}>
          <option value="score">Best Score</option>
          <option value="yield">Highest Yield</option>
          <option value="ppsf">Highest PPSF</option>
          <option value="name">A - Z</option>
        </select>
        <span style={{fontSize:11,color:"#94A3B8"}}>{filtered.length} communities</span>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:12,marginBottom:16}}>
        {filtered.map((n,i)=>(
          <div key={n.community||i} onClick={()=>setSelected(selected?.community===n.community?null:n)}
            style={{background:selected?.community===n.community?"rgba(212,168,67,0.06)":"rgba(255,255,255,0.02)",border:"1px solid "+(selected?.community===n.community?"rgba(212,168,67,0.4)":T.border),borderRadius:12,padding:"16px",cursor:"pointer",position:"relative",overflow:"hidden"}}
            onMouseEnter={e=>e.currentTarget.style.borderColor="rgba(212,168,67,0.3)"}
            onMouseLeave={e=>e.currentTarget.style.borderColor=selected?.community===n.community?"rgba(212,168,67,0.4)":T.border}
          >
            <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:"linear-gradient(90deg,"+T.gold+","+T.gold+"40)"}}/>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
              <div>
                <div style={{fontSize:13,fontWeight:700,color:T.white,marginBottom:4}}>{n.community}</div>
                <div style={{display:"flex",gap:4}}>
                  <span style={{fontSize:9,padding:"2px 6px",borderRadius:4,background:"rgba(212,168,67,0.15)",color:T.gold,fontWeight:700}}>GV Eligible</span>
                  {n.hasMetro&&<span style={{fontSize:9,padding:"2px 6px",borderRadius:4,background:"rgba(16,185,129,0.1)",color:"#10B981",fontWeight:600}}>Metro</span>}
                  {n.hasBeach&&<span style={{fontSize:9,padding:"2px 6px",borderRadius:4,background:"rgba(6,182,212,0.1)",color:"#06B6D4",fontWeight:600}}>Beach</span>}
                </div>
              </div>
              <div style={{width:38,height:38,borderRadius:"50%",background:"rgba(212,168,67,0.1)",border:"2px solid "+T.gold,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                <span style={{fontSize:11,fontWeight:800,color:T.gold}}>{n.investmentScore||"--"}</span>
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
              {[
                {label:"Yield",       value:fmtY(n.grossYield),  color:"#10B981"},
                {label:"Avg PPSF",    value:fmtP(n.avgPpsf),     color:T.gold},
                {label:"Svc Charge",  value:n.serviceCharge?"AED "+n.serviceCharge+"/sqft":"--", color:"#94A3B8"},
                {label:"Supply Risk", value:n.supplyRisk||"--",  color:n.supplyRisk==="Low"?"#10B981":"#F59E0B"},
              ].map((m,j)=>(
                <div key={j} style={{background:"rgba(255,255,255,0.03)",borderRadius:6,padding:"7px 9px"}}>
                  <div style={{fontSize:9,color:"#64748B",textTransform:"uppercase",letterSpacing:0.7,marginBottom:2}}>{m.label}</div>
                  <div style={{fontSize:12,fontWeight:700,color:m.color}}>{m.value}</div>
                </div>
              ))}
            </div>
            {n.distMetro&&(
              <div style={{marginTop:8,fontSize:10,color:"#94A3B8"}}>
                Metro: {n.nearestMetro||"--"} ({parseFloat(n.distMetro).toFixed(1)}km)
              </div>
            )}
          </div>
        ))}
      </div>

      {selected&&(
        <div style={{background:"rgba(212,168,67,0.04)",border:"1px solid rgba(212,168,67,0.2)",borderRadius:14,padding:"20px",marginBottom:12}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:12}}>
            <div style={{fontSize:16,fontWeight:700,color:T.white,fontFamily:"'Fraunces',serif"}}>{selected.community}</div>
            <div style={{display:"flex",gap:8}}>
              <button type="button" onClick={()=>handleTabChange&&handleTabChange("Neighbourhoods")} style={{padding:"7px 12px",borderRadius:8,border:"1px solid "+T.gold,background:"rgba(212,168,67,0.08)",color:T.gold,fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>View Community</button>
              <button type="button" onClick={()=>setSelected(null)} style={{background:"rgba(255,255,255,0.06)",border:"1px solid "+T.border,borderRadius:8,color:"#94A3B8",width:32,height:32,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>x</button>
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8}}>
            {[
              {label:"Gross Yield",   value:fmtY(selected.grossYield),   color:"#10B981"},
              {label:"Net Yield",     value:fmtY(selected.netYield),     color:"#CBD5E1"},
              {label:"Avg PPSF",      value:fmtP(selected.avgPpsf),      color:T.gold},
              {label:"Metro",         value:selected.nearestMetro||"--", color:"#94A3B8"},
              {label:"School",        value:selected.nearestSchool||"--",color:"#8B5CF6"},
              {label:"Mall",          value:selected.nearestMall||"--",  color:T.gold},
              {label:"DLD Txns",      value:selected.dldTransactions?selected.dldTransactions.toLocaleString():"--", color:"#94A3B8"},
              {label:"Inv Score",     value:(selected.investmentScore||"--")+"/100", color:T.gold},
            ].map((m,i)=>(
              <div key={i} style={{background:"rgba(255,255,255,0.03)",borderRadius:8,padding:"9px 11px"}}>
                <div style={{fontSize:9,color:"#64748B",textTransform:"uppercase",letterSpacing:0.7,marginBottom:2}}>{m.label}</div>
                <div style={{fontSize:12,fontWeight:600,color:m.color,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{m.value}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{marginTop:12,padding:"12px 16px",background:"rgba(255,255,255,0.02)",border:"1px solid "+T.border,borderRadius:10,fontSize:11,color:"#94A3B8",lineHeight:1.6}}>
        Disclaimer: Golden Visa eligibility is subject to GDRFA approval. Property must be fully paid (not mortgaged) or mortgage balance must be below AED 1M. Consult a licensed UAE immigration advisor for complete requirements.
      </div>
    </div>
  );
}`;

fs.writeFileSync("src/tabs/GoldenVisaTab.jsx", goldenVisa, "utf8");
console.log("GoldenVisaTab done. Non-ASCII:", (goldenVisa.match(/[^\x00-\x7F]/g)||[]).length);

// ══════════════════════════════════════════════════════
// 3. SERVICE CHARGES TAB
// ══════════════════════════════════════════════════════
const serviceCharges = `/* eslint-disable */
/* DXB ANALYTICS - SERVICE CHARGES TAB - Session 15
   Real service charge data from neighbourhoodScores */

import React, { useState, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { T } from "../data";

const fmtP = n => n ? "AED "+Math.round(n).toLocaleString() : "--";
const fmtY = n => n ? parseFloat(n).toFixed(1)+"%" : "--";

export default function ServiceChargesTab({ liveNeighbourhoods=[], handleTabChange, globalFilters={} }) {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("rate");
  const [selected, setSelected] = useState(null);

  const withSC = useMemo(() =>
    liveNeighbourhoods.filter(n => n.serviceCharge > 0)
  , [liveNeighbourhoods]);

  const filtered = useMemo(() => {
    let a = [...withSC];
    if(search.trim()) a = a.filter(n=>(n.community||"").toLowerCase().includes(search.toLowerCase()));
    a.sort((x,y)=>{
      if(sortBy==="rate")    return (x.serviceCharge||0)-(y.serviceCharge||0);
      if(sortBy==="rate_desc")return (y.serviceCharge||0)-(x.serviceCharge||0);
      if(sortBy==="yield")   return parseFloat(y.grossYield||0)-parseFloat(x.grossYield||0);
      if(sortBy==="name")    return (x.community||"").localeCompare(y.community||"");
      return 0;
    });
    return a;
  }, [withSC,search,sortBy]);

  const avgRate = withSC.length ? Math.round(withSC.reduce((s,n)=>s+(n.serviceCharge||0),0)/withSC.length) : 0;
  const lowestSC = [...withSC].sort((a,b)=>(a.serviceCharge||0)-(b.serviceCharge||0))[0];
  const highestSC= [...withSC].sort((a,b)=>(b.serviceCharge||0)-(a.serviceCharge||0))[0];

  const chartData = filtered.slice(0,15).map(n=>({
    name: (n.community||"").length>12?(n.community||"").substring(0,12)+"...":n.community,
    rate: n.serviceCharge||0,
    fill: (n.serviceCharge||0)<=12?"#10B981":(n.serviceCharge||0)<=20?"#D4A843":"#EF4444",
  }));

  const selStyle = {padding:"6px 10px",background:"rgba(255,255,255,0.04)",border:"1px solid "+T.border,borderRadius:7,color:"#CBD5E1",fontSize:11,outline:"none",fontFamily:"'Outfit',sans-serif"};

  return (
    <div style={{paddingBottom:60}}>
      <div style={{marginBottom:16}}>
        <h2 style={{margin:0,fontSize:20,fontWeight:900,color:T.white,fontFamily:"'Fraunces',serif"}}>Service Charges</h2>
        <p style={{margin:"4px 0 0",fontSize:12,color:"#94A3B8"}}>
          {withSC.length} communities · Dubai average AED {avgRate}/sqft/yr · Source: RERA Mollak system
        </p>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:16}}>
        {[
          {label:"Dubai Average",  value:"AED "+avgRate+"/sqft",   color:T.gold},
          {label:"Lowest Rate",    value:lowestSC?"AED "+lowestSC.serviceCharge+"/sqft":"--", color:"#10B981", hint:lowestSC?.community},
          {label:"Highest Rate",   value:highestSC?"AED "+highestSC.serviceCharge+"/sqft":"--", color:"#EF4444", hint:highestSC?.community},
          {label:"Below AED 12",   value:withSC.filter(n=>n.serviceCharge<=12).length+" areas", color:"#10B981", hint:"Low cost communities"},
        ].map((k,i)=>(
          <div key={i} style={{background:"rgba(255,255,255,0.02)",border:"1px solid "+T.border,borderRadius:12,padding:"14px 16px",position:"relative",overflow:"hidden"}}>
            <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:k.color}}/>
            <div style={{fontSize:9,fontWeight:700,color:"#64748B",textTransform:"uppercase",letterSpacing:0.8,marginBottom:4}}>{k.label}</div>
            <div style={{fontSize:16,fontWeight:900,color:k.color,fontFamily:"'Fraunces',serif"}}>{k.value}</div>
            {k.hint&&<div style={{fontSize:10,color:"#64748B",marginTop:2}}>{k.hint}</div>}
          </div>
        ))}
      </div>

      {chartData.length>0&&(
        <div style={{background:"rgba(255,255,255,0.02)",border:"1px solid "+T.border,borderRadius:12,padding:"16px",marginBottom:16}}>
          <div style={{fontSize:12,fontWeight:700,color:T.white,marginBottom:12}}>Service Charge by Community (AED/sqft/yr)</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chartData} margin={{top:5,right:10,left:-10,bottom:35}}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} vertical={false}/>
              <XAxis dataKey="name" tick={{fontSize:8,fill:"#64748B"}} angle={-35} textAnchor="end"/>
              <YAxis tick={{fontSize:9,fill:"#64748B"}}/>
              <Tooltip contentStyle={{background:T.surface,border:"1px solid "+T.border,borderRadius:8,fontSize:11}} formatter={v=>["AED "+v+"/sqft/yr","Service Charge"]}/>
              <ReferenceLine y={avgRate} stroke="#D4A843" strokeDasharray="4 4" label={{value:"Avg",fill:"#D4A843",fontSize:9}}/>
              <Bar dataKey="rate" radius={[3,3,0,0]}>
                {chartData.map((d,i)=>(<cell key={i} fill={d.fill}/>))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:14,flexWrap:"wrap"}}>
        <div style={{flex:"1 1 200px",display:"flex",alignItems:"center",gap:8,padding:"7px 12px",background:"rgba(255,255,255,0.03)",border:"1px solid "+(search?T.gold:T.border),borderRadius:8}}>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search community..." style={{flex:1,background:"none",border:"none",outline:"none",color:T.white,fontSize:12,fontFamily:"'Outfit',sans-serif"}}/>
          {search&&<button type="button" onClick={()=>setSearch("")} style={{background:"none",border:"none",color:"#94A3B8",cursor:"pointer",fontSize:14}}>x</button>}
        </div>
        <select value={sortBy} onChange={e=>setSortBy(e.target.value)} style={selStyle}>
          <option value="rate">Lowest Rate First</option>
          <option value="rate_desc">Highest Rate First</option>
          <option value="yield">Highest Yield</option>
          <option value="name">A - Z</option>
        </select>
        <span style={{fontSize:11,color:"#94A3B8"}}>{filtered.length} communities</span>
      </div>

      <div style={{background:"rgba(255,255,255,0.02)",border:"1px solid "+T.border,borderRadius:14,overflow:"hidden"}}>
        <div style={{display:"grid",gridTemplateColumns:"28px 2fr 90px 80px 80px 80px",padding:"10px 16px",fontSize:9,fontWeight:700,color:"#64748B",textTransform:"uppercase",letterSpacing:0.8,borderBottom:"1px solid "+T.border,background:"rgba(255,255,255,0.02)"}}>
          {["#","Community","Svc Charge","Gross Yield","Net Yield","PPSF"].map((h,i)=>(
            <div key={i} style={{textAlign:i>1?"center":"left"}}>{h}</div>
          ))}
        </div>
        {filtered.slice(0,100).map((n,i)=>(
          <div key={n.community||i} onClick={()=>setSelected(selected?.community===n.community?null:n)}
            style={{display:"grid",gridTemplateColumns:"28px 2fr 90px 80px 80px 80px",padding:"11px 16px",alignItems:"center",borderBottom:i<filtered.length-1?"1px solid "+T.border+"30":"none",cursor:"pointer",background:selected?.community===n.community?"rgba(212,168,67,0.04)":"transparent"}}
            onMouseEnter={e=>e.currentTarget.style.background="rgba(212,168,67,0.03)"}
            onMouseLeave={e=>e.currentTarget.style.background=selected?.community===n.community?"rgba(212,168,67,0.04)":"transparent"}
          >
            <div style={{fontSize:10,color:"#64748B"}}>{i+1}</div>
            <div>
              <div style={{fontSize:12,fontWeight:600,color:T.white}}>{n.community}</div>
              <div style={{fontSize:10,color:"#64748B"}}>{n.tier==="verified"?"Verified":n.tier==="area-data"?"Area Data":"DLD"}</div>
            </div>
            <div style={{textAlign:"center"}}>
              <span style={{fontSize:12,fontWeight:700,color:(n.serviceCharge||0)<=12?"#10B981":(n.serviceCharge||0)<=20?"#D4A843":"#EF4444",fontFamily:"'Fraunces',serif"}}>AED {n.serviceCharge}</span>
              <div style={{fontSize:9,color:"#64748B"}}>per sqft/yr</div>
            </div>
            <div style={{textAlign:"center",fontSize:12,fontWeight:700,color:"#10B981"}}>{fmtY(n.grossYield)}</div>
            <div style={{textAlign:"center",fontSize:12,color:"#CBD5E1"}}>{fmtY(n.netYield)}</div>
            <div style={{textAlign:"center",fontSize:11,color:T.gold}}>{n.avgPpsf?"AED "+Math.round(n.avgPpsf).toLocaleString():"--"}</div>
          </div>
        ))}
      </div>

      <div style={{marginTop:16,padding:"12px 16px",background:"rgba(255,255,255,0.02)",border:"1px solid "+T.border,borderRadius:10}}>
        <div style={{fontSize:11,fontWeight:600,color:T.white,marginBottom:8}}>How Service Charges Affect Your Net Yield</div>
        <div style={{fontSize:11,color:"#94A3B8",lineHeight:1.7}}>
          Service charges directly reduce your net yield. A property with 7% gross yield and AED 15/sqft service charge on a 1,000 sqft unit costs AED 15,000/year — reducing net yield by approximately 1-1.5%. 
          Lower service charge communities like Discovery Gardens (AED 8-10/sqft) maximize net returns for yield investors.
        </div>
      </div>
    </div>
  );
}`;

fs.writeFileSync("src/tabs/ServiceChargesTab.jsx", serviceCharges, "utf8");
console.log("ServiceChargesTab done. Non-ASCII:", (serviceCharges.match(/[^\x00-\x7F]/g)||[]).length);

// ══════════════════════════════════════════════════════
// 4. DXB ESTIMATE TAB
// ══════════════════════════════════════════════════════
const dxbEstimate = `/* eslint-disable */
/* DXB ANALYTICS - DXB ESTIMATE TAB - Session 15
   AVM property valuation using real community PPSF data */

import React, { useState, useMemo } from "react";
import { T } from "../data";

const fmtP = n => n ? "AED "+Math.round(n).toLocaleString() : "--";

export default function DXBEstimateTab({ liveNeighbourhoods=[], handleTabChange, globalFilters={} }) {
  const [community, setCommunity] = useState("");
  const [area,      setArea]      = useState("");
  const [beds,      setBeds]      = useState("1");
  const [type,      setType]      = useState("Apartment");
  const [floor,     setFloor]     = useState("mid");
  const [condition, setCondition] = useState("good");
  const [result,    setResult]    = useState(null);
  const [search,    setSearch]    = useState("");

  const communities = useMemo(() =>
    liveNeighbourhoods.filter(n=>n.avgPpsf>0).sort((a,b)=>(a.community||"").localeCompare(b.community||""))
  ,[liveNeighbourhoods]);

  const filtered = useMemo(() =>
    search.trim() ? communities.filter(n=>(n.community||"").toLowerCase().includes(search.toLowerCase())) : communities
  ,[communities,search]);

  const selectedComm = communities.find(n=>n.community===community);

  const FLOOR_MULTIPLIER  = {low:0.95, mid:1.0, high:1.06, penthouse:1.15};
  const COND_MULTIPLIER   = {poor:0.85, fair:0.92, good:1.0, excellent:1.08};
  const BEDS_MULTIPLIER   = {"Studio":0.9,"1":1.0,"2":1.05,"3":1.08,"4+":1.12};
  const TYPE_MULTIPLIER   = {Apartment:1.0, Villa:1.15, Townhouse:1.08, Penthouse:1.20};

  function calculateEstimate() {
    if(!selectedComm || !area || parseFloat(area)<=0) return;
    const basePpsf  = selectedComm.avgPpsf || 1500;
    const sqft      = parseFloat(area);
    const adjPpsf   = basePpsf
      * (FLOOR_MULTIPLIER[floor]||1)
      * (COND_MULTIPLIER[condition]||1)
      * (BEDS_MULTIPLIER[beds]||1)
      * (TYPE_MULTIPLIER[type]||1);
    const midVal    = Math.round(adjPpsf * sqft);
    const lowVal    = Math.round(midVal * 0.92);
    const highVal   = Math.round(midVal * 1.08);
    const grossYield= parseFloat(selectedComm.grossYield||0);
    const annualRent= grossYield>0 ? Math.round(midVal * (grossYield/100)) : null;
    setResult({ midVal, lowVal, highVal, adjPpsf:Math.round(adjPpsf), basePpsf, sqft, annualRent, grossYield, community:selectedComm });
  }

  const selStyle = {padding:"8px 12px",background:"rgba(255,255,255,0.04)",border:"1px solid "+T.border,borderRadius:8,color:"#CBD5E1",fontSize:12,outline:"none",fontFamily:"'Outfit',sans-serif",width:"100%"};

  return (
    <div style={{paddingBottom:60}}>
      <div style={{marginBottom:16}}>
        <h2 style={{margin:0,fontSize:20,fontWeight:900,color:T.white,fontFamily:"'Fraunces',serif"}}>DXB Estimate</h2>
        <p style={{margin:"4px 0 0",fontSize:12,color:"#94A3B8"}}>
          Automated property valuation · Powered by real DLD transaction data · {communities.length} communities
        </p>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16}}>
        <div style={{background:"rgba(255,255,255,0.02)",border:"1px solid "+T.border,borderRadius:14,padding:"20px"}}>
          <div style={{fontSize:13,fontWeight:700,color:T.white,marginBottom:16}}>Property Details</div>
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            <div>
              <div style={{fontSize:10,color:"#64748B",textTransform:"uppercase",letterSpacing:0.8,marginBottom:6,fontWeight:600}}>Community</div>
              <div style={{position:"relative"}}>
                <input value={search} onChange={e=>{setSearch(e.target.value);setCommunity("");setResult(null);}}
                  placeholder="Search community..."
                  style={{...selStyle,marginBottom:search&&filtered.length>0?0:0}}/>
                {search&&filtered.length>0&&!community&&(
                  <div style={{position:"absolute",top:"100%",left:0,right:0,background:"#1a1f2e",border:"1px solid "+T.border,borderRadius:8,maxHeight:200,overflowY:"auto",zIndex:10}}>
                    {filtered.slice(0,10).map(n=>(
                      <div key={n.community} onClick={()=>{setCommunity(n.community);setSearch(n.community);setResult(null);}}
                        style={{padding:"10px 14px",cursor:"pointer",fontSize:12,color:T.white,borderBottom:"1px solid "+T.border+"30"}}
                        onMouseEnter={e=>e.currentTarget.style.background="rgba(212,168,67,0.08)"}
                        onMouseLeave={e=>e.currentTarget.style.background="transparent"}
                      >
                        <div style={{fontWeight:600}}>{n.community}</div>
                        <div style={{fontSize:10,color:"#64748B"}}>AED {Math.round(n.avgPpsf).toLocaleString()}/sqft · {n.grossYield}% yield</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {selectedComm&&(
                <div style={{marginTop:6,padding:"8px 10px",background:"rgba(16,185,129,0.06)",border:"1px solid rgba(16,185,129,0.2)",borderRadius:8,fontSize:11,color:"#10B981"}}>
                  Base PPSF: AED {Math.round(selectedComm.avgPpsf).toLocaleString()} · Yield: {selectedComm.grossYield}%
                </div>
              )}
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <div>
                <div style={{fontSize:10,color:"#64748B",textTransform:"uppercase",letterSpacing:0.8,marginBottom:6,fontWeight:600}}>Property Type</div>
                <select value={type} onChange={e=>setType(e.target.value)} style={selStyle}>
                  {["Apartment","Villa","Townhouse","Penthouse"].map(t=><option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <div style={{fontSize:10,color:"#64748B",textTransform:"uppercase",letterSpacing:0.8,marginBottom:6,fontWeight:600}}>Bedrooms</div>
                <select value={beds} onChange={e=>setBeds(e.target.value)} style={selStyle}>
                  {["Studio","1","2","3","4+"].map(b=><option key={b} value={b}>{b==="Studio"?"Studio":b+" BR"}</option>)}
                </select>
              </div>
              <div>
                <div style={{fontSize:10,color:"#64748B",textTransform:"uppercase",letterSpacing:0.8,marginBottom:6,fontWeight:600}}>Area (sqft)</div>
                <input type="number" value={area} onChange={e=>{setArea(e.target.value);setResult(null);}} placeholder="e.g. 900" style={selStyle}/>
              </div>
              <div>
                <div style={{fontSize:10,color:"#64748B",textTransform:"uppercase",letterSpacing:0.8,marginBottom:6,fontWeight:600}}>Floor Level</div>
                <select value={floor} onChange={e=>setFloor(e.target.value)} style={selStyle}>
                  <option value="low">Low Floor</option>
                  <option value="mid">Mid Floor</option>
                  <option value="high">High Floor</option>
                  <option value="penthouse">Penthouse</option>
                </select>
              </div>
              <div>
                <div style={{fontSize:10,color:"#64748B",textTransform:"uppercase",letterSpacing:0.8,marginBottom:6,fontWeight:600}}>Condition</div>
                <select value={condition} onChange={e=>setCondition(e.target.value)} style={selStyle}>
                  <option value="poor">Needs Work</option>
                  <option value="fair">Fair</option>
                  <option value="good">Good</option>
                  <option value="excellent">Excellent/New</option>
                </select>
              </div>
            </div>
            <button type="button" onClick={calculateEstimate}
              disabled={!community||!area}
              style={{padding:"12px",borderRadius:10,border:"none",background:community&&area?"linear-gradient(135deg,#D4A843,#B8922A)":"rgba(255,255,255,0.06)",color:community&&area?T.dark:"#64748B",fontSize:13,fontWeight:700,cursor:community&&area?"pointer":"not-allowed",fontFamily:"'Outfit',sans-serif"}}>
              Calculate Estimate
            </button>
          </div>
        </div>

        <div style={{background:"rgba(255,255,255,0.02)",border:"1px solid "+T.border,borderRadius:14,padding:"20px"}}>
          <div style={{fontSize:13,fontWeight:700,color:T.white,marginBottom:16}}>Valuation Result</div>
          {result ? (
            <div>
              <div style={{textAlign:"center",marginBottom:16,padding:"20px",background:"rgba(212,168,67,0.06)",border:"1px solid rgba(212,168,67,0.2)",borderRadius:12}}>
                <div style={{fontSize:11,color:"#94A3B8",marginBottom:6}}>ESTIMATED VALUE</div>
                <div style={{fontSize:28,fontWeight:900,color:T.gold,fontFamily:"'Fraunces',serif"}}>{fmtP(result.midVal)}</div>
                <div style={{fontSize:12,color:"#94A3B8",marginTop:4}}>Range: {fmtP(result.lowVal)} — {fmtP(result.highVal)}</div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
                {[
                  {label:"Adjusted PPSF",  value:"AED "+result.adjPpsf.toLocaleString()+"/sqft", color:T.gold},
                  {label:"Base PPSF",       value:"AED "+result.basePpsf.toLocaleString()+"/sqft", color:"#94A3B8"},
                  {label:"Total Area",      value:result.sqft.toLocaleString()+" sqft",            color:"#CBD5E1"},
                  {label:"Community",       value:result.community.community,                      color:T.white},
                  ...(result.annualRent?[{label:"Est. Annual Rent", value:fmtP(result.annualRent), color:"#10B981"}]:[]),
                  ...(result.grossYield?[{label:"Community Yield",  value:result.grossYield+"%",   color:"#10B981"}]:[]),
                ].map((m,i)=>(
                  <div key={i} style={{background:"rgba(255,255,255,0.03)",borderRadius:8,padding:"9px 11px"}}>
                    <div style={{fontSize:9,color:"#64748B",textTransform:"uppercase",letterSpacing:0.7,marginBottom:2}}>{m.label}</div>
                    <div style={{fontSize:12,fontWeight:600,color:m.color,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{m.value}</div>
                  </div>
                ))}
              </div>
              <div style={{padding:"10px 12px",background:"rgba(255,255,255,0.02)",border:"1px solid "+T.border,borderRadius:8,fontSize:10,color:"#64748B",lineHeight:1.6}}>
                Estimate based on DLD median PPSF for {result.community.community}. Adjusted for floor level, condition, and property type. This is an indicative estimate only — not a formal valuation.
              </div>
              <button type="button" onClick={()=>handleTabChange&&handleTabChange("Neighbourhoods")}
                style={{width:"100%",marginTop:10,padding:"10px",borderRadius:8,border:"1px solid "+T.border,background:"rgba(255,255,255,0.03)",color:"#94A3B8",fontSize:11,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>
                View {result.community.community} Community Profile
              </button>
            </div>
          ) : (
            <div style={{textAlign:"center",padding:"40px 20px",color:"#64748B"}}>
              <div style={{fontSize:32,marginBottom:12}}>?</div>
              <div style={{fontSize:13,fontWeight:600,color:"#94A3B8",marginBottom:6}}>Enter property details</div>
              <div style={{fontSize:11}}>Select a community and enter area to get an instant estimate powered by real DLD PPSF data</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}`;

fs.writeFileSync("src/tabs/DXBEstimateTab.jsx", dxbEstimate, "utf8");
console.log("DXBEstimateTab done. Non-ASCII:", (dxbEstimate.match(/[^\x00-\x7F]/g)||[]).length);