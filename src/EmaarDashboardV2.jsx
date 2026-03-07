

import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import emailjs from "@emailjs/browser";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, ComposedChart, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from "recharts";
import { auth, db } from "./firebase";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut, sendPasswordResetEmail, sendEmailVerification, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { collection, getDocs, doc, getDoc, setDoc } from "firebase/firestore";

import { T, emaarProjects, emaarFinancials, emaarCommunities, emaarYields, topDevelopers, emaarRisks, dubaiMarket, dubaiSalesHistory, roiPhases, emaarSegments, radarData, megaProjects, communityIntel, communityROI } from "./data";
import LandingPage from "./LandingPage";
import RoiCalculator from "./RoiCalculator";

/* ─── DATA ALIASES (for backward compat) ─── */
const financials = emaarFinancials;
const segments = emaarSegments;
const risks = emaarRisks.map(r => ({ factor: r.factor, score: r.score, max: 150, color: r.color }));
const yields = emaarYields.map(y => ({ label: y.unit, community: y.community, rent: y.rent/1000, price: y.price/1000, gross: y.gross, net: y.net, demand: y.demand === "Very High" ? "V.High" : y.demand === "Moderate-High" ? "High" : y.demand, visa: y.visa }));
const developers = topDevelopers.map(d => ({ rank: d.rank, name: d.name.replace(" Properties","").replace(" Realty","").replace(" Development",""), sales: d.sales, units: d.units, delivered: d.delivered, underConst: d.underConst, color: d.color, share: d.share, segment: d.segment }));
const communityProjects = emaarCommunities.filter(c => c.name).map(c => ({ name: c.district, full: c.name, projects: c.projects, yield: c.avgYield ? `${c.avgYield}%` : "—", ppsf: c.avgPpsf ? c.avgPpsf.toLocaleString() : "—" }));

/* ─── LINK LABEL HELPER ─── */
const getLinkLabel = (url) => {
  if (!url) return "View ↗";
  if (url.includes("propertyfinder.ae")) return "PropertyFinder ↗";
  if (url.includes("bayut.com")) return "Bayut ↗";
  if (url.includes("properties.emaar.com") || url.includes("emaar.com")) return "Emaar ↗";
  return "View ↗";
};
const getLinkDomain = (url) => {
  if (!url) return "Listing";
  if (url.includes("propertyfinder.ae")) return "PropertyFinder.ae";
  if (url.includes("bayut.com")) return "Bayut.com";
  if (url.includes("properties.emaar.com") || url.includes("emaar.com")) return "Emaar.com";
  return "Official Listing";
};

/* ─── HANDOVER COUNTDOWN ─── */
const getHandoverCountdown = (handover) => {
  if (!handover) return null;
  const match = handover.match(/Q([1-4])\s+(\d{4})/);
  if (!match) return null;
  const q = parseInt(match[1]);
  const year = parseInt(match[2]);
  const qEndMonth = [2, 5, 8, 11];
  const qEndDay   = [31, 30, 30, 31];
  const target = new Date(year, qEndMonth[q - 1], qEndDay[q - 1]);
  const now = new Date();
  const diffMs = target - now;
  if (diffMs <= 0) return { label: "Handover due", color: "#10B981", urgent: false, passed: true };
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  const diffMonths = Math.round(diffMs / (1000 * 60 * 60 * 24 * 30.44));
  let label, color;
  if (diffDays <= 90) { label = diffDays + "d left"; color = "#EF4444"; }
  else if (diffMonths <= 6) { label = diffMonths + "mo left"; color = "#F59E0B"; }
  else if (diffMonths <= 18) { label = diffMonths + "mo left"; color = "#D4A843"; }
  else { label = (diffMonths / 12).toFixed(1) + "yr left"; color = "#94A3B8"; }
  return { label, color, urgent: diffDays <= 90, months: diffMonths, days: diffDays };
};

/* ─── ICONS (inline SVG) ─── */
const Icons = {
  overview: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
  financials: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
  portfolio: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  competitors: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/></svg>,
  yields: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
  risk: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  market: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
  logout: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  menu: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
  close: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  lock: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
  eye: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  eyeOff: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>,
  search: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  bell: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
  up: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="18 15 12 9 6 15"/></svg>,
  down: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="6 9 12 15 18 9"/></svg>,
  projects: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><line x1="12" y1="12" x2="12" y2="12.01"/></svg>,
  megaProj: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>,
  admin: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
};

const TABS = [
  { key: "Overview", icon: Icons.overview },
  { key: "Financials", icon: Icons.financials },
  { key: "Projects", icon: Icons.projects },
  { key: "Portfolio", icon: Icons.portfolio },
  { key: "Competitors", icon: Icons.competitors },
  { key: "Yields", icon: Icons.yields },
  { key: "Mortgage", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> },
  { key: "Map", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg> },
  { key: "Risk", icon: Icons.risk },
  { key: "Market", icon: Icons.market },
  { key: "Currency", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v2m0 8v2M9.5 9.5C9.5 8.1 10.6 7 12 7s2.5 1.1 2.5 2.5c0 3-5 3-5 6 0 1.4 1.1 2.5 2.5 2.5s2.5-1.1 2.5-2.5"/></svg> },
  { key: "Golden Visa", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg> },
];

/* ─── STYLES ─── */
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700;9..144,900&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }
  html { font-size: 14px; }
  body { background: ${T.bg}; color: ${T.textPrimary}; font-family: 'Outfit', sans-serif; }

  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(212,168,67,0.2); border-radius: 3px; }
  ::-webkit-scrollbar-thumb:hover { background: rgba(212,168,67,0.35); }

  @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }

  @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
  @keyframes ping { 0% { transform: scale(1); opacity: 0.6; } 100% { transform: scale(2.4); opacity: 0; } }
  @keyframes slideIn { from { transform: translateX(-100%); } to { transform: translateX(0); } }
  @keyframes spin { to { transform: rotate(360deg); } }

  .fade-up { animation: fadeUp 0.5s ease-out forwards; opacity: 0; }
  .delay-1 { animation-delay: 0.05s; }
  .delay-2 { animation-delay: 0.1s; }
  .delay-3 { animation-delay: 0.15s; }
  .delay-4 { animation-delay: 0.2s; }
  .delay-5 { animation-delay: 0.25s; }
  .delay-6 { animation-delay: 0.3s; }
  .delay-7 { animation-delay: 0.35s; }
  .delay-8 { animation-delay: 0.4s; }

  .kpi-card {
    background: linear-gradient(135deg, ${T.card} 0%, ${T.surfaceAlt} 100%);
    border: 1px solid ${T.border};
    border-radius: 16px;
    padding: 20px 16px;
    position: relative;
    overflow: hidden;
    transition: all 0.3s ease;
    cursor: default;
  }
  .kpi-card:hover {
    border-color: ${T.borderHover};
    transform: translateY(-2px);
    box-shadow: 0 8px 32px rgba(0,0,0,0.3), 0 0 0 1px rgba(212,168,67,0.1);
  }
  .kpi-card::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 2px;
    background: linear-gradient(90deg, transparent, ${T.gold}, transparent);
    opacity: 0;
    transition: opacity 0.3s;
  }
  .kpi-card:hover::before { opacity: 1; }

  .chart-box {
    background: linear-gradient(180deg, ${T.card} 0%, rgba(4,9,15,0.95) 100%);
    border: 1px solid ${T.border};
    border-radius: 16px;
    padding: 20px;
    transition: border-color 0.3s;
  }
  .chart-box:hover { border-color: ${T.borderHover}; }
  select option { background: ${T.surface}; color: ${T.textPrimary}; }
  * { scrollbar-width: thin; scrollbar-color: rgba(212,168,67,0.15) transparent; }

  .sidebar-btn {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    padding: 11px 16px;
    border: none;
    border-radius: 10px;
    cursor: pointer;
    font-family: 'Outfit', sans-serif;
    font-size: 13px;
    font-weight: 500;
    transition: all 0.2s ease;
    color: ${T.textSecondary};
    background: transparent;
    text-align: left;
    position: relative;
  }
  .sidebar-btn:hover { background: rgba(212,168,67,0.06); color: ${T.white}; }
  .sidebar-btn.active {
    background: linear-gradient(135deg, rgba(212,168,67,0.12), rgba(212,168,67,0.04));
    color: ${T.gold};
    font-weight: 600;
  }
  .sidebar-btn.active::before {
    content: '';
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    width: 3px;
    height: 60%;
    background: ${T.gold};
    border-radius: 0 3px 3px 0;
  }

  .login-input {
    width: 100%;
    padding: 14px 16px;
    background: ${T.surface};
    border: 1px solid ${T.border};
    border-radius: 12px;
    color: ${T.white};
    font-family: 'Outfit', sans-serif;
    font-size: 14px;
    outline: none;
    transition: all 0.3s;
  }
  .login-input:focus { border-color: ${T.gold}; box-shadow: 0 0 0 3px rgba(212,168,67,0.1); }
  .login-input::placeholder { color: ${T.textMuted}; }

  .login-btn {
    width: 100%;
    padding: 14px;
    background: linear-gradient(135deg, ${T.gold}, #B8912F);
    border: none;
    border-radius: 12px;
    color: ${T.bg};
    font-family: 'Outfit', sans-serif;
    font-size: 15px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.3s;
    letter-spacing: 0.5px;
  }
  .login-btn:hover { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(212,168,67,0.3); }
  .login-btn:active { transform: translateY(0); }

  .trend-up { color: ${T.green}; }
  .trend-down { color: ${T.red}; }

  .mobile-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.6);
    backdrop-filter: blur(4px);
    z-index: 90;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.3s;
  }
  .mobile-overlay.open { opacity: 1; pointer-events: auto; }

  @media (max-width: 768px) {
    html { font-size: 13px; }
    .sidebar { transform: translateX(-100%); position: fixed !important; z-index: 100; }
    .sidebar.open { transform: translateX(0); }
    .main-content { margin-left: 0 !important; }
    .top-bar { left: 0 !important; }
    .kpi-grid { grid-template-columns: 1fr 1fr !important; gap: 8px !important; }
    .chart-grid-2 { grid-template-columns: 1fr !important; }
    .chart-grid-3 { grid-template-columns: 1fr !important; }
    .chart-grid-4 { grid-template-columns: 1fr 1fr !important; }
    .header-badges { gap: 4px !important; }
    .header-badges > div:nth-child(n+3) { display: none !important; }
    .mobile-menu-btn { display: block !important; }
    .kpi-card { padding: 14px 12px !important; border-radius: 12px !important; }
    .kpi-card .kpi-value { font-size: 22px !important; }
    .chart-box { padding: 14px 10px !important; border-radius: 12px !important; }
    .main-content > div { padding: 0 14px 40px !important; }
    .filter-scroll { overflow-x: auto; flex-wrap: nowrap !important; -webkit-overflow-scrolling: touch; scrollbar-width: none; padding-bottom: 4px; }
    .filter-scroll::-webkit-scrollbar { display: none; }
    .filter-scroll button { flex-shrink: 0; }
    .compare-bar { padding: 10px 14px !important; flex-direction: column !important; align-items: stretch !important; gap: 8px !important; }
    .compare-bar > div { justify-content: center; flex-wrap: wrap; }
    .table-scroll { position: relative; }
    .table-scroll::after { content: "→"; position: absolute; right: 4px; top: 50%; transform: translateY(-50%); color: ${T.gold}; font-size: 16px; opacity: 0.4; pointer-events: none; }
  }

  @media (max-width: 480px) {
    html { font-size: 12px; }
    .kpi-grid { grid-template-columns: 1fr !important; gap: 6px !important; }
    .chart-grid-4 { grid-template-columns: 1fr !important; }
    .header-badges { display: none !important; }
    .top-bar { padding: 0 12px !important; }
    .top-bar h1 { font-size: 13px !important; }
    .chart-box .recharts-responsive-container { max-height: 200px !important; }
  }
`;

/* ─── COMPONENTS ─── */

/* Loading Skeleton for data fetch */
const LoadingSkeleton = ({ rows = 6, cols = 3 }) => (
  <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 12 }}>
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="chart-box fade-up" style={{ animationDelay: `${i * 0.05}s`, padding: 20, minHeight: 120 }}>
        <div style={{ width: "40%", height: 10, borderRadius: 4, background: T.surfaceAlt, marginBottom: 12 }} />
        <div style={{ width: "60%", height: 22, borderRadius: 4, background: T.surfaceAlt, marginBottom: 10 }} />
        <div style={{ width: "80%", height: 8, borderRadius: 4, background: T.surfaceAlt }} />
      </div>
    ))}
  </div>
);

const KPI = ({ label, value, sub, icon, delay = 0, onClick }) => {
  const [hovered, setHovered] = useState(false);
  const isClickable = !!onClick;
  return (
    <div
      className={`kpi-card fade-up delay-${delay}`}
      title={isClickable ? `Click to view ${label} breakdown` : label}
      onClick={onClick}
      onMouseEnter={() => isClickable && setHovered(true)}
      onMouseLeave={() => isClickable && setHovered(false)}
      style={{ cursor: isClickable ? "pointer" : "default", transition: "transform 0.2s, box-shadow 0.2s, border-color 0.2s", transform: hovered ? "translateY(-3px)" : "none", boxShadow: hovered ? `0 10px 30px rgba(212,168,67,0.2)` : undefined, borderColor: hovered ? T.gold : undefined, position: "relative" }}
    >
      <div style={{ position: "absolute", top: -30, right: -30, width: 80, height: 80, borderRadius: "50%", background: `radial-gradient(circle, ${T.goldGlow} 0%, transparent 70%)` }} />
      {isClickable && <div style={{ position: "absolute", top: 10, right: 10, fontSize: 14, color: hovered ? T.gold : T.border, transition: "color 0.2s" }}>›</div>}
      <div style={{ fontSize: 10, fontWeight: 600, color: T.textMuted, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 8 }}>{label}</div>
      <div style={{ fontFamily: "'Fraunces', serif", fontSize: 26, fontWeight: 700, color: T.gold, lineHeight: 1.1, marginBottom: 4 }}>{value}</div>
      <div style={{ fontSize: 12, fontWeight: 500, color: T.teal, display: "flex", alignItems: "center", gap: 4 }}>
        {sub?.includes("+") && <span style={{ color: T.green }}>{Icons.up}</span>}
        {sub}
      </div>
      {isClickable && <div style={{ marginTop: 8, fontSize: 9, color: hovered ? T.gold : T.textMuted, fontWeight: 600, letterSpacing: 0.5, transition: "color 0.2s" }}>{hovered ? "View breakdown →" : "Click for details"}</div>}
    </div>
  );
};

const ForecastCard = ({ firm, color, short, forecast, detail, bullets, sourceUrl }) => {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="chart-box" style={{ borderTop: `3px solid ${color}`, cursor: "pointer", transition: "all 0.2s" }} onClick={() => setExpanded(e => !e)}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <h4 style={{ color, fontSize: 15, fontWeight: 700, marginBottom: 4, fontFamily: "'Fraunces', serif" }}>{firm}</h4>
        <span style={{ fontSize: 16, color: T.textMuted, display: "inline-block", transform: expanded ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>⌄</span>
      </div>
      <div style={{ fontSize: 10, fontWeight: 700, color: T.white, background: color + "20", padding: "3px 8px", borderRadius: 5, display: "inline-block", marginBottom: 8 }}>{forecast}</div>
      <p style={{ color: T.textSecondary, fontSize: 12, lineHeight: 1.6 }}>{short}</p>
      {expanded && (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${T.border}` }}>
          <p style={{ color: T.textSecondary, fontSize: 12, lineHeight: 1.7, marginBottom: 10 }}>{detail}</p>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 5 }}>
            {bullets.map((b, bi) => (
              <li key={bi} style={{ fontSize: 11, color: T.textSecondary, display: "flex", gap: 6, alignItems: "flex-start" }}>
                <span style={{ color, fontWeight: 700, marginTop: 1 }}>›</span> {b}
              </li>
            ))}
          </ul>
          <a href={sourceUrl} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ display: "inline-block", marginTop: 10, fontSize: 10, color, fontWeight: 700, textDecoration: "none" }}>Full Report ↗</a>
        </div>
      )}
      {!expanded && <div style={{ marginTop: 8, fontSize: 10, color: T.textMuted }}>Click to expand full analysis</div>}
    </div>
  );
};

const Section = ({ title, sub, children, delay = 0 }) => (
  <div className={`fade-up delay-${delay}`} style={{ marginTop: 36, marginBottom: 16 }}>
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
      <div style={{ width: 4, height: 28, background: `linear-gradient(180deg, ${T.gold}, transparent)`, borderRadius: 2 }} />
      <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 700, color: T.white }}>{title}</h2>
    </div>
    {sub && <p style={{ color: T.textSecondary, fontSize: 12, marginLeft: 16, marginTop: 2 }}>{sub}</p>}
    {children}
  </div>
);

const Chart = ({ title, children, style: extraStyle }) => (
  <div className="chart-box" style={extraStyle}>
    {title && <h3 style={{ fontSize: 11, fontWeight: 600, color: T.goldLight, letterSpacing: 1, textTransform: "uppercase", marginBottom: 14 }}>{title}</h3>}
    {children}
  </div>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.gold}`, borderRadius: 10, padding: "10px 14px", boxShadow: "0 12px 40px rgba(0,0,0,0.5)" }}>
      <p style={{ color: T.gold, fontWeight: 700, margin: 0, fontSize: 12, fontFamily: "'Fraunces', serif" }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color || T.white, margin: "3px 0 0", fontSize: 12 }}>
          {p.name}: <strong>{typeof p.value === "number" ? p.value.toFixed(1) : p.value}</strong>
        </p>
      ))}
    </div>
  );
};

/* ─── LOGIN SCREEN ─── */
const googleProvider = new GoogleAuthProvider();

const PasswordStrength = ({ password }) => {
  const score = [/.{8,}/, /[0-9]/, /[A-Z]/, /[^A-Za-z0-9]/].filter(r => r.test(password)).length;
  const levels = [
    { label: "Too short", color: "#EF4444" },
    { label: "Weak", color: "#F59E0B" },
    { label: "Good", color: "#3B82F6" },
    { label: "Strong", color: "#10B981" },
    { label: "Very Strong", color: "#10B981" },
  ];
  if (!password) return null;
  const lvl = levels[Math.min(score, 4)];
  return (
    <div style={{ marginTop: 6 }}>
      <div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
        {[0,1,2,3].map(i => (
          <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i < score ? lvl.color : "rgba(255,255,255,0.08)", transition: "background 0.3s" }} />
        ))}
      </div>
      <div style={{ fontSize: 10, color: lvl.color, fontWeight: 600 }}>{lvl.label}</div>
    </div>
  );
};

const LoginScreen = ({ onLogin, onBack, defaultMode = "login" }) => {
  const [mode, setMode] = useState(defaultMode);
  const [screen, setScreen] = useState("form"); // "form" | "verify" | "reset_sent"
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  const switchMode = (m) => { setMode(m); setError(""); setPass(""); setConfirmPass(""); };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true); setError("");
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const u = result.user;
      const snap = await getDoc(doc(db, "users", u.uid));
      if (!snap.exists()) {
        const now = new Date();
        const trialEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        await setDoc(doc(db, "users", u.uid), {
          name: u.displayName || u.email.split("@")[0],
          email: u.email,
          tier: "pro_trial",
          createdAt: now.toISOString(),
          trialStart: now.toISOString(),
          trialEnd: trialEnd.toISOString(),
          role: "user",
          provider: "google",
        });
        try {
          await emailjs.send("service_da7nshv", "template_gl1xqhy", {
            user_email: u.email,
            user_name: u.displayName || u.email.split("@")[0],
            project_name: "DXB Analytics Platform",
            change_type: "Welcome to DXB Analytics!",
            new_value: "Your 7-day Pro Trial is now active. Explore 48+ projects, yields, ROI data and more.",
            old_value: "New Account",
            updated_at: now.toLocaleDateString("en-AE"),
          }, "USkwUhp0csGCVDkdQ");
        } catch(e) {}
      }
      onLogin(u.email);
    } catch (err) {
      if (err.code !== "auth/popup-closed-by-user") setError("Google sign-in failed. Please try again.");
    }
    setGoogleLoading(false);
  };

  const handleForgot = async () => {
    if (!email) { setError("Enter your email first, then click Forgot password"); return; }
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setScreen("reset_sent");
      setError("");
    } catch (err) { setError("Could not send reset email. Check your email address."); }
    setLoading(false);
  };

  const handleLogin = async (e) => {
    e?.preventDefault?.();
    if (!email || !pass) { setError("Please fill in all fields"); return; }
    setLoading(true); setError("");
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      onLogin(email);
    } catch (err) {
      const msgs = {
        "auth/user-not-found": "Invalid email or password",
        "auth/invalid-credential": "Invalid email or password",
        "auth/wrong-password": "Incorrect password",
        "auth/too-many-requests": "Too many attempts. Please try again later.",
        "auth/user-disabled": "This account has been disabled. Contact support.",
      };
      setError(msgs[err.code] || "Login failed. Please try again.");
    }
    setLoading(false);
  };

  const handleSignUp = async (e) => {
    e?.preventDefault?.();
    if (!name.trim()) { setError("Please enter your full name"); return; }
    if (!email) { setError("Please enter your email address"); return; }
    if (!pass) { setError("Please enter a password"); return; }
    if (pass.length < 8) { setError("Password must be at least 8 characters"); return; }
    if (!/[0-9]/.test(pass)) { setError("Password must contain at least one number"); return; }
    if (pass !== confirmPass) { setError("Passwords do not match"); return; }
    if (!agreedTerms) { setError("Please agree to the Terms of Service and Privacy Policy"); return; }
    setLoading(true); setError("");
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, pass);
      const now = new Date();
      const trialEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      await setDoc(doc(db, "users", cred.user.uid), {
        name: name.trim(), email,
        phone: phone.trim(), country: country.trim(),
        tier: "pro_trial",
        createdAt: now.toISOString(),
        trialStart: now.toISOString(),
        trialEnd: trialEnd.toISOString(),
        role: "user", emailVerified: false, provider: "email",
      });
      try { await sendEmailVerification(cred.user); } catch(e) {}
      try {
        await emailjs.send("service_da7nshv", "template_gl1xqhy", {
          user_email: email, user_name: name.trim(),
          project_name: "DXB Analytics Platform",
          change_type: "Welcome to DXB Analytics! — Please verify your email",
          new_value: "Your 7-day Pro Trial is active. Check your inbox to verify your email address.",
          old_value: "New Account",
          updated_at: now.toLocaleDateString("en-AE"),
        }, "USkwUhp0csGCVDkdQ");
      } catch(e) {}
      setScreen("verify");
    } catch (err) {
      const msgs = {
        "auth/email-already-in-use": "This email is already registered. Try signing in instead.",
        "auth/weak-password": "Password is too weak.",
        "auth/invalid-email": "Please enter a valid email address.",
      };
      setError(msgs[err.code] || "Sign up failed. Please try again.");
    }
    setLoading(false);
  };

  // ── Verify Email Screen ──
  if (screen === "verify") return (
    <div style={{ minHeight: "100vh", background: T.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <style>{css}</style>
      <div className="fade-up" style={{ width: "100%", maxWidth: 440, padding: "0 20px", textAlign: "center" }}>
        <div style={{ background: T.surface, border: "1px solid rgba(16,185,129,0.3)", borderRadius: 20, padding: 40 }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>📧</div>
          <h2 style={{ fontFamily: "'Fraunces',serif", fontSize: 22, fontWeight: 800, color: T.white, marginBottom: 10 }}>Check your inbox</h2>
          <p style={{ color: T.textSecondary, fontSize: 13, lineHeight: 1.7, marginBottom: 8 }}>
            We sent a verification link to <span style={{ color: T.gold, fontWeight: 600 }}>{email}</span>
          </p>
          <p style={{ color: T.textMuted, fontSize: 12, lineHeight: 1.7, marginBottom: 28 }}>
            Click the link in the email to verify your account, then come back and sign in. Check your spam folder if you don't see it within 2 minutes.
          </p>
          <div style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 10, padding: "12px 16px", marginBottom: 24, textAlign: "left" }}>
            {["Click the link in the verification email", "Return to this page", "Sign in with your email & password"].map((s, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "4px 0" }}>
                <div style={{ width: 20, height: 20, borderRadius: "50%", background: "rgba(16,185,129,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: T.green, fontWeight: 700, flexShrink: 0 }}>{i+1}</div>
                <span style={{ fontSize: 12, color: T.textSecondary }}>{s}</span>
              </div>
            ))}
          </div>
          <button type="button" className="login-btn" onClick={() => { setScreen("form"); setMode("login"); setPass(""); setConfirmPass(""); }}>
            Go to Sign In →
          </button>
          <button type="button" onClick={async () => { try { if (auth.currentUser) { await sendEmailVerification(auth.currentUser); alert("Verification email resent! Check your inbox."); } } catch(e){} }} style={{ display: "block", margin: "12px auto 0", background: "none", border: "none", color: T.gold, fontSize: 12, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>
            Resend verification email
          </button>
        </div>
      </div>
    </div>
  );

  // ── Reset Sent Screen ──
  if (screen === "reset_sent") return (
    <div style={{ minHeight: "100vh", background: T.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <style>{css}</style>
      <div className="fade-up" style={{ width: "100%", maxWidth: 440, padding: "0 20px", textAlign: "center" }}>
        <div style={{ background: T.surface, border: "1px solid rgba(212,168,67,0.3)", borderRadius: 20, padding: 40 }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>🔑</div>
          <h2 style={{ fontFamily: "'Fraunces',serif", fontSize: 22, fontWeight: 800, color: T.white, marginBottom: 10 }}>Password Reset Sent</h2>
          <p style={{ color: T.textSecondary, fontSize: 13, lineHeight: 1.7, marginBottom: 8 }}>
            We sent a reset link to <span style={{ color: T.gold, fontWeight: 600 }}>{email}</span>
          </p>
          <p style={{ color: T.textMuted, fontSize: 12, lineHeight: 1.7, marginBottom: 28 }}>
            Click the link in the email to set a new password. The link expires in 1 hour. Check your spam folder if you don't see it.
          </p>
          <button type="button" className="login-btn" onClick={() => setScreen("form")}>Back to Sign In</button>
        </div>
      </div>
    </div>
  );

  // ── Main Form ──
  return (
    <div style={{ minHeight: "100vh", background: T.bg, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
      <style>{css}</style>
      {onBack && (
        <button type="button" onClick={onBack} style={{ position: "absolute", top: 24, left: 24, display: "flex", alignItems: "center", gap: 6, background: "none", border: `1px solid ${T.border}`, borderRadius: 8, padding: "8px 16px", color: T.textSecondary, fontSize: 13, fontFamily: "'Outfit', sans-serif", cursor: "pointer", zIndex: 10 }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = T.gold; e.currentTarget.style.color = T.gold; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.textSecondary; }}>
          ← Back to Home
        </button>
      )}
      <div style={{ position: "absolute", inset: 0, opacity: 0.015, backgroundImage: `radial-gradient(${T.gold} 1px, transparent 1px)`, backgroundSize: "50px 50px" }} />
      <div style={{ position: "absolute", top: "20%", left: "10%", width: 400, height: 400, borderRadius: "50%", background: `radial-gradient(circle, rgba(212,168,67,0.04) 0%, transparent 70%)` }} />

      <div className="fade-up" style={{ width: "100%", maxWidth: 440, padding: "0 20px", position: "relative", zIndex: 1 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 3, marginBottom: 8 }}>
            <svg width="36" height="36" viewBox="0 0 40 40"><rect x="2" y="2" width="36" height="36" rx="8" fill="none" stroke={T.gold} strokeWidth="2" /><path d="M12 28V12h10l-6 8h8l-12 8z" fill={T.gold} /></svg>
          </div>
          <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 28, fontWeight: 900, color: T.gold, letterSpacing: -0.5, marginBottom: 2 }}>DXB Analytics</h1>
          <p style={{ color: T.textMuted, fontSize: 13, letterSpacing: 2, textTransform: "uppercase" }}>Dubai Real Estate Intelligence</p>
        </div>

        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 20, padding: 32 }}>
          {/* Mode Toggle */}
          <div style={{ display: "flex", marginBottom: 24, background: T.surfaceAlt, borderRadius: 10, padding: 3 }}>
            <button type="button" onClick={() => switchMode("login")} style={{ flex: 1, padding: "10px 0", borderRadius: 8, border: "none", fontFamily: "'Outfit',sans-serif", fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.2s", background: mode === "login" ? T.gold : "transparent", color: mode === "login" ? T.bg : T.textMuted }}>Sign In</button>
            <button type="button" onClick={() => switchMode("signup")} style={{ flex: 1, padding: "10px 0", borderRadius: 8, border: "none", fontFamily: "'Outfit',sans-serif", fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.2s", background: mode === "signup" ? T.gold : "transparent", color: mode === "signup" ? T.bg : T.textMuted }}>Create Account</button>
          </div>

          <h2 style={{ fontFamily: "'Fraunces',serif", fontSize: 20, fontWeight: 700, color: T.white, marginBottom: 4 }}>
            {mode === "login" ? "Welcome back" : "Start your free trial"}
          </h2>
          <p style={{ color: T.textSecondary, fontSize: 13, marginBottom: 20 }}>
            {mode === "login" ? "Sign in to access your dashboard" : "7 days full Pro access — no credit card required"}
          </p>

          {/* Google Sign-In */}
          <button type="button" onClick={handleGoogleSignIn} disabled={googleLoading} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "11px 0", borderRadius: 10, border: `1px solid ${T.border}`, background: T.surfaceAlt, color: T.white, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit',sans-serif", marginBottom: 16, transition: "all 0.2s" }}
            onMouseEnter={e => e.currentTarget.style.borderColor = T.gold}
            onMouseLeave={e => e.currentTarget.style.borderColor = T.border}>
            {googleLoading
              ? <span style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.2)", borderTopColor: T.white, borderRadius: "50%", animation: "spin 0.6s linear infinite", display: "inline-block" }} />
              : <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#4285F4" d="M47.5 24.6c0-1.6-.1-3.1-.4-4.6H24v8.7h13.2c-.6 3-2.4 5.5-5 7.2v6h8.1c4.7-4.4 7.2-10.8 7.2-17.3z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-8.1-6c-2.1 1.4-4.7 2.2-7.8 2.2-6 0-11-4-12.8-9.5H3v6.2C7 42.6 15 48 24 48z"/><path fill="#FBBC05" d="M11.2 28.9c-.5-1.4-.7-2.8-.7-4.4s.3-3 .7-4.4V14H3a23.9 23.9 0 0 0 0 20l8.2-5.1z"/><path fill="#EA4335" d="M24 9.5c3.4 0 6.4 1.2 8.8 3.4l6.6-6.6C35.9 2.5 30.4 0 24 0 15 0 7 5.4 3 13.9l8.2 5.1C13 13.6 18 9.5 24 9.5z"/></svg>
            }
            {googleLoading ? "Signing in..." : "Continue with Google"}
          </button>

          {/* Divider */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <div style={{ flex: 1, height: 1, background: T.border }} />
            <span style={{ fontSize: 11, color: T.textMuted, fontWeight: 600 }}>OR</span>
            <div style={{ flex: 1, height: 1, background: T.border }} />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {mode === "signup" && (
              <>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: T.textSecondary, textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 6 }}>Full Name *</label>
                  <input className="login-input" type="text" placeholder="John Smith" value={name} onChange={e => setName(e.target.value)} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: T.textSecondary, textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 6 }}>Phone</label>
                    <input className="login-input" type="tel" placeholder="+971 50 000 0000" value={phone} onChange={e => setPhone(e.target.value)} />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: T.textSecondary, textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 6 }}>Country</label>
                    <input className="login-input" type="text" placeholder="UAE" value={country} onChange={e => setCountry(e.target.value)} />
                  </div>
                </div>
              </>
            )}

            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: T.textSecondary, textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 6 }}>Email Address *</label>
              <input className="login-input" type="email" placeholder="you@company.com" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === "Enter" && mode === "login" && handleLogin()} />
            </div>

            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: T.textSecondary, textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 6 }}>Password *</label>
              <div style={{ position: "relative" }}>
                <input className="login-input" type={showPass ? "text" : "password"} placeholder={mode === "signup" ? "Min 8 chars + 1 number" : "••••••••"} value={pass} onChange={e => setPass(e.target.value)} onKeyDown={e => e.key === "Enter" && mode === "login" && handleLogin()} style={{ paddingRight: 44 }} />
                <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: T.textMuted, padding: 4 }}>
                  {showPass ? Icons.eyeOff : Icons.eye}
                </button>
              </div>
              {mode === "signup" && <PasswordStrength password={pass} />}
            </div>

            {mode === "signup" && (
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: T.textSecondary, textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 6 }}>Confirm Password *</label>
                <div style={{ position: "relative" }}>
                  <input className="login-input" type={showConfirm ? "text" : "password"} placeholder="Re-enter your password" value={confirmPass} onChange={e => setConfirmPass(e.target.value)} style={{ paddingRight: 44, borderColor: confirmPass && confirmPass !== pass ? "rgba(239,68,68,0.5)" : confirmPass && confirmPass === pass ? "rgba(16,185,129,0.5)" : undefined }} />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: T.textMuted, padding: 4 }}>
                    {showConfirm ? Icons.eyeOff : Icons.eye}
                  </button>
                </div>
                {confirmPass && confirmPass !== pass && <div style={{ fontSize: 10, color: T.red, marginTop: 4 }}>✗ Passwords do not match</div>}
                {confirmPass && confirmPass === pass && <div style={{ fontSize: 10, color: T.green, marginTop: 4 }}>✓ Passwords match</div>}
              </div>
            )}

            {error && <div style={{ color: T.red, fontSize: 12, padding: "8px 12px", background: "rgba(239,68,68,0.08)", borderRadius: 8, border: "1px solid rgba(239,68,68,0.2)" }}>{error}</div>}

            {mode === "login" && (
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button onClick={handleForgot} type="button" disabled={loading} style={{ background: "none", border: "none", color: T.gold, fontSize: 12, cursor: "pointer", fontFamily: "'Outfit',sans-serif", padding: 0 }}>
                  {loading ? "Sending..." : "Forgot password?"}
                </button>
              </div>
            )}

            {mode === "signup" && (
              <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer" }}>
                <input type="checkbox" checked={agreedTerms} onChange={e => setAgreedTerms(e.target.checked)} style={{ accentColor: T.gold, marginTop: 2, flexShrink: 0, width: 14, height: 14 }} />
                <span style={{ fontSize: 11, color: T.textSecondary, lineHeight: 1.6 }}>
                  I agree to the <a href="/terms" target="_blank" rel="noreferrer" style={{ color: T.gold, fontWeight: 600 }}>Terms of Service</a> and <a href="/privacy" target="_blank" rel="noreferrer" style={{ color: T.gold, fontWeight: 600 }}>Privacy Policy</a>. I consent to DXB Analytics processing my data for real estate intelligence services.
                </span>
              </label>
            )}

            <button type="button" className="login-btn" onClick={mode === "login" ? handleLogin : handleSignUp} disabled={loading || (mode === "signup" && !agreedTerms)}>
              {loading ? (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                  <span style={{ width: 16, height: 16, border: "2px solid rgba(4,9,15,0.3)", borderTopColor: T.bg, borderRadius: "50%", animation: "spin 0.6s linear infinite", display: "inline-block" }} />
                  {mode === "login" ? "Signing in..." : "Creating account..."}
                </span>
              ) : mode === "login" ? "Sign In" : "Start Free Trial →"}
            </button>

            {mode === "signup" && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", background: "rgba(212,168,67,0.06)", borderRadius: 8, border: `1px solid ${T.border}` }}>
                <span style={{ fontSize: 16 }}>⭐</span>
                <div style={{ fontSize: 11, color: T.textSecondary, lineHeight: 1.4 }}>
                  <span style={{ color: T.gold, fontWeight: 600 }}>7-day Pro trial</span> — Full access. No credit card. Cancel anytime.
                </div>
              </div>
            )}
          </div>

          <div style={{ textAlign: "center", marginTop: 20, paddingTop: 16, borderTop: `1px solid ${T.border}` }}>
            <p style={{ color: T.textMuted, fontSize: 12 }}>
              {mode === "login" ? (
                <>Don't have an account? <button type="button" onClick={() => switchMode("signup")} style={{ color: T.gold, background: "none", border: "none", fontWeight: 600, cursor: "pointer", fontSize: 12, fontFamily: "'Outfit',sans-serif", padding: 0 }}>Sign up free</button></>
              ) : (
                <>Already have an account? <button type="button" onClick={() => switchMode("login")} style={{ color: T.gold, background: "none", border: "none", fontWeight: 600, cursor: "pointer", fontSize: 12, fontFamily: "'Outfit',sans-serif", padding: 0 }}>Sign in</button></>
              )}
            </p>
          </div>
        </div>

        <p style={{ textAlign: "center", color: T.textMuted, fontSize: 11, marginTop: 20 }}>
          🔒 Secured by Firebase · SSL Encrypted · GDPR Compliant
        </p>
      </div>
    </div>
  );
};


/* ─── PRO GATE OVERLAY ─── */
const ProGate = ({ children, isPro, message = "Upgrade to Pro to unlock this data", onUpgrade, blur = true }) => {
  if (isPro) return children;
  return (
    <div style={{ position: "relative" }}>
      <div style={{ filter: blur ? "blur(5px)" : "none", pointerEvents: "none", userSelect: "none", opacity: blur ? 0.45 : 1 }}>
        {children}
      </div>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "rgba(4,9,15,0.75)", borderRadius: 16, backdropFilter: "blur(4px)", zIndex: 5 }}>
        <div style={{ background: T.surface, border: `1px solid ${T.gold}`, borderRadius: 16, padding: "28px 32px", textAlign: "center", maxWidth: 380, boxShadow: `0 20px 60px rgba(0,0,0,0.5), 0 0 30px ${T.gold}18` }}>
          <div style={{ width: 48, height: 48, borderRadius: "50%", background: `linear-gradient(135deg, ${T.gold}22, ${T.gold}08)`, border: `1px solid ${T.gold}40`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, margin: "0 auto 12px" }}>🔒</div>
          <div style={{ fontFamily: "'Fraunces', serif", fontSize: 17, fontWeight: 800, color: T.white, marginBottom: 6 }}>{message}</div>
          <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 16, lineHeight: 1.6 }}>Join 500+ investors using DXB Analytics Pro to track the Dubai real estate market</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 18 }}>
            {["All 48+ active projects", "Full financials & yields", "ROI & mortgage calculator", "Currency converter", "Portfolio tracker"].map((f, i) => (
              <div key={i} style={{ fontSize: 11, color: T.textSecondary, textAlign: "left", paddingLeft: 4 }}>✓ {f}</div>
            ))}
          </div>
          <button type="button" onClick={onUpgrade} style={{ width: "100%", padding: "11px 0", background: `linear-gradient(135deg, ${T.gold}, #B8912F)`, color: T.bg, border: "none", borderRadius: 10, fontSize: 13, fontWeight: 800, cursor: "pointer", fontFamily: "'Outfit', sans-serif", letterSpacing: 0.3 }}>
            Unlock Pro — AED 99/mo →
          </button>
          <div style={{ fontSize: 10, color: T.textMuted, marginTop: 8 }}>7-day money-back guarantee · Cancel anytime</div>
        </div>
      </div>
    </div>
  );
};

/* ─── UPGRADE MODAL ─── */
const UpgradeModal = ({ show, onClose }) => {
  if (!show) return null;
  const plans = [
    { name: "Enterprise", price: "499", period: "month", features: ["Everything in Pro", "PDF report generation ⏳", "API data access ⏳", "Custom dashboards ⏳", "Multi-user team accounts ⏳", "Developer-level raw data", "Dedicated account manager", "White-label options ⏳"], popular: false, note: "⏳ = Launching Q3 2026", cta: "Contact Sales →" },
  ];
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(4,9,15,0.92)", zIndex: 3000, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(12px)", padding: 16 }} onClick={onClose}>
      <div style={{ background: T.surface, borderRadius: 24, border: `1px solid ${T.border}`, width: "95%", maxWidth: 720, padding: 36, position: "relative", boxShadow: "0 40px 100px rgba(0,0,0,0.6)" }} onClick={e => e.stopPropagation()}>
        <button type="button" onClick={onClose} style={{ position: "absolute", top: 16, right: 16, background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8, color: T.textMuted, width: 32, height: 32, cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "4px 14px", borderRadius: 20, background: "rgba(212,168,67,0.1)", border: `1px solid ${T.gold}40`, marginBottom: 12 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: T.green, animation: "pulse 2s infinite", display: "inline-block" }} />
            <span style={{ fontSize: 11, color: T.gold, fontWeight: 600 }}>500+ investors already using Pro</span>
          </div>
          <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 26, fontWeight: 900, color: T.white, marginBottom: 6 }}>Unlock the Full Platform</h2>
          <p style={{ color: T.textSecondary, fontSize: 13 }}>The most comprehensive Emaar & Dubai real estate intelligence platform</p>
        </div>

        {/* ROI bar */}
        <div style={{ background: "rgba(16,185,129,0.08)", border: `1px solid ${T.green}30`, borderRadius: 12, padding: "12px 20px", marginBottom: 24, display: "flex", alignItems: "center", justifyContent: "center", gap: 16, flexWrap: "wrap" }}>
          {[["📊", "AED 80.4B", "FY25 Sales tracked"], ["📈", "+40% YoY", "Revenue growth"], ["🏠", "48 Projects", "Full intelligence"], ["💰", "AED 155B", "Backlog visibility"]].map(([icon, val, label], i) => (
            <div key={i} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 13 }}>{icon} <span style={{ fontFamily: "'Fraunces', serif", fontWeight: 800, color: T.green }}>{val}</span></div>
              <div style={{ fontSize: 10, color: T.textMuted }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Plans */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
          {plans.map((plan, i) => (
            <div key={i} style={{ background: T.surfaceAlt, borderRadius: 16, padding: 24, border: plan.popular ? `2px solid ${T.gold}` : `1px solid ${T.border}`, position: "relative" }}>
              {plan.popular && <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", padding: "4px 16px", borderRadius: 20, background: `linear-gradient(135deg, ${T.gold}, #B8912F)`, color: T.bg, fontSize: 10, fontWeight: 800, letterSpacing: 0.5, whiteSpace: "nowrap" }}>⭐ MOST POPULAR</div>}
              <h3 style={{ fontSize: 18, fontWeight: 700, color: T.white, marginBottom: 4, marginTop: plan.popular ? 8 : 0 }}>{plan.name}</h3>
              <div style={{ display: "flex", alignItems: "baseline", gap: 3, marginBottom: 16 }}>
                <span style={{ fontSize: 11, color: T.textMuted }}>AED</span>
                <span style={{ fontFamily: "'Fraunces', serif", fontSize: 38, fontWeight: 900, color: plan.popular ? T.gold : T.white, lineHeight: 1 }}>{plan.price}</span>
                <span style={{ fontSize: 12, color: T.textMuted }}>/{plan.period}</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 16 }}>
                {plan.features.map((f, j) => (
                  <div key={j} style={{ display: "flex", alignItems: "flex-start", gap: 7, fontSize: 12, color: f.includes("⏳") ? T.textMuted : T.textSecondary }}>
                    <span style={{ color: f.includes("⏳") ? T.textMuted : T.green, fontSize: 11, marginTop: 1, flexShrink: 0 }}>✓</span>{f}
                  </div>
                ))}
              </div>
              {plan.note && <div style={{ fontSize: 10, color: T.textMuted, marginBottom: 12, fontStyle: "italic" }}>{plan.note}</div>}
              <button type="button" onClick={() => { onClose(); window.dispatchEvent(new CustomEvent("dxb-checkout", { detail: plan })); }}
                style={{ width: "100%", padding: "12px 0", background: plan.popular ? `linear-gradient(135deg, ${T.gold}, #B8912F)` : "transparent", color: plan.popular ? T.bg : T.gold, border: plan.popular ? "none" : `1px solid ${T.gold}`, borderRadius: 10, fontSize: 13, fontWeight: 800, cursor: "pointer", fontFamily: "'Outfit', sans-serif", letterSpacing: 0.3 }}>
                {plan.cta}
              </button>
            </div>
          ))}
        </div>

        <div style={{ textAlign: "center", display: "flex", justifyContent: "center", gap: 24, flexWrap: "wrap" }}>
          {["🔒 Secure payment", "↩ 7-day money-back", "⚡ Instant access", "❌ Cancel anytime"].map((t, i) => (
            <span key={i} style={{ fontSize: 11, color: T.textMuted }}>{t}</span>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ─── MAIN DASHBOARD ─── */
// Focus trap hook for modals
function useFocusTrap(active) {
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (!active || !ref.current) return;
    const el = ref.current;
    const focusable = el.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const handler = (e) => {
      if (e.key !== 'Tab') return;
      if (e.shiftKey) { if (document.activeElement === first) { e.preventDefault(); last?.focus(); } }
      else { if (document.activeElement === last) { e.preventDefault(); first?.focus(); } }
    };
    el.addEventListener('keydown', handler);
    first?.focus();
    return () => el.removeEventListener('keydown', handler);
  }, [active]);
  return ref;
}

/* ─── COMMUNITY MAP TAB COMPONENT ─── */
function CommunityMapTab({ activeProjects, liveCommunityROI, setTab }) {
  const [selectedProject, setSelectedProjectMap] = React.useState(null);
  const [filterComm, setFilterComm] = React.useState("All");
  const [filterYield, setFilterYield] = React.useState("All");
  const [mapLoaded, setMapLoaded] = React.useState(false);
  const mapRef = React.useRef(null);
  const mapInstanceRef = React.useRef(null);
  const markersRef = React.useRef([]);

  // Project coordinates (lat/lng for Dubai)
  const projectCoords = {
    "Creek Waters": [25.1876, 55.3344], "Creek Waters 2": [25.1890, 55.3360],
    "Creek Horizon": [25.1860, 55.3320], "Creek Beach": [25.1920, 55.3380],
    "Creek Palace": [25.1840, 55.3300], "Harbour Gate": [25.1950, 55.3400],
    "Address Harbour Point": [25.1930, 55.3390], "Creek Edge": [25.1870, 55.3350],
    "Dubai Hills": [25.1124, 55.2594], "Golf Grand": [25.1050, 55.2650],
    "Elvira": [25.1070, 55.2570], "Lime Gardens": [25.1090, 55.2530],
    "Greenside": [25.1030, 55.2510], "Parkside Hills": [25.1000, 55.2480],
    "The Acres": [24.9800, 55.2000], "The Oasis": [25.0200, 55.1800],
    "Emaar South": [24.8980, 55.1640], "Greenview": [24.9000, 55.1660],
    "Urbana": [24.8950, 55.1600], "Expo Golf Villas": [24.8900, 55.1580],
    "Emaar Beachfront": [25.0780, 55.1340], "Address Beach Resort": [25.0800, 55.1360],
    "Marina Shores": [25.0760, 55.1320], "Beach Mansion": [25.0820, 55.1380],
    "Grand Polo Club": [24.8500, 55.4200], "The Valley": [25.0000, 55.5000],
    "Sunridge": [25.0100, 55.5100], "Farm Gardens": [25.0050, 55.4950],
    "Alana": [25.0080, 55.5050], "Orania": [24.9950, 55.4900],
    "Downtown Dubai": [25.1972, 55.2744], "The Grand": [25.1950, 55.2720],
    "Palace Residences": [25.1990, 55.2760], "IL Primo": [25.1960, 55.2730],
    "Act One Act Two": [25.1980, 55.2750], "Forte": [25.1940, 55.2710],
    "Opera District": [25.1930, 55.2700], "Address Residences": [25.1970, 55.2740],
    "Business Bay": [25.1867, 55.2653], "The Crest": [25.1850, 55.2640],
    "Arabian Ranches": [25.0530, 55.2690], "Ruba": [25.0550, 55.2710],
    "Mudon": [25.0200, 55.2500], "Nima": [25.0220, 55.2520],
    "Rashid Yachts": [25.2200, 55.3100], "Elvire": [25.1080, 55.2560],
    "Park Lane": [25.1110, 55.2580], "Golf Place": [25.1060, 55.2620],
  };

  const getCoords = (project) => {
    // Exact match first
    if (projectCoords[project.name]) return projectCoords[project.name];
    // Community fallback coords
    const communityFallback = {
      "Dubai Creek Harbour": [25.1876, 55.3344],
      "Dubai Hills Estate": [25.1100, 55.2580],
      "Emaar South": [24.8980, 55.1640],
      "Emaar Beachfront": [25.0780, 55.1340],
      "Downtown Dubai": [25.1972, 55.2744],
      "Business Bay": [25.1867, 55.2653],
      "Arabian Ranches 3": [25.0530, 55.2690],
      "Mudon": [25.0200, 55.2500],
      "The Valley": [25.0000, 55.5000],
      "Grand Polo Club": [24.8500, 55.4200],
      "The Oasis": [25.0200, 55.1800],
      "Rashid Yachts & Marina": [25.2200, 55.3100],
    };
    return communityFallback[project.community] || [25.1972, 55.2744];
  };

  const getYield = (project) => {
    const roi = (liveCommunityROI && liveCommunityROI[project.community]) || {};
    const y = roi.grossYield;
    if (!y) return 6.5;
    if (typeof y === "object") return parseFloat(y.apt1 || y.apt2 || Object.values(y)[0]) || 6.5;
    return parseFloat(y) || 6.5;
  };

  const getPinColor = (project) => {
    const y = getYield(project);
    if (y >= 8) return "#10B981";
    if (y >= 6.5) return "#D4A843";
    if (y >= 5) return "#3B82F6";
    return "#94A3B8";
  };

  const communities = ["All", ...Array.from(new Set(activeProjects.map(p => p.community)))];
  const filteredProjects = activeProjects.filter(p => {
    const commOk = filterComm === "All" || p.community === filterComm;
    const y = getYield(p);
    const yieldOk = filterYield === "All" || (filterYield === "8%+" && y >= 8) || (filterYield === "6-8%" && y >= 6 && y < 8) || (filterYield === "<6%" && y < 6);
    return commOk && yieldOk;
  });

  // Load Leaflet dynamically
  React.useEffect(() => {
    if (mapLoaded || typeof window === "undefined") return;
    // Load Leaflet CSS
    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }
    // Load Leaflet JS
    if (!window.L) {
      const script = document.createElement("script");
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.onload = () => setMapLoaded(true);
      document.head.appendChild(script);
    } else {
      setMapLoaded(true);
    }
  }, []);

  // Init map after Leaflet loads
  React.useEffect(() => {
    if (!mapLoaded || !mapRef.current || mapInstanceRef.current) return;
    const L = window.L;
    const map = L.map(mapRef.current, { center: [25.1124, 55.2594], zoom: 11, zoomControl: true });
    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      attribution: "© OpenStreetMap © CARTO", maxZoom: 19,
    }).addTo(map);
    mapInstanceRef.current = map;
  }, [mapLoaded]);

  // Update markers when filters change
  React.useEffect(() => {
    if (!mapInstanceRef.current || !window.L) return;
    const L = window.L;
    const map = mapInstanceRef.current;
    // Clear old markers
    markersRef.current.forEach(m => map.removeLayer(m));
    markersRef.current = [];
    // Add new markers
    filteredProjects.forEach(p => {
      const coords = getCoords(p);
      const color = getPinColor(p);
      const y = getYield(p);
      const icon = L.divIcon({
        className: "",
        html: `<div style="width:12px;height:12px;border-radius:50%;background:\${color};border:2px solid rgba(255,255,255,0.8);box-shadow:0 0 8px \${color}88;cursor:pointer;"></div>`,
        iconSize: [12, 12], iconAnchor: [6, 6],
      });
      const marker = L.marker(coords, { icon })
        .addTo(map)
        .bindPopup(`<div style="font-family:'Outfit',sans-serif;min-width:180px;background:#0D1821;color:#fff;border-radius:10px;padding:0;">
          <div style="background:linear-gradient(135deg,rgba(212,168,67,0.15),rgba(212,168,67,0.05));padding:12px 14px;border-radius:10px 10px 0 0;border-bottom:1px solid rgba(255,255,255,0.08);">
            <div style="font-size:13px;font-weight:700;color:#fff;margin-bottom:2px;">\${p.name}</div>
            <div style="font-size:10px;color:#94A3B8;">\${p.community}</div>
          </div>
          <div style="padding:10px 14px;display:grid;grid-template-columns:1fr 1fr;gap:6px;">
            <div><div style="font-size:9px;color:#94A3B8;text-transform:uppercase;">Price</div><div style="font-size:12px;font-weight:700;color:#D4A843;">\${p.price ? "AED " + (p.price/1e6).toFixed(2) + "M" : "TBC"}</div></div>
            <div><div style="font-size:9px;color:#94A3B8;text-transform:uppercase;">Yield</div><div style="font-size:12px;font-weight:700;color:\${color}">\${y.toFixed(1)}%</div></div>
            <div><div style="font-size:9px;color:#94A3B8;text-transform:uppercase;">Type</div><div style="font-size:11px;color:#CBD5E1;">\${p.type || "Residential"}</div></div>
            <div><div style="font-size:9px;color:#94A3B8;text-transform:uppercase;">Handover</div><div style="font-size:11px;color:#CBD5E1;">\${p.handover || "TBC"}</div></div>
          </div>
        </div>`, { className: "dxb-popup" });
      marker.on("click", () => setSelectedProjectMap(p));
      markersRef.current.push(marker);
    });
  }, [mapLoaded, filteredProjects.length, filterComm, filterYield]);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ fontSize: 11, color: T.textMuted, fontWeight: 600 }}>FILTER:</div>
        <select value={filterComm} onChange={e => setFilterComm(e.target.value)} style={{ padding: "6px 12px", background: T.surfaceAlt, border: "1px solid " + T.border, borderRadius: 8, color: T.white, fontSize: 11, fontFamily: "'Outfit',sans-serif", cursor: "pointer" }}>
          {communities.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <div style={{ display: "flex", gap: 6 }}>
          {["All", "8%+", "6-8%", "<6%"].map(f => (
            <button key={f} type="button" onClick={() => setFilterYield(f)} style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid " + (filterYield === f ? T.gold : T.border), background: filterYield === f ? "rgba(212,168,67,0.15)" : T.surfaceAlt, color: filterYield === f ? T.gold : T.textSecondary, fontSize: 11, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>{f === "All" ? "All Yields" : f + " yield"}</button>
          ))}
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 10, alignItems: "center" }}>
          {[["#10B981", "8%+ yield"], ["#D4A843", "6-8% yield"], ["#3B82F6", "5-6% yield"], ["#94A3B8", "<5% yield"]].map(([col, label]) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: col, boxShadow: "0 0 6px " + col + "88" }} />
              <span style={{ fontSize: 10, color: T.textMuted }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Map + sidebar */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 16, height: 560 }}>

        {/* Map */}
        <div style={{ borderRadius: 16, overflow: "hidden", border: "1px solid " + T.border, position: "relative" }}>
          {!mapLoaded && (
            <div style={{ position: "absolute", inset: 0, background: T.surface, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12, zIndex: 10 }}>
              <div style={{ fontSize: 32 }}>&#x1F5FA;</div>
              <div style={{ fontSize: 13, color: T.textMuted }}>Loading map...</div>
            </div>
          )}
          <div ref={mapRef} style={{ width: "100%", height: "100%" }} />
          {/* Floating counter */}
          <div style={{ position: "absolute", bottom: 12, left: 12, background: "rgba(13,24,33,0.9)", backdropFilter: "blur(8px)", borderRadius: 8, padding: "6px 12px", border: "1px solid " + T.border, zIndex: 999, fontSize: 11, color: T.textSecondary }}>
            <span style={{ color: T.gold, fontWeight: 700 }}>{filteredProjects.length}</span> projects shown
          </div>
        </div>

        {/* Right sidebar */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, overflowY: "auto" }}>
          {selectedProject ? (
            <div style={{ background: T.surface, borderRadius: 14, border: "1px solid " + T.gold, padding: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                <div>
                  <div style={{ fontFamily: "'Fraunces',serif", fontSize: 15, fontWeight: 700, color: T.gold }}>{selectedProject.name}</div>
                  <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>{selectedProject.community}</div>
                </div>
                <button type="button" onClick={() => setSelectedProjectMap(null)} style={{ background: "none", border: "none", color: T.textMuted, cursor: "pointer", fontSize: 18 }}>×</button>
              </div>
              {selectedProject.imageUrl && <img src={selectedProject.imageUrl} alt="" style={{ width: "100%", height: 120, objectFit: "cover", borderRadius: 8, marginBottom: 12 }} onError={e => e.target.style.display="none"} />}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
                {[
                  ["Price", selectedProject.price ? "AED " + (selectedProject.price/1e6).toFixed(2) + "M" : "TBC", T.gold],
                  ["Yield", getYield(selectedProject).toFixed(1) + "%", getPinColor(selectedProject)],
                  ["Handover", selectedProject.handover || "TBC", T.teal],
                  ["Type", selectedProject.type || "Residential", T.textPrimary],
                ].map(([l, v, c]) => (
                  <div key={l} style={{ background: T.card, borderRadius: 8, padding: "10px 12px" }}>
                    <div style={{ fontSize: 9, color: T.textMuted, textTransform: "uppercase", marginBottom: 3 }}>{l}</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: c }}>{v}</div>
                  </div>
                ))}
              </div>
              <button type="button" onClick={() => setTab("Projects")} style={{ width: "100%", padding: "9px 0", background: "linear-gradient(135deg," + T.gold + ",#B8912F)", color: T.bg, border: "none", borderRadius: 8, fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>View Full Details →</button>
            </div>
          ) : (
            <div style={{ background: T.surface, borderRadius: 14, border: "1px solid " + T.border, padding: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.white, marginBottom: 4 }}>Click any pin on the map</div>
              <div style={{ fontSize: 11, color: T.textMuted }}>to see project details here</div>
            </div>
          )}

          {/* Project list */}
          <div style={{ background: T.surface, borderRadius: 14, border: "1px solid " + T.border, padding: 14, flex: 1, overflowY: "auto" }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: T.goldLight, letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>All Projects ({filteredProjects.length})</div>
            {filteredProjects.map(p => (
              <div key={p.id} onClick={() => { setSelectedProjectMap(p); const coords = getCoords(p); if (mapInstanceRef.current) mapInstanceRef.current.setView(coords, 14, { animate: true }); }} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 10px", borderRadius: 8, marginBottom: 4, cursor: "pointer", background: selectedProject?.id === p.id ? "rgba(212,168,67,0.1)" : "transparent", border: "1px solid " + (selectedProject?.id === p.id ? T.gold : "transparent"), transition: "all 0.15s" }}
                onMouseEnter={e => e.currentTarget.style.background = T.surfaceAlt}
                onMouseLeave={e => e.currentTarget.style.background = selectedProject?.id === p.id ? "rgba(212,168,67,0.1)" : "transparent"}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: T.white }}>{p.name}</div>
                  <div style={{ fontSize: 10, color: T.textMuted }}>{p.community}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: getPinColor(p) }}>{getYield(p).toFixed(1)}%</div>
                  <div style={{ fontSize: 10, color: T.textMuted }}>{p.price ? (p.price/1e6).toFixed(1) + "M" : "TBC"}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Popup CSS */}
      <style>{".dxb-popup .leaflet-popup-content-wrapper { background: #0D1821; border: 1px solid rgba(212,168,67,0.3); border-radius: 12px; padding: 0; box-shadow: 0 20px 60px rgba(0,0,0,0.6); } .dxb-popup .leaflet-popup-content { margin: 0; } .dxb-popup .leaflet-popup-tip { background: #0D1821; } .leaflet-container { background: #0D1821; }"}</style>
    </div>
  );
}

export default function EmaarDashboardV2() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState("");
  const [userName, setUserName] = useState("");
  const [userTier, setUserTier] = useState("free");
  const [trialDaysLeft, setTrialDaysLeft] = useState(0);
  const [showLogin, setShowLogin] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [profileEdit, setProfileEdit] = useState({ name: "" });
  const [showCheckout, setShowCheckout] = useState(null);
  const [checkoutStep, setCheckoutStep] = useState(1);
  const [myPortfolio, setMyPortfolio] = useState([]);
  const [showAddPortfolio, setShowAddPortfolio] = useState(null);
  const [portfolioForm, setPortfolioForm] = useState({ units: 1, investedAmount: "", purchaseDate: "", unitType: "1BR", notes: "" });
  const [editHoldingIdx, setEditHoldingIdx] = React.useState(null);

  // Watchlist
  const [watchlist, setWatchlist] = useState([]);
  const [showWatchlist, setShowWatchlist] = useState(false);

  // Notifications
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Price Alerts
  const [myAlerts, setMyAlerts] = React.useState([]);
  const [showSetAlert, setShowSetAlert] = React.useState(null);
  const [alertForm, setAlertForm] = React.useState({ type: "price_below", value: "" });

  // Onboarding
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);

  useEffect(() => {
    const handler = (e) => { setShowCheckout(e.detail); setCheckoutStep(1); };
    window.addEventListener("dxb-checkout", handler);
    return () => window.removeEventListener("dxb-checkout", handler);
  }, []);
  const [toast, setToast] = useState("");
  const notify = (msg) => { setToast(msg); setTimeout(() => setToast(""), 3000); };
  const [adminUsers, setAdminUsers] = useState([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const fetchAdminUsersRef = useRef(null);

  // Tier access helper
  const isPro = userTier === "admin" || userTier === "pro" || userTier === "pro_trial" || userTier === "enterprise";

  // Upgrade overlay for locked content
  const UpgradeOverlay = ({ message, compact }) => (
    <div style={{ position: "absolute", inset: 0, background: "rgba(4,9,15,0.85)", backdropFilter: "blur(8px)", borderRadius: "inherit", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 5, flexDirection: "column", gap: compact ? 8 : 12 }}>
      <div style={{ fontSize: compact ? 20 : 28 }}>🔒</div>
      <div style={{ fontSize: compact ? 12 : 14, fontWeight: 600, color: T.white, textAlign: "center", maxWidth: 220 }}>{message || "Pro Feature"}</div>
      <button type="button" onClick={() => setShowUpgrade(true)} style={{ padding: compact ? "6px 14px" : "8px 20px", borderRadius: 8, background: T.gold, color: T.bg, border: "none", fontSize: compact ? 11 : 12, fontWeight: 700, fontFamily: "'Outfit', sans-serif", cursor: "pointer" }}>Upgrade to Pro</button>
    </div>
  );

  // Blur wrapper for free users
  // eslint-disable-next-line no-unused-vars
  const BlurGate = ({ children, locked, message, compact }) => (
    <div style={{ position: "relative" }}>
      <div style={locked ? { filter: "blur(6px)", pointerEvents: "none", userSelect: "none" } : {}}>
        {children}
      </div>
      {locked && <UpgradeOverlay message={message} compact={compact} />}
    </div>
  );
  const [tab, setTab] = useState(() => { try { return sessionStorage.getItem("dxb_active_tab") || "Overview"; } catch(e) { return "Overview"; } });
  const [selectedKPI, setSelectedKPI] = useState(null);
  const [breadcrumb, setBreadcrumb] = useState([]); // [{label, action}]
  const [projectPage, setProjectPage] = useState(1);
  const PROJECTS_PER_PAGE = 12;
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [time, setTime] = useState(new Date());
  const [authLoading, setAuthLoading] = useState(true);

  // Set page title
  useEffect(() => { document.title = "DXB Analytics — Dubai Real Estate Intelligence Platform"; }, []);
  const [projectSearch, setProjectSearch] = useState("");
  const [projectFilter, setProjectFilter] = useState("All");
  const [projectTier, setProjectTier] = useState("All");
  const [projectHandover, setProjectHandover] = useState("All");
  const [projectPriceMax, setProjectPriceMax] = useState(20);
  const [liveProjects, setLiveProjects] = useState({});
  const [extraProjects, setExtraProjects] = useState([]);
  const [liveYields, setLiveYields] = useState([]);
  const [liveCommunityROI, setLiveCommunityROI] = useState({});
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedCommunity, setSelectedCommunity] = useState(null);
  const [expandedMega, setExpandedMega] = useState(null);
  const [compareList, setCompareList] = useState([]);
  const [showCompare, setShowCompare] = useState(false);

  // Load projects from Firestore (runs for ALL users — guests and logged-in)
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const globalRefresh = () => {
    setIsRefreshing(true);
    try { sessionStorage.setItem("dxb_active_tab", tab); } catch(e) {}
    setTimeout(() => { window.location.reload(); }, 300);
  };

  useEffect(() => {
    const loadProjects = async () => {
      setProjectsLoading(true);
      try {
        // Read from "projectData" (edits to existing) AND "projects" (new projects from admin)
        const [pdSnap, npSnap, yieldSnap, roiSnap] = await Promise.all([
          getDocs(collection(db, "projectData")),
          getDocs(collection(db, "projects")),
          getDocs(collection(db, "yieldData")),
          getDocs(collection(db, "communityROI")),
        ]);
        const overrides = {};
        pdSnap.forEach(d => {
          const numId = d.id.replace("project_", "");
          overrides[numId] = d.data();
        });
        setLiveProjects(overrides);
        const baseIds = new Set(emaarProjects.map(p => String(p.id)));
        // Extra projects from projectData overrides that aren't base projects
        const extraFromOverrides = Object.entries(overrides).filter(([id]) => !baseIds.has(id)).map(([id, data]) => ({ id, ...data }));
        // Brand new projects added via admin "Add Project" button (saved to "projects" collection)
        const extraFromNew = [];
        npSnap.forEach(d => {
          const data = { ...d.data(), id: d.id };
          if (!baseIds.has(String(d.id))) extraFromNew.push(data);
        });
        // Merge, deduplicate by id
        const seen = new Set(extraFromOverrides.map(p => String(p.id)));
        const combined = [...extraFromOverrides, ...extraFromNew.filter(p => !seen.has(String(p.id)))];
        setExtraProjects(combined);

        // Load live yield data (merges with static emaarYields)
        if (yieldSnap.size > 0) {
          const yieldOverrides = {};
          yieldSnap.forEach(d => { yieldOverrides[d.id] = d.data(); });
          const mergedYields = emaarYields.map(y => {
            const key = `${y.community}_${y.unit}`;
            const ov = yieldOverrides[key];
            return ov ? { ...y, ...ov } : y;
          }).map(y => ({ label: y.unit, community: y.community, rent: (y.rent||0)/1000, price: (y.price||0)/1000, gross: y.gross, net: y.net, demand: y.demand === "Very High" ? "V.High" : y.demand === "Moderate-High" ? "High" : y.demand, visa: y.visa }));
          setLiveYields(mergedYields);
        }

        // Load live communityROI (merges with static)
        if (roiSnap.size > 0) {
          const roiOverrides = {};
          roiSnap.forEach(d => { roiOverrides[d.id] = d.data(); });
          setLiveCommunityROI(roiOverrides);
        }
      } catch (e) { console.log("Firestore not available, using static data"); }
      setProjectsLoading(false);
    };
    loadProjects(); // Load for everyone — no isLoggedIn gate
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Use merged Firestore+static data if available, otherwise pure static fallback
  const activeProjects = [...emaarProjects.map(p => { const ov = liveProjects[String(p.id)] || liveProjects["project_"+p.id]; return ov ? { ...p, ...ov } : p; }), ...extraProjects];

  // Normalize units from either Object ({studio:{total,sold}}) or Array ([{type,available,total}]) format
  const getUnitEntries = (units) => {
    if (!units) return [];
    if (Array.isArray(units)) {
      return units.filter(u => u && (u.total || 0) > 0).map(u => [u.type || "Unit", { total: u.total || 0, sold: (u.total || 0) - (u.available || 0) }]);
    }
    return Object.entries(units).filter(([, d]) => d && d.total > 0);
  };

  const whatsappLink = (projectName, community) => 
    `https://wa.me/971542410599?text=${encodeURIComponent(`Hi Mian Waleed, I'm interested in *${projectName}* at ${community}. Could you share more details?`)}`;

  const toggleCompare = (p) => {
    setCompareList(prev => {
      const exists = prev.find(x => x.id === p.id);
      if (exists) {
        notify("Removed " + p.name + " from comparison");
        return prev.filter(x => x.id !== p.id);
      }
      if (prev.length >= 3) {
        notify("\u26A0\uFE0F Max 3 projects for comparison");
        return prev;
      }
      notify("\u2705 Added " + p.name + " to comparison");
      return [...prev, p];
    });
  };

  // Listen to Firebase auth state + fetch user profile
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setIsLoggedIn(true);
        setUser(firebaseUser.email || "");
        // Fetch user profile from Firestore
        try {
          const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setUserName(data.name || "");
            let tier = data.tier || "free";
            // Check if trial has expired
            if (tier === "pro_trial" && data.trialEnd) {
              const trialEnd = new Date(data.trialEnd);
              const now = new Date();
              const daysLeft = Math.ceil((trialEnd - now) / (1000 * 60 * 60 * 24));
              if (daysLeft <= 0) {
                tier = "free";
                setTrialDaysLeft(0);
                await setDoc(doc(db, "users", firebaseUser.uid), { tier: "free" }, { merge: true });
                // Send trial expired email (once only)
                if (!data.emailSent_trialExpired) {
                  try {
                    await emailjs.send("service_da7nshv", "template_gl1xqhy", {
                      user_email: firebaseUser.email, user_name: data.name || firebaseUser.email.split("@")[0],
                      project_name: "DXB Analytics Platform",
                      change_type: "⏰ Your Pro Trial Has Expired",
                      new_value: "Your 7-day trial has ended. Upgrade now to keep full access to 48+ projects, yield data, ROI tools and more.",
                      old_value: "Pro Trial", updated_at: new Date().toLocaleDateString("en-AE"),
                    }, "USkwUhp0csGCVDkdQ");
                    await setDoc(doc(db, "users", firebaseUser.uid), { emailSent_trialExpired: true }, { merge: true });
                  } catch(e) {}
                }
              } else {
                setTrialDaysLeft(daysLeft);
                // Send 3-day warning email (once only)
                if (daysLeft <= 3 && !data.emailSent_trial3d) {
                  try {
                    await emailjs.send("service_da7nshv", "template_gl1xqhy", {
                      user_email: firebaseUser.email, user_name: data.name || firebaseUser.email.split("@")[0],
                      project_name: "DXB Analytics Platform",
                      change_type: `⚠️ Your Trial Expires in ${daysLeft} Day${daysLeft !== 1 ? "s" : ""}`,
                      new_value: `Only ${daysLeft} day${daysLeft !== 1 ? "s" : ""} left on your Pro trial. Don't lose access — upgrade now to keep all features.`,
                      old_value: "Pro Trial Active", updated_at: new Date().toLocaleDateString("en-AE"),
                    }, "USkwUhp0csGCVDkdQ");
                    await setDoc(doc(db, "users", firebaseUser.uid), { emailSent_trial3d: true }, { merge: true });
                  } catch(e) {}
                }
                // Send 1-day urgent warning (once only)
                if (daysLeft <= 1 && !data.emailSent_trial1d) {
                  try {
                    await emailjs.send("service_da7nshv", "template_gl1xqhy", {
                      user_email: firebaseUser.email, user_name: data.name || firebaseUser.email.split("@")[0],
                      project_name: "DXB Analytics Platform",
                      change_type: "🚨 Last Day of Your Pro Trial!",
                      new_value: "Today is your last day. After midnight your account moves to Free and you lose access to 48 projects, community yields, ROI data and PDF reports.",
                      old_value: "Pro Trial — Final Day", updated_at: new Date().toLocaleDateString("en-AE"),
                    }, "USkwUhp0csGCVDkdQ");
                    await setDoc(doc(db, "users", firebaseUser.uid), { emailSent_trial1d: true }, { merge: true });
                  } catch(e) {}
                }
              }
            }
            // Admin override — by role field OR by owner email
            if (data.role === "admin" || firebaseUser.email === "mianwaleed689@gmail.com") tier = "admin";
            setUserTier(tier);
          } else {
            // Existing user without profile (e.g. your admin account) — treat as admin/pro
            setUserTier("admin");
            setUserName("");
          }
        } catch (err) {
          console.log("Could not fetch user profile:", err);
          setUserTier("pro"); // fallback for existing users
        }
      } else {
        setIsLoggedIn(false);
        setUser("");
        setUserTier("free");
        setTrialDaysLeft(0);
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // PORTFOLIO FUNCTIONS
  useEffect(() => {
    if (!isLoggedIn || !auth.currentUser) return;
    const loadPortfolio = async () => {
      try {
        const snap = await getDoc(doc(db, "portfolios", auth.currentUser.uid));
        if (snap.exists()) setMyPortfolio(snap.data().holdings || []);
      } catch (e) { console.log("Portfolio load error:", e); }
    };
    loadPortfolio();
  }, [isLoggedIn]);

  // WATCHLIST FUNCTIONS
  useEffect(() => {
    if (!isLoggedIn || !auth.currentUser) return;
    const loadWatchlist = async () => {
      try {
        const snap = await getDoc(doc(db, "watchlists", auth.currentUser.uid));
        if (snap.exists()) setWatchlist(snap.data().projects || []);
      } catch (e) { console.log("Watchlist load error:", e); }
    };
    loadWatchlist();
  }, [isLoggedIn]);

  const toggleWatchlist = async (project) => {
    if (!isLoggedIn) { setShowLogin("login"); return; }
    const isWatched = watchlist.find(p => p.id === project.id);
    const updated = isWatched ? watchlist.filter(p => p.id !== project.id) : [...watchlist, { id: project.id, name: project.name, community: project.community, price: project.price, addedAt: new Date().toISOString() }];
    setWatchlist(updated);
    if (auth.currentUser) {
      try { await setDoc(doc(db, "watchlists", auth.currentUser.uid), { projects: updated, updatedAt: new Date().toISOString() }); } catch (e) {}
    }
    notify(isWatched ? `Removed ${project.name} from watchlist` : `⭐ ${project.name} added to watchlist`);
  };

  // PRICE ALERTS - Load from Firestore
  React.useEffect(() => {
    if (!isLoggedIn || !auth.currentUser) return;
    getDoc(doc(db, "priceAlerts", auth.currentUser.uid)).then(snap => {
      if (snap.exists()) setMyAlerts(snap.data().alerts || []);
    }).catch(() => {});
  }, [isLoggedIn]);

  const saveAlerts = async (alerts) => {
    setMyAlerts(alerts);
    if (auth.currentUser) {
      try { await setDoc(doc(db, "priceAlerts", auth.currentUser.uid), { alerts, updatedAt: new Date().toISOString() }); } catch(e) {}
    }
  };

  const addAlert = () => {
    if (!showSetAlert || !alertForm.value) return;
    const p = showSetAlert;
    const newAlert = { id: Date.now().toString(), projectId: p.id, projectName: p.name, community: p.community, type: alertForm.type, value: Number(alertForm.value), createdAt: new Date().toISOString(), triggered: false };
    saveAlerts([...myAlerts, newAlert]);
    setShowSetAlert(null);
    setAlertForm({ type: "price_below", value: "" });
    notify("Alert set for " + p.name);
  };

  const removeAlert = (id) => { saveAlerts(myAlerts.filter(a => a.id !== id)); notify("Alert removed"); };

  // Check alerts vs live data on load
  React.useEffect(() => {
    if (!myAlerts.length || !activeProjects.length) return;
    const hits = myAlerts.filter(a => {
      if (a.triggered) return false;
      const p = activeProjects.find(x => x.id === a.projectId);
      if (!p) return false;
      const comm = emaarCommunities.find(c => c.name === p.community);
      if (a.type === "price_below" && p.price && p.price <= a.value) return true;
      if (a.type === "price_above" && p.price && p.price >= a.value) return true;
      if (a.type === "yield_above" && comm && comm.avgYield >= a.value) return true;
      if (a.type === "construction_above" && p.construction >= a.value) return true;
      return false;
    });
    if (hits.length) {
      saveAlerts(myAlerts.map(a => hits.find(h => h.id === a.id) ? { ...a, triggered: true } : a));
      hits.forEach(a => notify("Alert triggered: " + a.projectName));
    }
  }, [myAlerts, activeProjects]);

  // NOTIFICATIONS
  useEffect(() => {
    if (!isLoggedIn || !auth.currentUser) return;
    const loadNotifications = async () => {
      try {
        const snap = await getDocs(collection(db, "notifications"));
        const userNotifs = [];
        snap.forEach(d => {
          const data = d.data();
          if (data.userId === auth.currentUser.uid || data.userId === "all") {
            userNotifs.push({ id: d.id, ...data });
          }
        });
        userNotifs.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        setNotifications(userNotifs.slice(0, 20));
        setUnreadCount(userNotifs.filter(n => !n.read).length);
      } catch (e) {}
    };
    loadNotifications();
  }, [isLoggedIn]);

  const markNotifRead = async (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
    try { await setDoc(doc(db, "notifications", id), { read: true }, { merge: true }); } catch (e) {}
  };

  // ONBOARDING - show for new users on first login
  useEffect(() => {
    if (isLoggedIn && userName !== undefined) {
      const key = `dxb_onboarded_${user}`;
      if (!localStorage.getItem(key)) {
        setTimeout(() => setShowOnboarding(true), 1000);
      }
    }
  }, [isLoggedIn]); // eslint-disable-line react-hooks/exhaustive-deps

  const completeOnboarding = () => {
    localStorage.setItem(`dxb_onboarded_${user}`, "1");
    setShowOnboarding(false);
  };

  const savePortfolio = async (holdings) => {
    setMyPortfolio(holdings);
    if (auth.currentUser) {
      try { await setDoc(doc(db, "portfolios", auth.currentUser.uid), { holdings, updatedAt: new Date().toISOString() }); } catch (e) { console.log("Portfolio save error:", e); }
    }
  };

  const addToPortfolio = () => {
    if (!showAddPortfolio || !portfolioForm.investedAmount) return;
    const existing = myPortfolio.find(h => h.projectId === showAddPortfolio.id && h.unitType === portfolioForm.unitType);
    let updated;
    if (existing) {
      updated = myPortfolio.map(h => h.projectId === showAddPortfolio.id && h.unitType === portfolioForm.unitType ? { ...h, units: h.units + portfolioForm.units, investedAmount: h.investedAmount + Number(portfolioForm.investedAmount) } : h);
    } else {
      updated = [...myPortfolio, { projectId: showAddPortfolio.id, units: portfolioForm.units, investedAmount: Number(portfolioForm.investedAmount), purchaseDate: portfolioForm.purchaseDate || new Date().toISOString().slice(0,10), unitType: portfolioForm.unitType, notes: portfolioForm.notes }];
    }
    savePortfolio(updated);
    setShowAddPortfolio(null);
    setPortfolioForm({ units: 1, investedAmount: "", purchaseDate: "", unitType: "1BR", notes: "" });
    notify("\u2705 Added to portfolio!");
  };

  const removeFromPortfolio = (pid, ut) => {
    savePortfolio(myPortfolio.filter(h => !(h.projectId === pid && h.unitType === ut)));
    notify("Removed from portfolio");
  };


  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  // FIX #28: Close modals on Escape key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") {
        if (showCheckout) { setShowCheckout(null); setCheckoutStep(1); }
        else if (showProfile) setShowProfile(false);
        else if (showUpgrade) setShowUpgrade(false);
        else if (showNotifications) setShowNotifications(false);
        else if (showWatchlist) setShowWatchlist(false);
        else if (selectedProject) setSelectedProject(null);
        else if (showCompare) setShowCompare(false);
        else if (selectedKPI) setSelectedKPI(null);
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [showUpgrade, selectedProject, showCompare, showCheckout, showProfile, selectedKPI]); // eslint-disable-line react-hooks/exhaustive-deps

  if (authLoading) {
    return (
      <div style={{ minHeight: "100vh", background: T.bg, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
        <style>{css}</style>
        <svg width="40" height="40" viewBox="0 0 40 40">
          <rect x="2" y="2" width="36" height="36" rx="8" fill="none" stroke={T.gold} strokeWidth="2" />
          <path d="M12 28V12h10l-6 8h8l-12 8z" fill={T.gold} />
        </svg>
        <div style={{ color: T.gold, fontFamily: "'Fraunces', serif", fontSize: 18, fontWeight: 700 }}>DXB Analytics</div>
        <div style={{ width: 24, height: 24, border: `2px solid ${T.border}`, borderTopColor: T.gold, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      </div>
    );
  }

  if (!isLoggedIn && !showLogin) {
    return <LandingPage onLoginClick={() => setShowLogin("login")} onSignUpClick={() => setShowLogin("signup")} />;
  }

  if (!isLoggedIn) {
    return <LoginScreen onLogin={() => {}} onBack={() => setShowLogin(false)} defaultMode={showLogin === "signup" ? "signup" : "login"} />;
  }

  if (!fetchAdminUsersRef.current) {
    fetchAdminUsersRef.current = async () => {
      setAdminLoading(true);
      try {
        const snap = await getDocs(collection(db, "users"));
        const users = [];
        snap.forEach(d => {
          const data = d.data();
          let status = data.tier || "free";
          let daysLeft = 0;
          if (status === "pro_trial" && data.trialEnd) {
            const end = new Date(data.trialEnd);
            daysLeft = Math.ceil((end - new Date()) / (1000 * 60 * 60 * 24));
            if (daysLeft <= 0) { status = "expired"; daysLeft = 0; }
          }
          users.push({ id: d.id, ...data, status, daysLeft });
        });
        users.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        setAdminUsers(users);
      } catch (err) {
        console.log("Failed to fetch users:", err);
      }
      setAdminLoading(false);
    };
  }
  const fetchAdminUsers = fetchAdminUsersRef.current;

  const handleChangeTier = async (userId, newTier) => {
    const u = adminUsers.find(u => u.id === userId);
    const uName = u ? (u.name || u.email) : userId;
    const uEmail = u?.email || "";
    if (!window.confirm(`Change ${uName} to "${newTier}"?`)) return;
    try {
      const now = new Date();
      const data = { tier: newTier };
      if (newTier === "pro_trial") { const end = new Date(); end.setDate(end.getDate() + 7); data.trialEnd = end.toISOString(); }
      await setDoc(doc(db, "users", userId), data, { merge: true });
      setAdminUsers(prev => prev.map(u => u.id === userId ? { ...u, tier: newTier, status: newTier } : u));
      notify(`✅ ${uName} → ${newTier}`);
      // Send tier change confirmation email
      const tierMessages = {
        free: { subject: "Your DXB Analytics plan has changed to Free", body: "Your account has been updated to the Free plan. You have access to 5 featured projects and basic market data." },
        pro_trial: { subject: "Your 7-Day Pro Trial has been activated!", body: "Great news! Your Pro Trial has been activated. You now have full access to 48+ projects, community yields, ROI calculator, PDF reports and all Pro features for 7 days." },
        pro: { subject: "Welcome to DXB Analytics Pro! ⭐", body: "Your account has been upgraded to the Pro Plan. You now have unlimited access to all 48+ projects, live yield data, ROI analysis, investment reports, and all Pro features." },
        enterprise: { subject: "Welcome to DXB Analytics Enterprise! 🏢", body: "Your account has been upgraded to Enterprise. You have access to all platform features including custom reports, priority support, and full data access." },
      };
      const msg = tierMessages[newTier] || { subject: `Your plan changed to ${newTier}`, body: `Your DXB Analytics plan has been updated to ${newTier}.` };
      if (uEmail) {
        try {
          await emailjs.send("service_da7nshv", "template_gl1xqhy", {
            user_email: uEmail, user_name: uName,
            project_name: "DXB Analytics Platform",
            change_type: msg.subject,
            new_value: msg.body,
            old_value: u?.tier || "free",
            updated_at: now.toLocaleDateString("en-AE"),
          }, "USkwUhp0csGCVDkdQ");
        } catch(e) {}
      }
    } catch (err) {
      notify("❌ Failed to update tier");
    }
  };

  const handleTabChange = (key) => {
    sessionStorage.removeItem("dxb_active_tab");
    setTab(key);
    setSidebarOpen(false);
    if (key === "Admin" && userTier === "admin") fetchAdminUsers();
    window.scrollTo({ top: 0, behavior: "smooth" });
    const mainEl = document.querySelector(".main-content");
    if (mainEl) mainEl.scrollTop = 0;
  };

  return (
    <div style={{ minHeight: "100vh", background: T.bg, fontFamily: "'Outfit', sans-serif" }}>
      <style>{css}</style>

      {/* Skip to content - accessibility */}
      <a href="#main-content" style={{ position: "absolute", top: -40, left: 0, background: T.gold, color: T.bg, padding: "8px 16px", borderRadius: "0 0 8px 0", fontWeight: 700, fontSize: 13, zIndex: 99999, transition: "top 0.2s" }} onFocus={e => e.target.style.top = "0"} onBlur={e => e.target.style.top = "-40px"}>Skip to content</a>

      {/* Toast notification */}
      {toast && <div className="fade-up" style={{ position: "fixed", bottom: 24, right: 24, padding: "12px 24px", borderRadius: 10, background: toast.includes("✅") ? T.green : toast.includes("❌") ? T.red : T.gold, color: "#fff", fontWeight: 700, fontSize: 13, zIndex: 9999, boxShadow: "0 12px 40px rgba(0,0,0,0.4)", fontFamily: "'Outfit', sans-serif" }}>{toast}</div>}

      {/* Mobile overlay */}
      <div className={`mobile-overlay ${sidebarOpen ? "open" : ""}`} onClick={() => setSidebarOpen(false)} />

      {/* ─── SIDEBAR ─── */}
      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`} style={{
        position: "fixed", top: 0, left: 0, bottom: 0, width: 240,
        background: T.surface, borderRight: `1px solid ${T.border}`,
        display: "flex", flexDirection: "column", zIndex: 100,
        transition: "transform 0.3s ease",
      }}>
        {/* Logo */}
        <div style={{ padding: "24px 20px 20px", borderBottom: `1px solid ${T.border}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <svg width="32" height="32" viewBox="0 0 40 40">
              <rect x="2" y="2" width="36" height="36" rx="8" fill="none" stroke={T.gold} strokeWidth="2" />
              <path d="M12 28V12h10l-6 8h8l-12 8z" fill={T.gold} />
            </svg>
            <div>
              <div style={{ fontFamily: "'Fraunces', serif", fontSize: 16, fontWeight: 800, color: T.gold }}>DXB Analytics</div>
              <div style={{ fontSize: 9, color: T.textMuted, letterSpacing: 1.5, textTransform: "uppercase" }}>Intelligence Platform</div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav role="navigation" aria-label="Main navigation" style={{ flex: 1, padding: "16px 12px", display: "flex", flexDirection: "column", gap: 3 }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: T.textMuted, letterSpacing: 1.5, textTransform: "uppercase", padding: "0 16px 8px" }}>Emaar Properties</div>
          <div role="tablist" aria-label="Dashboard sections" style={{ display: "contents" }}>
          {TABS.map(t => (
            <button type="button" role="tab" aria-selected={tab === t.key} key={t.key} className={`sidebar-btn ${tab === t.key ? "active" : ""}`} onClick={() => handleTabChange(t.key)}>
              {t.icon}
              {t.key}
            </button>
          ))}
          </div>
          {userTier === "admin" && (
            <>
              <div style={{ fontSize: 9, fontWeight: 700, color: T.textMuted, letterSpacing: 1.5, textTransform: "uppercase", padding: "16px 16px 8px", marginTop: 8, borderTop: `1px solid ${T.border}` }}>Admin</div>
              <button type="button" className={`sidebar-btn ${tab === "Admin" ? "active" : ""}`} onClick={() => window.location.href = "/admin"}>
                {Icons.admin}
                Admin Panel
              </button>
            </>
          )}
        </nav>

        {/* Bottom */}
        <div style={{ padding: "16px 12px", borderTop: `1px solid ${T.border}` }}>
          {/* Trial Banner */}
          {userTier === "pro_trial" && trialDaysLeft > 0 && (
            <div style={{ marginBottom: 8, padding: "8px 12px", borderRadius: 8, background: "rgba(212,168,67,0.08)", border: `1px solid ${T.border}`, textAlign: "center" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: T.gold, letterSpacing: 0.5 }}>⭐ PRO TRIAL</div>
              <div style={{ fontSize: 11, color: T.textSecondary, marginTop: 2 }}>{trialDaysLeft} day{trialDaysLeft !== 1 ? "s" : ""} remaining</div>
            </div>
          )}
          {userTier === "free" && (
            <div role="button" tabIndex={0} onKeyDown={e => { if (e.key === "Enter" || e.key === " ") setShowUpgrade(true); }} onClick={() => setShowUpgrade(true)} style={{ marginBottom: 8, padding: "8px 12px", borderRadius: 8, background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.15)", textAlign: "center", cursor: "pointer" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: T.blue, letterSpacing: 0.5 }}>FREE PLAN</div>
              <div style={{ fontSize: 11, color: T.textSecondary, marginTop: 2 }}>Upgrade to Pro →</div>
            </div>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 10, background: T.surfaceAlt }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: `linear-gradient(135deg, ${T.gold}, #B8912F)`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13, color: T.bg }}>
              {user.charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.white, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{userName || user.split("@")[0]}</div>
              <div style={{ fontSize: 10, color: userTier === "pro_trial" ? T.gold : userTier === "admin" || userTier === "pro" || userTier === "enterprise" ? T.green : T.textMuted }}>
                {userTier === "admin" ? "Admin" : userTier === "pro_trial" ? "Pro Trial" : userTier === "pro" ? "Pro Plan" : userTier === "enterprise" ? "Enterprise" : "Free Plan"}
              </div>
            </div>
            <button type="button" onClick={() => { setShowProfile(true); setProfileEdit({ name: userName || "" }); }} style={{ background: "none", border: `1px solid ${T.border}`, cursor: "pointer", color: T.gold, padding: "3px 8px", borderRadius: 6, fontSize: 10, fontWeight: 600, fontFamily: "'Outfit', sans-serif" }}>Profile</button>
            <button type="button" onClick={() => { signOut(auth); }} style={{ background: "none", border: "none", cursor: "pointer", color: T.textMuted, padding: 4 }} title="Sign out">
              {Icons.logout}
            </button>
          </div>
        </div>
      </aside>

      {/* ─── TOP BAR ─── */}
      <header className="top-bar" style={{
        position: "fixed", top: 0, right: 0, left: 240, height: 60,
        background: `${T.surface}ee`, backdropFilter: "blur(16px)",
        borderBottom: `1px solid ${T.border}`,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 24px", zIndex: 50,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {/* Mobile menu button */}
          <button type="button" onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background: "none", border: "none", cursor: "pointer", color: T.textSecondary, display: "none", padding: 4 }} className="mobile-menu-btn">
            {sidebarOpen ? Icons.close : Icons.menu}
          </button>
          <div>
            <h1 style={{ fontSize: 16, fontWeight: 700, color: T.white }}>Emaar Properties <span style={{ color: T.textMuted, fontWeight: 400, fontSize: 13 }}>PJSC</span></h1>
          </div>
        </div>
        <div className="header-badges" style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div role="button" tabIndex={0}  onClick={() => {}} style={{ background: T.surfaceAlt, borderRadius: 10, padding: "6px 12px", border: `1px solid ${T.border}`, cursor: "pointer" }} onMouseEnter={e => e.currentTarget.style.borderColor = T.gold} onMouseLeave={e => e.currentTarget.style.borderColor = T.border}>
            <span style={{ fontSize: 10, color: T.textMuted }}>RATING </span>
            <span style={{ fontSize: 12, fontWeight: 600, color: T.teal }}>BBB+ / Baa1</span>
          </div>
          <div role="button" tabIndex={0}  onClick={() => {}} style={{ background: T.surfaceAlt, borderRadius: 10, padding: "6px 12px", border: `1px solid ${T.border}`, cursor: "pointer" }} onMouseEnter={e => e.currentTarget.style.borderColor = T.gold} onMouseLeave={e => e.currentTarget.style.borderColor = T.border}>
            <span style={{ fontSize: 10, color: T.textMuted }}>TARGET </span>
            <span style={{ fontSize: 12, fontWeight: 600, color: T.goldLight }}>AED 20.77</span>
          </div>
          <button type="button" onClick={() => setShowWatchlist(true)} style={{ background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 10, padding: "8px 12px", cursor: "pointer", color: watchlist.length > 0 ? T.gold : T.textSecondary, display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontFamily: "'Outfit',sans-serif" }} title="My Watchlist">
            ☆ {watchlist.length > 0 && <span style={{ fontWeight: 700 }}>{watchlist.length}</span>}
          </button>
          <button type="button" onClick={globalRefresh} disabled={isRefreshing} title="Refresh all data" style={{ background: isRefreshing ? T.surfaceAlt : "rgba(212,168,67,0.08)", border: "1px solid " + (isRefreshing ? T.border : "rgba(212,168,67,0.25)"), borderRadius: 10, padding: "8px 12px", cursor: isRefreshing ? "not-allowed" : "pointer", color: isRefreshing ? T.textMuted : T.gold, display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 600, fontFamily: "'Outfit',sans-serif" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ animation: isRefreshing ? "spin 1s linear infinite" : "none" }}><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
            {isRefreshing ? "Refreshing..." : "Refresh"}
          </button>
          <button type="button" onClick={() => setShowNotifications(v => !v)} style={{ background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 10, padding: 8, cursor: "pointer", color: T.textSecondary, position: "relative" }} title="Notifications">
            {Icons.bell}
            {unreadCount > 0 && <span style={{ position: "absolute", top: 4, right: 4, width: 8, height: 8, borderRadius: "50%", background: T.red, border: `2px solid ${T.bg}` }} />}
          </button>
        </div>
      </header>

      {/* ─── MAIN CONTENT ─── */}
      <main role="main" id="main-content" className="main-content" style={{ marginLeft: 240, paddingTop: 60, minHeight: "100vh" }}>
        {/* Trial / Free tier banner */}
        {userTier === "pro_trial" && trialDaysLeft > 0 && (() => {
          const isUrgent = trialDaysLeft <= 1;
          const isWarning = trialDaysLeft <= 3;
          const bg = isUrgent ? "rgba(239,68,68,0.1)" : isWarning ? "rgba(245,158,11,0.1)" : "rgba(212,168,67,0.08)";
          const border = isUrgent ? "rgba(239,68,68,0.35)" : isWarning ? "rgba(245,158,11,0.35)" : T.border;
          const icon = isUrgent ? "🚨" : isWarning ? "⚠️" : "⭐";
          const label = isUrgent ? "Last day of your trial!" : isWarning ? `Trial ending soon` : "Pro Trial Active";
          const sub = isUrgent
            ? "Your trial expires today. Upgrade now to keep full access."
            : isWarning
            ? `${trialDaysLeft} days left — don't lose your access to 48+ projects and yield data.`
            : `${trialDaysLeft} day${trialDaysLeft !== 1 ? "s" : ""} remaining. Full Pro access active.`;
          return (
            <div style={{ margin: "12px 24px 0", padding: "10px 16px", borderRadius: 10, background: bg, border: `1px solid ${border}`, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 16 }}>{icon}</span>
                <span style={{ fontSize: 13, color: isUrgent ? T.red : isWarning ? T.gold : T.white, fontWeight: 700 }}>{label}</span>
                <span style={{ fontSize: 12, color: T.textSecondary }}>— {sub}</span>
              </div>
              <button type="button" onClick={() => setShowUpgrade(true)} style={{ padding: "6px 16px", borderRadius: 6, background: isUrgent ? T.red : T.gold, color: isUrgent ? "#fff" : T.bg, border: "none", fontSize: 12, fontWeight: 700, fontFamily: "'Outfit', sans-serif", cursor: "pointer" }}>
                {isUrgent ? "🔥 Upgrade Now" : "Upgrade to Pro"}
              </button>
            </div>
          );
        })()}
        {userTier === "free" && (
          <div style={{ margin: "12px 24px 0", padding: "10px 16px", borderRadius: 10, background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.15)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 16 }}>🔒</span>
              <span style={{ fontSize: 13, color: T.white, fontWeight: 600 }}>Free Plan</span>
              <span style={{ fontSize: 12, color: T.textSecondary }}>— You're seeing limited data. Upgrade to unlock all projects, yields & more.</span>
            </div>
            <button type="button" onClick={() => setShowUpgrade(true)} style={{ padding: "6px 16px", borderRadius: 6, background: T.gold, color: T.bg, border: "none", fontSize: 12, fontWeight: 700, fontFamily: "'Outfit', sans-serif", cursor: "pointer" }}>Upgrade to Pro — AED 99/mo</button>
          </div>
        )}
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: `0 24px ${compareList.length > 0 && tab === "Projects" ? "120px" : "60px"}` }}>

          {/* ─── OVERVIEW TAB ─── */}
          {tab === "Overview" && <>
            {/* ─── VERIFIED BAR ─── */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", marginBottom: 4, borderBottom: `1px solid ${T.border}`, flexWrap: "wrap", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center", width: 10, height: 10 }}>
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: T.green, display: "inline-block", animation: "pulse 2s infinite" }} />
                </span>
                <span style={{ fontSize: 11, color: T.textSecondary }}>Data verified <span style={{ color: T.gold, fontWeight: 600 }}>{new Date().toLocaleDateString("en-AE", { day: "numeric", month: "short", year: "numeric" })}</span></span>
                <span style={{ color: T.border }}>·</span>
                <a href="https://www.emaar.com/en/investor-relations/" target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: T.teal, textDecoration: "none" }}>Emaar IR ↗</a>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 10, color: T.textMuted }}>Click any card for breakdown & sources</span>
                <button type="button" onClick={() => {
                  const printWindow = window.open("", "_blank");
                  const now = new Date().toLocaleDateString("en-AE", { day: "numeric", month: "long", year: "numeric" });
                  printWindow.document.write(`<html><head><title>Emaar Properties — Overview Report</title><style>body{font-family:Georgia,serif;background:#fff;color:#111;margin:0;padding:40px}h1{font-size:28px;color:#1a1a1a;margin-bottom:4px}.sub{color:#666;font-size:13px;margin-bottom:32px}.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:32px}.card{border:1px solid #e0e0e0;border-radius:8px;padding:16px}.label{font-size:9px;letter-spacing:1.5px;text-transform:uppercase;color:#888;margin-bottom:6px}.value{font-size:22px;font-weight:700;color:#b8860b;margin-bottom:4px}.note{font-size:11px;color:#444}.section-title{font-size:16px;font-weight:700;margin:24px 0 12px;border-left:3px solid #b8860b;padding-left:10px}.footer{margin-top:40px;padding-top:16px;border-top:1px solid #e0e0e0;font-size:10px;color:#999}@media print{body{padding:20px}}</style></head><body>
                    <h1>Emaar Properties PJSC</h1><div class="sub">DXB Analytics Overview Report · Generated ${now} · DFM: EMAAR</div>
                    <div class="section-title">Key Performance — FY 2025</div>
                    <div class="grid">${[["Property Sales","AED 80.4B","+16% YoY · All-time record"],["Revenue","AED 49.6B","+40% YoY · USD 13.5B"],["Net Profit","AED 25.7B","+36% YoY · USD 7.0B"],["EBITDA","AED 25.6B","+33% YoY · Margin 51.6%"],["Backlog","AED 155B","+39% YoY · 3–4yr visibility"],["Recurring Rev","AED 10.5B","+13% · 32% of EBITDA"],["Units Delivered","125,600+","Since 2002 · #1 in GCC"],["Land Bank","618M sqft","344M UAE · AED 120B dev"]].map(([l,v,n])=>`<div class="card"><div class="label">${l}</div><div class="value">${v}</div><div class="note">${n}</div></div>`).join("")}</div>
                    <div class="section-title">Key Financial Ratios</div>
                    <div class="grid">${[["P/E Ratio (TTM)","7.83×","Industry avg: 15.5×"],["Forward P/E","8.10×","FY26 estimates"],["P/B Ratio","1.50×","Book value AED 9.44"],["EPS (TTM)","AED 1.87","Q4 2025: AED 0.70"],["ROE","22.05%","Strong capital efficiency"],["Dividend Yield","7.04%","AED 1.00/share"],["Debt/Equity","0.11×","Very low leverage"],["Beta","0.22","Low volatility, defensive"]].map(([l,v,n])=>`<div class="card"><div class="label">${l}</div><div class="value">${v}</div><div class="note">${n}</div></div>`).join("")}</div>
                    <div class="section-title">Analyst Consensus</div>
                    <div class="grid">${[["Consensus","Strong Buy","12 of 12 analysts"],["Avg Target","AED 19.94","Analyst consensus"],["High Target","AED 30.00","Bull case"],["Potential Upside","+29.5%","From AED 15.40"],["S&P Rating","BBB+","Stable outlook"],["Moody's","Baa1","Stable outlook"],["Fitch","BBB","Stable outlook"],["Market Cap","AED 128.2B","~USD 34.9B"]].map(([l,v,n])=>`<div class="card"><div class="label">${l}</div><div class="value">${v}</div><div class="note">${n}</div></div>`).join("")}</div>
                    <div class="footer">Sources: Emaar IR, DLD, TradingView, Investing.com, GuruFocus · Generated ${now} · For informational purposes only · DXB Analytics — emaar-dashboard.vercel.app</div>
                  </body></html>`);
                  printWindow.document.close();
                  setTimeout(() => printWindow.print(), 500);
                }} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", background: "rgba(212,168,67,0.1)", border: `1px solid ${T.gold}`, borderRadius: 8, color: T.gold, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit', sans-serif", transition: "all 0.2s" }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(212,168,67,0.2)"}
                onMouseLeave={e => e.currentTarget.style.background = "rgba(212,168,67,0.1)"}>
                  ⬇ Export PDF
                </button>
              </div>
            </div>

            <Section title="Key Performance" sub="FY 2025 — All-Time Records Across Every Metric · Source: Emaar Annual Report 2025">
              <div className="kpi-grid" style={{ display: "grid", gap: 12, marginTop: 16 }}>
                <KPI label="Property Sales" value="AED 80.4B" sub="+16% YoY · USD 21.9B" delay={1} onClick={() => setSelectedKPI({ label: "Property Sales", value: "AED 80.4B", color: T.gold, description: "Total off-plan and ready property sales contracted in FY2025. Includes UAE and international markets.", source: "Emaar Annual Report 2025", sourceUrl: "https://www.emaar.com/en/investor-relations/", items: [{ label: "FY2025 Sales", value: "AED 80.4B", note: "All-time record" }, { label: "FY2024 Sales", value: "AED 69.3B", note: "+16% YoY" }, { label: "FY2023 Sales", value: "AED 52.7B", note: "+31% YoY" }, { label: "Int'l Sales", value: "AED 9.3B", note: "+124% YoY" }, { label: "UAE Market Share", value: "~30%", note: "Largest by value" }, { label: "Units Booked", value: "12,000+", note: "FY2025 estimate" }], trend: [{ y: "2020", v: 21.5 }, { y: "2021", v: 26.2 }, { y: "2022", v: 33.5 }, { y: "2023", v: 52.7 }, { y: "2024", v: 69.3 }, { y: "2025", v: 80.4 }] })} />
                <KPI label="Revenue" value="AED 49.6B" sub="+40% YoY · USD 13.5B" delay={2} onClick={() => setSelectedKPI({ label: "Revenue", value: "AED 49.6B", color: T.teal, description: "Total recognized revenue across property development, malls, hospitality, and international operations.", source: "Emaar Annual Report 2025", sourceUrl: "https://www.emaar.com/en/investor-relations/", items: [{ label: "UAE Dev Revenue", value: "AED 36.4B", note: "73% of total" }, { label: "Malls & Retail", value: "AED 6.3B", note: "+13% YoY" }, { label: "Hospitality", value: "AED 4.2B", note: "+12% YoY" }, { label: "International", value: "AED 2.6B", note: "+124% YoY" }, { label: "Revenue CAGR", value: "27.2%", note: "5-year 2020–2025" }], trend: [{ y: "2020", v: 14.6 }, { y: "2021", v: 17.0 }, { y: "2022", v: 24.5 }, { y: "2023", v: 30.6 }, { y: "2024", v: 35.4 }, { y: "2025", v: 49.6 }] })} />
                <KPI label="Net Profit" value="AED 25.7B" sub="+36% YoY · USD 7.0B" delay={3} onClick={() => setSelectedKPI({ label: "Net Profit", value: "AED 25.7B", color: T.green, description: "Net profit before minority interest. Includes recurring revenue from Emaar Malls and hospitality.", source: "Emaar Annual Report 2025", sourceUrl: "https://www.emaar.com/en/investor-relations/", items: [{ label: "Net Margin", value: "51.8%", note: "Industry-leading" }, { label: "EPS FY2025", value: "AED 2.00", note: "+31% YoY" }, { label: "Q4 2025 Profit", value: "AED 7.3B", note: "Strongest quarter" }, { label: "5yr Profit CAGR", value: "57.1%", note: "2020–2025" }, { label: "Tax Rate", value: "~9%", note: "UAE Corporate Tax" }], trend: [{ y: "2020", v: 2.6 }, { y: "2021", v: 4.1 }, { y: "2022", v: 6.2 }, { y: "2023", v: 12.6 }, { y: "2024", v: 18.9 }, { y: "2025", v: 25.7 }] })} />
                <KPI label="EBITDA" value="AED 25.6B" sub="+33% YoY · USD 7.0B" delay={4} onClick={() => setSelectedKPI({ label: "EBITDA", value: "AED 25.6B", color: T.blue, description: "Earnings before interest, tax, depreciation & amortisation. Key operational profitability metric.", source: "Emaar Annual Report 2025", sourceUrl: "https://www.emaar.com/en/investor-relations/", items: [{ label: "EBITDA Margin", value: "51.6%", note: "5-year high" }, { label: "Recurring EBITDA", value: "AED 10.5B", note: "32% share" }, { label: "Dev EBITDA", value: "AED 15.1B", note: "Property segment" }, { label: "EV/EBITDA", value: "~5.0×", note: "Vs sector 9× avg" }, { label: "EBITDA CAGR", value: "44.5%", note: "2020–2025" }], trend: [{ y: "2020", v: 4.0 }, { y: "2021", v: 5.3 }, { y: "2022", v: 8.1 }, { y: "2023", v: 13.4 }, { y: "2024", v: 19.2 }, { y: "2025", v: 25.6 }] })} />
                <KPI label="Backlog" value="AED 155B" sub="+39% YoY · 3-4yr visibility" delay={5} onClick={() => setSelectedKPI({ label: "Revenue Backlog", value: "AED 155B", color: T.purple, description: "Total contracted but unrecognized revenue. Provides 3–4 years of forward revenue visibility.", source: "Emaar Q4 2025 Results", sourceUrl: "https://www.emaar.com/en/investor-relations/", items: [{ label: "Total Backlog", value: "AED 155B", note: "+39% YoY record" }, { label: "FY2024 Backlog", value: "AED 111.5B", note: "Prior year" }, { label: "Coverage Ratio", value: "3–4 yrs", note: "Revenue visibility" }, { label: "UAE Backlog", value: "AED 140B+", note: "~90% of total" }, { label: "New Launches", value: "AED 85B+", note: "FY2025 new sales" }], trend: [{ y: "2020", v: 45 }, { y: "2021", v: 52 }, { y: "2022", v: 68 }, { y: "2023", v: 80 }, { y: "2024", v: 111.5 }, { y: "2025", v: 155 }] })} />
                <KPI label="Recurring Rev" value="AED 10.5B" sub="+13% · 32% of EBITDA" delay={6} onClick={() => setSelectedKPI({ label: "Recurring Revenue", value: "AED 10.5B", color: T.cyan, description: "Stable income from Emaar Malls, hotels, serviced residences, and commercial leasing.", source: "Emaar Annual Report 2025", sourceUrl: "https://www.emaar.com/en/investor-relations/", items: [{ label: "Malls Revenue", value: "AED 6.3B", note: "Dubai Mall + Fashion Ave" }, { label: "Hospitality", value: "AED 4.2B", note: "Hotels & serviced res." }, { label: "% of EBITDA", value: "32%", note: "Defensive income" }, { label: "Dubai Mall Footfall", value: "105M+", note: "Annual visitors" }, { label: "Occupancy", value: "95%+", note: "Malls occupancy rate" }], trend: [{ y: "2020", v: 5.8 }, { y: "2021", v: 6.8 }, { y: "2022", v: 7.9 }, { y: "2023", v: 8.6 }, { y: "2024", v: 9.3 }, { y: "2025", v: 10.5 }] })} />
                <KPI label="Units Delivered" value="125,600+" sub="Since 2002 · #1 in GCC" delay={7} onClick={() => setSelectedKPI({ label: "Units Delivered", value: "125,600+", color: T.gold, description: "Total residential and commercial units delivered since inception in 2002. Largest track record in GCC.", source: "Emaar Corporate Profile 2025", sourceUrl: "https://www.emaar.com/en/investor-relations/", items: [{ label: "Total Delivered", value: "125,600+", note: "Since 2002" }, { label: "FY2025 Deliveries", value: "~11,000", note: "Est. annual handovers" }, { label: "UAE Units", value: "~100,000+", note: "80% of total" }, { label: "On-Time Record", value: "95%+", note: "Delivery track record" }, { label: "GCC Rank", value: "#1", note: "By volume" }], trend: [{ y: "2020", v: 85000 }, { y: "2021", v: 95000 }, { y: "2022", v: 103000 }, { y: "2023", v: 110000 }, { y: "2024", v: 118000 }, { y: "2025", v: 125600 }] })} />
                <KPI label="Land Bank" value="618M sqft" sub="344M UAE · AED 120B dev" delay={8} onClick={() => setSelectedKPI({ label: "Land Bank", value: "618M sqft", color: T.gold, description: "Total gross land area owned or controlled by Emaar for future development.", source: "Emaar Annual Report 2025", sourceUrl: "https://www.emaar.com/en/investor-relations/", items: [{ label: "Total Land Bank", value: "618M sqft", note: "Gross area" }, { label: "UAE Land", value: "344M sqft", note: "56% of total" }, { label: "International", value: "274M sqft", note: "Egypt, India, KSA" }, { label: "Development Value", value: "AED 120B+", note: "Future GDV est." }, { label: "Dubai Hills Remaining", value: "~180M sqft", note: "Largest UAE plot" }], trend: [{ y: "2020", v: 480 }, { y: "2021", v: 510 }, { y: "2022", v: 535 }, { y: "2023", v: 570 }, { y: "2024", v: 595 }, { y: "2025", v: 618 }] })} />
              </div>
            </Section>

            <div className="chart-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 20 }}>
              <Chart title="Revenue by Segment (AED B)">
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie data={segments} dataKey="revenue" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={52} paddingAngle={3} stroke="none">
                      {segments.map((s, i) => <Cell key={i} fill={s.color} />)}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", marginTop: 8 }}>
                  {segments.map((s, i) => (
                    <span key={i} style={{ fontSize: 11, color: T.textSecondary, display: "flex", alignItems: "center", gap: 5 }}>
                      <span style={{ width: 8, height: 8, borderRadius: 3, background: s.color, display: "inline-block" }} />
                      {s.name} ({s.revenue}B · {s.growth})
                    </span>
                  ))}
                </div>
              </Chart>

              <Chart title="6-Year Revenue & Profit (AED B)">
                <ResponsiveContainer width="100%" height={240}>
                  <AreaChart data={financials}>
                    <defs>
                      <linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={T.gold} stopOpacity={0.25} /><stop offset="100%" stopColor={T.gold} stopOpacity={0} /></linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="year" tick={{ fill: T.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: T.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="revenue" stroke={T.gold} fill="url(#gRev)" strokeWidth={2.5} name="Revenue" />
                    <Line type="monotone" dataKey="netProfit" stroke={T.teal} strokeWidth={2} dot={{ fill: T.teal, r: 3 }} name="Net Profit" />
                    <Line type="monotone" dataKey="ebitda" stroke={T.blue} strokeWidth={2} dot={{ fill: T.blue, r: 3 }} name="EBITDA" />
                  </AreaChart>
                </ResponsiveContainer>
                {/* Chart Legend */}
                <div style={{ display: "flex", gap: 16, justifyContent: "center", marginTop: 8 }}>
                  {[["Revenue", T.gold], ["Net Profit", T.teal], ["EBITDA", T.blue]].map(([name, color]) => (
                    <span key={name} style={{ fontSize: 11, color: T.textSecondary, display: "flex", alignItems: "center", gap: 5 }}>
                      <span style={{ width: 20, height: 2, background: color, display: "inline-block", borderRadius: 1 }} />
                      {name}
                    </span>
                  ))}
                </div>
              </Chart>
            </div>

            <Section title="Company Strength" sub="Analyst consensus: STRONG BUY (12 of 12 analysts) · Source: Investing.com">
              <div className="chart-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 16 }}>
                <Chart title="Performance Radar">
                  <ResponsiveContainer width="100%" height={260}>
                    <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="75%">
                      <PolarGrid stroke="rgba(255,255,255,0.06)" />
                      <PolarAngleAxis dataKey="metric" tick={{ fill: T.textSecondary, fontSize: 10 }} />
                      <PolarRadiusAxis tick={false} axisLine={false} />
                      <Radar name="Emaar" dataKey="value" stroke={T.gold} fill={T.gold} fillOpacity={0.15} strokeWidth={2} />
                      <Tooltip content={<CustomTooltip />} />
                    </RadarChart>
                  </ResponsiveContainer>
                </Chart>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {[
                    { label: "Founded", value: "1997", sub: "27+ years track record", kpi: { color: T.gold, description: "Emaar Properties founded in 1997 by Mohamed Alabbar. Listed on DFM in 2000.", source: "Emaar Corporate", sourceUrl: "https://www.emaar.com/en/investor-relations/", items: [{ label: "Founded", value: "1997", note: "Dubai, UAE" }, { label: "IPO", value: "2000", note: "Dubai Financial Market" }, { label: "Chairman", value: "M. Alabbar", note: "Founder & visionary" }, { label: "Employees", value: "9,000+", note: "Global workforce" }], trend: null } },
                    { label: "Developer Rank", value: "#1", sub: "Dubai's largest by value", kpi: { color: T.teal, description: "Consistently ranked #1 developer in Dubai by property sales value with ~30% market share.", source: "DLD & Zawya 2025", sourceUrl: "https://zawya.com", items: [{ label: "UAE Rank", value: "#1", note: "By sales value" }, { label: "Market Share", value: "~30%", note: "Dubai off-plan" }, { label: "GCC Rank", value: "#1", note: "By units delivered" }, { label: "FY2025 Sales", value: "AED 80.4B", note: "vs #2 ~AED 20B" }], trend: null } },
                    { label: "Active Projects", value: String(activeProjects.length), sub: "Across 10+ communities", kpi: { color: T.blue, description: "48 active projects across Dubai Hills, Creek Harbour, Downtown, Beachfront and more.", source: "DXB Analytics Database", sourceUrl: "#", items: [{ label: "Under Construction", value: "18", note: "Active building" }, { label: "Off-Plan", value: "30", note: "Pre-launch / launched" }, { label: "Communities", value: "11", note: "Master-planned" }, { label: "Branded", value: "12+", note: "Address · Vida · Palace" }], trend: null } },
                    { label: "International", value: "AED 9.3B", sub: "+124% growth YoY", kpi: { color: T.green, description: "International operations across Egypt, India, Saudi Arabia, Pakistan and Turkey.", source: "Emaar Annual Report 2025", sourceUrl: "https://www.emaar.com/en/investor-relations/", items: [{ label: "Int'l Sales", value: "AED 9.3B", note: "+124% YoY" }, { label: "Egypt", value: "Largest market", note: "Marassi, Uptown Cairo" }, { label: "India", value: "Growing", note: "Emaar India" }, { label: "Saudi Arabia", value: "Expanding", note: "New projects" }], trend: [{ y: "2022", v: 1.8 }, { y: "2023", v: 2.9 }, { y: "2024", v: 4.1 }, { y: "2025", v: 9.3 }] } },
                    { label: "Dividend/Share", value: "AED 1.00", sub: "2× increase from 2023", kpi: { color: T.gold, description: "AED 1.00 DPS for FY2025 — 100% of share capital, 2× increase from AED 0.50 in 2023.", source: "Emaar IR 2025", sourceUrl: "https://www.emaar.com/en/investor-relations/", items: [{ label: "DPS FY2025", value: "AED 1.00", note: "100% of share capital" }, { label: "DPS FY2024", value: "AED 0.70", note: "+43% YoY" }, { label: "DPS FY2023", value: "AED 0.50", note: "Base year" }, { label: "Total Payout", value: "AED 8.8B", note: "Total dividend pool" }, { label: "Yield (15.40)", value: "6.5%", note: "Attractive vs peers" }], trend: [{ y: "2021", v: 0.25 }, { y: "2022", v: 0.40 }, { y: "2023", v: 0.50 }, { y: "2024", v: 0.70 }, { y: "2025", v: 1.00 }] } },
                    { label: "Target Upside", value: "+21.8%", sub: "AED 20.77 consensus", kpi: { color: T.green, description: "12 analyst consensus target of AED 20.77 vs current AED 15.40 — all 12 rate Strong Buy.", source: "TradingView · Investing.com", sourceUrl: "https://www.tradingview.com/symbols/DFM-EMAAR/", items: [{ label: "Consensus Target", value: "AED 20.77", note: "12 analyst average" }, { label: "Current Price", value: "AED 15.40", note: "Mar 2026" }, { label: "High Target", value: "AED 30.00", note: "Bull case" }, { label: "Low Target", value: "AED 15.80", note: "Bear case" }, { label: "Rating", value: "Strong Buy", note: "12 of 12 analysts" }], trend: null } },
                  ].map(({ label, value, sub, kpi }, i) => (
                    <KPI key={i} label={label} value={value} sub={sub} delay={Math.min(i + 1, 8)} onClick={() => setSelectedKPI({ label, value, ...kpi })} />
                  ))}
                </div>
              </div>
            </Section>
          </>}

          {/* ─── FINANCIALS TAB ─── */}
          {tab === "Financials" && <>
            <Section title="Financial Performance" sub="6-year trend · 2020–2025 · All figures in AED Billions">
              <div className="kpi-grid" style={{ display: "grid", gap: 12, marginTop: 16 }}>
                <KPI label="Revenue CAGR" value="27.2%" sub="2020-2025 · 5-year" delay={1} onClick={() => setSelectedKPI({ label: "Revenue CAGR", value: "27.2%", color: T.gold, description: "Compound Annual Growth Rate of revenue from AED 14.6B in 2020 to AED 49.6B in 2025 — one of the highest CAGRs among global real estate developers.", source: "Emaar Annual Report 2025", sourceUrl: "https://www.emaar.com/en/investor-relations/", items: [{ label: "2020 Revenue", value: "AED 14.6B", note: "Base year" }, { label: "2025 Revenue", value: "AED 49.6B", note: "+240% total growth" }, { label: "CAGR", value: "27.2%", note: "5-year compounded" }, { label: "vs GCC Average", value: "~8–10%", note: "Sector benchmark" }, { label: "YoY 2025", value: "+40%", note: "Strongest single year" }], trend: [{ y: "2020", v: 14.6 }, { y: "2021", v: 17.0 }, { y: "2022", v: 24.5 }, { y: "2023", v: 30.6 }, { y: "2024", v: 35.4 }, { y: "2025", v: 49.6 }] })} />
                <KPI label="Profit CAGR" value="57.1%" sub="2020-2025 · 5-year" delay={2} onClick={() => setSelectedKPI({ label: "Profit CAGR", value: "57.1%", color: T.green, description: "Net profit grew from AED 2.6B in 2020 to AED 25.7B in 2025 — a 57.1% CAGR driven by margin expansion and operating leverage.", source: "Emaar Annual Report 2025", sourceUrl: "https://www.emaar.com/en/investor-relations/", items: [{ label: "2020 Net Profit", value: "AED 2.6B", note: "Base year" }, { label: "2025 Net Profit", value: "AED 25.7B", note: "+888% total growth" }, { label: "CAGR", value: "57.1%", note: "5-year compounded" }, { label: "Net Margin 2020", value: "17.8%", note: "Starting margin" }, { label: "Net Margin 2025", value: "51.8%", note: "+34pp expansion" }], trend: [{ y: "2020", v: 2.6 }, { y: "2021", v: 4.1 }, { y: "2022", v: 6.2 }, { y: "2023", v: 12.6 }, { y: "2024", v: 18.9 }, { y: "2025", v: 25.7 }] })} />
                <KPI label="Gross Margin" value="57.5%" sub="Industry-leading" delay={3} onClick={() => setSelectedKPI({ label: "Gross Margin", value: "57.5%", color: T.teal, description: "Gross profit margin of 57.5% — significantly above the global real estate developer average of 25–35%. Driven by land cost advantage and premium brand pricing.", source: "Emaar Annual Report 2025", sourceUrl: "https://www.emaar.com/en/investor-relations/", items: [{ label: "Gross Margin", value: "57.5%", note: "FY2025" }, { label: "Gross Profit", value: "AED 28.5B", note: "On AED 49.6B revenue" }, { label: "GCC Dev Avg", value: "~30–35%", note: "Industry benchmark" }, { label: "vs DAMAC", value: "~45%", note: "Nearest competitor" }, { label: "Land Cost Basis", value: "AED 5–15/sqft", note: "Historical acquisition" }], trend: [{ y: "2020", v: 42 }, { y: "2021", v: 45 }, { y: "2022", v: 50 }, { y: "2023", v: 54 }, { y: "2024", v: 56 }, { y: "2025", v: 57.5 }] })} />
                <KPI label="Net Margin" value="35.5%" sub="Consistent expansion" delay={4} onClick={() => setSelectedKPI({ label: "Net Margin", value: "35.5%", color: T.blue, description: "Net profit margin after all costs including tax. Expanded from 17.8% in 2020 to 51.8% in 2025 on a pre-tax basis.", source: "Emaar Annual Report 2025", sourceUrl: "https://www.emaar.com/en/investor-relations/", items: [{ label: "Net Margin FY2025", value: "51.8%", note: "Pre-tax" }, { label: "Net Margin FY2024", value: "53.4%", note: "Prior year" }, { label: "Net Margin FY2020", value: "17.8%", note: "5-year base" }, { label: "EBITDA Margin", value: "51.6%", note: "Operational efficiency" }, { label: "After-Tax Est.", value: "~35.5%", note: "Post UAE corp tax" }], trend: [{ y: "2020", v: 17.8 }, { y: "2021", v: 24.1 }, { y: "2022", v: 25.3 }, { y: "2023", v: 41.2 }, { y: "2024", v: 53.4 }, { y: "2025", v: 51.8 }] })} />
              </div>
            </Section>

            <ProGate isPro={isPro} message="Unlock 6 Years of Financial Data" onUpgrade={() => setShowUpgrade(true)}>
            <div className="chart-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 20 }}>
              <Chart title="Revenue vs Property Sales (AED B)">
                <ResponsiveContainer width="100%" height={typeof window !== "undefined" && window.innerWidth < 480 ? 180 : 280}>
                  <ComposedChart data={financials}>
                    <defs>
                      <linearGradient id="gSales" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={T.gold} stopOpacity={0.2} /><stop offset="100%" stopColor={T.gold} stopOpacity={0} /></linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="year" tick={{ fill: T.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: T.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="propertySales" fill="url(#gSales)" stroke={T.gold} strokeWidth={2} name="Property Sales" />
                    <Bar dataKey="revenue" fill={T.teal} name="Revenue" radius={[4, 4, 0, 0]} barSize={24} opacity={0.8} />
                  </ComposedChart>
                </ResponsiveContainer>
              </Chart>

              <Chart title="Profitability Trend (AED B)">
                <ResponsiveContainer width="100%" height={typeof window !== "undefined" && window.innerWidth < 480 ? 180 : 280}>
                  <AreaChart data={financials}>
                    <defs>
                      <linearGradient id="gNP" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={T.teal} stopOpacity={0.2} /><stop offset="100%" stopColor={T.teal} stopOpacity={0} /></linearGradient>
                      <linearGradient id="gEb" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={T.blue} stopOpacity={0.15} /><stop offset="100%" stopColor={T.blue} stopOpacity={0} /></linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="year" tick={{ fill: T.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: T.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="ebitda" stroke={T.blue} fill="url(#gEb)" strokeWidth={2} name="EBITDA" />
                    <Area type="monotone" dataKey="netProfit" stroke={T.teal} fill="url(#gNP)" strokeWidth={2} name="Net Profit" />
                    <Line type="monotone" dataKey="grossProfit" stroke={T.gold} strokeWidth={2} dot={{ fill: T.gold, r: 3 }} name="Gross Profit" />
                  </AreaChart>
                </ResponsiveContainer>
              </Chart>
            </div>

            <Section title="Margin Analysis" sub="Profitability margins over 6 years">
              <Chart title="Margin Trends (%)">
                <ResponsiveContainer width="100%" height={typeof window !== "undefined" && window.innerWidth < 480 ? 180 : 280}>
                  <LineChart data={financials}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="year" tick={{ fill: T.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: T.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 70]} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="gm" stroke={T.gold} strokeWidth={2.5} dot={{ fill: T.gold, r: 4 }} name="Gross Margin %" />
                    <Line type="monotone" dataKey="em" stroke={T.teal} strokeWidth={2.5} dot={{ fill: T.teal, r: 4 }} name="EBITDA Margin %" />
                    <Line type="monotone" dataKey="nm" stroke={T.cyan} strokeWidth={2.5} dot={{ fill: T.cyan, r: 4 }} name="Net Margin %" />
                  </LineChart>
                </ResponsiveContainer>
              </Chart>
            </Section>

            <Section title="Revenue Diversification" sub="Recurring revenue streams">
              <div className="chart-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 16 }}>
                <Chart title="Backlog Growth (AED B)">
                  <ResponsiveContainer width="100%" height={250}>
                    <AreaChart data={financials}>
                      <defs><linearGradient id="gBk" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={T.purple} stopOpacity={0.25} /><stop offset="100%" stopColor={T.purple} stopOpacity={0} /></linearGradient></defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                      <XAxis dataKey="year" tick={{ fill: T.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: T.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="backlog" stroke={T.purple} fill="url(#gBk)" strokeWidth={2.5} name="Revenue Backlog" />
                    </AreaChart>
                  </ResponsiveContainer>
                </Chart>
                <Chart title="Malls & Hotels Revenue (AED B)">
                  <ResponsiveContainer width="100%" height={250}>
                    <AreaChart data={financials}>
                      <defs>
                        <linearGradient id="gMa" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={T.gold} stopOpacity={0.2} /><stop offset="100%" stopColor={T.gold} stopOpacity={0} /></linearGradient>
                        <linearGradient id="gHo" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={T.cyan} stopOpacity={0.2} /><stop offset="100%" stopColor={T.cyan} stopOpacity={0} /></linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                      <XAxis dataKey="year" tick={{ fill: T.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: T.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="mallRev" stroke={T.gold} fill="url(#gMa)" name="Mall Revenue" stackId="1" strokeWidth={2} />
                      <Area type="monotone" dataKey="hotelRev" stroke={T.cyan} fill="url(#gHo)" name="Hotel Revenue" stackId="1" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </Chart>
              </div>
            </Section>

            <Section title="Per-Share Metrics" sub="Dividend and earnings growth">
              <div className="kpi-grid" style={{ display: "grid", gap: 12, marginTop: 12 }}>
                <KPI label="EPS (2025)" value="AED 2.00" sub="+31% YoY" delay={1} />
                <KPI label="DPS (2025)" value="AED 1.00" sub="100% of share capital" delay={2} />
                <KPI label="EPS CAGR" value="52.8%" sub="5-year · 2020-2025" delay={3} />
                <KPI label="Total Dividend" value="AED 8.8B" sub="Payout to shareholders" delay={4} />
              </div>
              <div className="chart-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 16 }}>
                <Chart title="EPS & Dividend Per Share (AED)">
                  <ResponsiveContainer width="100%" height={250}>
                    <ComposedChart data={financials}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                      <XAxis dataKey="year" tick={{ fill: T.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: T.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="dividend" fill={T.gold} name="Dividend/Share" radius={[4, 4, 0, 0]} barSize={20} opacity={0.7} />
                      <Line type="monotone" dataKey="eps" stroke={T.teal} strokeWidth={2.5} dot={{ fill: T.teal, r: 4 }} name="EPS" />
                    </ComposedChart>
                  </ResponsiveContainer>
                </Chart>
                <Chart title="International Sales (AED B)">
                  <ResponsiveContainer width="100%" height={250}>
                    <AreaChart data={financials}>
                      <defs><linearGradient id="gIntl" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={T.green} stopOpacity={0.25} /><stop offset="100%" stopColor={T.green} stopOpacity={0} /></linearGradient></defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                      <XAxis dataKey="year" tick={{ fill: T.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: T.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="intlSales" stroke={T.green} fill="url(#gIntl)" strokeWidth={2.5} name="Int'l Sales" />
                    </AreaChart>
                  </ResponsiveContainer>
                </Chart>
              </div>
            </Section>

            <Section title="Full Financial Summary" sub="All key metrics · 2020–2025 · AED Billions">
              <div className="table-scroll" style={{ overflowX: "auto", marginTop: 12 }}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 700 }}>
                  <thead>
                    <tr style={{ borderBottom: `2px solid ${T.border}` }}>
                      {["Metric", "2020", "2021", "2022", "2023", "2024", "2025"].map(h => (
                        <th key={h} style={{ padding: "10px 12px", textAlign: h === "Metric" ? "left" : "right", color: h === "2025" ? T.gold : T.textMuted, fontWeight: 600, fontSize: 11, letterSpacing: 0.5, textTransform: "uppercase" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { m: "Revenue", k: "revenue" }, { m: "EBITDA", k: "ebitda" }, { m: "Net Profit (Pre-Tax)", k: "netProfit" },
                      { m: "Property Sales", k: "propertySales" }, { m: "Revenue Backlog", k: "backlog" }, { m: "Recurring Revenue", k: "recurringRev" },
                      { m: "Int'l Sales", k: "intlSales" }, { m: "Mall Revenue", k: "mallRev" }, { m: "Hotel Revenue", k: "hotelRev" },
                    ].map(({ m, k }, ri) => (
                      <tr key={k} style={{ borderBottom: `1px solid ${T.border}` }}>
                        <td style={{ padding: "10px 12px", color: T.white, fontWeight: 500, fontSize: 12 }}>{m}</td>
                        {financials.map((f, ci) => (
                          <td key={ci} style={{ padding: "10px 12px", textAlign: "right", color: ci === financials.length - 1 ? T.gold : T.textSecondary, fontFamily: "'Fraunces', serif", fontWeight: ci === financials.length - 1 ? 700 : 400, fontSize: 12 }}>
                            {f[k] ? f[k].toFixed(1) : "—"}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>
            </ProGate>
          </>}

          {/* ─── PROJECTS TAB (48 Projects from Excel) ─── */}
          {tab === "Projects" && <>
            <Section title={`${activeProjects.length} Active Projects`} sub="Complete Emaar off-plan portfolio · 2026–2030 · Search & filter">
              <div className="kpi-grid" style={{ display: "grid", gap: 12, marginTop: 16 }}>
                <KPI label="Total Projects" value={activeProjects.length} sub="18 under construction · 30 off-plan" delay={1} onClick={() => setSelectedKPI({ label: "Total Projects", value: "48", color: T.gold, description: "48 active Emaar projects across UAE.", source: "DXB Analytics", sourceUrl: "#", items: [{ label: "Under Construction", value: "18", note: "Active building" }, { label: "Off-Plan", value: "30", note: "Pre-launch" }, { label: "Communities", value: "11", note: "Master-planned" }, { label: "Branded", value: "10", note: "Address, Vida, Palace" }], trend: null })} />
                <KPI label="Communities" value="11" sub="DHE · DCH · EBF · GPC + 7 more" delay={2} />
                <KPI label="Branded" value={`${activeProjects.filter(p=>p.branded).length}`} sub="Address · Vida · Palace · Bristol" delay={3} />
                <KPI label="Avg Construction" value={`${Math.round(activeProjects.reduce((a,p)=>a+(p.construction||0),0)/activeProjects.length)}%`} sub="Weighted average progress" delay={4} />
              </div>
            </Section>

            {/* Search & Filters */}
            <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', flex: '1 1 250px', maxWidth: 350 }}>
                  <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: T.textMuted }}>{Icons.search}</span>
                  <input value={projectSearch} onChange={e => setProjectSearch(e.target.value)} placeholder='Search projects or community...' style={{ width: '100%', padding: '10px 12px 10px 36px', background: T.surface, border: '1px solid '+T.border, borderRadius: 10, color: T.textPrimary, fontSize: 13, fontFamily: 'Outfit, sans-serif', outline: 'none' }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: '1 1 200px', background: T.surface, border: '1px solid '+T.border, borderRadius: 10, padding: '8px 14px' }}>
                  <span style={{ fontSize: 11, color: T.textMuted, whiteSpace: 'nowrap' }}>Max Price</span>
                  <input type='range' min={1} max={20} step={0.5} value={projectPriceMax} onChange={e => setProjectPriceMax(Number(e.target.value))} style={{ flex: 1, accentColor: T.gold, cursor: 'pointer' }} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: T.gold, whiteSpace: 'nowrap', minWidth: 60 }}>{projectPriceMax >= 20 ? 'Any' : 'AED '+projectPriceMax+'M'}</span>
                </div>
                {(projectSearch || projectFilter !== 'All' || projectTier !== 'All' || projectHandover !== 'All' || projectPriceMax < 20) && (
                  <button type='button' onClick={() => { setProjectSearch(''); setProjectFilter('All'); setProjectTier('All'); setProjectHandover('All'); setProjectPriceMax(20); }} style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.08)', color: T.red, fontSize: 12, cursor: 'pointer' }}>Clear Filters</button>
                )}
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ fontSize: 10, color: T.textMuted, letterSpacing: 1, textTransform: 'uppercase' }}>Area</span>
                {['All','DHE','DCH','EBF','GPC','ES','TV','RYM','TO','BB','TH','Branded'].map(f => (
                  <button type='button' key={f} onClick={() => setProjectFilter(f)} style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid '+(projectFilter===f ? T.gold : T.border), background: projectFilter===f ? T.goldGlow : 'transparent', color: projectFilter===f ? T.gold : T.textSecondary, fontSize: 11, fontWeight: projectFilter===f ? 600 : 400, cursor: 'pointer', transition: 'all 0.2s' }}>{f}</button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ fontSize: 10, color: T.textMuted, letterSpacing: 1, textTransform: 'uppercase' }}>Tier</span>
                {['All','Affordable','Mid-Market','Mid-Premium','Premium','Luxury','Ultra-Luxury','Luxury Branded','Ultra-Lux Branded'].map(t => (
                  <button type='button' key={t} onClick={() => setProjectTier(t)} style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid '+(projectTier===t ? T.teal : T.border), background: projectTier===t ? 'rgba(0,191,165,0.1)' : 'transparent', color: projectTier===t ? T.teal : T.textSecondary, fontSize: 11, fontWeight: projectTier===t ? 600 : 400, cursor: 'pointer', transition: 'all 0.2s' }}>{t}</button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ fontSize: 10, color: T.textMuted, letterSpacing: 1, textTransform: 'uppercase' }}>Handover</span>
                {['All','2026','2027','2028','2029','2030+'].map(y => (
                  <button type='button' key={y} onClick={() => setProjectHandover(y)} style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid '+(projectHandover===y ? T.purple : T.border), background: projectHandover===y ? 'rgba(139,92,246,0.1)' : 'transparent', color: projectHandover===y ? T.purple : T.textSecondary, fontSize: 11, fontWeight: projectHandover===y ? 600 : 400, cursor: 'pointer', transition: 'all 0.2s' }}>{y}</button>
                ))}
              </div>
            </div>

            {/* Project Cards */}
            {projectsLoading ? <LoadingSkeleton rows={6} cols={3} /> : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12, marginTop: 16 }}>
              {activeProjects
                .filter(p => {
                  const matchSearch = !projectSearch || p.name.toLowerCase().includes(projectSearch.toLowerCase()) || p.community.toLowerCase().includes(projectSearch.toLowerCase());
                  const matchFilter = projectFilter === "All" || p.district === projectFilter || (projectFilter === "Branded" && p.branded);
                  const matchTier = projectTier === "All" || p.tier === projectTier;
                  const matchHandover = projectHandover === "All" || (projectHandover === "2030+" ? parseInt(p.handover) >= 2030 : p.handover?.includes(projectHandover));
                  const matchPrice = projectPriceMax >= 20 || !p.price || p.price <= projectPriceMax * 1e6;
                  return matchSearch && matchFilter && matchTier && matchHandover && matchPrice;
                })
                .map((p, i) => {
                  const isLocked = !isPro && i >= 5;
                  return (
                <div key={p.id} className="chart-box fade-up" style={{ animationDelay: `${Math.min(i * 0.03, 0.5)}s`, padding: 0, overflow: "hidden", cursor: isLocked ? "default" : "pointer", outline: compareList.find(x=>x.id===p.id) ? `2px solid ${T.gold}` : "none", outlineOffset: "-1px", position: "relative", boxShadow: compareList.find(x=>x.id===p.id) ? `0 0 20px rgba(212,168,67,0.2)` : "none" }} onClick={() => !isLocked && setSelectedProject(p)}>
                  {/* Lock overlay for free users */}
                  {isLocked && (
                    <div style={{ position: "absolute", inset: 0, background: "rgba(4,9,15,0.7)", backdropFilter: "blur(4px)", zIndex: 10, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", borderRadius: 12 }}>
                      <span style={{ fontSize: 24, marginBottom: 6 }}>🔒</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: T.white }}>Pro Feature</span>
                      <button type="button" onClick={(e) => { e.stopPropagation(); setShowUpgrade(true); }} style={{ marginTop: 8, padding: "6px 16px", background: T.gold, color: T.bg, border: "none", borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "'Outfit', sans-serif" }}>Unlock</button>
                    </div>
                  )}
                  {/* Compare badge */}
                  {compareList.find(x=>x.id===p.id) && (
                    <div style={{ position: "absolute", top: 8, right: 8, padding: "3px 8px", borderRadius: 6, background: T.gold, color: T.bg, fontSize: 9, fontWeight: 800, zIndex: 5, letterSpacing: 0.5 }}>COMPARING</div>
                  )}
                  {/* Project Image */}
                  {p.imageUrl && (
                    <div style={{ width: "100%", height: 140, overflow: "hidden", borderBottom: `1px solid ${T.border}` }}>
                      <img src={p.imageUrl} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => { e.target.parentElement.style.display = "none"; }} />
                    </div>
                  )}
                  <div style={{ padding: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: "'Fraunces', serif", fontSize: 15, fontWeight: 700, color: T.gold, marginBottom: 2 }}>{p.name}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 11, color: T.textSecondary }}>{p.community}</span>
                        {p.emaarUrl && <a href={p.emaarUrl} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ fontSize: 9, color: T.gold, textDecoration: "none", padding: "1px 5px", border: "1px solid rgba(212,168,67,0.3)", borderRadius: 4, fontWeight: 600, letterSpacing: 0.3, flexShrink: 0 }} title="Official listing on Emaar.com">{getLinkLabel(p.emaarUrl)}</a>}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 4 }}>
                      {p.branded && <span style={{ fontSize: 9, padding: "3px 8px", borderRadius: 6, background: "rgba(212,168,67,0.15)", color: T.gold, fontWeight: 600 }}>{p.brand}</span>}
                      <span style={{ fontSize: 9, padding: "3px 8px", borderRadius: 6, background: p.status === "Completed" ? "rgba(16,185,129,0.2)" : p.status === "Under Construction" ? "rgba(16,185,129,0.12)" : "rgba(59,130,246,0.12)", color: p.status === "Completed" ? T.green : p.status === "Under Construction" ? T.green : T.blue, fontWeight: 600 }}>{p.status === "Completed" ? "✓ Done" : p.status === "Under Construction" ? "Building" : "Off-Plan"}</span>
                    </div>
                  </div>
                  {/* Construction Progress */}
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 10, color: T.textMuted }}>Construction</span>
                      <span style={{ fontSize: 10, fontWeight: 600, color: p.construction >= 100 ? T.green : p.construction >= 70 ? T.green : p.construction >= 30 ? T.gold : T.blue }}>{p.construction}%</span>
                    </div>
                    <div style={{ height: 4, borderRadius: 2, background: T.surfaceAlt, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${p.construction}%`, borderRadius: 2, background: p.construction >= 100 ? T.green : p.construction >= 70 ? T.green : p.construction >= 30 ? T.gold : T.blue, transition: "width 0.5s ease" }} />
                    </div>
                  </div>
                  {/* Details Grid */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    <div><span style={{ fontSize: 9, color: T.textMuted, display: "block" }}>FROM</span><span style={{ fontSize: 13, fontWeight: 600, color: T.white }}>{p.price ? `AED ${(p.price/1000000).toFixed(1)}M` : "TBD"}</span></div>
                    <div>
                      <span style={{ fontSize: 9, color: T.textMuted, display: "block" }}>HANDOVER</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: T.white }}>{p.handover}</span>
                      {(() => { const cd = getHandoverCountdown(p.handover); return cd ? (
                        <span style={{ display: "inline-block", marginTop: 2, fontSize: 9, fontWeight: 700, color: cd.passed ? "#10B981" : cd.color, background: cd.passed ? "rgba(16,185,129,0.1)" : cd.urgent ? "rgba(239,68,68,0.12)" : "rgba(212,168,67,0.08)", padding: "1px 5px", borderRadius: 4 }}>
                          {cd.passed ? "\u2713 Ready" : "\u23F1 " + cd.label}
                        </span>
                      ) : null; })()}
                    </div>
                    <div><span style={{ fontSize: 9, color: T.textMuted, display: "block" }}>PRICE/SQFT</span><span style={{ fontSize: 13, fontWeight: 600, color: T.white }}>{p.ppsf ? `AED ${p.ppsf.toLocaleString()}` : "TBD"}</span></div>
                    <div><span style={{ fontSize: 9, color: T.textMuted, display: "block" }}>SIZE</span><span style={{ fontSize: 13, fontWeight: 600, color: T.white }}>{p.sizeFrom?.toLocaleString()} - {p.sizeTo?.toLocaleString()} sqft</span></div>
                    <div><span style={{ fontSize: 9, color: T.textMuted, display: "block" }}>TYPE</span><span style={{ fontSize: 12, color: T.textSecondary }}>{p.type} · {p.beds} BR</span></div>
                    <div><span style={{ fontSize: 9, color: T.textMuted, display: "block" }}>PAYMENT</span><span style={{ fontSize: 12, color: T.textSecondary }}>{p.payment}</span></div>
                  </div>
                  {/* Unit Inventory */}
                  {p.units && <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${T.border}` }}>
                    <div style={{ fontSize: 9, color: T.textMuted, marginBottom: 6, fontWeight: 600, letterSpacing: 0.5 }}>UNIT AVAILABILITY</div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {getUnitEntries(p.units).map(([type, d]) => {
                        const avail = d.total - d.sold;
                        return (
                          <div key={type} style={{ padding: "4px 8px", borderRadius: 6, background: T.surfaceAlt, fontSize: 10, display: "flex", gap: 4, alignItems: "center" }}>
                            <span style={{ fontWeight: 700, color: T.white, textTransform: "uppercase" }}>{type}</span>
                            <span style={{ color: avail > 0 ? T.green : T.red }}>{avail > 0 ? `${avail} left` : "Sold out"}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>}
                  <div style={{ marginTop: 8, padding: "4px 8px", borderRadius: 6, background: T.surfaceAlt, display: "inline-block" }}>
                    <span style={{ fontSize: 10, color: T.textMuted }}>{p.tier}</span>
                  </div>
                  {/* Action Buttons */}
                  <div style={{ display: "flex", gap: 6, marginTop: 10 }} onClick={e => e.stopPropagation()}>
                    {isPro ? (<>
                    <a href={whatsappLink(p.name, p.community)} target="_blank" rel="noopener noreferrer" style={{ flex: 1, padding: "8px 0", background: "#25D366", borderRadius: 8, color: "#fff", fontSize: 11, fontWeight: 600, textAlign: "center", textDecoration: "none" }}>
                      WhatsApp
                    </a>
                    <a href={`mailto:mianwaleed689@gmail.com?subject=Inquiry: ${p.name}&body=Hi, I'm interested in ${p.name} at ${p.community}. Please share details.`} style={{ flex: 1, padding: "8px 0", background: T.gold, borderRadius: 8, color: T.bg, fontSize: 11, fontWeight: 600, textAlign: "center", textDecoration: "none" }}>
                      Email
                    </a>
                    <a href="tel:+971542410599" style={{ padding: "8px 10px", background: T.teal, borderRadius: 8, color: "#fff", fontSize: 11, fontWeight: 600, textAlign: "center", textDecoration: "none" }}>
                      📞
                    </a>
                    </>) : (<>
                    <button type="button" onClick={() => setShowUpgrade(true)} style={{ flex: 1, padding: "8px 0", background: "rgba(37,211,102,0.15)", borderRadius: 8, color: "rgba(37,211,102,0.5)", fontSize: 11, fontWeight: 600, textAlign: "center", border: "none", cursor: "pointer", fontFamily: "'Outfit', sans-serif" }}>🔒 WhatsApp</button>
                    <button type="button" onClick={() => setShowUpgrade(true)} style={{ flex: 1, padding: "8px 0", background: "rgba(212,168,67,0.1)", borderRadius: 8, color: "rgba(212,168,67,0.5)", fontSize: 11, fontWeight: 600, textAlign: "center", border: "none", cursor: "pointer", fontFamily: "'Outfit', sans-serif" }}>🔒 Email</button>
                    <button type="button" onClick={() => setShowUpgrade(true)} style={{ padding: "8px 10px", background: "rgba(0,191,165,0.1)", borderRadius: 8, color: "rgba(0,191,165,0.5)", fontSize: 11, fontWeight: 600, textAlign: "center", border: "none", cursor: "pointer" }}>🔒</button>
                    </>)}
                    <button type="button" onClick={(e) => { e.stopPropagation(); toggleWatchlist(p); }} style={{ padding: "8px 10px", background: watchlist.find(w => w.id === p.id) ? "rgba(212,168,67,0.15)" : T.surfaceAlt, border: `1px solid ${watchlist.find(w => w.id === p.id) ? T.gold : T.border}`, borderRadius: 8, color: watchlist.find(w => w.id === p.id) ? T.gold : T.textMuted, fontSize: 14, cursor: "pointer" }} title={watchlist.find(w => w.id === p.id) ? "Remove from watchlist" : "Add to watchlist"}>
                      {watchlist.find(w => w.id === p.id) ? "★" : "☆"}
                    </button>
                    <button type="button" onClick={(e) => { e.stopPropagation(); isPro ? toggleCompare(p) : setShowUpgrade(true); }} style={{ padding: "8px 10px", background: !isPro ? "rgba(212,168,67,0.05)" : compareList.find(x=>x.id===p.id) ? T.goldGlow : T.surfaceAlt, border: `1px solid ${!isPro ? T.border : compareList.find(x=>x.id===p.id) ? T.gold : T.border}`, borderRadius: 8, color: !isPro ? T.textMuted : compareList.find(x=>x.id===p.id) ? T.gold : T.textMuted, fontSize: 11, cursor: "pointer", fontFamily: "'Outfit', sans-serif" }}>
                      {!isPro ? "🔒" : compareList.find(x=>x.id===p.id) ? "✓" : "⊕"}
                    </button>
                    <button type="button" title={myAlerts.find(a => a.projectId === p.id && !a.triggered) ? "Alert active" : "Set Price Alert"} onClick={(e) => { e.stopPropagation(); if (!isPro) { setShowUpgrade(true); return; } setShowSetAlert(p); setAlertForm({ type: "price_below", value: p.price ? p.price.toString() : "" }); }} style={{ padding: "8px 10px", background: myAlerts.find(a => a.projectId === p.id && !a.triggered) ? "rgba(212,168,67,0.15)" : T.surfaceAlt, border: `1px solid ${myAlerts.find(a => a.projectId === p.id && !a.triggered) ? T.gold : T.border}`, borderRadius: 8, color: myAlerts.find(a => a.projectId === p.id && !a.triggered) ? T.gold : T.textMuted, fontSize: 13, cursor: "pointer" }}>
                      {myAlerts.find(a => a.projectId === p.id && !a.triggered) ? "🔔" : "🔕"}
                    </button>
                  </div>
                  </div>{/* end padding wrapper */}
                </div>
              );})}
              {activeProjects.filter(p => { const ms = !projectSearch || p.name.toLowerCase().includes(projectSearch.toLowerCase()) || p.community.toLowerCase().includes(projectSearch.toLowerCase()); const mf = projectFilter === "All" || p.district === projectFilter || (projectFilter === "Branded" && p.branded); const mt = projectTier === "All" || p.tier === projectTier; const my = projectHandover === "All" || (projectHandover === "2030+" ? parseInt(p.handover) >= 2030 : p.handover?.includes(projectHandover)); const mp = projectPriceMax >= 20 || !p.price || p.price <= projectPriceMax * 1e6; return ms && mf && mt && my && mp; }).length === 0 && (
                <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "48px 20px" }}>
                  <div style={{ fontSize: 36, marginBottom: 12, opacity: 0.4 }}>🔍</div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: T.white, marginBottom: 4 }}>No projects found</div>
                  <div style={{ fontSize: 13, color: T.textMuted }}>Try adjusting your search or filter</div>
                </div>
              )}
            </div>
            )}

            {/* Community Summary */}
            <Section title="Communities Overview" sub="11 master-planned communities">
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12, marginTop: 16 }}>
                {emaarCommunities.filter(c => c.name).map((c, i) => (
                  <div key={c.district} className="chart-box fade-up" style={{ animationDelay: `${i*0.05}s`, padding: 14, cursor: "pointer", transition: "border 0.2s" }} onClick={() => setSelectedCommunity(c.name)} title="Click for full community details">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <div>
                        <span style={{ fontFamily: "'Fraunces', serif", fontSize: 14, fontWeight: 700, color: T.gold }}>{c.district}</span>
                        <span style={{ fontSize: 11, color: T.textSecondary, marginLeft: 8 }}>{c.name}</span>
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 600, color: T.teal }}>{c.projects} projects</span>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, fontSize: 11 }}>
                      <div><span style={{ color: T.textMuted, fontSize: 9, display: "block" }}>AVG PPSF</span><span style={{ color: T.white, fontWeight: 600 }}>{c.avgPpsf ? `AED ${c.avgPpsf.toLocaleString()}` : "—"}</span></div>
                      <div><span style={{ color: T.textMuted, fontSize: 9, display: "block" }}>YIELD</span><span style={{ color: T.white, fontWeight: 600 }}>{c.avgYield ? `${c.avgYield}%` : "—"}</span></div>
                      <div><span style={{ color: T.textMuted, fontSize: 9, display: "block" }}>ACRES</span><span style={{ color: T.white, fontWeight: 600 }}>{c.acres ? c.acres.toLocaleString() : "—"}</span></div>
                    </div>
                    <div style={{ fontSize: 10, color: T.textMuted, marginTop: 6 }}>{c.buyer} · {c.strengths}</div>
                  </div>
                ))}
              </div>
            </Section>


            {/* Mega Projects */}
            <Section title="Mega Projects Pipeline" sub="Strategic developments 2026-2035 · AED 800B+ combined value · Global benchmarks & DLD price data · Click any project for deep analysis">
              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12, marginTop: 16 }}>
                {megaProjects.map((m, i) => {
                  const isOpen = expandedMega === m.name;
                  const mStatus = m.status || "Planned";
                  return (
                  <div key={m.name} className="chart-box fade-up" style={{ animationDelay: `${i*0.05}s`, padding: 0, overflow: "hidden", cursor: "pointer", border: isOpen ? `1px solid ${T.gold}` : undefined }} onClick={() => setExpandedMega(isOpen ? null : m.name)}>
                    <div style={{ padding: 16, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                      <div style={{ flex: "1 1 200px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                          <div style={{ fontFamily: "'Fraunces', serif", fontSize: 16, fontWeight: 700, color: T.gold }}>{m.name}</div>
                          <span style={{ fontSize: 9, padding: "2px 8px", borderRadius: 6, background: mStatus === "Under Construction" ? "rgba(16,185,129,0.12)" : mStatus.includes("Active") || mStatus.includes("Partial") ? "rgba(234,179,8,0.12)" : "rgba(99,102,241,0.12)", color: mStatus === "Under Construction" ? T.green : mStatus.includes("Active") || mStatus.includes("Partial") ? T.gold : T.blue, fontWeight: 600 }}>{mStatus}</span>
                        </div>
                        <div style={{ fontSize: 11, color: T.textSecondary, marginTop: 3 }}>{m.community} &middot; {m.type} &middot; {m.developer || "Emaar"}</div>
                      </div>
                      <div style={{ display: "flex", gap: 20, flexWrap: "wrap", alignItems: "center" }}>
                        <div><span style={{ fontSize: 9, color: T.textMuted, display: "block" }}>VALUE</span><span style={{ fontSize: 14, fontWeight: 700, color: T.white }}>{m.value}</span></div>
                        <div><span style={{ fontSize: 9, color: T.textMuted, display: "block" }}>TIMELINE</span><span style={{ fontSize: 13, fontWeight: 600, color: T.teal }}>{m.timeline}</span></div>
                        <span style={{ fontSize: 14, color: T.textMuted, transition: "transform 0.3s", transform: isOpen ? "rotate(180deg)" : "rotate(0)" }}>&#9660;</span>
                      </div>
                    </div>
                    {isOpen && (
                      <div style={{ padding: "0 16px 16px", borderTop: `1px solid ${T.border}` }} onClick={e => e.stopPropagation()}>
                        <p style={{ fontSize: 13, color: T.textSecondary, lineHeight: 1.7, margin: "14px 0" }}>{m.desc || m.feature || "Details coming soon."}</p>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12, marginTop: 12 }}>
                          <div style={{ background: T.surfaceAlt, borderRadius: 10, padding: 14 }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: T.gold, marginBottom: 8, letterSpacing: 0.5 }}>KEY FACTS</div>
                            {m.keyFacts && m.keyFacts.map((f, fi) => (
                              <div key={fi} style={{ fontSize: 11, color: T.textSecondary, padding: "3px 0", display: "flex", gap: 6, alignItems: "flex-start" }}>
                                <span style={{ color: T.gold, fontSize: 8, marginTop: 4, flexShrink: 0 }}>&bull;</span><span>{f}</span>
                              </div>
                            ))}
                          </div>
                          <div>
                            <div style={{ background: T.surfaceAlt, borderRadius: 10, padding: 14, marginBottom: 12 }}>
                              <div style={{ fontSize: 11, fontWeight: 700, color: T.green, marginBottom: 6, letterSpacing: 0.5 }}>INVESTOR IMPACT</div>
                              <div style={{ fontSize: 12, color: T.textSecondary, lineHeight: 1.6 }}>{m.investorImpact || "Impact analysis coming soon."}</div>
                            </div>
                            {m.benchmark && (
                            <div style={{ background: T.surfaceAlt, borderRadius: 10, padding: 14, marginBottom: 12 }}>
                              <div style={{ fontSize: 11, fontWeight: 700, color: "#a78bfa", marginBottom: 6, letterSpacing: 0.5 }}>GLOBAL BENCHMARK</div>
                              <div style={{ fontSize: 12, color: T.textSecondary, lineHeight: 1.6 }}>{m.benchmark}</div>
                            </div>
                            )}
                            {m.priceImpact && (
                            <div style={{ background: T.surfaceAlt, borderRadius: 10, padding: 14, marginBottom: 12 }}>
                              <div style={{ fontSize: 11, fontWeight: 700, color: "#f59e0b", marginBottom: 6, letterSpacing: 0.5 }}>PRICE IMPACT DATA</div>
                              <div style={{ fontSize: 12, color: T.textSecondary, lineHeight: 1.6 }}>{m.priceImpact}</div>
                            </div>
                            )}
                            <div style={{ background: T.surfaceAlt, borderRadius: 10, padding: 14, marginBottom: 12 }}>
                              <div style={{ fontSize: 11, fontWeight: 700, color: T.teal, marginBottom: 6, letterSpacing: 0.5 }}>COMPLETION STATUS</div>
                              <div style={{ fontSize: 12, color: T.textSecondary, lineHeight: 1.6 }}>{m.completion || m.timeline}</div>
                            </div>
                            {m.milestones && (
                            <div style={{ background: T.surfaceAlt, borderRadius: 10, padding: 14 }}>
                              <div style={{ fontSize: 11, fontWeight: 700, color: T.blue, marginBottom: 8, letterSpacing: 0.5 }}>CONSTRUCTION MILESTONES</div>
                              {m.milestones.map((ms, msi) => (
                                <div key={msi} style={{ display: "flex", gap: 8, marginBottom: 4 }}>
                                  <span style={{ fontSize: 11, color: T.blue }}>●</span>
                                  <span style={{ fontSize: 11, color: T.textSecondary, lineHeight: 1.5 }}>{ms}</span>
                                </div>
                              ))}
                            </div>
                            )}
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 16, marginTop: 14, flexWrap: "wrap", padding: "10px 0 0", borderTop: `1px solid ${T.border}` }}>
                          <div style={{ fontSize: 10, color: T.textMuted }}>Developer: <span style={{ color: T.white, fontWeight: 600 }}>{m.developer || "Emaar"}</span></div>
                          <div style={{ fontSize: 10, color: T.textMuted }}>Announced: <span style={{ color: T.white, fontWeight: 600 }}>{m.announced || "—"}</span></div>
                          <div style={{ fontSize: 10, color: T.textMuted }}>Scale: <span style={{ color: T.white, fontWeight: 600 }}>{m.scale}</span></div>
                        </div>
                        {m.sources && (
                        <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px solid ${T.border}` }}>
                          <div style={{ fontSize: 9, color: T.textMuted, fontStyle: "italic" }}>Sources: {m.sources}</div>
                        </div>
                        )}
                      </div>
                    )}
                  </div>
                );})}
              </div>
            </Section>
          </>}

          {/* ─── PORTFOLIO TAB ─── */}
          {tab === "Portfolio" && <>

            {/* MY INVESTMENTS TRACKER */}
            <Section title="My Investments" sub={myPortfolio.length > 0 ? `${myPortfolio.length} holdings` : "Track your Emaar investments"}>
              {myPortfolio.length > 0 ? <>
                <div className="kpi-grid" style={{ display: "grid", gap: 12, marginTop: 16 }}>
                  <KPI label="Total Invested" value={`AED ${(myPortfolio.reduce((s,h) => s+(h.investedAmount||0), 0)/1e6).toFixed(2)}M`} sub={`${myPortfolio.length} holdings`} delay={1} />
                  <KPI label="Projected Value" value={`AED ${(myPortfolio.reduce((s,h) => { const p = activeProjects.find(x => x.id === h.projectId); const ppsf = p ? p.ppsf : 2500; const appr = ppsf > 2500 ? 1.15 : ppsf > 2000 ? 1.20 : 1.25; return s + (h.investedAmount||0) * appr; }, 0)/1e6).toFixed(2)}M`} sub="15-25% appreciation" delay={2} />
                  <KPI label="Avg Yield" value={`${(myPortfolio.reduce((s,h) => { const p = activeProjects.find(x => x.id === h.projectId); const comm = p ? emaarCommunities.find(c => c.name === p.community) : null; return s + (comm ? comm.avgYield : 5); }, 0) / (myPortfolio.length || 1)).toFixed(1)}%`} sub="Across portfolio" delay={3} />
                  <KPI label="Total Units" value={myPortfolio.reduce((s,h) => s+(h.units||0), 0)} sub="Properties" delay={4} />
                </div>
                <div style={{ marginTop: 16, display: "flex", justifyContent: "flex-end" }}>
                  <button type="button" onClick={() => setShowAddPortfolio(true)} style={{ padding: "8px 20px", background: T.gold, color: T.bg, border: "none", borderRadius: 8, fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "'Outfit', sans-serif" }}>+ Add Investment</button>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 12, marginTop: 12 }}>
                  {myPortfolio.map((h, i) => {
                    const p = activeProjects.find(x => x.id === h.projectId);
                    if (!p) return null;
                    const appr = p.ppsf > 2500 ? 1.15 : p.ppsf > 2000 ? 1.20 : 1.25;
                    const projected = h.investedAmount * appr;
                    const gain = ((appr - 1) * 100).toFixed(0);
                    return (
                      <div key={i} className="chart-box fade-up" style={{ padding: 16, animationDelay: `${i*0.03}s` }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                          <div>
                            <div style={{ fontFamily: "'Fraunces', serif", fontSize: 15, fontWeight: 700, color: T.white }}>{p.name}</div>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                              <span style={{ fontSize: 10, color: T.textMuted }}>{p.community} · {h.unitType} · {h.units} unit{h.units > 1 ? "s" : ""}</span>
                              {p.emaarUrl && <a href={p.emaarUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 9, color: T.gold, textDecoration: "none", padding: "1px 5px", border: "1px solid rgba(212,168,67,0.3)", borderRadius: 4, fontWeight: 600 }}>{getLinkLabel(p.emaarUrl)}</a>}
                            </div>
                          </div>
                          <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 6, background: "rgba(16,185,129,0.12)", color: T.green, fontWeight: 700 }}>+{gain}%</span>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
                          <div><div style={{ fontSize: 9, color: T.textMuted }}>INVESTED</div><div style={{ fontSize: 14, fontWeight: 700, color: T.gold }}>AED {(h.investedAmount/1e6).toFixed(2)}M</div></div>
                          <div><div style={{ fontSize: 9, color: T.textMuted }}>PROJECTED</div><div style={{ fontSize: 14, fontWeight: 700, color: T.green }}>AED {(projected/1e6).toFixed(2)}M</div></div>
                        </div>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
                          <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, background: T.surfaceAlt, color: T.textMuted }}>{p.handover}</span>
                          {(() => { const cd = getHandoverCountdown(p.handover); return cd ? <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, fontWeight: 700, color: cd.passed ? "#10B981" : cd.color, background: cd.passed ? "rgba(16,185,129,0.1)" : cd.urgent ? "rgba(239,68,68,0.1)" : "rgba(212,168,67,0.08)" }}>{cd.passed ? "\u2713 Ready" : "\u23F1 " + cd.label}</span> : null; })()}
                          <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, background: T.surfaceAlt, color: T.textMuted }}>AED {p.ppsf}/sqft</span>
                          {p.branded && <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, background: "rgba(212,168,67,0.12)", color: T.gold }}>{p.brand}</span>}
                        </div>
                        {h.notes && <div style={{ fontSize: 10, color: T.textMuted, fontStyle: "italic", marginBottom: 6 }}>{h.notes}</div>}
                        {p.construction > 0 && <div style={{ marginBottom: 6 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: T.textMuted, marginBottom: 3 }}><span>Construction</span><span>{p.construction}%</span></div>
                          <div style={{ height: 4, borderRadius: 2, background: T.surfaceAlt }}><div style={{ height: "100%", borderRadius: 2, background: T.teal, width: `${p.construction}%` }} /></div>
                        </div>}
                        <button type="button" onClick={() => removeFromPortfolio(h.projectId, h.unitType)} style={{ marginTop: 4, background: "none", border: "none", color: T.textMuted, fontSize: 10, cursor: "pointer", padding: 0 }}>Remove</button>
                      </div>
                    );
                  })}
                </div>
              </> : <div style={{ textAlign: "center", padding: "40px 20px" }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>📊</div>
                <div style={{ fontFamily: "'Fraunces', serif", fontSize: 18, fontWeight: 800, color: T.white, marginBottom: 8 }}>Start Tracking Your Investments</div>
                <div style={{ fontSize: 12, color: T.textMuted, maxWidth: 360, margin: "0 auto 16px", lineHeight: 1.6 }}>Add your Emaar property investments to track performance, projected returns, and portfolio allocation.</div>
                <button type="button" onClick={() => setShowAddPortfolio(true)} style={{ padding: "10px 24px", background: `linear-gradient(135deg, ${T.gold}, #B8912F)`, color: T.bg, border: "none", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "'Outfit', sans-serif" }}>+ Add Your First Investment</button>
              </div>}
            </Section>

            <Section title="Project Portfolio" sub="48 active projects · 10+ master communities · 2026–2030">
              <div className="kpi-grid" style={{ display: "grid", gap: 12, marginTop: 16 }}>
                <KPI label="Total Projects" value={activeProjects.length} sub="18 under construction · 30 off-plan" delay={1} onClick={() => setSelectedKPI({ label: "Total Projects", value: "48", color: T.gold, description: "48 active Emaar projects across UAE — 18 under active construction and 30 in the off-plan/pre-launch phase across 10+ master communities.", source: "DXB Analytics Project Database", sourceUrl: "#", items: [{ label: "Under Construction", value: "18", note: "Active building" }, { label: "Off-Plan", value: "30", note: "Pre-launch / launched" }, { label: "Communities", value: "11", note: "Master-planned areas" }, { label: "Handover 2026", value: "7 projects", note: "Nearest deliveries" }, { label: "Handover 2029+", value: "26 projects", note: "Longest pipeline" }], trend: null })} />
                <KPI label="Branded Projects" value="10" sub="Address · Vida · Palace" delay={2} onClick={() => setSelectedKPI({ label: "Branded Projects", value: "10", color: T.teal, description: "10 branded residences under Emaar's luxury hospitality labels — Address, Vida, and Palace. Branded units command 25–40% price premium over standard Emaar projects.", source: "Emaar Properties Portfolio 2025", sourceUrl: "https://www.emaar.com/en/investor-relations/", items: [{ label: "Address Brand", value: "5 projects", note: "Ultra-luxury tier" }, { label: "Vida Brand", value: "3 projects", note: "Lifestyle tier" }, { label: "Palace Brand", value: "2 projects", note: "Heritage luxury" }, { label: "Price Premium", value: "25–40%", note: "vs standard Emaar" }, { label: "Resale Premium", value: "Strong", note: "Brand demand maintained" }], trend: null })} />
                <KPI label="Avg Starting Price" value="AED 2.76M" sub="Range: 1.2M – 13.8M" delay={3} onClick={() => setSelectedKPI({ label: "Avg Starting Price", value: "AED 2.76M", color: T.blue, description: "Average entry price across the active Emaar project portfolio. Range spans from AED 1.2M (Emaar South 1BR) to AED 13.8M (The Oasis ultra-luxury villas).", source: "DXB Analytics · Emaar Price List 2025", sourceUrl: "https://www.emaar.com/en/investor-relations/", items: [{ label: "Avg Starting Price", value: "AED 2.76M", note: "Portfolio average" }, { label: "Min Price", value: "AED 1.2M", note: "Emaar South 1BR" }, { label: "Max Price", value: "AED 13.8M", note: "The Oasis villas" }, { label: "Studio Entry", value: "AED 900K+", note: "Select communities" }, { label: "Villa Entry", value: "AED 3.5M+", note: "Dubai Hills / Valley" }], trend: [{ y: "2021", v: 1.8 }, { y: "2022", v: 2.1 }, { y: "2023", v: 2.3 }, { y: "2024", v: 2.55 }, { y: "2025", v: 2.76 }] })} />
                <KPI label="Avg Price/sqft" value="AED 2,570" sub="Across all tiers" delay={4} onClick={() => setSelectedKPI({ label: "Avg Price/sqft", value: "AED 2,570", color: T.purple, description: "Average price per square foot across all active Emaar launches. Premium branded projects push the average higher vs affordable communities.", source: "DXB Analytics · DLD 2025", sourceUrl: "https://dubailand.gov.ae", items: [{ label: "Portfolio Avg", value: "AED 2,570/sqft", note: "All projects" }, { label: "Branded Avg", value: "AED 3,500+/sqft", note: "Address / Palace" }, { label: "Standard Avg", value: "AED 1,900/sqft", note: "Emaar South / Valley" }, { label: "Downtown", value: "AED 2,800+/sqft", note: "Prime location premium" }, { label: "Creek Harbour", value: "AED 2,400/sqft", note: "Waterfront" }], trend: [{ y: "2021", v: 1450 }, { y: "2022", v: 1750 }, { y: "2023", v: 2100 }, { y: "2024", v: 2350 }, { y: "2025", v: 2570 }] })} />
              </div>
            </Section>

            <div className="chart-grid-2" style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 16, marginTop: 20 }}>
              <Chart title="Projects by Community">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={communityProjects} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis type="number" tick={{ fill: T.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="full" tick={{ fill: T.textSecondary, fontSize: 11 }} width={140} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="projects" fill={T.gold} name="Projects" radius={[0, 8, 8, 0]} barSize={20}>
                      {communityProjects.map((c, i) => <Cell key={i} fill={i === 0 ? T.gold : i < 3 ? T.teal : T.blue} opacity={1 - i * 0.06} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Chart>

              <div>
                <h3 style={{ fontSize: 11, fontWeight: 600, color: T.goldLight, letterSpacing: 1, textTransform: "uppercase", marginBottom: 14 }}>Delivery Schedule</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {[["2026", "7", T.teal], ["2027", "5", T.gold], ["2028", "10", T.blue], ["2029", "26", T.purple]].map(([yr, ct, cl], i) => (
                    <div key={i} className="kpi-card" style={{ textAlign: "center" }}>
                      <div style={{ fontFamily: "'Fraunces', serif", fontSize: 28, fontWeight: 900, color: cl }}>{yr}</div>
                      <div style={{ fontSize: 12, color: T.textSecondary }}>{ct} projects</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <Section title="Community Details" sub="Yield ranges and pricing per community">
              <div className="table-scroll" style={{ overflowX: "auto", marginTop: 12 }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: `2px solid ${T.border}` }}>
                      {["Community", "Projects", "Yield Range", "Avg Price/sqft"].map(h => (
                        <th key={h} style={{ padding: "12px 14px", textAlign: "left", color: T.gold, fontWeight: 600, fontSize: 11, letterSpacing: 0.5, textTransform: "uppercase" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {communityProjects.map((c, i) => (
                      <tr key={i} style={{ borderBottom: `1px solid ${T.border}`, transition: "background 0.2s", cursor: "pointer" }} onMouseEnter={e => e.currentTarget.style.background = T.surfaceAlt} onMouseLeave={e => e.currentTarget.style.background = "transparent"} onClick={() => { const comm = emaarCommunities.find(x => x.name === c.full); if(comm) setSelectedCommunity(comm.name); }}>
                        <td style={{ padding: "12px 14px", color: T.white, fontWeight: 500 }}>{c.full}</td>
                        <td style={{ padding: "12px 14px", color: T.goldLight, fontFamily: "'Fraunces', serif", fontWeight: 600 }}>{c.projects}</td>
                        <td style={{ padding: "12px 14px", color: T.teal }}>{c.yield}</td>
                        <td style={{ padding: "12px 14px", color: T.textSecondary }}>AED {c.ppsf}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>

            <Section title="Investment Allocation Guide" sub="Strategy by buyer profile · Based on market research">
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 12, marginTop: 16 }}>
                {[
                  ["Yield Seeker", "AED 1.2M–2.5M", "Target: 5-6% gross yield. Best picks: The Valley 3BR townhouses, Emaar South 1BR apartments, Dubai Hills Estate 1BR. Payment plans (80/20) maximize leveraged returns. Hold 3-5 years minimum.", T.teal, "DHE · ES · TV"],
                  ["Capital Growth", "AED 2.5M–5M", "Target: 15-25% appreciation by handover. Best picks: Dubai Creek Harbour waterfront, Grand Polo Club villas, Emaar Beachfront 2BR. Buy early in launch phase for maximum upside.", T.gold, "DCH · GPC · EBF"],
                  ["Ultra-Luxury / Golden Visa", "AED 5M+", "Target: Lifestyle + 2M+ Golden Visa. Best picks: The Oasis villas, Address branded residences, Palace at Business Bay. Branded premium justifies pricing and resale.", T.purple, "TO · BB · EBF"],
                  ["Diversified Portfolio", "AED 3M–10M", "Split: 40% yield (Valley/South), 35% growth (Creek/Polo), 25% luxury (Beachfront/Oasis). Balances cash flow with appreciation. Rebalance at handover milestones.", T.blue, "Mixed"],
                ].map(([profile, budget, desc, color, areas], i) => (
                  <div key={i} className="chart-box fade-up" style={{ animationDelay: `${i*0.05}s`, padding: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <span style={{ fontFamily: "'Fraunces', serif", fontSize: 15, fontWeight: 700, color }}>{profile}</span>
                      <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 6, background: T.surfaceAlt, color: T.textSecondary }}>{budget}</span>
                    </div>
                    <div style={{ fontSize: 11, color: T.textMuted, lineHeight: 1.6, marginBottom: 8 }}>{desc}</div>
                    <div style={{ fontSize: 10, color, fontWeight: 600 }}>Best communities: {areas}</div>
                  </div>
                ))}
              </div>
            </Section>
          </>}

          {/* ─── COMPETITORS TAB ─── */}
          {tab === "Competitors" && <>
            <Section title="Developer Rankings" sub="DXBinteract verified · fam Properties analysis · 2025">
              <div className="kpi-grid" style={{ display: "grid", gap: 12, marginTop: 16 }}>
                <KPI label="Emaar % of Top 30" value="22.6%" sub="Dominant market leader" delay={1} onClick={() => setSelectedKPI({ label: "Emaar % of Top 30", value: "22.6%", color: T.gold, description: "Emaar accounts for 22.6% of all sales among the top 30 Dubai developers — nearly 1 in 4 AED of premium real estate sold in Dubai.", source: "DXBinteract · fam Properties 2025", sourceUrl: "https://dxbinteract.com", items: [{ label: "Emaar Sales", value: "AED 65.4B", note: "Top 30 portion" }, { label: "Top 30 Total", value: "AED 289B", note: "Combined sales" }, { label: "Market Share", value: "22.6%", note: "Of top 30 developers" }, { label: "Rank", value: "#1", note: "By sales value" }, { label: "#2 Developer", value: "DAMAC ~AED 35B", note: "1.83× smaller" }], trend: null })} />
                <KPI label="Lead vs #2" value="AED 29.9B" sub="1.83× larger than DAMAC" delay={2} onClick={() => setSelectedKPI({ label: "Lead vs #2", value: "AED 29.9B", color: T.teal, description: "Emaar leads #2 developer DAMAC by AED 29.9B in sales — a 1.83× advantage that has widened every year since 2022.", source: "DXBinteract 2025", sourceUrl: "https://dxbinteract.com", items: [{ label: "Emaar Sales", value: "AED 65.4B", note: "FY2025" }, { label: "DAMAC Sales", value: "~AED 35B", note: "#2 developer" }, { label: "Gap", value: "AED 29.9B", note: "1.83× advantage" }, { label: "2023 Gap", value: "~AED 12B", note: "Gap widening" }, { label: "2024 Gap", value: "~AED 20B", note: "Accelerating lead" }], trend: null })} />
                <KPI label="% of Dubai Total" value="9.6%" sub="Of AED 682.5B market" delay={3} onClick={() => setSelectedKPI({ label: "% of Dubai Total", value: "9.6%", color: T.blue, description: "Emaar captured 9.6% of Dubai's total AED 682.5B real estate market in 2025 — nearly 1 in every 10 AED transacted.", source: "DLD · DXBinteract 2025", sourceUrl: "https://dubailand.gov.ae", items: [{ label: "Dubai Total Market", value: "AED 682.5B", note: "All transactions 2025" }, { label: "Emaar Share", value: "AED 65.4B", note: "9.6% of total" }, { label: "2024 Share", value: "~8.1%", note: "Growing share" }, { label: "2023 Share", value: "~7.2%", note: "Consistent gain" }, { label: "Market Type", value: "Off-plan dominant", note: "60%+ of Dubai volume" }], trend: null })} />
                <KPI label="Delivered % Top 10" value="31%" sub="7,318 of 23,576 units" delay={4} onClick={() => setSelectedKPI({ label: "Delivered % Top 10", value: "31%", color: T.green, description: "Emaar delivered 31% of all units delivered by the top 10 developers in 2025 — 7,318 out of 23,576 total handovers.", source: "DXBinteract 2025", sourceUrl: "https://dxbinteract.com", items: [{ label: "Emaar Delivered", value: "7,318 units", note: "FY2025" }, { label: "Top 10 Total", value: "23,576 units", note: "Combined handovers" }, { label: "Emaar Share", value: "31%", note: "Of top 10 deliveries" }, { label: "On-Time Rate", value: "95%+", note: "Industry best" }, { label: "Since 2002", value: "125,600+", note: "Cumulative delivered" }], trend: null })} />
              </div>
            </Section>

            <ProGate isPro={isPro} message="Unlock Competitor Analysis" onUpgrade={() => setShowUpgrade(true)}>
            <Chart title="Sales Value (AED Billions) — Top 10 Developers" style={{ marginTop: 20 }}>
              <ResponsiveContainer width="100%" height={380}>
                <BarChart data={developers} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis type="number" tick={{ fill: T.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fill: T.textSecondary, fontSize: 12 }} width={70} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="sales" name="Sales (AED B)" radius={[0, 8, 8, 0]} barSize={22}>
                    {developers.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Chart>

            <div className="chart-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 20 }}>
              <Chart title="Units Sold (Volume)">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={developers} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis type="number" tick={{ fill: T.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" tick={{ fill: T.textSecondary, fontSize: 11 }} width={65} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="units" fill={T.teal} name="Units Sold" radius={[0, 6, 6, 0]} barSize={16} />
                  </BarChart>
                </ResponsiveContainer>
              </Chart>
              <Chart title="Units Under Construction">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={developers} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis type="number" tick={{ fill: T.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" tick={{ fill: T.textSecondary, fontSize: 11 }} width={65} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="underConst" fill={T.blue} name="Under Construction" radius={[0, 6, 6, 0]} barSize={16} />
                  </BarChart>
                </ResponsiveContainer>
              </Chart>
            </div>

            <Section title="Developer Profiles" sub="Verified from DXBinteract · Full year 2025">
              <div className="table-scroll" style={{ overflowX: "auto", marginTop: 12 }}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 800 }}>
                  <thead>
                    <tr style={{ borderBottom: `2px solid ${T.border}` }}>
                      {["#", "Developer", "Sales (AED B)", "Units Sold", "Market Share", "Under Const.", "Segment"].map(h => (
                        <th key={h} style={{ padding: "10px 12px", textAlign: h === "Developer" ? "left" : "center", color: T.gold, fontWeight: 600, fontSize: 10, letterSpacing: 0.5, textTransform: "uppercase" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {developers.map((d, i) => (
                      <tr key={i} style={{ borderBottom: `1px solid ${T.border}`, transition: "background 0.2s" }} onMouseEnter={e => e.currentTarget.style.background = T.surfaceAlt} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                        <td style={{ padding: "10px 12px", textAlign: "center", color: i === 0 ? T.gold : T.textMuted, fontWeight: 700, fontFamily: "'Fraunces', serif" }}>{d.rank}</td>
                        <td style={{ padding: "10px 12px", color: T.white, fontWeight: 600 }}>
                          <span style={{ borderLeft: `3px solid ${d.color}`, paddingLeft: 8 }}>{d.name}</span>
                        </td>
                        <td style={{ padding: "10px 12px", textAlign: "center", color: i === 0 ? T.gold : T.textSecondary, fontFamily: "'Fraunces', serif", fontWeight: 600 }}>{d.sales.toFixed(1)}</td>
                        <td style={{ padding: "10px 12px", textAlign: "center", color: T.textSecondary }}>{d.units.toLocaleString()}</td>
                        <td style={{ padding: "10px 12px", textAlign: "center", color: T.teal, fontWeight: 600 }}>{d.share}%</td>
                        <td style={{ padding: "10px 12px", textAlign: "center", color: T.textSecondary }}>{d.underConst.toLocaleString()}</td>
                        <td style={{ padding: "10px 12px", textAlign: "center" }}>
                          <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 6, background: T.surfaceAlt, color: T.textSecondary }}>{d.segment}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>

            <Section title="Emaar's Competitive Edge" sub="Why Emaar leads the market">
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12, marginTop: 16 }}>
                {[
                  ["Brand Premium", "20-40%", "Emaar commands higher prices per sqft vs competitors in same locations. Downtown Dubai and Emaar Beachfront average 25-40% premium over nearby non-Emaar developments.", T.gold],
                  ["Recurring Revenue", "AED 10.5B", "Unlike pure developers (DAMAC, Binghatti), Emaar generates 32% of EBITDA from malls, hotels, and commercial leasing — providing stability through market cycles.", T.teal],
                  ["Delivery Track Record", "125,600+", "More units delivered than any other UAE developer since 2002. Consistently on-time completion builds buyer confidence and justifies premium pricing.", T.green],
                  ["Revenue Backlog", "AED 155B", "3-4 years of pre-sold revenue at healthy margins. No other Dubai developer has this level of earnings visibility. De-risks future performance.", T.purple],
                ].map(([title, value, desc, color], i) => (
                  <div key={i} className="chart-box fade-up" style={{ animationDelay: `${i*0.05}s`, padding: 16 }}>
                    <div style={{ fontFamily: "'Fraunces', serif", fontSize: 24, fontWeight: 900, color }}>{value}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: T.white, marginTop: 4 }}>{title}</div>
                    <div style={{ fontSize: 11, color: T.textMuted, marginTop: 6, lineHeight: 1.5 }}>{desc}</div>
                  </div>
                ))}
              </div>
            </Section>
            </ProGate>
          </>}

          {/* ─── YIELDS TAB ─── */}
          {tab === "Yields" && <>
            <ProGate isPro={isPro} message="Unlock Rental Yield Analysis" onUpgrade={() => setShowUpgrade(true)}>
            <Section title="Rental Yield Analysis" sub="DLD Rental Index, Bayut, Property Finder · Launch prices">
              <Chart title="Gross Yield by Community & Unit Type (%)" style={{ marginTop: 16 }}>
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={liveYields.length > 0 ? liveYields : yields}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="label" tick={{ fill: T.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} angle={-30} textAnchor="end" height={50} />
                    <YAxis tick={{ fill: T.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 7]} />
                    <Tooltip content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const d = payload[0].payload;
                      return (
                        <div style={{ background: T.surface, border: `1px solid ${T.gold}`, borderRadius: 10, padding: "10px 14px", boxShadow: "0 12px 40px rgba(0,0,0,0.5)" }}>
                          <p style={{ color: T.gold, fontWeight: 700, margin: 0, fontSize: 12, fontFamily: "'Fraunces', serif" }}>{d.community} — {d.label}</p>
                          <p style={{ color: T.white, margin: "4px 0 0", fontSize: 12 }}>Rent: AED {d.rent}K/yr · Price: AED {d.price}K</p>
                          <p style={{ color: T.teal, margin: "2px 0 0", fontSize: 12 }}>Gross: {d.gross}% · Net: {d.net}% · {d.demand}</p>
                        </div>
                      );
                    }} />
                    <Bar dataKey="gross" name="Gross Yield %" radius={[6, 6, 0, 0]} barSize={30}>
                      {(liveYields.length > 0 ? liveYields : yields).map((y, i) => <Cell key={i} fill={y.demand === "V.High" ? T.gold : y.demand === "High" ? T.teal : T.blue} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Chart>
            </Section>

            <div className="kpi-grid" style={{ display: "grid", gap: 12, marginTop: 16 }}>
              <KPI label="Avg Gross Yield" value="4.5%" sub="Across all communities" delay={1} onClick={() => setSelectedKPI({ label: "Avg Gross Yield", value: "4.5%", color: T.gold, description: "Average gross rental yield across all Emaar communities and unit types. Based on DLD rental index and Emaar launch prices.", source: "DLD Rental Index · Bayut · Property Finder", sourceUrl: "https://dubailand.gov.ae", items: [{ label: "Avg Gross Yield", value: "4.5%", note: "All communities" }, { label: "Avg Net Yield", value: "~3.2%", note: "After service charges" }, { label: "vs Dubai Avg", value: "~5.0%", note: "Market benchmark" }, { label: "Best Community", value: "The Valley", note: "5.9% gross" }, { label: "Service Charges", value: "AED 12–18/sqft", note: "Annual avg" }], trend: null })} />
              <KPI label="Highest Yield" value="5.9%" sub="The Valley 3BR TH" delay={2} onClick={() => setSelectedKPI({ label: "Highest Yield", value: "5.9%", color: T.green, description: "The Valley 3BR Townhouse delivers the highest gross yield in the Emaar portfolio at 5.9%, driven by strong rental demand and affordable launch prices.", source: "DLD Rental Index · Property Finder 2025", sourceUrl: "https://propertyfinder.ae", items: [{ label: "Community", value: "The Valley", note: "Dubai-Al Ain Road" }, { label: "Unit Type", value: "3BR Townhouse", note: "High rental demand" }, { label: "Gross Yield", value: "5.9%", note: "Highest in portfolio" }, { label: "Annual Rent", value: "~AED 140K", note: "DLD index" }, { label: "Launch Price", value: "~AED 2.3M", note: "Emaar launch" }], trend: null })} />
              <KPI label="Lowest Yield" value="3.6%" sub="Downtown 2BR Apt" delay={3} onClick={() => setSelectedKPI({ label: "Lowest Yield", value: "3.6%", color: T.blue, description: "Downtown Dubai 2BR apartments have the lowest yield at 3.6% due to high purchase prices. However, capital appreciation potential offsets rental yield.", source: "DLD Rental Index · Bayut 2025", sourceUrl: "https://bayut.com", items: [{ label: "Community", value: "Downtown Dubai", note: "Premium location" }, { label: "Unit Type", value: "2BR Apartment", note: "High price entry" }, { label: "Gross Yield", value: "3.6%", note: "Lowest in portfolio" }, { label: "Cap Appreciation", value: "+18% in 2024", note: "Compensates yield" }, { label: "Avg Price/sqft", value: "AED 2,800+", note: "Premium pricing" }], trend: null })} />
              <KPI label="Avg Cash Flow" value="AED 62K" sub="Annual per unit" delay={4} onClick={() => setSelectedKPI({ label: "Avg Cash Flow", value: "AED 62K", color: T.teal, description: "Average annual net cash flow per unit across Emaar portfolio after service charges and management fees.", source: "DLD Rental Index · DXB Analytics", sourceUrl: "https://dubailand.gov.ae", items: [{ label: "Avg Annual Rent", value: "AED 88K", note: "Gross rental" }, { label: "Service Charges", value: "AED 18K", note: "Avg annual" }, { label: "Mgmt Fee", value: "AED 8K", note: "~9% of rent" }, { label: "Net Cash Flow", value: "AED 62K", note: "Annual average" }, { label: "Monthly", value: "~AED 5,167", note: "Per unit avg" }], trend: null })} />
            </div>

            <Section title="Detailed Yield Data" sub="All Emaar communities · Annual rents · Launch prices · Demand levels">
              <div className="table-scroll" style={{ overflowX: "auto", marginTop: 12 }}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 750 }}>
                  <thead>
                    <tr style={{ borderBottom: `2px solid ${T.border}` }}>
                      {["Community", "Unit Type", "Annual Rent", "Price", "Gross %", "Net %", "Demand", "Golden Visa"].map(h => (
                        <th key={h} style={{ padding: "10px 10px", textAlign: h === "Community" || h === "Unit Type" ? "left" : "center", color: T.gold, fontWeight: 600, fontSize: 10, letterSpacing: 0.5, textTransform: "uppercase" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(liveYields.length > 0 ? liveYields : yields).map((y, i) => (
                      <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }} onMouseEnter={e => e.currentTarget.style.background = T.surfaceAlt} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                        <td style={{ padding: "10px 10px", color: T.white, fontWeight: 500, fontSize: 12 }}>{y.community}</td>
                        <td style={{ padding: "10px 10px", color: T.textSecondary, fontSize: 12 }}>{y.label}</td>
                        <td style={{ padding: "10px 10px", textAlign: "center", color: T.textSecondary, fontSize: 12 }}>AED {y.rent}K</td>
                        <td style={{ padding: "10px 10px", textAlign: "center", color: T.textSecondary, fontSize: 12 }}>AED {y.price}K</td>
                        <td style={{ padding: "10px 10px", textAlign: "center", color: y.gross >= 5 ? T.green : y.gross >= 4 ? T.gold : T.textSecondary, fontWeight: 600, fontFamily: "'Fraunces', serif" }}>{y.gross}%</td>
                        <td style={{ padding: "10px 10px", textAlign: "center", color: T.textSecondary, fontFamily: "'Fraunces', serif" }}>{y.net}%</td>
                        <td style={{ padding: "10px 10px", textAlign: "center" }}>
                          <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 6, background: y.demand === "V.High" ? "rgba(16,185,129,0.15)" : y.demand === "High" ? "rgba(212,168,67,0.12)" : "rgba(59,130,246,0.12)", color: y.demand === "V.High" ? T.green : y.demand === "High" ? T.gold : T.blue }}>{y.demand}</span>
                        </td>
                        <td style={{ padding: "10px 10px", textAlign: "center", color: T.teal, fontSize: 11 }}>{y.visa || "≥2M"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>

            <Section title="ROI Framework" sub="Expected returns for Emaar off-plan investments">
              <Chart title="Return Range by Phase (%)" style={{ marginTop: 16 }}>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={roiPhases}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="phase" tick={{ fill: T.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: T.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="low" fill={T.teal} name="Low %" radius={[0, 0, 0, 0]} barSize={32} opacity={0.5} />
                    <Bar dataKey="high" fill={T.gold} name="High %" radius={[6, 6, 0, 0]} barSize={32} opacity={0.85} />
                  </BarChart>
                </ResponsiveContainer>
              </Chart>
            </Section>
            </ProGate>
          </>}

          {/* ─── MORTGAGE CALCULATOR TAB ─── */}
          {tab === "Mortgage" && (() => {
            const MortgageCalc = () => {
              const [selectedProjectId, setSelectedProjectId] = React.useState("");
              const [propPrice, setPropPrice] = React.useState(2000000);
              const [downPct, setDownPct] = React.useState(20);
              const [rate, setRate] = React.useState(4.5);
              const [years, setYears] = React.useState(25);
              const [isUAENational, setIsUAENational] = React.useState(false);
              const [grossYieldPct, setGrossYieldPct] = React.useState(6.5);

              React.useEffect(() => {
                if (!selectedProjectId) return;
                const p = activeProjects.find(x => String(x.id) === selectedProjectId);
                if (p && p.price) setPropPrice(p.price);
                if (p) {
                  const comm = emaarCommunities.find(c => c.name === p.community);
                  if (comm && comm.avgYield) setGrossYieldPct(comm.avgYield);
                }
              }, [selectedProjectId]);

              const downAmt = propPrice * downPct / 100;
              const loanAmt = propPrice - downAmt;
              const mr = rate / 100 / 12;
              const np = years * 12;
              const monthly = loanAmt * (mr * Math.pow(1+mr,np)) / (Math.pow(1+mr,np)-1);
              const dldFee = propPrice * 0.04;
              const agencyFee = propPrice * 0.02;
              const totalUpfront = downAmt + dldFee + agencyFee + 4200 + 580;
              const monthlyRent = propPrice * grossYieldPct / 100 / 12;
              const monthlyExpenses = (propPrice * 0.015 / 12) + (monthlyRent * 0.08);
              const netRent = monthlyRent - monthlyExpenses;
              const cashflow = netRent - monthly;
              const cashOnCash = (cashflow * 12 / totalUpfront) * 100;
              const fmt = n => "AED " + Math.round(n).toLocaleString();
              const fmtM = n => "AED " + (n/1e6).toFixed(2) + "M";

              const answers = [
                {
                  q: "Can I afford this?",
                  icon: "1️⃣",
                  answer: fmt(monthly) + " / month",
                  detail: "That’s your mortgage payment every month for " + years + " years. Based on " + downPct + "% down at " + rate + "% interest.",
                  color: T.gold,
                  bg: "rgba(212,168,67,0.08)",
                  border: "rgba(212,168,67,0.25)",
                },
                {
                  q: "Will rent cover my mortgage?",
                  icon: "2️⃣",
                  answer: cashflow >= 0 ? "Yes — you pocket " + fmt(cashflow) + "/mo" : "No — you top up " + fmt(Math.abs(cashflow)) + "/mo",
                  detail: "Estimated rent is " + fmt(monthlyRent) + "/mo. After service charges, management fees, and your mortgage, you " + (cashflow >= 0 ? "make a profit of " + fmt(cashflow) + " every month." : "need to cover a shortfall of " + fmt(Math.abs(cashflow)) + " per month."),
                  color: cashflow >= 0 ? T.green : "#EF4444",
                  bg: cashflow >= 0 ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.08)",
                  border: cashflow >= 0 ? "rgba(16,185,129,0.25)" : "rgba(239,68,68,0.25)",
                },
                {
                  q: "What’s my actual return on cash?",
                  icon: "3️⃣",
                  answer: cashOnCash.toFixed(1) + "% per year",
                  detail: "You put in " + fmtM(totalUpfront) + " of your own money (down payment + fees). Your annual return on that specific cash is " + cashOnCash.toFixed(1) + "%. A savings account gives ~4%. Dubai average is 5–8%.",
                  color: cashOnCash >= 5 ? T.green : cashOnCash >= 0 ? T.gold : "#EF4444",
                  bg: cashOnCash >= 5 ? "rgba(16,185,129,0.08)" : "rgba(212,168,67,0.08)",
                  border: cashOnCash >= 5 ? "rgba(16,185,129,0.25)" : "rgba(212,168,67,0.25)",
                },
                {
                  q: "How much do I need on day one?",
                  icon: "4️⃣",
                  answer: fmtM(totalUpfront),
                  detail: "Down payment " + fmtM(downAmt) + " + DLD transfer fee " + fmt(dldFee) + " (4%) + agency fee " + fmt(agencyFee) + " (2%) + mortgage registration AED 4,200 + valuation AED 580. Have this ready before you sign.",
                  color: T.blue,
                  bg: "rgba(59,130,246,0.08)",
                  border: "rgba(59,130,246,0.25)",
                },
              ];

              return (
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

                  {/* Project picker */}
                  <div style={{ background: T.surface, borderRadius: 16, border: "1px solid " + T.border, padding: 20 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: T.goldLight, letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>Step 1 — Pick a project (or set price manually below)</div>
                    <select value={selectedProjectId} onChange={e => setSelectedProjectId(e.target.value)} style={{ width: "100%", padding: "11px 14px", background: T.surfaceAlt, border: "1px solid " + T.border, borderRadius: 10, color: selectedProjectId ? T.white : T.textMuted, fontSize: 13, fontFamily: "'Outfit',sans-serif", cursor: "pointer" }}>
                      <option value="">— Choose a project to auto-fill price —</option>
                      {activeProjects.filter(p => p.price).map(p => <option key={p.id} value={String(p.id)}>{p.name} · {p.community} · AED {(p.price/1e6).toFixed(2)}M</option>)}
                    </select>
                  </div>

                  {/* Sliders */}
                  <div style={{ background: T.surface, borderRadius: 16, border: "1px solid " + T.border, padding: 24 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: T.goldLight, letterSpacing: 1, textTransform: "uppercase", marginBottom: 18 }}>Step 2 — Adjust your numbers</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 32px" }}>
                      {[
                        { label: "Property Price", value: propPrice, set: setPropPrice, min: 500000, max: 20000000, step: 100000, disp: fmtM(propPrice) },
                        { label: "Down Payment", value: downPct, set: setDownPct, min: isUAENational ? 15 : 20, max: 80, step: 1, disp: downPct + "% = " + fmtM(downAmt) },
                        { label: "Interest Rate", value: rate, set: setRate, min: 2, max: 12, step: 0.1, disp: rate + "% per year" },
                        { label: "Loan Term", value: years, set: setYears, min: 5, max: 25, step: 1, disp: years + " years" },
                        { label: "Expected Rental Yield", value: grossYieldPct, set: setGrossYieldPct, min: 3, max: 12, step: 0.1, disp: grossYieldPct + "% per year" },
                      ].map((f, i) => (
                        <div key={i} style={{ marginBottom: 20 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 7 }}>
                            <span style={{ fontSize: 12, color: T.textSecondary }}>{f.label}</span>
                            <span style={{ fontSize: 12, fontWeight: 700, color: T.gold }}>{f.disp}</span>
                          </div>
                          <input type="range" min={f.min} max={f.max} step={f.step} value={f.value} onChange={e => f.set(Number(e.target.value))} style={{ width: "100%", accentColor: T.gold, cursor: "pointer" }} />
                        </div>
                      ))}
                      <div style={{ display: "flex", alignItems: "center" }}>
                        <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 12, color: T.textSecondary }}>
                          <input type="checkbox" checked={isUAENational} onChange={e => { setIsUAENational(e.target.checked); if (e.target.checked && downPct < 15) setDownPct(15); }} style={{ accentColor: T.gold, width: 16, height: 16 }} />
                          I am a UAE National (15% min down)
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* The 4 plain-English answers */}
                  <div style={{ fontSize: 11, fontWeight: 700, color: T.goldLight, letterSpacing: 1, textTransform: "uppercase" }}>Step 3 — Your answers</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    {answers.map((a, i) => (
                      <div key={i} style={{ background: a.bg, borderRadius: 16, border: "1px solid " + a.border, padding: 22 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                          <span style={{ fontSize: 20 }}>{a.icon}</span>
                          <span style={{ fontSize: 13, fontWeight: 700, color: T.white }}>{a.q}</span>
                        </div>
                        <div style={{ fontFamily: "'Fraunces',serif", fontSize: 26, fontWeight: 900, color: a.color, marginBottom: 10 }}>{a.answer}</div>
                        <div style={{ fontSize: 12, color: T.textSecondary, lineHeight: 1.6 }}>{a.detail}</div>
                      </div>
                    ))}
                  </div>

                </div>
              );
            };
            return (
              <Section title="Mortgage Calculator" sub="4 questions every Dubai property buyer needs answered">
                <MortgageCalc />
              </Section>
            );
          })()}

          {/* ─── MAP / COMMUNITIES TAB ─── */}
          {tab === "Map" && <CommunityMapTab activeProjects={activeProjects} liveCommunityROI={liveCommunityROI} setTab={setTab} />}

          {/* ─── RISK TAB ─── */}
          {tab === "Risk" && <>
            <Section title="9-Factor Risk Assessment" sub="Overall: LOW-MODERATE · Investment Grade · BBB+/Baa1/BBB">
              <div className="kpi-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginTop: 16 }}>
                <KPI label="Avg Risk Score" value="38.3" sub="LOW-MODERATE overall" delay={1} onClick={() => setSelectedKPI({ label: "Avg Risk Score", value: "38.3 / 140", color: T.teal, description: "Composite risk score across 9 factors. Score of 38.3 out of 140 max = LOW-MODERATE risk. Rated Investment Grade by S&P (BBB+), Moody's (Baa1), and Fitch (BBB).", source: "DXB Analytics · Fitch · S&P · Moody's", sourceUrl: "https://www.fitchratings.com", items: [{ label: "Overall Score", value: "38.3/140", note: "LOW-MODERATE" }, { label: "S&P Rating", value: "BBB+", note: "Stable outlook" }, { label: "Moody's", value: "Baa1", note: "Stable outlook" }, { label: "Fitch", value: "BBB", note: "Stable outlook" }, { label: "Risk Category", value: "Investment Grade", note: "3 agency consensus" }], trend: null })} />
                <KPI label="Highest Risk" value="125" sub="Premium Pricing" delay={2} onClick={() => setSelectedKPI({ label: "Highest Risk Factor", value: "Premium Pricing", color: T.red, description: "Premium pricing (score 125/140) is Emaar's highest risk factor. At 20–40% above competitors, a market downturn could compress sales volumes faster than peers.", source: "DXB Analytics Risk Model", sourceUrl: "#", items: [{ label: "Risk Score", value: "125/140", note: "Highest risk factor" }, { label: "Price Premium", value: "20–40%", note: "vs comparable developments" }, { label: "Mitigation", value: "80/20 plans", note: "Reduces buyer barrier" }, { label: "Branded Premium", value: "Justified", note: "Address · Vida · Palace" }, { label: "Demand Buffer", value: "AED 155B backlog", note: "Pre-sold revenue" }], trend: null })} />
                <KPI label="Lowest Risk" value="1" sub="Liquidity / Exit" delay={3} onClick={() => setSelectedKPI({ label: "Lowest Risk Factor", value: "Liquidity / Exit", color: T.green, description: "Emaar has the lowest liquidity risk (score 1/140) of any Dubai developer. DFM-listed, investment-grade rated, with AED 30.5B free cash flow and a globally recognized brand.", source: "DXB Analytics Risk Model · DFM", sourceUrl: "https://www.dfm.ae", items: [{ label: "Risk Score", value: "1/140", note: "Lowest risk factor" }, { label: "Free Cash Flow", value: "AED 30.5B", note: "FY2025" }, { label: "Net Cash", value: "AED 7.5B", note: "Cash vs debt" }, { label: "DFM Listed", value: "Yes", note: "High liquidity stock" }, { label: "Debt/Equity", value: "0.11×", note: "Very low leverage" }], trend: null })} />
              </div>
            </Section>
            <ProGate isPro={isPro} message="Unlock Full Risk Analysis" onUpgrade={() => setShowUpgrade(true)}>
              <Chart title="Risk Score by Factor (Higher = More Risk)" style={{ marginTop: 20 }}>
                <ResponsiveContainer width="100%" height={380}>
                  <BarChart data={risks} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis type="number" tick={{ fill: T.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 140]} />
                    <YAxis type="category" dataKey="factor" tick={{ fill: T.textSecondary, fontSize: 11 }} width={120} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="score" name="Risk Score" radius={[0, 8, 8, 0]} barSize={22}>
                      {risks.map((r, i) => <Cell key={i} fill={r.color} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Chart>

            <Section title="Mitigation Strategies" sub="How Emaar mitigates key risks">
              <div className="chart-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 16 }}>
                {[
                  ["Market Cycle", "AED 155B backlog = 3-4yr cushion. 35% recurring from malls/hotels.", T.orange],
                  ["Supply Competition", "Brand premium 20-40%. 79K delivery track record. 14+ master communities.", T.gold],
                  ["Premium Pricing", "80/20 payment plans reduce barrier. Branded residences justify premium.", T.red],
                  ["Geographic Conc.", "+124% intl sales YoY. Expanding to Saudi, Egypt, India.", T.teal],
                ].map(([title, desc, color], i) => (
                  <div key={i} className="chart-box" style={{ borderTop: `3px solid ${color}` }}>
                    <h4 style={{ color, fontSize: 14, fontWeight: 600, marginBottom: 6, fontFamily: "'Fraunces', serif" }}>{title}</h4>
                    <p style={{ color: T.textSecondary, fontSize: 13, lineHeight: 1.6 }}>{desc}</p>
                  </div>
                ))}
              </div>
            </Section>
            </ProGate>
          </>}

          {/* --- CURRENCY TAB --- */}
          {tab === "Currency" && (() => {
            const CurrencyConverter = () => {
              const [aedAmount, setAedAmount] = React.useState(2000000);
              const [rates, setRates] = React.useState(null);
              const [loading, setLoading] = React.useState(true);
              const [lastUpdated, setLastUpdated] = React.useState(null);
              const [error, setError] = React.useState(false);
              const [inputVal, setInputVal] = React.useState("2000000");

              const fetchRates = () => {
                setLoading(true); setError(false);
                fetch("https://open.er-api.com/v6/latest/AED")
                  .then(r => r.json())
                  .then(data => {
                    if (data.rates) {
                      setRates(data.rates);
                      setLastUpdated(new Date(data.time_last_update_utc).toLocaleDateString("en-AE", { day: "2-digit", month: "short", year: "numeric" }));
                    } else { setError(true); }
                    setLoading(false);
                  })
                  .catch(() => { setError(true); setLoading(false); });
              };

              React.useEffect(() => { fetchRates(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

              const currencies = [
                { code: "GBP", name: "British Pound",     flag: "GB", color: "#3B82F6" },
                { code: "EUR", name: "Euro",               flag: "EU", color: "#6366F1" },
                { code: "USD", name: "US Dollar",          flag: "US", color: "#10B981" },
                { code: "INR", name: "Indian Rupee",       flag: "IN", color: "#F59E0B" },
                { code: "PKR", name: "Pakistani Rupee",    flag: "PK", color: "#34D399" },
                { code: "SAR", name: "Saudi Riyal",        flag: "SA", color: "#D4A843" },
                { code: "RUB", name: "Russian Ruble",      flag: "RU", color: "#EF4444" },
                { code: "CNY", name: "Chinese Yuan",       flag: "CN", color: "#F87171" },
                { code: "CAD", name: "Canadian Dollar",    flag: "CA", color: "#60A5FA" },
                { code: "AUD", name: "Australian Dollar",  flag: "AU", color: "#34D399" },
                { code: "CHF", name: "Swiss Franc",        flag: "CH", color: "#A78BFA" },
                { code: "JPY", name: "Japanese Yen",       flag: "JP", color: "#FB923C" },
              ];

              const fmtCurrency = (val, code) => {
                if (!val || isNaN(val)) return "\u2014";
                if (val >= 1e6) return code + "\u00a0" + (val/1e6).toFixed(2) + "M";
                if (val >= 1e3) return code + "\u00a0" + Math.round(val/1000) + "K";
                return code + "\u00a0" + Math.round(val).toLocaleString();
              };

              const convert = (aed, code) => rates ? aed * rates[code] : null;
              const propertyPrices = activeProjects.filter(p => p.price).slice(0, 10);

              return (
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

                  {/* Status bar */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", background: T.surface, borderRadius: 12, border: "1px solid " + T.border }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: loading ? T.gold : error ? "#EF4444" : T.green }} />
                      <span style={{ fontSize: 12, color: T.textSecondary }}>{loading ? "Fetching live rates..." : error ? "Could not load rates \u2014 check connection" : "Live rates"}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      {lastUpdated && <span style={{ fontSize: 11, color: T.textMuted }}>Updated {lastUpdated}</span>}
                      <button type="button" onClick={fetchRates} disabled={loading} style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 12px", background: loading ? T.surfaceAlt : "rgba(212,168,67,0.1)", border: "1px solid " + (loading ? T.border : "rgba(212,168,67,0.3)"), borderRadius: 8, color: loading ? T.textMuted : T.gold, fontSize: 11, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", fontFamily: "'Outfit',sans-serif" }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
                        {loading ? "Refreshing..." : "Refresh Rates"}
                      </button>
                    </div>
                  </div>

                  {/* Amount input + quick project buttons */}
                  <div style={{ background: T.surface, borderRadius: 16, border: "1px solid " + T.border, padding: 24 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: T.goldLight, letterSpacing: 1, textTransform: "uppercase", marginBottom: 14 }}>Enter Amount in AED</div>
                    <div style={{ position: "relative", marginBottom: 20 }}>
                      <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: T.gold, fontWeight: 700 }}>AED</span>
                      <input type="number" value={inputVal} onChange={e => { setInputVal(e.target.value); setAedAmount(Number(e.target.value) || 0); }}
                        style={{ width: "100%", padding: "14px 14px 14px 60px", background: T.surfaceAlt, border: "1px solid " + T.gold, borderRadius: 12, color: T.white, fontSize: 18, fontWeight: 700, fontFamily: "'Outfit',sans-serif", outline: "none", boxSizing: "border-box" }} />
                    </div>
                    <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 10 }}>Or pick a project price:</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {propertyPrices.map(p => (
                        <button key={p.id} type="button" onClick={() => { setAedAmount(p.price); setInputVal(String(p.price)); }}
                          style={{ padding: "6px 12px", background: aedAmount === p.price ? "rgba(212,168,67,0.15)" : T.surfaceAlt, border: "1px solid " + (aedAmount === p.price ? T.gold : T.border), borderRadius: 8, color: aedAmount === p.price ? T.gold : T.textSecondary, fontSize: 11, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>
                          {p.name.split(" ").slice(0,2).join(" ")} {(p.price/1e6).toFixed(1)}M
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Currency cards */}
                  {loading ? (
                    <div style={{ textAlign: "center", padding: 60, color: T.textMuted }}>
                      <div style={{ fontSize: 32, marginBottom: 12 }}>&#x231B;</div>
                      <div style={{ fontSize: 13 }}>Loading live exchange rates...</div>
                    </div>
                  ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
                      {currencies.map((c) => {
                        const val = convert(aedAmount, c.code);
                        return (
                          <div key={c.code} style={{ background: T.surface, borderRadius: 14, border: "1px solid " + T.border, padding: "18px 16px", transition: "border-color 0.2s, background 0.2s" }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = c.color; e.currentTarget.style.background = T.surfaceAlt; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.background = T.surface; }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                              <div style={{ width: 28, height: 20, background: c.color, borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 800, color: "#fff", flexShrink: 0 }}>{c.flag}</div>
                              <div>
                                <div style={{ fontSize: 12, fontWeight: 700, color: T.white }}>{c.code}</div>
                                <div style={{ fontSize: 9, color: T.textMuted }}>{c.name}</div>
                              </div>
                            </div>
                            <div style={{ fontFamily: "'Fraunces',serif", fontSize: 18, fontWeight: 800, color: c.color, marginBottom: 4 }}>{fmtCurrency(val, c.code)}</div>
                            <div style={{ fontSize: 10, color: T.textMuted }}>1 AED = {rates ? rates[c.code].toFixed(4) : "\u2014"} {c.code}</div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* All projects table */}
                  {!loading && !error && rates && (
                    <div style={{ background: T.surface, borderRadius: 16, border: "1px solid " + T.border, padding: 24 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: T.goldLight, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>All Project Prices in Your Currency</div>
                      <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 16 }}>Every Emaar project \u2014 prices converted live</div>
                      <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                          <thead>
                            <tr style={{ borderBottom: "1px solid " + T.border }}>
                              {["Project", "AED", "GBP", "EUR", "USD", "INR", "PKR", "SAR"].map(h => (
                                <th key={h} style={{ padding: "8px 12px", textAlign: h === "Project" ? "left" : "right", color: T.textMuted, fontWeight: 600, fontSize: 10, textTransform: "uppercase", letterSpacing: 0.5, whiteSpace: "nowrap" }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {activeProjects.filter(p => p.price).map((p, i) => (
                              <tr key={p.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                                onMouseEnter={e => e.currentTarget.style.background = T.surfaceAlt}
                                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                                <td style={{ padding: "9px 12px", color: T.white, fontWeight: 600, whiteSpace: "nowrap" }}>{p.name}</td>
                                <td style={{ padding: "9px 12px", textAlign: "right", color: T.gold, fontWeight: 700 }}>{(p.price/1e6).toFixed(2)}M</td>
                                {["GBP","EUR","USD","INR","PKR","SAR"].map(code => (
                                  <td key={code} style={{ padding: "9px 12px", textAlign: "right", color: T.textSecondary, whiteSpace: "nowrap" }}>{fmtCurrency(p.price * rates[code], code)}</td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                </div>
              );
            };
            return (
              <Section title="Currency Converter" sub="Live rates \u00b7 AED to GBP, EUR, USD, INR, PKR and 8 more currencies">
                <CurrencyConverter />
              </Section>
            );
          })()}


          {/* ─── GOLDEN VISA TAB ─── */}
          {tab === "Golden Visa" && (() => {
            const GoldenVisaCalc = () => {
              const [propPrice, setPropPrice] = React.useState(2000000);
              const [paymentPlan, setPaymentPlan] = React.useState("cash");
              const [nationality, setNationality] = React.useState("other");
              const [selectedProjGV, setSelectedProjGV] = React.useState(null);

              const THRESHOLD = 2000000;
              const eligible = propPrice >= THRESHOLD;
              const gap = Math.max(0, THRESHOLD - propPrice);

              // Nationality actually changes real numbers:
              // UAE/GCC nationals: 15% min down payment (vs 20% for expats)
              // UAE nationals: already have residency — visa not needed
              const minDownPct = (nationality === "uae" || nationality === "gcc") ? 15 : 20;
              const isAlreadyResident = nationality === "uae";
              const dldExemption = nationality === "uae"; // UAE nationals get DLD fee discounts on select projects

              const govFees = Math.round(propPrice * (dldExemption ? 0.02 : 0.04) + 580 + 4020 + 2000);
              const visaFee = isAlreadyResident ? 0 : 3780 + 1220;
              const downPayment = Math.round(propPrice * (minDownPct / 100));
              const totalUpfront = paymentPlan === "cash"
                ? propPrice + govFees + visaFee
                : downPayment + govFees + visaFee;

              const qualifyingProjects = activeProjects.filter(p => (p.price || 0) >= THRESHOLD).sort((a, b) => (a.price || 0) - (b.price || 0));
              const nearProjects = activeProjects.filter(p => { const pr = p.price || 0; return pr >= 1500000 && pr < THRESHOLD; }).sort((a, b) => (a.price || 0) - (b.price || 0));

              const benefits = [
                { icon: "✅", title: "10-Year Residency", desc: "Live, work and study in UAE. Renewable indefinitely." },
                { icon: "👨‍👩‍👧", title: "Sponsor Your Family", desc: "Spouse, children of any age, and parents included." },
                { icon: "💼", title: "No Sponsor Needed", desc: "Full independence — no employer or local sponsor required." },
                { icon: "🏦", title: "UAE Bank Accounts", desc: "Open accounts, get credit cards, build UAE credit history." },
                { icon: "✈️", title: "Travel Freely", desc: "Re-enter UAE after 6+ months abroad without visa reset." },
                { icon: "💰", title: "0% Income Tax", desc: "No personal income tax on rental income or capital gains." },
              ];

              return (
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

                  {/* Hero */}
                  <div style={{ background: "linear-gradient(135deg, rgba(212,168,67,0.12), rgba(212,168,67,0.04))", borderRadius: 16, border: "1px solid rgba(212,168,67,0.3)", padding: "24px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
                    <div>
                      <div style={{ fontFamily: "'Fraunces',serif", fontSize: 22, fontWeight: 900, color: T.gold, marginBottom: 4 }}>UAE Golden Visa Calculator</div>
                      <div style={{ fontSize: 13, color: T.textSecondary }}>Find out if your Emaar investment qualifies for a 10-year UAE residency visa</div>
                    </div>
                    <div style={{ background: "rgba(212,168,67,0.1)", borderRadius: 12, padding: "12px 20px", textAlign: "center", border: "1px solid rgba(212,168,67,0.2)" }}>
                      <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 2 }}>MINIMUM INVESTMENT</div>
                      <div style={{ fontFamily: "'Fraunces',serif", fontSize: 22, fontWeight: 900, color: T.gold }}>AED 2,000,000</div>
                      <div style={{ fontSize: 10, color: T.textMuted, marginTop: 2 }}>Real estate (title deed value)</div>
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>

                    {/* Left: Calculator */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

                      <div style={{ background: T.surface, borderRadius: 14, border: "1px solid " + T.border, padding: 20 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: T.goldLight, letterSpacing: 1, textTransform: "uppercase", marginBottom: 14 }}>Your Property</div>

                        <div style={{ marginBottom: 16 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                            <span style={{ fontSize: 12, color: T.textSecondary }}>Property Price</span>
                            <span style={{ fontSize: 14, fontWeight: 700, color: eligible ? T.green : T.gold }}>AED {propPrice.toLocaleString()}</span>
                          </div>
                          <input type="range" min={500000} max={15000000} step={50000} value={propPrice} onChange={e => setPropPrice(+e.target.value)} style={{ width: "100%", accentColor: eligible ? T.green : T.gold }} />
                          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                            <span style={{ fontSize: 10, color: T.textMuted }}>AED 500K</span>
                            <span style={{ fontSize: 10, color: T.textMuted }}>AED 15M</span>
                          </div>
                        </div>

                        <div style={{ marginBottom: 16 }}>
                          <div style={{ fontSize: 12, color: T.textSecondary, marginBottom: 8 }}>Payment Method</div>
                          <div style={{ display: "flex", gap: 8 }}>
                            {[["cash", "Full Cash"], ["mortgage", "Mortgage"]].map(([v, l]) => (
                              <button key={v} type="button" onClick={() => setPaymentPlan(v)} style={{ flex: 1, padding: "9px 0", borderRadius: 8, border: "1px solid " + (paymentPlan === v ? T.gold : T.border), background: paymentPlan === v ? "rgba(212,168,67,0.12)" : T.surfaceAlt, color: paymentPlan === v ? T.gold : T.textSecondary, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>{l}</button>
                            ))}
                          </div>
                          {paymentPlan === "mortgage" && (
                            <div style={{ marginTop: 8, padding: "8px 12px", borderRadius: 8, background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)", fontSize: 11, color: T.blue }}>
                              {nationality === "uae" || nationality === "gcc"
                                ? "UAE/GCC nationals: minimum " + minDownPct + "% down payment required by UAE Central Bank rules."
                                : "Expats: minimum 20% down payment. Property must be fully paid off (title deed clear) for Golden Visa eligibility."}
                            </div>
                          )}
                        </div>

                        <div>
                          <div style={{ fontSize: 12, color: T.textSecondary, marginBottom: 8 }}>Your Nationality</div>
                          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                            {[["uae", "UAE National"], ["gcc", "GCC National"], ["other", "Other"]].map(([v, l]) => (
                              <button key={v} type="button" onClick={() => setNationality(v)} style={{ padding: "7px 14px", borderRadius: 8, border: "1px solid " + (nationality === v ? T.teal : T.border), background: nationality === v ? "rgba(45,212,191,0.1)" : T.surfaceAlt, color: nationality === v ? T.teal : T.textSecondary, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>{l}</button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Result card */}
                      <div style={{ background: eligible ? "linear-gradient(135deg,rgba(16,185,129,0.1),rgba(16,185,129,0.04))" : "linear-gradient(135deg,rgba(239,68,68,0.1),rgba(239,68,68,0.04))", borderRadius: 14, border: "1px solid " + (eligible ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"), padding: 20 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                          <div style={{ fontSize: 28 }}>{isAlreadyResident ? "🇦🇪" : eligible ? "✅" : "❌"}</div>
                          <div>
                            <div style={{ fontSize: 15, fontWeight: 700, color: isAlreadyResident ? T.gold : eligible ? T.green : "#EF4444" }}>
                              {isAlreadyResident ? "You Already Have UAE Residency" : eligible ? "You Qualify for the Golden Visa!" : "Not Eligible Yet"}
                            </div>
                            <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>
                              {isAlreadyResident ? "As a UAE National, you can still use this investment to sponsor family members for Golden Visa" : eligible ? "Your investment meets the AED 2M threshold" : "AED " + gap.toLocaleString() + " more needed to qualify"}
                            </div>
                          </div>
                        </div>

                        {!eligible && (
                          <div style={{ marginBottom: 14 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                              <span style={{ fontSize: 11, color: T.textMuted }}>Progress to eligibility</span>
                              <span style={{ fontSize: 11, color: T.gold }}>{Math.round(propPrice / THRESHOLD * 100)}%</span>
                            </div>
                            <div style={{ height: 8, background: T.surfaceAlt, borderRadius: 4, overflow: "hidden" }}>
                              <div style={{ height: "100%", width: Math.min(100, propPrice / THRESHOLD * 100) + "%", background: "linear-gradient(90deg," + T.gold + ",#B8912F)", borderRadius: 4, transition: "width 0.3s" }} />
                            </div>
                          </div>
                        )}

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                          {[
                            ["Property Value", "AED " + propPrice.toLocaleString(), eligible ? T.green : T.gold],
                            ["Min Down Payment", minDownPct + "% = AED " + downPayment.toLocaleString(), T.teal],
                            ["DLD Fees", (dldExemption ? "2%" : "4%") + " = AED " + Math.round(propPrice * (dldExemption ? 0.02 : 0.04)).toLocaleString(), T.textSecondary],
                            ["Visa Fees", isAlreadyResident ? "Not required" : "AED " + visaFee.toLocaleString(), isAlreadyResident ? T.textMuted : T.textSecondary],
                            ["Total Day-1 Cost", "AED " + totalUpfront.toLocaleString(), T.gold],
                            ["Visa Duration", isAlreadyResident ? "N/A (citizen)" : "10 Years", T.teal],
                          ].map(([l, v, c]) => (
                            <div key={l} style={{ background: "rgba(255,255,255,0.04)", borderRadius: 8, padding: "10px 12px" }}>
                              <div style={{ fontSize: 9, color: T.textMuted, textTransform: "uppercase", marginBottom: 3 }}>{l}</div>
                              <div style={{ fontSize: 12, fontWeight: 700, color: c }}>{v}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Right: Benefits + projects */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

                      <div style={{ background: T.surface, borderRadius: 14, border: "1px solid " + T.border, padding: 20 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: T.goldLight, letterSpacing: 1, textTransform: "uppercase", marginBottom: 14 }}>What You Get</div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                          {benefits.map((b, i) => (
                            <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                              <span style={{ fontSize: 16, flexShrink: 0 }}>{b.icon}</span>
                              <div>
                                <div style={{ fontSize: 11, fontWeight: 700, color: T.white, marginBottom: 2 }}>{b.title}</div>
                                <div style={{ fontSize: 10, color: T.textMuted, lineHeight: 1.5 }}>{b.desc}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div style={{ background: T.surface, borderRadius: 14, border: "1px solid " + T.border, padding: 20, flex: 1 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: T.goldLight, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>Emaar Projects That Qualify</div>
                        <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 14 }}>{qualifyingProjects.length} projects at AED 2M+</div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 220, overflowY: "auto" }}>
                          {qualifyingProjects.slice(0, 12).map(p => (
                            <div key={p.id} onClick={() => setSelectedProjGV(selectedProjGV?.id === p.id ? null : p)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 10px", borderRadius: 8, cursor: "pointer", background: selectedProjGV?.id === p.id ? "rgba(16,185,129,0.1)" : T.surfaceAlt, border: "1px solid " + (selectedProjGV?.id === p.id ? T.green : "transparent"), transition: "all 0.15s" }}>
                              <div>
                                <div style={{ fontSize: 11, fontWeight: 600, color: T.white }}>{p.name}</div>
                                <div style={{ fontSize: 10, color: T.textMuted }}>{p.community}</div>
                              </div>
                              <div style={{ textAlign: "right" }}>
                                <div style={{ fontSize: 11, fontWeight: 700, color: T.green }}>AED {p.price ? (p.price/1e6).toFixed(2) + "M" : "2M+"}</div>
                                <div style={{ fontSize: 10, color: T.gold }}>✓ Eligible</div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {nearProjects.length > 0 && (
                          <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid " + T.border }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: T.gold, marginBottom: 8 }}>Almost There (AED 1.5M–2M)</div>
                            {nearProjects.slice(0, 4).map(p => (
                              <div key={p.id} style={{ display: "flex", justifyContent: "space-between", padding: "6px 10px", borderRadius: 8, marginBottom: 4, background: T.surfaceAlt }}>
                                <div>
                                  <div style={{ fontSize: 11, color: T.white }}>{p.name}</div>
                                  <div style={{ fontSize: 10, color: T.textMuted }}>{p.community}</div>
                                </div>
                                <div style={{ textAlign: "right" }}>
                                  <div style={{ fontSize: 11, fontWeight: 600, color: T.gold }}>AED {p.price ? (p.price/1e6).toFixed(2) + "M" : "TBC"}</div>
                                  <div style={{ fontSize: 10, color: T.textMuted }}>{p.price ? "AED " + ((THRESHOLD - p.price)/1000).toFixed(0) + "K short" : "—"}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Bottom info strip */}
                  <div style={{ background: T.surface, borderRadius: 12, border: "1px solid " + T.border, padding: "14px 20px", display: "flex", gap: 24, flexWrap: "wrap" }}>
                    {[
                      ["📅", "Visa Duration", "10 years, renewable indefinitely"],
                      ["🏠", "Property Type", "Residential & commercial — off-plan or ready"],
                      ["💳", "Mortgage OK?", "Yes — but title deed must show AED 2M+ value"],
                      ["⏳", "Processing Time", "Approx. 30 days after title deed issuance"],
                      ["👥", "Family", "Spouse + children of any age included"],
                    ].map(([icon, title, desc]) => (
                      <div key={title} style={{ display: "flex", gap: 8, alignItems: "flex-start", minWidth: 160, flex: 1 }}>
                        <span style={{ fontSize: 18 }}>{icon}</span>
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 700, color: T.white }}>{title}</div>
                          <div style={{ fontSize: 10, color: T.textMuted, lineHeight: 1.5 }}>{desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                </div>
              );
            };
            return <GoldenVisaCalc />;
          })()}

          {/* ─── MARKET TAB ─── */}
          {tab === "Market" && <>
            <Section title="Dubai Real Estate — 2025" sub="Official DLD Data · 5th Consecutive Record Year">
              <div className="kpi-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginTop: 16 }}>
                {dubaiMarket.map((m, i) => <KPI key={i} label={m.metric} value={m.val2025} sub={m.yoy} delay={Math.min(i + 1, 8)} onClick={() => setSelectedKPI({ label: m.metric, value: m.val2025, color: T.gold, description: `${m.metric} — Official DLD data for 2025. Dubai's 5th consecutive record year.`, source: "Dubai Land Department 2025", sourceUrl: "https://dubailand.gov.ae", items: [{ label: "2025 Value", value: m.val2025, note: "Record year" }, { label: "YoY Change", value: m.yoy, note: "vs 2024" }, { label: "2024 Value", value: m.val2024 || "—", note: "Prior year" }], trend: null })} />)}
              </div>
            </Section>

            <Chart title="Dubai Total Sales Value Growth (AED B)" style={{ marginTop: 20 }}>
              <ResponsiveContainer width="100%" height={typeof window !== "undefined" && window.innerWidth < 480 ? 180 : 280}>
                <BarChart data={dubaiSalesHistory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="year" tick={{ fill: T.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: T.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="sales" name="Sales (AED B)" radius={[6, 6, 0, 0]} barSize={36}>
                    {[T.textMuted, T.textSecondary, T.teal, T.blue, T.gold, T.goldLight].map((c, i) => <Cell key={i} fill={c} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Chart>

            <Section title="2026 Outlook" sub="Knight Frank, CW Core, Fitch Ratings — Click each for full analysis">
              <div className="chart-grid-3" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginTop: 16 }}>
                {[
                  { firm: "Knight Frank", color: T.gold, forecast: "+3% prime / +1% mainstream", short: "+3% prime, ~1% mainstream. Transitioning to sustainable growth phase.", detail: "Knight Frank's 2026 Dubai Residential Forecast projects prime property appreciation of +3% and mainstream market growth of ~1%. The report notes Dubai is entering a more mature, sustainable growth cycle after two years of double-digit gains. Key risks include oversupply in mid-market. Key tailwinds include continued HNWI inflows, Golden Visa demand, and Expo City activation.", bullets: ["+3% prime appreciation", "~1% mainstream growth", "Sustainable cycle ahead", "HNWI inflows continue", "Golden Visa demand strong"], sourceUrl: "https://www.knightfrank.com/research" },
                  { firm: "CW Core", color: T.teal, forecast: "5–8% appreciation", short: "5-8% appreciation forecast. Slowdown from 12-22% in 2024-25.", detail: "Cushman & Wakefield Core's 2026 outlook projects 5–8% price appreciation for Dubai residential, a marked slowdown from 12–22% seen in 2024–25. The firm cites the massive 2026 pipeline (~120K units) as a price moderator, though strong end-user demand and low mortgage penetration are supportive. Off-plan launches expected to remain dominant at 60–65% of volume.", bullets: ["5–8% price appreciation", "~120K units in 2026 pipeline", "Off-plan stays 60–65% of volume", "Strong end-user demand", "Low mortgage penetration"], sourceUrl: "https://cwcore.com" },
                  { firm: "Fitch Ratings", color: T.orange, forecast: "Stable / Watch", short: "Moderate correction possible. ~120K units in 2026 pipeline.", detail: "Fitch Ratings maintained a Stable Outlook for UAE developers (Dec 2025), citing Emaar's strong backlog and recurring revenue as key buffers. However, Fitch warned that the 120K+ unit pipeline in 2026 could create oversupply in affordable segments. Emaar's premium positioning and AED 155B backlog provide significant earnings visibility even in a correction scenario.", bullets: ["Developer outlook: Stable", "120K unit pipeline = risk", "Affordable segment most exposed", "Emaar backlog = strong buffer", "Emaar rated BBB (Stable)"], sourceUrl: "https://www.fitchratings.com" },
                ].map((item, i) => <ForecastCard key={i} {...item} />)}
              </div>
            </Section>

            <Section title="Market Indicators" sub="Key metrics shaping Dubai's real estate future">
              <div className="chart-grid-3" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginTop: 16 }}>
                {[
                  ["Population Target", "5.8M by 2040"], ["Price Cycle", "56+ months positive"], ["Developer Count", "228 active"],
                  ["Units Launched", "131,504 in 2025"], ["Mortgage Txns", "50,974 deals"], ["2026 Pipeline", "~120K units"],
                  ["Women Investors", "AED 154B"], ["REIDIN Growth", "+12.9% YoY"], ["Investor Base", "193.1K (+24%)"],
                ].map(([k, v], i) => (
                  <div key={i} style={{ padding: "14px 16px", background: T.surfaceAlt, borderRadius: 12, border: `1px solid ${T.border}` }}>
                    <span style={{ color: T.textMuted, fontSize: 10, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", display: "block", marginBottom: 4 }}>{k}</span>
                    <span style={{ color: T.white, fontSize: 15, fontWeight: 700, fontFamily: "'Fraunces', serif" }}>{v}</span>
                  </div>
                ))}
              </div>
            </Section>
          </>}

          {/* ─── ADMIN TAB ─── */}
          {tab === "Admin" && userTier === "admin" && <>
            <Section title="User Management" sub="All registered users · Real-time data from Firestore">
              <div className="kpi-grid" style={{ display: "grid", gap: 12, marginTop: 16 }}>
                <KPI label="Total Users" value={adminUsers.length} sub="Registered accounts" delay={1} onClick={() => setSelectedKPI({ label: "Total Users", value: `${adminUsers.length}`, color: T.gold, description: "Total registered users on DXB Analytics platform.", source: "Firebase Firestore — Live", sourceUrl: "#", items: [{ label: "Total Registered", value: `${adminUsers.length}`, note: "All time" }, { label: "Pro Trial", value: `${adminUsers.filter(u => u.status === "pro_trial").length}`, note: "Active trials" }, { label: "Free / Expired", value: `${adminUsers.filter(u => u.status === "free" || u.status === "expired").length}`, note: "Conversion targets" }, { label: "Paying Customers", value: `${adminUsers.filter(u => u.tier === "pro" || u.tier === "enterprise").length}`, note: "Revenue generating" }], trend: null })} />
                <KPI label="Pro Trial" value={adminUsers.filter(u => u.status === "pro_trial").length} sub="Active trials" delay={2} onClick={() => setSelectedKPI({ label: "Pro Trial Users", value: `${adminUsers.filter(u => u.status === "pro_trial").length}`, color: T.gold, description: "Users currently in their Pro trial period. These are your hottest leads for conversion.", source: "Firebase Firestore — Live", sourceUrl: "#", items: [{ label: "Active Trials", value: `${adminUsers.filter(u => u.status === "pro_trial").length}`, note: "In trial now" }, { label: "Conversion Target", value: "AED 99/mo each", note: "Pro plan price" }, { label: "Pipeline Value", value: `AED ${adminUsers.filter(u => u.status === "pro_trial").length * 99}/mo`, note: "If all convert" }, { label: "Action", value: "Follow up now", note: "Before trial expires" }], trend: null })} />
                <KPI label="Free Users" value={adminUsers.filter(u => u.status === "free" || u.status === "expired").length} sub="Trial expired or free" delay={3} onClick={() => setSelectedKPI({ label: "Free / Expired Users", value: `${adminUsers.filter(u => u.status === "free" || u.status === "expired").length}`, color: T.red, description: "Users on free plan or whose trial has expired. Re-engagement opportunity.", source: "Firebase Firestore — Live", sourceUrl: "#", items: [{ label: "Free Plan", value: `${adminUsers.filter(u => u.status === "free").length}`, note: "Never started trial" }, { label: "Trial Expired", value: `${adminUsers.filter(u => u.status === "expired").length}`, note: "Trial ended, didn't upgrade" }, { label: "Re-engage Value", value: `AED ${adminUsers.filter(u => u.status === "free" || u.status === "expired").length * 99}/mo`, note: "If all convert" }], trend: null })} />
                <KPI label="Pro / Paid" value={adminUsers.filter(u => u.tier === "pro" || u.tier === "enterprise").length} sub="Paying customers" delay={4} onClick={() => setSelectedKPI({ label: "Paying Customers", value: `${adminUsers.filter(u => u.tier === "pro" || u.tier === "enterprise").length}`, color: T.green, description: "Active paying subscribers generating monthly recurring revenue.", source: "Firebase Firestore — Live", sourceUrl: "#", items: [{ label: "Pro Subscribers", value: `${adminUsers.filter(u => u.tier === "pro").length}`, note: "AED 99/mo each" }, { label: "Enterprise", value: `${adminUsers.filter(u => u.tier === "enterprise").length}`, note: "AED 499/mo each" }, { label: "Est. MRR", value: `AED ${adminUsers.filter(u => u.tier === "pro").length * 99 + adminUsers.filter(u => u.tier === "enterprise").length * 499}`, note: "Monthly recurring" }, { label: "Est. ARR", value: `AED ${(adminUsers.filter(u => u.tier === "pro").length * 99 + adminUsers.filter(u => u.tier === "enterprise").length * 499) * 12}`, note: "Annual recurring" }], trend: null })} />
              </div>

              {/* Analytics Summary Row */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginTop: 12 }}>
                {[
                  ["Conversion Rate", (() => { const total = adminUsers.length; const paid = adminUsers.filter(u => u.tier === "pro" || u.tier === "enterprise").length; return total > 0 ? `${((paid / total) * 100).toFixed(1)}%` : "0%"; })(), T.teal, "Paid / Total users"],
                  ["Trial→Pro Rate", (() => { const trials = adminUsers.filter(u => u.status === "pro_trial" || u.tier === "pro").length; const paid = adminUsers.filter(u => u.tier === "pro").length; return trials > 0 ? `${((paid / trials) * 100).toFixed(1)}%` : "0%"; })(), T.gold, "Of trial starters"],
                  ["Est. MRR", `AED ${adminUsers.filter(u => u.tier === "pro").length * 99 + adminUsers.filter(u => u.tier === "enterprise").length * 499}`, T.green, "Monthly recurring rev"],
                ].map(([label, value, color, sub], i) => (
                  <div key={i} style={{ background: T.surfaceAlt, borderRadius: 12, padding: "14px 16px", border: `1px solid ${T.border}` }}>
                    <div style={{ fontSize: 10, color: T.textMuted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>{label}</div>
                    <div style={{ fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 800, color }}>{value}</div>
                    <div style={{ fontSize: 11, color: T.textSecondary, marginTop: 2 }}>{sub}</div>
                  </div>
                ))}
              </div>
            </Section>

            <Section title="All Users" sub={`${adminUsers.length} registered · Click tier to change`}>
              {adminLoading ? (
                <div style={{ textAlign: "center", padding: 40 }}>
                  <div style={{ width: 24, height: 24, border: `2px solid ${T.border}`, borderTopColor: T.gold, borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto" }} />
                  <p style={{ color: T.textMuted, fontSize: 12, marginTop: 12 }}>Loading users...</p>
                </div>
              ) : (
                <div className="table-scroll" style={{ overflowX: "auto", marginTop: 12 }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 800 }}>
                    <thead>
                      <tr style={{ borderBottom: `2px solid ${T.border}` }}>
                        {["#", "Name", "Email", "Tier", "Trial Status", "Signed Up", "Actions"].map(h => (
                          <th key={h} style={{ padding: "10px 12px", textAlign: "left", color: T.textMuted, fontWeight: 600, fontSize: 11, letterSpacing: 0.5, textTransform: "uppercase" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {adminUsers.map((u, i) => {
                        const tierColor = u.tier === "pro" || u.tier === "enterprise" ? T.green : u.status === "pro_trial" ? T.gold : u.status === "expired" ? T.red : T.textMuted;
                        const tierLabel = u.tier === "pro" ? "Pro" : u.tier === "enterprise" ? "Enterprise" : u.status === "pro_trial" ? "Pro Trial" : u.status === "expired" ? "Trial Expired" : "Free";
                        const signedUp = u.createdAt ? new Date(u.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—";
                        const timeSince = u.createdAt ? (() => {
                          const diff = Math.floor((new Date() - new Date(u.createdAt)) / (1000 * 60 * 60));
                          if (diff < 1) return "Just now";
                          if (diff < 24) return `${diff}h ago`;
                          return `${Math.floor(diff / 24)}d ago`;
                        })() : "";
                        return (
                          <tr key={u.id} style={{ borderBottom: `1px solid ${T.border}`, transition: "background 0.2s" }}
                            onMouseEnter={e => e.currentTarget.style.background = T.surfaceAlt}
                            onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                            <td style={{ padding: "12px", color: T.textMuted, fontSize: 12 }}>{i + 1}</td>
                            <td style={{ padding: "12px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <div style={{ width: 28, height: 28, borderRadius: "50%", background: `linear-gradient(135deg, ${T.gold}, #B8912F)`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 11, color: T.bg }}>
                                  {(u.name || u.email || "?").charAt(0).toUpperCase()}
                                </div>
                                <span style={{ fontSize: 13, fontWeight: 600, color: T.white }}>{u.name || "—"}</span>
                              </div>
                            </td>
                            <td style={{ padding: "12px", fontSize: 12, color: T.textSecondary }}>{u.email || "—"}</td>
                            <td style={{ padding: "12px" }}>
                              <span style={{ padding: "4px 10px", borderRadius: 6, fontSize: 10, fontWeight: 700, background: `${tierColor}15`, color: tierColor, border: `1px solid ${tierColor}30` }}>
                                {tierLabel}
                              </span>
                            </td>
                            <td style={{ padding: "12px", fontSize: 12, color: T.textSecondary }}>
                              {u.status === "pro_trial" ? (
                                <span style={{ color: T.gold }}>{u.daysLeft} day{u.daysLeft !== 1 ? "s" : ""} left</span>
                              ) : u.status === "expired" ? (
                                <span style={{ color: T.red }}>Expired</span>
                              ) : u.tier === "pro" || u.tier === "enterprise" ? (
                                <span style={{ color: T.green }}>Active</span>
                              ) : (
                                <span style={{ color: T.textMuted }}>—</span>
                              )}
                            </td>
                            <td style={{ padding: "12px" }}>
                              <div style={{ fontSize: 12, color: T.white }}>{signedUp}</div>
                              <div style={{ fontSize: 10, color: T.textMuted }}>{timeSince}</div>
                            </td>
                            <td style={{ padding: "12px" }}>
                              <select value={u.tier} onChange={e => handleChangeTier(u.id, e.target.value)}
                                style={{ padding: "5px 8px", background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 6, color: T.textPrimary, fontSize: 11, fontFamily: "'Outfit', sans-serif", cursor: "pointer", outline: "none" }}>
                                <option value="free">Free</option>
                                <option value="pro_trial">Pro Trial</option>
                                <option value="pro">Pro</option>
                                <option value="enterprise">Enterprise</option>
                              </select>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </Section>

            <Section title="Signup Timeline" sub="User registration activity">
              <div style={{ marginTop: 16 }}>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={(() => {
                    const days = {};
                    adminUsers.forEach(u => {
                      if (u.createdAt) {
                        const d = new Date(u.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
                        days[d] = (days[d] || 0) + 1;
                      }
                    });
                    return Object.entries(days).map(([date, count]) => ({ date, signups: count }));
                  })()}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="date" tick={{ fill: T.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: T.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="signups" fill={T.gold} name="Signups" radius={[6, 6, 0, 0]} barSize={30} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Section>

            <Section title="Tier Distribution" sub="Current user breakdown">
              <div style={{ marginTop: 16, display: "flex", justifyContent: "center" }}>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={[
                      { name: "Free", value: adminUsers.filter(u => u.tier === "free" || u.status === "expired").length || 0, color: T.textMuted },
                      { name: "Pro Trial", value: adminUsers.filter(u => u.status === "pro_trial").length || 0, color: T.gold },
                      { name: "Pro", value: adminUsers.filter(u => u.tier === "pro").length || 0, color: T.green },
                      { name: "Enterprise", value: adminUsers.filter(u => u.tier === "enterprise").length || 0, color: T.blue },
                    ].filter(d => d.value > 0)} cx="50%" cy="50%" outerRadius={90} innerRadius={50} dataKey="value" paddingAngle={3} label={({ name, value }) => `${name}: ${value}`}>
                      {[
                        { name: "Free", value: adminUsers.filter(u => u.tier === "free" || u.status === "expired").length || 0, color: T.textMuted },
                        { name: "Pro Trial", value: adminUsers.filter(u => u.status === "pro_trial").length || 0, color: T.gold },
                        { name: "Pro", value: adminUsers.filter(u => u.tier === "pro").length || 0, color: T.green },
                        { name: "Enterprise", value: adminUsers.filter(u => u.tier === "enterprise").length || 0, color: T.blue },
                      ].filter(d => d.value > 0).map((d, i) => <Cell key={i} fill={d.color} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Section>
          </>}

        </div>

        <footer style={{ borderTop: `1px solid ${T.border}`, padding: "20px 24px", textAlign: "center" }}>
          <p style={{ color: T.textMuted, fontSize: 11 }}>
            Sources: Emaar IR, DLD, DXBinteract, Gulf News, Zawya, Knight Frank, CW Core, Fitch · Verified {new Date().toLocaleDateString("en-AE", { month: "short", year: "numeric" })} · Not financial advice
          </p>
          <p style={{ color: "rgba(100,116,139,0.5)", fontSize: 10, marginTop: 4 }}>
            DXB Analytics · The Address Holding · © 2026
          </p>
        </footer>
      </main>

      {/* ─── FLOATING COMPARE BAR ─── */}
      {compareList.length > 0 && tab === "Projects" && (
        <div className="compare-bar" style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: T.surface, borderTop: `2px solid ${T.gold}`, padding: "12px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", zIndex: 1000, backdropFilter: "blur(12px)", flexWrap: "wrap", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ color: T.gold, fontWeight: 700, fontSize: 13 }}>Compare ({compareList.length}/3):</span>
            {compareList.map(p => (
              <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 10px", background: T.surfaceAlt, borderRadius: 8, border: `1px solid ${T.border}` }}>
                <span style={{ fontSize: 12, color: T.white }}>{p.name}</span>
                <button type="button" onClick={() => toggleCompare(p)} style={{ background: "none", border: "none", color: T.red, cursor: "pointer", fontSize: 14, padding: 0, lineHeight: 1 }}>×</button>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" onClick={() => setCompareList([])} style={{ padding: "8px 16px", background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8, color: T.textMuted, fontSize: 12, cursor: "pointer", fontFamily: "'Outfit', sans-serif" }}>Clear</button>
            <button type="button" onClick={() => setShowCompare(true)} disabled={compareList.length < 2} style={{ padding: "8px 20px", background: compareList.length >= 2 ? T.gold : T.textMuted, border: "none", borderRadius: 8, color: T.bg, fontSize: 12, fontWeight: 700, cursor: compareList.length >= 2 ? "pointer" : "not-allowed", fontFamily: "'Outfit', sans-serif" }}>Compare Now</button>
          </div>
        </div>
      )}

            {/* ─── PROJECT DETAIL MODAL ─── */}
      {/* COMMUNITY DETAIL MODAL */}
      {selectedCommunity && (() => {
        const intel = communityIntel[selectedCommunity];
        const comm = emaarCommunities.find(x => x.name === selectedCommunity);
        if (!intel) return null;
        const commProjects = activeProjects.filter(p => p.community === selectedCommunity);
        return (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 3000, display: "flex", justifyContent: "center", alignItems: "flex-start", padding: "40px 16px", overflowY: "auto" }} onClick={() => setSelectedCommunity(null)}>
            <div style={{ background: T.surface, borderRadius: 16, maxWidth: 800, width: "100%", maxHeight: "90vh", overflowY: "auto", border: `1px solid ${T.border}` }} onClick={e => e.stopPropagation()}>
              {/* Header */}
              <div style={{ padding: "20px 24px", borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 800, color: T.gold }}>{selectedCommunity}</div>
                  <div style={{ fontSize: 13, color: T.textSecondary, marginTop: 4 }}>{intel.tagline}</div>
                  {intel.masterDev && <div style={{ fontSize: 11, color: T.textMuted, marginTop: 4 }}>{intel.masterDev}</div>}
                </div>
                <button type="button" onClick={() => setSelectedCommunity(null)} style={{ background: "none", border: "none", color: T.textMuted, fontSize: 22, cursor: "pointer", padding: 4 }}>&times;</button>
              </div>

              <div style={{ padding: "20px 24px" }}>
                {/* KPI Row */}
                {comm && (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 20 }}>
                    {[
                      { label: "Projects", value: comm.projects },
                      { label: "Avg Price/sqft", value: comm.avgPpsf ? `AED ${comm.avgPpsf.toLocaleString()}` : "—" },
                      { label: "Avg Yield", value: comm.avgYield ? `${comm.avgYield}%` : "—" },
                      { label: "Area", value: comm.acres ? `${comm.acres.toLocaleString()} acres` : "—" },
                    ].map((k, ki) => (
                      <div key={ki} style={{ background: T.surfaceAlt, borderRadius: 10, padding: 12, textAlign: "center" }}>
                        <div style={{ fontSize: 9, color: T.textMuted, marginBottom: 4 }}>{k.label}</div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: T.gold, fontFamily: "'Fraunces', serif" }}>{k.value}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Famous For */}
                {intel.famousFor && (
                  <div style={{ background: T.surfaceAlt, borderRadius: 10, padding: 14, marginBottom: 16 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: T.gold, marginBottom: 6 }}>FAMOUS FOR</div>
                    <div style={{ fontSize: 12, color: T.textSecondary, lineHeight: 1.6 }}>{intel.famousFor}</div>
                  </div>
                )}

                {/* Lifestyle */}
                {intel.lifestyle && (
                  <div style={{ background: T.surfaceAlt, borderRadius: 10, padding: 14, marginBottom: 16 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: T.teal, marginBottom: 6 }}>LIFESTYLE</div>
                    <div style={{ fontSize: 12, color: T.textSecondary, lineHeight: 1.6 }}>{intel.lifestyle}</div>
                  </div>
                )}

                {/* Key Amenities */}
                {intel.keyAmenities && intel.keyAmenities.length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: T.white, marginBottom: 10 }}>KEY AMENITIES</div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 10 }}>
                      {intel.keyAmenities.map((a, ai) => (
                        <div key={ai} style={{ background: T.surfaceAlt, borderRadius: 10, padding: 12 }}>
                          <div style={{ fontSize: 13, marginBottom: 4 }}>{a.icon} <span style={{ fontWeight: 700, color: T.white }}>{a.label}</span></div>
                          <div style={{ fontSize: 11, color: T.textSecondary, lineHeight: 1.5 }}>{a.items}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Distances */}
                {intel.distances && intel.distances.length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: T.white, marginBottom: 10 }}>DISTANCES & CONNECTIVITY</div>
                    <div style={{ background: T.surfaceAlt, borderRadius: 10, overflow: "hidden" }}>
                      {intel.distances.map((d, di) => (
                        <div key={di} style={{ display: "flex", justifyContent: "space-between", padding: "8px 14px", borderBottom: di < intel.distances.length - 1 ? `1px solid ${T.border}` : "none" }}>
                          <span style={{ fontSize: 11, color: T.textSecondary }}>{d.dest}</span>
                          <span style={{ fontSize: 11, color: T.white, fontWeight: 600 }}>{d.km} km &middot; {d.min} min</span>
                        </div>
                      ))}
                    </div>
                    {intel.roads && <div style={{ fontSize: 10, color: T.textMuted, marginTop: 6 }}>{intel.roads}</div>}
                  </div>
                )}

                {/* Yield & Golden Visa */}
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
                  {intel.avgYield && (
                    <div style={{ background: T.surfaceAlt, borderRadius: 10, padding: 14, flex: "1 1 200px" }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: T.green, marginBottom: 4 }}>EXPECTED YIELD RANGE</div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: T.gold, fontFamily: "'Fraunces', serif" }}>{intel.avgYield}</div>
                    </div>
                  )}
                  <div style={{ background: T.surfaceAlt, borderRadius: 10, padding: 14, flex: "1 1 200px" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: intel.goldenVisa ? T.gold : T.textMuted, marginBottom: 4 }}>GOLDEN VISA ELIGIBLE</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: intel.goldenVisa ? T.green : T.red, fontFamily: "'Fraunces', serif" }}>{intel.goldenVisa ? "Yes" : "Check projects"}</div>
                    <div style={{ fontSize: 10, color: T.textMuted, marginTop: 2 }}>Properties &ge; AED 2M qualify for 10-year UAE Golden Visa</div>
                  </div>
                </div>

                {/* Projects in this community */}
                {commProjects.length > 0 && (
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: T.white, marginBottom: 10 }}>PROJECTS IN {selectedCommunity.toUpperCase()} ({commProjects.length})</div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 8 }}>
                      {commProjects.map((p, pi) => (
                        <div key={pi} style={{ background: T.surfaceAlt, borderRadius: 8, padding: 10, cursor: "pointer" }} onClick={() => { const proj = activeProjects.find(x => x.id === p.id) || p; setBreadcrumb([{ label: selectedCommunity, action: () => { setSelectedProject(null); setBreadcrumb([]); } }]); setSelectedCommunity(null); setSelectedProject(proj); }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap" }}>
                            <span style={{ fontSize: 12, fontWeight: 700, color: T.gold }}>{p.name}</span>
                            {p.emaarUrl && <a href={p.emaarUrl} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ fontSize: 8, color: T.gold, textDecoration: "none", padding: "1px 4px", border: "1px solid rgba(212,168,67,0.3)", borderRadius: 3, fontWeight: 700 }}>↗</a>}
                          </div>
                          <div style={{ fontSize: 10, color: T.textMuted, marginTop: 2 }}>{p.type} &middot; {p.beds} beds &middot; {p.status}</div>
                          <div style={{ fontSize: 11, fontWeight: 600, color: T.white, marginTop: 4 }}>{p.price ? `AED ${(p.price/1e6).toFixed(2)}M` : "TBD"}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {comm && (
                  <div style={{ fontSize: 10, color: T.textMuted, marginTop: 16, padding: "10px 0 0", borderTop: `1px solid ${T.border}` }}>
                    Target buyers: <span style={{ color: T.white }}>{comm.buyer}</span> &middot; Key strengths: <span style={{ color: T.white }}>{comm.strengths}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

            {breadcrumb.length > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 0 4px", marginBottom: 4 }}>
                {breadcrumb.map((b, i) => (
                  <React.Fragment key={i}>
                    <button type="button" onClick={b.action} style={{ background: "none", border: "none", color: T.gold, fontSize: 12, cursor: "pointer", padding: 0, fontFamily: "'Outfit', sans-serif", fontWeight: 600 }}>{b.label}</button>
                    <span style={{ color: T.textMuted, fontSize: 12 }}>›</span>
                  </React.Fragment>
                ))}
                <span style={{ fontSize: 12, color: T.textSecondary }}>{selectedProject?.name}</span>
              </div>
            )}
            {selectedProject && (() => {
        /* Resolve: if selectedProject is an ID (number/string), find the full object */
        const _sp = (typeof selectedProject === "number" || typeof selectedProject === "string" || !selectedProject.name)
          ? activeProjects.find(x => x.id === selectedProject || x.id === Number(selectedProject)) || null
          : selectedProject;
        if (!_sp) { return null; }
        /* Use _sp below but keep variable name short */
        const selectedProject_ = _sp;
        const ci = communityIntel[selectedProject_.community] || null;
        return (
        <div style={{ position: "fixed", inset: 0, background: "rgba(4,9,15,0.85)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(8px)" }} onClick={() => setSelectedProject(null)}>
          <div style={{ background: T.surface, borderRadius: 16, border: `1px solid ${T.border}`, width: "95%", maxWidth: 820, maxHeight: "92vh", overflowY: "auto", position: "relative" }} onClick={e => e.stopPropagation()}>
            {/* Close */}
            <button type="button" onClick={() => { setSelectedProject(null); setBreadcrumb([]); }} style={{ position: "absolute", top: 16, right: 16, background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8, color: T.textMuted, width: 32, height: 32, cursor: "pointer", fontSize: 16, zIndex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
            
            {/* Image */}
            {selectedProject_.imageUrl && (
              <div style={{ width: "100%", height: 200, overflow: "hidden", borderRadius: "16px 16px 0 0" }}>
                <img src={selectedProject_.imageUrl} alt={selectedProject_.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => { e.target.parentElement.style.display = "none"; }} />
              </div>
            )}

            <div style={{ padding: 24 }}>
              {/* Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 900, color: T.gold, margin: 0 }}>{selectedProject_.name}</h2>
                    {selectedProject_.emaarUrl && <a href={selectedProject_.emaarUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 10, color: T.gold, textDecoration: "none", padding: "3px 8px", border: "1px solid rgba(212,168,67,0.4)", borderRadius: 6, fontWeight: 700, background: "rgba(212,168,67,0.08)", whiteSpace: "nowrap" }} title={`Official listing on ${getLinkDomain(selectedProject_.emaarUrl)}`}>SOURCE ↗</a>}
                    <Link to={`/project/${selectedProject_.id}`} style={{ fontSize: 10, color: T.teal, textDecoration: "none", padding: "3px 8px", border: "1px solid rgba(0,191,165,0.4)", borderRadius: 6, fontWeight: 700, background: "rgba(0,191,165,0.08)", whiteSpace: "nowrap" }} title="Open full page">FULL PAGE ↗</Link>
                  </div>
                  <p style={{ color: T.textSecondary, fontSize: 13, marginTop: 4 }}>{selectedProject_.community} · {selectedProject_.district} · {selectedProject_.type}</p>
                  {ci && <p style={{ color: T.teal, fontSize: 11, marginTop: 2, fontStyle: "italic" }}>{ci.tagline}</p>}
                </div>
                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                  {selectedProject_.branded && <span style={{ fontSize: 10, padding: "4px 10px", borderRadius: 6, background: "rgba(212,168,67,0.15)", color: T.gold, fontWeight: 600 }}>{selectedProject_.brand}</span>}
                  <span style={{ fontSize: 10, padding: "4px 10px", borderRadius: 6, background: selectedProject_.status === "Completed" ? "rgba(16,185,129,0.15)" : selectedProject_.status === "Under Construction" ? "rgba(16,185,129,0.12)" : "rgba(59,130,246,0.12)", color: selectedProject_.status === "Completed" ? T.green : selectedProject_.status === "Under Construction" ? T.green : T.blue, fontWeight: 600 }}>{selectedProject_.status}</span>
                </div>
              </div>

              {/* Construction */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: 12, color: T.textMuted }}>Construction Progress</span>
                  <span style={{ fontSize: 16, fontWeight: 800, color: selectedProject_.construction >= 100 ? T.green : selectedProject_.construction >= 70 ? T.green : selectedProject_.construction >= 30 ? T.gold : T.blue }}>{selectedProject_.construction}%</span>
                </div>
                <div style={{ height: 8, borderRadius: 4, background: T.surfaceAlt, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${selectedProject_.construction}%`, borderRadius: 4, background: selectedProject_.construction >= 100 ? T.green : selectedProject_.construction >= 70 ? T.green : selectedProject_.construction >= 30 ? T.gold : T.blue }} />
                </div>
              </div>

              {/* Details Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 16 }}>
                {[
                  ["Starting From", selectedProject_.price ? `AED ${(selectedProject_.price/1000000).toFixed(1)}M` : selectedProject_.priceFrom ? `AED ${(Number(selectedProject_.priceFrom)/1000000).toFixed(1)}M` : "TBD"],
                  ["Handover", selectedProject_.handover || "—"],
                  ["Price/sqft", selectedProject_.ppsf ? `AED ${selectedProject_.ppsf.toLocaleString()}` : selectedProject_.pricePerSqft ? `AED ${Number(selectedProject_.pricePerSqft).toLocaleString()}` : "TBD"],
                  ["Size Range", selectedProject_.sizeFrom ? `${selectedProject_.sizeFrom.toLocaleString()} - ${selectedProject_.sizeTo?.toLocaleString()} sqft` : selectedProject_.sizeRange || "—"],
                  ["Bedrooms", selectedProject_.beds ? selectedProject_.beds + " BR" : "—"],
                  ["Payment Plan", selectedProject_.payment || selectedProject_.paymentPlan || "—"],
                ].map(([label, value], idx) => (
                  <div key={idx} style={{ background: T.surfaceAlt, borderRadius: 10, padding: 10 }}>
                    <div style={{ fontSize: 9, color: T.textMuted, marginBottom: 3, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.white }}>{value}</div>
                  </div>
                ))}
              </div>

              {/* Unit Inventory */}
              {selectedProject_.units && (
                <div style={{ marginBottom: 16 }}>
                  <h3 style={{ fontSize: 11, fontWeight: 600, color: T.goldLight, letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>Unit Inventory & Availability</h3>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 8 }}>
                    {getUnitEntries(selectedProject_.units).map(([type, d]) => {
                      const avail = d.total - d.sold;
                      const pct = d.total > 0 ? (d.sold / d.total) * 100 : 0;
                      return (
                        <div key={type} style={{ background: T.surfaceAlt, borderRadius: 8, padding: 10, textAlign: "center" }}>
                          <div style={{ fontSize: 12, fontWeight: 800, color: T.gold, textTransform: "uppercase", marginBottom: 4 }}>{type}</div>
                          <div style={{ fontSize: 20, fontWeight: 900, fontFamily: "'Fraunces', serif", color: avail > 0 ? T.green : T.red }}>{avail}</div>
                          <div style={{ fontSize: 9, color: T.textMuted, marginBottom: 4 }}>available of {d.total}</div>
                          <div style={{ height: 4, borderRadius: 2, background: T.bg, overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${pct}%`, borderRadius: 2, background: pct >= 90 ? T.red : pct >= 60 ? T.gold : T.green }} />
                          </div>
                          <div style={{ fontSize: 8, color: T.textMuted, marginTop: 3 }}>{pct.toFixed(0)}% sold</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ─── LOCATION INTELLIGENCE SECTION ─── */}
              {ci && (
                <ProGate isPro={isPro} message="Unlock Location Intelligence" onUpgrade={() => setShowUpgrade(true)}>
                <>
                  {/* Community Famous For */}
                  <div style={{ marginBottom: 16, background: `linear-gradient(135deg, rgba(212,168,67,0.08), rgba(0,191,165,0.05))`, borderRadius: 12, padding: 14, border: `1px solid ${T.border}` }}>
                    <h3 style={{ fontSize: 11, fontWeight: 600, color: T.gold, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>⭐ Famous For</h3>
                    <p style={{ fontSize: 12, color: T.textPrimary, lineHeight: 1.5, margin: 0 }}>{ci.famousFor}</p>
                    <p style={{ fontSize: 10, color: T.textMuted, marginTop: 6, margin: 0 }}><span style={{ color: T.teal }}>Developer:</span> {ci.masterDev}</p>
                    <p style={{ fontSize: 10, color: T.textMuted, marginTop: 3, margin: 0 }}><span style={{ color: T.teal }}>Lifestyle:</span> {ci.lifestyle}</p>
                  </div>

                  {/* Key Amenities */}
                  <div style={{ marginBottom: 16 }}>
                    <h3 style={{ fontSize: 11, fontWeight: 600, color: T.goldLight, letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>🏢 Key Amenities Nearby</h3>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      {ci.keyAmenities.map((a, i) => (
                        <div key={i} style={{ background: T.surfaceAlt, borderRadius: 10, padding: 10, borderLeft: `3px solid ${i === 0 ? T.blue : i === 1 ? T.red : i === 2 ? T.gold : T.teal}` }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: T.white, marginBottom: 4 }}>{a.icon} {a.label}</div>
                          <div style={{ fontSize: 10, color: T.textSecondary, lineHeight: 1.4 }}>{a.items}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Distance Table */}
                  <div style={{ marginBottom: 16 }}>
                    <h3 style={{ fontSize: 11, fontWeight: 600, color: T.goldLight, letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>📍 Distance to Key Dubai Locations</h3>
                    <div style={{ borderRadius: 10, overflow: "hidden", border: `1px solid ${T.border}` }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                        <thead>
                          <tr style={{ background: T.surfaceAlt }}>
                            <th style={{ padding: "8px 10px", textAlign: "left", color: T.gold, fontWeight: 600, fontSize: 10 }}>Destination</th>
                            <th style={{ padding: "8px 10px", textAlign: "center", color: T.gold, fontWeight: 600, fontSize: 10 }}>Distance</th>
                            <th style={{ padding: "8px 10px", textAlign: "center", color: T.gold, fontWeight: 600, fontSize: 10 }}>Drive Time</th>
                          </tr>
                        </thead>
                        <tbody>
                          {ci.distances.map((d, i) => (
                            <tr key={i} style={{ borderTop: `1px solid ${T.border}`, background: i % 2 === 0 ? "transparent" : "rgba(14,29,53,0.3)" }}>
                              <td style={{ padding: "7px 10px", color: T.textPrimary, fontWeight: d.dest.includes("Downtown") || d.dest.includes("Sheikh Zayed") ? 600 : 400 }}>{d.dest}</td>
                              <td style={{ padding: "7px 10px", textAlign: "center", color: T.textSecondary }}>{d.km} km</td>
                              <td style={{ padding: "7px 10px", textAlign: "center" }}>
                                <span style={{ 
                                  padding: "2px 8px", borderRadius: 4, fontSize: 10, fontWeight: 700,
                                  background: d.min <= 10 ? "rgba(16,185,129,0.15)" : d.min <= 20 ? "rgba(212,168,67,0.15)" : "rgba(59,130,246,0.12)",
                                  color: d.min <= 10 ? T.green : d.min <= 20 ? T.gold : T.blue
                                }}>
                                  {d.min} min
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <p style={{ fontSize: 9, color: T.textMuted, marginTop: 6 }}>🛣️ <strong>Road Access:</strong> {ci.roads}</p>
                  </div>

                  {/* Investment Quick Facts */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 16 }}>
                    <div style={{ background: T.surfaceAlt, borderRadius: 8, padding: 10, textAlign: "center" }}>
                      <div style={{ fontSize: 9, color: T.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>Est. Yield</div>
                      <div style={{ fontSize: 15, fontWeight: 800, color: T.green, fontFamily: "'Fraunces', serif" }}>{ci.avgYield}</div>
                    </div>
                    <div style={{ background: T.surfaceAlt, borderRadius: 8, padding: 10, textAlign: "center" }}>
                      <div style={{ fontSize: 9, color: T.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>Golden Visa</div>
                      <div style={{ fontSize: 15, fontWeight: 800, color: ci.goldenVisa ? T.green : T.textMuted, fontFamily: "'Fraunces', serif" }}>{ci.goldenVisa ? "✓ Eligible" : "Below 2M"}</div>
                    </div>
                    <div style={{ background: T.surfaceAlt, borderRadius: 8, padding: 10, textAlign: "center" }}>
                      <div style={{ fontSize: 9, color: T.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>Tier</div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: T.gold }}>{selectedProject_.tier}</div>
                    </div>
                  </div>
                </>
                </ProGate>
              )}


              {/* ROI Estimate */}
              {(() => {
                const roi = liveCommunityROI[selectedProject_.community] || communityROI[selectedProject_.community];
                if (!roi) return null;
                const price = selectedProject_.price || 0;
                const gross = roi.grossYield?.apt1 || roi.grossYield?.th || roi.grossYield?.villa || 0;
                const net = roi.netYield?.apt1 || roi.netYield?.th || roi.netYield?.villa || 0;
                const appr5 = roi.appreciation5yr || 0;
                const projValue = price > 0 ? price * (1 + appr5/100) : 0;
                const annualRent = roi.estRent?.apt1 || roi.estRent?.th || roi.estRent?.villa || 0;
                return (
                  <ProGate isPro={isPro} message="Unlock ROI Calculator" onUpgrade={() => setShowUpgrade(true)}>
                  <div style={{ marginBottom: 16, background: "linear-gradient(135deg, rgba(16,185,129,0.06), rgba(212,168,67,0.04))", borderRadius: 12, padding: 16, border: "1px solid rgba(16,185,129,0.2)" }}>
                    <h3 style={{ fontSize: 11, fontWeight: 700, color: T.green, letterSpacing: 1, textTransform: "uppercase", marginBottom: 12 }}>ROI Estimate</h3>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 12 }}>
                      {[
                        { label: "Gross Yield", value: gross + "%", color: T.green },
                        { label: "Net Yield", value: net + "%", color: T.teal },
                        { label: "5-Yr Appreciation", value: "+" + appr5 + "%", color: T.gold },
                        { label: "Annual YoY", value: "+" + (roi.appreciationYoY || 0) + "%", color: T.blue },
                      ].map((item, i) => (
                        <div key={i} style={{ background: T.surfaceAlt, borderRadius: 8, padding: 10, textAlign: "center" }}>
                          <div style={{ fontSize: 9, color: T.textMuted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>{item.label}</div>
                          <div style={{ fontSize: 16, fontWeight: 800, color: item.color, fontFamily: "Fraunces, serif" }}>{item.value}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                      {price > 0 && <div style={{ background: T.surfaceAlt, borderRadius: 8, padding: 10 }}>
                        <div style={{ fontSize: 9, color: T.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>Est. 5-Yr Value</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: T.gold }}>AED {(projValue/1e6).toFixed(2)}M</div>
                        <div style={{ fontSize: 9, color: T.green }}>+AED {((projValue-price)/1e6).toFixed(2)}M gain</div>
                      </div>}
                      {annualRent > 0 && <div style={{ background: T.surfaceAlt, borderRadius: 8, padding: 10 }}>
                        <div style={{ fontSize: 9, color: T.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>Est. Annual Rent</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: T.teal }}>AED {annualRent.toLocaleString()}</div>
                        <div style={{ fontSize: 9, color: T.textMuted }}>1BR estimate</div>
                      </div>}
                      <div style={{ background: T.surfaceAlt, borderRadius: 8, padding: 10 }}>
                        <div style={{ fontSize: 9, color: T.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>Golden Visa</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: roi.goldenVisa ? T.green : T.textMuted }}>{roi.goldenVisa ? "Eligible" : "Not Eligible"}</div>
                        <div style={{ fontSize: 9, color: T.textMuted }}>{roi.goldenVisaNote}</div>
                      </div>
                    </div>
                    <div style={{ marginTop: 8, fontSize: 9, color: T.textMuted }}>Risk: <span style={{ color: roi.riskLevel === "Low" ? T.green : roi.riskLevel === "Medium" ? T.gold : T.red }}>{roi.riskLevel}</span> · Occupancy: {roi.occupancy ? roi.occupancy + "%" : "N/A"}</div>
                  </div>
                  </ProGate>
                );
              })()}


              {/* ROI Calculator */}
              {(() => {
                const roi = liveCommunityROI[selectedProject_.community] || communityROI[selectedProject_.community];
                if (!roi) return null;
                return (
                  <ProGate isPro={isPro} message="Unlock ROI Calculator" onUpgrade={() => setShowUpgrade(true)}>
                  <RoiCalculator project={selectedProject_} roi={roi} T={T} />
                  </ProGate>
                );
              })()}

              {/* Price History */}
              {(() => {
                const ph = selectedProject_.priceHistory;
                if (!ph || !Array.isArray(ph) || ph.length < 2) return null;
                return (
                  <div style={{ marginBottom: 16 }}>
                    <h3 style={{ fontSize: 11, fontWeight: 600, color: T.goldLight, letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>📈 Price History</h3>
                    <ResponsiveContainer width="100%" height={140}>
                      <AreaChart data={ph}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                        <XAxis dataKey="date" tick={{ fill: T.textMuted, fontSize: 9 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: T.textMuted, fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000000).toFixed(1)}M`} />
                        <Tooltip formatter={v => [`AED ${Number(v).toLocaleString()}`, "Price"]} contentStyle={{ background: T.surface, border: `1px solid ${T.gold}`, borderRadius: 8, fontSize: 11 }} />
                        <Area type="monotone" dataKey="price" stroke={T.gold} fill="rgba(212,168,67,0.1)" strokeWidth={2} dot={{ r: 3, fill: T.gold }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                );
              })()}

              {/* Project Documents & Media */}
              {(selectedProject_.pdfBrochure || selectedProject_.pdfFloorPlan || selectedProject_.pdfPaymentPlan || selectedProject_.pdfFactSheet || selectedProject_.videoUrl || selectedProject_.imageUrl) && (
                <div style={{ marginBottom: 16 }}>
                  <h3 style={{ fontSize: 11, fontWeight: 600, color: T.goldLight, letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>📎 Documents & Media</h3>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {selectedProject_.pdfBrochure && (
                      <a href={selectedProject_.pdfBrochure} target="_blank" rel="noreferrer"
                        style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 8, background: "rgba(212,168,67,0.1)", border: "1px solid rgba(212,168,67,0.3)", color: T.gold, fontSize: 11, fontWeight: 600, textDecoration: "none" }}>
                        📄 Brochure
                      </a>
                    )}
                    {selectedProject_.pdfFloorPlan && (
                      <a href={selectedProject_.pdfFloorPlan} target="_blank" rel="noreferrer"
                        style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 8, background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.3)", color: T.blue, fontSize: 11, fontWeight: 600, textDecoration: "none" }}>
                        🏠 Floor Plan
                      </a>
                    )}
                    {selectedProject_.pdfPaymentPlan && (
                      <a href={selectedProject_.pdfPaymentPlan} target="_blank" rel="noreferrer"
                        style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 8, background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", color: T.green, fontSize: 11, fontWeight: 600, textDecoration: "none" }}>
                        💳 Payment Plan
                      </a>
                    )}
                    {selectedProject_.pdfFactSheet && (
                      <a href={selectedProject_.pdfFactSheet} target="_blank" rel="noreferrer"
                        style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 8, background: "rgba(0,191,165,0.1)", border: "1px solid rgba(0,191,165,0.3)", color: T.teal, fontSize: 11, fontWeight: 600, textDecoration: "none" }}>
                        📊 Fact Sheet
                      </a>
                    )}
                  </div>
                  {selectedProject_.videoUrl && (
                    <div style={{ marginTop: 12, borderRadius: 10, overflow: "hidden", border: `1px solid ${T.border}` }}>
                      <video controls style={{ width: "100%", maxHeight: 240, background: "#000", display: "block" }}>
                        <source src={selectedProject_.videoUrl} />
                      </video>
                    </div>
                  )}
                </div>
              )}

              {/* Contact CTAs */}
              {isPro ? (
              <div style={{ display: "flex", gap: 8 }}>
                <a href={whatsappLink(selectedProject_.name, selectedProject_.community)} target="_blank" rel="noopener noreferrer"
                  onClick={async () => { try { await setDoc(doc(db, "leads", Date.now().toString()), { name: userName || (user ? user.split("@")[0] : "Visitor"), email: user || "", project: selectedProject_.name, community: selectedProject_.community, source: "WhatsApp", status: "New", createdAt: new Date().toISOString() }); } catch(e) {} }}
                  style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "12px 0", background: "#25D366", borderRadius: 12, color: "#fff", fontSize: 13, fontWeight: 700, textDecoration: "none", fontFamily: "'Outfit', sans-serif" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  WhatsApp
                </a>
                <button type="button" onClick={async () => {
                  try {
                    await emailjs.send("service_da7nshv", "template_gl1xqhy", {
                      user_email: user || "visitor@dxbanalytics.com",
                      user_name: userName || (user ? user.split("@")[0] : "Visitor"),
                      project_name: selectedProject_.name,
                      change_type: "Inquiry",
                      new_value: `${selectedProject_.community} — Starting AED ${selectedProject_.price ? (selectedProject_.price/1000000).toFixed(1) + "M" : "TBD"}`,
                      old_value: "N/A",
                      updated_at: new Date().toLocaleString("en-AE"),
                    }, "USkwUhp0csGCVDkdQ");
                    // Save lead to Firestore for admin panel
                    try {
                      await setDoc(doc(db, "leads", Date.now().toString()), {
                        name: userName || (user ? user.split("@")[0] : "Visitor"),
                        email: user || "",
                        project: selectedProject_.name,
                        community: selectedProject_.community,
                        source: "Email Inquiry",
                        status: "New",
                        createdAt: new Date().toISOString(),
                      });
                    } catch(le) { console.log("Lead save error:", le); }
                    alert("✅ Inquiry sent! We'll get back to you shortly.");
                  } catch(e) {
                    window.location.href = `mailto:mianwaleed689@gmail.com?subject=Inquiry: ${selectedProject_.name}&body=Hi, I'm interested in ${selectedProject_.name} at ${selectedProject_.community}.`;
                  }
                }}
                  style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "12px 0", background: T.gold, borderRadius: 12, color: T.bg, fontSize: 13, fontWeight: 700, border: "none", cursor: "pointer", fontFamily: "'Outfit', sans-serif" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#04090F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                  Email
                </button>
                <a href="tel:+971542410599"
                  style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "12px 0", background: T.teal, borderRadius: 12, color: "#fff", fontSize: 13, fontWeight: 700, textDecoration: "none", fontFamily: "'Outfit', sans-serif" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                  Call
                </a>
              </div>
              ) : (
              <div style={{ display: "flex", gap: 8 }}>
                <button type="button" onClick={() => setShowUpgrade(true)} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "12px 0", background: "rgba(37,211,102,0.1)", borderRadius: 12, color: "rgba(37,211,102,0.5)", fontSize: 13, fontWeight: 700, border: "none", cursor: "pointer", fontFamily: "'Outfit', sans-serif" }}>🔒 WhatsApp</button>
                <button type="button" onClick={() => setShowUpgrade(true)} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "12px 0", background: "rgba(212,168,67,0.1)", borderRadius: 12, color: "rgba(212,168,67,0.5)", fontSize: 13, fontWeight: 700, border: "none", cursor: "pointer", fontFamily: "'Outfit', sans-serif" }}>🔒 Email</button>
                <button type="button" onClick={() => setShowUpgrade(true)} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "12px 0", background: "rgba(0,191,165,0.1)", borderRadius: 12, color: "rgba(0,191,165,0.5)", fontSize: 13, fontWeight: 700, border: "none", cursor: "pointer", fontFamily: "'Outfit', sans-serif" }}>🔒 Call</button>
              </div>
              )}

              {/* ─── SOURCE LINK: Official Emaar listing ─── */}
              {selectedProject_.emaarUrl && (
                <a href={selectedProject_.emaarUrl} target="_blank" rel="noopener noreferrer"
                  style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, width: "100%", marginTop: 8, padding: "13px 0", background: "linear-gradient(135deg, rgba(212,168,67,0.12), rgba(212,168,67,0.06))", border: "1px solid rgba(212,168,67,0.4)", borderRadius: 12, color: T.gold, fontSize: 13, fontWeight: 700, textDecoration: "none", fontFamily: "'Outfit', sans-serif", letterSpacing: 0.2 }}
                  onMouseEnter={e => { e.currentTarget.style.background = "linear-gradient(135deg, rgba(212,168,67,0.22), rgba(212,168,67,0.12))"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(212,168,67,0.15)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "linear-gradient(135deg, rgba(212,168,67,0.12), rgba(212,168,67,0.06))"; e.currentTarget.style.boxShadow = "none"; }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={T.gold} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                  <span>View Official Listing on <strong>{getLinkDomain(selectedProject_.emaarUrl)}</strong> ↗</span>
                </a>
              )}

              {/* ─── PDF REPORT BUTTON ─── */}
              <button type="button" onClick={() => {
                const p = selectedProject_;
                const roiData = (liveCommunityROI && liveCommunityROI[p.community]) || communityROI[p.community] || {};
                const reportHtml = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${p.name} — Investment Report</title>
                <style>
                  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Inter:wght@400;500;600;700&display=swap');
                  *{margin:0;padding:0;box-sizing:border-box}
                  body{font-family:'Inter',sans-serif;background:#fff;color:#111;padding:0}
                  .cover{background:linear-gradient(135deg,#04090F 0%,#0A1628 60%,#0E1D35 100%);color:#fff;padding:48px 48px 40px;min-height:220px;position:relative}
                  .cover h1{font-family:'Playfair Display',serif;font-size:32px;font-weight:900;color:#D4A843;margin-bottom:6px}
                  .cover .sub{color:#94A3B8;font-size:14px;margin-bottom:24px}
                  .badge{display:inline-block;padding:4px 12px;border-radius:20px;font-size:11px;font-weight:600;border:1px solid rgba(212,168,67,0.4);color:#D4A843;margin-right:8px}
                  .logo{font-family:'Playfair Display',serif;font-size:13px;color:#D4A843;letter-spacing:2px;text-transform:uppercase;opacity:0.8;position:absolute;top:28px;right:48px}
                  .date{color:#64748B;font-size:11px;position:absolute;bottom:20px;right:48px}
                  .body{padding:36px 48px}
                  .section{margin-bottom:28px}
                  .section-title{font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#94A3B8;margin-bottom:14px;padding-bottom:8px;border-bottom:2px solid #f0f0f0}
                  .grid4{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:0}
                  .grid2{display:grid;grid-template-columns:1fr 1fr;gap:14px}
                  .card{border:1px solid #e8e8e8;border-radius:10px;padding:16px}
                  .card-label{font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#94A3B8;margin-bottom:6px;font-weight:600}
                  .card-value{font-size:20px;font-weight:700;color:#D4A843;margin-bottom:2px}
                  .card-note{font-size:11px;color:#64748B}
                  .highlight{background:linear-gradient(135deg,#fffbf0,#fff8e1);border:1px solid #D4A843;border-radius:10px;padding:20px}
                  .highlight h3{font-family:'Playfair Display',serif;font-size:16px;color:#B8912F;margin-bottom:8px}
                  .highlight p{font-size:12px;color:#555;line-height:1.7}
                  .row{display:flex;justify-content:space-between;padding:9px 0;border-bottom:1px solid #f0f0f0;font-size:12px}
                  .row:last-child{border-bottom:none}
                  .row-label{color:#555}
                  .row-value{font-weight:600;color:#111}
                  .footer{margin-top:40px;padding:20px 48px;background:#f8f9fa;border-top:1px solid #e8e8e8;display:flex;justify-content:space-between;align-items:center}
                  .footer-brand{font-family:'Playfair Display',serif;font-size:14px;color:#D4A843;letter-spacing:1px}
                  .footer-note{font-size:10px;color:#94A3B8;max-width:400px;line-height:1.5}
                  @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
                </style></head><body>
                <div class="cover">
                  <div class="logo">DXB Analytics</div>
                  <p class="sub">${p.community} · ${p.district || "Dubai"} · ${p.type || "Residential"}</p>
                  <h1>${p.name}</h1>
                  <div style="margin-top:16px">
                    <span class="badge">${p.status || "Off-Plan"}</span>
                    ${p.branded ? `<span class="badge">${p.brand || "Branded"}</span>` : ""}
                    ${p.tier ? `<span class="badge">${p.tier}</span>` : ""}
                  </div>
                  <p class="date">Generated: ${new Date().toLocaleDateString("en-AE",{day:"2-digit",month:"long",year:"numeric"})}</p>
                </div>

                <div class="body">
                  <div class="section">
                    <div class="section-title">Key Investment Metrics</div>
                    <div class="grid4">
                      <div class="card"><div class="card-label">Starting Price</div><div class="card-value">${p.price ? "AED "+((p.price/1e6).toFixed(2))+"M" : "TBD"}</div><div class="card-note">From</div></div>
                      <div class="card"><div class="card-label">Handover</div><div class="card-value" style="font-size:16px">${p.handover || "TBD"}</div><div class="card-note">Completion</div></div>
                      <div class="card"><div class="card-label">Construction</div><div class="card-value">${p.constructionProgress || 0}%</div><div class="card-note">Progress</div></div>
                      <div class="card"><div class="card-label">Gross Yield</div><div class="card-value">${roiData.grossYield || "6-8"}%</div><div class="card-note">Estimated p.a.</div></div>
                    </div>
                  </div>

                  <div class="section">
                    <div class="section-title">Community ROI Analysis — ${p.community}</div>
                    <div class="grid2">
                      <div>
                        ${[
                          ["Gross Yield", (roiData.grossYield||"6-8")+"%"],
                          ["Net Yield (after fees)", (roiData.netYield||"4-6")+"%"],
                          ["5-Year Capital Appreciation", (roiData.appreciation||"35-45")+"%"],
                          ["Avg Price/sqft", "AED "+(roiData.pricePerSqft||"1,800-2,400")],
                          ["Avg Annual Rent", "AED "+(roiData.avgRent||"90,000-150,000")],
                          ["Occupancy Rate", (roiData.occupancy||"88")+"%"],
                        ].map(([l,v]) => `<div class="row"><span class="row-label">${l}</span><span class="row-value">${v}</span></div>`).join("")}
                      </div>
                      <div class="highlight">
                        <h3>Why ${p.community}?</h3>
                        <p>${(communityIntel[p.community]?.tagline) || "One of Dubai's most sought-after investment communities, offering strong capital appreciation and consistent rental demand."}</p>
                        <p style="margin-top:10px">${(communityIntel[p.community]?.notes) || "Strong fundamentals with infrastructure, schools, retail, and transport connectivity making it a preferred choice for investors and end-users."}</p>
                      </div>
                    </div>
                  </div>

                  ${Array.isArray(p.units) && p.units.length > 0 ? `
                  <div class="section">
                    <div class="section-title">Unit Mix & Availability</div>
                    <div class="grid4">
                      ${p.units.map(u => `<div class="card"><div class="card-label">${u.type}</div><div class="card-value" style="font-size:16px">${u.available}/${u.total}</div><div class="card-note">Available</div></div>`).join("")}
                    </div>
                  </div>` : ""}

                  <div class="section">
                    <div class="section-title">Investment Summary</div>
                    <div class="highlight">
                      <h3>DXB Analytics Assessment</h3>
                      <p>${p.name} by Emaar Properties is a ${p.status === "Completed" ? "completed" : "under-development"} project in ${p.community}, Dubai. ${p.branded ? `As a branded residence (${p.brand}), it commands premium pricing and exceptional rental premiums typically 20-35% above comparable non-branded units. ` : ""}With Dubai's real estate market growing consistently, ${p.community} has delivered strong investor returns. The project's ${p.handover ? `expected handover in ${p.handover}` : "upcoming handover"} aligns with Dubai's infrastructure growth cycle.</p>
                    </div>
                  </div>

                  <div class="section">
                    <div class="section-title">Available Documents</div>
                    <div style="display:flex;gap:10px;flex-wrap:wrap">
                      ${p.brochureUrl ? `<a href="${p.brochureUrl}" target="_blank" style="padding:8px 16px;background:#fff;border:1px solid #D4A843;border-radius:8px;color:#D4A843;font-size:12px;font-weight:600;text-decoration:none">📄 Brochure PDF</a>` : ""}
                      ${p.floorPlanUrl ? `<a href="${p.floorPlanUrl}" target="_blank" style="padding:8px 16px;background:#fff;border:1px solid #D4A843;border-radius:8px;color:#D4A843;font-size:12px;font-weight:600;text-decoration:none">📐 Floor Plan</a>` : ""}
                      ${p.paymentPlanUrl ? `<a href="${p.paymentPlanUrl}" target="_blank" style="padding:8px 16px;background:#fff;border:1px solid #D4A843;border-radius:8px;color:#D4A843;font-size:12px;font-weight:600;text-decoration:none">💳 Payment Plan</a>` : ""}
                      ${!p.brochureUrl && !p.floorPlanUrl && !p.paymentPlanUrl ? `<span style="color:#94A3B8;font-size:12px">Contact us to receive full documentation package.</span>` : ""}
                    </div>
                  </div>
                </div>

                <div class="footer">
                  <div>
                    <div class="footer-brand">DXB ANALYTICS</div>
                    <div style="font-size:10px;color:#94A3B8;margin-top:2px">Dubai Real Estate Intelligence Platform</div>
                  </div>
                  <div class="footer-note">This report is generated for informational purposes only. All projections are estimates based on market data. DXB Analytics does not provide financial advice. Please conduct independent due diligence before making investment decisions.</div>
                </div>
                <script>window.onload=()=>window.print();</script>
                </body></html>`;
                const w = window.open("", "_blank");
                w.document.write(reportHtml);
                w.document.close();
              }} style={{ marginTop: 10, width: "100%", padding: "11px 0", background: "rgba(212,168,67,0.08)", border: `1px solid rgba(212,168,67,0.3)`, borderRadius: 12, color: T.gold, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Outfit', sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Download Investment Report (PDF)
              </button>
            </div>
          </div>
        </div>
        );
      })()}

      {/* ─── COMPARE MODAL ─── */}
      {showCompare && compareList.length >= 2 && (
        <div role="dialog" aria-modal="true" aria-label="Project comparison" style={{ position: "fixed", inset: 0, background: "rgba(4,9,15,0.9)", zIndex: 3000, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(8px)" }} onClick={() => setShowCompare(false)}>
          <div style={{ background: T.surface, borderRadius: 16, border: `1px solid ${T.gold}`, width: "95%", maxWidth: 900, maxHeight: "90vh", overflowY: "auto", padding: 28 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 22, color: T.gold, margin: 0 }}>⚖️ Project Comparison</h2>
              <button type="button" onClick={() => setShowCompare(false)} style={{ background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8, color: T.textMuted, width: 32, height: 32, cursor: "pointer", fontSize: 16 }}>✕</button>
            </div>

            <div className="table-scroll" style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: `2px solid ${T.gold}` }}>
                    <th style={{ padding: "12px 16px", textAlign: "left", color: T.textMuted, fontSize: 11, fontWeight: 600, width: 140 }}>METRIC</th>
                    {compareList.map(p => (
                      <th key={p.id} style={{ padding: "12px 16px", textAlign: "center" }}>
                        <div style={{ fontFamily: "'Fraunces', serif", fontSize: 14, fontWeight: 700, color: T.gold }}>{p.name}</div>
                        <div style={{ fontSize: 10, color: T.textMuted, marginTop: 2 }}>{p.community}</div>
                        {p.emaarUrl && <a href={p.emaarUrl} target="_blank" rel="noopener noreferrer" style={{ display: "inline-block", marginTop: 4, fontSize: 9, color: T.gold, textDecoration: "none", padding: "2px 6px", border: "1px solid rgba(212,168,67,0.35)", borderRadius: 4, fontWeight: 700 }}>{getLinkLabel(p.emaarUrl)}</a>}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: "Status", fn: p => p.status },
                    { label: "Construction", fn: p => `${p.construction}%`, highlight: true },
                    { label: "Starting Price", fn: p => p.price ? `AED ${(p.price/1000000).toFixed(1)}M` : "TBD" },
                    { label: "Price/sqft", fn: p => p.ppsf ? `AED ${p.ppsf.toLocaleString()}` : "TBD" },
                    { label: "Handover", fn: p => p.handover },
                    { label: "Size Range", fn: p => `${p.sizeFrom?.toLocaleString()} - ${p.sizeTo?.toLocaleString()} sqft` },
                    { label: "Bedrooms", fn: p => p.beds + " BR" },
                    { label: "Type", fn: p => p.type },
                    { label: "Payment Plan", fn: p => p.payment },
                    { label: "Tier", fn: p => p.tier },
                    { label: "Branded", fn: p => p.branded ? `✓ ${p.brand}` : "No" },
                    { label: "Total Units", fn: p => p.units ? getUnitEntries(p.units).reduce((a,[,u]) => a + u.total, 0) : "—" },
                    { label: "Available", fn: p => p.units ? getUnitEntries(p.units).reduce((a,[,u]) => a + (u.total - u.sold), 0) : "—", highlight: true },
                    { label: "% Sold", fn: p => { if (!p.units) return "—"; const entries = getUnitEntries(p.units); const t = entries.reduce((a,[,u]) => a + u.total, 0); const s = entries.reduce((a,[,u]) => a + u.sold, 0); return t > 0 ? `${((s/t)*100).toFixed(0)}%` : "—"; } },
                  ].map((row, ri) => (
                    <tr key={ri} style={{ borderBottom: `1px solid ${T.border}`, background: row.highlight ? "rgba(212,168,67,0.04)" : "transparent" }}>
                      <td style={{ padding: "10px 16px", color: T.textMuted, fontSize: 11, fontWeight: 600, textTransform: "uppercase" }}>{row.label}</td>
                      {compareList.map(p => (
                        <td key={p.id} style={{ padding: "10px 16px", textAlign: "center", color: row.highlight ? T.gold : T.white, fontSize: 13, fontWeight: row.highlight ? 700 : 400 }}>{row.fn(p)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* WhatsApp for all */}
            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              {compareList.map(p => (
                isPro ? (
                <a key={p.id} href={whatsappLink(p.name, p.community)} target="_blank" rel="noopener noreferrer"
                  style={{ flex: 1, padding: "10px 0", background: "#25D366", borderRadius: 10, color: "#fff", fontSize: 12, fontWeight: 600, textAlign: "center", textDecoration: "none" }}>
                  Inquire: {p.name.split(" ").slice(0,2).join(" ")}
                </a>
                ) : (
                <button type="button" key={p.id} onClick={() => setShowUpgrade(true)}
                  style={{ flex: 1, padding: "10px 0", background: "rgba(37,211,102,0.15)", borderRadius: 10, color: "rgba(37,211,102,0.5)", fontSize: 12, fontWeight: 600, textAlign: "center", border: "none", cursor: "pointer" }}>
                  🔒 Inquire: {p.name.split(" ").slice(0,2).join(" ")}
                </button>
                )
              ))}
            </div>
            {/* View on Emaar for all compared projects */}
            {compareList.some(p => p.emaarUrl) && (
              <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                {compareList.map(p => p.emaarUrl ? (
                  <a key={p.id} href={p.emaarUrl} target="_blank" rel="noopener noreferrer"
                    style={{ flex: 1, padding: "8px 0", background: "rgba(212,168,67,0.08)", border: "1px solid rgba(212,168,67,0.35)", borderRadius: 10, color: T.gold, fontSize: 11, fontWeight: 700, textAlign: "center", textDecoration: "none" }}>
                    {p.name.split(" ").slice(0,2).join(" ")} ↗ {getLinkDomain(p.emaarUrl)}
                  </a>
                ) : <div key={p.id} style={{ flex: 1 }} />)}
              </div>
            )}
          </div>
        </div>
      )}





      {/* ADD INVESTMENT MODAL */}
      {showAddPortfolio && <div style={{ position: "fixed", inset: 0, background: "rgba(4,9,15,0.9)", zIndex: 3000, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(10px)" }} onClick={() => setShowAddPortfolio(null)}>
        <div style={{ background: T.surface, borderRadius: 20, border: `1px solid ${T.border}`, width: "95%", maxWidth: 520, maxHeight: "90vh", overflow: "auto", position: "relative" }} onClick={e => e.stopPropagation()}>
          <button type="button" onClick={() => setShowAddPortfolio(null)} style={{ position: "absolute", top: 16, right: 16, background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8, color: T.textMuted, width: 32, height: 32, cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 5 }}>{"\u2715"}</button>
          <div style={{ padding: "24px 28px 16px", borderBottom: `1px solid ${T.border}` }}>
            <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 20, fontWeight: 800, color: T.white }}>{typeof showAddPortfolio === "object" ? "Investment Details" : "Select Project"}</h2>
            <p style={{ fontSize: 11, color: T.textMuted, marginTop: 4 }}>{typeof showAddPortfolio === "object" ? showAddPortfolio.name + " \u00b7 " + showAddPortfolio.community : "Choose from 48 Emaar projects"}</p>
          </div>
          <div style={{ padding: "16px 28px 28px" }}>
            {showAddPortfolio === true ? <>
              <input type="text" placeholder="Search projects..." onChange={e => setProjectSearch(e.target.value)} style={{ width: "100%", padding: "10px 12px", background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8, color: T.white, fontSize: 13, fontFamily: "'Outfit', sans-serif", outline: "none", marginBottom: 12 }} />
              <div style={{ maxHeight: 320, overflow: "auto" }}>
                {activeProjects.filter(p => !projectSearch || p.name.toLowerCase().includes(projectSearch.toLowerCase()) || p.community.toLowerCase().includes(projectSearch.toLowerCase())).map(p => (
                  <div key={p.id} onClick={() => setShowAddPortfolio(p)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", borderRadius: 8, cursor: "pointer", transition: "background 0.2s", marginBottom: 2 }} onMouseEnter={e => e.currentTarget.style.background = T.surfaceAlt} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: T.white }}>{p.name}</span>
                        {p.emaarUrl && <a href={p.emaarUrl} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ fontSize: 9, color: T.gold, textDecoration: "none", padding: "1px 4px", border: "1px solid rgba(212,168,67,0.3)", borderRadius: 3, fontWeight: 700, flexShrink: 0 }}>↗</a>}
                      </div>
                      <div style={{ fontSize: 10, color: T.textMuted }}>{p.community} \u00b7 {p.type} \u00b7 {p.beds}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: T.gold }}>AED {p.price ? (p.price/1e6).toFixed(2) + "M" : "TBD"}</div>
                      <div style={{ fontSize: 9, color: T.textMuted }}>{p.handover}</div>
                      {(() => { const cd = getHandoverCountdown(p.handover); return cd ? <div style={{ fontSize: 9, fontWeight: 700, color: cd.passed ? "#10B981" : cd.color, marginTop: 1 }}>{cd.passed ? "\u2713 Ready" : "\u23F1 " + cd.label}</div> : null; })()}
                    </div>
                  </div>
                ))}
              </div>
            </> : typeof showAddPortfolio === "object" && <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ fontSize: 10, color: T.textMuted, fontWeight: 600, display: "block", marginBottom: 4 }}>UNIT TYPE</label>
                  <select value={portfolioForm.unitType} onChange={e => setPortfolioForm({...portfolioForm, unitType: e.target.value})} style={{ width: "100%", padding: "10px 12px", background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8, color: T.white, fontSize: 13, fontFamily: "'Outfit', sans-serif" }}>
                    {["Studio", "1BR", "2BR", "3BR", "4BR", "5BR", "Penthouse", "Townhouse", "Villa"].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 10, color: T.textMuted, fontWeight: 600, display: "block", marginBottom: 4 }}>UNITS</label>
                  <input type="number" min="1" value={portfolioForm.units} onChange={e => setPortfolioForm({...portfolioForm, units: parseInt(e.target.value) || 1})} style={{ width: "100%", padding: "10px 12px", background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8, color: T.white, fontSize: 13, fontFamily: "'Outfit', sans-serif", outline: "none" }} />
                </div>
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 10, color: T.textMuted, fontWeight: 600, display: "block", marginBottom: 4 }}>INVESTED AMOUNT (AED)</label>
                <input type="number" placeholder={showAddPortfolio.price ? showAddPortfolio.price.toString() : "Enter amount"} value={portfolioForm.investedAmount} onChange={e => setPortfolioForm({...portfolioForm, investedAmount: e.target.value})} style={{ width: "100%", padding: "10px 12px", background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8, color: T.white, fontSize: 13, fontFamily: "'Outfit', sans-serif", outline: "none" }} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ fontSize: 10, color: T.textMuted, fontWeight: 600, display: "block", marginBottom: 4 }}>PURCHASE DATE</label>
                  <input type="date" value={portfolioForm.purchaseDate} onChange={e => setPortfolioForm({...portfolioForm, purchaseDate: e.target.value})} style={{ width: "100%", padding: "10px 12px", background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8, color: T.white, fontSize: 13, fontFamily: "'Outfit', sans-serif", outline: "none" }} />
                </div>
                <div>
                  <label style={{ fontSize: 10, color: T.textMuted, fontWeight: 600, display: "block", marginBottom: 4 }}>NOTES</label>
                  <input type="text" placeholder="Optional notes" value={portfolioForm.notes} onChange={e => setPortfolioForm({...portfolioForm, notes: e.target.value})} style={{ width: "100%", padding: "10px 12px", background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8, color: T.white, fontSize: 13, fontFamily: "'Outfit', sans-serif", outline: "none" }} />
                </div>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button type="button" onClick={() => setShowAddPortfolio(true)} style={{ flex: 1, padding: "10px 0", background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8, color: T.textSecondary, fontWeight: 600, fontSize: 12, cursor: "pointer", fontFamily: "'Outfit', sans-serif" }}>{"\u2190 Back"}</button>
                <button type="button" onClick={addToPortfolio} style={{ flex: 2, padding: "10px 0", background: `linear-gradient(135deg, ${T.gold}, #B8912F)`, color: T.bg, border: "none", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "'Outfit', sans-serif" }}>Add to Portfolio</button>
              </div>
            </>}
          </div>
        </div>
      </div>}

      {/* SET ALERT MODAL */}
      {showSetAlert && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(4,9,15,0.9)", zIndex: 3200, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(10px)" }} onClick={() => setShowSetAlert(null)}>
          <div style={{ background: T.surface, borderRadius: 20, border: `1px solid ${T.border}`, width: "min(440px,95vw)", padding: "28px 28px 24px", position: "relative" }} onClick={e => e.stopPropagation()}>
            <button type="button" onClick={() => setShowSetAlert(null)} style={{ position: "absolute", top: 16, right: 16, background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8, color: T.textMuted, width: 32, height: 32, cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 10, color: T.gold, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 6 }}>Price Alert</div>
              <div style={{ fontFamily: "'Fraunces', serif", fontSize: 20, fontWeight: 800, color: T.white }}>{showSetAlert.name}</div>
              <div style={{ fontSize: 12, color: T.textMuted, marginTop: 3 }}>{showSetAlert.community} · {showSetAlert.type}</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 6, fontWeight: 600 }}>ALERT TYPE</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {[["price_below","Price drops below",""], ["price_above","Price rises above",""], ["yield_above","Yield crosses",""], ["construction_above","Construction hits",""]].map(([val, label]) => (
                    <button key={val} type="button" onClick={() => setAlertForm(f => ({ ...f, type: val, value: val === "yield_above" ? "7" : val === "construction_above" ? "80" : (showSetAlert.price||"").toString() }))} style={{ padding: "10px 12px", borderRadius: 10, border: `1px solid ${alertForm.type === val ? T.gold : T.border}`, background: alertForm.type === val ? "rgba(212,168,67,0.12)" : T.surfaceAlt, color: alertForm.type === val ? T.gold : T.textSecondary, fontSize: 11, fontWeight: alertForm.type === val ? 700 : 400, cursor: "pointer", textAlign: "left", fontFamily: "'Outfit', sans-serif" }}>{label}</button>
                  ))}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 6, fontWeight: 600 }}>{alertForm.type === "yield_above" ? "YIELD THRESHOLD (%)" : alertForm.type === "construction_above" ? "CONSTRUCTION % TARGET" : "PRICE TARGET (AED)"}</div>
                <input type="number" value={alertForm.value} onChange={e => setAlertForm(f => ({ ...f, value: e.target.value }))} placeholder={alertForm.type === "yield_above" ? "e.g. 7" : alertForm.type === "construction_above" ? "e.g. 80" : showSetAlert.price ? showSetAlert.price.toString() : "Enter amount"} style={{ width: "100%", padding: "12px 14px", background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 10, color: T.white, fontSize: 14, fontFamily: "'Outfit', sans-serif", outline: "none", boxSizing: "border-box" }} />
                {alertForm.type.includes("price") && alertForm.value && <div style={{ fontSize: 11, color: T.textMuted, marginTop: 6 }}>AED {(Number(alertForm.value)/1e6).toFixed(2)}M {alertForm.type === "price_below" ? "below" : "above"} current AED {(showSetAlert.price/1e6).toFixed(2)}M</div>}
              </div>
              {myAlerts.filter(a => a.projectId === showSetAlert.id).length > 0 && (
                <div style={{ padding: "10px 12px", background: "rgba(212,168,67,0.06)", borderRadius: 8, border: "1px solid rgba(212,168,67,0.2)" }}>
                  <div style={{ fontSize: 10, color: T.gold, fontWeight: 700, marginBottom: 6 }}>EXISTING ALERTS</div>
                  {myAlerts.filter(a => a.projectId === showSetAlert.id).map(a => (
                    <div key={a.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11, color: T.textMuted, marginBottom: 3 }}>
                      <span>{a.type.replace(/_/g," ")} {a.type.includes("yield") || a.type.includes("construction") ? a.value + "%" : "AED " + (a.value/1e6).toFixed(2) + "M"} {a.triggered ? "✓ Triggered" : "⏳ Watching"}</span>
                      <button type="button" onClick={() => removeAlert(a.id)} style={{ background: "none", border: "none", color: "rgba(239,68,68,0.6)", cursor: "pointer", fontSize: 12, padding: 0 }}>Remove</button>
                    </div>
                  ))}
                </div>
              )}
              <button type="button" onClick={addAlert} disabled={!alertForm.value} style={{ width: "100%", padding: "13px 0", background: alertForm.value ? `linear-gradient(135deg, ${T.gold}, #B8912F)` : T.surfaceAlt, color: alertForm.value ? T.bg : T.textMuted, border: "none", borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: alertForm.value ? "pointer" : "not-allowed", fontFamily: "'Outfit', sans-serif" }}>Set Alert</button>
            </div>
          </div>
        </div>
      )}

      {/* CHECKOUT PAYMENT MODAL */}}
      {showCheckout && <div role="dialog" aria-modal="true" aria-label="Upgrade checkout" style={{ position: "fixed", inset: 0, background: "rgba(4,9,15,0.95)", zIndex: 3100, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(12px)" }} onClick={() => { setShowCheckout(null); setCheckoutStep(1); }}>
        <div style={{ background: T.surface, borderRadius: 20, border: `1px solid ${T.border}`, width: "95%", maxWidth: 480, position: "relative", overflow: "hidden" }} onClick={e => e.stopPropagation()}>
          <button type="button" onClick={() => { setShowCheckout(null); setCheckoutStep(1); }} style={{ position: "absolute", top: 16, right: 16, background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8, color: T.textMuted, width: 32, height: 32, cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 5 }}>{"\u2715"}</button>
          <div style={{ padding: "24px 28px 16px", borderBottom: `1px solid ${T.border}` }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 16 }}>
              {[1,2,3].map(s => <React.Fragment key={s}><div style={{ width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, background: checkoutStep >= s ? T.gold : T.surfaceAlt, color: checkoutStep >= s ? T.bg : T.textMuted, border: `1px solid ${checkoutStep >= s ? T.gold : T.border}` }}>{checkoutStep > s ? "\u2713" : s}</div>{s < 3 && <div style={{ width: 40, height: 2, background: checkoutStep > s ? T.gold : T.surfaceAlt, borderRadius: 1 }} />}</React.Fragment>)}
            </div>
            <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 20, fontWeight: 800, color: T.white, textAlign: "center" }}>{checkoutStep === 1 ? "Confirm Plan" : checkoutStep === 2 ? "Payment" : "Welcome to Pro!"}</h2>
          </div>
          <div style={{ padding: "20px 28px 28px" }}>
            {checkoutStep === 1 && <>
              <div style={{ padding: 16, borderRadius: 12, background: T.surfaceAlt, border: `2px solid ${T.gold}`, marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}><span style={{ fontFamily: "'Fraunces', serif", fontSize: 18, fontWeight: 800, color: T.gold }}>{showCheckout.name} Plan</span><span style={{ fontSize: 10, padding: "3px 10px", borderRadius: 6, background: "rgba(212,168,67,0.12)", color: T.gold }}>SELECTED</span></div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 3, marginBottom: 12 }}><span style={{ fontSize: 10, color: T.textMuted }}>AED</span><span style={{ fontFamily: "'Fraunces', serif", fontSize: 32, fontWeight: 900, color: T.white }}>{showCheckout.price}</span><span style={{ fontSize: 12, color: T.textMuted }}>/month</span></div>
                {showCheckout.features.slice(0,5).map((f,j) => <div key={j} style={{ display: "flex", alignItems: "center", gap: 6, padding: "3px 0", fontSize: 12, color: T.textSecondary }}><span style={{ color: T.green }}>{"\u2713"}</span>{f}</div>)}
              </div>
              <button type="button" onClick={() => setCheckoutStep(2)} style={{ width: "100%", padding: "12px 0", background: `linear-gradient(135deg, ${T.gold}, #B8912F)`, color: T.bg, border: "none", borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "'Outfit', sans-serif" }}>Continue to Payment →</button>
            </>}
            {checkoutStep === 2 && <>
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, letterSpacing: 1, marginBottom: 12 }}>CHOOSE PAYMENT METHOD</div>

                {/* Stripe Payment Links */}
                {(() => {
                  // ─── STRIPE PAYMENT LINKS ───────────────────────────────
                  // After creating links in stripe.com/payment-links, paste them here:
                  const STRIPE_LINKS = {
                    "Pro":        "PASTE_YOUR_PRO_STRIPE_LINK_HERE",
                    "Enterprise": "PASTE_YOUR_ENTERPRISE_STRIPE_LINK_HERE",
                  };
                  const stripeUrl = STRIPE_LINKS[showCheckout.name];
                  const finalUrl = stripeUrl && !stripeUrl.startsWith("PASTE")
                    ? `${stripeUrl}?prefilled_email=${encodeURIComponent(user || "")}`
                    : null;
                  return (
                    <div onClick={() => {
                      if (finalUrl) {
                        window.location.href = finalUrl;
                      } else {
                        window.open(`https://wa.me/971542410599?text=${encodeURIComponent(`Hi, I want DXB Analytics ${showCheckout.name} Plan (AED ${showCheckout.price}/mo). Email: ${user}`)}`, "_blank");
                        setCheckoutStep(3);
                      }
                    }} style={{ padding: "16px", borderRadius: 12, background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.3)", display: "flex", alignItems: "center", gap: 12, cursor: "pointer", transition: "all 0.2s", marginBottom: 8 }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = "#3B82F6"}
                      onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(59,130,246,0.3)"}>
                      <div style={{ fontSize: 24 }}>💳</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>Credit / Debit Card</div>
                        <div style={{ fontSize: 10, color: T.textMuted }}>Visa · Mastercard · Amex · Apple Pay — powered by Stripe</div>
                      </div>
                      <span style={{ fontSize: 9, padding: "3px 10px", borderRadius: 6, background: "rgba(34,197,94,0.12)", color: "#22C55E", fontWeight: 700, border: "1px solid rgba(34,197,94,0.2)" }}>RECOMMENDED</span>
                    </div>
                  );
                })()}

                {/* WhatsApp */}
                <div onClick={() => { window.open(`https://wa.me/971542410599?text=${encodeURIComponent(`Hi Mian Waleed, I want to subscribe to DXB Analytics ${showCheckout.name} Plan (AED ${showCheckout.price}/mo). My email: ${user}`)}`, "_blank"); setCheckoutStep(3); }} style={{ padding: "16px", borderRadius: 12, background: "rgba(37,211,102,0.06)", border: "1px solid rgba(37,211,102,0.25)", display: "flex", alignItems: "center", gap: 12, cursor: "pointer", transition: "all 0.2s", marginBottom: 8 }} onMouseEnter={e => e.currentTarget.style.borderColor = "#25D366"} onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(37,211,102,0.25)"}>
                  <div style={{ fontSize: 24 }}>💬</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>WhatsApp + Bank Transfer</div>
                    <div style={{ fontSize: 10, color: T.textMuted }}>Manual — activated within 5 minutes of payment</div>
                  </div>
                  <span style={{ color: "#25D366", fontSize: 16 }}>→</span>
                </div>

                <div style={{ padding: "10px 14px", borderRadius: 8, background: "rgba(212,168,67,0.04)", border: "1px solid rgba(212,168,67,0.1)", fontSize: 11, color: T.textMuted, lineHeight: 1.5, marginBottom: 12 }}>🔒 All payments secure · 7-day money-back guarantee</div>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button type="button" onClick={() => setCheckoutStep(1)} style={{ width: "100%", padding: "10px 0", background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8, color: T.textSecondary, fontWeight: 600, fontSize: 12, cursor: "pointer", fontFamily: "'Outfit', sans-serif" }}>← Back</button>
              </div>
            </>}
            {checkoutStep === 3 && <div style={{ textAlign: "center", padding: "20px 0" }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
              <div style={{ fontFamily: "'Fraunces', serif", fontSize: 20, fontWeight: 800, color: T.gold, marginBottom: 8 }}>Payment Request Sent!</div>
              <div style={{ fontSize: 13, color: T.textSecondary, maxWidth: 320, margin: "0 auto", lineHeight: 1.6, marginBottom: 20 }}>We opened WhatsApp for you. After confirming payment, your {showCheckout.name} Plan will be activated within 5 minutes.</div>
              <div style={{ padding: 12, borderRadius: 10, background: T.surfaceAlt, border: `1px solid ${T.border}`, marginBottom: 16, fontSize: 11, color: T.textMuted }}>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}><span>Plan</span><span style={{ color: T.gold, fontWeight: 700 }}>{showCheckout.name}</span></div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}><span>Amount</span><span style={{ color: T.white, fontWeight: 700 }}>AED {showCheckout.price}/mo</span></div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}><span>Account</span><span style={{ color: T.white }}>{user}</span></div>
              </div>
              <button type="button" onClick={() => { setShowCheckout(null); setCheckoutStep(1); setShowUpgrade(false); }} style={{ width: "100%", padding: "12px 0", background: T.gold, color: T.bg, border: "none", borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "'Outfit', sans-serif" }}>Done</button>
            </div>}
          </div>
        </div>
      </div>}

      {/* USER PROFILE MODAL */}
      {showProfile && <div role="dialog" aria-modal="true" aria-label="User profile" style={{ position: "fixed", inset: 0, background: "rgba(4,9,15,0.9)", zIndex: 3000, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(10px)" }} onClick={() => setShowProfile(false)}>
        <div style={{ background: T.surface, borderRadius: 20, border: `1px solid ${T.border}`, width: "95%", maxWidth: 560, maxHeight: "90vh", overflow: "auto", position: "relative" }} onClick={e => e.stopPropagation()}>
          <button type="button" onClick={() => setShowProfile(false)} style={{ position: "absolute", top: 16, right: 16, background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8, color: T.textMuted, width: 32, height: 32, cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 5 }}>\u2715</button>
          <div style={{ padding: "32px 28px 20px", background: `linear-gradient(135deg, rgba(212,168,67,0.08), rgba(14,29,53,0.6))`, borderBottom: `1px solid ${T.border}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", background: `linear-gradient(135deg, ${T.gold}, #B8912F)`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 22, color: T.bg, flexShrink: 0 }}>{user.charAt(0).toUpperCase()}</div>
              <div>
                <div style={{ fontFamily: "'Fraunces', serif", fontSize: 20, fontWeight: 800, color: T.white }}>{userName || user.split("@")[0]}</div>
                <div style={{ fontSize: 12, color: T.textSecondary, marginTop: 2 }}>{user}</div>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 4, marginTop: 6, padding: "3px 10px", borderRadius: 6, background: userTier === "admin" || userTier === "pro" || userTier === "enterprise" ? "rgba(16,185,129,0.12)" : userTier === "pro_trial" ? "rgba(212,168,67,0.12)" : "rgba(59,130,246,0.12)", fontSize: 10, fontWeight: 700, color: userTier === "admin" || userTier === "pro" || userTier === "enterprise" ? T.green : userTier === "pro_trial" ? T.gold : T.blue }}>{userTier === "admin" ? "\u26A1 Admin" : userTier === "pro" ? "\u2B50 Pro Plan" : userTier === "pro_trial" ? `\u2B50 Pro Trial \u00B7 ${trialDaysLeft}d left` : userTier === "enterprise" ? "\uD83C\uDFE2 Enterprise" : "Free Plan"}</div>
              </div>
            </div>
          </div>
          <div style={{ padding: "20px 28px 28px" }}>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>Profile Details</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div><label style={{ fontSize: 10, color: T.textMuted, fontWeight: 600, display: "block", marginBottom: 4 }}>DISPLAY NAME</label><input type="text" value={profileEdit.name} onChange={e => setProfileEdit({...profileEdit, name: e.target.value})} placeholder="Your name" style={{ width: "100%", padding: "10px 12px", background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8, color: T.white, fontSize: 13, fontFamily: "'Outfit', sans-serif", outline: "none" }} /></div>
                <div><label style={{ fontSize: 10, color: T.textMuted, fontWeight: 600, display: "block", marginBottom: 4 }}>EMAIL</label><input type="email" value={user} disabled style={{ width: "100%", padding: "10px 12px", background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8, color: T.textMuted, fontSize: 13, fontFamily: "'Outfit', sans-serif", outline: "none", opacity: 0.6 }} /></div>
              </div>
              <button type="button" onClick={async () => { if (auth.currentUser && profileEdit.name.trim()) { try { await setDoc(doc(db, "users", auth.currentUser.uid), { name: profileEdit.name.trim() }, { merge: true }); setUserName(profileEdit.name.trim()); setToast("\u2705 Profile updated!"); setTimeout(() => setToast(""), 3000); } catch(e) { setToast("\u274C Update failed"); setTimeout(() => setToast(""), 3000); } } }} style={{ marginTop: 10, padding: "8px 20px", background: T.gold, color: T.bg, border: "none", borderRadius: 8, fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "'Outfit', sans-serif" }}>Save Changes</button>
            </div>
            <div style={{ marginBottom: 20, padding: 16, borderRadius: 12, background: T.surfaceAlt, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 12 }}>Subscription</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                <div><div style={{ fontSize: 10, color: T.textMuted }}>Plan</div><div style={{ fontSize: 14, fontWeight: 700, color: T.gold, fontFamily: "'Fraunces', serif" }}>{userTier === "admin" ? "Admin" : userTier === "pro" ? "Pro" : userTier === "pro_trial" ? "Pro Trial" : userTier === "enterprise" ? "Enterprise" : "Free"}</div></div>
                <div><div style={{ fontSize: 10, color: T.textMuted }}>Status</div><div style={{ fontSize: 14, fontWeight: 700, color: userTier === "free" ? T.blue : T.green }}>{userTier === "free" ? "Limited" : "Active"}</div></div>
                <div><div style={{ fontSize: 10, color: T.textMuted }}>Access</div><div style={{ fontSize: 14, fontWeight: 700, color: T.white }}>{userTier === "free" ? "5 projects" : "All 48"}</div></div>
              </div>
              {(userTier === "free" || userTier === "pro_trial") && <button type="button" onClick={() => { setShowProfile(false); setShowUpgrade(true); }} style={{ marginTop: 12, width: "100%", padding: "10px 0", background: `linear-gradient(135deg, ${T.gold}, #B8912F)`, color: T.bg, border: "none", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "'Outfit', sans-serif" }}>{userTier === "pro_trial" ? "Subscribe Before Trial Ends" : "\u2B50 Upgrade to Pro \u2014 AED 99/mo"}</button>}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <button type="button" onClick={() => { setShowProfile(false); handleTabChange("Portfolio"); }} style={{ padding: "10px 0", background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8, color: T.textSecondary, fontWeight: 600, fontSize: 12, cursor: "pointer", fontFamily: "'Outfit', sans-serif" }}>\uD83D\uDCCA Portfolio</button>
              <button type="button" onClick={() => { signOut(auth); setShowProfile(false); }} style={{ padding: "10px 0", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, color: "#EF4444", fontWeight: 600, fontSize: 12, cursor: "pointer", fontFamily: "'Outfit', sans-serif" }}>Sign Out</button>
            </div>
          </div>
        </div>
      </div>}

      {/* ─── KPI DETAIL MODAL ─── */}
      {selectedKPI && (
        <div role="dialog" aria-modal="true" aria-label={`${selectedKPI?.label} details`} style={{ position: "fixed", inset: 0, background: "rgba(4,9,15,0.92)", zIndex: 5000, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(10px)", padding: 16 }} onClick={() => setSelectedKPI(null)}>
          <div style={{ background: T.surface, borderRadius: 20, border: `1px solid ${selectedKPI.color || T.gold}`, width: "95%", maxWidth: 640, maxHeight: "88vh", overflowY: "auto", position: "relative", boxShadow: `0 24px 80px rgba(0,0,0,0.6), 0 0 40px ${selectedKPI.color || T.gold}22` }} onClick={e => e.stopPropagation()}>
            <button type="button" onClick={() => setSelectedKPI(null)} style={{ position: "absolute", top: 16, right: 16, background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8, color: T.textMuted, width: 32, height: 32, cursor: "pointer", fontSize: 16, zIndex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
            <div style={{ padding: 28 }}>
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: T.textMuted, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 6 }}>{selectedKPI.label}</div>
                <div style={{ fontFamily: "'Fraunces', serif", fontSize: 38, fontWeight: 900, color: selectedKPI.color || T.gold, lineHeight: 1 }}>{selectedKPI.value}</div>
                {selectedKPI.description && <p style={{ marginTop: 10, fontSize: 13, color: T.textSecondary, lineHeight: 1.6 }}>{selectedKPI.description}</p>}
              </div>
              {selectedKPI.items && (
                <>
                  <div style={{ fontSize: 10, fontWeight: 600, color: T.textMuted, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 10 }}>Breakdown</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 20 }}>
                    {selectedKPI.items.map((item, i) => (
                      <div key={i} style={{ background: T.surfaceAlt, borderRadius: 10, padding: "12px 14px", border: `1px solid ${T.border}` }}>
                        <div style={{ fontSize: 9, color: T.textMuted, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4 }}>{item.label}</div>
                        <div style={{ fontSize: 16, fontWeight: 800, fontFamily: "'Fraunces', serif", color: selectedKPI.color || T.gold }}>{item.value}</div>
                        {item.note && <div style={{ fontSize: 10, color: T.textSecondary, marginTop: 2 }}>{item.note}</div>}
                      </div>
                    ))}
                  </div>
                </>
              )}
              {selectedKPI.trend && selectedKPI.trend.length > 0 && (() => {
                const max = Math.max(...selectedKPI.trend.map(d => d.v));
                return (
                  <>
                    <div style={{ fontSize: 10, fontWeight: 600, color: T.textMuted, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 10 }}>Historical Trend</div>
                    <div style={{ background: T.surfaceAlt, borderRadius: 12, padding: 16, border: `1px solid ${T.border}`, marginBottom: 20 }}>
                      <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 80 }}>
                        {selectedKPI.trend.map((d, i) => {
                          const pct = (d.v / max) * 100;
                          const isLast = i === selectedKPI.trend.length - 1;
                          return (
                            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                              <div style={{ width: "100%", background: isLast ? (selectedKPI.color || T.gold) : T.border, borderRadius: "3px 3px 0 0", height: `${pct}%`, minHeight: 4, position: "relative" }}>
                                {isLast && <div style={{ position: "absolute", top: -18, left: "50%", transform: "translateX(-50%)", fontSize: 9, color: selectedKPI.color || T.gold, fontWeight: 700, whiteSpace: "nowrap" }}>▲ Latest</div>}
                              </div>
                              <div style={{ fontSize: 9, color: T.textMuted }}>{d.y}</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </>
                );
              })()}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 16, borderTop: `1px solid ${T.border}` }}>
                <div>
                  <div style={{ fontSize: 9, color: T.textMuted, textTransform: "uppercase", letterSpacing: 0.8 }}>Source</div>
                  <div style={{ fontSize: 11, color: T.textSecondary, marginTop: 2 }}>{selectedKPI.source}</div>
                </div>
                {selectedKPI.sourceUrl && selectedKPI.sourceUrl !== "#" && (
                  <a href={selectedKPI.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ padding: "8px 16px", background: selectedKPI.color || T.gold, color: T.bg, borderRadius: 8, fontSize: 11, fontWeight: 700, textDecoration: "none", fontFamily: "'Outfit', sans-serif" }}>View Source ↗</a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── NOTIFICATIONS PANEL ─── */}
      {showNotifications && (
        <div style={{ position: "fixed", top: 60, right: 16, width: 360, maxHeight: 480, background: T.surface, borderRadius: 16, border: `1px solid ${T.border}`, boxShadow: "0 20px 60px rgba(0,0,0,0.6)", zIndex: 4000, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "16px 20px", borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontFamily: "'Fraunces',serif", fontSize: 15, fontWeight: 700, color: T.white }}>Notifications</div>
              {unreadCount > 0 && <div style={{ fontSize: 11, color: T.gold }}>{unreadCount} unread</div>}
            </div>
            <button type="button" onClick={() => setShowNotifications(false)} style={{ background: "none", border: "none", color: T.textMuted, cursor: "pointer", fontSize: 18 }}>✕</button>
          </div>
          <div style={{ overflowY: "auto", flex: 1 }}>
            {isPro && myAlerts.filter(a => !a.triggered).length > 0 && (
              <div style={{ padding: "10px 16px", borderBottom: `1px solid ${T.border}`, background: "rgba(212,168,67,0.04)" }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: T.goldLight, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>Active Alerts ({myAlerts.filter(a => !a.triggered).length})</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {myAlerts.map(a => (
                    <div key={a.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: a.triggered ? "rgba(16,185,129,0.08)" : T.surfaceAlt, borderRadius: 8, padding: "8px 10px", border: `1px solid ${a.triggered ? "rgba(16,185,129,0.2)" : T.border}` }}>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: a.triggered ? "#10B981" : T.white }}>{a.projectName}</div>
                        <div style={{ fontSize: 10, color: T.textMuted }}>{a.type.replace(/_/g," ")} {a.type.includes("yield") || a.type.includes("construction") ? a.value + "%" : "AED " + (a.value/1e6).toFixed(2) + "M"} {a.triggered ? "✓ Triggered" : "⏳ Watching"}</div>
                      </div>
                      <button type="button" onClick={() => removeAlert(a.id)} style={{ background: "none", border: "none", color: T.textMuted, cursor: "pointer", fontSize: 16, padding: "0 4px" }}>×</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {notifications.length === 0 ? (
              <div style={{ padding: 40, textAlign: "center", color: T.textMuted }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>🔔</div>
                <div style={{ fontSize: 13, color: T.textSecondary, marginBottom: 4 }}>No notifications yet</div>
                <div style={{ fontSize: 11 }}>Set alerts on project cards 🔕 to get notified of price changes.</div>
              </div>
            ) : notifications.map((n, i) => (
              <div key={n.id} onClick={() => markNotifRead(n.id)} style={{ padding: "14px 20px", borderBottom: `1px solid ${T.border}`, cursor: "pointer", background: n.read ? "transparent" : "rgba(212,168,67,0.04)", transition: "background 0.2s" }}
                onMouseEnter={e => e.currentTarget.style.background = T.surfaceAlt}
                onMouseLeave={e => e.currentTarget.style.background = n.read ? "transparent" : "rgba(212,168,67,0.04)"}>
                <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <span style={{ fontSize: 18, flexShrink: 0 }}>{n.icon || "📢"}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: n.read ? 400 : 700, color: n.read ? T.textSecondary : T.white, marginBottom: 3 }}>{n.title || "Update"}</div>
                    <div style={{ fontSize: 11, color: T.textMuted, lineHeight: 1.5 }}>{n.message}</div>
                    <div style={{ fontSize: 10, color: T.textMuted, marginTop: 5 }}>{n.createdAt ? new Date(n.createdAt).toLocaleDateString("en-AE", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : ""}</div>
                  </div>
                  {!n.read && <div style={{ width: 8, height: 8, borderRadius: "50%", background: T.gold, flexShrink: 0, marginTop: 4 }} />}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── WATCHLIST PANEL ─── */}
      {showWatchlist && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(4,9,15,0.85)", zIndex: 3500, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(8px)" }} onClick={() => setShowWatchlist(false)}>
          <div style={{ background: T.surface, borderRadius: 20, border: `1px solid ${T.border}`, width: "min(640px,95vw)", maxHeight: "80vh", overflow: "hidden", display: "flex", flexDirection: "column" }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: "20px 24px", borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontFamily: "'Fraunces',serif", fontSize: 18, fontWeight: 700, color: T.gold }}>⭐ My Watchlist</div>
                <div style={{ fontSize: 12, color: T.textMuted, marginTop: 2 }}>{watchlist.length} project{watchlist.length !== 1 ? "s" : ""} saved</div>
              </div>
              <button type="button" onClick={() => setShowWatchlist(false)} style={{ background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8, color: T.textMuted, width: 32, height: 32, cursor: "pointer", fontSize: 16 }}>✕</button>
            </div>
            <div style={{ overflowY: "auto", padding: 20, flex: 1 }}>
              {watchlist.length === 0 ? (
                <div style={{ textAlign: "center", padding: "48px 20px", color: T.textMuted }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>☆</div>
                  <div style={{ fontSize: 14, color: T.textSecondary, marginBottom: 8 }}>No projects saved yet</div>
                  <div style={{ fontSize: 12 }}>Click the ☆ star on any project card to add it here.</div>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {watchlist.map((w, i) => {
                    const liveP = activeProjects.find(p => p.id === w.id);
                    const currentPrice = liveP?.price || w.price;
                    const priceChanged = liveP && w.price && liveP.price !== w.price;
                    return (
                      <div key={w.id} style={{ background: T.card, borderRadius: 12, border: `1px solid ${T.border}`, padding: "14px 16px", display: "flex", alignItems: "center", gap: 14, cursor: "pointer", transition: "all 0.2s" }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = T.gold}
                        onMouseLeave={e => e.currentTarget.style.borderColor = T.border}
                        onClick={() => { setSelectedProject(liveP || w); setShowWatchlist(false); }}>
                        {liveP?.imageUrl && <img src={liveP.imageUrl} alt="" style={{ width: 56, height: 56, borderRadius: 8, objectFit: "cover", flexShrink: 0 }} onError={e => e.target.style.display="none"} />}
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: T.white, marginBottom: 3 }}>{w.name}</div>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span style={{ fontSize: 11, color: T.textMuted }}>{w.community}</span>
                            {liveP?.emaarUrl && <a href={liveP.emaarUrl} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ fontSize: 9, color: T.gold, textDecoration: "none", padding: "1px 5px", border: "1px solid rgba(212,168,67,0.35)", borderRadius: 4, fontWeight: 700 }}>{getLinkLabel(liveP?.emaarUrl)}</a>}
                          </div>
                          {priceChanged && <div style={{ fontSize: 10, color: liveP.price > w.price ? T.red : T.green, marginTop: 4, fontWeight: 600 }}>{liveP.price > w.price ? "↑" : "↓"} Price changed since you saved this</div>}
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: T.gold }}>AED {currentPrice ? (currentPrice / 1e6).toFixed(2) + "M" : "—"}</div>
                          <div style={{ fontSize: 10, color: T.textMuted, marginTop: 2 }}>Starting from</div>
                        </div>
                        <button type="button" onClick={e => { e.stopPropagation(); toggleWatchlist(w); }} style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 6, color: "#EF4444", padding: "4px 8px", cursor: "pointer", fontSize: 11, flexShrink: 0 }}>Remove</button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── ONBOARDING MODAL ─── */}
      {showOnboarding && (() => {
        const steps = [
          {
            icon: "🏙️",
            title: `Welcome to DXB Analytics, ${userName || "Investor"}!`,
            body: "You now have access to Dubai's most comprehensive real estate intelligence platform. Let us show you around in 30 seconds.",
            cta: "Let's Go →"
          },
          {
            icon: "🔍",
            title: "Browse 48+ Emaar Projects",
            body: "Go to the Projects tab to explore every active development. Filter by community, tier, handover year, or price range. Click any card for full details, documents, and ROI analysis.",
            cta: "Next →"
          },
          {
            icon: "⭐",
            title: "Build Your Watchlist",
            body: "See the ☆ star button on every project card? Click it to save projects you're interested in. Your watchlist syncs across devices.",
            cta: "Next →"
          },
          {
            icon: "📊",
            title: "Yields, ROI & Mortgage",
            body: "Use the Yields tab for rental returns by community. The Mortgage tab calculates your monthly payment + all UAE transaction costs instantly.",
            cta: "Next →"
          },
          {
            icon: "🚀",
            title: "You're All Set!",
            body: userTier === "free" ? "You're on the Free plan. Upgrade to Pro for compare mode, full project details, PDF reports, and portfolio tracking — from AED 99/month." : "You have full Pro access. Explore everything — compare projects, track your portfolio, and download reports.",
            cta: userTier === "free" ? "Explore Free Features" : "Start Exploring"
          },
        ];
        const step = steps[onboardingStep];
        return (
          <div style={{ position: "fixed", inset: 0, background: "rgba(4,9,15,0.92)", zIndex: 9000, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(16px)" }}>
            <div style={{ background: T.surface, borderRadius: 24, border: `1px solid rgba(212,168,67,0.3)`, width: "min(480px,94vw)", padding: "40px 36px", textAlign: "center", position: "relative", boxShadow: "0 40px 100px rgba(0,0,0,0.7)" }}>
              {/* Progress dots */}
              <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 28 }}>
                {steps.map((_, i) => (
                  <div key={i} style={{ width: i === onboardingStep ? 20 : 8, height: 8, borderRadius: 4, background: i === onboardingStep ? T.gold : T.border, transition: "all 0.3s" }} />
                ))}
              </div>
              <div style={{ fontSize: 52, marginBottom: 16 }}>{step.icon}</div>
              <h2 style={{ fontFamily: "'Fraunces',serif", fontSize: 22, fontWeight: 800, color: T.white, marginBottom: 14, lineHeight: 1.3 }}>{step.title}</h2>
              <p style={{ fontSize: 14, color: T.textSecondary, lineHeight: 1.7, marginBottom: 32 }}>{step.body}</p>
              <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                {onboardingStep > 0 && (
                  <button type="button" onClick={() => setOnboardingStep(s => s - 1)} style={{ padding: "12px 20px", borderRadius: 10, border: `1px solid ${T.border}`, background: "transparent", color: T.textSecondary, fontSize: 13, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>← Back</button>
                )}
                <button type="button" onClick={() => { if (onboardingStep < steps.length - 1) { setOnboardingStep(s => s + 1); } else { completeOnboarding(); } }} style={{ padding: "12px 28px", borderRadius: 10, border: "none", background: `linear-gradient(135deg, ${T.gold}, ${T.goldDim})`, color: T.bg, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>
                  {step.cta}
                </button>
              </div>
              <button type="button" onClick={completeOnboarding} style={{ marginTop: 16, background: "none", border: "none", color: T.textMuted, fontSize: 11, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>Skip tour</button>
            </div>
          </div>
        );
      })()}

      {/* Upgrade Modal */}
      <UpgradeModal show={showUpgrade} onClose={() => setShowUpgrade(false)} />
    </div>
  );
}