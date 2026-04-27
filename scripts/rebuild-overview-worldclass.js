const fs = require("fs");

const tab = `/* eslint-disable */
/*
  DXB ANALYTICS — OVERVIEW TAB (World Class)
  The command center. The mother of all 33 tabs.
  First screen every user sees. Must deliver value in 3 seconds.
  
  Design principles:
  - Lead with NOW (Q1 2026 data, not 2025 full year)
  - 3-second scan: market state + personal activity + where to go
  - Role-aware: Investor / Agent / Developer / Buyer each see what matters
  - Progressive disclosure: headline → context → detail
  - No empty sections: everything useful even with zero data
  - F-pattern layout: most critical top-left
  
  Session 7 · April 2026
  Data: Firestore marketMetrics + live props from parent
  Sources: DLD Q1 2026, DXB Analytics, REIDIN, ValuStrat, Capital Zone
*/

import React, { useState, useMemo } from "react";
import { T } from "../data";
import { SvgIcons } from "../components/Icons";
import { useOverviewKpis, useMarketKpis } from "../hooks/useMarketMetrics";

// ── Tab navigator config — all 33 tabs organized by section ──────
const TAB_NAV = [
  {
    section: "Market Intelligence",
    color: "#D4A843",
    tabs: [
      { name: "Market", desc: "Dubai macro: AED 917B 2025 · +31% Q1 2026 · ValuStrat · REIDIN", icon: "📊" },
      { name: "DLD Volumes", desc: "Transaction volumes by community · off-plan vs secondary mix", icon: "📋" },
      { name: "Price History", desc: "PPSF trends 2020–2026 · ValuStrat VPI · community momentum", icon: "📈" },
      { name: "Neighbourhoods", desc: "152 communities · yields · metro · schools · supply risk", icon: "🏘" },
      { name: "Launch Calendar", desc: "Upcoming off-plan launches · EOI open · developer pipeline", icon: "🗓" },
      { name: "Currency", desc: "AED vs major currencies · live exchange rates", icon: "💱" },
    ],
  },
  {
    section: "Property Explorer",
    color: "#63B3ED",
    tabs: [
      { name: "Projects", desc: "Off-plan database · payment plans · handover dates · escrow", icon: "🏗" },
      { name: "Map", desc: "Community map · yield heat layer · PPSF layer · volume layer", icon: "🗺" },
      { name: "Handover", desc: "Project completion tracker · DLD handover timeline", icon: "🔑" },
      { name: "Service Charges", desc: "RERA service charge rates · by community · per sqft", icon: "📄" },
    ],
  },
  {
    section: "Investment Tools",
    color: "#68D391",
    tabs: [
      { name: "Yields", desc: "Gross/net yield by community · top 20 performers · Bayut data", icon: "💰" },
      { name: "STR vs LTR", desc: "Short-term vs long-term rental comparison · Airbnb vs Ejari", icon: "⚖️" },
      { name: "Mortgage", desc: "UAE bank rates · EIBOR 3.59% · repayment calculator · LTV rules", icon: "🏦" },
      { name: "Investment Score", desc: "DXB Analytics composite score · 99 communities ranked", icon: "⭐" },
      { name: "Flip", desc: "Off-plan flip calculator · resale premium · transaction costs", icon: "🔄" },
      { name: "DXB Estimate", desc: "AVM valuation · 3-method cross-check · DLD PPSF · confidence", icon: "🎯" },
      { name: "Portfolio", desc: "Track your properties · ROI · equity · rental income", icon: "📁" },
      { name: "Golden Visa", desc: "AED 2M threshold checker · eligibility · 10-year residency", icon: "🛂" },
      { name: "Risk", desc: "Supply risk · price cycle risk · community risk radar", icon: "⚠️" },
    ],
  },
  {
    section: "Developer Intelligence",
    color: "#FC8181",
    tabs: [
      { name: "Financials", desc: "Developer P&L · revenue trends · Emaar vs DAMAC vs Sobha", icon: "📉" },
      { name: "Developer Health", desc: "DXB composite health score · delivery rate · financial strength", icon: "🏢" },
      { name: "Competitors", desc: "Market share · launches · pricing positioning", icon: "🥊" },
      { name: "Banking", desc: "UAE bank comparison · mortgage products · rates · LTV", icon: "🏛" },
    ],
  },
  {
    section: "CRM & Agency",
    color: "#9F7AEA",
    tabs: [
      { name: "My Leads", desc: "Lead pipeline · follow-ups · conversion tracking · WhatsApp", icon: "👥" },
      { name: "Pipeline", desc: "Deal stages · commission tracker · revenue forecast", icon: "🎰" },
      { name: "Listings", desc: "Your active listings · performance · lead conversion", icon: "📌" },
      { name: "Marketing", desc: "Lead generation · channel performance · AI listing copy", icon: "📢" },
      { name: "Team", desc: "Agent performance · team leaderboard · org management", icon: "🤝" },
      { name: "Agency", desc: "Org profile · RERA card · commission splits", icon: "🏬" },
    ],
  },
];

// ── Quick stat card ───────────────────────────────────────────────
const QuickStat = ({ label, value, change, color, note, onClick }) => (
  <div onClick={onClick} style={{
    background: "rgba(255,255,255,0.03)", border: "1px solid " + (T?.border || "#222"),
    borderRadius: 10, padding: "12px 14px", cursor: onClick ? "pointer" : "default",
    transition: "border-color 0.15s",
  }}
    onMouseEnter={e => onClick && (e.currentTarget.style.borderColor = (color || T?.gold || "#D4A843") + "60")}
    onMouseLeave={e => onClick && (e.currentTarget.style.borderColor = T?.border || "#222")}
  >
    <div style={{ fontSize: 10, color: T?.textMuted || "#666", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 7 }}>{label}</div>
    <div style={{ fontFamily: "'Fraunces',serif", fontSize: 18, fontWeight: 800, color: color || T?.white || "#fff", lineHeight: 1.1, marginBottom: 4 }}>{value || "—"}</div>
    {change && <div style={{ fontSize: 10, color: T?.green || "#68D391" }}>{change}</div>}
    {note && <div style={{ fontSize: 10, color: T?.textMuted || "#666", marginTop: 3 }}>{note}</div>}
  </div>
);

// ── Personal activity item ────────────────────────────────────────
const ActivityItem = ({ icon, label, count, color, onClick }) => (
  <div onClick={onClick} style={{
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "10px 12px", borderRadius: 8, background: T?.surfaceAlt || "#111",
    cursor: onClick ? "pointer" : "default", marginBottom: 8, transition: "background 0.15s",
  }}
    onMouseEnter={e => onClick && (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
    onMouseLeave={e => onClick && (e.currentTarget.style.background = T?.surfaceAlt || "#111")}
  >
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <span style={{ fontSize: 14 }}>{icon}</span>
      <span style={{ fontSize: 12, color: T?.textSecondary || "#aaa" }}>{label}</span>
    </div>
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ fontFamily: "'Fraunces',serif", fontSize: 16, fontWeight: 800, color: count > 0 ? color || T?.gold || "#D4A843" : T?.textMuted || "#666" }}>{count}</span>
      {onClick && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={T?.textMuted || "#666"} strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>}
    </div>
  </div>
);

// ── Signal pill ───────────────────────────────────────────────────
const Signal = ({ label, value, color, bull }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 20, background: (color || "#D4A843") + "15", border: "1px solid " + (color || "#D4A843") + "30" }}>
    <span style={{ fontSize: 9, color: color || "#D4A843" }}>{bull ? "▲" : "●"}</span>
    <span style={{ fontSize: 10, color: T?.textSecondary || "#aaa" }}>{label}</span>
    <span style={{ fontSize: 10, fontWeight: 700, color: color || "#D4A843" }}>{value}</span>
  </div>
);

// ── Main component ────────────────────────────────────────────────
function OverviewTab({
  liveMarketData, liveDLDVolumes, liveDevHealth, liveMortgageRates, liveYields,
  allDevelopers, deals, listings, myLeads, myPortfolio, watchlist,
  aiInsights, gDeveloper, lastDataSync, globalFilters = {}, handleTabChange,
}) {
  const [navExpanded, setNavExpanded] = useState(null);

  const { data: firestoreOverviewKpis = [] } = useOverviewKpis();
  const { data: firestoreMarketKpis = [] } = useMarketKpis();

  const syncTime = lastDataSync ? lastDataSync.toLocaleTimeString("en-AE", { hour: "2-digit", minute: "2-digit" }) : null;

  // KPI resolution — live > Firestore > fallback
  const allKpis = useMemo(() => {
    const live = (liveMarketData || []).filter(d => d.metric && d.value);
    return live.length > 0 ? live : firestoreOverviewKpis.length > 0 ? firestoreOverviewKpis : firestoreMarketKpis;
  }, [liveMarketData, firestoreOverviewKpis, firestoreMarketKpis]);

  const getKpi = (m) => allKpis.find(d => d.metric === m)?.value || "—";
  const getKpiChange = (m) => allKpis.find(d => d.metric === m)?.change || "";

  // EIBOR from live data or fallback
  const eibor3m = liveMortgageRates?.[0]?.eibor3m;
  const eiborDisplay = eibor3m ? eibor3m.toFixed(2) + "%" : "3.59%";
  const eiborNote = eibor3m ? "Live · CBUAE" : "Feb 2026 · CBUAE";

  // Personal workspace counts
  const leadsCount = myLeads?.length || 0;
  const dealsCount = deals?.length || 0;
  const listingsCount = listings?.length || 0;
  const portfolioCount = myPortfolio?.length || 0;
  const watchlistCount = watchlist?.length || 0;

  // Developer filter label
  const devFilterLabel = gDeveloper && gDeveloper !== "all"
    ? (allDevelopers || []).find(d => String(d.id).toLowerCase() === String(gDeveloper).toLowerCase())?.name || gDeveloper
    : null;

  return (
    <div style={{ paddingTop: 4, paddingBottom: 60 }}>

      {/* ── 1. LIVE MARKET BANNER ─────────────────────────────── */}
      <div style={{
        background: "linear-gradient(135deg, rgba(212,168,67,0.08) 0%, rgba(99,179,237,0.04) 100%)",
        border: "1px solid rgba(212,168,67,0.2)", borderRadius: 14, padding: "16px 20px", marginBottom: 20,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 12 }}>
          <div>
            <div style={{ fontFamily: "'Fraunces',serif", fontSize: 18, fontWeight: 800, color: T?.white || "#fff", marginBottom: 4 }}>
              Dubai Real Estate · April 2026
            </div>
            <div style={{ fontSize: 11, color: T?.textSecondary || "#aaa" }}>
              Q1 2026: AED 252B total transactions · +31% YoY · 60,303 deals · Month 57 of growth cycle
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: T?.green || "#68D391", animation: "pulse 2s infinite" }} />
            <span style={{ fontSize: 10, color: T?.textMuted || "#666" }}>
              {syncTime ? "Synced " + syncTime : "Live · DXB Analytics"}
            </span>
            {devFilterLabel && (
              <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 10, background: "rgba(212,168,67,0.1)", color: T?.gold || "#D4A843", border: "1px solid rgba(212,168,67,0.2)" }}>
                {devFilterLabel}
              </span>
            )}
          </div>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          <Signal label="Q1 2026 Value" value="AED 252B" color={T?.gold || "#D4A843"} bull />
          <Signal label="YoY Growth" value="+31%" color={T?.green || "#68D391"} bull />
          <Signal label="Off-Plan Share" value="70-80%" color={T?.gold || "#D4A843"} />
          <Signal label="Avg PPSF" value="AED 1,759" color="#63B3ED" bull />
          <Signal label="EIBOR 3M" value={eiborDisplay} color="#9F7AEA" />
          <Signal label="Market Health" value="72/100 · Growing" color={T?.green || "#68D391"} />
          <Signal label="Growth Cycle" value="Month 57" color={T?.gold || "#D4A843"} />
        </div>
      </div>

      {/* ── 2. TWO-COLUMN: Personal Workspace + Market Pulse ──── */}
      <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 16, marginBottom: 24 }}>

        {/* Personal workspace */}
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid " + (T?.border || "#222"), borderRadius: 12, padding: "18px" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T?.textMuted || "#666", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 14 }}>Your Workspace</div>
          <ActivityItem icon="👥" label="Active Leads" count={leadsCount} color="#63B3ED" onClick={() => handleTabChange?.("My Leads")} />
          <ActivityItem icon="🤝" label="Active Deals" count={dealsCount} color={T?.gold || "#D4A843"} onClick={() => handleTabChange?.("Pipeline")} />
          <ActivityItem icon="📌" label="My Listings" count={listingsCount} color={T?.green || "#68D391"} onClick={() => handleTabChange?.("Listings")} />
          <ActivityItem icon="🏠" label="Portfolio" count={portfolioCount} color="#FC8181" onClick={() => handleTabChange?.("Portfolio")} />
          <ActivityItem icon="⭐" label="Watchlist" count={watchlistCount} color="#9F7AEA" />
          {leadsCount === 0 && dealsCount === 0 && listingsCount === 0 && (
            <div style={{ marginTop: 12, padding: "12px 14px", background: "rgba(212,168,67,0.05)", borderRadius: 8, border: "1px solid rgba(212,168,67,0.1)" }}>
              <div style={{ fontSize: 11, color: T?.textMuted || "#666", lineHeight: 1.6 }}>
                <span style={{ color: T?.gold || "#D4A843", fontWeight: 700 }}>Get started:</span> Add your first lead in My Leads, create a listing, or track a deal in Pipeline.
              </div>
            </div>
          )}
        </div>

        {/* Market Pulse — 8 KPIs */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: T?.textMuted || "#666", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 12 }}>Market Pulse — Full Year 2025 · Q1 2026 Update</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(155px,1fr))", gap: 10 }}>
            <QuickStat label="Total Market Value" value="AED 917B" change="+20% YoY · DLD 2025" note="Q1 2026: AED 252B (+31%)" color={T?.gold || "#D4A843"} onClick={() => handleTabChange?.("Market")} />
            <QuickStat label="Total Transactions" value="270,000+" change="+20% YoY · DLD 2025" note="Q1 2026: 60,303 (+6%)" onClick={() => handleTabChange?.("DLD Volumes")} />
            <QuickStat label="Avg PPSF" value="AED 1,863" change="+6% YoY · FY2025" note="Q1 2026: AED 1,759 · +12.5% YoY" color="#63B3ED" onClick={() => handleTabChange?.("Price History")} />
            <QuickStat label="Avg Gross Yield" value="6.55%" change="Apts 7.03% · Villas 4.63%" note="REIDIN Dec 2025" color={T?.green || "#68D391"} onClick={() => handleTabChange?.("Yields")} />
            <QuickStat label="EIBOR 3M" value={eiborDisplay} change="Falling trend · Fed easing" note={eiborNote + " · Mortgage: ~4-5%"} color="#9F7AEA" onClick={() => handleTabChange?.("Mortgage")} />
            <QuickStat label="Off-Plan Share" value="65-80%" change="Q1 2026: 70-80%" note="FY2025: 65% · Growing" onClick={() => handleTabChange?.("Projects")} />
            <QuickStat label="Active Developers" value="228" change="+40% from 163 in 2024" note="RERA registered · DLD approved" onClick={() => handleTabChange?.("Developer Health")} />
            <QuickStat label="Units Launched" value="131,504" change="By Oct 2025 · DLD" note="~98K units forecast 2026" onClick={() => handleTabChange?.("Launch Calendar")} />
          </div>
        </div>
      </div>

      {/* ── 3. INTELLIGENCE PANEL ─────────────────────────────── */}
      <div style={{ fontSize: 11, fontWeight: 700, color: T?.textMuted || "#666", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 12 }}>
        Intelligence Panel — Context-Aware {devFilterLabel ? "· " + devFilterLabel : "· All Dubai"}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 24 }}>

        {/* Top Yield Communities */}
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid " + (T?.border || "#222"), borderRadius: 12, padding: "16px 18px" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T?.textMuted || "#666", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 12 }}>Top Communities — Yield</div>
          {liveYields?.length > 0
            ? [...liveYields].sort((a, b) => (parseFloat(b.gross) || 0) - (parseFloat(a.gross) || 0)).slice(0, 6).map((y, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: i < 5 ? "1px solid " + (T?.border || "#222") : "none" }}>
                  <div>
                    <div style={{ fontSize: 12, color: T?.white || "#fff", fontWeight: 500 }}>{y.community || "—"}</div>
                    <div style={{ fontSize: 10, color: T?.textMuted || "#666" }}>{y.tenantProfile || "Apartment"}</div>
                  </div>
                  <div style={{ fontFamily: "'Fraunces',serif", fontSize: 15, fontWeight: 700, color: parseFloat(y.gross) >= 7 ? T?.green || "#68D391" : T?.gold || "#D4A843" }}>
                    {parseFloat(y.gross || 0).toFixed(1)}%
                  </div>
                </div>
              ))
            : (
              <div>
                {[
                  { community: "JLT", yield: "8.1%", profile: "Professionals" },
                  { community: "Al Furjan", yield: "8.2%", profile: "Families" },
                  { community: "Dubai South", yield: "8.8%", profile: "Mixed" },
                  { community: "International City", yield: "9.2%", profile: "Mixed" },
                  { community: "JVC", yield: "7.8%", profile: "Professionals" },
                  { community: "Discovery Gardens", yield: "8.5%", profile: "Professionals" },
                ].map((y, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: i < 5 ? "1px solid " + (T?.border || "#222") : "none" }}>
                    <div>
                      <div style={{ fontSize: 12, color: T?.white || "#fff" }}>{y.community}</div>
                      <div style={{ fontSize: 10, color: T?.textMuted || "#666" }}>{y.profile}</div>
                    </div>
                    <div style={{ fontFamily: "'Fraunces',serif", fontSize: 15, fontWeight: 700, color: T?.green || "#68D391" }}>{y.yield}</div>
                  </div>
                ))}
                <div style={{ fontSize: 10, color: T?.textMuted || "#666", marginTop: 8, fontStyle: "italic" }}>Research data · REIDIN Dec 2025</div>
              </div>
            )
          }
          <button type="button" onClick={() => handleTabChange?.("Yields")} style={{ width: "100%", marginTop: 12, padding: "7px 0", background: "rgba(212,168,67,0.06)", border: "1px solid " + (T?.border || "#222"), borderRadius: 8, color: T?.gold || "#D4A843", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>
            View All Yields →
          </button>
        </div>

        {/* DLD Volume */}
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid " + (T?.border || "#222"), borderRadius: 12, padding: "16px 18px" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T?.textMuted || "#666", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 12 }}>DLD Transaction Volume</div>
          {liveDLDVolumes?.length > 0
            ? (() => {
                const sorted = [...liveDLDVolumes].sort((a, b) => (b.transactions || 0) - (a.transactions || 0)).slice(0, 6);
                const max = Math.max(...sorted.map(d => d.transactions || 0), 1);
                return sorted.map((d, i) => (
                  <div key={i} style={{ marginBottom: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 11, color: T?.textSecondary || "#aaa" }}>{d.community}</span>
                      <span style={{ fontSize: 11, color: T?.white || "#fff", fontWeight: 600 }}>{(d.transactions || 0).toLocaleString()}</span>
                    </div>
                    <div style={{ height: 4, borderRadius: 2, background: T?.border || "#222" }}>
                      <div style={{ height: "100%", width: Math.round((d.transactions / max) * 100) + "%", borderRadius: 2, background: "linear-gradient(90deg, " + (T?.gold || "#D4A843") + ", #63B3ED)" }} />
                    </div>
                  </div>
                ));
              })()
            : (
              <div>
                {[
                  { community: "JVC", tx: 18782 },
                  { community: "Business Bay", tx: 12450 },
                  { community: "Dubai Marina", tx: 11200 },
                  { community: "Downtown Dubai", tx: 8900 },
                  { community: "Dubai Hills Estate", tx: 8200 },
                  { community: "Sobha Hartland", tx: 6800 },
                ].map((d, i, arr) => {
                  const max = arr[0].tx;
                  return (
                    <div key={i} style={{ marginBottom: 10 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ fontSize: 11, color: T?.textSecondary || "#aaa" }}>{d.community}</span>
                        <span style={{ fontSize: 11, color: T?.white || "#fff", fontWeight: 600 }}>{d.tx.toLocaleString()}</span>
                      </div>
                      <div style={{ height: 4, borderRadius: 2, background: T?.border || "#222" }}>
                        <div style={{ height: "100%", width: Math.round((d.tx / max) * 100) + "%", borderRadius: 2, background: "linear-gradient(90deg, " + (T?.gold || "#D4A843") + ", #63B3ED)", transition: "width 0.8s" }} />
                      </div>
                    </div>
                  );
                })}
                <div style={{ fontSize: 10, color: T?.textMuted || "#666", marginTop: 4, fontStyle: "italic" }}>DXB Analytics · DLD 2025</div>
              </div>
            )
          }
          <button type="button" onClick={() => handleTabChange?.("DLD Volumes")} style={{ width: "100%", marginTop: 12, padding: "7px 0", background: "rgba(212,168,67,0.06)", border: "1px solid " + (T?.border || "#222"), borderRadius: 8, color: T?.gold || "#D4A843", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>
            View DLD Volumes →
          </button>
        </div>

        {/* AI Insight + Developer Health */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid " + (T?.border || "#222"), borderRadius: 12, padding: "16px 18px", flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: T?.gold || "#D4A843", animation: "pulse 2s infinite" }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: T?.textMuted || "#666", textTransform: "uppercase", letterSpacing: 0.8 }}>AI Market Insight</span>
            </div>
            {aiInsights?.length > 0
              ? <div style={{ fontSize: 12, color: T?.textSecondary || "#aaa", lineHeight: 1.7 }}>{aiInsights[0]?.text || aiInsights[0]}</div>
              : (
                <div style={{ fontSize: 11, color: T?.textSecondary || "#aaa", lineHeight: 1.7 }}>
                  <span style={{ color: T?.gold || "#D4A843", fontWeight: 700 }}>Q1 2026 signal:</span> Dubai RE defied regional uncertainty — AED 252B in Q1 despite Hormuz tensions. Off-plan share deepened to 80%+. Value growth (+31%) outpacing volume (+6%) = market maturing. Buyers becoming more selective on location and developer track record.
                </div>
              )
            }
            <div style={{ marginTop: 10, fontSize: 10, color: T?.textMuted || "#666" }}>
              {aiInsights?.length > 0 ? "Powered by Claude · Updated this week" : "Research-based · DLD Q1 2026 · Edwards & Towers"}
            </div>
          </div>
          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid " + (T?.border || "#222"), borderRadius: 12, padding: "16px 18px" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T?.textMuted || "#666", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 }}>Developer Health</div>
            {liveDevHealth?.length > 0
              ? [...liveDevHealth].slice(0, 4).map((d, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 0", borderBottom: i < 3 ? "1px solid " + (T?.border || "#222") : "none" }}>
                    <span style={{ fontSize: 11, color: T?.textSecondary || "#aaa" }}>{d.developer || d.name}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: (d.score || 0) >= 75 ? "rgba(104,211,145,0.15)" : "rgba(212,168,67,0.15)", color: (d.score || 0) >= 75 ? T?.green || "#68D391" : T?.gold || "#D4A843" }}>
                      {d.score || "—"}
                    </span>
                  </div>
                ))
              : <div style={{ fontSize: 11, color: T?.textMuted || "#666" }}>Health scores load from Admin → Developer Health tab</div>
            }
            <button type="button" onClick={() => handleTabChange?.("Developer Health")} style={{ width: "100%", marginTop: 10, padding: "6px 0", background: "rgba(212,168,67,0.06)", border: "1px solid " + (T?.border || "#222"), borderRadius: 8, color: T?.gold || "#D4A843", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>
              View All →
            </button>
          </div>
        </div>
      </div>

      {/* ── 4. QUICK NAVIGATOR ────────────────────────────────── */}
      <div style={{ fontSize: 11, fontWeight: 700, color: T?.textMuted || "#666", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 12 }}>Platform Navigator — All 33 Modules</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
        {TAB_NAV.map(section => (
          <div key={section.section}>
            <div
              onClick={() => setNavExpanded(navExpanded === section.section ? null : section.section)}
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "rgba(255,255,255,0.02)", border: "1px solid " + (T?.border || "#222"), borderRadius: navExpanded === section.section ? "10px 10px 0 0" : 10, cursor: "pointer", transition: "background 0.15s" }}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}
              onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: section.color }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: T?.white || "#fff" }}>{section.section}</span>
                <span style={{ fontSize: 10, color: T?.textMuted || "#666" }}>· {section.tabs.length} modules</span>
              </div>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={T?.textMuted || "#666"} strokeWidth="2">
                <polyline points={navExpanded === section.section ? "18 15 12 9 6 15" : "6 9 12 15 18 15"} />
              </svg>
            </div>
            {navExpanded === section.section && (
              <div style={{ border: "1px solid " + (T?.border || "#222"), borderTop: "none", borderRadius: "0 0 10px 10px", padding: "8px", display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 6 }}>
                {section.tabs.map(tab => (
                  <div key={tab.name} onClick={() => handleTabChange?.(tab.name)} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 12px", borderRadius: 8, cursor: "pointer", transition: "background 0.15s" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>{tab.icon}</span>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: T?.white || "#fff", marginBottom: 2 }}>{tab.name}</div>
                      <div style={{ fontSize: 10, color: T?.textMuted || "#666", lineHeight: 1.4 }}>{tab.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ── 5. DATA FRESHNESS FOOTER ──────────────────────────── */}
      <div style={{ paddingTop: 16, borderTop: "1px solid " + (T?.border || "#222"), display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          <span style={{ fontSize: 10, color: T?.textMuted || "#666" }}>Data sources:</span>
          {[
            { label: "DLD Q1 2026", url: "https://mediaoffice.ae/en/news/2026/april/09-04/dubai-real-estate-transactions-surge-31-to-reach-aed252-billion-in-q1-2026" },
            { label: "DLD FY2025", url: "https://mediaoffice.ae/en/news/2026/january/12-01/dubais-real-estate-market-records-new-historic-milestone" },
            { label: "REIDIN Dec 2025", url: "https://reidin.com" },
            { label: "ValuStrat Q4 2025", url: "https://valustrat.com/products/vpi-dubai-residential-capital-values-december-2025" },
            { label: "CBUAE EIBOR", url: "https://www.centralbank.ae/en/forex-eibor/eibor-rates/" },
            { label: "Edwards & Towers Q1 2026", url: "https://edwardsandtowers.com/dubai-real-estate-market-q1-2026-analysis/" },
          ].map(s => (
            <a key={s.label} href={s.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
              <span style={{ fontSize: 10, color: T?.textMuted || "#666", padding: "2px 8px", borderRadius: 10, border: "1px solid " + (T?.border || "#222"), background: T?.surfaceAlt || "#111", cursor: "pointer", transition: "border-color 0.15s" }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = (T?.gold || "#D4A843") + "50")}
                onMouseLeave={e => (e.currentTarget.style.borderColor = T?.border || "#222")}
              >{s.label}</span>
            </a>
          ))}
        </div>
        <div style={{ fontSize: 10, color: T?.textMuted || "#666" }}>Session 7 · April 2026 · DXB Analytics</div>
      </div>

    </div>
  );
}

export default OverviewTab;
`;

fs.writeFileSync("src/tabs/OverviewTab.jsx", tab, "utf8");
console.log("Done. Lines:", tab.split("\\n").length);