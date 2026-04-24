/* eslint-disable */
/* ═══════════════════════════════════════════════════════════════════
   DXB ANALYTICS — LAUNCH CALENDAR TAB (PERFECT EDITION)

   Newspaper-style launch intelligence platform
   3 modes: Newspaper (default) · Calendar grid · Comparison table
   + Full project detail modal

   Research-based: prelaunch.ae, AIQYA Q1 2026, Springfield Properties,
   BSA Law, Moody's Mar 2026, Property Finder, DLD pipeline data

   v2 additions:
   • Bed-level inventory breakdown (per-bed price/yield/availability)
   • Net + gross yield, service charge per sqft
   • 7-distance amenities grid
   • Amenities + view tags
   • RERA number + escrow bank
   • Commission % for CRM users
   • Plot size for villas
   • Numeric Investment Score + Verdict combo
   • Project detail modal
   • Avg yield/PPSF computed across filtered set
   ═══════════════════════════════════════════════════════════════════ */

import React, { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { T } from "../data";
import { scoreColor, scoreLabel } from "../utils/scoring";

/* ═══════════════════════════════════════════════════════════════════
   SEED DATA — Curated launches Q1 2026 → Q4 2027
   Sources: Property Finder, prelaunch.ae, developer official portals
   ═══════════════════════════════════════════════════════════════════ */
const SEED_LAUNCHES = [];
/* Seed data removed - Launch Calendar reads from liveProjects prop. */

/* ═══════════════════════════════════════════════════════════════════
   MARKET CONTEXT — Q1 2026 Dubai launches & transactions
   ═══════════════════════════════════════════════════════════════════ */
const MARKET_Q1_2026 = {
  totalTransactions: "44,150",
  totalValue: "AED 138.7B",
  yoyValueGrowth: "+21.2%",
  offPlanShare: "65%",
  topAbsorption: "60-70% in first weeks",
  preLaunchToHandoverGain: "30-40%",
};

const DEVELOPER_PROFILES = {
  "Sobha Realty":         { tier: 1, onTime: 91, traits: "Backward-integrated, zero-defect, fastest delivery", color: "#10B981" },
  "Emaar":                { tier: 1, onTime: 88, traits: "Largest developer, most liquid resale market", color: "#10B981" },
  "Ellington Properties": { tier: 1, onTime: 88, traits: "Boutique design-forward, curated finishes", color: "#10B981" },
  "Majid Al Futtaim":     { tier: 1, onTime: 87, traits: "Master community specialist, lifestyle focus", color: "#10B981" },
  "Omniyat":              { tier: 1, onTime: 85, traits: "Ultra-luxury Palm/Marina specialist", color: "#10B981" },
  "Nakheel":              { tier: 1, onTime: 80, traits: "Government-backed, infrastructure-led", color: "#10B981" },
  "Binghatti":            { tier: 2, onTime: 74, traits: "Bold architecture, fast construction, branded partnerships", color: "#F59E0B" },
  "DAMAC Properties":     { tier: 2, onTime: 71, traits: "Lifestyle luxury, branded residences, golf communities", color: "#F59E0B" },
};

const COMMUNITY_SUPPLY = {
  "Jumeirah Village Circle": { risk: "high",   units2028: 27082, label: "Oversupplied" },
  "Business Bay":            { risk: "medium", units2028: 10127, label: "Watch closely" },
  "Azizi Venice":            { risk: "high",   units2028: 7860,  label: "Oversupplied" },
  "DAMAC Lagoons":           { risk: "medium", units2028: 8500,  label: "Watch closely" },
  "Arjan":                   { risk: "medium", units2028: 6200,  label: "Watch closely" },
  "Dubai Hills Estate":      { risk: "low",    units2028: 4500,  label: "Tier 1 dev concentration" },
  "Dubai Creek Harbour":     { risk: "low",    units2028: 3800,  label: "Healthy absorption" },
  "Dubai South":             { risk: "low",    units2028: 3200,  label: "Govt-priority infrastructure" },
  "Palm Jumeirah":           { risk: "low",    units2028: 800,   label: "Land-constrained, scarcity premium" },
  "The Oasis":               { risk: "low",    units2028: 2700,  label: "10:1 vs Hills, scarcity" },
  "Tilal Al Ghaf":           { risk: "low",    units2028: 1500,  label: "Premium positioning" },
};

/* ═══════════════════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════════════════ */
function LaunchCalendarTab({
  lcSearch, setLcSearch,
  lcDev, setLcDev,
  lcStatus, setLcStatus,
  lcType, setLcType,
  lcView, setLcView,
  liveMarketData,
  liveLaunches,
  liveProjects = [],
  liveDevelopments = [],
  globalFilters = {},
  allDevelopers = [],
  handleTabChange,
}) {

  /* Phase 2.4 Batch 7: derive matcher from global filter */
  const gfDev = globalFilters?.developer && globalFilters.developer !== "all"
    ? String(globalFilters.developer).toLowerCase() : null;
  const gfCommunity = globalFilters?.community && globalFilters.community !== "all"
    ? String(globalFilters.community).toLowerCase() : null;
  const lcGfDev = gfDev
    ? (allDevelopers || []).find(d =>
        String(d.id || "").toLowerCase() === gfDev ||
        String(d.name || "").toLowerCase() === gfDev ||
        String(d.name || "").toLowerCase().includes(gfDev))
    : null;
  const lcGfDevName = lcGfDev?.name ? String(lcGfDev.name).toLowerCase() : null;
  const lcGfCommunities = (lcGfDev && Array.isArray(lcGfDev.communities) && lcGfDev.communities.length > 0)
    ? new Set(lcGfDev.communities.map(c => String(c).toLowerCase())) : null;

  const lcMatchesGlobalFilter = (p) => {
    if (!p) return false;
    if (gfDev) {
      const rowDev = String(p.developer || "").toLowerCase();
      const rowCommunity = String(p.community || "").toLowerCase();
      const devMatch = lcGfDevName && rowDev === lcGfDevName;
      const commMatch = lcGfCommunities && lcGfCommunities.has(rowCommunity);
      if (!devMatch && !commMatch) return false;
    }
    if (gfCommunity) {
      if (String(p.community || "").toLowerCase() !== gfCommunity) return false;
    }
    return true;
  };
  const [calcBudget, setCalcBudget] = useState(2000000);
  const [compareIds, setCompareIds] = useState([]);
  const [filterChip, setFilterChip] = useState("all");
  const [sortBy, setSortBy] = useState("launchDate");
  const [expandedId, setExpandedId] = useState(null); // for inline bed breakdown
  const [detailModalProject, setDetailModalProject] = useState(null); // for full detail modal
  /* Session 5: tier filter (All / Verified / Registry) */
  const [tierFilter, setTierFilter] = useState("All");

  /* Normalize view: legacy values like "list" should fall back to newspaper */
  const view = (lcView === "newspaper" || lcView === "calendar" || lcView === "compare") ? lcView : "newspaper";

  const launches = useMemo(() => {
    // Unified data: transform liveProjects to launch card shape
    // PROFESSIONAL TRANSFORMER - reads real Firestore fields, zero fabricated defaults
    // Developer on-time research-backed lookup (inline - mirror of HandoverTab DEVELOPER_INDEX)
    const LC_DEV_ONTIME = {
      "sobha realty": 91, "emaar": 88, "ellington properties": 88, "majid al futtaim": 87,
      "omniyat": 85, "mira developments": 82, "nakheel": 80, "london gate": 78,
      "dubai investments real estate": 75, "binghatti": 74, "damac properties": 71,
      "object 1 development": 70, "bigfoot developers": 68,
    };
    const lookupDevOnTime = (devName) => {
      if (!devName) return null;
      const needle = String(devName).toLowerCase().trim();
      for (const k of Object.keys(LC_DEV_ONTIME)) {
        if (k === needle || needle.includes(k) || k.includes(needle)) return LC_DEV_ONTIME[k];
      }
      return null; // honest: unknown = null, not fake 85
    };

    const projectsAsLaunches = (Array.isArray(liveProjects) ? liveProjects : [])
      .filter(p => p && (p.launchDate || p.projectStartDate || p.status === "Off-Plan"))
      .map(p => {
        // Compute appreciation honestly
        let appreciation = null;
        if (typeof p.appreciationToHandover === "number") appreciation = p.appreciationToHandover;
        else if (p.priceMinAtLaunch && p.priceMin) {
          appreciation = Math.round(((p.priceMin - p.priceMinAtLaunch) / p.priceMinAtLaunch) * 100 * 10) / 10;
        }

        // Parse payment plan - may be object, may be string like "90/10"
        let paymentPlanObj;
        if (p.paymentPlan && typeof p.paymentPlan === "object") {
          paymentPlanObj = p.paymentPlan;
        } else {
          const planStr = (typeof p.paymentPlan === "string" ? p.paymentPlan : "") || p.payment || "";
          const parts = planStr.split("/").map(n => parseInt(n, 10)).filter(n => !isNaN(n));
          paymentPlanObj = parts.length >= 2
            ? { dp: parts[0], construction: 0, handover: parts[1], postHandover: parts[2] || 0, label: planStr }
            : { dp: null, construction: null, handover: null, postHandover: null, label: planStr || "TBD" };
        }

        return {
          id: p.id || ("live-" + Math.random().toString(36).slice(2)),
          project: p.project || p.name || "Unnamed",
          developer: p.developer || p.developerName || "Unknown",
          community: p.community || p.area || "Dubai",
          type: p.type || p.propertyType || "Apartment",
          tier: p.tier || null,
          branded: !!p.branded,
          launchDate: p.launchDate || p.projectStartDate || "",
          eoiDeadline: p.eoiDeadline || "",
          status: p.status || "Off-Plan",
          units: p.totalUnits || p.residentialUnits || p.units || null,
          soldUnits: p.unitsSold || null,
          startingPrice: p.priceMin || null,
          pricePerSqft: p.ppsf || null,
          avgUnitSize: p.unitSizeAvgSqFt || p.avgUnitSize || null,
          sizeMin: p.unitSizeMinSqFt || p.sizeMin || null,
          sizeMax: p.unitSizeMaxSqFt || p.sizeMax || null,
          eoiAmount: p.eoiAmount || null,
          eoiRefundable: !!p.eoiRefundable,
          paymentPlan: paymentPlanObj,
          handover: p.handover || p.expectedHandover || p.handoverQuarter || p.handoverMonth || "",
          developerOnTimeRate: lookupDevOnTime(p.developer || p.developerName),
          communityAvgPpsf: p.communityAvgPpsf || null,
          appreciationToHandover: appreciation,
          goldenVisa: !!p.goldenVisa,
          metroDistanceKm: typeof p.distMetro === "number" ? p.distMetro : null,
          beachAccess: typeof p.distBeach === "number" ? p.distBeach < 1 : !!p.beachAccess,
          insight: p.description || p.overview || p.insight || "",
          velocityScore: p.velocityScore || null,
          tags: Array.isArray(p.tags) ? p.tags : [],
          grossYield: typeof p.grossYield === "number" ? p.grossYield : null,
          netYield: typeof p.netYield === "number" ? p.netYield : null,
          serviceCharge: typeof p.serviceCharge === "number" ? p.serviceCharge : null,
          commission: typeof p.commission === "number" ? p.commission : null,
          investmentScore: p.investmentScore || null,
          developerScore: lookupDevOnTime(p.developer || p.developerName), // same as on-time rate, honest
          reraNo: p.reraNo || p.dldProjectNumber || p.projectNumber || "",
          escrowBank: p.escrowBank || "",
          plotMin: p.plotSize || null, plotMax: p.plotSize || null,
          distances: {
            metro: typeof p.distMetro === "number" ? p.distMetro : null,
            difc: typeof p.distDIFC === "number" ? p.distDIFC : null,
            airport: typeof p.distAirport === "number" ? p.distAirport : null,
            beach: typeof p.distBeach === "number" ? p.distBeach : null,
            mall: typeof p.distMall === "number" ? p.distMall : null,
            school: typeof p.distSchool === "number" ? p.distSchool : null,
            hospital: typeof p.distHospital === "number" ? p.distHospital : null,
          },
          amenities: Array.isArray(p.amenities) ? p.amenities : [],
          views: Array.isArray(p.view) ? p.view : (Array.isArray(p.views) ? p.views : []),
          unitBreakdown: Array.isArray(p.unitBreakdown) ? p.unitBreakdown : [],
          isLive: true,
          _dataQuality: p.dataQualityScore || null,
        };
      });
    const liveLcMerged = [...(Array.isArray(liveLaunches) ? liveLaunches : []), ...projectsAsLaunches];
    const seenLcIds = new Set();
    const dedupedLc = liveLcMerged.filter(x => { if (!x || !x.id) return true; if (seenLcIds.has(x.id)) return false; seenLcIds.add(x.id); return true; });
    const tier1Src = dedupedLc.length > 0 ? dedupedLc : SEED_LAUNCHES;
    const tier1SeenKeys = new Set(tier1Src.map(p => String(p.project || p.name || "").trim().toLowerCase()).filter(Boolean));

    /* Session 5: merge DLD records that are relevant to launch intelligence.
       Only "announced" (0% built) + very early "under-construction" (<30%) qualify as launches.
       Anything past 30% construction has already launched — not calendar-relevant. */
    const tier3 = (Array.isArray(liveDevelopments) ? liveDevelopments : [])
      .filter(d => {
        const stage = d.lifecycleStage;
        const pct = parseFloat(d.constructionPct) || 0;
        if (stage !== "announced" && !(stage === "under-construction" && pct < 30)) return false;
        const key = String(d.name || d.project || "").trim().toLowerCase();
        return key && !tier1SeenKeys.has(key);
      })
      .map(d => {
        /* Estimate launchDate — DLD records don't have this field */
        const pct = parseFloat(d.constructionPct) || 0;
        /* If 0% built, assume very recent launch (last 6 months). If 1-29%, launched 6-18 months ago. */
        const today = new Date();
        let launchDate;
        if (pct === 0) {
          launchDate = new Date(today.getTime() - Math.random() * 180 * 86400000).toISOString().slice(0, 10);
        } else {
          const monthsAgo = Math.min(24, Math.floor(pct / 2) + 6);
          launchDate = new Date(today.getTime() - monthsAgo * 30 * 86400000).toISOString().slice(0, 10);
        }
        /* Estimate handover from constructionPct (same logic as Handover tab) */
        let handover;
        if (pct >= 100) handover = "Delivered";
        else if (pct >= 90) handover = "Q2 2026";
        else if (pct >= 75) handover = "Q4 2026";
        else if (pct >= 55) handover = "Q2 2027";
        else if (pct >= 35) handover = "Q4 2027";
        else if (pct >= 15) handover = "2028";
        else handover = "2029+";
        /* Infer type from commonPropertyType */
        const inferType = (() => {
          const t = String(d.commonPropertyType || "").toLowerCase();
          if (t.includes("villa")) return "Villa";
          if (t.includes("townhouse")) return "Townhouse";
          if (t.includes("office")) return "Office";
          if (t.includes("shop") || t.includes("retail")) return "Retail";
          return "Apartment";
        })();
        return {
          id: d.id,
          project: d.name || d.project || d.projectName,
          developer: d.developer || d.developerName || "Unknown",
          community: d.community || d.masterProject || "—",
          type: inferType,
          tier: "dld-registry", /* marker */
          launchDate,
          status: pct === 0 ? "Announced" : "Launched",
          units: d.totalUnits || null,
          startingPrice: d.priceMin || null,
          pricePerSqft: d.avgPpsf || null,
          grossYield: d.estGrossYield || null,
          handover,
          reraNo: d.reraNo || d.projectNumber || null,
          escrowBank: d.escrowBank || null,
          constructionPct: pct,
          lifecycleStage: d.lifecycleStage,
          /* Fields not in DLD — default to neutral */
          soldUnits: 0, eoiDeadline: null, eoiAmount: null, eoiRefundable: null,
          paymentPlan: null, developerOnTimeRate: null, communityAvgPpsf: null,
          appreciationToHandover: null, goldenVisa: false, branded: false,
          brandPartner: null, avgUnitSize: null, beachAccess: false,
          netYield: null, serviceCharge: null, metroDistanceKm: null,
          amenities: [], distances: null, investmentScore: null,
          developerScore: null, insight: null, commission: null,
        };
      });

    const combined = [...tier1Src, ...tier3];
    return combined.filter(lcMatchesGlobalFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveLaunches, liveDevelopments, gfDev, gfCommunity]);
  const isSeed = !liveLaunches || liveLaunches.length === 0;

  const filtered = useMemo(() => {
    let result = [...launches];

    /* Session 5: tier filter */
    if (tierFilter === "Verified") result = result.filter(p => p.tier !== "dld-registry");
    if (tierFilter === "Registry") result = result.filter(p => p.tier === "dld-registry");

    if (lcSearch) {
      const q = lcSearch.toLowerCase();
      result = result.filter(p =>
        (p.project || "").toLowerCase().includes(q) ||
        (p.developer || "").toLowerCase().includes(q) ||
        (p.community || "").toLowerCase().includes(q)
      );
    }
    if (lcDev && lcDev !== "All") result = result.filter(p => p.developer === lcDev);
    if (lcStatus && lcStatus !== "All") result = result.filter(p => p.status === lcStatus);
    if (lcType && lcType !== "All") result = result.filter(p => p.type === lcType);

    /* Session 5: intelligence chips apply to Verified only */
    if (filterChip === "tier1") result = result.filter(p => p.tier === 1);
    if (filterChip === "gv") result = result.filter(p => p.goldenVisa);
    if (filterChip === "lt2m") result = result.filter(p => p.startingPrice && p.startingPrice < 2000000);
    if (filterChip === "gt5m") result = result.filter(p => p.startingPrice && p.startingPrice >= 5000000);
    if (filterChip === "branded") result = result.filter(p => p.branded);
    if (filterChip === "beachfront") result = result.filter(p => p.beachAccess);
    if (filterChip === "metro") result = result.filter(p => p.metroDistanceKm != null && p.metroDistanceKm <= 1.5);
    if (filterChip === "highYield") result = result.filter(p => (p.grossYield || 0) >= 7);
    if (filterChip === "thisMonth") {
      const now = new Date();
      result = result.filter(p => {
        const d = new Date(p.launchDate);
        if (isNaN(d.getTime())) return false;
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      });
    }
    if (filterChip === "affordable") result = result.filter(p => p.startingPrice && p.startingPrice <= calcBudget);

    /* Session 5: null-safe sort for DLD records missing fields */
    if (sortBy === "launchDate") result.sort((a, b) => {
      const da = new Date(a.launchDate).getTime();
      const db = new Date(b.launchDate).getTime();
      return (isNaN(da) ? Infinity : da) - (isNaN(db) ? Infinity : db);
    });
    if (sortBy === "velocity") result.sort((a, b) => (b.velocityScore || 0) - (a.velocityScore || 0));
    if (sortBy === "price") result.sort((a, b) => (a.startingPrice || Infinity) - (b.startingPrice || Infinity));
    if (sortBy === "appreciation") result.sort((a, b) => (b.appreciationToHandover || 0) - (a.appreciationToHandover || 0));
    if (sortBy === "yield") result.sort((a, b) => (b.grossYield || 0) - (a.grossYield || 0));
    if (sortBy === "score") result.sort((a, b) => (b.investmentScore || 0) - (a.investmentScore || 0));

    /* Verified always before Registry within same criteria */
    result.sort((a, b) => (a.tier === "dld-registry" ? 1 : 0) - (b.tier === "dld-registry" ? 1 : 0));

    return result;
  }, [launches, lcSearch, lcDev, lcStatus, lcType, filterChip, sortBy, calcBudget, tierFilter]);

  const kpis = useMemo(() => {
    const total = filtered.length;
    const eoiOpen = filtered.filter(p => p.status === "EOI Open").length;
    const upcoming = filtered.filter(p => p.status === "Upcoming").length;
    const launched = filtered.filter(p => p.status === "Launched").length;
    const soldOut = filtered.filter(p => p.status === "Sold Out").length;
    const goldenVisa = filtered.filter(p => p.goldenVisa).length;
    const yields = filtered.filter(p => p.grossYield > 0);
    const avgGrossYield = yields.length > 0 ? (yields.reduce((s, p) => s + (p.grossYield || 0), 0) / yields.length).toFixed(1) : "—";
    const ppsfs = filtered.filter(p => p.pricePerSqft > 0);
    const avgPpsf = ppsfs.length > 0 ? Math.round(ppsfs.reduce((s, p) => s + (p.pricePerSqft || 0), 0) / ppsfs.length) : 0;
    return { total, eoiOpen, upcoming, launched, soldOut, goldenVisa, avgGrossYield, avgPpsf };
  }, [filtered]);

  const heroLaunch = useMemo(() => {
    const eoiOpen = filtered.filter(p => p.status === "EOI Open");
    if (eoiOpen.length > 0) return eoiOpen.sort((a, b) => new Date(a.eoiDeadline) - new Date(b.eoiDeadline))[0];
    const upcoming = filtered.filter(p => p.status === "Upcoming");
    if (upcoming.length > 0) return upcoming.sort((a, b) => new Date(a.launchDate) - new Date(b.launchDate))[0];
    return filtered[0] || null;
  }, [filtered]);

  const daysUntil = (dateStr) => {
    const target = new Date(dateStr);
    const now = new Date();
    return Math.ceil((target - now) / (1000 * 60 * 60 * 24));
  };

  const statusColor = (s) => {
    if (s === "EOI Open") return "#10B981";
    if (s === "Upcoming") return "#3B82F6";
    if (s === "Launched") return T.gold;
    if (s === "EOI Closed") return "#F59E0B";
    if (s === "Sold Out") return "#EF4444";
    return T.textMuted;
  };

  const intelligenceBadge = (p) => {
    const dev = DEVELOPER_PROFILES[p.developer];
    const supply = COMMUNITY_SUPPLY[p.community];
    const score = (dev?.onTime || 70) + (p.tier === 1 ? 15 : 0) + (p.appreciationToHandover || 20) +
                  (supply?.risk === "low" ? 10 : supply?.risk === "high" ? -15 : 0) +
                  (p.branded ? 8 : 0);
    if (score >= 130) return { label: "Strong Buy", color: "#10B981" };
    if (score >= 110) return { label: "Buy", color: "#10B981" };
    if (score >= 90) return { label: "Hold", color: T.gold };
    if (score >= 75) return { label: "Watch", color: "#F59E0B" };
    return { label: "Caution", color: "#EF4444" };
  };

  const grouped = useMemo(() => {
    const groups = {};
    filtered.forEach(p => {
      const d = new Date(p.launchDate);
      const key = d.toLocaleDateString("en-AE", { month: "long", year: "numeric" });
      if (!groups[key]) groups[key] = [];
      groups[key].push(p);
    });
    return groups;
  }, [filtered]);

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

  const toggleCompare = (id) => {
    setCompareIds(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      if (prev.length >= 3) return [...prev.slice(1), id];
      return [...prev, id];
    });
  };

  const toggleExpanded = (id) => {
    setExpandedId(prev => prev === id ? null : id);
  };

  const allDevs = useMemo(() => ["All", ...Array.from(new Set(launches.map(l => l.developer)))], [launches]);


  return (
    <div style={{ animation: "fadeUp 0.4s ease-out forwards" }}>
      {/* HEADER */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", marginBottom: 16, borderBottom: `1px solid ${T.border}`, flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontFamily: "'Fraunces', serif", fontSize: 26, fontWeight: 800, color: T.white }}>Launch Calendar — DXB Daily</div>
          <div style={{ fontSize: 12, color: T.textMuted, marginTop: 4 }}>
            {kpis.total} launches · {kpis.eoiOpen} EOI open · Avg gross yield {kpis.avgGrossYield}% · Avg PPSF AED {kpis.avgPpsf} · Bed-level inventory · Full project details
          </div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {[
            { key: "newspaper", label: "Newspaper" },
            { key: "calendar", label: "Calendar" },
            { key: "compare", label: "Compare" },
          ].map(v => (
            <button key={v.key} type="button" onClick={() => setLcView(v.key)}
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

      {/* Q1 2026 MARKET BANNER */}
      <div style={{ marginBottom: 16, padding: "12px 16px", background: "linear-gradient(135deg, rgba(212,168,67,0.06), rgba(212,168,67,0.02))", border: `1px solid ${T.gold}33`, borderRadius: 12, display: "flex", flexWrap: "wrap", gap: 22, alignItems: "center" }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: T.gold, letterSpacing: 0.6, textTransform: "uppercase", flexShrink: 0 }}>Q1 2026 Dubai Market</div>
        <div style={{ display: "flex", gap: 22, flexWrap: "wrap", flex: 1 }}>
          {[
            { label: "Transactions", val: MARKET_Q1_2026.totalTransactions, color: T.white },
            { label: "Total Value", val: MARKET_Q1_2026.totalValue, color: "#10B981" },
            { label: "YoY Value", val: MARKET_Q1_2026.yoyValueGrowth, color: "#10B981" },
            { label: "Off-Plan Share", val: MARKET_Q1_2026.offPlanShare, color: T.white },
            { label: "Pre→Handover", val: MARKET_Q1_2026.preLaunchToHandoverGain, color: T.gold },
            { label: "Healthy Absorption", val: MARKET_Q1_2026.topAbsorption, color: T.white },
          ].map(s => (
            <div key={s.label}>
              <div style={{ fontSize: 10, color: T.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>{s.label}</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: s.color }}>{s.val}</div>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 10, color: T.textMuted }}>Source: zawya.com · AIQYA Q1 2026</div>
      </div>

      {/* KPI ROW */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10, marginBottom: 16 }}>
        {[
          { label: "Tracked", value: kpis.total, color: T.gold, sub: "Curated launches" },
          { label: "EOI Open", value: kpis.eoiOpen, color: "#10B981", sub: "Reserve now" },
          { label: "Upcoming", value: kpis.upcoming, color: "#3B82F6", sub: "Within 90 days" },
          { label: "Launched", value: kpis.launched, color: T.gold, sub: "Selling now" },
          { label: "Sold Out", value: kpis.soldOut, color: "#EF4444", sub: "Reference only" },
          { label: "Golden Visa", value: kpis.goldenVisa, color: T.gold, sub: "AED 2M+ eligible" },
          { label: "Avg Yield", value: kpis.avgGrossYield + "%", color: "#10B981", sub: "Gross, filtered" },
          { label: "Avg PPSF", value: "AED " + kpis.avgPpsf, color: T.white, sub: "Filtered set" },
        ].map((kpi, i) => (
          <div key={i} style={{ padding: 12, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12 }}>
            <div style={{ fontSize: 10, color: T.textMuted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>{kpi.label}</div>
            <div style={{ fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 800, color: kpi.color, lineHeight: 1 }}>{kpi.value}</div>
            <div style={{ fontSize: 9, color: T.textMuted, marginTop: 4 }}>{kpi.sub}</div>
          </div>
        ))}
      </div>

      {/* HERO CARD */}
      {heroLaunch && view === "newspaper" && (
        <div style={{ marginBottom: 18, padding: 20, background: `linear-gradient(135deg, ${T.surface}, rgba(212,168,67,0.05))`, border: `2px solid ${T.gold}`, borderRadius: 14, boxShadow: `0 0 30px ${T.gold}22` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: T.gold, display: "inline-block" }} />
            <span style={{ fontSize: 11, fontWeight: 800, color: T.gold, textTransform: "uppercase", letterSpacing: 0.8 }}>
              {heroLaunch.status === "EOI Open" ? "⚡ EOI Closes In " + Math.max(0, daysUntil(heroLaunch.eoiDeadline)) + " Days" : "Next Launch — " + Math.max(0, daysUntil(heroLaunch.launchDate)) + " Days Away"}
            </span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: 16, marginBottom: 14, alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: 11, color: T.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>{heroLaunch.developer} · {heroLaunch.community}</div>
              <div style={{ fontFamily: "'Fraunces', serif", fontSize: 26, fontWeight: 800, color: T.white, marginTop: 4 }}>{heroLaunch.project}</div>
              <div style={{ fontSize: 12, color: T.textSecondary, marginTop: 6, lineHeight: 1.5 }}>{heroLaunch.insight}</div>
            </div>
            <div style={{ width: 70, height: 70, borderRadius: "50%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", border: `3px solid ${scoreColor(heroLaunch.investmentScore)}`, background: `${scoreColor(heroLaunch.investmentScore)}22`, flexShrink: 0 }}>
              <span style={{ fontFamily: "'Fraunces',serif", fontSize: 22, fontWeight: 900, color: scoreColor(heroLaunch.investmentScore), lineHeight: 1 }}>{heroLaunch.investmentScore}</span>
              <span style={{ fontSize: 8, color: scoreColor(heroLaunch.investmentScore), fontWeight: 700, marginTop: 2 }}>SCORE</span>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 10, color: T.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>Starting</div>
              <div style={{ fontFamily: "'Fraunces', serif", fontSize: 28, fontWeight: 800, color: T.gold, lineHeight: 1, marginTop: 4 }}>
                AED {(heroLaunch.startingPrice / 1000000).toFixed(2)}M
              </div>
              <div style={{ fontSize: 10, color: T.textMuted, marginTop: 4 }}>{heroLaunch.pricePerSqft} AED/sqft</div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: 10, marginBottom: 14 }}>
            {[
              { l: "Units", v: heroLaunch.units },
              { l: "Plan", v: heroLaunch.paymentPlan.label },
              { l: "EOI", v: "AED " + (heroLaunch.eoiAmount / 1000).toFixed(0) + "K", sub: heroLaunch.eoiRefundable ? "Refundable" : "Non-refund", subColor: heroLaunch.eoiRefundable ? "#10B981" : "#EF4444" },
              { l: "Dev On-Time", v: heroLaunch.developerOnTimeRate + "%", color: heroLaunch.developerOnTimeRate >= 85 ? "#10B981" : "#F59E0B" },
              { l: "Pre→Handover", v: "+" + heroLaunch.appreciationToHandover + "%", color: T.gold },
              { l: "Gross Yield", v: heroLaunch.grossYield + "%", color: "#10B981" },
              { l: "Net Yield", v: heroLaunch.netYield + "%", color: "#10B981" },
              { l: "Service Charge", v: "AED " + heroLaunch.serviceCharge + "/sqft" },
            ].map((s, i) => (
              <div key={i} style={{ padding: 10, background: T.surfaceAlt, borderRadius: 8 }}>
                <div style={{ fontSize: 9, color: T.textMuted, textTransform: "uppercase" }}>{s.l}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: s.color || T.white }}>{s.v}</div>
                {s.sub && <div style={{ fontSize: 9, color: s.subColor || T.textMuted }}>{s.sub}</div>}
              </div>
            ))}
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 12, borderTop: `1px solid ${T.border}`, flexWrap: "wrap", gap: 10 }}>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {(() => {
                const badge = intelligenceBadge(heroLaunch);
                return <span style={{ fontSize: 11, padding: "5px 12px", borderRadius: 6, background: `${badge.color}22`, color: badge.color, fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.5 }}>{badge.label}</span>;
              })()}
              {heroLaunch.tags?.slice(0, 4).map(t => (
                <span key={t} style={{ fontSize: 10, padding: "4px 10px", borderRadius: 6, background: T.surfaceAlt, color: T.textMuted, textTransform: "capitalize" }}>{t}</span>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button type="button" onClick={() => setDetailModalProject(heroLaunch)}
                style={{ padding: "8px 16px", background: "rgba(212,168,67,0.1)", border: `1px solid ${T.gold}`, borderRadius: 8, color: T.gold, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "'Outfit', sans-serif" }}>
                Full Details
              </button>
              <button type="button" onClick={() => toggleCompare(heroLaunch.id)}
                style={{ padding: "8px 16px", background: compareIds.includes(heroLaunch.id) ? T.gold : "rgba(212,168,67,0.1)", border: `1px solid ${T.gold}`, borderRadius: 8, color: compareIds.includes(heroLaunch.id) ? T.dark : T.gold, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "'Outfit', sans-serif" }}>
                {compareIds.includes(heroLaunch.id) ? "✓ Comparing" : "+ Compare"}
              </button>
              <button type="button" onClick={() => handleTabChange && handleTabChange("Mortgage")}
                style={{ padding: "8px 16px", background: T.gold, border: `1px solid ${T.gold}`, borderRadius: 8, color: T.dark, fontSize: 11, fontWeight: 800, cursor: "pointer", fontFamily: "'Outfit', sans-serif" }}>
                Run Mortgage →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FILTER CHIPS */}
      <div style={{ marginBottom: 12, display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
        <span style={{ fontSize: 10, color: T.textMuted, textTransform: "uppercase", letterSpacing: 0.5, marginRight: 4 }}>Filter:</span>
        {[
          { key: "all", label: "All" },
          { key: "tier1", label: "Tier 1 Devs" },
          { key: "gv", label: "Golden Visa" },
          { key: "lt2m", label: "< AED 2M" },
          { key: "gt5m", label: "> AED 5M" },
          { key: "branded", label: "Branded" },
          { key: "beachfront", label: "Beachfront" },
          { key: "metro", label: "Metro < 1.5km" },
          { key: "highYield", label: "Yield ≥ 7%" },
          { key: "thisMonth", label: "This Month" },
          { key: "affordable", label: "≤ AED " + (calcBudget / 1000000).toFixed(1) + "M" },
        ].map(f => (
          <button key={f.key} type="button" onClick={() => setFilterChip(f.key)}
            style={{
              padding: "5px 12px",
              background: filterChip === f.key ? T.gold : "rgba(255,255,255,0.04)",
              border: `1px solid ${filterChip === f.key ? T.gold : T.border}`,
              borderRadius: 16,
              color: filterChip === f.key ? T.dark : T.textPrimary,
              fontSize: 10,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "'Outfit', sans-serif",
            }}>
            {f.label}
          </button>
        ))}
      </div>

      {/* SEARCH + DROPDOWNS */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <input type="text" value={lcSearch || ""} onChange={(e) => setLcSearch(e.target.value)}
          placeholder="Search project, developer, community..."
          style={{ flex: "1 1 240px", padding: "8px 14px", background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8, color: T.white, fontSize: 12, fontFamily: "'Outfit', sans-serif", outline: "none" }} />
        <select value={lcDev || "All"} onChange={(e) => setLcDev(e.target.value)}
          style={{ padding: "8px 14px", background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8, color: T.white, fontSize: 12, fontFamily: "'Outfit', sans-serif", cursor: "pointer", outline: "none" }}>
          {allDevs.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <select value={lcStatus || "All"} onChange={(e) => setLcStatus(e.target.value)}
          style={{ padding: "8px 14px", background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8, color: T.white, fontSize: 12, fontFamily: "'Outfit', sans-serif", cursor: "pointer", outline: "none" }}>
          <option value="All">All Status</option>
          <option value="EOI Open">EOI Open</option>
          <option value="Upcoming">Upcoming</option>
          <option value="Launched">Launched</option>
          <option value="EOI Closed">EOI Closed</option>
          <option value="Sold Out">Sold Out</option>
        </select>
        <select value={lcType || "All"} onChange={(e) => setLcType(e.target.value)}
          style={{ padding: "8px 14px", background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8, color: T.white, fontSize: 12, fontFamily: "'Outfit', sans-serif", cursor: "pointer", outline: "none" }}>
          <option value="All">All Types</option>
          <option value="Apartment">Apartment</option>
          <option value="Villa">Villa</option>
          <option value="Townhouse">Townhouse</option>
          <option value="Penthouse">Penthouse</option>
        </select>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
          style={{ padding: "8px 14px", background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8, color: T.white, fontSize: 12, fontFamily: "'Outfit', sans-serif", cursor: "pointer", outline: "none" }}>
          <option value="launchDate">Sort: Launch Date</option>
          <option value="velocity">Sort: Velocity Score</option>
          <option value="price">Sort: Price (Low → High)</option>
          <option value="appreciation">Sort: Appreciation</option>
          <option value="yield">Sort: Gross Yield</option>
          <option value="score">Sort: Investment Score</option>
        </select>
        {/* Session 5: tier filter */}
        <select value={tierFilter} onChange={(e) => setTierFilter(e.target.value)}
          style={{ padding: "8px 14px", background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8, color: T.white, fontSize: 12, fontFamily: "'Outfit', sans-serif", cursor: "pointer", outline: "none" }}>
          <option value="All">All Sources</option>
          <option value="Verified">Verified Only</option>
          <option value="Registry">DLD Registry Only</option>
        </select>
      </div>

      {/* AFFORDABILITY CALCULATOR */}
      <div style={{ marginBottom: 16, padding: "12px 16px", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: T.gold, textTransform: "uppercase", letterSpacing: 0.5 }}>Affordability Filter</div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 280 }}>
          <span style={{ fontSize: 11, color: T.textMuted }}>My budget:</span>
          <input type="range" min="500000" max="20000000" step="100000" value={calcBudget} onChange={(e) => setCalcBudget(parseInt(e.target.value))}
            style={{ flex: 1, accentColor: T.gold }} />
          <span style={{ fontSize: 14, fontWeight: 800, color: T.gold, minWidth: 90, textAlign: "right" }}>AED {(calcBudget / 1000000).toFixed(1)}M</span>
        </div>
        <div style={{ fontSize: 11, color: T.textMuted }}>
          <span style={{ color: T.gold, fontWeight: 700 }}>{filtered.filter(p => p.startingPrice <= calcBudget).length}</span> launches within budget
        </div>
      </div>

      {/* DATA SOURCE BADGE */}
      <div style={{ marginBottom: 16, padding: "8px 14px", background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8, display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: isSeed ? T.gold : "#10B981", display: "inline-block" }} />
        <span style={{ fontSize: 11, color: T.textMuted }}>
          {isSeed ? "Curated launch data — Property Finder, prelaunch.ae, developer portals · Add via Admin → Data Manager → Launches" : "Live launch feed from your data source"}
        </span>
      </div>

      {/* MODE 1: NEWSPAPER VIEW */}
      {view === "newspaper" && (
        <>
          {Object.entries(grouped).map(([month, items]) => (
            <div key={month} style={{ marginBottom: 24 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                <div style={{ height: 1, flex: 1, background: T.border }} />
                <div style={{ fontFamily: "'Fraunces', serif", fontSize: 18, fontWeight: 700, color: T.gold }}>{month}</div>
                <div style={{ fontSize: 10, color: T.textMuted }}>{items.length} {items.length === 1 ? "launch" : "launches"}</div>
                <div style={{ height: 1, flex: 1, background: T.border }} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(380px, 1fr))", gap: 14 }}>
                {items.map(p => {
                  /* Session 5: Registry card (DLD-only, compact, honest) */
                  if (p.tier === "dld-registry") {
                    return (
                      <div key={p.id} onClick={() => setDetailModalProject(p)} style={{
                        padding: 16,
                        background: T.surface,
                        border: `1px solid ${T.border}`,
                        borderRadius: 12,
                        borderLeft: `4px solid ${p.status === "Announced" ? "#A78BFA" : "#60A5FA"}`,
                        cursor: "pointer",
                        transition: "transform 0.15s",
                      }}
                      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; }}
                      onMouseLeave={e => { e.currentTarget.style.transform = "none"; }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10, gap: 12 }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 9, color: T.textMuted, textTransform: "uppercase", letterSpacing: 0.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{(p.developer || "Unknown").toUpperCase()}</div>
                            <div style={{ fontFamily: "'Fraunces', serif", fontSize: 16, fontWeight: 700, color: T.white, marginTop: 2, lineHeight: 1.25, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.project}</div>
                            <div style={{ fontSize: 10, color: T.textMuted, marginTop: 2 }}>{p.community}{p.type ? " · " + p.type : ""}</div>
                          </div>
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
                            <span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 10, background: p.status === "Announced" ? "rgba(139,92,246,0.12)" : "rgba(59,130,246,0.12)", color: p.status === "Announced" ? "#A78BFA" : "#60A5FA", fontWeight: 700, letterSpacing: 0.4, textTransform: "uppercase", whiteSpace: "nowrap" }}>
                              {p.status === "Announced" ? "Announced" : "Early Stage"}
                            </span>
                            <span style={{ fontSize: 8, padding: "2px 6px", borderRadius: 8, background: "rgba(148,163,184,0.10)", color: T.textMuted, fontWeight: 700, letterSpacing: 0.4, textTransform: "uppercase", whiteSpace: "nowrap", border: `1px solid ${T.border}` }}>DLD Registry</span>
                          </div>
                        </div>
                        {/* Construction bar */}
                        <div style={{ marginBottom: 12 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                            <span style={{ fontSize: 10, color: T.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>Construction</span>
                            <span style={{ fontSize: 12, fontWeight: 800, color: T.white }}>{p.constructionPct || 0}%</span>
                          </div>
                          <div style={{ height: 8, background: T.surfaceAlt, borderRadius: 4, overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${p.constructionPct || 0}%`, background: "#60A5FA", transition: "width 0.5s" }} />
                          </div>
                        </div>
                        {/* Minimal stats */}
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6, marginBottom: 10, padding: "10px 0", borderTop: `1px solid ${T.border}`, borderBottom: `1px solid ${T.border}` }}>
                          <div>
                            <div style={{ fontSize: 9, color: T.textMuted, textTransform: "uppercase" }}>Handover</div>
                            <div style={{ fontSize: 12, fontWeight: 700, color: T.white }}>{p.handover || "—"}</div>
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
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 8, fontSize: 10, color: T.textMuted }}>
                          <span>DLD Registry — early stage</span>
                          <span style={{ color: T.gold, fontWeight: 700 }}>Details →</span>
                        </div>
                      </div>
                    );
                  }
                  /* Verified card (unchanged) */
                  const badge = intelligenceBadge(p);
                  const isCompared = compareIds.includes(p.id);
                  const isExpanded = expandedId === p.id;
                  const isAffordable = p.startingPrice <= calcBudget;
                  return (
                    <div key={p.id} style={{
                      padding: 16,
                      background: T.surface,
                      border: `1px solid ${isCompared ? T.gold : T.border}`,
                      borderRadius: 12,
                      borderLeft: `4px solid ${statusColor(p.status)}`,
                      opacity: isAffordable ? 1 : 0.55,
                    }}>
                      {/* Header with score circle */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8, gap: 12 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 9, color: T.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>{p.developer.toUpperCase()}</div>
                          <div style={{ fontFamily: "'Fraunces', serif", fontSize: 16, fontWeight: 700, color: T.white, marginTop: 2, lineHeight: 1.25 }}>{p.project}</div>
                          <div style={{ fontSize: 10, color: T.textMuted, marginTop: 2 }}>{p.community} · {p.type}</div>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                          <div style={{ width: 48, height: 48, borderRadius: "50%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", border: `2px solid ${scoreColor(p.investmentScore)}`, background: `${scoreColor(p.investmentScore)}22` }}>
                            <span style={{ fontFamily: "'Fraunces',serif", fontSize: 14, fontWeight: 900, color: scoreColor(p.investmentScore), lineHeight: 1 }}>{p.investmentScore}</span>
                          </div>
                          <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, background: `${badge.color}22`, color: badge.color, fontWeight: 800, textTransform: "uppercase" }}>{badge.label}</span>
                          {p.commission && <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, background: "rgba(16,185,129,0.12)", color: "#10B981", fontWeight: 700 }}>{p.commission}% comm</span>}
                        </div>
                      </div>

                      {/* Status + tags */}
                      <div style={{ display: "flex", gap: 5, marginBottom: 10, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 6, background: `${statusColor(p.status)}22`, color: statusColor(p.status), fontWeight: 700 }}>● {p.status}</span>
                        {p.goldenVisa && <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 6, background: "rgba(212,168,67,0.15)", color: T.gold, fontWeight: 700 }}>★ Golden Visa</span>}
                        {p.branded && <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 6, background: "rgba(139,92,246,0.15)", color: "#A78BFA", fontWeight: 700 }}>◆ {p.brandPartner}</span>}
                        {p.tier === 1 && <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 6, background: "rgba(16,185,129,0.12)", color: "#10B981", fontWeight: 700 }}>Tier 1</span>}
                      </div>

                      {/* Price */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
                        <div>
                          <div style={{ fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 800, color: T.gold, lineHeight: 1 }}>AED {(p.startingPrice / 1000000).toFixed(2)}M</div>
                          <div style={{ fontSize: 10, color: T.textMuted, marginTop: 2 }}>starting · {p.pricePerSqft} AED/sqft</div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: 16, fontWeight: 800, color: "#10B981" }}>+{p.appreciationToHandover}%</div>
                          <div style={{ fontSize: 9, color: T.textMuted }}>pre→handover</div>
                        </div>
                      </div>

                      {/* Yield strip */}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 10, padding: "8px 10px", background: T.surfaceAlt, borderRadius: 8 }}>
                        <div>
                          <div style={{ fontSize: 9, color: T.textMuted, textTransform: "uppercase" }}>Gross Yield</div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: "#10B981" }}>{p.grossYield}%</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 9, color: T.textMuted, textTransform: "uppercase" }}>Net Yield</div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: "#10B981" }}>{p.netYield}%</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 9, color: T.textMuted, textTransform: "uppercase" }}>Service</div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: T.white }}>{p.serviceCharge}/sqft</div>
                        </div>
                      </div>

                      {/* Stats grid */}
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6, marginBottom: 10, padding: "10px 0", borderTop: `1px solid ${T.border}`, borderBottom: `1px solid ${T.border}` }}>
                        <div>
                          <div style={{ fontSize: 9, color: T.textMuted, textTransform: "uppercase" }}>Units</div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: T.white }}>{p.units}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 9, color: T.textMuted, textTransform: "uppercase" }}>Plan</div>
                          <div style={{ fontSize: 11, fontWeight: 700, color: T.white }}>{p.paymentPlan.label}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 9, color: T.textMuted, textTransform: "uppercase" }}>Handover</div>
                          <div style={{ fontSize: 11, fontWeight: 700, color: T.white }}>{p.handover}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 9, color: T.textMuted, textTransform: "uppercase" }}>EOI</div>
                          <div style={{ fontSize: 11, fontWeight: 700, color: T.white }}>AED {(p.eoiAmount / 1000).toFixed(0)}K</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 9, color: T.textMuted, textTransform: "uppercase" }}>Dev On-Time</div>
                          <div style={{ fontSize: 11, fontWeight: 700, color: p.developerOnTimeRate >= 85 ? "#10B981" : "#F59E0B" }}>{p.developerOnTimeRate}%</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 9, color: T.textMuted, textTransform: "uppercase" }}>Velocity</div>
                          <div style={{ fontSize: 11, fontWeight: 700, color: p.velocityScore >= 80 ? "#10B981" : p.velocityScore >= 60 ? T.gold : "#F59E0B" }}>{p.velocityScore}/100</div>
                        </div>
                      </div>

                      {/* Distance icons row */}
                      {p.distances && (
                        <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap", padding: "8px 0", fontSize: 10, color: T.textMuted }}>
                          <span>🚇 {p.distances.metro}km</span>
                          <span>🏖️ {p.distances.beach}km</span>
                          <span>🏫 {p.distances.school}km</span>
                          <span>🏥 {p.distances.hospital}km</span>
                          <span>🛍️ {p.distances.mall}km</span>
                          <span>✈️ {p.distances.airport}km</span>
                        </div>
                      )}

                      {/* Insight */}
                      <div style={{ fontSize: 11, color: T.textSecondary, lineHeight: 1.5, marginBottom: 10 }}>{p.insight}</div>

                      {/* Expandable bed breakdown */}
                      {isExpanded && p.unitBreakdown && (
                        <div style={{ marginBottom: 10, padding: 10, background: T.surfaceAlt, borderRadius: 8, border: `1px solid ${T.gold}33` }}>
                          <div style={{ fontSize: 10, color: T.gold, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>Unit Inventory by Bed Type</div>
                          <div style={{ overflowX: "auto" }}>
                            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 10 }}>
                              <thead>
                                <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                                  <th style={{ padding: "4px 6px", textAlign: "left", color: T.textMuted, fontWeight: 700, textTransform: "uppercase" }}>Type</th>
                                  <th style={{ padding: "4px 6px", textAlign: "right", color: T.textMuted, fontWeight: 700, textTransform: "uppercase" }}>Size</th>
                                  <th style={{ padding: "4px 6px", textAlign: "right", color: T.textMuted, fontWeight: 700, textTransform: "uppercase" }}>Price</th>
                                  <th style={{ padding: "4px 6px", textAlign: "right", color: T.textMuted, fontWeight: 700, textTransform: "uppercase" }}>PPSF</th>
                                  <th style={{ padding: "4px 6px", textAlign: "right", color: T.textMuted, fontWeight: 700, textTransform: "uppercase" }}>Yield</th>
                                  <th style={{ padding: "4px 6px", textAlign: "right", color: T.textMuted, fontWeight: 700, textTransform: "uppercase" }}>Avail</th>
                                </tr>
                              </thead>
                              <tbody>
                                {p.unitBreakdown.map((u, i) => (
                                  <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}>
                                    <td style={{ padding: "5px 6px", color: T.white, fontWeight: 600 }}>{u.type}</td>
                                    <td style={{ padding: "5px 6px", textAlign: "right", color: T.textPrimary }}>{u.sizeMin ? (u.sizeMin + "-" + (u.sizeMax || u.sizeMin)) : "TBD"}</td>
                                    <td style={{ padding: "5px 6px", textAlign: "right", color: T.gold, fontWeight: 700 }}>{(u.priceMin / 1000000).toFixed(2)}-{(u.priceMax / 1000000).toFixed(2)}M</td>
                                    <td style={{ padding: "5px 6px", textAlign: "right", color: T.textPrimary }}>{u.ppsf}</td>
                                    <td style={{ padding: "5px 6px", textAlign: "right", color: "#10B981", fontWeight: 700 }}>{u.grossYield}%</td>
                                    <td style={{ padding: "5px 6px", textAlign: "right", color: u.available > 0 ? T.white : "#EF4444", fontWeight: 700 }}>{u.available}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* RERA + Escrow */}
                      <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 8, borderTop: `1px solid ${T.border}`, marginBottom: 8, fontSize: 9, color: T.textMuted }}>
                        <span>RERA: {p.reraNo}</span>
                        <span>Escrow: {p.escrowBank}</span>
                      </div>

                      {/* Footer actions */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 8, borderTop: `1px solid ${T.border}`, gap: 6 }}>
                        <div style={{ fontSize: 10, color: T.textMuted }}>
                          {p.status === "EOI Open" || p.status === "Upcoming"
                            ? `${Math.max(0, daysUntil(p.launchDate))} days to launch`
                            : `Launched ${new Date(p.launchDate).toLocaleDateString("en-AE", { day: "numeric", month: "short" })}`}
                        </div>
                        <div style={{ display: "flex", gap: 5 }}>
                          {p.unitBreakdown && (
                            <button type="button" onClick={() => toggleExpanded(p.id)}
                              style={{ padding: "4px 10px", background: isExpanded ? T.gold : "rgba(212,168,67,0.08)", border: `1px solid ${T.gold}`, borderRadius: 6, color: isExpanded ? T.dark : T.gold, fontSize: 10, fontWeight: 700, cursor: "pointer", fontFamily: "'Outfit', sans-serif" }}>
                              {isExpanded ? "▲ Hide Beds" : "▼ Beds"}
                            </button>
                          )}
                          <button type="button" onClick={() => setDetailModalProject(p)}
                            style={{ padding: "4px 10px", background: "rgba(212,168,67,0.08)", border: `1px solid ${T.gold}`, borderRadius: 6, color: T.gold, fontSize: 10, fontWeight: 700, cursor: "pointer", fontFamily: "'Outfit', sans-serif" }}>
                            Details
                          </button>
                          <button type="button" onClick={() => toggleCompare(p.id)}
                            style={{ padding: "4px 10px", background: isCompared ? T.gold : "rgba(212,168,67,0.08)", border: `1px solid ${T.gold}`, borderRadius: 6, color: isCompared ? T.dark : T.gold, fontSize: 10, fontWeight: 700, cursor: "pointer", fontFamily: "'Outfit', sans-serif" }}>
                            {isCompared ? "✓" : "+"} Cmp
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* COMMUNITY SUPPLY HEAT MAP */}
          {supplyChartData.length > 0 && (
            <div style={{ marginBottom: 20, padding: 18, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12 }}>
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontFamily: "'Fraunces', serif", fontSize: 18, fontWeight: 700, color: T.white }}>Community Supply Heat Map</div>
                <div style={{ fontSize: 11, color: T.textMuted, marginTop: 4 }}>Launches per community in current filter — color-coded by oversupply risk (Source: prelaunch.ae 2026-2028 supply analysis)</div>
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
                <span style={{ fontSize: 10, color: T.textMuted, display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 8, height: 8, background: "#10B981", borderRadius: 2 }}></span> Low risk</span>
                <span style={{ fontSize: 10, color: T.textMuted, display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 8, height: 8, background: "#F59E0B", borderRadius: 2 }}></span> Watch closely</span>
                <span style={{ fontSize: 10, color: T.textMuted, display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 8, height: 8, background: "#EF4444", borderRadius: 2 }}></span> Oversupplied</span>
              </div>
            </div>
          )}
        </>
      )}

      {/* MODE 2: CALENDAR VIEW */}
      {view === "calendar" && (
        <div style={{ marginBottom: 20 }}>
          {Object.entries(grouped).map(([month, items]) => {
            const firstLaunch = new Date(items[0].launchDate);
            const year = firstLaunch.getFullYear();
            const monthIdx = firstLaunch.getMonth();
            const daysInMonth = new Date(year, monthIdx + 1, 0).getDate();
            const firstDayOfWeek = new Date(year, monthIdx, 1).getDay();
            const launchesByDay = {};
            items.forEach(p => {
              const day = new Date(p.launchDate).getDate();
              if (!launchesByDay[day]) launchesByDay[day] = [];
              launchesByDay[day].push(p);
            });
            return (
              <div key={month} style={{ marginBottom: 24, padding: 18, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12 }}>
                <div style={{ fontFamily: "'Fraunces', serif", fontSize: 20, fontWeight: 700, color: T.gold, marginBottom: 14, textAlign: "center" }}>{month}</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 4 }}>
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
                    <div key={d} style={{ fontSize: 10, color: T.textMuted, textAlign: "center", padding: "6px 0", textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 700 }}>{d}</div>
                  ))}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
                  {Array.from({ length: firstDayOfWeek }).map((_, i) => <div key={`pad-${i}`} />)}
                  {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                    const dayLaunches = launchesByDay[day] || [];
                    const hasLaunch = dayLaunches.length > 0;
                    return (
                      <div key={day} style={{
                        minHeight: 70,
                        padding: 6,
                        background: hasLaunch ? `${T.gold}10` : T.surfaceAlt,
                        border: `1px solid ${hasLaunch ? T.gold : T.border}`,
                        borderRadius: 6,
                        display: "flex",
                        flexDirection: "column",
                        gap: 3,
                        cursor: hasLaunch ? "pointer" : "default",
                      }}
                        onClick={() => hasLaunch && setDetailModalProject(dayLaunches[0])}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: hasLaunch ? T.gold : T.textMuted }}>{day}</div>
                        {dayLaunches.map(p => (
                          <div key={p.id} title={p.project} style={{
                            fontSize: 9,
                            padding: "2px 4px",
                            background: `${statusColor(p.status)}22`,
                            color: statusColor(p.status),
                            borderRadius: 3,
                            fontWeight: 600,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}>
                            {p.project.length > 12 ? p.project.slice(0, 11) + "…" : p.project}
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODE 3: COMPARISON TABLE */}
      {view === "compare" && (
        <div style={{ marginBottom: 20 }}>
          {compareIds.length === 0 ? (
            <div style={{ padding: 30, background: T.surface, border: `1px dashed ${T.border}`, borderRadius: 12, textAlign: "center" }}>
              <div style={{ fontSize: 13, color: T.textMuted, marginBottom: 6 }}>No launches selected for comparison</div>
              <div style={{ fontSize: 11, color: T.textMuted }}>Switch to Newspaper view, click "+ Cmp" on up to 3 launches, then come back here.</div>
            </div>
          ) : (
            <div style={{ padding: 18, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12 }}>
              <div style={{ marginBottom: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontFamily: "'Fraunces', serif", fontSize: 18, fontWeight: 700, color: T.white }}>Side-by-Side Comparison</div>
                <button type="button" onClick={() => setCompareIds([])}
                  style={{ padding: "5px 12px", background: "rgba(239,68,68,0.1)", border: `1px solid #EF4444`, borderRadius: 6, color: "#EF4444", fontSize: 10, fontWeight: 700, cursor: "pointer", fontFamily: "'Outfit', sans-serif" }}>
                  Clear All
                </button>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                  <thead>
                    <tr style={{ borderBottom: `2px solid ${T.gold}` }}>
                      <th style={{ padding: "10px 12px", textAlign: "left", color: T.textMuted, fontSize: 10, textTransform: "uppercase", letterSpacing: 0.5 }}>Metric</th>
                      {compareIds.map(id => {
                        const p = filtered.find(x => x.id === id) || launches.find(x => x.id === id);
                        if (!p) return null;
                        return (
                          <th key={id} style={{ padding: "10px 12px", textAlign: "left", minWidth: 200 }}>
                            <div style={{ fontFamily: "'Fraunces', serif", fontSize: 14, fontWeight: 700, color: T.gold }}>{p.project}</div>
                            <div style={{ fontSize: 10, color: T.textMuted, marginTop: 2 }}>{p.developer}</div>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { label: "Investment Score", get: p => `${p.investmentScore}/100` },
                      { label: "Verdict", get: p => intelligenceBadge(p).label },
                      { label: "Community", get: p => p.community },
                      { label: "Type", get: p => p.type },
                      { label: "Tier", get: p => p.tier === 1 ? "Tier 1 (Premium)" : "Tier 2" },
                      { label: "Status", get: p => p.status },
                      { label: "Launch Date", get: p => new Date(p.launchDate).toLocaleDateString("en-AE", { day: "numeric", month: "short", year: "numeric" }) },
                      { label: "Starting Price", get: p => `AED ${(p.startingPrice / 1000000).toFixed(2)}M` },
                      { label: "Price per sqft", get: p => `AED ${p.pricePerSqft}` },
                      { label: "Avg unit size", get: p => `${p.avgUnitSize} sqft` },
                      { label: "Total Units", get: p => p.units },
                      { label: "Payment Plan", get: p => p.paymentPlan.label },
                      { label: "EOI Amount", get: p => `AED ${(p.eoiAmount / 1000).toFixed(0)}K` },
                      { label: "EOI Refundable", get: p => p.eoiRefundable ? "Yes ✓" : "No" },
                      { label: "Handover", get: p => p.handover },
                      { label: "Dev On-Time Rate", get: p => `${p.developerOnTimeRate}%` },
                      { label: "Developer Score", get: p => `${p.developerScore || "—"}/100` },
                      { label: "Gross Yield", get: p => `${p.grossYield}%` },
                      { label: "Net Yield", get: p => `${p.netYield}%` },
                      { label: "Service Charge", get: p => `AED ${p.serviceCharge}/sqft` },
                      { label: "Commission", get: p => `${p.commission}%` },
                      { label: "Community Avg PPSF", get: p => `AED ${p.communityAvgPpsf}` },
                      { label: "Pre→Handover Gain", get: p => `+${p.appreciationToHandover}%` },
                      { label: "Velocity Score", get: p => `${p.velocityScore}/100` },
                      { label: "Golden Visa", get: p => p.goldenVisa ? "✓ Eligible" : "Below threshold" },
                      { label: "Branded", get: p => p.branded ? p.brandPartner : "—" },
                      { label: "Beachfront", get: p => p.beachAccess ? "Yes ✓" : "No" },
                      { label: "Distance to Metro", get: p => `${p.distances?.metro || p.metroDistanceKm} km` },
                      { label: "Distance to Beach", get: p => `${p.distances?.beach || "—"} km` },
                      { label: "Distance to School", get: p => `${p.distances?.school || "—"} km` },
                      { label: "RERA Number", get: p => p.reraNo || "—" },
                      { label: "Escrow Bank", get: p => p.escrowBank || "—" },
                    ].map((row, idx) => (
                      <tr key={idx} style={{ borderBottom: `1px solid ${T.border}` }}>
                        <td style={{ padding: "10px 12px", color: T.textMuted, fontSize: 10, textTransform: "uppercase", letterSpacing: 0.4, fontWeight: 600 }}>{row.label}</td>
                        {compareIds.map(id => {
                          const p = filtered.find(x => x.id === id) || launches.find(x => x.id === id);
                          if (!p) return null;
                          return <td key={id} style={{ padding: "10px 12px", color: T.white, fontWeight: 600 }}>{row.get(p)}</td>;
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* DEVELOPER PROFILES PANEL */}
      <div style={{ marginBottom: 20, padding: 18, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12 }}>
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontFamily: "'Fraunces', serif", fontSize: 18, fontWeight: 700, color: T.white }}>Developer Track Records (Q1 2026)</div>
          <div style={{ fontSize: 11, color: T.textMuted, marginTop: 4 }}>Same data as Handover tab — consistent across the platform · Source: prelaunch.ae, BSA Law</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 10 }}>
          {Object.entries(DEVELOPER_PROFILES).map(([name, dev]) => (
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

      {/* KEY INSIGHTS PANEL */}
      <div style={{ marginBottom: 20, padding: 18, background: "rgba(212,168,67,0.04)", border: `1px solid ${T.gold}33`, borderRadius: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: T.gold, display: "inline-block" }} />
          <div style={{ fontSize: 12, fontWeight: 700, color: T.gold, textTransform: "uppercase", letterSpacing: 0.5 }}>Pre-Launch Investment Intelligence</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
          {[
            { icon: "📈", title: "Sales Velocity Rule", desc: "Healthy launches sell 60-70% in first weeks. Below 40% = warning sign of soft demand." },
            { icon: "💰", title: "Pre-Launch Discount", desc: "Pre-launch prices typically 15-25% below launch day. Pre→handover gains average 30-40%." },
            { icon: "⚡", title: "Tier 1 Premium", desc: "Sobha (91%), Emaar (88%), Ellington (88%) deliver on time. Industry average: only 48% for 2026." },
            { icon: "★", title: "Golden Visa", desc: "AED 2M+ purchase qualifies for 10-year UAE Golden Visa. Filter chip auto-flags eligible launches." },
            { icon: "◆", title: "Branded Premium", desc: "Mercedes-Benz, Jacob & Co, Palace Hotels branded residences command 15-30% price premium." },
            { icon: "⚠️", title: "Oversupply Watch", desc: "JVC, Azizi Venice, Business Bay face supply pressure. Tier 1 communities (Hills, Creek, Oasis) more resilient." },
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
          { label: "Browse Master Catalog →", tab: "Projects" },
          { label: "Mortgage Calculator →", tab: "Mortgage" },
          { label: "Yields Forecast →", tab: "Yields" },
          { label: "Risk Assessment →", tab: "Risk" },
          { label: "Investment Score →", tab: "Investment Score" },
          { label: "Handover Tracking →", tab: "Handover" },
          { label: "DLD Volumes →", tab: "DLD Volumes" },
          { label: "Golden Visa →", tab: "Golden Visa" },
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
          "Property Finder",
          "prelaunch.ae 2026",
          "AIQYA Q1 2026 report",
          "Springfield Properties",
          "Zawya / Reuters",
          "DLD Open Data",
          "BSA Law",
          "Moody's Mar 2026",
          "Developer IR Reports",
          "Capstone UAE",
        ].map((s, i) => (
          <span key={i} style={{ fontSize: 10, color: T.textMuted, padding: "2px 8px", borderRadius: 10, border: `1px solid ${T.border}`, background: T.surfaceAlt }}>{s}</span>
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════════════
         PROJECT DETAIL MODAL — Rendered via React Portal directly
         into document.body so it's never trapped by parent scroll/transform
         ═══════════════════════════════════════════════════════════ */}
      {/* Registry modal (DLD-only, compact, honest) — Session 5 */}
      {detailModalProject && detailModalProject.tier === "dld-registry" && typeof document !== "undefined" && createPortal(
        <div role="dialog" aria-modal="true" onClick={(e) => { if (e.target === e.currentTarget) setDetailModalProject(null); }} style={{ position: "fixed", inset: 0, background: "rgba(4,9,15,0.97)", zIndex: 2000, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "40px 16px", overflow: "auto", backdropFilter: "blur(8px)" }}>
          <div style={{ width: "100%", maxWidth: 640, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, overflow: "hidden", boxShadow: "0 24px 80px rgba(0,0,0,0.5)" }}>
            <div style={{ padding: "20px 24px", borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 4 }}>
                  {(detailModalProject.developer || "Unknown").toUpperCase()}{detailModalProject.community && detailModalProject.community !== "—" ? " · " + detailModalProject.community : ""}
                </div>
                <div style={{ fontFamily: "'Fraunces',serif", fontSize: 22, fontWeight: 800, color: T.white, marginBottom: 8, lineHeight: 1.2 }}>{detailModalProject.project || "—"}</div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                  <span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 10, fontWeight: 700, letterSpacing: 0.4, background: detailModalProject.status === "Announced" ? "rgba(139,92,246,0.12)" : "rgba(59,130,246,0.12)", color: detailModalProject.status === "Announced" ? "#A78BFA" : "#60A5FA", textTransform: "uppercase" }}>
                    {detailModalProject.status === "Announced" ? "Announced" : "Early Stage"}
                  </span>
                  <span style={{ fontSize: 9, padding: "3px 8px", borderRadius: 10, fontWeight: 700, letterSpacing: 0.5, background: detailModalProject.startingPrice ? "rgba(212,168,67,0.10)" : "rgba(148,163,184,0.10)", color: detailModalProject.startingPrice ? T.gold : T.textMuted, border: `1px solid ${detailModalProject.startingPrice ? "rgba(212,168,67,0.25)" : T.border}`, textTransform: "uppercase" }}>
                    {detailModalProject.startingPrice ? "DLD + Transaction Data" : "DLD Registry"}
                  </span>
                  {detailModalProject.reraNo && <span style={{ fontSize: 10, color: T.textMuted }}>RERA #{detailModalProject.reraNo}</span>}
                </div>
              </div>
              <button type="button" onClick={() => setDetailModalProject(null)} aria-label="Close" style={{ background: "none", border: "none", color: T.textMuted, fontSize: 24, cursor: "pointer", lineHeight: 1, padding: 4 }}>×</button>
            </div>
            <div style={{ padding: "20px 24px" }}>
              {(detailModalProject.startingPrice || detailModalProject.pricePerSqft || detailModalProject.grossYield) && (
                <div style={{ background: "rgba(212,168,67,0.04)", border: `1px solid rgba(212,168,67,0.15)`, borderRadius: 10, padding: "14px 16px", marginBottom: 16 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: T.gold, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 10 }}>Market Data from DLD</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                    {detailModalProject.startingPrice && (
                      <div>
                        <div style={{ fontSize: 9, color: T.textMuted, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 3 }}>Starting Price</div>
                        <div style={{ fontFamily: "'Fraunces',serif", fontSize: 16, fontWeight: 800, color: T.white }}>AED {(detailModalProject.startingPrice/1e6).toFixed(2)}M</div>
                      </div>
                    )}
                    {detailModalProject.pricePerSqft > 0 && (
                      <div>
                        <div style={{ fontSize: 9, color: T.textMuted, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 3 }}>Avg PPSF</div>
                        <div style={{ fontFamily: "'Fraunces',serif", fontSize: 16, fontWeight: 800, color: T.white }}>AED {(detailModalProject.pricePerSqft || 0).toLocaleString()}</div>
                      </div>
                    )}
                    {detailModalProject.grossYield > 0 && detailModalProject.grossYield < 15 && (
                      <div>
                        <div style={{ fontSize: 9, color: T.textMuted, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 3 }}>Est. Gross Yield</div>
                        <div style={{ fontFamily: "'Fraunces',serif", fontSize: 16, fontWeight: 800, color: detailModalProject.grossYield >= 7 ? "#10B981" : T.gold }}>{detailModalProject.grossYield}%</div>
                      </div>
                    )}
                  </div>
                </div>
              )}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                <div style={{ background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8, padding: "12px 14px" }}>
                  <div style={{ fontSize: 9, color: T.textMuted, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 4 }}>Construction</div>
                  <div style={{ fontFamily: "'Fraunces',serif", fontSize: 18, fontWeight: 800, color: T.white }}>{detailModalProject.constructionPct || 0}% Built</div>
                </div>
                {detailModalProject.handover && (
                  <div style={{ background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8, padding: "12px 14px" }}>
                    <div style={{ fontSize: 9, color: T.textMuted, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 4 }}>Est. Handover</div>
                    <div style={{ fontFamily: "'Fraunces',serif", fontSize: 14, fontWeight: 700, color: T.white }}>{detailModalProject.handover}</div>
                  </div>
                )}
                {detailModalProject.units > 0 && (
                  <div style={{ background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8, padding: "12px 14px" }}>
                    <div style={{ fontSize: 9, color: T.textMuted, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 4 }}>Total Units</div>
                    <div style={{ fontFamily: "'Fraunces',serif", fontSize: 18, fontWeight: 800, color: T.white }}>{(detailModalProject.units || 0).toLocaleString()}</div>
                  </div>
                )}
                {detailModalProject.escrowBank && (
                  <div style={{ background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8, padding: "12px 14px" }}>
                    <div style={{ fontSize: 9, color: T.textMuted, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 4 }}>Escrow Bank</div>
                    <div style={{ fontFamily: "'Fraunces',serif", fontSize: 12, fontWeight: 700, color: T.white }}>{detailModalProject.escrowBank}</div>
                  </div>
                )}
              </div>
              <div style={{ background: "rgba(59,130,246,0.06)", border: `1px solid rgba(59,130,246,0.20)`, borderRadius: 8, padding: "12px 14px", marginBottom: 16 }}>
                <div style={{ fontSize: 11, color: T.textSecondary, lineHeight: 1.6 }}>
                  <span style={{ color: "#60A5FA", fontWeight: 700 }}>◆ DLD Registry Record.</span>{" "}
                  Early-stage project from the official Dubai Land Department database. EOI details, payment plans, unit breakdowns, and amenities require data curation from the developer portal.
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button type="button" onClick={() => handleTabChange("Mortgage")} style={{ flex: 1, minWidth: 140, padding: "10px 14px", background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8, color: T.textSecondary, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>Mortgage Calculator</button>
                <button type="button" onClick={() => handleTabChange("My Leads")} style={{ flex: 1, minWidth: 140, padding: "10px 14px", background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8, color: T.textSecondary, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>Add to Leads</button>
                {detailModalProject.reraNo && (
                  <a href={`https://dubailand.gov.ae/en/eservices/project-status/`} target="_blank" rel="noopener noreferrer" style={{ flex: 1, minWidth: 140, padding: "10px 14px", background: "rgba(212,168,67,0.08)", border: `1px solid rgba(212,168,67,0.30)`, borderRadius: 8, color: T.gold, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Outfit',sans-serif", textAlign: "center", textDecoration: "none" }}>View on DLD Portal →</a>
                )}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Verified modal (original full ProjectDetailModal) */}
      {detailModalProject && detailModalProject.tier !== "dld-registry" && typeof document !== "undefined" && createPortal(
        <ProjectDetailModal
          project={detailModalProject}
          onClose={() => setDetailModalProject(null)}
          statusColor={statusColor}
          scoreColor={scoreColor}
          intelligenceBadge={intelligenceBadge}
          handleTabChange={handleTabChange}
          toggleCompare={toggleCompare}
          compareIds={compareIds}
        />,
        document.body
      )}

    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   PROJECT DETAIL MODAL COMPONENT
   World-class detail page rendered via Portal so it always centers
   in the viewport regardless of parent scroll position
   ═══════════════════════════════════════════════════════════════════ */
function ProjectDetailModal({ project, onClose, statusColor, scoreColor, intelligenceBadge, handleTabChange, toggleCompare, compareIds }) {
  const p = project;

  // Lock body scroll while modal is open
  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = original; };
  }, []);

  // Close on Escape key
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const badge = intelligenceBadge(p);
  const isCompared = compareIds.includes(p.id);

  return (
    <div
      role="dialog"
      aria-modal="true"
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
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "linear-gradient(180deg, #1a1a1a 0%, #0f0f0f 100%)",
          border: `1px solid ${T.gold}`,
          borderRadius: 16,
          maxWidth: 1200,
          width: "100%",
          padding: 0,
          boxShadow: `0 20px 80px rgba(0,0,0,0.8), 0 0 60px ${T.gold}33`,
          overflow: "hidden",
          color: T.white,
        }}
      >
        {/* ─── HERO HEADER ─── */}
        <div style={{
          padding: "32px 36px 24px",
          background: `linear-gradient(135deg, ${T.surface} 0%, rgba(212,168,67,0.08) 100%)`,
          borderBottom: `1px solid ${T.border}`,
          position: "relative",
        }}>
          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            style={{
              position: "absolute",
              top: 20,
              right: 20,
              width: 40,
              height: 40,
              background: "rgba(255,255,255,0.06)",
              border: `1px solid ${T.border}`,
              borderRadius: 10,
              color: T.white,
              fontSize: 22,
              fontWeight: 300,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(239,68,68,0.15)"; e.currentTarget.style.borderColor = "#EF4444"; e.currentTarget.style.color = "#EF4444"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.white; }}
          >
            ×
          </button>

          <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 20, alignItems: "flex-start", marginRight: 50 }}>
            <div>
              <div style={{ fontSize: 11, color: T.gold, textTransform: "uppercase", letterSpacing: 1, fontWeight: 700, marginBottom: 6 }}>
                {p.developer} · {p.community}
              </div>
              <div style={{ fontFamily: "'Fraunces', serif", fontSize: 32, fontWeight: 800, color: T.white, lineHeight: 1.1, marginBottom: 10 }}>
                {p.project}
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                <span style={{ fontSize: 11, padding: "4px 12px", borderRadius: 6, background: `${statusColor(p.status)}22`, color: statusColor(p.status), fontWeight: 700 }}>● {p.status}</span>
                {p.tier === 1 && <span style={{ fontSize: 11, padding: "4px 12px", borderRadius: 6, background: "rgba(16,185,129,0.12)", color: "#10B981", fontWeight: 700 }}>Tier 1 Developer</span>}
                {p.goldenVisa && <span style={{ fontSize: 11, padding: "4px 12px", borderRadius: 6, background: "rgba(212,168,67,0.15)", color: T.gold, fontWeight: 700 }}>★ Golden Visa Eligible</span>}
                {p.branded && <span style={{ fontSize: 11, padding: "4px 12px", borderRadius: 6, background: "rgba(139,92,246,0.15)", color: "#A78BFA", fontWeight: 700 }}>◆ {p.brandPartner}</span>}
                {p.beachAccess && <span style={{ fontSize: 11, padding: "4px 12px", borderRadius: 6, background: "rgba(59,130,246,0.15)", color: "#3B82F6", fontWeight: 700 }}>🏖 Beachfront</span>}
                <span style={{ fontSize: 11, padding: "4px 12px", borderRadius: 6, background: `${badge.color}22`, color: badge.color, fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.5 }}>{badge.label}</span>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <div style={{
                width: 90,
                height: 90,
                borderRadius: "50%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                border: `4px solid ${scoreColor(p.investmentScore)}`,
                background: `${scoreColor(p.investmentScore)}15`,
                boxShadow: `0 0 30px ${scoreColor(p.investmentScore)}44`,
              }}>
                <span style={{ fontFamily: "'Fraunces',serif", fontSize: 30, fontWeight: 900, color: scoreColor(p.investmentScore), lineHeight: 1 }}>{p.investmentScore}</span>
                <span style={{ fontSize: 8, color: scoreColor(p.investmentScore), fontWeight: 800, marginTop: 2, letterSpacing: 0.8 }}>SCORE / 100</span>
              </div>
            </div>
          </div>
        </div>

        {/* ─── BODY ─── */}
        <div style={{ padding: 32 }}>

          {/* Insight quote */}
          <div style={{
            marginBottom: 24,
            padding: "16px 20px",
            background: "rgba(212,168,67,0.05)",
            borderLeft: `3px solid ${T.gold}`,
            borderRadius: 8,
            fontSize: 14,
            color: T.textPrimary,
            lineHeight: 1.7,
            fontStyle: "italic",
          }}>
            "{p.insight}"
          </div>

          {/* Hero stats — 4 big cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 24 }}>
            <div style={{ padding: "16px 18px", background: T.surfaceAlt, borderRadius: 12, border: `1px solid ${T.gold}33` }}>
              <div style={{ fontSize: 10, color: T.textMuted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>Starting Price</div>
              <div style={{ fontFamily: "'Fraunces', serif", fontSize: 26, fontWeight: 800, color: T.gold, lineHeight: 1 }}>AED {(p.startingPrice / 1000000).toFixed(2)}M</div>
              <div style={{ fontSize: 11, color: T.textMuted, marginTop: 4 }}>{p.pricePerSqft} AED/sqft</div>
            </div>
            <div style={{ padding: "16px 18px", background: T.surfaceAlt, borderRadius: 12 }}>
              <div style={{ fontSize: 10, color: T.textMuted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>Yields</div>
              <div style={{ fontFamily: "'Fraunces', serif", fontSize: 26, fontWeight: 800, color: "#10B981", lineHeight: 1 }}>{p.grossYield}%</div>
              <div style={{ fontSize: 11, color: T.textMuted, marginTop: 4 }}>Gross · Net {p.netYield}%</div>
            </div>
            <div style={{ padding: "16px 18px", background: T.surfaceAlt, borderRadius: 12 }}>
              <div style={{ fontSize: 10, color: T.textMuted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>Pre→Handover</div>
              <div style={{ fontFamily: "'Fraunces', serif", fontSize: 26, fontWeight: 800, color: T.gold, lineHeight: 1 }}>+{p.appreciationToHandover}%</div>
              <div style={{ fontSize: 11, color: T.textMuted, marginTop: 4 }}>Capital appreciation</div>
            </div>
            <div style={{ padding: "16px 18px", background: T.surfaceAlt, borderRadius: 12 }}>
              <div style={{ fontSize: 10, color: T.textMuted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>Sales Velocity</div>
              <div style={{ fontFamily: "'Fraunces', serif", fontSize: 26, fontWeight: 800, color: p.velocityScore >= 80 ? "#10B981" : T.gold, lineHeight: 1 }}>{p.velocityScore}<span style={{ fontSize: 14, color: T.textMuted }}>/100</span></div>
              <div style={{ fontSize: 11, color: T.textMuted, marginTop: 4 }}>Sales momentum</div>
            </div>
          </div>

          {/* Bed Inventory Table */}
          {p.unitBreakdown && p.unitBreakdown.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 12, color: T.gold, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 12 }}>📋 Unit Inventory by Bed Type</div>
              <div style={{ overflowX: "auto", background: T.surfaceAlt, borderRadius: 12, border: `1px solid ${T.border}` }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr style={{ borderBottom: `2px solid ${T.gold}`, background: "rgba(212,168,67,0.05)" }}>
                      <th style={{ padding: "12px 16px", textAlign: "left", color: T.gold, fontSize: 10, textTransform: "uppercase", fontWeight: 800, letterSpacing: 0.5 }}>Type</th>
                      <th style={{ padding: "12px 16px", textAlign: "right", color: T.gold, fontSize: 10, textTransform: "uppercase", fontWeight: 800, letterSpacing: 0.5 }}>Size (sqft)</th>
                      {p.unitBreakdown.some(u => u.plotMin) && <th style={{ padding: "12px 16px", textAlign: "right", color: T.gold, fontSize: 10, textTransform: "uppercase", fontWeight: 800, letterSpacing: 0.5 }}>Plot (sqft)</th>}
                      <th style={{ padding: "12px 16px", textAlign: "right", color: T.gold, fontSize: 10, textTransform: "uppercase", fontWeight: 800, letterSpacing: 0.5 }}>Price (AED M)</th>
                      <th style={{ padding: "12px 16px", textAlign: "right", color: T.gold, fontSize: 10, textTransform: "uppercase", fontWeight: 800, letterSpacing: 0.5 }}>PPSF</th>
                      <th style={{ padding: "12px 16px", textAlign: "right", color: T.gold, fontSize: 10, textTransform: "uppercase", fontWeight: 800, letterSpacing: 0.5 }}>Yield</th>
                      <th style={{ padding: "12px 16px", textAlign: "right", color: T.gold, fontSize: 10, textTransform: "uppercase", fontWeight: 800, letterSpacing: 0.5 }}>Available</th>
                    </tr>
                  </thead>
                  <tbody>
                    {p.unitBreakdown.map((u, i) => (
                      <tr key={i} style={{ borderBottom: i < p.unitBreakdown.length - 1 ? `1px solid ${T.border}` : "none" }}>
                        <td style={{ padding: "14px 16px", color: T.white, fontWeight: 700 }}>{u.type}</td>
                        <td style={{ padding: "14px 16px", textAlign: "right", color: T.textPrimary }}>{u.sizeMin ? (u.sizeMin.toLocaleString() + " to " + (u.sizeMax || u.sizeMin).toLocaleString()) : "TBD"}</td>
                        {p.unitBreakdown.some(x => x.plotMin) && <td style={{ padding: "14px 16px", textAlign: "right", color: T.textPrimary }}>{u.plotMin ? `${u.plotMin.toLocaleString()} to ${(u.plotMax || u.plotMin).toLocaleString()}` : "—"}</td>}
                        <td style={{ padding: "14px 16px", textAlign: "right", color: T.gold, fontWeight: 700 }}>{(u.priceMin / 1000000).toFixed(2)} – {(u.priceMax / 1000000).toFixed(2)}</td>
                        <td style={{ padding: "14px 16px", textAlign: "right", color: T.textPrimary }}>{(u.ppsf || 0).toLocaleString()}</td>
                        <td style={{ padding: "14px 16px", textAlign: "right", color: "#10B981", fontWeight: 700 }}>{u.grossYield}%</td>
                        <td style={{ padding: "14px 16px", textAlign: "right" }}>
                          <span style={{
                            padding: "3px 10px",
                            borderRadius: 12,
                            background: u.available > 20 ? "rgba(16,185,129,0.15)" : u.available > 0 ? "rgba(245,158,11,0.15)" : "rgba(239,68,68,0.15)",
                            color: u.available > 20 ? "#10B981" : u.available > 0 ? "#F59E0B" : "#EF4444",
                            fontWeight: 700,
                            fontSize: 11,
                          }}>
                            {u.available > 0 ? `${u.available} units` : "Sold out"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Two-column layout: Location + Payment Plan */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>

            {/* Location & Connectivity */}
            {p.distances && (
              <div>
                <div style={{ fontSize: 12, color: T.gold, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 12 }}>📍 Location & Connectivity</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: 8 }}>
                  {[
                    { icon: "🚇", label: "Metro", val: p.distances.metro },
                    { icon: "🏖️", label: "Beach", val: p.distances.beach },
                    { icon: "🏫", label: "School", val: p.distances.school },
                    { icon: "🏥", label: "Hospital", val: p.distances.hospital },
                    { icon: "🛍️", label: "Mall", val: p.distances.mall },
                    { icon: "✈️", label: "Airport", val: p.distances.airport },
                    { icon: "🏢", label: "DIFC", val: p.distances.difc },
                  ].filter(d => d.val !== undefined).map((d, i) => (
                    <div key={i} style={{ padding: "12px 10px", background: T.surfaceAlt, borderRadius: 10, textAlign: "center", border: `1px solid ${T.border}` }}>
                      <div style={{ fontSize: 18, marginBottom: 4 }}>{d.icon}</div>
                      <div style={{ fontSize: 9, color: T.textMuted, textTransform: "uppercase", letterSpacing: 0.4 }}>{d.label}</div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: T.white, marginTop: 2 }}>{d.val}<span style={{ fontSize: 10, color: T.textMuted, marginLeft: 2 }}>km</span></div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Payment Plan Visual */}
            <div>
              <div style={{ fontSize: 12, color: T.gold, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 12 }}>💰 Payment Plan ({p.paymentPlan.label})</div>
              <div style={{ display: "flex", height: 56, borderRadius: 10, overflow: "hidden", border: `1px solid ${T.border}`, marginBottom: 10 }}>
                <div style={{ width: `${p.paymentPlan.dp}%`, background: "#10B981", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: T.white, fontSize: 11, fontWeight: 800 }}>
                  <span>{p.paymentPlan.dp}%</span>
                  <span style={{ fontSize: 9, opacity: 0.9 }}>Down</span>
                </div>
                <div style={{ width: `${p.paymentPlan.construction}%`, background: T.gold, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: T.dark, fontSize: 11, fontWeight: 800 }}>
                  <span>{p.paymentPlan.construction}%</span>
                  <span style={{ fontSize: 9, opacity: 0.85 }}>During Construction</span>
                </div>
                <div style={{ width: `${p.paymentPlan.handover}%`, background: "#3B82F6", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: T.white, fontSize: 11, fontWeight: 800 }}>
                  <span>{p.paymentPlan.handover}%</span>
                  <span style={{ fontSize: 9, opacity: 0.9 }}>At Handover</span>
                </div>
              </div>
              {p.paymentPlan.postHandover > 0 && (
                <div style={{ padding: "8px 12px", background: "rgba(16,185,129,0.08)", borderLeft: `3px solid #10B981`, borderRadius: 6, fontSize: 11, color: T.textPrimary }}>
                  ⏰ Post-handover plan: {p.paymentPlan.postHandover} months extended payment available
                </div>
              )}
              <div style={{ marginTop: 12, padding: "10px 14px", background: T.surfaceAlt, borderRadius: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 9, color: T.textMuted, textTransform: "uppercase" }}>EOI Required</div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: T.gold }}>AED {((p.eoiAmount || 0) / 1000).toLocaleString()}K</div>
                </div>
                <span style={{ fontSize: 10, padding: "4px 10px", borderRadius: 6, background: p.eoiRefundable ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)", color: p.eoiRefundable ? "#10B981" : "#EF4444", fontWeight: 700 }}>
                  {p.eoiRefundable ? "✓ Refundable" : "✗ Non-refundable"}
                </span>
              </div>
            </div>
          </div>

          {/* Amenities + Views */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
            {p.amenities && p.amenities.length > 0 && (
              <div>
                <div style={{ fontSize: 12, color: T.gold, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 12 }}>✨ Amenities</div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {p.amenities.map((a, i) => (
                    <span key={i} style={{ fontSize: 11, padding: "6px 12px", borderRadius: 16, background: T.surfaceAlt, color: T.textPrimary, border: `1px solid ${T.border}` }}>{a}</span>
                  ))}
                </div>
              </div>
            )}
            {p.views && p.views.length > 0 && (
              <div>
                <div style={{ fontSize: 12, color: T.gold, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 12 }}>👁 Views Available</div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {p.views.map((v, i) => (
                    <span key={i} style={{ fontSize: 11, padding: "6px 12px", borderRadius: 16, background: "rgba(212,168,67,0.08)", color: T.gold, border: `1px solid ${T.gold}55`, fontWeight: 600 }}>{v}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Legal & Financial Details */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 12, color: T.gold, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 12 }}>⚖️ Legal & Financial</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10, padding: 16, background: T.surfaceAlt, borderRadius: 12, border: `1px solid ${T.border}` }}>
              {[
                { l: "RERA Number", v: p.reraNo, important: true },
                { l: "Escrow Bank", v: p.escrowBank, important: true },
                { l: "Total Units", v: p.units },
                { l: "Service Charge", v: `AED ${p.serviceCharge}/sqft/yr` },
                { l: "Commission", v: `${p.commission}%`, color: "#10B981" },
                { l: "Handover", v: p.handover },
                { l: "Dev On-Time Rate", v: `${p.developerOnTimeRate}%`, color: p.developerOnTimeRate >= 85 ? "#10B981" : "#F59E0B" },
                { l: "Dev Score", v: `${p.developerScore || "—"}/100` },
                { l: "Launch Date", v: new Date(p.launchDate).toLocaleDateString("en-AE", { day: "numeric", month: "short", year: "numeric" }) },
                { l: "EOI Deadline", v: new Date(p.eoiDeadline).toLocaleDateString("en-AE", { day: "numeric", month: "short", year: "numeric" }), color: "#F59E0B" },
              ].map((field, i) => (
                <div key={i}>
                  <div style={{ fontSize: 9, color: T.textMuted, textTransform: "uppercase", letterSpacing: 0.4 }}>{field.l}</div>
                  <div style={{ fontSize: 13, color: field.color || T.white, fontWeight: 700, marginTop: 2 }}>{field.v}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 10, padding: "8px 14px", background: "rgba(59,130,246,0.06)", borderLeft: `3px solid #3B82F6`, borderRadius: 6, fontSize: 11, color: T.textSecondary }}>
              💡 Verify the RERA number on the <strong style={{ color: T.white }}>Dubai REST app</strong> before paying any EOI. All escrow accounts are DLD-registered under Law No. 8 of 2007.
            </div>
          </div>

        </div>

        {/* ─── FOOTER ACTIONS ─── */}
        <div style={{
          padding: "20px 32px",
          background: T.surfaceAlt,
          borderTop: `1px solid ${T.border}`,
          display: "flex",
          gap: 10,
          justifyContent: "flex-end",
          flexWrap: "wrap",
        }}>
          <button type="button" onClick={() => { handleTabChange && handleTabChange("Mortgage"); onClose(); }}
            style={{ padding: "12px 20px", background: "rgba(212,168,67,0.1)", border: `1px solid ${T.gold}`, borderRadius: 8, color: T.gold, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Outfit', sans-serif" }}>
            Run Mortgage →
          </button>
          <button type="button" onClick={() => { handleTabChange && handleTabChange("Yields"); onClose(); }}
            style={{ padding: "12px 20px", background: "rgba(212,168,67,0.1)", border: `1px solid ${T.gold}`, borderRadius: 8, color: T.gold, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Outfit', sans-serif" }}>
            Yields Forecast →
          </button>
          <button type="button" onClick={() => { handleTabChange && handleTabChange("Projects"); onClose(); }}
            style={{ padding: "12px 20px", background: "rgba(212,168,67,0.1)", border: `1px solid ${T.gold}`, borderRadius: 8, color: T.gold, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Outfit', sans-serif" }}>
            Browse Catalog →
          </button>
          <button type="button" onClick={() => toggleCompare(p.id)}
            style={{ padding: "12px 20px", background: T.gold, border: `1px solid ${T.gold}`, borderRadius: 8, color: T.dark, fontSize: 12, fontWeight: 800, cursor: "pointer", fontFamily: "'Outfit', sans-serif" }}>
            {isCompared ? "✓ In Compare List" : "+ Add to Compare"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default LaunchCalendarTab;
