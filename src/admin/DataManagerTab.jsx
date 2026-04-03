/**
 * DXB ANALYTICS — BLOOMBERG-LEVEL DATA MANAGER
 * src/admin/DataManagerTab.jsx
 *
 * Research basis:
 *  - Bloomberg Terminal: NOI, cap rate, IRR, REIT data fields
 *  - CoStar: 7M+ property records structure, market analytics KPIs
 *  - REIDIN Dubai: transaction comps, submarket trends, project-level KPIs
 *  - DLD/RERA: escrow law (Law 8/2007), Oqood, permit system, NOC, Trakheesi
 *  - Dubai PropTech 2033 whitepaper: AI-native data infrastructure
 *
 * Every edit → Firestore → dashboard updates instantly via onSnapshot
 */

import React, { useState, useEffect, useRef } from "react";
import { collection, doc, setDoc, deleteDoc, onSnapshot, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";

const C = {
  bg:"#03080E", surface:"#080F17", surfaceB:"#0C1520", surfaceC:"#111D29",
  border:"rgba(255,255,255,0.06)", borderGold:"rgba(212,168,67,0.3)",
  gold:"#D4A843", goldDim:"rgba(212,168,67,0.1)",
  green:"#10B981", greenDim:"rgba(16,185,129,0.1)",
  red:"#EF4444",   redDim:"rgba(239,68,68,0.1)",
  blue:"#3B82F6",  blueDim:"rgba(59,130,246,0.1)",
  teal:"#14B8A6",  tealDim:"rgba(20,184,166,0.1)",
  amber:"#F59E0B", amberDim:"rgba(245,158,11,0.1)",
  purple:"#8B5CF6",purpleDim:"rgba(139,92,246,0.1)",
  white:"#F1F5F9", muted:"#475569", text2:"#94A3B8",
  ff:"'Outfit', sans-serif", ffH:"'Fraunces', serif",
};

const COMMUNITIES = [
  {id:"DHE",name:"Dubai Hills Estate",      area:"New Dubai",    projects:34,type:"Master Community",   avgPpsf:2400},
  {id:"DCH",name:"Dubai Creek Harbour",     area:"Old Dubai",    projects:35,type:"Waterfront",         avgPpsf:2500},
  {id:"TV", name:"The Valley",              area:"Dubailand",    projects:30,type:"Suburban Villas",    avgPpsf:1200},
  {id:"RYM",name:"Mina Rashid",             area:"Bur Dubai",    projects:22,type:"Marina Heritage",    avgPpsf:2800},
  {id:"ES", name:"Emaar South",             area:"Dubai South",  projects:24,type:"Golf & Airport",     avgPpsf:1400},
  {id:"AR3",name:"Arabian Ranches 3",       area:"Dubailand",    projects:15,type:"Family Villas",      avgPpsf:2000},
  {id:"GPC",name:"Grand Polo Club & Resort",area:"DIP 2",        projects:12,type:"Polo Lifestyle",     avgPpsf:1770},
  {id:"EBF",name:"Emaar Beachfront",        area:"Dubai Harbour",projects:11,type:"Beachfront Island",  avgPpsf:4250},
  {id:"TO", name:"The Oasis",               area:"Dubailand",    projects:11,type:"Ultra-Luxury Villas",avgPpsf:1921},
  {id:"DT", name:"Downtown Dubai",          area:"Downtown",     projects:5, type:"Iconic CBD",         avgPpsf:3200},
  {id:"TH", name:"The Heights CW",          area:"DIP Corridor", projects:3, type:"Wellness Community", avgPpsf:1136},
  {id:"DM", name:"Dubai Marina",            area:"Marina",       projects:2, type:"Waterfront",         avgPpsf:2400},
  {id:"EC", name:"Expo City",               area:"Dubai South",  projects:2, type:"Expo Legacy",        avgPpsf:3000},
  {id:"ZB", name:"Zabeel",                  area:"Downtown",     projects:1, type:"Urban Luxury",       avgPpsf:3500},
  {id:"BB", name:"Business Bay",            area:"CBD",          projects:1, type:"CBD Mixed",          avgPpsf:2200},
];

const STATUS_OPT  = ["Off-Plan","Under Construction","Near Completion","Ready","Delivered","Resale","On Hold","Cancelled"];
const TIER_OPT    = ["Mid-Market","Mid-Premium","Premium","Luxury","Ultra-Luxury","Luxury Branded","Ultra-Lux Branded"];
// ── Full DLD-verified property type taxonomy ─────────────────────────────────
const PROPERTY_USAGE = ["Residential","Commercial","Mixed-Use","Hospitality","Industrial"];

const TYPE_BY_USAGE = {
  Residential: [
    // Apartments
    "Studio Apartment","1BR Apartment","2BR Apartment","3BR Apartment","4BR+ Apartment",
    "Duplex Apartment","Loft Apartment","Serviced Apartment","Hotel Apartment",
    // Large format residential
    "Penthouse","Duplex Penthouse","Sky Villa","Full Floor",
    // Ground-level residential
    "Townhouse","Semi-Detached Villa","Detached Villa","Compound Villa","Mansion",
    // Mixed apartment formats
    "Apts & TH","Apts & PH","Mixed Residential",
  ],
  Commercial: [
    // Office
    "Office Unit","Office Floor","Business Centre Unit","Co-Working Space","Smart Desk",
    // Retail
    "Retail Shop","Showroom","Kiosk","F&B Unit","Mall Unit","Street Retail",
    // Industrial
    "Warehouse","Light Industrial","Cold Storage","Logistics Hub","Factory",
    // Other Commercial
    "Commercial Building","Commercial Villa","Commercial Floor","Commercial Plot",
  ],
  "Mixed-Use": [
    "Mixed Residential & Commercial","Mixed Office & Retail","Mixed Hotel & Residential",
    "Live-Work Unit","Podium Retail + Residential Tower",
  ],
  Hospitality: [
    "Hotel Apartment","Serviced Apartment","Hotel Suite","Apart-Hotel","Holiday Home",
    "Hotel Room","Branded Residence","Resort Villa",
  ],
  Industrial: [
    "Warehouse","Light Industrial Unit","Heavy Industrial","Cold Storage Facility",
    "Data Centre","Logistics Hub","Factory",
  ],
};

// Flat list for backward compat
const TYPE_OPT = Object.values(TYPE_BY_USAGE).flat();
const RISK_OPT    = ["Low","Low-Medium","Medium","High","Critical"];
const PHASE_OPT   = ["Concept","Pre-Development","Foundation","Structure","MEP","Finishing","Handover","Delivered"];
const CONF_OPT    = ["VERIFIED","HIGH","MEDIUM","ESTIMATED"];

function Inp({value,onChange,type="text",placeholder,min,max,step,disabled}) {
  const [f,setF]=useState(false);
  return <input type={type} value={value??""} onChange={e=>onChange(e.target.value)}
    placeholder={placeholder} min={min} max={max} step={step} disabled={disabled}
    onFocus={()=>setF(true)} onBlur={()=>setF(false)}
    style={{padding:"8px 11px",background:C.surfaceC,fontFamily:C.ff,
      border:`1px solid ${f?C.gold:C.border}`,borderRadius:7,
      color:C.white,fontSize:12,outline:"none",width:"100%",boxSizing:"border-box",
      transition:"border-color 0.15s",opacity:disabled?0.5:1}}/>;
}
function Sel({value,onChange,options}) {
  const [f,setF]=useState(false);
  return <select value={value??""} onChange={e=>onChange(e.target.value)}
    onFocus={()=>setF(true)} onBlur={()=>setF(false)}
    style={{padding:"8px 11px",background:C.surfaceC,fontFamily:C.ff,
      border:`1px solid ${f?C.gold:C.border}`,borderRadius:7,
      color:C.white,fontSize:12,outline:"none",width:"100%",cursor:"pointer"}}>
    {options.map(o=><option key={o.value??o} value={o.value??o} style={{background:C.surfaceC}}>{o.label??o}</option>)}
  </select>;
}
function Txt({value,onChange,rows=2,placeholder}) {
  const [f,setF]=useState(false);
  return <textarea value={value??""} onChange={e=>onChange(e.target.value)} rows={rows} placeholder={placeholder}
    onFocus={()=>setF(true)} onBlur={()=>setF(false)}
    style={{padding:"8px 11px",background:C.surfaceC,fontFamily:C.ff,
      border:`1px solid ${f?C.gold:C.border}`,borderRadius:7,
      color:C.white,fontSize:12,outline:"none",width:"100%",boxSizing:"border-box",resize:"vertical"}}/>;
}
function Fld({label,children,cols=1}) {
  return <div style={{gridColumn:`span ${cols}`,display:"flex",flexDirection:"column",gap:5}}>
    <label style={{fontSize:9,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:1,fontFamily:C.ff}}>{label}</label>
    {children}
  </div>;
}
function Btn({children,onClick,v="ghost",sz="sm",disabled,sx={}}) {
  const [h,setH]=useState(false);
  const vs={primary:{bg:C.gold,color:"#000",b:C.gold},danger:{bg:C.redDim,color:C.red,b:C.red+"50"},
    success:{bg:C.greenDim,color:C.green,b:C.green+"50"},ghost:{bg:"transparent",color:C.text2,b:C.border}};
  const s=vs[v]||vs.ghost;
  return <button type="button" onClick={onClick} disabled={disabled}
    onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)}
    style={{cursor:disabled?"not-allowed":"pointer",fontFamily:C.ff,fontWeight:600,borderRadius:7,
      border:`1px solid ${s.b}`,fontSize:sz==="sm"?11:13,padding:sz==="sm"?"6px 14px":"9px 20px",
      background:s.bg,color:s.color,opacity:disabled?0.5:h?0.8:1,
      transform:h&&!disabled?"translateY(-1px)":"none",transition:"all 0.12s",whiteSpace:"nowrap",...sx}}>
    {children}
  </button>;
}
function Bdg({children,color=C.gold}) {
  return <span style={{fontSize:9,fontWeight:700,letterSpacing:0.8,textTransform:"uppercase",
    padding:"2px 8px",borderRadius:20,background:color+"18",color,border:`1px solid ${color}25`,
    fontFamily:C.ff,whiteSpace:"nowrap"}}>{children}</span>;
}
function Div({label}) {
  return <div style={{display:"flex",alignItems:"center",gap:10,margin:"18px 0 12px"}}>
    <div style={{flex:1,height:1,background:C.border}}/>
    <span style={{fontSize:9,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:1,fontFamily:C.ff}}>{label}</span>
    <div style={{flex:1,height:1,background:C.border}}/>
  </div>;
}
function Grid({cols=2,gap=12,children,sx={}}) {
  return <div style={{display:"grid",gridTemplateColumns:`repeat(${cols},1fr)`,gap,...sx}}>{children}</div>;
}
function Prog({val,max=100}) {
  const p=Math.min(100,Math.max(0,(val/max)*100));
  const col=p>=90?C.green:p>=50?C.gold:p>=20?C.amber:C.red;
  return <div style={{background:"rgba(255,255,255,0.05)",borderRadius:3,height:4,overflow:"hidden"}}>
    <div style={{width:`${p}%`,height:"100%",background:col,borderRadius:3,transition:"width 0.3s"}}/>
  </div>;
}
function Toast({msg,type}) {
  if(!msg) return null;
  const col=type==="error"?C.red:type==="warn"?C.amber:C.green;
  return <div style={{position:"fixed",bottom:24,right:24,zIndex:9999,background:C.surfaceB,
    border:`1px solid ${col}40`,borderRadius:10,padding:"12px 20px",display:"flex",alignItems:"center",gap:10,
    boxShadow:`0 8px 32px ${col}15`,fontSize:13,color:C.white,fontFamily:C.ff,animation:"fadeUp 0.2s ease"}}>
    <span style={{color:col,fontSize:16}}>{type==="error"?"✕":type==="warn"?"⚠":"✓"}</span>{msg}
  </div>;
}
function Modal({title,sub,onClose,children,width=900}) {
  return <div style={{position:"fixed",inset:0,zIndex:2000,background:"rgba(0,0,0,0.82)",
    backdropFilter:"blur(6px)",display:"flex",alignItems:"center",justifyContent:"center",padding:20}}
    onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
    <div style={{background:C.surfaceB,border:`1px solid ${C.borderGold}`,borderRadius:16,padding:28,
      width:"100%",maxWidth:width,maxHeight:"92vh",overflowY:"auto",animation:"fadeUp 0.2s ease",
      boxShadow:`0 32px 80px rgba(0,0,0,0.7)`}}>
      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:22}}>
        <div>
          <h2 style={{fontFamily:C.ffH,fontSize:20,fontWeight:900,color:C.white,margin:0}}>{title}</h2>
          {sub&&<div style={{fontSize:11,color:C.muted,marginTop:4}}>{sub}</div>}
        </div>
        <button type="button" onClick={onClose} style={{background:"rgba(255,255,255,0.06)",
          border:`1px solid ${C.border}`,borderRadius:7,color:C.text2,fontSize:18,
          cursor:"pointer",padding:"3px 10px",fontFamily:C.ff,lineHeight:1.4}}>✕</button>
      </div>
      {children}
    </div>
  </div>;
}

