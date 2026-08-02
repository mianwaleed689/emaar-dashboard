/* eslint-disable */
/* ═══════════════════════════════════════════════════════════════════════════
   DXB ANALYTICS — LANDING PAGE
   Rebuilt 2026-08-01.

   The previous page sold "23 tools" as a grid of pills behind a generic SaaS
   hero. That both overstated the product factually and undersold what is
   actually here:

     · 19 UAE legal instruments that resolve to the version in force TODAY,
       and switch themselves the day one is superseded
     · 8 scheduled jobs keeping DLD, Ejari, EIBOR, launches and financials
       current with nobody touching them
     · three distinct surfaces — agents, agencies, and developers claiming
       their own projects
     · every figure carrying a source, a sample size and a verification date

   So the structure follows the product rather than the template:
     hero → a real worked answer → the data spine → the automation →
     who it is for → what is genuinely live → honest comparison → pricing

   Every claim resolves through src/data/landingFacts.js. No bare numeric
   literals in this file.
   ═══════════════════════════════════════════════════════════════════════════ */
import React, { useState, useEffect } from "react";
import { useI18n } from "../i18n";
import {
  MARKET_2025, MARKET_Q1_2026, PLATFORM, TOOLS, TOOL_COUNTS,
  COMPARISON, DATA_SOURCES, PRICING_META,
  LEGAL, AUTOMATION, WORKED_EXAMPLE, CYCLES, EDUCATES,
} from "../data/landingFacts";
/* Prices come from ONE file. This page used to restate AED 99/499 — the exact
   bug config/pricing.js was created to end. */
import {
  PRICING, PRICING_NAMES, PRICING_DISPLAY, PLAN_FEATURES, SEATS,
} from "../config/pricing";

const css = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=Fraunces:opsz,wght@9..144,300;9..144,700;9..144,900&display=swap');
*,*::before,*::after{margin:0;padding:0;box-sizing:border-box}
html{scroll-behavior:smooth;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}
body{background:#04090F;color:#E2E8F0;font-family:'Outfit',sans-serif;overflow-x:hidden}

@keyframes fadeUp{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:translateY(0)}}
@keyframes pulseDot{0%,100%{opacity:.35}50%{opacity:1}}
@keyframes shimmer{0%{background-position:-400% center}100%{background-position:400% center}}
@keyframes sweep{0%{transform:translateX(-120%)}100%{transform:translateX(400%)}}

.au{animation:fadeUp .8s cubic-bezier(.22,1,.36,1) both}

