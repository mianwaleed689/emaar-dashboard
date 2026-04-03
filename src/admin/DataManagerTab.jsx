/**
 * DXB ANALYTICS — UNIFIED DATA COMMAND CENTER
 * src/admin/DataManagerTab.jsx
 *
 * Architecture: One umbrella with 5 sections in a left-nav command center
 * Sections: Overview → Projects → Communities → Compliance → Documents
 * Features: Smart filters, bulk operations, health indicators, instant Firestore sync
 */

import React, { useState, useEffect, useRef, useMemo } from "react";
import { collection, doc, setDoc, deleteDoc, onSnapshot, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";

// ── Design tokens ──────────────────────────────────────────────────────────────
const C = {
  bg:"#03080E", s1:"#070E17", s2:"#0B1520", s3:"#101C2A", s4:"#152030",
  border:"rgba(255,255,255,0.055)", borderG:"rgba(212,168,67,0.25)",
  gold:"#D4A843", goldD:"rgba(212,168,67,0.1)", goldB:"#F0C060",
  green:"#10B981", greenD:"rgba(16,185,129,0.1)",
  red:"#EF4444",   redD:"rgba(239,68,68,0.1)",
  blue:"#3B82F6",  blueD:"rgba(59,130,246,0.1)",
  teal:"#14B8A6",  tealD:"rgba(20,184,166,0.1)",
  amber:"#F59E0B", amberD:"rgba(245,158,11,0.1)",
  purple:"#8B5CF6",purpleD:"rgba(139,92,246,0.1)",
  cyan:"#06B6D4",  cyanD:"rgba(6,182,212,0.1)",
  w:"#F1F5F9", m:"#475569", t2:"#94A3B8",
  ff:"'Outfit',sans-serif", ffH:"'Fraunces',serif",
};

// ── Full DLD property taxonomy ────────────────────────────────────────────────
const USAGE_TYPES = ["Residential","Commercial","Mixed-Use","Hospitality","Industrial"];
const TYPES_BY_USAGE = {
  Residential:["Studio Apartment","1BR Apartment","2BR Apartment","3BR Apartment","4BR Apartment","5BR+ Apartment","Duplex Apartment","Loft Apartment","Serviced Apartment","Hotel Apartment","Penthouse","Duplex Penthouse","Sky Villa","Full Floor Apt","Townhouse","Semi-Detached Villa","Detached Villa","Compound Villa","Mansion","Apts & TH","Apts & PH"],
  Commercial:["Office Unit","Office Floor","Business Centre Unit","Co-Working Space","Retail Shop","Showroom","F&B Unit","Mall Unit","Street Retail","Kiosk","Warehouse","Light Industrial","Cold Storage","Logistics Hub","Commercial Building","Commercial Villa","Commercial Plot"],
  "Mixed-Use":["Residential + Retail Podium","Office + Retail","Hotel + Residential","Live-Work Unit","Mixed Development"],
  Hospitality:["Hotel Apartment","Serviced Apartment","Hotel Suite","Apart-Hotel","Holiday Home","Branded Residence","Resort Villa","Hotel Room"],
  Industrial:["Warehouse","Light Industrial Unit","Heavy Industrial","Cold Storage Facility","Data Centre","Logistics Hub","Factory"],
};

const COMMUNITIES = [
  {id:"DHE",name:"Dubai Hills Estate",      area:"New Dubai",     projects:34,avgPpsf:2400,type:"Master Community"},
  {id:"DCH",name:"Dubai Creek Harbour",     area:"Old Dubai",     projects:35,avgPpsf:2500,type:"Waterfront"},
  {id:"TV", name:"The Valley",              area:"Dubailand",     projects:30,avgPpsf:1200,type:"Suburban Villas"},
  {id:"RYM",name:"Mina Rashid",             area:"Bur Dubai",     projects:22,avgPpsf:2800,type:"Marina Heritage"},
  {id:"ES", name:"Emaar South",             area:"Dubai South",   projects:24,avgPpsf:1400,type:"Golf & Airport"},
  {id:"AR3",name:"Arabian Ranches 3",       area:"Dubailand",     projects:15,avgPpsf:2000,type:"Family Villas"},
  {id:"GPC",name:"Grand Polo Club & Resort",area:"DIP 2",         projects:12,avgPpsf:1770,type:"Polo Lifestyle"},
  {id:"EBF",name:"Emaar Beachfront",        area:"Dubai Harbour", projects:11,avgPpsf:4250,type:"Beachfront Island"},
  {id:"TO", name:"The Oasis",               area:"Dubailand",     projects:11,avgPpsf:1921,type:"Ultra-Luxury Villas"},
  {id:"DT", name:"Downtown Dubai",          area:"Downtown",      projects:5, avgPpsf:3200,type:"Iconic CBD"},
  {id:"TH", name:"The Heights CW",          area:"DIP Corridor",  projects:3, avgPpsf:1136,type:"Wellness Community"},
  {id:"DM", name:"Dubai Marina",            area:"Marina",        projects:2, avgPpsf:2400,type:"Waterfront"},
  {id:"EC", name:"Expo City",               area:"Dubai South",   projects:2, avgPpsf:3000,type:"Expo Legacy"},
  {id:"ZB", name:"Zabeel",                  area:"Downtown",      projects:1, avgPpsf:3500,type:"Urban Luxury"},
  {id:"BB", name:"Business Bay",            area:"CBD",           projects:1, avgPpsf:2200,type:"CBD Mixed"},
];

const STATUS_OPT = ["Off-Plan","Under Construction","Near Completion","Ready","Delivered","Resale","On Hold","Cancelled"];
const TIER_OPT   = ["Mid-Market","Mid-Premium","Premium","Luxury","Ultra-Luxury","Luxury Branded","Ultra-Lux Branded"];
const RISK_OPT   = ["Low","Low-Medium","Medium","High","Critical"];
const PHASE_OPT  = ["Concept","Pre-Development","Foundation","Structure","MEP","Finishing","Near Completion","Delivered"];
const VIEW_OPT   = ["Burj Khalifa","Sea / Water","Golf Course","Creek","Marina","City Skyline","Community","Park / Garden","Pool","Desert","Multiple / Corner"];
const BALCONY_OPT= ["Yes","No","Multiple","Wraparound Terrace","Private Pool Deck","Juliet Balcony"];

// ── Primitives ─────────────────────────────────────────────────────────────────
const iStyle = (f) => ({padding:"7px 10px",background:C.s3,fontFamily:C.ff,border:`1px solid ${f?C.gold:C.border}`,borderRadius:6,color:C.w,fontSize:12,outline:"none",width:"100%",boxSizing:"border-box",transition:"border-color 0.15s"});

function I({value,onChange,type="text",placeholder,min,max,step,disabled,rows}) {
  const [f,sf]=useState(false);
  if(rows) return <textarea value={value??""} onChange={e=>onChange(e.target.value)} rows={rows} placeholder={placeholder} onFocus={()=>sf(true)} onBlur={()=>sf(false)} style={{...iStyle(f),resize:"vertical"}}/>;
  return <input type={type} value={value??""} onChange={e=>onChange(e.target.value)} placeholder={placeholder} min={min} max={max} step={step} disabled={disabled} onFocus={()=>sf(true)} onBlur={()=>sf(false)} style={{...iStyle(f),opacity:disabled?0.5:1}}/>;
}
function S({value,onChange,options,placeholder}) {
  const [f,sf]=useState(false);
  return <select value={value??""} onChange={e=>onChange(e.target.value)} onFocus={()=>sf(true)} onBlur={()=>sf(false)} style={{...iStyle(f),cursor:"pointer"}}>
    {placeholder&&<option value="" style={{background:C.s2}}>{placeholder}</option>}
    {options.map(o=><option key={o.value??o} value={o.value??o} style={{background:C.s2}}>{o.label??o}</option>)}
  </select>;
}
function FL({label,children,span=1}) {
  return <div style={{gridColumn:`span ${span}`,display:"flex",flexDirection:"column",gap:4}}>
    <label style={{fontSize:9,fontWeight:700,color:C.m,textTransform:"uppercase",letterSpacing:0.9,fontFamily:C.ff}}>{label}</label>
    {children}
  </div>;
}
function Btn({children,onClick,v="ghost",sm,disabled,full,sx={}}) {
  const [h,sh]=useState(false);
  const vs={primary:{bg:C.gold,c:"#000",b:C.gold},success:{bg:C.greenD,c:C.green,b:C.green+"50"},
    danger:{bg:C.redD,c:C.red,b:C.red+"50"},teal:{bg:C.tealD,c:C.teal,b:C.teal+"50"},
    blue:{bg:C.blueD,c:C.blue,b:C.blue+"50"},ghost:{bg:"transparent",c:C.t2,b:C.border}};
  const s=vs[v]||vs.ghost;
  return <button type="button" onClick={onClick} disabled={disabled} onMouseEnter={()=>sh(true)} onMouseLeave={()=>sh(false)}
    style={{cursor:disabled?"not-allowed":"pointer",fontFamily:C.ff,fontWeight:600,borderRadius:7,border:`1px solid ${s.b}`,
      fontSize:sm?11:12,padding:sm?"5px 12px":"8px 18px",background:s.bg,color:s.c,
      opacity:disabled?0.5:h?0.8:1,transform:h&&!disabled?"translateY(-1px)":"none",
      transition:"all 0.12s",whiteSpace:"nowrap",width:full?"100%":"auto",...sx}}>
    {children}
  </button>;
}
function Bdg({children,color=C.gold,dot}) {
  return <span style={{fontSize:9,fontWeight:700,letterSpacing:0.7,textTransform:"uppercase",
    padding:"2px 7px",borderRadius:20,background:color+"16",color,border:`1px solid ${color}22`,
    fontFamily:C.ff,whiteSpace:"nowrap",display:"inline-flex",alignItems:"center",gap:4}}>
    {dot&&<span style={{width:5,height:5,borderRadius:"50%",background:color,display:"inline-block"}}/>}
    {children}
  </span>;
}
function Prog({val}) {
  const p=Math.min(100,Math.max(0,val||0));
  const c=p>=90?C.green:p>=60?C.gold:p>=25?C.amber:C.red;
  return <div style={{background:"rgba(255,255,255,0.05)",borderRadius:3,height:3,overflow:"hidden"}}>
    <div style={{width:`${p}%`,height:"100%",background:c,borderRadius:3,transition:"width 0.4s"}}/>
  </div>;
}
function Sec({label,children}) {
  return <div style={{marginBottom:20}}>
    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
      <div style={{flex:1,height:"1px",background:`linear-gradient(90deg,${C.gold}40,transparent)`}}/>
      <span style={{fontSize:9,fontWeight:700,color:C.gold,textTransform:"uppercase",letterSpacing:1.2,fontFamily:C.ff,whiteSpace:"nowrap"}}>{label}</span>
      <div style={{flex:1,height:"1px",background:`linear-gradient(90deg,transparent,${C.gold}40)`}}/>
    </div>
    {children}
  </div>;
}
function G({cols=2,gap=10,children,sx={}}) {
  return <div style={{display:"grid",gridTemplateColumns:`repeat(${cols},1fr)`,gap,...sx}}>{children}</div>;
}
function Toast({msg,type}) {
  if(!msg) return null;
  const c=type==="error"?C.red:type==="warn"?C.amber:C.green;
  return <div style={{position:"fixed",bottom:20,right:20,zIndex:9999,background:C.s2,border:`1px solid ${c}40`,
    borderRadius:10,padding:"11px 18px",display:"flex",alignItems:"center",gap:8,
    boxShadow:`0 8px 32px ${c}15`,fontSize:12,color:C.w,fontFamily:C.ff,animation:"fdUp 0.2s ease"}}>
    <span style={{color:c,fontSize:15}}>{type==="error"?"✕":type==="warn"?"⚠":"✓"}</span>{msg}
  </div>;
}

// ── Full-screen Modal wrapper ──────────────────────────────────────────────────
function Modal({title,sub,badge,onClose,children,width=860}) {
  return <div style={{position:"fixed",inset:0,zIndex:2000,background:"rgba(0,0,0,0.85)",backdropFilter:"blur(8px)",
    display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
    <div style={{background:C.s2,border:`1px solid ${C.borderG}`,borderRadius:16,padding:26,width:"100%",
      maxWidth:width,maxHeight:"94vh",overflowY:"auto",animation:"fdUp 0.2s ease",
      boxShadow:`0 40px 100px rgba(0,0,0,0.8),0 0 0 1px ${C.borderG}`}}>
      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:20,paddingBottom:16,borderBottom:`1px solid ${C.border}`}}>
        <div>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
            <h2 style={{fontFamily:C.ffH,fontSize:18,fontWeight:900,color:C.w,margin:0}}>{title}</h2>
            {badge&&<Bdg color={C.gold}>{badge}</Bdg>}
          </div>
          {sub&&<div style={{fontSize:11,color:C.m}}>{sub}</div>}
        </div>
        <button type="button" onClick={onClose} style={{background:"rgba(255,255,255,0.05)",border:`1px solid ${C.border}`,
          borderRadius:7,color:C.t2,fontSize:17,cursor:"pointer",padding:"3px 9px",fontFamily:C.ff}}>✕</button>
      </div>
      {children}
    </div>
  </div>;
}

// ── Project form default ────────────────────────────────────────────────────────
function emptyP(p={}) {
  return {
    name:p.name||"", community:p.community||"", usage:p.usage||"Residential",
    type:p.type||"Studio Apartment", beds:p.beds||"", tier:p.tier||"Mid-Premium",
    status:p.status||"Off-Plan", branded:p.branded||false, brand:p.brand||"",
    price:p.price||0, ppsf:p.ppsf||0, priceFrom:p.priceFrom||0, priceTo:p.priceTo||0,
    sizeFrom:p.sizeFrom||0, sizeTo:p.sizeTo||0, payment:p.payment||"80/20",
    // Unit features
    balcony:p.balcony||"Yes", viewType:p.viewType||"Community",
    furnishing:p.furnishing||"Unfurnished", parking:p.parking||1,
    floorLevel:p.floorLevel||"", totalFloors:p.totalFloors||0,
    ownershipType:p.ownershipType||"Freehold", saleType:p.saleType||"Off-Plan",
    strEligible:p.strEligible||"TBC", dtcmPermit:p.dtcmPermit||"",
    vatApplicable:p.vatApplicable||"No (Residential)",
    // Construction
    construction:p.construction||0, phase:p.phase||"Foundation",
    handover:p.handover||"", handoverYear:p.handoverYear||0,
    launchDate:p.launchDate||"", contractor:p.contractor||"", consultant:p.consultant||"",
    deliveryScore:p.deliveryScore||5,
    // Compliance
    dldPermitNo:p.dldPermitNo||"", escrowAccount:p.escrowAccount||"",
    escrowBank:p.escrowBank||"", oqoodNo:p.oqoodNo||"", reraNo:p.reraNo||"",
    trakheesiPermit:p.trakheesiPermit||"", nocStatus:p.nocStatus||"Pending",
    escrowHealth:p.escrowHealth||"Active",
    // Investment
    grossYield:p.grossYield||0, netYield:p.netYield||0,
    capRate:p.capRate||0, irr5yr:p.irr5yr||0,
    appreciation5yr:p.appreciation5yr||0, appreciationYoY:p.appreciationYoY||0,
    serviceCharge:p.serviceCharge||0, riskLevel:p.riskLevel||"Low",
    goldenVisa:p.goldenVisa||"Yes", liquidityScore:p.liquidityScore||5,
    // Market intelligence
    dldTxCount:p.dldTxCount||0, dldAvgResale:p.dldAvgResale||0,
    unitsTotal:p.unitsTotal||0, unitsSold:p.unitsSold||0,
    unitsAvailable:p.unitsAvailable||0, demandScore:p.demandScore||5,
    // Docs
    officialUrl:p.officialUrl||p.emaarUrl||"", bayutUrl:p.bayutUrl||"",
    pfUrl:p.pfUrl||"", brochureUrl:p.brochureUrl||"",
    floorPlanUrl:p.floorPlanUrl||"", videoUrl:p.videoUrl||"",
    // Notes
    famousFor:p.famousFor||"", analystNote:p.analystNote||"",
    riskNote:p.riskNote||"", source:p.source||"DXB Analytics",
    lastVerified:p.lastVerified||"",
  };
}

// ── Community form default ─────────────────────────────────────────────────────
function emptyC(d={}) {
  return {
    grossYield_apt1:d.grossYield?.apt1??6, grossYield_apt2:d.grossYield?.apt2??5.5,
    grossYield_apt3:d.grossYield?.apt3??5, grossYield_th:d.grossYield?.th??5,
    grossYield_villa:d.grossYield?.villa??4.5,
    netYield_apt1:d.netYield?.apt1??5,   netYield_apt2:d.netYield?.apt2??4.5,
    netYield_apt3:d.netYield?.apt3??4,   netYield_th:d.netYield?.th??4,
    netYield_villa:d.netYield?.villa??3.8,
    estRent_apt1:d.estRent?.apt1??100000, estRent_apt2:d.estRent?.apt2??145000,
    estRent_apt3:d.estRent?.apt3??195000, estRent_th:d.estRent?.th??160000,
    estRent_villa:d.estRent?.villa??280000,
    appreciation5yr:d.appreciation5yr??38, appreciationYoY:d.appreciationYoY??12,
    occupancy:d.occupancy??94, avgDaysToLease:d.avgDaysToLease??12,
    shortTermPremium:d.shortTermPremium??35, riskLevel:d.riskLevel??"Low",
    serviceCharge:d.serviceCharge??18, transferFee:d.transferFee??4,
    agentCommission:d.agentCommission??2, goldenVisa:d.goldenVisa??"Yes",
    avgPpsf:d.avgPpsf??0, dldTxCount:d.dldTxCount??0,
    dldTotalValue:d.dldTotalValue??0, avgResalePrice:d.avgResalePrice??0,
    supplyPipeline:d.supplyPipeline??0, offPlanPct:d.offPlanPct??0,
    capitalGrowthDriver:d.capitalGrowthDriver??"",
    rentalDemandDriver:d.rentalDemandDriver??"",
    riskFactors:d.riskFactors??"", analystNote:d.analystNote??"",
  };
}

// ── PROJECT MODAL ──────────────────────────────────────────────────────────────
function ProjectModal({project,onSave,onClose,saving}) {
  const [form,sf]=useState(()=>emptyP(project));
  const [step,ss]=useState(0);
  const s=(k,v)=>sf(f=>({...f,[k]:v}));
  const isNew=!project?.id;
  const steps=["Identity","Pricing","Construction","Compliance","Investment","Intelligence"];
  const typeOpts=(TYPES_BY_USAGE[form.usage||"Residential"]||[]).map(t=>({value:t,label:t}));

  const pct=Math.round((steps.filter((_,i)=>i<=step).length/steps.length)*100);

  const panels = [
    // 0 — Identity
    <div key={0}>
      <G cols={3} gap={10}>
        <FL label="Usage Category" span={1}><S value={form.usage} onChange={v=>{s("usage",v);s("type",(TYPES_BY_USAGE[v]||[])[0]||"");}} options={USAGE_TYPES}/></FL>
        <FL label="Project Name" span={2}><I value={form.name} onChange={v=>s("name",v)} placeholder="e.g. Vida Residences Hillside"/></FL>
        <FL label="Community"><S value={form.community} onChange={v=>s("community",v)} options={["", ...COMMUNITIES.map(c=>({value:c.name,label:c.name}))]} placeholder="Select community"/></FL>
        <FL label="Property Type"><S value={form.type} onChange={v=>s("type",v)} options={typeOpts}/></FL>
        <FL label="Bedrooms"><I value={form.beds} onChange={v=>s("beds",v)} placeholder="e.g. 1-3BR, Studio, 4-6BR"/></FL>
        <FL label="Status"><S value={form.status} onChange={v=>s("status",v)} options={STATUS_OPT}/></FL>
        <FL label="Tier"><S value={form.tier} onChange={v=>s("tier",v)} options={TIER_OPT}/></FL>
        <FL label="Ownership Type"><S value={form.ownershipType} onChange={v=>s("ownershipType",v)} options={["Freehold","Leasehold","Commonhold","Usufruct"]}/></FL>
        <FL label="Sale Type"><S value={form.saleType} onChange={v=>s("saleType",v)} options={["Off-Plan","Ready / Resale","Post-Handover Payment Plan","Bulk Unit Sale","Plot Sale"]}/></FL>
        <FL label="Branded"><S value={form.branded?"Yes":"No"} onChange={v=>s("branded",v==="Yes")} options={["No","Yes"]}/></FL>
        {form.branded&&<FL label="Brand Partner"><I value={form.brand} onChange={v=>s("brand",v)} placeholder="e.g. Address, Vida, Palace"/></FL>}
        <FL label="VAT"><S value={form.vatApplicable} onChange={v=>s("vatApplicable",v)} options={["No (Residential)","Yes — 5% (Commercial)","Yes — 0% (First Sale)"]}/></FL>
      </G>
    </div>,

    // 1 — Pricing
    <div key={1}>
      <G cols={4} gap={10}>
        <FL label="Starting Price (AED)"><I type="number" value={form.price} onChange={v=>s("price",+v)}/></FL>
        <FL label="Price / sqft (AED)"><I type="number" value={form.ppsf} onChange={v=>s("ppsf",+v)}/></FL>
        <FL label="Price From"><I type="number" value={form.priceFrom} onChange={v=>s("priceFrom",+v)}/></FL>
        <FL label="Price To"><I type="number" value={form.priceTo} onChange={v=>s("priceTo",+v)}/></FL>
        <FL label="Size From (sqft)"><I type="number" value={form.sizeFrom} onChange={v=>s("sizeFrom",+v)}/></FL>
        <FL label="Size To (sqft)"><I type="number" value={form.sizeTo} onChange={v=>s("sizeTo",+v)}/></FL>
        <FL label="Payment Plan"><I value={form.payment} onChange={v=>s("payment",v)} placeholder="e.g. 80/20 or 10/80/10"/></FL>
        <FL label="Parking Spaces"><I type="number" min={0} value={form.parking} onChange={v=>s("parking",+v)}/></FL>
      </G>
      <div style={{marginTop:14}}>
        <div style={{fontSize:10,color:C.m,marginBottom:8,fontWeight:600,fontFamily:C.ff,textTransform:"uppercase",letterSpacing:0.8}}>Unit Features</div>
        <G cols={4} gap={10}>
          <FL label="Balcony"><S value={form.balcony} onChange={v=>s("balcony",v)} options={BALCONY_OPT}/></FL>
          <FL label="View Type"><S value={form.viewType} onChange={v=>s("viewType",v)} options={VIEW_OPT}/></FL>
          <FL label="Furnishing"><S value={form.furnishing} onChange={v=>s("furnishing",v)} options={["Unfurnished","Semi-Furnished","Fully Furnished","Hotel-Grade","Smart Home"]}/></FL>
          <FL label="Floor Level"><I value={form.floorLevel} onChange={v=>s("floorLevel",v)} placeholder="Low / Mid / High / Podium"/></FL>
          <FL label="Total Building Floors"><I type="number" value={form.totalFloors} onChange={v=>s("totalFloors",+v)}/></FL>
          <FL label="STR / Holiday Home"><S value={form.strEligible} onChange={v=>s("strEligible",v)} options={["Yes — DTCM Licensed","Yes — Eligible","No","TBC"]}/></FL>
          <FL label="DTCM Permit No"><I value={form.dtcmPermit} onChange={v=>s("dtcmPermit",v)} placeholder="DTCM-XXXXXX"/></FL>
        </G>
      </div>
    </div>,

    // 2 — Construction
    <div key={2}>
      <G cols={4} gap={10}>
        <FL label="Construction %"><I type="number" min={0} max={100} value={form.construction} onChange={v=>s("construction",+v)}/></FL>
        <FL label="Phase"><S value={form.phase} onChange={v=>s("phase",v)} options={PHASE_OPT}/></FL>
        <FL label="Handover Quarter"><I value={form.handover} onChange={v=>s("handover",v)} placeholder="e.g. Q4 2027"/></FL>
        <FL label="Handover Year"><I type="number" value={form.handoverYear} onChange={v=>s("handoverYear",+v)} placeholder="2027"/></FL>
        <FL label="Launch Date"><I value={form.launchDate} onChange={v=>s("launchDate",v)} placeholder="e.g. Mar 2024"/></FL>
        <FL label="Main Contractor"><I value={form.contractor} onChange={v=>s("contractor",v)} placeholder="e.g. Arabtec"/></FL>
        <FL label="Consultant / Engineer"><I value={form.consultant} onChange={v=>s("consultant",v)} placeholder="e.g. WSP"/></FL>
        <FL label="Delivery Risk (1-10)"><I type="number" min={1} max={10} value={form.deliveryScore} onChange={v=>s("deliveryScore",+v)}/></FL>
      </G>
      <div style={{marginTop:12,background:C.s3,borderRadius:8,padding:"10px 14px"}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
          <span style={{fontSize:10,color:C.m,fontFamily:C.ff}}>Construction Progress</span>
          <span style={{fontSize:13,fontWeight:800,color:form.construction>=90?C.green:C.gold,fontFamily:C.ffH}}>{form.construction}%</span>
        </div>
        <Prog val={form.construction}/>
        <div style={{display:"flex",justifyContent:"space-between",marginTop:6,fontSize:9,color:C.m,fontFamily:C.ff}}>
          <span>Phase: {form.phase}</span>
          <span>Handover: {form.handover||"TBC"}</span>
          <span>Risk Score: {form.deliveryScore}/10</span>
        </div>
      </div>
    </div>,

    // 3 — Compliance
    <div key={3}>
      <G cols={3} gap={10}>
        <FL label="DLD Permit No"><I value={form.dldPermitNo} onChange={v=>s("dldPermitNo",v)} placeholder="e.g. 0000/2024"/></FL>
        <FL label="Escrow Account No"><I value={form.escrowAccount} onChange={v=>s("escrowAccount",v)} placeholder="123456789"/></FL>
        <FL label="Escrow Bank"><I value={form.escrowBank} onChange={v=>s("escrowBank",v)} placeholder="e.g. Emirates NBD"/></FL>
        <FL label="Oqood No"><I value={form.oqoodNo} onChange={v=>s("oqoodNo",v)} placeholder="Oqood registration no."/></FL>
        <FL label="RERA Registration No"><I value={form.reraNo} onChange={v=>s("reraNo",v)} placeholder="RERA no."/></FL>
        <FL label="Trakheesi Permit No"><I value={form.trakheesiPermit} onChange={v=>s("trakheesiPermit",v)} placeholder="Trakheesi no."/></FL>
        <FL label="NOC Status"><S value={form.nocStatus} onChange={v=>s("nocStatus",v)} options={["Pending","Approved","Rejected","N/A"]}/></FL>
        <FL label="Escrow Health"><S value={form.escrowHealth} onChange={v=>s("escrowHealth",v)} options={["Active","Suspended","Closed","Under Review"]}/></FL>
        <FL label="Golden Visa Eligible"><S value={form.goldenVisa} onChange={v=>s("goldenVisa",v)} options={["Yes","No","Conditional"]}/></FL>
      </G>
      <div style={{marginTop:12,background:C.s3,borderRadius:8,padding:"10px 14px",display:"flex",gap:8,flexWrap:"wrap"}}>
        <Bdg color={form.dldPermitNo?C.green:C.red}>{form.dldPermitNo?"✓ DLD Permit":"⚠ No DLD Permit"}</Bdg>
        <Bdg color={form.escrowAccount?C.green:C.amber}>{form.escrowAccount?"✓ Escrow Set":"⚠ No Escrow"}</Bdg>
        <Bdg color={form.nocStatus==="Approved"?C.green:C.amber}>NOC: {form.nocStatus}</Bdg>
        <Bdg color={form.escrowHealth==="Active"?C.green:C.red}>Escrow: {form.escrowHealth}</Bdg>
        <Bdg color={form.goldenVisa==="Yes"?C.purple:C.m}>{form.goldenVisa==="Yes"?"✓ Golden Visa":"No Golden Visa"}</Bdg>
      </div>
    </div>,

    // 4 — Investment Intelligence
    <div key={4}>
      <G cols={4} gap={10}>
        <FL label="Gross Yield %"><I type="number" step="0.1" value={form.grossYield} onChange={v=>s("grossYield",+v)}/></FL>
        <FL label="Net Yield %"><I type="number" step="0.1" value={form.netYield} onChange={v=>s("netYield",+v)}/></FL>
        <FL label="Cap Rate %"><I type="number" step="0.1" value={form.capRate} onChange={v=>s("capRate",+v)}/></FL>
        <FL label="5-yr IRR %"><I type="number" step="0.1" value={form.irr5yr} onChange={v=>s("irr5yr",+v)}/></FL>
        <FL label="5-yr Appreciation %"><I type="number" value={form.appreciation5yr} onChange={v=>s("appreciation5yr",+v)}/></FL>
        <FL label="YoY Growth %"><I type="number" value={form.appreciationYoY} onChange={v=>s("appreciationYoY",+v)}/></FL>
        <FL label="Service Charge (AED/sqft/yr)"><I type="number" step="0.5" value={form.serviceCharge} onChange={v=>s("serviceCharge",+v)}/></FL>
        <FL label="Risk Level"><S value={form.riskLevel} onChange={v=>s("riskLevel",v)} options={RISK_OPT}/></FL>
        <FL label="Liquidity Score (1-10)"><I type="number" min={1} max={10} value={form.liquidityScore} onChange={v=>s("liquidityScore",+v)}/></FL>
        <FL label="DLD Transactions"><I type="number" value={form.dldTxCount} onChange={v=>s("dldTxCount",+v)}/></FL>
        <FL label="Total Units"><I type="number" value={form.unitsTotal} onChange={v=>s("unitsTotal",+v)}/></FL>
        <FL label="Units Sold"><I type="number" value={form.unitsSold} onChange={v=>s("unitsSold",+v)}/></FL>
        <FL label="Units Available"><I type="number" value={form.unitsAvailable} onChange={v=>s("unitsAvailable",+v)}/></FL>
        <FL label="Demand Score (1-10)"><I type="number" min={1} max={10} value={form.demandScore} onChange={v=>s("demandScore",+v)}/></FL>
      </G>
    </div>,

    // 5 — Intelligence & Docs
    <div key={5}>
      <G cols={1} gap={10}>
        <FL label="Famous For / Key Selling Points"><I value={form.famousFor} onChange={v=>s("famousFor",v)} rows={2} placeholder="e.g. 18-hole golf course, Burj Khalifa view, 54km bicycle route, beach access..."/></FL>
        <FL label="Analyst Note"><I value={form.analystNote} onChange={v=>s("analystNote",v)} rows={2} placeholder="e.g. Strong resale demand. Q3 2027 handover on track per RERA. DLD confirms 847 transactions..."/></FL>
        <FL label="Risk Factors"><I value={form.riskNote} onChange={v=>s("riskNote",v)} rows={2} placeholder="e.g. Oversupply risk in community. Service charges above market average at AED 24/sqft..."/></FL>
      </G>
      <div style={{marginTop:12}}>
        <div style={{fontSize:9,fontWeight:700,color:C.m,textTransform:"uppercase",letterSpacing:0.9,fontFamily:C.ff,marginBottom:8}}>Links & Documents</div>
        <G cols={2} gap={10}>
          <FL label="Official URL"><I value={form.officialUrl} onChange={v=>s("officialUrl",v)} placeholder="https://properties.emaar.com/..."/></FL>
          <FL label="Bayut URL"><I value={form.bayutUrl} onChange={v=>s("bayutUrl",v)} placeholder="https://www.bayut.com/..."/></FL>
          <FL label="PropertyFinder URL"><I value={form.pfUrl} onChange={v=>s("pfUrl",v)} placeholder="https://www.propertyfinder.ae/..."/></FL>
          <FL label="Brochure PDF URL"><I value={form.brochureUrl} onChange={v=>s("brochureUrl",v)} placeholder="https://..."/></FL>
          <FL label="Floor Plan URL"><I value={form.floorPlanUrl} onChange={v=>s("floorPlanUrl",v)} placeholder="https://..."/></FL>
          <FL label="Video / 360° Tour URL"><I value={form.videoUrl} onChange={v=>s("videoUrl",v)} placeholder="https://..."/></FL>
        </G>
      </div>
      <G cols={2} gap={10} sx={{marginTop:10}}>
        <FL label="Data Source"><I value={form.source} onChange={v=>s("source",v)} placeholder="e.g. emaar.com, Bayut, DLD Q1 2026"/></FL>
        <FL label="Last Verified"><I value={form.lastVerified} onChange={v=>s("lastVerified",v)} placeholder="e.g. April 2026"/></FL>
      </G>
    </div>,
  ];

  return (
    <Modal title={isNew?"Add New Project":"Edit Project"} sub={isNew?"":`${project.community} · ${project.id}`}
      badge={form.status} onClose={onClose} width={900}>

      {/* Step progress bar */}
      <div style={{marginBottom:18}}>
        <div style={{display:"flex",gap:4,marginBottom:10}}>
          {steps.map((st,i)=>(
            <button key={i} type="button" onClick={()=>ss(i)} style={{
              flex:1,padding:"7px 4px",borderRadius:7,border:`1px solid ${i===step?C.gold:i<step?C.green+"40":C.border}`,
              background:i===step?C.goldD:i<step?C.greenD:"transparent",
              color:i===step?C.gold:i<step?C.green:C.m,
              fontSize:10,fontWeight:600,cursor:"pointer",fontFamily:C.ff,transition:"all 0.15s",
            }}>{i<step?"✓ ":""}{st}</button>
          ))}
        </div>
        <div style={{background:"rgba(255,255,255,0.05)",borderRadius:3,height:2}}>
          <div style={{width:`${((step+1)/steps.length)*100}%`,height:"100%",background:`linear-gradient(90deg,${C.gold},${C.teal})`,borderRadius:3,transition:"width 0.3s"}}/>
        </div>
      </div>

      {/* Panel */}
      <div style={{minHeight:260}}>{panels[step]}</div>

      {/* Footer nav */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:20,paddingTop:14,borderTop:`1px solid ${C.border}`}}>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          {step>0&&<Btn onClick={()=>ss(s=>s-1)}>← Back</Btn>}
          <span style={{fontSize:10,color:C.m,fontFamily:C.ff}}>{step+1} / {steps.length}</span>
        </div>
        <div style={{display:"flex",gap:8}}>
          <Btn onClick={onClose}>Cancel</Btn>
          {step<steps.length-1
            ? <Btn v="blue" onClick={()=>ss(s=>s+1)}>Next →</Btn>
            : <Btn v="success" onClick={()=>onSave(form)} disabled={saving}>{saving?"Publishing…":"⚡ Publish → Live"}</Btn>
          }
        </div>
      </div>
    </Modal>
  );
}

// ── COMMUNITY MODAL ────────────────────────────────────────────────────────────
function CommunityModal({community,data,onSave,onClose,saving}) {
  const [form,sf]=useState(()=>emptyC(data));
  const s=(k,v)=>sf(f=>({...f,[k]:v}));
  const beds=[{k:"apt1",l:"1BR"},{k:"apt2",l:"2BR"},{k:"apt3",l:"3BR"},{k:"th",l:"TH"},{k:"villa",l:"Villa"}];

  return (
    <Modal title={community.name} sub={`${community.type} · ${community.area} · ${community.projects} projects · AED ${community.avgPpsf?.toLocaleString()}/sqft avg`} onClose={onClose} width={1000}>
      <Sec label="Yield & Rent by Bedroom Type">
        <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:8}}>
          {beds.map(({k,l})=>(
            <div key={k} style={{background:C.s3,borderRadius:9,padding:10,border:`1px solid ${C.border}`}}>
              <div style={{fontSize:9,fontWeight:700,color:C.gold,textTransform:"uppercase",letterSpacing:0.8,marginBottom:8,fontFamily:C.ff}}>{l}</div>
              <FL label="Gross %"><I type="number" step="0.1" value={form[`grossYield_${k}`]} onChange={v=>s(`grossYield_${k}`,v)}/></FL>
              <div style={{marginTop:6}}><FL label="Net %"><I type="number" step="0.1" value={form[`netYield_${k}`]} onChange={v=>s(`netYield_${k}`,v)}/></FL></div>
              <div style={{marginTop:6}}><FL label="Rent AED/yr"><I type="number" value={form[`estRent_${k}`]} onChange={v=>s(`estRent_${k}`,v)}/></FL></div>
            </div>
          ))}
        </div>
      </Sec>
      <G cols={2} gap={12}>
        <div>
          <Sec label="Market Performance">
            <G cols={2} gap={9}>
              <FL label="5-yr Appreciation %"><I type="number" value={form.appreciation5yr} onChange={v=>s("appreciation5yr",v)}/></FL>
              <FL label="YoY Growth %"><I type="number" value={form.appreciationYoY} onChange={v=>s("appreciationYoY",v)}/></FL>
              <FL label="Occupancy %"><I type="number" value={form.occupancy} onChange={v=>s("occupancy",v)}/></FL>
              <FL label="Avg Days to Lease"><I type="number" value={form.avgDaysToLease} onChange={v=>s("avgDaysToLease",v)}/></FL>
              <FL label="STR Premium %"><I type="number" value={form.shortTermPremium} onChange={v=>s("shortTermPremium",v)}/></FL>
              <FL label="Off-Plan Txn %"><I type="number" value={form.offPlanPct} onChange={v=>s("offPlanPct",v)}/></FL>
              <FL label="Risk Level"><S value={form.riskLevel} onChange={v=>s("riskLevel",v)} options={RISK_OPT}/></FL>
              <FL label="Golden Visa"><S value={form.goldenVisa} onChange={v=>s("goldenVisa",v)} options={["Yes","No","Conditional"]}/></FL>
            </G>
          </Sec>
          <Sec label="Cost Structure">
            <G cols={3} gap={9}>
              <FL label="Service Charge (AED/sqft/yr)"><I type="number" step="0.5" value={form.serviceCharge} onChange={v=>s("serviceCharge",v)}/></FL>
              <FL label="DLD Transfer Fee %"><I type="number" value={form.transferFee} onChange={v=>s("transferFee",v)}/></FL>
              <FL label="Agent Commission %"><I type="number" value={form.agentCommission} onChange={v=>s("agentCommission",v)}/></FL>
            </G>
          </Sec>
        </div>
        <div>
          <Sec label="DLD Transaction Intelligence">
            <G cols={2} gap={9}>
              <FL label="Avg PPSF (AED)"><I type="number" value={form.avgPpsf} onChange={v=>s("avgPpsf",v)}/></FL>
              <FL label="DLD Transaction Count"><I type="number" value={form.dldTxCount} onChange={v=>s("dldTxCount",v)}/></FL>
              <FL label="Total DLD Value (AED M)"><I type="number" value={form.dldTotalValue} onChange={v=>s("dldTotalValue",v)}/></FL>
              <FL label="Avg Resale Price (AED)"><I type="number" value={form.avgResalePrice} onChange={v=>s("avgResalePrice",v)}/></FL>
              <FL label="Supply Pipeline (units)"><I type="number" value={form.supplyPipeline} onChange={v=>s("supplyPipeline",v)}/></FL>
            </G>
          </Sec>
          <Sec label="Intelligence Notes">
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              <FL label="Capital Growth Driver"><I value={form.capitalGrowthDriver} onChange={v=>s("capitalGrowthDriver",v)} rows={2} placeholder="e.g. Dubai Hills Mall, golf course premium, limited villa supply..."/></FL>
              <FL label="Rental Demand Driver"><I value={form.rentalDemandDriver} onChange={v=>s("rentalDemandDriver",v)} rows={2} placeholder="e.g. Proximity to DIFC, expat demand, STR market..."/></FL>
              <FL label="Risk Factors"><I value={form.riskFactors} onChange={v=>s("riskFactors",v)} rows={2} placeholder="e.g. Oversupply Q3 2026, 3,200 units delivering..."/></FL>
            </div>
          </Sec>
        </div>
      </G>
      <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginTop:16,paddingTop:14,borderTop:`1px solid ${C.border}`}}>
        <Btn onClick={onClose}>Cancel</Btn>
        <Btn v="success" onClick={()=>onSave(form)} disabled={saving}>{saving?"Publishing…":"⚡ Publish → Live"}</Btn>
      </div>
    </Modal>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════════════════════════
