/* eslint-disable */
/* DXB ANALYTICS - GOLDEN VISA TAB - Session 15
   UAE 10-year Golden Visa  AED 2M+ property investment */

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
    (liveNeighbourhoods||[]).filter(n => n.goldenVisa === true)
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
          Communities where AED 2M+ units are typically available. Individual unit price must be AED 2M+ to qualify.
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
              <button type="button" onClick={()=>handleTabChange&&handleTabChange("Neighbourhoods")} style={{padding:"7px 12px",borderRadius:8,border:"1px solid "+T.gold,background:"rgba(212,168,67,0.08)",color:T.gold,fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>View Community</button><button type="button" onClick={()=>handleTabChange&&handleTabChange("Projects")} style={{padding:"7px 12px",borderRadius:8,border:"1px solid #10B981",background:"rgba(16,185,129,0.08)",color:"#10B981",fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>View Projects</button>
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
}