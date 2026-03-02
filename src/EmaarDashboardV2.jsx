import React, { useState, useEffect, useRef } from "react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, ComposedChart, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from "recharts";

/* ─── DESIGN TOKENS ─── */
const T = {
  bg: "#04090F",
  surface: "#0A1628",
  surfaceAlt: "#0E1D35",
  card: "#0D1B30",
  cardHover: "#112240",
  border: "rgba(212,168,67,0.12)",
  borderHover: "rgba(212,168,67,0.3)",
  gold: "#D4A843",
  goldLight: "#E8C96A",
  goldMuted: "rgba(212,168,67,0.15)",
  goldGlow: "rgba(212,168,67,0.08)",
  teal: "#00BFA5",
  tealMuted: "rgba(0,191,165,0.12)",
  navy: "#0B1F3F",
  white: "#F1F5F9",
  textPrimary: "#E2E8F0",
  textSecondary: "#94A3B8",
  textMuted: "#64748B",
  red: "#EF4444",
  green: "#10B981",
  blue: "#3B82F6",
  purple: "#8B5CF6",
  orange: "#F59E0B",
  cyan: "#06B6D4",
};

/* ─── DATA ─── */
const financials = [
  { year: "2020", revenue: 14.9, grossProfit: 4.8, ebitda: 6.2, netProfit: 2.7, propertySales: 14, backlog: 28, recurringRev: 5.3, intlSales: 0.6, mallRev: 3.2, hotelRev: 2.1, dividend: 0.15, eps: 0.24, gm: 32.2, em: 41.6, nm: 14.1 },
  { year: "2021", revenue: 27.9, grossProfit: 11.6, ebitda: 8.5, netProfit: 6.6, propertySales: 23.9, backlog: 32, recurringRev: 5.8, intlSales: 0.8, mallRev: 3.5, hotelRev: 2.3, dividend: 0.25, eps: 0.60, gm: 41.6, em: 30.5, nm: 19.0 },
  { year: "2022", revenue: 24.9, grossProfit: 12.6, ebitda: 9.8, netProfit: 8.1, propertySales: 30.7, backlog: 41.5, recurringRev: 7.5, intlSales: 1.2, mallRev: 4.2, hotelRev: 3.3, dividend: 0.35, eps: 0.77, gm: 50.6, em: 39.4, nm: 27.3 },
  { year: "2023", revenue: 26.7, grossProfit: 16.9, ebitda: 16, netProfit: 15.1, propertySales: 40.3, backlog: 71.8, recurringRev: 8.6, intlSales: 2.9, mallRev: 5.8, hotelRev: 2.8, dividend: 0.50, eps: 1.32, gm: 63.3, em: 59.9, nm: 43.4 },
  { year: "2024", revenue: 35.5, grossProfit: 20.4, ebitda: 19.3, netProfit: 18.9, propertySales: 69.5, backlog: 111.5, recurringRev: 9.3, intlSales: 4.1, mallRev: 5.6, hotelRev: 3.7, dividend: 1.00, eps: 1.53, gm: 57.5, em: 54.4, nm: 38.0 },
  { year: "2025", revenue: 49.6, grossProfit: 28.5, ebitda: 25.6, netProfit: 25.7, propertySales: 80.4, backlog: 155, recurringRev: 10.5, intlSales: 9.3, mallRev: 6.3, hotelRev: 4.2, dividend: 1.00, eps: 2.00, gm: 57.5, em: 51.6, nm: 35.5 },
];

const developers = [
  { rank: 1, name: "Emaar", sales: 65.8, units: 13149, delivered: 7318, underConst: 51032, color: T.gold },
  { rank: 2, name: "DAMAC", sales: 35.9, units: 15393, delivered: 2113, underConst: 46554, color: T.teal },
  { rank: 3, name: "Binghatti", sales: 26.0, units: 17061, delivered: 4093, underConst: 38000, color: T.blue },
  { rank: 4, name: "Nakheel", sales: 24.6, units: 4160, delivered: 1522, underConst: 15000, color: T.green },
  { rank: 5, name: "Sobha", sales: 22.4, units: 9698, delivered: 2260, underConst: 26933, color: T.purple },
  { rank: 6, name: "Meraas", sales: 20.9, units: 2385, delivered: 1913, underConst: 12000, color: T.orange },
  { rank: 7, name: "Omniyat", sales: 11.0, units: 1656, delivered: 800, underConst: 4500, color: "#FF7043" },
  { rank: 8, name: "Aldar", sales: 9.9, units: 1732, delivered: 1200, underConst: 18000, color: "#42A5F5" },
  { rank: 9, name: "H&H", sales: 8.1, units: 1200, delivered: 600, underConst: 8000, color: "#AB47BC" },
  { rank: 10, name: "Danube", sales: 7.0, units: 4089, delivered: 1757, underConst: 22000, color: T.textMuted },
];

