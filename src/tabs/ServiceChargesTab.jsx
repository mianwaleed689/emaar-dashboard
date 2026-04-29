/* eslint-disable */
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
          {withSC.length} communities  Dubai average AED {avgRate}/sqft/yr  Source: RERA Mollak system
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
          Service charges directly reduce your net yield. A property with 7% gross yield and AED 15/sqft service charge on a 1,000 sqft unit costs AED 15,000/year  reducing net yield by approximately 1-1.5%. 
          Lower service charge communities like Discovery Gardens (AED 8-10/sqft) maximize net returns for yield investors.
        </div>
      </div>
    </div>
  );
}