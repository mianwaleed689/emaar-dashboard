import React, { useState, useEffect, useRef } from "react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area,
  ComposedChart
} from "recharts";

/* ═══════════════════════════════════════════════════════════
   THEME
   ═══════════════════════════════════════════════════════════ */
const T = {
  bg: "#0B0E11", surface: "#12161C", card: "#1E2329", cardAlt: "#252930", cardHover: "#2B3139",
  gold: "#C9A84C", goldLight: "#E2C872", goldDim: "rgba(201,168,76,0.10)", goldBorder: "rgba(201,168,76,0.18)",
  teal: "#00C087", tealDim: "rgba(0,192,135,0.10)",
  blue: "#2196F3", blueDim: "rgba(33,150,243,0.10)",
  green: "#0ECB81", greenDim: "rgba(14,203,129,0.10)",
  red: "#F6465D", redDim: "rgba(246,70,93,0.10)",
  orange: "#FF9800", purple: "#AB47BC",
  text: "#EAECEF", textSecondary: "#848E9C", textMuted: "#5E6673",
  shadow: "0 2px 8px rgba(0,0,0,0.3)", r: 8, rSm: 6,
};

const DEV_COLORS = [T.gold, T.teal, T.blue, T.green, T.purple, T.orange, "#FF7043", "#42A5F5", "#AB47BC", T.textSecondary];
const RISK_COLORS = { "High": T.red, "Medium": T.orange, "Low": T.teal, "V.Low": T.green };
const SEG_COLORS = [T.gold, T.teal, T.blue, T.green];

/* ═══════════════════════════════════════════════════════════
   CSS & ICONS
   ═══════════════════════════════════════════════════════════ */
const globalCSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: transparent; } ::-webkit-scrollbar-thumb { background: ${T.cardAlt}; border-radius: 10px; }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
  @keyframes spin { to { transform: rotate(360deg); } }
  body { font-family: 'DM Sans', -apple-system, sans-serif; background: ${T.bg}; color: ${T.text}; overflow: hidden; -webkit-font-smoothing: antialiased; }
