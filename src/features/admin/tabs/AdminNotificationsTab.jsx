import React, { useState, useEffect, useCallback } from "react";
import { doc, setDoc, getDocs, getDoc, deleteDoc, collection, addDoc, query, orderBy, limit } from "firebase/firestore";

function NotificationsTab({ T, notify, adminUser, I, users, db }) {
  // State
  const [notifSubTab, setNotifSubTab] = useState("compose"); // compose | templates | history | settings
  const [notifForm, setNotifForm] = useState({ title: "", message: "", icon: "≡ƒöö", type: "info", link: "" });
  const [notifSending, setNotifSending] = useState(false);
  const [sentNotifs, setSentNotifs] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [targetType, setTargetType] = useState("all"); // all | tier | user
  const [targetTier, setTargetTier] = useState("pro");
  const [targetUserId, setTargetUserId] = useState("");
  const [searchUser, setSearchUser] = useState("");
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("09:00");
  const [selectedNotifs, setSelectedNotifs] = useState([]);
  const [historyFilter, setHistoryFilter] = useState("all"); // all | read | unread
  const [lastResult, setLastResult] = useState(null);

  // Icons and types
  const ICONS = ["≡ƒöö", "≡ƒôó", "≡ƒÄë", "ΓÜá∩╕Å", "≡ƒÆ░", "≡ƒÅá", "≡ƒôè", "≡ƒÜÇ", "Γ£¿", "≡ƒôê", "≡ƒöÑ", "≡ƒÆÄ"];
  const TYPES = [
    { id: "info", label: "Info", color: T.blue },
    { id: "success", label: "Success", color: T.green },
    { id: "warning", label: "Warning", color: T.orange },
    { id: "promo", label: "Promo", color: T.purple },
    { id: "urgent", label: "Urgent", color: T.red },
  ];

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    try {
      const snap = await getDocs(query(collection(db, "notifications"), orderBy("createdAt", "desc"), limit(100)));
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setSentNotifs(list);
    } catch (e) { console.error(e); }
  }, [db]);

  // Fetch templates
  const fetchTemplates = useCallback(async () => {
    try {
      const snap = await getDocs(collection(db, "notificationTemplates"));
      setTemplates(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) { console.error(e); }
  }, [db]);

  useEffect(() => {
    fetchNotifications();
    fetchTemplates();
  }, [fetchNotifications, fetchTemplates]);

  // Get target users
  const getTargetUsers = () => {
    switch (targetType) {
      case "tier": return users.filter(u => u.tier === targetTier);
      case "user": return users.filter(u => u.uid === targetUserId || u.id === targetUserId);
      default: return users;
    }
  };
  const targetUsers = getTargetUsers();

  // Send notification
  const sendNotification = async () => {
    if (!notifForm.title || !notifForm.message) { notify("Title and message required"); return; }
    if (targetUsers.length === 0) { notify("No target users selected"); return; }
    
    setNotifSending(true);
    setLastResult(null);
    let sent = 0, failed = 0;
    const startTime = Date.now();

    try {
      for (const user of targetUsers) {
        try {
          const id = `notif_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
          await setDoc(doc(db, "notifications", id), {
            ...notifForm,
            userId: user.uid || user.id,
            userName: user.name || user.email,
            read: false,
            clicked: false,
            createdAt: new Date().toISOString(),
            sentBy: adminUser?.email || "admin",
            targetType,
            targetTier: targetType === "tier" ? targetTier : null,
          });
          sent++;
        } catch { failed++; }
      }

      await logAudit(db, { action: "notification_sent", targetType, sent, failed });
      setLastResult({ success: true, sent, failed, total: targetUsers.length, durationMs: Date.now() - startTime });
      notify(`Sent to ${sent} users!`);
      setNotifForm({ title: "", message: "", icon: "≡ƒöö", type: "info", link: "" });
      fetchNotifications();
    } catch (e) {
      setLastResult({ success: false, error: e.message });
      notify("Send failed: " + e.message);
    }
    setNotifSending(false);
  };

  // Save template
  const saveTemplate = async () => {
    if (!templateName || !notifForm.title) { notify("Template name and title required"); return; }
    try {
      const id = editingTemplate || `template_${Date.now()}`;
      await setDoc(doc(db, "notificationTemplates", id), {
        name: templateName,
        ...notifForm,
        updatedAt: new Date().toISOString(),
        createdBy: adminUser?.email || "admin",
      });
      notify(editingTemplate ? "Template updated!" : "Template saved!");
      setShowTemplateModal(false);
      setTemplateName("");
      setEditingTemplate(null);
      fetchTemplates();
    } catch (e) { notify("Error: " + e.message); }
  };

  // Load template
  const loadTemplate = (template) => {
    setNotifForm({
      title: template.title || "",
      message: template.message || "",
      icon: template.icon || "≡ƒöö",
      type: template.type || "info",
      link: template.link || "",
    });
    setNotifSubTab("compose");
    notify(`Loaded: ${template.name}`);
  };

  // Delete template
  const deleteTemplate = async (id) => {
    try {
      await deleteDoc(doc(db, "notificationTemplates", id));
      notify("Template deleted");
      fetchTemplates();
    } catch (e) { notify("Error: " + e.message); }
  };

  // Delete notification(s)
  const deleteNotifications = async (ids) => {
    try {
      for (const id of ids) {
        await deleteDoc(doc(db, "notifications", id));
      }
      notify(`Deleted ${ids.length} notification(s)`);
      setSelectedNotifs([]);
      fetchNotifications();
    } catch (e) { notify("Error: " + e.message); }
  };

  // Stats
  const stats = {
    total: sentNotifs.length,
    today: sentNotifs.filter(n => {
      const d = new Date(n.createdAt);
      const today = new Date();
      return d.toDateString() === today.toDateString();
    }).length,
    read: sentNotifs.filter(n => n.read).length,
    readRate: sentNotifs.length > 0 ? Math.round((sentNotifs.filter(n => n.read).length / sentNotifs.length) * 100) : 0,
    clicked: sentNotifs.filter(n => n.clicked).length,
  };

  // Filtered history
  const filteredHistory = sentNotifs.filter(n => {
    if (historyFilter === "read") return n.read;
    if (historyFilter === "unread") return !n.read;
    return true;
  });

  // Search users for targeting
  const filteredUsers = searchUser 
    ? users.filter(u => (u.name || "").toLowerCase().includes(searchUser.toLowerCase()) || (u.email || "").toLowerCase().includes(searchUser.toLowerCase())).slice(0, 10)
    : [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* KPI TOPBAR */}
      <div className="fade-up" style={{ display: "flex", alignItems: "center", gap: 0, borderRadius: 14, background: T.surface, border: `1px solid ${T.border}`, overflow: "hidden" }}>
        <button type="button" onClick={() => { fetchNotifications(); notify("Refreshed"); }} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, padding: "14px 16px", background: T.goldGlow, border: "none", borderRight: `1px solid ${T.border}`, color: T.gold, cursor: "pointer", fontFamily: "'Outfit',sans-serif", fontWeight: 600, flexShrink: 0 }}>{I?.refresh || "Γå╗"}</button>
        {[
          { label: "Sent Today", value: stats.today, color: T.gold },
          { label: "Total Sent", value: stats.total, color: T.teal },
          { label: "Read", value: stats.read, color: T.green },
          { label: "Read Rate", value: `${stats.readRate}%`, color: stats.readRate > 50 ? T.green : T.orange },
          { label: "Clicked", value: stats.clicked, color: T.purple },
          { label: "Templates", value: templates.length, color: T.blue },
        ].map((item, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", padding: "10px 18px", borderRight: `1px solid ${T.border}`, flexShrink: 0 }}>
            <span style={{ fontSize: 9, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: 1 }}>{item.label}</span>
            <span style={{ fontSize: 18, fontWeight: 900, color: item.color, fontFamily: "'Fraunces',serif", lineHeight: 1.2 }}>{item.value}</span>
          </div>
        ))}
      </div>

      {/* SUB-TABS */}
      <div style={{ display: "flex", gap: 8 }}>
        {[
          { id: "compose", label: "Compose", icon: "Γ£Å∩╕Å" },
          { id: "templates", label: `Templates (${templates.length})`, icon: "≡ƒôï" },
          { id: "history", label: `History (${sentNotifs.length})`, icon: "≡ƒô£" },
        ].map(t => (
          <button key={t.id} type="button" onClick={() => setNotifSubTab(t.id)}
            style={{ padding: "10px 18px", borderRadius: 8, border: `1px solid ${notifSubTab === t.id ? T.gold : T.border}`, background: notifSubTab === t.id ? T.goldGlow : "transparent", color: notifSubTab === t.id ? T.gold : T.textMuted, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit',sans-serif", display: "flex", alignItems: "center", gap: 6 }}>
            <span>{t.icon}</span> {t.label}
          </button>
        ))}
      </div>

      {/* COMPOSE TAB */}
      {notifSubTab === "compose" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          {/* Left: Form */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Target Audience */}
            <div style={{ background: T.surface, borderRadius: 14, border: `1px solid ${T.border}`, padding: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.gold, letterSpacing: 0.5, marginBottom: 14 }}>Target Audience</div>
              <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                {[
                  { id: "all", label: `All Users (${users.length})` },
                  { id: "tier", label: "By Tier" },
                  { id: "user", label: "Specific User" },
                ].map(t => (
                  <button key={t.id} type="button" onClick={() => setTargetType(t.id)}
                    style={{ padding: "8px 14px", borderRadius: 8, border: `1px solid ${targetType === t.id ? T.gold : T.border}`, background: targetType === t.id ? T.goldGlow : "transparent", color: targetType === t.id ? T.gold : T.textMuted, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>
                    {t.label}
                  </button>
                ))}
              </div>
              
              {targetType === "tier" && (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {["free", "pro_trial", "pro", "enterprise"].map(tier => (
                    <button key={tier} type="button" onClick={() => setTargetTier(tier)}
                      style={{ padding: "6px 12px", borderRadius: 6, border: `1px solid ${targetTier === tier ? T.teal : T.border}`, background: targetTier === tier ? `${T.teal}15` : "transparent", color: targetTier === tier ? T.teal : T.textMuted, fontSize: 10, fontWeight: 600, cursor: "pointer", textTransform: "uppercase" }}>
                      {tier.replace("_", " ")} ({users.filter(u => u.tier === tier).length})
                    </button>
                  ))}
                </div>
              )}
              
              {targetType === "user" && (
                <div style={{ position: "relative" }}>
                  <input value={searchUser} onChange={e => setSearchUser(e.target.value)} placeholder="Search user by name or email..."
                    style={{ width: "100%", padding: "10px 12px", background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8, color: T.white, fontSize: 12, fontFamily: "'Outfit',sans-serif", boxSizing: "border-box" }} />
                  {filteredUsers.length > 0 && (
                    <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, marginTop: 4, maxHeight: 200, overflowY: "auto", zIndex: 100 }}>
                      {filteredUsers.map(u => (
                        <div key={u.uid || u.id} onClick={() => { setTargetUserId(u.uid || u.id); setSearchUser(u.name || u.email); }}
                          style={{ padding: "10px 12px", cursor: "pointer", borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between" }}
                          onMouseEnter={e => e.currentTarget.style.background = T.surfaceAlt}
                          onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                          <span style={{ fontSize: 12, color: T.white }}>{u.name || u.email}</span>
                          <span style={{ fontSize: 10, color: T.textMuted }}>{u.tier}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              <div style={{ fontSize: 11, color: T.teal, marginTop: 10, fontWeight: 600 }}>
                ΓåÆ {targetUsers.length} recipient{targetUsers.length !== 1 ? "s" : ""} selected
              </div>
            </div>

            {/* Notification Content */}
            <div style={{ background: T.surface, borderRadius: 14, border: `1px solid ${T.border}`, padding: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.gold, letterSpacing: 0.5 }}>Notification Content</div>
                <button type="button" onClick={() => setShowTemplateModal(true)} style={{ fontSize: 10, color: T.teal, background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>Save as Template</button>
              </div>

              {/* Type */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 10, color: T.textMuted, display: "block", marginBottom: 6 }}>Type</label>
                <div style={{ display: "flex", gap: 6 }}>
                  {TYPES.map(type => (
                    <button key={type.id} type="button" onClick={() => setNotifForm(p => ({ ...p, type: type.id }))}
                      style={{ padding: "6px 12px", borderRadius: 6, border: `1px solid ${notifForm.type === type.id ? type.color : T.border}`, background: notifForm.type === type.id ? `${type.color}15` : "transparent", color: notifForm.type === type.id ? type.color : T.textMuted, fontSize: 10, fontWeight: 600, cursor: "pointer" }}>
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Icon */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 10, color: T.textMuted, display: "block", marginBottom: 6 }}>Icon</label>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {ICONS.map(ic => (
                    <button key={ic} type="button" onClick={() => setNotifForm(p => ({ ...p, icon: ic }))}
                      style={{ padding: "8px 10px", borderRadius: 8, border: `1px solid ${notifForm.icon === ic ? T.gold : T.border}`, background: notifForm.icon === ic ? T.goldGlow : T.surfaceAlt, cursor: "pointer", fontSize: 16 }}>
                      {ic}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 10, color: T.textMuted, display: "block", marginBottom: 6 }}>Title *</label>
                <input value={notifForm.title} onChange={e => setNotifForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. New project launched!"
                  style={{ width: "100%", padding: "10px 12px", background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8, color: T.white, fontSize: 13, fontFamily: "'Outfit',sans-serif", boxSizing: "border-box" }} />
              </div>

              {/* Message */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 10, color: T.textMuted, display: "block", marginBottom: 6 }}>Message *</label>
                <textarea value={notifForm.message} onChange={e => setNotifForm(p => ({ ...p, message: e.target.value }))} placeholder="Write your notification message..." rows={3}
                  style={{ width: "100%", padding: "10px 12px", background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8, color: T.white, fontSize: 13, fontFamily: "'Outfit',sans-serif", resize: "vertical", boxSizing: "border-box" }} />
              </div>

              {/* Link */}
              <div>
                <label style={{ fontSize: 10, color: T.textMuted, display: "block", marginBottom: 6 }}>Link (optional)</label>
                <input value={notifForm.link} onChange={e => setNotifForm(p => ({ ...p, link: e.target.value }))} placeholder="e.g. /projects/creek-waters"
                  style={{ width: "100%", padding: "10px 12px", background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8, color: T.white, fontSize: 12, fontFamily: "'Outfit',sans-serif", boxSizing: "border-box" }} />
              </div>
            </div>

            {/* Send Button */}
            <button type="button" onClick={sendNotification} disabled={notifSending || targetUsers.length === 0}
              style={{ padding: "16px 28px", background: notifSending ? T.surfaceAlt : `linear-gradient(135deg,${T.gold},#B8912F)`, border: "none", borderRadius: 12, color: notifSending ? T.textMuted : T.bg, fontWeight: 800, fontSize: 16, cursor: notifSending || targetUsers.length === 0 ? "not-allowed" : "pointer", fontFamily: "'Outfit',sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
              {notifSending ? "Sending..." : `Send Now ΓåÆ ${targetUsers.length} user${targetUsers.length !== 1 ? "s" : ""}`}
            </button>

            {lastResult && (
              <div style={{ padding: "14px 18px", borderRadius: 10, background: lastResult.success ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.08)", border: `1px solid ${lastResult.success ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)"}` }}>
                <div style={{ fontSize: 13, color: lastResult.success ? T.green : T.red, fontWeight: 700 }}>
                  {lastResult.success ? `Γ£ô Sent to ${lastResult.sent}/${lastResult.total} users in ${(lastResult.durationMs / 1000).toFixed(1)}s` : `Γ£ù Error: ${lastResult.error}`}
                </div>
              </div>
            )}
          </div>

          {/* Right: Preview */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ background: T.surface, borderRadius: 14, border: `1px solid ${T.purple}40`, padding: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.purple, letterSpacing: 1, marginBottom: 16 }}>PREVIEW</div>
              <div style={{ background: T.surfaceAlt, borderRadius: 12, padding: 16, border: `1px solid ${TYPES.find(t => t.id === notifForm.type)?.color || T.border}30` }}>
                <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: `${TYPES.find(t => t.id === notifForm.type)?.color || T.blue}20`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
                    {notifForm.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: T.white, marginBottom: 4 }}>{notifForm.title || "Notification Title"}</div>
                    <div style={{ fontSize: 12, color: T.textSecondary, lineHeight: 1.5 }}>{notifForm.message || "Your notification message will appear here..."}</div>
                    {notifForm.link && (
                      <div style={{ marginTop: 8, fontSize: 11, color: T.teal }}>≡ƒöù {notifForm.link}</div>
                    )}
                    <div style={{ marginTop: 10, fontSize: 10, color: T.textMuted }}>Just now</div>
                  </div>
                </div>
              </div>
              <div style={{ marginTop: 12, fontSize: 10, color: T.textMuted, textAlign: "center" }}>
                This is how it will appear in the user's notification bell
              </div>
            </div>

            {/* Quick Templates */}
            {templates.length > 0 && (
              <div style={{ background: T.surface, borderRadius: 14, border: `1px solid ${T.border}`, padding: 20 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.gold, letterSpacing: 0.5, marginBottom: 14 }}>Quick Load Template</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {templates.slice(0, 5).map(t => (
                    <button key={t.id} type="button" onClick={() => loadTemplate(t)}
                      style={{ padding: "10px 14px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.surfaceAlt, textAlign: "left", cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = T.gold}
                      onMouseLeave={e => e.currentTarget.style.borderColor = T.border}>
                      <span style={{ fontSize: 16 }}>{t.icon || "≡ƒôï"}</span>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: T.white }}>{t.name}</div>
                        <div style={{ fontSize: 10, color: T.textMuted }}>{t.title}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TEMPLATES TAB */}
      {notifSubTab === "templates" && (
        <div style={{ background: T.surface, borderRadius: 14, border: `1px solid ${T.border}`, overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.white }}>Notification Templates</div>
              <div style={{ fontSize: 11, color: T.textMuted }}>{templates.length} templates saved</div>
            </div>
            <button type="button" onClick={() => { setNotifForm({ title: "", message: "", icon: "≡ƒöö", type: "info", link: "" }); setShowTemplateModal(true); }}
              style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: T.gold, color: T.bg, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>+ New Template</button>
          </div>
          {templates.length === 0 ? (
            <div style={{ padding: 60, textAlign: "center", color: T.textMuted }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>≡ƒôï</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: T.textSecondary }}>No templates yet</div>
              <div style={{ fontSize: 12 }}>Create templates for frequently used notifications</div>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16, padding: 20 }}>
              {templates.map(t => (
                <div key={t.id} style={{ background: T.surfaceAlt, borderRadius: 12, border: `1px solid ${T.border}`, padding: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 24 }}>{t.icon || "≡ƒôï"}</span>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: T.white }}>{t.name}</div>
                        <div style={{ fontSize: 10, color: T.textMuted }}>{t.type || "info"}</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 4 }}>
                      <button type="button" onClick={() => loadTemplate(t)} style={{ padding: "4px 8px", borderRadius: 4, border: `1px solid ${T.teal}`, background: "transparent", color: T.teal, fontSize: 10, cursor: "pointer" }}>Use</button>
                      <button type="button" onClick={() => deleteTemplate(t.id)} style={{ padding: "4px 8px", borderRadius: 4, border: `1px solid ${T.red}`, background: "transparent", color: T.red, fontSize: 10, cursor: "pointer" }}>├ù</button>
                    </div>
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: T.textSecondary, marginBottom: 4 }}>{t.title}</div>
                  <div style={{ fontSize: 11, color: T.textMuted, lineHeight: 1.4 }}>{t.message?.slice(0, 100)}{t.message?.length > 100 ? "..." : ""}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* HISTORY TAB */}
      {notifSubTab === "history" && (
        <div style={{ background: T.surface, borderRadius: 14, border: `1px solid ${T.border}`, overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: T.white }}>Notification History</div>
                <div style={{ fontSize: 11, color: T.textMuted }}>{filteredHistory.length} notifications</div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                {["all", "read", "unread"].map(f => (
                  <button key={f} type="button" onClick={() => setHistoryFilter(f)}
                    style={{ padding: "4px 10px", borderRadius: 6, border: `1px solid ${historyFilter === f ? T.gold : T.border}`, background: historyFilter === f ? T.goldGlow : "transparent", color: historyFilter === f ? T.gold : T.textMuted, fontSize: 10, fontWeight: 600, cursor: "pointer", textTransform: "capitalize" }}>
                    {f}
                  </button>
                ))}
              </div>
            </div>
            {selectedNotifs.length > 0 && (
              <button type="button" onClick={() => deleteNotifications(selectedNotifs)}
                style={{ padding: "6px 14px", borderRadius: 6, border: "none", background: T.red, color: T.white, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                Delete Selected ({selectedNotifs.length})
              </button>
            )}
          </div>
          {filteredHistory.length === 0 ? (
            <div style={{ padding: 60, textAlign: "center", color: T.textMuted }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>≡ƒô¡</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: T.textSecondary }}>No notifications found</div>
            </div>
          ) : (
            <div style={{ maxHeight: 500, overflowY: "auto" }}>
              {filteredHistory.map((n, i) => (
                <div key={n.id} style={{ padding: "14px 20px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: 14 }}
                  onMouseEnter={e => e.currentTarget.style.background = T.surfaceAlt}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <input type="checkbox" checked={selectedNotifs.includes(n.id)} onChange={e => {
                    if (e.target.checked) setSelectedNotifs([...selectedNotifs, n.id]);
                    else setSelectedNotifs(selectedNotifs.filter(id => id !== n.id));
                  }} style={{ cursor: "pointer" }} />
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: `${TYPES.find(t => t.id === n.type)?.color || T.blue}20`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
                    {n.icon || "≡ƒöö"}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: T.white, marginBottom: 2 }}>{n.title}</div>
                    <div style={{ fontSize: 11, color: T.textMuted }}>{n.message?.slice(0, 60)}{n.message?.length > 60 ? "..." : ""}</div>
                    <div style={{ fontSize: 10, color: T.textMuted, marginTop: 4 }}>
                      To: {n.userName || n.userId || "All"} ┬╖ {n.createdAt ? new Date(n.createdAt).toLocaleString("en-AE", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "ΓÇö"}
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                    <span style={{ fontSize: 9, padding: "2px 8px", borderRadius: 4, background: n.read ? `${T.green}20` : `${T.orange}20`, color: n.read ? T.green : T.orange, fontWeight: 600 }}>
                      {n.read ? "Read" : "Unread"}
                    </span>
                    {n.clicked && <span style={{ fontSize: 9, color: T.purple }}>Clicked</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SAVE TEMPLATE MODAL */}
      {showTemplateModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(4,9,15,0.92)", zIndex: 9000, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(8px)" }} onClick={() => setShowTemplateModal(false)}>
          <div style={{ background: T.surface, border: `1px solid ${T.gold}40`, borderRadius: 16, width: "95%", maxWidth: 400, padding: 24 }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 16, fontWeight: 700, color: T.gold, marginBottom: 20 }}>Save as Template</div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 10, color: T.textMuted, display: "block", marginBottom: 6 }}>Template Name *</label>
              <input value={templateName} onChange={e => setTemplateName(e.target.value)} placeholder="e.g. New Launch Alert"
                style={{ width: "100%", padding: "10px 12px", background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8, color: T.white, fontSize: 13, fontFamily: "'Outfit',sans-serif", boxSizing: "border-box" }} />
            </div>
            <div style={{ padding: "12px 14px", background: T.surfaceAlt, borderRadius: 8, marginBottom: 16 }}>
              <div style={{ fontSize: 10, color: T.textMuted, marginBottom: 4 }}>Will save:</div>
              <div style={{ fontSize: 12, color: T.white }}>{notifForm.icon} {notifForm.title || "(no title)"}</div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button type="button" onClick={() => setShowTemplateModal(false)} style={{ flex: 1, padding: "10px", borderRadius: 8, border: `1px solid ${T.border}`, background: "transparent", color: T.textMuted, fontSize: 12, cursor: "pointer" }}>Cancel</button>
              <button type="button" onClick={saveTemplate} style={{ flex: 2, padding: "10px", borderRadius: 8, border: "none", background: T.gold, color: T.bg, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Save Template</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ
   TAB 11: EMAIL DIGEST COMPONENT ΓÇö PRO LEVEL
   Schedule, preview, send, track. EmailJS bulk send.
ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ */

export default NotificationsTab;
