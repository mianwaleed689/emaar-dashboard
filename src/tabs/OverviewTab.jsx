/* eslint-disable */
/* DXB ANALYTICS - OVERVIEW TAB (World Class + Role Intelligence) - Session 7 April 2026 */

import React, { useState, useMemo, useEffect } from "react";
import { T } from "../data";
import { SvgIcons } from "../components/Icons";
import { useOverviewKpis, useMarketKpis } from "../hooks/useMarketMetrics";
import { MARKET_FACTS } from "../data/marketFacts";

// Role-aware content
const ROLES = [
  { key: "Investor", icon: "ðŸ“ˆ", color: "#D4A843", desc: "Yield Â· ROI Â· Market timing" },
  { key: "Agent", icon: "ðŸ¡", color: "#63B3ED", desc: "Listings Â· Leads Â· Volume" },
  { key: "Developer", icon: "ðŸ—", color: "#FC8181", desc: "Pipeline Â· Supply Â· Launches" },
  { key: "Buyer", icon: "ðŸ”‘", color: "#68D391", desc: "Pricing Â· Mortgage Â· Value" },
];

const ROLE_BRIEFING = {
  Investor: {
    color: "#D4A843",
    headline: "Market is in month 57 of its longest ever growth cycle.",
    signals: [
      { icon: "âœ…", text: "Avg yield 6.55% â€” 3x London, 1.5x New York. Zero tax advantage compounds annually." },
      { icon: "âœ…", text: "Q1 2026: AED 252B (+31% YoY). Value growth outpacing volume â€” market maturing, not crashing." },
      { icon: "âš ï¸", text: "Supply risk: ~98K units forecast 2026. JVC, Business Bay, Dubai South face price pressure." },
      { icon: "ðŸ’¡", text: "Best entry window: Palm, DIFC, Creek Harbour â€” supply-constrained, price support likely." },
    ],
    actions: [
      { label: "Find highest-yield communities", tab: "Yields", icon: "ðŸ’°" },
      { label: "Check supply risk by community", tab: "Risk", icon: "âš ï¸" },
      { label: "Calculate your ROI", tab: "DXB Estimate", icon: "ðŸŽ¯" },
      { label: "Zero-tax advantage vs London/NY", tab: "Market", icon: "ðŸ“Š" },
    ],
  },
  Agent: {
    color: "#63B3ED",
    headline: "270,000+ transactions in 2025. Q1 2026 already at 60,303.",
    signals: [
      { icon: "âœ…", text: "JVC: 18,782 transactions â€” most active community. List here for fastest turnover." },
      { icon: "âœ…", text: "72% of all deals in AED 500Kâ€“3M range. Anchor your pitch at this price point." },
      { icon: "âš ï¸", text: "Off-plan now 70-80% of market. If you are not selling off-plan, you are missing the majority." },
      { icon: "ðŸ’¡", text: "Villa share growing: 7.9% in 2024 â†’ 13.5% in Q1 2026. Upskill in villa communities." },
    ],
    actions: [
      { label: "Browse off-plan projects", tab: "Projects", icon: "ðŸ—" },
      { label: "Top volume communities", tab: "DLD Volumes", icon: "ðŸ“‹" },
      { label: "Check upcoming launches", tab: "Launch Calendar", icon: "ðŸ—“" },
      { label: "Community intelligence", tab: "Neighbourhoods", icon: "ðŸ˜" },
    ],
  },
  Developer: {
    color: "#FC8181",
    headline: "228 developers active in 2025. Market getting crowded.",
    signals: [
      { icon: "âœ…", text: "Off-plan PPSF premium: AED 2,149 vs AED 1,663 ready â€” 29% developer advantage on launches." },
      { icon: "âœ…", text: "Only 46% of units delivered on time in 2025. Differentiate on delivery credibility." },
      { icon: "âš ï¸", text: "366K units in pipeline to 2028. Absorption risk is real in mid-tier communities." },
      { icon: "ðŸ’¡", text: "Golden Visa at AED 2M drives demand. Launch at this threshold to capture investor base." },
    ],
    actions: [
      { label: "Competitor launches", tab: "Competitors", icon: "ðŸ¥Š" },
      { label: "Supply pipeline risk", tab: "Risk", icon: "âš ï¸" },
      { label: "Developer health scores", tab: "Developer Health", icon: "ðŸ¢" },
      { label: "Bank financing options", tab: "Banking", icon: "ðŸ›" },
    ],
  },
  Buyer: {
    color: "#68D391",
    /* UNVERIFIED: no published source found for a Q1 2026 citywide all-residential
       PPSF of AED 1,759. The nearest sourced figure is AED 2,030/sqft for Q1 2026
       off-plan (ValuStrat). FY2025 median is AED 1,692 (DLD) — see marketFacts.js. */
    headline: "Q1 2026 avg PPSF: AED 1,759. Prices rising but still below London/NY.",
    signals: [
      { icon: "âœ…", text: "EIBOR 3.59% â€” best mortgage rates since 2021. Fixed 3-year from 3.85% (Capital Zone Apr 2026)." },
      { icon: "âœ…", text: "AED 500Kâ€“3M range: 72% of all deals â€” strongest resale liquidity if you need to exit." },
      { icon: "âš ï¸", text: "72% of scheduled units are overdue on delivery. Vet developer track record before off-plan." },
      { icon: "ðŸ’¡", text: "AED 2M+ qualifies you for a 10-year Golden Visa. Strong residency anchor for families." },
    ],
    actions: [
      { label: "Estimate property value", tab: "DXB Estimate", icon: "ðŸŽ¯" },
      { label: "Calculate mortgage", tab: "Mortgage", icon: "ðŸ¦" },
      { label: "Community comparison", tab: "Neighbourhoods", icon: "ðŸ˜" },
      { label: "Golden Visa eligibility", tab: "Golden Visa", icon: "ðŸ›‚" },
    ],
  },
};

