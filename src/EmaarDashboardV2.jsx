import React, { useState, useEffect, useRef } from "react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, ComposedChart, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from "recharts";
import { auth, db } from "./firebase";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut, sendPasswordResetEmail } from "firebase/auth";
import { collection, getDocs, orderBy, query, doc, getDoc, setDoc } from "firebase/firestore";

import { T, emaarProjects, emaarFinancials, emaarCommunities, emaarYields, topDevelopers, emaarRisks, dubaiMarket, dubaiSalesHistory, roiPhases, emaarSegments, radarData, megaProjects, communityIntel } from "./data";
import LandingPage from "./LandingPage";

/* ─── DATA ALIASES (for backward compat) ─── */
const financials = emaarFinancials;
const segments = emaarSegments;
const risks = emaarRisks.map(r => ({ factor: r.factor, score: r.score, max: 150, color: r.color }));
const yields = emaarYields.map(y => ({ label: y.unit, community: y.community, rent: y.rent/1000, price: y.price/1000, gross: y.gross, net: y.net, demand: y.demand === "Very High" ? "V.High" : y.demand === "Moderate-High" ? "High" : y.demand, visa: y.visa }));
const developers = topDevelopers.map(d => ({ rank: d.rank, name: d.name.replace(" Properties","").replace(" Realty","").replace(" Development",""), sales: d.sales, units: d.units, delivered: d.delivered, underConst: d.underConst, color: d.color, share: d.share, segment: d.segment }));
const communityProjects = emaarCommunities.filter(c => c.name).map(c => ({ name: c.district, full: c.name, projects: c.projects, yield: c.avgYield ? `${c.avgYield}%` : "—", ppsf: c.avgPpsf ? c.avgPpsf.toLocaleString() : "—" }));
/* ─── ICONS (inline SVG) ─── */
const Icons = {
  overview: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
  financials: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
  portfolio: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  competitors: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/></svg>,
  yields: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
  risk: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  market: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
  stocks: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><line x1="16" y1="2" x2="22" y2="2"/><line x1="22" y1="2" x2="22" y2="8"/></svg>,
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
  { key: "Risk", icon: Icons.risk },
  { key: "Stocks", icon: Icons.stocks },
  { key: "Market", icon: Icons.market },
];

/* ─── REAL ESTATE STOCKS DATABASE ─── */
const RE_STOCKS = [
  // ─── DFM (Dubai Financial Market) ───
  { ticker: "EMAAR", name: "Emaar Properties PJSC", exchange: "DFM", tv: "DFM:EMAAR", sector: "Developer", marketCap: "143B", pe: "8.1", divYield: "6.2%", rating: "Strong Buy", desc: "UAE's largest developer. Burj Khalifa, Dubai Mall, Dubai Hills Estate.", region: "UAE" },
  { ticker: "EMAARDEV", name: "Emaar Development PJSC", exchange: "DFM", tv: "DFM:EMAARDEV", sector: "Developer", marketCap: "77B", pe: "6.8", divYield: "3.5%", rating: "Strong Buy", desc: "Emaar's development arm. All off-plan sales and project delivery.", region: "UAE" },
  { ticker: "TECOM", name: "TECOM Group PJSC", exchange: "DFM", tv: "DFM:TECOM", sector: "Commercial RE", marketCap: "19B", pe: "9.0", divYield: "4.3%", rating: "Strong Buy", desc: "Business parks: Dubai Internet City, Media City, Design District.", region: "UAE" },
  { ticker: "DIC", name: "Dubai Investments PJSC", exchange: "DFM", tv: "DFM:DIC", sector: "Diversified RE", marketCap: "16B", pe: "10.5", divYield: "3.8%", rating: "Buy", desc: "Diversified investment company with major real estate portfolio.", region: "UAE" },
  { ticker: "DUBAIRESI", name: "Dubai Residential REIT", exchange: "DFM", tv: "DFM:DUBAIRESI", sector: "REIT", marketCap: "16B", pe: "—", divYield: "7.7%", rating: "Buy", desc: "Dubai Holding's residential REIT. IPO May 2025. Income-generating.", region: "UAE" },
  { ticker: "EMPOWER", name: "Emirates Central Cooling", exchange: "DFM", tv: "DFM:EMPOWER", sector: "RE Infra", marketCap: "16B", pe: "14.2", divYield: "4.8%", rating: "Buy", desc: "World's largest district cooling. Cools major developments.", region: "UAE" },
  { ticker: "TABREED", name: "National Central Cooling", exchange: "DFM", tv: "DFM:TABREED", sector: "RE Infra", marketCap: "8.8B", pe: "11.5", divYield: "5.2%", rating: "Buy", desc: "District cooling for Abu Dhabi & GCC properties.", region: "UAE" },
  { ticker: "ALEC", name: "ALEC Holdings PJSC", exchange: "DFM", tv: "DFM:ALEC", sector: "Construction", marketCap: "7.3B", pe: "12.0", divYield: "1.5%", rating: "Buy", desc: "UAE's largest construction firm. Builds for Emaar, Dubai Holding.", region: "UAE" },
  { ticker: "DEYAAR", name: "Deyaar Development PJSC", exchange: "DFM", tv: "DFM:DEYAAR", sector: "Developer", marketCap: "4.5B", pe: "7.4", divYield: "4.9%", rating: "Strong Buy", desc: "Developer in Business Bay, Al Barsha, Dubai Science Park.", region: "UAE" },
  { ticker: "UPP", name: "Union Properties PJSC", exchange: "DFM", tv: "DFM:UPP", sector: "Developer", marketCap: "3.9B", pe: "10.8", divYield: "0%", rating: "Buy", desc: "Motor City, Green Community, AUTODROME. Turnaround story.", region: "UAE" },
  { ticker: "AMLAK", name: "Amlak Finance PJSC", exchange: "DFM", tv: "DFM:AMLAK", sector: "RE Finance", marketCap: "2.5B", pe: "8.2", divYield: "2.1%", rating: "Hold", desc: "Islamic mortgage and property finance provider.", region: "UAE" },
  { ticker: "MAZAYA", name: "Al-Mazaya Holding", exchange: "DFM", tv: "DFM:MAZAYA", sector: "Developer", marketCap: "443M", pe: "24.3", divYield: "0%", rating: "—", desc: "Kuwait-based developer with UAE projects.", region: "Kuwait" },
  // ─── ADX (Abu Dhabi Securities Exchange) ───
  { ticker: "ALDAR", name: "Aldar Properties PJSC", exchange: "ADX", tv: "ADX:ALDAR", sector: "Developer", marketCap: "85B", pe: "11.3", divYield: "1.7%", rating: "Strong Buy", desc: "Abu Dhabi's largest. Yas Island, Saadiyat, expanding to Dubai.", region: "UAE" },
  { ticker: "RAKPROP", name: "RAK Properties PJSC", exchange: "ADX", tv: "ADX:RAKPROP", sector: "Developer", marketCap: "4.1B", pe: "—", divYield: "0%", rating: "Strong Buy", desc: "Mina Al Arab, Julphar Towers. RAK tourism boom play.", region: "UAE" },
  { ticker: "ANAN", name: "Anan Investment Holding", exchange: "ADX", tv: "ADX:ANAN", sector: "Developer", marketCap: "3.2B", pe: "—", divYield: "0%", rating: "—", desc: "Abu Dhabi real estate investment holding.", region: "UAE" },
  { ticker: "ESHRAQ", name: "Eshraq Investments PJSC", exchange: "ADX", tv: "ADX:ESHRAQ", sector: "RE Investment", marketCap: "1.3B", pe: "—", divYield: "0%", rating: "—", desc: "Abu Dhabi real estate investment company.", region: "UAE" },
  { ticker: "MANAZEL", name: "Manazel PJSC", exchange: "ADX", tv: "ADX:MANAZEL", sector: "Developer", marketCap: "777M", pe: "11.5", divYield: "0%", rating: "—", desc: "Affordable housing in Abu Dhabi and Al Ain.", region: "UAE" },
  { ticker: "ARAM", name: "Aram Group", exchange: "ADX", tv: "ADX:ARAM", sector: "Developer", marketCap: "212M", pe: "—", divYield: "0%", rating: "—", desc: "Abu Dhabi real estate development.", region: "UAE" },
  // ─── Tadawul (Saudi Stock Exchange) ───
  { ticker: "4300", name: "Dar Al Arkan RE Dev.", exchange: "Tadawul", tv: "TADAWUL:4300", sector: "Developer", marketCap: "27B SAR", pe: "12.4", divYield: "1.8%", rating: "Buy", desc: "Saudi's largest listed developer. Trump branded projects.", region: "KSA" },
  { ticker: "4250", name: "Jabal Omar Development", exchange: "Tadawul", tv: "TADAWUL:4250", sector: "Developer", marketCap: "22B SAR", pe: "—", divYield: "0%", rating: "Hold", desc: "Mega development next to Grand Mosque, Makkah.", region: "KSA" },
  { ticker: "4100", name: "Makkah Construction & Dev.", exchange: "Tadawul", tv: "TADAWUL:4100", sector: "Developer", marketCap: "15B SAR", pe: "22.1", divYield: "3.1%", rating: "Hold", desc: "Hospitality projects around the Grand Mosque.", region: "KSA" },
  { ticker: "4322", name: "Retal Urban Development", exchange: "Tadawul", tv: "TADAWUL:4322", sector: "Developer", marketCap: "8B SAR", pe: "9.5", divYield: "2.8%", rating: "Strong Buy", desc: "Fast-growing Saudi residential developer.", region: "KSA" },
  { ticker: "4150", name: "Arriyadh Development Co.", exchange: "Tadawul", tv: "TADAWUL:4150", sector: "Developer", marketCap: "5B SAR", pe: "18.6", divYield: "2.3%", rating: "Hold", desc: "Riyadh commercial and residential projects.", region: "KSA" },
  { ticker: "4320", name: "Alandalus Property Co.", exchange: "Tadawul", tv: "TADAWUL:4320", sector: "Developer", marketCap: "4B SAR", pe: "14.8", divYield: "4.2%", rating: "Buy", desc: "Malls and commercial properties across Saudi.", region: "KSA" },
  { ticker: "4020", name: "Saudi Real Estate Co.", exchange: "Tadawul", tv: "TADAWUL:4020", sector: "Developer", marketCap: "3B SAR", pe: "15.2", divYield: "3.5%", rating: "Hold", desc: "One of Saudi's oldest RE companies.", region: "KSA" },
  { ticker: "4323", name: "Sumou Real Estate Co.", exchange: "Tadawul", tv: "TADAWUL:4323", sector: "Developer", marketCap: "2B SAR", pe: "—", divYield: "0%", rating: "—", desc: "Saudi residential and mixed-use developer.", region: "KSA" },
  { ticker: "4230", name: "Red Sea International Co.", exchange: "Tadawul", tv: "TADAWUL:4230", sector: "Construction", marketCap: "2B SAR", pe: "—", divYield: "0%", rating: "—", desc: "Prefab construction for Saudi RE sector.", region: "KSA" },
  // ─── London Stock Exchange ───
  { ticker: "DGS", name: "DarGlobal PLC", exchange: "LSE", tv: "LSE:DGS", sector: "Developer", marketCap: "£1.2B", pe: "8.5", divYield: "0%", rating: "Buy", desc: "International arm of Dar Al Arkan. Trump, Missoni, Pagani branded.", region: "International" },
];
const EX_COLORS = { DFM: "#D4A843", ADX: "#2DD4BF", Tadawul: "#6366F1", LSE: "#3B82F6" };

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
    .mobile-stock-bar { display: flex !important; }
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