function emptyP(p={}) {
  return {
    name:p.name||"", community:p.community||"", type:p.type||"Apartments",
    beds:p.beds||"1-3BR", tier:p.tier||"Mid-Premium", status:p.status||"Off-Plan",
    branded:p.branded||false, brand:p.brand||"",
    price:p.price||0, ppsf:p.ppsf||0, priceFrom:p.priceFrom||0, priceTo:p.priceTo||0,
    sizeFrom:p.sizeFrom||0, sizeTo:p.sizeTo||0, payment:p.payment||"80/20",
    construction:p.construction||0, phase:p.phase||"Foundation",
    handover:p.handover||"", handoverYear:p.handoverYear||0,
    launchDate:p.launchDate||"", contractor:p.contractor||"", consultant:p.consultant||"",
    deliveryScore:p.deliveryScore||0,
    dldPermitNo:p.dldPermitNo||"", escrowAccount:p.escrowAccount||"",
    escrowBank:p.escrowBank||"", oqoodNo:p.oqoodNo||"", reraNo:p.reraNo||"",
    trakheesiPermit:p.trakheesiPermit||"", nocStatus:p.nocStatus||"Pending",
    escrowHealth:p.escrowHealth||"Active",
    grossYield:p.grossYield||0, netYield:p.netYield||0, capRate:p.capRate||0,
    irr5yr:p.irr5yr||0, appreciation5yr:p.appreciation5yr||0,
    appreciationYoY:p.appreciationYoY||0, serviceCharge:p.serviceCharge||0,
    goldenVisa:p.goldenVisa||"Yes", riskLevel:p.riskLevel||"Low",
    liquidityScore:p.liquidityScore||0,
    dldTxCount:p.dldTxCount||0, dldAvgResale:p.dldAvgResale||0,
    priceVsAvg:p.priceVsAvg||0, unitsTotal:p.unitsTotal||0,
    unitsSold:p.unitsSold||0, unitsAvailable:p.unitsAvailable||0,
    avgDaysToSell:p.avgDaysToSell||0, demandScore:p.demandScore||0,
    flipsCount:p.flipsCount||0, mortgagePct:p.mortgagePct||0,
    officialUrl:p.officialUrl||p.emaarUrl||"", bayutUrl:p.bayutUrl||"",
    pfUrl:p.pfUrl||"", brochureUrl:p.brochureUrl||"",
    floorPlanUrl:p.floorPlanUrl||"", masterPlanUrl:p.masterPlanUrl||"",
    videoUrl:p.videoUrl||"", imageUrl:p.imageUrl||"",
    famousFor:p.famousFor||"", analystNote:p.analystNote||"",
    riskNote:p.riskNote||"", confidence:p.confidence||"VERIFIED",
    source:p.source||"DXB Analytics", lastVerified:p.lastVerified||"",
  };
}

