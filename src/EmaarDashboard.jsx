import React, { useState, useEffect, useRef } from "react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, ComposedChart } from "recharts";

const C = {
  navy: "#0B1F3F", navyL: "#132D54", navyM: "#1A3A6A", navyS: "#0D2847",
  gold: "#D4A843", goldL: "#E8C96A", goldD: "#B8912F", goldS: "rgba(212,168,67,0.15)",
  teal: "#00897B", tealL: "#26A69A", green: "#2E7D32",
  white: "#FFFFFF", light: "#F5F7FA", gray: "#64748B", grayL: "#94A3B8",
  red: "#E53935", orange: "#FB8C00", blue: "#1E88E5", purple: "#7E57C2",
  bg: "#060E1A", card: "rgba(11,31,63,0.85)", border: "rgba(212,168,67,0.2)",
};

const financials = [
  { year: "2020", revenue: 14.9, grossProfit: 4.8, ebitda: 6.2, netProfit: 2.7, propertySales: 14, backlog: 28, recurringRev: 5.3, intlSales: 0.6, mallRev: 3.2, hotelRev: 2.1, dividend: 0.15, eps: 0.24, gm: 32.2, em: 41.6, nm: 14.1 },
  { year: "2021", revenue: 27.9, grossProfit: 11.6, ebitda: 8.5, netProfit: 6.6, propertySales: 23.9, backlog: 32, recurringRev: 5.8, intlSales: 0.8, mallRev: 3.5, hotelRev: 2.3, dividend: 0.25, eps: 0.60, gm: 41.6, em: 30.5, nm: 19.0 },
  { year: "2022", revenue: 24.9, grossProfit: 12.6, ebitda: 9.8, netProfit: 8.1, propertySales: 30.7, backlog: 41.5, recurringRev: 7.5, intlSales: 1.2, mallRev: 4.2, hotelRev: 3.3, dividend: 0.35, eps: 0.77, gm: 50.6, em: 39.4, nm: 27.3 },
  { year: "2023", revenue: 26.7, grossProfit: 16.9, ebitda: 16, netProfit: 15.1, propertySales: 40.3, backlog: 71.8, recurringRev: 8.6, intlSales: 2.9, mallRev: 5.8, hotelRev: 2.8, dividend: 0.50, eps: 1.32, gm: 63.3, em: 59.9, nm: 43.4 },
  { year: "2024", revenue: 35.5, grossProfit: 20.4, ebitda: 19.3, netProfit: 18.9, propertySales: 69.5, backlog: 111.5, recurringRev: 9.3, intlSales: 4.1, mallRev: 5.6, hotelRev: 3.7, dividend: 1.00, eps: 1.53, gm: 57.5, em: 54.4, nm: 38.0 },
  { year: "2025", revenue: 49.6, grossProfit: 28.5, ebitda: 25.6, netProfit: 25.7, propertySales: 80.4, backlog: 155, recurringRev: 10.5, intlSales: 9.3, mallRev: 6.3, hotelRev: 4.2, dividend: 1.00, eps: 2.00, gm: 57.5, em: 51.6, nm: 35.5 },
];

const developers = [
  { rank: 1, name: "Emaar", sales: 65.8, units: 13149, delivered: 7318, underConst: 51032, color: C.gold },
  { rank: 2, name: "DAMAC", sales: 35.9, units: 15393, delivered: 2113, underConst: 46554, color: C.teal },
  { rank: 3, name: "Binghatti", sales: 26.0, units: 17061, delivered: 4093, underConst: 38000, color: C.blue },
  { rank: 4, name: "Nakheel", sales: 24.6, units: 4160, delivered: 1522, underConst: 15000, color: C.green },
  { rank: 5, name: "Sobha", sales: 22.4, units: 9698, delivered: 2260, underConst: 26933, color: C.purple },
  { rank: 6, name: "Meraas", sales: 20.9, units: 2385, delivered: 1913, underConst: 12000, color: C.orange },
  { rank: 7, name: "Omniyat", sales: 11.0, units: 1656, delivered: 800, underConst: 4500, color: "#FF7043" },
  { rank: 8, name: "Aldar", sales: 9.9, units: 1732, delivered: 1200, underConst: 18000, color: "#42A5F5" },
  { rank: 9, name: "H&H", sales: 8.1, units: 1200, delivered: 600, underConst: 8000, color: "#AB47BC" },
  { rank: 10, name: "Danube", sales: 7.0, units: 4089, delivered: 1757, underConst: 22000, color: C.grayL },
];