const segments = [
  { name: "UAE Property Dev", revenue: 36.4, growth: "44%", color: T.gold },
  { name: "Malls & Retail", revenue: 6.3, growth: "13%", color: T.teal },
  { name: "Hospitality", revenue: 4.2, growth: "12%", color: T.cyan },
  { name: "International", revenue: 2.6, growth: "124%", color: T.green },
];

const risks = [
  { factor: "Premium Pricing", score: 125, max: 150, color: T.red },
  { factor: "Market Cycle", score: 100, max: 150, color: T.orange },
  { factor: "Supply Competition", score: 60, max: 150, color: T.orange },
  { factor: "Geographic Conc.", score: 45, max: 150, color: T.gold },
  { factor: "Interest Rate", score: 8, max: 150, color: T.teal },
  { factor: "Execution", score: 2, max: 150, color: T.green },
  { factor: "Regulatory", score: 2, max: 150, color: T.green },
  { factor: "Currency (Peg)", score: 2, max: 150, color: T.green },
  { factor: "Liquidity", score: 1, max: 150, color: T.green },
];

const yields = [
  { label: "DHE 1BR", community: "Dubai Hills", rent: 75, price: 1529, gross: 4.9, net: 4.2, demand: "V.High" },
  { label: "DHE 2BR", community: "Dubai Hills", rent: 110, price: 2200, gross: 5.0, net: 4.3, demand: "V.High" },
  { label: "DHE 3BR", community: "Dubai Hills", rent: 160, price: 3500, gross: 4.6, net: 3.9, demand: "High" },
  { label: "DCH 1BR", community: "Creek Harbour", rent: 80, price: 1750, gross: 4.6, net: 3.9, demand: "High" },
  { label: "DCH 2BR", community: "Creek Harbour", rent: 120, price: 2500, gross: 4.8, net: 4.1, demand: "High" },
  { label: "EBF 1BR", community: "Beachfront", rent: 120, price: 3200, gross: 3.8, net: 3.2, demand: "V.High" },
  { label: "ES 1BR", community: "Emaar South", rent: 60, price: 1200, gross: 5.0, net: 4.3, demand: "Growing" },
  { label: "ES 2BR", community: "Emaar South", rent: 85, price: 1800, gross: 4.7, net: 4.0, demand: "Growing" },
  { label: "TV 3BR", community: "The Valley", rent: 95, price: 1600, gross: 5.9, net: 5.0, demand: "High" },
  { label: "DT 1BR", community: "Downtown", rent: 95, price: 2500, gross: 3.8, net: 3.2, demand: "V.High" },
];

const roiPhases = [
  { phase: "Pre-Launch", low: 8, high: 12, avg: 10 },
  { phase: "Construction", low: 12, high: 20, avg: 16 },
  { phase: "Handover", low: 15, high: 25, avg: 20 },
  { phase: "Rental Y1+", low: 4.5, high: 8, avg: 6.3 },
  { phase: "5-Year Hold", low: 30, high: 50, avg: 40 },
];

const communityProjects = [
  { name: "DHE", full: "Dubai Hills Estate", projects: 16, yield: "5.0-7.0%", ppsf: "1,800-3,500" },
  { name: "DCH", full: "Dubai Creek Harbour", projects: 11, yield: "5.0-6.5%", ppsf: "1,700-3,000" },
  { name: "EBF", full: "Emaar Beachfront", projects: 5, yield: "4.0-5.5%", ppsf: "3,000-5,500" },
  { name: "GPC", full: "Grand Polo Club", projects: 6, yield: "3.5-5.0%", ppsf: "1,500-2,200" },
  { name: "ES", full: "Emaar South", projects: 2, yield: "6.0-8.0%", ppsf: "1,200-1,650" },
  { name: "TV", full: "The Valley", projects: 2, yield: "5.5-7.0%", ppsf: "1,200-1,500" },
  { name: "RYM", full: "Rashid Yachts & Marina", projects: 2, yield: "5.0-6.5%", ppsf: "2,000-3,500" },
  { name: "TO", full: "The Oasis", projects: 1, yield: "3.0-4.5%", ppsf: "1,500-2,000" },
];

