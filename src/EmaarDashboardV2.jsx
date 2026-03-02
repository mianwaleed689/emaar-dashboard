import React, { useState, useEffect, useRef } from "react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, ComposedChart, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from "recharts";
import { auth, db } from "./firebase";
import { signInWithEmailAndPassword, onAuthStateChanged, signOut, sendPasswordResetEmail } from "firebase/auth";
import { collection, getDocs, orderBy, query } from "firebase/firestore";

import { T, emaarProjects, emaarFinancials, emaarCommunities, emaarYields, topDevelopers, emaarRisks, dubaiMarket, dubaiSalesHistory, roiPhases, emaarSegments, radarData, megaProjects } from "./data";

/* ─── DATA ALIASES (for backward compat) ─── */
const financials = emaarFinancials;
const segments = emaarSegments;
const risks = emaarRisks.map(r => ({ factor: r.factor, score: r.score, max: 150, color: r.color }));
const yields = emaarYields.map(y => ({ label: y.unit, community: y.community, rent: y.rent/1000, price: y.price/1000, gross: y.gross, net: y.net, demand: y.demand === "Very High" ? "V.High" : y.demand === "Moderate-High" ? "High" : y.demand }));
const developers = topDevelopers.map(d => ({ rank: d.rank, name: d.name.replace(" Properties","").replace(" Realty","").replace(" Development",""), sales: d.sales, units: d.units, delivered: d.delivered, underConst: d.underConst, color: d.color }));
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
};

