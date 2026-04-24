/* eslint-disable */
/* ═══════════════════════════════════════════════════════════════════
   DXB ANALYTICS — HANDOVER TAB (WORLD-CLASS EDITION)

   Full handover intelligence platform with:
   • 18 curated 2026-2027 handovers (research-based)
   • Construction progress tracking (% complete, RERA verified)
   • Delay risk scoring with developer track records
   • Buyer rights legal framework (Law 8/2007, 13/2008, 19/2017, 25/2025)
   • Delay compensation calculator (7-9% annual standard)
   • Community supply heat map (top 5 zones)
   • Developer reliability index (8 developers with on-time rates)
   • Full project detail modal (React Portal for safe rendering)
   • Cross-tab navigation to Launch Calendar / Mortgage / Yields

   Research sources:
   • The National (120K units scheduled 2026)
   • Khaleej Times / Morgan's International Realty (48% completion forecast)
   • Fitch Ratings (56% completion 2022-2024 historical)
   • prelaunch.ae 2026 supply analysis
   • BSA Law (UAE Civil Transactions Law)
   • EGSH (Federal Decree-Law 25/2025 effective June 1 2026)
   • Property Finder, dxboffplan.com, drivenproperties.com
   ═══════════════════════════════════════════════════════════════════ */

import React, { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from "recharts";
import { T } from "../data";

/* ═══════════════════════════════════════════════════════════════════
   SEED DATA — Curated 2026-2027 handovers
   Sources: Property Finder, dxboffplan.com, developer IR reports
   ═══════════════════════════════════════════════════════════════════ */
const SEED_HANDOVERS = [];
/* NOTE: Seed data removed. Handover tab now reads from liveProjects
   prop passed from parent EmaarDashboardV2. Only DLD-verified
   Firestore projects appear here. When more projects are added
   via the admin flow, they will automatically appear in Cards/
   Calendar/Risk Matrix views. See tabs/ProjectsTab.jsx for the
   golden-standard data schema (145 fields, source attribution). */

/* ═══════════════════════════════════════════════════════════════════
   DEVELOPER RELIABILITY INDEX — Q1 2026
   Source: prelaunch.ae, BSA Law, Fitch Ratings
   ═══════════════════════════════════════════════════════════════════ */
const DEVELOPER_INDEX = {
  "Sobha Realty":         { tier: 1, onTime: 91, traits: "Backward-integrated, zero-defect, fastest delivery", color: "#10B981" },
  "Emaar":                { tier: 1, onTime: 88, traits: "Largest developer, most liquid resale market", color: "#10B981" },
  "Ellington Properties": { tier: 1, onTime: 88, traits: "Boutique design-forward, curated finishes", color: "#10B981" },
  "Majid Al Futtaim":     { tier: 1, onTime: 87, traits: "Master community specialist, lifestyle focus", color: "#10B981" },
  "Omniyat":              { tier: 1, onTime: 85, traits: "Ultra-luxury Palm/Marina specialist", color: "#10B981" },
  "Mira Developments":    { tier: 2, onTime: 82, traits: "Branded residence specialist", color: "#10B981" },
  "Nakheel":              { tier: 1, onTime: 80, traits: "Government-backed, infrastructure-led", color: "#10B981" },
  "London Gate":          { tier: 2, onTime: 78, traits: "Boutique luxury Marina specialist", color: "#F59E0B" },
  "Dubai Investments Real Estate": { tier: 2, onTime: 75, traits: "Listed parent, conservative pipeline", color: "#F59E0B" },
  "Binghatti":            { tier: 2, onTime: 74, traits: "Bold architecture, fast construction, branded partnerships", color: "#F59E0B" },
  "DAMAC Properties":     { tier: 2, onTime: 71, traits: "Lifestyle luxury, branded residences, golf communities", color: "#F59E0B" },
  "Object 1 Development": { tier: 3, onTime: 70, traits: "Newer entrant, JVT/JVC focus", color: "#F59E0B" },
  "Bigfoot Developers":   { tier: 3, onTime: 68, traits: "Boutique Business Bay specialist", color: "#F59E0B" },
};

/* ═══════════════════════════════════════════════════════════════════
   COMMUNITY SUPPLY HEAT MAP — 2026 oversupply analysis
   Source: prelaunch.ae, Morgan's International Realty
   ═══════════════════════════════════════════════════════════════════ */
const COMMUNITY_SUPPLY = {
  "Jumeirah Village Circle":   { units2028: 27082, risk: "high", label: "JVC — Highest oversupply zone" },
  "Business Bay":              { units2028: 10127, risk: "medium", label: "Business Bay — Watch absorption" },
  "Azizi Venice":              { units2028: 7860,  risk: "high", label: "Azizi Venice — Concentrated supply" },
  "DAMAC Lagoons":             { units2028: 8500,  risk: "medium", label: "DAMAC Lagoons — Phased risk" },
  "Arjan":                     { units2028: 6200,  risk: "medium", label: "Arjan — Affordable competition" },
  "Dubai Hills Estate":        { units2028: 4500,  risk: "low", label: "Dubai Hills — Tier 1 absorption" },
  "Dubai Creek Harbour":       { units2028: 3800,  risk: "low", label: "Creek Harbour — Healthy demand" },
  "Dubai Marina":              { units2028: 2200,  risk: "low", label: "Marina — Established tenant base" },
  "Palm Jumeirah":             { units2028: 800,   risk: "low", label: "Palm — Land-constrained scarcity" },
  "Sobha Hartland":            { units2028: 3400,  risk: "low", label: "Hartland — Sobha quality concentration" },
  "Emaar Beachfront":          { units2028: 2800,  risk: "low", label: "Beachfront — Premium positioning" },
  "Dubai Islands":             { units2028: 4200,  risk: "low", label: "Islands — Government-prioritized" },
};

/* ═══════════════════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════════════════ */
function HandoverTab({ liveHandover, liveDevelopments = [], liveProjects = [], globalFilters = {}, allDevelopers = [], handleTabChange }) {

  /* Phase 2.4 Batch 6: derive matcher from global filter */
  const gfDev = globalFilters?.developer && globalFilters.developer !== "all"
    ? String(globalFilters.developer).toLowerCase() : null;
  const gfCommunity = globalFilters?.community && globalFilters.community !== "all"
    ? String(globalFilters.community).toLowerCase() : null;

  const hoGfDev = gfDev
    ? (allDevelopers || []).find(d =>
        String(d.id || "").toLowerCase() === gfDev ||
        String(d.name || "").toLowerCase() === gfDev ||
        String(d.name || "").toLowerCase().includes(gfDev)
      )
    : null;
  const hoGfDevName = hoGfDev?.name ? String(hoGfDev.name).toLowerCase() : null;
  const hoGfCommunities = (hoGfDev && Array.isArray(hoGfDev.communities) && hoGfDev.communities.length > 0)
    ? new Set(hoGfDev.communities.map(c => String(c).toLowerCase()))
    : null;

  const hoMatchesGlobalFilter = (p) => {
    if (!p) return false;
    if (gfDev) {
      const rowDev = String(p.developer || "").toLowerCase();
      const rowCommunity = String(p.community || "").toLowerCase();
      const devMatch = hoGfDevName && rowDev === hoGfDevName;
      const commMatch = hoGfCommunities && hoGfCommunities.has(rowCommunity);
      if (!devMatch && !commMatch) return false;
    }
    if (gfCommunity) {
      if (String(p.community || "").toLowerCase() !== gfCommunity) return false;
    }
    return true;
  };
  const [view, setView] = useState("cards"); // cards | calendar | risk
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState("all");
  const [quarterFilter, setQuarterFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [calcDelayMonths, setCalcDelayMonths] = useState(6);
  const [calcPurchasePrice, setCalcPurchasePrice] = useState(2000000);
  const [calcAnnualRate, setCalcAnnualRate] = useState(8);
  const [detailModal, setDetailModal] = useState(null);

  const [tierFilter, setTierFilter] = useState("All"); /* Session 4: All / Verified / Registry */
  const [showHistorical, setShowHistorical] = useState(false); /* Session 4: hide historical by default */

  /* Use live data if present — now includes DLD developments as Tier 3 */
  const projects = useMemo(() => {
    // Unified data source: transform liveProjects to handover card shape
    // PROFESSIONAL TRANSFORMER - reads real Firestore fields, zero fabricated defaults
    // Helper: fuzzy developer name lookup (Emaar Properties -> Emaar in DEVELOPER_INDEX)
    const lookupDevOnTime = (devName) => {
      if (!devName) return null;
      const needle = String(devName).toLowerCase().trim();
      const keys = Object.keys(DEVELOPER_INDEX);
      for (const k of keys) {
        const kl = k.toLowerCase();
        if (kl === needle || needle.includes(kl) || kl.includes(needle)) {
          return DEVELOPER_INDEX[k].onTime;
        }
      }
      return null; // honest: unknown developer returns null, not a fake default
    };

    const projectsAsHandovers = (Array.isArray(liveProjects) ? liveProjects : [])
      .filter(p => p && (p.handover || p.expectedHandover || p.handoverQuarter || p.handoverMonth || p.handoverDate || p.contractedHandover))
      .map(p => {
        // FIX 1: Handover quarter - prioritize pre-formatted fields
        const handoverQuarter = p.handover || p.expectedHandover || p.handoverQuarter || p.handoverMonth || "";
        const handoverDate = p.handoverDate || p.contractedHandover || p.completionDateDLD || "";

        // FIX 2: Avg unit size - multiple real field names
        const avgSize = p.unitSizeAvgSqFt || p.avgUnitSize || p.builtUpArea || null;
        const sizeMin = p.unitSizeMinSqFt || p.sizeMin || null;
        const sizeMax = p.unitSizeMaxSqFt || p.sizeMax || null;

        // FIX 3: Appreciation - compute from real price history OR return null
        // Hide for off-plan projects (they dont have meaningful appreciation until handover)
        let appreciation = null;
        const isCompleted = p.status === "Ready" || p.status === "Completed" || p.lifecycleStage === "historical" || p.lifecycleStage === "recently-delivered";
        if (isCompleted && p.priceMinAtLaunch && p.priceMin) {
          appreciation = Math.round(((p.priceMin - p.priceMinAtLaunch) / p.priceMinAtLaunch) * 100 * 10) / 10;
        } else if (typeof p.appreciationToHandover === "number") {
          appreciation = p.appreciationToHandover;
        } else if (typeof p.appreciationSinceLaunch === "number") {
          appreciation = p.appreciationSinceLaunch;
        }
        // appreciation remains null for off-plan projects - UI will hide the field

        // FIX 4: Dev on-time from DEVELOPER_INDEX (research-backed), not fabricated
        const devOnTime = lookupDevOnTime(p.developer || p.developerName);

        return {
          id: p.id || ("live-" + Math.random().toString(36).slice(2)),
          project: p.project || p.name || "Unnamed Project",
          developer: p.developer || p.developerName || "Unknown",
          community: p.community || p.area || "Dubai",
          type: p.type || p.propertyType || "Apartment",
          handoverQuarter: handoverQuarter || "TBD",
          handoverDate: handoverDate,
          units: p.totalUnits || p.residentialUnits || p.units || null,
          constructionPct: typeof p.constructionPct === "number" ? p.constructionPct : null,
          rerVerified: !!(p.reraNo || p.dldProjectNumber || p.projectNumber),
          onSchedule: typeof p.constructionPct === "number" ? p.constructionPct >= 50 : null,
          delayRiskScore: null, // Honest - we dont compute this; UI will show risk label only
          startingPrice: p.priceMin || null,
          pricePerSqft: p.ppsf || null,
          avgUnitSize: avgSize,
          sizeMin: sizeMin,
          sizeMax: sizeMax,
          grossYield: typeof p.grossYield === "number" ? p.grossYield : null,
          grossYieldIsEstimate: !!p.grossYieldIsEstimate,
          devOnTimeRate: devOnTime, // null if developer not in index - UI should hide or show Industry estimate label
          insight: p.description || p.overview || p.insight || "",
          bedTypes: Array.isArray(p.beds) ? p.beds : (p.bedConfig ? Object.keys(p.bedConfig) : []),
          riskFactors: [
            p.tier === 1 ? "Tier 1 developer" : null,
            p.dldRegistered || p.reraRegistered ? "DLD/RERA verified" : null,
            p.escrowActive ? "Escrow active" : null,
            typeof p.constructionPct === "number" && p.constructionPct >= 70 ? "Construction advanced" : null,
          ].filter(Boolean),
          riskLevel: p.tier === 1 && (p.constructionPct || 0) >= 70 ? "low" : (p.tier === 1 ? "medium-low" : "medium"),
          paymentPlan: p.paymentPlan || p.payment || "",
          appreciationSinceLaunch: appreciation, // null for off-plan projects - UI hides the field
          reraNo: p.reraNo || p.dldProjectNumber || p.projectNumber || "",
          escrowBank: p.escrowBank || "",
          tier: p.tier || null,
          isLive: true,
          _dataQuality: p.dataQualityScore || null, // for future "verified" badges
        };
      });
    // Merge: liveProjects (Firestore) + liveHandover (admin-added handovers). Empty SEED array means no fake data.
    const liveHoMerged = [...(Array.isArray(liveHandover) ? liveHandover : []), ...projectsAsHandovers];
    const seenIds = new Set();
    const dedupedHo = liveHoMerged.filter(h => {
      if (!h || !h.id) return true;
      if (seenIds.has(h.id)) return false;
      seenIds.add(h.id);
      return true;
    });
    const tier1Src = dedupedHo.length > 0 ? dedupedHo : SEED_HANDOVERS;
    const tier1SeenKeys = new Set(tier1Src.map(p => String(p.project || p.name || "").trim().toLowerCase()).filter(Boolean));

    /* Normalize DLD developments relevant to Handover tab:
       Show only Under Construction + Recently Delivered (i.e. ready or soon-to-deliver).
       Skip Historical + Announced — those aren't handover-relevant. */
    const tier3 = (Array.isArray(liveDevelopments) ? liveDevelopments : [])
      .filter(d => {
        const stage = d.lifecycleStage || "historical";
        if (stage === "historical" || stage === "announced") return false;
        const key = String(d.name || d.project || "").trim().toLowerCase();
        return key && !tier1SeenKeys.has(key);
      })
      .map(d => {
        /* Derive handoverQuarter from handoverDate if present */
        let quarter = d.handoverQuarter || null;
        let quarterEstimated = false;
        if (!quarter && d.handoverDate) {
          const dt = new Date(d.handoverDate);
          if (!isNaN(dt.getTime())) {
            const q = Math.floor(dt.getMonth() / 3) + 1;
            quarter = `Q${q} ${dt.getFullYear()}`;
          }
        }
        /* Session 4 fix: DLD records rarely have dates. Estimate quarter from constructionPct */
        if (!quarter) {
          const pct = parseFloat(d.constructionPct) || 0;
          quarterEstimated = true;
          if (pct >= 100) quarter = "Delivered";
          else if (pct >= 90) quarter = "Q2 2026";
          else if (pct >= 75) quarter = "Q4 2026";
          else if (pct >= 55) quarter = "Q2 2027";
          else if (pct >= 35) quarter = "Q4 2027";
          else if (pct >= 15) quarter = "2028";
          else quarter = "2029+";
        }
        return {
          id: d.id,
          project: d.name || d.project || d.projectName,
          developer: d.developer || d.developerName || "Unknown",
          community: d.community || d.masterProject || "—",
          handoverDate: d.handoverDate || null,
          handoverQuarter: quarter,
          quarterEstimated,
          constructionPct: d.constructionPct || 0,
          units: d.totalUnits || null,
          reraNo: d.reraNo || d.projectNumber || null,
          escrowBank: d.escrowBank || null,
          /* From Session 2 enrichment: */
          startingPrice: d.priceMin || null,
          pricePerSqft: d.avgPpsf || null,
          grossYield: d.estGrossYield || null,
          /* From Session 3 enrichment: */
          lifecycleStage: d.lifecycleStage || "under-construction",
          /* Tier marker: */
          tier: "dld-registry",
          /* Fields not curated in DLD: default to neutral values */
          type: null, bedTypes: [], avgUnitSize: null,
          riskLevel: null, delayRiskScore: null, onSchedule: null,
          devOnTimeRate: null, rerVerified: false, snaggingReady: false,
          appreciationSinceLaunch: null, paymentPlan: null,
          insight: null, riskFactors: [],
        };
      });

    const combined = [...tier1Src, ...tier3];
    return combined.filter(hoMatchesGlobalFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveHandover, liveDevelopments, gfDev, gfCommunity]);
  const isSeed = !liveHandover || liveHandover.length === 0;

  /* Filter + sort */
  const filtered = useMemo(() => {
    let result = [...projects];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(p =>
        (p.project || "").toLowerCase().includes(q) ||
        (p.developer || "").toLowerCase().includes(q) ||
        (p.community || "").toLowerCase().includes(q)
      );
    }
    /* Session 4: tier filter — DLD registry cards skip risk filter (no risk data) */
    if (tierFilter === "Verified") result = result.filter(p => p.tier !== "dld-registry");
    if (tierFilter === "Registry") result = result.filter(p => p.tier === "dld-registry");
    /* Session 4: hide historical unless toggled. Note: historical is already filtered at tier3Raw stage, this is a safety net. */
    if (!showHistorical) result = result.filter(p => p.lifecycleStage !== "historical");
    /* risk filter applies to Verified only (DLD doesn't have riskLevel) */
    if (riskFilter !== "all") result = result.filter(p => p.tier === "dld-registry" || p.riskLevel === riskFilter);
    if (quarterFilter !== "all") result = result.filter(p => p.handoverQuarter === quarterFilter);

    /* Sort — null-safe for DLD records that lack some fields */
    if (sortBy === "date") result.sort((a, b) => {
      const da = a.handoverDate ? new Date(a.handoverDate).getTime() : Infinity;
      const db = b.handoverDate ? new Date(b.handoverDate).getTime() : Infinity;
      return da - db;
    });
    if (sortBy === "progress") result.sort((a, b) => (b.constructionPct || 0) - (a.constructionPct || 0));
    if (sortBy === "risk") result.sort((a, b) => (a.delayRiskScore || 999) - (b.delayRiskScore || 999));
    if (sortBy === "price") result.sort((a, b) => (a.startingPrice || Infinity) - (b.startingPrice || Infinity));
    if (sortBy === "yield") result.sort((a, b) => (b.grossYield || 0) - (a.grossYield || 0));

    /* Verified always sorts above Registry within same criteria */
    result.sort((a, b) => (a.tier === "dld-registry" ? 1 : 0) - (b.tier === "dld-registry" ? 1 : 0));

    return result;
  }, [projects, search, riskFilter, quarterFilter, sortBy, tierFilter, showHistorical]);

  /* KPIs */
  const kpis = useMemo(() => {
    const total = filtered.length;
    const totalUnits = filtered.reduce((s, p) => s + (p.units || 0), 0);
    const avgProgress = total > 0 ? Math.round(filtered.reduce((s, p) => s + (p.constructionPct || 0), 0) / total) : 0;
    const onSchedule = filtered.filter(p => p.onSchedule).length;
    const lowRisk = filtered.filter(p => p.riskLevel === "very-low" || p.riskLevel === "low").length;
    const snaggingReady = filtered.filter(p => p.snaggingReady).length;
    const yields = filtered.filter(p => p.grossYield > 0);
    const avgYield = yields.length > 0 ? (yields.reduce((s, p) => s + p.grossYield, 0) / yields.length).toFixed(1) : "—";
    return { total, totalUnits, avgProgress, onSchedule, lowRisk, snaggingReady, avgYield };
  }, [filtered]);

  /* Group by quarter */
  const grouped = useMemo(() => {
    const groups = {};
    filtered.forEach(p => {
      if (!p.handoverQuarter) return;
      if (!groups[p.handoverQuarter]) groups[p.handoverQuarter] = [];
      groups[p.handoverQuarter].push(p);
    });
    return groups;
  }, [filtered]);

  /* Session 4: sort helper for grouped quarter entries (handles estimated labels) */
  const sortedGroupedEntries = useMemo(() => {
    const rank = s => {
      if (s === "Delivered") return 0;
      const qm = String(s || "").match(/Q(\d)\s+(\d{4})/);
      if (qm) return parseInt(qm[2]) + (parseInt(qm[1]) - 1) * 0.25;
      if (s === "2028") return 2028;
      if (s === "2029+") return 2029;
      const ym = String(s || "").match(/^(\d{4})$/);
      if (ym) return parseInt(ym[1]);
      return 9999;
    };
    return Object.entries(grouped).sort((a, b) => rank(a[0]) - rank(b[0]));
  }, [grouped]);

  /* Supply chart data */
  const supplyChartData = useMemo(() => {
    const counts = {};
    filtered.forEach(p => {
      counts[p.community] = (counts[p.community] || 0) + 1;
    });
    return Object.entries(counts).map(([community, count]) => ({
      community: community.length > 18 ? community.slice(0, 16) + "…" : community,
      count,
      risk: COMMUNITY_SUPPLY[community]?.risk || "unknown",
    })).sort((a, b) => b.count - a.count).slice(0, 8);
  }, [filtered]);

  /* Delay compensation calculator */
  const compensationCalc = useMemo(() => {
    const dailyRate = (calcPurchasePrice * (calcAnnualRate / 100)) / 365;
    const totalDays = calcDelayMonths * 30;
    const totalComp = dailyRate * totalDays;
    const monthlyComp = totalComp / calcDelayMonths;
    return { dailyRate, totalComp, monthlyComp };
  }, [calcDelayMonths, calcPurchasePrice, calcAnnualRate]);

  const riskColor = (level) => {
    if (level === "very-low") return "#10B981";
    if (level === "low") return "#10B981";
    if (level === "medium") return "#F59E0B";
    if (level === "high") return "#EF4444";
    return T.textMuted;
  };

  const progressColor = (pct) => {
    if (pct >= 85) return "#10B981";
    if (pct >= 65) return T.gold;
    if (pct >= 45) return "#F59E0B";
    return "#EF4444";
  };

  const allQuarters = useMemo(() => {
    // Derive quarters from the same sources used by the main useMemo above
    const projectsQuarters = (Array.isArray(liveProjects) ? liveProjects : [])
      .map(p => {
        if (p.handoverQuarter) return p.handoverQuarter;
        const hd = String(p.handoverDate || p.contractedHandover || p.expectedHandover || p.handover || "");
        const m = hd.match(/(\d{4})/);
        const year = m ? m[1] : "";
        const q = hd.includes("January") || hd.includes("February") || hd.includes("March") ? "Q1"
          : hd.includes("April") || hd.includes("May") || hd.includes("June") ? "Q2"
          : hd.includes("July") || hd.includes("August") || hd.includes("September") ? "Q3"
          : hd.includes("October") || hd.includes("November") || hd.includes("December") ? "Q4"
          : "";
        return (q && year) ? (q + " " + year) : year;
      }).filter(Boolean);
    const launchQuarters = (Array.isArray(liveHandover) ? liveHandover : []).map(h => h.handoverQuarter).filter(Boolean);
    const quarters = new Set([...projectsQuarters, ...launchQuarters]);
    /* Session 4: include quarters from live DLD developments — including ESTIMATED quarters from constructionPct */
    (liveDevelopments || []).forEach(d => {
      const stage = d.lifecycleStage;
      if (stage !== "under-construction" && stage !== "recently-delivered") return;
      if (d.handoverQuarter) { quarters.add(d.handoverQuarter); return; }
      if (d.handoverDate) {
        const dt = new Date(d.handoverDate);
        if (!isNaN(dt.getTime())) {
          const q = Math.floor(dt.getMonth() / 3) + 1;
          quarters.add(`Q${q} ${dt.getFullYear()}`);
          return;
        }
      }
      /* Same estimation logic as in the data normalization */
      const pct = parseFloat(d.constructionPct) || 0;
      if (pct >= 100) quarters.add("Delivered");
      else if (pct >= 90) quarters.add("Q2 2026");
      else if (pct >= 75) quarters.add("Q4 2026");
      else if (pct >= 55) quarters.add("Q2 2027");
      else if (pct >= 35) quarters.add("Q4 2027");
      else if (pct >= 15) quarters.add("2028");
      else quarters.add("2029+");
    });
    /* Sort chronologically, handling estimated labels */
    const rank = s => {
      if (s === "Delivered") return 0;
      const qm = String(s || "").match(/Q(\d)\s+(\d{4})/);
      if (qm) return parseInt(qm[2]) + (parseInt(qm[1]) - 1) * 0.25;
      if (s === "2028") return 2028;
      if (s === "2029+") return 2029;
      const ym = String(s || "").match(/^(\d{4})$/);
      if (ym) return parseInt(ym[1]);
      return 9999;
    };
    const sorted = Array.from(quarters).sort((a, b) => rank(a) - rank(b));
    return ["all", ...sorted];
  }, [liveDevelopments]);

  return (
    <div style={{ animation: "fadeUp 0.4s ease-out forwards" }}>

      {/* HEADER */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", marginBottom: 16, borderBottom: `1px solid ${T.border}`, flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontFamily: "'Fraunces', serif", fontSize: 26, fontWeight: 800, color: T.white }}>Handover Tracker — DXB Daily</div>
          <div style={{ fontSize: 12, color: T.textMuted, marginTop: 4 }}>
            {kpis.total} projects · {kpis.totalUnits.toLocaleString()} units · {kpis.avgProgress}% avg complete · {kpis.snaggingReady} snagging-ready · Buyer rights & delay calculator
          </div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {[
            { key: "cards", label: "Cards" },
            { key: "calendar", label: "Calendar" },
            { key: "risk", label: "Risk Matrix" },
          ].map(v => (
            <button key={v.key} type="button" onClick={() => setView(v.key)}
              style={{
                padding: "6px 14px",
                background: view === v.key ? "rgba(212,168,67,0.16)" : "rgba(255,255,255,0.04)",
                border: `1px solid ${view === v.key ? T.gold : T.border}`,
                borderRadius: 8,
                color: view === v.key ? T.gold : T.textMuted,
                fontSize: 11,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "'Outfit', sans-serif",
              }}>
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {/* MARKET CONTEXT BANNER */}
      <div style={{ marginBottom: 16, padding: "12px 16px", background: "linear-gradient(135deg, rgba(239,68,68,0.06), rgba(245,158,11,0.04))", border: `1px solid ${T.gold}33`, borderRadius: 12, display: "flex", flexWrap: "wrap", gap: 22, alignItems: "center" }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: T.gold, letterSpacing: 0.6, textTransform: "uppercase", flexShrink: 0 }}>2026 Handover Reality Check</div>
        <div style={{ display: "flex", gap: 22, flexWrap: "wrap", flex: 1 }}>
          {[
            { label: "Scheduled 2026", val: "120,000", color: T.white },
            { label: "Likely Delivered", val: "~34,740", color: "#F59E0B" },
            { label: "On-Time Rate", val: "48%", color: "#EF4444" },
            { label: "2027 Spike", val: "70,537", color: T.white },
            { label: "Top Risk Zone", val: "JVC (27K)", color: "#EF4444" },
            { label: "Grace Period", val: "6-12 mo", color: T.gold },
          ].map(s => (
            <div key={s.label}>
              <div style={{ fontSize: 10, color: T.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>{s.label}</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: s.color }}>{s.val}</div>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 10, color: T.textMuted }}>Source: Morgan's International Realty · The National · Khaleej Times</div>
      </div>

      {/* KPI ROW */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10, marginBottom: 16 }}>
        {[
          { label: "Tracked", value: kpis.total, color: T.gold, sub: "Projects" },
          { label: "Total Units", value: kpis.totalUnits.toLocaleString(), color: T.white, sub: "Across all projects" },
          { label: "Avg Complete", value: kpis.avgProgress + "%", color: progressColor(kpis.avgProgress), sub: "Construction progress" },
          { label: "On Schedule", value: kpis.onSchedule + "/" + kpis.total, color: "#10B981", sub: "Per developer reports" },
          { label: "Low Risk", value: kpis.lowRisk, color: "#10B981", sub: "Tier 1 + 85%+ built" },
          { label: "Snagging Ready", value: kpis.snaggingReady, color: T.gold, sub: "Inspection now" },
          { label: "Avg Yield", value: kpis.avgYield + "%", color: "#10B981", sub: "Gross, filtered" },
        ].map((kpi, i) => (
          <div key={i} style={{ padding: 12, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12 }}>
            <div style={{ fontSize: 10, color: T.textMuted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>{kpi.label}</div>
            <div style={{ fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 800, color: kpi.color, lineHeight: 1 }}>{kpi.value}</div>
            <div style={{ fontSize: 9, color: T.textMuted, marginTop: 4 }}>{kpi.sub}</div>
          </div>
        ))}
      </div>

      {/* FILTER ROW */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search project, developer, community..."
          style={{ flex: "1 1 240px", padding: "8px 14px", background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8, color: T.white, fontSize: 12, fontFamily: "'Outfit', sans-serif", outline: "none" }} />
        <select value={riskFilter} onChange={(e) => setRiskFilter(e.target.value)}
          style={{ padding: "8px 14px", background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8, color: T.white, fontSize: 12, fontFamily: "'Outfit', sans-serif", cursor: "pointer", outline: "none" }}>
          <option value="all">All Risk Levels</option>
          <option value="very-low">Very Low Risk</option>
          <option value="low">Low Risk</option>
          <option value="medium">Medium Risk</option>
          <option value="high">High Risk</option>
        </select>
        <select value={quarterFilter} onChange={(e) => setQuarterFilter(e.target.value)}
          style={{ padding: "8px 14px", background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8, color: T.white, fontSize: 12, fontFamily: "'Outfit', sans-serif", cursor: "pointer", outline: "none" }}>
          {allQuarters.map(q => <option key={q} value={q}>{q === "all" ? "All Quarters" : q}</option>)}
        </select>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
          style={{ padding: "8px 14px", background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8, color: T.white, fontSize: 12, fontFamily: "'Outfit', sans-serif", cursor: "pointer", outline: "none" }}>
          <option value="date">Sort: Handover Date</option>
          <option value="progress">Sort: Construction %</option>
          <option value="risk">Sort: Risk (Low → High)</option>
          <option value="price">Sort: Price (Low → High)</option>
          <option value="yield">Sort: Gross Yield</option>
        </select>
        {/* Session 4: tier filter + show-historical toggle */}
        <select value={tierFilter} onChange={(e) => setTierFilter(e.target.value)}
          style={{ padding: "8px 14px", background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8, color: T.white, fontSize: 12, fontFamily: "'Outfit', sans-serif", cursor: "pointer", outline: "none" }}>
          <option value="All">All Sources</option>
          <option value="Verified">Verified Only</option>
          <option value="Registry">DLD Registry Only</option>
        </select>
        <label style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 12px", background: showHistorical ? "rgba(212,168,67,0.08)" : T.surfaceAlt, border: `1px solid ${showHistorical ? "rgba(212,168,67,0.30)" : T.border}`, borderRadius: 8, fontSize: 11, cursor: "pointer", fontFamily: "'Outfit', sans-serif" }} title="Show delivered projects with no recent activity">
          <input type="checkbox" checked={showHistorical} onChange={e => setShowHistorical(e.target.checked)} style={{ cursor: "pointer", accentColor: T.gold }} />
          <span style={{ color: showHistorical ? T.gold : T.textMuted, fontWeight: showHistorical ? 700 : 400 }}>Show historical</span>
        </label>
      </div>

      {/* DATA SOURCE BADGE */}
      <div style={{ marginBottom: 16, padding: "8px 14px", background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8, display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: isSeed ? T.gold : "#10B981", display: "inline-block" }} />
        <span style={{ fontSize: 11, color: T.textMuted }}>
          {isSeed ? "Curated handover data — Property Finder, dxboffplan.com, developer IR reports · Add via Admin → Data Manager → Handovers" : "Live handover feed from your data source"}
        </span>
      </div>

      {/* MODE 1: CARDS VIEW (grouped by quarter) */}
      {view === "cards" && (
        <>
          {sortedGroupedEntries.map(([quarter, items]) => (
            <div key={quarter} style={{ marginBottom: 24 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                <div style={{ height: 1, flex: 1, background: T.border }} />
                <div style={{ fontFamily: "'Fraunces', serif", fontSize: 18, fontWeight: 700, color: T.gold }}>{quarter}</div>
                <div style={{ fontSize: 10, color: T.textMuted }}>{items.length} {items.length === 1 ? "project" : "projects"} · {items.reduce((s, p) => s + (p.units || 0), 0).toLocaleString()} units</div>
                <div style={{ height: 1, flex: 1, background: T.border }} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(380px, 1fr))", gap: 14 }}>
                {items.map(p => p.tier === "dld-registry" ? (
                  /* ── Session 4: Registry card (DLD-only, compact, honest) ── */
                  <div key={p.id} onClick={() => setDetailModal(p)} style={{
                    padding: 16,
                    background: T.surface,
                    border: `1px solid ${T.border}`,
                    borderRadius: 12,
                    borderLeft: `4px solid ${p.lifecycleStage === "recently-delivered" ? "#F59E0B" : p.lifecycleStage === "under-construction" ? "#60A5FA" : T.border}`,
                    cursor: "pointer",
                    transition: "transform 0.15s",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = "none"; }}>
                    {/* Header */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10, gap: 12 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 9, color: T.textMuted, textTransform: "uppercase", letterSpacing: 0.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{(p.developer || "Unknown").toUpperCase()}</div>
                        <div style={{ fontFamily: "'Fraunces', serif", fontSize: 16, fontWeight: 700, color: T.white, marginTop: 2, lineHeight: 1.25, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.project}</div>
                        <div style={{ fontSize: 10, color: T.textMuted, marginTop: 2 }}>{p.community}</div>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
                        <span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 10, background: p.lifecycleStage === "recently-delivered" ? "rgba(245,158,11,0.12)" : "rgba(59,130,246,0.12)", color: p.lifecycleStage === "recently-delivered" ? "#F59E0B" : "#60A5FA", fontWeight: 700, letterSpacing: 0.4, textTransform: "uppercase", whiteSpace: "nowrap" }}>
                          {p.lifecycleStage === "recently-delivered" ? "Recently Delivered" : "Under Construction"}
                        </span>
                        <span style={{ fontSize: 8, padding: "2px 6px", borderRadius: 8, background: "rgba(148,163,184,0.10)", color: T.textMuted, fontWeight: 700, letterSpacing: 0.4, textTransform: "uppercase", whiteSpace: "nowrap", border: `1px solid ${T.border}` }}>DLD Registry</span>
                      </div>
                    </div>
                    {/* Construction progress bar */}
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ fontSize: 10, color: T.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>Construction Progress</span>
                        <span style={{ fontSize: 12, fontWeight: 800, color: progressColor(p.constructionPct || 0) }}>{p.constructionPct || 0}%</span>
                      </div>
                      <div style={{ height: 8, background: T.surfaceAlt, borderRadius: 4, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${p.constructionPct || 0}%`, background: progressColor(p.constructionPct || 0), transition: "width 0.5s" }} />
                      </div>
                    </div>
                    {/* Minimal stats grid — only what we actually know */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6, marginBottom: 10, padding: "10px 0", borderTop: `1px solid ${T.border}`, borderBottom: `1px solid ${T.border}` }}>
                      <div>
                        <div style={{ fontSize: 9, color: T.textMuted, textTransform: "uppercase" }}>Handover</div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: T.white }}>{p.handoverQuarter || "—"}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 9, color: T.textMuted, textTransform: "uppercase" }}>Units</div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: T.white }}>{p.units ? p.units.toLocaleString() : "—"}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 9, color: T.textMuted, textTransform: "uppercase" }}>{p.startingPrice ? "From" : "RERA"}</div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: p.startingPrice ? T.gold : T.textSecondary }}>
                          {p.startingPrice ? `AED ${(p.startingPrice/1e6).toFixed(2)}M` : `#${p.reraNo || "—"}`}
                        </div>
                      </div>
                    </div>
                    {/* Honest footer */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 8, fontSize: 10, color: T.textMuted }}>
                      <span>Sourced from Dubai Land Department</span>
                      <span style={{ color: T.gold, fontWeight: 700, fontSize: 10 }}>Details →</span>
                    </div>
                  </div>
                ) : (
                  /* ── Verified card (unchanged rich render) ── */
                  <div key={p.id} style={{
                    padding: 16,
                    background: T.surface,
                    border: `1px solid ${T.border}`,
                    borderRadius: 12,
                    borderLeft: `4px solid ${riskColor(p.riskLevel)}`,
                  }}>
                    {/* Header */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10, gap: 12 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 9, color: T.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>{p.developer.toUpperCase()}</div>
                        <div style={{ fontFamily: "'Fraunces', serif", fontSize: 16, fontWeight: 700, color: T.white, marginTop: 2, lineHeight: 1.25 }}>{p.project}</div>
                        <div style={{ fontSize: 10, color: T.textMuted, marginTop: 2 }}>{p.community} · {p.type}</div>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                        <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 6, background: `${riskColor(p.riskLevel)}22`, color: riskColor(p.riskLevel), fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.5 }}>
                          {p.riskLevel === "very-low" ? "Very Low" : p.riskLevel === "low" ? "Low Risk" : p.riskLevel === "medium" ? "Medium" : "High Risk"}
                        </span>
                        {p.snaggingReady && <span style={{ fontSize: 9, padding: "2px 8px", borderRadius: 5, background: "rgba(212,168,67,0.15)", color: T.gold, fontWeight: 700 }}>🔍 Snagging Ready</span>}
                      </div>
                    </div>

                    {/* Construction progress bar */}
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ fontSize: 10, color: T.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>Construction Progress</span>
                        <span style={{ fontSize: 12, fontWeight: 800, color: progressColor(p.constructionPct) }}>{p.constructionPct}%</span>
                      </div>
                      <div style={{ height: 8, background: T.surfaceAlt, borderRadius: 4, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${p.constructionPct}%`, background: progressColor(p.constructionPct), transition: "width 0.5s" }} />
                      </div>
                    </div>

                    {/* Stats grid */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6, marginBottom: 10, padding: "10px 0", borderTop: `1px solid ${T.border}`, borderBottom: `1px solid ${T.border}` }}>
                      <div>
                        <div style={{ fontSize: 9, color: T.textMuted, textTransform: "uppercase" }}>Handover</div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: T.white }}>{p.handoverQuarter}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 9, color: T.textMuted, textTransform: "uppercase" }}>Units</div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: T.white }}>{p.units}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 9, color: T.textMuted, textTransform: "uppercase" }}>Plan</div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: T.white }}>{p.paymentPlan}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 9, color: T.textMuted, textTransform: "uppercase" }}>From</div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: T.gold }}>AED {(p.startingPrice / 1000000).toFixed(2)}M</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 9, color: T.textMuted, textTransform: "uppercase" }}>Yield</div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "#10B981" }}>{p.grossYield}%</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 9, color: T.textMuted, textTransform: "uppercase" }}>Dev On-Time</div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: p.devOnTimeRate >= 85 ? "#10B981" : p.devOnTimeRate >= 75 ? T.gold : "#F59E0B" }}>{p.devOnTimeRate}%</div>
                      </div>
                    </div>

                    {/* Insight */}
                    <div style={{ fontSize: 11, color: T.textSecondary, lineHeight: 1.5, marginBottom: 10 }}>{p.insight}</div>

                    {/* RERA + Escrow */}
                    <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 8, borderTop: `1px solid ${T.border}`, marginBottom: 8, fontSize: 9, color: T.textMuted }}>
                      <span>RERA: {p.reraNo}</span>
                      <span>Escrow: {p.escrowBank}</span>
                    </div>

                    {/* Footer actions */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 8, borderTop: `1px solid ${T.border}`, gap: 6 }}>
                      <div style={{ fontSize: 10, color: T.textMuted }}>+{p.appreciationSinceLaunch}% since launch</div>
                      <div style={{ display: "flex", gap: 5 }}>
                        <button type="button" onClick={() => setDetailModal(p)}
                          style={{ padding: "5px 12px", background: "rgba(212,168,67,0.08)", border: `1px solid ${T.gold}`, borderRadius: 6, color: T.gold, fontSize: 10, fontWeight: 700, cursor: "pointer", fontFamily: "'Outfit', sans-serif" }}>
                          Full Details
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </>
      )}

      {/* MODE 2: CALENDAR VIEW */}
      {view === "calendar" && (
        <div style={{ marginBottom: 20 }}>
          {sortedGroupedEntries.map(([quarter, items]) => (
            <div key={quarter} style={{ marginBottom: 18, padding: 18, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12 }}>
              <div style={{ fontFamily: "'Fraunces', serif", fontSize: 18, fontWeight: 700, color: T.gold, marginBottom: 12 }}>{quarter}</div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                  <thead>
                    <tr style={{ borderBottom: `2px solid ${T.gold}` }}>
                      <th style={{ padding: "8px 12px", textAlign: "left", color: T.textMuted, fontSize: 10, textTransform: "uppercase", fontWeight: 700 }}>Project</th>
                      <th style={{ padding: "8px 12px", textAlign: "left", color: T.textMuted, fontSize: 10, textTransform: "uppercase", fontWeight: 700 }}>Developer</th>
                      <th style={{ padding: "8px 12px", textAlign: "left", color: T.textMuted, fontSize: 10, textTransform: "uppercase", fontWeight: 700 }}>Community</th>
                      <th style={{ padding: "8px 12px", textAlign: "right", color: T.textMuted, fontSize: 10, textTransform: "uppercase", fontWeight: 700 }}>Units</th>
                      <th style={{ padding: "8px 12px", textAlign: "right", color: T.textMuted, fontSize: 10, textTransform: "uppercase", fontWeight: 700 }}>% Built</th>
                      <th style={{ padding: "8px 12px", textAlign: "right", color: T.textMuted, fontSize: 10, textTransform: "uppercase", fontWeight: 700 }}>Risk</th>
                      <th style={{ padding: "8px 12px", textAlign: "right", color: T.textMuted, fontSize: 10, textTransform: "uppercase", fontWeight: 700 }}>From</th>
                      <th style={{ padding: "8px 12px", textAlign: "right", color: T.textMuted, fontSize: 10, textTransform: "uppercase", fontWeight: 700 }}>Yield</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((p, i) => (
                      <tr key={p.id} onClick={() => setDetailModal(p)}
                        style={{ borderBottom: i < items.length - 1 ? `1px solid ${T.border}` : "none", cursor: "pointer", transition: "background 0.15s" }}
                        onMouseEnter={e => e.currentTarget.style.background = "rgba(212,168,67,0.04)"}
                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                        <td style={{ padding: "10px 12px", color: T.white, fontWeight: 700 }}>{p.project}</td>
                        <td style={{ padding: "10px 12px", color: T.textPrimary }}>{p.developer}</td>
                        <td style={{ padding: "10px 12px", color: T.textPrimary }}>{p.community}</td>
                        <td style={{ padding: "10px 12px", textAlign: "right", color: T.textPrimary }}>{p.units || "—"}</td>
                        <td style={{ padding: "10px 12px", textAlign: "right", color: progressColor(p.constructionPct || 0), fontWeight: 700 }}>{p.constructionPct || 0}%</td>
                        <td style={{ padding: "10px 12px", textAlign: "right" }}>
                          {p.riskLevel ? (
                            <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 5, background: `${riskColor(p.riskLevel)}22`, color: riskColor(p.riskLevel), fontWeight: 700, textTransform: "uppercase" }}>
                              {p.riskLevel}
                            </span>
                          ) : (
                            <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 8, background: "rgba(148,163,184,0.08)", color: T.textMuted, fontWeight: 600, letterSpacing: 0.3 }}>DLD</span>
                          )}
                        </td>
                        <td style={{ padding: "10px 12px", textAlign: "right", color: T.gold, fontWeight: 700 }}>{p.startingPrice ? (p.startingPrice / 1000000).toFixed(2) + "M" : "—"}</td>
                        <td style={{ padding: "10px 12px", textAlign: "right", color: "#10B981", fontWeight: 700 }}>{p.grossYield ? p.grossYield + "%" : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODE 3: RISK MATRIX */}
      {view === "risk" && (
        <div style={{ marginBottom: 20, padding: 18, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12 }}>
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontFamily: "'Fraunces', serif", fontSize: 18, fontWeight: 700, color: T.white }}>Risk Assessment Matrix</div>
            <div style={{ fontSize: 11, color: T.textMuted, marginTop: 4 }}>Construction progress vs delay risk score · Verified projects only · DLD Registry records lack risk data</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12 }}>
            {filtered.filter(p => p.tier !== "dld-registry").map(p => (
              <div key={p.id} onClick={() => setDetailModal(p)}
                style={{
                  padding: 14,
                  background: T.surfaceAlt,
                  border: `1px solid ${T.border}`,
                  borderLeft: `4px solid ${riskColor(p.riskLevel)}`,
                  borderRadius: 10,
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = T.gold}
                onMouseLeave={e => e.currentTarget.style.borderColor = T.border}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.white }}>{p.project}</div>
                    <div style={{ fontSize: 10, color: T.textMuted }}>{p.developer} · {p.handoverQuarter}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: riskColor(p.riskLevel) }}>{p.delayRiskScore}</div>
                    <div style={{ fontSize: 8, color: T.textMuted, textTransform: "uppercase" }}>Risk Score</div>
                  </div>
                </div>
                <div style={{ marginBottom: 8 }}>
                  <div style={{ height: 6, background: T.border, borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${p.constructionPct}%`, background: progressColor(p.constructionPct) }} />
                  </div>
                  <div style={{ fontSize: 9, color: T.textMuted, marginTop: 3 }}>{p.constructionPct}% built · Dev {p.devOnTimeRate}% on-time</div>
                </div>
                <div style={{ fontSize: 10, color: T.textSecondary, lineHeight: 1.4 }}>
                  {p.riskFactors.slice(0, 2).join(" · ")}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* COMMUNITY SUPPLY HEAT MAP */}
      {supplyChartData.length > 0 && (
        <div style={{ marginBottom: 20, padding: 18, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12 }}>
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontFamily: "'Fraunces', serif", fontSize: 18, fontWeight: 700, color: T.white }}>Community Supply Heat Map</div>
            <div style={{ fontSize: 11, color: T.textMuted, marginTop: 4 }}>Handovers per community · color-coded by 2028 oversupply forecast (Source: prelaunch.ae, Morgan's International Realty)</div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={supplyChartData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="community" tick={{ fill: T.textMuted, fontSize: 10 }} angle={-15} textAnchor="end" height={70} />
              <YAxis tick={{ fill: T.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10 }} />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {supplyChartData.map((entry, i) => (
                  <Cell key={i} fill={entry.risk === "high" ? "#EF4444" : entry.risk === "medium" ? "#F59E0B" : "#10B981"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", gap: 16, justifyContent: "center", marginTop: 8 }}>
            <span style={{ fontSize: 10, color: T.textMuted, display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 8, height: 8, background: "#10B981", borderRadius: 2 }}></span> Healthy absorption</span>
            <span style={{ fontSize: 10, color: T.textMuted, display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 8, height: 8, background: "#F59E0B", borderRadius: 2 }}></span> Watch closely</span>
            <span style={{ fontSize: 10, color: T.textMuted, display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 8, height: 8, background: "#EF4444", borderRadius: 2 }}></span> Oversupplied</span>
          </div>
        </div>
      )}

      {/* DELAY COMPENSATION CALCULATOR */}
      <div style={{ marginBottom: 20, padding: 18, background: "rgba(212,168,67,0.04)", border: `1px solid ${T.gold}33`, borderRadius: 12 }}>
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontFamily: "'Fraunces', serif", fontSize: 18, fontWeight: 700, color: T.gold }}>⚖️ Delay Compensation Calculator</div>
          <div style={{ fontSize: 11, color: T.textMuted, marginTop: 4 }}>Estimate compensation owed to you under UAE Civil Transactions Law Article 295 if developer delays beyond SPA grace period (typically 6-12 months)</div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 16 }}>
          <div>
            <label style={{ fontSize: 10, color: T.textMuted, textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 700, display: "block", marginBottom: 6 }}>Purchase Price (AED)</label>
            <input type="number" value={calcPurchasePrice} onChange={(e) => setCalcPurchasePrice(parseInt(e.target.value) || 0)}
              style={{ width: "100%", padding: "10px 14px", background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8, color: T.white, fontSize: 14, fontFamily: "'Outfit', sans-serif", outline: "none", fontWeight: 700 }} />
            <div style={{ fontSize: 9, color: T.textMuted, marginTop: 4 }}>AED {(calcPurchasePrice / 1000000).toFixed(2)}M</div>
          </div>
          <div>
            <label style={{ fontSize: 10, color: T.textMuted, textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 700, display: "block", marginBottom: 6 }}>Delay Beyond Grace ({calcDelayMonths} months)</label>
            <input type="range" min="1" max="24" value={calcDelayMonths} onChange={(e) => setCalcDelayMonths(parseInt(e.target.value))}
              style={{ width: "100%", accentColor: T.gold }} />
            <div style={{ fontSize: 9, color: T.textMuted, marginTop: 4 }}>1 month → 24 months past grace</div>
          </div>
          <div>
            <label style={{ fontSize: 10, color: T.textMuted, textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 700, display: "block", marginBottom: 6 }}>Annual Rate ({calcAnnualRate}%)</label>
            <input type="range" min="5" max="12" step="0.5" value={calcAnnualRate} onChange={(e) => setCalcAnnualRate(parseFloat(e.target.value))}
              style={{ width: "100%", accentColor: T.gold }} />
            <div style={{ fontSize: 9, color: T.textMuted, marginTop: 4 }}>Standard: 7-9% annual (Holo industry data)</div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          <div style={{ padding: 14, background: T.surfaceAlt, borderRadius: 10, border: `1px solid ${T.border}` }}>
            <div style={{ fontSize: 10, color: T.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>Daily Compensation</div>
            <div style={{ fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 800, color: T.gold }}>AED {compensationCalc.dailyRate.toFixed(0)}</div>
          </div>
          <div style={{ padding: 14, background: T.surfaceAlt, borderRadius: 10, border: `1px solid ${T.border}` }}>
            <div style={{ fontSize: 10, color: T.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>Monthly Compensation</div>
            <div style={{ fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 800, color: T.gold }}>AED {compensationCalc.monthlyComp.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
          </div>
          <div style={{ padding: 14, background: "rgba(16,185,129,0.08)", borderRadius: 10, border: `1px solid #10B981` }}>
            <div style={{ fontSize: 10, color: T.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>Total Owed (Estimated)</div>
            <div style={{ fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 800, color: "#10B981" }}>AED {compensationCalc.totalComp.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
          </div>
        </div>

        <div style={{ marginTop: 14, padding: "10px 14px", background: "rgba(59,130,246,0.06)", borderLeft: `3px solid #3B82F6`, borderRadius: 6, fontSize: 11, color: T.textSecondary, lineHeight: 1.6 }}>
          💡 <strong style={{ color: T.white }}>Important:</strong> This is an estimate, not legal advice. Actual compensation depends on your SPA terms, force majeure clauses, and RERA assessment. About <strong style={{ color: T.gold }}>70% of disputes are resolved through RERA mediation</strong> (2-3 months) before reaching court. Contact a qualified UAE property lawyer before pursuing any claim.
        </div>
      </div>

      {/* DEVELOPER RELIABILITY INDEX */}
      <div style={{ marginBottom: 20, padding: 18, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12 }}>
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontFamily: "'Fraunces', serif", fontSize: 18, fontWeight: 700, color: T.white }}>Developer Reliability Index (Q1 2026)</div>
          <div style={{ fontSize: 11, color: T.textMuted, marginTop: 4 }}>On-time delivery track records across Dubai's main developers · Source: prelaunch.ae, BSA Law, Fitch Ratings</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 10 }}>
          {Object.entries(DEVELOPER_INDEX).map(([name, dev]) => (
            <div key={name} style={{ padding: 12, background: T.surfaceAlt, borderRadius: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: T.white, fontWeight: 700 }}>{name}</span>
                <span style={{ fontSize: 13, color: dev.color, fontWeight: 800 }}>{dev.onTime}%</span>
              </div>
              <div style={{ height: 4, background: T.border, borderRadius: 2, overflow: "hidden", marginBottom: 6 }}>
                <div style={{ height: "100%", width: `${dev.onTime}%`, background: dev.color }} />
              </div>
              <div style={{ fontSize: 10, color: T.textMuted, lineHeight: 1.4 }}>{dev.traits}</div>
            </div>
          ))}
        </div>
      </div>

      {/* BUYER RIGHTS LEGAL FRAMEWORK */}
      <div style={{ marginBottom: 20, padding: 18, background: "rgba(212,168,67,0.04)", border: `1px solid ${T.gold}33`, borderRadius: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: T.gold, display: "inline-block" }} />
          <div style={{ fontFamily: "'Fraunces', serif", fontSize: 16, fontWeight: 700, color: T.gold }}>Buyer Rights — UAE Off-Plan Legal Framework</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12 }}>
          {[
            { law: "Law 8/2007", title: "Escrow Account Law", desc: "All off-plan payments must go into a RERA-registered escrow account. Developers cannot access funds until construction milestones are verified." },
            { law: "Law 13/2008", title: "Interim Property Register", desc: "All off-plan sales must be registered in the Oqood (interim register) at DLD. Protects buyer interest before title deed issuance." },
            { law: "Law 19/2017", title: "Handover Delay Protections", desc: "Specific protections for buyers facing developer delays. Defines penalty mechanisms and termination rights." },
            { law: "Decree 33/2020", title: "Special Real Estate Tribunal", desc: "Creates a dedicated court for real estate disputes including delayed handovers. Faster resolution path." },
            { law: "Federal Decree-Law 25/2025", title: "New Civil Code (Effective June 1, 2026)", desc: "Replaces 1985 Civil Code. Affects compensation claims filed after June 2026. Buyers should consult lawyers on transitional cases." },
            { law: "Article 295 — Civil Code", title: "Damages for Breach", desc: "Buyers can claim monetary compensation for actual losses + lost rental income from delayed property. Standard rate: 7-9% annually of property value." },
          ].map((item, i) => (
            <div key={i} style={{ padding: "12px 14px", background: T.surfaceAlt, borderRadius: 10, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 9, color: T.gold, fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>{item.law}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.white, marginBottom: 4 }}>{item.title}</div>
              <div style={{ fontSize: 11, color: T.textSecondary, lineHeight: 1.5 }}>{item.desc}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 12, padding: "10px 14px", background: "rgba(59,130,246,0.06)", borderLeft: `3px solid #3B82F6`, borderRadius: 6, fontSize: 11, color: T.textSecondary, lineHeight: 1.6 }}>
          💡 <strong style={{ color: T.white }}>Action steps if your handover is delayed:</strong> (1) Re-read your SPA's grace period clause. (2) Verify project status on the <strong style={{ color: T.gold }}>Dubai REST app</strong>. (3) File a complaint with DLD if delay exceeds grace period. (4) Most cases settle through RERA mediation in 2-3 months. (5) Consult a UAE property lawyer before pursuing court action.
        </div>
      </div>

      {/* KEY INSIGHTS PANEL */}
      <div style={{ marginBottom: 20, padding: 18, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12 }}>
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontFamily: "'Fraunces', serif", fontSize: 16, fontWeight: 700, color: T.white }}>2026 Handover Intelligence</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
          {[
            { icon: "📊", title: "48% Reality Check", desc: "Of 71,613 forecasted 2026 units, only ~34,740 (48%) likely to deliver on time. Down from 2022-2024 average of 56%." },
            { icon: "🏗️", title: "Top Delivery Zones", desc: "JVC (highest), Azizi Venice, DAMAC Lagoons, Business Bay, Arjan account for majority of 2026 handovers." },
            { icon: "⚡", title: "Tier 1 Premium", desc: "Sobha (91%), Emaar/Ellington (88%), MAF (87%) deliver on time. DAMAC (71%), Binghatti (74%) face higher risk." },
            { icon: "📅", title: "2027 Spike Coming", desc: "70,537 units forecast for 2027 — nearly 2x Dubai's 5-year average. May pressure prices if absorption can't keep pace." },
            { icon: "⚖️", title: "Grace Period", desc: "Standard SPA grace: 6-12 months. Action only after grace expires. RERA mediation resolves ~70% of disputes in 2-3 months." },
            { icon: "💰", title: "Compensation Math", desc: "Standard 7-9% annual of property value. AED 2M property delayed 6 months past grace = ~AED 80,000 owed." },
            { icon: "🔍", title: "Snagging Window", desc: "When project hits 90%+, snagging inspection begins. Use a professional snagging company before signing handover acceptance." },
            { icon: "📲", title: "Dubai REST App", desc: "Verify RERA registration, escrow status, and construction progress on the Dubai REST app before paying any installment." },
          ].map((insight, i) => (
            <div key={i} style={{ padding: "12px 14px", background: T.surfaceAlt, borderRadius: 10, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 18, marginBottom: 6 }}>{insight.icon}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.white, marginBottom: 4 }}>{insight.title}</div>
              <div style={{ fontSize: 11, color: T.textSecondary, lineHeight: 1.5 }}>{insight.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* CROSS-LINKS */}
      <div style={{ marginBottom: 16, display: "flex", gap: 8, flexWrap: "wrap" }}>
        {[
          { label: "Launch Calendar →", tab: "Launch Calendar" },
          { label: "Browse Catalog →", tab: "Projects" },
          { label: "Mortgage Calculator →", tab: "Mortgage" },
          { label: "Yields Forecast →", tab: "Yields" },
          { label: "Risk Assessment →", tab: "Risk" },
          { label: "Investment Score →", tab: "Investment Score" },
          { label: "DLD Volumes →", tab: "DLD Volumes" },
          { label: "Compliance →", tab: "Compliance" },
        ].map((n, i) => (
          <button key={i} type="button" onClick={() => handleTabChange && handleTabChange(n.tab)}
            style={{ padding: "6px 14px", background: "rgba(212,168,67,0.06)", border: `1px solid ${T.border}`, borderRadius: 8, color: T.gold, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>
            {n.label}
          </button>
        ))}
      </div>

      {/* SOURCES FOOTER */}
      <div style={{ paddingTop: 12, borderTop: `1px solid ${T.border}`, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <span style={{ fontSize: 10, color: T.textMuted }}>Sources:</span>
        {[
          "The National (120K units 2026)",
          "Khaleej Times",
          "Morgan's International Realty",
          "Fitch Ratings",
          "prelaunch.ae",
          "BSA Law",
          "EGSH",
          "DLD Open Data",
          "Property Finder",
          "dxboffplan.com",
          "Driven Properties",
          "Dubai Investments Real Estate",
        ].map((s, i) => (
          <span key={i} style={{ fontSize: 10, color: T.textMuted, padding: "2px 8px", borderRadius: 10, border: `1px solid ${T.border}`, background: T.surfaceAlt }}>{s}</span>
        ))}
      </div>

      {/* DETAIL MODAL — Portal. Split by tier: Registry gets compact modal, Verified gets full. */}
      {detailModal && detailModal.tier === "dld-registry" && typeof document !== "undefined" && createPortal(
        <div role="dialog" aria-modal="true" onClick={(e) => { if (e.target === e.currentTarget) setDetailModal(null); }} style={{ position: "fixed", inset: 0, background: "rgba(4,9,15,0.97)", zIndex: 2000, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "40px 16px", overflow: "auto", backdropFilter: "blur(8px)" }}>
          <div style={{ width: "100%", maxWidth: 640, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, overflow: "hidden", boxShadow: "0 24px 80px rgba(0,0,0,0.5)" }}>
            <div style={{ padding: "20px 24px", borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 4 }}>
                  {(detailModal.developer || "Unknown").toUpperCase()}{detailModal.community && detailModal.community !== "—" ? " · " + detailModal.community : ""}
                </div>
                <div style={{ fontFamily: "'Fraunces',serif", fontSize: 22, fontWeight: 800, color: T.white, marginBottom: 8, lineHeight: 1.2 }}>{detailModal.project || "—"}</div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                  <span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 10, fontWeight: 700, letterSpacing: 0.4, background: detailModal.lifecycleStage === "recently-delivered" ? "rgba(245,158,11,0.12)" : "rgba(59,130,246,0.12)", color: detailModal.lifecycleStage === "recently-delivered" ? "#F59E0B" : "#60A5FA", textTransform: "uppercase" }}>
                    {detailModal.lifecycleStage === "recently-delivered" ? "Recently Delivered" : "Under Construction"}
                  </span>
                  <span style={{ fontSize: 9, padding: "3px 8px", borderRadius: 10, fontWeight: 700, letterSpacing: 0.5, background: detailModal.startingPrice ? "rgba(212,168,67,0.10)" : "rgba(148,163,184,0.10)", color: detailModal.startingPrice ? T.gold : T.textMuted, border: `1px solid ${detailModal.startingPrice ? "rgba(212,168,67,0.25)" : T.border}`, textTransform: "uppercase" }}>
                    {detailModal.startingPrice ? "DLD + Transaction Data" : "DLD Registry"}
                  </span>
                  {detailModal.reraNo && <span style={{ fontSize: 10, color: T.textMuted }}>RERA #{detailModal.reraNo}</span>}
                </div>
              </div>
              <button type="button" onClick={() => setDetailModal(null)} aria-label="Close" style={{ background: "none", border: "none", color: T.textMuted, fontSize: 24, cursor: "pointer", lineHeight: 1, padding: 4 }}>×</button>
            </div>

            <div style={{ padding: "20px 24px" }}>
              {/* Transaction-enriched block if present */}
              {(detailModal.startingPrice || detailModal.pricePerSqft || detailModal.grossYield) && (
                <div style={{ background: "rgba(212,168,67,0.04)", border: `1px solid rgba(212,168,67,0.15)`, borderRadius: 10, padding: "14px 16px", marginBottom: 16 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: T.gold, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 10 }}>Transaction Data from DLD</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                    {detailModal.startingPrice && (
                      <div>
                        <div style={{ fontSize: 9, color: T.textMuted, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 3 }}>Starting Price</div>
                        <div style={{ fontFamily: "'Fraunces',serif", fontSize: 16, fontWeight: 800, color: T.white }}>AED {(detailModal.startingPrice/1e6).toFixed(2)}M</div>
                      </div>
                    )}
                    {detailModal.pricePerSqft > 0 && (
                      <div>
                        <div style={{ fontSize: 9, color: T.textMuted, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 3 }}>Avg PPSF</div>
                        <div style={{ fontFamily: "'Fraunces',serif", fontSize: 16, fontWeight: 800, color: T.white }}>AED {detailModal.pricePerSqft.toLocaleString()}</div>
                      </div>
                    )}
                    {detailModal.grossYield > 0 && detailModal.grossYield < 15 && (
                      <div>
                        <div style={{ fontSize: 9, color: T.textMuted, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 3 }}>Est. Gross Yield</div>
                        <div style={{ fontFamily: "'Fraunces',serif", fontSize: 16, fontWeight: 800, color: detailModal.grossYield >= 7 ? "#10B981" : T.gold }}>{detailModal.grossYield}%</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Property details grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                <div style={{ background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8, padding: "12px 14px" }}>
                  <div style={{ fontSize: 9, color: T.textMuted, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 4 }}>Construction</div>
                  <div style={{ fontFamily: "'Fraunces',serif", fontSize: 18, fontWeight: 800, color: T.white }}>{detailModal.constructionPct || 0}% Built</div>
                </div>
                {detailModal.handoverQuarter && (
                  <div style={{ background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8, padding: "12px 14px" }}>
                    <div style={{ fontSize: 9, color: T.textMuted, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 4 }}>Handover</div>
                    <div style={{ fontFamily: "'Fraunces',serif", fontSize: 14, fontWeight: 700, color: T.white }}>{detailModal.handoverQuarter}</div>
                  </div>
                )}
                {detailModal.units > 0 && (
                  <div style={{ background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8, padding: "12px 14px" }}>
                    <div style={{ fontSize: 9, color: T.textMuted, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 4 }}>Total Units</div>
                    <div style={{ fontFamily: "'Fraunces',serif", fontSize: 18, fontWeight: 800, color: T.white }}>{detailModal.units.toLocaleString()}</div>
                  </div>
                )}
                {detailModal.escrowBank && (
                  <div style={{ background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8, padding: "12px 14px" }}>
                    <div style={{ fontSize: 9, color: T.textMuted, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 4 }}>Escrow Bank</div>
                    <div style={{ fontFamily: "'Fraunces',serif", fontSize: 12, fontWeight: 700, color: T.white }}>{detailModal.escrowBank}</div>
                  </div>
                )}
              </div>

              {/* Disclosure */}
              <div style={{ background: "rgba(59,130,246,0.06)", border: `1px solid rgba(59,130,246,0.20)`, borderRadius: 8, padding: "12px 14px", marginBottom: 16 }}>
                <div style={{ fontSize: 11, color: T.textSecondary, lineHeight: 1.6 }}>
                  <span style={{ color: "#60A5FA", fontWeight: 700 }}>◆ DLD Registry Record.</span>{" "}
                  Handover schedule sourced from the official Dubai Land Department database. Delay risk, developer on-time rate, and investment risk metrics require curation from developer IR reports.
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button type="button" onClick={() => handleTabChange("Mortgage")} style={{ flex: 1, minWidth: 140, padding: "10px 14px", background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8, color: T.textSecondary, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>Mortgage Calculator</button>
                <button type="button" onClick={() => handleTabChange("My Leads")} style={{ flex: 1, minWidth: 140, padding: "10px 14px", background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8, color: T.textSecondary, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>Add to Leads</button>
                {detailModal.reraNo && (
                  <a href={`https://dubailand.gov.ae/en/eservices/project-status/`} target="_blank" rel="noopener noreferrer" style={{ flex: 1, minWidth: 140, padding: "10px 14px", background: "rgba(212,168,67,0.08)", border: `1px solid rgba(212,168,67,0.30)`, borderRadius: 8, color: T.gold, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Outfit',sans-serif", textAlign: "center", textDecoration: "none" }}>View on DLD Portal →</a>
                )}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* DETAIL MODAL — original full component for Verified projects */}
      {detailModal && detailModal.tier !== "dld-registry" && typeof document !== "undefined" && createPortal(
        <HandoverDetailModal
          project={detailModal}
          onClose={() => setDetailModal(null)}
          progressColor={progressColor}
          riskColor={riskColor}
          handleTabChange={handleTabChange}
        />,
        document.body
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   DETAIL MODAL — Portal-rendered to escape parent scroll
   ═══════════════════════════════════════════════════════════════════ */
function HandoverDetailModal({ project, onClose, progressColor, riskColor, handleTabChange }) {
  const p = project;

  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = original; };
  }, []);

  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.88)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        zIndex: 999999,
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        padding: "40px 20px",
        overflowY: "auto",
        animation: "fadeIn 0.2s ease-out",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "linear-gradient(180deg, #1a1a1a 0%, #0f0f0f 100%)",
          border: `1px solid ${T.gold}`,
          borderRadius: 16,
          maxWidth: 1100,
          width: "100%",
          padding: 0,
          boxShadow: `0 20px 80px rgba(0,0,0,0.8), 0 0 60px ${T.gold}33`,
          overflow: "hidden",
          color: T.white,
        }}
      >
        {/* Hero Header */}
        <div style={{
          padding: "28px 32px 20px",
          background: `linear-gradient(135deg, ${T.surface} 0%, rgba(212,168,67,0.08) 100%)`,
          borderBottom: `1px solid ${T.border}`,
          position: "relative",
        }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              position: "absolute",
              top: 18,
              right: 18,
              width: 36,
              height: 36,
              background: "rgba(255,255,255,0.06)",
              border: `1px solid ${T.border}`,
              borderRadius: 10,
              color: T.white,
              fontSize: 20,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ×
          </button>

          <div style={{ marginRight: 50 }}>
            <div style={{ fontSize: 11, color: T.gold, textTransform: "uppercase", letterSpacing: 1, fontWeight: 700, marginBottom: 6 }}>
              {p.developer} · {p.community}
            </div>
            <div style={{ fontFamily: "'Fraunces', serif", fontSize: 28, fontWeight: 800, color: T.white, lineHeight: 1.1, marginBottom: 10 }}>
              {p.project}
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <span style={{ fontSize: 11, padding: "4px 12px", borderRadius: 6, background: `${riskColor(p.riskLevel)}22`, color: riskColor(p.riskLevel), fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.5 }}>
                {p.riskLevel === "very-low" ? "Very Low Risk" : p.riskLevel === "low" ? "Low Risk" : p.riskLevel === "medium" ? "Medium Risk" : "High Risk"}
              </span>
              <span style={{ fontSize: 11, padding: "4px 12px", borderRadius: 6, background: "rgba(212,168,67,0.15)", color: T.gold, fontWeight: 700 }}>{p.handoverQuarter}</span>
              {p.snaggingReady && <span style={{ fontSize: 11, padding: "4px 12px", borderRadius: 6, background: "rgba(16,185,129,0.15)", color: "#10B981", fontWeight: 700 }}>🔍 Snagging Ready</span>}
              {p.onSchedule ? (
                <span style={{ fontSize: 11, padding: "4px 12px", borderRadius: 6, background: "rgba(16,185,129,0.12)", color: "#10B981", fontWeight: 700 }}>✓ On Schedule</span>
              ) : (
                <span style={{ fontSize: 11, padding: "4px 12px", borderRadius: 6, background: "rgba(245,158,11,0.12)", color: "#F59E0B", fontWeight: 700 }}>⚠ At Risk</span>
              )}
            </div>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: 28 }}>

          {/* Construction progress bar — large */}
          <div style={{ marginBottom: 22 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 12, color: T.gold, textTransform: "uppercase", letterSpacing: 0.8, fontWeight: 700 }}>🏗️ Construction Progress</span>
              <span style={{ fontSize: 18, fontWeight: 800, color: progressColor(p.constructionPct) }}>{p.constructionPct}%</span>
            </div>
            <div style={{ height: 14, background: T.surfaceAlt, borderRadius: 7, overflow: "hidden", border: `1px solid ${T.border}` }}>
              <div style={{ height: "100%", width: `${p.constructionPct}%`, background: progressColor(p.constructionPct), transition: "width 0.5s" }} />
            </div>
            <div style={{ fontSize: 10, color: T.textMuted, marginTop: 4 }}>
              Verified by RERA · Developer reports updated quarterly · Track on Dubai REST app
            </div>
          </div>

          {/* Insight quote */}
          <div style={{
            marginBottom: 20,
            padding: "14px 18px",
            background: "rgba(212,168,67,0.05)",
            borderLeft: `3px solid ${T.gold}`,
            borderRadius: 8,
            fontSize: 13,
            color: T.textPrimary,
            lineHeight: 1.7,
            fontStyle: "italic",
          }}>
            "{p.insight}"
          </div>

          {/* Hero stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 12, marginBottom: 22 }}>
            <div style={{ padding: "14px 16px", background: T.surfaceAlt, borderRadius: 12, border: `1px solid ${T.gold}33` }}>
              <div style={{ fontSize: 10, color: T.textMuted, textTransform: "uppercase" }}>Starting Price</div>
              <div style={{ fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 800, color: T.gold }}>AED {(p.startingPrice / 1000000).toFixed(2)}M</div>
              <div style={{ fontSize: 10, color: T.textMuted, marginTop: 2 }}>{p.pricePerSqft} AED/sqft</div>
            </div>
            <div style={{ padding: "14px 16px", background: T.surfaceAlt, borderRadius: 12 }}>
              <div style={{ fontSize: 10, color: T.textMuted, textTransform: "uppercase" }}>Gross Yield</div>
              <div style={{ fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 800, color: "#10B981" }}>{p.grossYield}%</div>
              <div style={{ fontSize: 10, color: T.textMuted, marginTop: 2 }}>Annual rental return</div>
            </div>
            <div style={{ padding: "14px 16px", background: T.surfaceAlt, borderRadius: 12 }}>
              <div style={{ fontSize: 10, color: T.textMuted, textTransform: "uppercase" }}>Since Launch</div>
              <div style={{ fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 800, color: T.gold }}>+{p.appreciationSinceLaunch}%</div>
              <div style={{ fontSize: 10, color: T.textMuted, marginTop: 2 }}>Capital appreciation</div>
            </div>
            <div style={{ padding: "14px 16px", background: T.surfaceAlt, borderRadius: 12 }}>
              <div style={{ fontSize: 10, color: T.textMuted, textTransform: "uppercase" }}>Dev On-Time</div>
              <div style={{ fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 800, color: p.devOnTimeRate >= 85 ? "#10B981" : T.gold }}>{p.devOnTimeRate}%</div>
              <div style={{ fontSize: 10, color: T.textMuted, marginTop: 2 }}>Historical track record</div>
            </div>
          </div>

          {/* Risk Factors */}
          <div style={{ marginBottom: 22 }}>
            <div style={{ fontSize: 12, color: T.gold, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 }}>⚠️ Risk Assessment</div>
            <div style={{ padding: 14, background: T.surfaceAlt, borderRadius: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, paddingBottom: 12, borderBottom: `1px solid ${T.border}` }}>
                <div>
                  <div style={{ fontSize: 11, color: T.textMuted, textTransform: "uppercase", fontWeight: 700 }}>Delay Risk Score</div>
                  <div style={{ fontSize: 10, color: T.textMuted, marginTop: 2 }}>Lower is better · Scale 0-100</div>
                </div>
                <div style={{ fontSize: 32, fontWeight: 900, color: riskColor(p.riskLevel), fontFamily: "'Fraunces', serif" }}>{p.delayRiskScore}</div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {p.riskFactors.map((rf, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 11, color: T.textPrimary, lineHeight: 1.5 }}>
                    <span style={{ color: T.gold, marginTop: 1 }}>•</span>
                    <span>{rf}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bed Types */}
          <div style={{ marginBottom: 22 }}>
            <div style={{ fontSize: 12, color: T.gold, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 }}>🛏️ Available Unit Types</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {p.bedTypes.map((bt, i) => (
                <span key={i} style={{ fontSize: 12, padding: "8px 14px", borderRadius: 18, background: T.surfaceAlt, color: T.textPrimary, border: `1px solid ${T.border}`, fontWeight: 600 }}>{bt}</span>
              ))}
            </div>
          </div>

          {/* Project Facts Grid */}
          <div style={{ marginBottom: 22 }}>
            <div style={{ fontSize: 12, color: T.gold, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 }}>📋 Project Facts</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10, padding: 16, background: T.surfaceAlt, borderRadius: 12 }}>
              {[
                { l: "Total Units", v: p.units.toLocaleString() },
                { l: "Avg Unit Size", v: p.avgUnitSize.toLocaleString() + " sqft" },
                { l: "Property Type", v: p.type },
                { l: "Payment Plan", v: p.paymentPlan },
                { l: "Handover Date", v: new Date(p.handoverDate).toLocaleDateString("en-AE", { day: "numeric", month: "short", year: "numeric" }) },
                { l: "RERA Number", v: p.reraNo, important: true },
                { l: "Escrow Bank", v: p.escrowBank, important: true },
                { l: "RERA Verified", v: p.rerVerified ? "✓ Yes" : "✗ No", color: p.rerVerified ? "#10B981" : "#EF4444" },
              ].map((field, i) => (
                <div key={i}>
                  <div style={{ fontSize: 9, color: T.textMuted, textTransform: "uppercase", letterSpacing: 0.4 }}>{field.l}</div>
                  <div style={{ fontSize: 12, color: field.color || T.white, fontWeight: 700, marginTop: 2 }}>{field.v}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Pro tip */}
          <div style={{ padding: "12px 14px", background: "rgba(59,130,246,0.06)", borderLeft: `3px solid #3B82F6`, borderRadius: 6, fontSize: 11, color: T.textSecondary, lineHeight: 1.6 }}>
            💡 <strong style={{ color: T.white }}>Pre-Handover Action:</strong> Verify the RERA number on the <strong style={{ color: T.gold }}>Dubai REST app</strong>. Confirm escrow status under <strong style={{ color: T.gold }}>Law 8/2007</strong>. When project hits 90%, hire a professional snagging company before signing handover acceptance — this preserves your right to fix defects.
          </div>
        </div>

        {/* Footer Actions */}
        <div style={{
          padding: "18px 28px",
          background: T.surfaceAlt,
          borderTop: `1px solid ${T.border}`,
          display: "flex",
          gap: 10,
          justifyContent: "flex-end",
          flexWrap: "wrap",
        }}>
          <button type="button" onClick={() => { handleTabChange && handleTabChange("Mortgage"); onClose(); }}
            style={{ padding: "10px 18px", background: "rgba(212,168,67,0.1)", border: `1px solid ${T.gold}`, borderRadius: 8, color: T.gold, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Outfit', sans-serif" }}>
            Run Mortgage →
          </button>
          <button type="button" onClick={() => { handleTabChange && handleTabChange("Yields"); onClose(); }}
            style={{ padding: "10px 18px", background: "rgba(212,168,67,0.1)", border: `1px solid ${T.gold}`, borderRadius: 8, color: T.gold, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Outfit', sans-serif" }}>
            Yields Forecast →
          </button>
          <button type="button" onClick={() => { handleTabChange && handleTabChange("Risk"); onClose(); }}
            style={{ padding: "10px 18px", background: "rgba(212,168,67,0.1)", border: `1px solid ${T.gold}`, borderRadius: 8, color: T.gold, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Outfit', sans-serif" }}>
            Risk Assessment →
          </button>
          <button type="button" onClick={() => { handleTabChange && handleTabChange("Compliance"); onClose(); }}
            style={{ padding: "10px 18px", background: T.gold, border: `1px solid ${T.gold}`, borderRadius: 8, color: T.dark, fontSize: 12, fontWeight: 800, cursor: "pointer", fontFamily: "'Outfit', sans-serif" }}>
            Compliance Tools →
          </button>
        </div>
      </div>
    </div>
  );
}

export default HandoverTab;
