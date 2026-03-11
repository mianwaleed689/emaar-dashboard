import React, { useState, useEffect, useRef, useCallback } from "react";
import { collection, getDocs, doc, getDoc, setDoc, deleteDoc, onSnapshot, query, orderBy, limit, where, addDoc, updateDoc } from "firebase/firestore";
import { auth, db, storage } from "../../../firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { sendPasswordResetEmail } from "firebase/auth";
import { BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from "recharts";
import { emaarProjects as defaultProjects, emaarCommunities as defaultCommunities, emaarYields as defaultYields, communityROI as defaultCommunityROI, communityIntel as defaultCommunityIntel } from "../../../data";

function AdminLeadsTab({ leads, users, T, I, notify, db, timeSince, logAudit, exportCSV, fetchLeads, leadFilter, setLeadFilter, leadSearch, setLeadSearch, leadDrawer, setLeadDrawer, showAddLead, setShowAddLead, addLeadForm, setAddLeadForm, addLeadLoading, setAddLeadLoading, leadsViewMode, setLeadsViewMode, setTab, setPendingOpenUid }) {
/* ΓöÇΓöÇΓöÇ LEADS CRM ΓöÇΓöÇΓöÇ */
const now = new Date();
const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

// Stats
const stats = {
total: leads.length,
new: leads.filter(l => (l.status || "New") === "New").length,
contacted: leads.filter(l => l.status === "Contacted").length,
qualified: leads.filter(l => l.status === "Qualified").length,
converted: leads.filter(l => l.status === "Converted").length,
lost: leads.filter(l => l.status === "Lost").length,
today: leads.filter(l => new Date(l.createdAt) >= todayStart).length,
thisWeek: leads.filter(l => new Date(l.createdAt) >= weekAgo).length,
};
const conversionRate = stats.total > 0 ? Math.round((stats.converted / stats.total) * 100) : 0;
const avgResponseHrs = (() => {
const responded = leads.filter(l => l.respondedAt && l.createdAt);
if (responded.length === 0) return null;
const total = responded.reduce((sum, l) => sum + (new Date(l.respondedAt) - new Date(l.createdAt)), 0);
return Math.round(total / responded.length / 1000 / 60 / 60);
})();

// Filters
const filtered = leads.filter(l => {
if (leadFilter !== "all" && (l.status || "New").toLowerCase() !== leadFilter) return false;
if (leadSourceFilter !== "all" && l.source !== leadSourceFilter) return false;
if (leadDateRange === "today" && new Date(l.createdAt) < todayStart) return false;
if (leadDateRange === "week" && new Date(l.createdAt) < weekAgo) return false;
if (leadDateRange === "month" && new Date(l.createdAt) < monthAgo) return false;
if (leadSearch) {
  const s = leadSearch.toLowerCase();
  if (!((l.name || "").toLowerCase().includes(s) || (l.email || "").toLowerCase().includes(s) || (l.phone || "").includes(s) || (l.project || "").toLowerCase().includes(s))) return false;
}
return true;
}).sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

const sources = [...new Set(leads.map(l => l.source).filter(Boolean))];

// Add lead function
const addLead = async () => {
if (!addLeadForm.name && !addLeadForm.email) { notify("Name or email required"); return; }
setAddLeadLoading(true);
try {
  const id = `lead_${Date.now()}`;
  await setDoc(doc(db, "leads", id), {
    ...addLeadForm,
    status: "New",
    createdAt: new Date().toISOString(),
    notes: addLeadForm.notes ? [{ text: addLeadForm.notes, by: adminUser?.email || "admin", at: new Date().toISOString() }] : [],
  });
  await logAudit(db, { action: "lead_created", leadId: id });
  notify("Lead added!");
  setShowAddLead(false);
  setAddLeadForm({ name: "", email: "", phone: "", source: "Manual", project: "", notes: "" });
  fetchLeads();
} catch (e) { notify("Error: " + e.message); }
setAddLeadLoading(false);
};

// Update lead status
const updateLeadStatus = async (leadId, newStatus, reason) => {
try {
  const update = { status: newStatus, updatedAt: new Date().toISOString() };
  if (newStatus === "Contacted" && !leads.find(l => l.id === leadId)?.respondedAt) {
    update.respondedAt = new Date().toISOString();
  }
  if (newStatus === "Lost" && reason) {
    update.lossReason = reason;
  }
  await setDoc(doc(db, "leads", leadId), update, { merge: true });
  await logAudit(db, { action: "lead_status_change", leadId, to: newStatus });
  notify(`Status ΓåÆ ${newStatus}`);
  fetchLeads();
  if (leadDrawer?.id === leadId) setLeadDrawer(prev => ({ ...prev, status: newStatus, ...update }));
} catch (e) { notify("Error: " + e.message); }
};

// Add note to lead
const addNote = async () => {
if (!leadNote.trim() || !leadDrawer) return;
setLeadNoteSaving(true);
try {
  const notes = leadDrawer.notes || [];
  notes.push({ text: leadNote, by: adminUser?.email || "admin", at: new Date().toISOString() });
  await setDoc(doc(db, "leads", leadDrawer.id), { notes, updatedAt: new Date().toISOString() }, { merge: true });
  setLeadDrawer(prev => ({ ...prev, notes }));
  setLeadNote("");
  notify("Note added");
} catch (e) { notify("Error: " + e.message); }
setLeadNoteSaving(false);
};

// Convert lead to user
const convertToUser = async () => {
if (!leadDrawer) return;
setConvertingLead(true);
try {
  // Create user in Firestore
  const userId = `user_${Date.now()}`;
  await setDoc(doc(db, "users", userId), {
    name: leadDrawer.name || "",
    email: leadDrawer.email || "",
    phone: leadDrawer.phone || "",
    tier: "free",
    role: "user",
    createdAt: new Date().toISOString(),
    source: "lead_conversion",
    leadId: leadDrawer.id,
  });
  // Update lead as converted
  await setDoc(doc(db, "leads", leadDrawer.id), { 
    status: "Converted", 
    userId, 
    convertedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }, { merge: true });
  await logAudit(db, { action: "lead_converted", leadId: leadDrawer.id, userId });
  notify("Lead converted to user!");
  fetchLeads();
  fetchUsers();
  setLeadDrawer(null);
} catch (e) { notify("Error: " + e.message); }
setConvertingLead(false);
};

// Send email to lead
const sendLeadEmail = async (lead, subject, body) => {
try {
  await emailjs.send("service_da7nshv", "template_gl1xqhy", {
    to_email: lead.email,
    to_name: lead.name || "there",
    subject: subject || `Following up on ${lead.project || "your inquiry"}`,
    message: body || `Hi ${lead.name || "there"},\n\nThank you for your interest in ${lead.project || "our properties"}. I'd be happy to provide more information.\n\nBest regards,\nDXB Analytics`,
    project_name: lead.project || "DXB Analytics",
  }, "USkwUhp0csGCVDkdQ");
  await setDoc(doc(db, "leads", lead.id), { respondedAt: new Date().toISOString(), updatedAt: new Date().toISOString() }, { merge: true });
  await logAudit(db, { action: "lead_email_sent", leadId: lead.id });
  notify("Email sent!");
  fetchLeads();
} catch (e) { notify("Email failed: " + e.message); }
};

// Export CSV
const exportLeadsCSV = () => {
const headers = ["Name", "Email", "Phone", "Project", "Community", "Source", "Status", "Created", "Notes"];
const rows = filtered.map(l => [
  l.name || "", l.email || "", l.phone || "", l.project || "", l.community || "",
  l.source || "", l.status || "New", l.createdAt || "",
  (l.notes || []).map(n => n.text).join(" | ")
]);
const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
const blob = new Blob([csv], { type: "text/csv" });
const url = URL.createObjectURL(blob);
const a = document.createElement("a"); a.href = url; a.download = `leads_${new Date().toISOString().slice(0,10)}.csv`; a.click();
notify(`Exported ${filtered.length} leads`);
};

const statusColors = {
New: { bg: "rgba(59,130,246,0.12)", color: "#3B82F6", border: "rgba(59,130,246,0.3)" },
Contacted: { bg: "rgba(212,168,67,0.12)", color: T.gold, border: "rgba(212,168,67,0.3)" },
Qualified: { bg: "rgba(139,92,246,0.12)", color: "#8B5CF6", border: "rgba(139,92,246,0.3)" },
Converted: { bg: "rgba(16,185,129,0.12)", color: T.green, border: "rgba(16,185,129,0.3)" },
Lost: { bg: "rgba(239,68,68,0.12)", color: T.red, border: "rgba(239,68,68,0.3)" },
};

return (
<>
  {/* ΓòÉΓòÉΓòÉ KPI TOPBAR ΓòÉΓòÉΓòÉ */}
  <div className="fade-up" style={{ display: "flex", alignItems: "center", gap: 0, borderRadius: 14, background: T.surface, border: `1px solid ${T.border}`, marginBottom: 20, overflow: "hidden" }}>
    <button type="button" onClick={() => { fetchLeads(); notify("Leads refreshed"); }} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, padding: "14px 16px", background: T.goldGlow, border: "none", borderRight: `1px solid ${T.border}`, color: T.gold, cursor: "pointer", fontFamily: "'Outfit',sans-serif", fontWeight: 600, flexShrink: 0 }}>{I.refresh}</button>
    {[
      { label: "Total", value: stats.total, color: T.gold },
      { label: "New", value: stats.new, color: "#3B82F6" },
      { label: "This Week", value: stats.thisWeek, color: T.teal },
      { label: "Conversion", value: `${conversionRate}%`, color: T.green },
      { label: "Avg Response", value: avgResponseHrs !== null ? `${avgResponseHrs}h` : "ΓÇö", color: T.purple },
    ].map((item, i) => (
      <div key={i} style={{ display: "flex", flexDirection: "column", padding: "10px 20px", borderRight: `1px solid ${T.border}`, flexShrink: 0 }}>
        <span style={{ fontSize: 9, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: 1 }}>{item.label}</span>
        <span style={{ fontSize: 18, fontWeight: 900, color: item.color, fontFamily: "'Fraunces',serif", lineHeight: 1.2 }}>{item.value}</span>
      </div>
    ))}
    <div style={{ marginLeft: "auto", padding: "10px 16px", display: "flex", gap: 8 }}>
      <div style={{ display: "flex", background: T.surfaceAlt, borderRadius: 8, border: `1px solid ${T.border}`, overflow: "hidden" }}>
        <button type="button" onClick={() => setLeadsViewMode("table")} style={{ padding: "6px 12px", fontSize: 10, fontWeight: 600, background: leadsViewMode === "table" ? T.gold + "20" : "transparent", color: leadsViewMode === "table" ? T.gold : T.textMuted, border: "none", cursor: "pointer" }}>Γÿ░ Table</button>
        <button type="button" onClick={() => setLeadsViewMode("kanban")} style={{ padding: "6px 12px", fontSize: 10, fontWeight: 600, background: leadsViewMode === "kanban" ? T.gold + "20" : "transparent", color: leadsViewMode === "kanban" ? T.gold : T.textMuted, border: "none", cursor: "pointer" }}>Γè₧ Kanban</button>
      </div>
      <button type="button" onClick={() => setShowAddLead(true)} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, padding: "8px 14px", borderRadius: 8, border: `1px solid ${T.green}`, background: "rgba(16,185,129,0.08)", color: T.green, cursor: "pointer", fontFamily: "'Outfit',sans-serif", fontWeight: 600 }}>+ Add Lead</button>
      <button type="button" onClick={exportLeadsCSV} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, padding: "8px 14px", borderRadius: 8, border: `1px solid ${T.border}`, background: "transparent", color: T.textSecondary, cursor: "pointer", fontFamily: "'Outfit',sans-serif", fontWeight: 600 }}>{I.download} Export</button>
    </div>
  </div>

  {/* ΓòÉΓòÉΓòÉ PIPELINE CARDS ΓòÉΓòÉΓòÉ */}
  <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginBottom: 20 }}>
    {[
      { id: "new", label: "New", count: stats.new, color: "#3B82F6", icon: "+" },
      { id: "contacted", label: "Contacted", count: stats.contacted, color: T.gold, icon: "!" },
      { id: "qualified", label: "Qualified", count: stats.qualified, color: "#8B5CF6", icon: "?" },
      { id: "converted", label: "Converted", count: stats.converted, color: T.green, icon: "V" },
      { id: "lost", label: "Lost", count: stats.lost, color: T.red, icon: "X" },
    ].map(s => (
      <div key={s.id} onClick={() => setLeadFilter(leadFilter === s.id ? "all" : s.id)}
        className="fade-up" style={{ 
          padding: "16px 18px", borderRadius: 12, cursor: "pointer",
          background: leadFilter === s.id ? `${s.color}15` : T.surface,
          border: `1px solid ${leadFilter === s.id ? s.color : T.border}`,
          transition: "all 0.15s"
        }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: s.color, textTransform: "uppercase", letterSpacing: 1 }}>{s.label}</span>
          <span style={{ width: 24, height: 24, borderRadius: 6, background: `${s.color}20`, color: s.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700 }}>{s.icon}</span>
        </div>
        <div style={{ fontFamily: "'Fraunces',serif", fontSize: 28, fontWeight: 900, color: s.color }}>{s.count}</div>
        <div style={{ fontSize: 10, color: T.textMuted, marginTop: 4 }}>{leadFilter === s.id ? "Click to clear" : "Click to filter"}</div>
      </div>
    ))}
  </div>

  {/* ΓòÉΓòÉΓòÉ FILTERS ΓòÉΓòÉΓòÉ */}
  <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
    <input type="text" placeholder="Search name, email, phone, project..." value={leadSearch} onChange={e => setLeadSearch(e.target.value)}
      style={{ flex: 1, minWidth: 200, padding: "10px 14px", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, color: T.white, fontSize: 12, fontFamily: "'Outfit',sans-serif", outline: "none" }} />
    <select value={leadSourceFilter} onChange={e => setLeadSourceFilter(e.target.value)}
      style={{ padding: "10px 14px", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, color: T.textSecondary, fontSize: 12, fontFamily: "'Outfit',sans-serif", cursor: "pointer" }}>
      <option value="all">All Sources</option>
      {sources.map(s => <option key={s} value={s}>{s}</option>)}
      <option value="Manual">Manual</option>
    </select>
    <select value={leadDateRange} onChange={e => setLeadDateRange(e.target.value)}
      style={{ padding: "10px 14px", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, color: T.textSecondary, fontSize: 12, fontFamily: "'Outfit',sans-serif", cursor: "pointer" }}>
      <option value="all">All Time</option>
      <option value="today">Today</option>
      <option value="week">This Week</option>
      <option value="month">This Month</option>
    </select>
    {(leadFilter !== "all" || leadSourceFilter !== "all" || leadDateRange !== "all" || leadSearch) && (
      <button type="button" onClick={() => { setLeadFilter("all"); setLeadSourceFilter("all"); setLeadDateRange("all"); setLeadSearch(""); }}
        style={{ padding: "10px 14px", borderRadius: 8, border: `1px solid ${T.red}40`, background: "rgba(239,68,68,0.06)", color: T.red, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>Clear Filters</button>
    )}
    <span style={{ fontSize: 11, color: T.textMuted }}>{filtered.length} of {leads.length} leads</span>
  </div>

  {/* ΓòÉΓòÉΓòÉ KANBAN VIEW ΓòÉΓòÉΓòÉ */}
  {leadsViewMode === "kanban" && (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginBottom: 20 }}>
      {[
        { id: "New", label: "New", color: "#3B82F6" },
        { id: "Contacted", label: "Contacted", color: T.gold },
        { id: "Qualified", label: "Qualified", color: "#8B5CF6" },
        { id: "Converted", label: "Converted", color: T.green },
        { id: "Lost", label: "Lost", color: T.red },
      ].map(stage => {
        const stageLeads = leads.filter(l => (l.status || "New") === stage.id).sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        return (
          <div key={stage.id} style={{ background: T.surface, borderRadius: 12, border: `1px solid ${T.border}`, overflow: "hidden" }}>
<div style={{ padding: "12px 14px", borderBottom: `2px solid ${stage.color}`, background: `${stage.color}08` }}>
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
    <span style={{ fontSize: 12, fontWeight: 700, color: stage.color }}>{stage.label}</span>
    <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 10, background: `${stage.color}20`, color: stage.color }}>{stageLeads.length}</span>
  </div>
</div>
<div style={{ padding: "8px", maxHeight: 400, overflowY: "auto" }}>
  {stageLeads.length === 0 ? (
    <div style={{ padding: "20px 10px", textAlign: "center", color: T.textMuted, fontSize: 11 }}>No leads</div>
  ) : (
    stageLeads.map(lead => (
      <div key={lead.id} onClick={() => setLeadDrawer(lead)} style={{ padding: "10px 12px", background: T.surfaceAlt, borderRadius: 8, marginBottom: 6, cursor: "pointer", border: `1px solid ${T.border}`, transition: "all 0.15s" }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = stage.color + "50"; e.currentTarget.style.transform = "translateY(-1px)"; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.transform = "none"; }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: T.white, marginBottom: 4 }}>{lead.name || "Unknown"}</div>
        <div style={{ fontSize: 10, color: T.textMuted, marginBottom: 4 }}>{lead.project || "No project"}</div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 9, color: T.textMuted }}>{lead.createdAt ? timeSince(new Date(lead.createdAt)) : "ΓÇö"}</span>
          {lead.notes?.length > 0 && <span style={{ fontSize: 9, padding: "1px 5px", borderRadius: 4, background: `${T.teal}20`, color: T.teal }}>{lead.notes.length} notes</span>}
        </div>
      </div>
    ))
  )}