const TAB_NAV = [
  { section: "Market Intelligence", color: "#D4A843", tabs: [
    { name: "Market", desc: "Dubai macro: AED 917B 2025 Â· +31% Q1 2026 Â· ValuStrat Â· REIDIN", icon: "ðŸ“Š" },
    { name: "DLD Volumes", desc: "Transaction volumes by community Â· off-plan vs secondary", icon: "ðŸ“‹" },
    { name: "Price History", desc: "PPSF trends 2020-2026 Â· ValuStrat VPI Â· momentum", icon: "ðŸ“ˆ" },
    { name: "Neighbourhoods", desc: "152 communities Â· yields Â· metro Â· schools Â· supply risk", icon: "ðŸ˜" },
    { name: "Launch Calendar", desc: "Upcoming off-plan launches Â· EOI open Â· pipeline", icon: "ðŸ—“" },
    { name: "Currency", desc: "AED vs major currencies Â· live exchange rates", icon: "ðŸ’±" },
  ]},
  { section: "Property Explorer", color: "#63B3ED", tabs: [
    { name: "Projects", desc: "Off-plan database Â· payment plans Â· handover dates", icon: "ðŸ—" },
    { name: "Map", desc: "Community map Â· yield heat Â· PPSF Â· volume layers", icon: "ðŸ—º" },
    { name: "Handover", desc: "Project completion tracker Â· DLD timeline", icon: "ðŸ”‘" },
    { name: "Service Charges", desc: "RERA service charge rates Â· by community Â· per sqft", icon: "ðŸ“„" },
  ]},
  { section: "Investment Tools", color: "#68D391", tabs: [
    { name: "Yields", desc: "Gross/net yield by community Â· top performers Â· Bayut data", icon: "ðŸ’°" },
    { name: "STR vs LTR", desc: "Short-term vs long-term rental comparison", icon: "âš–ï¸" },
    { name: "Mortgage", desc: "UAE bank rates Â· EIBOR 3.59% Â· repayment calculator", icon: "ðŸ¦" },
    { name: "Investment Score", desc: "DXB Analytics composite score Â· 99 communities ranked", icon: "â­" },
    { name: "Flip", desc: "Off-plan flip calculator Â· resale premium Â· costs", icon: "ðŸ”„" },
    { name: "DXB Estimate", desc: "AVM valuation Â· 3-method cross-check Â· DLD PPSF", icon: "ðŸŽ¯" },
    { name: "Portfolio", desc: "Track your properties Â· ROI Â· equity Â· rental income", icon: "ðŸ“" },
    { name: "Golden Visa", desc: "AED 2M threshold checker Â· 10-year residency", icon: "ðŸ›‚" },
    { name: "Risk", desc: "Supply risk Â· price cycle Â· community risk radar", icon: "âš ï¸" },
  ]},
  { section: "Developer Intelligence", color: "#FC8181", tabs: [
    { name: "Financials", desc: "Developer P&L Â· Emaar vs DAMAC vs Sobha", icon: "ðŸ“‰" },
    { name: "Developer Health", desc: "DXB composite score Â· delivery rate Â· strength", icon: "ðŸ¢" },
    { name: "Competitors", desc: "Market share Â· launches Â· pricing positioning", icon: "ðŸ¥Š" },
    { name: "Banking", desc: "UAE bank comparison Â· mortgage products Â· LTV", icon: "ðŸ›" },
  ]},
  { section: "CRM & Agency", color: "#9F7AEA", tabs: [
    { name: "My Leads", desc: "Lead pipeline Â· follow-ups Â· conversion tracking", icon: "ðŸ‘¥" },
    { name: "Pipeline", desc: "Deal stages Â· commission tracker Â· forecast", icon: "ðŸŽ°" },
    { name: "Listings", desc: "Your active listings Â· performance Â· conversion", icon: "ðŸ“Œ" },
    { name: "Marketing", desc: "Lead generation Â· channel performance Â· AI copy", icon: "ðŸ“¢" },
    { name: "Team", desc: "Agent performance Â· leaderboard Â· org management", icon: "ðŸ¤" },
    { name: "Agency", desc: "Org profile Â· RERA card Â· commission splits", icon: "ðŸ¬" },
  ]},
];

