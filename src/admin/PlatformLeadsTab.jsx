import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  collection, doc, setDoc, onSnapshot, serverTimestamp, addDoc, deleteDoc
} from "firebase/firestore";
import { db } from "../firebase";
import Papa from "papaparse";

const T = {
  bg: "#0B0F14",
  surface: "#131821",
  surfaceAlt: "#1A2028",
  border: "rgba(148,163,184,0.15)",
  borderStrong: "rgba(148,163,184,0.3)",
  gold: "#D4A843",
  white: "#FFFFFF",
  textMuted: "#94A3B8",
  textDim: "#64748B",
  green: "#10B981",
  amber: "#F59E0B",
  orange: "#F97316",
  red: "#EF4444",
  redDark: "#991B1B",
  blue: "#3B82F6",
  cyan: "#06B6D4",
  purple: "#A855F7",
};

const STAGES = [
  { key: "prospect",      label: "Prospect",       color: T.textMuted, sub: "Identified, not contacted", stallDays: 14 },
  { key: "contacted",     label: "Contacted",      color: T.blue,      sub: "Initial outreach sent",     stallDays: 7  },
  { key: "qualified",     label: "Qualified",      color: T.cyan,      sub: "Fit confirmed",             stallDays: 14 },
  { key: "demo_scheduled",label: "Demo Scheduled", color: T.amber,     sub: "Meeting booked",            stallDays: 3  },
  { key: "trial_started", label: "Trial Started",  color: T.purple,    sub: "In 14-day trial",           stallDays: 14 },
  { key: "negotiating",   label: "Negotiating",    color: T.orange,    sub: "Contract discussion",       stallDays: 21 },
  { key: "paid",          label: "Paid",           color: T.green,     sub: "Converted customer",        stallDays: 9999 },
  { key: "churned",       label: "Churned",        color: T.red,       sub: "Was paid, cancelled",       stallDays: 9999 },
  { key: "lost",          label: "Lost",           color: T.redDark,   sub: "Never converted",           stallDays: 9999 },
];

const COMPANY_TYPES = ["Agency", "Developer", "Brokerage", "Boutique", "Property Management"];
const COMPANY_SIZES = ["Solo", "Small (2-10)", "Medium (11-50)", "Large (51-200)", "Enterprise (200+)"];
const PLANS = ["Free", "Pro (AED 299)", "Enterprise (AED 799)", "Custom"];
const SOURCES = ["Inbound", "Outbound", "Referral", "LinkedIn", "Cold Email", "Cold Call", "Event", "Partner", "Website"];
const LANGUAGES = ["English", "Arabic", "French", "Russian", "Chinese", "Other"];
const FOLLOWUP_TYPES = ["call", "email", "meeting", "whatsapp", "demo"];

// Module-level SVG icon renderer for activity types
const typeIcons = {
  note:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
  call:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>,
  email:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
  meeting: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  demo:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>,
  whatsapp:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>,
  task:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
};

// Company type visual config (color + label)
const TYPE_CONFIG = {
  "Agency":              { color: "#10B981", label: "Agency",       icon: "A" },
  "Developer":           { color: "#A855F7", label: "Developer",    icon: "D" },
  "Brokerage":           { color: "#F59E0B", label: "Brokerage",    icon: "B" },
  "Boutique":            { color: "#06B6D4", label: "Boutique",     icon: "Bo" },
  "Property Management": { color: "#EC4899", label: "Prop. Mgmt",   icon: "PM" },
};


// === LEAD SCORING ===
function calculateLeadScore(lead) {
  let score = 0;

  // Company size (0-25)
  const sizeScores = { "Enterprise (200+)": 25, "Large (51-200)": 20, "Medium (11-50)": 15, "Small (2-10)": 10, "Solo": 5 };
  score += sizeScores[lead.companySize] || 0;

  // Plan interest (0-20)
  if (lead.plan?.includes("Enterprise")) score += 20;
  else if (lead.plan?.includes("Pro")) score += 10;

  // Stage progression (0-40)
  const stageScores = { prospect: 0, contacted: 5, qualified: 15, demo_scheduled: 25, trial_started: 35, negotiating: 40, paid: 0, churned: 0, lost: 0 };
  score += stageScores[lead.stage] || 0;

  // Recent activity (0-20)
  if (lead.lastActivityAt) {
    const daysSince = (Date.now() - new Date(lead.lastActivityAt).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSince < 7) score += 20;
    else if (daysSince < 14) score += 10;
    else if (daysSince < 30) score += 5;
  }

  // Source quality (0-15)
  const sourceScores = { Referral: 15, Inbound: 10, LinkedIn: 8, Event: 5, Partner: 10, Website: 8 };
  score += sourceScores[lead.source] || 0;

  // Engagement (0-20)
  const eng = ((lead.totalCalls || 0) * 3) + ((lead.totalEmails || 0) * 2) + ((lead.totalMeetings || 0) * 8);
  score += Math.min(eng, 20);

  return Math.min(Math.round(score), 100);
}

function getTemperature(score) {
  if (score >= 80) return { label: "burning", color: "#DC2626", icon: "🔥" };
  if (score >= 60) return { label: "hot",     color: T.red,    icon: "🔥" };
  if (score >= 40) return { label: "warm",    color: T.amber,  icon: "☀" };
  return { label: "cold", color: T.blue, icon: "❄" };
}

function daysInStage(lead) {
  if (!lead.stageChangedAt) return 0;
  const t = lead.stageChangedAt?.toMillis ? lead.stageChangedAt.toMillis() : new Date(lead.stageChangedAt).getTime();
  return Math.floor((Date.now() - t) / (1000 * 60 * 60 * 24));
}

function isStalled(lead) {
  const stage = STAGES.find(s => s.key === lead.stage);
  if (!stage) return false;
  return daysInStage(lead) > stage.stallDays;
}

function suggestNextFollowUp(stage) {
  const now = new Date();
  const daysToAdd = { prospect: 2, contacted: 2, qualified: 1, demo_scheduled: 1, trial_started: 3, negotiating: 1, paid: 30, churned: 90, lost: 180 };
  now.setDate(now.getDate() + (daysToAdd[stage] || 2));
  return now.toISOString().slice(0, 16);
}

function suggestFollowUpNotes(stage) {
  const notes = {
    prospect: "Send first outreach email",
    contacted: "Follow up on initial outreach",
    qualified: "Send demo invite and calendar link",
    demo_scheduled: "Confirm demo attendance",
    trial_started: "Check trial onboarding progress",
    negotiating: "Send contract and pricing",
    paid: "Check customer satisfaction",
    churned: "Win-back campaign check",
    lost: "Revisit in 6 months",
  };
  return notes[stage] || "";
}

function isTrialEndingSoon(lead) {
  if (!lead.trialEndDate || lead.stage !== "trial_started") return false;
  const end = new Date(lead.trialEndDate).getTime();
  const now = Date.now();
  const days = (end - now) / (1000 * 60 * 60 * 24);
  return days >= 0 && days <= 3;
}

function isOverdue(lead) {
  if (!lead.nextFollowUpAt) return false;
  const t = lead.nextFollowUpAt?.toMillis ? lead.nextFollowUpAt.toMillis() : new Date(lead.nextFollowUpAt).getTime();
  return t < Date.now();
}

function formatCurrency(n) {
  if (!n) return "—";
  if (n >= 1e6) return "AED " + (n/1e6).toFixed(1) + "M";
  if (n >= 1e3) return "AED " + (n/1e3).toFixed(0) + "K";
  return "AED " + n.toLocaleString();
}

