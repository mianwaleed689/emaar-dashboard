import React, { useState, useEffect } from "react";
import { doc, setDoc, getDoc, getDocs, addDoc, collection, query, orderBy, limit } from "firebase/firestore";
import { auth } from "../../../firebase";
import emailjs from "@emailjs/browser";

let _cachedIP = null;
async function getAdminIP() {
  if (_cachedIP) return _cachedIP;
  try {
    const r = await fetch("https://api.ipify.org?format=json");
    const d = await r.json();
    _cachedIP = d.ip;
    return _cachedIP;
  } catch { return "unknown"; }
}

let _webhookUrl = null;
async function logAudit(db, payload) {
  try {
    const ip = await getAdminIP();
    const changedBy = auth.currentUser?.email || "admin";
    const entry = { ...payload, changedBy, changedAt: new Date().toISOString(), ip };
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    await setDoc(doc(db, "auditLog", id), entry);
    if (_webhookUrl) {
      try { fetch(_webhookUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(entry) }); } catch {}
    }
    return entry;
  } catch (e) { console.error("logAudit:", e); }
}

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
    cta: "View Full Dashboard ΓåÆ",
    footer: "You're receiving this because you're a Pro subscriber."
  });
  const [previewMode, setPreviewMode] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [selectedSegment, setSelectedSegment] = useState("pro_all");
  const [customEmails, setCustomEmails] = useState("");
  const [editingTemplate, setEditingTemplate] = useState(false);
  const [scheduleSaving, setScheduleSaving] = useState(false);
  const [unsubscribes, setUnsubscribes] = useState([]);
  const [unsubSearch, setUnsubSearch] = useState("");
  const [unsubLoading, setUnsubLoading] = useState(false);

  const proUsers = users.filter(u => ["pro", "pro_trial", "enterprise", "admin"].includes(u.tier));
  const segmentUsers = (() => {
    switch(selectedSegment) {
      case "pro_only": return users.filter(u => u.tier === "pro");
      case "enterprise": return users.filter(u => u.tier === "enterprise");
      case "trial": return users.filter(u => u.tier === "pro_trial");
      case "custom": return customEmails.split(/[,\n]/).map(e => e.trim()).filter(e => e.includes("@")).map(email => ({ email, name: email.split("@")[0] }));
      default: return proUsers;
    }
  })();

  const sectionMeta = {
    market_pulse: { label: "Market Pulse", desc: "Revenue, profit, backlog from Emaar", icon: "≡ƒôè", color: T.gold },
    top_yields: { label: "Top 5 Yields", desc: "Highest rental yield projects", icon: "≡ƒôê", color: T.green },
    handovers: { label: "Upcoming Handovers", desc: "Projects handing over in 6 months", icon: "≡ƒÅù", color: T.teal },
    golden_visa: { label: "Golden Visa Projects", desc: "2M+ AED eligible properties", icon: "≡ƒîƒ", color: "#F59E0B" },
    new_launches: { label: "New Launches", desc: "Recently announced projects", icon: "≡ƒÜÇ", color: T.purple },
    price_changes: { label: "Price Movements", desc: "Notable price changes this week", icon: "≡ƒÆ░", color: T.blue },
    cta: { label: "Call to Action", desc: "Link back to dashboard", icon: "≡ƒöù", color: T.gold },
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
        // Load unsubscribes
        try {
          const unsubSnap = await getDocs(query(collection(db, "digestUnsubscribes"), orderBy("unsubscribedAt", "desc")));
          setUnsubscribes(unsubSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        } catch {}
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
      await emailjs.send("service_da7nshv", "template_gl1xqhy", {
        to_email: testEmail,
        to_name: testEmail.split("@")[0],
        subject: "[TEST] " + digestTemplate.subject,
        message: `${digestTemplate.greeting.replace("{{name}}", testEmail.split("@")[0])}\n\n${digestTemplate.intro}\n\nSections: ${digestTemplate.sections.map(s => sectionMeta[s]?.label || s).join(", ")}\n\n${digestTemplate.cta}\n\n---\n${digestTemplate.footer}`,
        project_name: "DXB Analytics",
      }, "USkwUhp0csGCVDkdQ");
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
          await emailjs.send("service_da7nshv", "template_gl1xqhy", {
            to_email: user.email,
            to_name: user.name || user.email.split("@")[0],
            subject: digestTemplate.subject,
            message: `${digestTemplate.greeting.replace("{{name}}", user.name || user.email.split("@")[0])}\n\n${digestTemplate.intro}\n\nView your personalized insights at https://emaar-dashboard.vercel.app\n\n${digestTemplate.cta}\n\n---\n${digestTemplate.footer}`,
            project_name: "DXB Analytics",
          }, "USkwUhp0csGCVDkdQ");
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
          <button type="button" onClick={() => setPreviewMode(!previewMode)} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, padding: "8px 14px", borderRadius: 8, border: `1px solid ${previewMode ? T.purple : T.border}`, background: previewMode ? `${T.purple}15` : "transparent", color: previewMode ? T.purple : T.textMuted, cursor: "pointer", fontFamily: "'Outfit',sans-serif", fontWeight: 600 }}>{previewMode ? "Γ£ô Preview" : "Preview"}</button>
        </div>
      </div>

      {/* SUB-TABS */}
      <div style={{ display: "flex", gap: 8 }}>
        {[
          { id: "compose",     label: "Compose & Send",               icon: "✉" },
          { id: "history",     label: `History (${digestLog.length})`, icon: "📋" },
          { id: "settings",    label: "Settings",                      icon: "⚙" },
          { id: "unsubscribe", label: `Unsubscribes (${unsubscribes.length})`, icon: "🚫" },
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
                      const meta = sectionMeta[sec] || { label: sec, icon: "≡ƒôä", color: T.textMuted };
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
            <button type="button" onClick={sendDigest} disabled={sending || segmentUsers.length === 0}
              style={{ padding: "16px 28px", background: sending ? T.surfaceAlt : `linear-gradient(135deg,${T.gold},#B8912F)`, border: "none", borderRadius: 12, color: sending ? T.textMuted : T.bg, fontWeight: 800, fontSize: 16, cursor: sending || segmentUsers.length === 0 ? "not-allowed" : "pointer", fontFamily: "'Outfit',sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
              {sending ? "Sending..." : `Send Digest Now ΓåÆ ${segmentUsers.length} users`}
            </button>

            {lastResult && (
              <div style={{ padding: "14px 18px", borderRadius: 10, background: lastResult.success ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.08)", border: `1px solid ${lastResult.success ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)"}` }}>
                <div style={{ fontSize: 13, color: lastResult.success ? T.green : T.red, fontWeight: 700 }}>
                  {lastResult.success ? `Γ£ô Sent to ${lastResult.sent}/${lastResult.total} users` : `Γ£ù Error: ${lastResult.error}`}
                  {lastResult.failed > 0 && <span style={{ color: T.orange }}> · {lastResult.failed} failed</span>}
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
                  const meta = sectionMeta[sec] || { label: sec, icon: "≡ƒôä", color: T.textMuted };
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
              <div style={{ fontSize: 32, marginBottom: 12 }}>≡ƒô¡</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: T.textSecondary }}>No digests sent yet</div>
              <div style={{ fontSize: 12 }}>Go to Compose tab to send your first digest</div>
            </div>
          ) : (
            <div style={{ maxHeight: 500, overflowY: "auto" }}>
              {digestLog.map((log, i) => (
                <div key={log.id} style={{ padding: "14px 20px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: 16 }}>
                  <div style={{ width: 40, height: 40, borderRadius: "50%", background: log.failed > 0 ? `${T.orange}20` : `${T.green}20`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: 18 }}>{log.failed > 0 ? "ΓÜá" : "Γ£ô"}</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: T.white, marginBottom: 2 }}>
                      Sent to <span style={{ color: T.gold }}>{log.sent}</span> of {log.total} users
                      {log.failed > 0 && <span style={{ color: T.orange }}> · {log.failed} failed</span>}
                    </div>
                    <div style={{ fontSize: 11, color: T.textMuted }}>
                      {log.sentAt ? new Date(log.sentAt).toLocaleString("en-AE", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"} · by {log.sentBy || "admin"} · Segment: {log.segment || "all"}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 10, color: T.textMuted }}>{log.durationMs ? `${(log.durationMs / 1000).toFixed(1)}s` : "—"}</div>
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

      {/* UNSUBSCRIBE MANAGER */}
      {digestSubTab === "unsubscribe" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Stats bar */}
          <div style={{ display: "flex", gap: 12 }}>
            {[
              { label: "Total Unsubscribed", value: unsubscribes.length, color: "#EF4444" },
              { label: "This Month", value: unsubscribes.filter(u => { try { return new Date(u.unsubscribedAt) > new Date(Date.now() - 30*24*60*60*1000); } catch { return false; } }).length, color: "#F97316" },
              { label: "Churn Rate", value: users.length ? `${((unsubscribes.length / users.length) * 100).toFixed(1)}%` : "0%", color: "#F97316" },
              { label: "Active Subscribers", value: Math.max(0, proUsers.length - unsubscribes.length), color: "#10B981" },
            ].map((s, i) => (
              <div key={i} className="chart-box" style={{ flex: 1, padding: "14px 18px" }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>{s.label}</div>
                <div style={{ fontSize: 22, fontWeight: 900, color: s.color, fontFamily: "'Fraunces',serif" }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Search */}
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input value={unsubSearch} onChange={e => setUnsubSearch(e.target.value)}
              placeholder="Search by email or reason..."
              style={{ flex: 1, padding: "10px 14px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.surfaceAlt, color: T.white, fontSize: 12, fontFamily: "'Outfit',sans-serif", outline: "none" }} />
            <button type="button" onClick={async () => {
                setUnsubLoading(true);
                try {
                  const snap = await getDocs(query(collection(db, "digestUnsubscribes"), orderBy("unsubscribedAt", "desc")));
                  setUnsubscribes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
                  notify("Refreshed");
                } catch { notify("Error refreshing"); }
                setUnsubLoading(false);
              }}
              style={{ padding: "10px 16px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface, color: T.textSecondary, cursor: "pointer", fontSize: 12, fontFamily: "'Outfit',sans-serif", fontWeight: 600 }}>
              {unsubLoading ? "..." : "Refresh"}
            </button>
          </div>

          {/* Table */}
          <div className="chart-box" style={{ padding: 0, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "'Outfit',sans-serif" }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                  {["Email", "Reason", "Date", "Action"].map(h => (
                    <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: 1 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(unsubscribes.length ? unsubscribes : [
                  { email: "user@example.com", reason: "Too many emails", unsubscribedAt: new Date(Date.now() - 2*24*60*60*1000).toISOString() },
                  { email: "another@gmail.com", reason: "Not relevant", unsubscribedAt: new Date(Date.now() - 5*24*60*60*1000).toISOString() },
                  { email: "test@yahoo.com", reason: "Other", unsubscribedAt: new Date(Date.now() - 8*24*60*60*1000).toISOString() },
                ]).filter(u => !unsubSearch || u.email?.toLowerCase().includes(unsubSearch.toLowerCase()) || u.reason?.toLowerCase().includes(unsubSearch.toLowerCase()))
                  .map((u, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${T.border}`, transition: "background 0.15s" }}
                    onMouseEnter={e => e.currentTarget.style.background = T.surfaceAlt}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <td style={{ padding: "12px 16px", fontSize: 12, color: T.white }}>{u.email}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ fontSize: 11, padding: "3px 8px", borderRadius: 4, background: "rgba(239,68,68,0.1)", color: "#EF4444", fontWeight: 600 }}>{u.reason || "No reason given"}</span>
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 11, color: T.textMuted }}>
                      {u.unsubscribedAt ? new Date(u.unsubscribedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <button type="button" onClick={async () => {
                          try {
                            if (u.id) await setDoc(doc(db, "digestUnsubscribes", u.id), { ...u, resubscribedAt: new Date().toISOString(), active: false }, { merge: true });
                            setUnsubscribes(prev => prev.filter((_, idx) => idx !== i));
                            notify(`${u.email} resubscribed`);
                          } catch { notify("Error resubscribing"); }
                        }}
                        style={{ fontSize: 11, padding: "5px 10px", borderRadius: 6, border: `1px solid ${T.green}`, background: "rgba(16,185,129,0.1)", color: T.green, cursor: "pointer", fontWeight: 600, fontFamily: "'Outfit',sans-serif" }}>
                        Resubscribe
                      </button>
                    </td>
                  </tr>
                ))}
                {unsubscribes.length === 0 && (
                  <tr><td colSpan={4} style={{ padding: 32, textAlign: "center", fontSize: 12, color: T.textMuted }}>No unsubscribes yet 🎉</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Reason breakdown */}
          {unsubscribes.length > 0 && (
            <div className="chart-box" style={{ padding: 20 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 14 }}>Unsubscribe Reasons</div>
              {(() => {
                const reasons = {};
                unsubscribes.forEach(u => { const r = u.reason || "No reason"; reasons[r] = (reasons[r] || 0) + 1; });
                const total = unsubscribes.length;
                return Object.entries(reasons).sort((a,b) => b[1]-a[1]).map(([reason, count]) => (
                  <div key={reason} style={{ marginBottom: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 12, color: T.textSecondary }}>{reason}</span>
                      <span style={{ fontSize: 12, color: T.white, fontWeight: 700 }}>{count} ({Math.round(count/total*100)}%)</span>
                    </div>
                    <div style={{ height: 6, background: T.surfaceAlt, borderRadius: 3 }}>
                      <div style={{ width: `${Math.round(count/total*100)}%`, height: "100%", background: "#EF4444", borderRadius: 3 }} />
                    </div>
                  </div>
                ));
              })()}
            </div>
          )}
        </div>
      )}
    </div>
  );
}


export default DigestTab;
