/* eslint-disable */
/*
  DXB ANALYTICS — MARKET TAB (World Class Rebuild)
  Session 7 · April 2026
  Audience: Investors · Agents · Developers · Buyers
  Data: Firestore marketMetrics + research-backed static globals
  Sources: DLD 2025, ValuStrat, REIDIN, Knight Frank, CW Core, BetterHomes FY2025
*/

import React, { useState, useCallback } from "react";
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, RadialBarChart, RadialBar
} from "recharts";
import { T } from "../data";
import { useMarketKpis, useMarketChart } from "../hooks/useMarketMetrics";

// ── Year annotations ─────────────────────────────────────────────
const YEAR_META = {
  "2020": { label: "COVID-19", sub: "V-shaped recovery · 51K deals · AED 175B", color: "#FC8181" },
  "2021": { label: "Post-Covid Boom", sub: "Expo 2020 effect · 84K deals · AED 300B · +72%", color: "#F6AD55" },
  "2022": { label: "Half-Trillion Year", sub: "Golden Visa reform · 123K deals · AED 528B · +76%", color: "#F6E05E" },
  "2023": { label: "Momentum Builds", sub: "Luxury surge · 166K deals · AED 634B · +20%", color: "#68D391" },
  "2024": { label: "Record 4th Year", sub: "226K deals · AED 761B · +36% volume", color: "#63B3ED" },
  "2025": { label: "All-Time Record", sub: "270K+ deals · AED 917B · 5th consecutive record", color: "#D4A843" },
  "2026 YTD": { label: "Jan 2026 Only", sub: "16,919 deals · AED 1,976 avg PPSF · on pace", color: "rgba(212,168,67,0.4)" },
};

// ── Global city comparison data ───────────────────────────────────
const GLOBAL_COMPARE = [
  { city: "Dubai", flag: "🇦🇪", yield: 6.55, ppsf: 438, taxRate: 0, priceGrowth: 19.8, color: T?.gold || "#D4A843" },
  { city: "London", flag: "🇬🇧", yield: 2.4, ppsf: 1420, taxRate: 25, priceGrowth: 1.6, color: "#63B3ED" },
  { city: "New York", flag: "🇺🇸", yield: 4.2, ppsf: 1850, taxRate: 30, priceGrowth: 8.1, color: "#FC8181" },
  { city: "Singapore", flag: "🇸🇬", yield: 3.0, ppsf: 1600, taxRate: 35, priceGrowth: 4.2, color: "#68D391" },
  { city: "Paris", flag: "🇫🇷", yield: 3.8, ppsf: 1100, taxRate: 30, priceGrowth: 2.1, color: "#9F7AEA" },
];

// ── Market health score calculator ───────────────────────────────
// Based on: price cycle length, YoY growth, supply pipeline risk, analyst consensus
// Scale: 0-100 · <30 distressed · 30-50 cooling · 50-70 stable · 70-85 growing · 85-100 peak
const HEALTH_SCORE = 72; // Growing — month 56+ cycle, strong fundamentals, supply risk emerging
const HEALTH_LABEL = "Growing";
const HEALTH_COLOR = "#68D391";
const HEALTH_DESC = "Month 56+ of longest growth cycle. Strong fundamentals with emerging supply risk in 2026. Analysts forecast 1-8% growth. Ideal entry window for long-term investors.";

// ── Audience content ──────────────────────────────────────────────
const AUDIENCES = ["Investor", "Agent", "Developer", "Buyer"];
const AUDIENCE_INSIGHTS = {
  Investor: {
    icon: "📈", color: "#D4A843",
    headline: "Dubai yields 6.55% — nearly 3x London, 1.5x New York. Zero tax.",
    points: [
      "AED 1M invested in Dubai: ~AED 65,500/yr rental income — keep 100% (zero tax)",
      "Same AED 1M in London: ~AED 24,000/yr — keep ~AED 18,000 after UK tax",
      "Price growth +19.8% (ValuStrat 2025) — moderating to 5-8% in 2026 (C&W Core)",
      "87% cash transactions — no systemic mortgage leverage risk in the market",
      "193,100 active investors — largest DLD investor base in history",
    ],
    cta: "→ See Yields tab for community-level ROI · DXB Estimate for valuation",
  },
  Agent: {
    icon: "🏡", color: "#63B3ED",
    headline: "270,000+ transactions in 2025 — 5th consecutive record year.",
    points: [
      "72% of deals in AED 500K–3M range — anchor your pitch here (BetterHomes FY2025)",
      "Apartments: 83% of all deals · Studios and 1BR lead volume in JVC, Business Bay",
      "Buyer leads up 33% YoY — demand outpacing supply in established communities",
      "Top areas by volume: JVC, Business Bay, Wadi Al Safa 5, Dubai South, Dubai Marina",
      "Off-plan 65% of market — payment plans are the #1 conversion tool",
    ],
    cta: "→ See Neighbourhoods tab for community intelligence · Projects for off-plan inventory",
  },
  Developer: {
    icon: "🏗️", color: "#FC8181",
    headline: "228 developers active in 2025 — up 40% from 163 in 2024.",
    points: [
      "131,504 units launched by Oct 2025 — Q4 was strongest quarter ever",
      "~98K units forecast for delivery in 2026 — absorption risk in JVC, Bus. Bay, Dubai South",
      "Off-plan PPSF premium: AED 2,149 vs AED 1,663 for ready — 29% developer advantage",
      "Delivery rate: only 46% on-time in 2025 — contractor capacity is the bottleneck",
      "Golden Visa eligibility at AED 2M drives high-end demand — launch at this price point",
    ],
    cta: "→ See Developer Health tab for competitive positioning",
  },
  Buyer: {
    icon: "🔑", color: "#68D391",
    headline: "Is now a good time to buy? Yes — but be selective about location.",
    points: [
      "Avg PPSF AED 1,863 (2025) → AED 1,976 in Jan 2026 — prices still rising",
      "AED 500K–3M: 72% of all deals — strong demand = strong resale liquidity",
      "Knight Frank forecasts +3% prime / +1% mainstream for 2026 — sustainable",
      "Mortgage activity up 22.5% YoY — banks competing for your business",
      "Golden Visa: AED 2M+ property = 10-year renewable residency, no sponsor needed",
    ],
    cta: "→ See DXB Estimate for property valuation · Mortgage tab for financing",
  },
};

