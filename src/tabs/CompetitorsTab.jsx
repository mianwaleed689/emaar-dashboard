/* eslint-disable */
/* COMPETITORS TAB — Side-by-side developer comparison */

import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, Cell } from "recharts";
import { T } from "../data";
import { SvgIcons } from "../components/Icons";
import { scoreColor, scoreLabel } from "../utils/scoring";


function CompetitorsTab({
  cptSearch, setCptSearch,
  cptDevA, setCptDevA,
  cptDevB, setCptDevB,
  cptMetric, setCptMetric,
  cptView, setCptView,
}) {


            /* ══════════════════════════════════════════════════════════
               COMPETITORS — Developer vs Developer Intelligence
               Sources: DLD 2025 data, mieyaruae.com Q3 2025 report,
               dubaipropertyinsight.com, takayamotorcity.com Feb 2026,
               prelaunch.ae delivery tracker, prophero.net

               Sales 2025 YTD (Jan-Aug, mieyaruae.com Oct 2025):
                 Emaar: AED 51B (~10,000 transactions) — #1 by wide margin
                 DAMAC: AED 24B (~9,000 transactions) — #2
                 Nakheel: AED 13B — #3
                 Sobha: AED 13B — #4
                 Meraas: AED 10B — #5
                 Binghatti: AED 9B — #6
                 Aldar: AED 8B — #7

               Delivery track record (prelaunch.ae Dec 2025):
                 Emaar: 95%+ on time — industry best
                 Sobha: 91% — in-house construction advantage
                 Nakheel: 88% — government backing
                 Danube: 88% — best in affordable segment
                 Ellington: 90% — boutique discipline
                 DAMAC: 82% — complex branded projects
                 Azizi: 80% — high volume, improving
                 Binghatti: 78% — rapid expansion risk

               S&P Rating: Emaar upgraded to BBB+ in 2025
               Off-plan market share 2025: 60%+ of all transactions
            ══════════════════════════════════════════════════════════ */

            const COMP_DATA = [
              {
                name:"Emaar Properties",
                color:"#D4A843",
                tier:"Tier 1",
                listed:true, exchange:"DFM",
                scores:{
                  overall:97, salesVolume:100, deliveryRecord:98, financialStrength:98,
                  pricePoint:82, yieldPotential:72, brandStrength:100, landBank:95,
                  offPlanStrength:95, communityQuality:98,
                },
                data:{
                  sales2025:"AED 51B (Jan-Aug)", marketShare:"14.4%",
                  deliveryRate:"95%+", avgPPSF:"AED 2,415",
                  minPrice:"AED 500K", maxPrice:"AED 100M+",
                  segments:["Master communities","Mixed-use","Hospitality","Malls"],
                  communities:["Downtown Dubai","Dubai Hills Estate","Dubai Creek Harbour","Dubai Marina","The Oasis","Rashid Yachts & Marina"],
                  paymentPlans:"40/60, 50/50, post-handover plans",
                  creditRating:"BBB+ (S&P 2025)",
                  offPlanShare:"72% of sales",
                  grossYield:"5-7%",
                  capitalAppreciation:"Strong — established communities",
                },
                strengths:["#1 developer 3 consecutive years","BBB+ credit rating","95%+ on-time delivery","140,000+ units delivered lifetime","Burj Khalifa / Dubai Mall brand"],
                weaknesses:["Premium pricing — lowest entry yields","High competition for their units","Slower payment plans vs private devs"],
                bestFor:"Long-term capital appreciation, brand prestige, end-users",
              },
              {
                name:"DAMAC Properties",
                color:"#8B5CF6",
                tier:"Tier 1",
                listed:false, exchange:"Private (2022)",
                scores:{
                  overall:82, salesVolume:88, deliveryRecord:78, financialStrength:85,
                  pricePoint:70, yieldPotential:75, brandStrength:90, landBank:80,
                  offPlanStrength:88, communityQuality:80,
                },
                data:{
                  sales2025:"AED 24B (Jan-Aug)", marketShare:"8.1%",
                  deliveryRate:"82%", avgPPSF:"AED 2,200",
                  minPrice:"AED 600K", maxPrice:"AED 50M+",
                  segments:["Branded luxury","Villa communities","Hospitality"],
                  communities:["DAMAC Hills","DAMAC Hills 2","DAMAC Lagoons","DAMAC Islands","Business Bay towers"],
                  paymentPlans:"Flexible 80/20, post-handover",
                  creditRating:"Private — $5B cash",
                  offPlanShare:"78% of sales",
                  grossYield:"6-8% (short-term rental focus)",
                  capitalAppreciation:"Moderate — depends on brand appeal",
                },
                strengths:["$5B cash reserves","Luxury brand partnerships (Versace, Cavalli, Bugatti)","Strong marketing engine","Flexible payment plans"],
                weaknesses:["Delisted from DFM 2022 — limited transparency","82% delivery rate — below Tier 1","Bond stress signals Mar 2026 — monitor","Investor-heavy, less end-user demand"],
                bestFor:"STR/luxury investors, buyers seeking branded residences",
              },
              {
                name:"Sobha Realty",
                color:"#F97316",
                tier:"Tier 1",
                listed:false, exchange:"Private",
                scores:{
                  overall:88, salesVolume:78, deliveryRecord:95, financialStrength:78,
                  pricePoint:75, yieldPotential:74, brandStrength:82, landBank:72,
                  offPlanStrength:80, communityQuality:95,
                },
                data:{
                  sales2025:"AED 13B (Jan-Aug)", marketShare:"5.8%",
                  deliveryRate:"91%", avgPPSF:"AED 2,200",
                  minPrice:"AED 800K", maxPrice:"AED 20M+",
                  segments:["Premium residential","Waterfront","Integrated communities"],
                  communities:["Sobha Hartland I","Sobha Hartland II","Sobha Seahaven","Sobha One"],
                  paymentPlans:"60/40, construction-linked",
                  creditRating:"Private — strong balance sheet",
                  offPlanShare:"75% of sales",
                  grossYield:"5.5-7.5%",
                  capitalAppreciation:"Strong — premium quality commands premium",
                },
                strengths:["In-house construction = best quality control","91% on-time delivery","No reliance on subcontractors","Premium finishes at consistent standard","Strong FDI buyer base (Indian HNW)"],
                weaknesses:["Community concentration (Hartland/MBR City)","Private — limited financial disclosure","Higher PSF than comparable developers","Slower sales cadence than Emaar/DAMAC"],
                bestFor:"Quality-focused buyers, long-term hold, Indian HNW investors",
              },
              {
                name:"Nakheel",
                color:"#14B8A6",
                tier:"Tier 1",
                listed:false, exchange:"Dubai Holding",
                scores:{
                  overall:85, salesVolume:78, deliveryRecord:88, financialStrength:95,
                  pricePoint:65, yieldPotential:70, brandStrength:92, landBank:98,
                  offPlanStrength:80, communityQuality:90,
                },
                data:{
                  sales2025:"AED 13B (Jan-Aug)", marketShare:"5.2%",
                  deliveryRate:"88%", avgPPSF:"AED 1,800-4,000",
                  minPrice:"AED 1.2M", maxPrice:"AED 200M+",
                  segments:["Waterfront villas","Island communities","Luxury towers"],
                  communities:["Palm Jumeirah","Palm Jebel Ali","Dubai Islands","The World","Deira Islands"],
                  paymentPlans:"Government-backed, conservative plans",
                  creditRating:"Government backed — zero default risk",
                  offPlanShare:"65% of sales",
                  grossYield:"5-7% (Palm premium)",
                  capitalAppreciation:"Exceptional — finite island supply",
                },
                strengths:["Government backing = zero default risk","Finite waterfront supply — impossible to replicate","Palm Jumeirah global brand recognition","Luxury segment #1 (AED 16.9B >AED15M properties 2025)","Dubai Holding integration (Meraas, Jumeirah Group)"],
                weaknesses:["Very high price points — limited buyer pool","Large project complexity = delivery timeline risk","Limited affordable offering","Island infrastructure complexity"],
                bestFor:"Ultra-HNW buyers, capital preservation, waterfront luxury",
              },
              {
                name:"Meraas",
                color:"#EC4899",
                tier:"Tier 1",
                listed:false, exchange:"Dubai Holding",
                scores:{
                  overall:80, salesVolume:72, deliveryRecord:85, financialStrength:90,
                  pricePoint:60, yieldPotential:68, brandStrength:85, landBank:80,
                  offPlanStrength:75, communityQuality:92,
                },
                data:{
                  sales2025:"AED 10B (Jan-Aug)", marketShare:"4.0%",
                  deliveryRate:"85%", avgPPSF:"AED 2,800-5,000",
                  minPrice:"AED 1.5M", maxPrice:"AED 50M+",
                  segments:["Lifestyle communities","Retail-integrated living","Urban destinations"],
                  communities:["Nad Al Sheba Gardens","City Walk Residences","Bluewaters Island","La Mer","Jumeirah Residences"],
                  paymentPlans:"Government conservative — less flexible",
                  creditRating:"Government backed — Dubai Holding",
                  offPlanShare:"70% of sales",
                  grossYield:"5-6.5%",
                  capitalAppreciation:"Strong — iconic lifestyle brand",
                },
                strengths:["City Walk, La Mer, Bluewaters — iconic lifestyle brand","Government backing","Nad Al Sheba fastest-selling villa 2025","AED 8.4M avg transaction — premium positioning","Meraas lifestyle retail drives property value"],
                weaknesses:["Very high avg price — limited buyer pool","Government conservative structure = less innovation","Limited affordable product","Strong competition from Emaar on lifestyle"],
                bestFor:"Lifestyle-focused luxury buyers, GCC HNW, weekend home buyers",
              },
              {
                name:"Binghatti",
                color:"#F97316",
                tier:"Tier 2",
                listed:false, exchange:"Private",
                scores:{
                  overall:72, salesVolume:88, deliveryRecord:72, financialStrength:60,
                  pricePoint:90, yieldPotential:88, brandStrength:75, landBank:65,
                  offPlanStrength:92, communityQuality:70,
                },
                data:{
                  sales2025:"AED 9B (Jan-Aug) / AED 26B full year", marketShare:"6.2%",
                  deliveryRate:"78%", avgPPSF:"AED 1,460",
                  minPrice:"AED 400K", maxPrice:"AED 5M",
                  segments:["Mid-market apartments","Branded luxury (Jacob & Co, Bugatti)","Investment units"],
                  communities:["Business Bay","JVC","Silicon Oasis","Downtown","Al Jaddaf"],
                  paymentPlans:"50/50, 1% monthly — very flexible",
                  creditRating:"Private — bond stress signals Mar 2026",
                  offPlanShare:"90% of sales",
                  grossYield:"8-10% — highest in mid-market",
                  capitalAppreciation:"Moderate — volume play, less brand premium",
                },
                strengths:["Highest gross yield in mid-market (8-10%)","Lowest entry price point AED 400K","60+ completed projects track record","Fastest growing developer 2024-2025","Unique architectural designs drive demand"],
                weaknesses:["Bond stress signals reported Mar 2026 — HIGH RISK","78% delivery rate — below average","High leverage historically","Rapid expansion pace — execution risk","Private — very limited financial transparency"],
                bestFor:"Yield-focused investors, entry-level buyers — monitor financial health",
              },
              {
                name:"Danube Properties",
                color:"#0EA5E9",
                tier:"Tier 2",
                listed:false, exchange:"Private",
                scores:{
                  overall:78, salesVolume:72, deliveryRecord:90, financialStrength:70,
                  pricePoint:95, yieldPotential:90, brandStrength:68, landBank:60,
                  offPlanStrength:88, communityQuality:72,
                },
                data:{
                  sales2025:"AED 4.1B (Aug 2025)", marketShare:"4.8%",
                  deliveryRate:"88%", avgPPSF:"AED 2,150",
                  minPrice:"AED 350K", maxPrice:"AED 2.5M",
                  segments:["Affordable luxury","Mid-market apartments","1% monthly payment pioneer"],
                  communities:["JVC","Arjan","Business Bay","Al Furjan"],
                  paymentPlans:"1% monthly (industry pioneer), 50/50, post-handover",
                  creditRating:"Private — Danube Group backing",
                  offPlanShare:"85% of sales",
                  grossYield:"8-10% — JVC/Arjan segment",
                  capitalAppreciation:"Moderate — affordable segment entry",
                },
                strengths:["Best delivery record in affordable segment (88%)","Pioneer of 1% monthly payment — copied industry-wide","Danube Group material cost advantage","Lowest entry prices AED 350K","Strong tenant demand = low vacancy"],
                weaknesses:["Small team relative to pipeline","Private — no financial disclosures","Affordable segment = thin margins","Limited luxury product","Community concentration JVC/Arjan"],
                bestFor:"First-time investors, yield maximisers, budget-conscious buyers",
              },
              {
                name:"Ellington Properties",
                color:"#A855F7",
                tier:"Tier 2",
                listed:false, exchange:"Private",
                scores:{
                  overall:79, salesVolume:65, deliveryRecord:92, financialStrength:65,
                  pricePoint:78, yieldPotential:80, brandStrength:80, landBank:55,
                  offPlanStrength:80, communityQuality:90,
                },
                data:{
                  sales2025:"AED 2.48B (Q1 2026) / AED 6.81B (2024)", marketShare:"3.2%",
                  deliveryRate:"90%", avgPPSF:"AED 2,009",
                  minPrice:"AED 600K", maxPrice:"AED 8M",
                  segments:["Design-led mid-premium","Boutique apartments","JVC + Business Bay specialist"],
                  communities:["JVC","Business Bay","Palm Jumeirah","Downtown"],
                  paymentPlans:"60/40, 70/30 — construction linked",
                  creditRating:"Private — lowest D/E ratio in segment",
                  offPlanShare:"80% of sales",
                  grossYield:"7-9% — premium finish drives premium rent",
                  capitalAppreciation:"Strong — design premium commands resale premium",
                },
                strengths:["Highest finish quality per AED in mid-market","90% delivery rate","Lowest D/E ratio (0.38x) — most conservative","Strong resale premiums vs area average","Design-led = tenant quality above segment avg"],
                weaknesses:["Low volume — can't compete on scale","Private — no financial disclosures","Small pipeline relative to demand","Limited community diversity","JVC oversupply risk affects all JVC developers"],
                bestFor:"Quality buyers, design-conscious investors, strong resale strategy",
              },
            ];

            /* ── Scoring metric labels ── */
            const METRICS = [
              {key:"overall",         label:"Overall Score",        icon:"⭐"},
              {key:"salesVolume",     label:"Sales Volume",         icon:"\uD83D\uDCCA"},
              {key:"deliveryRecord",  label:"Delivery Record",      icon:"\uD83C\uDFD7"},
              {key:"financialStrength",label:"Financial Strength",  icon:"\uD83D\uDCB0"},
              {key:"pricePoint",      label:"Price Accessibility",  icon:"\uD83D\uDCB2"},
              {key:"yieldPotential",  label:"Rental Yield",         icon:"\uD83D\uDCC8"},
              {key:"brandStrength",   label:"Brand Strength",       icon:"\uD83C\uDFC6"},
              {key:"landBank",        label:"Land Bank",            icon:"\uD83D\uDDFA"},
              {key:"offPlanStrength", label:"Off-Plan Strength",    icon:"\uD83D\uDCD0"},
              {key:"communityQuality",label:"Community Quality",    icon:"\uD83C\uDF06"},
            ];

            const selMetric = METRICS.find(m => m.key === cptMetric) || METRICS[0];

            /* ── Sort by selected metric ── */
            const sorted = [...COMP_DATA]
              .filter(d => !cptSearch || d.name.toLowerCase().includes(cptSearch.toLowerCase()))
              .sort((a,b) => (b.scores[cptMetric]||0) - (a.scores[cptMetric]||0));

            const devA = COMP_DATA.find(d => d.name === cptDevA) || COMP_DATA[0];
            const devB = COMP_DATA.find(d => d.name === cptDevB) || COMP_DATA[1];


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

                {/* ── HEADER ── */}
                <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", padding:"10px 0", marginBottom:16, borderBottom:`1px solid ${T.border}`, flexWrap:"wrap", gap:10 }}>
                  <div>
                    <div style={{ fontFamily:"'Fraunces',serif", fontSize:20, fontWeight:800, color:T.white }}>Developer Competitors</div>
                    <div style={{ fontSize:11, color:T.textMuted, marginTop:3 }}>8 developers · 10-factor scoring · Head-to-head compare · DLD 2025 data · Sales, delivery, yield, brand</div>
                  </div>
                  <div style={{ display:"flex", gap:8 }}>
                    {["matrix","headToHead","detail","radar"].map(v=>(
                      <button key={v} type="button" onClick={()=>setCptView(v)}
                        style={{ padding:"6px 14px", background:cptView===v?"rgba(212,168,67,0.15)":T.surfaceAlt, border:`1px solid ${cptView===v?"rgba(212,168,67,0.4)":T.border}`, borderRadius:8, color:cptView===v?T.gold:T.textMuted, fontSize:11, fontWeight:cptView===v?700:400, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>
                        {v==="matrix"?"Market Matrix":v==="headToHead"?"Head to Head":v==="detail"?"Detail View":"Score Radar"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* ══ MARKET MATRIX VIEW ══ */}
                {cptView === "matrix" && (
                  <>
                    {/* Metric selector + search */}
                    <div style={{ display:"flex", gap:8, marginBottom:14, flexWrap:"wrap", alignItems:"center" }}>
                      <select value={cptMetric} onChange={e=>setCptMetric(e.target.value)} style={{ ...selSt, minWidth:200 }}>
                        {METRICS.map(m=><option key={m.key} value={m.key}>{m.icon} {m.label}</option>)}
                      </select>
                      <input placeholder="Search developer..." value={cptSearch} onChange={e=>setCptSearch(e.target.value)}
                        style={{ padding:"7px 12px", background:T.surfaceAlt, border:`1px solid ${T.border}`, borderRadius:8, color:T.white, fontFamily:"'Outfit',sans-serif", fontSize:12, outline:"none", minWidth:180 }} />
                      <span style={{ fontSize:11, color:T.textMuted, marginLeft:"auto" }}>Sorted by: {selMetric.label}</span>
                    </div>

                    {/* Matrix table */}
                    <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:12, overflow:"hidden", marginBottom:16 }}>
                      <div style={{ display:"grid", gridTemplateColumns:"1.8fr 0.7fr 0.9fr 0.9fr 0.8fr 0.8fr 0.8fr 1fr 1.2fr", padding:"10px 16px", background:T.surfaceAlt, borderBottom:`1px solid ${T.border}` }}>
                        {["Developer","Tier","Sales 2025","Delivery","Avg PPSF","Yield","Min Price","Strength","Score"].map((h,i)=>(
                          <div key={i} style={{ fontSize:10, fontWeight:700, color:T.textMuted, textTransform:"uppercase", letterSpacing:0.6 }}>{h}</div>
                        ))}
                      </div>
                      {sorted.map((d,i)=>(
                        <div key={i}
                          style={{ display:"grid", gridTemplateColumns:"1.8fr 0.7fr 0.9fr 0.9fr 0.8fr 0.8fr 0.8fr 1fr 1.2fr", padding:"12px 16px", borderBottom:i<sorted.length-1?`1px solid ${T.border}`:"none", cursor:"pointer", alignItems:"center" }}
                          onClick={()=>{ setCptDevA(d.name); setCptView("detail"); }}
                          onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.02)"}
                          onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                            <div style={{ width:3, height:36, borderRadius:2, background:d.color, flexShrink:0 }} />
                            <div>
                              <div style={{ fontSize:13, fontWeight:600, color:T.white }}>{d.name}</div>
                              <div style={{ fontSize:10, color:T.textMuted }}>{d.listed?`${d.exchange} Listed`:`${d.exchange}`}</div>
                            </div>
                          </div>
                          <span style={{ fontSize:10, padding:"2px 7px", borderRadius:6, background:d.tier==="Tier 1"?"rgba(16,185,129,0.12)":"rgba(212,168,67,0.12)", color:d.tier==="Tier 1"?T.green:T.gold, fontWeight:600 }}>{d.tier}</span>
                          <div style={{ fontSize:11, color:T.gold, fontWeight:600 }}>{d.data.sales2025.split(" ")[0]}</div>
                          <div style={{ fontSize:12, fontWeight:700, color:parseFloat(d.data.deliveryRate)>=90?T.green:parseFloat(d.data.deliveryRate)>=85?T.gold:"#F97316" }}>{d.data.deliveryRate}</div>
                          <div style={{ fontSize:11, color:T.textSecondary }}>{d.data.avgPPSF.split("-")[0]}</div>
                          <div style={{ fontSize:12, fontWeight:700, color:T.teal }}>{d.data.grossYield.split("-")[0]}</div>
                          <div style={{ fontSize:11, color:T.textSecondary }}>{d.data.minPrice}</div>
                          <div style={{ fontSize:11, color:T.textMuted }}>{d.strengths[0].substring(0,25)}...</div>
                          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                            <div style={{ fontFamily:"'Fraunces',serif", fontSize:16, fontWeight:900, color:scoreColor(d.scores[cptMetric]||d.scores.overall) }}>{d.scores[cptMetric]||d.scores.overall}</div>
                            <div style={{ flex:1, height:5, background:T.border, borderRadius:3 }}>
                              <div style={{ height:"100%", width:`${d.scores[cptMetric]||d.scores.overall}%`, background:scoreColor(d.scores[cptMetric]||d.scores.overall), borderRadius:3 }} />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Key insight */}
                    <div style={{ padding:"12px 16px", background:"rgba(212,168,67,0.06)", border:"1px solid rgba(212,168,67,0.2)", borderRadius:10, fontSize:11, color:T.textSecondary, lineHeight:1.8 }}>
                      <strong style={{ color:T.gold }}>Market insight 2025:</strong> Emaar dominates with AED 51B sales (Jan-Aug) — nearly double DAMAC in second place at AED 24B.
                      Off-plan share exceeded 60% of all Dubai transactions. Emaar upgraded to BBB+ by S&P — only UAE developer with investment-grade credit rating.
                      Binghatti's AED 26B full-year 2025 sales were extraordinary — but monitor bond stress signals reported Mar 2026.
                    </div>
                  </>
                )}

                {/* ══ HEAD TO HEAD VIEW ══ */}
                {cptView === "headToHead" && (
                  <>
                    {/* Selector */}
                    <div style={{ display:"flex", gap:10, marginBottom:16, alignItems:"center", flexWrap:"wrap" }}>
                      <select value={cptDevA} onChange={e=>setCptDevA(e.target.value)} style={{ ...selSt, flex:1, minWidth:180 }}>
                        {COMP_DATA.map(d=><option key={d.name}>{d.name}</option>)}
                      </select>
                      <div style={{ fontSize:14, fontWeight:800, color:T.textMuted }}>VS</div>
                      <select value={cptDevB} onChange={e=>setCptDevB(e.target.value)} style={{ ...selSt, flex:1, minWidth:180 }}>
                        {COMP_DATA.filter(d=>d.name!==cptDevA).map(d=><option key={d.name}>{d.name}</option>)}
                      </select>
                    </div>

                    {/* H2H score cards */}
                    <div style={{ display:"grid", gridTemplateColumns:"1fr auto 1fr", gap:12, marginBottom:16, alignItems:"center" }}>
                      {/* Dev A */}
                      <div style={{ padding:"20px", background:`linear-gradient(135deg,${devA.color}14,${devA.color}04)`, border:`1px solid ${devA.color}30`, borderRadius:14, textAlign:"center" }}>
                        <div style={{ fontFamily:"'Fraunces',serif", fontSize:18, fontWeight:800, color:T.white, marginBottom:6 }}>{devA.name}</div>
                        <div style={{ fontFamily:"'Fraunces',serif", fontSize:48, fontWeight:900, color:devA.color, lineHeight:1 }}>{devA.scores.overall}</div>
                        <div style={{ fontSize:11, color:T.textMuted, marginTop:4 }}>{devA.tier}{"·"}{devA.data.deliveryRate} delivery</div>
                      </div>
                      {/* VS */}
                      <div style={{ textAlign:"center", padding:"10px" }}>
                        <div style={{ fontFamily:"'Fraunces',serif", fontSize:22, fontWeight:900, color:T.textMuted }}>VS</div>
                      </div>
                      {/* Dev B */}
                      <div style={{ padding:"20px", background:`linear-gradient(135deg,${devB.color}14,${devB.color}04)`, border:`1px solid ${devB.color}30`, borderRadius:14, textAlign:"center" }}>
                        <div style={{ fontFamily:"'Fraunces',serif", fontSize:18, fontWeight:800, color:T.white, marginBottom:6 }}>{devB.name}</div>
                        <div style={{ fontFamily:"'Fraunces',serif", fontSize:48, fontWeight:900, color:devB.color, lineHeight:1 }}>{devB.scores.overall}</div>
                        <div style={{ fontSize:11, color:T.textMuted, marginTop:4 }}>{devB.tier}{"·"}{devB.data.deliveryRate} delivery</div>
                      </div>
                    </div>

                    {/* Factor by factor */}
                    <div className="chart-box" style={{ padding:20, marginBottom:16 }}>
                      <div style={{ fontSize:13, fontWeight:700, color:T.white, marginBottom:16 }}>Factor by Factor</div>
                      {METRICS.filter(m=>m.key!=="overall").map((m,i)=>{
                        const scoreA = devA.scores[m.key]||0;
                        const scoreB = devB.scores[m.key]||0;
                        const winA = scoreA > scoreB;
                        const winB = scoreB > scoreA;
                        return (
                          <div key={i} style={{ marginBottom:14 }}>
                            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                              <span style={{ fontSize:11, fontWeight:winA?700:400, color:winA?devA.color:T.textMuted }}>{scoreA}</span>
                              <span style={{ fontSize:11, color:T.textMuted }}>{m.icon} {m.label}</span>
                              <span style={{ fontSize:11, fontWeight:winB?700:400, color:winB?devB.color:T.textMuted }}>{scoreB}</span>
                            </div>
                            <div style={{ display:"flex", gap:4, height:8 }}>
                              <div style={{ flex:scoreA, background:devA.color, borderRadius:"4px 0 0 4px", opacity:winA?1:0.4 }} />
                              <div style={{ flex:scoreB, background:devB.color, borderRadius:"0 4px 4px 0", opacity:winB?1:0.4 }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Key data comparison */}
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                      {[
                        {label:"2025 Sales",     keyA:"sales2025", keyB:"sales2025"},
                        {label:"Delivery Rate",  keyA:"deliveryRate", keyB:"deliveryRate"},
                        {label:"Avg PPSF",       keyA:"avgPPSF", keyB:"avgPPSF"},
                        {label:"Gross Yield",    keyA:"grossYield", keyB:"grossYield"},
                        {label:"Min Price",      keyA:"minPrice", keyB:"minPrice"},
                        {label:"Off-Plan Share", keyA:"offPlanShare", keyB:"offPlanShare"},
                        {label:"Credit Rating",  keyA:"creditRating", keyB:"creditRating"},
                        {label:"Best For",       keyA:"none", keyB:"none"},
                      ].map((row,i)=>(
                        <div key={i} style={{ display:"flex", justifyContent:"space-between", padding:"8px 14px", background:T.surface, border:`1px solid ${T.border}`, borderRadius:8 }}>
                          <div style={{ fontSize:11, fontWeight:600, color:devA.color, flex:1, textAlign:"left" }}>
                            {row.keyA === "none" ? devA.bestFor : devA.data[row.keyA]}
                          </div>
                          <div style={{ fontSize:10, color:T.textMuted, textAlign:"center", minWidth:90, padding:"0 8px" }}>{row.label}</div>
                          <div style={{ fontSize:11, fontWeight:600, color:devB.color, flex:1, textAlign:"right" }}>
                            {row.keyB === "none" ? devB.bestFor : devB.data[row.keyB]}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {/* ══ DETAIL VIEW ══ */}
                {cptView === "detail" && (
                  <>
                    <div style={{ display:"flex", gap:8, marginBottom:16 }}>
                      <select value={cptDevA} onChange={e=>setCptDevA(e.target.value)} style={{ ...selSt, minWidth:220 }}>
                        {COMP_DATA.map(d=><option key={d.name}>{d.name}</option>)}
                      </select>
                      <button type="button" onClick={()=>setCptView("matrix")}
                        style={{ padding:"6px 14px", background:T.surfaceAlt, border:`1px solid ${T.border}`, borderRadius:8, color:T.textMuted, fontSize:11, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>
                        ← Back
                      </button>
                      <button type="button" onClick={()=>{ setCptDevB(devA.name==="DAMAC Properties"?"Emaar Properties":"DAMAC Properties"); setCptView("headToHead"); }}
                        style={{ padding:"6px 14px", background:"rgba(212,168,67,0.1)", border:"1px solid rgba(212,168,67,0.3)", borderRadius:8, color:T.gold, fontSize:11, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>
                        Compare →
                      </button>
                    </div>

                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
                      {/* Identity */}
                      <div style={{ padding:"20px", background:`linear-gradient(135deg,${devA.color}12,${devA.color}04)`, border:`1px solid ${devA.color}30`, borderRadius:14 }}>
                        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:12 }}>
                          <div>
                            <div style={{ fontFamily:"'Fraunces',serif", fontSize:18, fontWeight:800, color:T.white }}>{devA.name}</div>
                            <div style={{ fontSize:11, color:T.textMuted, marginTop:2 }}>{devA.tier}{"·"}{devA.listed?`${devA.exchange} Listed`:"Private"}</div>
                          </div>
                          <div style={{ textAlign:"right" }}>
                            <div style={{ fontFamily:"'Fraunces',serif", fontSize:32, fontWeight:900, color:devA.color }}>{devA.scores.overall}</div>
                            <div style={{ fontSize:10, color:T.textMuted }}>Overall Score</div>
                          </div>
                        </div>
                        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                          {[
                            {label:"2025 Sales", val:devA.data.sales2025},
                            {label:"Delivery Rate", val:devA.data.deliveryRate},
                            {label:"Avg PPSF", val:devA.data.avgPPSF},
                            {label:"Gross Yield", val:devA.data.grossYield},
                            {label:"Min Price", val:devA.data.minPrice},
                            {label:"Market Share", val:devA.data.marketShare},
                          ].map((k,i)=>(
                            <div key={i} style={{ padding:"8px 10px", background:T.surfaceAlt, borderRadius:8, border:`1px solid ${T.border}` }}>
                              <div style={{ fontSize:9, color:T.textMuted, marginBottom:2 }}>{k.label}</div>
                              <div style={{ fontSize:12, fontWeight:700, color:devA.color }}>{k.val}</div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Scores */}
                      <div className="chart-box" style={{ padding:20 }}>
                        <div style={{ fontSize:12, fontWeight:700, color:T.white, marginBottom:14 }}>10-Factor Score</div>
                        {METRICS.filter(m=>m.key!=="overall").map((m,i)=>{
                          const score = devA.scores[m.key]||0;
                          return (
                            <div key={i} style={{ marginBottom:9 }}>
                              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
                                <span style={{ fontSize:11, color:T.textSecondary }}>{m.icon} {m.label}</span>
                                <span style={{ fontSize:11, fontWeight:700, color:scoreColor(score) }}>{score}/100</span>
                              </div>
                              <div style={{ height:5, borderRadius:3, background:T.border }}>
                                <div style={{ height:"100%", width:`${score}%`, background:scoreColor(score), borderRadius:3 }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Strengths + Weaknesses */}
                      <div className="chart-box" style={{ padding:18 }}>
                        <div style={{ fontSize:12, fontWeight:700, color:T.white, marginBottom:10 }}>Strengths</div>
                        {devA.strengths.map((s,i)=>(
                          <div key={i} style={{ display:"flex", gap:8, padding:"5px 0", borderBottom:i<devA.strengths.length-1?`1px solid ${T.border}`:"none" }}>
                            <span style={{ color:T.green }}>✓</span>
                            <span style={{ fontSize:11, color:T.textSecondary, lineHeight:1.6 }}>{s}</span>
                          </div>
                        ))}
                        <div style={{ fontSize:12, fontWeight:700, color:T.white, margin:"14px 0 10px" }}>Weaknesses</div>
                        {devA.weaknesses.map((w,i)=>(
                          <div key={i} style={{ display:"flex", gap:8, padding:"5px 0", borderBottom:i<devA.weaknesses.length-1?`1px solid ${T.border}`:"none" }}>
                            <span style={{ color:"#F97316" }}>⚠</span>
                            <span style={{ fontSize:11, color:T.textSecondary, lineHeight:1.6 }}>{w}</span>
                          </div>
                        ))}
                      </div>

                      {/* Communities + Best For */}
                      <div className="chart-box" style={{ padding:18 }}>
                        <div style={{ fontSize:12, fontWeight:700, color:T.white, marginBottom:10 }}>Key Communities</div>
                        <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:14 }}>
                          {devA.data.communities.map((c,i)=>(
                            <span key={i} style={{ fontSize:10, padding:"3px 8px", borderRadius:6, background:devA.color+"18", color:devA.color, fontWeight:600 }}>{c}</span>
                          ))}
                        </div>
                        <div style={{ fontSize:12, fontWeight:700, color:T.white, marginBottom:8 }}>Payment Plans</div>
                        <div style={{ fontSize:11, color:T.textSecondary, lineHeight:1.7, marginBottom:12 }}>{devA.data.paymentPlans}</div>
                        <div style={{ padding:"10px 12px", background:"rgba(212,168,67,0.06)", borderRadius:8, border:"1px solid rgba(212,168,67,0.2)" }}>
                          <div style={{ fontSize:11, fontWeight:700, color:T.gold, marginBottom:4 }}>Best for</div>
                          <div style={{ fontSize:12, color:T.textSecondary }}>{devA.bestFor}</div>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* ══ SCORE RADAR VIEW ══ */}
                {cptView === "radar" && (
                  <div style={{ marginBottom:16 }}>
                    <div style={{ fontSize:13, fontWeight:700, color:T.white, marginBottom:4 }}>Score Radar — All Developers</div>
                    <div style={{ fontSize:11, color:T.textMuted, marginBottom:16 }}>Each factor scored 0-100 · Higher = better · Click developer to see detail</div>
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))", gap:10 }}>
                      {COMP_DATA.map((d,i)=>(
                        <div key={i} className="chart-box" style={{ padding:16, cursor:"pointer", borderLeft:`3px solid ${d.color}` }}
                          onClick={()=>{ setCptDevA(d.name); setCptView("detail"); }}>
                          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:10 }}>
                            <div>
                              <div style={{ fontSize:12, fontWeight:700, color:T.white }}>{d.name.split(" ")[0]}</div>
                              <div style={{ fontSize:10, color:T.textMuted }}>{d.tier}</div>
                            </div>
                            <div style={{ fontFamily:"'Fraunces',serif", fontSize:22, fontWeight:900, color:d.color }}>{d.scores.overall}</div>
                          </div>
                          {/* Mini bars for top 5 factors */}
                          {["deliveryRecord","yieldPotential","brandStrength","communityQuality","financialStrength"].map((k,j)=>{
                            const m = METRICS.find(m=>m.key===k);
                            return (
                              <div key={j} style={{ marginBottom:5 }}>
                                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:2 }}>
                                  <span style={{ fontSize:9, color:T.textMuted }}>{m?.icon} {m?.label.split(" ")[0]}</span>
                                  <span style={{ fontSize:9, fontWeight:700, color:scoreColor(d.scores[k]) }}>{d.scores[k]}</span>
                                </div>
                                <div style={{ height:3, borderRadius:2, background:T.border }}>
                                  <div style={{ height:"100%", width:`${d.scores[k]}%`, background:d.color, borderRadius:2, opacity:0.8 }} />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── SOURCE FOOTER ── */}
                <div style={{ paddingTop:12, borderTop:`1px solid ${T.border}`, display:"flex", gap:8, flexWrap:"wrap", alignItems:"center" }}>
                  <span style={{ fontSize:10, color:T.textMuted }}>Sources:</span>
                  {["DLD 2025 Transaction Data","mieyaruae.com Q3 2025 Report","dubaipropertyinsight.com","prelaunch.ae Dec 2025","takayamotorcity.com Feb 2026","prophero.net Jan 2026","S&P BBB+ Emaar 2025"].map((s,i)=>(
                    <span key={i} style={{ fontSize:10, color:T.textMuted, padding:"2px 8px", borderRadius:10, border:`1px solid ${T.border}`, background:T.surfaceAlt }}>{s}</span>
                  ))}
                </div>

              </div>
            );
}

export default CompetitorsTab;