const KPI = ({ label, value, sub, icon, delay = 0 }) => (
  <div className={`kpi-card fade-up delay-${delay}`}>
    <div style={{ position: "absolute", top: -30, right: -30, width: 80, height: 80, borderRadius: "50%", background: `radial-gradient(circle, ${T.goldGlow} 0%, transparent 70%)` }} />
    <div style={{ fontSize: 10, fontWeight: 600, color: T.textMuted, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 8 }}>{label}</div>
    <div style={{ fontFamily: "'Fraunces', serif", fontSize: 26, fontWeight: 700, color: T.gold, lineHeight: 1.1, marginBottom: 4 }}>{value}</div>
    <div style={{ fontSize: 12, fontWeight: 500, color: T.teal, display: "flex", alignItems: "center", gap: 4 }}>
      {sub?.includes("+") && <span style={{ color: T.green }}>{Icons.up}</span>}
      {sub}
    </div>
  </div>
);

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
const LoginScreen = ({ onLogin, onBack, defaultMode = "login" }) => {
  const [mode, setMode] = useState(defaultMode); // "login" or "signup"
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resetSent, setResetSent] = useState(false);

  const handleForgot = async () => {
    if (!email) { setError("Enter your email first, then click Forgot password"); return; }
    try {
      await sendPasswordResetEmail(auth, email);
      setResetSent(true);
      setError("");
    } catch (err) {
      setError("Could not send reset email. Check your email address.");
    }
  };

  const handleLogin = async (e) => {
    e?.preventDefault?.();
    if (!email || !pass) { setError("Please fill in all fields"); return; }
    setLoading(true);
    setError("");
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      onLogin(email);
    } catch (err) {
      if (err.code === "auth/user-not-found" || err.code === "auth/invalid-credential") {
        setError("Invalid email or password");
      } else if (err.code === "auth/wrong-password") {
        setError("Incorrect password");
      } else if (err.code === "auth/too-many-requests") {
        setError("Too many attempts. Please try again later.");
      } else {
        setError("Login failed. Please try again.");
      }
    }
    setLoading(false);
  };

  const handleSignUp = async (e) => {
    e?.preventDefault?.();
    if (!name.trim()) { setError("Please enter your name"); return; }
    if (!email || !pass) { setError("Please fill in all fields"); return; }
    if (pass.length < 6) { setError("Password must be at least 6 characters"); return; }
    setLoading(true);
    setError("");
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, pass);
      // Create user profile in Firestore with 7-day Pro trial
      const now = new Date();
      const trialEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      await setDoc(doc(db, "users", cred.user.uid), {
        name: name.trim(),
        email: email,
        tier: "pro_trial",
        createdAt: now.toISOString(),
        trialStart: now.toISOString(),
        trialEnd: trialEnd.toISOString(),
        role: "user",
      });
      onLogin(email);
    } catch (err) {
      if (err.code === "auth/email-already-in-use") {
        setError("This email is already registered. Try logging in instead.");
      } else if (err.code === "auth/weak-password") {
        setError("Password must be at least 6 characters.");
      } else if (err.code === "auth/invalid-email") {
        setError("Please enter a valid email address.");
      } else {
        setError("Sign up failed. Please try again.");
      }
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: T.bg, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
      <style>{css}</style>
      {/* Back to Landing */}
      {onBack && (
        <button type="button" onClick={onBack} style={{ position: "absolute", top: 24, left: 24, display: "flex", alignItems: "center", gap: 6, background: "none", border: `1px solid ${T.border}`, borderRadius: 8, padding: "8px 16px", color: T.textSecondary, fontSize: 13, fontFamily: "'Outfit', sans-serif", cursor: "pointer", zIndex: 10, transition: "all 0.2s" }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = T.gold; e.currentTarget.style.color = T.gold; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.textSecondary; }}>
          ← Back to Home
        </button>
      )}
      {/* Background pattern */}
      <div style={{ position: "absolute", inset: 0, opacity: 0.015, backgroundImage: `radial-gradient(${T.gold} 1px, transparent 1px)`, backgroundSize: "50px 50px" }} />
      <div style={{ position: "absolute", top: "20%", left: "10%", width: 400, height: 400, borderRadius: "50%", background: `radial-gradient(circle, rgba(212,168,67,0.04) 0%, transparent 70%)` }} />
      <div style={{ position: "absolute", bottom: "10%", right: "15%", width: 300, height: 300, borderRadius: "50%", background: `radial-gradient(circle, rgba(0,191,165,0.03) 0%, transparent 70%)` }} />

      <div className="fade-up" style={{ width: "100%", maxWidth: 420, padding: "0 20px", position: "relative", zIndex: 1 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 3, marginBottom: 8 }}>
            <svg width="36" height="36" viewBox="0 0 40 40">
              <rect x="2" y="2" width="36" height="36" rx="8" fill="none" stroke={T.gold} strokeWidth="2" />
              <path d="M12 28V12h10l-6 8h8l-12 8z" fill={T.gold} />
            </svg>
          </div>
          <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 28, fontWeight: 900, color: T.gold, letterSpacing: -0.5, marginBottom: 2 }}>DXB Analytics</h1>
          <p style={{ color: T.textMuted, fontSize: 13, letterSpacing: 2, textTransform: "uppercase" }}>Dubai Real Estate Intelligence</p>
        </div>

        {/* Login/SignUp Card */}
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 20, padding: 32, backdropFilter: "blur(20px)" }}>
          {/* Mode Toggle */}
          <div style={{ display: "flex", marginBottom: 24, background: T.surfaceAlt, borderRadius: 10, padding: 3 }}>
            <button type="button" onClick={() => { setMode("login"); setError(""); }} style={{ flex: 1, padding: "10px 0", borderRadius: 8, border: "none", fontFamily: "'Outfit', sans-serif", fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.2s", background: mode === "login" ? T.gold : "transparent", color: mode === "login" ? T.bg : T.textMuted }}>Sign In</button>
            <button type="button" onClick={() => { setMode("signup"); setError(""); }} style={{ flex: 1, padding: "10px 0", borderRadius: 8, border: "none", fontFamily: "'Outfit', sans-serif", fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.2s", background: mode === "signup" ? T.gold : "transparent", color: mode === "signup" ? T.bg : T.textMuted }}>Sign Up Free</button>
          </div>

          <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 20, fontWeight: 700, color: T.white, marginBottom: 4 }}>
            {mode === "login" ? "Welcome back" : "Start your free trial"}
          </h2>
          <p style={{ color: T.textSecondary, fontSize: 13, marginBottom: 28 }}>
            {mode === "login" ? "Sign in to access your dashboard" : "7 days of Pro access — no credit card required"}
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {mode === "signup" && (
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: T.textSecondary, textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 6 }}>Full Name</label>
                <input className="login-input" type="text" placeholder="John Smith" value={name} onChange={e => setName(e.target.value)} />
              </div>
            )}
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: T.textSecondary, textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 6 }}>Email</label>
              <input className="login-input" type="email" placeholder="you@company.com" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === "Enter" && (mode === "login" ? handleLogin() : handleSignUp())} />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: T.textSecondary, textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 6 }}>Password</label>
              <div style={{ position: "relative" }}>
                <input className="login-input" type={showPass ? "text" : "password"} placeholder={mode === "signup" ? "Min 6 characters" : "••••••••"} value={pass} onChange={e => setPass(e.target.value)} onKeyDown={e => e.key === "Enter" && (mode === "login" ? handleLogin() : handleSignUp())} style={{ paddingRight: 44 }} />
                <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: T.textMuted, padding: 4 }}>
                  {showPass ? Icons.eyeOff : Icons.eye}
                </button>
              </div>
            </div>

            {error && <div style={{ color: T.red, fontSize: 12, padding: "8px 12px", background: "rgba(239,68,68,0.08)", borderRadius: 8, border: "1px solid rgba(239,68,68,0.2)" }}>{error}</div>}
            {resetSent && <div style={{ color: T.green, fontSize: 12, padding: "8px 12px", background: "rgba(16,185,129,0.08)", borderRadius: 8, border: "1px solid rgba(16,185,129,0.2)" }}>Password reset email sent! Check your inbox.</div>}

            {mode === "login" && (
              <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center" }}>
                <button onClick={handleForgot} type="button" style={{ background: "none", border: "none", color: T.gold, fontSize: 12, textDecoration: "none", cursor: "pointer", fontFamily: "'Outfit', sans-serif" }}>Forgot password?</button>
              </div>
            )}

            <button type="button" className="login-btn" onClick={mode === "login" ? handleLogin : handleSignUp} disabled={loading}>
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
                  <span style={{ color: T.gold, fontWeight: 600 }}>7-day Pro trial</span> — Full access to all projects, financials, yields, stocks & comparisons. No credit card needed.
                </div>
              </div>
            )}
          </div>

          <div style={{ textAlign: "center", marginTop: 24, paddingTop: 20, borderTop: `1px solid ${T.border}` }}>
            <p style={{ color: T.textMuted, fontSize: 12 }}>
              {mode === "login" ? (
                <>Don't have an account? <button type="button" onClick={() => { setMode("signup"); setError(""); }} style={{ color: T.gold, background: "none", border: "none", fontWeight: 600, cursor: "pointer", fontSize: 12, fontFamily: "'Outfit', sans-serif", padding: 0 }}>Sign up free</button></>
              ) : (
                <>Already have an account? <button type="button" onClick={() => { setMode("login"); setError(""); }} style={{ color: T.gold, background: "none", border: "none", fontWeight: 600, cursor: "pointer", fontSize: 12, fontFamily: "'Outfit', sans-serif", padding: 0 }}>Sign in</button></>
              )}
            </p>
          </div>
        </div>

        <p style={{ textAlign: "center", color: T.textMuted, fontSize: 11, marginTop: 24 }}>
          Powered by The Address Holding · Emaar Intelligence Platform
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
      <div style={{ filter: blur ? "blur(6px)" : "none", pointerEvents: "none", userSelect: "none", opacity: blur ? 0.5 : 1 }}>
        {children}
      </div>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "rgba(4,9,15,0.6)", borderRadius: 12, backdropFilter: "blur(2px)", zIndex: 5 }}>
        <div style={{ fontSize: 28, marginBottom: 8 }}>🔒</div>
        <div style={{ fontSize: 14, fontWeight: 700, color: T.white, marginBottom: 4, textAlign: "center" }}>{message}</div>
        <div style={{ fontSize: 11, color: T.textSecondary, marginBottom: 12, textAlign: "center", maxWidth: 260 }}>Get full access to all features with Pro</div>
        <button type="button" onClick={onUpgrade} style={{ padding: "8px 24px", background: `linear-gradient(135deg, ${T.gold}, ${T.goldLight})`, color: T.bg, border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Outfit', sans-serif", transition: "all 0.2s" }}>
          Upgrade to Pro — AED 99/mo
        </button>
      </div>
    </div>
  );
};

