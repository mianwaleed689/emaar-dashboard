import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area,
  ComposedChart, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Treemap
} from "recharts";

/* ═══════════════════════════════════════════════════════════
   THEME & DESIGN TOKENS
   ═══════════════════════════════════════════════════════════ */
const T = {
  // Core palette
  bg: "#04080F",
  surface: "#0A1628",
  surfaceAlt: "#0E1D35",
  card: "rgba(14,29,53,0.75)",
  cardHover: "rgba(14,29,53,0.95)",
  glass: "rgba(10,22,40,0.6)",
  // Brand
  gold: "#C9A84C",
  goldLight: "#E2C872",
  goldDim: "rgba(201,168,76,0.15)",
  goldBorder: "rgba(201,168,76,0.25)",
  // Accents
  teal: "#00BFA5",
  tealDim: "rgba(0,191,165,0.12)",
  blue: "#2196F3",
  blueDim: "rgba(33,150,243,0.12)",
  green: "#4CAF50",
  greenDim: "rgba(76,175,80,0.12)",
  red: "#EF5350",
  redDim: "rgba(239,83,80,0.12)",
  orange: "#FF9800",
  purple: "#AB47BC",
  // Text
  text: "#F0F2F5",
  textSecondary: "#8899B0",
  textMuted: "#546580",
  // Borders
  border: "rgba(201,168,76,0.12)",
  borderLight: "rgba(255,255,255,0.06)",
  // Shadows
  shadow: "0 4px 24px rgba(0,0,0,0.4)",
  shadowLg: "0 8px 40px rgba(0,0,0,0.5)",
  // Radii
  r: 12,
  rSm: 8,
  rLg: 16,
};

/* ═══════════════════════════════════════════════════════════
   DATA
   ═══════════════════════════════════════════════════════════ */
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
  { rank: 10, name: "Danube", sales: 7.0, units: 4089, delivered: 1757, underConst: 22000, color: T.textSecondary },
];

const segments = [
  { name: "UAE Property Dev", revenue: 36.4, growth: "44%", color: T.gold },
  { name: "Malls & Retail", revenue: 6.3, growth: "13%", color: T.teal },
  { name: "Hospitality", revenue: 4.2, growth: "12%", color: T.blue },
  { name: "International", revenue: 2.6, growth: "124%", color: T.green },
];

