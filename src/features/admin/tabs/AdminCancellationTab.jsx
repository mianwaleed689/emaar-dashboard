import React, { useState, useEffect, useRef, useCallback } from "react";
import { collection, getDocs, doc, getDoc, setDoc, deleteDoc, query, orderBy, limit, where, addDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "../../../firebase";
import { BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";

function AdminCancellationTab({ users, auditLog, T, I, notify, db, timeSince, logAudit, setTab, setPendingOpenUid, exportCSV }) {
  // ── Computed stats ────────────────────────────────────────────────
  const now = new Date();
  const msPerDay = 86400000;
  const msPerWeek = msPerDay * 7;
  const todayStr = now.toDateString();
  const stats = {
    total: users.length,
    pro: users.filter(u => u.tier === "pro").length,
    enterprise: users.filter(u => u.tier === "enterprise").length,
    proTrial: users.filter(u => u.tier === "pro_trial" && (!u.trialEnd || new Date(u.trialEnd) > now)).length,
    free: users.filter(u => u.tier === "free" || !u.tier).length,
    expired: users.filter(u => u.tier === "pro_trial" && u.trialEnd && new Date(u.trialEnd) <= now).length,
    thisWeek: users.filter(u => { try { return (now - new Date(u.createdAt)) < msPerWeek; } catch { return false; } }).length,
    thisMonth: users.filter(u => { try { const d = new Date(u.createdAt); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); } catch { return false; } }).length,
    activeToday: users.filter(u => u.lastLoginAt && (now - new Date(u.lastLoginAt)) < msPerDay).length,
  };
  stats.paid = stats.pro + stats.enterprise;
  const mrr = (stats.pro * 99) + (stats.enterprise * 499);
  const arr = mrr * 12;
  const everTrialled = stats.proTrial + stats.pro + stats.expired;
  const churnEvents = (auditLog || []).filter(l => l.action === "tier_change" && (l.from === "pro" || l.from === "enterprise") && (l.to === "free" || l.to === "pro_trial"));
  const churnThisMonth = churnEvents.filter(l => { try { const d = new Date(l.changedAt); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); } catch { return false; } });
  const churnedMRR = churnThisMonth.reduce((s, l) => s + (l.from === "enterprise" ? 499 : 99), 0);
  // ─────────────────────────────────────────────────────────────────
            /* ═══════════════════════════════════════════════════════════════════
               TAB 13: CANCELLATION INSIGHTS — PRO LEVEL
               Exit surveys, reason charts, win-back campaigns, churn analysis
               Collections: cancellations, winbackCampaigns
            ═══════════════════════════════════════════════════════════════════ */
            
            // Simulated cancellation data (would come from Firestore)
            const cancellations = users.filter(u => u.cancelledAt || u.status === "cancelled" || u.tier === "cancelled");
            const churned = users.filter(u => {
              if (u.tier === "free" && u.previousTier && u.previousTier !== "free") return true;
              if (u.cancelledAt) return true;
              return false;
            });
            
            // Compute stats
            // now already defined above
            const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);
            
            const churnedThisMonth = churned.filter(u => {
              const d = new Date(u.cancelledAt || u.updatedAt || 0);
              return d >= thisMonth;
            }).length;
            const churnedLastMonth = churned.filter(u => {
              const d = new Date(u.cancelledAt || u.updatedAt || 0);
              return d >= lastMonth && d < thisMonth;
            }).length;
            
            const totalPaid = users.filter(u => ["pro", "enterprise", "pro_trial"].includes(u.tier)).length;
            const churnRate = totalPaid > 0 ? ((churnedThisMonth / totalPaid) * 100).toFixed(1) : 0;
            
            // Cancellation reasons (simulated - would come from exit surveys)
            const reasons = [
              { reason: "Too expensive", count: 12, percent: 28, color: T.red },
              { reason: "Not using enough", count: 9, percent: 21, color: T.orange },
              { reason: "Missing features", count: 8, percent: 19, color: T.purple },
              { reason: "Found alternative", count: 6, percent: 14, color: T.blue },
              { reason: "Technical issues", count: 4, percent: 9, color: T.teal },
              { reason: "Other", count: 4, percent: 9, color: T.textMuted },
            ];
            const totalCancellations = reasons.reduce((sum, r) => sum + r.count, 0);
            
            // Win-back campaigns (simulated)
            const winbackCampaigns = [
              { id: 1, name: "20% Comeback Offer", status: "active", sent: 45, opened: 28, converted: 5, revenue: 2475 },
              { id: 2, name: "Free Month Trial", status: "active", sent: 32, opened: 18, converted: 3, revenue: 891 },
              { id: 3, name: "Feature Update Alert", status: "paused", sent: 67, opened: 41, converted: 7, revenue: 3465 },
            ];
            
            // Monthly churn trend (simulated)
            const churnTrend = [
              { month: "Oct", churned: 3, recovered: 1 },
              { month: "Nov", churned: 5, recovered: 2 },
              { month: "Dec", churned: 4, recovered: 1 },
              { month: "Jan", churned: 6, recovered: 3 },
              { month: "Feb", churned: 4, recovered: 2 },
              { month: "Mar", churned: churnedThisMonth || 2, recovered: 1 },
            ];
            
            // At-risk users (no login in 14+ days, paid tier)
            const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
            const atRiskUsers = users.filter(u => {
              if (!["pro", "enterprise"].includes(u.tier)) return false;
              if (!u.lastLoginAt) return true;
              return new Date(u.lastLoginAt) < fourteenDaysAgo;
            });
            

  return (
            
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {/* KPI TOPBAR */}
                <div className="fade-up" style={{ display: "flex", alignItems: "center", gap: 0, borderRadius: 14, background: T.surface, border: `1px solid ${T.border}`, overflow: "hidden" }}>
                  <button type="button" onClick={() => notify("Cancellation data refreshed")} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, padding: "14px 16px", background: T.goldGlow, border: "none", borderRight: `1px solid ${T.border}`, color: T.gold, cursor: "pointer", fontFamily: "'Outfit',sans-serif", fontWeight: 600, flexShrink: 0 }}>{I.refresh}</button>
                  {[
                    { label: "Churned This Month", value: churnedThisMonth, color: T.red },
                    { label: "Churn Rate", value: `${churnRate}%`, color: parseFloat(churnRate) > 5 ? T.red : T.green },
                    { label: "At Risk", value: atRiskUsers.length, color: atRiskUsers.length > 5 ? T.orange : T.green },
                    { label: "Total Churned", value: churned.length, color: T.textSecondary },
                    { label: "Recovered", value: winbackCampaigns.reduce((s, c) => s + c.converted, 0), color: T.green },
                    { label: "Recovery Revenue", value: `AED ${winbackCampaigns.reduce((s, c) => s + c.revenue, 0).toLocaleString()}`, color: T.gold },
                  ].map((item, i) => (
                    <div key={i} style={{ display: "flex", flexDirection: "column", padding: "10px 18px", borderRight: `1px solid ${T.border}`, flexShrink: 0 }}>
                      <span style={{ fontSize: 9, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: 1 }}>{item.label}</span>
                      <span style={{ fontSize: 18, fontWeight: 900, color: item.color, fontFamily: "'Fraunces',serif", lineHeight: 1.2 }}>{item.value}</span>
                    </div>
                  ))}
                </div>

                {/* Main Grid */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                  {/* Cancellation Reasons Chart */}
                  <div style={{ background: T.surface, borderRadius: 14, border: `1px solid ${T.border}`, padding: 20 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: T.white, marginBottom: 4 }}>Cancellation Reasons</div>
                    <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 20 }}>{totalCancellations} responses from exit surveys</div>
                    
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      {reasons.map((r, i) => (
                        <div key={i}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                            <span style={{ fontSize: 12, color: T.white }}>{r.reason}</span>
                            <span style={{ fontSize: 12, fontWeight: 600, color: r.color }}>{r.count} ({r.percent}%)</span>
                          </div>
                          <div style={{ height: 8, background: T.surfaceAlt, borderRadius: 4, overflow: "hidden" }}>
                            <div style={{ width: `${r.percent}%`, height: "100%", background: r.color, borderRadius: 4, transition: "width 0.5s ease" }} />
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div style={{ marginTop: 20, padding: "12px 16px", background: T.surfaceAlt, borderRadius: 10, border: `1px solid ${T.border}` }}>
                      <div style={{ fontSize: 10, color: T.textMuted, marginBottom: 6 }}>TOP INSIGHT</div>
                      <div style={{ fontSize: 13, color: T.white }}>≡ƒÆí <strong style={{ color: T.gold }}>28%</strong> cite pricing — consider a downgrade option or annual discount</div>
                    </div>
                  </div>

                  {/* Monthly Churn Trend */}
                  <div style={{ background: T.surface, borderRadius: 14, border: `1px solid ${T.border}`, padding: 20 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: T.white, marginBottom: 4 }}>Churn vs Recovery Trend</div>
                    <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 20 }}>Last 6 months</div>
                    
                    <div style={{ display: "flex", alignItems: "flex-end", gap: 16, height: 160 }}>
                      {churnTrend.map((m, i) => {
                        const maxVal = Math.max(...churnTrend.map(x => x.churned));
                        const churnHeight = (m.churned / maxVal) * 120;
                        const recoverHeight = (m.recovered / maxVal) * 120;
                        return (
                          <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                            <div style={{ display: "flex", gap: 2, alignItems: "flex-end", height: 120 }}>
                              <div style={{ width: 16, height: churnHeight, background: T.red, borderRadius: "4px 4px 0 0", opacity: 0.8 }} title={`Churned: ${m.churned}`} />
                              <div style={{ width: 16, height: recoverHeight, background: T.green, borderRadius: "4px 4px 0 0", opacity: 0.8 }} title={`Recovered: ${m.recovered}`} />
                            </div>
                            <div style={{ fontSize: 10, color: T.textMuted }}>{m.month}</div>
                          </div>
                        );
                      })}
                    </div>
                    
                    <div style={{ display: "flex", gap: 20, marginTop: 16 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <div style={{ width: 12, height: 12, background: T.red, borderRadius: 3 }} />
                        <span style={{ fontSize: 11, color: T.textMuted }}>Churned</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <div style={{ width: 12, height: 12, background: T.green, borderRadius: 3 }} />
                        <span style={{ fontSize: 11, color: T.textMuted }}>Recovered</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Win-back Campaigns */}
                <div style={{ background: T.surface, borderRadius: 14, border: `1px solid ${T.border}`, overflow: "hidden" }}>
                  <div style={{ padding: "16px 20px", borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: T.white }}>Win-back Campaigns</div>
                      <div style={{ fontSize: 11, color: T.textMuted }}>{winbackCampaigns.length} campaigns · {winbackCampaigns.reduce((s, c) => s + c.converted, 0)} users recovered</div>
                    </div>
                    <button type="button" onClick={() => notify("Campaign creation coming soon")} style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: T.gold, color: T.bg, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>+ New Campaign</button>
                  </div>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: T.surfaceAlt }}>
                        {["Campaign", "Status", "Sent", "Opened", "Converted", "Revenue", "Actions"].map(h => (
                          <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {winbackCampaigns.map(c => (
                        <tr key={c.id} style={{ borderBottom: `1px solid ${T.border}` }}>
                          <td style={{ padding: "12px 14px", fontSize: 13, fontWeight: 600, color: T.white }}>{c.name}</td>
                          <td style={{ padding: "12px 14px" }}>
                            <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 6, background: c.status === "active" ? `${T.green}20` : `${T.orange}20`, color: c.status === "active" ? T.green : T.orange, fontWeight: 600, textTransform: "uppercase" }}>{c.status}</span>
                          </td>
                          <td style={{ padding: "12px 14px", fontSize: 12, color: T.textSecondary }}>{c.sent}</td>
                          <td style={{ padding: "12px 14px", fontSize: 12, color: T.textSecondary }}>{c.opened} ({Math.round((c.opened / c.sent) * 100)}%)</td>
                          <td style={{ padding: "12px 14px", fontSize: 12, fontWeight: 600, color: T.green }}>{c.converted}</td>
                          <td style={{ padding: "12px 14px", fontSize: 12, fontWeight: 700, color: T.gold }}>AED {c.revenue.toLocaleString()}</td>
                          <td style={{ padding: "12px 14px" }}>
                            <div style={{ display: "flex", gap: 6 }}>
                              <button type="button" onClick={() => notify(c.status === "active" ? "Campaign paused" : "Campaign resumed")} style={{ fontSize: 10, padding: "4px 8px", borderRadius: 6, border: `1px solid ${T.border}`, background: "transparent", color: T.textMuted, cursor: "pointer" }}>{c.status === "active" ? "Pause" : "Resume"}</button>
                              <button type="button" onClick={() => notify("Edit campaign")} style={{ fontSize: 10, padding: "4px 8px", borderRadius: 6, border: `1px solid ${T.gold}`, background: "transparent", color: T.gold, cursor: "pointer" }}>Edit</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* At-Risk Users */}
                <div style={{ background: T.surface, borderRadius: 14, border: `1px solid ${T.border}`, overflow: "hidden" }}>
                  <div style={{ padding: "16px 20px", borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: T.white }}>At-Risk Users</div>
                      <div style={{ fontSize: 11, color: T.textMuted }}>Paid users with no login in 14+ days</div>
                    </div>
                    {atRiskUsers.length > 0 && (
                      <button type="button" onClick={() => notify("Win-back email sent to all at-risk users")} style={{ padding: "8px 16px", borderRadius: 8, border: `1px solid ${T.orange}`, background: `${T.orange}10`, color: T.orange, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>Send Win-back to All ({atRiskUsers.length})</button>
                    )}
                  </div>
                  {atRiskUsers.length === 0 ? (
                    <div style={{ padding: 40, textAlign: "center", color: T.textMuted }}>
                      <div style={{ fontSize: 24, marginBottom: 8 }}>≡ƒÄë</div>
                      <div style={{ fontSize: 13 }}>No at-risk users! All paid users are active.</div>
                    </div>
                  ) : (
                    <div style={{ maxHeight: 300, overflowY: "auto" }}>
                      {atRiskUsers.slice(0, 10).map(u => {
                        const daysSince = u.lastLoginAt ? Math.floor((now.getTime() - new Date(u.lastLoginAt).getTime()) / 86400000) : 999;
                        return (
                          <div key={u.uid || u.id} style={{ padding: "12px 20px", borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 600, color: T.white }}>{u.name || u.email}</div>
                              <div style={{ fontSize: 11, color: T.textMuted }}>{u.email} · {u.tier}</div>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                              <div style={{ textAlign: "right" }}>
                                <div style={{ fontSize: 12, fontWeight: 600, color: daysSince > 30 ? T.red : T.orange }}>{daysSince === 999 ? "Never" : `${daysSince}d ago`}</div>
                                <div style={{ fontSize: 10, color: T.textMuted }}>Last login</div>
                              </div>
                              <button type="button" onClick={() => notify(`Win-back email sent to ${u.email}`)} style={{ padding: "6px 12px", borderRadius: 6, border: "none", background: T.teal, color: T.bg, fontSize: 10, fontWeight: 600, cursor: "pointer" }}>Reach Out</button>
                            </div>
                          </div>
                        );
                      })}
                      {atRiskUsers.length > 10 && (
                        <div style={{ padding: "12px 20px", textAlign: "center", fontSize: 11, color: T.textMuted }}>+ {atRiskUsers.length - 10} more at-risk users</div>
                      )}
                    </div>
                  )}
                </div>

                {/* Exit Survey Responses */}
                <div style={{ background: T.surface, borderRadius: 14, border: `1px solid ${T.border}`, padding: 20 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: T.white, marginBottom: 4 }}>Recent Exit Survey Responses</div>
                  <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 16 }}>What churned users said</div>
                  
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {[
                      { user: "ahmed@example.com", reason: "Too expensive", feedback: "Great product but AED 99/mo is too much for occasional use. Would subscribe to a AED 49 lite plan.", date: "3 days ago", tier: "Pro" },
                      { user: "sarah@realty.ae", reason: "Found alternative", feedback: "Switched to competitor that includes CRM. Would come back if you add lead management.", date: "5 days ago", tier: "Pro" },
                      { user: "mike@invest.com", reason: "Missing features", feedback: "Need mortgage calculator and ROI projections. Product is good otherwise.", date: "1 week ago", tier: "Enterprise" },
                    ].map((r, i) => (
                      <div key={i} style={{ padding: "14px 16px", background: T.surfaceAlt, borderRadius: 10, border: `1px solid ${T.border}` }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ fontSize: 12, fontWeight: 600, color: T.white }}>{r.user}</span>
                            <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, background: `${T.gold}20`, color: T.gold }}>{r.tier}</span>
                          </div>
                          <span style={{ fontSize: 10, color: T.textMuted }}>{r.date}</span>
                        </div>
                        <div style={{ fontSize: 10, color: T.red, fontWeight: 600, marginBottom: 6 }}>Reason: {r.reason}</div>
                        <div style={{ fontSize: 12, color: T.textSecondary, lineHeight: 1.5, fontStyle: "italic" }}>"{r.feedback}"</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

  );
}

export default AdminCancellationTab;