</div>
          </div>
        );
      })}
    </div>
  )}

  {/* ΓòÉΓòÉΓòÉ LEADS TABLE ΓòÉΓòÉΓòÉ */}
  {leadsViewMode === "table" && (
  <div style={{ background: T.surface, borderRadius: 14, border: `1px solid ${T.border}`, overflow: "hidden" }}>
    {filtered.length === 0 ? (
      <div style={{ textAlign: "center", padding: 60, color: T.textMuted }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: T.textSecondary, marginBottom: 8 }}>{leads.length === 0 ? "No leads yet" : "No leads match filters"}</div>
        <div style={{ fontSize: 12, color: T.textMuted }}>{leads.length === 0 ? "Leads are captured when users click WhatsApp or Email on projects, or add manually." : "Try adjusting your filters."}</div>
      </div>
    ) : (
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
<tr style={{ borderBottom: `2px solid ${T.border}` }}>
  {["Name", "Contact", "Project", "Source", "Status", "Created", "Actions"].map(h => (
    <th key={h} style={{ padding: "12px 14px", textAlign: "left", color: T.gold, fontWeight: 600, fontSize: 10, letterSpacing: 0.5, textTransform: "uppercase", background: T.surfaceAlt }}>{h}</th>
  ))}
</tr>
          </thead>
          <tbody>
{filtered.map((lead, i) => {
  const sc = statusColors[lead.status || "New"] || statusColors.New;
  return (
    <tr key={lead.id} style={{ borderBottom: `1px solid ${T.border}`, cursor: "pointer" }}
      onMouseEnter={e => e.currentTarget.style.background = T.surfaceAlt}
      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
      onClick={() => setLeadDrawer(lead)}>
      <td style={{ padding: "12px 14px" }}>
        <div style={{ fontWeight: 600, color: T.white }}>{lead.name || "ΓÇö"}</div>
        {lead.notes?.length > 0 && <span style={{ fontSize: 9, color: T.textMuted }}>{lead.notes.length} note{lead.notes.length > 1 ? "s" : ""}</span>}
      </td>
      <td style={{ padding: "12px 14px" }}>
        <div style={{ fontSize: 11, color: T.textSecondary }}>{lead.email || "ΓÇö"}</div>
        {lead.phone && <div style={{ fontSize: 10, color: T.textMuted }}>{lead.phone}</div>}
      </td>
      <td style={{ padding: "12px 14px" }}>
        <div style={{ color: T.gold, fontWeight: 600 }}>{lead.project || "ΓÇö"}</div>
        {lead.community && <div style={{ fontSize: 10, color: T.textMuted }}>{lead.community}</div>}
      </td>
      <td style={{ padding: "12px 14px" }}>
        <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 6, background: lead.source === "WhatsApp" ? "rgba(37,211,102,0.15)" : lead.source === "Email Inquiry" ? "rgba(59,130,246,0.12)" : "rgba(148,163,184,0.1)", color: lead.source === "WhatsApp" ? T.green : lead.source === "Email Inquiry" ? T.blue : T.textSecondary }}>{lead.source || "ΓÇö"}</span>
      </td>
      <td style={{ padding: "12px 14px" }} onClick={e => e.stopPropagation()}>
        <select value={lead.status || "New"} onChange={e => {
          if (e.target.value === "Lost") setShowLossReason(lead.id);
          else updateLeadStatus(lead.id, e.target.value);
        }} style={{ padding: "4px 8px", borderRadius: 6, border: `1px solid ${sc.border}`, background: sc.bg, color: sc.color, fontSize: 10, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>
          <option value="New">New</option>
          <option value="Contacted">Contacted</option>
          <option value="Qualified">Qualified</option>
          <option value="Converted">Converted</option>
          <option value="Lost">Lost</option>
        </select>
      </td>
      <td style={{ padding: "12px 14px", fontSize: 11, color: T.textMuted }}>
        {lead.createdAt ? new Date(lead.createdAt).toLocaleDateString("en-AE", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "ΓÇö"}
      </td>
      <td style={{ padding: "12px 14px" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", gap: 6 }}>
          {lead.phone && (
            <a href={`https://wa.me/${lead.phone.replace(/\D/g, "")}?text=${encodeURIComponent(`Hi ${lead.name || ""}, following up on your interest in ${lead.project || "the property"}.`)}`} target="_blank" rel="noreferrer"
              style={{ fontSize: 10, padding: "4px 8px", borderRadius: 6, background: "rgba(37,211,102,0.15)", color: T.green, textDecoration: "none", fontWeight: 600 }}>WA</a>
          )}
          {lead.email && (
            <button type="button" onClick={() => sendLeadEmail(lead)} style={{ fontSize: 10, padding: "4px 8px", borderRadius: 6, border: "none", background: "rgba(59,130,246,0.12)", color: T.blue, cursor: "pointer", fontWeight: 600 }}>Email</button>
          )}
          <button type="button" onClick={() => setLeadDrawer(lead)} style={{ fontSize: 10, padding: "4px 8px", borderRadius: 6, border: `1px solid ${T.gold}`, background: "rgba(212,168,67,0.08)", color: T.gold, cursor: "pointer", fontWeight: 600 }}>Edit</button>
        </div>
      </td>
    </tr>
  );
})}
          </tbody>
        </table>
      </div>
    )}
  </div>
  )}

  {/* ΓòÉΓòÉΓòÉ ADD LEAD MODAL ΓòÉΓòÉΓòÉ */}
  {showAddLead && (
    <div style={{ position: "fixed", inset: 0, background: "rgba(4,9,15,0.92)", zIndex: 9000, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(8px)" }} onClick={() => setShowAddLead(false)}>
      <div style={{ background: T.surface, border: `1px solid ${T.green}40`, borderRadius: 16, width: "95%", maxWidth: 500, padding: 24 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ fontFamily: "'Fraunces',serif", fontSize: 18, fontWeight: 700, color: T.green }}>+ Add New Lead</h3>
          <button type="button" onClick={() => setShowAddLead(false)} style={{ background: "none", border: "none", color: T.textMuted, cursor: "pointer", fontSize: 20 }}>x</button>
        </div>
        <div style={{ display: "grid", gap: 12 }}>
          {[
{ key: "name", label: "Name", placeholder: "John Smith" },
{ key: "email", label: "Email", placeholder: "john@example.com", type: "email" },
{ key: "phone", label: "Phone", placeholder: "+971 50 123 4567" },
{ key: "project", label: "Interested Project", placeholder: "e.g. The Valley" },
          ].map(f => (
<div key={f.key}>
  <label style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4, display: "block" }}>{f.label}</label>
  <input type={f.type || "text"} placeholder={f.placeholder} value={addLeadForm[f.key]} onChange={e => setAddLeadForm(prev => ({ ...prev, [f.key]: e.target.value }))}
    style={{ width: "100%", padding: "10px 12px", background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, color: T.white, fontSize: 13, fontFamily: "'Outfit',sans-serif", boxSizing: "border-box" }} />
</div>
          ))}
          <div>
<label style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4, display: "block" }}>Source</label>
<select value={addLeadForm.source} onChange={e => setAddLeadForm(prev => ({ ...prev, source: e.target.value }))}
  style={{ width: "100%", padding: "10px 12px", background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, color: T.white, fontSize: 13, fontFamily: "'Outfit',sans-serif" }}>
  <option>Manual</option>
  <option>WhatsApp</option>
  <option>Email Inquiry</option>
  <option>Phone Call</option>
  <option>Walk-in</option>
  <option>Referral</option>
  <option>Website</option>
</select>
          </div>
          <div>
<label style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4, display: "block" }}>Notes</label>
<textarea placeholder="Initial notes..." value={addLeadForm.notes} onChange={e => setAddLeadForm(prev => ({ ...prev, notes: e.target.value }))} rows={3}
  style={{ width: "100%", padding: "10px 12px", background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, color: T.white, fontSize: 13, fontFamily: "'Outfit',sans-serif", resize: "vertical", boxSizing: "border-box" }} />
          </div>
        </div>
        <button type="button" disabled={addLeadLoading} onClick={addLead}
          style={{ marginTop: 16, width: "100%", padding: "12px", borderRadius: 10, border: "none", background: `linear-gradient(135deg, ${T.green}, #059669)`, color: "#FFFFFF", fontSize: 14, fontWeight: 700, cursor: addLeadLoading ? "wait" : "pointer", fontFamily: "'Outfit',sans-serif", opacity: addLeadLoading ? 0.6 : 1 }}>
          {addLeadLoading ? "Adding..." : "+ Add Lead"}
        </button>
      </div>
    </div>
  )}

  {/* ΓòÉΓòÉΓòÉ LOSS REASON MODAL ΓòÉΓòÉΓòÉ */}
  {showLossReason && (
    <div style={{ position: "fixed", inset: 0, background: "rgba(4,9,15,0.92)", zIndex: 9000, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(8px)" }} onClick={() => setShowLossReason(null)}>
      <div style={{ background: T.surface, border: `1px solid ${T.red}40`, borderRadius: 16, width: "95%", maxWidth: 400, padding: 24 }} onClick={e => e.stopPropagation()}>
        <h3 style={{ fontFamily: "'Fraunces',serif", fontSize: 18, fontWeight: 700, color: T.red, marginBottom: 16 }}>Mark as Lost</h3>
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6, display: "block" }}>Reason</label>
          <select value={lossReason} onChange={e => setLossReason(e.target.value)}
style={{ width: "100%", padding: "10px 12px", background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, color: T.white, fontSize: 13, fontFamily: "'Outfit',sans-serif" }}>
<option value="">Select reason...</option>
<option value="price">Too Expensive</option>
<option value="competitor">Chose Competitor</option>
<option value="timing">Not Ready Now</option>
<option value="no_response">No Response</option>
<option value="wrong_fit">Wrong Fit</option>
<option value="other">Other</option>
          </select>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button type="button" onClick={() => setShowLossReason(null)} style={{ flex: 1, padding: "10px", borderRadius: 8, border: `1px solid ${T.border}`, background: "transparent", color: T.textSecondary, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>Cancel</button>
          <button type="button" onClick={() => { updateLeadStatus(showLossReason, "Lost", lossReason); setShowLossReason(null); setLossReason(""); }}
style={{ flex: 1, padding: "10px", borderRadius: 8, border: "none", background: T.red, color: "#FFFFFF", cursor: "pointer", fontWeight: 600, fontFamily: "'Outfit',sans-serif" }}>Mark Lost</button>
        </div>
      </div>
    </div>
  )}

  {/* ΓòÉΓòÉΓòÉ LEAD DRAWER ΓòÉΓòÉΓòÉ */}
  {leadDrawer && (
    <div style={{ position: "fixed", inset: 0, zIndex: 8000, background: "rgba(4,9,15,0.85)", backdropFilter: "blur(4px)" }} onClick={() => setLeadDrawer(null)}>
      <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: "100%", maxWidth: 480, background: T.surface, borderLeft: `1px solid ${T.gold}30`, display: "flex", flexDirection: "column", animation: "slideIn 0.2s ease-out" }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ padding: "20px 24px", borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
<div style={{ fontSize: 10, color: T.gold, fontWeight: 700, textTransform: "uppercase", marginBottom: 6 }}>Edit Lead</div>
<div style={{ fontFamily: "'Fraunces',serif", fontSize: 20, fontWeight: 700, color: T.white }}>{leadDrawer.name || "Unknown Lead"}</div>
<div style={{ fontSize: 12, color: T.textMuted, marginTop: 4 }}>{leadDrawer.email || "No email"}</div>
{leadDrawer.phone && <div style={{ fontSize: 12, color: T.textMuted }}>{leadDrawer.phone}</div>}
          </div>
          <button type="button" onClick={() => setLeadDrawer(null)} style={{ background: "none", border: "none", color: T.textMuted, cursor: "pointer", fontSize: 24, lineHeight: 1 }}>├ù</button>
        </div>

        {/* Status + Actions */}
        <div style={{ padding: "16px 24px", borderBottom: `1px solid ${T.border}`, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <select value={leadDrawer.status || "New"} onChange={e => {
if (e.target.value === "Lost") setShowLossReason(leadDrawer.id);
else updateLeadStatus(leadDrawer.id, e.target.value);
          }} style={{ padding: "8px 14px", borderRadius: 8, border: `1px solid ${(statusColors[leadDrawer.status || "New"] || statusColors.New).border}`, background: (statusColors[leadDrawer.status || "New"] || statusColors.New).bg, color: (statusColors[leadDrawer.status || "New"] || statusColors.New).color, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>
<option value="New">New</option>
<option value="Contacted">Contacted</option>
<option value="Qualified">Qualified</option>
<option value="Converted">Converted</option>
<option value="Lost">Lost</option>
          </select>
          {leadDrawer.phone && (
<a href={`https://wa.me/${leadDrawer.phone.replace(/\D/g, "")}?text=${encodeURIComponent(`Hi ${leadDrawer.name || ""}, following up on your interest in ${leadDrawer.project || "the property"}.`)}`} target="_blank" rel="noreferrer"
  style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, padding: "8px 14px", borderRadius: 8, background: "rgba(37,211,102,0.15)", color: T.green, textDecoration: "none", fontWeight: 600 }}>WhatsApp</a>
          )}
          {leadDrawer.email && (
<button type="button" onClick={() => sendLeadEmail(leadDrawer)} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, padding: "8px 14px", borderRadius: 8, border: "none", background: "rgba(59,130,246,0.12)", color: T.blue, cursor: "pointer", fontWeight: 600 }}>Send Email</button>
          )}
          {leadDrawer.status !== "Converted" && (
<button type="button" disabled={convertingLead} onClick={convertToUser}
  style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, padding: "8px 14px", borderRadius: 8, border: `1px solid ${T.green}`, background: "rgba(16,185,129,0.08)", color: T.green, cursor: convertingLead ? "wait" : "pointer", fontWeight: 600, marginLeft: "auto" }}>
  {convertingLead ? "Converting..." : "Convert to User"}
</button>
          )}
        </div>

        {/* Editable Fields */}
        <div style={{ padding: "16px 24px", borderBottom: `1px solid ${T.border}` }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: T.gold, letterSpacing: 1, textTransform: "uppercase", marginBottom: 12 }}>Edit Details</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
{[
  { key: "name", label: "Name" },
  { key: "email", label: "Email" },
  { key: "phone", label: "Phone" },
  { key: "project", label: "Project" },
  { key: "community", label: "Community" },
  { key: "source", label: "Source" },
].map(field => (
  <div key={field.key}>
    <label style={{ fontSize: 10, color: T.textMuted, display: "block", marginBottom: 4 }}>{field.label}</label>
    <input 
      value={leadDrawer[field.key] || ""} 
      onChange={e => setLeadDrawer(prev => ({ ...prev, [field.key]: e.target.value }))}
      onBlur={async e => {
        try {
          await setDoc(doc(db, "leads", leadDrawer.id), { [field.key]: e.target.value, updatedAt: new Date().toISOString() }, { merge: true });
          notify(`${field.label} updated`);
          fetchLeads();
        } catch (err) { notify("Error saving"); }
      }}
      style={{ width: "100%", padding: "8px 10px", background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 6, color: T.white, fontSize: 12, fontFamily: "'Outfit',sans-serif", boxSizing: "border-box" }}
    />
  </div>
))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
<div>
  <div style={{ fontSize: 10, color: T.textMuted, marginBottom: 2 }}>Created</div>
  <div style={{ fontSize: 12, color: T.textSecondary }}>{leadDrawer.createdAt ? new Date(leadDrawer.createdAt).toLocaleDateString("en-AE", { day: "2-digit", month: "short", year: "numeric" }) : "ΓÇö"}</div>
</div>
<div>
  <div style={{ fontSize: 10, color: T.textMuted, marginBottom: 2 }}>Updated</div>
  <div style={{ fontSize: 12, color: T.textSecondary }}>{leadDrawer.updatedAt ? new Date(leadDrawer.updatedAt).toLocaleDateString("en-AE", { day: "2-digit", month: "short" }) : "ΓÇö"}</div>
</div>
          </div>
          {leadDrawer.lossReason && (
<div style={{ marginTop: 12, padding: "10px 14px", borderRadius: 8, background: "rgba(239,68,68,0.08)", border: `1px solid ${T.red}30` }}>
  <div style={{ fontSize: 10, color: T.red, fontWeight: 600 }}>Loss Reason: {leadDrawer.lossReason}</div>
</div>
          )}
          {leadDrawer.userId && (
<div style={{ marginTop: 12, padding: "10px 14px", borderRadius: 8, background: "rgba(16,185,129,0.08)", border: `1px solid ${T.green}30` }}>
  <div style={{ fontSize: 10, color: T.green, fontWeight: 600 }}>Converted to User: {leadDrawer.userId}</div>
  <button type="button" onClick={() => { setTab("users"); setPendingOpenUid(leadDrawer.userId); setLeadDrawer(null); }}
    style={{ marginTop: 6, fontSize: 10, padding: "4px 10px", borderRadius: 6, border: `1px solid ${T.green}`, background: "transparent", color: T.green, cursor: "pointer" }}>View User</button>
</div>
          )}
        </div>

        {/* Notes */}
        <div style={{ flex: 1, padding: "16px 24px", overflowY: "auto" }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: T.gold, letterSpacing: 1, textTransform: "uppercase", marginBottom: 12 }}>Notes ({(leadDrawer.notes || []).length})</div>
          {(leadDrawer.notes || []).length === 0 ? (
<div style={{ fontSize: 12, color: T.textMuted, textAlign: "center", padding: 20 }}>No notes yet</div>
          ) : (
<div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
  {(leadDrawer.notes || []).slice().reverse().map((note, i) => (
    <div key={i} style={{ padding: "10px 14px", background: T.surfaceAlt, borderRadius: 10, border: `1px solid ${T.border}` }}>
      <div style={{ fontSize: 12, color: T.textSecondary, lineHeight: 1.5 }}>{note.text}</div>
      <div style={{ fontSize: 10, color: T.textMuted, marginTop: 6 }}>{note.by} ┬╖ {note.at ? new Date(note.at).toLocaleDateString("en-AE", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : ""}</div>
    </div>
  ))}
</div>
          )}
        </div>

        {/* Add Note + Delete */}
        <div style={{ padding: "16px 24px", borderTop: `1px solid ${T.border}`, background: T.surfaceAlt }}>
          <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
<input type="text" placeholder="Add a note..." value={leadNote} onChange={e => setLeadNote(e.target.value)} onKeyDown={e => { if (e.key === "Enter") addNote(); }}
  style={{ flex: 1, padding: "10px 14px", background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, color: T.white, fontSize: 12, fontFamily: "'Outfit',sans-serif", outline: "none" }} />
<button type="button" disabled={leadNoteSaving || !leadNote.trim()} onClick={addNote}
  style={{ padding: "10px 16px", borderRadius: 8, border: "none", background: T.gold, color: T.bg, fontSize: 12, fontWeight: 600, cursor: leadNoteSaving ? "wait" : "pointer", fontFamily: "'Outfit',sans-serif", opacity: leadNoteSaving || !leadNote.trim() ? 0.5 : 1 }}>
  {leadNoteSaving ? "..." : "Add"}
</button>
          </div>
          <button type="button" onClick={async () => {
if (!window.confirm(`Delete lead "${leadDrawer.name || leadDrawer.email}"? This cannot be undone.`)) return;
try {
  await deleteDoc(doc(db, "leads", leadDrawer.id));
  notify("Lead deleted");
  setLeadDrawer(null);
  fetchLeads();
} catch (e) { notify("Error: " + e.message); }
          }} style={{ width: "100%", padding: "10px", borderRadius: 8, border: `1px solid ${T.red}30`, background: "rgba(239,68,68,0.08)", color: T.red, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>
Delete Lead
          </button>
        </div>
      </div>
    </div>
  )}
</>
);
          })()}

          {/* ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ
 NOTIFICATIONS TAB
 ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ */}
          {tab === "notifications" && <NotificationsTab T={T} notify={notify} adminUser={adminUser} I={I} users={users} db={db} />}

          {/* ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ
 VERIFICATION TAB (Binance-style KYC)
 ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ */}

}

export default AdminLeadsTab;
