/* eslint-disable */
import React, { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { collection, addDoc, updateDoc, doc, serverTimestamp, arrayUnion } from "firebase/firestore";
import { db, auth } from "../../firebase";
import { C, LEAD_STAGES, SOURCES, fmtAED, fmt, timeAgo, fmtDate } from "../crmTokens";

const SMART_TABS = [
  { key: "all",        label: "All",         filter: () => true },
  { key: "today",      label: "Today",       filter: l => { const d = new Date(l.createdAt||0); const t = new Date(); return d.toDateString() === t.toDateString(); } },
  { key: "my",         label: "My Leads",    filter: (l, uid) => l.assignedTo === uid || l.createdBy === uid },
  { key: "uncontacted",label: "Uncontacted", filter: l => !l.lastContact },
  { key: "hot",        label: "Hot",         filter: l => l.status === "Hot Case" },
  { key: "stale",      label: "Stale",       filter: l => l.lastContact && (Date.now() - new Date(l.lastContact).getTime()) > 7*86400000 && !["Closed Deal","Closed Outside"].includes(l.status) },
  { key: "overdue",    label: "Overdue",     filter: l => l.followUpDate && new Date(l.followUpDate) < new Date() && !["Closed Deal","Closed Outside"].includes(l.status) },
  { key: "unassigned", label: "Unassigned",  filter: l => !l.assignedTo },
];

const VIEW_ICONS = [
  { key: "table", icon: "⊞" },
  { key: "grid",  icon: "⊟" },
  { key: "list",  icon: "☰" },
];

function StageChip({ stage, active, count, onClick }) {
  const cfg = LEAD_STAGES.find(s => s.key === stage) || { color: C.textSec, bg: C.surfaceAlt };
  return (
    <button type="button" onClick={onClick} style={{
      display: "flex", alignItems: "center", gap: 5, padding: "4px 10px",
      borderRadius: 20, border: `1px solid ${active ? cfg.color : "transparent"}`,
      background: active ? cfg.bg : "none", cursor: "pointer",
      color: active ? cfg.color : C.textSec, fontSize: 12, fontWeight: active ? 600 : 400,
      fontFamily: C.sans, whiteSpace: "nowrap", transition: "all 0.15s",
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: cfg.color, flexShrink: 0 }} />
      {stage}
      {count > 0 && <span style={{ fontSize: 10, opacity: 0.8 }}>{count}</span>}
    </button>
  );
}

function LeadRow({ lead, agents, onSelect, onAssign, selected }) {
  const cfg = LEAD_STAGES.find(s => s.key === lead.status) || { color: C.textSec, bg: C.surfaceAlt };
  const agent = agents?.find(a => a.uid === lead.assignedTo);
  return (
    <div onClick={() => onSelect(lead)} style={{
      display: "grid", gridTemplateColumns: "28px 1fr 120px 130px 110px 100px 100px 80px",
      gap: 0, padding: "0 16px", height: 52,
      background: selected ? C.surfaceAlt : "none",
      borderBottom: `1px solid ${C.border}`, cursor: "pointer",
      transition: "background 0.1s", alignItems: "center",
    }}
      onMouseEnter={e => { if (!selected) e.currentTarget.style.background = C.surfaceAlt; }}
      onMouseLeave={e => { if (!selected) e.currentTarget.style.background = "none"; }}
    >
      <div style={{ display: "flex", alignItems: "center" }}>
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: cfg.color, flexShrink: 0 }} />
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: C.white, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{lead.name || "—"}</div>
        <div style={{ fontSize: 11, color: C.textSec }}>{lead.phone || lead.email || "—"}</div>
      </div>
      <div>
        <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 12, background: cfg.bg, color: cfg.color }}>
          {lead.status || "New Lead"}
        </span>
      </div>
      <div style={{ fontSize: 12, color: C.gold, fontWeight: 600 }}>{lead.budget ? fmtAED(lead.budget) : "—"}</div>
      <div style={{ fontSize: 11, color: C.textSec }}>{lead.source || "—"}</div>
      <div style={{ fontSize: 11, color: C.textSec }}>{agent?.name || lead.assignedToName || (
        <button type="button" onClick={e => { e.stopPropagation(); onAssign(lead); }} style={{
          background: C.goldDim, border: `1px solid ${C.gold}40`, borderRadius: 6,
          color: C.gold, fontSize: 10, padding: "2px 8px", cursor: "pointer", fontFamily: C.sans,
        }}>+ Assign</button>
      )}</div>
      <div style={{ fontSize: 11, color: C.textMuted }}>{timeAgo(lead.lastContact || lead.updatedAt)}</div>
      <div onClick={e => e.stopPropagation()}>
        <button type="button" onClick={() => { if (lead.phone) window.open(`https://wa.me/${lead.phone.replace(/\D/g,"")}`, "_blank"); }} style={{
          background: "rgba(37,211,102,0.12)", border: "1px solid rgba(37,211,102,0.3)",
          borderRadius: 6, color: "#25D366", fontSize: 11, padding: "4px 8px", cursor: "pointer", fontFamily: C.sans, fontWeight: 600,
        }}>WA</button>
      </div>
    </div>
  );
}

