/* eslint-disable */
/* DXB ANALYTICS - DLD VOLUMES TAB (World Class + World Class Filters) - Session 9 */

import React, { useState, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart, Cell } from "recharts";
import { T } from "../data";
import SEED_DATA from "../utils/seedData";

const getLiquidity = (tx) => {
  if (tx >= 15000) return { label: "Ultra-High", color: "#68D391", desc: "Exit in days" };
  if (tx >= 5000)  return { label: "High",       color: "#D4A843", desc: "Exit in 1-2 weeks" };
  if (tx >= 2000)  return { label: "Medium",     color: "#63B3ED", desc: "Exit in 1-2 months" };
  if (tx >= 500)   return { label: "Low",        color: "#FC8181", desc: "Exit in 2-4 months" };
  return             { label: "Very Low",  color: "#9F7AEA", desc: "Exit may take 4+ months" };
};

const SECTOR_COLORS = {
  "New Dubai": "#D4A843", "Trade Center": "#63B3ED", "MBR City": "#68D391",
  "Dubailand": "#FC8181", "Dubai South": "#9F7AEA", "Jebel Ali": "#F6AD55",
  "Deira": "#4FD1C5", "Bur Dubai": "#ED8936",
};

const FALLBACK_DATA = [
  { community: "Jumeirah Village Circle", transactions: 18782, value: 15.99, avgPpsf: 1485, offPlanPct: 72, yoyGrowth: 17.2, type: "Apartment", sector: "New Dubai", note: "Most liquid community — 1,500+ tx/month. Exit in days." },
  { community: "Dubai South",             transactions: 17097, value: 9.8,   avgPpsf: 1050, offPlanPct: 85, yoyGrowth: 25.4, type: "Mixed",     sector: "Dubai South", note: "Airport corridor — fastest growing 2025. Al Maktoum expansion catalyst." },
  { community: "Business Bay",            transactions: 12450, value: 27.05, avgPpsf: 2306, offPlanPct: 77, yoyGrowth: 8.4,  type: "Apartment", sector: "Trade Center", note: "Value leader H1 2025 AED 22.5B. Binghatti Skyrise trilogy top project." },
  { community: "Dubai Marina",            transactions: 11200, value: 32.13, avgPpsf: 2188, offPlanPct: 45, yoyGrowth: 9.8,  type: "Apartment", sector: "New Dubai", note: "Value leader H1 2025 AED 25.1B — luxury investor hub. Top STR community." },
  { community: "Downtown Dubai",          transactions: 8900,  value: 24.5,  avgPpsf: 2750, offPlanPct: 48, yoyGrowth: 12.3, type: "Apartment", sector: "Trade Center", note: "Emaar flagship. AED 17.1B in H1 2025. Burj Khalifa views command premium." },
  { community: "Dubai Hills Estate",      transactions: 8200,  value: 22.4,  avgPpsf: 2100, offPlanPct: 55, yoyGrowth: 22.1, type: "Mixed",     sector: "MBR City", note: "Top luxury villa destination. Dubai Hills Mall catalyst." },
  { community: "DAMAC Hills 2",           transactions: 7800,  value: 7.4,   avgPpsf: 950,  offPlanPct: 80, yoyGrowth: 11.3, type: "Villa",     sector: "Dubailand", note: "Most popular affordable villa 2025. Water features + amenities." },
  { community: "Sobha Hartland",          transactions: 6800,  value: 19.7,  avgPpsf: 2750, offPlanPct: 68, yoyGrowth: 18.4, type: "Mixed",     sector: "MBR City", note: "Crystal lagoon masterplan. Sobha Hartland 2 phase expanding." },
  { community: "Jumeirah Lake Towers",    transactions: 6100,  value: 8.9,   avgPpsf: 1650, offPlanPct: 42, yoyGrowth: 7.1,  type: "Apartment", sector: "New Dubai", note: "Established community with 79 towers — strong rental demand." },
  { community: "Dubai Creek Harbour",     transactions: 5800,  value: 13.2,  avgPpsf: 2280, offPlanPct: 82, yoyGrowth: 19.6, type: "Apartment", sector: "MBR City", note: "Blue Line Metro catalyst. +15-25% PPSF growth. Emaar masterplan." },
  { community: "Palm Jumeirah",           transactions: 5400,  value: 28.9,  avgPpsf: 3500, offPlanPct: 15, yoyGrowth: 14.8, type: "Mixed",     sector: "New Dubai", note: "Highest avg PPSF AED 3,500. Supply-constrained — strong price support." },
  { community: "Al Furjan",               transactions: 5200,  value: 6.65,  avgPpsf: 1280, offPlanPct: 65, yoyGrowth: 16.4, type: "Villa",     sector: "Jebel Ali", note: "Most popular mid-tier villa H1 2025 per Bayut." },
  { community: "Wadi Al Safa 5",          transactions: 4800,  value: 15.3,  avgPpsf: 1420, offPlanPct: 78, yoyGrowth: 14.2, type: "Mixed",     sector: "Dubailand", note: "Top 3 by volume H1 2025 per DLD official." },
  { community: "Arabian Ranches 3",       transactions: 4100,  value: 6.48,  avgPpsf: 1580, offPlanPct: 71, yoyGrowth: 27.8, type: "Villa",     sector: "Dubailand", note: "Caya and Bliss handovers drove surge. Bayut 2025 top villa." },
  { community: "International City",      transactions: 4300,  value: 2.05,  avgPpsf: 910,  offPlanPct: 25, yoyGrowth: 8.3,  type: "Apartment", sector: "Dubailand", note: "Highest gross yield 8.3-10%. CBD27 reaches 11.7%. Best cash flow." },
  { community: "Dubai Silicon Oasis",     transactions: 3900,  value: 4.37,  avgPpsf: 1120, offPlanPct: 58, yoyGrowth: 28.5, type: "Apartment", sector: "Dubailand", note: "Blue Line Metro catalyst. Highest PPSF growth 2025 at +28.5%." },
  { community: "Town Square",             transactions: 3800,  value: 3.8,   avgPpsf: 1000, offPlanPct: 62, yoyGrowth: 12.4, type: "Mixed",     sector: "Dubailand", note: "7.72% apartment ROI. Bayut 2025 top mid-tier yield." },
  { community: "Tilal Al Ghaf",           transactions: 3200,  value: 5.38,  avgPpsf: 1680, offPlanPct: 88, yoyGrowth: 21.4, type: "Villa",     sector: "Dubailand", note: "Majid Al Futtaim luxury villa. Crystal lagoon." },
  { community: "Arjan",                   transactions: 3100,  value: 4.2,   avgPpsf: 1355, offPlanPct: 82, yoyGrowth: 28.5, type: "Apartment", sector: "New Dubai", note: "Al Barsha South 4th topped H1 volume at 10,469 tx." },
  { community: "Dubai Sports City",       transactions: 2900,  value: 3.13,  avgPpsf: 1080, offPlanPct: 55, yoyGrowth: 15.4, type: "Apartment", sector: "New Dubai", note: "Victory Heights villas +39% YoY in Q3 2025." },
  { community: "Motor City",              transactions: 2400,  value: 2.69,  avgPpsf: 1120, offPlanPct: 48, yoyGrowth: 19.2, type: "Apartment", sector: "New Dubai", note: "Uptown Motorcity appreciation leader Q4 2025." },
  { community: "Mirdif",                  transactions: 2800,  value: 2.94,  avgPpsf: 1050, offPlanPct: 22, yoyGrowth: 8.1,  type: "Villa",     sector: "Deira", note: "Established family area. Affordable villas near airport." },
  { community: "Al Barsha 1",             transactions: 2300,  value: 3.34,  avgPpsf: 1450, offPlanPct: 38, yoyGrowth: 6.8,  type: "Apartment", sector: "New Dubai", note: "Mall of the Emirates area. Strong mid-market demand." },
  { community: "DIFC",                    transactions: 1900,  value: 6.08,  avgPpsf: 3200, offPlanPct: 35, yoyGrowth: 39.2, type: "Apartment", sector: "Trade Center", note: "Highest PPSF growth 2025 at +39.2% per Dubai Home Feb 2026." },
  { community: "Discovery Gardens",       transactions: 2100,  value: 1.99,  avgPpsf: 950,  offPlanPct: 18, yoyGrowth: 9.2,  type: "Apartment", sector: "Jebel Ali", note: "9.47% ROI. Bayut top affordable yield. Nakheel community." },
  { community: "Emaar Beachfront",        transactions: 2800,  value: 9.38,  avgPpsf: 3350, offPlanPct: 88, yoyGrowth: 16.8, type: "Apartment", sector: "New Dubai", note: "Emaar-only beachfront. Phases sell out on launch day." },
  { community: "Nad Al Sheba",            transactions: 2100,  value: 3.88,  avgPpsf: 1850, offPlanPct: 72, yoyGrowth: 18.2, type: "Villa",     sector: "MBR City", note: "Meraas Nad Al Sheba Gardens expanding. Premium villa hub." },
  { community: "Al Yalayis 1",            transactions: 3200,  value: 15.7,  avgPpsf: 2100, offPlanPct: 85, yoyGrowth: 12.1, type: "Mixed",     sector: "Jebel Ali", note: "AED 15.7B value H1 2025 per DLD Media Office." },
  { community: "The Oasis by Emaar",      transactions: 1200,  value: 9.71,  avgPpsf: 2450, offPlanPct: 98, yoyGrowth: 0,    type: "Villa",     sector: "Dubailand", note: "Largest single off-plan location Q1 2026 at AED 9.71B." },
  { community: "Jumeirah Golf Estates",   transactions: 1400,  value: 2.59,  avgPpsf: 1850, offPlanPct: 58, yoyGrowth: 22.0, type: "Villa",     sector: "New Dubai", note: "+22% YoY. Dubai World Championship host. Premium golf villas." },
];

const DLDTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
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

const FilterPill = ({ label, active, color, onClick }) => (
  <button type="button" onClick={onClick} style={{ padding: "5px 12px", borderRadius: 20, fontSize: 11, fontWeight: active ? 700 : 500, cursor: "pointer", fontFamily: "'Outfit',sans-serif", background: active ? (color || "#D4A843") + "20" : T.surfaceAlt, border: "1px solid " + (active ? (color || "#D4A843") : T.border), color: active ? (color || "#D4A843") : T.textMuted, transition: "all 0.15s", display: "flex", alignItems: "center", gap: 4 }}>
    {label}
  </button>
);

function DLDVolumesTab({ dldFilter, setDldFilter, dldSearch, setDldSearch, dldSort, setDldSort, dldView, setDldView, liveDLDVolumes, globalFilters, allDevelopers, handleTabChange }) {
  const [sortBy, setSortBy] = useState("transactions");
  const [filterSector, setFilterSector] = useState("All");
  const [filterType, setFilterType] = useState("All");
  const [filterLiquidity, setFilterLiquidity] = useState("All");
  const [filterOffPlan, setFilterOffPlan] = useState("All");
  const [searchQ, setSearchQ] = useState("");
  const [view, setView] = useState("table");
  const [selected, setSelected] = useState(null);

  const rawData = useMemo(() => {
    const live = (liveDLDVolumes || []).filter(d => d.community && (d.transactions || d.value));
    if (live.length > 0) {
      return live.map(d => ({
        community: d.community, transactions: d.transactions || 0,
        value: d.value && d.value > 1000000 ? parseFloat((d.value/1000000000).toFixed(2)) : d.value || 0,
        avgPpsf: d.avgPpsf || 0, offPlanPct: d.offPlanPct || 0,
        yoyGrowth: d.yoyGrowth || 0, type: d.type || "Mixed",
        sector: d.sector || d.area || "Dubai", note: d.note || "",
      }));
    }
    return FALLBACK_DATA;
  }, [liveDLDVolumes]);

  const isSeed = !(liveDLDVolumes && liveDLDVolumes.length > 0);

  const filtered = useMemo(() => {
    let d = [...rawData];
    if (filterSector !== "All") d = d.filter(x => x.sector === filterSector);
    if (filterType !== "All") d = d.filter(x => x.type === filterType || x.type === "Mixed");
    if (filterLiquidity !== "All") d = d.filter(x => getLiquidity(x.transactions).label === filterLiquidity);
    if (filterOffPlan === "0-30")  d = d.filter(x => (x.offPlanPct || 0) < 30);
    if (filterOffPlan === "30-60") d = d.filter(x => (x.offPlanPct || 0) >= 30 && (x.offPlanPct || 0) < 60);
    if (filterOffPlan === "60+")   d = d.filter(x => (x.offPlanPct || 0) >= 60);
    if (searchQ) d = d.filter(x => x.community.toLowerCase().includes(searchQ.toLowerCase()));
    d.sort((a, b) => {
      if (sortBy === "transactions") return (b.transactions||0) - (a.transactions||0);
      if (sortBy === "value")        return (b.value||0) - (a.value||0);
      if (sortBy === "ppsf")         return (b.avgPpsf||0) - (a.avgPpsf||0);
      if (sortBy === "offplan")      return (b.offPlanPct||0) - (a.offPlanPct||0);
      if (sortBy === "growth")       return (b.yoyGrowth||0) - (a.yoyGrowth||0);
      return 0;
    });
    return d;
  }, [rawData, filterSector, filterType, filterLiquidity, filterOffPlan, searchQ, sortBy]);

  const totalTx  = rawData.reduce((s, d) => s + (d.transactions||0), 0);
  const totalVal = rawData.reduce((s, d) => s + (d.value||0), 0);
  const avgOffPlan = Math.round(rawData.reduce((s,d) => s+(d.offPlanPct||0),0) / (rawData.length||1));
  const topCommunity = [...rawData].sort((a,b) => (b.transactions||0)-(a.transactions||0))[0];
  const maxTx  = Math.max(...filtered.map(d => d.transactions||0), 1);
  const sectors = ["All", ...Array.from(new Set(rawData.map(d => d.sector).filter(Boolean))).sort()];
  const hasActiveFilters = filterSector!=="All" || filterType!=="All" || filterLiquidity!=="All" || filterOffPlan!=="All" || !!searchQ;
  const clearAll = () => { setFilterSector("All"); setFilterType("All"); setFilterLiquidity("All"); setFilterOffPlan("All"); setSearchQ(""); };

  const chartData = filtered.slice(0, 12).map(d => ({
    name: d.community.split(" ").slice(0,2).join(" "),
    fullName: d.community, transactions: d.transactions, value: d.value, ppsf: d.avgPpsf, sector: d.sector,
  }));

  const selectedData = selected ? rawData.find(d => d.community === selected) : null;
  const selectedLiq  = selectedData ? getLiquidity(selectedData.transactions) : null;

  return (
    <div style={{ paddingTop: 4, paddingBottom: 60 }}>

      {/* HEADER */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20, paddingBottom:16, borderBottom:"1px solid "+T.border, flexWrap:"wrap", gap:12 }}>
        <div>
          <div style={{ fontFamily:"'Fraunces',serif", fontSize:20, fontWeight:800, color:T.white, marginBottom:4 }}>DLD Transaction Intelligence</div>
          <div style={{ fontSize:11, color:T.textMuted }}>Full Year 2025 · Dubai Land Department Official · DXB Analytics · Cavendish Maxwell</div>
        </div>
        {isSeed && <span style={{ fontSize:10, padding:"3px 10px", borderRadius:10, background:"rgba(212,168,67,0.1)", border:"1px solid rgba(212,168,67,0.2)", color:T.gold }}>Research data · DLD 2025</span>}
      </div>

      {/* SUMMARY KPIs */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(170px,1fr))", gap:10, marginBottom:20 }}>
        {[
          { label:"Total Transactions", value:totalTx.toLocaleString(), sub:"Tracked communities 2025", color:T.gold },
          { label:"Total Value",        value:"AED "+totalVal.toFixed(0)+"B", sub:"Combined value", color:"#63B3ED" },
          { label:"Top Community",      value:(topCommunity?.community||"JVC").split(" ").slice(0,2).join(" "), sub:(topCommunity?.transactions||0).toLocaleString()+" tx", color:T.green },
          { label:"Avg Off-Plan Share", value:avgOffPlan+"%", sub:"Across tracked communities", color:"#FC8181" },
          { label:"FY2025 Market Total",value:"270,000+", sub:"All Dubai · DLD Official", color:T.textSecondary },
          { label:"Q1 2026 Pace",       value:"60,303", sub:"+6% YoY · DLD Apr 9, 2026", color:T.textSecondary },
        ].map((k,i) => (
          <div key={i} style={{ background:"rgba(255,255,255,0.03)", border:"1px solid "+T.border, borderRadius:10, padding:"12px 14px" }}>
            <div style={{ fontSize:10, color:T.textMuted, fontWeight:700, textTransform:"uppercase", letterSpacing:0.8, marginBottom:6 }}>{k.label}</div>
            <div style={{ fontFamily:"'Fraunces',serif", fontSize:18, fontWeight:800, color:k.color, marginBottom:3 }}>{k.value}</div>
            <div style={{ fontSize:10, color:T.textMuted }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* LIQUIDITY GUIDE */}
      <div style={{ background:"rgba(212,168,67,0.04)", border:"1px solid rgba(212,168,67,0.15)", borderRadius:10, padding:"10px 16px", marginBottom:20, display:"flex", flexWrap:"wrap", gap:14, alignItems:"center" }}>
        <div style={{ fontSize:11, color:T.gold, fontWeight:700 }}>Liquidity Guide:</div>
        {[{l:"Ultra-High (15K+)",c:"#68D391",d:"Exit in days"},{l:"High (5K-15K)",c:"#D4A843",d:"1-2 weeks"},{l:"Medium (2K-5K)",c:"#63B3ED",d:"1-2 months"},{l:"Low (500-2K)",c:"#FC8181",d:"2-4 months"},{l:"Very Low (<500)",c:"#9F7AEA",d:"4+ months"}].map((x,i) => (
          <div key={i} style={{ display:"flex", alignItems:"center", gap:5 }}>
            <div style={{ width:8, height:8, borderRadius:"50%", background:x.c }} />
            <span style={{ fontSize:10, color:T.textSecondary }}>{x.l}</span>
            <span style={{ fontSize:10, color:T.textMuted }}>— {x.d}</span>
          </div>
        ))}
        <div style={{ fontSize:10, color:T.textMuted, marginLeft:"auto" }}>Source: DXB Analytics DLD database March 2026</div>
      </div>

      {/* WORLD CLASS FILTER BAR */}
      <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid "+T.border, borderRadius:12, padding:"14px 16px", marginBottom:16 }}>

        {/* Row 1: Search + Sort + View */}
        <div style={{ display:"flex", gap:10, marginBottom:12, alignItems:"center", flexWrap:"wrap" }}>
          <div style={{ position:"relative", flex:"0 0 220px" }}>
            <input type="text" placeholder="Search community..." value={searchQ} onChange={e => setSearchQ(e.target.value)}
              style={{ padding:"7px 12px 7px 10px", borderRadius:8, background:T.surfaceAlt, border:"1px solid "+(searchQ?T.gold:T.border), color:T.white, fontSize:12, fontFamily:"'Outfit',sans-serif", width:"100%", outline:"none", boxSizing:"border-box" }} />
          </div>
          <div style={{ display:"flex", gap:6, alignItems:"center", flexWrap:"wrap" }}>
            <span style={{ fontSize:10, color:T.textMuted, fontWeight:700, textTransform:"uppercase", letterSpacing:0.8 }}>Sort:</span>
            {[{k:"transactions",l:"Volume"},{k:"value",l:"Value"},{k:"ppsf",l:"PPSF"},{k:"offplan",l:"Off-Plan"},{k:"growth",l:"YoY Growth"}].map(s => (
              <button key={s.k} type="button" onClick={() => setSortBy(s.k)} style={{ padding:"5px 12px", borderRadius:20, fontSize:11, fontWeight:600, cursor:"pointer", fontFamily:"'Outfit',sans-serif", background:sortBy===s.k?"rgba(212,168,67,0.15)":T.surfaceAlt, border:"1px solid "+(sortBy===s.k?T.gold:T.border), color:sortBy===s.k?T.gold:T.textMuted, transition:"all 0.15s" }}>{s.l}</button>
            ))}
          </div>
          <button type="button" onClick={() => setView(view==="table"?"chart":"table")} style={{ marginLeft:"auto", padding:"6px 14px", borderRadius:8, fontSize:11, fontWeight:600, cursor:"pointer", background:"rgba(99,179,237,0.1)", border:"1px solid rgba(99,179,237,0.3)", color:"#63B3ED", fontFamily:"'Outfit',sans-serif" }}>
            {view==="table" ? "Chart View" : "Table View"}
          </button>
        </div>

        {/* Row 2: Sector pills */}
        <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:10, alignItems:"center" }}>
          <span style={{ fontSize:10, color:T.textMuted, fontWeight:700, textTransform:"uppercase", letterSpacing:0.8, minWidth:48 }}>Sector:</span>
          {sectors.map(s => {
            const c = s==="All" ? T.textSecondary : (SECTOR_COLORS[s]||T.textMuted);
            const active = filterSector===s;
            return <button key={s} type="button" onClick={() => setFilterSector(s)} style={{ padding:"4px 12px", borderRadius:20, fontSize:11, fontWeight:active?700:500, cursor:"pointer", fontFamily:"'Outfit',sans-serif", background:active?c+"20":T.surfaceAlt, border:"1px solid "+(active?c:T.border), color:active?c:T.textMuted, transition:"all 0.15s" }}>{s}</button>;
          })}
        </div>

        {/* Row 3: Type + Liquidity + Off-Plan */}
        <div style={{ display:"flex", gap:10, flexWrap:"wrap", alignItems:"center" }}>

          <div style={{ display:"flex", gap:4, alignItems:"center" }}>
            <span style={{ fontSize:10, color:T.textMuted, fontWeight:700, textTransform:"uppercase", letterSpacing:0.8 }}>Type:</span>
            {["All","Apartment","Villa","Mixed"].map(t => (
              <button key={t} type="button" onClick={() => setFilterType(t)} style={{ padding:"4px 10px", borderRadius:16, fontSize:11, fontWeight:filterType===t?700:500, cursor:"pointer", fontFamily:"'Outfit',sans-serif", background:filterType===t?"rgba(212,168,67,0.15)":T.surfaceAlt, border:"1px solid "+(filterType===t?T.gold:T.border), color:filterType===t?T.gold:T.textMuted }}>{t}</button>
            ))}
          </div>

          <div style={{ width:1, height:18, background:T.border }} />

          <div style={{ display:"flex", gap:4, alignItems:"center" }}>
            <span style={{ fontSize:10, color:T.textMuted, fontWeight:700, textTransform:"uppercase", letterSpacing:0.8 }}>Liquidity:</span>
            {[{k:"All",l:"All",c:T.textMuted},{k:"Ultra-High",l:"Ultra-High",c:"#68D391"},{k:"High",l:"High",c:"#D4A843"},{k:"Medium",l:"Medium",c:"#63B3ED"},{k:"Low",l:"Low",c:"#FC8181"}].map(x => (
              <button key={x.k} type="button" onClick={() => setFilterLiquidity(x.k)} style={{ padding:"4px 10px", borderRadius:16, fontSize:11, fontWeight:filterLiquidity===x.k?700:500, cursor:"pointer", fontFamily:"'Outfit',sans-serif", background:filterLiquidity===x.k?x.c+"20":T.surfaceAlt, border:"1px solid "+(filterLiquidity===x.k?x.c:T.border), color:filterLiquidity===x.k?x.c:T.textMuted, display:"flex", alignItems:"center", gap:4 }}>
                {x.k!=="All" && <div style={{ width:6, height:6, borderRadius:"50%", background:x.c }} />}{x.l}
              </button>
            ))}
          </div>

          <div style={{ width:1, height:18, background:T.border }} />

          <div style={{ display:"flex", gap:4, alignItems:"center" }}>
            <span style={{ fontSize:10, color:T.textMuted, fontWeight:700, textTransform:"uppercase", letterSpacing:0.8 }}>Off-Plan:</span>
            {[{k:"All",l:"All"},{k:"0-30",l:"<30%"},{k:"30-60",l:"30-60%"},{k:"60+",l:"60%+"}].map(x => (
              <button key={x.k} type="button" onClick={() => setFilterOffPlan(x.k)} style={{ padding:"4px 10px", borderRadius:16, fontSize:11, fontWeight:filterOffPlan===x.k?700:500, cursor:"pointer", fontFamily:"'Outfit',sans-serif", background:filterOffPlan===x.k?"rgba(104,211,145,0.15)":T.surfaceAlt, border:"1px solid "+(filterOffPlan===x.k?"#68D391":T.border), color:filterOffPlan===x.k?"#68D391":T.textMuted }}>{x.l}</button>
            ))}
          </div>

          {hasActiveFilters && (
            <div style={{ display:"flex", gap:6, alignItems:"center", marginLeft:"auto", flexWrap:"wrap" }}>
              {filterSector!=="All" && <span style={{ fontSize:10, padding:"3px 8px", borderRadius:10, background:"rgba(212,168,67,0.15)", color:T.gold, cursor:"pointer", display:"flex", alignItems:"center", gap:4 }} onClick={() => setFilterSector("All")}>{filterSector} x</span>}
              {filterType!=="All" && <span style={{ fontSize:10, padding:"3px 8px", borderRadius:10, background:"rgba(212,168,67,0.15)", color:T.gold, cursor:"pointer", display:"flex", alignItems:"center", gap:4 }} onClick={() => setFilterType("All")}>{filterType} x</span>}
              {filterLiquidity!=="All" && <span style={{ fontSize:10, padding:"3px 8px", borderRadius:10, background:"rgba(104,211,145,0.15)", color:"#68D391", cursor:"pointer", display:"flex", alignItems:"center", gap:4 }} onClick={() => setFilterLiquidity("All")}>{filterLiquidity} Liq x</span>}
              {filterOffPlan!=="All" && <span style={{ fontSize:10, padding:"3px 8px", borderRadius:10, background:"rgba(104,211,145,0.15)", color:"#68D391", cursor:"pointer", display:"flex", alignItems:"center", gap:4 }} onClick={() => setFilterOffPlan("All")}>Off-Plan {filterOffPlan}% x</span>}
              {searchQ && <span style={{ fontSize:10, padding:"3px 8px", borderRadius:10, background:"rgba(99,179,237,0.15)", color:"#63B3ED", cursor:"pointer", display:"flex", alignItems:"center", gap:4 }} onClick={() => setSearchQ("")}>"{searchQ}" x</span>}
              <button type="button" onClick={clearAll} style={{ fontSize:10, padding:"3px 10px", borderRadius:10, background:"rgba(252,129,129,0.1)", border:"1px solid rgba(252,129,129,0.3)", color:"#FC8181", cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>Clear all</button>
              <span style={{ fontSize:10, color:T.textMuted }}>{filtered.length} results</span>
            </div>
          )}
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div style={{ display:"grid", gridTemplateColumns:selected?"1fr 300px":"1fr", gap:14, marginBottom:24 }}>
        <div>
          {view==="table" ? (
            <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid "+T.border, borderRadius:12, overflow:"hidden" }}>
              <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1fr 1fr 1fr 1fr 100px", padding:"10px 16px", background:"rgba(255,255,255,0.03)", borderBottom:"1px solid "+T.border }}>
                {["Community","Transactions","Value (AED)","Avg PPSF","Off-Plan","YoY Growth","Liquidity"].map((h,i) => (
                  <div key={i} style={{ fontSize:10, fontWeight:700, color:T.textMuted, textTransform:"uppercase", letterSpacing:0.8 }}>{h}</div>
                ))}
              </div>
              {filtered.map((row, i) => {
                const liq = getLiquidity(row.transactions);
                const isSel = selected===row.community;
                return (
                  <div key={i} onClick={() => setSelected(isSel?null:row.community)}
                    style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1fr 1fr 1fr 1fr 100px", padding:"12px 16px", borderBottom:i<filtered.length-1?"1px solid "+T.border+"60":"none", cursor:"pointer", background:isSel?"rgba(212,168,67,0.06)":"transparent", transition:"background 0.15s" }}
                    onMouseEnter={e => !isSel && (e.currentTarget.style.background="rgba(255,255,255,0.02)")}
                    onMouseLeave={e => !isSel && (e.currentTarget.style.background="transparent")}
                  >
                    <div>
                      <div style={{ fontSize:12, fontWeight:600, color:T.white, marginBottom:2 }}>{row.community}</div>
                      <div style={{ display:"flex", gap:5 }}>
                        <span style={{ fontSize:9, padding:"1px 6px", borderRadius:8, background:(SECTOR_COLORS[row.sector]||T.textMuted)+"20", color:SECTOR_COLORS[row.sector]||T.textMuted }}>{row.sector}</span>
                        <span style={{ fontSize:9, padding:"1px 6px", borderRadius:8, background:"rgba(255,255,255,0.06)", color:T.textMuted }}>{row.type}</span>
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize:13, fontWeight:700, color:T.gold }}>{(row.transactions||0).toLocaleString()}</div>
                      <div style={{ height:3, borderRadius:2, background:T.border, marginTop:4, width:"80%" }}>
                        <div style={{ height:"100%", width:Math.round(((row.transactions||0)/maxTx)*100)+"%", borderRadius:2, background:T.gold, transition:"width 0.8s" }} />
                      </div>
                    </div>
                    <div style={{ fontSize:12, color:"#63B3ED", fontWeight:600 }}>AED {(row.value||0).toFixed(1)}B</div>
                    <div style={{ fontSize:12, color:T.textSecondary }}>{"AED "+(row.avgPpsf||0).toLocaleString()}</div>
                    <div>
                      <div style={{ fontSize:12, color:(row.offPlanPct||0)>=70?T.green:T.textSecondary, fontWeight:600 }}>{row.offPlanPct||0}%</div>
                      <div style={{ height:3, borderRadius:2, background:T.border, marginTop:4, width:"80%" }}>
                        <div style={{ height:"100%", width:(row.offPlanPct||0)+"%", borderRadius:2, background:T.green }} />
                      </div>
                    </div>
                    <div style={{ fontSize:12, color:(row.yoyGrowth||0)>=15?T.green:(row.yoyGrowth||0)>=8?T.gold:T.textMuted, fontWeight:600 }}>{row.yoyGrowth?"+"+row.yoyGrowth+"%":"—"}</div>
                    <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                      <div style={{ width:7, height:7, borderRadius:"50%", background:liq.color }} />
                      <span style={{ fontSize:10, color:liq.color, fontWeight:600 }}>{liq.label}</span>
                    </div>
                  </div>
                );
              })}
              {filtered.length===0 && <div style={{ padding:"40px 16px", textAlign:"center", color:T.textMuted, fontSize:12 }}>No communities match your filters</div>}
            </div>
          ) : (
            <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid "+T.border, borderRadius:12, padding:"20px" }}>
              <div style={{ fontSize:12, fontWeight:700, color:T.textSecondary, marginBottom:16 }}>
                {"Top 12 by "+(sortBy==="transactions"?"Volume":sortBy==="value"?"Value":sortBy==="ppsf"?"PPSF":sortBy==="growth"?"YoY Growth":"Off-Plan Share")}
              </div>
              <ResponsiveContainer width="100%" height={320}>
                <ComposedChart data={chartData} margin={{ top:5, right:20, left:0, bottom:60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="name" tick={{ fill:T.textMuted, fontSize:10 }} angle={-35} textAnchor="end" interval={0} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill:T.textMuted, fontSize:10 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<DLDTooltip />} cursor={{ fill:"rgba(212,168,67,0.05)" }} />
                  <Bar dataKey={sortBy==="transactions"?"transactions":sortBy==="value"?"value":"ppsf"} name={sortBy==="transactions"?"Transactions":sortBy==="value"?"Value (B)":"Avg PPSF"} radius={[5,5,0,0]} maxBarSize={50}>
                    {chartData.map((e,i) => <Cell key={i} fill={SECTOR_COLORS[e.sector]||T.gold} opacity={0.85} />)}
                  </Bar>
                </ComposedChart>
              </ResponsiveContainer>
              <div style={{ display:"flex", flexWrap:"wrap", gap:"4px 12px", marginTop:8 }}>
                {Object.entries(SECTOR_COLORS).map(([sec,col]) => (
                  <div key={sec} style={{ display:"flex", alignItems:"center", gap:4, cursor:"pointer", opacity:filterSector!=="All"&&filterSector!==sec?0.3:1 }} onClick={() => setFilterSector(filterSector===sec?"All":sec)}>
                    <div style={{ width:8, height:8, borderRadius:2, background:col }} />
                    <span style={{ fontSize:10, color:T.textMuted }}>{sec}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {selected && selectedData && (
          <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid "+(selectedLiq?.color||T.border)+"40", borderRadius:12, padding:"18px" }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:12 }}>
              <div>
                <div style={{ fontFamily:"'Fraunces',serif", fontSize:15, fontWeight:800, color:T.white, marginBottom:3 }}>{selectedData.community}</div>
                <div style={{ fontSize:10, color:SECTOR_COLORS[selectedData.sector]||T.textMuted }}>{selectedData.sector} · {selectedData.type}</div>
              </div>
              <button type="button" onClick={() => setSelected(null)} style={{ background:"none", border:"none", color:T.textMuted, cursor:"pointer", fontSize:18 }}>x</button>
            </div>
            <div style={{ padding:"10px 12px", borderRadius:8, background:(selectedLiq?.color||T.border)+"15", border:"1px solid "+(selectedLiq?.color||T.border)+"30", marginBottom:12 }}>
              <div style={{ fontSize:10, color:T.textMuted, marginBottom:2 }}>LIQUIDITY</div>
              <div style={{ fontSize:16, fontWeight:800, color:selectedLiq?.color, fontFamily:"'Fraunces',serif" }}>{selectedLiq?.label}</div>
              <div style={{ fontSize:11, color:T.textSecondary }}>{selectedLiq?.desc}</div>
            </div>
            {[
              { label:"Transactions (2025)", value:(selectedData.transactions||0).toLocaleString(), color:T.gold },
              { label:"Total Value", value:"AED "+(selectedData.value||0).toFixed(1)+"B", color:"#63B3ED" },
              { label:"Avg PPSF", value:"AED "+(selectedData.avgPpsf||0).toLocaleString(), color:T.textSecondary },
              { label:"Off-Plan Share", value:(selectedData.offPlanPct||0)+"%", color:selectedData.offPlanPct>=70?T.green:T.textSecondary },
              { label:"YoY Price Growth", value:selectedData.yoyGrowth?"+"+selectedData.yoyGrowth+"%":"—", color:(selectedData.yoyGrowth||0)>=15?T.green:T.gold },
            ].map((m,i) => (
              <div key={i} style={{ display:"flex", justifyContent:"space-between", padding:"7px 0", borderBottom:i<4?"1px solid "+T.border+"60":"none" }}>
                <span style={{ fontSize:11, color:T.textMuted }}>{m.label}</span>
                <span style={{ fontSize:13, fontWeight:700, color:m.color }}>{m.value}</span>
              </div>
            ))}
            {selectedData.note && (
              <div style={{ marginTop:10, padding:"10px 12px", background:"rgba(255,255,255,0.03)", borderRadius:8, fontSize:11, color:T.textSecondary, lineHeight:1.6 }}>
                {selectedData.note}
              </div>
            )}
            <button type="button" onClick={() => handleTabChange?.("Neighbourhoods")} style={{ width:"100%", marginTop:12, padding:"8px 0", background:"rgba(212,168,67,0.06)", border:"1px solid "+T.border, borderRadius:8, color:T.gold, fontSize:11, fontWeight:600, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>View Community Intel</button>
          </div>
        )}
      </div>

      {/* VALUE VS VOLUME */}
      <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid "+T.border, borderRadius:12, padding:"18px 20px", marginBottom:20 }}>
        <div style={{ fontFamily:"'Fraunces',serif", fontSize:14, fontWeight:700, color:T.white, marginBottom:4 }}>Value vs Volume: Two Different Stories</div>
        <div style={{ fontSize:11, color:T.textMuted, marginBottom:14 }}>High volume does not equal high value. Understanding this split is key to choosing the right investment strategy.</div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
          <div>
            <div style={{ fontSize:11, fontWeight:700, color:T.gold, marginBottom:10, textTransform:"uppercase", letterSpacing:0.8 }}>Top 5 by Transaction Volume</div>
            {[...rawData].sort((a,b) => (b.transactions||0)-(a.transactions||0)).slice(0,5).map((d,i) => (
              <div key={i} style={{ display:"flex", justifyContent:"space-between", padding:"6px 0", borderBottom:i<4?"1px solid "+T.border+"40":"none" }}>
                <span style={{ fontSize:11, color:T.textSecondary }}>{d.community}</span>
                <span style={{ fontSize:12, fontWeight:700, color:T.gold }}>{(d.transactions||0).toLocaleString()} tx</span>
              </div>
            ))}
            <div style={{ fontSize:10, color:T.textMuted, marginTop:8 }}>High volume = easy entry/exit. Best for investors needing liquidity.</div>
          </div>
          <div>
            <div style={{ fontSize:11, fontWeight:700, color:"#63B3ED", marginBottom:10, textTransform:"uppercase", letterSpacing:0.8 }}>Top 5 by Transaction Value</div>
            {[...rawData].sort((a,b) => (b.value||0)-(a.value||0)).slice(0,5).map((d,i) => (
              <div key={i} style={{ display:"flex", justifyContent:"space-between", padding:"6px 0", borderBottom:i<4?"1px solid "+T.border+"40":"none" }}>
                <span style={{ fontSize:11, color:T.textSecondary }}>{d.community}</span>
                <span style={{ fontSize:12, fontWeight:700, color:"#63B3ED" }}>AED {(d.value||0).toFixed(1)}B</span>
              </div>
            ))}
            <div style={{ fontSize:10, color:T.textMuted, marginTop:8 }}>High value = luxury demand, institutional capital, premium pricing power.</div>
          </div>
        </div>
      </div>

      {/* SOURCES */}
      <div style={{ paddingTop:16, borderTop:"1px solid "+T.border, display:"flex", flexWrap:"wrap", gap:8, alignItems:"center" }}>
        <span style={{ fontSize:10, color:T.textMuted }}>Sources:</span>
        {[
          {l:"DLD H1 2025 Official",u:"https://mediaoffice.ae/en/news/2025/july/20-07/dubai-real-estate-transactions-exceed-aed431-billion-in-h1-2025"},
          {l:"DXB Analytics DLD DB",u:"https://www.dxbanalytics.com/blog/dubai-property-transaction-volume-2026"},
          {l:"Cavendish Maxwell Q1 2025",u:"https://cavendishmaxwell.com/insights/market-reports/residential/dubai-residential-market-performance-q1-2025"},
          {l:"Dubai Home Feb 2026",u:"https://dubaihome.com/articles/dubai-apartment-market-2025"},
          {l:"DLD FY2025",u:"https://mediaoffice.ae/en/news/2026/january/12-01/dubais-real-estate-market-records-new-historic-milestone"},
        ].map(s => (
          <a key={s.l} href={s.u} target="_blank" rel="noopener noreferrer" style={{ textDecoration:"none" }}>
            <span style={{ fontSize:10, color:T.textMuted, padding:"2px 8px", borderRadius:10, border:"1px solid "+T.border, background:T.surfaceAlt, cursor:"pointer" }}>{s.l}</span>
          </a>
        ))}
      </div>

    </div>
  );
}

export default DLDVolumesTab;