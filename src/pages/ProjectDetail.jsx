/* eslint-disable */
/* ����Ң��a���Ң���a������Ң��a���Ң���a������Ң��a���Ң���a�� DXB ANALYTICS ����Ң���a��Ң��a��� PROJECT DETAIL PAGE (S31 Redesign) ����Ң��a���Ң���a������Ң��a���Ң���a������Ң��a���Ң���a������Ң��a���Ң���a������Ң��a���Ң���a������Ң��a���Ң���a������Ң��a���Ң���a������Ң��a���Ң���a������Ң��a���Ң���a������Ң��a���Ң���a������Ң��a���Ң���a������Ң��a���Ң���a������Ң��a���Ң���a������Ң��a���Ң���a������Ң��a���Ң���a������Ң��a���Ң���a������Ң��a���Ң���a������Ң��a���Ң���a������Ң��a���Ң���a������Ң��a���Ң���a������Ң��a���Ң���a������Ң��a���Ң���a��
   Tabbed layout �����a��a�� Send to Client �����a��a�� Dark theme �����a��a�� Gold buttons
   ����Ң��a���Ң���a������Ң��a���Ң���a������Ң��a���Ң���a������Ң��a���Ң���a������Ң��a���Ң���a������Ң��a���Ң���a������Ң��a���Ң���a������Ң��a���Ң���a������Ң��a���Ң���a������Ң��a���Ң���a������Ң��a���Ң���a������Ң��a���Ң���a������Ң��a���Ң���a������Ң��a���Ң���a������Ң��a���Ң���a������Ң��a���Ң���a������Ң��a���Ң���a������Ң��a���Ң���a������Ң��a���Ң���a������Ң��a���Ң���a������Ң��a���Ң���a������Ң��a���Ң���a������Ң��a���Ң���a������Ң��a���Ң���a������Ң��a���Ң���a������Ң��a���Ң���a������Ң��a���Ң���a������Ң��a���Ң���a������Ң��a���Ң���a������Ң��a���Ң���a������Ң��a���Ң���a������Ң��a���Ң���a������Ң��a���Ң���a������Ң��a���Ң���a������Ң��a���Ң���a������Ң��a���Ң���a������Ң��a���Ң���a������Ң��a���Ң���a������Ң��a���Ң���a������Ң��a���Ң���a������Ң��a���Ң���a������Ң��a���Ң���a������Ң��a���Ң���a������Ң��a���Ң���a������Ң��a���Ң���a������Ң��a���Ң���a������Ң��a���Ң���a������Ң��a���Ң���a������Ң��a���Ң���a������Ң��a���Ң���a������Ң��a���Ң���a������Ң��a���Ң���a������Ң��a���Ң���a������Ң��a���Ң���a������Ң��a���Ң���a������Ң��a���Ң���a������Ң��a���Ң���a������Ң��a���Ң���a������Ң��a���Ң���a������Ң��a���Ң���a������Ң��a���Ң���a������Ң��a���Ң���a������Ң��a���Ң���a������Ң��a���Ң���a������Ң��a���Ң���a������Ң��a���Ң���a������Ң��a���Ң���a������Ң��a���Ң���a������Ң��a���Ң���a������Ң��a���Ң���a������Ң��a���Ң���a������Ң��a���Ң���a������Ң��a���Ң���a������Ң��a���Ң���a������Ң��a���Ң���a�� */
import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { T, emaarProjects, communityIntel, communityROI } from "../data";
import RoiCalculator from "./RoiCalculator";

/* ����Ң��a���Ң���a������Ң��a���Ң���a������Ң��a���Ң���a�� HELPERS ����Ң��a���Ң���a������Ң��a���Ң���a������Ң��a���Ң���a�� */
const getLinkDomain = (url) => {
  if (!url) return "Official Listing";
  if (url.includes("propertyfinder.ae")) return "PropertyFinder";
  if (url.includes("emaar.com")) return "Emaar.com";
  if (url.includes("bayut.com")) return "Bayut";
  return "Official Listing";
};
const fmtM   = (v) => v ? `AED ${(v/1_000_000).toFixed(2)}M` : "����Ң���a��Ң��a���";
const fmtNum = (v) => v ? `AED ${Number(v).toLocaleString()}` : "����Ң���a��Ң��a���";

const getHandoverCountdown = (handover) => {
  if (!handover) return null;
  const match = handover.match(/Q([1-4])\s+(\d{4})/);
  if (!match) return null;
  const q = parseInt(match[1]); const year = parseInt(match[2]);
  const qEndMonth = [2,5,8,11]; const qEndDay = [31,30,30,31];
  const target = new Date(year, qEndMonth[q-1], qEndDay[q-1]);
  const diffMs = target - new Date();
  if (diffMs <= 0) return { label:"Delivered", color:T.green, passed:true };
  const diffDays = Math.ceil(diffMs/(1000*60*60*24));
  const diffMonths = Math.round(diffMs/(1000*60*60*24*30.44));
  let label, color;
  if (diffDays<=90)        { label=diffDays+"d left";                       color="#EF4444"; }
  else if (diffMonths<=6)  { label=diffMonths+"mo left";                    color="#F59E0B"; }
  else if (diffMonths<=18) { label=diffMonths+"mo left";                    color:T.gold; }
  else                     { label=(diffMonths/12).toFixed(1)+"yr left";    color:T.textMuted; }
  return { label, color, urgent:diffDays<=90 };
};

const constructionColor = (pct) => pct>=70 ? T.green : pct>=30 ? T.gold : T.blue;

const getUnitEntries = (units) => {
  if (!units) return [];
  if (Array.isArray(units)) return units.filter(u=>u&&(u.total||0)>0).map(u=>[u.type||"Unit",{total:u.total||0,sold:(u.total||0)-(u.available||0)}]);
  return Object.entries(units).filter(([,d])=>d&&d.total>0);
};

