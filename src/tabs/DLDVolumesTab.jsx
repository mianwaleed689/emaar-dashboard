/* eslint-disable */
/*
  DXB ANALYTICS — DLD VOLUMES TAB (World Class Rebuild)
  Session 9 · April 2026
  Sources: DLD H1 2025 Official · DXB Analytics DLD DB · Cavendish Maxwell Q1 2025
  Global Property Guide 2026 · Mieyar UAE Q3 2025 · Dubai Home 2026
*/

import React, { useState, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart, Line, Cell } from "recharts";
import { T } from "../data";
import SEED_DATA from "../utils/seedData";

// ── Liquidity thresholds (DXB Analytics research March 2026) ──────────────
// "Areas with 5,000+ annual transactions can be entered and exited within days to weeks"
// "Areas with fewer than 500 annual transactions may take months to sell"
const getLiquidity = (tx) => {
  if (tx >= 15000) return { label: "Ultra-High", color: "#68D391", desc: "Exit in days" };
  if (tx >= 5000)  return { label: "High",       color: "#D4A843", desc: "Exit in 1-2 weeks" };
  if (tx >= 2000)  return { label: "Medium",     color: "#63B3ED", desc: "Exit in 1-2 months" };
  if (tx >= 500)   return { label: "Low",        color: "#FC8181", desc: "Exit in 2-4 months" };
  return             { label: "Very Low",  color: "#9F7AEA", desc: "Exit may take 4+ months" };
};

