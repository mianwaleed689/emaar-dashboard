/* ─── DXB ANALYTICS — PROJECT MANAGER ─── */
import React, { useState, useEffect, useCallback } from "react";
import { auth, db } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs, doc, getDoc, setDoc, updateDoc } from "firebase/firestore";

const T = {
  bg: "#04090F", surface: "#0A1628", surfaceAlt: "#0E1D35", card: "#0D1B30",
  gold: "#D4A843", goldLight: "#E8C96A", goldGlow: "rgba(212,168,67,0.15)",
  teal: "#00BFA5", white: "#FFFFFF",
  textPrimary: "#E2E8F0", textSecondary: "#94A3B8", textMuted: "#64748B",
  border: "rgba(212,168,67,0.12)",
  red: "#EF4444", green: "#10B981", blue: "#3B82F6",
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700;9..144,900&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: ${T.bg}; }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes slideIn { from { opacity: 0; transform: translateX(40px); } to { opacity: 1; transform: translateX(0); } }
  .pm-card { background: ${T.surface}; border: 1px solid ${T.border}; border-radius: 14px; padding: 20px; animation: fadeUp 0.4s ease-out both; transition: border-color 0.2s; }
  .pm-card:hover { border-color: rgba(212,168,67,0.25); }
  .pm-input { width: 100%; padding: 10px 14px; background: ${T.surfaceAlt}; border: 1px solid ${T.border}; border-radius: 8px; color: ${T.textPrimary}; font-size: 13px; font-family: 'Outfit', sans-serif; outline: none; transition: border-color 0.2s; }
  .pm-input:focus { border-color: ${T.gold}; }
  .pm-input::placeholder { color: ${T.textMuted}; }
  .pm-label { display: block; font-size: 11px; font-weight: 600; color: ${T.textMuted}; margin-bottom: 6px; letter-spacing: 0.5px; text-transform: uppercase; }
  .pm-select { width: 100%; padding: 10px 14px; background: ${T.surfaceAlt}; border: 1px solid ${T.border}; border-radius: 8px; color: ${T.textPrimary}; font-size: 13px; font-family: 'Outfit', sans-serif; outline: none; cursor: pointer; }
  .pm-select:focus { border-color: ${T.gold}; }
  .pm-btn { padding: 10px 24px; border-radius: 8px; border: none; font-family: 'Outfit', sans-serif; font-weight: 600; cursor: pointer; transition: all 0.2s; font-size: 13px; }
  .pm-btn:hover { transform: translateY(-1px); }
  .pm-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
  .pm-btn-gold { background: linear-gradient(135deg, ${T.gold}, ${T.goldLight}); color: ${T.bg}; }
  .pm-btn-outline { background: transparent; color: ${T.gold}; border: 1px solid ${T.gold}; }
  .pm-btn-teal { background: rgba(0,191,165,0.15); color: ${T.teal}; border: 1px solid rgba(0,191,165,0.2); }
  .pm-btn-danger { background: rgba(239,68,68,0.15); color: ${T.red}; border: 1px solid rgba(239,68,68,0.2); }
  .pm-project-item { display: flex; align-items: center; gap: 12px; padding: 12px 16px; border-radius: 10px; cursor: pointer; transition: all 0.15s; border: 1px solid transparent; }
  .pm-project-item:hover { background: ${T.surfaceAlt}; border-color: ${T.border}; }
  .pm-project-item.active { background: ${T.goldGlow}; border-color: ${T.gold}; }
  .pm-unit-row { display: grid; grid-template-columns: 80px 1fr 1fr 1fr; gap: 8px; align-items: center; padding: 8px 0; border-bottom: 1px solid ${T.border}; }
  .pm-unit-row:last-child { border-bottom: none; }
  .pm-toast { position: fixed; bottom: 24px; right: 24px; padding: 14px 24px; border-radius: 10px; background: ${T.green}; color: ${T.bg}; font-family: 'Outfit', sans-serif; font-weight: 600; font-size: 13px; z-index: 9999; animation: fadeUp 0.3s ease-out; box-shadow: 0 8px 32px rgba(0,0,0,0.3); }
  .pm-search { width: 100%; padding: 10px 14px 10px 38px; background: ${T.surface}; border: 1px solid ${T.border}; border-radius: 10px; color: ${T.textPrimary}; font-size: 13px; font-family: 'Outfit', sans-serif; outline: none; }
  .pm-search:focus { border-color: ${T.gold}; }
  @media (max-width: 900px) {
    .pm-layout { grid-template-columns: 1fr !important; }
    .pm-sidebar { max-height: 300px; }
  }