function LeadCard({ lead, agents, onSelect, onAssign }) {
  const cfg = LEAD_STAGES.find(s => s.key === lead.status) || { color: C.textSec, bg: C.surfaceAlt };
  const agent = agents?.find(a => a.uid === lead.assignedTo);
  return (
    <div onClick={() => onSelect(lead)} style={{
      background: C.card, border: `1px solid ${C.border}`, borderRadius: 12,
      padding: "14px 16px", cursor: "pointer", transition: "all 0.15s",
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = C.gold + "50"; e.currentTarget.style.transform = "translateY(-1px)"; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.transform = "none"; }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: C.surfaceAlt, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: C.gold, flexShrink: 0 }}>
            {(lead.name || "?").charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.white }}>{lead.name || "—"}</div>
            <div style={{ fontSize: 11, color: C.textSec }}>{lead.phone || "—"}</div>
          </div>
        </div>
        <span style={{ fontSize: 10, fontWeight: 600, padding: "3px 8px", borderRadius: 10, background: cfg.bg, color: cfg.color }}>{lead.status || "New Lead"}</span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: C.gold }}>{lead.budget ? fmtAED(lead.budget) : "No budget"}</span>
        <span style={{ fontSize: 10, color: C.textMuted }}>{lead.source || "—"}</span>
      </div>
      {lead.community && <div style={{ fontSize: 11, color: C.textSec, marginTop: 6 }}>📍 {lead.community}</div>}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10, paddingTop: 10, borderTop: `1px solid ${C.border}` }}>
        <span style={{ fontSize: 10, color: C.textMuted }}>{timeAgo(lead.lastContact || lead.updatedAt)}</span>
        <div style={{ display: "flex", gap: 6 }}>
          {!lead.assignedTo && (
            <button type="button" onClick={e => { e.stopPropagation(); onAssign(lead); }} style={{ background: C.goldDim, border: `1px solid ${C.gold}40`, borderRadius: 6, color: C.gold, fontSize: 10, padding: "3px 8px", cursor: "pointer", fontFamily: C.sans }}>
              + Assign
            </button>
          )}
          <button type="button" onClick={e => { e.stopPropagation(); if (lead.phone) window.open(`https://wa.me/${lead.phone.replace(/\D/g,"")}`, "_blank"); }} style={{ background: "rgba(37,211,102,0.12)", border: "1px solid rgba(37,211,102,0.3)", borderRadius: 6, color: "#25D366", fontSize: 10, padding: "3px 8px", cursor: "pointer", fontFamily: C.sans }}>
            WA
          </button>
        </div>
      </div>
    </div>
  );
}