// === MAIN COMPONENT ===
export default function PlatformLeadsTab({ currentUserId, currentUserEmail }) {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [search, setSearch] = useState("");
  const [filterStage, setFilterStage] = useState("all");
  const [filterSource, setFilterSource] = useState("all");
  const [filterOwner, setFilterOwner] = useState("all");
  const [showImport, setShowImport] = useState(false);
  const [view, setView] = useState("kanban"); // kanban | list | stats
  const [draggedLead, setDraggedLead] = useState(null);
  const [dragOverStage, setDragOverStage] = useState(null);
  const kanbanScrollRef = useRef(null);

  // Auto-scroll Kanban container when dragging near edges
  function handleKanbanDragOver(e) {
    if (!draggedLead || !kanbanScrollRef.current) return;
    const container = kanbanScrollRef.current;
    const rect = container.getBoundingClientRect();
    const edgeSize = 80;
    const scrollSpeed = 15;
    if (e.clientX - rect.left < edgeSize) {
      container.scrollLeft -= scrollSpeed;
    } else if (rect.right - e.clientX < edgeSize) {
      container.scrollLeft += scrollSpeed;
    }
  }

  // Keyboard shortcuts
  useEffect(() => {
    function handleKey(e) {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA" || e.target.tagName === "SELECT") return;
      if (editing !== null) return;
      if (e.key === "n" || e.key === "N") { e.preventDefault(); setEditing({}); }
      else if (e.key === "k" || e.key === "K") { e.preventDefault(); setView("kanban"); }
      else if (e.key === "l" || e.key === "L") { e.preventDefault(); setView("list"); }
      else if (e.key === "s" || e.key === "S") { e.preventDefault(); setView("stats"); }
      else if (e.key === "i" || e.key === "I") { e.preventDefault(); setView("inbox"); }
      else if (e.key === "/") { e.preventDefault(); document.querySelector('input[placeholder*="Search"]')?.focus(); }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [editing]);

  useEffect(() => {
    const u = onSnapshot(collection(db, "platformLeads"), snap => {
      const arr = [];
      snap.forEach(d => arr.push({ id: d.id, ...d.data() }));
      setLeads(arr);
      setLoading(false);
    }, err => { console.error(err); setLoading(false); });
    return () => u();
  }, []);

  function notify(msg, type = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }

  const filtered = useMemo(() => {
    return leads.filter(l => {
      if (l.archived) return false;
      if (filterStage !== "all" && l.stage !== filterStage) return false;
      if (filterSource !== "all" && l.source !== filterSource) return false;
      if (filterOwner !== "all" && l.assignedTo !== filterOwner) return false;
      if (search) {
        const q = search.toLowerCase();
        const hit = (l.companyName || "").toLowerCase().includes(q) ||
                    (l.contactName || "").toLowerCase().includes(q) ||
                    (l.contactEmail || "").toLowerCase().includes(q) ||
                    (l.contactPhone || "").includes(q) ||
                    (l.tags || []).some(t => t.toLowerCase().includes(q));
        if (!hit) return false;
      }
      return true;
    });
  }, [leads, search, filterStage, filterSource, filterOwner]);

  const byStage = useMemo(() => {
    const result = {};
    STAGES.forEach(s => { result[s.key] = filtered.filter(l => l.stage === s.key); });
    return result;
  }, [filtered]);

  const stats = useMemo(() => {
    const overdueLeads = filtered.filter(isOverdue);
    const stalledLeads = filtered.filter(isStalled);
    return {
      total: filtered.length,
      mrr: filtered.filter(l => l.stage === "paid").reduce((s, l) => s + (Number(l.mrr) || 0), 0),
      arr: filtered.filter(l => l.stage === "paid").reduce((s, l) => s + (Number(l.mrr) || 0), 0) * 12,
      pipelineValue: filtered.filter(l => !["paid", "churned", "lost"].includes(l.stage)).reduce((s, l) => s + (Number(l.estimatedArr) || 0), 0),
      paidCount: filtered.filter(l => l.stage === "paid").length,
      churnedCount: filtered.filter(l => l.stage === "churned").length,
      lostCount: filtered.filter(l => l.stage === "lost").length,
      winRate: (() => {
        const closed = filtered.filter(l => ["paid", "lost"].includes(l.stage));
        if (!closed.length) return 0;
        return Math.round((filtered.filter(l => l.stage === "paid").length / closed.length) * 100);
      })(),
      overdue: overdueLeads.length,
      stalled: stalledLeads.length,
      burning: filtered.filter(l => (l.leadScore || calculateLeadScore(l)) >= 80).length,
      trialEndingSoon: filtered.filter(isTrialEndingSoon).length,
    };
  }, [filtered]);

  const allOwners = useMemo(() => {
    return [...new Set(leads.map(l => l.assignedTo).filter(Boolean))];
  }, [leads]);

  async function save(form) {
    setSaving(true);
    try {
      if (!form.companyName || form.companyName.trim().length < 2) {
        notify("Company name is required", "error"); setSaving(false); return;
      }
      const isNew = !editing.id;
      const id = editing.id || ("lead_" + (form.companyName || "").toLowerCase().replace(/[^a-z0-9]/g, "_").substring(0, 20) + "_" + Date.now().toString(36));
      const leadScore = calculateLeadScore(form);
      const payload = {
        ...form,
        leadScore,
        updatedAt: serverTimestamp(),
        updatedBy: currentUserId || "unknown",
      };
      // Track stage change
      if (!isNew && editing.stage !== form.stage) {
        payload.stageChangedAt = serverTimestamp();
        payload.previousStage = editing.stage;
        payload.stageHistory = [...(editing.stageHistory || []), { stage: form.stage, at: new Date().toISOString(), by: currentUserEmail || "unknown" }];
      }
      if (isNew) {
        payload.createdAt = serverTimestamp();
        payload.createdBy = currentUserId || "unknown";
        payload.stage = payload.stage || "prospect";
        payload.stageChangedAt = serverTimestamp();
        payload.stageHistory = [{ stage: payload.stage, at: new Date().toISOString(), by: currentUserEmail || "unknown" }];
        payload.totalCalls = payload.totalCalls || 0;
        payload.totalEmails = payload.totalEmails || 0;
        payload.totalMeetings = payload.totalMeetings || 0;
        payload.lastActivityAt = new Date().toISOString();
        payload.notes_log = [{ text: "Lead created", type: "note", by: currentUserEmail || "unknown", at: new Date().toISOString() }];
      }
      await setDoc(doc(db, "platformLeads", id), payload, { merge: true });
      await addDoc(collection(db, "platformLeads", id, "auditLog"), {
        action: isNew ? "create" : "update",
        userId: currentUserId || "unknown",
        userEmail: currentUserEmail || "unknown",
        timestamp: serverTimestamp(),
      });
      notify(isNew ? "Lead created" : "Lead updated");
      setEditing(null);
    } catch (e) { console.error(e); notify("Save failed: " + e.message, "error"); }
    setSaving(false);
  }

  async function moveStage(lead, newStage) {
    try {
      await setDoc(doc(db, "platformLeads", lead.id), {
        stage: newStage,
        previousStage: lead.stage,
        stageChangedAt: serverTimestamp(),
        stageHistory: [...(lead.stageHistory || []), { stage: newStage, at: new Date().toISOString(), by: currentUserEmail || "unknown" }],
        updatedAt: serverTimestamp(),
        updatedBy: currentUserId || "unknown",
        lastActivityAt: new Date().toISOString(),
        nextFollowUpAt: suggestNextFollowUp(newStage),
        nextFollowUpNotes: suggestFollowUpNotes(newStage),
      }, { merge: true });
      await addDoc(collection(db, "platformLeads", lead.id, "auditLog"), {
        action: "stage-change",
        oldStage: lead.stage,
        newStage,
        userId: currentUserId || "unknown",
        timestamp: serverTimestamp(),
      });
      notify("Moved to " + STAGES.find(s => s.key === newStage)?.label);
    } catch (e) { notify("Move failed: " + e.message, "error"); }
  }

  async function del(lead) {
    if (!window.confirm("Delete " + lead.companyName + "? This cannot be undone.")) return;
    try {
      await deleteDoc(doc(db, "platformLeads", lead.id));
      notify("Lead deleted");
      setEditing(null);
    } catch (e) { notify("Delete failed: " + e.message, "error"); }
  }

  async function addNote(leadId, noteText, noteType) {
    if (!noteText?.trim()) return;
    try {
      const lead = leads.find(l => l.id === leadId);
      const entry = { text: noteText, type: noteType, by: currentUserEmail || "unknown", at: new Date().toISOString() };
      const counters = {};
      if (noteType === "call") counters.totalCalls = (lead.totalCalls || 0) + 1;
      if (noteType === "email") counters.totalEmails = (lead.totalEmails || 0) + 1;
      if (noteType === "meeting") counters.totalMeetings = (lead.totalMeetings || 0) + 1;
      await setDoc(doc(db, "platformLeads", leadId), {
        notes_log: [...(lead.notes_log || []), entry],
        lastActivityAt: new Date().toISOString(),
        ...counters,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      if (editing?.id === leadId) {
        setEditing({ ...editing, notes_log: [...(editing.notes_log || []), entry], ...counters });
      }
      notify("Note added");
    } catch (e) { notify("Note failed: " + e.message, "error"); }
  }

  function importCsv(file) {
    if (!file) return;
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const rows = results.data;
        if (!rows.length) { notify("CSV is empty", "error"); return; }
        if (!window.confirm("Import " + rows.length + " leads?")) return;
        let created = 0, failed = 0;
        for (const r of rows) {
          try {
            const companyName = (r.companyName || r.Company || r["Company Name"] || r.Name || "").trim();
            if (!companyName) { failed++; continue; }
            const form = {
              companyName,
              companyType: (r.companyType || r.Type || "Agency").trim(),
              companySize: (r.companySize || r.Size || "Small (2-10)").trim(),
              contactName: (r.contactName || r.Contact || r["Contact Name"] || "").trim(),
              contactEmail: (r.contactEmail || r.Email || "").trim(),
              contactPhone: (r.contactPhone || r.Phone || "").trim(),
              stage: (r.stage || r.Stage || "prospect").toLowerCase().trim().replace(" ", "_"),
              plan: (r.plan || r.Plan || "Free").trim(),
              estimatedArr: parseFloat(r.estimatedArr || r.ARR || 0) || 0,
              mrr: parseFloat(r.mrr || r.MRR || 0) || 0,
              source: (r.source || r.Source || "Outbound").trim(),
              assignedTo: (r.assignedTo || r.Owner || "").trim(),
              notes: (r.notes || r.Notes || "").trim(),
              tags: (r.tags || r.Tags || "").split(",").map(t => t.trim()).filter(Boolean),
            };
            await save({ ...form });
            created++;
          } catch (e) { console.error(e); failed++; }
        }
        notify("Imported " + created + " leads" + (failed ? " (" + failed + " failed)" : ""));
        setShowImport(false);
      },
      error: (err) => notify("CSV parse error: " + err.message, "error"),
    });
  }

  function exportCsv() {
    const rows = filtered.map(l => ({
      companyName: l.companyName || "",
      companyType: l.companyType || "",
      companySize: l.companySize || "",
      contactName: l.contactName || "",
      contactEmail: l.contactEmail || "",
      contactPhone: l.contactPhone || "",
      stage: l.stage || "",
      plan: l.plan || "",
      estimatedArr: l.estimatedArr || 0,
      mrr: l.mrr || 0,
      source: l.source || "",
      assignedTo: l.assignedTo || "",
      leadScore: l.leadScore || calculateLeadScore(l),
      notes: l.notes || "",
      tags: (l.tags || []).join(","),
    }));
    const csv = Papa.unparse(rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "dxb-sales-leads-" + new Date().toISOString().split("T")[0] + ".csv";
    link.click();
    notify("Exported " + rows.length + " leads");
  }

  if (loading) return <div style={{ padding: 40, color: T.textMuted, fontFamily: "'Outfit',sans-serif" }}>Loading DXB sales pipeline...</div>;

  return (
    <div style={{ padding: "20px 28px 40px", background: T.bg, minHeight: "100vh", fontFamily: "'Outfit',sans-serif" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, color: T.gold, fontFamily: "'Fraunces',serif", fontWeight: 700 }}>
            DXB Sales Pipeline
          </h1>
          <p style={{ margin: "4px 0 0 0", fontSize: 12, color: T.textMuted }}>
            Internal CRM — Track agencies and developers buying DXB Analytics
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <label style={{ padding: "9px 14px", background: "transparent", border: "1px solid " + T.border, borderRadius: 8, color: T.textMuted, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
            📥 Import CSV
            <input type="file" accept=".csv" style={{ display: "none" }} onChange={e => { if (e.target.files[0]) { importCsv(e.target.files[0]); e.target.value = ""; } }} />
          </label>
          <button onClick={exportCsv} style={{ padding: "9px 14px", background: "transparent", border: "1px solid " + T.border, borderRadius: 8, color: T.textMuted, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
            📤 Export CSV
          </button>
          <button onClick={() => setEditing({})} style={{ padding: "10px 18px", background: "linear-gradient(135deg, " + T.gold + ", #B8922A)", color: "#000", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
            + New Lead
          </button>
        </div>
      </div>

      {/* Help banner - what is a lead? */}
      <div style={{ padding: "12px 16px", background: "rgba(212,168,67,0.06)", border: "1px solid rgba(212,168,67,0.25)", borderRadius: 8, marginBottom: 12, display: "flex", gap: 14, alignItems: "flex-start", fontSize: 11, color: T.textMuted, lineHeight: 1.6 }}>
        <div style={{ fontSize: 18, lineHeight: 1, color: T.gold }}>ⓘ</div>
        <div style={{ flex: 1 }}>
          <div style={{ color: T.white, fontWeight: 700, marginBottom: 4, fontSize: 12 }}>What are these leads?</div>
          Each card is a <strong style={{ color: T.white }}>company you are selling DXB Analytics to</strong> — an agency, developer, brokerage, or property manager. The contact name inside the card is the decision-maker at that company. Drag cards between columns as deals progress.
          <div style={{ marginTop: 8, display: "flex", gap: 12, flexWrap: "wrap" }}>
            {Object.entries(TYPE_CONFIG).map(([k, c]) => (
              <span key={k} style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 10 }}>
                <span style={{ width: 10, height: 10, borderRadius: 3, background: c.color }} />
                <span style={{ color: T.textMuted }}>{c.label}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Warning banners */}
      {stats.overdue > 0 && (
        <div style={{ padding: "10px 14px", background: "rgba(239,68,68,0.08)", border: "1px solid " + T.red + "40", borderRadius: 8, color: T.red, fontSize: 12, fontWeight: 600, marginBottom: 12 }}>
          ⚠ {stats.overdue} lead{stats.overdue > 1 ? "s have" : " has"} overdue follow-ups — review and reschedule
        </div>
      )}
      {stats.trialEndingSoon > 0 && (
        <div style={{ padding: "10px 14px", background: "rgba(168,85,247,0.08)", border: "1px solid " + T.purple + "40", borderRadius: 8, color: T.purple, fontSize: 12, fontWeight: 600, marginBottom: 12 }}>
          🎯 {stats.trialEndingSoon} trial{stats.trialEndingSoon > 1 ? "s" : ""} ending within 3 days — convert them before expiry
        </div>
      )}
      {stats.stalled > 0 && (
        <div style={{ padding: "10px 14px", background: "rgba(245,158,11,0.08)", border: "1px solid " + T.amber + "40", borderRadius: 8, color: T.amber, fontSize: 12, fontWeight: 600, marginBottom: 18 }}>
          ⏱ {stats.stalled} lead{stats.stalled > 1 ? "s are" : " is"} stalled — stuck in the same stage too long
        </div>
      )}

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10, marginBottom: 16 }}>
        <StatCard label="Total Leads" value={stats.total} color={T.gold} />
        <StatCard label="MRR" value={formatCurrency(stats.mrr)} color={T.green} />
        <StatCard label="ARR" value={formatCurrency(stats.arr)} color={T.green} />
        <StatCard label="Pipeline Value" value={formatCurrency(stats.pipelineValue)} color={T.blue} />
        <StatCard label="Win Rate" value={stats.winRate + "%"} color={stats.winRate >= 30 ? T.green : T.amber} />
        <StatCard label="Paid" value={stats.paidCount} color={T.green} />
        <StatCard label="🔥 Burning" value={stats.burning} color="#DC2626" />
      </div>

      {/* Filter bar */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        <input
          type="text"
          placeholder="🔍 Search company, contact, email, phone, tags..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ flex: "1 1 280px", padding: "10px 14px", background: T.surface, border: "1px solid " + T.border, borderRadius: 8, color: T.white, fontSize: 13, outline: "none", fontFamily: "'Outfit',sans-serif" }}
        />
        <select value={filterStage} onChange={e => setFilterStage(e.target.value)} style={filterStyle}>
          <option value="all">All Stages</option>
          {STAGES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
        </select>
        <select value={filterSource} onChange={e => setFilterSource(e.target.value)} style={filterStyle}>
          <option value="all">All Sources</option>
          {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        {allOwners.length > 0 && (
          <select value={filterOwner} onChange={e => setFilterOwner(e.target.value)} style={filterStyle}>
            <option value="all">All Owners</option>
            {allOwners.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        )}
      </div>

      {/* View switcher */}
      <div style={{ display: "flex", gap: 4, marginBottom: 12, borderBottom: "1px solid " + T.border }}>
        {[{k:"kanban",l:"⊞ Kanban"},{k:"list",l:"≡ List"},{k:"inbox",l:"📥 Inbox"},{k:"stats",l:"◈ Stats"}].map(v => (
          <button key={v.k} onClick={() => setView(v.k)} style={{
            padding: "10px 18px",
            background: "transparent",
            border: "none",
            borderBottom: "2px solid " + (view === v.k ? T.gold : "transparent"),
            color: view === v.k ? T.gold : T.textMuted,
            fontSize: 11,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: 0.5,
            cursor: "pointer",
            fontFamily: "'Outfit',sans-serif",
          }}>{v.l}</button>
        ))}
      </div>

      {/* Kanban view */}
      {view === "kanban" && (
      <div ref={kanbanScrollRef} onDragOver={handleKanbanDragOver} style={{ display: "flex", gap: 14, overflow: "auto", paddingBottom: 20, minHeight: 500, scrollBehavior: "smooth" }}>
        {STAGES.map(stage => (
          <div
            key={stage.key}
            onDragOver={e => { e.preventDefault(); setDragOverStage(stage.key); }}
            onDragLeave={() => setDragOverStage(null)}
            onDrop={e => {
              e.preventDefault();
              if (draggedLead && draggedLead.stage !== stage.key) {
                moveStage(draggedLead, stage.key);
              }
              setDraggedLead(null);
              setDragOverStage(null);
            }}
            style={{
              flex: "0 0 320px",
              background: dragOverStage === stage.key ? stage.color + "10" : T.surface,
              border: "2px solid " + (dragOverStage === stage.key ? stage.color : T.border),
              borderRadius: 12,
              padding: 14,
              transition: "all 0.15s",
            }}>
            <div style={{ marginBottom: 14, paddingBottom: 12, borderBottom: "1px solid " + T.border }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: stage.color, boxShadow: "0 0 8px " + stage.color + "80" }} />
                <span style={{ fontSize: 13, color: T.white, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8 }}>{stage.label}</span>
                <span style={{ marginLeft: "auto", fontSize: 13, color: T.textMuted, fontWeight: 700, padding: "2px 10px", background: T.bg, borderRadius: 10 }}>{byStage[stage.key].length}</span>
              </div>
              <div style={{ fontSize: 11, color: T.textDim, marginTop: 5 }}>{stage.sub}</div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 680, overflowY: "auto", paddingRight: 4 }}>
              {byStage[stage.key].length === 0 ? (
                <div style={{ padding: 24, textAlign: "center", fontSize: 11, color: T.textDim, border: "2px dashed " + T.border, borderRadius: 8 }}>
                  Drop leads here
                </div>
              ) : byStage[stage.key].map(l => {
                const score = l.leadScore || calculateLeadScore(l);
                const temp = getTemperature(score);
                const days = daysInStage(l);
                const stalled = isStalled(l);
                const overdue = isOverdue(l);
                const isDragging = draggedLead?.id === l.id;
                return (
                  <div
                    key={l.id}
                    draggable
                    onDragStart={e => { setDraggedLead(l); e.dataTransfer.effectAllowed = "move"; }}
                    onDragEnd={() => { setDraggedLead(null); setDragOverStage(null); }}
                    onClick={() => setEditing(l)}
                    style={{
                      padding: 14,
                      background: T.surfaceAlt,
                      border: "1px solid " + (stalled ? T.red + "60" : T.border),
                      borderRadius: 10,
                      cursor: isDragging ? "grabbing" : "pointer",
                      opacity: isDragging ? 0.4 : 1,
                      transition: "all 0.15s",
                      boxShadow: stalled ? "0 0 0 1px " + T.red + "30" : "none",
                    }}>
                    {/* Top row: name + score */}
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 8 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, color: T.white, fontWeight: 700, lineHeight: 1.3, marginBottom: 2 }}>{l.companyName || "(unnamed)"}</div>
                        {l.companyType && (
                          <div style={{ fontSize: 10, color: T.textDim }}>
                            <span style={{ padding: "2px 8px", background: (TYPE_CONFIG[l.companyType]?.color || T.textMuted) + "20", color: TYPE_CONFIG[l.companyType]?.color || T.textMuted, borderRadius: 4, fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>{TYPE_CONFIG[l.companyType]?.label || l.companyType}</span>{l.companySize ? <span style={{ marginLeft: 6, fontSize: 10, color: T.textDim }}>{l.companySize.replace(/\s*\(.*?\)/, "")}</span> : null}
                          </div>
                        )}
                      </div>
                      <div title={temp.label + " lead · score " + score} style={{
                        flexShrink: 0,
                        padding: "4px 9px",
                        background: temp.color + "15",
                        border: "1px solid " + temp.color + "50",
                        borderRadius: 6,
                        fontSize: 12,
                        fontWeight: 800,
                        color: temp.color,
                        fontFamily: "'Fraunces', serif",
                      }}>{score}</div>
                    </div>

                    {/* Contact */}
                    {(l.contactName || l.contactEmail) && (
                      <div style={{ marginBottom: 10, paddingBottom: 10, borderBottom: "1px solid " + T.border }}>
                        {l.contactName && <div style={{ fontSize: 12, color: T.textMuted, fontWeight: 600 }}><span style={{ fontSize: 9, color: T.textDim, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, marginRight: 5 }}>Contact:</span>{l.contactName}</div>}
                        {l.contactEmail && <div style={{ fontSize: 10, color: T.textDim, wordBreak: "break-all" }}>{l.contactEmail}</div>}
                      </div>
                    )}

                    {/* Revenue */}
                    {(l.estimatedArr > 0 || l.mrr > 0) && (
                      <div style={{ display: "flex", gap: 10, marginBottom: 10, fontSize: 11, fontWeight: 700 }}>
                        {l.estimatedArr > 0 && (
                          <div>
                            <div style={{ fontSize: 8, color: T.textDim, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 1 }}>ARR</div>
                            <div style={{ color: T.gold }}>{formatCurrency(l.estimatedArr)}</div>
                          </div>
                        )}
                        {l.mrr > 0 && (
                          <div>
                            <div style={{ fontSize: 8, color: T.textDim, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 1 }}>MRR</div>
                            <div style={{ color: T.green }}>{formatCurrency(l.mrr)}</div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Warnings */}
                    {(stalled || overdue) && (
                      <div style={{ display: "flex", gap: 5, marginBottom: 10, flexWrap: "wrap" }}>
                        {stalled && (
                          <span style={{ fontSize: 10, padding: "3px 8px", background: T.red + "15", color: T.red, borderRadius: 4, fontWeight: 700, border: "1px solid " + T.red + "30" }}>
                            {days}d stalled
                          </span>
                        )}
                        {overdue && (
                          <span style={{ fontSize: 10, padding: "3px 8px", background: T.amber + "15", color: T.amber, borderRadius: 4, fontWeight: 700, border: "1px solid " + T.amber + "30" }}>
                            overdue
                          </span>
                        )}
                      </div>
                    )}

                    {/* Tags */}
                    {l.tags?.length > 0 && (
                      <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                        {l.tags.slice(0, 4).map(t => (
                          <span key={t} style={{ fontSize: 10, padding: "2px 7px", background: T.blue + "15", color: T.blue, borderRadius: 4, fontWeight: 600 }}>{t}</span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      )}

      {/* List view */}
      {view === "list" && <ListView leads={filtered} onEdit={setEditing} onMoveStage={moveStage} />}

      {/* Stats view */}
      {view === "stats" && <StatsView leads={filtered} stats={stats} />}

      {/* Inbox view */}
      {view === "inbox" && <InboxView leads={filtered} onEdit={setEditing} />}


      {editing !== null && (
        <LeadEditModal
          initial={editing}
          onClose={() => setEditing(null)}
          onSave={save}
          onDelete={editing.id ? () => del(editing) : null}
          onAddNote={(text, type) => addNote(editing.id, text, type)}
          saving={saving}
        />
      )}

      {toast && (
        <div style={{ position: "fixed", bottom: 20, right: 20, padding: "12px 20px", background: toast.type === "error" ? "rgba(239,68,68,0.15)" : "rgba(16,185,129,0.15)", border: "1px solid " + (toast.type === "error" ? T.red : T.green), borderRadius: 8, color: toast.type === "error" ? T.red : T.green, fontSize: 12, fontWeight: 600, zIndex: 10000 }}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}

const filterStyle = { padding: "10px 12px", background: T.surface, border: "1px solid " + T.border, borderRadius: 8, color: T.white, fontSize: 12, outline: "none", fontFamily: "'Outfit',sans-serif", cursor: "pointer" };

function StatCard({ label, value, color }) {
  return (
    <div style={{ padding: 12, background: T.surface, border: "1px solid " + T.border, borderRadius: 10 }}>
      <div style={{ fontSize: 9, color: T.textMuted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4, fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: 18, color, fontWeight: 700, fontFamily: "'Fraunces',serif" }}>{value}</div>
    </div>
  );
}

// === EDIT MODAL ===
function LeadEditModal({ initial, onClose, onSave, onDelete, onAddNote, saving }) {
  const [form, setForm] = useState({
    companyName: "", companyType: "Agency", companySize: "Small (2-10)",
    website: "", linkedin: "",
    contactName: "", contactTitle: "", contactEmail: "", contactPhone: "", contactLanguage: "English",
    stage: "prospect", plan: "Free",
    estimatedArr: 0, mrr: 0, trialEndDate: "",
    source: "Outbound", sourceNotes: "",
    assignedTo: "",
    nextFollowUpAt: "", nextFollowUpType: "call", nextFollowUpNotes: "",
    tags: [], painPoints: [], competitors: [],
    notes: "",
    totalCalls: 0, totalEmails: 0, totalMeetings: 0,
    ...initial,
  });
  const [activeTab, setActiveTab] = useState("details");
  const [noteText, setNoteText] = useState("");
  const [noteType, setNoteType] = useState("note");
  const [tagInput, setTagInput] = useState("");

  const inputStyle = { width: "100%", padding: "9px 11px", background: T.bg, border: "1px solid " + T.border, borderRadius: 6, color: T.white, fontSize: 12, marginTop: 3, fontFamily: "'Outfit',sans-serif", outline: "none" };
  const labelStyle = { fontSize: 9, color: T.textMuted, textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 600 };

  const score = calculateLeadScore(form);
  const temp = getTemperature(score);

  function addTag() {
    if (!tagInput.trim()) return;
    if (!form.tags.includes(tagInput.trim())) {
      setForm({ ...form, tags: [...form.tags, tagInput.trim()] });
    }
    setTagInput("");
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: 20 }} onClick={onClose}>
      <div style={{ background: T.surface, border: "1px solid " + T.gold + "40", borderRadius: 12, width: "100%", maxWidth: 820, maxHeight: "95vh", overflow: "hidden", display: "flex", flexDirection: "column" }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ padding: "20px 28px", borderBottom: "1px solid " + T.border, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 18, color: T.gold, fontFamily: "'Fraunces',serif", fontWeight: 700 }}>
              {initial.id ? form.companyName || "Edit Lead" : "New Sales Lead"}
            </h3>
            {initial.id && (
              <div style={{ display: "flex", gap: 10, marginTop: 4, fontSize: 10, color: T.textMuted }}>
                <span>Score: <span style={{ color: temp.color, fontWeight: 700 }}>{score} · {temp.label}</span></span>
                {initial.stage && <span>· Stage: <span style={{ color: STAGES.find(s => s.key === initial.stage)?.color, fontWeight: 600 }}>{STAGES.find(s => s.key === initial.stage)?.label}</span></span>}
                {initial.stageChangedAt && <span>· {daysInStage(initial)} days in stage</span>}
              </div>
            )}
          </div>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: T.textMuted, fontSize: 22, cursor: "pointer", padding: 0, width: 30, height: 30 }}>×</button>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, padding: "0 28px", borderBottom: "1px solid " + T.border }}>
          {["details", "activity", "advanced"].map(t => (
            <button key={t} onClick={() => setActiveTab(t)} style={{
              padding: "12px 18px",
              background: "transparent",
              border: "none",
              borderBottom: "2px solid " + (activeTab === t ? T.gold : "transparent"),
              color: activeTab === t ? T.gold : T.textMuted,
              fontSize: 11,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: 0.5,
              cursor: "pointer",
              fontFamily: "'Outfit',sans-serif",
            }}>
              {t}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ padding: "20px 28px", overflow: "auto", flex: 1 }}>

          {activeTab === "details" && (
            <div style={{ display: "grid", gap: 12 }}>
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 10 }}>
                <div>
                  <label style={labelStyle}>Company Name *</label>
                  <input style={inputStyle} value={form.companyName} onChange={e => setForm({ ...form, companyName: e.target.value })} placeholder="e.g. Nakheel Properties" />
                </div>
                <div>
                  <label style={labelStyle}>Type</label>
                  <select style={inputStyle} value={form.companyType} onChange={e => setForm({ ...form, companyType: e.target.value })}>
                    {COMPANY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Size</label>
                  <select style={inputStyle} value={form.companySize} onChange={e => setForm({ ...form, companySize: e.target.value })}>
                    {COMPANY_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                <div>
                  <label style={labelStyle}>Contact Name</label>
                  <input style={inputStyle} value={form.contactName} onChange={e => setForm({ ...form, contactName: e.target.value })} />
                </div>
                <div>
                  <label style={labelStyle}>Title</label>
                  <input style={inputStyle} value={form.contactTitle} onChange={e => setForm({ ...form, contactTitle: e.target.value })} placeholder="e.g. CEO" />
                </div>
                <div>
                  <label style={labelStyle}>Language</label>
                  <select style={inputStyle} value={form.contactLanguage} onChange={e => setForm({ ...form, contactLanguage: e.target.value })}>
                    {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label style={labelStyle}>Email</label>
                  <input style={inputStyle} type="email" value={form.contactEmail} onChange={e => setForm({ ...form, contactEmail: e.target.value })} />
                  {form.contactEmail && <a href={"mailto:" + form.contactEmail} style={{ fontSize: 9, color: T.blue, marginTop: 3, display: "inline-block" }}>✉ Send email</a>}
                </div>
                <div>
                  <label style={labelStyle}>Phone</label>
                  <input style={inputStyle} value={form.contactPhone} onChange={e => setForm({ ...form, contactPhone: e.target.value })} />
                  {form.contactPhone && <span style={{ fontSize: 9, marginTop: 3, display: "inline-flex", gap: 8 }}>
                    <a href={"tel:" + form.contactPhone} style={{ color: T.green }}>📞 Call</a>
                    <a href={"https://wa.me/" + form.contactPhone.replace(/[^0-9]/g, "")} target="_blank" rel="noopener" style={{ color: T.green }}>💬 WhatsApp</a>
                  </span>}
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                <div>
                  <label style={labelStyle}>Stage</label>
                  <select style={inputStyle} value={form.stage} onChange={e => setForm({ ...form, stage: e.target.value })}>
                    {STAGES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Plan Interest</label>
                  <select style={inputStyle} value={form.plan} onChange={e => setForm({ ...form, plan: e.target.value })}>
                    {PLANS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Source</label>
                  <select style={inputStyle} value={form.source} onChange={e => setForm({ ...form, source: e.target.value })}>
                    {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                <div>
                  <label style={labelStyle}>Estimated ARR (AED)</label>
                  <input style={inputStyle} type="number" min="0" value={form.estimatedArr} onChange={e => setForm({ ...form, estimatedArr: parseFloat(e.target.value) || 0 })} />
                </div>
                <div>
                  <label style={labelStyle}>Actual MRR (AED)</label>
                  <input style={inputStyle} type="number" min="0" value={form.mrr} onChange={e => setForm({ ...form, mrr: parseFloat(e.target.value) || 0 })} />
                </div>
                <div>
                  <label style={labelStyle}>Trial End</label>
                  <input style={inputStyle} type="date" value={form.trialEndDate} onChange={e => setForm({ ...form, trialEndDate: e.target.value })} />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 10 }}>
                <div>
                  <label style={labelStyle}>Assigned To</label>
                  <input style={inputStyle} value={form.assignedTo} onChange={e => setForm({ ...form, assignedTo: e.target.value })} placeholder="sales@dxbanalytics.com" />
                </div>
                <div>
                  <label style={labelStyle}>Next Follow-up</label>
                  <input style={inputStyle} type="datetime-local" value={form.nextFollowUpAt} onChange={e => setForm({ ...form, nextFollowUpAt: e.target.value })} />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Tags</label>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 5, marginBottom: 5 }}>
                  {form.tags?.map(t => (
                    <span key={t} style={{ padding: "3px 8px", background: T.blue + "20", color: T.blue, borderRadius: 4, fontSize: 10, fontWeight: 600, cursor: "pointer" }} onClick={() => setForm({ ...form, tags: form.tags.filter(x => x !== t) })}>
                      {t} ×
                    </span>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <input style={{ ...inputStyle, flex: 1, margin: 0 }} value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }} placeholder="Add tag (press Enter)" />
                  <button type="button" onClick={addTag} style={{ padding: "9px 14px", background: T.surfaceAlt, border: "1px solid " + T.border, borderRadius: 6, color: T.white, fontSize: 11, cursor: "pointer" }}>Add</button>
                </div>
              </div>

              <div>
                <label style={labelStyle}>Notes</label>
                <textarea style={{ ...inputStyle, minHeight: 60, resize: "vertical" }} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Contact history, preferences, objections..." />
              </div>
            </div>
          )}

          {activeTab === "activity" && (
            <div>
              {/* Stats row */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 16 }}>
                <div style={{ padding: 10, background: T.bg, border: "1px solid " + T.border, borderRadius: 6, textAlign: "center" }}>
                  <div style={{ fontSize: 9, color: T.textMuted, textTransform: "uppercase", fontWeight: 600 }}>Calls</div>
                  <div style={{ fontSize: 20, color: T.blue, fontWeight: 700, fontFamily: "'Fraunces',serif" }}>{form.totalCalls || 0}</div>
                </div>
                <div style={{ padding: 10, background: T.bg, border: "1px solid " + T.border, borderRadius: 6, textAlign: "center" }}>
                  <div style={{ fontSize: 9, color: T.textMuted, textTransform: "uppercase", fontWeight: 600 }}>Emails</div>
                  <div style={{ fontSize: 20, color: T.cyan, fontWeight: 700, fontFamily: "'Fraunces',serif" }}>{form.totalEmails || 0}</div>
                </div>
                <div style={{ padding: 10, background: T.bg, border: "1px solid " + T.border, borderRadius: 6, textAlign: "center" }}>
                  <div style={{ fontSize: 9, color: T.textMuted, textTransform: "uppercase", fontWeight: 600 }}>Meetings</div>
                  <div style={{ fontSize: 20, color: T.purple, fontWeight: 700, fontFamily: "'Fraunces',serif" }}>{form.totalMeetings || 0}</div>
                </div>
              </div>

              {/* Add note */}
              {initial.id && (
                <div style={{ marginBottom: 16, padding: 12, background: T.bg, border: "1px solid " + T.border, borderRadius: 6 }}>
                  <label style={labelStyle}>Log Activity</label>
                  <div style={{ display: "flex", gap: 6, marginTop: 6, marginBottom: 6 }}>
                    {["note", "call", "email", "meeting", "demo"].map(t => (
                      <button key={t} onClick={() => setNoteType(t)} style={{
                        padding: "5px 10px",
                        background: noteType === t ? T.gold + "20" : "transparent",
                        border: "1px solid " + (noteType === t ? T.gold : T.border),
                        borderRadius: 4,
                        color: noteType === t ? T.gold : T.textMuted,
                        fontSize: 10,
                        cursor: "pointer",
                        fontFamily: "'Outfit',sans-serif",
                        textTransform: "capitalize",
                      }}>{t}</button>
                    ))}
                  </div>
                  <textarea style={{ ...inputStyle, minHeight: 50 }} value={noteText} onChange={e => setNoteText(e.target.value)} placeholder="What happened? (e.g. Called CEO, discussed pricing)" />
                  <button onClick={() => { onAddNote(noteText, noteType); setNoteText(""); }} disabled={!noteText.trim()} style={{ marginTop: 6, padding: "7px 14px", background: T.gold, color: "#000", border: "none", borderRadius: 4, fontSize: 11, fontWeight: 700, cursor: noteText.trim() ? "pointer" : "not-allowed", opacity: noteText.trim() ? 1 : 0.5 }}>
                    Log {noteType}
                  </button>
                </div>
              )}

              {/* Timeline */}
              <label style={labelStyle}>Activity Timeline</label>
              <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 8 }}>
                {(form.notes_log || []).slice().reverse().map((n, i) => (
                  <div key={i} style={{ padding: 10, background: T.bg, border: "1px solid " + T.border, borderRadius: 6 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                      <span style={{ fontSize: 9, padding: "1px 6px", background: T.blue + "20", color: T.blue, borderRadius: 3, fontWeight: 600, textTransform: "uppercase" }}>{n.type}</span>
                      <span style={{ fontSize: 9, color: T.textDim }}>{n.by} · {new Date(n.at).toLocaleString()}</span>
                    </div>
                    <div style={{ fontSize: 11, color: T.white }}>{n.text}</div>
                  </div>
                ))}
                {(!form.notes_log || form.notes_log.length === 0) && (
                  <div style={{ padding: 20, textAlign: "center", color: T.textDim, fontSize: 11, border: "1px dashed " + T.border, borderRadius: 6 }}>No activity yet</div>
                )}
              </div>
            </div>
          )}

          {activeTab === "advanced" && (
            <div style={{ display: "grid", gap: 12 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label style={labelStyle}>Website</label>
                  <input style={inputStyle} value={form.website} onChange={e => setForm({ ...form, website: e.target.value })} placeholder="https://..." />
                </div>
                <div>
                  <label style={labelStyle}>LinkedIn</label>
                  <input style={inputStyle} value={form.linkedin} onChange={e => setForm({ ...form, linkedin: e.target.value })} placeholder="linkedin.com/..." />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Source Notes</label>
                <textarea style={{ ...inputStyle, minHeight: 50 }} value={form.sourceNotes} onChange={e => setForm({ ...form, sourceNotes: e.target.value })} placeholder="How did we find them?" />
              </div>

              {initial.stageHistory && initial.stageHistory.length > 0 && (
                <div>
                  <label style={labelStyle}>Stage History</label>
                  <div style={{ marginTop: 6, display: "flex", flexDirection: "column", gap: 4 }}>
                    {initial.stageHistory.map((h, i) => (
                      <div key={i} style={{ fontSize: 10, color: T.textMuted, padding: "4px 8px", background: T.bg, borderRadius: 4 }}>
                        → {STAGES.find(s => s.key === h.stage)?.label || h.stage} · {new Date(h.at).toLocaleDateString()} · {h.by}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {initial.createdAt && (
                <div style={{ fontSize: 10, color: T.textDim, marginTop: 10, paddingTop: 10, borderTop: "1px solid " + T.border }}>
                  Created by {initial.createdBy || "unknown"} · {initial.createdAt?.toDate ? initial.createdAt.toDate().toLocaleString() : "—"}<br/>
                  Last updated by {initial.updatedBy || "unknown"} · {initial.updatedAt?.toDate ? initial.updatedAt.toDate().toLocaleString() : "—"}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: "14px 28px", borderTop: "1px solid " + T.border, display: "flex", gap: 10, justifyContent: "space-between", alignItems: "center" }}>
          <div>
            {onDelete && (
              <button onClick={onDelete} disabled={saving} style={{ padding: "8px 14px", background: "transparent", border: "1px solid " + T.red + "40", borderRadius: 6, color: T.red, fontSize: 11, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>
                Delete
              </button>
            )}
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={onClose} disabled={saving} style={{ padding: "8px 16px", background: "transparent", border: "1px solid " + T.border, borderRadius: 6, color: T.textMuted, fontSize: 11, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>
              Cancel
            </button>
            <button onClick={() => onSave(form)} disabled={saving} style={{ padding: "8px 18px", background: "linear-gradient(135deg, " + T.gold + ", #B8922A)", color: "#000", border: "none", borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>
              {saving ? "Saving..." : initial.id ? "Save Changes" : "Create Lead"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// === LIST VIEW ===
function ListView({ leads, onEdit, onMoveStage }) {
  const [sortBy, setSortBy] = useState("leadScore");
  const [sortDir, setSortDir] = useState("desc");
  const [selected, setSelected] = useState(new Set());

  const sorted = useMemo(() => {
    const arr = [...leads];
    arr.sort((a, b) => {
      let av = a[sortBy] ?? 0;
      let bv = b[sortBy] ?? 0;
      if (sortBy === "leadScore") { av = a.leadScore || calculateLeadScore(a); bv = b.leadScore || calculateLeadScore(b); }
      if (sortBy === "companyName" || sortBy === "contactName") { av = String(av).toLowerCase(); bv = String(bv).toLowerCase(); }
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return arr;
  }, [leads, sortBy, sortDir]);

  function toggleSort(col) {
    if (sortBy === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortBy(col); setSortDir("desc"); }
  }

  function toggleSelect(id) {
    const s = new Set(selected);
    if (s.has(id)) s.delete(id); else s.add(id);
    setSelected(s);
  }

  function toggleSelectAll() {
    if (selected.size === sorted.length) setSelected(new Set());
    else setSelected(new Set(sorted.map(l => l.id)));
  }

  const headerStyle = { padding: "10px 12px", textAlign: "left", fontSize: 10, color: T.textMuted, textTransform: "uppercase", fontWeight: 700, letterSpacing: 0.5, cursor: "pointer", borderBottom: "1px solid " + T.border, background: T.surface };
  const cellStyle = { padding: "10px 12px", fontSize: 11, color: T.white, borderBottom: "1px solid " + T.border };

  return (
    <div style={{ background: T.surface, border: "1px solid " + T.border, borderRadius: 10, overflow: "hidden" }}>
      {selected.size > 0 && (
        <div style={{ padding: "10px 14px", background: T.gold + "10", borderBottom: "1px solid " + T.gold + "40", display: "flex", gap: 10, alignItems: "center" }}>
          <span style={{ fontSize: 11, color: T.gold, fontWeight: 600 }}>{selected.size} selected</span>
          <select onChange={(e) => {
            if (!e.target.value) return;
            sorted.filter(l => selected.has(l.id)).forEach(l => onMoveStage(l, e.target.value));
            setSelected(new Set());
            e.target.value = "";
          }} style={{ padding: "5px 8px", background: T.bg, border: "1px solid " + T.border, borderRadius: 4, color: T.white, fontSize: 10, cursor: "pointer" }}>
            <option value="">Move to stage...</option>
            {STAGES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
          <button onClick={() => setSelected(new Set())} style={{ padding: "5px 10px", background: "transparent", border: "1px solid " + T.border, borderRadius: 4, color: T.textMuted, fontSize: 10, cursor: "pointer" }}>Clear</button>
        </div>
      )}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "'Outfit',sans-serif" }}>
          <thead>
            <tr>
              <th style={{ ...headerStyle, width: 30 }}>
                <input type="checkbox" checked={selected.size === sorted.length && sorted.length > 0} onChange={toggleSelectAll} />
              </th>
              <th style={headerStyle} onClick={() => toggleSort("companyName")}>Company {sortBy === "companyName" && (sortDir === "asc" ? "?" : "?")}</th>
              <th style={headerStyle}>Contact</th>
              <th style={headerStyle} onClick={() => toggleSort("stage")}>Stage</th>
              <th style={headerStyle} onClick={() => toggleSort("leadScore")}>Score {sortBy === "leadScore" && (sortDir === "asc" ? "?" : "?")}</th>
              <th style={headerStyle} onClick={() => toggleSort("estimatedArr")}>ARR {sortBy === "estimatedArr" && (sortDir === "asc" ? "?" : "?")}</th>
              <th style={headerStyle} onClick={() => toggleSort("mrr")}>MRR {sortBy === "mrr" && (sortDir === "asc" ? "?" : "?")}</th>
              <th style={headerStyle}>Source</th>
              <th style={headerStyle}>Owner</th>
              <th style={headerStyle}>Status</th>
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr><td colSpan={10} style={{ ...cellStyle, textAlign: "center", color: T.textDim, padding: 40 }}>No leads match filters</td></tr>
            ) : sorted.map(l => {
              const score = l.leadScore || calculateLeadScore(l);
              const temp = getTemperature(score);
              const stage = STAGES.find(s => s.key === l.stage);
              const stalled = isStalled(l);
              const overdue = isOverdue(l);
              return (
                <tr key={l.id} style={{ cursor: "pointer" }} onClick={() => onEdit(l)}>
                  <td style={cellStyle} onClick={e => { e.stopPropagation(); toggleSelect(l.id); }}>
                    <input type="checkbox" checked={selected.has(l.id)} onChange={() => {}} />
                  </td>
                  <td style={cellStyle}>
                    <div style={{ fontWeight: 600 }}>{l.companyName || "(unnamed)"}</div>
                    {l.companyType && <div style={{ fontSize: 9, color: T.textDim }}>{l.companyType}</div>}
                  </td>
                  <td style={cellStyle}>
                    <div>{l.contactName || "-"}</div>
                    <div style={{ fontSize: 9, color: T.textDim }}>{l.contactEmail || ""}</div>
                  </td>
                  <td style={cellStyle}>
                    {stage && <span style={{ padding: "2px 8px", background: stage.color + "20", border: "1px solid " + stage.color + "40", color: stage.color, borderRadius: 3, fontSize: 9, fontWeight: 700 }}>{stage.label}</span>}
                  </td>
                  <td style={cellStyle}>
                    <span style={{ padding: "2px 6px", background: temp.color + "20", color: temp.color, borderRadius: 3, fontSize: 10, fontWeight: 700, fontFamily: "monospace" }}>{score}</span>
                  </td>
                  <td style={cellStyle}>{formatCurrency(l.estimatedArr)}</td>
                  <td style={cellStyle}>{formatCurrency(l.mrr)}</td>
                  <td style={cellStyle}>{l.source || "-"}</td>
                  <td style={cellStyle}>{l.assignedTo || "-"}</td>
                  <td style={cellStyle}>
                    {stalled && <span style={{ fontSize: 8, padding: "1px 4px", background: T.red + "20", color: T.red, borderRadius: 2, marginRight: 4 }}>? stalled</span>}
                    {overdue && <span style={{ fontSize: 8, padding: "1px 4px", background: T.amber + "20", color: T.amber, borderRadius: 2 }}>? overdue</span>}
                    {!stalled && !overdue && <span style={{ fontSize: 8, color: T.textDim }}>OK</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// === STATS VIEW ===
function StatsView({ leads, stats }) {
  const stageBreakdown = useMemo(() => {
    return STAGES.map(s => ({
      ...s,
      count: leads.filter(l => l.stage === s.key).length,
      value: leads.filter(l => l.stage === s.key).reduce((sum, l) => sum + (l.estimatedArr || 0), 0),
    }));
  }, [leads]);

  const sourceBreakdown = useMemo(() => {
    const m = {};
    leads.forEach(l => {
      const s = l.source || "Unknown";
      if (!m[s]) m[s] = { count: 0, value: 0 };
      m[s].count++;
      m[s].value += l.estimatedArr || 0;
    });
    return Object.entries(m).map(([k, v]) => ({ name: k, ...v })).sort((a, b) => b.count - a.count);
  }, [leads]);

  const topLeads = useMemo(() => {
    return [...leads]
      .map(l => ({ ...l, _score: l.leadScore || calculateLeadScore(l) }))
      .sort((a, b) => b._score - a._score)
      .slice(0, 10);
  }, [leads]);

  const stalledLeads = useMemo(() => {
    return leads.filter(isStalled).sort((a, b) => daysInStage(b) - daysInStage(a)).slice(0, 10);
  }, [leads]);

  const maxFunnel = Math.max(...stageBreakdown.map(s => s.count), 1);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
      {/* Pipeline Funnel */}
      <div style={{ padding: 18, background: T.surface, border: "1px solid " + T.border, borderRadius: 10 }}>
        <h3 style={{ margin: "0 0 14px 0", fontSize: 13, color: T.white, fontFamily: "'Fraunces',serif", fontWeight: 700 }}>Pipeline Funnel</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {stageBreakdown.map(s => (
            <div key={s.key}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3, fontSize: 10 }}>
                <span style={{ color: s.color, fontWeight: 700 }}>{s.label}</span>
                <span style={{ color: T.textMuted }}>{s.count} � {formatCurrency(s.value)}</span>
              </div>
              <div style={{ height: 14, background: T.bg, borderRadius: 3, overflow: "hidden" }}>
                <div style={{ width: (s.count / maxFunnel * 100) + "%", height: "100%", background: s.color, transition: "width 0.3s" }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Revenue Metrics */}
      <div style={{ padding: 18, background: T.surface, border: "1px solid " + T.border, borderRadius: 10 }}>
        <h3 style={{ margin: "0 0 14px 0", fontSize: 13, color: T.white, fontFamily: "'Fraunces',serif", fontWeight: 700 }}>Revenue Metrics</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div>
            <div style={{ fontSize: 9, color: T.textMuted, textTransform: "uppercase", fontWeight: 600 }}>Current MRR</div>
            <div style={{ fontSize: 22, color: T.green, fontWeight: 700, fontFamily: "'Fraunces',serif" }}>{formatCurrency(stats.mrr)}</div>
          </div>
          <div>
            <div style={{ fontSize: 9, color: T.textMuted, textTransform: "uppercase", fontWeight: 600 }}>Projected ARR</div>
            <div style={{ fontSize: 22, color: T.green, fontWeight: 700, fontFamily: "'Fraunces',serif" }}>{formatCurrency(stats.arr)}</div>
          </div>
          <div>
            <div style={{ fontSize: 9, color: T.textMuted, textTransform: "uppercase", fontWeight: 600 }}>Pipeline Value</div>
            <div style={{ fontSize: 22, color: T.blue, fontWeight: 700, fontFamily: "'Fraunces',serif" }}>{formatCurrency(stats.pipelineValue)}</div>
          </div>
          <div>
            <div style={{ fontSize: 9, color: T.textMuted, textTransform: "uppercase", fontWeight: 600 }}>Win Rate</div>
            <div style={{ fontSize: 22, color: stats.winRate >= 30 ? T.green : T.amber, fontWeight: 700, fontFamily: "'Fraunces',serif" }}>{stats.winRate}%</div>
          </div>
          <div>
            <div style={{ fontSize: 9, color: T.textMuted, textTransform: "uppercase", fontWeight: 600 }}>Paid Customers</div>
            <div style={{ fontSize: 22, color: T.green, fontWeight: 700, fontFamily: "'Fraunces',serif" }}>{stats.paidCount}</div>
          </div>
          <div>
            <div style={{ fontSize: 9, color: T.textMuted, textTransform: "uppercase", fontWeight: 600 }}>Churned</div>
            <div style={{ fontSize: 22, color: T.red, fontWeight: 700, fontFamily: "'Fraunces',serif" }}>{stats.churnedCount}</div>
          </div>
        </div>
      </div>

      {/* Source breakdown */}
      <div style={{ padding: 18, background: T.surface, border: "1px solid " + T.border, borderRadius: 10 }}>
        <h3 style={{ margin: "0 0 14px 0", fontSize: 13, color: T.white, fontFamily: "'Fraunces',serif", fontWeight: 700 }}>Lead Sources</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {sourceBreakdown.length === 0 ? (
            <div style={{ color: T.textDim, fontSize: 11, textAlign: "center", padding: 20 }}>No data yet</div>
          ) : sourceBreakdown.map(s => (
            <div key={s.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: T.bg, borderRadius: 4 }}>
              <span style={{ fontSize: 11, color: T.white, fontWeight: 600 }}>{s.name}</span>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 11, color: T.gold, fontWeight: 700 }}>{s.count}</div>
                <div style={{ fontSize: 9, color: T.textDim }}>{formatCurrency(s.value)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top leads by score */}
      <div style={{ padding: 18, background: T.surface, border: "1px solid " + T.border, borderRadius: 10 }}>
        <h3 style={{ margin: "0 0 14px 0", fontSize: 13, color: T.white, fontFamily: "'Fraunces',serif", fontWeight: 700 }}>?? Top 10 Hot Leads</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {topLeads.length === 0 ? (
            <div style={{ color: T.textDim, fontSize: 11, textAlign: "center", padding: 20 }}>No leads yet</div>
          ) : topLeads.map((l, i) => {
            const temp = getTemperature(l._score);
            return (
              <div key={l.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 10px", background: T.bg, borderRadius: 4 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 9, color: T.textDim, width: 16, textAlign: "right" }}>{i + 1}.</span>
                  <div>
                    <div style={{ fontSize: 11, color: T.white, fontWeight: 600 }}>{l.companyName}</div>
                    <div style={{ fontSize: 9, color: T.textDim }}>{STAGES.find(s => s.key === l.stage)?.label}</div>
                  </div>
                </div>
                <span style={{ padding: "2px 6px", background: temp.color + "20", color: temp.color, borderRadius: 3, fontSize: 10, fontWeight: 700, fontFamily: "monospace" }}>{l._score}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Stalled leads */}
      {stalledLeads.length > 0 && (
        <div style={{ gridColumn: "span 2", padding: 18, background: T.surface, border: "1px solid " + T.red + "40", borderRadius: 10 }}>
          <h3 style={{ margin: "0 0 14px 0", fontSize: 13, color: T.red, fontFamily: "'Fraunces',serif", fontWeight: 700 }}>? Stalled Leads � Need Attention</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 8 }}>
            {stalledLeads.map(l => (
              <div key={l.id} style={{ padding: 10, background: T.bg, border: "1px solid " + T.red + "40", borderRadius: 4 }}>
                <div style={{ fontSize: 11, color: T.white, fontWeight: 600 }}>{l.companyName}</div>
                <div style={{ fontSize: 9, color: T.textMuted }}>{STAGES.find(s => s.key === l.stage)?.label} � {daysInStage(l)} days</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// === INBOX VIEW ===
function InboxView({ leads, onEdit }) {
  const [filterType, setFilterType] = useState("all");

  // Flatten all activities across all leads into one timeline
  const allActivities = useMemo(() => {
    const arr = [];
    leads.forEach(l => {
      (l.notes_log || []).forEach(n => {
        arr.push({
          ...n,
          leadId: l.id,
          leadName: l.companyName || "(unnamed)",
          leadStage: l.stage,
          contactName: l.contactName || "",
        });
      });
    });
    arr.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
    return arr;
  }, [leads]);

  const filtered = useMemo(() => {
    if (filterType === "all") return allActivities;
    return allActivities.filter(a => a.type === filterType);
  }, [allActivities, filterType]);

  const typeColors = {
    note: T.textMuted,
    call: T.blue,
    email: T.cyan,
    meeting: T.purple,
    demo: T.gold,
    whatsapp: T.green,
    task: T.amber,
  };


  return (
    <div>
      {/* Filter pills */}
      <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
        {["all", "call", "email", "meeting", "demo", "note", "whatsapp"].map(t => (
          <button key={t} onClick={() => setFilterType(t)} style={{
            padding: "6px 12px",
            background: filterType === t ? T.gold + "20" : "transparent",
            border: "1px solid " + (filterType === t ? T.gold : T.border),
            borderRadius: 4,
            color: filterType === t ? T.gold : T.textMuted,
            fontSize: 10,
            fontWeight: 600,
            cursor: "pointer",
            textTransform: "uppercase",
            fontFamily: "'Outfit',sans-serif",
          }}>
            {t === "all" ? "All" : (<span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><span style={{ color: filterType === t ? T.gold : T.textMuted, display: "inline-flex" }}>{typeIcons[t]}</span>{t}</span>)}
          </button>
        ))}
      </div>

      {/* Timeline */}
      <div style={{ background: T.surface, border: "1px solid " + T.border, borderRadius: 10, padding: 16 }}>
        {filtered.length === 0 ? (
          <div style={{ padding: 60, textAlign: "center", color: T.textDim, fontSize: 12 }}>
            No activities yet. As you log calls, emails, and meetings on your leads, they'll appear here in chronological order.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {filtered.slice(0, 100).map((a, i) => {
              const color = typeColors[a.type] || T.textMuted;
              const stage = STAGES.find(s => s.key === a.leadStage);
              return (
                <div key={i} onClick={() => {
                  const lead = leads.find(l => l.id === a.leadId);
                  if (lead) onEdit(lead);
                }} style={{ padding: 12, background: T.bg, border: "1px solid " + T.border, borderRadius: 6, cursor: "pointer" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, borderRadius: 6, background: color + "20", color: color, flexShrink: 0 }}>{typeIcons[a.type] || typeIcons.note}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4, flexWrap: "wrap", gap: 6 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                          <span style={{ fontSize: 12, color: T.white, fontWeight: 600 }}>{a.leadName}</span>
                          {a.contactName && <span style={{ fontSize: 10, color: T.textMuted }}>� {a.contactName}</span>}
                          {stage && <span style={{ padding: "1px 6px", background: stage.color + "20", border: "1px solid " + stage.color + "40", color: stage.color, borderRadius: 3, fontSize: 8, fontWeight: 700, textTransform: "uppercase" }}>{stage.label}</span>}
                          <span style={{ padding: "1px 6px", background: color + "20", color: color, borderRadius: 3, fontSize: 8, fontWeight: 700, textTransform: "uppercase" }}>{a.type}</span>
                        </div>
                        <span style={{ fontSize: 9, color: T.textDim }}>{new Date(a.at).toLocaleString()}</span>
                      </div>
                      <div style={{ fontSize: 11, color: T.textMuted, lineHeight: 1.5 }}>{a.text}</div>
                      {a.by && <div style={{ fontSize: 9, color: T.textDim, marginTop: 4 }}>by {a.by}</div>}
                    </div>
                  </div>
                </div>
              );
            })}
            {filtered.length > 100 && (
              <div style={{ padding: 12, textAlign: "center", fontSize: 10, color: T.textDim }}>Showing 100 of {filtered.length} activities</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