const risks = [
  { factor: "Premium Pricing", score: 125, color: T.red, level: "High" },
  { factor: "Market Cycle", score: 100, color: T.orange, level: "High" },
  { factor: "Supply Competition", score: 60, color: T.orange, level: "Medium" },
  { factor: "Geographic Conc.", score: 45, color: T.gold, level: "Medium" },
  { factor: "Interest Rate", score: 8, color: T.teal, level: "Low" },
  { factor: "Execution", score: 2, color: T.green, level: "V.Low" },
  { factor: "Regulatory", score: 2, color: T.green, level: "V.Low" },
  { factor: "Currency (Peg)", score: 2, color: T.green, level: "V.Low" },
  { factor: "Liquidity", score: 1, color: T.green, level: "V.Low" },
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

/* ═══════════════════════════════════════════════════════════
   CSS KEYFRAMES & GLOBAL STYLES
   ═══════════════════════════════════════════════════════════ */
const globalCSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=Cormorant+Garamond:wght@400;500;600;700&display=swap');

  * { margin: 0; padding: 0; box-sizing: border-box; }
  ::-webkit-scrollbar { width: 5px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: ${T.goldBorder}; border-radius: 10px; }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(12px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes slideIn {
    from { opacity: 0; transform: translateX(-16px); }
    to { opacity: 1; transform: translateX(0); }
  }
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
  @keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
  @keyframes countUp {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }

  body {
    font-family: 'DM Sans', -apple-system, sans-serif;
    background: ${T.bg};
    color: ${T.text};
    overflow: hidden;
  }
`;

/* ═══════════════════════════════════════════════════════════
   ICONS (inline SVG)
   ═══════════════════════════════════════════════════════════ */
const icons = {
  overview: (c) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
  financial: (c) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
  portfolio: (c) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/></svg>,
  competitors: (c) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/></svg>,
  yields: (c) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="23,6 13.5,15.5 8.5,10.5 1,18"/><polyline points="17,6 23,6 23,12"/></svg>,
  risk: (c) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  market: (c) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
  menu: (c) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
  close: (c) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  live: (c) => <svg width="8" height="8"><circle cx="4" cy="4" r="4" fill={c}/></svg>,
  arrow: (up, c) => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5"><path d={up ? "M18 15l-6-6-6 6" : "M6 9l6 6 6-6"}/></svg>,
};

const tabs = [
  { id: "overview", label: "Overview", icon: icons.overview },
  { id: "financials", label: "Financials", icon: icons.financial },
  { id: "portfolio", label: "Portfolio", icon: icons.portfolio },
  { id: "competitors", label: "Competitors", icon: icons.competitors },
  { id: "yields", label: "Yields", icon: icons.yields },
  { id: "risk", label: "Risk", icon: icons.risk },
  { id: "market", label: "Market", icon: icons.market },
];

/* ═══════════════════════════════════════════════════════════
   REUSABLE COMPONENTS
   ═══════════════════════════════════════════════════════════ */

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: T.surface,
      border: `1px solid ${T.goldBorder}`,
      borderRadius: T.rSm,
      padding: "10px 14px",
      boxShadow: T.shadowLg,
    }}>
      <p style={{ color: T.gold, fontWeight: 600, fontSize: 12, marginBottom: 6, fontFamily: "'Cormorant Garamond',serif" }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color || T.text, fontSize: 11, lineHeight: 1.6 }}>
          {p.name}: <strong>{typeof p.value === "number" ? p.value.toLocaleString() : p.value}</strong>
        </p>
      ))}
    </div>
  );
};

const StatCard = ({ label, value, change, changeColor, icon, delay = 0 }) => (
  <div style={{
    background: `linear-gradient(135deg, ${T.card} 0%, rgba(10,22,40,0.5) 100%)`,
    backdropFilter: "blur(12px)",
    border: `1px solid ${T.border}`,
    borderRadius: T.r,
    padding: "20px 18px",
    position: "relative",
    overflow: "hidden",
    animation: `fadeIn 0.5s ease ${delay}s both`,
    transition: "border-color 0.3s, transform 0.2s",
  }}
    onMouseEnter={e => { e.currentTarget.style.borderColor = T.goldBorder; e.currentTarget.style.transform = "translateY(-2px)"; }}
    onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.transform = "translateY(0)"; }}
  >
    <div style={{
      position: "absolute", top: -30, right: -30,
      width: 80, height: 80, borderRadius: "50%",
      background: `radial-gradient(circle, ${T.goldDim} 0%, transparent 70%)`,
    }} />
    <span style={{
      color: T.textSecondary, fontSize: 10, letterSpacing: 1.8,
      textTransform: "uppercase", fontWeight: 500, display: "block", marginBottom: 8,
    }}>{label}</span>
    <span style={{
      color: T.gold, fontSize: 26, fontWeight: 700, display: "block",
      fontFamily: "'Cormorant Garamond', serif", lineHeight: 1.1,
      animation: `countUp 0.6s ease ${delay + 0.2}s both`,
    }}>{value}</span>
    {change && (
      <span style={{
        display: "inline-flex", alignItems: "center", gap: 3,
        marginTop: 8, fontSize: 11, fontWeight: 600,
        color: changeColor || T.teal,
        background: changeColor === T.red ? T.redDim : T.tealDim,
        padding: "2px 8px", borderRadius: 20,
      }}>
        {icons.arrow(!changeColor || changeColor !== T.red, changeColor || T.teal)}
        {change}
      </span>
    )}
  </div>
);

const SectionHeader = ({ title, subtitle, delay = 0 }) => (
  <div style={{ marginBottom: 20, marginTop: 40, animation: `fadeIn 0.4s ease ${delay}s both` }}>
    <h2 style={{
      fontFamily: "'Cormorant Garamond', serif",
      fontSize: 22, fontWeight: 600, color: T.text,
      display: "flex", alignItems: "center", gap: 12,
    }}>
      <span style={{
        width: 3, height: 22, background: `linear-gradient(180deg, ${T.gold}, ${T.teal})`,
        borderRadius: 4, display: "inline-block",
      }} />
      {title}
    </h2>
    {subtitle && (
      <p style={{ color: T.textMuted, fontSize: 12, marginTop: 4, marginLeft: 15, letterSpacing: 0.3 }}>{subtitle}</p>
    )}
  </div>
);

const ChartContainer = ({ title, children, delay = 0 }) => (
  <div style={{
    background: T.card,
    backdropFilter: "blur(12px)",
    border: `1px solid ${T.border}`,
    borderRadius: T.r,
    padding: "20px",
    marginBottom: 16,
    animation: `fadeIn 0.5s ease ${delay}s both`,
  }}>
    {title && (
      <h3 style={{
        fontFamily: "'Cormorant Garamond', serif",
        fontSize: 15, fontWeight: 600, color: T.textSecondary,
        marginBottom: 16, letterSpacing: 0.5,
      }}>{title}</h3>
    )}
    {children}
  </div>
);

/* ═══════════════════════════════════════════════════════════
   TAB CONTENT SECTIONS
   ═══════════════════════════════════════════════════════════ */

const OverviewTab = () => {
  const latest = financials[financials.length - 1];
  const prev = financials[financials.length - 2];
  const revGrowth = (((latest.revenue - prev.revenue) / prev.revenue) * 100).toFixed(1);
  const profitGrowth = (((latest.netProfit - prev.netProfit) / prev.netProfit) * 100).toFixed(1);

  return (
    <>
      {/* Hero KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 14 }}>
        <StatCard label="Property Sales" value="AED 80.4B" change={`+${(((80.4-69.5)/69.5)*100).toFixed(0)}% YoY`} delay={0} />
        <StatCard label="Revenue" value="AED 49.6B" change={`+${revGrowth}%`} delay={0.05} />
        <StatCard label="Net Profit" value="AED 25.7B" change={`+${profitGrowth}%`} delay={0.1} />
        <StatCard label="Revenue Backlog" value="AED 155B" change="+39%" delay={0.15} />
        <StatCard label="Stock Price" value="AED 17.05" change="STRONG BUY" changeColor={T.teal} delay={0.2} />
        <StatCard label="Developer Rank" value="#1 Dubai" change="AED 65.8B" delay={0.25} />
      </div>

      {/* Revenue Trend */}
      <SectionHeader title="Revenue & Profit Growth" subtitle="FY 2020 — FY 2025 · AED Billions" delay={0.2} />
      <ChartContainer delay={0.25}>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={financials}>
            <defs>
              <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={T.gold} stopOpacity={0.3}/>
                <stop offset="100%" stopColor={T.gold} stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="tealGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={T.teal} stopOpacity={0.3}/>
                <stop offset="100%" stopColor={T.teal} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={T.borderLight} />
            <XAxis dataKey="year" tick={{ fill: T.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: T.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip content={<ChartTooltip />} />
            <Area type="monotone" dataKey="revenue" stroke={T.gold} fill="url(#goldGrad)" strokeWidth={2.5} name="Revenue" dot={{ r: 3, fill: T.gold }} />
            <Area type="monotone" dataKey="netProfit" stroke={T.teal} fill="url(#tealGrad)" strokeWidth={2.5} name="Net Profit" dot={{ r: 3, fill: T.teal }} />
          </AreaChart>
        </ResponsiveContainer>
      </ChartContainer>

      {/* Business Segments */}
      <SectionHeader title="Business Segments" subtitle="FY 2025 Revenue by Division" delay={0.3} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 }}>
        {segments.map((s, i) => (
          <div key={i} style={{
            background: T.card, border: `1px solid ${T.border}`, borderRadius: T.r,
            padding: "18px", borderLeft: `3px solid ${s.color}`,
            animation: `fadeIn 0.4s ease ${0.3 + i * 0.05}s both`,
            transition: "transform 0.2s",
          }}
            onMouseEnter={e => e.currentTarget.style.transform = "translateX(4px)"}
            onMouseLeave={e => e.currentTarget.style.transform = "translateX(0)"}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <span style={{ color: T.textSecondary, fontSize: 11, display: "block", marginBottom: 4 }}>{s.name}</span>
                <span style={{ color: T.text, fontSize: 22, fontWeight: 700, fontFamily: "'Cormorant Garamond',serif" }}>AED {s.revenue}B</span>
              </div>
              <span style={{
                background: T.tealDim, color: T.teal, fontSize: 11,
                fontWeight: 600, padding: "3px 8px", borderRadius: 20,
              }}>+{s.growth}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Key Metrics Row */}
      <SectionHeader title="Investment Snapshot" subtitle="Key metrics for investor consideration" delay={0.4} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 14 }}>
        <StatCard label="EPS" value={`AED ${latest.eps}`} change="+31%" delay={0.4} />
        <StatCard label="Dividend / Share" value={`AED ${latest.dividend}`} change="100% payout" delay={0.45} />
        <StatCard label="Analyst Target" value="AED 20.77" change="+22% upside" delay={0.5} />
        <StatCard label="Credit Rating" value="BBB+ / Baa1" change="Investment Grade" delay={0.55} />
        <StatCard label="Recurring Rev" value="AED 10.5B" change="+13%" delay={0.6} />
        <StatCard label="Intl Sales" value="AED 9.3B" change="+127%" delay={0.65} />
      </div>
    </>
  );
};

const FinancialsTab = () => {
  const latest = financials[financials.length - 1];
  const marginData = financials.map(f => ({
    year: f.year, gross: f.gm, ebitda: f.em, net: f.nm,
  }));

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 14 }}>
        <StatCard label="Revenue" value="AED 49.6B" change="+40%" delay={0} />
        <StatCard label="Gross Profit" value="AED 28.5B" change="+40%" delay={0.05} />
        <StatCard label="EBITDA" value="AED 25.6B" change="+33%" delay={0.1} />
        <StatCard label="Net Profit" value="AED 25.7B" change="+36%" delay={0.15} />
      </div>

      <SectionHeader title="Revenue Composition" subtitle="Stacked view by revenue stream · AED Billions" delay={0.2} />
      <ChartContainer delay={0.25}>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={financials}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.borderLight} />
            <XAxis dataKey="year" tick={{ fill: T.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: T.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip content={<ChartTooltip />} />
            <Legend wrapperStyle={{ fontSize: 11, color: T.textSecondary }} />
            <Bar dataKey="recurringRev" name="Recurring" fill={T.teal} radius={[0, 0, 0, 0]} stackId="a" />
            <Bar dataKey="intlSales" name="International" fill={T.blue} stackId="a" />
            <Bar dataKey="mallRev" name="Malls" fill={T.green} stackId="a" />
            <Bar dataKey="hotelRev" name="Hotels" fill={T.purple} stackId="a" />
            <Bar dataKey="netProfit" name="Net Profit" fill={T.gold} radius={[4, 4, 0, 0]} stackId="b" opacity={0.5} />
          </BarChart>
        </ResponsiveContainer>
      </ChartContainer>

      <SectionHeader title="Margin Trends" subtitle="Profitability improvement over 6 years" delay={0.3} />
      <ChartContainer delay={0.35}>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={marginData}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.borderLight} />
            <XAxis dataKey="year" tick={{ fill: T.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: T.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} unit="%" />
            <Tooltip content={<ChartTooltip />} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Line type="monotone" dataKey="gross" name="Gross Margin" stroke={T.gold} strokeWidth={2.5} dot={{ r: 4, fill: T.gold }} />
            <Line type="monotone" dataKey="ebitda" name="EBITDA Margin" stroke={T.teal} strokeWidth={2.5} dot={{ r: 4, fill: T.teal }} />
            <Line type="monotone" dataKey="net" name="Net Margin" stroke={T.blue} strokeWidth={2.5} dot={{ r: 4, fill: T.blue }} />
          </LineChart>
        </ResponsiveContainer>
      </ChartContainer>

      <SectionHeader title="Property Sales & Backlog" subtitle="Growth trajectory FY 2020 — FY 2025" delay={0.4} />
      <ChartContainer delay={0.45}>
        <ResponsiveContainer width="100%" height={260}>
          <ComposedChart data={financials}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.borderLight} />
            <XAxis dataKey="year" tick={{ fill: T.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: T.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip content={<ChartTooltip />} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="propertySales" name="Property Sales" fill={T.gold} radius={[4, 4, 0, 0]} barSize={30} opacity={0.85} />
            <Line type="monotone" dataKey="backlog" name="Revenue Backlog" stroke={T.teal} strokeWidth={2.5} dot={{ r: 4, fill: T.teal }} />
          </ComposedChart>
        </ResponsiveContainer>
      </ChartContainer>

      {/* EPS & Dividends */}
      <SectionHeader title="Shareholder Returns" subtitle="EPS & Dividend per Share · AED" delay={0.5} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        {financials.map((f, i) => (
          <div key={i} style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            background: T.card, border: `1px solid ${T.border}`, borderRadius: T.rSm,
            padding: "12px 16px", animation: `fadeIn 0.3s ease ${0.5 + i * 0.03}s both`,
          }}>
            <span style={{ color: T.gold, fontFamily: "'Cormorant Garamond',serif", fontWeight: 600, fontSize: 16 }}>{f.year}</span>
            <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
              <div style={{ textAlign: "right" }}>
                <span style={{ color: T.textMuted, fontSize: 9, display: "block", textTransform: "uppercase", letterSpacing: 1 }}>EPS</span>
                <span style={{ color: T.text, fontWeight: 600, fontSize: 14 }}>{f.eps}</span>
              </div>
              <div style={{ textAlign: "right" }}>
                <span style={{ color: T.textMuted, fontSize: 9, display: "block", textTransform: "uppercase", letterSpacing: 1 }}>DPS</span>
                <span style={{ color: T.teal, fontWeight: 600, fontSize: 14 }}>{f.dividend}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

const PortfolioTab = () => (
  <>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 14 }}>
      <StatCard label="Active Projects" value="48" change="10 communities" delay={0} />
      <StatCard label="Under Construction" value="51,032" change="Units" delay={0.05} />
      <StatCard label="Delivered (Track)" value="79,000+" change="Since 2002" delay={0.1} />
      <StatCard label="Master Communities" value="14+" change="Across Dubai" delay={0.15} />
    </div>

    <SectionHeader title="Community Breakdown" subtitle="Active Emaar communities with projects, yields, and pricing" delay={0.2} />
    <div style={{ overflowX: "auto" }}>
      <table style={{
        width: "100%", borderCollapse: "separate", borderSpacing: "0 6px",
        animation: "fadeIn 0.5s ease 0.25s both",
      }}>
        <thead>
          <tr>
            {["Community", "Projects", "Yield Range", "Price/sqft (AED)"].map((h, i) => (
              <th key={i} style={{
                textAlign: "left", padding: "10px 16px", color: T.textMuted,
                fontSize: 10, letterSpacing: 1.5, textTransform: "uppercase",
                borderBottom: `1px solid ${T.border}`, fontWeight: 500,
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {communityProjects.map((c, i) => (
            <tr key={i} style={{ transition: "background 0.2s" }}
              onMouseEnter={e => e.currentTarget.style.background = T.surfaceAlt}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              <td style={{ padding: "12px 16px" }}>
                <div>
                  <span style={{ color: T.text, fontWeight: 600, fontSize: 13 }}>{c.full}</span>
                  <span style={{ color: T.textMuted, fontSize: 10, marginLeft: 8, background: T.goldDim, padding: "1px 6px", borderRadius: 4 }}>{c.name}</span>
                </div>
              </td>
              <td style={{ padding: "12px 16px", color: T.gold, fontWeight: 700, fontSize: 16, fontFamily: "'Cormorant Garamond',serif" }}>{c.projects}</td>
              <td style={{ padding: "12px 16px", color: T.teal, fontWeight: 600, fontSize: 13 }}>{c.yield}</td>
              <td style={{ padding: "12px 16px", color: T.textSecondary, fontSize: 13 }}>{c.ppsf}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    <SectionHeader title="Project Distribution" subtitle="Projects per community" delay={0.3} />
    <ChartContainer delay={0.35}>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={communityProjects}>
          <CartesianGrid strokeDasharray="3 3" stroke={T.borderLight} />
          <XAxis dataKey="name" tick={{ fill: T.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: T.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip content={<ChartTooltip />} />
          <Bar dataKey="projects" name="Active Projects" radius={[6, 6, 0, 0]} barSize={36}>
            {communityProjects.map((_, i) => (
              <Cell key={i} fill={[T.gold, T.teal, T.blue, T.green, T.purple, T.orange, "#42A5F5", T.textSecondary][i]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  </>
);

const CompetitorsTab = () => (
  <>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 14 }}>
      <StatCard label="Emaar Sales" value="AED 65.8B" change="#1 in Dubai" delay={0} />
      <StatCard label="Market Share" value="~30%" change="By value" delay={0.05} />
      <StatCard label="Lead Over #2" value="+83%" change="vs DAMAC 35.9B" delay={0.1} />
      <StatCard label="Units Sold" value="13,149" change="FY 2025" delay={0.15} />
    </div>

    <SectionHeader title="Developer Rankings" subtitle="DXBinteract · Top 10 Dubai Developers by Sales Value 2025" delay={0.2} />
    <ChartContainer delay={0.25}>
      <ResponsiveContainer width="100%" height={360}>
        <BarChart data={developers} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke={T.borderLight} />
          <XAxis type="number" tick={{ fill: T.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis type="category" dataKey="name" tick={{ fill: T.textSecondary, fontSize: 12, fontWeight: 500 }} width={70} axisLine={false} tickLine={false} />
          <Tooltip content={<ChartTooltip />} />
          <Bar dataKey="sales" name="Sales (AED B)" radius={[0, 6, 6, 0]} barSize={22}>
            {developers.map((d, i) => <Cell key={i} fill={d.color} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>

    <SectionHeader title="Developer Details" subtitle="Sales, units, and construction pipeline" delay={0.3} />
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0 4px", animation: "fadeIn 0.5s ease 0.35s both" }}>
        <thead>
          <tr>
            {["#", "Developer", "Sales (AED B)", "Units Sold", "Delivered", "Under Construction"].map((h, i) => (
              <th key={i} style={{
                textAlign: i > 1 ? "right" : "left", padding: "10px 14px",
                color: T.textMuted, fontSize: 10, letterSpacing: 1.5, textTransform: "uppercase",
                borderBottom: `1px solid ${T.border}`, fontWeight: 500,
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {developers.map((d, i) => (
            <tr key={i}
              style={{ background: i === 0 ? T.goldDim : "transparent", transition: "background 0.2s" }}
              onMouseEnter={e => { if (i !== 0) e.currentTarget.style.background = T.surfaceAlt; }}
              onMouseLeave={e => { if (i !== 0) e.currentTarget.style.background = "transparent"; }}
            >
              <td style={{ padding: "10px 14px", color: d.color, fontWeight: 700, fontSize: 14 }}>{d.rank}</td>
              <td style={{ padding: "10px 14px", color: i === 0 ? T.gold : T.text, fontWeight: i === 0 ? 700 : 500, fontSize: 13 }}>{d.name}</td>
              <td style={{ padding: "10px 14px", color: T.text, fontWeight: 600, fontSize: 14, textAlign: "right", fontFamily: "'Cormorant Garamond',serif" }}>{d.sales}</td>
              <td style={{ padding: "10px 14px", color: T.textSecondary, textAlign: "right", fontSize: 12 }}>{d.units.toLocaleString()}</td>
              <td style={{ padding: "10px 14px", color: T.teal, textAlign: "right", fontSize: 12 }}>{d.delivered.toLocaleString()}</td>
              <td style={{ padding: "10px 14px", color: T.textMuted, textAlign: "right", fontSize: 12 }}>{d.underConst.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </>
);

const YieldsTab = () => (
  <>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 14 }}>
      <StatCard label="Avg Gross Yield" value="4.5%" change="Across communities" delay={0} />
      <StatCard label="Highest Yield" value="5.9%" change="The Valley 3BR" delay={0.05} />
      <StatCard label="Lowest Yield" value="3.6%" change="Downtown 2BR" delay={0.1} />
      <StatCard label="Avg Cash Flow" value="AED 62K" change="Annual per unit" delay={0.15} />
    </div>

    <SectionHeader title="Rental Yield Analysis" subtitle="Gross yield by community and unit type" delay={0.2} />
    <ChartContainer delay={0.25}>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={yields}>
          <CartesianGrid strokeDasharray="3 3" stroke={T.borderLight} />
          <XAxis dataKey="label" tick={{ fill: T.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: T.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} unit="%" />
          <Tooltip content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const d = payload[0]?.payload;
            return (
              <div style={{ background: T.surface, border: `1px solid ${T.goldBorder}`, borderRadius: T.rSm, padding: "12px 14px", boxShadow: T.shadowLg }}>
                <p style={{ color: T.gold, fontWeight: 600, fontSize: 13, marginBottom: 6, fontFamily: "'Cormorant Garamond',serif" }}>{d.community} — {d.label}</p>
                <p style={{ color: T.text, fontSize: 11 }}>Rent: AED {d.rent}K/yr · Price: AED {d.price}K</p>
                <p style={{ color: T.teal, fontSize: 11, marginTop: 2 }}>Gross: {d.gross}% · Net: {d.net}% · Demand: {d.demand}</p>
              </div>
            );
          }} />
          <Bar dataKey="gross" name="Gross Yield %" radius={[6, 6, 0, 0]} barSize={30}>
            {yields.map((y, i) => <Cell key={i} fill={y.demand === "V.High" ? T.gold : y.demand === "High" ? T.teal : T.blue} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>

    <SectionHeader title="Yield Detail Table" subtitle="Comprehensive yield data by unit" delay={0.3} />
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0 4px", animation: "fadeIn 0.5s ease 0.35s both" }}>
        <thead>
          <tr>
            {["Unit", "Community", "Rent (K/yr)", "Price (K)", "Gross %", "Net %", "Demand"].map((h, i) => (
              <th key={i} style={{
                textAlign: i > 1 ? "right" : "left", padding: "10px 14px",
                color: T.textMuted, fontSize: 10, letterSpacing: 1.5, textTransform: "uppercase",
                borderBottom: `1px solid ${T.border}`, fontWeight: 500,
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {yields.map((y, i) => (
            <tr key={i} style={{ transition: "background 0.2s" }}
              onMouseEnter={e => e.currentTarget.style.background = T.surfaceAlt}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              <td style={{ padding: "10px 14px", color: T.text, fontWeight: 500, fontSize: 12 }}>{y.label}</td>
              <td style={{ padding: "10px 14px", color: T.textSecondary, fontSize: 12 }}>{y.community}</td>
              <td style={{ padding: "10px 14px", color: T.text, textAlign: "right", fontSize: 12 }}>{y.rent}</td>
              <td style={{ padding: "10px 14px", color: T.text, textAlign: "right", fontSize: 12 }}>{y.price.toLocaleString()}</td>
              <td style={{ padding: "10px 14px", color: T.gold, fontWeight: 600, textAlign: "right", fontSize: 13 }}>{y.gross}%</td>
              <td style={{ padding: "10px 14px", color: T.teal, fontWeight: 600, textAlign: "right", fontSize: 13 }}>{y.net}%</td>
              <td style={{ padding: "10px 14px", textAlign: "right" }}>
                <span style={{
                  background: y.demand === "V.High" ? T.goldDim : y.demand === "High" ? T.tealDim : T.blueDim,
                  color: y.demand === "V.High" ? T.gold : y.demand === "High" ? T.teal : T.blue,
                  fontSize: 10, fontWeight: 600, padding: "3px 8px", borderRadius: 20,
                }}>{y.demand}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    <SectionHeader title="ROI Framework" subtitle="Expected returns for Emaar off-plan investments" delay={0.4} />
    <ChartContainer delay={0.45}>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={roiPhases}>
          <CartesianGrid strokeDasharray="3 3" stroke={T.borderLight} />
          <XAxis dataKey="phase" tick={{ fill: T.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: T.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} unit="%" />
          <Tooltip content={<ChartTooltip />} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Bar dataKey="low" fill={T.teal} name="Low %" radius={[0, 0, 0, 0]} barSize={28} opacity={0.5} />
          <Bar dataKey="high" fill={T.gold} name="High %" radius={[6, 6, 0, 0]} barSize={28} opacity={0.85} />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  </>
);

const RiskTab = () => (
  <>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 14 }}>
      <StatCard label="Overall Risk" value="LOW-MOD" change="Investment Grade" delay={0} />
      <StatCard label="Avg Risk Score" value="38.3" change="Out of 200" delay={0.05} />
      <StatCard label="Credit Rating" value="BBB+" change="S&P · Baa1 Moody's" delay={0.1} />
      <StatCard label="Highest Risk" value="125" change="Premium Pricing" changeColor={T.red} delay={0.15} />
    </div>

    <SectionHeader title="9-Factor Risk Assessment" subtitle="Comprehensive risk scoring model · Higher = More Risk" delay={0.2} />
    <ChartContainer delay={0.25}>
      <ResponsiveContainer width="100%" height={380}>
        <BarChart data={risks} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke={T.borderLight} />
          <XAxis type="number" tick={{ fill: T.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 140]} />
          <YAxis type="category" dataKey="factor" tick={{ fill: T.textSecondary, fontSize: 11 }} width={120} axisLine={false} tickLine={false} />
          <Tooltip content={<ChartTooltip />} />
          <Bar dataKey="score" name="Risk Score" radius={[0, 8, 8, 0]} barSize={20}>
            {risks.map((r, i) => <Cell key={i} fill={r.color} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>

    <SectionHeader title="Risk Mitigation" subtitle="How Emaar addresses key risk factors" delay={0.3} />
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14 }}>
      {[
        ["Market Cycle", "AED 155B backlog provides 3-4yr revenue cushion. 35% recurring from malls & hotels.", T.orange],
        ["Supply Competition", "Brand premium of 20-40%. 79K delivery track record. 14+ master communities.", T.orange],
        ["Premium Pricing", "80/20 payment plans reduce barrier. Branded residences justify premium.", T.red],
        ["Geographic Concentration", "International sales grew +124% YoY. Expanding to Saudi, Egypt, India.", T.gold],
      ].map(([title, desc, color], i) => (
        <div key={i} style={{
          background: T.card, border: `1px solid ${T.border}`, borderRadius: T.r,
          padding: "18px", borderTop: `3px solid ${color}`,
          animation: `fadeIn 0.4s ease ${0.3 + i * 0.05}s both`,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: color, display: "inline-block" }} />
            <span style={{ color: T.text, fontWeight: 600, fontSize: 13 }}>{title}</span>
          </div>
          <p style={{ color: T.textSecondary, fontSize: 12, lineHeight: 1.7 }}>{desc}</p>
        </div>
      ))}
    </div>
  </>
);

const MarketTab = () => (
  <>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 14 }}>
      {dubaiMarket.map((m, i) => (
        <StatCard key={i} label={m.metric} value={m.val} change={m.yoy} delay={i * 0.05} />
      ))}
    </div>

    <SectionHeader title="Dubai Sales Growth" subtitle="Total market value · AED Billions · 5th consecutive record year" delay={0.2} />
    <ChartContainer delay={0.25}>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={dubaiSalesHistory}>
          <defs>
            <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={T.gold} stopOpacity={0.9}/>
              <stop offset="100%" stopColor={T.gold} stopOpacity={0.4}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={T.borderLight} />
          <XAxis dataKey="year" tick={{ fill: T.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: T.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip content={<ChartTooltip />} />
          <Bar dataKey="sales" name="Sales (AED B)" radius={[8, 8, 0, 0]} barSize={40}>
            {dubaiSalesHistory.map((_, i) => (
              <Cell key={i} fill={i === dubaiSalesHistory.length - 1 ? T.gold : `rgba(201,168,76,${0.25 + (i * 0.12)})`} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>

    <SectionHeader title="2026 Outlook" subtitle="Analyst forecasts from major consultancies" delay={0.3} />
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 14 }}>
      {[
        ["Knight Frank", "+3% prime, ~1% mainstream. Transitioning to a sustainable growth phase.", T.gold],
        ["CW Core", "5-8% appreciation forecast. A slowdown from 12-22% seen in 2024-25.", T.teal],
        ["Fitch Ratings", "Moderate correction possible. Approximately 120K units in 2026 pipeline.", T.orange],
      ].map(([firm, view, color], i) => (
        <div key={i} style={{
          background: T.card, border: `1px solid ${T.border}`, borderRadius: T.r,
          padding: "20px", borderTop: `3px solid ${color}`,
          animation: `fadeIn 0.4s ease ${0.35 + i * 0.05}s both`,
        }}>
          <h4 style={{
            color, fontSize: 16, fontWeight: 600, marginBottom: 8,
            fontFamily: "'Cormorant Garamond', serif",
          }}>{firm}</h4>
          <p style={{ color: T.textSecondary, fontSize: 12, lineHeight: 1.7 }}>{view}</p>
        </div>
      ))}
    </div>

    <SectionHeader title="Key Market Indicators" subtitle="Structural metrics supporting the Dubai market thesis" delay={0.4} />
    <div style={{
      display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14,
      animation: "fadeIn 0.5s ease 0.45s both",
    }}>
      {[
        ["Population Target", "5.8M by 2040"], ["Price Cycle", "56+ months positive"], ["Developer Count", "228 active"],
        ["Units Launched", "131,504 in 2025"], ["Mortgage Txns", "50,974 deals"], ["2026 Pipeline", "~120K units"],
        ["Women Investors", "AED 154B"], ["REIDIN Growth", "+12.9% YoY"], ["Investor Base", "193.1K (+24%)"],
      ].map(([k, v], i) => (
        <div key={i} style={{
          background: T.card, border: `1px solid ${T.border}`, borderRadius: T.rSm,
          padding: "14px 16px", transition: "border-color 0.2s",
        }}
          onMouseEnter={e => e.currentTarget.style.borderColor = T.goldBorder}
          onMouseLeave={e => e.currentTarget.style.borderColor = T.border}
        >
          <span style={{ color: T.textMuted, fontSize: 10, letterSpacing: 1.2, textTransform: "uppercase", display: "block", marginBottom: 4 }}>{k}</span>
          <span style={{ color: T.text, fontSize: 15, fontWeight: 600, fontFamily: "'Cormorant Garamond',serif" }}>{v}</span>
        </div>
      ))}
    </div>
  </>
);

/* ═══════════════════════════════════════════════════════════
   MAIN APP
   ═══════════════════════════════════════════════════════════ */
export default function EmaarDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [time, setTime] = useState(new Date());
  const contentRef = useRef(null);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [activeTab]);

  const handleTabChange = (id) => {
    setActiveTab(id);
    setSidebarOpen(false);
  };

  const renderTab = () => {
    switch (activeTab) {
      case "overview": return <OverviewTab />;
      case "financials": return <FinancialsTab />;
      case "portfolio": return <PortfolioTab />;
      case "competitors": return <CompetitorsTab />;
      case "yields": return <YieldsTab />;
      case "risk": return <RiskTab />;
      case "market": return <MarketTab />;
      default: return <OverviewTab />;
    }
  };

  return (
    <>
      <style>{globalCSS}</style>
      <div style={{
        display: "flex", height: "100vh", width: "100vw",
        background: T.bg, overflow: "hidden",
        fontFamily: "'DM Sans', sans-serif",
      }}>

        {/* ── SIDEBAR ── */}
        <aside style={{
          width: sidebarOpen ? 240 : 240,
          minWidth: 240,
          height: "100vh",
          background: `linear-gradient(180deg, ${T.surface} 0%, ${T.bg} 100%)`,
          borderRight: `1px solid ${T.border}`,
          display: "flex",
          flexDirection: "column",
          zIndex: 100,
          transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          position: window.innerWidth < 768 ? "fixed" : "relative",
          transform: window.innerWidth < 768 && !sidebarOpen ? "translateX(-100%)" : "translateX(0)",
        }}>
          {/* Logo */}
          <div style={{
            padding: "28px 24px 24px",
            borderBottom: `1px solid ${T.border}`,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: `linear-gradient(135deg, ${T.gold}, ${T.goldLight})`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: 18, fontWeight: 700, color: T.bg,
              }}>E</div>
              <div>
                <h1 style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: 18, fontWeight: 700, color: T.text, lineHeight: 1.1,
                }}>Emaar Intel</h1>
                <span style={{
                  fontSize: 9, color: T.textMuted, letterSpacing: 2,
                  textTransform: "uppercase",
                }}>Real Estate Intelligence</span>
              </div>
            </div>
            {/* Live indicator */}
            <div style={{
              display: "flex", alignItems: "center", gap: 6,
              marginTop: 16, padding: "6px 10px",
              background: "rgba(0,191,165,0.08)", borderRadius: 6,
              border: "1px solid rgba(0,191,165,0.15)",
            }}>
              <span style={{ animation: "pulse 2s infinite" }}>{icons.live(T.teal)}</span>
              <span style={{ color: T.teal, fontSize: 10, fontWeight: 500, letterSpacing: 0.5 }}>
                DATA VERIFIED · FEB 2026
              </span>
            </div>
          </div>

          {/* Navigation */}
          <nav style={{ flex: 1, padding: "16px 12px", overflowY: "auto" }}>
            <span style={{
              color: T.textMuted, fontSize: 9, letterSpacing: 2.5,
              textTransform: "uppercase", padding: "0 12px", display: "block", marginBottom: 8,
            }}>Navigation</span>
            {tabs.map((t, i) => {
              const active = activeTab === t.id;
              return (
                <button key={t.id} onClick={() => handleTabChange(t.id)} style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 12,
                  padding: "11px 14px", marginBottom: 2,
                  background: active ? T.goldDim : "transparent",
                  border: active ? `1px solid ${T.goldBorder}` : "1px solid transparent",
                  borderRadius: T.rSm,
                  cursor: "pointer",
                  transition: "all 0.2s",
                  animation: `slideIn 0.3s ease ${i * 0.04}s both`,
                }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}
                >
                  {t.icon(active ? T.gold : T.textMuted)}
                  <span style={{
                    color: active ? T.gold : T.textSecondary,
                    fontSize: 13, fontWeight: active ? 600 : 400,
                    letterSpacing: 0.3,
                  }}>{t.label}</span>
                  {active && <span style={{
                    marginLeft: "auto", width: 4, height: 4, borderRadius: "50%", background: T.gold,
                  }} />}
                </button>
              );
            })}
          </nav>

          {/* Sidebar Footer */}
          <div style={{
            padding: "16px 20px",
            borderTop: `1px solid ${T.border}`,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 4 }}>
              <span style={{ color: T.textMuted, fontSize: 10 }}>EMAAR:DFM</span>
              <span style={{ color: T.gold, fontWeight: 600, fontSize: 12, fontFamily: "'Cormorant Garamond',serif" }}>AED 17.05</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ color: T.textMuted, fontSize: 9 }}>Target:</span>
              <span style={{ color: T.teal, fontWeight: 600, fontSize: 11 }}>AED 20.77</span>
              <span style={{
                background: T.tealDim, color: T.teal, fontSize: 9,
                fontWeight: 600, padding: "1px 6px", borderRadius: 10,
              }}>STRONG BUY</span>
            </div>
            <p style={{ color: T.textMuted, fontSize: 8, marginTop: 8, lineHeight: 1.4 }}>
              {time.toLocaleDateString("en-AE", { weekday: "short", day: "numeric", month: "short", year: "numeric" })} · Not financial advice
            </p>
          </div>
        </aside>

        {/* ── MOBILE OVERLAY ── */}
        {sidebarOpen && window.innerWidth < 768 && (
          <div onClick={() => setSidebarOpen(false)} style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
            zIndex: 99, backdropFilter: "blur(4px)",
          }} />
        )}

        {/* ── MAIN CONTENT ── */}
        <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {/* Top Bar */}
          <header style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "14px 28px",
            background: T.surface,
            borderBottom: `1px solid ${T.border}`,
            minHeight: 56,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              {/* Mobile menu button */}
              <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{
                background: "none", border: "none", cursor: "pointer",
                display: window.innerWidth < 768 ? "block" : "none",
                padding: 4,
              }}>
                {sidebarOpen ? icons.close(T.textSecondary) : icons.menu(T.textSecondary)}
              </button>
              <div>
                <h2 style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: 20, fontWeight: 600, color: T.text,
                }}>
                  {tabs.find(t => t.id === activeTab)?.label}
                </h2>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <span style={{ color: T.textMuted, fontSize: 11 }}>
                Emaar Properties PJSC · DFM
              </span>
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: T.goldDim, border: `1px solid ${T.goldBorder}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: "'Cormorant Garamond',serif", fontSize: 14,
                fontWeight: 700, color: T.gold,
              }}>W</div>
            </div>
          </header>

          {/* Scrollable Content */}
          <div ref={contentRef} style={{
            flex: 1, overflowY: "auto", padding: "24px 28px 60px",
          }}>
            {renderTab()}

            {/* Footer */}
            <div style={{
              marginTop: 48, paddingTop: 20,
              borderTop: `1px solid ${T.border}`,
              textAlign: "center",
            }}>
              <p style={{ color: T.textMuted, fontSize: 10, lineHeight: 1.6 }}>
                Sources: Emaar IR · DLD · DXBinteract · Yahoo Finance · Knight Frank · CW Core · Fitch Ratings · Gulf News · Zawya
              </p>
              <p style={{ color: T.textMuted, fontSize: 9, marginTop: 4 }}>
                Data verified February 2026 · Not financial advice · Built by The Address Holding
              </p>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
