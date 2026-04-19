/* eslint-disable */
/* ═══════════════════════════════════════════════════════════════════
   DXB ANALYTICS — NEIGHBOURHOODS TAB
   Extracted from EmaarDashboardV2.jsx
   Community intelligence: PPSF, yields, metro, schools, risk
   ═══════════════════════════════════════════════════════════════════ */

import React, { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from "recharts";
import { T } from "../data";
import { SvgIcons } from "../components/Icons";
import { Section, Chart, CustomTooltip, DataBadge, TabSources } from "../components/SharedUI";
import SEED_DATA from "../utils/seedData";
import { scoreColor, scoreLabel } from "../utils/scoring";

/* Canonical ScoreBadge — uses shared scoring thresholds from src/utils/scoring.js */
const ScoreBadge = ({ score, size = "sm" }) => {
  const s = score || 0;
  const color = scoreColor(s);
  const label = scoreLabel(s);
  const dim = size === "lg" ? 44 : 32;
  const fontSize = size === "lg" ? 13 : 11;
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
      <div style={{ width: dim, height: dim, borderRadius: "50%", background: `${color}22`, border: `2px solid ${color}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize, fontWeight: 800, color, fontFamily: "'Fraunces',serif" }}>{score || "—"}</span>
      </div>
      {size === "lg" && <div style={{ fontSize: 11, fontWeight: 700, color }}>{label}</div>}
    </div>
  );
};

function NeighbourhoodsTab({ nbhSearch, setNbhSearch, nbhTypeFilter, setNbhTypeFilter, nbhYieldFilter, setNbhYieldFilter, nbhRiskFilter, setNbhRiskFilter, nbhSort, setNbhSort, nbhView, setNbhView, nbhCompare, setNbhCompare, liveNeighbourhoods, liveCommunityDataFull = [], liveCommunityROI, liveMarketData, globalFilters = {}, allDevelopers = [], handleTabChange, selectedNbhd, setSelectedNbhd }) {

  /* Phase Tier-A: local tier filter (Verified / DLD Registry / All) */
  const [nbhTierFilter, setNbhTierFilter] = useState("All");

  /* Phase 2.4 Batch 5: derive matching community set from global filter */
  const gfDev = globalFilters?.developer && globalFilters.developer !== "all"
    ? String(globalFilters.developer).toLowerCase() : null;
  const gfCommunity = globalFilters?.community && globalFilters.community !== "all"
    ? String(globalFilters.community).toLowerCase() : null;

  const nbhMatchingCommunities = (() => {
    if (!gfDev && !gfCommunity) return null;
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
        set = new Set();
      }
    }
    if (gfCommunity) {
      if (set) set = new Set([...set].filter(c => c === gfCommunity));
      else set = new Set([gfCommunity]);
    }
    return set;
  })();

  const nbhMatchesGlobalFilter = (communityName) => {
    if (!nbhMatchingCommunities) return true;
    return nbhMatchingCommunities.has(String(communityName || "").toLowerCase());
  };


            /* state moved to top level */

            /* ── TIERED DATA ASSEMBLY (Phase Tier-A) ──
               Tier 1 — Verified intel records (full investment metrics)
                 Sources (priority): Firestore cron tabData → seedData.communities
               Tier 2 — DLD registry records (name + project counts only)
                 Source: Firestore communityData collection (imported from DLD)
               Merge rules:
                 - Key by lowercased community name
                 - Tier 1 wins on collisions (seed yield beats DLD blank yield)
                 - Tier 2 enriches Tier 1 with totalProjects/totalUnits when missing
                 - Communities in Tier 2 only (no Tier 1 match) get tier:"dld-registry"
            */
            const rawNbhFirestore = liveMarketData?.filter?.(d => d.type === "community") || [];
            const tier1Raw = rawNbhFirestore.length > 0 ? rawNbhFirestore : SEED_DATA.communities;
            const tier2Raw = Array.isArray(liveCommunityDataFull) ? liveCommunityDataFull : [];

            /* Build a lookup of Tier 2 records by lowercased name, for enrichment + orphan detection */
            const tier2ByName = {};
            tier2Raw.forEach(c => {
              const key = String(c.name || c.community || "").trim().toLowerCase();
              if (key) tier2ByName[key] = c;
            });

            /* Step 1: decorate Tier 1 records — mark tier:"verified" + enrich with DLD project counts */
            const tier1Seen = new Set();
            const tier1Decorated = tier1Raw.map(r => {
              const key = String(r.community || "").trim().toLowerCase();
              tier1Seen.add(key);
              const dldMatch = tier2ByName[key];
              return {
                ...r,
                tier: "verified",
                /* Fill in DLD project/unit counts where not already set */
                totalProjects: r.totalProjects ?? dldMatch?.totalProjects ?? null,
                totalUnits:    r.totalUnits    ?? dldMatch?.totalUnits    ?? null,
              };
            });

            /* Step 2: build Tier 2 records (DLD-only) that aren't already in Tier 1 */
            const tier2Only = tier2Raw
              .filter(c => {
                const key = String(c.name || c.community || "").trim().toLowerCase();
                return key && !tier1Seen.has(key);
              })
              .map(c => ({
                community: c.name || c.community,
                tier: "dld-registry",
                totalProjects: c.totalProjects ?? null,
                totalUnits:    c.totalUnits ?? null,
                activeProjects: c.activeProjects ?? null,
                completedProjects: c.completedProjects ?? null,
                area: c.area || "",
                /* No yield/ppsf claims — DLD doesn't publish these */
                avgPpsf: null,
                grossYield: null,
                netYield: null,
                serviceCharge: null,
                metroDistance: null,
                supplyRisk: null,
                investmentScore: null,
                tenantProfile: null,
                hasSchool: false, hasMall: false, hasBeach: false, hasHospital: false,
                pipeline2026: null,
                type: "community",
                isSeedData: false,
                source: c.source || "DLD Registry",
              }));

            const rawNbhAll = [...tier1Decorated, ...tier2Only];
            // Phase 2.4 Batch 5: apply top-bar global filter
            const rawNbh = rawNbhAll.filter(n => nbhMatchesGlobalFilter(n.community));
            const nbhIsSeed = rawNbhFirestore.length === 0;


            /* ── Metro badge ── */
            const MetroBadge = ({ distance }) => {
              if (!distance) return null;
              const close = distance <= 700;
              return (
                <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 10, fontWeight: 600, background: close ? "rgba(16,185,129,0.12)" : "rgba(255,255,255,0.06)", color: close ? T.green : T.textMuted, border: `1px solid ${close ? "rgba(16,185,129,0.3)" : T.border}` }}>
                  {close ? "Metro ≤700m" : distance < 2000 ? `Metro ~${(distance/1000).toFixed(1)}km` : "No metro"}
                </span>
              );
            };

            /* ── Risk badge ── */
            const RiskBadge = ({ risk }) => {
              const cfg = { Low: { color: T.green, bg: "rgba(16,185,129,0.1)" }, Medium: { color: T.gold, bg: "rgba(212,168,67,0.1)" }, High: { color: T.red, bg: "rgba(239,68,68,0.1)" } };
              const c = cfg[risk] || cfg["Medium"];
              return (
                <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 10, fontWeight: 600, background: c.bg, color: c.color }}>
                  {risk || "—"} Risk
                </span>
              );
            };

            /* ── Filter & sort ── */
            const filtered = rawNbh.filter(n => {
              if (nbhSearch && !n.community?.toLowerCase().includes(nbhSearch.toLowerCase())) return false;
              /* Phase Tier-A: tier filter */
              if (nbhTierFilter === "Verified" && n.tier !== "verified") return false;
              if (nbhTierFilter === "Registry" && n.tier !== "dld-registry") return false;
              if (nbhTypeFilter !== "All" && n.tenantProfile !== nbhTypeFilter) return false;
              if (nbhYieldFilter !== "All") {
                const y = parseFloat(n.grossYield) || 0;
                if (nbhYieldFilter === "7%+" && y < 7) return false;
                if (nbhYieldFilter === "5-7%" && (y < 5 || y >= 7)) return false;
                if (nbhYieldFilter === "<5%" && y >= 5) return false;
              }
              if (nbhRiskFilter !== "All" && n.supplyRisk !== nbhRiskFilter) return false;
              return true;
            }).sort((a, b) => {
              /* Phase Tier-A: verified records always sort before dld-registry within same sort */
              const tierDiff = (a.tier === "dld-registry" ? 1 : 0) - (b.tier === "dld-registry" ? 1 : 0);
              if (tierDiff !== 0) return tierDiff;
              if (nbhSort === "yield") return (parseFloat(b.grossYield)||0) - (parseFloat(a.grossYield)||0);
              if (nbhSort === "ppsf") return (b.avgPpsf||0) - (a.avgPpsf||0);
              if (nbhSort === "score") return (b.investmentScore||0) - (a.investmentScore||0);
              if (nbhSort === "name") return (a.community||"").localeCompare(b.community||"");
              return 0;
            });

            const selStyle = {
              background: T.surfaceAlt, border: `1px solid ${T.border}`,
              borderRadius: 8, color: T.white, fontFamily: "'Outfit',sans-serif",
              fontSize: 12, padding: "7px 28px 7px 10px", outline: "none", cursor: "pointer",
              appearance: "none", WebkitAppearance: "none",
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
              backgroundRepeat: "no-repeat", backgroundPosition: "right 8px center",
            };

            /* ── Community card (Tier 1 = Verified, full metrics) ── */
            const NbhCardVerified = ({ n }) => {
              const isCompared = nbhCompare.includes(n.community);
              return (
                <div className="chart-box" style={{ padding: 16, position: "relative", transition: "transform 0.15s, box-shadow 0.15s", cursor: "pointer" }}
                  onClick={() => setSelectedNbhd && setSelectedNbhd(n)}
                  onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 32px rgba(0,0,0,0.3)"; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}>

                  {/* Header row */}
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: T.white, marginBottom: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{n.community || "—"}</div>
                      <div style={{ display: "flex", gap: 5, flexWrap: "wrap", alignItems: "center" }}>
                        <span title="Verified — full investment intelligence curated by DXB Analytics" style={{ fontSize: 9, padding: "2px 6px", borderRadius: 10, fontWeight: 700, letterSpacing: 0.5, background: "rgba(16,185,129,0.10)", color: T.green, border: "1px solid rgba(16,185,129,0.25)", textTransform: "uppercase" }}>Verified</span>
                        <MetroBadge distance={n.metroDistance} />
                        <RiskBadge risk={n.supplyRisk} />
                      </div>
                    </div>
                    <ScoreBadge score={n.investmentScore} />
                  </div>

                  {/* Key metrics grid */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
                    {[
                      { label: "Gross Yield", value: n.grossYield ? parseFloat(n.grossYield).toFixed(1) + "%" : "—", color: parseFloat(n.grossYield) >= 7 ? T.green : parseFloat(n.grossYield) >= 5 ? T.gold : T.textSecondary },
                      { label: "Net Yield", value: n.netYield ? parseFloat(n.netYield).toFixed(1) + "%" : "—", color: T.textSecondary },
                      { label: "Avg PPSF", value: n.avgPpsf ? "AED " + n.avgPpsf.toLocaleString() : "—", color: T.white },
                      { label: "Service Charge", value: n.serviceCharge ? "AED " + n.serviceCharge + "/sqft" : "—", color: T.textMuted },
                    ].map((m, i) => (
                      <div key={i} style={{ background: T.surfaceAlt, borderRadius: 8, padding: "8px 10px" }}>
                        <div style={{ fontSize: 9, fontWeight: 700, color: T.textMuted, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 4 }}>{m.label}</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: m.color, fontFamily: "'Fraunces',serif" }}>{m.value}</div>
                      </div>
                    ))}
                  </div>

                  {/* Amenities row */}
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
                    {n.hasSchool && (
                      <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 10, background: "rgba(99,102,241,0.1)", color: "#818CF8", border: "1px solid rgba(99,102,241,0.2)" }}>
                        School
                      </span>
                    )}
                    {n.hasHospital && (
                      <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 10, background: "rgba(239,68,68,0.1)", color: T.red, border: "1px solid rgba(239,68,68,0.2)" }}>
                        Hospital
                      </span>
                    )}
                    {n.hasMall && (
                      <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 10, background: "rgba(212,168,67,0.08)", color: T.gold, border: `1px solid ${T.border}` }}>
                        Mall
                      </span>
                    )}
                    {n.hasBeach && (
                      <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 10, background: "rgba(20,184,166,0.1)", color: T.teal, border: "1px solid rgba(20,184,166,0.2)" }}>
                        Waterfront
                      </span>
                    )}
                    {n.tenantProfile && (
                      <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 10, background: "rgba(255,255,255,0.05)", color: T.textMuted, border: `1px solid ${T.border}` }}>
                        {n.tenantProfile}
                      </span>
                    )}
                  </div>

                  {/* Supply pipeline */}
                  {n.pipeline2026 && (
                    <div style={{ marginBottom: 10 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ fontSize: 10, color: T.textMuted }}>2026 Pipeline</span>
                        <span style={{ fontSize: 10, color: T.white, fontWeight: 600 }}>{n.pipeline2026?.toLocaleString()} units</span>
                      </div>
                      <div style={{ height: 4, borderRadius: 2, background: T.border }}>
                        <div style={{ height: "100%", width: Math.min((n.pipeline2026 / 5000) * 100, 100) + "%", borderRadius: 2, background: n.supplyRisk === "High" ? T.red : n.supplyRisk === "Medium" ? T.gold : T.green }} />
                      </div>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div style={{ display: "flex", gap: 6 }}>
                    <button type="button" onClick={(e) => { e.stopPropagation(); handleTabChange("Price History"); }}
                      style={{ flex: 1, padding: "6px 0", background: "rgba(212,168,67,0.06)", border: `1px solid ${T.border}`, borderRadius: 7, color: T.gold, fontSize: 10, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>
                      Price History
                    </button>
                    <button type="button" onClick={(e) => { e.stopPropagation(); handleTabChange("Yields"); }}
                      style={{ flex: 1, padding: "6px 0", background: "rgba(20,184,166,0.06)", border: "1px solid rgba(20,184,166,0.2)", borderRadius: 7, color: T.teal, fontSize: 10, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>
                      Yields
                    </button>
                    <button type="button"
                      onClick={(e) => { e.stopPropagation(); setNbhCompare(c => isCompared ? c.filter(x => x !== n.community) : c.length < 2 ? [...c, n.community] : c); }}
                      style={{ padding: "6px 10px", background: isCompared ? "rgba(212,168,67,0.15)" : "transparent", border: `1px solid ${isCompared ? "rgba(212,168,67,0.4)" : T.border}`, borderRadius: 7, color: isCompared ? T.gold : T.textMuted, fontSize: 10, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>
                      {isCompared ? "Added" : "Compare"}
                    </button>
                  </div>
                </div>
              );
            };

            /* ── Registry card (Tier 2 = DLD-only, compact, honest) ── */
            const NbhCardRegistry = ({ n }) => {
              return (
                <div className="chart-box" style={{ padding: "14px 16px", position: "relative", transition: "transform 0.15s, box-shadow 0.15s", cursor: "pointer", borderLeft: `3px solid ${T.border}`, background: "rgba(255,255,255,0.015)", display: "flex", alignItems: "center", gap: 14, minHeight: 88 }}
                  onClick={() => setSelectedNbhd && setSelectedNbhd(n)}
                  onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.2)"; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}>

                  {/* Left — name + chips */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.white, marginBottom: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{n.community || "—"}</div>
                    <div style={{ display: "flex", gap: 5, flexWrap: "wrap", alignItems: "center" }}>
                      <span title="DLD Registry — official government listing. Investment metrics curation pending." style={{ fontSize: 9, padding: "2px 6px", borderRadius: 10, fontWeight: 700, letterSpacing: 0.5, background: "rgba(148,163,184,0.10)", color: T.textMuted, border: `1px solid ${T.border}`, textTransform: "uppercase" }}>DLD Registry</span>
                      {n.area && <span style={{ fontSize: 10, color: T.textMuted }}>{n.area}</span>}
                    </div>
                  </div>

                  {/* Middle — project counts */}
                  <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                    {n.totalProjects != null && (
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 18, fontWeight: 800, color: T.white, fontFamily: "'Fraunces',serif", lineHeight: 1 }}>{n.totalProjects}</div>
                        <div style={{ fontSize: 9, fontWeight: 600, color: T.textMuted, letterSpacing: 0.5, textTransform: "uppercase", marginTop: 2 }}>Projects</div>
                      </div>
                    )}
                    {n.activeProjects != null && n.activeProjects > 0 && (
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: T.green, fontFamily: "'Fraunces',serif", lineHeight: 1 }}>{n.activeProjects}</div>
                        <div style={{ fontSize: 9, fontWeight: 600, color: T.textMuted, letterSpacing: 0.5, textTransform: "uppercase", marginTop: 2 }}>Active</div>
                      </div>
                    )}
                    {n.completedProjects != null && n.completedProjects > 0 && (
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: T.textSecondary, fontFamily: "'Fraunces',serif", lineHeight: 1 }}>{n.completedProjects}</div>
                        <div style={{ fontSize: 9, fontWeight: 600, color: T.textMuted, letterSpacing: 0.5, textTransform: "uppercase", marginTop: 2 }}>Done</div>
                      </div>
                    )}
                  </div>

                  {/* Right — chevron */}
                  <div style={{ color: T.textMuted, fontSize: 16, fontFamily: "'Outfit',sans-serif", opacity: 0.5 }}>›</div>
                </div>
              );
            };

            /* ── Detail Drawer (slides in from right when a card is clicked) ──
               Works for both Tier 1 (Verified) and Tier 2 (DLD Registry) records.
               Sections auto-hide when data is missing. Fully self-contained.
            */
            const NbhDetailDrawer = ({ n, onClose }) => {
              if (!n) return null;
              const isDldOnly = n.tier === "dld-registry";
              const hasInvestment = !isDldOnly && (n.grossYield || n.avgPpsf);

              /* Body scroll lock */
              React.useEffect(() => {
                const prev = document.body.style.overflow;
                document.body.style.overflow = "hidden";
                const onKey = (e) => { if (e.key === "Escape") onClose(); };
                window.addEventListener("keydown", onKey);
                return () => { document.body.style.overflow = prev; window.removeEventListener("keydown", onKey); };
              }, []);

              const Stat = ({ label, value, color, hint }) => (
                <div style={{ background: T.surfaceAlt, borderRadius: 10, padding: "12px 14px" }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: T.textMuted, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 6 }}>{label}</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: color || T.white, fontFamily: "'Fraunces',serif", lineHeight: 1 }}>{value}</div>
                  {hint && <div style={{ fontSize: 10, color: T.textMuted, marginTop: 4 }}>{hint}</div>}
                </div>
              );

              const SectionTitle = ({ children, accent }) => (
                <div style={{ fontSize: 11, fontWeight: 700, color: accent || T.gold, letterSpacing: 1, textTransform: "uppercase", marginBottom: 12, marginTop: 24, display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ width: 16, height: 1, background: accent || T.gold }} />{children}
                </div>
              );

              return (
                <React.Fragment>
                  {/* Backdrop */}
                  <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(2px)", zIndex: 1000, animation: "fadeUp 0.2s ease-out forwards" }} />

                  {/* Drawer */}
                  <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: "min(560px, 100vw)", background: T.surface, borderLeft: `1px solid ${T.border}`, zIndex: 1001, overflowY: "auto", boxShadow: "-20px 0 60px rgba(0,0,0,0.5)", animation: "fadeUp 0.25s ease-out forwards" }}>

                    {/* Sticky header */}
                    <div style={{ position: "sticky", top: 0, zIndex: 2, background: T.surface, borderBottom: `1px solid ${T.border}`, padding: "18px 24px 14px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 6 }}>
                          {isDldOnly ? (
                            <span style={{ fontSize: 9, padding: "2px 8px", borderRadius: 10, fontWeight: 700, letterSpacing: 0.5, background: "rgba(148,163,184,0.10)", color: T.textMuted, border: `1px solid ${T.border}`, textTransform: "uppercase" }}>DLD Registry</span>
                          ) : (
                            <span style={{ fontSize: 9, padding: "2px 8px", borderRadius: 10, fontWeight: 700, letterSpacing: 0.5, background: "rgba(16,185,129,0.10)", color: T.green, border: "1px solid rgba(16,185,129,0.25)", textTransform: "uppercase" }}>Verified Intelligence</span>
                          )}
                          {n.area && <span style={{ fontSize: 11, color: T.textMuted }}>{n.area}</span>}
                        </div>
                        <div style={{ fontSize: 22, fontWeight: 800, color: T.white, fontFamily: "'Fraunces',serif", lineHeight: 1.15 }}>{n.community || "—"}</div>
                        {!isDldOnly && (
                          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center", marginTop: 8 }}>
                            <MetroBadge distance={n.metroDistance} />
                            <RiskBadge risk={n.supplyRisk} />
                            {n.tenantProfile && <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 10, background: "rgba(255,255,255,0.05)", color: T.textMuted, border: `1px solid ${T.border}` }}>{n.tenantProfile}</span>}
                          </div>
                        )}
                      </div>
                      <button type="button" onClick={onClose}
                        style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${T.border}`, background: "transparent", color: T.textMuted, fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontFamily: "'Outfit',sans-serif" }}>×</button>
                    </div>

                    {/* Body */}
                    <div style={{ padding: "4px 24px 32px" }}>

                      {/* Score + quick header stats (Verified only) */}
                      {!isDldOnly && n.investmentScore && (
                        <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "20px 0", borderBottom: `1px solid ${T.border}` }}>
                          <ScoreBadge score={n.investmentScore} size="lg" />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 11, color: T.textMuted, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 2 }}>DXB Investment Score</div>
                            <div style={{ fontSize: 13, color: T.textSecondary }}>Composite of yield, supply risk, metro access, lifestyle & demand signals</div>
                          </div>
                        </div>
                      )}

                      {/* DLD Registry stats */}
                      {isDldOnly && (
                        <React.Fragment>
                          <SectionTitle accent={T.textMuted}>DLD Project Registry</SectionTitle>
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                            {n.totalProjects != null && <Stat label="Total" value={n.totalProjects} />}
                            {n.activeProjects != null && <Stat label="Active" value={n.activeProjects} color={T.green} />}
                            {n.completedProjects != null && <Stat label="Completed" value={n.completedProjects} color={T.textSecondary} />}
                          </div>
                          <div style={{ marginTop: 16, padding: "12px 14px", background: "rgba(148,163,184,0.06)", border: `1px solid ${T.border}`, borderRadius: 10, fontSize: 11, color: T.textMuted, lineHeight: 1.5 }}>
                            This community is in the official Dubai Land Department registry. Investment metrics (yield, PPSF, service charge, supply risk) will appear here once curation is complete. Data will be enriched using RERA filings, Bayut rental index, and Knight Frank research.
                          </div>
                        </React.Fragment>
                      )}

                      {/* Investment metrics (Verified) */}
                      {hasInvestment && (
                        <React.Fragment>
                          <SectionTitle>Investment Metrics</SectionTitle>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                            <Stat label="Gross Yield" value={n.grossYield ? parseFloat(n.grossYield).toFixed(1) + "%" : "—"} color={parseFloat(n.grossYield) >= 7 ? T.green : parseFloat(n.grossYield) >= 5 ? T.gold : T.textSecondary} hint="Annual rental / sale price" />
                            <Stat label="Net Yield" value={n.netYield ? parseFloat(n.netYield).toFixed(1) + "%" : "—"} hint="After service charges" />
                            <Stat label="Avg PPSF" value={n.avgPpsf ? "AED " + n.avgPpsf.toLocaleString() : "—"} color={T.white} hint="Current sale price/sqft" />
                            <Stat label="Service Charge" value={n.serviceCharge ? "AED " + n.serviceCharge : "—"} hint="Per sqft annually" />
                          </div>
                        </React.Fragment>
                      )}

                      {/* Pipeline (Verified) */}
                      {!isDldOnly && n.pipeline2026 && (
                        <React.Fragment>
                          <SectionTitle>Supply Pipeline</SectionTitle>
                          <div style={{ background: T.surfaceAlt, borderRadius: 10, padding: "14px 16px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                              <span style={{ fontSize: 11, color: T.textMuted }}>Units delivering in 2026</span>
                              <span style={{ fontSize: 14, color: T.white, fontWeight: 700, fontFamily: "'Fraunces',serif" }}>{n.pipeline2026?.toLocaleString()}</span>
                            </div>
                            <div style={{ height: 6, borderRadius: 3, background: T.border }}>
                              <div style={{ height: "100%", width: Math.min((n.pipeline2026 / 5000) * 100, 100) + "%", borderRadius: 3, background: n.supplyRisk === "High" ? T.red : n.supplyRisk === "Medium" ? T.gold : T.green, transition: "width 0.3s ease" }} />
                            </div>
                            <div style={{ fontSize: 10, color: T.textMuted, marginTop: 8 }}>
                              Supply risk: <span style={{ color: n.supplyRisk === "High" ? T.red : n.supplyRisk === "Medium" ? T.gold : T.green, fontWeight: 600 }}>{n.supplyRisk || "Unknown"}</span>
                              {n.supplyRisk === "High" && " — oversupply may pressure yields"}
                              {n.supplyRisk === "Low" && " — limited new supply supports pricing"}
                            </div>
                          </div>
                        </React.Fragment>
                      )}

                      {/* Amenities */}
                      {(n.hasSchool || n.hasHospital || n.hasMall || n.hasBeach || n.tenantProfile) && !isDldOnly && (
                        <React.Fragment>
                          <SectionTitle>Lifestyle & Amenities</SectionTitle>
                          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                            {n.hasSchool && <span style={{ fontSize: 11, padding: "6px 12px", borderRadius: 10, background: "rgba(99,102,241,0.1)", color: "#818CF8", border: "1px solid rgba(99,102,241,0.2)" }}>Schools nearby</span>}
                            {n.hasHospital && <span style={{ fontSize: 11, padding: "6px 12px", borderRadius: 10, background: "rgba(239,68,68,0.1)", color: T.red, border: "1px solid rgba(239,68,68,0.2)" }}>Hospital access</span>}
                            {n.hasMall && <span style={{ fontSize: 11, padding: "6px 12px", borderRadius: 10, background: "rgba(212,168,67,0.08)", color: T.gold, border: `1px solid ${T.border}` }}>Retail & malls</span>}
                            {n.hasBeach && <span style={{ fontSize: 11, padding: "6px 12px", borderRadius: 10, background: "rgba(20,184,166,0.1)", color: T.teal, border: "1px solid rgba(20,184,166,0.2)" }}>Waterfront</span>}
                          </div>
                        </React.Fragment>
                      )}

                      {/* Quick actions */}
                      <SectionTitle>Actions</SectionTitle>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                        <button type="button" onClick={() => { handleTabChange("Price History"); onClose(); }}
                          style={{ padding: "12px 14px", background: "rgba(212,168,67,0.08)", border: `1px solid ${T.border}`, borderRadius: 10, color: T.gold, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit',sans-serif", textAlign: "left" }}>
                          <div style={{ fontSize: 13, fontWeight: 700 }}>Price History →</div>
                          <div style={{ fontSize: 10, color: T.textMuted, marginTop: 2 }}>Monthly PPSF trend</div>
                        </button>
                        <button type="button" onClick={() => { handleTabChange("Yields"); onClose(); }}
                          style={{ padding: "12px 14px", background: "rgba(20,184,166,0.08)", border: "1px solid rgba(20,184,166,0.2)", borderRadius: 10, color: T.teal, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit',sans-serif", textAlign: "left" }}>
                          <div style={{ fontSize: 13, fontWeight: 700 }}>Yield Analysis →</div>
                          <div style={{ fontSize: 10, color: T.textMuted, marginTop: 2 }}>Rent vs sale comparisons</div>
                        </button>
                        <button type="button" onClick={() => { handleTabChange("Map"); onClose(); }}
                          style={{ padding: "12px 14px", background: "rgba(255,255,255,0.03)", border: `1px solid ${T.border}`, borderRadius: 10, color: T.textSecondary, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit',sans-serif", textAlign: "left" }}>
                          <div style={{ fontSize: 13, fontWeight: 700 }}>Community Map →</div>
                          <div style={{ fontSize: 10, color: T.textMuted, marginTop: 2 }}>Geo + transit overlay</div>
                        </button>
                        <button type="button" onClick={() => { handleTabChange("Projects"); onClose(); }}
                          style={{ padding: "12px 14px", background: "rgba(255,255,255,0.03)", border: `1px solid ${T.border}`, borderRadius: 10, color: T.textSecondary, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit',sans-serif", textAlign: "left" }}>
                          <div style={{ fontSize: 13, fontWeight: 700 }}>Projects →</div>
                          <div style={{ fontSize: 10, color: T.textMuted, marginTop: 2 }}>All developments in community</div>
                        </button>
                      </div>

                      {/* Data provenance */}
                      <div style={{ marginTop: 24, padding: "12px 14px", background: T.surfaceAlt, borderRadius: 10, fontSize: 10, color: T.textMuted, lineHeight: 1.5 }}>
                        Sources: Dubai Land Department · RERA Service Charges · Bayut Rental Index · RTA Metro Data · Knight Frank Research
                      </div>
                    </div>
                  </div>
                </React.Fragment>
              );
            };

            /* Unified card chooser */
            const NbhCard = ({ n }) => n.tier === "dld-registry" ? <NbhCardRegistry n={n} /> : <NbhCardVerified n={n} />;

            return (
              <div style={{ animation: "fadeUp 0.4s ease-out forwards" }}>

                {/* Tab header */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", marginBottom: 20, borderBottom: `1px solid ${T.border}`, flexWrap: "wrap", gap: 8 }}>
                  <div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: T.white, fontFamily: "'Fraunces',serif" }}>Neighbourhood Intelligence</div>
                    <div style={{ fontSize: 11, color: T.textMuted, marginTop: 3 }}>Community scorecards · Yield · Metro access · Supply risk · Schools · Lifestyle</div>
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    {/* View toggle */}
                    <div style={{ display: "flex", background: T.surfaceAlt, borderRadius: 8, border: `1px solid ${T.border}`, overflow: "hidden" }}>
                      {["grid", "table"].map(v => (
                        <button key={v} type="button" onClick={() => setNbhView(v)}
                          style={{ padding: "6px 14px", background: nbhView === v ? "rgba(212,168,67,0.15)" : "transparent", color: nbhView === v ? T.gold : T.textMuted, border: "none", cursor: "pointer", fontSize: 11, fontWeight: 600, fontFamily: "'Outfit',sans-serif", textTransform: "capitalize" }}>
                          {v}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Metro Blue Line alert */}
                <div style={{ background: "rgba(20,184,166,0.06)", border: "1px solid rgba(20,184,166,0.2)", borderRadius: 10, padding: "10px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: T.teal, flexShrink: 0, animation: "pulse 2s infinite", display: "inline-block" }} />
                  <div style={{ fontSize: 11, color: T.textSecondary }}>
                    <span style={{ color: T.teal, fontWeight: 700 }}>Metro Blue Line opening 2029</span> — 14 new stations · Properties within 700m historically see 20–30% value premium · Communities near Blue Line flagged below
                  </div>
                </div>

                {/* Smart filters */}
                <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: "14px 16px", marginBottom: 20 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    {/* Search */}
                    <div style={{ position: "relative", flex: "0 0 200px" }}>
                      {SvgIcons.Search({ width: 13, height: 13, style: { position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: T.textMuted, pointerEvents: "none" } })}
                      <input value={nbhSearch} onChange={e => setNbhSearch(e.target.value)} placeholder="Search communities..."
                        style={{ ...selStyle, paddingLeft: 30, paddingRight: 10, width: "100%", backgroundImage: "none" }} />
                    </div>
                    {/* Phase Tier-A: tier filter */}
                    <select value={nbhTierFilter} onChange={e => setNbhTierFilter(e.target.value)} style={selStyle}>
                      <option value="All">All Communities</option>
                      <option value="Verified">Verified Only</option>
                      <option value="Registry">DLD Registry Only</option>
                    </select>
                    {/* Tenant profile */}
                    <select value={nbhTypeFilter} onChange={e => setNbhTypeFilter(e.target.value)} style={selStyle}>
                      <option value="All">All Profiles</option>
                      <option>Families</option>
                      <option>Professionals</option>
                      <option>Luxury / HNWI</option>
                      <option>Short-Term Rental</option>
                      <option>Mixed</option>
                    </select>
                    {/* Yield filter */}
                    <select value={nbhYieldFilter} onChange={e => setNbhYieldFilter(e.target.value)} style={selStyle}>
                      <option value="All">All Yields</option>
                      <option value="7%+">7%+ High Yield</option>
                      <option value="5-7%">5–7% Mid Yield</option>
                      <option value="<5%">Under 5%</option>
                    </select>
                    {/* Supply risk */}
                    <select value={nbhRiskFilter} onChange={e => setNbhRiskFilter(e.target.value)} style={selStyle}>
                      <option value="All">All Risk Levels</option>
                      <option>Low</option>
                      <option>Medium</option>
                      <option>High</option>
                    </select>
                    {/* Sort */}
                    <select value={nbhSort} onChange={e => setNbhSort(e.target.value)} style={selStyle}>
                      <option value="yield">Sort: Yield High</option>
                      <option value="ppsf">Sort: PPSF High</option>
                      <option value="score">Sort: Score High</option>
                      <option value="name">Sort: A–Z</option>
                    </select>
                    <span style={{ fontSize: 11, color: T.textMuted, marginLeft: "auto" }}>
                      {filtered.length} communities
                    </span>
                    {(nbhSearch || nbhTypeFilter !== "All" || nbhYieldFilter !== "All" || nbhRiskFilter !== "All" || nbhTierFilter !== "All") && (
                      <button type="button" onClick={() => { setNbhSearch(""); setNbhTypeFilter("All"); setNbhYieldFilter("All"); setNbhRiskFilter("All"); setNbhTierFilter("All"); }}
                        style={{ background: "none", border: `1px solid ${T.border}`, borderRadius: 8, padding: "6px 12px", color: T.textMuted, fontSize: 11, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>
                        Clear
                      </button>
                    )}
                  </div>
                </div>

                {/* Compare panel */}
                {nbhCompare.length > 0 ? (
                  <div style={{ background: "rgba(212,168,67,0.06)", border: `1px solid rgba(212,168,67,0.2)`, borderRadius: 10, padding: "10px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: T.gold }}>Comparing:</span>
                    {nbhCompare.map(c => (
                      <span key={c} style={{ fontSize: 11, padding: "3px 10px", borderRadius: 20, background: "rgba(212,168,67,0.12)", color: T.gold }}>
                        {c} <button type="button" onClick={() => setNbhCompare(prev => prev.filter(x => x !== c))} style={{ background: "none", border: "none", color: T.gold, cursor: "pointer", fontSize: 11, marginLeft: 4 }}>×</button>
                      </span>
                    ))}
                    {nbhCompare.length < 2 && <span style={{ fontSize: 10, color: T.textMuted }}>Select one more community to compare</span>}
                  </div>
                ) : null}

                {/* No data state */}
                {rawNbh.length === 0 && (
                  <div style={{ background: "rgba(212,168,67,0.05)", border: `1px solid rgba(212,168,67,0.15)`, borderRadius: 12, padding: "48px 24px", textAlign: "center", marginBottom: 20 }}>
                    {SvgIcons.MapPin({ width: 40, height: 40, style: { color: T.textMuted, display: "inline-block", marginBottom: 14 } })}
                    <div style={{ fontSize: 16, fontWeight: 700, color: T.white, marginBottom: 8 }}>Community data not yet imported</div>
                    <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 4 }}>Import community scorecards from Admin → Data Manager → Communities</div>
                    <div style={{ fontSize: 11, color: T.textMuted, opacity: 0.7 }}>Each community needs: PPSF, yield, metro distance, schools, service charges, supply pipeline</div>
                  </div>
                )}

                {/* Grid view */}
                {nbhView === "grid" && filtered.length > 0 && (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14, marginBottom: 20 }}>
                    {filtered.map((n, i) => <NbhCard key={i} n={n} />)}
                  </div>
                )}

                {/* Table view */}
                {nbhView === "table" && filtered.length > 0 && (
                  <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, overflow: "hidden", marginBottom: 20 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1fr 1fr", padding: "10px 16px", background: T.surfaceAlt, borderBottom: `1px solid ${T.border}` }}>
                      {["Community", "Score", "Gross Yield", "Net Yield", "PPSF", "Svc Charge", "Supply Risk"].map((h, i) => (
                        <div key={i} style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, letterSpacing: 0.8, textTransform: "uppercase" }}>{h}</div>
                      ))}
                    </div>
                    {filtered.map((n, i) => (
                      <div key={i} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1fr 1fr", padding: "10px 16px", borderBottom: i < filtered.length - 1 ? `1px solid ${T.border}` : "none", background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)" }}
                        onMouseEnter={e => e.currentTarget.style.background = "rgba(212,168,67,0.04)"}
                        onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)"}>
                        <div style={{ fontSize: 13, color: T.white, fontWeight: 500 }}>{n.community || "—"}</div>
                        <div><ScoreBadge score={n.investmentScore} /></div>
                        <div style={{ fontSize: 13, color: parseFloat(n.grossYield) >= 7 ? T.green : T.gold, fontWeight: 700 }}>{n.grossYield ? parseFloat(n.grossYield).toFixed(1) + "%" : "—"}</div>
                        <div style={{ fontSize: 12, color: T.textSecondary }}>{n.netYield ? parseFloat(n.netYield).toFixed(1) + "%" : "—"}</div>
                        <div style={{ fontSize: 12, color: T.white }}>AED {(n.avgPpsf || 0).toLocaleString()}</div>
                        <div style={{ fontSize: 12, color: T.textMuted }}>AED {n.serviceCharge || "—"}/sqft</div>
                        <div><RiskBadge risk={n.supplyRisk} /></div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Detail drawer */}
                {selectedNbhd && (
                  <NbhDetailDrawer n={selectedNbhd} onClose={() => setSelectedNbhd && setSelectedNbhd(null)} />
                )}

                {/* Sources */}
                <div style={{ paddingTop: 12, borderTop: `1px solid ${T.border}`, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                  <span style={{ fontSize: 10, color: T.textMuted }}>Sources:</span>
                  {["Dubai Land Department", "RERA Service Charges", "Bayut Rental Index", "RTA Metro Data", "ValuStrat VPI", "Knight Frank Research"].map((s, i) => (
                    <span key={i} style={{ fontSize: 10, color: T.textMuted, padding: "2px 8px", borderRadius: 10, border: `1px solid ${T.border}`, background: T.surfaceAlt }}>{s}</span>
                  ))}
                </div>

              </div>
            );
}

export default NeighbourhoodsTab;
