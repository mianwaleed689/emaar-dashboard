import React, { useState, useEffect, useMemo } from "react";
import {
  collection, doc, setDoc, deleteDoc, onSnapshot,
  serverTimestamp, addDoc, query, where
} from "firebase/firestore";
import { db } from "../../firebase";
import { C, cardStyle, btnStyles, inputStyle } from "./tokens";
import DevelopmentEditModal from "./DevelopmentEditModal";
import BulkToolbar from "./BulkToolbar";
import Papa from "papaparse";

// Dubai communities - seed list, will be replaced by communities collection fetch later
const COMMUNITIES = [
  "Downtown Dubai", "Dubai Marina", "Business Bay", "Dubai Hills Estate",
  "Dubai Creek Harbour", "Emaar Beachfront", "Palm Jumeirah", "JVC",
  "JVT", "Arabian Ranches 3", "Emaar South", "The Valley", "The Oasis",
  "Expo City Dubai", "MBR City", "Meydan", "Dubai South", "Tilal Al Ghaf",
  "Al Furjan", "DAMAC Hills", "DAMAC Hills 2", "Dubailand", "Mina Rashid",
  "Town Square", "Mudon", "Bluewaters", "City Walk", "Al Barsha",
];

const SALE_STATUS = ["off-plan", "ready", "secondary", "sold-out", "coming-soon"];
const CONSTRUCTION_STATUS = ["pre-launch", "under-construction", "completed", "handover-ready"];
const TENURE = ["freehold", "leasehold", "usufruct", "musataha", "grant"];
const VISIBILITY = ["draft", "published", "archived"];
const DLD_CLASS = ["land", "unit", "villa"];

// Dubai bounds for coordinate validation
const DUBAI_BOUNDS = { minLat: 24.79, maxLat: 25.36, minLng: 54.89, maxLng: 55.57 };

