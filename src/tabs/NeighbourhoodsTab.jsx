/* eslint-disable */ /* v2 */
/*
  DXB ANALYTICS  NEIGHBOURHOODS TAB
  Session 14  World Class
  Data source: projects collection (11 verified Emaar communities)
  Real yields, distances, metro, amenities
*/

import React, { useState, useMemo } from "react";
import { T } from "../data";
import { scoreColor, scoreLabel } from "../utils/scoring";

const fmt  = n => n!=null ? n : "";
const fmtY = n => n ? parseFloat(n).toFixed(1)+"%" : "";
const fmtP = n => n ? "AED "+Math.round(n).toLocaleString() : "";
const fmtD = n => n!=null ? parseFloat(n).toFixed(1)+" km" : "";
const fmtSC= n => n ? "AED "+n+"/sqft/yr" : "";

const RISK_COLOR = { Low:"#10B981", "Low-Medium":"#84CC16", Medium:"#F59E0B", "Medium-High":"#FB923C", High:"#EF4444", Unknown:"#94A3B8" };

const ScoreBadge = ({score,size="sm"}) => {
  if(!score) return <span style={{fontSize:11,color:"#94A3B8"}}></span>;
  const color = scoreColor(score);
  const dim = size==="lg"?48:34;
  return (
    <div style={{width:dim,height:dim,borderRadius:"50%",background:color+"18",border:"2px solid "+color,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
      <span style={{fontSize:size==="lg"?14:11,fontWeight:800,color,fontFamily:"'Fraunces',serif"}}>{score}</span>
    </div>
  );
};

const Chip = ({label,color,bg}) => (
  <span style={{fontSize:10,padding:"2px 8px",borderRadius:10,background:bg||color+"18",color:color||"#94A3B8",fontWeight:600,whiteSpace:"nowrap"}}>{label}</span>
);

const MetroBadge = ({dist,name}) => {
  if(!dist) return null;
  const d = parseFloat(dist);
  const color = d<=1?"#10B981":d<=3?"#F59E0B":"#94A3B8";
  const label = d<=0.5?"Metro walk":d<=1?"Metro nearby":d<=3?"Metro 3km+":"Metro "+d+"km";
  return <Chip label={label} color={color}/>;
};

//  Community Card 
const CommunityCard = ({n, selected, onSelect, onCompare, isCompared}) => {
  const isDLD = n.tier === "dld-registry";
  const riskColor = RISK_COLOR[n.supplyRisk||"Unknown"];
  const grossY = parseFloat(n.grossYield||0);
  const yieldColor = grossY>=7?"#10B981":grossY>=6?"#84CC16":grossY>=5?T.gold:"#94A3B8";

  return (
    <div onClick={()=>onSelect(n)}
      style={{background:selected?"rgba(212,168,67,0.06)":"rgba(255,255,255,0.02)",border:"1px solid "+(selected?T.gold:T.border),borderRadius:14,padding:18,cursor:"pointer",transition:"all 0.15s",position:"relative",overflow:"hidden"}}
      onMouseEnter={e=>{if(!selected){e.currentTarget.style.background="rgba(255,255,255,0.04)";e.currentTarget.style.borderColor="rgba(212,168,67,0.3)";}}}
      onMouseLeave={e=>{if(!selected){e.currentTarget.style.background="rgba(255,255,255,0.02)";e.currentTarget.style.borderColor=T.border;}}}
    >
      {/* Top accent */}
      <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:"linear-gradient(90deg,"+yieldColor+","+yieldColor+"40)"}}/>

      {/* Header */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:14,fontWeight:700,color:T.white,marginBottom:4,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{n.community}</div>
          <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
            <Chip label=" Verified" color="#10B981"/>
            <MetroBadge dist={n.distMetro} name={n.nearestMetro}/>
            {n.hasBeach&&<Chip label=" Waterfront" color="#06B6D4"/>}
            {n.goldenVisa&&<Chip label="Golden Visa" color={T.gold}/>}
          </div>
        </div>
        <ScoreBadge score={n.investmentScore}/>
      </div>

      {/* Key metrics */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
        {[
          {label:"Gross Yield", value:fmtY(n.grossYield), color:yieldColor},
          {label:"Net Yield",   value:fmtY(n.netYield),   color:T.textSecondary||"#CBD5E1"},
          {label:"Avg PPSF",    value:fmtP(n.avgPpsf),    color:T.white},
          {label:"Svc Charge",  value:fmtSC(n.serviceCharge), color:"#94A3B8"},
        ].map((m,i)=>(
          <div key={i} style={{background:"rgba(255,255,255,0.03)",borderRadius:8,padding:"8px 10px"}}>
            <div style={{fontSize:9,fontWeight:700,color:"#64748B",textTransform:"uppercase",letterSpacing:0.7,marginBottom:3}}>{m.label}</div>
            <div style={{fontSize:14,fontWeight:700,color:m.color,fontFamily:"'Fraunces',serif"}}>{m.value}</div>
          </div>
        ))}
      </div>

      {/* Distances */}
      <div style={{display:"flex",gap:10,marginBottom:12,flexWrap:"wrap"}}>
        {n.distMetro&&<div style={{fontSize:10,color:"#94A3B8"}}><span style={{color:"#10B981"}}></span> {fmtD(n.distMetro)}</div>}
        {n.distMall&&<div style={{fontSize:10,color:"#94A3B8"}}><span style={{color:T.gold}}></span> {fmtD(n.distMall)}</div>}
        {n.distBeach!=null&&parseFloat(n.distBeach)<50&&<div style={{fontSize:10,color:"#94A3B8"}}><span style={{color:"#06B6D4"}}></span> {fmtD(n.distBeach)}</div>}
        {n.distSchool&&<div style={{fontSize:10,color:"#94A3B8"}}><span style={{color:"#8B5CF6"}}></span> {fmtD(n.distSchool)}</div>}
        {n.distAirport&&<div style={{fontSize:10,color:"#94A3B8"}}><span style={{color:"#F59E0B"}}></span> {fmtD(n.distAirport)}</div>}
      </div>

      {/* Supply risk + projects */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{display:"flex",alignItems:"center",gap:6}}>
          <div style={{width:6,height:6,borderRadius:"50%",background:riskColor}}/>
          <span style={{fontSize:10,color:riskColor,fontWeight:600}}>{n.supplyRisk||"Unknown"} Risk</span>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:10,color:"#64748B"}}>{n.totalProjects} projects</span>
          <button type="button" onClick={e=>{e.stopPropagation();onCompare(n.community);}}
            style={{padding:"3px 10px",borderRadius:8,border:"1px solid "+(isCompared?T.gold:T.border),background:isCompared?"rgba(212,168,67,0.15)":"transparent",color:isCompared?T.gold:"#94A3B8",fontSize:10,fontWeight:600,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>
            {isCompared?" Added":"Compare"}
          </button>
        </div>
      </div>
    </div>
  );
};

//  Detail Drawer 
const DetailDrawer = ({n, onClose, handleTabChange}) => {
  const [drawerTab, setDrawerTab] = useState("overview");
  if(!n) return null;
  const grossY = parseFloat(n.grossYield||0);
  const yieldColor = grossY>=7?"#10B981":grossY>=6?"#84CC16":grossY>=5?T.gold:"#94A3B8";
  const riskColor = RISK_COLOR[n.supplyRisk||"Unknown"];

  React.useEffect(()=>{ 
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = e=>{ if(e.key==="Escape") onClose(); };
    window.addEventListener("keydown",onKey);
    return ()=>{ document.body.style.overflow=prev; window.removeEventListener("keydown",onKey); };
  },[]);

  const Stat = ({label,value,color,hint}) => (
    <div style={{background:"rgba(255,255,255,0.03)",borderRadius:10,padding:"12px 14px"}}>
      <div style={{fontSize:9,fontWeight:700,color:"#64748B",letterSpacing:0.8,textTransform:"uppercase",marginBottom:4}}>{label}</div>
      <div style={{fontSize:20,fontWeight:700,color:color||T.white,fontFamily:"'Fraunces',serif"}}>{value}</div>
      {hint&&<div style={{fontSize:10,color:"#94A3B8",marginTop:3}}>{hint}</div>}
    </div>
  );

  return (
    <React.Fragment>
      <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",backdropFilter:"blur(2px)",zIndex:1000}}/>
      <div style={{position:"fixed",top:0,right:0,bottom:0,width:"min(560px,100vw)",background:"#0D1117",borderLeft:"1px solid "+T.border,zIndex:1001,overflowY:"auto",fontFamily:"'Outfit',sans-serif"}}>

        {/* Header */}
        <div style={{position:"sticky",top:0,zIndex:2,background:"#0D1117",borderBottom:"1px solid "+T.border,padding:"16px 20px"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
            <div>
              <div style={{display:"flex",gap:6,alignItems:"center",marginBottom:6}}>
                <Chip label=" Verified" color="#10B981"/>
                {n.goldenVisa&&<Chip label="Golden Visa" color={T.gold}/>}
                {n.hasBeach&&<Chip label=" Waterfront" color="#06B6D4"/>}
              </div>
              <div style={{fontSize:20,fontWeight:700,color:T.white,fontFamily:"'Fraunces',serif"}}>{n.community}</div>
              <div style={{fontSize:12,color:"#94A3B8",marginTop:3}}>{n.totalProjects} Emaar projects  {n.nearestMetro||"Dubai"}</div>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:12}}>
              <ScoreBadge score={n.investmentScore} size="lg"/>
              <button type="button" onClick={onClose} style={{background:"rgba(255,255,255,0.06)",border:"1px solid "+T.border,borderRadius:8,color:"#94A3B8",width:32,height:32,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}></button>
            </div>
          </div>
          {/* Drawer tabs */}
          <div style={{display:"flex",gap:0,marginTop:14}}>
            {[{k:"overview",l:"Overview"},{k:"investment",l:"Investment"},{k:"distances",l:"Location"},{k:"projects",l:"Projects"}].map(t=>(
              <button key={t.k} type="button" onClick={()=>setDrawerTab(t.k)}
                style={{padding:"7px 14px",border:"none",borderBottom:drawerTab===t.k?"2px solid "+T.gold:"2px solid transparent",background:"transparent",color:drawerTab===t.k?T.gold:"#94A3B8",fontSize:12,fontWeight:drawerTab===t.k?600:400,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>
                {t.l}
              </button>
            ))}
          </div>
        </div>

        <div style={{padding:"20px"}}>
          {/* Overview tab */}
          {drawerTab==="overview"&&(
            <div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
                <Stat label="Gross Yield"   value={fmtY(n.grossYield)}  color={yieldColor}/>
                <Stat label="Net Yield"     value={fmtY(n.netYield)}    color="#CBD5E1"/>
                <Stat label="Service Charge" value={fmtSC(n.serviceCharge)} color="#94A3B8" hint="Per sqft per year"/>
                <Stat label="Supply Risk"   value={n.supplyRisk||""}   color={riskColor}/>
              </div>
              {n.nearestMetro&&(
                <div style={{padding:"12px 14px",background:"rgba(16,185,129,0.06)",border:"1px solid rgba(16,185,129,0.2)",borderRadius:10,marginBottom:12,display:"flex",alignItems:"center",gap:10}}>
                  <span style={{fontSize:20}}></span>
                  <div>
                    <div style={{fontSize:12,fontWeight:600,color:T.white}}>{n.nearestMetro}</div>
                    <div style={{fontSize:11,color:"#94A3B8"}}>{fmtD(n.distMetro)} away</div>
                  </div>
                </div>
              )}
              <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:16}}>
                {n.hasBeach&&<Chip label=" Waterfront" color="#06B6D4"/>}
                {n.hasSchool&&<Chip label=" School nearby" color="#8B5CF6"/>}
                {n.hasHospital&&<Chip label=" Hospital nearby" color="#EF4444"/>}
                {n.hasMall&&<Chip label=" Mall nearby" color={T.gold}/>}
                {n.hasMetro&&<Chip label=" Metro nearby" color="#10B981"/>}
                {n.hasVilla&&<Chip label=" Villas" color="#F59E0B"/>}
                {n.hasApt&&<Chip label=" Apartments" color="#3B82F6"/>}
                {n.goldenVisa&&<Chip label=" Golden Visa eligible" color={T.gold}/>}
              </div>
              <div style={{display:"flex",gap:8}}>
                <button type="button" onClick={()=>handleTabChange?.("Yields")}
                  style={{flex:1,padding:"9px",borderRadius:8,border:"1px solid "+T.border,background:"rgba(20,184,166,0.06)",color:"#14B8A6",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>View Yields -></button>
                <button type="button" onClick={()=>handleTabChange?.("Price History")}
                  style={{flex:1,padding:"9px",borderRadius:8,border:"1px solid "+T.border,background:"rgba(212,168,67,0.06)",color:T.gold,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>Price History -></button>
              </div>
            </div>
          )}
          {/* Investment tab */}
          {drawerTab==="investment"&&(
            <div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
                <Stat label="Gross Yield"      value={fmtY(n.grossYield)}  color={yieldColor} hint="Annual rental income / price"/>
                <Stat label="Net Yield"        value={fmtY(n.netYield)}    color="#CBD5E1"    hint="After service charge"/>
                <Stat label="Avg PPSF"         value={fmtP(n.avgPpsf)}     color={T.gold}     hint="Price per sq ft"/>
                <Stat label="Service Charge"   value={fmtSC(n.serviceCharge)} color="#94A3B8" hint="Annual"/>
                {n.priceMin&&<Stat label="Starting Price"  value={fmtP(n.priceMin)} color="#10B981" hint="Lowest project price"/>}
                {n.priceMax&&<Stat label="Max Price"       value={fmtP(n.priceMax)} color="#EF4444" hint="Highest project price"/>}
              </div>
              {n.goldenVisa&&(
                <div style={{padding:"12px 14px",background:"rgba(212,168,67,0.08)",border:"1px solid rgba(212,168,67,0.3)",borderRadius:10,marginBottom:12}}>
                  <div style={{fontSize:12,fontWeight:700,color:T.gold,marginBottom:4}}>UAE Golden Visa Eligible</div>
                  <div style={{fontSize:11,color:"#94A3B8",lineHeight:1.6}}>Properties in this community qualify for 10-year UAE Golden Visa with AED 2M+ investment.</div>
                </div>
              )}
              <div style={{padding:"12px 14px",background:"rgba(255,255,255,0.02)",border:"1px solid "+T.border,borderRadius:10}}>
                <div style={{fontSize:11,fontWeight:700,color:T.white,marginBottom:8}}>Investment Score Breakdown</div>
                {[
                  {label:"Yield",    score:parseFloat(n.grossYield||0)>=7?20:parseFloat(n.grossYield||0)>=6?15:10,  max:20},
                  {label:"Location", score:parseFloat(n.distMetro||99)<1?10:parseFloat(n.distMetro||99)<2?5:0,      max:10},
                  {label:"Amenities",score:(n.hasBeach?8:0)+(n.hasSchool?5:0)+(n.hasMall?5:0),                     max:18},
                  {label:"GV Eligible",score:n.goldenVisa?7:0,                                                      max:7},
                  {label:"Maturity", score:n.totalProjects>=10?5:3,                                                 max:5},
                ].map((r,i)=>(
                  <div key={i} style={{marginBottom:8}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                      <span style={{fontSize:11,color:"#94A3B8"}}>{r.label}</span>
                      <span style={{fontSize:11,fontWeight:700,color:T.gold}}>{r.score}/{r.max}</span>
                    </div>
                    <div style={{height:3,borderRadius:2,background:"rgba(255,255,255,0.05)"}}>
                      <div style={{height:"100%",width:(r.score/r.max*100)+"%",background:T.gold,borderRadius:2,opacity:0.8}}/>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* Location tab */}
          {drawerTab==="distances"&&(
            <div>
              {n.nearestMetro&&(
                <div style={{padding:"14px",background:"rgba(16,185,129,0.06)",border:"1px solid rgba(16,185,129,0.2)",borderRadius:10,marginBottom:12}}>
                  <div style={{fontSize:11,color:"#10B981",fontWeight:700,marginBottom:4}}>NEAREST METRO</div>
                  <div style={{fontSize:14,fontWeight:600,color:T.white}}>{n.nearestMetro}</div>
                  <div style={{fontSize:12,color:"#94A3B8",marginTop:2}}>{fmtD(n.distMetro)} from community</div>
                </div>
              )}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                {[
                  {icon:"",label:"Metro",       value:fmtD(n.distMetro),    color:"#10B981"},
                  {icon:"",label:"Mall",        value:fmtD(n.distMall),     color:T.gold},
                  {icon:"",label:"Beach",       value:fmtD(n.distBeach),    color:"#06B6D4"},
                  {icon:"",label:"School",      value:fmtD(n.distSchool),   color:"#8B5CF6"},
                  {icon:"",label:"Hospital",    value:fmtD(n.distHospital), color:"#EF4444"},
                  {icon:"",label:"Airport",     value:fmtD(n.distAirport),  color:"#F59E0B"},
                ].map((r,i)=>(
                  <div key={i} style={{background:"rgba(255,255,255,0.03)",borderRadius:10,padding:"12px 14px",display:"flex",alignItems:"center",gap:10}}>
                    <span style={{fontSize:22}}>{r.icon}</span>
                    <div>
                      <div style={{fontSize:9,fontWeight:700,color:"#64748B",textTransform:"uppercase",letterSpacing:0.7}}>{r.label}</div>
                      <div style={{fontSize:15,fontWeight:700,color:r.value===""?"#64748B":r.color,fontFamily:"'Fraunces',serif"}}>{r.value}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* Projects tab */}
          {drawerTab==="projects"&&(
            <div>
              <div style={{fontSize:12,color:"#94A3B8",marginBottom:12}}>{n.totalProjects} Emaar projects in {n.community}</div>
              <div style={{padding:"14px",background:"rgba(212,168,67,0.04)",border:"1px solid rgba(212,168,67,0.15)",borderRadius:10,marginBottom:12}}>
                <div style={{fontSize:12,fontWeight:600,color:T.gold,marginBottom:4}}>Property Types</div>
                <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                  {(n.propertyTypes||[]).map((t,i)=>(<Chip key={i} label={t} color={T.gold}/>))}
                  {n.hasVilla&&<Chip label="Villas" color="#F59E0B"/>}
                  {n.hasApt&&<Chip label="Apartments" color="#3B82F6"/>}
                </div>
              </div>
              <button type="button" onClick={()=>handleTabChange?.("Projects")}
                style={{width:"100%",padding:"10px",borderRadius:8,border:"1px solid "+T.border,background:"rgba(212,168,67,0.06)",color:T.gold,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>
                Browse {n.community} Projects 
              </button>
            </div>
          )}
        </div>
      </div>
    </React.Fragment>
  );
};

//  Compare Panel 
const ComparePanel = ({communities, data, onRemove}) => {
  if(communities.length < 2) return null;
  const items = communities.map(c => data.find(n=>n.community===c)).filter(Boolean);
  if(items.length < 2) return null;
  const rows = [
    {label:"Investment Score", key:"investmentScore",  fmt:v=>v||""},
    {label:"Gross Yield",      key:"grossYield",       fmt:fmtY},
    {label:"Net Yield",        key:"netYield",         fmt:fmtY},
    {label:"Avg PPSF",         key:"avgPpsf",          fmt:fmtP},
    {label:"Service Charge",   key:"serviceCharge",    fmt:n=>n?"AED "+n+"/sqft":""},
    {label:"Metro Distance",   key:"distMetro",        fmt:fmtD},
    {label:"Beach Distance",   key:"distBeach",        fmt:fmtD},
    {label:"Supply Risk",      key:"supplyRisk",       fmt:v=>v||""},
    {label:"Total Projects",   key:"totalProjects",    fmt:v=>v||""},
    {label:"Golden Visa",      key:"goldenVisa",       fmt:v=>v?" Yes":""},
  ];

  return (
    <div style={{background:"rgba(255,255,255,0.02)",border:"1px solid "+T.border,borderRadius:14,overflow:"hidden",marginBottom:16}}>
      <div style={{padding:"14px 18px",borderBottom:"1px solid "+T.border,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{fontSize:13,fontWeight:700,color:T.white}}>Community Comparison</div>
        <div style={{display:"flex",gap:8}}>
          {items.map(n=>(
            <span key={n.community} style={{fontSize:11,padding:"3px 10px",borderRadius:20,background:"rgba(212,168,67,0.15)",color:T.gold,display:"flex",alignItems:"center",gap:6}}>
              {n.community}
              <button type="button" onClick={()=>onRemove(n.community)} style={{background:"none",border:"none",color:"#94A3B8",cursor:"pointer",fontSize:14,lineHeight:1,padding:0}}></button>
            </span>
          ))}
        </div>
      </div>
      <div style={{overflowX:"auto"}}>
        <table style={{width:"100%",borderCollapse:"collapse",minWidth:400}}>
          <thead>
            <tr style={{background:"rgba(255,255,255,0.02)"}}>
              <th style={{padding:"8px 16px",textAlign:"left",fontSize:9,fontWeight:700,color:"#64748B",textTransform:"uppercase",letterSpacing:0.8,borderBottom:"1px solid "+T.border}}>Metric</th>
              {items.map(n=>(<th key={n.community} style={{padding:"8px 16px",textAlign:"center",fontSize:11,fontWeight:700,color:T.gold,borderBottom:"1px solid "+T.border}}>{n.community}</th>))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row,i)=>(
              <tr key={i} style={{borderBottom:i<rows.length-1?"1px solid "+T.border+"30":"none",background:i%2===0?"transparent":"rgba(255,255,255,0.01)"}}>
                <td style={{padding:"10px 16px",fontSize:11,color:"#94A3B8",fontWeight:600}}>{row.label}</td>
                {items.map(n=>(
                  <td key={n.community} style={{padding:"10px 16px",textAlign:"center",fontSize:12,fontWeight:700,color:T.white}}>
                    {row.fmt(n[row.key])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// 
// MAIN COMPONENT
// 
export default function NeighbourhoodsTab({
  liveNeighbourhoods=[], handleTabChange,
  selectedNbhd, setSelectedNbhd,
}) {
  const [search,  setSearch]  = useState("");
  const [sortBy,  setSortBy]  = useState("score");
  const [compare, setCompare] = useState([]);
  const [view,      setView]      = useState("grid");
  const [tierFilter, setTierFilter] = useState("all");

  const toggleCompare = c => setCompare(prev =>
    prev.includes(c) ? prev.filter(x=>x!==c) : prev.length<3 ? [...prev,c] : prev
  );

  const filtered = useMemo(()=>{
    let a = [...liveNeighbourhoods];
    if(search.trim()) a = a.filter(n=>(n.community||"").toLowerCase().includes(search.toLowerCase()));
    if(tierFilter!=="all") a = a.filter(n=>n.tier===tierFilter);
    a.sort((x,y)=>{
      if(sortBy==="score")  return (y.investmentScore||0)-(x.investmentScore||0);
      if(sortBy==="yield")  return parseFloat(y.grossYield||0)-parseFloat(x.grossYield||0);
      if(sortBy==="ppsf")   return (y.avgPpsf||0)-(x.avgPpsf||0);
      if(sortBy==="name")   return (x.community||"").localeCompare(y.community||"");
      if(sortBy==="projects") return (y.totalProjects||0)-(x.totalProjects||0);
      return 0;
    });
    return a;
  },[liveNeighbourhoods,search,sortBy,tierFilter]);

  const topYield  = [...liveNeighbourhoods].sort((a,b)=>parseFloat(b.grossYield||0)-parseFloat(a.grossYield||0))[0];
  const topScore  = [...liveNeighbourhoods].sort((a,b)=>(b.investmentScore||0)-(a.investmentScore||0))[0];
  const mostProj  = [...liveNeighbourhoods].sort((a,b)=>(b.totalProjects||0)-(a.totalProjects||0))[0];

  const selStyle = {padding:"7px 12px",background:"rgba(255,255,255,0.04)",border:"1px solid "+T.border,borderRadius:7,color:"#CBD5E1",fontSize:11,outline:"none",fontFamily:"'Outfit',sans-serif"};

  return (
    <div style={{paddingBottom:60}}>

      {/*  HEADER  */}
      <div style={{marginBottom:20}}>
        <h2 style={{margin:0,fontSize:20,fontWeight:900,color:T.white,fontFamily:"'Fraunces',serif"}}>Neighbourhoods</h2>
        <p style={{margin:"4px 0 0",fontSize:12,color:"#94A3B8"}}>{liveNeighbourhoods.length} verified Emaar communities  Real yields, distances, investment scores</p>
      </div>

      {/*  HIGHLIGHT CARDS  */}
      {liveNeighbourhoods.length>0&&(
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:20}}>
          {[
            {label:"Highest Yield",   icon:"", comm:topYield,  value:topYield?fmtY(topYield.grossYield):"", color:"#10B981"},
            {label:"Top Rated",       icon:"", comm:topScore,  value:topScore?"Score "+topScore.investmentScore:"", color:T.gold},
            {label:"Most Projects",   icon:"", comm:mostProj,  value:mostProj?mostProj.totalProjects+" projects":"", color:"#3B82F6"},
          ].map((h,i)=>(
            <div key={i} onClick={()=>h.comm&&setSelectedNbhd(h.comm)}
              style={{background:"rgba(255,255,255,0.02)",border:"1px solid "+T.border,borderRadius:12,padding:"14px 16px",cursor:h.comm?"pointer":"default",position:"relative",overflow:"hidden"}}
              onMouseEnter={e=>h.comm&&(e.currentTarget.style.borderColor="rgba(212,168,67,0.3)")}
              onMouseLeave={e=>h.comm&&(e.currentTarget.style.borderColor=T.border)}
            >
              <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:h.color,opacity:0.8}}/>
              <div style={{fontSize:9,fontWeight:700,color:"#64748B",textTransform:"uppercase",letterSpacing:0.8,marginBottom:4}}>{h.icon} {h.label}</div>
              <div style={{fontSize:16,fontWeight:900,color:h.color,fontFamily:"'Fraunces',serif",marginBottom:2}}>{h.value}</div>
              <div style={{fontSize:11,color:"#94A3B8",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{h.comm?.community||""}</div>
            </div>
          ))}
        </div>
      )}

      {/*  TOOLBAR  */}
      <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:16,flexWrap:"wrap"}}>
        <div style={{flex:"1 1 240px",display:"flex",alignItems:"center",gap:8,padding:"7px 12px",background:"rgba(255,255,255,0.03)",border:"1px solid "+(search?T.gold:T.border),borderRadius:8}}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search community..."
            style={{flex:1,background:"none",border:"none",outline:"none",color:T.white,fontSize:12,fontFamily:"'Outfit',sans-serif"}}/>
          {search&&<button type="button" onClick={()=>setSearch("")} style={{background:"none",border:"none",color:"#94A3B8",cursor:"pointer",fontSize:14}}></button>}
        </div>
        <select value={tierFilter} onChange={e=>setTierFilter(e.target.value)} style={selStyle}>
          <option value="all">All Communities</option>
          <option value="verified"> Verified (Emaar)</option>
          <option value="dld-registry">DLD Registry</option>
        </select>
        <select value={sortBy} onChange={e=>setSortBy(e.target.value)} style={selStyle}>
          <option value="score">Sort: Investment Score</option>
          <option value="yield">Sort: Highest Yield</option>
          <option value="ppsf">Sort: Highest PPSF</option>
          <option value="projects">Sort: Most Projects</option>
          <option value="name">Sort: A-Z</option>
        </select>
        <div style={{display:"flex",gap:2,background:"rgba(255,255,255,0.03)",border:"1px solid "+T.border,borderRadius:7,padding:2}}>
          {[{k:"grid",icon:""},{k:"table",icon:""}].map(v=>(
            <button key={v.k} type="button" onClick={()=>setView(v.k)}
              style={{padding:"5px 10px",borderRadius:5,border:view===v.k?"1px solid "+T.gold:"1px solid transparent",background:view===v.k?"rgba(212,168,67,0.15)":"transparent",color:view===v.k?T.gold:"#94A3B8",cursor:"pointer",fontSize:13}}>
              {v.icon}
            </button>
          ))}
        </div>
        <span style={{fontSize:11,color:"#94A3B8"}}>{filtered.length} communities</span>
      </div>

      {/*  COMPARE PANEL  */}
      {compare.length>=2&&<ComparePanel communities={compare} data={liveNeighbourhoods} onRemove={c=>setCompare(p=>p.filter(x=>x!==c))}/>}
      {compare.length===1&&(
        <div style={{padding:"10px 16px",background:"rgba(212,168,67,0.06)",border:"1px solid rgba(212,168,67,0.2)",borderRadius:10,marginBottom:12,fontSize:11,color:T.gold}}>
           {compare[0]} selected  Pick one more community to compare
        </div>
      )}

      {/*  EMPTY STATE  */}
      {liveNeighbourhoods.length===0&&(
        <div style={{padding:"60px 20px",textAlign:"center"}}>
          <div style={{fontSize:40,marginBottom:12}}>[ ]</div>
          <div style={{fontSize:16,fontWeight:700,color:T.white,marginBottom:6}}>No community data yet</div>
          <div style={{fontSize:12,color:"#94A3B8"}}>Community intelligence will appear here once projects are configured</div>
        </div>
      )}

      {/*  GRID VIEW  */}
      {view==="grid"&&filtered.length>0&&(
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:14}}>
          {filtered.map((n,i)=>(
            <CommunityCard key={i} n={n}
              selected={selectedNbhd?.community===n.community}
              onSelect={setSelectedNbhd}
              onCompare={toggleCompare}
              isCompared={compare.includes(n.community)}
            />
          ))}
        </div>
      )}

      {/*  TABLE VIEW  */}
      {view==="table"&&filtered.length>0&&(
        <div style={{background:"rgba(255,255,255,0.02)",border:"1px solid "+T.border,borderRadius:14,overflow:"hidden"}}>
          <div style={{overflowX:"auto"}}>
            <div style={{display:"grid",gridTemplateColumns:"2fr 60px 80px 80px 80px 80px 80px 80px",minWidth:680,padding:"8px 16px",fontSize:9,fontWeight:700,color:"#64748B",textTransform:"uppercase",letterSpacing:0.8,borderBottom:"1px solid "+T.border}}>
              {["Community","Score","Gross Yield","Net Yield","PPSF","Svc Charge","Metro","Risk"].map((h,i)=>(
                <div key={i} style={{textAlign:i>0?"center":"left"}}>{h}</div>
              ))}
            </div>
            {filtered.map((n,i)=>(
              <div key={i} onClick={()=>setSelectedNbhd(n)}
                style={{display:"grid",gridTemplateColumns:"2fr 60px 80px 80px 80px 80px 80px 80px",minWidth:680,padding:"12px 16px",alignItems:"center",borderBottom:i<filtered.length-1?"1px solid "+T.border+"30":"none",cursor:"pointer",background:i%2===0?"transparent":"rgba(255,255,255,0.01)"}}
                onMouseEnter={e=>e.currentTarget.style.background="rgba(212,168,67,0.03)"}
                onMouseLeave={e=>e.currentTarget.style.background=i%2===0?"transparent":"rgba(255,255,255,0.01)"}
              >
                <div>
                  <div style={{fontSize:13,fontWeight:600,color:T.white}}>{n.community}</div>
                  <div style={{fontSize:10,color:"#64748B"}}>{n.totalProjects} projects</div>
                </div>
                <div style={{textAlign:"center"}}><ScoreBadge score={n.investmentScore}/></div>
                <div style={{fontSize:12,fontWeight:700,color:parseFloat(n.grossYield||0)>=7?"#10B981":parseFloat(n.grossYield||0)>=6?"#84CC16":T.gold,textAlign:"center"}}>{fmtY(n.grossYield)}</div>
                <div style={{fontSize:12,color:"#CBD5E1",textAlign:"center"}}>{fmtY(n.netYield)}</div>
                <div style={{fontSize:12,color:T.gold,textAlign:"center"}}>{fmtP(n.avgPpsf)}</div>
                <div style={{fontSize:11,color:"#94A3B8",textAlign:"center"}}>{n.serviceCharge?"AED "+n.serviceCharge:""}</div>
                <div style={{fontSize:11,color:"#94A3B8",textAlign:"center"}}>{fmtD(n.distMetro)}</div>
                <div style={{textAlign:"center"}}>
                  <span style={{fontSize:10,padding:"2px 7px",borderRadius:6,background:RISK_COLOR[n.supplyRisk||"Unknown"]+"18",color:RISK_COLOR[n.supplyRisk||"Unknown"],fontWeight:600}}>{n.supplyRisk||""}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/*  DETAIL DRAWER  */}
      {selectedNbhd&&(
        <DetailDrawer n={selectedNbhd} onClose={()=>setSelectedNbhd(null)} handleTabChange={handleTabChange}/>
      )}

      {/*  SOURCES  */}
      <div style={{marginTop:24,paddingTop:12,borderTop:"1px solid "+T.border,display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
        <span style={{fontSize:10,color:"#64748B"}}>Sources:</span>
        {["Emaar Projects Database","Dubai Land Department","RERA Service Charges","RTA Metro Data"].map((s,i)=>(
          <span key={i} style={{fontSize:10,color:"#64748B",padding:"2px 8px",borderRadius:8,border:"1px solid rgba(255,255,255,0.06)"}}>{s}</span>
        ))}
      </div>

    </div>
  );
}