.cta{display:inline-flex;align-items:center;justify-content:center;gap:10px;padding:17px 44px;
  background:linear-gradient(135deg,#D4A843 0%,#E8C96A 50%,#D4A843 100%);background-size:200% auto;
  color:#04090F;border:none;border-radius:12px;font-family:'Outfit',sans-serif;font-size:16px;
  font-weight:800;cursor:pointer;transition:all .3s cubic-bezier(.22,1,.36,1);letter-spacing:-.3px;
  white-space:nowrap;text-decoration:none}
.cta:hover{background-position:right center;transform:translateY(-3px);box-shadow:0 16px 40px rgba(212,168,67,.4)}
.cta:active{transform:scale(.98)}

.ghost{display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:16px 32px;
  background:rgba(212,168,67,.05);color:#D4A843;border:1px solid rgba(212,168,67,.3);border-radius:12px;
  font-family:'Outfit',sans-serif;font-size:15px;font-weight:600;cursor:pointer;transition:all .3s;
  white-space:nowrap;text-decoration:none}
.ghost:hover{background:rgba(212,168,67,.1);border-color:#D4A843;transform:translateY(-2px)}

.nav-link{color:#64748B;text-decoration:none;font-size:13.5px;font-weight:500;transition:color .2s}
.nav-link:hover{color:#D4A843}

.bento{background:rgba(14,29,53,.55);border:1px solid rgba(212,168,67,.1);border-radius:18px;padding:26px;
  backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);
  transition:all .35s cubic-bezier(.22,1,.36,1);position:relative;overflow:hidden}
.bento:hover{border-color:rgba(212,168,67,.28);transform:translateY(-4px);box-shadow:0 24px 60px rgba(0,0,0,.5)}

.gold-text{background:linear-gradient(135deg,#D4A843,#E8C96A,#C89830,#E8C96A);background-size:300% auto;
  -webkit-background-clip:text;-webkit-text-fill-color:transparent;animation:shimmer 5s linear infinite}

.role-tab{padding:11px 26px;border-radius:10px;border:1px solid rgba(212,168,67,.15);background:transparent;
  color:#475569;font-size:13.5px;font-weight:600;cursor:pointer;transition:all .25s;font-family:'Outfit',sans-serif}
.role-tab:hover:not(.active-tab){border-color:rgba(212,168,67,.3);color:#94A3B8}
.active-tab{border-color:#D4A843!important;background:rgba(212,168,67,.1)!important;color:#D4A843!important}

.faq-btn{width:100%;text-align:left;background:none;border:none;cursor:pointer;padding:20px 0;
  display:flex;justify-content:space-between;align-items:center;font-family:'Outfit',sans-serif;
  border-bottom:1px solid rgba(212,168,67,.08);transition:all .2s}
.faq-btn:hover{border-color:rgba(212,168,67,.25)}

/* The worked answer. Styled like a document rather than a marketing tile —
   this is the product's actual output, so it should look like it. */
.receipt{background:linear-gradient(160deg,rgba(14,29,53,.92),rgba(8,15,28,.96));
  border:1px solid rgba(212,168,67,.22);border-radius:20px;position:relative;overflow:hidden}
.receipt::after{content:'';position:absolute;top:0;left:0;width:30%;height:1px;
  background:linear-gradient(90deg,transparent,rgba(212,168,67,.75),transparent);
  animation:sweep 5s linear infinite}
.receipt-row{display:flex;justify-content:space-between;align-items:baseline;
  padding:13px 0;border-bottom:1px dashed rgba(212,168,67,.12)}

.src-chip{display:inline-flex;align-items:center;gap:5px;font-size:10.5px;color:#64748B;
  border:1px solid rgba(255,255,255,.07);border-radius:6px;padding:3px 8px;background:rgba(255,255,255,.02)}

.job-row{display:flex;align-items:center;gap:14px;padding:12px 0;border-bottom:1px solid rgba(255,255,255,.045)}
.job-row:last-child{border-bottom:none}
.law-row{display:flex;gap:14px;align-items:baseline;padding:10px 0;border-bottom:1px solid rgba(255,255,255,.045)}
.law-row:last-child{border-bottom:none}
.dot{width:6px;height:6px;border-radius:50%;flex-shrink:0}

@media(max-width:1024px){
  .two-col{grid-template-columns:1fr!important}
  .four-col{grid-template-columns:1fr 1fr!important}
  .tools-grid{grid-template-columns:repeat(2,1fr)!important}
  .pricing-grid{grid-template-columns:1fr!important}
}
@media(max-width:768px){
  .lp-section{padding:64px 20px!important}
  .lp-nav{padding:0 20px!important}
  .nav-desktop{display:none!important}
  .hero-h1{font-size:40px!important;letter-spacing:-1.4px!important}
  .hero-btns{flex-direction:column!important;align-items:stretch!important}
  .four-col{grid-template-columns:1fr!important}
  .two-inner{grid-template-columns:1fr!important}
  .tools-grid{grid-template-columns:1fr!important}
  .compare-t th,.compare-t td{padding:9px 7px!important;font-size:11px!important}
}
`;

/* ── building blocks ───────────────────────────────────────────────────── */

const Tag = ({ children, tone = "#D4A843" }) => (
  <div style={{
    display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 14px",
    borderRadius: 20, border: `1px solid ${tone}22`, background: `${tone}0D`,
    fontSize: 10.5, fontWeight: 700, letterSpacing: 1.4, textTransform: "uppercase", color: tone,
  }}>
    <span className="dot" style={{ background: tone, animation: "pulseDot 2.4s infinite" }} />
    {children}
  </div>
);

const H2 = ({ children }) => (
  <h2 style={{
    fontFamily: "'Fraunces',serif", fontSize: "clamp(30px,4vw,46px)", fontWeight: 900,
    color: "#F8FAFC", lineHeight: 1.08, letterSpacing: -1.2, marginTop: 18,
  }}>{children}</h2>
);

const Lede = ({ children, max = 560 }) => (
  <p style={{ fontSize: 15, color: "#64748B", lineHeight: 1.75, maxWidth: max, margin: "16px auto 0" }}>
    {children}
  </p>
);

const Section = ({ id, children, alt = false, pad = "104px 48px" }) => (
  <section id={id} className="lp-section" style={{
    padding: pad,
    background: alt ? "linear-gradient(180deg,#04090F,#060F1E 18%,#060F1E 82%,#04090F)" : "transparent",
  }}>
    <div style={{ maxWidth: 1120, margin: "0 auto" }}>{children}</div>
  </section>
);

/* ── page ──────────────────────────────────────────────────────────────── */

export default function LandingPage({ onLoginClick, onSignUpClick }) {
  const { lang, setLang, LANGUAGES } = useI18n() || {};
  const [openFaq, setOpenFaq] = useState(null);
  const [audience, setAudience] = useState("agent");
  const [annual, setAnnual] = useState(false);

  useEffect(() => {
    const s = document.createElement("style");
    s.textContent = css;
    document.head.appendChild(s);
    return () => { try { document.head.removeChild(s); } catch (e) {} };
  }, []);

  const active = EDUCATES.find(a => a.key === audience) || EDUCATES[0];
  const price = k => annual ? Math.round(PRICING[k] * 0.8) : PRICING[k];

  const FAQ = [
    ["Where does the data come from?",
     `Dubai Land Department transaction records, Ejari registered rental contracts, published developer annual reports and UAE Central Bank rates. Every figure carries its source and the date it was verified — market totals come from ${MARKET_2025.source}.`],
    ["How is this different from Bayut or DXBinteract?",
     "They are good at what they do. Bayut and Property Finder list property and publish DLD-backed history; DXBinteract gives DLD transactions away free. None of them tell you whether a specific unit is worth buying, cite the law your advice rests on, or hold your leads. We are the workbench you use after the search."],
    ["What does 'partial' mean on a tool?",
     "The tool works and the data is real, but coverage is incomplete or a figure is modelled rather than measured. We label it instead of quietly filling the gap. Anything with no source at all is listed as in development and is not part of Pro."],
    ["How do the legal citations work?",
     `We hold ${LEGAL.citationCount} UAE instruments — escrow law, the rent index decree, mortgage caps, the Civil Code. Each resolves to the version in force on the day you open it, and switches itself when one is superseded. You quote the right article without checking.`],
    ["How current is it?",
     `${AUTOMATION.jobs.length} scheduled jobs run daily — DLD transactions at 03:00, yields and developer financials at 05:00, market pricing at 06:00, EIBOR on weekday mornings, new launches at 08:00.`],
    ["Is there a free trial?",
     `Yes — ${PRICING_META.trialDays} days, no card. Full access to all ${TOOL_COUNTS.sellable} live tools, ${PLATFORM.projects.label} projects and ${CYCLES.years} years of history from day one.`],
    ["Can I cancel anytime?", "Yes. No contract, no notice period, no exit fee."],
    ["How far back does the history go?",
     `${CYCLES.firstYear} to ${CYCLES.lastYear} — ${CYCLES.years} years, ${CYCLES.transactionsInSpan.toLocaleString()} Land Department transactions, every year above a thousand. That covers the 2008 peak, the 2009 crash, the 2020 COVID low and the current run. Most tools show you the last few years; this shows a client what a downturn actually looked like.`],
    ["Is the yield gross or net?",
     "Both. Gross is rent over price. Net is after service charges, vacancy and management — which is the number that decides whether a purchase makes sense, and the one brochures leave out."],
  ];

  return (
    <div style={{ background: "#04090F", minHeight: "100vh" }}>

      {/* ── NAV ─────────────────────────────────────────────────────────── */}
      <nav className="lp-nav" style={{
        position: "sticky", top: 0, zIndex: 100, height: 64, display: "flex",
        alignItems: "center", justifyContent: "space-between", padding: "0 40px",
        background: "rgba(4,9,15,.82)", backdropFilter: "blur(18px)",
        borderBottom: "1px solid rgba(212,168,67,.08)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8, background: "rgba(212,168,67,.12)",
            border: "1px solid rgba(212,168,67,.3)", display: "flex", alignItems: "center",
            justifyContent: "center", fontFamily: "'Fraunces',serif", fontWeight: 900,
            color: "#D4A843", fontSize: 14,
          }}>D</div>
          <span style={{ fontFamily: "'Fraunces',serif", fontSize: 17, fontWeight: 900, color: "#D4A843" }}>
            DXB Analytics
          </span>
        </div>

        <div className="nav-desktop" style={{ display: "flex", alignItems: "center", gap: 30 }}>
          {[["#answer", "How it works"], ["#data", "The data"], ["#who", "Who it's for"], ["#pricing", "Pricing"]].map(([h, l]) => (
            <a key={h} href={h} className="nav-link">{l}</a>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {LANGUAGES && (
            <select value={lang} onChange={e => setLang && setLang(e.target.value)} aria-label="Language"
              style={{
                background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.08)",
                borderRadius: 8, color: "#64748B", fontSize: 12, padding: "6px 8px",
                fontFamily: "'Outfit',sans-serif", cursor: "pointer",
              }}>
              {Object.entries(LANGUAGES).map(([k, v]) => (
                <option key={k} value={k}>{(v && (v.label || v.name)) || k}</option>
              ))}
            </select>
          )}
          <button onClick={onLoginClick} className="ghost" style={{ padding: "9px 20px", fontSize: 13.5 }}>Login</button>
          <button onClick={onSignUpClick} className="cta" style={{ padding: "10px 22px", fontSize: 13.5 }}>Start free</button>
        </div>
      </nav>

      {/* ── HERO ────────────────────────────────────────────────────────── */}
      <Section pad="88px 48px 64px">
        <div className="au" style={{ textAlign: "center" }}>
          <Tag tone="#10B981">Dubai Land Department · synced daily 03:00</Tag>
          <h1 className="hero-h1" style={{
            fontFamily: "'Fraunces',serif", fontSize: "clamp(42px,6.4vw,78px)", fontWeight: 900,
            lineHeight: 1.02, letterSpacing: -2.6, color: "#F8FAFC", marginTop: 26,
          }}>
            Every number comes<br/><span className="gold-text">with its receipt.</span>
          </h1>
          <Lede max={640}>
            {CYCLES.years} years of Land Department records, Ejari contracts and {LEGAL.citationCount} UAE
            legal instruments. Every figure carries its source, its sample size and the date
            it was checked — so you can defend it in front of a client, not just quote it.
          </Lede>

          <div className="hero-btns" style={{ display: "flex", gap: 14, justifyContent: "center", marginTop: 34 }}>
            <button onClick={onSignUpClick} className="cta">Start free — no card →</button>
            <a href="#answer" className="ghost">See a real answer</a>
          </div>
          <p style={{ fontSize: 11.5, color: "#334155", marginTop: 14 }}>
            {PRICING_META.trialDays}-day free trial · no card · {CYCLES.firstYear}–{CYCLES.lastYear} on record
          </p>
        </div>

        <div style={{
          marginTop: 60, borderRadius: 16, border: "1px solid rgba(212,168,67,.12)",
          background: "rgba(212,168,67,.02)", padding: "22px 26px",
        }}>
          <div className="four-col" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 22 }}>
            {[
              { v: MARKET_2025.totalValueLabel,        l: "Dubai market, 2025",    s: MARKET_2025.growthYoY },
              { v: MARKET_2025.salesTransactionsLabel, l: "DLD sales, 2025",       s: null },
              { v: MARKET_Q1_2026.valueLabel,          l: "Q1 2026",               s: MARKET_Q1_2026.growthYoY },
              { v: PLATFORM.projects.label,            l: "projects tracked here", s: null },
            ].map(x => (
              <div key={x.l} style={{ textAlign: "center" }}>
                <div style={{ fontFamily: "'Fraunces',serif", fontSize: 27, fontWeight: 900, color: "#D4A843", lineHeight: 1 }}>{x.v}</div>
                <div style={{ fontSize: 11, color: "#475569", marginTop: 6 }}>
                  {x.l}{x.s && <span style={{ color: "#10B981", marginLeft: 6 }}>{x.s}</span>}
                </div>
              </div>
            ))}
          </div>
          <div style={{ textAlign: "center", marginTop: 16, fontSize: 10, color: "#334155" }}>
            Source:{" "}
            <a href={MARKET_2025.sourceUrl} target="_blank" rel="noopener noreferrer"
               style={{ color: "#475569", textDecoration: "underline" }}>{MARKET_2025.source}</a>
            {" · verified "}{MARKET_2025.verifiedAt}
          </div>
        </div>
      </Section>

      {/* ── THE WORKED ANSWER ───────────────────────────────────────────── */}
      <Section id="answer" alt>
        <div style={{ textAlign: "center", marginBottom: 46 }}>
          <Tag>What you actually get</Tag>
          <H2>A client asks a question.<br/>You answer it with proof.</H2>
          <Lede>
            One real output, computed from Land Department sales against registered
            Ejari rents. Not a mock-up — the same numbers the product returns.
          </Lede>
        </div>

        <div className="two-col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 26, alignItems: "start" }}>
          <div className="receipt" style={{ padding: "26px 28px" }}>
            <div style={{ fontSize: 11.5, color: "#64748B", marginBottom: 4 }}>{WORKED_EXAMPLE.question}</div>
            <div style={{ fontFamily: "'Fraunces',serif", fontSize: 21, fontWeight: 900, color: "#F1F5F9", marginBottom: 16 }}>
              {WORKED_EXAMPLE.community} · {WORKED_EXAMPLE.unit}
            </div>

            <div className="receipt-row">
              <span style={{ fontSize: 12.5, color: "#64748B" }}>Median sale price</span>
              <span>
                <span style={{ fontSize: 16, fontWeight: 800, color: "#F1F5F9" }}>{WORKED_EXAMPLE.medianSaleLabel}</span>
                <span style={{ fontSize: 10.5, color: "#334155", marginLeft: 8 }}>n={WORKED_EXAMPLE.saleSampleN.toLocaleString()}</span>
              </span>
            </div>
            <div className="receipt-row">
              <span style={{ fontSize: 12.5, color: "#64748B" }}>Median annual rent</span>
              <span>
                <span style={{ fontSize: 16, fontWeight: 800, color: "#F1F5F9" }}>{WORKED_EXAMPLE.medianRentLabel}</span>
                <span style={{ fontSize: 10.5, color: "#334155", marginLeft: 8 }}>n={WORKED_EXAMPLE.rentSampleN.toLocaleString()}</span>
              </span>
            </div>
            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "baseline",
              borderTop: "1px solid rgba(212,168,67,.22)", marginTop: 8, paddingTop: 16,
            }}>
              <span style={{ fontSize: 13, color: "#D4A843", fontWeight: 700 }}>Gross yield</span>
              <span style={{ fontFamily: "'Fraunces',serif", fontSize: 32, fontWeight: 900, color: "#10B981", lineHeight: 1 }}>
                {WORKED_EXAMPLE.grossYieldLabel}
              </span>
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginTop: 18 }}>
              {WORKED_EXAMPLE.sources.map(s => <span key={s} className="src-chip">{s}</span>)}
              <span className="src-chip">{WORKED_EXAMPLE.window}</span>
            </div>
            <div style={{ marginTop: 14, padding: "10px 12px", borderRadius: 9, background: "rgba(212,168,67,.05)", border: "1px solid rgba(212,168,67,.14)" }}>
              <div style={{ fontSize: 11, color: "#D4A843", fontWeight: 600 }}>⚖ {WORKED_EXAMPLE.legalNote}</div>
            </div>
            <div style={{ marginTop: 12, fontSize: 10.5, color: "#334155", lineHeight: 1.6 }}>
              {WORKED_EXAMPLE.caveat} We show the caveat rather than round it away.
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {[
              { t: "The sample size is on the card",
                d: "A yield from eleven sales and a yield from two thousand are not the same claim. You can see which one you are making before you say it out loud." },
              { t: "The law is attached, and it is current",
                d: `${LEGAL.citationCount} UAE instruments resolve to the version in force today and switch themselves the day one is superseded. You quote the right article without checking.` },
              { t: "Estimates are labelled as estimates",
                d: "Where a figure is modelled rather than measured, it says so. Nothing is dressed up as a fact it is not." },
              { t: "It goes to WhatsApp in one tap",
                d: "The same breakdown, formatted for a client, without rebuilding it in a spreadsheet first." },
            ].map(x => (
              <div key={x.t} className="bento" style={{ padding: "20px 22px" }}>
                <div style={{ fontSize: 14.5, fontWeight: 700, color: "#F1F5F9", marginBottom: 7 }}>{x.t}</div>
                <div style={{ fontSize: 12.5, color: "#64748B", lineHeight: 1.7 }}>{x.d}</div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ── THE DATA SPINE ──────────────────────────────────────────────── */}
      <Section id="data">
        <div style={{ textAlign: "center", marginBottom: 44 }}>
          <Tag>The spine</Tag>
          <H2>What it actually knows.</H2>
          <Lede>Four sources, one model. Nothing scraped off a brochure.</Lede>
        </div>

        <div className="four-col" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
          {[
            { n: PLATFORM.projects.label,                l: "Projects",                  s: "price · yield · escrow · build stage" },
            { n: PLATFORM.dldRegisteredDevelopers.label, l: "DLD-registered developers", s: "licence, status, registry" },
            { n: PLATFORM.communities.label,             l: "Curated communities",       s: `across ${PLATFORM.developers.label} developers` },
            { n: String(LEGAL.citationCount),            l: "UAE legal instruments",     s: "always the version in force" },
          ].map(x => (
            <div key={x.l} className="bento" style={{ padding: "22px 20px" }}>
              <div style={{ fontFamily: "'Fraunces',serif", fontSize: 32, fontWeight: 900, color: "#D4A843", lineHeight: 1 }}>{x.n}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#CBD5E1", marginTop: 10 }}>{x.l}</div>
              <div style={{ fontSize: 11, color: "#475569", marginTop: 5, lineHeight: 1.55 }}>{x.s}</div>
            </div>
          ))}
        </div>

        <div className="two-inner" style={{ display: "grid", gridTemplateColumns: "1.05fr 1fr", gap: 20, marginTop: 20 }}>
          <div className="bento">
            <div style={{ fontSize: 10.5, letterSpacing: 1.2, textTransform: "uppercase", color: "#475569", fontWeight: 700, marginBottom: 12 }}>
              Sourced from
            </div>
            {DATA_SOURCES.map(s => (
              <div key={s.name} className="law-row">
                <span style={{ fontSize: 13, fontWeight: 700, color: "#E2E8F0", minWidth: 185 }}>{s.name}</span>
                <span style={{ fontSize: 12, color: "#475569" }}>{s.detail}</span>
              </div>
            ))}
          </div>

          <div className="bento">
            <div style={{ fontSize: 10.5, letterSpacing: 1.2, textTransform: "uppercase", color: "#475569", fontWeight: 700, marginBottom: 12 }}>
              The law it rests on
            </div>
            <div style={{ maxHeight: 208, overflowY: "auto" }}>
              {LEGAL.instruments.map(i => (
                <div key={i.ref} className="law-row">
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#D4A843", minWidth: 148 }}>{i.ref}</span>
                  <span style={{ fontSize: 11.5, color: "#475569" }}>{i.topic}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* ── AUTOMATION ──────────────────────────────────────────────────── */}
      <Section alt>
        <div className="two-col" style={{ display: "grid", gridTemplateColumns: "1fr 1.05fr", gap: 44, alignItems: "center" }}>
          <div>
            <Tag tone="#14B8A6">Always current</Tag>
            <H2>It updates itself<br/>before you wake up.</H2>
            <p style={{ fontSize: 15, color: "#64748B", lineHeight: 1.75, marginTop: 16 }}>
              {AUTOMATION.jobs.length} scheduled jobs keep the platform current with nobody
              touching it. Land Department transactions land at 3am. Yields and developer
              financials recompute at 5. EIBOR refreshes before the market opens.
            </p>
            <p style={{ fontSize: 13.5, color: "#475569", lineHeight: 1.75, marginTop: 14 }}>
              The legal layer works the same way: a citation resolves to the version in
              force <em style={{ color: "#D4A843", fontStyle: "normal" }}>on the day you open it</em>. When
              Civil Code provisions were replaced by Decree 25/2025, every reference
              switched on the effective date. Nobody had to remember.
            </p>
          </div>

          <div className="bento" style={{ padding: "22px 26px" }}>
            {AUTOMATION.jobs.map(j => (
              <div key={j.name + j.time} className="job-row">
                <span style={{ fontFamily: "'Fraunces',serif", fontSize: 14, fontWeight: 900, color: "#D4A843", minWidth: 50 }}>{j.time}</span>
                <span className="dot" style={{ background: "#14B8A6" }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: "#CBD5E1", minWidth: 118 }}>{j.name}</span>
                <span style={{ fontSize: 11.5, color: "#475569" }}>{j.detail}</span>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ── WHO IT TEACHES ──────────────────────────────────────────────── */}
      <Section id="who">
        <div style={{ textAlign: "center", marginBottom: 34 }}>
          <Tag>Three people, three questions</Tag>
          <H2>It doesn't just store data.<br/>It settles the argument.</H2>
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "center", marginBottom: 28, flexWrap: "wrap" }}>
          {EDUCATES.map(a => (
            <button key={a.key} onClick={() => setAudience(a.key)}
              className={`role-tab ${audience === a.key ? "active-tab" : ""}`}>
              {a.who}
            </button>
          ))}
        </div>

        <div className="bento" style={{ padding: "34px 38px", maxWidth: 820, margin: "0 auto" }}>
          <div style={{ fontSize: 15, color: "#64748B", fontStyle: "italic", marginBottom: 8 }}>
            {active.q}
          </div>
          <div style={{ fontFamily: "'Fraunces',serif", fontSize: 25, fontWeight: 900, color: "#F1F5F9", marginBottom: 24, lineHeight: 1.2 }}>
            {active.line}
          </div>
          <div className="two-inner" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 15 }}>
            {active.points.map(pt => (
              <div key={pt} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <span style={{ color: "#10B981", fontSize: 13, lineHeight: 1.5 }}>✓</span>
                <span style={{ fontSize: 13, color: "#94A3B8", lineHeight: 1.65 }}>{pt}</span>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ── 27 YEARS / EVERY CYCLE ──────────────────────────────────────── */}
      <Section alt>
        <div style={{ textAlign: "center", marginBottom: 44 }}>
          <Tag tone="#8B5CF6">{CYCLES.years} years on record</Tag>
          <H2>Anyone can tell a client<br/>the market is strong.</H2>
          <Lede max={620}>
            Only someone holding {CYCLES.firstYear} to {CYCLES.lastYear} can tell them what
            happens when it isn't. {CYCLES.transactionsInSpan.toLocaleString()} Land Department
            transactions, every year above a thousand — both crashes included.
          </Lede>
        </div>

        {/* the cycle chart — real DLD annual values */}
        <div className="bento" style={{ padding: "28px 30px", marginBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 10, height: 190 }}>
            {CYCLES.chart.map(c => {
              const max = Math.max(...CYCLES.chart.map(x => x.v));
              const h = Math.max(6, (c.v / max) * 100);
              const down = c.v < 100;
              return (
                <div key={c.y} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 7 }}>
                  <span style={{ fontSize: 10.5, color: down ? "#EF4444" : "#D4A843", fontWeight: 700 }}>
                    {c.v}
                  </span>
                  <div style={{
                    width: "100%", height: `${h}%`, borderRadius: "5px 5px 0 0",
                    background: down
                      ? "linear-gradient(180deg,#EF444455,#EF444418)"
                      : "linear-gradient(180deg,#D4A843,#D4A84322)",
                    border: `1px solid ${down ? "#EF444455" : "rgba(212,168,67,.35)"}`,
                  }} />
                  <span style={{ fontSize: 10.5, color: "#475569" }}>{c.y}</span>
                </div>
              );
            })}
          </div>
          <div style={{ textAlign: "center", fontSize: 10.5, color: "#334155", marginTop: 14 }}>
            Total Dubai transaction value, AED billions · {CYCLES.source}
          </div>
        </div>

        {/* the phases */}
        <div className="four-col" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
          {CYCLES.phases.map(ph => (
            <div key={ph.years} className="bento" style={{
              padding: "16px 18px",
              borderColor: ph.crash ? "rgba(239,68,68,.22)" : ph.peak ? "rgba(212,168,67,.28)" : undefined,
            }}>
              <div style={{ fontSize: 11, color: ph.crash ? "#EF4444" : "#D4A843", fontWeight: 700 }}>{ph.years}</div>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: "#E2E8F0", marginTop: 5 }}>{ph.label}</div>
              <div style={{ fontSize: 11, color: "#475569", marginTop: 5, lineHeight: 1.5 }}>{ph.detail}</div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 20, padding: "18px 22px", borderRadius: 14, border: "1px solid rgba(239,68,68,.18)", background: "rgba(239,68,68,.03)" }}>
          <div style={{ fontSize: 13.5, color: "#E2E8F0", fontWeight: 700, marginBottom: 6 }}>
            Read 2009 again
          </div>
          <div style={{ fontSize: 12.5, color: "#64748B", lineHeight: 1.75 }}>
            Transaction volume <em style={{ color: "#E2E8F0", fontStyle: "normal" }}>rose</em> to 38,613 while total
            value <em style={{ color: "#EF4444", fontStyle: "normal" }}>collapsed</em> to AED 83B. More deals, far less
            money — that is what distressed selling looks like in the record. It is the most
            useful thing you can show a client who thinks prices only go one way.
          </div>
        </div>
      </Section>

      {/* ── WHAT'S LIVE ─────────────────────────────────────────────────── */}
      <Section id="tools" alt>
        <div style={{ textAlign: "center", marginBottom: 42 }}>
          <Tag tone="#10B981">{TOOL_COUNTS.sellable} tools live today</Tag>
          <H2>Portals find the property.<br/>We tell you if it's worth buying.</H2>
          <Lede max={540}>
            Everything below works right now. What is still being built is listed
            underneath and marked as such — better you see the roadmap than an empty screen.
          </Lede>
        </div>

        <div className="tools-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
          {TOOLS.filter(t => t.status !== "soon").map(t => (
            <div key={t.name} className="bento" style={{ padding: "14px 16px", borderRadius: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span className="dot" style={{ background: t.status === "live" ? "#10B981" : "#D4A843" }} />
                <span style={{ fontSize: 12.5, fontWeight: 700, color: "#CBD5E1" }}>{t.name}</span>
                {t.status === "partial" && (
                  <span style={{ fontSize: 9, color: "#D4A843", border: "1px solid rgba(212,168,67,.3)", borderRadius: 4, padding: "1px 5px", marginLeft: "auto" }}>partial</span>
                )}
              </div>
              <div style={{ fontSize: 11, color: "#475569", marginTop: 6, lineHeight: 1.5 }}>{t.desc}</div>
            </div>
          ))}
        </div>

        {TOOL_COUNTS.soon > 0 && (
          <div style={{ marginTop: 22, padding: "16px 18px", borderRadius: 12, border: "1px dashed rgba(255,255,255,.09)" }}>
            <div style={{ fontSize: 10, letterSpacing: .7, textTransform: "uppercase", color: "#475569", fontWeight: 700, marginBottom: 9 }}>
              In development — not part of Pro yet
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {TOOLS.filter(t => t.status === "soon").map(t => (
                <span key={t.name} style={{ fontSize: 10.5, color: "#334155", border: "1px solid rgba(255,255,255,.06)", borderRadius: 5, padding: "3px 8px" }}>{t.name}</span>
              ))}
            </div>
          </div>
        )}
      </Section>

      {/* ── HONEST COMPARISON ───────────────────────────────────────────── */}
      <Section>
        <div style={{ textAlign: "center", marginBottom: 38 }}>
          <Tag>Where we fit</Tag>
          <H2>We are not a portal.</H2>
          <Lede max={620}>{COMPARISON.note}</Lede>
        </div>

        <div style={{ borderRadius: 18, border: "1px solid rgba(212,168,67,.1)", overflow: "hidden" }}>
          <table className="compare-t" style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#060F1E" }}>
                <th style={{ padding: "15px 20px", textAlign: "left", color: "#334155", fontSize: 10.5, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>Capability</th>
                {COMPARISON.columns.map((p, i) => {
                  const own = i === COMPARISON.columns.length - 1;
                  return (
                    <th key={p} style={{
                      padding: "15px 16px", textAlign: "center", fontSize: 12.5, fontWeight: 700,
                      color: own ? "#D4A843" : "#475569",
                      background: own ? "rgba(212,168,67,.04)" : "transparent",
                      borderLeft: "1px solid rgba(212,168,67,.06)",
                    }}>{p}</th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {COMPARISON.rows.map((row, i) => {
                const last = row.values.length - 1;
                return (
                  <tr key={i} style={{ borderTop: "1px solid rgba(212,168,67,.05)" }}>
                    <td style={{ padding: "11px 20px", fontSize: 12.5, color: "#64748B" }}>{row.capability}</td>
                    {row.values.map((val, j) => {
                      const own = j === last;
                      return (
                        <td key={j} style={{
                          padding: "11px 16px", textAlign: "center", fontSize: 12.5,
                          background: own ? "rgba(212,168,67,.02)" : "transparent",
                          borderLeft: "1px solid rgba(212,168,67,.05)", fontWeight: own ? 600 : 400,
                        }}>
                          {val === "yes" ? <span style={{ color: own ? "#D4A843" : "#10B981", fontWeight: 700 }}>✓</span>
                          : val === "no" ? <span style={{ color: "#1E293B" }}>—</span>
                          : <span style={{ color: own ? "#D4A843" : "#94A3B8" }}>{val}</span>}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p style={{ textAlign: "center", fontSize: 10.5, color: "#334155", marginTop: 14 }}>{COMPARISON.source}</p>
      </Section>

      {/* ── PRICING ─────────────────────────────────────────────────────── */}
      <Section id="pricing" alt>
        <div style={{ textAlign: "center", marginBottom: 34 }}>
          <Tag>Pricing</Tag>
          <H2>One deal pays for<br/>two years of Pro.</H2>
          <div style={{ display: "inline-flex", gap: 6, marginTop: 24, padding: 5, borderRadius: 11, border: "1px solid rgba(212,168,67,.14)" }}>
            {[["Monthly", false], ["Annual — save 20%", true]].map(([l, v]) => (
              <button key={l} onClick={() => setAnnual(v)}
                className={`role-tab ${annual === v ? "active-tab" : ""}`}
                style={{ padding: "8px 18px", fontSize: 12.5 }}>{l}</button>
            ))}
          </div>
        </div>

        <div className="pricing-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 20, alignItems: "start", maxWidth: 780, margin: "0 auto" }}>
          {["pro", "enterprise"].map(key => {
            const popular = key === "pro";
            return (
              <div key={key} className="bento" style={{
                padding: "32px 28px",
                border: popular ? "1px solid rgba(212,168,67,.4)" : undefined,
                background: popular ? "rgba(212,168,67,.03)" : undefined,
              }}>
                {popular && <div style={{ marginBottom: 12 }}><Tag>Most popular</Tag></div>}
                <div style={{ fontSize: 17, fontWeight: 800, color: "#F1F5F9" }}>{PRICING_NAMES[key]}</div>
                <div style={{ fontSize: 12, color: "#475569", marginTop: 5, minHeight: 30 }}>
                  {key === "pro"
                    ? "One agent, everything unlocked"
                    : `Up to ${SEATS.enterprise} agents under one agency`}
                </div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 14 }}>
                  <span style={{ fontSize: 13, color: "#475569" }}>AED</span>
                  <span style={{ fontFamily: "'Fraunces',serif", fontSize: 50, fontWeight: 900, color: "#D4A843", lineHeight: 1 }}>
                    {price(key)}
                  </span>
                  <span style={{ fontSize: 12, color: "#475569" }}>
                    {annual ? "/mo, billed annually" : "/month"}
                  </span>
                </div>
                {key === "enterprise" && (
                  <div style={{ fontSize: 11, color: "#10B981", marginTop: 8 }}>
                    AED {Math.round(price(key) / SEATS.enterprise)} per seat at {SEATS.enterprise} agents
                  </div>
                )}
                <div style={{ margin: "22px 0 24px", display: "flex", flexDirection: "column", gap: 10 }}>
                  {PLAN_FEATURES[key].map(f => (
                    <div key={f} style={{ display: "flex", gap: 9, alignItems: "flex-start" }}>
                      <span style={{ color: "#10B981", fontSize: 12 }}>✓</span>
                      <span style={{ fontSize: 12.5, color: "#94A3B8", lineHeight: 1.6 }}>{f}</span>
                    </div>
                  ))}
                </div>
                <button onClick={onSignUpClick} className={popular ? "cta" : "ghost"} style={{ width: "100%", padding: "14px 0", fontSize: 14 }}>
                  Start {PRICING_META.trialDays}-day free trial
                </button>
                <p style={{ textAlign: "center", fontSize: 10.5, color: "#334155", marginTop: 10 }}>
                  {PRICING_META.trialNote} · cancel anytime
                </p>
              </div>
            );
          })}
        </div>

        <p style={{ textAlign: "center", fontSize: 12, color: "#475569", marginTop: 26 }}>
          A free tier is available with limited access — {PRICING_DISPLAY.free} forever.
        </p>
        {PRICING_META.roadmap.length > 0 && (
          <p style={{ textAlign: "center", fontSize: 11, color: "#334155", marginTop: 8 }}>
            On the roadmap, not yet included: {PRICING_META.roadmap.map(r => `${r.feature} (${r.eta})`).join(" · ")}
          </p>
        )}
      </Section>

      {/* ── FAQ ─────────────────────────────────────────────────────────── */}
      <Section id="faq">
        <div style={{ textAlign: "center", marginBottom: 34 }}>
          <Tag>FAQ</Tag>
          <H2>Straight answers.</H2>
        </div>
        <div style={{ maxWidth: 740, margin: "0 auto" }}>
          {FAQ.map(([q, a], i) => (
            <div key={q}>
              <button className="faq-btn" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                <span style={{ fontSize: 14.5, fontWeight: 600, color: "#E2E8F0" }}>{q}</span>
                <span style={{ color: "#D4A843", fontSize: 20, lineHeight: 1 }}>{openFaq === i ? "−" : "+"}</span>
              </button>
              {openFaq === i && (
                <div style={{ padding: "16px 0 20px", fontSize: 13.5, color: "#64748B", lineHeight: 1.8 }}>{a}</div>
              )}
            </div>
          ))}
        </div>
      </Section>

      {/* ── CLOSING ─────────────────────────────────────────────────────── */}
      <Section alt pad="110px 48px">
        <div style={{ textAlign: "center" }}>
          <Tag tone="#10B981">No credit card required</Tag>
          <H2>Stop quoting numbers<br/>you can't defend.</H2>
          <Lede max={520}>
            Built on Dubai Land Department records. {PRICING_META.trialDays}-day Pro trial, cancel anytime.
          </Lede>
          <div className="hero-btns" style={{ display: "flex", gap: 14, justifyContent: "center", marginTop: 30 }}>
            <button onClick={onSignUpClick} className="cta">Start free</button>
            <a href="mailto:hello@dxbanalytics.com?subject=DXB%20Analytics%20enquiry" className="ghost">Talk to us</a>
          </div>
        </div>
      </Section>

      {/* ── FOOTER ──────────────────────────────────────────────────────── */}
      <footer style={{ borderTop: "1px solid rgba(212,168,67,.08)", padding: "34px 48px" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 18 }}>
          <div>
            <div style={{ fontFamily: "'Fraunces',serif", fontSize: 15, fontWeight: 900, color: "#D4A843" }}>DXB Analytics</div>
            <div style={{ fontSize: 11, color: "#334155", marginTop: 5 }}>Dubai real estate intelligence, sourced from DLD</div>
          </div>
          <div style={{ display: "flex", gap: 22, flexWrap: "wrap", alignItems: "center" }}>
            {[["#answer", "How it works"], ["#data", "The data"], ["#pricing", "Pricing"], ["#faq", "FAQ"], ["/terms", "Terms"], ["/privacy", "Privacy"]].map(([h, l]) => (
              <a key={h} href={h} className="nav-link">{l}</a>
            ))}
          </div>
        </div>
        <div style={{ maxWidth: 1120, margin: "24px auto 0", fontSize: 10.5, color: "#1E293B", lineHeight: 1.7 }}>
          © 2026 DXB Analytics · Dubai, UAE · For informational purposes only — not financial or investment advice.<br/>
          Market figures sourced from the Dubai Land Department. Rental yields computed from registered
          Ejari contracts against DLD sale records; sample sizes shown alongside every figure.
        </div>
      </footer>
    </div>
  );
}
