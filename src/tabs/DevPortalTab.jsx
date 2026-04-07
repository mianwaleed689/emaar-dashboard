/* eslint-disable */
/* ═══════════════════════════════════════════════════════════════════
   DXB ANALYTICS — DEV PORTAL TAB
   Developer admin portal — manage units, EOIs, commissions
   ═══════════════════════════════════════════════════════════════════ */

import React from "react";
import { T } from "../data";
import { SvgIcons } from "../components/Icons";

function DevPortalTab({ devId, devProjects, selectedDevProject, devUnits, devUnitsLoading, devUnitFilter, setDevUnitFilter, unitForm, setUnitForm, unitFormLoading, setUnitFormLoading, showAddUnit, setShowAddUnit, devCommForm, setDevCommForm, devCommSaving, setDevCommSaving, devEOIs, allDevelopers, userRole }) {

            const isDeveloper = userRole === "developer";
            if (!isDeveloper) return (
              <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"80px 20px", textAlign:"center" }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={T.textMuted} strokeWidth="1.5" strokeLinecap="round" style={{ marginBottom:16 }}><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>
                <div style={{ fontSize:16, fontWeight:700, color:T.textPrimary, marginBottom:6 }}>Developer access only</div>
                <div style={{ fontSize:12, color:T.textMuted }}>This portal is for registered developer partners only</div>
              </div>
            );

            const devInfo = allDevelopers.find(d => d.id === devId);
            const devName = devInfo?.name || devId || "Developer";

            // Unit status config
            const UNIT_STATUS = {
              Available:  { color:"#10B981", bg:"rgba(16,185,129,0.1)"  },
              Reserved:   { color:"#F59E0B", bg:"rgba(245,158,11,0.1)"  },
              Sold:       { color:"#3B82F6", bg:"rgba(59,130,246,0.1)"  },
              Blocked:    { color:T.red,     bg:"rgba(239,68,68,0.1)"   },
            };

            // EOI pipeline stages
            const EOI_STAGES = [
              { key:"EOI",      label:"EOI",      color:"#3B82F6" },
              { key:"Booking",  label:"Booking",  color:"#8B5CF6" },
              { key:"SPA",      label:"SPA",      color:"#F59E0B" },
              { key:"Completed",label:"Completed",color:"#10B981" },
            ];

            // Filtered units
            const filteredUnits = devUnitFilter === "all"
              ? devUnits
              : devUnits.filter(u => u.status === devUnitFilter);

            // KPIs
            const available = devUnits.filter(u => u.status === "Available").length;
            const reserved  = devUnits.filter(u => u.status === "Reserved").length;
            const sold      = devUnits.filter(u => u.status === "Sold").length;
            const totalVal  = devUnits.reduce((a,u) => a + (parseFloat(u.price)||0), 0);
            const eoiVal    = devEOIs.reduce((a,e) => a + (parseFloat(e.price)||0), 0);

            // Create unit
            const createUnit = async () => {
              if (!unitForm.unitNo.trim()) return;
              setUnitFormLoading(true);
              try {
                await addDoc(collection(db, "devUnits"), {
                  ...unitForm,
                  price:  parseFloat(unitForm.price)  || 0,
                  size:   parseFloat(unitForm.size)   || 0,
                  beds:   parseInt(unitForm.beds)     || 0,
                  baths:  parseInt(unitForm.baths)    || 0,
                  floor:  parseInt(unitForm.floor)    || 0,
                  devId,
                  projectId: selectedDevProject || devId,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                });
                setUnitForm({ unitNo:"", type:"Apartment", beds:"1", baths:"1", size:"", price:"", floor:"", view:"", status:"Available" });
                setShowAddUnit(false);
              } catch(e) { console.error(e); }
              setUnitFormLoading(false);
            };

            // Update unit status
            const updateUnitStatus = async (id, status) => {
              try {
                await setDoc(doc(db, "devUnits", id), { status, updatedAt: new Date().toISOString() }, { merge: true });
              } catch(e) { console.error(e); }
            };

            // Advance EOI stage
            const advanceEOI = async (eoi) => {
              const idx = EOI_STAGES.findIndex(s => s.key === eoi.stage);
              if (idx >= EOI_STAGES.length - 1) return;
              const next = EOI_STAGES[idx + 1].key;
              try {
                await setDoc(doc(db, "devEOIs", eoi.id), { stage: next, updatedAt: new Date().toISOString() }, { merge: true });
              } catch(e) { console.error(e); }
            };

            // Save commission
            const saveDevComm = async (projectId, pct) => {
              if (!devId) return;
              setDevCommSaving(true);
              try {
                await setDoc(doc(db, "developers", devId), {
                  commissionByProject: { ...(devInfo?.commissionByProject||{}), [projectId]: parseFloat(pct)||4 },
                  updatedAt: new Date().toISOString(),
                }, { merge: true });
              } catch(e) { console.error(e); }
              setDevCommSaving(false);
            };

            return (<>

              {/* ── Header ── */}
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20, flexWrap:"wrap", gap:12 }}>
                <div>
                  <h1 style={{ fontFamily:"'Fraunces',serif", fontSize:22, fontWeight:900, color:T.white, margin:0 }}>
                    {devName} — Developer Portal
                  </h1>
                  <p style={{ fontSize:12, color:T.textMuted, margin:"4px 0 0" }}>
                    Unit inventory · EOI pipeline · Commission config · Marketing hub
                  </p>
                </div>
                <button type="button" onClick={()=>setShowAddUnit(true)}
                  style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 20px", borderRadius:9, border:`1px solid ${T.gold}`, background:"rgba(212,168,67,0.1)", color:T.gold, fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  Add Unit
                </button>
              </div>

              {/* ── KPI Bar ── */}
              <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:10, marginBottom:20 }}>
                {[
                  { label:"Total Units",    value:devUnits.length, color:T.gold,    icon:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg> },
                  { label:"Available",      value:available,       color:"#10B981", icon:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> },
                  { label:"Reserved",       value:reserved,        color:"#F59E0B", icon:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> },
                  { label:"Sold",           value:sold,            color:"#3B82F6", icon:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg> },
                  { label:"EOI Pipeline",   value:`AED ${eoiVal>=1e6?(eoiVal/1e6).toFixed(1)+"M":eoiVal.toLocaleString()}`, color:"#8B5CF6", icon:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> },
                ].map((k,i)=>(
                  <div key={i} style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:12, padding:"14px 16px", position:"relative", overflow:"hidden" }}>
                    <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:`linear-gradient(90deg,${k.color},${k.color}30)` }}/>
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
                      <div style={{ fontSize:10, fontWeight:700, color:T.textMuted, textTransform:"uppercase", letterSpacing:0.8 }}>{k.label}</div>
                      <div style={{ color:k.color, opacity:0.6 }}>{k.icon}</div>
                    </div>
                    <div style={{ fontSize:22, fontWeight:900, color:k.color, fontFamily:"'Fraunces',serif", lineHeight:1 }}>{k.value}</div>
                  </div>
                ))}
              </div>

              {/* ── Main grid: Units + EOI Pipeline ── */}
              <div style={{ display:"grid", gridTemplateColumns:"minmax(0,1fr) min(380px,38%)", gap:16, marginBottom:16, alignItems:"start" }}>

                {/* ── Unit Inventory ── */}
                <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:14, overflow:"hidden" }}>
                  <div style={{ padding:"14px 18px", borderBottom:`1px solid ${T.border}`, display:"flex", alignItems:"center", gap:10 }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={T.gold} strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>
                    <div style={{ fontSize:13, fontWeight:700, color:T.white }}>Unit Inventory</div>
                    <div style={{ marginLeft:"auto", display:"flex", background:T.surfaceAlt, border:`1px solid ${T.border}`, borderRadius:6, overflow:"hidden" }}>
                      {[["all","All"],["Available","Avail"],["Reserved","Res"],["Sold","Sold"]].map(([v,l])=>(
                        <button key={v} type="button" onClick={()=>setDevUnitFilter(v)}
                          style={{ padding:"5px 10px", fontSize:10, fontWeight:600, border:"none", background:devUnitFilter===v?"rgba(212,168,67,0.15)":"transparent", color:devUnitFilter===v?T.gold:T.textMuted, cursor:"pointer", borderRight:`1px solid ${T.border}` }}>
                          {l}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Column headers */}
                  <div style={{ display:"grid", gridTemplateColumns:"70px minmax(80px,1fr) 65px 65px 80px 100px 90px", minWidth:570, gap:8, padding:"8px 16px", fontSize:9, fontWeight:700, color:T.textMuted, textTransform:"uppercase", letterSpacing:0.8, borderBottom:`1px solid ${T.border}` }}>
                    <div>Unit</div><div>Type / View</div><div>Beds</div><div>Size</div><div>Floor</div><div>Price (AED)</div><div>Status</div>
                  </div>

                  {devUnitsLoading ? (
                    <div style={{ padding:"40px", textAlign:"center", color:T.textMuted, fontSize:12 }}>Loading units...</div>
                  ) : filteredUnits.length === 0 ? (
                    <div style={{ padding:"48px 20px", textAlign:"center" }}>
                      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={T.textMuted} strokeWidth="1.5" strokeLinecap="round" style={{ marginBottom:10 }}><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>
                      <div style={{ fontSize:13, color:T.textMuted }}>No units yet — click Add Unit to start building inventory</div>
                    </div>
                  ) : filteredUnits.map((unit, i) => {
                    const sc = UNIT_STATUS[unit.status||"Available"] || UNIT_STATUS.Available;
                    return (
                      <div key={unit.id||i} style={{ display:"grid", gridTemplateColumns:"70px minmax(80px,1fr) 65px 65px 80px 100px 90px", minWidth:570, gap:8, padding:"11px 16px", alignItems:"center", borderBottom:`1px solid ${T.border}`, background:i%2===0?"transparent":"rgba(255,255,255,0.01)" }}>
                        <div style={{ fontSize:12, fontWeight:700, color:T.white }}>{unit.unitNo}</div>
                        <div>
                          <div style={{ fontSize:11, fontWeight:600, color:T.textPrimary }}>{unit.type}</div>
                          {unit.view && <div style={{ fontSize:10, color:T.textMuted }}>{unit.view}</div>}
                        </div>
                        <div style={{ fontSize:11, color:T.textSecondary, textAlign:"center" }}>{unit.beds > 0 ? `${unit.beds} BR` : "—"}</div>
                        <div style={{ fontSize:11, color:T.textSecondary, textAlign:"center" }}>{unit.size > 0 ? `${unit.size.toLocaleString()}` : "—"}</div>
                        <div style={{ fontSize:11, color:T.textSecondary, textAlign:"center" }}>{unit.floor > 0 ? `Floor ${unit.floor}` : "—"}</div>
                        <div style={{ fontSize:11, fontWeight:700, color:T.gold }}>{unit.price > 0 ? `${(parseFloat(unit.price)/1e6).toFixed(2)}M` : "—"}</div>
                        <div>
                          <select value={unit.status||"Available"} onChange={e=>updateUnitStatus(unit.id, e.target.value)}
                            style={{ padding:"4px 6px", background:sc.bg, border:`1px solid ${sc.color}40`, borderRadius:5, color:sc.color, fontSize:10, fontWeight:700, cursor:"pointer", fontFamily:"'Outfit',sans-serif", outline:"none" }}>
                            {Object.keys(UNIT_STATUS).map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* ── EOI Pipeline ── */}
                <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:14, overflow:"hidden" }}>
                  <div style={{ padding:"14px 18px", borderBottom:`1px solid ${T.border}`, display:"flex", alignItems:"center", gap:10 }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={T.teal} strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="4" height="18" rx="1"/><rect x="10" y="3" width="4" height="12" rx="1"/><rect x="17" y="3" width="4" height="15" rx="1"/></svg>
                    <div style={{ fontSize:13, fontWeight:700, color:T.white }}>EOI Pipeline</div>
                    <div style={{ marginLeft:"auto", fontSize:10, color:T.textMuted }}>{devEOIs.length} EOIs</div>
                  </div>

                  {EOI_STAGES.map(stage => {
                    const stageEOIs = devEOIs.filter(e => e.stage === stage.key);
                    return (
                      <div key={stage.key}>
                        <div style={{ padding:"8px 16px", background:`${stage.color}08`, borderBottom:`1px solid ${T.border}`, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                          <span style={{ fontSize:11, fontWeight:700, color:stage.color }}>{stage.label}</span>
                          <span style={{ fontSize:10, color:T.textMuted }}>{stageEOIs.length}</span>
                        </div>
                        {stageEOIs.length === 0 ? (
                          <div style={{ padding:"10px 16px", fontSize:10, color:T.textMuted }}>No {stage.label}s yet</div>
                        ) : stageEOIs.map((eoi,i) => (
                          <div key={eoi.id||i} style={{ padding:"10px 16px", borderBottom:`1px solid ${T.border}`, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                            <div>
                              <div style={{ fontSize:11, fontWeight:600, color:T.textPrimary }}>{eoi.clientName||"Client"}</div>
                              <div style={{ fontSize:10, color:T.textMuted }}>Unit {eoi.unitNo}{"·"}{eoi.broker||"Direct"}</div>
                            </div>
                            <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                              {eoi.price > 0 && <span style={{ fontSize:10, color:T.gold }}>{(parseFloat(eoi.price)/1e6).toFixed(2)}M</span>}
                              {stage.key !== "Completed" && (
                                <button type="button" onClick={()=>advanceEOI(eoi)}
                                  style={{ padding:"4px 8px", borderRadius:5, border:`1px solid ${stage.color}40`, background:`${stage.color}0a`, color:stage.color, fontSize:9, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", gap:3 }}>
                                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
                                  Next
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ── Bottom row: Commission Config + Marketing Hub ── */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>

                {/* Commission Config */}
                <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:14, overflow:"hidden" }}>
                  <div style={{ padding:"14px 18px", borderBottom:`1px solid ${T.border}`, display:"flex", alignItems:"center", gap:10 }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                    <div style={{ fontSize:13, fontWeight:700, color:T.white }}>Broker Commission Config</div>
                  </div>
                  <div style={{ padding:"16px 18px" }}>
                    <div style={{ fontSize:11, color:T.textMuted, marginBottom:14, lineHeight:1.5 }}>
                      Set commission % per project for broker partners. This rate appears in their Pipeline commission calculator.
                    </div>
                    {devProjects.length === 0 ? (
                      <div style={{ fontSize:12, color:T.textMuted }}>No projects registered for this developer ID</div>
                    ) : devProjects.map((proj, i) => {
                      const currentPct = devCommForm[proj.id] ?? (devInfo?.commissionByProject?.[proj.id] ?? 4);
                      return (
                        <div key={proj.id||i} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 0", borderBottom:`1px solid ${T.border}` }}>
                          <div style={{ flex:1, fontSize:12, fontWeight:600, color:T.textPrimary, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{proj.name}</div>
                          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                            <input type="number" min="1" max="20" value={devCommForm[proj.id] ?? currentPct}
                              onChange={e=>setDevCommForm(f=>({...f,[proj.id]:e.target.value}))}
                              style={{ width:48, padding:"5px 8px", background:T.bg, border:`1px solid rgba(212,168,67,0.2)`, borderRadius:6, color:T.gold, fontSize:11, fontFamily:"'Outfit',sans-serif", outline:"none", textAlign:"center" }}/>
                            <span style={{ fontSize:11, color:T.textMuted }}>%</span>
                            <button type="button" onClick={()=>saveDevComm(proj.id, devCommForm[proj.id]??currentPct)} disabled={devCommSaving}
                              style={{ padding:"5px 10px", borderRadius:6, border:`1px solid rgba(16,185,129,0.3)`, background:"rgba(16,185,129,0.08)", color:"#10B981", fontSize:10, fontWeight:700, cursor:"pointer" }}>
                              {devCommSaving?"...":"Save"}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Marketing Asset Hub */}
                <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:14, overflow:"hidden" }}>
                  <div style={{ padding:"14px 18px", borderBottom:`1px solid ${T.border}`, display:"flex", alignItems:"center", gap:10 }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                    <div style={{ fontSize:13, fontWeight:700, color:T.white }}>Marketing Asset Hub</div>
                  </div>
                  <div style={{ padding:"16px 18px" }}>
                    <div style={{ fontSize:11, color:T.textMuted, marginBottom:14, lineHeight:1.5 }}>
                      Share brochures, floor plans, and price lists with broker partners instantly.
                    </div>
                    {[
                      { label:"Master Brochure",   icon:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>, color:T.gold     },
                      { label:"Floor Plans",        icon:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>,                                          color:T.teal     },
                      { label:"Price List",         icon:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,                           color:"#10B981"  },
                      { label:"Payment Plan",       icon:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>,                                      color:"#8B5CF6"  },
                      { label:"Site Photos",        icon:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>,   color:"#F97316"  },
                      { label:"3D Renders / Video", icon:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>,                                    color:T.red      },
                    ].map(({label,icon,color},i)=>(
                      <div key={i} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 0", borderBottom:i<5?`1px solid ${T.border}`:"none" }}>
                        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                          <div style={{ color }}>{icon}</div>
                          <span style={{ fontSize:12, color:T.textPrimary }}>{label}</span>
                        </div>
                        <div style={{ display:"flex", gap:6 }}>
                          <button type="button"
                            style={{ padding:"4px 10px", borderRadius:5, border:`1px solid ${color}30`, background:`${color}08`, color, fontSize:10, fontWeight:600, cursor:"pointer" }}>
                            Upload
                          </button>
                          <button type="button"
                            style={{ padding:"4px 10px", borderRadius:5, border:`1px solid ${T.border}`, background:"transparent", color:T.textMuted, fontSize:10, cursor:"pointer" }}>
                            Share
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* ── Add Unit Modal ── */}
              {showAddUnit && (
                <div style={{ position:"fixed", inset:0, background:"rgba(4,9,15,0.85)", zIndex:2000, display:"flex", alignItems:"center", justifyContent:"center", backdropFilter:"blur(8px)" }} onClick={e=>{if(e.target===e.currentTarget)setShowAddUnit(false);}}>
                  <div style={{ background:T.surface, borderRadius:16, border:`1px solid ${T.border}`, width:"95%", maxWidth:500, maxHeight:"90vh", overflowY:"auto" }} onClick={e=>e.stopPropagation()}>
                    <div style={{ padding:"22px 24px", borderBottom:`1px solid ${T.border}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                      <div>
                        <div style={{ fontFamily:"'Fraunces',serif", fontSize:18, fontWeight:900, color:T.gold }}>Add Unit</div>
                        <div style={{ fontSize:11, color:T.textMuted, marginTop:2 }}>Add a unit to your inventory</div>
                      </div>
                      <button type="button" onClick={()=>setShowAddUnit(false)}
                        style={{ background:T.surfaceAlt, border:`1px solid ${T.border}`, borderRadius:8, color:T.textMuted, width:32, height:32, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      </button>
                    </div>
                    <div style={{ padding:"20px 24px", display:"flex", flexDirection:"column", gap:14 }}>
                      {/* Type */}
                      <div>
                        <div style={{ fontSize:11, fontWeight:600, color:T.textMuted, marginBottom:8 }}>Unit Type</div>
                        <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                          {["Apartment","Villa","Townhouse","Penthouse","Duplex","Studio"].map(t=>(
                            <button key={t} type="button" onClick={()=>setUnitForm(f=>({...f,type:t}))}
                              style={{ padding:"6px 12px", borderRadius:7, border:`1px solid ${unitForm.type===t?T.gold:T.border}`, background:unitForm.type===t?"rgba(212,168,67,0.1)":"transparent", color:unitForm.type===t?T.gold:T.textMuted, fontSize:11, fontWeight:600, cursor:"pointer" }}>
                              {t}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                        {[
                          { key:"unitNo", label:"Unit Number *",  placeholder:"A-1204"   },
                          { key:"floor",  label:"Floor",          placeholder:"12", type:"number" },
                          { key:"beds",   label:"Bedrooms",       placeholder:"2",  type:"number" },
                          { key:"baths",  label:"Bathrooms",      placeholder:"2",  type:"number" },
                          { key:"size",   label:"Size (sqft)",    placeholder:"1250",type:"number"},
                          { key:"price",  label:"Price (AED)",    placeholder:"2500000",type:"number"},
                          { key:"view",   label:"View",           placeholder:"Park / Sea / City" },
                        ].map(({key,label,placeholder,type})=>(
                          <div key={key} style={{ gridColumn: key==="view"?"1/-1":"auto" }}>
                            <div style={{ fontSize:11, fontWeight:600, color:T.textMuted, marginBottom:5 }}>{label}</div>
                            <input type={type||"text"} value={unitForm[key]||""} onChange={e=>setUnitForm(f=>({...f,[key]:e.target.value}))}
                              placeholder={placeholder}
                              style={{ width:"100%", padding:"10px 14px", background:T.bg, border:`1px solid rgba(212,168,67,0.15)`, borderRadius:9, color:T.textPrimary, fontSize:13, fontFamily:"'Outfit',sans-serif", outline:"none", boxSizing:"border-box" }}/>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div style={{ padding:"16px 24px", borderTop:`1px solid ${T.border}`, display:"flex", gap:10, justifyContent:"flex-end" }}>
                      <button type="button" onClick={()=>setShowAddUnit(false)}
                        style={{ padding:"10px 20px", borderRadius:8, border:`1px solid ${T.border}`, background:"transparent", color:T.textMuted, fontSize:12, cursor:"pointer" }}>
                        Cancel
                      </button>
                      <button type="button" onClick={createUnit} disabled={unitFormLoading||!unitForm.unitNo}
                        style={{ padding:"10px 24px", borderRadius:8, border:`1px solid ${T.gold}`, background:"rgba(212,168,67,0.12)", color:T.gold, fontSize:12, fontWeight:700, cursor:"pointer", opacity:(unitFormLoading||!unitForm.unitNo)?0.5:1, fontFamily:"'Outfit',sans-serif" }}>
                        {unitFormLoading?"Adding...":"Add Unit"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>);
}

export default DevPortalTab;