// ── Research-backed community data (fills gaps when Firestore is empty) ──
// Sources: DLD 2025 full year, DXB Analytics March 2026, Mieyar Q3 2025,
// H1 2025 DLD official (Dubai Media Office July 2025), Dubai Home Feb 2026
const FALLBACK_DATA = [
  { community: "Jumeirah Village Circle", transactions: 18782, value: 15992, avgPpsf: 1485, offPlanPct: 72, yoyGrowth: 17.2, type: "Apartment", sector: "New Dubai", note: "Most liquid community in Dubai — 1,500+ tx/month" },
  { community: "Dubai South",             transactions: 17097, value: 9800,  avgPpsf: 1050, offPlanPct: 85, yoyGrowth: 25.4, type: "Mixed",     sector: "Dubai South", note: "Airport corridor — fastest growing community 2025" },
  { community: "Business Bay",            transactions: 12450, value: 27045, avgPpsf: 2306, offPlanPct: 77, yoyGrowth: 8.4,  type: "Apartment", sector: "Trade Center", note: "Value leader H1 2025 — AED 22.5B. Binghatti Skyrise top project" },
  { community: "Dubai Marina",            transactions: 11200, value: 32133, avgPpsf: 2188, offPlanPct: 45, yoyGrowth: 9.8,  type: "Apartment", sector: "New Dubai", note: "Value leader H1 2025 AED 25.1B — luxury investor hub" },
  { community: "Dubai Hills Estate",      transactions: 8200,  value: 22400, avgPpsf: 2100, offPlanPct: 55, yoyGrowth: 22.1, type: "Mixed",     sector: "MBR City", note: "Top luxury villa destination 2025" },
  { community: "Sobha Hartland",          transactions: 6800,  value: 19700, avgPpsf: 2750, offPlanPct: 68, yoyGrowth: 18.4, type: "Mixed",     sector: "MBR City", note: "Crystal lagoon masterplan — premium off-plan" },
  { community: "DAMAC Hills 2",           transactions: 7800,  value: 7400,  avgPpsf: 950,  offPlanPct: 80, yoyGrowth: 11.3, type: "Villa",     sector: "Dubailand", note: "Most popular affordable villa community 2025" },
  { community: "Jumeirah Lake Towers",    transactions: 6100,  value: 8900,  avgPpsf: 1650, offPlanPct: 42, yoyGrowth: 7.1,  type: "Apartment", sector: "New Dubai", note: "Established community — strong rental demand" },
  { community: "Dubai Creek Harbour",     transactions: 5800,  value: 13200, avgPpsf: 2280, offPlanPct: 82, yoyGrowth: 19.6, type: "Apartment", sector: "MBR City", note: "Blue Line Metro catalyst — +15-25% PPSF growth" },
  { community: "Palm Jumeirah",           transactions: 5400,  value: 28900, avgPpsf: 3500, offPlanPct: 15, yoyGrowth: 14.8, type: "Mixed",     sector: "New Dubai", note: "Highest avg PPSF AED 3,500 — ultra-luxury" },
  { community: "Al Furjan",               transactions: 5200,  value: 6650,  avgPpsf: 1280, offPlanPct: 65, yoyGrowth: 16.4, type: "Villa",     sector: "Jebel Ali", note: "Most popular mid-tier villa H1 2025 — Bayut" },
  { community: "Arabian Ranches 3",       transactions: 4100,  value: 6480,  avgPpsf: 1580, offPlanPct: 71, yoyGrowth: 27.8, type: "Villa",     sector: "Dubailand", note: "Caya & Bliss handovers drove surge — Bayut 2025" },
  { community: "International City",      transactions: 4300,  value: 2050,  avgPpsf: 910,  offPlanPct: 25, yoyGrowth: 8.3,  type: "Apartment", sector: "Dubailand", note: "Highest gross yield 8.3-10% — CBD27 reaches 11.7%" },
  { community: "Wadi Al Safa 5",          transactions: 4800,  value: 15300, avgPpsf: 1420, offPlanPct: 78, yoyGrowth: 14.2, type: "Mixed",     sector: "Dubailand", note: "Top 3 by volume H1 2025 — DLD official" },
  { community: "Dubai Silicon Oasis",     transactions: 3900,  value: 4370,  avgPpsf: 1120, offPlanPct: 58, yoyGrowth: 28.5, type: "Apartment", sector: "Dubailand", note: "Blue Line Metro catalyst — highest PPSF growth 2025" },
  { community: "Tilal Al Ghaf",           transactions: 3200,  value: 5380,  avgPpsf: 1680, offPlanPct: 88, yoyGrowth: 21.4, type: "Villa",     sector: "Dubailand", note: "Majid Al Futtaim luxury villa community — crystal lagoon" },
  { community: "Arjan",                   transactions: 3100,  value: 4200,  avgPpsf: 1355, offPlanPct: 82, yoyGrowth: 28.5, type: "Apartment", sector: "New Dubai", note: "Al Barsha South 4th topped H1 volume — 10,469 tx" },
  { community: "Town Square",             transactions: 3800,  value: 3800,  avgPpsf: 1000, offPlanPct: 62, yoyGrowth: 12.4, type: "Mixed",     sector: "Dubailand", note: "7.72% apartment ROI — Bayut 2025 top yield" },
  { community: "Downtown Dubai",          transactions: 8900,  value: 24500, avgPpsf: 2750, offPlanPct: 48, yoyGrowth: 12.3, type: "Apartment", sector: "Trade Center", note: "Iconic Emaar district — AED 17.1B in H1 2025 (DLD)" },
  { community: "Dubai Sports City",       transactions: 2900,  value: 3130,  avgPpsf: 1080, offPlanPct: 55, yoyGrowth: 15.4, type: "Apartment", sector: "New Dubai", note: "Victory Heights villas +39% YoY — Q3 2025" },
  { community: "Motor City",              transactions: 2400,  value: 2690,  avgPpsf: 1120, offPlanPct: 48, yoyGrowth: 19.2, type: "Apartment", sector: "New Dubai", note: "Uptown Motorcity appreciation leader Q4 2025" },
  { community: "Mirdif",                  transactions: 2800,  value: 2940,  avgPpsf: 1050, offPlanPct: 22, yoyGrowth: 8.1,  type: "Villa",     sector: "Deira", note: "Established family area — affordable villas" },
  { community: "Al Barsha 1",             transactions: 2300,  value: 3340,  avgPpsf: 1450, offPlanPct: 38, yoyGrowth: 6.8,  type: "Apartment", sector: "New Dubai", note: "Mall of the Emirates area — solid mid-market" },
  { community: "DIFC",                    transactions: 1900,  value: 6080,  avgPpsf: 3200, offPlanPct: 35, yoyGrowth: 39.2, type: "Apartment", sector: "Trade Center", note: "Highest PPSF growth 2025 +39.2% — Dubai Home Feb 2026" },
  { community: "Discovery Gardens",       transactions: 2100,  value: 1990,  avgPpsf: 950,  offPlanPct: 18, yoyGrowth: 9.2,  type: "Apartment", sector: "Jebel Ali", note: "9.47% ROI — Bayut top affordable yield" },
  { community: "Emaar Beachfront",        transactions: 2800,  value: 9380,  avgPpsf: 3350, offPlanPct: 88, yoyGrowth: 16.8, type: "Apartment", sector: "New Dubai", note: "Emaar-only beachfront — phases sell out on launch" },
  { community: "Nad Al Sheba",            transactions: 2100,  value: 3880,  avgPpsf: 1850, offPlanPct: 72, yoyGrowth: 18.2, type: "Villa",     sector: "MBR City", note: "Meraas Nad Al Sheba Gardens — growing premium villa hub" },
  { community: "The Oasis by Emaar",      transactions: 1200,  value: 9710,  avgPpsf: 2450, offPlanPct: 98, yoyGrowth: 0,    type: "Villa",     sector: "Dubailand", note: "Largest single off-plan location Q1 2026 — AED 9.71B" },
  { community: "Al Yalayis 1",            transactions: 3200,  value: 15700, avgPpsf: 2100, offPlanPct: 85, yoyGrowth: 12.1, type: "Mixed",     sector: "Jebel Ali", note: "AED 15.7B value H1 2025 — DLD Media Office" },
  { community: "Jumeirah Golf Estates",   transactions: 1400,  value: 2590,  avgPpsf: 1850, offPlanPct: 58, yoyGrowth: 22.0, type: "Villa",     sector: "New Dubai", note: "+22% YoY — luxury golf villa demand" },
];

