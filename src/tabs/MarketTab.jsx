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
import { useMarketKpis, useMarketChart } from "../hooks/useMarketMetrics";

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

  const { data: firestoreKpis = [] } = useMarketKpis();
  const { data: firestoreChart = [] } = useMarketChart();

            /* ── Live market stats from Firestore ── */
            const stats = (() => {
              const live = (liveMarketData || []).filter(d => d.metric && d.value);
              return live.length > 0 ? live : firestoreKpis;
            })();
            const mktIsSeed = liveMarketData?.length === 0;
            const getStat = (metric) => {
              const exact = stats.find(s => s.metric === metric);
              if (exact) return exact;
              const lower = metric.toLowerCase();
              return stats.find(s => s.metric && s.metric.toLowerCase().includes(lower));
            };
            // Chart data — filter only year-based entries for bar chart
            const chartData = (firestoreChart.length > 0 ? firestoreChart : stats.filter(d => d.year && d.type === "annual"))
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
                {/* Sources panel */}
                <div style={{ paddingTop: 20, borderTop: `1px solid ${T.border}` }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: T.textSecondary, marginBottom: 12, letterSpacing: 1, textTransform: "uppercase" }}>Primary Sources  Click to Verify</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 8 }}>
                    {[
                      { name: "DLD Full Year 2025  Dubai Media Office", desc: "270,000+ transactions � AED 917B � investor base 193,100", url: "https://mediaoffice.ae/en/news/2026/january/12-01/dubais-real-estate-market-records-new-historic-milestone", tag: "DLD Official" },
                      { name: "DLD  AED 761B in 2024", desc: "226,000 transactions � AED 761B � +36% volume +20% value YoY", url: "https://dubailand.gov.ae/en/news-media/dubai-s-real-estate-sector-records-aed761-billion-in-transactions-in-2024", tag: "DLD Official" },
                      { name: "Gulf News  Dubai closes 2025 at AED 682.5B", desc: "Sales-only: 214,912 transactions � Q4 monthly records", url: "https://gulfnews.com/business/property/dubai-property-market-closes-2025-with-record-dh6825-billion-in-sales-1.500396068", tag: "Gulf News" },
                      { name: "Zawya  Dubai RE market hits AED 682.5B", desc: "Off-plan 62.6% � 50,974 mortgage deals � AED 179.26B mortgage value", url: "https://www.zawya.com/en/press-release/research-and-studies/dubai-real-estate-market-hits-aed-6825bln-with-214-912-transactions-in-2025-lnxen66w", tag: "Zawya" },
                      { name: "ValuStrat VPI  December 2025", desc: "AED 1,689/sqft citywide � +19.8% YoY � Villas +25.5%", url: "https://valustrat.com/products/vpi-dubai-residential-capital-values-december-2025", tag: "ValuStrat" },
                      { name: "REIDIN  UAE Residential Price Report", desc: "+12.88% YoY Dec 2025 � Villas +15.16% � Yield 6.55%", url: "https://reidin.com", tag: "REIDIN" },
                      { name: "Knight Frank  Dubai Residential Q3 2025", desc: "+10% YoY values � 46% delivery rate � 2026: +3%/+1%", url: "https://www.knightfrank.ae/newsroom/article/2025/11/dubai-residential-market-review-q3-2025", tag: "Knight Frank" },
                      { name: "BetterHomes  Dubai Residential FY2025", desc: "Off-plan 65% � 132,000 off-plan deals � AED 248B apts", url: "https://www.constructionweekonline.com/analysis/dubai-off-plan-sales-2025", tag: "BetterHomes" },
                      { name: "Cavendish Maxwell  Q3 2025", desc: "~98K units 2026 � 366K through 2028 � Q3 off-plan 76%", url: "https://cavendishmaxwell.com/insights/market-reports/residential/dubai-residential-market-performance-q3-2025", tag: "Cavendish Maxwell" },
                      { name: "DXB Analytics  Price Index 2026", desc: "FY2025: AED 1,863 avg PPSF � Jan 2026: AED 1,976", url: "https://www.dxbanalytics.com/blog/dubai-property-price-index-2026", tag: "DXB Analytics" },
                      { name: "Roya International  Dubai RE Report 2025", desc: "Full methodology: DLD + ValuStrat + REIDIN + Knight Frank", url: "https://royainternational.co.uk/pages/market-reports.php", tag: "Roya International" },
                      { name: "Global Property Guide  UAE 2026", desc: "Multi-source synthesis with yield benchmarks", url: "https://www.globalpropertyguide.com/middle-east/united-arab-emirates/price-history", tag: "Global Prop Guide" },
                      { name: "DLD 2020 Annual  Media Office", desc: "51,414 transactions � AED 175B � Covid year recovery", url: "https://mediaoffice.ae/en/news/2021/Feb/03-02/souq-dubai", tag: "DLD 2020" },
                      { name: "DLD 2021  Post-Covid Boom", desc: "84,196 transactions � AED 300B � +72% value YoY � Expo 2020 catalyst", url: "https://dubailand.gov.ae/en/news-media/dld-2021-achieved-exceptional-results-that-will-contribute-to-enabling-the-real-estate-sector-s-journey-towards-the-next-50-years/", tag: "DLD 2021" },
                      { name: "UAE Moments  2022 Record Year", desc: "122,658 transactions � AED 528B � first half-trillion year", url: "https://www.uaemoments.com/amp/dubais-real-estate-transactions-hit-a-record-high-in-2022-553424.html", tag: "DLD 2022" },
                      { name: "The National  2023 Record", desc: "166,400 transactions � AED 634B � +36% volume YoY", url: "https://www.thenationalnews.com/business/property/2024/02/07/dubais-real-estate-transactions-surge-17-to-record-16-million-in-2023/", tag: "DLD 2023" },
                    ].map(src => (
                      <a key={src.name} href={src.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
                        <div style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${T.border}`, borderRadius: 10, padding: "10px 12px" }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor = T.gold + "60"; e.currentTarget.style.background = "rgba(212,168,67,0.04)"; }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.background = "rgba(255,255,255,0.02)"; }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 5 }}>
                            <span style={{ fontSize: 11, fontWeight: 700, color: T.white, lineHeight: 1.4 }}>{src.name}</span>
                            <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 8, background: "rgba(212,168,67,0.1)", color: T.gold, whiteSpace: "nowrap", flexShrink: 0 }}>{src.tag}</span>
                          </div>
                          <div style={{ fontSize: 10, color: T.textMuted, marginBottom: 5 }}>{src.desc}</div>
                          <div style={{ fontSize: 10, color: T.gold }}>Open source �</div>
                        </div>
                      </a>
                    ))}
                  </div>
                  <div style={{ marginTop: 12, fontSize: 10, color: T.textMuted, lineHeight: 1.6 }}>
                    All data sourced from official DLD reports, independent research firms (ValuStrat, REIDIN, Knight Frank, Cavendish Maxwell), and market aggregators. Last updated: Session 7 � April 2026.
                  </div>
                </div>

              </div>
            );
}

export default MarketTab;