/* ����Ң��a���Ң���a������Ң��a���Ң���a������Ң��a���Ң���a�� CSS ����Ң��a���Ң���a������Ң��a���Ң���a������Ң��a���Ң���a�� */
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=Fraunces:opsz,wght@9..144,700;9..144,900&display=swap');
  *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
  body { background:#04090F; overflow-x:hidden; }
  @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
  @keyframes spin   { to{transform:rotate(360deg)} }
  @keyframes modalIn{ from{opacity:0;transform:scale(0.96)} to{opacity:1;transform:scale(1)} }
  .pd-card { background:#0A1628; border:1px solid #1E293B; border-radius:14px; padding:22px; margin-bottom:16px; animation:fadeUp 0.3s ease-out both; }
  .pd-tab { padding:9px 20px !important; background:transparent !important; border:none !important; border-bottom:2px solid transparent !important; font-size:13px !important; font-weight:600 !important; cursor:pointer !important; color:#64748B !important; font-family:'Outfit',sans-serif !important; transition:all 0.15s !important; margin-bottom:-1px !important; white-space:nowrap !important; border-radius:0 !important; box-shadow:none !important; }
  .pd-tab:hover { color:#D4A843 !important; }
  .pd-tab.active { color:#D4A843 !important; border-bottom:2px solid #D4A843 !important; background:transparent !important; }
  .pd-row { display:flex; justify-content:space-between; align-items:center; padding:9px 0; border-bottom:1px solid #0F1E35; font-size:13px; }
  .pd-row:last-child { border-bottom:none; }
  .pd-row-label { color:#64748B; }
  .pd-btn-primary { display:inline-flex !important; align-items:center !important; gap:7px !important; padding:10px 20px !important; background:#D4A843 !important; color:#04090F !important; border:none !important; border-radius:9px !important; font-size:13px !important; font-weight:700 !important; cursor:pointer !important; white-space:nowrap !important; font-family:'Outfit',sans-serif !important; text-decoration:none !important; box-shadow:none !important; opacity:1 !important; }
  .pd-btn-primary:hover { opacity:0.88 !important; background:#D4A843 !important; color:#04090F !important; }
  .pd-btn-outline { display:inline-flex !important; align-items:center !important; gap:7px !important; padding:10px 18px !important; background:transparent !important; color:#D4A843 !important; border:1.5px solid #D4A843 !important; border-radius:9px !important; font-size:13px !important; font-weight:600 !important; cursor:pointer !important; white-space:nowrap !important; font-family:'Outfit',sans-serif !important; text-decoration:none !important; box-shadow:none !important; }
  .pd-btn-outline:hover { background:rgba(212,168,67,0.1) !important; color:#D4A843 !important; }
  .pd-btn-ghost { display:inline-flex !important; align-items:center !important; gap:7px !important; padding:10px 18px !important; background:rgba(212,168,67,0.08) !important; color:#D4A843 !important; border:1px solid rgba(212,168,67,0.3) !important; border-radius:9px !important; font-size:13px !important; font-weight:600 !important; cursor:pointer !important; white-space:nowrap !important; font-family:'Outfit',sans-serif !important; text-decoration:none !important; box-shadow:none !important; }
  .amenity-card { background:#0E1D35; border-radius:10px; padding:14px; border-left:3px solid; }
  .send-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.82); z-index:2000; display:flex; align-items:center; justify-content:center; padding:20px; backdrop-filter:blur(6px); }
  .send-modal { background:#0A1628; border:1.5px solid #D4A843; border-radius:18px; padding:32px; width:100%; max-width:520px; animation:modalIn 0.25s ease-out both; }
  .pd-unit-row { display:grid; grid-template-columns:1fr 1.2fr 1.4fr 1.1fr; gap:0; align-items:center; padding:12px 16px; border-bottom:1px solid #0F1E35; font-size:13px; }
  .pd-unit-row:last-child { border-bottom:none; }
  @media(max-width:768px){
    .pd-hero-grid{grid-template-columns:1fr!important;}
    .pd-details-grid{grid-template-columns:1fr!important;}
    .pd-action-bar{flex-wrap:wrap;}
    .pd-tabs-wrap{overflow-x:auto;}
  }
`;

/* ����Ң��a���Ң���a������Ң��a���Ң���a������Ң��a���Ң���a�� SECTION TITLE ����Ң��a���Ң���a������Ң��a���Ң���a������Ң��a���Ң���a�� */
const SecTitle = ({ children }) => (
  <div style={{ fontSize:10, fontWeight:700, color:T.gold, letterSpacing:1.5, textTransform:"uppercase", marginBottom:16 }}>
    {children}
  </div>
);

/* ����Ң��a���Ң���a������Ң��a���Ң���a������Ң��a���Ң���a�� PRO GATE ����Ң��a���Ң���a������Ң��a���Ң���a������Ң��a���Ң���a�� */
const ProGate = ({ isPro, onUpgrade, children }) => {
  if (isPro) return children;
  return (
    <div style={{ position:"relative" }}>
      <div style={{ filter:"blur(4px)", pointerEvents:"none", userSelect:"none", opacity:0.35 }}>{children}</div>
      <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", background:"rgba(4,9,15,0.78)", borderRadius:14, zIndex:5 }}>
        <div style={{ background:T.surface, border:`1.5px solid ${T.gold}`, borderRadius:16, padding:"24px 28px", textAlign:"center", maxWidth:320 }}>
          <div style={{ fontFamily:"'Fraunces',serif", fontSize:16, fontWeight:800, color:T.white, marginBottom:6 }}>Pro Feature</div>
          <div style={{ fontSize:12, color:T.textMuted, marginBottom:16, lineHeight:1.6 }}>Unlock location intelligence, yield data, and ROI analytics.</div>
          <button onClick={onUpgrade} style={{ width:"100%", padding:"10px 0", background:"#D4A843", color:"#04090F", border:"2px solid #D4A843", borderRadius:9, fontSize:13, fontWeight:800, cursor:"pointer", fontFamily:"'Outfit',sans-serif", outline:"none", boxShadow:"none" }}>
            Unlock Pro ����Ң���a��Ң��a��� AED 99/mo ����Ң��a���Ң��a���~�
          </button>
        </div>
      </div>
    </div>
  );
};

/* ����Ң��a���Ң���a������Ң��a���Ң���a������Ң��a���Ң���a�� SEND TO CLIENT MODAL ����Ң��a���Ң���a������Ң��a���Ң���a������Ң��a���Ң���a�� */
const SendModal = ({ project, roi, onClose }) => {
  const [copied, setCopied] = useState(false);
  const gross   = roi?.grossYield?.apt1 || roi?.grossYield?.th || roi?.grossYield?.villa || 0;
  const appr5   = roi?.appreciation5yr || 0;
  const projUrl = typeof window !== "undefined" ? window.location.href : "";
  const subject = `${project?.name} ����Ң���a��Ң��a��� Investment Opportunity | DXB Analytics`;
  const body = `Hi,\n\nI wanted to share an exciting investment opportunity with you:\n\n�����&����a��Ң���~��������a����a�� Project: ${project?.name}\n�����&��Ң��a��&�S��a�� Community: ${project?.community} �����a��a�� ${project?.district}\n�����&����a����a�� Type: ${project?.type}${project?.beds ? " | "+project.beds+" BR" : ""}\n�����&��Ң��a���~���a�� Starting From: ${fmtM(project?.price)}\n�����&��Ң��a��&�SҢ��a��� Handover: ${project?.handover || "����Ң���a��Ң��a���"}\n�����&��Ң��a���~���a�� Payment Plan: ${project?.payment || "����Ң���a��Ң��a���"}${gross ? "\n�����&��Ң��a��&�S�9 Est. Gross Yield: "+gross+"%" : ""}${appr5 ? "\n�����&��Ң��a��&�S�&�� 5-Year Appreciation: +"+appr5+"%" : ""}${roi?.goldenVisa ? "\n�����&����Ң��a��� Golden Visa Eligible" : ""}\n\nView full details & ROI analysis:\n${projUrl}\n\nPowered by DXB Analytics ����Ң���a��Ң��a��� Dubai's Real Estate Intelligence Platform.\n\nBest regards`;
  const mailtoLink = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  const handleCopy = () => { navigator.clipboard.writeText(body).then(() => { setCopied(true); setTimeout(()=>setCopied(false),2000); }); };
  return (
    <div className="send-overlay" onClick={onClose}>
      <div className="send-modal" onClick={e=>e.stopPropagation()}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}>
          <div>
            <div style={{ fontFamily:"'Fraunces',serif", fontSize:20, fontWeight:800, color:T.white, marginBottom:3 }}>Send to Client</div>
            <div style={{ fontSize:12, color:T.textMuted }}>{project?.name} �����a��a�� {project?.community}</div>
          </div>
          <button onClick={onClose} style={{ width:32, height:32, borderRadius:8, border:`1px solid #1E293B`, background:"#111827", color:T.textMuted, cursor:"pointer", fontSize:18, display:"flex", alignItems:"center", justifyContent:"center" }}>��� �"Ң��a�����</button>
        </div>
        <div style={{ background:T.bg, borderRadius:10, border:`1px solid #1E293B`, padding:16, marginBottom:20, maxHeight:220, overflowY:"auto" }}>
          <div style={{ fontSize:10, fontWeight:700, color:T.gold, letterSpacing:1, textTransform:"uppercase", marginBottom:8 }}>Email Preview</div>
          <div style={{ fontSize:11, color:T.textMuted, marginBottom:6 }}><span style={{ color:T.textSecondary, fontWeight:600 }}>Subject: </span>{subject}</div>
          <pre style={{ fontSize:11, color:T.textSecondary, lineHeight:1.7, whiteSpace:"pre-wrap", fontFamily:"'Outfit',sans-serif" }}>{body}</pre>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          <a href={mailtoLink} style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, padding:"13px", borderRadius:10, background:"#D4A843", color:"#04090F", border:"2px solid #D4A843", fontWeight:800, fontSize:14, textDecoration:"none", fontFamily:"'Outfit',sans-serif", lineHeight:1 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
            Open in Email Client
          </a>
          <button onClick={handleCopy} style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, padding:"11px", borderRadius:10, background:"transparent", border:"2px solid #D4A843", color:"#D4A843", fontWeight:600, fontSize:13, cursor:"pointer", fontFamily:"'Outfit',sans-serif", outline:"none", boxShadow:"none", lineHeight:1 }}>
            {copied ? "�����&����Ң��a��&�S Copied!" : "Copy Email Text"}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ����Ң��a���Ң���a������Ң��a���Ң���a������Ң��a���Ң���a�� OVERVIEW TAB ����Ң��a���Ң���a������Ң��a���Ң���a������Ң��a���Ң���a�� */
const OverviewTab = ({ project, ci, roi, gross, net, appr5 }) => (
  <div style={{ animation:"fadeUp 0.3s ease-out both" }}>
    <div className="pd-details-grid" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:16 }}>
      <div className="pd-card" style={{ marginBottom:0 }}>
        <SecTitle>Project Details</SecTitle>
        {[
          { label:"From Price",   value:project.price ? fmtM(project.price) : "TBD", color:T.gold },
          { label:"Price / sqft", value:project.ppsf ? `AED ${project.ppsf.toLocaleString()}` : "����Ң���a��Ң��a���" },
          { label:"Size Range",   value:project.sizeFrom ? `${project.sizeFrom.toLocaleString()} ����Ң���a��Ң��a��&�S ${(project.sizeTo||"").toLocaleString()} sqft` : "����Ң���a��Ң��a���" },
          { label:"Bedrooms",     value:project.beds ? project.beds+" BR" : "����Ң���a��Ң��a���" },
          { label:"Type",         value:project.type || "����Ң���a��Ң��a���" },
          { label:"Payment Plan", value:project.payment || "����Ң���a��Ң��a���", color:T.teal },
          { label:"Tier",         value:project.tier || "����Ң���a��Ң��a���" },
          { label:"Developer",    value:project.developerActual || project.developer || "Emaar Properties" },
        ].map((r,i) => (
          <div className="pd-row" key={i}>
            <span className="pd-row-label">{r.label}</span>
            <span style={{ fontWeight:600, color:r.color||T.white }}>{r.value}</span>
          </div>
        ))}
      </div>
      <div className="pd-card" style={{ marginBottom:0 }}>
        <SecTitle>Investment Profile</SecTitle>
        {[
          { label:"Est. Gross Yield",   value:gross ? `${gross}%` : "����Ң���a��Ң��a���",                                  color:T.green },
          { label:"Net Yield",          value:net   ? `${net}%` : "����Ң���a��Ң��a���",                                    color:T.teal },
          { label:"5-yr Appreciation",  value:appr5 ? `+${appr5}%` : "����Ң���a��Ң��a���",                                 color:T.green },
          { label:"Annual YoY",         value:roi?.appreciationYoY ? `+${roi.appreciationYoY}%` : "����Ң���a��Ң��a���",    color:T.green },
          { label:"Golden Visa",        value:price >= 2000000 ? "Eligible �����&����Ң��a��&�S" : "Not Eligible (< AED 2M)",  color:price >= 2000000 ? T.green : T.red },
          { label:"Risk Level",         value:roi?.riskLevel || "����Ң���a��Ң��a���",                                       color:roi?.riskLevel==="Low" ? T.green : roi?.riskLevel==="High" ? T.red : T.gold },
          { label:"Occupancy",          value:roi?.occupancy ? roi.occupancy+"%" : "����Ң���a��Ң��a���" },
          { label:"Est. Annual Rent",   value:roi?.estRent?.apt1 ? fmtNum(roi.estRent.apt1) : "����Ң���a��Ң��a���",        color:T.teal },
        ].map((r,i) => (
          <div className="pd-row" key={i}>
            <span className="pd-row-label">{r.label}</span>
            <span style={{ fontWeight:600, color:r.color||T.white }}>{r.value}</span>
          </div>
        ))}
      </div>
    </div>
    {ci && (
      <div className="pd-card">
        <SecTitle>Famous For</SecTitle>
        <p style={{ fontSize:13, color:T.textSecondary, lineHeight:1.8, marginBottom:ci.masterDev?10:0 }}>{ci.famousFor}</p>
        {ci.masterDev && <div style={{ fontSize:12, color:T.textMuted }}><span style={{ color:T.teal }}>Developer:</span> {ci.masterDev}</div>}
        {ci.lifestyle  && <div style={{ fontSize:12, color:T.textMuted, marginTop:4 }}><span style={{ color:T.teal }}>Lifestyle:</span> {ci.lifestyle}</div>}
      </div>
    )}
    {(project.pdfBrochure||project.pdfFloorPlan||project.pdfPaymentPlan||project.pdfFactSheet) && (
      <div className="pd-card">
        <SecTitle>Documents</SecTitle>
        <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
          {project.pdfBrochure    && <a href={project.pdfBrochure}    target="_blank" rel="noreferrer" style={{ display:"inline-flex", alignItems:"center", padding:"8px 14px", borderRadius:8, background:"rgba(212,168,67,0.08)", border:"1px solid rgba(212,168,67,0.35)", color:"#D4A843", fontSize:12, fontWeight:600, textDecoration:"none" }}>Brochure</a>}
          {project.pdfFloorPlan   && <a href={project.pdfFloorPlan}   target="_blank" rel="noreferrer" style={{ display:"inline-flex", alignItems:"center", padding:"8px 14px", borderRadius:8, background:"rgba(212,168,67,0.08)", border:"1px solid rgba(212,168,67,0.35)", color:"#D4A843", fontSize:12, fontWeight:600, textDecoration:"none" }}>Floor Plan</a>}
          {project.pdfPaymentPlan && <a href={project.pdfPaymentPlan} target="_blank" rel="noreferrer" style={{ display:"inline-flex", alignItems:"center", padding:"8px 14px", borderRadius:8, background:"rgba(212,168,67,0.08)", border:"1px solid rgba(212,168,67,0.35)", color:"#D4A843", fontSize:12, fontWeight:600, textDecoration:"none" }}>Payment Plan</a>}
          {project.pdfFactSheet   && <a href={project.pdfFactSheet}   target="_blank" rel="noreferrer" style={{ display:"inline-flex", alignItems:"center", padding:"8px 14px", borderRadius:8, background:"rgba(212,168,67,0.08)", border:"1px solid rgba(212,168,67,0.35)", color:"#D4A843", fontSize:12, fontWeight:600, textDecoration:"none" }}>Fact Sheet</a>}
        </div>
      </div>
    )}
  </div>
);

/* ����Ң��a���Ң���a������Ң��a���Ң���a������Ң��a���Ң���a�� PRICING TAB ����Ң��a���Ң���a������Ң��a���Ң���a������Ң��a���Ң���a�� */
const PricingTab = ({ project }) => {
  const unitEntries = getUnitEntries(project.units);
  const breakdown   = project.unitBreakdown || [];
  return (
    <div style={{ animation:"fadeUp 0.3s ease-out both" }}>
      <div className="pd-card">
        <SecTitle>Construction & Payment</SecTitle>
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16 }}>
          <div style={{ flex:1, height:8, borderRadius:4, background:"#111827", overflow:"hidden" }}>
            <div style={{ height:"100%", width:`${project.construction||0}%`, borderRadius:4, background:constructionColor(project.construction||0), transition:"width 0.8s" }} />
          </div>
          <span style={{ fontFamily:"'Fraunces',serif", fontSize:22, fontWeight:900, color:constructionColor(project.construction||0) }}>{project.construction||0}%</span>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10 }}>
          {[
            { label:"HANDOVER",     value:project.handover||"����Ң���a��Ң��a���" },
            { label:"PAYMENT PLAN", value:project.payment||"����Ң���a��Ң��a���",  color:T.teal },
            { label:"CONSTRUCTION", value:(project.construction||0)+"%", color:constructionColor(project.construction||0) },
          ].map((s,i) => (
            <div key={i} style={{ background:"#111827", borderRadius:10, padding:"14px 12px", textAlign:"center" }}>
              <div style={{ fontSize:9, fontWeight:700, color:T.textMuted, textTransform:"uppercase", letterSpacing:1, marginBottom:6 }}>{s.label}</div>
              <div style={{ fontFamily:"'Fraunces',serif", fontSize:18, fontWeight:900, color:s.color||T.white }}>{s.value}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="pd-card">
        <SecTitle>Pricing by Unit Type</SecTitle>
        <div style={{ borderRadius:10, overflow:"hidden", border:`1px solid #1E293B` }}>
          <div className="pd-unit-row" style={{ background:"#111827", fontWeight:700, fontSize:10, color:T.gold, textTransform:"uppercase", letterSpacing:1 }}>
            <span>Unit Type</span><span>Size (sqft)</span><span>Starting From</span><span>Price / sqft</span>
          </div>
          {(breakdown.length > 0 ? breakdown : unitEntries.length > 0 ? unitEntries.map(([t])=>({type:t})) : [{type:"1 BR"},{type:"2 BR"},{type:"3 BR"}]).map((u,i) => {
            const isBreakdown = breakdown.length > 0;
            return (
              <div key={i} className="pd-unit-row" style={{ background:i%2===0?"transparent":"rgba(14,29,53,0.4)" }}>
                <span style={{ fontWeight:700, color:T.white }}>{isBreakdown ? u.type : u.type}</span>
                <span style={{ color:T.textSecondary }}>{isBreakdown && u.sizeFrom ? `${u.sizeFrom.toLocaleString()} ����Ң���a��Ң��a��&�S ${u.sizeTo?.toLocaleString()}` : "����Ң���a��Ң��a���"}</span>
                <span style={{ fontWeight:800, color:T.gold, fontFamily:"'Fraunces',serif" }}>{isBreakdown && u.price ? fmtM(u.price) : project.price ? fmtM(project.price) : "����Ң���a��Ң��a���"}</span>
                <span style={{ color:T.textMuted }}>{project.ppsf ? `AED ${project.ppsf.toLocaleString()}` : "����Ң���a��Ң��a���"}</span>
              </div>
            );
          })}
        </div>
      </div>
      {Array.isArray(project.priceHistory) && project.priceHistory.length >= 2 && (
        <div className="pd-card">
          <SecTitle>Price History</SecTitle>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={project.priceHistory}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="date" tick={{ fill:T.textMuted, fontSize:10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill:T.textMuted, fontSize:10 }} axisLine={false} tickLine={false} tickFormatter={v=>`${(v/1_000_000).toFixed(1)}M`} />
              <Tooltip formatter={v=>[`AED ${Number(v).toLocaleString()}`,"Price"]} contentStyle={{ background:T.surface, border:`1px solid ${T.gold}`, borderRadius:8, fontSize:11 }} />
              <Area type="monotone" dataKey="price" stroke={T.gold} fill="rgba(212,168,67,0.1)" strokeWidth={2} dot={{ r:3, fill:T.gold }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

/* ����Ң��a���Ң���a������Ң��a���Ң���a������Ң��a���Ң���a�� LOCATION TAB ����Ң��a���Ң���a������Ң��a���Ң���a������Ң��a���Ң���a�� */
const LocationTab = ({ project, ci, isPro, onUpgrade }) => (
  <div style={{ animation:"fadeUp 0.3s ease-out both" }}>
    <ProGate isPro={isPro} onUpgrade={onUpgrade}>
      {ci ? (
        <>
          <div className="pd-card">
            <SecTitle>Key Amenities Nearby</SecTitle>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              {ci.keyAmenities?.map((a,i) => (
                <div key={i} className="amenity-card" style={{ borderLeftColor:[T.blue,"#EF4444",T.gold,T.teal][i%4] }}>
                  <div style={{ fontSize:13, fontWeight:700, color:T.white, marginBottom:4 }}>{a.label}</div>
                  <div style={{ fontSize:12, color:T.textSecondary, lineHeight:1.5 }}>{a.items}</div>
                </div>
              ))}
            </div>
          </div>
          {ci.distances?.length > 0 && (
            <div className="pd-card">
              <SecTitle>Distance to Key Dubai Locations</SecTitle>
              <div style={{ borderRadius:10, overflow:"hidden", border:`1px solid #1E293B` }}>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 80px 90px", padding:"10px 16px", background:"#111827", fontSize:10, fontWeight:700, color:T.gold, textTransform:"uppercase", letterSpacing:1 }}>
                  <span>Destination</span><span style={{ textAlign:"center" }}>Distance</span><span style={{ textAlign:"center" }}>Drive Time</span>
                </div>
                {ci.distances.map((d,i) => (
                  <div key={i} style={{ display:"grid", gridTemplateColumns:"1fr 80px 90px", padding:"11px 16px", borderTop:`1px solid #0F1E35`, background:i%2===0?"transparent":"rgba(14,29,53,0.3)", fontSize:13, alignItems:"center" }}>
                    <span style={{ color:T.textPrimary, fontWeight:500 }}>{d.dest}</span>
                    <span style={{ textAlign:"center", color:T.textMuted }}>{d.km} km</span>
                    <span style={{ textAlign:"center" }}>
                      <span style={{ padding:"3px 10px", borderRadius:5, fontSize:11, fontWeight:700,
                        background:d.min<=10?"rgba(16,185,129,0.12)":d.min<=20?"rgba(212,168,67,0.12)":"rgba(59,130,246,0.12)",
                        color:d.min<=10?T.green:d.min<=20?T.gold:T.blue }}>
                        {d.min} min
                      </span>
                    </span>
                  </div>
                ))}
              </div>
              {ci.roads && <p style={{ fontSize:11, color:T.textMuted, marginTop:10 }}>Road Access: {ci.roads}</p>}
            </div>
          )}
        </>
      ) : (
        <div className="pd-card" style={{ textAlign:"center", padding:40 }}>
          <div style={{ fontSize:14, color:T.textMuted }}>Location data not available for this community yet.</div>
        </div>
      )}
    </ProGate>
  </div>
);

/* ����Ң��a���Ң���a������Ң��a���Ң���a������Ң��a���Ң���a�� ROI TAB ����Ң��a���Ң���a������Ң��a���Ң���a������Ң��a���Ң���a�� */
const ROITab = ({ project, roi, gross, net, appr5, price, isPro, onUpgrade }) => {
  const annualRent = roi?.estRent?.apt1 || roi?.estRent?.th || roi?.estRent?.villa || 0;
  const projValue  = price > 0 ? price*(1+appr5/100) : 0;
  return (
    <div style={{ animation:"fadeUp 0.3s ease-out both" }}>
      <ProGate isPro={isPro} onUpgrade={onUpgrade}>
        {roi ? (
          <>
            <div className="pd-card">
              <SecTitle>ROI Estimate</SecTitle>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:12 }}>
                {[
                  { label:"Gross Yield",       value:`${gross}%`,           color:T.green },
                  { label:"Net Yield",          value:`${net}%`,             color:T.teal },
                  { label:"5-yr Appreciation",  value:`+${appr5}%`,          color:T.gold },
                  { label:"Annual YoY",         value:`+${roi.appreciationYoY||0}%`, color:T.blue },
                ].map((s,i) => (
                  <div key={i} style={{ background:"#111827", borderRadius:10, padding:"14px 12px", textAlign:"center" }}>
                    <div style={{ fontSize:9, color:T.textMuted, textTransform:"uppercase", letterSpacing:0.5, marginBottom:6, fontWeight:700 }}>{s.label}</div>
                    <div style={{ fontFamily:"'Fraunces',serif", fontSize:22, fontWeight:900, color:s.color }}>{s.value}</div>
                  </div>
                ))}
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10 }}>
                {price>0 && <div style={{ background:"#111827", borderRadius:10, padding:"14px 12px", textAlign:"center" }}>
                  <div style={{ fontSize:9, color:T.textMuted, textTransform:"uppercase", letterSpacing:0.5, marginBottom:6, fontWeight:700 }}>Est. 5-yr Value</div>
                  <div style={{ fontFamily:"'Fraunces',serif", fontSize:17, fontWeight:900, color:T.gold }}>{`AED ${(projValue/1e6).toFixed(2)}M`}</div>
                  <div style={{ fontSize:10, color:T.green, marginTop:4, fontWeight:600 }}>+AED {((projValue-price)/1e6).toFixed(2)}M gain</div>
                </div>}
                {annualRent>0 && <div style={{ background:"#111827", borderRadius:10, padding:"14px 12px", textAlign:"center" }}>
                  <div style={{ fontSize:9, color:T.textMuted, textTransform:"uppercase", letterSpacing:0.5, marginBottom:6, fontWeight:700 }}>Est. Annual Rent</div>
                  <div style={{ fontFamily:"'Fraunces',serif", fontSize:17, fontWeight:900, color:T.teal }}>{`AED ${annualRent.toLocaleString()}`}</div>
                  <div style={{ fontSize:10, color:T.textMuted, marginTop:4 }}>1BR estimate</div>
                </div>}
                <div style={{ background:"#111827", borderRadius:10, padding:"14px 12px", textAlign:"center" }}>
                  <div style={{ fontSize:9, color:T.textMuted, textTransform:"uppercase", letterSpacing:0.5, marginBottom:6, fontWeight:700 }}>Golden Visa</div>
                  <div style={{ fontFamily:"'Fraunces',serif", fontSize:15, fontWeight:900, color:price>=2000000?T.green:"#EF4444" }}>{price>=2000000?"�����&����Ң��a��&�S Eligible":"Not Eligible"}</div>
                  <div style={{ fontSize:10, color:T.textMuted, marginTop:4 }}>{price>=2000000?"Min. AED 2M threshold met":"Below AED 2M threshold"}</div>
                </div>
              </div>
              {(roi.riskLevel||roi.occupancy) && (
                <div style={{ marginTop:12, fontSize:12, color:T.textMuted }}>
                  {roi.riskLevel && <>Risk: <span style={{ color:roi.riskLevel==="Low"?T.green:roi.riskLevel==="High"?T.red:T.gold, fontWeight:600 }}>{roi.riskLevel}</span></>}
                  {roi.occupancy && <> �����a��a�� Occupancy: <span style={{ color:T.white, fontWeight:600 }}>{roi.occupancy}%</span></>}
                </div>
              )}
            </div>
            <div className="pd-card">
              <SecTitle>Interactive ROI Calculator</SecTitle>
              <RoiCalculator project={project} roi={roi} T={T} />
            </div>
          </>
        ) : (
          <div className="pd-card" style={{ textAlign:"center", padding:40 }}>
            <div style={{ fontSize:14, color:T.textMuted }}>ROI data not available for this community yet.</div>
          </div>
        )}
      </ProGate>
    </div>
  );
};

/* ����Ң��a�����a������Ң��a�����a������Ң��a�����a������Ң��a�����a������Ң��a�����a������Ң��a�����a������Ң��a�����a������Ң��a�����a������Ң��a�����a������Ң��a�����a������Ң��a�����a������Ң��a�����a������Ң��a�����a������Ң��a�����a������Ң��a�����a������Ң��a�����a������Ң��a�����a������Ң��a�����a������Ң��a�����a������Ң��a�����a������Ң��a�����a������Ң��a�����a������Ң��a�����a������Ң��a�����a������Ң��a�����a������Ң��a�����a������Ң��a�����a������Ң��a�����a������Ң��a�����a������Ң��a�����a������Ң��a�����a������Ң��a�����a������Ң��a�����a������Ң��a�����a������Ң��a�����a������Ң��a�����a������Ң��a�����a������Ң��a�����a������Ң��a�����a������Ң��a�����a������Ң��a�����a������Ң��a�����a������Ң��a�����a������Ң��a�����a������Ң��a�����a������Ң��a�����a������Ң��a�����a������Ң��a�����a������Ң��a�����a������Ң��a�����a������Ң��a�����a������Ң��a�����a������Ң��a�����a������Ң��a�����a������Ң��a�����a��
   MAIN COMPONENT
����Ң��a�����a������Ң��a�����a������Ң��a�����a������Ң��a�����a������Ң��a�����a������Ң��a�����a������Ң��a�����a������Ң��a�����a������Ң��a�����a������Ң��a�����a������Ң��a�����a������Ң��a�����a������Ң��a�����a������Ң��a�����a������Ң��a�����a������Ң��a�����a������Ң��a�����a������Ң��a�����a������Ң��a�����a������Ң��a�����a������Ң��a�����a������Ң��a�����a������Ң��a�����a������Ң��a�����a������Ң��a�����a������Ң��a�����a������Ң��a�����a������Ң��a�����a������Ң��a�����a������Ң��a�����a������Ң��a�����a������Ң��a�����a������Ң��a�����a������Ң��a�����a������Ң��a�����a������Ң��a�����a������Ң��a�����a������Ң��a�����a������Ң��a�����a������Ң��a�����a������Ң��a�����a������Ң��a�����a������Ң��a�����a������Ң��a�����a������Ң��a�����a������Ң��a�����a������Ң��a�����a������Ң��a�����a������Ң��a�����a������Ң��a�����a������Ң��a�����a������Ң��a�����a������Ң��a�����a������Ң��a�����a������Ң��a�����a�� */
export default function ProjectDetail() {
  const { id }       = useParams();
  const navigate     = useNavigate();
  const [project,       setProject]       = useState(null);
  const [userTier,      setUserTier]      = useState("free");
  const [notFound,      setNotFound]      = useState(false);
  const [activeTab,     setActiveTab]     = useState("overview");
  const [copiedLink,    setCopiedLink]    = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);

  const isPro = ["pro","pro_trial","enterprise","admin"].includes(userTier);

  useEffect(() => {
    setNotFound(false); setProject(null); setActiveTab("overview");
    const base = emaarProjects.find(p => p.id===Number(id)||p.id===id||String(p.id)===String(id));
    if (base) {
      const unsub = onSnapshot(doc(db,"projectData",String(base.id)), snap => {
        setProject({ ...base, ...(snap.exists()?snap.data():{}) });
      }, () => setProject(base));
      return () => unsub();
    }
    getDoc(doc(db,"projects",String(id))).then(snap => {
      if (snap.exists()) { setProject({...snap.data(),id:snap.id}); return; }
      return getDoc(doc(db,"projectData",String(id))).then(snap2 => {
        if (snap2.exists()) setProject({...snap2.data(),id:snap2.id}); else setNotFound(true);
      });
    }).catch(()=>setNotFound(true));
  }, [id]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async u => {
      if (!u) { setUserTier("free"); return; }
      try {
        const snap = await getDoc(doc(db,"users",u.uid));
        if (snap.exists()) setUserTier(snap.data().tier||snap.data().role||"free");
      } catch {}
    });
    return () => unsub();
  }, []);

  useEffect(() => { if (project) document.title = `${project.name} ����Ң���a��Ң��a��� DXB Analytics`; }, [project]);

  const ci    = project ? (communityIntel[project.community]||null) : null;
  const roi   = project ? (communityROI[project.community]||null)   : null;
  const price = project?.price || 0;
  const gross = roi?.grossYield?.apt1||roi?.grossYield?.th||roi?.grossYield?.villa||0;
  const net   = roi?.netYield?.apt1  ||roi?.netYield?.th  ||roi?.netYield?.villa  ||0;
  const appr5 = roi?.appreciation5yr ||0;
  const cd    = project ? getHandoverCountdown(project.handover) : null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href).then(() => { setCopiedLink(true); setTimeout(()=>setCopiedLink(false),2000); });
  };

  if (notFound) return (
    <div style={{ minHeight:"100vh", background:T.bg, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", fontFamily:"'Outfit',sans-serif" }}>
      <style>{css}</style>
      <h1 style={{ fontFamily:"'Fraunces',serif", fontSize:28, color:T.white, marginBottom:8 }}>Project Not Found</h1>
      <p style={{ color:T.textMuted, marginBottom:24 }}>ID #{id} doesn't match any project.</p>
      <Link to="/" style={{ display:"inline-flex", alignItems:"center", padding:"12px 28px", background:"#D4A843", color:"#04090F", border:"2px solid #D4A843", borderRadius:10, fontWeight:700, textDecoration:"none", fontSize:14 }}>����Ң��a�����a�� Back to Dashboard</Link>
    </div>
  );
  if (!project) return (
    <div style={{ minHeight:"100vh", background:T.bg, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <style>{css}</style>
      <div style={{ width:28, height:28, border:"2px solid rgba(212,168,67,0.3)", borderTopColor:T.gold, borderRadius:"50%", animation:"spin 0.8s linear infinite" }} />
    </div>
  );

  const TABS = [
    { id:"overview", label:"Overview" },
    { id:"pricing",  label:"Pricing" },
    { id:"location", label:"Location" },
    { id:"roi",      label:"ROI Calculator" },
  ];

  return (
    <div style={{ minHeight:"100vh", background:T.bg, fontFamily:"'Outfit',sans-serif", color:T.textPrimary }}>
      <style>{css}</style>

      {showSendModal && <SendModal project={project} roi={roi} onClose={()=>setShowSendModal(false)} />}

      {/* NAVBAR */}
      <nav style={{ position:"sticky", top:0, zIndex:100, background:"rgba(4,9,15,0.97)", backdropFilter:"blur(20px)", borderBottom:`1px solid #1E293B`, padding:"0 32px", height:52, display:"flex", alignItems:"center", gap:12, fontSize:12 }}>
        <Link to="/" style={{ display:"inline-flex", alignItems:"center", gap:5, color:T.gold, fontWeight:600, textDecoration:"none" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
          Back to Projects
        </Link>
        <span style={{ color:"#1E293B" }}>�����a��a��</span>
        <span style={{ color:T.textMuted }}>{project.community}</span>
        <span style={{ color:"#1E293B" }}>�����a��a��</span>
        <span style={{ color:T.textMuted }}>{project.type}</span>
      </nav>

      {/* HERO IMAGE */}
      {project.imageUrl && (
        <div style={{ width:"100%", height:260, overflow:"hidden", position:"relative" }}>
          <img src={project.imageUrl} alt={project.name} style={{ width:"100%", height:"100%", objectFit:"cover" }} onError={e=>{e.target.parentElement.style.display="none";}} />
          <div style={{ position:"absolute", inset:0, background:"linear-gradient(to bottom, transparent 30%, rgba(4,9,15,0.98))" }} />
        </div>
      )}

      <div style={{ maxWidth:1100, margin:"0 auto", padding:"28px 24px" }}>

        {/* HERO SECTION */}
        <div className="pd-hero-grid" style={{ display:"grid", gridTemplateColumns:"1fr auto", gap:24, alignItems:"flex-start", marginBottom:20, animation:"fadeUp 0.3s ease-out both" }}>
          <div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:7, marginBottom:12 }}>
              {project.status && (
                <span style={{ fontSize:11, fontWeight:700, padding:"4px 12px", borderRadius:6,
                  background:project.status.includes("Construction")?"rgba(16,185,129,0.1)":"rgba(59,130,246,0.1)",
                  color:project.status.includes("Construction")?T.green:T.blue,
                  border:`1px solid ${project.status.includes("Construction")?T.green:T.blue}33` }}>
                  {project.status}
                </span>
              )}
              {price >= 2000000 && <span style={{ fontSize:11, fontWeight:700, padding:"4px 12px", borderRadius:6, background:"rgba(16,185,129,0.1)", color:T.green, border:`1px solid ${T.green}33` }}>Golden Visa Eligible</span>}
              {project.branded && project.brand && <span style={{ fontSize:11, fontWeight:700, padding:"4px 12px", borderRadius:6, background:"rgba(212,168,67,0.1)", color:T.gold, border:`1px solid ${T.gold}33` }}>{project.brand}</span>}
              {project.tier && <span style={{ fontSize:11, fontWeight:600, padding:"4px 12px", borderRadius:6, background:"rgba(100,116,139,0.08)", color:T.textMuted, border:`1px solid #1E293B` }}>{project.tier}</span>}
            </div>
            <h1 style={{ fontFamily:"'Fraunces',serif", fontSize:38, fontWeight:900, color:T.white, lineHeight:1.1, marginBottom:6 }}>{project.name}</h1>
            {ci?.tagline && <p style={{ color:T.teal, fontSize:13, fontStyle:"italic", marginBottom:8 }}>{ci.tagline}</p>}
            <p style={{ color:T.textMuted, fontSize:14 }}>{project.community} �����a��a�� {project.type}{project.beds?` �����a��a�� ${project.beds} BR`:""}</p>
          </div>

          {/* CONSTRUCTION CARD */}
          <div style={{ background:"#0A1628", border:`1px solid #1E293B`, borderRadius:14, padding:"20px 24px", minWidth:220 }}>
            <div style={{ fontSize:10, fontWeight:700, color:T.gold, letterSpacing:1.5, textTransform:"uppercase", marginBottom:12 }}>Construction Progress</div>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14 }}>
              <div style={{ flex:1, height:6, borderRadius:3, background:"#111827", overflow:"hidden" }}>
                <div style={{ height:"100%", width:`${project.construction||0}%`, borderRadius:3, background:constructionColor(project.construction||0), transition:"width 0.8s" }} />
              </div>
              <span style={{ fontFamily:"'Fraunces',serif", fontSize:22, fontWeight:900, color:constructionColor(project.construction||0) }}>{project.construction||0}%</span>
            </div>
            <div style={{ height:1, background:"#1E293B", marginBottom:14 }} />
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
              <div>
                <div style={{ fontSize:9, color:T.textMuted, textTransform:"uppercase", letterSpacing:0.5, marginBottom:4 }}>Handover</div>
                <div style={{ fontSize:15, fontWeight:700, color:T.white }}>{project.handover||"����Ң���a��Ң��a���"}</div>
                {cd && <div style={{ fontSize:10, fontWeight:700, color:cd.color, marginTop:2 }}>{cd.label}</div>}
              </div>
              <div>
                <div style={{ fontSize:9, color:T.textMuted, textTransform:"uppercase", letterSpacing:0.5, marginBottom:4 }}>Payment</div>
                <div style={{ fontSize:15, fontWeight:700, color:T.teal }}>{project.payment||"����Ң���a��Ң��a���"}</div>
              </div>
            </div>
          </div>
        </div>

        {/* ACTION BAR ����Ң���a��Ң��a��� all inline styles, no className dependency */}
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:22, padding:"14px 18px", background:"#0A1628", border:"1px solid #1E293B", borderRadius:12, flexWrap:"wrap" }}>
          <span style={{ fontSize:12, color:"#94A3B8", marginRight:4 }}>Share:</span>
          {/* Send to Client ����Ң���a��Ң��a��� solid gold fill */}
          <button onClick={()=>setShowSendModal(true)} style={{ display:"inline-flex", alignItems:"center", gap:7, padding:"10px 20px", background:"#D4A843", color:"#04090F", border:"2px solid #D4A843", borderRadius:9, fontSize:13, fontWeight:700, cursor:"pointer", whiteSpace:"nowrap", fontFamily:"'Outfit',sans-serif", outline:"none", boxShadow:"none", lineHeight:1 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
            Send to Client
          </button>
          {/* Copy Link ����Ң���a��Ң��a��� solid gold fill */}
          <button onClick={handleCopyLink} style={{ display:"inline-flex", alignItems:"center", gap:7, padding:"10px 18px", background:"#D4A843", color:"#04090F", border:"2px solid #D4A843", borderRadius:9, fontSize:13, fontWeight:700, cursor:"pointer", whiteSpace:"nowrap", fontFamily:"'Outfit',sans-serif", outline:"none", boxShadow:"none", lineHeight:1 }}>
            {copiedLink
              ? <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg> Copied!</>
              : <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> Copy Link</>
            }
          </button>
          {/* WhatsApp ����Ң���a��Ң��a��� solid gold fill */}
          <button onClick={()=>{ const msg=encodeURIComponent(`${project.name} ����Ң���a��Ң��a��� ${fmtM(price)} | ${project.handover}\n${window.location.href}`); window.open(`https://wa.me/?text=${msg}`,"_blank"); }} style={{ display:"inline-flex", alignItems:"center", gap:7, padding:"10px 18px", background:"#D4A843", color:"#04090F", border:"2px solid #D4A843", borderRadius:9, fontSize:13, fontWeight:700, cursor:"pointer", whiteSpace:"nowrap", fontFamily:"'Outfit',sans-serif", outline:"none", boxShadow:"none", lineHeight:1 }}>
            WhatsApp
          </button>
          <div style={{ flex:1 }} />
          {project.emaarUrl && (
            <a href={project.emaarUrl} target="_blank" rel="noopener noreferrer" style={{ display:"inline-flex", alignItems:"center", gap:7, padding:"10px 18px", background:"#D4A843", color:"#04090F", border:"2px solid #D4A843", borderRadius:9, fontSize:13, fontWeight:700, cursor:"pointer", whiteSpace:"nowrap", fontFamily:"'Outfit',sans-serif", textDecoration:"none", lineHeight:1 }}>
              View on {getLinkDomain(project.emaarUrl)} ����Ң��a���Ң��a�����
            </a>
          )}
        </div>

        {/* TABS ����Ң���a��Ң��a��� full gold box on active */}
        <div style={{ borderBottom:"1px solid #1E293B", marginBottom:22, display:"flex", gap:6, overflowX:"auto" }}>
          {TABS.map(t => (
            <button key={t.id} onClick={()=>setActiveTab(t.id)} style={{ padding:"8px 20px", background:activeTab===t.id?"#D4A843":"transparent", border:activeTab===t.id?"2px solid #D4A843":"2px solid #1E293B", borderRadius:activeTab===t.id?8:8, fontSize:13, fontWeight:activeTab===t.id?700:600, cursor:"pointer", color:activeTab===t.id?"#04090F":"#64748B", fontFamily:"'Outfit',sans-serif", whiteSpace:"nowrap", outline:"none", boxShadow:"none", lineHeight:1, marginBottom:8 }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* TAB CONTENT */}
        {activeTab==="overview"  && <OverviewTab  project={project} ci={ci} roi={roi} gross={gross} net={net} appr5={appr5} />}
        {activeTab==="pricing"   && <PricingTab   project={project} />}
        {activeTab==="location"  && <LocationTab  project={project} ci={ci} isPro={isPro} onUpgrade={()=>navigate("/?upgrade=1")} />}
        {activeTab==="roi"       && <ROITab        project={project} roi={roi} gross={gross} net={net} appr5={appr5} price={price} isPro={isPro} onUpgrade={()=>navigate("/?upgrade=1")} />}

        {/* SIMILAR PROJECTS */}
        <div className="pd-card" style={{ marginTop:8 }}>
          <SecTitle>More in {project.community}</SecTitle>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(190px,1fr))", gap:8 }}>
            {emaarProjects.filter(p=>p.community===project.community&&p.id!==project.id).slice(0,6).map(p => (
              <Link key={p.id} to={`/project/${p.docId||p.id}`}
                style={{ display:"flex", flexDirection:"column", padding:"12px 14px", borderRadius:10, background:"#111827", border:`1px solid #1E293B`, textDecoration:"none", transition:"border-color 0.15s" }}
                onMouseEnter={e=>e.currentTarget.style.borderColor=T.gold+"44"}
                onMouseLeave={e=>e.currentTarget.style.borderColor="#1E293B"}>
                <span style={{ fontSize:13, color:T.white, fontWeight:600, marginBottom:4 }}>{p.name}</span>
                <span style={{ fontSize:13, color:T.gold, fontWeight:700 }}>{p.price?fmtM(p.price):"����Ң���a��Ң��a���"}</span>
                <span style={{ fontSize:11, color:T.textMuted, marginTop:2 }}>{p.handover} �����a��a�� {p.status}</span>
              </Link>
            ))}
          </div>
          <Link to="/" style={{ display:"block", textAlign:"center", marginTop:14, fontSize:12, color:T.gold, textDecoration:"none", fontWeight:600 }}>View All Projects ����Ң��a���Ң��a���~�</Link>
        </div>

        {/* DISCLAIMER */}
        <div style={{ marginTop:16, padding:14, borderRadius:10, background:T.surface, border:`1px solid #1E293B`, fontSize:10, color:T.textMuted, lineHeight:1.7 }}>
          <strong style={{ color:T.textSecondary }}>Disclaimer:</strong> Prices, handover dates, and payment plans are estimates based on publicly available data. DXB Analytics is not a licensed real estate brokerage. Always verify with the developer before making financial decisions.
        </div>
      </div>
    </div>
  );
}
