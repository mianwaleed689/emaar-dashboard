/* eslint-disable */
/*
  DXB ANALYTICS  NEIGHBOURHOODS TAB
  Session 14  World Class Rebuild
  259 communities | Google Maps verified data
  Real yields, distances, facilities, landmarks
*/

import React, { useState, useMemo } from "react";
import { T } from "../data";
import { scoreColor } from "../utils/scoring";

//  FORMATTERS 
const fmtY  = n => n ? parseFloat(n).toFixed(1)+"%" : "";
const fmtP  = n => n ? "AED "+Math.round(n).toLocaleString() : "";
const fmtD  = n => n!=null ? parseFloat(n).toFixed(1)+" km" : "";
const fmtSC = n => n ? "AED "+n+"/sqft/yr" : "";
const fmtMin= n => n ? n+"min drive" : "";

const RISK_COLOR = {
  Low:"#10B981","Low-Medium":"#84CC16",Medium:"#F59E0B",
  "Medium-High":"#FB923C",High:"#EF4444",Unknown:"#94A3B8"
};

const Chip = ({icon,label,color,bg,size=10}) => (
  <span style={{fontSize:size,padding:"2px 8px",borderRadius:10,background:bg||(color||"#94A3B8")+"18",color:color||"#94A3B8",fontWeight:600,whiteSpace:"nowrap",display:"inline-flex",alignItems:"center",gap:3}}>
    {icon&&<span>{icon}</span>}{label}
  </span>
);

