/* eslint-disable */
/* DXB ANALYTICS - STR vs LTR TAB - Session 15
   Short Term Rental vs Long Term Rental comparison by community */

import React, { useState, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { T } from "../data";

const fmtP = n => n ? "AED "+Math.round(n).toLocaleString() : "--";
const fmtY = n => n ? parseFloat(n).toFixed(1)+"%" : "--";

// STR premium by community type  research based
// Source: GuestReady 2025, Airbnb Dubai data, DTCM reports
const STR_PREMIUM = {
  "Dubai Marina":          1.8,  "Downtown Dubai":        1.9,
  "Palm Jumeirah":         2.2,  "Jumeirah Beach Residence": 1.9,
  "Business Bay":          1.6,  "DIFC":                  1.7,
  "Bluewaters Island":     2.0,  "Dubai Harbour":         1.9,
  "La Mer":                1.8,  "City Walk":             1.7,
  "Jumeirah Lake Towers":  1.5,  "Al Sufouh":             1.7,
  "Dubai Creek Harbour":   1.6,  "Emaar Beachfront":      2.0,
};
const DEFAULT_STR_PREMIUM = 1.4; // 40% premium for STR over LTR

export default function STRvsLTRTab({ liveNeighbourhoods=[], handleTabChange, globalFilters={} }) {
  const [search,   setSearch]   = useState("");
  const [sortBy,   setSortBy]   = useState("str_yield");
  const [selected, setSelected] = useState(null);
  const [propSize, setPropSize] = useState(750);
  const [occupancy,setOccupancy]= useState(75);

  const withYield = useMemo(() =>
    (liveNeighbourhoods||[]).filter(n => parseFloat(n.grossYield||0) > 0)
  , [liveNeighbourhoods]);

  const enriched = useMemo(() => {
    return withYield.map(n => {
      const ltrYield  = parseFloat(n.grossYield||0);
      const premium   = STR_PREMIUM[n.community] || DEFAULT_STR_PREMIUM;
      const strGross  = Math.round(ltrYield * premium * 10) / 10;
      const strNet    = Math.round((strGross - 2.5) * 10) / 10; // STR mgmt ~2.5%
      const ltrNet    = parseFloat(n.netYield||0);
      const propValue = (n.avgPpsf||1500) * propSize;
      const ltrAnnual = Math.round(propValue * ltrYield / 100);
      const strAnnual = Math.round(propValue * strGross / 100 * (occupancy/100));
      const advantage = strAnnual - ltrAnnual;
      return { ...n, ltrYield, strGross, strNet, ltrNet, propValue, ltrAnnual, strAnnual, advantage, premium };
    });
  }, [withYield, propSize, occupancy]);

  const filtered = useMemo(() => {
    let a = [...enriched];
    if(search.trim()) a = a.filter(n=>(n.community||"").toLowerCase().includes(search.toLowerCase()));
    a.sort((x,y)=>{
      if(sortBy==="str_yield")  return (y.strGross||0)-(x.strGross||0);
      if(sortBy==="ltr_yield")  return (y.ltrYield||0)-(x.ltrYield||0);
      if(sortBy==="advantage")  return (y.advantage||0)-(x.advantage||0);
      if(sortBy==="name")       return (x.community||"").localeCompare(y.community||"");
      return 0;
    });
    return a;
  }, [enriched, search, sortBy]);

  const avgSTR  = enriched.length ? (enriched.reduce((s,n)=>s+(n.strGross||0),0)/enriched.length).toFixed(1) : 0;
  const avgLTR  = enriched.length ? (enriched.reduce((s,n)=>s+(n.ltrYield||0),0)/enriched.length).toFixed(1) : 0;
  const topSTR  = [...enriched].sort((a,b)=>(b.strGross||0)-(a.strGross||0))[0];
  const topAdv  = [...enriched].sort((a,b)=>(b.advantage||0)-(a.advantage||0))[0];

  const chartData = filtered.slice(0,10).map(n=>({
    name: (n.community||"").length>10?(n.community||"").substring(0,10)+"...":n.community,
    str:  n.strGross||0,
    ltr:  n.ltrYield||0,
  }));

  const selStyle = {padding:"6px 10px",background:"rgba(255,255,255,0.04)",border:"1px solid "+T.border,borderRadius:7,color:"#CBD5E1",fontSize:11,outline:"none",fontFamily:"'Outfit',sans-serif"};

  return (
    <div style={{paddingBottom:60}}>
      <div style={{marginBottom:16}}>
        <h2 style={{margin:0,fontSize:20,fontWeight:900,color:T.white,fontFamily:"'Fraunces',serif"}}>STR vs LTR</h2>
        <p style={{margin:"4px 0 0",fontSize:12,color:"#94A3B8"}}>
          Short Term vs Long Term rental comparison  {enriched.length} communities  Sources: GuestReady 2025, DTCM, Bayut
        </p>
      </div>

      {/* KPIs */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:16}}>
        {[
          {label:"Avg STR Yield",   value:avgSTR+"%",              color:"#10B981", hint:"Short term rental"},
          {label:"Avg LTR Yield",   value:avgLTR+"%",              color:"#84CC16", hint:"Long term rental"},
          {label:"Best STR Area",   value:topSTR?.community||"--", color:T.gold,    hint:topSTR?topSTR.strGross+"%":""},
          {label:"Best Advantage",  value:topAdv?fmtP(topAdv.advantage):"-", color:"#06B6D4", hint:topAdv?.community||""},
        ].map((k,i)=>(
          <div key={i} style={{background:"rgba(255,255,255,0.02)",border:"1px solid "+T.border,borderRadius:12,padding:"14px 16px",position:"relative",overflow:"hidden"}}>
            <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:k.color}}/>
            <div style={{fontSize:9,fontWeight:700,color:"#64748B",textTransform:"uppercase",letterSpacing:0.8,marginBottom:4}}>{k.label}</div>
            <div style={{fontSize:16,fontWeight:900,color:k.color,fontFamily:"'Fraunces',serif"}}>{k.value}</div>
            <div style={{fontSize:10,color:"#64748B",marginTop:2}}>{k.hint}</div>
          </div>
        ))}
      </div>

      {/* Calculator */}
      <div style={{background:"rgba(255,255,255,0.02)",border:"1px solid "+T.border,borderRadius:12,padding:"16px",marginBottom:16}}>
        <div style={{fontSize:12,fontWeight:700,color:T.white,marginBottom:12}}>Calculator Assumptions</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <div>
            <div style={{fontSize:10,color:"#64748B",textTransform:"uppercase",letterSpacing:0.8,marginBottom:6}}>Property Size (sqft)</div>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <input type="range" min={400} max={2000} step={50} value={propSize} onChange={e=>setPropSize(Number(e.target.value))}
                style={{flex:1,accentColor:T.gold}}/>
              <span style={{fontSize:12,fontWeight:700,color:T.gold,width:60}}>{propSize} sqft</span>
            </div>
          </div>
          <div>
            <div style={{fontSize:10,color:"#64748B",textTransform:"uppercase",letterSpacing:0.8,marginBottom:6}}>STR Occupancy Rate</div>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <input type="range" min={50} max={95} step={5} value={occupancy} onChange={e=>setOccupancy(Number(e.target.value))}
                style={{flex:1,accentColor:T.gold}}/>
              <span style={{fontSize:12,fontWeight:700,color:T.gold,width:40}}>{occupancy}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Chart */}
      {chartData.length>0&&(
        <div style={{background:"rgba(255,255,255,0.02)",border:"1px solid "+T.border,borderRadius:12,padding:"16px",marginBottom:16}}>
          <div style={{fontSize:12,fontWeight:700,color:T.white,marginBottom:12}}>Top 10 STR vs LTR Yield Comparison</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chartData} margin={{top:5,right:10,left:-20,bottom:35}}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} vertical={false}/>
              <XAxis dataKey="name" tick={{fontSize:8,fill:"#64748B"}} angle={-35} textAnchor="end"/>
              <YAxis tick={{fontSize:9,fill:"#64748B"}} domain={[0,15]}/>
              <Tooltip contentStyle={{background:T.surface,border:"1px solid "+T.border,borderRadius:8,fontSize:11}} formatter={(v,n)=>[v+"%",n==="str"?"STR Yield":"LTR Yield"]}/>
              <Bar dataKey="str" name="STR" fill="#10B981" radius={[3,3,0,0]}/>
              <Bar dataKey="ltr" name="LTR" fill="#84CC16" radius={[3,3,0,0]} opacity={0.7}/>
            </BarChart>
          </ResponsiveContainer>
          <div style={{display:"flex",gap:16,justifyContent:"center",marginTop:8}}>
            <div style={{display:"flex",alignItems:"center",gap:4}}><div style={{width:10,height:10,borderRadius:2,background:"#10B981"}}/><span style={{fontSize:10,color:"#94A3B8"}}>STR Yield</span></div>
            <div style={{display:"flex",alignItems:"center",gap:4}}><div style={{width:10,height:10,borderRadius:2,background:"#84CC16"}}/><span style={{fontSize:10,color:"#94A3B8"}}>LTR Yield</span></div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:14,flexWrap:"wrap"}}>
        <div style={{flex:"1 1 200px",display:"flex",alignItems:"center",gap:8,padding:"7px 12px",background:"rgba(255,255,255,0.03)",border:"1px solid "+(search?T.gold:T.border),borderRadius:8}}>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search community..." style={{flex:1,background:"none",border:"none",outline:"none",color:T.white,fontSize:12,fontFamily:"'Outfit',sans-serif"}}/>
          {search&&<button type="button" onClick={()=>setSearch("")} style={{background:"none",border:"none",color:"#94A3B8",cursor:"pointer",fontSize:14}}>x</button>}
        </div>
        <select value={sortBy} onChange={e=>setSortBy(e.target.value)} style={selStyle}>
          <option value="str_yield">Highest STR Yield</option>
          <option value="ltr_yield">Highest LTR Yield</option>
          <option value="advantage">Biggest STR Advantage</option>
          <option value="name">A - Z</option>
        </select>
        <span style={{fontSize:11,color:"#94A3B8"}}>{filtered.length} communities</span>
      </div>

      {/* Table */}
      <div style={{background:"rgba(255,255,255,0.02)",border:"1px solid "+T.border,borderRadius:14,overflow:"hidden"}}>
        <div style={{display:"grid",gridTemplateColumns:"28px 2fr 80px 80px 90px 90px 100px",padding:"10px 16px",fontSize:9,fontWeight:700,color:"#64748B",textTransform:"uppercase",letterSpacing:0.8,borderBottom:"1px solid "+T.border,background:"rgba(255,255,255,0.02)"}}>
          {["#","Community","STR Yield","LTR Yield","STR Annual","LTR Annual","Advantage"].map((h,i)=>(
            <div key={i} style={{textAlign:i>1?"center":"left"}}>{h}</div>
          ))}
        </div>
        {filtered.slice(0,100).map((n,i)=>(
          <div key={n.community||i} onClick={()=>setSelected(selected?.community===n.community?null:n)}
            style={{display:"grid",gridTemplateColumns:"28px 2fr 80px 80px 90px 90px 100px",padding:"11px 16px",alignItems:"center",borderBottom:i<filtered.length-1?"1px solid "+T.border+"30":"none",cursor:"pointer",background:selected?.community===n.community?"rgba(212,168,67,0.04)":"transparent"}}
            onMouseEnter={e=>e.currentTarget.style.background="rgba(212,168,67,0.03)"}
            onMouseLeave={e=>e.currentTarget.style.background=selected?.community===n.community?"rgba(212,168,67,0.04)":"transparent"}
          >
            <div style={{fontSize:10,color:"#64748B"}}>{i+1}</div>
            <div>
              <div style={{fontSize:12,fontWeight:600,color:T.white}}>{n.community}</div>
              <div style={{display:"flex",gap:4,marginTop:2}}>
                {n.tier==="verified"&&<span style={{fontSize:9,padding:"1px 5px",borderRadius:4,background:"rgba(16,185,129,0.12)",color:"#10B981",fontWeight:600}}>Verified</span>}
                {n.hasBeach&&<span style={{fontSize:9,padding:"1px 5px",borderRadius:4,background:"rgba(6,182,212,0.1)",color:"#06B6D4",fontWeight:600}}>Beach</span>}
                {n.hasMetro&&<span style={{fontSize:9,padding:"1px 5px",borderRadius:4,background:"rgba(16,185,129,0.1)",color:"#10B981",fontWeight:600}}>Metro</span>}
              </div>
            </div>
            <div style={{textAlign:"center",fontSize:13,fontWeight:700,color:"#10B981",fontFamily:"'Fraunces',serif"}}>{fmtY(n.strGross)}</div>
            <div style={{textAlign:"center",fontSize:12,fontWeight:600,color:"#84CC16"}}>{fmtY(n.ltrYield)}</div>
            <div style={{textAlign:"center",fontSize:11,color:"#94A3B8"}}>{fmtP(n.strAnnual)}</div>
            <div style={{textAlign:"center",fontSize:11,color:"#94A3B8"}}>{fmtP(n.ltrAnnual)}</div>
            <div style={{textAlign:"center",fontSize:11,fontWeight:700,color:n.advantage>0?"#10B981":"#EF4444"}}>
              {n.advantage>0?"+":""}{fmtP(n.advantage)}
            </div>
          </div>
        ))}
      </div>

      {/* Selected detail */}
      {selected&&(
        <div style={{marginTop:12,background:"rgba(212,168,67,0.04)",border:"1px solid rgba(212,168,67,0.2)",borderRadius:14,padding:"20px"}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:14}}>
            <div style={{fontSize:16,fontWeight:700,color:T.white,fontFamily:"'Fraunces',serif"}}>{selected.community}</div>
            <div style={{display:"flex",gap:8}}>
              <button type="button" onClick={()=>handleTabChange&&handleTabChange("Neighbourhoods")} style={{padding:"7px 12px",borderRadius:8,border:"1px solid "+T.gold,background:"rgba(212,168,67,0.08)",color:T.gold,fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>View Community</button>
              <button type="button" onClick={()=>setSelected(null)} style={{background:"rgba(255,255,255,0.06)",border:"1px solid "+T.border,borderRadius:8,color:"#94A3B8",width:32,height:32,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>x</button>
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:12}}>
            {[
              {label:"STR Gross Yield",  value:fmtY(selected.strGross),  color:"#10B981"},
              {label:"STR Net Yield",    value:fmtY(selected.strNet),    color:"#84CC16"},
              {label:"LTR Gross Yield",  value:fmtY(selected.ltrYield),  color:"#D4A843"},
              {label:"LTR Net Yield",    value:fmtY(selected.ltrNet),    color:"#CBD5E1"},
              {label:"STR Annual (est)", value:fmtP(selected.strAnnual), color:"#10B981"},
              {label:"LTR Annual (est)", value:fmtP(selected.ltrAnnual), color:"#84CC16"},
              {label:"STR Advantage",    value:(selected.advantage>0?"+":"")+fmtP(selected.advantage), color:selected.advantage>0?"#10B981":"#EF4444"},
              {label:"STR Premium",      value:((selected.premium-1)*100).toFixed(0)+"% over LTR", color:"#94A3B8"},
              {label:"Community Score",  value:(selected.investmentScore||"--")+"/100", color:T.gold},
            ].map((m,i)=>(
              <div key={i} style={{background:"rgba(255,255,255,0.03)",borderRadius:8,padding:"10px 12px"}}>
                <div style={{fontSize:9,color:"#64748B",textTransform:"uppercase",letterSpacing:0.7,marginBottom:3}}>{m.label}</div>
                <div style={{fontSize:13,fontWeight:700,color:m.color,fontFamily:"'Fraunces',serif"}}>{m.value}</div>
              </div>
            ))}
          </div>
          <div style={{padding:"10px 12px",background:"rgba(255,255,255,0.02)",border:"1px solid "+T.border,borderRadius:8,fontSize:10,color:"#64748B",lineHeight:1.6}}>
            "+propSize+"sqft property at "+occupancy+"% occupancy. STR premium for "+selected.community+": "+((selected.premium-1)*100).toFixed(0)+"% above LTR rates.
            Actual STR income varies by listing quality, seasonality, and management. Sources: GuestReady 2025, DTCM Dubai Tourism data.
          </div>
        </div>
      )}

      <div style={{marginTop:16,paddingTop:12,borderTop:"1px solid "+T.border,display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}}>
        <span style={{fontSize:10,color:"#64748B"}}>Sources:</span>
        {["GuestReady STR Report 2025","DTCM Dubai Tourism","Airbnb Dubai Data","Bayut Rental Index 2025"].map((s,i)=>(
          <span key={i} style={{fontSize:10,color:"#64748B",padding:"2px 8px",borderRadius:8,border:"1px solid rgba(255,255,255,0.06)"}}>{s}</span>
        ))}
      </div>
    </div>
  );
}