const dubaiMarket = [
  { metric: "Total Sales Value", val: "AED 682.5B", yoy: "+30.7%" },
  { metric: "Sales Transactions", val: "214,912", yoy: "+18.8%" },
  { metric: "Off-Plan Share", val: "62.6%", yoy: "Growing" },
  { metric: "Cash Buyers", val: "87%", yoy: "Dominant" },
  { metric: "Avg Price/sqft", val: "AED 1,755", yoy: "+18.3%" },
  { metric: "New Investors H1", val: "59,075", yoy: "+22%" },
];

const dubaiSalesHistory = [
  { year: "2020", sales: 120 }, { year: "2021", sales: 230 }, { year: "2022", sales: 300 },
  { year: "2023", sales: 410 }, { year: "2024", sales: 522.4 }, { year: "2025", sales: 682.5 },
];

const radarData = [
  { metric: "Revenue Growth", value: 85 },
  { metric: "Profit Margin", value: 72 },
  { metric: "Market Share", value: 90 },
  { metric: "Brand Strength", value: 95 },
  { metric: "Diversification", value: 68 },
  { metric: "Delivery Record", value: 92 },
];

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
};

const TABS = [
  { key: "Overview", icon: Icons.overview },
  { key: "Financials", icon: Icons.financials },
  { key: "Portfolio", icon: Icons.portfolio },
  { key: "Competitors", icon: Icons.competitors },
  { key: "Yields", icon: Icons.yields },
  { key: "Risk", icon: Icons.risk },
  { key: "Market", icon: Icons.market },
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
  @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
  @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
  @keyframes slideIn { from { transform: translateX(-100%); } to { transform: translateX(0); } }
  @keyframes glow { 0%, 100% { box-shadow: 0 0 20px rgba(212,168,67,0.1); } 50% { box-shadow: 0 0 40px rgba(212,168,67,0.2); } }

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
    .sidebar { transform: translateX(-100%); position: fixed !important; z-index: 100; }
    .sidebar.open { transform: translateX(0); }
    .main-content { margin-left: 0 !important; }
    .top-bar { left: 0 !important; }
    .kpi-grid { grid-template-columns: 1fr 1fr !important; }
    .chart-grid-2 { grid-template-columns: 1fr !important; }
    .chart-grid-3 { grid-template-columns: 1fr !important; }
    .chart-grid-4 { grid-template-columns: 1fr 1fr !important; }
    .header-badges { display: none !important; }
  }

  @media (max-width: 480px) {
    .kpi-grid { grid-template-columns: 1fr !important; }
    .chart-grid-4 { grid-template-columns: 1fr !important; }
  }
