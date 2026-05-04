/* """""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""
   DXB ANALYTICS  PROJECT MANAGER
   Matching dashboard design DNA: sidebar, KPI cards, sections
   """"""""""""""""""""""""""""""""""""""""""""""""""""""""""""""" */
import React, { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { collection, getDocs, doc, getDoc, setDoc } from "firebase/firestore";

/*  THEME (exact dashboard match)  */
const T = {
  bg: "#04090F", surface: "#0A1628", surfaceAlt: "#0E1D35", card: "#0D1B30",
  gold: "#D4A843", goldLight: "#E8C96A", goldDim: "#B8912F", goldGlow: "rgba(212,168,67,0.12)",
  teal: "#00BFA5", white: "#FFFFFF",
  textPrimary: "#E2E8F0", textSecondary: "#94A3B8", textMuted: "#64748B",
  border: "rgba(212,168,67,0.08)", borderHover: "rgba(212,168,67,0.2)",
  red: "#EF4444", green: "#10B981", blue: "#3B82F6", purple: "#8B5CF6",
};

/*  ICONS (matching dashboard SVG style)  */
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

/*  CSS (exactly matching main dashboard design DNA)  */
const css = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700;9..144,900&display=swap');
* { margin: 0; padding: 0; box-sizing: border-box; }
html { font-size: 14px; }
body { background: ${T.bg}; color: ${T.textPrimary}; font-family: 'Outfit', sans-serif; }
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: rgba(212,168,67,0.2); border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: rgba(212,168,67,0.35); }
* { scrollbar-width: thin; scrollbar-color: rgba(212,168,67,0.15) transparent; }
select option { background: ${T.surface}; color: ${T.textPrimary}; }

@keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
@keyframes slideRight { from { opacity: 0; transform: translateX(16px); } to { opacity: 1; transform: translateX(0); } }
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
@keyframes spin { to { transform: rotate(360deg); } }
@keyframes glow { 0%, 100% { box-shadow: 0 0 12px rgba(212,168,67,0.1); } 50% { box-shadow: 0 0 24px rgba(212,168,67,0.25); } }
.fade-up { animation: fadeUp 0.5s ease-out forwards; opacity: 0; }
  @keyframes toastIn { 0% { opacity: 0; transform: translateY(20px); } 100% { opacity: 1; transform: translateY(0); } }
  @keyframes toastOut { 0% { opacity: 1; } 100% { opacity: 0; transform: translateY(-10px); } }
  .toast-notify { animation: toastIn 0.3s ease-out, toastOut 0.4s ease-in 2.4s forwards; }
.slide-right { animation: slideRight 0.35s ease-out both; }

.kpi-card {
  background: linear-gradient(135deg, ${T.card} 0%, ${T.surfaceAlt} 100%);
  border: 1px solid ${T.border};
  border-radius: 16px;
  padding: 20px 16px;
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
}
.kpi-card:hover {
  border-color: ${T.borderHover};
  transform: translateY(-2px);
  box-shadow: 0 8px 32px rgba(0,0,0,0.3), 0 0 0 1px rgba(212,168,67,0.1);
}
.kpi-card::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, ${T.gold}, transparent);
  opacity: 0;
  transition: opacity 0.3s;
}
.kpi-card:hover::before { opacity: 1; }

.chart-box {
  background: linear-gradient(180deg, ${T.card} 0%, rgba(4,9,15,0.95) 100%);
  border: 1px solid ${T.border};
  border-radius: 16px;
  padding: 20px;
  transition: border-color 0.3s;
}
.chart-box:hover { border-color: ${T.borderHover}; }

.sidebar-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 11px 16px;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-family: 'Outfit', sans-serif;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s ease;
  color: ${T.textSecondary};
  background: transparent;
  text-align: left;
  position: relative;
}
.sidebar-btn:hover { background: rgba(212,168,67,0.06); color: ${T.white}; }
.sidebar-btn.active {
  background: linear-gradient(135deg, rgba(212,168,67,0.12), rgba(212,168,67,0.04));
  color: ${T.gold};
  font-weight: 600;
}
.sidebar-btn.active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 60%;
  background: ${T.gold};
  border-radius: 0 3px 3px 0;
}

.mobile-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.6);
  backdrop-filter: blur(4px);
  z-index: 90;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.3s;
}
.mobile-overlay.open { opacity: 1; pointer-events: auto; }