const ScoreBadge = ({score,size="sm"}) => {
  if(!score) return <span style={{fontSize:11,color:"#94A3B8"}}>N/A</span>;
  const color = scoreColor(score);
  const dim = size==="lg"?48:34;
  return (
    <div style={{width:dim,height:dim,borderRadius:"50%",background:color+"18",border:"2px solid "+color,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
      <span style={{fontSize:size==="lg"?14:11,fontWeight:800,color,fontFamily:"'Fraunces',serif"}}>{score}</span>
    </div>
  );
};

//  COMMUNITY CARD 
const CommunityCard = ({n,selected,onSelect,onCompare,isCompared}) => {
  const isDLD    = n.tier==="dld-registry";
  const isArea   = n.tier==="area-data";
  const riskColor= RISK_COLOR[n.supplyRisk||"Unknown"];
  const grossY   = parseFloat(n.grossYield||0);
  const yColor   = grossY>=7?"#10B981":grossY>=6?"#84CC16":grossY>=5?T.gold:"#94A3B8";

  return (
    <div onClick={()=>onSelect(n)}
      style={{background:selected?"rgba(212,168,67,0.06)":"rgba(255,255,255,0.02)",border:"1px solid "+(selected?T.gold:T.border),borderRadius:14,padding:16,cursor:"pointer",transition:"all 0.15s",position:"relative",overflow:"hidden"}}
      onMouseEnter={e=>{if(!selected){e.currentTarget.style.background="rgba(255,255,255,0.04)";e.currentTarget.style.borderColor="rgba(212,168,67,0.3)";}}} 
      onMouseLeave={e=>{if(!selected){e.currentTarget.style.background="rgba(255,255,255,0.02)";e.currentTarget.style.borderColor=T.border;}}}
    >
      <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:"linear-gradient(90deg,"+yColor+","+yColor+"40)"}}/>

      {/* Header */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
        <div style={{flex:1,minWidth:0,paddingRight:8}}>
          <div style={{fontSize:13,fontWeight:700,color:T.white,marginBottom:4,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{n.community}</div>
          <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
            {isDLD ? <Chip label="DLD" color="#64748B"/> : <Chip label=" Verified" color="#10B981"/>}
            {n.hasMetro&&<Chip icon="" label="Metro" color="#10B981"/>}
            {n.hasBeach&&<Chip icon="" label="Beach" color="#06B6D4"/>}
            {n.goldenVisa&&<Chip icon="" label="GV" color={T.gold}/>}
            {n.hasSports&&<Chip icon="" label="Sports" color="#8B5CF6"/>}
          </div>
        </div>
        <ScoreBadge score={n.investmentScore}/>
      </div>

      {/* Metrics */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:10}}>
        {(n.tier==="dld-registry" ? [
          {label:"Median PPSF",  value:fmtP(n.avgPpsf),         color:T.gold},
          {label:"Transactions", value:n.totalTransactions||"", color:"#94A3B8"},
        ] : [
          {label:"Gross Yield",  value:fmtY(n.grossYield),       color:yColor},
          {label:"Net Yield",    value:fmtY(n.netYield),         color:"#CBD5E1"},
          {label:"Avg PPSF",     value:fmtP(n.avgPpsf),          color:T.gold},
          {label:"Svc Charge",   value:fmtSC(n.serviceCharge),   color:"#94A3B8"},
        ]).map((m,i)=>(
          <div key={i} style={{background:"rgba(255,255,255,0.03)",borderRadius:7,padding:"7px 9px"}}>
            <div style={{fontSize:9,fontWeight:700,color:"#64748B",textTransform:"uppercase",letterSpacing:0.7,marginBottom:2}}>{m.label}</div>
            <div style={{fontSize:13,fontWeight:700,color:m.color,fontFamily:"'Fraunces',serif"}}>{m.value}</div>
          </div>
        ))}
      </div>

      {/* Distances row */}
      {!isDLD&&(
        <div style={{display:"flex",gap:8,marginBottom:10,flexWrap:"wrap"}}>
          {n.distMetro!=null&&<span style={{fontSize:10,color:"#94A3B8"}}> {fmtD(n.distMetro)}</span>}
          {n.distMall!=null&&<span style={{fontSize:10,color:"#94A3B8"}}> {fmtD(n.distMall)}</span>}
          {n.distBeach!=null&&parseFloat(n.distBeach)<30&&<span style={{fontSize:10,color:"#94A3B8"}}> {fmtD(n.distBeach)}</span>}
          {n.distAirport&&<span style={{fontSize:10,color:"#94A3B8"}}> {fmtD(n.distAirport)}</span>}
        </div>
      )}

      {/* Footer */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{display:"flex",alignItems:"center",gap:5}}>
          <div style={{width:6,height:6,borderRadius:"50%",background:riskColor}}/>
          <span style={{fontSize:10,color:riskColor,fontWeight:600}}>{n.supplyRisk||""} Risk</span>
        </div>
        <button type="button" onClick={e=>{e.stopPropagation();onCompare(n.community);}}
          style={{padding:"3px 9px",borderRadius:7,border:"1px solid "+(isCompared?T.gold:T.border),background:isCompared?"rgba(212,168,67,0.12)":"transparent",color:isCompared?T.gold:"#94A3B8",fontSize:10,fontWeight:600,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>
          {isCompared?" Added":"Compare"}
        </button>
      </div>
    </div>
  );
};

//  DETAIL DRAWER 
const DetailDrawer = ({n,onClose,handleTabChange}) => {
  const [tab,setTab] = useState("overview");
  if(!n) return null;
  const isDLD  = n.tier==="dld-registry";
  const grossY = parseFloat(n.grossYield||0);
  const yColor = grossY>=7?"#10B981":grossY>=6?"#84CC16":grossY>=5?T.gold:"#94A3B8";
  const rColor = RISK_COLOR[n.supplyRisk||"Unknown"];

  React.useEffect(()=>{ 
    const prev=document.body.style.overflow;
    document.body.style.overflow="hidden";
    const onKey=e=>{if(e.key==="Escape")onClose();};
    window.addEventListener("keydown",onKey);
    return()=>{document.body.style.overflow=prev;window.removeEventListener("keydown",onKey);};
  },[]);

  const Stat=({label,value,color,hint,icon})=>(
    <div style={{background:"rgba(255,255,255,0.03)",borderRadius:10,padding:"11px 13px"}}>
      <div style={{fontSize:9,fontWeight:700,color:"#64748B",letterSpacing:0.8,textTransform:"uppercase",marginBottom:4}}>{icon&&icon+" "}{label}</div>
      <div style={{fontSize:18,fontWeight:700,color:color||T.white,fontFamily:"'Fraunces',serif",lineHeight:1}}>{value}</div>
      {hint&&<div style={{fontSize:10,color:"#94A3B8",marginTop:3}}>{hint}</div>}
    </div>
  );

  const FacilityRow=({icon,label,name,dist,color})=>(
    <div style={{display:"flex",alignItems:"center",gap:10,padding:"9px 0",borderBottom:"1px solid "+T.border+"20"}}>
      <div style={{width:32,height:32,borderRadius:8,background:(color||"#94A3B8")+"18",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>{icon}</div>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontSize:11,fontWeight:600,color:T.white,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{name||""}</div>
        <div style={{fontSize:10,color:"#64748B"}}>{label}</div>
      </div>
      <div style={{fontSize:12,fontWeight:700,color:dist?color||T.gold:"#64748B",flexShrink:0}}>{dist?fmtD(dist):""}</div>
    </div>
  );

  const DRAWER_TABS = [
    {k:"overview",  l:"Overview"},
    {k:"investment",l:"Investment"},
    {k:"facilities",l:"Facilities"},
    {k:"landmarks", l:"Landmarks"},
    {k:"lifestyle", l:"Lifestyle"},
  ];

  return (
    <React.Fragment>
      <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.65)",backdropFilter:"blur(3px)",zIndex:1000}}/>
      <div style={{position:"fixed",top:0,right:0,bottom:0,width:"min(580px,100vw)",background:"#0D1117",borderLeft:"1px solid "+T.border,zIndex:1001,overflowY:"auto",fontFamily:"'Outfit',sans-serif"}}>

        {/* Sticky header */}
        <div style={{position:"sticky",top:0,zIndex:2,background:"#0D1117",borderBottom:"1px solid "+T.border,padding:"16px 20px"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
            <div style={{flex:1,minWidth:0,paddingRight:12}}>
              <div style={{display:"flex",gap:5,alignItems:"center",marginBottom:5,flexWrap:"wrap"}}>
                {isDLD?<Chip label="DLD Registry" color="#64748B"/>:<Chip label=" Verified" color="#10B981"/>}
                {n.goldenVisa&&<Chip icon="" label="Golden Visa" color={T.gold}/>}
                {n.hasBeach&&<Chip icon="" label="Waterfront" color="#06B6D4"/>}
                {n.hasMetro&&<Chip icon="" label="Metro Access" color="#10B981"/>}
              </div>
              <div style={{fontSize:20,fontWeight:700,color:T.white,fontFamily:"'Fraunces',serif",marginBottom:3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{n.community}</div>
              <div style={{fontSize:11,color:"#94A3B8"}}>
                {n.nearestMetro||n.area||"Dubai"}
                {n.totalProjects?"  "+n.totalProjects+" projects":""}
              </div>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
              <ScoreBadge score={n.investmentScore} size="lg"/>
              <button type="button" onClick={onClose} style={{background:"rgba(255,255,255,0.06)",border:"1px solid "+T.border,borderRadius:8,color:"#94A3B8",width:32,height:32,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}></button>
            </div>
          </div>
          <div style={{display:"flex",gap:0,borderTop:"1px solid "+T.border+"40",marginTop:10}}>
            {DRAWER_TABS.map(t=>(
              <button key={t.k} type="button" onClick={()=>setTab(t.k)}
                style={{flex:1,padding:"8px 0",border:"none",borderBottom:tab===t.k?"2px solid "+T.gold:"2px solid transparent",background:"transparent",color:tab===t.k?T.gold:"#94A3B8",fontSize:11,fontWeight:tab===t.k?600:400,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>
                {t.l}
              </button>
            ))}
          </div>
        </div>

        <div style={{padding:"16px 20px"}}>

          {/*  OVERVIEW TAB  */}
          {tab==="overview"&&(
            <div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
                <Stat label="Gross Yield"  value={fmtY(n.grossYield)}  color={yColor}/>
                <Stat label="Net Yield"    value={fmtY(n.netYield)}    color="#CBD5E1"/>
                <Stat label="Avg PPSF"     value={fmtP(n.avgPpsf)}     color={T.gold}/>
                <Stat label="Supply Risk"  value={n.supplyRisk||""}   color={rColor}/>
              </div>
              {n.nearestMetro&&(
                <div style={{padding:"11px 14px",background:"rgba(16,185,129,0.06)",border:"1px solid rgba(16,185,129,0.2)",borderRadius:10,marginBottom:12,display:"flex",alignItems:"center",gap:10}}>
                  <span style={{fontSize:22}}></span>
                  <div>
                    <div style={{fontSize:12,fontWeight:600,color:T.white}}>{n.nearestMetro}</div>
                    <div style={{fontSize:11,color:"#94A3B8"}}>{fmtD(n.distMetro)} from community</div>
                  </div>
                </div>
              )}
              <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:14}}>
                {n.hasBeach&&<Chip icon="" label="Waterfront" color="#06B6D4"/>}
                {n.hasSchool&&<Chip icon="" label={n.nearestSchool||"School nearby"} color="#8B5CF6"/>}
                {n.hasHospital&&<Chip icon="" label={n.nearestHospital||"Hospital nearby"} color="#EF4444"/>}
                {n.hasMall&&<Chip icon="" label={n.nearestMall||"Mall nearby"} color={T.gold}/>}
                {n.hasSports&&<Chip icon="" label={n.nearestSports||"Sports"} color="#8B5CF6"/>}
                {n.hasPark&&<Chip icon="" label={n.nearestPark||"Park nearby"} color="#10B981"/>}
                {n.goldenVisa&&<Chip icon="" label="Golden Visa Eligible" color={T.gold}/>}
              </div>
              <div style={{display:"flex",gap:8}}>
                <button type="button" onClick={()=>handleTabChange?.("Yields")} style={{flex:1,padding:"9px",borderRadius:8,border:"1px solid "+T.border,background:"rgba(20,184,166,0.06)",color:"#14B8A6",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>View Yields </button>
                <button type="button" onClick={()=>handleTabChange?.("Price History")} style={{flex:1,padding:"9px",borderRadius:8,border:"1px solid "+T.border,background:"rgba(212,168,67,0.06)",color:T.gold,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>Price History </button>
              </div>
            </div>
          )}

          {/*  INVESTMENT TAB  */}
          {tab==="investment"&&(
            <div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
                <Stat label="Gross Yield"   value={fmtY(n.grossYield)}       color={yColor}    hint="Annual rental income / price"/>
                <Stat label="Net Yield"     value={fmtY(n.netYield)}         color="#CBD5E1"   hint="After service charge"/>
                <Stat label="Avg PPSF"      value={fmtP(n.avgPpsf)}          color={T.gold}    hint="Price per sq ft"/>
                <Stat label="Service Charge" value={fmtSC(n.serviceCharge)}  color="#94A3B8"   hint="Annual maintenance"/>
                {n.priceMin&&<Stat label="Starting Price" value={fmtP(n.priceMin)} color="#10B981" hint="Lowest listed"/>}
                {n.priceMax&&<Stat label="Max Price"      value={fmtP(n.priceMax)} color="#EF4444" hint="Highest listed"/>}
              </div>
              {n.goldenVisa&&(
                <div style={{padding:"12px 14px",background:"rgba(212,168,67,0.08)",border:"1px solid rgba(212,168,67,0.3)",borderRadius:10,marginBottom:12}}>
                  <div style={{fontSize:12,fontWeight:700,color:T.gold,marginBottom:4}}> UAE Golden Visa Eligible</div>
                  <div style={{fontSize:11,color:"#94A3B8",lineHeight:1.6}}>Properties AED 2M+ qualify for 10-year UAE Golden Visa residency for investor and family.</div>
                </div>
              )}
              {/* Score breakdown */}
              <div style={{background:"rgba(255,255,255,0.02)",border:"1px solid "+T.border,borderRadius:10,padding:"14px"}}>
                <div style={{fontSize:11,fontWeight:700,color:T.white,marginBottom:10}}>Investment Score Breakdown</div>
                {[
                  {label:"Rental Yield",  score:grossY>=9?20:grossY>=8?18:grossY>=7?15:grossY>=6?12:grossY>=5?8:5, max:20},
                  {label:"Metro Access",  score:parseFloat(n.distMetro||99)<0.5?12:parseFloat(n.distMetro||99)<1?10:parseFloat(n.distMetro||99)<2?7:parseFloat(n.distMetro||99)<3?5:parseFloat(n.distMetro||99)<5?2:0, max:12},
                  {label:"PPSF Premium",  score:(n.avgPpsf||0)>=4000?8:(n.avgPpsf||0)>=3000?7:(n.avgPpsf||0)>=2000?5:(n.avgPpsf||0)>=1500?3:(n.avgPpsf||0)>=1000?1:0, max:8},
                  {label:"Waterfront",    score:n.hasBeach?8:0, max:8},
                  {label:"Amenities",     score:(n.hasMall?3:0)+(n.hasSchool?2:0)+(n.hasMetro?3:0)+(n.hasSports?1:0), max:9},
                  {label:"Golden Visa",   score:n.goldenVisa?5:0, max:5},
                ].map((r,i)=>(
                  <div key={i} style={{marginBottom:8}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                      <span style={{fontSize:11,color:"#94A3B8"}}>{r.label}</span>
                      <span style={{fontSize:11,fontWeight:700,color:T.gold}}>{r.score}/{r.max}</span>
                    </div>
                    <div style={{height:3,borderRadius:2,background:"rgba(255,255,255,0.05)"}}>
                      <div style={{height:"100%",width:(r.max>0?r.score/r.max*100:0)+"%",background:T.gold,borderRadius:2,opacity:0.8}}/>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/*  FACILITIES TAB  */}
          {tab==="facilities"&&(
            <div>
              <div style={{fontSize:11,color:"#94A3B8",marginBottom:12}}>All distances are real driving distances from Google Maps</div>
              <FacilityRow icon="" label="Nearest Metro"       name={n.nearestMetro}       dist={n.distMetro}    color="#10B981"/>
              <FacilityRow icon="" label="Nearest School"      name={n.nearestSchool}      dist={n.distSchool}   color="#8B5CF6"/>
              <FacilityRow icon="" label="Nearest Hospital"    name={n.nearestHospital}    dist={n.distHospital} color="#EF4444"/>
              <FacilityRow icon="" label="Nearest Mall"        name={n.nearestMall}        dist={n.distMall}     color={T.gold}/>
              <FacilityRow icon="" label="Nearest Beach"       name={n.nearestBeach}       dist={n.distBeach}    color="#06B6D4"/>
              <FacilityRow icon="" label="Nearest Supermarket" name={n.nearestSupermarket} dist={n.distSupermarket} color="#10B981"/>
              <FacilityRow icon="" label="Nearest Park"        name={n.nearestPark}        dist={n.distPark}     color="#10B981"/>
              <FacilityRow icon="" label="Nearest Mosque"      name={n.nearestMosque}      dist={n.distMosque}   color="#F59E0B"/>
              <FacilityRow icon="" label="Nearest Nursery"     name={n.nearestNursery}     dist={n.distNursery}  color="#8B5CF6"/>
              <FacilityRow icon="" label="Nearest Pharmacy"    name={n.nearestPharmacy}    dist={n.distPharmacy} color="#EF4444"/>
              <FacilityRow icon="" label="Top Restaurant"      name={n.nearestRestaurant}  dist={n.distRestaurant} color="#F59E0B"/>
              <FacilityRow icon="" label="DXB Airport"         name="Dubai Int'l Airport"  dist={n.distAirport}  color="#94A3B8"/>
            </div>
          )}

          {/*  LANDMARKS TAB  */}
          {tab==="landmarks"&&(
            <div>
              <div style={{fontSize:11,color:"#94A3B8",marginBottom:12}}>Real driving distances and times from Google Maps</div>
              {n.landmarks ? (
                <div style={{display:"flex",flexDirection:"column",gap:1}}>
                  {Object.entries(n.landmarks).map(([key,lm])=>(
                    lm && (
                      <div key={key} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 0",borderBottom:"1px solid "+T.border+"20"}}>
                        <span style={{fontSize:12,color:T.white,fontWeight:500}}>{lm.name}</span>
                        <div style={{display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
                          <span style={{fontSize:12,fontWeight:700,color:T.gold}}>{lm.distKm} km</span>
                          <span style={{fontSize:10,color:"#64748B",background:"rgba(255,255,255,0.04)",padding:"2px 7px",borderRadius:6}}>{lm.duration} min</span>
                        </div>
                      </div>
                    )
                  ))}
                </div>
              ) : (
                <div style={{padding:"30px",textAlign:"center",color:"#94A3B8",fontSize:12}}>Landmark data not available</div>
              )}
            </div>
          )}

          {/*  LIFESTYLE TAB  */}
          {tab==="lifestyle"&&(
            <div>
              {/* Sports */}
              <div style={{marginBottom:14}}>
                <div style={{fontSize:11,fontWeight:700,color:T.white,marginBottom:8}}> Sports Facilities</div>
                {n.sportsNearby&&n.sportsNearby.length>0 ? (
                  <div style={{display:"flex",flexDirection:"column",gap:6}}>
                    {n.sportsNearby.slice(0,6).map((s,i)=>(
                      <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 10px",background:"rgba(139,92,246,0.06)",borderRadius:8,border:"1px solid rgba(139,92,246,0.15)"}}>
                        <div>
                          <div style={{fontSize:11,fontWeight:600,color:T.white}}>{s.name}</div>
                          {s.rating&&<div style={{fontSize:10,color:"#F59E0B"}}> {s.rating}</div>}
                        </div>
                        <span style={{fontSize:11,fontWeight:700,color:"#8B5CF6"}}>{s.distKm} km</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{fontSize:11,color:"#94A3B8",padding:"10px",background:"rgba(255,255,255,0.02)",borderRadius:8}}>No sports facilities found nearby</div>
                )}
              </div>
              {/* Parks */}
              <FacilityRow icon="" label="Nearest Park"    name={n.nearestPark}    dist={n.distPark}    color="#10B981"/>
              <FacilityRow icon="" label="Nearest Mosque"  name={n.nearestMosque}  dist={n.distMosque}  color="#F59E0B"/>
              <FacilityRow icon="" label="Nearest Nursery" name={n.nearestNursery} dist={n.distNursery} color="#8B5CF6"/>
              <FacilityRow icon="" label="Top Restaurant"  name={n.nearestRestaurant} dist={n.distRestaurant} color="#F59E0B"/>
              <FacilityRow icon="" label="Supermarket"     name={n.nearestSupermarket} dist={n.distSupermarket} color="#10B981"/>
              <FacilityRow icon="" label="Pharmacy"        name={n.nearestPharmacy} dist={n.distPharmacy} color="#EF4444"/>
            </div>
          )}

        </div>
      </div>
    </React.Fragment>
  );
};

//  COMPARE TABLE 
const ComparePanel = ({communities,data,onRemove}) => {
  if(communities.length<2) return null;
  const items = communities.map(c=>data.find(n=>n.community===c)).filter(Boolean);
  if(items.length<2) return null;
  const rows = [
    {label:"Score",         key:"investmentScore",   fmt:v=>v||""},
    {label:"Gross Yield",   key:"grossYield",         fmt:fmtY},
    {label:"Net Yield",     key:"netYield",           fmt:fmtY},
    {label:"PPSF",          key:"avgPpsf",            fmt:fmtP},
    {label:"Service Charge",key:"serviceCharge",      fmt:n=>n?"AED "+n+"/sqft":""},
    {label:"Metro",         key:"distMetro",          fmt:fmtD},
    {label:"Beach",         key:"distBeach",          fmt:fmtD},
    {label:"Mall",          key:"nearestMall",        fmt:v=>v||""},
    {label:"School",        key:"nearestSchool",      fmt:v=>v||""},
    {label:"Hospital",      key:"nearestHospital",    fmt:v=>v||""},
    {label:"Airport",       key:"distAirport",        fmt:fmtD},
    {label:"Dubai Mall",    key:"landmarks",          fmt:v=>v?.dubaiMall?v.dubaiMall.distKm+"km  "+v.dubaiMall.duration+"min":""},
    {label:"Supply Risk",   key:"supplyRisk",         fmt:v=>v||""},
    {label:"Golden Visa",   key:"goldenVisa",         fmt:v=>v?" Yes":""},
  ];
  return (
    <div style={{background:"rgba(255,255,255,0.02)",border:"1px solid "+T.border,borderRadius:14,overflow:"hidden",marginBottom:16}}>
      <div style={{padding:"14px 18px",borderBottom:"1px solid "+T.border,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{fontSize:13,fontWeight:700,color:T.white}}>Community Comparison</div>
        <div style={{display:"flex",gap:6}}>
          {items.map(n=>(
            <span key={n.community} style={{fontSize:10,padding:"3px 10px",borderRadius:20,background:"rgba(212,168,67,0.12)",color:T.gold,display:"flex",alignItems:"center",gap:5}}>
              {n.community}
              <button type="button" onClick={()=>onRemove(n.community)} style={{background:"none",border:"none",color:"#94A3B8",cursor:"pointer",fontSize:14,padding:0}}></button>
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
                <td style={{padding:"9px 16px",fontSize:11,color:"#94A3B8",fontWeight:600}}>{row.label}</td>
                {items.map(n=>(
                  <td key={n.community} style={{padding:"9px 16px",textAlign:"center",fontSize:11,fontWeight:600,color:T.white}}>
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
export default function NeighbourhoodsTab({liveNeighbourhoods=[],handleTabChange,selectedNbhd,setSelectedNbhd}) {
  const [search,      setSearch]      = useState("");
  const [sortBy,      setSortBy]      = useState("score");
  const [tierFilter,  setTierFilter]  = useState("all");
  const [yieldFilter, setYieldFilter] = useState("all");
  const [metroFilter, setMetroFilter] = useState(false);
  const [beachFilter, setBeachFilter] = useState(false);
  const [sportsFilter,setSportsFilter]= useState(false);
  const [gvFilter,    setGvFilter]    = useState(false);
  const [compare,     setCompare]     = useState([]);
  const [view,        setView]        = useState("grid");

  const toggleCompare = c => setCompare(prev=>
    prev.includes(c)?prev.filter(x=>x!==c):prev.length<3?[...prev,c]:prev
  );

  const filtered = useMemo(()=>{
    let a=[...liveNeighbourhoods];
    if(search.trim()) a=a.filter(n=>(n.community||"").toLowerCase().includes(search.toLowerCase()));
    if(tierFilter!=="all") a=a.filter(n=>n.tier===tierFilter);
    if(yieldFilter==="7+") a=a.filter(n=>parseFloat(n.grossYield||0)>=7);
    if(yieldFilter==="6+") a=a.filter(n=>parseFloat(n.grossYield||0)>=6);
    if(yieldFilter==="5+") a=a.filter(n=>parseFloat(n.grossYield||0)>=5);
    if(metroFilter) a=a.filter(n=>n.hasMetro||parseFloat(n.distMetro||99)<=1.5);
    if(beachFilter) a=a.filter(n=>n.hasBeach||parseFloat(n.distBeach||99)<=2);
    if(sportsFilter)a=a.filter(n=>n.hasSports);
    if(gvFilter)    a=a.filter(n=>n.goldenVisa);
    a.sort((x,y)=>{
      if(sortBy==="score")    return (y.investmentScore||0)-(x.investmentScore||0);
      if(sortBy==="yield")    return parseFloat(y.grossYield||0)-parseFloat(x.grossYield||0);
      if(sortBy==="ppsf")     return (y.avgPpsf||0)-(x.avgPpsf||0);
      if(sortBy==="name")     return (x.community||"").localeCompare(y.community||"");
      if(sortBy==="airport")  return (x.distAirport||99)-(y.distAirport||99);
      return 0;
    });
    return a;
  },[liveNeighbourhoods,search,sortBy,tierFilter,yieldFilter,metroFilter,beachFilter,sportsFilter,gvFilter]);

  const verified = liveNeighbourhoods.filter(n=>n.tier==="verified");
  const topYield = [...verified].sort((a,b)=>parseFloat(b.grossYield||0)-parseFloat(a.grossYield||0))[0];
  const topScore = [...verified].sort((a,b)=>(b.investmentScore||0)-(a.investmentScore||0))[0];
  const topBeach = [...liveNeighbourhoods].filter(n=>n.distBeach).sort((a,b)=>parseFloat(a.distBeach)-parseFloat(b.distBeach))[0];

  const selStyle = {padding:"6px 10px",background:"rgba(255,255,255,0.04)",border:"1px solid "+T.border,borderRadius:7,color:"#CBD5E1",fontSize:11,outline:"none",fontFamily:"'Outfit',sans-serif"};
  const FilterBtn = ({active,onClick,label}) => (
    <button type="button" onClick={onClick}
      style={{padding:"5px 10px",borderRadius:7,border:"1px solid "+(active?T.gold:T.border),background:active?"rgba(212,168,67,0.1)":"rgba(255,255,255,0.03)",color:active?T.gold:"#94A3B8",fontSize:11,fontWeight:active?600:400,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>
      {label}
    </button>
  );

  return (
    <div style={{paddingBottom:60}}>

      {/*  HEADER  */}
      <div style={{marginBottom:16}}>
        <h2 style={{margin:0,fontSize:20,fontWeight:900,color:T.white,fontFamily:"'Fraunces',serif"}}>Neighbourhoods</h2>
        <p style={{margin:"4px 0 0",fontSize:12,color:"#94A3B8"}}>
          {liveNeighbourhoods.filter(n=>n.tier==="verified").length} verified · {liveNeighbourhoods.filter(n=>n.tier==="area-data").length} area data · {liveNeighbourhoods.filter(n=>n.tier==="dld-registry").length} DLD only · {liveNeighbourhoods.length} total
        </p>
      </div>

      {/*  HIGHLIGHT CARDS  */}
      {verified.length>0&&(
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:16}}>
          {[
            {label:"Highest Yield",  icon:"",comm:topYield, value:topYield?fmtY(topYield.grossYield):"",  color:"#10B981"},
            {label:"Top Rated",      icon:"",comm:topScore, value:topScore?"Score "+topScore.investmentScore:"",color:T.gold},
            {label:"Nearest Beach",  icon:"",comm:topBeach, value:topBeach?fmtD(topBeach.distBeach):"",   color:"#06B6D4"},
          ].map((h,i)=>(
            <div key={i} onClick={()=>h.comm&&setSelectedNbhd(h.comm)}
              style={{background:"rgba(255,255,255,0.02)",border:"1px solid "+T.border,borderRadius:12,padding:"13px 15px",cursor:h.comm?"pointer":"default",position:"relative",overflow:"hidden"}}
              onMouseEnter={e=>h.comm&&(e.currentTarget.style.borderColor="rgba(212,168,67,0.3)")}
              onMouseLeave={e=>h.comm&&(e.currentTarget.style.borderColor=T.border)}
            >
              <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:h.color,opacity:0.8}}/>
              <div style={{fontSize:9,fontWeight:700,color:"#64748B",textTransform:"uppercase",letterSpacing:0.8,marginBottom:3}}>{h.icon} {h.label}</div>
              <div style={{fontSize:15,fontWeight:900,color:h.color,fontFamily:"'Fraunces',serif",marginBottom:2}}>{h.value}</div>
              <div style={{fontSize:11,color:"#94A3B8",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{h.comm?.community||""}</div>
            </div>
          ))}
        </div>
      )}

      {/*  TOOLBAR  */}
      <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:10,flexWrap:"wrap"}}>
        <div style={{flex:"1 1 220px",display:"flex",alignItems:"center",gap:8,padding:"7px 12px",background:"rgba(255,255,255,0.03)",border:"1px solid "+(search?T.gold:T.border),borderRadius:8}}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search community..."
            style={{flex:1,background:"none",border:"none",outline:"none",color:T.white,fontSize:12,fontFamily:"'Outfit',sans-serif"}}/>
          {search&&<button type="button" onClick={()=>setSearch("")} style={{background:"none",border:"none",color:"#94A3B8",cursor:"pointer",fontSize:14}}></button>}
        </div>
        <select value={tierFilter} onChange={e=>setTierFilter(e.target.value)} style={selStyle}>
          <option value="all">All Areas</option>
          <option value="verified"> Verified</option>
          <option value="dld-registry">DLD Registry</option>
        </select>
        <select value={yieldFilter} onChange={e=>setYieldFilter(e.target.value)} style={selStyle}>
          <option value="all">Any Yield</option>
          <option value="7+">7%+ Yield</option>
          <option value="6+">6%+ Yield</option>
          <option value="5+">5%+ Yield</option>
        </select>
        <select value={sortBy} onChange={e=>setSortBy(e.target.value)} style={selStyle}>
          <option value="score">Best Score</option>
          <option value="yield">Highest Yield</option>
          <option value="ppsf">Highest PPSF</option>
          <option value="airport">Near Airport</option>
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
      </div>

      {/*  FILTER PILLS  */}
      <div style={{display:"flex",gap:6,marginBottom:14,flexWrap:"wrap",alignItems:"center"}}>
        <FilterBtn active={metroFilter}  onClick={()=>setMetroFilter(v=>!v)}  label="Metro"/>
        <FilterBtn active={beachFilter}  onClick={()=>setBeachFilter(v=>!v)}  label="Beach"/>
        <FilterBtn active={sportsFilter} onClick={()=>setSportsFilter(v=>!v)} label="Sports"/>
        <FilterBtn active={gvFilter}     onClick={()=>setGvFilter(v=>!v)}     label="Golden Visa"/>
        {(metroFilter||beachFilter||sportsFilter||gvFilter||tierFilter!=="all"||yieldFilter!=="all"||search)&&(
          <button type="button" onClick={()=>{setMetroFilter(false);setBeachFilter(false);setSportsFilter(false);setGvFilter(false);setTierFilter("all");setYieldFilter("all");setSearch("");}}
            style={{fontSize:10,padding:"4px 10px",borderRadius:8,border:"1px solid rgba(239,68,68,0.3)",background:"rgba(239,68,68,0.08)",color:"#EF4444",cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>Clear all</button>
        )}
        <span style={{fontSize:11,color:"#94A3B8",marginLeft:"auto"}}>{filtered.length} communities</span>
      </div>

      {/*  COMPARE PANEL  */}
      {compare.length>=2&&<ComparePanel communities={compare} data={liveNeighbourhoods} onRemove={c=>setCompare(p=>p.filter(x=>x!==c))}/>}
      {compare.length===1&&(
        <div style={{padding:"9px 14px",background:"rgba(212,168,67,0.06)",border:"1px solid rgba(212,168,67,0.2)",borderRadius:10,marginBottom:12,fontSize:11,color:T.gold}}>
           {compare[0]} selected  Select one more community to compare
        </div>
      )}

      {/*  EMPTY STATE  */}
      {liveNeighbourhoods.length===0&&(
        <div style={{padding:"60px 20px",textAlign:"center"}}>
          <div style={{fontSize:40,marginBottom:12}}></div>
          <div style={{fontSize:16,fontWeight:700,color:T.white,marginBottom:6}}>Loading communities...</div>
        </div>
      )}

      {/*  GRID VIEW  */}
      {view==="grid"&&filtered.length>0&&(
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(290px,1fr))",gap:12}}>
          {filtered.map((n,i)=>(
            <CommunityCard key={n.community||i} n={n}
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
            <div style={{display:"grid",gridTemplateColumns:"2fr 55px 75px 75px 85px 90px 80px 75px",minWidth:680,padding:"8px 14px",fontSize:9,fontWeight:700,color:"#64748B",textTransform:"uppercase",letterSpacing:0.8,borderBottom:"1px solid "+T.border}}>
              {["Community","Score","Yield","PPSF","Metro","Mall","Beach","Risk"].map((h,i)=>(
                <div key={i} style={{textAlign:i>0?"center":"left"}}>{h}</div>
              ))}
            </div>
            {filtered.map((n,i)=>(
              <div key={n.community||i} onClick={()=>setSelectedNbhd(n)}
                style={{display:"grid",gridTemplateColumns:"2fr 55px 75px 75px 85px 90px 80px 75px",minWidth:680,padding:"11px 14px",alignItems:"center",borderBottom:i<filtered.length-1?"1px solid "+T.border+"30":"none",cursor:"pointer"}}
                onMouseEnter={e=>e.currentTarget.style.background="rgba(212,168,67,0.03)"}
                onMouseLeave={e=>e.currentTarget.style.background="transparent"}
              >
                <div>
                  <div style={{fontSize:12,fontWeight:600,color:T.white,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{n.community}</div>
                  <div style={{fontSize:10,color:"#64748B"}}>{n.tier==="verified"?" Verified":"DLD Registry"}</div>
                </div>
                <div style={{textAlign:"center"}}><ScoreBadge score={n.investmentScore}/></div>
                <div style={{fontSize:12,fontWeight:700,color:parseFloat(n.grossYield||0)>=7?"#10B981":parseFloat(n.grossYield||0)>=6?"#84CC16":T.gold,textAlign:"center"}}>{fmtY(n.grossYield)}</div>
                <div style={{fontSize:12,color:T.gold,textAlign:"center"}}>{fmtP(n.avgPpsf)}</div>
                <div style={{fontSize:11,color:"#94A3B8",textAlign:"center",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{n.nearestMetro?n.nearestMetro.replace(" Metro","").replace(" Station","").substring(0,15)+"":""}</div>
                <div style={{fontSize:11,color:"#94A3B8",textAlign:"center",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{n.nearestMall?n.nearestMall.substring(0,15)+"":""}</div>
                <div style={{fontSize:11,color:n.distBeach&&parseFloat(n.distBeach)<5?"#06B6D4":"#94A3B8",textAlign:"center"}}>{fmtD(n.distBeach)}</div>
                <div style={{textAlign:"center"}}>
                  <span style={{fontSize:10,padding:"2px 6px",borderRadius:6,background:RISK_COLOR[n.supplyRisk||"Unknown"]+"18",color:RISK_COLOR[n.supplyRisk||"Unknown"],fontWeight:600}}>{n.supplyRisk||""}</span>
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
      <div style={{marginTop:20,paddingTop:12,borderTop:"1px solid "+T.border,display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}}>
        <span style={{fontSize:10,color:"#64748B"}}>Data sources:</span>
        {["Dubai Land Department","Google Maps API","Bayut 2025","Knight Frank Q1 2025","Driven Properties","D&B Properties Q1 2026"].map((s,i)=>(
          <span key={i} style={{fontSize:10,color:"#64748B",padding:"2px 8px",borderRadius:8,border:"1px solid rgba(255,255,255,0.06)"}}>{s}</span>
        ))}
      </div>

    </div>
  );
}