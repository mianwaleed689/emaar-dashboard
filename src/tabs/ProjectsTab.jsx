/* eslint-disable */
/* PROJECTS TAB — Master catalog of all Dubai property projects
   Includes detail modal (rendered via React Portal for safety)
*/

import React, { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { T } from "../data";
import { SvgIcons } from "../components/Icons";

import { calcScore, scoreColor, scoreLabel } from "../utils/scoring";

const MODES = [
  { key:"Apartment" }, { key:"Villa" }, { key:"Townhouse" },
  { key:"Hotel Apartment" }, { key:"Office" }, { key:"Retail" },
  { key:"Warehouse" }, { key:"Land" },
];

function ProjectsTab({
  SEED_PROJECTS, liveProjects,
  projSearch, setProjSearch,
  projDev, setProjDev,
  projCommunity, setProjCommunity,
  projStatus, setProjStatus,
  projBeds, setProjBeds,
  projHandover, setProjHandover,
  projSort, setProjSort,
  projGrade, setProjGrade,
  projMode, setProjMode,
  projView, setProjView,
  projPriceMin, projPriceMax,
  projCompare, setProjCompare,
  projIntelFilter, setProjIntelFilter,
  selectedProject, setSelectedProject,
  projDetailTab, setProjDetailTab,
  showCompare, setShowCompare,
  handleTabChange,
}) {

  /* Lock body scroll when modal open */
  useEffect(() => {
    if (selectedProject) {
      const original = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = original; };
    }
  }, [selectedProject]);

  /* Escape closes modal */
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape" && selectedProject) setSelectedProject(null); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selectedProject, setSelectedProject]);

  return (
    <>
      {(() => {

            /* SEED_PROJECTS — defined at top level */
            const rawProjects = liveProjects?.length > 0 ? liveProjects : SEED_PROJECTS;

            const filtered = rawProjects.filter(p => {
              if (p.type !== projMode) return false;
              if (projSearch && !JSON.stringify(p).toLowerCase().includes(projSearch.toLowerCase())) return false;
              if (projDev !== "All" && p.developer !== projDev) return false;
              if (projCommunity !== "All" && p.community !== projCommunity) return false;
              if (projStatus !== "All" && p.status !== projStatus) return false;
              if (projBeds !== "All" && p.beds && p.beds.length > 0 && !p.beds.includes(projBeds)) return false;
              if (projHandover !== "All" && !p.handover?.includes(projHandover)) return false;
              if (projGrade !== "All" && p.officeGrade !== projGrade) return false;
              if (projIntelFilter === "tier1" && p.tier !== 1) return false;
              if (projIntelFilter === "gv" && !(p.goldenVisa && p.priceMin >= 2000000)) return false;
              if (projIntelFilter === "branded" && !p.branded) return false;
              if (projPriceMin > 0 && p.priceMin < projPriceMin) return false;
              if (projPriceMax > 0 && p.priceMax > projPriceMax) return false;
              return true;
            }).sort((a,b) => {
              if (projSort === "yield") return (b.grossYield||0) - (a.grossYield||0);
              if (projSort === "score") return calcScore(b) - calcScore(a);
              if (projSort === "price_asc") return a.priceMin - b.priceMin;
              if (projSort === "price_desc") return b.priceMin - a.priceMin;
              return 0;
            });

            const avgYield = filtered.length > 0 && filtered.some(p => p.grossYield > 0)
              ? (filtered.filter(p=>p.grossYield>0).reduce((a,p) => a + p.grossYield, 0) / filtered.filter(p=>p.grossYield>0).length).toFixed(1) : "—";
            const avgPpsf = filtered.length > 0 && filtered.some(p=>p.ppsf)
              ? Math.round(filtered.filter(p=>p.ppsf).reduce((a,p) => a + p.ppsf, 0) / filtered.filter(p=>p.ppsf).length) : 0;

            const devOptions = ["All", ...new Set(rawProjects.filter(p=>p.type===projMode).map(p=>p.developer))];
            const commOptions = ["All", ...new Set(rawProjects.filter(p=>p.type===projMode).map(p=>p.community))];

            const selSt = {
              background: T.surfaceAlt, border: `1px solid ${T.border}`,
              borderRadius: 8, color: T.white, fontFamily:"'Outfit',sans-serif",
              fontSize: 12, padding:"7px 28px 7px 10px", outline:"none", cursor:"pointer",
              appearance:"none", WebkitAppearance:"none",
              backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
              backgroundRepeat:"no-repeat", backgroundPosition:"right 8px center",
            };

            const StatusBadge = ({ status }) => {
              const cfg = { "Off-Plan":{ bg:"rgba(212,168,67,0.15)", color:T.gold }, "Ready":{ bg:"rgba(16,185,129,0.15)", color:T.green }, "Sold Out":{ bg:"rgba(255,255,255,0.08)", color:T.textMuted } }[status] || { bg:"rgba(212,168,67,0.1)", color:T.gold };
              return <span style={{ fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:10, background:cfg.bg, color:cfg.color }}>{status}</span>;
            };

            const ScoreCircle = ({ score }) => (
              <div style={{ width:44, height:44, borderRadius:"50%", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", border:`2px solid ${scoreColor(score)}`, background:`${scoreColor(score)}22`, flexShrink:0 }}>
                <span style={{ fontFamily:"'Fraunces',serif", fontSize:14, fontWeight:900, color:scoreColor(score), lineHeight:1 }}>{score}</span>
              </div>
            );

            const ProjectCard = ({ p }) => {
              const score = calcScore(p);
              const inCompare = projCompare.some(c => c.id === p.id);
              return (
                <div className="chart-box" style={{ padding:0, overflow:"hidden", cursor:"pointer" }}
                  onMouseEnter={e => e.currentTarget.style.borderColor="rgba(212,168,67,0.4)"}
                  onMouseLeave={e => e.currentTarget.style.borderColor=T.border}>
                  <div style={{ padding:"14px 16px", borderBottom:`1px solid ${T.border}` }} onClick={() => { setSelectedProject(p); setProjDetailTab("overview"); }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:10, fontWeight:700, color:T.textMuted, letterSpacing:0.8, textTransform:"uppercase", marginBottom:3 }}>{p.developer}{"·"}{p.community}</div>
                        <div style={{ fontFamily:"'Fraunces',serif", fontSize:15, fontWeight:700, color:T.white, marginBottom:6 }}>{p.project}</div>
                        <div style={{ display:"flex", gap:6, flexWrap:"wrap", alignItems:"center" }}>
                          <StatusBadge status={p.status} />
                          {p.handover && <span style={{ fontSize:10, color:T.textMuted }}>{p.handover}</span>}
                          {p.beds?.length > 0 && <span style={{ fontSize:10, color:T.textMuted }}>{"·"}{p.beds.join(" / ")}</span>}
                        </div>
                        {/* Intelligence badges row */}
                        <div style={{ display:"flex", gap:5, flexWrap:"wrap", marginTop:6 }}>
                          {p.tier === 1 && <span style={{ fontSize:9, padding:"2px 7px", borderRadius:5, background:"rgba(16,185,129,0.12)", color:"#10B981", fontWeight:700 }}>Tier 1</span>}
                          {p.tier === 2 && <span style={{ fontSize:9, padding:"2px 7px", borderRadius:5, background:"rgba(245,158,11,0.12)", color:"#F59E0B", fontWeight:700 }}>Tier 2</span>}
                          {p.goldenVisa && p.priceMin >= 2000000 && <span style={{ fontSize:9, padding:"2px 7px", borderRadius:5, background:"rgba(212,168,67,0.15)", color:T.gold, fontWeight:700 }}>★ GV</span>}
                          {p.branded && <span style={{ fontSize:9, padding:"2px 7px", borderRadius:5, background:"rgba(139,92,246,0.15)", color:"#A78BFA", fontWeight:700 }}>◆ {p.brandPartner || "Branded"}</span>}
                          {p.appreciationToHandover > 0 && <span style={{ fontSize:9, padding:"2px 7px", borderRadius:5, background:"rgba(212,168,67,0.08)", color:T.gold, fontWeight:700 }}>+{p.appreciationToHandover}% pre→hand</span>}
                          {p.velocityScore > 0 && <span style={{ fontSize:9, padding:"2px 7px", borderRadius:5, background:p.velocityScore >= 80 ? "rgba(16,185,129,0.12)" : "rgba(245,158,11,0.12)", color:p.velocityScore >= 80 ? "#10B981" : "#F59E0B", fontWeight:700 }}>Velocity {p.velocityScore}</span>}
                        </div>
                      </div>
                      <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:6 }}>
                        <ScoreCircle score={score} />
                        <span style={{ fontSize:9, fontWeight:700, color:scoreColor(score) }}>{scoreLabel(score)}</span>
                        {p.commission && <span style={{ fontSize:9, padding:"2px 6px", borderRadius:6, background:"rgba(16,185,129,0.12)", color:T.green, fontWeight:700 }}>{p.commission}% comm</span>}
                      </div>
                    </div>
                  </div>
                  <div style={{ padding:"12px 16px", borderBottom:`1px solid ${T.border}` }} onClick={() => { setSelectedProject(p); setProjDetailTab("overview"); }}>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:8, marginBottom:10 }}>
                      <div>
                        <div style={{ fontSize:9, color:T.textMuted, textTransform:"uppercase", letterSpacing:0.6, marginBottom:2 }}>From</div>
                        <div style={{ fontSize:13, fontWeight:700, color:T.white }}>{p.priceMin ? "AED " + (p.priceMin/1000000).toFixed(1) + "M" : "TBC"}</div>
                      </div>
                      <div>
                        <div style={{ fontSize:9, color:T.textMuted, textTransform:"uppercase", letterSpacing:0.6, marginBottom:2 }}>PPSF</div>
                        <div style={{ fontSize:13, fontWeight:700, color:T.white }}>AED {(p.ppsf||0).toLocaleString()}</div>
                      </div>
                      <div>
                        <div style={{ fontSize:9, color:T.textMuted, textTransform:"uppercase", letterSpacing:0.6, marginBottom:2 }}>Yield</div>
                        <div style={{ fontSize:13, fontWeight:700, color:p.grossYield >= 7 ? T.green : p.grossYield >= 5 ? T.gold : T.textSecondary }}>{p.grossYield ? p.grossYield.toFixed(1) + "%" : "—"}</div>
                      </div>
                      <div>
                        <div style={{ fontSize:9, color:T.textMuted, textTransform:"uppercase", letterSpacing:0.6, marginBottom:2 }}>Plan</div>
                        <div style={{ fontSize:13, fontWeight:700, color:T.white }}>{p.paymentPlan || "TBC"}</div>
                      </div>
                    </div>
                    {/* Unit mini-breakdown on card */}
                    {p.unitBreakdown?.length > 0 && (
                      <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:8, padding:"8px 10px", background:T.surfaceAlt, borderRadius:8 }}>
                        {p.unitBreakdown.map((u,i) => (
                          <div key={i} style={{ display:"flex", flexDirection:"column", alignItems:"center", padding:"4px 8px", background:"rgba(212,168,67,0.06)", borderRadius:6, border:`1px solid rgba(212,168,67,0.15)`, minWidth:64 }}>
                            <span style={{ fontSize:9, fontWeight:700, color:T.gold }}>{u.type}</span>
                            <span style={{ fontSize:10, color:T.white, fontWeight:600 }}>AED {(u.ppsf||0).toLocaleString()}</span>
                            <span style={{ fontSize:9, color:T.textMuted }}>AED {(u.priceMin/1000000).toFixed(1)}M+</span>
                          </div>
                        ))}
                      </div>
                    )}
                    <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                      {p.distMetro !== undefined && <span style={{ fontSize:10, padding:"2px 7px", borderRadius:8, background:p.distMetro <= 0.8 ? "rgba(16,185,129,0.15)" : T.surfaceAlt, color:p.distMetro <= 0.8 ? T.green : T.textMuted }}>Metro {p.distMetro <= 0.8 ? "≤800m" : p.distMetro + "km"}</span>}
                      {p.distBeach !== undefined && p.distBeach <= 2 && <span style={{ fontSize:10, padding:"2px 7px", borderRadius:8, background:"rgba(20,184,166,0.12)", color:T.teal }}>Beach {p.distBeach < 1 ? (p.distBeach*1000).toFixed(0)+"m" : p.distBeach+"km"}</span>}
                      {p.distDIFC !== undefined && <span style={{ fontSize:10, padding:"2px 7px", borderRadius:8, background:T.surfaceAlt, color:T.textMuted }}>DIFC {p.distDIFC}km</span>}
                      {p.constructionPct > 0 && p.status !== "Ready" && <span style={{ fontSize:10, padding:"2px 7px", borderRadius:8, background:"rgba(139,92,246,0.12)", color:"#8B5CF6" }}>{p.constructionPct}% built</span>}
                    </div>
                  </div>
                  {p.amenities?.length > 0 && (
                    <div style={{ padding:"10px 16px", borderBottom:`1px solid ${T.border}`, display:"flex", gap:4, flexWrap:"wrap" }} onClick={() => { setSelectedProject(p); setProjDetailTab("overview"); }}>
                      {p.amenities.slice(0,4).map((a,i) => <span key={i} style={{ fontSize:10, padding:"2px 6px", borderRadius:6, background:T.surfaceAlt, color:T.textMuted }}>{a}</span>)}
                      {(p.view||[]).slice(0,2).map((v,i) => <span key={"v"+i} style={{ fontSize:10, padding:"2px 6px", borderRadius:6, background:"rgba(20,184,166,0.08)", color:T.teal }}>{v}</span>)}
                      {p.amenities.length > 4 && <span style={{ fontSize:10, color:T.textMuted }}>+{p.amenities.length-4}</span>}
                    </div>
                  )}
                  <div style={{ padding:"10px 12px", display:"flex", gap:6, flexWrap:"wrap" }}>
                    <button type="button" onClick={() => handleTabChange("Investment Score")} style={{ padding:"5px 10px", background:"rgba(212,168,67,0.08)", border:`1px solid ${T.border}`, borderRadius:7, color:T.gold, fontSize:10, fontWeight:700, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>ROI →</button>
                    <button type="button" onClick={() => handleTabChange("Mortgage")} style={{ padding:"5px 10px", background:T.surfaceAlt, border:`1px solid ${T.border}`, borderRadius:7, color:T.textSecondary, fontSize:10, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>Mortgage</button>
                    {p.status === "Off-Plan" && <button type="button" onClick={() => handleTabChange("Launch Calendar")} style={{ padding:"5px 10px", background:"rgba(212,168,67,0.08)", border:`1px solid ${T.gold}`, borderRadius:7, color:T.gold, fontSize:10, fontWeight:700, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>View Launch →</button>}
                    <button type="button" onClick={() => setProjCompare(prev => inCompare ? prev.filter(c=>c.id!==p.id) : prev.length < 3 ? [...prev,p] : prev)} style={{ padding:"5px 10px", background:inCompare?"rgba(16,185,129,0.12)":T.surfaceAlt, border:`1px solid ${inCompare?T.green:T.border}`, borderRadius:7, color:inCompare?T.green:T.textSecondary, fontSize:10, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>{inCompare?"✓ Compare":"+ Compare"}</button>
                    <button type="button" onClick={() => handleTabChange("My Leads")} style={{ padding:"5px 10px", background:T.surfaceAlt, border:`1px solid ${T.border}`, borderRadius:7, color:T.textSecondary, fontSize:10, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>Add Lead</button>
                    <button type="button" onClick={() => { setSelectedProject(p); setProjDetailTab("overview"); }} style={{ padding:"5px 10px", background:T.surfaceAlt, border:`1px solid ${T.border}`, borderRadius:7, color:T.textSecondary, fontSize:10, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>Details →</button>
                  </div>
                </div>
              );
            };

            return (
              <div style={{ animation:"fadeUp 0.4s ease-out forwards" }}>
                {/* Header */}
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 0", marginBottom:16, borderBottom:`1px solid ${T.border}`, flexWrap:"wrap", gap:8 }}>
                  <div>
                    <div style={{ fontFamily:"'Fraunces',serif", fontSize:20, fontWeight:800, color:T.white }}>Project Explorer</div>
                    <div style={{ fontSize:11, color:T.textMuted, marginTop:3 }}>All Dubai property types · Investment intelligence · Full project data</div>
                  </div>
                  <div style={{ display:"flex", gap:8 }}>
                    {["grid","list"].map(v => (
                      <button key={v} type="button" onClick={() => setProjView(v)} style={{ padding:"6px 14px", background:projView===v?"rgba(212,168,67,0.15)":T.surfaceAlt, border:`1px solid ${projView===v?"rgba(212,168,67,0.4)":T.border}`, borderRadius:8, color:projView===v?T.gold:T.textMuted, fontSize:11, fontWeight:600, cursor:"pointer", fontFamily:"'Outfit',sans-serif", textTransform:"capitalize" }}>{v}</button>
                    ))}
                  </div>
                </div>

                {/* Mode Selector */}
                <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:16, padding:"12px 14px", background:T.surface, border:`1px solid ${T.border}`, borderRadius:10 }}>
                  <span style={{ fontSize:10, fontWeight:700, color:T.textMuted, letterSpacing:0.8, textTransform:"uppercase", alignSelf:"center", marginRight:4 }}>Type:</span>
                  {MODES.map(m => (
                    <button key={m.key} type="button" onClick={() => { setProjMode(m.key); setProjBeds("All"); setProjDev("All"); setProjCommunity("All"); setProjSearch(""); }}
                      style={{ padding:"6px 14px", background:projMode===m.key?"rgba(212,168,67,0.15)":T.surfaceAlt, border:`1px solid ${projMode===m.key?"rgba(212,168,67,0.5)":T.border}`, borderRadius:20, color:projMode===m.key?T.gold:T.textSecondary, fontSize:12, fontWeight:projMode===m.key?700:400, cursor:"pointer", fontFamily:"'Outfit',sans-serif", transition:"all 0.15s" }}>
                      {m.key}
                    </button>
                  ))}
                </div>

                {/* Filters */}
                <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:"12px 14px", marginBottom:16 }}>
                  <div style={{ display:"flex", gap:8, flexWrap:"wrap", alignItems:"center" }}>
                    <div style={{ position:"relative", flex:"0 0 200px" }}>
                      {SvgIcons.Search({ width:13, height:13, style:{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", color:T.textMuted, pointerEvents:"none" } })}
                      <input value={projSearch} onChange={e => setProjSearch(e.target.value)} placeholder="Project, developer, area..." style={{ ...selSt, paddingLeft:30, paddingRight:10, width:"100%", backgroundImage:"none" }} />
                    </div>
                    <select value={projDev} onChange={e => setProjDev(e.target.value)} style={selSt}>{devOptions.map(d => <option key={d}>{d}</option>)}</select>
                    <select value={projCommunity} onChange={e => setProjCommunity(e.target.value)} style={selSt}>{commOptions.map(c => <option key={c}>{c}</option>)}</select>
                    <select value={projStatus} onChange={e => setProjStatus(e.target.value)} style={selSt}>
                      {["All","Off-Plan","Ready","Sold Out"].map(s => <option key={s}>{s}</option>)}
                    </select>
                    {["Apartment","Villa","Townhouse","Hotel Apartment"].includes(projMode) && (
                      <select value={projBeds} onChange={e => setProjBeds(e.target.value)} style={selSt}>
                        {["All","Studio","1BR","2BR","3BR","4BR","5BR+"].map(b => <option key={b}>{b}</option>)}
                      </select>
                    )}
                    {projMode === "Office" && (
                      <select value={projGrade} onChange={e => setProjGrade(e.target.value)} style={selSt}>
                        {["All","A","B","C"].map(g => <option key={g}>{g === "All" ? "All Grades" : "Grade " + g}</option>)}
                      </select>
                    )}
                    <select value={projHandover} onChange={e => setProjHandover(e.target.value)} style={selSt}>
                      {["All","2026","2027","2028","2029","Available Now"].map(h => <option key={h}>{h === "All" ? "Any Handover" : h}</option>)}
                    </select>
                    <select value={projSort} onChange={e => setProjSort(e.target.value)} style={selSt}>
                      <option value="yield">Sort: Yield High</option>
                      <option value="score">Sort: Score High</option>
                      <option value="price_asc">Sort: Price Low</option>
                      <option value="price_desc">Sort: Price High</option>
                    </select>
                    <span style={{ fontSize:11, color:T.textMuted, marginLeft:"auto" }}>{filtered.length} projects</span>
                    {(projSearch || projDev !== "All" || projCommunity !== "All" || projStatus !== "All" || projBeds !== "All" || projHandover !== "All") && (
                      <button type="button" onClick={() => { setProjSearch(""); setProjDev("All"); setProjCommunity("All"); setProjStatus("All"); setProjBeds("All"); setProjHandover("All"); setProjGrade("All"); setProjIntelFilter("all"); }} style={{ background:"none", border:`1px solid ${T.border}`, borderRadius:8, padding:"6px 12px", color:T.textMuted, fontSize:11, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>Clear</button>
                    )}
                  </div>
                  {/* Intelligence filter chips */}
                  <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginTop:10, paddingTop:10, borderTop:`1px solid ${T.border}`, alignItems:"center" }}>
                    <span style={{ fontSize:10, color:T.textMuted, textTransform:"uppercase", letterSpacing:0.5, marginRight:4, fontWeight:700 }}>Intelligence:</span>
                    {[
                      { key:"all",     label:"All Projects" },
                      { key:"tier1",   label:"⚡ Tier 1 Devs Only" },
                      { key:"gv",      label:"★ Golden Visa Eligible" },
                      { key:"branded", label:"◆ Branded Residences" },
                    ].map(f => (
                      <button key={f.key} type="button" onClick={() => setProjIntelFilter(f.key)}
                        style={{
                          padding:"5px 12px",
                          background: projIntelFilter === f.key ? T.gold : "rgba(255,255,255,0.04)",
                          border: `1px solid ${projIntelFilter === f.key ? T.gold : T.border}`,
                          borderRadius:16,
                          color: projIntelFilter === f.key ? "#000" : T.textPrimary,
                          fontSize:10,
                          fontWeight:700,
                          cursor:"pointer",
                          fontFamily:"'Outfit',sans-serif",
                        }}>
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* KPI Bar */}
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(170px,1fr))", gap:10, marginBottom:20 }}>
                  {[
                    { label:"Projects Found", value:filtered.length.toString(), color:T.white },
                    { label:"Price Range", value:filtered.length > 0 ? `AED ${(Math.min(...filtered.map(p=>p.priceMin))/1000000).toFixed(1)}M+` : "—", color:T.white },
                    { label:"Avg Gross Yield", value:avgYield !== "—" ? avgYield + "%" : "—", color:T.green },
                    { label:"Avg PPSF", value:avgPpsf > 0 ? "AED " + avgPpsf.toLocaleString() : "—", color:T.gold },
                  ].map((kpi,i) => (
                    <div key={i} className="kpi-card">
                      <div style={{ fontSize:10, fontWeight:700, color:T.textMuted, letterSpacing:1, textTransform:"uppercase", marginBottom:8 }}>{kpi.label}</div>
                      <div style={{ fontFamily:"'Fraunces',serif", fontSize:24, fontWeight:800, color:kpi.color }}>{kpi.value}</div>
                    </div>
                  ))}
                </div>

                {/* Compare bar */}
                {projCompare.length > 0 && (
                  <div style={{ background:"rgba(212,168,67,0.06)", border:`1px solid rgba(212,168,67,0.2)`, borderRadius:10, padding:"10px 16px", marginBottom:16, display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
                    <span style={{ fontSize:11, fontWeight:700, color:T.gold }}>Comparing {projCompare.length}/3:</span>
                    {projCompare.map((p,i) => (
                      <span key={i} style={{ fontSize:11, padding:"3px 10px", borderRadius:10, background:"rgba(212,168,67,0.1)", color:T.white, display:"flex", alignItems:"center", gap:6 }}>
                        {p.project?.substring(0,20)}
                        <button type="button" onClick={() => setProjCompare(prev => prev.filter(c=>c.id!==p.id))} style={{ background:"none", border:"none", color:T.textMuted, cursor:"pointer", fontSize:12, padding:0 }}>×</button>
                      </span>
                    ))}
                    <div style={{ display:"flex", gap:8, marginLeft:"auto" }}>
                      {projCompare.length >= 2 && (
                        <button type="button" onClick={() => setShowCompare(true)}
                          style={{ padding:"7px 16px", background:`linear-gradient(135deg, ${T.gold}, #B8922A)`, border:"none", borderRadius:8, color:"#000", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>
                          View Comparison →
                        </button>
                      )}
                      <button type="button" onClick={() => setProjCompare([])} style={{ background:"none", border:`1px solid ${T.border}`, borderRadius:8, padding:"5px 10px", color:T.textMuted, fontSize:11, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>Clear</button>
                    </div>
                  </div>
                )}

                {/* Seed notice */}
                {!liveProjects?.length && (
                  <div style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 14px", borderRadius:8, background:"rgba(212,168,67,0.06)", border:`1px solid rgba(212,168,67,0.2)`, marginBottom:16 }}>
                    <span style={{ width:6, height:6, borderRadius:"50%", background:T.gold, display:"inline-block" }} />
                    <span style={{ fontSize:11, color:T.textMuted }}><span style={{ color:T.gold, fontWeight:700 }}>Research-based seed projects</span> — Developer portals, Bayut, PropertyFinder, DLD Apr 2026 · Import via Admin → Data Manager</span>
                  </div>
                )}

                {/* Empty state */}
                {filtered.length === 0 && (
                  <div style={{ textAlign:"center", padding:"60px 24px", background:"rgba(212,168,67,0.03)", borderRadius:12, border:`1px solid ${T.border}` }}>
                    {SvgIcons.Building2({ width:40, height:40, style:{ color:T.textMuted, marginBottom:14, display:"inline-block" } })}
                    <div style={{ fontSize:15, fontWeight:700, color:T.white, marginBottom:8 }}>No {projMode} projects match your filters</div>
                    <div style={{ fontSize:12, color:T.textMuted }}>Try adjusting filters or switching property type</div>
                  </div>
                )}

                {/* Grid */}
                {filtered.length > 0 && projView === "grid" && (
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(340px,1fr))", gap:16, marginBottom:20 }}>
                    {filtered.map((p,i) => <ProjectCard key={p.id||i} p={p} />)}
                  </div>
                )}

                {/* List */}
                {filtered.length > 0 && projView === "list" && (
                  <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:12, overflow:"hidden", marginBottom:20 }}>
                    <div style={{ display:"grid", gridTemplateColumns:"2.5fr 1fr 1fr 1fr 1fr 1fr 1.2fr", padding:"10px 16px", background:T.surfaceAlt, borderBottom:`1px solid ${T.border}` }}>
                      {["Project","From","PPSF","Yield","Plan","Handover","Score"].map((h,i) => (
                        <div key={i} style={{ fontSize:10, fontWeight:700, color:T.textMuted, letterSpacing:0.8, textTransform:"uppercase" }}>{h}</div>
                      ))}
                    </div>
                    {filtered.map((p,i) => {
                      const sc = calcScore(p);
                      return (
                        <div key={p.id||i} onClick={() => { setSelectedProject(p); setProjDetailTab("overview"); }}
                          style={{ display:"grid", gridTemplateColumns:"2.5fr 1fr 1fr 1fr 1fr 1fr 1.2fr", padding:"12px 16px", borderBottom:i<filtered.length-1?`1px solid ${T.border}`:"none", cursor:"pointer" }}
                          onMouseEnter={e => e.currentTarget.style.background="rgba(212,168,67,0.03)"}
                          onMouseLeave={e => e.currentTarget.style.background="transparent"}>
                          <div>
                            <div style={{ fontSize:13, fontWeight:600, color:T.white }}>{p.project}</div>
                            <div style={{ fontSize:11, color:T.textMuted }}>{p.developer}{"·"}{p.community}</div>
                          </div>
                          <div style={{ fontSize:13, color:T.white }}>{p.priceMin ? "AED " + (p.priceMin/1000000).toFixed(1) + "M" : "—"}</div>
                          <div style={{ fontSize:13, color:T.gold, fontWeight:600 }}>AED {(p.ppsf||0).toLocaleString()}</div>
                          <div style={{ fontSize:13, fontWeight:700, color:p.grossYield>=7?T.green:p.grossYield>=5?T.gold:T.textSecondary }}>{p.grossYield?p.grossYield.toFixed(1)+"%":"—"}</div>
                          <div style={{ fontSize:12, color:T.textSecondary }}>{p.paymentPlan||"—"}</div>
                          <div style={{ fontSize:12, color:T.textMuted }}>{p.handover||"—"}</div>
                          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                            <span style={{ fontSize:14, fontWeight:700, color:scoreColor(sc) }}>{sc}</span>
                            <span style={{ fontSize:10, color:scoreColor(sc) }}>{scoreLabel(sc)}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Cross-tab nav */}
                <div style={{ display:"flex", gap:8, marginBottom:14, flexWrap:"wrap" }}>
                  {[
                    { label:"Dev Portal →", tab:"Dev Portal" },
                    { label:"Launch Calendar →", tab:"Launch Calendar" },
                    { label:"Yields →", tab:"Yields" },
                    { label:"DLD Volumes →", tab:"DLD Volumes" },
                  ].map((n,i) => (
                    <button key={i} type="button" onClick={() => handleTabChange(n.tab)}
                      style={{ padding:"6px 14px", background:"rgba(212,168,67,0.06)", border:`1px solid ${T.border}`, borderRadius:8, color:T.gold, fontSize:11, fontWeight:600, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>
                      {n.label}
                    </button>
                  ))}
                </div>
                {/* Sources */}
                <div style={{ paddingTop:12, borderTop:`1px solid ${T.border}`, display:"flex", gap:8, flexWrap:"wrap", alignItems:"center" }}>
                  <span style={{ fontSize:10, color:T.textMuted }}>Sources:</span>
                  {["Developer Portals","Bayut","PropertyFinder","DLD RERA Registry","Knight Frank Q1 2025","Chestertons 2026"].map((s,i) => (
                    <span key={i} style={{ fontSize:10, color:T.textMuted, padding:"2px 8px", borderRadius:10, border:`1px solid ${T.border}`, background:T.surfaceAlt }}>{s}</span>
                  ))}
                </div>
              </div>
            );
      })()}

      {selectedProject && typeof document !== "undefined" && createPortal(
<div role="dialog" aria-modal="true" style={{ position:"fixed", inset:0, background:"rgba(4,9,15,0.97)", zIndex:2000, display:"flex", flexDirection:"column", backdropFilter:"blur(8px)" }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"16px 24px", borderBottom:`1px solid ${T.border}`, background:T.surface, flexShrink:0 }}>
                <div>
                  <div style={{ fontSize:11, fontWeight:700, color:T.textMuted, letterSpacing:0.8, textTransform:"uppercase", marginBottom:3 }}>{selectedProject.developer}{"·"}{selectedProject.community}</div>
                  <div style={{ fontFamily:"'Fraunces',serif", fontSize:22, fontWeight:800, color:T.white }}>{selectedProject.project}</div>
                  {/* Intelligence badges row */}
                  <div style={{ display:"flex", gap:5, flexWrap:"wrap", marginTop:6 }}>
                    {selectedProject.tier === 1 && <span style={{ fontSize:10, padding:"3px 8px", borderRadius:5, background:"rgba(16,185,129,0.12)", color:"#10B981", fontWeight:700 }}>Tier 1 Developer</span>}
                    {selectedProject.tier === 2 && <span style={{ fontSize:10, padding:"3px 8px", borderRadius:5, background:"rgba(245,158,11,0.12)", color:"#F59E0B", fontWeight:700 }}>Tier 2 Developer</span>}
                    {selectedProject.goldenVisa && selectedProject.priceMin >= 2000000 && <span style={{ fontSize:10, padding:"3px 8px", borderRadius:5, background:"rgba(212,168,67,0.15)", color:T.gold, fontWeight:700 }}>★ Golden Visa Eligible</span>}
                    {selectedProject.branded && <span style={{ fontSize:10, padding:"3px 8px", borderRadius:5, background:"rgba(139,92,246,0.15)", color:"#A78BFA", fontWeight:700 }}>◆ {selectedProject.brandPartner || "Branded Residence"}</span>}
                    {selectedProject.appreciationToHandover > 0 && <span style={{ fontSize:10, padding:"3px 8px", borderRadius:5, background:"rgba(212,168,67,0.08)", color:T.gold, fontWeight:700 }}>+{selectedProject.appreciationToHandover}% pre→handover</span>}
                    {selectedProject.velocityScore > 0 && <span style={{ fontSize:10, padding:"3px 8px", borderRadius:5, background:selectedProject.velocityScore >= 80 ? "rgba(16,185,129,0.12)" : "rgba(245,158,11,0.12)", color:selectedProject.velocityScore >= 80 ? "#10B981" : "#F59E0B", fontWeight:700 }}>Velocity {selectedProject.velocityScore}/100</span>}
                  </div>
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <div style={{ textAlign:"right" }}>
                    <div style={{ fontSize:22, fontWeight:800, color:T.gold, fontFamily:"'Fraunces',serif" }}>{selectedProject.priceMin ? "AED " + (selectedProject.priceMin/1000000).toFixed(1) + "M" : "TBC"}</div>
                    <div style={{ fontSize:11, color:T.textMuted }}>starting price</div>
                  </div>
                  <button type="button" onClick={() => setSelectedProject(null)} style={{ width:36, height:36, borderRadius:"50%", background:T.surfaceAlt, border:`1px solid ${T.border}`, color:T.white, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, fontFamily:"'Outfit',sans-serif" }}>×</button>
                </div>
              </div>
              <div style={{ display:"flex", borderBottom:`1px solid ${T.border}`, background:T.surface, flexShrink:0, overflowX:"auto" }}>
                {[{key:"overview",label:"Overview"},{key:"units",label:"Units & Sizes"},{key:"investment",label:"Investment"},{key:"location",label:"Location"},{key:"payment",label:"Payment Plan"},{key:"dld",label:"DLD History"},{key:"developer",label:"Developer"}].map(t => (
                  <button key={t.key} type="button" onClick={() => setProjDetailTab(t.key)}
                    style={{ padding:"12px 18px", background:"none", border:"none", borderBottom:projDetailTab===t.key?`2px solid ${T.gold}`:"2px solid transparent", color:projDetailTab===t.key?T.gold:T.textMuted, fontSize:12, fontWeight:projDetailTab===t.key?700:400, cursor:"pointer", fontFamily:"'Outfit',sans-serif", whiteSpace:"nowrap" }}>
                    {t.label}
                  </button>
                ))}
              </div>
              <div style={{ flex:1, overflowY:"auto", padding:"24px" }}>
                {projDetailTab === "overview" && (
                  <div>
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(160px, 1fr))", gap:12, marginBottom:20 }}>
                      {[
                        { label:"Investment Score", value:calcScore(selectedProject).toString(), color:(() => { const s=calcScore(selectedProject); return s>=80?T.green:s>=65?T.gold:T.red; })(), sub:scoreLabel(calcScore(selectedProject)) },
                        { label:"Gross Yield", value:selectedProject.grossYield?selectedProject.grossYield.toFixed(1)+"%":"—", color:T.green, sub:"Annual return estimate" },
                        { label:"PPSF", value:selectedProject.ppsf?"AED "+selectedProject.ppsf.toLocaleString():"—", color:T.gold, sub:"Price per sqft" },
                        { label:"Handover", value:selectedProject.handover||"TBC", color:T.white, sub:"Expected completion" },
                        ...(selectedProject.appreciationToHandover > 0 ? [{ label:"Pre→Handover", value:"+"+selectedProject.appreciationToHandover+"%", color:T.gold, sub:"Capital appreciation forecast" }] : []),
                        ...(selectedProject.velocityScore > 0 ? [{ label:"Sales Velocity", value:selectedProject.velocityScore+"/100", color:selectedProject.velocityScore>=80?T.green:selectedProject.velocityScore>=60?T.gold:"#F59E0B", sub:"Launch absorption momentum" }] : []),
                      ].map((kpi,i) => (
                        <div key={i} className="kpi-card">
                          <div style={{ fontSize:10, fontWeight:700, color:T.textMuted, letterSpacing:1, textTransform:"uppercase", marginBottom:8 }}>{kpi.label}</div>
                          <div style={{ fontFamily:"'Fraunces',serif", fontSize:26, fontWeight:800, color:kpi.color, marginBottom:4 }}>{kpi.value}</div>
                          <div style={{ fontSize:11, color:T.textMuted }}>{kpi.sub}</div>
                        </div>
                      ))}
                    </div>
                    {selectedProject.notes && (
                      <div className="chart-box" style={{ padding:18, marginBottom:16 }}>
                        <div style={{ fontSize:11, fontWeight:700, color:T.textMuted, letterSpacing:0.8, textTransform:"uppercase", marginBottom:10 }}>Analyst Notes</div>
                        <div style={{ fontSize:13, color:T.textSecondary, lineHeight:1.8 }}>{selectedProject.notes}</div>
                      </div>
                    )}
                    {selectedProject.amenities?.length > 0 && (
                      <div className="chart-box" style={{ padding:18, marginBottom:16 }}>
                        <div style={{ fontSize:11, fontWeight:700, color:T.textMuted, letterSpacing:0.8, textTransform:"uppercase", marginBottom:12 }}>All Amenities</div>
                        <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                          {selectedProject.amenities.map((a,i) => <span key={i} style={{ fontSize:12, padding:"5px 12px", borderRadius:20, background:T.surfaceAlt, border:`1px solid ${T.border}`, color:T.textSecondary }}>{a}</span>)}
                        </div>
                      </div>
                    )}
                    <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                      <button type="button" onClick={() => { setSelectedProject(null); handleTabChange("Investment Score"); }} style={{ padding:"9px 18px", background:`linear-gradient(135deg,${T.gold},#B8922A)`, border:"none", borderRadius:8, color:"#000", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>Calculate ROI →</button>
                      <button type="button" onClick={() => { setSelectedProject(null); handleTabChange("Mortgage"); }} style={{ padding:"9px 18px", background:T.surfaceAlt, border:`1px solid ${T.border}`, borderRadius:8, color:T.textSecondary, fontSize:12, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>Mortgage</button>
                      <button type="button" onClick={() => { setSelectedProject(null); handleTabChange("My Leads"); }} style={{ padding:"9px 18px", background:T.surfaceAlt, border:`1px solid ${T.border}`, borderRadius:8, color:T.textSecondary, fontSize:12, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>Add to Lead</button>
                      <button type="button" onClick={() => {
                          const score = calcScore(selectedProject);
                          const units = selectedProject.unitBreakdown?.map(u => `  • ${u.type}: AED ${(u.ppsf||0).toLocaleString()}/sqft | From AED ${(u.priceMin/1000000).toFixed(2)}M | Yield ${u.grossYield||"—"}%`).join("\n") || "";
                          const dists = [
                            selectedProject.distMetro != null ? `Metro: ${selectedProject.distMetro}km` : null,
                            selectedProject.distDIFC != null ? `DIFC: ${selectedProject.distDIFC}km` : null,
                            selectedProject.distBeach != null && selectedProject.distBeach <= 5 ? `Beach: ${selectedProject.distBeach < 1 ? (selectedProject.distBeach*1000).toFixed(0)+"m" : selectedProject.distBeach+"km"}` : null,
                            selectedProject.distSchool != null ? `School: ${selectedProject.distSchool}km` : null,
                          ].filter(Boolean).join(" | ");
                          const txt = [
                            "\uD83C\uDFD9️ DXB ANALYTICS — PROPERTY BRIEF",
                            "━━━━━━━━━━━━━━━━━━━━━━━━",
                            `\uD83D\uDCCC ${selectedProject.project}`,
                            `\uD83C\uDFE2 Developer: ${selectedProject.developer}`,
                            `\uD83D\uDCCD Community: ${selectedProject.community}`,
                            `\uD83C\uDFE0 Type: ${selectedProject.type}`,
                            "",
                            "\uD83D\uDCB0 PRICING",
                            `   Starting from: AED ${((selectedProject.priceMin||0)/1000000).toFixed(2)}M`,
                            `   Price per sqft: AED ${(selectedProject.ppsf||0).toLocaleString()}`,
                            units ? `\n\uD83D\uDCD0 UNIT BREAKDOWN\n${units}` : "",
                            "",
                            "\uD83D\uDCCA INVESTMENT",
                            `   Gross Yield: ${selectedProject.grossYield||"—"}%`,
                            `   Net Yield: ${selectedProject.netYield||"—"}%`,
                            `   Payment Plan: ${selectedProject.paymentPlan||"TBC"}`,
                            `   Post-Handover: ${selectedProject.postHandover?"Yes":"No"}`,
                            `   Handover: ${selectedProject.handover||"TBC"}`,
                            `   Investment Score: ${score}/100 — ${score>=80?"Strong Buy":score>=65?"Buy":"Hold"}`,
                            "",
                            "\uD83D\uDCCD DISTANCES",
                            `   ${dists || "See full details"}`,
                            "",
                            selectedProject.amenities?.length > 0 ? `✨ AMENITIES\n   ${selectedProject.amenities.slice(0,6).join(" · ")}` : "",
                            "",
                            `\uD83D\uDD10 RERA: ${selectedProject.reraNo||"TBC"} | Escrow: ${selectedProject.escrowBank||"TBC"}`,
                            "",
                            "━━━━━━━━━━━━━━━━━━━━━━━━",
                            "Powered by DXB Analytics Intelligence Platform",
                            "emaar-dashboard.vercel.app",
                          ].filter(line => line !== "").join("\n");
                          window.open(`https://wa.me/?text=${encodeURIComponent(txt)}`,"_blank");
                        }} style={{ padding:"9px 18px", background:"rgba(37,211,102,0.1)", border:"1px solid rgba(37,211,102,0.3)", borderRadius:8, color:"#25D366", fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>Share WhatsApp</button>
                    </div>
                  </div>
                )}
                {projDetailTab === "units" && (
                  <div>
                    {/* Unit Breakdown Table */}
                    {selectedProject.unitBreakdown?.length > 0 ? (
                      <div className="chart-box" style={{ padding:20, marginBottom:16 }}>
                        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
                          <div style={{ fontSize:13, fontWeight:700, color:T.white }}>Unit Breakdown — Price & PPSF per Type</div>
                          <span style={{ fontSize:10, padding:"2px 8px", borderRadius:8, background:"rgba(212,168,67,0.1)", color:T.gold }}>Source: {selectedProject.source || "Developer"}</span>
                        </div>
                        {/* Table header */}
                        <div style={{ display:"grid", gridTemplateColumns:"1fr 1.2fr 1.2fr 1fr 0.8fr 0.8fr 0.8fr", padding:"8px 12px", background:T.surfaceAlt, borderRadius:"8px 8px 0 0", borderBottom:`1px solid ${T.border}` }}>
                          {["Unit Type","Size Range","Price Range","PPSF","Yield","Avail.",""].map((h,i) => (
                            <div key={i} style={{ fontSize:10, fontWeight:700, color:T.textMuted, letterSpacing:0.8, textTransform:"uppercase" }}>{h}</div>
                          ))}
                        </div>
                        {/* Table rows */}
                        {selectedProject.unitBreakdown.map((u, i) => (
                          <div key={i} style={{ display:"grid", gridTemplateColumns:"1fr 1.2fr 1.2fr 1fr 0.8fr 0.8fr 0.8fr", padding:"12px", borderBottom:i < selectedProject.unitBreakdown.length-1 ? `1px solid ${T.border}` : "none", background:i%2===0?"transparent":"rgba(255,255,255,0.01)", alignItems:"center" }}>
                            {/* Unit type */}
                            <div style={{ fontFamily:"'Fraunces',serif", fontSize:14, fontWeight:700, color:T.gold }}>{u.type}</div>
                            {/* Size range */}
                            <div>
                              <div style={{ fontSize:12, color:T.white, fontWeight:600 }}>{(u.sizeMin||0).toLocaleString()} – {(u.sizeMax||0).toLocaleString()}</div>
                              <div style={{ fontSize:10, color:T.textMuted }}>sqft</div>
                              {u.plotMin && <div style={{ fontSize:10, color:T.textMuted }}>Plot: {u.plotMin.toLocaleString()}–{(u.plotMax||0).toLocaleString()} sqft</div>}
                            </div>
                            {/* Price range */}
                            <div>
                              <div style={{ fontSize:12, color:T.white, fontWeight:600 }}>AED {(u.priceMin/1000000).toFixed(2)}M</div>
                              <div style={{ fontSize:10, color:T.textMuted }}>to AED {(u.priceMax/1000000).toFixed(2)}M</div>
                            </div>
                            {/* PPSF */}
                            <div>
                              <div style={{ fontSize:13, fontWeight:700, color:T.gold }}>AED {(u.ppsf||0).toLocaleString()}</div>
                              <div style={{ fontSize:10, color:T.textMuted }}>per sqft</div>
                            </div>
                            {/* Yield */}
                            <div style={{ fontSize:13, fontWeight:700, color:u.grossYield>=7?T.green:u.grossYield>=5?T.gold:T.textSecondary }}>
                              {u.grossYield?u.grossYield.toFixed(1)+"%":"—"}
                            </div>
                            {/* Available units */}
                            <div style={{ fontSize:13, fontWeight:600, color:u.available<=10?"#EF4444":u.available<=20?T.gold:T.green }}>
                              {u.available!=null?u.available+" units":"—"}
                            </div>
                            {/* Quick actions */}
                            <div style={{ display:"flex", gap:4 }}>
                              <button type="button" onClick={() => handleTabChange("Mortgage")} style={{ padding:"4px 8px", background:"rgba(212,168,67,0.08)", border:`1px solid ${T.border}`, borderRadius:6, color:T.gold, fontSize:9, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>Calc</button>
                            </div>
                          </div>
                        ))}
                        {/* Summary row */}
                        <div style={{ padding:"10px 12px", background:"rgba(212,168,67,0.06)", borderRadius:"0 0 8px 8px", borderTop:`1px solid rgba(212,168,67,0.2)`, display:"flex", gap:20, flexWrap:"wrap" }}>
                          <div style={{ fontSize:11, color:T.textMuted }}>
                            Total available: <span style={{ color:T.white, fontWeight:700 }}>{selectedProject.unitBreakdown.reduce((a,u)=>a+(u.available||0),0)} units</span>
                          </div>
                          <div style={{ fontSize:11, color:T.textMuted }}>
                            Price range: <span style={{ color:T.gold, fontWeight:700 }}>AED {(Math.min(...selectedProject.unitBreakdown.map(u=>u.priceMin))/1000000).toFixed(2)}M – AED {(Math.max(...selectedProject.unitBreakdown.map(u=>u.priceMax))/1000000).toFixed(2)}M</span>
                          </div>
                          <div style={{ fontSize:11, color:T.textMuted }}>
                            PPSF range: <span style={{ color:T.white, fontWeight:700 }}>AED {Math.min(...selectedProject.unitBreakdown.map(u=>u.ppsf||0)).toLocaleString()} – AED {Math.max(...selectedProject.unitBreakdown.map(u=>u.ppsf||0)).toLocaleString()}</span>
                          </div>
                          <div style={{ fontSize:11, color:T.textMuted }}>
                            Best yield: <span style={{ color:T.green, fontWeight:700 }}>{Math.max(...selectedProject.unitBreakdown.map(u=>u.grossYield||0)).toFixed(1)}%</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Fallback — no unitBreakdown yet */
                      <div className="chart-box" style={{ padding:20, marginBottom:16 }}>
                        <div style={{ fontSize:13, fontWeight:700, color:T.white, marginBottom:16 }}>Unit Types & Sizes</div>
                        {selectedProject.beds?.length > 0 ? (
                          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))", gap:12 }}>
                            {selectedProject.beds.map((bed,i) => (
                              <div key={i} style={{ padding:"14px", background:T.surfaceAlt, borderRadius:10, border:`1px solid ${T.border}` }}>
                                <div style={{ fontFamily:"'Fraunces',serif", fontSize:18, fontWeight:700, color:T.gold, marginBottom:8 }}>{bed}</div>
                                <div style={{ fontSize:12, color:T.textSecondary }}>Size: {(selectedProject.sizeMin||0).toLocaleString()} – {(selectedProject.sizeMax||0).toLocaleString()} sqft</div>
                                <div style={{ fontSize:12, color:T.textSecondary }}>PPSF: AED {(selectedProject.ppsf||0).toLocaleString()}</div>
                                {selectedProject.grossYield > 0 && <div style={{ fontSize:12, color:T.green, marginTop:6 }}>Yield: ~{selectedProject.grossYield.toFixed(1)}%</div>}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div style={{ fontSize:13, color:T.textSecondary }}>Size: {(selectedProject.sizeMin||0).toLocaleString()} – {(selectedProject.sizeMax||0).toLocaleString()} sqft · PPSF: AED {(selectedProject.ppsf||0).toLocaleString()}</div>
                        )}
                        <div style={{ marginTop:12, padding:"10px 14px", background:"rgba(212,168,67,0.06)", borderRadius:8, fontSize:11, color:T.textMuted }}>
                          Add unit breakdown from Admin → Data Manager → Projects → Unit Breakdown
                        </div>
                      </div>
                    )}
                    {/* Views */}
                    {selectedProject.view?.length > 0 && (
                      <div className="chart-box" style={{ padding:18 }}>
                        <div style={{ fontSize:11, fontWeight:700, color:T.textMuted, letterSpacing:0.8, textTransform:"uppercase", marginBottom:10 }}>Available Views</div>
                        <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                          {selectedProject.view.map((v,i) => <span key={i} style={{ fontSize:12, padding:"5px 14px", borderRadius:20, background:"rgba(212,168,67,0.08)", border:`1px solid rgba(212,168,67,0.2)`, color:T.gold }}>{v}</span>)}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {projDetailTab === "investment" && (
                  <div>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12, marginBottom:20 }}>
                      {[
                        { label:"Gross Yield", value:selectedProject.grossYield?selectedProject.grossYield.toFixed(1)+"%":"—", color:T.green, note:"Annual rent / purchase price" },
                        { label:"Net Yield", value:selectedProject.netYield?selectedProject.netYield.toFixed(1)+"%":"—", color:T.teal, note:"After service charges" },
                        { label:"Service Charge", value:selectedProject.serviceCharge?"AED "+selectedProject.serviceCharge+"/sqft/yr":"—", color:T.white, note:"Annual RERA rate" },
                        { label:"Investment Score", value:calcScore(selectedProject).toString(), color:scoreColor(calcScore(selectedProject)), note:scoreLabel(calcScore(selectedProject)) },
                        { label:"Developer Score", value:selectedProject.developerScore?selectedProject.developerScore+"/100":"—", color:T.gold, note:"Track record rating" },
                        { label:"Construction", value:selectedProject.constructionPct!=null?selectedProject.constructionPct+"%":"—", color:T.white, note:"Build progress" },
                      ].map((item,i) => (
                        <div key={i} className="kpi-card">
                          <div style={{ fontSize:10, fontWeight:700, color:T.textMuted, textTransform:"uppercase", letterSpacing:1, marginBottom:8 }}>{item.label}</div>
                          <div style={{ fontFamily:"'Fraunces',serif", fontSize:24, fontWeight:800, color:item.color, marginBottom:4 }}>{item.value}</div>
                          <div style={{ fontSize:11, color:T.textMuted }}>{item.note}</div>
                        </div>
                      ))}
                    </div>
                    <div className="chart-box" style={{ padding:18 }}>
                      <div style={{ fontSize:12, fontWeight:700, color:T.white, marginBottom:14 }}>Investment Score Breakdown — 7 Factors</div>
                      {[
                        { factor:"Yield vs Market Average", score:selectedProject.grossYield>=7?90:selectedProject.grossYield>=5?70:50, weight:"20%" },
                        { factor:"Location (Metro + DIFC)", score:selectedProject.distMetro<=1?95:selectedProject.distMetro<=3?75:55, weight:"20%" },
                        { factor:"Developer Track Record", score:selectedProject.developerScore||70, weight:"20%" },
                        { factor:"Price vs Community PPSF", score:74, weight:"15%" },
                        { factor:"Market Liquidity (DLD Volume)", score:80, weight:"10%" },
                        { factor:"Construction Progress", score:Math.min(95,40+(selectedProject.constructionPct||0)), weight:"10%" },
                        { factor:"2026 Supply Risk", score:68, weight:"5%" },
                      ].map((f,i) => (
                        <div key={i} style={{ marginBottom:12 }}>
                          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                            <span style={{ fontSize:12, color:T.textSecondary }}>{f.factor}</span>
                            <div style={{ display:"flex", gap:10 }}>
                              <span style={{ fontSize:10, color:T.textMuted }}>{f.weight}</span>
                              <span style={{ fontSize:12, fontWeight:700, color:f.score>=80?T.green:f.score>=60?T.gold:T.red }}>{f.score}/100</span>
                            </div>
                          </div>
                          <div style={{ height:4, borderRadius:2, background:T.border }}>
                            <div style={{ height:"100%", width:`${f.score}%`, borderRadius:2, background:f.score>=80?T.green:f.score>=60?T.gold:T.red }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {projDetailTab === "location" && (
                  <div>
                    <div className="chart-box" style={{ padding:20, marginBottom:16 }}>
                      <div style={{ fontSize:13, fontWeight:700, color:T.white, marginBottom:16 }}>Distance Intelligence</div>
                      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))", gap:10 }}>
                        {[
                          { label:"Metro Station", val:selectedProject.distMetro, warn:0.8 },
                          { label:"DIFC", val:selectedProject.distDIFC },
                          { label:"Airport (DXB)", val:selectedProject.distAirport },
                          { label:"Beach", val:selectedProject.distBeach, warn:2 },
                          { label:"Nearest Mall", val:selectedProject.distMall, warn:3 },
                          { label:"School", val:selectedProject.distSchool, warn:2 },
                          { label:"Hospital", val:selectedProject.distHospital, warn:5 },
                        ].map((d,i) => (
                          <div key={i} style={{ padding:"12px 14px", background:T.surfaceAlt, borderRadius:10, border:`1px solid ${d.warn&&d.val<=d.warn?"rgba(16,185,129,0.3)":T.border}`, textAlign:"center" }}>
                            <div style={{ fontSize:10, color:T.textMuted, marginBottom:6 }}>{d.label}</div>
                            <div style={{ fontFamily:"'Fraunces',serif", fontSize:18, fontWeight:700, color:d.warn&&d.val!=null&&d.val<=d.warn?T.green:T.white }}>
                              {d.val!=null ? (d.val<1?(d.val*1000).toFixed(0)+"m":d.val+"km") : "—"}
                            </div>
                            {d.warn && d.val!=null && d.val<=d.warn && <div style={{ fontSize:9, color:T.green, marginTop:2 }}>Excellent</div>}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="chart-box" style={{ padding:18 }}>
                      <div style={{ fontSize:12, color:T.textSecondary, lineHeight:1.8 }}>
                        <strong style={{ color:T.white }}>Community:</strong> {selectedProject.community} · <strong style={{ color:T.white }}>Developer:</strong> {selectedProject.developer}
                        {selectedProject.reraNo && <>{"·"}<strong style={{ color:T.gold }}>RERA:</strong> {selectedProject.reraNo}</>}
                        {selectedProject.escrowBank && <>{"·"}<strong style={{ color:T.teal }}>Escrow:</strong> {selectedProject.escrowBank}</>}
                      </div>
                    </div>
                  </div>
                )}
                {projDetailTab === "payment" && (
                  <div>
                    <div className="chart-box" style={{ padding:20, marginBottom:16 }}>
                      <div style={{ fontSize:13, fontWeight:700, color:T.white, marginBottom:16 }}>Payment Structure</div>
                      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12, marginBottom:16 }}>
                        <div className="kpi-card">
                          <div style={{ fontSize:10, fontWeight:700, color:T.textMuted, textTransform:"uppercase", letterSpacing:1, marginBottom:8 }}>Payment Plan</div>
                          <div style={{ fontFamily:"'Fraunces',serif", fontSize:28, fontWeight:800, color:T.gold }}>{selectedProject.paymentPlan||"—"}</div>
                        </div>
                        <div className="kpi-card">
                          <div style={{ fontSize:10, fontWeight:700, color:T.textMuted, textTransform:"uppercase", letterSpacing:1, marginBottom:8 }}>Post Handover</div>
                          <div style={{ fontFamily:"'Fraunces',serif", fontSize:28, fontWeight:800, color:selectedProject.postHandover?T.green:T.textMuted }}>{selectedProject.postHandover?"Yes":"No"}</div>
                        </div>
                        <div className="kpi-card">
                          <div style={{ fontSize:10, fontWeight:700, color:T.textMuted, textTransform:"uppercase", letterSpacing:1, marginBottom:8 }}>Escrow Bank</div>
                          <div style={{ fontSize:16, fontWeight:700, color:T.teal }}>{selectedProject.escrowBank||"—"}</div>
                        </div>
                      </div>
                      {selectedProject.paymentPlan && selectedProject.paymentPlan.includes("/") && !selectedProject.paymentPlan.includes("Cash") && (
                        <div>
                          <div style={{ display:"flex", gap:4, height:32, borderRadius:8, overflow:"hidden", marginBottom:12 }}>
                            <div style={{ width:`${parseInt(selectedProject.paymentPlan.split("/")[0])||60}%`, background:T.gold, display:"flex", alignItems:"center", justifyContent:"center" }}>
                              <span style={{ fontSize:11, fontWeight:700, color:"#000" }}>{parseInt(selectedProject.paymentPlan.split("/")[0])||60}% During</span>
                            </div>
                            <div style={{ width:`${parseInt(selectedProject.paymentPlan.split("/")[1])||40}%`, background:T.teal, display:"flex", alignItems:"center", justifyContent:"center" }}>
                              <span style={{ fontSize:11, fontWeight:700, color:"#fff" }}>{parseInt(selectedProject.paymentPlan.split("/")[1])||40}% Handover</span>
                            </div>
                          </div>
                          <div style={{ fontSize:12, color:T.textMuted, lineHeight:1.8 }}>
                            On AED {((selectedProject.priceMin||0)/1000000).toFixed(1)}M: Pay AED {((selectedProject.priceMin||0)*(parseInt(selectedProject.paymentPlan.split("/")[0])||60)/100/1000000).toFixed(2)}M during construction, AED {((selectedProject.priceMin||0)*(parseInt(selectedProject.paymentPlan.split("/")[1])||40)/100/1000000).toFixed(2)}M on handover.
                          </div>
                        </div>
                      )}
                    </div>
                    <div style={{ padding:"14px 16px", background:"rgba(212,168,67,0.06)", borderRadius:10, border:`1px solid rgba(212,168,67,0.2)` }}>
                      <div style={{ fontSize:12, color:T.textSecondary, lineHeight:1.8 }}>
                        <strong style={{ color:T.gold }}>Important:</strong> All off-plan payments must go to the DLD-registered escrow account ({selectedProject.escrowBank||"TBC"}). RERA registration: {selectedProject.reraNo||"verify with developer"}. Never pay cash directly.
                      </div>
                    </div>
                  </div>
                )}
                {projDetailTab === "dld" && (
                  <div className="chart-box" style={{ padding:20 }}>
                    <div style={{ fontSize:13, fontWeight:700, color:T.white, marginBottom:6 }}>DLD Transaction History</div>
                    <div style={{ fontSize:12, color:T.textMuted, marginBottom:20 }}>Community: {selectedProject.community}{"·"}{selectedProject.type}</div>
                    <div style={{ padding:"40px 24px", textAlign:"center", background:T.surfaceAlt, borderRadius:10 }}>
                      {SvgIcons.Database({ width:32, height:32, style:{ color:T.textMuted, marginBottom:12, display:"inline-block" } })}
                      <div style={{ fontSize:14, fontWeight:700, color:T.white, marginBottom:8 }}>DLD transaction data syncs daily</div>
                      <div style={{ fontSize:12, color:T.textMuted, marginBottom:16 }}>Connect DLD feed via Admin → Data Health</div>
                      <button type="button" onClick={() => { setSelectedProject(null); handleTabChange("DLD Volumes"); }} style={{ padding:"8px 18px", background:"rgba(212,168,67,0.1)", border:`1px solid ${T.border}`, borderRadius:8, color:T.gold, fontSize:12, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>View DLD Volumes →</button>
                    </div>
                  </div>
                )}
                {projDetailTab === "developer" && (
                  <div>
                    <div className="chart-box" style={{ padding:20, marginBottom:16 }}>
                      <div style={{ fontSize:13, fontWeight:700, color:T.white, marginBottom:16 }}>Developer Profile</div>
                      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12, marginBottom:16 }}>
                        <div className="kpi-card">
                          <div style={{ fontSize:10, fontWeight:700, color:T.textMuted, textTransform:"uppercase", letterSpacing:1, marginBottom:8 }}>Developer</div>
                          <div style={{ fontSize:16, fontWeight:700, color:T.white }}>{selectedProject.developer}</div>
                        </div>
                        <div className="kpi-card">
                          <div style={{ fontSize:10, fontWeight:700, color:T.textMuted, textTransform:"uppercase", letterSpacing:1, marginBottom:8 }}>Health Score</div>
                          <div style={{ fontFamily:"'Fraunces',serif", fontSize:28, fontWeight:800, color:scoreColor(selectedProject.developerScore||75) }}>{selectedProject.developerScore||"—"}</div>
                        </div>
                        <div className="kpi-card">
                          <div style={{ fontSize:10, fontWeight:700, color:T.textMuted, textTransform:"uppercase", letterSpacing:1, marginBottom:8 }}>RERA No</div>
                          <div style={{ fontSize:14, fontWeight:700, color:T.teal }}>{selectedProject.reraNo||"—"}</div>
                        </div>
                      </div>
                      <button type="button" onClick={() => { setSelectedProject(null); handleTabChange("Developer Health"); }} style={{ padding:"8px 18px", background:"rgba(212,168,67,0.1)", border:`1px solid ${T.border}`, borderRadius:8, color:T.gold, fontSize:12, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>Full Developer Profile →</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          
      , document.body)}
    </>
  );
}

export default ProjectsTab;