@media (max-width: 768px) {
  .pm-sidebar { transform: translateX(-100%); position: fixed !important; z-index: 100; }
  .pm-sidebar.open { transform: translateX(0); }
  .pm-main { margin-left: 0 !important; }
  .pm-topbar { left: 0 !important; }
  .pm-mobile-btn { display: flex !important; }
  .pm-header { flex-wrap: wrap; gap: 8px; }
  .pm-pills { overflow-x: auto; flex-wrap: nowrap !important; -webkit-overflow-scrolling: touch; scrollbar-width: none; }
  .pm-pills::-webkit-scrollbar { display: none; }
  .pm-pills button { flex-shrink: 0; }
  .pm-form-grid { grid-template-columns: 1fr !important; }
  .pm-unit-table { overflow-x: auto; -webkit-overflow-scrolling: touch; }
  .pm-kpi-grid { grid-template-columns: 1fr 1fr !important; }
}
@media (max-width: 480px) {
  .pm-kpi-grid { grid-template-columns: 1fr !important; }
}
`;

/*  SAFE FIRESTORE DATA  */
function plainify(obj) {
  if (obj === null || obj === undefined) return "";
  if (typeof obj === "string" || typeof obj === "number" || typeof obj === "boolean") return obj;
  if (typeof obj.toDate === "function") return obj.toDate().toISOString();
  if (Array.isArray(obj)) return obj.map(plainify);
  if (typeof obj === "object") { const o = {}; Object.keys(obj).forEach(k => { o[k] = plainify(obj[k]); }); return o; }
  return String(obj);
}

/* """""""""""""""""""""""""""""""""""""""
   MAIN COMPONENT
   """"""""""""""""""""""""""""""""""""""" */
/*  REUSABLE COMPONENTS (outside component to prevent re-mount on state change)  */
const inputStyle = {
  width: "100%", padding: "11px 14px", background: T.bg, border: `1px solid ${T.border}`,
  borderRadius: 10, color: T.textPrimary, fontSize: 13, fontFamily: "'Outfit',sans-serif",
  outline: "none", transition: "border-color 0.2s, box-shadow 0.2s",
};
const labelStyle = { display: "block", fontSize: 9, fontWeight: 700, color: T.textMuted, marginBottom: 6, letterSpacing: 1, textTransform: "uppercase" };

const KPI = ({ label, value, sub, color, delay = 0 }) => (
  <div className="kpi-card fade-up" style={{ animationDelay: `${delay * 0.05}s` }}>
    <div style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 10 }}>{label}</div>
    <div style={{ fontFamily: "'Fraunces',serif", fontSize: 28, fontWeight: 900, color: color || T.gold, lineHeight: 1 }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.green, marginTop: 8, fontWeight: 500 }}>{sub}</div>}
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

export default function ProjectManager({ embedded = false }) {
  const [isAdmin, setIsAdmin] = useState(embedded ? true : false);
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

  /*  AUTH  */
  useEffect(() => {
    if (embedded) { setLoading(false); return; }
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
  }, [embedded]);

  /*  FETCH PROJECTS  */
  useEffect(() => {
    if (!isAdmin) return;
    (async () => {
      try {
        const snap = await getDocs(collection(db, "projectData"));
        const list = [];
        snap.forEach(d => list.push({ id: d.id, ...plainify(d.data()) }));
        list.sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));
        setProjects(list);
      } catch (e) { console.error("Fetch:", e); }
    })();
  }, [isAdmin]);

  /*  PROJECT SELECTION  */
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

  /*  FORM HELPERS  */
  function set(key, val) { setForm(prev => ({ ...prev, [key]: val })); setHasChanges(true); }
  function setUnit(i, key, val) {
    setForm(prev => { const u = [...prev.units]; u[i] = { ...u[i], [key]: val }; return { ...prev, units: u }; });
    setHasChanges(true);
  }
  function addUnit() { setForm(prev => ({ ...prev, units: [...prev.units, { type: "1BR", available: 0, total: 0 }] })); setHasChanges(true); }
  function removeUnit(i) { if (!window.confirm(`a️ REMOVE UNIT TYPE\n\nUnit: ${form.units[i]?.type || "Unit"} (${form.units[i]?.total || 0} total)\n\nThis will:\n⬢ Remove this unit type from the project\n⬢ Total and available counts will be lost\n⬢ Save the project to apply changes\n\nContinue?`)) return; setForm(prev => ({ ...prev, units: prev.units.filter((_, x) => x !== i) })); setHasChanges(true); }

  /*  SAVE  */
  async function handleSave() {
    if (!form || !selectedId) return;
    setSaving(true);
    try {
      const data = { ...form, lastUpdated: new Date().toISOString(), constructionProgress: Number(form.constructionProgress) || 0 };
      data.units = data.units.map(u => ({ type: u.type, available: Number(u.available) || 0, total: Number(u.total) || 0 }));
      await setDoc(doc(db, "projectData", selectedId), data, { merge: true });
      setProjects(prev => prev.map(p => p.id === selectedId ? { ...p, ...data } : p));
      setHasChanges(false);
      notify("S& Project saved successfully!");
    } catch (e) { notify("R Error: " + e.message); }
    setSaving(false);
  }

  function notify(msg) { setToast(msg); setTimeout(() => setToast(""), 3000); }

  /*  FILTERS  */
  const communities = [...new Set(projects.map(p => p.community))].filter(Boolean).sort();
  const filtered = projects.filter(p => {
    const ms = !search || (p.name || "").toLowerCase().includes(search.toLowerCase()) || (p.community || "").toLowerCase().includes(search.toLowerCase());
    const mc = communityFilter === "all" || p.community === communityFilter;
    return ms && mc;
  });

  /*  STATS  */
  const totalUnits = projects.reduce((s, p) => s + (Array.isArray(p.units) ? p.units.reduce((a, u) => a + (Number(u.total) || 0), 0) : 0), 0);
  const availUnits = projects.reduce((s, p) => s + (Array.isArray(p.units) ? p.units.reduce((a, u) => a + (Number(u.available) || 0), 0) : 0), 0);
  const avgProgress = projects.length > 0 ? Math.round(projects.reduce((s, p) => s + (Number(p.constructionProgress) || 0), 0) / projects.length) : 0;
  const progress = form ? (Number(form.constructionProgress) || 0) : 0;
  const progressColor = progress >= 80 ? T.green : progress >= 40 ? T.gold : T.textMuted;

  /*  EDITOR SECTIONS NAV  */
  const SECTIONS = [
    { id: "basic", label: "Basic Info", icon: I.building },
    { id: "pricing", label: "Pricing", icon: I.dollar },
    { id: "units", label: "Units", icon: I.home },
    { id: "contact", label: "Contact", icon: I.phone },
    { id: "location", label: "Location", icon: I.mapPin },
  ];

  /*  LOADING  */
  if (loading) return (
    <div style={{ minHeight: "100vh", background: T.bg, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
      <style>{css}</style>
      <svg width="40" height="40" viewBox="0 0 40 40">
        <rect x="2" y="2" width="36" height="36" rx="8" fill="none" stroke={T.gold} strokeWidth="2" />
        <path d="M12 28V12h10l-6 8h8l-12 8z" fill={T.gold} />
      </svg>
      <div style={{ color: T.gold, fontFamily: "'Fraunces', serif", fontSize: 18, fontWeight: 700 }}>DXB Analytics</div>
      <div style={{ width: 24, height: 24, border: `2px solid ${T.border}`, borderTopColor: T.gold, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
    </div>
  );

  if (!isAdmin) return (
    <div style={{ minHeight: "100vh", background: T.bg, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 20, fontFamily: "'Outfit',sans-serif" }}>
      <style>{css}</style>
      <svg width="48" height="48" viewBox="0 0 40 40">
        <rect x="2" y="2" width="36" height="36" rx="8" fill="none" stroke={T.gold} strokeWidth="2" />
        <path d="M12 28V12h10l-6 8h8l-12 8z" fill={T.gold} />
      </svg>
      <h1 style={{ fontFamily: "'Fraunces',serif", fontSize: 24, fontWeight: 800, color: T.white }}>Admin Access Required</h1>
      <p style={{ color: T.textSecondary, fontSize: 13 }}>You don't have permission to access this page.</p>
      <a href="/" style={{ color: T.gold, fontSize: 13, textDecoration: "none", padding: "10px 24px", border: `1px solid ${T.gold}`, borderRadius: 10, fontWeight: 600, transition: "all 0.2s" }}>  Back to Dashboard</a>
    </div>
  );

  /*  RENDER (components defined at module level above)  */

  /* """""""""""""""""""""""""""""""""""""""
     EMBEDDED MODE (inside AdminPanel tab)
     """"""""""""""""""""""""""""""""""""""" */
  if (embedded) {
    return (
      <div style={{ fontFamily: "'Outfit',sans-serif", color: T.textPrimary }}>
        <style>{css}</style>
        {toast && <div key={toast} className="toast-notify" style={{ position: "fixed", bottom: 24, right: 24, padding: "12px 24px", borderRadius: 10, background: toast.includes("\u2705") ? T.green : T.red, color: T.white, fontWeight: 700, fontSize: 13, zIndex: 9999, boxShadow: "0 12px 40px rgba(0,0,0,0.4)" }}>{toast}</div>}
        <div style={{ display: "flex", gap: 0, minHeight: "calc(100vh - 140px)" }}>
          {/* Left: Project List */}
          <div style={{ width: 260, flexShrink: 0, background: T.surface, borderRight: `1px solid ${T.border}`, borderRadius: "12px 0 0 12px", display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "14px 12px 8px" }}>
              <div style={{ position: "relative" }}>
                <div style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: T.textMuted }}>{I.search}</div>
                <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search projects..."
                  style={{ width: "100%", padding: "8px 10px 8px 32px", background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8, color: T.white, fontSize: 12, fontFamily: "'Outfit',sans-serif", outline: "none", boxSizing: "border-box" }}
                  onFocus={e => { e.target.style.borderColor = T.gold; }} onBlur={e => { e.target.style.borderColor = T.border; }} />
              </div>
              <select value={communityFilter} onChange={e => setCommunityFilter(e.target.value)}
                style={{ width: "100%", marginTop: 6, padding: "6px 8px", background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 6, color: T.textSecondary, fontSize: 10, fontFamily: "'Outfit',sans-serif", outline: "none", cursor: "pointer", boxSizing: "border-box" }}>
                <option value="all">All Communities</option>
                {communities.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div style={{ padding: "4px 12px 6px", fontSize: 9, fontWeight: 700, color: T.textMuted, letterSpacing: 1.5, textTransform: "uppercase" }}>{filtered.length} Projects</div>
            <div style={{ flex: 1, overflowY: "auto", padding: "0 6px 12px" }}>
              {filtered.map((p) => {
                const active = selectedId === p.id;
                const prog = Number(p.constructionProgress) || 0;
                return (
                  <div key={p.id} onClick={() => handleSelect(p.id)} style={{
                    display: "flex", alignItems: "center", gap: 8, padding: "8px 8px", borderRadius: 8, cursor: "pointer",
                    marginBottom: 1, transition: "all 0.15s",
                    background: active ? T.goldGlow : "transparent",
                    border: `1px solid ${active ? T.borderHover : "transparent"}`,
                  }}
                    onMouseEnter={e => { if (!active) { e.currentTarget.style.background = T.surfaceAlt; } }}
                    onMouseLeave={e => { if (!active) { e.currentTarget.style.background = active ? T.goldGlow : "transparent"; } }}>
                    <div style={{ width: 28, height: 28, borderRadius: 6, flexShrink: 0, background: active ? `linear-gradient(135deg, ${T.gold}, ${T.goldDim})` : T.surfaceAlt, color: active ? T.bg : T.textMuted, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 10 }}>
                      {(p.name || "?")[0]}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: active ? T.gold : T.white, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</div>
                      <div style={{ fontSize: 8, color: T.textMuted }}>{p.community}</div>
                    </div>
                    <div style={{ fontSize: 8, color: prog >= 80 ? T.green : prog > 0 ? T.gold : T.textMuted, fontWeight: 700 }}>{prog}%</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Content */}
          <div style={{ flex: 1, padding: "20px 24px", overflowY: "auto" }}>
            {/* Save button bar */}
            {form && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div>
                  <h2 style={{ fontSize: 16, fontWeight: 700, color: T.white }}>{form.name || "Untitled"}</h2>
                  <p style={{ fontSize: 10, color: T.textMuted }}>{form.community}  <span style={{ color: form.status === "Under Construction" ? T.green : T.blue }}>{form.status}</span></p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {hasChanges && <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 8, background: T.surfaceAlt, border: `1px solid ${T.gold}30` }}><div style={{ width: 5, height: 5, borderRadius: "50%", background: T.gold }} /><span style={{ fontSize: 10, fontWeight: 600, color: T.gold }}>Unsaved</span></div>}
                  <button type="button" onClick={handleSave} disabled={saving} style={{ display: "flex", alignItems: "center", gap: 4, padding: "7px 16px", borderRadius: 8, border: "none", cursor: saving ? "wait" : "pointer", background: `linear-gradient(135deg, ${T.gold}, ${T.goldDim})`, color: T.bg, fontWeight: 700, fontSize: 11, fontFamily: "'Outfit',sans-serif" }}>
                    {I.save} {saving ? "Saving..." : "Save"}
                  </button>
                </div>
              </div>
            )}

            {!form ? (
              <div style={{ textAlign: "center", padding: "48px 20px" }}>
                <div style={{ marginBottom: 16, color: T.gold, opacity: 0.6 }}><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg></div>
                <h2 style={{ fontFamily: "'Fraunces',serif", fontSize: 20, fontWeight: 700, color: T.white, marginBottom: 8 }}>Select a Project</h2>
                <p style={{ color: T.textSecondary, fontSize: 12, maxWidth: 360, margin: "0 auto", lineHeight: 1.6 }}>Click any project from the list to edit its details.</p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginTop: 24 }}>
                  <KPI label="Total Projects" value={projects.length} delay={1} />
                  <KPI label="Communities" value={communities.length} delay={2} />
                  <KPI label="Total Units" value={totalUnits.toLocaleString()} color={T.teal} delay={3} />
                  <KPI label="Avg Construction" value={`${avgProgress}%`} color={avgProgress >= 50 ? T.green : T.gold} delay={4} />
                </div>
              </div>
            ) : (
              /* Edit form  reuse the section nav + form from main render */
              <div>
                <div style={{ display: "flex", gap: 4, marginBottom: 16, flexWrap: "wrap" }}>
                  {[{ id: "basic", label: "Basic Info" }, { id: "pricing", label: "Pricing" }, { id: "units", label: "Units" }, { id: "location", label: "Location" }, { id: "media", label: "Media" }, { id: "contact", label: "Contact" }].map(s => (
                    <button type="button" key={s.id} onClick={() => setActiveSection(s.id)}
                      style={{ padding: "6px 14px", borderRadius: 8, border: `1px solid ${activeSection === s.id ? T.gold : T.border}`, background: activeSection === s.id ? T.goldGlow : "transparent", color: activeSection === s.id ? T.gold : T.textSecondary, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit',sans-serif", transition: "all 0.2s" }}>
                      {s.label}
                    </button>
                  ))}
                </div>

                {activeSection === "basic" && (
                  <Section title="Basic Information" sub="Core project details">
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                      <Input label="Project Name" value={form.name || ""} onChange={v => set("name", v)} placeholder="e.g. The Heights" />
                      <Select label="Community" value={form.community || ""} onChange={v => set("community", v)} options={communities} />
                      <Select label="Status" value={form.status || ""} onChange={v => set("status", v)} options={["Under Construction", "Off-Plan", "Completed"]} />
                      <Select label="Type" value={form.type || ""} onChange={v => set("type", v)} options={["Apartments", "Villas", "Townhouses", "Penthouses", "Mixed"]} />
                      <Input label="Construction Progress (%)" value={form.constructionProgress || ""} onChange={v => set("constructionProgress", v)} placeholder="0-100" type="number" />
                      <Input label="Completion Year" value={form.completionYear || ""} onChange={v => set("completionYear", v)} placeholder="e.g. 2027" />
                    </div>
                    <div style={{ marginTop: 14 }}>
                      <Input label="Description" value={form.description || ""} onChange={v => set("description", v)} placeholder="Project description..." rows={3} />
                    </div>
                  </Section>
                )}

                {activeSection === "pricing" && (
                  <Section title="Pricing & Payment" sub="Price ranges and payment plans">
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                      <Input label="Start Price (AED)" value={form.startPrice || ""} onChange={v => set("startPrice", v)} placeholder="e.g. 1200000" type="number" />
                      <Input label="Price per sqft (AED)" value={form.pricePerSqft || ""} onChange={v => set("pricePerSqft", v)} placeholder="e.g. 2100" type="number" />
                    </div>
                    <div style={{ marginTop: 14 }}>
                      <Input label="Payment Plan" value={form.paymentPlan || ""} onChange={v => set("paymentPlan", v)} placeholder="e.g. 60/40, 80/20 post-handover" />
                    </div>
                  </Section>
                )}

                {activeSection === "units" && (
                  <Section title="Unit Mix" sub="Available unit types and counts"
                    action={<button type="button" onClick={() => { const u = Array.isArray(form.units) ? [...form.units] : []; u.push({ type: "Studio", total: 0, available: 0 }); set("units", u); }} style={{ padding: "4px 12px", borderRadius: 6, border: `1px solid ${T.gold}40`, background: T.goldGlow, color: T.gold, fontSize: 10, fontWeight: 700, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>+ Add Unit</button>}>
                    {(Array.isArray(form.units) ? form.units : []).map((u, i) => (
                      <div key={i} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr auto", gap: 10, marginBottom: 8, alignItems: "end" }}>
                        <Select label={i === 0 ? "Type" : ""} value={u.type || ""} onChange={v => { const arr = [...form.units]; arr[i] = { ...arr[i], type: v }; set("units", arr); }} options={["Studio", "1BR", "2BR", "3BR", "4BR", "5BR", "Penthouse", "Duplex", "Villa", "Townhouse"]} />
                        <Input label={i === 0 ? "Total" : ""} value={u.total || ""} onChange={v => { const arr = [...form.units]; arr[i] = { ...arr[i], total: Number(v) }; set("units", arr); }} type="number" />
                        <Input label={i === 0 ? "Available" : ""} value={u.available || ""} onChange={v => { const arr = [...form.units]; arr[i] = { ...arr[i], available: Number(v) }; set("units", arr); }} type="number" />
                        <button type="button" onClick={() => { const u = form.units[i]; if (!window.confirm(`a️ REMOVE UNIT TYPE\n\nUnit: ${u?.type || "Unit"} (${u?.total || 0} total)\n\nThis will remove this unit type. Save to apply.\n\nContinue?`)) return; const arr = form.units.filter((_, j) => j !== i); set("units", arr); }} style={{ padding: "6px 8px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 6, color: "#EF4444", cursor: "pointer", fontSize: 10 }}>{I.trash}</button>
                      </div>
                    ))}
                  </Section>
                )}

                {activeSection === "location" && (
                  <Section title="Location Details" sub="GPS coordinates and distances">
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                      <Input label="Latitude" value={form.gps?.lat || ""} onChange={v => set("gps", { ...form.gps, lat: Number(v) })} placeholder="e.g. 25.1234" type="number" />
                      <Input label="Longitude" value={form.gps?.lng || ""} onChange={v => set("gps", { ...form.gps, lng: Number(v) })} placeholder="e.g. 55.1234" type="number" />
                    </div>
                  </Section>
                )}

                {activeSection === "media" && (
                  <Section title="Media & Contact" sub="Images and inquiry details">
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                      <Input label="Image URL" value={form.imageUrl || ""} onChange={v => set("imageUrl", v)} placeholder="https://..." />
                      <Input label="Brochure URL" value={form.brochureUrl || ""} onChange={v => set("brochureUrl", v)} placeholder="https://..." />
                    </div>
                  </Section>
                )}

                {activeSection === "contact" && (
                  <Section title="Contact & Inquiry" sub="WhatsApp, email and phone for this project">
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                      <Input label="WhatsApp" value={form.whatsapp || ""} onChange={v => set("whatsapp", v)} placeholder="+971..." />
                      <Input label="Email" value={form.email || ""} onChange={v => set("email", v)} placeholder="sales@emaar.ae" />
                      <Input label="Phone" value={form.phone || ""} onChange={v => set("phone", v)} placeholder="+971..." />
                      <Input label="Developer Website" value={form.developerUrl || ""} onChange={v => set("developerUrl", v)} placeholder="https://..." />
                    </div>
                  </Section>
                )}

                {/* Bottom save bar */}
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
                  <button type="button" onClick={() => { setForm(null); setSelectedId(null); setHasChanges(false); }} style={{ padding: "8px 20px", borderRadius: 8, border: `1px solid ${T.border}`, background: "transparent", color: T.textSecondary, fontWeight: 600, fontSize: 11, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>Cancel</button>
                  <button type="button" onClick={handleSave} disabled={saving} style={{ padding: "8px 24px", borderRadius: 8, border: "none", cursor: saving ? "wait" : "pointer", background: `linear-gradient(135deg, ${T.gold}, ${T.goldDim})`, color: T.bg, fontWeight: 700, fontSize: 11, fontFamily: "'Outfit',sans-serif" }}>
                    {I.save} {saving ? "Saving..." : "Save All Changes"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* """""""""""""""""""""""""""""""""""""""
     FULL PAGE RENDER (standalone /manage)
     """"""""""""""""""""""""""""""""""""""" */
  return (
    <div style={{ minHeight: "100vh", background: T.bg, fontFamily: "'Outfit',sans-serif", color: T.textPrimary }}>
      <style>{css}</style>

      {/* Toast */}
      {toast && <div key={toast} className="toast-notify" style={{ position: "fixed", bottom: 24, right: 24, padding: "12px 24px", borderRadius: 10, background: toast.includes("S&") ? T.green : T.red, color: T.white, fontWeight: 700, fontSize: 13, zIndex: 9999, boxShadow: "0 12px 40px rgba(0,0,0,0.4)" }}>{toast}</div>}

      {/* Mobile overlay */}
      <div className={`mobile-overlay ${sidebarOpen ? "open" : ""}`} onClick={() => setSidebarOpen(false)} />

      {/*  LEFT SIDEBAR  */}
      <aside className={`pm-sidebar ${sidebarOpen ? "open" : ""}`} style={{ position: "fixed", top: 0, left: 0, bottom: 0, width: 240, background: T.surface, borderRight: `1px solid ${T.border}`, display: "flex", flexDirection: "column", zIndex: 100, transition: "transform 0.3s ease" }}>
        {/* Logo */}
        <div style={{ padding: "24px 20px 20px", borderBottom: `1px solid ${T.border}` }}>
          <a href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <svg width="32" height="32" viewBox="0 0 40 40">
              <rect x="2" y="2" width="36" height="36" rx="8" fill="none" stroke={T.gold} strokeWidth="2" />
              <path d="M12 28V12h10l-6 8h8l-12 8z" fill={T.gold} />
            </svg>
            <div>
              <div style={{ fontFamily: "'Fraunces',serif", fontSize: 16, fontWeight: 800, color: T.gold }}>DXB Analytics</div>
              <div style={{ fontSize: 9, color: T.textMuted, letterSpacing: 1.5, textTransform: "uppercase" }}>Project Manager</div>
            </div>
          </a>
        </div>

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
          <div style={{ padding: "8px 12px" }}>
            <a href="/" className="sidebar-btn" style={{ textDecoration: "none" }}>
              {I.home} <span>Dashboard</span>
            </a>
            <a href="/admin" className="sidebar-btn" style={{ textDecoration: "none" }}>
              {I.grid} <span>Admin Panel</span>
            </a>
            <a href="/landing" className="sidebar-btn" style={{ textDecoration: "none" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> <span>Landing Page</span>
            </a>
          </div>
          <div style={{ padding: "12px 16px 16px", display: "flex", alignItems: "center", gap: 10, borderTop: `1px solid ${T.border}` }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: `linear-gradient(135deg, ${T.gold}, ${T.goldDim})`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 13, color: T.bg }}>
              {(adminUser?.displayName || adminUser?.email || "A")[0].toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.white, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{adminUser?.displayName || adminUser?.email?.split("@")[0]}</div>
              <div style={{ fontSize: 10, color: T.gold, fontWeight: 600 }}>Admin</div>
            </div>
            <button type="button" onClick={() => { signOut(auth).then(() => window.location.href = "/").catch(err => console.error("Sign out failed:", err)); }} title="Sign Out" style={{ background: "none", border: "none", color: T.textMuted, cursor: "pointer", padding: 4 }}>{I.logout}</button>
          </div>
        </div>
      </aside>

      {/*  MAIN CONTENT  */}
      <main className="pm-main" style={{ marginLeft: 240, minHeight: "100vh" }}>
        {/* Top bar (matching dashboard) */}
        <header className="pm-topbar pm-header" style={{ position: "sticky", top: 0, zIndex: 20, height: 60, background: `${T.surface}ee`, backdropFilter: "blur(16px)", borderBottom: `1px solid ${T.border}`, padding: "0 28px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <a href="/" style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 34, height: 34, borderRadius: 8, background: T.surfaceAlt, border: `1px solid ${T.border}`, color: T.textSecondary, textDecoration: "none", transition: "all 0.2s" }} title="Back to Dashboard"
              onMouseEnter={e => { e.currentTarget.style.borderColor = T.gold; e.currentTarget.style.color = T.gold; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.textSecondary; }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
            </a>
            <button type="button" className="pm-mobile-btn" onClick={() => setSidebarOpen(!sidebarOpen)} style={{ display: "none", alignItems: "center", justifyContent: "center", width: 34, height: 34, borderRadius: 8, background: T.surfaceAlt, border: `1px solid ${T.border}`, color: T.textSecondary, cursor: "pointer" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            </button>
            <div>
              <h1 style={{ fontSize: 16, fontWeight: 700, color: T.white }}>
                {form ? form.name || "Untitled" : "Project Manager"}
              </h1>
              <p style={{ fontSize: 10, color: T.textMuted, letterSpacing: 1 }}>
                {form ? <>{form.community}  <span style={{ color: form.status === "Under Construction" ? T.green : T.blue }}>{form.status}</span></> : `${projects.length} projects  ${new Date().toLocaleDateString("en-AE", { day: "numeric", month: "short", year: "numeric" })}`}
              </p>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {hasChanges && (
              <div style={{ background: T.surfaceAlt, borderRadius: 10, padding: "6px 12px", border: `1px solid ${T.gold}30`, display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: T.gold, animation: "pulse 2s infinite" }} />
                <span style={{ fontSize: 11, fontWeight: 600, color: T.gold }}>Unsaved</span>
              </div>
            )}
            {form && (
              <button type="button" onClick={handleSave} disabled={saving} style={{
                display: "flex", alignItems: "center", gap: 6, padding: "8px 20px", borderRadius: 10, border: "none", cursor: saving ? "wait" : "pointer",
                background: `linear-gradient(135deg, ${T.gold}, ${T.goldDim})`, color: T.bg,
                fontWeight: 700, fontSize: 12, fontFamily: "'Outfit',sans-serif",
                boxShadow: "0 4px 16px rgba(212,168,67,0.3)", transition: "all 0.2s",
              }}>
                {I.save} {saving ? "Saving..." : "Save"}
              </button>
            )}
          </div>
        </header>

        <div style={{ padding: "28px 28px 60px" }}>
          {!form ? (
            /*  NO PROJECT SELECTED  */
            <>
              <Section title="Project Portfolio" sub={`${projects.length} Emaar projects  ${communities.length} communities  Select to edit`}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
                  <KPI label="Total Projects" value={projects.length} sub={`${projects.filter(p => p.status === "Under Construction").length} building  ${projects.filter(p => p.status === "Off-Plan").length} off-plan`} delay={1} />
                  <KPI label="Communities" value={communities.length} sub={communities.slice(0, 3).join("  ") + (communities.length > 3 ? ` +${communities.length - 3}` : "")} delay={2} />
                  <KPI label="Total Units" value={totalUnits.toLocaleString()} sub={`${availUnits.toLocaleString()} available`} color={T.teal} delay={3} />
                  <KPI label="Avg Construction" value={`${avgProgress}%`} sub="Weighted average progress" color={avgProgress >= 50 ? T.green : T.gold} delay={4} />
                </div>
              </Section>

              <div className="chart-box fade-up" style={{ padding: 48, textAlign: "center" }}>
                <div style={{ marginBottom: 16, color: T.gold, opacity: 0.6 }}><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg></div>
                <h2 style={{ fontFamily: "'Fraunces',serif", fontSize: 24, fontWeight: 700, color: T.white, marginBottom: 8 }}>Select a Project</h2>
                <p style={{ color: T.textSecondary, fontSize: 13, maxWidth: 420, margin: "0 auto", lineHeight: 1.6 }}>
                  Click any project from the sidebar to edit its details  pricing, units, status, contact info, and location data.
                </p>
              </div>
            </>
          ) : (
            /*  PROJECT EDITOR  */
            <div className="slide-right">
              {/* Project Header */}
              <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24, paddingBottom: 20, borderBottom: `1px solid ${T.border}` }}>
                <div style={{ width: 52, height: 52, borderRadius: 12, background: `linear-gradient(135deg, ${T.gold}, ${T.goldDim})`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 20, color: T.bg, flexShrink: 0 }}>
                  {(form.name || "?")[0]}
                </div>
                <div style={{ flex: 1 }}>
                  <h1 style={{ fontFamily: "'Fraunces',serif", fontSize: 26, fontWeight: 900, color: T.white, lineHeight: 1.1 }}>{form.name || "Untitled"}</h1>
                  <p style={{ color: T.textMuted, fontSize: 12, marginTop: 3 }}>
                    {form.community}  <span style={{ color: T.textSecondary }}>{form.status}</span>  <span style={{ fontSize: 10 }}>ID: {selectedId}</span>
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

              {/*  BASIC INFO  */}
              {activeSection === "basic" && (
                <Section title="Basic Information" sub="Project identity and classification">
                  <div className="chart-box" style={{ padding: 24 }}>
                    <div className="pm-form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                      <Input label="Project Name" value={form.name} onChange={v => set("name", v)} />
                      <Input label="Community" value={form.community} onChange={v => set("community", v)} />
                      <Select label="Status" value={form.status} onChange={v => set("status", v)} options={["Off-Plan", "Under Construction", "Ready", "Sold Out", "Launching"]} />
                      <Input label="Property Type" value={form.type} onChange={v => set("type", v)} placeholder="e.g. Apartments  1-3 BR" />
                      <Select label="Segment" value={form.segment} onChange={v => set("segment", v)} options={["Affordable", "Mid-Market", "Mid-Premium", "Premium", "Ultra-Premium", "Luxury", "Luxury Branded", "Ultra-Lux Branded", "Ultra-Luxury"]} />
                      <Input label="Branded" value={form.branded} onChange={v => set("branded", v)} placeholder="Address, Vida, etc." />
                    </div>
                  </div>
                </Section>
              )}

              {/*  PRICING  */}
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

              {/*  UNITS  */}
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
                      <KPI label="Total Units" value={form.units.reduce((s, u) => s + (Number(u.total) || 0), 0)} color={T.white} delay={1} />
                      <KPI label="Available" value={form.units.reduce((s, u) => s + (Number(u.available) || 0), 0)} color={T.green} delay={2} />
                      <KPI label="Sold" value={form.units.reduce((s, u) => s + ((Number(u.total) || 0) - (Number(u.available) || 0)), 0)} color={T.gold} delay={3} />
                    </div>
                  )}

                  <div className="chart-box" style={{ padding: form.units.length === 0 ? 40 : 0, overflow: "hidden" }}>
                    {form.units.length === 0 ? (
                      <div style={{ textAlign: "center" }}>
                        <div style={{ marginBottom: 12, opacity: 0.4, color: T.textMuted }}><svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></div>
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

              {/*  CONTACT  */}
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

              {/*  LOCATION  */}
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
