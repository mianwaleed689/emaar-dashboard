import React, { useState, useEffect, useMemo } from "react";
import {
  collection, doc, setDoc, onSnapshot, serverTimestamp, addDoc
} from "firebase/firestore";
import { db } from "../../firebase";
import { C, cardStyle, btnStyles, inputStyle } from "./tokens";
import BulkToolbar from "./BulkToolbar";
import Papa from "papaparse";

const TIERS = ["tier-1", "tier-2", "tier-3", "emerging"];
const VISIBILITY = ["draft", "published", "archived"];

function slugify(str) {
  return String(str || "")
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function DevelopersSection({ currentUserId, currentUserEmail }) {
  const [devs, setDevs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [fTier, setFTier] = useState("All");
  const [fVisibility, setFVisibility] = useState("All");
  const [sortBy, setSortBy] = useState("name");
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());

  useEffect(() => {
    const u = onSnapshot(collection(db, "developers"), snap => {
      const arr = [];
      snap.forEach(d => arr.push({ id: d.id, ...d.data() }));
      setDevs(arr);
      setLoading(false);
    }, err => { console.error(err); setLoading(false); });
    return () => u();
  }, []);

  function notify(msg, type = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }

  const filtered = useMemo(() => {
    let r = [...devs];
    if (search) {
      const s = search.toLowerCase();
      r = r.filter(d =>
        (d.name || "").toLowerCase().includes(s) ||
        (d.reraLicenseNumber || "").toString().includes(s)
      );
    }
    if (fTier !== "All") r = r.filter(d => d.tier === fTier);
    if (fVisibility !== "All") r = r.filter(d => d.visibility === fVisibility);

    if (sortBy === "name") r.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    else if (sortBy === "reliability") r.sort((a, b) => (b.reliabilityScore || 0) - (a.reliabilityScore || 0));
    else if (sortBy === "onTime") r.sort((a, b) => (b.onTimeRate || 0) - (a.onTimeRate || 0));
    else if (sortBy === "projects") r.sort((a, b) => (b.totalProjects || 0) - (a.totalProjects || 0));

    return r;
  }, [devs, search, fTier, fVisibility, sortBy]);

  async function saveDev(form) {
    setSaving(true);
    try {
      if (!form.name || form.name.trim().length < 2) {
        notify("Name is required", "error");
        setSaving(false);
        return;
      }
      if (form.visibility === "published" && !form.reraLicenseNumber) {
        notify("Published developers must have RERA license number", "error");
        setSaving(false);
        return;
      }

      const isNew = !editing.id;
      const id = editing.id || slugify(form.name);

      const payload = {
        ...form,
        slug: editing.id ? form.slug : slugify(form.name),
        orgId: form.orgId || "dxb-analytics",
        updatedAt: serverTimestamp(),
        updatedBy: currentUserId || "unknown",
      };

      if (isNew) {
        payload.createdAt = serverTimestamp();
        payload.createdBy = currentUserId || "unknown";
      }

      if (form.visibility === "published" && !editing.disclosedAt) {
        payload.disclosedAt = serverTimestamp();
      }

      await setDoc(doc(db, "developers", id), payload, { merge: true });

      await addDoc(collection(db, "developers", id, "auditLog"), {
        action: isNew ? "create" : "update",
        userId: currentUserId || "unknown",
        userEmail: currentUserEmail || "unknown",
        timestamp: serverTimestamp(),
        fieldsChanged: Object.keys(form),
      });

      notify(isNew ? "Developer created" : "Developer updated");
      setEditing(null);
    } catch (e) {
      console.error(e);
      notify("Save failed: " + e.message, "error");
    }
    setSaving(false);
  }

  async function archiveDev(dev) {
    if (!window.confirm("Archive " + dev.name + "?")) return;
    try {
      await setDoc(doc(db, "developers", dev.id), {
        visibility: "archived",
        updatedAt: serverTimestamp(),
        updatedBy: currentUserId || "unknown",
      }, { merge: true });

      await addDoc(collection(db, "developers", dev.id, "auditLog"), {
        action: "archive",
        userId: currentUserId || "unknown",
        userEmail: currentUserEmail || "unknown",
        timestamp: serverTimestamp(),
      });

      notify("Developer archived");
    } catch (e) {
      notify("Archive failed: " + e.message, "error");
    }

  function toggleSelection(id) { setSelectedIds(p => { const n = new Set(p); if (n.has(id)) n.delete(id); else n.add(id); return n; }); }
  function selectAll() { setSelectedIds(new Set(filtered.map(d => d.id))); }
  function clearSelection() { setSelectedIds(new Set()); }

  async function bulkArchive() {
    if (!window.confirm("Archive " + selectedIds.size + " developers?")) return;
    try {
      for (const id of selectedIds) {
        await setDoc(doc(db, "developers", id), { visibility: "archived", updatedAt: serverTimestamp(), updatedBy: currentUserId || "unknown" }, { merge: true });
        await addDoc(collection(db, "developers", id, "auditLog"), { action: "bulk-archive", userId: currentUserId || "unknown", userEmail: currentUserEmail || "unknown", timestamp: serverTimestamp() });
      }
      notify("Archived " + selectedIds.size + " developers"); setSelectedIds(new Set());
    } catch (e) { notify("Bulk archive failed: " + e.message, "error"); }
  }

  async function bulkChangeVisibility(newVis) {
    if (!window.confirm("Change " + selectedIds.size + " developers to " + newVis + "?")) return;
    try {
      for (const id of selectedIds) {
        const payload = { visibility: newVis, updatedAt: serverTimestamp(), updatedBy: currentUserId || "unknown" };
        if (newVis === "published") payload.disclosedAt = serverTimestamp();
        await setDoc(doc(db, "developers", id), payload, { merge: true });
        await addDoc(collection(db, "developers", id, "auditLog"), { action: "bulk-visibility-change", newVisibility: newVis, userId: currentUserId || "unknown", userEmail: currentUserEmail || "unknown", timestamp: serverTimestamp() });
      }
      notify("Changed " + selectedIds.size + " developers to " + newVis); setSelectedIds(new Set());
    } catch (e) { notify("Bulk change failed: " + e.message, "error"); }
  }

  function exportCsv() {
    const rows = filtered.map(d => ({
      id: d.id, name: d.name || "", arabicName: d.arabicName || "",
      reraLicenseNumber: d.reraLicenseNumber || "", founded: d.founded || "",
      headquarters: d.headquarters || "", website: d.website || "",
      tier: d.tier || "", visibility: d.visibility || "",
      onTimeRate: d.onTimeRate || 0, totalProjects: d.totalProjects || 0,
      completedProjects: d.completedProjects || 0, activeProjects: d.activeProjects || 0,
      reliabilityScore: d.reliabilityScore || 0, publiclyListed: d.publiclyListed || false,
      stockTicker: d.stockTicker || "", description: d.description || "",
    }));
    const csv = Papa.unparse(rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "developers-" + new Date().toISOString().slice(0,10) + ".csv"; a.click();
    URL.revokeObjectURL(url);
    notify("Exported " + rows.length + " developers");
  }

  function importCsv(file) {
    Papa.parse(file, {
      header: true, skipEmptyLines: true,
      complete: async (results) => {
        const rows = results.data;
        if (!rows.length) { notify("CSV is empty", "error"); return; }
        if (!window.confirm("Import " + rows.length + " developers?")) return;
        let created = 0, updated = 0, failed = 0;
        for (const r of rows) {
          try {
            const id = r.id || (r.name || "").toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-");
            const payload = {
              name: r.name || "", arabicName: r.arabicName || "",
              reraLicenseNumber: r.reraLicenseNumber || "", founded: parseInt(r.founded) || null,
              headquarters: r.headquarters || "", website: r.website || "",
              tier: r.tier || "tier-2", visibility: r.visibility || "draft",
              onTimeRate: parseInt(r.onTimeRate) || 0, totalProjects: parseInt(r.totalProjects) || 0,
              completedProjects: parseInt(r.completedProjects) || 0, activeProjects: parseInt(r.activeProjects) || 0,
              reliabilityScore: parseInt(r.reliabilityScore) || 0,
              publiclyListed: r.publiclyListed === "true" || r.publiclyListed === true,
              stockTicker: r.stockTicker || "", description: r.description || "",
              orgId: "dxb-analytics", updatedAt: serverTimestamp(), updatedBy: currentUserId || "unknown",
            };
            const isNew = !r.id;
            if (isNew) { payload.createdAt = serverTimestamp(); payload.createdBy = currentUserId || "unknown"; }
            await setDoc(doc(db, "developers", id), payload, { merge: true });
            await addDoc(collection(db, "developers", id, "auditLog"), { action: isNew ? "csv-import-create" : "csv-import-update", userId: currentUserId || "unknown", userEmail: currentUserEmail || "unknown", timestamp: serverTimestamp(), source: "csv-import" });
            if (isNew) created++; else updated++;
          } catch (e) { failed++; console.error(r, e); }
        }
        notify("Import: " + created + " created, " + updated + " updated" + (failed ? ", " + failed + " failed" : ""));
      },
      error: (e) => notify("CSV parse error: " + e.message, "error"),
    });
  }
  }

  if (loading) return <div style={{ padding: 40, color: C.t2 }}>Loading developers...</div>;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: C.w, fontFamily: "'Fraunces',serif", fontWeight: 600 }}>
          Developers
          <span style={{ fontSize: 12, color: C.t2, fontWeight: 400, marginLeft: 10 }}>
            {filtered.length} of {devs.length}
          </span>
        </h2>
        <button style={btnStyles("primary")} onClick={() => setEditing({})}>+ Add New Developer</button>
      </div>

      <div style={{ ...cardStyle, marginBottom: 16, padding: 14 }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 10 }}>
          <input type="text" placeholder="Search name or RERA license..." value={search} onChange={e => setSearch(e.target.value)} style={inputStyle} />
          <select value={fTier} onChange={e => setFTier(e.target.value)} style={inputStyle}>
            <option value="All">All Tiers</option>
            {TIERS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <select value={fVisibility} onChange={e => setFVisibility(e.target.value)} style={inputStyle}>
            <option value="All">All Visibility</option>
            {VISIBILITY.map(v => <option key={v} value={v}>{v}</option>)}
          </select>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={inputStyle}>
            <option value="name">Sort: Name</option>
            <option value="reliability">Sort: Reliability</option>
            <option value="onTime">Sort: On-Time Rate</option>
            <option value="projects">Sort: Total Projects</option>
          </select>
        </div>
      </div>

      <BulkToolbar
        selectedCount={selectedIds.size}
        totalCount={filtered.length}
        onSelectAll={selectAll}
        onClearSelection={clearSelection}
        onBulkArchive={bulkArchive}
        onBulkPublish={() => bulkChangeVisibility("published")}
        onBulkDraft={() => bulkChangeVisibility("draft")}
        onExportCsv={exportCsv}
        onImportCsv={importCsv}
        collectionName="developers"
      />

      <div style={{ display: "grid", gap: 10 }}>
        {filtered.length === 0 ? (
          <div style={{ ...cardStyle, textAlign: "center", padding: 40, color: C.t2 }}>
            {devs.length === 0 ? "No developers yet. Click + Add New Developer to create one." : "No results match your filters."}
          </div>
        ) : filtered.map(d => {
          const vColor = d.visibility === "published" ? C.green : d.visibility === "draft" ? C.amber : C.m;
          const tierColor = d.tier === "tier-1" ? C.gold : d.tier === "tier-2" ? C.teal : d.tier === "tier-3" ? C.blue : C.m;
          const reliability = d.reliabilityScore || 0;
          const relColor = reliability >= 85 ? C.green : reliability >= 70 ? C.amber : C.red;
          return (
            <div key={d.id} style={{ ...cardStyle, padding: 14, display: "flex", alignItems: "center", gap: 14, cursor: "pointer" }} onClick={() => setEditing(d)}>
              <input type="checkbox" checked={selectedIds.has(d.id)} onClick={e => e.stopPropagation()} onChange={() => toggleSelection(d.id)} style={{ cursor: "pointer", width: 16, height: 16, accentColor: "#D4A843" }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                  <span style={{ fontSize: 14, color: C.w, fontWeight: 600 }}>{d.name || "(unnamed)"}</span>
                  {d.tier && (
                    <span style={{ fontSize: 9, padding: "2px 8px", background: tierColor + "20", color: tierColor, borderRadius: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>{d.tier}</span>
                  )}
                  <span style={{ fontSize: 9, padding: "2px 8px", background: vColor + "20", color: vColor, borderRadius: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>{d.visibility || "draft"}</span>
                </div>
                <div style={{ fontSize: 11, color: C.t2, display: "flex", gap: 14 }}>
                  <span>RERA #{d.reraLicenseNumber || "-"}</span>
                  <span>· {d.totalProjects || 0} projects</span>
                  <span>· On-time: {d.onTimeRate || 0}%</span>
                  <span style={{ color: relColor }}>· Reliability: {reliability}</span>
                </div>
              </div>
              <div style={{ display: "flex", gap: 6 }} onClick={e => e.stopPropagation()}>
                <button style={{ ...btnStyles("ghost"), padding: "6px 12px" }} onClick={() => setEditing(d)}>Edit</button>
                {d.visibility !== "archived" && (
                  <button style={{ ...btnStyles("red"), padding: "6px 12px" }} onClick={() => archiveDev(d)}>Archive</button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {editing !== null && (
        <DevEditModal
          initial={editing}
          onClose={() => setEditing(null)}
          onSave={saveDev}
          saving={saving}
        />
      )}

      {toast && (
        <div style={{ position: "fixed", bottom: 20, right: 20, padding: "12px 20px", background: toast.type === "error" ? C.redD : C.greenD, border: "1px solid " + (toast.type === "error" ? C.red : C.green), borderRadius: 8, color: toast.type === "error" ? C.red : C.green, fontSize: 12, fontWeight: 600, zIndex: 10000 }}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}

function DevEditModal({ initial, onClose, onSave, saving }) {
  const [form, setForm] = useState({
    name: "", arabicName: "", reraLicenseNumber: "", founded: "",
    headquarters: "Dubai, UAE", website: "", logoUrl: "", description: "",
    tier: "tier-2", visibility: "draft",
    onTimeRate: 0, totalProjects: 0, completedProjects: 0, activeProjects: 0,
    reliabilityScore: 0, publiclyListed: false, stockTicker: "",
    ...initial,
  });

  function update(field, value) {
    setForm(f => ({ ...f, [field]: value }));
  }

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: 20 }} onClick={onClose}>
      <div style={{ background: C.s1, border: "1px solid " + C.borderG, borderRadius: 12, padding: 28, maxWidth: 800, width: "100%", maxHeight: "90vh", overflow: "auto" }} onClick={e => e.stopPropagation()}>
        <h3 style={{ margin: "0 0 20px 0", fontSize: 16, color: C.gold, fontFamily: "'Fraunces',serif" }}>
          {initial.id ? "Edit Developer" : "New Developer"}
        </h3>

        <div style={{ display: "grid", gap: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 10 }}>
            <div>
              <label style={{ display: "block", fontSize: 10, color: C.t2, marginBottom: 4, textTransform: "uppercase" }}>Name *</label>
              <input style={inputStyle} value={form.name} onChange={e => update("name", e.target.value)} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 10, color: C.t2, marginBottom: 4, textTransform: "uppercase" }}>RERA License #</label>
              <input style={inputStyle} value={form.reraLicenseNumber} onChange={e => update("reraLicenseNumber", e.target.value)} />
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: 10, color: C.t2, marginBottom: 4, textTransform: "uppercase" }}>Arabic Name</label>
            <input style={inputStyle} value={form.arabicName} onChange={e => update("arabicName", e.target.value)} />
          </div>

          <div>
            <label style={{ display: "block", fontSize: 10, color: C.t2, marginBottom: 4, textTransform: "uppercase" }}>Description</label>
            <textarea style={{ ...inputStyle, minHeight: 70, resize: "vertical" }} value={form.description} onChange={e => update("description", e.target.value)} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            <div>
              <label style={{ display: "block", fontSize: 10, color: C.t2, marginBottom: 4, textTransform: "uppercase" }}>Founded</label>
              <input style={inputStyle} type="number" value={form.founded} onChange={e => update("founded", parseInt(e.target.value) || "")} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 10, color: C.t2, marginBottom: 4, textTransform: "uppercase" }}>Tier</label>
              <select style={inputStyle} value={form.tier} onChange={e => update("tier", e.target.value)}>
                {TIERS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: 10, color: C.t2, marginBottom: 4, textTransform: "uppercase" }}>Visibility</label>
              <select style={inputStyle} value={form.visibility} onChange={e => update("visibility", e.target.value)}>
                {VISIBILITY.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: 10, color: C.t2, marginBottom: 4, textTransform: "uppercase" }}>Website</label>
            <input style={inputStyle} value={form.website} onChange={e => update("website", e.target.value)} placeholder="https://..." />
          </div>

          <div>
            <label style={{ display: "block", fontSize: 10, color: C.t2, marginBottom: 4, textTransform: "uppercase" }}>Logo URL</label>
            <input style={inputStyle} value={form.logoUrl} onChange={e => update("logoUrl", e.target.value)} placeholder="https://..." />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10 }}>
            <div>
              <label style={{ display: "block", fontSize: 10, color: C.t2, marginBottom: 4, textTransform: "uppercase" }}>On-Time %</label>
              <input style={inputStyle} type="number" min="0" max="100" value={form.onTimeRate} onChange={e => update("onTimeRate", parseInt(e.target.value) || 0)} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 10, color: C.t2, marginBottom: 4, textTransform: "uppercase" }}>Total Projects</label>
              <input style={inputStyle} type="number" min="0" value={form.totalProjects} onChange={e => update("totalProjects", parseInt(e.target.value) || 0)} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 10, color: C.t2, marginBottom: 4, textTransform: "uppercase" }}>Completed</label>
              <input style={inputStyle} type="number" min="0" value={form.completedProjects} onChange={e => update("completedProjects", parseInt(e.target.value) || 0)} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 10, color: C.t2, marginBottom: 4, textTransform: "uppercase" }}>Reliability 0-100</label>
              <input style={inputStyle} type="number" min="0" max="100" value={form.reliabilityScore} onChange={e => update("reliabilityScore", parseInt(e.target.value) || 0)} />
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 24, paddingTop: 20, borderTop: "1px solid " + C.border }}>
          <button style={btnStyles("ghost", saving)} onClick={onClose} disabled={saving}>Cancel</button>
          <button style={btnStyles("primary", saving)} onClick={() => onSave(form)} disabled={saving}>
            {saving ? "Saving..." : initial.id ? "Save Changes" : "Create Developer"}
          </button>
        </div>
      </div>
    </div>
  );
}
