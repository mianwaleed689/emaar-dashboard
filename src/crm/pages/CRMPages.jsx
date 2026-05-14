/* eslint-disable */
// CRMOpportunities.jsx
import React, { useState, useMemo } from "react";
import { collection, addDoc } from "firebase/firestore";
import { db } from "../../firebase";
import { C, OPP_STAGES, fmtAED, fmt, timeAgo } from "../crmTokens";

export function CRMOpportunities({ myLeads, firebaseUser, orgId, notify }) {
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ title: "", value: "", stage: "New", leadId: "", probability: "50", notes: "" });
  const [saving, setSaving] = useState(false);

  // For now use leads with high budget as opportunities
  const opps = useMemo(() => (myLeads || []).filter(l => l.budget >= 1000000 && ["Hot Case", "EOI", "Interested", "Potential"].includes(l.status)), [myLeads]);

  const byStage = useMemo(() => {
    const groups = {};
    OPP_STAGES.forEach(s => groups[s.key] = []);
    opps.forEach(l => {
      const stage = l.status === "Hot Case" ? "Qualified" : l.status === "EOI" ? "Proposal" : l.status === "Interested" ? "New" : "Qualified";
      if (groups[stage]) groups[stage].push(l);
    });
    return groups;
  }, [opps]);

  const totalValue = useMemo(() => opps.reduce((s, l) => s + (l.budget || 0), 0), [opps]);

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Header */}
      <div style={{ padding: "16px 24px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: C.white }}>Opportunities</div>
          <div style={{ fontSize: 12, color: C.textSec }}>{opps.length} opportunities · Pipeline: {fmtAED(totalValue)}</div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          {[{ label: "Open", val: opps.length, color: C.orange }, { label: "Pipeline", val: fmtAED(totalValue), color: C.gold }, { label: "Win Rate", val: "—", color: C.green }].map(stat => (
            <div key={stat.label} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "8px 16px", textAlign: "center" }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: stat.color }}>{stat.val}</div>
              <div style={{ fontSize: 10, color: C.textSec }}>{stat.label}</div>
            </div>
          ))}
          <button type="button" onClick={() => setShowAdd(true)} style={{ padding: "8px 16px", background: `linear-gradient(135deg, ${C.gold}, #B8922A)`, border: "none", borderRadius: 8, color: "#000", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: C.sans }}>
            + New Opportunity
          </button>
        </div>
      </div>

      {/* Kanban */}
      <div style={{ flex: 1, overflowX: "auto", overflowY: "hidden", display: "flex", gap: 14, padding: "16px 24px" }}>
        {OPP_STAGES.map(stage => {
          const cards = byStage[stage.key] || [];
          const stageVal = cards.reduce((s, l) => s + (l.budget || 0), 0);
          return (
            <div key={stage.key} style={{ flexShrink: 0, width: 260, display: "flex", flexDirection: "column", gap: 10 }}>
              {/* Column header */}
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 14px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ width: 10, height: 10, borderRadius: "50%", background: stage.color, display: "inline-block" }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: C.white }}>{stage.key}</span>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: stage.color, background: `${stage.color}20`, borderRadius: 10, padding: "1px 8px" }}>{cards.length}</span>
                </div>
                {stageVal > 0 && <div style={{ fontSize: 11, color: C.gold, marginTop: 4 }}>{fmtAED(stageVal)}</div>}
              </div>

              {/* Cards */}
              <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
                {cards.length === 0 ? (
                  <div style={{ background: C.card, border: `1px dashed ${C.border}`, borderRadius: 10, padding: "24px 16px", textAlign: "center", color: C.textMuted, fontSize: 12 }}>
                    No opportunities
                  </div>
                ) : cards.map((lead, i) => (
                  <div key={lead.id || i} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 14px", cursor: "pointer", transition: "border-color 0.15s" }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = stage.color + "60"}
                    onMouseLeave={e => e.currentTarget.style.borderColor = C.border}
                  >
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.white, marginBottom: 6 }}>{lead.name}</div>
                    <div style={{ fontSize: 12, color: C.gold, fontWeight: 700, marginBottom: 4 }}>{fmtAED(lead.budget)}</div>
                    {lead.community && <div style={{ fontSize: 11, color: C.textSec }}>📍 {lead.community}</div>}
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, paddingTop: 8, borderTop: `1px solid ${C.border}` }}>
                      <span style={{ fontSize: 10, color: C.textMuted }}>{lead.source}</span>
                      <span style={{ fontSize: 10, color: C.textMuted }}>{timeAgo(lead.updatedAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// CRMDeals.jsx
// ─────────────────────────────────────────────
export function CRMDeals({ deals, myLeads, firebaseUser, orgId, notify }) {
  const [stageFilter, setStageFilter] = useState("All");
  const [paymentFilter, setPaymentFilter] = useState("All");
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ leadName: "", project: "", unit: "", value: "", commission: "", stage: "EOI", paymentStatus: "Pending", developerName: "", notes: "" });
  const [saving, setSaving] = useState(false);

  const DEAL_STAGES_CFG = [
    { key: "EOI",         color: C.blue,   label: "EOI" },
    { key: "Reservation", color: C.orange, label: "Reservation" },
    { key: "Contracted",  color: C.green,  label: "Contracted" },
    { key: "Cancelled",   color: C.red,    label: "Cancelled" },
  ];

  const PAYMENT_STATUS = ["All", "Collected", "Partial", "Pending"];

  const filtered = useMemo(() => {
    let arr = deals || [];
    if (stageFilter !== "All") arr = arr.filter(d => d.stage === stageFilter);
    if (paymentFilter !== "All") arr = arr.filter(d => d.paymentStatus === paymentFilter);
    return arr;
  }, [deals, stageFilter, paymentFilter]);

  const totalValue = useMemo(() => filtered.reduce((s, d) => s + parseFloat(d.price || d.value || 0), 0), [filtered]);
  const totalCommission = useMemo(() => filtered.reduce((s, d) => s + parseFloat(d.commission || 0), 0), [filtered]);

  const inp = { width: "100%", padding: "10px 12px", background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 13, fontFamily: C.sans, outline: "none", boxSizing: "border-box" };

  const saveDeal = async () => {
    setSaving(true);
    try {
      await addDoc(collection(db, "deals"), { ...form, value: parseFloat(form.value) || 0, commission: parseFloat(form.commission) || 0, orgId: orgId || "", agentId: firebaseUser?.uid || "", createdAt: new Date().toISOString() });
      notify("Deal created!");
      setShowAdd(false);
    } catch (e) { notify("Failed: " + e.message, "error"); }
    setSaving(false);
  };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Toolbar */}
      <div style={{ padding: "12px 20px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 10, flexShrink: 0, flexWrap: "wrap" }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: C.white }}>Deals</span>
        <span style={{ color: C.textMuted }}>›</span>

        {/* Stage filters */}
        <div style={{ display: "flex", background: C.surfaceAlt, borderRadius: 8, overflow: "hidden", border: `1px solid ${C.border}` }}>
          {["All", ...DEAL_STAGES_CFG.map(s => s.key)].map(s => {
            const cfg = DEAL_STAGES_CFG.find(d => d.key === s);
            return (
              <button key={s} type="button" onClick={() => setStageFilter(s)} style={{
                padding: "6px 12px", background: stageFilter === s ? (cfg?.color || C.gold) + "20" : "none",
                border: "none", color: stageFilter === s ? (cfg?.color || C.gold) : C.textSec,
                fontSize: 12, fontWeight: stageFilter === s ? 600 : 400, cursor: "pointer", fontFamily: C.sans,
              }}>{s}</button>
            );
          })}
        </div>

        {/* Payment status */}
        <div style={{ display: "flex", background: C.surfaceAlt, borderRadius: 8, overflow: "hidden", border: `1px solid ${C.border}`, marginLeft: "auto" }}>
          {PAYMENT_STATUS.map(s => (
            <button key={s} type="button" onClick={() => setPaymentFilter(s)} style={{
              padding: "6px 12px", background: paymentFilter === s ? C.goldDim : "none",
              border: "none", color: paymentFilter === s ? C.gold : C.textSec,
              fontSize: 12, fontWeight: paymentFilter === s ? 600 : 400, cursor: "pointer", fontFamily: C.sans,
            }}>{s}</button>
          ))}
        </div>

        <button type="button" onClick={() => setShowAdd(true)} style={{ padding: "8px 16px", background: `linear-gradient(135deg, ${C.gold}, #B8922A)`, border: "none", borderRadius: 8, color: "#000", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: C.sans }}>
          + Add Deal
        </button>
      </div>

      {/* Stats bar */}
      <div style={{ display: "flex", gap: 12, padding: "10px 20px", borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
        {[
          { label: "Total Deals", val: filtered.length, color: C.blue },
          { label: "Total Value", val: fmtAED(totalValue), color: C.gold },
          { label: "Commissions", val: fmtAED(totalCommission), color: C.green },
          { label: "Contracted", val: filtered.filter(d => d.stage === "Contracted").length, color: C.green },
        ].map(s => (
          <div key={s.label} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 16px" }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: s.color }}>{s.val}</div>
            <div style={{ fontSize: 10, color: C.textSec }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {filtered.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "60%", gap: 12 }}>
            <div style={{ fontSize: 40, opacity: 0.3 }}>🤝</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: C.textSec }}>No deals found</div>
            <div style={{ fontSize: 13, color: C.textMuted }}>Try adjusting your filters or search criteria.</div>
            <button type="button" onClick={() => setShowAdd(true)} style={{ padding: "10px 20px", background: `linear-gradient(135deg, ${C.gold}, #B8922A)`, border: "none", borderRadius: 8, color: "#000", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: C.sans, marginTop: 8 }}>
              + Create First Deal
            </button>
          </div>
        ) : (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 140px 130px 120px 110px 100px 80px", gap: 0, padding: "8px 20px", background: C.surface, borderBottom: `1px solid ${C.border}`, position: "sticky", top: 0 }}>
              {["Deal", "Stage", "Value", "Commission", "Payment", "Date", ""].map((h, i) => (
                <div key={i} style={{ fontSize: 10, fontWeight: 700, color: C.textMuted, textTransform: "uppercase" }}>{h}</div>
              ))}
            </div>
            {filtered.map((deal, i) => {
              const stageCfg = DEAL_STAGES_CFG.find(s => s.key === deal.stage) || { color: C.textSec };
              return (
                <div key={deal.id || i} style={{ display: "grid", gridTemplateColumns: "1fr 140px 130px 120px 110px 100px 80px", gap: 0, padding: "12px 20px", borderBottom: `1px solid ${C.border}`, alignItems: "center" }}
                  onMouseEnter={e => e.currentTarget.style.background = C.surfaceAlt}
                  onMouseLeave={e => e.currentTarget.style.background = "none"}
                >
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.white }}>{deal.project || deal.leadName || "Deal"}</div>
                    <div style={{ fontSize: 11, color: C.textSec }}>{deal.unit || deal.developerName || "—"}</div>
                  </div>
                  <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 12, background: `${stageCfg.color}20`, color: stageCfg.color, fontWeight: 600, width: "fit-content" }}>{deal.stage}</span>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.gold }}>{fmtAED(deal.price || deal.value || 0)}</div>
                  <div style={{ fontSize: 12, color: C.green }}>{fmtAED(deal.commission || 0)}</div>
                  <div>
                    <span style={{ fontSize: 11, color: deal.paymentStatus === "Collected" ? C.green : deal.paymentStatus === "Pending" ? C.yellow : C.orange }}>{deal.paymentStatus || "Pending"}</span>
                  </div>
                  <div style={{ fontSize: 11, color: C.textMuted }}>{deal.createdAt ? new Date(deal.createdAt).toLocaleDateString("en-AE") : "—"}</div>
                  <button type="button" style={{ padding: "4px 10px", background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 6, color: C.textSec, fontSize: 11, cursor: "pointer", fontFamily: C.sans }}>View</button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Deal Modal */}
      {showAdd && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 3000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: C.surface, borderRadius: 16, border: `1px solid ${C.border}`, width: "100%", maxWidth: 480 }}>
            <div style={{ padding: "18px 22px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.white }}>Create New Deal</div>
              <button type="button" onClick={() => setShowAdd(false)} style={{ background: "none", border: "none", color: C.textSec, fontSize: 18, cursor: "pointer" }}>×</button>
            </div>
            <div style={{ padding: "18px 22px", display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {[
                  { key: "leadName", label: "Client Name *", placeholder: "Client name" },
                  { key: "project", label: "Project", placeholder: "Project name" },
                  { key: "unit", label: "Unit No.", placeholder: "e.g. 1204" },
                  { key: "developerName", label: "Developer", placeholder: "Developer name" },
                  { key: "value", label: "Deal Value (AED)", placeholder: "2500000", type: "number" },
                  { key: "commission", label: "Commission (AED)", placeholder: "50000", type: "number" },
                ].map(f => (
                  <div key={f.key}>
                    <div style={{ fontSize: 11, color: C.textSec, marginBottom: 4 }}>{f.label}</div>
                    <input type={f.type || "text"} style={inp} value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} placeholder={f.placeholder} />
                  </div>
                ))}
                <div>
                  <div style={{ fontSize: 11, color: C.textSec, marginBottom: 4 }}>Stage</div>
                  <select style={inp} value={form.stage} onChange={e => setForm(p => ({ ...p, stage: e.target.value }))}>
                    {DEAL_STAGES_CFG.map(s => <option key={s.key} value={s.key}>{s.key}</option>)}
                  </select>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: C.textSec, marginBottom: 4 }}>Payment Status</div>
                  <select style={inp} value={form.paymentStatus} onChange={e => setForm(p => ({ ...p, paymentStatus: e.target.value }))}>
                    {["Pending", "Partial", "Collected"].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: C.textSec, marginBottom: 4 }}>Notes</div>
                <textarea style={{ ...inp, height: 70, resize: "vertical" }} value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Deal notes..." />
              </div>
            </div>
            <div style={{ padding: "14px 22px", borderTop: `1px solid ${C.border}`, display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button type="button" onClick={() => setShowAdd(false)} style={{ padding: "9px 18px", borderRadius: 8, border: `1px solid ${C.border}`, background: "none", color: C.textSec, fontSize: 13, cursor: "pointer", fontFamily: C.sans }}>Cancel</button>
              <button type="button" onClick={saveDeal} disabled={saving} style={{ padding: "9px 20px", borderRadius: 8, background: `linear-gradient(135deg, ${C.gold}, #B8922A)`, border: "none", color: "#000", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: C.sans }}>
                {saving ? "Creating..." : "Create Deal"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// CRMActivities.jsx
// ─────────────────────────────────────────────
export function CRMActivities({ firebaseUser, orgId, notify, myLeads }) {
  const [activeTab, setActiveTab] = useState("pending");
  const [showAdd, setShowAdd] = useState(false);
  const [actType, setActType] = useState("call");
  const [form, setForm] = useState({ title: "", notes: "", date: new Date().toISOString().split("T")[0], time: "10:00", leadId: "" });
  const [saving, setSaving] = useState(false);

  const TYPES = [
    { key: "call",    label: "Log Call",         icon: "📞", color: C.blue },
    { key: "meeting", label: "Schedule Meeting",  icon: "📅", color: C.purple },
    { key: "message", label: "Send Message",      icon: "💬", color: C.teal },
    { key: "note",    label: "Add Note",          icon: "📝", color: C.orange },
    { key: "email",   label: "Send Email",        icon: "📧", color: C.green },
  ];

  const inp = { width: "100%", padding: "10px 12px", background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 13, fontFamily: C.sans, outline: "none", boxSizing: "border-box" };

  return (
    <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
      {/* Left — Activity list */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Tabs */}
        <div style={{ display: "flex", borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
          {[{ key: "pending", label: "Pending & Overdue" }, { key: "upcoming", label: "Upcoming" }, { key: "done", label: "Completed" }].map(tab => (
            <button key={tab.key} type="button" onClick={() => setActiveTab(tab.key)} style={{
              padding: "14px 20px", background: "none", border: "none",
              borderBottom: activeTab === tab.key ? `2px solid ${C.gold}` : "2px solid transparent",
              color: activeTab === tab.key ? C.gold : C.textSec, fontSize: 13, fontWeight: activeTab === tab.key ? 600 : 400,
              cursor: "pointer", fontFamily: C.sans,
            }}>{tab.label}</button>
          ))}
        </div>

        {/* Empty state */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
          <div style={{ fontSize: 40, opacity: 0.3 }}>✅</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: C.textSec }}>No pending activities</div>
          <div style={{ fontSize: 13, color: C.textMuted }}>All caught up!</div>
          <button type="button" onClick={() => setShowAdd(true)} style={{ marginTop: 8, padding: "10px 20px", background: `linear-gradient(135deg, ${C.gold}, #B8922A)`, border: "none", borderRadius: 8, color: "#000", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: C.sans }}>
            + Log Activity
          </button>
        </div>
      </div>

      {/* Right — Quick Actions */}
      <div style={{ width: 280, borderLeft: `1px solid ${C.border}`, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ padding: "16px 18px", borderBottom: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.white }}>⚡ Quick Actions</div>
        </div>
        <div style={{ padding: "8px 8px", overflowY: "auto" }}>
          {TYPES.map(t => (
            <button key={t.key} type="button" onClick={() => { setActType(t.key); setShowAdd(true); }} style={{
              display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", width: "100%",
              background: "none", border: "none", borderRadius: 8, cursor: "pointer",
              transition: "background 0.15s", fontFamily: C.sans, textAlign: "left",
            }}
              onMouseEnter={e => e.currentTarget.style.background = C.surfaceAlt}
              onMouseLeave={e => e.currentTarget.style.background = "none"}
            >
              <div style={{ width: 36, height: 36, borderRadius: 10, background: `${t.color}20`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>
                {t.icon}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.white }}>{t.label}</div>
                <div style={{ fontSize: 11, color: C.textSec }}>Record a {t.key} activity</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Add Activity Modal */}
      {showAdd && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 3000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: C.surface, borderRadius: 16, border: `1px solid ${C.border}`, width: "100%", maxWidth: 420 }}>
            <div style={{ padding: "18px 22px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between" }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.white }}>Log Activity</div>
              <button type="button" onClick={() => setShowAdd(false)} style={{ background: "none", border: "none", color: C.textSec, fontSize: 18, cursor: "pointer" }}>×</button>
            </div>
            <div style={{ padding: "18px 22px", display: "flex", flexDirection: "column", gap: 14 }}>
              {/* Type picker */}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {TYPES.map(t => (
                  <button key={t.key} type="button" onClick={() => setActType(t.key)} style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 20, background: actType === t.key ? `${t.color}20` : C.surfaceAlt, border: `1px solid ${actType === t.key ? t.color : "transparent"}`, color: actType === t.key ? t.color : C.textSec, fontSize: 12, cursor: "pointer", fontFamily: C.sans }}>
                    {t.icon} {t.label.split(" ")[0]}
                  </button>
                ))}
              </div>
              <div><div style={{ fontSize: 11, color: C.textSec, marginBottom: 4 }}>Title *</div><input style={inp} value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Activity title" /></div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div><div style={{ fontSize: 11, color: C.textSec, marginBottom: 4 }}>Date</div><input type="date" style={inp} value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} /></div>
                <div><div style={{ fontSize: 11, color: C.textSec, marginBottom: 4 }}>Time</div><input type="time" style={inp} value={form.time} onChange={e => setForm(p => ({ ...p, time: e.target.value }))} /></div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: C.textSec, marginBottom: 4 }}>Linked Lead</div>
                <select style={inp} value={form.leadId} onChange={e => setForm(p => ({ ...p, leadId: e.target.value }))}>
                  <option value="">No lead selected</option>
                  {(myLeads || []).slice(0, 50).map(l => <option key={l.id} value={l.id}>{l.name || l.phone}</option>)}
                </select>
              </div>
              <div><div style={{ fontSize: 11, color: C.textSec, marginBottom: 4 }}>Notes</div><textarea style={{ ...inp, height: 80, resize: "vertical" }} value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Activity notes..." /></div>
            </div>
            <div style={{ padding: "14px 22px", borderTop: `1px solid ${C.border}`, display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button type="button" onClick={() => setShowAdd(false)} style={{ padding: "9px 18px", borderRadius: 8, border: `1px solid ${C.border}`, background: "none", color: C.textSec, fontSize: 13, cursor: "pointer", fontFamily: C.sans }}>Cancel</button>
              <button type="button" onClick={() => { notify("Activity logged!"); setShowAdd(false); }} style={{ padding: "9px 20px", borderRadius: 8, background: `linear-gradient(135deg, ${C.gold}, #B8922A)`, border: "none", color: "#000", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: C.sans }}>
                Log Activity
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