/* ─── UPGRADE MODAL ─── */
const UpgradeModal = ({ show, onClose }) => {
  if (!show) return null;
  const plans = [
    { name: "Pro", price: "99", features: ["All 48+ projects", "Full 6-year financials", "Yields & ROI data", "Stock market tracker", "Competitor analysis", "3-project comparison", "Location intelligence", "WhatsApp/Email inquiry"], popular: true },
    { name: "Enterprise", price: "499", features: ["Everything in Pro", "PDF report generation ⏳", "API access ⏳", "Custom dashboards ⏳", "Multi-user accounts ⏳", "Developer-level data", "Dedicated account manager", "White-label options ⏳"], popular: false, note: "⏳ = Coming Q3 2026" },
  ];
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(4,9,15,0.9)", zIndex: 3000, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(10px)" }} onClick={onClose}>
      <div style={{ background: T.surface, borderRadius: 20, border: `1px solid ${T.border}`, width: "95%", maxWidth: 680, padding: 32, position: "relative" }} onClick={e => e.stopPropagation()}>
        <button type="button" onClick={onClose} style={{ position: "absolute", top: 16, right: 16, background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8, color: T.textMuted, width: 32, height: 32, cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
        
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>⭐</div>
          <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 24, fontWeight: 900, color: T.white, marginBottom: 4 }}>Unlock Full Access</h2>
          <p style={{ color: T.textSecondary, fontSize: 13 }}>Choose the plan that fits your needs</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {plans.map((plan, i) => (
            <div key={i} style={{ background: T.surfaceAlt, borderRadius: 14, padding: 24, border: plan.popular ? `2px solid ${T.gold}` : `1px solid ${T.border}`, position: "relative" }}>
              {plan.popular && <div style={{ position: "absolute", top: -10, left: "50%", transform: "translateX(-50%)", padding: "3px 12px", borderRadius: 10, background: T.gold, color: T.bg, fontSize: 10, fontWeight: 700 }}>RECOMMENDED</div>}
              <h3 style={{ fontSize: 18, fontWeight: 700, color: T.white, marginBottom: 4 }}>{plan.name}</h3>
              <div style={{ display: "flex", alignItems: "baseline", gap: 3, marginBottom: 16 }}>
                <span style={{ fontSize: 10, color: T.textMuted }}>AED</span>
                <span style={{ fontFamily: "'Fraunces', serif", fontSize: 36, fontWeight: 900, color: plan.popular ? T.gold : T.white }}>{plan.price}</span>
                <span style={{ fontSize: 12, color: T.textMuted }}>/month</span>
              </div>
              {plan.features.map((f, j) => (
                <div key={j} style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 0", fontSize: 12, color: T.textSecondary }}>
                  <span style={{ color: T.green, fontSize: 12 }}>✓</span>{f}
                </div>
              ))}
              {plan.note && <div style={{ fontSize: 10, color: T.textMuted, marginTop: 8, fontStyle: "italic" }}>{plan.note}</div>}
              <button type="button" onClick={() => { onClose(); window.dispatchEvent(new CustomEvent("dxb-checkout", { detail: plan })); }} style={{ width: "100%", marginTop: 16, padding: "10px 0", background: plan.popular ? `linear-gradient(135deg, ${T.gold}, ${T.goldLight})` : "transparent", color: plan.popular ? T.bg : T.gold, border: plan.popular ? "none" : `1px solid ${T.gold}`, borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Outfit', sans-serif" }}>
                {plan.popular ? "Get Pro Now" : "Contact Sales"}
              </button>
            </div>
          ))}
        </div>
        <p style={{ textAlign: "center", fontSize: 11, color: T.textMuted, marginTop: 16 }}>Secure payment · Cancel anytime · 7-day money-back guarantee</p>
      </div>
    </div>
  );
};

