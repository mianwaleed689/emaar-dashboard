import emailjs from "@emailjs/browser";
/**
 * AdminOverviewTab.jsx
 * Extracted from AdminPanel.jsx — Session 22
 * DXB Analytics — Bloomberg Terminal of GCC Real Estate
 *
 * Props received from AdminPanel:
 *   users, auditLog, leads, verifications
 *   setTab, setTierFilter, setPendingOpenUid
 *   notify, T, emailjs
 *   trialDaysLeft, timeSince
 *   fetchUsers, fetchLeads, fetchVerifications, fetchAuditLog
 *   overviewCompare, setOverviewCompare
 *   kpiDrill, setKpiDrill  (drill-down modal controller)
 *
 * All computed values (stats, mrr, arr, etc.) are derived INSIDE this component
 * from the raw props — keeping AdminPanel.jsx shell clean.
 */

import React from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell,
  ResponsiveContainer,
} from "recharts";

// ─── Custom Recharts Tooltip ────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "#1E293B", border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 10, padding: "10px 14px", fontSize: 12,
      boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
    }}>
      {label && <div style={{ color: "#94A3B8", marginBottom: 6, fontSize: 11 }}>{label}</div>}
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color || "#D4A843", fontWeight: 700 }}>
          {p.name}: {typeof p.value === "number" ? p.value.toLocaleString() : p.value}
        </div>
      ))}
    </div>
  );
};

