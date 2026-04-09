import React, { useState, useEffect, useMemo } from "react";
import {
  collection, doc, setDoc, onSnapshot, serverTimestamp, addDoc, deleteDoc
} from "firebase/firestore";
import { db } from "../firebase";

const T = {
  bg: "#0B0F14",
  surface: "#131821",
  surfaceAlt: "#1A2028",
  border: "rgba(148,163,184,0.15)",
  gold: "#D4A843",
  goldD: "rgba(212,168,67,0.12)",
  white: "#FFFFFF",
  textMuted: "#94A3B8",
  green: "#10B981",
  greenD: "rgba(16,185,129,0.12)",
  amber: "#F59E0B",
  amberD: "rgba(245,158,11,0.12)",
  red: "#EF4444",
  redD: "rgba(239,68,68,0.12)",
  blue: "#3B82F6",
  blueD: "rgba(59,130,246,0.12)",
  purple: "#A855F7",
  purpleD: "rgba(168,85,247,0.12)",
  teal: "#14B8A6",
  tealD: "rgba(20,184,166,0.12)",
};

const STAGES = [
  { key: "prospect",      label: "Prospect",       color: T.textMuted, sub: "Identified, not contacted" },
  { key: "contacted",     label: "Contacted",      color: T.blue,      sub: "Initial outreach sent" },
  { key: "demo_scheduled",label: "Demo Scheduled", color: T.amber,     sub: "Meeting booked" },
  { key: "trial_started", label: "Trial Started",  color: T.purple,    sub: "In 14-day trial" },
  { key: "paid",          label: "Paid",           color: T.green,     sub: "Converted customer" },
  { key: "churned",       label: "Churned",        color: T.red,       sub: "Lost or cancelled" },
];

const COMPANY_TYPES = ["Agency", "Developer", "Brokerage", "Boutique"];
const PLANS = ["Free", "Pro (AED 299)", "Enterprise (AED 799)"];

