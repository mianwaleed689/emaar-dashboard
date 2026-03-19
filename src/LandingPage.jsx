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

  @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes shimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
  @keyframes pulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 1; } }
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
    background-size: 60px 60px; pointer-events: none;
  }

  .pricing-card { transition: all 0.3s ease; border: 1px solid ${T.border}; }
  .pricing-card:hover { transform: translateY(-6px); border-color: ${T.gold}; box-shadow: 0 20px 60px rgba(212,168,67,0.12); }
  .pricing-popular { border: 2px solid ${T.gold} !important; position: relative; }

  .feature-card { transition: all 0.3s ease; }
  .feature-card:hover { transform: translateY(-4px); border-color: rgba(212,168,67,0.3) !important; }

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

  .mobile-menu-btn { display: none; align-items: center; justify-content: center; width: 40px; height: 40px; background: none; border: 1px solid ${T.border}; border-radius: 8px; cursor: pointer; color: ${T.textSecondary}; }
  .mobile-drawer { display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: ${T.bg}; z-index: 2000; flex-direction: column; padding: 80px 24px 24px; gap: 8px; }
  .mobile-drawer a { color: ${T.textSecondary}; text-decoration: none; font-size: 18px; font-weight: 500; padding: 14px 0; border-bottom: 1px solid ${T.border}; font-family: 'Outfit', sans-serif; }
  .mobile-drawer a:hover { color: ${T.gold}; }

  .faq-item { border-bottom: 1px solid ${T.border}; overflow: hidden; }
  .faq-btn { width: 100%; text-align: left; background: none; border: none; cursor: pointer; padding: 20px 0; display: flex; justify-content: space-between; align-items: center; font-family: 'Outfit', sans-serif; }

  .ticker-track {
    display: flex; gap: 32px; animation: ticker 30s linear infinite;
    white-space: nowrap;
  }
  @keyframes ticker { from { transform: translateX(0); } to { transform: translateX(-50%); } }

  @media (max-width: 768px) {
    .hero-title { font-size: 32px !important; }
    .hero-subtitle { font-size: 16px !important; }
    .pricing-grid { grid-template-columns: 1fr !important; }
    .features-grid { grid-template-columns: 1fr 1fr !important; }
    .stats-grid { grid-template-columns: 1fr 1fr !important; }
    .hero-buttons { flex-direction: column !important; align-items: stretch !important; }
    .nav-links { display: none !important; }
    .mobile-menu-btn { display: flex !important; }
    .mobile-drawer { display: flex !important; }
    .landing-section { padding: 60px 16px !important; }
    .two-col { grid-template-columns: 1fr !important; }
    .three-col { grid-template-columns: 1fr !important; }
    .compare-table th, .compare-table td { padding: 10px 8px !important; font-size: 11px !important; }
  }
  @media (max-width: 480px) {
    .features-grid { grid-template-columns: 1fr !important; }
  }
