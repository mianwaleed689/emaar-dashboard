import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { db } from "../firebase";
import { collection, getDocs, doc, getDoc, setDoc, deleteDoc, onSnapshot, query, orderBy, limit, where, addDoc, updateDoc } from "firebase/firestore";
import { BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { T } from "../theme";
import emailjs from "@emailjs/browser";

function NotificationsTab({ T, notify, adminUser, I, users, db }) {
  const [notifSubTab, setNotifSubTab] = React.useState("compose");
  const [notifForm, setNotifForm] = React.useState({ title: "", message: "", icon: "🔔", type: "info", link: "" });
  const [notifSending, setNotifSending] = React.useState(false);
  const [sentNotifs, setSentNotifs] = React.useState([]);
  const [templates, setTemplates] = React.useState([]);
  const [targetType, setTargetType] = React.useState("all");
  const [targetTier, setTargetTier] = React.useState("pro");
  const [targetUserId, setTargetUserId] = React.useState("");
  const [searchUser, setSearchUser] = React.useState("");
  const [showTemplateModal, setShowTemplateModal] = React.useState(false);
  const [templateName, setTemplateName] = React.useState("");
  const [editingTemplate, setEditingTemplate] = React.useState(null);
  const [scheduleEnabled, setScheduleEnabled] = React.useState(false);
  const [scheduleDate, setScheduleDate] = React.useState("");
  const [scheduleTime, setScheduleTime] = React.useState("09:00");
  const [selectedNotifs, setSelectedNotifs] = React.useState([]);
  const [historyFilter, setHistoryFilter] = React.useState("all");
  const [historySearch, setHistorySearch] = React.useState("");
  const [lastResult, setLastResult] = React.useState(null);
  const [emailForm, setEmailForm] = React.useState({ subject: "", body: "", preheader: "" });
  const [emailSending, setEmailSending] = React.useState(false);
  const [emailTargetType, setEmailTargetType] = React.useState("all");
  const [emailTargetTier, setEmailTargetTier] = React.useState("pro");
  const [scheduledNotifs, setScheduledNotifs] = React.useState([]);

  const ICONS = ["🔔", "📣", "🎯", "⚠️", "🏆", "🌟", "📈", "🔇", "✅", "📊", "🔑", "🎁"];
  const TYPES = [
    { id: "info",    label: "Info",    color: T.blue   || "#3B82F6" },
    { id: "success", label: "Success", color: T.green  || "#10B981" },
    { id: "warning", label: "Warning", color: T.orange || "#F59E0B" },
    { id: "promo",   label: "Promo",   color: T.purple || "#8B5CF6" },
    { id: "urgent",  label: "Urgent",  color: T.red    || "#EF4444" },
  ];

  const fetchNotifications = React.useCallback(() => {}, []);
  const fetchTemplates = React.useCallback(() => {}, []);

  // Live notifications + templates
  React.useEffect(() => {
    const unsub1 = onSnapshot(query(collection(db, "notifications"), orderBy("createdAt", "desc"), limit(200)), (snap) => {
      const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setSentNotifs(all.filter(n => !n.scheduledFor || new Date(n.scheduledFor) <= new Date()));
      setScheduledNotifs(all.filter(n => n.scheduledFor && new Date(n.scheduledFor) > new Date()));
    });
    const unsub2 = onSnapshot(collection(db, "notificationTemplates"), (snap) => {
      setTemplates(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => { unsub1(); unsub2(); };
  }, []);

  const getTargetUsers = (tType = targetType, tTier = targetTier, tUid = targetUserId) => {
    const all = Array.isArray(users) ? users : [];
    switch (tType) {
      case "tier": return all.filter(u => u.tier === tTier);
      case "user": return all.filter(u => u.uid === tUid || u.id === tUid);
      default: return all;
    }
  };
  const targetUsers = getTargetUsers();

  const sendNotification = async () => {
    if (!notifForm.title || !notifForm.message) { notify("Title and message required"); return; }
    if (targetUsers.length === 0) { notify("No target users selected"); return; }
    setNotifSending(true); setLastResult(null);
    let sent = 0, failed = 0;
    const startTime = Date.now();
    const scheduledFor = scheduleEnabled && scheduleDate
      ? new Date(`${scheduleDate}T${scheduleTime}`).toISOString()
      : null;
    try {
      for (const user of targetUsers) {
        try {
          const id = `notif_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
          await setDoc(doc(db, "notifications", id), {
            ...notifForm,
            userId: user.uid || user.id,
            userName: user.name || user.email,
            userEmail: user.email,
            userTier: user.tier,
            read: false,
            clicked: false,
            createdAt: new Date().toISOString(),
            scheduledFor,
            sentBy: adminUser?.email || "admin",
            targetType,
            targetTier: targetType === "tier" ? targetTier : null,
          });
          sent++;
        } catch { failed++; }
      }
      setLastResult({ success: true, sent, failed, total: targetUsers.length, durationMs: Date.now() - startTime, scheduled: !!scheduledFor, scheduledFor });
      notify(scheduledFor ? `Scheduled for ${new Date(scheduledFor).toLocaleString("en-AE")}` : `Sent to ${sent} users!`);
      setNotifForm({ title: "", message: "", icon: "🔔", type: "info", link: "" });
      setScheduleEnabled(false); setScheduleDate("");
      fetchNotifications();
    } catch (e) {
      setLastResult({ success: false, error: e.message });
      notify("Send failed: " + e.message);
    }
    setNotifSending(false);
  };

  const saveTemplate = async () => {
    if (!templateName || !notifForm.title) { notify("Template name and title required"); return; }
    try {
      const id = editingTemplate || `template_${Date.now()}`;
      await setDoc(doc(db, "notificationTemplates", id), {
        name: templateName, ...notifForm,
        updatedAt: new Date().toISOString(),
        createdBy: adminUser?.email || "admin",
      });
      notify(editingTemplate ? "Template updated!" : "Template saved!");
      setShowTemplateModal(false); setTemplateName(""); setEditingTemplate(null);
      fetchTemplates();
    } catch (e) { notify("Error: " + e.message); }
  };

  const loadTemplate = (t) => {
    setNotifForm({ title: t.title || "", message: t.message || "", icon: t.icon || "🔔", type: t.type || "info", link: t.link || "" });
    setNotifSubTab("compose");
    notify(`Loaded: ${t.name}`);
  };

  const deleteTemplate = async (id) => {
    try { await deleteDoc(doc(db, "notificationTemplates", id)); notify("Template deleted"); fetchTemplates(); }
    catch (e) { notify("Error: " + e.message); }
  };

  const deleteNotifications = async (ids) => {
    try {
      for (const id of ids) await deleteDoc(doc(db, "notifications", id));
      notify(`Deleted ${ids.length} notification(s)`);
      setSelectedNotifs([]); fetchNotifications();
    } catch (e) { notify("Error: " + e.message); }
  };

  const resendNotification = async (n) => {
    setNotifForm({ title: n.title, message: n.message, icon: n.icon || "🔔", type: n.type || "info", link: n.link || "" });
    setTargetType("user"); setTargetUserId(n.userId);
    setNotifSubTab("compose");
    notify("Loaded for resend — adjust and hit Send");
  };

  const cancelScheduled = async (id) => {
    try { await deleteDoc(doc(db, "notifications", id)); notify("Scheduled notification cancelled"); fetchNotifications(); }
    catch (e) { notify("Error: " + e.message); }
  };

  const sendEmail = async () => {
    if (!emailForm.subject || !emailForm.body) { notify("Subject and body required"); return; }
    const targets = getTargetUsers(emailTargetType, emailTargetTier);
    if (targets.length === 0) { notify("No target users"); return; }
    setEmailSending(true);
    let sent = 0, failed = 0;
    try {
      for (const user of targets) {
        if (!user.email) { failed++; continue; }
        try {
          await emailjs.send(import.meta.env.VITE_EMAILJS_SERVICE_ID, import.meta.env.VITE_EMAILJS_TEMPLATE_ID, {
            user_email: user.email,
            to_name: user.name || user.email,
            subject: emailForm.subject,
            message: emailForm.body,
            preheader: emailForm.preheader || "",
          }, import.meta.env.VITE_EMAILJS_PUBLIC_KEY);
          sent++;
        } catch { failed++; }
      }
      notify(`Email sent to ${sent}/${targets.length} users`);
      setEmailForm({ subject: "", body: "", preheader: "" });
    } catch (e) { notify("Email error: " + e.message); }
    setEmailSending(false);
  };

  const now = new Date();
  const stats = {
    total: sentNotifs.length,
    today: sentNotifs.filter(n => new Date(n.createdAt).toDateString() === now.toDateString()).length,
    read: sentNotifs.filter(n => n.read).length,
    readRate: sentNotifs.length > 0 ? Math.round((sentNotifs.filter(n => n.read).length / sentNotifs.length) * 100) : 0,
    clicked: sentNotifs.filter(n => n.clicked).length,
    scheduled: scheduledNotifs.length,
  };

  const filteredHistory = sentNotifs.filter(n => {
    const matchFilter = historyFilter === "read" ? n.read : historyFilter === "unread" ? !n.read : true;
    const matchSearch = !historySearch || (n.title || "").toLowerCase().includes(historySearch.toLowerCase()) || (n.userName || "").toLowerCase().includes(historySearch.toLowerCase());
    return matchFilter && matchSearch;
  });

  const filteredUsers = searchUser
    ? (Array.isArray(users) ? users : []).filter(u => (u.name || "").toLowerCase().includes(searchUser.toLowerCase()) || (u.email || "").toLowerCase().includes(searchUser.toLowerCase()))
    : [];

  const gold = T.gold || "#D4A843";
  const surf = T.surface || "#0A1628";
  const surfAlt = T.surfaceAlt || "#111C2E";
  const border = T.border || "rgba(255,255,255,0.06)";
  const textMuted = T.textMuted || "#64748B";
  const textSec = T.textSecondary || "#94A3B8";
  const white = T.white || "#FFFFFF";
  const blue = T.blue || "#3B82F6";
  const green = T.green || "#10B981";
  const red = T.red || "#EF4444";
  const purple = T.purple || "#8B5CF6";
  const orange = T.orange || "#F59E0B";
  const bg = T.bg || "#060D1A";

  const typeColor = (type) => TYPES.find(t => t.id === type)?.color || blue;

  const SUBTABS = [
    { id: "compose",   label: "Compose",                icon: "✏️" },
    { id: "email",     label: "Email Blast",            icon: "📧" },
    { id: "scheduled", label: `Scheduled (${stats.scheduled})`, icon: "⏰" },
    { id: "templates", label: `Templates (${templates.length})`, icon: "📋" },
    { id: "history",   label: `History (${sentNotifs.length})`,  icon: "📜" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* KPI BAR */}
      <div className="fade-up" style={{ display: "flex", alignItems: "center", gap: 0, borderRadius: 14, background: surf, border: `1px solid ${border}`, overflow: "hidden" }}>
        <button type="button" onClick={() => { fetchNotifications(); notify("Refreshed"); }}
          style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 48, minHeight: 60, background: "transparent", border: "none", borderRight: `1px solid ${border}`, cursor: "pointer", color: gold, fontSize: 18 }}>
          ↻
        </button>
        {[
          { label: "Sent Today",  value: stats.today,                 color: gold },
          { label: "Total Sent",  value: stats.total,                 color: blue },
          { label: "Read",        value: stats.read,                  color: green },
          { label: "Read Rate",   value: `${stats.readRate}%`,        color: stats.readRate > 50 ? green : orange },
          { label: "Clicked",     value: stats.clicked,               color: purple },
          { label: "Scheduled",   value: stats.scheduled,             color: orange },
          { label: "Templates",   value: templates.length,            color: blue },
        ].map((item, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", padding: "10px 18px", borderRight: `1px solid ${border}` }}>
            <span style={{ fontSize: 9, fontWeight: 700, color: textMuted, textTransform: "uppercase", letterSpacing: 1 }}>{item.label}</span>
            <span style={{ fontSize: 18, fontWeight: 900, color: item.color, fontFamily: "'Fraunces',serif" }}>{item.value}</span>
          </div>
        ))}
      </div>

      {/* SUB-TABS */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {SUBTABS.map(t => (
          <button key={t.id} type="button" onClick={() => setNotifSubTab(t.id)}
            style={{ padding: "10px 18px", borderRadius: 8, border: `1px solid ${notifSubTab === t.id ? gold : border}`, background: notifSubTab === t.id ? `${gold}18` : surf, color: notifSubTab === t.id ? gold : textSec, fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
            <span>{t.icon}</span> {t.label}
          </button>
        ))}
      </div>

      {/* ── COMPOSE TAB ── */}
      {notifSubTab === "compose" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          {/* Left: Form */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Target */}
            <div style={{ background: surf, borderRadius: 14, border: `1px solid ${border}`, padding: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: gold, letterSpacing: 0.5, marginBottom: 14 }}>🎯 Target Audience</div>
              <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
                {[
                  { id: "all",  label: `All Users (${(users||[]).length})` },
                  { id: "tier", label: "By Tier" },
                  { id: "user", label: "Specific User" },
                ].map(t => (
                  <button key={t.id} type="button" onClick={() => setTargetType(t.id)}
                    style={{ padding: "8px 14px", borderRadius: 8, border: `1px solid ${targetType === t.id ? gold : border}`, background: targetType === t.id ? `${gold}18` : surfAlt, color: targetType === t.id ? gold : textSec, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                    {t.label}
                  </button>
                ))}
              </div>
              {targetType === "tier" && (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {["free", "pro_trial", "pro", "enterprise"].map(tier => (
                    <button key={tier} type="button" onClick={() => setTargetTier(tier)}
                      style={{ padding: "6px 12px", borderRadius: 6, border: `1px solid ${targetTier === tier ? blue : border}`, background: targetTier === tier ? `${blue}18` : surfAlt, color: targetTier === tier ? blue : textSec, fontSize: 11, cursor: "pointer", fontWeight: 600 }}>
                      {tier.replace("_", " ")} ({(users||[]).filter(u => u.tier === tier).length})
                    </button>
                  ))}
                </div>
              )}
              {targetType === "user" && (
                <div style={{ position: "relative" }}>
                  <input value={searchUser} onChange={e => setSearchUser(e.target.value)} placeholder="Search user by name or email..."
                    style={{ width: "100%", padding: "10px 12px", background: surfAlt, border: `1px solid ${border}`, borderRadius: 8, color: white, fontSize: 12, boxSizing: "border-box" }} />
                  {filteredUsers.length > 0 && (
                    <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: surf, border: `1px solid ${border}`, borderRadius: 8, zIndex: 100, maxHeight: 200, overflowY: "auto" }}>
                      {filteredUsers.map(u => (
                        <div key={u.uid || u.id} onClick={() => { setTargetUserId(u.uid || u.id); setSearchUser(u.name || u.email); }}
                          style={{ padding: "10px 12px", cursor: "pointer", borderBottom: `1px solid ${border}`, display: "flex", justifyContent: "space-between" }}
                          onMouseEnter={e => e.currentTarget.style.background = surfAlt}
                          onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                          <span style={{ fontSize: 12, color: white }}>{u.name || u.email}</span>
                          <span style={{ fontSize: 10, color: textMuted }}>{u.tier}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <div style={{ fontSize: 11, color: blue, marginTop: 10, fontWeight: 600 }}>
                → {targetUsers.length} recipient{targetUsers.length !== 1 ? "s" : ""} selected
              </div>
            </div>

            {/* Content */}
            <div style={{ background: surf, borderRadius: 14, border: `1px solid ${border}`, padding: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: gold, letterSpacing: 0.5 }}>Notification Content</div>
                <button type="button" onClick={() => setShowTemplateModal(true)} style={{ fontSize: 10, color: blue, background: "transparent", border: `1px solid ${blue}40`, borderRadius: 6, padding: "4px 10px", cursor: "pointer" }}>
                  + Save as Template
                </button>
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 10, color: textMuted, display: "block", marginBottom: 6 }}>Type</label>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {TYPES.map(type => (
                    <button key={type.id} type="button" onClick={() => setNotifForm(p => ({ ...p, type: type.id }))}
                      style={{ padding: "6px 12px", borderRadius: 6, border: `1px solid ${notifForm.type === type.id ? type.color : border}`, background: notifForm.type === type.id ? `${type.color}22` : surfAlt, color: notifForm.type === type.id ? type.color : textSec, fontSize: 11, cursor: "pointer", fontWeight: 600 }}>
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 10, color: textMuted, display: "block", marginBottom: 6 }}>Icon</label>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {ICONS.map(ic => (
                    <button key={ic} type="button" onClick={() => setNotifForm(p => ({ ...p, icon: ic }))}
                      style={{ padding: "8px 10px", borderRadius: 8, border: `1px solid ${notifForm.icon === ic ? gold : border}`, background: notifForm.icon === ic ? `${gold}22` : surfAlt, cursor: "pointer", fontSize: 16 }}>
                      {ic}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 10, color: textMuted, display: "block", marginBottom: 6 }}>Title *</label>
                <input value={notifForm.title} onChange={e => setNotifForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. New Project Launch Alert"
                  style={{ width: "100%", padding: "10px 12px", background: surfAlt, border: `1px solid ${border}`, borderRadius: 8, color: white, fontSize: 13, boxSizing: "border-box" }} />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 10, color: textMuted, display: "block", marginBottom: 6 }}>Message *</label>
                <textarea value={notifForm.message} onChange={e => setNotifForm(p => ({ ...p, message: e.target.value }))} placeholder="Write your notification message..." rows={3}
                  style={{ width: "100%", padding: "10px 12px", background: surfAlt, border: `1px solid ${border}`, borderRadius: 8, color: white, fontSize: 12, resize: "vertical", boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ fontSize: 10, color: textMuted, display: "block", marginBottom: 6 }}>Link (optional)</label>
                <input value={notifForm.link} onChange={e => setNotifForm(p => ({ ...p, link: e.target.value }))} placeholder="https://..."
                  style={{ width: "100%", padding: "10px 12px", background: surfAlt, border: `1px solid ${border}`, borderRadius: 8, color: white, fontSize: 12, boxSizing: "border-box" }} />
              </div>
            </div>

            {/* Schedule */}
            <div style={{ background: surf, borderRadius: 14, border: `1px solid ${scheduleEnabled ? orange : border}`, padding: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: scheduleEnabled ? 14 : 0 }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: scheduleEnabled ? orange : white }}>⏰ Schedule Send</div>
                  <div style={{ fontSize: 10, color: textMuted }}>Send at a specific date and time</div>
                </div>
                <button type="button" onClick={() => setScheduleEnabled(p => !p)}
                  style={{ width: 44, height: 24, borderRadius: 12, background: scheduleEnabled ? orange : border, border: "none", cursor: "pointer", position: "relative", transition: "background 0.2s" }}>
                  <div style={{ width: 18, height: 18, borderRadius: 9, background: white, position: "absolute", top: 3, left: scheduleEnabled ? 23 : 3, transition: "left 0.2s" }} />
                </button>
              </div>
              {scheduleEnabled && (
                <div style={{ display: "flex", gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 10, color: textMuted, display: "block", marginBottom: 6 }}>Date</label>
                    <input type="date" value={scheduleDate} onChange={e => setScheduleDate(e.target.value)} min={new Date().toISOString().split("T")[0]}
                      style={{ width: "100%", padding: "10px 12px", background: surfAlt, border: `1px solid ${orange}60`, borderRadius: 8, color: white, fontSize: 12, boxSizing: "border-box" }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 10, color: textMuted, display: "block", marginBottom: 6 }}>Time (Dubai)</label>
                    <input type="time" value={scheduleTime} onChange={e => setScheduleTime(e.target.value)}
                      style={{ width: "100%", padding: "10px 12px", background: surfAlt, border: `1px solid ${orange}60`, borderRadius: 8, color: white, fontSize: 12, boxSizing: "border-box" }} />
                  </div>
                </div>
              )}
            </div>

            {/* Send Button */}
            <button type="button" onClick={sendNotification} disabled={notifSending || targetUsers.length === 0}
              style={{ padding: "16px 28px", background: notifSending ? surfAlt : `linear-gradient(135deg,${gold},${gold}cc)`, border: "none", borderRadius: 12, color: bg, fontSize: 14, fontWeight: 700, cursor: notifSending || targetUsers.length === 0 ? "not-allowed" : "pointer", opacity: targetUsers.length === 0 ? 0.5 : 1 }}>
              {notifSending ? "Sending..." : scheduleEnabled ? `⏰ Schedule → ${targetUsers.length} user${targetUsers.length !== 1 ? "s" : ""}` : `Send Now → ${targetUsers.length} user${targetUsers.length !== 1 ? "s" : ""}`}
            </button>

            {lastResult && (
              <div style={{ padding: "14px 18px", borderRadius: 10, background: lastResult.success ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)", border: `1px solid ${lastResult.success ? green : red}40` }}>
                <div style={{ fontSize: 13, color: lastResult.success ? green : red, fontWeight: 700 }}>
                  {lastResult.success
                    ? lastResult.scheduled
                      ? `⏰ Scheduled for ${new Date(lastResult.scheduledFor).toLocaleString("en-AE")} — ${lastResult.sent} users`
                      : `✔ Sent to ${lastResult.sent}/${lastResult.total} users in ${(lastResult.durationMs / 1000).toFixed(1)}s`
                    : `✘ Failed: ${lastResult.error}`}
                </div>
                {lastResult.failed > 0 && <div style={{ fontSize: 11, color: orange, marginTop: 4 }}>{lastResult.failed} failed to send</div>}
              </div>
            )}
          </div>

          {/* Right: Preview + Quick Templates */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ background: surf, borderRadius: 14, border: `1px solid ${purple}40`, padding: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: purple, letterSpacing: 1, marginBottom: 16 }}>LIVE PREVIEW</div>
              <div style={{ background: surfAlt, borderRadius: 12, padding: 16, border: `1px solid ${typeColor(notifForm.type)}40` }}>
                <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: `${typeColor(notifForm.type)}22`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
                    {notifForm.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: white, marginBottom: 4 }}>{notifForm.title || "Notification Title"}</div>
                    <div style={{ fontSize: 12, color: textSec, lineHeight: 1.5 }}>{notifForm.message || "Your notification message will appear here..."}</div>
                    {notifForm.link && <div style={{ marginTop: 8, fontSize: 11, color: blue }}>🔗 {notifForm.link}</div>}
                    <div style={{ marginTop: 10, fontSize: 10, color: textMuted }}>Just now · {notifForm.type}</div>
                  </div>
                </div>
              </div>
              <div style={{ marginTop: 12, fontSize: 10, color: textMuted, textAlign: "center" }}>
                This is how it appears in the user's notification bell
              </div>
            </div>

            {templates.length > 0 && (
              <div style={{ background: surf, borderRadius: 14, border: `1px solid ${border}`, padding: 20 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: gold, letterSpacing: 0.5, marginBottom: 14 }}>Quick Templates</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {templates.slice(0, 5).map(t => (
                    <button key={t.id} type="button" onClick={() => loadTemplate(t)}
                      style={{ padding: "10px 14px", borderRadius: 8, border: `1px solid ${border}`, background: surfAlt, color: white, fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 10, textAlign: "left" }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = gold}
                      onMouseLeave={e => e.currentTarget.style.borderColor = border}>
                      <span style={{ fontSize: 18 }}>{t.icon || "📋"}</span>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: white }}>{t.name}</div>
                        <div style={{ fontSize: 10, color: textMuted }}>{t.title}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── EMAIL BLAST TAB ── */}
      {notifSubTab === "email" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ background: surf, borderRadius: 14, border: `1px solid ${border}`, padding: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: gold, marginBottom: 14 }}>🎯 Email Recipients</div>
              <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
                {[{ id: "all", label: `All Users (${(users||[]).length})` }, { id: "tier", label: "By Tier" }].map(t => (
                  <button key={t.id} type="button" onClick={() => setEmailTargetType(t.id)}
                    style={{ padding: "8px 14px", borderRadius: 8, border: `1px solid ${emailTargetType === t.id ? gold : border}`, background: emailTargetType === t.id ? `${gold}18` : surfAlt, color: emailTargetType === t.id ? gold : textSec, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                    {t.label}
                  </button>
                ))}
              </div>
              {emailTargetType === "tier" && (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {["free", "pro_trial", "pro", "enterprise"].map(tier => (
                    <button key={tier} type="button" onClick={() => setEmailTargetTier(tier)}
                      style={{ padding: "6px 12px", borderRadius: 6, border: `1px solid ${emailTargetTier === tier ? blue : border}`, background: emailTargetTier === tier ? `${blue}18` : surfAlt, color: emailTargetTier === tier ? blue : textSec, fontSize: 11, cursor: "pointer", fontWeight: 600 }}>
                      {tier.replace("_", " ")} ({(users||[]).filter(u => u.tier === tier).length})
                    </button>
                  ))}
                </div>
              )}
              <div style={{ fontSize: 11, color: blue, marginTop: 10, fontWeight: 600 }}>
                → {getTargetUsers(emailTargetType, emailTargetTier).length} recipients
              </div>
            </div>

            <div style={{ background: surf, borderRadius: 14, border: `1px solid ${border}`, padding: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: gold, marginBottom: 14 }}>📧 Email Content</div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 10, color: textMuted, display: "block", marginBottom: 6 }}>Preheader (preview text)</label>
                <input value={emailForm.preheader} onChange={e => setEmailForm(p => ({ ...p, preheader: e.target.value }))} placeholder="Short preview shown in inbox..."
                  style={{ width: "100%", padding: "10px 12px", background: surfAlt, border: `1px solid ${border}`, borderRadius: 8, color: white, fontSize: 12, boxSizing: "border-box" }} />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 10, color: textMuted, display: "block", marginBottom: 6 }}>Subject Line *</label>
                <input value={emailForm.subject} onChange={e => setEmailForm(p => ({ ...p, subject: e.target.value }))} placeholder="e.g. New off-plan launches this week"
                  style={{ width: "100%", padding: "10px 12px", background: surfAlt, border: `1px solid ${border}`, borderRadius: 8, color: white, fontSize: 13, boxSizing: "border-box" }} />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 10, color: textMuted, display: "block", marginBottom: 6 }}>Email Body *</label>
                <textarea value={emailForm.body} onChange={e => setEmailForm(p => ({ ...p, body: e.target.value }))} placeholder="Write your email content here..." rows={8}
                  style={{ width: "100%", padding: "10px 12px", background: surfAlt, border: `1px solid ${border}`, borderRadius: 8, color: white, fontSize: 12, resize: "vertical", lineHeight: 1.6, boxSizing: "border-box" }} />
              </div>
              <div style={{ padding: "10px 14px", background: `${orange}15`, borderRadius: 8, border: `1px solid ${orange}40`, marginBottom: 14 }}>
                <div style={{ fontSize: 10, color: orange, fontWeight: 600 }}>⚠️ Note: Using EmailJS — max ~200 emails/month on free plan. Upgrade at emailjs.com for higher volume.</div>
              </div>
              <button type="button" onClick={sendEmail} disabled={emailSending}
                style={{ width: "100%", padding: "14px", background: emailSending ? surfAlt : `linear-gradient(135deg,${blue},${purple})`, border: "none", borderRadius: 10, color: white, fontSize: 14, fontWeight: 700, cursor: emailSending ? "not-allowed" : "pointer" }}>
                {emailSending ? "Sending emails..." : `📧 Send Email to ${getTargetUsers(emailTargetType, emailTargetTier).length} Users`}
              </button>
            </div>
          </div>

          {/* Email Preview */}
          <div style={{ background: surf, borderRadius: 14, border: `1px solid ${purple}40`, padding: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: purple, letterSpacing: 1, marginBottom: 16 }}>EMAIL PREVIEW</div>
            <div style={{ background: "#ffffff", borderRadius: 12, padding: 24, color: "#1a1a1a" }}>
              <div style={{ borderBottom: "1px solid #eee", paddingBottom: 12, marginBottom: 16 }}>
                <div style={{ fontSize: 11, color: "#666" }}>From: DXB Analytics &lt;noreply@dxbanalytics.com&gt;</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#1a1a1a", marginTop: 4 }}>{emailForm.subject || "Email Subject"}</div>
                {emailForm.preheader && <div style={{ fontSize: 11, color: "#999", marginTop: 2 }}>{emailForm.preheader}</div>}
              </div>
              <div style={{ background: "#D4A843", borderRadius: 8, padding: "16px 20px", marginBottom: 20, textAlign: "center" }}>
                <div style={{ fontSize: 18, fontWeight: 900, color: "#060D1A" }}>DXB Analytics</div>
                <div style={{ fontSize: 11, color: "#060D1A99" }}>Bloomberg Terminal of GCC Real Estate</div>
              </div>
              <div style={{ fontSize: 13, color: "#333", lineHeight: 1.8, whiteSpace: "pre-wrap", minHeight: 80 }}>
                {emailForm.body || "Your email body will appear here..."}
              </div>
              <div style={{ marginTop: 24, paddingTop: 16, borderTop: "1px solid #eee", fontSize: 10, color: "#999", textAlign: "center" }}>
                DXB Analytics · Dubai, UAE · dxbanalytics.com<br />
                <span style={{ color: "#D4A843" }}>Unsubscribe</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── SCHEDULED TAB ── */}
      {notifSubTab === "scheduled" && (
        <div style={{ background: surf, borderRadius: 14, border: `1px solid ${border}`, overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: `1px solid ${border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: white }}>Scheduled Notifications</div>
              <div style={{ fontSize: 11, color: textMuted }}>{scheduledNotifs.length} pending</div>
            </div>
            <button type="button" onClick={() => setNotifSubTab("compose")}
              style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: gold, color: bg, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
              + Schedule New
            </button>
          </div>
          {scheduledNotifs.length === 0 ? (
            <div style={{ padding: 60, textAlign: "center", color: textMuted }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>⏰</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: textSec }}>No scheduled notifications</div>
              <div style={{ fontSize: 12, marginTop: 6 }}>Use the Compose tab with Schedule Send enabled</div>
            </div>
          ) : (
            <div>
              {scheduledNotifs.map(n => (
                <div key={n.id} style={{ padding: "16px 20px", borderBottom: `1px solid ${border}`, display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: `${typeColor(n.type)}22`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
                    {n.icon || "🔔"}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: white }}>{n.title}</div>
                    <div style={{ fontSize: 11, color: textMuted }}>{n.message?.slice(0, 60)}{n.message?.length > 60 ? "..." : ""}</div>
                    <div style={{ fontSize: 10, color: orange, marginTop: 4, fontWeight: 600 }}>
                      ⏰ Scheduled: {new Date(n.scheduledFor).toLocaleString("en-AE")} · To: {n.userName || n.targetType}
                    </div>
                  </div>
                  <button type="button" onClick={() => cancelScheduled(n.id)}
                    style={{ padding: "6px 14px", borderRadius: 6, border: `1px solid ${red}40`, background: `${red}15`, color: red, fontSize: 11, cursor: "pointer", fontWeight: 600 }}>
                    Cancel
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TEMPLATES TAB ── */}
      {notifSubTab === "templates" && (
        <div style={{ background: surf, borderRadius: 14, border: `1px solid ${border}`, overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: `1px solid ${border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: white }}>Notification Templates</div>
              <div style={{ fontSize: 11, color: textMuted }}>{templates.length} templates saved</div>
            </div>
            <button type="button" onClick={() => { setNotifForm({ title: "", message: "", icon: "🔔", type: "info", link: "" }); setNotifSubTab("compose"); setShowTemplateModal(true); }}
              style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: gold, color: bg, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
              + New Template
            </button>
          </div>
          {templates.length === 0 ? (
            <div style={{ padding: 60, textAlign: "center", color: textMuted }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: textSec }}>No templates yet</div>
              <div style={{ fontSize: 12 }}>Compose a notification then save it as a template</div>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16, padding: 20 }}>
              {templates.map(t => (
                <div key={t.id} style={{ background: surfAlt, borderRadius: 12, border: `1px solid ${border}`, padding: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 24 }}>{t.icon || "📋"}</span>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: white }}>{t.name}</div>
                        <div style={{ fontSize: 10, color: textMuted }}>{t.type || "info"}</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 4 }}>
                      <button type="button" onClick={() => loadTemplate(t)} style={{ padding: "4px 10px", borderRadius: 4, border: `1px solid ${blue}40`, background: `${blue}15`, color: blue, fontSize: 10, cursor: "pointer", fontWeight: 600 }}>Use</button>
                      <button type="button" onClick={() => deleteTemplate(t.id)} style={{ padding: "4px 10px", borderRadius: 4, border: `1px solid ${red}40`, background: `${red}15`, color: red, fontSize: 10, cursor: "pointer", fontWeight: 600 }}>Del</button>
                    </div>
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: textSec, marginBottom: 4 }}>{t.title}</div>
                  <div style={{ fontSize: 11, color: textMuted, lineHeight: 1.4 }}>{t.message?.slice(0, 100)}{t.message?.length > 100 ? "..." : ""}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── HISTORY TAB ── */}
      {notifSubTab === "history" && (
        <div style={{ background: surf, borderRadius: 14, border: `1px solid ${border}`, overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: `1px solid ${border}`, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: white }}>Notification History</div>
                <div style={{ fontSize: 11, color: textMuted }}>{filteredHistory.length} notifications</div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                {["all", "read", "unread"].map(f => (
                  <button key={f} type="button" onClick={() => setHistoryFilter(f)}
                    style={{ padding: "4px 10px", borderRadius: 6, border: `1px solid ${historyFilter === f ? gold : border}`, background: historyFilter === f ? `${gold}18` : surfAlt, color: historyFilter === f ? gold : textSec, fontSize: 11, cursor: "pointer", fontWeight: 600 }}>
                    {f}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <input value={historySearch} onChange={e => setHistorySearch(e.target.value)} placeholder="Search notifications..."
                style={{ padding: "8px 12px", background: surfAlt, border: `1px solid ${border}`, borderRadius: 8, color: white, fontSize: 12 }} />
              {selectedNotifs.length > 0 && (
                <button type="button" onClick={() => deleteNotifications(selectedNotifs)}
                  style={{ padding: "8px 14px", borderRadius: 6, border: "none", background: red, color: white, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                  Delete ({selectedNotifs.length})
                </button>
              )}
            </div>
          </div>
          {filteredHistory.length === 0 ? (
            <div style={{ padding: 60, textAlign: "center", color: textMuted }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📡</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: textSec }}>No notifications found</div>
            </div>
          ) : (
            <div style={{ maxHeight: 600, overflowY: "auto" }}>
              {filteredHistory.map((n) => (
                <div key={n.id} style={{ padding: "14px 20px", borderBottom: `1px solid ${border}`, display: "flex", alignItems: "center", gap: 12 }}
                  onMouseEnter={e => e.currentTarget.style.background = surfAlt}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <input type="checkbox" checked={selectedNotifs.includes(n.id)} onChange={e => {
                    if (e.target.checked) setSelectedNotifs(p => [...p, n.id]);
                    else setSelectedNotifs(p => p.filter(id => id !== n.id));
                  }} style={{ cursor: "pointer" }} />
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: `${typeColor(n.type)}22`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
                    {n.icon || "🔔"}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: white, marginBottom: 2 }}>{n.title}</div>
                    <div style={{ fontSize: 11, color: textMuted }}>{n.message?.slice(0, 60)}{n.message?.length > 60 ? "..." : ""}</div>
                    <div style={{ fontSize: 10, color: textMuted, marginTop: 4 }}>
                      To: {n.userName || n.userId || "All"} · {n.createdAt ? new Date(n.createdAt).toLocaleString("en-AE") : ""}
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                    <span style={{ fontSize: 9, padding: "2px 8px", borderRadius: 4, background: n.read ? `${green}20` : `${orange}20`, color: n.read ? green : orange, fontWeight: 700 }}>
                      {n.read ? "Read" : "Unread"}
                    </span>
                    {n.clicked && <span style={{ fontSize: 9, color: purple, fontWeight: 600 }}>Clicked</span>}
                    <button type="button" onClick={() => resendNotification(n)}
                      style={{ fontSize: 9, padding: "2px 8px", borderRadius: 4, border: `1px solid ${blue}40`, background: `${blue}15`, color: blue, cursor: "pointer", fontWeight: 600 }}>
                      Resend
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SAVE TEMPLATE MODAL */}
      {showTemplateModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(4,9,15,0.92)", zIndex: 9000, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: surf, border: `1px solid ${gold}40`, borderRadius: 16, width: "95%", maxWidth: 420, padding: 28 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: gold, marginBottom: 20 }}>Save as Template</div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 10, color: textMuted, display: "block", marginBottom: 6 }}>Template Name *</label>
              <input value={templateName} onChange={e => setTemplateName(e.target.value)} placeholder="e.g. New Launch Alert"
                style={{ width: "100%", padding: "10px 12px", background: surfAlt, border: `1px solid ${border}`, borderRadius: 8, color: white, fontSize: 13, boxSizing: "border-box" }} />
            </div>
            <div style={{ padding: "12px 14px", background: surfAlt, borderRadius: 8, marginBottom: 16 }}>
              <div style={{ fontSize: 10, color: textMuted, marginBottom: 4 }}>Will save:</div>
              <div style={{ fontSize: 12, color: white }}>{notifForm.icon} {notifForm.title || "(no title)"}</div>
              <div style={{ fontSize: 11, color: textMuted, marginTop: 4 }}>{notifForm.message?.slice(0, 60)}</div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button type="button" onClick={() => { setShowTemplateModal(false); setTemplateName(""); }} style={{ flex: 1, padding: "10px", borderRadius: 8, border: `1px solid ${border}`, background: surfAlt, color: white, fontSize: 13, cursor: "pointer" }}>Cancel</button>
              <button type="button" onClick={saveTemplate} style={{ flex: 2, padding: "10px", borderRadius: 8, border: "none", background: gold, color: bg, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Save Template</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


/* ===================================================================
   TAB 11: EMAIL DIGEST COMPONENT — PRO LEVEL
   Schedule, preview, send, track. EmailJS bulk send.
=================================================================== */

export default NotificationsTab;
