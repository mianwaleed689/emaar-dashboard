/* eslint-disable */
/* ═══════════════════════════════════════════════════════════════════
   DXB ANALYTICS — NEIGHBOURHOODS TAB
   Extracted from EmaarDashboardV2.jsx
   Community intelligence: PPSF, yields, metro, schools, risk
   ═══════════════════════════════════════════════════════════════════ */

import React from "react";
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

function NeighbourhoodsTab({ nbhSearch, setNbhSearch, nbhTypeFilter, setNbhTypeFilter, nbhYieldFilter, setNbhYieldFilter, nbhRiskFilter, setNbhRiskFilter, nbhSort, setNbhSort, nbhView, setNbhView, nbhCompare, setNbhCompare, liveNeighbourhoods, liveCommunityROI, liveMarketData, handleTabChange, selectedNbhd, setSelectedNbhd }) {


            /* state moved to top level */

            /* ── Community data from Firestore ── */
            const rawNbhFirestore = liveMarketData?.filter?.(d => d.type === "community") || [];
            const rawNbh = rawNbhFirestore.length > 0 ? rawNbhFirestore : SEED_DATA.communities;
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

            /* ── Community card ── */
            const NbhCard = ({ n }) => {
              const isCompared = nbhCompare.includes(n.community);
              return (
                <div className="chart-box" style={{ padding: 16, position: "relative", transition: "transform 0.15s, box-shadow 0.15s", cursor: "default" }}
                  onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 32px rgba(0,0,0,0.3)"; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}>

                  {/* Header row */}
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: T.white, marginBottom: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{n.community || "—"}</div>
                      <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
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
                    <button type="button" onClick={() => handleTabChange("Price History")}
                      style={{ flex: 1, padding: "6px 0", background: "rgba(212,168,67,0.06)", border: `1px solid ${T.border}`, borderRadius: 7, color: T.gold, fontSize: 10, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>
                      Price History →
                    </button>
                    <button type="button" onClick={() => handleTabChange("Yields")}
                      style={{ flex: 1, padding: "6px 0", background: "rgba(20,184,166,0.06)", border: "1px solid rgba(20,184,166,0.2)", borderRadius: 7, color: T.teal, fontSize: 10, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>
                      Yields →
                    </button>
                    <button type="button"
                      onClick={() => setNbhCompare(c => isCompared ? c.filter(x => x !== n.community) : c.length < 2 ? [...c, n.community] : c)}
                      style={{ padding: "6px 10px", background: isCompared ? "rgba(212,168,67,0.15)" : "transparent", border: `1px solid ${isCompared ? "rgba(212,168,67,0.4)" : T.border}`, borderRadius: 7, color: isCompared ? T.gold : T.textMuted, fontSize: 10, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>
                      {isCompared ? "✓" : "+"}
                    </button>
                  </div>
                </div>
              );
            };

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
                    {(nbhSearch || nbhTypeFilter !== "All" || nbhYieldFilter !== "All" || nbhRiskFilter !== "All") && (
                      <button type="button" onClick={() => { setNbhSearch(""); setNbhTypeFilter("All"); setNbhYieldFilter("All"); setNbhRiskFilter("All"); }}
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
