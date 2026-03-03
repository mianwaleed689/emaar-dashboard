/* ═══════════════════════════════════════════════════════════════
   DXB ANALYTICS — PROJECT MANAGER
   Matching dashboard design DNA: sidebar, KPI cards, sections
   ═══════════════════════════════════════════════════════════════ */
import React, { useState, useEffect } from "react";
import { auth, db } from "./firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { collection, getDocs, doc, getDoc, setDoc } from "firebase/firestore";

/* ─── THEME (exact dashboard match) ─── */
const T = {
  bg: "#04090F", surface: "#0A1628", surfaceAlt: "#0E1D35", card: "#0D1B30",
  gold: "#D4A843", goldLight: "#E8C96A", goldDim: "#B8912F", goldGlow: "rgba(212,168,67,0.12)",
  teal: "#00BFA5", white: "#FFFFFF",
  textPrimary: "#E2E8F0", textSecondary: "#94A3B8", textMuted: "#64748B",
  border: "rgba(212,168,67,0.08)", borderHover: "rgba(212,168,67,0.2)",
  red: "#EF4444", green: "#10B981", blue: "#3B82F6", purple: "#8B5CF6",
};

/* ─── ICONS (matching dashboard SVG style) ─── */
const I = {
  search: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  grid: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>,
  building: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="9" y1="6" x2="9" y2="6.01"/><line x1="15" y1="6" x2="15" y2="6.01"/><line x1="9" y1="10" x2="9" y2="10.01"/><line x1="15" y1="10" x2="15" y2="10.01"/><line x1="9" y1="14" x2="9" y2="14.01"/><line x1="15" y1="14" x2="15" y2="14.01"/><path d="M9 22v-4h6v4"/></svg>,
  dollar: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
  home: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  phone: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>,
  mapPin: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  logout: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  save: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>,
  trash: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>,
  plus: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  bell: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
};