`;

/* ─── COMPONENTS ─── */

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
const LoginScreen = ({ onLogin }) => {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = (e) => {
    e?.preventDefault?.();
    if (!email || !pass) { setError("Please fill in all fields"); return; }
    setLoading(true);
    setError("");
    setTimeout(() => {
      setLoading(false);
      onLogin(email);
    }, 1200);
  };

  return (
    <div style={{ minHeight: "100vh", background: T.bg, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
      <style>{css}</style>
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

        {/* Login Card */}
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 20, padding: 32, backdropFilter: "blur(20px)" }}>
          <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 20, fontWeight: 700, color: T.white, marginBottom: 4 }}>Welcome back</h2>
          <p style={{ color: T.textSecondary, fontSize: 13, marginBottom: 28 }}>Sign in to access your dashboard</p>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: T.textSecondary, textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 6 }}>Email</label>
              <input className="login-input" type="email" placeholder="you@company.com" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === "Enter" && handleLogin()} />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: T.textSecondary, textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 6 }}>Password</label>
              <div style={{ position: "relative" }}>
                <input className="login-input" type={showPass ? "text" : "password"} placeholder="••••••••" value={pass} onChange={e => setPass(e.target.value)} onKeyDown={e => e.key === "Enter" && handleLogin()} style={{ paddingRight: 44 }} />
                <button onClick={() => setShowPass(!showPass)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: T.textMuted, padding: 4 }}>
                  {showPass ? Icons.eyeOff : Icons.eye}
                </button>
              </div>
            </div>

            {error && <div style={{ color: T.red, fontSize: 12, padding: "8px 12px", background: "rgba(239,68,68,0.08)", borderRadius: 8, border: "1px solid rgba(239,68,68,0.2)" }}>{error}</div>}

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", color: T.textSecondary, fontSize: 12 }}>
                <input type="checkbox" style={{ accentColor: T.gold }} /> Remember me
              </label>
              <a style={{ color: T.gold, fontSize: 12, textDecoration: "none", cursor: "pointer" }}>Forgot password?</a>
            </div>

            <button className="login-btn" onClick={handleLogin} disabled={loading}>
              {loading ? (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                  <span style={{ width: 16, height: 16, border: "2px solid rgba(4,9,15,0.3)", borderTopColor: T.bg, borderRadius: "50%", animation: "spin 0.6s linear infinite", display: "inline-block" }} />
                  Signing in...
                </span>
              ) : "Sign In"}
            </button>
          </div>

          <div style={{ textAlign: "center", marginTop: 24, paddingTop: 20, borderTop: `1px solid ${T.border}` }}>
            <p style={{ color: T.textMuted, fontSize: 12 }}>
              Don't have an account? <a style={{ color: T.gold, textDecoration: "none", fontWeight: 600, cursor: "pointer" }}>Request Access</a>
            </p>
          </div>
        </div>

        <p style={{ textAlign: "center", color: T.textMuted, fontSize: 11, marginTop: 24 }}>
          Powered by The Address Holding · Emaar Intelligence Platform
        </p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

/* ─── MAIN DASHBOARD ─── */
export default function EmaarDashboardV2() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState("");
  const [tab, setTab] = useState("Overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  if (!isLoggedIn) {
    return <LoginScreen onLogin={(email) => { setIsLoggedIn(true); setUser(email); }} />;
  }

  const handleTabChange = (key) => {
    setTab(key);
    setSidebarOpen(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: T.bg, fontFamily: "'Outfit', sans-serif" }}>
      <style>{css}</style>

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
            <button key={t.key} className={`sidebar-btn ${tab === t.key ? "active" : ""}`} onClick={() => handleTabChange(t.key)}>
              {t.icon}
              {t.key}
            </button>
          ))}
        </nav>

        {/* Bottom */}
        <div style={{ padding: "16px 12px", borderTop: `1px solid ${T.border}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 10, background: T.surfaceAlt }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: `linear-gradient(135deg, ${T.gold}, #B8912F)`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13, color: T.bg }}>
              {user.charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.white, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.split("@")[0]}</div>
              <div style={{ fontSize: 10, color: T.textMuted }}>Pro Plan</div>
            </div>
            <button onClick={() => { setIsLoggedIn(false); setUser(""); }} style={{ background: "none", border: "none", cursor: "pointer", color: T.textMuted, padding: 4 }} title="Sign out">
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
          <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background: "none", border: "none", cursor: "pointer", color: T.textSecondary, display: "none", padding: 4 }} className="mobile-menu-btn">
            {sidebarOpen ? Icons.close : Icons.menu}
          </button>
          <style>{`@media (max-width: 768px) { .mobile-menu-btn { display: block !important; } }`}</style>
          <div>
            <h1 style={{ fontSize: 16, fontWeight: 700, color: T.white }}}>Emaar Properties <span style={{ color: T.textMuted, fontWeight: 400, fontSize: 13 }}>PJSC</span></h1>
            <p style={{ fontSize: 10, color: T.textMuted, letterSpacing: 1 }}>DFM: EMAAR · Last updated: {time.toLocaleDateString("en-AE", { day: "numeric", month: "short", year: "numeric" })}</p>
          </div>
        </div>
        <div className="header-badges" style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div style={{ background: T.surfaceAlt, borderRadius: 10, padding: "6px 12px", border: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 10, color: T.textMuted }}>STOCK</span>
            <span style={{ fontFamily: "'Fraunces', serif", fontWeight: 700, fontSize: 14, color: T.gold }}>17.05</span>
            <span style={{ color: T.green, fontSize: 11, fontWeight: 600, display: "flex", alignItems: "center", gap: 2 }}>{Icons.up} 2.75%</span>
          </div>
          <div style={{ background: T.surfaceAlt, borderRadius: 10, padding: "6px 12px", border: `1px solid ${T.border}` }}>
            <span style={{ fontSize: 10, color: T.textMuted }}>RATING </span>
            <span style={{ fontSize: 12, fontWeight: 600, color: T.teal }}>BBB+ / Baa1</span>
          </div>
          <div style={{ background: T.surfaceAlt, borderRadius: 10, padding: "6px 12px", border: `1px solid ${T.border}` }}>
            <span style={{ fontSize: 10, color: T.textMuted }}>TARGET </span>
            <span style={{ fontSize: 12, fontWeight: 600, color: T.goldLight }}>AED 20.77</span>
          </div>
          <button style={{ background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 10, padding: 8, cursor: "pointer", color: T.textSecondary, position: "relative" }}>
            {Icons.bell}
            <span style={{ position: "absolute", top: 4, right: 4, width: 7, height: 7, borderRadius: "50%", background: T.red }} />
          </button>
        </div>
      </header>

      {/* ─── MAIN CONTENT ─── */}
      <main className="main-content" style={{ marginLeft: 240, paddingTop: 60, minHeight: "100vh" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px 60px" }}>

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
                <KPI label="Units Delivered" value="79,000+" sub="Since 2002 · #1 in GCC" delay={7} />
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

            <Section title="Company Strength" sub="Analyst consensus: STRONG BUY (12/12 analysts)">
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
                <KPI label="DPS (2025)" value="AED 1.00" sub="Maintained from 2024" delay={2} />
                <KPI label="EPS CAGR" value="52.8%" sub="5-year · 2020-2025" delay={3} />
                <KPI label="Dividend Yield" value="5.9%" sub="At AED 17.05 price" delay={4} />
              </div>
            </Section>
          </>}

          {/* ─── PORTFOLIO TAB ─── */}
          {tab === "Portfolio" && <>
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
              <div style={{ overflowX: "auto", marginTop: 12 }}>
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
                      <tr key={i} style={{ borderBottom: `1px solid ${T.border}`, transition: "background 0.2s" }} onMouseEnter={e => e.currentTarget.style.background = T.surfaceAlt} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
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
          </>}

          {/* ─── YIELDS TAB ─── */}
          {tab === "Yields" && <>
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
          </>}

          {/* ─── RISK TAB ─── */}
          {tab === "Risk" && <>
            <Section title="9-Factor Risk Assessment" sub="Overall: LOW-MODERATE · Investment Grade · BBB+/Baa1/BBB">
              <div className="kpi-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginTop: 16 }}>
                <KPI label="Avg Risk Score" value="38.3" sub="LOW-MODERATE overall" delay={1} />
                <KPI label="Highest Risk" value="125" sub="Premium Pricing" delay={2} />
                <KPI label="Lowest Risk" value="1" sub="Liquidity / Exit" delay={3} />
              </div>

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
            </Section>

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
          </>}

          {/* ─── MARKET TAB ─── */}
          {tab === "Market" && <>
            <Section title="Dubai Real Estate — 2025" sub="Official DLD Data · 5th Consecutive Record Year">
              <div className="kpi-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginTop: 16 }}>
                {dubaiMarket.map((m, i) => <KPI key={i} label={m.metric} value={m.val} sub={m.yoy} delay={Math.min(i + 1, 8)} />)}
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

        </div>

        {/* Footer */}
        <footer style={{ borderTop: `1px solid ${T.border}`, padding: "20px 24px", textAlign: "center" }}>
          <p style={{ color: T.textMuted, fontSize: 11 }}>
            Sources: Emaar IR, DLD, DXBinteract, Gulf News, Zawya, Knight Frank, CW Core, Fitch · Verified Feb 2026 · Not financial advice
          </p>
          <p style={{ color: "rgba(100,116,139,0.5)", fontSize: 10, marginTop: 4 }}>
            DXB Analytics · The Address Holding · © 2026
          </p>
        </footer>
      </main>
    </div>
  );
}