const segments = [
  { name: "UAE Property Dev", revenue: 36.4, growth: "44%", color: C.gold },
  { name: "Malls & Retail", revenue: 6.3, growth: "13%", color: C.teal },
  { name: "Hospitality", revenue: 4.2, growth: "12%", color: C.blue },
  { name: "International", revenue: 2.6, growth: "124%", color: C.green },
];

const risks = [
  { factor: "Premium Pricing", score: 125, color: C.red },
  { factor: "Market Cycle", score: 100, color: C.orange },
  { factor: "Supply Competition", score: 60, color: C.orange },
  { factor: "Geographic Conc.", score: 45, color: C.gold },
  { factor: "Interest Rate", score: 8, color: C.teal },
  { factor: "Execution", score: 2, color: C.green },
  { factor: "Regulatory", score: 2, color: C.green },
  { factor: "Currency (Peg)", score: 2, color: C.green },
  { factor: "Liquidity", score: 1, color: C.green },
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

const KPICard = ({ label, value, sub }) => (
  <div style={{ background: `linear-gradient(135deg, ${C.card} 0%, rgba(19,45,84,0.9) 100%)`, border: `1px solid ${C.border}`, borderRadius: 16, padding: "18px 14px", display: "flex", flexDirection: "column", gap: 4, position: "relative", overflow: "hidden" }}>
    <div style={{ position: "absolute", top: -20, right: -20, width: 70, height: 70, borderRadius: "50%", background: `radial-gradient(circle, ${C.goldS} 0%, transparent 70%)` }} />
    <span style={{ color: C.grayL, fontSize: 10, letterSpacing: 1.5, textTransform: "uppercase", fontFamily: "'DM Sans',sans-serif" }}>{label}</span>
    <span style={{ color: C.gold, fontSize: 24, fontWeight: 700, fontFamily: "'Playfair Display',serif", lineHeight: 1.1 }}>{value}</span>
    <span style={{ color: C.tealL, fontSize: 11, fontWeight: 600 }}>{sub}</span>
  </div>
);

const SectionTitle = ({ children, sub }) => (
  <div style={{ marginBottom: 16, marginTop: 36 }}>
    <h2 style={{ color: C.white, fontSize: 20, fontWeight: 700, fontFamily: "'Playfair Display',serif", margin: 0, borderLeft: `3px solid ${C.gold}`, paddingLeft: 14 }}>{children}</h2>
    {sub && <p style={{ color: C.grayL, fontSize: 11, margin: "4px 0 0 17px" }}>{sub}</p>}
  </div>
);

const ChartBox = ({ children, title }) => (
  <div style={{ background: `linear-gradient(180deg, ${C.card} 0%, rgba(6,14,26,0.95) 100%)`, border: `1px solid ${C.border}`, borderRadius: 16, padding: "16px 14px" }}>
    {title && <h3 style={{ color: C.goldL, fontSize: 12, fontWeight: 600, marginBottom: 10, letterSpacing: 0.5, textTransform: "uppercase" }}>{title}</h3>}
    {children}
  </div>
);

const Tip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: C.navy, border: `1px solid ${C.gold}`, borderRadius: 8, padding: "8px 12px", boxShadow: "0 8px 32px rgba(0,0,0,0.5)" }}>
      <p style={{ color: C.gold, fontWeight: 700, margin: 0, fontSize: 12 }}>{label}</p>
      {payload.map((p, i) => <p key={i} style={{ color: p.color || C.white, margin: "2px 0 0", fontSize: 11 }}>{p.name}: <strong>{typeof p.value === "number" ? p.value.toFixed(1) : p.value}</strong></p>)}
    </div>
  );
};