function emptyC(d={}) {
  return {
    grossYield_apt1:d.grossYield?.apt1??6, grossYield_apt2:d.grossYield?.apt2??5.5,
    grossYield_apt3:d.grossYield?.apt3??5, grossYield_th:d.grossYield?.th??5,
    grossYield_villa:d.grossYield?.villa??4.5,
    netYield_apt1:d.netYield?.apt1??5, netYield_apt2:d.netYield?.apt2??4.5,
    netYield_apt3:d.netYield?.apt3??4, netYield_th:d.netYield?.th??4,
    netYield_villa:d.netYield?.villa??3.8,
    estRent_apt1:d.estRent?.apt1??100000, estRent_apt2:d.estRent?.apt2??145000,
    estRent_apt3:d.estRent?.apt3??195000, estRent_th:d.estRent?.th??160000,
    estRent_villa:d.estRent?.villa??280000,
    appreciationYoY:d.appreciationYoY??12, appreciation5yr:d.appreciation5yr??38,
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

function ProjectModal({project,onSave,onClose,saving}) {
  const [form,setForm]=useState(()=>emptyP(project));
  const s=(k,v)=>setForm(f=>({...f,[k]:v}));
  return (
    <Modal title={project?.id?"Edit: "+project.name:"Add New Project"}
      sub={project?.id?`${project.community} · ${project.id}`:"Create a new Emaar project record"}
      onClose={onClose} width={950}>

      <Div label="Core Identity"/>
      <Grid cols={3} gap={12}>
        <Fld label="Project Name" cols={2}><Inp value={form.name} onChange={v=>s("name",v)} placeholder="e.g. Vida Residences Hillside"/></Fld>
        <Fld label="Community"><Sel value={form.community} onChange={v=>s("community",v)} options={["", ...COMMUNITIES.map(c=>({value:c.name,label:c.name}))]}/></Fld>
        <Fld label="Usage Category"><Sel value={form.usage} onChange={v=>{s("usage",v);s("type",(TYPE_BY_USAGE[v]||TYPE_OPT)[0]);}} options={PROPERTY_USAGE}/></Fld>
        <Fld label="Property Type"><Sel value={form.type} onChange={v=>s("type",v)} options={(TYPE_BY_USAGE[form.usage||"Residential"]||TYPE_OPT).map(t=>({value:t,label:t}))}/></Fld>
        <Fld label="Bedrooms"><Inp value={form.beds} onChange={v=>s("beds",v)} placeholder="e.g. 1-3BR"/></Fld>
        <Fld label="Tier"><Sel value={form.tier} onChange={v=>s("tier",v)} options={TIER_OPT}/></Fld>
        <Fld label="Status"><Sel value={form.status} onChange={v=>s("status",v)} options={STATUS_OPT}/></Fld>
        <Fld label="Branded"><Sel value={form.branded?"Yes":"No"} onChange={v=>s("branded",v==="Yes")} options={["No","Yes"]}/></Fld>
        {form.branded&&<Fld label="Brand Partner"><Inp value={form.brand} onChange={v=>s("brand",v)} placeholder="e.g. Address, Vida, Palace"/></Fld>}
        <Fld label="Confidence"><Sel value={form.confidence} onChange={v=>s("confidence",v)} options={CONF_OPT}/></Fld>
      </Grid>

      <Div label="Pricing & Size"/>
      <Grid cols={4} gap={12}>
        <Fld label="Starting Price (AED)"><Inp type="number" value={form.price} onChange={v=>s("price",+v)}/></Fld>
        <Fld label="Price/sqft (AED)"><Inp type="number" value={form.ppsf} onChange={v=>s("ppsf",+v)}/></Fld>
        <Fld label="Price From (AED)"><Inp type="number" value={form.priceFrom} onChange={v=>s("priceFrom",+v)}/></Fld>
        <Fld label="Price To (AED)"><Inp type="number" value={form.priceTo} onChange={v=>s("priceTo",+v)}/></Fld>
        <Fld label="Size From (sqft)"><Inp type="number" value={form.sizeFrom} onChange={v=>s("sizeFrom",+v)}/></Fld>
        <Fld label="Size To (sqft)"><Inp type="number" value={form.sizeTo} onChange={v=>s("sizeTo",+v)}/></Fld>
        <Fld label="Payment Plan"><Inp value={form.payment} onChange={v=>s("payment",v)} placeholder="e.g. 80/20 or 10/80/10"/></Fld>
      </Grid>

      <Div label="Unit Features & Specifications"/>
      <Grid cols={4} gap={12}>
        <Fld label="Balcony"><Sel value={form.balcony||"Yes"} onChange={v=>s("balcony",v)} options={["Yes","No","Multiple","Wraparound","Terrace","Private Pool Deck"]}/></Fld>
        <Fld label="View Type"><Sel value={form.viewType||"Community"} onChange={v=>s("viewType",v)} options={["Burj Khalifa","Sea / Water","Golf Course","Creek","Marina","City","Community","Park / Garden","Pool","Desert","Multiple Sides"]}/></Fld>
        <Fld label="Furnishing"><Sel value={form.furnishing||"Unfurnished"} onChange={v=>s("furnishing",v)} options={["Unfurnished","Semi-Furnished","Fully Furnished","Hotel-Grade","Smart Home"]}/></Fld>
        <Fld label="Parking Spaces"><Inp type="number" min={0} value={form.parking||0} onChange={v=>s("parking",+v)}/></Fld>
        <Fld label="Floor Level"><Inp value={form.floorLevel||""} onChange={v=>s("floorLevel",v)} placeholder="e.g. Low / Mid / High / Podium"/></Fld>
        <Fld label="Total Floors in Building"><Inp type="number" value={form.totalFloors||0} onChange={v=>s("totalFloors",+v)}/></Fld>
        <Fld label="Year Built / Expected"><Inp value={form.yearBuilt||""} onChange={v=>s("yearBuilt",v)} placeholder="e.g. 2024 or Q4 2027"/></Fld>
        <Fld label="Ownership Type"><Sel value={form.ownershipType||"Freehold"} onChange={v=>s("ownershipType",v)} options={["Freehold","Leasehold","Commonhold","Usufruct"]}/></Fld>
        <Fld label="Sale Type"><Sel value={form.saleType||"Off-Plan"} onChange={v=>s("saleType",v)} options={["Off-Plan","Ready / Resale","Post-Handover Payment Plan","Bulk Unit Sale","Plot Sale"]}/></Fld>
        <Fld label="STR / Holiday Home License"><Sel value={form.strEligible||"TBC"} onChange={v=>s("strEligible",v)} options={["Yes — DTCM Licensed","Yes — Eligible","No","TBC"]}/></Fld>
        <Fld label="DTCM Permit No (Holiday Home)"><Inp value={form.dtcmPermit||""} onChange={v=>s("dtcmPermit",v)} placeholder="DTCM-XXXXXX"/></Fld>
        <Fld label="VAT Applicable"><Sel value={form.vatApplicable||"No"} onChange={v=>s("vatApplicable",v)} options={["No (Residential)","Yes — 5% (Commercial)","Yes — 0% (First Sale)"]}/></Fld>
      </Grid>

      <Div label="Construction Intelligence"/>
      <Grid cols={4} gap={12}>
        <Fld label="Construction %"><Inp type="number" min={0} max={100} value={form.construction} onChange={v=>s("construction",+v)}/></Fld>
        <Fld label="Phase"><Sel value={form.phase} onChange={v=>s("phase",v)} options={PHASE_OPT}/></Fld>
        <Fld label="Handover Quarter"><Inp value={form.handover} onChange={v=>s("handover",v)} placeholder="e.g. Q4 2027"/></Fld>
        <Fld label="Handover Year"><Inp type="number" value={form.handoverYear} onChange={v=>s("handoverYear",+v)} placeholder="2027"/></Fld>
        <Fld label="Launch Date"><Inp value={form.launchDate} onChange={v=>s("launchDate",v)} placeholder="e.g. Mar 2024"/></Fld>
        <Fld label="Main Contractor"><Inp value={form.contractor} onChange={v=>s("contractor",v)} placeholder="e.g. Arabtec"/></Fld>
        <Fld label="Consultant / Engineer"><Inp value={form.consultant} onChange={v=>s("consultant",v)} placeholder="e.g. WSP"/></Fld>
        <Fld label="Delivery Risk Score (1-10)"><Inp type="number" min={1} max={10} value={form.deliveryScore} onChange={v=>s("deliveryScore",+v)}/></Fld>
      </Grid>
      <div style={{marginTop:10,padding:"12px 14px",background:C.surfaceC,borderRadius:8}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
          <span style={{fontSize:10,color:C.muted,fontFamily:C.ff}}>Construction Progress Preview</span>
          <span style={{fontSize:12,fontWeight:700,color:C.gold,fontFamily:C.ff}}>{form.construction}%</span>
        </div>
        <Prog val={form.construction}/>
      </div>

      </Grid>

      <Div label="DLD / RERA Compliance (Law 8/2007 + Oqood)"/>
      <Grid cols={3} gap={12}>
        <Fld label="DLD Permit No"><Inp value={form.dldPermitNo} onChange={v=>s("dldPermitNo",v)} placeholder="e.g. 0000/2024"/></Fld>
        <Fld label="Escrow Account No"><Inp value={form.escrowAccount} onChange={v=>s("escrowAccount",v)} placeholder="e.g. 123456789"/></Fld>
        <Fld label="Escrow Bank"><Inp value={form.escrowBank} onChange={v=>s("escrowBank",v)} placeholder="e.g. Emirates NBD"/></Fld>
        <Fld label="Oqood Registration No"><Inp value={form.oqoodNo} onChange={v=>s("oqoodNo",v)} placeholder="Oqood No."/></Fld>
        <Fld label="RERA Registration No"><Inp value={form.reraNo} onChange={v=>s("reraNo",v)} placeholder="RERA No."/></Fld>
        <Fld label="Trakheesi Permit No"><Inp value={form.trakheesiPermit} onChange={v=>s("trakheesiPermit",v)} placeholder="Trakheesi No."/></Fld>
        <Fld label="NOC Status"><Sel value={form.nocStatus} onChange={v=>s("nocStatus",v)} options={["Pending","Approved","Rejected","N/A"]}/></Fld>
        <Fld label="Escrow Health"><Sel value={form.escrowHealth} onChange={v=>s("escrowHealth",v)} options={["Active","Suspended","Closed","Under Review"]}/></Fld>
      </Grid>

      <Div label="Investment Intelligence (Bloomberg-Level)"/>
      <Grid cols={4} gap={12}>
        <Fld label="Gross Yield %"><Inp type="number" step="0.1" value={form.grossYield} onChange={v=>s("grossYield",+v)}/></Fld>
        <Fld label="Net Yield %"><Inp type="number" step="0.1" value={form.netYield} onChange={v=>s("netYield",+v)}/></Fld>
        <Fld label="Cap Rate %"><Inp type="number" step="0.1" value={form.capRate} onChange={v=>s("capRate",+v)}/></Fld>
        <Fld label="5-yr IRR %"><Inp type="number" step="0.1" value={form.irr5yr} onChange={v=>s("irr5yr",+v)}/></Fld>
        <Fld label="5-yr Appreciation %"><Inp type="number" value={form.appreciation5yr} onChange={v=>s("appreciation5yr",+v)}/></Fld>
        <Fld label="YoY Growth %"><Inp type="number" value={form.appreciationYoY} onChange={v=>s("appreciationYoY",+v)}/></Fld>
        <Fld label="Service Charge (AED/sqft/yr)"><Inp type="number" step="0.5" value={form.serviceCharge} onChange={v=>s("serviceCharge",+v)}/></Fld>
        <Fld label="Risk Level"><Sel value={form.riskLevel} onChange={v=>s("riskLevel",v)} options={RISK_OPT}/></Fld>
        <Fld label="Golden Visa"><Sel value={form.goldenVisa} onChange={v=>s("goldenVisa",v)} options={["Yes","No","Conditional"]}/></Fld>
        <Fld label="Liquidity Score (1-10)"><Inp type="number" min={1} max={10} value={form.liquidityScore} onChange={v=>s("liquidityScore",+v)}/></Fld>
      </Grid>

      <Div label="Market Intelligence (DLD Transaction Data)"/>
      <Grid cols={4} gap={12}>
        <Fld label="DLD Transaction Count"><Inp type="number" value={form.dldTxCount} onChange={v=>s("dldTxCount",+v)}/></Fld>
        <Fld label="DLD Avg Resale (AED)"><Inp type="number" value={form.dldAvgResale} onChange={v=>s("dldAvgResale",+v)}/></Fld>
        <Fld label="Price vs Community Avg %"><Inp type="number" step="0.1" value={form.priceVsAvg} onChange={v=>s("priceVsAvg",+v)} placeholder="+12 or -5"/></Fld>
        <Fld label="Total Units"><Inp type="number" value={form.unitsTotal} onChange={v=>s("unitsTotal",+v)}/></Fld>
        <Fld label="Units Sold"><Inp type="number" value={form.unitsSold} onChange={v=>s("unitsSold",+v)}/></Fld>
        <Fld label="Units Available"><Inp type="number" value={form.unitsAvailable} onChange={v=>s("unitsAvailable",+v)}/></Fld>
        <Fld label="Avg Days to Sell"><Inp type="number" value={form.avgDaysToSell} onChange={v=>s("avgDaysToSell",+v)}/></Fld>
        <Fld label="Demand Score (1-10)"><Inp type="number" min={1} max={10} value={form.demandScore} onChange={v=>s("demandScore",+v)}/></Fld>
        <Fld label="Resale Flips Count"><Inp type="number" value={form.flipsCount} onChange={v=>s("flipsCount",+v)}/></Fld>
        <Fld label="Mortgage Buyers %"><Inp type="number" value={form.mortgagePct} onChange={v=>s("mortgagePct",+v)}/></Fld>
      </Grid>

      <Div label="Documents & Links"/>
      <Grid cols={2} gap={12}>
        <Fld label="Official Project URL"><Inp value={form.officialUrl} onChange={v=>s("officialUrl",v)} placeholder="https://properties.emaar.com/..."/></Fld>
        <Fld label="Bayut Listing URL"><Inp value={form.bayutUrl} onChange={v=>s("bayutUrl",v)} placeholder="https://www.bayut.com/..."/></Fld>
        <Fld label="PropertyFinder URL"><Inp value={form.pfUrl} onChange={v=>s("pfUrl",v)} placeholder="https://www.propertyfinder.ae/..."/></Fld>
        <Fld label="Brochure PDF URL"><Inp value={form.brochureUrl} onChange={v=>s("brochureUrl",v)} placeholder="https://..."/></Fld>
        <Fld label="Floor Plan URL"><Inp value={form.floorPlanUrl} onChange={v=>s("floorPlanUrl",v)} placeholder="https://..."/></Fld>
        <Fld label="Master Plan URL"><Inp value={form.masterPlanUrl} onChange={v=>s("masterPlanUrl",v)} placeholder="https://..."/></Fld>
        <Fld label="Video / 360° Tour URL"><Inp value={form.videoUrl} onChange={v=>s("videoUrl",v)} placeholder="https://..."/></Fld>
        <Fld label="Hero Image URL"><Inp value={form.imageUrl} onChange={v=>s("imageUrl",v)} placeholder="https://..."/></Fld>
      </Grid>

      <Div label="Intelligence Notes"/>
      <Grid cols={1} gap={12}>
        <Fld label="Famous For / Key Selling Points"><Txt value={form.famousFor} onChange={v=>s("famousFor",v)} rows={2} placeholder="e.g. 18-hole golf course, Burj Khalifa view, 54km bicycle route..."/></Fld>
        <Fld label="Analyst Note"><Txt value={form.analystNote} onChange={v=>s("analystNote",v)} rows={2} placeholder="e.g. Strong resale demand. Q3 2027 handover on track per RERA inspection..."/></Fld>
        <Fld label="Risk Factors"><Txt value={form.riskNote} onChange={v=>s("riskNote",v)} rows={2} placeholder="e.g. Oversupply risk in community. Service charges above market average..."/></Fld>
      </Grid>
      <Grid cols={2} gap={12} sx={{marginTop:12}}>
        <Fld label="Data Source"><Inp value={form.source} onChange={v=>s("source",v)} placeholder="e.g. Bayut.com, emaar.com, DLD Q1 2026"/></Fld>
        <Fld label="Last Verified"><Inp value={form.lastVerified} onChange={v=>s("lastVerified",v)} placeholder="e.g. April 2026"/></Fld>
      </Grid>

      <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:24,paddingTop:16,borderTop:`1px solid ${C.border}`}}>
        <Btn onClick={onClose}>Cancel</Btn>
        <Btn v="success" onClick={()=>onSave(form)} disabled={saving}>{saving?"Publishing…":"⚡ Publish → Live"}</Btn>
      </div>
    </Modal>
  );
}

function CommunityModal({community,data,onSave,onClose,saving}) {
  const [form,setForm]=useState(()=>emptyC(data));
  const s=(k,v)=>setForm(f=>({...f,[k]:v}));
  const beds=[{k:"apt1",l:"1BR"},{k:"apt2",l:"2BR"},{k:"apt3",l:"3BR"},{k:"th",l:"Townhouse"},{k:"villa",l:"Villa"}];
  return (
    <Modal title={community.name} sub={`${community.type} · ${community.area} · ${community.projects} projects · ${community.avgPpsf?.toLocaleString()} AED/sqft avg`} onClose={onClose} width={1050}>
      <Div label="Yield & Rent by Bedroom Type"/>
      <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:10,marginBottom:8}}>
        {beds.map(({k,l})=>(
          <div key={k} style={{background:C.surfaceC,borderRadius:10,padding:12,border:`1px solid ${C.border}`}}>
            <div style={{fontSize:9,fontWeight:700,color:C.gold,textTransform:"uppercase",letterSpacing:0.8,marginBottom:10,fontFamily:C.ff}}>{l}</div>
            <Fld label="Gross Yield %"><Inp type="number" step="0.1" value={form[`grossYield_${k}`]} onChange={v=>s(`grossYield_${k}`,v)}/></Fld>
            <div style={{marginTop:8}}><Fld label="Net Yield %"><Inp type="number" step="0.1" value={form[`netYield_${k}`]} onChange={v=>s(`netYield_${k}`,v)}/></Fld></div>
            <div style={{marginTop:8}}><Fld label="Est Rent AED/yr"><Inp type="number" value={form[`estRent_${k}`]} onChange={v=>s(`estRent_${k}`,v)}/></Fld></div>
          </div>
        ))}
      </div>

      <Div label="Market Performance"/>
      <Grid cols={4} gap={12}>
        <Fld label="5-yr Appreciation %"><Inp type="number" value={form.appreciation5yr} onChange={v=>s("appreciation5yr",v)}/></Fld>
        <Fld label="YoY Growth %"><Inp type="number" value={form.appreciationYoY} onChange={v=>s("appreciationYoY",v)}/></Fld>
        <Fld label="Occupancy %"><Inp type="number" value={form.occupancy} onChange={v=>s("occupancy",v)}/></Fld>
        <Fld label="Avg Days to Lease"><Inp type="number" value={form.avgDaysToLease} onChange={v=>s("avgDaysToLease",v)}/></Fld>
        <Fld label="Short-Term Premium %"><Inp type="number" value={form.shortTermPremium} onChange={v=>s("shortTermPremium",v)}/></Fld>
        <Fld label="Risk Level"><Sel value={form.riskLevel} onChange={v=>s("riskLevel",v)} options={RISK_OPT}/></Fld>
        <Fld label="Golden Visa Eligible"><Sel value={form.goldenVisa} onChange={v=>s("goldenVisa",v)} options={["Yes","No","Conditional"]}/></Fld>
        <Fld label="Off-Plan Transactions %"><Inp type="number" value={form.offPlanPct} onChange={v=>s("offPlanPct",v)}/></Fld>
      </Grid>

      <Div label="Cost Structure (UAE / DLD Standard)"/>
      <Grid cols={4} gap={12}>
        <Fld label="Service Charge (AED/sqft/yr)"><Inp type="number" step="0.5" value={form.serviceCharge} onChange={v=>s("serviceCharge",v)}/></Fld>
        <Fld label="DLD Transfer Fee %"><Inp type="number" step="0.5" value={form.transferFee} onChange={v=>s("transferFee",v)}/></Fld>
        <Fld label="Agent Commission %"><Inp type="number" step="0.5" value={form.agentCommission} onChange={v=>s("agentCommission",v)}/></Fld>
      </Grid>

      <Div label="DLD Transaction Intelligence (Bloomberg-Level)"/>
      <Grid cols={4} gap={12}>
        <Fld label="Avg PPSF (AED)"><Inp type="number" value={form.avgPpsf} onChange={v=>s("avgPpsf",v)}/></Fld>
        <Fld label="DLD Transaction Count"><Inp type="number" value={form.dldTxCount} onChange={v=>s("dldTxCount",v)}/></Fld>
        <Fld label="Total DLD Value (AED M)"><Inp type="number" value={form.dldTotalValue} onChange={v=>s("dldTotalValue",v)}/></Fld>
        <Fld label="Avg Resale Price (AED)"><Inp type="number" value={form.avgResalePrice} onChange={v=>s("avgResalePrice",v)}/></Fld>
        <Fld label="Supply Pipeline (units)"><Inp type="number" value={form.supplyPipeline} onChange={v=>s("supplyPipeline",v)}/></Fld>
      </Grid>

      <Div label="Intelligence Notes"/>
      <Grid cols={1} gap={12}>
        <Fld label="Capital Growth Driver"><Txt value={form.capitalGrowthDriver} onChange={v=>s("capitalGrowthDriver",v)} rows={2} placeholder="e.g. Dubai Hills Mall, schools, limited villa supply, golf course premium"/></Fld>
        <Fld label="Rental Demand Driver"><Txt value={form.rentalDemandDriver} onChange={v=>s("rentalDemandDriver",v)} rows={2} placeholder="e.g. Proximity to DIFC, strong expat demand, short-term holiday home market"/></Fld>
        <Fld label="Risk Factors"><Txt value={form.riskFactors} onChange={v=>s("riskFactors",v)} rows={2} placeholder="e.g. Oversupply in 2026 pipeline. 3,200 units delivering Q3-Q4 2026..."/></Fld>
        <Fld label="Analyst Note"><Txt value={form.analystNote} onChange={v=>s("analystNote",v)} rows={2} placeholder="e.g. Strongest villa community in Dubai by resale velocity. DLD data confirms..."/></Fld>
      </Grid>

      <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:24,paddingTop:16,borderTop:`1px solid ${C.border}`}}>
        <Btn onClick={onClose}>Cancel</Btn>
        <Btn v="success" onClick={()=>onSave(form)} disabled={saving}>{saving?"Publishing…":"⚡ Publish → Live"}</Btn>
      </div>
    </Modal>
  );
}

