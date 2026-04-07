/* eslint-disable */
/* ═══════════════════════════════════════════════════════════════════
   DXB ANALYTICS — TEAM TAB
   Agency team members management
   ═══════════════════════════════════════════════════════════════════ */

import React from "react";
import { T } from "../data";
import { SvgIcons } from "../components/Icons";

function TeamTab({ teamMembers, teamMembersLoading, myLeads, deals, orgRole }) {

            const isManager = orgRole === "manager";
            if (!isManager) return (
              <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"80px 20px", textAlign:"center" }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={T.textMuted} strokeWidth="1.5" strokeLinecap="round" style={{ marginBottom:16 }}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                <div style={{ fontSize:16, fontWeight:700, color:T.textPrimary, marginBottom:6 }}>Manager access only</div>
                <div style={{ fontSize:12, color:T.textMuted }}>Contact your administrator to request manager access</div>
              </div>
            );

            // ── Derived metrics ──────────────────────────────────────────

            const agents = teamMembers.filter(u => u.orgRole === "agent");
            const now = new Date();
            const todayStart = new Date(now.setHours(0,0,0,0));
            const weekAgo = new Date(Date.now() - 7*24*60*60*1000);

            // Per-agent stats
            const agentStats = agents.map(agent => {
              const agentLeads = myLeads.filter(l => l.assignedTo === agent.uid);
              const agentDeals = deals.filter(d => d.agentId === agent.uid);
              const closedDeals = agentDeals.filter(d => d.stage === "Completed");
              const totalValue  = agentDeals.reduce((a,d) => a + (parseFloat(d.price)||0), 0);
              const totalComm   = closedDeals.reduce((a,d) => a + (parseFloat(d.commission)||0), 0);
              const conversion  = agentLeads.length > 0 ? ((closedDeals.length / agentLeads.length)*100).toFixed(1) : "0.0";
              const newThisWeek = agentLeads.filter(l => new Date(l.createdAt) >= weekAgo).length;
              const overdue     = agentLeads.filter(l => {
                if (!l.updatedAt) return true;
                return (now - new Date(l.updatedAt)) > 3*24*60*60*1000 && (l.status === "New" || l.status === "Contacted");
              }).length;
              return { ...agent, agentLeads, agentDeals, closedDeals, totalValue, totalComm, conversion, newThisWeek, overdue };
            }).sort((a,b) => b.closedDeals.length - a.closedDeals.length);

            // Team totals
            const teamLeads    = myLeads.length;
            const teamDeals    = deals.length;
            const teamClosed   = deals.filter(d => d.stage === "Completed").length;
            const teamValue    = deals.reduce((a,d) => a + (parseFloat(d.price)||0), 0);
            const teamComm     = deals.filter(d=>d.stage==="Completed").reduce((a,d) => a + (parseFloat(d.commission)||0), 0);
            const teamOverdue  = myLeads.filter(l => {
              if (!l.updatedAt) return true;
              return (Date.now() - new Date(l.updatedAt)) > 3*24*60*60*1000 && (l.status==="New"||l.status==="Contacted");
            });

            // Source ROI
            const SOURCE_COLORS = { "Property Finder":"#00C08B","Bayut":"#FF6B35","Dubizzle":"#E8003D","Meta/Facebook":"#1877F2","Instagram":"#E1306C","WhatsApp":"#25D366","Google Ads":"#4285F4","Referral":"#8B5CF6","Website":"#14B8A6","Manual":"#94A3B8","Cold Call":"#F59E0B","Email":"#6366F1" };
            const sourceStats = [...new Set(myLeads.map(l=>l.source).filter(Boolean))].map(src => {
              const srcLeads  = myLeads.filter(l => l.source === src);
              const srcDeals  = deals.filter(d => srcLeads.some(l => l.assignedTo === d.agentId));
              const closed    = srcDeals.filter(d => d.stage === "Completed").length;
              const convRate  = srcLeads.length > 0 ? ((closed/srcLeads.length)*100).toFixed(1) : "0.0";
              return { src, leads:srcLeads.length, closed, convRate, color: SOURCE_COLORS[src]||T.textMuted };
            }).sort((a,b) => parseFloat(b.convRate) - parseFloat(a.convRate));

            // Pipeline funnel
            const FUNNEL_STAGES = ["New","Contacted","Viewing","Offer","Won","Lost"];
            const funnelData = FUNNEL_STAGES.map(s => ({
              stage: s,
              count: myLeads.filter(l => (l.status||"New") === s).length,
            }));
            const funnelMax = Math.max(...funnelData.map(f => f.count), 1);

            const STAGE_COLORS = { New:"#3B82F6",Contacted:"#F59E0B",Viewing:"#8B5CF6",Offer:"#14B8A6",Won:"#10B981",Lost:"#EF4444" };

            return (<>

              {/* ── Header ── */}
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20, flexWrap:"wrap", gap:12 }}>
                <div>
                  <h1 style={{ fontFamily:"'Fraunces',serif", fontSize:22, fontWeight:900, color:T.white, margin:0 }}>Team Dashboard</h1>
                  <p style={{ fontSize:12, color:T.textMuted, margin:"4px 0 0" }}>
                    {agents.length} agents · {teamLeads} leads · {teamDeals} deals · Live Firestore
                  </p>
                </div>
              </div>

              {/* ── Team KPI Bar ── */}
              <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:10, marginBottom:20 }}>
                {[
                  { label:"Total Leads",    value:teamLeads,   color:T.gold,    icon:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg> },
                  { label:"Active Deals",   value:teamDeals-teamClosed, color:T.teal,  icon:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="3" width="4" height="18" rx="1"/><rect x="10" y="3" width="4" height="12" rx="1"/><rect x="17" y="3" width="4" height="15" rx="1"/></svg> },
                  { label:"Deals Closed",   value:teamClosed,  color:"#10B981", icon:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg> },
                  { label:"Pipeline Value", value:`AED ${teamValue>=1e6?(teamValue/1e6).toFixed(1)+"M":teamValue.toLocaleString()}`, color:"#8B5CF6", icon:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> },
                  { label:"Overdue",        value:teamOverdue.length, color:teamOverdue.length>0?T.red:T.green, icon:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> },
                ].map((k,i) => (
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

              {/* ── Main grid: Leaderboard + Funnel ── */}
              <div style={{ display:"grid", gridTemplateColumns:"minmax(0,1fr) min(340px,38%)", gap:16, marginBottom:16, alignItems:"start" }}>

                {/* ── AI Hot Leads Panel (Session 13) ── */}
                {(() => {
                  const hotLeads = myLeads
                    .map(l => ({ ...l, aiScore: (() => { const b = parseFloat(l.budget)||0; const age = (Date.now()-new Date(l.createdAt||Date.now()))/86400000; let s=0; if(l.phone&&l.email)s+=25; if(b>=5000000)s+=20;else if(b>=2000000)s+=16;else if(b>0)s+=10; const src={"Property Finder":15,"Bayut":14,"Referral":15,"WhatsApp":10}; s+=(src[l.source]||6); if(age<1)s+=20;else if(age<3)s+=15;else if(age<7)s+=10; return Math.min(100,s); })() }))
                    .filter(l => l.aiScore >= 60 && l.status !== "Won" && l.status !== "Lost" && !l.assignedTo === false)
                    .sort((a,b) => b.aiScore - a.aiScore)
                    .slice(0, 5);
                  if (hotLeads.length === 0) return null;
                  return (
                    <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:14, overflow:"hidden", marginBottom:16 }}>
                      <div style={{ padding:"12px 18px", borderBottom:`1px solid ${T.border}`, display:"flex", alignItems:"center", gap:10 }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={T.gold} strokeWidth="2" strokeLinecap="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                        <div style={{ fontSize:12, fontWeight:700, color:T.white }}>AI Hot Leads — Act Now</div>
                        <div style={{ marginLeft:"auto", fontSize:10, color:T.textMuted }}>Score ≥ 60 · Highest priority</div>
                      </div>
                      <div style={{ display:"flex", flexDirection:"column" }}>
                        {hotLeads.map((l,i)=>{
                          const agent = teamMembers.find(u=>u.uid===l.assignedTo);
                          const name = (l.name||"").trim()||l.phone||"Unnamed";
                          const scoreColor = l.aiScore>=80?"#10B981":T.gold;
                          return (
                            <div key={l.id||i} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 18px", borderBottom:i<hotLeads.length-1?`1px solid ${T.border}`:"none" }}>
                              <div style={{ display:"flex", alignItems:"center", gap:10, flex:1, minWidth:0 }}>
                                <div style={{ width:32, height:32, borderRadius:"50%", background:`${scoreColor}18`, border:`2px solid ${scoreColor}40`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:900, color:scoreColor, flexShrink:0 }}>{l.aiScore}</div>
                                <div style={{ minWidth:0 }}>
                                  <div style={{ fontSize:12, fontWeight:600, color:T.textPrimary, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{name}</div>
                                  <div style={{ fontSize:10, color:T.textMuted }}>{agent?(agent.name||agent.email?.split("@")[0]):"Unassigned"}{"·"}{l.source||"No source"}</div>
                                </div>
                              </div>
                              <div style={{ display:"flex", alignItems:"center", gap:6, flexShrink:0 }}>
                                {l.budget>0&&<span style={{ fontSize:10, color:T.gold }}>AED {(parseFloat(l.budget)/1e6).toFixed(1)}M</span>}
                                {l.phone&&<a href={`https://wa.me/${cleanPhone(l.phone)}`} target="_blank" rel="noopener noreferrer" style={{ display:"flex", alignItems:"center", justifyContent:"center", width:26, height:26, borderRadius:5, border:"1px solid rgba(37,211,102,0.3)", background:"rgba(37,211,102,0.08)", color:"#25D366", textDecoration:"none" }}><svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg></a>}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

                {/* ── Agent Leaderboard ── */}
                <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:14, overflow:"hidden" }}>
                  <div style={{ padding:"14px 18px", borderBottom:`1px solid ${T.border}`, display:"flex", alignItems:"center", gap:10 }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={T.gold} strokeWidth="2" strokeLinecap="round"><polyline points="18 20 18 10"/><polyline points="12 20 12 4"/><polyline points="6 20 6 14"/></svg>
                    <div style={{ fontSize:13, fontWeight:700, color:T.white }}>Agent Leaderboard</div>
                    <div style={{ marginLeft:"auto", fontSize:10, color:T.textMuted }}>{agents.length} agents</div>
                  </div>

                  {/* Column headers */}
                  <div style={{ overflowX:"auto", WebkitOverflowScrolling:"touch" }}>
                  <div style={{ display:"grid", gridTemplateColumns:"32px minmax(100px,1fr) 70px 70px 80px 90px 70px", minWidth:520, gap:8, padding:"8px 16px", fontSize:9, fontWeight:700, color:T.textMuted, textTransform:"uppercase", letterSpacing:0.8, borderBottom:`1px solid ${T.border}` }}>
                    <div>#</div><div>Agent</div><div>Leads</div><div>Deals</div><div>Closed</div><div>Pipeline</div><div>Conv %</div>
                  </div>

                  {teamMembersLoading ? (
                    <div style={{ padding:"40px", textAlign:"center", color:T.textMuted, fontSize:12 }}>Loading team...</div>
                  ) : agentStats.length === 0 ? (
                    <div style={{ padding:"40px", textAlign:"center" }}>
                      <div style={{ fontSize:13, color:T.textMuted }}>No agents in this organisation yet</div>
                      <div style={{ fontSize:11, color:T.textMuted, marginTop:4 }}>Assign agents via Admin → Users → set orgRole=agent</div>
                    </div>
                  ) : agentStats.map((agent, i) => {
                    const rankColor = i===0?T.gold : i===1?"#94A3B8" : i===2?"#B45309" : T.textMuted;
                    return (
                      <div key={agent.uid} style={{ display:"grid", gridTemplateColumns:"32px minmax(100px,1fr) 70px 70px 80px 90px 70px", gap:8, padding:"12px 16px", alignItems:"center", borderBottom:`1px solid ${T.border}`, background:i%2===0?"transparent":"rgba(255,255,255,0.01)" }}>
                        {/* Rank */}
                        <div style={{ fontSize:12, fontWeight:700, color:rankColor, textAlign:"center" }}>
                          {i===0 ? <svg width="14" height="14" viewBox="0 0 24 24" fill={T.gold} stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> : i+1}
                        </div>
                        {/* Agent info */}
                        <div style={{ display:"flex", alignItems:"center", gap:8, minWidth:0 }}>
                          <div style={{ width:28, height:28, borderRadius:"50%", background:`rgba(212,168,67,0.12)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, fontWeight:700, color:T.gold, flexShrink:0 }}>
                            {(agent.name||agent.email||"?").slice(0,2).toUpperCase()}
                          </div>
                          <div style={{ minWidth:0 }}>
                            <div style={{ fontSize:12, fontWeight:600, color:T.textPrimary, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{agent.name||agent.email?.split("@")[0]||"Agent"}</div>
                            {agent.overdue > 0 && <div style={{ fontSize:9, color:T.red, fontWeight:600 }}>{agent.overdue} overdue</div>}
                          </div>
                        </div>
                        {/* Leads */}
                        <div style={{ fontSize:12, fontWeight:600, color:T.textPrimary, textAlign:"center" }}>{agent.agentLeads.length}</div>
                        {/* Deals */}
                        <div style={{ fontSize:12, fontWeight:600, color:T.textPrimary, textAlign:"center" }}>{agent.agentDeals.length}</div>
                        {/* Closed */}
                        <div style={{ textAlign:"center" }}>
                          <span style={{ fontSize:11, fontWeight:700, padding:"2px 8px", borderRadius:5, background:agent.closedDeals.length>0?"rgba(16,185,129,0.1)":T.surfaceAlt, color:agent.closedDeals.length>0?"#10B981":T.textMuted }}>
                            {agent.closedDeals.length}
                          </span>
                        </div>
                        {/* Pipeline value */}
                        <div style={{ fontSize:11, fontWeight:600, color:agent.totalValue>0?T.gold:T.textMuted, textAlign:"center" }}>
                          {agent.totalValue>0 ? `AED ${(agent.totalValue/1e6).toFixed(1)}M` : "—"}
                        </div>
                        {/* Conversion */}
                        <div style={{ textAlign:"center" }}>
                          <span style={{ fontSize:11, fontWeight:700, color:parseFloat(agent.conversion)>5?"#10B981":parseFloat(agent.conversion)>0?T.gold:T.textMuted }}>
                            {agent.conversion}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  </div>
                </div>

                {/* ── Pipeline Funnel ── */}
                <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:14, overflow:"hidden" }}>
                  <div style={{ padding:"14px 18px", borderBottom:`1px solid ${T.border}`, display:"flex", alignItems:"center", gap:10 }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={T.teal} strokeWidth="2" strokeLinecap="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
                    <div style={{ fontSize:13, fontWeight:700, color:T.white }}>Team Pipeline Funnel</div>
                  </div>
                  <div style={{ padding:"16px 18px", display:"flex", flexDirection:"column", gap:8 }}>
                    {funnelData.map(({stage,count}) => (
                      <div key={stage}>
                        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                          <span style={{ fontSize:11, fontWeight:600, color:STAGE_COLORS[stage]||T.textMuted }}>{stage}</span>
                          <span style={{ fontSize:11, fontWeight:700, color:T.textPrimary }}>{count}</span>
                        </div>
                        <div style={{ height:8, background:T.surfaceAlt, borderRadius:4, overflow:"hidden" }}>
                          <div style={{ height:"100%", width:`${(count/funnelMax)*100}%`, background:STAGE_COLORS[stage]||T.textMuted, borderRadius:4, transition:"width 0.4s ease" }}/>
                        </div>
                      </div>
                    ))}
                    <div style={{ marginTop:8, padding:"10px 12px", background:T.surfaceAlt, borderRadius:8 }}>
                      <div style={{ fontSize:10, color:T.textMuted, marginBottom:2 }}>Overall Conversion</div>
                      <div style={{ fontSize:18, fontWeight:900, color:T.gold, fontFamily:"'Fraunces',serif" }}>
                        {teamLeads > 0 ? ((teamClosed/teamLeads)*100).toFixed(1) : "0.0"}%
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Bottom row: Source ROI + Overdue ── */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>

                {/* Source ROI */}
                <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:14, overflow:"hidden" }}>
                  <div style={{ padding:"14px 18px", borderBottom:`1px solid ${T.border}`, display:"flex", alignItems:"center", gap:10 }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
                    <div style={{ fontSize:13, fontWeight:700, color:T.white }}>Source ROI</div>
                    <div style={{ marginLeft:"auto", fontSize:10, color:T.textMuted }}>By conversion rate</div>
                  </div>
                  <div style={{ padding:"0 0 8px" }}>
                    {/* Headers */}
                    <div style={{ display:"grid", gridTemplateColumns:"minmax(100px,1fr) 60px 60px 70px", gap:8, padding:"8px 16px", fontSize:9, fontWeight:700, color:T.textMuted, textTransform:"uppercase", letterSpacing:0.8, borderBottom:`1px solid ${T.border}` }}>
                      <div>Source</div><div style={{ textAlign:"center" }}>Leads</div><div style={{ textAlign:"center" }}>Closed</div><div style={{ textAlign:"right" }}>Conv %</div>
                    </div>
                    {sourceStats.length === 0 ? (
                      <div style={{ padding:"24px 16px", textAlign:"center", fontSize:12, color:T.textMuted }}>No source data yet</div>
                    ) : sourceStats.map(({src,leads,closed,convRate,color},i) => (
                      <div key={src} style={{ display:"grid", gridTemplateColumns:"minmax(100px,1fr) 60px 60px 70px", gap:8, padding:"10px 16px", alignItems:"center", borderBottom:`1px solid ${T.border}`, background:i%2===0?"transparent":"rgba(255,255,255,0.01)" }}>
                        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                          <div style={{ width:8, height:8, borderRadius:"50%", background:color, flexShrink:0 }}/>
                          <span style={{ fontSize:11, fontWeight:600, color:T.textPrimary, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{src}</span>
                        </div>
                        <div style={{ fontSize:11, fontWeight:600, color:T.textPrimary, textAlign:"center" }}>{leads}</div>
                        <div style={{ fontSize:11, fontWeight:600, color:closed>0?"#10B981":T.textMuted, textAlign:"center" }}>{closed}</div>
                        <div style={{ textAlign:"right" }}>
                          <span style={{ fontSize:11, fontWeight:700, color:parseFloat(convRate)>5?"#10B981":parseFloat(convRate)>0?T.gold:T.textMuted }}>
                            {convRate}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Overdue Follow-ups */}
                <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:14, overflow:"hidden" }}>
                  <div style={{ padding:"14px 18px", borderBottom:`1px solid ${T.border}`, display:"flex", alignItems:"center", gap:10 }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={T.red} strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    <div style={{ fontSize:13, fontWeight:700, color:T.white }}>Overdue Follow-ups</div>
                    {teamOverdue.length > 0 && (
                      <span style={{ marginLeft:"auto", fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:10, background:"rgba(239,68,68,0.12)", color:T.red }}>
                        {teamOverdue.length} overdue
                      </span>
                    )}
                  </div>
                  <div style={{ maxHeight:320, overflowY:"auto" }}>
                    {teamOverdue.length === 0 ? (
                      <div style={{ padding:"40px 20px", textAlign:"center" }}>
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={T.green} strokeWidth="1.5" strokeLinecap="round" style={{ marginBottom:10 }}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                        <div style={{ fontSize:13, fontWeight:600, color:T.green }}>All caught up</div>
                        <div style={{ fontSize:11, color:T.textMuted, marginTop:4 }}>No overdue follow-ups</div>
                      </div>
                    ) : teamOverdue.map((l,i) => {
                      const daysSince = l.updatedAt ? Math.floor((Date.now()-new Date(l.updatedAt))/(1000*60*60*24)) : "?";
                      const agent = teamMembers.find(u => u.uid === l.assignedTo);
                      const name = (l.name||"").trim() || l.phone || "Unnamed";
                      return (
                        <div key={l.id||i} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"11px 18px", borderBottom:`1px solid ${T.border}` }}>
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ fontSize:12, fontWeight:600, color:T.textPrimary, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{name}</div>
                            <div style={{ fontSize:10, color:T.textMuted, marginTop:2 }}>
                              {agent ? (agent.name||agent.email?.split("@")[0]||"Agent") : "Unassigned"}
                              {l.source ? ` · ${l.source}` : ""}
                            </div>
                          </div>
                          <div style={{ display:"flex", alignItems:"center", gap:8, flexShrink:0 }}>
                            <span style={{ fontSize:10, fontWeight:700, padding:"3px 8px", borderRadius:5, background:"rgba(239,68,68,0.1)", color:T.red }}>
                              {daysSince}d ago
                            </span>
                            {l.phone && (
                              <a href={`https://wa.me/${cleanPhone(l.phone)}`} target="_blank" rel="noopener noreferrer"
                                style={{ display:"flex", alignItems:"center", justifyContent:"center", width:28, height:28, borderRadius:6, border:"1px solid rgba(37,211,102,0.3)", background:"rgba(37,211,102,0.08)", color:"#25D366", textDecoration:"none" }}>
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>
                              </a>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
              </div>
            </>);
}

export default TeamTab;
