import React, { useState, useEffect, useRef, useCallback } from "react";
import { collection, getDocs, doc, getDoc, setDoc, deleteDoc, onSnapshot, query, orderBy, limit, where, addDoc, updateDoc } from "firebase/firestore";
import { auth, db, storage } from "../../../firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { sendPasswordResetEmail } from "firebase/auth";
import { BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from "recharts";
import { emaarProjects as defaultProjects, emaarCommunities as defaultCommunities, emaarYields as defaultYields, communityROI as defaultCommunityROI, communityIntel as defaultCommunityIntel } from "../../../data";

function AdminAuditLogTab({

  // ── Computed stats (from users + auditLog props) ──────────────────
  const now           = new Date();
  const msPerDay      = 86400000;
  const msPerWeek     = msPerDay * 7;
  const todayStr      = now.toDateString();
  const stats = {
    total:      users.length,
    today:      users.filter(u => { try { return new Date(u.createdAt).toDateString() === todayStr; } catch { return false; } }).length,
    thisWeek:   users.filter(u => { try { return (now - new Date(u.createdAt)) < msPerWeek; } catch { return false; } }).length,
    thisMonth:  users.filter(u => { try { const d = new Date(u.createdAt); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); } catch { return false; } }).length,
    proTrial:   users.filter(u => u.tier === "pro_trial" && (!u.trialEnd || new Date(u.trialEnd) > now)).length,
    free:       users.filter(u => u.tier === "free" || !u.tier).length,
    expired:    users.filter(u => u.tier === "pro_trial" && u.trialEnd && new Date(u.trialEnd) <= now).length,
    pro:        users.filter(u => u.tier === "pro").length,
    enterprise: users.filter(u => u.tier === "enterprise").length,
    suspended:  users.filter(u => u.suspended).length,
    activeToday: users.filter(u => u.lastLoginAt && (now - new Date(u.lastLoginAt)) < msPerDay).length,
    activeThisWeek: users.filter(u => u.lastLoginAt && (now - new Date(u.lastLoginAt)) < msPerWeek).length,
  };
  stats.paid     = stats.pro + stats.enterprise;
  stats.freeOnly = stats.free;
  stats.atRisk   = users.filter(u => { try { const d = trialDaysLeft ? trialDaysLeft(u) : null; return d !== null && d <= 3 && d >= 0; } catch { return false; } }).length;
  const mrr  = (stats.pro * 99) + (stats.enterprise * 499);
  const arr  = mrr * 12;
  const arpu = stats.paid > 0 ? Math.round(mrr / stats.paid) : 0;
  const everTrialled = stats.proTrial + stats.pro + stats.expired;
  const trialConversion = everTrialled > 0 ? Math.round((stats.pro / everTrialled) * 100) : 0;
  const churnEvents = (auditLog || []).filter(l =>
    l.action === "tier_change" &&
    (l.from === "pro" || l.from === "enterprise") &&
    (l.to === "free" || l.to === "pro_trial")
  );
  const churnThisMonth = churnEvents.filter(l => {
    try { const d = new Date(l.changedAt); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); } catch { return false; }
  });
  const churnedMRR = churnThisMonth.reduce((s, l) => s + (l.from === "enterprise" ? 499 : 99), 0);
  const weekTrend = (current, previous) => {
    if (previous === 0 && current === 0) return { pct: 0, dir: "flat", label: "—" };
    if (previous === 0) return { pct: 100, dir: "up", label: \`+\${current} new\` };
    const pct = Math.round(((current - previous) / previous) * 100);
    return { pct: Math.abs(pct), dir: pct > 0 ? "up" : pct < 0 ? "down" : "flat", label: pct > 0 ? \`↑\${Math.abs(pct)}%\` : pct < 0 ? \`↓\${Math.abs(pct)}%\` : "=" };
  };
  // ─────────────────────────────────────────────────────────────────
 auditLog, users, emaarProjects, fetchAuditLog, setTab, setPendingOpenUid, T, I, notify, db, auditRetentionDays, setAuditRetentionDays, auditWebhookUrl, setAuditWebhookUrl, auditAlertThr, setAuditAlertThr, apiKeys, setApiKeys, logAudit }) {

    // ΓöÇΓöÇ STATS ΓöÇΓöÇ
    const thisWeek = auditLog.filter(l => {
      try { return (Date.now() - new Date(l.changedAt).getTime()) < 7 * 24 * 60 * 60 * 1000; } catch { return false; }
    }).length;
    const tierChanges    = auditLog.filter(l => l.action === "tier_change").length;
    const bulkActions    = auditLog.filter(l => l.action === "bulk_tier_change").length;
    const projectUpdates = auditLog.filter(l => ["project_update","project_create"].includes(l.action)).length;

    // ΓöÇΓöÇ 7-DAY SPARKLINE ΓöÇΓöÇ
    const last7 = Array.from({length:7}, (_,i) => {
      const d = new Date(); d.setDate(d.getDate() - (6-i));
      const day = d.toDateString();
      return { day: d.toLocaleDateString("en-AE",{weekday:"short"}), count: auditLog.filter(l => { try { return new Date(l.changedAt).toDateString() === day; } catch { return false; }}).length };
    });
    const maxDay = Math.max(...last7.map(d=>d.count), 1);

    // ΓöÇΓöÇ 30-DAY ACTIVITY DATA ΓöÇΓöÇ
    const last30 = Array.from({ length: 30 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (29 - i));
      const day = d.toDateString();
      const count = auditLog.filter(l => { try { return new Date(l.changedAt).toDateString() === day; } catch { return false; } }).length;
      return { day: d.toLocaleDateString("en-AE", { day: "2-digit", month: "short" }), count };
    });
    const max30 = Math.max(...last30.map(d => d.count), 1);

    return (
      <>
        {/* ΓòÉΓòÉ STATS TOPBAR ΓòÉΓòÉ */}
        <div className="fade-up" style={{ display: "flex", alignItems: "center", gap: 0, borderRadius: 14, background: T.surface, border: `1px solid ${T.border}`, marginBottom: 24, overflow: "hidden" }}>
          <button type="button" onClick={fetchAuditLog} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, padding: "10px 14px", background: T.goldGlow, border: "none", borderRight: `1px solid ${T.border}`, color: T.gold, cursor: "pointer", fontFamily: "'Outfit',sans-serif", fontWeight: 600, flexShrink: 0 }}>{I.refresh}</button>
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 18px", borderRight: `1px solid ${T.border}`, flexShrink: 0 }}>
<div style={{ width: 8, height: 8, borderRadius: "50%", background: T.green, boxShadow: `0 0 8px ${T.green}` }} />
<span style={{ fontSize: 11, fontWeight: 700, color: T.green }}>Audit Log Active</span>
          </div>
          {[
{ label: "Total Events",    value: auditLog.length,                                                                   color: T.gold    },
{ label: "Tier Changes",    value: tierChanges,                                                                        color: T.orange  },
{ label: "Bulk Actions",    value: bulkActions,                                                                        color: "#8B5CF6" },
{ label: "Project Updates", value: projectUpdates,                                                                     color: T.blue    },
{ label: "This Week",       value: thisWeek,                                                                           color: T.green   },
{ label: "Logins",          value: auditLog.filter(l => l.action === "admin_login").length,                           color: T.teal    },
{ label: "IP Tracked",      value: auditLog.filter(l => l.ip && l.ip !== "unknown").length,                          color: "#14B8A6" },
          ].map((item, i) => (
<div key={i} style={{ display: "flex", flexDirection: "column", padding: "10px 20px", borderRight: `1px solid ${T.border}`, flexShrink: 0 }}>
  <span style={{ fontSize: 9, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: 1 }}>{item.label}</span>
  <span style={{ fontSize: 18, fontWeight: 900, color: item.color, fontFamily: "'Fraunces',serif", lineHeight: 1.2 }}>{item.value}</span>
</div>
          ))}
          {/* 7-day sparkline */}
          <div style={{ display: "flex", alignItems: "flex-end", gap: 3, padding: "12px 20px", marginLeft: "auto", flexShrink: 0 }}>
<span style={{ fontSize: 9, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: 1, marginRight: 6, alignSelf: "center" }}>Last 7 Days</span>
{last7.map((d,i) => (
  <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
    <div style={{ width: 14, height: Math.max(4, Math.round((d.count/maxDay)*32)), background: d.count > 0 ? T.gold : T.border, borderRadius: "3px 3px 0 0", transition: "height 0.3s", opacity: i === 6 ? 1 : 0.6 }} />
    <span style={{ fontSize: 8, color: T.textMuted }}>{d.day}</span>
  </div>
))}
          </div>
        </div>

        {/* ΓòÉΓòÉ 30-DAY ACTIVITY CHART ΓòÉΓòÉ */}
        <div className="chart-box fade-up" style={{ marginBottom: 24, padding: "16px 20px 12px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
<div>
  <div style={{ fontSize: 13, fontWeight: 700, color: T.white }}>Activity ΓÇö Last 30 Days</div>
  <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>{auditLog.length} total events ┬╖ {last30.filter(d => d.count > 0).length} active days</div>
</div>
<div style={{ fontSize: 10, color: T.textMuted }}>
  Peak: <span style={{ color: T.gold, fontWeight: 700 }}>{max30} events/day</span>
</div>
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 52 }}>
{last30.map((d, i) => (
  <div key={i} title={`${d.day}: ${d.count} event${d.count !== 1 ? "s" : ""}`}
    style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", gap: 2, cursor: d.count > 0 ? "default" : "default" }}>
    <div style={{ width: "100%", height: Math.max(2, Math.round((d.count / max30) * 44)), background: d.count > 0 ? (i === 29 ? T.gold : `${T.gold}70`) : T.border, borderRadius: "2px 2px 0 0", transition: "height 0.3s" }} />
  </div>
))}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
<span style={{ fontSize: 9, color: T.textMuted }}>{last30[0]?.day}</span>
<span style={{ fontSize: 9, color: T.textMuted }}>{last30[14]?.day}</span>
<span style={{ fontSize: 9, color: T.gold, fontWeight: 700 }}>Today</span>
          </div>
        </div>

        {/* ΓòÉΓòÉ SECTION LABEL ΓòÉΓòÉ */}
        <div style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 12 }}>Data Update Calendar</div>

        {/* ΓòÉΓòÉ CALENDAR + CHECKLIST ΓòÉΓòÉ */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
          <DataCalendar T={T} now={now} />
          <UpdateChecklist T={T} />
        </div>

        {/* ΓòÉΓòÉ SECTION LABEL ΓòÉΓòÉ */}
        <div style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 12 }}>Action History</div>

        {/* ΓòÉΓòÉ AUDIT LOG TABLE ΓòÉΓòÉ */}
        <AuditLogTable
          auditLog={auditLog}
          users={users}
          emaarProjects={emaarProjects}
          fetchAuditLog={fetchAuditLog}
          setTab={setTab}
          setPendingOpenUid={setPendingOpenUid}
          T={T}
        />

        {/* ΓòÉΓòÉ AUDIT SETTINGS PANEL ΓòÉΓòÉ */}
        <div style={{ marginTop: 28 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 14 }}>Audit Settings & Integrations</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>

{/* Retention Policy */}
<div style={{ background: T.surface, borderRadius: 14, border: `1px solid ${T.border}`, padding: "16px 18px" }}>
  <div style={{ fontSize: 12, fontWeight: 700, color: T.white, marginBottom: 4 }}> Log Retention</div>
  <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 10 }}>Auto-delete logs older than:</div>
  <select value={auditRetentionDays} onChange={e => setAuditRetentionDays(parseInt(e.target.value))}
    style={{ width: "100%", padding: "8px 10px", background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8, color: T.white, fontSize: 12, fontFamily: "'Outfit',sans-serif", marginBottom: 8 }}>
    <option value={0}>Forever (no auto-delete)</option>
    <option value={30}>30 days</option>
    <option value={90}>90 days</option>
    <option value={365}>1 year</option>
    <option value={730}>2 years</option>
  </select>
  <button type="button" onClick={async () => {
    try {
      await setDoc(doc(db, "adminSettings", "auditRetention"), { days: auditRetentionDays, updatedAt: new Date().toISOString() });
      await logAudit(db, { action: "retention_policy_updated", days: auditRetentionDays });
      setAuditRetentionSaved(true);
      setTimeout(() => setAuditRetentionSaved(false), 2000);
    } catch(e) {}
  }}
    style={{ width: "100%", padding: "7px 0", borderRadius: 8, border: `1px solid ${auditRetentionSaved ? T.green : T.border}`, background: auditRetentionSaved ? `${T.green}15` : "transparent", color: auditRetentionSaved ? T.green : T.textSecondary, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>
    {auditRetentionSaved ? "Γ£ô Saved" : "Save Policy"}
  </button>
</div>

{/* Webhook / SIEM */}
<div style={{ background: T.surface, borderRadius: 14, border: `1px solid ${T.border}`, padding: "16px 18px" }}>
  <div style={{ fontSize: 12, fontWeight: 700, color: T.white, marginBottom: 4 }}> Webhook / SIEM</div>
  <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 10 }}>Push each audit event to your SIEM in real-time:</div>
  <input value={auditWebhookUrl} onChange={e => setAuditWebhookUrl(e.target.value)}
    placeholder="https://hooks.splunk.com/..."
    style={{ width: "100%", padding: "8px 10px", background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8, color: T.white, fontSize: 11, fontFamily: "'Courier New',monospace", marginBottom: 8, boxSizing: "border-box" }} />
  <button type="button" onClick={async () => {
    setAuditWebhook(auditWebhookUrl || null);
    try {
      await setDoc(doc(db, "adminSettings", "auditWebhook"), { url: auditWebhookUrl, updatedAt: new Date().toISOString() });
      await logAudit(db, { action: "webhook_updated", urlSet: !!auditWebhookUrl });
      setAuditWebhookSaved(true);
      setTimeout(() => setAuditWebhookSaved(false), 2000);
    } catch(e) {}
  }}
    style={{ width: "100%", padding: "7px 0", borderRadius: 8, border: `1px solid ${auditWebhookSaved ? T.green : T.border}`, background: auditWebhookSaved ? `${T.green}15` : "transparent", color: auditWebhookSaved ? T.green : T.textSecondary, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>
    {auditWebhookSaved ? "Γ£ô Webhook Active" : "Save Webhook"}
  </button>
  <div style={{ marginTop: 8, fontSize: 10, color: T.textMuted }}>Compatible: Splunk HEC ┬╖ Datadog ┬╖ Azure Event Hub ┬╖ custom endpoints</div>
</div>

{/* Alert Threshold */}
<div style={{ background: T.surface, borderRadius: 14, border: `1px solid ${T.border}`, padding: "16px 18px" }}>
  <div style={{ fontSize: 12, fontWeight: 700, color: T.white, marginBottom: 4 }}> Alert Threshold</div>
  <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 10 }}>Email alert if this many tier changes happen in 5 min:</div>
  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
    <input type="range" min={1} max={50} value={auditAlertThr} onChange={e => setAuditAlertThr(parseInt(e.target.value))}
      style={{ flex: 1, accentColor: T.gold }} />
    <span style={{ fontSize: 14, fontWeight: 800, color: T.gold, minWidth: 28, textAlign: "right" }}>{auditAlertThr}</span>
  </div>
  <button type="button" onClick={async () => {
    setAlertThreshold(auditAlertThr);
    try {
      await setDoc(doc(db, "adminSettings", "auditAlertThreshold"), { threshold: auditAlertThr, updatedAt: new Date().toISOString() });
      await logAudit(db, { action: "alert_threshold_updated", threshold: auditAlertThr });
      setAuditAlertSaved(true);
      setTimeout(() => setAuditAlertSaved(false), 2000);
    } catch(e) {}
  }}
    style={{ width: "100%", padding: "7px 0", borderRadius: 8, border: `1px solid ${auditAlertSaved ? T.green : T.border}`, background: auditAlertSaved ? `${T.green}15` : "transparent", color: auditAlertSaved ? T.green : T.textSecondary, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>
    {auditAlertSaved ? "Γ£ô Threshold Set" : "Save Threshold"}
  </button>
  <div style={{ marginTop: 8, fontSize: 10, color: T.textMuted }}>Alert sent via EmailJS to {adminUser?.email || "admin"}</div>
</div>
          </div>
        </div>

        {/* ΓòÉΓòÉ REST API PANEL ΓòÉΓòÉ */}
        <div style={{ marginTop: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
<div style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: 1.5 }}>REST API</div>
<div style={{ display: "flex", alignItems: "center", gap: 6, padding: "3px 10px", borderRadius: 6, background: `${T.green}12`, border: `1px solid ${T.green}30` }}>
  <div style={{ width: 5, height: 5, borderRadius: "50%", background: T.green }} />
  <span style={{ fontSize: 9, fontWeight: 800, color: T.green, letterSpacing: 0.5 }}>LIVE</span>
</div>
<span style={{ fontSize: 10, color: T.textMuted, fontFamily: "'Courier New', monospace" }}>{API_BASE}</span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>

{/* API Key Generator */}
<div style={{ background: T.surface, borderRadius: 14, border: `1px solid ${T.gold}30`, padding: "18px 20px" }}>
  <div style={{ fontSize: 12, fontWeight: 700, color: T.gold, marginBottom: 4 }}> Generate API Key</div>
  <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 12 }}>Keys authenticate external systems. Each key is hashed ΓÇö shown once only.</div>

  <input value={apiKeyLabel} onChange={e => setApiKeyLabel(e.target.value)}
    placeholder="Label e.g. Splunk Integration"
    style={{ width: "100%", padding: "8px 10px", background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8, color: T.white, fontSize: 12, fontFamily: "'Outfit',sans-serif", marginBottom: 8, boxSizing: "border-box" }} />

  <button type="button" disabled={apiKeyGenerating} onClick={async () => {
    setApiKeyGenerating(true); setNewApiKey(null);
    try {
      // Generate locally: dxb_ + 48 hex chars
      const arr = new Uint8Array(24);
      window.crypto.getRandomValues(arr);
      const raw = "dxb_" + Array.from(arr).map(b => b.toString(16).padStart(2,"0")).join("");
      // Hash with SubtleCrypto
      const enc = new TextEncoder().encode(raw);
      const hashBuf = await window.crypto.subtle.digest("SHA-256", enc);
      const hash = Array.from(new Uint8Array(hashBuf)).map(b => b.toString(16).padStart(2,"0")).join("");
      // Save hash to Firestore
      const existing = apiKeys || [];
      const newKeys = [...existing, { hash, label: apiKeyLabel || "API Key", createdAt: new Date().toISOString(), active: true, useCount: 0 }];
      await setDoc(doc(db, "adminSettings", "apiKeys"), { keys: newKeys });
      setApiKeys(newKeys);
      setNewApiKey(raw);
      await logAudit(db, { action: "api_key_generated", label: apiKeyLabel });
    } catch(e) { notify("Error generating key: " + e.message); }
    setApiKeyGenerating(false);
  }}
    style={{ width: "100%", padding: "9px 0", borderRadius: 9, border: `1px solid ${T.gold}40`, background: `${T.gold}12`, color: T.gold, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>
    {apiKeyGenerating ? "Generating..." : "Γ£ª Generate New Key"}
  </button>

  {newApiKey && (
    <div style={{ marginTop: 12, padding: "12px 14px", borderRadius: 10, background: `${T.green}08`, border: `1px solid ${T.green}30` }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: T.green, marginBottom: 6 }}>ΓÜá Copy now ΓÇö not shown again</div>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <div style={{ flex: 1, fontSize: 9, fontFamily: "'Courier New', monospace", color: T.white, wordBreak: "break-all", lineHeight: 1.4, background: T.surfaceAlt, padding: "6px 8px", borderRadius: 6 }}>{newApiKey}</div>
        <button type="button" onClick={() => { navigator.clipboard.writeText(newApiKey); setApiKeyCopied(true); setTimeout(() => setApiKeyCopied(false), 2000); }}
          style={{ padding: "6px 10px", borderRadius: 7, border: `1px solid ${apiKeyCopied ? T.green : T.border}`, background: apiKeyCopied ? `${T.green}15` : T.surfaceAlt, color: apiKeyCopied ? T.green : T.textSecondary, fontSize: 11, cursor: "pointer", fontFamily: "'Outfit',sans-serif", fontWeight: 700, flexShrink: 0 }}>
          {apiKeyCopied ? "Γ£ô" : "Copy"}
        </button>
      </div>
    </div>
  )}

  {/* Active keys list */}
  {apiKeys.filter(k => k.active !== false).length > 0 && (
    <div style={{ marginTop: 12 }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, marginBottom: 6 }}>Active Keys</div>
      {apiKeys.filter(k => k.active !== false).map((k, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: `1px solid ${T.border}` }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: T.green, flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: T.white }}>{k.label}</div>
            <div style={{ fontSize: 9, color: T.textMuted }}>{k.createdAt?.slice(0,10)} ┬╖ {k.useCount || 0} uses</div>
          </div>
          <button type="button" onClick={async () => {
            const updated = apiKeys.map(key => key.hash === k.hash ? { ...key, active: false, revokedAt: new Date().toISOString() } : key);
            await setDoc(doc(db, "adminSettings", "apiKeys"), { keys: updated });
            setApiKeys(updated);
            await logAudit(db, { action: "api_key_revoked", label: k.label });
            notify("Key revoked");
          }} style={{ padding: "3px 8px", borderRadius: 5, border: "1px solid rgba(239,68,68,0.25)", background: "rgba(239,68,68,0.06)", color: T.red, fontSize: 9, fontWeight: 700, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>
            Revoke
          </button>
        </div>
      ))}
    </div>
  )}
</div>

{/* API Docs */}
<div style={{ background: T.surface, borderRadius: 14, border: `1px solid ${T.border}`, padding: "18px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
  <div style={{ fontSize: 12, fontWeight: 700, color: T.white, marginBottom: 2 }}> API Reference</div>
  {[
    { method: "GET", path: "/health", auth: false, desc: "Health check ΓÇö no auth required" },
    { method: "GET", path: "/logs", auth: true, desc: "Fetch events. Params: from, to, action, actor, ip, limit, offset, format=csv" },
    { method: "GET", path: "/stats", auth: true, desc: "Summary counts by action, today, this week, IP tracked, unique actors" },
    { method: "POST", path: "/apikey", auth: true, desc: "Generate a new API key. Body: { label, revokeHash }" },
  ].map((e, i) => (
    <div key={i} style={{ padding: "8px 10px", borderRadius: 8, background: T.surfaceAlt, border: `1px solid ${T.border}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
        <span style={{ fontSize: 9, fontWeight: 800, padding: "2px 7px", borderRadius: 4, background: e.method === "GET" ? `${T.blue}20` : `${T.green}20`, color: e.method === "GET" ? T.blue : T.green }}>{e.method}</span>
        <span style={{ fontSize: 10, fontFamily: "'Courier New', monospace", color: T.gold }}>{e.path}</span>
        {!e.auth && <span style={{ fontSize: 9, color: T.textMuted, marginLeft: "auto" }}>public</span>}
      </div>
      <div style={{ fontSize: 10, color: T.textMuted, lineHeight: 1.4 }}>{e.desc}</div>
    </div>
  ))}

  <div style={{ marginTop: 4, padding: "10px 12px", borderRadius: 8, background: `${T.gold}06`, border: `1px solid ${T.gold}20` }}>
    <div style={{ fontSize: 10, fontWeight: 700, color: T.gold, marginBottom: 4 }}>Authentication</div>
    <div style={{ fontSize: 10, color: T.textMuted, fontFamily: "'Courier New', monospace", lineHeight: 1.8 }}>
      curl -H "X-API-Key: dxb_xxx..." \<br/>
      &nbsp;&nbsp;"{API_BASE}/logs?action=tier_change&limit=50"
    </div>
  </div>
</div>
          </div>
        </div>
      </>
    );
}

export default AdminAuditLogTab;