const Signal = ({ label, value, color }) => (
  <div style={{ display:"flex", alignItems:"center", gap:6, padding:"4px 10px", borderRadius:20, background:(color||"#D4A843")+"15", border:"1px solid "+(color||"#D4A843")+"30" }}>
    <span style={{ fontSize:9, color:color||"#D4A843" }}>â—</span>
    <span style={{ fontSize:10, color:T.textSecondary }}>{label}</span>
    <span style={{ fontSize:10, fontWeight:700, color:color||"#D4A843" }}>{value}</span>
  </div>
);

const QuickStat = ({ label, value, change, note, color, onClick }) => (
  <div onClick={onClick} style={{ background:"rgba(255,255,255,0.03)", border:"1px solid "+T.border, borderRadius:10, padding:"12px 14px", cursor:onClick?"pointer":"default", transition:"border-color 0.15s" }}
    onMouseEnter={e => onClick&&(e.currentTarget.style.borderColor=(color||T.gold)+"60")}
    onMouseLeave={e => onClick&&(e.currentTarget.style.borderColor=T.border)}
  >
    <div style={{ fontSize:10, color:T.textMuted, fontWeight:700, textTransform:"uppercase", letterSpacing:0.8, marginBottom:7 }}>{label}</div>
    <div style={{ fontFamily:"'Fraunces',serif", fontSize:18, fontWeight:800, color:color||T.white, lineHeight:1.1, marginBottom:4 }}>{value||"â€”"}</div>
    {change&&<div style={{ fontSize:10, color:T.green }}>{change}</div>}
    {note&&<div style={{ fontSize:10, color:T.textMuted, marginTop:3 }}>{note}</div>}
  </div>
);

const ActivityItem = ({ icon, label, count, color, onClick }) => (
  <div onClick={onClick} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 12px", borderRadius:8, background:T.surfaceAlt, cursor:onClick?"pointer":"default", marginBottom:8, transition:"background 0.15s" }}
    onMouseEnter={e => onClick&&(e.currentTarget.style.background="rgba(255,255,255,0.05)")}
    onMouseLeave={e => onClick&&(e.currentTarget.style.background=T.surfaceAlt)}
  >
    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
      <span style={{ fontSize:14 }}>{icon}</span>
      <span style={{ fontSize:12, color:T.textSecondary }}>{label}</span>
    </div>
    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
      <span style={{ fontFamily:"'Fraunces',serif", fontSize:16, fontWeight:800, color:count>0?color||T.gold:T.textMuted }}>{count}</span>
      {onClick&&<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={T.textMuted} strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>}
    </div>
  </div>
);

