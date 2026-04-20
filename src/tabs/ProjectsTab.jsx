/* eslint-disable */
/* PROJECTS TAB — Master catalog of all Dubai property projects
   Includes detail modal (rendered via React Portal for safety)
*/

import React, { useState, useMemo, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { createPortal } from "react-dom";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { T } from "../data";
import SmartEmptyState from "../components/SmartEmptyState";
import { SvgIcons } from "../components/Icons";

import { calcScore, scoreColor, scoreLabel } from "../utils/scoring";
import { GOLDEN_VISA_THRESHOLD } from "../utils/constants";

const MODES = [
  { key:"All", label:"All Types" },
  { key:"Apartment" }, { key:"Villa" }, { key:"Townhouse" },
  { key:"Hotel Apartment" }, { key:"Office" }, { key:"Retail" },
  { key:"Warehouse" }, { key:"Land" },
];

/* ═══════════════════════════════════════════════════════════════════════
   DXB ANALYTICS — DATA PLATFORM LAYER
   ─────────────────────────────────────────────────────────────────────────
   Legal positioning: This is a DATA AGGREGATION platform, not advice.
   All data displayed is sourced from Dubai Land Department (DLD) records.
   No investment recommendations. No BUY/SELL verdicts.
   For advice, users must consult RERA-licensed consultants.
   ─────────────────────────────────────────────────────────────────────── */

/* Asset class — descriptive segmentation (like MLS tiers), not a score */
function describeAssetClass(p) {
  const ppsf = p.ppsf || 0;
  if (ppsf >= 3000) return { tier:"Ultra-Luxury Segment", color:"#D4A843" };
  if (ppsf >= 2000) return { tier:"Luxury Segment", color:"#F59E0B" };
  if (ppsf >= 1400) return { tier:"Premium Segment", color:"#14B8A6" };
  if (ppsf >= 900) return { tier:"Mid-Market Segment", color:"#10B981" };
  if (ppsf > 0) return { tier:"Affordable Segment", color:"#6B7280" };
  return { tier:"Segment Not Disclosed", color:"#6B7280" };
}

/* Construction stage — descriptive only, from DLD data */
function describeMarketStatus(p) {
  const pct = p.constructionPct || 0;
  if (p.status === "Sold Out") return { label:"Sold Out (per DLD)", color:"#EF4444" };
  if (p.lifecycleStage === "launching" || p.lifecycleStage === "announced") return { label:"Recently Launched", color:"#10B981" };
  if (pct >= 100 || p.status === "Ready") return { label:"Delivered", color:"#14B8A6" };
  if (pct >= 70) return { label:"Near Completion", color:"#F59E0B" };
  if (pct > 0) return { label:"Under Construction", color:"#8B5CF6" };
  return { label:"Off-Plan", color:"#6B7280" };
}

/* Location advantages — factual tags based on measurable distances */
function locationTags(p) {
  const out = [];
  if (p.distBeach != null && p.distBeach <= 1) out.push({ label:"Waterfront (<1km)", color:"#14B8A6" });
  if (p.distMetro != null && p.distMetro <= 0.8) out.push({ label:"Metro Walking Distance", color:"#10B981" });
  if (p.distDIFC != null && p.distDIFC <= 5) out.push({ label:"DIFC Proximity (<5km)", color:"#F59E0B" });
  if (p.distMall != null && p.distMall <= 1.5) out.push({ label:"Retail Access (<1.5km)", color:"#8B5CF6" });
  return out;
}

/* Unit mix percentages — derived from actual unit breakdown data */
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

/* Community average PPSF — prefers DLD-computed median over legacy field */
function communityBenchmarkPPSF(p) {
  if (p.communityMedianPPSF) {
    return {
      value: p.communityMedianPPSF,
      p25: p.communityP25PPSF,
      p75: p.communityP75PPSF,
      source: `DLD · ${p.communityTxCount?.toLocaleString() || "N"} transactions · ${p.communityBenchmarkSource || "Recent"}`,
    };
  }
  if (p.communityAvgPPSF) return { value: p.communityAvgPPSF, source:"Legacy estimate" };
  return { value: null, source:"Not available — DLD benchmark pending" };
}

/* STR indicator — factual flag only (not a score) */
function strIndicator(p) {
  const t = (p.type || "").toLowerCase();
  if (t.includes("hotel")) return { flag:"Hotel Apartment", note:"Designated for short-term rental per developer licensing" };
  if (p.distBeach != null && p.distBeach <= 2) return { flag:"Tourist Zone", note:"Beach-adjacent micro-location" };
  if (/marina|downtown|creek|palm|blue ?waters/i.test(p.community || "")) return { flag:"Tourist District", note:"Historically high STR demand" };
  return { flag:"Residential Primary", note:"Area zoned primarily for long-term residence" };
}

/* Escrow status — factual DLD data */
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

/* ═══════════════════════════════════════════════════════════════════════
   LEGAL DISCLAIMER — reusable component
   ─────────────────────────────────────────────────────────────────────── */
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

  // Find developer by id/name to resolve its communities array
  const gfDeveloperRecord = gfDev
    ? (allDevelopers || []).find(d =>
        String(d.id || "").toLowerCase() === gfDev ||
        String(d.name || "").toLowerCase() === gfDev ||
        String(d.name || "").toLowerCase().includes(gfDev)
      )
    : null;
  const gfDeveloperName = gfDeveloperRecord?.name || null;
  const gfDeveloperCommunities = (gfDeveloperRecord && Array.isArray(gfDeveloperRecord.communities))
    ? new Set(gfDeveloperRecord.communities.map(c => String(c).toLowerCase()))
    : null;

  /** Returns true if project passes the global filter (or if no global
      filter is active) */
  const projMatchesGlobalFilter = (p) => {
    if (!p) return false;

    // Developer filter: match on developer name OR the project's community
    // being in the developer's communities list
    if (gfDev) {
      const projDev = String(p.developer || "").toLowerCase();
      const projCommunity = String(p.community || "").toLowerCase();
      const developerNameMatches = gfDeveloperName && projDev === String(gfDeveloperName).toLowerCase();
      const communityBelongsToDeveloper = gfDeveloperCommunities && gfDeveloperCommunities.has(projCommunity);
      if (!developerNameMatches && !communityBelongsToDeveloper) return false;
    }

    // Community filter
    if (gfCommunity) {
      if (String(p.community || "").toLowerCase() !== gfCommunity) return false;
    }

    // Status filter (e.g. "offplan", "ready")
    if (gfStatus) {
      const ps = String(p.status || "").toLowerCase().replace(/[-\s]/g, "_");
      const gs = gfStatus.replace(/[-\s]/g, "_");
      if (ps !== gs) return false;
    }

    // Beds filter (e.g. "1 BR", "2 BR")
    if (gfBeds) {
      const beds = Array.isArray(p.beds) ? p.beds : (p.beds ? [p.beds] : []);
      if (!beds.some(b => String(b).toLowerCase() === gfBeds)) return false;
    }

    // Price range — project priceMin must be >= global priceMin,
    // project priceMax must be <= global priceMax (when set)
    if (gfPriceMin > 0 && Number(p.priceMin || 0) < gfPriceMin) return false;
    if (gfPriceMax > 0 && Number(p.priceMax || p.priceMin || 0) > gfPriceMax) return false;

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

            /* Phase 4: merge all data sources — SEED (18 Verified) + DLD developments (2,798 Registry) + extras.
               Guard every spread with Array.isArray to prevent 'not iterable' crashes when props
               arrive as undefined/null (Firestore still loading). */
            const allSources = [
              ...(Array.isArray(SEED_PROJECTS) ? SEED_PROJECTS : []),
              ...(Array.isArray(developments) ? developments : []),
              ...(Array.isArray(liveProjects) ? liveProjects : []),
              ...(Array.isArray(extraProjects) ? extraProjects : []),
            ];
            /* De-dupe by id — live version wins over seed if same id */
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
              return "Apartment"; /* default — most DLD records are unit/flat = apartment */
            };

            const filtered = rawProjects.filter(p => {
              // Global top-bar filters first
              if (!projMatchesGlobalFilter(p)) return false;
              // Type filter — but skip when 'All' is selected
              if (projMode !== "All" && normalizeType(p) !== projMode) return false;
              if (projSearch && !JSON.stringify(p).toLowerCase().includes(projSearch.toLowerCase())) return false;
              if (projDev !== "All" && p.developer !== projDev && p.developerName !== projDev) return false;
              if (projCommunity !== "All" && p.community !== projCommunity) return false;
              if (projStatus !== "All" && p.status !== projStatus) return false;
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
              /* Default 'relevance' — interleave: Research (enriched data) first, DLD second, within each group by score/data completeness */
              const aIsDld = String(a.id || "").startsWith("dld-") || a.dldSource;
              const bIsDld = String(b.id || "").startsWith("dld-") || b.dldSource;
              if (aIsDld !== bIsDld) return aIsDld ? 1 : -1; /* Research first */
              return calcScore(b) - calcScore(a);
            });

            const avgYield = filtered.length > 0 && filtered.some(p => p.grossYield > 0)
              ? (filtered.filter(p=>p.grossYield>0).reduce((a,p) => a + p.grossYield, 0) / filtered.filter(p=>p.grossYield>0).length).toFixed(1) : "—";
            const avgPpsf = filtered.length > 0 && filtered.some(p=>p.ppsf)
              ? Math.round(filtered.filter(p=>p.ppsf).reduce((a,p) => a + p.ppsf, 0) / filtered.filter(p=>p.ppsf).length) : 0;

            const devOptions = ["All", ...new Set(rawProjects.filter(p => projMode === "All" || normalizeType(p)===projMode).map(p=>p.developer || p.developerName).filter(Boolean))].slice(0, 500);
            const commOptions = ["All", ...new Set(rawProjects.filter(p => projMode === "All" || normalizeType(p)===projMode).map(p=>p.community).filter(Boolean))].slice(0, 500);

            const selSt = {
              background: T.surfaceAlt, border: `1px solid ${T.border}`,
              borderRadius: 8, color: T.white, fontFamily:"'Outfit',sans-serif",
              fontSize: 12, padding:"7px 28px 7px 10px", outline:"none", cursor:"pointer",
              appearance:"none", WebkitAppearance:"none",
              backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
              backgroundRepeat:"no-repeat", backgroundPosition:"right 8px center",
            };

            const StatusBadge = ({ status }) => {
              const cfg = { "Off-Plan":{ bg:"rgba(212,168,67,0.15)", color:T.gold }, "Ready":{ bg:"rgba(16,185,129,0.15)", color:T.green }, "Sold Out":{ bg:"rgba(255,255,255,0.08)", color:T.textMuted } }[status] || { bg:"rgba(212,168,67,0.1)", color:T.gold };
              return <span style={{ fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:10, background:cfg.bg, color:cfg.color }}>{status}</span>;
            };

            /* DataCompletenessBadge — shows factual data completeness, NOT investment advice.
               Replaces the old ScoreCircle/scoreLabel which said "Strong Buy/Buy/Hold" =
               unlicensed investment advice under RERA law. */
            const DataCompletenessBadge = ({ p }) => {
              const isDld = String(p.id || "").startsWith("dld-") || p.dldSource;
              if (isDld) {
                return (
                  <div style={{ width:52, height:52, borderRadius:"50%", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", border:`2px solid ${T.teal}`, background:"rgba(20,184,166,0.15)", flexShrink:0 }}>
                    <span style={{ fontSize:16, color:T.teal, lineHeight:1 }}>✓</span>
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

            /* Helper — detect fake/placeholder RERA numbers and suppress display */
            const isValidReraNumber = (num) => {
              if (!num) return false;
              const s = String(num).trim();
              /* Real RERA project numbers are typically 3-5 digits */
              /* Fake patterns: "0991234567", "0773456789", "1234", "5678" (sequential placeholders) */
              if (s.length > 6) return false; /* over 6 digits = likely fake */
              if (/^(\d)\1+$/.test(s)) return false; /* repeating digits */
              if (/^1234|5678|0000|9999/.test(s)) return false; /* common placeholder patterns */
              return /^\d{3,6}$/.test(s); /* must be 3-6 digit number */
            };

            const ProjectCard = ({ p }) => {
              const score = calcScore(p);
              const inCompare = Array.isArray(projCompare) && projCompare.some(c => c.id === p.id);
              const isDldVerified = String(p.id || "").startsWith("dld-") || p.dldSource;
              return (
                <div className="chart-box" style={{ padding:0, overflow:"hidden", cursor:"pointer", position:"relative" }}
                  onMouseEnter={e => e.currentTarget.style.borderColor="rgba(212,168,67,0.4)"}
                  onMouseLeave={e => e.currentTarget.style.borderColor=T.border}>
                  {/* DATA SOURCE BADGE — top-right corner */}
                  <div style={{ position:"absolute", top:10, right:10, zIndex:2 }}>
                    {isDldVerified ? (
                      <span style={{ fontSize:9, padding:"3px 8px", borderRadius:5, background:"rgba(20,184,166,0.12)", color:T.teal, fontWeight:700, border:`1px solid rgba(20,184,166,0.3)`, display:"inline-flex", alignItems:"center", gap:4 }}>
                        ✓ DLD Verified
                      </span>
                    ) : (
                      <span style={{ fontSize:9, padding:"3px 8px", borderRadius:5, background:"rgba(212,168,67,0.08)", color:T.gold, fontWeight:700, border:`1px solid rgba(212,168,67,0.2)`, display:"inline-flex", alignItems:"center", gap:4 }}>
                        ◆ Research
                      </span>
                    )}
                  </div>
                  <div style={{ padding:"14px 16px", borderBottom:`1px solid ${T.border}` }} onClick={() => { setSelectedProject(p); setProjDetailTab("identity"); }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
                      <div style={{ flex:1, paddingRight:70 /* room for DLD Verified badge */ }}>
                        <div style={{ fontSize:10, fontWeight:700, color:T.textMuted, letterSpacing:0.8, textTransform:"uppercase", marginBottom:3 }}>{(p.developer || p.developerName || "Unknown")}{"·"}{p.community || p.area || "—"}</div>
                        <div style={{ fontFamily:"'Fraunces',serif", fontSize:15, fontWeight:700, color:T.white, marginBottom:6 }}>{p.project || p.name || "—"}</div>
                        <div style={{ display:"flex", gap:6, flexWrap:"wrap", alignItems:"center" }}>
                          <StatusBadge status={p.status || (p.constructionPct >= 100 ? "Ready" : "Off-Plan")} />
                          {(p.handover || p.expectedHandover) && <span style={{ fontSize:10, color:T.textMuted }}>{p.handover || p.expectedHandover}</span>}
                          {Array.isArray(p.beds) && p.beds.length > 0 && <span style={{ fontSize:10, color:T.textMuted }}>{"·"}{p.beds.join(" / ")}</span>}
                          {isValidReraNumber(p.reraNo || p.projectNumber) && <span style={{ fontSize:9, color:T.teal }}>{"·"}RERA #{p.reraNo || p.projectNumber}</span>}
                        </div>
                        {/* Factual classification badges only — no investment advice */}
                        <div style={{ display:"flex", gap:5, flexWrap:"wrap", marginTop:6 }}>
                          {p.tier === 1 && <span style={{ fontSize:9, padding:"2px 7px", borderRadius:5, background:"rgba(16,185,129,0.12)", color:"#10B981", fontWeight:700 }}>Tier 1 Developer</span>}
                          {p.tier === 2 && <span style={{ fontSize:9, padding:"2px 7px", borderRadius:5, background:"rgba(245,158,11,0.12)", color:"#F59E0B", fontWeight:700 }}>Tier 2 Developer</span>}
                          {p.goldenVisa && p.priceMin >= GOLDEN_VISA_THRESHOLD && <span style={{ fontSize:9, padding:"2px 7px", borderRadius:5, background:"rgba(212,168,67,0.15)", color:T.gold, fontWeight:700 }}>★ Golden Visa Eligible</span>}
                          {p.branded && <span style={{ fontSize:9, padding:"2px 7px", borderRadius:5, background:"rgba(139,92,246,0.15)", color:"#A78BFA", fontWeight:700 }}>◆ {p.brandPartner || "Branded"}</span>}
                          {p.escrowBank && <span style={{ fontSize:9, padding:"2px 7px", borderRadius:5, background:"rgba(20,184,166,0.08)", color:T.teal, fontWeight:700 }}>Escrow ✓</span>}
                        </div>
                      </div>
                      <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:4 }}>
                        <DataCompletenessBadge p={p} />
                      </div>
                    </div>
                  </div>
                  <div style={{ padding:"12px 16px", borderBottom:`1px solid ${T.border}` }} onClick={() => { setSelectedProject(p); setProjDetailTab("identity"); }}>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:8, marginBottom:10 }}>
                      <div>
                        <div style={{ fontSize:9, color:T.textMuted, textTransform:"uppercase", letterSpacing:0.6, marginBottom:2 }}>From</div>
                        <div style={{ fontSize:13, fontWeight:700, color:p.priceMin ? T.white : T.textMuted }}>{p.priceMin ? "AED " + (p.priceMin/1000000).toFixed(1) + "M" : "Inquire"}</div>
                      </div>
                      <div>
                        <div style={{ fontSize:9, color:T.textMuted, textTransform:"uppercase", letterSpacing:0.6, marginBottom:2 }}>PPSF</div>
                        <div style={{ fontSize:13, fontWeight:700, color:p.ppsf ? T.white : T.textMuted }}>{p.ppsf ? "AED " + p.ppsf.toLocaleString() : "—"}</div>
                      </div>
                      <div>
                        <div style={{ fontSize:9, color:T.textMuted, textTransform:"uppercase", letterSpacing:0.6, marginBottom:2 }}>Yield</div>
                        <div style={{ fontSize:13, fontWeight:700, color:p.grossYield >= 7 ? T.green : p.grossYield >= 5 ? T.gold : T.textMuted }}>{p.grossYield ? p.grossYield.toFixed(1) + "%" : "—"}</div>
                      </div>
                      <div>
                        <div style={{ fontSize:9, color:T.textMuted, textTransform:"uppercase", letterSpacing:0.6, marginBottom:2 }}>Units</div>
                        <div style={{ fontSize:13, fontWeight:700, color:T.white }}>{p.totalUnits ? p.totalUnits.toLocaleString() : (p.paymentPlan || "—")}</div>
                      </div>
                    </div>
                    {/* Unit mini-breakdown on card */}
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
                    <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                      {p.distMetro !== undefined && <span style={{ fontSize:10, padding:"2px 7px", borderRadius:8, background:p.distMetro <= 0.8 ? "rgba(16,185,129,0.15)" : T.surfaceAlt, color:p.distMetro <= 0.8 ? T.green : T.textMuted }}>Metro {p.distMetro <= 0.8 ? "≤800m" : p.distMetro + "km"}</span>}
                      {p.distBeach !== undefined && p.distBeach <= 2 && <span style={{ fontSize:10, padding:"2px 7px", borderRadius:8, background:"rgba(20,184,166,0.12)", color:T.teal }}>Beach {p.distBeach < 1 ? (p.distBeach*1000).toFixed(0)+"m" : p.distBeach+"km"}</span>}
                      {p.distDIFC !== undefined && <span style={{ fontSize:10, padding:"2px 7px", borderRadius:8, background:T.surfaceAlt, color:T.textMuted }}>DIFC {p.distDIFC}km</span>}
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
                    <button type="button" onClick={() => handleTabChange("Investment Score")} style={{ padding:"5px 10px", background:"rgba(212,168,67,0.08)", border:`1px solid ${T.border}`, borderRadius:7, color:T.gold, fontSize:10, fontWeight:700, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>ROI →</button>
                    <button type="button" onClick={() => handleTabChange("Mortgage")} style={{ padding:"5px 10px", background:T.surfaceAlt, border:`1px solid ${T.border}`, borderRadius:7, color:T.textSecondary, fontSize:10, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>Mortgage</button>
                    {p.status === "Off-Plan" && <button type="button" onClick={() => handleTabChange("Launch Calendar")} style={{ padding:"5px 10px", background:"rgba(212,168,67,0.08)", border:`1px solid ${T.gold}`, borderRadius:7, color:T.gold, fontSize:10, fontWeight:700, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>View Launch →</button>}
                    <button type="button" onClick={() => setProjCompare(prev => inCompare ? prev.filter(c=>c.id!==p.id) : prev.length < 3 ? [...prev,p] : prev)} style={{ padding:"5px 10px", background:inCompare?"rgba(16,185,129,0.12)":T.surfaceAlt, border:`1px solid ${inCompare?T.green:T.border}`, borderRadius:7, color:inCompare?T.green:T.textSecondary, fontSize:10, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>{inCompare?"✓ Compare":"+ Compare"}</button>
                    <button type="button" onClick={() => handleTabChange("My Leads")} style={{ padding:"5px 10px", background:T.surfaceAlt, border:`1px solid ${T.border}`, borderRadius:7, color:T.textSecondary, fontSize:10, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>Add Lead</button>
                    <button type="button" onClick={() => { setSelectedProject(p); setProjDetailTab("identity"); }} style={{ padding:"5px 10px", background:T.surfaceAlt, border:`1px solid ${T.border}`, borderRadius:7, color:T.textSecondary, fontSize:10, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>Details →</button>
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
                    <div style={{ fontSize:11, color:T.textMuted, marginTop:3 }}>All Dubai property types · Investment intelligence · Full project data</div>
                  </div>
                  <div style={{ display:"flex", gap:8 }}>
                  </div>
                </div>

                {/* ═══ MODE / TYPE TABS — Primary filter, always visible ═══ */}
                <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:14, padding:"10px 14px", background:T.surface, border:`1px solid ${T.border}`, borderRadius:10 }}>
                  <span style={{ fontSize:10, fontWeight:700, color:T.textMuted, letterSpacing:0.8, textTransform:"uppercase", alignSelf:"center", marginRight:4 }}>Property Type:</span>
                  {MODES.map(m => (
                    <button key={m.key} type="button" onClick={() => { setProjMode(m.key); setProjBeds("All"); setProjDev("All"); setProjCommunity("All"); setProjSearch(""); }}
                      style={{ padding:"6px 14px", background:projMode===m.key?"rgba(212,168,67,0.15)":T.surfaceAlt, border:`1px solid ${projMode===m.key?"rgba(212,168,67,0.5)":T.border}`, borderRadius:20, color:projMode===m.key?T.gold:T.textSecondary, fontSize:12, fontWeight:projMode===m.key?700:400, cursor:"pointer", fontFamily:"'Outfit',sans-serif", transition:"all 0.15s" }}>
                      {m.label || m.key}
                    </button>
                  ))}
                </div>

                {/* ═══ SEARCH + FILTER TOGGLE BAR — world-class minimalist ═══ */}
                {(() => {
                  const activeFilters = [];
                  if (projDev !== "All") activeFilters.push({ key:"dev", label:`Developer: ${projDev}`, clear:() => setProjDev("All") });
                  if (projCommunity !== "All") activeFilters.push({ key:"com", label:`Community: ${projCommunity}`, clear:() => setProjCommunity("All") });
                  if (projStatus !== "All") activeFilters.push({ key:"sts", label:`Status: ${projStatus}`, clear:() => setProjStatus("All") });
                  if (projBeds !== "All") activeFilters.push({ key:"bed", label:`Beds: ${projBeds}`, clear:() => setProjBeds("All") });
                  if (projHandover !== "All") activeFilters.push({ key:"hnd", label:`Handover: ${projHandover}`, clear:() => setProjHandover("All") });
                  if (projGrade !== "All") activeFilters.push({ key:"grd", label:`Grade: ${projGrade}`, clear:() => setProjGrade("All") });
                  if (projIntelFilter !== "all") activeFilters.push({ key:"int", label:projIntelFilter === "tier1" ? "Tier 1 Only" : projIntelFilter === "gv" ? "Golden Visa" : projIntelFilter === "branded" ? "Branded Residences" : projIntelFilter, clear:() => setProjIntelFilter("all") });
                  const anyActive = activeFilters.length > 0 || projSearch;
                  return (
                <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:"10px 14px", marginBottom:14 }}>
                  <div style={{ display:"flex", gap:10, alignItems:"center", flexWrap:"wrap" }}>
                    {/* SEARCH — primary input, always visible */}
                    <div style={{ position:"relative", flex:"1 1 260px", minWidth:220 }}>
                      {SvgIcons.Search({ width:14, height:14, style:{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", color:T.textMuted, pointerEvents:"none" } })}
                      <input value={projSearch} onChange={e => setProjSearch(e.target.value)} placeholder="Search project, developer, or community..." style={{ background:T.surfaceAlt, border:`1px solid ${T.border}`, borderRadius:8, color:T.white, fontFamily:"'Outfit',sans-serif", fontSize:13, padding:"9px 12px 9px 36px", outline:"none", width:"100%" }} />
                    </div>

                    {/* SORT dropdown */}
                    <select value={projSort} onChange={e => setProjSort(e.target.value)} style={selSt} title="Sort order">
                      <option value="score">↓ Relevance</option>
                      <option value="yield">↓ Yield High</option>
                      <option value="price_asc">↑ Price Low to High</option>
                      <option value="price_desc">↓ Price High to Low</option>
                      <option value="alphabetical">A–Z Name</option>
                      <option value="recent">↓ Recently Launched</option>
                    </select>

                    {/* FILTERS toggle button */}
                    <button type="button" onClick={() => setProjView(projView === "filters-open" ? "grid" : "filters-open")}
                      style={{ padding:"9px 14px", background:projView === "filters-open" ? "rgba(212,168,67,0.15)" : T.surfaceAlt, border:`1px solid ${projView === "filters-open" ? "rgba(212,168,67,0.4)" : T.border}`, borderRadius:8, color:projView === "filters-open" ? T.gold : T.textSecondary, fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"'Outfit',sans-serif", display:"flex", alignItems:"center", gap:6, whiteSpace:"nowrap" }}>
                      <span>⚙ Filters</span>
                      {activeFilters.length > 0 && <span style={{ background:T.gold, color:"#000", padding:"1px 6px", borderRadius:10, fontSize:10, fontWeight:800 }}>{activeFilters.length}</span>}
                    </button>

                    {/* VIEW toggle */}
                    <div style={{ display:"flex", gap:4, background:T.surfaceAlt, border:`1px solid ${T.border}`, borderRadius:8, padding:2 }}>
                      {[{k:"grid",icon:"▦"},{k:"list",icon:"☰"}].map(v => (
                        <button key={v.k} type="button" onClick={() => setProjView(v.k)} style={{ padding:"5px 10px", background:projView===v.k?"rgba(212,168,67,0.15)":"none", border:"none", borderRadius:6, color:projView===v.k?T.gold:T.textMuted, fontSize:13, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>{v.icon}</button>
                      ))}
                    </div>

                    {/* RESULT COUNT */}
                    <span style={{ fontSize:12, color:T.textMuted, marginLeft:"auto", fontWeight:600 }}>
                      <span style={{ color:T.gold, fontWeight:800 }}>{filtered.length.toLocaleString()}</span> of {rawProjects.length.toLocaleString()} projects
                    </span>
                  </div>

                  {/* ACTIVE FILTER CHIPS */}
                  {anyActive && (
                    <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginTop:10, paddingTop:10, borderTop:`1px solid ${T.border}`, alignItems:"center" }}>
                      <span style={{ fontSize:10, color:T.textMuted, fontWeight:700, letterSpacing:0.5, textTransform:"uppercase" }}>Active:</span>
                      {projSearch && (
                        <span style={{ fontSize:11, padding:"3px 10px", borderRadius:14, background:"rgba(20,184,166,0.1)", color:T.teal, border:`1px solid rgba(20,184,166,0.25)`, display:"flex", alignItems:"center", gap:6 }}>
                          Search: "{projSearch}"
                          <button type="button" onClick={() => setProjSearch("")} style={{ background:"none", border:"none", color:T.teal, cursor:"pointer", fontSize:14, padding:0, lineHeight:1 }}>×</button>
                        </span>
                      )}
                      {activeFilters.map(f => (
                        <span key={f.key} style={{ fontSize:11, padding:"3px 10px", borderRadius:14, background:"rgba(212,168,67,0.1)", color:T.gold, border:`1px solid rgba(212,168,67,0.25)`, display:"flex", alignItems:"center", gap:6 }}>
                          {f.label}
                          <button type="button" onClick={f.clear} style={{ background:"none", border:"none", color:T.gold, cursor:"pointer", fontSize:14, padding:0, lineHeight:1 }}>×</button>
                        </span>
                      ))}
                      <button type="button" onClick={() => { setProjSearch(""); setProjDev("All"); setProjCommunity("All"); setProjStatus("All"); setProjBeds("All"); setProjHandover("All"); setProjGrade("All"); setProjIntelFilter("all"); }}
                        style={{ background:"none", border:`1px solid ${T.border}`, borderRadius:12, padding:"3px 10px", color:T.textMuted, fontSize:11, cursor:"pointer", fontFamily:"'Outfit',sans-serif", marginLeft:4 }}>Clear all</button>
                    </div>
                  )}

                  {/* EXPANDED FILTER PANEL — shows when Filters button toggled */}
                  {projView === "filters-open" && (
                    <div style={{ marginTop:12, paddingTop:12, borderTop:`1px solid ${T.border}`, display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(180px, 1fr))", gap:10 }}>
                      <div>
                        <label style={{ fontSize:10, color:T.textMuted, fontWeight:700, letterSpacing:0.5, textTransform:"uppercase", marginBottom:4, display:"block" }}>Developer</label>
                        <select value={projDev} onChange={e => setProjDev(e.target.value)} style={{ ...selSt, width:"100%" }}>{devOptions.map(d => <option key={d}>{d}</option>)}</select>
                      </div>
                      <div>
                        <label style={{ fontSize:10, color:T.textMuted, fontWeight:700, letterSpacing:0.5, textTransform:"uppercase", marginBottom:4, display:"block" }}>Community</label>
                        <select value={projCommunity} onChange={e => setProjCommunity(e.target.value)} style={{ ...selSt, width:"100%" }}>{commOptions.map(c => <option key={c}>{c}</option>)}</select>
                      </div>
                      <div>
                        <label style={{ fontSize:10, color:T.textMuted, fontWeight:700, letterSpacing:0.5, textTransform:"uppercase", marginBottom:4, display:"block" }}>Sale Status</label>
                        <select value={projStatus} onChange={e => setProjStatus(e.target.value)} style={{ ...selSt, width:"100%" }}>
                          {["All","Off-Plan","Ready","Sold Out"].map(s => <option key={s}>{s}</option>)}
                        </select>
                      </div>
                      {["Apartment","Villa","Townhouse","Hotel Apartment"].includes(projMode) && (
                        <div>
                          <label style={{ fontSize:10, color:T.textMuted, fontWeight:700, letterSpacing:0.5, textTransform:"uppercase", marginBottom:4, display:"block" }}>Bedrooms</label>
                          <select value={projBeds} onChange={e => setProjBeds(e.target.value)} style={{ ...selSt, width:"100%" }}>
                            {["All","Studio","1BR","2BR","3BR","4BR","5BR+"].map(b => <option key={b}>{b}</option>)}
                          </select>
                        </div>
                      )}
                      {projMode === "Office" && (
                        <div>
                          <label style={{ fontSize:10, color:T.textMuted, fontWeight:700, letterSpacing:0.5, textTransform:"uppercase", marginBottom:4, display:"block" }}>Office Grade</label>
                          <select value={projGrade} onChange={e => setProjGrade(e.target.value)} style={{ ...selSt, width:"100%" }}>
                            {["All","A","B","C"].map(g => <option key={g}>{g === "All" ? "All Grades" : "Grade " + g}</option>)}
                          </select>
                        </div>
                      )}
                      <div>
                        <label style={{ fontSize:10, color:T.textMuted, fontWeight:700, letterSpacing:0.5, textTransform:"uppercase", marginBottom:4, display:"block" }}>Handover</label>
                        <select value={projHandover} onChange={e => setProjHandover(e.target.value)} style={{ ...selSt, width:"100%" }}>
                          {["All","2026","2027","2028","2029","Available Now"].map(h => <option key={h}>{h === "All" ? "Any Year" : h}</option>)}
                        </select>
                      </div>
                      <div style={{ gridColumn:"1 / -1", paddingTop:10, borderTop:`1px solid ${T.border}` }}>
                        <label style={{ fontSize:10, color:T.textMuted, fontWeight:700, letterSpacing:0.5, textTransform:"uppercase", marginBottom:8, display:"block" }}>Smart Segments</label>
                        <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                          {[
                            { key:"all",     label:"All Projects" },
                            { key:"tier1",   label:"⚡ Tier 1 Developers" },
                            { key:"gv",      label:"★ Golden Visa Eligible" },
                            { key:"branded", label:"◆ Branded Residences" },
                          ].map(f => (
                            <button key={f.key} type="button" onClick={() => setProjIntelFilter(f.key)}
                              style={{ padding:"6px 14px", background:projIntelFilter === f.key ? T.gold : "rgba(255,255,255,0.04)", border:`1px solid ${projIntelFilter === f.key ? T.gold : T.border}`, borderRadius:16, color:projIntelFilter === f.key ? "#000" : T.textSecondary, fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>
                              {f.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                  );
                })()}

                {/* COMPACT INLINE STATS — honest labeling per DLD data subset */}
                <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:16, padding:"10px 14px", background:T.surface, border:`1px solid ${T.border}`, borderRadius:10 }}>
                  {(() => {
                    const priced = filtered.filter(p => p.priceMin && isFinite(p.priceMin));
                    const withYield = filtered.filter(p => p.grossYield > 0);
                    const withPpsf = filtered.filter(p => p.ppsf > 0);
                    const withBench = filtered.filter(p => p.communityMedianPPSF);
                    const minPrice = priced.length > 0 ? Math.min(...priced.map(p => p.priceMin)) : null;
                    return [
                      { label:"Total", value:filtered.length.toLocaleString(), sub:"projects", color:T.white },
                      { label:"Priced From", value:minPrice ? `AED ${(minPrice/1000000).toFixed(1)}M` : "—", sub:priced.length > 0 ? `${priced.length} priced` : "0 priced", color:T.gold },
                      { label:"Avg Yield", value:withYield.length > 0 ? (withYield.reduce((a,p) => a+p.grossYield, 0)/withYield.length).toFixed(1) + "%" : "—", sub:`n=${withYield.length} disclosed`, color:T.green },
                      { label:"Community PPSF", value:withBench.length > 0 ? "AED " + Math.round(withBench.reduce((a,p) => a+p.communityMedianPPSF, 0)/withBench.length).toLocaleString() : "—", sub:`DLD · n=${withBench.length}`, color:T.teal },
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
                        <button type="button" onClick={() => setProjCompare(prev => prev.filter(c=>c.id!==p.id))} style={{ background:"none", border:"none", color:T.textMuted, cursor:"pointer", fontSize:12, padding:0 }}>×</button>
                      </span>
                    ))}
                    <div style={{ display:"flex", gap:8, marginLeft:"auto" }}>
                      {projCompare.length >= 2 && (
                        <button type="button" onClick={() => setShowCompare(true)}
                          style={{ padding:"7px 16px", background:`linear-gradient(135deg, ${T.gold}, #B8922A)`, border:"none", borderRadius:8, color:"#000", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>
                          View Comparison →
                        </button>
                      )}
                      <button type="button" onClick={() => setProjCompare([])} style={{ background:"none", border:`1px solid ${T.border}`, borderRadius:8, padding:"5px 10px", color:T.textMuted, fontSize:11, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>Clear</button>
                    </div>
                  </div>
                )}

                {/* DATA TIER DISCLOSURE — honest two-tier data source labeling */}
                <div style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px", borderRadius:10, background:"rgba(20,184,166,0.04)", border:`1px solid ${T.border}`, marginBottom:14, flexWrap:"wrap" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                    <span style={{ fontSize:12, color:T.teal, fontWeight:800 }}>✓</span>
                    <span style={{ fontSize:11, color:T.textSecondary }}><strong style={{ color:T.teal }}>DLD-Verified:</strong> Auto-imported from Dubai Land Department registry. Government-backed core data.</span>
                  </div>
                  <div style={{ width:1, height:14, background:T.border, margin:"0 4px" }} />
                  <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                    <span style={{ fontSize:12, color:T.gold, fontWeight:800 }}>◆</span>
                    <span style={{ fontSize:11, color:T.textSecondary }}><strong style={{ color:T.gold }}>Research-Enriched:</strong> Additional details curated from developer portals, Bayut, Property Finder.</span>
                  </div>
                </div>

                {/* Phase 3.7: Smart empty state — suggests which filter to remove */}
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
                      else if (key === "type") { /* keep — type is projMode, not a removable filter here */ }
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

                {/* List */}
                {filtered.length > 0 && projView === "list" && (
                  <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:12, overflow:"hidden", marginBottom:20 }}>
                    <div style={{ display:"grid", gridTemplateColumns:"2.5fr 1fr 1fr 1fr 1fr 1fr 1.2fr", padding:"10px 16px", background:T.surfaceAlt, borderBottom:`1px solid ${T.border}` }}>
                      {["Project","From","PPSF","Yield","Plan","Handover","Score"].map((h,i) => (
                        <div key={i} style={{ fontSize:10, fontWeight:700, color:T.textMuted, letterSpacing:0.8, textTransform:"uppercase" }}>{h}</div>
                      ))}
                    </div>
                    {filtered.map((p,i) => {
                      const sc = calcScore(p);
                      return (
                        <div key={p.id||i} onClick={() => { setSelectedProject(p); setProjDetailTab("identity"); }}
                          style={{ display:"grid", gridTemplateColumns:"2.5fr 1fr 1fr 1fr 1fr 1fr 1.2fr", padding:"12px 16px", borderBottom:i<filtered.length-1?`1px solid ${T.border}`:"none", cursor:"pointer" }}
                          onMouseEnter={e => e.currentTarget.style.background="rgba(212,168,67,0.03)"}
                          onMouseLeave={e => e.currentTarget.style.background="transparent"}>
                          <div>
                            <div style={{ fontSize:13, fontWeight:600, color:T.white }}>{p.project}</div>
                            <div style={{ fontSize:11, color:T.textMuted }}>{p.developer}{"·"}{p.community}</div>
                          </div>
                          <div style={{ fontSize:13, color:T.white }}>{p.priceMin ? "AED " + (p.priceMin/1000000).toFixed(1) + "M" : "—"}</div>
                          <div style={{ fontSize:13, color:T.gold, fontWeight:600 }}>AED {(p.ppsf||0).toLocaleString()}</div>
                          <div style={{ fontSize:13, fontWeight:700, color:p.grossYield>=7?T.green:p.grossYield>=5?T.gold:T.textSecondary }}>{p.grossYield?p.grossYield.toFixed(1)+"%":"—"}</div>
                          <div style={{ fontSize:12, color:T.textSecondary }}>{p.paymentPlan||"—"}</div>
                          <div style={{ fontSize:12, color:T.textMuted }}>{p.handover||"—"}</div>
                          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                            <span style={{ fontSize:14, fontWeight:700, color:scoreColor(sc) }}>{sc}</span>
                            <span style={{ fontSize:10, color:T.textMuted }}>data score</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Cross-tab nav */}
                <div style={{ display:"flex", gap:8, marginBottom:14, flexWrap:"wrap" }}>
                  {[
                    { label:"Dev Portal →", tab:"Dev Portal" },
                    { label:"Launch Calendar →", tab:"Launch Calendar" },
                    { label:"Yields →", tab:"Yields" },
                    { label:"DLD Volumes →", tab:"DLD Volumes" },
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
                  <div style={{ fontSize:11, fontWeight:700, color:T.textMuted, letterSpacing:0.8, textTransform:"uppercase", marginBottom:3 }}>{selectedProject.developer}{"·"}{selectedProject.community}</div>
                  <div style={{ fontFamily:"'Fraunces',serif", fontSize:22, fontWeight:800, color:T.white }}>{selectedProject.project}</div>
                  {/* Factual classification badges only — no investment advice */}
                  <div style={{ display:"flex", gap:5, flexWrap:"wrap", marginTop:6 }}>
                    {selectedProject.tier === 1 && <span style={{ fontSize:10, padding:"3px 8px", borderRadius:5, background:"rgba(16,185,129,0.12)", color:"#10B981", fontWeight:700 }}>Tier 1 Developer</span>}
                    {selectedProject.tier === 2 && <span style={{ fontSize:10, padding:"3px 8px", borderRadius:5, background:"rgba(245,158,11,0.12)", color:"#F59E0B", fontWeight:700 }}>Tier 2 Developer</span>}
                    {selectedProject.goldenVisa && selectedProject.priceMin >= GOLDEN_VISA_THRESHOLD && <span style={{ fontSize:10, padding:"3px 8px", borderRadius:5, background:"rgba(212,168,67,0.15)", color:T.gold, fontWeight:700 }}>★ Golden Visa Eligible</span>}
                    {selectedProject.branded && <span style={{ fontSize:10, padding:"3px 8px", borderRadius:5, background:"rgba(139,92,246,0.15)", color:"#A78BFA", fontWeight:700 }}>◆ {selectedProject.brandPartner || "Branded Residence"}</span>}
                    {selectedProject.escrowBank && <span style={{ fontSize:10, padding:"3px 8px", borderRadius:5, background:"rgba(20,184,166,0.1)", color:T.teal, fontWeight:700 }}>Escrow Verified</span>}
                    {isValidReraNumber(selectedProject.reraNo || selectedProject.projectNumber) && <span style={{ fontSize:10, padding:"3px 8px", borderRadius:5, background:"rgba(20,184,166,0.08)", color:T.teal, fontWeight:700 }}>RERA #{selectedProject.reraNo || selectedProject.projectNumber}</span>}
                  </div>
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <div style={{ textAlign:"right" }}>
                    <div style={{ fontSize:22, fontWeight:800, color:T.gold, fontFamily:"'Fraunces',serif" }}>{selectedProject.priceMin ? "AED " + (selectedProject.priceMin/1000000).toFixed(1) + "M" : "TBC"}</div>
                    <div style={{ fontSize:11, color:T.textMuted }}>starting price</div>
                  </div>
                  <button type="button" onClick={() => setSelectedProject(null)} style={{ width:36, height:36, borderRadius:"50%", background:T.surfaceAlt, border:`1px solid ${T.border}`, color:T.white, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, fontFamily:"'Outfit',sans-serif" }}>×</button>
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
                {/* ═══ SECTION 1 · PROJECT IDENTITY ═══ */}
                {projDetailTab === "identity" && (() => {
                  const seg = describeAssetClass(selectedProject);
                  const mkt = describeMarketStatus(selectedProject);
                  const rera = reraCompliance(selectedProject);
                  return (
                  <div>
                    <div style={{ padding:"18px 20px", background:`linear-gradient(135deg, rgba(212,168,67,0.08), rgba(20,184,166,0.04))`, border:`1px solid ${T.border}`, borderRadius:14, marginBottom:16 }}>
                      <div style={{ fontSize:10, fontWeight:700, color:T.textMuted, letterSpacing:1, textTransform:"uppercase", marginBottom:10 }}>Project Identity · Per DLD Registry</div>
                      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(200px, 1fr))", gap:14 }}>
                        <div>
                          <div style={{ fontSize:10, color:T.textMuted, marginBottom:4 }}>Project Name</div>
                          <div style={{ fontSize:15, fontWeight:700, color:T.white, fontFamily:"'Fraunces',serif" }}>{selectedProject.project || selectedProject.name || "—"}</div>
                        </div>
                        <div>
                          <div style={{ fontSize:10, color:T.textMuted, marginBottom:4 }}>Developer</div>
                          <div style={{ fontSize:15, fontWeight:700, color:T.white }}>{selectedProject.developer || "—"}</div>
                        </div>
                        <div>
                          <div style={{ fontSize:10, color:T.textMuted, marginBottom:4 }}>Community</div>
                          <div style={{ fontSize:15, fontWeight:700, color:T.textSecondary }}>{selectedProject.community || "—"}</div>
                        </div>
                        <div>
                          <div style={{ fontSize:10, color:T.textMuted, marginBottom:4 }}>Property Type</div>
                          <div style={{ fontSize:15, fontWeight:700, color:T.teal }}>{selectedProject.type || "—"}</div>
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

                {/* ═══ SECTION 2 · LOCATION DATA ═══ */}
                {projDetailTab === "location" && (() => {
                  const tags = locationTags(selectedProject);
                  return (
                  <div>
                    <div style={{ padding:"16px 20px", background:T.surface, border:`1px solid ${T.border}`, borderRadius:14, marginBottom:16 }}>
                      <div style={{ fontSize:10, fontWeight:700, color:T.textMuted, letterSpacing:1, textTransform:"uppercase", marginBottom:10 }}>Location Data · Distances Per DLD Filing</div>
                      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(200px, 1fr))", gap:12, marginBottom:14 }}>
                        <div>
                          <div style={{ fontSize:10, color:T.textMuted, marginBottom:4 }}>Emirate</div>
                          <div style={{ fontSize:14, fontWeight:700, color:T.white }}>{selectedProject.emirate || "Dubai"}</div>
                        </div>
                        <div>
                          <div style={{ fontSize:10, color:T.textMuted, marginBottom:4 }}>Area</div>
                          <div style={{ fontSize:14, fontWeight:700, color:T.white }}>{selectedProject.area || selectedProject.community || "—"}</div>
                        </div>
                        <div>
                          <div style={{ fontSize:10, color:T.textMuted, marginBottom:4 }}>Sub-Community</div>
                          <div style={{ fontSize:14, fontWeight:700, color:T.textSecondary }}>{selectedProject.subCommunity || "—"}</div>
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
                              {d.val != null ? (d.val < 1 ? (d.val*1000).toFixed(0)+"m" : d.val+"km") : "—"}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <LegalNote T={T} />
                  </div>
                  );
                })()}

                {/* ═══ SECTION 3 · SCALE & UNITS ═══ */}
                {projDetailTab === "scale" && (() => {
                  const mix = computeUnitMix(selectedProject);
                  return (
                  <div>
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(160px, 1fr))", gap:12, marginBottom:16 }}>
                      {[
                        { label:"Plot Size", value:selectedProject.plotSize || "—", sub:"sq ft" },
                        { label:"Built-Up Area", value:selectedProject.builtUpArea || "—", sub:"sq ft" },
                        { label:"Total Buildings", value:selectedProject.totalBuildings || "—", sub:"per DLD filing" },
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
                        <div style={{ fontSize:12, fontWeight:700, color:T.white, marginBottom:14 }}>Unit Type — Price & PPSF (Developer Disclosed)</div>
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

                {/* ═══ SECTION 4 · PRODUCT & AMENITIES ═══ */}
                {projDetailTab === "product" && (
                  <div>
                    <div style={{ padding:"14px 20px", background:"rgba(20,184,166,0.05)", border:`1px solid ${T.border}`, borderRadius:10, marginBottom:16 }}>
                      <div style={{ fontSize:11, color:T.teal, fontWeight:700, letterSpacing:0.5 }}>PRODUCT SPECIFICATION · DEVELOPER DISCLOSED</div>
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

                {/* ═══ SECTION 5 · PRICING DATA ═══ */}
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
                        <div style={{ fontFamily:"'Fraunces',serif", fontSize:24, fontWeight:800, color:T.white }}>{selectedProject.ppsf ? "AED " + selectedProject.ppsf.toLocaleString() : "—"}</div>
                        <div style={{ fontSize:10, color:T.textMuted, marginTop:4 }}>PPSF from listings</div>
                      </div>
                      <div className="kpi-card">
                        <div style={{ fontSize:10, fontWeight:700, color:T.textMuted, letterSpacing:1, textTransform:"uppercase", marginBottom:8 }}>Community Benchmark PPSF</div>
                        <div style={{ fontFamily:"'Fraunces',serif", fontSize:24, fontWeight:800, color:bench.value ? T.teal : T.textMuted }}>{bench.value ? "AED " + bench.value.toLocaleString() : "Pending"}</div>
                        {bench.p25 && bench.p75 && <div style={{ fontSize:10, color:T.textMuted, marginTop:2 }}>Range AED {bench.p25.toLocaleString()}–{bench.p75.toLocaleString()}</div>}
                        <div style={{ fontSize:10, color:T.textMuted, marginTop:4 }}>{bench.source}</div>
                      </div>
                      <div className="kpi-card">
                        <div style={{ fontSize:10, fontWeight:700, color:T.textMuted, letterSpacing:1, textTransform:"uppercase", marginBottom:8 }}>Payment Plan</div>
                        <div style={{ fontFamily:"'Fraunces',serif", fontSize:20, fontWeight:800, color:T.gold }}>{selectedProject.paymentPlan || "—"}</div>
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
                          <div style={{ fontSize:14, fontWeight:700, color:T.teal }}>{selectedProject.escrowBank || "—"}</div>
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
                            Worked example — AED {((selectedProject.priceMin||0)/1000000).toFixed(1)}M: Pay AED {((selectedProject.priceMin||0)*(parseInt(selectedProject.paymentPlan.split("/")[0])||60)/100/1000000).toFixed(2)}M during construction, AED {((selectedProject.priceMin||0)*(parseInt(selectedProject.paymentPlan.split("/")[1])||40)/100/1000000).toFixed(2)}M at handover.
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

                {/* ═══ SECTION 6 · RENTAL & YIELD DATA ═══ */}
                {projDetailTab === "rental" && (() => {
                  const str = strIndicator(selectedProject);
                  return (
                  <div>
                    <div style={{ padding:"14px 20px", background:"rgba(16,185,129,0.05)", border:`1px solid ${T.border}`, borderRadius:10, marginBottom:16 }}>
                      <div style={{ fontSize:11, color:T.green, fontWeight:700, letterSpacing:0.5 }}>RENTAL DATA · PER RERA SMART RENTAL INDEX METHODOLOGY</div>
                    </div>
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(180px, 1fr))", gap:12, marginBottom:16 }}>
                      <div className="kpi-card">
                        <div style={{ fontSize:10, fontWeight:700, color:T.textMuted, letterSpacing:1, textTransform:"uppercase", marginBottom:8 }}>Gross Yield</div>
                        <div style={{ fontFamily:"'Fraunces',serif", fontSize:26, fontWeight:800, color:selectedProject.grossYield >= 7 ? T.green : selectedProject.grossYield >= 5 ? T.gold : T.textSecondary }}>{selectedProject.grossYield ? selectedProject.grossYield.toFixed(1) + "%" : "—"}</div>
                        <div style={{ fontSize:10, color:T.textMuted }}>Annual rent ÷ purchase price</div>
                      </div>
                      <div className="kpi-card">
                        <div style={{ fontSize:10, fontWeight:700, color:T.textMuted, letterSpacing:1, textTransform:"uppercase", marginBottom:8 }}>Net Yield</div>
                        <div style={{ fontFamily:"'Fraunces',serif", fontSize:26, fontWeight:800, color:T.teal }}>{selectedProject.netYield ? selectedProject.netYield.toFixed(1) + "%" : "—"}</div>
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

                {/* ═══ SECTION 7 · DEVELOPER & COMPLIANCE ═══ */}
                {projDetailTab === "developer" && (() => {
                  const esc = escrowStatus(selectedProject);
                  const rera = reraCompliance(selectedProject);
                  return (
                  <div>
                    <div style={{ padding:"18px 20px", background:`linear-gradient(135deg, rgba(212,168,67,0.08), rgba(20,184,166,0.04))`, border:`1px solid ${T.border}`, borderRadius:14, marginBottom:16 }}>
                      <div style={{ fontSize:11, fontWeight:700, color:T.gold, letterSpacing:1, textTransform:"uppercase", marginBottom:10 }}>Developer & Regulatory Compliance</div>
                      <div style={{ fontSize:22, fontWeight:800, color:T.white, fontFamily:"'Fraunces',serif", marginBottom:4 }}>{selectedProject.developer || "—"}</div>
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
                        <div style={{ fontSize:14, fontWeight:700, color:T.teal }}>{selectedProject.escrowBank || "—"}</div>
                      </div>
                      <div className="kpi-card">
                        <div style={{ fontSize:10, fontWeight:700, color:T.textMuted, letterSpacing:1, textTransform:"uppercase", marginBottom:8 }}>DLD Project Status</div>
                        <div style={{ fontSize:14, fontWeight:700, color:T.white }}>{selectedProject.dldStatus || selectedProject.status || "—"}</div>
                      </div>
                    </div>
                    <div className="chart-box" style={{ padding:18, marginBottom:12 }}>
                      <div style={{ fontSize:12, fontWeight:700, color:T.white, marginBottom:14 }}>Construction & Delivery Data</div>
                      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(140px, 1fr))", gap:10 }}>
                        <div style={{ padding:"10px 12px", background:T.surfaceAlt, borderRadius:8 }}>
                          <div style={{ fontSize:10, color:T.textMuted, marginBottom:4 }}>Build Progress</div>
                          <div style={{ fontSize:16, fontWeight:700, color:T.white }}>{selectedProject.constructionPct != null ? selectedProject.constructionPct + "%" : "—"}</div>
                        </div>
                        <div style={{ padding:"10px 12px", background:T.surfaceAlt, borderRadius:8 }}>
                          <div style={{ fontSize:10, color:T.textMuted, marginBottom:4 }}>Expected Handover</div>
                          <div style={{ fontSize:16, fontWeight:700, color:T.gold }}>{selectedProject.handover || selectedProject.expectedHandover || "—"}</div>
                        </div>
                        <div style={{ padding:"10px 12px", background:T.surfaceAlt, borderRadius:8 }}>
                          <div style={{ fontSize:10, color:T.textMuted, marginBottom:4 }}>Contracted Handover</div>
                          <div style={{ fontSize:13, fontWeight:700, color:T.textSecondary }}>{selectedProject.contractedHandover || "—"}</div>
                        </div>
                        <div style={{ padding:"10px 12px", background:T.surfaceAlt, borderRadius:8 }}>
                          <div style={{ fontSize:10, color:T.textMuted, marginBottom:4 }}>Actual Handover</div>
                          <div style={{ fontSize:13, fontWeight:700, color:T.textSecondary }}>{selectedProject.actualHandover || "Pending"}</div>
                        </div>
                      </div>
                    </div>
                    <button type="button" onClick={() => { setSelectedProject(null); handleTabChange("Developer Health"); }} style={{ padding:"10px 20px", background:"rgba(212,168,67,0.1)", border:`1px solid ${T.border}`, borderRadius:8, color:T.gold, fontSize:12, cursor:"pointer", fontFamily:"'Outfit',sans-serif", fontWeight:600, marginBottom:12 }}>Full Developer Profile →</button>
                    <LegalNote T={T} />
                  </div>
                  );
                })()}

                {/* ═══ SECTION 8 · FULL REPORT & SHARE ═══ */}
                {projDetailTab === "report" && (
                  <div>
                    <div style={{ padding:"14px 20px", background:"rgba(139,92,246,0.05)", border:`1px solid ${T.border}`, borderRadius:10, marginBottom:16 }}>
                      <div style={{ fontSize:11, color:"#A78BFA", fontWeight:700, letterSpacing:0.5 }}>DATA REPORT · SHAREABLE SUMMARY</div>
                    </div>
                    <div className="chart-box" style={{ padding:20, marginBottom:16 }}>
                      <div style={{ fontSize:12, fontWeight:700, color:T.white, marginBottom:14 }}>Project Summary (Factual Data)</div>
                      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, fontSize:12, color:T.textSecondary, lineHeight:1.9 }}>
                        <div><strong style={{ color:T.white }}>Project:</strong> {selectedProject.project || selectedProject.name || "—"}</div>
                        <div><strong style={{ color:T.white }}>Developer:</strong> {selectedProject.developer || "—"}</div>
                        <div><strong style={{ color:T.white }}>Community:</strong> {selectedProject.community || "—"}</div>
                        <div><strong style={{ color:T.white }}>Type:</strong> {selectedProject.type || "—"}</div>
                        <div><strong style={{ color:T.white }}>Starting Price:</strong> {selectedProject.priceMin ? "AED " + (selectedProject.priceMin/1000000).toFixed(2) + "M" : "TBC"}</div>
                        <div><strong style={{ color:T.white }}>PPSF:</strong> AED {(selectedProject.ppsf || 0).toLocaleString()}</div>
                        <div><strong style={{ color:T.white }}>Gross Yield:</strong> {selectedProject.grossYield ? selectedProject.grossYield + "%" : "—"}</div>
                        <div><strong style={{ color:T.white }}>Payment Plan:</strong> {selectedProject.paymentPlan || "TBC"}</div>
                        <div><strong style={{ color:T.white }}>Handover:</strong> {selectedProject.handover || "TBC"}</div>
                        <div><strong style={{ color:T.white }}>RERA #:</strong> {selectedProject.reraNo || selectedProject.projectNumber || "Pending"}</div>
                        <div><strong style={{ color:T.white }}>Escrow:</strong> {selectedProject.escrowBank || "—"}</div>
                        <div><strong style={{ color:T.white }}>Build Progress:</strong> {selectedProject.constructionPct != null ? selectedProject.constructionPct + "%" : "—"}</div>
                      </div>
                    </div>
                    {(() => {
                      const units = selectedProject.unitBreakdown?.map(u => `  • ${u.type}: AED ${(u.ppsf||0).toLocaleString()}/sqft | From AED ${(u.priceMin/1000000).toFixed(2)}M`).join("\n") || "";
                      const origin = (typeof window !== "undefined" && window.location && window.location.origin) ? window.location.origin : "https://emaar-dashboard.vercel.app";
                      const projectUrl = `${origin}/project/${encodeURIComponent(selectedProject.id || "")}`;
                      const txt = [
                        "🏙️ DXB ANALYTICS — PROPERTY DATA REPORT",
                        "━━━━━━━━━━━━━━━━━━━━━━━━",
                        `📌 ${selectedProject.project || selectedProject.name}`,
                        `🏢 Developer: ${selectedProject.developer}`,
                        `📍 Community: ${selectedProject.community}`,
                        `🏠 Type: ${selectedProject.type}`,
                        "",
                        "💰 PRICING",
                        `   Starting: AED ${((selectedProject.priceMin||0)/1000000).toFixed(2)}M`,
                        `   PPSF: AED ${(selectedProject.ppsf||0).toLocaleString()}`,
                        units ? `\n📐 UNIT BREAKDOWN\n${units}` : "",
                        "",
                        "📊 RENTAL DATA",
                        `   Gross Yield: ${selectedProject.grossYield||"—"}%`,
                        `   Payment Plan: ${selectedProject.paymentPlan||"TBC"}`,
                        `   Handover: ${selectedProject.handover||"TBC"}`,
                        "",
                        `🔐 RERA: ${selectedProject.reraNo||selectedProject.projectNumber||"TBC"} | Escrow: ${selectedProject.escrowBank||"TBC"}`,
                        "",
                        `🔗 Full report: ${projectUrl}`,
                        "━━━━━━━━━━━━━━━━━━━━━━━━",
                        "Data Source: Dubai Land Department (DLD) public records",
                        "Informational only — not investment advice",
                        "For regulated advice contact a RERA-licensed consultant",
                      ].filter(line => line !== "").join("\n");
                      const emailSubject = `Property Data Report — ${selectedProject.project || selectedProject.name}`;
                      const btnStyle = (color) => ({ padding:"10px 18px", background:`rgba(${color},0.1)`, border:`1px solid rgba(${color},0.3)`, borderRadius:8, color:`rgb(${color})`, fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"'Outfit',sans-serif", display:"inline-flex", alignItems:"center", gap:6 });
                      return (
                        <div className="chart-box" style={{ padding:18, marginBottom:12 }}>
                          <div style={{ fontSize:11, fontWeight:700, color:T.textMuted, letterSpacing:0.8, textTransform:"uppercase", marginBottom:12 }}>Share This Data Report</div>
                          <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                            <button type="button" onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(txt)}`,"_blank")} style={btnStyle("37,211,102")}>📱 WhatsApp</button>
                            <button type="button" onClick={() => window.open(`mailto:?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(txt)}`,"_blank")} style={btnStyle("59,130,246")}>✉️ Email</button>
                            <button type="button" onClick={async () => {
                              try {
                                await navigator.clipboard.writeText(projectUrl);
                                const el = document.activeElement;
                                const original = el && el.textContent;
                                if (el && el.textContent != null) { el.textContent = "✓ Copied!"; setTimeout(() => { if (el && original) el.textContent = original; }, 1500); }
                              } catch {}
                            }} style={btnStyle("212,168,67")}>🔗 Copy Link</button>
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
