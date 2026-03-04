/* ─── DXB ANALYTICS LANDING PAGE ─── */
import React, { useState, useEffect } from "react";

const T = {
  bg: "#04090F", surface: "#0A1628", surfaceAlt: "#0E1D35", card: "#0D1B30", cardHover: "#112240",
  gold: "#D4A843", goldLight: "#E8C96A", goldGlow: "rgba(212,168,67,0.15)", goldMuted: "rgba(212,168,67,0.08)",
  teal: "#00BFA5", navy: "#0B1F3F", white: "#FFFFFF",
  textPrimary: "#E2E8F0", textSecondary: "#94A3B8", textMuted: "#64748B",
  border: "rgba(212,168,67,0.12)", borderHover: "rgba(212,168,67,0.3)",
  red: "#EF4444", green: "#10B981", blue: "#3B82F6",
};

const landingCss = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700;9..144,900&display=swap');
  
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: ${T.bg}; overflow-x: hidden; }
  
  @keyframes fadeUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  @keyframes shimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
  @keyframes pulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 1; } }
  @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-10px); } }
  @keyframes gradientShift { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
  
  .landing-hero-glow {
    position: absolute; top: -200px; left: 50%; transform: translateX(-50%);
    width: 800px; height: 600px; border-radius: 50%;
    background: radial-gradient(ellipse, rgba(212,168,67,0.08) 0%, transparent 70%);
    pointer-events: none;
  }
  
  .landing-grid-bg {
    position: absolute; inset: 0; opacity: 0.03;
    background-image: linear-gradient(rgba(212,168,67,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(212,168,67,0.3) 1px, transparent 1px);
    background-size: 60px 60px;
    pointer-events: none;
  }
  
  .pricing-card { transition: all 0.3s ease; border: 1px solid ${T.border}; }
  .pricing-card:hover { transform: translateY(-8px); border-color: ${T.gold}; box-shadow: 0 20px 60px rgba(212,168,67,0.15); }
  .pricing-popular { border: 2px solid ${T.gold} !important; position: relative; }
  
  .feature-card { transition: all 0.3s ease; }
  .feature-card:hover { transform: translateY(-4px); border-color: rgba(212,168,67,0.3); }
  
  .cta-btn {
    display: inline-flex; align-items: center; gap: 8px; padding: 14px 32px;
    background: linear-gradient(135deg, ${T.gold}, ${T.goldLight}); color: ${T.bg};
    border: none; border-radius: 12px; font-family: 'Outfit', sans-serif;
    font-size: 15px; font-weight: 700; cursor: pointer;
    transition: all 0.3s ease; text-decoration: none;
  }
  .cta-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 30px rgba(212,168,67,0.35); }
  
  .cta-btn-outline {
    display: inline-flex; align-items: center; gap: 8px; padding: 14px 32px;
    background: transparent; color: ${T.gold}; border: 1px solid ${T.gold};
    border-radius: 12px; font-family: 'Outfit', sans-serif;
    font-size: 15px; font-weight: 600; cursor: pointer;
    transition: all 0.3s ease; text-decoration: none;
  }
  .cta-btn-outline:hover { background: rgba(212,168,67,0.1); transform: translateY(-2px); }

  .stat-number {
    background: linear-gradient(135deg, ${T.gold}, ${T.goldLight}, ${T.gold});
    background-size: 200% auto;
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    animation: shimmer 3s linear infinite;
  }

  .nav-link { color: ${T.textSecondary}; text-decoration: none; font-size: 14px; font-weight: 500; transition: color 0.2s; font-family: 'Outfit', sans-serif; }
  .nav-link:hover { color: ${T.gold}; }

  @media (max-width: 768px) {
    .hero-title { font-size: 32px !important; }
    .hero-subtitle { font-size: 16px !important; }
    .pricing-grid { grid-template-columns: 1fr !important; }
    .features-grid { grid-template-columns: 1fr !important; }
    .stats-grid { grid-template-columns: 1fr 1fr !important; }
    .hero-buttons { flex-direction: column !important; align-items: stretch !important; }
    .nav-links { display: none !important; }
    .mobile-menu-btn { display: flex !important; }
    .mobile-drawer { display: flex !important; }
    .landing-section { padding: 60px 16px !important; }
  .mobile-menu-btn { display: none; align-items: center; justify-content: center; width: 40px; height: 40px; background: none; border: 1px solid ${T.border}; border-radius: 8px; cursor: pointer; color: ${T.textSecondary}; }
  .mobile-drawer { display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: ${T.bg}; z-index: 2000; flex-direction: column; padding: 80px 24px 24px; gap: 8px; }
  .mobile-drawer a { color: ${T.textSecondary}; text-decoration: none; font-size: 18px; font-weight: 500; padding: 14px 0; border-bottom: 1px solid ${T.border}; font-family: 'Outfit', sans-serif; }
  .mobile-drawer a:hover { color: ${T.gold}; }
  }
`;

export default function LandingPage({ onLoginClick, onSignUpClick }) {
  const [scrollY, setScrollY] = useState(0);
  const [mobileMenu, setMobileMenu] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const features = [
    { icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/></svg>, title: "Real-Time Analytics", desc: "Live financial data, 6 years of verified developer financials, EBITDA margins, revenue trends, and dividend history from official filings." },
    { icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="9" y1="6" x2="9" y2="6.01"/><line x1="15" y1="6" x2="15" y2="6.01"/><line x1="9" y1="10" x2="9" y2="10.01"/><line x1="15" y1="10" x2="15" y2="10.01"/><path d="M9 22v-4h6v4"/></svg>, title: "Project Intelligence", desc: "48+ Emaar projects with construction progress, unit availability, payment plans, price per sqft, and handover timelines." },
    { icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>, title: "Location Intelligence", desc: "Distance to Burj Khalifa, schools, hospitals, malls — with exact drive times for every community across Dubai." },
    { icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>, title: "Stock Market Tracker", desc: "30 publicly traded RE stocks across DFM, ADX, Tadawul & LSE with live prices, P/E ratios, and TradingView charts." },
    { icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 22V8a6 6 0 0 0-6-6h16a6 6 0 0 0-6 6v14"/></svg>, title: "Competitor Analysis", desc: "Top 10 developers ranked by sales, units, market share — with competitive edge analysis and market positioning." },
    { icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>, title: "Yield & ROI Data", desc: "Verified rental yields per community, unit type, gross/net returns, demand levels, and Golden Visa eligibility." },
    { icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>, title: "3-Project Comparison", desc: "Compare any projects side-by-side on price, size, yield, handover, payment plan, and location — instant decisions." },
    { icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>, title: "Risk Assessment", desc: "9-factor risk analysis covering market, regulatory, supply, currency, liquidity, construction, geopolitical, and interest rate risks." },
  ];

  const plans = [
    {
      name: "Free",
      price: "0",
      period: "",
      desc: "Explore the platform",
      features: ["View 5 projects", "Current year financials", "Basic market overview", "Community search"],
      cta: "Get Started Free",
      popular: false,
    },
    {
      name: "Pro",
      price: "99",
      period: "/month",
      desc: "For agents & investors",
      features: ["All projects & developers", "Full 6-year financials", "Location intelligence", "Yield & ROI analysis", "Stock market tracker", "Competitor analysis", "3-project comparison", "Priority WhatsApp support"],
      cta: "Start Pro Trial",
      popular: true,
    },
    {
      name: "Enterprise",
      price: "499",
      period: "/month",
      desc: "For agencies & funds",
      features: ["Everything in Pro", "PDF report generation ⏳", "API access ⏳", "Custom dashboards ⏳", "Multi-user accounts ⏳", "Developer-level data", "Dedicated account manager", "White-label options ⏳"],
      cta: "Contact Sales",
      note: "⏳ = Coming Q3 2026",
      popular: false,
    },
  ];

  const stats = [
    { number: "48+", label: "Projects Tracked" },
    { number: "30", label: "RE Stocks Monitored" },
    { number: "11", label: "Communities Profiled" },
    { number: "AED 682B", label: "Market Data Covered" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: T.bg, fontFamily: "'Outfit', sans-serif", color: T.textPrimary }}>
      <style>{landingCss}</style>

      {/* ─── NAVBAR ─── */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        padding: "16px 40px", display: "flex", alignItems: "center", justifyContent: "space-between",
        background: scrollY > 50 ? "rgba(4,9,15,0.95)" : "transparent",
        backdropFilter: scrollY > 50 ? "blur(20px)" : "none",
        borderBottom: scrollY > 50 ? `1px solid ${T.border}` : "1px solid transparent",
        transition: "all 0.3s ease",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <svg width="32" height="32" viewBox="0 0 40 40">
            <rect x="2" y="2" width="36" height="36" rx="8" fill="none" stroke={T.gold} strokeWidth="2" />
            <path d="M12 28V12h10l-6 8h8l-12 8z" fill={T.gold} />
          </svg>
          <span style={{ fontFamily: "'Fraunces', serif", fontSize: 18, fontWeight: 900, color: T.gold }}>DXB Analytics</span>
        </div>
        <div className="nav-links" style={{ display: "flex", alignItems: "center", gap: 32 }}>
          <a href="#features" className="nav-link">Features</a>
          <a href="#pricing" className="nav-link">Pricing</a>
          <a href="#stats" className="nav-link">Data</a>
          <button onClick={onLoginClick} className="cta-btn-outline" style={{ padding: "8px 20px", fontSize: 13 }}>Login</button>
          <button onClick={onSignUpClick} className="cta-btn" style={{ padding: "8px 20px", fontSize: 13 }}>Get Started</button>
        </div>
      </nav>

      {/* ─── HERO SECTION ─── */}
      <section style={{ position: "relative", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "120px 40px 80px", overflow: "hidden" }}>
        <div className="landing-hero-glow" />
        <div className="landing-grid-bg" />
        
        <div style={{ position: "relative", zIndex: 1, textAlign: "center", maxWidth: 800, animation: "fadeUp 0.8s ease-out" }}>
          <div style={{ display: "inline-block", padding: "6px 16px", borderRadius: 20, background: T.goldGlow, border: `1px solid ${T.border}`, marginBottom: 24 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: T.gold, letterSpacing: 1 }}>DUBAI'S FIRST REAL ESTATE INTELLIGENCE PLATFORM</span>
          </div>
          
          <h1 className="hero-title" style={{ fontFamily: "'Fraunces', serif", fontSize: 52, fontWeight: 900, lineHeight: 1.1, marginBottom: 20 }}>
            <span style={{ color: T.white }}>Smarter Decisions in</span><br/>
            <span style={{ background: `linear-gradient(135deg, ${T.gold}, ${T.goldLight})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Dubai Real Estate</span>
          </h1>
          
          <p className="hero-subtitle" style={{ fontSize: 18, color: T.textSecondary, lineHeight: 1.6, marginBottom: 36, maxWidth: 600, margin: "0 auto 36px" }}>
            Verified financials, location intelligence, rental yields, competitor analysis, and stock market data — everything Dubai's agents and investors need in one premium dashboard.
          </p>
          
          <div className="hero-buttons" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16 }}>
            <button onClick={onSignUpClick} className="cta-btn" style={{ padding: "16px 40px", fontSize: 16 }}>
              Start Free →
            </button>
            <button onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })} className="cta-btn-outline" style={{ padding: "16px 40px", fontSize: 16 }}>
              See Features
            </button>
          </div>

          <p style={{ fontSize: 12, color: T.textMuted, marginTop: 16 }}>No credit card required · Free tier available · Cancel anytime</p>
        </div>
      </section>

      {/* ─── STATS BAR ─── */}
      <section id="stats" style={{ padding: "40px 40px", borderTop: `1px solid ${T.border}`, borderBottom: `1px solid ${T.border}`, background: T.surface }}>
        <div className="stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 32, maxWidth: 1000, margin: "0 auto", textAlign: "center" }}>
          {stats.map((s, i) => (
            <div key={i} style={{ animation: `fadeUp 0.6s ease-out ${i * 0.1}s both` }}>
              <div className="stat-number" style={{ fontFamily: "'Fraunces', serif", fontSize: 32, fontWeight: 900 }}>{s.number}</div>
              <div style={{ fontSize: 13, color: T.textMuted, marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── FEATURES SECTION ─── */}
      <section id="features" className="landing-section" style={{ padding: "100px 40px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 60 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: T.gold, letterSpacing: 2, textTransform: "uppercase" }}>Features</span>
            <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 36, fontWeight: 900, color: T.white, marginTop: 12 }}>Everything You Need to Win</h2>
            <p style={{ fontSize: 15, color: T.textSecondary, marginTop: 12, maxWidth: 500, margin: "12px auto 0" }}>From market-level trends to per-unit availability — intelligence that closes deals.</p>
          </div>
          
          <div className="features-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
            {features.map((f, i) => (
              <div key={i} className="feature-card" style={{
                background: T.surface, borderRadius: 14, padding: 24, border: `1px solid ${T.border}`,
                animation: `fadeUp 0.6s ease-out ${i * 0.08}s both`,
              }}>
                <div style={{ fontSize: 28, marginBottom: 12 }}>{f.icon}</div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: T.white, marginBottom: 8 }}>{f.title}</h3>
                <p style={{ fontSize: 12, color: T.textSecondary, lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PRICING SECTION ─── */}
      <section id="pricing" className="landing-section" style={{ padding: "100px 40px", background: `linear-gradient(180deg, transparent, ${T.surface} 20%, ${T.surface} 80%, transparent)` }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 60 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: T.gold, letterSpacing: 2, textTransform: "uppercase" }}>Pricing</span>
            <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 36, fontWeight: 900, color: T.white, marginTop: 12 }}>Choose Your Edge</h2>
            <p style={{ fontSize: 15, color: T.textSecondary, marginTop: 12 }}>Start free. Upgrade when you need the full picture.</p>
          </div>

          <div className="pricing-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, alignItems: "start" }}>
            {plans.map((plan, i) => (
              <div key={i} className={`pricing-card ${plan.popular ? "pricing-popular" : ""}`} style={{
                background: T.surface, borderRadius: 16, padding: 32,
                animation: `fadeUp 0.6s ease-out ${i * 0.15}s both`,
              }}>
                {plan.popular && (
                  <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", padding: "4px 16px", borderRadius: 12, background: T.gold, color: T.bg, fontSize: 11, fontWeight: 700, letterSpacing: 0.5 }}>
                    MOST POPULAR
                  </div>
                )}
                <div style={{ marginBottom: 24 }}>
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: T.white, marginBottom: 4 }}>{plan.name}</h3>
                  <p style={{ fontSize: 12, color: T.textMuted }}>{plan.desc}</p>
                </div>
                <div style={{ marginBottom: 24, display: "flex", alignItems: "baseline", gap: 4 }}>
                  <span style={{ fontSize: 11, color: T.textMuted }}>AED</span>
                  <span style={{ fontFamily: "'Fraunces', serif", fontSize: 42, fontWeight: 900, color: plan.popular ? T.gold : T.white }}>{plan.price}</span>
                  {plan.period && <span style={{ fontSize: 13, color: T.textMuted }}>{plan.period}</span>}
                </div>
                <div style={{ marginBottom: 28 }}>
                  {plan.features.map((feat, j) => (
                    <div key={j} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", fontSize: 13, color: T.textSecondary }}>
                      <span style={{ color: T.green, fontSize: 14 }}>✓</span>
                      {feat}
                    </div>
                  ))}
                </div>
                <button onClick={onSignUpClick} className={plan.popular ? "cta-btn" : "cta-btn-outline"} style={{ width: "100%", justifyContent: "center", padding: "12px 0" }}>
                  {plan.cta}
                </button>
                {plan.note && <p style={{ fontSize: 10, color: T.textMuted, marginTop: 12, textAlign: "center" }}>{plan.note}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── WHO IS IT FOR ─── */}
      <section className="landing-section" style={{ padding: "100px 40px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 60 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: T.gold, letterSpacing: 2, textTransform: "uppercase" }}>Built For</span>
            <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 36, fontWeight: 900, color: T.white, marginTop: 12 }}>The People Who Move Dubai's Market</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {[
              { icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="9" y1="6" x2="9" y2="6.01"/><line x1="15" y1="6" x2="15" y2="6.01"/><path d="M9 22v-4h6v4"/></svg>, title: "Real Estate Agents", desc: "Stop sending clients scattered PDFs. Share verified project data, location intelligence, and comparisons instantly from one link." },
              { icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>, title: "Property Investors", desc: "AED 2M+ decisions deserve verified data. Get yields, risk scores, financial trends, and ROI projections — not broker estimates." },
              { icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M2 20h20"/><path d="M5 20V8l7-5 7 5v12"/><path d="M9 20v-4h6v4"/></svg>, title: "Developers", desc: "Track your competition in real-time. See market share shifts, pricing trends, and buyer sentiment across Dubai's top developers." },
              { icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 21h18"/><path d="M3 7h18"/><path d="M5 21V7"/><path d="M19 21V7"/><path d="M9 21V7"/><path d="M15 21V7"/><path d="M12 3l9 4H3l9-4z"/></svg>, title: "Banks & Institutions", desc: "Risk-assess AED billions in real estate exposure with verified market data, developer financials, and macro indicators." },
            ].map((item, i) => (
              <div key={i} className="feature-card" style={{ background: T.surface, borderRadius: 14, padding: 24, border: `1px solid ${T.border}` }}>
                <div style={{ fontSize: 28, marginBottom: 12 }}>{item.icon}</div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: T.white, marginBottom: 6 }}>{item.title}</h3>
                <p style={{ fontSize: 13, color: T.textSecondary, lineHeight: 1.6 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── DATA SOURCES ─── */}
      <section style={{ padding: "60px 40px", borderTop: `1px solid ${T.border}`, background: T.surface }}>
        <div style={{ maxWidth: 800, margin: "0 auto", textAlign: "center" }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: T.textMuted, letterSpacing: 2, textTransform: "uppercase", marginBottom: 20 }}>Verified Data From</p>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 24 }}>
            {["Dubai Land Department", "Emaar IR Reports", "DXBinteract", "Knight Frank", "ValuStrat", "Yahoo Finance", "TradingView"].map((src, i) => (
              <span key={i} style={{ fontSize: 13, color: T.textSecondary, padding: "8px 16px", borderRadius: 8, background: T.surfaceAlt, border: `1px solid ${T.border}` }}>{src}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA ─── */}
      <section className="landing-section" style={{ padding: "100px 40px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div className="landing-hero-glow" style={{ top: "-100px" }} />
        <div style={{ position: "relative", zIndex: 1 }}>
          <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 40, fontWeight: 900, color: T.white, marginBottom: 16 }}>
            Ready to Make Smarter<br/>
            <span style={{ color: T.gold }}>Real Estate Decisions?</span>
          </h2>
          <p style={{ fontSize: 16, color: T.textSecondary, marginBottom: 32, maxWidth: 500, margin: "0 auto 32px" }}>
            Join Dubai's most informed agents and investors. Start with the free tier — upgrade when you're ready.
          </p>
          <button onClick={onSignUpClick} className="cta-btn" style={{ padding: "18px 48px", fontSize: 17 }}>
            Get Started Free →
          </button>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer style={{ padding: "40px", borderTop: `1px solid ${T.border}`, background: T.surface }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <svg width="24" height="24" viewBox="0 0 40 40">
              <rect x="2" y="2" width="36" height="36" rx="8" fill="none" stroke={T.gold} strokeWidth="2" />
              <path d="M12 28V12h10l-6 8h8l-12 8z" fill={T.gold} />
            </svg>
            <span style={{ fontFamily: "'Fraunces', serif", fontSize: 14, fontWeight: 700, color: T.gold }}>DXB Analytics</span>
          </div>
          <div style={{ display: "flex", gap: 24 }}>
            <a href="#features" className="nav-link" style={{ fontSize: 12 }}>Features</a>
            <a href="#pricing" className="nav-link" style={{ fontSize: 12 }}>Pricing</a>
            <a href="mailto:mianwaleed689@gmail.com" className="nav-link" style={{ fontSize: 12 }}>Contact</a>
          </div>
          <p style={{ fontSize: 11, color: T.textMuted }}>© 2026 DXB Analytics. Dubai, UAE.</p>
        </div>
      </footer>
    </div>
  );
}
