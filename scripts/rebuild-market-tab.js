const fs = require("fs");

const newTab = `/* eslint-disable */
/*
  DXB ANALYTICS — MARKET TAB (Session 7 Redesign)
  Rebuilt for agents, developers, investors, and buyers.
  Data: Firestore marketMetrics collection (seeded Session 7)
  Sources: DLD 2025, ValuStrat, REIDIN, Knight Frank, Cavendish Maxwell, BetterHomes FY2025
*/

import React, { useState } from "react";
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, PieChart, Pie, Legend
} from "recharts";
import { T } from "../data";
import { useMarketKpis, useMarketChart } from "../hooks/useMarketMetrics";

// ── Audience toggle labels ──────────────────────────────────────
const AUDIENCES = ["Investor", "Agent", "Developer", "Buyer"];

// ── Key event annotations per year ──────────────────────────────
const YEAR_EVENTS = {
  "2020": "COVID-19 — V-shaped recovery",
  "2021": "Post-Covid boom · Expo 2020 launch",
  "2022": "First half-trillion year · Golden Visa reform",
  "2023": "+36% volume · Luxury surge begins",
  "2024": "226K deals · AED 761B · record 4th year",
  "2025": "270K+ deals · AED 917B · 5th record year",
  "2026 YTD": "Jan 2026 only · AED 1,976 avg PPSF",
};

// ── Custom chart tooltip ─────────────────────────────────────────
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const event = YEAR_EVENTS[label] || "";
  return (
    <div style={{
      background: "rgba(4,9,15,0.97)", border: \`1px solid \${T.border}\`,
      borderRadius: 10, padding: "12px 16px", minWidth: 220,
    }}>
      <div style={{ fontFamily: "'Fraunces',serif", fontSize: 15, fontWeight: 800, color: T.gold, marginBottom: 6 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: 16, fontSize: 12, color: T.textSecondary, marginBottom: 3 }}>
          <span style={{ color: p.color }}>{p.name}</span>
          <span style={{ color: T.white, fontWeight: 700 }}>{typeof p.value === "number" && p.value > 100 ? p.value.toLocaleString() : p.value}</span>
        </div>
      ))}
      {event && (
        <div style={{ marginTop: 8, paddingTop: 8, borderTop: \`1px solid \${T.border}\`, fontSize: 11, color: T.textMuted, fontStyle: "italic" }}>
          {event}
        </div>
      )}
    </div>
  );
};

// ── KPI Card ─────────────────────────────────────────────────────
const KpiCard = ({ label, value, change, note, color, onClick }) => (
  <div onClick={onClick} style={{
    background: "rgba(255,255,255,0.03)", border: \`1px solid \${T.border}\`,
    borderRadius: 12, padding: "16px 18px", cursor: onClick ? "pointer" : "default",
    transition: "border-color 0.2s",
  }}
    onMouseEnter={e => onClick && (e.currentTarget.style.borderColor = T.gold + "60")}
    onMouseLeave={e => onClick && (e.currentTarget.style.borderColor = T.border)}
  >
    <div style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>{label}</div>
    <div style={{ fontFamily: "'Fraunces',serif", fontSize: 22, fontWeight: 800, color: color || T.white, lineHeight: 1.1, marginBottom: 6 }}>{value || "—"}</div>
    {change && <div style={{ fontSize: 11, color: T.green, display: "flex", alignItems: "center", gap: 4 }}>
      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="18 15 12 9 6 15"/></svg>
      {change}
    </div>}
    {note && <div style={{ fontSize: 10, color: T.textMuted, marginTop: 5, lineHeight: 1.5 }}>{note}</div>}
  </div>
);

// ── Section header ────────────────────────────────────────────────
const SectionHead = ({ title, sub }) => (
  <div style={{ marginBottom: 16, marginTop: 32 }}>
    <div style={{ fontFamily: "'Fraunces',serif", fontSize: 17, fontWeight: 700, color: T.white }}>{title}</div>
    {sub && <div style={{ fontSize: 11, color: T.textMuted, marginTop: 3 }}>{sub}</div>}
  </div>
);

// ── Bar with label ────────────────────────────────────────────────
const StatBar = ({ label, value, pct, color }) => (
  <div style={{ marginBottom: 14 }}>
    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
      <span style={{ fontSize: 12, color: T.textSecondary }}>{label}</span>
      <span style={{ fontSize: 12, fontWeight: 700, color: T.white }}>{value}</span>
    </div>
    <div style={{ height: 6, borderRadius: 3, background: "rgba(255,255,255,0.06)" }}>
      <div style={{ height: "100%", borderRadius: 3, width: pct + "%", background: color || T.gold, transition: "width 0.8s ease" }} />
    </div>
  </div>
);

// ── Main component ────────────────────────────────────────────────
function MarketTab({ liveMarketData, allDevelopers, expandedForecast, setExpandedForecast, handleTabChange }) {
  const [audience, setAudience] = useState("Investor");
  const { data: firestoreKpis = [] } = useMarketKpis();
  const { data: firestoreChart = [] } = useMarketChart();

  // ── Data assembly ─────────────────────────────────────────────
  const live = (liveMarketData || []).filter(d => d.metric && d.value);
  const stats = live.length > 0 ? live : firestoreKpis;

  const getStat = (metric) => {
    const exact = stats.find(s => s.metric === metric);
    if (exact) return exact;
    return stats.find(s => s.metric && s.metric.toLowerCase().includes(metric.toLowerCase()));
  };

  // Chart data — from Firestore, sorted by year, exclude 2026 YTD from main bars
  const fullChart = (firestoreChart.length > 0 ? firestoreChart : [])
    .filter(d => d.year && d.type === "annual")
    .sort((a, b) => String(a.year).localeCompare(String(b.year)));

  const mainChart = fullChart.map(d => ({
    year: String(d.year),
    "Value (AED B)": parseFloat(d.value) || 0,
    "Transactions (K)": d.transactions ? Math.round(d.transactions / 1000) : null,
    "Avg PPSF": d.ppsf || null,
    isYTD: String(d.year).includes("YTD"),
  }));

  // ── Audience-specific insight banners ─────────────────────────
  const insights = {
    Investor: {
      icon: "📈",
      headline: "Market in month 56+ of longest growth cycle — entering stabilisation phase",
      points: [
        "Avg gross yield 6.55% citywide — apartments yield up to 7.03% (REIDIN Dec 2025)",
        "Price growth +19.8% YoY (ValuStrat) — moderating to 5-8% forecast in 2026",
        "87% cash transactions — no systemic mortgage leverage risk",
        "193,100 active investors — largest investor base in DLD history",
      ],
      action: "→ Check Yields tab for community-level ROI",
    },
    Agent: {
      icon: "🏡",
      headline: "270,000+ transactions in 2025 — strongest year on record for deal flow",
      points: [
        "72% of deals in AED 500K–3M range — mid-market is most active (BetterHomes FY2025)",
        "Apartments: 83% of all transactions — studios and 1BR lead volume",
        "Top communities by volume: JVC, Business Bay, Wadi Al Safa 5, Dubai South, Dubai Marina",
        "Buyer leads up 33% YoY — demand still outpacing supply in established communities",
      ],
      action: "→ Check Neighbourhoods tab for community intelligence",
    },
    Developer: {
      icon: "🏗️",
      headline: "228 active developers in 2025 — up 40% from 163 in 2024",
      points: [
        "131,504 units launched by Oct 2025 — off-plan share at 65% of all transactions",
        "~98K units forecast for delivery in 2026 — absorption risk in JVC, Business Bay, Dubai South",
        "Payment plan flexibility drove buyer adoption — 60/40 and 70/30 plans dominate",
        "Q4 2025 was strongest quarter ever: Oct AED 58.4B → Nov AED 64.2B → Dec AED 64.8B",
      ],
      action: "→ Check Developer Health tab for market positioning",
    },
    Buyer: {
      icon: "🔑",
      headline: "Is now the right time to buy? Market maturing — prices moderating in 2026",
      points: [
        "Avg PPSF: AED 1,863 full year 2025 — Jan 2026 already at AED 1,976 (+6% YoY)",
        "Knight Frank forecasts +3% prime / +1% mainstream for 2026 — sustainable growth",
        "Mortgage activity rising — 50,974 mortgage deals in 2025, up 22.5% YoY",
        "Golden Visa: AED 2M+ property qualifies — 10-year renewable residency",
      ],
      action: "→ Check DXB Estimate tab for property valuation",
    },
  };

  const insight = insights[audience];

  return (
    <div style={{ animation: "fadeUp 0.4s ease-out forwards", paddingBottom: 40 }}>

      {/* ── Header ─────────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", padding: "10px 0", marginBottom: 20, borderBottom: \`1px solid \${T.border}\`, flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color: T.white, fontFamily: "'Fraunces',serif" }}>Dubai Real Estate Market</div>
          <div style={{ fontSize: 11, color: T.textMuted, marginTop: 3 }}>Full year 2025 · Official DLD data · REIDIN · ValuStrat · Knight Frank · BetterHomes</div>
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {["Dubai Land Department", "REIDIN", "ValuStrat", "Knight Frank"].map(s => (
            <span key={s} style={{ fontSize: 10, padding: "3px 10px", borderRadius: 20, border: \`1px solid \${T.border}\`, color: T.textMuted, background: T.surfaceAlt }}>{s}</span>
          ))}
        </div>
      </div>

      {/* ── Audience toggle ────────────────────────────────────── */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 8 }}>I am a...</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {AUDIENCES.map(a => (
            <button key={a} type="button" onClick={() => setAudience(a)} style={{
              padding: "6px 16px", borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: "pointer",
              fontFamily: "'Outfit',sans-serif", transition: "all 0.2s",
              background: audience === a ? "rgba(212,168,67,0.15)" : T.surfaceAlt,
              border: \`1px solid \${audience === a ? "rgba(212,168,67,0.5)" : T.border}\`,
              color: audience === a ? T.gold : T.textSecondary,
            }}>{a}</button>
          ))}
        </div>
      </div>

      {/* ── Audience insight banner ────────────────────────────── */}
      <div style={{
        background: "rgba(212,168,67,0.05)", border: \`1px solid rgba(212,168,67,0.2)\`,
        borderRadius: 12, padding: "16px 20px", marginBottom: 24,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <span style={{ fontSize: 18 }}>{insight.icon}</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: T.white, fontFamily: "'Fraunces',serif" }}>{insight.headline}</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 6, marginBottom: 10 }}>
          {insight.points.map((p, i) => (
            <div key={i} style={{ fontSize: 11, color: T.textSecondary, display: "flex", gap: 8 }}>
              <span style={{ color: T.gold, flexShrink: 0 }}>·</span>
              <span>{p}</span>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 11, color: T.gold, fontWeight: 600, cursor: "pointer" }}>{insight.action}</div>
      </div>

      {/* ── KPI Grid ───────────────────────────────────────────── */}
      <SectionHead title="2025 Market Scorecard" sub="Full year — Dubai Land Department official data · January 2026" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(170px,1fr))", gap: 12, marginBottom: 8 }}>
        <KpiCard label="Total Market Value" value={getStat("Total Market Value")?.value} change={getStat("Total Market Value")?.change} note="All transaction types: sales + mortgages + gifts" onClick={() => handleTabChange?.("DLD Volumes")} />
        <KpiCard label="Total Transactions" value={getStat("Total Transactions")?.value} change={getStat("Total Transactions")?.change} note="5th consecutive annual record" />
        <KpiCard label="Sales Transactions" value="214,912" change="+19% YoY" note="Residential sales only · DLD / Emarat Al Youm" />
        <KpiCard label="Off-Plan Share" value={getStat("Off-Plan Share")?.value} change={getStat("Off-Plan Share")?.change} note="132,000 off-plan deals · BetterHomes FY2025" />
        <KpiCard label="Avg PPSF 2025" value="AED 1,863" change="+6% YoY" note="Jan 2026: AED 1,976 · DXB Analytics / DLD" color={T.gold} />
        <KpiCard label="Avg Gross Yield" value={getStat("Avg Gross Yield")?.value} change="Apts 7.03% · Villas 4.63%" note="REIDIN Dec 2025 · Bayut/CM: ~6.8%" color={T.green} />
        <KpiCard label="Mortgage Deals" value={getStat("Mortgage Transactions")?.value} change={getStat("Mortgage Transactions")?.change} note="Value: AED 179.26B · Cash still 87%" />
        <KpiCard label="Investor Base" value={getStat("Investor Base")?.value} change={getStat("Investor Base")?.change} note="129,600 new investors · 56.6% residents" />
        <KpiCard label="Women Investors" value={getStat("Women Investors")?.value} change={getStat("Women Investors")?.change} note="76,700 deals · +31% value YoY" />
        <KpiCard label="Price Growth" value={getStat("Price Growth")?.value} change="ValuStrat VPI Dec 2025" note="REIDIN Dec 2025: +12.88% · Villas +15.16%" color={T.green} />
        <KpiCard label="Active Developers" value={getStat("Active Developers")?.value} change={getStat("Active Developers")?.change} note="Up from 163 in 2024 · RERA registered" />
        <KpiCard label="Units Launched" value={getStat("Units Launched")?.value} change={getStat("Units Launched")?.change} note="By October 2025 · DLD official" />
      </div>

      {/* ── The Recovery Story chart ───────────────────────────── */}
      <SectionHead title="Dubai's Post-Covid Recovery Story" sub="Transaction volume (thousands) + Avg PPSF · 2020–2026 · DLD Official Annual Reports" />
      <div style={{ background: "rgba(255,255,255,0.02)", border: \`1px solid \${T.border}\`, borderRadius: 12, padding: "20px 16px", marginBottom: 24 }}>
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 12, height: 12, borderRadius: 2, background: T.gold }} />
            <span style={{ fontSize: 11, color: T.textMuted }}>Transactions (thousands)</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 20, height: 2, background: T.green }} />
            <span style={{ fontSize: 11, color: T.textMuted }}>Avg PPSF (AED)</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 12, height: 12, borderRadius: 2, background: "rgba(212,168,67,0.3)", border: "1px dashed " + T.gold }} />
            <span style={{ fontSize: 11, color: T.textMuted }}>2026 YTD (Jan only)</span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <ComposedChart data={mainChart} margin={{ top: 10, right: 60, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="year" tick={{ fill: T.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis yAxisId="left" tick={{ fill: T.textMuted, fontSize: 11 }} axisLine={false} tickLine={false}
              tickFormatter={v => v + "K"} label={{ value: "Deals (K)", angle: -90, position: "insideLeft", fill: T.textMuted, fontSize: 10 }} />
            <YAxis yAxisId="right" orientation="right" tick={{ fill: T.textMuted, fontSize: 11 }} axisLine={false} tickLine={false}
              tickFormatter={v => "AED " + v} label={{ value: "PPSF", angle: 90, position: "insideRight", fill: T.textMuted, fontSize: 10 }} />
            <Tooltip content={<ChartTooltip />} />
            <Bar yAxisId="left" dataKey="Transactions (K)" radius={[4, 4, 0, 0]} maxBarSize={52}>
              {mainChart.map((entry, index) => (
                <Cell key={index} fill={entry.isYTD ? "rgba(212,168,67,0.3)" : T.gold}
                  stroke={entry.isYTD ? T.gold : "none"} strokeWidth={entry.isYTD ? 1 : 0}
                  strokeDasharray={entry.isYTD ? "4 2" : "none"} />
              ))}
            </Bar>
            <Line yAxisId="right" type="monotone" dataKey="Avg PPSF" stroke={T.green} strokeWidth={2}
              dot={{ fill: T.green, r: 4 }} activeDot={{ r: 6 }} connectNulls={false} />
          </ComposedChart>
        </ResponsiveContainer>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 8, marginTop: 16 }}>
          {Object.entries(YEAR_EVENTS).filter(([y]) => y !== "2026 YTD").map(([year, event]) => (
            <div key={year} style={{ fontSize: 10, color: T.textMuted, display: "flex", gap: 6 }}>
              <span style={{ color: T.gold, fontWeight: 700, flexShrink: 0 }}>{year}</span>
              <span>{event}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Market Composition & Buyer Segments ───────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 8 }}>

        {/* Market composition */}
        <div style={{ background: "rgba(255,255,255,0.02)", border: \`1px solid \${T.border}\`, borderRadius: 12, padding: "20px" }}>
          <SectionHead title="Market Composition" sub="Off-plan vs secondary · financing mix · DLD 2025" />
          <StatBar label="Off-Plan Sales" value="65%" pct={65} color={T.gold} />
          <StatBar label="Secondary / Ready" value="35%" pct={35} color="rgba(99,179,237,0.8)" />
          <StatBar label="Cash Transactions" value="87%" pct={87} color={T.green} />
          <StatBar label="Mortgage-Backed" value="13%" pct={13} color="rgba(159,122,234,0.8)" />
          <div style={{ marginTop: 14, paddingTop: 12, borderTop: \`1px solid \${T.border}\` }}>
            <div style={{ fontSize: 10, color: T.textMuted }}>Off-plan share grew steadily: 40% (2020) → 50% (2022) → 65% (2025). Reflects flexible payment plans and strong developer pipeline confidence.</div>
          </div>
        </div>

        {/* Buyer segments */}
        <div style={{ background: "rgba(255,255,255,0.02)", border: \`1px solid \${T.border}\`, borderRadius: 12, padding: "20px" }}>
          <SectionHead title="Who's Buying" sub="Buyer profile breakdown · BetterHomes FY2025 · DLD 2025" />
          <StatBar label="Apartments (83% of all deals)" value="83%" pct={83} color={T.gold} />
          <StatBar label="Villas & Townhouses" value="8%" pct={8} color="rgba(99,179,237,0.8)" />
          <StatBar label="Land & Commercial" value="9%" pct={9} color={T.textMuted} />
          <div style={{ marginTop: 4, marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: T.textSecondary, marginBottom: 8 }}>Budget Sweet Spot</div>
            <StatBar label="AED 500K – 3M (72% of deals)" value="72%" pct={72} color={T.green} />
            <StatBar label="AED 3M – 10M" value="20%" pct={20} color="rgba(212,168,67,0.5)" />
            <StatBar label="AED 10M+ (ultra-luxury)" value="8%" pct={8} color="rgba(159,122,234,0.8)" />
          </div>
          <div style={{ fontSize: 10, color: T.textMuted }}>Top nationalities: Indians, UK, Russians, Europeans, GCC. Resident investors: 56.6% of total (DLD 2025).</div>
        </div>
      </div>

      {/* ── Supply pipeline risk ───────────────────────────────── */}
      <SectionHead title="Supply Pipeline — Know the Risk" sub="2026 delivery forecast · investor awareness · Knight Frank / BetterHomes / Cavendish Maxwell" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 12, marginBottom: 24 }}>
        {[
          { label: "Units Forecast 2026", value: "~98K", note: "BetterHomes FY2025 report", risk: "medium" },
          { label: "Total Pipeline to 2028", value: "~366K", note: "Cavendish Maxwell Q3 2025", risk: "high" },
          { label: "Delivery Rate 2025", value: "46%", note: "Only 46% of promised units completed on time — Knight Frank Q3 2025", risk: "low" },
          { label: "Highest Supply Risk", value: "JVC · Bus. Bay · Dubai South", note: "Price pressure expected in these communities 2026", risk: "high" },
          { label: "Supply-Constrained", value: "Palm · DIFC · Creek Harbour", note: "Limited new inventory — price support expected", risk: "low" },
          { label: "Price Cycle", value: getStat("Price Cycle")?.value || "56+ months", note: "Longest unbroken growth cycle in Dubai history · Property Monitor DPI", risk: "medium" },
        ].map((item, i) => (
          <div key={i} style={{
            background: "rgba(255,255,255,0.02)", border: \`1px solid \${item.risk === "high" ? "rgba(245,101,101,0.3)" : item.risk === "low" ? "rgba(72,187,120,0.3)" : T.border}\`,
            borderRadius: 12, padding: "14px 16px",
          }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>{item.label}</div>
            <div style={{ fontFamily: "'Fraunces',serif", fontSize: 18, fontWeight: 800, color: item.risk === "high" ? "#FC8181" : item.risk === "low" ? T.green : T.white, marginBottom: 6 }}>{item.value}</div>
            <div style={{ fontSize: 10, color: T.textMuted, lineHeight: 1.5 }}>{item.note}</div>
          </div>
        ))}
      </div>

      {/* ── 2026 Analyst Forecasts ─────────────────────────────── */}
      <SectionHead title="2026 Analyst Forecasts" sub="Knight Frank · Cushman & Wakefield Core · Fitch Ratings — click to expand" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 12, marginBottom: 24 }}>
        {[
          {
            firm: "Knight Frank", color: "#D4A843",
            forecast: "+3% prime / +1% mainstream",
            detail: "Faisal Durrani (Head of Research, MENA): 'Following a multi-year upswing, a gradual easing in price growth is a natural characteristic of a maturing cycle.' Continued HNWI demand for premium homes. Supply risk being monitored — only 46% delivery rate in 2025. Source: Knight Frank Dubai Residential Market Review Q3 2025.",
          },
          {
            firm: "Cushman & Wakefield Core", color: "#48BB78",
            forecast: "5–8% appreciation",
            detail: "Prathyusha Gurrapu (Head of Research): 'Price appreciation is forecast to moderate to mid-single-digit levels in 2026, a deceleration from 2024-25 gains.' Market transitioning to sustainable phase. Strong underlying demand from population growth continues. Source: C&W Core Year-End 2025 Outlook.",
          },
          {
            firm: "Fitch Ratings", color: "#9F7AEA",
            forecast: "Stable / Watch",
            detail: "Fitch maintains stable outlook on Dubai real estate fundamentals. Notes supply pipeline risk in 2026-2027 as ~120K units are expected for delivery. Key risk: if absorption doesn't keep pace, price correction possible in mid-tier communities. Structural demand drivers (Golden Visa, population growth) provide downside protection. Source: Fitch UAE Real Estate Watch 2025.",
          },
        ].map(f => {
          const isExp = expandedForecast === f.firm;
          return (
            <div key={f.firm} onClick={() => setExpandedForecast(isExp ? null : f.firm)} style={{
              background: "rgba(255,255,255,0.02)", borderTop: \`3px solid \${f.color}\`,
              border: \`1px solid \${T.border}\`, borderRadius: 12, padding: "16px", cursor: "pointer",
              transition: "border-color 0.2s",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: f.color, fontFamily: "'Fraunces',serif" }}>{f.firm}</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={T.textMuted} strokeWidth="2"><polyline points={isExp ? "18 15 12 9 6 15" : "6 9 12 15 18 15"} /></svg>
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: T.white, marginBottom: isExp ? 12 : 0 }}>{f.forecast}</div>
              {isExp && <div style={{ fontSize: 11, color: T.textSecondary, lineHeight: 1.8, paddingTop: 12, borderTop: \`1px solid \${T.border}\` }}>{f.detail}</div>}
            </div>
          );
        })}
      </div>

      {/* ── Sources footer ─────────────────────────────────────── */}
      <div style={{ paddingTop: 16, borderTop: \`1px solid \${T.border}\`, display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
        <span style={{ fontSize: 10, color: T.textMuted }}>Sources:</span>
        {["Dubai Land Department", "REIDIN Dec 2025", "ValuStrat Q4 2025", "Knight Frank", "CW Core", "BetterHomes FY2025", "Cavendish Maxwell Q3 2025", "Fitch Ratings", "DXB Analytics"].map(s => (
          <span key={s} style={{ fontSize: 10, padding: "2px 8px", borderRadius: 10, border: \`1px solid \${T.border}\`, color: T.textMuted }}>{s}</span>
        ))}
      </div>
    </div>
  );
}

export default MarketTab;
`;

fs.writeFileSync("C:/Users/TAD/emaar-dashboard/src/tabs/MarketTab.jsx", newTab, "utf8");
console.log("Done. Lines: " + newTab.split("\n").length);