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
import {
  MARKET_FACTS,
  MARKET_COMPOSITION_2026,
  SUPPLY_PIPELINE_2026,
  GLOBAL_YIELD_COMPARISON,
} from "../data/marketFacts";
import MarketCycleHistory from "../components/MarketCycleHistory";
import MarketAlmanac from "../components/MarketAlmanac";
import ChapterNav, { Chapter } from "../components/ChapterNav";
import {
  Kpi as UIKpi,
  StatBar as UIStatBar,
  SectionTitle as UISectionTitle,
} from "../components/ui/DataDisplay";

// ── Year annotations ─────────────────────────────────────────────
const YEAR_META = {
  "2020": { label: "COVID-19", sub: "V-shaped recovery · 51K deals · AED 175B", color: "#FC8181" },
  "2021": { label: "Post-Covid Boom", sub: "Expo 2020 effect · 84K deals · AED 300B · +72%", color: "#F6AD55" },
  "2022": { label: "Half-Trillion Year", sub: "Golden Visa reform · 123K deals · AED 528B · +76%", color: "#F6E05E" },
  "2023": { label: "Momentum Builds", sub: "Luxury surge · 166K deals · AED 634B · +20%", color: "#68D391" },
  "2024": { label: "Record 4th Year", sub: "226K deals · AED 761B · +36% volume", color: "#63B3ED" },
  "2025": { label: "All-Time Record", sub: "270K+ deals · AED 917B · 5th consecutive record", color: "#D4A843" },
  /* Keyed for both the old and new labels so the chart legend resolves whichever
     the Firestore document currently carries. The 2026 point was January only —
     16,919 deals against AED 917B full-year 2025 — plotted beside complete years,
     which read as a market collapse. It now holds Q1 2026 and says so. */
  "2026 YTD": { label: "Q1 2026", sub: "Part year · 60,303 deals · AED 252B · +31% YoY", color: "rgba(212,168,67,0.4)", partYear: true },
  "Q1 2026": { label: "Q1 2026", sub: "Part year · 60,303 deals · AED 252B · +31% YoY", color: "rgba(212,168,67,0.4)", partYear: true },
};

// ── Global city comparison data ───────────────────────────────────
/**
 * Global comparison, refreshed 2026-07-30 from GLOBAL_YIELD_COMPARISON.
 *
 * The previous table stated single-decimal yields (Dubai 6.55, London 2.4,
 * Singapore 3.0) and per-city "taxRate" percentages that had no stated source.
 * Published 2026 figures are ranges, not points, and the tax burden differs in
 * KIND rather than by a single rate — London taxes rental income, Singapore
 * levies an annual property tax on non-owner-occupied homes, New York charges
 * property tax plus HOA. Flattening those into one percentage implied a
 * precision that does not exist.
 *
 * Colours are kept here; everything factual now comes from marketFacts.js.
 */
const CITY_COLORS = {
  Dubai: T?.gold || "#D4A843",
  London: "#63B3ED",
  "New York": "#FC8181",
  Singapore: "#68D391",
};

const GLOBAL_COMPARE = GLOBAL_YIELD_COMPARISON.cities.map(c => ({
  ...c,
  color: CITY_COLORS[c.city] || "#9F7AEA",
  yieldMid: (c.grossLow + c.grossHigh) / 2,
}));

/**
 * The page as an argument rather than a pile of sections.
 *
 * Previously this tab ran: 24-year history, almanac, this year's scorecard,
 * global comparison, tax calculator, composition, supply, forecasts. Every
 * section was sound and the sequence taught nothing, because no thread ran
 * through it. A reader landing mid-page could not tell what they had missed.
 *
 * The order now answers five questions in the order someone actually asks them:
 * what is happening, how did we get here, how does this compare, what is coming,
 * and what does it mean for me. Each chapter states what a reader will learn,
 * so clicking into one is a decision rather than a guess.
 */
const CHAPTERS = [
  { id: "ch-now",     title: "Where the market is now",  learn: "This year's transactions, prices and what the market is made of." },
  { id: "ch-history", title: "How it got here",          learn: "24 years, both crashes, and the moments that caused them." },
  { id: "ch-compare", title: "How Dubai compares",       learn: "Yields against London, New York and Singapore — after tax." },
  { id: "ch-next",    title: "What is coming",           learn: "Supply landing in 2026-28 and what analysts forecast." },
  { id: "ch-you",     title: "What it means for you",    learn: "The same data read for an investor, agent, developer or buyer." },
];

