/* eslint-disable */
/* PROJECTS TAB â€” Master catalog of all Dubai property projects
   Includes detail modal (rendered via React Portal for safety)
*/

import React, { useState, useMemo, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { createPortal } from "react-dom";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { T } from "../data";
import SmartEmptyState from "../components/SmartEmptyState";
import SearchableSelect from "../components/SearchableSelect";
import { SvgIcons } from "../components/Icons";

import { calcScore, scoreColor, scoreLabel } from "../utils/scoring";
import { GOLDEN_VISA_THRESHOLD } from "../utils/constants";

const MODES = [
  { key:"All", label:"All Types" },
  { key:"Apartment" }, { key:"Villa" }, { key:"Townhouse" },
  { key:"Hotel Apartment" }, { key:"Office" }, { key:"Retail" },
  { key:"Warehouse" }, { key:"Land" },
];

/* Helper â€” detect fake/placeholder RERA numbers and suppress display.
   Real RERA project numbers are typically 3-6 digits.
   Fake patterns: 10+ digit placeholders, repeating digits, sequential like 1234/5678 */
function isValidReraNumber(num) {
  if (!num) return false;
  const s = String(num).trim();
  if (s.length > 6) return false;
  if (/^(\d)\1+$/.test(s)) return false;
  if (/^(1234|5678|0000|9999)/.test(s)) return false;
  return /^\d{3,6}$/.test(s);
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   DXB ANALYTICS â€” DATA PLATFORM LAYER
   â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   Legal positioning: This is a DATA AGGREGATION platform, not advice.
   All data displayed is sourced from Dubai Land Department (DLD) records.
   No investment recommendations. No BUY/SELL verdicts.
   For advice, users must consult RERA-licensed consultants.
   â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

/* Asset class â€” descriptive segmentation (like MLS tiers), not a score */
function describeAssetClass(p) {
  const ppsf = p.ppsf || 0;
  if (ppsf >= 3000) return { tier:"Ultra-Luxury Segment", color:"#D4A843" };
  if (ppsf >= 2000) return { tier:"Luxury Segment", color:"#F59E0B" };
  if (ppsf >= 1400) return { tier:"Premium Segment", color:"#14B8A6" };
  if (ppsf >= 900) return { tier:"Mid-Market Segment", color:"#10B981" };
  if (ppsf > 0) return { tier:"Affordable Segment", color:"#6B7280" };
  return { tier:"Segment Not Disclosed", color:"#6B7280" };
}

/* Construction stage â€” descriptive only, from DLD data */
function describeMarketStatus(p) {
  const pct = p.constructionPct || 0;
  if (p.status === "Sold Out") return { label:"Sold Out (per DLD)", color:"#EF4444" };
  if (p.lifecycleStage === "launching" || p.lifecycleStage === "announced") return { label:"Recently Launched", color:"#10B981" };
  if (pct >= 100 || p.status === "Ready") return { label:"Delivered", color:"#14B8A6" };
  if (pct >= 70) return { label:"Near Completion", color:"#F59E0B" };
  if (pct > 0) return { label:"Under Construction", color:"#8B5CF6" };
  return { label:"Off-Plan", color:"#6B7280" };
}

/* Location advantages â€” factual tags based on measurable distances */
function locationTags(p) {
  const out = [];
  if (p.distBeach != null && p.distBeach <= 1) out.push({ label:"Waterfront (<1km)", color:"#14B8A6" });
  if (p.distMetro != null && p.distMetro <= 0.8) out.push({ label:"Metro Walking Distance", color:"#10B981" });
  if (p.distDIFC != null && p.distDIFC <= 5) out.push({ label:"DIFC Proximity (<5km)", color:"#F59E0B" });
  if (p.distMall != null && p.distMall <= 1.5) out.push({ label:"Retail Access (<1.5km)", color:"#8B5CF6" });
  return out;
}

/* Unit mix percentages â€” derived from actual unit breakdown data */
function computeUnitMix(p) {
  const ub = p.unitBreakdown || [];
  if (ub.length === 0) return null;
  const total = ub.reduce((s,u) => s + (u.count || 1), 0);
  return ub.map(u => ({
    type: u.type,
    pct: Math.round((u.count || 1) / total * 100),
    count: u.count || 1,
  }));
}

/* Community average PPSF â€” prefers DLD-computed median over legacy field */
function communityBenchmarkPPSF(p) {
  if (p.communityMedianPPSF) {
    return {
      value: p.communityMedianPPSF,
      p25: p.communityP25PPSF,
      p75: p.communityP75PPSF,
      source: `DLD Â· ${p.communityTxCount?.toLocaleString() || "N"} transactions Â· ${p.communityBenchmarkSource || "Recent"}`,
    };
  }
  if (p.communityAvgPPSF) return { value: p.communityAvgPPSF, source:"Legacy estimate" };
  return { value: null, source:"Not available â€” DLD benchmark pending" };
}

/* STR indicator â€” factual flag only (not a score) */
function strIndicator(p) {
  const t = (p.type || "").toLowerCase();
  if (t.includes("hotel")) return { flag:"Hotel Apartment", note:"Designated for short-term rental per developer licensing" };
  if (p.distBeach != null && p.distBeach <= 2) return { flag:"Tourist Zone", note:"Beach-adjacent micro-location" };
  if (/marina|downtown|creek|palm|blue ?waters/i.test(p.community || "")) return { flag:"Tourist District", note:"Historically high STR demand" };
  return { flag:"Residential Primary", note:"Area zoned primarily for long-term residence" };
}

/* Escrow status â€” factual DLD data */
function escrowStatus(p) {
  if (p.escrowAccount && p.escrowBank) return { verified:true, label:"DLD-Registered Escrow Active" };
  if (p.escrowBank) return { verified:true, label:"Escrow Bank Verified" };
  return { verified:false, label:"Escrow Details Pending" };
}

/* RERA compliance indicator */
function reraCompliance(p) {
  if (p.reraNo || p.reraProjectNumber || p.projectNumber) {
    return { verified:true, number: p.reraNo || p.reraProjectNumber || p.projectNumber };
  }
  return { verified:false };
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   LEGAL DISCLAIMER â€” reusable component
   â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function LegalNote({ T, compact }) {
  return (
    <div style={{ padding:compact ? "8px 12px" : "12px 16px", background:"rgba(107,114,128,0.08)", borderRadius:8, border:`1px solid ${T.border}`, marginTop:12 }}>
      <div style={{ fontSize:10, color:T.textMuted, lineHeight:1.6 }}>
        <strong style={{ color:T.textSecondary }}>Data Source:</strong> Dubai Land Department (DLD) public records and project filings. Information is provided for reference only and is not investment advice. For regulated advice, consult a RERA-licensed real estate consultant. DXB Analytics is a data aggregation platform and does not provide investment recommendations.
      </div>
    </div>
  );
}

function ProjectsTab({
  SEED_PROJECTS, liveProjects, extraProjects = [], developments = [],
  projSearch, setProjSearch,
  projDev, setProjDev,
  projCommunity, setProjCommunity,
  projStatus, setProjStatus,
  projBeds, setProjBeds,
  projHandover, setProjHandover,
  projSort, setProjSort,
  projGrade, setProjGrade,
  projMode, setProjMode,
  projView, setProjView,
  projPriceMin, projPriceMax,
  projCompare, setProjCompare,
  projIntelFilter, setProjIntelFilter,
  selectedProject, setSelectedProject,
  projDetailTab, setProjDetailTab,
  showCompare, setShowCompare,
  globalFilters = {},
  allDevelopers = [],
  handleTabChange,
}) {

  /* NEW FILTERS (v7) â€” match data reality from audit:
     - lifecycleStage (100% coverage): Historical / Under Construction / Announced / Recently Delivered
     - escrowBank (94% coverage): 27 banks, strong trust signal
     - constructionBand (100% coverage): 0-25% / 25-50% / 50-75% / 75-100% / Completed
     These are self-contained because they don't need to persist across tabs. */
  const [projLifecycle, setProjLifecycle] = useState("All");
  const [projEscrowBank, setProjEscrowBank] = useState("All");
  const [projConstruction, setProjConstruction] = useState("All");
  /* Separate state for filter panel so it doesn't clobber grid/list view mode */
  const [filtersOpen, setFiltersOpen] = useState(false);

  /* Phase 2.4 Batch 3: stack the top-bar global filter on top of the
     existing internal filter system. Both must match for a project to appear.

     Note: the type filter is NOT applied here, because Projects tab already
     has its own type pills (Apartment/Villa/etc). Users explicitly asked for
     the internal type pills to stay, so we skip the global type filter to
     avoid double-filtering. Instead, when the top bar picks a type, we mirror
     it into projMode (handled at the top bar level). */

  const gfDev = globalFilters?.developer && globalFilters.developer !== "all"
    ? String(globalFilters.developer).toLowerCase() : null;
  const gfCommunity = globalFilters?.community && globalFilters.community !== "all"
    ? String(globalFilters.community).toLowerCase() : null;
  const gfStatus = globalFilters?.status && globalFilters.status !== "all"
    ? String(globalFilters.status).toLowerCase() : null;
  const gfBeds = globalFilters?.beds && globalFilters.beds !== "all"
    ? String(globalFilters.beds).toLowerCase() : null;
  const gfPriceMin = Number(globalFilters?.priceMin) || 0;
  const gfPriceMax = Number(globalFilters?.priceMax) || 0;

  // Find developer by id/name to resolve its child entity names and communities
  const gfDeveloperRecord = gfDev
    ? (allDevelopers || []).find(d =>
        String(d.id || "").toLowerCase() === gfDev ||
        String(d.name || "").toLowerCase() === gfDev ||
        String(d.name || "").toLowerCase().includes(gfDev)
      )
    : null;
  const gfDeveloperName = gfDeveloperRecord?.name || null;
  /* Child entity names (for parent-brand grouping): when user picks
     "DAMAC Properties", match projects whose developer is any DAMAC SPV */
  const gfDeveloperChildNames = (gfDeveloperRecord && Array.isArray(gfDeveloperRecord._childNames))
    ? new Set(gfDeveloperRecord._childNames.map(n => String(n).toLowerCase()))
    : null;
  const gfDeveloperCommunities = (gfDeveloperRecord && Array.isArray(gfDeveloperRecord.communities))
    ? new Set(gfDeveloperRecord.communities.map(c => String(c).toLowerCase()))
    : null;

  /** Returns true if project passes the global filter (or if no global
      filter is active) */
  const projMatchesGlobalFilter = (p) => {
    if (!p) return false;

    // Developer filter: match if project's developer/developerName matches
    // the selected brand OR any of its child entity names (SPVs).
    if (gfDev) {
      const pDev = String(p.developer || "").toLowerCase();
      const pDevName = String(p.developerName || "").toLowerCase();
      const pCommunity = String(p.community || "").toLowerCase();
      const gfDevName = gfDeveloperName ? String(gfDeveloperName).toLowerCase() : "";

      /* Match against parent brand name or any child entity name */
      const matchesChildEntity = gfDeveloperChildNames &&
        (gfDeveloperChildNames.has(pDev) || gfDeveloperChildNames.has(pDevName));

      const developerMatches = matchesChildEntity ||
        (pDev && (pDev === gfDev || pDev === gfDevName || pDev.includes(gfDev))) ||
        (pDevName && (pDevName === gfDev || pDevName === gfDevName || pDevName.includes(gfDev)));

      const communityBelongsToDeveloper = gfDeveloperCommunities && gfDeveloperCommunities.has(pCommunity);
      if (!developerMatches && !communityBelongsToDeveloper) return false;
    }

    // Community filter
    if (gfCommunity) {
      if (String(p.community || "").toLowerCase() !== gfCommunity) return false;
    }

    // Status filter (e.g. "offplan", "ready") â€” fallback to lifecycleStage for DLD
    if (gfStatus) {
      const effectiveStatus = p.status || (
        p.lifecycleStage === "recently-delivered" || p.constructionPct >= 100 ? "Ready" :
        p.lifecycleStage === "historical" ? "Ready" :
        p.lifecycleStage === "under-construction" ? "Off-Plan" :
        p.lifecycleStage === "announced" ? "Off-Plan" :
        null
      );
      if (!effectiveStatus) return false;
      const ps = String(effectiveStatus).toLowerCase().replace(/[-\s]/g, "_");
      const gs = gfStatus.replace(/[-\s]/g, "_");
      if (ps !== gs) return false;
    }

    // Beds filter (e.g. "1 BR", "2 BR")
    if (gfBeds) {
      const beds = Array.isArray(p.beds) ? p.beds : (p.beds ? [p.beds] : []);
      if (!beds.some(b => {
        const normBed = String(b).toLowerCase().replace(/\s+/g, "");
        const normGf = gfBeds.replace(/\s+/g, "");
        return normBed === normGf;
      })) return false;
    }

    // Price range â€” only apply when project HAS priceMin (DLD records don't).
    // Records without price pass through unfiltered so user can still browse them.
    if (gfPriceMin > 0 && p.priceMin && Number(p.priceMin) < gfPriceMin) return false;
    if (gfPriceMax > 0 && p.priceMax && Number(p.priceMax) > gfPriceMax) return false;

    return true;
  };

  /* Lock body scroll when modal open */
  useEffect(() => {
    if (selectedProject) {
      const original = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = original; };
    }
  }, [selectedProject]);

  /* Escape closes modal */
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape" && selectedProject) setSelectedProject(null); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selectedProject, setSelectedProject]);

  /* Phase 3.16: deep-link reader. When user arrives via /project/<id>,
     App.jsx ProjectRedirect passes location.state.openProjectId.
     Match against liveProjects + SEED_PROJECTS + extraProjects, auto-open. */
  const _location = useLocation();
  useEffect(() => {
    try {
      const wantedId = _location && _location.state && _location.state.openProjectId;
      if (!wantedId) return;
      if (selectedProject) return;
      const all = [
        ...((Array.isArray(liveProjects) ? liveProjects : [])),
        ...((Array.isArray(SEED_PROJECTS) ? SEED_PROJECTS : [])),
        ...((Array.isArray(extraProjects) ? extraProjects : [])),
      ];
      if (all.length === 0) return;
      const match = all.find(p => p && String(p.id || "") === String(wantedId));
      if (match) {
        setSelectedProject(match);
        try { window.history.replaceState({}, "", window.location.pathname); } catch {}
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [_location, liveProjects, SEED_PROJECTS, extraProjects]);

  return (
    <>
      {(() => {

            /* Phase 4: merge all data sources â€” SEED (18 Verified) + DLD developments (2,798 Registry) + extras.
               Guard every spread with Array.isArray to prevent 'not iterable' crashes when props
               arrive as undefined/null (Firestore still loading). */
            const allSources = [
              ...(Array.isArray(SEED_PROJECTS) ? SEED_PROJECTS : []),
              ...(Array.isArray(developments) ? developments : []),
              ...(Array.isArray(liveProjects) ? liveProjects : []),
              ...(Array.isArray(extraProjects) ? extraProjects : []),
            ];
            /* De-dupe by id â€” live version wins over seed if same id */
            const seenIds = new Set();
            const rawProjects = allSources.filter(p => {
              if (!p) return false;
              if (!p.id) return true;
              if (seenIds.has(p.id)) return false;
              seenIds.add(p.id);
              return true;
            });

            /* Normalize type field across data sources.
               DLD records often have dldClass="unit" or propertyType="Flat"
               Seed records have type="Apartment"/"Villa" etc.
               Map everything to the 8 canonical types. */
            const normalizeType = (p) => {
              if (!p) return "Apartment";
              const t = String(p.type || p.propertyType || p.dldClass || "").toLowerCase();
              if (t.includes("villa")) return "Villa";
              if (t.includes("townhouse") || t.includes("town house")) return "Townhouse";
              if (t.includes("hotel")) return "Hotel Apartment";
              if (t.includes("office")) return "Office";
              if (t.includes("retail") || t.includes("shop")) return "Retail";
              if (t.includes("warehouse") || t.includes("industrial")) return "Warehouse";
              if (t.includes("land") || t.includes("plot")) return "Land";
              return "Apartment"; /* default â€” most DLD records are unit/flat = apartment */
            };

            const filtered = rawProjects.filter(p => {
              // Global top-bar filters first
              if (!projMatchesGlobalFilter(p)) return false;
              // Type filter â€” but skip when 'All' is selected
              if (projMode !== "All" && normalizeType(p) !== projMode) return false;
              if (projSearch && !JSON.stringify(p).toLowerCase().includes(projSearch.toLowerCase())) return false;
              if (projDev !== "All" && p.developer !== projDev && p.developerName !== projDev) return false;
              if (projCommunity !== "All" && p.community !== projCommunity) return false;
              /* SALE STATUS â€” fallback to lifecycleStage mapping for DLD records without status */
              if (projStatus !== "All") {
                const effectiveStatus = p.status || (
                  p.lifecycleStage === "recently-delivered" || p.constructionPct >= 100 ? "Ready" :
                  p.lifecycleStage === "historical" ? "Ready" :
                  p.lifecycleStage === "under-construction" ? "Off-Plan" :
                  p.lifecycleStage === "announced" ? "Off-Plan" :
                  null
                );
                if (effectiveStatus !== projStatus) return false;
              }
              /* NEW: Lifecycle Stage (100% DLD coverage) */
              if (projLifecycle !== "All" && p.lifecycleStage !== projLifecycle) return false;
              /* NEW: Escrow Bank (94% DLD coverage) */
              if (projEscrowBank !== "All" && p.escrowBank !== projEscrowBank) return false;
              /* NEW: Construction Progress (100% DLD coverage) */
              if (projConstruction !== "All") {
                const pct = p.constructionPct;
                if (pct == null) return false;
                if (projConstruction === "0-25" && (pct < 0 || pct >= 25)) return false;
                if (projConstruction === "25-50" && (pct < 25 || pct >= 50)) return false;
                if (projConstruction === "50-75" && (pct < 50 || pct >= 75)) return false;
                if (projConstruction === "75-99" && (pct < 75 || pct >= 100)) return false;
                if (projConstruction === "100" && pct < 100) return false;
              }
              if (projBeds !== "All" && Array.isArray(p.beds) && p.beds.length > 0 && !p.beds.includes(projBeds)) return false;
              if (projHandover !== "All" && !String(p.handover || p.expectedHandover || "").includes(projHandover)) return false;
              if (projGrade !== "All" && p.officeGrade !== projGrade) return false;
              if (projIntelFilter === "tier1" && p.tier !== 1) return false;
              if (projIntelFilter === "gv" && !(p.goldenVisa && p.priceMin >= GOLDEN_VISA_THRESHOLD)) return false;
              if (projIntelFilter === "branded" && !p.branded) return false;
              if (projPriceMin > 0 && p.priceMin && p.priceMin < projPriceMin) return false;
              if (projPriceMax > 0 && p.priceMax && p.priceMax > projPriceMax) return false;
              return true;
            }).sort((a,b) => {
              if (projSort === "yield") return (b.grossYield||0) - (a.grossYield||0);
              if (projSort === "score") return calcScore(b) - calcScore(a);
              if (projSort === "price_asc") return (a.priceMin || Infinity) - (b.priceMin || Infinity);
              if (projSort === "price_desc") return (b.priceMin || 0) - (a.priceMin || 0);
              if (projSort === "alphabetical") return (a.project || a.name || "").localeCompare(b.project || b.name || "");
              if (projSort === "recent") {
                const aDate = a.launchDate || a.projectStartDate || "";
                const bDate = b.launchDate || b.projectStartDate || "";
                return bDate.localeCompare(aDate);
              }
              /* Default 'relevance' â€” interleave: Research (enriched data) first, DLD second, within each group by score/data completeness */
              const aIsDld = String(a.id || "").startsWith("dld-") || a.dldSource;
              const bIsDld = String(b.id || "").startsWith("dld-") || b.dldSource;
              if (aIsDld !== bIsDld) return aIsDld ? 1 : -1; /* Research first */
              return calcScore(b) - calcScore(a);
            });

            const avgYield = filtered.length > 0 && filtered.some(p => p.grossYield > 0)
              ? (filtered.filter(p=>p.grossYield>0).reduce((a,p) => a + p.grossYield, 0) / filtered.filter(p=>p.grossYield>0).length).toFixed(1) : "â€”";
            const avgPpsf = filtered.length > 0 && filtered.some(p=>p.ppsf)
              ? Math.round(filtered.filter(p=>p.ppsf).reduce((a,p) => a + p.ppsf, 0) / filtered.filter(p=>p.ppsf).length) : 0;

            const devOptions = ["All", ...new Set(rawProjects.filter(p => projMode === "All" || normalizeType(p)===projMode).map(p=>p.developer || p.developerName).filter(Boolean))].slice(0, 500);
            const commOptions = ["All", ...new Set(rawProjects.filter(p => projMode === "All" || normalizeType(p)===projMode).map(p=>p.community).filter(Boolean))].slice(0, 500);
            /* Escrow bank options with project counts â€” DLD enriched */
            const escrowCounts = {};
            rawProjects.forEach(p => {
              if (p.escrowBank) escrowCounts[p.escrowBank] = (escrowCounts[p.escrowBank] || 0) + 1;
            });
            const escrowOptionsData = [
              { value: "All", label: "Any escrow bank" },
              ...Object.entries(escrowCounts)
                .sort((a, b) => b[1] - a[1])  /* sort by count desc */
                .map(([bank, count]) => ({ value: bank, label: bank, count })),
            ];
            /* Legacy string array â€” kept for backward compat where other code reads it */
            const escrowOptions = ["All", ...Object.keys(escrowCounts).sort((a, b) => escrowCounts[b] - escrowCounts[a])];
            /* DYNAMIC HANDOVER YEARS â€” extract actual years from data, include 2030+ */
            const handoverYearsFromData = new Set();
            const currentYear = new Date().getFullYear();
            rawProjects.forEach(p => {
              const handoverStr = String(p.handover || p.expectedHandover || p.handoverDate || "");
              const yearMatch = handoverStr.match(/20\d{2}/);
              if (yearMatch) handoverYearsFromData.add(yearMatch[0]);
            });
            /* Always include current year + next 4 years even if no data, plus any years from data */
            for (let y = currentYear; y <= currentYear + 4; y++) handoverYearsFromData.add(String(y));
            const handoverYearsSorted = [...handoverYearsFromData].sort();

            const selSt = {
              background: "linear-gradient(145deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)",
              border: `1px solid rgba(255,255,255,0.08)`,
              borderRadius: 10,
              color: T.white,
              fontFamily:"'Outfit',sans-serif",
              fontSize: 13,
              fontWeight: 500,
              padding:"10px 36px 10px 14px",
              outline:"none",
              cursor:"pointer",
              appearance:"none",
              WebkitAppearance:"none",
              backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23a0a0a0' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
              backgroundRepeat:"no-repeat",
              backgroundPosition:"right 12px center",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04), 0 1px 2px rgba(0,0,0,0.2)",
              transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
            };

            const StatusBadge = ({ status }) => {
              const cfg = { "Off-Plan":{ bg:"rgba(212,168,67,0.15)", color:T.gold }, "Ready":{ bg:"rgba(16,185,129,0.15)", color:T.green }, "Sold Out":{ bg:"rgba(255,255,255,0.08)", color:T.textMuted } }[status] || { bg:"rgba(212,168,67,0.1)", color:T.gold };
              return <span style={{ fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:10, background:cfg.bg, color:cfg.color }}>{status}</span>;
            };

            /* DataCompletenessBadge â€” shows factual data completeness, NOT investment advice.
               Replaces the old ScoreCircle/scoreLabel which said "Strong Buy/Buy/Hold" =
               unlicensed investment advice under RERA law. */
            const DataCompletenessBadge = ({ p }) => {
              const isDld = String(p.id || "").startsWith("dld-") || p.dldSource;
              if (isDld) {
                return (
                  <div style={{ width:52, height:52, borderRadius:"50%", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", border:`2px solid ${T.teal}`, background:"rgba(20,184,166,0.15)", flexShrink:0 }}>
                    <span style={{ fontSize:16, color:T.teal, lineHeight:1 }}>âœ“</span>
                    <span style={{ fontSize:8, fontWeight:700, color:T.teal, marginTop:2 }}>DLD</span>
                  </div>
                );
              }
              /* Research-enriched: show data completeness indicator */
              let completeness = 0;
              if (p.priceMin) completeness++;
              if (p.ppsf) completeness++;
              if (p.grossYield) completeness++;
              if (p.paymentPlan) completeness++;
              if (Array.isArray(p.amenities) && p.amenities.length > 0) completeness++;
              const pct = Math.round(completeness / 5 * 100);
              return (
                <div style={{ width:52, height:52, borderRadius:"50%", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", border:`2px solid ${T.gold}`, background:"rgba(212,168,67,0.12)", flexShrink:0 }}>
                  <span style={{ fontSize:13, fontWeight:900, color:T.gold, lineHeight:1 }}>{pct}%</span>
                  <span style={{ fontSize:7, fontWeight:700, color:T.gold, marginTop:1, letterSpacing:0.3 }}>DATA</span>
                </div>
              );
            };

            const ProjectCard = ({ p }) => {
              const score = calcScore(p);
              const inCompare = Array.isArray(projCompare) && projCompare.some(c => c.id === p.id);
              const isDldVerified = String(p.id || "").startsWith("dld-") || p.dldSource;
              return (
                <div className="chart-box" style={{ padding:0, overflow:"hidden", cursor:"pointer", position:"relative" }}
                  onMouseEnter={e => e.currentTarget.style.borderColor="rgba(212,168,67,0.4)"}
                  onMouseLeave={e => e.currentTarget.style.borderColor=T.border}>
                  {/* DATA SOURCE BADGE â€” top-right corner */}
                  <div style={{ position:"absolute", top:10, right:10, zIndex:2 }}>
                    {isDldVerified ? (
                      <span style={{ fontSize:9, padding:"3px 8px", borderRadius:5, background:"rgba(20,184,166,0.12)", color:T.teal, fontWeight:700, border:`1px solid rgba(20,184,166,0.3)`, display:"inline-flex", alignItems:"center", gap:4 }}>
                        âœ“ DLD Verified
                      </span>
                    ) : (
                      <span style={{ fontSize:9, padding:"3px 8px", borderRadius:5, background:"rgba(212,168,67,0.08)", color:T.gold, fontWeight:700, border:`1px solid rgba(212,168,67,0.2)`, display:"inline-flex", alignItems:"center", gap:4 }}>
                        â—† Research
                      </span>
                    )}
                  </div>
                  <div style={{ padding:"14px 16px", borderBottom:`1px solid ${T.border}` }} onClick={() => { setSelectedProject(p); setProjDetailTab("identity"); }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
                      <div style={{ flex:1, paddingRight:70 /* room for DLD Verified badge */ }}>
                        <div style={{ fontSize:10, fontWeight:700, color:T.textMuted, letterSpacing:0.8, textTransform:"uppercase", marginBottom:3 }}>{(p.developer || p.developerName || "Unknown")}{"Â·"}{p.community || p.area || "â€”"}</div>
                        <div style={{ fontFamily:"'Fraunces',serif", fontSize:15, fontWeight:700, color:T.white, marginBottom:6 }}>{p.project || p.name || "â€”"}</div>
                        <div style={{ display:"flex", gap:6, flexWrap:"wrap", alignItems:"center" }}>
                          <StatusBadge status={p.status || (p.constructionPct >= 100 ? "Ready" : "Off-Plan")} />
                          {(p.handover || p.expectedHandover) && <span style={{ fontSize:10, color:T.textMuted }}>{p.handover || p.expectedHandover}</span>}
                          {Array.isArray(p.beds) && p.beds.length > 0 && <span style={{ fontSize:10, color:T.textMuted }}>{"Â·"}{p.beds.join(" / ")}</span>}
                          {isValidReraNumber(p.reraNo || p.projectNumber) && <span style={{ fontSize:9, color:T.teal }}>{"Â·"}RERA #{p.reraNo || p.projectNumber}</span>}
                        </div>
                        {/* Factual classification badges only â€” no investment advice */}
                        <div style={{ display:"flex", gap:5, flexWrap:"wrap", marginTop:6 }}>
                          {p.tier === 1 && <span style={{ fontSize:9, padding:"2px 7px", borderRadius:5, background:"rgba(16,185,129,0.12)", color:"#10B981", fontWeight:700 }}>Tier 1 Developer</span>}
                          {p.tier === 2 && <span style={{ fontSize:9, padding:"2px 7px", borderRadius:5, background:"rgba(245,158,11,0.12)", color:"#F59E0B", fontWeight:700 }}>Tier 2 Developer</span>}
                          {p.goldenVisa && p.priceMin >= GOLDEN_VISA_THRESHOLD && <span style={{ fontSize:9, padding:"2px 7px", borderRadius:5, background:"rgba(212,168,67,0.15)", color:T.gold, fontWeight:700 }}>â˜… Golden Visa Eligible</span>}
                          {p.branded && <span style={{ fontSize:9, padding:"2px 7px", borderRadius:5, background:"rgba(139,92,246,0.15)", color:"#A78BFA", fontWeight:700 }}>â—† {p.brandPartner || "Branded"}</span>}
                          {p.escrowBank && <span style={{ fontSize:9, padding:"2px 7px", borderRadius:5, background:"rgba(20,184,166,0.08)", color:T.teal, fontWeight:700 }}>Escrow âœ“</span>}
                        </div>
                      </div>
                      <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:4 }}>
                        {/* Circle badge removed â€” top-right pill shows data source */}
                      </div>
                    </div>
                  </div>
                  <div style={{ padding:"12px 16px", borderBottom:`1px solid ${T.border}` }} onClick={() => { setSelectedProject(p); setProjDetailTab("identity"); }}>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:8, marginBottom:10 }}>
                      <div>
                        <div style={{ fontSize:9, color:T.textMuted, textTransform:"uppercase", letterSpacing:0.6, marginBottom:2 }}>
                          {p.priceMin ? "From" : p.communityMedianPrice ? "Community Median" : "From"}
                        </div>
                        <div style={{ fontSize:13, fontWeight:700, color:(p.priceMin || p.communityMedianPrice) ? T.white : T.textMuted }}>
                          {p.priceMin
                            ? "AED " + (p.priceMin/1000000).toFixed(1) + "M"
                            : p.communityMedianPrice
                              ? "AED " + (p.communityMedianPrice/1000000).toFixed(1) + "M"
                              : "Inquire"}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize:9, color:T.textMuted, textTransform:"uppercase", letterSpacing:0.6, marginBottom:2 }}>
                          {p.ppsf ? "PPSF" : p.communityMedianPPSF ? "Community PPSF" : "PPSF"}
                        </div>
                        <div style={{ fontSize:13, fontWeight:700, color:(p.ppsf || p.communityMedianPPSF) ? T.white : T.textMuted }}>
                          {p.ppsf
                            ? "AED " + p.ppsf.toLocaleString()
                            : p.communityMedianPPSF
                              ? "AED " + p.communityMedianPPSF.toLocaleString()
                              : "â€”"}
                        </div>
                        {!p.ppsf && p.communityMedianPPSF && p.communityTxCount && (
                          <div style={{ fontSize:8, color:T.teal, marginTop:1 }}>DLD Â· n={p.communityTxCount}</div>
                        )}
                      </div>
                      <div>
                        <div style={{ fontSize:9, color:T.textMuted, textTransform:"uppercase", letterSpacing:0.6, marginBottom:2 }}>
                          {p.grossYield ? "Yield" : p.totalUnits ? "Total Units" : "Yield"}
                        </div>
                        <div style={{ fontSize:13, fontWeight:700, color:p.grossYield >= 7 ? T.green : p.grossYield >= 5 ? T.gold : p.totalUnits ? T.white : T.textMuted }}>
                          {p.grossYield
                            ? p.grossYield.toFixed(1) + "%"
                            : p.totalUnits
                              ? p.totalUnits.toLocaleString()
                              : "â€”"}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize:9, color:T.textMuted, textTransform:"uppercase", letterSpacing:0.6, marginBottom:2 }}>
                          {p.paymentPlan ? "Payment" : p.constructionPct != null ? "Build" : "Status"}
                        </div>
                        <div style={{ fontSize:13, fontWeight:700, color:T.white }}>
                          {p.paymentPlan
                            ? p.paymentPlan
                            : p.constructionPct != null
                              ? p.constructionPct + "%"
                              : (p.status || "â€”")}
                        </div>
                      </div>
                    </div>
                    {/* Unit mini-breakdown on card (Research records) */}
                    {Array.isArray(p.unitBreakdown) && p.unitBreakdown.length > 0 && (
                      <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:8, padding:"8px 10px", background:T.surfaceAlt, borderRadius:8 }}>
                        {p.unitBreakdown.map((u,i) => (
                          <div key={i} style={{ display:"flex", flexDirection:"column", alignItems:"center", padding:"4px 8px", background:"rgba(212,168,67,0.06)", borderRadius:6, border:`1px solid rgba(212,168,67,0.15)`, minWidth:64 }}>
                            <span style={{ fontSize:9, fontWeight:700, color:T.gold }}>{u.type}</span>
                            <span style={{ fontSize:10, color:T.white, fontWeight:600 }}>AED {(u.ppsf||0).toLocaleString()}</span>
                            <span style={{ fontSize:9, color:T.textMuted }}>AED {(u.priceMin/1000000).toFixed(1)}M+</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {/* Community benchmark strip for DLD records (no unit mix but has DLD data) */}
                    {(!Array.isArray(p.unitBreakdown) || p.unitBreakdown.length === 0) && p.communityMedianPPSF && (
                      <div style={{ display:"flex", gap:6, marginBottom:8, padding:"8px 10px", background:"rgba(20,184,166,0.05)", borderRadius:8, border:`1px solid rgba(20,184,166,0.15)`, alignItems:"center", justifyContent:"space-between" }}>
                        <div>
                          <div style={{ fontSize:9, fontWeight:700, color:T.teal, letterSpacing:0.5 }}>COMMUNITY DLD BENCHMARK</div>
                          <div style={{ fontSize:10, color:T.textMuted, marginTop:2 }}>{p.community || p.area}</div>
                        </div>
                        <div style={{ textAlign:"right" }}>
                          <div style={{ fontSize:12, color:T.white, fontWeight:700 }}>
                            AED {p.communityMedianPPSF.toLocaleString()}/sqft
                          </div>
                          {p.communityP25PPSF && p.communityP75PPSF && (
                            <div style={{ fontSize:9, color:T.textMuted, marginTop:1 }}>
                              25thâ€“75th: {p.communityP25PPSF.toLocaleString()}â€“{p.communityP75PPSF.toLocaleString()}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                      {typeof p.distMetro === "number" && p.distMetro > 0 && <span style={{ fontSize:10, padding:"2px 7px", borderRadius:8, background:p.distMetro <= 0.8 ? "rgba(16,185,129,0.15)" : T.surfaceAlt, color:p.distMetro <= 0.8 ? T.green : T.textMuted }}>Metro {p.distMetro <= 0.8 ? "â‰¤800m" : p.distMetro + "km"}</span>}
                      {typeof p.distBeach === "number" && p.distBeach > 0 && p.distBeach <= 2 && <span style={{ fontSize:10, padding:"2px 7px", borderRadius:8, background:"rgba(20,184,166,0.12)", color:T.teal }}>Beach {p.distBeach < 1 ? (p.distBeach*1000).toFixed(0)+"m" : p.distBeach+"km"}</span>}
                      {typeof p.distDIFC === "number" && p.distDIFC > 0 && <span style={{ fontSize:10, padding:"2px 7px", borderRadius:8, background:T.surfaceAlt, color:T.textMuted }}>DIFC {p.distDIFC}km</span>}
                      {p.constructionPct > 0 && p.status !== "Ready" && <span style={{ fontSize:10, padding:"2px 7px", borderRadius:8, background:"rgba(139,92,246,0.12)", color:"#8B5CF6" }}>{p.constructionPct}% built</span>}
                    </div>
                  </div>
                  {Array.isArray(p.amenities) && p.amenities.length > 0 && (
                    <div style={{ padding:"10px 16px", borderBottom:`1px solid ${T.border}`, display:"flex", gap:4, flexWrap:"wrap" }} onClick={() => { setSelectedProject(p); setProjDetailTab("identity"); }}>
                      {p.amenities.slice(0,4).map((a,i) => <span key={i} style={{ fontSize:10, padding:"2px 6px", borderRadius:6, background:T.surfaceAlt, color:T.textMuted }}>{a}</span>)}
                      {(Array.isArray(p.view) ? p.view : []).slice(0,2).map((v,i) => <span key={"v"+i} style={{ fontSize:10, padding:"2px 6px", borderRadius:6, background:"rgba(20,184,166,0.08)", color:T.teal }}>{v}</span>)}
                      {p.amenities.length > 4 && <span style={{ fontSize:10, color:T.textMuted }}>+{p.amenities.length-4}</span>}
                    </div>
                  )}
                  <div style={{ padding:"10px 12px", display:"flex", gap:6, flexWrap:"wrap" }}>
                    <button type="button" onClick={() => handleTabChange("Investment Score")} style={{ padding:"5px 10px", background:"rgba(212,168,67,0.08)", border:`1px solid ${T.border}`, borderRadius:7, color:T.gold, fontSize:10, fontWeight:700, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>ROI â†’</button>
                    <button type="button" onClick={() => handleTabChange("Mortgage")} style={{ padding:"5px 10px", background:T.surfaceAlt, border:`1px solid ${T.border}`, borderRadius:7, color:T.textSecondary, fontSize:10, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>Mortgage</button>
                    {p.status === "Off-Plan" && <button type="button" onClick={() => handleTabChange("Launch Calendar")} style={{ padding:"5px 10px", background:"rgba(212,168,67,0.08)", border:`1px solid ${T.gold}`, borderRadius:7, color:T.gold, fontSize:10, fontWeight:700, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>View Launch â†’</button>}
                    <button type="button" onClick={() => setProjCompare(prev => inCompare ? prev.filter(c=>c.id!==p.id) : prev.length < 3 ? [...prev,p] : prev)} style={{ padding:"5px 10px", background:inCompare?"rgba(16,185,129,0.12)":T.surfaceAlt, border:`1px solid ${inCompare?T.green:T.border}`, borderRadius:7, color:inCompare?T.green:T.textSecondary, fontSize:10, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>{inCompare?"âœ“ Compare":"+ Compare"}</button>
                    <button type="button" onClick={() => handleTabChange("My Leads")} style={{ padding:"5px 10px", background:T.surfaceAlt, border:`1px solid ${T.border}`, borderRadius:7, color:T.textSecondary, fontSize:10, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>Add Lead</button>
                    <button type="button" onClick={() => { setSelectedProject(p); setProjDetailTab("identity"); }} style={{ padding:"5px 10px", background:T.surfaceAlt, border:`1px solid ${T.border}`, borderRadius:7, color:T.textSecondary, fontSize:10, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>Details â†’</button>
                  </div>
                </div>
              );
            };

            return (
              <div style={{ animation:"fadeUp 0.4s ease-out forwards" }}>
                {/* Header */}
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 0", marginBottom:16, borderBottom:`1px solid ${T.border}`, flexWrap:"wrap", gap:8 }}>
                  <div>
                    <div style={{ fontFamily:"'Fraunces',serif", fontSize:20, fontWeight:800, color:T.white }}>Project Explorer</div>
                    <div style={{ fontSize:11, color:T.textMuted, marginTop:3 }}>All Dubai property types Â· Investment intelligence Â· Full project data</div>
                  </div>
                  <div style={{ display:"flex", gap:8 }}>
                  </div>
                </div>

                {/* â•â•â• PROPERTY TYPE TABS â€” premium pill design â•â•â• */}
                <div style={{
                  display:"flex", gap:8, flexWrap:"wrap",
                  marginBottom: 16,
                  padding: "14px 18px",
                  background: "linear-gradient(145deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)",
                  border: `1px solid rgba(255,255,255,0.08)`,
                  borderRadius: 16,
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04), 0 1px 2px rgba(0,0,0,0.1)",
                  alignItems:"center",
                }}>
                  <span style={{ fontSize:11, fontWeight:600, color:T.textMuted, marginRight:6, fontFamily:"'Outfit',sans-serif" }}>Property type</span>
                  {MODES.map(m => {
                    const active = projMode===m.key;
                    return (
                      <button key={m.key} type="button" onClick={() => { setProjMode(m.key); setProjBeds("All"); setProjDev("All"); setProjCommunity("All"); setProjSearch(""); }}
                        style={{
                          padding:"8px 16px",
                          background: active
                            ? "linear-gradient(145deg, rgba(212,168,67,0.22) 0%, rgba(212,168,67,0.12) 100%)"
                            : "transparent",
                          border:`1px solid ${active ? "rgba(212,168,67,0.4)" : "rgba(255,255,255,0.08)"}`,
                          borderRadius: 20,
                          color: active ? T.gold : T.white,
                          fontSize: 12,
                          fontWeight: active ? 600 : 500,
                          cursor:"pointer",
                          fontFamily:"'Outfit',sans-serif",
                          boxShadow: active
                            ? "inset 0 1px 0 rgba(255,255,255,0.04), 0 0 0 3px rgba(212,168,67,0.08)"
                            : "none",
                          transition:"all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                        }}
                        onMouseEnter={e => {
                          if (!active) { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.14)"; }
                        }}
                        onMouseLeave={e => {
                          if (!active) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; }
                        }}>
                        {m.label || m.key}
                      </button>
                    );
                  })}
                </div>

                {/* â•â•â• PROJECTS CONTROL BAR â€” clean unified design, no duplicate search â•â•â• */}
                {(() => {
                  const activeFilters = [];
                  /* GLOBAL FILTERS from top bar â€” shown as chips so user sees what's applied */
                  if (globalFilters?.developer && globalFilters.developer !== "all") {
                    const devName = (allDevelopers || []).find(d => String(d.id).toLowerCase() === String(globalFilters.developer).toLowerCase())?.name || globalFilters.developer;
                    activeFilters.push({ key:"gDev", label:devName, global:true });
                  }
                  if (globalFilters?.community && globalFilters.community !== "all") activeFilters.push({ key:"gCom", label:globalFilters.community, global:true });
                  if (globalFilters?.status && globalFilters.status !== "all") activeFilters.push({ key:"gSts", label:globalFilters.status, global:true });
                  if (globalFilters?.beds && globalFilters.beds !== "all") activeFilters.push({ key:"gBed", label:globalFilters.beds, global:true });
                  if (globalFilters?.priceMin > 0 || globalFilters?.priceMax > 0) {
                    const lbl = globalFilters.priceMin > 0 && globalFilters.priceMax > 0
                      ? `AED ${(globalFilters.priceMin/1000000).toFixed(1)}Mâ€“${(globalFilters.priceMax/1000000).toFixed(1)}M`
                      : globalFilters.priceMin > 0 ? `From AED ${(globalFilters.priceMin/1000000).toFixed(1)}M`
                      : `Up to AED ${(globalFilters.priceMax/1000000).toFixed(1)}M`;
                    activeFilters.push({ key:"gPrice", label:lbl, global:true });
                  }
                  if (projLifecycle !== "All") activeFilters.push({ key:"lfc", label:projLifecycle === "under-construction" ? "Under construction" : projLifecycle === "recently-delivered" ? "Recently delivered" : projLifecycle.charAt(0).toUpperCase()+projLifecycle.slice(1), clear:() => setProjLifecycle("All") });
                  if (projConstruction !== "All") activeFilters.push({ key:"cst", label:projConstruction === "100" ? "Completed" : projConstruction + "%", clear:() => setProjConstruction("All") });
                  if (projEscrowBank !== "All") activeFilters.push({ key:"esc", label:projEscrowBank, clear:() => setProjEscrowBank("All") });
                  if (projHandover !== "All") activeFilters.push({ key:"hnd", label:`Handover ${projHandover}`, clear:() => setProjHandover("All") });
                  if (projGrade !== "All") activeFilters.push({ key:"grd", label:`Grade ${projGrade}`, clear:() => setProjGrade("All") });
                  if (projIntelFilter !== "all") activeFilters.push({ key:"int", label:projIntelFilter === "tier1" ? "Tier 1 only" : projIntelFilter === "gv" ? "Golden Visa" : projIntelFilter === "branded" ? "Branded residences" : projIntelFilter, clear:() => setProjIntelFilter("all") });
                  const localActiveCount = activeFilters.filter(f => !f.global).length;
                  const anyActive = activeFilters.length > 0;
                  return (
                    <>
                      {/* CONTROL BAR â€” single row */}
                      <div style={{
                        display:"flex", alignItems:"center", gap:12, flexWrap:"wrap",
                        marginBottom: anyActive ? 10 : 16,
                        padding: "12px 18px",
                        background: "linear-gradient(145deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)",
                        border: `1px solid rgba(255,255,255,0.08)`,
                        borderRadius: 16,
                        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
                      }}>
                        <button type="button" onClick={() => setFiltersOpen(!filtersOpen)}
                          style={{
                            padding:"9px 16px",
                            background: filtersOpen
                              ? "linear-gradient(145deg, rgba(212,168,67,0.2) 0%, rgba(212,168,67,0.10) 100%)"
                              : "linear-gradient(145deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)",
                            border:`1px solid ${filtersOpen ? "rgba(212,168,67,0.4)" : "rgba(255,255,255,0.1)"}`,
                            borderRadius: 10,
                            color: filtersOpen ? T.gold : T.white,
                            fontSize: 13, fontWeight: 600,
                            cursor: "pointer",
                            fontFamily: "'Outfit',sans-serif",
                            display: "flex", alignItems: "center", gap: 8,
                            whiteSpace: "nowrap",
                            boxShadow: filtersOpen ? "0 0 0 3px rgba(212,168,67,0.08)" : "none",
                            transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                          }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="21" y1="4" x2="14" y2="4" /><line x1="10" y1="4" x2="3" y2="4" />
                            <line x1="21" y1="12" x2="12" y2="12" /><line x1="8" y1="12" x2="3" y2="12" />
                            <line x1="21" y1="20" x2="16" y2="20" /><line x1="12" y1="20" x2="3" y2="20" />
                            <line x1="14" y1="2" x2="14" y2="6" /><line x1="8" y1="10" x2="8" y2="14" /><line x1="16" y1="18" x2="16" y2="22" />
                          </svg>
                          <span>Project filters</span>
                          {localActiveCount > 0 && (
                            <span style={{ background:T.gold, color:"#000", padding:"2px 8px", borderRadius:10, fontSize:11, fontWeight:700 }}>{localActiveCount}</span>
                          )}
                        </button>

                        <select value={projSort} onChange={e => setProjSort(e.target.value)} style={selSt} title="Sort order">
                          <option value="score">Relevance</option>
                          <option value="yield">Yield: high to low</option>
                          <option value="price_asc">Price: low to high</option>
                          <option value="price_desc">Price: high to low</option>
                          <option value="alphabetical">Name: Aâ€“Z</option>
                          <option value="recent">Recently launched</option>
                        </select>

                        <div style={{
                          display:"flex", gap:2,
                          background: "linear-gradient(145deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)",
                          border: `1px solid rgba(255,255,255,0.1)`,
                          borderRadius: 10, padding: 3,
                        }}>
                          {[
                            { k:"grid", icon:(<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>) },
                            { k:"list", icon:(<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>) },
                          ].map(v => (
                            <button key={v.k} type="button" onClick={() => setProjView(v.k)}
                              style={{
                                padding:"7px 12px",
                                background: projView===v.k ? "rgba(212,168,67,0.2)" : "transparent",
                                border: "none", borderRadius: 7,
                                color: projView===v.k ? T.gold : T.textMuted,
                                cursor: "pointer",
                                display:"flex", alignItems:"center",
                                transition: "all 0.15s",
                              }}>{v.icon}</button>
                          ))}
                        </div>

                        <span style={{ fontSize:13, color:T.textMuted, marginLeft:"auto", fontWeight:500, fontFamily:"'Outfit',sans-serif" }}>
                          <span style={{ color:T.white, fontWeight:700 }}>{filtered.length.toLocaleString()}</span>
                          <span style={{ opacity:0.6 }}> of {rawProjects.length.toLocaleString()} projects</span>
                        </span>
                      </div>

                      {anyActive && (
                        <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:16, alignItems:"center" }}>
                          {activeFilters.map(f => (
                            f.global ? (
                              <span key={f.key} title="Applied from top filter bar" style={{
                                display: "inline-flex", alignItems: "center", gap: 6,
                                padding: "6px 14px",
                                background: "linear-gradient(145deg, rgba(20,184,166,0.15) 0%, rgba(20,184,166,0.08) 100%)",
                                border: `1px solid rgba(20,184,166,0.25)`,
                                borderRadius: 20,
                                color: T.teal,
                                fontSize: 12, fontWeight: 600,
                                fontFamily: "'Outfit',sans-serif",
                                cursor: "help",
                                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
                              }}>
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.8 }}>
                                  <polyline points="18 15 12 9 6 15" />
                                </svg>
                                {f.label}
                              </span>
                            ) : (
                              <span key={f.key} style={{
                                display: "inline-flex", alignItems: "center", gap: 8,
                                padding: "6px 6px 6px 14px",
                                background: "linear-gradient(145deg, rgba(212,168,67,0.18) 0%, rgba(212,168,67,0.10) 100%)",
                                border: `1px solid rgba(212,168,67,0.3)`,
                                borderRadius: 20,
                                color: T.gold,
                                fontSize: 12, fontWeight: 600,
                                fontFamily: "'Outfit',sans-serif",
                                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
                              }}>
                                {f.label}
                                <button type="button" onClick={f.clear} style={{
                                  background: "rgba(212,168,67,0.15)", border: "none",
                                  color: T.gold, cursor: "pointer",
                                  width: 18, height: 18, borderRadius: "50%",
                                  display: "flex", alignItems: "center", justifyContent: "center",
                                  padding: 0, fontSize: 14, lineHeight: 1,
                                }}>Ã—</button>
                              </span>
                            )
                          ))}
                          {localActiveCount > 0 && (
                            <button type="button" onClick={() => { setProjHandover("All"); setProjGrade("All"); setProjIntelFilter("all"); setProjLifecycle("All"); setProjEscrowBank("All"); setProjConstruction("All"); }}
                              title="Clear Projects-specific filters"
                              style={{
                                background: "transparent",
                                border: `1px solid rgba(255,255,255,0.1)`,
                                borderRadius: 20,
                                padding: "6px 14px",
                                color: T.textMuted,
                                fontSize: 12, fontWeight: 500,
                                cursor: "pointer",
                                fontFamily: "'Outfit',sans-serif",
                                transition: "all 0.15s",
                              }}
                              onMouseEnter={e => { e.currentTarget.style.color = "#ef4444"; e.currentTarget.style.borderColor = "rgba(239,68,68,0.3)"; }}
                              onMouseLeave={e => { e.currentTarget.style.color = T.textMuted; e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; }}>
                              Clear project filters
                            </button>
                          )}
                        </div>
                      )}

                      {filtersOpen && (
                        <div style={{
                          marginBottom: 16,
                          padding: 20,
                          background: "linear-gradient(145deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)",
                          border: `1px solid rgba(255,255,255,0.08)`,
                          borderRadius: 16,
                          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04), 0 8px 24px rgba(0,0,0,0.2)",
                        }}>
                          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(200px, 1fr))", gap:16 }}>
                            {projMode === "Office" && (
                              <div>
                                <label style={{ fontSize:11, color:T.textMuted, fontWeight:600, marginBottom:8, display:"block", fontFamily:"'Outfit',sans-serif" }}>Office grade</label>
                                <select value={projGrade} onChange={e => setProjGrade(e.target.value)} style={{ ...selSt, width:"100%" }}>
                                  {["All","A","B","C"].map(g => <option key={g}>{g === "All" ? "All grades" : "Grade " + g}</option>)}
                                </select>
                              </div>
                            )}
                            <div>
                              <label style={{ fontSize:11, color:T.textMuted, fontWeight:600, marginBottom:8, display:"block", fontFamily:"'Outfit',sans-serif" }}>Handover year</label>
                              <select value={projHandover} onChange={e => setProjHandover(e.target.value)} style={{ ...selSt, width:"100%" }}>
                                <option value="All">Any year</option>
                                <option value="Available Now">Available now</option>
                                {handoverYearsSorted.map(y => <option key={y} value={y}>{y}</option>)}
                              </select>
                            </div>
                            <div>
                              <label style={{ fontSize:11, color:T.textMuted, fontWeight:600, marginBottom:8, display:"block", fontFamily:"'Outfit',sans-serif" }}>Project stage</label>
                              <select value={projLifecycle} onChange={e => setProjLifecycle(e.target.value)} style={{ ...selSt, width:"100%" }}>
                                <option value="All">All stages</option>
                                <option value="announced">Announced Â· Pre-construction</option>
                                <option value="under-construction">Under construction</option>
                                <option value="recently-delivered">Recently delivered</option>
                                <option value="historical">Historical Â· Already sold</option>
                              </select>
                            </div>
                            <div>
                              <label style={{ fontSize:11, color:T.textMuted, fontWeight:600, marginBottom:8, display:"block", fontFamily:"'Outfit',sans-serif" }}>Construction progress</label>
                              <select value={projConstruction} onChange={e => setProjConstruction(e.target.value)} style={{ ...selSt, width:"100%" }}>
                                <option value="All">Any progress</option>
                                <option value="0-25">0 â€“ 25%</option>
                                <option value="25-50">25 â€“ 50%</option>
                                <option value="50-75">50 â€“ 75%</option>
                                <option value="75-99">75 â€“ 99%</option>
                                <option value="100">100% Completed</option>
                              </select>
                            </div>
                            <div>
                              <label style={{ fontSize:11, color:T.textMuted, fontWeight:600, marginBottom:8, display:"block", fontFamily:"'Outfit',sans-serif" }}>Escrow bank</label>
                              <SearchableSelect
                                value={projEscrowBank}
                                onChange={v => setProjEscrowBank(v)}
                                options={escrowOptionsData}
                                placeholder="Any escrow bank"
                                T={T}
                              />
                            </div>
                          </div>
                          <div style={{ marginTop:18, paddingTop:16, borderTop:`1px solid rgba(255,255,255,0.06)` }}>
                            <div style={{ fontSize:11, color:T.textMuted, fontWeight:600, marginBottom:10, fontFamily:"'Outfit',sans-serif" }}>Smart segments</div>
                            <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                              {[
                                { key:"all",     label:"All projects" },
                                { key:"tier1",   label:"âš¡ Tier 1 developers" },
                                { key:"gv",      label:"â˜… Golden Visa eligible" },
                                { key:"branded", label:"â—† Branded residences" },
                              ].map(f => {
                                const active = projIntelFilter === f.key;
                                return (
                                  <button key={f.key} type="button" onClick={() => setProjIntelFilter(f.key)}
                                    style={{
                                      padding:"8px 16px",
                                      background: active
                                        ? "linear-gradient(145deg, rgba(212,168,67,0.25) 0%, rgba(212,168,67,0.15) 100%)"
                                        : "transparent",
                                      border:`1px solid ${active ? "rgba(212,168,67,0.4)" : "rgba(255,255,255,0.1)"}`,
                                      borderRadius: 20,
                                      color: active ? T.gold : T.white,
                                      fontSize: 12,
                                      fontWeight: active ? 600 : 500,
                                      cursor:"pointer",
                                      fontFamily:"'Outfit',sans-serif",
                                      transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                                    }}
                                    onMouseEnter={e => {
                                      if (!active) { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)"; }
                                    }}
                                    onMouseLeave={e => {
                                      if (!active) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; }
                                    }}>
                                    {f.label}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}

                {/* COMPACT INLINE STATS â€” honest labeling per DLD data subset */}
                <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:16, padding:"10px 14px", background:T.surface, border:`1px solid ${T.border}`, borderRadius:10 }}>
                  {(() => {
                    const priced = filtered.filter(p => p.priceMin && isFinite(p.priceMin));
                    const withYield = filtered.filter(p => p.grossYield > 0);
                    const withPpsf = filtered.filter(p => p.ppsf > 0);
                    const withBench = filtered.filter(p => p.communityMedianPPSF);
                    const minPrice = priced.length > 0 ? Math.min(...priced.map(p => p.priceMin)) : null;
                    return [
                      { label:"Total", value:filtered.length.toLocaleString(), sub:"projects", color:T.white },
                      { label:"Priced From", value:minPrice ? `AED ${(minPrice/1000000).toFixed(1)}M` : "â€”", sub:priced.length > 0 ? `${priced.length} priced` : "0 priced", color:T.gold },
                      { label:"Avg Yield", value:withYield.length > 0 ? (withYield.reduce((a,p) => a+p.grossYield, 0)/withYield.length).toFixed(1) + "%" : "â€”", sub:`n=${withYield.length} disclosed`, color:T.green },
                      { label:"Community PPSF", value:withBench.length > 0 ? "AED " + Math.round(withBench.reduce((a,p) => a+p.communityMedianPPSF, 0)/withBench.length).toLocaleString() : "â€”", sub:`DLD Â· n=${withBench.length}`, color:T.teal },
                    ].map((kpi,i) => (
                      <div key={i} style={{ display:"flex", flexDirection:"column", padding:"4px 14px", borderRight:i < 3 ? `1px solid ${T.border}` : "none" }}>
                        <div style={{ display:"flex", alignItems:"baseline", gap:6 }}>
                          <span style={{ fontSize:10, fontWeight:700, color:T.textMuted, letterSpacing:0.5, textTransform:"uppercase" }}>{kpi.label}</span>
                          <span style={{ fontFamily:"'Fraunces',serif", fontSize:17, fontWeight:800, color:kpi.color }}>{kpi.value}</span>
                        </div>
                        <span style={{ fontSize:9, color:T.textMuted, marginTop:2 }}>{kpi.sub}</span>
                      </div>
                    ));
                  })()}
                </div>

                {/* Compare bar */}
                {Array.isArray(projCompare) && projCompare.length > 0 && (
                  <div style={{ background:"rgba(212,168,67,0.06)", border:`1px solid rgba(212,168,67,0.2)`, borderRadius:10, padding:"10px 16px", marginBottom:16, display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
                    <span style={{ fontSize:11, fontWeight:700, color:T.gold }}>Comparing {projCompare.length}/3:</span>
                    {projCompare.map((p,i) => (
                      <span key={i} style={{ fontSize:11, padding:"3px 10px", borderRadius:10, background:"rgba(212,168,67,0.1)", color:T.white, display:"flex", alignItems:"center", gap:6 }}>
                        {p.project?.substring(0,20)}
                        <button type="button" onClick={() => setProjCompare(prev => prev.filter(c=>c.id!==p.id))} style={{ background:"none", border:"none", color:T.textMuted, cursor:"pointer", fontSize:12, padding:0 }}>Ã—</button>
                      </span>
                    ))}
                    <div style={{ display:"flex", gap:8, marginLeft:"auto" }}>
                      {projCompare.length >= 2 && (
                        <button type="button" onClick={() => setShowCompare(true)}
                          style={{ padding:"7px 16px", background:`linear-gradient(135deg, ${T.gold}, #B8922A)`, border:"none", borderRadius:8, color:"#000", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>
                          View Comparison â†’
                        </button>
                      )}
                      <button type="button" onClick={() => setProjCompare([])} style={{ background:"none", border:`1px solid ${T.border}`, borderRadius:8, padding:"5px 10px", color:T.textMuted, fontSize:11, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>Clear</button>
                    </div>
                  </div>
                )}

                {/* DATA TIER DISCLOSURE â€” honest two-tier data source labeling */}
                <div style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px", borderRadius:10, background:"rgba(20,184,166,0.04)", border:`1px solid ${T.border}`, marginBottom:14, flexWrap:"wrap" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                    <span style={{ fontSize:12, color:T.teal, fontWeight:800 }}>âœ“</span>
                    <span style={{ fontSize:11, color:T.textSecondary }}><strong style={{ color:T.teal }}>DLD-Verified:</strong> Auto-imported from Dubai Land Department registry. Government-backed core data.</span>
                  </div>
                  <div style={{ width:1, height:14, background:T.border, margin:"0 4px" }} />
                  <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                    <span style={{ fontSize:12, color:T.gold, fontWeight:800 }}>â—†</span>
                    <span style={{ fontSize:11, color:T.textSecondary }}><strong style={{ color:T.gold }}>Research-Enriched:</strong> Additional details curated from developer portals, Bayut, Property Finder.</span>
                  </div>
                </div>

                {/* Phase 3.7: Smart empty state â€” suggests which filter to remove */}
                {filtered.length === 0 && (
                  <SmartEmptyState
                    rowsAll={rawProjects}
                    filters={{
                      type: projMode,
                      developer: projDev !== "All" ? projDev : "all",
                      community: projCommunity !== "All" ? projCommunity : "all",
                      beds: projBeds !== "All" ? projBeds : "all",
                      status: projStatus !== "All" ? projStatus : "all",
                      priceMin: projPriceMin || 0,
                      priceMax: projPriceMax || 0,
                    }}
                    entityLabel={projMode + " projects"}
                    onRemoveFilter={(key) => {
                      if (key === "developer") setProjDev("All");
                      else if (key === "community") setProjCommunity("All");
                      else if (key === "beds") setProjBeds("All");
                      else if (key === "status") setProjStatus("All");
                      else if (key === "type") { /* keep â€” type is projMode, not a removable filter here */ }
                    }}
                    onClearAll={() => {
                      setProjSearch("");
                      setProjDev("All");
                      setProjCommunity("All");
                      setProjBeds("All");
                      setProjStatus("All");
                      setProjGrade("All");
                      setProjHandover("All");
                      setProjIntelFilter("all");
                      setProjLifecycle("All");
                      setProjEscrowBank("All");
                      setProjConstruction("All");
                    }}
                    matchFn={(p, filters) => {
                      if (p.type !== filters.type) return false;
                      if (filters.developer !== "all" && p.developer !== filters.developer) return false;
                      if (filters.community !== "all" && p.community !== filters.community) return false;
                      if (filters.status !== "all" && p.status !== filters.status) return false;
                      if (filters.beds !== "all" && p.beds && p.beds.length > 0 && !p.beds.includes(filters.beds)) return false;
                      if (filters.priceMin > 0 && p.priceMin < filters.priceMin) return false;
                      if (filters.priceMax > 0 && p.priceMax > filters.priceMax) return false;
                      return true;
                    }}
                    T={T}
                  />
                )}

                {/* Grid */}
                {filtered.length > 0 && projView === "grid" && (
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(340px,1fr))", gap:16, marginBottom:20 }}>
                    {filtered.map((p,i) => <ProjectCard key={p.id||i} p={p} />)}
                  </div>
                )}

                {/* List — upgraded: 9 cols, build % bar, badges, color-coded handover */}
                {filtered.length > 0 && projView === "list" && (
                  <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:12, overflow:"hidden", marginBottom:20 }}>
                    <div style={{ display:"grid", gridTemplateColumns:"2.2fr 1.3fr 0.9fr 0.9fr 0.8fr 0.9fr 1fr 1fr 0.9fr", padding:"10px 14px", background:T.surfaceAlt, borderBottom:`1px solid ${T.border}`, gap:8 }}>
                      {["Project","Developer","From","PPSF","Yield","Plan","Handover","Build %","Score"].map((h,i) => (
                        <div key={i} style={{ fontSize:10, fontWeight:700, color:T.textMuted, letterSpacing:0.8, textTransform:"uppercase" }}>{h}</div>
                      ))}
                    </div>
                    {filtered.map((p,i) => {
                      const sc = calcScore(p);
                      const tnum = { fontFeatureSettings: "'tnum'" };
                      const hoStr = String(p.handover || p.expectedHandover || "");
                      const hoYear = parseInt((hoStr.match(/\d{4}/) || [])[0] || "0");
                      const nowYear = new Date().getFullYear();
                      const hoColor = (!hoStr || hoStr.toLowerCase().includes("ready") || p.status === "Ready") ? T.teal
                                     : hoYear && hoYear <= nowYear + 1 ? T.gold
                                     : hoYear && hoYear <= nowYear + 2 ? T.textSecondary
                                     : T.textMuted;
                      const yieldBg = p.grossYield >= 7 ? "rgba(16,185,129,0.08)" : p.grossYield >= 5 ? "rgba(212,168,67,0.06)" : "transparent";
                      const yieldColor = p.grossYield >= 7 ? T.green : p.grossYield >= 5 ? T.gold : T.textSecondary;
                      const buildPct = p.constructionPct != null ? p.constructionPct : null;
                      const buildColor = buildPct >= 100 ? T.green : buildPct >= 75 ? T.gold : buildPct >= 25 ? T.teal : T.textMuted;
                      return (
                        <div key={p.id||i} onClick={() => { setSelectedProject(p); setProjDetailTab("identity"); }}
                          style={{ display:"grid", gridTemplateColumns:"2.2fr 1.3fr 0.9fr 0.9fr 0.8fr 0.9fr 1fr 1fr 0.9fr", padding:"12px 14px", borderBottom:i<filtered.length-1?`1px solid ${T.border}`:"none", cursor:"pointer", alignItems:"center", gap:8, transition:"background 0.15s" }}
                          onMouseEnter={e => e.currentTarget.style.background="rgba(212,168,67,0.06)"}
                          onMouseLeave={e => e.currentTarget.style.background="transparent"}>
                          <div style={{ minWidth:0 }}>
                            <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:2 }}>
                              <div style={{ fontSize:13, fontWeight:600, color:T.white, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{p.project || p.name}</div>
                              {p.verified && <span title="Verified" style={{ fontSize:9, color:T.green, fontWeight:700 }}>{"\u2713"}</span>}
                              {p.dataQuality === "research-verified" && <span title="Research-enriched" style={{ fontSize:9, color:T.gold }}>{"\u25C6"}</span>}
                              {p.tier === 1 && <span title="Tier 1 developer" style={{ fontSize:8, padding:"1px 5px", borderRadius:4, background:"rgba(16,185,129,0.12)", color:T.green, fontWeight:700 }}>T1</span>}
                              {p.goldenVisa && p.priceMin >= GOLDEN_VISA_THRESHOLD && <span title="Golden Visa eligible" style={{ fontSize:9, color:T.gold }}>{"\u2605"}</span>}
                            </div>
                            <div style={{ fontSize:11, color:T.textMuted, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{p.community || p.area || "-"}</div>
                          </div>
                          <div style={{ fontSize:12, color:T.textSecondary, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{p.developer || p.developerName || "-"}</div>
                          <div style={{ fontSize:13, color:T.white, fontWeight:600, ...tnum }}>{p.priceMin ? "AED " + (p.priceMin/1000000).toFixed(1) + "M" : "-"}</div>
                          <div style={{ fontSize:13, color:T.gold, fontWeight:600, ...tnum }}>{p.ppsf ? (p.ppsf).toLocaleString() : "-"}</div>
                          <div style={{ fontSize:13, fontWeight:700, color:yieldColor, background:yieldBg, padding:"3px 8px", borderRadius:6, textAlign:"center", ...tnum }}>{p.grossYield ? p.grossYield.toFixed(1)+"%" : "-"}</div>
                          <div style={{ fontSize:12, color:T.textSecondary, ...tnum }}>{p.paymentPlan || "-"}</div>
                          <div style={{ fontSize:12, color:hoColor, fontWeight:hoColor===T.gold||hoColor===T.teal?700:500 }}>{hoStr || "-"}</div>
                          <div>
                            {buildPct != null ? (
                              <>
                                <div style={{ fontSize:11, color:buildColor, fontWeight:700, marginBottom:3, ...tnum }}>{buildPct}%</div>
                                <div style={{ height:4, background:T.surfaceAlt, borderRadius:2, overflow:"hidden" }}>
                                  <div style={{ width:buildPct+"%", height:"100%", background:buildColor, transition:"width 0.3s" }} />
                                </div>
                              </>
                            ) : (
                              <div style={{ fontSize:11, color:T.textMuted }}>-</div>
                            )}
                          </div>
                          <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                            <span style={{ fontSize:15, fontWeight:700, color:scoreColor(sc), ...tnum }}>{sc}</span>
                            <span style={{ fontSize:9, color:T.textMuted, letterSpacing:0.3 }}>/ 100</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                {/* Cross-tab nav */}
                <div style={{ display:"flex", gap:8, marginBottom:14, flexWrap:"wrap" }}>
                  {[
                    { label:"Dev Portal â†’", tab:"Dev Portal" },
                    { label:"Launch Calendar â†’", tab:"Launch Calendar" },
                    { label:"Yields â†’", tab:"Yields" },
                    { label:"DLD Volumes â†’", tab:"DLD Volumes" },
                  ].map((n,i) => (
                    <button key={i} type="button" onClick={() => handleTabChange(n.tab)}
                      style={{ padding:"6px 14px", background:"rgba(212,168,67,0.06)", border:`1px solid ${T.border}`, borderRadius:8, color:T.gold, fontSize:11, fontWeight:600, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>
                      {n.label}
                    </button>
                  ))}
                </div>
                {/* Sources */}
                <div style={{ paddingTop:12, borderTop:`1px solid ${T.border}`, display:"flex", gap:8, flexWrap:"wrap", alignItems:"center" }}>
                  <span style={{ fontSize:10, color:T.textMuted }}>Sources:</span>
                  {["Developer Portals","Bayut","PropertyFinder","DLD RERA Registry","Knight Frank Q1 2025","Chestertons 2026"].map((s,i) => (
                    <span key={i} style={{ fontSize:10, color:T.textMuted, padding:"2px 8px", borderRadius:10, border:`1px solid ${T.border}`, background:T.surfaceAlt }}>{s}</span>
                  ))}
                </div>
              </div>
            );
      })()}

      {selectedProject && typeof document !== "undefined" && createPortal(
<div role="dialog" aria-modal="true" style={{ position:"fixed", inset:0, background:"rgba(4,9,15,0.97)", zIndex:2000, display:"flex", flexDirection:"column", backdropFilter:"blur(8px)" }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"16px 24px", borderBottom:`1px solid ${T.border}`, background:T.surface, flexShrink:0 }}>
                <div>
                  <div style={{ fontSize:11, fontWeight:700, color:T.textMuted, letterSpacing:0.8, textTransform:"uppercase", marginBottom:3 }}>{selectedProject.developer}{"Â·"}{selectedProject.community}</div>
                  <div style={{ fontFamily:"'Fraunces',serif", fontSize:22, fontWeight:800, color:T.white }}>{selectedProject.project}</div>
                  {/* Factual classification badges only â€” no investment advice */}
                  <div style={{ display:"flex", gap:5, flexWrap:"wrap", marginTop:6 }}>
                    {selectedProject.tier === 1 && <span style={{ fontSize:10, padding:"3px 8px", borderRadius:5, background:"rgba(16,185,129,0.12)", color:"#10B981", fontWeight:700 }}>Tier 1 Developer</span>}
                    {selectedProject.tier === 2 && <span style={{ fontSize:10, padding:"3px 8px", borderRadius:5, background:"rgba(245,158,11,0.12)", color:"#F59E0B", fontWeight:700 }}>Tier 2 Developer</span>}
                    {selectedProject.goldenVisa && selectedProject.priceMin >= GOLDEN_VISA_THRESHOLD && <span style={{ fontSize:10, padding:"3px 8px", borderRadius:5, background:"rgba(212,168,67,0.15)", color:T.gold, fontWeight:700 }}>â˜… Golden Visa Eligible</span>}
                    {selectedProject.branded && <span style={{ fontSize:10, padding:"3px 8px", borderRadius:5, background:"rgba(139,92,246,0.15)", color:"#A78BFA", fontWeight:700 }}>â—† {selectedProject.brandPartner || "Branded Residence"}</span>}
                    {selectedProject.escrowBank && <span style={{ fontSize:10, padding:"3px 8px", borderRadius:5, background:"rgba(20,184,166,0.1)", color:T.teal, fontWeight:700 }}>Escrow Verified</span>}
                    {isValidReraNumber(selectedProject.reraNo || selectedProject.projectNumber) && <span style={{ fontSize:10, padding:"3px 8px", borderRadius:5, background:"rgba(20,184,166,0.08)", color:T.teal, fontWeight:700 }}>RERA #{selectedProject.reraNo || selectedProject.projectNumber}</span>}
                  </div>
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <div style={{ textAlign:"right" }}>
                    <div style={{ fontSize:22, fontWeight:800, color:T.gold, fontFamily:"'Fraunces',serif" }}>{selectedProject.priceMin ? "AED " + (selectedProject.priceMin/1000000).toFixed(1) + "M" : "TBC"}</div>
                    <div style={{ fontSize:11, color:T.textMuted }}>starting price</div>
                  </div>
                  <button type="button" onClick={() => setSelectedProject(null)} style={{ width:36, height:36, borderRadius:"50%", background:T.surfaceAlt, border:`1px solid ${T.border}`, color:T.white, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, fontFamily:"'Outfit',sans-serif" }}>Ã—</button>
                </div>
              </div>
              <div style={{ display:"flex", borderBottom:`1px solid ${T.border}`, background:T.surface, flexShrink:0, overflowX:"auto" }}>
                {[
                  {key:"identity",label:"Identity"},
                  {key:"location",label:"Location"},
                  {key:"scale",label:"Scale & Units"},
                  {key:"product",label:"Product"},
                  {key:"pricing",label:"Pricing Data"},
                  {key:"rental",label:"Rental & Yield"},
                  {key:"developer",label:"Developer & Compliance"},
                  {key:"report",label:"Full Report"},
                ].map(t => (
                  <button key={t.key} type="button" onClick={() => setProjDetailTab(t.key)}
                    style={{ padding:"12px 16px", background:"none", border:"none", borderBottom:projDetailTab===t.key?`2px solid ${T.gold}`:"2px solid transparent", color:projDetailTab===t.key?T.gold:T.textMuted, fontSize:11, fontWeight:projDetailTab===t.key?700:400, cursor:"pointer", fontFamily:"'Outfit',sans-serif", whiteSpace:"nowrap", letterSpacing:0.3 }}>
                    {t.label}
                  </button>
                ))}
              </div>
              <div style={{ flex:1, overflowY:"auto", padding:"24px" }}>
                {/* â•â•â• SECTION 1 Â· PROJECT IDENTITY â•â•â• */}
                {projDetailTab === "identity" && (() => {
                  const seg = describeAssetClass(selectedProject);
                  const mkt = describeMarketStatus(selectedProject);
                  const rera = reraCompliance(selectedProject);
                  return (
                  <div>
                    <div style={{ padding:"18px 20px", background:`linear-gradient(135deg, rgba(212,168,67,0.08), rgba(20,184,166,0.04))`, border:`1px solid ${T.border}`, borderRadius:14, marginBottom:16 }}>
                      <div style={{ fontSize:10, fontWeight:700, color:T.textMuted, letterSpacing:1, textTransform:"uppercase", marginBottom:10 }}>Project Identity Â· Per DLD Registry</div>
                      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(200px, 1fr))", gap:14 }}>
                        <div>
                          <div style={{ fontSize:10, color:T.textMuted, marginBottom:4 }}>Project Name</div>
                          <div style={{ fontSize:15, fontWeight:700, color:T.white, fontFamily:"'Fraunces',serif" }}>{selectedProject.project || selectedProject.name || "â€”"}</div>
                        </div>
                        <div>
                          <div style={{ fontSize:10, color:T.textMuted, marginBottom:4 }}>Developer</div>
                          <div style={{ fontSize:15, fontWeight:700, color:T.white }}>{selectedProject.developer || "â€”"}</div>
                        </div>
                        <div>
                          <div style={{ fontSize:10, color:T.textMuted, marginBottom:4 }}>Community</div>
                          <div style={{ fontSize:15, fontWeight:700, color:T.textSecondary }}>{selectedProject.community || "â€”"}</div>
                        </div>
                        <div>
                          <div style={{ fontSize:10, color:T.textMuted, marginBottom:4 }}>Property Type</div>
                          <div style={{ fontSize:15, fontWeight:700, color:T.teal }}>{selectedProject.type || "â€”"}</div>
                        </div>
                        <div>
                          <div style={{ fontSize:10, color:T.textMuted, marginBottom:4 }}>Market Segment</div>
                          <div style={{ fontSize:15, fontWeight:700, color:seg.color }}>{seg.tier}</div>
                        </div>
                        <div>
                          <div style={{ fontSize:10, color:T.textMuted, marginBottom:4 }}>Project Stage</div>
                          <div style={{ fontSize:15, fontWeight:700, color:mkt.color }}>{mkt.label}</div>
                        </div>
                        <div>
                          <div style={{ fontSize:10, color:T.textMuted, marginBottom:4 }}>RERA Number</div>
                          <div style={{ fontSize:15, fontWeight:700, color:rera.verified ? T.green : T.textMuted }}>{rera.verified ? rera.number : "Pending"}</div>
                        </div>
                        <div>
                          <div style={{ fontSize:10, color:T.textMuted, marginBottom:4 }}>Construction Status</div>
                          <div style={{ fontSize:15, fontWeight:700, color:T.white }}>{selectedProject.constructionPct != null ? selectedProject.constructionPct + "% complete" : "Not disclosed"}</div>
                        </div>
                      </div>
                    </div>
                    {selectedProject.notes && (
                      <div className="chart-box" style={{ padding:18, marginBottom:12 }}>
                        <div style={{ fontSize:11, fontWeight:700, color:T.textMuted, letterSpacing:0.8, textTransform:"uppercase", marginBottom:10 }}>Project Description</div>
                        <div style={{ fontSize:13, color:T.textSecondary, lineHeight:1.8 }}>{selectedProject.notes}</div>
                      </div>
                    )}
                    <LegalNote T={T} />
                  </div>
                  );
                })()}

                {/* â•â•â• SECTION 2 Â· LOCATION DATA â•â•â• */}
                {projDetailTab === "location" && (() => {
                  const tags = locationTags(selectedProject);
                  return (
                  <div>
                    <div style={{ padding:"16px 20px", background:T.surface, border:`1px solid ${T.border}`, borderRadius:14, marginBottom:16 }}>
                      <div style={{ fontSize:10, fontWeight:700, color:T.textMuted, letterSpacing:1, textTransform:"uppercase", marginBottom:10 }}>Location Data Â· Distances Per DLD Filing</div>
                      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(200px, 1fr))", gap:12, marginBottom:14 }}>
                        <div>
                          <div style={{ fontSize:10, color:T.textMuted, marginBottom:4 }}>Emirate</div>
                          <div style={{ fontSize:14, fontWeight:700, color:T.white }}>{selectedProject.emirate || "Dubai"}</div>
                        </div>
                        <div>
                          <div style={{ fontSize:10, color:T.textMuted, marginBottom:4 }}>Area</div>
                          <div style={{ fontSize:14, fontWeight:700, color:T.white }}>{selectedProject.area || selectedProject.community || "â€”"}</div>
                        </div>
                        <div>
                          <div style={{ fontSize:10, color:T.textMuted, marginBottom:4 }}>Sub-Community</div>
                          <div style={{ fontSize:14, fontWeight:700, color:T.textSecondary }}>{selectedProject.subCommunity || "â€”"}</div>
                        </div>
                      </div>
                      {tags.length > 0 && (
                        <div>
                          <div style={{ fontSize:10, color:T.textMuted, marginBottom:8, letterSpacing:0.5 }}>LOCATION CHARACTERISTICS</div>
                          <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                            {tags.map((a,i) => (
                              <span key={i} style={{ fontSize:11, padding:"4px 12px", borderRadius:20, background:`${a.color}15`, color:a.color, fontWeight:700, border:`1px solid ${a.color}30` }}>{a.label}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="chart-box" style={{ padding:18, marginBottom:12 }}>
                      <div style={{ fontSize:12, fontWeight:700, color:T.white, marginBottom:14 }}>Distance to Key Landmarks</div>
                      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(130px,1fr))", gap:10 }}>
                        {[
                          { label:"Nearest Metro", val:selectedProject.distMetro, code:"metro" },
                          { label:"DIFC", val:selectedProject.distDIFC, code:"difc" },
                          { label:"Airport DXB", val:selectedProject.distAirport, code:"airport" },
                          { label:"Beach", val:selectedProject.distBeach, code:"beach" },
                          { label:"Nearest Mall", val:selectedProject.distMall, code:"mall" },
                          { label:"School", val:selectedProject.distSchool, code:"school" },
                          { label:"Hospital", val:selectedProject.distHospital, code:"hospital" },
                        ].map((d,i) => (
                          <div key={i} style={{ padding:"12px 14px", background:T.surfaceAlt, borderRadius:10, border:`1px solid ${T.border}`, textAlign:"center" }}>
                            <div style={{ fontSize:10, color:T.textMuted, marginBottom:6 }}>{d.label}</div>
                            <div style={{ fontFamily:"'Fraunces',serif", fontSize:18, fontWeight:700, color:T.white }}>
                              {d.val != null ? (d.val < 1 ? (d.val*1000).toFixed(0)+"m" : d.val+"km") : "â€”"}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <LegalNote T={T} />
                  </div>
                  );
                })()}

                {/* â•â•â• SECTION 3 Â· SCALE & UNITS â•â•â• */}
                {projDetailTab === "scale" && (() => {
                  const mix = computeUnitMix(selectedProject);
                  return (
                  <div>
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(160px, 1fr))", gap:12, marginBottom:16 }}>
                      {[
                        { label:"Plot Size", value:selectedProject.plotSize || "â€”", sub:"sq ft" },
                        { label:"Built-Up Area", value:selectedProject.builtUpArea || "â€”", sub:"sq ft" },
                        { label:"Total Buildings", value:selectedProject.totalBuildings || "â€”", sub:"per DLD filing" },
                        { label:"Total Units", value:(selectedProject.totalUnits || 0).toLocaleString(), sub:"registered" },
                        { label:"Total Villas", value:(selectedProject.totalVillas || 0).toLocaleString(), sub:"if applicable" },
                        { label:"Total Land Plots", value:(selectedProject.totalLands || 0).toLocaleString(), sub:"if applicable" },
                      ].map((k,i) => (
                        <div key={i} className="kpi-card">
                          <div style={{ fontSize:10, fontWeight:700, color:T.textMuted, letterSpacing:1, textTransform:"uppercase", marginBottom:6 }}>{k.label}</div>
                          <div style={{ fontFamily:"'Fraunces',serif", fontSize:22, fontWeight:800, color:T.white, marginBottom:2 }}>{k.value}</div>
                          <div style={{ fontSize:10, color:T.textMuted }}>{k.sub}</div>
                        </div>
                      ))}
                    </div>
                    {mix && mix.length > 0 && (
                      <div className="chart-box" style={{ padding:20, marginBottom:12 }}>
                        <div style={{ fontSize:12, fontWeight:700, color:T.white, marginBottom:14 }}>Unit Mix Distribution</div>
                        <div style={{ display:"flex", gap:4, height:28, borderRadius:8, overflow:"hidden", marginBottom:12 }}>
                          {mix.map((u,i) => {
                            const colors = [T.gold, T.teal, T.green, "#8B5CF6", "#F59E0B"];
                            return (
                              <div key={i} style={{ width:`${u.pct}%`, background:colors[i % colors.length], display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, fontWeight:700, color:"#000" }}>
                                {u.pct >= 8 ? `${u.type} ${u.pct}%` : ""}
                              </div>
                            );
                          })}
                        </div>
                        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(120px, 1fr))", gap:8 }}>
                          {mix.map((u,i) => (
                            <div key={i} style={{ padding:"8px 10px", background:T.surfaceAlt, borderRadius:8, textAlign:"center" }}>
                              <div style={{ fontSize:10, color:T.gold, fontWeight:700 }}>{u.type}</div>
                              <div style={{ fontSize:13, color:T.white, fontWeight:700 }}>{u.pct}%</div>
                              <div style={{ fontSize:9, color:T.textMuted }}>{u.count} units</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {selectedProject.unitBreakdown?.length > 0 && (
                      <div className="chart-box" style={{ padding:20, marginBottom:12 }}>
                        <div style={{ fontSize:12, fontWeight:700, color:T.white, marginBottom:14 }}>Unit Type â€” Price & PPSF (Developer Disclosed)</div>
                        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(200px, 1fr))", gap:10 }}>
                          {selectedProject.unitBreakdown.map((u,i) => (
                            <div key={i} style={{ padding:"14px 16px", background:T.surfaceAlt, borderRadius:10, border:`1px solid ${T.border}` }}>
                              <div style={{ fontSize:11, fontWeight:700, color:T.gold, marginBottom:8 }}>{u.type}</div>
                              <div style={{ fontSize:11, color:T.textMuted }}>From Price</div>
                              <div style={{ fontSize:16, fontWeight:700, color:T.white, fontFamily:"'Fraunces',serif", marginBottom:6 }}>AED {(u.priceMin/1000000).toFixed(2)}M</div>
                              <div style={{ fontSize:11, color:T.textMuted }}>PPSF</div>
                              <div style={{ fontSize:14, fontWeight:700, color:T.teal }}>AED {(u.ppsf||0).toLocaleString()}/sqft</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <LegalNote T={T} />
                  </div>
                  );
                })()}

                {/* â•â•â• SECTION 4 Â· PRODUCT & AMENITIES â•â•â• */}
                {projDetailTab === "product" && (
                  <div>
                    <div style={{ padding:"14px 20px", background:"rgba(20,184,166,0.05)", border:`1px solid ${T.border}`, borderRadius:10, marginBottom:16 }}>
                      <div style={{ fontSize:11, color:T.teal, fontWeight:700, letterSpacing:0.5 }}>PRODUCT SPECIFICATION Â· DEVELOPER DISCLOSED</div>
                    </div>
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(190px, 1fr))", gap:12, marginBottom:16 }}>
                      <div className="kpi-card">
                        <div style={{ fontSize:10, fontWeight:700, color:T.textMuted, letterSpacing:1, textTransform:"uppercase", marginBottom:8 }}>Branded Residence</div>
                        <div style={{ fontFamily:"'Fraunces',serif", fontSize:18, fontWeight:800, color:selectedProject.branded ? T.gold : T.textSecondary }}>{selectedProject.branded ? (selectedProject.brandPartner || "Yes") : "No"}</div>
                      </div>
                      <div className="kpi-card">
                        <div style={{ fontSize:10, fontWeight:700, color:T.textMuted, letterSpacing:1, textTransform:"uppercase", marginBottom:8 }}>Developer Tier</div>
                        <div style={{ fontFamily:"'Fraunces',serif", fontSize:18, fontWeight:800, color:selectedProject.tier === 1 ? T.green : selectedProject.tier === 2 ? "#F59E0B" : T.textSecondary }}>{selectedProject.tier ? "Tier " + selectedProject.tier : "Not classified"}</div>
                      </div>
                      <div className="kpi-card">
                        <div style={{ fontSize:10, fontWeight:700, color:T.textMuted, letterSpacing:1, textTransform:"uppercase", marginBottom:8 }}>Golden Visa Eligible</div>
                        <div style={{ fontFamily:"'Fraunces',serif", fontSize:18, fontWeight:800, color:(selectedProject.goldenVisa && selectedProject.priceMin >= GOLDEN_VISA_THRESHOLD) ? T.gold : T.textSecondary }}>{(selectedProject.goldenVisa && selectedProject.priceMin >= GOLDEN_VISA_THRESHOLD) ? "Yes" : "No"}</div>
                      </div>
                      <div className="kpi-card">
                        <div style={{ fontSize:10, fontWeight:700, color:T.textMuted, letterSpacing:1, textTransform:"uppercase", marginBottom:8 }}>Total Amenities</div>
                        <div style={{ fontFamily:"'Fraunces',serif", fontSize:22, fontWeight:800, color:T.white }}>{(selectedProject.amenities || []).length}</div>
                      </div>
                    </div>
                    {selectedProject.amenities?.length > 0 && (
                      <div className="chart-box" style={{ padding:18, marginBottom:12 }}>
                        <div style={{ fontSize:11, fontWeight:700, color:T.textMuted, letterSpacing:0.8, textTransform:"uppercase", marginBottom:12 }}>Amenities Listed in Developer Filing</div>
                        <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                          {selectedProject.amenities.map((a,i) => <span key={i} style={{ fontSize:11, padding:"4px 11px", borderRadius:18, background:T.surfaceAlt, border:`1px solid ${T.border}`, color:T.textSecondary }}>{a}</span>)}
                        </div>
                      </div>
                    )}
                    {selectedProject.view?.length > 0 && (
                      <div className="chart-box" style={{ padding:18, marginBottom:12 }}>
                        <div style={{ fontSize:11, fontWeight:700, color:T.textMuted, letterSpacing:0.8, textTransform:"uppercase", marginBottom:12 }}>Views From Units</div>
                        <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                          {selectedProject.view.map((v,i) => <span key={i} style={{ fontSize:11, padding:"4px 12px", borderRadius:18, background:"rgba(212,168,67,0.1)", border:`1px solid rgba(212,168,67,0.25)`, color:T.gold, fontWeight:700 }}>{v}</span>)}
                        </div>
                      </div>
                    )}
                    <LegalNote T={T} />
                  </div>
                )}

                {/* â•â•â• SECTION 5 Â· PRICING DATA â•â•â• */}
                {projDetailTab === "pricing" && (() => {
                  const bench = communityBenchmarkPPSF(selectedProject);
                  return (
                  <div>
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(180px, 1fr))", gap:12, marginBottom:16 }}>
                      <div className="kpi-card">
                        <div style={{ fontSize:10, fontWeight:700, color:T.textMuted, letterSpacing:1, textTransform:"uppercase", marginBottom:8 }}>Starting Price</div>
                        <div style={{ fontFamily:"'Fraunces',serif", fontSize:24, fontWeight:800, color:T.gold }}>{selectedProject.priceMin ? "AED " + (selectedProject.priceMin/1000000).toFixed(2) + "M" : "Not disclosed"}</div>
                        <div style={{ fontSize:10, color:T.textMuted, marginTop:4 }}>Per developer pricing sheet</div>
                      </div>
                      <div className="kpi-card">
                        <div style={{ fontSize:10, fontWeight:700, color:T.textMuted, letterSpacing:1, textTransform:"uppercase", marginBottom:8 }}>Price per Sq.ft</div>
                        <div style={{ fontFamily:"'Fraunces',serif", fontSize:24, fontWeight:800, color:T.white }}>{selectedProject.ppsf ? "AED " + selectedProject.ppsf.toLocaleString() : "â€”"}</div>
                        <div style={{ fontSize:10, color:T.textMuted, marginTop:4 }}>PPSF from listings</div>
                      </div>
                      <div className="kpi-card">
                        <div style={{ fontSize:10, fontWeight:700, color:T.textMuted, letterSpacing:1, textTransform:"uppercase", marginBottom:8 }}>Community Benchmark PPSF</div>
                        <div style={{ fontFamily:"'Fraunces',serif", fontSize:24, fontWeight:800, color:bench.value ? T.teal : T.textMuted }}>{bench.value ? "AED " + bench.value.toLocaleString() : "Pending"}</div>
                        {bench.p25 && bench.p75 && <div style={{ fontSize:10, color:T.textMuted, marginTop:2 }}>Range AED {bench.p25.toLocaleString()}â€“{bench.p75.toLocaleString()}</div>}
                        <div style={{ fontSize:10, color:T.textMuted, marginTop:4 }}>{bench.source}</div>
                      </div>
                      <div className="kpi-card">
                        <div style={{ fontSize:10, fontWeight:700, color:T.textMuted, letterSpacing:1, textTransform:"uppercase", marginBottom:8 }}>Payment Plan</div>
                        <div style={{ fontFamily:"'Fraunces',serif", fontSize:20, fontWeight:800, color:T.gold }}>{selectedProject.paymentPlan || "â€”"}</div>
                        <div style={{ fontSize:10, color:T.textMuted, marginTop:4 }}>During / Post-handover split</div>
                      </div>
                    </div>
                    <div className="chart-box" style={{ padding:20, marginBottom:12 }}>
                      <div style={{ fontSize:12, fontWeight:700, color:T.white, marginBottom:14 }}>Payment Plan Waterfall</div>
                      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12, marginBottom:16 }}>
                        <div>
                          <div style={{ fontSize:10, color:T.textMuted, marginBottom:4 }}>Post-Handover Plan</div>
                          <div style={{ fontSize:18, fontWeight:800, color:selectedProject.postHandover ? T.green : T.textSecondary, fontFamily:"'Fraunces',serif" }}>{selectedProject.postHandover ? "Available" : "Not available"}</div>
                        </div>
                        <div>
                          <div style={{ fontSize:10, color:T.textMuted, marginBottom:4 }}>Escrow Bank</div>
                          <div style={{ fontSize:14, fontWeight:700, color:T.teal }}>{selectedProject.escrowBank || "â€”"}</div>
                        </div>
                        <div>
                          <div style={{ fontSize:10, color:T.textMuted, marginBottom:4 }}>Service Charge</div>
                          <div style={{ fontSize:18, fontWeight:800, color:T.white, fontFamily:"'Fraunces',serif" }}>{selectedProject.serviceCharge ? "AED " + selectedProject.serviceCharge + "/sqft/yr" : "TBC"}</div>
                        </div>
                      </div>
                      {selectedProject.paymentPlan && selectedProject.paymentPlan.includes("/") && !selectedProject.paymentPlan.includes("Cash") && (
                        <div>
                          <div style={{ display:"flex", gap:4, height:32, borderRadius:8, overflow:"hidden", marginBottom:8 }}>
                            <div style={{ width:`${parseInt(selectedProject.paymentPlan.split("/")[0])||60}%`, background:T.gold, display:"flex", alignItems:"center", justifyContent:"center" }}>
                              <span style={{ fontSize:11, fontWeight:700, color:"#000" }}>{parseInt(selectedProject.paymentPlan.split("/")[0])||60}% During Construction</span>
                            </div>
                            <div style={{ width:`${parseInt(selectedProject.paymentPlan.split("/")[1])||40}%`, background:T.teal, display:"flex", alignItems:"center", justifyContent:"center" }}>
                              <span style={{ fontSize:11, fontWeight:700, color:"#fff" }}>{parseInt(selectedProject.paymentPlan.split("/")[1])||40}% At Handover</span>
                            </div>
                          </div>
                          <div style={{ fontSize:11, color:T.textMuted, lineHeight:1.7 }}>
                            Worked example â€” AED {((selectedProject.priceMin||0)/1000000).toFixed(1)}M: Pay AED {((selectedProject.priceMin||0)*(parseInt(selectedProject.paymentPlan.split("/")[0])||60)/100/1000000).toFixed(2)}M during construction, AED {((selectedProject.priceMin||0)*(parseInt(selectedProject.paymentPlan.split("/")[1])||40)/100/1000000).toFixed(2)}M at handover.
                          </div>
                        </div>
                      )}
                    </div>
                    <div style={{ padding:"14px 16px", background:"rgba(212,168,67,0.06)", borderRadius:10, border:`1px solid rgba(212,168,67,0.2)`, marginBottom:12 }}>
                      <div style={{ fontSize:12, color:T.textSecondary, lineHeight:1.8 }}>
                        <strong style={{ color:T.gold }}>DLD Compliance Note:</strong> All off-plan payments must be made to the DLD-registered escrow account ({selectedProject.escrowBank || "TBC"}). RERA registration: {selectedProject.reraNo || selectedProject.projectNumber || "verify with developer"}. Per DLD Law No. 8 of 2007, never pay cash directly to developer.
                      </div>
                    </div>
                    <LegalNote T={T} />
                  </div>
                  );
                })()}

                {/* â•â•â• SECTION 6 Â· RENTAL & YIELD DATA â•â•â• */}
                {projDetailTab === "rental" && (() => {
                  const str = strIndicator(selectedProject);
                  return (
                  <div>
                    <div style={{ padding:"14px 20px", background:"rgba(16,185,129,0.05)", border:`1px solid ${T.border}`, borderRadius:10, marginBottom:16 }}>
                      <div style={{ fontSize:11, color:T.green, fontWeight:700, letterSpacing:0.5 }}>RENTAL DATA Â· PER RERA SMART RENTAL INDEX METHODOLOGY</div>
                    </div>
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(180px, 1fr))", gap:12, marginBottom:16 }}>
                      <div className="kpi-card">
                        <div style={{ fontSize:10, fontWeight:700, color:T.textMuted, letterSpacing:1, textTransform:"uppercase", marginBottom:8 }}>Gross Yield</div>
                        <div style={{ fontFamily:"'Fraunces',serif", fontSize:26, fontWeight:800, color:selectedProject.grossYield >= 7 ? T.green : selectedProject.grossYield >= 5 ? T.gold : T.textSecondary }}>{selectedProject.grossYield ? selectedProject.grossYield.toFixed(1) + "%" : "â€”"}</div>
                        <div style={{ fontSize:10, color:T.textMuted }}>Annual rent Ã· purchase price</div>
                      </div>
                      <div className="kpi-card">
                        <div style={{ fontSize:10, fontWeight:700, color:T.textMuted, letterSpacing:1, textTransform:"uppercase", marginBottom:8 }}>Net Yield</div>
                        <div style={{ fontFamily:"'Fraunces',serif", fontSize:26, fontWeight:800, color:T.teal }}>{selectedProject.netYield ? selectedProject.netYield.toFixed(1) + "%" : "â€”"}</div>
                        <div style={{ fontSize:10, color:T.textMuted }}>After service charges</div>
                      </div>
                      <div className="kpi-card">
                        <div style={{ fontSize:10, fontWeight:700, color:T.textMuted, letterSpacing:1, textTransform:"uppercase", marginBottom:8 }}>Rental Use Class</div>
                        <div style={{ fontFamily:"'Fraunces',serif", fontSize:18, fontWeight:800, color:T.white }}>{str.flag}</div>
                        <div style={{ fontSize:10, color:T.textMuted }}>{str.note}</div>
                      </div>
                      <div className="kpi-card">
                        <div style={{ fontSize:10, fontWeight:700, color:T.textMuted, letterSpacing:1, textTransform:"uppercase", marginBottom:8 }}>Holiday Home Registration</div>
                        <div style={{ fontFamily:"'Fraunces',serif", fontSize:18, fontWeight:800, color:str.flag === "Hotel Apartment" ? T.green : T.textSecondary }}>{str.flag === "Hotel Apartment" ? "Pre-approved" : "Owner Applies"}</div>
                        <div style={{ fontSize:10, color:T.textMuted }}>Per DET licensing</div>
                      </div>
                    </div>
                    <div className="chart-box" style={{ padding:18, marginBottom:12 }}>
                      <div style={{ fontSize:12, fontWeight:700, color:T.white, marginBottom:10 }}>RERA Smart Rental Index Reference</div>
                      <div style={{ fontSize:12, color:T.textSecondary, lineHeight:1.8 }}>
                        The RERA Smart Rental Index is the official tool for all rent increases in Dubai. Rental yields shown are computed from published DLD transaction data and RERA-indexed rental rates. Actual achieved rent depends on unit finishes, floor, view, and market timing. To verify permissible rent for a specific unit, use the official RERA Calculator at <span style={{ color:T.teal }}>dubailand.gov.ae</span> or the Dubai REST app.
                      </div>
                    </div>
                    <LegalNote T={T} />
                  </div>
                  );
                })()}

                {/* â•â•â• SECTION 7 Â· DEVELOPER & COMPLIANCE â•â•â• */}
                {projDetailTab === "developer" && (() => {
                  const esc = escrowStatus(selectedProject);
                  const rera = reraCompliance(selectedProject);
                  return (
                  <div>
                    <div style={{ padding:"18px 20px", background:`linear-gradient(135deg, rgba(212,168,67,0.08), rgba(20,184,166,0.04))`, border:`1px solid ${T.border}`, borderRadius:14, marginBottom:16 }}>
                      <div style={{ fontSize:11, fontWeight:700, color:T.gold, letterSpacing:1, textTransform:"uppercase", marginBottom:10 }}>Developer & Regulatory Compliance</div>
                      <div style={{ fontSize:22, fontWeight:800, color:T.white, fontFamily:"'Fraunces',serif", marginBottom:4 }}>{selectedProject.developer || "â€”"}</div>
                      {selectedProject.tier && <div style={{ fontSize:12, padding:"3px 10px", borderRadius:6, background:selectedProject.tier === 1 ? "rgba(16,185,129,0.15)" : "rgba(245,158,11,0.15)", color:selectedProject.tier === 1 ? T.green : "#F59E0B", fontWeight:700, display:"inline-block" }}>Tier {selectedProject.tier} Developer</div>}
                    </div>
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(200px, 1fr))", gap:12, marginBottom:16 }}>
                      <div className="kpi-card">
                        <div style={{ fontSize:10, fontWeight:700, color:T.textMuted, letterSpacing:1, textTransform:"uppercase", marginBottom:8 }}>RERA Registered</div>
                        <div style={{ fontFamily:"'Fraunces',serif", fontSize:18, fontWeight:800, color:rera.verified ? T.green : T.red }}>{rera.verified ? "Verified" : "Not Found"}</div>
                        <div style={{ fontSize:10, color:T.textMuted }}>{rera.verified ? "#" + rera.number : "Check DLD registry"}</div>
                      </div>
                      <div className="kpi-card">
                        <div style={{ fontSize:10, fontWeight:700, color:T.textMuted, letterSpacing:1, textTransform:"uppercase", marginBottom:8 }}>Escrow Compliance</div>
                        <div style={{ fontFamily:"'Fraunces',serif", fontSize:18, fontWeight:800, color:esc.verified ? T.green : "#F59E0B" }}>{esc.label}</div>
                      </div>
                      <div className="kpi-card">
                        <div style={{ fontSize:10, fontWeight:700, color:T.textMuted, letterSpacing:1, textTransform:"uppercase", marginBottom:8 }}>Escrow Bank</div>
                        <div style={{ fontSize:14, fontWeight:700, color:T.teal }}>{selectedProject.escrowBank || "â€”"}</div>
                      </div>
                      <div className="kpi-card">
                        <div style={{ fontSize:10, fontWeight:700, color:T.textMuted, letterSpacing:1, textTransform:"uppercase", marginBottom:8 }}>DLD Project Status</div>
                        <div style={{ fontSize:14, fontWeight:700, color:T.white }}>{selectedProject.dldStatus || selectedProject.status || "â€”"}</div>
                      </div>
                    </div>
                    <div className="chart-box" style={{ padding:18, marginBottom:12 }}>
                      <div style={{ fontSize:12, fontWeight:700, color:T.white, marginBottom:14 }}>Construction & Delivery Data</div>
                      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(140px, 1fr))", gap:10 }}>
                        <div style={{ padding:"10px 12px", background:T.surfaceAlt, borderRadius:8 }}>
                          <div style={{ fontSize:10, color:T.textMuted, marginBottom:4 }}>Build Progress</div>
                          <div style={{ fontSize:16, fontWeight:700, color:T.white }}>{selectedProject.constructionPct != null ? selectedProject.constructionPct + "%" : "â€”"}</div>
                        </div>
                        <div style={{ padding:"10px 12px", background:T.surfaceAlt, borderRadius:8 }}>
                          <div style={{ fontSize:10, color:T.textMuted, marginBottom:4 }}>Expected Handover</div>
                          <div style={{ fontSize:16, fontWeight:700, color:T.gold }}>{selectedProject.handover || selectedProject.expectedHandover || "â€”"}</div>
                        </div>
                        <div style={{ padding:"10px 12px", background:T.surfaceAlt, borderRadius:8 }}>
                          <div style={{ fontSize:10, color:T.textMuted, marginBottom:4 }}>Contracted Handover</div>
                          <div style={{ fontSize:13, fontWeight:700, color:T.textSecondary }}>{selectedProject.contractedHandover || "â€”"}</div>
                        </div>
                        <div style={{ padding:"10px 12px", background:T.surfaceAlt, borderRadius:8 }}>
                          <div style={{ fontSize:10, color:T.textMuted, marginBottom:4 }}>Actual Handover</div>
                          <div style={{ fontSize:13, fontWeight:700, color:T.textSecondary }}>{selectedProject.actualHandover || "Pending"}</div>
                        </div>
                      </div>
                    </div>
                    <button type="button" onClick={() => { setSelectedProject(null); handleTabChange("Developer Health"); }} style={{ padding:"10px 20px", background:"rgba(212,168,67,0.1)", border:`1px solid ${T.border}`, borderRadius:8, color:T.gold, fontSize:12, cursor:"pointer", fontFamily:"'Outfit',sans-serif", fontWeight:600, marginBottom:12 }}>Full Developer Profile â†’</button>
                    <LegalNote T={T} />
                  </div>
                  );
                })()}

                {/* â•â•â• SECTION 8 Â· FULL REPORT & SHARE â•â•â• */}
                {projDetailTab === "report" && (
                  <div>
                    <div style={{ padding:"14px 20px", background:"rgba(139,92,246,0.05)", border:`1px solid ${T.border}`, borderRadius:10, marginBottom:16 }}>
                      <div style={{ fontSize:11, color:"#A78BFA", fontWeight:700, letterSpacing:0.5 }}>DATA REPORT Â· SHAREABLE SUMMARY</div>
                    </div>
                    <div className="chart-box" style={{ padding:20, marginBottom:16 }}>
                      <div style={{ fontSize:12, fontWeight:700, color:T.white, marginBottom:14 }}>Project Summary (Factual Data)</div>
                      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, fontSize:12, color:T.textSecondary, lineHeight:1.9 }}>
                        <div><strong style={{ color:T.white }}>Project:</strong> {selectedProject.project || selectedProject.name || "â€”"}</div>
                        <div><strong style={{ color:T.white }}>Developer:</strong> {selectedProject.developer || "â€”"}</div>
                        <div><strong style={{ color:T.white }}>Community:</strong> {selectedProject.community || "â€”"}</div>
                        <div><strong style={{ color:T.white }}>Type:</strong> {selectedProject.type || "â€”"}</div>
                        <div><strong style={{ color:T.white }}>Starting Price:</strong> {selectedProject.priceMin ? "AED " + (selectedProject.priceMin/1000000).toFixed(2) + "M" : "TBC"}</div>
                        <div><strong style={{ color:T.white }}>PPSF:</strong> AED {(selectedProject.ppsf || 0).toLocaleString()}</div>
                        <div><strong style={{ color:T.white }}>Gross Yield:</strong> {selectedProject.grossYield ? selectedProject.grossYield + "%" : "â€”"}</div>
                        <div><strong style={{ color:T.white }}>Payment Plan:</strong> {selectedProject.paymentPlan || "TBC"}</div>
                        <div><strong style={{ color:T.white }}>Handover:</strong> {selectedProject.handover || "TBC"}</div>
                        <div><strong style={{ color:T.white }}>RERA #:</strong> {selectedProject.reraNo || selectedProject.projectNumber || "Pending"}</div>
                        <div><strong style={{ color:T.white }}>Escrow:</strong> {selectedProject.escrowBank || "â€”"}</div>
                        <div><strong style={{ color:T.white }}>Build Progress:</strong> {selectedProject.constructionPct != null ? selectedProject.constructionPct + "%" : "â€”"}</div>
                      </div>
                    </div>
                    {(() => {
                      const units = selectedProject.unitBreakdown?.map(u => `  â€¢ ${u.type}: AED ${(u.ppsf||0).toLocaleString()}/sqft | From AED ${(u.priceMin/1000000).toFixed(2)}M`).join("\n") || "";
                      const origin = (typeof window !== "undefined" && window.location && window.location.origin) ? window.location.origin : "https://emaar-dashboard.vercel.app";
                      const projectUrl = `${origin}/project/${encodeURIComponent(selectedProject.id || "")}`;
                      const txt = [
                        "ðŸ™ï¸ DXB ANALYTICS â€” PROPERTY DATA REPORT",
                        "â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”",
                        `ðŸ“Œ ${selectedProject.project || selectedProject.name}`,
                        `ðŸ¢ Developer: ${selectedProject.developer}`,
                        `ðŸ“ Community: ${selectedProject.community}`,
                        `ðŸ  Type: ${selectedProject.type}`,
                        "",
                        "ðŸ’° PRICING",
                        `   Starting: AED ${((selectedProject.priceMin||0)/1000000).toFixed(2)}M`,
                        `   PPSF: AED ${(selectedProject.ppsf||0).toLocaleString()}`,
                        units ? `\nðŸ“ UNIT BREAKDOWN\n${units}` : "",
                        "",
                        "ðŸ“Š RENTAL DATA",
                        `   Gross Yield: ${selectedProject.grossYield||"â€”"}%`,
                        `   Payment Plan: ${selectedProject.paymentPlan||"TBC"}`,
                        `   Handover: ${selectedProject.handover||"TBC"}`,
                        "",
                        `ðŸ” RERA: ${selectedProject.reraNo||selectedProject.projectNumber||"TBC"} | Escrow: ${selectedProject.escrowBank||"TBC"}`,
                        "",
                        `ðŸ”— Full report: ${projectUrl}`,
                        "â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”",
                        "Data Source: Dubai Land Department (DLD) public records",
                        "Informational only â€” not investment advice",
                        "For regulated advice contact a RERA-licensed consultant",
                      ].filter(line => line !== "").join("\n");
                      const emailSubject = `Property Data Report â€” ${selectedProject.project || selectedProject.name}`;
                      const btnStyle = (color) => ({ padding:"10px 18px", background:`rgba(${color},0.1)`, border:`1px solid rgba(${color},0.3)`, borderRadius:8, color:`rgb(${color})`, fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"'Outfit',sans-serif", display:"inline-flex", alignItems:"center", gap:6 });
                      return (
                        <div className="chart-box" style={{ padding:18, marginBottom:12 }}>
                          <div style={{ fontSize:11, fontWeight:700, color:T.textMuted, letterSpacing:0.8, textTransform:"uppercase", marginBottom:12 }}>Share This Data Report</div>
                          <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                            <button type="button" onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(txt)}`,"_blank")} style={btnStyle("37,211,102")}>ðŸ“± WhatsApp</button>
                            <button type="button" onClick={() => window.open(`mailto:?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(txt)}`,"_blank")} style={btnStyle("59,130,246")}>âœ‰ï¸ Email</button>
                            <button type="button" onClick={async () => {
                              try {
                                await navigator.clipboard.writeText(projectUrl);
                                const el = document.activeElement;
                                const original = el && el.textContent;
                                if (el && el.textContent != null) { el.textContent = "âœ“ Copied!"; setTimeout(() => { if (el && original) el.textContent = original; }, 1500); }
                              } catch {}
                            }} style={btnStyle("212,168,67")}>ðŸ”— Copy Link</button>
                            <button type="button" onClick={() => { setSelectedProject(null); handleTabChange("Mortgage"); }} style={{ padding:"10px 18px", background:T.surfaceAlt, border:`1px solid ${T.border}`, borderRadius:8, color:T.textSecondary, fontSize:12, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>Mortgage Calculator</button>
                            <button type="button" onClick={() => { setSelectedProject(null); handleTabChange("My Leads"); }} style={{ padding:"10px 18px", background:T.surfaceAlt, border:`1px solid ${T.border}`, borderRadius:8, color:T.textSecondary, fontSize:12, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>Add to Leads</button>
                          </div>
                        </div>
                      );
                    })()}
                    <LegalNote T={T} />
                  </div>
                )}
              </div>
            </div>
          
      , document.body)}
    </>
  );
}

export default ProjectsTab;
