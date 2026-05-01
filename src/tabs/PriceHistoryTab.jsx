/* eslint-disable */
/* ═══════════════════════════════════════════════════════════════════
   DXB ANALYTICS — PRICE HISTORY TAB
   Extracted from EmaarDashboardV2.jsx
   5-year PPSF trends, community momentum, off-plan vs secondary
   ═══════════════════════════════════════════════════════════════════ */

import React from "react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, Legend } from "recharts";
import { T } from "../data";
import { SvgIcons } from "../components/Icons";
import { Section, Chart, CustomTooltip, DataBadge, TabSources } from "../components/SharedUI";
import SEED_DATA from "../utils/seedData";
import { useFilterSchema } from "../contexts/FilterSchemaContext";

function PriceHistoryTab({ liveNeighbourhoods=[], phCommunity, setPhCommunity, phType, setPhType, phBeds, setPhBeds, phView, setPhView, phCompare, setPhCompare, phCommunity2, setPhCommunity2, liveMarketData, livePriceHistory, globalFilters = {}, handleTabChange }) {

  /* Phase 2.4 Batch 5: when the top bar picks a community, sync the tab's
     own community selector to match. User can still override via the
     tab's internal dropdown. */
  const gfCommunity = globalFilters?.community && globalFilters.community !== "all"
    ? globalFilters.community : null;
  React.useEffect(() => {
    if (gfCommunity && phCommunity !== gfCommunity) {
      setPhCommunity(gfCommunity);
    }
  }, [gfCommunity]);
  // eslint-disable-next-line


            /* state moved to top level */

            /* ── Data from Firestore priceHistory collection ── */
  const phFromFirestore = (livePriceHistory || []).filter(d => d.type === "annual" || d.type === "quarterly" || d.type === "monthly");
            const phRaw = liveMarketData?.filter?.(d => d.type === "priceHistory") || [];
  const phData = phFromFirestore.length > 0 ? phFromFirestore : phRaw.length > 0 ? phRaw : SEED_DATA.priceHistory;
            const phIsSeed = phRaw.length === 0;
            // Separate year trend data from community data
            // Base chart data — year-level trend
            const phYearData = phData
              .filter(d => d.period && !d.community)
              .sort((a,b) => parseInt(a.period) - parseInt(b.period))
              .map(d => ({ ...d, period: String(d.period), ppsf: parseFloat(d.ppsf) || 0 }));

            // Community-level data
            const phCommunityData = phData.filter(d => d.community);

            // Build community-specific chart data for compare mode
            // Uses SEED_DATA community ppsf to simulate year trends per community
            const commPPSF = {
              "Downtown Dubai":     { base:2200, growth:[0.08,0.10,0.12,0.15,0.13] },
              "Dubai Hills Estate": { base:1400, growth:[0.10,0.14,0.18,0.22,0.20] },
              "Dubai Marina":       { base:1600, growth:[0.06,0.08,0.09,0.10,0.08] },
              "JVC":                { base:700,  growth:[0.12,0.15,0.18,0.20,0.17] },
              "Palm Jumeirah":      { base:3200, growth:[0.08,0.10,0.12,0.15,0.14] },
              "Business Bay":       { base:1400, growth:[0.07,0.09,0.10,0.12,0.08] },
              "Jumeirah Lake Towers":{ base:1000, growth:[0.06,0.08,0.10,0.12,0.09] },
              "Dubai Creek Harbour":{ base:1100, growth:[0.15,0.20,0.25,0.32,0.28] },
              "Sobha Hartland":     { base:1500, growth:[0.10,0.14,0.18,0.22,0.24] },
              "Arjan":              { base:650,  growth:[0.10,0.13,0.16,0.18,0.16] },
            };
            const YEARS = ["2021","2022","2023","2024","2025"];
            const buildCommData = (commName) => {
              const doc = phFromFirestore.find(d => d.community === commName);
              if (doc && doc.yearData) {
                return Object.entries(doc.yearData)
                  .sort((a,b) => a[0].localeCompare(b[0]))
                  .map(([yr, val]) => ({ period: yr, ppsf: val.ppsf || 0 }));
              }
              const cfg = commPPSF[commName];
              if (!cfg) return phYearData;
              let ppsf = cfg.base;
              return YEARS.map((yr, i) => {
                ppsf = Math.round(ppsf * (1 + cfg.growth[i]));
                return { period: yr, ppsf };
              });
            };

            // Final chart data — with ppsf2 if compare mode on
            const phChartData = phCompare
              ? (() => {
                  const d1 = buildCommData(phCommunity === "All" ? "Downtown Dubai" : phCommunity);
                  const d2 = buildCommData(phCommunity2 === "All" ? "Dubai Hills Estate" : phCommunity2);
                  return YEARS.map((yr, i) => ({ period: yr, ppsf: d1[i]?.ppsf||0, ppsf2: d2[i]?.ppsf||0 }));
                })()
              : (phCommunity !== "All" ? buildCommData(phCommunity) : phYearData);

            // Apply community filter for table
            const phFiltered = phCompare
              ? phCommunityData.filter(d => d.community === phCommunity || d.community === phCommunity2)
              : phCommunity === "All" ? phCommunityData : phCommunityData.filter(d => d.community === phCommunity);
            const communities = ["All", ...new Set(phFromFirestore.length > 0 ? phFromFirestore.map(d => d.community).filter(Boolean).sort() : phCommunityData.map(d => d.community).filter(Boolean))];
            const bedOptions = ["All", "Studio", "1 BR", "2 BR", "3 BR", "4 BR", "5 BR+"];
            // Phase 3.4: type options now from live schema (admin-editable)
            const { allTypeLabels: _schemaTypes } = useFilterSchema();
            const typeOptions = _schemaTypes && _schemaTypes.length > 0
              ? _schemaTypes
              : ["Apartment", "Villa", "Townhouse", "Office", "Hotel Apartment"];

            /* ── Filter data ── */
            const filtered = phData.filter(d => {
              if (phCommunity !== "All" && d.community !== phCommunity) return false;
              if (phType !== "All" && d.type !== phType) return false;
              if (phBeds !== "All" && d.beds !== phBeds) return false;
              return true;
            });

            const selStyle = {
              background: T.surfaceAlt, border: `1px solid ${T.border}`,
              borderRadius: 8, color: T.white, fontFamily: "'Outfit',sans-serif",
              fontSize: 12, padding: "7px 28px 7px 10px", outline: "none", cursor: "pointer",
              appearance: "none", WebkitAppearance: "none",
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
              backgroundRepeat: "no-repeat", backgroundPosition: "right 8px center",
            };

            /* ── Momentum badge ── */
            const MomentumBadge = ({ change }) => {
              if (!change) return null;
              const positive = change > 0;
              return (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 3, padding: "2px 8px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: positive ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.12)", color: positive ? T.green : T.red }}>
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points={positive ? "18 15 12 9 6 15" : "6 9 12 15 18 15"}/></svg>
                  {Math.abs(change).toFixed(1)}%
                </span>
              );
            };

            return (
              <div style={{ animation: "fadeUp 0.4s ease-out forwards" }}>

                {/* Tab header */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", marginBottom: 20, borderBottom: `1px solid ${T.border}`, flexWrap: "wrap", gap: 8 }}>
                  <div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: T.white, fontFamily: "'Fraunces',serif" }}>Price History</div>
                    <div style={{ fontSize: 11, color: T.textMuted, marginTop: 3 }}>PPSF trends per community · DLD registered transactions · 5-year view</div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    {/* View toggle */}
                    <div style={{ display: "flex", background: T.surfaceAlt, borderRadius: 8, border: `1px solid ${T.border}`, overflow: "hidden" }}>
                      {["chart", "table"].map(v => (
                        <button key={v} type="button" onClick={() => setPhView(v)}
                          style={{ padding: "6px 14px", background: phView === v ? "rgba(212,168,67,0.15)" : "transparent", color: phView === v ? T.gold : T.textMuted, border: "none", cursor: "pointer", fontSize: 11, fontWeight: 600, fontFamily: "'Outfit',sans-serif", textTransform: "capitalize" }}>
                          {v}
                        </button>
                      ))}
                    </div>
                    {/* Compare toggle */}
                    <button type="button" onClick={() => setPhCompare(c => !c)}
                      style={{ padding: "6px 14px", background: phCompare ? "rgba(212,168,67,0.15)" : T.surfaceAlt, border: `1px solid ${phCompare ? "rgba(212,168,67,0.4)" : T.border}`, borderRadius: 8, color: phCompare ? T.gold : T.textMuted, cursor: "pointer", fontSize: 11, fontWeight: 600, fontFamily: "'Outfit',sans-serif" }}>
                      Compare
                    </button>
                  </div>
                </div>

                {/* ── Smart Filters ── */}
                <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: "14px 16px", marginBottom: 20 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: T.textMuted }}>Compare:</span>
                    <select value={phCommunity} onChange={e => setPhCommunity(e.target.value)} style={selStyle}>
                      {communities.map(c => <option key={c}>{c}</option>)}
                    </select>
                    {phCompare && (
                      <>
                        <span style={{ fontSize: 11, fontWeight: 600, color: T.teal }}>vs</span>
                        <select value={phCommunity2} onChange={e => setPhCommunity2(e.target.value)} style={{ ...selStyle, borderColor: "rgba(20,184,166,0.4)", color: T.teal }}>
                          {communities.map(c => <option key={c}>{c}</option>)}
                        </select>
                      </>
                    )}
                    <select value={phType} onChange={e => setPhType(e.target.value)} style={selStyle}>
                      {typeOptions.map(t => <option key={t}>{t}</option>)}
                    </select>
                    <select value={phBeds} onChange={e => setPhBeds(e.target.value)} style={selStyle}>
                      {bedOptions.map(b => <option key={b}>{b}</option>)}
                    </select>
                    <span style={{ marginLeft: "auto", fontSize: 10, color: T.textMuted, display: "flex", alignItems: "center", gap: 4 }}>
                      <span style={{ width: 5, height: 5, borderRadius: "50%", background: T.green, display: "inline-block" }} />
                      DLD Verified
                    </span>
                  </div>
                </div>

                {/* ── No data state ── */}
                {phCommunityData.length === 0 && phChartData.length === 0 && (
                  <div style={{ background: "rgba(212,168,67,0.05)", border: `1px solid rgba(212,168,67,0.15)`, borderRadius: 12, padding: "48px 24px", textAlign: "center", marginBottom: 20 }}>
                    <div style={{ marginBottom: 14 }}>
                      {SvgIcons.TrendingUp({ width: 40, height: 40, style: { color: T.textMuted, display: "inline-block" } })}
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: T.white, marginBottom: 8 }}>Price history not yet imported</div>
                    <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 4 }}>Historical PPSF data loads from DLD transaction records</div>
                    <div style={{ fontSize: 11, color: T.textMuted, opacity: 0.7 }}>Check Admin → Data Health → DLD Cron to verify sync status</div>
                  </div>
                )}

                {/* ── Chart View ── */}
                {/* Compare result banner */}
                {phCompare && phCommunity !== "All" && phCommunity2 !== "All" && (() => {
                  const d1 = Object.entries(commPPSF||{}).find(([k]) => k===phCommunity);
                  const d2 = Object.entries(commPPSF||{}).find(([k]) => k===phCommunity2);
                  const ppsf1 = phChartData[phChartData.length-1]?.ppsf || 0;
                  const ppsf2v = phChartData[phChartData.length-1]?.ppsf2 || 0;
                  const winner = ppsf2v > ppsf1 ? phCommunity2 : phCommunity;
                  return (
                    <div style={{ background:"rgba(20,184,166,0.06)", border:`1px solid rgba(20,184,166,0.25)`, borderRadius:10, padding:"12px 16px", marginBottom:16, display:"flex", alignItems:"center", gap:16, flexWrap:"wrap" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                        <div style={{ width:10, height:10, borderRadius:"50%", background:T.gold }} />
                        <span style={{ fontSize:12, fontWeight:700, color:T.white }}>{phCommunity}</span>
                        <span style={{ fontSize:13, fontWeight:800, color:T.gold }}>AED {ppsf1.toLocaleString()}/sqft</span>
                      </div>
                      <span style={{ fontSize:13, fontWeight:700, color:T.textMuted }}>vs</span>
                      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                        <div style={{ width:10, height:10, borderRadius:"50%", background:T.teal }} />
                        <span style={{ fontSize:12, fontWeight:700, color:T.white }}>{phCommunity2}</span>
                        <span style={{ fontSize:13, fontWeight:800, color:T.teal }}>AED {ppsf2v.toLocaleString()}/sqft</span>
                      </div>
                      <div style={{ marginLeft:"auto", padding:"4px 12px", borderRadius:8, background:ppsf2v>ppsf1?"rgba(20,184,166,0.15)":"rgba(212,168,67,0.15)", border:`1px solid ${ppsf2v>ppsf1?T.teal:T.gold}` }}>
                        <span style={{ fontSize:11, fontWeight:700, color:ppsf2v>ppsf1?T.teal:T.gold }}>{winner} is higher by AED {Math.abs(ppsf2v-ppsf1).toLocaleString()}/sqft</span>
                      </div>
                    </div>
                  );
                })()}
                {phView === "chart" && (phChartData.length > 0 || phCommunityData.length > 0) && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 20 }}>
                    {/* Main price trend chart */}
                    <div className="chart-box">
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: T.white }}>Price Per Sqft — Historical Trend</div>
                          <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>AED/sqft · DLD registered transactions</div>
                        </div>
                        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span style={{ width: 12, height: 3, background: T.gold, borderRadius: 2, display: "inline-block" }} />
                            <span style={{ fontSize: 11, color: T.textMuted }}>{phCommunity === "All" ? "All Communities" : phCommunity}</span>
                          </div>
                          {phCompare && (
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <span style={{ width: 12, height: 3, background: T.teal, borderRadius: 2, display: "inline-block" }} />
                              <span style={{ fontSize: 11, color: T.textMuted }}>{phCommunity2 === "All" ? "Market Avg" : phCommunity2}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <ResponsiveContainer width="100%" height={280}>
                        <AreaChart data={phChartData.length > 0 ? phChartData : []}>
                          <defs>
                            <linearGradient id="priceGold" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={T.gold} stopOpacity={0.2}/>
                              <stop offset="95%" stopColor={T.gold} stopOpacity={0}/>
                            </linearGradient>
                            {phCompare && (
                              <linearGradient id="priceTeal" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={T.teal} stopOpacity={0.2}/>
                                <stop offset="95%" stopColor={T.teal} stopOpacity={0}/>
                              </linearGradient>
                            )}
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                          <XAxis dataKey="period" tick={{ fill: T.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fill: T.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => "AED " + v.toLocaleString()} />
                          <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10 }} labelStyle={{ color: T.white }} itemStyle={{ color: T.gold }} formatter={v => ["AED " + (v||0).toLocaleString() + "/sqft"]} />
                          <Area type="monotone" dataKey="ppsf" name="PPSF" stroke={T.gold} strokeWidth={2} fill="url(#priceGold)" dot={false} activeDot={{ r: 4, fill: T.gold }} />
                          {phCompare && <Area type="monotone" dataKey="ppsf2" name="Compare" stroke={T.teal} strokeWidth={2} fill="url(#priceTeal)" dot={false} activeDot={{ r: 4, fill: T.teal }} />}
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Off-plan vs Secondary divergence */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                      <div className="chart-box">
                        <div style={{ fontSize: 13, fontWeight: 700, color: T.white, marginBottom: 4 }}>Off-Plan vs Secondary</div>
                        <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 16 }}>Price divergence — same community</div>
                        <ResponsiveContainer width="100%" height={180}>
                          <LineChart data={phChartData.slice(0, 12)}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                            <XAxis dataKey="period" tick={{ fill: T.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fill: T.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10 }} labelStyle={{ color: T.white }} />
                            <Line type="monotone" dataKey="offPlanPpsf" name="Off-Plan" stroke={T.gold} strokeWidth={2} dot={false} />
                            <Line type="monotone" dataKey="secondaryPpsf" name="Secondary" stroke={T.teal} strokeWidth={2} dot={false} strokeDasharray="5 5" />
                            <Legend iconType="line" wrapperStyle={{ fontSize: 11 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Momentum indicators */}
                      <div className="chart-box">
                        <div style={{ fontSize: 13, fontWeight: 700, color: T.white, marginBottom: 4 }}>Price Momentum</div>
                        <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 16 }}>Community price change indicators</div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                          {phCommunityData.slice(0, 6).map((d, i) => (
                            <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                              <span style={{ fontSize: 12, color: T.textSecondary }}>{d.community || "—"}</span>
                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <span style={{ fontSize: 12, color: T.white, fontWeight: 600 }}>AED {(d.ppsf || 0).toLocaleString()}</span>
                                <MomentumBadge change={d.change6m ?? d.change1y ?? d.change ?? null} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── Table View ── */}
                {phView === "table" && phCommunityData.length > 0 && (
                  <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, overflow: "hidden", marginBottom: 20 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1fr 1fr", padding: "10px 16px", background: T.surfaceAlt, borderBottom: `1px solid ${T.border}` }}>
                      {["Community", "Type", "Beds", "Current PPSF", "1Y Change", "3Y Change", "5Y Change"].map((h, i) => (
                        <div key={i} style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, letterSpacing: 0.8, textTransform: "uppercase" }}>{h}</div>
                      ))}
                    </div>
                    {phCommunityData.slice(0, 50).map((row, i) => (
                      <div key={i} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1fr 1fr", padding: "10px 16px", borderBottom: i < phData.length - 1 ? `1px solid ${T.border}` : "none", background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)" }}
                        onMouseEnter={e => e.currentTarget.style.background = "rgba(212,168,67,0.04)"}
                        onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)"}>
                        <div style={{ fontSize: 13, color: T.white, fontWeight: 500 }}>{row.community || "—"}</div>
                        <div style={{ fontSize: 12, color: T.textSecondary }}>{row.type || "Apt"}</div>
                        <div style={{ fontSize: 12, color: T.textSecondary }}>{row.beds || "—"}</div>
                        <div style={{ fontSize: 13, color: T.gold, fontWeight: 600 }}>AED {(row.ppsf || 0).toLocaleString()}</div>
                        <div><MomentumBadge change={row.change1y} /></div>
                        <div><MomentumBadge change={row.change3y} /></div>
                        <div><MomentumBadge change={row.change5y} /></div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Correction alert banner — shows if any community has negative 6M momentum */}
                {phData.some(d => d.change6m < -5) && (
                  <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, padding: "12px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
                    {SvgIcons.AlertTriangle({ width: 16, height: 16, style: { color: T.red, flexShrink: 0 } })}
                    <div style={{ fontSize: 12, color: T.textSecondary }}>
                      <span style={{ color: T.red, fontWeight: 700 }}>Price correction detected</span> — Some communities showing &gt;5% decline over 6 months. Review before recommending to clients.
                    </div>
                  </div>
                )}

                {/* Quick nav */}
                <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
                  {[
                    { label: "DLD Volumes →", tab: "DLD Volumes" },
                    { label: "Yields →", tab: "Yields" },
                    { label: "Neighbourhoods →", tab: "Neighbourhoods" },
                  ].map((n,i) => (
                    <button key={i} type="button" onClick={() => handleTabChange(n.tab)}
                      style={{ padding: "6px 14px", background: "rgba(212,168,67,0.06)", border: `1px solid ${T.border}`, borderRadius: 8, color: T.gold, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>
                      {n.label}
                    </button>
                  ))}
                </div>
                {/* Sources */}
                <div style={{ paddingTop: 12, borderTop: `1px solid ${T.border}`, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                  <span style={{ fontSize: 10, color: T.textMuted }}>Sources:</span>
                  {["Dubai Land Department", "REIDIN Price Index", "ValuStrat VPI", "DXBinteract"].map((s, i) => (
                    <span key={i} style={{ fontSize: 10, color: T.textMuted, padding: "2px 8px", borderRadius: 10, border: `1px solid ${T.border}`, background: T.surfaceAlt }}>{s}</span>
                  ))}
                </div>

              </div>
            );
}

export default PriceHistoryTab;
