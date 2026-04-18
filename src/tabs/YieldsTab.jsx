/* eslint-disable */
/* ═══════════════════════════════════════════════════════════════════
   DXB ANALYTICS — YIELDS TAB
   Extracted from EmaarDashboardV2.jsx
   Gross/net rental yields by community, yield calculator, rankings
   ═══════════════════════════════════════════════════════════════════ */

import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { T } from "../data";
import { SvgIcons } from "../components/Icons";
import { Section, Chart, CustomTooltip, KPI, ForecastCard, DataBadge, TabSources, LoadingSkeleton } from "../components/SharedUI";
import SEED_DATA from "../utils/seedData";
import SmartEmptyState from "../components/SmartEmptyState";

function YieldsTab({ liveYieldsData, yldSearch, setYldSearch, yldSort, setYldSort, yldType, setYldType, yldView, setYldView, yldCalcPrice, setYldCalcPrice, yldCalcRent, setYldCalcRent, yldCalcSC, setYldCalcSC, yldCalcSize, setYldCalcSize, yldCalcVacancy, setYldCalcVacancy, yldCalcMgmt, setYldCalcMgmt, globalFilters = {}, allDevelopers = [] }) {

  /* Phase 2.4 Batch 2: derive which communities match the global filter state.
     Returns a Set of lowercase community names that match, or null if no
     filter is active (meaning: show everything). */
  const gfDev = globalFilters?.developer && globalFilters.developer !== "all"
    ? String(globalFilters.developer).toLowerCase() : null;
  const gfCommunity = globalFilters?.community && globalFilters.community !== "all"
    ? String(globalFilters.community).toLowerCase() : null;
  const gfType = globalFilters?.type && globalFilters.type !== "all"
    ? String(globalFilters.type).toLowerCase() : null;

  const yldMatchingCommunities = (() => {
    if (!gfDev && !gfCommunity) return null; // no filter = show all
    let set = null;
    if (gfDev) {
      const dev = (allDevelopers || []).find(d =>
        String(d.id || "").toLowerCase() === gfDev ||
        String(d.name || "").toLowerCase() === gfDev ||
        String(d.name || "").toLowerCase().includes(gfDev)
      );
      if (dev && Array.isArray(dev.communities) && dev.communities.length > 0) {
        set = new Set(dev.communities.map(c => String(c).toLowerCase()));
      } else {
        set = new Set(); // unknown developer or no communities listed → empty
      }
    }
    if (gfCommunity) {
      if (set) {
        set = new Set([...set].filter(c => c === gfCommunity));
      } else {
        set = new Set([gfCommunity]);
      }
    }
    return set;
  })();

  /** Returns true if a yield row should be shown given the global filter */
  const yldMatchesGlobalFilter = (row) => {
    if (!row) return false;
    // Community check (developer + community filters)
    if (yldMatchingCommunities) {
      if (!yldMatchingCommunities.has(String(row.community || "").toLowerCase())) return false;
    }
    // Type check — strict equality. Map global filter slugs (e.g. "hotel_apartment")
    // to canonical row type strings ("Hotel Apartment") via TYPE_LABEL_MAP.
    // If user picks a type that doesn't exist in the data (e.g. Penthouse when
    // yields only contain Apartments + Villas), result is empty — honest.
    if (gfType) {
      const TYPE_LABEL_MAP = {
        "apartment": "apartment",
        "villa": "villa",
        "townhouse": "townhouse",
        "penthouse": "penthouse",
        "duplex": "duplex",
        "garden_home": "garden home",
        "sky_villa": "sky villa",
        "hotel_apartment": "hotel apartment",
        "serviced_apartment": "serviced apartment",
        "resort_villa": "resort villa",
        "branded_residence": "branded residence",
        "office": "office",
        "retail": "retail",
        "showroom": "showroom",
        "warehouse": "warehouse",
        "co_working_space": "co-working space",
        "land": "land",
      };
      const rowType = String(row.type || "").toLowerCase().trim();
      const wantedType = TYPE_LABEL_MAP[gfType] || gfType;
      if (rowType !== wantedType) return false;
    }
    return true;
  };

  // Human-readable label for the active filter, shown in empty state
  const gfLabel = (() => {
    const parts = [];
    if (gfDev) {
      const dev = (allDevelopers || []).find(d =>
        String(d.id).toLowerCase() === gfDev
      );
      parts.push(dev?.name || gfDev);
    }
    if (gfCommunity) parts.push(globalFilters.community);
    if (gfType) parts.push(globalFilters.type);
    return parts.join(" · ");
  })();


            /* ══ SEED DATA — Research-based 2026 ══
               Sources: DLD Ejari, Bayut, PropertyFinder, Cavendish Maxwell,
               themiddleeastinsider.com Apr 2026, sandsofwealth.com, valorisimo.com
            ════════════════════════════════════════ */
            const SEED_YIELDS = [
              /* ─── HIGH YIELD — Budget/Mid ─── */
              { id:"y01", community:"International City",     type:"Apartment", grossYield:9.2, netYield:7.8, avgRent:42000,  avgPrice:456000,  ppsf:650,  sc:6,   vacancy:8, trend:"+0.4%", trend3y:"+1.2%", tier:"High Yield",  badge:"#10B981", beds:{ studio:10.1, "1BR":8.8, "2BR":7.9 }, demand:"Very High", source:"themiddleeastinsider.com Apr 2026" },
              { id:"y02", community:"Discovery Gardens",      type:"Apartment", grossYield:8.5, netYield:7.1, avgRent:55000,  avgPrice:647000,  ppsf:800,  sc:8,   vacancy:6, trend:"+0.3%", trend3y:"+0.9%", tier:"High Yield",  badge:"#10B981", beds:{ studio:9.4, "1BR":8.2, "2BR":7.6 }, demand:"High",      source:"sandsofwealth.com 2026" },
              { id:"y03", community:"Jumeirah Village Circle",type:"Apartment", grossYield:7.8, netYield:6.4, avgRent:72000,  avgPrice:923000,  ppsf:1180, sc:12,  vacancy:6, trend:"+0.2%", trend3y:"+0.8%", tier:"High Yield",  badge:"#10B981", beds:{ studio:7.9, "1BR":7.0, "2BR":6.8, "3BR":7.2 }, demand:"Very High", source:"Bayut / GuestReady 2026" },
              { id:"y04", community:"Dubai Silicon Oasis",    type:"Apartment", grossYield:7.6, netYield:6.3, avgRent:60000,  avgPrice:789000,  ppsf:1100, sc:11,  vacancy:7, trend:"+0.1%", trend3y:"+0.6%", tier:"High Yield",  badge:"#10B981", beds:{ studio:8.2, "1BR":7.4, "2BR":6.8 }, demand:"High",      source:"valorisimo.com 2026" },
              { id:"y05", community:"Arjan",                  type:"Apartment", grossYield:7.5, netYield:6.1, avgRent:63000,  avgPrice:840000,  ppsf:1150, sc:13,  vacancy:7, trend:"+0.3%", trend3y:"+0.7%", tier:"High Yield",  badge:"#10B981", beds:{ studio:8.0, "1BR":7.3, "2BR":6.5 }, demand:"High",      source:"valorisimo.com 2026" },
              { id:"y06", community:"Al Furjan",              type:"Apartment", grossYield:7.2, netYield:5.9, avgRent:71000,  avgPrice:985000,  ppsf:1350, sc:14,  vacancy:7, trend:"+0.2%", trend3y:"+0.5%", tier:"High Yield",  badge:"#10B981", beds:{ "1BR":7.5, "2BR":6.8, "3BR":6.1 }, demand:"High",      source:"Cavendish Maxwell Q1 2026" },
              { id:"y07", community:"Jumeirah Lake Towers",   type:"Apartment", grossYield:8.1, netYield:6.5, avgRent:80000,  avgPrice:988000,  ppsf:1380, sc:16,  vacancy:5, trend:"+0.1%", trend3y:"+0.4%", tier:"High Yield",  badge:"#10B981", beds:{ studio:7.2, "1BR":8.2, "2BR":7.0, "3BR":6.5 }, demand:"Very High", source:"themiddleeastinsider.com Apr 2026" },
              /* ─── MID YIELD — Established ─── */
              { id:"y08", community:"Business Bay",           type:"Apartment", grossYield:7.6, netYield:5.8, avgRent:85000,  avgPrice:1120000, ppsf:2050, sc:18,  vacancy:6, trend:"+0.2%", trend3y:"+0.6%", tier:"Mid Yield",   badge:"#D4A843", beds:{ studio:7.8, "1BR":7.6, "2BR":6.9 }, demand:"Very High", source:"themiddleeastinsider.com Apr 2026" },
              { id:"y09", community:"Dubai Marina",           type:"Apartment", grossYield:6.8, netYield:5.0, avgRent:115000, avgPrice:1690000, ppsf:2280, sc:18,  vacancy:5, trend:"+0.1%", trend3y:"+0.3%", tier:"Mid Yield",   badge:"#D4A843", beds:{ studio:6.5, "1BR":6.8, "2BR":6.2, "3BR":5.5 }, demand:"High",      source:"GuestReady / Bayut 2026" },
              { id:"y10", community:"Dubai Hills Estate",     type:"Apartment", grossYield:6.2, netYield:4.9, avgRent:105000, avgPrice:1694000, ppsf:1850, sc:16,  vacancy:5, trend:"+0.1%", trend3y:"+0.5%", tier:"Mid Yield",   badge:"#D4A843", beds:{ "1BR":6.5, "2BR":6.0, "3BR":5.6 }, demand:"High",      source:"Cavendish Maxwell Q1 2026" },
              { id:"y11", community:"Dubai Creek Harbour",    type:"Apartment", grossYield:6.0, netYield:4.8, avgRent:95000,  avgPrice:1583000, ppsf:1942, sc:16,  vacancy:6, trend:"+0.3%", trend3y:"+0.9%", tier:"Mid Yield",   badge:"#D4A843", beds:{ "1BR":6.3, "2BR":5.9 }, demand:"High",      source:"Emaar IR / DLD Q1 2026" },
              { id:"y12", community:"Sobha Hartland",         type:"Apartment", grossYield:5.8, netYield:4.4, avgRent:110000, avgPrice:1897000, ppsf:2100, sc:18,  vacancy:5, trend:"+0.2%", trend3y:"+0.6%", tier:"Mid Yield",   badge:"#D4A843", beds:{ "1BR":6.0, "2BR":5.7, "3BR":5.2 }, demand:"High",      source:"Sobha IR / DLD Q1 2026" },
              /* ─── LOW YIELD — Premium ─── */
              { id:"y13", community:"Downtown Dubai",         type:"Apartment", grossYield:5.5, netYield:3.8, avgRent:175000, avgPrice:3182000, ppsf:3100, sc:28,  vacancy:4, trend:"0.0%",  trend3y:"+0.1%", tier:"Low Yield",   badge:"#3B82F6", beds:{ studio:5.8, "1BR":5.5, "2BR":5.0, "3BR":4.5 }, demand:"High",      source:"themiddleeastinsider.com Apr 2026" },
              { id:"y14", community:"Palm Jumeirah",          type:"Apartment", grossYield:5.5, netYield:3.9, avgRent:220000, avgPrice:4000000, ppsf:4800, sc:32,  vacancy:4, trend:"0.0%",  trend3y:"+0.2%", tier:"Low Yield",   badge:"#3B82F6", beds:{ "1BR":5.8, "2BR":5.5, "3BR":5.0 }, demand:"Medium",    source:"CBRE / DLD Q1 2026" },
              { id:"y15", community:"Emaar Beachfront",       type:"Apartment", grossYield:5.8, netYield:4.2, avgRent:165000, avgPrice:2845000, ppsf:2950, sc:20,  vacancy:5, trend:"+0.2%", trend3y:"+0.5%", tier:"Low Yield",   badge:"#3B82F6", beds:{ "1BR":6.0, "2BR":5.7, "3BR":5.1 }, demand:"High",      source:"Emaar IR / DLD Q1 2026" },
              /* ─── VILLAS ─── */
              { id:"y16", community:"Arabian Ranches",        type:"Villa",     grossYield:4.8, netYield:3.9, avgRent:215000, avgPrice:4479000, ppsf:1200, sc:4.5, vacancy:4, trend:"+0.2%", trend3y:"+0.8%", tier:"Villa Yield", badge:"#8B5CF6", beds:{ "3BR":4.9, "4BR":4.7, "5BR":4.5 }, demand:"High",      source:"Cavendish Maxwell Q1 2026" },
              { id:"y17", community:"Dubai Hills Estate",     type:"Villa",     grossYield:4.9, netYield:4.0, avgRent:280000, avgPrice:5714000, ppsf:1400, sc:5,   vacancy:4, trend:"+0.2%", trend3y:"+0.9%", tier:"Villa Yield", badge:"#8B5CF6", beds:{ "3BR":5.1, "4BR":4.8, "5BR":4.5 }, demand:"High",      source:"Knight Frank Q1 2026" },
              { id:"y18", community:"Tilal Al Ghaf",          type:"Villa",     grossYield:4.8, netYield:3.9, avgRent:245000, avgPrice:5104000, ppsf:1200, sc:5.5, vacancy:5, trend:"+0.3%", trend3y:"+1.1%", tier:"Villa Yield", badge:"#8B5CF6", beds:{ "4BR":4.9, "5BR":4.7 }, demand:"High",      source:"Knight Frank Q1 2026" },
              { id:"y19", community:"Palm Jumeirah",          type:"Villa",     grossYield:4.2, netYield:3.5, avgRent:800000, avgPrice:19048000,ppsf:3800, sc:6,   vacancy:4, trend:"0.0%",  trend3y:"+0.3%", tier:"Villa Yield", badge:"#8B5CF6", beds:{ "4BR":4.3, "5BR":4.1, "6BR+":3.9 }, demand:"Medium",    source:"CBRE / DLD Q1 2026" },

              /* ─── TOWNHOUSES ─── */
              { id:"y20", community:"Town Square",             type:"Townhouse", grossYield:7.5, netYield:6.3, avgRent:110000, avgPrice:1467000, ppsf:820,  sc:6,   vacancy:5, trend:"+0.2%", trend3y:"+0.7%", tier:"High Yield",  badge:"#10B981", beds:{ "3BR":7.6, "4BR":7.2 }, demand:"Very High", source:"Bayut 2025 / Engel & Völkers 2026" },
              { id:"y21", community:"DAMAC Hills 2",           type:"Townhouse", grossYield:7.2, netYield:6.0, avgRent:95000,  avgPrice:1319000, ppsf:800,  sc:5.5, vacancy:6, trend:"+0.3%", trend3y:"+0.9%", tier:"High Yield",  badge:"#10B981", beds:{ "3BR":7.4, "4BR":6.9 }, demand:"High",      source:"Engel & Völkers Dubai 2026" },
              { id:"y22", community:"DAMAC Hills",             type:"Townhouse", grossYield:6.2, netYield:5.1, avgRent:160000, avgPrice:2581000, ppsf:1150, sc:6,   vacancy:5, trend:"+0.2%", trend3y:"+0.6%", tier:"Mid Yield",   badge:"#D4A843", beds:{ "3BR":6.4, "4BR":6.0 }, demand:"High",      source:"ritukant.com Feb 2026" },
              { id:"y23", community:"Jumeirah Village Circle", type:"Townhouse", grossYield:6.8, netYield:5.5, avgRent:130000, avgPrice:1912000, ppsf:1250, sc:12,  vacancy:6, trend:"+0.2%", trend3y:"+0.7%", tier:"Mid Yield",   badge:"#D4A843", beds:{ "3BR":7.0, "4BR":6.5 }, demand:"High",      source:"Driven Properties 2026" },
              { id:"y24", community:"Arabian Ranches",         type:"Townhouse", grossYield:4.9, netYield:4.0, avgRent:195000, avgPrice:3980000, ppsf:1150, sc:5,   vacancy:4, trend:"+0.1%", trend3y:"+0.4%", tier:"Low Yield",   badge:"#3B82F6", beds:{ "3BR":5.0, "4BR":4.8 }, demand:"High",      source:"ritukant.com Feb 2026" },
              { id:"y25", community:"Dubai Hills Estate",      type:"Townhouse", grossYield:4.8, netYield:3.9, avgRent:230000, avgPrice:4792000, ppsf:1450, sc:5,   vacancy:4, trend:"+0.1%", trend3y:"+0.5%", tier:"Low Yield",   badge:"#3B82F6", beds:{ "3BR":4.9, "4BR":4.7 }, demand:"High",      source:"Knight Frank Q1 2026" },
              { id:"y26", community:"Mudon",                   type:"Townhouse", grossYield:5.8, netYield:4.8, avgRent:160000, avgPrice:2759000, ppsf:1050, sc:5,   vacancy:5, trend:"+0.2%", trend3y:"+0.5%", tier:"Mid Yield",   badge:"#D4A843", beds:{ "3BR":5.9, "4BR":5.6 }, demand:"High",      source:"Bayut 2025" },

              /* ─── PENTHOUSES ─── */
              { id:"y27", community:"Downtown Dubai",          type:"Penthouse", grossYield:5.8, netYield:4.0, avgRent:550000, avgPrice:9483000, ppsf:4200, sc:32,  vacancy:5, trend:"+0.1%", trend3y:"+0.3%", tier:"Mid Yield",   badge:"#D4A843", beds:{ "3BR":5.9, "4BR":5.7, "5BR":5.5 }, demand:"High",      source:"Property Kumbh 2026" },
              { id:"y28", community:"Palm Jumeirah",           type:"Penthouse", grossYield:5.5, netYield:3.8, avgRent:750000, avgPrice:13636000,ppsf:5200, sc:35,  vacancy:5, trend:"0.0%",  trend3y:"+0.2%", tier:"Low Yield",   badge:"#3B82F6", beds:{ "3BR":5.7, "4BR":5.4, "5BR":5.2 }, demand:"Medium",    source:"topultraluxury.com 2026" },
              { id:"y29", community:"Dubai Marina",            type:"Penthouse", grossYield:6.2, netYield:4.4, avgRent:385000, avgPrice:6210000, ppsf:3200, sc:22,  vacancy:5, trend:"+0.1%", trend3y:"+0.3%", tier:"Mid Yield",   badge:"#D4A843", beds:{ "3BR":6.4, "4BR":6.0 }, demand:"High",      source:"GuestReady Q1 2026" },

              /* ─── HOTEL APARTMENTS ─── */
              { id:"y30", community:"Palm Jumeirah",           type:"Hotel Apartment", grossYield:7.5, netYield:5.2, avgRent:230000, avgPrice:3067000, ppsf:3400, sc:38,  vacancy:8, trend:"+0.3%", trend3y:"+0.9%", tier:"High Yield",  badge:"#10B981", beds:{ studio:8.0, "1BR":7.5, "2BR":7.0 }, demand:"Very High", source:"topultraluxury.com / Serviced residence benchmark 2026" },
              { id:"y31", community:"Downtown Dubai",          type:"Hotel Apartment", grossYield:7.0, netYield:5.0, avgRent:195000, avgPrice:2786000, ppsf:3600, sc:36,  vacancy:8, trend:"+0.2%", trend3y:"+0.8%", tier:"High Yield",  badge:"#10B981", beds:{ studio:7.5, "1BR":7.0, "2BR":6.5 }, demand:"Very High", source:"Sands of Wealth 2026" },
            ];

            const rawDataUnfiltered = liveYieldsData?.length > 0 ? liveYieldsData : SEED_YIELDS;
            // Phase 2.4 Batch 2: apply top-bar global filters first.
            const rawData = rawDataUnfiltered.filter(yldMatchesGlobalFilter);

            const filtered = rawData.filter(d => {
              if (yldType !== "All" && d.type !== yldType) return false;
              if (yldSearch && !d.community.toLowerCase().includes(yldSearch.toLowerCase())) return false;
              return true;
            }).sort((a,b) => {
              if (yldSort === "gross")    return b.grossYield - a.grossYield;
              if (yldSort === "net")      return b.netYield - a.netYield;
              if (yldSort === "rent")     return b.avgRent - a.avgRent;
              if (yldSort === "price")    return b.avgPrice - a.avgPrice;
              if (yldSort === "community")return a.community.localeCompare(b.community);
              return 0;
            });

            /* ── KPIs (Phase 2.5.1: compute on filtered set, not just Apartments) ── */
            // Use 'filtered' rows so KPIs respect both the yldType pill and any
            // global filter from the top bar. Falls back to rawData if filtered is empty.
            const kpiRows = filtered.length > 0 ? filtered : rawData;
            const avgGross = kpiRows.length ? (kpiRows.reduce((s,d) => s+d.grossYield,0)/kpiRows.length).toFixed(1) : 0;
            const avgNet   = kpiRows.length ? (kpiRows.reduce((s,d) => s+d.netYield,0)/kpiRows.length).toFixed(1)   : 0;
            const topYield = [...kpiRows].sort((a,b) => b.grossYield - a.grossYield)[0];
            const lowYield = [...kpiRows].sort((a,b) => a.grossYield - b.grossYield)[0];
            // Dynamic KPI label — shows the active type filter, or "Overall" when no type filter
            const kpiTypeLabel = (yldType && yldType !== "All") ? ` (${yldType})` : "";

            /* ── Calculator ── */
            const calcGross   = yldCalcRent / yldCalcPrice * 100;
            const calcSCAed   = yldCalcSize * yldCalcSC;
            const calcVacAed  = yldCalcRent * (yldCalcVacancy/100);
            const calcMgmtAed = yldCalcRent * (yldCalcMgmt/100);
            const calcNetRent = yldCalcRent - calcSCAed - calcVacAed - calcMgmtAed;
            const calcNet     = calcNetRent / yldCalcPrice * 100;
            const calcPayback = yldCalcPrice / calcNetRent;

            const tierColor = { "High Yield":"#10B981","Mid Yield":"#D4A843","Low Yield":"#3B82F6","Villa Yield":"#8B5CF6" };
            const selSt = {
              background:T.surfaceAlt, border:`1px solid ${T.border}`, borderRadius:8,
              color:T.white, fontFamily:"'Outfit',sans-serif", fontSize:12,
              padding:"7px 28px 7px 10px", outline:"none", cursor:"pointer",
              appearance:"none", WebkitAppearance:"none",
              backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
              backgroundRepeat:"no-repeat", backgroundPosition:"right 8px center",
            };

            return (
              <div style={{ animation:"fadeUp 0.4s ease-out forwards" }}>

                {/* Header */}
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 0", marginBottom:16, borderBottom:`1px solid ${T.border}`, flexWrap:"wrap", gap:8 }}>
                  <div>
                    <div style={{ fontFamily:"'Fraunces',serif", fontSize:20, fontWeight:800, color:T.white }}>Rental Yield Intelligence</div>
                    <div style={{ fontSize:11, color:T.textMuted, marginTop:3 }}>Gross & net yields · Community comparison · DLD Ejari data · Yield calculator · 2026</div>
                  </div>
                  <div style={{ display:"flex", gap:8 }}>
                    {["table","chart","calculator"].map(v => (
                      <button key={v} type="button" onClick={() => setYldView(v)}
                        style={{ padding:"6px 14px", background:yldView===v?"rgba(212,168,67,0.15)":T.surfaceAlt, border:`1px solid ${yldView===v?"rgba(212,168,67,0.4)":T.border}`, borderRadius:8, color:yldView===v?T.gold:T.textMuted, fontSize:11, fontWeight:600, cursor:"pointer", fontFamily:"'Outfit',sans-serif", textTransform:"capitalize" }}>
                        {v}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Alert */}
                <div style={{ padding:"10px 16px", background:"rgba(16,185,129,0.06)", border:"1px solid rgba(16,185,129,0.25)", borderRadius:10, marginBottom:16, display:"flex", alignItems:"center", gap:10 }}>
                  {SvgIcons.TrendingUp({ width:14, height:14, style:{ color:T.green, flexShrink:0 } })}
                  <span style={{ fontSize:12, color:T.textSecondary }}>
                    <span style={{ color:T.green, fontWeight:700 }}>Dubai zero-tax advantage</span> — A 7% yield in Dubai equals ~10-12% gross in London after UK taxes. No income tax, no capital gains tax. Net yields are 1.5–2% below gross after service charges and vacancy. <span style={{ color:T.gold }}>International City leads at 9.2%.</span>
                  </span>
                </div>

                {/* KPIs */}
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))", gap:10, marginBottom:20 }}>
                  {[
                    { label:"Avg Gross"+kpiTypeLabel,  value:kpiRows.length ? avgGross+"%" : "—",                                   color:T.green  },
                    { label:"Avg Net"+kpiTypeLabel,    value:kpiRows.length ? avgNet+"%" : "—",                                     color:T.teal   },
                    { label:"Highest Yield",     value:topYield ? topYield.grossYield+"%" : "—",                                    color:T.green  },
                    { label:"Best Community",    value:topYield ? (topYield.community || "").split(" ")[0] : "—",                   color:T.white  },
                    { label:"Lowest Yield",      value:lowYield ? lowYield.grossYield+"%" : "—",                                    color:"#3B82F6"},
                    { label:"Communities Tracked",value:filtered.length,                                                             color:T.gold   },
                  ].map((k,i) => (
                    <div key={i} className="kpi-card">
                      <div style={{ fontSize:10, fontWeight:700, color:T.textMuted, letterSpacing:1, textTransform:"uppercase", marginBottom:8 }}>{k.label}</div>
                      <div style={{ fontFamily:"'Fraunces',serif", fontSize:22, fontWeight:800, color:k.color }}>{k.value}</div>
                    </div>
                  ))}
                </div>

                {/* Filters */}
                <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:"12px 14px", marginBottom:16 }}>
                  <div style={{ display:"flex", gap:8, flexWrap:"wrap", alignItems:"center" }}>
                    <div style={{ position:"relative", flex:"0 0 200px" }}>
                      {SvgIcons.Search({ width:13, height:13, style:{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", color:T.textMuted, pointerEvents:"none" } })}
                      <input value={yldSearch} onChange={e => setYldSearch(e.target.value)} placeholder="Search community..."
                        style={{ ...selSt, paddingLeft:30, paddingRight:10, width:"100%", backgroundImage:"none" }} />
                    </div>
                    {["All", ...Array.from(new Set(rawData.map(d => d.type).filter(Boolean))).sort()].map(f => (
                      <button key={f} type="button" onClick={() => setYldType(f)}
                        style={{ padding:"6px 14px", background:yldType===f?"rgba(212,168,67,0.15)":T.surfaceAlt, border:`1px solid ${yldType===f?"rgba(212,168,67,0.4)":T.border}`, borderRadius:8, color:yldType===f?T.gold:T.textMuted, fontSize:11, fontWeight:yldType===f?700:400, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>
                        {f}
                      </button>
                    ))}
                    <select value={yldSort} onChange={e => setYldSort(e.target.value)} style={{ ...selSt, marginLeft:"auto" }}>
                      <option value="gross">Sort: Gross Yield</option>
                      <option value="net">Sort: Net Yield</option>
                      <option value="rent">Sort: Annual Rent</option>
                      <option value="price">Sort: Avg Price</option>
                      <option value="community">Sort: A-Z</option>
                    </select>
                  </div>
                </div>

                {/* TABLE VIEW */}
                {yldView === "table" && (
                  <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:12, overflow:"hidden", marginBottom:20 }}>
                    <div style={{ display:"grid", gridTemplateColumns:"2fr 0.8fr 0.8fr 0.8fr 1fr 1fr 1fr 0.8fr", padding:"10px 16px", background:T.surfaceAlt, borderBottom:`1px solid ${T.border}` }}>
                      {["Community","Type","Gross %","Net %","Avg Rent","Avg Price","PPSF","Vacancy"].map((h,i) => (
                        <div key={i} style={{ fontSize:10, fontWeight:700, color:T.textMuted, letterSpacing:0.8, textTransform:"uppercase" }}>{h}</div>
                      ))}
                    </div>
                    {filtered.map((d,i) => (
                      <div key={d.id} style={{ display:"grid", gridTemplateColumns:"2fr 0.8fr 0.8fr 0.8fr 1fr 1fr 1fr 0.8fr", padding:"12px 16px", borderBottom:i<filtered.length-1?`1px solid ${T.border}`:"none", alignItems:"center" }}
                        onMouseEnter={e => e.currentTarget.style.background="rgba(212,168,67,0.03)"}
                        onMouseLeave={e => e.currentTarget.style.background="transparent"}>
                        <div>
                          <div style={{ fontSize:13, fontWeight:600, color:T.white }}>{d.community}</div>
                          <div style={{ display:"flex", gap:6, marginTop:3 }}>
                            <span style={{ fontSize:10, padding:"1px 6px", borderRadius:6, background:(tierColor[d.tier]||T.gold)+"22", color:tierColor[d.tier]||T.gold, fontWeight:700 }}>{d.tier}</span>
                            <span style={{ fontSize:10, color:T.textMuted }}>{d.demand} demand</span>
                          </div>
                        </div>
                        <div style={{ fontSize:11, color:T.textMuted }}>{d.type}</div>
                        <div style={{ fontFamily:"'Fraunces',serif", fontSize:16, fontWeight:800, color:d.grossYield>=8?T.green:d.grossYield>=6?"#D4A843":d.grossYield>=5?"#3B82F6":T.red }}>{d.grossYield}%</div>
                        <div style={{ fontFamily:"'Fraunces',serif", fontSize:14, fontWeight:700, color:T.teal }}>{d.netYield}%</div>
                        <div style={{ fontSize:12, color:T.white }}>AED {(d.avgRent/1000).toFixed(0)}K</div>
                        <div style={{ fontSize:12, color:T.textMuted }}>AED {d.avgPrice >= 1000000 ? (d.avgPrice/1000000).toFixed(2)+"M" : (d.avgPrice/1000).toFixed(0)+"K"}</div>
                        <div style={{ fontSize:12, color:T.textMuted }}>AED {d.ppsf.toLocaleString()}</div>
                        <div style={{ fontSize:12, color:d.vacancy<=4?T.green:d.vacancy<=7?T.gold:T.red }}>{d.vacancy}%</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* CHART VIEW — horizontal yield bars */}
                {yldView === "chart" && (
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:20 }}>
                    <div className="chart-box" style={{ padding:20 }}>
                      <div style={{ fontSize:13, fontWeight:700, color:T.white, marginBottom:4 }}>Gross Yield by Community</div>
                      <div style={{ fontSize:11, color:T.textMuted, marginBottom:16 }}>Ranked highest to lowest · 2026 DLD Ejari data</div>
                      {[...filtered].sort((a,b) => b.grossYield - a.grossYield).slice(0,10).map((d,i) => (
                        <div key={i} style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
                          <div style={{ fontSize:11, color:T.textSecondary, minWidth:130, textAlign:"right" }}>{d.community.split(" ").slice(0,2).join(" ")}</div>
                          <div style={{ flex:1, height:22, borderRadius:4, background:T.border, overflow:"hidden" }}>
                            <div style={{ height:"100%", width:`${(d.grossYield/10)*100}%`, background:d.grossYield>=8?T.green:d.grossYield>=6?"#D4A843":"#3B82F6", borderRadius:4, display:"flex", alignItems:"center", paddingLeft:6 }}>
                              <span style={{ fontSize:10, fontWeight:700, color:"#000" }}>{d.grossYield}%</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="chart-box" style={{ padding:20 }}>
                      <div style={{ fontSize:13, fontWeight:700, color:T.white, marginBottom:4 }}>Gross vs Net Yield Gap</div>
                      <div style={{ fontSize:11, color:T.textMuted, marginBottom:16 }}>Service charges + vacancy impact · Net is what you keep</div>
                      {[...filtered].sort((a,b) => b.grossYield - a.grossYield).slice(0,8).map((d,i) => (
                        <div key={i} style={{ marginBottom:12 }}>
                          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
                            <span style={{ fontSize:11, color:T.textSecondary }}>{d.community.split(" ").slice(0,2).join(" ")}</span>
                            <span style={{ fontSize:11, color:T.textMuted }}>Gap: <span style={{ color:"#F97316", fontWeight:700 }}>{(d.grossYield - d.netYield).toFixed(1)}%</span></span>
                          </div>
                          <div style={{ position:"relative", height:12, borderRadius:4, background:T.border }}>
                            <div style={{ position:"absolute", left:0, height:"100%", width:`${(d.grossYield/10)*100}%`, background:T.gold+"44", borderRadius:4 }} />
                            <div style={{ position:"absolute", left:0, height:"100%", width:`${(d.netYield/10)*100}%`, background:T.green, borderRadius:4 }} />
                          </div>
                          <div style={{ display:"flex", justifyContent:"space-between", marginTop:2 }}>
                            <span style={{ fontSize:9, color:T.textMuted }}>Net {d.netYield}%</span>
                            <span style={{ fontSize:9, color:T.textMuted }}>Gross {d.grossYield}%</span>
                          </div>
                        </div>
                      ))}
                      <div style={{ display:"flex", gap:12, marginTop:8 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:4 }}><div style={{ width:10, height:6, borderRadius:2, background:T.green }} /><span style={{ fontSize:10, color:T.textMuted }}>Net yield</span></div>
                        <div style={{ display:"flex", alignItems:"center", gap:4 }}><div style={{ width:10, height:6, borderRadius:2, background:T.gold+"44" }} /><span style={{ fontSize:10, color:T.textMuted }}>Gross yield</span></div>
                      </div>
                    </div>
                  </div>
                )}

                {/* CALCULATOR VIEW */}
                {yldView === "calculator" && (
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:20 }}>
                    <div className="chart-box" style={{ padding:24 }}>
                      <div style={{ fontFamily:"'Fraunces',serif", fontSize:14, fontWeight:700, color:T.white, marginBottom:4 }}>Net Yield Calculator</div>
                      <div style={{ fontSize:11, color:T.textMuted, marginBottom:20 }}>True return after all Dubai ownership costs</div>
                      {[
                        { label:"Purchase Price (AED)", val:yldCalcPrice, min:400000,  max:20000000, step:50000,  set:setYldCalcPrice, fmt:v=>"AED "+v.toLocaleString() },
                        { label:"Annual Rent (AED)",    val:yldCalcRent,  min:20000,   max:500000,   step:5000,   set:setYldCalcRent,  fmt:v=>"AED "+v.toLocaleString() },
                        { label:"Property Size (sqft)", val:yldCalcSize,  min:200,     max:10000,    step:50,     set:setYldCalcSize,  fmt:v=>v.toLocaleString()+" sqft" },
                        { label:"Service Charge (AED/sqft/yr)", val:yldCalcSC, min:2, max:40,       step:0.5,    set:setYldCalcSC,    fmt:v=>"AED "+v+"/sqft" },
                        { label:"Management Fee (%)",   val:yldCalcMgmt,  min:0,       max:15,       step:0.5,    set:setYldCalcMgmt,  fmt:v=>v+"%" },
                        { label:"Vacancy Buffer (%)",   val:yldCalcVacancy,min:0,      max:20,       step:1,      set:setYldCalcVacancy,fmt:v=>v+"%" },
                      ].map((f,i) => (
                        <div key={i} style={{ marginBottom:14 }}>
                          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                            <span style={{ fontSize:11, color:T.textMuted }}>{f.label}</span>
                            <span style={{ fontSize:12, fontWeight:700, color:T.gold }}>{f.fmt(f.val)}</span>
                          </div>
                          <input type="range" min={f.min} max={f.max} step={f.step} value={f.val}
                            onChange={e => f.set(Number(e.target.value))}
                            style={{ width:"100%", accentColor:T.gold, cursor:"pointer" }} />
                        </div>
                      ))}
                    </div>
                    <div className="chart-box" style={{ padding:24 }}>
                      <div style={{ fontFamily:"'Fraunces',serif", fontSize:14, fontWeight:700, color:T.white, marginBottom:20 }}>Your Investment Returns</div>
                      {[
                        { label:"Annual Rent",          val:"AED "+yldCalcRent.toLocaleString(),      color:T.white },
                        { label:"Service Charges",      val:"AED "+Math.round(calcSCAed).toLocaleString(), color:T.red, note:"-" },
                        { label:"Vacancy Loss",         val:"AED "+Math.round(calcVacAed).toLocaleString(), color:T.red, note:"-" },
                        { label:"Management Fee",       val:"AED "+Math.round(calcMgmtAed).toLocaleString(), color:T.red, note:"-" },
                        { label:"Net Rental Income",    val:"AED "+Math.round(calcNetRent).toLocaleString(), color:T.green },
                      ].map((r,i) => (
                        <div key={i} style={{ display:"flex", justifyContent:"space-between", padding:"9px 0", borderBottom:i<4?`1px solid ${T.border}`:"none" }}>
                          <span style={{ fontSize:12, color:T.textMuted }}>{r.note && <span style={{ color:T.red, marginRight:4 }}>{r.note}</span>}{r.label}</span>
                          <span style={{ fontSize:13, fontWeight:700, color:r.color }}>{r.val}</span>
                        </div>
                      ))}
                      <div style={{ marginTop:16, display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 }}>
                        {[
                          { label:"GROSS YIELD",   val:calcGross.toFixed(1)+"%", color:T.gold  },
                          { label:"NET YIELD",     val:calcNet.toFixed(1)+"%",   color:T.green },
                          { label:"PAYBACK YRS",   val:calcPayback > 0 ? calcPayback.toFixed(0)+"y" : "∞", color:T.teal },
                        ].map((m,i) => (
                          <div key={i} style={{ padding:"12px 10px", background:T.surfaceAlt, borderRadius:10, border:`1px solid ${T.border}`, textAlign:"center" }}>
                            <div style={{ fontSize:9, color:T.textMuted, textTransform:"uppercase", letterSpacing:0.8, marginBottom:5 }}>{m.label}</div>
                            <div style={{ fontFamily:"'Fraunces',serif", fontSize:20, fontWeight:900, color:m.color }}>{m.val}</div>
                          </div>
                        ))}
                      </div>
                      <div style={{ marginTop:12, padding:"10px 12px", background:"rgba(16,185,129,0.05)", borderRadius:8, border:`1px solid rgba(16,185,129,0.15)`, fontSize:11, color:T.textMuted, lineHeight:1.7 }}>
                        Dubai zero income tax — your net yield IS your after-tax return. Equivalent to {(calcNet * 1.45).toFixed(1)}% gross in UK or {(calcNet * 1.35).toFixed(1)}% gross in Germany.
                      </div>
                    </div>
                  </div>
                )}

                {/* Bed breakdown for selected community */}
                {yldView === "table" && filtered.length > 0 && (
                  <div className="chart-box" style={{ padding:20, marginBottom:16 }}>
                    <div style={{ fontSize:13, fontWeight:700, color:T.white, marginBottom:4 }}>Yield by Bedroom Type</div>
                    <div style={{ fontSize:11, color:T.textMuted, marginBottom:16 }}>Studios and 1BRs typically outperform larger units on yield percentage</div>
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:10 }}>
                      {filtered.slice(0,6).map((d,i) => (
                        <div key={i} style={{ padding:"12px 14px", background:T.surfaceAlt, borderRadius:10, border:`1px solid ${T.border}` }}>
                          <div style={{ fontSize:12, fontWeight:700, color:T.white, marginBottom:8 }}>{d.community}</div>
                          <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                            {Object.entries(d.beds||{}).map(([bed, yld]) => (
                              <div key={bed} style={{ padding:"3px 8px", borderRadius:6, background:yld>=8?"rgba(16,185,129,0.15)":yld>=6?"rgba(212,168,67,0.15)":"rgba(59,130,246,0.15)", border:`1px solid ${yld>=8?T.green:yld>=6?T.gold:"#3B82F6"}30` }}>
                                <span style={{ fontSize:9, color:T.textMuted }}>{bed} </span>
                                <span style={{ fontSize:11, fontWeight:700, color:yld>=8?T.green:yld>=6?T.gold:"#3B82F6" }}>{yld}%</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Phase 3.8: Smart empty state — aware of global + local filters */}
                {filtered.length === 0 && (
                  <SmartEmptyState
                    rowsAll={rawDataUnfiltered}
                    filters={{
                      /* Compose standard filter keys the component recognizes.
                         Local yldType wins over global type for the "type" chip. */
                      developer: globalFilters?.developer && globalFilters.developer !== "all" ? globalFilters.developer : "all",
                      community: globalFilters?.community && globalFilters.community !== "all" ? globalFilters.community : "all",
                      type: yldType !== "All"
                        ? yldType
                        : (globalFilters?.type && globalFilters.type !== "all" ? globalFilters.type : "all"),
                    }}
                    allDevelopers={allDevelopers}
                    entityLabel="yield rows"
                    onRemoveFilter={(key) => {
                      /* Only yldType is removable inside the tab; globals require top-bar interaction.
                         Still useful: offers suggestions that reveal which filter combo would work. */
                      if (key === "type" && yldType !== "All") setYldType("All");
                    }}
                    onClearAll={() => {
                      setYldType("All"); setYldSearch("");
                      /* Reset global filters via the URL (Phase 2.3's URL-state source of truth). */
                      try {
                        const u = new URL(window.location.href);
                        ["developer","community","type","subType","beds","status","priceMin","priceMax"].forEach(k => u.searchParams.delete(k));
                        window.history.replaceState({}, "", u.toString());
                        window.dispatchEvent(new Event("popstate"));
                      } catch {}
                    }}
                    matchFn={(d, filters) => {
                      if (!d) return false;
                      const TYPE_MAP = { apartment:"apartment", villa:"villa", townhouse:"townhouse", penthouse:"penthouse", duplex:"duplex", garden_home:"garden home", sky_villa:"sky villa", hotel_apartment:"hotel apartment", serviced_apartment:"serviced apartment", resort_villa:"resort villa", branded_res:"branded residence" };
                      if (filters.type && filters.type !== "all") {
                        // Two cases: (a) local yldType → already canonical label like "Villa"
                        //            (b) global slug like "duplex" → map to label
                        const raw = String(filters.type).toLowerCase();
                        const needed = TYPE_MAP[raw] || raw;
                        if (String(d.type || "").toLowerCase() !== needed) return false;
                      }
                      if (filters.community && filters.community !== "all") {
                        if (String(d.community || "").toLowerCase() !== String(filters.community).toLowerCase()) return false;
                      }
                      if (filters.developer && filters.developer !== "all") {
                        const dev = (allDevelopers || []).find(x =>
                          String(x.id || "").toLowerCase() === String(filters.developer).toLowerCase() ||
                          String(x.name || "").toLowerCase() === String(filters.developer).toLowerCase()
                        );
                        const devCommunities = (dev?.communities || []).map(c => String(c).toLowerCase());
                        if (devCommunities.length > 0 && !devCommunities.includes(String(d.community || "").toLowerCase())) return false;
                      }
                      return true;
                    }}
                    T={T}
                  />
                )}

                {/* Seed notice */}
                {!liveYieldsData?.length && (
                  <div style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 14px", borderRadius:8, background:"rgba(212,168,67,0.06)", border:`1px solid rgba(212,168,67,0.2)`, marginBottom:12 }}>
                    <span style={{ width:6, height:6, borderRadius:"50%", background:T.gold, display:"inline-block" }} />
                    <span style={{ fontSize:11, color:T.textMuted }}><span style={{ color:T.gold, fontWeight:700 }}>2026 research data</span> — DLD Ejari, Bayut, themiddleeastinsider.com, Cavendish Maxwell, Knight Frank Q1 2026</span>
                  </div>
                )}

                {/* Sources */}
                <div style={{ paddingTop:12, borderTop:`1px solid ${T.border}`, display:"flex", gap:8, flexWrap:"wrap" }}>
                  <span style={{ fontSize:10, color:T.textMuted }}>Sources:</span>
                  {["DLD Ejari 2026","Bayut","Cavendish Maxwell Q1 2026","Knight Frank","themiddleeastinsider.com","sandsofwealth.com"].map((s,i) => (
                    <span key={i} style={{ fontSize:10, color:T.textMuted, padding:"2px 8px", borderRadius:10, border:`1px solid ${T.border}`, background:T.surfaceAlt }}>{s}</span>
                  ))}
                </div>

              </div>

            );
}

export default YieldsTab;