export default function DataManagerTab({emaarProjects=[]}) {
  const [activeTab,  setActiveTab]  = useState("projects");
  const [overrides,  setOverrides]  = useState({});
  const [commData,   setCommData]   = useState({});
  const [saving,     setSaving]     = useState(false);
  const [toast,      setToast]      = useState({msg:"",type:"success"});
  const [search,     setSearch]     = useState("");
  const [filterComm, setFilterComm] = useState("All");
  const [filterStat, setFilterStat] = useState("All");
  const [sortBy,     setSortBy]     = useState("name");
  const [editProj,   setEditProj]   = useState(null);
  const [editComm,   setEditComm]   = useState(null);
  const [delConfirm, setDelConfirm] = useState(null);
  const timer = useRef(null);

  useEffect(()=>{
    const u1=onSnapshot(collection(db,"projectData"),snap=>{
      const m={};snap.forEach(d=>{m[d.id]=d.data();});setOverrides(m);
    });
    const u2=onSnapshot(collection(db,"communityROI"),snap=>{
      const m={};snap.forEach(d=>{m[d.id]=d.data();});setCommData(m);
    });
    return()=>{u1();u2();};
  },[]);

  function notify(msg,type="success"){
    setToast({msg,type});clearTimeout(timer.current);
    timer.current=setTimeout(()=>setToast({msg:"",type:"success"}),3500);
  }

  const merged = emaarProjects.map(p=>{
    const ov=overrides[String(p.id)]||{};
    return{...p,...ov,_live:Object.keys(ov).length>0,_id:String(p.id)};
  });

  const filtered = merged.filter(p=>{
    const ms=!search||p.name.toLowerCase().includes(search.toLowerCase())||p.community.toLowerCase().includes(search.toLowerCase());
    const mc=filterComm==="All"||p.community===filterComm;
    const mst=filterStat==="All"||p.status===filterStat;
    return ms&&mc&&mst;
  }).sort((a,b)=>{
    if(sortBy==="name")         return a.name.localeCompare(b.name);
    if(sortBy==="price")        return(b.price||0)-(a.price||0);
    if(sortBy==="construction") return(b.construction||0)-(a.construction||0);
    if(sortBy==="handover")     return(a.handover||"").localeCompare(b.handover||"");
    return 0;
  });

  async function saveProj(form){
    setSaving(true);
    try{
      const id=editProj?.id||("custom-"+Date.now());
      await setDoc(doc(db,"projectData",String(id)),{...form,updatedAt:serverTimestamp()},{merge:true});
      notify("✓ "+form.name+" published to dashboard");setEditProj(null);
    }catch(e){notify("Save failed: "+e.message,"error");}
    setSaving(false);
  }

  async function saveComm(form){
    setSaving(true);
    try{
      const id=editComm.id;
      await setDoc(doc(db,"communityROI",id),{
        grossYield:{apt1:+form.grossYield_apt1,apt2:+form.grossYield_apt2,apt3:+form.grossYield_apt3,th:+form.grossYield_th,villa:+form.grossYield_villa},
        netYield:{apt1:+form.netYield_apt1,apt2:+form.netYield_apt2,apt3:+form.netYield_apt3,th:+form.netYield_th,villa:+form.netYield_villa},
        estRent:{apt1:+form.estRent_apt1,apt2:+form.estRent_apt2,apt3:+form.estRent_apt3,th:+form.estRent_th,villa:+form.estRent_villa},
        appreciationYoY:+form.appreciationYoY,appreciation5yr:+form.appreciation5yr,
        occupancy:+form.occupancy,avgDaysToLease:+form.avgDaysToLease,
        shortTermPremium:+form.shortTermPremium,riskLevel:form.riskLevel,
        serviceCharge:+form.serviceCharge,transferFee:+form.transferFee,
        agentCommission:+form.agentCommission,goldenVisa:form.goldenVisa,
        avgPpsf:+form.avgPpsf,dldTxCount:+form.dldTxCount,
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

  const liveCount=Object.keys(overrides).length;
  const commCount=Object.keys(commData).length;
  const avgConst=merged.reduce((s,p)=>s+(p.construction||0),0)/Math.max(1,merged.length);
  const readyCount=merged.filter(p=>p.status==="Ready"||p.status==="Delivered").length;

  return(
    <div style={{fontFamily:C.ff,color:C.white,minHeight:"100vh"}}>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}*{box-sizing:border-box}::-webkit-scrollbar{width:4px;height:4px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:rgba(212,168,67,0.25);border-radius:2px}`}</style>
      <Toast msg={toast.msg} type={toast.type}/>
      {editProj!==null&&<ProjectModal project={editProj} onSave={saveProj} onClose={()=>setEditProj(null)} saving={saving}/>}
      {editComm!==null&&<CommunityModal community={editComm} data={commData[editComm?.id]||{}} onSave={saveComm} onClose={()=>setEditComm(null)} saving={saving}/>}

      {delConfirm&&(
        <div style={{position:"fixed",inset:0,zIndex:3000,background:"rgba(0,0,0,0.85)",display:"flex",alignItems:"center",justifyContent:"center"}}>
          <div style={{background:C.surfaceB,border:`1px solid ${C.red}40`,borderRadius:14,padding:28,maxWidth:420,width:"100%"}}>
            <div style={{fontSize:16,fontWeight:700,color:C.white,marginBottom:10,fontFamily:C.ffH}}>Remove Firestore Override?</div>
            <div style={{fontSize:13,color:C.text2,marginBottom:20}}>Removes live override for <strong style={{color:C.gold}}>{delConfirm.name}</strong>. Project reverts to static file data.</div>
            <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
              <Btn onClick={()=>setDelConfirm(null)}>Cancel</Btn>
              <Btn v="danger" onClick={()=>delOverride(delConfirm.id)}>Remove Override</Btn>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{marginBottom:24}}>
        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",flexWrap:"wrap",gap:12,marginBottom:16}}>
          <div>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:4}}>
              <div style={{width:3,height:28,background:`linear-gradient(180deg,${C.gold},${C.teal})`,borderRadius:2}}/>
              <h1 style={{fontFamily:C.ffH,fontSize:24,fontWeight:900,color:C.white,margin:0}}>Data Manager</h1>
              <Bdg color={C.green}>Bloomberg-Level</Bdg>
            </div>
            <p style={{fontSize:12,color:C.muted,margin:"0 0 0 13px"}}>Real-time Firestore sync · DLD/RERA compliant · 50+ data fields per project · Instant dashboard publish</p>
          </div>
          <div style={{fontSize:11,color:C.green,background:C.greenDim,padding:"6px 14px",borderRadius:20,border:`1px solid ${C.green}30`,display:"flex",alignItems:"center",gap:6}}>
            <span style={{width:6,height:6,borderRadius:"50%",background:C.green,display:"inline-block"}}/>LIVE · Instant sync
          </div>
        </div>

        {/* Stats */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))",gap:10,marginBottom:20}}>
          {[
            {l:"Total Projects",   v:merged.length,    c:C.gold},
            {l:"Communities",      v:COMMUNITIES.length,c:C.teal},
            {l:"Live Overrides",   v:liveCount,         c:C.green},
            {l:"Comm. Data Sets",  v:commCount,         c:C.blue},
            {l:"Avg Construction", v:avgConst.toFixed(0)+"%",c:C.amber},
            {l:"Ready/Delivered",  v:readyCount,        c:C.purple},
          ].map(({l,v,c})=>(
            <div key={l} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,padding:"12px 16px"}}>
              <div style={{fontSize:8,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:0.8,marginBottom:3,fontFamily:C.ff}}>{l}</div>
              <div style={{fontSize:20,fontWeight:900,color:c,fontFamily:C.ffH}}>{v}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{display:"flex",gap:0,borderBottom:`1px solid ${C.border}`,marginBottom:20}}>
          {[{id:"projects",l:"Projects",n:merged.length,c:C.gold},{id:"communities",l:"Communities",n:COMMUNITIES.length,c:C.teal}].map(t=>(
            <button key={t.id} type="button" onClick={()=>setActiveTab(t.id)} style={{
              padding:"10px 20px",background:"none",border:"none",cursor:"pointer",fontFamily:C.ff,
              borderBottom:`2px solid ${activeTab===t.id?t.c:"transparent"}`,
              color:activeTab===t.id?t.c:C.muted,fontSize:13,fontWeight:600,
              display:"flex",alignItems:"center",gap:8,transition:"color 0.15s",
            }}>
              {t.l}
              <span style={{fontSize:10,fontWeight:700,padding:"1px 7px",borderRadius:10,
                background:activeTab===t.id?t.c+"18":"rgba(255,255,255,0.04)",
                color:activeTab===t.id?t.c:C.muted}}>{t.n}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Projects Tab */}
      {activeTab==="projects"&&(
        <div>
          <div style={{display:"flex",gap:10,marginBottom:14,flexWrap:"wrap",alignItems:"center"}}>
            <input type="text" placeholder="🔍  Search projects or community..."
              value={search} onChange={e=>setSearch(e.target.value)}
              style={{flex:1,minWidth:220,padding:"9px 14px",background:C.surface,border:`1px solid ${C.border}`,borderRadius:8,color:C.white,fontSize:13,fontFamily:C.ff,outline:"none"}}/>
            <select value={filterComm} onChange={e=>setFilterComm(e.target.value)}
              style={{padding:"9px 14px",background:C.surface,border:`1px solid ${C.border}`,borderRadius:8,color:C.white,fontSize:12,fontFamily:C.ff,outline:"none",cursor:"pointer"}}>
              <option value="All">All Communities</option>
              {COMMUNITIES.map(c=><option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
            <select value={filterStat} onChange={e=>setFilterStat(e.target.value)}
              style={{padding:"9px 14px",background:C.surface,border:`1px solid ${C.border}`,borderRadius:8,color:C.white,fontSize:12,fontFamily:C.ff,outline:"none",cursor:"pointer"}}>
              <option value="All">All Statuses</option>
              {STATUS_OPT.map(s=><option key={s} value={s}>{s}</option>)}
            </select>
            <select value={sortBy} onChange={e=>setSortBy(e.target.value)}
              style={{padding:"9px 14px",background:C.surface,border:`1px solid ${C.border}`,borderRadius:8,color:C.white,fontSize:12,fontFamily:C.ff,outline:"none",cursor:"pointer"}}>
              <option value="name">Sort: Name</option>
              <option value="price">Sort: Price ↓</option>
              <option value="construction">Sort: Build% ↓</option>
              <option value="handover">Sort: Handover</option>
            </select>
            <span style={{fontSize:12,color:C.muted,whiteSpace:"nowrap"}}>{filtered.length} of {merged.length}</span>
          </div>

          <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,overflow:"hidden"}}>
            <div style={{display:"grid",gridTemplateColumns:"2fr 1.2fr 90px 90px 80px 90px 90px 100px",
              padding:"9px 16px",borderBottom:`1px solid ${C.border}`,
              fontSize:9,fontWeight:700,color:C.muted,letterSpacing:0.8,textTransform:"uppercase",
              background:"rgba(212,168,67,0.03)"}}>
              <span>Project</span><span>Community</span><span>Price</span><span>PPSF</span>
              <span>Build%</span><span>Status</span><span>Handover</span><span style={{textAlign:"right"}}>Actions</span>
            </div>
            <div style={{maxHeight:520,overflowY:"auto"}}>
              {filtered.map((p,i)=>(
                <div key={p._id||i}
                  style={{display:"grid",gridTemplateColumns:"2fr 1.2fr 90px 90px 80px 90px 90px 100px",
                    padding:"10px 16px",borderBottom:`1px solid ${C.border}`,alignItems:"center",
                    background:i%2===0?"transparent":"rgba(255,255,255,0.01)",transition:"background 0.1s"}}
                  onMouseEnter={e=>e.currentTarget.style.background="rgba(212,168,67,0.04)"}
                  onMouseLeave={e=>e.currentTarget.style.background=i%2===0?"transparent":"rgba(255,255,255,0.01)"}>
                  <div>
                    <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:2}}>
                      <span style={{fontSize:13,fontWeight:600,color:C.white}}>{p.name}</span>
                      {p._live&&<Bdg color={C.green}>LIVE</Bdg>}
                      {p.branded&&<Bdg color={C.gold}>{p.brand}</Bdg>}
                    </div>
                    <div style={{fontSize:10,color:C.muted}}>{p.type} · {p.beds}</div>
                  </div>
                  <div>
                    <div style={{fontSize:11,color:C.text2}}>{p.community}</div>
                    {p.dldPermitNo&&<div style={{fontSize:9,color:C.muted,marginTop:1}}>DLD: {p.dldPermitNo}</div>}
                  </div>
                  <span style={{fontSize:12,fontWeight:600,color:C.gold}}>
                    {p.price?"AED "+(p.price/1e6).toFixed(2)+"M":"—"}
                  </span>
                  <span style={{fontSize:12,color:C.text2}}>{p.ppsf?.toLocaleString()||"—"}</span>
                  <div>
                    <div style={{fontSize:11,color:C.white,marginBottom:3}}>{p.construction||0}%</div>
                    <Prog val={p.construction||0}/>
                  </div>
                  <Bdg color={p.status==="Ready"||p.status==="Delivered"?C.green:p.status==="Under Construction"?C.gold:p.status==="Off-Plan"?C.blue:C.muted}>
                    {p.status==="Under Construction"?"U/C":p.status||"—"}
                  </Bdg>
                  <span style={{fontSize:12,color:C.text2}}>{p.handover||"—"}</span>
                  <div style={{display:"flex",gap:4,justifyContent:"flex-end"}}>
                    <Btn sz="sm" onClick={()=>setEditProj(p)}>Edit</Btn>
                    {p._live&&<Btn sz="sm" v="danger" onClick={()=>setDelConfirm(p)}>✕</Btn>}
                  </div>
                </div>
              ))}
              {filtered.length===0&&(
                <div style={{padding:40,textAlign:"center",color:C.muted,fontSize:13}}>No projects match your search</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Communities Tab */}
      {activeTab==="communities"&&(
        <div>
          <p style={{fontSize:12,color:C.muted,marginBottom:16}}>
            Bloomberg-level investment data per community — 30+ fields including DLD transaction data, cost structure, risk analysis, yield by bed type. All changes reflect instantly on the dashboard.
          </p>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:12}}>
            {COMMUNITIES.map(c=>{
              const d=commData[c.id]||{};const has=!!commData[c.id];const y=d.grossYield?.apt1;const tx=d.dldTxCount||0;
              return(
                <div key={c.id}
                  style={{background:C.surface,border:`1px solid ${has?C.green+"30":C.border}`,
                    borderRadius:12,padding:"16px 18px",cursor:"pointer",transition:"all 0.15s",
                    position:"relative",overflow:"hidden"}}
                  onClick={()=>setEditComm(c)}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor=C.gold+"50";e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow=`0 8px 24px rgba(212,168,67,0.08)`;}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor=has?C.green+"30":C.border;e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow="none";}}>
                  <div style={{position:"absolute",top:0,left:0,right:0,height:2,
                    background:has?`linear-gradient(90deg,${C.green},${C.teal})`:`linear-gradient(90deg,${C.gold}60,transparent)`}}/>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
                    <div>
                      <div style={{fontSize:14,fontWeight:700,color:C.white,fontFamily:C.ffH}}>{c.name}</div>
                      <div style={{fontSize:10,color:C.muted,marginTop:2}}>{c.type} · {c.area}</div>
                    </div>
                    <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:4}}>
                      <Bdg color={has?C.green:C.muted}>{has?"LIVE":"NO DATA"}</Bdg>
                      <span style={{fontSize:9,color:C.muted}}>{c.projects} projects</span>
                    </div>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:12}}>
                    {[
                      {l:"1BR Yield",v:y?y+"%":"—",c:has?C.gold:C.muted},
                      {l:"Occupancy",v:d.occupancy?d.occupancy+"%":"—",c:has?C.green:C.muted},
                      {l:"5yr Growth",v:d.appreciation5yr?"+"+d.appreciation5yr+"%":"—",c:has?C.teal:C.muted},
                    ].map(k=>(
                      <div key={k.l} style={{textAlign:"center",background:C.surfaceC,borderRadius:7,padding:"8px 6px"}}>
                        <div style={{fontSize:8,color:C.muted,textTransform:"uppercase",letterSpacing:0.5,marginBottom:2}}>{k.l}</div>
                        <div style={{fontSize:15,fontWeight:900,color:k.c,fontFamily:C.ffH}}>{k.v}</div>
                      </div>
                    ))}
                  </div>
                  {has&&(
                    <div style={{display:"flex",gap:6,marginBottom:12,flexWrap:"wrap"}}>
                      {d.riskLevel&&<Bdg color={d.riskLevel==="Low"?C.green:d.riskLevel==="Medium"?C.amber:C.red}>{d.riskLevel} Risk</Bdg>}
                      {tx>0&&<Bdg color={C.blue}>{tx.toLocaleString()} DLD Txn</Bdg>}
                      {d.goldenVisa==="Yes"&&<Bdg color={C.purple}>Golden Visa ✓</Bdg>}
                    </div>
                  )}
                  <div style={{fontSize:11,color:C.text2,padding:"7px 12px",background:C.surfaceC,
                    borderRadius:7,textAlign:"center",border:`1px solid ${C.border}`,fontWeight:600}}>
                    {has?"Edit Bloomberg Data →":"Add Investment Data →"}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
