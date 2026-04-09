import React, { useState, useEffect, useMemo } from "react";
import {
  collection, doc, setDoc, onSnapshot, serverTimestamp, addDoc
} from "firebase/firestore";
import { db } from "../../firebase";
import { C, cardStyle, btnStyles, inputStyle } from "./tokens";
import BulkToolbar from "./BulkToolbar";
import Papa from "papaparse";

const AREAS = [
  "Downtown", "Business Bay", "New Dubai", "Old Dubai", "Marina", "Dubai South",
  "Dubailand", "MBR City", "Bur Dubai", "Deira", "Dubai Harbour", "DIP", "JLT",
  "Expo City", "Waterfront", "CBD", "Suburban",
];

const TYPES = [
  "Master Community", "Waterfront", "Beachfront", "Golf", "Family Villas",
  "High-rise Towers", "Mid-rise Mixed", "Luxury Villas", "Affordable",
  "Commercial District", "Mixed-Use", "Ultra-Luxury",
];

const VISIBILITY = ["draft", "published", "archived"];

function slugify(str) {
  return String(str || "").toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}

function formatAed(n) {
  if (!n || isNaN(n)) return "-";
  if (n >= 1e6) return (n / 1e6).toFixed(2) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(0) + "K";
  return String(n);
}

export default function CommunitiesSection({ currentUserId, currentUserEmail }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [fArea, setFArea] = useState("All");
  const [fType, setFType] = useState("All");
  const [fVisibility, setFVisibility] = useState("All");
  const [sortBy, setSortBy] = useState("name");
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());

  useEffect(() => {
    const u = onSnapshot(collection(db, "communityData"), snap => {
      const arr = [];
      snap.forEach(d => arr.push({ id: d.id, ...d.data() }));
      setItems(arr);
      setLoading(false);
    }, err => { console.error(err); setLoading(false); });
    return () => u();
  }, []);

  function notify(msg, type = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }

  const filtered = useMemo(() => {
    let r = [...items];
    if (search) {
      const s = search.toLowerCase();
      r = r.filter(c =>
        (c.name || "").toLowerCase().includes(s) ||
        (c.area || "").toLowerCase().includes(s)
      );
    }
    if (fArea !== "All") r = r.filter(c => c.area === fArea);
    if (fType !== "All") r = r.filter(c => c.type === fType);
    if (fVisibility !== "All") r = r.filter(c => c.visibility === fVisibility);

    if (sortBy === "name") r.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    else if (sortBy === "ppsf") r.sort((a, b) => (b.avgPpsf || 0) - (a.avgPpsf || 0));
    else if (sortBy === "yield") r.sort((a, b) => (b.grossYieldPct || 0) - (a.grossYieldPct || 0));
    else if (sortBy === "projects") r.sort((a, b) => (b.totalProjects || 0) - (a.totalProjects || 0));

    return r;
  }, [items, search, fArea, fType, fVisibility, sortBy]);

  async function save(form) {
    setSaving(true);
    try {
      if (!form.name || form.name.trim().length < 2) {
        notify("Name is required", "error");
        setSaving(false);
        return;
      }

      const isNew = !editing.id;
      const id = editing.id || slugify(form.name);

      const payload = {
        ...form,
        slug: id,
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

      await setDoc(doc(db, "communityData", id), payload, { merge: true });
      await addDoc(collection(db, "communityData", id, "auditLog"), {
        action: isNew ? "create" : "update",
        userId: currentUserId || "unknown",
        userEmail: currentUserEmail || "unknown",
        timestamp: serverTimestamp(),
        fieldsChanged: Object.keys(form),
      });

      notify(isNew ? "Community created" : "Community updated");
      setEditing(null);
    } catch (e) {
      console.error(e);
      notify("Save failed: " + e.message, "error");
    }
    setSaving(false);
  }

  async function archive(item) {
    if (!window.confirm("Archive " + item.name + "?")) return;
    try {
      await setDoc(doc(db, "communityData", item.id), {
        visibility: "archived",
        updatedAt: serverTimestamp(),
        updatedBy: currentUserId || "unknown",
      }, { merge: true });
      await addDoc(collection(db, "communityData", item.id, "auditLog"), {
        action: "archive",
        userId: currentUserId || "unknown",
        timestamp: serverTimestamp(),
      });
      notify("Community archived");
    } catch (e) {
      notify("Archive failed: " + e.message, "error");
    }
  }

  function toggleSelection(id) { setSelectedIds(p => { const n = new Set(p); if (n.has(id)) n.delete(id); else n.add(id); return n; }); }
  function selectAll() { setSelectedIds(new Set(filtered.map(c => c.id))); }
  function clearSelection() { setSelectedIds(new Set()); }

  async function bulkArchive() {
    if (!window.confirm("Archive " + selectedIds.size + " communities?")) return;
    try {
      for (const id of selectedIds) {
        await setDoc(doc(db, "communityData", id), { visibility: "archived", updatedAt: serverTimestamp(), updatedBy: currentUserId || "unknown" }, { merge: true });
        await addDoc(collection(db, "communityData", id, "auditLog"), { action: "bulk-archive", userId: currentUserId || "unknown", timestamp: serverTimestamp() });
      }
      notify("Archived " + selectedIds.size + " communities"); setSelectedIds(new Set());
    } catch (e) { notify("Bulk archive failed: " + e.message, "error"); }
  }

  async function bulkChangeVisibility(newVis) {
    if (!window.confirm("Change " + selectedIds.size + " communities to " + newVis + "?")) return;
    try {
      for (const id of selectedIds) {
        const payload = { visibility: newVis, updatedAt: serverTimestamp(), updatedBy: currentUserId || "unknown" };
        if (newVis === "published") payload.disclosedAt = serverTimestamp();
        await setDoc(doc(db, "communityData", id), payload, { merge: true });
        await addDoc(collection(db, "communityData", id, "auditLog"), { action: "bulk-visibility-change", newVisibility: newVis, userId: currentUserId || "unknown", timestamp: serverTimestamp() });
      }
      notify("Changed " + selectedIds.size + " communities to " + newVis); setSelectedIds(new Set());
    } catch (e) { notify("Bulk change failed: " + e.message, "error"); }
  }

  function exportCsv() {
    const rows = filtered.map(c => ({
      id: c.id, name: c.name || "", arabicName: c.arabicName || "",
      area: c.area || "", type: c.type || "", visibility: c.visibility || "",
      latitude: c.coordinates?.lat || "", longitude: c.coordinates?.lng || "",
      totalProjects: c.totalProjects || 0, developersActive: c.developersActive || 0,
      avgPpsf: c.avgPpsf || 0, avgRentPerSqftYr: c.avgRentPerSqftYr || 0,
      grossYieldPct: c.grossYieldPct || 0, netYieldPct: c.netYieldPct || 0,
      metroDistanceKm: c.metroDistanceKm || 0, nearestMetroStation: c.nearestMetroStation || "",
      beachAccess: c.beachAccess || false, golfAccess: c.golfAccess || false, parkAccess: c.parkAccess || false,
      schoolRating: c.schoolRating || 0, restaurantCount: c.restaurantCount || 0, populationEstimate: c.populationEstimate || 0,
    }));
    const csv = Papa.unparse(rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "communities-" + new Date().toISOString().slice(0,10) + ".csv"; a.click();
    URL.revokeObjectURL(url);
    notify("Exported " + rows.length + " communities");
  }

  function importCsv(file) {
    Papa.parse(file, {
      header: true, skipEmptyLines: true,
      complete: async (results) => {
        const rows = results.data;
        if (!rows.length) { notify("CSV is empty", "error"); return; }
        if (!window.confirm("Import " + rows.length + " communities?")) return;
        let created = 0, updated = 0, failed = 0;
        for (const r of rows) {
          try {
            const id = r.id || (r.name || "").toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-");
            const payload = {
              name: r.name || "", arabicName: r.arabicName || "",
              area: r.area || "", type: r.type || "Master Community",
              visibility: r.visibility || "draft",
              coordinates: { lat: parseFloat(r.latitude) || null, lng: parseFloat(r.longitude) || null },
              totalProjects: parseInt(r.totalProjects) || 0, developersActive: parseInt(r.developersActive) || 0,
              avgPpsf: parseFloat(r.avgPpsf) || 0, avgRentPerSqftYr: parseFloat(r.avgRentPerSqftYr) || 0,
              grossYieldPct: parseFloat(r.grossYieldPct) || 0, netYieldPct: parseFloat(r.netYieldPct) || 0,
              metroDistanceKm: parseFloat(r.metroDistanceKm) || 0, nearestMetroStation: r.nearestMetroStation || "",
              beachAccess: r.beachAccess === "true" || r.beachAccess === true,
              golfAccess: r.golfAccess === "true" || r.golfAccess === true,
              parkAccess: r.parkAccess === "true" || r.parkAccess === true,
              schoolRating: parseFloat(r.schoolRating) || 0,
              restaurantCount: parseInt(r.restaurantCount) || 0,
              populationEstimate: parseInt(r.populationEstimate) || 0,
              orgId: "dxb-analytics", updatedAt: serverTimestamp(), updatedBy: currentUserId || "unknown",
            };
            const isNew = !r.id;
            if (isNew) { payload.createdAt = serverTimestamp(); payload.createdBy = currentUserId || "unknown"; }
            await setDoc(doc(db, "communityData", id), payload, { merge: true });
            await addDoc(collection(db, "communityData", id, "auditLog"), { action: isNew ? "csv-import-create" : "csv-import-update", userId: currentUserId || "unknown", timestamp: serverTimestamp(), source: "csv-import" });
            if (isNew) created++; else updated++;
          } catch (e) { failed++; console.error(r, e); }
        }
        notify("Import: " + created + " created, " + updated + " updated" + (failed ? ", " + failed + " failed" : ""));
      },
      error: (e) => notify("CSV parse error: " + e.message, "error"),
    });
  }
  }

  if (loading) return <div style={{ padding: 40, color: C.t2 }}>Loading communities...</div>;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: C.w, fontFamily: "'Fraunces',serif", fontWeight: 600 }}>
          Communities
          <span style={{ fontSize: 12, color: C.t2, fontWeight: 400, marginLeft: 10 }}>
            {filtered.length} of {items.length}
          </span>
        </h2>
        <button style={btnStyles("primary")} onClick={() => setEditing({})}>+ Add New Community</button>
      </div>

      <div style={{ ...cardStyle, marginBottom: 16, padding: 14 }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr", gap: 10 }}>
          <input type="text" placeholder="Search name or area..." value={search} onChange={e => setSearch(e.target.value)} style={inputStyle} />
          <select value={fArea} onChange={e => setFArea(e.target.value)} style={inputStyle}>
            <option value="All">All Areas</option>
            {AREAS.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          <select value={fType} onChange={e => setFType(e.target.value)} style={inputStyle}>
            <option value="All">All Types</option>
            {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <select value={fVisibility} onChange={e => setFVisibility(e.target.value)} style={inputStyle}>
            <option value="All">All Visibility</option>
            {VISIBILITY.map(v => <option key={v} value={v}>{v}</option>)}
          </select>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={inputStyle}>
            <option value="name">Sort: Name</option>
            <option value="ppsf">Sort: Price/sqft</option>
            <option value="yield">Sort: Yield</option>
            <option value="projects">Sort: Projects</option>
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
        collectionName="communities"
      />

      <div style={{ display: "grid", gap: 10 }}>
        {filtered.length === 0 ? (
          <div style={{ ...cardStyle, textAlign: "center", padding: 40, color: C.t2 }}>
            {items.length === 0 ? "No communities yet. Click + Add New Community to create one." : "No results match your filters."}
          </div>
        ) : filtered.map(c => {
          const vColor = c.visibility === "published" ? C.green : c.visibility === "draft" ? C.amber : C.m;
          return (
            <div key={c.id} style={{ ...cardStyle, padding: 14, display: "flex", alignItems: "center", gap: 14, cursor: "pointer" }} onClick={() => setEditing(c)}>
              <input type="checkbox" checked={selectedIds.has(c.id)} onClick={e => e.stopPropagation()} onChange={() => toggleSelection(c.id)} style={{ cursor: "pointer", width: 16, height: 16, accentColor: "#D4A843" }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                  <span style={{ fontSize: 14, color: C.w, fontWeight: 600 }}>{c.name || "(unnamed)"}</span>
                  {c.type && <span style={{ fontSize: 9, padding: "2px 8px", background: C.tealD, color: C.teal, borderRadius: 4 }}>{c.type}</span>}
                  <span style={{ fontSize: 9, padding: "2px 8px", background: vColor + "20", color: vColor, borderRadius: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>{c.visibility || "draft"}</span>
                </div>
                <div style={{ fontSize: 11, color: C.t2, display: "flex", gap: 14, flexWrap: "wrap" }}>
                  <span>{c.area || "no area"}</span>
                  <span>· {c.totalProjects || 0} projects</span>
                  {c.avgPpsf > 0 && <span>· AED {formatAed(c.avgPpsf)}/sqft</span>}
                  {c.grossYieldPct > 0 && <span>· {c.grossYieldPct}% yield</span>}
                  {c.metroDistanceKm != null && <span>· {c.metroDistanceKm}km to metro</span>}
                </div>
              </div>
              <div style={{ display: "flex", gap: 6 }} onClick={e => e.stopPropagation()}>
                <button style={{ ...btnStyles("ghost"), padding: "6px 12px" }} onClick={() => setEditing(c)}>Edit</button>
                {c.visibility !== "archived" && (
                  <button style={{ ...btnStyles("red"), padding: "6px 12px" }} onClick={() => archive(c)}>Archive</button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {editing !== null && (
        <CommEditModal
          initial={editing}
          onClose={() => setEditing(null)}
          onSave={save}
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

function CommEditModal({ initial, onClose, onSave, saving }) {
  const [form, setForm] = useState({
    name: "", arabicName: "", area: "", type: "Master Community",
    visibility: "draft",
    description: "",
    coordinates: { lat: "", lng: "" },
    totalProjects: 0, developersActive: 0,
    avgPpsf: 0, avgRentPerSqftYr: 0,
    grossYieldPct: 0, netYieldPct: 0,
    metroDistanceKm: 0, nearestMetroStation: "",
    beachAccess: false, golfAccess: false, parkAccess: false,
    schoolRating: 0, restaurantCount: 0,
    populationEstimate: 0,
    coverImageUrl: "",
    ...initial,
  });

  function update(field, value) { setForm(f => ({ ...f, [field]: value })); }
  function updateCoord(key, value) { setForm(f => ({ ...f, coordinates: { ...f.coordinates, [key]: value } })); }

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: 20 }} onClick={onClose}>
      <div style={{ background: C.s1, border: "1px solid " + C.borderG, borderRadius: 12, padding: 28, maxWidth: 850, width: "100%", maxHeight: "90vh", overflow: "auto" }} onClick={e => e.stopPropagation()}>
        <h3 style={{ margin: "0 0 20px 0", fontSize: 16, color: C.gold, fontFamily: "'Fraunces',serif" }}>
          {initial.id ? "Edit Community" : "New Community"}
        </h3>

        <div style={{ display: "grid", gap: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 10 }}>
            <div>
              <label style={{ display: "block", fontSize: 10, color: C.t2, marginBottom: 4, textTransform: "uppercase" }}>Name *</label>
              <input style={inputStyle} value={form.name} onChange={e => update("name", e.target.value)} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 10, color: C.t2, marginBottom: 4, textTransform: "uppercase" }}>Arabic Name</label>
              <input style={inputStyle} value={form.arabicName} onChange={e => update("arabicName", e.target.value)} />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            <div>
              <label style={{ display: "block", fontSize: 10, color: C.t2, marginBottom: 4, textTransform: "uppercase" }}>Area</label>
              <select style={inputStyle} value={form.area} onChange={e => update("area", e.target.value)}>
                <option value="">-- Select area --</option>
                {AREAS.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: 10, color: C.t2, marginBottom: 4, textTransform: "uppercase" }}>Type</label>
              <select style={inputStyle} value={form.type} onChange={e => update("type", e.target.value)}>
                {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
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
            <label style={{ display: "block", fontSize: 10, color: C.t2, marginBottom: 4, textTransform: "uppercase" }}>Description</label>
            <textarea style={{ ...inputStyle, minHeight: 60, resize: "vertical" }} value={form.description} onChange={e => update("description", e.target.value)} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <label style={{ display: "block", fontSize: 10, color: C.t2, marginBottom: 4, textTransform: "uppercase" }}>Latitude</label>
              <input style={inputStyle} type="number" step="0.0001" value={form.coordinates?.lat || ""} onChange={e => updateCoord("lat", parseFloat(e.target.value) || "")} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 10, color: C.t2, marginBottom: 4, textTransform: "uppercase" }}>Longitude</label>
              <input style={inputStyle} type="number" step="0.0001" value={form.coordinates?.lng || ""} onChange={e => updateCoord("lng", parseFloat(e.target.value) || "")} />
            </div>
          </div>

          {/* Market stats */}
          <div style={{ padding: 14, background: C.s2, borderRadius: 8 }}>
            <div style={{ fontSize: 11, color: C.gold, fontWeight: 600, marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.5 }}>Market Stats</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10 }}>
              <div>
                <label style={{ display: "block", fontSize: 10, color: C.t2, marginBottom: 4 }}>Avg Price/sqft AED</label>
                <input style={inputStyle} type="number" min="0" value={form.avgPpsf} onChange={e => update("avgPpsf", parseFloat(e.target.value) || 0)} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 10, color: C.t2, marginBottom: 4 }}>Rent/sqft/yr AED</label>
                <input style={inputStyle} type="number" min="0" value={form.avgRentPerSqftYr} onChange={e => update("avgRentPerSqftYr", parseFloat(e.target.value) || 0)} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 10, color: C.t2, marginBottom: 4 }}>Gross Yield %</label>
                <input style={inputStyle} type="number" step="0.1" min="0" max="30" value={form.grossYieldPct} onChange={e => update("grossYieldPct", parseFloat(e.target.value) || 0)} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 10, color: C.t2, marginBottom: 4 }}>Net Yield %</label>
                <input style={inputStyle} type="number" step="0.1" min="0" max="30" value={form.netYieldPct} onChange={e => update("netYieldPct", parseFloat(e.target.value) || 0)} />
              </div>
            </div>
          </div>

          {/* Counts */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10 }}>
            <div>
              <label style={{ display: "block", fontSize: 10, color: C.t2, marginBottom: 4, textTransform: "uppercase" }}>Total Projects</label>
              <input style={inputStyle} type="number" min="0" value={form.totalProjects} onChange={e => update("totalProjects", parseInt(e.target.value) || 0)} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 10, color: C.t2, marginBottom: 4, textTransform: "uppercase" }}>Active Developers</label>
              <input style={inputStyle} type="number" min="0" value={form.developersActive} onChange={e => update("developersActive", parseInt(e.target.value) || 0)} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 10, color: C.t2, marginBottom: 4, textTransform: "uppercase" }}>Population Est</label>
              <input style={inputStyle} type="number" min="0" value={form.populationEstimate} onChange={e => update("populationEstimate", parseInt(e.target.value) || 0)} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 10, color: C.t2, marginBottom: 4, textTransform: "uppercase" }}>Restaurants</label>
              <input style={inputStyle} type="number" min="0" value={form.restaurantCount} onChange={e => update("restaurantCount", parseInt(e.target.value) || 0)} />
            </div>
          </div>

          {/* Transit & amenities */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr 1fr", gap: 10 }}>
            <div>
              <label style={{ display: "block", fontSize: 10, color: C.t2, marginBottom: 4, textTransform: "uppercase" }}>Metro Dist (km)</label>
              <input style={inputStyle} type="number" step="0.1" min="0" value={form.metroDistanceKm} onChange={e => update("metroDistanceKm", parseFloat(e.target.value) || 0)} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 10, color: C.t2, marginBottom: 4, textTransform: "uppercase" }}>Nearest Metro Station</label>
              <input style={inputStyle} value={form.nearestMetroStation} onChange={e => update("nearestMetroStation", e.target.value)} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 10, color: C.t2, marginBottom: 4, textTransform: "uppercase" }}>School Rating 0-10</label>
              <input style={inputStyle} type="number" step="0.1" min="0" max="10" value={form.schoolRating} onChange={e => update("schoolRating", parseFloat(e.target.value) || 0)} />
            </div>
          </div>

          <div style={{ display: "flex", gap: 20 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: C.t2 }}>
              <input type="checkbox" checked={!!form.beachAccess} onChange={e => update("beachAccess", e.target.checked)} /> Beach Access
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: C.t2 }}>
              <input type="checkbox" checked={!!form.golfAccess} onChange={e => update("golfAccess", e.target.checked)} /> Golf Access
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: C.t2 }}>
              <input type="checkbox" checked={!!form.parkAccess} onChange={e => update("parkAccess", e.target.checked)} /> Park Access
            </label>
          </div>

          <div>
            <label style={{ display: "block", fontSize: 10, color: C.t2, marginBottom: 4, textTransform: "uppercase" }}>Cover Image URL</label>
            <input style={inputStyle} value={form.coverImageUrl} onChange={e => update("coverImageUrl", e.target.value)} placeholder="https://..." />
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 24, paddingTop: 20, borderTop: "1px solid " + C.border }}>
          <button style={btnStyles("ghost", saving)} onClick={onClose} disabled={saving}>Cancel</button>
          <button style={btnStyles("primary", saving)} onClick={() => onSave(form)} disabled={saving}>
            {saving ? "Saving..." : initial.id ? "Save Changes" : "Create Community"}
          </button>
        </div>
      </div>
    </div>
  );
}
