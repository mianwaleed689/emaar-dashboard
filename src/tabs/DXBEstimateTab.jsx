/* eslint-disable */
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
    (liveNeighbourhoods||[]).filter(n=>n.avgPpsf>0).sort((a,b)=>(a.community||"").localeCompare(b.community||""))
  ,[liveNeighbourhoods]);

  const filtered = useMemo(() =>
    search.trim() ? communities.filter(n=>(n.community||"").toLowerCase().includes(search.toLowerCase())) : communities
  ,[communities,search]);

  const selectedComm = communities.find(n=>n.community===community);

  const FLOOR_MULTIPLIER  = {low:0.95, mid:1.0, high:1.06, penthouse:1.15};
  const COND_MULTIPLIER   = {poor:0.85, fair:0.92, good:1.0, excellent:1.08};
  const BEDS_MULTIPLIER   = {"Studio":0.9,"1":1.0,"2":1.05,"3":1.08,"4+":1.12};
  const TYPE_MULTIPLIER   = {Apartment:1.0, Villa:1.15, Townhouse:1.08, Penthouse:1.20};

  /* A valuation band must widen as the evidence thins. A community priced off
     3 transactions cannot carry the same +/-8% confidence as one priced off 200.
     Roughly follows 1/sqrt(n): more comparables, tighter range. */
  function confidenceFor(sampleSize) {
    const n = Number(sampleSize) || 0;
    if (n >= 200) return { band: 0.08, label: "High",     note: `${n} transactions` };
    if (n >= 50)  return { band: 0.12, label: "Moderate", note: `${n} transactions` };
    if (n >= 10)  return { band: 0.18, label: "Low",      note: `only ${n} transactions` };
    if (n >= 1)   return { band: 0.25, label: "Very low", note: `only ${n} transaction${n===1?"":"s"}` };
    return { band: 0.25, label: "Unknown", note: "transaction count unavailable" };
  }

  function calculateEstimate() {
    if(!selectedComm || !area || parseFloat(area)<=0) return;
    /* Previously fell back to a hardcoded 1500 AED/sqft when a community had no
       price data, producing a confident-looking valuation from an invented
       number. Refuse to estimate instead. */
    const basePpsf  = selectedComm.avgPpsf;
    if(!(basePpsf > 0)) {
      setResult({ unavailable:true, community:selectedComm });
      return;
    }
    const sqft      = parseFloat(area);
    const adjPpsf   = basePpsf
      * (FLOOR_MULTIPLIER[floor]||1)
      * (COND_MULTIPLIER[condition]||1)
      * (BEDS_MULTIPLIER[beds]||1)
      * (TYPE_MULTIPLIER[type]||1);
    const midVal    = Math.round(adjPpsf * sqft);
    const conf      = confidenceFor(selectedComm.totalTransactions ?? selectedComm.recentSampleSize);
    const lowVal    = Math.round(midVal * (1 - conf.band));
    const highVal   = Math.round(midVal * (1 + conf.band));
    const grossYield= parseFloat(selectedComm.grossYield||0);
    const annualRent= grossYield>0 ? Math.round(midVal * (grossYield/100)) : null;
    setResult({ midVal, lowVal, highVal, adjPpsf:Math.round(adjPpsf), basePpsf, sqft, annualRent, grossYield, community:selectedComm, confidence:conf });
  }

  const selStyle = {padding:"8px 12px",background:"rgba(255,255,255,0.04)",border:"1px solid "+T.border,borderRadius:8,color:"#CBD5E1",fontSize:12,outline:"none",fontFamily:"'Outfit',sans-serif",width:"100%"};

  return (
    <div style={{paddingBottom:60}}>
      <div style={{marginBottom:16}}>
        <h2 style={{margin:0,fontSize:20,fontWeight:900,color:T.white,fontFamily:"'Fraunces',serif"}}>DXB Estimate</h2>
        <p style={{margin:"4px 0 0",fontSize:12,color:"#94A3B8"}}>
          Automated property valuation  Powered by real DLD transaction data  {communities.length} communities
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
                        <div style={{fontSize:10,color:"#64748B"}}>AED {Math.round(n.avgPpsf).toLocaleString()}/sqft  {n.grossYield}% yield</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {selectedComm&&(
                <div style={{marginTop:6,padding:"8px 10px",background:"rgba(16,185,129,0.06)",border:"1px solid rgba(16,185,129,0.2)",borderRadius:8,fontSize:11,color:"#10B981"}}>
                  Base PPSF: AED {Math.round(selectedComm.avgPpsf).toLocaleString()}  Yield: {selectedComm.grossYield}%
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
          {result && result.unavailable ? (
            <div style={{padding:"22px",textAlign:"center",background:"rgba(245,158,11,0.06)",border:"1px solid rgba(245,158,11,0.25)",borderRadius:12}}>
              <div style={{fontSize:13,fontWeight:700,color:"#F59E0B",marginBottom:6}}>Cannot value this community</div>
              <div style={{fontSize:11,color:"#94A3B8",lineHeight:1.7}}>
                No verified price-per-sqft data exists for {result.community.community}.
                Rather than show an estimate built on an assumed figure, we show nothing.
              </div>
            </div>
          ) : result ? (
            <div>
              <div style={{textAlign:"center",marginBottom:16,padding:"20px",background:"rgba(212,168,67,0.06)",border:"1px solid rgba(212,168,67,0.2)",borderRadius:12}}>
                <div style={{fontSize:11,color:"#94A3B8",marginBottom:6}}>ESTIMATED VALUE</div>
                <div style={{fontSize:28,fontWeight:900,color:T.gold,fontFamily:"'Fraunces',serif"}}>{fmtP(result.midVal)}</div>
                <div style={{fontSize:12,color:"#94A3B8",marginTop:4}}>Range: {fmtP(result.lowVal)}  {fmtP(result.highVal)}</div>
                {result.confidence && (
                  <div style={{marginTop:8,display:"inline-flex",alignItems:"center",gap:6,padding:"3px 10px",borderRadius:999,
                    background:result.confidence.band<=0.08?"rgba(16,185,129,0.12)":result.confidence.band<=0.12?"rgba(132,204,22,0.12)":"rgba(245,158,11,0.12)",
                    border:"1px solid "+(result.confidence.band<=0.08?"rgba(16,185,129,0.35)":result.confidence.band<=0.12?"rgba(132,204,22,0.35)":"rgba(245,158,11,0.35)")}}>
                    <span style={{fontSize:9,fontWeight:700,letterSpacing:0.4,textTransform:"uppercase",
                      color:result.confidence.band<=0.08?"#10B981":result.confidence.band<=0.12?"#84CC16":"#F59E0B"}}>
                      {result.confidence.label} confidence
                    </span>
                    <span style={{fontSize:9,color:"#94A3B8"}}>{result.confidence.note}</span>
                  </div>
                )}
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
                Estimate based on DLD median PPSF for {result.community.community}. Adjusted for floor level, condition, and property type. This is an indicative estimate only  not a formal valuation.
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
}