export default function DataManagerTab({emaarProjects=[]}) {
  const [section,   setSection]   = useState("overview");
  const [overrides, setOverrides] = useState({});
  const [commData,  setCommData]  = useState({});
  const [saving,    setSaving]    = useState(false);
  const [toast,     setToast]     = useState({msg:"",type:"success"});
  // Project filters
  const [search,    setSearch]    = useState("");
  const [fComm,     setFComm]     = useState("All");
  const [fStatus,   setFStatus]   = useState("All");
  const [fUsage,    setFUsage]    = useState("All");
  const [fTier,     setFTier]     = useState("All");
  const [sortBy,    setSortBy]    = useState("name");
  const [selected,  setSelected]  = useState(new Set());
  // Modals
  const [editProj,  setEditProj]  = useState(null);
  const [editComm,  setEditComm]  = useState(null);
  const [delConfirm,setDelConfirm]= useState(null);
  const timer = useRef(null);

  useEffect(()=>{
    const u1=onSnapshot(collection(db,"projectData"),snap=>{const m={};snap.forEach(d=>{m[d.id]=d.data();});setOverrides(m);});
    const u2=onSnapshot(collection(db,"communityROI"),snap=>{const m={};snap.forEach(d=>{m[d.id]=d.data();});setCommData(m);});
    return()=>{u1();u2();};
  },[]);

  function notify(msg,type="success"){setToast({msg,type});clearTimeout(timer.current);timer.current=setTimeout(()=>setToast({msg:"",type:"success"}),3500);}

  const merged = useMemo(()=>emaarProjects.map(p=>{
    const ov=overrides[String(p.id)]||{};
    return{...p,...ov,_live:Object.keys(ov).length>0,_id:String(p.id)};
  }),[emaarProjects,overrides]);

  const filtered = useMemo(()=>merged.filter(p=>{
    if(search&&!p.name.toLowerCase().includes(search.toLowerCase())&&!p.community.toLowerCase().includes(search.toLowerCase()))return false;
    if(fComm!=="All"&&p.community!==fComm)return false;
    if(fStatus!=="All"&&p.status!==fStatus)return false;
    if(fUsage!=="All"&&(p.usage||"Residential")!==fUsage)return false;
    if(fTier!=="All"&&p.tier!==fTier)return false;
    return true;
  }).sort((a,b)=>{
    if(sortBy==="name")  return a.name.localeCompare(b.name);
    if(sortBy==="price") return(b.price||0)-(a.price||0);
    if(sortBy==="build") return(b.construction||0)-(a.construction||0);
    if(sortBy==="hand")  return(a.handover||"").localeCompare(b.handover||"");
    return 0;
  }),[merged,search,fComm,fStatus,fUsage,fTier,sortBy]);

  async function saveProject(form){
    setSaving(true);
    try{
      const id=editProj?.id||("custom-"+Date.now());
      await setDoc(doc(db,"projectData",String(id)),{...form,updatedAt:serverTimestamp()},{merge:true});
      notify("✓ "+form.name+" published to dashboard");setEditProj(null);
    }catch(e){notify("Save failed: "+e.message,"error");}
    setSaving(false);
  }
  async function saveCommunity(form){
    setSaving(true);
    try{
      const id=editComm.id;
      await setDoc(doc(db,"communityROI",id),{
        grossYield:{apt1:+form.grossYield_apt1,apt2:+form.grossYield_apt2,apt3:+form.grossYield_apt3,th:+form.grossYield_th,villa:+form.grossYield_villa},
        netYield:{apt1:+form.netYield_apt1,apt2:+form.netYield_apt2,apt3:+form.netYield_apt3,th:+form.netYield_th,villa:+form.netYield_villa},
        estRent:{apt1:+form.estRent_apt1,apt2:+form.estRent_apt2,apt3:+form.estRent_apt3,th:+form.estRent_th,villa:+form.estRent_villa},
        appreciation5yr:+form.appreciation5yr,appreciationYoY:+form.appreciationYoY,
        occupancy:+form.occupancy,avgDaysToLease:+form.avgDaysToLease,
        shortTermPremium:+form.shortTermPremium,riskLevel:form.riskLevel,
        serviceCharge:+form.serviceCharge,transferFee:+form.transferFee,agentCommission:+form.agentCommission,
        goldenVisa:form.goldenVisa,avgPpsf:+form.avgPpsf,dldTxCount:+form.dldTxCount,
        dldTotalValue:+form.dldTotalValue,avgResalePrice:+form.avgResalePrice,
        supplyPipeline:+form.supplyPipeline,offPlanPct:+form.offPlanPct,
        capitalGrowthDriver:form.capitalGrowthDriver,rentalDemandDriver:form.rentalDemandDriver,
        riskFactors:form.riskFactors,analystNote:form.analystNote,
        updatedAt:serverTimestamp(),
      },{merge:true});
      notify("✓ "+id+" community data published");setEditComm(null);
    }catch(e){notify("Save failed: "+e.message,"error");}
    setSaving(false);
  }
  async function delOverride(id){
    try{await deleteDoc(doc(db,"projectData",String(id)));notify("Override removed","warn");setDelConfirm(null);}
    catch(e){notify("Delete failed: "+e.message,"error");}
  }

  // Stats
  const liveCount  = Object.keys(overrides).length;
  const commCount  = Object.keys(commData).length;
  const avgBuild   = merged.reduce((s,p)=>s+(p.construction||0),0)/Math.max(1,merged.length);
  const readyCount = merged.filter(p=>p.status==="Ready"||p.status==="Delivered").length;
  const ucCount    = merged.filter(p=>p.status==="Under Construction").length;
  const opCount    = merged.filter(p=>p.status==="Off-Plan").length;

  // Nav sections
  const NAV = [
    {id:"overview",   icon:"⬡", label:"Overview",    badge:null},
    {id:"projects",   icon:"◈", label:"Projects",    badge:merged.length},
    {id:"communities",icon:"◉", label:"Communities", badge:COMMUNITIES.length},
    {id:"compliance", icon:"⊕", label:"Compliance",  badge:liveCount},
    {id:"health",     icon:"◎", label:"Data Health", badge:null},
  ];

  const selAll = ()=>setSelected(new Set(filtered.map(p=>p._id)));
  const selNone= ()=>setSelected(new Set());
  const togSel = (id)=>setSelected(s=>{const n=new Set(s);n.has(id)?n.delete(id):n.add(id);return n;});

  return(
    <div style={{fontFamily:C.ff,color:C.w,display:"flex",height:"calc(100vh - 80px)",gap:0,overflow:"hidden"}}>
      <style>{`@keyframes fdUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}*{box-sizing:border-box}::-webkit-scrollbar{width:4px;height:4px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:rgba(212,168,67,0.2);border-radius:2px}`}</style>
      <Toast msg={toast.msg} type={toast.type}/>
      {editProj!==null&&<ProjectModal project={editProj} onSave={saveProject} onClose={()=>setEditProj(null)} saving={saving}/>}
      {editComm!==null&&<CommunityModal community={editComm} data={commData[editComm?.id]||{}} onSave={saveCommunity} onClose={()=>setEditComm(null)} saving={saving}/>}
      {delConfirm&&(
        <div style={{position:"fixed",inset:0,zIndex:3000,background:"rgba(0,0,0,0.85)",display:"flex",alignItems:"center",justifyContent:"center"}}>
          <div style={{background:C.s2,border:`1px solid ${C.red}40`,borderRadius:14,padding:24,maxWidth:400,width:"100%"}}>
            <div style={{fontSize:16,fontWeight:700,color:C.w,marginBottom:8,fontFamily:C.ffH}}>Remove Override?</div>
            <div style={{fontSize:12,color:C.t2,marginBottom:18}}>Removes live override for <strong style={{color:C.gold}}>{delConfirm.name}</strong>. Reverts to static file data.</div>
            <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
              <Btn onClick={()=>setDelConfirm(null)}>Cancel</Btn>
              <Btn v="danger" onClick={()=>delOverride(delConfirm.id)}>Remove Override</Btn>
            </div>
          </div>
        </div>
      )}

      {/* ── LEFT NAV ──────────────────────────────────────────────────────── */}
      <div style={{width:180,background:C.s1,borderRight:`1px solid ${C.border}`,display:"flex",flexDirection:"column",flexShrink:0}}>
        {/* Brand */}
        <div style={{padding:"18px 16px 12px",borderBottom:`1px solid ${C.border}`}}>
          <div style={{fontSize:10,fontWeight:700,color:C.gold,textTransform:"uppercase",letterSpacing:1.2,fontFamily:C.ff}}>Data Manager</div>
          <div style={{fontSize:9,color:C.m,marginTop:2}}>Command Center</div>
        </div>
        {/* Live pill */}
        <div style={{margin:"10px 12px",background:C.greenD,border:`1px solid ${C.green}30`,borderRadius:8,padding:"6px 10px",display:"flex",alignItems:"center",gap:6}}>
          <span style={{width:5,height:5,borderRadius:"50%",background:C.green,display:"inline-block"}}/>
          <span style={{fontSize:9,color:C.green,fontWeight:700,fontFamily:C.ff}}>LIVE · Instant sync</span>
        </div>
        {/* Nav items */}
        <nav style={{flex:1,padding:"6px 8px",display:"flex",flexDirection:"column",gap:2}}>
          {NAV.map(n=>(
            <button key={n.id} type="button" onClick={()=>setSection(n.id)} style={{
              display:"flex",alignItems:"center",justifyContent:"space-between",
              padding:"9px 10px",borderRadius:8,border:`1px solid ${section===n.id?C.gold+"30":"transparent"}`,
              background:section===n.id?C.goldD:"transparent",
              color:section===n.id?C.gold:C.t2,cursor:"pointer",fontFamily:C.ff,fontWeight:600,
              fontSize:12,transition:"all 0.12s",textAlign:"left",
            }}>
              <span style={{display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontSize:14,opacity:0.8}}>{n.icon}</span>{n.label}
              </span>
              {n.badge!=null&&<span style={{fontSize:9,fontWeight:700,background:section===n.id?C.gold+"20":"rgba(255,255,255,0.07)",color:section===n.id?C.gold:C.m,padding:"1px 6px",borderRadius:10}}>{n.badge}</span>}
            </button>
          ))}
        </nav>
        {/* Quick stats */}
        <div style={{padding:"10px 12px",borderTop:`1px solid ${C.border}`,display:"flex",flexDirection:"column",gap:6}}>
          {[
            {l:"Projects",   v:merged.length,   c:C.gold},
            {l:"Live Data",  v:liveCount,        c:C.green},
            {l:"Comm Data",  v:commCount,        c:C.teal},
          ].map(({l,v,c})=>(
            <div key={l} style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span style={{fontSize:10,color:C.m,fontFamily:C.ff}}>{l}</span>
              <span style={{fontSize:11,fontWeight:700,color:c,fontFamily:C.ffH}}>{v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── MAIN CONTENT ──────────────────────────────────────────────────── */}
      <div style={{flex:1,overflowY:"auto",padding:"20px 24px"}}>

        {/* ══ OVERVIEW ══ */}
        {section==="overview"&&(
          <div style={{animation:"fdUp 0.2s ease"}}>
            <div style={{marginBottom:20}}>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:4}}>
                <div style={{width:3,height:26,background:`linear-gradient(180deg,${C.gold},${C.teal})`,borderRadius:2}}/>
                <h1 style={{fontFamily:C.ffH,fontSize:22,fontWeight:900,color:C.w,margin:0}}>Data Command Center</h1>
                <Bdg color={C.green} dot>Bloomberg-Level</Bdg>
              </div>
              <p style={{fontSize:12,color:C.m,margin:"0 0 0 13px"}}>Unified data management · Real-time Firestore sync · 50+ fields per project · DLD/RERA compliant</p>
            </div>
            {/* KPI grid */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:20}}>
              {[
                {l:"Total Projects",   v:merged.length,    sub:"Emaar portfolio",     c:C.gold,   icon:"◈"},
                {l:"Live Overrides",   v:liveCount,        sub:"Firestore updates",   c:C.green,  icon:"⚡"},
                {l:"Communities",      v:COMMUNITIES.length,sub:"With investment data",c:C.teal,   icon:"◉"},
                {l:"Comm. Data Sets",  v:commCount,        sub:"Yield & rent data",   c:C.blue,   icon:"◎"},
                {l:"Avg Construction", v:avgBuild.toFixed(0)+"%",sub:"Weighted average",c:C.amber,icon:"⬡"},
                {l:"Ready/Delivered",  v:readyCount,       sub:"Completed projects",  c:C.purple, icon:"✓"},
              ].map(({l,v,sub,c,icon})=>(
                <div key={l} style={{background:C.s1,border:`1px solid ${C.border}`,borderRadius:12,padding:"16px 18px",position:"relative",overflow:"hidden"}}>
                  <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,${c},${c}00)`}}/>
                  <div style={{fontSize:20,color:c,opacity:0.15,position:"absolute",right:12,top:12,fontFamily:C.ffH}}>{icon}</div>
                  <div style={{fontSize:9,fontWeight:700,color:C.m,textTransform:"uppercase",letterSpacing:0.8,marginBottom:4,fontFamily:C.ff}}>{l}</div>
                  <div style={{fontSize:26,fontWeight:900,color:c,fontFamily:C.ffH,lineHeight:1}}>{v}</div>
                  <div style={{fontSize:10,color:C.m,marginTop:4}}>{sub}</div>
                </div>
              ))}
            </div>
            {/* Status breakdown */}
            <div style={{background:C.s1,border:`1px solid ${C.border}`,borderRadius:12,padding:"16px 18px",marginBottom:16}}>
              <div style={{fontSize:10,fontWeight:700,color:C.m,textTransform:"uppercase",letterSpacing:0.8,marginBottom:12,fontFamily:C.ff}}>Project Status Breakdown</div>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                {[
                  {l:"Off-Plan",           v:opCount,   c:C.blue},
                  {l:"Under Construction", v:ucCount,   c:C.gold},
                  {l:"Ready/Delivered",    v:readyCount,c:C.green},
                  {l:"Other",             v:merged.length-opCount-ucCount-readyCount,c:C.m},
                ].map(({l,v,c})=>(
                  <div key={l} style={{flex:1,minWidth:120,background:C.s2,borderRadius:9,padding:"10px 14px",border:`1px solid ${c}25`}}>
                    <div style={{fontSize:8,color:C.m,textTransform:"uppercase",letterSpacing:0.7,marginBottom:2,fontFamily:C.ff}}>{l}</div>
                    <div style={{fontSize:20,fontWeight:900,color:c,fontFamily:C.ffH}}>{v}</div>
                    <div style={{fontSize:9,color:C.m,marginTop:2}}>{merged.length>0?((v/merged.length)*100).toFixed(0):"0"}%</div>
                  </div>
                ))}
              </div>
            </div>
            {/* Quick action buttons */}
            <div style={{background:C.s1,border:`1px solid ${C.border}`,borderRadius:12,padding:"16px 18px"}}>
              <div style={{fontSize:10,fontWeight:700,color:C.m,textTransform:"uppercase",letterSpacing:0.8,marginBottom:12,fontFamily:C.ff}}>Quick Actions</div>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                <Btn v="primary" onClick={()=>{setSection("projects");setEditProj({});}}>+ Add New Project</Btn>
                <Btn v="teal" onClick={()=>setSection("projects")}>◈ Manage Projects</Btn>
                <Btn v="blue" onClick={()=>setSection("communities")}>◉ Edit Communities</Btn>
                <Btn v="ghost" onClick={()=>setSection("compliance")}>⊕ View Compliance</Btn>
                <Btn v="ghost" onClick={()=>setSection("health")}>◎ Data Health</Btn>
              </div>
            </div>
          </div>
        )}

        {/* ══ PROJECTS ══ */}
        {section==="projects"&&(
          <div style={{animation:"fdUp 0.2s ease"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16,flexWrap:"wrap",gap:10}}>
              <div>
                <h2 style={{fontFamily:C.ffH,fontSize:20,fontWeight:900,color:C.w,margin:"0 0 2px"}}>Projects</h2>
                <div style={{fontSize:11,color:C.m}}>{filtered.length} of {merged.length} projects · {liveCount} with live overrides</div>
              </div>
              <div style={{display:"flex",gap:8}}>
                {selected.size>0&&<Btn v="danger" sm onClick={()=>{selected.forEach(id=>delOverride(id));selNone();}}>Remove {selected.size} Overrides</Btn>}
                <Btn v="primary" onClick={()=>setEditProj({})}>+ Add Project</Btn>
              </div>
            </div>

            {/* Smart filter bar */}
            <div style={{background:C.s1,border:`1px solid ${C.border}`,borderRadius:10,padding:"12px 14px",marginBottom:14}}>
              <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
                <input type="text" placeholder="🔍  Search projects, communities..." value={search} onChange={e=>setSearch(e.target.value)}
                  style={{flex:"2 1 200px",padding:"7px 12px",background:C.s2,border:`1px solid ${C.border}`,borderRadius:7,color:C.w,fontSize:12,fontFamily:C.ff,outline:"none"}}/>
                <select value={fComm} onChange={e=>setFComm(e.target.value)} style={{flex:"1 1 150px",padding:"7px 10px",background:C.s2,border:`1px solid ${C.border}`,borderRadius:7,color:C.w,fontSize:11,fontFamily:C.ff,outline:"none",cursor:"pointer"}}>
                  <option value="All">All Communities</option>
                  {COMMUNITIES.map(c=><option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
                <select value={fStatus} onChange={e=>setFStatus(e.target.value)} style={{flex:"1 1 130px",padding:"7px 10px",background:C.s2,border:`1px solid ${C.border}`,borderRadius:7,color:C.w,fontSize:11,fontFamily:C.ff,outline:"none",cursor:"pointer"}}>
                  <option value="All">All Statuses</option>
                  {STATUS_OPT.map(s=><option key={s} value={s}>{s}</option>)}
                </select>
                <select value={fUsage} onChange={e=>setFUsage(e.target.value)} style={{flex:"1 1 120px",padding:"7px 10px",background:C.s2,border:`1px solid ${C.border}`,borderRadius:7,color:C.w,fontSize:11,fontFamily:C.ff,outline:"none",cursor:"pointer"}}>
                  <option value="All">All Usage</option>
                  {USAGE_TYPES.map(u=><option key={u} value={u}>{u}</option>)}
                </select>
                <select value={sortBy} onChange={e=>setSortBy(e.target.value)} style={{flex:"1 1 120px",padding:"7px 10px",background:C.s2,border:`1px solid ${C.border}`,borderRadius:7,color:C.w,fontSize:11,fontFamily:C.ff,outline:"none",cursor:"pointer"}}>
                  <option value="name">Sort: Name A-Z</option>
                  <option value="price">Sort: Price ↓</option>
                  <option value="build">Sort: Build% ↓</option>
                  <option value="hand">Sort: Handover</option>
                </select>
                {/* Active filters */}
                <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
                  {search&&<Bdg color={C.blue}>{search} <button type="button" onClick={()=>setSearch("")} style={{background:"none",border:"none",color:C.blue,cursor:"pointer",padding:"0 2px",fontSize:10}}>✕</button></Bdg>}
                  {fComm!=="All"&&<Bdg color={C.teal}>{fComm} <button type="button" onClick={()=>setFComm("All")} style={{background:"none",border:"none",color:C.teal,cursor:"pointer",padding:"0 2px",fontSize:10}}>✕</button></Bdg>}
                  {fStatus!=="All"&&<Bdg color={C.amber}>{fStatus} <button type="button" onClick={()=>setFStatus("All")} style={{background:"none",border:"none",color:C.amber,cursor:"pointer",padding:"0 2px",fontSize:10}}>✕</button></Bdg>}
                  {(search||fComm!=="All"||fStatus!=="All"||fUsage!=="All")&&<button type="button" onClick={()=>{setSearch("");setFComm("All");setFStatus("All");setFUsage("All");}} style={{background:"none",border:"none",color:C.red,cursor:"pointer",fontSize:10,fontFamily:C.ff}}>Clear all</button>}
                </div>
              </div>
              {/* Bulk action bar */}
              <div style={{display:"flex",alignItems:"center",gap:8,marginTop:8,paddingTop:8,borderTop:`1px solid ${C.border}`}}>
                <input type="checkbox" checked={selected.size===filtered.length&&filtered.length>0} onChange={e=>e.target.checked?selAll():selNone()} style={{accentColor:C.gold,cursor:"pointer"}}/>
                <span style={{fontSize:10,color:C.m,fontFamily:C.ff}}>{selected.size>0?`${selected.size} selected`:"Select all"}</span>
                {selected.size>0&&(
                  <div style={{display:"flex",gap:6,marginLeft:8}}>
                    <Bdg color={C.amber}>{selected.size} project{selected.size>1?"s":""} selected</Bdg>
                    <Btn v="ghost" sm onClick={selNone}>Deselect</Btn>
                  </div>
                )}
              </div>
            </div>

            {/* Table */}
            <div style={{background:C.s1,border:`1px solid ${C.border}`,borderRadius:12,overflow:"hidden"}}>
              <div style={{display:"grid",gridTemplateColumns:"28px 2fr 1.3fr 85px 85px 60px 90px 85px 110px",
                padding:"8px 14px",borderBottom:`1px solid ${C.border}`,
                fontSize:9,fontWeight:700,color:C.m,letterSpacing:0.8,textTransform:"uppercase",background:"rgba(212,168,67,0.025)"}}>
                <span/>
                <span>Project</span><span>Community</span><span>Price</span><span>PPSF</span>
                <span>Build</span><span>Status</span><span>Handover</span><span style={{textAlign:"right"}}>Actions</span>
              </div>
              <div style={{maxHeight:"calc(100vh - 340px)",overflowY:"auto"}}>
                {filtered.map((p,i)=>{
                  const isSel=selected.has(p._id);
                  return(
                    <div key={p._id||i}
                      style={{display:"grid",gridTemplateColumns:"28px 2fr 1.3fr 85px 85px 60px 90px 85px 110px",
                        padding:"9px 14px",borderBottom:`1px solid ${C.border}`,alignItems:"center",
                        background:isSel?"rgba(212,168,67,0.06)":i%2===0?"transparent":"rgba(255,255,255,0.01)",transition:"background 0.1s",cursor:"default"}}
                      onMouseEnter={e=>{if(!isSel)e.currentTarget.style.background="rgba(212,168,67,0.04)";}}
                      onMouseLeave={e=>{e.currentTarget.style.background=isSel?"rgba(212,168,67,0.06)":i%2===0?"transparent":"rgba(255,255,255,0.01)";}}>
                      <input type="checkbox" checked={isSel} onChange={()=>togSel(p._id)} style={{accentColor:C.gold,cursor:"pointer"}}/>
                      <div>
                        <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:2}}>
                          <span style={{fontSize:12,fontWeight:600,color:C.w}}>{p.name}</span>
                          {p._live&&<Bdg color={C.green}>LIVE</Bdg>}
                          {p.branded&&<Bdg color={C.gold}>{p.brand}</Bdg>}
                        </div>
                        <div style={{fontSize:9,color:C.m}}>{p.type||"Apartment"} · {p.beds}</div>
                      </div>
                      <div>
                        <div style={{fontSize:11,color:C.t2}}>{p.community}</div>
                        {p.dldPermitNo&&<div style={{fontSize:9,color:C.m}}>🔑 {p.dldPermitNo}</div>}
                      </div>
                      <span style={{fontSize:11,fontWeight:700,color:C.gold}}>{p.price?"AED "+(p.price/1e6).toFixed(1)+"M":"—"}</span>
                      <span style={{fontSize:11,color:C.t2}}>{p.ppsf?.toLocaleString()||"—"}</span>
                      <div>
                        <div style={{fontSize:9,color:C.w,marginBottom:2}}>{p.construction||0}%</div>
                        <Prog val={p.construction||0}/>
                      </div>
                      <Bdg color={p.status==="Ready"||p.status==="Delivered"?C.green:p.status==="Under Construction"?C.gold:p.status==="Off-Plan"?C.blue:C.m}>
                        {p.status==="Under Construction"?"U/C":p.status?.replace("Off-Plan","Off-Plan")||"—"}
                      </Bdg>
                      <span style={{fontSize:11,color:C.t2}}>{p.handover||"TBC"}</span>
                      <div style={{display:"flex",gap:4,justifyContent:"flex-end"}}>
                        <Btn sm onClick={()=>setEditProj(p)}>Edit</Btn>
                        {p._live&&<Btn sm v="danger" onClick={()=>setDelConfirm(p)}>✕</Btn>}
                      </div>
                    </div>
                  );
                })}
                {filtered.length===0&&(
                  <div style={{padding:40,textAlign:"center",color:C.m,fontSize:13}}>
                    No projects match your filters
                    <div style={{marginTop:10}}><Btn onClick={()=>{setSearch("");setFComm("All");setFStatus("All");setFUsage("All");}}>Clear Filters</Btn></div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ══ COMMUNITIES ══ */}
        {section==="communities"&&(
          <div style={{animation:"fdUp 0.2s ease"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
              <div>
                <h2 style={{fontFamily:C.ffH,fontSize:20,fontWeight:900,color:C.w,margin:"0 0 2px"}}>Communities</h2>
                <div style={{fontSize:11,color:C.m}}>{COMMUNITIES.length} Emaar communities · {commCount} with investment data · Click any card to edit</div>
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:10}}>
              {COMMUNITIES.map(c=>{
                const d=commData[c.id]||{};const has=!!commData[c.id];
                const y=d.grossYield?.apt1;const tx=d.dldTxCount||0;
                return(
                  <div key={c.id}
                    style={{background:C.s1,border:`1px solid ${has?C.green+"30":C.border}`,
                      borderRadius:12,padding:"14px 16px",cursor:"pointer",transition:"all 0.15s",position:"relative",overflow:"hidden"}}
                    onClick={()=>setEditComm(c)}
                    onMouseEnter={e=>{e.currentTarget.style.borderColor=C.gold+"50";e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow=`0 6px 20px rgba(212,168,67,0.08)`;}}
                    onMouseLeave={e=>{e.currentTarget.style.borderColor=has?C.green+"30":C.border;e.currentTarget.style.transform="none";e.currentTarget.style.boxShadow="none";}}>
                    <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:has?`linear-gradient(90deg,${C.green},${C.teal})`:`linear-gradient(90deg,${C.gold}50,transparent)`}}/>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                      <div>
                        <div style={{fontSize:13,fontWeight:700,color:C.w,fontFamily:C.ffH}}>{c.name}</div>
                        <div style={{fontSize:9,color:C.m,marginTop:1}}>{c.type} · {c.area}</div>
                      </div>
                      <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:3}}>
                        <Bdg color={has?C.green:C.m}>{has?"● LIVE":"○ NO DATA"}</Bdg>
                        <span style={{fontSize:9,color:C.m}}>{c.projects} projects</span>
                      </div>
                    </div>
                    <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:6,marginBottom:10}}>
                      {[
                        {l:"1BR Yield",v:y?y+"%":"—",c:has?C.gold:C.m},
                        {l:"Occupancy",v:d.occupancy?d.occupancy+"%":"—",c:has?C.green:C.m},
                        {l:"5yr Growth",v:d.appreciation5yr?"+"+d.appreciation5yr+"%":"—",c:has?C.teal:C.m},
                      ].map(k=>(
                        <div key={k.l} style={{textAlign:"center",background:C.s2,borderRadius:6,padding:"6px 4px"}}>
                          <div style={{fontSize:7,color:C.m,textTransform:"uppercase",letterSpacing:0.5,marginBottom:1}}>{k.l}</div>
                          <div style={{fontSize:14,fontWeight:900,color:k.c,fontFamily:C.ffH}}>{k.v}</div>
                        </div>
                      ))}
                    </div>
                    {has&&(
                      <div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:8}}>
                        {d.riskLevel&&<Bdg color={d.riskLevel==="Low"?C.green:d.riskLevel==="Medium"?C.amber:C.red}>{d.riskLevel} Risk</Bdg>}
                        {tx>0&&<Bdg color={C.blue}>{tx.toLocaleString()} DLD</Bdg>}
                        {d.goldenVisa==="Yes"&&<Bdg color={C.purple}>Golden Visa</Bdg>}
                      </div>
                    )}
                    <div style={{fontSize:10,color:C.t2,padding:"6px 10px",background:C.s2,borderRadius:6,textAlign:"center",border:`1px solid ${C.border}`,fontWeight:600}}>
                      {has?"Edit Bloomberg Data →":"Set Investment Data →"}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ══ COMPLIANCE ══ */}
        {section==="compliance"&&(
          <div style={{animation:"fdUp 0.2s ease"}}>
            <div style={{marginBottom:16}}>
              <h2 style={{fontFamily:C.ffH,fontSize:20,fontWeight:900,color:C.w,margin:"0 0 4px"}}>Compliance Dashboard</h2>
              <div style={{fontSize:11,color:C.m}}>DLD permits · Escrow health · RERA registration · Trakheesi status</div>
            </div>
            {/* Compliance summary */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:16}}>
              {[
                {l:"With DLD Permit",   v:merged.filter(p=>p.dldPermitNo).length,   total:merged.length, c:C.green},
                {l:"With Escrow",       v:merged.filter(p=>p.escrowAccount).length,  total:merged.length, c:C.gold},
                {l:"NOC Approved",      v:merged.filter(p=>p.nocStatus==="Approved").length, total:merged.length, c:C.teal},
                {l:"Escrow Active",     v:merged.filter(p=>p.escrowHealth==="Active").length,total:merged.length, c:C.blue},
              ].map(({l,v,total,c})=>(
                <div key={l} style={{background:C.s1,border:`1px solid ${C.border}`,borderRadius:10,padding:"12px 14px"}}>
                  <div style={{fontSize:9,color:C.m,textTransform:"uppercase",letterSpacing:0.7,fontFamily:C.ff,marginBottom:4}}>{l}</div>
                  <div style={{display:"flex",alignItems:"baseline",gap:4}}>
                    <span style={{fontSize:22,fontWeight:900,color:c,fontFamily:C.ffH}}>{v}</span>
                    <span style={{fontSize:10,color:C.m}}>/ {total}</span>
                  </div>
                  <Prog val={total>0?(v/total)*100:0}/>
                </div>
              ))}
            </div>
            {/* Projects needing compliance attention */}
            <div style={{background:C.s1,border:`1px solid ${C.border}`,borderRadius:12,overflow:"hidden"}}>
              <div style={{padding:"12px 16px",borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <div style={{fontSize:12,fontWeight:700,color:C.w,fontFamily:C.ff}}>Compliance Status per Project</div>
                <Bdg color={C.amber}>{merged.filter(p=>!p.dldPermitNo||!p.escrowAccount).length} needs attention</Bdg>
              </div>
              <div style={{maxHeight:"calc(100vh - 380px)",overflowY:"auto"}}>
                {merged.map((p,i)=>{
                  const issues=[];
                  if(!p.dldPermitNo) issues.push("No DLD Permit");
                  if(!p.escrowAccount&&p.status==="Under Construction") issues.push("No Escrow");
                  if(p.nocStatus&&p.nocStatus!=="Approved"&&p.nocStatus!=="N/A") issues.push("NOC: "+p.nocStatus);
                  if(p.escrowHealth&&p.escrowHealth!=="Active"&&p.escrowHealth!=="N/A") issues.push("Escrow: "+p.escrowHealth);
                  const ok=issues.length===0;
                  return(
                    <div key={p._id||i} style={{display:"grid",gridTemplateColumns:"2fr 1.5fr 1fr auto",padding:"9px 16px",
                      borderBottom:`1px solid ${C.border}`,alignItems:"center",
                      background:ok?"transparent":i%2===0?"rgba(239,68,68,0.02)":"rgba(239,68,68,0.04)"}}>
                      <div>
                        <span style={{fontSize:12,fontWeight:600,color:C.w}}>{p.name}</span>
                        <span style={{fontSize:10,color:C.m,marginLeft:8}}>{p.community}</span>
                      </div>
                      <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                        {p.dldPermitNo?<Bdg color={C.green}>DLD ✓</Bdg>:<Bdg color={C.red}>No DLD</Bdg>}
                        {p.escrowAccount?<Bdg color={C.green}>Escrow ✓</Bdg>:<Bdg color={C.amber}>No Escrow</Bdg>}
                        {p.nocStatus&&<Bdg color={p.nocStatus==="Approved"?C.green:C.amber}>{p.nocStatus}</Bdg>}
                      </div>
                      <div>{ok?<Bdg color={C.green}>Compliant</Bdg>:<span style={{fontSize:10,color:C.red}}>{issues.length} issue{issues.length>1?"s":""}</span>}</div>
                      <Btn sm onClick={()=>setEditProj(p)}>Fix →</Btn>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ══ DATA HEALTH ══ */}
        {section==="health"&&(
          <div style={{animation:"fdUp 0.2s ease"}}>
            <div style={{marginBottom:16}}>
              <h2 style={{fontFamily:C.ffH,fontSize:20,fontWeight:900,color:C.w,margin:"0 0 4px"}}>Data Health</h2>
              <div style={{fontSize:11,color:C.m}}>Completeness score · Missing fields · Data quality indicators</div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:12}}>
              {[
                {label:"Has Price",         count:merged.filter(p=>p.price>0).length,       key:"price",     icon:"💰"},
                {label:"Has PPSF",          count:merged.filter(p=>p.ppsf>0).length,        key:"ppsf",      icon:"📐"},
                {label:"Has Construction%", count:merged.filter(p=>p.construction>0).length,key:"constr",    icon:"🏗"},
                {label:"Has Handover Date", count:merged.filter(p=>p.handover).length,      key:"hand",      icon:"📅"},
                {label:"Has Payment Plan",  count:merged.filter(p=>p.payment).length,       key:"pay",       icon:"💳"},
                {label:"Has Official URL",  count:merged.filter(p=>p.officialUrl).length,   key:"url",       icon:"🔗"},
                {label:"Has DLD Permit",    count:merged.filter(p=>p.dldPermitNo).length,   key:"dld",       icon:"📋"},
                {label:"Has Yield Data",    count:merged.filter(p=>p.grossYield>0).length,  key:"yield",     icon:"📈"},
              ].map(({label,count,icon})=>{
                const pct=merged.length>0?(count/merged.length)*100:0;
                const col=pct>=80?C.green:pct>=50?C.amber:C.red;
                return(
                  <div key={label} style={{background:C.s1,border:`1px solid ${C.border}`,borderRadius:10,padding:"12px 14px"}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                      <div style={{display:"flex",alignItems:"center",gap:8}}>
                        <span style={{fontSize:16}}>{icon}</span>
                        <span style={{fontSize:12,fontWeight:600,color:C.w,fontFamily:C.ff}}>{label}</span>
                      </div>
                      <div style={{textAlign:"right"}}>
                        <span style={{fontSize:14,fontWeight:900,color:col,fontFamily:C.ffH}}>{pct.toFixed(0)}%</span>
                        <span style={{fontSize:9,color:C.m,display:"block"}}>{count}/{merged.length}</span>
                      </div>
                    </div>
                    <div style={{background:"rgba(255,255,255,0.05)",borderRadius:3,height:5,overflow:"hidden"}}>
                      <div style={{width:`${pct}%`,height:"100%",background:col,borderRadius:3,transition:"width 0.5s"}}/>
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{marginTop:14,background:C.s1,border:`1px solid ${C.border}`,borderRadius:10,padding:"14px 16px"}}>
              <div style={{fontSize:10,fontWeight:700,color:C.m,textTransform:"uppercase",letterSpacing:0.8,fontFamily:C.ff,marginBottom:8}}>Community Data Coverage</div>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                {COMMUNITIES.map(c=>{
                  const has=!!commData[c.id];
                  return <div key={c.id} style={{padding:"4px 10px",borderRadius:20,background:has?C.greenD:C.redD,border:`1px solid ${has?C.green+"30":C.red+"30"}`,fontSize:10,color:has?C.green:C.red,fontFamily:C.ff,fontWeight:600}}>
                    {has?"✓":"✗"} {c.id}
                  </div>;
                })}
              </div>
              <div style={{marginTop:10,fontSize:11,color:C.m}}>
                {commCount}/{COMMUNITIES.length} communities have investment data · {COMMUNITIES.length-commCount} missing
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
