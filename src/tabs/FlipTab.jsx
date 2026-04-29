/* eslint-disable */
/* ═══════════════════════════════════════════════════════════════════
   DXB ANALYTICS — FLIP TAB
   Extracted from EmaarDashboardV2.jsx
   Property flip ROI calculator with mortgage scenarios
   ═══════════════════════════════════════════════════════════════════ */

import React from "react";
import { T } from "../data";
import { SvgIcons } from "../components/Icons";

function FlipTab({ liveNeighbourhoods=[], flipBuyPrice, setFlipBuyPrice, flipSellPrice, setFlipSellPrice, flipHoldYears, setFlipHoldYears, flipIncludeRental, setFlipIncludeRental, flipRentalYield, setFlipRentalYield, flpRenovCost, setFlpRenovCost, flpAgentBuy, setFlpAgentBuy, flpAgentSell, setFlpAgentSell, flpMortgage, setFlpMortgage, flpMortgageRate, setFlpMortgageRate, flpLTV, setFlpLTV, flpView, setFlpView, flpScenario, setFlpScenario }) {


            /* ══ RESEARCH NOTES ══
               Dubai flip market 2026: Buy-renovate-sell or off-plan flip
               DLD 4% on buy + 4% on sell (if resell before registration = NOC)
               Off-plan flip: sell before completion (requires developer NOC)
               Ready flip: buy → renovate → sell
               Renovation costs: AED 80-200/sqft for mid-range, 200-400 for premium
               Typical hold: 6-24 months for ready flip, 12-36 for off-plan
               Capital gains tax: ZERO in Dubai
               Typical net profit: 8-25% on well-chosen properties
            ══════════════════════════════════════════════════════════ */

            /* ── All inputs come from existing flipBuyPrice etc
               + new flp* state for renovation/costs ── */
            const [flipSearch, setFlipSearch] = React.useState("");
  const [flipComm, setFlipComm] = React.useState(null);
  const flipHints = React.useMemo(()=>{
    if(!flipSearch.trim()||flipSearch.length<2) return [];
    return (liveNeighbourhoods||[]).filter(n=>n.avgPpsf>0&&(n.community||"").toLowerCase().includes(flipSearch.toLowerCase())).slice(0,5);
  },[liveNeighbourhoods,flipSearch]);
  const buyPrice = flipBuyPrice;
            const sellPrice    = flipSellPrice;
            const holdYears    = flipHoldYears;
            const rentalYield  = flipRentalYield;
            const inclRental   = flipIncludeRental;

            /* ── Acquisition costs ── */
            const dldBuy       = buyPrice * 0.04;
            const agentBuy     = buyPrice * (flpAgentBuy / 100);
            const regFee       = 4000;
            const totalAcqCost = dldBuy + agentBuy + regFee;

            /* ── Mortgage costs (if leveraged) ── */
            const loanAmt      = flpMortgage ? buyPrice * (flpLTV / 100) : 0;
            const mortMonthly  = flpMortgage && loanAmt > 0
              ? loanAmt * ((flpMortgageRate/100/12) * Math.pow(1+flpMortgageRate/100/12, holdYears*12)) / (Math.pow(1+flpMortgageRate/100/12, holdYears*12) - 1)
              : 0;
            const totalMortCost = mortMonthly * holdYears * 12;
            const mortInterest  = totalMortCost - loanAmt;
            const equityIn      = flpMortgage ? buyPrice - loanAmt : buyPrice;

            /* ── Holding costs ── */
            const scPerYear    = buyPrice * 0.01; // ~1% service charge estimate
            const totalSC      = scPerYear * holdYears;

            /* ── Rental income during hold ── */
            const annualRental = inclRental ? buyPrice * (rentalYield / 100) : 0;
            const totalRental  = annualRental * holdYears;

            /* ── Renovation ── */
            const renovCost    = flpRenovCost;

            /* ── Disposal costs ── */
            const dldSell      = sellPrice * 0.04;
            const agentSell    = sellPrice * (flpAgentSell / 100);
            const totalDispose = dldSell + agentSell;

            /* ── P&L ── */
            const totalIn      = buyPrice + totalAcqCost + renovCost + totalSC + (flpMortgage ? mortInterest : 0);
            const totalOut     = sellPrice + totalRental;
            const netProfit    = sellPrice + totalRental - totalIn;
            const totalInvested = flpMortgage ? equityIn + totalAcqCost + renovCost + totalSC + mortInterest : buyPrice + totalAcqCost + renovCost + totalSC;
            const roi          = totalInvested > 0 ? (netProfit / totalInvested * 100) : 0;
            const annualisedROI = holdYears > 0 ? (Math.pow(1 + roi/100, 1/holdYears) - 1) * 100 : 0;
            const cashIn       = flpMortgage ? equityIn + totalAcqCost + renovCost + totalSC : buyPrice + totalAcqCost + renovCost + totalSC;
            const cashROI      = cashIn > 0 ? (netProfit / cashIn * 100) : 0;

            /* ── Scenarios ── */
            const scenarios = {
              bear:  { sellMulti: 0.90, note: "Market softens 10%. Common in oversupplied areas." },
              base:  { sellMulti: 1.00, note: "Sell at planned price. Realistic in established communities." },
              bull:  { sellMulti: 1.12, note: "Market appreciates 12%. Strong demand community." },
            };
            const scenSell    = sellPrice * scenarios[flpScenario].sellMulti;
            const scenProfit  = scenSell + totalRental - totalIn;
            const scenROI     = totalInvested > 0 ? (scenProfit / totalInvested * 100) : 0;

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
                    <div style={{ fontFamily:"'Fraunces',serif", fontSize:20, fontWeight:800, color:T.white }}>Flip Calculator</div>
                    <div style={{ fontSize:11, color:T.textMuted, marginTop:3 }}>Buy · Renovate · Sell · ROI · DLD costs · Mortgage leverage · Scenario analysis</div>
                  </div>
                  <div style={{ display:"flex", gap:8 }}>
                    {["calculator","guide"].map(v => (
                      <button key={v} type="button" onClick={() => setFlpView(v)}
                        style={{ padding:"6px 14px", background:flpView===v?"rgba(212,168,67,0.15)":T.surfaceAlt, border:`1px solid ${flpView===v?"rgba(212,168,67,0.4)":T.border}`, borderRadius:8, color:flpView===v?T.gold:T.textMuted, fontSize:11, fontWeight:600, cursor:"pointer", fontFamily:"'Outfit',sans-serif", textTransform:"capitalize" }}>
                        {v === "calculator" ? "Calculator" : "Flip Guide"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Dubai flip fact strip */}
                <div style={{ display:"flex", gap:10, marginBottom:16, flexWrap:"wrap" }}>
                  {[
                    { label:"Capital Gains Tax",  val:"ZERO",    color:T.green,  note:"Dubai advantage" },
                    { label:"DLD on Buy",         val:"4%",      color:"#F97316", note:"of purchase price" },
                    { label:"DLD on Sell",        val:"4%",      color:"#F97316", note:"of sale price" },
                    { label:"Agent (Buy+Sell)",   val:"2%+2%",   color:T.textMuted, note:"negotiable" },
                    { label:"Typical Net ROI",    val:"8–25%",   color:T.gold,   note:"well-chosen flip" },
                    { label:"Off-Plan Flip",      val:"NOC req", color:T.teal,   note:"developer permission" },
                  ].map((e,i) => (
                    <div key={i} style={{ padding:"8px 14px", background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, textAlign:"center", flex:"1 1 80px" }}>
                      <div style={{ fontSize:9, fontWeight:700, color:T.textMuted, textTransform:"uppercase", letterSpacing:0.8 }}>{e.label}</div>
                      <div style={{ fontFamily:"'Fraunces',serif", fontSize:15, fontWeight:800, color:e.color, margin:"3px 0" }}>{e.val}</div>
                      <div style={{ fontSize:9, color:T.textMuted }}>{e.note}</div>
                    </div>
                  ))}
                </div>

                {flpView === "calculator" && (
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:16 }}>

                    {/* Left — Inputs */}
                    <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                      {/* Main sliders */}
                      <div className="chart-box" style={{ padding:22 }}>
                        <div style={{ fontFamily:"'Fraunces',serif", fontSize:13, fontWeight:700, color:T.white, marginBottom:16 }}>Deal Parameters</div>
                        {[
                          { label:"Buy Price (AED)",          val:flipBuyPrice,    min:300000,  max:15000000, step:50000,  set:setFlipBuyPrice,    fmt:v=>v>=1e6?"AED "+(v/1e6).toFixed(2)+"M":"AED "+(v/1000).toFixed(0)+"K" },
                          { label:"Target Sell Price (AED)",  val:flipSellPrice,   min:300000,  max:20000000, step:50000,  set:setFlipSellPrice,   fmt:v=>v>=1e6?"AED "+(v/1e6).toFixed(2)+"M":"AED "+(v/1000).toFixed(0)+"K" },
                          { label:"Renovation Budget (AED)",  val:flpRenovCost,    min:0,       max:1000000,  step:5000,   set:setFlpRenovCost,    fmt:v=>"AED "+(v/1000).toFixed(0)+"K" },
                          { label:"Hold Period (months)",     val:flipHoldYears*12,min:1,        max:60,       step:1,      set:v=>setFlipHoldYears(v/12), fmt:v=>v+" months" },
                        ].map((f,i) => (
                          <div key={i} style={{ marginBottom:14 }}>
                            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                              <span style={{ fontSize:11, color:T.textMuted }}>{f.label}</span>
                              <span style={{ fontSize:12, fontWeight:700, color:T.gold }}>{f.fmt(f.val)}</span>
                            </div>
                            <input type="range" min={f.min} max={f.max} step={f.step} value={f.val}
                              onChange={e => f.set(Number(e.target.value))}
                              style={{ width:"100%", accentColor:T.gold, cursor:"pointer" }} />
                          </div>
                        ))}
                        {/* Agent fees row */}
                        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                          {[
                            { label:"Agent Fee Buy (%)", val:flpAgentBuy,  set:setFlpAgentBuy,  min:0, max:5, step:0.25 },
                            { label:"Agent Fee Sell (%)",val:flpAgentSell, set:setFlpAgentSell, min:0, max:5, step:0.25 },
                          ].map((f,i) => (
                            <div key={i}>
                              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                                <span style={{ fontSize:11, color:T.textMuted }}>{f.label}</span>
                                <span style={{ fontSize:12, fontWeight:700, color:T.gold }}>{f.val}%</span>
                              </div>
                              <input type="range" min={f.min} max={f.max} step={f.step} value={f.val}
                                onChange={e => f.set(Number(e.target.value))}
                                style={{ width:"100%", accentColor:T.gold, cursor:"pointer" }} />
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Rental income toggle */}
                      <div className="chart-box" style={{ padding:16 }}>
                        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:inclRental?12:0 }}>
                          <div>
                            <div style={{ fontSize:12, fontWeight:700, color:T.white }}>Rental Income During Hold</div>
                            <div style={{ fontSize:11, color:T.textMuted }}>Include rent collected while waiting to sell</div>
                          </div>
                          <button type="button" onClick={() => setFlipIncludeRental(!inclRental)}
                            style={{ width:44, height:24, borderRadius:12, background:inclRental?T.green:T.border, border:"none", cursor:"pointer", position:"relative", transition:"background 0.2s" }}>
                            <div style={{ width:20, height:20, borderRadius:"50%", background:"#fff", position:"absolute", top:2, left:inclRental?22:2, transition:"left 0.2s" }} />
                          </button>
                        </div>
                        {inclRental && (
                          <div>
                            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                              <span style={{ fontSize:11, color:T.textMuted }}>Rental Yield (%)</span>
                              <span style={{ fontSize:12, fontWeight:700, color:T.green }}>{flipRentalYield}%</span>
                            </div>
                            <input type="range" min={3} max={12} step={0.1} value={flipRentalYield}
                              onChange={e => setFlipRentalYield(Number(e.target.value))}
                              style={{ width:"100%", accentColor:T.green, cursor:"pointer" }} />
                          </div>
                        )}
                      </div>

                      {/* Mortgage leverage toggle */}
                      <div className="chart-box" style={{ padding:16 }}>
                        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:flpMortgage?12:0 }}>
                          <div>
                            <div style={{ fontSize:12, fontWeight:700, color:T.white }}>Use Mortgage (Leverage)</div>
                            <div style={{ fontSize:11, color:T.textMuted }}>Higher ROI on equity, but interest cost applies</div>
                          </div>
                          <button type="button" onClick={() => setFlpMortgage(!flpMortgage)}
                            style={{ width:44, height:24, borderRadius:12, background:flpMortgage?T.gold:T.border, border:"none", cursor:"pointer", position:"relative", transition:"background 0.2s" }}>
                            <div style={{ width:20, height:20, borderRadius:"50%", background:"#fff", position:"absolute", top:2, left:flpMortgage?22:2, transition:"left 0.2s" }} />
                          </button>
                        </div>
                        {flpMortgage && (
                          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                            {[
                              { label:"LTV (%)",       val:flpLTV,         min:50, max:80, step:5,    set:setFlpLTV,         fmt:v=>v+"%" },
                              { label:"Rate (% p.a.)", val:flpMortgageRate, min:3.5,max:7,  step:0.05, set:setFlpMortgageRate,fmt:v=>v.toFixed(2)+"%" },
                            ].map((f,i) => (
                              <div key={i}>
                                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                                  <span style={{ fontSize:11, color:T.textMuted }}>{f.label}</span>
                                  <span style={{ fontSize:12, fontWeight:700, color:T.gold }}>{f.fmt(f.val)}</span>
                                </div>
                                <input type="range" min={f.min} max={f.max} step={f.step} value={f.val}
                                  onChange={e => f.set(Number(e.target.value))}
                                  style={{ width:"100%", accentColor:T.gold, cursor:"pointer" }} />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right — Results */}
                    <div style={{ display:"flex", flexDirection:"column", gap:12 }}>

                      {/* Scenario selector */}
                      <div style={{ display:"flex", gap:8 }}>
                        {[
                          { key:"bear", label:"\uD83D\uDC3B Bear", color:T.red,   note:"-10% sell" },
                          { key:"base", label:"\uD83D\uDCCA Base", color:T.gold,  note:"as planned" },
                          { key:"bull", label:"\uD83D\uDC02 Bull", color:T.green, note:"+12% sell"  },
                        ].map(s => (
                          <button key={s.key} type="button" onClick={() => setFlpScenario(s.key)}
                            style={{ flex:1, padding:"8px 6px", background:flpScenario===s.key?s.color+"22":T.surfaceAlt, border:`1px solid ${flpScenario===s.key?s.color:T.border}`, borderRadius:8, cursor:"pointer", fontFamily:"'Outfit',sans-serif", textAlign:"center" }}>
                            <div style={{ fontSize:13, fontWeight:700, color:flpScenario===s.key?s.color:T.textMuted }}>{s.label}</div>
                            <div style={{ fontSize:10, color:T.textMuted }}>{s.note}</div>
                          </button>
                        ))}
                      </div>

                      {/* Net profit hero */}
                      <div style={{ padding:"22px", background:netProfit>0?"linear-gradient(135deg,rgba(16,185,129,0.12),rgba(16,185,129,0.04))":"linear-gradient(135deg,rgba(239,68,68,0.12),rgba(239,68,68,0.04))", border:`1px solid ${netProfit>0?"rgba(16,185,129,0.3)":"rgba(239,68,68,0.3)"}`, borderRadius:14, textAlign:"center" }}>
                        <div style={{ fontSize:11, fontWeight:700, color:T.textMuted, letterSpacing:1, textTransform:"uppercase", marginBottom:8 }}>
                          {flpScenario !== "base" ? `${flpScenario.toUpperCase()} SCENARIO — ` : ""}Net Profit
                        </div>
                        <div style={{ fontFamily:"'Fraunces',serif", fontSize:38, fontWeight:900, color:scenProfit>0?T.green:T.red, lineHeight:1 }}>
                          {scenProfit>=0?"+":" "}AED {Math.abs(Math.round(scenProfit)).toLocaleString()}
                        </div>
                        <div style={{ fontSize:12, color:T.textMuted, marginTop:8 }}>
                          {flpScenario!=="base" && <span>Sell at AED {Math.round(scenSell).toLocaleString()} · </span>}
                          ROI: <span style={{ color:scenROI>0?T.green:T.red, fontWeight:700 }}>{scenROI.toFixed(1)}%</span>
                          {holdYears > 0 && <span style={{ color:T.textMuted }}>{"·"}{(((Math.pow(1+scenROI/100,1/holdYears)-1)*100)).toFixed(1)}% p.a.</span>}
                        </div>
                        {scenProfit !== netProfit && (
                          <div style={{ marginTop:6, fontSize:11, color:T.textMuted }}>vs Base: {netProfit>0?"+":""}{Math.round(scenProfit-netProfit).toLocaleString()} AED</div>
                        )}
                      </div>

                      {/* Full P&L */}
                      <div className="chart-box" style={{ padding:18 }}>
                        <div style={{ fontSize:12, fontWeight:700, color:T.white, marginBottom:12 }}>Full P&L Breakdown</div>
                        {/* Costs */}
                        <div style={{ fontSize:10, fontWeight:700, color:T.textMuted, textTransform:"uppercase", letterSpacing:0.8, marginBottom:6 }}>COSTS (money out)</div>
                        {[
                          { label:"Purchase Price",      val: buyPrice,       color:T.white },
                          { label:"DLD Fee (4% buy)",    val: dldBuy,         color:"#F97316" },
                          { label:"Agent Fee (buy)",     val: agentBuy,       color:"#F97316" },
                          { label:"Registration",        val: regFee,         color:"#F97316" },
                          { label:"Renovation",          val: renovCost,      color:"#F97316" },
                          { label:"Service Charges",     val: totalSC,        color:"#F97316" },
                          ...(flpMortgage ? [{ label:"Mortgage Interest",val: mortInterest, color:T.red }] : []),
                        ].map((r,i) => (
                          <div key={i} style={{ display:"flex", justifyContent:"space-between", padding:"5px 0", borderBottom:`1px solid ${T.border}` }}>
                            <span style={{ fontSize:11, color:T.textMuted }}>{r.label}</span>
                            <span style={{ fontSize:11, fontWeight:600, color:r.color }}>AED {Math.round(r.val).toLocaleString()}</span>
                          </div>
                        ))}
                        {/* Income */}
                        <div style={{ fontSize:10, fontWeight:700, color:T.textMuted, textTransform:"uppercase", letterSpacing:0.8, marginTop:10, marginBottom:6 }}>INCOME (money in)</div>
                        {[
                          { label:"Sale Price",          val: sellPrice,      color:T.green },
                          ...(inclRental ? [{ label:"Rental Income ("+holdYears.toFixed(1)+"yrs)", val: totalRental, color:T.green }] : []),
                        ].map((r,i) => (
                          <div key={i} style={{ display:"flex", justifyContent:"space-between", padding:"5px 0", borderBottom:`1px solid ${T.border}` }}>
                            <span style={{ fontSize:11, color:T.textMuted }}>{r.label}</span>
                            <span style={{ fontSize:11, fontWeight:600, color:r.color }}>AED {Math.round(r.val).toLocaleString()}</span>
                          </div>
                        ))}
                        {/* Summary */}
                        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginTop:12 }}>
                          {[
                            { label:"Total Invested",  val:"AED "+Math.round(totalInvested).toLocaleString(), color:T.white },
                            { label:"Cash In",         val:"AED "+Math.round(cashIn).toLocaleString(),         color:T.white },
                            { label:"ROI on Total",    val:roi.toFixed(1)+"%",                                 color:roi>0?T.green:T.red },
                            { label:"Cash ROI",        val:cashROI.toFixed(1)+"%",                             color:cashROI>0?T.green:T.red },
                            { label:"Annualised",      val:annualisedROI.toFixed(1)+"% p.a.",                  color:T.gold },
                            { label:"Holding Period",  val:(holdYears*12).toFixed(0)+" months",                color:T.teal },
                          ].map((m,i) => (
                            <div key={i} style={{ padding:"10px 12px", background:T.surfaceAlt, borderRadius:8, border:`1px solid ${T.border}` }}>
                              <div style={{ fontSize:9, color:T.textMuted, marginBottom:3 }}>{m.label}</div>
                              <div style={{ fontFamily:"'Fraunces',serif", fontSize:15, fontWeight:800, color:m.color }}>{m.val}</div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* DLD warning */}
                      <div style={{ padding:"12px 14px", background:"rgba(249,115,22,0.06)", border:"1px solid rgba(249,115,22,0.25)", borderRadius:10 }}>
                        <div style={{ fontSize:11, fontWeight:700, color:"#F97316", marginBottom:4 }}>⚠ DLD Cost Reality Check</div>
                        <div style={{ fontSize:11, color:T.textSecondary, lineHeight:1.7 }}>
                          DLD fees total <strong style={{ color:T.white }}>AED {Math.round(dldBuy+dldSell).toLocaleString()}</strong> (4% buy + 4% sell).
                          Your property must appreciate <strong style={{ color:T.white }}>{(((dldBuy+dldSell+renovCost+agentBuy+agentSell)/buyPrice)*100).toFixed(1)}%</strong> just to break even before profit.
                          Zero capital gains tax is the Dubai advantage.
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* FLIP GUIDE VIEW */}
                {flpView === "guide" && (
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:20 }}>
                    <div className="chart-box" style={{ padding:20 }}>
                      <div style={{ fontFamily:"'Fraunces',serif", fontSize:13, fontWeight:700, color:T.white, marginBottom:16 }}>Ready Property Flip</div>
                      {[
                        { step:"1", title:"Find undervalued ready unit", detail:"Distressed sellers, divorce sales, estate sales, motivated sellers. Look for properties 10-15% below market." },
                        { step:"2", title:"Negotiate + buy quickly", detail:"Cash buyers close in 2-3 weeks. Get pre-approved mortgage for speed. Don't over-negotiate — speed beats price." },
                        { step:"3", title:"Renovate strategically", detail:"Kitchen + bathrooms = 80% of value add. Budget AED 80-150/sqft for mid-range. Don't over-renovate for the area." },
                        { step:"4", title:"Rent while waiting (optional)", detail:"Furnished short-term rental during renovation period. 6-8% yield offsets holding costs." },
                        { step:"5", title:"Market and sell", detail:"Professional photography, Bayut + PF listings. Target 3-6 months to sell. Price 5-8% above similar units." },
                      ].map((s,i) => (
                        <div key={i} style={{ display:"flex", gap:12, marginBottom:14, paddingBottom:14, borderBottom:i<4?`1px solid ${T.border}`:"none" }}>
                          <div style={{ width:26, height:26, borderRadius:"50%", background:"rgba(212,168,67,0.15)", border:`1px solid rgba(212,168,67,0.4)`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, fontSize:11, fontWeight:700, color:T.gold }}>{s.step}</div>
                          <div>
                            <div style={{ fontSize:12, fontWeight:700, color:T.white, marginBottom:3 }}>{s.title}</div>
                            <div style={{ fontSize:11, color:T.textSecondary, lineHeight:1.7 }}>{s.detail}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="chart-box" style={{ padding:20 }}>
                      <div style={{ fontFamily:"'Fraunces',serif", fontSize:13, fontWeight:700, color:T.white, marginBottom:16 }}>Off-Plan Flip</div>
                      {[
                        { step:"1", title:"Buy pre-launch or launch", detail:"Entry at developer price (before market markup). Look for 20-30% below anticipated ready price. Priority is community fundamentals." },
                        { step:"2", title:"Pay installments only", detail:"Construction-linked plan: pay 10-30% upfront, rest in installments. Limits cash tied up. DLD on full price at registration." },
                        { step:"3", title:"Get developer NOC to sell", detail:"Required to sell before handover. Most developers allow after 30-40% paid + fee. Some charge 1-2% NOC fee." },
                        { step:"4", title:"Assign/sell before handover", detail:"Buyer takes over your SPA. You pocket the appreciation minus costs. Typical hold: 12-24 months." },
                        { step:"5", title:"Risk factors to watch", detail:"Delay risk (only Tier-1 developers), oversupply in area, market sentiment shifts, developer NOC refusal." },
                      ].map((s,i) => (
                        <div key={i} style={{ display:"flex", gap:12, marginBottom:14, paddingBottom:14, borderBottom:i<4?`1px solid ${T.border}`:"none" }}>
                          <div style={{ width:26, height:26, borderRadius:"50%", background:"rgba(20,184,166,0.15)", border:`1px solid rgba(20,184,166,0.4)`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, fontSize:11, fontWeight:700, color:T.teal }}>{s.step}</div>
                          <div>
                            <div style={{ fontSize:12, fontWeight:700, color:T.white, marginBottom:3 }}>{s.title}</div>
                            <div style={{ fontSize:11, color:T.textSecondary, lineHeight:1.7 }}>{s.detail}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sources */}
                <div style={{ paddingTop:12, borderTop:`1px solid ${T.border}`, display:"flex", gap:8, flexWrap:"wrap" }}>
                  <span style={{ fontSize:10, color:T.textMuted }}>Sources:</span>
                  {["DLD Fee Schedule 2026","UAE Capital Gains Tax (zero)","RERA renovation standards","Bayut market data","Knight Frank Q1 2026"].map((s,i) => (
                    <span key={i} style={{ fontSize:10, color:T.textMuted, padding:"2px 8px", borderRadius:10, border:`1px solid ${T.border}`, background:T.surfaceAlt }}>{s}</span>
                  ))}
                </div>
              </div>
            );
}

export default FlipTab;