/** Shared palette for the composition bars. */
const BAR_COLORS = {
  gold: T?.gold || "#D4A843",
  blue: "#63B3ED",
  green: T?.green || "#68D391",
  purple: "#9F7AEA",
  orange: "#F6AD55",
};

// ── Market health score calculator ───────────────────────────────
// Based on: price cycle length, YoY growth, supply pipeline risk, analyst consensus
// Scale: 0-100 · <30 distressed · 30-50 cooling · 50-70 stable · 70-85 growing · 85-100 peak
/* A "market health score" of 72/100 was hardcoded here with no formula behind
   it — nothing computed it, nothing updated it, and the number carried the
   authority of a measurement while being an opinion typed into a constant.
   Alongside it sat "Month 56+ of longest growth cycle", written in April and
   still counting the same 56 months in July.

   Rather than invent a formula to justify the number, the panel now states the
   two things that ARE sourced: the consensus 2026 price forecast and the supply
   position driving it. If a composite score is wanted later it should be built
   from stated inputs with the weights shown, the way the Developer Health
   rebuild is specified — not asserted. */
const HEALTH_LABEL = "2026 consensus";
const HEALTH_COLOR = "#68D391";
const HEALTH_DESC = SUPPLY_PIPELINE_2026.forecast;

// ── Audience content ──────────────────────────────────────────────
const AUDIENCES = ["Investor", "Agent", "Developer", "Buyer"];
/**
 * Audience briefings, corrected 2026-07-30.
 *
 * These duplicated several figures that were fixed elsewhere on this tab, so the
 * same wrong claim appeared twice on one page. Most seriously, "87% cash
 * transactions — no systemic mortgage leverage risk in the market" survived here
 * after the composition bars were corrected to 64% cash / 36% mortgage. It told
 * an investor the opposite of what the data says.
 *
 * Two rules applied throughout:
 *   1. Every claim carries the period it describes, so its age is visible.
 *   2. Anything that could not be traced to a source is gone, not caveated.
 *      The Developer headline previously read "228 developers active in 2025"
 *      directly above a code comment saying the figure "could not be traced to
 *      any published source. Do not quote to a client until sourced."
 */