function AddLeadModal({ onClose, onSave, agents, orgId, firebaseUser }) {
  const [form, setForm] = useState({ name: "", phone: "", email: "", budget: "", source: "Manual", status: "New Lead", community: "", nationality: "", serviceType: "Buyer", comment: "" });
  const [saving, setSaving] = useState(false);
  const F = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const inp = { width: "100%", padding: "10px 12px", background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 13, fontFamily: C.sans, outline: "none", boxSizing: "border-box" };

  const save = async () => {
    if (!form.name.trim() && !form.phone.trim()) return;
    setSaving(true);
    try {
      await addDoc(collection(db, "leads"), {
        ...form, budget: parseFloat(form.budget) || 0,
        orgId: orgId || "", createdBy: firebaseUser?.uid || "",
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
        tags: [], notes_log: [{ text: "Lead created", type: "Note", by: firebaseUser?.email || "", at: new Date().toISOString() }],
      });
      onSave();
      onClose();
    } catch (e) { console.error(e); }
    setSaving(false);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 3000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: C.surface, borderRadius: 16, border: `1px solid ${C.border}`, width: "100%", maxWidth: 520, maxHeight: "90vh", overflow: "auto" }}>
        <div style={{ padding: "20px 24px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: C.white }}>Add New Lead</div>
            <div style={{ fontSize: 12, color: C.textSec }}>Fill in the lead details below</div>
          </div>
          <button type="button" onClick={onClose} style={{ background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 8, width: 32, height: 32, cursor: "pointer", color: C.textSec, fontSize: 16 }}>×</button>
        </div>
        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div><div style={{ fontSize: 11, color: C.textSec, marginBottom: 5 }}>FULL NAME *</div><input style={inp} value={form.name} onChange={e => F("name", e.target.value)} placeholder="Client full name" /></div>
            <div><div style={{ fontSize: 11, color: C.textSec, marginBottom: 5 }}>PHONE</div><input style={inp} value={form.phone} onChange={e => F("phone", e.target.value)} placeholder="+971 50 XXX XXXX" /></div>
            <div><div style={{ fontSize: 11, color: C.textSec, marginBottom: 5 }}>EMAIL</div><input style={inp} value={form.email} onChange={e => F("email", e.target.value)} placeholder="email@example.com" /></div>
            <div><div style={{ fontSize: 11, color: C.textSec, marginBottom: 5 }}>BUDGET (AED)</div><input style={inp} type="number" value={form.budget} onChange={e => F("budget", e.target.value)} placeholder="2000000" /></div>
            <div>
              <div style={{ fontSize: 11, color: C.textSec, marginBottom: 5 }}>SOURCE</div>
              <select style={{ ...inp }} value={form.source} onChange={e => F("source", e.target.value)}>
                {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <div style={{ fontSize: 11, color: C.textSec, marginBottom: 5 }}>STATUS</div>
              <select style={{ ...inp }} value={form.status} onChange={e => F("status", e.target.value)}>
                {LEAD_STAGES.map(s => <option key={s.key} value={s.key}>{s.key}</option>)}
              </select>
            </div>
            <div><div style={{ fontSize: 11, color: C.textSec, marginBottom: 5 }}>COMMUNITY</div><input style={inp} value={form.community} onChange={e => F("community", e.target.value)} placeholder="Dubai Hills, Business Bay..." /></div>
            <div>
              <div style={{ fontSize: 11, color: C.textSec, marginBottom: 5 }}>SERVICE TYPE</div>
              <select style={{ ...inp }} value={form.serviceType} onChange={e => F("serviceType", e.target.value)}>
                {["Buyer", "Seller", "Renter", "Landlord", "Investor"].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div><div style={{ fontSize: 11, color: C.textSec, marginBottom: 5 }}>COMMENT</div><textarea style={{ ...inp, height: 80, resize: "vertical" }} value={form.comment} onChange={e => F("comment", e.target.value)} placeholder="Additional notes..." /></div>
        </div>
        <div style={{ padding: "16px 24px", borderTop: `1px solid ${C.border}`, display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button type="button" onClick={onClose} style={{ padding: "10px 20px", borderRadius: 8, border: `1px solid ${C.border}`, background: "none", color: C.textSec, fontSize: 13, cursor: "pointer", fontFamily: C.sans }}>Cancel</button>
          <button type="button" onClick={save} disabled={saving} style={{ padding: "10px 24px", borderRadius: 8, background: `linear-gradient(135deg, ${C.gold}, #B8922A)`, border: "none", color: "#000", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: C.sans }}>
            {saving ? "Saving..." : "Save Lead"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CRMLeads({ myLeads, myLeadsLoading, teamMembers, firebaseUser, orgId, notify }) {
  const [smartTab, setSmartTab] = useState("all");
  const [stageFilter, setStageFilter] = useState("All");
  const [view, setView] = useState("table");
  const [search, setSearch] = useState("");
  const [aiQuery, setAiQuery] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiFiltered, setAiFiltered] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [showAssign, setShowAssign] = useState(null);
  const [sortBy, setSortBy] = useState("createdAt");
  const uid = firebaseUser?.uid;

  const agents = useMemo(() => (teamMembers || []).filter(m => m.orgRole === "agent" || m.role === "agent"), [teamMembers]);

  const stageCounts = useMemo(() => {
    const counts = {};
    (myLeads || []).forEach(l => { counts[l.status || "New Lead"] = (counts[l.status || "New Lead"] || 0) + 1; });
    return counts;
  }, [myLeads]);

  const filtered = useMemo(() => {
    let arr = aiFiltered || myLeads || [];
    const tab = SMART_TABS.find(t => t.key === smartTab);
    if (tab) arr = arr.filter(l => tab.filter(l, uid));
    if (stageFilter !== "All") arr = arr.filter(l => l.status === stageFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      arr = arr.filter(l =>
        (l.name || "").toLowerCase().includes(q) ||
        (l.phone || "").includes(q) ||
        (l.email || "").toLowerCase().includes(q) ||
        (l.community || "").toLowerCase().includes(q) ||
        (l.assignedToName || "").toLowerCase().includes(q)
      );
    }
    return arr.sort((a, b) => {
      if (sortBy === "budget") return (b.budget || 0) - (a.budget || 0);
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });
  }, [myLeads, smartTab, stageFilter, search, aiFiltered, uid, sortBy]);

  const runAIFilter = async () => {
    if (!aiQuery.trim()) { setAiFiltered(null); return; }
    setAiLoading(true);
    try {
      const resp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: `You are a CRM filter assistant. Given a natural language query and a list of leads, return a JSON array of lead IDs that match the query. Only return valid JSON array of strings, nothing else. Example: ["id1","id2"]`,
          messages: [{
            role: "user",
            content: `Query: "${aiQuery}"\n\nLeads (first 200):\n${JSON.stringify((myLeads || []).slice(0, 200).map(l => ({ id: l.id, name: l.name, status: l.status, budget: l.budget, source: l.source, community: l.community, assignedTo: l.assignedToName, lastContact: l.lastContact })))}`
          }]
        })
      });
      const data = await resp.json();
      const text = data.content?.[0]?.text || "[]";
      const ids = JSON.parse(text.replace(/```json|```/g, "").trim());
      setAiFiltered((myLeads || []).filter(l => ids.includes(l.id)));
      notify(`AI found ${ids.length} matching leads`);
    } catch (e) {
      notify("AI filter failed — " + e.message, "error");
      setAiFiltered(null);
    }
    setAiLoading(false);
  };

  const tabCounts = useMemo(() => {
    const leads = myLeads || [];
    return {
      all: leads.length,
      today: leads.filter(l => { const d = new Date(l.createdAt||0); const t = new Date(); return d.toDateString() === t.toDateString(); }).length,
      my: leads.filter(l => l.assignedTo === uid || l.createdBy === uid).length,
      uncontacted: leads.filter(l => !l.lastContact).length,
      hot: leads.filter(l => l.status === "Hot Case").length,
      stale: leads.filter(l => l.lastContact && (Date.now() - new Date(l.lastContact).getTime()) > 7*86400000).length,
      overdue: leads.filter(l => l.followUpDate && new Date(l.followUpDate) < new Date()).length,
      unassigned: leads.filter(l => !l.assignedTo).length,
    };
  }, [myLeads, uid]);

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

      {/* Smart tabs */}
      <div style={{ display: "flex", alignItems: "center", gap: 2, padding: "10px 20px 0", borderBottom: `1px solid ${C.border}`, overflowX: "auto", flexShrink: 0 }}>
        {SMART_TABS.map(tab => {
          const cnt = tabCounts[tab.key] || 0;
          const active = smartTab === tab.key;
          return (
            <button key={tab.key} type="button" onClick={() => setSmartTab(tab.key)} style={{
              display: "flex", alignItems: "center", gap: 5, padding: "8px 14px",
              background: "none", border: "none", cursor: "pointer",
              borderBottom: active ? `2px solid ${C.gold}` : "2px solid transparent",
              color: active ? C.gold : C.textSec, fontSize: 13, fontWeight: active ? 600 : 400,
              fontFamily: C.sans, whiteSpace: "nowrap", marginBottom: -1,
            }}>
              {tab.label}
              {cnt > 0 && (
                <span style={{ background: tab.key === "hot" ? C.redDim : tab.key === "stale" ? C.yellowDim : C.surfaceAlt, color: tab.key === "hot" ? C.red : tab.key === "stale" ? C.yellow : C.textSec, borderRadius: 10, padding: "1px 6px", fontSize: 10, fontWeight: 700 }}>
                  {cnt > 999 ? "999+" : cnt}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Toolbar */}
      <div style={{ padding: "12px 20px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 10, flexShrink: 0, flexWrap: "wrap" }}>
        {/* Back breadcrumb */}
        <span style={{ fontSize: 14, fontWeight: 700, color: C.white }}>Leads</span>
        <span style={{ color: C.textMuted }}>›</span>

        {/* AI Filter */}
        <div style={{ flex: 1, position: "relative", minWidth: 200, maxWidth: 400 }}>
          <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 14 }}>✨</span>
          <input
            value={aiQuery}
            onChange={e => setAiQuery(e.target.value)}
            onKeyDown={e => e.key === "Enter" && runAIFilter()}
            placeholder="Ask AI to filter leads... (e.g. hot leads over AED 5M in JVC)"
            style={{ width: "100%", padding: "8px 12px 8px 32px", background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 12, fontFamily: C.sans, outline: "none" }}
          />
          {aiQuery && (
            <button type="button" onClick={() => { setAiQuery(""); setAiFiltered(null); }} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: C.textSec, cursor: "pointer", fontSize: 14 }}>×</button>
          )}
        </div>
        <button type="button" onClick={runAIFilter} disabled={aiLoading || !aiQuery.trim()} style={{ padding: "8px 14px", background: C.purpleDim, border: `1px solid ${C.purple}50`, borderRadius: 8, color: C.purple, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: C.sans, display: "flex", alignItems: "center", gap: 6 }}>
          {aiLoading ? <span style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>⟳</span> : "⌘"} {aiLoading ? "Filtering..." : "AI Filter"}
        </button>

        {/* Search */}
        <div style={{ position: "relative" }}>
          <span style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", color: C.textMuted, fontSize: 12 }}>🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, phone..." style={{ padding: "8px 10px 8px 28px", background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 12, fontFamily: C.sans, outline: "none", width: 180 }} />
        </div>

        {/* Sort */}
        <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ padding: "8px 10px", background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 12, fontFamily: C.sans, outline: "none" }}>
          <option value="createdAt">Latest</option>
          <option value="budget">Budget</option>
        </select>

        {/* Views */}
        <div style={{ display: "flex", background: C.surfaceAlt, borderRadius: 8, overflow: "hidden", border: `1px solid ${C.border}` }}>
          {VIEW_ICONS.map(v => (
            <button key={v.key} type="button" onClick={() => setView(v.key)} style={{ padding: "7px 10px", background: view === v.key ? C.gold : "none", border: "none", color: view === v.key ? "#000" : C.textSec, cursor: "pointer", fontSize: 14 }}>
              {v.icon}
            </button>
          ))}
        </div>

        {/* Count */}
        <span style={{ fontSize: 12, color: C.textSec, whiteSpace: "nowrap" }}>
          {filtered.length} leads
        </span>

        {/* Add button */}
        <button type="button" onClick={() => setShowAdd(true)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", background: `linear-gradient(135deg, ${C.gold}, #B8922A)`, border: "none", borderRadius: 8, color: "#000", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: C.sans }}>
          + Add
        </button>
      </div>

      {/* Stage chips */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 20px", borderBottom: `1px solid ${C.border}`, overflowX: "auto", flexShrink: 0 }}>
        <StageChip stage="All" active={stageFilter === "All"} count={0} onClick={() => setStageFilter("All")} />
        {LEAD_STAGES.map(s => (
          <StageChip key={s.key} stage={s.key} active={stageFilter === s.key} count={stageCounts[s.key] || 0} onClick={() => setStageFilter(stageFilter === s.key ? "All" : s.key)} />
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {myLeadsLoading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", gap: 10, color: C.textSec }}>
            <span style={{ animation: "spin 1s linear infinite", display: "inline-block", fontSize: 20 }}>⟳</span>
            Loading leads...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "50%", gap: 12 }}>
            <div style={{ fontSize: 40, opacity: 0.3 }}>🔍</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: C.textSec }}>No leads found</div>
            <div style={{ fontSize: 13, color: C.textMuted }}>Try adjusting your filters or search criteria.</div>
            <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
              <button type="button" onClick={() => { setSmartTab("all"); setStageFilter("All"); setSearch(""); setAiFiltered(null); setAiQuery(""); }} style={{ padding: "8px 16px", background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 8, color: C.textSec, fontSize: 12, cursor: "pointer", fontFamily: C.sans }}>
                🔄 Clear Filters
              </button>
              <button type="button" onClick={() => setShowAdd(true)} style={{ padding: "8px 16px", background: `linear-gradient(135deg, ${C.gold}, #B8922A)`, border: "none", borderRadius: 8, color: "#000", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: C.sans }}>
                + Add Lead
              </button>
            </div>
          </div>
        ) : view === "table" ? (
          <div>
            {/* Table header */}
            <div style={{ display: "grid", gridTemplateColumns: "28px 1fr 120px 130px 110px 100px 100px 80px", gap: 0, padding: "8px 16px", background: C.surface, borderBottom: `1px solid ${C.border}`, position: "sticky", top: 0, zIndex: 10 }}>
              {["", "Name", "Status", "Budget", "Source", "Agent", "Last Contact", ""].map((h, i) => (
                <div key={i} style={{ fontSize: 10, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>{h}</div>
              ))}
            </div>
            {filtered.map((lead, i) => (
              <LeadRow key={lead.id || i} lead={lead} agents={agents} onSelect={setSelectedLead} onAssign={setShowAssign} selected={selectedLead?.id === lead.id} />
            ))}
          </div>
        ) : view === "grid" ? (
          <div style={{ padding: 20, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
            {filtered.map((lead, i) => (
              <LeadCard key={lead.id || i} lead={lead} agents={agents} onSelect={setSelectedLead} onAssign={setShowAssign} />
            ))}
          </div>
        ) : (
          <div style={{ padding: "0 20px" }}>
            {filtered.map((lead, i) => {
              const cfg = LEAD_STAGES.find(s => s.key === lead.status) || { color: C.textSec };
              return (
                <div key={lead.id || i} onClick={() => setSelectedLead(lead)} style={{ display: "flex", alignItems: "center", gap: 16, padding: "12px 0", borderBottom: `1px solid ${C.border}`, cursor: "pointer" }}
                  onMouseEnter={e => e.currentTarget.style.opacity = "0.8"}
                  onMouseLeave={e => e.currentTarget.style.opacity = "1"}
                >
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: cfg.color, flexShrink: 0 }} />
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: C.surfaceAlt, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: C.gold, flexShrink: 0 }}>
                    {(lead.name || "?").charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.white }}>{lead.name}</div>
                    <div style={{ fontSize: 11, color: C.textSec }}>{lead.phone} · {lead.source}</div>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.gold }}>{lead.budget ? fmtAED(lead.budget) : "—"}</div>
                  <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 10, background: `${cfg.color}20`, color: cfg.color }}>{lead.status}</span>
                  <span style={{ fontSize: 11, color: C.textMuted, width: 80, textAlign: "right" }}>{timeAgo(lead.updatedAt)}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Lead Modal */}
      {showAdd && <AddLeadModal onClose={() => setShowAdd(false)} onSave={() => notify("Lead added!")} agents={agents} orgId={orgId} firebaseUser={firebaseUser} />}

    </div>
  );
}
