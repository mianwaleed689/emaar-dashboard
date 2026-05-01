/* eslint-disable */
/* ‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê
   DXB ANALYTICS ‚‚Ç¨‚Äù PIPELINE TAB
   Sales pipeline / deal management for agency CRM
   ‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê */

import React from "react";
import { T } from "../data";
import { SvgIcons } from "../components/Icons";

function PipelineTab({ liveNeighbourhoods=[], orgName, deals, dealsLoading, dealForm, setDealForm, dealFormLoading, setDealFormLoading, showNewDeal, setShowNewDeal, selectedDeal, setSelectedDeal, pipelineType, setPipelineType, firebaseUser, orgId, orgRole, userName }) {

            const isAgent   = orgRole === "agent";
            const isManager = orgRole === "manager";

            if (!isAgent && !isManager) return (
              <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"80px 20px", textAlign:"center" }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={T.textMuted} strokeWidth="1.5" strokeLinecap="round" style={{ marginBottom:16 }}><rect x="3" y="3" width="4" height="18" rx="1"/><rect x="10" y="3" width="4" height="12" rx="1"/><rect x="17" y="3" width="4" height="15" rx="1"/></svg>
                <div style={{ fontSize:16, fontWeight:700, color:T.textPrimary, marginBottom:6 }}>Pipeline not available</div>
                <div style={{ fontSize:12, color:T.textMuted }}>Contact your agency manager to access the deal pipeline</div>
              </div>
            );

            // Stage config
            const STAGES = [
              { key:"EOI",       label:"EOI",       color:"#3B82F6", desc:"Expression of Interest" },
              { key:"Booking",   label:"Booking",   color:"#8B5CF6", desc:"Unit Reserved"          },
              { key:"SPA",       label:"SPA",       color:"#F59E0B", desc:"Agreement Signed"       },
              { key:"DLD",       label:"DLD",       color:"#14B8A6", desc:"Registered with DLD"    },
              { key:"Completed", label:"Completed", color:"#10B981", desc:"Deal Closed"            },
            ];

            // Filter by type
            const filteredDeals = pipelineType === "all" ? deals
              : deals.filter(d => d.type === (pipelineType === "offplan" ? "Off-Plan" : "Secondary"));

            // Group by stage
            const byStage = Object.fromEntries(STAGES.map(s => [s.key, filteredDeals.filter(d => d.stage === s.key)]));

            // Pipeline value
            const totalValue = filteredDeals.reduce((a,d) => a + (parseFloat(d.price)||0), 0);
            const totalComm  = filteredDeals.reduce((a,d) => a + (parseFloat(d.commission)||0), 0);
            const wonDeals   = byStage["Completed"] || [];

            // Advance stage
            const advanceStage = async (deal) => {
              const idx = STAGES.findIndex(s => s.key === deal.stage);
              if (idx >= STAGES.length - 1) return;
              const nextStage = STAGES[idx + 1].key;
              try {
                await setDoc(doc(db, "deals", deal.id), { stage: nextStage, updatedAt: new Date().toISOString() }, { merge: true });
                if (selectedDeal?.id === deal.id) setSelectedDeal(d => d ? {...d, stage: nextStage} : d);
              } catch(e) { console.error(e); }
            };

            const setStage = async (dealId, stage) => {
              try {
                await setDoc(doc(db, "deals", dealId), { stage, updatedAt: new Date().toISOString() }, { merge: true });
                if (selectedDeal?.id === dealId) setSelectedDeal(d => d ? {...d, stage} : d);
              } catch(e) { console.error(e); }
            };

            // Create deal
            const createDeal = async () => {
              if (!dealForm.leadName && !dealForm.project) return;
              setDealFormLoading(true);
              try {
                const price    = parseFloat(dealForm.price) || 0;
                const pct      = parseFloat(dealForm.commissionPct) || 4;
                const commission = dealForm.commission ? parseFloat(dealForm.commission) : price * (pct/100);
                await addDoc(collection(db, "deals"), {
                  ...dealForm,
                  price,
                  commission,
                  commissionPct: pct,
                  agentId:   firebaseUser?.uid,
                  agentName: userName || firebaseUser?.email,
                  orgId:     orgId || null,
                  stage:     "EOI",
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                });
                setDealForm({ leadName:"", leadPhone:"", project:"", community:"", type:"Off-Plan", unitNo:"", price:"", commission:"", commissionPct:"4", stage:"EOI", notes:"" });
                setShowNewDeal(false);
              } catch(e) { console.error(e); }
              setDealFormLoading(false);
            };

            // Delete deal
            const deleteDeal = async (id) => {
              if (!window.confirm("Delete this deal?")) return;
              try {
                await deleteDoc(doc(db, "deals", id));
                if (selectedDeal?.id === id) setSelectedDeal(null);
              } catch(e) { console.error(e); }
            };

            // Commission calc helper
            const calcComm = (price, pct) => {
              const p = parseFloat(price)||0;
              const c = parseFloat(pct)||4;
              return p * (c/100);
            };

            return (<>

              {/* ‚‚Äù‚Ç¨‚‚Äù‚Ç¨ Header ‚‚Äù‚Ç¨‚‚Äù‚Ç¨ */}
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20, flexWrap:"wrap", gap:12 }}>
                <div>
                  <h1 style={{ fontFamily:"'Fraunces',serif", fontSize:22, fontWeight:900, color:T.white, margin:0 }}>{orgName ? orgName + " ‚‚Ç¨‚Äù " : "My Agency ‚‚Ç¨‚Äù "}Deal Pipeline</h1>
                  <p style={{ fontSize:12, color:T.textMuted, margin:"4px 0 0" }}>EOI ‚Ü‚Äô Booking ‚Ü‚Äô SPA ‚Ü‚Äô DLD ¬∑ Track every deal to close</p>
                </div>
                <div style={{ display:"flex", gap:8 }}>
                  {/* Type filter */}
                  <div style={{ display:"flex", background:T.surfaceAlt, border:`1px solid ${T.border}`, borderRadius:8, overflow:"hidden" }}>
                    {[["all","All"],["offplan","Off-Plan"],["secondary","Secondary"]].map(([v,l])=>(
                      <button key={v} type="button" onClick={()=>setPipelineType(v)}
                        style={{ padding:"8px 14px", fontSize:11, fontWeight:600, border:"none", background:pipelineType===v?"rgba(212,168,67,0.15)":"transparent", color:pipelineType===v?T.gold:T.textMuted, cursor:"pointer", fontFamily:"'Outfit',sans-serif", borderRight:`1px solid ${T.border}` }}>
                        {l}
                      </button>
                    ))}
                  </div>
                  <button type="button" onClick={()=>setShowNewDeal(true)}
                    style={{ display:"flex", alignItems:"center", gap:8, padding:"9px 18px", borderRadius:8, border:`1px solid ${T.gold}`, background:"rgba(212,168,67,0.1)", color:T.gold, fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    New Deal
                  </button>
                </div>
              </div>

              {/* ‚‚Äù‚Ç¨‚‚Äù‚Ç¨ KPI Bar ‚‚Äù‚Ç¨‚‚Äù‚Ç¨ */}
              <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:20 }}>
                {[
                  { label:"Active Deals",    value:filteredDeals.filter(d=>d.stage!=="Completed").length, color:T.gold,   icon:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="3" width="4" height="18" rx="1"/><rect x="10" y="3" width="4" height="12" rx="1"/><rect x="17" y="3" width="4" height="15" rx="1"/></svg> },
                  { label:"Pipeline Value",  value:`AED ${totalValue>=1e6?(totalValue/1e6).toFixed(1)+"M":totalValue.toLocaleString()}`, color:T.teal, icon:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> },
                  { label:"My Commission",   value:`AED ${totalComm>=1e6?(totalComm/1e6).toFixed(2)+"M":Math.round(totalComm).toLocaleString()}`, color:"#10B981", icon:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg> },
                  { label:"Deals Closed",    value:wonDeals.length, color:"#8B5CF6", icon:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg> },
                ].map((k,i)=>(
                  <div key={i} style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:12, padding:"14px 16px", position:"relative", overflow:"hidden" }}>
                    <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:`linear-gradient(90deg,${k.color},${k.color}30)` }}/>
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
                      <div style={{ fontSize:10, fontWeight:700, color:T.textMuted, textTransform:"uppercase", letterSpacing:0.8 }}>{k.label}</div>
                      <div style={{ color:k.color, opacity:0.6 }}>{k.icon}</div>
                    </div>
                    <div style={{ fontSize:24, fontWeight:900, color:k.color, fontFamily:"'Fraunces',serif", lineHeight:1 }}>{k.value}</div>
                  </div>
                ))}
              </div>

              {/* ‚‚Äù‚Ç¨‚‚Äù‚Ç¨ Stage Progress Bar ‚‚Äù‚Ç¨‚‚Äù‚Ç¨ */}
              <div style={{ overflowX:"auto", marginBottom:20 }}>
                <div style={{ display:"grid", gridTemplateColumns:`repeat(${STAGES.length},minmax(200px,1fr))`, borderRadius:10, overflow:"hidden", border:`1px solid ${T.border}`, minWidth:700 }}>
                {STAGES.map((s,i) => {
                  const cnt = (byStage[s.key]||[]).length;
                  const val = (byStage[s.key]||[]).reduce((a,d)=>a+(parseFloat(d.price)||0),0);
                  return (
                    <div key={s.key} style={{ padding:"12px 14px", background:cnt>0?`${s.color}08`:T.surfaceAlt, borderRight:i<STAGES.length-1?`1px solid ${T.border}`:"none", textAlign:"center" }}>
                      <div style={{ fontSize:10, fontWeight:700, color:s.color, textTransform:"uppercase", letterSpacing:0.8, marginBottom:4 }}>{s.label}</div>
                      <div style={{ fontSize:20, fontWeight:900, color:cnt>0?s.color:T.textMuted, fontFamily:"'Fraunces',serif" }}>{cnt}</div>
                      {val>0&&<div style={{ fontSize:9, color:T.textMuted, marginTop:2 }}>AED {(val/1e6).toFixed(1)}M</div>}
                    </div>
                  );
                })}
                </div>
              </div>

              {/* ‚‚Äù‚Ç¨‚‚Äù‚Ç¨ Kanban Board ‚‚Äù‚Ç¨‚‚Äù‚Ç¨ */}
              {dealsLoading ? (
                <div style={{ display:"flex", alignItems:"center", justifyContent:"center", padding:"60px 0", gap:10 }}>
                  <div style={{ width:20, height:20, border:`2px solid ${T.gold}30`, borderTopColor:T.gold, borderRadius:"50%", animation:"spin 0.7s linear infinite" }}/>
                  <span style={{ fontSize:12, color:T.textMuted }}>Loading deals...</span>
                </div>
              ) : (
                <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:10, alignItems:"start" }}>
                  {STAGES.map(stage => (
                    <div key={stage.key} style={{ background:T.surfaceAlt, borderRadius:12, overflow:"hidden", border:`1px solid ${T.border}` }}>
                      {/* Stage header */}
                      <div style={{ padding:"10px 12px", borderBottom:`2px solid ${stage.color}`, background:`${stage.color}08`, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                        <div>
                          <div style={{ fontSize:11, fontWeight:700, color:stage.color }}>{stage.label}</div>
                          <div style={{ fontSize:9, color:T.textMuted }}>{stage.desc}</div>
                        </div>
                        <span style={{ fontSize:11, fontWeight:700, color:stage.color, background:`${stage.color}18`, padding:"2px 7px", borderRadius:5 }}>
                          {(byStage[stage.key]||[]).length}
                        </span>
                      </div>

                      {/* Deal cards */}
                      <div style={{ padding:8, display:"flex", flexDirection:"column", gap:6, minHeight:120 }}>
                        {(byStage[stage.key]||[]).length === 0 && (
                          <div style={{ padding:"20px 8px", textAlign:"center", fontSize:10, color:T.textMuted }}>No deals</div>
                        )}
                        {(byStage[stage.key]||[]).map(deal => (
                          <div key={deal.id}
                            onClick={()=>setSelectedDeal(deal)}
                            style={{ background:T.card, borderRadius:9, padding:"10px 11px", cursor:"pointer", border:`1px solid ${T.border}`, transition:"all 0.12s" }}
                            onMouseEnter={e=>{e.currentTarget.style.borderColor=`${stage.color}60`;e.currentTarget.style.boxShadow=`0 4px 16px ${stage.color}18`;}}
                            onMouseLeave={e=>{e.currentTarget.style.borderColor=T.border;e.currentTarget.style.boxShadow="none";}}>

                            {/* Type badge */}
                            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
                              <span style={{ fontSize:9, fontWeight:700, padding:"2px 6px", borderRadius:4, background:deal.type==="Off-Plan"?"rgba(59,130,246,0.12)":"rgba(16,185,129,0.12)", color:deal.type==="Off-Plan"?"#3B82F6":"#10B981" }}>
                                {deal.type||"Off-Plan"}
                              </span>
                              {deal.unitNo && <span style={{ fontSize:9, color:T.textMuted }}>Unit {deal.unitNo}</span>}
                            </div>

                            {/* Lead name */}
                            <div style={{ fontSize:12, fontWeight:700, color:T.textPrimary, marginBottom:3, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                              {deal.leadName || "Unnamed"}
                            </div>

                            {/* Project */}
                            {deal.project && (
                              <div style={{ fontSize:10, color:T.textMuted, marginBottom:6, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                                {deal.project}
                              </div>
                            )}

                            {/* Price */}
                            {deal.price > 0 && (
                              <div style={{ fontSize:11, fontWeight:700, color:T.gold, marginBottom:8 }}>
                                AED {parseFloat(deal.price)>=1e6?(parseFloat(deal.price)/1e6).toFixed(2)+"M":parseFloat(deal.price).toLocaleString()}
                              </div>
                            )}

                            {/* Advance button */}
                            {stage.key !== "Completed" && (
                              <button type="button"
                                onClick={e=>{e.stopPropagation();advanceStage(deal);}}
                                style={{ width:"100%", padding:"5px 0", borderRadius:6, border:`1px solid ${stage.color}40`, background:`${stage.color}0a`, color:stage.color, fontSize:10, fontWeight:600, cursor:"pointer", fontFamily:"'Outfit',sans-serif", display:"flex", alignItems:"center", justifyContent:"center", gap:5 }}>
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
                                Advance
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ‚‚Äù‚Ç¨‚‚Äù‚Ç¨ Deal Detail Drawer ‚‚Äù‚Ç¨‚‚Äù‚Ç¨ */}
              {selectedDeal && (
                <div style={{ position:"fixed", inset:0, zIndex:1500, display:"flex" }} onClick={e=>{if(e.target===e.currentTarget)setSelectedDeal(null);}}>
                  <div style={{ flex:1, background:"rgba(0,0,0,0.5)", backdropFilter:"blur(4px)" }} onClick={()=>setSelectedDeal(null)}/>
                  <div style={{ width:480, background:T.bg, borderLeft:`1px solid ${T.border}`, display:"flex", flexDirection:"column", overflowY:"auto", boxShadow:"-20px 0 60px rgba(0,0,0,0.4)" }}>

                    <div style={{ padding:"20px 20px 14px", borderBottom:`1px solid ${T.border}`, flexShrink:0 }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:14 }}>
                        <div>
                          <div style={{ fontFamily:"'Fraunces',serif", fontSize:18, fontWeight:900, color:T.white }}>{selectedDeal.leadName||"Unnamed Deal"}</div>
                          <div style={{ fontSize:11, color:T.textMuted, marginTop:3 }}>{selectedDeal.project} {selectedDeal.unitNo && `¬∑ Unit ${selectedDeal.unitNo}`}</div>
                        </div>
                        <button type="button" onClick={()=>setSelectedDeal(null)}
                          style={{ background:"rgba(255,255,255,0.06)", border:`1px solid ${T.border}`, borderRadius:7, color:T.textMuted, cursor:"pointer", padding:"5px 10px", display:"flex", alignItems:"center", gap:4, fontSize:12 }}>
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                          Close
                        </button>
                      </div>

                      {/* Stage selector */}
                      <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
                        {STAGES.map(s=>(
                          <button key={s.key} type="button" onClick={()=>setStage(selectedDeal.id,s.key)}
                            style={{ padding:"5px 11px", fontSize:11, fontWeight:600, cursor:"pointer", fontFamily:"'Outfit',sans-serif", border:`1px solid ${selectedDeal.stage===s.key?s.color:T.border}`, background:selectedDeal.stage===s.key?`${s.color}18`:"transparent", color:selectedDeal.stage===s.key?s.color:T.textMuted, borderRadius:7, transition:"all 0.12s" }}>
                            {s.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div style={{ padding:"20px", flex:1 }}>
                      {/* Deal info grid */}
                      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:20 }}>
                        {[
                          { label:"Deal Type",    value:selectedDeal.type },
                          { label:"Community",    value:selectedDeal.community },
                          { label:"Phone",        value:selectedDeal.leadPhone },
                          { label:"Unit No.",     value:selectedDeal.unitNo },
                        ].filter(r=>r.value).map(({label,value})=>(
                          <div key={label} style={{ background:T.surfaceAlt, borderRadius:8, padding:"10px 12px" }}>
                            <div style={{ fontSize:9, fontWeight:700, color:T.textMuted, textTransform:"uppercase", letterSpacing:0.7, marginBottom:4 }}>{label}</div>
                            <div style={{ fontSize:12, fontWeight:600, color:T.textPrimary }}>{value}</div>
                          </div>
                        ))}
                      </div>

                      {/* Commission Calculator */}
                      <div style={{ background:`linear-gradient(135deg,rgba(16,185,129,0.06),rgba(212,168,67,0.04))`, border:"1px solid rgba(16,185,129,0.15)", borderRadius:12, padding:"16px", marginBottom:16 }}>
                        <div style={{ fontSize:11, fontWeight:700, color:"#10B981", textTransform:"uppercase", letterSpacing:0.8, marginBottom:12 }}>Commission Calculator</div>
                        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:12 }}>
                          <div>
                            <div style={{ fontSize:10, color:T.textMuted, marginBottom:5 }}>Deal Price (AED)</div>
                            <div style={{ fontSize:18, fontWeight:900, color:T.gold, fontFamily:"'Fraunces',serif" }}>
                              {selectedDeal.price>0?`${(parseFloat(selectedDeal.price)/1e6).toFixed(2)}M`:"‚‚Ç¨‚Äù"}
                            </div>
                          </div>
                          <div>
                            <div style={{ fontSize:10, color:T.textMuted, marginBottom:5 }}>Commission Rate</div>
                            <div style={{ fontSize:18, fontWeight:900, color:"#10B981", fontFamily:"'Fraunces',serif" }}>
                              {selectedDeal.commissionPct||4}%
                            </div>
                          </div>
                        </div>
                        <div style={{ background:T.surfaceAlt, borderRadius:8, padding:"12px 14px" }}>
                          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                            <span style={{ fontSize:12, color:T.textMuted }}>Your Commission</span>
                            <span style={{ fontSize:20, fontWeight:900, color:"#10B981", fontFamily:"'Fraunces',serif" }}>
                              AED {Math.round(calcComm(selectedDeal.price, selectedDeal.commissionPct)).toLocaleString()}
                            </span>
                          </div>
                          <div style={{ display:"flex", justifyContent:"space-between", marginTop:8, paddingTop:8, borderTop:`1px solid ${T.border}` }}>
                            <span style={{ fontSize:10, color:T.textMuted }}>After 50/50 agency split</span>
                            <span style={{ fontSize:13, fontWeight:700, color:T.gold }}>
                              AED {Math.round(calcComm(selectedDeal.price, selectedDeal.commissionPct)/2).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Property matching */}
                      {selectedDeal.community && (
                        <div style={{ background:T.surfaceAlt, borderRadius:10, padding:"12px 14px", marginBottom:16 }}>
                          <div style={{ fontSize:11, fontWeight:700, color:T.gold, marginBottom:8 }}>Matched Projects</div>
                          {activeProjects.filter(p => p.community === selectedDeal.community || p.district === selectedDeal.community).slice(0,3).map((p,pi)=>(
                            <div key={pi} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"6px 0", borderBottom:pi<2?`1px solid ${T.border}`:"none" }}>
                              <div>
                                <div style={{ fontSize:11, fontWeight:600, color:T.textPrimary }}>{p.name}</div>
                                <div style={{ fontSize:10, color:T.textMuted }}>AED {p.price?(p.price/1e6).toFixed(2)+"M":"TBD"}{"¬∑"}{p.status}</div>
                              </div>
                              <span style={{ fontSize:9, padding:"2px 6px", borderRadius:4, background:"rgba(212,168,67,0.1)", color:T.gold }}>{p.handover}</span>
                            </div>
                          ))}
                          {activeProjects.filter(p=>p.community===selectedDeal.community).length===0&&(
                            <div style={{ fontSize:11, color:T.textMuted }}>No matching projects found</div>
                          )}
                        </div>
                      )}

                      {/* Notes */}
                      {selectedDeal.notes && (
                        <div style={{ background:T.surfaceAlt, borderRadius:8, padding:"10px 12px", marginBottom:12 }}>
                          <div style={{ fontSize:9, fontWeight:700, color:T.textMuted, textTransform:"uppercase", letterSpacing:0.7, marginBottom:4 }}>Notes</div>
                          <div style={{ fontSize:12, color:T.textSecondary, lineHeight:1.6 }}>{selectedDeal.notes}</div>
                        </div>
                      )}

                      {/* Delete */}
                      <button type="button" onClick={()=>deleteDeal(selectedDeal.id)}
                        style={{ width:"100%", padding:"9px 0", borderRadius:8, border:"1px solid rgba(239,68,68,0.3)", background:"rgba(239,68,68,0.06)", color:T.red, fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>
                        Delete Deal
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ‚‚Äù‚Ç¨‚‚Äù‚Ç¨ New Deal Modal ‚‚Äù‚Ç¨‚‚Äù‚Ç¨ */}
              {showNewDeal && (
                <div style={{ position:"fixed", inset:0, background:"rgba(4,9,15,0.85)", zIndex:2000, display:"flex", alignItems:"center", justifyContent:"center", backdropFilter:"blur(8px)" }} onClick={e=>{if(e.target===e.currentTarget)setShowNewDeal(false);}}>
                  <div style={{ background:T.surface, borderRadius:16, border:`1px solid ${T.border}`, width:"95%", maxWidth:520, maxHeight:"90vh", overflowY:"auto" }} onClick={e=>e.stopPropagation()}>
                    <div style={{ padding:"22px 24px", borderBottom:`1px solid ${T.border}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                      <div>
                        <div style={{ fontFamily:"'Fraunces',serif", fontSize:18, fontWeight:900, color:T.gold }}>New Deal</div>
                        <div style={{ fontSize:11, color:T.textMuted, marginTop:2 }}>Start at EOI stage ‚‚Ç¨‚Äù advance as the deal progresses</div>
                      </div>
                      <button type="button" onClick={()=>setShowNewDeal(false)}
                        style={{ background:T.surfaceAlt, border:`1px solid ${T.border}`, borderRadius:8, color:T.textMuted, width:32, height:32, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      </button>
                    </div>
                    <div style={{ padding:"20px 24px", display:"flex", flexDirection:"column", gap:14 }}>
                      {/* Deal type */}
                      <div>
                        <div style={{ fontSize:11, fontWeight:600, color:T.textMuted, marginBottom:8 }}>Deal Type</div>
                        <div style={{ display:"flex", gap:8 }}>
                          {["Off-Plan","Secondary"].map(t=>(
                            <button key={t} type="button" onClick={()=>setDealForm(f=>({...f,type:t}))}
                              style={{ flex:1, padding:"9px 0", borderRadius:8, border:`1px solid ${dealForm.type===t?T.gold:T.border}`, background:dealForm.type===t?"rgba(212,168,67,0.1)":"transparent", color:dealForm.type===t?T.gold:T.textMuted, fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>
                              {t}
                            </button>
                          ))}
                        </div>
                      </div>
                      {/* Form fields */}
                      {[
                        { key:"leadName",  label:"Client Name *",       placeholder:"Ahmed Al-Mansouri",   required:true },
                        { key:"leadPhone", label:"Client Phone",         placeholder:"+971 50 123 4567"              },
                        { key:"project",   label:"Project / Property",   placeholder:"The Oasis Lagoon Villas"       },
                        { key:"community", label:"Community",            placeholder:"The Oasis"                     },
                        { key:"unitNo",    label:"Unit Number",          placeholder:"A-1201"                        },
                      ].map(({key,label,placeholder,required})=>(
                        <div key={key}>
                          <div style={{ fontSize:11, fontWeight:600, color:T.textMuted, marginBottom:5 }}>
                            {label}{required&&<span style={{ color:T.gold }}> *</span>}
                          </div>
                          <input value={dealForm[key]||""} onChange={e=>setDealForm(f=>({...f,[key]:e.target.value}))}
                            placeholder={placeholder}
                            style={{ width:"100%", padding:"10px 14px", background:T.bg, border:`1px solid rgba(212,168,67,0.15)`, borderRadius:9, color:T.textPrimary, fontSize:13, fontFamily:"'Outfit',sans-serif", outline:"none", boxSizing:"border-box" }}/>
                        </div>
                      ))}
                      {/* Price + Commission in a row */}
                      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                        <div>
                          <div style={{ fontSize:11, fontWeight:600, color:T.textMuted, marginBottom:5 }}>Deal Price (AED)</div>
                          <input type="number" value={dealForm.price||""} onChange={e=>setDealForm(f=>({...f,price:e.target.value,commission:String(parseFloat(e.target.value||0)*(parseFloat(f.commissionPct||4)/100))}))}
                            placeholder="2000000"
                            style={{ width:"100%", padding:"10px 14px", background:T.bg, border:`1px solid rgba(212,168,67,0.15)`, borderRadius:9, color:T.textPrimary, fontSize:13, fontFamily:"'Outfit',sans-serif", outline:"none", boxSizing:"border-box" }}/>
                        </div>
                        <div>
                          <div style={{ fontSize:11, fontWeight:600, color:T.textMuted, marginBottom:5 }}>Commission %</div>
                          <input type="number" value={dealForm.commissionPct||"4"} onChange={e=>setDealForm(f=>({...f,commissionPct:e.target.value,commission:String(parseFloat(f.price||0)*(parseFloat(e.target.value||4)/100))}))}
                            placeholder="4"
                            style={{ width:"100%", padding:"10px 14px", background:T.bg, border:`1px solid rgba(212,168,67,0.15)`, borderRadius:9, color:T.textPrimary, fontSize:13, fontFamily:"'Outfit',sans-serif", outline:"none", boxSizing:"border-box" }}/>
                        </div>
                      </div>
                      {/* Commission preview */}
                      {dealForm.price && (
                        <div style={{ background:"rgba(16,185,129,0.06)", border:"1px solid rgba(16,185,129,0.15)", borderRadius:8, padding:"10px 14px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                          <span style={{ fontSize:11, color:T.textMuted }}>Estimated commission</span>
                          <span style={{ fontSize:14, fontWeight:700, color:"#10B981" }}>
                            AED {Math.round(calcComm(dealForm.price, dealForm.commissionPct)).toLocaleString()}
                          </span>
                        </div>
                      )}
                      <div>
                        <div style={{ fontSize:11, fontWeight:600, color:T.textMuted, marginBottom:5 }}>Notes</div>
                        <textarea value={dealForm.notes||""} onChange={e=>setDealForm(f=>({...f,notes:e.target.value}))} rows={2}
                          placeholder="Payment plan, conditions, timeline..."
                          style={{ width:"100%", padding:"10px 14px", background:T.bg, border:`1px solid rgba(212,168,67,0.15)`, borderRadius:9, color:T.textPrimary, fontSize:13, fontFamily:"'Outfit',sans-serif", outline:"none", resize:"vertical", boxSizing:"border-box" }}/>
                      </div>
                    </div>
                    <div style={{ padding:"16px 24px", borderTop:`1px solid ${T.border}`, display:"flex", gap:10, justifyContent:"flex-end" }}>
                      <button type="button" onClick={()=>setShowNewDeal(false)}
                        style={{ padding:"10px 20px", borderRadius:8, border:`1px solid ${T.border}`, background:"transparent", color:T.textMuted, fontSize:12, cursor:"pointer" }}>
                        Cancel
                      </button>
                      <button type="button" onClick={createDeal} disabled={dealFormLoading||!dealForm.leadName}
                        style={{ padding:"10px 24px", borderRadius:8, border:`1px solid ${T.gold}`, background:"rgba(212,168,67,0.12)", color:T.gold, fontSize:12, fontWeight:700, cursor:"pointer", opacity:(dealFormLoading||!dealForm.leadName)?0.5:1, fontFamily:"'Outfit',sans-serif" }}>
                        {dealFormLoading?"Creating...":"Create Deal"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>);
}

export default PipelineTab;
