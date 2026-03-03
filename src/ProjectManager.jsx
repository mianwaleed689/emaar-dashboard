import React, { useState, useEffect } from "react";
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

// Safe extract: convert all Firestore types to plain JS
function plainify(obj) {
  if (obj === null || obj === undefined) return "";
  if (typeof obj === "string" || typeof obj === "number" || typeof obj === "boolean") return obj;
  if (typeof obj.toDate === "function") return obj.toDate().toISOString();
  if (Array.isArray(obj)) return obj.map(plainify);
  if (typeof obj === "object") {
    const out = {};
    Object.keys(obj).forEach(k => { out[k] = plainify(obj[k]); });
    return out;
  }
  return String(obj);
}

export default function ProjectManager() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");
  const [search, setSearch] = useState("");

  // Auth
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        try {
          const snap = await getDoc(doc(db, "users", u.uid));
          if (snap.exists() && snap.data().role === "admin") setIsAdmin(true);
          else if (!snap.exists()) setIsAdmin(true);
        } catch { setIsAdmin(true); }
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // Fetch
  useEffect(() => {
    if (!isAdmin) return;
    (async () => {
      try {
        const snap = await getDocs(collection(db, "projects"));
        const list = [];
        snap.forEach(d => list.push({ id: d.id, ...plainify(d.data()) }));
        list.sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));
        setProjects(list);
      } catch (e) { console.error("Fetch error:", e); }
    })();
  }, [isAdmin]);

  // Click project
  function handleSelect(id) {
    console.log("Clicked:", id);
    setSelectedId(id);
    const proj = projects.find(p => p.id === id);
    if (proj) {
      setForm({
        name: proj.name || "",
        community: proj.community || "",
        status: proj.status || "Off-Plan",
        type: proj.type || "",
        segment: proj.segment || "",
        branded: proj.branded || "",
        priceFrom: proj.priceFrom || "",
        pricePerSqft: proj.pricePerSqft || "",
        sizeRange: proj.sizeRange || "",
        paymentPlan: proj.paymentPlan || "",
        handover: proj.handover || "",
        constructionProgress: proj.constructionProgress || 0,
        whatsapp: proj.whatsapp || "",
        email: proj.email || "",
        phone: proj.phone || "",
        imageUrl: proj.imageUrl || "",
        description: proj.description || "",
        lat: proj.lat || "",
        lng: proj.lng || "",
        area: proj.area || "",
        units: Array.isArray(proj.units) ? proj.units.map(u => ({
          type: u.type || "1BR",
          available: u.available || 0,
          total: u.total || 0,
        })) : [],
      });
    }
  }

  // Update field
  function setField(key, val) {
    setForm(prev => ({ ...prev, [key]: val }));
  }

  // Unit helpers
  function setUnit(i, key, val) {
    setForm(prev => {
      const units = [...prev.units];
      units[i] = { ...units[i], [key]: val };
      return { ...prev, units };
    });
  }
  function addUnit() {
    setForm(prev => ({ ...prev, units: [...prev.units, { type: "1BR", available: 0, total: 0 }] }));
  }
  function removeUnit(i) {
    setForm(prev => ({ ...prev, units: prev.units.filter((_, idx) => idx !== i) }));
  }

  // Save
  async function handleSave() {
    if (!form || !selectedId) return;
    setSaving(true);
    try {
      const data = { ...form, lastUpdated: new Date().toISOString(), constructionProgress: Number(form.constructionProgress) || 0 };
      data.units = (data.units || []).map(u => ({ type: u.type, available: Number(u.available) || 0, total: Number(u.total) || 0 }));
      await setDoc(doc(db, "projects", selectedId), data, { merge: true });
      setProjects(prev => prev.map(p => p.id === selectedId ? { ...p, ...data } : p));
      showToast("✅ Saved!");
    } catch (e) { showToast("❌ Error: " + e.message); }
    setSaving(false);
  }

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(""), 3000); }

  const filtered = projects.filter(p =>
    !search || (p.name || "").toLowerCase().includes(search.toLowerCase()) || (p.community || "").toLowerCase().includes(search.toLowerCase())
  );

  // ─── RENDER ───

  if (loading) return (
    <div style={{ minHeight: "100vh", background: T.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Outfit',sans-serif" }}>
      <div style={{ color: T.gold, fontSize: 18 }}>Loading...</div>
    </div>
  );

  if (!isAdmin) return (
    <div style={{ minHeight: "100vh", background: T.bg, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16, fontFamily: "'Outfit',sans-serif" }}>
      <div style={{ fontSize: 48 }}>🔒</div>
      <h1 style={{ color: T.white, fontSize: 24 }}>Admin Only</h1>
      <a href="/" style={{ color: T.gold }}>← Dashboard</a>
    </div>
  );

  // Input component
  const Field = ({ label, value, onChange, placeholder, type, rows }) => (
    <div style={{ marginBottom: 12 }}>
      <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: T.textMuted, marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</label>
      {rows ? (
        <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows}
          style={{ width: "100%", padding: "8px 12px", background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8, color: T.textPrimary, fontSize: 13, fontFamily: "'Outfit',sans-serif", outline: "none", resize: "vertical" }} />
      ) : (
        <input type={type || "text"} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
          style={{ width: "100%", padding: "8px 12px", background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8, color: T.textPrimary, fontSize: 13, fontFamily: "'Outfit',sans-serif", outline: "none" }} />
      )}
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: T.bg, fontFamily: "'Outfit',sans-serif", color: T.textPrimary }}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700;9..144,900&display=swap" rel="stylesheet" />

      {/* Toast */}
      {toast && <div style={{ position: "fixed", bottom: 24, right: 24, padding: "12px 24px", borderRadius: 10, background: toast.includes("✅") ? T.green : T.red, color: T.white, fontWeight: 600, fontSize: 13, zIndex: 9999, boxShadow: "0 8px 32px rgba(0,0,0,0.3)" }}>{toast}</div>}

      {/* Header */}
      <div style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(4,9,15,0.95)", backdropFilter: "blur(20px)", borderBottom: `1px solid ${T.border}`, padding: "12px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <svg width="24" height="24" viewBox="0 0 40 40"><rect x="2" y="2" width="36" height="36" rx="8" fill="none" stroke={T.gold} strokeWidth="2" /><path d="M12 28V12h10l-6 8h8l-12 8z" fill={T.gold} /></svg>
          <span style={{ fontFamily: "'Fraunces',serif", fontSize: 15, fontWeight: 800, color: T.gold }}>DXB Analytics</span>
          <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, background: "rgba(139,92,246,0.15)", color: "#8B5CF6", fontWeight: 700 }}>PROJECT MANAGER</span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <span style={{ fontSize: 12, color: T.textMuted, lineHeight: "32px" }}>{projects.length} projects</span>
          <a href="/" style={{ fontSize: 12, color: T.gold, textDecoration: "none", padding: "6px 14px", border: `1px solid ${T.gold}`, borderRadius: 8 }}>← Dashboard</a>
          <a href="/admin" style={{ fontSize: 12, color: T.textSecondary, textDecoration: "none", padding: "6px 14px", border: `1px solid ${T.border}`, borderRadius: 8 }}>Admin</a>
        </div>
      </div>

      {/* Layout */}
      <div style={{ display: "flex", height: "calc(100vh - 57px)" }}>

        {/* LEFT: Project List */}
        <div style={{ width: 280, borderRight: `1px solid ${T.border}`, overflowY: "auto", padding: 12, flexShrink: 0 }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..."
            style={{ width: "100%", padding: "8px 12px", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, color: T.textPrimary, fontSize: 13, fontFamily: "'Outfit',sans-serif", outline: "none", marginBottom: 8 }} />
          <div style={{ fontSize: 10, color: T.textMuted, padding: "4px 0 8px", fontWeight: 600 }}>{filtered.length} PROJECTS</div>

          {filtered.map(p => (
            <div
              key={p.id}
              onClick={() => handleSelect(p.id)}
              style={{
                display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 8, cursor: "pointer",
                marginBottom: 2,
                background: selectedId === p.id ? T.goldGlow : "transparent",
                border: `1px solid ${selectedId === p.id ? T.gold : "transparent"}`,
              }}
              onMouseEnter={e => { if (selectedId !== p.id) e.currentTarget.style.background = T.surfaceAlt; }}
              onMouseLeave={e => { if (selectedId !== p.id) e.currentTarget.style.background = "transparent"; }}
            >
              <div style={{
                width: 32, height: 32, borderRadius: 6, flexShrink: 0,
                background: selectedId === p.id ? T.gold : T.surfaceAlt,
                color: selectedId === p.id ? T.bg : T.textMuted,
                display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 11,
              }}>
                {(p.name || "?")[0]}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: selectedId === p.id ? T.gold : T.white, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</div>
                <div style={{ fontSize: 10, color: T.textMuted }}>{p.community} · {p.status || "—"}</div>
              </div>
            </div>
          ))}
        </div>

        {/* RIGHT: Editor */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px 32px" }}>
          {!form ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", flexDirection: "column", gap: 12 }}>
              <div style={{ fontSize: 48 }}>📋</div>
              <h2 style={{ fontFamily: "'Fraunces',serif", fontSize: 22, color: T.white }}>Select a Project</h2>
              <p style={{ color: T.textSecondary, fontSize: 13 }}>Click any project on the left to edit</p>
            </div>
          ) : (
            <div>
              {/* Title + Save */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <div>
                  <h1 style={{ fontFamily: "'Fraunces',serif", fontSize: 24, fontWeight: 900, color: T.white }}>{form.name || "Untitled"}</h1>
                  <p style={{ color: T.textMuted, fontSize: 12 }}>{form.community} · {selectedId}</p>
                </div>
                <button onClick={handleSave} disabled={saving}
                  style={{ padding: "10px 28px", borderRadius: 8, border: "none", background: `linear-gradient(135deg, ${T.gold}, ${T.goldLight})`, color: T.bg, fontWeight: 700, fontSize: 13, cursor: saving ? "wait" : "pointer", fontFamily: "'Outfit',sans-serif" }}>
                  {saving ? "Saving..." : "💾 Save Changes"}
                </button>
              </div>

              {/* ─── BASIC INFO ─── */}
              <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, padding: 20, marginBottom: 16 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: T.gold, marginBottom: 16 }}>🏗️ Basic Information</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
                  <Field label="Project Name" value={form.name} onChange={v => setField("name", v)} />
                  <Field label="Community" value={form.community} onChange={v => setField("community", v)} />
                  <div style={{ marginBottom: 12 }}>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: T.textMuted, marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>Status</label>
                    <select value={form.status} onChange={e => setField("status", e.target.value)}
                      style={{ width: "100%", padding: "8px 12px", background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8, color: T.textPrimary, fontSize: 13, fontFamily: "'Outfit',sans-serif" }}>
                      <option value="Off-Plan">Off-Plan</option>
                      <option value="Under Construction">Under Construction</option>
                      <option value="Ready">Ready</option>
                      <option value="Sold Out">Sold Out</option>
                      <option value="Launching">Launching</option>
                    </select>
                  </div>
                  <Field label="Property Type" value={form.type} onChange={v => setField("type", v)} placeholder="e.g. Apartments · 1-3 BR" />
                  <div style={{ marginBottom: 12 }}>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: T.textMuted, marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>Segment</label>
                    <select value={form.segment} onChange={e => setField("segment", e.target.value)}
                      style={{ width: "100%", padding: "8px 12px", background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8, color: T.textPrimary, fontSize: 13, fontFamily: "'Outfit',sans-serif" }}>
                      <option value="Mid-Market">Mid-Market</option>
                      <option value="Mid-Premium">Mid-Premium</option>
                      <option value="Premium">Premium</option>
                      <option value="Ultra-Premium">Ultra-Premium</option>
                      <option value="Luxury">Luxury</option>
                    </select>
                  </div>
                  <Field label="Branded" value={form.branded} onChange={v => setField("branded", v)} placeholder="Address, Vida, etc." />
                </div>
              </div>

              {/* ─── PRICING ─── */}
              <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, padding: 20, marginBottom: 16 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: T.gold, marginBottom: 16 }}>💰 Pricing & Payment</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0 16px" }}>
                  <Field label="Price From (AED)" value={form.priceFrom} onChange={v => setField("priceFrom", v)} placeholder="1.8M" />
                  <Field label="Price/SqFt (AED)" value={form.pricePerSqft} onChange={v => setField("pricePerSqft", v)} placeholder="2,333" />
                  <Field label="Size Range" value={form.sizeRange} onChange={v => setField("sizeRange", v)} placeholder="750 - 2,200 sqft" />
                  <Field label="Payment Plan" value={form.paymentPlan} onChange={v => setField("paymentPlan", v)} placeholder="20/30/50" />
                  <Field label="Handover" value={form.handover} onChange={v => setField("handover", v)} placeholder="Q2 2026" />
                  <Field label="Construction %" value={form.constructionProgress} onChange={v => setField("constructionProgress", v)} type="number" />
                </div>
              </div>

              {/* ─── UNITS ─── */}
              <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, padding: 20, marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: T.gold }}>🏠 Unit Inventory</h3>
                  <button onClick={addUnit} style={{ padding: "5px 14px", fontSize: 11, borderRadius: 6, border: `1px solid rgba(0,191,165,0.3)`, background: "rgba(0,191,165,0.1)", color: T.teal, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>+ Add Unit</button>
                </div>
                {form.units.length === 0 && <p style={{ color: T.textMuted, fontSize: 12, textAlign: "center", padding: 20 }}>No units. Click "+ Add Unit" to start.</p>}
                {form.units.map((u, i) => (
                  <div key={i} style={{ display: "grid", gridTemplateColumns: "100px 1fr 1fr auto", gap: 8, alignItems: "center", padding: "8px 0", borderBottom: i < form.units.length - 1 ? `1px solid ${T.border}` : "none" }}>
                    <select value={u.type} onChange={e => setUnit(i, "type", e.target.value)}
                      style={{ padding: "6px 8px", background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 6, color: T.textPrimary, fontSize: 12, fontFamily: "'Outfit',sans-serif" }}>
                      {["STUDIO","1BR","2BR","3BR","4BR","5BR","PENTHOUSE","TOWNHOUSE","VILLA","DUPLEX"].map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <div>
                      <span style={{ fontSize: 10, color: T.textMuted }}>Available</span>
                      <input type="number" min="0" value={u.available} onChange={e => setUnit(i, "available", e.target.value)}
                        style={{ width: "100%", padding: "6px 8px", background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 6, color: T.textPrimary, fontSize: 12, fontFamily: "'Outfit',sans-serif", outline: "none" }} />
                    </div>
                    <div>
                      <span style={{ fontSize: 10, color: T.textMuted }}>Total</span>
                      <input type="number" min="0" value={u.total} onChange={e => setUnit(i, "total", e.target.value)}
                        style={{ width: "100%", padding: "6px 8px", background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 6, color: T.textPrimary, fontSize: 12, fontFamily: "'Outfit',sans-serif", outline: "none" }} />
                    </div>
                    <button onClick={() => removeUnit(i)} style={{ padding: "4px 8px", background: "rgba(239,68,68,0.1)", color: T.red, border: `1px solid rgba(239,68,68,0.2)`, borderRadius: 6, cursor: "pointer", fontSize: 10, fontWeight: 600, fontFamily: "'Outfit',sans-serif" }}>✕</button>
                  </div>
                ))}
                {form.units.length > 0 && (
                  <div style={{ marginTop: 10, padding: "8px 12px", borderRadius: 6, background: T.surfaceAlt, fontSize: 11, color: T.textSecondary }}>
                    Available: <strong style={{ color: T.green }}>{form.units.reduce((s, u) => s + (Number(u.available) || 0), 0)}</strong> · Total: <strong style={{ color: T.white }}>{form.units.reduce((s, u) => s + (Number(u.total) || 0), 0)}</strong> · Sold: <strong style={{ color: T.gold }}>{form.units.reduce((s, u) => s + ((Number(u.total) || 0) - (Number(u.available) || 0)), 0)}</strong>
                  </div>
                )}
              </div>

              {/* ─── CONTACT ─── */}
              <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, padding: 20, marginBottom: 16 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: T.gold, marginBottom: 16 }}>📋 Contact & Details</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
                  <Field label="WhatsApp" value={form.whatsapp} onChange={v => setField("whatsapp", v)} placeholder="+971..." />
                  <Field label="Email" value={form.email} onChange={v => setField("email", v)} placeholder="sales@..." />
                  <Field label="Phone" value={form.phone} onChange={v => setField("phone", v)} placeholder="+971..." />
                  <Field label="Image URL" value={form.imageUrl} onChange={v => setField("imageUrl", v)} placeholder="https://..." />
                </div>
                <Field label="Description" value={form.description} onChange={v => setField("description", v)} placeholder="Notes..." rows={3} />
              </div>

              {/* ─── LOCATION ─── */}
              <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, padding: 20, marginBottom: 16 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: T.gold, marginBottom: 16 }}>📍 Location</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0 16px" }}>
                  <Field label="Latitude" value={form.lat} onChange={v => setField("lat", v)} placeholder="25.xxxxx" />
                  <Field label="Longitude" value={form.lng} onChange={v => setField("lng", v)} placeholder="55.xxxxx" />
                  <Field label="Area" value={form.area} onChange={v => setField("area", v)} placeholder="Dubai Marina" />
                </div>
              </div>

              {/* Bottom Save */}
              <div style={{ display: "flex", justifyContent: "flex-end", paddingBottom: 40 }}>
                <button onClick={handleSave} disabled={saving}
                  style={{ padding: "12px 32px", borderRadius: 8, border: "none", background: `linear-gradient(135deg, ${T.gold}, ${T.goldLight})`, color: T.bg, fontWeight: 700, fontSize: 14, cursor: saving ? "wait" : "pointer", fontFamily: "'Outfit',sans-serif" }}>
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