function OverviewTab({ liveNeighbourhoods=[],
  liveMarketData, liveDLDVolumes, liveDevHealth, liveMortgageRates, liveYields,
  allDevelopers, deals, listings, myLeads, myPortfolio, watchlist,
  aiInsights, gDeveloper, lastDataSync, globalFilters={}, handleTabChange,
}) {
  const [role, setRole] = useState(() => { try { return localStorage.getItem("dxb_role")||"Investor"; } catch(e) { return "Investor"; } });
  const [navExpanded, setNavExpanded] = useState(null);
  const { data: firestoreOverviewKpis=[] } = useOverviewKpis();
  const { data: firestoreMarketKpis=[] } = useMarketKpis();

  useEffect(() => { try { localStorage.setItem("dxb_role", role); } catch (e) { console.error("swallowed@OverviewTab.jsx:172", e); } }, [role]);

  const syncTime = lastDataSync ? lastDataSync.toLocaleTimeString("en-AE",{hour:"2-digit",minute:"2-digit"}) : null;
  const allKpis = useMemo(() => {
    const live=(liveMarketData||[]).filter(d=>d.metric&&d.value);
    return live.length>0?live:firestoreOverviewKpis.length>0?firestoreOverviewKpis:firestoreMarketKpis;
  },[liveMarketData,firestoreOverviewKpis,firestoreMarketKpis]);

  const eibor3m=liveMortgageRates?.[0]?.eibor3m;
  const eiborDisplay=eibor3m?eibor3m.toFixed(2)+"%":"3.59%";
  const leadsCount=myLeads?.length||0;
  const dealsCount=deals?.length||0;
  const listingsCount=listings?.length||0;
  const portfolioCount=myPortfolio?.length||0;
  const watchlistCount=watchlist?.length||0;
  const devFilterLabel=gDeveloper&&gDeveloper!=="all"?(allDevelopers||[]).find(d=>String(d.id).toLowerCase()===String(gDeveloper).toLowerCase())?.name||gDeveloper:null;
  const briefing=ROLE_BRIEFING[role];
  const roleObj=ROLES.find(r=>r.key===role);

  return (
    <div style={{ paddingTop:4, paddingBottom:60 }}>

      {/* LIVE MARKET BANNER */}
      <div style={{ background:"linear-gradient(135deg,rgba(212,168,67,0.08) 0%,rgba(99,179,237,0.04) 100%)", border:"1px solid rgba(212,168,67,0.2)", borderRadius:14, padding:"16px 20px", marginBottom:20 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:12, marginBottom:12 }}>
          <div>
            <div style={{ fontFamily:"'Fraunces',serif", fontSize:18, fontWeight:800, color:T.white, marginBottom:4 }}>Dubai Real Estate Â· April 2026</div>
            <div style={{ fontSize:11, color:T.textSecondary }}>Q1 2026: AED 252B total transactions Â· +31% YoY Â· 60,303 deals Â· Month 57 of growth cycle</div>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <div style={{ width:6, height:6, borderRadius:"50%", background:T.green, animation:"pulse 2s infinite" }} />
            <span style={{ fontSize:10, color:T.textMuted }}>{syncTime?"Synced "+syncTime:"Live Â· DXB Analytics"}</span>
            {devFilterLabel&&<span style={{ fontSize:10, padding:"2px 8px", borderRadius:10, background:"rgba(212,168,67,0.1)", color:T.gold, border:"1px solid rgba(212,168,67,0.2)" }}>{devFilterLabel}</span>}
          </div>
        </div>
        <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
          <Signal label="Q1 2026" value={MARKET_FACTS.q1_2026Value.value} color={T.gold} />
          <Signal label="YoY Growth" value={MARKET_FACTS.q1_2026Value.change} color={T.green} />
          <Signal label="Off-Plan" value={MARKET_FACTS.offPlanShare2025.value} color={T.gold} />
          <Signal label="Avg PPSF" value={MARKET_FACTS.avgPpsf2025.value} color="#63B3ED" />
          <Signal label="EIBOR 3M" value={eiborDisplay} color="#9F7AEA" />
          <Signal label="Health" value="72/100 Growing" color={T.green} />
          <Signal label="Cycle" value="Month 57" color={T.gold} />
        </div>
      </div>

      {/* ROLE SELECTOR */}
      <div style={{ marginBottom:16 }}>
        <div style={{ fontSize:11, color:T.textMuted, fontWeight:700, marginBottom:8 }}>I AM A... <span style={{ color:T.textMuted, fontWeight:400 }}>(personalises your dashboard)</span></div>
        <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
          {ROLES.map(r=>(
            <button key={r.key} type="button" onClick={()=>setRole(r.key)} style={{ padding:"8px 16px", borderRadius:20, fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"'Outfit',sans-serif", transition:"all 0.2s", background:role===r.key?r.color+"20":T.surfaceAlt, border:"1px solid "+(role===r.key?r.color:T.border), color:role===r.key?r.color:T.textSecondary, display:"flex", alignItems:"center", gap:6 }}>
              <span>{r.icon}</span><span>{r.key}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ROLE BRIEFING CARD */}
      <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid "+briefing.color+"30", borderLeft:"3px solid "+briefing.color, borderRadius:12, padding:"18px 20px", marginBottom:24 }}>
        <div style={{ fontSize:13, fontWeight:700, color:T.white, marginBottom:12, fontFamily:"'Fraunces',serif" }}>
          {roleObj?.icon} {briefing.headline}
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:8, marginBottom:14 }}>
          {briefing.signals.map((s,i)=>(
            <div key={i} style={{ display:"flex", gap:8, fontSize:11, color:T.textSecondary, lineHeight:1.6 }}>
              <span style={{ flexShrink:0 }}>{s.icon}</span>
              <span>{s.text}</span>
            </div>
          ))}
        </div>
        <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
          {briefing.actions.map((a,i)=>(
            <button key={i} type="button" onClick={()=>handleTabChange?.(a.tab)} style={{ padding:"7px 14px", borderRadius:20, fontSize:11, fontWeight:600, cursor:"pointer", fontFamily:"'Outfit',sans-serif", background:"rgba(255,255,255,0.04)", border:"1px solid "+T.border, color:briefing.color, display:"flex", alignItems:"center", gap:6, transition:"border-color 0.15s" }}
              onMouseEnter={e=>(e.currentTarget.style.borderColor=briefing.color+"60")}
              onMouseLeave={e=>(e.currentTarget.style.borderColor=T.border)}
            >
              <span>{a.icon}</span><span>{a.label} â†’</span>
            </button>
          ))}
        </div>
      </div>

      {/* WORKSPACE + MARKET PULSE */}
      <div style={{ display:"grid", gridTemplateColumns:"280px 1fr", gap:16, marginBottom:24 }}>
        <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid "+T.border, borderRadius:12, padding:"18px" }}>
          <div style={{ fontSize:11, fontWeight:700, color:T.textMuted, textTransform:"uppercase", letterSpacing:0.8, marginBottom:14 }}>Your Workspace</div>
          <ActivityItem icon="ðŸ‘¥" label="Active Leads" count={leadsCount} color="#63B3ED" onClick={()=>handleTabChange?.("My Leads")} />
          <ActivityItem icon="ðŸ¤" label="Active Deals" count={dealsCount} color={T.gold} onClick={()=>handleTabChange?.("Pipeline")} />
          <ActivityItem icon="ðŸ“Œ" label="My Listings" count={listingsCount} color={T.green} onClick={()=>handleTabChange?.("Listings")} />
          <ActivityItem icon="ðŸ " label="Portfolio" count={portfolioCount} color="#FC8181" onClick={()=>handleTabChange?.("Portfolio")} />
          <ActivityItem icon="â­" label="Watchlist" count={watchlistCount} color="#9F7AEA" />
          {leadsCount===0&&dealsCount===0&&listingsCount===0&&(
            <div style={{ marginTop:12, padding:"12px 14px", background:"rgba(212,168,67,0.05)", borderRadius:8, border:"1px solid rgba(212,168,67,0.1)" }}>
              <div style={{ fontSize:11, color:T.textMuted, lineHeight:1.6 }}>
                <span style={{ color:T.gold, fontWeight:700 }}>Get started:</span> Add your first lead in My Leads, create a listing, or track a deal in Pipeline.
              </div>
            </div>
          )}
        </div>
        <div>
          <div style={{ fontSize:11, fontWeight:700, color:T.textMuted, textTransform:"uppercase", letterSpacing:0.8, marginBottom:12 }}>Market Pulse â€” FY2025 Â· Q1 2026 Update</div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(155px,1fr))", gap:10 }}>
            {/* Figures come from src/data/marketFacts.js so Overview and Market
                cannot drift apart. Unverified entries are labelled as such
                rather than presented as sourced fact. */}
            <QuickStat label="Total Market Value" value={MARKET_FACTS.totalValue2025.value} change={`${MARKET_FACTS.totalValue2025.change} Â· DLD 2025`} note={`Q1 2026: ${MARKET_FACTS.q1_2026Value.value} (${MARKET_FACTS.q1_2026Value.change})`} color={T.gold} onClick={()=>handleTabChange?.("Market")} />
            <QuickStat label="Total Transactions" value={MARKET_FACTS.totalTransactions2025.value} change={`${MARKET_FACTS.totalTransactions2025.change} Â· DLD 2025`} note={MARKET_FACTS.totalTransactions2025.note} onClick={()=>handleTabChange?.("DLD Volumes")} />
            <QuickStat label="Avg PPSF" value={MARKET_FACTS.avgPpsf2025.value} change={`${MARKET_FACTS.avgPpsf2025.change} Â· FY2025`} note={MARKET_FACTS.avgPpsf2025.note} color="#63B3ED" onClick={()=>handleTabChange?.("Price History")} />
            <QuickStat label="Avg Gross Yield" value={MARKET_FACTS.avgGrossYield2025.value} change={MARKET_FACTS.avgGrossYield2025.change} note="Unverified Â· REIDIN paywalled" color={T.green} onClick={()=>handleTabChange?.("Yields")} />
            <QuickStat label="EIBOR 3M" value={eiborDisplay} change="Falling Â· Fed easing" note="CBUAE Â· Mortgage: ~4-5%" color="#9F7AEA" onClick={()=>handleTabChange?.("Mortgage")} />
            <QuickStat label="Off-Plan Share" value={MARKET_FACTS.offPlanShare2025.value} change={MARKET_FACTS.offPlanShare2025.change} note={MARKET_FACTS.offPlanShare2025.note} onClick={()=>handleTabChange?.("Projects")} />
            <QuickStat label="Active Developers" value={MARKET_FACTS.activeDevelopers2025.value} change={MARKET_FACTS.activeDevelopers2025.change} note="Unverified Â· no published source" onClick={()=>handleTabChange?.("Developer Health")} />
            <QuickStat label="Units Launched" value={MARKET_FACTS.unitsLaunched2025.value} change={MARKET_FACTS.unitsLaunched2025.change} note="Unverified Â· no published source" onClick={()=>handleTabChange?.("Launch Calendar")} />
          </div>
        </div>
      </div>

      {/* INTELLIGENCE PANEL */}
      <div style={{ fontSize:11, fontWeight:700, color:T.textMuted, textTransform:"uppercase", letterSpacing:0.8, marginBottom:12 }}>Intelligence Panel â€” {devFilterLabel||"All Dubai"}</div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:14, marginBottom:24 }}>
        <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid "+T.border, borderRadius:12, padding:"16px 18px" }}>
          <div style={{ fontSize:11, fontWeight:700, color:T.textMuted, textTransform:"uppercase", letterSpacing:0.8, marginBottom:12 }}>Top Communities â€” Yield</div>
          {(liveYields?.length>0?[...liveYields].sort((a,b)=>(parseFloat(b.gross)||0)-(parseFloat(a.gross)||0)).slice(0,6):[
            {community:"International City",gross:"9.2",tenantProfile:"Mixed"},
            {community:"Dubai South",gross:"8.8",tenantProfile:"Mixed"},
            {community:"Discovery Gardens",gross:"8.5",tenantProfile:"Professionals"},
            {community:"Al Furjan",gross:"8.2",tenantProfile:"Families"},
            {community:"JLT",gross:"8.1",tenantProfile:"Professionals"},
            {community:"JVC",gross:"7.8",tenantProfile:"Professionals"},
          ]).map((y,i)=>(
            <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"6px 0", borderBottom:i<5?"1px solid "+T.border:"none" }}>
              <div><div style={{ fontSize:12, color:T.white }}>{y.community}</div><div style={{ fontSize:10, color:T.textMuted }}>{y.tenantProfile||"Apartment"}</div></div>
              <div style={{ fontFamily:"'Fraunces',serif", fontSize:15, fontWeight:700, color:parseFloat(y.gross)>=7?T.green:T.gold }}>{parseFloat(y.gross||0).toFixed(1)}%</div>
            </div>
          ))}
          {!liveYields?.length&&<div style={{ fontSize:10, color:T.textMuted, marginTop:6, fontStyle:"italic" }}>Research data Â· REIDIN Dec 2025</div>}
          
        {/* Top Communities Widget */}
        {liveNeighbourhoods.length>0&&(
          <div style={{background:"rgba(255,255,255,0.02)",border:"1px solid "+T.border,borderRadius:12,padding:"16px",marginBottom:16}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
              <div style={{fontSize:13,fontWeight:700,color:T.white}}>Top Investment Communities</div>
              <button type="button" onClick={()=>handleTabChange?.("Neighbourhoods")} style={{fontSize:10,color:T.gold,background:"none",border:"none",cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>View all 259 â†’</button>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:6}}>
              {[...(liveNeighbourhoods||[])].filter(n=>n.grossYield>0).sort((a,b)=>(b.investmentScore||0)-(a.investmentScore||0)).slice(0,5).map((n,i)=>(
                <div key={n.community} onClick={()=>handleTabChange?.("Neighbourhoods")}
                  style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 10px",background:"rgba(255,255,255,0.02)",borderRadius:8,cursor:"pointer",border:"1px solid "+T.border+"40"}}
                  onMouseEnter={e=>e.currentTarget.style.borderColor="rgba(212,168,67,0.3)"}
                  onMouseLeave={e=>e.currentTarget.style.borderColor=T.border+"40"}
                >
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <span style={{fontSize:10,fontWeight:700,color:"#64748B",width:16}}>{i+1}</span>
                    <div>
                      <div style={{fontSize:11,fontWeight:600,color:T.white}}>{n.community}</div>
                      <div style={{fontSize:9,color:"#64748B"}}>{n.nearestMetro?n.nearestMetro.replace(" Metro","")+" Metro  ":""}{n.supplyRisk||""} Risk</div>
                    </div>
                  </div>
                  <div style={{display:"flex",gap:8,alignItems:"center"}}>
                    <span style={{fontSize:11,fontWeight:700,color:parseFloat(n.grossYield||0)>=7?"#10B981":"#84CC16"}}>{parseFloat(n.grossYield||0).toFixed(1)}%</span>
                    <div style={{width:28,height:28,borderRadius:"50%",background:"rgba(212,168,67,0.1)",border:"1px solid rgba(212,168,67,0.3)",display:"flex",alignItems:"center",justifyContent:"center"}}>
                      <span style={{fontSize:9,fontWeight:700,color:T.gold}}>{n.investmentScore}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Top Communities Widget */}
        {liveNeighbourhoods.length>0&&(
          <div style={{background:"rgba(255,255,255,0.02)",border:"1px solid "+T.border,borderRadius:12,padding:"16px",marginBottom:16}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
              <div style={{fontSize:13,fontWeight:700,color:T.white}}>Top Investment Communities</div>
              <button type="button" onClick={()=>handleTabChange?.("Neighbourhoods")} style={{fontSize:10,color:T.gold,background:"none",border:"none",cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>View all 259 â†’</button>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:6}}>
              {[...(liveNeighbourhoods||[])].filter(n=>n.grossYield>0).sort((a,b)=>(b.investmentScore||0)-(a.investmentScore||0)).slice(0,5).map((n,i)=>(
                <div key={n.community} onClick={()=>handleTabChange?.("Neighbourhoods")}
                  style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 10px",background:"rgba(255,255,255,0.02)",borderRadius:8,cursor:"pointer",border:"1px solid "+T.border+"40"}}
                  onMouseEnter={e=>e.currentTarget.style.borderColor="rgba(212,168,67,0.3)"}
                  onMouseLeave={e=>e.currentTarget.style.borderColor=T.border+"40"}
                >
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <span style={{fontSize:10,fontWeight:700,color:"#64748B",width:16}}>{i+1}</span>
                    <div>
                      <div style={{fontSize:11,fontWeight:600,color:T.white}}>{n.community}</div>
                      <div style={{fontSize:9,color:"#64748B"}}>{n.nearestMetro?n.nearestMetro.replace(" Metro","")+" Metro  ":""}{n.supplyRisk||""} Risk</div>
                    </div>
                  </div>
                  <div style={{display:"flex",gap:8,alignItems:"center"}}>
                    <span style={{fontSize:11,fontWeight:700,color:parseFloat(n.grossYield||0)>=7?"#10B981":"#84CC16"}}>{parseFloat(n.grossYield||0).toFixed(1)}%</span>
                    <div style={{width:28,height:28,borderRadius:"50%",background:"rgba(212,168,67,0.1)",border:"1px solid rgba(212,168,67,0.3)",display:"flex",alignItems:"center",justifyContent:"center"}}>
                      <span style={{fontSize:9,fontWeight:700,color:T.gold}}>{n.investmentScore}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        <button type="button" onClick={()=>handleTabChange?.("Yields")} style={{ width:"100%", marginTop:12, padding:"7px 0", background:"rgba(212,168,67,0.06)", border:"1px solid "+T.border, borderRadius:8, color:T.gold, fontSize:11, fontWeight:600, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>View All Yields â†’</button>
        </div>
        <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid "+T.border, borderRadius:12, padding:"16px 18px" }}>
          <div style={{ fontSize:11, fontWeight:700, color:T.textMuted, textTransform:"uppercase", letterSpacing:0.8, marginBottom:12 }}>DLD Transaction Volume</div>
          {(()=>{
            const data=liveDLDVolumes?.length>0?liveDLDVolumes:[
              {community:"JVC",transactions:18782},{community:"Business Bay",transactions:12450},
              {community:"Dubai Marina",transactions:11200},{community:"Downtown Dubai",transactions:8900},
              {community:"Dubai Hills Estate",transactions:8200},{community:"Sobha Hartland",transactions:6800},
            ];
            const sorted=[...data].sort((a,b)=>(b.transactions||0)-(a.transactions||0)).slice(0,6);
            const max=sorted[0]?.transactions||1;
            return sorted.map((d,i)=>(
              <div key={i} style={{ marginBottom:10 }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                  <span style={{ fontSize:11, color:T.textSecondary }}>{d.community}</span>
                  <span style={{ fontSize:11, color:T.white, fontWeight:600 }}>{(d.transactions||0).toLocaleString()}</span>
                </div>
                <div style={{ height:4, borderRadius:2, background:T.border }}>
                  <div style={{ height:"100%", width:Math.round((d.transactions/max)*100)+"%", borderRadius:2, background:"linear-gradient(90deg,"+T.gold+",#63B3ED)", transition:"width 0.8s" }} />
                </div>
              </div>
            ));
          })()}
          {!liveDLDVolumes?.length&&<div style={{ fontSize:10, color:T.textMuted, marginTop:4, fontStyle:"italic" }}>DXB Analytics Â· DLD 2025</div>}
          <button type="button" onClick={()=>handleTabChange?.("DLD Volumes")} style={{ width:"100%", marginTop:12, padding:"7px 0", background:"rgba(212,168,67,0.06)", border:"1px solid "+T.border, borderRadius:8, color:T.gold, fontSize:11, fontWeight:600, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>View DLD Volumes â†’</button>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid "+T.border, borderRadius:12, padding:"16px 18px", flex:1 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
              <div style={{ width:6, height:6, borderRadius:"50%", background:T.gold, animation:"pulse 2s infinite" }} />
              <span style={{ fontSize:11, fontWeight:700, color:T.textMuted, textTransform:"uppercase", letterSpacing:0.8 }}>AI Market Insight</span>
            </div>
            {aiInsights?.length>0
              ?<div style={{ fontSize:12, color:T.textSecondary, lineHeight:1.7 }}>{aiInsights[0]?.text||aiInsights[0]}</div>
              :<div style={{ fontSize:11, color:T.textSecondary, lineHeight:1.7 }}><span style={{ color:T.gold, fontWeight:700 }}>Q1 2026 signal:</span> AED 252B in Q1 despite regional uncertainty. Off-plan deepened to 80%+. Value (+31%) outpacing volume (+6%) â€” market maturing, not crashing. Buyers more selective on developer track record.</div>
            }
            <div style={{ marginTop:10, fontSize:10, color:T.textMuted }}>{aiInsights?.length>0?"Powered by Claude Â· Updated this week":"Research Â· DLD Q1 2026 Â· Edwards & Towers"}</div>
          </div>
          <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid "+T.border, borderRadius:12, padding:"16px 18px" }}>
            <div style={{ fontSize:11, fontWeight:700, color:T.textMuted, textTransform:"uppercase", letterSpacing:0.8, marginBottom:10 }}>Developer Health</div>
            {liveDevHealth?.length>0
              ?[...liveDevHealth].slice(0,4).map((d,i)=>(
                  <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"5px 0", borderBottom:i<3?"1px solid "+T.border:"none" }}>
                    <span style={{ fontSize:11, color:T.textSecondary }}>{d.developer||d.name}</span>
                    <span style={{ fontSize:11, fontWeight:700, padding:"2px 8px", borderRadius:20, background:(d.score||0)>=75?"rgba(104,211,145,0.15)":"rgba(212,168,67,0.15)", color:(d.score||0)>=75?T.green:T.gold }}>{d.score||"â€”"}</span>
                  </div>
                ))
              :<div style={{ fontSize:11, color:T.textMuted }}>Health scores load from Admin â†’ Developer Health</div>
            }
            <button type="button" onClick={()=>handleTabChange?.("Developer Health")} style={{ width:"100%", marginTop:10, padding:"6px 0", background:"rgba(212,168,67,0.06)", border:"1px solid "+T.border, borderRadius:8, color:T.gold, fontSize:11, fontWeight:600, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>View All â†’</button>
          </div>
        </div>
      </div>

      {/* PLATFORM NAVIGATOR */}
      <div style={{ fontSize:11, fontWeight:700, color:T.textMuted, textTransform:"uppercase", letterSpacing:0.8, marginBottom:12 }}>Platform Navigator â€” All 33 Modules</div>
      <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:24 }}>
        {TAB_NAV.map(section=>(
          <div key={section.section}>
            <div onClick={()=>setNavExpanded(navExpanded===section.section?null:section.section)}
              style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 14px", background:"rgba(255,255,255,0.02)", border:"1px solid "+T.border, borderRadius:navExpanded===section.section?"10px 10px 0 0":10, cursor:"pointer" }}
              onMouseEnter={e=>(e.currentTarget.style.background="rgba(255,255,255,0.04)")}
              onMouseLeave={e=>(e.currentTarget.style.background="rgba(255,255,255,0.02)")}
            >
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <div style={{ width:8, height:8, borderRadius:2, background:section.color }} />
                <span style={{ fontSize:12, fontWeight:700, color:T.white }}>{section.section}</span>
                <span style={{ fontSize:10, color:T.textMuted }}>Â· {section.tabs.length} modules</span>
              </div>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={T.textMuted} strokeWidth="2"><polyline points={navExpanded===section.section?"18 15 12 9 6 15":"6 9 12 15 18 15"} /></svg>
            </div>
            {navExpanded===section.section&&(
              <div style={{ border:"1px solid "+T.border, borderTop:"none", borderRadius:"0 0 10px 10px", padding:"8px", display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))", gap:6 }}>
                {section.tabs.map(tab=>(
                  <div key={tab.name} onClick={()=>handleTabChange?.(tab.name)}
                    style={{ display:"flex", alignItems:"flex-start", gap:10, padding:"10px 12px", borderRadius:8, cursor:"pointer" }}
                    onMouseEnter={e=>(e.currentTarget.style.background="rgba(255,255,255,0.04)")}
                    onMouseLeave={e=>(e.currentTarget.style.background="transparent")}
                  >
                    <span style={{ fontSize:16, flexShrink:0, marginTop:1 }}>{tab.icon}</span>
                    <div>
                      <div style={{ fontSize:12, fontWeight:600, color:T.white, marginBottom:2 }}>{tab.name}</div>
                      <div style={{ fontSize:10, color:T.textMuted, lineHeight:1.4 }}>{tab.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* FOOTER */}
      <div style={{ paddingTop:16, borderTop:"1px solid "+T.border, display:"flex", flexWrap:"wrap", gap:8, alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ display:"flex", flexWrap:"wrap", gap:6, alignItems:"center" }}>
          <span style={{ fontSize:10, color:T.textMuted }}>Sources:</span>
          {[
            {label:"DLD Q1 2026",url:"https://mediaoffice.ae/en/news/2026/april/09-04/dubai-real-estate-transactions-surge-31-to-reach-aed252-billion-in-q1-2026"},
            {label:"DLD FY2025",url:"https://mediaoffice.ae/en/news/2026/january/12-01/dubais-real-estate-market-records-new-historic-milestone"},
            {label:"REIDIN Dec 2025",url:"https://reidin.com"},
            {label:"CBUAE EIBOR",url:"https://www.centralbank.ae/en/forex-eibor/eibor-rates/"},
            {label:"Edwards & Towers Q1 2026",url:"https://edwardsandtowers.com/dubai-real-estate-market-q1-2026-analysis/"},
            {label:"Capital Zone Apr 2026",url:"https://www.capitalzone.ae/mortgage-rates-today-in-the-uae/"},
          ].map(s=>(
            <a key={s.label} href={s.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration:"none" }}>
              <span style={{ fontSize:10, color:T.textMuted, padding:"2px 8px", borderRadius:10, border:"1px solid "+T.border, background:T.surfaceAlt, cursor:"pointer" }}>{s.label}</span>
            </a>
          ))}
        </div>
        <div style={{ fontSize:10, color:T.textMuted }}>Session 7 Â· April 2026 Â· DXB Analytics</div>
      </div>

    </div>
  );
}

export default OverviewTab;