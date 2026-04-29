/* eslint-disable */
/* ═══════════════════════════════════════════════════════════════════
   DXB ANALYTICS — RISK TAB
   Community-level investment risk assessment
   ═══════════════════════════════════════════════════════════════════ */

import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from "recharts";
import { T } from "../data";
import { SvgIcons } from "../components/Icons";

function RiskTab({ liveNeighbourhoods=[], riskTabView, setRiskTabView, riskCommunity2, setRiskCommunity2, riskHorizon, setRiskHorizon, globalFilters = {}, handleTabChange }) {

  /* Phase 2.4 Batch 6: when top bar sets a community, sync tab's selector */
  const gfCommunity = globalFilters?.community && globalFilters.community !== "all"
    ? globalFilters.community : null;
  // Real community risk data from neighbourhoodScores
  const communityRiskMap = React.useMemo(() => {
    const map = {};
    (liveNeighbourhoods||[]).forEach(n => {
      map[n.community] = {
        supplyRisk:     n.supplyRisk || "Unknown",
        investScore:    n.investmentScore || 0,
        grossYield:     parseFloat(n.grossYield||0),
        dldTransactions:n.dldTransactions || 0,
        liquidity:      n.liquidity || "Unknown",
        avgPpsf:        n.avgPpsf || 0,
        goldenVisa:     n.goldenVisa || false,
      };
    });
    return map;
  }, [liveNeighbourhoods]);

  const getRealRisk = (community) => communityRiskMap[community] || null;
  
  React.useEffect(() => {
    if (gfCommunity && riskCommunity2 !== gfCommunity) {
      setRiskCommunity2(gfCommunity);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gfCommunity]);


            /* ══ RESEARCH — Risk Analysis Apr 2026 ══
               Sources: Fitch Ratings (15% correction forecast), Goldman Sachs
               (51% transaction drop Mar 2026), DFM index -21% post Feb 28
               mitchellscommercialrealty.com, 1tab.co, lionandland.com
               87% cash transactions (Fitch) | RERA escrow protections
               9 risk factors: Supply, Geopolitical, Developer, Liquidity,
               Vacancy, Currency, Regulatory, Construction, Market Cycle
            ════════════════════════════════════════════════════════ */

            const RISK_FACTORS = [
              { key:"supply",       label:"Supply Oversupply",   weight:20, icon:"\uD83C\uDFD7",
                desc:"210,000 units planned 2026. JVC alone: 16,852 units 2025-27. Mid-market most exposed.",
                communityScores:{ "Jumeirah Village Circle":72, "Business Bay":78, "Dubai Marina":20, "Downtown Dubai":18, "Dubai Hills Estate":25, "Palm Jumeirah":15, "International City":55, "Dubai South":60 } },
              { key:"geopolitical", label:"Geopolitical Risk",   weight:18, icon:"⚔",
                desc:"Iran-US conflict. DFM -21% post Feb 28. Transaction freeze 48-72hrs. Physical prices -3% YoY mid-Mar 2026.",
                communityScores:{ "Jumeirah Village Circle":45, "Business Bay":45, "Dubai Marina":40, "Downtown Dubai":38, "Dubai Hills Estate":35, "Palm Jumeirah":35, "International City":55, "Dubai South":50 } },
              { key:"developer",    label:"Developer Default",   weight:15, icon:"\uD83C\uDFE2",
                desc:"Binghatti/Omniyat bonds >1000bps. 48-52% historical on-time delivery. Tier-1 (Emaar) vs Tier-3 risk gap wide.",
                communityScores:{ "Jumeirah Village Circle":40, "Business Bay":30, "Dubai Marina":25, "Downtown Dubai":20, "Dubai Hills Estate":15, "Palm Jumeirah":20, "International City":55, "Dubai South":45 } },
              { key:"liquidity",    label:"Liquidity / Exit",    weight:12, icon:"\uD83D\uDCA7",
                desc:"Transaction volume -51% Mar 2026 (Goldman Sachs). 87% cash market limits forced selling. Secondary villa -89% YoY.",
                communityScores:{ "Jumeirah Village Circle":35, "Business Bay":28, "Dubai Marina":22, "Downtown Dubai":20, "Dubai Hills Estate":30, "Palm Jumeirah":38, "International City":48, "Dubai South":65 } },
              { key:"vacancy",      label:"Vacancy / Rental",    weight:12, icon:"\uD83C\uDFE0",
                desc:"JVC vacancy rising with supply. Prime areas 2-4% vacancy. Citi: population growth 1% vs 4% prior forecast.",
                communityScores:{ "Jumeirah Village Circle":42, "Business Bay":35, "Dubai Marina":22, "Downtown Dubai":20, "Dubai Hills Estate":28, "Palm Jumeirah":25, "International City":50, "Dubai South":60 } },
              { key:"currency",     label:"Currency / FX",       weight:8,  icon:"\uD83D\uDCB1",
                desc:"AED pegged to USD. Oil >$100 for 30 days tightens buyer purchasing power from India/Europe/Asia.",
                communityScores:{ "Jumeirah Village Circle":25, "Business Bay":25, "Dubai Marina":25, "Downtown Dubai":25, "Dubai Hills Estate":25, "Palm Jumeirah":25, "International City":25, "Dubai South":25 } },
              { key:"regulatory",   label:"Regulatory Change",   weight:5,  icon:"\uD83D\uDCCB",
                desc:"RERA/DLD well-established. Escrow protections strong. Golden Visa rules stable. Low regulatory risk vs 2008.",
                communityScores:{ "Jumeirah Village Circle":15, "Business Bay":15, "Dubai Marina":12, "Downtown Dubai":12, "Dubai Hills Estate":12, "Palm Jumeirah":12, "International City":20, "Dubai South":18 } },
              { key:"construction", label:"Construction Delay",  weight:5,  icon:"⏰",
                desc:"48% on-time delivery historically. Off-plan buyers at risk. Ready property: zero construction risk.",
                communityScores:{ "Jumeirah Village Circle":35, "Business Bay":30, "Dubai Marina":15, "Downtown Dubai":12, "Dubai Hills Estate":20, "Palm Jumeirah":15, "International City":40, "Dubai South":45 } },
              { key:"cycle",        label:"Market Cycle",        weight:5,  icon:"\uD83D\uDCC8",
                desc:"60% price run 2022-2025. Fitch: 10-15% correction probable. Prime areas more resilient than peripheral.",
                communityScores:{ "Jumeirah Village Circle":55, "Business Bay":48, "Dubai Marina":35, "Downtown Dubai":30, "Dubai Hills Estate":38, "Palm Jumeirah":28, "International City":45, "Dubai South":42 } },
            ];

            /* ── Community risk profiles ── */
            const COMMUNITY_RISK = {
              "Jumeirah Village Circle": { grade:"B+", label:"Moderate Risk", color:"#F97316", score:48, segment:"Mid-market apartment", note:"Highest supply pipeline in Dubai. Strong yield but correction risk elevated in 2026." },
              "Business Bay":            { grade:"B+", label:"Moderate Risk", color:"#F97316", score:42, segment:"Urban apartment/office", note:"Corporate demand strong but highest new supply pipeline. Watch absorption carefully." },
              "Dubai Marina":            { grade:"A-", label:"Low-Moderate",  color:T.gold,   score:28, segment:"Premium apartment", note:"Limited new supply. Strong global brand. Established liquidity. Resilient in downturns." },
              "Downtown Dubai":          { grade:"A",  label:"Low Risk",      color:T.green,  score:24, segment:"Premium apartment", note:"Iconic address. Very limited supply. Tourist demand supports STR. Best cycle resilience." },
              "Dubai Hills Estate":      { grade:"A-", label:"Low-Moderate",  color:T.gold,   score:30, segment:"Family villa/apt", note:"Emaar quality + management. Strong end-user demand. Family community insulated from speculation." },
              "Palm Jumeirah":           { grade:"A",  label:"Low Risk",      color:T.green,  score:26, segment:"Luxury apartment/villa", note:"Finite supply. Global recognition. Ultra-HNW buyer base less sensitive to market cycles." },
              "International City":      { grade:"C+", label:"Higher Risk",   color:T.red,    score:58, segment:"Budget apartment", note:"High supply, high tenant turnover. Strong yield but vulnerable to correction and vacancy." },
              "Dubai South":             { grade:"B",  label:"Moderate-High", color:"#F97316", score:52, segment:"Emerging market", note:"Long-term upside from AMI Airport. High current risk — not for short-term investors." },
            };

            const comm = riskCommunity2;
            const commRisk = COMMUNITY_RISK[comm] || COMMUNITY_RISK["Dubai Marina"];

            /* ── Overall risk score for selected community ── */
            const communityRiskScore = Math.round(
              RISK_FACTORS.reduce((sum, f) => {
                const s = f.communityScores[comm] || 30;
                return sum + s * (f.weight / 100);
              }, 0)
            );

            /* ── Horizon adjustment ── */
            const horizonAdj = { short:-12, medium:0, long:10 };
            const adjScore = Math.max(5, Math.min(95, communityRiskScore + (horizonAdj[riskHorizon]||0)));

            const riskGrade = adjScore <= 25 ? {label:"Low Risk",     color:T.green,  grade:"A"}
                            : adjScore <= 40 ? {label:"Low-Moderate", color:T.gold,   grade:"A-"}
                            : adjScore <= 55 ? {label:"Moderate",     color:"#F97316",grade:"B+"}
                            : adjScore <= 70 ? {label:"High Risk",    color:T.red,    grade:"B-"}
                            :                  {label:"Very High",    color:T.red,    grade:"C"};

            const communities3 = Object.keys(COMMUNITY_RISK);
            const selSt = {
              background:T.surfaceAlt, border:`1px solid ${T.border}`, borderRadius:8,
              color:T.white, fontFamily:"'Outfit',sans-serif", fontSize:12,
              padding:"7px 28px 7px 10px", outline:"none", cursor:"pointer",
              appearance:"none", WebkitAppearance:"none",
              backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
              backgroundRepeat:"no-repeat", backgroundPosition:"right 8px center",
            };

            return (
              <div style={{ animation:"fadeUp 0.4s ease-out forwards" }}>

                {/* Header */}
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 0", marginBottom:16, borderBottom:`1px solid ${T.border}`, flexWrap:"wrap", gap:8 }}>
                  <div>
                    <div style={{ fontFamily:"'Fraunces',serif", fontSize:20, fontWeight:800, color:T.white }}>Risk Intelligence</div>
                    <div style={{ fontSize:11, color:T.textMuted, marginTop:3 }}>9-factor risk model · Community scoring · Investment grade · Fitch/Goldman Sachs data · Apr 2026</div>
                  </div>
                  <div style={{ display:"flex", gap:8 }}>
                    {["radar","matrix","factors"].map(v=>(
                      <button key={v} type="button" onClick={()=>setRiskTabView(v)}
                        style={{ padding:"6px 14px", background:riskTabView===v?"rgba(212,168,67,0.15)":T.surfaceAlt, border:`1px solid ${riskTabView===v?"rgba(212,168,67,0.4)":T.border}`, borderRadius:8, color:riskTabView===v?T.gold:T.textMuted, fontSize:11, fontWeight:600, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>
                        {v==="radar"?"Community Risk":v==="matrix"?"Risk Matrix":"Factor Guide"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Market alert */}
                <div style={{ padding:"12px 16px", background:"rgba(239,68,68,0.06)", border:"1px solid rgba(239,68,68,0.2)", borderRadius:10, marginBottom:16 }}>
                  <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
                    <span style={{ fontSize:11, fontWeight:700, color:T.red }}>⚠ Market Alert Apr 2026:</span>
                    <span style={{ fontSize:11, color:T.textSecondary }}>DFM index -21% post Feb 28 · Transaction volumes -51% Mar (Goldman Sachs) · Physical prices -3% YoY (median AED 1,770/sqft, still +14% YoY) · Fitch: 10-15% correction probable in mid-market · 87% cash market = no systemic collapse risk · Prime areas resilient</span>
                  </div>
                </div>

                {/* COMMUNITY RISK VIEW */}
                {riskTabView === "radar" && (
                  <>
                    {/* Controls */}
                    <div style={{ display:"flex", gap:10, marginBottom:16, flexWrap:"wrap", alignItems:"center" }}>
                      <select value={comm} onChange={e=>setRiskCommunity2(e.target.value)} style={{ ...selSt, minWidth:200 }}>
                        {communities3.map(c=><option key={c}>{c}</option>)}
                      </select>
                      <div style={{ display:"flex", gap:6 }}>
                        {[{key:"short",label:"Short (<2yr)"},{key:"medium",label:"Medium (2-5yr)"},{key:"long",label:"Long (5yr+)"}].map(h=>(
                          <button key={h.key} type="button" onClick={()=>setRiskHorizon(h.key)}
                            style={{ padding:"6px 12px", background:riskHorizon===h.key?"rgba(212,168,67,0.15)":T.surfaceAlt, border:`1px solid ${riskHorizon===h.key?"rgba(212,168,67,0.4)":T.border}`, borderRadius:8, color:riskHorizon===h.key?T.gold:T.textMuted, fontSize:11, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>
                            {h.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:16 }}>
                      {/* Risk score card */}
                      <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                        <div style={{ padding:"24px", background:`linear-gradient(135deg,${riskGrade.color}14,${riskGrade.color}04)`, border:`1px solid ${riskGrade.color}40`, borderRadius:14, textAlign:"center" }}>
                          <div style={{ fontSize:11, color:T.textMuted, textTransform:"uppercase", letterSpacing:1, marginBottom:6 }}>Risk Score — {comm.split(" ").slice(0,2).join(" ")}</div>
                          <div style={{ fontFamily:"'Fraunces',serif", fontSize:52, fontWeight:900, color:riskGrade.color, lineHeight:1 }}>{adjScore}</div>
                          <div style={{ fontSize:14, fontWeight:700, color:riskGrade.color, marginTop:6 }}>{riskGrade.label}</div>
                          <div style={{ fontSize:12, color:T.textMuted, marginTop:4 }}>Investment Grade: <strong style={{ color:riskGrade.color }}>{riskGrade.grade}</strong>{"·"}{riskHorizon} horizon</div>
                          {/* Risk bar */}
                          <div style={{ height:8, borderRadius:4, background:`linear-gradient(90deg,${T.green} 0%,${T.gold} 40%,#F97316 65%,${T.red} 100%)`, margin:"14px 0 6px", position:"relative" }}>
                            <div style={{ position:"absolute", top:-2, left:`${adjScore}%`, transform:"translateX(-50%)", width:12, height:12, borderRadius:"50%", background:T.white, border:`2px solid ${riskGrade.color}` }} />
                          </div>
                          <div style={{ display:"flex", justifyContent:"space-between", fontSize:10, color:T.textMuted }}>
                            <span>Low 0</span><span>Moderate 50</span><span>High 100</span>
                          </div>
                        </div>

                        {/* Community verdict */}
                        <div className="chart-box" style={{ padding:18 }}>
                          <div style={{ fontSize:12, fontWeight:700, color:T.white, marginBottom:10 }}>{comm}</div>
                          <div style={{ display:"flex", gap:8, marginBottom:10 }}>
                            <span style={{ fontSize:11, padding:"2px 10px", borderRadius:8, background:commRisk.color+"20", color:commRisk.color, fontWeight:700 }}>Grade {commRisk.grade}</span>
                            <span style={{ fontSize:11, padding:"2px 10px", borderRadius:8, background:T.surfaceAlt, color:T.textMuted, border:`1px solid ${T.border}` }}>{commRisk.segment}</span>
                          </div>
                          <div style={{ fontSize:12, color:T.textSecondary, lineHeight:1.7, marginBottom:12 }}>{commRisk.note}</div>
                          <button type="button" onClick={()=>handleTabChange("Investment Score")}
                            style={{ width:"100%", padding:"8px 0", background:`linear-gradient(135deg,${T.gold},#B8922A)`, border:"none", borderRadius:8, color:"#000", fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>
                            View Investment Score →
                          </button>
                        </div>
                      </div>

                      {/* Factor breakdown */}
                      <div className="chart-box" style={{ padding:20 }}>
                        <div style={{ fontSize:13, fontWeight:700, color:T.white, marginBottom:4 }}>Risk Factors — {comm.split(" ").slice(0,2).join(" ")}</div>
                        <div style={{ fontSize:11, color:T.textMuted, marginBottom:16 }}>Higher score = higher risk · Weighted by importance</div>
                        {RISK_FACTORS.map((f,i)=>{
                          const score = f.communityScores[comm] || 30;
                          const weighted = (score * f.weight / 100).toFixed(1);
                          const barColor = score<=25?T.green:score<=45?T.gold:score<=65?"#F97316":T.red;
                          return (
                            <div key={i} style={{ marginBottom:10 }}>
                              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
                                <span style={{ fontSize:11, color:T.textSecondary }}>{f.icon} {f.label} <span style={{ color:T.textMuted }}>({f.weight}%)</span></span>
                                <span style={{ fontSize:11, fontWeight:700, color:barColor }}>{score}/100</span>
                              </div>
                              <div style={{ height:6, borderRadius:3, background:T.border, overflow:"hidden" }}>
                                <div style={{ height:"100%", width:`${score}%`, background:barColor, borderRadius:3 }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}

                {/* RISK MATRIX VIEW */}
                {riskTabView === "matrix" && (
                  <>
                    <div style={{ fontSize:13, fontWeight:700, color:T.white, marginBottom:4 }}>Community Risk Matrix</div>
                    <div style={{ fontSize:11, color:T.textMuted, marginBottom:16 }}>All communities ranked · Risk score vs rental yield · Click any row to explore</div>
                    <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:12, overflow:"hidden", marginBottom:16 }}>
                      <div style={{ display:"grid", gridTemplateColumns:"2fr 0.8fr 0.8fr 0.8fr 0.8fr 1fr 1.2fr", padding:"10px 16px", background:T.surfaceAlt, borderBottom:`1px solid ${T.border}` }}>
                        {["Community","Grade","Risk Score","Gross Yield","Supply Risk","Geo Risk","Verdict"].map((h,i)=>(
                          <div key={i} style={{ fontSize:10, fontWeight:700, color:T.textMuted, letterSpacing:0.8, textTransform:"uppercase" }}>{h}</div>
                        ))}
                      </div>
                      {Object.entries(COMMUNITY_RISK).sort((a,b)=>a[1].score-b[1].score).map(([comm2,cr],i)=>{
                        const supplyScore = RISK_FACTORS.find(f=>f.key==="supply")?.communityScores[comm2]||30;
                        const geoScore   = RISK_FACTORS.find(f=>f.key==="geopolitical")?.communityScores[comm2]||40;
                        const yldMap = { "Downtown Dubai":5.5,"Dubai Marina":6.8,"Business Bay":7.6,"Jumeirah Lake Towers":8.1,"Jumeirah Village Circle":7.8,"Dubai Hills Estate":6.2,"Palm Jumeirah":5.5,"International City":9.2,"Dubai South":7.2 };
                        const yld = yldMap[comm2] || 6.5;
                        return (
                          <div key={i} style={{ display:"grid", gridTemplateColumns:"2fr 0.8fr 0.8fr 0.8fr 0.8fr 1fr 1.2fr", padding:"12px 16px", borderBottom:i<Object.keys(COMMUNITY_RISK).length-1?`1px solid ${T.border}`:"none", alignItems:"center", cursor:"pointer" }}
                            onClick={()=>{ setRiskCommunity2(comm2); setRiskTabView("radar"); }}
                            onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.02)"}
                            onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                            <div>
                              <div style={{ fontSize:13, fontWeight:600, color:T.white }}>{comm2}</div>
                              <div style={{ fontSize:10, color:T.textMuted }}>{cr.segment}</div>
                            </div>
                            <div style={{ fontFamily:"'Fraunces',serif", fontSize:16, fontWeight:800, color:cr.color }}>{cr.grade}</div>
                            <div style={{ fontFamily:"'Fraunces',serif", fontSize:16, fontWeight:800, color:cr.color }}>{cr.score}</div>
                            <div style={{ fontSize:12, fontWeight:700, color:T.teal }}>{yld}%</div>
                            <div style={{ fontSize:12, color:supplyScore>55?T.red:supplyScore>35?"#F97316":T.green }}>{supplyScore>55?"High":supplyScore>35?"Medium":"Low"}</div>
                            <div style={{ fontSize:12, color:geoScore>55?T.red:geoScore>35?"#F97316":T.green }}>{geoScore>45?"Elevated":"Moderate"}</div>
                            <span style={{ fontSize:10, padding:"3px 8px", borderRadius:8, background:cr.color+"20", color:cr.color, fontWeight:700 }}>{cr.label}</span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Scenario analysis */}
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12, marginBottom:16 }}>
                      {[
                        { scenario:"De-escalation by Q2 2026", prob:"50%", impact:"Flat to -5% physical prices. Rapid sentiment recovery. Transaction volumes normalize.", color:T.green, icon:"✅" },
                        { scenario:"Prolonged conflict (base)", prob:"35%", impact:"10-15% correction mid-market. Off-plan slowdown. Supply headwind compounds.", color:"#F97316", icon:"⚠" },
                        { scenario:"Major escalation",          prob:"15%", impact:"20%+ correction possible (Citi). Population growth 1% vs 4%. Multi-year recovery.", color:T.red, icon:"❌" },
                      ].map((s,i)=>(
                        <div key={i} style={{ padding:"14px 16px", background:s.color+"08", border:`1px solid ${s.color}30`, borderRadius:10 }}>
                          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                            <span style={{ fontSize:16 }}>{s.icon}</span>
                            <span style={{ fontSize:11, fontWeight:700, color:s.color }}>{s.prob}</span>
                          </div>
                          <div style={{ fontSize:12, fontWeight:700, color:s.color, marginBottom:6 }}>{s.scenario}</div>
                          <div style={{ fontSize:11, color:T.textSecondary, lineHeight:1.7 }}>{s.impact}</div>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {/* FACTOR GUIDE VIEW */}
                {riskTabView === "factors" && (
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:12, marginBottom:20 }}>
                    {RISK_FACTORS.map((f,i)=>(
                      <div key={i} className="chart-box" style={{ padding:18 }}>
                        <div style={{ fontSize:22, marginBottom:8 }}>{f.icon}</div>
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
                          <div style={{ fontFamily:"'Fraunces',serif", fontSize:13, fontWeight:700, color:T.white }}>{f.label}</div>
                          <span style={{ fontSize:10, padding:"2px 8px", borderRadius:8, background:"rgba(239,68,68,0.1)", color:T.red, fontWeight:700 }}>{f.weight}% weight</span>
                        </div>
                        <div style={{ fontSize:12, color:T.textSecondary, lineHeight:1.7, marginBottom:12 }}>{f.desc}</div>
                        <div style={{ fontSize:10, fontWeight:700, color:T.textMuted, marginBottom:6 }}>HIGHEST RISK COMMUNITIES</div>
                        {Object.entries(f.communityScores).sort((a,b)=>b[1]-a[1]).slice(0,3).map(([comm2,score],j)=>(
                          <div key={j} style={{ display:"flex", justifyContent:"space-between", padding:"3px 0", borderBottom:j<2?`1px solid ${T.border}`:"none" }}>
                            <span style={{ fontSize:11, color:T.textSecondary }}>{comm2.split(" ").slice(0,2).join(" ")}</span>
                            <span style={{ fontSize:11, fontWeight:700, color:score>60?T.red:score>40?"#F97316":T.gold }}>{score}/100</span>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                )}

                {/* Sources */}
                <div style={{ paddingTop:12, borderTop:`1px solid ${T.border}`, display:"flex", gap:8, flexWrap:"wrap" }}>
                  <span style={{ fontSize:10, color:T.textMuted }}>Sources:</span>
                  {["Fitch Ratings May 2025","Goldman Sachs Mar 2026","DLD Transaction Data","1tab.co Apr 2026","mitchellscommercialrealty.com","lionandland.com","CBRE UAE 2026"].map((s,i)=>(
                    <span key={i} style={{ fontSize:10, color:T.textMuted, padding:"2px 8px", borderRadius:10, border:`1px solid ${T.border}`, background:T.surfaceAlt }}>{s}</span>
                  ))}
                </div>
              </div>
            );
}

export default RiskTab;