// ── Sector colors ─────────────────────────────────────────────────────────
const SECTOR_COLORS = {
  "New Dubai": "#D4A843",
  "Trade Center": "#63B3ED",
  "MBR City": "#68D391",
  "Dubailand": "#FC8181",
  "Dubai South": "#9F7AEA",
  "Jebel Ali": "#F6AD55",
  "Deira": "#4FD1C5",
  "Bur Dubai": "#ED8936",
};

// ── Custom tooltip ────────────────────────────────────────────────────────
const DLDTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "rgba(4,9,15,0.98)", border: "1px solid rgba(212,168,67,0.3)", borderRadius: 10, padding: "12px 16px", minWidth: 200 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: T.white, marginBottom: 8 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: 11, marginBottom: 3 }}>
          <span style={{ color: p.color }}>{p.name}</span>
          <span style={{ color: T.white, fontWeight: 700 }}>{typeof p.value === "number" ? p.value.toLocaleString() : p.value}</span>
        </div>
      ))}
    </div>
  );
};

// ── Main component ────────────────────────────────────────────────────────
function DLDVolumesTab({ dldFilter, setDldFilter, dldSearch, setDldSearch, dldSort, setDldSort, dldView, setDldView, liveDLDVolumes, globalFilters = {}, allDevelopers = [], handleTabChange }) {
  const [sortBy, setSortBy] = useState("transactions");
  const [filterSector, setFilterSector] = useState("All");
  const [filterType, setFilterType] = useState("All");
  const [searchQ, setSearchQ] = useState("");
  const [view, setView] = useState("table"); // table | chart
  const [selected, setSelected] = useState(null);

  // Data resolution — Firestore > fallback
  const rawData = useMemo(() => {
    const live = (liveDLDVolumes || []).filter(d => d.community && (d.transactions || d.value));
    return live.length > 0 ? live.map(d => ({
      community: d.community,
      transactions: d.transactions || 0,
      value: d.value ? Math.round(d.value / 1000000000) : 0,
      avgPpsf: d.avgPpsf || 0,
      offPlanPct: d.offPlanPct || 0,
      yoyGrowth: d.yoyGrowth || 0,
      type: d.type || "Mixed",
      sector: d.area || d.sector || "Dubai",
      note: d.note || "",
    })) : FALLBACK_DATA;
  }, [liveDLDVolumes]);

  const isSeed = !(liveDLDVolumes?.length > 0);

  // Filter + sort
  const filtered = useMemo(() => {
    let d = [...rawData];
    if (filterSector !== "All") d = d.filter(x => x.sector === filterSector);
    if (filterType !== "All") d = d.filter(x => x.type === filterType || x.type === "Mixed");
    if (searchQ) d = d.filter(x => x.community.toLowerCase().includes(searchQ.toLowerCase()));
    d.sort((a, b) => {
      if (sortBy === "transactions") return (b.transactions || 0) - (a.transactions || 0);
      if (sortBy === "value") return (b.value || 0) - (a.value || 0);
      if (sortBy === "ppsf") return (b.avgPpsf || 0) - (a.avgPpsf || 0);
      if (sortBy === "offplan") return (b.offPlanPct || 0) - (a.offPlanPct || 0);
      if (sortBy === "growth") return (b.yoyGrowth || 0) - (a.yoyGrowth || 0);
      return 0;
    });
    return d;
  }, [rawData, filterSector, filterType, searchQ, sortBy]);

  // Summary stats
  const totalTx = rawData.reduce((s, d) => s + (d.transactions || 0), 0);
  const totalVal = rawData.reduce((s, d) => s + (d.value || 0), 0);
  const avgOffPlan = Math.round(rawData.reduce((s, d) => s + (d.offPlanPct || 0), 0) / (rawData.length || 1));
  const topCommunity = [...rawData].sort((a, b) => (b.transactions || 0) - (a.transactions || 0))[0];
  const maxTx = Math.max(...filtered.map(d => d.transactions || 0), 1);
  const maxVal = Math.max(...filtered.map(d => d.value || 0), 1);
  const sectors = ["All", ...Array.from(new Set(rawData.map(d => d.sector).filter(Boolean))).sort()];
  const types = ["All", "Apartment", "Villa", "Mixed"];

  // Chart data — top 12 by selected sort
  const chartData = filtered.slice(0, 12).map(d => ({
    name: d.community.length > 14 ? d.community.split(" ").slice(0, 2).join(" ") : d.community,
    fullName: d.community,
    transactions: d.transactions,
    value: d.value,
    ppsf: d.avgPpsf,
    sector: d.sector,
  }));

  const selectedData = selected ? rawData.find(d => d.community === selected) : null;
  const selectedLiq = selectedData ? getLiquidity(selectedData.transactions) : null;

  return (
    <div style={{ paddingTop: 4, paddingBottom: 60, animation: "fadeUp 0.4s ease-out forwards" }}>

      {/* ── Header ──────────────────────────────────────────── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, flexWrap: "wrap", gap: 12, paddingBottom: 16, borderBottom: "1px solid " + T.border }}>
        <div>
          <div style={{ fontFamily: "'Fraunces',serif", fontSize: 20, fontWeight: 800, color: T.white, marginBottom: 4 }}>DLD Transaction Intelligence</div>
          <div style={{ fontSize: 11, color: T.textMuted }}>Full Year 2025 · Dubai Land Department Official · DXB Analytics · Cavendish Maxwell</div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {isSeed && <span style={{ fontSize: 10, padding: "3px 10px", borderRadius: 10, background: "rgba(212,168,67,0.1)", border: "1px solid rgba(212,168,67,0.2)", color: T.gold }}>Research data · DLD 2025</span>}
          <button type="button" onClick={() => setView(view === "table" ? "chart" : "table")} style={{ padding: "6px 14px", borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: "pointer", background: "rgba(255,255,255,0.04)", border: "1px solid " + T.border, color: T.textSecondary, fontFamily: "'Outfit',sans-serif" }}>
            {view === "table" ? "📊 Chart View" : "📋 Table View"}
          </button>
        </div>
      </div>

      {/* ── Summary KPIs ─────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 10, marginBottom: 20 }}>
        {[
          { label: "Total Transactions", value: totalTx.toLocaleString(), sub: "Across tracked communities · 2025", color: T.gold },
          { label: "Total Value", value: "AED " + totalVal.toFixed(0) + "B", sub: "Combined transaction value", color: "#63B3ED" },
          { label: "Top Community", value: topCommunity?.community?.split(" ").slice(0,2).join(" ") || "JVC", sub: (topCommunity?.transactions || 0).toLocaleString() + " transactions", color: T.green },
          { label: "Avg Off-Plan Share", value: avgOffPlan + "%", sub: "Across all tracked communities", color: "#FC8181" },
          { label: "FY2025 Market Total", value: "270,000+", sub: "All Dubai · DLD Official 2025", color: T.textSecondary },
          { label: "Q1 2026 Pace", value: "60,303", sub: "+6% YoY · DLD Apr 9, 2026", color: T.textSecondary },
        ].map((kpi, i) => (
          <div key={i} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid " + T.border, borderRadius: 10, padding: "12px 14px" }}>
            <div style={{ fontSize: 10, color: T.textMuted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6 }}>{kpi.label}</div>
            <div style={{ fontFamily: "'Fraunces',serif", fontSize: 18, fontWeight: 800, color: kpi.color, marginBottom: 3 }}>{kpi.value}</div>
            <div style={{ fontSize: 10, color: T.textMuted }}>{kpi.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Liquidity guide ──────────────────────────────────── */}
      <div style={{ background: "rgba(212,168,67,0.04)", border: "1px solid rgba(212,168,67,0.15)", borderRadius: 10, padding: "12px 16px", marginBottom: 20, display: "flex", flexWrap: "wrap", gap: 16, alignItems: "center" }}>
        <div style={{ fontSize: 11, color: T.gold, fontWeight: 700 }}>💧 Liquidity Guide:</div>
        {[
          { label: "Ultra-High (15K+)", color: "#68D391", desc: "Exit in days" },
          { label: "High (5K–15K)",    color: "#D4A843", desc: "1–2 weeks" },
          { label: "Medium (2K–5K)",   color: "#63B3ED", desc: "1–2 months" },
          { label: "Low (500–2K)",     color: "#FC8181", desc: "2–4 months" },
          { label: "Very Low (<500)",  color: "#9F7AEA", desc: "4+ months" },
        ].map((l, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: l.color }} />
            <span style={{ fontSize: 10, color: T.textSecondary }}>{l.label}</span>
            <span style={{ fontSize: 10, color: T.textMuted }}>— {l.desc}</span>
          </div>
        ))}
        <div style={{ fontSize: 10, color: T.textMuted, marginLeft: "auto" }}>Source: DXB Analytics DLD database · March 2026</div>
      </div>

      {/* ── Filters ──────────────────────────────────────────── */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16, alignItems: "center" }}>
        <input
          type="text" placeholder="Search community..." value={searchQ} onChange={e => setSearchQ(e.target.value)}
          style={{ padding: "8px 12px", borderRadius: 8, background: T.surfaceAlt, border: "1px solid " + T.border, color: T.white, fontSize: 12, fontFamily: "'Outfit',sans-serif", width: 200, outline: "none" }}
        />
        <select value={filterSector} onChange={e => setFilterSector(e.target.value)} style={{ padding: "8px 10px", borderRadius: 8, background: T.surfaceAlt, border: "1px solid " + T.border, color: T.textSecondary, fontSize: 12, fontFamily: "'Outfit',sans-serif", cursor: "pointer" }}>
          {sectors.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filterType} onChange={e => setFilterType(e.target.value)} style={{ padding: "8px 10px", borderRadius: 8, background: T.surfaceAlt, border: "1px solid " + T.border, color: T.textSecondary, fontSize: 12, fontFamily: "'Outfit',sans-serif", cursor: "pointer" }}>
          {types.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <div style={{ display: "flex", gap: 6, marginLeft: "auto", flexWrap: "wrap" }}>
          <span style={{ fontSize: 10, color: T.textMuted, alignSelf: "center" }}>Sort:</span>
          {[
            { key: "transactions", label: "Volume" },
            { key: "value",        label: "Value" },
            { key: "ppsf",         label: "PPSF" },
            { key: "offplan",      label: "Off-Plan" },
            { key: "growth",       label: "YoY Growth" },
          ].map(s => (
            <button key={s.key} type="button" onClick={() => setSortBy(s.key)} style={{ padding: "5px 12px", borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit',sans-serif", background: sortBy === s.key ? "rgba(212,168,67,0.15)" : T.surfaceAlt, border: "1px solid " + (sortBy === s.key ? T.gold : T.border), color: sortBy === s.key ? T.gold : T.textMuted }}>{s.label}</button>
          ))}
        </div>
      </div>

      {/* ── Main content: table or chart ─────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: selected ? "1fr 300px" : "1fr", gap: 14, marginBottom: 24 }}>

        {view === "table" ? (
          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid " + T.border, borderRadius: 12, overflow: "hidden" }}>
            {/* Table header */}
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1fr 100px", gap: 0, padding: "10px 16px", background: "rgba(255,255,255,0.03)", borderBottom: "1px solid " + T.border }}>
              {["Community", "Transactions", "Value (AED)", "Avg PPSF", "Off-Plan", "YoY Growth", "Liquidity"].map((h, i) => (
                <div key={i} style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: 0.8 }}>{h}</div>
              ))}
            </div>
            {/* Table rows */}
            {filtered.map((row, i) => {
              const liq = getLiquidity(row.transactions);
              const isSelected = selected === row.community;
              return (
                <div key={i} onClick={() => setSelected(isSelected ? null : row.community)}
                  style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1fr 100px", gap: 0, padding: "12px 16px", borderBottom: i < filtered.length - 1 ? "1px solid " + T.border + "60" : "none", cursor: "pointer", background: isSelected ? "rgba(212,168,67,0.06)" : "transparent", transition: "background 0.15s" }}
                  onMouseEnter={e => !isSelected && (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}
                  onMouseLeave={e => !isSelected && (e.currentTarget.style.background = "transparent")}
                >
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: T.white, marginBottom: 2 }}>{row.community}</div>
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <span style={{ fontSize: 9, padding: "1px 6px", borderRadius: 8, background: (SECTOR_COLORS[row.sector] || T.textMuted) + "20", color: SECTOR_COLORS[row.sector] || T.textMuted }}>{row.sector}</span>
                      <span style={{ fontSize: 9, padding: "1px 6px", borderRadius: 8, background: "rgba(255,255,255,0.06)", color: T.textMuted }}>{row.type}</span>
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.gold }}>{(row.transactions || 0).toLocaleString()}</div>
                    <div style={{ height: 3, borderRadius: 2, background: T.border, marginTop: 4, width: "80%" }}>
                      <div style={{ height: "100%", width: Math.round(((row.transactions || 0) / maxTx) * 100) + "%", borderRadius: 2, background: T.gold, transition: "width 0.8s" }} />
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: "#63B3ED", fontWeight: 600 }}>AED {(row.value || 0).toFixed(1)}B</div>
                  <div style={{ fontSize: 12, color: T.textSecondary }}>{row.avgPpsf ? "AED " + row.avgPpsf.toLocaleString() : "—"}</div>
                  <div>
                    <div style={{ fontSize: 12, color: (row.offPlanPct || 0) >= 70 ? T.green : T.textSecondary, fontWeight: 600 }}>{row.offPlanPct || 0}%</div>
                    <div style={{ height: 3, borderRadius: 2, background: T.border, marginTop: 4, width: "80%" }}>
                      <div style={{ height: "100%", width: (row.offPlanPct || 0) + "%", borderRadius: 2, background: T.green }} />
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: (row.yoyGrowth || 0) >= 15 ? T.green : (row.yoyGrowth || 0) >= 8 ? T.gold : T.textMuted, fontWeight: 600 }}>{row.yoyGrowth ? "+" + row.yoyGrowth + "%" : "—"}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <div style={{ width: 7, height: 7, borderRadius: "50%", background: liq.color }} />
                    <span style={{ fontSize: 10, color: liq.color, fontWeight: 600 }}>{liq.label}</span>
                  </div>
                </div>
              );
            })}
            {filtered.length === 0 && (
              <div style={{ padding: "40px 16px", textAlign: "center", color: T.textMuted, fontSize: 12 }}>No communities match your filters</div>
            )}
          </div>
        ) : (
          /* Chart view */
          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid " + T.border, borderRadius: 12, padding: "20px" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.textSecondary, marginBottom: 16 }}>
              Top 12 Communities by {sortBy === "transactions" ? "Transaction Volume" : sortBy === "value" ? "Transaction Value" : sortBy === "ppsf" ? "Avg PPSF" : sortBy === "growth" ? "YoY Growth" : "Off-Plan Share"}
            </div>
            <ResponsiveContainer width="100%" height={320}>
              <ComposedChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="name" tick={{ fill: T.textMuted, fontSize: 10 }} angle={-35} textAnchor="end" interval={0} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: T.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<DLDTooltip />} cursor={{ fill: "rgba(212,168,67,0.05)" }} />
                <Bar dataKey={sortBy === "transactions" ? "transactions" : sortBy === "value" ? "value" : "ppsf"}
                  name={sortBy === "transactions" ? "Transactions" : sortBy === "value" ? "Value (AED B)" : "Avg PPSF"}
                  radius={[5, 5, 0, 0]} maxBarSize={50}
                >
                  {chartData.map((entry, i) => (
                    <Cell key={i} fill={SECTOR_COLORS[entry.sector] || T.gold} opacity={0.85} />
                  ))}
                </Bar>
              </ComposedChart>
            </ResponsiveContainer>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 14px", marginTop: 8 }}>
              {Object.entries(SECTOR_COLORS).map(([sector, color]) => (
                <div key={sector} style={{ display: "flex", alignItems: "center", gap: 5, cursor: "pointer", opacity: filterSector !== "All" && filterSector !== sector ? 0.3 : 1 }} onClick={() => setFilterSector(filterSector === sector ? "All" : sector)}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: color }} />
                  <span style={{ fontSize: 10, color: T.textMuted }}>{sector}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Selected community detail panel ────────────────── */}
        {selected && selectedData && (
          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid " + (selectedLiq?.color || T.border) + "40", borderRadius: 12, padding: "18px", animation: "fadeUp 0.2s ease-out" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
              <div>
                <div style={{ fontFamily: "'Fraunces',serif", fontSize: 16, fontWeight: 800, color: T.white, marginBottom: 4 }}>{selectedData.community}</div>
                <div style={{ fontSize: 10, color: SECTOR_COLORS[selectedData.sector] || T.textMuted }}>{selectedData.sector} · {selectedData.type}</div>
              </div>
              <button type="button" onClick={() => setSelected(null)} style={{ background: "none", border: "none", color: T.textMuted, cursor: "pointer", fontSize: 18 }}>×</button>
            </div>
            {/* Liquidity badge */}
            <div style={{ padding: "10px 12px", borderRadius: 8, background: (selectedLiq?.color || T.border) + "15", border: "1px solid " + (selectedLiq?.color || T.border) + "30", marginBottom: 14 }}>
              <div style={{ fontSize: 10, color: T.textMuted, marginBottom: 3 }}>LIQUIDITY</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: selectedLiq?.color, fontFamily: "'Fraunces',serif" }}>{selectedLiq?.label}</div>
              <div style={{ fontSize: 11, color: T.textSecondary }}>{selectedLiq?.desc}</div>
            </div>
            {/* Metrics */}
            {[
              { label: "Transactions (2025)", value: (selectedData.transactions || 0).toLocaleString(), color: T.gold },
              { label: "Total Value", value: "AED " + (selectedData.value || 0).toFixed(1) + "B", color: "#63B3ED" },
              { label: "Avg PPSF", value: "AED " + (selectedData.avgPpsf || 0).toLocaleString(), color: T.textSecondary },
              { label: "Off-Plan Share", value: (selectedData.offPlanPct || 0) + "%", color: selectedData.offPlanPct >= 70 ? T.green : T.textSecondary },
              { label: "YoY Price Growth", value: selectedData.yoyGrowth ? "+" + selectedData.yoyGrowth + "%" : "—", color: (selectedData.yoyGrowth || 0) >= 15 ? T.green : T.gold },
            ].map((m, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: i < 4 ? "1px solid " + T.border + "60" : "none" }}>
                <span style={{ fontSize: 11, color: T.textMuted }}>{m.label}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: m.color }}>{m.value}</span>
              </div>
            ))}
            {selectedData.note && (
              <div style={{ marginTop: 12, padding: "10px 12px", background: "rgba(255,255,255,0.03)", borderRadius: 8, fontSize: 11, color: T.textSecondary, lineHeight: 1.6 }}>
                <span style={{ color: T.gold, fontWeight: 700 }}>💡 </span>{selectedData.note}
              </div>
            )}
            <button type="button" onClick={() => handleTabChange?.("Neighbourhoods")} style={{ width: "100%", marginTop: 14, padding: "8px 0", background: "rgba(212,168,67,0.06)", border: "1px solid " + T.border, borderRadius: 8, color: T.gold, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>
              View Community Intel →
            </button>
          </div>
        )}
      </div>

      {/* ── Value vs Volume insight ───────────────────────────── */}
      <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid " + T.border, borderRadius: 12, padding: "18px 20px", marginBottom: 20 }}>
        <div style={{ fontFamily: "'Fraunces',serif", fontSize: 14, fontWeight: 700, color: T.white, marginBottom: 6 }}>Value vs Volume: Two Different Stories</div>
        <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 14 }}>High volume ≠ high value. Understanding this split is key to choosing the right investment strategy.</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.gold, marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.8 }}>Top 5 by Transaction Volume</div>
            {[...rawData].sort((a,b) => (b.transactions||0)-(a.transactions||0)).slice(0,5).map((d,i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: i<4?"1px solid "+T.border+"40":"none" }}>
                <span style={{ fontSize: 11, color: T.textSecondary }}>{d.community}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: T.gold }}>{(d.transactions||0).toLocaleString()} tx</span>
              </div>
            ))}
            <div style={{ fontSize: 10, color: T.textMuted, marginTop: 8 }}>High volume = easy entry/exit. Best for investors who may need to sell quickly.</div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#63B3ED", marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.8 }}>Top 5 by Transaction Value</div>
            {[...rawData].sort((a,b) => (b.value||0)-(a.value||0)).slice(0,5).map((d,i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: i<4?"1px solid "+T.border+"40":"none" }}>
                <span style={{ fontSize: 11, color: T.textSecondary }}>{d.community}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#63B3ED" }}>AED {(d.value||0).toFixed(1)}B</span>
              </div>
            ))}
            <div style={{ fontSize: 10, color: T.textMuted, marginTop: 8 }}>High value = luxury demand, institutional capital, premium pricing power.</div>
          </div>
        </div>
      </div>

      {/* ── Sources ──────────────────────────────────────────── */}
      <div style={{ paddingTop: 16, borderTop: "1px solid " + T.border, display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
        <span style={{ fontSize: 10, color: T.textMuted }}>Sources:</span>
        {[
          { label: "DLD H1 2025 Official", url: "https://mediaoffice.ae/en/news/2025/july/20-07/dubai-real-estate-transactions-exceed-aed431-billion-in-h1-2025" },
          { label: "DXB Analytics DLD Database", url: "https://www.dxbanalytics.com/blog/dubai-property-transaction-volume-2026" },
          { label: "Cavendish Maxwell Q1 2025", url: "https://cavendishmaxwell.com/insights/market-reports/residential/dubai-residential-market-performance-q1-2025" },
          { label: "Dubai Home Apartment Report 2026", url: "https://dubaihome.com/articles/dubai-apartment-market-2025" },
          { label: "Global Property Guide 2026", url: "https://www.globalpropertyguide.com/middle-east/united-arab-emirates/price-history" },
          { label: "DLD FY2025 Official", url: "https://mediaoffice.ae/en/news/2026/january/12-01/dubais-real-estate-market-records-new-historic-milestone" },
        ].map(s => (
          <a key={s.label} href={s.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
            <span style={{ fontSize: 10, color: T.textMuted, padding: "2px 8px", borderRadius: 10, border: "1px solid " + T.border, background: T.surfaceAlt, cursor: "pointer" }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = T.gold + "50")}
              onMouseLeave={e => (e.currentTarget.style.borderColor = T.border)}
            >{s.label}</span>
          </a>
        ))}
      </div>

    </div>
  );
}

export default DLDVolumesTab;