const TABS = ["Overview", "Financials", "Portfolio", "Competitors", "Yields", "Risk", "Market"];

export default function EmaarDashboard() {
  const [tab, setTab] = useState("Overview");

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.white, fontFamily: "'DM Sans',sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <div style={{ position: "fixed", inset: 0, opacity: 0.03, backgroundImage: `radial-gradient(${C.gold} 1px, transparent 1px)`, backgroundSize: "40px 40px", pointerEvents: "none" }} />

      <header style={{ background: `linear-gradient(135deg, ${C.navy} 0%, ${C.navyS} 50%, ${C.navyM} 100%)`, borderBottom: `1px solid ${C.border}`, padding: "16px 20px", position: "sticky", top: 0, zIndex: 50, backdropFilter: "blur(20px)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
            <div>
              <h1 style={{ margin: 0, fontFamily: "'Playfair Display',serif", fontSize: 22, fontWeight: 900, color: C.gold }}>EMAAR PROPERTIES</h1>
              <p style={{ margin: 0, fontSize: 10, color: C.grayL, letterSpacing: 2 }}>INTELLIGENCE DASHBOARD · FEB 2026 · DFM: EMAAR</p>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ background: C.navyL, borderRadius: 8, padding: "5px 10px", border: `1px solid ${C.border}` }}>
                <span style={{ color: C.grayL, fontSize: 9 }}>STOCK </span>
                <span style={{ color: C.gold, fontWeight: 700, fontSize: 13 }}>AED 17.05</span>
                <span style={{ color: C.tealL, fontSize: 10, marginLeft: 4 }}>▲ 2.75%</span>
              </div>
              <div style={{ background: C.navyL, borderRadius: 8, padding: "5px 10px", border: `1px solid ${C.border}` }}>
                <span style={{ color: C.grayL, fontSize: 9 }}>RATING </span>
                <span style={{ color: C.tealL, fontWeight: 700, fontSize: 11 }}>BBB+ / Baa1 / BBB</span>
              </div>
              <div style={{ background: C.navyL, borderRadius: 8, padding: "5px 10px", border: `1px solid ${C.border}` }}>
                <span style={{ color: C.grayL, fontSize: 9 }}>TARGET </span>
                <span style={{ color: C.goldL, fontWeight: 700, fontSize: 11 }}>AED 20.77 · STRONG BUY</span>
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 4, marginTop: 12, overflowX: "auto", paddingBottom: 2 }}>
            {TABS.map(t => (
              <button key={t} onClick={() => setTab(t)} style={{
                background: tab === t ? `linear-gradient(135deg, ${C.gold}, ${C.goldD})` : "transparent",
                color: tab === t ? C.navy : C.grayL, border: tab === t ? "none" : `1px solid rgba(100,116,139,0.25)`,
                borderRadius: 8, padding: "6px 14px", cursor: "pointer", fontSize: 11, fontWeight: 600, whiteSpace: "nowrap", transition: "all 0.2s",
              }}>{t}</button>
            ))}
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "0 20px 50px", position: "relative", zIndex: 1 }}>
        {tab === "Overview" && <>
          <SectionTitle sub="FY 2025 — All-Time Records Across Every Metric">Key Performance Indicators</SectionTitle>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10 }}>
            <KPICard label="Property Sales" value="AED 80.4B" sub="+16% YoY · USD 21.9B" />
            <KPICard label="Revenue" value="AED 49.6B" sub="+40% YoY · USD 13.5B" />
            <KPICard label="Net Profit" value="AED 25.7B" sub="+36% YoY · USD 7.0B" />
            <KPICard label="EBITDA" value="AED 25.6B" sub="+33% YoY · USD 7.0B" />
            <KPICard label="Backlog" value="AED 155B" sub="+39% YoY · 3-4yr visibility" />
            <KPICard label="Recurring Rev" value="AED 10.5B" sub="+13% · 32% of EBITDA" />
            <KPICard label="Units Delivered" value="79,000+" sub="Since 2002 · #1 in GCC" />
            <KPICard label="Land Bank" value="618M sqft" sub="344M UAE · AED 120B dev" />
          </div>
          <SectionTitle sub="Revenue contribution by business line">Segment Performance</SectionTitle>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <ChartBox title="Revenue by Segment (AED B)">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart><Pie data={segments} dataKey="revenue" nameKey="name" cx="50%" cy="50%" outerRadius={85} innerRadius={48} paddingAngle={3} stroke="none">
                  {segments.map((s, i) => <Cell key={i} fill={s.color} />)}
                </Pie><Tooltip content={<Tip />} /></PieChart>
              </ResponsiveContainer>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center" }}>
                {segments.map((s, i) => <span key={i} style={{ fontSize: 10, color: C.grayL, display: "flex", alignItems: "center", gap: 3 }}><span style={{ width: 7, height: 7, borderRadius: 2, background: s.color, display: "inline-block" }} />{s.name} ({s.revenue}B · {s.growth})</span>)}
              </div>
            </ChartBox>
            <ChartBox title="6-Year Revenue & Profit Trend (AED B)">
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={financials}>
                  <defs><linearGradient id="gR" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.gold} stopOpacity={0.3} /><stop offset="100%" stopColor={C.gold} stopOpacity={0} /></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="year" tick={{ fill: C.grayL, fontSize: 10 }} axisLine={false} />
                  <YAxis tick={{ fill: C.grayL, fontSize: 10 }} axisLine={false} />
                  <Tooltip content={<Tip />} />
                  <Area type="monotone" dataKey="revenue" stroke={C.gold} fill="url(#gR)" strokeWidth={2} name="Revenue" />
                  <Line type="monotone" dataKey="netProfit" stroke={C.teal} strokeWidth={2} dot={{ fill: C.teal, r: 3 }} name="Net Profit" />
                  <Line type="monotone" dataKey="ebitda" stroke={C.blue} strokeWidth={2} dot={{ fill: C.blue, r: 3 }} name="EBITDA" />
                </AreaChart>
              </ResponsiveContainer>
            </ChartBox>
          </div>
          <SectionTitle sub="Analyst consensus: STRONG BUY (12/12 analysts)">Company Profile</SectionTitle>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 10 }}>
            {[["Founded", "1997 by Mohamed Alabbar"], ["HQ & Listing", "Dubai, UAE · DFM: EMAAR"], ["Market Cap", "AED ~150B+ (USD 41B+)"], ["Credit Ratings", "S&P BBB+ ↑ · Moody's Baa1 · Fitch BBB"], ["Dividend 2025", "100% of capital · AED 8.9B · ~7.1% yield"], ["Iconic Assets", "Burj Khalifa · Dubai Mall · Address Hotels"], ["International", "Egypt, India, Saudi + 3 · +124% YoY"], ["ESG Rating", "MSCI 'A' (upgraded 2025)"]].map(([k, v], i) => (
              <div key={i} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 14px" }}>
                <span style={{ color: C.grayL, fontSize: 9, letterSpacing: 1, textTransform: "uppercase" }}>{k}</span>
                <p style={{ color: C.white, fontSize: 12, fontWeight: 500, margin: "3px 0 0" }}>{v}</p>
              </div>
            ))}
          </div>
        </>}

        {tab === "Financials" && <>
          <SectionTitle sub="Emaar IR, Annual Reports · AED Billions · 2020–2025">6-Year Financial History</SectionTitle>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <ChartBox title="Property Sales & Revenue Backlog (AED B)">
              <ResponsiveContainer width="100%" height={260}>
                <ComposedChart data={financials}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="year" tick={{ fill: C.grayL, fontSize: 10 }} axisLine={false} />
                  <YAxis tick={{ fill: C.grayL, fontSize: 10 }} axisLine={false} />
                  <Tooltip content={<Tip />} />
                  <Bar dataKey="propertySales" fill={C.gold} name="Property Sales" radius={[4, 4, 0, 0]} barSize={26} />
                  <Line type="monotone" dataKey="backlog" stroke={C.teal} strokeWidth={3} dot={{ fill: C.teal, r: 4 }} name="Backlog" />
                </ComposedChart>
              </ResponsiveContainer>
            </ChartBox>
            <ChartBox title="Margin Trends (%)">
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={financials}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="year" tick={{ fill: C.grayL, fontSize: 10 }} axisLine={false} />
                  <YAxis tick={{ fill: C.grayL, fontSize: 10 }} axisLine={false} />
                  <Tooltip content={<Tip />} />
                  <Line type="monotone" dataKey="gm" stroke={C.gold} strokeWidth={2} name="Gross Margin" dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="em" stroke={C.teal} strokeWidth={2} name="EBITDA Margin" dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="nm" stroke={C.blue} strokeWidth={2} name="Net Margin" dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </ChartBox>
            <ChartBox title="EPS & Dividend Per Share (AED)">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={financials}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="year" tick={{ fill: C.grayL, fontSize: 10 }} axisLine={false} />
                  <YAxis tick={{ fill: C.grayL, fontSize: 10 }} axisLine={false} />
                  <Tooltip content={<Tip />} />
                  <Bar dataKey="eps" fill={C.gold} name="EPS" radius={[4, 4, 0, 0]} barSize={22} />
                  <Bar dataKey="dividend" fill={C.teal} name="Dividend" radius={[4, 4, 0, 0]} barSize={22} />
                </BarChart>
              </ResponsiveContainer>
            </ChartBox>
            <ChartBox title="International Sales Growth (AED B) — CAGR 73%">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={financials}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="year" tick={{ fill: C.grayL, fontSize: 10 }} axisLine={false} />
                  <YAxis tick={{ fill: C.grayL, fontSize: 10 }} axisLine={false} />
                  <Tooltip content={<Tip />} />
                  <Bar dataKey="intlSales" fill={C.green} name="Intl Sales" radius={[4, 4, 0, 0]} barSize={30} />
                </BarChart>
              </ResponsiveContainer>
            </ChartBox>
          </div>
          <ChartBox title="Recurring Revenue — Mall + Hotel (AED B)">
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={financials}>
                <defs><linearGradient id="gM" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.gold} stopOpacity={0.4} /><stop offset="100%" stopColor={C.gold} stopOpacity={0} /></linearGradient><linearGradient id="gH" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.teal} stopOpacity={0.4} /><stop offset="100%" stopColor={C.teal} stopOpacity={0} /></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="year" tick={{ fill: C.grayL, fontSize: 10 }} axisLine={false} />
                <YAxis tick={{ fill: C.grayL, fontSize: 10 }} axisLine={false} />
                <Tooltip content={<Tip />} />
                <Area type="monotone" dataKey="mallRev" stroke={C.gold} fill="url(#gM)" name="Mall Revenue" stackId="1" />
                <Area type="monotone" dataKey="hotelRev" stroke={C.teal} fill="url(#gH)" name="Hotel Revenue" stackId="1" />
              </AreaChart>
            </ResponsiveContainer>
          </ChartBox>
        </>}

        {tab === "Portfolio" && <>
          <SectionTitle sub="48 active projects · 10+ master communities · 2026–2030">Project Portfolio</SectionTitle>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10, marginBottom: 16 }}>
            <KPICard label="Total Projects" value="48" sub="18 under construction · 30 off-plan" />
            <KPICard label="Branded Projects" value="10" sub="Address · Vida · Palace · Bristol" />
            <KPICard label="Avg Starting Price" value="AED 2.76M" sub="Range: 1.2M – 13.8M" />
            <KPICard label="Avg Price/sqft" value="AED 2,570" sub="Across all tiers" />
          </div>
          <ChartBox title="Projects by Community">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={communityProjects} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis type="number" tick={{ fill: C.grayL, fontSize: 10 }} axisLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: C.grayL, fontSize: 10 }} width={36} axisLine={false} />
                <Tooltip content={<Tip />} />
                <Bar dataKey="projects" fill={C.gold} name="Projects" radius={[0, 6, 6, 0]} barSize={18} />
              </BarChart>
            </ResponsiveContainer>
          </ChartBox>
          <SectionTitle sub="Handover timeline">Delivery Schedule</SectionTitle>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
            {[["2026", "7", C.tealL], ["2027", "5", C.gold], ["2028", "10", C.blue], ["2029", "26", C.purple]].map(([yr, ct, cl], i) => (
              <div key={i} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 14, textAlign: "center" }}>
                <div style={{ color: cl, fontSize: 26, fontWeight: 900, fontFamily: "'Playfair Display',serif" }}>{yr}</div>
                <div style={{ color: C.grayL, fontSize: 11 }}>{ct} projects</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 16, overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
              <thead><tr style={{ borderBottom: `1px solid ${C.border}` }}>
                {["Community", "Projects", "Yield Range", "Avg Price/sqft"].map(h => <th key={h} style={{ padding: "8px 10px", textAlign: "left", color: C.gold, fontWeight: 600, fontSize: 10 }}>{h}</th>)}
              </tr></thead>
              <tbody>{communityProjects.map((c, i) => (
                <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  <td style={{ padding: "8px 10px", color: C.white, fontWeight: 500 }}>{c.full}</td>
                  <td style={{ padding: "8px 10px", color: C.goldL }}>{c.projects}</td>
                  <td style={{ padding: "8px 10px", color: C.tealL }}>{c.yield}</td>
                  <td style={{ padding: "8px 10px", color: C.grayL }}>AED {c.ppsf}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </>}

        {tab === "Competitors" && <>
          <SectionTitle sub="DXBinteract verified · fam Properties analysis · Jan 2026">Dubai Developer Rankings — 2025</SectionTitle>
          <ChartBox title="Sales Value (AED Billions) — Emaar leads at AED 65.8B">
            <ResponsiveContainer width="100%" height={340}>
              <BarChart data={developers} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis type="number" tick={{ fill: C.grayL, fontSize: 10 }} axisLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: C.grayL, fontSize: 10 }} width={65} axisLine={false} />
                <Tooltip content={<Tip />} />
                <Bar dataKey="sales" name="Sales (AED B)" radius={[0, 6, 6, 0]} barSize={20}>
                  {developers.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartBox>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
            <ChartBox title="Units Sold (Volume)">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={developers} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis type="number" tick={{ fill: C.grayL, fontSize: 10 }} axisLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fill: C.grayL, fontSize: 10 }} width={65} axisLine={false} />
                  <Tooltip content={<Tip />} /><Bar dataKey="units" fill={C.teal} name="Units Sold" radius={[0, 4, 4, 0]} barSize={16} />
                </BarChart>
              </ResponsiveContainer>
            </ChartBox>
            <ChartBox title="Units Under Construction">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={developers} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis type="number" tick={{ fill: C.grayL, fontSize: 10 }} axisLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fill: C.grayL, fontSize: 10 }} width={65} axisLine={false} />
                  <Tooltip content={<Tip />} /><Bar dataKey="underConst" fill={C.blue} name="Under Const." radius={[0, 4, 4, 0]} barSize={16} />
                </BarChart>
              </ResponsiveContainer>
            </ChartBox>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10, marginTop: 12 }}>
            <KPICard label="Emaar % of Top 30" value="22.6%" sub="Dominant market leader" />
            <KPICard label="Lead vs #2" value="AED 29.9B" sub="1.83× larger than DAMAC" />
            <KPICard label="% of Dubai Total" value="9.6%" sub="Of AED 682.5B market" />
            <KPICard label="Delivered % Top 10" value="31%" sub="7,318 of 23,576 units" />
          </div>
        </>}

        {tab === "Yields" && <>
          <SectionTitle sub="DLD Rental Index, Bayut, Property Finder · Launch prices">Rental Yield Analysis</SectionTitle>
          <ChartBox title="Gross Yield by Community & Unit Type (%)">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={yields}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="label" tick={{ fill: C.grayL, fontSize: 9 }} axisLine={false} angle={-30} textAnchor="end" height={50} />
                <YAxis tick={{ fill: C.grayL, fontSize: 10 }} axisLine={false} domain={[0, 7]} />
                <Tooltip content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0].payload;
                  return <div style={{ background: C.navy, border: `1px solid ${C.gold}`, borderRadius: 8, padding: "8px 12px" }}>
                    <p style={{ color: C.gold, fontWeight: 700, margin: 0, fontSize: 12 }}>{d.community} — {d.label}</p>
                    <p style={{ color: C.white, margin: "3px 0 0", fontSize: 11 }}>Rent: AED {d.rent}K/yr · Price: AED {d.price}K</p>
                    <p style={{ color: C.tealL, margin: "2px 0 0", fontSize: 11 }}>Gross: {d.gross}% · Net: {d.net}% · {d.demand}</p>
                  </div>;
                }} />
                <Bar dataKey="gross" name="Gross Yield %" radius={[4, 4, 0, 0]} barSize={28}>
                  {yields.map((y, i) => <Cell key={i} fill={y.demand === "V.High" ? C.gold : y.demand === "High" ? C.teal : C.blue} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartBox>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10, marginTop: 12 }}>
            <KPICard label="Avg Gross Yield" value="4.5%" sub="Across all communities" />
            <KPICard label="Highest Yield" value="5.9%" sub="The Valley 3BR TH" />
            <KPICard label="Lowest Yield" value="3.6%" sub="Downtown 2BR Apt" />
            <KPICard label="Avg Cash Flow" value="AED 62K" sub="Annual per unit" />
          </div>
          <SectionTitle sub="Expected returns for Emaar off-plan investments">ROI Framework</SectionTitle>
          <ChartBox title="Return Range by Phase (%)">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={roiPhases}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="phase" tick={{ fill: C.grayL, fontSize: 10 }} axisLine={false} />
                <YAxis tick={{ fill: C.grayL, fontSize: 10 }} axisLine={false} />
                <Tooltip content={<Tip />} />
                <Bar dataKey="low" fill={C.teal} name="Low %" radius={[0, 0, 0, 0]} barSize={32} opacity={0.5} />
                <Bar dataKey="high" fill={C.gold} name="High %" radius={[4, 4, 0, 0]} barSize={32} opacity={0.8} />
              </BarChart>
            </ResponsiveContainer>
          </ChartBox>
        </>}

        {tab === "Risk" && <>
          <SectionTitle sub="Overall: LOW-MODERATE · Investment Grade · BBB+/Baa1/BBB">9-Factor Risk Assessment</SectionTitle>
          <ChartBox title="Risk Score by Factor (Higher = More Risk)">
            <ResponsiveContainer width="100%" height={340}>
              <BarChart data={risks} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis type="number" tick={{ fill: C.grayL, fontSize: 10 }} axisLine={false} domain={[0, 140]} />
                <YAxis type="category" dataKey="factor" tick={{ fill: C.grayL, fontSize: 10 }} width={105} axisLine={false} />
                <Tooltip content={<Tip />} />
                <Bar dataKey="score" name="Risk Score" radius={[0, 6, 6, 0]} barSize={20}>
                  {risks.map((r, i) => <Cell key={i} fill={r.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartBox>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginTop: 12 }}>
            <KPICard label="Avg Risk Score" value="38.3" sub="LOW-MODERATE overall" />
            <KPICard label="Highest Risk" value="125" sub="Premium Pricing" />
            <KPICard label="Lowest Risk" value="1" sub="Liquidity / Exit" />
          </div>
          <SectionTitle sub="How Emaar mitigates key risks">Mitigation Strategies</SectionTitle>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {[["Market Cycle", "AED 155B backlog = 3-4yr cushion. 35% recurring from malls/hotels."], ["Supply Competition", "Brand premium 20-40%. 79K delivery track record. 14+ master communities."], ["Premium Pricing", "80/20 payment plans reduce barrier. Branded residences justify premium."], ["Geographic Conc.", "+124% intl sales YoY. Expanding to Saudi, Egypt, India."]].map(([t, d], i) => (
              <div key={i} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 14 }}>
                <h4 style={{ color: C.gold, fontSize: 12, fontWeight: 600, margin: "0 0 4px" }}>{t}</h4>
                <p style={{ color: C.grayL, fontSize: 11, margin: 0, lineHeight: 1.5 }}>{d}</p>
              </div>
            ))}
          </div>
        </>}

        {tab === "Market" && <>
          <SectionTitle sub="Official DLD Data · 5th Consecutive Record Year">Dubai Real Estate — 2025</SectionTitle>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10 }}>
            {dubaiMarket.map((m, i) => <KPICard key={i} label={m.metric} value={m.val} sub={m.yoy} />)}
          </div>
          <SectionTitle sub="Knight Frank, CW Core, Fitch Ratings">2026 Outlook</SectionTitle>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            {[["Knight Frank", "+3% prime, ~1% mainstream. Transitioning to sustainable growth phase.", C.gold], ["CW Core", "5-8% appreciation forecast. Slowdown from 12-22% in 2024-25.", C.teal], ["Fitch Ratings", "Moderate correction possible. ~120K units in 2026 pipeline.", C.orange]].map(([f, v, cl], i) => (
              <div key={i} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 14, borderTop: `3px solid ${cl}` }}>
                <h4 style={{ color: cl, fontSize: 13, fontWeight: 700, margin: "0 0 6px", fontFamily: "'Playfair Display',serif" }}>{f}</h4>
                <p style={{ color: C.grayL, fontSize: 11, margin: 0, lineHeight: 1.5 }}>{v}</p>
              </div>
            ))}
          </div>
          <ChartBox title="Dubai Total Sales Value Growth (AED B)">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={dubaiSalesHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="year" tick={{ fill: C.grayL, fontSize: 10 }} axisLine={false} />
                <YAxis tick={{ fill: C.grayL, fontSize: 10 }} axisLine={false} />
                <Tooltip content={<Tip />} />
                <Bar dataKey="sales" name="Sales (AED B)" radius={[4, 4, 0, 0]} barSize={34}>
                  {[C.gray, C.grayL, C.teal, C.blue, C.gold, C.goldL].map((c, i) => <Cell key={i} fill={c} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartBox>
          <ChartBox title="Key Market Indicators">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
              {[["Population Target", "5.8M by 2040"], ["Price Cycle", "56+ months positive"], ["Developer Count", "228 active"], ["Units Launched", "131,504 in 2025"], ["Mortgage Txns", "50,974 deals"], ["2026 Pipeline", "~120K units"], ["Women Investors", "AED 154B"], ["REIDIN Growth", "+12.9% YoY"], ["Investor Base", "193.1K (+24%)"]].map(([k, v], i) => (
                <div key={i} style={{ padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  <span style={{ color: C.grayL, fontSize: 9, display: "block" }}>{k}</span>
                  <span style={{ color: C.white, fontSize: 12, fontWeight: 600 }}>{v}</span>
                </div>
              ))}
            </div>
          </ChartBox>
        </>}
      </main>

      <footer style={{ borderTop: `1px solid ${C.border}`, padding: 16, textAlign: "center" }}>
        <p style={{ color: C.gray, fontSize: 9, margin: 0 }}>Sources: Emaar IR, DLD, DXBinteract, Gulf News, Zawya, Knight Frank, CW Core, Fitch | Verified Feb 2026 | Not financial advice</p>
      </footer>
    </div>
  );
}