const TABS = [
  { key: "Overview", icon: Icons.overview },
  { key: "Financials", icon: Icons.financials },
  { key: "Projects", icon: Icons.projects },
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
  }

  @media (max-width: 480px) {
    html { font-size: 12px; }
    .kpi-grid { grid-template-columns: 1fr !important; gap: 6px !important; }
    .chart-grid-4 { grid-template-columns: 1fr !important; }
    .header-badges { display: none !important; }
    .top-bar { padding: 0 12px !important; }
    .top-bar h1 { font-size: 13px !important; }
    .mobile-stock-bar { display: flex !important; }
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
            {resetSent && <div style={{ color: T.green, fontSize: 12, padding: "8px 12px", background: "rgba(16,185,129,0.08)", borderRadius: 8, border: "1px solid rgba(16,185,129,0.2)" }}>Password reset email sent! Check your inbox.</div>}

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", color: T.textSecondary, fontSize: 12 }}>
                <input type="checkbox" style={{ accentColor: T.gold }} /> Remember me
              </label>
              <a onClick={handleForgot} style={{ color: T.gold, fontSize: 12, textDecoration: "none", cursor: "pointer" }}>Forgot password?</a>
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
  const [authLoading, setAuthLoading] = useState(true);
  const [projectSearch, setProjectSearch] = useState("");
  const [projectFilter, setProjectFilter] = useState("All");
  const [liveProjects, setLiveProjects] = useState(null);

  // Load projects from Firestore
  useEffect(() => {
    const loadProjects = async () => {
      try {
        const snap = await getDocs(query(collection(db, "projects"), orderBy("id")));
        if (snap.size > 0) {
          setLiveProjects(snap.docs.map(d => d.data()));
        }
      } catch (e) { console.log("Firestore not available, using static data"); }
    };
    if (isLoggedIn) loadProjects();
  }, [isLoggedIn]);

  // Use Firestore data if available, otherwise fall back to hardcoded
  const activeProjects = liveProjects || emaarProjects;
  const [stock, setStock] = useState({ price: 17.05, change: 0.46, changePercent: 2.75, dayHigh: null, dayLow: null, volume: null, marketState: "LOADING", open: null });
  const [stockLive, setStockLive] = useState(false);

  // Listen to Firebase auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setIsLoggedIn(true);
        setUser(firebaseUser.email || "");
      } else {
        setIsLoggedIn(false);
        setUser("");
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

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
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

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
            <button onClick={() => { signOut(auth); }} style={{ background: "none", border: "none", cursor: "pointer", color: T.textMuted, padding: 4 }} title="Sign out">
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
          <div>
            <h1 style={{ fontSize: 16, fontWeight: 700, color: T.white }}>Emaar Properties <span style={{ color: T.textMuted, fontWeight: 400, fontSize: 13 }}>PJSC</span></h1>
            <p style={{ fontSize: 10, color: T.textMuted, letterSpacing: 1 }}>DFM: EMAAR · {stockLive ? <span style={{ color: T.green }}>Market {stock.marketState === "REGULAR" ? "Open" : stock.marketState === "PRE" ? "Pre-Market" : "Closed"}</span> : "Offline"} · {time.toLocaleDateString("en-AE", { day: "numeric", month: "short", year: "numeric" })}</p>
          </div>
        </div>
        <div className="header-badges" style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div style={{ background: T.surfaceAlt, borderRadius: 10, padding: "6px 12px", border: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: 6 }}>
            {stockLive && <span style={{ width: 6, height: 6, borderRadius: "50%", background: T.green, display: "inline-block", animation: "pulse 2s infinite" }} />}
            <span style={{ fontSize: 10, color: T.textMuted }}>{stockLive ? "LIVE" : "STOCK"}</span>
            <span style={{ fontFamily: "'Fraunces', serif", fontWeight: 700, fontSize: 14, color: T.gold }}>{stock.price.toFixed(2)}</span>
            <span style={{ color: stock.change >= 0 ? T.green : T.red, fontSize: 11, fontWeight: 600, display: "flex", alignItems: "center", gap: 2 }}>{stock.change >= 0 ? Icons.up : Icons.down} {Math.abs(stock.changePercent).toFixed(2)}%</span>
          </div>
          <div style={{ background: T.surfaceAlt, borderRadius: 10, padding: "6px 12px", border: `1px solid ${T.border}` }}>
            <span style={{ fontSize: 10, color: T.textMuted }}>RATING </span>
            <span style={{ fontSize: 12, fontWeight: 600, color: T.teal }}>BBB+ / Baa1</span>
          </div>
          <div style={{ background: T.surfaceAlt, borderRadius: 10, padding: "6px 12px", border: `1px solid ${T.border}` }}>
            <span style={{ fontSize: 10, color: T.textMuted }}>TARGET </span>
            <span style={{ fontSize: 12, fontWeight: 600, color: T.goldLight }}>AED 20.77</span>
          </div>
          {stock.dayHigh && <div style={{ background: T.surfaceAlt, borderRadius: 10, padding: "6px 12px", border: `1px solid ${T.border}` }}>
            <span style={{ fontSize: 10, color: T.textMuted }}>H/L </span>
            <span style={{ fontSize: 11, fontWeight: 600, color: T.textPrimary }}>{stock.dayHigh} / {stock.dayLow}</span>
          </div>}
          <button style={{ background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 10, padding: 8, cursor: "pointer", color: T.textSecondary, position: "relative" }}>
            {Icons.bell}
            <span style={{ position: "absolute", top: 4, right: 4, width: 7, height: 7, borderRadius: "50%", background: T.red }} />
          </button>
        </div>
      </header>

      {/* ─── MAIN CONTENT ─── */}
      <main className="main-content" style={{ marginLeft: 240, paddingTop: 60, minHeight: "100vh" }}>
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

          {/* ─── PROJECTS TAB (48 Projects from Excel) ─── */}
          {tab === "Projects" && <>
            <Section title="48 Active Projects" sub="Complete Emaar off-plan portfolio · 2026–2030 · Search & filter">
              <div className="kpi-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginTop: 16 }}>
                <KPI label="Total Projects" value="48" sub="18 under construction · 30 off-plan" delay={1} />
                <KPI label="Communities" value="11" sub="DHE · DCH · EBF · GPC + 7 more" delay={2} />
                <KPI label="Branded" value={`${activeProjects.filter(p=>p.branded).length}`} sub="Address · Vida · Palace · Bristol" delay={3} />
                <KPI label="Avg Construction" value={`${Math.round(activeProjects.reduce((a,p)=>a+p.construction,0)/activeProjects.length)}%`} sub="Weighted average progress" delay={4} />
              </div>
            </Section>

            {/* Search & Filters */}
            <div style={{ display: "flex", gap: 10, marginTop: 20, flexWrap: "wrap", alignItems: "center" }}>
              <div style={{ position: "relative", flex: "1 1 250px", maxWidth: 350 }}>
                <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: T.textMuted }}>{Icons.search}</span>
                <input value={projectSearch} onChange={e => setProjectSearch(e.target.value)} placeholder="Search projects..." style={{ width: "100%", padding: "10px 12px 10px 36px", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, color: T.textPrimary, fontSize: 13, fontFamily: "'Outfit', sans-serif", outline: "none" }} />
              </div>
              {["All", "DHE", "DCH", "EBF", "GPC", "ES", "TV", "RYM", "Branded"].map(f => (
                <button key={f} onClick={() => setProjectFilter(f)} style={{ padding: "7px 14px", borderRadius: 8, border: `1px solid ${projectFilter === f ? T.gold : T.border}`, background: projectFilter === f ? T.goldGlow : "transparent", color: projectFilter === f ? T.gold : T.textSecondary, fontSize: 12, fontWeight: 500, cursor: "pointer", fontFamily: "'Outfit', sans-serif", transition: "all 0.2s" }}>{f}</button>
              ))}
            </div>

            {/* Project Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 12, marginTop: 16 }}>
              {activeProjects
                .filter(p => {
                  const matchSearch = !projectSearch || p.name.toLowerCase().includes(projectSearch.toLowerCase()) || p.community.toLowerCase().includes(projectSearch.toLowerCase());
                  const matchFilter = projectFilter === "All" || p.district === projectFilter || (projectFilter === "Branded" && p.branded);
                  return matchSearch && matchFilter;
                })
                .map((p, i) => (
                <div key={p.id} className="chart-box fade-up" style={{ animationDelay: `${Math.min(i * 0.03, 0.5)}s`, padding: 0, overflow: "hidden" }}>
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
                      {Object.entries(p.units).filter(([,d]) => d.total > 0).map(([type, d]) => {
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
                  </div>{/* end padding wrapper */}
                </div>
              ))}
            </div>

            {/* Community Summary */}
            <Section title="Communities Overview" sub="11 master-planned communities">
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12, marginTop: 16 }}>
                {emaarCommunities.filter(c => c.name).map((c, i) => (
                  <div key={c.district} className="chart-box fade-up" style={{ animationDelay: `${i*0.05}s`, padding: 14 }}>
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
            <Section title="Mega Projects Pipeline" sub="Strategic developments 2026–2032">
              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 10, marginTop: 16 }}>
                {megaProjects.map((m, i) => (
                  <div key={m.name} className="chart-box fade-up" style={{ animationDelay: `${i*0.05}s`, padding: 16, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                    <div style={{ flex: "1 1 200px" }}>
                      <div style={{ fontFamily: "'Fraunces', serif", fontSize: 16, fontWeight: 700, color: T.gold }}>{m.name}</div>
                      <div style={{ fontSize: 11, color: T.textSecondary, marginTop: 2 }}>{m.community} · {m.type}</div>
                    </div>
                    <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
                      <div><span style={{ fontSize: 9, color: T.textMuted, display: "block" }}>VALUE</span><span style={{ fontSize: 14, fontWeight: 700, color: T.white }}>{m.value}</span></div>
                      <div><span style={{ fontSize: 9, color: T.textMuted, display: "block" }}>TIMELINE</span><span style={{ fontSize: 13, fontWeight: 600, color: T.teal }}>{m.timeline}</span></div>
                    </div>
                    <div style={{ fontSize: 11, color: T.textMuted, width: "100%" }}>{m.scale} · {m.feature}</div>
                  </div>
                ))}
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
