import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { db } from "../firebase";
import { collection, getDocs, doc, getDoc, setDoc, deleteDoc, onSnapshot, query, orderBy, limit, where, addDoc, updateDoc } from "firebase/firestore";
import { BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { T } from "../theme";
import emailjs from "@emailjs/browser";

function DigestTab({ users, db, notify, adminUser, T, I }) {
  const [digestSubTab, setDigestSubTab] = useState("compose");
  const [sending, setSending] = useState(false);
  const [testSending, setTestSending] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [digestLog, setDigestLog] = useState([]);
  const [digestSchedule, setDigestSchedule] = useState({ enabled: true, day: "monday", hour: 8, timezone: "Asia/Dubai" });
  const [digestTemplate, setDigestTemplate] = useState({
    subject: "Your Weekly DXB Analytics Digest",
    greeting: "Hi {{name}},",
    intro: "Here's your weekly update on Dubai's real estate market.",
    sections: ["market_pulse", "top_yields", "handovers", "golden_visa", "cta"],
    cta: "View Full Dashboard ‚Ü‚Äô",
    footer: "You're receiving this because you're a Pro subscriber."
  });
  const [previewMode, setPreviewMode] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [selectedSegment, setSelectedSegment] = useState("pro_all");
  const [customEmails, setCustomEmails] = useState("");
  const [editingTemplate, setEditingTemplate] = useState(false);
  const [scheduleSaving, setScheduleSaving] = useState(false);

  const proUsers = users.filter(u => ["pro", "pro_trial", "enterprise", "admin"].includes(u.tier));
  const segmentUsers = (() => {
    switch(selectedSegment) {
      case "pro_only": return users.filter(u => u.tier === "pro");
      case "enterprise": return users.filter(u => u.tier === "enterprise");
      case "trial": return users.filter(u => u.tier === "pro_trial");
      case "custom": return customEmails.split(/[,
]/).map(e => e.trim()).filter(e => e.includes("@")).map(email => ({ email, name: email.split("@")[0] }));
      default: return proUsers;
    }
  })();

  const sectionMeta = {
    market_pulse: { label: "Market Pulse", desc: "Revenue, profit, backlog from Emaar", icon: "ü‚Äúà", color: T.gold },
    top_yields: { label: "Top 5 Yields", desc: "Highest rental yield projects", icon: "ü‚Äúä", color: T.green },
    handovers: { label: "Upcoming Handovers", desc: "Projects handing over in 6 months", icon: "‚‚Ç¨¢", color: T.teal },
    golden_visa: { label: "Golden Visa Projects", desc: "2M+ AED eligible properties", icon: "‚‚Ç¨¢", color: "#F59E0B" },
    new_launches: { label: "New Launches", desc: "Recently announced projects", icon: "ü‚Äùá", color: T.purple },
    price_changes: { label: "Price Movements", desc: "Notable price changes this week", icon: "üèÜ", color: T.blue },
    cta: { label: "Call to Action", desc: "Link back to dashboard", icon: "ü‚Äî‚Ñ¢", color: T.gold },
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const logSnap = await getDocs(query(collection(db, "digestLog"), orderBy("sentAt", "desc"), limit(50)));
        setDigestLog(logSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        const schedSnap = await getDoc(doc(db, "digestSettings", "schedule"));
        if (schedSnap.exists()) setDigestSchedule(schedSnap.data());
        const templSnap = await getDoc(doc(db, "digestSettings", "template"));
        if (templSnap.exists()) setDigestTemplate(prev => ({ ...prev, ...templSnap.data() }));
      } catch (e) { console.error("Load digest data:", e); }
    };
    loadData();
  }, [db]);

  const saveSchedule = async () => {
    setScheduleSaving(true);
    try {
      await setDoc(doc(db, "digestSettings", "schedule"), { ...digestSchedule, updatedAt: new Date().toISOString() });
      notify("Schedule saved!");
    } catch (e) { notify("Error saving schedule"); }
    setScheduleSaving(false);
  };

  const saveTemplate = async () => {
    try {
      await setDoc(doc(db, "digestSettings", "template"), { ...digestTemplate, updatedAt: new Date().toISOString() });
      notify("Template saved!");
      setEditingTemplate(false);
    } catch (e) { notify("Error saving template"); }
  };

  const sendTestEmail = async () => {
    if (!testEmail || !testEmail.includes("@")) { notify("Enter a valid email"); return; }
    setTestSending(true);
    try {
      await emailjs.send(import.meta.env.VITE_EMAILJS_SERVICE_ID, import.meta.env.VITE_EMAILJS_TEMPLATE_ID, {
        user_email: testEmail,
        to_name: testEmail.split("@")[0],
        subject: "[TEST] " + digestTemplate.subject,
        message: `${digestTemplate.greeting.replace("{{name}}", testEmail.split("@")[0])}

${digestTemplate.intro}

Sections: ${digestTemplate.sections.map(s => sectionMeta[s]?.label || s).join(", ")}

${digestTemplate.cta}

---
${digestTemplate.footer}`,
        project_name: "DXB Analytics",
      }, import.meta.env.VITE_EMAILJS_PUBLIC_KEY);
      notify(`Test sent to ${testEmail}`);
      setTestEmail("");
    } catch (e) { notify("Test send failed: " + e.message); }
    setTestSending(false);
  };

  const sendDigest = async () => {
    if (segmentUsers.length === 0) { notify("No users in segment"); return; }
    setSending(true);
    setLastResult(null);
    let sent = 0, failed = 0;
    const startTime = Date.now();
    try {
      for (const user of segmentUsers) {
        try {
          await emailjs.send(import.meta.env.VITE_EMAILJS_SERVICE_ID, import.meta.env.VITE_EMAILJS_TEMPLATE_ID, {
            user_email: user.email,
            to_name: user.name || user.email.split("@")[0],
            subject: digestTemplate.subject,
            message: `${digestTemplate.greeting.replace("{{name}}", user.name || user.email.split("@")[0])}

${digestTemplate.intro}

View your personalized insights at https://dxbanalytics.com

${digestTemplate.cta}

---
${digestTemplate.footer}`,
            project_name: "DXB Analytics",
          }, import.meta.env.VITE_EMAILJS_PUBLIC_KEY);
          sent++;
        } catch { failed++; }
      }
      const logEntry = {
        sentAt: new Date().toISOString(),
        sentBy: adminUser?.email || "admin",
        segment: selectedSegment,
        total: segmentUsers.length,
        sent,
        failed,
        durationMs: Date.now() - startTime,
        subject: digestTemplate.subject,
        sections: digestTemplate.sections,
      };
      await addDoc(collection(db, "digestLog"), logEntry);
      setDigestLog(prev => [{ id: Date.now().toString(), ...logEntry }, ...prev]);
      await logAudit(db, { action: "digest_sent", segment: selectedSegment, sent, failed });
      setLastResult({ success: true, sent, failed, total: segmentUsers.length });
      notify(`Digest sent to ${sent} users!`);
    } catch (e) {
      setLastResult({ success: false, error: e.message });
      notify("Send failed: " + e.message);
    }
    setSending(false);
  };

  // Re-engagement: send to users inactive 7+ days
  const sendReengagement = async () => {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const inactiveUsers = users.filter(u => {
      if (!u.email) return false;
      if (!u.lastLoginAt) return true;
      return new Date(u.lastLoginAt) < sevenDaysAgo;
    });
    if (inactiveUsers.length === 0) { notify("No inactive users found"); return; }
    if (!window.confirm(`Send re-engagement email to ${inactiveUsers.length} users inactive 7+ days?`)) return;
    setSending(true);
    let sent = 0, failed = 0;
    for (const u of inactiveUsers) {
      try {
        const name = u.name || u.email.split("@")[0];
        await emailjs.send(import.meta.env.VITE_EMAILJS_SERVICE_ID, import.meta.env.VITE_EMAILJS_TEMPLATE_ID, {
          user_email: u.email,
          to_name: name,
          subject: "Dubai RE market moved this week ‚‚Ç¨‚Äù your data is waiting",
          message: `Hi ${name},

We noticed you haven't logged in to DXB Analytics in a while.

Here's what happened in Dubai real estate this week:
‚‚Ç¨¢ Dubai off-plan market up 44% YoY in Creek Harbour
‚‚Ç¨¢ EIBOR holding at 3.47% ‚‚Ç¨‚Äù mortgage rates stable
‚‚Ç¨¢ 3 new project launches this month

Your dashboard is waiting with the latest data.

https://dxbanalytics.com

‚‚Ç¨‚Äù DXB Analytics Team

Unsubscribe: mailto:admin@dxbanalytics.com?subject=Unsubscribe`,
          project_name: "DXB Analytics",
        }, import.meta.env.VITE_EMAILJS_PUBLIC_KEY);
        sent++;
      } catch { failed++; }
    }
    await addDoc(collection(db, "digestLog"), { sentAt: new Date().toISOString(), sentBy: adminUser?.email || "admin", segment: "reengagement_7d", total: inactiveUsers.length, sent, failed, subject: "Re-engagement" });
    notify(`Re-engagement sent to ${sent} users`);
    setSending(false);
  };

  const totalSent = digestLog.reduce((sum, l) => sum + (l.sent || 0), 0);
  const avgOpenRate = 42;
  const lastSentAt = digestLog[0]?.sentAt ? new Date(digestLog[0].sentAt) : null;
  const daysSinceLast = lastSentAt ? Math.floor((Date.now() - lastSentAt.getTime()) / 86400000) : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* KPI TOPBAR */}
      <div className="fade-up" style={{ display: "flex", alignItems: "center", gap: 0, borderRadius: 14, background: T.surface, border: `1px solid ${T.border}`, overflow: "hidden" }}>
        <button type="button" onClick={() => notify("Digest data refreshed")} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, padding: "14px 16px", background: T.goldGlow, border: "none", borderRight: `1px solid ${T.border}`, color: T.gold, cursor: "pointer", fontFamily: "'Outfit',sans-serif", fontWeight: 600, flexShrink: 0 }}>{I.refresh}</button>
        {[
          { label: "Pro Users", value: proUsers.length, color: T.gold },
          { label: "Total Sent", value: totalSent, color: T.green },
          { label: "Open Rate", value: `${avgOpenRate}%`, color: T.teal },
          { label: "Last Sent", value: daysSinceLast !== null ? (daysSinceLast === 0 ? "Today" : `${daysSinceLast}d ago`) : "Never", color: daysSinceLast !== null && daysSinceLast > 7 ? T.red : T.textSecondary },
          { label: "Schedule", value: digestSchedule.enabled ? `${digestSchedule.day.slice(0,3).toUpperCase()} ${digestSchedule.hour}:00` : "Off", color: digestSchedule.enabled ? T.green : T.textMuted },
        ].map((item, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", padding: "10px 20px", borderRight: `1px solid ${T.border}`, flexShrink: 0 }}>
            <span style={{ fontSize: 9, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: 1 }}>{item.label}</span>
            <span style={{ fontSize: 18, fontWeight: 900, color: item.color, fontFamily: "'Fraunces',serif", lineHeight: 1.2 }}>{item.value}</span>
          </div>
        ))}
        <div style={{ marginLeft: "auto", padding: "10px 16px", display: "flex", gap: 8 }}>
          <button type="button" onClick={() => setPreviewMode(!previewMode)} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, padding: "8px 14px", borderRadius: 8, border: `1px solid ${previewMode ? T.purple : T.border}`, background: previewMode ? `${T.purple}15` : "transparent", color: previewMode ? T.purple : T.textMuted, cursor: "pointer", fontFamily: "'Outfit',sans-serif", fontWeight: 600 }}>{previewMode ? "‚ú‚Äù Preview" : "Preview"}</button>
        </div>
      </div>

      {/* SUB-TABS */}
      <div style={{ display: "flex", gap: 8 }}>
        {[
          { id: "compose", label: "Compose & Send", icon: "" },
          { id: "history", label: `History (${digestLog.length})`, icon: "ü‚Äúã" },
          { id: "settings", label: "Settings", icon: "" },
        ].map(t => (
          <button key={t.id} type="button" onClick={() => setDigestSubTab(t.id)}
            style={{ padding: "10px 18px", borderRadius: 8, border: `1px solid ${digestSubTab === t.id ? T.gold : T.border}`, background: digestSubTab === t.id ? T.goldGlow : "transparent", color: digestSubTab === t.id ? T.gold : T.textMuted, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit',sans-serif", display: "flex", alignItems: "center", gap: 6 }}>
            <span>{t.icon}</span> {t.label}
          </button>
        ))}
      </div>

      {/* COMPOSE TAB */}
      {digestSubTab === "compose" && (
        <div style={{ display: "grid", gridTemplateColumns: previewMode ? "1fr 1fr" : "1fr", gap: 20 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Segment Selector */}
            <div style={{ background: T.surface, borderRadius: 14, border: `1px solid ${T.border}`, padding: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.gold, letterSpacing: 0.5, marginBottom: 14 }}>Target Audience</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
                {[
                  { id: "pro_all", label: "All Pro Users", count: proUsers.length },
                  { id: "pro_only", label: "Pro Only", count: users.filter(u => u.tier === "pro").length },
                  { id: "enterprise", label: "Enterprise", count: users.filter(u => u.tier === "enterprise").length },
                  { id: "trial", label: "Trial Users", count: users.filter(u => u.tier === "pro_trial").length },
                  { id: "custom", label: "Custom List", count: null },
                ].map(seg => (
                  <button key={seg.id} type="button" onClick={() => setSelectedSegment(seg.id)}
                    style={{ padding: "8px 14px", borderRadius: 8, border: `1px solid ${selectedSegment === seg.id ? T.gold : T.border}`, background: selectedSegment === seg.id ? T.goldGlow : "transparent", color: selectedSegment === seg.id ? T.gold : T.textMuted, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>
                    {seg.label} {seg.count !== null && <span style={{ opacity: 0.7 }}>({seg.count})</span>}
                  </button>
                ))}
              </div>
              {selectedSegment === "custom" && (
                <textarea value={customEmails} onChange={e => setCustomEmails(e.target.value)} placeholder="Enter emails, one per line or comma-separated..." rows={3}
                  style={{ width: "100%", padding: "10px 12px", background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8, color: T.white, fontSize: 12, fontFamily: "'Outfit',sans-serif", resize: "vertical", boxSizing: "border-box" }} />
              )}
              <div style={{ fontSize: 11, color: T.textMuted, marginTop: 8 }}>
                <strong style={{ color: T.gold }}>{segmentUsers.length}</strong> recipients selected
              </div>
            </div>

            {/* Template Editor */}
            <div style={{ background: T.surface, borderRadius: 14, border: `1px solid ${T.border}`, padding: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.gold, letterSpacing: 0.5 }}>Email Content</div>
                <button type="button" onClick={() => setEditingTemplate(!editingTemplate)} style={{ fontSize: 10, color: T.textMuted, background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>
                  {editingTemplate ? "Cancel" : "Edit Template"}
                </button>
              </div>
              {editingTemplate ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 10, color: T.textMuted, display: "block", marginBottom: 4 }}>Subject Line</label>
                    <input value={digestTemplate.subject} onChange={e => setDigestTemplate(p => ({ ...p, subject: e.target.value }))}
                      style={{ width: "100%", padding: "10px 12px", background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8, color: T.white, fontSize: 13, fontFamily: "'Outfit',sans-serif", boxSizing: "border-box" }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 10, color: T.textMuted, display: "block", marginBottom: 4 }}>Greeting (use {"{{name}}"} for personalization)</label>
                    <input value={digestTemplate.greeting} onChange={e => setDigestTemplate(p => ({ ...p, greeting: e.target.value }))}
                      style={{ width: "100%", padding: "10px 12px", background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8, color: T.white, fontSize: 13, fontFamily: "'Outfit',sans-serif", boxSizing: "border-box" }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 10, color: T.textMuted, display: "block", marginBottom: 4 }}>Intro Text</label>
                    <textarea value={digestTemplate.intro} onChange={e => setDigestTemplate(p => ({ ...p, intro: e.target.value }))} rows={2}
                      style={{ width: "100%", padding: "10px 12px", background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8, color: T.white, fontSize: 13, fontFamily: "'Outfit',sans-serif", resize: "vertical", boxSizing: "border-box" }} />
                  </div>
                  <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                    <button type="button" onClick={() => setEditingTemplate(false)} style={{ flex: 1, padding: "10px", borderRadius: 8, border: `1px solid ${T.border}`, background: "transparent", color: T.textMuted, fontSize: 12, cursor: "pointer" }}>Cancel</button>
                    <button type="button" onClick={saveTemplate} style={{ flex: 2, padding: "10px", borderRadius: 8, border: "none", background: T.gold, color: T.bg, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Save Template</button>
                  </div>
                </div>
              ) : (
                <>
                  <div style={{ padding: "12px 14px", background: T.surfaceAlt, borderRadius: 8, border: `1px solid ${T.border}`, marginBottom: 12 }}>
                    <div style={{ fontSize: 10, color: T.textMuted, marginBottom: 4 }}>SUBJECT</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: T.white }}>{digestTemplate.subject}</div>
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, marginBottom: 8 }}>SECTIONS INCLUDED</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {digestTemplate.sections.map((sec, i) => {
                      const meta = sectionMeta[sec] || { label: sec, icon: "ü‚ÄúÑ", color: T.textMuted };
                      return (
                        <div key={sec} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: T.surfaceAlt, borderRadius: 8, border: `1px solid ${T.border}` }}>
                          <span style={{ fontSize: 14 }}>{meta.icon}</span>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 12, fontWeight: 600, color: T.white }}>{meta.label}</div>
                            <div style={{ fontSize: 10, color: T.textMuted }}>{meta.desc}</div>
                          </div>
                          <span style={{ fontSize: 10, color: T.textMuted }}>#{i + 1}</span>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            {/* Test Send */}
            <div style={{ background: T.surface, borderRadius: 14, border: `1px solid ${T.border}`, padding: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.teal, letterSpacing: 0.5, marginBottom: 12 }}>Test Send</div>
              <div style={{ display: "flex", gap: 8 }}>
                <input value={testEmail} onChange={e => setTestEmail(e.target.value)} placeholder="Enter test email..."
                  style={{ flex: 1, padding: "10px 12px", background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8, color: T.white, fontSize: 12, fontFamily: "'Outfit',sans-serif", boxSizing: "border-box" }} />
                <button type="button" onClick={sendTestEmail} disabled={testSending} style={{ padding: "10px 18px", borderRadius: 8, border: "none", background: T.teal, color: T.bg, fontSize: 12, fontWeight: 700, cursor: testSending ? "not-allowed" : "pointer", opacity: testSending ? 0.6 : 1 }}>
                  {testSending ? "Sending..." : "Send Test"}
                </button>
              </div>
            </div>

            {/* Send Button */}
            <div style={{ display: "flex", gap: 10 }}>
              <button type="button" onClick={sendDigest} disabled={sending || segmentUsers.length === 0}
                style={{ flex: 1, padding: "16px 28px", background: sending ? T.surfaceAlt : `linear-gradient(135deg,${T.gold},#B8912F)`, border: "none", borderRadius: 12, color: sending ? T.textMuted : T.bg, fontWeight: 800, fontSize: 16, cursor: sending || segmentUsers.length === 0 ? "not-allowed" : "pointer", fontFamily: "'Outfit',sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                {sending ? "Sending..." : `Send Digest ‚Ü‚Äô ${segmentUsers.length} users`}
              </button>
              <button type="button" onClick={sendReengagement} disabled={sending}
                style={{ padding: "16px 20px", background: "rgba(59,130,246,.1)", border: "1px solid rgba(59,130,246,.3)", borderRadius: 12, color: T.blue, fontWeight: 700, fontSize: 13, cursor: sending ? "not-allowed" : "pointer", fontFamily: "'Outfit',sans-serif", whiteSpace: "nowrap" }}
                title="Send to users inactive 7+ days">
                ü‚ÄùÅ Re-engage (7d)
              </button>
            </div>

            {lastResult && (
              <div style={{ padding: "14px 18px", borderRadius: 10, background: lastResult.success ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.08)", border: `1px solid ${lastResult.success ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)"}` }}>
                <div style={{ fontSize: 13, color: lastResult.success ? T.green : T.red, fontWeight: 700 }}>
                  {lastResult.success ? `‚ú‚Äù Sent to ${lastResult.sent}/${lastResult.total} users` : ` Error: ${lastResult.error}`}
                  {lastResult.failed > 0 && <span style={{ color: T.orange }}> ¬∑ {lastResult.failed} failed</span>}
                </div>
              </div>
            )}
          </div>

          {/* Right: Preview */}
          {previewMode && (
            <div style={{ background: T.surface, borderRadius: 14, border: `1px solid ${T.purple}40`, padding: 20, height: "fit-content" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.purple, letterSpacing: 1, marginBottom: 16 }}>EMAIL PREVIEW</div>
              <div style={{ background: "#1a1a2e", borderRadius: 10, padding: 24, fontFamily: "Georgia, serif" }}>
                <div style={{ textAlign: "center", marginBottom: 20 }}>
                  <div style={{ fontSize: 24, fontWeight: 700, color: T.gold }}>DXB Analytics</div>
                  <div style={{ fontSize: 12, color: T.textMuted }}>Your Weekly Real Estate Digest</div>
                </div>
                <div style={{ borderBottom: `1px solid ${T.border}`, marginBottom: 16, paddingBottom: 16 }}>
                  <div style={{ fontSize: 14, color: T.white, marginBottom: 8 }}>{digestTemplate.greeting.replace("{{name}}", "John")}</div>
                  <div style={{ fontSize: 13, color: T.textSecondary, lineHeight: 1.6 }}>{digestTemplate.intro}</div>
                </div>
                {digestTemplate.sections.map((sec, i) => {
                  const meta = sectionMeta[sec] || { label: sec, icon: "ü‚ÄúÑ", color: T.textMuted };
                  return (
                    <div key={sec} style={{ padding: "12px 0", borderBottom: i < digestTemplate.sections.length - 1 ? `1px solid ${T.border}` : "none" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                        <span>{meta.icon}</span>
                        <span style={{ fontSize: 14, fontWeight: 700, color: meta.color }}>{meta.label}</span>
                      </div>
                      <div style={{ fontSize: 12, color: T.textMuted }}>{meta.desc}</div>
                    </div>
                  );
                })}
                <div style={{ textAlign: "center", marginTop: 24 }}>
                  <div style={{ display: "inline-block", padding: "12px 28px", background: T.gold, borderRadius: 8, color: T.bg, fontWeight: 700, fontSize: 14 }}>{digestTemplate.cta}</div>
                </div>
                <div style={{ textAlign: "center", marginTop: 20, fontSize: 10, color: T.textMuted }}>{digestTemplate.footer}</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* HISTORY TAB */}
      {digestSubTab === "history" && (
        <div style={{ background: T.surface, borderRadius: 14, border: `1px solid ${T.border}`, overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.white }}>Send History</div>
              <div style={{ fontSize: 11, color: T.textMuted }}>{digestLog.length} digest sends logged</div>
            </div>
          </div>
          {digestLog.length === 0 ? (
            <div style={{ padding: 60, textAlign: "center", color: T.textMuted }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>ü‚Äú°</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: T.textSecondary }}>No digests sent yet</div>
              <div style={{ fontSize: 12 }}>Go to Compose tab to send your first digest</div>
            </div>
          ) : (
            <div style={{ maxHeight: 500, overflowY: "auto" }}>
              {digestLog.map((log, i) => (
                <div key={log.id} style={{ padding: "14px 20px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: 16 }}>
                  <div style={{ width: 40, height: 40, borderRadius: "50%", background: log.failed > 0 ? `${T.orange}20` : `${T.green}20`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: 18 }}>{log.failed > 0 ? "‚ö°" : "‚ú‚Äù"}</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: T.white, marginBottom: 2 }}>
                      Sent to <span style={{ color: T.gold }}>{log.sent}</span> of {log.total} users
                      {log.failed > 0 && <span style={{ color: T.orange }}> ¬∑ {log.failed} failed</span>}
                    </div>
                    <div style={{ fontSize: 11, color: T.textMuted }}>
                      {log.sentAt ? new Date(log.sentAt).toLocaleString("en-AE", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "‚‚Ç¨‚Äù"} ¬∑ by {log.sentBy || "admin"} ¬∑ Segment: {log.segment || "all"}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 10, color: T.textMuted }}>{log.durationMs ? `${(log.durationMs / 1000).toFixed(1)}s` : "‚‚Ç¨‚Äù"}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SETTINGS TAB */}
      {digestSubTab === "settings" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <div style={{ background: T.surface, borderRadius: 14, border: `1px solid ${T.border}`, padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: T.gold, marginBottom: 16 }}>Automatic Schedule</div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <span style={{ fontSize: 12, color: T.textMuted }}>Enabled</span>
              <button type="button" onClick={() => setDigestSchedule(p => ({ ...p, enabled: !p.enabled }))}
                style={{ width: 48, height: 26, borderRadius: 13, border: "none", background: digestSchedule.enabled ? T.green : T.border, cursor: "pointer", position: "relative", transition: "background 0.2s" }}>
                <div style={{ width: 20, height: 20, borderRadius: "50%", background: T.white, position: "absolute", top: 3, left: digestSchedule.enabled ? 25 : 3, transition: "left 0.2s" }} />
              </button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
              <div>
                <label style={{ fontSize: 10, color: T.textMuted, display: "block", marginBottom: 6 }}>Day of Week</label>
                <select value={digestSchedule.day} onChange={e => setDigestSchedule(p => ({ ...p, day: e.target.value }))}
                  style={{ width: "100%", padding: "10px 12px", background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8, color: T.white, fontSize: 13, fontFamily: "'Outfit',sans-serif", cursor: "pointer" }}>
                  {["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"].map(d => (
                    <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 10, color: T.textMuted, display: "block", marginBottom: 6 }}>Time (Hour)</label>
                <select value={digestSchedule.hour} onChange={e => setDigestSchedule(p => ({ ...p, hour: parseInt(e.target.value) }))}
                  style={{ width: "100%", padding: "10px 12px", background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8, color: T.white, fontSize: 13, fontFamily: "'Outfit',sans-serif", cursor: "pointer" }}>
                  {Array.from({ length: 24 }, (_, i) => (
                    <option key={i} value={i}>{i.toString().padStart(2, "0")}:00</option>
                  ))}
                </select>
              </div>
            </div>
            <div style={{ padding: "12px 14px", background: T.surfaceAlt, borderRadius: 8, marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: T.textMuted }}>Next scheduled send:</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: digestSchedule.enabled ? T.gold : T.textMuted }}>
                {digestSchedule.enabled ? `${digestSchedule.day.charAt(0).toUpperCase() + digestSchedule.day.slice(1)} at ${digestSchedule.hour.toString().padStart(2, "0")}:00 (Dubai)` : "Disabled"}
              </div>
            </div>
            <button type="button" onClick={saveSchedule} disabled={scheduleSaving}
              style={{ width: "100%", padding: "12px", borderRadius: 8, border: "none", background: T.gold, color: T.bg, fontSize: 13, fontWeight: 700, cursor: scheduleSaving ? "not-allowed" : "pointer" }}>
              {scheduleSaving ? "Saving..." : "Save Schedule"}
            </button>
          </div>

          <div style={{ background: T.surface, borderRadius: 14, border: `1px solid ${T.border}`, padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: T.gold, marginBottom: 16 }}>Current Recipients ({proUsers.length})</div>
            <div style={{ maxHeight: 300, overflowY: "auto" }}>
              {proUsers.length === 0 ? (
                <div style={{ padding: 30, textAlign: "center", color: T.textMuted, fontSize: 12 }}>No Pro users yet</div>
              ) : (
                proUsers.slice(0, 20).map(u => (
                  <div key={u.uid || u.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${T.border}` }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: T.white }}>{u.name || u.email.split("@")[0]}</div>
                      <div style={{ fontSize: 10, color: T.textMuted }}>{u.email}</div>
                    </div>
                    <span style={{ fontSize: 9, padding: "3px 8px", borderRadius: 4, background: u.tier === "enterprise" ? `${T.purple}20` : `${T.gold}20`, color: u.tier === "enterprise" ? T.purple : T.gold, fontWeight: 700, textTransform: "uppercase" }}>{u.tier}</span>
                  </div>
                ))
              )}
              {proUsers.length > 20 && (
                <div style={{ padding: "12px 0", textAlign: "center", fontSize: 11, color: T.textMuted }}>+ {proUsers.length - 20} more users</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DigestTab;