export default function PlatformLeadsTab({ currentUserId, currentUserEmail }) {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [search, setSearch] = useState("");

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

  const byStage = useMemo(() => {
    const filter = (l) => !search ||
      (l.companyName || "").toLowerCase().includes(search.toLowerCase()) ||
      (l.contactName || "").toLowerCase().includes(search.toLowerCase()) ||
      (l.contactEmail || "").toLowerCase().includes(search.toLowerCase());
    const result = {};
    STAGES.forEach(s => { result[s.key] = leads.filter(l => l.stage === s.key && filter(l)); });
    return result;
  }, [leads, search]);

  const stats = useMemo(() => {
    const filter = (l) => !search ||
      (l.companyName || "").toLowerCase().includes(search.toLowerCase()) ||
      (l.contactName || "").toLowerCase().includes(search.toLowerCase());
    const filtered = leads.filter(filter);
    return {
      total: filtered.length,
      mrr: filtered.filter(l => l.stage === "paid").reduce((s, l) => s + (Number(l.mrr) || 0), 0),
      pipeline: filtered.filter(l => !["paid", "churned"].includes(l.stage)).reduce((s, l) => s + (Number(l.estimatedArr) || 0), 0),
      paidCount: filtered.filter(l => l.stage === "paid").length,
      churnedCount: filtered.filter(l => l.stage === "churned").length,
    };
  }, [leads, search]);

  async function save(form) {
    setSaving(true);
    try {
      if (!form.companyName || form.companyName.trim().length < 2) {
        notify("Company name is required", "error"); setSaving(false); return;
      }
      const isNew = !editing.id;
      const id = editing.id || ("lead_" + Date.now().toString(36));
      const payload = {
        ...form,
        updatedAt: serverTimestamp(),
        updatedBy: currentUserId || "unknown",
      };
      if (isNew) {
        payload.createdAt = serverTimestamp();
        payload.createdBy = currentUserId || "unknown";
        payload.stage = payload.stage || "prospect";
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
        updatedAt: serverTimestamp(),
        updatedBy: currentUserId || "unknown",
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
    } catch (e) { notify("Delete failed: " + e.message, "error"); }
  }

  if (loading) return <div style={{ padding: 40, color: T.textMuted }}>Loading DXB sales pipeline...</div>;

  return (
    <div style={{ padding: "20px 28px", background: T.bg, minHeight: "100vh", fontFamily: "'Outfit',sans-serif" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, color: T.gold, fontFamily: "'Fraunces',serif", fontWeight: 700 }}>
            DXB Sales Pipeline
          </h1>
          <p style={{ margin: "4px 0 0 0", fontSize: 12, color: T.textMuted }}>
            Internal CRM — Agencies and developers we are selling the platform to
          </p>
        </div>
        <button onClick={() => setEditing({})} style={{ padding: "10px 18px", background: "linear-gradient(135deg, " + T.gold + ", #B8922A)", color: "#000", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>
          + New Lead
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 18 }}>
        <StatCard label="Total Leads" value={stats.total} color={T.gold} sub="in pipeline" />
        <StatCard label="MRR" value={"AED " + stats.mrr.toLocaleString()} color={T.green} sub="from paid customers" />
        <StatCard label="Pipeline Value" value={"AED " + (stats.pipeline / 1000).toFixed(0) + "K"} color={T.blue} sub="potential ARR" />
        <StatCard label="Paid" value={stats.paidCount} color={T.green} sub="converted" />
        <StatCard label="Churned" value={stats.churnedCount} color={T.red} sub="lost" />
      </div>

      {/* Search */}
      <input type="text" placeholder="Search company, contact, email..." value={search} onChange={e => setSearch(e.target.value)}
        style={{ width: "100%", padding: "10px 14px", background: T.surface, border: "1px solid " + T.border, borderRadius: 8, color: T.white, fontSize: 13, marginBottom: 18, fontFamily: "'Outfit',sans-serif", outline: "none" }} />

      {/* Kanban board */}
      <div style={{ display: "flex", gap: 12, overflow: "auto", paddingBottom: 20 }}>
        {STAGES.map(stage => (
          <div key={stage.key} style={{ flex: "0 0 280px", background: T.surface, border: "1px solid " + T.border, borderRadius: 10, padding: 12 }}>
            <div style={{ marginBottom: 10, paddingBottom: 10, borderBottom: "1px solid " + T.border }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: stage.color }} />
                <span style={{ fontSize: 12, color: T.white, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>{stage.label}</span>
                <span style={{ marginLeft: "auto", fontSize: 11, color: T.textMuted }}>{byStage[stage.key].length}</span>
              </div>
              <div style={{ fontSize: 10, color: T.textMuted, marginTop: 3 }}>{stage.sub}</div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {byStage[stage.key].length === 0 ? (
                <div style={{ padding: 16, textAlign: "center", fontSize: 11, color: T.textMuted, border: "1px dashed " + T.border, borderRadius: 6 }}>No leads</div>
              ) : byStage[stage.key].map(l => (
                <div key={l.id} onClick={() => setEditing(l)} style={{ padding: 10, background: T.surfaceAlt, border: "1px solid " + T.border, borderRadius: 6, cursor: "pointer" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 12, color: T.white, fontWeight: 600 }}>{l.companyName || "(unnamed)"}</span>
                    {l.companyType && <span style={{ fontSize: 9, padding: "1px 6px", background: stage.color + "20", color: stage.color, borderRadius: 3 }}>{l.companyType}</span>}
                  </div>
                  <div style={{ fontSize: 10, color: T.textMuted, marginBottom: 6 }}>
                    {l.contactName || "-"} · {l.contactEmail || "-"}
                  </div>
                  {l.estimatedArr > 0 && (
                    <div style={{ fontSize: 10, color: T.gold, fontWeight: 600 }}>
                      ARR: AED {Number(l.estimatedArr).toLocaleString()}
                    </div>
                  )}
                  {l.mrr > 0 && (
                    <div style={{ fontSize: 10, color: T.green, fontWeight: 600 }}>
                      MRR: AED {Number(l.mrr).toLocaleString()}
                    </div>
                  )}
                  <div style={{ display: "flex", gap: 3, marginTop: 8, flexWrap: "wrap" }} onClick={e => e.stopPropagation()}>
                    {STAGES.filter(s => s.key !== stage.key).map(s => (
                      <button key={s.key} onClick={() => moveStage(l, s.key)}
                        title={"Move to " + s.label}
                        style={{ padding: "3px 6px", background: "transparent", border: "1px solid " + T.border, borderRadius: 3, color: s.color, fontSize: 9, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>
                        → {s.label.slice(0, 4)}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Edit modal */}
      {editing !== null && (
        <LeadEditModal initial={editing} onClose={() => setEditing(null)} onSave={save} onDelete={editing.id ? () => del(editing) : null} saving={saving} />
      )}

      {toast && (
        <div style={{ position: "fixed", bottom: 20, right: 20, padding: "12px 20px", background: toast.type === "error" ? T.redD : T.greenD, border: "1px solid " + (toast.type === "error" ? T.red : T.green), borderRadius: 8, color: toast.type === "error" ? T.red : T.green, fontSize: 12, fontWeight: 600, zIndex: 10000 }}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color, sub }) {
  return (
    <div style={{ padding: 14, background: T.surface, border: "1px solid " + T.border, borderRadius: 10 }}>
      <div style={{ fontSize: 10, color: T.textMuted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 20, color, fontWeight: 700, fontFamily: "'Fraunces',serif" }}>{value}</div>
      <div style={{ fontSize: 10, color: T.textMuted, marginTop: 2 }}>{sub}</div>
    </div>
  );
}

function LeadEditModal({ initial, onClose, onSave, onDelete, saving }) {
  const [form, setForm] = useState({
    companyName: "", companyType: "Agency",
    contactName: "", contactEmail: "", contactPhone: "",
    stage: "prospect", plan: "Free",
    estimatedArr: 0, mrr: 0,
    trialEndDate: "", notes: "",
    assignedTo: "",
    ...initial,
  });

  const inputStyle = { width: "100%", padding: "10px 12px", background: T.bg, border: "1px solid " + T.border, borderRadius: 6, color: T.white, fontSize: 13, marginTop: 4, fontFamily: "'Outfit',sans-serif", outline: "none" };
  const labelStyle = { fontSize: 10, color: T.textMuted, textTransform: "uppercase", letterSpacing: 0.5 };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: 20 }} onClick={onClose}>
      <div style={{ background: T.surface, border: "1px solid " + T.gold + "40", borderRadius: 12, padding: 28, maxWidth: 700, width: "100%", maxHeight: "92vh", overflow: "auto" }} onClick={e => e.stopPropagation()}>
        <h3 style={{ margin: "0 0 20px 0", fontSize: 16, color: T.gold, fontFamily: "'Fraunces',serif" }}>
          {initial.id ? "Edit Lead" : "New Sales Lead"}
        </h3>

        <div style={{ display: "grid", gap: 12 }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 10 }}>
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
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            <div>
              <label style={labelStyle}>Contact Name</label>
              <input style={inputStyle} value={form.contactName} onChange={e => setForm({ ...form, contactName: e.target.value })} />
            </div>
            <div>
              <label style={labelStyle}>Email</label>
              <input style={inputStyle} type="email" value={form.contactEmail} onChange={e => setForm({ ...form, contactEmail: e.target.value })} />
            </div>
            <div>
              <label style={labelStyle}>Phone</label>
              <input style={inputStyle} value={form.contactPhone} onChange={e => setForm({ ...form, contactPhone: e.target.value })} />
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
              <label style={labelStyle}>Plan</label>
              <select style={inputStyle} value={form.plan} onChange={e => setForm({ ...form, plan: e.target.value })}>
                {PLANS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Trial End</label>
              <input style={inputStyle} type="date" value={form.trialEndDate} onChange={e => setForm({ ...form, trialEndDate: e.target.value })} />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <label style={labelStyle}>Estimated ARR (AED)</label>
              <input style={inputStyle} type="number" min="0" value={form.estimatedArr} onChange={e => setForm({ ...form, estimatedArr: parseFloat(e.target.value) || 0 })} />
            </div>
            <div>
              <label style={labelStyle}>Actual MRR (AED)</label>
              <input style={inputStyle} type="number" min="0" value={form.mrr} onChange={e => setForm({ ...form, mrr: parseFloat(e.target.value) || 0 })} />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Assigned To</label>
            <input style={inputStyle} value={form.assignedTo} onChange={e => setForm({ ...form, assignedTo: e.target.value })} placeholder="Sales rep email" />
          </div>

          <div>
            <label style={labelStyle}>Notes</label>
            <textarea style={{ ...inputStyle, minHeight: 80, resize: "vertical" }} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Contact history, preferences, objections..." />
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "space-between", alignItems: "center", marginTop: 24, paddingTop: 20, borderTop: "1px solid " + T.border }}>
          <div>
            {onDelete && (
              <button onClick={onDelete} disabled={saving} style={{ padding: "9px 14px", background: "transparent", border: "1px solid " + T.red + "40", borderRadius: 8, color: T.red, fontSize: 12, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>
                Delete Lead
              </button>
            )}
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={onClose} disabled={saving} style={{ padding: "9px 16px", background: "transparent", border: "1px solid " + T.border, borderRadius: 8, color: T.textMuted, fontSize: 12, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>
              Cancel
            </button>
            <button onClick={() => onSave(form)} disabled={saving} style={{ padding: "9px 16px", background: "linear-gradient(135deg, " + T.gold + ", #B8922A)", color: "#000", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>
              {saving ? "Saving..." : initial.id ? "Save Changes" : "Create Lead"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}