/* eslint-disable */
/* ═══════════════════════════════════════════════════════════════════
   DXB ANALYTICS — MARKET TAB
   Dubai macro view — market size, transactions, forecasts, analyst reports
   ═══════════════════════════════════════════════════════════════════ */

import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell } from "recharts";
import { T } from "../data";
import { SvgIcons } from "../components/Icons";
import { Section, Chart, CustomTooltip, ForecastCard, DataBadge, TabSources } from "../components/SharedUI";
import SEED_DATA from "../utils/seedData";

function MarketTab({ liveMarketData, allDevelopers, expandedForecast, setExpandedForecast, handleTabChange }) {


            /* ── Stat Card ── */
            const MktStat = ({ label, value, change, positive, onClick }) => (
              <div className="kpi-card" onClick={onClick} style={{ cursor: onClick ? "pointer" : "default" }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>{label}</div>
                <div style={{ fontFamily: "'Fraunces', serif", fontSize: 24, fontWeight: 800, color: T.white, lineHeight: 1.1, marginBottom: 6 }}>{value || "—"}</div>
                {change && (
                  <div style={{ fontSize: 11, display: "flex", alignItems: "center", gap: 4, color: positive === false ? T.red : T.green }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points={positive === false ? "18 15 12 9 6 15" : "6 9 12 15 18 15"}/></svg>
                    {change}
                  </div>
                )}
              </div>
            );

            /* ── Forecast Card ── */
            const ForecastCard = ({ firm, forecast, detail, color }) => {
              const isExp = expandedForecast === firm;
              return (
                <div className="chart-box" style={{ borderTop: `3px solid ${color}`, cursor: "pointer" }} onClick={() => setExpandedForecast(isExp ? null : firm)}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color, fontFamily: "'Fraunces',serif" }}>{firm}</div>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={T.textMuted} strokeWidth="2" strokeLinecap="round"><polyline points={isExp ? "18 15 12 9 6 15" : "6 9 12 15 18 15"}/></svg>
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: T.white, marginBottom: 6 }}>{forecast}</div>
                  {isExp && <div style={{ fontSize: 12, color: T.textSecondary, lineHeight: 1.7, marginTop: 8, paddingTop: 8, borderTop: `1px solid ${T.border}` }}>{detail}</div>}
                </div>
              );
            };

            /* ── Live market stats from Firestore ── */
            const stats = (() => {
              const live = (liveMarketData || []).filter(d => d.metric && d.value);
              return live.length > 0 ? live : SEED_DATA.market;
            })();
            const mktIsSeed = liveMarketData?.length === 0;
            const getStat = (metric) => {
              const exact = stats.find(s => s.metric === metric);
              if (exact) return exact;
              const lower = metric.toLowerCase();
              return stats.find(s => s.metric && s.metric.toLowerCase().includes(lower));
            };
            // Chart data — filter only year-based entries for bar chart
            const chartData = stats.filter(d => d.year && d.type === "annual")
              .sort((a,b) => parseInt(a.year) - parseInt(b.year))
              .map(d => ({ year: String(d.year), value: parseFloat(d.value) || 0 }));

            return (
              <div style={{ animation: "fadeUp 0.4s ease-out forwards" }}>

                {/* Tab header */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", marginBottom: 20, borderBottom: `1px solid ${T.border}`, flexWrap: "wrap", gap: 8 }}>
                  <div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: T.white, fontFamily: "'Fraunces',serif" }}>Dubai Real Estate Market</div>
                    <div style={{ fontSize: 11, color: T.textMuted, marginTop: 3 }}>Macro view — Official DLD data · REIDIN · ValuStrat</div>
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {["Dubai Land Department", "REIDIN", "ValuStrat", "Knight Frank"].map((s, i) => (
                      <span key={i} style={{ fontSize: 10, padding: "3px 10px", borderRadius: 20, border: `1px solid ${T.border}`, color: T.textMuted, background: T.surfaceAlt }}>{s}</span>
                    ))}
                  </div>
                </div>

                {/* Seed badge */}
                {mktIsSeed && (
                  <div style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 14px", borderRadius:8, background:"rgba(212,168,67,0.06)", border:`1px solid rgba(212,168,67,0.2)`, marginBottom:12 }}>
                    <span style={{width:6,height:6,borderRadius:"50%",background:T.gold,display:"inline-block"}} />
                    <span style={{fontSize:11,color:T.textMuted}}><span style={{color:T.gold,fontWeight:700}}>Research-based seed data</span> — DLD Annual Report 2025, REIDIN Dec 2025, ValuStrat · Replace via Admin → Data Manager</span>
                  </div>
                )}
                {/* ── KPI Grid ── */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(175px, 1fr))", gap: 12, marginBottom: 28 }}>
                  <MktStat label="Total Market Value"
                    value={getStat("Total Market Value")?.value || "—"}
                    change={getStat("Total Market Value")?.change}
                    onClick={() => handleTabChange("DLD Volumes")} />
                  <MktStat label="Total Transactions"
                    value={getStat("Total Transactions")?.value || "—"}
                    change={getStat("Total Transactions")?.change}
                    onClick={() => handleTabChange("DLD Volumes")} />
                  <MktStat label="Off-Plan Share"
                    value={getStat("Off-Plan Share")?.value || "—"}
                    change={getStat("Off-Plan Share")?.change} />
                  <MktStat label="Units Launched"
                    value={getStat("Units Launched")?.value || "—"}
                    change={getStat("Units Launched")?.change} />
                  <MktStat label="Mortgage Transactions"
                    value={getStat("Mortgage Transactions")?.value || "—"}
                    change={getStat("Mortgage Transactions")?.change} />
                  <MktStat label="Investor Base"
                    value={getStat("Investor Base")?.value || "—"}
                    change={getStat("Investor Base")?.change} />
                  <MktStat label="Price Growth YoY"
                    value={getStat("Price Growth")?.value || "—"}
                    change={getStat("Price Growth")?.change} />
                  <MktStat label="Women Investors"
                    value={getStat("Women Investors")?.value || "—"}
                    change={getStat("Women Investors")?.change} />
                </div>

                {/* ── No data state ── */}
                {stats.length === 0 && (
                  <div style={{ background: "rgba(212,168,67,0.05)", border: `1px solid rgba(212,168,67,0.15)`, borderRadius: 12, padding: "20px 24px", marginBottom: 24, display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: T.gold, animation: "pulse 2s infinite", flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: T.gold, marginBottom: 4 }}>Market data not yet imported</div>
                      <div style={{ fontSize: 12, color: T.textMuted }}>Go to Admin → Market Intelligence → Update Stats to import official DLD figures.</div>
                    </div>
                  </div>
                )}

                {/* ── 2-column layout: Sales Trend Chart + Market Split ── */}
                <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 16, marginBottom: 24 }}>

                  {/* Sales trend - bar chart from Recharts */}
                  <div className="chart-box">
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.white, marginBottom: 4 }}>Dubai Total Sales Value (AED Billions)</div>
                    <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 16 }}>Historical growth trajectory · DLD Official</div>
                    {chartData?.length > 0
                      ? (
                        <ResponsiveContainer width="100%" height={220}>
                          <BarChart data={chartData.length > 0 ? chartData : []}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                            <XAxis dataKey="year" tick={{ fill: T.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fill: T.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10 }} labelStyle={{ color: T.white }} itemStyle={{ color: T.gold }} />
                            <Bar dataKey="value" name="AED B" radius={[6,6,0,0]} fill={T.gold} barSize={32} />
                          </BarChart>
                        </ResponsiveContainer>
                      )
                      : (
                        <div style={{ height: 220, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 8 }}>
                          <div style={{ color: T.textMuted, fontSize: 12 }}>Chart loads with historical data</div>
                          <div style={{ fontSize: 11, color: T.textMuted, opacity: 0.6 }}>Import via Admin → Market Intelligence</div>
                        </div>
                      )
                    }
                  </div>

                  {/* Market split breakdown */}
                  <div className="chart-box">
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.white, marginBottom: 4 }}>Market Composition</div>
                    <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 20 }}>Off-plan vs secondary · DLD</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                      {[
                        { label: "Off-Plan", pct: getStat("Off-Plan Share")?.numericValue || 63, color: T.gold },
                        { label: "Secondary Market", pct: 100 - (getStat("Off-Plan Share")?.numericValue || 63), color: T.teal },
                        { label: "Cash Transactions", pct: getStat("Cash Share")?.numericValue || 55, color: T.green },
                        { label: "Mortgage Transactions", pct: getStat("Mortgage Share")?.numericValue || 45, color: T.blue },
                      ].map((item, i) => (
                        <div key={i}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                            <span style={{ fontSize: 12, color: T.textSecondary }}>{item.label}</span>
                            <span style={{ fontSize: 12, color: T.white, fontWeight: 700 }}>{item.pct}%</span>
                          </div>
                          <div style={{ height: 6, borderRadius: 3, background: T.border }}>
                            <div style={{ height: "100%", width: `${item.pct}%`, borderRadius: 3, background: item.color, transition: "width 1s ease" }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* ── Market Indicators Grid ── */}
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: T.white, fontFamily: "'Fraunces',serif", marginBottom: 4 }}>Key Market Indicators</div>
                  <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 16 }}>Structural metrics shaping Dubai's real estate future</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 10 }}>
                    {[
                      { k: "Population Target", v: getStat("Population Target")?.value || "—" },
                      { k: "Price Cycle Duration", v: getStat("Price Cycle")?.value || "—" },
                      { k: "Active Developers", v: getStat("Active Developers")?.value || (allDevelopers?.length > 0 ? allDevelopers.length + " registered" : "—") },
                      { k: "Units Pipeline", v: getStat("2026 Pipeline")?.value || "—" },
                      { k: "REIDIN Price Growth", v: getStat("REIDIN Growth")?.value || "—" },
                      { k: "Nationalities Investing", v: getStat("Nationalities")?.value || "—" },
                    ].map(({ k, v }, i) => (
                      <div key={i} style={{ padding: "14px 16px", background: T.surfaceAlt, borderRadius: 12, border: `1px solid ${T.border}` }}>
                        <div style={{ fontSize: 9.5, fontWeight: 700, color: T.textMuted, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 6 }}>{k}</div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: T.white, fontFamily: "'Fraunces',serif" }}>{v}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ── 2026 Analyst Forecasts ── */}
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: T.white, fontFamily: "'Fraunces',serif", marginBottom: 4 }}>2026 Analyst Forecasts</div>
                  <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 16 }}>Knight Frank · CW Core · Fitch Ratings — Click each to expand</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
                    <ForecastCard firm="Knight Frank" color={T.gold}
                      forecast="+3% prime / +1% mainstream"
                      detail="Knight Frank's 2026 Dubai Residential Forecast projects prime property appreciation of +3% and mainstream market growth of ~1%. Dubai is entering a more mature, sustainable growth cycle after two years of double-digit gains. Key tailwinds: continued HNWI inflows, Golden Visa demand, Expo City activation." />
                    <ForecastCard firm="CW Core" color={T.teal}
                      forecast="5–8% appreciation"
                      detail="Cushman & Wakefield Core projects 5–8% price appreciation for 2026, a slowdown from 12–22% in 2024–25. The massive 2026 pipeline (~120K units) acts as a price moderator, though strong end-user demand and low mortgage penetration are supportive. Off-plan expected to stay 60–65% of volume." />
                    <ForecastCard firm="Fitch Ratings" color={T.orange}
                      forecast="Stable / Watch"
                      detail="Fitch maintained a Stable Outlook for UAE developers, citing strong backlogs and recurring revenue as key buffers. However, the 120K+ unit pipeline in 2026 could create oversupply in affordable segments. Premium developer backlogs provide earnings visibility even in a correction scenario." />
                  </div>
                </div>

                {/* Quick nav */}
                <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
                  {[
                    { label: "DLD Volumes →", tab: "DLD Volumes" },
                    { label: "Price History →", tab: "Price History" },
                    { label: "Neighbourhoods →", tab: "Neighbourhoods" },
                    { label: "Developer Health →", tab: "Developer Health" },
                  ].map((n,i) => (
                    <button key={i} type="button" onClick={() => handleTabChange(n.tab)}
                      style={{ padding: "6px 14px", background: "rgba(212,168,67,0.06)", border: `1px solid ${T.border}`, borderRadius: 8, color: T.gold, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>
                      {n.label}
                    </button>
                  ))}
                </div>
                {/* Data sources */}
                <div style={{ paddingTop: 16, borderTop: `1px solid ${T.border}`, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                  <span style={{ fontSize: 10, color: T.textMuted }}>Sources:</span>
                  {["Dubai Land Department", "REIDIN Dec 2025", "ValuStrat Q4 2025", "Knight Frank", "CW Core", "Fitch Ratings", "Gulf News Property"].map((s, i) => (
                    <span key={i} style={{ fontSize: 10, color: T.textMuted, padding: "2px 8px", borderRadius: 10, border: `1px solid ${T.border}`, background: T.surfaceAlt }}>{s}</span>
                  ))}
                </div>

              </div>
            );
}

export default MarketTab;