`;

export default function LandingPage({ onLoginClick, onSignUpClick }) {
  const [scrollY, setScrollY] = useState(0);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);
  const [billingAnnual, setBillingAnnual] = useState(false);

  useEffect(() => {
    const handleResize = () => { if (window.innerWidth > 768) setMobileMenu(false); };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const features = [
    { icon: "📊", title: "Real-Time Financials", desc: "6 years of verified Emaar data — revenue, EBITDA, backlog, EPS, dividends — sourced from official IR reports." },
    { icon: "🏗️", title: "Project Intelligence", desc: "48+ projects with construction %, unit availability, payment plans, price/sqft, and handover timelines." },
    { icon: "📍", title: "Location Intelligence", desc: "Distance to Burj Khalifa, schools, hospitals, malls — drive times for every community across Dubai." },
    { icon: "📈", title: "Stock Market Tracker", desc: "30 RE stocks across DFM, ADX, Tadawul & LSE — live prices, P/E, TradingView charts." },
    { icon: "⚖️", title: "3-Project Comparison", desc: "Side-by-side on price, yield, handover, payment plan, ROI — with PDF export for client presentations." },
    { icon: "💰", title: "Yield & ROI Calculator", desc: "Gross/net yields per community. Interactive ROI calculator with 3 strategies: long-term, Airbnb, flip." },
    { icon: "🏆", title: "Competitor Analysis", desc: "Top 10 developers ranked by sales, units, market share — with pricing trend analysis." },
    { icon: "🛡️", title: "Risk Assessment", desc: "9-factor risk matrix covering market, regulatory, liquidity, construction, and interest rate risks." },
  ];

  const proPrice = billingAnnual ? 79 : 99;
  const entPrice = billingAnnual ? 399 : 499;

  const faqs = [
    { q: "Is there a free trial?", a: "Yes — every new account gets a 7-day Pro trial automatically. No credit card needed to start." },
    { q: "What data sources do you use?", a: "Emaar official IR reports, Dubai Land Department (DLD), DXBinteract, BetterHomes, Bayut, Engel & Völkers, ValuStrat, Knight Frank, and Yahoo Finance for stock data." },
    { q: "How often is data updated?", a: "Financial data is updated within 24 hours of official Emaar releases. Project prices and handover dates are manually verified monthly. Stock data refreshes every 15 minutes." },
    { q: "Can I use this for client presentations?", a: "Absolutely — that's the core Pro use case. Use the Compare Tool to create side-by-side project comparisons, then export as a PDF directly from the dashboard." },
    { q: "What's included in the Enterprise plan?", a: "Everything in Pro plus multi-user team accounts, PDF report generation, API access (coming Q3 2026), custom branded reports, and a dedicated account manager. Contact us at mianwaleed689@gmail.com to discuss." },
    { q: "Which developers are covered?", a: "Phase 1 (live now) covers all 48 active Emaar projects across 11 communities. DAMAC, Sobha, Nakheel, ALDAR, and 6 more developers are coming in Q3 2026." },
    { q: "Can I cancel anytime?", a: "Yes. No contracts, no cancellation fees. Cancel anytime from your account settings and you retain access until the end of your billing period." },
  ];

  const testimonials = [
    { name: "Faisal A.", role: "Senior Agent · Betterhomes", quote: "I use the comparison PDF in every client meeting. Saves me 2 hours of prep and clients close faster when they see the data.", avatar: "FA" },
    { name: "Priya M.", role: "Private Investor · Dubai Hills", quote: "Bought my second unit after running the ROI calculator. The yield data matched exactly what my property manager reported.", avatar: "PM" },
    { name: "Tariq N.", role: "Portfolio Manager · Family Office", quote: "Finally a platform that shows Emaar financials alongside the projects. I track the backlog every quarter — it's the best leading indicator.", avatar: "TN" },
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
          <a href="#faq" className="nav-link">FAQ</a>
          <button onClick={onLoginClick} className="cta-btn-outline" style={{ padding: "8px 20px", fontSize: 13 }}>Login</button>
          <button onClick={onSignUpClick} className="cta-btn" style={{ padding: "8px 20px", fontSize: 13 }}>Get Started Free</button>
        </div>
        <button type="button" className="mobile-menu-btn" onClick={() => setMobileMenu(m => !m)} aria-label="Toggle menu">
          {mobileMenu
            ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          }
        </button>
      </nav>

      {/* ─── MOBILE DRAWER ─── */}
      <div className="mobile-drawer" style={{ display: mobileMenu ? "flex" : "none" }}>
        <button type="button" onClick={() => setMobileMenu(false)} style={{ position: "absolute", top: 20, right: 20, background: "none", border: "none", color: T.textSecondary, cursor: "pointer", padding: 8 }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
        <a href="#features" onClick={() => setMobileMenu(false)}>Features</a>
        <a href="#pricing" onClick={() => setMobileMenu(false)}>Pricing</a>
        <a href="#faq" onClick={() => setMobileMenu(false)}>FAQ</a>
        <button onClick={() => { setMobileMenu(false); onLoginClick(); }} className="cta-btn-outline" style={{ marginTop: 16, justifyContent: "center" }}>Login</button>
        <button onClick={() => { setMobileMenu(false); onSignUpClick("free"); }} className="cta-btn" style={{ marginTop: 8, justifyContent: "center" }}>Get Started Free</button>
      </div>

      {/* ─── HERO ─── */}
      <section style={{ position: "relative", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "120px 40px 80px", overflow: "hidden" }}>
        <div className="landing-hero-glow" />
        <div className="landing-grid-bg" />
        <div style={{ position: "relative", zIndex: 1, textAlign: "center", maxWidth: 820 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 16px", borderRadius: 20, background: T.goldGlow, border: `1px solid ${T.border}`, marginBottom: 24, animation: "fadeUp 0.6s ease-out both" }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: T.green, display: "inline-block", animation: "pulse 2s infinite" }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: T.gold, letterSpacing: 1 }}>DUBAI'S FIRST REAL ESTATE INTELLIGENCE PLATFORM</span>
          </div>

          <h1 className="hero-title" style={{ fontFamily: "'Fraunces', serif", fontSize: 54, fontWeight: 900, lineHeight: 1.1, marginBottom: 20, animation: "fadeUp 0.6s ease-out 0.1s both", opacity: 0 }}>
            <span style={{ color: T.white }}>Smarter Decisions in</span><br/>
            <span style={{ background: `linear-gradient(135deg, ${T.gold}, ${T.goldLight})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Dubai Real Estate</span>
          </h1>

          <p className="hero-subtitle" style={{ fontSize: 18, color: T.textSecondary, lineHeight: 1.6, maxWidth: 620, margin: "0 auto 36px", animation: "fadeUp 0.6s ease-out 0.2s both", opacity: 0 }}>
            Verified financials, rental yields, competitor intelligence, and project comparison — everything Dubai's agents and investors need to close faster and invest smarter.
          </p>

          <div className="hero-buttons" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, animation: "fadeUp 0.6s ease-out 0.3s both", opacity: 0 }}>
            <button onClick={onSignUpClick} className="cta-btn" style={{ padding: "16px 40px", fontSize: 16 }}>
              Start Free — 7-Day Pro Trial →
            </button>
            <button onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })} className="cta-btn-outline" style={{ padding: "16px 40px", fontSize: 16 }}>
              See Features
            </button>
          </div>
          <p style={{ fontSize: 12, color: T.textMuted, marginTop: 16 }}>No credit card required · Free tier always available · Cancel anytime</p>

          {/* Social proof mini-bar */}
          <div style={{ display: "flex", justifyContent: "center", gap: 32, marginTop: 48, flexWrap: "wrap" }}>
            {[
              { n: "48+", l: "Projects" },
              { n: "AED 682B", l: "Market Data" },
              { n: "11", l: "Communities" },
              { n: "30", l: "RE Stocks" },
            ].map((s, i) => (
              <div key={i} style={{ textAlign: "center" }}>
                <div className="stat-number" style={{ fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 900 }}>{s.n}</div>
                <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── TICKER / PROOF BAR ─── */}
      <div style={{ borderTop: `1px solid ${T.border}`, borderBottom: `1px solid ${T.border}`, background: T.surface, padding: "14px 0", overflow: "hidden" }}>
        <div className="ticker-track">
          {[...Array(2)].map((_, rep) => (
            <React.Fragment key={rep}>
              {["AED 80.4B Property Sales 2025", "125,600+ Units Delivered", "AED 155B Order Backlog", "48 Active Projects", "11 Communities Profiled", "6 Years Financial Data", "30 RE Stocks Tracked", "AED 25.7B Net Profit 2025", "DLD · Emaar IR · Knight Frank · ValuStrat"].map((item, i) => (
                <span key={`${rep}-${i}`} style={{ fontSize: 12, color: T.textMuted, display: "inline-flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
                  <span style={{ width: 4, height: 4, borderRadius: "50%", background: T.gold, opacity: 0.6, display: "inline-block" }} />
                  {item}
                </span>
              ))}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* ─── VALUE PROPOSITION ─── */}
      <section style={{ padding: "80px 40px", background: `linear-gradient(180deg, ${T.surface}, ${T.bg})` }}>
        <div style={{ maxWidth: 900, margin: "0 auto", textAlign: "center" }}>
          <div style={{ display: "inline-block", padding: "4px 14px", borderRadius: 8, background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)", marginBottom: 16 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: T.green, letterSpacing: 1 }}>THE MATH IS SIMPLE</span>
          </div>
          <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 34, fontWeight: 900, color: T.white, marginBottom: 12 }}>
            One deal. 24 months of Pro free.
          </h2>
          <p style={{ fontSize: 15, color: T.textSecondary, maxWidth: 560, margin: "0 auto 40px" }}>
            A single AED 1.5M unit at 1% commission = AED 15,000. Pro costs AED 99/month. The platform pays for itself in under 7 minutes of one transaction.
          </p>
          <div className="three-col" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
            {[
              { icon: "🤝", title: "Agents", sub: "Close faster", stat: "2× more client meetings", desc: "Share verified data and comparison PDFs instantly — no more scattered screenshots." },
              { icon: "📐", title: "Investors", sub: "Invest smarter", stat: "All ROI data in one place", desc: "Yields, 5-year appreciation, payment plans, and risk scores — verified, not estimated." },
              { icon: "🏢", title: "Brokerages", sub: "Scale your team", stat: "Enterprise from AED 499/mo", desc: "Multi-user access, PDF reports, and dedicated account management for your whole agency." },
            ].map((item, i) => (
              <div key={i} className="feature-card" style={{ background: T.surface, borderRadius: 14, padding: 24, border: `1px solid ${T.border}`, textAlign: "left" }}>
                <div style={{ fontSize: 28, marginBottom: 12 }}>{item.icon}</div>
                <div style={{ fontSize: 10, fontWeight: 700, color: T.gold, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>{item.sub}</div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: T.white, marginBottom: 6 }}>{item.title}</h3>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.green, marginBottom: 8 }}>{item.stat}</div>
                <p style={{ fontSize: 12, color: T.textSecondary, lineHeight: 1.6 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FEATURES ─── */}
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
                animation: `fadeUp 0.6s ease-out ${i * 0.07}s both`,
              }}>
                <div style={{ fontSize: 28, marginBottom: 12 }}>{f.icon}</div>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: T.white, marginBottom: 8 }}>{f.title}</h3>
                <p style={{ fontSize: 12, color: T.textSecondary, lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PRICING ─── */}
      <section id="pricing" className="landing-section" style={{ padding: "100px 40px", background: `linear-gradient(180deg, transparent, ${T.surface} 20%, ${T.surface} 80%, transparent)` }}>
        <div style={{ maxWidth: 1060, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: T.gold, letterSpacing: 2, textTransform: "uppercase" }}>Pricing</span>
            <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 36, fontWeight: 900, color: T.white, marginTop: 12 }}>Choose Your Edge</h2>
            <p style={{ fontSize: 15, color: T.textSecondary, marginTop: 12 }}>Start free. Upgrade when you're ready for the full picture.</p>

            {/* Billing toggle */}
            <div style={{ display: "inline-flex", alignItems: "center", gap: 12, marginTop: 24, padding: "6px", background: T.card, borderRadius: 10, border: `1px solid ${T.border}` }}>
              <button type="button" onClick={() => setBillingAnnual(false)}
                style={{ padding: "7px 20px", borderRadius: 8, border: "none", background: !billingAnnual ? T.gold : "transparent", color: !billingAnnual ? T.bg : T.textMuted, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Outfit', sans-serif", transition: "all 0.2s" }}>
                Monthly
              </button>
              <button type="button" onClick={() => setBillingAnnual(true)}
                style={{ padding: "7px 20px", borderRadius: 8, border: "none", background: billingAnnual ? T.gold : "transparent", color: billingAnnual ? T.bg : T.textMuted, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Outfit', sans-serif", transition: "all 0.2s", display: "flex", alignItems: "center", gap: 6 }}>
                Annual
                <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 6, background: "rgba(16,185,129,0.2)", color: T.green, fontWeight: 700 }}>SAVE 20%</span>
              </button>
            </div>
          </div>

          {/* Plan cards */}
          <div className="pricing-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, alignItems: "start" }}>
            {/* FREE */}
            <div className="pricing-card" style={{ background: T.surface, borderRadius: 16, padding: 32 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: T.white, marginBottom: 4 }}>Free</h3>
              <p style={{ fontSize: 12, color: T.textMuted, marginBottom: 20 }}>Explore the platform</p>
              <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 24 }}>
                <span style={{ fontSize: 11, color: T.textMuted }}>AED</span>
                <span style={{ fontFamily: "'Fraunces', serif", fontSize: 42, fontWeight: 900, color: T.white }}>0</span>
                <span style={{ fontSize: 13, color: T.textMuted }}>forever</span>
              </div>
              {["5 project previews", "Current year financials", "Basic market overview", "Community search"].map((f, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", fontSize: 13, color: T.textSecondary }}>
                  <span style={{ color: T.green }}>✓</span>{f}
                </div>
              ))}
              <button onClick={() => onSignUpClick("free")} className="cta-btn-outline" style={{ width: "100%", justifyContent: "center", padding: "12px 0", marginTop: 24 }}>
                Get Started Free
              </button>
            </div>

            {/* PRO */}
            <div className="pricing-card pricing-popular" style={{ background: T.surface, borderRadius: 16, padding: 32 }}>
              <div style={{ position: "absolute", top: -13, left: "50%", transform: "translateX(-50%)", padding: "4px 16px", borderRadius: 12, background: T.gold, color: T.bg, fontSize: 11, fontWeight: 700, letterSpacing: 0.5, whiteSpace: "nowrap" }}>
                ⭐ MOST POPULAR
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: T.white }}>Pro</h3>
                <span style={{ fontSize: 10, padding: "3px 10px", borderRadius: 6, background: "rgba(16,185,129,0.12)", color: T.green, fontWeight: 700, border: "1px solid rgba(16,185,129,0.25)" }}>7-DAY FREE TRIAL</span>
              </div>
              <p style={{ fontSize: 12, color: T.textMuted, marginBottom: 20 }}>For agents & active investors</p>
              <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 8 }}>
                <span style={{ fontSize: 11, color: T.textMuted }}>AED</span>
                <span style={{ fontFamily: "'Fraunces', serif", fontSize: 42, fontWeight: 900, color: T.gold }}>{proPrice}</span>
                <span style={{ fontSize: 13, color: T.textMuted }}>/month</span>
              </div>
              {billingAnnual && <p style={{ fontSize: 11, color: T.green, marginBottom: 16 }}>Billed AED {proPrice * 12}/year · Save AED {(99 - proPrice) * 12}</p>}
              {[
                "All 48+ active projects",
                "Full 6-year financials & ratios",
                "Rental yields & ROI calculator",
                "30 RE stocks tracker",
                "Competitor intelligence",
                "3-project comparison + PDF export",
                "Location & community deep-dives",
                "Priority email support",
              ].map((f, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", fontSize: 13, color: T.textSecondary }}>
                  <span style={{ color: T.green }}>✓</span>{f}
                </div>
              ))}
              <button onClick={() => onSignUpClick("pro")} className="cta-btn" style={{ width: "100%", justifyContent: "center", padding: "13px 0", marginTop: 24 }}>
                Start 7-Day Free Trial →
              </button>
              <p style={{ fontSize: 10, color: T.textMuted, marginTop: 10, textAlign: "center" }}>No credit card · Cancel anytime</p>
            </div>

            {/* ENTERPRISE */}
            <div className="pricing-card" style={{ background: T.surface, borderRadius: 16, padding: 32 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: T.white, marginBottom: 4 }}>Enterprise</h3>
              <p style={{ fontSize: 12, color: T.textMuted, marginBottom: 20 }}>For agencies & funds</p>
              <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 24 }}>
                <span style={{ fontSize: 11, color: T.textMuted }}>AED</span>
                <span style={{ fontFamily: "'Fraunces', serif", fontSize: 42, fontWeight: 900, color: T.white }}>{entPrice}</span>
                <span style={{ fontSize: 13, color: T.textMuted }}>/month</span>
              </div>
              {[
                "Everything in Pro",
                "Multi-user team accounts",
                "PDF report generation ⏳",
                "API data access ⏳",
                "Custom branded dashboards ⏳",
                "Developer-level raw data",
                "Dedicated account manager",
                "White-label options ⏳",
              ].map((f, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", fontSize: 13, color: T.textSecondary }}>
                  <span style={{ color: T.green }}>✓</span>{f}
                </div>
              ))}
              <a href="mailto:mianwaleed689@gmail.com?subject=Enterprise%20Plan%20Enquiry" className="cta-btn-outline" style={{ width: "100%", justifyContent: "center", padding: "12px 0", marginTop: 24, display: "flex", textDecoration: "none" }}>
                Contact Us →
              </a>
              <p style={{ fontSize: 10, color: T.textMuted, marginTop: 12, textAlign: "center" }}>⏳ = Launching Q3 2026</p>
            </div>
          </div>

          {/* Feature comparison table */}
          <div style={{ marginTop: 48, overflowX: "auto" }}>
            <table className="compare-table" style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${T.border}` }}>
                  <th style={{ padding: "14px 16px", textAlign: "left", color: T.textMuted, fontSize: 11, fontWeight: 600, width: "40%" }}>FEATURE</th>
                  {["Free", "Pro", "Enterprise"].map(p => (
                    <th key={p} style={{ padding: "14px 16px", textAlign: "center", color: p === "Pro" ? T.gold : T.white, fontSize: 13, fontWeight: 700 }}>{p}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { feature: "Project listings", vals: ["5 projects", "All 48+", "All 48+"] },
                  { feature: "Financial data", vals: ["1 year", "6 years", "6 years + raw"] },
                  { feature: "Rental yield data", vals: ["—", "✓", "✓"] },
                  { feature: "ROI calculator", vals: ["—", "✓", "✓"] },
                  { feature: "Project comparison", vals: ["—", "3 projects", "Unlimited"] },
                  { feature: "PDF export", vals: ["—", "✓", "✓"] },
                  { feature: "Stock tracker", vals: ["—", "✓", "✓"] },
                  { feature: "Team accounts", vals: ["1 user", "1 user", "Unlimited"] },
                  { feature: "API access", vals: ["—", "—", "Q3 2026"] },
                ].map((row, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.015)" }}>
                    <td style={{ padding: "11px 16px", fontSize: 13, color: T.textSecondary }}>{row.feature}</td>
                    {row.vals.map((v, j) => (
                      <td key={j} style={{ padding: "11px 16px", textAlign: "center", fontSize: 13, color: v === "—" ? T.textMuted : j === 1 ? T.gold : T.white, fontWeight: j === 1 ? 600 : 400 }}>
                        {v === "✓" ? <span style={{ color: T.green, fontSize: 16 }}>✓</span> : v}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIALS ─── */}
      <section className="landing-section" style={{ padding: "100px 40px" }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 52 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: T.gold, letterSpacing: 2, textTransform: "uppercase" }}>Social Proof</span>
            <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 34, fontWeight: 900, color: T.white, marginTop: 12 }}>What Professionals Are Saying</h2>
          </div>
          <div className="three-col" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
            {testimonials.map((t, i) => (
              <div key={i} className="feature-card" style={{ background: T.surface, borderRadius: 16, padding: 28, border: `1px solid ${T.border}` }}>
                <div style={{ color: T.gold, fontSize: 22, marginBottom: 14, letterSpacing: 2 }}>★★★★★</div>
                <p style={{ fontSize: 14, color: T.textSecondary, lineHeight: 1.7, marginBottom: 20, fontStyle: "italic" }}>"{t.quote}"</p>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: "50%", background: `linear-gradient(135deg, ${T.gold}, ${T.goldLight})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: T.bg, flexShrink: 0 }}>
                    {t.avatar}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.white }}>{t.name}</div>
                    <div style={{ fontSize: 11, color: T.textMuted }}>{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── WHO IS IT FOR ─── */}
      <section className="landing-section" style={{ padding: "80px 40px", background: `linear-gradient(180deg, transparent, ${T.surface} 30%, ${T.surface} 70%, transparent)` }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 52 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: T.gold, letterSpacing: 2, textTransform: "uppercase" }}>Built For</span>
            <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 34, fontWeight: 900, color: T.white, marginTop: 12 }}>The People Who Move Dubai's Market</h2>
          </div>
          <div className="two-col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {[
              { icon: "🏡", title: "Real Estate Agents", desc: "Stop sending clients scattered PDFs. Share verified project data, location intelligence, and comparison reports instantly — from one link." },
              { icon: "💼", title: "Property Investors", desc: "AED 2M+ decisions deserve verified data. Get yields, risk scores, financial trends, and ROI projections — not broker estimates." },
              { icon: "🏢", title: "Developers", desc: "Track your competition in real-time. See market share shifts, pricing trends, and buyer sentiment across Dubai's top developers." },
              { icon: "🏦", title: "Banks & Institutions", desc: "Risk-assess real estate exposure with verified market data, developer financials, and macro indicators." },
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
      <section style={{ padding: "56px 40px", borderTop: `1px solid ${T.border}`, borderBottom: `1px solid ${T.border}` }}>
        <div style={{ maxWidth: 800, margin: "0 auto", textAlign: "center" }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: T.textMuted, letterSpacing: 2, textTransform: "uppercase", marginBottom: 20 }}>Verified Data From</p>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 12 }}>
            {["Dubai Land Department", "Emaar IR Reports", "DXBinteract", "Knight Frank", "ValuStrat", "Engel & Völkers", "BetterHomes", "Bayut", "Yahoo Finance", "TradingView"].map((src, i) => (
              <span key={i} style={{ fontSize: 12, color: T.textSecondary, padding: "7px 14px", borderRadius: 8, background: T.surface, border: `1px solid ${T.border}` }}>{src}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ─── ROADMAP ─── */}
      <section className="landing-section" style={{ padding: "100px 40px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 52 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: T.gold, letterSpacing: 2, textTransform: "uppercase" }}>The Vision</span>
            <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 34, fontWeight: 900, color: T.white, marginTop: 12 }}>The Bloomberg of Dubai Real Estate</h2>
            <p style={{ fontSize: 15, color: T.textSecondary, marginTop: 12, maxWidth: 560, margin: "12px auto 0" }}>One platform. Every developer. Every community. Every transaction. Updated automatically. 24/7.</p>
          </div>
          <div className="three-col" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
            {[
              { phase: "Phase 1", status: "LIVE NOW", color: T.green, title: "Emaar Properties", desc: "48 projects, full financials, yields, risk, competitors, stocks — complete intelligence module.", bg: "rgba(16,185,129,0.05)" },
              { phase: "Phase 2", status: "Q3 2026", color: T.gold, title: "Top 10 Developers", desc: "DAMAC, Sobha, Meraas, ALDAR, Binghatti, Nakheel, Azizi, Tiger, Danube — all in one place.", bg: T.goldMuted },
              { phase: "Phase 3", status: "2027", color: T.blue, title: "Full Dubai Market", desc: "All 228+ developers, every community, every transaction type, live DLD data feeds.", bg: "rgba(59,130,246,0.05)" },
            ].map((item, i) => (
              <div key={i} style={{ background: item.bg, borderRadius: 16, padding: 28, border: `1px solid rgba(212,168,67,0.1)` }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: item.color, letterSpacing: 1 }}>{item.phase}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 10, background: `${item.color}22`, color: item.color, border: `1px solid ${item.color}44` }}>{item.status}</span>
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: T.white, marginBottom: 8 }}>{item.title}</h3>
                <p style={{ fontSize: 12, color: T.textSecondary, lineHeight: 1.6 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section id="faq" className="landing-section" style={{ padding: "100px 40px", background: `linear-gradient(180deg, transparent, ${T.surface} 20%, ${T.surface} 80%, transparent)` }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 52 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: T.gold, letterSpacing: 2, textTransform: "uppercase" }}>FAQ</span>
            <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 34, fontWeight: 900, color: T.white, marginTop: 12 }}>Common Questions</h2>
          </div>
          <div>
            {faqs.map((faq, i) => (
              <div key={i} className="faq-item">
                <button type="button" className="faq-btn" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                  <span style={{ fontSize: 15, fontWeight: 600, color: openFaq === i ? T.gold : T.white, paddingRight: 16 }}>{faq.q}</span>
                  <span style={{ color: T.gold, fontSize: 18, flexShrink: 0, transition: "transform 0.2s", transform: openFaq === i ? "rotate(45deg)" : "none", display: "inline-block" }}>+</span>
                </button>
                {openFaq === i && (
                  <div style={{ paddingBottom: 20, fontSize: 14, color: T.textSecondary, lineHeight: 1.7, animation: "fadeUp 0.25s ease-out both" }}>
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA ─── */}
      <section className="landing-section" style={{ padding: "100px 40px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div className="landing-hero-glow" style={{ top: "-100px" }} />
        <div style={{ position: "relative", zIndex: 1, maxWidth: 640, margin: "0 auto" }}>
          <div style={{ display: "inline-block", padding: "4px 14px", borderRadius: 8, background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)", marginBottom: 20 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: T.green }}>NO CREDIT CARD REQUIRED</span>
          </div>
          <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 40, fontWeight: 900, color: T.white, marginBottom: 16, lineHeight: 1.15 }}>
            Ready to Make Smarter<br/>
            <span style={{ color: T.gold }}>Real Estate Decisions?</span>
          </h2>
          <p style={{ fontSize: 16, color: T.textSecondary, marginBottom: 32 }}>
            Join Dubai's most informed agents and investors. 7-day Pro trial included with every new account.
          </p>
          <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
            <button onClick={onSignUpClick} className="cta-btn" style={{ padding: "18px 48px", fontSize: 17 }}>
              Start Free Trial →
            </button>
            <a href="mailto:mianwaleed689@gmail.com?subject=DXB%20Analytics%20Enquiry"
              style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "18px 32px", background: "transparent", borderRadius: 12, color: T.gold, fontSize: 15, fontWeight: 700, textDecoration: "none", border: `1px solid ${T.gold}`, transition: "all 0.2s" }}>
              ✉️ Contact Us
            </a>
          </div>
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
          <p style={{ fontSize: 11, color: T.textMuted }}>© 2026 DXB Analytics · Dubai, UAE · Not financial advice</p>
          <div style={{ display: "flex", gap: 24 }}>
            <a href="#features" className="nav-link" style={{ fontSize: 12 }}>Features</a>
            <a href="#pricing" className="nav-link" style={{ fontSize: 12 }}>Pricing</a>
            <a href="#faq" className="nav-link" style={{ fontSize: 12 }}>FAQ</a>
            <a href="/terms" className="nav-link" style={{ fontSize: 12 }}>Terms</a>
            <a href="/privacy" className="nav-link" style={{ fontSize: 12 }}>Privacy</a>
            <a href="mailto:mianwaleed689@gmail.com" className="nav-link" style={{ fontSize: 12 }}>Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