/* ─── CSS (matching dashboard animations & scrollbar) ─── */
const css = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700;9..144,900&display=swap');
*{margin:0;padding:0;box-sizing:border-box;}
body{background:${T.bg};}
::-webkit-scrollbar{width:5px;}
::-webkit-scrollbar-track{background:transparent;}
::-webkit-scrollbar-thumb{background:rgba(212,168,67,0.15);border-radius:4px;}
::-webkit-scrollbar-thumb:hover{background:rgba(212,168,67,0.3);}
@keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
@keyframes slideRight{from{opacity:0;transform:translateX(16px)}to{opacity:1;transform:translateX(0)}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes glow{0%,100%{box-shadow:0 0 12px rgba(212,168,67,0.1)}50%{box-shadow:0 0 24px rgba(212,168,67,0.25)}}
.fade-up{animation:fadeUp 0.4s ease-out both;}
.slide-right{animation:slideRight 0.35s ease-out both;}
.chart-box{background:${T.surface};border:1px solid ${T.border};border-radius:14px;padding:20px;transition:border-color 0.3s;}
.chart-box:hover{border-color:${T.borderHover};}
* { scrollbar-width: thin; scrollbar-color: rgba(212,168,67,0.15) transparent; }
select option { background: ${T.surface}; color: ${T.textPrimary}; }
.pm-sidebar{transition:transform 0.3s ease;}
@media(max-width:768px){
  .pm-sidebar{position:fixed!important;z-index:200;transform:translateX(-100%);height:100vh!important;}
  .pm-sidebar.open{transform:translateX(0);}
  .pm-main{margin-left:0!important;}
  .pm-overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:199;}
  .pm-overlay.open{display:block;}
  .pm-mobile-btn{display:flex!important;}
  .pm-header{flex-wrap:wrap;gap:8px;}
  .pm-pills{overflow-x:auto;flex-wrap:nowrap!important;-webkit-overflow-scrolling:touch;scrollbar-width:none;}
  .pm-pills::-webkit-scrollbar{display:none;}
  .pm-pills button{flex-shrink:0;}
  .pm-form-grid{grid-template-columns:1fr!important;}
  .pm-unit-table{overflow-x:auto;-webkit-overflow-scrolling:touch;}
}
@media(max-width:480px){
  .pm-kpi-grid{grid-template-columns:1fr 1fr!important;}
}
`;

/* ─── SAFE FIRESTORE DATA ─── */
function plainify(obj) {
  if (obj === null || obj === undefined) return "";
  if (typeof obj === "string" || typeof obj === "number" || typeof obj === "boolean") return obj;
  if (typeof obj.toDate === "function") return obj.toDate().toISOString();
  if (Array.isArray(obj)) return obj.map(plainify);
  if (typeof obj === "object") { const o = {}; Object.keys(obj).forEach(k => { o[k] = plainify(obj[k]); }); return o; }
  return String(obj);
}

/* ═══════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════ */
export default function ProjectManager() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [adminUser, setAdminUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");
  const [search, setSearch] = useState("");
  const [communityFilter, setCommunityFilter] = useState("all");
  const [hasChanges, setHasChanges] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const hk = (e) => { if (e.key === "Escape") setSidebarOpen(false); };
    window.addEventListener("keydown", hk);
    return () => window.removeEventListener("keydown", hk);
  }, []);
  useEffect(() => {
    const hu = (e) => { if (hasChanges) { e.preventDefault(); e.returnValue = ""; } };
    window.addEventListener("beforeunload", hu);
    return () => window.removeEventListener("beforeunload", hu);
  }, [hasChanges]);
  const [activeSection, setActiveSection] = useState("basic");

  /* ─── AUTH ─── */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setAdminUser(u);
        try {
          const snap = await getDoc(doc(db, "users", u.uid));
          if (snap.exists() && snap.data().role === "admin") setIsAdmin(true);
          else setIsAdmin(false);
        } catch (err) { console.error("Admin auth check failed:", err); setIsAdmin(false); }
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  /* ─── FETCH PROJECTS ─── */
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

  /* ─── PROJECT SELECTION ─── */
  function handleSelect(id) {
    if (hasChanges && !window.confirm("You have unsaved changes. Discard them?")) return;
    setSelectedId(id);
    setHasChanges(false);
    setActiveSection("basic");
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

  /* ─── FORM HELPERS ─── */
  function set(key, val) { setForm(prev => ({ ...prev, [key]: val })); setHasChanges(true); }
  function setUnit(i, key, val) {
    setForm(prev => { const u = [...prev.units]; u[i] = { ...u[i], [key]: val }; return { ...prev, units: u }; });
    setHasChanges(true);
  }
  function addUnit() { setForm(prev => ({ ...prev, units: [...prev.units, { type: "1BR", available: 0, total: 0 }] })); setHasChanges(true); }
  function removeUnit(i) { if (!window.confirm("Remove this unit type?")) return; setForm(prev => ({ ...prev, units: prev.units.filter((_, x) => x !== i) })); setHasChanges(true); }

  /* ─── SAVE ─── */
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

  /* ─── FILTERS ─── */
  const communities = [...new Set(projects.map(p => p.community))].filter(Boolean).sort();
  const filtered = projects.filter(p => {
    const ms = !search || (p.name || "").toLowerCase().includes(search.toLowerCase()) || (p.community || "").toLowerCase().includes(search.toLowerCase());
    const mc = communityFilter === "all" || p.community === communityFilter;
    return ms && mc;
  });

  /* ─── STATS ─── */
  const totalUnits = projects.reduce((s, p) => s + (Array.isArray(p.units) ? p.units.reduce((a, u) => a + (Number(u.total) || 0), 0) : 0), 0);
  const availUnits = projects.reduce((s, p) => s + (Array.isArray(p.units) ? p.units.reduce((a, u) => a + (Number(u.available) || 0), 0) : 0), 0);
  const avgProgress = projects.length > 0 ? Math.round(projects.reduce((s, p) => s + (Number(p.constructionProgress) || 0), 0) / projects.length) : 0;
  const progress = form ? (Number(form.constructionProgress) || 0) : 0;
  const progressColor = progress >= 80 ? T.green : progress >= 40 ? T.gold : T.textMuted;

  /* ─── EDITOR SECTIONS NAV ─── */
  const SECTIONS = [
    { id: "basic", label: "Basic Info", icon: I.building },
    { id: "pricing", label: "Pricing", icon: I.dollar },
    { id: "units", label: "Units", icon: I.home },
    { id: "contact", label: "Contact", icon: I.phone },
    { id: "location", label: "Location", icon: I.mapPin },
  ];

  /* ─── LOADING ─── */
  if (loading) return (
    <div style={{ minHeight: "100vh", background: T.bg, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
      <style>{css}</style>
      <svg width="40" height="40" viewBox="0 0 40 40"><rect x="2" y="2" width="36" height="36" rx="8" fill="none" stroke={T.gold} strokeWidth="2" /><path d="M12 28V12h10l-6 8h8l-12 8z" fill={T.gold} /></svg>
      <div style={{ width: 24, height: 24, border: `2px solid ${T.border}`, borderTopColor: T.gold, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
    </div>
  );

  if (!isAdmin) return (
    <div style={{ minHeight: "100vh", background: T.bg, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16, fontFamily: "'Outfit',sans-serif" }}>
      <style>{css}</style>
      <div style={{ width: 80, height: 80, borderRadius: 20, background: T.surface, border: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36 }}>🔒</div>
      <h1 style={{ fontFamily: "'Fraunces',serif", fontSize: 24, color: T.white }}>Admin Access Only</h1>
      <a href="/" style={{ color: T.gold, fontSize: 13, textDecoration: "none", padding: "8px 20px", border: `1px solid ${T.gold}`, borderRadius: 8, marginTop: 8 }}>← Back to Dashboard</a>
    </div>
  );

  /* ─── REUSABLE COMPONENTS ─── */
  const KPI = ({ label, value, sub, icon, color, delay = 0 }) => (
    <div className="chart-box fade-up" style={{ animationDelay: `${delay * 0.05}s`, padding: "20px 20px 16px", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: 12, right: 14, fontSize: 10, padding: "3px 8px", borderRadius: 6, background: (color || T.gold) + "15", color: color || T.gold, fontWeight: 700 }}>{icon}</div>
      <div style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 8 }}>{label}</div>
      <div style={{ fontFamily: "'Fraunces',serif", fontSize: 28, fontWeight: 900, color: color || T.gold, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: T.green, marginTop: 6, fontWeight: 500 }}>{sub}</div>}
    </div>
  );

  const Section = ({ title, sub, children, action }) => (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 16 }}>
        <div style={{ borderLeft: `3px solid ${T.gold}`, paddingLeft: 14 }}>
          <h2 style={{ fontFamily: "'Fraunces',serif", fontSize: 20, fontWeight: 800, color: T.white, lineHeight: 1.2 }}>{title}</h2>
          {sub && <p style={{ fontSize: 12, color: T.textSecondary, marginTop: 3 }}>{sub}</p>}
        </div>
        {action}
      </div>
      {children}
    </div>
  );

  const inputStyle = {
    width: "100%", padding: "11px 14px", background: T.bg, border: `1px solid ${T.border}`,
    borderRadius: 10, color: T.textPrimary, fontSize: 13, fontFamily: "'Outfit',sans-serif",
    outline: "none", transition: "border-color 0.2s, box-shadow 0.2s",
  };
  const labelStyle = { display: "block", fontSize: 9, fontWeight: 700, color: T.textMuted, marginBottom: 6, letterSpacing: 1, textTransform: "uppercase" };

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
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );

  /* ═══════════════════════════════════════
     RENDER
     ═══════════════════════════════════════ */
  return (
    <div style={{ minHeight: "100vh", background: T.bg, fontFamily: "'Outfit',sans-serif", color: T.textPrimary, display: "flex" }}>
      <style>{css}</style>

      {/* Toast */}
      {toast && <div className="fade-up" style={{ position: "fixed", bottom: 24, right: 24, padding: "12px 24px", borderRadius: 10, background: toast.includes("✅") ? T.green : T.red, color: T.white, fontWeight: 700, fontSize: 13, zIndex: 9999, boxShadow: "0 12px 40px rgba(0,0,0,0.4)" }}>{toast}</div>}

      {/* Mobile overlay */}
      <div className={`pm-overlay ${sidebarOpen ? "open" : ""}`} onClick={() => setSidebarOpen(false)} />

      {/* ─── LEFT SIDEBAR ─── */}
      <aside className={`pm-sidebar ${sidebarOpen ? "open" : ""}`} role="navigation" aria-label="Project navigation" style={{ width: 220, height: "100vh", position: "sticky", top: 0, borderRight: `1px solid ${T.border}`, display: "flex", flexDirection: "column", background: "rgba(10,22,40,0.4)", flexShrink: 0 }}>
        {/* Logo */}
        <a href="/" style={{ display: "flex", alignItems: "center", gap: 10, padding: "20px 20px 6px", textDecoration: "none" }}>
          <svg width="28" height="28" viewBox="0 0 40 40"><rect x="2" y="2" width="36" height="36" rx="8" fill="none" stroke={T.gold} strokeWidth="2" /><path d="M12 28V12h10l-6 8h8l-12 8z" fill={T.gold} /></svg>
          <div>
            <div style={{ fontFamily: "'Fraunces',serif", fontSize: 15, fontWeight: 800, color: T.gold, lineHeight: 1 }}>DXB Analytics</div>
            <div style={{ fontSize: 8, fontWeight: 700, color: T.textMuted, letterSpacing: 1.5, textTransform: "uppercase", marginTop: 2 }}>PROJECT MANAGER</div>
          </div>
        </a>

        {/* Portfolio KPIs */}
        <div style={{ padding: "12px 16px 14px", borderBottom: `1px solid ${T.border}` }}>
          <div className="pm-kpi-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <div style={{ background: T.surfaceAlt, borderRadius: 8, padding: "8px 10px" }}>
              <div style={{ fontSize: 8, fontWeight: 700, color: T.textMuted, letterSpacing: 1, textTransform: "uppercase" }}>Projects</div>
              <div style={{ fontFamily: "'Fraunces',serif", fontSize: 18, fontWeight: 900, color: T.gold }}>{projects.length}</div>
            </div>
            <div style={{ background: T.surfaceAlt, borderRadius: 8, padding: "8px 10px" }}>
              <div style={{ fontSize: 8, fontWeight: 700, color: T.textMuted, letterSpacing: 1, textTransform: "uppercase" }}>Avg Build</div>
              <div style={{ fontFamily: "'Fraunces',serif", fontSize: 18, fontWeight: 900, color: avgProgress >= 50 ? T.green : T.gold }}>{avgProgress}%</div>
            </div>
          </div>
        </div>

        {/* Search & Filter */}
        <div style={{ padding: "12px 12px 8px" }}>
          <div style={{ position: "relative", marginBottom: 8 }}>
            <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: T.textMuted }}>{I.search}</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search projects..."
              style={{ width: "100%", padding: "9px 10px 9px 32px", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, color: T.textPrimary, fontSize: 12, fontFamily: "'Outfit',sans-serif", outline: "none" }}
              onFocus={e => { e.target.style.borderColor = T.gold; }} onBlur={e => { e.target.style.borderColor = T.border; }} />
          </div>
          <select value={communityFilter} onChange={e => setCommunityFilter(e.target.value)}
            style={{ width: "100%", padding: "7px 10px", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, color: T.textPrimary, fontSize: 11, fontFamily: "'Outfit',sans-serif", cursor: "pointer", outline: "none" }}>
            <option value="all">All Communities ({projects.length})</option>
            {communities.map(c => <option key={c} value={c}>{c} ({projects.filter(p => p.community === c).length})</option>)}
          </select>
        </div>

        <div style={{ padding: "4px 16px 8px", fontSize: 9, fontWeight: 700, color: T.textMuted, letterSpacing: 1.5, textTransform: "uppercase" }}>{filtered.length} Projects</div>

        {/* Project List */}
        <div style={{ flex: 1, overflowY: "auto", padding: "0 6px 16px" }}>
          {filtered.map((p, i) => {
            const active = selectedId === p.id;
            const prog = Number(p.constructionProgress) || 0;
            return (
              <div key={p.id} onClick={() => handleSelect(p.id)} style={{
                display: "flex", alignItems: "center", gap: 10, padding: "10px 10px", borderRadius: 10, cursor: "pointer",
                marginBottom: 1, transition: "all 0.15s",
                background: active ? T.goldGlow : "transparent",
                border: `1px solid ${active ? T.borderHover : "transparent"}`,
              }}
                onMouseEnter={e => { if (!active) { e.currentTarget.style.background = T.surfaceAlt; e.currentTarget.style.borderColor = T.border; } }}
                onMouseLeave={e => { if (!active) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "transparent"; } }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                  background: active ? `linear-gradient(135deg, ${T.gold}, ${T.goldDim})` : T.surfaceAlt,
                  color: active ? T.bg : T.textMuted,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontWeight: 800, fontSize: 11, transition: "all 0.2s",
                }}>
                  {(p.name || "?")[0]}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: active ? T.gold : T.white, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", transition: "color 0.2s" }}>{p.name}</div>
                  <div style={{ fontSize: 9, color: T.textMuted }}>{p.community}</div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontSize: 9, color: prog >= 80 ? T.green : prog > 0 ? T.gold : T.textMuted, fontWeight: 700 }}>{prog}%</div>
                  <div style={{ width: 28, height: 3, borderRadius: 2, background: T.surfaceAlt, marginTop: 2 }}>
                    <div style={{ width: `${prog}%`, height: "100%", borderRadius: 2, background: prog >= 80 ? T.green : prog > 0 ? T.gold : T.textMuted }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom: User + Links */}
        <div style={{ borderTop: `1px solid ${T.border}` }}>
          <a href="/admin" style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 16px", color: T.textSecondary, fontSize: 12, textDecoration: "none", transition: "color 0.15s" }}
            onMouseEnter={e => e.currentTarget.style.color = T.gold} onMouseLeave={e => e.currentTarget.style.color = T.textSecondary}>
            {I.grid} Admin Panel
          </a>
          <div style={{ padding: "10px 16px 16px", display: "flex", alignItems: "center", gap: 10, borderTop: `1px solid ${T.border}` }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: `linear-gradient(135deg, ${T.gold}, ${T.goldDim})`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 11, color: T.bg }}>
              {(adminUser?.displayName || adminUser?.email || "A")[0].toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: T.white, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{adminUser?.displayName || adminUser?.email?.split("@")[0]}</div>
              <div style={{ fontSize: 9, color: T.gold, fontWeight: 600 }}>Admin</div>
            </div>
            <button type="button" onClick={() => { signOut(auth).then(() => window.location.href = "/").catch(err => console.error("Sign out failed:", err)); }} title="Sign Out" style={{ background: "none", border: "none", color: T.textMuted, cursor: "pointer", padding: 4 }}>{I.logout}</button>
          </div>
        </div>
      </aside>

      {/* ─── MAIN CONTENT ─── */}
      <main className="pm-main" role="main" style={{ flex: 1, height: "100vh", overflowY: "auto", overflowX: "hidden" }}>
        {/* Top header */}
        <header className="pm-header" style={{ position: "sticky", top: 0, zIndex: 20, background: "rgba(4,9,15,0.9)", backdropFilter: "blur(20px)", borderBottom: `1px solid ${T.border}`, padding: "0 32px", minHeight: 52, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button type="button" className="pm-mobile-btn" onClick={() => setSidebarOpen(!sidebarOpen)} style={{ display: "none", alignItems: "center", justifyContent: "center", width: 32, height: 32, borderRadius: 8, background: T.surfaceAlt, border: "1px solid " + T.border, color: T.textSecondary, cursor: "pointer", marginRight: 4 }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg></button>
            <span style={{ fontFamily: "'Fraunces',serif", fontSize: 14, fontWeight: 700, color: T.white }}>
              {form ? form.name || "Untitled" : "Project Manager"}
            </span>
            {form && <>
              <span style={{ fontSize: 10, color: T.textMuted }}>·</span>
              <span style={{ fontSize: 11, color: T.textSecondary }}>{form.community}</span>
              <span style={{ fontSize: 9, padding: "2px 8px", borderRadius: 5, background: form.status === "Under Construction" ? "rgba(16,185,129,0.12)" : "rgba(59,130,246,0.12)", color: form.status === "Under Construction" ? T.green : T.blue, fontWeight: 600 }}>{form.status}</span>
            </>}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {hasChanges && <span style={{ fontSize: 10, fontWeight: 700, padding: "4px 12px", borderRadius: 6, background: T.goldGlow, color: T.gold, animation: "glow 2s infinite" }}>Unsaved</span>}
            {form && (
              <button type="button" onClick={handleSave} disabled={saving} style={{
                display: "flex", alignItems: "center", gap: 6, padding: "8px 20px", borderRadius: 8, border: "none", cursor: saving ? "wait" : "pointer",
                background: `linear-gradient(135deg, ${T.gold}, ${T.goldLight})`, color: T.bg,
                fontWeight: 700, fontSize: 12, fontFamily: "'Outfit',sans-serif",
                boxShadow: "0 4px 16px rgba(212,168,67,0.3)", transition: "all 0.2s",
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; }}>
                {I.save} {saving ? "Saving..." : "Save"}
              </button>
            )}
          </div>
        </header>

        <div style={{ padding: "28px 32px 60px" }}>
          {!form ? (
            /* ─── NO PROJECT SELECTED ─── */
            <>
              <Section title="Project Portfolio" sub={`${projects.length} Emaar projects · ${communities.length} communities · Select to edit`}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
                  <KPI label="Total Projects" value={projects.length} sub={`${projects.filter(p => p.status === "Under Construction").length} building · ${projects.filter(p => p.status === "Off-Plan").length} off-plan`} icon="🏗️" delay={1} />
                  <KPI label="Communities" value={communities.length} sub={communities.slice(0, 3).join(" · ") + (communities.length > 3 ? ` +${communities.length - 3}` : "")} icon="📍" delay={2} />
                  <KPI label="Total Units" value={totalUnits.toLocaleString()} sub={`${availUnits.toLocaleString()} available`} icon="🏠" color={T.teal} delay={3} />
                  <KPI label="Avg Construction" value={`${avgProgress}%`} sub="Weighted average progress" icon="📊" color={avgProgress >= 50 ? T.green : T.gold} delay={4} />
                </div>
              </Section>

              <div className="chart-box fade-up" style={{ padding: 48, textAlign: "center" }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
                <h2 style={{ fontFamily: "'Fraunces',serif", fontSize: 24, fontWeight: 700, color: T.white, marginBottom: 8 }}>Select a Project</h2>
                <p style={{ color: T.textSecondary, fontSize: 13, maxWidth: 420, margin: "0 auto", lineHeight: 1.6 }}>
                  Click any project from the sidebar to edit its details — pricing, units, status, contact info, and location data.
                </p>
              </div>
            </>
          ) : (
            /* ─── PROJECT EDITOR ─── */
            <div className="slide-right">
              {/* Project Header */}
              <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24, paddingBottom: 20, borderBottom: `1px solid ${T.border}` }}>
                <div style={{ width: 52, height: 52, borderRadius: 12, background: `linear-gradient(135deg, ${T.gold}, ${T.goldDim})`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 20, color: T.bg, flexShrink: 0 }}>
                  {(form.name || "?")[0]}
                </div>
                <div style={{ flex: 1 }}>
                  <h1 style={{ fontFamily: "'Fraunces',serif", fontSize: 26, fontWeight: 900, color: T.white, lineHeight: 1.1 }}>{form.name || "Untitled"}</h1>
                  <p style={{ color: T.textMuted, fontSize: 12, marginTop: 3 }}>
                    {form.community} · <span style={{ color: T.textSecondary }}>{form.status}</span> · <span style={{ fontSize: 10 }}>ID: {selectedId}</span>
                  </p>
                  {/* Construction bar */}
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
                    <div style={{ width: 120, height: 5, borderRadius: 3, background: T.surfaceAlt }}>
                      <div style={{ width: `${progress}%`, height: "100%", borderRadius: 3, background: progressColor, transition: "width 0.4s" }} />
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: progressColor }}>{progress}% complete</span>
                  </div>
                </div>
              </div>

              {/* Section navigation pills */}
              <div className="pm-pills" style={{ display: "flex", gap: 6, marginBottom: 24, flexWrap: "wrap" }}>
                {SECTIONS.map(s => (
                  <button type="button" key={s.id} onClick={() => setActiveSection(s.id)} style={{
                    display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: "pointer",
                    fontFamily: "'Outfit',sans-serif", transition: "all 0.2s", border: `1px solid ${activeSection === s.id ? T.gold : T.border}`,
                    background: activeSection === s.id ? T.goldGlow : "transparent",
                    color: activeSection === s.id ? T.gold : T.textSecondary,
                  }}>
                    <span style={{ color: activeSection === s.id ? T.gold : T.textMuted }}>{s.icon}</span> {s.label}
                  </button>
                ))}
              </div>

              {/* ─── BASIC INFO ─── */}
              {activeSection === "basic" && (
                <Section title="Basic Information" sub="Project identity and classification">
                  <div className="chart-box" style={{ padding: 24 }}>
                    <div className="pm-form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                      <Input label="Project Name" value={form.name} onChange={v => set("name", v)} />
                      <Input label="Community" value={form.community} onChange={v => set("community", v)} />
                      <Select label="Status" value={form.status} onChange={v => set("status", v)} options={["Off-Plan", "Under Construction", "Ready", "Sold Out", "Launching"]} />
                      <Input label="Property Type" value={form.type} onChange={v => set("type", v)} placeholder="e.g. Apartments · 1-3 BR" />
                      <Select label="Segment" value={form.segment} onChange={v => set("segment", v)} options={["Mid-Market", "Mid-Premium", "Premium", "Ultra-Premium", "Luxury"]} />
                      <Input label="Branded" value={form.branded} onChange={v => set("branded", v)} placeholder="Address, Vida, etc." />
                    </div>
                  </div>
                </Section>
              )}

              {/* ─── PRICING ─── */}
              {activeSection === "pricing" && (
                <Section title="Pricing & Handover" sub="Financial details and timeline">
                  <div className="chart-box" style={{ padding: 24 }}>
                    <div className="pm-form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
                      <Input label="Price From (AED)" value={form.priceFrom} onChange={v => set("priceFrom", v)} placeholder="1.8M" />
                      <Input label="Price/SqFt (AED)" value={form.pricePerSqft} onChange={v => set("pricePerSqft", v)} placeholder="2,333" />
                      <Input label="Size Range" value={form.sizeRange} onChange={v => set("sizeRange", v)} placeholder="750 - 2,200 sqft" />
                      <Input label="Payment Plan" value={form.paymentPlan} onChange={v => set("paymentPlan", v)} placeholder="20/30/50" />
                      <Input label="Handover" value={form.handover} onChange={v => set("handover", v)} placeholder="Q2 2026" />
                      <Input label="Construction %" value={form.constructionProgress} onChange={v => set("constructionProgress", v)} type="number" />
                    </div>
                  </div>
                </Section>
              )}

              {/* ─── UNITS ─── */}
              {activeSection === "units" && (
                <Section title="Unit Inventory" sub="Manage unit types, availability, and totals" action={
                  <button type="button" onClick={addUnit} style={{
                    display: "flex", alignItems: "center", gap: 5, padding: "7px 16px", borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: "pointer",
                    fontFamily: "'Outfit',sans-serif", border: `1px solid rgba(0,191,165,0.25)`, background: "rgba(0,191,165,0.08)", color: T.teal,
                  }}>{I.plus} Add Unit Type</button>
                }>
                  {/* Summary KPIs */}
                  {form.units.length > 0 && (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 16 }}>
                      <KPI label="Total Units" value={form.units.reduce((s, u) => s + (Number(u.total) || 0), 0)} icon="🏠" color={T.white} delay={1} />
                      <KPI label="Available" value={form.units.reduce((s, u) => s + (Number(u.available) || 0), 0)} icon="✅" color={T.green} delay={2} />
                      <KPI label="Sold" value={form.units.reduce((s, u) => s + ((Number(u.total) || 0) - (Number(u.available) || 0)), 0)} icon="🔥" color={T.gold} delay={3} />
                    </div>
                  )}

                  <div className="chart-box" style={{ padding: form.units.length === 0 ? 40 : 0, overflow: "hidden" }}>
                    {form.units.length === 0 ? (
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 36, marginBottom: 12, opacity: 0.4 }}>🏠</div>
                        <p style={{ color: T.textMuted, fontSize: 13 }}>No unit types added yet</p>
                        <p style={{ color: T.textMuted, fontSize: 11, marginTop: 4 }}>Click "+ Add Unit Type" to define inventory</p>
                      </div>
                    ) : (
                      <>
                        {/* Table header */}
                        <div style={{ display: "grid", gridTemplateColumns: "120px 1fr 1fr 1fr 60px", gap: 12, padding: "12px 20px", borderBottom: `2px solid ${T.border}`, background: T.surfaceAlt }}>
                          {["Type", "Available", "Total", "Sold %", ""].map(h => (
                            <span key={h} style={{ fontSize: 9, fontWeight: 700, color: T.textMuted, letterSpacing: 1, textTransform: "uppercase" }}>{h}</span>
                          ))}
                        </div>
                        {form.units.map((u, i) => {
                          const soldPct = (Number(u.total) || 0) > 0 ? Math.round(((Number(u.total) - Number(u.available)) / Number(u.total)) * 100) : 0;
                          return (
                            <div key={i} className="fade-up" style={{ display: "grid", gridTemplateColumns: "120px 1fr 1fr 1fr 60px", gap: 12, padding: "12px 20px", borderBottom: `1px solid ${T.border}`, alignItems: "center", animationDelay: `${i * 0.03}s` }}
                              onMouseEnter={e => e.currentTarget.style.background = T.surfaceAlt}
                              onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                              <select value={u.type} onChange={e => setUnit(i, "type", e.target.value)}
                                style={{ ...inputStyle, fontSize: 12, padding: "8px 10px" }}>
                                {["STUDIO","1BR","2BR","3BR","4BR","5BR","PENTHOUSE","TOWNHOUSE","VILLA","DUPLEX"].map(t => <option key={t} value={t}>{t}</option>)}
                              </select>
                              <input type="number" min="0" value={u.available} onChange={e => setUnit(i, "available", e.target.value)}
                                style={{ ...inputStyle, fontSize: 12, padding: "8px 10px" }}
                                onFocus={e => { e.target.style.borderColor = T.gold; }} onBlur={e => { e.target.style.borderColor = T.border; }} />
                              <input type="number" min="0" value={u.total} onChange={e => setUnit(i, "total", e.target.value)}
                                style={{ ...inputStyle, fontSize: 12, padding: "8px 10px" }}
                                onFocus={e => { e.target.style.borderColor = T.gold; }} onBlur={e => { e.target.style.borderColor = T.border; }} />
                              <div>
                                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                  <div style={{ flex: 1, height: 5, borderRadius: 3, background: T.surfaceAlt }}>
                                    <div style={{ width: `${soldPct}%`, height: "100%", borderRadius: 3, background: soldPct >= 80 ? T.red : soldPct >= 50 ? T.gold : T.green }} />
                                  </div>
                                  <span style={{ fontSize: 10, fontWeight: 700, color: soldPct >= 80 ? T.red : soldPct >= 50 ? T.gold : T.green }}>{soldPct}%</span>
                                </div>
                              </div>
                              <button type="button" onClick={() => removeUnit(i)} style={{
                                width: 28, height: 28, borderRadius: 6, border: `1px solid rgba(239,68,68,0.2)`,
                                background: "rgba(239,68,68,0.06)", color: T.red, cursor: "pointer",
                                display: "flex", alignItems: "center", justifyContent: "center",
                              }}>{I.trash}</button>
                            </div>
                          );
                        })}
                      </>
                    )}
                  </div>
                </Section>
              )}

              {/* ─── CONTACT ─── */}
              {activeSection === "contact" && (
                <Section title="Contact & Media" sub="Inquiry channels and project assets">
                  <div className="chart-box" style={{ padding: 24 }}>
                    <div className="pm-form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                      <Input label="WhatsApp" value={form.whatsapp} onChange={v => set("whatsapp", v)} placeholder="+971..." />
                      <Input label="Email" value={form.email} onChange={v => set("email", v)} placeholder="sales@emaar.ae" />
                      <Input label="Phone" value={form.phone} onChange={v => set("phone", v)} placeholder="+971..." />
                      <Input label="Image URL" value={form.imageUrl} onChange={v => set("imageUrl", v)} placeholder="https://..." />
                    </div>
                    <div style={{ marginTop: 16 }}>
                      <Input label="Description / Notes" value={form.description} onChange={v => set("description", v)} placeholder="Project highlights, key selling points..." rows={4} />
                    </div>
                    {form.imageUrl && (
                      <div style={{ marginTop: 16, borderRadius: 10, overflow: "hidden", border: `1px solid ${T.border}` }}>
                        <img src={form.imageUrl} alt="Preview" style={{ width: "100%", height: 180, objectFit: "cover" }} onError={e => { e.target.style.display = "none"; }} />
                      </div>
                    )}
                  </div>
                </Section>
              )}

              {/* ─── LOCATION ─── */}
              {activeSection === "location" && (
                <Section title="Location Data" sub="Geographic coordinates and area info">
                  <div className="chart-box" style={{ padding: 24 }}>
                    <div className="pm-form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
                      <Input label="Latitude" value={form.lat} onChange={v => set("lat", v)} placeholder="25.xxxxx" />
                      <Input label="Longitude" value={form.lng} onChange={v => set("lng", v)} placeholder="55.xxxxx" />
                      <Input label="Area" value={form.area} onChange={v => set("area", v)} placeholder="Dubai Marina" />
                    </div>
                  </div>
                </Section>
              )}

              {/* Bottom Save */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
                {hasChanges && <span style={{ fontSize: 11, color: T.gold, lineHeight: "40px" }}>You have unsaved changes</span>}
                <button type="button" onClick={handleSave} disabled={saving} style={{
                  display: "flex", alignItems: "center", gap: 6, padding: "10px 28px", borderRadius: 10, border: "none", cursor: saving ? "wait" : "pointer",
                  background: `linear-gradient(135deg, ${T.gold}, ${T.goldLight})`, color: T.bg,
                  fontWeight: 800, fontSize: 13, fontFamily: "'Outfit',sans-serif",
                  boxShadow: "0 4px 16px rgba(212,168,67,0.3)", transition: "all 0.2s",
                }}
                  onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 28px rgba(212,168,67,0.4)"; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(212,168,67,0.3)"; }}>
                  {I.save} {saving ? "Saving..." : "Save All Changes"}
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
