import React, { useState, useEffect, useMemo } from "react";
import {
  collection, doc, setDoc, onSnapshot, serverTimestamp, addDoc
} from "firebase/firestore";
import { db } from "../../firebase";
import { C, cardStyle, btnStyles, inputStyle } from "./tokens";
import BulkToolbar from "./BulkToolbar";
import Papa from "papaparse";

const PROPERTY_TYPES = [
  "Studio Apartment", "1BR Apartment", "2BR Apartment", "3BR Apartment", "4BR Apartment", "5BR+ Apartment",
  "Duplex Apartment", "Loft Apartment", "Penthouse", "Hotel Apartment",
  "Townhouse", "Semi-Detached Villa", "Detached Villa", "Compound Villa", "Mansion",
  "Office Unit", "Retail Shop", "Warehouse", "Land Plot",
];

const CATEGORIES = ["residential", "commercial", "industrial", "land", "specialty"];
const VISIBILITY = ["draft", "published", "archived"];
const FURNISH = ["unfurnished", "semi-furnished", "fully-furnished"];

function slugify(str) {
  return String(str || "")
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function formatAed(n) {
  if (!n || isNaN(n)) return "-";
  if (n >= 1e9) return "AED " + (n / 1e9).toFixed(2) + "B";
  if (n >= 1e6) return "AED " + (n / 1e6).toFixed(2) + "M";
  if (n >= 1e3) return "AED " + (n / 1e3).toFixed(0) + "K";
  return "AED " + n;
}

export default function ProjectsSection({ currentUserId, currentUserEmail }) {
  const [projects, setProjects] = useState([]);
  const [developments, setDevelopments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [fDev, setFDev] = useState("All");
  const [fType, setFType] = useState("All");
  const [fVisibility, setFVisibility] = useState("All");
  const [sortBy, setSortBy] = useState("updatedAt");
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());

  useEffect(() => {
    const u1 = onSnapshot(collection(db, "projects"), snap => {
      const arr = [];
      snap.forEach(d => arr.push({ id: d.id, ...d.data() }));
      setProjects(arr);
      setLoading(false);
    }, err => { console.error(err); setLoading(false); });

    const u2 = onSnapshot(collection(db, "developments"), snap => {
      const arr = [];
      snap.forEach(d => arr.push({ id: d.id, ...d.data() }));
      setDevelopments(arr);
    }, err => console.error(err));

    return () => { u1(); u2(); };
  }, []);

  function notify(msg, type = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }

  const filtered = useMemo(() => {
    let r = [...projects];
    if (search) {
      const s = search.toLowerCase();
      r = r.filter(p =>
        (p.name || "").toLowerCase().includes(s) ||
        (p.developmentName || "").toLowerCase().includes(s) ||
        (p.variantLabel || "").toLowerCase().includes(s)
      );
    }
    if (fDev !== "All") r = r.filter(p => p.developmentId === fDev);
    if (fType !== "All") r = r.filter(p => p.type === fType);
    if (fVisibility !== "All") r = r.filter(p => p.visibility === fVisibility);

    if (sortBy === "name") r.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    else if (sortBy === "priceAsc") r.sort((a, b) => (a.priceFromAed || 0) - (b.priceFromAed || 0));
    else if (sortBy === "priceDesc") r.sort((a, b) => (b.priceFromAed || 0) - (a.priceFromAed || 0));
    else if (sortBy === "yieldDesc") r.sort((a, b) => (b.grossYieldPct || 0) - (a.grossYieldPct || 0));
    else if (sortBy === "updatedAt") r.sort((a, b) => {
      const at = a.updatedAt?.toMillis?.() || 0;
      const bt = b.updatedAt?.toMillis?.() || 0;
      return bt - at;
    });

    return r;
  }, [projects, search, fDev, fType, fVisibility, sortBy]);

  async function saveProj(form) {
    setSaving(true);
    try {
      if (!form.name || form.name.trim().length < 2) {
        notify("Name is required", "error");
        setSaving(false);
        return;
      }
      if (!form.developmentId) {
        notify("Must link to a parent development", "error");
        setSaving(false);
        return;
      }
      if (form.visibility === "published") {
        if (!form.priceFromAed || form.priceFromAed <= 0) {
          notify("Published projects must have a starting price", "error");
          setSaving(false);
          return;
        }
        if (!form.type) {
          notify("Published projects must have a type", "error");
          setSaving(false);
          return;
        }
      }

      // Denormalize from parent development
      const parent = developments.find(d => d.id === form.developmentId);
      if (!parent) {
        notify("Parent development not found", "error");
        setSaving(false);
        return;
      }

      const isNew = !editing.id;
      const id = editing.id || slugify((parent.name || "") + "-" + (form.variantLabel || form.name) + "-" + Date.now().toString(36));

      // Auto-compute Golden Visa eligibility
      const goldenVisaEligible = Number(form.priceFromAed || 0) >= 2000000;

      const payload = {
        ...form,
        slug: editing.id ? form.slug : slugify((parent.name || "") + "-" + (form.variantLabel || form.name)),
        // Denormalized from parent
        developmentName: parent.name,
        developerId: parent.developerId,
        developerName: parent.developerName,
        community: parent.community,
        subCommunity: parent.subCommunity,
        coordinates: parent.coordinates,
        metroDistanceKm: parent.metroDistanceKm,
        beachAccess: parent.beachAccess,
        tenure: parent.tenure,
        foreignOwnershipAllowed: parent.foreignOwnershipAllowed,
        reraProjectNumber: parent.reraProjectNumber,
        escrowBank: parent.escrowBank,
        dldStarRating: parent.dldStarRating,
        coverImageUrl: form.coverImageUrl || parent.coverImageUrl,
        expectedHandover: parent.expectedHandover,
        saleStatus: parent.saleStatus,
        constructionStatus: parent.constructionStatus,
        constructionPct: parent.constructionPct,
        // Computed
        goldenVisaEligible,
        currency: "AED",
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

      await setDoc(doc(db, "projects", id), payload, { merge: true });

      await addDoc(collection(db, "projects", id, "auditLog"), {
        action: isNew ? "create" : "update",
        userId: currentUserId || "unknown",
        userEmail: currentUserEmail || "unknown",
        timestamp: serverTimestamp(),
        fieldsChanged: Object.keys(form),
      });

      notify(isNew ? "Project created" : "Project updated");
      setEditing(null);
    } catch (e) {
      console.error(e);
      notify("Save failed: " + e.message, "error");
    }
    setSaving(false);
  }

  async function archiveProj(proj) {
    if (!window.confirm("Archive " + proj.name + "?")) return;
    try {
      await setDoc(doc(db, "projects", proj.id), {
        visibility: "archived",
        updatedAt: serverTimestamp(),
        updatedBy: currentUserId || "unknown",
      }, { merge: true });

      await addDoc(collection(db, "projects", proj.id, "auditLog"), {
        action: "archive",
        userId: currentUserId || "unknown",
        userEmail: currentUserEmail || "unknown",
        timestamp: serverTimestamp(),
      });

      notify("Project archived");
    } catch (e) {
      notify("Archive failed: " + e.message, "error");
    }

  }
  // === BULK OPERATIONS ===
  function toggleSelection(id) {
    setSelectedIds(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  }
  function selectAll() { setSelectedIds(new Set(filtered.map(p => p.id))); }
  function clearSelection() { setSelectedIds(new Set()); }

  async function bulkArchive() {
    if (!window.confirm("Archive " + selectedIds.size + " projects?")) return;
    try {
      for (const id of selectedIds) {
        await setDoc(doc(db, "projects", id), { visibility: "archived", updatedAt: serverTimestamp(), updatedBy: currentUserId || "unknown" }, { merge: true });
        await addDoc(collection(db, "projects", id, "auditLog"), { action: "bulk-archive", userId: currentUserId || "unknown", userEmail: currentUserEmail || "unknown", timestamp: serverTimestamp() });
      }
      notify("Archived " + selectedIds.size + " projects");
      setSelectedIds(new Set());
    } catch (e) { notify("Bulk archive failed: " + e.message, "error"); }
  }

  async function bulkChangeVisibility(newVis) {
    if (!window.confirm("Change " + selectedIds.size + " projects to " + newVis + "?")) return;
    try {
      for (const id of selectedIds) {
        const payload = { visibility: newVis, updatedAt: serverTimestamp(), updatedBy: currentUserId || "unknown" };
        if (newVis === "published") payload.disclosedAt = serverTimestamp();
        await setDoc(doc(db, "projects", id), payload, { merge: true });
        await addDoc(collection(db, "projects", id, "auditLog"), { action: "bulk-visibility-change", newVisibility: newVis, userId: currentUserId || "unknown", userEmail: currentUserEmail || "unknown", timestamp: serverTimestamp() });
      }
      notify("Changed " + selectedIds.size + " projects to " + newVis);
      setSelectedIds(new Set());
    } catch (e) { notify("Bulk change failed: " + e.message, "error"); }
  }

  function exportCsv() {
    const rows = filtered.map(p => ({
      id: p.id, developmentId: p.developmentId || "", developmentName: p.developmentName || "",
      name: p.name || "", variantLabel: p.variantLabel || "", type: p.type || "",
      category: p.category || "", visibility: p.visibility || "",
      priceFromAed: p.priceFromAed || 0, priceToAed: p.priceToAed || 0, pricePerSqftAed: p.pricePerSqftAed || 0,
      sizeSqftMin: p.sizeSqftMin || 0, sizeSqftMax: p.sizeSqftMax || 0,
      bedrooms: p.bedrooms || 0, bathrooms: p.bathrooms || 0,
      availableUnits: p.availableUnits || 0, totalUnits: p.totalUnits || 0,
      grossYieldPct: p.grossYieldPct || 0, netYieldPct: p.netYieldPct || 0,
      serviceChargePerSqft: p.serviceChargePerSqft || 0,
      goldenVisaEligible: p.goldenVisaEligible || false, furnishing: p.furnishing || "",
    }));
    const csv = Papa.unparse(rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "projects-" + new Date().toISOString().slice(0,10) + ".csv"; a.click();
    URL.revokeObjectURL(url);
    notify("Exported " + rows.length + " projects");
  }

  function importCsv(file) {
    Papa.parse(file, {
      header: true, skipEmptyLines: true,
      complete: async (results) => {
        const rows = results.data;
        if (!rows.length) { notify("CSV is empty", "error"); return; }
        if (!window.confirm("Import " + rows.length + " projects?")) return;
        let created = 0, updated = 0, failed = 0;
        for (const r of rows) {
          try {
            const id = r.id || ((r.name || "").toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-") + "-" + Date.now().toString(36));
            const parent = developments.find(d => d.id === r.developmentId);
            if (!parent) { failed++; continue; }
            const priceFromAed = parseFloat(r.priceFromAed) || 0;
            const payload = {
              developmentId: r.developmentId, name: r.name || "", variantLabel: r.variantLabel || "",
              type: r.type || "1BR Apartment", category: r.category || "residential",
              visibility: r.visibility || "draft",
              priceFromAed, priceToAed: parseFloat(r.priceToAed) || 0,
              pricePerSqftAed: parseFloat(r.pricePerSqftAed) || 0,
              sizeSqftMin: parseFloat(r.sizeSqftMin) || 0, sizeSqftMax: parseFloat(r.sizeSqftMax) || 0,
              bedrooms: parseInt(r.bedrooms) || 0, bathrooms: parseInt(r.bathrooms) || 0,
              availableUnits: parseInt(r.availableUnits) || 0, totalUnits: parseInt(r.totalUnits) || 0,
              grossYieldPct: parseFloat(r.grossYieldPct) || 0, netYieldPct: parseFloat(r.netYieldPct) || 0,
              serviceChargePerSqft: parseFloat(r.serviceChargePerSqft) || 0,
              goldenVisaEligible: priceFromAed >= 2000000,
              furnishing: r.furnishing || "unfurnished", currency: "AED",
              developmentName: parent.name, developerId: parent.developerId, developerName: parent.developerName,
              community: parent.community, coordinates: parent.coordinates,
              orgId: "dxb-analytics", updatedAt: serverTimestamp(), updatedBy: currentUserId || "unknown",
            };
            const isNew = !r.id;
            if (isNew) { payload.createdAt = serverTimestamp(); payload.createdBy = currentUserId || "unknown"; }
            await setDoc(doc(db, "projects", id), payload, { merge: true });
            await addDoc(collection(db, "projects", id, "auditLog"), { action: isNew ? "csv-import-create" : "csv-import-update", userId: currentUserId || "unknown", userEmail: currentUserEmail || "unknown", timestamp: serverTimestamp(), source: "csv-import" });
            if (isNew) created++; else updated++;
          } catch (e) { failed++; console.error(r, e); }
        }
        notify("Import: " + created + " created, " + updated + " updated" + (failed ? ", " + failed + " failed" : ""));
      },
      error: (e) => notify("CSV parse error: " + e.message, "error"),
    });
  }

  if (loading) return <div style={{ padding: 40, color: C.t2 }}>Loading projects...</div>;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: C.w, fontFamily: "'Fraunces',serif", fontWeight: 600 }}>
          Projects
          <span style={{ fontSize: 12, color: C.t2, fontWeight: 400, marginLeft: 10 }}>
            {filtered.length} of {projects.length} variants
          </span>
        </h2>
        <button style={btnStyles("primary")} onClick={() => setEditing({})}>+ Add New Project Variant</button>
      </div>

      {developments.length === 0 && (
        <div style={{ ...cardStyle, textAlign: "center", padding: 40, marginBottom: 16 }}>
          <div style={{ fontSize: 14, color: C.amber, marginBottom: 4, fontWeight: 600 }}>No developments exist yet</div>
          <div style={{ fontSize: 12, color: C.t2 }}>
            Projects must link to a parent development. Add one in the <strong style={{ color: C.teal }}>Developments</strong> tab first.
          </div>
        </div>
      )}

      <div style={{ ...cardStyle, marginBottom: 16, padding: 14 }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr", gap: 10 }}>
          <input type="text" placeholder="Search name, variant, development..." value={search} onChange={e => setSearch(e.target.value)} style={inputStyle} />
          <select value={fDev} onChange={e => setFDev(e.target.value)} style={inputStyle}>
            <option value="All">All Developments</option>
            {developments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          <select value={fType} onChange={e => setFType(e.target.value)} style={inputStyle}>
            <option value="All">All Types</option>
            {PROPERTY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <select value={fVisibility} onChange={e => setFVisibility(e.target.value)} style={inputStyle}>
            <option value="All">All Visibility</option>
            {VISIBILITY.map(v => <option key={v} value={v}>{v}</option>)}
          </select>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={inputStyle}>
            <option value="updatedAt">Sort: Recent</option>
            <option value="name">Sort: Name</option>
            <option value="priceAsc">Price Low to High</option>
            <option value="priceDesc">Price High to Low</option>
            <option value="yieldDesc">Yield High to Low</option>
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
        collectionName="projects"
      />

      <div style={{ display: "grid", gap: 10 }}>
        {filtered.length === 0 ? (
          <div style={{ ...cardStyle, textAlign: "center", padding: 40, color: C.t2 }}>
            {projects.length === 0 ? "No projects yet. Click + Add New Project Variant to create one." : "No results match your filters."}
          </div>
        ) : filtered.map(p => {
          const vColor = p.visibility === "published" ? C.green : p.visibility === "draft" ? C.amber : C.m;
          return (
            <div key={p.id} style={{ ...cardStyle, padding: 14, display: "flex", alignItems: "center", gap: 14, cursor: "pointer" }} onClick={() => setEditing(p)}>
              <input type="checkbox" checked={selectedIds.has(p.id)} onClick={e => e.stopPropagation()} onChange={() => toggleSelection(p.id)} style={{ cursor: "pointer", width: 16, height: 16, accentColor: "#D4A843" }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                  <span style={{ fontSize: 14, color: C.w, fontWeight: 600 }}>{p.name || "(unnamed)"}</span>
                  {p.variantLabel && (
                    <span style={{ fontSize: 9, padding: "2px 8px", background: C.blueD, color: C.blue, borderRadius: 4, fontWeight: 600 }}>{p.variantLabel}</span>
                  )}
                  <span style={{ fontSize: 9, padding: "2px 8px", background: vColor + "20", color: vColor, borderRadius: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>{p.visibility || "draft"}</span>
                  {p.goldenVisaEligible && (
                    <span style={{ fontSize: 9, padding: "2px 8px", background: C.goldD, color: C.gold, borderRadius: 4, fontWeight: 600 }}>★ GOLDEN VISA</span>
                  )}
                </div>
                <div style={{ fontSize: 11, color: C.t2, display: "flex", gap: 14, flexWrap: "wrap" }}>
                  <span>{p.developmentName || "no parent"}</span>
                  <span>· {p.type || "no type"}</span>
                  <span>· {formatAed(p.priceFromAed)}{p.priceToAed && p.priceToAed !== p.priceFromAed ? " to " + formatAed(p.priceToAed) : ""}</span>
                  {p.grossYieldPct > 0 && <span>· {p.grossYieldPct}% yield</span>}
                  {p.bedrooms !== undefined && p.bedrooms !== null && <span>· {p.bedrooms === 0 ? "Studio" : p.bedrooms + "BR"}</span>}
                </div>
              </div>
              <div style={{ display: "flex", gap: 6 }} onClick={e => e.stopPropagation()}>
                <button style={{ ...btnStyles("ghost"), padding: "6px 12px" }} onClick={() => setEditing(p)}>Edit</button>
                {p.visibility !== "archived" && (
                  <button style={{ ...btnStyles("red"), padding: "6px 12px" }} onClick={() => archiveProj(p)}>Archive</button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {editing !== null && (
        <ProjEditModal
          initial={editing}
          developments={developments}
          onClose={() => setEditing(null)}
          onSave={saveProj}
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

function ProjEditModal({ initial, developments, onClose, onSave, saving }) {
  const [form, setForm] = useState({
    developmentId: "", name: "", variantLabel: "",
    type: "1BR Apartment", category: "residential",
    visibility: "draft",
    priceFromAed: 0, priceToAed: 0, pricePerSqftAed: 0,
    sizeSqftMin: 0, sizeSqftMax: 0,
    bedrooms: 1, bathrooms: 1,
    availableUnits: 0, totalUnits: 0,
    grossYieldPct: 0, netYieldPct: 0,
    serviceChargePerSqft: 0,
    mortgageEligible: true, maxLtv: 80,
    furnishing: "unfurnished",
    coverImageUrl: "",
    paymentPlan: {
      downPaymentPct: 20, duringConstructionPct: 60, onHandoverPct: 20, postHandoverPct: 0,
      postHandoverMonths: 0, label: "20/60/20",
    },
    ...initial,
  });

  function update(field, value) {
    setForm(f => ({ ...f, [field]: value }));
  }
  function updatePP(field, value) {
    setForm(f => ({ ...f, paymentPlan: { ...f.paymentPlan, [field]: value } }));
  }

  const parent = developments.find(d => d.id === form.developmentId);
  const goldenVisa = Number(form.priceFromAed || 0) >= 2000000;

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: 20 }} onClick={onClose}>
      <div style={{ background: C.s1, border: "1px solid " + C.borderG, borderRadius: 12, padding: 28, maxWidth: 900, width: "100%", maxHeight: "90vh", overflow: "auto" }} onClick={e => e.stopPropagation()}>
        <h3 style={{ margin: "0 0 20px 0", fontSize: 16, color: C.gold, fontFamily: "'Fraunces',serif" }}>
          {initial.id ? "Edit Project Variant" : "New Project Variant"}
          {goldenVisa && (
            <span style={{ marginLeft: 12, fontSize: 10, padding: "3px 8px", background: C.goldD, color: C.gold, borderRadius: 4, fontWeight: 600 }}>★ GOLDEN VISA ELIGIBLE</span>
          )}
        </h3>

        <div style={{ display: "grid", gap: 14 }}>
          <div>
            <label style={{ display: "block", fontSize: 10, color: C.t2, marginBottom: 4, textTransform: "uppercase" }}>Parent Development *</label>
            <select style={inputStyle} value={form.developmentId} onChange={e => update("developmentId", e.target.value)}>
              <option value="">-- Select parent development --</option>
              {developments.map(d => <option key={d.id} value={d.id}>{d.name} ({d.community})</option>)}
            </select>
            {parent && (
              <div style={{ fontSize: 10, color: C.m, marginTop: 4 }}>
                Parent: {parent.community} · {parent.developerName} · RERA #{parent.reraProjectNumber}
              </div>
            )}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 10 }}>
            <div>
              <label style={{ display: "block", fontSize: 10, color: C.t2, marginBottom: 4, textTransform: "uppercase" }}>Name *</label>
              <input style={inputStyle} value={form.name} onChange={e => update("name", e.target.value)} placeholder="e.g. Emaar Beachfront Tower 2 - 2BR" />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 10, color: C.t2, marginBottom: 4, textTransform: "uppercase" }}>Variant Label</label>
              <input style={inputStyle} value={form.variantLabel} onChange={e => update("variantLabel", e.target.value)} placeholder="2BR" />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            <div>
              <label style={{ display: "block", fontSize: 10, color: C.t2, marginBottom: 4, textTransform: "uppercase" }}>Type *</label>
              <select style={inputStyle} value={form.type} onChange={e => update("type", e.target.value)}>
                {PROPERTY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: 10, color: C.t2, marginBottom: 4, textTransform: "uppercase" }}>Category</label>
              <select style={inputStyle} value={form.category} onChange={e => update("category", e.target.value)}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: 10, color: C.t2, marginBottom: 4, textTransform: "uppercase" }}>Visibility</label>
              <select style={inputStyle} value={form.visibility} onChange={e => update("visibility", e.target.value)}>
                {VISIBILITY.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
          </div>

          {/* Pricing */}
          <div style={{ padding: 14, background: C.s2, borderRadius: 8 }}>
            <div style={{ fontSize: 11, color: C.gold, fontWeight: 600, marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.5 }}>Pricing (AED)</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
              <div>
                <label style={{ display: "block", fontSize: 10, color: C.t2, marginBottom: 4 }}>From *</label>
                <input style={inputStyle} type="number" min="0" value={form.priceFromAed} onChange={e => update("priceFromAed", parseFloat(e.target.value) || 0)} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 10, color: C.t2, marginBottom: 4 }}>To</label>
                <input style={inputStyle} type="number" min="0" value={form.priceToAed} onChange={e => update("priceToAed", parseFloat(e.target.value) || 0)} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 10, color: C.t2, marginBottom: 4 }}>Per sqft</label>
                <input style={inputStyle} type="number" min="0" value={form.pricePerSqftAed} onChange={e => update("pricePerSqftAed", parseFloat(e.target.value) || 0)} />
              </div>
            </div>
          </div>

          {/* Size & bedrooms */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10 }}>
            <div>
              <label style={{ display: "block", fontSize: 10, color: C.t2, marginBottom: 4, textTransform: "uppercase" }}>Size min (sqft)</label>
              <input style={inputStyle} type="number" min="0" value={form.sizeSqftMin} onChange={e => update("sizeSqftMin", parseFloat(e.target.value) || 0)} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 10, color: C.t2, marginBottom: 4, textTransform: "uppercase" }}>Size max (sqft)</label>
              <input style={inputStyle} type="number" min="0" value={form.sizeSqftMax} onChange={e => update("sizeSqftMax", parseFloat(e.target.value) || 0)} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 10, color: C.t2, marginBottom: 4, textTransform: "uppercase" }}>Bedrooms</label>
              <input style={inputStyle} type="number" min="0" max="20" value={form.bedrooms} onChange={e => update("bedrooms", parseInt(e.target.value) || 0)} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 10, color: C.t2, marginBottom: 4, textTransform: "uppercase" }}>Bathrooms</label>
              <input style={inputStyle} type="number" min="0" max="20" value={form.bathrooms} onChange={e => update("bathrooms", parseInt(e.target.value) || 0)} />
            </div>
          </div>

          {/* Yield */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            <div>
              <label style={{ display: "block", fontSize: 10, color: C.t2, marginBottom: 4, textTransform: "uppercase" }}>Gross Yield %</label>
              <input style={inputStyle} type="number" step="0.1" min="0" max="30" value={form.grossYieldPct} onChange={e => update("grossYieldPct", parseFloat(e.target.value) || 0)} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 10, color: C.t2, marginBottom: 4, textTransform: "uppercase" }}>Net Yield %</label>
              <input style={inputStyle} type="number" step="0.1" min="0" max="30" value={form.netYieldPct} onChange={e => update("netYieldPct", parseFloat(e.target.value) || 0)} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 10, color: C.t2, marginBottom: 4, textTransform: "uppercase" }}>Service Charge/sqft</label>
              <input style={inputStyle} type="number" step="0.1" min="0" value={form.serviceChargePerSqft} onChange={e => update("serviceChargePerSqft", parseFloat(e.target.value) || 0)} />
            </div>
          </div>

          {/* Units availability */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            <div>
              <label style={{ display: "block", fontSize: 10, color: C.t2, marginBottom: 4, textTransform: "uppercase" }}>Available</label>
              <input style={inputStyle} type="number" min="0" value={form.availableUnits} onChange={e => update("availableUnits", parseInt(e.target.value) || 0)} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 10, color: C.t2, marginBottom: 4, textTransform: "uppercase" }}>Total Units</label>
              <input style={inputStyle} type="number" min="0" value={form.totalUnits} onChange={e => update("totalUnits", parseInt(e.target.value) || 0)} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 10, color: C.t2, marginBottom: 4, textTransform: "uppercase" }}>Furnishing</label>
              <select style={inputStyle} value={form.furnishing} onChange={e => update("furnishing", e.target.value)}>
                {FURNISH.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
          </div>

          {/* Payment plan */}
          <div style={{ padding: 14, background: C.s2, borderRadius: 8 }}>
            <div style={{ fontSize: 11, color: C.teal, fontWeight: 600, marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.5 }}>Payment Plan</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr", gap: 10 }}>
              <div>
                <label style={{ display: "block", fontSize: 10, color: C.t2, marginBottom: 4 }}>Down %</label>
                <input style={inputStyle} type="number" min="0" max="100" value={form.paymentPlan.downPaymentPct} onChange={e => updatePP("downPaymentPct", parseInt(e.target.value) || 0)} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 10, color: C.t2, marginBottom: 4 }}>Construction %</label>
                <input style={inputStyle} type="number" min="0" max="100" value={form.paymentPlan.duringConstructionPct} onChange={e => updatePP("duringConstructionPct", parseInt(e.target.value) || 0)} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 10, color: C.t2, marginBottom: 4 }}>Handover %</label>
                <input style={inputStyle} type="number" min="0" max="100" value={form.paymentPlan.onHandoverPct} onChange={e => updatePP("onHandoverPct", parseInt(e.target.value) || 0)} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 10, color: C.t2, marginBottom: 4 }}>Post-HO %</label>
                <input style={inputStyle} type="number" min="0" max="100" value={form.paymentPlan.postHandoverPct} onChange={e => updatePP("postHandoverPct", parseInt(e.target.value) || 0)} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 10, color: C.t2, marginBottom: 4 }}>Post-HO Months</label>
                <input style={inputStyle} type="number" min="0" value={form.paymentPlan.postHandoverMonths} onChange={e => updatePP("postHandoverMonths", parseInt(e.target.value) || 0)} />
              </div>
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: 10, color: C.t2, marginBottom: 4, textTransform: "uppercase" }}>Cover Image URL (optional, inherits parent if empty)</label>
            <input style={inputStyle} value={form.coverImageUrl} onChange={e => update("coverImageUrl", e.target.value)} placeholder="https://..." />
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 24, paddingTop: 20, borderTop: "1px solid " + C.border }}>
          <button style={btnStyles("ghost", saving)} onClick={onClose} disabled={saving}>Cancel</button>
          <button style={btnStyles("primary", saving)} onClick={() => onSave(form)} disabled={saving}>
            {saving ? "Saving..." : initial.id ? "Save Changes" : "Create Project Variant"}
          </button>
        </div>
      </div>
    </div>
  );
}