/* ─── MAIN DASHBOARD ─── */
export default function EmaarDashboardV2() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState("");
  const [userName, setUserName] = useState("");
  const [userTier, setUserTier] = useState("free"); // "free", "pro_trial", "pro", "enterprise", "admin"
  const [trialDaysLeft, setTrialDaysLeft] = useState(0);
  const [showLogin, setShowLogin] = useState(false); // false, "login", or "signup"
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [profileEdit, setProfileEdit] = useState({ name: "" });
  const [showCheckout, setShowCheckout] = useState(null);
  const [checkoutStep, setCheckoutStep] = useState(1);
  const [myPortfolio, setMyPortfolio] = useState([]);
  const [showAddPortfolio, setShowAddPortfolio] = useState(null);
  const [portfolioForm, setPortfolioForm] = useState({ units: 1, investedAmount: "", purchaseDate: "", unitType: "1BR", notes: "" });

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
  const BlurGate = ({ children, locked, message, compact }) => (
    <div style={{ position: "relative" }}>
      <div style={locked ? { filter: "blur(6px)", pointerEvents: "none", userSelect: "none" } : {}}>
        {children}
      </div>
      {locked && <UpgradeOverlay message={message} compact={compact} />}
    </div>
  );
  const [tab, setTab] = useState("Overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [time, setTime] = useState(new Date());
  const [authLoading, setAuthLoading] = useState(true);
  const [projectSearch, setProjectSearch] = useState("");
  const [projectFilter, setProjectFilter] = useState("All");
  const [liveProjects, setLiveProjects] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedCommunity, setSelectedCommunity] = useState(null);
  const [expandedMega, setExpandedMega] = useState(null);
  const [compareList, setCompareList] = useState([]);
  const [showCompare, setShowCompare] = useState(false);
  const [showStock, setShowStock] = useState(false);
  const [stockFilter, setStockFilter] = useState("All");
  const [stockSearch, setStockSearch] = useState("");
  const [selectedStockTv, setSelectedStockTv] = useState(null);

  // Load projects from Firestore
  const [projectsLoading, setProjectsLoading] = useState(true);
  useEffect(() => {
    const loadProjects = async () => {
      setProjectsLoading(true);
      try {
        const snap = await getDocs(query(collection(db, "projects"), orderBy("id")));
        if (snap.size > 0) {
          setLiveProjects(snap.docs.map(d => d.data()));
        }
      } catch (e) { console.log("Firestore not available, using static data"); }
      setProjectsLoading(false);
    };
    if (isLoggedIn) loadProjects();
    else setProjectsLoading(false);
  }, [isLoggedIn]);

  // Use Firestore data if available, otherwise fall back to hardcoded
  const activeProjects = liveProjects || emaarProjects;

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
  const [stock, setStock] = useState({ price: 0, change: 0, changePercent: 0, dayHigh: null, dayLow: null, volume: null, marketState: "LOADING", open: null });
  const [stockLive, setStockLive] = useState(false);

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
                // Update Firestore to reflect expired trial
                await setDoc(doc(db, "users", firebaseUser.uid), { tier: "free" }, { merge: true });
              } else {
                setTrialDaysLeft(daysLeft);
              }
            }
            // Admin override
            if (data.role === "admin") tier = "admin";
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


  // Fetch live stock data
  useEffect(() => {
    const fetchStock = async () => {
      try {
        const res = await fetch("/api/stock");
        const data = await res.json();
        if (data && data.price) {
          setStock({
            price: data.price,
            change: data.change,
            changePercent: data.changePercent,
            dayHigh: data.dayHigh,
            dayLow: data.dayLow,
            volume: data.volume,
            marketState: data.marketState || "CLOSED",
            open: data.open,
          });
          setStockLive(data.success !== false);
        }
      } catch (e) {
        console.log("Stock fetch failed, using fallback data");
        setStockLive(false);
      }
    };
    fetchStock();
    const stockInterval = setInterval(fetchStock, 5 * 60 * 1000); // Refresh every 5 min
    return () => clearInterval(stockInterval);
  }, []);

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
        else if (showStock) setShowStock(false);
        else if (selectedProject) setSelectedProject(null);
        else if (showCompare) setShowCompare(false);
        else if (selectedStockTv) setSelectedStockTv(null);
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [showUpgrade, showStock, selectedProject, showCompare, selectedStockTv]);

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
    const user = adminUsers.find(u => u.id === userId);
    const userName = user ? (user.name || user.email) : userId;
    if (!window.confirm(`Change ${userName} to "${newTier}"?`)) return;
    try {
      await setDoc(doc(db, "users", userId), { tier: newTier }, { merge: true });
      setAdminUsers(prev => prev.map(u => u.id === userId ? { ...u, tier: newTier, status: newTier } : u));
      notify(`✅ ${userName} → ${newTier}`);
    } catch (err) {
      notify("❌ Failed to update tier");
      console.log("Failed to update tier:", err);
    }
  };

  const handleTabChange = (key) => {
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
        <nav style={{ flex: 1, padding: "16px 12px", display: "flex", flexDirection: "column", gap: 3 }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: T.textMuted, letterSpacing: 1.5, textTransform: "uppercase", padding: "0 16px 8px" }}>Emaar Properties</div>
          {TABS.map(t => (
            <button type="button" key={t.key} className={`sidebar-btn ${tab === t.key ? "active" : ""}`} onClick={() => handleTabChange(t.key)}>
              {t.icon}
              {t.key}
            </button>
          ))}
          {userTier === "admin" && (
            <>
              <div style={{ fontSize: 9, fontWeight: 700, color: T.textMuted, letterSpacing: 1.5, textTransform: "uppercase", padding: "16px 16px 8px", marginTop: 8, borderTop: `1px solid ${T.border}` }}>Admin</div>
              <button type="button" className={`sidebar-btn ${tab === "Admin" ? "active" : ""}`} onClick={() => handleTabChange("Admin")}>
                {Icons.admin}
                Users & Analytics
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
            <p style={{ fontSize: 10, color: T.textMuted, letterSpacing: 1 }}>DFM: EMAAR · {stockLive ? <span style={{ color: T.green }}>Market {stock.marketState === "REGULAR" ? "Open" : stock.marketState === "PRE" ? "Pre-Market" : "Closed"}</span> : "Offline"} · {time.toLocaleDateString("en-AE", { day: "numeric", month: "short", year: "numeric" })}</p>
          </div>
        </div>
        <div className="header-badges" style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div role="button" tabIndex={0} onKeyDown={e => { if (e.key === "Enter" || e.key === " ") setShowStock(true); }} onClick={() => setShowStock(true)} style={{ background: T.surfaceAlt, borderRadius: 10, padding: "6px 12px", border: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: 6, cursor: "pointer", transition: "all 0.2s" }} onMouseEnter={e => e.currentTarget.style.borderColor = T.gold} onMouseLeave={e => e.currentTarget.style.borderColor = T.border}>
            {stockLive && <span style={{ width: 6, height: 6, borderRadius: "50%", background: T.green, display: "inline-block", animation: "pulse 2s infinite" }} />}
            <span style={{ fontSize: 10, color: T.textMuted }}>{stockLive ? "LIVE" : "STOCK"}</span>
            <span style={{ fontFamily: "'Fraunces', serif", fontWeight: 700, fontSize: 14, color: T.gold }}>{stock.price.toFixed(2)}</span>
            <span style={{ color: stock.change >= 0 ? T.green : T.red, fontSize: 11, fontWeight: 600, display: "flex", alignItems: "center", gap: 2 }}>{stock.change >= 0 ? Icons.up : Icons.down} {Math.abs(stock.changePercent).toFixed(2)}%</span>
          </div>
          <div role="button" tabIndex={0} onKeyDown={e => { if (e.key === "Enter" || e.key === " ") setShowStock(true); }} onClick={() => setShowStock(true)} style={{ background: T.surfaceAlt, borderRadius: 10, padding: "6px 12px", border: `1px solid ${T.border}`, cursor: "pointer" }} onMouseEnter={e => e.currentTarget.style.borderColor = T.gold} onMouseLeave={e => e.currentTarget.style.borderColor = T.border}>
            <span style={{ fontSize: 10, color: T.textMuted }}>RATING </span>
            <span style={{ fontSize: 12, fontWeight: 600, color: T.teal }}>BBB+ / Baa1</span>
          </div>
          <div role="button" tabIndex={0} onKeyDown={e => { if (e.key === "Enter" || e.key === " ") setShowStock(true); }} onClick={() => setShowStock(true)} style={{ background: T.surfaceAlt, borderRadius: 10, padding: "6px 12px", border: `1px solid ${T.border}`, cursor: "pointer" }} onMouseEnter={e => e.currentTarget.style.borderColor = T.gold} onMouseLeave={e => e.currentTarget.style.borderColor = T.border}>
            <span style={{ fontSize: 10, color: T.textMuted }}>TARGET </span>
            <span style={{ fontSize: 12, fontWeight: 600, color: T.goldLight }}>AED 20.77</span>
          </div>
          {stock.dayHigh && <div style={{ background: T.surfaceAlt, borderRadius: 10, padding: "6px 12px", border: `1px solid ${T.border}` }}>
            <span style={{ fontSize: 10, color: T.textMuted }}>H/L </span>
            <span style={{ fontSize: 11, fontWeight: 600, color: T.textPrimary }}>{stock.dayHigh} / {stock.dayLow}</span>
          </div>}
          <button type="button" onClick={() => { alert("Notifications launching soon — you'll get alerts for price changes, new project launches, and construction milestones."); }} style={{ background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 10, padding: 8, cursor: "pointer", color: T.textSecondary, position: "relative" }} title="Notifications — Coming Soon">
            {Icons.bell}
          </button>
        </div>
      </header>

      {/* ─── MAIN CONTENT ─── */}
      <main role="main" className="main-content" style={{ marginLeft: 240, paddingTop: 60, minHeight: "100vh" }}>
        {/* Trial / Free tier banner */}
        {userTier === "pro_trial" && trialDaysLeft > 0 && (
          <div style={{ margin: "12px 24px 0", padding: "10px 16px", borderRadius: 10, background: `linear-gradient(135deg, rgba(212,168,67,0.12), rgba(212,168,67,0.04))`, border: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 16 }}>⭐</span>
              <span style={{ fontSize: 13, color: T.white, fontWeight: 600 }}>Pro Trial Active</span>
              <span style={{ fontSize: 12, color: T.textSecondary }}>— {trialDaysLeft} day{trialDaysLeft !== 1 ? "s" : ""} remaining. Enjoying full access to all features.</span>
            </div>
            <button type="button" onClick={() => setShowUpgrade(true)} style={{ padding: "6px 16px", borderRadius: 6, background: T.gold, color: T.bg, border: "none", fontSize: 12, fontWeight: 700, fontFamily: "'Outfit', sans-serif", cursor: "pointer" }}>Upgrade to Pro</button>
          </div>
        )}
        {userTier === "free" && (
          <div style={{ margin: "12px 24px 0", padding: "10px 16px", borderRadius: 10, background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.15)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 16 }}>🔒</span>
              <span style={{ fontSize: 13, color: T.white, fontWeight: 600 }}>Free Plan</span>
              <span style={{ fontSize: 12, color: T.textSecondary }}>— You're seeing limited data. Upgrade to unlock all projects, yields, stocks & more.</span>
            </div>
            <button type="button" onClick={() => setShowUpgrade(true)} style={{ padding: "6px 16px", borderRadius: 6, background: T.gold, color: T.bg, border: "none", fontSize: 12, fontWeight: 700, fontFamily: "'Outfit', sans-serif", cursor: "pointer" }}>Upgrade to Pro — AED 99/mo</button>
          </div>
        )}
        {/* Mobile stock ticker - only visible on small screens */}
        <div className="mobile-stock-bar" style={{ display: "none", alignItems: "center", justifyContent: "center", gap: 12, padding: "8px 14px", background: T.surface, borderBottom: `1px solid ${T.border}`, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            {stockLive && <span style={{ width: 5, height: 5, borderRadius: "50%", background: T.green, display: "inline-block", animation: "pulse 2s infinite" }} />}
            <span style={{ fontSize: 9, color: T.textMuted }}>{stockLive ? "LIVE" : "STOCK"}</span>
            <span style={{ fontFamily: "'Fraunces', serif", fontWeight: 700, fontSize: 13, color: T.gold }}>{stock.price.toFixed(2)}</span>
            <span style={{ color: stock.change >= 0 ? T.green : T.red, fontSize: 10, fontWeight: 600 }}>{stock.change >= 0 ? "▲" : "▼"} {Math.abs(stock.changePercent).toFixed(2)}%</span>
          </div>
          <span style={{ fontSize: 9, color: T.textMuted }}>BBB+ / Baa1</span>
          <span style={{ fontSize: 9, color: T.goldLight }}>Target: 20.77</span>
        </div>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: `0 24px ${compareList.length > 0 && tab === "Projects" ? "120px" : "60px"}` }}>

          {/* ─── OVERVIEW TAB ─── */}
          {tab === "Overview" && <>
            <Section title="Key Performance" sub="FY 2025 — All-Time Records Across Every Metric">
              <div className="kpi-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginTop: 16 }}>
                <KPI label="Property Sales" value="AED 80.4B" sub="+16% YoY · USD 21.9B" delay={1} />
                <KPI label="Revenue" value="AED 49.6B" sub="+40% YoY · USD 13.5B" delay={2} />
                <KPI label="Net Profit" value="AED 25.7B" sub="+36% YoY · USD 7.0B" delay={3} />
                <KPI label="EBITDA" value="AED 25.6B" sub="+33% YoY · USD 7.0B" delay={4} />
                <KPI label="Backlog" value="AED 155B" sub="+39% YoY · 3-4yr visibility" delay={5} />
                <KPI label="Recurring Rev" value="AED 10.5B" sub="+13% · 32% of EBITDA" delay={6} />
                <KPI label="Units Delivered" value="125,600+" sub="Since 2002 · #1 in GCC" delay={7} />
                <KPI label="Land Bank" value="618M sqft" sub="344M UAE · AED 120B dev" delay={8} />
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
                <ResponsiveContainer width="100%" height={270}>
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
              </Chart>
            </div>

            <Section title="Company Strength" sub="Analyst consensus: STRONG BUY (12 of 15 analysts)">
              <div className="chart-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 16 }}>
                <Chart title="Performance Radar">
                  <ResponsiveContainer width="100%" height={260}>
                    <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="75%">
                      <PolarGrid stroke="rgba(255,255,255,0.06)" />
                      <PolarAngleAxis dataKey="metric" tick={{ fill: T.textSecondary, fontSize: 10 }} />
                      <PolarRadiusAxis tick={false} axisLine={false} />
                      <Radar name="Emaar" dataKey="value" stroke={T.gold} fill={T.gold} fillOpacity={0.15} strokeWidth={2} />
                    </RadarChart>
                  </ResponsiveContainer>
                </Chart>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {[
                    ["Founded", "1997", "27+ years track record"],
                    ["Developer Rank", "#1", "Dubai's largest by value"],
                    ["Active Projects", "48", "Across 10+ communities"],
                    ["International", "AED 9.3B", "+124% growth YoY"],
                    ["Dividend/Share", "AED 1.00", "2× increase from 2023"],
                    ["Target Upside", "+21.8%", "AED 20.77 consensus"],
                  ].map(([label, value, sub], i) => (
                    <KPI key={i} label={label} value={value} sub={sub} delay={Math.min(i + 1, 8)} />
                  ))}
                </div>
              </div>
            </Section>
          </>}

          {/* ─── FINANCIALS TAB ─── */}
          {tab === "Financials" && <>
            <Section title="Financial Performance" sub="6-year trend · 2020–2025 · All figures in AED Billions">
              <div className="kpi-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginTop: 16 }}>
                <KPI label="Revenue CAGR" value="27.2%" sub="2020-2025 · 5-year" delay={1} />
                <KPI label="Profit CAGR" value="57.1%" sub="2020-2025 · 5-year" delay={2} />
                <KPI label="Gross Margin" value="57.5%" sub="Industry-leading" delay={3} />
                <KPI label="Net Margin" value="35.5%" sub="Consistent expansion" delay={4} />
              </div>
            </Section>

            <ProGate isPro={isPro} message="Unlock 6 Years of Financial Data" onUpgrade={() => setShowUpgrade(true)}>
            <div className="chart-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 20 }}>
              <Chart title="Revenue vs Property Sales (AED B)">
                <ResponsiveContainer width="100%" height={280}>
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
                <ResponsiveContainer width="100%" height={280}>
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
                <ResponsiveContainer width="100%" height={280}>
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
              <div className="kpi-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginTop: 12 }}>
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
            <Section title="48 Active Projects" sub="Complete Emaar off-plan portfolio · 2026–2030 · Search & filter">
              <div className="kpi-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginTop: 16 }}>
                <KPI label="Total Projects" value="48" sub="18 under construction · 30 off-plan" delay={1} />
                <KPI label="Communities" value="11" sub="DHE · DCH · EBF · GPC + 7 more" delay={2} />
                <KPI label="Branded" value={`${activeProjects.filter(p=>p.branded).length}`} sub="Address · Vida · Palace · Bristol" delay={3} />
                <KPI label="Avg Construction" value={`${Math.round(activeProjects.reduce((a,p)=>a+(p.construction||0),0)/activeProjects.length)}%`} sub="Weighted average progress" delay={4} />
              </div>
            </Section>

            {/* Search & Filters */}
            <div className="filter-scroll" style={{ display: "flex", gap: 10, marginTop: 20, flexWrap: "wrap", alignItems: "center" }}>
              <div style={{ position: "relative", flex: "1 1 250px", maxWidth: 350 }}>
                <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: T.textMuted }}>{Icons.search}</span>
                <input value={projectSearch} onChange={e => setProjectSearch(e.target.value)} placeholder="Search projects..." style={{ width: "100%", padding: "10px 12px 10px 36px", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, color: T.textPrimary, fontSize: 13, fontFamily: "'Outfit', sans-serif", outline: "none" }} />
              </div>
              {["All", "DHE", "DCH", "EBF", "GPC", "ES", "TV", "RYM", "Branded"].map(f => (
                <button type="button" key={f} onClick={() => setProjectFilter(f)} style={{ padding: "7px 14px", borderRadius: 8, border: `1px solid ${projectFilter === f ? T.gold : T.border}`, background: projectFilter === f ? T.goldGlow : "transparent", color: projectFilter === f ? T.gold : T.textSecondary, fontSize: 12, fontWeight: 500, cursor: "pointer", fontFamily: "'Outfit', sans-serif", transition: "all 0.2s" }}>{f}</button>
              ))}
            </div>

            {/* Project Cards */}
            {projectsLoading ? <LoadingSkeleton rows={6} cols={3} /> : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12, marginTop: 16 }}>
              {activeProjects
                .filter(p => {
                  const matchSearch = !projectSearch || p.name.toLowerCase().includes(projectSearch.toLowerCase()) || p.community.toLowerCase().includes(projectSearch.toLowerCase());
                  const matchFilter = projectFilter === "All" || p.district === projectFilter || (projectFilter === "Branded" && p.branded);
                  return matchSearch && matchFilter;
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
                      <div style={{ fontSize: 11, color: T.textSecondary }}>{p.community}</div>
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
                    <div><span style={{ fontSize: 9, color: T.textMuted, display: "block" }}>HANDOVER</span><span style={{ fontSize: 13, fontWeight: 600, color: T.white }}>{p.handover}</span></div>
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
                    <button type="button" onClick={(e) => { e.stopPropagation(); isPro ? toggleCompare(p) : setShowUpgrade(true); }} style={{ padding: "8px 10px", background: !isPro ? "rgba(212,168,67,0.05)" : compareList.find(x=>x.id===p.id) ? T.goldGlow : T.surfaceAlt, border: `1px solid ${!isPro ? T.border : compareList.find(x=>x.id===p.id) ? T.gold : T.border}`, borderRadius: 8, color: !isPro ? T.textMuted : compareList.find(x=>x.id===p.id) ? T.gold : T.textMuted, fontSize: 11, cursor: "pointer", fontFamily: "'Outfit', sans-serif" }}>
                      {!isPro ? "🔒" : compareList.find(x=>x.id===p.id) ? "✓" : "⊕"}
                    </button>
                  </div>
                  </div>{/* end padding wrapper */}
                </div>
              );})}
              {activeProjects.filter(p => { const ms = !projectSearch || p.name.toLowerCase().includes(projectSearch.toLowerCase()) || p.community.toLowerCase().includes(projectSearch.toLowerCase()); const mf = projectFilter === "All" || p.district === projectFilter || (projectFilter === "Branded" && p.branded); return ms && mf; }).length === 0 && (
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
            <Section title="Mega Projects Pipeline" sub="Strategic developments 2026-2035 · AED 800B+ combined investment pipeline · Global benchmarks & DLD price data · Click any project for deep analysis">
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
                <div className="kpi-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginTop: 16 }}>
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
                            <div style={{ fontSize: 10, color: T.textMuted }}>{p.community} · {h.unitType} · {h.units} unit{h.units > 1 ? "s" : ""}</div>
                          </div>
                          <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 6, background: "rgba(16,185,129,0.12)", color: T.green, fontWeight: 700 }}>+{gain}%</span>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
                          <div><div style={{ fontSize: 9, color: T.textMuted }}>INVESTED</div><div style={{ fontSize: 14, fontWeight: 700, color: T.gold }}>AED {(h.investedAmount/1e6).toFixed(2)}M</div></div>
                          <div><div style={{ fontSize: 9, color: T.textMuted }}>PROJECTED</div><div style={{ fontSize: 14, fontWeight: 700, color: T.green }}>AED {(projected/1e6).toFixed(2)}M</div></div>
                        </div>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
                          <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, background: T.surfaceAlt, color: T.textMuted }}>{p.handover}</span>
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
              <div className="kpi-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginTop: 16 }}>
                <KPI label="Total Projects" value="48" sub="18 under construction · 30 off-plan" delay={1} />
                <KPI label="Branded Projects" value="10" sub="Address · Vida · Palace" delay={2} />
                <KPI label="Avg Starting Price" value="AED 2.76M" sub="Range: 1.2M – 13.8M" delay={3} />
                <KPI label="Avg Price/sqft" value="AED 2,570" sub="Across all tiers" delay={4} />
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
                      <tr key={i} style={{ borderBottom: `1px solid ${T.border}`, transition: "background 0.2s" }} onMouseEnter={e => e.currentTarget.style.background = T.surfaceAlt} onMouseLeave={e => e.currentTarget.style.background = "transparent"} onClick={() => { const comm = emaarCommunities.find(x => x.name === c.full); if(comm) setSelectedCommunity(comm.name); }} style={{ cursor: "pointer" }}>
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
              <div className="kpi-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginTop: 16 }}>
                <KPI label="Emaar % of Top 30" value="22.6%" sub="Dominant market leader" delay={1} />
                <KPI label="Lead vs #2" value="AED 29.9B" sub="1.83× larger than DAMAC" delay={2} />
                <KPI label="% of Dubai Total" value="9.6%" sub="Of AED 682.5B market" delay={3} />
                <KPI label="Delivered % Top 10" value="31%" sub="7,318 of 23,576 units" delay={4} />
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
                  <BarChart data={yields}>
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
                      {yields.map((y, i) => <Cell key={i} fill={y.demand === "V.High" ? T.gold : y.demand === "High" ? T.teal : T.blue} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Chart>
            </Section>

            <div className="kpi-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginTop: 16 }}>
              <KPI label="Avg Gross Yield" value="4.5%" sub="Across all communities" delay={1} />
              <KPI label="Highest Yield" value="5.9%" sub="The Valley 3BR TH" delay={2} />
              <KPI label="Lowest Yield" value="3.6%" sub="Downtown 2BR Apt" delay={3} />
              <KPI label="Avg Cash Flow" value="AED 62K" sub="Annual per unit" delay={4} />
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
                    {yields.map((y, i) => (
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

          {/* ─── RISK TAB ─── */}
          {tab === "Risk" && <>
            <Section title="9-Factor Risk Assessment" sub="Overall: LOW-MODERATE · Investment Grade · BBB+/Baa1/BBB">
              <div className="kpi-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginTop: 16 }}>
                <KPI label="Avg Risk Score" value="38.3" sub="LOW-MODERATE overall" delay={1} />
                <KPI label="Highest Risk" value="125" sub="Premium Pricing" delay={2} />
                <KPI label="Lowest Risk" value="1" sub="Liquidity / Exit" delay={3} />
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

          {/* ─── STOCKS TAB ─── */}
          {tab === "Stocks" && <>
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                <div>
                  <h2 className="section-title" style={{ fontSize: 22, fontWeight: 800, fontFamily: "'Fraunces', serif", color: T.white, display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ width: 4, height: 26, background: T.gold, borderRadius: 2 }} /> RE Stock Market
                  </h2>
                  <p style={{ color: T.textMuted, fontSize: 12, marginTop: 4, marginLeft: 14 }}>30 publicly traded real estate companies · DFM · ADX · Tadawul · LSE · Click any stock for live chart</p>
                </div>
              </div>
            </div>

            {/* KPIs */}
            <div className="kpi-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
              <KPI label="Total Listed RE Stocks" value="30" sub="DFM · ADX · Tadawul · LSE" delay={1} />
              <KPI label="UAE Stocks" value="18" sub="12 DFM · 6 ADX" delay={2} />
              <KPI label="Saudi Stocks" value="10" sub="Tadawul Exchange" delay={3} />
              <KPI label="International" value="1" sub="LSE (DarGlobal)" delay={4} />
            </div>

            {/* Search & Filter */}
            <div style={{ display: "flex", gap: 10, marginBottom: 16, alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ position: "relative", flex: "1 1 240px" }}>
                <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: T.textMuted }}>{Icons.search}</span>
                <input value={stockSearch} onChange={e => setStockSearch(e.target.value)} placeholder="Search stocks..." style={{ width: "100%", padding: "10px 12px 10px 34px", borderRadius: 10, border: `1px solid ${T.border}`, background: T.surfaceAlt, color: T.white, fontSize: 13, outline: "none", fontFamily: "'Outfit', sans-serif" }} />
              </div>
              {["All", "DFM", "ADX", "Tadawul", "LSE"].map(f => (
                <button type="button" key={f} onClick={() => setStockFilter(f)} style={{ padding: "8px 14px", borderRadius: 20, border: `1px solid ${stockFilter === f ? T.gold : T.border}`, background: stockFilter === f ? T.goldGlow : "transparent", color: stockFilter === f ? T.gold : T.textSecondary, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit', sans-serif" }}>{f}</button>
              ))}
            </div>

            {/* Stock Cards Grid */}
            <ProGate isPro={isPro} message="Unlock 30 RE Stocks Tracker" onUpgrade={() => setShowUpgrade(true)}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 12 }}>
              {RE_STOCKS.filter(s => {
                const matchFilter = stockFilter === "All" || s.exchange === stockFilter;
                const matchSearch = !stockSearch || s.name.toLowerCase().includes(stockSearch.toLowerCase()) || s.ticker.toLowerCase().includes(stockSearch.toLowerCase());
                return matchFilter && matchSearch;
              }).map((s, i) => (
                <div key={s.ticker} className="chart-box fade-up" style={{ animationDelay: `${Math.min(i * 0.03, 0.5)}s`, padding: 16, cursor: s.tv !== "—" ? "pointer" : "default", opacity: s.tv === "—" ? 0.5 : 1 }} onClick={() => s.tv !== "—" && setSelectedStockTv(s)}>
                  {/* Header */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontFamily: "'Fraunces', serif", fontSize: 16, fontWeight: 800, color: EX_COLORS[s.exchange] || T.gold }}>{s.ticker}</span>
                        <span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 6, background: `${EX_COLORS[s.exchange] || T.gold}22`, color: EX_COLORS[s.exchange] || T.gold, fontWeight: 700, letterSpacing: 0.5 }}>{s.exchange}</span>
                      </div>
                      <p style={{ fontSize: 12, color: T.white, fontWeight: 600, marginTop: 2 }}>{s.name}</p>
                    </div>
                    {s.rating && s.rating !== "—" && (
                      <span style={{ fontSize: 9, padding: "3px 8px", borderRadius: 6, fontWeight: 700, background: s.rating.includes("Strong") ? "rgba(34,197,94,0.12)" : s.rating === "Buy" ? "rgba(45,212,191,0.12)" : "rgba(234,179,8,0.12)", color: s.rating.includes("Strong") ? T.green : s.rating === "Buy" ? T.teal : T.gold }}>{s.rating}</span>
                    )}
                  </div>
                  {/* Description */}
                  <p style={{ fontSize: 11, color: T.textMuted, lineHeight: 1.4, marginBottom: 10, minHeight: 30 }}>{s.desc}</p>
                  {/* Metrics Row */}
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <div style={{ flex: 1, background: T.surfaceAlt, borderRadius: 8, padding: "6px 10px", textAlign: "center", border: `1px solid ${T.border}` }}>
                      <div style={{ fontSize: 8, color: T.textMuted, textTransform: "uppercase" }}>Mkt Cap</div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: T.white, fontFamily: "'Fraunces', serif" }}>{s.marketCap}</div>
                    </div>
                    <div style={{ flex: 1, background: T.surfaceAlt, borderRadius: 8, padding: "6px 10px", textAlign: "center", border: `1px solid ${T.border}` }}>
                      <div style={{ fontSize: 8, color: T.textMuted, textTransform: "uppercase" }}>P/E</div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: T.teal, fontFamily: "'Fraunces', serif" }}>{s.pe}</div>
                    </div>
                    <div style={{ flex: 1, background: T.surfaceAlt, borderRadius: 8, padding: "6px 10px", textAlign: "center", border: `1px solid ${T.border}` }}>
                      <div style={{ fontSize: 8, color: T.textMuted, textTransform: "uppercase" }}>Div Yield</div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: parseFloat(s.divYield) > 3 ? T.green : T.textPrimary, fontFamily: "'Fraunces', serif" }}>{s.divYield}</div>
                    </div>
                  </div>
                  {/* Sector Tag */}
                  <div style={{ marginTop: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 6, background: T.surfaceAlt, color: T.textMuted, border: `1px solid ${T.border}` }}>{s.sector}</span>
                    {s.tv !== "—" && <span style={{ fontSize: 10, color: T.gold, fontWeight: 600 }}>View Chart →</span>}
                    {s.tv === "—" && <span style={{ fontSize: 10, color: T.red, fontWeight: 600 }}>Private — Not Tradeable</span>}
                  </div>
                </div>
              ))}
              {RE_STOCKS.filter(s => { const mf = stockFilter === "All" || s.exchange === stockFilter; const ms = !stockSearch || s.name.toLowerCase().includes(stockSearch.toLowerCase()) || s.ticker.toLowerCase().includes(stockSearch.toLowerCase()); return mf && ms; }).length === 0 && (
                <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "48px 20px" }}>
                  <div style={{ fontSize: 36, marginBottom: 12, opacity: 0.4 }}>🔍</div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: T.white, marginBottom: 4 }}>No stocks found</div>
                  <div style={{ fontSize: 13, color: T.textMuted }}>Try adjusting your search or filter</div>
                </div>
              )}
            </div>

            {/* Note about private companies */}
            <div style={{ marginTop: 20, padding: 16, background: T.surfaceAlt, borderRadius: 12, border: `1px solid ${T.border}` }}>
              <h4 style={{ fontSize: 12, fontWeight: 700, color: T.goldLight, marginBottom: 6 }}>Note: Major Private Developers (Not Listed)</h4>
              <p style={{ fontSize: 11, color: T.textMuted, lineHeight: 1.6 }}>
                DAMAC Properties (delisted 2020), Nakheel (Dubai Holding subsidiary), Azizi Developments, Sobha Realty, Binghatti, Select Group, Omniyat, Meraas, Ellington Properties, Danube Properties, Samana Developers, MAG, and many others are private companies. They do not have publicly traded shares. Only the 30 companies above can be invested in through stock exchanges.
              </p>
            </div>
            </ProGate>
          </>}

          {/* ─── MARKET TAB ─── */}
          {tab === "Market" && <>
            <Section title="Dubai Real Estate — 2025" sub="Official DLD Data · 5th Consecutive Record Year">
              <div className="kpi-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginTop: 16 }}>
                {dubaiMarket.map((m, i) => <KPI key={i} label={m.metric} value={m.val2025} sub={m.yoy} delay={Math.min(i + 1, 8)} />)}
              </div>
            </Section>

            <Chart title="Dubai Total Sales Value Growth (AED B)" style={{ marginTop: 20 }}>
              <ResponsiveContainer width="100%" height={280}>
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

            <Section title="2026 Outlook" sub="Knight Frank, CW Core, Fitch Ratings">
              <div className="chart-grid-3" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginTop: 16 }}>
                {[
                  ["Knight Frank", "+3% prime, ~1% mainstream. Transitioning to sustainable growth phase.", T.gold],
                  ["CW Core", "5-8% appreciation forecast. Slowdown from 12-22% in 2024-25.", T.teal],
                  ["Fitch Ratings", "Moderate correction possible. ~120K units in 2026 pipeline.", T.orange],
                ].map(([firm, desc, color], i) => (
                  <div key={i} className="chart-box" style={{ borderTop: `3px solid ${color}` }}>
                    <h4 style={{ color, fontSize: 15, fontWeight: 700, marginBottom: 8, fontFamily: "'Fraunces', serif" }}>{firm}</h4>
                    <p style={{ color: T.textSecondary, fontSize: 13, lineHeight: 1.6 }}>{desc}</p>
                  </div>
                ))}
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
              <div className="kpi-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginTop: 16 }}>
                <KPI label="Total Users" value={adminUsers.length} sub="Registered accounts" delay={1} />
                <KPI label="Pro Trial" value={adminUsers.filter(u => u.status === "pro_trial").length} sub="Active trials" delay={2} />
                <KPI label="Free Users" value={adminUsers.filter(u => u.status === "free" || u.status === "expired").length} sub="Trial expired or free" delay={3} />
                <KPI label="Pro / Paid" value={adminUsers.filter(u => u.tier === "pro" || u.tier === "enterprise").length} sub="Paying customers" delay={4} />
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
            Sources: Emaar IR, DLD, DXBinteract, Gulf News, Zawya, Knight Frank, CW Core, Fitch · Verified Feb 2026 · Not financial advice
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
                        <div key={pi} style={{ background: T.surfaceAlt, borderRadius: 8, padding: 10, cursor: "pointer" }} onClick={() => { setSelectedCommunity(null); setSelectedProject(activeProjects.find(x => x.id === p.id) || p); }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: T.gold }}>{p.name}</div>
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
            <button type="button" onClick={() => setSelectedProject(null)} style={{ position: "absolute", top: 16, right: 16, background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8, color: T.textMuted, width: 32, height: 32, cursor: "pointer", fontSize: 16, zIndex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
            
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
                  <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 900, color: T.gold, margin: 0 }}>{selectedProject_.name}</h2>
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

              {/* Contact CTAs */}
              {isPro ? (
              <div style={{ display: "flex", gap: 8 }}>
                <a href={whatsappLink(selectedProject_.name, selectedProject_.community)} target="_blank" rel="noopener noreferrer"
                  style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "12px 0", background: "#25D366", borderRadius: 12, color: "#fff", fontSize: 13, fontWeight: 700, textDecoration: "none", fontFamily: "'Outfit', sans-serif" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  WhatsApp
                </a>
                <a href={`mailto:mianwaleed689@gmail.com?subject=Inquiry: ${selectedProject_.name} — ${selectedProject_.community}&body=Hi Mian Waleed,%0A%0AI'm interested in ${selectedProject_.name} at ${selectedProject_.community}.%0A%0ACould you please share more details about pricing, availability, and payment plans?%0A%0AThank you.`} 
                  style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "12px 0", background: T.gold, borderRadius: 12, color: T.bg, fontSize: 13, fontWeight: 700, textDecoration: "none", fontFamily: "'Outfit', sans-serif" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#04090F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                  Email
                </a>
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
            </div>
          </div>
        </div>
        );
      })()}

      {/* ─── COMPARE MODAL ─── */}
      {showCompare && compareList.length >= 2 && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(4,9,15,0.9)", zIndex: 3000, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(8px)" }} onClick={() => setShowCompare(false)}>
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
          </div>
        </div>
      )}

      {/* ─── STOCK DETAIL MODAL (from Stocks tab) ─── */}
      {selectedStockTv && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(4,9,15,0.9)", zIndex: 4500, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(8px)" }} onClick={() => setSelectedStockTv(null)}>
          <div style={{ background: T.surface, borderRadius: 16, border: `1px solid ${T.border}`, width: "95%", maxWidth: 900, maxHeight: "92vh", overflowY: "auto", position: "relative" }} onClick={e => e.stopPropagation()}>
            <button type="button" onClick={() => setSelectedStockTv(null)} style={{ position: "absolute", top: 16, right: 16, background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8, color: T.textMuted, width: 32, height: 32, cursor: "pointer", fontSize: 16, zIndex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
            <div style={{ padding: 24 }}>
              {/* Header */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                <span style={{ fontFamily: "'Fraunces', serif", fontSize: 28, fontWeight: 900, color: EX_COLORS[selectedStockTv.exchange] || T.gold }}>{selectedStockTv.ticker}</span>
                <span style={{ fontSize: 10, padding: "3px 10px", borderRadius: 8, background: `${EX_COLORS[selectedStockTv.exchange]}22`, color: EX_COLORS[selectedStockTv.exchange], fontWeight: 700 }}>{selectedStockTv.exchange}</span>
                {selectedStockTv.rating && selectedStockTv.rating !== "—" && <span style={{ fontSize: 10, padding: "3px 10px", borderRadius: 8, background: "rgba(34,197,94,0.12)", color: T.green, fontWeight: 700 }}>{selectedStockTv.rating}</span>}
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: T.white, marginBottom: 4 }}>{selectedStockTv.name}</h3>
              <p style={{ fontSize: 12, color: T.textMuted, marginBottom: 16 }}>{selectedStockTv.desc}</p>

              {/* Key Metrics */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 16 }}>
                {[["Market Cap", selectedStockTv.marketCap, T.gold], ["P/E Ratio", selectedStockTv.pe, T.teal], ["Div Yield", selectedStockTv.divYield, T.green], ["Sector", selectedStockTv.sector, T.textPrimary]].map(([l,v,c], i) => (
                  <div key={i} style={{ background: T.surfaceAlt, borderRadius: 10, padding: 12, border: `1px solid ${T.border}`, textAlign: "center" }}>
                    <div style={{ fontSize: 9, color: T.textMuted, textTransform: "uppercase", marginBottom: 3 }}>{l}</div>
                    <div style={{ fontSize: 15, fontWeight: 800, fontFamily: "'Fraunces', serif", color: c }}>{v}</div>
                  </div>
                ))}
              </div>

              {/* TradingView Chart */}
              <div style={{ background: T.surfaceAlt, borderRadius: 12, overflow: "hidden", marginBottom: 16, border: `1px solid ${T.border}`, height: 420 }}>
                <iframe src={`https://www.tradingview.com/widgetembed/?symbol=${encodeURIComponent(selectedStockTv.tv)}&interval=D&hidesidetoolbar=1&symboledit=1&saveimage=0&theme=dark&style=1&timezone=Asia/Dubai&withdateranges=1&locale=en&allow_symbol_change=1`} style={{ width: "100%", height: "100%", border: "none" }} title={`${selectedStockTv.ticker} Chart`} allow="fullscreen" sandbox="allow-scripts allow-same-origin allow-popups" />
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", gap: 10 }}>
                <a href={`https://www.tradingview.com/symbols/${selectedStockTv.tv}/`} target="_blank" rel="noopener noreferrer" style={{ flex: 1, padding: "12px 0", background: T.gold, borderRadius: 12, color: T.bg, fontSize: 13, fontWeight: 700, textAlign: "center", textDecoration: "none", fontFamily: "'Outfit', sans-serif" }}>Full Analysis on TradingView</a>
                <a href={whatsappLink(`${selectedStockTv.name} (${selectedStockTv.ticker})`, selectedStockTv.exchange)} target="_blank" rel="noopener noreferrer" style={{ flex: 1, padding: "12px 0", background: "#25D366", borderRadius: 12, color: "#fff", fontSize: 13, fontWeight: 700, textAlign: "center", textDecoration: "none", fontFamily: "'Outfit', sans-serif" }}>Ask About This Stock</a>
                <a href="tel:+971542410599" style={{ padding: "12px 20px", background: T.teal, borderRadius: 12, color: "#fff", fontSize: 13, fontWeight: 700, textAlign: "center", textDecoration: "none", fontFamily: "'Outfit', sans-serif" }}>Call</a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── STOCK MODAL ─── */}
      {showStock && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(4,9,15,0.9)", zIndex: 4000, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(8px)" }} onClick={() => setShowStock(false)}>
          <div style={{ background: T.surface, borderRadius: 16, border: `1px solid ${T.border}`, width: "95%", maxWidth: 960, maxHeight: "92vh", overflowY: "auto", position: "relative" }} onClick={e => e.stopPropagation()}>
            <button type="button" onClick={() => setShowStock(false)} style={{ position: "absolute", top: 16, right: 16, background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8, color: T.textMuted, width: 32, height: 32, cursor: "pointer", fontSize: 16, zIndex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>

            <div style={{ padding: 28 }}>
              {/* Header */}
              <div style={{ marginBottom: 20 }}>
                <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 26, color: T.gold, margin: 0 }}>Emaar Properties PJSC</h2>
                <p style={{ color: T.textMuted, fontSize: 12, marginTop: 4 }}>DFM: EMAAR · Real Estate Development · Dubai, UAE</p>
              </div>

              {/* Live Price Banner */}
              <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
                <div style={{ background: T.surfaceAlt, borderRadius: 12, padding: "16px 20px", border: `1px solid ${T.gold}`, flex: "1 1 200px" }}>
                  <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 4 }}>{stockLive ? "LIVE PRICE" : "LAST KNOWN PRICE"}</div>
                  <div style={{ fontFamily: "'Fraunces', serif", fontSize: 36, fontWeight: 900, color: T.gold }}>{stock.price.toFixed(2)} <span style={{ fontSize: 14, color: T.textMuted }}>AED</span></div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: stock.change >= 0 ? T.green : T.red, marginTop: 4 }}>{stock.change >= 0 ? "▲" : "▼"} {Math.abs(stock.change).toFixed(2)} ({Math.abs(stock.changePercent).toFixed(2)}%)</div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, flex: "2 1 400px" }}>
                  {[["Day High", stock.dayHigh ? `AED ${stock.dayHigh}` : "—"], ["Day Low", stock.dayLow ? `AED ${stock.dayLow}` : "—"], ["Open", stock.open ? `AED ${stock.open}` : "—"], ["Volume", stock.volume ? stock.volume.toLocaleString() : "—"]].map(([l, v], i) => (
                    <div key={i} style={{ background: T.surfaceAlt, borderRadius: 10, padding: "10px 14px", border: `1px solid ${T.border}` }}>
                      <div style={{ fontSize: 9, color: T.textMuted, textTransform: "uppercase" }}>{l}</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: T.white, marginTop: 2 }}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* TradingView Chart */}
              <div style={{ background: T.surfaceAlt, borderRadius: 12, overflow: "hidden", marginBottom: 20, border: `1px solid ${T.border}`, height: 450 }}>
                <iframe src={`https://www.tradingview.com/widgetembed/?symbol=DFM:EMAAR&interval=D&hidesidetoolbar=1&symboledit=1&saveimage=0&theme=dark&style=1&timezone=Asia/Dubai&withdateranges=1&locale=en&allow_symbol_change=1`} style={{ width: "100%", height: "100%", border: "none" }} title="Emaar Chart" allow="fullscreen" sandbox="allow-scripts allow-same-origin allow-popups" />
              </div>

              {/* Key Metrics */}
              <h3 style={{ fontSize: 12, fontWeight: 600, color: T.goldLight, letterSpacing: 1, textTransform: "uppercase", marginBottom: 12 }}>Key Stock Metrics</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 20 }}>
                {[["Market Cap","AED 150B+",T.gold],["P/E Ratio","8.5x",T.teal],["EPS (2025)","AED 2.00",T.green],["Dividend Yield","5.9%",T.goldLight],["52W High","AED 22.40",T.green],["52W Low","AED 13.80",T.red],["Dividend/Share","AED 1.00",T.teal],["Beta","0.85",T.textPrimary]].map(([l,v,c],i) => (
                  <div key={i} style={{ background: T.surfaceAlt, borderRadius: 10, padding: 12, border: `1px solid ${T.border}`, textAlign: "center" }}>
                    <div style={{ fontSize: 9, color: T.textMuted, textTransform: "uppercase", marginBottom: 4 }}>{l}</div>
                    <div style={{ fontSize: 16, fontWeight: 800, fontFamily: "'Fraunces', serif", color: c }}>{v}</div>
                  </div>
                ))}
              </div>

              {/* Other RE Stocks */}
              <h3 style={{ fontSize: 12, fontWeight: 600, color: T.goldLight, letterSpacing: 1, textTransform: "uppercase", marginBottom: 12 }}>Dubai Real Estate Stocks</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10, marginBottom: 20 }}>
                {[{t:"EMAAR",n:"Emaar Properties",p:stock.price.toFixed(2),c:`${stock.changePercent>=0?"+":""}${stock.changePercent.toFixed(2)}`,cl:T.gold,a:true},{t:"EMAARDEV",n:"Emaar Development",p:"—",c:"dfm",cl:T.blue},{t:"ALDAR",n:"Aldar Properties",p:"—",c:"dfm",cl:T.green},{t:"DEYAAR",n:"Deyaar Development",p:"—",c:"dfm",cl:T.purple},{t:"TECOM",n:"TECOM Group",p:"—",c:"dfm",cl:T.teal}].map((s,i) => (
                  <div key={i} style={{ background: s.a ? "rgba(212,168,67,0.08)" : T.surfaceAlt, borderRadius: 10, padding: 14, border: `1px solid ${s.a ? T.gold : T.border}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: s.cl }}>{s.t}</span>
                      <span style={{ fontSize: 10, fontWeight: 600, color: s.c === "dfm" ? T.textMuted : s.c.includes("-") ? T.red : T.green }}>{s.c === "dfm" ? "DFM Only" : `${s.c}%`}</span>
                    </div>
                    <div style={{ fontSize: 10, color: T.textMuted, marginBottom: 4 }}>{s.n}</div>
                    <div style={{ fontSize: 18, fontWeight: 800, fontFamily: "'Fraunces', serif", color: T.white }}>AED {s.p}</div>
                  </div>
                ))}
              </div>

              {/* Analyst Consensus */}
              <div style={{ background: T.surfaceAlt, borderRadius: 12, padding: 16, border: `1px solid ${T.border}`, marginBottom: 20 }}>
                <h3 style={{ fontSize: 12, fontWeight: 600, color: T.goldLight, letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>Analyst Consensus</h3>
                <div style={{ display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 32, fontWeight: 900, fontFamily: "'Fraunces', serif", color: T.green }}>BUY</div>
                    <div style={{ fontSize: 10, color: T.textMuted }}>12 of 15 analysts</div>
                  </div>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: T.textMuted, marginBottom: 6 }}>
                      <span>Strong Buy (8)</span><span>Buy (4)</span><span>Hold (2)</span><span>Sell (1)</span>
                    </div>
                    <div style={{ display: "flex", height: 8, borderRadius: 4, overflow: "hidden" }}>
                      <div style={{ width: "53%", background: T.green }} /><div style={{ width: "27%", background: T.teal }} /><div style={{ width: "13%", background: T.gold }} /><div style={{ width: "7%", background: T.red }} />
                    </div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 10, color: T.textMuted }}>Target Price</div>
                    <div style={{ fontSize: 22, fontWeight: 800, fontFamily: "'Fraunces', serif", color: T.gold }}>AED 20.77</div>
                    <div style={{ fontSize: 11, color: T.green, fontWeight: 600 }}>+{((20.77/stock.price - 1) * 100).toFixed(0)}% upside</div>
                  </div>
                </div>
              </div>

              {/* Trade Buttons */}
              <div style={{ display: "flex", gap: 10, position: "sticky", bottom: 0, background: T.surface, padding: "16px 0 0" }}>
                <a href="https://www.dfm.ae/issuers/listed-securities/securities-details?id=EMAAR" target="_blank" rel="noopener noreferrer" style={{ flex: 1, padding: "14px 0", background: T.gold, borderRadius: 12, color: T.bg, fontSize: 14, fontWeight: 700, textAlign: "center", textDecoration: "none", fontFamily: "'Outfit', sans-serif" }}>View on DFM</a>
                <a href="tel:+971542410599" style={{ flex: 1, padding: "14px 0", background: T.teal, borderRadius: 12, color: "#fff", fontSize: 14, fontWeight: 700, textAlign: "center", textDecoration: "none", fontFamily: "'Outfit', sans-serif" }}>Call to Trade</a>
                <a href={whatsappLink("Emaar Stock (EMAAR)", "DFM")} target="_blank" rel="noopener noreferrer" style={{ flex: 1, padding: "14px 0", background: "#25D366", borderRadius: 12, color: "#fff", fontSize: 14, fontWeight: 700, textAlign: "center", textDecoration: "none", fontFamily: "'Outfit', sans-serif" }}>Ask on WhatsApp</a>
              </div>
            </div>
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
                      <div style={{ fontSize: 13, fontWeight: 600, color: T.white }}>{p.name}</div>
                      <div style={{ fontSize: 10, color: T.textMuted }}>{p.community} \u00b7 {p.type} \u00b7 {p.beds}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: T.gold }}>AED {p.price ? (p.price/1e6).toFixed(2) + "M" : "TBD"}</div>
                      <div style={{ fontSize: 9, color: T.textMuted }}>{p.handover}</div>
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

      {/* CHECKOUT PAYMENT MODAL */}
      {showCheckout && <div style={{ position: "fixed", inset: 0, background: "rgba(4,9,15,0.95)", zIndex: 3100, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(12px)" }} onClick={() => { setShowCheckout(null); setCheckoutStep(1); }}>
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
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, letterSpacing: 1, marginBottom: 12 }}>CHOOSE PAYMENT METHOD</div>
                <div style={{ display: "grid", gap: 8 }}>
                  {[{ method: "whatsapp", label: "WhatsApp Payment", sub: "Pay via bank transfer — instant activation", icon: "💬", color: "#25D366" }, { method: "stripe", label: "Credit / Debit Card", sub: "Stripe checkout — coming soon", icon: "💳", color: "#3B82F6", disabled: true }, { method: "apple", label: "Apple Pay", sub: "One-tap payment — coming soon", icon: "🍎", color: "#FFFFFF", disabled: true }].map((pm, i) => <div key={i} onClick={() => !pm.disabled && window.open(`https://wa.me/971542410599?text=${encodeURIComponent(`Hi Mian Waleed, I want to subscribe to DXB Analytics ${showCheckout.name} Plan (AED ${showCheckout.price}/mo). My email: ${user}`)}`, "_blank")} style={{ padding: "14px 16px", borderRadius: 10, background: T.surfaceAlt, border: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: 12, cursor: pm.disabled ? "not-allowed" : "pointer", opacity: pm.disabled ? 0.5 : 1, transition: "all 0.2s" }} onMouseEnter={e => { if(!pm.disabled) e.currentTarget.style.borderColor = pm.color; }} onMouseLeave={e => e.currentTarget.style.borderColor = T.border}><div style={{ fontSize: 24 }}>{pm.icon}</div><div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 600, color: T.white }}>{pm.label}</div><div style={{ fontSize: 10, color: T.textMuted }}>{pm.sub}</div></div>{pm.disabled ? <span style={{ fontSize: 9, padding: "2px 8px", borderRadius: 4, background: T.surfaceAlt, color: T.textMuted, border: `1px solid ${T.border}` }}>SOON</span> : <span style={{ color: pm.color, fontSize: 16 }}>→</span>}</div>)}
                </div>
              </div>
              <div style={{ padding: 12, borderRadius: 8, background: "rgba(212,168,67,0.06)", border: "1px solid rgba(212,168,67,0.1)", fontSize: 11, color: T.textMuted, lineHeight: 1.5, marginBottom: 16 }}>After WhatsApp payment confirmation, your account will be upgraded within 5 minutes. Stripe auto-checkout coming Q2 2026.</div>
              <div style={{ display: "flex", gap: 10 }}>
                <button type="button" onClick={() => setCheckoutStep(1)} style={{ flex: 1, padding: "10px 0", background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8, color: T.textSecondary, fontWeight: 600, fontSize: 12, cursor: "pointer", fontFamily: "'Outfit', sans-serif" }}>← Back</button>
                <button type="button" onClick={() => { window.open(`https://wa.me/971542410599?text=${encodeURIComponent(`Hi Mian Waleed, I want to subscribe to DXB Analytics ${showCheckout.name} Plan (AED ${showCheckout.price}/mo). My email: ${user}`)}`, "_blank"); setCheckoutStep(3); }} style={{ flex: 2, padding: "10px 0", background: "linear-gradient(135deg, #25D366, #128C7E)", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "'Outfit', sans-serif" }}>💬 Pay via WhatsApp</button>
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
      {showProfile && <div style={{ position: "fixed", inset: 0, background: "rgba(4,9,15,0.9)", zIndex: 3000, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(10px)" }} onClick={() => setShowProfile(false)}>
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

      {/* Upgrade Modal */}
      <UpgradeModal show={showUpgrade} onClose={() => setShowUpgrade(false)} />
    </div>
  );
}
