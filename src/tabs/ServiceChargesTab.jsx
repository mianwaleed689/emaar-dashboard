/* eslint-disable */
/* ═══════════════════════════════════════════════════════════════════
   DXB ANALYTICS — SERVICE CHARGES TAB
   Service charges per sqft by community + ROI calculator
   ═══════════════════════════════════════════════════════════════════ */

import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { T } from "../data";
import { SvgIcons } from "../components/Icons";

function ServiceChargesTab({ liveServiceCharges, scSearch, setScSearch, scSort, setScSort, scType, setScType, scView, setScView, scCalcSize, setScCalcSize, scCalcRate, setScCalcRate, scCalcRent, setScCalcRent }) {


            /* ══ SEED DATA — RERA 2026 Research ══
               Source: DLD Service Charge Index, RERA Mollak 2026
               realestateclubdubai.com, drivenproperties.com, luxuryproperty.com
            ══════════════════════════════════════ */
            const SEED_SC = [
              /* ─── APARTMENTS ─── */
              { id:"sc01", community:"International City",    type:"Apartment", rate:6,   rate3yAgo:5,   yoy:5,  tier:"Budget",    chiller:false, notes:"Lowest in Dubai. Basic facilities. High yield offset by low charges.", investGrade:"Excellent" },
              { id:"sc02", community:"Discovery Gardens",     type:"Apartment", rate:8,   rate3yAgo:7,   yoy:5,  tier:"Budget",    chiller:false, notes:"Well managed. Good value for money. Consistent OA management.", investGrade:"Excellent" },
              { id:"sc03", community:"Jumeirah Village Circle",type:"Apartment", rate:12,  rate3yAgo:10,  yoy:8,  tier:"Mid-Range", chiller:false, notes:"Growing community. Rates rising with new amenities. 18,000+ transactions 2025.", investGrade:"Good" },
              { id:"sc04", community:"Dubai Silicon Oasis",   type:"Apartment", rate:11,  rate3yAgo:9,   yoy:8,  tier:"Mid-Range", chiller:false, notes:"Tech hub. Stable OA management. Good yield after charges.", investGrade:"Good" },
              { id:"sc05", community:"DAMAC Hills 2",         type:"Apartment", rate:10,  rate3yAgo:8,   yoy:10, tier:"Mid-Range", chiller:false, notes:"Newer community. Charges expected to rise as amenities complete.", investGrade:"Good" },
              { id:"sc06", community:"Arjan",                 type:"Apartment", rate:13,  rate3yAgo:11,  yoy:9,  tier:"Mid-Range", chiller:false, notes:"Close to Miracle Garden. Mid-tier management quality.", investGrade:"Good" },
              { id:"sc07", community:"Al Furjan",             type:"Apartment", rate:14,  rate3yAgo:12,  yoy:7,  tier:"Mid-Range", chiller:false, notes:"Metro access. Good OA. Charges stable relative to yield.", investGrade:"Good" },
              { id:"sc08", community:"Jumeirah Lake Towers",  type:"Apartment", rate:16,  rate3yAgo:14,  yoy:7,  tier:"Mid-Range", chiller:true,  notes:"Chiller included. Very liquid market. Strong rental demand.", investGrade:"Good" },
              { id:"sc09", community:"Business Bay",          type:"Apartment", rate:18,  rate3yAgo:15,  yoy:10, tier:"Mid-Range", chiller:true,  notes:"Canal views command premium. Chiller extra in some towers.", investGrade:"Average" },
              { id:"sc10", community:"Dubai Marina",          type:"Apartment", rate:18,  rate3yAgo:15,  yoy:8,  tier:"Mid-Range", chiller:true,  notes:"Premium waterfront. District cooling in most towers.", investGrade:"Average" },
              { id:"sc11", community:"Dubai Creek Harbour",   type:"Apartment", rate:16,  rate3yAgo:13,  yoy:10, tier:"Mid-Range", chiller:false, notes:"Newer community rising fast. Emaar managed — professional OA.", investGrade:"Good" },
              { id:"sc12", community:"Sobha Hartland",        type:"Apartment", rate:18,  rate3yAgo:15,  yoy:8,  tier:"Premium",   chiller:false, notes:"Sobha self-managed. High quality finish = higher charge.", investGrade:"Average" },
              { id:"sc13", community:"Dubai Hills Estate",    type:"Apartment", rate:16,  rate3yAgo:14,  yoy:7,  tier:"Premium",   chiller:false, notes:"Emaar managed. Golf views add premium. Good OA track record.", investGrade:"Good" },
              { id:"sc14", community:"Mohammed Bin Rashid City",type:"Apartment",rate:20, rate3yAgo:16,  yoy:12, tier:"Premium",   chiller:false, notes:"Upscale community. Rising charges as more amenities complete.", investGrade:"Average" },
              { id:"sc15", community:"Downtown Dubai",        type:"Apartment", rate:28,  rate3yAgo:24,  yoy:8,  tier:"Premium",   chiller:true,  notes:"District cooling mandatory. Burj Khalifa AED 68/sqft. Highest charges.", investGrade:"Poor" },
              { id:"sc16", community:"Palm Jumeirah",         type:"Apartment", rate:32,  rate3yAgo:28,  yoy:7,  tier:"Ultra",     chiller:true,  notes:"Luxury managed. Very high charges vs yield — for lifestyle buyers.", investGrade:"Poor" },
              { id:"sc17", community:"Emaar Beachfront",      type:"Apartment", rate:20,  rate3yAgo:16,  yoy:11, tier:"Premium",   chiller:false, notes:"Beachfront premium. Emaar managed. Charges rising with popularity.", investGrade:"Average" },
              /* ─── VILLAS ─── */
              { id:"sc18", community:"Arabian Ranches",       type:"Villa",     rate:4.5, rate3yAgo:3.8, yoy:8,  tier:"Mid-Range", chiller:false, notes:"Established community. Low charges = excellent yield impact for villas.", investGrade:"Excellent" },
              { id:"sc19", community:"Dubai Hills Estate",    type:"Villa",     rate:5,   rate3yAgo:4.2, yoy:8,  tier:"Mid-Range", chiller:false, notes:"Golf community. Park access. Good OA quality.", investGrade:"Excellent" },
              { id:"sc20", community:"Tilal Al Ghaf",         type:"Villa",     rate:5.5, rate3yAgo:4,   yoy:15, tier:"Mid-Range", chiller:false, notes:"Newer community. Charges rising but still excellent value.", investGrade:"Good" },
              { id:"sc21", community:"DAMAC Hills 2",         type:"Villa",     rate:3.5, rate3yAgo:3,   yoy:8,  tier:"Budget",    chiller:false, notes:"Most affordable villa charges in Dubai. Excellent for yield.", investGrade:"Excellent" },
              { id:"sc22", community:"The Oasis",             type:"Villa",     rate:6,   rate3yAgo:0,   yoy:0,  tier:"Premium",   chiller:false, notes:"New launch — estimated based on Emaar premium communities.", investGrade:"Good" },
              { id:"sc23", community:"Palm Jumeirah",         type:"Villa",     rate:6,   rate3yAgo:5,   yoy:8,  tier:"Ultra",     chiller:false, notes:"Frond villas. Very high capital value vs modest service charge.", investGrade:"Good" },
            ];

            const liveData = liveServiceCharges?.length > 0 ? liveServiceCharges : SEED_SC;

            // Filters
            const filtered = liveData.filter(d => {
              if (scType !== "All" && d.type !== scType) return false;
              if (scSearch && !JSON.stringify(d).toLowerCase().includes(scSearch.toLowerCase())) return false;
              return true;
            }).sort((a,b) => {
              if (scSort === "rate")         return b.rate - a.rate;
              if (scSort === "rate_asc")     return a.rate - b.rate;
              if (scSort === "community")    return a.community.localeCompare(b.community);
              if (scSort === "yoy")          return b.yoy - a.yoy;
              return 0;
            });

            // KPIs
            const avgRate     = filtered.length > 0 ? (filtered.reduce((a,d) => a + d.rate, 0) / filtered.length).toFixed(1) : 0;
            const highest     = filtered.reduce((a,d) => d.rate > (a?.rate||0) ? d : a, null);
            const lowest      = filtered.reduce((a,d) => d.rate < (a?.rate||999) ? d : a, null);
            const avgYoY      = filtered.length > 0 ? (filtered.filter(d=>d.yoy>0).reduce((a,d) => a + d.yoy, 0) / filtered.filter(d=>d.yoy>0).length).toFixed(1) : 0;
            const withChiller = filtered.filter(d => d.chiller).length;

            // Grade colours
            const gradeCfg = {
              "Excellent": { color: T.green,   bg: "rgba(16,185,129,0.12)"  },
              "Good":      { color: T.gold,    bg: "rgba(212,168,67,0.12)"  },
              "Average":   { color: "#F97316", bg: "rgba(249,115,22,0.12)"  },
              "Poor":      { color: T.red,     bg: "rgba(239,68,68,0.12)"   },
            };
            const tierColor = { "Budget":"#10B981","Mid-Range":"#D4A843","Premium":"#F97316","Ultra":"#EF4444" };

            // Calculator
            const calcAnnual  = scCalcSize * scCalcRate;
            const calcMonthly = Math.round(calcAnnual / 12);
            const calcNetRent = scCalcRent - calcAnnual;
            const calcGrossYield = scCalcRent > 0 ? ((scCalcRent / (scCalcSize * 1500)) * 100).toFixed(1) : 0;
            const calcNetYield   = scCalcRent > 0 ? ((calcNetRent / (scCalcSize * 1500)) * 100).toFixed(1) : 0;
            const calcImpact     = scCalcRent > 0 ? ((calcAnnual / scCalcRent) * 100).toFixed(1) : 0;

            const selSt = {
              background: T.surfaceAlt, border: `1px solid ${T.border}`,
              borderRadius: 8, color: T.white, fontFamily:"'Outfit',sans-serif",
              fontSize: 12, padding:"7px 28px 7px 10px", outline:"none", cursor:"pointer",
              appearance:"none", WebkitAppearance:"none",
              backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
              backgroundRepeat:"no-repeat", backgroundPosition:"right 8px center",
            };

            return (
              <div style={{ animation:"fadeUp 0.4s ease-out forwards" }}>

                {/* Header */}
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 0", marginBottom:16, borderBottom:`1px solid ${T.border}`, flexWrap:"wrap", gap:8 }}>
                  <div>
                    <div style={{ fontFamily:"'Fraunces',serif", fontSize:20, fontWeight:800, color:T.white }}>Service Charge Intelligence</div>
                    <div style={{ fontSize:11, color:T.textMuted, marginTop:3 }}>RERA-regulated rates · Mollak system · Yield impact analysis · 2026 data</div>
                  </div>
                  <div style={{ display:"flex", gap:8 }}>
                    {["table","chart","calculator"].map(v => (
                      <button key={v} type="button" onClick={() => setScView(v)}
                        style={{ padding:"6px 14px", background:scView===v?"rgba(212,168,67,0.15)":T.surfaceAlt, border:`1px solid ${scView===v?"rgba(212,168,67,0.4)":T.border}`, borderRadius:8, color:scView===v?T.gold:T.textMuted, fontSize:11, fontWeight:600, cursor:"pointer", fontFamily:"'Outfit',sans-serif", textTransform:"capitalize" }}>
                        {v}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Alert banner */}
                <div style={{ padding:"10px 16px", background:"rgba(249,115,22,0.06)", border:"1px solid rgba(249,115,22,0.25)", borderRadius:10, marginBottom:16, display:"flex", alignItems:"center", gap:10 }}>
                  {SvgIcons.TrendingUp({ width:14, height:14, style:{ color:"#F97316", flexShrink:0 } })}
                  <span style={{ fontSize:12, color:T.textSecondary }}>
                    <span style={{ color:"#F97316", fontWeight:700 }}>5–10% increase forecast for 2026</span> — RERA Mollak data. Inflation, aging infrastructure, sustainability mandates driving rises. Service charges consume <strong style={{ color:T.white }}>15–25% of gross rental income</strong>. Factor into your yield calculations.
                  </span>
                </div>

                {/* KPIs */}
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))", gap:10, marginBottom:20 }}>
                  {[
                    { label:"Communities",      value:filtered.length,                  color:T.white   },
                    { label:"Avg Rate (AED/sqft)",value:"AED " + avgRate,               color:T.gold    },
                    { label:"Avg YoY Increase", value:avgYoY + "%",                    color:"#F97316" },
                    { label:"Highest Rate",     value:highest ? "AED " + highest.rate : "—", color:T.red  },
                    { label:"Lowest Rate",      value:lowest  ? "AED " + lowest.rate  : "—", color:T.green },
                    { label:"Chiller Included", value:withChiller + " communities",    color:T.teal    },
                  ].map((k,i) => (
                    <div key={i} className="kpi-card">
                      <div style={{ fontSize:10, fontWeight:700, color:T.textMuted, letterSpacing:1, textTransform:"uppercase", marginBottom:8 }}>{k.label}</div>
                      <div style={{ fontFamily:"'Fraunces',serif", fontSize:22, fontWeight:800, color:k.color }}>{k.value}</div>
                    </div>
                  ))}
                </div>

                {/* Filters */}
                <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:"12px 14px", marginBottom:16 }}>
                  <div style={{ display:"flex", gap:8, flexWrap:"wrap", alignItems:"center" }}>
                    <div style={{ position:"relative", flex:"0 0 200px" }}>
                      {SvgIcons.Search({ width:13, height:13, style:{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", color:T.textMuted, pointerEvents:"none" } })}
                      <input value={scSearch} onChange={e => setScSearch(e.target.value)} placeholder="Search community..."
                        style={{ ...selSt, paddingLeft:30, paddingRight:10, width:"100%", backgroundImage:"none" }} />
                    </div>
                    {["All","Apartment","Villa","Office"].map(f => (
                      <button key={f} type="button" onClick={() => setScType(f)}
                        style={{ padding:"6px 14px", background:scType===f?"rgba(212,168,67,0.15)":T.surfaceAlt, border:`1px solid ${scType===f?"rgba(212,168,67,0.4)":T.border}`, borderRadius:8, color:scType===f?T.gold:T.textMuted, fontSize:11, fontWeight:scType===f?700:400, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>
                        {f}
                      </button>
                    ))}
                    <select value={scSort} onChange={e => setScSort(e.target.value)} style={{ ...selSt, marginLeft:"auto" }}>
                      <option value="rate">Sort: Highest Rate</option>
                      <option value="rate_asc">Sort: Lowest Rate</option>
                      <option value="yoy">Sort: Highest YoY</option>
                      <option value="community">Sort: Community A-Z</option>
                    </select>
                    <span style={{ fontSize:11, color:T.textMuted }}>{filtered.length} communities</span>
                  </div>
                </div>

                {/* TABLE VIEW */}
                {scView === "table" && (
                  <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:12, overflow:"hidden", marginBottom:20 }}>
                    <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr 0.8fr 0.8fr 0.8fr 1fr 1.2fr", padding:"10px 16px", background:T.surfaceAlt, borderBottom:`1px solid ${T.border}` }}>
                      {["Community","Type","AED/sqft","3Y Ago","YoY","Chiller","Invest Grade"].map((h,i) => (
                        <div key={i} style={{ fontSize:10, fontWeight:700, color:T.textMuted, letterSpacing:0.8, textTransform:"uppercase" }}>{h}</div>
                      ))}
                    </div>
                    {filtered.map((d,i) => {
                      const grade = gradeCfg[d.investGrade] || gradeCfg["Average"];
                      return (
                        <div key={d.id} style={{ display:"grid", gridTemplateColumns:"2fr 1fr 0.8fr 0.8fr 0.8fr 1fr 1.2fr", padding:"12px 16px", borderBottom:i<filtered.length-1?`1px solid ${T.border}`:"none", background:i%2===0?"transparent":"rgba(255,255,255,0.01)", alignItems:"center" }}
                          onMouseEnter={e => e.currentTarget.style.background="rgba(212,168,67,0.03)"}
                          onMouseLeave={e => e.currentTarget.style.background=i%2===0?"transparent":"rgba(255,255,255,0.01)"}>
                          <div>
                            <div style={{ fontSize:13, fontWeight:600, color:T.white }}>{d.community}</div>
                            <div style={{ fontSize:10, color:T.textMuted, marginTop:1 }}>{d.notes?.substring(0,50)}...</div>
                          </div>
                          <div><span style={{ fontSize:10, padding:"2px 7px", borderRadius:6, background:tierColor[d.tier]+"22", color:tierColor[d.tier], fontWeight:700 }}>{d.tier}</span></div>
                          <div style={{ fontFamily:"'Fraunces',serif", fontSize:16, fontWeight:800, color:d.rate >= 25 ? T.red : d.rate >= 15 ? "#F97316" : d.rate >= 10 ? T.gold : T.green }}>
                            {d.rate}
                          </div>
                          <div style={{ fontSize:12, color:T.textMuted }}>AED {d.rate3yAgo}</div>
                          <div>
                            <span style={{ fontSize:11, fontWeight:700, color:d.yoy >= 10 ? T.red : d.yoy >= 6 ? "#F97316" : T.gold }}>
                              ↑ {d.yoy}%
                            </span>
                          </div>
                          <div>
                            {d.chiller
                              ? <span style={{ fontSize:10, padding:"2px 7px", borderRadius:6, background:"rgba(20,184,166,0.12)", color:T.teal, fontWeight:700 }}>Included</span>
                              : <span style={{ fontSize:10, color:T.textMuted }}>Separate</span>
                            }
                          </div>
                          <div><span style={{ fontSize:11, padding:"3px 10px", borderRadius:10, background:grade.bg, color:grade.color, fontWeight:700 }}>{d.investGrade}</span></div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* CHART VIEW — Rate comparison bar chart */}
                {scView === "chart" && (
                  <div className="chart-box" style={{ padding:20, marginBottom:20 }}>
                    <div style={{ fontSize:13, fontWeight:700, color:T.white, marginBottom:4 }}>Service Charge by Community — AED per sqft per year</div>
                    <div style={{ fontSize:11, color:T.textMuted, marginBottom:20 }}>RERA Mollak 2026 approved rates · Lower is better for investors</div>
                    <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                      {filtered.slice(0,15).map((d,i) => {
                        const maxRate = Math.max(...filtered.map(x=>x.rate));
                        const barPct = (d.rate / maxRate) * 100;
                        const grade = gradeCfg[d.investGrade] || gradeCfg["Average"];
                        return (
                          <div key={i} style={{ display:"flex", alignItems:"center", gap:12 }}>
                            <div style={{ fontSize:11, color:T.textSecondary, minWidth:160, textAlign:"right" }}>{d.community}</div>
                            <div style={{ flex:1, height:24, borderRadius:4, background:T.border, overflow:"hidden", position:"relative" }}>
                              <div style={{ height:"100%", width:`${barPct}%`, background:d.rate>=25?T.red:d.rate>=15?"#F97316":d.rate>=10?T.gold:T.green, borderRadius:4, transition:"width 0.4s ease", display:"flex", alignItems:"center", paddingLeft:8 }}>
                                <span style={{ fontSize:10, fontWeight:700, color:"#000", whiteSpace:"nowrap" }}>AED {d.rate}/sqft</span>
                              </div>
                            </div>
                            <span style={{ fontSize:11, padding:"2px 8px", borderRadius:8, background:grade.bg, color:grade.color, fontWeight:700, minWidth:70, textAlign:"center" }}>{d.investGrade}</span>
                          </div>
                        );
                      })}
                    </div>
                    {/* Legend */}
                    <div style={{ display:"flex", gap:16, marginTop:16, flexWrap:"wrap" }}>
                      {[["#10B981","AED <10 — Excellent"],["#D4A843","AED 10-15 — Good"],["#F97316","AED 15-25 — Average"],["#EF4444","AED 25+ — Poor"]].map(([c,l],i) => (
                        <div key={i} style={{ display:"flex", alignItems:"center", gap:5 }}>
                          <div style={{ width:10, height:10, borderRadius:2, background:c }} />
                          <span style={{ fontSize:10, color:T.textMuted }}>{l}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* CALCULATOR VIEW */}
                {scView === "calculator" && (
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:20 }}>
                    {/* Input */}
                    <div className="chart-box" style={{ padding:24 }}>
                      <div style={{ fontFamily:"'Fraunces',serif", fontSize:14, fontWeight:700, color:T.white, marginBottom:4 }}>Service Charge Calculator</div>
                      <div style={{ fontSize:11, color:T.textMuted, marginBottom:20 }}>Calculate yield impact of service charges on your property</div>
                      {[
                        { label:"Property Size (sqft)", value:scCalcSize, min:200, max:10000, step:50, setter:setScCalcSize, format:v=>v.toLocaleString()+" sqft" },
                        { label:"Service Charge Rate (AED/sqft/yr)", value:scCalcRate, min:2, max:70, step:0.5, setter:setScCalcRate, format:v=>"AED "+v+"/sqft" },
                        { label:"Annual Rent (AED)", value:scCalcRent, min:20000, max:500000, step:5000, setter:setScCalcRent, format:v=>"AED "+v.toLocaleString() },
                      ].map((f,i) => (
                        <div key={i} style={{ marginBottom:18 }}>
                          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                            <span style={{ fontSize:11, color:T.textMuted }}>{f.label}</span>
                            <span style={{ fontSize:12, fontWeight:700, color:T.gold }}>{f.format(f.value)}</span>
                          </div>
                          <input type="range" min={f.min} max={f.max} step={f.step} value={f.value}
                            onChange={e => f.setter(Number(e.target.value))}
                            style={{ width:"100%", accentColor:T.gold, cursor:"pointer" }} />
                          <div style={{ display:"flex", justifyContent:"space-between" }}>
                            <span style={{ fontSize:9, color:T.textMuted }}>{f.format(f.min)}</span>
                            <span style={{ fontSize:9, color:T.textMuted }}>{f.format(f.max)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    {/* Result */}
                    <div className="chart-box" style={{ padding:24 }}>
                      <div style={{ fontFamily:"'Fraunces',serif", fontSize:14, fontWeight:700, color:T.white, marginBottom:20 }}>Your Annual Service Charge Cost</div>
                      {[
                        { label:"Annual Service Charge",  value:"AED " + calcAnnual.toLocaleString(),   color:T.red,  note:"Paid to OA annually" },
                        { label:"Monthly Equivalent",     value:"AED " + calcMonthly.toLocaleString(),  color:"#F97316", note:"For budgeting" },
                        { label:"Annual Rent Income",     value:"AED " + scCalcRent.toLocaleString(),   color:T.white, note:"Gross" },
                        { label:"Net Rent After Charges", value:"AED " + calcNetRent.toLocaleString(),  color:calcNetRent > 0 ? T.green : T.red, note:"After service charge deducted" },
                      ].map((r,i) => (
                        <div key={i} style={{ display:"flex", justifyContent:"space-between", padding:"10px 0", borderBottom:i<3?`1px solid ${T.border}`:"none" }}>
                          <div>
                            <div style={{ fontSize:12, color:T.textMuted }}>{r.label}</div>
                            <div style={{ fontSize:10, color:T.textMuted, opacity:0.7 }}>{r.note}</div>
                          </div>
                          <div style={{ fontFamily:"'Fraunces',serif", fontSize:16, fontWeight:800, color:r.color }}>{r.value}</div>
                        </div>
                      ))}
                      {/* Yield impact */}
                      <div style={{ marginTop:16, padding:"14px 16px", background:`linear-gradient(135deg, ${T.red}11, ${T.red}05)`, borderRadius:10, border:`1px solid ${T.red}33` }}>
                        <div style={{ fontSize:11, color:T.textMuted, marginBottom:8 }}>Yield Impact Summary</div>
                        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 }}>
                          <div style={{ textAlign:"center" }}>
                            <div style={{ fontSize:9, color:T.textMuted, marginBottom:3 }}>GROSS YIELD</div>
                            <div style={{ fontFamily:"'Fraunces',serif", fontSize:18, fontWeight:800, color:T.gold }}>{calcGrossYield}%</div>
                          </div>
                          <div style={{ textAlign:"center" }}>
                            <div style={{ fontSize:9, color:T.textMuted, marginBottom:3 }}>NET YIELD</div>
                            <div style={{ fontFamily:"'Fraunces',serif", fontSize:18, fontWeight:800, color:T.green }}>{calcNetYield}%</div>
                          </div>
                          <div style={{ textAlign:"center" }}>
                            <div style={{ fontSize:9, color:T.textMuted, marginBottom:3 }}>SC EATS</div>
                            <div style={{ fontFamily:"'Fraunces',serif", fontSize:18, fontWeight:800, color:T.red }}>{calcImpact}%</div>
                            <div style={{ fontSize:9, color:T.textMuted }}>of rent</div>
                          </div>
                        </div>
                      </div>
                      <div style={{ marginTop:12, fontSize:11, color:T.textMuted, lineHeight:1.7 }}>
                        Based on avg PPSF of AED 1,500/sqft. Assumes 100% occupancy. Real net yield also affected by vacancy, insurance, maintenance.
                      </div>
                    </div>
                  </div>
                )}

                {/* Info box */}
                <div className="chart-box" style={{ padding:18, marginBottom:16 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:T.white, marginBottom:12 }}>RERA Service Charge Framework — Key Facts</div>
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))", gap:10 }}>
                    {[
                      { icon:"\uD83C\uDFDB", title:"RERA Mollak System", desc:"All OA budgets submitted and approved via Mollak. 1,240+ buildings, AED 4B processed annually. Cannot charge above approved rate." },
                      { icon:"\uD83D\uDCCA", title:"DLD Service Charge Index", desc:"Public database on DLD website. Check any building's RERA-approved rate vs what you're being charged." },
                      { icon:"\uD83D\uDCC8", title:"5-10% Rise in 2026", desc:"DEWA tariffs rising. Aging buildings need more maintenance. Sustainability mandates add cost. Budget for increases." },
                      { icon:"❄", title:"Chiller (District Cooling)", desc:"Downtown, Dubai Marina, Palm — extra AED 2,000-6,000/yr NOT included in standard service charge. Ask before buying." },
                    ].map((f,i) => (
                      <div key={i} style={{ padding:"12px 14px", background:T.surfaceAlt, borderRadius:10, border:`1px solid ${T.border}` }}>
                        <div style={{ fontSize:16, marginBottom:5 }}>{f.icon}</div>
                        <div style={{ fontSize:12, fontWeight:700, color:T.white, marginBottom:4 }}>{f.title}</div>
                        <div style={{ fontSize:11, color:T.textSecondary, lineHeight:1.7 }}>{f.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Seed notice */}
                {!liveServiceCharges?.length && (
                  <div style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 14px", borderRadius:8, background:"rgba(212,168,67,0.06)", border:`1px solid rgba(212,168,67,0.2)`, marginBottom:12 }}>
                    <span style={{ width:6, height:6, borderRadius:"50%", background:T.gold, display:"inline-block" }} />
                    <span style={{ fontSize:11, color:T.textMuted }}><span style={{ color:T.gold, fontWeight:700 }}>RERA 2026 reference data</span> — DLD Mollak, luxuryproperty.com, realestateclubdubai.com · Import live data via Admin → Data Manager</span>
                  </div>
                )}

                {/* Sources */}
                <div style={{ paddingTop:12, borderTop:`1px solid ${T.border}`, display:"flex", gap:8, flexWrap:"wrap", alignItems:"center" }}>
                  <span style={{ fontSize:10, color:T.textMuted }}>Sources:</span>
                  {["RERA Mollak 2026","DLD Service Charge Index","luxuryproperty.com","realestateclubdubai.com","drivenproperties.com"].map((s,i) => (
                    <span key={i} style={{ fontSize:10, color:T.textMuted, padding:"2px 8px", borderRadius:10, border:`1px solid ${T.border}`, background:T.surfaceAlt }}>{s}</span>
                  ))}
                </div>

              </div>
            );
}

export default ServiceChargesTab;