// ─── Main Component ──────────────────────────────────────────────────────────
export default function AdminOverviewTab({
  users = [],
  auditLog = [],
  leads = [],
  verifications = [],
  setTab,
  setTierFilter,
  setPendingOpenUid,
  notify,
  emailjs,
  trialDaysLeft,
  timeSince,
  fetchUsers,
  fetchLeads,
  fetchVerifications,
  fetchAuditLog,
  overviewCompare,
  setOverviewCompare,
  setKpiDrill,
  T = {
    bg:"#060D1A",surface:"#0A1628",surfaceAlt:"#111C2E",surfaceHover:"#162238",
    border:"rgba(255,255,255,0.06)",gold:"#D4A843",goldLight:"#E8C86A",
    blue:"#3B82F6",green:"#10B981",red:"#EF4444",orange:"#F59E0B",
    purple:"#8B5CF6",cyan:"#06B6D4",pink:"#EC4899",
    white:"#FFFFFF",textPrimary:"#E2E8F0",textSecondary:"#94A3B8",textMuted:"#64748B",
  },
  I = {},
}) {

  // ── TIME CONSTANTS ──────────────────────────────────────────────────────────
  const now        = new Date();
  const todayStr   = now.toDateString();
  const msPerDay   = 86400000;
  const msPerWeek  = 7 * msPerDay;

  // ── USER COUNTS ─────────────────────────────────────────────────────────────
  const stats = {
    total:     users.length,
    today:     users.filter(u => { try { return new Date(u.createdAt).toDateString() === todayStr; } catch { return false; } }).length,
    thisWeek:  users.filter(u => { try { return (now - new Date(u.createdAt)) < msPerWeek; } catch { return false; } }).length,
    lastWeek:  users.filter(u => { try { const ms = now - new Date(u.createdAt); return ms >= msPerWeek && ms < msPerWeek * 2; } catch { return false; } }).length,
    thisMonth: users.filter(u => { try { const d = new Date(u.createdAt); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); } catch { return false; } }).length,
    proTrial:  users.filter(u => u.tier === "pro_trial" && (!u.trialEnd || new Date(u.trialEnd) > now)).length,
    free:      users.filter(u => u.tier === "free" || !u.tier).length,
    expired:   users.filter(u => u.tier === "pro_trial" && u.trialEnd && new Date(u.trialEnd) <= now).length,
    pro:       users.filter(u => u.tier === "pro").length,
    enterprise:users.filter(u => u.tier === "enterprise").length,
    suspended: users.filter(u => u.suspended).length,
    activeToday:    users.filter(u => u.lastLoginAt && (now - new Date(u.lastLoginAt)) < msPerDay).length,
    activeThisWeek: users.filter(u => u.lastLoginAt && (now - new Date(u.lastLoginAt)) < msPerWeek).length,
  };
  stats.paid        = stats.pro + stats.enterprise;
  stats.freeOnly    = stats.free;
  stats.atRisk      = users.filter(u => { try { const d = trialDaysLeft(u); return d !== null && d <= 3 && d >= 0; } catch { return false; } }).length;
  stats.atRiskUsers = users.filter(u => { try { const d = trialDaysLeft(u); return d !== null && d <= 3 && d >= 0; } catch { return false; } });

  // ── REVENUE ─────────────────────────────────────────────────────────────────
  const mrr     = (stats.pro * 99) + (stats.enterprise * 499);
  const arr     = mrr * 12;
  const arpu    = stats.paid > 0 ? Math.round(mrr / stats.paid) : 0;
  const arpuAll = stats.total > 0 ? Math.round(mrr / stats.total) : 0;

  // ── TRIAL CONVERSION ────────────────────────────────────────────────────────
  const everTrialled    = stats.proTrial + stats.pro + stats.expired;
  const trialConversion = everTrialled > 0 ? Math.round((stats.pro / everTrialled) * 100) : 0;

  // ── WEEK-OVER-WEEK TRENDS ───────────────────────────────────────────────────
  const usersLastWeekTotal = users.filter(u => {
    try { const ms = now - new Date(u.createdAt); return ms >= msPerWeek && ms < msPerWeek * 2; } catch { return false; }
  }).length;
  const paidLastWeek = (() => {
    const newPaidThisWeek = users.filter(u => {
      try { return (u.tier === "pro" || u.tier === "enterprise") && (now - new Date(u.createdAt)) < msPerWeek; } catch { return false; }
    }).length;
    const newPaidLastWeek = users.filter(u => {
      try { const ms = now - new Date(u.createdAt); return (u.tier === "pro" || u.tier === "enterprise") && ms >= msPerWeek && ms < msPerWeek * 2; } catch { return false; }
    }).length;
    return { thisWeek: newPaidThisWeek, lastWeek: newPaidLastWeek };
  })();
  const weekTrend = (current, previous) => {
    if (previous === 0 && current === 0) return { pct: 0, dir: "flat", label: "—" };
    if (previous === 0) return { pct: 100, dir: "up", label: `+${current} new` };
    const pct = Math.round(((current - previous) / previous) * 100);
    return { pct: Math.abs(pct), dir: pct > 0 ? "up" : pct < 0 ? "down" : "flat", label: pct > 0 ? `↑${Math.abs(pct)}%` : pct < 0 ? `↓${Math.abs(pct)}%` : "=" };
  };
  const usersTrend = weekTrend(stats.thisWeek, usersLastWeekTotal);
  const mrrTrend   = weekTrend(paidLastWeek.thisWeek, paidLastWeek.lastWeek);

  // ── CHURN ───────────────────────────────────────────────────────────────────
  const churnEvents = auditLog.filter(l =>
    l.action === "tier_change" &&
    (l.from === "pro" || l.from === "enterprise") &&
    (l.to === "free" || l.to === "pro_trial")
  );
  const churnThisMonth = churnEvents.filter(l => {
    try { const d = new Date(l.changedAt); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); } catch { return false; }
  });
  const churnedMRR = churnThisMonth.reduce((sum, l) => sum + (l.from === "enterprise" ? 499 : 99), 0);
  const newMRRThisMonth = users.filter(u => {
    try {
      const d = new Date(u.createdAt);
      return (u.tier === "pro" || u.tier === "enterprise") &&
             d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    } catch { return false; }
  }).reduce((sum, u) => sum + (u.tier === "enterprise" ? 499 : 99), 0);
  const netMRR = newMRRThisMonth - churnedMRR;

  // ── PLATFORM HEALTH SCORE ───────────────────────────────────────────────────
  const healthScore = (() => {
    let score = 100;
    if (stats.total === 0) return 50;
    if (stats.proTrial > 0) score -= Math.min(30, Math.round((stats.atRisk / stats.proTrial) * 30));
    if (trialConversion < 20 && everTrialled > 2) score -= 20;
    else if (trialConversion < 40 && everTrialled > 2) score -= 10;
    if (churnThisMonth.length > 0) score -= Math.min(20, churnThisMonth.length * 10);
    if (stats.suspended > 0) score -= Math.min(10, stats.suspended * 5);
    return Math.max(0, Math.min(100, score));
  })();
  const healthLabel = healthScore >= 80 ? "Excellent" : healthScore >= 60 ? "Good" : healthScore >= 40 ? "Needs Attention" : "Critical";
  const healthColor = healthScore >= 80 ? T.green : healthScore >= 60 ? T.gold : healthScore >= 40 ? "#F59E0B" : T.red;

  // ── PENDING ITEMS ───────────────────────────────────────────────────────────
  const pendingVerifications = verifications.filter(v => v.status === "pending").length;
  const newLeadsToday        = leads.filter(l => { try { return new Date(l.createdAt).toDateString() === todayStr; } catch { return false; } }).length;

  // ── SIGNUP TIMELINE — 14 days with last-week comparison ────────────────────
  const signupTimeline = (() => {
    const days = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now); d.setDate(d.getDate() - i);
      const dLastWeek = new Date(now); dLastWeek.setDate(dLastWeek.getDate() - i - 7);
      const key   = d.toDateString();
      const keyLW = dLastWeek.toDateString();
      const count   = users.filter(u => { try { return new Date(u.createdAt).toDateString() === key;   } catch { return false; } }).length;
      const countLW = users.filter(u => { try { return new Date(u.createdAt).toDateString() === keyLW; } catch { return false; } }).length;
      days.push({ date: `${d.getDate()} ${d.toLocaleString("en", { month: "short" })}`, count, lastWeek: countLW });
    }
    return days;
  })();
  const signupThisWeek = signupTimeline.slice(-7).reduce((s, d) => s + d.count, 0);
  const signupLastWeek = signupTimeline.slice(-7).reduce((s, d) => s + d.lastWeek, 0);
  const signupTrend    = weekTrend(signupThisWeek, signupLastWeek);

  // ── TIER DISTRIBUTION ───────────────────────────────────────────────────────
  const tierData = [
    { name: "Pro Trial",   value: stats.proTrial,   color: T.gold },
    { name: "Free",        value: stats.freeOnly,   color: T.textMuted },
    { name: "Pro",         value: stats.pro,         color: T.green },
    { name: "Enterprise",  value: stats.enterprise,  color: T.teal },
    { name: "Expired",     value: stats.expired,     color: T.red },
  ].filter(d => d.value > 0);

  // ── ACTIVITY FEED ───────────────────────────────────────────────────────────
  const activityFeed = (() => {
    const items = [];
    [...users]
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .slice(0, 5)
      .forEach(u => items.push({
        type: "signup", uid: u.uid, user: u,
        time: u.createdAt, icon: "👤",
        label: `${u.name || u.email?.split("@")[0] || "New user"} signed up`,
        sub: u.tier || "free", color: T.gold,
      }));
    auditLog.slice(0, 20).forEach(l => {
      if (l.action !== "tier_change") return;
      const u = users.find(x => x.uid === l.uid);
      const isUpgrade   = (l.to === "pro" || l.to === "enterprise" || l.to === "pro_trial") && l.from !== l.to;
      const isDowngrade = (l.from === "pro" || l.from === "enterprise") && (l.to === "free" || l.to === "pro_trial");
      items.push({
        type: isUpgrade ? "upgrade" : "downgrade",
        uid: l.uid, user: u,
        time: l.changedAt, icon: isUpgrade ? "⬆" : "⬇",
        label: `${u?.name || u?.email?.split("@")[0] || "User"} ${l.to === "free" ? "downgraded to free" : l.from === "free" || l.from === "pro_trial" ? "upgraded to" : "downgraded to"} ${l.to}`,
        sub: l.to, color: isUpgrade ? T.green : T.red,
      });
    });
    leads.slice(0, 3).forEach(l => items.push({
      type: "lead", uid: null, user: null,
      time: l.createdAt, icon: "🎯",
      label: `New lead: ${l.name || l.email || "Anonymous"}`,
      sub: l.source || "website", color: T.teal,
    }));
    verifications.filter(v => v.status === "pending").slice(0, 3).forEach(v => items.push({
      type: "verification", uid: v.userId, user: null,
      time: v.submittedAt, icon: "🔐",
      label: `KYC submitted by ${v.name || v.email || "User"}`,
      sub: "Pending review", color: "#F59E0B",
    }));
    return items
      .filter(i => i.time)
      .sort((a, b) => new Date(b.time) - new Date(a.time))
      .slice(0, 10);
  })();

  // ── EMAIL HELPER ─────────────────────────────────────────────────────────────
  const sendNudge = (u, changeType, newValue, oldValue) => {
    emailjs.send(
      "service_da7nshv", "template_gl1xqhy",
      { user_email: u.email, user_name: u.name || u.email, project_name: "DXB Analytics",
        change_type: changeType, new_value: newValue, old_value: oldValue,
        updated_at: new Date().toLocaleString("en-AE") },
      "USkwUhp0csGCVDkdQ"
    ).catch(() => {});
  };

  // ── URGENT ALERTS ────────────────────────────────────────────────────────────
  const urgentAlerts = [
    stats.atRisk > 0 && {
      key: "atrisk", color: T.red, label: `${stats.atRisk} at risk`,
      action: () => {
        stats.atRiskUsers.forEach(u => {
          const days = trialDaysLeft(u);
          sendNudge(u, `⚠ Trial Expiring in ${days} Day${days !== 1 ? "s" : ""}`, `Only ${days} day${days !== 1 ? "s" : ""} left. Upgrade now.`, "Pro Trial");
        });
        notify(`Sent ${stats.atRisk} at-risk emails`);
      },
    },
    stats.suspended > 0 && { key: "suspended", color: "#F59E0B", label: `${stats.suspended} suspended`, action: () => { setTab("users"); setTierFilter("Suspended"); } },
    stats.expired > 0   && { key: "expired",   color: T.textMuted, label: `${stats.expired} expired`,   action: () => { setTab("users"); setTierFilter("Expired"); } },
    pendingVerifications > 0 && { key: "verif", color: "#8B5CF6", label: `${pendingVerifications} KYC`,  action: () => setTab("verification") },
    newLeadsToday > 0   && { key: "leads",  color: T.teal,    label: `${newLeadsToday} leads`,     action: () => setTab("leads") },
  ].filter(Boolean);

  // ── MONTHLY ARPU/MRR TREND (6 months) ───────────────────────────────────────
  const monthlyTrend = (() => {
    const monthsBack = 6;
    const result = [];
    for (let m = monthsBack - 1; m >= 0; m--) {
      const d        = new Date(now.getFullYear(), now.getMonth() - m, 1);
      const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
      const label    = d.toLocaleDateString("en-AE", { month: "short", year: "2-digit" });
      let proCount = 0, entCount = 0;
      users.forEach(u => {
        const joined = new Date(u.createdAt || 0);
        if (joined > monthEnd) return;
        const userChanges = auditLog
          .filter(l => l.userId === u.id && l.action === "tier_change" && new Date(l.changedAt) <= monthEnd)
          .sort((a, b) => new Date(b.changedAt) - new Date(a.changedAt));
        const tierAtMonth = userChanges.length > 0 ? userChanges[0].newTier : (m === 0 ? u.tier : "pro_trial");
        if (tierAtMonth === "pro") proCount++;
        else if (tierAtMonth === "enterprise") entCount++;
      });
      const mrrVal   = proCount * 99 + entCount * 499;
      const paidCount = proCount + entCount;
      const arpuVal  = paidCount > 0 ? Math.round(mrrVal / paidCount) : 0;
      result.push({ label, mrr: mrrVal, arpu: arpuVal, paid: paidCount });
    }
    return result;
  })();

  const maxMrr  = Math.max(...monthlyTrend.map(d => d.mrr), 1);
  const maxArpu = Math.max(...monthlyTrend.map(d => d.arpu), 1);
  const chartH  = 180;
  const pts     = monthlyTrend.length;
  const hasRevenueData = monthlyTrend.some(d => d.mrr > 0 || d.arpu > 0);

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <>

      {/* ══ TOPBAR — health + alerts + compare toggle ══ */}
      <div className="fade-up" style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", borderRadius: 14, background: T.surface, border: `1px solid ${T.border}`, marginBottom: 18, flexWrap: "wrap" }}>

        {/* Health indicator */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, paddingRight: 14, borderRight: `1px solid ${T.border}`, flexShrink: 0 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: healthColor, boxShadow: `0 0 6px ${healthColor}` }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: healthColor }}>{healthLabel}</span>
          <span style={{ fontSize: 11, color: T.textMuted }}>· Score {healthScore}</span>
        </div>

        {/* Alert chips */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, flex: 1, flexWrap: "wrap" }}>
          {urgentAlerts.length === 0 ? (
            <span style={{ fontSize: 11, color: T.textMuted }}>No urgent items</span>
          ) : (
            urgentAlerts.map(a => (
              <button key={a.key} type="button" onClick={a.action}
                style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 20, border: `1px solid ${a.color}40`, background: `${a.color}10`, color: a.color, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "'Outfit',sans-serif", whiteSpace: "nowrap" }}>
                {a.label}
              </button>
            ))
          )}
        </div>

        {/* Compare toggle + Refresh */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ display: "flex", background: T.surfaceAlt, borderRadius: 8, border: `1px solid ${T.border}`, overflow: "hidden" }}>
            {[{ id: "off", label: "Now" }, { id: "week", label: "vs Week" }, { id: "month", label: "vs Month" }].map(c => (
              <button key={c.id} type="button" onClick={() => setOverviewCompare(c.id)}
                style={{ padding: "5px 10px", fontSize: 10, fontWeight: 600, background: overviewCompare === c.id ? T.gold + "20" : "transparent", color: overviewCompare === c.id ? T.gold : T.textMuted, border: "none", cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>
                {c.label}
              </button>
            ))}
          </div>
          <button type="button"
            onClick={() => { fetchUsers(); fetchLeads(); fetchVerifications(); fetchAuditLog(); notify("Refreshed"); }}
            style={{ width: 30, height: 30, borderRadius: 8, border: `1px solid ${T.border}`, background: "transparent", color: T.textMuted, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
            title="Refresh all data">
            ↻
          </button>
        </div>
      </div>

      {/* ══ KPI CARDS ══ */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div style={{ borderLeft: `3px solid ${T.gold}`, paddingLeft: 14 }}>
            <h2 style={{ fontFamily: "'Fraunces',serif", fontSize: 20, fontWeight: 800, color: T.white, margin: 0 }}>Platform Overview</h2>
            <p style={{ fontSize: 12, color: T.textSecondary, margin: "3px 0 0" }}>Real-time platform health & key metrics</p>
          </div>
        </div>
        <div className="kpi-grid-overview" style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 10 }}>

          {/* 1 — MRR */}
          <div className="kpi-card fade-up" style={{ animationDelay: "0.00s", cursor: "pointer" }} onClick={() => setKpiDrill({
            title: "MRR Breakdown", color: T.green,
            subtitle: `Monthly Recurring Revenue · ARR: AED ${arr.toLocaleString()}`,
            items: [
              { label: "Total MRR",                  value: `AED ${mrr.toLocaleString()}`,                                    color: T.green },
              { label: "Enterprise (AED 499/mo)",     value: `${stats.enterprise} users · AED ${(stats.enterprise * 499).toLocaleString()}`, note: "AED 499 × users" },
              { label: "Pro (AED 99/mo)",             value: `${stats.pro} users · AED ${(stats.pro * 99).toLocaleString()}`, note: "AED 99 × users" },
              { label: "Annual Run Rate (ARR)",        value: `AED ${arr.toLocaleString()}`,                                   color: T.green },
              { label: "New MRR this month",          value: `+AED ${newMRRThisMonth.toLocaleString()}`,                      color: T.green },
              { label: "Churned MRR this month",      value: `-AED ${churnedMRR.toLocaleString()}`,                           color: churnedMRR > 0 ? T.red : T.textMuted },
              { label: "Net MRR Movement",            value: `${netMRR >= 0 ? "+" : ""}AED ${netMRR.toLocaleString()}`,       color: netMRR >= 0 ? T.green : T.red },
            ],
            actions: [{ label: "View Revenue Tab", color: T.green, fn: () => setTab("revenue") }],
          })}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: T.green, opacity: 0.7, borderRadius: "16px 16px 0 0" }} />
            <div style={{ fontSize: 9, fontWeight: 700, color: T.textMuted, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 8 }}>MRR</div>
            <div style={{ fontFamily: "'Fraunces',serif", fontSize: 22, fontWeight: 900, color: T.green, lineHeight: 1 }}>AED {mrr.toLocaleString()}</div>
            <div style={{ fontSize: 10, color: T.textMuted, marginTop: 6 }}>ARR: AED {arr.toLocaleString()}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 5 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: mrrTrend.dir === "up" ? T.green : mrrTrend.dir === "down" ? T.red : T.textMuted }}>
                {mrrTrend.dir === "up" ? "↑" : mrrTrend.dir === "down" ? "↓" : "—"} {mrrTrend.label}
              </span>
              <span style={{ fontSize: 9, color: T.textMuted }}>vs last week</span>
            </div>
          </div>

          {/* 2 — Total Users */}
          <div className="kpi-card fade-up" style={{ animationDelay: "0.04s", cursor: "pointer" }} onClick={() => setKpiDrill({
            title: "Total Users Breakdown", color: T.gold,
            subtitle: `${stats.total} registered accounts · ${stats.today} joined today`,
            items: [
              { label: "Total Registered",    value: stats.total,                                                                                                    color: T.gold },
              { label: "Joined Today",         value: stats.today,                                                                                                    color: stats.today > 0 ? T.green : T.textMuted },
              { label: "Joined This Week",     value: users.filter(u => { try { return (now - new Date(u.createdAt)) < 7*24*60*60*1000; } catch { return false; } }).length },
              { label: "Joined This Month",    value: users.filter(u => { try { const d = new Date(u.createdAt); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); } catch { return false; } }).length },
              { label: "Admin Accounts",       value: users.filter(u => u.role === "admin").length },
              { label: "Suspended",            value: stats.suspended,                                                                                                color: stats.suspended > 0 ? T.red : T.textMuted },
              { label: "Email Verified",       value: users.filter(u => u.emailVerified).length, note: `${stats.total > 0 ? Math.round((users.filter(u => u.emailVerified).length / stats.total) * 100) : 0}% of total` },
            ],
            actions: [{ label: "View All Users", color: T.gold, fn: () => setTab("users") }],
          })}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: T.gold, opacity: 0.7, borderRadius: "16px 16px 0 0" }} />
            <div style={{ fontSize: 9, fontWeight: 700, color: T.textMuted, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 8 }}>Total Users</div>
            <div style={{ fontFamily: "'Fraunces',serif", fontSize: 22, fontWeight: 900, color: T.gold, lineHeight: 1 }}>{stats.total}</div>
            <div style={{ fontSize: 10, color: T.textMuted, marginTop: 6 }}>+{stats.today} today</div>
            <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 5 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: usersTrend.dir === "up" ? T.green : usersTrend.dir === "down" ? T.red : T.textMuted }}>
                {usersTrend.dir === "up" ? "↑" : usersTrend.dir === "down" ? "↓" : "—"} {usersTrend.label}
              </span>
              <span style={{ fontSize: 9, color: T.textMuted }}>vs last week</span>
            </div>
            <div style={{ fontSize: 9, color: T.gold, marginTop: 4, opacity: 0.7 }}>click to view →</div>
          </div>

          {/* 3 — Paid Users */}
          <div className="kpi-card fade-up" style={{ animationDelay: "0.08s", cursor: "pointer" }} onClick={() => setKpiDrill({
            title: "Paid Users Breakdown", color: T.teal,
            subtitle: `${stats.paid} paying accounts · AED ${mrr.toLocaleString()} MRR`,
            items: [
              { label: "Total Paid",               value: stats.paid,                                                                     color: T.teal },
              { label: "Pro (AED 99/mo)",          value: stats.pro,        note: `AED ${(stats.pro * 99).toLocaleString()} MRR` },
              { label: "Enterprise (AED 499/mo)",  value: stats.enterprise, note: `AED ${(stats.enterprise * 499).toLocaleString()} MRR`, color: T.gold },
              { label: "Conversion Rate",          value: `${stats.total > 0 ? Math.round((stats.paid / stats.total) * 100) : 0}%`, note: "Paid ÷ Total Users" },
              { label: "Trial → Paid Rate",        value: `${trialConversion}%`,  note: "Of all who ever trialled" },
              { label: "ARPU (paying users)",      value: `AED ${arpu}`,          color: T.teal },
            ],
            actions: [
              { label: "View Pro Users",    color: T.teal, fn: () => { setTab("users"); setTierFilter("Pro"); } },
              { label: "View Enterprise",   color: T.gold, fn: () => { setTab("users"); setTierFilter("Enterprise"); } },
            ],
          })}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: T.teal, opacity: 0.7, borderRadius: "16px 16px 0 0" }} />
            <div style={{ fontSize: 9, fontWeight: 700, color: T.textMuted, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 8 }}>Paid Users</div>
            <div style={{ fontFamily: "'Fraunces',serif", fontSize: 22, fontWeight: 900, color: T.teal, lineHeight: 1 }}>{stats.paid}</div>
            <div style={{ fontSize: 10, color: T.textMuted, marginTop: 6 }}>{stats.pro} Pro · {stats.enterprise} Ent</div>
            <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 5 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: T.teal }}>{stats.total > 0 ? Math.round((stats.paid / stats.total) * 100) : 0}%</span>
              <span style={{ fontSize: 9, color: T.textMuted }}>conversion rate</span>
            </div>
            <div style={{ fontSize: 9, color: T.teal, marginTop: 4, opacity: 0.7 }}>click to view →</div>
          </div>

          {/* 4 — Active Trials */}
          <div className="kpi-card fade-up" style={{ animationDelay: "0.12s", cursor: "pointer" }} onClick={() => setKpiDrill({
            title: "Active Trials Breakdown", color: T.gold,
            subtitle: `${stats.proTrial} users on 7-day Pro Trial`,
            items: [
              { label: "Active Trials",            value: stats.proTrial, color: T.gold },
              { label: "At Risk (≤3 days left)",   value: stats.atRisk,   color: stats.atRisk > 0 ? T.red : T.textMuted, note: stats.atRisk > 0 ? "Need immediate attention" : "None at risk" },
              { label: "Expiring in 7 days",       value: users.filter(u => u.tier === "pro_trial" && u.trialEnd && trialDaysLeft(u) >= 0 && trialDaysLeft(u) <= 7).length, color: T.gold },
              { label: "Expired (not converted)",  value: stats.expired,  color: stats.expired > 0 ? T.red : T.textMuted },
              { label: "Trial → Paid conversion",  value: `${trialConversion}%`, note: `${stats.pro} converted of ${everTrialled} ever trialled` },
              { label: "Avg days left (active)",   value: (() => { const active = users.filter(u => u.tier === "pro_trial"); if (!active.length) return "—"; const avg = active.reduce((s, u) => s + Math.max(0, trialDaysLeft(u)), 0) / active.length; return `${Math.round(avg)} days`; })() },
            ],
            actions: [
              { label: `Email All ${stats.atRisk} At-Risk`, color: T.red, fn: () => { stats.atRiskUsers.forEach(u => { const days = trialDaysLeft(u); sendNudge(u, `Trial Expiring in ${days} Day${days !== 1 ? "s" : ""}`, `Only ${days} day${days !== 1 ? "s" : ""} left. Upgrade now.`, "Pro Trial"); }); notify(`Sent ${stats.atRisk} at-risk emails`); } },
              { label: "View Trial Users", color: T.gold, fn: () => { setTab("users"); setTierFilter("Pro Trial"); } },
            ],
          })}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: T.gold, opacity: 0.5, borderRadius: "16px 16px 0 0" }} />
            <div style={{ fontSize: 9, fontWeight: 700, color: T.textMuted, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 8 }}>Active Trials</div>
            <div style={{ fontFamily: "'Fraunces',serif", fontSize: 22, fontWeight: 900, color: T.gold, lineHeight: 1 }}>{stats.proTrial}</div>
            <div style={{ fontSize: 10, color: stats.atRisk > 0 ? T.red : T.textMuted, marginTop: 6, fontWeight: stats.atRisk > 0 ? 700 : 400 }}>
              {stats.atRisk > 0 ? `${stats.atRisk} at risk` : "No at-risk trials"}
            </div>
            <div style={{ fontSize: 10, color: T.textMuted, marginTop: 4 }}>{stats.expired} expired</div>
            <div style={{ fontSize: 9, color: T.gold, marginTop: 4, opacity: 0.7 }}>click to view →</div>
          </div>

          {/* 5 — Trial Conversion */}
          <div className="kpi-card fade-up" style={{ animationDelay: "0.16s", cursor: "pointer" }} onClick={() => setKpiDrill({
            title: "Trial → Paid Conversion", color: "#3B82F6",
            subtitle: "How effectively trials convert to paying users",
            items: [
              { label: "Conversion Rate",      value: `${trialConversion}%`,   color: "#3B82F6" },
              { label: "Ever Trialled",        value: everTrialled,             note: "Unique users who started a trial" },
              { label: "Converted to Paid",    value: stats.pro,                color: T.green },
              { label: "Currently on Trial",   value: stats.proTrial },
              { label: "Expired (not converted)", value: stats.expired,         color: stats.expired > 0 ? T.red : T.textMuted },
              { label: "Industry Benchmark",   value: "~25%",                   note: "SaaS avg trial conversion", color: T.textMuted },
              { label: "vs Benchmark",         value: trialConversion >= 25 ? `+${trialConversion - 25}% above` : `${trialConversion - 25}% below`, color: trialConversion >= 25 ? T.green : T.red },
            ],
            actions: [{ label: "View Expired Trials", color: "#3B82F6", fn: () => { setTab("users"); setTierFilter("Expired"); } }],
          })}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "#3B82F6", opacity: 0.7, borderRadius: "16px 16px 0 0" }} />
            <div style={{ fontSize: 9, fontWeight: 700, color: T.textMuted, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 8 }}>Trial → Paid</div>
            <div style={{ fontFamily: "'Fraunces',serif", fontSize: 22, fontWeight: 900, color: "#3B82F6", lineHeight: 1 }}>{trialConversion}%</div>
            <div style={{ fontSize: 10, color: T.textMuted, marginTop: 6 }}>{stats.pro} converted</div>
            <div style={{ fontSize: 10, color: T.textMuted, marginTop: 4 }}>{stats.expired} expired</div>
            <div style={{ marginTop: 6, height: 3, borderRadius: 2, background: T.surfaceAlt }}>
              <div style={{ width: `${trialConversion}%`, height: "100%", borderRadius: 2, background: "#3B82F6", transition: "width 0.6s ease" }} />
            </div>
          </div>

          {/* 6 — ARPU */}
          <div className="kpi-card fade-up" style={{ animationDelay: "0.20s", cursor: "pointer" }} onClick={() => setKpiDrill({
            title: "ARPU Breakdown", color: "#8B5CF6",
            subtitle: "Average Revenue Per User",
            items: [
              { label: "ARPU (paying users)",  value: `AED ${arpu}`,                                  color: "#8B5CF6" },
              { label: "ARPU (all users)",     value: `AED ${arpuAll}`,                               note: "MRR ÷ total users" },
              { label: "Enterprise ARPU",      value: "AED 499",                                      note: "Per enterprise user/mo" },
              { label: "Pro ARPU",             value: "AED 99",                                       note: "Per pro user/mo" },
              { label: "LTV estimate (12mo)",  value: `AED ${(arpu * 12).toLocaleString()}`,          note: "ARPU × 12 months", color: "#8B5CF6" },
              { label: "To reach AED 10K MRR", value: (() => { if (arpu === 0) return "—"; const needed = Math.ceil((10000 - mrr) / arpu); return needed > 0 ? `${needed} more paid users` : "Already exceeded"; })(), note: "At current ARPU" },
            ],
          })}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "#8B5CF6", opacity: 0.7, borderRadius: "16px 16px 0 0" }} />
            <div style={{ fontSize: 9, fontWeight: 700, color: T.textMuted, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 8 }}>ARPU</div>
            <div style={{ fontFamily: "'Fraunces',serif", fontSize: 22, fontWeight: 900, color: "#8B5CF6", lineHeight: 1 }}>AED {arpu}</div>
            <div style={{ fontSize: 10, color: T.textMuted, marginTop: 6 }}>per paying user</div>
            <div style={{ fontSize: 10, color: T.textMuted, marginTop: 4 }}>AED {arpuAll} all users</div>
          </div>

          {/* 7 — Active Today */}
          <div className="kpi-card fade-up" style={{ animationDelay: "0.24s", cursor: "pointer" }} onClick={() => setKpiDrill({
            title: "User Activity", color: T.teal,
            subtitle: "Login and engagement metrics",
            items: [
              { label: "Active Today",               value: stats.activeToday,    color: T.teal },
              { label: "Active This Week",           value: stats.activeThisWeek },
              { label: "Daily Active Rate",          value: `${stats.total > 0 ? Math.round((stats.activeToday / stats.total) * 100) : 0}%`, note: "Today ÷ total users" },
              { label: "Weekly Active Rate",         value: `${stats.total > 0 ? Math.round((stats.activeThisWeek / stats.total) * 100) : 0}%`, note: "7-day ÷ total users" },
              { label: "Never Logged In",            value: users.filter(u => !u.lastLoginAt).length, color: users.filter(u => !u.lastLoginAt).length > 0 ? "#F59E0B" : T.textMuted, note: "Registered but never signed in" },
              { label: "Industry DAU/MAU Benchmark", value: "~15–20%", color: T.textMuted, note: "Healthy SaaS range" },
            ],
            actions: [{ label: "View Active Users", color: T.teal, fn: () => setTab("users") }],
          })}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: T.teal, opacity: 0.5, borderRadius: "16px 16px 0 0" }} />
            <div style={{ fontSize: 9, fontWeight: 700, color: T.textMuted, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 8 }}>Active Today</div>
            <div style={{ fontFamily: "'Fraunces',serif", fontSize: 22, fontWeight: 900, color: T.teal, lineHeight: 1 }}>{stats.activeToday}</div>
            <div style={{ fontSize: 10, color: T.textMuted, marginTop: 6 }}>{stats.activeThisWeek} this week</div>
            <div style={{ fontSize: 10, color: T.textMuted, marginTop: 4 }}>{stats.total > 0 ? Math.round((stats.activeToday / stats.total) * 100) : 0}% of all users</div>
            <div style={{ fontSize: 9, color: T.teal, marginTop: 4, opacity: 0.7 }}>click to view →</div>
          </div>

        </div>
      </div>

      {/* ══ CHARTS — Signup Timeline + Tier Donut ══ */}
      <div style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 10, marginTop: 8 }}>Growth & Distribution</div>
      <div className="charts-row-overview" style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 14, marginBottom: 14 }}>

        {/* Signup Timeline */}
        <div className="chart-box fade-up" style={{ padding: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.white }}>Signup Timeline</div>
              <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>14 days · vs prior week</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 11 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: T.gold }} />
                <span style={{ color: T.textSecondary }}>This week</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <div style={{ width: 10, height: 3, borderRadius: 2, background: T.textMuted }} />
                <span style={{ color: T.textMuted }}>Last week</span>
              </div>
              <div style={{ padding: "3px 10px", borderRadius: 6, background: signupTrend.dir === "up" ? "rgba(16,185,129,0.1)" : signupTrend.dir === "down" ? "rgba(239,68,68,0.1)" : T.surfaceAlt, fontSize: 11, fontWeight: 700, color: signupTrend.dir === "up" ? T.green : signupTrend.dir === "down" ? T.red : T.textMuted }}>
                {signupTrend.dir === "up" ? "↑" : signupTrend.dir === "down" ? "↓" : ""} {signupThisWeek} vs {signupLastWeek} last week
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={signupTimeline} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="date" tick={{ fill: T.textMuted, fontSize: 9 }} axisLine={false} tickLine={false} interval={1} angle={-30} textAnchor="end" height={36} />
              <YAxis tick={{ fill: T.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} width={24} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count"    fill={T.gold}     name="This week" radius={[3,3,0,0]} barSize={14} />
              <Bar dataKey="lastWeek" fill={T.textMuted} name="Last week" radius={[3,3,0,0]} barSize={14} opacity={0.45} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Tier Donut */}
        <div className="chart-box fade-up" style={{ padding: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.white, marginBottom: 4 }}>Tier Distribution</div>
          <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 10 }}>Click a slice to filter users</div>
          <div style={{ position: "relative" }}>
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie
                  data={tierData} cx="50%" cy="50%"
                  innerRadius={48} outerRadius={72}
                  paddingAngle={3} dataKey="value" stroke="none"
                  onClick={(d) => {
                    const map = { "Pro Trial": "Pro Trial", "Free": "Free", "Pro": "Pro", "Enterprise": "Enterprise", "Expired": "Expired" };
                    if (map[d.name]) { setTab("users"); setTierFilter(map[d.name]); }
                  }}
                  style={{ cursor: "pointer" }}>
                  {tierData.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", textAlign: "center", pointerEvents: "none" }}>
              <div style={{ fontFamily: "'Fraunces',serif", fontSize: 20, fontWeight: 900, color: T.white, lineHeight: 1 }}>{stats.total}</div>
              <div style={{ fontSize: 9, color: T.textMuted, marginTop: 2 }}>total</div>
            </div>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", marginTop: 8 }}>
            {tierData.map(d => (
              <div key={d.name}
                onClick={() => { setTab("users"); setTierFilter(d.name); }}
                style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10, cursor: "pointer", padding: "3px 8px", borderRadius: 6, background: `${d.color}10`, border: `1px solid ${d.color}30` }}>
                <div style={{ width: 7, height: 7, borderRadius: 2, background: d.color, flexShrink: 0 }} />
                <span style={{ color: T.textSecondary }}>{d.name}</span>
                <span style={{ color: d.color, fontWeight: 700 }}>{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══ ACTIVITY FEED ══ */}
      <div style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 10, marginTop: 8 }}>Live Activity</div>
      <div className="chart-box fade-up" style={{ padding: 0, overflow: "hidden", marginBottom: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: `1px solid ${T.border}` }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.white }}>Activity Feed</div>
            <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>Signups · tier changes · leads · verifications</div>
          </div>
          <div style={{ fontSize: 10, color: T.textMuted }}>{activityFeed.length} recent events</div>
        </div>

        {activityFeed.length === 0 ? (
          <div style={{ padding: "36px 20px", textAlign: "center" }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(100,116,139,0.1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", color: "#64748B", fontSize: 20 }}>📭</div>
            <div style={{ fontSize: 13, color: T.textMuted }}>No recent activity yet.</div>
            <div style={{ fontSize: 11, color: T.textMuted, marginTop: 4 }}>Events will appear here as users sign up, upgrade, and interact.</div>
          </div>
        ) : (
          activityFeed.map((item, i) => (
            <div key={`${item.type}-${i}`}
              className="fade-up"
              onClick={() => {
                if (item.uid) { setTab("users"); setPendingOpenUid(item.uid); }
                else if (item.type === "lead") setTab("leads");
                else if (item.type === "verification") setTab("verification");
              }}
              style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 20px", borderBottom: i < activityFeed.length - 1 ? `1px solid ${T.border}` : "none", cursor: item.uid || item.type === "lead" || item.type === "verification" ? "pointer" : "default", transition: "background 0.15s", animationDelay: `${i * 0.04}s` }}
              onMouseEnter={e => { if (item.uid || item.type === "lead" || item.type === "verification") e.currentTarget.style.background = T.surfaceAlt; }}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: `${item.color}15`, border: `1px solid ${item.color}25`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, flexShrink: 0 }}>
                {item.icon}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: T.white, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.label}</div>
                <div style={{ fontSize: 10, color: T.textMuted, marginTop: 2 }}>{item.sub}</div>
              </div>
              <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 5, background: `${item.color}15`, color: item.color, textTransform: "uppercase", letterSpacing: 0.8, flexShrink: 0 }}>
                {item.type === "signup" ? "New User" : item.type === "upgrade" ? "Upgrade" : item.type === "downgrade" ? "Downgrade" : item.type === "lead" ? "Lead" : "KYC"}
              </span>
              <span style={{ fontSize: 10, color: T.textMuted, flexShrink: 0 }}>{timeSince(item.time)}</span>
            </div>
          ))
        )}
      </div>

      {/* ══ USER INTELLIGENCE ══ */}
      <div style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 10, marginTop: 8 }}>User Intelligence</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 24 }} className="charts-row-overview">

        {/* Expiring Trials */}
        <div className="chart-box fade-up" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 18px", borderBottom: `1px solid ${T.border}` }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.white }}>Expiring Trials</div>
              <div style={{ fontSize: 10, color: T.textMuted, marginTop: 1 }}>Trials ending within 7 days</div>
            </div>
            {stats.atRisk > 0 && (
              <span style={{ fontSize: 9, fontWeight: 700, color: T.red, background: "rgba(239,68,68,0.1)", padding: "2px 8px", borderRadius: 20, border: "1px solid rgba(239,68,68,0.2)" }}>{stats.atRisk} at risk</span>
            )}
          </div>
          {(() => {
            const expiring = users
              .filter(u => u.tier === "pro_trial" && u.trialEnd)
              .map(u => ({ ...u, daysLeft: trialDaysLeft(u) }))
              .filter(u => u.daysLeft >= 0 && u.daysLeft <= 7)
              .sort((a, b) => a.daysLeft - b.daysLeft);
            if (expiring.length === 0) return (
              <div style={{ padding: "28px 18px", textAlign: "center" }}>
                <div style={{ fontSize: 22, color: T.green, marginBottom: 6 }}>✓</div>
                <div style={{ fontSize: 12, color: T.textMuted }}>No trials expiring soon</div>
              </div>
            );
            return expiring.map((u, i) => {
              const urgency = u.daysLeft <= 1 ? T.red : u.daysLeft <= 3 ? "#F59E0B" : T.gold;
              return (
                <div key={i}
                  style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 18px", borderBottom: i < expiring.length - 1 ? `1px solid ${T.border}` : "none", cursor: "pointer", transition: "background 0.15s" }}
                  onMouseEnter={e => e.currentTarget.style.background = T.surfaceAlt}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  onClick={() => { setTab("users"); setPendingOpenUid(u.uid || u.id); }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: `${urgency}15`, border: `1px solid ${urgency}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: urgency, flexShrink: 0 }}>
                    {u.daysLeft}d
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: T.white, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.name || u.email?.split("@")[0]}</div>
                    <div style={{ fontSize: 10, color: T.textMuted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.email}</div>
                  </div>
                  <button type="button"
                    onClick={e => { e.stopPropagation(); sendNudge(u, `Trial Expiring in ${u.daysLeft} Day${u.daysLeft !== 1 ? "s" : ""}`, `Only ${u.daysLeft} day${u.daysLeft !== 1 ? "s" : ""} left. Upgrade now.`, "Pro Trial"); notify(`Email sent to ${u.name || u.email}`); }}
                    style={{ fontSize: 10, fontWeight: 700, color: urgency, background: `${urgency}10`, border: `1px solid ${urgency}30`, borderRadius: 6, padding: "4px 8px", cursor: "pointer", fontFamily: "'Outfit',sans-serif", flexShrink: 0 }}>
                    Nudge
                  </button>
                </div>
              );
            });
          })()}
        </div>

        {/* Free Users — conversion opportunity */}
        <div className="chart-box fade-up" style={{ padding: 0, overflow: "hidden", animationDelay: "0.05s" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 18px", borderBottom: `1px solid ${T.border}` }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.white }}>Free Users</div>
              <div style={{ fontSize: 10, color: T.textMuted, marginTop: 1 }}>Conversion opportunities</div>
            </div>
            <span style={{ fontSize: 12, fontWeight: 800, color: T.teal, fontFamily: "'Fraunces',serif" }}>{stats.free}</span>
          </div>
          {(() => {
            const freeUsers = users
              .filter(u => !u.tier || u.tier === "free")
              .sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0))
              .slice(0, 5);
            if (freeUsers.length === 0) return (
              <div style={{ padding: "28px 18px", textAlign: "center" }}>
                <div style={{ fontSize: 12, color: T.textMuted }}>No free users right now</div>
              </div>
            );
            return freeUsers.map((u, i) => {
              const daysSinceJoin = Math.floor((new Date() - new Date(u.createdAt || 0)) / 86400000);
              const isWarm = daysSinceJoin >= 3;
              return (
                <div key={i}
                  style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 18px", borderBottom: i < freeUsers.length - 1 ? `1px solid ${T.border}` : "none", cursor: "pointer", transition: "background 0.15s" }}
                  onMouseEnter={e => e.currentTarget.style.background = T.surfaceAlt}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  onClick={() => { setTab("users"); setPendingOpenUid(u.uid || u.id); }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: `${T.teal}15`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: T.teal, flexShrink: 0 }}>
                    {(u.name || u.email || "?")[0].toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: T.white, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.name || u.email?.split("@")[0]}</div>
                    <div style={{ fontSize: 10, color: T.textMuted }}>{daysSinceJoin}d on free · {u.country || "no country"}</div>
                  </div>
                  {isWarm && (
                    <button type="button"
                      onClick={e => { e.stopPropagation(); sendNudge(u, "Start Your Free Pro Trial", "Try all Pro features free for 7 days — no credit card needed.", "Free Plan"); notify(`Email sent to ${u.name || u.email}`); }}
                      style={{ fontSize: 10, fontWeight: 700, color: T.teal, background: `${T.teal}10`, border: `1px solid ${T.teal}30`, borderRadius: 6, padding: "4px 8px", cursor: "pointer", fontFamily: "'Outfit',sans-serif", flexShrink: 0 }}>
                      Invite
                    </button>
                  )}
                </div>
              );
            });
          })()}
        </div>

        {/* Geographic Breakdown */}
        <div className="chart-box fade-up" style={{ padding: 20, animationDelay: "0.1s" }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 4 }}>Geographic Breakdown</div>
          <div style={{ fontSize: 10, color: T.textMuted, marginBottom: 14 }}>Country filled on signup</div>
          {(() => {
            const countryCounts = {};
            users.forEach(u => {
              const c = (u.country?.trim() && u.country.trim() !== "") ? u.country.trim() : null;
              if (c) countryCounts[c] = (countryCounts[c] || 0) + 1;
            });
            const sorted       = Object.entries(countryCounts).sort((a, b) => b[1] - a[1]).slice(0, 6);
            const knownTotal   = Object.values(countryCounts).reduce((s, v) => s + v, 0);
            const unknownCount = users.length - knownTotal;
            const total        = users.length || 1;
            const colors       = [T.gold, T.teal, "#8B5CF6", "#3B82F6", "#F97316", T.green];
            if (sorted.length === 0) return (
              <div style={{ textAlign: "center", padding: "24px 0" }}>
                <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 4 }}>No country data yet</div>
                <div style={{ fontSize: 10, color: T.textMuted }}>Country is collected on email signup</div>
              </div>
            );
            return (
              <div>
                {sorted.map(([country, count], i) => {
                  const pct = Math.round((count / total) * 100);
                  return (
                    <div key={i} style={{ marginBottom: 10 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ fontSize: 12, color: T.textSecondary }}>{country}</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: colors[i] }}>{count} <span style={{ fontWeight: 400, color: T.textMuted }}>({pct}%)</span></span>
                      </div>
                      <div style={{ height: 4, background: T.surfaceAlt, borderRadius: 2 }}>
                        <div style={{ width: `${pct}%`, height: "100%", background: colors[i], borderRadius: 2, transition: "width 0.6s ease" }} />
                      </div>
                    </div>
                  );
                })}
                {unknownCount > 0 && (
                  <div style={{ fontSize: 10, color: T.textMuted, marginTop: 8, paddingTop: 8, borderTop: `1px solid ${T.border}` }}>
                    {unknownCount} user{unknownCount !== 1 ? "s" : ""} without country data
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      </div>

      {/* ══ CHURN & RETENTION ══ */}
      <div style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 10, marginTop: 8 }}>Churn & Retention</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 24 }} className="charts-row-overview">

        {/* MRR Movement */}
        <div className="chart-box fade-up" style={{ padding: 20, animationDelay: "0.1s" }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 14 }}>MRR Movement</div>
          {[
            { label: "Starting MRR", value: mrr - netMRR,   color: T.textSecondary, bar: false },
            { label: "New MRR",      value: newMRRThisMonth, color: T.green,         bar: true },
            { label: "Churned MRR",  value: -churnedMRR,    color: T.red,           bar: true },
            { label: "Net MRR",      value: netMRR,          color: netMRR >= 0 ? T.green : T.red, bar: false, bold: true },
          ].map((row, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: i < 3 ? `1px solid ${T.border}` : "none" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {row.bar ? <div style={{ width: 3, height: 14, borderRadius: 2, background: row.color }} /> : <div style={{ width: 3, height: 14 }} />}
                <span style={{ fontSize: 12, color: row.bold ? T.white : T.textMuted, fontWeight: row.bold ? 700 : 400 }}>{row.label}</span>
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: row.color, fontFamily: "'Fraunces',serif" }}>
                {row.value >= 0 ? "+" : ""}AED {Math.abs(row.value).toLocaleString()}
              </span>
            </div>
          ))}
        </div>

        {/* Retention Breakdown */}
        <div className="chart-box fade-up" style={{ padding: 20, animationDelay: "0.15s" }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 14 }}>Retention Breakdown</div>
          {[
            { label: "Paid Retained",   value: stats.paid,                              total: Math.max(stats.paid + churnThisMonth.length, 1), color: T.green },
            { label: "Trial Active",    value: stats.proTrial - stats.atRisk,           total: Math.max(stats.proTrial, 1),                     color: T.gold },
            { label: "At Risk",         value: stats.atRisk,                            total: Math.max(stats.proTrial, 1),                     color: T.red },
            { label: "Churned (month)", value: churnThisMonth.length,                  total: Math.max(stats.paid + churnThisMonth.length, 1),  color: "#F97316" },
          ].map((row, i) => {
            const pct = Math.round((row.value / row.total) * 100);
            return (
              <div key={i} style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                  <span style={{ fontSize: 11, color: T.textMuted }}>{row.label}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: row.color }}>{row.value} <span style={{ fontWeight: 400, color: T.textMuted }}>({pct}%)</span></span>
                </div>
                <div style={{ height: 4, background: T.surfaceAlt, borderRadius: 2, overflow: "hidden" }}>
                  <div style={{ width: `${pct}%`, height: "100%", background: row.color, borderRadius: 2, transition: "width 0.6s ease" }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Churn Events */}
        <div className="chart-box fade-up" style={{ padding: 20, animationDelay: "0.2s" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: 1.2 }}>Recent Churns</div>
            <span style={{ fontSize: 10, color: churnThisMonth.length > 0 ? T.red : T.green, fontWeight: 700, background: churnThisMonth.length > 0 ? "rgba(239,68,68,0.1)" : "rgba(16,185,129,0.1)", padding: "2px 8px", borderRadius: 20 }}>
              {churnThisMonth.length} this month
            </span>
          </div>
          {churnEvents.length === 0 ? (
            <div style={{ textAlign: "center", padding: "24px 0", color: T.textMuted, fontSize: 12 }}>
              <div style={{ fontSize: 28, marginBottom: 8, color: T.green, opacity: 0.7 }}>✓</div>
              No churn events recorded
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {churnEvents.slice(0, 5).map((ev, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: i < Math.min(churnEvents.length, 5) - 1 ? `1px solid ${T.border}` : "none" }}>
                  <div>
                    <div style={{ fontSize: 12, color: T.white, fontWeight: 600 }}>
                      {(() => { const u = users.find(x => x.uid === ev.uid || x.uid === ev.userId); return ev.userName || ev.userEmail || u?.name || u?.email || ev.uid?.slice(0, 8) || "Unknown"; })()}
                    </div>
                    <div style={{ fontSize: 10, color: T.textMuted, marginTop: 2 }}>
                      <span style={{ color: T.red, fontWeight: 600 }}>{ev.from}</span> → <span style={{ color: T.textSecondary }}>{ev.to}</span>
                    </div>
                  </div>
                  <span style={{ fontSize: 10, color: T.textMuted, flexShrink: 0 }}>{timeSince(ev.changedAt)}</span>
                </div>
              ))}
              {churnEvents.length > 5 && (
                <div style={{ fontSize: 11, color: T.textMuted, textAlign: "center", paddingTop: 10 }}>+{churnEvents.length - 5} more</div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ══ REVENUE TREND (ARPU & MRR over 6 months) ══ */}
      <div style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 10, marginTop: 8 }}>Revenue Trend</div>
      <div className="chart-box fade-up" style={{ padding: 20, marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18, flexWrap: "wrap", gap: 8 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.white }}>ARPU & MRR Over Time</div>
            <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>Derived from user tier history · Updates as users join and upgrade</div>
          </div>
          <div style={{ display: "flex", gap: 16 }}>
            {[["MRR", T.green], ["ARPU", "#8B5CF6"], ["Paid Users", T.teal]].map(([name, color]) => (
              <span key={name} style={{ fontSize: 10, color: T.textSecondary, display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ width: 16, height: 2, background: color, display: "inline-block", borderRadius: 1 }} />
                {name}
              </span>
            ))}
          </div>
        </div>

        {!hasRevenueData ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: T.textMuted, fontSize: 12 }}>
            No revenue data yet — will populate as users upgrade to paid plans
          </div>
        ) : (
          <div>
            <div style={{ position: "relative", height: chartH + 24, overflowX: "auto" }}>
              <svg width="100%" height={chartH + 24} viewBox={`0 0 ${pts * 80} ${chartH + 24}`} preserveAspectRatio="none" style={{ display: "block" }}>
                <defs>
                  <linearGradient id="gMrr" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={T.green} stopOpacity="0.2" />
                    <stop offset="100%" stopColor={T.green} stopOpacity="0" />
                  </linearGradient>
                </defs>
                {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => (
                  <line key={i} x1="0" y1={chartH * pct} x2={pts * 80} y2={chartH * pct} stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
                ))}
                <path
                  d={monthlyTrend.map((d, i) => {
                    const x = (i / (pts - 1 || 1)) * (pts * 80 - 40) + 20;
                    const y = chartH - (d.mrr / maxMrr) * (chartH - 20);
                    return `${i === 0 ? "M" : "L"}${x},${y}`;
                  }).join(" ") + ` L${pts * 80 - 20},${chartH} L20,${chartH} Z`}
                  fill="url(#gMrr)"
                />
                <path
                  d={monthlyTrend.map((d, i) => {
                    const x = (i / (pts - 1 || 1)) * (pts * 80 - 40) + 20;
                    const y = chartH - (d.mrr / maxMrr) * (chartH - 20);
                    return `${i === 0 ? "M" : "L"}${x},${y}`;
                  }).join(" ")}
                  fill="none" stroke={T.green} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                />
                <path
                  d={monthlyTrend.map((d, i) => {
                    const x = (i / (pts - 1 || 1)) * (pts * 80 - 40) + 20;
                    const y = chartH - (d.arpu / maxArpu) * (chartH - 20);
                    return `${i === 0 ? "M" : "L"}${x},${y}`;
                  }).join(" ")}
                  fill="none" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="5 3"
                />
                {monthlyTrend.map((d, i) => {
                  const x    = (i / (pts - 1 || 1)) * (pts * 80 - 40) + 20;
                  const yMrr  = chartH - (d.mrr  / maxMrr)  * (chartH - 20);
                  const yArpu = chartH - (d.arpu / maxArpu) * (chartH - 20);
                  return (
                    <g key={i}>
                      {d.mrr  > 0 && <circle cx={x} cy={yMrr}  r="4" fill={T.green}   stroke={T.surface} strokeWidth="2" />}
                      {d.mrr  > 0 && <text x={x} y={yMrr  - 8} textAnchor="middle" fontSize="8" fill={T.green}   fontFamily="Outfit,sans-serif">{d.mrr.toLocaleString()}</text>}
                      {d.arpu > 0 && <circle cx={x} cy={yArpu} r="3" fill="#8B5CF6" stroke={T.surface} strokeWidth="2" />}
                      <text x={x} y={chartH + 16} textAnchor="middle" fontSize="9" fill="#64748B" fontFamily="Outfit,sans-serif">{d.label}</text>
                    </g>
                  );
                })}
              </svg>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginTop: 16, paddingTop: 16, borderTop: `1px solid ${T.border}` }}>
              {[
                { label: "Current MRR",   value: `AED ${mrr.toLocaleString()}`, color: T.green },
                { label: "Current ARPU",  value: `AED ${arpu}`,                  color: "#8B5CF6" },
                { label: "MRR Growth",    value: (() => { const prev = monthlyTrend[monthlyTrend.length - 2]?.mrr || 0; if (!prev) return "—"; const g = Math.round(((mrr - prev) / prev) * 100); return `${g >= 0 ? "+" : ""}${g}%`; })(), color: (() => { const prev = monthlyTrend[monthlyTrend.length - 2]?.mrr || 0; if (!prev) return T.textMuted; return mrr >= prev ? T.green : T.red; })() },
                { label: "Projected ARR", value: `AED ${arr.toLocaleString()}`,  color: T.gold },
              ].map((s, i) => (
                <div key={i} style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: s.color, fontFamily: "'Fraunces',serif" }}>{s.value}</div>
                  <div style={{ fontSize: 10, color: T.textMuted, marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ══ TRIAL PIPELINE ══ */}
      <div style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 10, marginTop: 8 }}>Trial Pipeline</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }} className="charts-row-overview">

        {/* Conversion Funnel */}
        <div className="chart-box fade-up" style={{ padding: 20 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 16 }}>Conversion Funnel</div>
          {[
            { label: "Signed Up",          value: stats.total,   color: T.textSecondary },
            { label: "Activated Trial",    value: everTrialled,  color: T.gold },
            { label: "Converted to Paid",  value: stats.paid,    color: T.green },
          ].map((step, i, arr) => {
            const max     = stats.total || 1;
            const pct     = Math.round((step.value / max) * 100);
            const convPct = i > 0 ? Math.round((step.value / (arr[i - 1].value || 1)) * 100) : 100;
            return (
              <div key={i} style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: step.color }} />
                    <span style={{ fontSize: 12, color: T.textSecondary }}>{step.label}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {i > 0 && <span style={{ fontSize: 10, color: convPct >= 50 ? T.green : T.red, fontWeight: 700 }}>{convPct}% from prev</span>}
                    <span style={{ fontSize: 13, fontWeight: 800, color: step.color, fontFamily: "'Fraunces',serif" }}>{step.value}</span>
                  </div>
                </div>
                <div style={{ height: 6, background: T.surfaceAlt, borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ width: `${pct}%`, height: "100%", background: step.color, borderRadius: 3, transition: "width 0.8s ease", opacity: 0.85 }} />
                </div>
              </div>
            );
          })}
          <div style={{ marginTop: 16, paddingTop: 14, borderTop: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 11, color: T.textMuted }}>Overall conversion</span>
            <span style={{ fontSize: 13, fontWeight: 800, color: stats.paid > 0 ? T.green : T.textMuted, fontFamily: "'Fraunces',serif" }}>
              {stats.total > 0 ? Math.round((stats.paid / stats.total) * 100) : 0}%
            </span>
          </div>
        </div>

        {/* Expired — not converted (win-back) */}
        <div className="chart-box fade-up" style={{ padding: 20, animationDelay: "0.05s" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: 1.2 }}>Expired — Not Converted</div>
            <span style={{ fontSize: 10, color: stats.expired > 0 ? T.red : T.green, fontWeight: 700, background: stats.expired > 0 ? "rgba(239,68,68,0.1)" : "rgba(16,185,129,0.1)", padding: "2px 8px", borderRadius: 20 }}>{stats.expired} total</span>
          </div>
          {(() => {
            const expired = users
              .filter(u => u.tier === "free" && u.trialEnd && new Date(u.trialEnd) < new Date())
              .sort((a, b) => new Date(b.trialEnd) - new Date(a.trialEnd))
              .slice(0, 5);
            if (expired.length === 0) return (
              <div style={{ textAlign: "center", padding: "24px 0" }}>
                <div style={{ fontSize: 22, color: T.green, marginBottom: 6 }}>✓</div>
                <div style={{ fontSize: 12, color: T.textMuted }}>No expired trials yet</div>
              </div>
            );
            return expired.map((u, i) => {
              const expiredDaysAgo  = Math.floor((new Date() - new Date(u.trialEnd)) / 86400000);
              const isRecoverable   = expiredDaysAgo <= 14;
              return (
                <div key={i}
                  style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: i < expired.length - 1 ? `1px solid ${T.border}` : "none", cursor: "pointer", transition: "background 0.15s" }}
                  onClick={() => { setTab("users"); setPendingOpenUid(u.uid || u.id); }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(239,68,68,0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: T.red, flexShrink: 0 }}>
                    {(u.name || u.email || "?")[0].toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: T.white, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.name || u.email?.split("@")[0]}</div>
                    <div style={{ fontSize: 10, color: T.textMuted }}>Expired {expiredDaysAgo}d ago</div>
                  </div>
                  {isRecoverable && (
                    <button type="button"
                      onClick={e => { e.stopPropagation(); sendNudge(u, "Come Back — Special Offer", "Your trial ended but we'd love to have you back. Contact us for a special rate.", "Expired Trial"); notify(`Win-back email sent to ${u.name || u.email}`); }}
                      style={{ fontSize: 10, fontWeight: 700, color: T.red, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 6, padding: "4px 8px", cursor: "pointer", fontFamily: "'Outfit',sans-serif", flexShrink: 0 }}>
                      Win-back
                    </button>
                  )}
                </div>
              );
            });
          })()}
        </div>
      </div>

    </>
  );
}