`;

export default function ProjectManager() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [selected, setSelected] = useState(null);
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
          const userDoc = await getDoc(doc(db, "users", u.uid));
          if (userDoc.exists() && userDoc.data().role === "admin") setIsAdmin(true);
          else if (!userDoc.exists()) setIsAdmin(true);
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
      snap.forEach(d => list.push({ id: d.id, ...d.data() }));
      list.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
      setProjects(list);
    } catch (err) { console.log("Error:", err); }
  }, []);

  useEffect(() => { if (isAdmin) fetchProjects(); }, [isAdmin, fetchProjects]);

  // Select project
  const selectProject = (p) => {
    setSelected(p);
    setEditData(JSON.parse(JSON.stringify(p)));
  };

  // Update field
  const updateField = (field, value) => {
    setEditData(prev => ({ ...prev, [field]: value }));
  };

  // Update nested unit
  const updateUnit = (index, field, value) => {
    setEditData(prev => {
      const units = [...(prev.units || [])];
      units[index] = { ...units[index], [field]: value };
      return { ...prev, units };
    });
  };

  // Add unit type
  const addUnit = () => {
    setEditData(prev => ({
      ...prev,
      units: [...(prev.units || []), { type: "1BR", available: 0, total: 0, priceFrom: "" }]
    }));
  };

  // Remove unit
  const removeUnit = (index) => {
    setEditData(prev => ({
      ...prev,
      units: (prev.units || []).filter((_, i) => i !== index)
    }));
  };

  // Save
  const handleSave = async () => {
    if (!editData || !selected) return;
    setSaving(true);
    try {
      const { id, ...data } = editData;
      data.lastUpdated = new Date().toISOString();
      // Convert numeric fields
      if (data.priceFrom) data.priceFrom = String(data.priceFrom);
      if (data.pricePerSqft) data.pricePerSqft = String(data.pricePerSqft);
      if (data.constructionProgress) data.constructionProgress = Number(data.constructionProgress);
      if (data.units) {
        data.units = data.units.map(u => ({
          ...u,
          available: Number(u.available) || 0,
          total: Number(u.total) || 0,
        }));
      }
      await setDoc(doc(db, "projects", selected.id), data, { merge: true });
      showToast("✅ Project saved successfully!");
      // Update local state
      setProjects(prev => prev.map(p => p.id === selected.id ? { ...p, ...data } : p));
      setSelected(prev => ({ ...prev, ...data }));
    } catch (err) {
      showToast("❌ Error saving: " + err.message);
    }
    setSaving(false);
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  // Filter projects
  const communities = [...new Set(projects.map(p => p.community))].filter(Boolean).sort();
  const filtered = projects.filter(p => {
    const matchSearch = !search || (p.name || "").toLowerCase().includes(search.toLowerCase()) || (p.community || "").toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || p.community === filter;
    return matchSearch && matchFilter;
  });

  // Loading
  if (loading) return (
    <div style={{ minHeight: "100vh", background: T.bg, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
      <style>{css}</style>
      <svg width="40" height="40" viewBox="0 0 40 40"><rect x="2" y="2" width="36" height="36" rx="8" fill="none" stroke={T.gold} strokeWidth="2" /><path d="M12 28V12h10l-6 8h8l-12 8z" fill={T.gold} /></svg>
      <div style={{ width: 24, height: 24, border: `2px solid ${T.border}`, borderTopColor: T.gold, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
    </div>
  );

  if (!isAdmin) return (
    <div style={{ minHeight: "100vh", background: T.bg, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16, fontFamily: "'Outfit', sans-serif" }}>
      <style>{css}</style>
      <div style={{ fontSize: 48 }}>🔒</div>
      <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 24, color: T.white }}>Admin Access Only</h1>
      <a href="/" style={{ color: T.gold, fontSize: 13, textDecoration: "none" }}>← Back to Dashboard</a>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: T.bg, fontFamily: "'Outfit', sans-serif", color: T.textPrimary }}>
      <style>{css}</style>

      {/* Toast */}
      {toast && <div className="pm-toast">{toast}</div>}

      {/* TOP BAR */}
      <header style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(4,9,15,0.95)", backdropFilter: "blur(20px)", borderBottom: `1px solid ${T.border}`, padding: "12px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <a href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
            <svg width="28" height="28" viewBox="0 0 40 40"><rect x="2" y="2" width="36" height="36" rx="8" fill="none" stroke={T.gold} strokeWidth="2" /><path d="M12 28V12h10l-6 8h8l-12 8z" fill={T.gold} /></svg>
            <span style={{ fontFamily: "'Fraunces', serif", fontSize: 16, fontWeight: 800, color: T.gold }}>DXB Analytics</span>
          </a>
          <span style={{ fontSize: 10, padding: "3px 10px", borderRadius: 6, background: "rgba(139,92,246,0.15)", color: "#8B5CF6", fontWeight: 700, letterSpacing: 0.5 }}>PROJECT MANAGER</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 12, color: T.textMuted }}>{projects.length} projects loaded</span>
          <a href="/" className="pm-btn pm-btn-outline" style={{ padding: "5px 14px", fontSize: 11 }}>← Dashboard</a>
          <a href="/admin" className="pm-btn" style={{ padding: "5px 14px", fontSize: 11, background: T.surfaceAlt, color: T.textSecondary, border: `1px solid ${T.border}`, textDecoration: "none" }}>Admin Panel</a>
        </div>
      </header>

      {/* MAIN LAYOUT */}
      <div className="pm-layout" style={{ display: "grid", gridTemplateColumns: "320px 1fr", height: "calc(100vh - 57px)" }}>

        {/* ─── LEFT SIDEBAR: PROJECT LIST ─── */}
        <div className="pm-sidebar" style={{ borderRight: `1px solid ${T.border}`, overflowY: "auto", padding: "16px" }}>
          <div style={{ marginBottom: 12 }}>
            <div style={{ position: "relative", marginBottom: 8 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={T.textMuted} strokeWidth="2" strokeLinecap="round" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input className="pm-search" placeholder="Search projects..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select className="pm-select" value={filter} onChange={e => setFilter(e.target.value)} style={{ fontSize: 11, padding: "6px 10px" }}>
              <option value="all">All Communities ({projects.length})</option>
              {communities.map(c => (
                <option key={c} value={c}>{c} ({projects.filter(p => p.community === c).length})</option>
              ))}
            </select>
          </div>

          <div style={{ fontSize: 10, color: T.textMuted, padding: "4px 0 8px", letterSpacing: 0.5, textTransform: "uppercase", fontWeight: 600 }}>
            {filtered.length} projects
          </div>

          {filtered.map((p, i) => (
            <div key={p.id} className={`pm-project-item ${selected?.id === p.id ? "active" : ""}`} onClick={() => selectProject(p)} style={{ animationDelay: `${i * 0.02}s` }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: selected?.id === p.id ? T.gold : T.surfaceAlt, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 11, color: selected?.id === p.id ? T.bg : T.textMuted, flexShrink: 0 }}>
                {(p.name || "?").charAt(0)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: selected?.id === p.id ? T.gold : T.white, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</div>
                <div style={{ fontSize: 10, color: T.textMuted }}>{p.community} · {p.status || "—"}</div>
              </div>
              <div style={{ fontSize: 10, color: T.textMuted }}>{p.constructionProgress || 0}%</div>
            </div>
          ))}
        </div>

        {/* ─── RIGHT: EDITOR ─── */}
        <div style={{ overflowY: "auto", padding: "24px 32px" }}>
          {!editData ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", flexDirection: "column", gap: 16 }}>
              <div style={{ fontSize: 48 }}>📋</div>
              <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 22, color: T.white }}>Select a Project</h2>
              <p style={{ color: T.textSecondary, fontSize: 13 }}>Click any project on the left to edit its details</p>
            </div>
          ) : (
            <div style={{ animation: "slideIn 0.3s ease-out" }}>
              {/* Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <div>
                  <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 24, fontWeight: 900, color: T.white }}>{editData.name}</h1>
                  <p style={{ color: T.textSecondary, fontSize: 12, marginTop: 2 }}>{editData.community} · ID: {selected.id}</p>
                  {editData.lastUpdated && <p style={{ color: T.textMuted, fontSize: 10, marginTop: 2 }}>Last saved: {new Date(editData.lastUpdated).toLocaleString()}</p>}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => { setEditData(JSON.parse(JSON.stringify(selected))); showToast("↩️ Changes reset"); }} className="pm-btn pm-btn-outline" style={{ fontSize: 12, padding: "8px 16px" }}>↩ Reset</button>
                  <button onClick={handleSave} disabled={saving} className="pm-btn pm-btn-gold" style={{ fontSize: 12, padding: "8px 24px" }}>
                    {saving ? "Saving..." : "💾 Save Changes"}
                  </button>
                </div>
              </div>

              {/* ─── BASIC INFO ─── */}
              <div className="pm-card" style={{ marginBottom: 16 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: T.gold, marginBottom: 16 }}>🏗️ Basic Information</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div>
                    <label className="pm-label">Project Name</label>
                    <input className="pm-input" value={editData.name || ""} onChange={e => updateField("name", e.target.value)} />
                  </div>
                  <div>
                    <label className="pm-label">Community</label>
                    <input className="pm-input" value={editData.community || ""} onChange={e => updateField("community", e.target.value)} />
                  </div>
                  <div>
                    <label className="pm-label">Status</label>
                    <select className="pm-select" value={editData.status || ""} onChange={e => updateField("status", e.target.value)}>
                      <option value="Building">Building</option>
                      <option value="Off-Plan">Off-Plan</option>
                      <option value="Ready">Ready</option>
                      <option value="Sold Out">Sold Out</option>
                      <option value="Launching">Launching</option>
                    </select>
                  </div>
                  <div>
                    <label className="pm-label">Property Type</label>
                    <input className="pm-input" value={editData.type || ""} onChange={e => updateField("type", e.target.value)} placeholder="e.g. Apartments · 1-3 BR" />
                  </div>
                  <div>
                    <label className="pm-label">Segment</label>
                    <select className="pm-select" value={editData.segment || ""} onChange={e => updateField("segment", e.target.value)}>
                      <option value="Mid-Market">Mid-Market</option>
                      <option value="Mid-Premium">Mid-Premium</option>
                      <option value="Premium">Premium</option>
                      <option value="Ultra-Premium">Ultra-Premium</option>
                      <option value="Luxury">Luxury</option>
                    </select>
                  </div>
                  <div>
                    <label className="pm-label">Branded</label>
                    <input className="pm-input" value={editData.branded || ""} onChange={e => updateField("branded", e.target.value)} placeholder="e.g. Address, Vida, or leave empty" />
                  </div>
                </div>
              </div>

              {/* ─── PRICING ─── */}
              <div className="pm-card" style={{ marginBottom: 16 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: T.gold, marginBottom: 16 }}>💰 Pricing & Payment</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
                  <div>
                    <label className="pm-label">Price From (AED)</label>
                    <input className="pm-input" value={editData.priceFrom || ""} onChange={e => updateField("priceFrom", e.target.value)} placeholder="e.g. 1.8M" />
                  </div>
                  <div>
                    <label className="pm-label">Price/SqFt (AED)</label>
                    <input className="pm-input" value={editData.pricePerSqft || ""} onChange={e => updateField("pricePerSqft", e.target.value)} placeholder="e.g. 2,333" />
                  </div>
                  <div>
                    <label className="pm-label">Size Range (SqFt)</label>
                    <input className="pm-input" value={editData.sizeRange || ""} onChange={e => updateField("sizeRange", e.target.value)} placeholder="e.g. 750 - 2,200 sqft" />
                  </div>
                  <div>
                    <label className="pm-label">Payment Plan</label>
                    <input className="pm-input" value={editData.paymentPlan || ""} onChange={e => updateField("paymentPlan", e.target.value)} placeholder="e.g. 20/30/50" />
                  </div>
                  <div>
                    <label className="pm-label">Handover</label>
                    <input className="pm-input" value={editData.handover || ""} onChange={e => updateField("handover", e.target.value)} placeholder="e.g. Q2 2026" />
                  </div>
                  <div>
                    <label className="pm-label">Construction %</label>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <input className="pm-input" type="number" min="0" max="100" value={editData.constructionProgress || 0} onChange={e => updateField("constructionProgress", e.target.value)} style={{ flex: 1 }} />
                      <div style={{ width: 60, height: 8, borderRadius: 4, background: T.surfaceAlt, overflow: "hidden" }}>
                        <div style={{ width: `${editData.constructionProgress || 0}%`, height: "100%", borderRadius: 4, background: (editData.constructionProgress || 0) >= 80 ? T.green : T.gold, transition: "width 0.3s" }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ─── UNIT INVENTORY ─── */}
              <div className="pm-card" style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: T.gold }}>🏠 Unit Inventory</h3>
                  <button onClick={addUnit} className="pm-btn pm-btn-teal" style={{ padding: "5px 14px", fontSize: 11 }}>+ Add Unit Type</button>
                </div>

                {/* Headers */}
                <div className="pm-unit-row" style={{ borderBottom: `2px solid ${T.border}` }}>
                  <span style={{ fontSize: 10, fontWeight: 600, color: T.textMuted, letterSpacing: 0.5, textTransform: "uppercase" }}>Type</span>
                  <span style={{ fontSize: 10, fontWeight: 600, color: T.textMuted, letterSpacing: 0.5, textTransform: "uppercase" }}>Available</span>
                  <span style={{ fontSize: 10, fontWeight: 600, color: T.textMuted, letterSpacing: 0.5, textTransform: "uppercase" }}>Total</span>
                  <span style={{ fontSize: 10, fontWeight: 600, color: T.textMuted, letterSpacing: 0.5, textTransform: "uppercase" }}>Actions</span>
                </div>

                {(editData.units || []).length === 0 ? (
                  <div style={{ textAlign: "center", padding: 24, color: T.textMuted, fontSize: 12 }}>No units added. Click "Add Unit Type" to start.</div>
                ) : (
                  (editData.units || []).map((unit, i) => (
                    <div key={i} className="pm-unit-row">
                      <select className="pm-select" value={unit.type || ""} onChange={e => updateUnit(i, "type", e.target.value)} style={{ fontSize: 12, padding: "6px 8px" }}>
                        <option value="STUDIO">Studio</option>
                        <option value="1BR">1BR</option>
                        <option value="2BR">2BR</option>
                        <option value="3BR">3BR</option>
                        <option value="4BR">4BR</option>
                        <option value="5BR">5BR</option>
                        <option value="PENTHOUSE">Penthouse</option>
                        <option value="TOWNHOUSE">Townhouse</option>
                        <option value="VILLA">Villa</option>
                        <option value="DUPLEX">Duplex</option>
                      </select>
                      <input className="pm-input" type="number" min="0" value={unit.available || 0} onChange={e => updateUnit(i, "available", e.target.value)} style={{ fontSize: 12, padding: "6px 8px" }} />
                      <input className="pm-input" type="number" min="0" value={unit.total || 0} onChange={e => updateUnit(i, "total", e.target.value)} style={{ fontSize: 12, padding: "6px 8px" }} />
                      <button onClick={() => removeUnit(i)} className="pm-btn pm-btn-danger" style={{ padding: "4px 10px", fontSize: 10 }}>✕ Remove</button>
                    </div>
                  ))
                )}

                {/* Inventory Summary */}
                {(editData.units || []).length > 0 && (
                  <div style={{ marginTop: 12, padding: "10px 12px", borderRadius: 8, background: T.surfaceAlt, display: "flex", gap: 24 }}>
                    <span style={{ fontSize: 11, color: T.textSecondary }}>
                      Total Available: <strong style={{ color: T.green }}>{(editData.units || []).reduce((s, u) => s + (Number(u.available) || 0), 0)}</strong>
                    </span>
                    <span style={{ fontSize: 11, color: T.textSecondary }}>
                      Total Units: <strong style={{ color: T.white }}>{(editData.units || []).reduce((s, u) => s + (Number(u.total) || 0), 0)}</strong>
                    </span>
                    <span style={{ fontSize: 11, color: T.textSecondary }}>
                      Sold: <strong style={{ color: T.gold }}>{(editData.units || []).reduce((s, u) => s + ((Number(u.total) || 0) - (Number(u.available) || 0)), 0)}</strong>
                    </span>
                  </div>
                )}
              </div>

              {/* ─── CONTACT & DETAILS ─── */}
              <div className="pm-card" style={{ marginBottom: 16 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: T.gold, marginBottom: 16 }}>📋 Additional Details</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div>
                    <label className="pm-label">WhatsApp Number</label>
                    <input className="pm-input" value={editData.whatsapp || ""} onChange={e => updateField("whatsapp", e.target.value)} placeholder="+971..." />
                  </div>
                  <div>
                    <label className="pm-label">Email</label>
                    <input className="pm-input" value={editData.email || ""} onChange={e => updateField("email", e.target.value)} placeholder="sales@..." />
                  </div>
                  <div>
                    <label className="pm-label">Phone</label>
                    <input className="pm-input" value={editData.phone || ""} onChange={e => updateField("phone", e.target.value)} placeholder="+971..." />
                  </div>
                  <div>
                    <label className="pm-label">Image URL</label>
                    <input className="pm-input" value={editData.imageUrl || ""} onChange={e => updateField("imageUrl", e.target.value)} placeholder="https://..." />
                  </div>
                </div>
                <div style={{ marginTop: 16 }}>
                  <label className="pm-label">Description / Notes</label>
                  <textarea className="pm-input" value={editData.description || ""} onChange={e => updateField("description", e.target.value)} placeholder="Project highlights, special notes..." rows={3} style={{ resize: "vertical" }} />
                </div>
              </div>

              {/* ─── LOCATION ─── */}
              <div className="pm-card" style={{ marginBottom: 16 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: T.gold, marginBottom: 16 }}>📍 Location Data</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
                  <div>
                    <label className="pm-label">Latitude</label>
                    <input className="pm-input" value={editData.lat || ""} onChange={e => updateField("lat", e.target.value)} placeholder="25.xxxxx" />
                  </div>
                  <div>
                    <label className="pm-label">Longitude</label>
                    <input className="pm-input" value={editData.lng || ""} onChange={e => updateField("lng", e.target.value)} placeholder="55.xxxxx" />
                  </div>
                  <div>
                    <label className="pm-label">Area (Location)</label>
                    <input className="pm-input" value={editData.area || ""} onChange={e => updateField("area", e.target.value)} placeholder="e.g. Dubai Marina" />
                  </div>
                </div>
              </div>

              {/* Bottom save */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, padding: "16px 0 40px" }}>
                <button onClick={() => { setEditData(JSON.parse(JSON.stringify(selected))); showToast("↩️ Changes reset"); }} className="pm-btn pm-btn-outline">↩ Reset Changes</button>
                <button onClick={handleSave} disabled={saving} className="pm-btn pm-btn-gold" style={{ padding: "10px 32px" }}>
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
