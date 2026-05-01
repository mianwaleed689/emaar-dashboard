/* eslint-disable */
/* ‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê
   DXB ANALYTICS ‚‚Ç¨‚Äù SHARED UI COMPONENTS
   Extracted from EmaarDashboardV2.jsx
   Reusable components used across multiple tabs
   ‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê */

import React, { useState } from "react";
import { T } from "../data";
import { Icons } from "./Icons";

/* ‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨ LOADING SKELETON ‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨ */
export const LoadingSkeleton = ({ rows = 6, cols = 3 }) => (
  <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 12 }}>
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="chart-box fade-up" style={{ animationDelay: `${i * 0.05}s`, padding: 20, minHeight: 120 }}>
        <div style={{ width: "40%", height: 10, borderRadius: 4, background: T.surfaceAlt, marginBottom: 12 }} />
        <div style={{ width: "60%", height: 22, borderRadius: 4, background: T.surfaceAlt, marginBottom: 10 }} />
        <div style={{ width: "80%", height: 8, borderRadius: 4, background: T.surfaceAlt }} />
      </div>
    ))}
  </div>
);

/* ‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨ KPI CARD ‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨ */
export const KPI = ({ label, value, sub, icon, delay = 0, onClick }) => {
  const [hovered, setHovered] = useState(false);
  const isClickable = !!onClick;
  return (
    <div
      className={`kpi-card fade-up delay-${delay}`}
      title={isClickable ? `Click to view ${label} breakdown` : label}
      onClick={onClick}
      onMouseEnter={() => isClickable && setHovered(true)}
      onMouseLeave={() => isClickable && setHovered(false)}
      style={{ cursor: isClickable ? "pointer" : "default", transition: "transform 0.2s, box-shadow 0.2s, border-color 0.2s", transform: hovered ? "translateY(-3px)" : "none", boxShadow: hovered ? `0 10px 30px rgba(212,168,67,0.2)` : undefined, borderColor: hovered ? T.gold : undefined, position: "relative" }}
    >
      <div style={{ position: "absolute", top: -30, right: -30, width: 80, height: 80, borderRadius: "50%", background: `radial-gradient(circle, ${T.goldGlow} 0%, transparent 70%)` }} />
      {isClickable && <div style={{ position: "absolute", top: 10, right: 10, fontSize: 14, color: hovered ? T.gold : T.border, transition: "color 0.2s" }}>‚‚Ç¨∫</div>}
      <div style={{ fontSize: 10, fontWeight: 600, color: T.textMuted, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 8 }}>{label}</div>
      <div style={{ fontFamily: "'Fraunces', serif", fontSize: 26, fontWeight: 700, color: T.gold, lineHeight: 1.1, marginBottom: 4 }}>{value}</div>
      <div style={{ fontSize: 12, fontWeight: 500, color: T.teal, display: "flex", alignItems: "center", gap: 4 }}>
        {sub?.includes("+") && <span style={{ color: T.green }}>{Icons.up}</span>}
        {sub}
      </div>
      {isClickable && <div style={{ marginTop: 8, fontSize: 9, color: hovered ? T.gold : T.textMuted, fontWeight: 600, letterSpacing: 0.5, transition: "color 0.2s" }}>{hovered ? "View breakdown ‚Ü‚Äô" : "Click for details"}</div>}
    </div>
  );
};

/* ‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨ FORECAST CARD (expandable) ‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨ */
export const ForecastCard = ({ firm, color, short, forecast, detail, bullets, sourceUrl }) => {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="chart-box" style={{ borderTop: `3px solid ${color}`, cursor: "pointer", transition: "all 0.2s" }} onClick={() => setExpanded(e => !e)}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <h4 style={{ color, fontSize: 15, fontWeight: 700, marginBottom: 4, fontFamily: "'Fraunces', serif" }}>{firm}</h4>
        <span style={{ fontSize: 16, color: T.textMuted, display: "inline-block", transform: expanded ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>‚åÑ</span>
      </div>
      <div style={{ fontSize: 10, fontWeight: 700, color: T.white, background: color + "20", padding: "3px 8px", borderRadius: 5, display: "inline-block", marginBottom: 8 }}>{forecast}</div>
      <p style={{ color: T.textSecondary, fontSize: 12, lineHeight: 1.6 }}>{short}</p>
      {expanded && (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${T.border}` }}>
          <p style={{ color: T.textSecondary, fontSize: 12, lineHeight: 1.7, marginBottom: 10 }}>{detail}</p>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 5 }}>
            {bullets.map((b, bi) => (
              <li key={bi} style={{ fontSize: 11, color: T.textSecondary, display: "flex", gap: 6, alignItems: "flex-start" }}>
                <span style={{ color, fontWeight: 700, marginTop: 1 }}>‚‚Ç¨∫</span> {b}
              </li>
            ))}
          </ul>
          <a href={sourceUrl} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ display: "inline-block", marginTop: 10, fontSize: 10, color, fontWeight: 700, textDecoration: "none" }}>Full Report ‚Ü‚Äî</a>
        </div>
      )}
      {!expanded && <div style={{ marginTop: 8, fontSize: 10, color: T.textMuted }}>Click to expand full analysis</div>}
    </div>
  );
};

/* ‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨ SECTION HEADER ‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨ */
export const Section = ({ title, sub, children, delay = 0 }) => (
  <div className={`fade-up delay-${delay}`} style={{ marginTop: 36, marginBottom: 16 }}>
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
      <div style={{ width: 4, height: 28, background: `linear-gradient(180deg, ${T.gold}, transparent)`, borderRadius: 2 }} />
      <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 700, color: T.white }}>{title}</h2>
    </div>
    {sub && <p style={{ color: T.textSecondary, fontSize: 12, marginLeft: 16, marginTop: 2 }}>{sub}</p>}
    {children}
  </div>
);

/* ‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨ CHART WRAPPER ‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨ */
export const Chart = ({ title, children, style: extraStyle }) => (
  <div className="chart-box" style={extraStyle}>
    {title && <h3 style={{ fontSize: 11, fontWeight: 600, color: T.goldLight, letterSpacing: 1, textTransform: "uppercase", marginBottom: 14 }}>{title}</h3>}
    {children}
  </div>
);

/* ‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨ RECHARTS CUSTOM TOOLTIP ‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨ */
export const CustomTooltip = ({ active, payload, label }) => {
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

/* ‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨ DATA BADGE ‚‚Ç¨‚Äù verified data stamp ‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨ */
export const DataBadge = ({ source, date, type = "dld" }) => {
  const cfg = {
    dld:     { label: "DLD Verified",     color: "#10B981", icon: "‚ú‚Äú" },
    reidin:  { label: "REIDIN Index",     color: "#3B82F6", icon: "‚ú‚Äú" },
    emaar:   { label: "Emaar IR",         color: "#D4A843", icon: "‚ú‚Äú" },
    live:    { label: "Live ¬∑ Firestore", color: "#10B981", icon: "‚‚Äîè" },
    ai:      { label: "AI Estimate",      color: "#8B5CF6", icon: "‚ú¶" },
    manual:  { label: "Admin Verified",   color: "#F59E0B", icon: "‚ú‚Äú" },
  };
  const c = cfg[type] || cfg.dld;
  return (
    <span title={`Source: ${source || c.label}${date ? " ¬∑ " + date : ""}`} style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      fontSize: 9, fontWeight: 700, color: c.color, letterSpacing: 0.5,
      background: c.color + "12", border: `1px solid ${c.color}30`,
      borderRadius: 5, padding: "1px 6px", cursor: "default", flexShrink: 0,
    }}>
      <span style={{ fontSize: 8 }}>{c.icon}</span>{c.label}
    </span>
  );
};

/* ‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨ TAB SOURCES FOOTER ‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨ */
export const TabSources = ({ sources }) => (
  <div style={{
    marginTop: 28, padding: "12px 16px",
    background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 12, display: "flex", alignItems: "flex-start", gap: 10, flexWrap: "wrap"
  }}>
    <span style={{ fontSize: 9, fontWeight: 700, color: "rgba(212,168,67,0.7)", letterSpacing: 1.2, textTransform: "uppercase", paddingTop: 2, flexShrink: 0 }}>Sources</span>
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
      {sources.map((s, i) => (
        s.url ? (
          <a key={i} href={s.url} target="_blank" rel="noopener noreferrer" style={{
            fontSize: 10, color: "rgba(255,255,255,0.55)", background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: "3px 10px",
            textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4
          }}
          onMouseEnter={e => { e.currentTarget.style.color = "#D4A843"; e.currentTarget.style.borderColor = "rgba(212,168,67,0.4)"; }}
          onMouseLeave={e => { e.currentTarget.style.color = "rgba(255,255,255,0.55)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; }}
          >{s.label} ‚Ü‚Äî</a>
        ) : (
          <span key={i} style={{
            fontSize: 10, color: "rgba(255,255,255,0.45)", background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.07)", borderRadius: 20, padding: "3px 10px"
          }}>{s.label}</span>
        )
      ))}
    </div>
  </div>
);

/* ‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨ EMPTY STATE ‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨ */
export const EmptyState = ({ tab, icon, description, adminHint }) => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 24px", textAlign: "center", minHeight: 400 }}>
    <div style={{ width: 72, height: 72, borderRadius: 20, background: "rgba(212,168,67,0.08)", border: "1px solid rgba(212,168,67,0.2)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24, fontSize: 32 }}>{icon}</div>
    <div style={{ fontFamily: "'Fraunces',serif", fontSize: 22, fontWeight: 800, color: T.white, marginBottom: 10, letterSpacing: "-0.5px" }}>{tab}</div>
    <div style={{ fontSize: 14, color: T.textSecondary, lineHeight: 1.7, maxWidth: 420, marginBottom: 28 }}>{description}</div>
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 18px", borderRadius: 20, background: "rgba(212,168,67,0.06)", border: "1px solid rgba(212,168,67,0.15)" }}>
      <div style={{ width: 7, height: 7, borderRadius: "50%", background: T.gold, animation: "pulse 2s infinite" }} />
      <span style={{ fontSize: 12, color: T.gold, fontWeight: 600 }}>Ready for data import</span>
    </div>
    {adminHint && (
      <div style={{ marginTop: 20, fontSize: 12, color: T.textMuted, background: T.surface, padding: "10px 16px", borderRadius: 8, border: `1px solid ${T.border}`, maxWidth: 380 }}>{adminHint}</div>
    )}
  </div>
);

/* ‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨ PRO GATE OVERLAY ‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨ */
export const ProGate = ({ children, isPro, message = "Upgrade to Pro to unlock this data", onUpgrade, blur = true }) => {
  if (isPro) return children;
  return (
    <div style={{ position: "relative" }}>
      <div style={{ filter: blur ? "blur(5px)" : "none", pointerEvents: "none", userSelect: "none", opacity: blur ? 0.45 : 1 }}>{children}</div>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "rgba(4,9,15,0.75)", borderRadius: 16, backdropFilter: "blur(4px)", zIndex: 5 }}>
        <div style={{ background: T.surface, border: `1px solid ${T.gold}`, borderRadius: 16, padding: "28px 32px", textAlign: "center", maxWidth: 380, boxShadow: `0 20px 60px rgba(0,0,0,0.5), 0 0 30px ${T.gold}18` }}>
          <div style={{ width: 48, height: 48, borderRadius: "50%", background: `linear-gradient(135deg, ${T.gold}22, ${T.gold}08)`, border: `1px solid ${T.gold}40`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, margin: "0 auto 12px" }}>ü‚Äù‚Äô</div>
          <div style={{ fontFamily: "'Fraunces', serif", fontSize: 17, fontWeight: 800, color: T.white, marginBottom: 6 }}>{message}</div>
          <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 16, lineHeight: 1.6 }}>Join 500+ investors using DXB Analytics Pro to track the Dubai real estate market</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 18 }}>
            {["All 48+ active projects", "Full financials & yields", "ROI & mortgage calculator", "Currency converter", "Portfolio tracker"].map((f, i) => (
              <div key={i} style={{ fontSize: 11, color: T.textSecondary, textAlign: "left", paddingLeft: 4 }}>‚ú‚Äú {f}</div>
            ))}
          </div>
          <button type="button" onClick={onUpgrade} style={{ width: "100%", padding: "11px 0", background: `linear-gradient(135deg, ${T.gold}, #B8912F)`, color: T.bg, border: "none", borderRadius: 10, fontSize: 13, fontWeight: 800, cursor: "pointer", fontFamily: "'Outfit', sans-serif", letterSpacing: 0.3 }}>Unlock Pro ‚‚Ç¨‚Äù AED 99/mo ‚Ü‚Äô</button>
          <div style={{ fontSize: 10, color: T.textMuted, marginTop: 8 }}>7-day money-back guarantee ¬∑ Cancel anytime</div>
        </div>
      </div>
    </div>
  );
};

/* ‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨ PRO GATE FULL PAGE ‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨ */
export const ProGateFullPage = ({ tabName, onUpgrade }) => {
  const tabBenefits = {
    "DXB Estimate": ["Automated property valuations", "AVM price estimates per unit", "Bayut live listings", "¬±15% accuracy model"],
    "Portfolio": ["Track your Dubai investments", "ROI calculations", "Portfolio performance chart", "Yield tracking"],
    "Yields": ["Gross & net yield by community", "STR vs LTR comparison", "Top yielding Dubai areas", "Historical yield trends"],
    "Mortgage": ["Live EIBOR rates", "UAE bank comparison", "Monthly payment calculator", "Affordability analysis"],
    "DLD Volumes": ["Real transaction volumes", "Community deal counts", "YoY growth by area", "Quarterly breakdown"],
    "STR vs LTR": ["Airbnb vs long-term yields", "Occupancy rates", "Nightly rate benchmarks", "Best STR communities"],
    "Developer Health": ["Developer financial scores", "Delivery track records", "Risk ratings", "Off-plan safety analysis"],
    "Competitors": ["Emaar vs DAMAC vs Nakheel", "Market share data", "Price per sqft comparison", "Analyst ratings"],
    "Service Charges": ["RERA approved rates", "Community-by-community breakdown", "Annual charge estimates", "Hidden cost analysis"],
    "Flip": ["Buy-renovate-sell calculator", "Flip ROI estimator", "DLD fee breakdown", "Best flip communities"],
    "Investment Score": ["AI-powered property scoring", "Risk vs return matrix", "Top picks by budget", "Score breakdown"],
    "Price History": ["Historical price charts", "5-year appreciation data", "Price per sqft trends", "Community comparisons"],
  };
  const benefits = tabBenefits[tabName] || ["Full data access", "Live market insights", "Advanced analytics", "Export reports"];
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh", padding: "40px 20px" }}>
      <div style={{ background: T.surface, border: `1px solid ${T.gold}40`, borderRadius: 24, padding: "48px 40px", textAlign: "center", maxWidth: 480, width: "100%", boxShadow: `0 30px 80px rgba(0,0,0,0.4), 0 0 40px ${T.gold}10` }}>
        <div style={{ width: 64, height: 64, borderRadius: "50%", background: `linear-gradient(135deg, ${T.gold}20, ${T.gold}05)`, border: `1px solid ${T.gold}40`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, margin: "0 auto 20px" }}>ü‚Äù‚Äô</div>
        <div style={{ fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 800, color: T.white, marginBottom: 8 }}>{tabName}</div>
        <div style={{ fontSize: 13, color: T.textMuted, marginBottom: 28, lineHeight: 1.6 }}>This feature is available on the <span style={{ color: T.gold, fontWeight: 700 }}>Pro plan</span>. Upgrade to unlock full access.</div>
        <div style={{ background: T.surfaceAlt, borderRadius: 14, padding: "18px 20px", marginBottom: 28, textAlign: "left" }}>
          <div style={{ fontSize: 11, color: T.gold, fontWeight: 700, marginBottom: 12, textTransform: "uppercase", letterSpacing: 1 }}>What you unlock:</div>
          {benefits.map((b, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <div style={{ width: 18, height: 18, borderRadius: "50%", background: `${T.gold}20`, border: `1px solid ${T.gold}40`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke={T.gold} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              <span style={{ fontSize: 12, color: T.textSecondary }}>{b}</span>
            </div>
          ))}
        </div>
        <button type="button" onClick={onUpgrade} style={{ width: "100%", padding: "14px 0", background: `linear-gradient(135deg, ${T.gold}, #B8912F)`, color: T.bg, border: "none", borderRadius: 12, fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "'Outfit', sans-serif", letterSpacing: 0.3, marginBottom: 10 }}>Upgrade to Pro ‚‚Ç¨‚Äù AED 99/mo ‚Ü‚Äô</button>
        <div style={{ fontSize: 11, color: T.textMuted }}>7-day free trial ¬∑ Cancel anytime ¬∑ Money-back guarantee</div>
      </div>
    </div>
  );
};

/* ‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨ UPGRADE MODAL ‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨ */
export const UpgradeModal = ({ show, onClose }) => {
  if (!show) return null;
  const plans = [
    { name: "Pro", price: "99", period: "month", features: ["All Dubai projects ‚‚Ç¨‚Äù full data", "AI market insights", "Portfolio ROI tracker", "DXB Estimate AVM", "Yield & STR/LTR analysis", "Mortgage calculator", "Price alerts", "PDF export"], popular: true, note: null, cta: "Upgrade to Pro ‚Ü‚Äô" },
    { name: "Enterprise", price: "499", period: "month", features: ["Everything in Pro", "PDF report generation ‚è≥", "API data access ‚è≥", "Custom dashboards ‚è≥", "Multi-user team accounts ‚è≥", "Developer-level raw data", "Dedicated account manager", "White-label options ‚è≥"], popular: false, note: "‚è≥ = Launching Q3 2026", cta: "Contact Sales ‚Ü‚Äô" },
  ];
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(4,9,15,0.92)", zIndex: 3000, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(12px)", padding: 16 }} onClick={onClose}>
      <div className="upgrade-modal" style={{ background: T.surface, borderRadius: 24, border: `1px solid ${T.border}`, width: "95%", maxWidth: 720, padding: 36, position: "relative", boxShadow: "0 40px 100px rgba(0,0,0,0.6)" }} onClick={e => e.stopPropagation()}>
        <button type="button" onClick={onClose} style={{ position: "absolute", top: 16, right: 16, background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8, color: T.textMuted, width: 32, height: 32, cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>‚ú‚Ä¢</button>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "4px 14px", borderRadius: 20, background: "rgba(212,168,67,0.1)", border: `1px solid ${T.gold}40`, marginBottom: 12 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: T.green, animation: "pulse 2s infinite", display: "inline-block" }} />
            <span style={{ fontSize: 11, color: T.gold, fontWeight: 600 }}>500+ investors already using Pro</span>
          </div>
          <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 26, fontWeight: 900, color: T.white, marginBottom: 6 }}>Unlock the Full Platform</h2>
          <p style={{ color: T.textSecondary, fontSize: 13 }}>The most comprehensive Dubai real estate intelligence platform</p>
        </div>
        <div style={{ background: "rgba(16,185,129,0.08)", border: `1px solid ${T.green}30`, borderRadius: 12, padding: "12px 20px", marginBottom: 24, display: "flex", alignItems: "center", justifyContent: "center", gap: 16, flexWrap: "wrap" }}>
          {[["ü‚Äúä", "AED 80.4B", "FY25 Sales tracked"], ["ü‚Äúà", "+40% YoY", "Revenue growth"], ["üè†", "48 Projects", "Full intelligence"], ["ü‚Äô∞", "AED 155B", "Backlog visibility"]].map(([icon, val, label], i) => (
            <div key={i} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 13 }}>{icon} <span style={{ fontFamily: "'Fraunces', serif", fontWeight: 800, color: T.green }}>{val}</span></div>
              <div style={{ fontSize: 10, color: T.textMuted }}>{label}</div>
            </div>
          ))}
        </div>
        <div className="plans-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
          {plans.map((plan, i) => (
            <div key={i} style={{ background: T.surfaceAlt, borderRadius: 16, padding: 24, border: plan.popular ? `2px solid ${T.gold}` : `1px solid ${T.border}`, position: "relative" }}>
              {plan.popular && <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", padding: "4px 16px", borderRadius: 20, background: `linear-gradient(135deg, ${T.gold}, #B8912F)`, color: T.bg, fontSize: 10, fontWeight: 800, letterSpacing: 0.5, whiteSpace: "nowrap" }}>‚≠ê MOST POPULAR</div>}
              <h3 style={{ fontSize: 18, fontWeight: 700, color: T.white, marginBottom: 4, marginTop: plan.popular ? 8 : 0 }}>{plan.name}</h3>
              <div style={{ display: "flex", alignItems: "baseline", gap: 3, marginBottom: 16 }}>
                <span style={{ fontSize: 11, color: T.textMuted }}>AED</span>
                <span style={{ fontFamily: "'Fraunces', serif", fontSize: 38, fontWeight: 900, color: plan.popular ? T.gold : T.white, lineHeight: 1 }}>{plan.price}</span>
                <span style={{ fontSize: 12, color: T.textMuted }}>/{plan.period}</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 16 }}>
                {plan.features.map((f, j) => (
                  <div key={j} style={{ display: "flex", alignItems: "flex-start", gap: 7, fontSize: 12, color: f.includes("‚è≥") ? T.textMuted : T.textSecondary }}>
                    <span style={{ color: f.includes("‚è≥") ? T.textMuted : T.green, fontSize: 11, marginTop: 1, flexShrink: 0 }}>‚ú‚Äú</span>{f}
                  </div>
                ))}
              </div>
              {plan.note && <div style={{ fontSize: 10, color: T.textMuted, marginBottom: 12, fontStyle: "italic" }}>{plan.note}</div>}
              <button type="button" onClick={() => { onClose(); window.dispatchEvent(new CustomEvent("dxb-checkout", { detail: plan })); }}
                style={{ width: "100%", padding: "12px 0", background: plan.popular ? `linear-gradient(135deg, ${T.gold}, #B8912F)` : "transparent", color: plan.popular ? T.bg : T.gold, border: plan.popular ? "none" : `1px solid ${T.gold}`, borderRadius: 10, fontSize: 13, fontWeight: 800, cursor: "pointer", fontFamily: "'Outfit', sans-serif", letterSpacing: 0.3 }}>{plan.cta}</button>
            </div>
          ))}
        </div>
        <div style={{ textAlign: "center", display: "flex", justifyContent: "center", gap: 24, flexWrap: "wrap" }}>
          {["ü‚Äù‚Äô Secure payment", "‚Ü© 7-day money-back", "‚ö° Instant access", "‚ùå Cancel anytime"].map((t, i) => (
            <span key={i} style={{ fontSize: 11, color: T.textMuted }}>{t}</span>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨ PASSWORD STRENGTH METER ‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨ */
export const PasswordStrength = ({ password }) => {
  const score = [/.{8,}/, /[0-9]/, /[A-Z]/, /[^A-Za-z0-9]/].filter(r => r.test(password)).length;
  const levels = [
    { label: "Too short", color: "#EF4444" },
    { label: "Weak", color: "#F59E0B" },
    { label: "Good", color: "#3B82F6" },
    { label: "Strong", color: "#10B981" },
    { label: "Very Strong", color: "#10B981" },
  ];
  if (!password) return null;
  const lvl = levels[Math.min(score, 4)];
  return (
    <div style={{ marginTop: 6 }}>
      <div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
        {[0,1,2,3].map(i => (
          <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i < score ? lvl.color : "rgba(255,255,255,0.08)", transition: "background 0.3s" }} />
        ))}
      </div>
      <div style={{ fontSize: 10, color: lvl.color, fontWeight: 600 }}>{lvl.label}</div>
    </div>
  );
};

/* ‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨ FOCUS TRAP HOOK ‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨ */
export function useFocusTrap(active) {
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (!active || !ref.current) return;
    const el = ref.current;
    const focusable = el.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const handler = (e) => {
      if (e.key !== 'Tab') return;
      if (e.shiftKey) { if (document.activeElement === first) { e.preventDefault(); last?.focus(); } }
      else { if (document.activeElement === last) { e.preventDefault(); first?.focus(); } }
    };
    el.addEventListener('keydown', handler);
    first?.focus();
    return () => el.removeEventListener('keydown', handler);
  }, [active]);
  return ref;
}

/* ‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨ TAB ERROR BOUNDARY ‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨ */
export class TabErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(e) { return { hasError: true, error: e }; }
  componentDidCatch(e, i) { console.error("DXB Tab Error:", e); }
  render() {
    if (this.state.hasError) return (
      <div style={{ padding: "60px 24px", textAlign: "center" }}>
        <div style={{ fontSize: 28, marginBottom: 12 }}>‚ö†Ô∏è</div>
        <div style={{ fontFamily: "'Fraunces',serif", fontSize: 16, fontWeight: 700, color: "#EF4444", marginBottom: 8 }}>Tab Error</div>
        <div style={{ fontSize: 12, color: "#9CA3AF", marginBottom: 16 }}>{this.state.error?.message || "Something went wrong in this tab"}</div>
        <button onClick={() => this.setState({ hasError: false, error: null })}
          style={{ padding: "7px 20px", background: "rgba(212,168,67,0.15)", border: "1px solid rgba(212,168,67,0.4)", borderRadius: 8, color: "#D4A843", fontSize: 12, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>
          Try Again
        </button>
        <div style={{ fontSize: 11, color: "#6B7280", marginTop: 10 }}>All other tabs remain accessible ‚‚Ç¨‚Äù use the sidebar to navigate</div>
      </div>
    );
    return this.props.children;
  }
}
