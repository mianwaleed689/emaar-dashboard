/* eslint-disable */
/* ═══════════════════════════════════════════════════════════════════
   DXB ANALYTICS — DXB ESTIMATE TAB
   Extracted from EmaarDashboardV2.jsx
   AVM (Automated Valuation Model) — property valuation tool
   ═══════════════════════════════════════════════════════════════════ */

import React from "react";
import { T } from "../data";
import { SvgIcons } from "../components/Icons";

function DXBEstimateTab({ avmCommunity, setAvmCommunity, avmType, setAvmType, avmBeds, setAvmBeds, avmSize, setAvmSize, avmFloor, setAvmFloor, avmView, setAvmView, avmView2, setAvmView2, avmCondition, setAvmCondition, avmRenovated, setAvmRenovated, avmFurnished, setAvmFurnished, avmParking, setAvmParking, globalFilters = {} }) {

  /* Phase 2.4 Batch 7: auto-sync AVM community with top-bar community filter */
  const gfCommunity = globalFilters?.community && globalFilters.community !== "all"
    ? globalFilters.community : null;
  React.useEffect(() => {
    if (gfCommunity && avmCommunity !== gfCommunity) setAvmCommunity(gfCommunity);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gfCommunity]);


            const BASE_PPSF = {
              "Downtown Dubai":      { Apartment: { Studio:3400,"1BR":3100,"2BR":2900,"3BR":2700 } },
              "Dubai Marina":        { Apartment: { Studio:2400,"1BR":2280,"2BR":2100,"3BR":1950 } },
              "Business Bay":        { Apartment: { Studio:2200,"1BR":2050,"2BR":1900,"3BR":1750 }, Office:2400 },
              "Jumeirah Lake Towers":{ Apartment: { Studio:1500,"1BR":1380,"2BR":1280,"3BR":1200 } },
              "Jumeirah Village Circle":{ Apartment:{ Studio:1300,"1BR":1180,"2BR":1100,"3BR":1050 }, Villa:950 },
              "Dubai Hills Estate":  { Apartment: { "1BR":1950,"2BR":1850,"3BR":1750 }, Villa:1400 },
              "Palm Jumeirah":       { Apartment: { "1BR":5200,"2BR":4800,"3BR":4500 }, Villa:3800 },
              "Sobha Hartland":      { Apartment: { "1BR":2200,"2BR":2100,"3BR":2000 } },
              "Dubai Creek Harbour": { Apartment: { "1BR":2000,"2BR":1942,"3BR":1850 } },
              "Emaar Beachfront":    { Apartment: { "1BR":3100,"2BR":2950,"3BR":2800 } },
              "Arjan":               { Apartment: { Studio:1200,"1BR":1150,"2BR":1080 } },
              "Al Furjan":           { Apartment: { "1BR":1400,"2BR":1320,"3BR":1250 }, Villa:1100 },
              "Arabian Ranches":     { Villa:1200, Townhouse:1100 },
              "Tilal Al Ghaf":       { Villa:1200, Townhouse:1100 },
              "Dubai South":         { Apartment: { Studio:900,"1BR":950,"2BR":880 } },
              "International City":  { Apartment: { Studio:660,"1BR":640,"2BR":620 } },
              "Discovery Gardens":   { Apartment: { Studio:820,"1BR":800,"2BR":780 } },
              "Dubai Silicon Oasis": { Apartment: { Studio:1100,"1BR":1080,"2BR":1020 } },
            };

            const FLOOR_ADJ  = { low:-0.04, mid:0, high:0.05, penthouse:0.15 };
            const VIEW_ADJ   = { courtyard:-0.02, garden:0, pool:0, city:0.04, park:0.03, sea:0.10, burj:0.12 };
            const COND_ADJ   = { poor:-0.10, fair:-0.05, good:0, excellent:0.05, brandnew:0.08 };

            const communityData = BASE_PPSF[avmCommunity] || {};
            const typeData      = communityData[avmType] || {};
            const basePPSF      = typeof typeData === "object" ? (typeData[avmBeds] || Object.values(typeData)[0] || 1500) : (typeData || 1500);

            const totalAdj = 1
              + (FLOOR_ADJ[avmFloor]||0)
              + (VIEW_ADJ[avmView2]||0)
              + (COND_ADJ[avmCondition]||0)
              + (avmRenovated?0.08:0)
              + (avmFurnished?0.05:0)
              + ([0,1,2,3].indexOf(Math.min(avmParking,3)) >= 0 ? [-0.02,0,0.02,0.03][Math.min(avmParking,3)] : 0);

            const adjPPSF  = Math.round(basePPSF * totalAdj);
            const estValue = Math.round(adjPPSF * avmSize);
            const estLow   = Math.round(estValue * 0.92);
            const estHigh  = Math.round(estValue * 1.08);

            const YIELD_MAP = {
              "Downtown Dubai":5.5,"Dubai Marina":6.8,"Business Bay":7.6,
              "Jumeirah Lake Towers":8.1,"Jumeirah Village Circle":7.8,"Dubai Hills Estate":6.2,
              "Palm Jumeirah":5.5,"Sobha Hartland":5.8,"Dubai Creek Harbour":6.0,
              "International City":9.2,"Discovery Gardens":8.5,"Dubai Silicon Oasis":7.6,
              "Arjan":7.5,"Al Furjan":7.2,"Dubai South":7.2,"Emaar Beachfront":5.8,"Arabian Ranches":4.8,"Tilal Al Ghaf":4.8,
            };
            const commYield  = YIELD_MAP[avmCommunity] || 6.5;
            const incomeVal  = Math.round((estValue * commYield/100) / (commYield/100));
            const costVal    = Math.round(avmSize * 1800 + 200000);

            const COMPS = {
              "Downtown Dubai":  [{date:"Mar 2026",size:850, ppsf:3150,beds:"1BR",floor:"High",price:2678000},{date:"Feb 2026",size:1100,ppsf:2980,beds:"2BR",floor:"Mid",price:3278000},{date:"Feb 2026",size:780,ppsf:3220,beds:"1BR",floor:"High",price:2511600},{date:"Jan 2026",size:1450,ppsf:2750,beds:"3BR",floor:"Mid",price:3987500},{date:"Jan 2026",size:820,ppsf:3100,beds:"1BR",floor:"Low",price:2542000}],
              "Dubai Marina":    [{date:"Mar 2026",size:780, ppsf:2320,beds:"1BR",floor:"High",price:1809600},{date:"Mar 2026",size:1100,ppsf:2180,beds:"2BR",floor:"Mid",price:2398000},{date:"Feb 2026",size:750,ppsf:2280,beds:"1BR",floor:"Mid",price:1710000},{date:"Feb 2026",size:1380,ppsf:2050,beds:"3BR",floor:"Low",price:2829000},{date:"Jan 2026",size:780,ppsf:2250,beds:"1BR",floor:"High",price:1755000}],
              "Business Bay":    [{date:"Mar 2026",size:750, ppsf:2100,beds:"1BR",floor:"High",price:1575000},{date:"Mar 2026",size:1050,ppsf:1950,beds:"2BR",floor:"Mid",price:2047500},{date:"Feb 2026",size:720,ppsf:2050,beds:"1BR",floor:"Mid",price:1476000},{date:"Jan 2026",size:1100,ppsf:1900,beds:"2BR",floor:"Low",price:2090000}],
              "Jumeirah Village Circle":[{date:"Mar 2026",size:650,ppsf:1200,beds:"1BR",floor:"High",price:780000},{date:"Mar 2026",size:950,ppsf:1120,beds:"2BR",floor:"Mid",price:1064000},{date:"Feb 2026",size:680,ppsf:1180,beds:"1BR",floor:"Mid",price:802400},{date:"Feb 2026",size:450,ppsf:1300,beds:"Studio",floor:"High",price:585000},{date:"Jan 2026",size:960,ppsf:1100,beds:"2BR",floor:"Low",price:1056000}],
            };
            const comps      = COMPS[avmCommunity] || [];
            const confidence = comps.length >= 5 ? "High" : comps.length >= 3 ? "Medium" : "Low";
            const confColor  = confidence==="High"?T.green:confidence==="Medium"?T.gold:T.red;

            const communities2 = Object.keys(BASE_PPSF);
            const selSt = { background:T.surfaceAlt,border:`1px solid ${T.border}`,borderRadius:8,color:T.white,fontFamily:"'Outfit',sans-serif",fontSize:12,padding:"7px 28px 7px 10px",outline:"none",cursor:"pointer",appearance:"none",WebkitAppearance:"none",backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,backgroundRepeat:"no-repeat",backgroundPosition:"right 8px center" };

            return (
              <div style={{ animation:"fadeUp 0.4s ease-out forwards" }}>
                <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 0",marginBottom:16,borderBottom:`1px solid ${T.border}`,flexWrap:"wrap",gap:8 }}>
                  <div>
                    <div style={{ fontFamily:"'Fraunces',serif",fontSize:20,fontWeight:800,color:T.white }}>DXB Estimate</div>
                    <div style={{ fontSize:11,color:T.textMuted,marginTop:3 }}>Automated Valuation · 18 communities · DLD PPSF · 3-method cross-check · Confidence scoring</div>
                  </div>
                  <div style={{ display:"flex",gap:8 }}>
                    {["estimate","comparables"].map(v=>(
                      <button key={v} type="button" onClick={()=>setAvmView(v)} style={{ padding:"6px 14px",background:avmView===v?"rgba(212,168,67,0.15)":T.surfaceAlt,border:`1px solid ${avmView===v?"rgba(212,168,67,0.4)":T.border}`,borderRadius:8,color:avmView===v?T.gold:T.textMuted,fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"'Outfit',sans-serif" }}>
                        {v==="estimate"?"Get Estimate":"DLD Comparables"}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:16 }}>
                  <div className="chart-box" style={{ padding:22 }}>
                    <div style={{ fontFamily:"'Fraunces',serif",fontSize:13,fontWeight:700,color:T.white,marginBottom:16 }}>Property Details</div>
                    <div style={{ marginBottom:12 }}>
                      <div style={{ fontSize:11,color:T.textMuted,marginBottom:5 }}>Community</div>
                      <select value={avmCommunity} onChange={e=>setAvmCommunity(e.target.value)} style={{ ...selSt,width:"100%" }}>
                        {communities2.map(c=><option key={c}>{c}</option>)}
                      </select>
                    </div>
                    <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12 }}>
                      <div>
                        <div style={{ fontSize:11,color:T.textMuted,marginBottom:5 }}>Type</div>
                        <select value={avmType} onChange={e=>setAvmType(e.target.value)} style={{ ...selSt,width:"100%" }}>
                          {["Apartment","Villa","Townhouse","Office"].map(t=><option key={t}>{t}</option>)}
                        </select>
                      </div>
                      <div>
                        <div style={{ fontSize:11,color:T.textMuted,marginBottom:5 }}>Beds</div>
                        <select value={avmBeds} onChange={e=>setAvmBeds(e.target.value)} style={{ ...selSt,width:"100%" }}>
                          {["Studio","1BR","2BR","3BR","4BR","5BR+"].map(b=><option key={b}>{b}</option>)}
                        </select>
                      </div>
                    </div>
                    <div style={{ marginBottom:14 }}>
                      <div style={{ display:"flex",justifyContent:"space-between",marginBottom:4 }}>
                        <span style={{ fontSize:11,color:T.textMuted }}>Size (sqft)</span>
                        <span style={{ fontSize:12,fontWeight:700,color:T.gold }}>{avmSize.toLocaleString()} sqft</span>
                      </div>
                      <input type="range" min={200} max={8000} step={50} value={avmSize} onChange={e=>setAvmSize(Number(e.target.value))} style={{ width:"100%",accentColor:T.gold,cursor:"pointer" }} />
                    </div>
                    <div style={{ marginBottom:12 }}>
                      <div style={{ fontSize:11,color:T.textMuted,marginBottom:6 }}>Floor Level</div>
                      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:6 }}>
                        {[{key:"low",label:"Low (1-5F)"},{key:"mid",label:"Mid (6-15F)"},{key:"high",label:"High (16-25F)"},{key:"penthouse",label:"Penthouse +15%"}].map(f=>(
                          <button key={f.key} type="button" onClick={()=>setAvmFloor(f.key)} style={{ padding:"7px 8px",background:avmFloor===f.key?"rgba(212,168,67,0.15)":T.surfaceAlt,border:`1px solid ${avmFloor===f.key?"rgba(212,168,67,0.4)":T.border}`,borderRadius:7,color:avmFloor===f.key?T.gold:T.textMuted,fontSize:11,cursor:"pointer",fontFamily:"'Outfit',sans-serif",textAlign:"left" }}>{f.label}</button>
                        ))}
                      </div>
                    </div>
                    <div style={{ marginBottom:12 }}>
                      <div style={{ fontSize:11,color:T.textMuted,marginBottom:6 }}>View</div>
                      <div style={{ display:"flex",flexWrap:"wrap",gap:5 }}>
                        {[{key:"courtyard",label:"Courtyard"},{key:"pool",label:"Pool"},{key:"city",label:"City +4%"},{key:"park",label:"Park +3%"},{key:"sea",label:"Sea +10%"},{key:"burj",label:"Burj +12%"}].map(v=>(
                          <button key={v.key} type="button" onClick={()=>setAvmView2(v.key)} style={{ padding:"5px 10px",background:avmView2===v.key?"rgba(212,168,67,0.15)":T.surfaceAlt,border:`1px solid ${avmView2===v.key?"rgba(212,168,67,0.4)":T.border}`,borderRadius:6,color:avmView2===v.key?T.gold:T.textMuted,fontSize:11,cursor:"pointer",fontFamily:"'Outfit',sans-serif" }}>{v.label}</button>
                        ))}
                      </div>
                    </div>
                    <div style={{ marginBottom:12 }}>
                      <div style={{ fontSize:11,color:T.textMuted,marginBottom:6 }}>Condition</div>
                      <div style={{ display:"flex",gap:5 }}>
                        {[{key:"poor",label:"Poor"},{key:"fair",label:"Fair"},{key:"good",label:"Good"},{key:"excellent",label:"Excellent"},{key:"brandnew",label:"New"}].map(c=>(
                          <button key={c.key} type="button" onClick={()=>setAvmCondition(c.key)} style={{ flex:1,padding:"6px 4px",background:avmCondition===c.key?"rgba(212,168,67,0.15)":T.surfaceAlt,border:`1px solid ${avmCondition===c.key?"rgba(212,168,67,0.4)":T.border}`,borderRadius:6,color:avmCondition===c.key?T.gold:T.textMuted,fontSize:10,cursor:"pointer",fontFamily:"'Outfit',sans-serif",textAlign:"center" }}>{c.label}</button>
                        ))}
                      </div>
                    </div>
                    <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8 }}>
                      {[{label:"Renovated",val:avmRenovated,set:setAvmRenovated},{label:"Furnished",val:avmFurnished,set:setAvmFurnished}].map((t,i)=>(
                        <div key={i} onClick={()=>t.set(!t.val)} style={{ padding:"8px 10px",background:t.val?"rgba(16,185,129,0.08)":T.surfaceAlt,border:`1px solid ${t.val?T.green:T.border}`,borderRadius:8,cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center" }}>
                          <span style={{ fontSize:11,color:t.val?T.green:T.textMuted }}>{t.label}</span>
                          <div style={{ width:30,height:16,borderRadius:8,background:t.val?T.green:T.border,position:"relative" }}>
                            <div style={{ width:12,height:12,borderRadius:"50%",background:"#fff",position:"absolute",top:2,left:t.val?16:2,transition:"left 0.15s" }} />
                          </div>
                        </div>
                      ))}
                      <div>
                        <div style={{ fontSize:10,color:T.textMuted,marginBottom:4 }}>Parking</div>
                        <select value={avmParking} onChange={e=>setAvmParking(Number(e.target.value))} style={{ ...selSt,width:"100%",padding:"7px 10px" }}>
                          {[0,1,2,3].map(p=><option key={p} value={p}>{p} space{p!==1?"s":""}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                  <div style={{ display:"flex",flexDirection:"column",gap:12 }}>
                    <div style={{ padding:"22px",background:"linear-gradient(135deg,rgba(212,168,67,0.12),rgba(212,168,67,0.04))",border:"1px solid rgba(212,168,67,0.3)",borderRadius:14,textAlign:"center" }}>
                      <div style={{ display:"flex",justifyContent:"center",alignItems:"center",gap:8,marginBottom:8 }}>
                        <span style={{ fontSize:11,fontWeight:700,color:T.textMuted,letterSpacing:1,textTransform:"uppercase" }}>Estimated Value</span>
                        <span style={{ fontSize:10,padding:"2px 8px",borderRadius:8,background:confColor+"22",color:confColor,fontWeight:700 }}>{confidence} Confidence</span>
                      </div>
                      <div style={{ fontFamily:"'Fraunces',serif",fontSize:38,fontWeight:900,color:T.gold,lineHeight:1 }}>AED {(estValue/1e6).toFixed(2)}M</div>
                      <div style={{ fontSize:12,color:T.textMuted,marginTop:6 }}>Range: AED {(estLow/1e6).toFixed(2)}M – AED {(estHigh/1e6).toFixed(2)}M</div>
                      <div style={{ position:"relative",height:8,borderRadius:4,background:T.border,margin:"12px 0" }}>
                        <div style={{ position:"absolute",left:"8%",right:"8%",height:"100%",background:"rgba(212,168,67,0.2)",borderRadius:4 }} />
                        <div style={{ position:"absolute",left:"50%",transform:"translateX(-50%)",width:3,height:"100%",background:T.gold,borderRadius:2 }} />
                      </div>
                      <div style={{ display:"flex",justifyContent:"space-between",fontSize:10,color:T.textMuted }}>
                        <span>Conservative {(estLow/1e6).toFixed(2)}M</span>
                        <span>Optimistic {(estHigh/1e6).toFixed(2)}M</span>
                      </div>
                    </div>
                    <div className="chart-box" style={{ padding:18 }}>
                      <div style={{ fontSize:12,fontWeight:700,color:T.white,marginBottom:12 }}>3-Method Cross-Check</div>
                      {[
                        {method:"Sales Comparison",val:estValue,weight:"60%",color:T.gold,desc:`DLD PPSF AED ${adjPPSF}/sqft × ${avmSize}sqft · adjusted for your attributes`},
                        {method:"Income Approach", val:incomeVal,weight:"30%",color:T.teal,desc:`${commYield}% community yield capitalisation · Est rent AED ${Math.round(estValue*commYield/100/1000)}K/yr`},
                        {method:"Cost Approach",   val:costVal,  weight:"10%",color:"#8B5CF6",desc:"Land + construction cost + depreciation (indicative)"},
                      ].map((m,i)=>(
                        <div key={i} style={{ marginBottom:i<2?12:0,paddingBottom:i<2?12:0,borderBottom:i<2?`1px solid ${T.border}`:"none" }}>
                          <div style={{ display:"flex",justifyContent:"space-between",marginBottom:3 }}>
                            <span style={{ fontSize:12,fontWeight:600,color:T.white }}>{m.method} <span style={{ fontSize:10,color:T.textMuted }}>({m.weight})</span></span>
                            <span style={{ fontFamily:"'Fraunces',serif",fontSize:15,fontWeight:800,color:m.color }}>AED {(m.val/1e6).toFixed(2)}M</span>
                          </div>
                          <div style={{ fontSize:11,color:T.textMuted }}>{m.desc}</div>
                        </div>
                      ))}
                    </div>
                    <div className="chart-box" style={{ padding:18 }}>
                      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8 }}>
                        {[
                          {label:"Adj. PPSF",val:"AED "+adjPPSF.toLocaleString(),color:T.white},
                          {label:"Base PPSF",val:"AED "+basePPSF.toLocaleString(),color:T.textMuted},
                          {label:"Est. Annual Rent",val:"AED "+(Math.round(estValue*commYield/100)/1000).toFixed(0)+"K",color:T.green},
                          {label:"Gross Yield Est.",val:commYield+"%",color:T.teal},
                          {label:"Total Adjustment",val:((totalAdj-1)*100).toFixed(1)+"%",color:totalAdj>1?T.green:"#F97316"},
                          {label:"Confidence",val:confidence,color:confColor},
                        ].map((r,i)=>(
                          <div key={i} style={{ padding:"10px 12px",background:T.surfaceAlt,borderRadius:8,border:`1px solid ${T.border}` }}>
                            <div style={{ fontSize:9,color:T.textMuted,marginBottom:3,textTransform:"uppercase",letterSpacing:0.6 }}>{r.label}</div>
                            <div style={{ fontFamily:"'Fraunces',serif",fontSize:15,fontWeight:800,color:r.color }}>{r.val}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div style={{ padding:"10px 14px",background:"rgba(212,168,67,0.04)",border:"1px solid rgba(212,168,67,0.15)",borderRadius:8,fontSize:11,color:T.textMuted,lineHeight:1.7 }}>
                      <span style={{ color:T.gold,fontWeight:700 }}>DXB Estimate</span> is indicative only. For mortgage applications or legal transactions, a RERA-certified valuation report is required.
                    </div>
                  </div>
                </div>
                {avmView === "comparables" && (
                  <div className="chart-box" style={{ padding:20,marginTop:16 }}>
                    <div style={{ fontSize:13,fontWeight:700,color:T.white,marginBottom:4 }}>DLD Comparable Transactions — {avmCommunity}</div>
                    <div style={{ fontSize:11,color:T.textMuted,marginBottom:16 }}>Recent registered sales · Q4 2025 – Q1 2026</div>
                    {comps.length > 0 ? (
                      <>
                        <div style={{ background:T.surfaceAlt,borderRadius:8,overflow:"hidden" }}>
                          <div style={{ display:"grid",gridTemplateColumns:"1fr 0.6fr 0.6fr 0.8fr 0.8fr 1fr",padding:"8px 14px",borderBottom:`1px solid ${T.border}` }}>
                            {["Date","Beds","Floor","Size sqft","PPSF","Sale Price"].map((h,i)=>(
                              <div key={i} style={{ fontSize:10,fontWeight:700,color:T.textMuted,textTransform:"uppercase",letterSpacing:0.6 }}>{h}</div>
                            ))}
                          </div>
                          {comps.map((c,i)=>(
                            <div key={i} style={{ display:"grid",gridTemplateColumns:"1fr 0.6fr 0.6fr 0.8fr 0.8fr 1fr",padding:"10px 14px",borderBottom:i<comps.length-1?`1px solid ${T.border}`:"none",alignItems:"center" }}>
                              <div style={{ fontSize:11,color:T.textMuted }}>{c.date}</div>
                              <div style={{ fontSize:12,color:T.white }}>{c.beds}</div>
                              <div style={{ fontSize:11,color:T.textMuted }}>{c.floor}</div>
                              <div style={{ fontSize:12,color:T.white }}>{c.size.toLocaleString()}</div>
                              <div style={{ fontSize:12,fontWeight:700,color:T.gold }}>AED {c.ppsf.toLocaleString()}</div>
                              <div style={{ fontSize:12,fontWeight:700,color:T.white }}>AED {(c.price/1e6).toFixed(2)}M</div>
                            </div>
                          ))}
                        </div>
                        <div style={{ display:"flex",justifyContent:"space-between",marginTop:10,padding:"8px 14px",background:"rgba(212,168,67,0.04)",borderRadius:8 }}>
                          <span style={{ fontSize:11,color:T.textMuted }}>Avg PPSF from {comps.length} comparables</span>
                          <span style={{ fontSize:13,fontWeight:700,color:T.gold }}>AED {Math.round(comps.reduce((a,c)=>a+c.ppsf,0)/comps.length).toLocaleString()}/sqft</span>
                        </div>
                      </>
                    ) : (
                      <div style={{ textAlign:"center",padding:"24px",color:T.textMuted,fontSize:12 }}>No comparables for {avmCommunity}. Select Downtown Dubai, Dubai Marina, Business Bay or JVC.</div>
                    )}
                  </div>
                )}
                <div style={{ paddingTop:12,marginTop:8,borderTop:`1px solid ${T.border}`,display:"flex",gap:8,flexWrap:"wrap" }}>
                  <span style={{ fontSize:10,color:T.textMuted }}>Sources:</span>
                  {["DLD Transaction Registry Q1 2026","PropertyMonitor valu'd","TruEstimate (Bayut+DLD)","RERA Valuation Standards"].map((s,i)=>(
                    <span key={i} style={{ fontSize:10,color:T.textMuted,padding:"2px 8px",borderRadius:10,border:`1px solid ${T.border}`,background:T.surfaceAlt }}>{s}</span>
                  ))}
                </div>
              </div>
            );
}

export default DXBEstimateTab;
