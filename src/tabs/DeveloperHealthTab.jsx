/* eslint-disable */
/* DEVELOPER HEALTH TAB — Developer scoring & financial health */

import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Cell } from "recharts";
import { T } from "../data";
import { SvgIcons } from "../components/Icons";

function DeveloperHealthTab({
  liveDevHealth,
  dhSearch, setDhSearch,
  dhTier, setDhTier,
  dhSort, setDhSort,
  dhView, setDhView,
  dhSelected, setDhSelected,
  setFinDeveloper,
  handleTabChange,
}) {


            /* ══════════════════════════════════════════════════════
               DEVELOPER HEALTH — 9-Factor Scoring Model
               Sources: DLD transaction data, RERA registry,
               DXBinteract, Arabian Business, company disclosures
               
               9 Factors (total 100 pts):
               1. Sales Velocity       (15pts) — DLD monthly transactions
               2. Delivery Track Record(20pts) — on-time %, completed projects
               3. Financial Strength   (20pts) — revenue, cash, debt
               4. Project Pipeline     (10pts) — active launches, backlog
               5. Market Reputation    (10pts) — buyer reviews, complaints
               6. RERA Compliance      (10pts) — violations, escrow status
               7. DLD Transaction Rank (5pts)  — market share rank
               8. Pricing Stability    (5pts)  — PPSF consistency
               9. Buyer Nationality Mix(5pts)  — diversification
            ══════════════════════════════════════════════════════ */

            const HEALTH_SCORES = [
              /* ─── TIER 1: MARKET LEADERS ─── */
              {
                name:"Emaar Properties", tier:"Tier 1", color:"#D4A843",
                score:94, grade:"A+",
                factors:{ salesVelocity:15, delivery:20, financial:20, pipeline:9, reputation:9, rera:10, dldRank:5, pricing:4, buyerMix:5 },
                badges:["DFM Listed","Market Leader","On-Time Delivery","Golden Visa Projects"],
                dldRank:1, marketShare:"14.4%", avgPPSF:2415, transactions2024:19515,
                salesAED:"AED 70B (2024)", deliveryRate:"95%", activeProjects:62,
                summary:"Undisputed market leader. Highest delivery rate. DFM listed — full transparency. 60+ active project launches in 2024.",
              },
              {
                name:"Aldar Properties", tier:"Tier 1", color:"#10B981",
                score:91, grade:"A+",
                factors:{ salesVelocity:14, delivery:19, financial:19, pipeline:9, reputation:9, rera:10, dldRank:4, pricing:4, buyerMix:5 },
                badges:["ADX Listed","Abu Dhabi Leader","International Platform","Record Backlog"],
                dldRank:8, marketShare:"4.2%", avgPPSF:2100, transactions2024:8200,
                salesAED:"AED 33.6B (2024)", deliveryRate:"92%", activeProjects:38,
                summary:"ADX listed. Abu Dhabi + Dubai + Egypt + UK platform. Record backlog AED 54.6B drives 2-3yr revenue visibility.",
              },
              {
                name:"DAMAC Properties", tier:"Tier 1", color:"#8B5CF6",
                score:82, grade:"A-",
                factors:{ salesVelocity:13, delivery:16, financial:17, pipeline:8, reputation:8, rera:9, dldRank:3, pricing:4, buyerMix:5 },
                badges:["Ultra-Luxury","Branded Residences","Private ($5B Cash)","Chelsea FC Sponsor"],
                dldRank:3, marketShare:"8.1%", avgPPSF:2200, transactions2024:14200,
                salesAED:"AED 22B (2024)", deliveryRate:"82%", activeProjects:28,
                summary:"Private since 2022. ~$5B cash. Luxury branded focus (Trump, Versace, Cavalli). Delivery rate lower than Tier 1 peers.",
              },
              {
                name:"Sobha Realty", tier:"Tier 1", color:"#F97316",
                score:88, grade:"A",
                factors:{ salesVelocity:13, delivery:19, financial:17, pipeline:8, reputation:9, rera:10, dldRank:4, pricing:4, buyerMix:5 },
                badges:["In-House Construction","Premium Quality","Private","Strong FDI Buyer Base"],
                dldRank:4, marketShare:"5.8%", avgPPSF:2200, transactions2024:10200,
                salesAED:"AED 17B (2024)", deliveryRate:"91%", activeProjects:18,
                summary:"Only major developer with full in-house construction. Premium delivery quality. AED 30B backlog. Indian diaspora + GCC HNW buyers.",
              },
              {
                name:"Nakheel", tier:"Tier 1", color:"#14B8A6",
                score:85, grade:"A",
                factors:{ salesVelocity:13, delivery:17, financial:18, pipeline:8, reputation:9, rera:10, dldRank:5, pricing:4, buyerMix:5 },
                badges:["Dubai Holding","Luxury #1 2025","Palm Jumeirah","Government Backed"],
                dldRank:5, marketShare:"5.2%", avgPPSF:1800, transactions2024:8800,
                salesAED:"AED 20B+ (2024)", deliveryRate:"88%", activeProjects:22,
                summary:"#1 in Dubai luxury segment (>AED 15M) in 2025 with AED 16.9B. Palm Jumeirah global brand. Government backing = zero default risk.",
              },

              /* ─── TIER 2: STRONG PERFORMERS ─── */
              {
                name:"Meraas", tier:"Tier 2", color:"#EC4899",
                score:80, grade:"B+",
                factors:{ salesVelocity:12, delivery:16, financial:16, pipeline:7, reputation:9, rera:10, dldRank:4, pricing:3, buyerMix:4 },
                badges:["Dubai Holding","Lifestyle Leader","City Walk","La Mer"],
                dldRank:6, marketShare:"4.0%", avgPPSF:2800, transactions2024:6500,
                salesAED:"AED 16B (2024)", deliveryRate:"85%", activeProjects:16,
                summary:"Lifestyle placemaking leader. City Walk, La Mer, Bluewaters iconic brand. Dubai Holding backing. 2025: AED 10B Jan-Aug sales.",
              },
              {
                name:"Binghatti", tier:"Tier 2", color:"#F97316",
                score:72, grade:"B",
                factors:{ salesVelocity:13, delivery:15, financial:13, pipeline:8, reputation:7, rera:8, dldRank:3, pricing:3, buyerMix:4 },
                badges:["Fastest Growing","Iconic Architecture","60+ Projects","Bond Watch ⚠"],
                dldRank:3, marketShare:"6.2%", avgPPSF:1460, transactions2024:11200,
                salesAED:"AED 14B (2024) / AED 26B 2025", deliveryRate:"78%", activeProjects:42,
                summary:"Fastest growing private developer. 2025 sales AED 26B — extraordinary growth. Bond stress signals Mar 2026 require monitoring.",
              },
              {
                name:"Azizi Developments", tier:"Tier 2", color:"#6366F1",
                score:74, grade:"B",
                factors:{ salesVelocity:12, delivery:15, financial:14, pipeline:8, reputation:7, rera:8, dldRank:3, pricing:3, buyerMix:4 },
                badges:["High Volume","Mid-Market","19 Deliveries 2024","Burj Azizi"],
                dldRank:4, marketShare:"5.0%", avgPPSF:1500, transactions2024:10229,
                salesAED:"AED 12B (2024)", deliveryRate:"80%", activeProjects:35,
                summary:"High volume mid-market leader. 19 projects, 10,229 units delivered 2024. Azizi Venice + Riviera flagships. Burj Azizi ambitious target.",
              },
              {
                name:"Danube Properties", tier:"Tier 2", color:"#0EA5E9",
                score:78, grade:"B+",
                factors:{ salesVelocity:12, delivery:17, financial:13, pipeline:7, reputation:8, rera:10, dldRank:3, pricing:4, buyerMix:4 },
                badges:["On-Time Delivery","1% Payment Plans","Affordable Luxury","Strong Track Record"],
                dldRank:5, marketShare:"4.8%", avgPPSF:2150, transactions2024:6334,
                salesAED:"AED 8.5B (2024)", deliveryRate:"88%", activeProjects:22,
                summary:"Best delivery record in affordable segment. Pioneer of 1% monthly payment plans. Part of Danube Group with material cost advantages.",
              },
              {
                name:"Ellington Properties", tier:"Tier 2", color:"#A855F7",
                score:79, grade:"B+",
                factors:{ salesVelocity:10, delivery:17, financial:12, pipeline:6, reputation:10, rera:10, dldRank:3, pricing:5, buyerMix:4 },
                badges:["Design Leader","Boutique Premium","Lowest Debt","Strong Resale"],
                dldRank:7, marketShare:"3.2%", avgPPSF:2009, transactions2024:2871,
                salesAED:"AED 6.81B (2024)", deliveryRate:"90%", activeProjects:14,
                summary:"Highest design standard per AED. Premium finishes above competitors at same price. Strong resale premiums. Lowest D/E ratio (0.38x).",
              },

              /* ─── TIER 3: MID-MARKET ─── */
              {
                name:"Samana Developers", tier:"Tier 3", color:"#6B7280",
                score:65, grade:"B-",
                factors:{ salesVelocity:10, delivery:13, financial:10, pipeline:7, reputation:7, rera:8, dldRank:3, pricing:4, buyerMix:4 },
                badges:["High Volume","Affordable","JVC Specialist"],
                dldRank:6, marketShare:"2.8%", avgPPSF:1476, transactions2024:4359,
                salesAED:"AED 4.18B (2024)", deliveryRate:"75%", activeProjects:28,
                summary:"High volume affordable specialist. Strong buyer demand. Delivery rate improving. Q1 2026: AED 880M-905M range.",
              },
              {
                name:"Nshama", tier:"Tier 3", color:"#6B7280",
                score:67, grade:"B-",
                factors:{ salesVelocity:10, delivery:14, financial:10, pipeline:7, reputation:7, rera:9, dldRank:3, pricing:4, buyerMix:4 },
                badges:["Town Square","Community Living","Affordable"],
                dldRank:7, marketShare:"2.5%", avgPPSF:1100, transactions2024:3024,
                salesAED:"AED 4.53B (2024)", deliveryRate:"78%", activeProjects:12,
                summary:"Town Square Dubai developer. Community-centric affordable living. Strong local end-user demand. 2% market share 2024.",
              },
              {
                name:"Dubai Properties", tier:"Tier 3", color:"#6B7280",
                score:70, grade:"B",
                factors:{ salesVelocity:10, delivery:15, financial:12, pipeline:6, reputation:8, rera:9, dldRank:2, pricing:4, buyerMix:4 },
                badges:["Government Backed","Dubai Holding","Jumeirah Beach"],
                dldRank:6, marketShare:"3.0%", avgPPSF:1500, transactions2024:5200,
                salesAED:"AED 7.5B (2024)", deliveryRate:"82%", activeProjects:15,
                summary:"Dubai Holding subsidiary. Government backing = stability. Jumeirah Beach Residence + Business Bay focus. Conservative growth.",
              },
              {
                name:"MAG Property Dev", tier:"Tier 3", color:"#6B7280",
                score:63, grade:"B-",
                factors:{ salesVelocity:9, delivery:13, financial:9, pipeline:6, reputation:7, rera:8, dldRank:2, pricing:4, buyerMix:4 },
                badges:["Mid-Market","JVC Focus","Private"],
                dldRank:8, marketShare:"2.0%", avgPPSF:1300, transactions2024:3800,
                salesAED:"AED 4.9B (2024)", deliveryRate:"74%", activeProjects:18,
                summary:"Mid-market affordable developer. JVC + Business Bay projects. Private — limited disclosures. Improving delivery consistency.",
              },
              {
                name:"Imtiaz Developments", tier:"Tier 3", color:"#6B7280",
                score:60, grade:"B-",
                factors:{ salesVelocity:9, delivery:12, financial:8, pipeline:6, reputation:7, rera:8, dldRank:2, pricing:4, buyerMix:4 },
                badges:["Emerging","High Yield Focus","JVC Specialist"],
                dldRank:9, marketShare:"1.5%", avgPPSF:1200, transactions2024:2800,
                salesAED:"AED 3.4B (2024)", deliveryRate:"72%", activeProjects:14,
                summary:"Fast-growing emerging developer. Q1 2026: AED 880M+ sales. JVC specialist with high-yield investor focus.",
              },
            ];

            const FACTOR_WEIGHTS = [
              { key:"delivery",      label:"Delivery Track Record", max:20, color:T.green  },
              { key:"financial",     label:"Financial Strength",    max:20, color:T.gold   },
              { key:"salesVelocity", label:"Sales Velocity",        max:15, color:T.teal   },
              { key:"pipeline",      label:"Project Pipeline",      max:10, color:"#8B5CF6"},
              { key:"reputation",    label:"Market Reputation",     max:10, color:"#EC4899"},
              { key:"rera",          label:"RERA Compliance",       max:10, color:T.green  },
              { key:"dldRank",       label:"DLD Transaction Rank",  max:5,  color:"#F97316"},
              { key:"pricing",       label:"Pricing Stability",     max:5,  color:T.textMuted },
              { key:"buyerMix",      label:"Buyer Nationality Mix", max:5,  color:"#6366F1"},
            ];

            const gradeColor = g =>
              g==="A+"?"#10B981":g==="A"?"#10B981":g==="A-"?"#D4A843":
              g==="B+"?"#D4A843":g==="B"?"#F97316":g==="B-"?"#F97316":T.red;

            const tiers = ["All","Tier 1","Tier 2","Tier 3"];

            /* ── live data → seed swap ── */
            const rawHealth = liveDevHealth?.filter?.(d => d.name && d.score).length > 0
              ? liveDevHealth.filter(d => d.name && d.score)
              : HEALTH_SCORES;

            /* ── Filter + sort ── */
            const filtered = rawHealth
              .filter(d => dhTier === "All" || d.tier === dhTier)
              .filter(d => !dhSearch || d.name.toLowerCase().includes(dhSearch.toLowerCase()))
              .sort((a,b) => {
                if (dhSort === "score")   return b.score - a.score;
                if (dhSort === "sales")   return (parseFloat(b.salesAED)||0) - (parseFloat(a.salesAED)||0);
                if (dhSort === "delivery")return (parseFloat(b.deliveryRate)||0) - (parseFloat(a.deliveryRate)||0);
                if (dhSort === "name")    return a.name.localeCompare(b.name);
                return b.score - a.score;
              });

            const selected = dhSelected ? (rawHealth.find(d => d.name === dhSelected) || null) : null;

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
                <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", padding:"10px 0", marginBottom:16, borderBottom:`1px solid ${T.border}`, flexWrap:"wrap", gap:8 }}>
                  <div>
                    <div style={{ fontFamily:"'Fraunces',serif", fontSize:20, fontWeight:800, color:T.white }}>Developer Health</div>
                    <div style={{ fontSize:11, color:T.textMuted, marginTop:3 }}>9-factor scoring · 15 developers ranked · DLD + RERA + IR data · {rawHealth === HEALTH_SCORES ? "Seed data — upload via Admin" : "Live Firestore data"}</div>
                  </div>
                  <div style={{ display:"flex", gap:8 }}>
                    {["leaderboard","detail","compare"].map(v=>(
                      <button key={v} type="button" onClick={()=>setDhView(v)}
                        style={{ padding:"6px 14px", background:dhView===v?"rgba(212,168,67,0.15)":T.surfaceAlt, border:`1px solid ${dhView===v?"rgba(212,168,67,0.4)":T.border}`, borderRadius:8, color:dhView===v?T.gold:T.textMuted, fontSize:11, fontWeight:dhView===v?700:400, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>
                        {v==="leaderboard"?"Leaderboard":v==="detail"?"Detail View":"Factor Compare"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Controls */}
                <div style={{ display:"flex", gap:8, marginBottom:16, flexWrap:"wrap", alignItems:"center" }}>
                  {/* Tier filter */}
                  <div style={{ display:"flex", gap:4, background:T.surfaceAlt, borderRadius:8, padding:3, border:`1px solid ${T.border}` }}>
                    {tiers.map(t=>(
                      <button key={t} type="button" onClick={()=>setDhTier(t)}
                        style={{ padding:"5px 12px", background:dhTier===t?T.surface:"transparent", border:dhTier===t?`1px solid ${T.border}`:"1px solid transparent", borderRadius:6, color:dhTier===t?T.white:T.textMuted, fontSize:11, fontWeight:dhTier===t?600:400, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>
                        {t}
                      </button>
                    ))}
                  </div>
                  {/* Sort */}
                  <select value={dhSort} onChange={e=>setDhSort(e.target.value)} style={{ ...selSt, minWidth:160 }}>
                    <option value="score">Sort: Health Score</option>
                    <option value="delivery">Sort: Delivery Rate</option>
                    <option value="sales">Sort: Sales Volume</option>
                    <option value="name">Sort: Name A-Z</option>
                  </select>
                  {/* Search */}
                  <input placeholder="Search developer..." value={dhSearch} onChange={e=>setDhSearch(e.target.value)}
                    style={{ padding:"7px 12px", background:T.surfaceAlt, border:`1px solid ${T.border}`, borderRadius:8, color:T.white, fontFamily:"'Outfit',sans-serif", fontSize:12, outline:"none", minWidth:180 }} />
                  <span style={{ fontSize:11, color:T.textMuted, marginLeft:"auto" }}>{filtered.length} developers</span>
                </div>

                {/* LEADERBOARD VIEW */}
                {dhView === "leaderboard" && (
                  <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:12, overflow:"hidden", marginBottom:16 }}>
                    {/* Table header */}
                    <div style={{ display:"grid", gridTemplateColumns:"2fr 0.6fr 0.6fr 1fr 0.8fr 0.8fr 1fr 1.2fr", padding:"10px 16px", background:T.surfaceAlt, borderBottom:`1px solid ${T.border}` }}>
                      {["Developer","Grade","Score","2024 Sales","Delivery","PPSF","Tier","Status"].map((h,i)=>(
                        <div key={i} style={{ fontSize:10, fontWeight:700, color:T.textMuted, textTransform:"uppercase", letterSpacing:0.7 }}>{h}</div>
                      ))}
                    </div>
                    {filtered.map((d,i)=>(
                      <div key={i}
                        style={{ display:"grid", gridTemplateColumns:"2fr 0.6fr 0.6fr 1fr 0.8fr 0.8fr 1fr 1.2fr", padding:"12px 16px", borderBottom:i<filtered.length-1?`1px solid ${T.border}`:"none", cursor:"pointer", alignItems:"center", transition:"background 0.1s" }}
                        onClick={()=>{ setDhSelected(d.name); setDhView("detail"); }}
                        onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.02)"}
                        onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                        {/* Developer name */}
                        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                          <div style={{ width:3, height:36, borderRadius:2, background:d.color, flexShrink:0 }} />
                          <div>
                            <div style={{ fontSize:13, fontWeight:600, color:T.white }}>{d.name}</div>
                            <div style={{ display:"flex", gap:4, marginTop:2, flexWrap:"wrap" }}>
                              {d.badges.slice(0,2).map((b,bi)=>(
                                <span key={bi} style={{ fontSize:9, padding:"1px 5px", borderRadius:4, background:d.color+"18", color:d.color, fontWeight:600 }}>{b}</span>
                              ))}
                            </div>
                          </div>
                        </div>
                        {/* Grade */}
                        <div style={{ fontFamily:"'Fraunces',serif", fontSize:16, fontWeight:900, color:gradeColor(d.grade) }}>{d.grade}</div>
                        {/* Score */}
                        <div>
                          <div style={{ fontFamily:"'Fraunces',serif", fontSize:16, fontWeight:800, color:d.color }}>{d.score}</div>
                          <div style={{ height:4, width:40, borderRadius:2, background:T.border, marginTop:2 }}>
                            <div style={{ height:"100%", width:`${d.score}%`, background:d.color, borderRadius:2 }} />
                          </div>
                        </div>
                        {/* Sales */}
                        <div style={{ fontSize:12, color:T.gold, fontWeight:600 }}>{d.salesAED}</div>
                        {/* Delivery */}
                        <div style={{ fontSize:12, fontWeight:700, color:parseFloat(d.deliveryRate)>=90?T.green:parseFloat(d.deliveryRate)>=80?T.gold:"#F97316" }}>
                          {d.deliveryRate}
                        </div>
                        {/* PPSF */}
                        <div style={{ fontSize:12, color:T.textSecondary }}>AED {d.avgPPSF?.toLocaleString()}</div>
                        {/* Tier */}
                        <div style={{ fontSize:11, padding:"2px 8px", borderRadius:6, background:d.tier==="Tier 1"?"rgba(16,185,129,0.12)":d.tier==="Tier 2"?"rgba(212,168,67,0.12)":"rgba(107,114,128,0.12)", color:d.tier==="Tier 1"?T.green:d.tier==="Tier 2"?T.gold:T.textMuted, fontWeight:600, width:"fit-content" }}>
                          {d.tier}
                        </div>
                        {/* Status arrow */}
                        <div style={{ fontSize:11, color:T.textMuted }}>View detail →</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* DETAIL VIEW */}
                {dhView === "detail" && (
                  <>
                    {/* Developer selector */}
                    <div style={{ display:"flex", gap:8, marginBottom:16, alignItems:"center" }}>
                      <select value={dhSelected||filtered[0]?.name} onChange={e=>setDhSelected(e.target.value)} style={{ ...selSt, minWidth:220 }}>
                        {rawHealth.map(d=><option key={d.name}>{d.name}</option>)}
                      </select>
                      <button type="button" onClick={()=>setDhView("leaderboard")}
                        style={{ padding:"6px 14px", background:T.surfaceAlt, border:`1px solid ${T.border}`, borderRadius:8, color:T.textMuted, fontSize:11, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>
                        ← Back to Leaderboard
                      </button>
                      <button type="button" onClick={()=>handleTabChange("Financials")}
                        style={{ padding:"6px 14px", background:"rgba(212,168,67,0.1)", border:"1px solid rgba(212,168,67,0.3)", borderRadius:8, color:T.gold, fontSize:11, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>
                        View Financials →
                      </button>
                    </div>

                    {selected && (
                      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
                        {/* Score card */}
                        <div style={{ padding:"24px", background:`linear-gradient(135deg,${selected.color}14,${selected.color}04)`, border:`1px solid ${selected.color}30`, borderRadius:14, textAlign:"center" }}>
                          <div style={{ fontSize:11, color:T.textMuted, textTransform:"uppercase", letterSpacing:1, marginBottom:6 }}>Health Score</div>
                          <div style={{ fontFamily:"'Fraunces',serif", fontSize:56, fontWeight:900, color:selected.color, lineHeight:1 }}>{selected.score}</div>
                          <div style={{ fontFamily:"'Fraunces',serif", fontSize:20, fontWeight:800, color:gradeColor(selected.grade), marginTop:4 }}>{selected.grade}</div>
                          <div style={{ fontSize:11, color:T.textMuted, marginTop:6 }}>{selected.tier}{"·"}{selected.dldRank ? `DLD Rank #${selected.dldRank}` : ""}</div>
                          {/* Score bar */}
                          <div style={{ height:8, borderRadius:4, background:`linear-gradient(90deg,${T.red} 0%,#F97316 40%,${T.gold} 65%,${T.green} 100%)`, margin:"16px 0 6px", position:"relative" }}>
                            <div style={{ position:"absolute", top:-2, left:`${selected.score}%`, transform:"translateX(-50%)", width:12, height:12, borderRadius:"50%", background:T.white, border:`2px solid ${selected.color}` }} />
                          </div>
                          <div style={{ display:"flex", justifyContent:"space-between", fontSize:10, color:T.textMuted }}>
                            <span>0 Poor</span><span>50</span><span>100 Excellent</span>
                          </div>
                          {/* Badges */}
                          <div style={{ display:"flex", gap:4, flexWrap:"wrap", justifyContent:"center", marginTop:12 }}>
                            {selected.badges.map((b,i)=>(
                              <span key={i} style={{ fontSize:9, padding:"2px 7px", borderRadius:8, background:selected.color+"18", color:selected.color, fontWeight:600 }}>{b}</span>
                            ))}
                          </div>
                        </div>

                        {/* Factor breakdown */}
                        <div className="chart-box" style={{ padding:20 }}>
                          <div style={{ fontSize:13, fontWeight:700, color:T.white, marginBottom:16 }}>Factor Breakdown (100 pts)</div>
                          {FACTOR_WEIGHTS.map((f,i)=>{
                            const val = selected.factors[f.key] || 0;
                            const pct = (val / f.max) * 100;
                            return (
                              <div key={i} style={{ marginBottom:10 }}>
                                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
                                  <span style={{ fontSize:11, color:T.textSecondary }}>{f.label}</span>
                                  <span style={{ fontSize:11, fontWeight:700, color:pct>=80?T.green:pct>=60?T.gold:"#F97316" }}>{val}/{f.max}</span>
                                </div>
                                <div style={{ height:6, borderRadius:3, background:T.border }}>
                                  <div style={{ height:"100%", width:`${pct}%`, background:pct>=80?T.green:pct>=60?T.gold:"#F97316", borderRadius:3 }} />
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Key metrics */}
                        <div className="chart-box" style={{ padding:18 }}>
                          <div style={{ fontSize:12, fontWeight:700, color:T.white, marginBottom:12 }}>Key Metrics</div>
                          {[
                            { label:"2024 Sales", val:selected.salesAED, color:T.gold },
                            { label:"Delivery Rate", val:selected.deliveryRate, color:parseFloat(selected.deliveryRate)>=90?T.green:T.gold },
                            { label:"Active Projects", val:selected.activeProjects, color:T.white },
                            { label:"DLD Transactions 2024", val:selected.transactions2024?.toLocaleString(), color:T.textSecondary },
                            { label:"Avg Price/sqft", val:`AED ${selected.avgPPSF?.toLocaleString()}`, color:T.teal },
                            { label:"Market Share", val:selected.marketShare, color:T.white },
                          ].map((m,i)=>(
                            <div key={i} style={{ display:"flex", justifyContent:"space-between", padding:"7px 0", borderBottom:i<5?`1px solid ${T.border}`:"none" }}>
                              <span style={{ fontSize:12, color:T.textMuted }}>{m.label}</span>
                              <span style={{ fontSize:12, fontWeight:700, color:m.color }}>{m.val}</span>
                            </div>
                          ))}
                        </div>

                        {/* Summary */}
                        <div className="chart-box" style={{ padding:18 }}>
                          <div style={{ fontSize:12, fontWeight:700, color:T.white, marginBottom:10 }}>Analyst Summary</div>
                          <div style={{ fontSize:12, color:T.textSecondary, lineHeight:1.8 }}>{selected.summary}</div>
                          <div style={{ marginTop:14, display:"flex", gap:8 }}>
                            <button type="button" onClick={()=>{ setFinDeveloper(selected.name); handleTabChange("Financials"); }}
                              style={{ flex:1, padding:"8px 0", background:`linear-gradient(135deg,${T.gold},#B8922A)`, border:"none", borderRadius:8, color:"#000", fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>
                              View Financials →
                            </button>
                            <button type="button" onClick={()=>{ setFinDeveloper(selected.name); handleTabChange("Risk"); }}
                              style={{ flex:1, padding:"8px 0", background:T.surfaceAlt, border:`1px solid ${T.border}`, borderRadius:8, color:T.white, fontSize:11, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>
                              View Risk →
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {!selected && (
                      <div style={{ padding:"40px 24px", textAlign:"center", background:T.surface, border:`1px solid ${T.border}`, borderRadius:12 }}>
                        <div style={{ fontSize:13, color:T.textMuted }}>Select a developer from the dropdown above</div>
                      </div>
                    )}
                  </>
                )}

                {/* FACTOR COMPARE VIEW */}
                {dhView === "compare" && (
                  <div style={{ marginBottom:16 }}>
                    <div style={{ fontSize:13, fontWeight:700, color:T.white, marginBottom:4 }}>Factor-by-Factor Comparison</div>
                    <div style={{ fontSize:11, color:T.textMuted, marginBottom:16 }}>All developers · Each factor scored out of max points</div>
                    {FACTOR_WEIGHTS.map((factor,fi)=>(
                      <div key={fi} className="chart-box" style={{ padding:"14px 16px", marginBottom:10 }}>
                        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
                          <span style={{ fontSize:12, fontWeight:700, color:T.white }}>{factor.label}</span>
                          <span style={{ fontSize:10, color:T.textMuted }}>Max: {factor.max} pts</span>
                        </div>
                        <div style={{ display:"flex", gap:6, alignItems:"flex-end", height:70 }}>
                          {filtered.map((d,di)=>{
                            const val = d.factors[factor.key] || 0;
                            const h = (val / factor.max) * 60;
                            return (
                              <div key={di} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:2, cursor:"pointer" }}
                                onClick={()=>{ setDhSelected(d.name); setDhView("detail"); }}>
                                <div style={{ fontSize:9, fontWeight:700, color:d.color }}>{val}</div>
                                <div style={{ width:"100%", height:Math.max(h,2), background:d.color, borderRadius:"2px 2px 0 0", opacity:0.85 }} />
                                <div style={{ fontSize:8, color:T.textMuted, textAlign:"center", lineHeight:1.2 }}>{d.name.split(" ")[0]}</div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Sources */}
                <div style={{ paddingTop:12, borderTop:`1px solid ${T.border}`, display:"flex", gap:8, flexWrap:"wrap" }}>
                  <span style={{ fontSize:10, color:T.textMuted }}>Sources:</span>
                  {["DLD Transaction Data 2024","RERA Registry","DXBinteract","Arabian Business","Provident Estate Q1 2026","timehomesrealestate.com","primocapital.ae","Official company disclosures"].map((s,i)=>(
                    <span key={i} style={{ fontSize:10, color:T.textMuted, padding:"2px 8px", borderRadius:10, border:`1px solid ${T.border}`, background:T.surfaceAlt }}>{s}</span>
                  ))}
                </div>

              </div>
            );
}

export default DeveloperHealthTab;
