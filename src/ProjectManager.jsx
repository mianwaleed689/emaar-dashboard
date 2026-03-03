/* ─── DXB ANALYTICS — PROJECT MANAGER V3 ─── */
import React, { useState, useEffect, useCallback } from "react";
import { auth, db } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs, doc, getDoc, setDoc } from "firebase/firestore";

const T = {
  bg: "#04090F", surface: "#0A1628", surfaceAlt: "#0E1D35",
  gold: "#D4A843", goldLight: "#E8C96A", goldGlow: "rgba(212,168,67,0.15)",
  teal: "#00BFA5", white: "#FFFFFF",
  textPrimary: "#E2E8F0", textSecondary: "#94A3B8", textMuted: "#64748B",
  border: "rgba(212,168,67,0.12)",
  red: "#EF4444", green: "#10B981", blue: "#3B82F6",
};

/* Safe value converter — turns ANY Firestore type into a plain JS type */
function toPlain(val) {
  if (val === null || val === undefined) return "";
  if (typeof val === "string" || typeof val === "number" || typeof val === "boolean") return val;
  if (typeof val === "object" && typeof val.toDate === "function") return val.toDate().toISOString();
  if (Array.isArray(val)) return val.map(v => {
    if (typeof v === "object" && v !== null) {
      const obj = {};
      Object.keys(v).forEach(k => { obj[k] = toPlain(v[k]); });
      return obj;
    }
    return toPlain(v);
  });
  if (typeof val === "object") {
    const obj = {};
    Object.keys(val).forEach(k => { obj[k] = toPlain(val[k]); });
    return obj;
  }
  return String(val);
}

/* Safe clone entire doc */
function cloneDoc(data) {
  const result = {};
  Object.keys(data).forEach(k => { result[k] = toPlain(data[k]); });
  return result;
}

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700;9..144,900&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: ${T.bg}; }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
  .pm-input { width: 100%; padding: 10px 14px; background: ${T.surfaceAlt}; border: 1px solid ${T.border}; border-radius: 8px; color: ${T.textPrimary}; font-size: 13px; font-family: 'Outfit', sans-serif; outline: none; }
  .pm-input:focus { border-color: ${T.gold}; }
  .pm-select { width: 100%; padding: 10px 14px; background: ${T.surfaceAlt}; border: 1px solid ${T.border}; border-radius: 8px; color: ${T.textPrimary}; font-size: 13px; font-family: 'Outfit', sans-serif; outline: none; cursor: pointer; }
  .pm-select:focus { border-color: ${T.gold}; }
  .pm-label { display: block; font-size: 11px; font-weight: 600; color: ${T.textMuted}; margin-bottom: 6px; letter-spacing: 0.5px; text-transform: uppercase; }
  .pm-item { display: flex; align-items: center; gap: 12px; padding: 12px 16px; border-radius: 10px; cursor: pointer; transition: all 0.15s; border: 1px solid transparent; }
  .pm-item:hover { background: ${T.surfaceAlt}; }
  .pm-item.active { background: ${T.goldGlow}; border-color: ${T.gold}; }
  .pm-search { width: 100%; padding: 10px 14px 10px 36px; background: ${T.surface}; border: 1px solid ${T.border}; border-radius: 10px; color: ${T.textPrimary}; font-size: 13px; font-family: 'Outfit', sans-serif; outline: none; }
  .pm-search:focus { border-color: ${T.gold}; }
  @media (max-width: 900px) { .pm-grid { grid-template-columns: 1fr !important; } }