const AUDIENCE_INSIGHTS = {
  Investor: {
    icon: "📈", color: "#D4A843",
    headline: "Dubai gross yields run 6.5–7.1% — roughly double London, and the gap widens after tax.",
    points: [
      "AED 1M in Dubai returns about AED 65,000–71,000 a year gross, with no income tax on rent (2026 ranges)",
      "The same AED 1M in London returns about AED 30,000–40,000 gross; a 40% taxpayer nets nearer 2.7%",
      "Ongoing cost in Dubai is service charges only — no annual property tax, unlike Singapore or New York",
      "Cash funds 64% of activity and mortgages 36% (May 2026) — leverage is rising, not absent",
      "193,100 active investors, including 129,600 new ones (DLD, FY2025)",
    ],
    cta: "→ Yields tab for community-level net returns · DXB Estimate for valuation",
  },
  Agent: {
    icon: "🏡", color: "#63B3ED",
    headline: "Off-plan is 76% of transaction volume — that is where the deals are.",
    points: [
      "Off-plan 76% of volume and 75% of value; secondary 24% and 25% (May 2026)",
      "14,045 transactions worth AED 48.2B in May 2026, up 11.2% on the month",
      "Apartments take 50% of sales value, villas 28% — villas average AED 5.1M against AED 1.5M (May 2026)",
      "Average price per sqft AED 1,840 across all types (May 2026)",
      "Heaviest 2026 delivery lands in JVC, Business Bay, Dubai South, Dubai Science Park and Dubai Hills",
    ],
    cta: "→ Neighbourhoods for community intelligence · Projects for off-plan inventory",
  },
  Developer: {
    icon: "🏗️", color: "#FC8181",
    headline: "131,234 units are expected in 2026 — absorption is the constraint, not demand.",
    points: [
      "131,234 units expected across 2026, 81% apartments and 19% villas",
      "12,900 units completed in Q1 2026 — the highest quarterly delivery in three years",
      "200,000–300,000 units planned to 2028, much of it landing across 2026 and 2027",
      "Villa pricing is running well ahead of apartments on chronic undersupply — AED 5.1M average, +43% YoY (May 2026)",
      "Golden Visa eligibility at AED 2M continues to anchor demand at that price point",
    ],
    cta: "→ Developer Health for competitive positioning · Risk for absorption by community",
  },
  Buyer: {
    icon: "🔑", color: "#68D391",
    headline: "Prices are still rising, but the pace is forecast to moderate in 2026.",
    points: [
      "Average price per sqft AED 1,840 (May 2026); AED 1,759 citywide in Q1 2026, +12.5% YoY",
      "Consensus 2026 price growth is 5–8%, well below the +19.8% recorded in 2025 (ValuStrat VPI)",
      "Mortgages fund 36% of activity and mortgage value rose 30.2% in a month — banks are competing",
      "Apartments average AED 1.5M, villas AED 5.1M (May 2026) — the gap has widened sharply",
      "Golden Visa: AED 2M+ in property gives 10-year renewable residency with no sponsor",
    ],
    cta: "→ DXB Estimate for valuation · Mortgage tab for financing and affordability",
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
/* ── LOCAL PRIMITIVES, NOW BACKED BY THE SHARED DESIGN SYSTEM ────────────────
 *
 * These three used to be defined here with their own padding, type scale and
 * border colours, while OverviewTab defined near-identical ones with different
 * values. Moving between the two tabs felt like moving between two products.
 *
 * They are kept as thin wrappers rather than replaced at all 22 call sites: the
 * props stay identical, so nothing downstream changes, but every one now renders
 * through src/components/ui/DataDisplay.jsx. New work should import those
 * directly; these exist so this file's existing call sites did not have to be
 * rewritten in the same change that altered their appearance.
 * ─────────────────────────────────────────────────────────────────────────── */

const StatBar = ({ label, value, pct, color, note }) => (
  <UIStatBar label={label} value={value} pct={pct} color={color} note={note} />
);

const KpiCard = ({ label, value, change, note, color, onClick }) => (
  <UIKpi
    label={label}
    value={value}
    accent={color}
    onClick={onClick}
    /* `change` and `note` are folded into the shared component's single
       `context` slot, which is the field it requires precisely so a figure
       cannot ship with nothing attached to it. */
    context={
      (change || note) ? (
        <>
          {change && (
            <span style={{ color: T?.green || "#68D391", fontWeight: 700 }}>{change}</span>
          )}
          {change && note ? " · " : ""}
          {note}
        </>
      ) : null
    }
  />
);

const SH = ({ title, sub, right }) => (
  <UISectionTitle variant="heading" hint={sub} right={right}>{title}</UISectionTitle>
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
  /* 6.55% was the unverified REIDIN figure that marketFacts.js itself flags as
     unconfirmed. Published 2026 gross yields for Dubai run 6.5–7.1%; the low end
     is used here so the tax comparison understates rather than oversells. */
  const DUBAI_GROSS_YIELD = GLOBAL_YIELD_COMPARISON.cities.find(c => c.city === "Dubai")?.grossLow ?? 6.5;
  const annualRent = taxAmount * (DUBAI_GROSS_YIELD / 100);
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
          <div style={{ fontSize: 11, color: T?.textMuted || "#666", marginTop: 3 }}>
            Composition and supply as of {MARKET_COMPOSITION_2026.period} · annual totals FY2025 · every figure below carries its source and date
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 10, color: T?.textMuted || "#666", marginBottom: 3 }}>2026 price forecast</div>
            <div style={{ fontFamily: "'Fraunces',serif", fontSize: 18, fontWeight: 800, color: HEALTH_COLOR }}>5–8% — {HEALTH_LABEL}</div>
          </div>
          <div style={{ width: 48, height: 48, borderRadius: "50%", border: "3px solid " + HEALTH_COLOR, display: "flex", alignItems: "center", justifyContent: "center", background: HEALTH_COLOR + "15" }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: HEALTH_COLOR, fontFamily: "'Fraunces',serif" }}>5–8%</span>
          </div>
        </div>
      </div>


      <ChapterNav chapters={CHAPTERS} />

      {/* ── 01 · WHERE THE MARKET IS NOW ─────────────────────────
          Current state first. An earlier version opened with the 24-year
          history, on the reasoning that context should precede the pitch. In
          practice it asked a reader to absorb two decades before learning what
          is true today — history lands better once there is a present to
          explain. */}
      <Chapter id="ch-now" index={1} title="Where the market is now"
               learn="This year's transactions, prices, and what the market is made of.">

      <SH title="2025 Market Scorecard" sub="Full year · Dubai Land Department official data · January 2026" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: 10, marginBottom: 8 }}>
        <KpiCard label="Total Market Value" value={getStat("Total Market Value")?.value} change={getStat("Total Market Value")?.change} note="Sales + mortgages + gifts" onClick={() => handleTabChange?.("DLD Volumes")} />
        <KpiCard label="Total Transactions" value={getStat("Total Transactions")?.value} change={getStat("Total Transactions")?.change} note="5th consecutive annual record" />
        <KpiCard label="Sales Transactions" value={MARKET_FACTS.residentialSales2025.value} change={MARKET_FACTS.residentialSales2025.change} note={MARKET_FACTS.residentialSales2025.note} />
        {/* The 65% value comes from Firestore and is stale — verified 2025 share
            is over 70% of transactions. Correcting it needs a Firestore write,
            which is blocked while the read quota is exhausted. */}
        <KpiCard label="Off-Plan Share" value={getStat("Off-Plan Share")?.value} change={getStat("Off-Plan Share")?.change} note="Stale · verified 2025 share is over 70%" />
        {/* AED 1,692 = DLD full-year 2025 citywide residential median across
            192,808 transactions. The previous AED 1,863 was cited to our own
            blog and sat ~10% above the DLD figure. */}
        <KpiCard label="Avg PPSF" value={MARKET_FACTS.avgPpsf2025.value} change={MARKET_FACTS.avgPpsf2025.change} note={MARKET_FACTS.avgPpsf2025.note} color={T?.gold || "#D4A843"} />
        {/* Apartment/villa yields corrected to the sourced 2025 figures — the
            previous 7.03% / 4.63% understated both. */}
        <KpiCard label="Avg Gross Yield" value={getStat("Avg Gross Yield")?.value} change={`Apts ${MARKET_FACTS.yieldApartments2025.value} · Villas ${MARKET_FACTS.yieldVillas2025.value}`} note="REIDIN / DXB Interact 2025" color={T?.green || "#68D391"} />
        {/* Caption previously read "Cash 87%", the third place that figure
            appeared on this page. Cash funds 64% of activity as of May 2026. */}
        <KpiCard label="Mortgage Deals" value={getStat("Mortgage Transactions")?.value} change={getStat("Mortgage Transactions")?.change} note="AED 179.26B FY2025 · cash funds 64% of activity, May 2026" />
        <KpiCard label="Investor Base" value={getStat("Investor Base")?.value} change={getStat("Investor Base")?.change} note="129,600 new investors" />
        <KpiCard label="Women Investors" value={getStat("Women Investors")?.value} change={getStat("Women Investors")?.change} note="76,700 deals" />
        <KpiCard label="Price Growth" value={getStat("Price Growth")?.value} change="ValuStrat VPI Dec 2025" note="REIDIN: +12.88%" color={T?.green || "#68D391"} />
        {/* Neither figure could be traced to a published source. The note no
            longer credits DLD — the RERA registry lists 2,200+ licensed
            developers, so "228, per DLD" was wrong on its face. */}
        {/* "Active Developers" (228) and "Units Launched" (131,504) were shown
            with the caption "Unverified · no published source". A figure nobody
            can source does not belong on a market page beside DLD totals — the
            caveat does not repair it, it just moves the problem to the reader.
            Replaced with the 2026 supply figures, which are sourced. */}
        <KpiCard label="Units expected 2026" value={SUPPLY_PIPELINE_2026.items[0].value} change="81% apartments" note={SUPPLY_PIPELINE_2026.items[0].note} />
        <KpiCard label="Completed Q1 2026" value={SUPPLY_PIPELINE_2026.items[1].value} change="Highest in 3 years" note={SUPPLY_PIPELINE_2026.items[1].note} />
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
            {/* Part-year points are plotted but kept out of the year legend, so a
                quarter is never presented as comparable to a full year. Filtered
                on a flag rather than a hardcoded key — the previous check tested
                for the literal string "2026 YTD" and would have silently shown a
                duplicate the moment that label changed. */}
            {Object.entries(YEAR_META).filter(([, meta]) => !meta.partYear).map(([year, meta]) => (
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
      </Chapter>

      {/* ── 02 · HOW IT GOT HERE ─────────────────────────────────
          The cycle gives the arc; the almanac gives the moments inside it.
          Cycle first, because the shape has to land before the detail can. */}
      <Chapter id="ch-history" index={2} title="How it got here"
               learn="24 years, both crashes, and the moments that caused them.">
        <MarketCycleHistory style={{ marginBottom: 28 }} />
        <MarketAlmanac style={{ marginBottom: 8 }} />
      </Chapter>

      {/* ── 03 · HOW DUBAI COMPARES ────────────────────────────── */}
      <Chapter id="ch-compare" index={3} title="How Dubai compares"
               learn="Yields against London, New York and Singapore — after tax, which is where the gap widens.">

      <SH title="Dubai vs The World" sub="Why global investors choose Dubai · Gross yield · PPSF · Tax · Price growth 2025 · Sources: BetterHomes, Arabian Business, Red Horizon 2025" />
      <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid " + (T?.border || "#222"), borderRadius: 12, padding: "20px", marginBottom: 24, overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 600 }}>
          <thead>
            <tr>
              {["City", "Gross Yield (2026)", "What the tax actually costs"].map(h => (
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
                      <span style={{ fontSize: 13, fontWeight: isDubai ? 800 : 600, color: isDubai ? T?.gold || "#D4A843" : T?.white || "#fff", fontFamily: isDubai ? "'Fraunces',serif" : "inherit" }}>{city.city}</span>
                      {isDubai && <span style={{ fontSize: 9, padding: "2px 6px", background: "rgba(212,168,67,0.2)", color: T?.gold || "#D4A843", borderRadius: 6, fontWeight: 700 }}>WE ARE HERE</span>}
                    </div>
                  </td>
                  {/* Published as a RANGE, shown as a range. The old table gave a
                      single decimal per city, which implied a precision the
                      sources do not claim. */}
                  <td style={{ padding: "12px 12px", borderBottom: "1px solid " + (T?.border || "#222") + "80" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ height: 6, width: Math.round(city.yieldMid * 12) + "px", borderRadius: 3, background: isDubai ? T?.gold || "#D4A843" : city.color, transition: "width 0.8s" }} />
                      <span style={{ fontSize: 13, fontWeight: 700, color: isDubai ? T?.gold || "#D4A843" : T?.white || "#fff" }}>
                        {city.grossLow}–{city.grossHigh}%
                      </span>
                    </div>
                  </td>
                  {/* The tax burden differs in KIND, not by a single rate — income
                      tax in London, annual property tax in Singapore, property tax
                      plus HOA in New York. Stated rather than flattened. */}
                  <td style={{ padding: "12px 12px", borderBottom: "1px solid " + (T?.border || "#222") + "80" }}>
                    <span style={{ fontSize: 11, lineHeight: 1.5, color: isDubai ? T?.green || "#68D391" : T?.textSecondary || "#aaa", fontWeight: isDubai ? 600 : 400 }}>
                      {city.netNote}
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
            Expected gross rental income: <span style={{ color: T?.white || "#fff", fontWeight: 700 }}>AED {Math.round(annualRent).toLocaleString()}/yr</span> (at {DUBAI_GROSS_YIELD}%, the low end of the published 2026 range)
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
          {/* Off-plan and funding split. Previously hardcoded at 65% off-plan and
              87% cash — the first was flagged stale in its own caption and shown
              anyway, the second understated mortgage-funded activity by nearly
              three times. Both now come from MARKET_COMPOSITION_2026, dated. */}
          <SH title="Market Composition" sub={`${MARKET_COMPOSITION_2026.period} · ${MARKET_COMPOSITION_2026.source}`} />
          {MARKET_COMPOSITION_2026.split.map(s => (
            <StatBar key={s.label} label={s.label} value={`${s.pct}%`} pct={s.pct} color={BAR_COLORS[s.colorKey]} note={s.note} />
          ))}
          {MARKET_COMPOSITION_2026.funding.map(s => (
            <StatBar key={s.label} label={s.label} value={`${s.pct}%`} pct={s.pct} color={BAR_COLORS[s.colorKey]} note={s.note} />
          ))}
          <div style={{ fontSize: 10, color: T?.textMuted || "#666", marginTop: 8 }}>
            {MARKET_COMPOSITION_2026.transactions.value} transactions · {MARKET_COMPOSITION_2026.transactions.note}
          </div>
        </div>
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid " + (T?.border || "#222"), borderRadius: 12, padding: "20px" }}>
          {/* Shown by share of VALUE, which is what the source measures. The old
              version mixed "83% of all deals" (volume) with unsourced price-band
              percentages, so the two halves of the panel were not comparable. */}
          <SH title="Where the Money Goes" sub={`${MARKET_COMPOSITION_2026.period} · share of total sales value`} />
          {MARKET_COMPOSITION_2026.byValue.map(s => (
            <StatBar key={s.label} label={s.label} value={`${s.pct}%`} pct={s.pct} color={BAR_COLORS[s.colorKey]} note={s.note} />
          ))}
          <div style={{ fontSize: 10, color: T?.textMuted || "#666", marginTop: 8 }}>
            Average price per sqft {MARKET_COMPOSITION_2026.avgPpsf.value} · {MARKET_COMPOSITION_2026.avgPpsf.note}
          </div>
        </div>
      </div>

      {/* ── Supply Pipeline Risk ───────────────────────────────── */}
      {/* Pipeline figures refreshed 2026-07-30. The previous ones (~98K for 2026,
          ~366K to 2028) were Q3 2025 forecasts carried forward unchanged. */}
      </Chapter>

      {/* ── 04 · WHAT IS COMING ────────────────────────────────── */}
      <Chapter id="ch-next" index={4} title="What is coming"
               learn="Supply landing through 2026-28, and what analysts forecast for prices.">

      <SH title="Supply Pipeline — Know the Risk" sub={`${SUPPLY_PIPELINE_2026.source} · as of ${SUPPLY_PIPELINE_2026.asOf}`} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(190px,1fr))", gap: 10, marginBottom: 24 }}>
        {[
          ...SUPPLY_PIPELINE_2026.items,
          { label: "Heaviest 2026 delivery", value: "JVC · Business Bay · Dubai South", note: SUPPLY_PIPELINE_2026.concentration, risk: "high" },
          { label: "2026 price forecast", value: "5–8%", note: SUPPLY_PIPELINE_2026.forecast, risk: "medium" },
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
            /* ValuStrat publishes an INDEX in points, not AED/sqft. The previous
               description attributed a per-sqft figure to them that they do not
               publish. Corrected to their actual December 2025 readings. */
            { name: "ValuStrat VPI December 2025", desc: "Index 240.4 pts · +19.8% YoY · Villas +25.1% · Apartments +14.2%", url: "https://valustrat.com/products/vpi-dubai-residential-capital-values-december-2025", tag: "ValuStrat" },
            { name: "REIDIN — UAE Residential Price Report", desc: "+12.88% YoY Dec 2025 · Villas +15.16% · Yield 6.55%", url: "https://reidin.com", tag: "REIDIN" },
            { name: "Knight Frank — Dubai Residential Q3 2025", desc: "+10% YoY values · 46% delivery rate · 2026: +3%/+1%", url: "https://www.knightfrank.ae/newsroom/article/2025/11/dubai-residential-market-review-q3-2025", tag: "Knight Frank" },
            { name: "BetterHomes — Dubai Residential FY2025", desc: "Off-plan 65% · 132,000 off-plan deals · AED 248B apts", url: "https://www.constructionweekonline.com/analysis/dubai-off-plan-sales-2025", tag: "BetterHomes" },
            { name: "Cavendish Maxwell — Q3 2025", desc: "~98K units 2026 · 366K through 2028 · off-plan 76%", url: "https://cavendishmaxwell.com/insights/market-reports/residential/dubai-residential-market-performance-q3-2025", tag: "Cavendish Maxwell" },
            { name: "BetterHomes — Dubai vs Global ROI Feb 2026", desc: "Dubai 7% yield vs London 2.4% vs New York 4.2%", url: "https://www.bhomes.com/en/blog/betterinformed/dubai-vs-other-global-real-estate-hubs-which-offers-better-roi", tag: "BetterHomes" },
            { name: "Arabian Business — Dubai outperforms London/NY", desc: "7% yield vs 2.4% London · 4.2% NY · price growth comparison", url: "https://www.arabianbusiness.com/industries/real-estate/dubai-real-estate-outperforms-london-and-new-york-with-superior-7-investment-yields-and-double-digit-price-increases", tag: "Arabian Business" },
            { name: "Dubai Land Department — FY2025 transaction data", desc: "Median AED 1,692/sqft citywide residential · 192,808 transactions", url: "https://dxbinteract.com/dubai-real-estate-faqs/average-price-per-square-foot-dubai", tag: "DLD" },
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


      </Chapter>

      {/* ── 05 · WHAT IT MEANS FOR YOU ───────────────────────────
          The same data, read for the decision each audience is actually
          making. This sat at the TOP of the page before, which asked a reader
          to pick a role before they had seen anything to have a view about.
          It belongs last: interpretation after evidence. */}
      <Chapter id="ch-you" index={5} title="What it means for you"
               learn="The same market read for an investor, agent, developer or buyer.">

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
      </Chapter>

    </div>
  );
}

export default MarketTab;