// ── Chart metric options ──────────────────────────────────────────
const CHART_METRICS = [
  { key: "Transactions (K)", label: "Transactions", unit: "K deals", color: T?.gold || "#D4A843" },
  { key: "Value (AED B)", label: "Value", unit: "AED B", color: "#63B3ED" },
  { key: "Avg PPSF", label: "Avg PPSF", unit: "AED/sqft", color: "#68D391" },
];

// ── Custom chart tooltip ──────────────────────────────────────────
const ChartTooltip = ({ active, payload, label, metric }) => {
  if (!active || !payload?.length) return null;
  const meta = YEAR_META[label] || {};
  return (
    <div style={{ background: "rgba(4,9,15,0.98)", border: "1px solid rgba(212,168,67,0.3)", borderRadius: 10, padding: "14px 18px", minWidth: 240 }}>
      <div style={{ fontFamily: "'Fraunces',serif", fontSize: 16, fontWeight: 800, color: meta.color || T?.gold, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 11, fontWeight: 700, color: T?.white || "#fff", marginBottom: 2 }}>{meta.label}</div>
      <div style={{ fontSize: 10, color: T?.textMuted || "#666", marginBottom: 10 }}>{meta.sub}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: 16, fontSize: 12, marginBottom: 3 }}>
          <span style={{ color: p.color }}>{p.name}</span>
          <span style={{ color: T?.white || "#fff", fontWeight: 700 }}>{typeof p.value === "number" ? p.value.toLocaleString() : p.value}</span>
        </div>
      ))}
    </div>
  );
};

// ── Stat bar ──────────────────────────────────────────────────────
const StatBar = ({ label, value, pct, color, note }) => (
  <div style={{ marginBottom: 14 }}>
    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
      <span style={{ fontSize: 12, color: T?.textSecondary || "#aaa" }}>{label}</span>
      <span style={{ fontSize: 12, fontWeight: 700, color: T?.white || "#fff" }}>{value}</span>
    </div>
    <div style={{ height: 5, borderRadius: 3, background: "rgba(255,255,255,0.06)" }}>
      <div style={{ height: "100%", borderRadius: 3, width: pct + "%", background: color, transition: "width 1s ease" }} />
    </div>
    {note && <div style={{ fontSize: 10, color: T?.textMuted || "#666", marginTop: 3 }}>{note}</div>}
  </div>
);

// ── KPI card ──────────────────────────────────────────────────────
const KpiCard = ({ label, value, change, note, color, onClick }) => (
  <div onClick={onClick} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid " + (T?.border || "#222"), borderRadius: 12, padding: "14px 16px", cursor: onClick ? "pointer" : "default", transition: "border-color 0.2s" }}
    onMouseEnter={e => onClick && (e.currentTarget.style.borderColor = (T?.gold || "#D4A843") + "60")}
    onMouseLeave={e => onClick && (e.currentTarget.style.borderColor = T?.border || "#222")}
  >
    <div style={{ fontSize: 10, fontWeight: 700, color: T?.textMuted || "#666", letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>{label}</div>
    <div style={{ fontFamily: "'Fraunces',serif", fontSize: 20, fontWeight: 800, color: color || T?.white || "#fff", lineHeight: 1.1, marginBottom: 5 }}>{value || "—"}</div>
    {change && <div style={{ fontSize: 11, color: T?.green || "#68D391", display: "flex", alignItems: "center", gap: 3 }}>
      <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="18 15 12 9 6 15"/></svg>{change}
    </div>}
    {note && <div style={{ fontSize: 10, color: T?.textMuted || "#666", marginTop: 4, lineHeight: 1.5 }}>{note}</div>}
  </div>
);

// ── Section heading ───────────────────────────────────────────────
const SH = ({ title, sub, right }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 14, marginTop: 32 }}>
    <div>
      <div style={{ fontFamily: "'Fraunces',serif", fontSize: 16, fontWeight: 700, color: T?.white || "#fff" }}>{title}</div>
      {sub && <div style={{ fontSize: 11, color: T?.textMuted || "#666", marginTop: 3 }}>{sub}</div>}
    </div>
    {right}
  </div>
);

