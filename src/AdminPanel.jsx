import React, { useState, useEffect } from "react";
import { db, auth } from "./firebase";
import { collection, getDocs, doc, updateDoc, orderBy, query } from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";

const T = {
  bg: "#04090F", surface: "#0A1628", surfaceAlt: "#0E1D35", card: "#0D1B30",
  gold: "#D4A843", goldLight: "#E8C96A", teal: "#00BFA5",
  textPrimary: "#E2E8F0", textSecondary: "#94A3B8", textMuted: "#64748B",
  border: "rgba(212,168,67,0.12)", red: "#EF4444", green: "#10B981", blue: "#3B82F6",
};

const ADMIN_EMAILS = ["mianwaleed689@gmail.com", "waleed@tad.com"];

export default function AdminPanel() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => { setUser(u); setLoading(false); });
    return () => unsub();
  }, []);

  useEffect(() => { if (user) loadProjects(); }, [user]);

  const loadProjects = async () => {
    const snap = await getDocs(query(collection(db, "projects"), orderBy("id")));
    setProjects(snap.docs.map(d => ({ docId: d.id, ...d.data() })));
  };

  const saveProject = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const { docId, ...data } = selected;
      await updateDoc(doc(db, "projects", docId), { ...data, updatedAt: new Date().toISOString() });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      loadProjects();
    } catch (err) { console.error(err); alert("Error saving: " + err.message); }
    setSaving(false);
  };

  const updateUnit = (unitType, field, value) => {
    setSelected(prev => ({
      ...prev,
      units: { ...prev.units, [unitType]: { ...prev.units[unitType], [field]: parseInt(value) || 0 } }
    }));
  };

  if (loading) return <div style={{ padding: 40, color: T.gold, background: T.bg, minHeight: "100vh", fontFamily: "'Outfit', sans-serif" }}>Loading...</div>;

  if (!user || !ADMIN_EMAILS.includes(user.email)) {
    return (
      <div style={{ padding: 40, background: T.bg, minHeight: "100vh", fontFamily: "'Outfit', sans-serif", color: T.textPrimary, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
          <h2 style={{ color: T.gold }}>Admin Access Only</h2>
          <p style={{ color: T.textSecondary, marginTop: 8 }}>Please log in to the main dashboard first, then access /admin</p>
        </div>
      </div>
    );
  }

  const filtered = projects.filter(p => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.community.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "All" || p.status === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: T.bg, fontFamily: "'Outfit', sans-serif", color: T.textPrimary }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=Fraunces:opsz,wght@9..144,700;9..144,900&display=swap');
        * { box-sizing: border-box; } input,select { font-family: 'Outfit', sans-serif; }
        input:focus, select:focus { outline: none; border-color: ${T.gold} !important; }
        ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-track { background: ${T.bg}; } ::-webkit-scrollbar-thumb { background: ${T.gold}30; border-radius: 3px; }
      `}</style>

      {/* LEFT: Project List */}
      <div style={{ width: 360, borderRight: `1px solid ${T.border}`, display: "flex", flexDirection: "column", flexShrink: 0 }}>
        <div style={{ padding: 20, borderBottom: `1px solid ${T.border}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div>
              <h1 style={{ fontSize: 18, fontFamily: "'Fraunces', serif", color: T.gold, margin: 0 }}>⚙️ Admin Panel</h1>
              <p style={{ fontSize: 11, color: T.textMuted, margin: "4px 0 0" }}>{projects.length} projects · Firestore Live</p>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <a href="/" style={{ padding: "6px 12px", background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 6, color: T.textSecondary, fontSize: 11, textDecoration: "none" }}>← Dashboard</a>
              <button onClick={() => signOut(auth)} style={{ padding: "6px 12px", background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 6, color: T.red, fontSize: 11, cursor: "pointer" }}>Logout</button>
            </div>
          </div>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search projects..." style={{ width: "100%", padding: "8px 12px", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, color: T.textPrimary, fontSize: 13 }} />
          <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
            {["All", "Under Construction", "Off-Plan", "Completed"].map(s => (
              <button key={s} onClick={() => setFilterStatus(s)} style={{ padding: "4px 10px", borderRadius: 6, border: `1px solid ${filterStatus === s ? T.gold : T.border}`, background: filterStatus === s ? "rgba(212,168,67,0.1)" : "transparent", color: filterStatus === s ? T.gold : T.textMuted, fontSize: 10, cursor: "pointer" }}>
                {s === "Under Construction" ? "Building" : s}
              </button>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "8px" }}>
          {filtered.map(p => (
            <div key={p.docId} onClick={() => { setSelected({...p}); setSaved(false); }}
              style={{ padding: "12px 14px", borderRadius: 10, marginBottom: 4, cursor: "pointer", transition: "all 0.15s",
                background: selected?.docId === p.docId ? "rgba(212,168,67,0.1)" : "transparent",
                border: `1px solid ${selected?.docId === p.docId ? T.gold : "transparent"}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: selected?.docId === p.docId ? T.gold : T.textPrimary }}>{p.name}</div>
                  <div style={{ fontSize: 10, color: T.textMuted, marginTop: 2 }}>{p.community} · {p.district}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: p.construction >= 70 ? T.green : p.construction >= 30 ? T.gold : T.blue }}>{p.construction}%</div>
                  <div style={{ fontSize: 9, color: p.status === "Completed" ? T.green : p.status === "Under Construction" ? T.teal : T.blue }}>{p.status === "Under Construction" ? "Building" : p.status}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT: Edit Panel */}
      <div style={{ flex: 1, overflowY: "auto", padding: 30 }}>
        {!selected ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: T.textMuted }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
              <p>Select a project from the left to edit</p>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
              <div>
                <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 24, color: T.gold, margin: 0 }}>{selected.name}</h2>
                <p style={{ color: T.textSecondary, fontSize: 13, marginTop: 4 }}>{selected.community} · {selected.district} · ID: {selected.id}</p>
              </div>
              <button onClick={saveProject} disabled={saving}
                style={{ padding: "10px 24px", background: saved ? T.green : T.gold, border: "none", borderRadius: 8, color: "#04090F", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                {saving ? "Saving..." : saved ? "✅ Saved!" : "💾 Save Changes"}
              </button>
            </div>

            {/* Status & Construction */}
            <div style={{ background: T.surface, borderRadius: 12, padding: 20, border: `1px solid ${T.border}`, marginBottom: 16 }}>
              <h3 style={{ color: T.goldLight, fontSize: 12, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", marginBottom: 16 }}>Status & Progress</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
                <div>
                  <label style={{ fontSize: 11, color: T.textMuted, display: "block", marginBottom: 4 }}>STATUS</label>
                  <select value={selected.status} onChange={e => setSelected({...selected, status: e.target.value})}
                    style={{ width: "100%", padding: "10px 12px", background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8, color: T.textPrimary, fontSize: 13 }}>
                    <option value="Off-Plan">Off-Plan</option>
                    <option value="Under Construction">Under Construction</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 11, color: T.textMuted, display: "block", marginBottom: 4 }}>CONSTRUCTION %</label>
                  <input type="number" min="0" max="100" value={selected.construction}
                    onChange={e => setSelected({...selected, construction: parseInt(e.target.value) || 0})}
                    style={{ width: "100%", padding: "10px 12px", background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8, color: T.textPrimary, fontSize: 13 }} />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: T.textMuted, display: "block", marginBottom: 4 }}>HANDOVER</label>
                  <input value={selected.handover} onChange={e => setSelected({...selected, handover: e.target.value})}
                    style={{ width: "100%", padding: "10px 12px", background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8, color: T.textPrimary, fontSize: 13 }} />
                </div>
              </div>
              {/* Progress Bar Preview */}
              <div style={{ marginTop: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: 11, color: T.textMuted }}>Construction Progress</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: selected.construction >= 70 ? T.green : selected.construction >= 30 ? T.gold : T.blue }}>{selected.construction}%</span>
                </div>
                <div style={{ height: 8, borderRadius: 4, background: T.surfaceAlt, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${selected.construction}%`, borderRadius: 4, background: selected.construction >= 70 ? T.green : selected.construction >= 30 ? T.gold : T.blue, transition: "width 0.3s" }} />
                </div>
              </div>
            </div>

            {/* Pricing */}
            <div style={{ background: T.surface, borderRadius: 12, padding: 20, border: `1px solid ${T.border}`, marginBottom: 16 }}>
              <h3 style={{ color: T.goldLight, fontSize: 12, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", marginBottom: 16 }}>Pricing & Details</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 16 }}>
                <div>
                  <label style={{ fontSize: 11, color: T.textMuted, display: "block", marginBottom: 4 }}>STARTING PRICE (AED)</label>
                  <input type="number" value={selected.price || ""} onChange={e => setSelected({...selected, price: parseInt(e.target.value) || null})}
                    style={{ width: "100%", padding: "10px 12px", background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8, color: T.textPrimary, fontSize: 13 }} />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: T.textMuted, display: "block", marginBottom: 4 }}>PRICE/SQFT</label>
                  <input type="number" value={selected.ppsf || ""} onChange={e => setSelected({...selected, ppsf: parseInt(e.target.value) || null})}
                    style={{ width: "100%", padding: "10px 12px", background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8, color: T.textPrimary, fontSize: 13 }} />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: T.textMuted, display: "block", marginBottom: 4 }}>PAYMENT PLAN</label>
                  <input value={selected.payment} onChange={e => setSelected({...selected, payment: e.target.value})}
                    style={{ width: "100%", padding: "10px 12px", background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8, color: T.textPrimary, fontSize: 13 }} />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: T.textMuted, display: "block", marginBottom: 4 }}>TIER</label>
                  <select value={selected.tier} onChange={e => setSelected({...selected, tier: e.target.value})}
                    style={{ width: "100%", padding: "10px 12px", background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8, color: T.textPrimary, fontSize: 13 }}>
                    {["Affordable","Mid-Market","Mid-Premium","Premium","Luxury","Luxury Branded","Ultra-Luxury","Ultra-Lux Branded"].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* UNIT INVENTORY — THE KEY FEATURE */}
            <div style={{ background: T.surface, borderRadius: 12, padding: 20, border: `1px solid ${T.border}`, marginBottom: 16 }}>
              <h3 style={{ color: T.goldLight, fontSize: 12, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", marginBottom: 16 }}>📊 Unit Inventory</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12 }}>
                {selected.units && Object.entries(selected.units).map(([unitType, data]) => {
                  const available = (data.total || 0) - (data.sold || 0);
                  const pctSold = data.total > 0 ? (data.sold / data.total) * 100 : 0;
                  return (
                    <div key={unitType} style={{ background: T.surfaceAlt, borderRadius: 10, padding: 14, border: `1px solid ${T.border}` }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: T.gold, textTransform: "uppercase", marginBottom: 10 }}>{unitType}</div>
                      <div style={{ marginBottom: 8 }}>
                        <label style={{ fontSize: 10, color: T.textMuted }}>TOTAL UNITS</label>
                        <input type="number" min="0" value={data.total} onChange={e => updateUnit(unitType, "total", e.target.value)}
                          style={{ width: "100%", padding: "6px 10px", background: T.bg, border: `1px solid ${T.border}`, borderRadius: 6, color: T.textPrimary, fontSize: 13, marginTop: 2 }} />
                      </div>
                      <div style={{ marginBottom: 8 }}>
                        <label style={{ fontSize: 10, color: T.textMuted }}>SOLD</label>
                        <input type="number" min="0" max={data.total} value={data.sold} onChange={e => updateUnit(unitType, "sold", e.target.value)}
                          style={{ width: "100%", padding: "6px 10px", background: T.bg, border: `1px solid ${T.border}`, borderRadius: 6, color: T.textPrimary, fontSize: 13, marginTop: 2 }} />
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 6 }}>
                        <span style={{ color: T.green, fontWeight: 600 }}>{available} available</span>
                        <span style={{ color: T.textMuted }}>{pctSold.toFixed(0)}% sold</span>
                      </div>
                      <div style={{ height: 4, borderRadius: 2, background: T.bg, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${pctSold}%`, borderRadius: 2, background: pctSold >= 80 ? T.red : pctSold >= 50 ? T.gold : T.green }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Last Updated */}
            {selected.updatedAt && (
              <p style={{ fontSize: 11, color: T.textMuted, textAlign: "right" }}>
                Last updated: {new Date(selected.updatedAt).toLocaleString()}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
