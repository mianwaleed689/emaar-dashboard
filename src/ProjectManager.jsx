import React, { useState, useEffect } from "react";
import { auth, db } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs, doc, getDoc, setDoc } from "firebase/firestore";

/* ─── THEME ─── */
const T = {
  bg: "#04090F", surface: "#0A1628", surfaceAlt: "#0E1D35",
  gold: "#D4A843", goldLight: "#E8C96A", goldDim: "#B8912F",
  goldGlow: "rgba(212,168,67,0.12)", goldBorder: "rgba(212,168,67,0.2)",
  teal: "#00BFA5", white: "#FFFFFF",
  textPrimary: "#E2E8F0", textSecondary: "#94A3B8", textMuted: "#64748B",
  border: "rgba(212,168,67,0.08)", borderHover: "rgba(212,168,67,0.2)",
  red: "#EF4444", green: "#10B981", blue: "#3B82F6", purple: "#8B5CF6",
};

/* ─── STYLES ─── */
const css = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700;9..144,900&display=swap');
*{margin:0;padding:0;box-sizing:border-box;}
body{background:${T.bg};overflow:hidden;}
::-webkit-scrollbar{width:5px;}
::-webkit-scrollbar-track{background:transparent;}
::-webkit-scrollbar-thumb{background:rgba(212,168,67,0.2);border-radius:4px;}
::-webkit-scrollbar-thumb:hover{background:rgba(212,168,67,0.4);}
@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
@keyframes slideRight{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)}}
@keyframes glow{0%,100%{box-shadow:0 0 12px rgba(212,168,67,0.1)}50%{box-shadow:0 0 20px rgba(212,168,67,0.2)}}
@keyframes toastIn{from{opacity:0;transform:translateY(20px) scale(0.95)}to{opacity:1;transform:translateY(0) scale(1)}}
.pm-toast{animation:toastIn 0.3s ease-out;}
`;

/* ─── SAFE CLONE FROM FIRESTORE ─── */
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

/* ─── MAIN COMPONENT ─── */
export default function ProjectManager() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");
  const [search, setSearch] = useState("");
  const [communityFilter, setCommunityFilter] = useState("all");
  const [hasChanges, setHasChanges] = useState(false);

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

  useEffect(() => {
    if (!isAdmin) return;
    (async () => {
      try {
        const snap = await getDocs(collection(db, "projects"));
        const list = [];
        snap.forEach(d => list.push({ id: d.id, ...plainify(d.data()) }));
        list.sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));
        setProjects(list);
      } catch (e) { console.error("Fetch:", e); }
    })();
  }, [isAdmin]);

  function handleSelect(id) {
    setSelectedId(id);
    setHasChanges(false);
    const p = projects.find(x => x.id === id);
    if (p) setForm({
      name: p.name || "", community: p.community || "", status: p.status || "Off-Plan",
      type: p.type || "", segment: p.segment || "", branded: p.branded || "",
      priceFrom: p.priceFrom || "", pricePerSqft: p.pricePerSqft || "",
      sizeRange: p.sizeRange || "", paymentPlan: p.paymentPlan || "",
      handover: p.handover || "", constructionProgress: p.constructionProgress || 0,
      whatsapp: p.whatsapp || "", email: p.email || "", phone: p.phone || "",
      imageUrl: p.imageUrl || "", description: p.description || "",
      lat: p.lat || "", lng: p.lng || "", area: p.area || "",
      units: Array.isArray(p.units) ? p.units.map(u => ({ type: u.type || "1BR", available: u.available || 0, total: u.total || 0 })) : [],
    });
  }

  function set(key, val) { setForm(prev => ({ ...prev, [key]: val })); setHasChanges(true); }
  function setUnit(i, key, val) {
    setForm(prev => { const u = [...prev.units]; u[i] = { ...u[i], [key]: val }; return { ...prev, units: u }; });
    setHasChanges(true);
  }
  function addUnit() { setForm(prev => ({ ...prev, units: [...prev.units, { type: "1BR", available: 0, total: 0 }] })); setHasChanges(true); }
  function removeUnit(i) { setForm(prev => ({ ...prev, units: prev.units.filter((_, x) => x !== i) })); setHasChanges(true); }

  async function handleSave() {
    if (!form || !selectedId) return;
    setSaving(true);
    try {
      const data = { ...form, lastUpdated: new Date().toISOString(), constructionProgress: Number(form.constructionProgress) || 0 };
      data.units = data.units.map(u => ({ type: u.type, available: Number(u.available) || 0, total: Number(u.total) || 0 }));
      await setDoc(doc(db, "projects", selectedId), data, { merge: true });
      setProjects(prev => prev.map(p => p.id === selectedId ? { ...p, ...data } : p));
      setHasChanges(false);
      notify("✅ Project saved successfully!");
    } catch (e) { notify("❌ Error: " + e.message); }
    setSaving(false);
  }

  function notify(msg) { setToast(msg); setTimeout(() => setToast(""), 3000); }

  const communities = [...new Set(projects.map(p => p.community))].filter(Boolean).sort();
  const filtered = projects.filter(p => {
    const ms = !search || (p.name || "").toLowerCase().includes(search.toLowerCase()) || (p.community || "").toLowerCase().includes(search.toLowerCase());
    const mc = communityFilter === "all" || p.community === communityFilter;
    return ms && mc;
  });

  const progress = form ? (Number(form.constructionProgress) || 0) : 0;
  const progressColor = progress >= 80 ? T.green : progress >= 40 ? T.gold : T.textMuted;

  /* ─── LOADING ─── */
  if (loading) return (
    <div style={{ minHeight: "100vh", background: T.bg, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
      <style>{css}</style>
      <svg width="40" height="40" viewBox="0 0 40 40"><rect x="2" y="2" width="36" height="36" rx="8" fill="none" stroke={T.gold} strokeWidth="2" /><path d="M12 28V12h10l-6 8h8l-12 8z" fill={T.gold} /></svg>
      <div style={{ color: T.gold, fontFamily: "'Fraunces',serif", fontSize: 18, fontWeight: 700 }}>Loading...</div>
    </div>
  );

  /* ─── ACCESS DENIED ─── */
  if (!isAdmin) return (
    <div style={{ minHeight: "100vh", background: T.bg, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16, fontFamily: "'Outfit',sans-serif" }}>
      <style>{css}</style>
      <div style={{ width: 80, height: 80, borderRadius: 20, background: T.surface, border: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36 }}>🔒</div>
      <h1 style={{ fontFamily: "'Fraunces',serif", fontSize: 24, color: T.white }}>Admin Access Only</h1>
      <p style={{ color: T.textSecondary, fontSize: 14 }}>You don't have permission to view this page.</p>
      <a href="/" style={{ color: T.gold, fontSize: 13, textDecoration: "none", padding: "8px 20px", border: `1px solid ${T.gold}`, borderRadius: 8 }}>← Back to Dashboard</a>
    </div>
  );

  /* ─── INPUT COMPONENTS ─── */
  const inputStyle = {
    width: "100%", padding: "11px 14px", background: T.bg, border: `1px solid ${T.border}`,
    borderRadius: 10, color: T.textPrimary, fontSize: 13, fontFamily: "'Outfit',sans-serif",
    outline: "none", transition: "border-color 0.2s, box-shadow 0.2s",
  };
  const labelStyle = { display: "block", fontSize: 10, fontWeight: 700, color: T.textMuted, marginBottom: 6, letterSpacing: 1, textTransform: "uppercase" };

  const Input = ({ label, value, onChange, placeholder, type, rows }) => (
    <div>
      <label style={labelStyle}>{label}</label>
      {rows ? (
        <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows}
          style={{ ...inputStyle, resize: "vertical", minHeight: 60 }}
          onFocus={e => { e.target.style.borderColor = T.gold; e.target.style.boxShadow = `0 0 0 3px ${T.goldGlow}`; }}
          onBlur={e => { e.target.style.borderColor = T.border; e.target.style.boxShadow = "none"; }} />
      ) : (
        <input type={type || "text"} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
          style={inputStyle}
          onFocus={e => { e.target.style.borderColor = T.gold; e.target.style.boxShadow = `0 0 0 3px ${T.goldGlow}`; }}
          onBlur={e => { e.target.style.borderColor = T.border; e.target.style.boxShadow = "none"; }} />
      )}
    </div>
  );

  const Select = ({ label, value, onChange, options }) => (
    <div>
      <label style={labelStyle}>{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)}
        style={{ ...inputStyle, cursor: "pointer", appearance: "none", backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394A3B8' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center" }}
        onFocus={e => { e.target.style.borderColor = T.gold; }} onBlur={e => { e.target.style.borderColor = T.border; }}>
        {options.map(o => <option key={o.value || o} value={o.value || o}>{o.label || o}</option>)}
      </select>
    </div>
  );

  /* ─── SECTION CARD ─── */
  const Section = ({ icon, title, children, action }) => (
    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, padding: 24, marginBottom: 20, animation: "fadeIn 0.4s ease-out both", transition: "border-color 0.3s" }}
      onMouseEnter={e => e.currentTarget.style.borderColor = T.borderHover}
      onMouseLeave={e => e.currentTarget.style.borderColor = T.border}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: T.goldGlow, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>{icon}</div>
          <h3 style={{ fontFamily: "'Fraunces',serif", fontSize: 16, fontWeight: 700, color: T.white }}>{title}</h3>
        </div>
        {action}
      </div>
      {children}
    </div>
  );

  /* ─── MAIN RENDER ─── */
  return (
    <div style={{ minHeight: "100vh", background: T.bg, fontFamily: "'Outfit',sans-serif", color: T.textPrimary }}>
      <style>{css}</style>

      {/* Toast */}
      {toast && (
        <div className="pm-toast" style={{ position: "fixed", bottom: 28, right: 28, padding: "14px 28px", borderRadius: 12, background: toast.includes("✅") ? "linear-gradient(135deg, #059669, #10B981)" : "linear-gradient(135deg, #DC2626, #EF4444)", color: T.white, fontWeight: 700, fontSize: 13, zIndex: 9999, boxShadow: "0 12px 40px rgba(0,0,0,0.4)", letterSpacing: 0.3 }}>{toast}</div>
      )}

      {/* ─── HEADER ─── */}
      <header style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(4,9,15,0.92)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", borderBottom: `1px solid ${T.border}`, padding: "0 28px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <a href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
            <svg width="26" height="26" viewBox="0 0 40 40"><rect x="2" y="2" width="36" height="36" rx="8" fill="none" stroke={T.gold} strokeWidth="2" /><path d="M12 28V12h10l-6 8h8l-12 8z" fill={T.gold} /></svg>
            <span style={{ fontFamily: "'Fraunces',serif", fontSize: 15, fontWeight: 800, color: T.gold }}>DXB Analytics</span>
          </a>
          <div style={{ height: 20, width: 1, background: T.border }} />
          <span style={{ fontSize: 10, padding: "3px 10px", borderRadius: 6, background: "rgba(139,92,246,0.12)", color: T.purple, fontWeight: 700, letterSpacing: 0.5 }}>PROJECT MANAGER</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 11, color: T.textMuted, padding: "4px 12px", borderRadius: 6, background: T.surfaceAlt }}>{projects.length} projects</span>
          <a href="/" style={{ fontSize: 11, color: T.textSecondary, textDecoration: "none", padding: "6px 16px", border: `1px solid ${T.border}`, borderRadius: 8, transition: "all 0.2s" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = T.gold; e.currentTarget.style.color = T.gold; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.textSecondary; }}>← Dashboard</a>
          <a href="/admin" style={{ fontSize: 11, color: T.textSecondary, textDecoration: "none", padding: "6px 16px", border: `1px solid ${T.border}`, borderRadius: 8, transition: "all 0.2s" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = T.gold; e.currentTarget.style.color = T.gold; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.textSecondary; }}>Admin Panel</a>
        </div>
      </header>

      {/* ─── LAYOUT ─── */}
      <div style={{ display: "flex", height: "calc(100vh - 56px)" }}>

        {/* ─── SIDEBAR ─── */}
        <div style={{ width: 300, borderRight: `1px solid ${T.border}`, display: "flex", flexDirection: "column", flexShrink: 0, background: "rgba(10,22,40,0.5)" }}>
          {/* Search & Filter */}
          <div style={{ padding: "16px 16px 12px" }}>
            <div style={{ position: "relative", marginBottom: 10 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={T.textMuted} strokeWidth="2" strokeLinecap="round" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search projects..."
                style={{ ...inputStyle, paddingLeft: 36, background: T.surface, fontSize: 12 }}
                onFocus={e => { e.target.style.borderColor = T.gold; }} onBlur={e => { e.target.style.borderColor = T.border; }} />
            </div>
            <select value={communityFilter} onChange={e => setCommunityFilter(e.target.value)}
              style={{ ...inputStyle, fontSize: 11, padding: "8px 12px", background: T.surface, cursor: "pointer" }}>
              <option value="all">All Communities ({projects.length})</option>
              {communities.map(c => <option key={c} value={c}>{c} ({projects.filter(p => p.community === c).length})</option>)}
            </select>
          </div>

          <div style={{ padding: "0 16px 8px", fontSize: 10, fontWeight: 700, color: T.textMuted, letterSpacing: 1 }}>{filtered.length} PROJECTS</div>

          {/* Project List */}
          <div style={{ flex: 1, overflowY: "auto", padding: "0 8px 16px" }}>
            {filtered.map((p, i) => {
              const active = selectedId === p.id;
              const prog = Number(p.constructionProgress) || 0;
              return (
                <div key={p.id} onClick={() => handleSelect(p.id)}
                  style={{
                    display: "flex", alignItems: "center", gap: 12, padding: "12px 12px", borderRadius: 10, cursor: "pointer",
                    marginBottom: 2, transition: "all 0.15s",
                    background: active ? T.goldGlow : "transparent",
                    border: `1px solid ${active ? T.goldBorder : "transparent"}`,
                  }}
                  onMouseEnter={e => { if (!active) { e.currentTarget.style.background = T.surfaceAlt; e.currentTarget.style.borderColor = T.border; } }}
                  onMouseLeave={e => { if (!active) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "transparent"; } }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                    background: active ? `linear-gradient(135deg, ${T.gold}, ${T.goldDim})` : T.surfaceAlt,
                    color: active ? T.bg : T.textMuted,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontWeight: 800, fontSize: 12, transition: "all 0.2s",
                  }}>
                    {(p.name || "?")[0]}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: active ? T.gold : T.white, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", transition: "color 0.2s" }}>{p.name}</div>
                    <div style={{ fontSize: 10, color: T.textMuted, marginTop: 1 }}>{p.community}</div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontSize: 9, color: prog >= 80 ? T.green : prog > 0 ? T.gold : T.textMuted, fontWeight: 700 }}>{prog}%</div>
                    <div style={{ width: 32, height: 3, borderRadius: 2, background: T.surfaceAlt, marginTop: 3 }}>
                      <div style={{ width: `${prog}%`, height: "100%", borderRadius: 2, background: prog >= 80 ? T.green : prog > 0 ? T.gold : T.textMuted, transition: "width 0.3s" }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ─── EDITOR PANEL ─── */}
        <div style={{ flex: 1, overflowY: "auto", background: T.bg }}>
          {!form ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", flexDirection: "column", gap: 16, animation: "fadeIn 0.5s ease-out" }}>
              <div style={{ width: 80, height: 80, borderRadius: 20, background: T.surface, border: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36 }}>📋</div>
              <h2 style={{ fontFamily: "'Fraunces',serif", fontSize: 24, fontWeight: 700, color: T.white }}>Select a Project</h2>
              <p style={{ color: T.textSecondary, fontSize: 13 }}>Click any project from the sidebar to edit its details</p>
            </div>
          ) : (
            <div style={{ maxWidth: 900, margin: "0 auto", padding: "28px 36px 60px", animation: "slideRight 0.35s ease-out" }}>

              {/* ─── PROJECT HEADER ─── */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28, paddingBottom: 20, borderBottom: `1px solid ${T.border}` }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 10, background: `linear-gradient(135deg, ${T.gold}, ${T.goldDim})`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 16, color: T.bg }}>{(form.name || "?")[0]}</div>
                    <div>
                      <h1 style={{ fontFamily: "'Fraunces',serif", fontSize: 26, fontWeight: 900, color: T.white, lineHeight: 1.2 }}>{form.name || "Untitled"}</h1>
                      <p style={{ color: T.textMuted, fontSize: 12, marginTop: 2 }}>
                        {form.community} · <span style={{ color: T.textSecondary }}>{form.status}</span> · <span style={{ color: T.textMuted, fontSize: 10 }}>{selectedId}</span>
                      </p>
                    </div>
                  </div>
                  {/* Construction progress bar */}
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8, marginLeft: 56 }}>
                    <div style={{ width: 120, height: 5, borderRadius: 3, background: T.surfaceAlt }}>
                      <div style={{ width: `${progress}%`, height: "100%", borderRadius: 3, background: progressColor, transition: "width 0.4s" }} />
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: progressColor }}>{progress}% complete</span>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  {hasChanges && <span style={{ fontSize: 10, color: T.gold, padding: "6px 12px", borderRadius: 6, background: T.goldGlow, fontWeight: 600, animation: "glow 2s infinite" }}>Unsaved changes</span>}
                  <button onClick={handleSave} disabled={saving}
                    style={{
                      padding: "10px 28px", borderRadius: 10, border: "none", cursor: saving ? "wait" : "pointer",
                      background: `linear-gradient(135deg, ${T.gold}, ${T.goldLight})`, color: T.bg,
                      fontWeight: 700, fontSize: 13, fontFamily: "'Outfit',sans-serif",
                      boxShadow: "0 4px 16px rgba(212,168,67,0.3)", transition: "all 0.2s",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 6px 24px rgba(212,168,67,0.4)"; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(212,168,67,0.3)"; }}>
                    {saving ? "⏳ Saving..." : "💾 Save"}
                  </button>
                </div>
              </div>

              {/* ─── BASIC INFO ─── */}
              <Section icon="🏗️" title="Basic Information">
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <Input label="Project Name" value={form.name} onChange={v => set("name", v)} />
                  <Input label="Community" value={form.community} onChange={v => set("community", v)} />
                  <Select label="Status" value={form.status} onChange={v => set("status", v)}
                    options={["Off-Plan", "Under Construction", "Ready", "Sold Out", "Launching"]} />
                  <Input label="Property Type" value={form.type} onChange={v => set("type", v)} placeholder="e.g. Apartments · 1-3 BR" />
                  <Select label="Segment" value={form.segment} onChange={v => set("segment", v)}
                    options={["Mid-Market", "Mid-Premium", "Premium", "Ultra-Premium", "Luxury"]} />
                  <Input label="Branded" value={form.branded} onChange={v => set("branded", v)} placeholder="Address, Vida, etc." />
                </div>
              </Section>

              {/* ─── PRICING ─── */}
              <Section icon="💰" title="Pricing & Handover">
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
                  <Input label="Price From (AED)" value={form.priceFrom} onChange={v => set("priceFrom", v)} placeholder="1.8M" />
                  <Input label="Price/SqFt (AED)" value={form.pricePerSqft} onChange={v => set("pricePerSqft", v)} placeholder="2,333" />
                  <Input label="Size Range" value={form.sizeRange} onChange={v => set("sizeRange", v)} placeholder="750 - 2,200 sqft" />
                  <Input label="Payment Plan" value={form.paymentPlan} onChange={v => set("paymentPlan", v)} placeholder="20/30/50" />
                  <Input label="Handover" value={form.handover} onChange={v => set("handover", v)} placeholder="Q2 2026" />
                  <Input label="Construction %" value={form.constructionProgress} onChange={v => set("constructionProgress", v)} type="number" />
                </div>
              </Section>

              {/* ─── UNITS ─── */}
              <Section icon="🏠" title="Unit Inventory"
                action={
                  <button onClick={addUnit}
                    style={{ padding: "6px 16px", fontSize: 11, borderRadius: 8, border: `1px solid rgba(0,191,165,0.25)`, background: "rgba(0,191,165,0.08)", color: T.teal, fontWeight: 700, cursor: "pointer", fontFamily: "'Outfit',sans-serif", transition: "all 0.2s" }}
                    onMouseEnter={e => { e.currentTarget.style.background = "rgba(0,191,165,0.15)"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "rgba(0,191,165,0.08)"; }}>
                    + Add Unit Type
                  </button>
                }>
                {form.units.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "32px 0" }}>
                    <div style={{ fontSize: 28, marginBottom: 8, opacity: 0.4 }}>🏠</div>
                    <p style={{ color: T.textMuted, fontSize: 12 }}>No unit types added yet</p>
                    <p style={{ color: T.textMuted, fontSize: 11, marginTop: 4 }}>Click "+ Add Unit Type" to define inventory</p>
                  </div>
                ) : (
                  <>
                    {/* Table header */}
                    <div style={{ display: "grid", gridTemplateColumns: "110px 1fr 1fr 60px", gap: 12, padding: "0 0 8px", borderBottom: `1px solid ${T.border}` }}>
                      {["Type", "Available", "Total", ""].map(h => (
                        <span key={h} style={{ fontSize: 9, fontWeight: 700, color: T.textMuted, letterSpacing: 1, textTransform: "uppercase" }}>{h}</span>
                      ))}
                    </div>
                    {form.units.map((u, i) => (
                      <div key={i} style={{ display: "grid", gridTemplateColumns: "110px 1fr 1fr 60px", gap: 12, alignItems: "center", padding: "10px 0", borderBottom: i < form.units.length - 1 ? `1px solid ${T.border}` : "none" }}>
                        <select value={u.type} onChange={e => setUnit(i, "type", e.target.value)}
                          style={{ ...inputStyle, fontSize: 12, padding: "8px 10px" }}>
                          {["STUDIO","1BR","2BR","3BR","4BR","5BR","PENTHOUSE","TOWNHOUSE","VILLA","DUPLEX"].map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                        <input type="number" min="0" value={u.available} onChange={e => setUnit(i, "available", e.target.value)}
                          style={{ ...inputStyle, fontSize: 12, padding: "8px 10px" }} />
                        <input type="number" min="0" value={u.total} onChange={e => setUnit(i, "total", e.target.value)}
                          style={{ ...inputStyle, fontSize: 12, padding: "8px 10px" }} />
                        <button onClick={() => removeUnit(i)}
                          style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid rgba(239,68,68,0.2)`, background: "rgba(239,68,68,0.06)", color: T.red, cursor: "pointer", fontSize: 12, fontWeight: 700, fontFamily: "'Outfit',sans-serif", transition: "all 0.2s" }}
                          onMouseEnter={e => { e.currentTarget.style.background = "rgba(239,68,68,0.15)"; }}
                          onMouseLeave={e => { e.currentTarget.style.background = "rgba(239,68,68,0.06)"; }}>✕</button>
                      </div>
                    ))}
                    {/* Summary */}
                    <div style={{ marginTop: 14, padding: "10px 14px", borderRadius: 10, background: T.surfaceAlt, display: "flex", gap: 24, fontSize: 12 }}>
                      <span style={{ color: T.textSecondary }}>Available: <strong style={{ color: T.green }}>{form.units.reduce((s, u) => s + (Number(u.available) || 0), 0)}</strong></span>
                      <span style={{ color: T.textSecondary }}>Total: <strong style={{ color: T.white }}>{form.units.reduce((s, u) => s + (Number(u.total) || 0), 0)}</strong></span>
                      <span style={{ color: T.textSecondary }}>Sold: <strong style={{ color: T.gold }}>{form.units.reduce((s, u) => s + ((Number(u.total) || 0) - (Number(u.available) || 0)), 0)}</strong></span>
                    </div>
                  </>
                )}
              </Section>

              {/* ─── CONTACT ─── */}
              <Section icon="📞" title="Contact & Media">
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <Input label="WhatsApp" value={form.whatsapp} onChange={v => set("whatsapp", v)} placeholder="+971..." />
                  <Input label="Email" value={form.email} onChange={v => set("email", v)} placeholder="sales@emaar.ae" />
                  <Input label="Phone" value={form.phone} onChange={v => set("phone", v)} placeholder="+971..." />
                  <Input label="Image URL" value={form.imageUrl} onChange={v => set("imageUrl", v)} placeholder="https://..." />
                </div>
                <div style={{ marginTop: 16 }}>
                  <Input label="Description / Notes" value={form.description} onChange={v => set("description", v)} placeholder="Project highlights, key selling points..." rows={3} />
                </div>
              </Section>

              {/* ─── LOCATION ─── */}
              <Section icon="📍" title="Location">
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
                  <Input label="Latitude" value={form.lat} onChange={v => set("lat", v)} placeholder="25.xxxxx" />
                  <Input label="Longitude" value={form.lng} onChange={v => set("lng", v)} placeholder="55.xxxxx" />
                  <Input label="Area" value={form.area} onChange={v => set("area", v)} placeholder="Dubai Marina" />
                </div>
              </Section>

              {/* ─── BOTTOM SAVE ─── */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                {hasChanges && <span style={{ fontSize: 11, color: T.gold, lineHeight: "42px" }}>You have unsaved changes</span>}
                <button onClick={handleSave} disabled={saving}
                  style={{
                    padding: "12px 36px", borderRadius: 10, border: "none", cursor: saving ? "wait" : "pointer",
                    background: `linear-gradient(135deg, ${T.gold}, ${T.goldLight})`, color: T.bg,
                    fontWeight: 800, fontSize: 14, fontFamily: "'Outfit',sans-serif",
                    boxShadow: "0 4px 16px rgba(212,168,67,0.3)", transition: "all 0.2s",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 28px rgba(212,168,67,0.4)"; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(212,168,67,0.3)"; }}>
                  {saving ? "⏳ Saving..." : "💾 Save All Changes"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