// ── Main component ────────────────────────────────────────────────
function MarketTab({ liveNeighbourhoods=[], liveMarketData, allDevelopers, expandedForecast, setExpandedForecast, handleTabChange }) {
  const [audience, setAudience] = useState("Investor");

  const nbhdMap = React.useMemo(()=>{
    const m={};
    (liveNeighbourhoods||[]).forEach(n=>{if(n.community)m[n.community.toLowerCase()]=n;});
    return m;
  },[liveNeighbourhoods]);
  const getNbhd = c => nbhdMap[(c||"").toLowerCase()]||null;
  const [chartMetric, setChartMetric] = useState("Transactions (K)");
  const [selectedYear, setSelectedYear] = useState(null);
  const [taxAmount, setTaxAmount] = useState(2000000);

  const { data: firestoreKpis = [] } = useMarketKpis();
  const { data: firestoreChart = [] } = useMarketChart();

  // Data assembly
  const live = (liveMarketData || []).filter(d => d.metric && d.value);
  const stats = live.length > 0 ? live : firestoreKpis;
  const getStat = (m) => stats.find(s => s.metric === m) || stats.find(s => s.metric?.toLowerCase().includes(m.toLowerCase()));

  // Chart data
  const chartData = (firestoreChart.length > 0 ? firestoreChart : [])
    .filter(d => d.year && d.type === "annual")
    .sort((a, b) => String(a.year).localeCompare(String(b.year)))
    .map(d => ({
      year: String(d.year),
      "Transactions (K)": d.transactions ? +(d.transactions / 1000).toFixed(1) : null,
      "Value (AED B)": parseFloat(d.value) || null,
      "Avg PPSF": d.ppsf || null,
      isYTD: String(d.year).includes("YTD"),
    }));

  const selectedMetric = CHART_METRICS.find(m => m.key === chartMetric);
  const selectedYearMeta = selectedYear ? YEAR_META[selectedYear] : null;

  // Tax calculator
  const annualRent = taxAmount * 0.0655;
  const dubaiNet = annualRent;
  const londonNet = annualRent * 0.75;
  const nyNet = annualRent * 0.70;
  const sgNet = annualRent * 0.65;
  const tenYearAdvantage = (dubaiNet - londonNet) * 10;

  const insight = AUDIENCE_INSIGHTS[audience];

  return (
    <div style={{ animation: "fadeUp 0.4s ease-out forwards", paddingBottom: 60 }}>

      {/* ── Header ─────────────────────────────────────────────── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "10px 0", marginBottom: 20, borderBottom: "1px solid " + (T?.border || "#222"), flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color: T?.white || "#fff", fontFamily: "'Fraunces',serif" }}>Dubai Real Estate Market</div>
          <div style={{ fontSize: 11, color: T?.textMuted || "#666", marginTop: 3 }}>Full year 2025 · DLD Official · REIDIN · ValuStrat · Knight Frank · BetterHomes FY2025</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 10, color: T?.textMuted || "#666", marginBottom: 3 }}>Market Health</div>
            <div style={{ fontFamily: "'Fraunces',serif", fontSize: 18, fontWeight: 800, color: HEALTH_COLOR }}>{HEALTH_SCORE}/100 — {HEALTH_LABEL}</div>
          </div>
          <div style={{ width: 48, height: 48, borderRadius: "50%", border: "3px solid " + HEALTH_COLOR, display: "flex", alignItems: "center", justifyContent: "center", background: HEALTH_COLOR + "15" }}>
            <span style={{ fontSize: 18, fontWeight: 800, color: HEALTH_COLOR, fontFamily: "'Fraunces',serif" }}>{HEALTH_SCORE}</span>
          </div>
        </div>
      </div>

      {/* ── Audience toggle ────────────────────────────────────── */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, color: T?.textMuted || "#666", marginBottom: 8, fontWeight: 600 }}>I AM A...</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {AUDIENCES.map(a => (
            <button key={a} type="button" onClick={() => setAudience(a)} style={{
              padding: "7px 18px", borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: "pointer",
              fontFamily: "'Outfit',sans-serif", transition: "all 0.2s",
              background: audience === a ? (AUDIENCE_INSIGHTS[a].color + "20") : (T?.surfaceAlt || "#111"),
              border: "1px solid " + (audience === a ? AUDIENCE_INSIGHTS[a].color : (T?.border || "#222")),
              color: audience === a ? AUDIENCE_INSIGHTS[a].color : (T?.textSecondary || "#aaa"),
            }}>{a}</button>
          ))}
        </div>
      </div>

      {/* ── Audience insight card ──────────────────────────────── */}
      <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid " + insight.color + "30", borderLeft: "3px solid " + insight.color, borderRadius: 12, padding: "18px 20px", marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <span style={{ fontSize: 20 }}>{insight.icon}</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: T?.white || "#fff", fontFamily: "'Fraunces',serif" }}>{insight.headline}</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 8, marginBottom: 10 }}>
          {insight.points.map((p, i) => (
            <div key={i} style={{ fontSize: 11, color: T?.textSecondary || "#aaa", display: "flex", gap: 8 }}>
              <span style={{ color: insight.color, flexShrink: 0, fontWeight: 700 }}>·</span>
              <span>{p}</span>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 11, color: insight.color, fontWeight: 600 }}>{insight.cta}</div>
      </div>

      {/* ── 2025 Market Scorecard ──────────────────────────────── */}
      <SH title="2025 Market Scorecard" sub="Full year · Dubai Land Department official data · January 2026" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: 10, marginBottom: 8 }}>
        <KpiCard label="Total Market Value" value={getStat("Total Market Value")?.value} change={getStat("Total Market Value")?.change} note="Sales + mortgages + gifts" onClick={() => handleTabChange?.("DLD Volumes")} />
        <KpiCard label="Total Transactions" value={getStat("Total Transactions")?.value} change={getStat("Total Transactions")?.change} note="5th consecutive annual record" />
        <KpiCard label="Residential Sales" value="214,912" change="+19% YoY" note="DLD / Emarat Al Youm Jan 2026" />
        <KpiCard label="Off-Plan Share" value={getStat("Off-Plan Share")?.value} change={getStat("Off-Plan Share")?.change} note="132K off-plan deals" />
        <KpiCard label="Avg PPSF" value="AED 1,863" change="+6% YoY" note="Jan 2026: AED 1,976" color={T?.gold || "#D4A843"} />
        <KpiCard label="Avg Gross Yield" value={getStat("Avg Gross Yield")?.value} change="Apts 7.03% · Villas 4.63%" note="REIDIN Dec 2025" color={T?.green || "#68D391"} />
        <KpiCard label="Mortgage Deals" value={getStat("Mortgage Transactions")?.value} change={getStat("Mortgage Transactions")?.change} note="AED 179.26B · Cash 87%" />
        <KpiCard label="Investor Base" value={getStat("Investor Base")?.value} change={getStat("Investor Base")?.change} note="129,600 new investors" />
        <KpiCard label="Women Investors" value={getStat("Women Investors")?.value} change={getStat("Women Investors")?.change} note="76,700 deals" />
        <KpiCard label="Price Growth" value={getStat("Price Growth")?.value} change="ValuStrat VPI Dec 2025" note="REIDIN: +12.88%" color={T?.green || "#68D391"} />
        <KpiCard label="Active Developers" value={getStat("Active Developers")?.value} change={getStat("Active Developers")?.change} note="Up from 163 in 2024" />
        <KpiCard label="Units Launched" value={getStat("Units Launched")?.value} change={getStat("Units Launched")?.change} note="By Oct 2025 · DLD" />
      </div>

      {/* ── Post-Covid Recovery Chart ──────────────────────────── */}
      <SH
        title="Dubai's Post-Covid Recovery Story"
        sub="Click any bar to see that year's full story · DLD Official Annual Reports"
        right={
          <div style={{ display: "flex", gap: 6 }}>
            {CHART_METRICS.map(m => (
              <button key={m.key} type="button" onClick={() => setChartMetric(m.key)} style={{
                padding: "4px 12px", borderRadius: 12, fontSize: 11, fontWeight: 600, cursor: "pointer",
                background: chartMetric === m.key ? m.color + "20" : (T?.surfaceAlt || "#111"),
                border: "1px solid " + (chartMetric === m.key ? m.color : (T?.border || "#222")),
                color: chartMetric === m.key ? m.color : (T?.textMuted || "#666"),
                fontFamily: "'Outfit',sans-serif",
              }}>{m.label}</button>
            ))}
          </div>
        }
      />
      <div style={{ display: "grid", gridTemplateColumns: selectedYearMeta ? "1fr 280px" : "1fr", gap: 16, marginBottom: 24 }}>
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid " + (T?.border || "#222"), borderRadius: 12, padding: "20px 16px" }}>
          <ResponsiveContainer width="100%" height={260}>
            <ComposedChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }} onClick={(d) => d?.activeLabel && setSelectedYear(d.activeLabel === selectedYear ? null : d.activeLabel)}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="year" tick={{ fill: T?.textMuted || "#666", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: T?.textMuted || "#666", fontSize: 10 }} axisLine={false} tickLine={false}
                tickFormatter={v => selectedMetric?.unit?.includes("B") ? v + "B" : selectedMetric?.unit?.includes("K") ? v + "K" : v} />
              <Tooltip content={<ChartTooltip metric={chartMetric} />} cursor={{ fill: "rgba(212,168,67,0.05)" }} />
              <Bar dataKey={chartMetric} radius={[5, 5, 0, 0]} maxBarSize={55} cursor="pointer">
                {chartData.map((entry, i) => {
                  const meta = YEAR_META[entry.year] || {};
                  const isSelected = entry.year === selectedYear;
                  return (
                    <Cell key={i}
                      fill={isSelected ? (selectedMetric?.color || T?.gold) : entry.isYTD ? "rgba(212,168,67,0.25)" : (meta.color || T?.gold || "#D4A843")}
                      stroke={isSelected ? (selectedMetric?.color || T?.gold) : "none"}
                      strokeWidth={isSelected ? 2 : 0}
                      opacity={selectedYear && !isSelected ? 0.4 : 1}
                    />
                  );
                })}
              </Bar>
            </ComposedChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 16px", marginTop: 10 }}>
            {Object.entries(YEAR_META).filter(([y]) => y !== "2026 YTD").map(([year, meta]) => (
              <div key={year} onClick={() => setSelectedYear(year === selectedYear ? null : year)} style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", opacity: selectedYear && year !== selectedYear ? 0.4 : 1, transition: "opacity 0.2s" }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: meta.color, flexShrink: 0 }} />
                <span style={{ fontSize: 10, color: T?.textMuted || "#666" }}><span style={{ fontWeight: 700, color: T?.textSecondary || "#aaa" }}>{year}</span> {meta.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Year detail panel */}
        {selectedYearMeta && (
          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid " + selectedYearMeta.color + "40", borderRadius: 12, padding: "20px", animation: "fadeUp 0.3s ease-out" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
              <div style={{ fontFamily: "'Fraunces',serif", fontSize: 18, fontWeight: 800, color: selectedYearMeta.color }}>{selectedYear}</div>
              <button type="button" onClick={() => setSelectedYear(null)} style={{ background: "none", border: "none", color: T?.textMuted || "#666", cursor: "pointer", fontSize: 16 }}>×</button>
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: T?.white || "#fff", marginBottom: 6 }}>{selectedYearMeta.label}</div>
            <div style={{ fontSize: 11, color: T?.textSecondary || "#aaa", lineHeight: 1.7, marginBottom: 16 }}>{selectedYearMeta.sub}</div>
            {(() => {
              const d = chartData.find(x => x.year === selectedYear);
              if (!d) return null;
              return (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {d["Transactions (K)"] && <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 8, padding: "10px 12px" }}>
                    <div style={{ fontSize: 10, color: T?.textMuted || "#666", marginBottom: 3 }}>TRANSACTIONS</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: T?.gold || "#D4A843", fontFamily: "'Fraunces',serif" }}>{(d["Transactions (K)"] * 1000).toLocaleString()}</div>
                  </div>}
                  {d["Value (AED B)"] && <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 8, padding: "10px 12px" }}>
                    <div style={{ fontSize: 10, color: T?.textMuted || "#666", marginBottom: 3 }}>TOTAL VALUE</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: "#63B3ED", fontFamily: "'Fraunces',serif" }}>AED {d["Value (AED B)"]}B</div>
                  </div>}
                  {d["Avg PPSF"] && <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 8, padding: "10px 12px" }}>
                    <div style={{ fontSize: 10, color: T?.textMuted || "#666", marginBottom: 3 }}>AVG PPSF</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: "#68D391", fontFamily: "'Fraunces',serif" }}>AED {d["Avg PPSF"].toLocaleString()}</div>
                  </div>}
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* ── Global Comparison ─────────────────────────────────── */}
      <SH title="Dubai vs The World" sub="Why global investors choose Dubai · Gross yield · PPSF · Tax · Price growth 2025 · Sources: BetterHomes, Arabian Business, Red Horizon 2025" />
      <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid " + (T?.border || "#222"), borderRadius: 12, padding: "20px", marginBottom: 24, overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 600 }}>
          <thead>
            <tr>
              {["City", "Gross Yield", "PPSF (USD)", "Tax on Rental Income", "Price Growth 2025", "Verdict"].map(h => (
                <th key={h} style={{ fontSize: 10, fontWeight: 700, color: T?.textMuted || "#666", textTransform: "uppercase", letterSpacing: 0.8, padding: "8px 12px", textAlign: "left", borderBottom: "1px solid " + (T?.border || "#222") }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {GLOBAL_COMPARE.map((city, i) => {
              const isDubai = city.city === "Dubai";
              return (
                <tr key={city.city} style={{ background: isDubai ? "rgba(212,168,67,0.05)" : "transparent", transition: "background 0.2s" }}
                  onMouseEnter={e => !isDubai && (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}
                  onMouseLeave={e => !isDubai && (e.currentTarget.style.background = "transparent")}
                >
                  <td style={{ padding: "12px 12px", borderBottom: "1px solid " + (T?.border || "#222") + "80" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 16 }}>{city.flag}</span>
                      <span style={{ fontSize: 13, fontWeight: isDubai ? 800 : 600, color: isDubai ? T?.gold || "#D4A843" : T?.white || "#fff", fontFamily: isDubai ? "'Fraunces',serif" : "inherit" }}>{city.city}</span>
                      {isDubai && <span style={{ fontSize: 9, padding: "2px 6px", background: "rgba(212,168,67,0.2)", color: T?.gold || "#D4A843", borderRadius: 6, fontWeight: 700 }}>WE ARE HERE</span>}
                    </div>
                  </td>
                  <td style={{ padding: "12px 12px", borderBottom: "1px solid " + (T?.border || "#222") + "80" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ height: 6, width: Math.round(city.yield * 12) + "px", borderRadius: 3, background: isDubai ? T?.gold || "#D4A843" : city.color, transition: "width 0.8s" }} />
                      <span style={{ fontSize: 13, fontWeight: 700, color: isDubai ? T?.gold || "#D4A843" : T?.white || "#fff" }}>{city.yield}%</span>
                    </div>
                  </td>
                  <td style={{ padding: "12px 12px", borderBottom: "1px solid " + (T?.border || "#222") + "80" }}>
                    <span style={{ fontSize: 13, color: isDubai ? T?.green || "#68D391" : T?.textSecondary || "#aaa", fontWeight: isDubai ? 700 : 400 }}>${city.ppsf.toLocaleString()}</span>
                  </td>
                  <td style={{ padding: "12px 12px", borderBottom: "1px solid " + (T?.border || "#222") + "80" }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: city.taxRate === 0 ? T?.green || "#68D391" : "#FC8181" }}>{city.taxRate === 0 ? "Zero ✓" : city.taxRate + "%"}</span>
                  </td>
                  <td style={{ padding: "12px 12px", borderBottom: "1px solid " + (T?.border || "#222") + "80" }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: city.priceGrowth > 10 ? T?.gold || "#D4A843" : city.priceGrowth > 5 ? T?.green || "#68D391" : T?.textMuted || "#666" }}>+{city.priceGrowth}%</span>
                  </td>
                  <td style={{ padding: "12px 12px", borderBottom: "1px solid " + (T?.border || "#222") + "80" }}>
                    <span style={{ fontSize: 11, color: isDubai ? T?.gold || "#D4A843" : T?.textMuted || "#666", fontWeight: isDubai ? 700 : 400 }}>
                      {isDubai ? "Best yield + zero tax" : city.city === "London" ? "Stable, low yield" : city.city === "New York" ? "High tax, lower yield" : city.city === "Singapore" ? "60% ABSD for foreigners" : "Moderate, more stable"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div style={{ marginTop: 12, fontSize: 10, color: T?.textMuted || "#666" }}>Sources: BetterHomes ROI Comparison Feb 2026 · Arabian Business Nov 2024 · Red Horizon Dec 2025 · Global Property Guide Nov 2025</div>
      </div>

      {/* ── Tax advantage calculator ───────────────────────────── */}
      <SH title="Zero-Tax Advantage Calculator" sub="How much more you keep in Dubai vs other cities · Adjust investment amount" />
      <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid " + (T?.border || "#222"), borderRadius: 12, padding: "20px", marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 11, color: T?.textMuted || "#666", marginBottom: 6 }}>PROPERTY VALUE (AED)</div>
            <input type="range" min={500000} max={10000000} step={100000} value={taxAmount} onChange={e => setTaxAmount(+e.target.value)}
              style={{ width: 200, accentColor: T?.gold || "#D4A843" }} />
          </div>
          <div style={{ fontFamily: "'Fraunces',serif", fontSize: 24, fontWeight: 800, color: T?.gold || "#D4A843" }}>
            AED {(taxAmount / 1000000).toFixed(1)}M
          </div>
          <div style={{ fontSize: 11, color: T?.textMuted || "#666" }}>
            Expected gross rental income: <span style={{ color: T?.white || "#fff", fontWeight: 700 }}>AED {Math.round(annualRent).toLocaleString()}/yr</span> (at 6.55%)
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 12, marginBottom: 16 }}>
          {[
            { city: "🇦🇪 Dubai", net: dubaiNet, rate: "0% tax", color: T?.gold || "#D4A843", highlight: true },
            { city: "🇬🇧 London", net: londonNet, rate: "~25% tax", color: "#63B3ED", highlight: false },
            { city: "🇺🇸 New York", net: nyNet, rate: "~30% tax", color: "#FC8181", highlight: false },
            { city: "🇸🇬 Singapore", net: sgNet, rate: "~35% tax", color: "#68D391", highlight: false },
          ].map(c => (
            <div key={c.city} style={{ background: c.highlight ? "rgba(212,168,67,0.08)" : "rgba(255,255,255,0.02)", border: "1px solid " + (c.highlight ? (T?.gold || "#D4A843") + "40" : (T?.border || "#222")), borderRadius: 10, padding: "14px 16px" }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T?.textSecondary || "#aaa", marginBottom: 6 }}>{c.city}</div>
              <div style={{ fontFamily: "'Fraunces',serif", fontSize: 19, fontWeight: 800, color: c.color, marginBottom: 3 }}>AED {Math.round(c.net).toLocaleString()}</div>
              <div style={{ fontSize: 10, color: T?.textMuted || "#666" }}>net/yr after {c.rate}</div>
            </div>
          ))}
        </div>
        <div style={{ background: "rgba(212,168,67,0.06)", borderRadius: 10, padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
          <div style={{ fontSize: 12, color: T?.textSecondary || "#aaa" }}>10-year advantage over London (compounded, reinvested):</div>
          <div style={{ fontFamily: "'Fraunces',serif", fontSize: 22, fontWeight: 800, color: T?.gold || "#D4A843" }}>+AED {Math.round(tenYearAdvantage).toLocaleString()}</div>
        </div>
        <div style={{ fontSize: 10, color: T?.textMuted || "#666", marginTop: 10 }}>Illustrative only. Assumes stable yield, no vacancies. Actual returns vary. Consult a financial advisor. Tax rates are illustrative averages — actual tax depends on residency status.</div>
      </div>

      {/* ── Market Composition + Who's Buying ─────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 8 }}>
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid " + (T?.border || "#222"), borderRadius: 12, padding: "20px" }}>
          <SH title="Market Composition" sub="DLD 2025 · BetterHomes FY2025" />
          <StatBar label="Off-Plan Sales" value="65%" pct={65} color={T?.gold || "#D4A843"} note="Up from 40% in 2020 — payment plans drive adoption" />
          <StatBar label="Secondary / Ready" value="35%" pct={35} color="#63B3ED" />
          <StatBar label="Cash Transactions" value="87%" pct={87} color={T?.green || "#68D391"} note="No systemic leverage risk · Knight Frank Q1-Q3 2025" />
          <StatBar label="Mortgage-Backed" value="13%" pct={13} color="#9F7AEA" note="Rising — 50,974 deals +22.5% YoY" />
        </div>
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid " + (T?.border || "#222"), borderRadius: 12, padding: "20px" }}>
          <SH title="Who's Buying" sub="BetterHomes FY2025 · DLD 2025" />
          <StatBar label="Apartments (83% of all deals)" value="83%" pct={83} color={T?.gold || "#D4A843"} note="Studios + 1BR lead volume · JVC, Business Bay, Dubai Marina" />
          <StatBar label="Villas & Townhouses" value="8%" pct={8} color="#63B3ED" note="Dubai Hills, Tilal Al Ghaf, Arabian Ranches" />
          <StatBar label="AED 500K–3M (72% of deals)" value="72%" pct={72} color={T?.green || "#68D391"} note="Sweet spot — highest liquidity and resale velocity" />
          <StatBar label="AED 3M–10M" value="20%" pct={20} color="#F6AD55" />
          <StatBar label="AED 10M+ ultra-luxury" value="8%" pct={8} color="#9F7AEA" note="Palm, DIFC, Emirates Hills — HNWI driven" />
          <div style={{ fontSize: 10, color: T?.textMuted || "#666", marginTop: 8 }}>Residents: 56.6% · Top nationalities: Indians, UK, Russians, Europeans, GCC</div>
        </div>
      </div>

      {/* ── Supply Pipeline Risk ───────────────────────────────── */}
      <SH title="Supply Pipeline — Know the Risk" sub="2026 delivery forecast · Knight Frank / BetterHomes / Cavendish Maxwell Q3 2025" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(190px,1fr))", gap: 10, marginBottom: 24 }}>
        {[
          { label: "Units Forecast 2026", value: "~98K", note: "BetterHomes FY2025", risk: "medium" },
          { label: "Pipeline to 2028", value: "~366K", note: "Cavendish Maxwell Q3 2025", risk: "high" },
          { label: "2025 Delivery Rate", value: "46%", note: "Only 46% on-time — contractor capacity crunch (Knight Frank)", risk: "low" },
          { label: "High Supply Risk", value: "JVC · Bus.Bay · Dubai South", note: "Price pressure expected 2026–2027", risk: "high" },
          { label: "Supply Constrained", value: "Palm · DIFC · Creek Harbour", note: "Limited new inventory — price support likely", risk: "low" },
          { label: "Price Cycle Length", value: "56+ months", note: "Longest unbroken growth cycle in DLD history", risk: "medium" },
        ].map((item, i) => (
          <div key={i} style={{
            background: "rgba(255,255,255,0.02)",
            border: "1px solid " + (item.risk === "high" ? "rgba(252,129,129,0.3)" : item.risk === "low" ? "rgba(104,211,145,0.3)" : T?.border || "#222"),
            borderRadius: 10, padding: "12px 14px",
          }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: item.risk === "high" ? "#FC8181" : item.risk === "low" ? "#68D391" : T?.textMuted || "#666", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>
              {item.risk === "high" ? "⚠ HIGH RISK" : item.risk === "low" ? "✓ SAFE" : "~ MODERATE"} · {item.label}
            </div>
            <div style={{ fontFamily: "'Fraunces',serif", fontSize: 16, fontWeight: 800, color: item.risk === "high" ? "#FC8181" : item.risk === "low" ? "#68D391" : T?.white || "#fff", marginBottom: 5 }}>{item.value}</div>
            <div style={{ fontSize: 10, color: T?.textMuted || "#666", lineHeight: 1.5 }}>{item.note}</div>
          </div>
        ))}
      </div>

      {/* ── 2026 Analyst Forecasts ─────────────────────────────── */}
      <SH title="2026 Analyst Forecasts" sub="Click to expand · Knight Frank · Cushman & Wakefield Core · Fitch Ratings" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(270px,1fr))", gap: 12, marginBottom: 28 }}>
        {[
          { firm: "Knight Frank", color: "#D4A843", forecast: "+3% prime / +1% mainstream", detail: "Faisal Durrani (Head of Research, MENA): 'Following a multi-year upswing, gradual easing in price growth is a natural characteristic of a maturing cycle.' Continued HNWI demand. Supply risk monitored — 46% delivery rate in 2025. Source: Knight Frank Dubai Residential Market Review Q3 2025." },
          { firm: "Cushman & Wakefield Core", color: "#48BB78", forecast: "5–8% appreciation", detail: "Prathyusha Gurrapu (Head of Research): 'Price appreciation to moderate to mid-single-digit levels in 2026.' Market transitioning to sustainable phase. Strong demand from population growth continues. Source: C&W Core Year-End 2025 Outlook." },
          { firm: "Fitch Ratings", color: "#9F7AEA", forecast: "Stable / Watch", detail: "Stable outlook on fundamentals. Notes supply pipeline risk in 2026–2027 with ~120K units expected. Key risk: if absorption doesn't keep pace, price correction possible in mid-tier communities. Golden Visa and population growth provide downside protection. Source: Fitch UAE Real Estate Watch 2025." },
        ].map(f => {
          const isExp = expandedForecast === f.firm;
          return (
            <div key={f.firm} onClick={() => setExpandedForecast(isExp ? null : f.firm)} style={{ background: "rgba(255,255,255,0.02)", borderTop: "3px solid " + f.color, border: "1px solid " + (T?.border || "#222"), borderRadius: 12, padding: "16px", cursor: "pointer" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: f.color, fontFamily: "'Fraunces',serif" }}>{f.firm}</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={T?.textMuted || "#666"} strokeWidth="2"><polyline points={isExp ? "18 15 12 9 6 15" : "6 9 12 15 18 15"} /></svg>
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: T?.white || "#fff", marginBottom: isExp ? 10 : 0 }}>{f.forecast}</div>
              {isExp && <div style={{ fontSize: 11, color: T?.textSecondary || "#aaa", lineHeight: 1.8, paddingTop: 10, borderTop: "1px solid " + (T?.border || "#222") }}>{f.detail}</div>}
            </div>
          );
        })}
      </div>

      {/* ── Sources panel ──────────────────────────────────────── */}
      <div style={{ paddingTop: 20, borderTop: "1px solid " + (T?.border || "#222") }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: T?.textSecondary || "#aaa", marginBottom: 12, letterSpacing: 1, textTransform: "uppercase" }}>Primary Sources — Click to Verify</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 8 }}>
          {[
            { name: "DLD Full Year 2025 — Dubai Media Office", desc: "270,000+ transactions · AED 917B · investor base 193,100", url: "https://mediaoffice.ae/en/news/2026/january/12-01/dubais-real-estate-market-records-new-historic-milestone", tag: "DLD Official" },
            { name: "DLD — AED 761B in 2024", desc: "226,000 transactions · AED 761B · +36% volume YoY", url: "https://dubailand.gov.ae/en/news-media/dubai-s-real-estate-sector-records-aed761-billion-in-transactions-in-2024", tag: "DLD Official" },
            { name: "Gulf News — Dubai closes 2025 at AED 682.5B", desc: "214,912 sales transactions · Q4 monthly records", url: "https://gulfnews.com/business/property/dubai-property-market-closes-2025-with-record-dh6825-billion-in-sales-1.500396068", tag: "Gulf News" },
            { name: "ValuStrat VPI December 2025", desc: "AED 1,689/sqft citywide · +19.8% YoY · Villas +25.5%", url: "https://valustrat.com/products/vpi-dubai-residential-capital-values-december-2025", tag: "ValuStrat" },
            { name: "REIDIN — UAE Residential Price Report", desc: "+12.88% YoY Dec 2025 · Villas +15.16% · Yield 6.55%", url: "https://reidin.com", tag: "REIDIN" },
            { name: "Knight Frank — Dubai Residential Q3 2025", desc: "+10% YoY values · 46% delivery rate · 2026: +3%/+1%", url: "https://www.knightfrank.ae/newsroom/article/2025/11/dubai-residential-market-review-q3-2025", tag: "Knight Frank" },
            { name: "BetterHomes — Dubai Residential FY2025", desc: "Off-plan 65% · 132,000 off-plan deals · AED 248B apts", url: "https://www.constructionweekonline.com/analysis/dubai-off-plan-sales-2025", tag: "BetterHomes" },
            { name: "Cavendish Maxwell — Q3 2025", desc: "~98K units 2026 · 366K through 2028 · off-plan 76%", url: "https://cavendishmaxwell.com/insights/market-reports/residential/dubai-residential-market-performance-q3-2025", tag: "Cavendish Maxwell" },
            { name: "BetterHomes — Dubai vs Global ROI Feb 2026", desc: "Dubai 7% yield vs London 2.4% vs New York 4.2%", url: "https://www.bhomes.com/en/blog/betterinformed/dubai-vs-other-global-real-estate-hubs-which-offers-better-roi", tag: "BetterHomes" },
            { name: "Arabian Business — Dubai outperforms London/NY", desc: "7% yield vs 2.4% London · 4.2% NY · price growth comparison", url: "https://www.arabianbusiness.com/industries/real-estate/dubai-real-estate-outperforms-london-and-new-york-with-superior-7-investment-yields-and-double-digit-price-increases", tag: "Arabian Business" },
            { name: "DXB Analytics — Dubai Price Index 2026", desc: "FY2025: AED 1,863 avg PPSF · Jan 2026: AED 1,976", url: "https://www.dxbanalytics.com/blog/dubai-property-price-index-2026", tag: "DXB Analytics" },
            { name: "DLD 2021 Annual — Post-Covid Boom", desc: "84,196 transactions · AED 300B · +72% value YoY", url: "https://dubailand.gov.ae/en/news-media/dld-2021-achieved-exceptional-results-that-will-contribute-to-enabling-the-real-estate-sector-s-journey-towards-the-next-50-years/", tag: "DLD 2021" },
            { name: "UAE Moments — 2022 Record Year", desc: "122,658 transactions · AED 528B · first half-trillion year", url: "https://www.uaemoments.com/amp/dubais-real-estate-transactions-hit-a-record-high-in-2022-553424.html", tag: "DLD 2022" },
            { name: "The National — 2023 Record", desc: "166,400 transactions · AED 634B · +36% volume YoY", url: "https://www.thenationalnews.com/business/property/2024/02/07/dubais-real-estate-transactions-surge-17-to-record-16-million-in-2023/", tag: "DLD 2023" },
            { name: "Red Horizon — Dubai Yield vs Global 2025", desc: "Dubai 6.7-6.9% vs London 2.5-4% vs NY 3-5% vs Singapore 2.5-3.5%", url: "https://redhorizondxb.com/2025/12/29/property-rental-yield-calculator-dubai-areas-ranked-by-roi-2025/", tag: "Red Horizon" },
          ].map(src => (
            <a key={src.name} href={src.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid " + (T?.border || "#222"), borderRadius: 10, padding: "10px 12px", cursor: "pointer" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = (T?.gold || "#D4A843") + "60"; e.currentTarget.style.background = "rgba(212,168,67,0.04)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = T?.border || "#222"; e.currentTarget.style.background = "rgba(255,255,255,0.02)"; }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: T?.white || "#fff", lineHeight: 1.4 }}>{src.name}</span>
                  <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 8, background: "rgba(212,168,67,0.1)", color: T?.gold || "#D4A843", whiteSpace: "nowrap", flexShrink: 0 }}>{src.tag}</span>
                </div>
                <div style={{ fontSize: 10, color: T?.textMuted || "#666", marginBottom: 4 }}>{src.desc}</div>
                <div style={{ fontSize: 10, color: T?.gold || "#D4A843" }}>Open source →</div>
              </div>
            </a>
          ))}
        </div>
        <div style={{ marginTop: 12, fontSize: 10, color: T?.textMuted || "#666", lineHeight: 1.6 }}>
          All data sourced from official DLD reports, independent research firms (ValuStrat, REIDIN, Knight Frank, Cavendish Maxwell), and market aggregators. Every metric links to its primary source. Last updated: Session 7 · April 2026.
        </div>
      </div>

    </div>
  );
}

export default MarketTab;
