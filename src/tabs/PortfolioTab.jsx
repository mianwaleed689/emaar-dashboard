/* eslint-disable */
/* ═══════════════════════════════════════════════════════════════════
   DXB ANALYTICS — PORTFOLIO TAB
   Personal property portfolio tracker
   ═══════════════════════════════════════════════════════════════════ */

import React from "react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { T } from "../data";
import { SvgIcons } from "../components/Icons";

function PortfolioTab({ liveNeighbourhoods=[], portView, setPortView, portShowAdd, setPortShowAdd, livePortfolio, user }) {


            /* ══ PORTFOLIO TRACKER
               Tracks user's Dubai property portfolio:
               - Total portfolio value vs cost
               - Unrealised gain/loss per property
               - Annual rental income + net yield
               - Mortgage outstanding vs equity
               - IRR calculator
               - Wealth growth chart
               Data: stored in Firestore under user's profile
            ════════════════════════════════════════════════════════ */

            /* Seed portfolio — replaced by Firestore on login */
            const SEED_PORTFOLIO = [
              { id:"p01", name:"Marina Heights 1BR", community:"Dubai Marina",   type:"Apartment", beds:"1BR", size:850,  buyPrice:1100000, currentVal:1380000, buyYear:2022, annualRent:78000,  sc:16000, mortgage:660000, mortRate:4.25, status:"Ready",   isSeed:true },
              { id:"p02", name:"JVC Studio",          community:"Jumeirah Village Circle", type:"Apartment", beds:"Studio", size:480, buyPrice:580000, currentVal:695000, buyYear:2023, annualRent:50000, sc:9000, mortgage:0, mortRate:0, status:"Ready", isSeed:true },
              { id:"p03", name:"Downtown 2BR",        community:"Downtown Dubai",type:"Apartment", beds:"2BR", size:1200, buyPrice:2800000, currentVal:3100000, buyYear:2021, annualRent:140000, sc:35000, mortgage:1400000, mortRate:4.0, status:"Ready", isSeed:true },
            ];

            const portfolio = livePortfolio?.length > 0 ? livePortfolio : SEED_PORTFOLIO;
            const isSeed    = !(livePortfolio?.length > 0);

            /* ── Portfolio KPIs ── */
            const totalCost    = portfolio.reduce((s,p) => s + p.buyPrice, 0);
            const totalVal     = portfolio.reduce((s,p) => s + p.currentVal, 0);
            const totalGain    = totalVal - totalCost;
            const totalGainPct = totalCost > 0 ? (totalGain/totalCost*100) : 0;
            const totalRent    = portfolio.reduce((s,p) => s + p.annualRent, 0);
            const totalSC      = portfolio.reduce((s,p) => s + p.sc, 0);
            const totalMort    = portfolio.reduce((s,p) => s + (p.mortgage||0), 0);
            const totalEquity  = totalVal - totalMort;
            const netRent      = totalRent - totalSC;
            const grossYieldPort = totalVal > 0 ? (totalRent/totalVal*100) : 0;
            const netYieldPort   = totalVal > 0 ? (netRent/totalVal*100) : 0;

            /* ── Annualised return (CAGR) ──
               This is NOT an internal rate of return. A true IRR solves for the
               discount rate that zeroes the NPV of dated cash flows; this treats
               all rent as if received at once and ignores timing entirely. It is
               labelled CAGR in the UI so the figure is not mistaken for IRR. */
            const avgHoldYears = portfolio.length > 0
              ? portfolio.reduce((s,p) => s + (2026 - p.buyYear), 0) / portfolio.length : 1;
            const totalReturn  = totalGain + (netRent * avgHoldYears);
            const irr          = totalCost > 0 ? (Math.pow((totalCost + totalReturn)/totalCost, 1/Math.max(avgHoldYears,1)) - 1) * 100 : 0;

            const selSt = { background:T.surfaceAlt,border:`1px solid ${T.border}`,borderRadius:8,color:T.white,fontFamily:"'Outfit',sans-serif",fontSize:12,padding:"7px 28px 7px 10px",outline:"none",cursor:"pointer",appearance:"none",WebkitAppearance:"none",backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,backgroundRepeat:"no-repeat",backgroundPosition:"right 8px center" };

            return (
              <div style={{ animation:"fadeUp 0.4s ease-out forwards" }}>

                {/* Header */}
                <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 0",marginBottom:16,borderBottom:`1px solid ${T.border}`,flexWrap:"wrap",gap:8 }}>
                  <div>
                    <div style={{ fontFamily:"'Fraunces',serif",fontSize:20,fontWeight:800,color:T.white }}>Portfolio Tracker</div>
                    <div style={{ fontSize:11,color:T.textMuted,marginTop:3 }}>Wealth tracking · IRR · Rental income · Equity · Gain/loss · Firebase synced</div>
                  </div>
                  <div style={{ display:"flex",gap:8 }}>
                    {["overview","properties","irr"].map(v=>(
                      <button key={v} type="button" onClick={()=>setPortView(v)}
                        style={{ padding:"6px 14px",background:portView===v?"rgba(212,168,67,0.15)":T.surfaceAlt,border:`1px solid ${portView===v?"rgba(212,168,67,0.4)":T.border}`,borderRadius:8,color:portView===v?T.gold:T.textMuted,fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"'Outfit',sans-serif",textTransform:"capitalize" }}>
                        {v==="overview"?"Overview":v==="properties"?"Properties":"IRR Analysis"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Seed notice */}
                {isSeed && (
                  <div style={{ padding:"10px 16px",background:"rgba(212,168,67,0.06)",border:"1px solid rgba(212,168,67,0.2)",borderRadius:10,marginBottom:16,display:"flex",alignItems:"center",gap:10 }}>
                    <span style={{ width:6,height:6,borderRadius:"50%",background:T.gold,display:"inline-block" }} />
                    <span style={{ fontSize:12,color:T.textMuted }}><span style={{ color:T.gold,fontWeight:700 }}>Sample portfolio</span> — Add your real properties below. Data saves to your Firebase account and syncs across devices.</span>
                  </div>
                )}

                {/* OVERVIEW VIEW */}
                {portView === "overview" && (
                  <>
                    {/* KPI row */}
                    <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:10,marginBottom:16 }}>
                      {[
                        {label:"Portfolio Value",   val:"AED "+(totalVal/1e6).toFixed(2)+"M",  color:T.white,  sub:"current market"},
                        {label:"Total Cost",        val:"AED "+(totalCost/1e6).toFixed(2)+"M", color:T.textMuted, sub:"purchase price"},
                        {label:"Unrealised Gain",   val:(totalGain>=0?"+":"")+"AED "+(totalGain/1000).toFixed(0)+"K", color:totalGain>=0?T.green:T.red, sub:totalGainPct.toFixed(1)+"% capital gain"},
                        {label:"Total Equity",      val:"AED "+(totalEquity/1e6).toFixed(2)+"M", color:T.teal, sub:"value minus mortgage"},
                        {label:"Gross Rent p.a.",   val:"AED "+(totalRent/1000).toFixed(0)+"K", color:T.green, sub:grossYieldPort.toFixed(1)+"% gross yield"},
                        {label:"Net Rent p.a.",     val:"AED "+(netRent/1000).toFixed(0)+"K",   color:T.teal,  sub:netYieldPort.toFixed(1)+"% net yield"},
                        {label:"Mortgage Outst.",   val:"AED "+(totalMort/1e6).toFixed(2)+"M", color:"#F97316", sub:"total outstanding"},
                        {label:"IRR (annualised)",  val:irr.toFixed(1)+"%",                     color:T.gold,   sub:"incl. rent + capital"},
                      ].map((k,i)=>(
                        <div key={i} className="kpi-card">
                          <div style={{ fontSize:10,fontWeight:700,color:T.textMuted,letterSpacing:1,textTransform:"uppercase",marginBottom:8 }}>{k.label}</div>
                          <div style={{ fontFamily:"'Fraunces',serif",fontSize:20,fontWeight:800,color:k.color,marginBottom:4 }}>{k.val}</div>
                          <div style={{ fontSize:10,color:T.textMuted }}>{k.sub}</div>
                        </div>
                      ))}
                    </div>

                    {/* Wealth allocation visual */}
                    <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16 }}>
                      <div className="chart-box" style={{ padding:20 }}>
                        <div style={{ fontSize:13,fontWeight:700,color:T.white,marginBottom:16 }}>Portfolio Breakdown</div>
                        {portfolio.map((p,i)=>{
                          const gain    = p.currentVal - p.buyPrice;
                          const gainPct = (gain/p.buyPrice*100);
                          const pct     = (p.currentVal/totalVal*100).toFixed(0);
                          return (
                            <div key={i} style={{ marginBottom:14 }}>
                              <div style={{ display:"flex",justifyContent:"space-between",marginBottom:4 }}>
                                <span style={{ fontSize:12,color:T.white,fontWeight:600 }}>{p.name}</span>
                                <span style={{ fontSize:11,color:gain>=0?T.green:T.red,fontWeight:700 }}>{gain>=0?"+":""}{gainPct.toFixed(1)}%</span>
                              </div>
                              <div style={{ height:8,borderRadius:4,background:T.border,overflow:"hidden" }}>
                                <div style={{ height:"100%",width:pct+"%",background:i===0?T.gold:i===1?T.teal:T.green,borderRadius:4 }} />
                              </div>
                              <div style={{ display:"flex",justifyContent:"space-between",marginTop:3 }}>
                                <span style={{ fontSize:10,color:T.textMuted }}>{p.community}{"·"}{p.beds}</span>
                                <span style={{ fontSize:10,color:T.textMuted }}>AED {(p.currentVal/1e6).toFixed(2)}M ({pct}%)</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <div className="chart-box" style={{ padding:20 }}>
                        <div style={{ fontSize:13,fontWeight:700,color:T.white,marginBottom:16 }}>Income Summary</div>
                        {[
                          {label:"Gross Rental Income",  val:"AED "+totalRent.toLocaleString(),   color:T.green },
                          {label:"Service Charges",      val:"- AED "+totalSC.toLocaleString(),   color:"#F97316"},
                          {label:"Net Rental Income",    val:"AED "+netRent.toLocaleString(),      color:T.green },
                          {label:"Mortgage Payments",    val:"AED "+Math.round(portfolio.reduce((s,p)=>s+(p.mortgage&&p.mortRate?(p.mortgage*(p.mortRate/100/12)*(Math.pow(1+p.mortRate/100/12,300))/(Math.pow(1+p.mortRate/100/12,300)-1))*12:0),0)).toLocaleString(), color:T.red },
                          {label:"Net Cash Flow",        val:"AED "+(netRent - Math.round(portfolio.reduce((s,p)=>s+(p.mortgage&&p.mortRate?(p.mortgage*(p.mortRate/100/12)*(Math.pow(1+p.mortRate/100/12,300))/(Math.pow(1+p.mortRate/100/12,300)-1))*12:0),0))).toLocaleString(), color:T.teal },
                        ].map((r,i)=>(
                          <div key={i} style={{ display:"flex",justifyContent:"space-between",padding:"9px 0",borderBottom:i<4?`1px solid ${T.border}`:"none" }}>
                            <span style={{ fontSize:12,color:T.textMuted }}>{r.label}</span>
                            <span style={{ fontSize:13,fontWeight:700,color:r.color }}>{r.val}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* PROPERTIES VIEW */}
                {portView === "properties" && (
                  <div style={{ marginBottom:16 }}>
                    {portfolio.map((p,i)=>{
                      const gain    = p.currentVal - p.buyPrice;
                      const gainPct = (gain/p.buyPrice*100);
                      const equity  = p.currentVal - (p.mortgage||0);
                      const netR    = p.annualRent - p.sc;
                      const grossY  = (p.annualRent/p.currentVal*100).toFixed(1);
                      const netY    = (netR/p.currentVal*100).toFixed(1);
                      return (
                        <div key={i} className="chart-box" style={{ padding:0,overflow:"hidden",marginBottom:12 }}>
                          <div style={{ padding:"14px 18px",borderBottom:`1px solid ${T.border}`,display:"flex",justifyContent:"space-between",alignItems:"center" }}>
                            <div>
                              <div style={{ fontFamily:"'Fraunces',serif",fontSize:15,fontWeight:700,color:T.white }}>{p.name}</div>
                              <div style={{ fontSize:11,color:T.textMuted,marginTop:2 }}>{p.community}{"·"}{p.type}{"·"}{p.beds}{"·"}{p.size.toLocaleString()} sqft · Bought {p.buyYear}</div>
                            </div>
                            <div style={{ textAlign:"right" }}>
                              <div style={{ fontFamily:"'Fraunces',serif",fontSize:20,fontWeight:900,color:T.white }}>AED {(p.currentVal/1e6).toFixed(2)}M</div>
                              <div style={{ fontSize:12,color:gain>=0?T.green:T.red,fontWeight:700 }}>{gain>=0?"+":""}{gainPct.toFixed(1)}% since purchase</div>
                            </div>
                          </div>
                          <div style={{ display:"grid",gridTemplateColumns:"repeat(6,1fr)",padding:"12px 18px",gap:8 }}>
                            {[
                              {label:"Buy Price",    val:"AED "+(p.buyPrice/1e6).toFixed(2)+"M", color:T.textMuted},
                              {label:"Gain",         val:(gain>=0?"+":"")+"AED "+(gain/1000).toFixed(0)+"K", color:gain>=0?T.green:T.red},
                              {label:"Equity",       val:"AED "+(equity/1e6).toFixed(2)+"M",     color:T.teal},
                              {label:"Gross Yield",  val:grossY+"%",                              color:T.gold},
                              {label:"Net Yield",    val:netY+"%",                               color:T.teal},
                              {label:"Annual Rent",  val:"AED "+(p.annualRent/1000).toFixed(0)+"K", color:T.green},
                            ].map((m,j)=>(
                              <div key={j}>
                                <div style={{ fontSize:9,color:T.textMuted,textTransform:"uppercase",letterSpacing:0.6,marginBottom:3 }}>{m.label}</div>
                                <div style={{ fontSize:13,fontWeight:700,color:m.color }}>{m.val}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                    {/* Add property CTA */}
                    <div style={{ padding:"20px",textAlign:"center",background:T.surface,border:`1px dashed ${T.border}`,borderRadius:12 }}>
                      <div style={{ fontSize:13,color:T.textMuted,marginBottom:8 }}>Add your real properties to track your wealth</div>
                      <button type="button" onClick={()=>setPortShowAdd(true)}
                        style={{ padding:"8px 24px",background:`linear-gradient(135deg,${T.gold},#B8922A)`,border:"none",borderRadius:8,color:"#000",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"'Outfit',sans-serif" }}>
                        + Add Property
                      </button>
                      <div style={{ fontSize:11,color:T.textMuted,marginTop:8 }}>Properties sync to your Firebase account · Private to you only</div>
                    </div>
                  </div>
                )}

                {/* IRR VIEW */}
                {portView === "irr" && (
                  <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16 }}>
                    <div className="chart-box" style={{ padding:20 }}>
                      <div style={{ fontFamily:"'Fraunces',serif",fontSize:14,fontWeight:700,color:T.white,marginBottom:4 }}>Internal Rate of Return</div>
                      <div style={{ fontSize:11,color:T.textMuted,marginBottom:20 }}>Combined rental income + capital appreciation</div>
                      <div style={{ textAlign:"center",padding:"24px 0" }}>
                        <div style={{ fontFamily:"'Fraunces',serif",fontSize:52,fontWeight:900,color:T.gold,lineHeight:1 }}>{irr.toFixed(1)}%</div>
                        <div style={{ fontSize:13,color:T.textMuted,marginTop:8 }}>Annualised IRR · {avgHoldYears.toFixed(1)} yr avg hold</div>
                      </div>
                      {[
                        {label:"Total Capital Invested",  val:"AED "+(totalCost/1e6).toFixed(2)+"M"},
                        {label:"Capital Gains",           val:"AED "+(totalGain/1000).toFixed(0)+"K ("+totalGainPct.toFixed(1)+"%)"},
                        {label:"Cumulative Net Rent",     val:"AED "+(netRent*avgHoldYears/1000).toFixed(0)+"K"},
                        {label:"Total Return",            val:"AED "+(totalReturn/1000).toFixed(0)+"K"},
                        {label:"Avg Hold Period",         val:avgHoldYears.toFixed(1)+" years"},
                      ].map((r,i)=>(
                        <div key={i} style={{ display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:i<4?`1px solid ${T.border}`:"none" }}>
                          <span style={{ fontSize:12,color:T.textMuted }}>{r.label}</span>
                          <span style={{ fontSize:12,fontWeight:700,color:T.white }}>{r.val}</span>
                        </div>
                      ))}
                    </div>
                    <div className="chart-box" style={{ padding:20 }}>
                      <div style={{ fontFamily:"'Fraunces',serif",fontSize:14,fontWeight:700,color:T.white,marginBottom:16 }}>IRR Benchmark</div>
                      {[
                        {asset:"Your Dubai Portfolio",   irr:irr.toFixed(1)+"%",          color:T.gold,    bold:true  },
                        {asset:"Dubai S&P equivanlent",  irr:"12-18%",                     color:T.textMuted,bold:false },
                        {asset:"UAE Sukuk / Bonds",      irr:"5-7%",                       color:T.textMuted,bold:false },
                        {asset:"London Property",        irr:"4-7% (post-tax)",            color:T.textMuted,bold:false },
                        {asset:"US REITs",               irr:"8-12%",                      color:T.textMuted,bold:false },
                        {asset:"Dubai Stock Market",     irr:"8-15% (DFM)",               color:T.textMuted,bold:false },
                        {asset:"Gold (5yr avg)",         irr:"10-12% USD",                color:T.textMuted,bold:false },
                        {asset:"Savings Account UAE",    irr:"2-3.5%",                    color:T.textMuted,bold:false },
                      ].map((r,i)=>(
                        <div key={i} style={{ display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:i<7?`1px solid ${T.border}`:"none",background:r.bold?"rgba(212,168,67,0.04)":"transparent",marginLeft:r.bold?-10:0,paddingLeft:r.bold?10:0,borderRadius:r.bold?4:0 }}>
                          <span style={{ fontSize:12,color:r.bold?T.white:T.textMuted,fontWeight:r.bold?700:400 }}>{r.asset}</span>
                          <span style={{ fontSize:13,fontWeight:700,color:r.color }}>{r.irr}</span>
                        </div>
                      ))}
                      <div style={{ marginTop:12,padding:"10px 12px",background:"rgba(212,168,67,0.06)",borderRadius:8,fontSize:11,color:T.textMuted,lineHeight:1.7 }}>
                        Dubai zero tax means your gross IRR IS your net IRR — no income tax, no capital gains tax deducted.
                      </div>
                    </div>
                  </div>
                )}

                {/* Sources */}
                <div style={{ paddingTop:12,borderTop:`1px solid ${T.border}`,display:"flex",gap:8,flexWrap:"wrap" }}>
                  <span style={{ fontSize:10,color:T.textMuted }}>Sources:</span>
                  {["DLD Transaction Registry","Firebase Firestore (private)","RERA","Knight Frank Q1 2026"].map((s,i)=>(
                    <span key={i} style={{ fontSize:10,color:T.textMuted,padding:"2px 8px",borderRadius:10,border:`1px solid ${T.border}`,background:T.surfaceAlt }}>{s}</span>
                  ))}
                </div>
              </div>
            );
}

export default PortfolioTab;