`;

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
  arrow: (up, c) => <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5"><path d={up ? "M18 15l-6-6-6 6" : "M6 9l6 6 6-6"}/></svg>,
};

const LogoIcon = () => (
  <svg width="32" height="32" viewBox="0 0 64 64">
    <defs><linearGradient id="lg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#E2C872"/><stop offset="100%" stopColor="#C9A84C"/></linearGradient></defs>
    <rect width="64" height="64" rx="14" fill={T.card}/>
    <rect x="12" y="36" width="8" height="20" rx="2" fill="url(#lg)" opacity="0.45"/>
    <rect x="23" y="26" width="8" height="30" rx="2" fill="url(#lg)" opacity="0.65"/>
    <rect x="34" y="16" width="8" height="40" rx="2" fill="url(#lg)" opacity="0.85"/>
    <rect x="45" y="8" width="8" height="48" rx="2" fill="url(#lg)"/>
  </svg>
);

const tabDefs = [
  { id: "overview", label: "Overview", icon: icons.overview },
  { id: "financials", label: "Financials", icon: icons.financial },
  { id: "portfolio", label: "Portfolio", icon: icons.portfolio },
  { id: "competitors", label: "Competitors", icon: icons.competitors },
  { id: "yields", label: "Yields", icon: icons.yields },
  { id: "risk", label: "Risk", icon: icons.risk },
  { id: "market", label: "Market", icon: icons.market },
];

/* ═══════════════════════════════════════════════════════════
   SHARED COMPONENTS
   ═══════════════════════════════════════════════════════════ */
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (<div style={{ background: T.card, borderRadius: T.rSm, padding: "10px 14px", boxShadow: T.shadow }}>
    <p style={{ color: T.gold, fontWeight: 600, fontSize: 12, marginBottom: 4 }}>{label}</p>
    {payload.map((p, i) => (<p key={i} style={{ color: p.color || T.text, fontSize: 11, lineHeight: 1.6 }}>{p.name}: <strong>{typeof p.value === "number" ? p.value.toLocaleString() : p.value}</strong></p>))}
  </div>);
};

const HeroStat = ({ label, value, change, changeColor, delay = 0 }) => (
  <div style={{ background: T.card, borderRadius: T.r, padding: "16px 14px", position: "relative", overflow: "hidden", animation: `fadeIn 0.4s ease ${delay}s both`, transition: "background 0.2s" }}
    onMouseEnter={e => e.currentTarget.style.background = T.cardHover} onMouseLeave={e => e.currentTarget.style.background = T.card}>
    <div style={{ position: "absolute", top: -25, right: -25, width: 60, height: 60, borderRadius: "50%", background: `radial-gradient(circle, ${T.goldDim} 0%, transparent 70%)` }} />
    <span style={{ color: T.textSecondary, fontSize: 10, letterSpacing: 1.5, textTransform: "uppercase", fontWeight: 500, display: "block", marginBottom: 6 }}>{label}</span>
    <span style={{ color: T.gold, fontSize: 22, fontWeight: 700, display: "block", lineHeight: 1.1 }}>{value}</span>
    {change && <span style={{ display: "inline-flex", alignItems: "center", gap: 3, marginTop: 6, fontSize: 11, fontWeight: 600, color: changeColor || T.teal }}>{icons.arrow(!changeColor || changeColor !== T.red, changeColor || T.teal)}{change}</span>}
  </div>
);

const StatCard = ({ label, value, change, changeColor, delay = 0 }) => (
  <div style={{ background: T.card, borderRadius: T.r, padding: "14px 12px", animation: `fadeIn 0.4s ease ${delay}s both`, transition: "background 0.2s" }}
    onMouseEnter={e => e.currentTarget.style.background = T.cardHover} onMouseLeave={e => e.currentTarget.style.background = T.card}>
    <span style={{ color: T.textSecondary, fontSize: 10, letterSpacing: 1.2, textTransform: "uppercase", fontWeight: 500, display: "block", marginBottom: 4 }}>{label}</span>
    <span style={{ color: T.text, fontSize: 18, fontWeight: 700, display: "block", lineHeight: 1.2 }}>{value}</span>
    {change && <span style={{ display: "inline-flex", alignItems: "center", gap: 3, marginTop: 4, fontSize: 10, fontWeight: 600, color: changeColor || T.teal }}>{icons.arrow(!changeColor || changeColor !== T.red, changeColor || T.teal)}{change}</span>}
  </div>
);

const SectionHeader = ({ title, subtitle, delay = 0 }) => (
  <div style={{ marginBottom: 12, marginTop: 28, animation: `fadeIn 0.3s ease ${delay}s both` }}>
    <h2 style={{ fontSize: 15, fontWeight: 600, color: T.text, display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ width: 3, height: 16, background: T.gold, borderRadius: 2, display: "inline-block" }} />{title}
    </h2>
    {subtitle && <p style={{ color: T.textMuted, fontSize: 11, marginTop: 2, marginLeft: 11 }}>{subtitle}</p>}
  </div>
);

const ChartBox = ({ title, children, delay = 0 }) => (
  <div style={{ background: T.card, borderRadius: T.r, padding: "16px", marginBottom: 10, animation: `fadeIn 0.4s ease ${delay}s both` }}>
    {title && <h3 style={{ fontSize: 12, fontWeight: 600, color: T.textSecondary, marginBottom: 12 }}>{title}</h3>}
    {children}
  </div>
);

/* ═══════════════════════════════════════════════════════════
   TAB COMPONENTS — Now receive data as props
   ═══════════════════════════════════════════════════════════ */
const OverviewTab = ({ data }) => {
  const { financials: fin, stock, segments, developers } = data;
  const latest = fin[fin.length - 1];
  const prev = fin[fin.length - 2];
  const revG = (((latest.revenue - prev.revenue) / prev.revenue) * 100).toFixed(1);
  const profG = (((latest.netProfit - prev.netProfit) / prev.netProfit) * 100).toFixed(1);
  const salesG = (((latest.propertySales - prev.propertySales) / prev.propertySales) * 100).toFixed(0);
  const backlogG = (((latest.backlog - prev.backlog) / prev.backlog) * 100).toFixed(0);

  return (<>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
      <HeroStat label="Property Sales" value={`AED ${latest.propertySales}B`} change={`+${salesG}% YoY`} delay={0} />
      <HeroStat label="Revenue" value={`AED ${latest.revenue}B`} change={`+${revG}%`} delay={0.03} />
      <HeroStat label="Net Profit" value={`AED ${latest.netProfit}B`} change={`+${profG}%`} delay={0.06} />
      <HeroStat label="Backlog" value={`AED ${latest.backlog}B`} change={`+${backlogG}%`} delay={0.09} />
      <HeroStat label="Stock Price" value={`AED ${stock.price}`} change={stock.rating} changeColor={T.teal} delay={0.12} />
      <HeroStat label="Developer Rank" value="#1 Dubai" change={`AED ${developers[0]?.sales}B`} delay={0.15} />
    </div>
    <SectionHeader title="Revenue & Profit Growth" subtitle={`FY ${fin[0].year} — FY ${latest.year} · AED Billions`} delay={0.15} />
    <ChartBox delay={0.18}>
      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={fin}>
          <defs>
            <linearGradient id="gGold" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={T.gold} stopOpacity={0.25}/><stop offset="100%" stopColor={T.gold} stopOpacity={0}/></linearGradient>
            <linearGradient id="gTeal" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={T.teal} stopOpacity={0.25}/><stop offset="100%" stopColor={T.teal} stopOpacity={0}/></linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
          <XAxis dataKey="year" tick={{ fill: T.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: T.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip content={<ChartTooltip />} />
          <Area type="monotone" dataKey="revenue" stroke={T.gold} fill="url(#gGold)" strokeWidth={2} name="Revenue" dot={{ r: 3, fill: T.gold, strokeWidth: 0 }} />
          <Area type="monotone" dataKey="netProfit" stroke={T.teal} fill="url(#gTeal)" strokeWidth={2} name="Net Profit" dot={{ r: 3, fill: T.teal, strokeWidth: 0 }} />
        </AreaChart>
      </ResponsiveContainer>
    </ChartBox>
    <SectionHeader title="Business Segments" subtitle={`FY ${latest.year} Revenue Breakdown`} delay={0.2} />
    <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 6 }}>
      {segments.map((s, i) => (
        <div key={i} style={{ background: T.card, borderRadius: T.r, padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", borderLeft: `3px solid ${SEG_COLORS[i] || T.textMuted}`, animation: `fadeIn 0.3s ease ${0.2 + i * 0.03}s both`, transition: "background 0.2s" }}
          onMouseEnter={e => e.currentTarget.style.background = T.cardHover} onMouseLeave={e => e.currentTarget.style.background = T.card}>
          <div><span style={{ color: T.textSecondary, fontSize: 11 }}>{s.name}</span><span style={{ color: T.text, fontSize: 17, fontWeight: 700, display: "block", marginTop: 2 }}>AED {s.revenue}B</span></div>
          <span style={{ background: T.tealDim, color: T.teal, fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 4 }}>+{s.growth}</span>
        </div>
      ))}
    </div>
    <SectionHeader title="Investment Snapshot" delay={0.3} />
    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
      <StatCard label="EPS" value={`AED ${latest.eps}`} change={`+${(((latest.eps - prev.eps) / prev.eps) * 100).toFixed(0)}%`} delay={0.3} />
      <StatCard label="Dividend" value={`AED ${latest.dividend}`} change="per share" delay={0.33} />
      <StatCard label="Analyst Target" value={`AED ${stock.target}`} change={`+${(((stock.target - stock.price) / stock.price) * 100).toFixed(0)}% upside`} delay={0.36} />
      <StatCard label="Credit Rating" value={stock.credit_rating} change="Inv. Grade" delay={0.39} />
      <StatCard label="Recurring Rev" value={`AED ${latest.recurringRev}B`} change={`+${(((latest.recurringRev - prev.recurringRev) / prev.recurringRev) * 100).toFixed(0)}%`} delay={0.42} />
      <StatCard label="Intl Sales" value={`AED ${latest.intlSales}B`} change={`+${(((latest.intlSales - prev.intlSales) / prev.intlSales) * 100).toFixed(0)}%`} delay={0.45} />
    </div>
  </>);
};

const FinancialsTab = ({ data }) => {
  const { financials: fin } = data;
  const latest = fin[fin.length - 1];
  const prev = fin[fin.length - 2];
  const marginData = fin.map(f => ({ year: f.year, gross: f.gm, ebitda: f.em, net: f.nm }));
  return (<>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
      <HeroStat label="Revenue" value={`AED ${latest.revenue}B`} change={`+${(((latest.revenue-prev.revenue)/prev.revenue)*100).toFixed(0)}%`} delay={0} />
      <HeroStat label="Gross Profit" value={`AED ${latest.grossProfit}B`} change={`+${(((latest.grossProfit-prev.grossProfit)/prev.grossProfit)*100).toFixed(0)}%`} delay={0.03} />
      <HeroStat label="EBITDA" value={`AED ${latest.ebitda}B`} change={`+${(((latest.ebitda-prev.ebitda)/prev.ebitda)*100).toFixed(0)}%`} delay={0.06} />
      <HeroStat label="Net Profit" value={`AED ${latest.netProfit}B`} change={`+${(((latest.netProfit-prev.netProfit)/prev.netProfit)*100).toFixed(0)}%`} delay={0.09} />
    </div>
    <SectionHeader title="Revenue Composition" subtitle="Stacked by stream · AED Billions" delay={0.1} />
    <ChartBox delay={0.13}>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={fin}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
          <XAxis dataKey="year" tick={{ fill: T.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: T.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip content={<ChartTooltip />} /><Legend wrapperStyle={{ fontSize: 10 }} />
          <Bar dataKey="recurringRev" name="Recurring" fill={T.teal} stackId="a" />
          <Bar dataKey="intlSales" name="International" fill={T.blue} stackId="a" />
          <Bar dataKey="mallRev" name="Malls" fill={T.green} stackId="a" />
          <Bar dataKey="hotelRev" name="Hotels" fill={T.purple} stackId="a" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartBox>
    <SectionHeader title="Margin Trends" subtitle="Profitability %" delay={0.2} />
    <ChartBox delay={0.23}>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={marginData}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
          <XAxis dataKey="year" tick={{ fill: T.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: T.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} unit="%" />
          <Tooltip content={<ChartTooltip />} /><Legend wrapperStyle={{ fontSize: 10 }} />
          <Line type="monotone" dataKey="gross" name="Gross" stroke={T.gold} strokeWidth={2} dot={{ r: 3, fill: T.gold, strokeWidth: 0 }} />
          <Line type="monotone" dataKey="ebitda" name="EBITDA" stroke={T.teal} strokeWidth={2} dot={{ r: 3, fill: T.teal, strokeWidth: 0 }} />
          <Line type="monotone" dataKey="net" name="Net" stroke={T.blue} strokeWidth={2} dot={{ r: 3, fill: T.blue, strokeWidth: 0 }} />
        </LineChart>
      </ResponsiveContainer>
    </ChartBox>
    <SectionHeader title="Sales & Backlog" delay={0.3} />
    <ChartBox delay={0.33}>
      <ResponsiveContainer width="100%" height={220}>
        <ComposedChart data={fin}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
          <XAxis dataKey="year" tick={{ fill: T.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: T.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip content={<ChartTooltip />} /><Legend wrapperStyle={{ fontSize: 10 }} />
          <Bar dataKey="propertySales" name="Property Sales" fill={T.gold} radius={[3, 3, 0, 0]} barSize={24} opacity={0.8} />
          <Line type="monotone" dataKey="backlog" name="Backlog" stroke={T.teal} strokeWidth={2} dot={{ r: 3, fill: T.teal, strokeWidth: 0 }} />
        </ComposedChart>
      </ResponsiveContainer>
    </ChartBox>
    <SectionHeader title="Shareholder Returns" delay={0.4} />
    <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 4 }}>
      {fin.map((f, i) => (
        <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: T.card, borderRadius: T.rSm, padding: "10px 14px", animation: `fadeIn 0.3s ease ${0.4 + i * 0.02}s both` }}>
          <span style={{ color: T.gold, fontWeight: 600, fontSize: 14 }}>{f.year}</span>
          <div style={{ display: "flex", gap: 24 }}>
            <div style={{ textAlign: "right" }}><span style={{ color: T.textMuted, fontSize: 9, display: "block", textTransform: "uppercase", letterSpacing: 1 }}>EPS</span><span style={{ color: T.text, fontWeight: 600, fontSize: 13 }}>{f.eps}</span></div>
            <div style={{ textAlign: "right" }}><span style={{ color: T.textMuted, fontSize: 9, display: "block", textTransform: "uppercase", letterSpacing: 1 }}>DPS</span><span style={{ color: T.teal, fontWeight: 600, fontSize: 13 }}>{f.dividend}</span></div>
          </div>
        </div>
      ))}
    </div>
  </>);
};

const PortfolioTab = ({ data }) => {
  const { communities, developers } = data;
  return (<>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
      <HeroStat label="Active Projects" value={`${communities.reduce((a,c) => a + c.projects, 0)}`} change={`${communities.length} communities`} delay={0} />
      <HeroStat label="Under Construction" value={developers[0]?.underConst?.toLocaleString()} change="Units" delay={0.03} />
      <HeroStat label="Delivered" value="79,000+" change="Since 2002" delay={0.06} />
      <HeroStat label="Communities" value="14+" change="Across Dubai" delay={0.09} />
    </div>
    <SectionHeader title="Community Breakdown" delay={0.12} />
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", animation: "fadeIn 0.4s ease 0.15s both" }}>
        <thead><tr>{["Community", "Proj.", "Yield", "AED/sqft"].map((h, i) => (<th key={i} style={{ textAlign: i > 0 ? "right" : "left", padding: "8px 10px", color: T.textMuted, fontSize: 10, letterSpacing: 1.2, textTransform: "uppercase", borderBottom: `1px solid ${T.cardAlt}`, fontWeight: 500 }}>{h}</th>))}</tr></thead>
        <tbody>{communities.map((c, i) => (
          <tr key={i} onMouseEnter={e => e.currentTarget.style.background = T.cardAlt} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
            <td style={{ padding: "10px", borderBottom: "1px solid rgba(255,255,255,0.03)" }}><span style={{ color: T.text, fontWeight: 500, fontSize: 12 }}>{c.full}</span><span style={{ color: T.textMuted, fontSize: 9, marginLeft: 6 }}>{c.name}</span></td>
            <td style={{ padding: "10px", textAlign: "right", color: T.gold, fontWeight: 700, fontSize: 14, borderBottom: "1px solid rgba(255,255,255,0.03)" }}>{c.projects}</td>
            <td style={{ padding: "10px", textAlign: "right", color: T.teal, fontWeight: 600, fontSize: 12, borderBottom: "1px solid rgba(255,255,255,0.03)" }}>{c.yield}</td>
            <td style={{ padding: "10px", textAlign: "right", color: T.textSecondary, fontSize: 12, borderBottom: "1px solid rgba(255,255,255,0.03)" }}>{c.ppsf}</td>
          </tr>))}</tbody>
      </table>
    </div>
    <SectionHeader title="Projects per Community" delay={0.25} />
    <ChartBox delay={0.28}>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={communities}><CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" /><XAxis dataKey="name" tick={{ fill: T.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} /><YAxis tick={{ fill: T.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} /><Tooltip content={<ChartTooltip />} />
          <Bar dataKey="projects" name="Projects" radius={[4, 4, 0, 0]} barSize={28}>{communities.map((_, i) => <Cell key={i} fill={DEV_COLORS[i % DEV_COLORS.length]} />)}</Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartBox>
  </>);
};

const CompetitorsTab = ({ data }) => {
  const devs = data.developers.map((d, i) => ({ ...d, color: DEV_COLORS[i] }));
  return (<>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
      <HeroStat label="Emaar Sales" value={`AED ${devs[0]?.sales}B`} change="#1 in Dubai" delay={0} />
      <HeroStat label="Market Share" value="~30%" change="By value" delay={0.03} />
      <HeroStat label="Lead Over #2" value={`+${(((devs[0]?.sales - devs[1]?.sales) / devs[1]?.sales) * 100).toFixed(0)}%`} change={`vs ${devs[1]?.name}`} delay={0.06} />
      <HeroStat label="Units Sold" value={devs[0]?.units?.toLocaleString()} change={`FY ${data.financials[data.financials.length-1].year}`} delay={0.09} />
    </div>
    <SectionHeader title="Developer Rankings" subtitle="Top 10 by Sales Value" delay={0.12} />
    <ChartBox delay={0.15}>
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={devs} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" /><XAxis type="number" tick={{ fill: T.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} /><YAxis type="category" dataKey="name" tick={{ fill: T.textSecondary, fontSize: 11 }} width={60} axisLine={false} tickLine={false} /><Tooltip content={<ChartTooltip />} />
          <Bar dataKey="sales" name="Sales (AED B)" radius={[0, 4, 4, 0]} barSize={18}>{devs.map((d, i) => <Cell key={i} fill={d.color} />)}</Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartBox>
    <SectionHeader title="Detail Table" delay={0.25} />
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", animation: "fadeIn 0.4s ease 0.28s both" }}>
        <thead><tr>{["#", "Developer", "Sales", "Units", "Deliv.", "Pipeline"].map((h, i) => (<th key={i} style={{ textAlign: i > 1 ? "right" : "left", padding: "8px 8px", color: T.textMuted, fontSize: 9, letterSpacing: 1, textTransform: "uppercase", borderBottom: `1px solid ${T.cardAlt}`, fontWeight: 500 }}>{h}</th>))}</tr></thead>
        <tbody>{devs.map((d, i) => (
          <tr key={i} style={{ background: i === 0 ? T.goldDim : "transparent" }} onMouseEnter={e => { if (i !== 0) e.currentTarget.style.background = T.cardAlt; }} onMouseLeave={e => { if (i !== 0) e.currentTarget.style.background = "transparent"; }}>
            <td style={{ padding: "8px", color: d.color, fontWeight: 700, fontSize: 12, borderBottom: "1px solid rgba(255,255,255,0.03)" }}>{d.rank}</td>
            <td style={{ padding: "8px", color: i === 0 ? T.gold : T.text, fontWeight: i === 0 ? 700 : 400, fontSize: 12, borderBottom: "1px solid rgba(255,255,255,0.03)" }}>{d.name}</td>
            <td style={{ padding: "8px", color: T.text, fontWeight: 600, fontSize: 12, textAlign: "right", borderBottom: "1px solid rgba(255,255,255,0.03)" }}>{d.sales}B</td>
            <td style={{ padding: "8px", color: T.textSecondary, textAlign: "right", fontSize: 11, borderBottom: "1px solid rgba(255,255,255,0.03)" }}>{d.units?.toLocaleString()}</td>
            <td style={{ padding: "8px", color: T.teal, textAlign: "right", fontSize: 11, borderBottom: "1px solid rgba(255,255,255,0.03)" }}>{d.delivered?.toLocaleString()}</td>
            <td style={{ padding: "8px", color: T.textMuted, textAlign: "right", fontSize: 11, borderBottom: "1px solid rgba(255,255,255,0.03)" }}>{d.underConst?.toLocaleString()}</td>
          </tr>))}</tbody>
      </table>
    </div>
  </>);
};

const YieldsTab = ({ data }) => {
  const { yields: yds, roiPhases } = data;
  return (<>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
      <HeroStat label="Avg Gross Yield" value={`${(yds.reduce((a,y)=>a+y.gross,0)/yds.length).toFixed(1)}%`} change="All communities" delay={0} />
      <HeroStat label="Highest Yield" value={`${Math.max(...yds.map(y=>y.gross))}%`} change={yds.find(y=>y.gross===Math.max(...yds.map(y=>y.gross)))?.label} delay={0.03} />
      <HeroStat label="Lowest Yield" value={`${Math.min(...yds.map(y=>y.gross))}%`} change={yds.find(y=>y.gross===Math.min(...yds.map(y=>y.gross)))?.label} delay={0.06} />
      <HeroStat label="Avg Cash Flow" value="AED 62K" change="Annual / unit" delay={0.09} />
    </div>
    <SectionHeader title="Rental Yield Analysis" delay={0.12} />
    <ChartBox delay={0.15}>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={yds}><CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" /><XAxis dataKey="label" tick={{ fill: T.textMuted, fontSize: 9 }} axisLine={false} tickLine={false} /><YAxis tick={{ fill: T.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} unit="%" />
          <Tooltip content={({ active, payload }) => { if (!active || !payload?.length) return null; const d = payload[0]?.payload; return (<div style={{ background: T.card, borderRadius: T.rSm, padding: "10px 14px", boxShadow: T.shadow }}><p style={{ color: T.gold, fontWeight: 600, fontSize: 12, marginBottom: 4 }}>{d.community} — {d.label}</p><p style={{ color: T.text, fontSize: 11 }}>Rent: AED {d.rent}K/yr · Price: AED {d.price}K</p><p style={{ color: T.teal, fontSize: 11, marginTop: 2 }}>Gross: {d.gross}% · Net: {d.net}% · {d.demand}</p></div>); }} />
          <Bar dataKey="gross" name="Gross Yield %" radius={[4, 4, 0, 0]} barSize={24}>{yds.map((y, i) => <Cell key={i} fill={y.demand === "V.High" ? T.gold : y.demand === "High" ? T.teal : T.blue} />)}</Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartBox>
    <SectionHeader title="Yield Detail" delay={0.25} />
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", animation: "fadeIn 0.4s ease 0.28s both" }}>
        <thead><tr>{["Unit", "Area", "Rent", "Price", "Gross", "Net", "Demand"].map((h, i) => (<th key={i} style={{ textAlign: i > 1 ? "right" : "left", padding: "8px 6px", color: T.textMuted, fontSize: 9, letterSpacing: 1, textTransform: "uppercase", borderBottom: `1px solid ${T.cardAlt}`, fontWeight: 500 }}>{h}</th>))}</tr></thead>
        <tbody>{yds.map((y, i) => (
          <tr key={i} onMouseEnter={e => e.currentTarget.style.background = T.cardAlt} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
            <td style={{ padding: "8px 6px", color: T.text, fontWeight: 500, fontSize: 11, borderBottom: "1px solid rgba(255,255,255,0.03)" }}>{y.label}</td>
            <td style={{ padding: "8px 6px", color: T.textSecondary, fontSize: 10, borderBottom: "1px solid rgba(255,255,255,0.03)" }}>{y.community}</td>
            <td style={{ padding: "8px 6px", color: T.text, textAlign: "right", fontSize: 11, borderBottom: "1px solid rgba(255,255,255,0.03)" }}>{y.rent}K</td>
            <td style={{ padding: "8px 6px", color: T.text, textAlign: "right", fontSize: 11, borderBottom: "1px solid rgba(255,255,255,0.03)" }}>{y.price?.toLocaleString()}K</td>
            <td style={{ padding: "8px 6px", color: T.gold, fontWeight: 600, textAlign: "right", fontSize: 12, borderBottom: "1px solid rgba(255,255,255,0.03)" }}>{y.gross}%</td>
            <td style={{ padding: "8px 6px", color: T.teal, fontWeight: 600, textAlign: "right", fontSize: 12, borderBottom: "1px solid rgba(255,255,255,0.03)" }}>{y.net}%</td>
            <td style={{ padding: "8px 6px", textAlign: "right", borderBottom: "1px solid rgba(255,255,255,0.03)" }}><span style={{ background: y.demand === "V.High" ? T.goldDim : y.demand === "High" ? T.tealDim : T.blueDim, color: y.demand === "V.High" ? T.gold : y.demand === "High" ? T.teal : T.blue, fontSize: 9, fontWeight: 600, padding: "2px 6px", borderRadius: 3 }}>{y.demand}</span></td>
          </tr>))}</tbody>
      </table>
    </div>
    <SectionHeader title="ROI Framework" delay={0.35} />
    <ChartBox delay={0.38}>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={roiPhases}><CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" /><XAxis dataKey="phase" tick={{ fill: T.textMuted, fontSize: 9 }} axisLine={false} tickLine={false} /><YAxis tick={{ fill: T.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} unit="%" /><Tooltip content={<ChartTooltip />} /><Legend wrapperStyle={{ fontSize: 10 }} />
          <Bar dataKey="low" fill={T.teal} name="Low %" barSize={22} opacity={0.5} /><Bar dataKey="high" fill={T.gold} name="High %" radius={[4, 4, 0, 0]} barSize={22} opacity={0.85} />
        </BarChart>
      </ResponsiveContainer>
    </ChartBox>
  </>);
};

const RiskTab = ({ data }) => {
  const rks = data.risks.map(r => ({ ...r, color: RISK_COLORS[r.level] || T.textMuted }));
  return (<>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
      <HeroStat label="Overall Risk" value="LOW-MOD" change="Investment Grade" delay={0} />
      <HeroStat label="Avg Score" value={(rks.reduce((a,r)=>a+r.score,0)/rks.length).toFixed(1)} change="Out of 200" delay={0.03} />
      <HeroStat label="Credit Rating" value={data.stock.credit_rating} change={data.stock.credit_agency} delay={0.06} />
      <HeroStat label="Highest Risk" value={rks[0]?.score} change={rks[0]?.factor} changeColor={T.red} delay={0.09} />
    </div>
    <SectionHeader title="9-Factor Risk Assessment" subtitle="Higher = More Risk" delay={0.12} />
    <ChartBox delay={0.15}>
      <ResponsiveContainer width="100%" height={340}>
        <BarChart data={rks} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" /><XAxis type="number" tick={{ fill: T.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 140]} /><YAxis type="category" dataKey="factor" tick={{ fill: T.textSecondary, fontSize: 10 }} width={100} axisLine={false} tickLine={false} /><Tooltip content={<ChartTooltip />} />
          <Bar dataKey="score" name="Risk Score" radius={[0, 4, 4, 0]} barSize={16}>{rks.map((r, i) => <Cell key={i} fill={r.color} />)}</Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartBox>
    <SectionHeader title="Mitigation" delay={0.25} />
    <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 6 }}>
      {[["Market Cycle", "AED 155B backlog = 3-4yr cushion. 35% recurring from malls & hotels.", T.orange],["Supply Competition", "Brand premium 20-40%. 79K delivery track record. 14+ communities.", T.orange],["Premium Pricing", "80/20 payment plans. Branded residences justify premium.", T.red],["Geographic Conc.", "Intl sales grew +124% YoY. Expanding to Saudi, Egypt, India.", T.gold]
      ].map(([title, desc, color], i) => (
        <div key={i} style={{ background: T.card, borderRadius: T.r, padding: "14px", borderLeft: `3px solid ${color}`, animation: `fadeIn 0.3s ease ${0.25 + i * 0.03}s both` }}>
          <span style={{ color: T.text, fontWeight: 600, fontSize: 12 }}>{title}</span>
          <p style={{ color: T.textSecondary, fontSize: 11, lineHeight: 1.6, marginTop: 4 }}>{desc}</p>
        </div>
      ))}
    </div>
  </>);
};

const MarketTab = ({ data }) => {
  const { dubaiMarket: mkt } = data;
  return (<>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
      {mkt.stats.map((m, i) => <HeroStat key={i} label={m.metric} value={m.val} change={m.yoy} delay={i * 0.03} />)}
    </div>
    <SectionHeader title="Dubai Sales Growth" subtitle="Total market · AED Billions" delay={0.15} />
    <ChartBox delay={0.18}>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={mkt.salesHistory}><CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" /><XAxis dataKey="year" tick={{ fill: T.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} /><YAxis tick={{ fill: T.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} /><Tooltip content={<ChartTooltip />} />
          <Bar dataKey="sales" name="Sales (AED B)" radius={[4, 4, 0, 0]} barSize={32}>{mkt.salesHistory.map((_, i) => <Cell key={i} fill={i === mkt.salesHistory.length - 1 ? T.gold : `rgba(201,168,76,${0.2 + (i * 0.13)})`} />)}</Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartBox>
    <SectionHeader title="2026 Outlook" delay={0.25} />
    <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 6 }}>
      {[["Knight Frank", "+3% prime, ~1% mainstream. Sustainable growth phase.", T.gold],["CW Core", "5-8% appreciation. Slowdown from 12-22% in 2024-25.", T.teal],["Fitch Ratings", "Moderate correction possible. ~120K units in 2026 pipeline.", T.orange]
      ].map(([firm, view, color], i) => (
        <div key={i} style={{ background: T.card, borderRadius: T.r, padding: "14px", borderLeft: `3px solid ${color}`, animation: `fadeIn 0.3s ease ${0.28 + i * 0.03}s both` }}>
          <span style={{ color, fontWeight: 600, fontSize: 13 }}>{firm}</span>
          <p style={{ color: T.textSecondary, fontSize: 11, lineHeight: 1.6, marginTop: 4 }}>{view}</p>
        </div>
      ))}
    </div>
    <SectionHeader title="Market Indicators" delay={0.35} />
    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 6 }}>
      {mkt.indicators.map(([k, v], i) => (
        <div key={i} style={{ background: T.card, borderRadius: T.rSm, padding: "10px 12px", animation: `fadeIn 0.3s ease ${0.38 + i * 0.02}s both`, transition: "background 0.2s" }}
          onMouseEnter={e => e.currentTarget.style.background = T.cardHover} onMouseLeave={e => e.currentTarget.style.background = T.card}>
          <span style={{ color: T.textMuted, fontSize: 9, letterSpacing: 1, textTransform: "uppercase", display: "block", marginBottom: 2 }}>{k}</span>
          <span style={{ color: T.text, fontSize: 14, fontWeight: 600 }}>{v}</span>
        </div>
      ))}
    </div>
  </>);
};

/* ═══════════════════════════════════════════════════════════
   LOADING SCREEN
   ═══════════════════════════════════════════════════════════ */
const LoadingScreen = () => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh", width: "100vw", background: T.bg }}>
    <LogoIcon />
    <h1 style={{ fontSize: 20, fontWeight: 700, color: T.text, marginTop: 16 }}><span>DXB</span><span style={{ color: T.gold, marginLeft: 6 }}>Analytics</span></h1>
    <div style={{ width: 24, height: 24, border: `2px solid ${T.cardAlt}`, borderTopColor: T.gold, borderRadius: "50%", animation: "spin 0.8s linear infinite", marginTop: 20 }} />
    <p style={{ color: T.textMuted, fontSize: 11, marginTop: 12 }}>Loading market data...</p>
  </div>
);

/* ═══════════════════════════════════════════════════════════
   MAIN APP
   ═══════════════════════════════════════════════════════════ */
export default function EmaarDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [data, setData] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [loadError, setLoadError] = useState(false);
  const contentRef = useRef(null);

  // FETCH DATA FROM JSON
  useEffect(() => {
    fetch("/data/emaar.json")
      .then(r => { if (!r.ok) throw new Error("Failed"); return r.json(); })
      .then(d => {
        setData(d);
        setLastUpdated(d.meta?.last_updated ? new Date(d.meta.last_updated).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "Unknown");
      })
      .catch(() => setLoadError(true));
  }, []);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check(); window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => { if (contentRef.current) contentRef.current.scrollTo({ top: 0, behavior: "smooth" }); }, [activeTab]);

  const handleTab = (id) => { setActiveTab(id); setSidebarOpen(false); };

  // LOADING STATE
  if (!data && !loadError) return <><style>{globalCSS}</style><LoadingScreen /></>;

  // ERROR STATE
  if (loadError) return (
    <><style>{globalCSS}</style>
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh", background: T.bg }}>
      <LogoIcon />
      <h1 style={{ color: T.text, fontSize: 18, marginTop: 16 }}>DXB <span style={{ color: T.gold }}>Analytics</span></h1>
      <p style={{ color: T.red, fontSize: 13, marginTop: 12 }}>Failed to load data</p>
      <p style={{ color: T.textMuted, fontSize: 11, marginTop: 4 }}>Check that /public/data/emaar.json exists</p>
      <button onClick={() => window.location.reload()} style={{ marginTop: 16, background: T.gold, color: T.bg, border: "none", borderRadius: T.rSm, padding: "8px 20px", fontWeight: 600, cursor: "pointer", fontSize: 12 }}>Retry</button>
    </div></>
  );

  const renderTab = () => {
    switch (activeTab) {
      case "overview": return <OverviewTab data={data} />;
      case "financials": return <FinancialsTab data={data} />;
      case "portfolio": return <PortfolioTab data={data} />;
      case "competitors": return <CompetitorsTab data={data} />;
      case "yields": return <YieldsTab data={data} />;
      case "risk": return <RiskTab data={data} />;
      case "market": return <MarketTab data={data} />;
      default: return <OverviewTab data={data} />;
    }
  };

  return (<>
    <style>{globalCSS}</style>
    <div style={{ display: "flex", height: "100vh", width: "100vw", background: T.bg, overflow: "hidden", fontFamily: "'DM Sans', sans-serif" }}>
      <aside style={{ width: 220, minWidth: 220, height: "100vh", background: T.surface, display: "flex", flexDirection: "column", zIndex: 100, transition: "transform 0.25s ease", position: isMobile ? "fixed" : "relative", transform: isMobile && !sidebarOpen ? "translateX(-100%)" : "translateX(0)" }}>
        <div style={{ padding: "20px 16px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <LogoIcon />
            <div>
              <h1 style={{ fontSize: 15, fontWeight: 700, color: T.text, lineHeight: 1.1 }}><span>DXB</span><span style={{ color: T.gold, marginLeft: 4 }}>Analytics</span></h1>
              <span style={{ fontSize: 9, color: T.textMuted, letterSpacing: 1.5, textTransform: "uppercase" }}>Dubai Real Estate Intel</span>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 12, padding: "5px 8px", background: T.tealDim, borderRadius: 4 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: T.teal, display: "inline-block", animation: "pulse 2s infinite" }} />
            <span style={{ color: T.teal, fontSize: 9, fontWeight: 600, letterSpacing: 0.5 }}>LIVE · {lastUpdated || "Loading..."}</span>
          </div>
        </div>
        <div style={{ padding: "0 16px 12px" }}>
          <div style={{ background: T.goldDim, borderRadius: T.rSm, padding: "8px 10px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div><span style={{ color: T.textMuted, fontSize: 8, textTransform: "uppercase", letterSpacing: 1, display: "block" }}>Viewing</span><span style={{ color: T.gold, fontSize: 12, fontWeight: 700 }}>{data.meta?.developer || "Emaar Properties"}</span></div>
            <span style={{ color: T.textMuted, fontSize: 9, background: T.cardAlt, padding: "2px 6px", borderRadius: 3 }}>PJSC</span>
          </div>
        </div>
        <nav style={{ flex: 1, padding: "4px 8px", overflowY: "auto" }}>
          <span style={{ color: T.textMuted, fontSize: 9, letterSpacing: 2, textTransform: "uppercase", padding: "0 8px", display: "block", marginBottom: 6 }}>Navigation</span>
          {tabDefs.map((t) => {
            const active = activeTab === t.id;
            return (<button key={t.id} onClick={() => handleTab(t.id)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "9px 10px", marginBottom: 1, background: active ? T.goldDim : "transparent", border: "none", borderRadius: T.rSm, cursor: "pointer", transition: "background 0.15s" }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.background = T.cardAlt; }} onMouseLeave={e => { if (!active) e.currentTarget.style.background = active ? T.goldDim : "transparent"; }}>
              {t.icon(active ? T.gold : T.textMuted)}<span style={{ color: active ? T.gold : T.textSecondary, fontSize: 12, fontWeight: active ? 600 : 400 }}>{t.label}</span>
            </button>);
          })}
        </nav>
        <div style={{ padding: "12px 16px", borderTop: `1px solid ${T.cardAlt}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 2 }}><span style={{ color: T.textMuted, fontSize: 9 }}>EMAAR:DFM</span><span style={{ color: T.gold, fontWeight: 700, fontSize: 12 }}>{data.stock.price}</span></div>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ color: T.textMuted, fontSize: 9 }}>Target:</span><span style={{ color: T.teal, fontWeight: 600, fontSize: 11 }}>{data.stock.target}</span><span style={{ background: T.tealDim, color: T.teal, fontSize: 8, fontWeight: 700, padding: "1px 5px", borderRadius: 3 }}>BUY</span></div>
          <p style={{ color: T.textMuted, fontSize: 8, marginTop: 6 }}>Not financial advice · DXB Analytics</p>
        </div>
      </aside>
      {sidebarOpen && isMobile && <div onClick={() => setSidebarOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 99 }} />}
      <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px", background: T.surface, minHeight: 48 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {isMobile && <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background: "none", border: "none", cursor: "pointer", padding: 2, display: "flex" }}>{sidebarOpen ? icons.close(T.textSecondary) : icons.menu(T.textSecondary)}</button>}
            <h2 style={{ fontSize: 16, fontWeight: 600, color: T.text }}>{tabDefs.find(t => t.id === activeTab)?.label}</h2>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {!isMobile && <span style={{ color: T.textMuted, fontSize: 11 }}>Emaar Properties PJSC · DFM</span>}
            <div style={{ width: 28, height: 28, borderRadius: T.rSm, background: T.goldDim, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: T.gold }}>W</div>
          </div>
        </header>
        <div ref={contentRef} style={{ flex: 1, overflowY: "auto", padding: "16px 16px 48px" }}>
          {renderTab()}
          <div style={{ marginTop: 32, paddingTop: 12, borderTop: `1px solid ${T.cardAlt}`, textAlign: "center" }}>
            <p style={{ color: T.textMuted, fontSize: 9, lineHeight: 1.5 }}>Sources: Emaar IR · DLD · DXBinteract · Yahoo Finance · Knight Frank · CW Core · Fitch</p>
            <p style={{ color: T.textMuted, fontSize: 8, marginTop: 2 }}>Last updated: {lastUpdated} · Not financial advice · DXB Analytics by The Address Holding</p>
          </div>
        </div>
      </main>
    </div>
  </>);
}