function slugify(str) {
  return String(str || "")
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function DevelopmentsSection({ currentUserId, currentUserEmail }) {
  const [devs, setDevs] = useState([]);
  const [developers, setDevelopers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [fCommunity, setFCommunity] = useState("All");
  const [fStatus, setFStatus] = useState("All");
  const [fVisibility, setFVisibility] = useState("All");
  const [sortBy, setSortBy] = useState("updatedAt");
  const [editing, setEditing] = useState(null); // null | {} for new | {id, ...} for edit
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());

  useEffect(() => {
    const u1 = onSnapshot(collection(db, "developments"), snap => {
      const arr = [];
      snap.forEach(d => arr.push({ id: d.id, ...d.data() }));
      setDevs(arr);
      setLoading(false);
    }, err => { console.error(err); setLoading(false); });

    const u2 = onSnapshot(collection(db, "developers"), snap => {
      const arr = [];
      snap.forEach(d => arr.push({ id: d.id, ...d.data() }));
      setDevelopers(arr);
    }, err => console.error(err));

    return () => { u1(); u2(); };
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
        (d.community || "").toLowerCase().includes(s) ||
        (d.developerName || "").toLowerCase().includes(s)
      );
    }
    if (fCommunity !== "All") r = r.filter(d => d.community === fCommunity);
    if (fStatus !== "All") r = r.filter(d => d.saleStatus === fStatus);
    if (fVisibility !== "All") r = r.filter(d => d.visibility === fVisibility);

    if (sortBy === "name") r.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    else if (sortBy === "community") r.sort((a, b) => (a.community || "").localeCompare(b.community || ""));
    else if (sortBy === "updatedAt") r.sort((a, b) => {
      const at = a.updatedAt?.toMillis?.() || 0;
      const bt = b.updatedAt?.toMillis?.() || 0;
      return bt - at;
    });

    return r;
  }, [devs, search, fCommunity, fStatus, fVisibility, sortBy]);

  async function saveDev(form) {
    setSaving(true);
    try {
      // Validate
      if (!form.name || form.name.trim().length < 2) {
        notify("Name is required (min 2 chars)", "error");
        setSaving(false);
        return;
      }
      if (form.visibility === "published") {
        if (!form.reraProjectNumber) {
          notify("Published developments must have RERA project number", "error");
          setSaving(false);
          return;
        }
        if (!form.developerId) {
          notify("Published developments must have a developer", "error");
          setSaving(false);
          return;
        }
        if (!form.coordinates?.lat || !form.coordinates?.lng) {
          notify("Published developments must have coordinates", "error");
          setSaving(false);
          return;
        }
      }
      if (form.coordinates?.lat && form.coordinates?.lng) {
        const lat = Number(form.coordinates.lat);
        const lng = Number(form.coordinates.lng);
        if (lat < DUBAI_BOUNDS.minLat || lat > DUBAI_BOUNDS.maxLat ||
            lng < DUBAI_BOUNDS.minLng || lng > DUBAI_BOUNDS.maxLng) {
          notify("Coordinates must be within Dubai bounds", "error");
          setSaving(false);
          return;
        }
      }

      const isNew = !editing.id;
      const id = editing.id || slugify(form.name) + "-" + Date.now().toString(36);

      // Denormalize developer name for display
      const dev = developers.find(d => d.id === form.developerId);
      const developerName = dev?.name || form.developerName || "";

      const payload = {
        ...form,
        slug: editing.id ? form.slug : slugify(form.name),
        developerName,
        orgId: form.orgId || "dxb-analytics",
        updatedAt: serverTimestamp(),
        updatedBy: currentUserId || "unknown",
      };

      if (isNew) {
        payload.createdAt = serverTimestamp();
        payload.createdBy = currentUserId || "unknown";
      }

      // Set disclosedAt if first time publishing
      if (form.visibility === "published" && !editing.disclosedAt) {
        payload.disclosedAt = serverTimestamp();
      }

      await setDoc(doc(db, "developments", id), payload, { merge: true });

      // Audit log entry
      await addDoc(collection(db, "developments", id, "auditLog"), {
        action: isNew ? "create" : "update",
        userId: currentUserId || "unknown",
        userEmail: currentUserEmail || "unknown",
        timestamp: serverTimestamp(),
        fieldsChanged: Object.keys(form),
      });

      notify(isNew ? "Development created" : "Development updated");
      setEditing(null);
    } catch (e) {
      console.error(e);
      notify("Save failed: " + e.message, "error");
    }
    setSaving(false);
  }

  async function archiveDev(dev) {
    if (!window.confirm(`Archive "${dev.name}"? This can be undone later.`)) return;
    try {
      await setDoc(doc(db, "developments", dev.id), {
        visibility: "archived",
        updatedAt: serverTimestamp(),
        updatedBy: currentUserId || "unknown",
      }, { merge: true });

      await addDoc(collection(db, "developments", dev.id, "auditLog"), {
        action: "archive",
        userId: currentUserId || "unknown",
        userEmail: currentUserEmail || "unknown",
        timestamp: serverTimestamp(),
      });

      notify("Development archived");
    } catch (e) {
      notify("Archive failed: " + e.message, "error");
    }

  }
  // === BULK OPERATIONS ===
  function toggleSelection(id) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }
  function selectAll() {
    setSelectedIds(new Set(filtered.map(d => d.id)));
  }
  function clearSelection() {
    setSelectedIds(new Set());
  }

  async function bulkArchive() {
    if (!window.confirm("Archive " + selectedIds.size + " developments?")) return;
    try {
      for (const id of selectedIds) {
        await setDoc(doc(db, "developments", id), {
          visibility: "archived",
          updatedAt: serverTimestamp(),
          updatedBy: currentUserId || "unknown",
        }, { merge: true });
        await addDoc(collection(db, "developments", id, "auditLog"), {
          action: "bulk-archive",
          userId: currentUserId || "unknown",
          userEmail: currentUserEmail || "unknown",
          timestamp: serverTimestamp(),
        });
      }
      notify("Archived " + selectedIds.size + " developments");
      setSelectedIds(new Set());
    } catch (e) {
      notify("Bulk archive failed: " + e.message, "error");
    }
  }

  async function bulkChangeVisibility(newVis) {
    if (!window.confirm("Change " + selectedIds.size + " developments to " + newVis + "?")) return;
    try {
      for (const id of selectedIds) {
        const payload = {
          visibility: newVis,
          updatedAt: serverTimestamp(),
          updatedBy: currentUserId || "unknown",
        };
        if (newVis === "published") payload.disclosedAt = serverTimestamp();
        await setDoc(doc(db, "developments", id), payload, { merge: true });
        await addDoc(collection(db, "developments", id, "auditLog"), {
          action: "bulk-visibility-change",
          newVisibility: newVis,
          userId: currentUserId || "unknown",
          userEmail: currentUserEmail || "unknown",
          timestamp: serverTimestamp(),
        });
      }
      notify("Changed " + selectedIds.size + " developments to " + newVis);
      setSelectedIds(new Set());
    } catch (e) {
      notify("Bulk change failed: " + e.message, "error");
    }
  }

  function exportCsv() {
    const rows = filtered.map(d => ({
      id: d.id,
      name: d.name || "",
      arabicName: d.arabicName || "",
      developerId: d.developerId || "",
      developerName: d.developerName || "",
      community: d.community || "",
      subCommunity: d.subCommunity || "",
      saleStatus: d.saleStatus || "",
      constructionStatus: d.constructionStatus || "",
      constructionPct: d.constructionPct || 0,
      visibility: d.visibility || "",
      tenure: d.tenure || "",
      latitude: d.coordinates?.lat || "",
      longitude: d.coordinates?.lng || "",
      reraProjectNumber: d.reraProjectNumber || "",
      escrowBank: d.escrowBank || "",
      escrowFundedPct: d.escrowFundedPct || 0,
      dldStarRating: d.dldStarRating || 0,
      launchDate: d.launchDate || "",
      expectedHandover: d.expectedHandover || "",
      coverImageUrl: d.coverImageUrl || "",
    }));
    const csv = Papa.unparse(rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "developments-" + new Date().toISOString().slice(0,10) + ".csv";
    a.click();
    URL.revokeObjectURL(url);
    notify("Exported " + rows.length + " developments");
  }

  function importCsv(file) {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const rows = results.data;
        if (!rows.length) { notify("CSV is empty", "error"); return; }
        if (!window.confirm("Import " + rows.length + " developments? Rows with matching IDs will be updated, others created as drafts.")) return;
        try {
          let created = 0, updated = 0, failed = 0;
          for (const r of rows) {
            try {
              const id = r.id || ((r.name || "").toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-") + "-" + Date.now().toString(36));
              const payload = {
                name: r.name || "",
                arabicName: r.arabicName || "",
                developerId: r.developerId || "",
                developerName: r.developerName || "",
                community: r.community || "",
                subCommunity: r.subCommunity || "",
                saleStatus: r.saleStatus || "off-plan",
                constructionStatus: r.constructionStatus || "pre-launch",
                constructionPct: parseInt(r.constructionPct) || 0,
                visibility: r.visibility || "draft",
                tenure: r.tenure || "freehold",
                coordinates: {
                  lat: parseFloat(r.latitude) || null,
                  lng: parseFloat(r.longitude) || null,
                },
                reraProjectNumber: r.reraProjectNumber || "",
                escrowBank: r.escrowBank || "",
                escrowFundedPct: parseInt(r.escrowFundedPct) || 0,
                dldStarRating: parseInt(r.dldStarRating) || 0,
                launchDate: r.launchDate || "",
                expectedHandover: r.expectedHandover || "",
                coverImageUrl: r.coverImageUrl || "",
                orgId: "dxb-analytics",
                updatedAt: serverTimestamp(),
                updatedBy: currentUserId || "unknown",
              };
              const isNew = !r.id;
              if (isNew) { payload.createdAt = serverTimestamp(); payload.createdBy = currentUserId || "unknown"; }
              await setDoc(doc(db, "developments", id), payload, { merge: true });
              await addDoc(collection(db, "developments", id, "auditLog"), {
                action: isNew ? "csv-import-create" : "csv-import-update",
                userId: currentUserId || "unknown",
                userEmail: currentUserEmail || "unknown",
                timestamp: serverTimestamp(),
                source: "csv-import",
              });
              if (isNew) created++; else updated++;
            } catch (e) {
              failed++;
              console.error("Row failed:", r, e);
            }
          }
          notify("Import complete: " + created + " created, " + updated + " updated" + (failed > 0 ? ", " + failed + " failed" : ""));
        } catch (e) {
          notify("Import failed: " + e.message, "error");
        }
      },
      error: (e) => notify("CSV parse error: " + e.message, "error"),
    });
  }
  }

  if (loading) {
    return <div style={{ padding: 40, color: C.t2 }}>Loading developments...</div>;
  }

  return (
    <div>
      {/* Header + Add button */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: C.w, fontFamily: "'Fraunces',serif", fontWeight: 600 }}>
          Developments
          <span style={{ fontSize: 12, color: C.t2, fontWeight: 400, marginLeft: 10 }}>
            {filtered.length} of {devs.length}
          </span>
        </h2>
        <button style={btnStyles("primary")} onClick={() => setEditing({})}>
          + Add New Development
        </button>
      </div>

      {/* Filters */}
      <div style={{ ...cardStyle, marginBottom: 16, padding: 14 }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr", gap: 10 }}>
          <input
            type="text"
            placeholder="Search name, community, developer..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={inputStyle}
          />
          <select value={fCommunity} onChange={e => setFCommunity(e.target.value)} style={inputStyle}>
            <option value="All">All Communities</option>
            {COMMUNITIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={fStatus} onChange={e => setFStatus(e.target.value)} style={inputStyle}>
            <option value="All">All Status</option>
            {SALE_STATUS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={fVisibility} onChange={e => setFVisibility(e.target.value)} style={inputStyle}>
            <option value="All">All Visibility</option>
            {VISIBILITY.map(v => <option key={v} value={v}>{v}</option>)}
          </select>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={inputStyle}>
            <option value="updatedAt">Sort: Recent</option>
            <option value="name">Sort: Name</option>
            <option value="community">Sort: Community</option>
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
        collectionName="developments"
      />

      {/* List */}
      <div style={{ display: "grid", gap: 10 }}>
        {filtered.length === 0 ? (
          <div style={{ ...cardStyle, textAlign: "center", padding: 40, color: C.t2 }}>
            {devs.length === 0 ? "No developments yet. Click + Add New Development to create one." : "No results match your filters."}
          </div>
        ) : filtered.map(d => {
          const vColor = d.visibility === "published" ? C.green : d.visibility === "draft" ? C.amber : C.m;
          return (
            <div key={d.id} style={{
              ...cardStyle,
              padding: 14,
              display: "flex",
              alignItems: "center",
              gap: 14,
              cursor: "pointer",
            }} onClick={() => setEditing(d)}>
              <input
                type="checkbox"
                checked={selectedIds.has(d.id)}
                onClick={e => e.stopPropagation()}
                onChange={() => toggleSelection(d.id)}
                style={{ cursor: "pointer", width: 16, height: 16, accentColor: "#D4A843" }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                  <span style={{ fontSize: 14, color: C.w, fontWeight: 600 }}>{d.name || "(unnamed)"}</span>
                  <span style={{
                    fontSize: 9,
                    padding: "2px 8px",
                    background: vColor + "20",
                    color: vColor,
                    borderRadius: 4,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                  }}>{d.visibility || "draft"}</span>
                </div>
                <div style={{ fontSize: 11, color: C.t2 }}>
                  {d.community || "no community"} · {d.developerName || "no developer"} · {d.saleStatus || "no status"}
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

      {/* Edit/Add modal */}
      {editing !== null && (
        <DevelopmentEditModal
          initial={editing}
          developers={developers}
          onClose={() => setEditing(null)}
          onSave={saveDev}
          saving={saving}
        />
      )}

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed",
          bottom: 20,
          right: 20,
          padding: "12px 20px",
          background: toast.type === "error" ? C.redD : C.greenD,
          border: `1px solid ${toast.type === "error" ? C.red : C.green}`,
          borderRadius: 8,
          color: toast.type === "error" ? C.red : C.green,
          fontSize: 12,
          fontWeight: 600,
          zIndex: 10000,
        }}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}

