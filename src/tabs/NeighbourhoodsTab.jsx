/* eslint-disable */
/*
  DXB ANALYTICS  NEIGHBOURHOODS TAB
  Session 14  World Class Rebuild
  259 communities | Google Maps verified data
  Real yields, distances, facilities, landmarks
*/

import React, { useState, useMemo } from "react";
import { T } from "../data";
import { classifyProvenance, PROVENANCE } from "../utils/provenance";
import SourceBadge from "../components/SourceBadge";
import TabIntro from "../components/TabIntro";
import TabProvenance from "../components/TabProvenance";
import { tabCopy } from "../data/tabCopy";
import { applyMeasured, EV, isEvidenced, versusDubai, DUBAI_BENCHMARK,
         THIN_EVIDENCE_BELOW } from "../utils/measuredCommunity";

const _copy = tabCopy("Neighbourhoods");

/**
 * ── WHY THIS TAB OVERLAYS ITS OWN NUMBERS ───────────────────────────────────
 *
 * The stored community records carried figures that were assigned, not counted.
 * Across the 193 communities there were only 15 distinct gross yields and 15
 * distinct service charges; 43% of communities shared one of two numbers, and
 * Dubai Harbour, Dubai Marina and Emaar Beachfront were all exactly 6.5%.
 *
 * Measured against Land Department records the stored price per square foot was
 * out by a median of 15.8%. Dubai Investment Park First was stored at AED 268
 * per square foot against a measured 1,193 — a figure no Dubai community has
 * ever traded at.
 *
 * So where a real measurement exists it replaces the stored value, and the card
 * says which it is showing. Where none exists the stored figure stays but is
 * labelled an estimate. Nothing here is silently swapped.
 */
const EV_STYLE = {
  [EV.MEASURED]: { color: "#10B981", label: "Measured" },
  [EV.THIN]:     { color: "#F59E0B", label: "Thin evidence" },
  [EV.ESTIMATE]: { color: "#94A3B8", label: "Estimate" },
  [EV.NONE]:     { color: "#64748B", label: "Not recorded" },
};

/** A small mark saying how a figure was arrived at. */
const EvBadge = ({ ev, n, title }) => {
  const s = EV_STYLE[ev];
  if (!s || ev === EV.NONE) return null;
  return (
    <span title={title}
      style={{ fontSize: 8, fontWeight: 700, color: s.color, background: s.color + "16",
               borderRadius: 4, padding: "1px 4px", letterSpacing: 0.3,
               whiteSpace: "nowrap" }}>
      {ev === EV.ESTIMATE ? "EST" : n ? n.toLocaleString() + " sales" : s.label}
    </span>
  );
};

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

/**
 * ── THE INVESTMENT SCORE IS GONE ────────────────────────────────────────────
 *
 * This tab used to show a 0–100 `investmentScore` in a circle on every card,
 * sort by it by default, and crown a "Top Rated" community with it. It was
 * removed on 2026-08-02 for three reasons.
 *
 * It was not a measurement. From AdminPanel.jsx, the whole derivation:
 *
 *     let score = 60;                          // base, chosen arbitrarily
 *     if (gross > 7)     score += 15;          // why 15?
 *     if (construction > 80) score += 10;
 *     if (branded)       score += 5;
 *     if (distDowntown < 10) score += 10;
 *
 * Every weight is an opinion. Presenting the total as a two-digit number next
 * to genuinely measured figures borrowed their credibility.
 *
 * The codebase had already reached this conclusion twice and this tab missed
 * both. EmaarDashboardV2.jsx:3288 reads "investmentScore / velocityScore /
 * developerScore removed — they were arbitrary opinions, not data". And the
 * header of utils/scoring.js records that investment scoring with Strong Buy /
 * Buy / Hold / Caution labels was removed because unlicensed investment advice
 * violates UAE RERA law. A ranked 0–100 buy-signal is the same thing wearing a
 * different hat, and this product is sold to licensed Dubai agents.
 *
 * Nothing replaces it. Sorting now defaults to A–Z, and a community can be
 * ordered by measured price, measured return, or how many sales are on record
 * — all of which are facts an agent can defend.
 */

