/* eslint-disable */
/* ═══════════════════════════════════════════════════════════════════
   DXB ANALYTICS — GOLDEN VISA TAB
   AED 2M+ property qualifies for UAE 10-year Golden Visa
   ═══════════════════════════════════════════════════════════════════ */

import React from "react";
import { T } from "../data";
import { SvgIcons } from "../components/Icons";
import { GOLDEN_VISA_THRESHOLD } from "../utils/constants";
import { useFilterSchema } from "../contexts/FilterSchemaContext";

function GoldenVisaTab({ gvView, setGvView, gvCategory, setGvCategory, gvNumProps, setGvNumProps, gvPropPrice, setGvPropPrice, gvMortgage, setGvMortgage, gvOffplan, setGvOffplan, gvOffplanPaid, setGvOffplanPaid, gvMortgagePaid, liveProjects, SEED_PROJECTS, handleTabChange }) {


            /* ══ RESEARCH — Golden Visa 2026 ══
               Sources: dubailand.gov.ae, icp.gov.ae, u.ae, gdrfad.gov.ae
               realestateclubdubai.com (updated 15hrs ago Apr 2026)
               Federal Decree-Law No. 14 of 2022
            ════════════════════════════════════ */

            // Phase 3.9: threshold comes from FilterSchemaContext (admin-editable)
            const _schema = useFilterSchema();
            const THRESHOLD = _schema.goldenVisaThreshold || GOLDEN_VISA_THRESHOLD;
            // Human-readable threshold: "AED 2M" / "AED 2.5M" / "AED 3M"
            const thresholdLabel = THRESHOLD >= 1000000
              ? `AED ${(THRESHOLD / 1000000).toFixed(THRESHOLD % 1000000 === 0 ? 0 : 1)}M`
              : `AED ${(THRESHOLD / 1000).toFixed(0)}K`;
            // Full format e.g. "AED 2,500,000"
            const thresholdFull = `AED ${THRESHOLD.toLocaleString()}`;

            /* ── Eligibility check ── */
            const effectivePropValue = gvMortgage
              ? gvMortgagePaid
              : gvOffplan
                ? gvOffplanPaid
                : gvPropPrice;

            const eligible       = effectivePropValue >= THRESHOLD;
            const gap            = THRESHOLD - effectivePropValue;
            const pctToThreshold = Math.min((effectivePropValue / THRESHOLD) * 100, 100);

            /* ── Categories ── */
            const CATEGORIES = [
              {
                key:"property", icon:"\uD83C\uDFE0", title:"Real Estate Investor",
                duration:"10 years", renewable:true, threshold:`${thresholdLabel} property`,
                color:T.green, badge:"Most Popular",
                requirements:[
                  `Property value ≥ ${thresholdFull} (title deed value)`,
                  "Single property OR combined multiple properties",
                  "Ready or off-plan from DLD-approved developer",
                  `Mortgaged property: need bank NOC + ${thresholdLabel} paid`,
                  "Property must be in applicant's personal name",
                  "Freehold zone — registered with DLD",
                ],
                family:["Spouse (10yr)","Children any age","Sons up to 25","Domestic staff unlimited"],
                fees:[
                  { item:"Medical examination", cost:"AED 700" },
                  { item:"Emirates ID (10yr)",   cost:"AED 1,153" },
                  { item:"Residency permit",      cost:"AED 2,857" },
                  { item:"DLD lien registration", cost:"AED ~500" },
                  { item:"Total approx.",          cost:"AED ~5,210" },
                ],
              },
              {
                key:"deposit", icon:"\uD83C\uDFE6", title:"Bank Deposit Investor",
                duration:"10 years", renewable:true, threshold:"AED 2M deposit",
                color:T.teal, badge:"No Property Needed",
                requirements:[
                  "Fixed deposit ≥ AED 2,000,000 in UAE bank",
                  "Deposit frozen minimum 2 years",
                  "OR local Sukuk / investment bonds ≥ AED 2M",
                  "Official bank certificate required",
                  "Must be in accredited local UAE bank",
                  "Cannot be withdrawn during visa validity",
                ],
                family:["Spouse","Children","Parents"],
                fees:[
                  { item:"Medical examination", cost:"AED 700" },
                  { item:"Emirates ID (10yr)",   cost:"AED 1,153" },
                  { item:"Residency permit",      cost:"AED 2,857" },
                  { item:"Total approx.",          cost:"AED ~4,710" },
                ],
              },
              {
                key:"talent", icon:"⭐", title:"Outstanding Talent",
                duration:"10 years", renewable:true, threshold:"Nomination based",
                color:"#8B5CF6", badge:"No Investment",
                requirements:[
                  "Doctors, scientists, artists, inventors",
                  "Exceptional students (GPA 3.75+ or top universities)",
                  "Award of UAE Cultural / Scientific Excellence",
                  "Recommendation from Ministry of Health / Economy",
                  "Athletes with GCC or international achievements",
                  "Digital professionals from approved platforms",
                ],
                family:["Spouse","Children"],
                fees:[
                  { item:"Medical examination", cost:"AED 700" },
                  { item:"Emirates ID (10yr)",   cost:"AED 1,153" },
                  { item:"Residency permit",      cost:"AED 2,857" },
                  { item:"Total approx.",          cost:"AED ~4,710" },
                ],
              },
              {
                key:"executive", icon:"\uD83D\uDCBC", title:"Senior Executive",
                duration:"10 years", renewable:true, threshold:"AED 30K+ salary",
                color:"#F97316", badge:"Employee Route",
                requirements:[
                  "Basic salary ≥ AED 30,000/month",
                  "Attested university degree (MoFA)",
                  "Working in UAE private/public sector",
                  "Senior or specialist role confirmed",
                  "Valid UAE residence visa",
                  "Health insurance coverage",
                ],
                family:["Spouse","Children","Parents"],
                fees:[
                  { item:"Medical examination", cost:"AED 700" },
                  { item:"Emirates ID (10yr)",   cost:"AED 1,153" },
                  { item:"Residency permit",      cost:"AED 2,857" },
                  { item:"Total approx.",          cost:"AED ~4,710" },
                ],
              },
            ];

            /* ── Application steps ── */
            const STEPS = [
              { n:"1", title:"Buy qualifying property", detail:`Purchase property ≥ ${thresholdLabel}. Get title deed from DLD or Oqood for off-plan. Property must be in freehold zone.` },
              { n:"2", title:"DLD property status certificate", detail:"Get official 'Property Status Statement' from Dubai Land Department confirming your ownership and value." },
              { n:"3", title:"Bank NOC (if mortgaged)", detail:"If property is mortgaged, bank must issue NOC confirming they do not object to visa issuance. Includes paid amount + balance." },
              { n:"4", title:"Gather documents", detail:"Passport, title deed/Oqood, personal photo, UAE ID (if any), current visa copy, health insurance." },
              { n:"5", title:"Submit application", detail:"Apply via DLD Golden Cube centre, GDRFA portal, or ICP Smart Services (UAE Pass). The DLD handles property-investor applications." },
              { n:"6", title:"Medical examination", detail:"Mandatory medical fitness test: blood test (HIV) + chest X-ray (TB). Done at approved centre. Cost: AED 700." },
              { n:"7", title:"Emirates ID biometrics", detail:"Fingerprints and photo registration at ICA centre. Emirates ID issued for 10 years." },
              { n:"8", title:"Receive Golden Visa", detail:"10-year residency permit issued and emailed. DLD places a lien on property to ensure ownership continuity throughout validity." },
            ];

            /* ── Properties near threshold from seed ── */
            const nearThreshold = (liveProjects?.length > 0 ? liveProjects : SEED_PROJECTS)
              .filter(p => p.minPrice >= 1500000 && p.minPrice <= 4000000)
              .slice(0, 4);

            const selSt = {
              background:T.surfaceAlt, border:`1px solid ${T.border}`, borderRadius:8,
              color:T.white, fontFamily:"'Outfit',sans-serif", fontSize:12,
              padding:"7px 28px 7px 10px", outline:"none", cursor:"pointer",
              appearance:"none", WebkitAppearance:"none",
              backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
              backgroundRepeat:"no-repeat", backgroundPosition:"right 8px center",
            };

            const activeCat = CATEGORIES.find(c => c.key === gvCategory) || CATEGORIES[0];

            return (
              <div style={{ animation:"fadeUp 0.4s ease-out forwards" }}>

                {/* Header */}
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 0", marginBottom:16, borderBottom:`1px solid ${T.border}`, flexWrap:"wrap", gap:8 }}>
                  <div>
                    <div style={{ fontFamily:"'Fraunces',serif", fontSize:20, fontWeight:800, color:T.white }}>UAE Golden Visa</div>
                    <div style={{ fontSize:11, color:T.textMuted, marginTop:3 }}>10-year residency · {thresholdLabel} threshold · Family sponsorship · No minimum stay · Official DLD 2026</div>
                  </div>
                  <div style={{ display:"flex", gap:8 }}>
                    {["checker","guide","properties"].map(v=>(
                      <button key={v} type="button" onClick={()=>setGvView(v)}
                        style={{ padding:"6px 14px", background:gvView===v?"rgba(212,168,67,0.15)":T.surfaceAlt, border:`1px solid ${gvView===v?"rgba(212,168,67,0.4)":T.border}`, borderRadius:8, color:gvView===v?T.gold:T.textMuted, fontSize:11, fontWeight:600, cursor:"pointer", fontFamily:"'Outfit',sans-serif", textTransform:"capitalize" }}>
                        {v==="checker"?"Eligibility Checker":v==="guide"?"Step-by-Step":"Qualifying Projects"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Key facts strip */}
                <div style={{ display:"flex", gap:10, marginBottom:16, flexWrap:"wrap" }}>
                  {[
                    { label:"Minimum Investment", val:thresholdLabel, color:T.gold,   note:"property value" },
                    { label:"Visa Duration",       val:"10 years",  color:T.green,  note:"renewable" },
                    { label:"Minimum Stay",         val:"ZERO",      color:T.green,  note:"live anywhere" },
                    { label:"Sponsor Needed",       val:"NO",        color:T.green,  note:"self-sponsored" },
                    { label:"Family Included",      val:"YES",       color:T.teal,   note:"spouse + children" },
                    { label:"Capital Gains Tax",    val:"ZERO",      color:T.green,  note:"UAE advantage" },
                  ].map((e,i)=>(
                    <div key={i} style={{ padding:"8px 14px", background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, textAlign:"center", flex:"1 1 80px" }}>
                      <div style={{ fontSize:9, fontWeight:700, color:T.textMuted, textTransform:"uppercase", letterSpacing:0.8 }}>{e.label}</div>
                      <div style={{ fontFamily:"'Fraunces',serif", fontSize:16, fontWeight:800, color:e.color, margin:"3px 0" }}>{e.val}</div>
                      <div style={{ fontSize:9, color:T.textMuted }}>{e.note}</div>
                    </div>
                  ))}
                </div>

                {/* ELIGIBILITY CHECKER */}
                {gvView === "checker" && (
                  <>
                    {/* Category selector */}
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8, marginBottom:16 }}>
                      {CATEGORIES.map(cat=>(
                        <button key={cat.key} type="button" onClick={()=>setGvCategory(cat.key)}
                          style={{ padding:"12px 10px", background:gvCategory===cat.key?cat.color+"18":T.surfaceAlt, border:`1px solid ${gvCategory===cat.key?cat.color:T.border}`, borderRadius:10, cursor:"pointer", fontFamily:"'Outfit',sans-serif", textAlign:"center" }}>
                          <div style={{ fontSize:18, marginBottom:4 }}>{cat.icon}</div>
                          <div style={{ fontSize:11, fontWeight:700, color:gvCategory===cat.key?cat.color:T.white }}>{cat.title}</div>
                          <div style={{ fontSize:9, color:cat.color, marginTop:2, fontWeight:600 }}>{cat.badge}</div>
                        </button>
                      ))}
                    </div>

                    {gvCategory === "property" && (
                      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:16 }}>
                        {/* Left — Calculator */}
                        <div className="chart-box" style={{ padding:22 }}>
                          <div style={{ fontFamily:"'Fraunces',serif", fontSize:13, fontWeight:700, color:T.white, marginBottom:16 }}>Eligibility Calculator</div>

                          {/* Property price slider */}
                          <div style={{ marginBottom:14 }}>
                            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                              <span style={{ fontSize:11, color:T.textMuted }}>Property Value (AED)</span>
                              <span style={{ fontSize:12, fontWeight:700, color:T.gold }}>AED {(gvPropPrice/1e6).toFixed(2)}M</span>
                            </div>
                            <input type="range" min={500000} max={10000000} step={50000} value={gvPropPrice}
                              onChange={e=>setGvPropPrice(Number(e.target.value))}
                              style={{ width:"100%", accentColor:T.gold, cursor:"pointer" }} />
                          </div>

                          {/* Mortgage toggle */}
                          <div style={{ marginBottom:12 }}>
                            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 12px", background:gvMortgage?"rgba(16,185,129,0.06)":T.surfaceAlt, border:`1px solid ${gvMortgage?T.green:T.border}`, borderRadius:8, cursor:"pointer" }}
                              onClick={()=>setGvMortgage(!gvMortgage)}>
                              <div>
                                <div style={{ fontSize:12, fontWeight:700, color:T.white }}>Mortgaged Property</div>
                                <div style={{ fontSize:11, color:T.textMuted }}>Property value qualifies, need bank NOC</div>
                              </div>
                              <div style={{ width:36, height:20, borderRadius:10, background:gvMortgage?T.green:T.border, position:"relative", flexShrink:0 }}>
                                <div style={{ width:16, height:16, borderRadius:"50%", background:"#fff", position:"absolute", top:2, left:gvMortgage?18:2, transition:"left 0.15s" }} />
                              </div>
                            </div>
                            {gvMortgage && (
                              <div style={{ marginTop:8, padding:"10px 12px", background:T.surfaceAlt, borderRadius:8, border:`1px solid ${T.border}` }}>
                                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                                  <span style={{ fontSize:11, color:T.textMuted }}>Effective qualifying value</span>
                                  <span style={{ fontSize:12, fontWeight:700, color:T.gold }}>AED {(gvPropPrice/1e6).toFixed(2)}M (title deed)</span>
                                </div>
                                <div style={{ fontSize:11, color:T.textSecondary, lineHeight:1.7 }}>As of 2026: full property value on title deed qualifies regardless of mortgage balance. Bank NOC required. Mortgage must be from approved UAE bank.</div>
                              </div>
                            )}
                          </div>

                          {/* Off-plan toggle */}
                          <div style={{ marginBottom:16 }}>
                            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 12px", background:gvOffplan?"rgba(20,184,166,0.06)":T.surfaceAlt, border:`1px solid ${gvOffplan?T.teal:T.border}`, borderRadius:8, cursor:"pointer" }}
                              onClick={()=>setGvOffplan(!gvOffplan)}>
                              <div>
                                <div style={{ fontSize:12, fontWeight:700, color:T.white }}>Off-Plan Property</div>
                                <div style={{ fontSize:11, color:T.textMuted }}>Amount paid to developer must be ≥ {thresholdLabel}</div>
                              </div>
                              <div style={{ width:36, height:20, borderRadius:10, background:gvOffplan?T.teal:T.border, position:"relative", flexShrink:0 }}>
                                <div style={{ width:16, height:16, borderRadius:"50%", background:"#fff", position:"absolute", top:2, left:gvOffplan?18:2, transition:"left 0.15s" }} />
                              </div>
                            </div>
                            {gvOffplan && (
                              <div style={{ marginTop:8 }}>
                                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                                  <span style={{ fontSize:11, color:T.textMuted }}>Amount paid to developer</span>
                                  <span style={{ fontSize:12, fontWeight:700, color:T.gold }}>AED {(gvOffplanPaid/1e6).toFixed(2)}M</span>
                                </div>
                                <input type="range" min={500000} max={10000000} step={50000} value={gvOffplanPaid}
                                  onChange={e=>setGvOffplanPaid(Number(e.target.value))}
                                  style={{ width:"100%", accentColor:T.teal, cursor:"pointer" }} />
                                <div style={{ fontSize:11, color:T.textMuted, marginTop:4 }}>Unpaid installments do NOT count. Must be from DLD-approved developer.</div>
                              </div>
                            )}
                          </div>

                          {/* Multiple properties */}
                          <div style={{ marginBottom:16 }}>
                            <div style={{ fontSize:11, color:T.textMuted, marginBottom:6 }}>Number of properties (combined value)</div>
                            <div style={{ display:"flex", gap:6 }}>
                              {[1,2,3,"3+"].map(n=>(
                                <button key={n} type="button" onClick={()=>setGvNumProps(n)}
                                  style={{ flex:1, padding:"8px 0", background:gvNumProps===n?"rgba(212,168,67,0.15)":T.surfaceAlt, border:`1px solid ${gvNumProps===n?"rgba(212,168,67,0.4)":T.border}`, borderRadius:8, color:gvNumProps===n?T.gold:T.textMuted, fontSize:12, fontWeight:gvNumProps===n?700:400, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>
                                  {n}
                                </button>
                              ))}
                            </div>
                            {gvNumProps > 1 && <div style={{ fontSize:11, color:T.textMuted, marginTop:4 }}>Combined title deed values must total ≥ {thresholdLabel}. All under same owner's name.</div>}
                          </div>
                        </div>

                        {/* Right — Result */}
                        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                          {/* Verdict */}
                          <div style={{ padding:"24px", background:eligible?"linear-gradient(135deg,rgba(16,185,129,0.12),rgba(16,185,129,0.04))":"linear-gradient(135deg,rgba(239,68,68,0.08),rgba(239,68,68,0.02))", border:`1px solid ${eligible?"rgba(16,185,129,0.3)":"rgba(239,68,68,0.25)"}`, borderRadius:14, textAlign:"center" }}>
                            <div style={{ fontSize:28, marginBottom:8 }}>{eligible?"✅":"⏳"}</div>
                            <div style={{ fontFamily:"'Fraunces',serif", fontSize:22, fontWeight:900, color:eligible?T.green:T.gold, marginBottom:6 }}>
                              {eligible ? "You Qualify!" : "Not Yet Eligible"}
                            </div>
                            <div style={{ fontSize:13, color:T.textSecondary, marginBottom:12 }}>
                              {eligible
                                ? `Property value AED ${(effectivePropValue/1e6).toFixed(2)}M meets the ${thresholdLabel} threshold`
                                : `Need AED ${(gap/1000).toFixed(0)}K more to reach ${thresholdLabel} threshold`}
                            </div>
                            {/* Progress bar */}
                            <div style={{ height:8, borderRadius:4, background:T.border, marginBottom:6 }}>
                              <div style={{ height:"100%", width:pctToThreshold+"%", background:eligible?T.green:T.gold, borderRadius:4, transition:"width 0.3s" }} />
                            </div>
                            <div style={{ display:"flex", justifyContent:"space-between", fontSize:10, color:T.textMuted }}>
                              <span>AED 0</span>
                              <span style={{ color:eligible?T.green:T.gold, fontWeight:700 }}>AED {(effectivePropValue/1e6).toFixed(2)}M ({pctToThreshold.toFixed(0)}%)</span>
                              <span>{thresholdLabel} ✓</span>
                            </div>
                          </div>

                          {/* Requirements checklist */}
                          <div className="chart-box" style={{ padding:18 }}>
                            <div style={{ fontSize:12, fontWeight:700, color:T.white, marginBottom:12 }}>Requirements — {activeCat.title}</div>
                            {activeCat.requirements.map((r,i)=>(
                              <div key={i} style={{ display:"flex", gap:8, padding:"5px 0", borderBottom:i<activeCat.requirements.length-1?`1px solid ${T.border}`:"none" }}>
                                <span style={{ color:T.green, flexShrink:0, marginTop:1 }}>✓</span>
                                <span style={{ fontSize:11, color:T.textSecondary, lineHeight:1.6 }}>{r}</span>
                              </div>
                            ))}
                          </div>

                          {/* Family + fees */}
                          <div className="chart-box" style={{ padding:18 }}>
                            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
                              <div>
                                <div style={{ fontSize:11, fontWeight:700, color:T.white, marginBottom:8 }}>Family Sponsorship</div>
                                {activeCat.family.map((f,i)=>(
                                  <div key={i} style={{ fontSize:11, color:T.textSecondary, padding:"3px 0" }}>✓ {f}</div>
                                ))}
                              </div>
                              <div>
                                <div style={{ fontSize:11, fontWeight:700, color:T.white, marginBottom:8 }}>Application Fees</div>
                                {activeCat.fees.map((f,i)=>(
                                  <div key={i} style={{ display:"flex", justifyContent:"space-between", fontSize:11, padding:"3px 0", borderBottom:i<activeCat.fees.length-1?`1px solid ${T.border}`:"none" }}>
                                    <span style={{ color:T.textMuted }}>{f.item}</span>
                                    <span style={{ color:i===activeCat.fees.length-1?T.gold:T.white, fontWeight:i===activeCat.fees.length-1?700:400 }}>{f.cost}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Non-property categories */}
                    {gvCategory !== "property" && (
                      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:16 }}>
                        <div className="chart-box" style={{ padding:20 }}>
                          <div style={{ fontSize:13, fontWeight:700, color:T.white, marginBottom:12 }}>Requirements — {activeCat.title}</div>
                          {activeCat.requirements.map((r,i)=>(
                            <div key={i} style={{ display:"flex", gap:8, padding:"6px 0", borderBottom:i<activeCat.requirements.length-1?`1px solid ${T.border}`:"none" }}>
                              <span style={{ color:T.green, flexShrink:0 }}>✓</span>
                              <span style={{ fontSize:12, color:T.textSecondary, lineHeight:1.6 }}>{r}</span>
                            </div>
                          ))}
                        </div>
                        <div className="chart-box" style={{ padding:20 }}>
                          <div style={{ fontSize:12, fontWeight:700, color:T.white, marginBottom:10 }}>Family Sponsorship</div>
                          {activeCat.family.map((f,i)=>(<div key={i} style={{ fontSize:12, color:T.textSecondary, padding:"4px 0" }}>✓ {f}</div>))}
                          <div style={{ marginTop:14, fontSize:12, fontWeight:700, color:T.white, marginBottom:8 }}>Application Fees</div>
                          {activeCat.fees.map((f,i)=>(
                            <div key={i} style={{ display:"flex", justifyContent:"space-between", fontSize:11, padding:"4px 0", borderBottom:i<activeCat.fees.length-1?`1px solid ${T.border}`:"none" }}>
                              <span style={{ color:T.textMuted }}>{f.item}</span>
                              <span style={{ color:i===activeCat.fees.length-1?T.gold:T.white, fontWeight:i===activeCat.fees.length-1?700:400 }}>{f.cost}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* STEP-BY-STEP GUIDE */}
                {gvView === "guide" && (
                  <div style={{ marginBottom:16 }}>
                    <div style={{ fontSize:13, fontWeight:700, color:T.white, marginBottom:4 }}>Application Process — Property Investor Route</div>
                    <div style={{ fontSize:11, color:T.textMuted, marginBottom:16 }}>Official DLD process · Typically 2-4 weeks end to end · Apply at DLD Golden Cube or online via GDRFA</div>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                      {STEPS.map((s,i)=>(
                        <div key={i} style={{ display:"flex", gap:12, padding:"14px 16px", background:T.surface, border:`1px solid ${T.border}`, borderRadius:10 }}>
                          <div style={{ width:30, height:30, borderRadius:"50%", background:"rgba(212,168,67,0.12)", border:"1px solid rgba(212,168,67,0.3)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, fontFamily:"'Fraunces',serif", fontSize:13, fontWeight:800, color:T.gold }}>{s.n}</div>
                          <div>
                            <div style={{ fontSize:12, fontWeight:700, color:T.white, marginBottom:4 }}>{s.title}</div>
                            <div style={{ fontSize:11, color:T.textSecondary, lineHeight:1.7 }}>{s.detail}</div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Important notes */}
                    <div style={{ marginTop:16, display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10 }}>
                      {[
                        { icon:"⚠", title:"Lien on property", detail:"DLD places a lien on your property to ensure ownership continuity throughout the 10-year visa. You can still sell but must settle visa first.", color:"#F97316" },
                        { icon:"✅", title:"No minimum stay", detail:"You can live anywhere in the world. Your Golden Visa remains valid without any UAE residency requirement during the 10-year period.", color:T.green },
                        { icon:"\uD83D\uDD04", title:"Renewal", detail:"Renewable indefinitely as long as you maintain property ownership. Visa validity = property ownership validity.", color:T.teal },
                      ].map((n,i)=>(
                        <div key={i} style={{ padding:"14px", background:T.surfaceAlt, border:`1px solid ${T.border}`, borderRadius:10 }}>
                          <div style={{ fontSize:16, marginBottom:6 }}>{n.icon}</div>
                          <div style={{ fontSize:12, fontWeight:700, color:n.color, marginBottom:4 }}>{n.title}</div>
                          <div style={{ fontSize:11, color:T.textSecondary, lineHeight:1.7 }}>{n.detail}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* QUALIFYING PROJECTS */}
                {gvView === "properties" && (
                  <div style={{ marginBottom:16 }}>
                    <div style={{ fontSize:13, fontWeight:700, color:T.white, marginBottom:4 }}>Properties Qualifying for Golden Visa</div>
                    <div style={{ fontSize:11, color:T.textMuted, marginBottom:16 }}>Projects priced {thresholdLabel}+ in freehold zones · Ready or off-plan · DLD registered</div>
                    {nearThreshold.length > 0 ? (
                      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:12 }}>
                        {nearThreshold.map((p,i)=>{
                          const gvReady = (p.minPrice||0) >= THRESHOLD;
                          return (
                            <div key={i} className="chart-box" style={{ padding:16, cursor:"pointer", border:gvReady?`1px solid rgba(16,185,129,0.3)`:`1px solid ${T.border}` }}
                              onClick={()=>handleTabChange("Projects")}>
                              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:10 }}>
                                <div>
                                  <div style={{ fontSize:10, color:T.textMuted, marginBottom:2 }}>{p.developer}</div>
                                  <div style={{ fontSize:14, fontWeight:700, color:T.white }}>{p.name}</div>
                                  <div style={{ fontSize:11, color:T.textMuted }}>{p.community}{"·"}{p.type}</div>
                                </div>
                                <span style={{ fontSize:9, padding:"2px 8px", borderRadius:8, background:gvReady?"rgba(16,185,129,0.12)":"rgba(212,168,67,0.12)", color:gvReady?T.green:T.gold, fontWeight:700, height:"fit-content" }}>
                                  {gvReady?"✓ GV Eligible":"Near Threshold"}
                                </span>
                              </div>
                              <div style={{ display:"flex", justifyContent:"space-between", fontSize:12 }}>
                                <span style={{ color:T.textMuted }}>From</span>
                                <span style={{ fontFamily:"'Fraunces',serif", fontSize:15, fontWeight:800, color:T.gold }}>AED {((p.minPrice||0)/1e6).toFixed(2)}M</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div style={{ padding:"32px", textAlign:"center", background:T.surface, border:`1px solid ${T.border}`, borderRadius:12 }}>
                        <div style={{ fontSize:13, color:T.white, marginBottom:6 }}>Browse all qualifying projects</div>
                        <button type="button" onClick={()=>handleTabChange("Projects")}
                          style={{ padding:"8px 24px", background:`linear-gradient(135deg,${T.gold},#B8922A)`, border:"none", borderRadius:8, color:"#000", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>
                          View Projects →
                        </button>
                      </div>
                    )}

                    {/* JVC tip for 2-property route */}
                    <div style={{ marginTop:14, padding:"14px 16px", background:"rgba(20,184,166,0.06)", border:"1px solid rgba(20,184,166,0.2)", borderRadius:10 }}>
                      <div style={{ fontSize:12, fontWeight:700, color:T.teal, marginBottom:4 }}>\uD83D\uDCA1 Two-Property Strategy (JVC Route)</div>
                      <div style={{ fontSize:11, color:T.textSecondary, lineHeight:1.8 }}>
                        Investors often buy <strong style={{ color:T.white }}>2 × AED 1M properties in JVC</strong> to reach the AED 2M threshold.
                        Combined title deed values qualify. Both properties must be in your name.
                        JVC studios from AED 480K–700K + 1BR from AED 750K–1.1M = AED 2M threshold reached.
                        Benefit: higher total rental yield (7-8%) vs single AED 2M Downtown property (5.5%).
                      </div>
                    </div>
                  </div>
                )}

                {/* Sources */}
                <div style={{ paddingTop:12, borderTop:`1px solid ${T.border}`, display:"flex", gap:8, flexWrap:"wrap" }}>
                  <span style={{ fontSize:10, color:T.textMuted }}>Sources:</span>
                  {["dubailand.gov.ae","icp.gov.ae","u.ae (official UAE portal)","gdrfad.gov.ae","Federal Decree-Law No.14 of 2022","realestateclubdubai.com Apr 2026"].map((s,i)=>(
                    <span key={i} style={{ fontSize:10, color:T.textMuted, padding:"2px 8px", borderRadius:10, border:`1px solid ${T.border}`, background:T.surfaceAlt }}>{s}</span>
                  ))}
                </div>

              </div>
            );
}

export default GoldenVisaTab;