`;

function Field({ label, value, onChange, placeholder, type }) {
  return (
    <div>
      <label className="pm-label">{label}</label>
      {type === "textarea" ? (
        <textarea className="pm-input" value={String(value || "")} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={3} style={{ resize: "vertical" }} />
      ) : type === "number" ? (
        <input className="pm-input" type="number" value={value || ""} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
      ) : (
        <input className="pm-input" value={String(value || "")} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
      )}
    </div>
  );
}

function SelectField({ label, value, onChange, options }) {
  return (
    <div>
      <label className="pm-label">{label}</label>
      <select className="pm-select" value={String(value || "")} onChange={e => onChange(e.target.value)}>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

export default function ProjectManager() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [editData, setEditData] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  // Auth
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        try {
          const d = await getDoc(doc(db, "users", u.uid));
          if (d.exists() && d.data().role === "admin") setIsAdmin(true);
          else if (!d.exists()) setIsAdmin(true);
        } catch { setIsAdmin(true); }
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // Fetch projects
  const fetchProjects = useCallback(async () => {
    try {
      const snap = await getDocs(collection(db, "projects"));
      const list = [];
      snap.forEach(d => {
        try {
          const plain = cloneDoc(d.data());
          list.push({ id: d.id, ...plain });
        } catch (err) {
          console.log("Skip project:", d.id, err);
        }
      });
      list.sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));
      setProjects(list);
    } catch (err) { console.log("Fetch error:", err); }
  }, []);

  useEffect(() => { if (isAdmin) fetchProjects(); }, [isAdmin, fetchProjects]);

  // Select
  const selectProject = (p) => {
    try {
      setSelectedId(p.id);
      setEditData({ ...cloneDoc(p) });
    } catch (err) {
      console.log("Select error:", err);
      setSelectedId(p.id);
      setEditData({ name: p.name || "", community: p.community || "", id: p.id });
    }
  };

  // Update
  const updateField = (key, val) => {
    setEditData(prev => ({ ...prev, [key]: val }));
  };

  // Unit operations
  const updateUnit = (idx, key, val) => {
    setEditData(prev => {
      const units = Array.isArray(prev.units) ? [...prev.units] : [];
      units[idx] = { ...(units[idx] || {}), [key]: val };
      return { ...prev, units };
    });
  };

  const addUnit = () => {
    setEditData(prev => ({
      ...prev,
      units: [...(Array.isArray(prev.units) ? prev.units : []), { type: "1BR", available: 0, total: 0 }]
    }));
  };

  const removeUnit = (idx) => {
    setEditData(prev => ({
      ...prev,
      units: (Array.isArray(prev.units) ? prev.units : []).filter((_, i) => i !== idx)
    }));
  };

  // Save
  const handleSave = async () => {
    if (!editData || !selectedId) return;
    setSaving(true);
    try {
      const { id, ...data } = editData;
      data.lastUpdated = new Date().toISOString();
      if (data.constructionProgress) data.constructionProgress = Number(data.constructionProgress) || 0;
      if (Array.isArray(data.units)) {
        data.units = data.units.map(u => ({
          type: String(u.type || "1BR"),
          available: Number(u.available) || 0,
          total: Number(u.total) || 0,
          priceFrom: String(u.priceFrom || ""),
        }));
      }
      await setDoc(doc(db, "projects", selectedId), data, { merge: true });
      setToast("✅ Saved!");
      setTimeout(() => setToast(""), 3000);
      setProjects(prev => prev.map(p => p.id === selectedId ? { ...p, ...data, id: selectedId } : p));
    } catch (err) {
      setToast("❌ Error: " + err.message);
      setTimeout(() => setToast(""), 4000);
    }
    setSaving(false);
  };

  // Filter
  const communities = [...new Set(projects.map(p => String(p.community || "Unknown")))].sort();
  const filtered = projects.filter(p => {
    const name = String(p.name || "").toLowerCase();
    const comm = String(p.community || "").toLowerCase();
    const matchSearch = !search || name.includes(search.toLowerCase()) || comm.includes(search.toLowerCase());
    const matchFilter = filter === "all" || String(p.community) === filter;
    return matchSearch && matchFilter;
  });

  const units = editData && Array.isArray(editData.units) ? editData.units : [];
  const totalAvail = units.reduce((s, u) => s + (Number(u.available) || 0), 0);
  const totalUnits = units.reduce((s, u) => s + (Number(u.total) || 0), 0);

  // ─── RENDER ───

  if (loading) return (
    <div style={{ minHeight: "100vh", background: T.bg, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
      <style>{css}</style>
      <div style={{ width: 28, height: 28, border: `2px solid ${T.border}`, borderTopColor: T.gold, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <span style={{ color: T.gold, fontFamily: "'Fraunces', serif", fontSize: 16 }}>Loading...</span>
    </div>
  );

  if (!isAdmin) return (
    <div style={{ minHeight: "100vh", background: T.bg, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12, fontFamily: "'Outfit', sans-serif" }}>
      <style>{css}</style>
      <div style={{ fontSize: 40 }}>🔒</div>
      <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 22, color: T.white }}>Admin Access Only</h1>
      <a href="/" style={{ color: T.gold, fontSize: 13, textDecoration: "none" }}>← Back</a>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: T.bg, fontFamily: "'Outfit', sans-serif", color: T.textPrimary }}>
      <style>{css}</style>

      {/* Toast */}
      {toast && <div style={{ position: "fixed", bottom: 24, right: 24, padding: "14px 24px", borderRadius: 10, background: toast.startsWith("✅") ? T.green : T.red, color: T.bg, fontWeight: 600, fontSize: 13, zIndex: 9999, animation: "fadeUp 0.3s", boxShadow: "0 8px 32px rgba(0,0,0,0.3)" }}>{toast}</div>}

      {/* Header */}
      <header style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(4,9,15,0.95)", backdropFilter: "blur(20px)", borderBottom: `1px solid ${T.border}`, padding: "12px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <a href="/" style={{ display: "flex", alignItems: "center", gap: 6, textDecoration: "none" }}>
            <svg width="24" height="24" viewBox="0 0 40 40"><rect x="2" y="2" width="36" height="36" rx="8" fill="none" stroke={T.gold} strokeWidth="2" /><path d="M12 28V12h10l-6 8h8l-12 8z" fill={T.gold} /></svg>
            <span style={{ fontFamily: "'Fraunces', serif", fontSize: 15, fontWeight: 800, color: T.gold }}>DXB Analytics</span>
          </a>
          <span style={{ fontSize: 9, padding: "2px 8px", borderRadius: 5, background: "rgba(139,92,246,0.15)", color: "#8B5CF6", fontWeight: 700 }}>PROJECT MANAGER</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 11, color: T.textMuted }}>{projects.length} projects</span>
          <a href="/" style={{ fontSize: 11, color: T.textSecondary, textDecoration: "none", padding: "5px 12px", border: `1px solid ${T.border}`, borderRadius: 6 }}>← Dashboard</a>
          <a href="/admin" style={{ fontSize: 11, color: T.textSecondary, textDecoration: "none", padding: "5px 12px", border: `1px solid ${T.border}`, borderRadius: 6 }}>Admin</a>
        </div>
      </header>

      {/* Main */}
      <div className="pm-grid" style={{ display: "grid", gridTemplateColumns: "300px 1fr", height: "calc(100vh - 53px)" }}>

        {/* ─── LEFT: LIST ─── */}
        <div style={{ borderRight: `1px solid ${T.border}`, overflowY: "auto", padding: 12 }}>
          <div style={{ position: "relative", marginBottom: 8 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={T.textMuted} strokeWidth="2" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input className="pm-search" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="pm-select" value={filter} onChange={e => setFilter(e.target.value)} style={{ fontSize: 11, padding: "6px 8px", marginBottom: 8 }}>
            <option value="all">All ({projects.length})</option>
            {communities.map(c => <option key={c} value={c}>{c} ({projects.filter(p => String(p.community) === c).length})</option>)}
          </select>
          <div style={{ fontSize: 10, color: T.textMuted, padding: "4px 0 6px", fontWeight: 600 }}>{filtered.length} PROJECTS</div>
          {filtered.map(p => (
            <div key={p.id} className={`pm-item ${selectedId === p.id ? "active" : ""}`} onClick={() => selectProject(p)}>
              <div style={{ width: 32, height: 32, borderRadius: 7, background: selectedId === p.id ? T.gold : T.surfaceAlt, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 11, color: selectedId === p.id ? T.bg : T.textMuted, flexShrink: 0 }}>
                {String(p.name || "?").charAt(0)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: selectedId === p.id ? T.gold : T.white, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{String(p.name || "—")}</div>
                <div style={{ fontSize: 10, color: T.textMuted }}>{String(p.community || "—")} · {String(p.status || "—")}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ─── RIGHT: EDITOR ─── */}
        <div style={{ overflowY: "auto", padding: "20px 28px" }}>
          {!editData ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", flexDirection: "column", gap: 12 }}>
              <div style={{ fontSize: 40 }}>📋</div>
              <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 20, color: T.white }}>Select a Project</h2>
              <p style={{ color: T.textSecondary, fontSize: 12 }}>Click any project on the left to edit</p>
            </div>
          ) : (
            <div>
              {/* Title + Save */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <div>
                  <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 900, color: T.white }}>{String(editData.name || "Untitled")}</h1>
                  <p style={{ color: T.textMuted, fontSize: 11, marginTop: 2 }}>{String(editData.community || "")} · {selectedId}</p>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => selectProject(projects.find(p => p.id === selectedId) || editData)} style={{ padding: "8px 16px", borderRadius: 8, border: `1px solid ${T.gold}`, background: "transparent", color: T.gold, fontFamily: "'Outfit'", fontWeight: 600, fontSize: 12, cursor: "pointer" }}>↩ Reset</button>
                  <button onClick={handleSave} disabled={saving} style={{ padding: "8px 24px", borderRadius: 8, border: "none", background: `linear-gradient(135deg, ${T.gold}, ${T.goldLight})`, color: T.bg, fontFamily: "'Outfit'", fontWeight: 700, fontSize: 12, cursor: saving ? "wait" : "pointer", opacity: saving ? 0.5 : 1 }}>
                    {saving ? "Saving..." : "💾 Save"}
                  </button>
                </div>
              </div>

              {/* ─── BASIC INFO ─── */}
              <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, marginBottom: 14 }}>
                <h3 style={{ fontSize: 13, fontWeight: 700, color: T.gold, marginBottom: 14 }}>🏗️ Basic Information</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  <Field label="Project Name" value={editData.name} onChange={v => updateField("name", v)} placeholder="e.g. The Valley" />
                  <Field label="Community" value={editData.community} onChange={v => updateField("community", v)} placeholder="e.g. Dubai Hills" />
                  <SelectField label="Status" value={editData.status} onChange={v => updateField("status", v)} options={["Off-Plan", "Building", "Under Construction", "Ready", "Sold Out", "Launching"]} />
                  <Field label="Property Type" value={editData.type} onChange={v => updateField("type", v)} placeholder="e.g. Apartments · 1-3 BR" />
                  <SelectField label="Segment" value={editData.segment} onChange={v => updateField("segment", v)} options={["Mid-Market", "Mid-Premium", "Premium", "Ultra-Premium", "Luxury", ""]} />
                  <Field label="Branded" value={editData.branded} onChange={v => updateField("branded", v)} placeholder="e.g. Address, Vida" />
                </div>
              </div>

              {/* ─── PRICING ─── */}
              <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, marginBottom: 14 }}>
                <h3 style={{ fontSize: 13, fontWeight: 700, color: T.gold, marginBottom: 14 }}>💰 Pricing & Handover</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
                  <Field label="Price From (AED)" value={editData.priceFrom} onChange={v => updateField("priceFrom", v)} placeholder="e.g. 1.8M" />
                  <Field label="Price/SqFt" value={editData.pricePerSqft} onChange={v => updateField("pricePerSqft", v)} placeholder="e.g. 2,333" />
                  <Field label="Size Range" value={editData.sizeRange} onChange={v => updateField("sizeRange", v)} placeholder="e.g. 750 - 2,200 sqft" />
                  <Field label="Payment Plan" value={editData.paymentPlan} onChange={v => updateField("paymentPlan", v)} placeholder="e.g. 20/30/50" />
                  <Field label="Handover" value={editData.handover} onChange={v => updateField("handover", v)} placeholder="e.g. Q2 2026" />
                  <div>
                    <label className="pm-label">Construction %</label>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <input className="pm-input" type="number" min="0" max="100" value={editData.constructionProgress || 0} onChange={e => updateField("constructionProgress", e.target.value)} style={{ flex: 1 }} />
                      <div style={{ width: 50, height: 6, borderRadius: 3, background: T.surfaceAlt }}>
                        <div style={{ width: `${Math.min(Number(editData.constructionProgress) || 0, 100)}%`, height: "100%", borderRadius: 3, background: (Number(editData.constructionProgress) || 0) >= 80 ? T.green : T.gold }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ─── UNITS ─── */}
              <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <h3 style={{ fontSize: 13, fontWeight: 700, color: T.gold }}>🏠 Unit Inventory</h3>
                  <button onClick={addUnit} style={{ padding: "5px 12px", borderRadius: 6, border: `1px solid rgba(0,191,165,0.2)`, background: "rgba(0,191,165,0.1)", color: T.teal, fontFamily: "'Outfit'", fontWeight: 600, fontSize: 11, cursor: "pointer" }}>+ Add Unit</button>
                </div>
                {units.length === 0 ? (
                  <p style={{ color: T.textMuted, fontSize: 12, textAlign: "center", padding: 20 }}>No units. Click "+ Add Unit" to start.</p>
                ) : (
                  <>
                    <div style={{ display: "grid", gridTemplateColumns: "90px 1fr 1fr 60px", gap: 8, padding: "6px 0", borderBottom: `1px solid ${T.border}` }}>
                      <span style={{ fontSize: 10, fontWeight: 600, color: T.textMuted }}>TYPE</span>
                      <span style={{ fontSize: 10, fontWeight: 600, color: T.textMuted }}>AVAILABLE</span>
                      <span style={{ fontSize: 10, fontWeight: 600, color: T.textMuted }}>TOTAL</span>
                      <span style={{ fontSize: 10, fontWeight: 600, color: T.textMuted }}></span>
                    </div>
                    {units.map((u, i) => (
                      <div key={i} style={{ display: "grid", gridTemplateColumns: "90px 1fr 1fr 60px", gap: 8, padding: "8px 0", borderBottom: `1px solid ${T.border}`, alignItems: "center" }}>
                        <select className="pm-select" value={String(u.type || "1BR")} onChange={e => updateUnit(i, "type", e.target.value)} style={{ fontSize: 11, padding: "5px 6px" }}>
                          {["STUDIO", "1BR", "2BR", "3BR", "4BR", "5BR", "PENTHOUSE", "TOWNHOUSE", "VILLA", "DUPLEX"].map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                        <input className="pm-input" type="number" min="0" value={u.available || 0} onChange={e => updateUnit(i, "available", e.target.value)} style={{ fontSize: 11, padding: "5px 6px" }} />
                        <input className="pm-input" type="number" min="0" value={u.total || 0} onChange={e => updateUnit(i, "total", e.target.value)} style={{ fontSize: 11, padding: "5px 6px" }} />
                        <button onClick={() => removeUnit(i)} style={{ padding: "4px 8px", borderRadius: 5, border: `1px solid rgba(239,68,68,0.2)`, background: "rgba(239,68,68,0.1)", color: T.red, fontSize: 10, cursor: "pointer", fontFamily: "'Outfit'" }}>✕</button>
                      </div>
                    ))}
                    <div style={{ marginTop: 10, padding: "8px 10px", borderRadius: 6, background: T.surfaceAlt, display: "flex", gap: 20, fontSize: 11, color: T.textSecondary }}>
                      <span>Available: <strong style={{ color: T.green }}>{totalAvail}</strong></span>
                      <span>Total: <strong style={{ color: T.white }}>{totalUnits}</strong></span>
                      <span>Sold: <strong style={{ color: T.gold }}>{totalUnits - totalAvail}</strong></span>
                    </div>
                  </>
                )}
              </div>

              {/* ─── CONTACT ─── */}
              <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, marginBottom: 14 }}>
                <h3 style={{ fontSize: 13, fontWeight: 700, color: T.gold, marginBottom: 14 }}>📋 Contact & Media</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  <Field label="WhatsApp" value={editData.whatsapp} onChange={v => updateField("whatsapp", v)} placeholder="+971..." />
                  <Field label="Email" value={editData.email} onChange={v => updateField("email", v)} placeholder="sales@..." />
                  <Field label="Phone" value={editData.phone} onChange={v => updateField("phone", v)} placeholder="+971..." />
                  <Field label="Image URL" value={editData.imageUrl} onChange={v => updateField("imageUrl", v)} placeholder="https://..." />
                </div>
                <div style={{ marginTop: 14 }}>
                  <Field label="Description" value={editData.description} onChange={v => updateField("description", v)} placeholder="Notes..." type="textarea" />
                </div>
              </div>

              {/* ─── LOCATION ─── */}
              <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, marginBottom: 14 }}>
                <h3 style={{ fontSize: 13, fontWeight: 700, color: T.gold, marginBottom: 14 }}>📍 Location</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
                  <Field label="Latitude" value={editData.lat} onChange={v => updateField("lat", v)} placeholder="25.xxxx" />
                  <Field label="Longitude" value={editData.lng} onChange={v => updateField("lng", v)} placeholder="55.xxxx" />
                  <Field label="Area" value={editData.area} onChange={v => updateField("area", v)} placeholder="Dubai Marina" />
                </div>
              </div>

              {/* Bottom Save */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, padding: "12px 0 40px" }}>
                <button onClick={handleSave} disabled={saving} style={{ padding: "10px 32px", borderRadius: 8, border: "none", background: `linear-gradient(135deg, ${T.gold}, ${T.goldLight})`, color: T.bg, fontFamily: "'Outfit'", fontWeight: 700, fontSize: 13, cursor: saving ? "wait" : "pointer", opacity: saving ? 0.5 : 1 }}>
                  {saving ? "Saving..." : "💾 Save All Changes"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