//  COMMUNITY CARD 
const CommunityCard = ({n,selected,onSelect,onCompare,isCompared}) => {
  const isDLD    = n.tier==="dld-registry";
  const isArea   = n.tier==="area-data";
  const riskColor= RISK_COLOR[n.supplyRisk||"Unknown"];
  const grossY   = parseFloat(n.grossYield||0);
  /* Colour is a claim. A green "strong return" bar drawn from an assigned 6.5%
     tells the agent the number is good when nobody ever measured it, so the
     scale only applies to measured returns and everything else stays neutral. */
  const yMeasured = isEvidenced(n._yieldEv);
  const yColor   = !yMeasured ? "#64748B"
    : grossY>=7?"#10B981":grossY>=6?"#84CC16":grossY>=5?T.gold:"#94A3B8";
  /* Only compare a figure against Dubai when it was actually measured —
     ranking an assigned number against real ones would dress it up as evidence. */
  const vsPpsf  = isEvidenced(n._ppsfEv) ? versusDubai(parseFloat(n.avgPpsf), "ppsf") : null;
  const vsYield = isEvidenced(n._yieldEv) ? versusDubai(grossY, "yield") : null;

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
            {/* This said "Verified" on every card, including cards whose every
                figure was marked an estimate — Emaar Beachfront claimed
                "Verified" above four EST badges. The chip now reports what is
                actually true of this community's numbers. */}
            {n._hasMeasured
              ? <Chip label="Land Department figures" color="#10B981"/>
              : <Chip label="Estimates only" color="#94A3B8"/>}
            {n.hasMetro&&<Chip icon="" label="Metro" color="#10B981"/>}
            {n.hasBeach&&<Chip icon="" label="Beach" color="#06B6D4"/>}
            {n.goldenVisa&&<Chip icon="" label="Golden Visa" color={T.gold}/>}
            {n.hasSports&&<Chip icon="" label="Sports" color="#8B5CF6"/>}
          </div>
        </div>
      </div>

      {/* Metrics — every figure carries how it was arrived at */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:10}}>
        {(n.tier==="dld-registry" ? [
          {label:"Price per sq ft", value:fmtP(n.avgPpsf), color:T.gold,
           ev:n._ppsfEv, n:n._ppsfN, title:"Middle sale price per square foot"},
          {label:"Sales recorded", value:n.totalTransactions||"", color:"#94A3B8"},
        ] : [
          {label:"Price per sq ft", value:fmtP(n.avgPpsf), color:T.gold,
           ev:n._ppsfEv, n:n._ppsfN,
           title:n._ppsfEv===EV.ESTIMATE
             ? "Stored estimate — not measured from Land Department sales"
             : "Middle sale price per square foot, "+n._ppsfYear},
          {label:"Gross return", value:fmtY(n.grossYield), color:yColor,
           ev:n._yieldEv, n:n._yieldSaleN,
           title:n._yieldEv===EV.ESTIMATE
             ? "Stored estimate — not measured against tenancy contracts"
             : "A year's rent as a percentage of purchase price, before costs"},
          {label:"Net return", value:fmtY(n.netYield), color:"#CBD5E1",
           ev:n._netEv, title:"Estimate — derived from the service charge below, which is not measured"},
          {label:"Service charge", value:fmtSC(n.serviceCharge), color:"#94A3B8",
           ev:n._scEv, title:"Estimate — no per-community rate is published"},
        ]).map((m,i)=>(
          <div key={i} style={{background:"rgba(255,255,255,0.03)",borderRadius:7,padding:"7px 9px"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:4,marginBottom:2}}>
              <span style={{fontSize:9,fontWeight:700,color:"#64748B",textTransform:"uppercase",letterSpacing:0.7}}>{m.label}</span>
              <EvBadge ev={m.ev} n={m.n} title={m.title}/>
            </div>
            <div style={{fontSize:13,fontWeight:700,color:m.color,fontFamily:"'Fraunces',serif"}}>
              {m.value || <span style={{fontSize:10,color:"#64748B",fontWeight:500,fontFamily:"'Outfit',sans-serif"}}>Not recorded</span>}
            </div>
          </div>
        ))}
      </div>

      {/* Where this sits against the rest of Dubai */}
      {(vsPpsf||vsYield)&&(
        <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:10}}>
          {vsPpsf&&<Chip label={"Price: "+vsPpsf.label} color="#94A3B8"/>}
          {vsYield&&<Chip label={"Return: "+vsYield.label} color="#94A3B8"/>}
        </div>
      )}

      {/* The market name and the Land Department's differ — say which was read */}
      {n._m?.aliased&&(
        <div style={{fontSize:9,color:"#64748B",marginBottom:8,lineHeight:1.4}}>
          Land Department records this as <span style={{color:"#94A3B8"}}>{n._m.dldName}</span>
          {n._m.level==="area"&&" — an area, so slightly wider than the name suggests"}
        </div>
      )}

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
        {/* Rendered a bare "● Risk" with no level whenever supplyRisk was
            missing, which told the agent nothing at all. Now it either says
            which level, or says nothing. */}
        {n.supplyRisk ? (
          <div style={{display:"flex",alignItems:"center",gap:5}}
            title="How much new supply is due in this community. More supply means more competition when reselling or re-letting.">
            <div style={{width:6,height:6,borderRadius:"50%",background:riskColor}}/>
            <span style={{fontSize:10,color:riskColor,fontWeight:600}}>{n.supplyRisk} supply risk</span>
          </div>
        ) : <span/>}
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
    /* Was "Investment". It holds returns, prices and costs — figures, not
       advice — and this platform does not give investment advice. */
    {k:"investment",l:"Returns & costs"},
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
              <button type="button" onClick={onClose} style={{background:"rgba(255,255,255,0.06)",border:"1px solid "+T.border,borderRadius:8,color:"#94A3B8",width:32,height:32,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}} aria-label="Close community details" title="Close community details">✕</button>
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
              {/* Provenance: a researched estimate must not look like a DLD-derived figure. */}
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
                <SourceBadge row={n}/>
                {n.serviceChargePct!=null&&(
                  <span style={{fontSize:9,color:T.textMuted,fontFamily:"'Outfit',sans-serif"}}>
                    service charge {n.serviceChargePct}% of value
                  </span>
                )}
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
                <Stat label="Gross Yield"  value={fmtY(n.grossYield)}  color={yColor}/>
                <Stat label="Net Yield"    value={n.netYield!=null?fmtY(n.netYield):"—"}    color="#CBD5E1"/>
                <Stat label="Avg PPSF"     value={fmtP(n.avgPpsf)}     color={T.gold}/>
                <Stat label="Supply Risk"  value={n.supplyRisk||""}   color={rColor}/>
              </div>
              {n.nearestMetro&&(
                <div style={{padding:"11px 14px",background:"rgba(16,185,129,0.06)",border:"1px solid rgba(16,185,129,0.2)",borderRadius:10,marginBottom:12,display:"flex",alignItems:"center",gap:10}}>
                  <span style={{fontSize:22}}>⭐</span>
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
                {/* Labels match the card exactly. They used to read "Gross Yield",
                    "Avg PPSF" and "Net Yield" here while the card said something
                    else for the same figure, so the same number appeared to be
                    two different things depending on where you looked. */}
                <Stat label="Gross return"    value={fmtY(n.grossYield)}      color={yColor}  hint="A year's rent as a percentage of the purchase price, before costs"/>
                <Stat label="Net return"      value={fmtY(n.netYield)}        color="#CBD5E1" hint="Estimate — gross return after the service charge is taken off"/>
                <Stat label="Price per sq ft" value={fmtP(n.avgPpsf)}         color={T.gold}  hint="Sale price divided by floor area"/>
                <Stat label="Service charge"  value={fmtSC(n.serviceCharge)}  color="#94A3B8" hint="Estimate — annual building maintenance, per square foot"/>
                {n.priceMin&&<Stat label="Lowest price on record"  value={fmtP(n.priceMin)} color="#10B981" hint="The cheapest unit we hold a price for"/>}
                {n.priceMax&&<Stat label="Highest price on record" value={fmtP(n.priceMax)} color="#EF4444" hint="The dearest unit we hold a price for"/>}
              </div>
              {n.goldenVisa&&(
                <div style={{padding:"12px 14px",background:"rgba(212,168,67,0.08)",border:"1px solid rgba(212,168,67,0.3)",borderRadius:10,marginBottom:12}}>
                  <div style={{fontSize:12,fontWeight:700,color:T.gold,marginBottom:4}}> UAE Golden Visa Eligible</div>
                  <div style={{fontSize:11,color:"#94A3B8",lineHeight:1.6}}>Properties AED 2M+ qualify for 10-year UAE Golden Visa residency for investor and family.</div>
                </div>
              )}
              {/* ── WHAT THIS COMMUNITY'S FIGURES REST ON ──────────────────
                  This panel was an "Investment Score Breakdown": six invented
                  weights — Rental Yield /20, Metro Access /12, PPSF Premium /8,
                  Waterfront /8, Amenities /9, Golden Visa /5.

                  It never explained the score it claimed to break down. Those
                  parts total 62 at most, while the badge above it went to 100,
                  and the AdminPanel formula that actually produced the score
                  used entirely different inputs. Two unrelated invented scales,
                  presented as one number and its explanation.

                  What an agent needs before quoting a figure is not a score. It
                  is how many real transactions sit underneath it. */}
              <div style={{background:"rgba(255,255,255,0.02)",border:"1px solid "+T.border,borderRadius:10,padding:"14px"}}>
                <div style={{fontSize:11,fontWeight:700,color:T.white,marginBottom:10}}>What these figures rest on</div>
                {[
                  {label:"Price per square foot",
                   val:n._ppsfN ? n._ppsfN.toLocaleString()+" recorded sales"+
                       (n._ppsfYear?" in "+n._ppsfYear+(String(n._ppsfYear)==="2026"?" so far":""):"") : null,
                   note:n._ppsfN&&n._ppsfN<THIN_EVIDENCE_BELOW
                        ? "Few sales — one unusual deal can move this. Check before quoting."
                        : null},
                  {label:"Gross return",
                   val:n._yieldSaleN
                       ? n._yieldSaleN.toLocaleString()+" sales against "+
                         (n._yieldRentN||0).toLocaleString()+" tenancy contracts" : null},
                  {label:"Net return and service charge",
                   val:null,
                   note:"Not measured. No per-community service charge rate is published, "+
                        "so both are estimates. Ask the management company for the real rate."},
                ].map((r,i)=>(
                  <div key={i} style={{marginBottom:10}}>
                    <div style={{fontSize:11,color:"#94A3B8",marginBottom:2}}>{r.label}</div>
                    <div style={{fontSize:11,fontWeight:700,color:r.val?"#10B981":"#64748B"}}>
                      {r.val || "Not measured for this community"}
                    </div>
                    {r.note&&<div style={{fontSize:10,color:"#64748B",marginTop:2,lineHeight:1.5}}>{r.note}</div>}
                  </div>
                ))}
                {n._m?.aliased&&(
                  <div style={{fontSize:10,color:"#64748B",marginTop:10,paddingTop:10,
                    borderTop:"1px solid "+T.border,lineHeight:1.5}}>
                    Read from the Land Department record named <span style={{color:"#94A3B8"}}>{n._m.dldName}</span>
                    {n._m.level==="area"&&", which is an area and so covers slightly more ground than the community name suggests"}.
                  </div>
                )}
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
    {label:"Sales on record", key:"_ppsfN",           fmt:v=>v?v.toLocaleString():"not measured"},
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
              <button type="button" onClick={()=>onRemove(n.community)} style={{background:"none",border:"none",color:"#94A3B8",cursor:"pointer",fontSize:14,padding:0}} aria-label="Remove from comparison" title="Remove from comparison">✕</button>
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
  const [sortBy,      setSortBy]      = useState("name");
  const [yieldFilter, setYieldFilter] = useState("all");
  const [metroFilter, setMetroFilter] = useState(false);
  const [beachFilter, setBeachFilter] = useState(false);
  const [sportsFilter,setSportsFilter]= useState(false);
  const [gvFilter,    setGvFilter]    = useState(false);
  const [compare,     setCompare]     = useState([]);
  const [view,        setView]        = useState("grid");
  const [evidenceFilter,setEvidenceFilter] = useState("all");

  const toggleCompare = c => setCompare(prev=>
    prev.includes(c)?prev.filter(x=>x!==c):prev.length<3?[...prev,c]:prev
  );

  /* Fold the measured Land Department figures over the stored records once,
     before anything filters or sorts — so a sort by price orders the real
     numbers, not the assigned ones it used to. */
  const enriched = useMemo(
    ()=>(liveNeighbourhoods||[]).map(applyMeasured), [liveNeighbourhoods]);

  const measuredCount = useMemo(()=>({
    ppsf:  enriched.filter(n=>isEvidenced(n._ppsfEv)).length,
    yield: enriched.filter(n=>isEvidenced(n._yieldEv)).length,
    any:   enriched.filter(n=>n._hasMeasured).length,
  }),[enriched]);

  const filtered = useMemo(()=>{
    let a=[...enriched];
    if(search.trim()) a=a.filter(n=>(n.community||"").toLowerCase().includes(search.toLowerCase()));
    if(evidenceFilter==="measured") a=a.filter(n=>n._hasMeasured);
    if(evidenceFilter==="estimate") a=a.filter(n=>!n._hasMeasured);
    if(yieldFilter==="7+") a=a.filter(n=>parseFloat(n.grossYield||0)>=7);
    if(yieldFilter==="6+") a=a.filter(n=>parseFloat(n.grossYield||0)>=6);
    if(yieldFilter==="5+") a=a.filter(n=>parseFloat(n.grossYield||0)>=5);
    if(metroFilter) a=a.filter(n=>n.hasMetro||parseFloat(n.distMetro||99)<=1.5);
    if(beachFilter) a=a.filter(n=>n.hasBeach||parseFloat(n.distBeach||99)<=2);
    if(sportsFilter)a=a.filter(n=>n.hasSports);
    if(gvFilter)    a=a.filter(n=>n.goldenVisa);
    a.sort((x,y)=>{
      if(sortBy==="sales")    return (y._ppsfN||0)-(x._ppsfN||0);
      if(sortBy==="yield")    return parseFloat(y.grossYield||0)-parseFloat(x.grossYield||0);
      if(sortBy==="ppsf")     return (y.avgPpsf||0)-(x.avgPpsf||0);
      if(sortBy==="name")     return (x.community||"").localeCompare(y.community||"");
      if(sortBy==="airport")  return (x.distAirport||99)-(y.distAirport||99);
      return 0;
    });
    return a;
  },[enriched,search,sortBy,yieldFilter,evidenceFilter,metroFilter,beachFilter,sportsFilter,gvFilter]);

  /* ── ONE DEFINITION OF "VERIFIED" ────────────────────────────────────────
     This filtered on the raw `tier` field while the Overview and the Map use
     classifyProvenance(). The two disagreed: 61 here against 60 there, because
     classifyProvenance additionally demotes a record that carries `verified:
     false` or reports a price identical to a neighbouring community.

     One community's worth of difference, and entirely corrosive — a client who
     notices two screens giving different counts of the same thing stops
     trusting both. Same fault as three off-plan percentages in three files.

     classifyProvenance is the stricter and better-reasoned of the two, so it
     wins everywhere. */
  const verified = enriched.filter(
    n => classifyProvenance(n).level === PROVENANCE.VERIFIED
  );
  /* Rank only what was measured. Topping the list with an assigned 6.5% would
     put a made-up number in the most prominent place on the screen. */
  const topYield = [...verified]
    .filter(n=>n._yieldEv===EV.MEASURED)
    .sort((a,b)=>parseFloat(b.grossYield||0)-parseFloat(a.grossYield||0))[0];
  /* Was "Top Rated" off the removed investment score. Most sales on record is
     a fact: it tells an agent which community actually trades, which is what
     determines how easily a client can exit. */
  const topLiquid = [...verified]
    .filter(n=>n._ppsfN)
    .sort((a,b)=>(b._ppsfN||0)-(a._ppsfN||0))[0];
  const topBeach = [...(liveNeighbourhoods||[])].filter(n=>n.distBeach).sort((a,b)=>parseFloat(a.distBeach)-parseFloat(b.distBeach))[0];

  const selStyle = {padding:"6px 10px",background:"rgba(255,255,255,0.04)",border:"1px solid "+T.border,borderRadius:7,color:"#CBD5E1",fontSize:11,outline:"none",fontFamily:"'Outfit',sans-serif"};
  const FilterBtn = ({active,onClick,label}) => (
    <button type="button" onClick={onClick}
      style={{padding:"5px 10px",borderRadius:7,border:"1px solid "+(active?T.gold:T.border),background:active?"rgba(212,168,67,0.1)":"rgba(255,255,255,0.03)",color:active?T.gold:"#94A3B8",fontSize:11,fontWeight:active?600:400,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>
      {label}
    </button>
  );

  return (
    <div style={{paddingBottom:60}}>

      {_copy && <TabIntro title={_copy.title} what={_copy.what} detail={_copy.detail}
        includes={_copy.includes} excludes={_copy.excludes} warning={_copy.warning}/>}

      {/*  WHAT IS ACTUALLY MEASURED  */}
      <div style={{marginBottom:14,padding:"10px 13px",background:"rgba(255,255,255,0.02)",
        border:"1px solid "+T.border,borderRadius:10,display:"flex",gap:18,flexWrap:"wrap",alignItems:"center"}}>
        {[
          {v:measuredCount.ppsf,  of:enriched.length, l:"prices measured from Land Department sales", c:"#10B981"},
          {v:measuredCount.yield, of:enriched.length, l:"returns measured against tenancy contracts", c:"#10B981"},
          {v:enriched.length-measuredCount.any, of:enriched.length, l:"still on stored estimates", c:"#94A3B8"},
        ].map((s,i)=>(
          <div key={i} style={{fontSize:11,color:"#94A3B8"}}>
            <span style={{fontSize:14,fontWeight:800,color:s.c,fontFamily:"'Fraunces',serif"}}>{s.v}</span>
            <span style={{color:"#64748B"}}> of {s.of}</span> {s.l}
          </div>
        ))}
      </div>

      {/*  HIGHLIGHT CARDS  */}
      {verified.length>0&&(
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:16}}>
          {[
            {label:"Highest Measured Return", icon:"",comm:topYield, value:topYield?fmtY(topYield.grossYield):"", color:"#10B981"},
            {label:"Most Sales On Record", icon:"",comm:topLiquid, value:topLiquid?topLiquid._ppsfN.toLocaleString()+" sales":"",color:T.gold},
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
          {search&&<button type="button" onClick={()=>setSearch("")} style={{background:"none",border:"none",color:"#94A3B8",cursor:"pointer",fontSize:14}} aria-label="Clear search" title="Clear search">✕</button>}
        </div>
        <select value={evidenceFilter} onChange={e=>setEvidenceFilter(e.target.value)} style={selStyle}
          title="Show only communities whose figures were counted from Land Department records">
          <option value="all">Measured and estimated ({enriched.length})</option>
          <option value="measured">Measured only ({measuredCount.any})</option>
          <option value="estimate">Estimates only ({enriched.length-measuredCount.any})</option>
        </select>
        <select value={yieldFilter} onChange={e=>setYieldFilter(e.target.value)} style={selStyle}
          title="A year's rent as a percentage of purchase price. The Dubai middle is 5.7%.">
          <option value="all">Any return</option>
          <option value="7+">7% or more</option>
          <option value="6+">6% or more</option>
          <option value="5+">5% or more</option>
        </select>
        <select value={sortBy} onChange={e=>setSortBy(e.target.value)} style={selStyle}>
          <option value="name">Sort: A–Z</option>
          <option value="sales">Sort: most sales on record</option>
          <option value="yield">Sort: highest return</option>
          <option value="ppsf">Sort: highest price per sq ft</option>
          <option value="airport">Sort: nearest airport</option>
        </select>
        <div style={{display:"flex",gap:2,background:"rgba(255,255,255,0.03)",border:"1px solid "+T.border,borderRadius:7,padding:2}}>
          {/* Both of these carried an empty icon string, so the whole switcher
              rendered as two blank 22x12px boxes and the table view could only
              be found by clicking what looked like nothing. Same fault as the
              Map's view switcher and the My Leads one. */}
          {[{k:"grid", l:"Cards", tip:"Each community as a card"},
            {k:"table",l:"Table", tip:"All communities in one sortable table"}].map(v=>(
            <button key={v.k} type="button" onClick={()=>setView(v.k)} title={v.tip}
              style={{padding:"5px 12px",borderRadius:5,border:view===v.k?"1px solid "+T.gold:"1px solid transparent",background:view===v.k?"rgba(212,168,67,0.15)":"transparent",color:view===v.k?T.gold:"#94A3B8",cursor:"pointer",fontSize:11,fontWeight:view===v.k?700:500,fontFamily:"'Outfit',sans-serif",whiteSpace:"nowrap"}}>
              {v.l}
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
        {(metroFilter||beachFilter||sportsFilter||gvFilter||yieldFilter!=="all"||evidenceFilter!=="all"||search)&&(
          <button type="button" onClick={()=>{setMetroFilter(false);setBeachFilter(false);setSportsFilter(false);setGvFilter(false);setYieldFilter("all");setEvidenceFilter("all");setSearch("");}}
            style={{fontSize:10,padding:"4px 10px",borderRadius:8,border:"1px solid rgba(239,68,68,0.3)",background:"rgba(239,68,68,0.08)",color:"#EF4444",cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>Clear all</button>
        )}
        <span style={{fontSize:11,color:"#94A3B8",marginLeft:"auto"}}>{filtered.length} communities</span>
      </div>

      {/*  COMPARE PANEL  */}
      {compare.length>=2&&<ComparePanel communities={compare} data={enriched} onRemove={c=>setCompare(p=>p.filter(x=>x!==c))}/>}
      {compare.length===1&&(
        <div style={{padding:"9px 14px",background:"rgba(212,168,67,0.06)",border:"1px solid rgba(212,168,67,0.2)",borderRadius:10,marginBottom:12,fontSize:11,color:T.gold}}>
           {compare[0]} selected  Select one more community to compare
        </div>
      )}

      {/*  EMPTY STATE  */}
      {liveNeighbourhoods.length===0&&(
        <div style={{padding:"60px 20px",textAlign:"center"}}>
          <div style={{fontSize:40,marginBottom:12}}>⏳</div>
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
              {["Community","Sales","Return","Price/sqft","Metro","Mall","Beach","Supply risk"].map((h,i)=>(
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
                  <div style={{fontSize:10,color:"#64748B"}}>{n._hasMeasured?"Land Department figures":"Estimates only"}</div>
                </div>
                <div style={{textAlign:"center",fontSize:10,color:"#64748B"}}>{n._ppsfN?n._ppsfN.toLocaleString():"est"}</div>
                <div style={{fontSize:12,fontWeight:700,textAlign:"center",color:!(n._yieldEv==="measured"||n._yieldEv==="thin")?"#64748B":parseFloat(n.grossYield||0)>=7?"#10B981":parseFloat(n.grossYield||0)>=6?"#84CC16":T.gold}}>{fmtY(n.grossYield)}{!(n._yieldEv==="measured"||n._yieldEv==="thin")&&<span style={{fontSize:8,marginLeft:3,color:"#64748B"}}>EST</span>}</div>
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

      {/*  WHAT THE COLUMNS MEAN  */}
      <div style={{marginTop:22,padding:"14px 16px",background:"rgba(255,255,255,0.02)",
        border:"1px solid "+T.border,borderRadius:12}}>
        <div style={{fontSize:11,fontWeight:700,color:T.white,marginBottom:10,
          textTransform:"uppercase",letterSpacing:0.8}}>What the figures mean</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(230px,1fr))",gap:12}}>
          {[
            {t:"Price per sq ft",
             d:"The sale price divided by the floor area. It is how Dubai compares one "+
               "community against another, because it ignores unit size. Each card uses "+
               "the most recent year on record and names it — 2026 is still running, so "+
               "those counts cover part of a year, not all of it.",
             b:"Dubai middle: AED "+DUBAI_BENCHMARK.ppsf.median.toLocaleString()+
               ". Most communities fall between "+DUBAI_BENCHMARK.ppsf.p25.toLocaleString()+
               " and "+DUBAI_BENCHMARK.ppsf.p75.toLocaleString()+"."},
            {t:"Gross return",
             d:"A full year's rent as a percentage of the purchase price, before any "+
               "costs are taken off. Higher means the rent pays the price back faster.",
             b:"Dubai middle: "+DUBAI_BENCHMARK.yield.median+"%. Most fall between "+
               DUBAI_BENCHMARK.yield.p25+"% and "+DUBAI_BENCHMARK.yield.p75+"%."},
            {t:"Net return",
             d:"Gross return after the service charge is deducted. It is closer to what "+
               "an owner actually keeps.",
             b:"Always an estimate here — see the service charge note."},
            {t:"Service charge",
             d:"The annual building maintenance fee, per square foot, paid by the owner.",
             b:"No per-community rate is published, so this is an estimate everywhere. "+
               "Ask the developer or management company for the real figure."},
          ].map((g,i)=>(
            <div key={i}>
              <div style={{fontSize:11,fontWeight:700,color:T.gold,marginBottom:3}}>{g.t}</div>
              <div style={{fontSize:11,color:"#94A3B8",lineHeight:1.5,marginBottom:4}}>{g.d}</div>
              <div style={{fontSize:10,color:"#64748B",lineHeight:1.5}}>{g.b}</div>
            </div>
          ))}
        </div>

        <div style={{marginTop:14,paddingTop:12,borderTop:"1px solid "+T.border}}>
          <div style={{fontSize:11,fontWeight:700,color:T.white,marginBottom:8}}>The badge on each figure</div>
          <div style={{display:"flex",gap:16,flexWrap:"wrap"}}>
            {[
              {ev:EV.MEASURED,n:412,x:"Counted from that many Land Department sales. Safe to quote."},
              {ev:EV.THIN,    n:22, x:"Counted, but from under "+THIN_EVIDENCE_BELOW+
                                      " sales — one unusual deal can still move it. Check before quoting."},
              {ev:EV.ESTIMATE,      x:"Not measured. A stored figure. Do not quote it as a market fact."},
            ].map((r,i)=>(
              <div key={i} style={{display:"flex",gap:7,alignItems:"flex-start",flex:"1 1 240px"}}>
                <span style={{marginTop:1}}><EvBadge ev={r.ev} n={r.n}/></span>
                <span style={{fontSize:10,color:"#94A3B8",lineHeight:1.5}}>{r.x}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {_copy?.provenance && <TabProvenance {..._copy.provenance}/>}

    </div>
  );
}