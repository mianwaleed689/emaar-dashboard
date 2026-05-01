/* eslint-disable */
/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   DXB ANALYTICS — WORLD-CLASS LANDING PAGE
   Research: Linear, Superhuman, Stripe, Vercel, Notion, Bloomberg Terminal
   Design: Bento Grid · Glassmorphism · Dark Luxury · Gold Accent
   2026 Best Practices: Centered hero · Single CTA · Bento features ·
   Animated stats · Role selector · SVG icons · Micro-interactions
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
import React, { useState, useEffect, useRef } from "react";
import { db } from "../firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { useI18n } from "../i18n";
import { T } from "../theme";

const css = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=Fraunces:opsz,wght@9..144,300;9..144,700;9..144,900&display=swap');
*,*::before,*::after{margin:0;padding:0;box-sizing:border-box}
html{scroll-behavior:smooth;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}
body{background:#04090F;color:#E2E8F0;font-family:'Outfit',sans-serif;overflow-x:hidden}

@keyframes fadeUp{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:translateY(0)}}
@keyframes pulse{0%,100%{opacity:.3;transform:scale(1)}50%{opacity:1;transform:scale(1.3)}}
@keyframes ticker{from{transform:translateX(0)}to{transform:translateX(-50%)}}
@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}}
@keyframes shimmer{0%{background-position:-400% center}100%{background-position:400% center}}
@keyframes borderPulse{0%,100%{box-shadow:0 0 0 1px rgba(212,168,67,.2)}50%{box-shadow:0 0 0 1px rgba(212,168,67,.6),0 0 30px rgba(212,168,67,.1)}}
@keyframes countUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
@keyframes gradientMove{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
@keyframes scanLine{0%{top:-2px}100%{top:100%}}
@keyframes spin{to{transform:rotate(360deg)}}

.au{animation:fadeUp .8s cubic-bezier(.22,1,.36,1) both}

/* Primary CTA */
.cta{
  display:inline-flex;align-items:center;justify-content:center;gap:10px;
  padding:17px 44px;
  background:linear-gradient(135deg,#D4A843 0%,#E8C96A 50%,#D4A843 100%);
  background-size:200% auto;
  color:#04090F;border:none;border-radius:12px;
  font-family:'Outfit',sans-serif;font-size:16px;font-weight:800;
  cursor:pointer;transition:all .3s cubic-bezier(.22,1,.36,1);
  letter-spacing:-.3px;white-space:nowrap;text-decoration:none;
  position:relative;overflow:hidden;
}
.cta:hover{background-position:right center;transform:translateY(-3px);box-shadow:0 16px 40px rgba(212,168,67,.4)}
.cta:active{transform:scale(.98)}

/* Ghost button */
.ghost{
  display:inline-flex;align-items:center;justify-content:center;gap:8px;
  padding:16px 32px;background:rgba(212,168,67,.05);
  color:#D4A843;border:1px solid rgba(212,168,67,.3);border-radius:12px;
  font-family:'Outfit',sans-serif;font-size:15px;font-weight:600;
  cursor:pointer;transition:all .3s;white-space:nowrap;text-decoration:none;
}
.ghost:hover{background:rgba(212,168,67,.1);border-color:#D4A843;transform:translateY(-2px)}

/* Nav links */
.nav-link{color:#64748B;text-decoration:none;font-size:13.5px;font-weight:500;transition:color .2s}
.nav-link:hover{color:#D4A843}

/* Bento card */
.bento{
  background:rgba(14,29,53,.6);
  border:1px solid rgba(212,168,67,.1);
  border-radius:18px;padding:28px;
  backdrop-filter:blur(12px);
  -webkit-backdrop-filter:blur(12px);
  transition:all .35s cubic-bezier(.22,1,.36,1);
  position:relative;overflow:hidden;
}
.bento::before{
  content:'';position:absolute;inset:0;border-radius:18px;
  background:linear-gradient(135deg,rgba(212,168,67,.04) 0%,transparent 60%);
  opacity:0;transition:opacity .35s;pointer-events:none;
}
.bento:hover{
  border-color:rgba(212,168,67,.3);
  transform:translateY(-4px);
  box-shadow:0 24px 60px rgba(0,0,0,.5),0 0 0 1px rgba(212,168,67,.1);
}
.bento:hover::before{opacity:1}

/* Gold text shimmer */
.gold-text{
  background:linear-gradient(135deg,#D4A843,#E8C96A,#C89830,#E8C96A);
  background-size:300% auto;
  -webkit-background-clip:text;-webkit-text-fill-color:transparent;
  animation:shimmer 5s linear infinite;
}

/* Ticker */
.ticker-track{display:flex;gap:48px;animation:ticker 45s linear infinite;white-space:nowrap}

/* Role tabs */
.role-tab{
  padding:10px 24px;border-radius:10px;
  border:1px solid rgba(212,168,67,.15);background:transparent;
  color:#475569;font-size:13px;font-weight:600;
  cursor:pointer;transition:all .25s;font-family:'Outfit',sans-serif;
}
.role-tab:hover:not(.active-tab){border-color:rgba(212,168,67,.3);color:#94A3B8}
.active-tab{border-color:#D4A843!important;background:rgba(212,168,67,.1)!important;color:#D4A843!important}

/* FAQ */
.faq-btn{
  width:100%;text-align:left;background:none;border:none;
  cursor:pointer;padding:20px 0;
  display:flex;justify-content:space-between;align-items:center;
  font-family:'Outfit',sans-serif;
  border-bottom:1px solid rgba(212,168,67,.08);
  transition:all .2s;
}
.faq-btn:hover{border-color:rgba(212,168,67,.25)}

/* Tool pill */
.tool-pill{
  display:flex;align-items:center;gap:9px;
  padding:11px 14px;background:rgba(8,15,28,.8);
  border-radius:10px;border:1px solid rgba(212,168,67,.07);
  transition:all .25s;
}
.tool-pill:hover{
  background:rgba(14,29,53,.9);
  border-color:rgba(212,168,67,.28);
  transform:translateX(3px);
}

/* Stats counter */
.stat-num{
  font-family:'Fraunces',serif;font-size:40px;font-weight:900;
  color:#D4A843;line-height:1;
  animation:countUp .6s cubic-bezier(.22,1,.36,1) both;
}

/* Scan line effect on mockup */
.mockup-scan{position:relative;overflow:hidden}
.mockup-scan::after{
  content:'';position:absolute;left:0;right:0;height:2px;
  background:linear-gradient(90deg,transparent,rgba(212,168,67,.4),transparent);
  animation:scanLine 3.5s linear infinite;pointer-events:none;z-index:10;
}

/* Sticky bottom CTA bar */
.sticky-cta{
  position:fixed;bottom:0;left:0;right:0;
  background:rgba(4,9,15,.95);
  backdrop-filter:blur(20px);
  border-top:1px solid rgba(212,168,67,.15);
  padding:14px 32px;
  display:flex;align-items:center;justify-content:space-between;
  z-index:999;
  transform:translateY(100%);
  transition:transform .4s cubic-bezier(.22,1,.36,1);
}
.sticky-cta.visible{transform:translateY(0)}

@media(max-width:1024px){
  .two-col{grid-template-columns:1fr!important}
  .mockup-col{display:none!important}
  .three-col{grid-template-columns:1fr 1fr!important}
  .four-col{grid-template-columns:1fr 1fr!important}
  .tools-grid{grid-template-columns:repeat(3,1fr)!important}
  .pricing-grid{grid-template-columns:1fr!important}
  .bento-grid{grid-template-columns:1fr 1fr!important}
}
@media(max-width:768px){
  .lp-section{padding:64px 20px!important}
  .lp-nav{padding:0 20px!important}
  .nav-desktop{display:none!important}
  .hero-h1{font-size:38px!important;letter-spacing:-1px!important}
  .hero-btns{flex-direction:column!important;align-items:stretch!important}
  .three-col{grid-template-columns:1fr!important}
  .four-col{grid-template-columns:1fr!important}
  .tools-grid{grid-template-columns:repeat(2,1fr)!important}
  .bento-grid{grid-template-columns:1fr!important}
  .sticky-cta{display:none!important}
  .compare-t th,.compare-t td{padding:9px 8px!important;font-size:11px!important}
}
`;

/* â”€â”€ SVG ICON LIBRARY â”€â”€ */
const IC = {
  check:  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  close:  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  arrow:  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
  star:   <svg width="13" height="13" viewBox="0 0 24 24" fill="#D4A843"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  lock:   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D4A843" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
  globe:  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D4A843" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
  zap:    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D4A843" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
  db:     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D4A843" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>,
  trend:  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
};

const DXBLogo = ({ size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 40 40">
    <rect x="2" y="2" width="36" height="36" rx="9" fill="none" stroke="#D4A843" strokeWidth="2"/>
    <path d="M12 28V12h10l-6 8h8l-12 8z" fill="#D4A843"/>
  </svg>
);

const TOOLS = [
  ["01","Overview"],["02","Financials"],["03","Projects"],["04","Handover"],
  ["05","Launch Cal."],["06","Map"],["07","Neighbourhoods"],["08","Yields"],
  ["09","Competitors"],["10","ROI Calc"],["11","Flip Calc"],["12","Mortgage"],
  ["13","Risk"],["14","Price History"],["15","DLD Volumes"],["16","Currency"],
  ["17","Inv. Score"],["18","Golden Visa"],["19","STR vs LTR"],["20","Portfolio"],
  ["21","Srvc Charges"],["22","DXB Estimate"],["23","Market"],
];

const ROLES = {
  agent: {
    label: "Real Estate Agent",
    pain: "You spend 2+ hours preparing for every client meeting",
    gain: "Cut research to 30 seconds. Walk in with institutional-grade data.",
    wins: [
      "Full project financials, yields, and risk scores in one tap",
      "Send polished comparison reports to clients via WhatsApp instantly",
      "Never be caught off guard — price/sqft, handover, yield always ready",
    ],
    metric: "2+ hours saved per client",
    color: "#D4A843",
  },
  investor: {
    label: "Property Investor",
    pain: "You are making AED 2M+ decisions on broker estimates and brochures",
    gain: "Verify any deal in 30 seconds with DLD-verified data.",
    wins: [
      "Compare 3 projects side-by-side with verified yield and risk data",
      "See actual DLD transaction history — not marketing material",
      "Calculate exact ROI: long-term hold, Airbnb, or flip — before committing",
    ],
    metric: "Verify before you commit",
    color: "#14B8A6",
  },
  brokerage: {
    label: "Brokerage / Agency",
    pain: "Your team wastes hours every week on scattered, inconsistent data",
    gain: "Standardize your entire team on verified intelligence.",
    wins: [
      "Every agent researches the same way — consistent, fast, professional",
      "Win more pitches with institutional-quality analysis",
      "Track market movements days before your competitors notice them",
    ],
    metric: "One platform, whole team",
    color: "#8B5CF6",
  },
};

const FAQS = [
  ["Is there a free trial?", "Yes — every new account gets a 7-day Pro trial automatically. No credit card needed. Full access to all 23 tools and 208+ projects from day one."],
  ["Which developers are covered?", "7 major developers are live: Emaar (208 projects), DAMAC, Sobha, Nakheel, Meraas, Binghatti, and Aldar — across 13 Dubai communities. Phase 2 adds 3 more developers in Q3 2026."],
  ["How is the data verified?", "Every data point is sourced from official materials — developer annual reports, DLD transaction records, UAE Central Bank EIBOR rates — and each has its source displayed. We cross-reference with DXBinteract, ValuStrat, and Knight Frank."],
  ["How often does data update?", "Financial data updates within 24 hours of official developer releases. Project prices and handover dates are manually verified monthly. EIBOR rates update daily."],
  ["What makes this different from Bayut?", "Bayut has listings. DXB Analytics has intelligence. We provide 6 years of developer financials, 9-factor risk assessment, 3 ROI models, and live EIBOR mortgage calculations — none of which any listing portal offers."],
  ["Can I cancel anytime?", "Yes. No contracts, no cancellation fees. Cancel from your account settings and keep access until your billing period ends."],
  ["Do you support Arabic?", "Yes — Arabic and 19 other languages including Urdu, Hindi, Chinese, Russian, and French. Switch instantly from the navigation bar."],
];

export default function LandingPage({ onLoginClick, onSignUpClick }) {
  const { lang, setLang, LANGUAGES } = useI18n() || {};
  const [scrollY, setScrollY] = useState(0);
  const [openFaq, setOpenFaq] = useState(null);
  const [annual, setAnnual] = useState(false);
  const [role, setRole] = useState("agent");
  const [stats, setStats] = useState({ users: 24, projects: 208 });
  const [showSticky, setShowSticky] = useState(false);

  useEffect(() => {
    try {
      const unsub = onSnapshot(doc(db, "adminSettings", "publicStats"), snap => {
        if (snap.exists()) {
          const d = snap.data();
          setStats(p => ({ ...p, users: d.totalUsers || p.users, projects: d.totalProjects || p.projects }));
        }
      });
      return () => unsub();
    } catch {}
  }, []);

  useEffect(() => {
    const fn = () => {
      setScrollY(window.scrollY);
      setShowSticky(window.scrollY > 700);
    };
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const proPrice = annual ? 79 : 99;
  const entPrice = annual ? 399 : 499;
  const r = ROLES[role];
  const navBg = scrollY > 60;

  const SectionTag = ({ text }) => (
    <div style={{ fontSize: 10, fontWeight: 700, color: "#D4A843", letterSpacing: 3.5, textTransform: "uppercase", marginBottom: 14 }}>
      {text}
    </div>
  );

  const H2 = ({ children, style = {} }) => (
    <h2 style={{ fontFamily: "'Fraunces',serif", fontSize: 38, fontWeight: 900, color: "#F1F5F9", letterSpacing: "-1px", lineHeight: 1.1, ...style }}>
      {children}
    </h2>
  );

  return (
    <div style={{ background: "#04090F", color: "#E2E8F0", fontFamily: "'Outfit',sans-serif" }}>
      <style>{css}</style>

      {/* â•â•â•â•â•â•â• STICKY CTA BAR â•â•â•â•â•â•â• */}
      <div className={`sticky-cta${showSticky ? " visible" : ""}`}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <DXBLogo size={24}/>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#F1F5F9" }}>DXB Analytics</div>
            <div style={{ fontSize: 11, color: "#475569" }}>Dubai's #1 real estate intelligence platform</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 12, color: "#475569" }}>7-day free trial · No card needed</span>
          <button onClick={onSignUpClick} className="cta" style={{ padding: "10px 28px", fontSize: 14 }}>
            Start Free Trial
          </button>
        </div>
      </div>

      {/* â•â•â•â•â•â•â• NAVBAR â•â•â•â•â•â•â• */}
      <nav className="lp-nav" style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 500,
        padding: "0 48px", height: 64,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: navBg ? "rgba(4,9,15,.96)" : "transparent",
        backdropFilter: navBg ? "blur(24px)" : "none",
        borderBottom: navBg ? "1px solid rgba(212,168,67,.1)" : "1px solid transparent",
        transition: "all .4s cubic-bezier(.22,1,.36,1)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <DXBLogo/>
          <span style={{ fontFamily: "'Fraunces',serif", fontSize: 17, fontWeight: 900, color: "#D4A843", letterSpacing: "-.3px" }}>DXB Analytics</span>
        </div>
        <div className="nav-desktop" style={{ display: "flex", alignItems: "center", gap: 32 }}>
          {[["#features","Features"],["#tools","23 Tools"],["#pricing","Pricing"],["#faq","FAQ"]].map(([href,label]) => (
            <a key={label} href={href} className="nav-link">{label}</a>
          ))}
          {setLang && LANGUAGES && (
            <select value={lang} onChange={e => setLang(e.target.value)} style={{ padding: "5px 8px", background: "rgba(255,255,255,.04)", border: "1px solid rgba(212,168,67,.14)", borderRadius: 7, color: "#64748B", fontSize: 12, fontFamily: "'Outfit',sans-serif", cursor: "pointer", outline: "none" }}>
              {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.nativeName}</option>)}
            </select>
          )}
          <button onClick={onLoginClick} className="ghost" style={{ padding: "7px 18px", fontSize: 13 }}>Login</button>
          <button onClick={onSignUpClick} className="cta" style={{ padding: "9px 24px", fontSize: 13 }}>Try Free 7 Days</button>
        </div>
      </nav>

      {/* â•â•â•â•â•â•â• HERO â•â•â•â•â•â•â• */}
      <section className="lp-section" style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "140px 48px 80px", position: "relative", overflow: "hidden", textAlign: "center" }}>
        {/* Background grid */}
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(212,168,67,.025) 1px,transparent 1px),linear-gradient(90deg,rgba(212,168,67,.025) 1px,transparent 1px)", backgroundSize: "80px 80px", pointerEvents: "none" }}/>
        {/* Radial glows */}
        <div style={{ position: "absolute", top: "-15%", left: "50%", transform: "translateX(-50%)", width: 1000, height: 800, borderRadius: "50%", background: "radial-gradient(ellipse,rgba(212,168,67,.07) 0%,transparent 60%)", pointerEvents: "none" }}/>
        <div style={{ position: "absolute", bottom: "5%", right: "0%", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(ellipse,rgba(20,184,166,.04) 0%,transparent 60%)", pointerEvents: "none" }}/>

        <div style={{ position: "relative", zIndex: 1, maxWidth: 820, width: "100%" }}>
          {/* Live badge */}
          <div className="au" style={{ animationDelay: "0s", display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 18px", borderRadius: 24, background: "rgba(16,185,129,.07)", border: "1px solid rgba(16,185,129,.2)", marginBottom: 36 }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#10B981", display: "inline-block", animation: "pulse 2s infinite" }}/>
            <span style={{ fontSize: 10, fontWeight: 700, color: "#10B981", letterSpacing: 2 }}>LIVE — DUBAI REAL ESTATE INTELLIGENCE</span>
          </div>

          {/* Hero headline — Superhuman model: quantified outcome */}
          <h1 className="au hero-h1" style={{ animationDelay: ".05s", fontFamily: "'Fraunces',serif", fontSize: 68, fontWeight: 900, lineHeight: 1.04, letterSpacing: "-2.5px", marginBottom: 26 }}>
            <span style={{ color: "#F1F5F9", display: "block" }}>Your next deal is already</span>
            <span className="gold-text" style={{ display: "block" }}>in the data.</span>
          </h1>

          {/* Sub */}
          <p className="au" style={{ animationDelay: ".1s", fontSize: 19, color: "#94A3B8", lineHeight: 1.75, maxWidth: 620, margin: "0 auto 44px" }}>
            Dubai's most complete real estate intelligence platform — used by agents, investors, and brokerages who refuse to guess. 208 projects, 7 developers, live DLD data.
          </p>

          {/* Single primary CTA — Stripe/Linear model */}
          <div className="au hero-btns" style={{ animationDelay: ".15s", display: "flex", gap: 14, justifyContent: "center", marginBottom: 20, flexWrap: "wrap" }}>
            <button onClick={onSignUpClick} className="cta" style={{ padding: "19px 52px", fontSize: 17, gap: 12 }}>
              Start Free — No Card Needed
              <span style={{ display: "inline-flex" }}>{IC.arrow}</span>
            </button>
            <button onClick={onLoginClick} className="ghost" style={{ padding: "18px 32px", fontSize: 16 }}>
              Login
            </button>
          </div>

          <p className="au" style={{ animationDelay: ".2s", fontSize: 12, color: "#334155" }}>
            7-day Pro trial · Cancel anytime · {stats.users}+ professionals already inside
          </p>

          {/* Trust logos — immediately below CTA (proven best practice) */}
          <div className="au" style={{ animationDelay: ".25s", marginTop: 56, paddingTop: 44, borderTop: "1px solid rgba(212,168,67,.08)" }}>
            <p style={{ fontSize: 10, color: "#334155", letterSpacing: 2.5, textTransform: "uppercase", marginBottom: 20 }}>Data Verified By</p>
            <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
              {["Dubai Land Department","Emaar Annual Reports","DAMAC IR","Sobha IR","Knight Frank","ValuStrat","DXBinteract","UAE Central Bank"].map((src,i) => (
                <span key={i} style={{ fontSize: 11, color: "#475569", padding: "5px 14px", borderRadius: 8, background: "rgba(8,15,28,.8)", border: "1px solid rgba(212,168,67,.07)" }}>{src}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Dashboard Mockup */}
        <div className="au mockup-col" style={{ animationDelay: ".3s", position: "relative", zIndex: 1, marginTop: 64, width: "100%", maxWidth: 1050 }}>
          <div className="mockup-scan" style={{ borderRadius: 18, border: "1px solid rgba(212,168,67,.2)", overflow: "hidden", boxShadow: "0 60px 120px rgba(0,0,0,.8),0 0 0 1px rgba(212,168,67,.04)", animation: "float 8s ease-in-out infinite" }}>
            {/* Browser bar */}
            <div style={{ background: "#040D1A", borderBottom: "1px solid rgba(212,168,67,.08)", padding: "10px 16px", display: "flex", alignItems: "center", gap: 8 }}>
              {[["#EF4444"],["#F59E0B"],["#10B981"]].map(([c],i) => <div key={i} style={{ width: 10, height: 10, borderRadius: "50%", background: c }}/>)}
              <div style={{ flex: 1, margin: "0 12px", background: "rgba(255,255,255,.03)", borderRadius: 6, padding: "4px 14px", display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10B981", display: "inline-block", boxShadow: "0 0 6px #10B981" }}/>
                <span style={{ fontSize: 10, color: "#334155" }}>emaar-dashboard.vercel.app/dashboard</span>
              </div>
              <div style={{ fontSize: 9, color: "#10B981", fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#10B981", display: "inline-block" }}/>LIVE
              </div>
            </div>
            {/* App layout */}
            <div style={{ display: "flex", height: 500, background: "#04090F" }}>
              {/* Sidebar */}
              <div style={{ width: 168, background: "#080F1C", borderRight: "1px solid rgba(212,168,67,.06)", padding: "10px 0", flexShrink: 0, display: "flex", flexDirection: "column" }}>
                <div style={{ padding: "0 12px 10px", borderBottom: "1px solid rgba(212,168,67,.06)", marginBottom: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <DXBLogo size={20}/>
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#D4A843" }}>DXB Analytics</span>
                  </div>
                </div>
                <div style={{ padding: "5px 10px", margin: "0 8px 10px", background: "rgba(212,168,67,.06)", borderRadius: 8, border: "1px solid rgba(212,168,67,.12)" }}>
                  <div style={{ fontSize: 7, color: "#334155", marginBottom: 2, textTransform: "uppercase", letterSpacing: 1 }}>Developer</div>
                  <div style={{ fontSize: 10, color: "#D4A843", fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
                    <span style={{ width: 4, height: 4, borderRadius: "50%", background: "#10B981", display: "inline-block" }}/>
                    Emaar Properties
                  </div>
                </div>
                <div style={{ fontSize: 7, color: "#1E3A5F", padding: "0 12px 4px", textTransform: "uppercase", letterSpacing: 1.5 }}>Intelligence</div>
                {[["Overview",true],["Projects",false],["Yields",false],["Map",false],["Mortgage",false],["Portfolio",false],["Risk",false]].map(([t,a]) => (
                  <div key={t} style={{ padding: "7px 12px", fontSize: 10, color: a?"#D4A843":"#334155", background: a?"rgba(212,168,67,.07)":"transparent", borderRight: a?"2px solid #D4A843":"none", display: "flex", alignItems: "center", gap: 7 }}>
                    <span style={{ width: 4, height: 4, borderRadius: "50%", background: a?"#D4A843":"#0F172A", display: "inline-block", flexShrink: 0 }}/>
                    {t}
                  </div>
                ))}
                <div style={{ marginTop: 10, fontSize: 7, color: "#1E3A5F", padding: "0 12px 4px", textTransform: "uppercase", letterSpacing: 1.5 }}>CRM</div>
                {["Leads","Clients"].map(t => (
                  <div key={t} style={{ padding: "7px 12px", fontSize: 10, color: "#1E293B", display: "flex", alignItems: "center", gap: 7 }}>
                    <span style={{ width: 4, height: 4, borderRadius: "50%", background: "#0F172A", display: "inline-block", flexShrink: 0 }}/>
                    {t}
                  </div>
                ))}
              </div>
              {/* Main content */}
              <div style={{ flex: 1, padding: "12px 15px", display: "flex", flexDirection: "column", gap: 11, overflow: "hidden" }}>
                {/* Top bar */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 10, borderBottom: "1px solid rgba(212,168,67,.05)" }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#F1F5F9" }}>Overview · Emaar Properties</div>
                    <div style={{ fontSize: 7.5, color: "#334155", marginTop: 1 }}>FY 2025 · Verified 29 Mar 2026 · Source: Emaar Annual Report + DLD</div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <div style={{ fontSize: 7.5, padding: "3px 9px", borderRadius: 6, background: "rgba(16,185,129,.08)", border: "1px solid rgba(16,185,129,.18)", color: "#10B981", fontWeight: 700 }}>EMAAR.DU +2.1% AED 15.40</div>
                    <div style={{ fontSize: 7.5, padding: "3px 9px", borderRadius: 6, background: "rgba(212,168,67,.08)", border: "1px solid rgba(212,168,67,.18)", color: "#D4A843", fontWeight: 700 }}>Firestore LIVE</div>
                  </div>
                </div>
                {/* KPI cards */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8 }}>
                  {[["Property Sales","AED 80.4B","+16% YoY","#D4A843"],["Net Profit","AED 25.7B","+36% YoY","#10B981"],["Rev. Backlog","AED 155B","+39% YoY","#14B8A6"],["Gross Margin","57.5%","Industry #1","#8B5CF6"]].map(([l,v,t,c],i) => (
                    <div key={i} style={{ background: "#080F1C", borderRadius: 9, padding: "9px 10px", border: "1px solid rgba(212,168,67,.05)" }}>
                      <div style={{ fontSize: 6.5, color: "#334155", marginBottom: 4 }}>{l}</div>
                      <div style={{ fontFamily: "serif", fontSize: 14, fontWeight: 900, color: c, lineHeight: 1 }}>{v}</div>
                      <div style={{ fontSize: 6.5, color: c, opacity: .75, marginTop: 3, display: "flex", alignItems: "center", gap: 2 }}>
                        {IC.trend}{t}
                      </div>
                    </div>
                  ))}
                </div>
                {/* Chart + projects */}
                <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 10, flex: 1, minHeight: 0 }}>
                  <div style={{ background: "#080F1C", borderRadius: 10, border: "1px solid rgba(212,168,67,.05)", padding: "9px 12px", overflow: "hidden" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 9 }}>
                      <span style={{ fontSize: 7.5, fontWeight: 700, color: "#475569" }}>Revenue vs Profit (AED B)</span>
                      <div style={{ display: "flex", gap: 8 }}>
                        {[["#D4A843","Revenue"],["#14B8A6","Profit"]].map(([c,l]) => (
                          <span key={l} style={{ fontSize: 6.5, color: "#334155", display: "flex", alignItems: "center", gap: 3 }}>
                            <span style={{ width: 10, height: 2, background: c, display: "inline-block", borderRadius: 1 }}/>{l}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 80 }}>
                      {[[14.6,2.6,"2020"],[17,4.1,"2021"],[24.5,6.2,"2022"],[30.6,12.6,"2023"],[35.4,18.9,"2024"],[49.6,25.7,"2025"]].map(([r,p,yr],i) => (
                        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                          <div style={{ width: "100%", position: "relative", height: `${Math.round((r/49.6)*74)}px` }}>
                            <div style={{ position: "absolute", bottom: 0, width: "100%", height: "100%", background: i===5?"#D4A843":`rgba(212,168,67,${.1+i*.07})`, borderRadius: "3px 3px 0 0" }}/>
                            <div style={{ position: "absolute", bottom: 0, width: "55%", left: "22%", height: `${Math.round((p/49.6)*74)}px`, background: "#14B8A6", opacity: .85, borderRadius: "3px 3px 0 0" }}/>
                          </div>
                          <div style={{ fontSize: 6, color: i===5?"#D4A843":"#334155", fontWeight: i===5?700:400 }}>{yr}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <div style={{ background: "#080F1C", borderRadius: 9, border: "1px solid rgba(212,168,67,.05)", padding: "8px 10px", flex: 1 }}>
                      <div style={{ fontSize: 7.5, fontWeight: 700, color: "#475569", marginBottom: 8 }}>Top Projects by Score</div>
                      {[["Dubai Creek Harbour","7.2%",94,"#10B981"],["The Oasis","6.8%",91,"#D4A843"],["Emaar Beachfront","7.5%",88,"#14B8A6"]].map(([n,y,s,c],i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 7, padding: "5px 0", borderBottom: i<2?"1px solid rgba(255,255,255,.03)":"none" }}>
                          <div style={{ width: 20, height: 20, borderRadius: 6, background: `${c}14`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, fontWeight: 900, color: c, flexShrink: 0 }}>{s}</div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 8, fontWeight: 600, color: "#F1F5F9", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{n}</div>
                            <div style={{ fontSize: 6.5, color: c }}>Yield {y}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div style={{ background: "rgba(212,168,67,.04)", borderRadius: 8, border: "1px solid rgba(212,168,67,.12)", padding: "8px 10px" }}>
                      <div style={{ fontSize: 8, color: "#475569", lineHeight: 1.55 }}>
                        <span style={{ color: "#D4A843", fontWeight: 700 }}>âœ¦ AI: </span>
                        Backlog AED 155B = 3-4yr revenue visibility. Strongest GCC coverage ratio.
                      </div>
                    </div>
                  </div>
                </div>
                {/* Bottom stats */}
                <div style={{ display: "flex", gap: 6, paddingTop: 8, borderTop: "1px solid rgba(212,168,67,.04)" }}>
                  {[["208","Projects","#3B82F6"],["13","Communities","#8B5CF6"],["6.9%","Avg Yield","#10B981"],["AED 2.00","EPS 2025","#D4A843"],["20","Languages","#14B8A6"]].map(([v,l,c]) => (
                    <div key={l} style={{ flex: 1, textAlign: "center", padding: "5px 0", background: "#080F1C", borderRadius: 6, border: "1px solid rgba(255,255,255,.02)" }}>
                      <div style={{ fontSize: 10, fontWeight: 800, color: c }}>{v}</div>
                      <div style={{ fontSize: 6, color: "#334155" }}>{l}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Hero stats */}
        <div className="au" style={{ animationDelay: ".35s", position: "relative", zIndex: 1, display: "flex", gap: 48, justifyContent: "center", marginTop: 56, flexWrap: "wrap" }}>
          {[
            { n: `${stats.projects}+`, l: "Projects Tracked" },
            { n: "7", l: "Developers Live" },
            { n: "AED 919B", l: "Dubai Market 2025" },
            { n: "23", l: "Pro Tools" },
            { n: "20", l: "Languages" },
          ].map((s,i) => (
            <div key={i} style={{ textAlign: "center", animation: `countUp .6s cubic-bezier(.22,1,.36,1) ${.35+i*.06}s both`, opacity: 0 }}>
              <div className="stat-num">{s.n}</div>
              <div style={{ fontSize: 11, color: "#334155", marginTop: 5, letterSpacing: .5 }}>{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* â•â•â•â•â•â•â• TICKER â•â•â•â•â•â•â• */}
      <div style={{ borderTop: "1px solid rgba(212,168,67,.08)", borderBottom: "1px solid rgba(212,168,67,.08)", background: "#080F1C", padding: "13px 0", overflow: "hidden" }}>
        <div className="ticker-track">
          {[...Array(2)].map((_,ri) => (
            <React.Fragment key={ri}>
              {["AED 919B Total Market 2025","214,912 DLD Transactions","208 Emaar Projects","7 Developers Live","6 Years Financial Data","9-Factor Risk Score","EIBOR Live Rate","20 Languages","AED 80.4B Emaar Sales 2025"].map((t,i) => (
                <span key={`${ri}-${i}`} style={{ fontSize: 11.5, color: "#334155", display: "inline-flex", alignItems: "center", gap: 16, flexShrink: 0 }}>
                  <span style={{ width: 3, height: 3, borderRadius: "50%", background: "#D4A843", opacity: .5 }}/>
                  {t}
                </span>
              ))}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* â•â•â•â•â•â•â• ROLE-BASED VALUE PROP â•â•â•â•â•â•â• */}
      <section className="lp-section" style={{ padding: "100px 48px", background: "linear-gradient(180deg,#04090F,#060F1E 30%,#060F1E 70%,#04090F)" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <SectionTag text="Built For You"/>
            <H2>Stop guessing.<br/>Start knowing.</H2>
            <p style={{ fontSize: 16, color: "#64748B", marginTop: 16, maxWidth: 500, margin: "16px auto 28px" }}>
              Different professionals, same problem — scattered, unverified data.
            </p>
            <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
              {Object.entries(ROLES).map(([k,v]) => (
                <button key={k} type="button" className={`role-tab${role===k?" active-tab":""}`} onClick={() => setRole(k)}>
                  {v.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }} className="two-col">
            <div style={{ background: "rgba(239,68,68,.03)", border: "1px solid rgba(239,68,68,.15)", borderRadius: 20, padding: 36 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#EF4444", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
                {IC.close} Before DXB Analytics
              </div>
              <div style={{ fontFamily: "'Fraunces',serif", fontSize: 21, color: "#F1F5F9", lineHeight: 1.4, marginBottom: 24, fontWeight: 700 }}>
                "{r.pain}"
              </div>
              {["Scattered across Bayut, Property Finder, WhatsApp, Excel","Hours wasted on research per client or deal","Unverified yields from marketing brochures","Losing deals to better-prepared competitors"].map((p,i) => (
                <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: 13, color: "#64748B", padding: "6px 0" }}>
                  <span style={{ flexShrink: 0, marginTop: 2 }}>{IC.close}</span>{p}
                </div>
              ))}
            </div>

            <div style={{ background: "rgba(16,185,129,.03)", border: "1px solid rgba(16,185,129,.15)", borderRadius: 20, padding: 36 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#10B981", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
                {IC.check} After DXB Analytics
              </div>
              <div style={{ fontFamily: "'Fraunces',serif", fontSize: 21, color: "#F1F5F9", lineHeight: 1.4, marginBottom: 24, fontWeight: 700 }}>
                "{r.gain}"
              </div>
              {r.wins.map((w,i) => (
                <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: 13, color: "#94A3B8", padding: "6px 0" }}>
                  <span style={{ flexShrink: 0, marginTop: 2 }}>{IC.check}</span>{w}
                </div>
              ))}
              <div style={{ marginTop: 24, padding: "11px 18px", background: "rgba(16,185,129,.07)", border: "1px solid rgba(16,185,129,.15)", borderRadius: 12, display: "inline-flex", alignItems: "center", gap: 10 }}>
                <span style={{ display: "inline-flex" }}>{IC.zap}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#10B981" }}>{r.metric}</span>
              </div>
            </div>
          </div>

          <div style={{ textAlign: "center", marginTop: 44 }}>
            <button onClick={onSignUpClick} className="cta" style={{ padding: "16px 44px", fontSize: 15 }}>
              Start Free — No Card Needed
            </button>
          </div>
        </div>
      </section>

      {/* â•â•â•â•â•â•â• BENTO FEATURES â•â•â•â•â•â•â• */}
      <section id="features" className="lp-section" style={{ padding: "100px 48px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 60 }}>
            <SectionTag text="Intelligence Layer"/>
            <H2>Everything a professional<br/>needs. Nothing they don't.</H2>
            <p style={{ fontSize: 15, color: "#64748B", marginTop: 14, maxWidth: 480, margin: "14px auto 0" }}>
              Built for Dubai's most demanding agents, investors, and institutions.
            </p>
          </div>

          {/* Bento grid — Apple/Linear style */}
          <div className="bento-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
            {/* Large card spanning 2 cols */}
            <div className="bento" style={{ gridColumn: "span 2" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#D4A843", letterSpacing: 2, textTransform: "uppercase", marginBottom: 16 }}>01 — Developer Financials</div>
              <h3 style={{ fontFamily: "'Fraunces',serif", fontSize: 24, fontWeight: 900, color: "#F1F5F9", marginBottom: 14, lineHeight: 1.2 }}>6 years of financial data, sourced directly from annual reports</h3>
              <p style={{ fontSize: 13, color: "#64748B", lineHeight: 1.7, maxWidth: 480 }}>Revenue, net profit, EPS, revenue backlog, gross margin — cross-referenced with DXBinteract and DLD for Emaar, DAMAC, Sobha, Nakheel, Meraas, Binghatti, and Aldar.</p>
              <div style={{ display: "flex", gap: 10, marginTop: 20, flexWrap: "wrap" }}>
                {[["AED 80.4B","Emaar Sales 2025"],["AED 155B","Revenue Backlog"],["57.5%","Gross Margin"]].map(([v,l]) => (
                  <div key={l} style={{ padding: "8px 16px", background: "rgba(212,168,67,.06)", border: "1px solid rgba(212,168,67,.12)", borderRadius: 10 }}>
                    <div style={{ fontSize: 16, fontWeight: 900, color: "#D4A843", fontFamily: "'Fraunces',serif" }}>{v}</div>
                    <div style={{ fontSize: 10, color: "#475569", marginTop: 2 }}>{l}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right tall card */}
            <div className="bento" style={{ background: "rgba(16,185,129,.04)", borderColor: "rgba(16,185,129,.15)" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#10B981", letterSpacing: 2, textTransform: "uppercase", marginBottom: 16 }}>02 — Risk Assessment</div>
              <h3 style={{ fontFamily: "'Fraunces',serif", fontSize: 20, fontWeight: 900, color: "#F1F5F9", marginBottom: 14, lineHeight: 1.2 }}>9-Factor Risk Matrix</h3>
              <p style={{ fontSize: 12, color: "#64748B", lineHeight: 1.65 }}>Quantified score per project: market, regulatory, supply, liquidity, construction, handover, legal, developer health, demand.</p>
              <div style={{ marginTop: 20 }}>
                {[["Market Risk","Low","#10B981",85],["Supply Risk","Medium","#F59E0B",60],["Developer Risk","Very Low","#10B981",92]].map(([l,r,c,pct]) => (
                  <div key={l} style={{ marginBottom: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                      <span style={{ fontSize: 11, color: "#475569" }}>{l}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: c }}>{r}</span>
                    </div>
                    <div style={{ height: 4, background: "rgba(255,255,255,.06)", borderRadius: 2, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: c, borderRadius: 2 }}/>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom row — 3 equal cards */}
            {[
              { n: "03", title: "Project Intelligence", desc: "208+ projects with price/sqft, payment plan, construction %, and handover timeline.", accent: "#8B5CF6" },
              { n: "04", title: "Yield & ROI Calculator", desc: "Gross/net yields by community. Three ROI models: long-term, Airbnb, or flip.", accent: "#14B8A6" },
              { n: "05", title: "Live EIBOR Mortgage", desc: "Real-time EIBOR-based calculator. Monthly payment, total cost, all UAE DLD fees.", accent: "#D4A843" },
            ].map((f,i) => (
              <div key={i} className="bento">
                <div style={{ fontSize: 10, fontWeight: 700, color: f.accent, letterSpacing: 2, textTransform: "uppercase", marginBottom: 14 }}>{f.n}</div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: "#F1F5F9", marginBottom: 10 }}>{f.title}</h3>
                <p style={{ fontSize: 12, color: "#64748B", lineHeight: 1.65 }}>{f.desc}</p>
              </div>
            ))}

            {/* Wide card */}
            <div className="bento" style={{ gridColumn: "span 2", background: "rgba(59,130,246,.03)", borderColor: "rgba(59,130,246,.15)" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#3B82F6", letterSpacing: 2, textTransform: "uppercase", marginBottom: 14 }}>06 — 3-Project Comparison</div>
              <h3 style={{ fontFamily: "'Fraunces',serif", fontSize: 20, fontWeight: 900, color: "#F1F5F9", marginBottom: 14 }}>Side-by-side intelligence. Share via WhatsApp in one tap.</h3>
              <p style={{ fontSize: 13, color: "#64748B", lineHeight: 1.7, maxWidth: 480 }}>Compare any 3 projects on price, yield, risk score, handover, payment plan, and ROI. Built for agents who need to close on the spot.</p>
            </div>

            <div className="bento" style={{ background: "rgba(139,92,246,.04)", borderColor: "rgba(139,92,246,.15)" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#8B5CF6", letterSpacing: 2, textTransform: "uppercase", marginBottom: 14 }}>07 — Golden Visa</div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "#F1F5F9", marginBottom: 10 }}>Auto-flag AED 2M+ projects</h3>
              <p style={{ fontSize: 12, color: "#64748B", lineHeight: 1.65 }}>Instantly surface all projects eligible for UAE 10-year Golden Visa residency.</p>
            </div>
          </div>
        </div>
      </section>

      {/* â•â•â•â•â•â•â• 23 TOOLS â•â•â•â•â•â•â• */}
      <section id="tools" className="lp-section" style={{ padding: "80px 48px", background: "linear-gradient(180deg,#04090F,#060F1E 20%,#060F1E 80%,#04090F)" }}>
        <div style={{ maxWidth: 1040, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 52 }}>
            <SectionTag text="23 Professional Tools"/>
            <H2>One platform.<br/>Every tool you need to win.</H2>
            <p style={{ fontSize: 14, color: "#64748B", marginTop: 14, maxWidth: 480, margin: "14px auto 0" }}>
              Bayut has listings. Property Finder has listings.<br/>DXB Analytics has intelligence.
            </p>
          </div>
          <div className="tools-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8 }}>
            {TOOLS.map(([n,label]) => (
              <div key={n} className="tool-pill">
                <span style={{ fontFamily: "'Fraunces',serif", fontSize: 10, fontWeight: 900, color: "rgba(212,168,67,.3)", minWidth: 20 }}>{n}</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: "#475569" }}>{label}</span>
              </div>
            ))}
          </div>
          <div style={{ textAlign: "center", marginTop: 36 }}>
            <button onClick={onSignUpClick} className="cta" style={{ padding: "14px 40px" }}>
              Unlock All 23 Tools
            </button>
            <p style={{ fontSize: 11, color: "#334155", marginTop: 10 }}>Free: 5 tabs · Pro: everything · 7-day trial</p>
          </div>
        </div>
      </section>

      {/* â•â•â•â•â•â•â• COMPARISON TABLE â•â•â•â•â•â•â• */}
      <section className="lp-section" style={{ padding: "80px 48px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 52 }}>
            <SectionTag text="Why DXB Analytics"/>
            <H2>More than a portal.<br/>An intelligence layer.</H2>
          </div>
          <div style={{ borderRadius: 18, border: "1px solid rgba(212,168,67,.1)", overflow: "hidden" }}>
            <table className="compare-t" style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#060F1E" }}>
                  <th style={{ padding: "16px 22px", textAlign: "left", color: "#334155", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>Capability</th>
                  {["Bayut","Property Finder","DXB Analytics"].map((p,i) => (
                    <th key={p} style={{ padding: "16px 22px", textAlign: "center", color: i===2?"#D4A843":"#475569", fontSize: 13, fontWeight: 700, background: i===2?"rgba(212,168,67,.04)":"transparent", borderLeft: "1px solid rgba(212,168,67,.06)" }}>{p}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ["Property listings",          ["Yes","Yes","Yes"]],
                  ["Developer financials (6yr)",  ["No","No","Yes"]],
                  ["Verified rental yields",      ["Basic","Basic","Full + net"]],
                  ["ROI calculators",             ["No","No","3 models"]],
                  ["9-factor risk score",         ["No","No","Yes"]],
                  ["3-project comparison",        ["No","No","Yes"]],
                  ["WhatsApp share",              ["No","No","Yes"]],
                  ["Live EIBOR calculator",       ["Basic","Basic","Yes"]],
                  ["Golden Visa filter",          ["No","No","Yes"]],
                  ["DLD transaction history",     ["No","No","Yes"]],
                  ["Arabic + 19 languages",       ["Yes","Yes","Yes"]],
                  ["Price",                       ["Free","Free","AED 99/mo"]],
                ].map(([f,v],i) => (
                  <tr key={i} style={{ borderTop: "1px solid rgba(212,168,67,.05)", transition: "background .2s" }}
                    onMouseEnter={e => e.currentTarget.style.background="rgba(212,168,67,.02)"}
                    onMouseLeave={e => e.currentTarget.style.background="transparent"}>
                    <td style={{ padding: "12px 22px", fontSize: 13, color: "#64748B" }}>{f}</td>
                    {v.map((val,j) => (
                      <td key={j} style={{ padding: "12px 22px", textAlign: "center", fontSize: 13, background: j===2?"rgba(212,168,67,.02)":"transparent", borderLeft: "1px solid rgba(212,168,67,.05)", color: j===2?(val==="No"?"#334155":"#D4A843"):(val==="Yes"?"#10B981":val==="No"?"#1E293B":"#94A3B8"), fontWeight: j===2?600:400 }}>
                        {val==="Yes"?<span style={{ color: j===2?"#D4A843":"#10B981", fontWeight: 700 }}>âœ“</span>:val==="No"?<span style={{ color: "#1E293B" }}>—</span>:val}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* â•â•â•â•â•â•â• PRICING â•â•â•â•â•â•â• */}
      <section id="pricing" className="lp-section" style={{ padding: "100px 48px", background: "linear-gradient(180deg,#04090F,#060F1E 20%,#060F1E 80%,#04090F)" }}>
        <div style={{ maxWidth: 1080, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 52 }}>
            <SectionTag text="Pricing"/>
            <H2>One deal pays for<br/>two years of Pro.</H2>
            <p style={{ fontSize: 14, color: "#64748B", marginTop: 14 }}>Start free. Upgrade when you're ready.</p>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 3, marginTop: 28, padding: 4, background: "#080F1C", borderRadius: 12, border: "1px solid rgba(212,168,67,.1)" }}>
              {[{key:false,label:"Monthly"},{key:true,label:"Annual",badge:"SAVE 20%"}].map(({key,label,badge}) => (
                <button key={String(key)} type="button" onClick={() => setAnnual(key)}
                  style={{ padding: "9px 22px", borderRadius: 9, border: "none", background: annual===key?"#D4A843":"transparent", color: annual===key?"#04090F":"#475569", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Outfit',sans-serif", transition: "all .25s", display: "flex", alignItems: "center", gap: 7 }}>
                  {label}
                  {badge && <span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 5, background: annual===key?"rgba(4,9,15,.2)":"rgba(16,185,129,.15)", color: annual===key?"rgba(4,9,15,.8)":"#10B981", fontWeight: 700 }}>{badge}</span>}
                </button>
              ))}
            </div>
          </div>

          <div className="pricing-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20, alignItems: "start" }}>
            {/* FREE */}
            <div className="bento" style={{ borderRadius: 20, padding: 36 }}>
              <h3 style={{ fontSize: 22, fontWeight: 700, color: "#F1F5F9", marginBottom: 8 }}>Free</h3>
              <p style={{ fontSize: 12, color: "#334155", marginBottom: 28 }}>Explore the platform</p>
              <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 32 }}>
                <span style={{ fontSize: 12, color: "#334155" }}>AED</span>
                <span style={{ fontFamily: "'Fraunces',serif", fontSize: 56, fontWeight: 900, color: "#F1F5F9", lineHeight: 1 }}>0</span>
                <span style={{ fontSize: 12, color: "#334155" }}>forever</span>
              </div>
              {["5 project previews","Basic market overview","Community directory","Currency converter"].map((f,i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0", fontSize: 13, color: "#64748B" }}>
                  <span style={{ flexShrink: 0 }}>{IC.check}</span>{f}
                </div>
              ))}
              <button onClick={() => onSignUpClick && onSignUpClick("free")} className="ghost" style={{ width: "100%", marginTop: 32, padding: "13px 0", justifyContent: "center" }}>
                Get Started Free
              </button>
            </div>

            {/* PRO */}
            <div style={{ background: "rgba(14,29,53,.8)", borderRadius: 20, padding: 36, border: "2px solid #D4A843", position: "relative", boxShadow: "0 0 60px rgba(212,168,67,.1)", animation: "borderPulse 3s ease-in-out infinite", backdropFilter: "blur(12px)" }}>
              <div style={{ position: "absolute", top: -15, left: "50%", transform: "translateX(-50%)", padding: "5px 20px", borderRadius: 14, background: "linear-gradient(135deg,#D4A843,#E8C96A)", color: "#04090F", fontSize: 10, fontWeight: 800, whiteSpace: "nowrap", letterSpacing: .5 }}>
                MOST POPULAR
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <h3 style={{ fontSize: 22, fontWeight: 700, color: "#F1F5F9" }}>Pro</h3>
                <span style={{ fontSize: 9, padding: "4px 10px", borderRadius: 7, background: "rgba(16,185,129,.1)", color: "#10B981", fontWeight: 700, border: "1px solid rgba(16,185,129,.2)" }}>7-DAY FREE TRIAL</span>
              </div>
              <p style={{ fontSize: 12, color: "#334155", marginBottom: 28 }}>For agents and active investors</p>
              <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: annual?8:32 }}>
                <span style={{ fontSize: 12, color: "#334155" }}>AED</span>
                <span className="gold-text" style={{ fontFamily: "'Fraunces',serif", fontSize: 56, fontWeight: 900, lineHeight: 1 }}>{proPrice}</span>
                <span style={{ fontSize: 12, color: "#334155" }}>/month</span>
              </div>
              {annual && <p style={{ fontSize: 11, color: "#10B981", marginBottom: 28 }}>Billed AED {proPrice*12}/year — save AED {(99-proPrice)*12}</p>}
              {["All 208+ projects — full intelligence","Developer financials 6 years","Rental yields & 3 ROI models","Risk assessment (9 factors)","3-project comparison tool","Mortgage & flip calculators","Portfolio tracker + price alerts","WhatsApp share — any project","All 23 dashboard tools","Arabic + 19 languages","Priority support"].map((f,i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "5px 0", fontSize: 13, color: "#94A3B8" }}>
                  <span style={{ flexShrink: 0 }}>{IC.check}</span>{f}
                </div>
              ))}
              <button onClick={() => onSignUpClick && onSignUpClick("pro")} className="cta" style={{ width: "100%", marginTop: 28, padding: "15px 0", fontSize: 15, justifyContent: "center" }}>
                Start 7-Day Free Trial
              </button>
              <p style={{ fontSize: 10, color: "#334155", marginTop: 10, textAlign: "center" }}>No credit card · Cancel anytime</p>
            </div>

            {/* ENTERPRISE */}
            <div className="bento" style={{ borderRadius: 20, padding: 36 }}>
              <h3 style={{ fontSize: 22, fontWeight: 700, color: "#F1F5F9", marginBottom: 8 }}>Enterprise</h3>
              <p style={{ fontSize: 12, color: "#334155", marginBottom: 28 }}>For agencies and funds</p>
              <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 32 }}>
                <span style={{ fontSize: 12, color: "#334155" }}>AED</span>
                <span style={{ fontFamily: "'Fraunces',serif", fontSize: 56, fontWeight: 900, color: "#F1F5F9", lineHeight: 1 }}>{entPrice}</span>
                <span style={{ fontSize: 12, color: "#334155" }}>/month</span>
              </div>
              {["Everything in Pro","Multi-user team accounts","Dedicated account manager","Developer-level raw data","PDF reports (Q3 2026)","API access (Q3 2026)","Custom branded reports","White-label options"].map((f,i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "5px 0", fontSize: 13, color: "#64748B" }}>
                  <span style={{ flexShrink: 0 }}>{IC.check}</span>{f}
                </div>
              ))}
              <a href="mailto:hello@dxbanalytics.com?subject=Enterprise%20Enquiry" className="ghost" style={{ width: "100%", marginTop: 32, padding: "13px 0", display: "flex", justifyContent: "center", textDecoration: "none" }}>
                Contact Us {IC.arrow}
              </a>
            </div>
          </div>

          {/* Trust badges */}
          <div style={{ display: "flex", gap: 16, justifyContent: "center", marginTop: 52, flexWrap: "wrap" }}>
            {[
              [IC.lock,"Bank-grade Security","Firebase encrypted · SSL"],
              [IC.db,"Verified Data","DLD · Developer IR · Knight Frank"],
              [IC.globe,"20 Languages","Arabic, Urdu, Chinese & more"],
              [IC.zap,"Real-time Data","Live EIBOR + DLD feeds"],
            ].map(([icon,label,sub],i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 22px", borderRadius: 14, background: "#080F1C", border: "1px solid rgba(212,168,67,.08)" }}>
                <span style={{ display: "inline-flex", flexShrink: 0 }}>{icon}</span>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#F1F5F9" }}>{label}</div>
                  <div style={{ fontSize: 10, color: "#334155", marginTop: 2 }}>{sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* â•â•â•â•â•â•â• TESTIMONIALS â•â•â•â•â•â•â• */}
      <section className="lp-section" style={{ padding: "100px 48px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <SectionTag text="Real Professionals. Real Results."/>
            <H2>Trusted by Dubai's<br/>most informed professionals.</H2>
          </div>
          <div className="three-col" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20 }}>
            {[
              { q:"My clients used to ask about yields and I had to go away and research. Now I pull up DXB Analytics in the meeting — gross yield, net yield, risk score, 5-year ROI on the spot. It completely changed how I close deals.", name:"Ahmed Al Rashidi",role:"Senior Consultant · Emaar Specialist",co:"JVC & Dubai Hills",init:"AA",c:"#D4A843",stat:"3 extra deals last quarter" },
              { q:"As a UK-based investor making AED 3M decisions, I needed verified data. The EIBOR mortgage calculator alone saved me from a bad purchase — exact monthly payment vs rental income before committing.", name:"James Whitfield",role:"Property Investor",co:"London to Dubai · AED 4M portfolio",init:"JW",c:"#14B8A6",stat:"Avoided a costly mistake" },
              { q:"I manage 12 agents. We standardized on DXB Analytics. The comparison tool is a game changer — agents send full project breakdowns via WhatsApp in one tap. Research time went from 3 hours to 20 minutes.", name:"Fatima Al Zaabi",role:"Brokerage Manager",co:"Team of 12 · Marina & Downtown",init:"FA",c:"#8B5CF6",stat:"80% faster research" },
            ].map((t,i) => (
              <div key={i} className="bento" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ display: "flex", gap: 3 }}>{[...Array(5)].map((_,j) => <span key={j} style={{ display: "inline-flex" }}>{IC.star}</span>)}</div>
                <p style={{ fontSize: 13, color: "#64748B", lineHeight: 1.8, flex: 1, fontStyle: "italic" }}>"{t.q}"</p>
                <div style={{ padding: "7px 14px", background: `${t.c}10`, border: `1px solid ${t.c}20`, borderRadius: 10, fontSize: 11, fontWeight: 700, color: t.c, display: "inline-block", alignSelf: "flex-start" }}>{t.stat}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 12, paddingTop: 14, borderTop: "1px solid rgba(212,168,67,.08)" }}>
                  <div style={{ width: 42, height: 42, borderRadius: "50%", background: `${t.c}15`, border: `2px solid ${t.c}28`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: t.c, flexShrink: 0 }}>{t.init}</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#F1F5F9" }}>{t.name}</div>
                    <div style={{ fontSize: 11, color: "#334155" }}>{t.role}</div>
                    <div style={{ fontSize: 10, color: t.c, fontWeight: 600, marginTop: 2 }}>{t.co}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* â•â•â•â•â•â•â• ROADMAP â•â•â•â•â•â•â• */}
      <section className="lp-section" style={{ padding: "80px 48px", background: "linear-gradient(180deg,#04090F,#060F1E 20%,#060F1E 80%,#04090F)" }}>
        <div style={{ maxWidth: 940, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 52 }}>
            <SectionTag text="The Vision"/>
            <H2>The Bloomberg Terminal<br/>of GCC Real Estate.</H2>
          </div>
          <div className="three-col" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20 }}>
            {[
              { phase:"Phase 1",status:"LIVE NOW",c:"#10B981",title:"Dubai — 7 Developers",desc:"208 Emaar + DAMAC, Sobha, Nakheel, Meraas, Binghatti, Aldar — full financials, yields, risk, ROI.",bg:"rgba(16,185,129,.04)" },
              { phase:"Phase 2",status:"Q3 2026",c:"#D4A843",title:"Dubai — Top 10 Developers",desc:"Azizi, Tiger, Danube, Reportage + more — same intelligence depth, same verified quality.",bg:"rgba(212,168,67,.04)" },
              { phase:"Phase 3",status:"2027",c:"#3B82F6",title:"Full GCC Coverage",desc:"All 228+ Dubai developers, Abu Dhabi, Saudi Arabia — every transaction, live DLD feeds.",bg:"rgba(59,130,246,.04)" },
            ].map((item,i) => (
              <div key={i} style={{ background: item.bg, borderRadius: 18, padding: 30, border: "1px solid rgba(212,168,67,.07)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: item.c, letterSpacing: 1.5 }}>{item.phase}</span>
                  <span style={{ fontSize: 9.5, fontWeight: 700, padding: "3px 12px", borderRadius: 11, background: `${item.c}15`, color: item.c, border: `1px solid ${item.c}28` }}>{item.status}</span>
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: "#F1F5F9", marginBottom: 12 }}>{item.title}</h3>
                <p style={{ fontSize: 12, color: "#64748B", lineHeight: 1.75 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* â•â•â•â•â•â•â• FAQ â•â•â•â•â•â•â• */}
      <section id="faq" className="lp-section" style={{ padding: "100px 48px" }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 52 }}>
            <SectionTag text="FAQ"/>
            <H2>Common Questions</H2>
          </div>
          {FAQS.map(([q,a],i) => (
            <div key={i}>
              <button type="button" className="faq-btn" onClick={() => setOpenFaq(openFaq===i?null:i)}>
                <span style={{ fontSize: 14, fontWeight: 600, color: openFaq===i?"#D4A843":"#F1F5F9", paddingRight: 20, textAlign: "left" }}>{q}</span>
                <span style={{ color: "#D4A843", fontSize: 24, flexShrink: 0, transition: "transform .25s cubic-bezier(.22,1,.36,1)", transform: openFaq===i?"rotate(45deg)":"none", display: "inline-block", lineHeight: 1 }}>+</span>
              </button>
              {openFaq===i && (
                <div style={{ paddingBottom: 24, fontSize: 14, color: "#64748B", lineHeight: 1.85, borderBottom: "1px solid rgba(212,168,67,.08)", animation: "fadeUp .2s ease-out both" }}>
                  {a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* â•â•â•â•â•â•â• FINAL CTA â•â•â•â•â•â•â• */}
      <section className="lp-section" style={{ padding: "120px 48px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "-15%", left: "50%", transform: "translateX(-50%)", width: 1000, height: 800, borderRadius: "50%", background: "radial-gradient(ellipse,rgba(212,168,67,.08) 0%,transparent 60%)", pointerEvents: "none" }}/>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(212,168,67,.02) 1px,transparent 1px),linear-gradient(90deg,rgba(212,168,67,.02) 1px,transparent 1px)", backgroundSize: "80px 80px", pointerEvents: "none" }}/>
        <div style={{ position: "relative", zIndex: 1, maxWidth: 680, margin: "0 auto" }}>
          <div style={{ display: "inline-block", padding: "5px 18px", borderRadius: 9, background: "rgba(16,185,129,.07)", border: "1px solid rgba(16,185,129,.18)", marginBottom: 28 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: "#10B981", letterSpacing: 1.5 }}>NO CREDIT CARD REQUIRED</span>
          </div>
          <h2 style={{ fontFamily: "'Fraunces',serif", fontSize: 52, fontWeight: 900, color: "#F1F5F9", lineHeight: 1.08, letterSpacing: "-2px", marginBottom: 22 }}>
            Your next deal is waiting.<br/>
            <span className="gold-text">Don't walk in without the data.</span>
          </h2>
          <p style={{ fontSize: 18, color: "#64748B", lineHeight: 1.75, marginBottom: 44 }}>
            {stats.users}+ Dubai professionals already have the edge.<br/>
            Start free. No card. 7-day Pro trial.
          </p>
          <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
            <button onClick={onSignUpClick} className="cta" style={{ padding: "20px 60px", fontSize: 18 }}>
              Start Free Trial
            </button>
            <a href="mailto:hello@dxbanalytics.com?subject=DXB%20Analytics%20Enquiry" className="ghost" style={{ padding: "19px 36px", fontSize: 16, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 10 }}>
              Talk to Us {IC.arrow}
            </a>
          </div>
          <p style={{ fontSize: 12, color: "#334155", marginTop: 22 }}>
            Secured by Firebase · SSL Encrypted · GDPR Compliant
          </p>
        </div>
      </section>

      {/* â•â•â•â•â•â•â• FOOTER â•â•â•â•â•â•â• */}
      <footer style={{ padding: "40px 48px", borderTop: "1px solid rgba(212,168,67,.08)", background: "#080F1C" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 20, marginBottom: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <DXBLogo size={22}/>
              <span style={{ fontFamily: "'Fraunces',serif", fontSize: 15, fontWeight: 700, color: "#D4A843" }}>DXB Analytics</span>
            </div>
            <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
              {[["#features","Features"],["#tools","23 Tools"],["#pricing","Pricing"],["#faq","FAQ"],["/terms","Terms"],["/privacy","Privacy"],["mailto:hello@dxbanalytics.com","Contact"]].map(([href,label]) => (
                <a key={label} href={href} className="nav-link" style={{ fontSize: 12 }}>{label}</a>
              ))}
            </div>
          </div>
          <div style={{ borderTop: "1px solid rgba(212,168,67,.06)", paddingTop: 18, textAlign: "center" }}>
            <p style={{ fontSize: 11, color: "#334155", lineHeight: 1.7 }}>
              © 2026 DXB Analytics · Dubai, UAE · For informational purposes only — not financial or investment advice<br/>
              Data sourced from DLD, developer IR reports, Knight Frank, ValuStrat, UAE Central Bank
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
