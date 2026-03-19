/* ─── DXB ANALYTICS — LANDING PAGE v3.0 ───────────────────────────────────
   Research-backed redesign:
   • Outcome-focused headline under 8 words
   • Product mockup visible within 3 seconds
   • Role-based value props (agent/investor/brokerage)
   • Social proof with specific numbers
   • Before → After story arc
   • Mobile-first
   • Frictionless signup
   ─────────────────────────────────────────────────────────────────────── */
import React, { useState, useEffect } from "react";
import { db } from "./firebase";
import { collection, onSnapshot, query, where } from "firebase/firestore";

const T = {
  bg: "#04090F", surface: "#0A1628", surfaceAlt: "#0E1D35", card: "#0D1B30",
  gold: "#D4A843", goldLight: "#E8C96A", goldGlow: "rgba(212,168,67,0.12)",
  goldMuted: "rgba(212,168,67,0.08)", teal: "#00BFA5", white: "#FFFFFF",
  textPrimary: "#E2E8F0", textSecondary: "#94A3B8", textMuted: "#64748B",
  border: "rgba(212,168,67,0.12)", red: "#EF4444", green: "#10B981", blue: "#3B82F6",
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=Fraunces:opsz,wght@9..144,400;9..144,700;9..144,900&display=swap');
  *{margin:0;padding:0;box-sizing:border-box}
  body{background:${T.bg};overflow-x:hidden;font-family:'Outfit',sans-serif}
  @keyframes fadeUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
  @keyframes pulse{0%,100%{opacity:.5}50%{opacity:1}}
  @keyframes ticker{from{transform:translateX(0)}to{transform:translateX(-50%)}}
  @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
  @keyframes shimmer{0%{background-position:-200% center}100%{background-position:200% center}}
  @keyframes glow{0%,100%{box-shadow:0 0 20px rgba(212,168,67,0.15)}50%{box-shadow:0 0 40px rgba(212,168,67,0.35)}}

  .hero-glow{position:absolute;top:-200px;left:50%;transform:translateX(-50%);width:900px;height:700px;border-radius:50%;background:radial-gradient(ellipse,rgba(212,168,67,0.07) 0%,transparent 70%);pointer-events:none}
  .grid-bg{position:absolute;inset:0;opacity:.025;background-image:linear-gradient(rgba(212,168,67,.4) 1px,transparent 1px),linear-gradient(90deg,rgba(212,168,67,.4) 1px,transparent 1px);background-size:60px 60px;pointer-events:none}

  .cta-primary{display:inline-flex;align-items:center;gap:8px;padding:15px 36px;background:linear-gradient(135deg,${T.gold},${T.goldLight});color:${T.bg};border:none;border-radius:12px;font-family:'Outfit',sans-serif;font-size:15px;font-weight:700;cursor:pointer;transition:all .3s;text-decoration:none}
  .cta-primary:hover{transform:translateY(-2px);box-shadow:0 10px 30px rgba(212,168,67,.4);animation:glow 2s infinite}
  .cta-outline{display:inline-flex;align-items:center;gap:8px;padding:15px 32px;background:transparent;color:${T.gold};border:1.5px solid ${T.gold};border-radius:12px;font-family:'Outfit',sans-serif;font-size:15px;font-weight:600;cursor:pointer;transition:all .3s;text-decoration:none}
  .cta-outline:hover{background:rgba(212,168,67,.1);transform:translateY(-2px)}

  .nav-link{color:${T.textSecondary};text-decoration:none;font-size:14px;font-weight:500;transition:color .2s;font-family:'Outfit',sans-serif}
  .nav-link:hover{color:${T.gold}}

  .feature-card{background:${T.surface};border:1px solid ${T.border};border-radius:16px;padding:24px;transition:all .3s}
  .feature-card:hover{border-color:rgba(212,168,67,.3);transform:translateY(-4px);box-shadow:0 20px 40px rgba(0,0,0,.3)}

  .stat-num{background:linear-gradient(135deg,${T.gold},${T.goldLight},${T.gold});background-size:200% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;animation:shimmer 3s linear infinite}

  .ticker-track{display:flex;gap:32px;animation:ticker 35s linear infinite;white-space:nowrap}

  .role-tab{padding:8px 20px;border-radius:8px;border:1.5px solid ${T.border};background:transparent;color:${T.textMuted};font-size:13px;font-weight:600;cursor:pointer;transition:all .2s;font-family:'Outfit',sans-serif}
  .role-tab.active{border-color:${T.gold};background:rgba(212,168,67,.1);color:${T.gold}}

  .faq-item{border-bottom:1px solid ${T.border};overflow:hidden}
  .faq-btn{width:100%;text-align:left;background:none;border:none;cursor:pointer;padding:20px 0;display:flex;justify-content:space-between;align-items:center;font-family:'Outfit',sans-serif}

  /* Dashboard Mockup */
  .mockup-sidebar{width:200px;background:#0A1628;border-right:1px solid rgba(212,168,67,.1);padding:16px 0;flex-shrink:0}
  .mockup-tab{padding:8px 16px;font-size:11px;color:#94A3B8;display:flex;align-items:center;gap:8px;cursor:default}
  .mockup-tab.active{background:rgba(212,168,67,.08);color:#D4A843;border-right:2px solid #D4A843}
  .mockup-kpi{background:#0E1D35;border-radius:10px;border:1px solid rgba(212,168,67,.1);padding:14px;flex:1}

  @media(max-width:768px){
    .hero-title{font-size:34px!important}
    .hero-sub{font-size:15px!important}
    .hero-btns{flex-direction:column!important;align-items:stretch!important}
    .nav-desktop{display:none!important}
    .pricing-grid{grid-template-columns:1fr!important}
    .features-grid{grid-template-columns:1fr 1fr!important}
    .two-col{grid-template-columns:1fr!important}
    .three-col{grid-template-columns:1fr!important}
    .tools-grid{grid-template-columns:repeat(3,1fr)!important}
    .mockup-wrap{display:none!important}
    section{padding:60px 20px!important}
    .compare-table th,.compare-table td{padding:10px 8px!important;font-size:11px!important}
  }
  @media(max-width:480px){
    .hero-title{font-size:28px!important}
    .features-grid{grid-template-columns:1fr!important}
    .tools-grid{grid-template-columns:repeat(2,1fr)!important}
  }
`;

export default function LandingPage({ onLoginClick, onSignUpClick }) {
  const [scrollY, setScrollY] = useState(0);
  const [openFaq, setOpenFaq] = useState(null);
  const [billingAnnual, setBillingAnnual] = useState(false);
  const [activeRole, setActiveRole] = useState("agent");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [liveStats, setLiveStats] = useState({ users: 7, paid: 6, mrr: 2194, projects: 48, communities: 13 });

  // Live stats from Firestore — updates in real time as users sign up
  useEffect(() => {
    try {
      const unsub = onSnapshot(collection(db, "users"), (snap) => {
        const users = snap.docs.map(d => d.data());
        const paid = users.filter(u => u.tier === "pro" || u.tier === "enterprise").length;
        const mrr = users.reduce((sum, u) => {
          if (u.tier === "pro") return sum + 99;
          if (u.tier === "enterprise") return sum + 499;
          return sum;
        }, 0);
        setLiveStats(prev => ({ ...prev, users: users.length, paid, mrr }));
      });
      return () => unsub();
    } catch { /* firebase not available */ }
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const proPrice = billingAnnual ? 79 : 99;
  const entPrice = billingAnnual ? 399 : 499;

  const roles = {
    agent: {
      label: "Real Estate Agent",
      pain: "You spend 2+ hours researching every client request",
      solution: "Get verified project data, yields, and ROI in 30 seconds",
      wins: ["Close faster with data-backed recommendations", "Share professional project reports via WhatsApp instantly", "Never be caught without an answer on price per sqft or handover"],
      stat: "Save 2 hrs per client meeting",
      icon: "🤝",
    },
    investor: {
      label: "Property Investor",
      pain: "You're making AED 2M+ decisions on broker estimates",
      solution: "Get verified yields, risk scores, and ROI projections",
      wins: ["Compare 3 projects side-by-side in 30 seconds", "See real DLD transaction data, not marketing brochures", "Calculate exact ROI — long-term, Airbnb, or flip strategy"],
      stat: "Verify any project in 30 seconds",
      icon: "📐",
    },
    brokerage: {
      label: "Brokerage / Agency",
      pain: "Your team wastes hours on scattered data every week",
      solution: "One platform for your entire team — from AED 499/mo",
      wins: ["Standardize how your team researches properties", "Share professional reports that impress clients", "Track market shifts before your competitors do"],
      stat: "From AED 499/mo for your whole team",
      icon: "🏢",
    },
  };

  const tools = [
    { icon: "🏠", label: "Overview" }, { icon: "📊", label: "Financials" },
    { icon: "🏗️", label: "Projects" }, { icon: "📅", label: "Handover" },
    { icon: "🚀", label: "Launch Cal." }, { icon: "🗺️", label: "Map" },
    { icon: "🏘️", label: "Neighbourhoods" }, { icon: "📈", label: "Yields" },
    { icon: "🏆", label: "Competitors" }, { icon: "💰", label: "ROI Calc" },
    { icon: "🔄", label: "Flip Calc" }, { icon: "🏦", label: "Mortgage" },
    { icon: "🛡️", label: "Risk" }, { icon: "📉", label: "Price History" },
    { icon: "📋", label: "DLD Volumes" }, { icon: "🌍", label: "Currency" },
    { icon: "⭐", label: "Inv. Score" }, { icon: "🏅", label: "Golden Visa" },
    { icon: "🌇", label: "STR vs LTR" }, { icon: "💼", label: "Portfolio" },
    { icon: "🏢", label: "Srvc Charges" }, { icon: "🔍", label: "DXB Estimate" },
    { icon: "📈", label: "Market" },
  ];

  const faqs = [
    { q: "Is there a free trial?", a: "Yes — every new account gets a 7-day Pro trial automatically. No credit card needed. You get full access to all 23 tools and all 48+ projects." },
    { q: "What data sources do you use?", a: "Dubai Land Department (DLD), official developer annual reports, DXBinteract, BetterHomes, Bayut, Engel & Völkers, ValuStrat, and Knight Frank. Every data point shows its source." },
    { q: "How often is data updated?", a: "Financial data is updated within 24 hours of official developer releases. Project prices and handover dates are manually verified monthly. EIBOR rates update daily." },
    { q: "Which developers are currently covered?", a: "Phase 1 (live now) covers 48 active projects across 11 Dubai communities from Dubai's largest developer. DAMAC, Sobha, Nakheel, Binghatti, and more are coming in Q3 2026." },
    { q: "What's included in the Enterprise plan?", a: "Everything in Pro plus multi-user team accounts, PDF report generation (Q3 2026), API data access (Q3 2026), custom branded reports, and a dedicated account manager. Contact us to discuss your team's needs." },
    { q: "Can I cancel anytime?", a: "Yes. No contracts, no cancellation fees. Cancel from your account settings and keep access until your billing period ends." },
    { q: "Is the data accurate?", a: "All data is sourced from official reports and cross-referenced. We display the source for every data point so you can verify independently. This is professional intelligence — always verify before transacting." },
    { q: "Do you have an Arabic version?", a: "Yes — the platform supports Arabic and 19 other languages including Urdu, Hindi, Chinese, and Russian. Switch language from the top navigation bar." },
  ];

  const r = roles[activeRole];

  return (
    <div style={{ minHeight: "100vh", background: T.bg, fontFamily: "'Outfit',sans-serif", color: T.textPrimary }}>
      <style>{css}</style>

      {/* ── NAVBAR ── */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        padding: "0 40px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between",
        background: scrollY > 40 ? "rgba(4,9,15,0.97)" : "transparent",
        backdropFilter: scrollY > 40 ? "blur(20px)" : "none",
        borderBottom: scrollY > 40 ? `1px solid ${T.border}` : "1px solid transparent",
        transition: "all .3s",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <svg width="32" height="32" viewBox="0 0 40 40"><rect x="2" y="2" width="36" height="36" rx="8" fill="none" stroke={T.gold} strokeWidth="2"/><path d="M12 28V12h10l-6 8h8l-12 8z" fill={T.gold}/></svg>
          <span style={{ fontFamily: "'Fraunces',serif", fontSize: 18, fontWeight: 900, color: T.gold }}>DXB Analytics</span>
        </div>
        <div className="nav-desktop" style={{ display: "flex", alignItems: "center", gap: 28 }}>
          <a href="#features" className="nav-link">Features</a>
          <a href="#tools" className="nav-link">23 Tools</a>
          <a href="#pricing" className="nav-link">Pricing</a>
          <a href="#faq" className="nav-link">FAQ</a>
          <button onClick={onLoginClick} className="cta-outline" style={{ padding: "8px 20px", fontSize: 13 }}>Login</button>
          <button onClick={onSignUpClick} className="cta-primary" style={{ padding: "9px 22px", fontSize: 13 }}>Try Free 7 Days →</button>
        </div>
        {/* Mobile hamburger */}
        <button type="button" onClick={() => setMobileMenu(m => !m)} style={{ display: "none", background: "none", border: `1px solid ${T.border}`, borderRadius: 8, padding: 8, cursor: "pointer", color: T.textSecondary }} className="nav-mobile-btn">
          ☰
        </button>
      </nav>

      {/* ── HERO ── */}
      <section style={{ position: "relative", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "120px 40px 80px", overflow: "hidden" }}>
        <div className="hero-glow" />
        <div className="grid-bg" />
        <div style={{ position: "relative", zIndex: 1, maxWidth: 1100, width: "100%", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 60, alignItems: "center" }}>

          {/* Left — Copy */}
          <div style={{ animation: "fadeUp .7s ease-out both" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "5px 14px", borderRadius: 20, background: T.goldGlow, border: `1px solid ${T.border}`, marginBottom: 24 }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: T.green, display: "inline-block", animation: "pulse 2s infinite" }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: T.gold, letterSpacing: 1 }}>LIVE — DUBAI REAL ESTATE INTELLIGENCE</span>
            </div>

            <h1 className="hero-title" style={{ fontFamily: "'Fraunces',serif", fontSize: 52, fontWeight: 900, lineHeight: 1.1, marginBottom: 20 }}>
              <span style={{ color: T.white }}>Close Deals.</span><br/>
              <span style={{ background: `linear-gradient(135deg,${T.gold},${T.goldLight})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Not Spreadsheets.</span>
            </h1>

            <p className="hero-sub" style={{ fontSize: 17, color: T.textSecondary, lineHeight: 1.7, marginBottom: 32, maxWidth: 480 }}>
              23 professional tools for Dubai real estate agents, investors, and brokerages. Verified data from DLD, developer IR reports, and live market feeds — in one platform.
            </p>

            <div className="hero-btns" style={{ display: "flex", gap: 14, marginBottom: 28 }}>
              <button onClick={onSignUpClick} className="cta-primary" style={{ padding: "16px 36px", fontSize: 16 }}>
                Start Free Trial →
              </button>
              <button onClick={() => document.getElementById("tools")?.scrollIntoView({ behavior: "smooth" })} className="cta-outline" style={{ padding: "16px 28px", fontSize: 15 }}>
                See 23 Tools
              </button>
            </div>

            <p style={{ fontSize: 11, color: T.textMuted, marginBottom: 32 }}>No credit card · 7-day Pro access · Cancel anytime</p>

            {/* Social proof numbers */}
            <div style={{ display: "flex", gap: 28, flexWrap: "wrap" }}>
              {[
                { n: "48+", l: "Projects" },
                { n: "23", l: "Pro Tools" },
                { n: "6 yrs", l: "Financial Data" },
                { n: "20", l: "Languages" },
              ].map((s, i) => (
                <div key={i}>
                  <div className="stat-num" style={{ fontFamily: "'Fraunces',serif", fontSize: 22, fontWeight: 900 }}>{s.n}</div>
                  <div style={{ fontSize: 11, color: T.textMuted, marginTop: 1 }}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — Dashboard Mockup */}
          <div className="mockup-wrap" style={{ animation: "fadeUp .7s ease-out .15s both", opacity: 0 }}>
            <div style={{ borderRadius: 16, border: `1px solid rgba(212,168,67,0.2)`, overflow: "hidden", boxShadow: "0 40px 80px rgba(0,0,0,.6)", animation: "float 6s ease-in-out infinite" }}>
              {/* Mockup topbar */}
              <div style={{ background: "#06101E", borderBottom: "1px solid rgba(212,168,67,.1)", padding: "10px 16px", display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#EF4444" }} />
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#F59E0B" }} />
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#10B981" }} />
                <div style={{ flex: 1 }} />
                <div style={{ fontSize: 10, color: T.textMuted }}>emaar-dashboard.vercel.app</div>
              </div>
              {/* Mockup content */}
              <div style={{ display: "flex", height: 380, background: T.bg }}>
                {/* Sidebar */}
                <div className="mockup-sidebar">
                  <div style={{ padding: "8px 16px 12px", fontSize: 9, fontWeight: 700, color: T.textMuted, letterSpacing: 1 }}>DEVELOPER</div>
                  <div style={{ padding: "6px 12px 12px" }}>
                    <div style={{ padding: "7px 10px", background: "rgba(212,168,67,.1)", borderRadius: 8, fontSize: 11, fontWeight: 700, color: T.gold }}>Emaar Properties</div>
                  </div>
                  <div style={{ padding: "0 0 4px", fontSize: 9, fontWeight: 700, color: T.textMuted, letterSpacing: 1, padding: "4px 16px 8px" }}>TABS</div>
                  {["Overview", "Financials", "Projects", "Yields", "Risk", "Map"].map((t, i) => (
                    <div key={t} className={`mockup-tab${i === 0 ? " active" : ""}`}>{t}</div>
                  ))}
                </div>
                {/* Main content */}
                <div style={{ flex: 1, padding: 16, overflowY: "hidden" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: T.gold, letterSpacing: 1, marginBottom: 12, textTransform: "uppercase" }}>Key Performance · FY 2025</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
                    {[
                      { l: "Property Sales", v: "AED 80.4B", c: T.gold },
                      { l: "Net Profit", v: "AED 25.7B", c: T.green },
                      { l: "Revenue Backlog", v: "AED 155B", c: T.teal },
                      { l: "Active Projects", v: "48", c: T.blue },
                    ].map((k, i) => (
                      <div key={i} className="mockup-kpi">
                        <div style={{ fontSize: 9, color: T.textMuted, marginBottom: 4 }}>{k.l}</div>
                        <div style={{ fontFamily: "'Fraunces',serif", fontSize: 16, fontWeight: 900, color: k.c }}>{k.v}</div>
                      </div>
                    ))}
                  </div>
                  {/* Mini chart */}
                  <div style={{ background: "#0E1D35", borderRadius: 10, border: "1px solid rgba(212,168,67,.1)", padding: 12 }}>
                    <div style={{ fontSize: 9, color: T.textMuted, marginBottom: 8 }}>Revenue Growth (AED B)</div>
                    <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 60 }}>
                      {[14.9, 27.9, 24.9, 26.7, 35.5, 49.6].map((v, i) => (
                        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                          <div style={{ width: "100%", height: `${(v/49.6)*56}px`, background: i === 5 ? T.gold : `rgba(212,168,67,${0.2 + i*0.1})`, borderRadius: "3px 3px 0 0", minHeight: 6 }} />
                          <div style={{ fontSize: 7, color: T.textMuted }}>{2020+i}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TICKER ── */}
      <div style={{ borderTop: `1px solid ${T.border}`, borderBottom: `1px solid ${T.border}`, background: T.surface, padding: "13px 0", overflow: "hidden" }}>
        <div className="ticker-track">
          {[...Array(2)].map((_, r) => (
            <React.Fragment key={r}>
              {["AED 761B Dubai Market 2025", "48 Active Projects Tracked", "6 Years Financial Data", "Live DLD Transaction Data", "9-Factor Risk Assessment", "EIBOR-Based Mortgage Calculator", "20 Languages Including Arabic", "DLD · Knight Frank · ValuStrat · Bayut"].map((item, i) => (
                <span key={`${r}-${i}`} style={{ fontSize: 12, color: T.textMuted, display: "inline-flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
                  <span style={{ width: 4, height: 4, borderRadius: "50%", background: T.gold, opacity: .6 }} />{item}
                </span>
              ))}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* ── BEFORE / AFTER — ROLE-BASED ── */}
      <section style={{ padding: "100px 40px", background: `linear-gradient(180deg,${T.surface},${T.bg})` }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: T.gold, letterSpacing: 2, textTransform: "uppercase" }}>Built For You</span>
            <h2 style={{ fontFamily: "'Fraunces',serif", fontSize: 36, fontWeight: 900, color: T.white, marginTop: 10, marginBottom: 20 }}>Stop wasting time. Start closing.</h2>
            {/* Role selector */}
            <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
              {Object.entries(roles).map(([key, val]) => (
                <button key={key} type="button" className={`role-tab${activeRole === key ? " active" : ""}`} onClick={() => setActiveRole(key)}>
                  {val.icon} {val.label}
                </button>
              ))}
            </div>
          </div>

          <div className="two-col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, alignItems: "stretch" }}>
            {/* Before */}
            <div style={{ background: "rgba(239,68,68,0.04)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 16, padding: 28 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.red, letterSpacing: 1, marginBottom: 16, textTransform: "uppercase" }}>❌ Before DXB Analytics</div>
              <div style={{ fontFamily: "'Fraunces',serif", fontSize: 18, color: T.white, marginBottom: 12, lineHeight: 1.4 }}>"{r.pain}"</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 16 }}>
                {["Scattered data across Bayut, Property Finder, WhatsApp groups", "2+ hours researching each client request", "Outdated brochures with no yield verification", "Lose deals to better-prepared competitors"].map((p, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: 13, color: T.textSecondary }}>
                    <span style={{ color: T.red, flexShrink: 0, marginTop: 1 }}>✗</span>{p}
                  </div>
                ))}
              </div>
            </div>
            {/* After */}
            <div style={{ background: "rgba(16,185,129,0.04)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 16, padding: 28 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.green, letterSpacing: 1, marginBottom: 16, textTransform: "uppercase" }}>✅ After DXB Analytics</div>
              <div style={{ fontFamily: "'Fraunces',serif", fontSize: 18, color: T.white, marginBottom: 12, lineHeight: 1.4 }}>"{r.solution}"</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 16 }}>
                {r.wins.map((w, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: 13, color: T.textSecondary }}>
                    <span style={{ color: T.green, flexShrink: 0, marginTop: 1 }}>✓</span>{w}
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 20, padding: "10px 14px", background: "rgba(16,185,129,.1)", borderRadius: 10, display: "inline-block" }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: T.green }}>📈 {r.stat}</span>
              </div>
            </div>
          </div>

          <div style={{ textAlign: "center", marginTop: 36 }}>
            <button onClick={onSignUpClick} className="cta-primary" style={{ padding: "15px 40px", fontSize: 15 }}>
              Start Your Free Trial →
            </button>
            <p style={{ fontSize: 11, color: T.textMuted, marginTop: 10 }}>7-day Pro access · No credit card · Cancel anytime</p>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section style={{ padding: "80px 40px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", textAlign: "center" }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: T.gold, letterSpacing: 2, textTransform: "uppercase" }}>Simple as 1-2-3</span>
          <h2 style={{ fontFamily: "'Fraunces',serif", fontSize: 34, fontWeight: 900, color: T.white, marginTop: 10, marginBottom: 48 }}>Up and running in 60 seconds</h2>
          <div className="three-col" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 24 }}>
            {[
              { num: "01", title: "Sign Up Free", desc: "Create your account — no credit card needed. Your 7-day Pro trial starts immediately.", icon: "✉️" },
              { num: "02", title: "Explore Any Project", desc: "Search 48+ projects, filter by community, price, or handover year. Click any project for full intelligence.", icon: "🔍" },
              { num: "03", title: "Share & Close", desc: "WhatsApp project details to clients in one tap. PDF reports, comparison tools, and ROI calculators ready instantly.", icon: "🚀" },
            ].map((s, i) => (
              <div key={i} className="feature-card" style={{ textAlign: "left", position: "relative" }}>
                <div style={{ position: "absolute", top: -12, left: 20, fontFamily: "'Fraunces',serif", fontSize: 11, fontWeight: 900, color: T.gold, background: T.bg, padding: "0 8px" }}>{s.num}</div>
                <div style={{ fontSize: 32, marginBottom: 12 }}>{s.icon}</div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: T.white, marginBottom: 8 }}>{s.title}</h3>
                <p style={{ fontSize: 13, color: T.textSecondary, lineHeight: 1.6 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" style={{ padding: "100px 40px", background: `linear-gradient(180deg,transparent,${T.surface} 20%,${T.surface} 80%,transparent)` }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: T.gold, letterSpacing: 2, textTransform: "uppercase" }}>Features</span>
            <h2 style={{ fontFamily: "'Fraunces',serif", fontSize: 36, fontWeight: 900, color: T.white, marginTop: 10 }}>Everything in one platform</h2>
            <p style={{ fontSize: 15, color: T.textSecondary, marginTop: 12, maxWidth: 520, margin: "12px auto 0" }}>No more switching between Bayut, Property Finder, Excel, and WhatsApp groups.</p>
          </div>
          <div className="features-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
            {[
              { icon: "📊", title: "Developer Financials", desc: "Multi-year revenue, profit, backlog, EPS — sourced directly from official annual reports." },
              { icon: "🏗️", title: "Project Intelligence", desc: "Every active project: price/sqft, payment plan, construction %, handover timeline." },
              { icon: "💰", title: "Yield & ROI Calculator", desc: "Gross/net yields by community. Calculate returns for long-term, Airbnb, or flip." },
              { icon: "⚖️", title: "3-Project Comparison", desc: "Side-by-side on price, yield, handover, payment plan — share via WhatsApp in one tap." },
              { icon: "🛡️", title: "Risk Assessment", desc: "9-factor risk matrix: market, regulatory, liquidity, construction, interest rate." },
              { icon: "🏅", title: "Golden Visa Finder", desc: "Automatically flag AED 2M+ projects eligible for 10-year UAE Golden Visa." },
              { icon: "🏦", title: "Mortgage Calculator", desc: "EIBOR-based, live rates. Shows monthly payment + all UAE transaction costs." },
              { icon: "🔍", title: "DXB Estimate AVM", desc: "Automated valuations using DLD transaction data — per unit type, per community." },
            ].map((f, i) => (
              <div key={i} className="feature-card" style={{ animation: `fadeUp .6s ease-out ${i*.07}s both` }}>
                <div style={{ fontSize: 28, marginBottom: 12 }}>{f.icon}</div>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: T.white, marginBottom: 8 }}>{f.title}</h3>
                <p style={{ fontSize: 12, color: T.textSecondary, lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 23 TOOLS ── */}
      <section id="tools" style={{ padding: "80px 40px" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 44 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: T.gold, letterSpacing: 2, textTransform: "uppercase" }}>23 Professional Tools</span>
            <h2 style={{ fontFamily: "'Fraunces',serif", fontSize: 34, fontWeight: 900, color: T.white, marginTop: 10 }}>One platform. Every tool you need.</h2>
            <p style={{ fontSize: 14, color: T.textSecondary, marginTop: 10, maxWidth: 500, margin: "10px auto 0" }}>Bayut has listings. Property Finder has listings. DXB Analytics has intelligence.</p>
          </div>
          <div className="tools-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8 }}>
            {tools.map((t, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "11px 13px", background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, transition: "all .2s" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(212,168,67,.3)"; e.currentTarget.style.background = T.surfaceAlt; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.background = T.surface; }}>
                <span style={{ fontSize: 17, flexShrink: 0 }}>{t.icon}</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: T.textSecondary }}>{t.label}</span>
              </div>
            ))}
          </div>
          <div style={{ textAlign: "center", marginTop: 32 }}>
            <button onClick={onSignUpClick} className="cta-primary" style={{ padding: "14px 36px" }}>Unlock All 23 Tools →</button>
            <p style={{ fontSize: 11, color: T.textMuted, marginTop: 10 }}>Free tier includes 5 tabs · Pro unlocks everything</p>
          </div>
        </div>
      </section>

      {/* ── VS COMPETITION ── */}
      <section style={{ padding: "80px 40px", background: `linear-gradient(180deg,transparent,${T.surface} 30%,${T.surface} 70%,transparent)` }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 44 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: T.gold, letterSpacing: 2, textTransform: "uppercase" }}>Why DXB Analytics</span>
            <h2 style={{ fontFamily: "'Fraunces',serif", fontSize: 34, fontWeight: 900, color: T.white, marginTop: 10 }}>More than a portal. An intelligence layer.</h2>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table className="compare-table" style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${T.border}` }}>
                  <th style={{ padding: "14px 16px", textAlign: "left", color: T.textMuted, fontSize: 11, fontWeight: 600 }}>FEATURE</th>
                  {["Bayut", "Prop. Finder", "DXB Analytics"].map(p => (
                    <th key={p} style={{ padding: "14px 16px", textAlign: "center", color: p === "DXB Analytics" ? T.gold : T.textSecondary, fontSize: 13, fontWeight: 700 }}>{p}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { f: "Property listings", v: ["✓", "✓", "✓"] },
                  { f: "Developer financials (6yr)", v: ["✗", "✗", "✓"] },
                  { f: "Rental yield data", v: ["Basic", "Basic", "Full + net"] },
                  { f: "ROI calculators", v: ["✗", "✗", "3 strategies"] },
                  { f: "Risk assessment", v: ["✗", "✗", "9-factor"] },
                  { f: "3-project comparison", v: ["✗", "✗", "✓"] },
                  { f: "WhatsApp share", v: ["✗", "✗", "✓"] },
                  { f: "Mortgage calculator", v: ["Basic", "Basic", "EIBOR live"] },
                  { f: "Golden Visa finder", v: ["✗", "✗", "✓"] },
                  { f: "Arabic & 19 languages", v: ["✓", "✓", "✓"] },
                  { f: "Price", v: ["Free", "Free", "AED 99/mo"] },
                ].map((row, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,.012)" }}>
                    <td style={{ padding: "10px 16px", fontSize: 13, color: T.textSecondary }}>{row.f}</td>
                    {row.v.map((v, j) => (
                      <td key={j} style={{ padding: "10px 16px", textAlign: "center", fontSize: 13, color: j === 2 ? (v === "✗" ? T.textMuted : T.gold) : v === "✓" ? T.green : v === "✗" ? T.textMuted : T.textSecondary, fontWeight: j === 2 ? 600 : 400 }}>
                        {v === "✓" ? <span style={{ color: j === 2 ? T.gold : T.green }}>✓</span> : v === "✗" ? <span style={{ color: T.textMuted }}>—</span> : v}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" style={{ padding: "100px 40px" }}>
        <div style={{ maxWidth: 1060, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 44 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: T.gold, letterSpacing: 2, textTransform: "uppercase" }}>Pricing</span>
            <h2 style={{ fontFamily: "'Fraunces',serif", fontSize: 36, fontWeight: 900, color: T.white, marginTop: 10 }}>Start free. Upgrade when ready.</h2>
            <p style={{ fontSize: 14, color: T.textSecondary, marginTop: 10 }}>One deal pays for 2 years of Pro. The math is simple.</p>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 4, marginTop: 20, padding: 4, background: T.card, borderRadius: 10, border: `1px solid ${T.border}` }}>
              <button type="button" onClick={() => setBillingAnnual(false)} style={{ padding: "7px 18px", borderRadius: 7, border: "none", background: !billingAnnual ? T.gold : "transparent", color: !billingAnnual ? T.bg : T.textMuted, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Outfit',sans-serif", transition: "all .2s" }}>Monthly</button>
              <button type="button" onClick={() => setBillingAnnual(true)} style={{ padding: "7px 18px", borderRadius: 7, border: "none", background: billingAnnual ? T.gold : "transparent", color: billingAnnual ? T.bg : T.textMuted, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Outfit',sans-serif", transition: "all .2s", display: "flex", alignItems: "center", gap: 6 }}>
                Annual <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 6, background: billingAnnual ? "rgba(4,9,15,.3)" : "rgba(16,185,129,.2)", color: billingAnnual ? T.bg : T.green, fontWeight: 700 }}>SAVE 20%</span>
              </button>
            </div>
          </div>

          <div className="pricing-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20, alignItems: "start" }}>
            {/* FREE */}
            <div className="feature-card" style={{ borderRadius: 16, padding: 28 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: T.white, marginBottom: 4 }}>Free</h3>
              <p style={{ fontSize: 12, color: T.textMuted, marginBottom: 20 }}>Explore the platform</p>
              <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 24 }}>
                <span style={{ fontSize: 11, color: T.textMuted }}>AED</span>
                <span style={{ fontFamily: "'Fraunces',serif", fontSize: 42, fontWeight: 900, color: T.white }}>0</span>
                <span style={{ fontSize: 13, color: T.textMuted }}>forever</span>
              </div>
              {["5 project previews", "Basic market overview", "Community search", "Currency converter"].map((f, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", fontSize: 13, color: T.textSecondary }}>
                  <span style={{ color: T.green }}>✓</span>{f}
                </div>
              ))}
              <button onClick={() => onSignUpClick("free")} className="cta-outline" style={{ width: "100%", justifyContent: "center", padding: "12px 0", marginTop: 24 }}>Get Started Free</button>
            </div>

            {/* PRO */}
            <div style={{ background: T.surface, borderRadius: 16, padding: 28, border: `2px solid ${T.gold}`, position: "relative", boxShadow: `0 0 40px rgba(212,168,67,.15)` }}>
              <div style={{ position: "absolute", top: -13, left: "50%", transform: "translateX(-50%)", padding: "4px 16px", borderRadius: 12, background: T.gold, color: T.bg, fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" }}>⭐ MOST POPULAR</div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: T.white }}>Pro</h3>
                <span style={{ fontSize: 10, padding: "3px 10px", borderRadius: 6, background: "rgba(16,185,129,.12)", color: T.green, fontWeight: 700, border: "1px solid rgba(16,185,129,.25)" }}>7-DAY FREE TRIAL</span>
              </div>
              <p style={{ fontSize: 12, color: T.textMuted, marginBottom: 20 }}>For agents & active investors</p>
              <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 4 }}>
                <span style={{ fontSize: 11, color: T.textMuted }}>AED</span>
                <span style={{ fontFamily: "'Fraunces',serif", fontSize: 42, fontWeight: 900, color: T.gold }}>{proPrice}</span>
                <span style={{ fontSize: 13, color: T.textMuted }}>/month</span>
              </div>
              {billingAnnual && <p style={{ fontSize: 11, color: T.green, marginBottom: 16 }}>Billed AED {proPrice * 12}/year · Save AED {(99 - proPrice) * 12}</p>}
              {["All 48+ projects — full data", "Multi-year developer financials", "Rental yields & ROI calculators", "Risk assessment (9 factors)", "3-project comparison tool", "Mortgage & flip calculators", "Portfolio tracker + price alerts", "WhatsApp share any project", "All 23 dashboard tools", "Arabic + 19 languages", "Priority email support"].map((f, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0", fontSize: 13, color: T.textSecondary }}>
                  <span style={{ color: T.green }}>✓</span>{f}
                </div>
              ))}
              <button onClick={() => onSignUpClick("pro")} className="cta-primary" style={{ width: "100%", justifyContent: "center", padding: "13px 0", marginTop: 20 }}>Start 7-Day Free Trial →</button>
              <p style={{ fontSize: 10, color: T.textMuted, marginTop: 8, textAlign: "center" }}>No credit card · Cancel anytime</p>
            </div>

            {/* ENTERPRISE */}
            <div className="feature-card" style={{ borderRadius: 16, padding: 28 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: T.white, marginBottom: 4 }}>Enterprise</h3>
              <p style={{ fontSize: 12, color: T.textMuted, marginBottom: 20 }}>For agencies & funds</p>
              <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 24 }}>
                <span style={{ fontSize: 11, color: T.textMuted }}>AED</span>
                <span style={{ fontFamily: "'Fraunces',serif", fontSize: 42, fontWeight: 900, color: T.white }}>{entPrice}</span>
                <span style={{ fontSize: 13, color: T.textMuted }}>/month</span>
              </div>
              {["Everything in Pro", "Multi-user team accounts", "Dedicated account manager", "Developer-level raw data", "PDF reports ⏳", "API data access ⏳", "Custom branded dashboards ⏳", "White-label options ⏳"].map((f, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0", fontSize: 13, color: T.textSecondary }}>
                  <span style={{ color: T.green }}>✓</span>{f}
                </div>
              ))}
              <a href="mailto:mianwaleed689@gmail.com?subject=DXB%20Analytics%20Enterprise" className="cta-outline" style={{ width: "100%", justifyContent: "center", padding: "12px 0", marginTop: 20, display: "flex", textDecoration: "none" }}>Contact Us →</a>
              <p style={{ fontSize: 10, color: T.textMuted, marginTop: 10, textAlign: "center" }}>⏳ Launching Q3 2026</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── DATA SOURCES ── */}
      <section style={{ padding: "56px 40px", borderTop: `1px solid ${T.border}`, borderBottom: `1px solid ${T.border}` }}>
        <div style={{ maxWidth: 800, margin: "0 auto", textAlign: "center" }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: T.textMuted, letterSpacing: 2, textTransform: "uppercase", marginBottom: 20 }}>Verified Data From</p>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 10 }}>
            {["Dubai Land Department", "Developer IR Reports", "DXBinteract", "Knight Frank", "ValuStrat", "Engel & Völkers", "BetterHomes", "Bayut"].map((src, i) => (
              <span key={i} style={{ fontSize: 12, color: T.textSecondary, padding: "7px 14px", borderRadius: 8, background: T.surface, border: `1px solid ${T.border}` }}>{src}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── ROADMAP ── */}
      <section style={{ padding: "100px 40px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 52 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: T.gold, letterSpacing: 2, textTransform: "uppercase" }}>The Vision</span>
            <h2 style={{ fontFamily: "'Fraunces',serif", fontSize: 34, fontWeight: 900, color: T.white, marginTop: 10 }}>The Bloomberg of GCC Real Estate</h2>
            <p style={{ fontSize: 14, color: T.textSecondary, marginTop: 10, maxWidth: 520, margin: "10px auto 0" }}>One platform. Every developer. Every community. Updated automatically.</p>
          </div>
          <div className="three-col" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20 }}>
            {[
              { phase: "Phase 1", status: "LIVE NOW", color: T.green, title: "Dubai — First Developer", desc: "48 projects across 11 communities — full financials, yields, risk, ROI, and 23 professional tools.", bg: "rgba(16,185,129,.05)" },
              { phase: "Phase 2", status: "Q3 2026", color: T.gold, title: "Dubai — Top 10 Developers", desc: "DAMAC, Sobha, Meraas, Nakheel, Binghatti, Azizi, Tiger, Danube — same depth, same quality.", bg: T.goldMuted },
              { phase: "Phase 3", status: "2027", color: T.blue, title: "Full GCC Market", desc: "All 228+ Dubai developers, Abu Dhabi, Saudi Arabia — every transaction, live DLD data feeds.", bg: "rgba(59,130,246,.05)" },
            ].map((item, i) => (
              <div key={i} style={{ background: item.bg, borderRadius: 16, padding: 28, border: `1px solid rgba(212,168,67,.08)` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: item.color, letterSpacing: 1 }}>{item.phase}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 10, background: `${item.color}22`, color: item.color, border: `1px solid ${item.color}44` }}>{item.status}</span>
                </div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: T.white, marginBottom: 8 }}>{item.title}</h3>
                <p style={{ fontSize: 12, color: T.textSecondary, lineHeight: 1.6 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" style={{ padding: "100px 40px", background: `linear-gradient(180deg,transparent,${T.surface} 20%,${T.surface} 80%,transparent)` }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 52 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: T.gold, letterSpacing: 2, textTransform: "uppercase" }}>FAQ</span>
            <h2 style={{ fontFamily: "'Fraunces',serif", fontSize: 34, fontWeight: 900, color: T.white, marginTop: 10 }}>Common Questions</h2>
          </div>
          {faqs.map((faq, i) => (
            <div key={i} className="faq-item">
              <button type="button" className="faq-btn" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                <span style={{ fontSize: 14, fontWeight: 600, color: openFaq === i ? T.gold : T.white, paddingRight: 16 }}>{faq.q}</span>
                <span style={{ color: T.gold, fontSize: 18, flexShrink: 0, transition: "transform .2s", transform: openFaq === i ? "rotate(45deg)" : "none", display: "inline-block" }}>+</span>
              </button>
              {openFaq === i && (
                <div style={{ paddingBottom: 20, fontSize: 14, color: T.textSecondary, lineHeight: 1.7, animation: "fadeUp .25s ease-out both" }}>{faq.a}</div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section style={{ padding: "100px 40px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div className="hero-glow" style={{ top: "-100px" }} />
        <div style={{ position: "relative", zIndex: 1, maxWidth: 640, margin: "0 auto" }}>
          <div style={{ display: "inline-block", padding: "4px 14px", borderRadius: 8, background: "rgba(16,185,129,.1)", border: "1px solid rgba(16,185,129,.25)", marginBottom: 20 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: T.green }}>NO CREDIT CARD REQUIRED</span>
          </div>
          <h2 style={{ fontFamily: "'Fraunces',serif", fontSize: 40, fontWeight: 900, color: T.white, marginBottom: 16, lineHeight: 1.15 }}>
            Ready to close deals<br/>
            <span style={{ color: T.gold }}>with data, not guesswork?</span>
          </h2>
          <p style={{ fontSize: 16, color: T.textSecondary, marginBottom: 32 }}>Join Dubai's most informed agents and investors. {liveStats.users > 10 ? `${liveStats.users}+ professionals already inside.` : "7-day Pro trial — free, no card needed."}</p>
          <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
            <button onClick={onSignUpClick} className="cta-primary" style={{ padding: "18px 48px", fontSize: 17 }}>Start Free Trial →</button>
            <a href="mailto:mianwaleed689@gmail.com?subject=DXB%20Analytics%20Enquiry" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "18px 32px", background: "transparent", borderRadius: 12, color: T.gold, fontSize: 15, fontWeight: 700, textDecoration: "none", border: `1.5px solid ${T.gold}`, transition: "all .2s" }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(212,168,67,.1)"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              ✉️ Talk to Us
            </a>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ padding: "40px", borderTop: `1px solid ${T.border}`, background: T.surface }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16, marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <svg width="24" height="24" viewBox="0 0 40 40"><rect x="2" y="2" width="36" height="36" rx="8" fill="none" stroke={T.gold} strokeWidth="2"/><path d="M12 28V12h10l-6 8h8l-12 8z" fill={T.gold}/></svg>
              <span style={{ fontFamily: "'Fraunces',serif", fontSize: 14, fontWeight: 700, color: T.gold }}>DXB Analytics</span>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              {[
                { href: "https://www.linkedin.com/company/dxb-analytics", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>, title: "LinkedIn" },
                { href: "https://twitter.com/dxbanalytics", icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>, title: "X / Twitter" },
                { href: "https://www.instagram.com/dxbanalytics", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>, title: "Instagram" },
              ].map((s, i) => (
                <a key={i} href={s.href} target="_blank" rel="noopener noreferrer" title={s.title}
                  style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 36, height: 36, borderRadius: 8, border: `1px solid ${T.border}`, background: T.surfaceAlt, color: T.textMuted, textDecoration: "none", transition: "all .2s" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = T.gold; e.currentTarget.style.color = T.gold; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.textMuted; }}>
                  {s.icon}
                </a>
              ))}
            </div>
            <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
              {[["#features","Features"],["#tools","23 Tools"],["#pricing","Pricing"],["#faq","FAQ"],["/terms","Terms"],["/privacy","Privacy"],["mailto:mianwaleed689@gmail.com","Contact"]].map(([href, label]) => (
                <a key={label} href={href} className="nav-link" style={{ fontSize: 12 }}>{label}</a>
              ))}
            </div>
          </div>
          <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 16, textAlign: "center" }}>
            <p style={{ fontSize: 11, color: T.textMuted }}>© 2026 DXB Analytics · Dubai, UAE · For informational purposes only — not financial or investment advice · Data sourced from DLD, developer IR reports, Knight Frank, ValuStrat</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
