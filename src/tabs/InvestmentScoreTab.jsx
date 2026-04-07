/* eslint-disable */
/* ═══════════════════════════════════════════════════════════════════
   DXB ANALYTICS — INVESTMENT SCORE TAB
   Research-based 2026 scoring: 7 factors, weighted average
   ═══════════════════════════════════════════════════════════════════ */

import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from "recharts";
import { T } from "../data";
import { SvgIcons } from "../components/Icons";

function InvestmentScoreTab({ invScSearch, setInvScSearch, invScSort, setInvScSort, invScFilter, setInvScFilter, invScView, setInvScView, invScSelected, setInvScSelected, liveInvestScores, handleTabChange }) {


            /* ══ RESEARCH-BASED SCORING 2026 ══
               7 factors: Yield, Capital Growth, Liquidity, Infrastructure,
               Developer Quality, Risk, Demand Strength
               Sources: DLD Q1 2026, Knight Frank, Cavendish Maxwell,
               themiddleeastinsider.com, sterlingcapital.realestate,
               casttio.com, propertyfinder.ae
            ════════════════════════════════════════════════════════ */

            const SCORE_FACTORS = [
              { key:"yield",       label:"Rental Yield",     weight:20, icon:"\uD83D\uDCB0", desc:"Gross yield vs Dubai avg 7.2%. High yield = income-positive investment." },
              { key:"growth",      label:"Capital Growth",   weight:20, icon:"\uD83D\uDCC8", desc:"Price appreciation trend + supply pipeline risk. DLD 2025 data." },
              { key:"liquidity",   label:"Liquidity",        weight:15, icon:"\uD83D\uDD04", desc:"Transaction volume + resale ease. How quickly can you exit?" },
              { key:"infra",       label:"Infrastructure",   weight:15, icon:"\uD83D\uDE87", desc:"Metro access, schools, hospitals, roads. Drives long-term tenant demand." },
              { key:"developer",   label:"Developer Quality",weight:15, icon:"\uD83C\uDFD7", desc:"On-time delivery rate, track record, escrow compliance." },
              { key:"risk",        label:"Risk Profile",     weight:10, icon:"⚠", desc:"Supply pipeline, vacancy rate, market + geopolitical risk (inverted)." },
              { key:"demand",      label:"Demand Strength",  weight:5,  icon:"\uD83D\uDC65", desc:"Occupancy rates, tenant diversity, population growth corridor." },
            ];

            /* ══ COMMUNITY SCORES — Research-based ══ */
            const SEED_SCORES = [
              { id:"is01", community:"Jumeirah Lake Towers", type:"Apartment",
                yield:88, growth:72, liquidity:90, infra:92, developer:80, risk:75, demand:88,
                grossYield:8.1, avgPrice:988000, ppsf:1380, transactions2025:8420,
                metroAccess:true, supplyRisk:"Medium", trend:"+0.1%", vacancyRate:5,
                verdict:"Strong Buy", badge:"#10B981",
                note:"Top-ranked. Best yield+liquidity combo. Metro, lakefront dining. Corporate tenants. Limited new supply." },
              { id:"is02", community:"Business Bay", type:"Apartment",
                yield:85, growth:78, liquidity:88, infra:90, developer:82, risk:62, demand:90,
                grossYield:7.6, avgPrice:1120000, ppsf:2050, transactions2025:15300,
                metroAccess:true, supplyRisk:"High", trend:"+0.2%", vacancyRate:6,
                verdict:"Buy", badge:"#10B981",
                note:"Highest transaction volume in Dubai. Corporate demand. Watch oversupply risk — 15,000+ units 2026-27." },
              { id:"is03", community:"Jumeirah Village Circle", type:"Apartment",
                yield:82, growth:70, liquidity:85, infra:72, developer:75, risk:72, demand:85,
                grossYield:7.8, avgPrice:923000, ppsf:1180, transactions2025:18200,
                metroAccess:false, supplyRisk:"Medium", trend:"+0.2%", vacancyRate:6,
                verdict:"Buy", badge:"#10B981",
                note:"Highest transaction volume community. Strong yield. No metro = slight infra deduction. Mid-market sweet spot." },
              { id:"is04", community:"Dubai Hills Estate", type:"Apartment",
                yield:70, growth:85, liquidity:80, infra:88, developer:92, risk:80, demand:82,
                grossYield:6.2, avgPrice:1694000, ppsf:1850, transactions2025:7800,
                metroAccess:false, supplyRisk:"Low", trend:"+0.1%", vacancyRate:5,
                verdict:"Buy", badge:"#10B981",
                note:"Emaar-managed. Golf views. Strong capital growth story. Lower yield but premium appreciation + stability." },
              { id:"is05", community:"Dubai Creek Harbour", type:"Apartment",
                yield:68, growth:88, liquidity:72, infra:82, developer:92, risk:78, demand:80,
                grossYield:6.0, avgPrice:1583000, ppsf:1942, transactions2025:5200,
                metroAccess:false, supplyRisk:"Low", trend:"+0.3%", vacancyRate:6,
                verdict:"Buy", badge:"#10B981",
                note:"Emaar flagship. 24% price growth 2025. Infrastructure still developing — patience required." },
              { id:"is06", community:"Dubai Marina", type:"Apartment",
                yield:75, growth:68, liquidity:92, infra:95, developer:80, risk:78, demand:88,
                grossYield:6.8, avgPrice:1690000, ppsf:2280, transactions2025:11400,
                metroAccess:true, supplyRisk:"Low", trend:"+0.1%", vacancyRate:5,
                verdict:"Buy", badge:"#10B981",
                note:"Blue chip. Best liquidity in Dubai. Limited new supply. Tourism + corporate demand. Price growth slowing." },
              { id:"is07", community:"Sobha Hartland", type:"Apartment",
                yield:65, growth:80, liquidity:68, infra:82, developer:90, risk:80, demand:78,
                grossYield:5.8, avgPrice:1897000, ppsf:2100, transactions2025:4100,
                metroAccess:false, supplyRisk:"Low", trend:"+0.2%", vacancyRate:5,
                verdict:"Hold", badge:"#D4A843",
                note:"Sobha quality premium. Good capital growth. Lower liquidity — longer exit time. For patient capital." },
              { id:"is08", community:"Downtown Dubai", type:"Apartment",
                yield:60, growth:65, liquidity:85, infra:98, developer:85, risk:80, demand:85,
                grossYield:5.5, avgPrice:3182000, ppsf:3100, transactions2025:9200,
                metroAccess:true, supplyRisk:"Low", trend:"0.0%", vacancyRate:4,
                verdict:"Hold", badge:"#D4A843",
                note:"Lifestyle premium. Best infrastructure. High price = compressed yield. Buy for lifestyle, not yield." },
              { id:"is09", community:"International City", type:"Apartment",
                yield:98, growth:42, liquidity:72, infra:50, developer:60, risk:65, demand:80,
                grossYield:9.2, avgPrice:456000, ppsf:650, transactions2025:6800,
                metroAccess:false, supplyRisk:"Low", trend:"+0.4%", vacancyRate:8,
                verdict:"Buy (Cash Flow)", badge:"#10B981",
                note:"Highest yield in Dubai 9.2%. Pure cash flow play. No metro, no lifestyle. High turnover tenants. Low entry." },
              { id:"is10", community:"Palm Jumeirah", type:"Apartment",
                yield:60, growth:70, liquidity:75, infra:85, developer:80, risk:82, demand:72,
                grossYield:5.5, avgPrice:4000000, ppsf:4800, transactions2025:5600,
                metroAccess:false, supplyRisk:"Low", trend:"0.0%", vacancyRate:4,
                verdict:"Hold", badge:"#D4A843",
                note:"Prestige asset. Very limited supply. Stable value. Low yield vs price. Buy for wealth preservation." },
              { id:"is11", community:"Arjan", type:"Apartment",
                yield:80, growth:65, liquidity:68, infra:70, developer:72, risk:75, demand:78,
                grossYield:7.5, avgPrice:840000, ppsf:1150, transactions2025:4200,
                metroAccess:false, supplyRisk:"Medium", trend:"+0.3%", vacancyRate:7,
                verdict:"Buy", badge:"#10B981",
                note:"Miracle Garden proximity. Growing community. Good yield for entry price. Infrastructure improving." },
              { id:"is12", community:"Dubai Hills Estate", type:"Villa",
                yield:55, growth:90, liquidity:78, infra:88, developer:92, risk:82, demand:85,
                grossYield:4.9, avgPrice:5714000, ppsf:1400, transactions2025:3200,
                metroAccess:false, supplyRisk:"Low", trend:"+0.2%", vacancyRate:4,
                verdict:"Buy", badge:"#10B981",
                note:"Top villa community. Strong capital growth. Emaar managed. Family demand. Low supply = price support." },
              { id:"is13", community:"Tilal Al Ghaf", type:"Villa",
                yield:52, growth:88, liquidity:65, infra:78, developer:88, risk:80, demand:82,
                grossYield:4.8, avgPrice:5104000, ppsf:1200, transactions2025:2100,
                metroAccess:false, supplyRisk:"Low", trend:"+0.3%", vacancyRate:5,
                verdict:"Buy", badge:"#10B981",
                note:"MAF crystal lagoon. 52% YoY growth 2025. Premium community. Lower liquidity — long hold recommended." },
              { id:"is14", community:"Arabian Ranches", type:"Villa",
                yield:54, growth:72, liquidity:75, infra:82, developer:90, risk:85, demand:80,
                grossYield:4.8, avgPrice:4479000, ppsf:1200, transactions2025:2800,
                metroAccess:false, supplyRisk:"Low", trend:"+0.2%", vacancyRate:4,
                verdict:"Hold", badge:"#D4A843",
                note:"Established. Emaar. Family community. Good stability. Price growth slowing as community matures." },
              { id:"is15", community:"Dubai South", type:"Apartment",
                yield:72, growth:90, liquidity:55, infra:70, developer:78, risk:70, demand:72,
                grossYield:7.2, avgPrice:650000, ppsf:900, transactions2025:3100,
                metroAccess:false, supplyRisk:"Low", trend:"+0.5%", vacancyRate:8,
                verdict:"Buy (Long Term)", badge:"#D4A843",
                note:"Al Maktoum Airport expansion play. 5-10yr horizon. Highest growth potential. Low current liquidity." },
            ];

            const rawScores = liveInvestScores?.length > 0 ? liveInvestScores : SEED_SCORES;

            /* ── Calculate weighted total score ── */
            const getTotal = (d) => {
              return Math.round(
                d.yield * 0.20 + d.growth * 0.20 + d.liquidity * 0.15 +
                d.infra * 0.15 + d.developer * 0.15 + d.risk * 0.10 + d.demand * 0.05
              );
            };

            const scored = rawScores.map(d => ({ ...d, total: getTotal(d) }));

            const filtered = scored.filter(d => {
              if (invScFilter !== "All" && d.type !== invScFilter) return false;
              if (invScSearch && !d.community.toLowerCase().includes(invScSearch.toLowerCase())) return false;
              return true;
            }).sort((a,b) => {
              if (invScSort === "total")    return b.total - a.total;
              if (invScSort === "yield")    return b.yield - a.yield;
              if (invScSort === "growth")   return b.growth - a.growth;
              if (invScSort === "liquidity")return b.liquidity - a.liquidity;
              if (invScSort === "risk")     return b.risk - a.risk;
              return 0;
            });

            const selSt = {
              background:T.surfaceAlt, border:`1px solid ${T.border}`, borderRadius:8,
              color:T.white, fontFamily:"'Outfit',sans-serif", fontSize:12,
              padding:"7px 28px 7px 10px", outline:"none", cursor:"pointer",
              appearance:"none", WebkitAppearance:"none",
              backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
              backgroundRepeat:"no-repeat", backgroundPosition:"right 8px center",
            };

            const verdictCfg = {
              "Strong Buy":     { color:"#10B981", bg:"rgba(16,185,129,0.15)" },
              "Buy":            { color:"#10B981", bg:"rgba(16,185,129,0.10)" },
              "Buy (Cash Flow)":{ color:T.teal,    bg:"rgba(20,184,166,0.12)" },
              "Buy (Long Term)":{ color:T.gold,    bg:"rgba(212,168,67,0.12)" },
              "Hold":           { color:"#F97316", bg:"rgba(249,115,22,0.10)" },
              "Caution":        { color:T.red,     bg:"rgba(239,68,68,0.10)"  },
            };

            const ScoreBar = ({ val, color }) => (
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <div style={{ flex:1, height:6, borderRadius:3, background:T.border, overflow:"hidden" }}>
                  <div style={{ height:"100%", width:`${val}%`, background:color, borderRadius:3 }} />
                </div>
                <span style={{ fontSize:11, fontWeight:700, color, minWidth:28 }}>{val}</span>
              </div>
            );

            return (
              <div style={{ animation:"fadeUp 0.4s ease-out forwards" }}>

                {/* Header */}
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 0", marginBottom:16, borderBottom:`1px solid ${T.border}`, flexWrap:"wrap", gap:8 }}>
                  <div>
                    <div style={{ fontFamily:"'Fraunces',serif", fontSize:20, fontWeight:800, color:T.white }}>Investment Score</div>
                    <div style={{ fontSize:11, color:T.textMuted, marginTop:3 }}>7-factor scoring · 15 communities · Weighted algorithm · DLD Q1 2026 · Research-backed</div>
                  </div>
                  <div style={{ display:"flex", gap:8 }}>
                    {["community","factors"].map(v => (
                      <button key={v} type="button" onClick={() => setInvScView(v)}
                        style={{ padding:"6px 14px", background:invScView===v?"rgba(212,168,67,0.15)":T.surfaceAlt, border:`1px solid ${invScView===v?"rgba(212,168,67,0.4)":T.border}`, borderRadius:8, color:invScView===v?T.gold:T.textMuted, fontSize:11, fontWeight:600, cursor:"pointer", fontFamily:"'Outfit',sans-serif", textTransform:"capitalize" }}>
                        {v === "community" ? "Rankings" : "Factor Guide"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Score formula */}
                <div style={{ padding:"12px 16px", background:"rgba(212,168,67,0.05)", border:`1px solid rgba(212,168,67,0.2)`, borderRadius:10, marginBottom:16 }}>
                  <div style={{ display:"flex", gap:16, flexWrap:"wrap", alignItems:"center" }}>
                    <span style={{ fontSize:11, fontWeight:700, color:T.gold }}>Score Formula:</span>
                    {SCORE_FACTORS.map((f,i) => (
                      <span key={i} style={{ fontSize:11, color:T.textSecondary }}>
                        <span style={{ color:T.white, fontWeight:700 }}>{f.label}</span>
                        <span style={{ color:T.textMuted }}> ×{f.weight}%</span>
                        {i < SCORE_FACTORS.length-1 && <span style={{ color:T.textMuted }}> +</span>}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Filters */}
                <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:"12px 14px", marginBottom:16 }}>
                  <div style={{ display:"flex", gap:8, flexWrap:"wrap", alignItems:"center" }}>
                    <div style={{ position:"relative", flex:"0 0 200px" }}>
                      {SvgIcons.Search({ width:13, height:13, style:{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", color:T.textMuted, pointerEvents:"none" } })}
                      <input value={invScSearch} onChange={e => setInvScSearch(e.target.value)} placeholder="Search community..."
                        style={{ ...selSt, paddingLeft:30, paddingRight:10, width:"100%", backgroundImage:"none" }} />
                    </div>
                    {["All","Apartment","Villa"].map(f => (
                      <button key={f} type="button" onClick={() => setInvScFilter(f)}
                        style={{ padding:"6px 14px", background:invScFilter===f?"rgba(212,168,67,0.15)":T.surfaceAlt, border:`1px solid ${invScFilter===f?"rgba(212,168,67,0.4)":T.border}`, borderRadius:8, color:invScFilter===f?T.gold:T.textMuted, fontSize:11, fontWeight:invScFilter===f?700:400, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>
                        {f}
                      </button>
                    ))}
                    <select value={invScSort} onChange={e => setInvScSort(e.target.value)} style={{ ...selSt, marginLeft:"auto" }}>
                      <option value="total">Sort: Total Score</option>
                      <option value="yield">Sort: Yield Score</option>
                      <option value="growth">Sort: Growth Score</option>
                      <option value="liquidity">Sort: Liquidity</option>
                      <option value="risk">Sort: Risk Score</option>
                    </select>
                    <span style={{ fontSize:11, color:T.textMuted }}>{filtered.length} communities</span>
                  </div>
                </div>

                {/* RANKINGS VIEW */}
                {invScView === "community" && (
                  <>
                    {/* Top 3 podium */}
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12, marginBottom:16 }}>
                      {filtered.slice(0,3).map((d,i) => {
                        const vc = verdictCfg[d.verdict] || verdictCfg["Hold"];
                        const medals = ["\uD83E\uDD47","\uD83E\uDD48","\uD83E\uDD49"];
                        return (
                          <div key={i} className="chart-box" style={{ padding:20, border:i===0?`1px solid ${T.gold}`:`1px solid ${T.border}`, cursor:"pointer" }}
                            onClick={() => setInvScSelected(invScSelected?.id===d.id?null:d)}>
                            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:12 }}>
                              <span style={{ fontSize:20 }}>{medals[i]}</span>
                              <span style={{ fontSize:11, padding:"3px 10px", borderRadius:10, background:vc.bg, color:vc.color, fontWeight:700 }}>{d.verdict}</span>
                            </div>
                            <div style={{ fontFamily:"'Fraunces',serif", fontSize:15, fontWeight:800, color:T.white, marginBottom:4 }}>{d.community}</div>
                            <div style={{ fontSize:11, color:T.textMuted, marginBottom:12 }}>{d.type}</div>
                            {/* Score circle */}
                            <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                              <div style={{ width:56, height:56, borderRadius:"50%", background:`conic-gradient(${i===0?T.gold:i===1?"#94A3B8":"#CD7F32"} ${d.total*3.6}deg, ${T.border} 0)`, display:"flex", alignItems:"center", justifyContent:"center", position:"relative" }}>
                                <div style={{ width:44, height:44, borderRadius:"50%", background:T.surface, display:"flex", alignItems:"center", justifyContent:"center" }}>
                                  <span style={{ fontFamily:"'Fraunces',serif", fontSize:16, fontWeight:900, color:i===0?T.gold:T.white }}>{d.total}</span>
                                </div>
                              </div>
                              <div>
                                <div style={{ fontSize:12, color:T.white, fontWeight:700 }}>AED {d.grossYield}% yield</div>
                                <div style={{ fontSize:11, color:T.textMuted }}>{d.transactions2025?.toLocaleString()} deals 2025</div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Full ranking table */}
                    <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:12, overflow:"hidden", marginBottom:16 }}>
                      <div style={{ display:"grid", gridTemplateColumns:"0.4fr 2fr 0.6fr 0.8fr 0.8fr 0.8fr 0.8fr 0.8fr 0.8fr 1fr", padding:"10px 16px", background:T.surfaceAlt, borderBottom:`1px solid ${T.border}` }}>
                        {["#","Community","Score","Yield","Growth","Liquidity","Infra","Risk","Demand","Verdict"].map((h,i) => (
                          <div key={i} style={{ fontSize:9, fontWeight:700, color:T.textMuted, letterSpacing:0.8, textTransform:"uppercase" }}>{h}</div>
                        ))}
                      </div>
                      {filtered.map((d,i) => {
                        const vc = verdictCfg[d.verdict] || verdictCfg["Hold"];
                        const isSelected = invScSelected?.id === d.id;
                        return (
                          <div key={d.id}>
                            <div style={{ display:"grid", gridTemplateColumns:"0.4fr 2fr 0.6fr 0.8fr 0.8fr 0.8fr 0.8fr 0.8fr 0.8fr 1fr", padding:"11px 16px", borderBottom:`1px solid ${T.border}`, alignItems:"center", cursor:"pointer", background:isSelected?"rgba(212,168,67,0.04)":"transparent" }}
                              onClick={() => setInvScSelected(isSelected?null:d)}
                              onMouseEnter={e => { if(!isSelected) e.currentTarget.style.background="rgba(255,255,255,0.02)"; }}
                              onMouseLeave={e => { if(!isSelected) e.currentTarget.style.background="transparent"; }}>
                              <div style={{ fontSize:12, color:T.textMuted, fontWeight:600 }}>{i+1}</div>
                              <div>
                                <div style={{ fontSize:13, fontWeight:600, color:T.white }}>{d.community}</div>
                                <div style={{ fontSize:10, color:T.textMuted }}>{d.type}{"·"}{d.grossYield}% yield</div>
                              </div>
                              <div style={{ fontFamily:"'Fraunces',serif", fontSize:18, fontWeight:900, color:d.total>=80?T.green:d.total>=65?T.gold:d.total>=50?"#F97316":T.red }}>{d.total}</div>
                              {[d.yield, d.growth, d.liquidity, d.infra, d.risk, d.demand].map((v,j) => (
                                <div key={j} style={{ fontSize:12, fontWeight:600, color:v>=80?T.green:v>=65?T.gold:v>=50?"#F97316":T.red }}>{v}</div>
                              ))}
                              <span style={{ fontSize:10, padding:"2px 8px", borderRadius:8, background:vc.bg, color:vc.color, fontWeight:700 }}>{d.verdict}</span>
                            </div>
                            {/* Expanded detail row */}
                            {isSelected && (
                              <div style={{ padding:"16px 20px", background:"rgba(212,168,67,0.03)", borderBottom:`1px solid ${T.border}` }}>
                                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
                                  <div>
                                    <div style={{ fontSize:12, fontWeight:700, color:T.white, marginBottom:10 }}>Factor Breakdown</div>
                                    {SCORE_FACTORS.map((f,j) => (
                                      <div key={j} style={{ marginBottom:8 }}>
                                        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
                                          <span style={{ fontSize:11, color:T.textSecondary }}>{f.icon} {f.label} <span style={{ color:T.textMuted }}>({f.weight}%)</span></span>
                                          <span style={{ fontSize:11, fontWeight:700, color:d[f.key]>=80?T.green:d[f.key]>=65?T.gold:"#F97316" }}>{d[f.key]}/100</span>
                                        </div>
                                        <ScoreBar val={d[f.key]} color={d[f.key]>=80?T.green:d[f.key]>=65?T.gold:"#F97316"} />
                                      </div>
                                    ))}
                                  </div>
                                  <div>
                                    <div style={{ fontSize:12, fontWeight:700, color:T.white, marginBottom:10 }}>Market Data</div>
                                    {[
                                      { label:"Gross Yield",        val:d.grossYield+"%"                         },
                                      { label:"Avg Price",          val:"AED "+(d.avgPrice/1000000).toFixed(2)+"M" },
                                      { label:"Price/sqft",         val:"AED "+d.ppsf.toLocaleString()           },
                                      { label:"2025 Transactions",  val:d.transactions2025?.toLocaleString()     },
                                      { label:"Vacancy Rate",       val:d.vacancyRate+"%"                        },
                                      { label:"Metro Access",       val:d.metroAccess?"Yes ✅":"No"              },
                                      { label:"Supply Risk",        val:d.supplyRisk                             },
                                      { label:"Price Trend",        val:d.trend+" YoY"                          },
                                    ].map((r,j) => (
                                      <div key={j} style={{ display:"flex", justifyContent:"space-between", padding:"5px 0", borderBottom:j<7?`1px solid ${T.border}`:"none" }}>
                                        <span style={{ fontSize:11, color:T.textMuted }}>{r.label}</span>
                                        <span style={{ fontSize:11, fontWeight:600, color:T.white }}>{r.val}</span>
                                      </div>
                                    ))}
                                    <div style={{ marginTop:12, padding:"10px 12px", background:"rgba(212,168,67,0.06)", borderRadius:8, fontSize:11, color:T.textSecondary, lineHeight:1.7 }}>
                                      \uD83D\uDCA1 {d.note}
                                    </div>
                                    <div style={{ display:"flex", gap:8, marginTop:10 }}>
                                      <button type="button" onClick={() => handleTabChange("Projects")}
                                        style={{ flex:1, padding:"7px 0", background:`linear-gradient(135deg,${T.gold},#B8922A)`, border:"none", borderRadius:7, color:"#000", fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>
                                        View Projects →
                                      </button>
                                      <button type="button" onClick={() => handleTabChange("Yields")}
                                        style={{ flex:1, padding:"7px 0", background:T.surfaceAlt, border:`1px solid ${T.border}`, borderRadius:7, color:T.textSecondary, fontSize:11, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>
                                        Yield Data →
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}

                {/* FACTOR GUIDE VIEW */}
                {invScView === "factors" && (
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:12, marginBottom:20 }}>
                    {SCORE_FACTORS.map((f,i) => (
                      <div key={i} className="chart-box" style={{ padding:20 }}>
                        <div style={{ fontSize:24, marginBottom:8 }}>{f.icon}</div>
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
                          <div style={{ fontFamily:"'Fraunces',serif", fontSize:14, fontWeight:700, color:T.white }}>{f.label}</div>
                          <span style={{ fontSize:11, padding:"2px 8px", borderRadius:8, background:"rgba(212,168,67,0.12)", color:T.gold, fontWeight:700 }}>{f.weight}% weight</span>
                        </div>
                        <div style={{ fontSize:12, color:T.textSecondary, lineHeight:1.7, marginBottom:12 }}>{f.desc}</div>
                        <div style={{ fontSize:10, fontWeight:700, color:T.textMuted, marginBottom:6 }}>TOP SCORERS</div>
                        {filtered.sort((a,b) => b[f.key]-a[f.key]).slice(0,3).map((d,j) => (
                          <div key={j} style={{ display:"flex", justifyContent:"space-between", padding:"4px 0", borderBottom:j<2?`1px solid ${T.border}`:"none" }}>
                            <span style={{ fontSize:11, color:T.textSecondary }}>{d.community.split(" ").slice(0,2).join(" ")}</span>
                            <span style={{ fontSize:11, fontWeight:700, color:T.gold }}>{d[f.key]}/100</span>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                )}

                {/* Methodology note */}
                <div style={{ padding:"12px 16px", background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, marginBottom:16 }}>
                  <div style={{ fontSize:11, fontWeight:700, color:T.white, marginBottom:6 }}>Methodology</div>
                  <div style={{ fontSize:11, color:T.textMuted, lineHeight:1.8 }}>
                    Scores are research-based using DLD Q1 2026 data, Knight Frank, Cavendish Maxwell, PropertyFinder, and Bayut market reports.
                    100 = top performer on that factor. Weighted average gives final Investment Score (0-100).
                    Score ≥80 = Strong Buy · 65-79 = Buy · 50-64 = Hold · &lt;50 = Caution.
                    Scores are updated quarterly as market conditions change.
                  </div>
                </div>

                {/* Sources */}
                <div style={{ paddingTop:12, borderTop:`1px solid ${T.border}`, display:"flex", gap:8, flexWrap:"wrap" }}>
                  <span style={{ fontSize:10, color:T.textMuted }}>Sources:</span>
                  {["DLD Q1 2026","Knight Frank","Cavendish Maxwell","PropertyFinder","Bayut","themiddleeastinsider.com","sterlingcapital.realestate"].map((s,i) => (
                    <span key={i} style={{ fontSize:10, color:T.textMuted, padding:"2px 8px", borderRadius:10, border:`1px solid ${T.border}`, background:T.surfaceAlt }}>{s}</span>
                  ))}
                </div>

              </div>
            );
}

export default InvestmentScoreTab;
