/* ═══════════════════════════════════════════════════════════════
   DXB ANALYTICS — ADMIN PANEL
   Matching dashboard design DNA: sidebar nav, KPI cards, sections
   ═══════════════════════════════════════════════════════════════ */
import React, { useState, useEffect, useCallback } from "react";
import { auth, db } from "./firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { collection, getDocs, doc, getDoc, setDoc, deleteDoc } from "firebase/firestore";
import { BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";

/* ─── THEME (exact dashboard match) ─── */
const T = {
  bg: "#04090F", surface: "#0A1628", surfaceAlt: "#0E1D35", card: "#0D1B30",
  gold: "#D4A843", goldLight: "#E8C96A", goldDim: "#B8912F", goldGlow: "rgba(212,168,67,0.12)",
  teal: "#00BFA5", white: "#FFFFFF",
  textPrimary: "#E2E8F0", textSecondary: "#94A3B8", textMuted: "#64748B",
  border: "rgba(212,168,67,0.08)", borderHover: "rgba(212,168,67,0.2)",
  red: "#EF4444", green: "#10B981", blue: "#3B82F6", purple: "#8B5CF6",
  cyan: "#06B6D4", orange: "#F59E0B",
};

/* ─── ICONS (matching dashboard SVG style) ─── */
const I = {
  overview: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>,
  users: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  revenue: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
  leads: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>,
  analytics: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  logout: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  search: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  download: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  refresh: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>,
  trash: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>,
  check: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>,
  arrow: <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="18 15 12 9 6 15"/></svg>,
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
* { scrollbar-width: thin; scrollbar-color: rgba(212,168,67,0.15) transparent; }
select option { background: ${T.surface}; color: ${T.textPrimary}; }
@keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}
@keyframes spin{to{transform:rotate(360deg)}}
.fade-up{animation:fadeUp 0.4s ease-out both;}
.chart-box{background:${T.surface};border:1px solid ${T.border};border-radius:14px;padding:20px;transition:border-color 0.3s;}
.chart-box:hover{border-color:${T.borderHover};}
.admin-sidebar{transition:transform 0.3s ease;}
@media(max-width:768px){
  .admin-sidebar{position:fixed!important;z-index:200;transform:translateX(-100%);}
  .admin-sidebar.open{transform:translateX(0);}
  .admin-main{margin-left:0!important;}
  .admin-overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:199;}
  .admin-overlay.open{display:block;}
  .admin-mobile-btn{display:flex!important;}
  .kpi-grid-4{grid-template-columns:1fr 1fr!important;}
  .kpi-grid-6{grid-template-columns:1fr 1fr!important;}
  .chart-grid-2{grid-template-columns:1fr!important;}
  .chart-grid-3{grid-template-columns:1fr!important;}
  .table-scroll{overflow-x:auto;-webkit-overflow-scrolling:touch;}
}
@media(max-width:480px){
  .kpi-grid-4{grid-template-columns:1fr!important;}
  .kpi-grid-6{grid-template-columns:1fr!important;}
}
`;

/* ─── CUSTOM TOOLTIP (matching dashboard) ─── */
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "rgba(10,22,40,0.95)", border: `1px solid ${T.border}`, borderRadius: 10, padding: "10px 14px", backdropFilter: "blur(12px)" }}>
      <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 6, fontWeight: 600 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ fontSize: 12, color: p.color, fontWeight: 600, display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
          <div style={{ width: 8, height: 8, borderRadius: 2, background: p.color }} />
          {p.name}: {typeof p.value === "number" ? p.value.toLocaleString() : p.value}
        </div>
      ))}
    </div>
  );
};

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
export default function AdminPanel() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [adminUser, setAdminUser] = useState(null);
  const [tab, setTab] = useState("overview");
  const [users, setUsers] = useState([]);
  const [userSearch, setUserSearch] = useState("");
  const [tierFilter, setTierFilter] = useState("All");
  const [sortBy, setSortBy] = useState("newest");
  const [toast, setToast] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  /* ─── ESCAPE KEY ─── */
  useEffect(() => {
    const handleKey = (e) => { if (e.key === "Escape") setSidebarOpen(false); };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

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

  /* ─── FETCH USERS ─── */
  const fetchUsers = useCallback(async () => {
    try {
      const snap = await getDocs(collection(db, "users"));
      const list = [];
      snap.forEach(d => list.push({ uid: d.id, ...plainify(d.data()) }));
      setUsers(list);
    } catch (e) { console.error("Fetch users:", e); }
  }, []);

  useEffect(() => { if (isAdmin) fetchUsers(); }, [isAdmin, fetchUsers]);

  /* ─── USER STATS ─── */
  const now = new Date();
  const stats = {
    total: users.length,
    today: users.filter(u => { try { return new Date(u.createdAt).toDateString() === now.toDateString(); } catch { return false; } }).length,
    thisWeek: users.filter(u => { try { return (now - new Date(u.createdAt)) < 7 * 86400000; } catch { return false; } }).length,
    thisMonth: users.filter(u => { try { const d = new Date(u.createdAt); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); } catch { return false; } }).length,
    proTrial: users.filter(u => u.tier === "pro_trial" && (!u.trialEnd || new Date(u.trialEnd) > now)).length,
    free: users.filter(u => u.tier === "free" || !u.tier).length,
    expired: users.filter(u => u.tier === "pro_trial" && u.trialEnd && new Date(u.trialEnd) <= now).length,
    pro: users.filter(u => u.tier === "pro").length,
    enterprise: users.filter(u => u.tier === "enterprise").length,
  };
  stats.paid = stats.pro + stats.enterprise;
  stats.freeExpired = stats.free + stats.expired;
  const mrr = (stats.pro * 99) + (stats.enterprise * 499);
  const arr = mrr * 12;
  const projectedMRR = mrr + Math.round(stats.proTrial * 99 * 0.3);
  const trialConversion = (stats.pro + stats.expired) > 0 ? Math.round((stats.pro / (stats.pro + stats.expired)) * 100) : 0;

  /* ─── SIGNUP TIMELINE DATA ─── */
  const signupTimeline = (() => {
    const days = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now); d.setDate(d.getDate() - i);
      const key = d.toDateString();
      const count = users.filter(u => { try { return new Date(u.createdAt).toDateString() === key; } catch { return false; } }).length;
      days.push({ date: `${d.getDate()} ${d.toLocaleString("en", { month: "short" })}`, count });
    }
    return days;
  })();

  /* ─── TIER DISTRIBUTION ─── */
  const tierData = [
    { name: "Pro Trial", value: stats.proTrial, color: T.gold },
    { name: "Free", value: stats.free, color: T.textMuted },
    { name: "Pro", value: stats.pro, color: T.green },
    { name: "Enterprise", value: stats.enterprise, color: T.teal },
    { name: "Expired", value: stats.expired, color: T.red },
  ].filter(d => d.value > 0);

  /* ─── CUMULATIVE GROWTH ─── */
  const cumulativeData = (() => {
    const sorted = [...users].sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
    return sorted.map((u, i) => {
      const d = new Date(u.createdAt || now);
      return { date: `${d.getDate()}/${d.getMonth() + 1}`, total: i + 1 };
    });
  })();

  /* ─── REVENUE PROJECTION ─── */
  const revenueProjection = [
    { month: "Now", revenue: mrr },
    { month: "+1mo", revenue: Math.round(mrr + projectedMRR * 0.3) },
    { month: "+2mo", revenue: Math.round(mrr + projectedMRR * 0.6) },
    { month: "+3mo", revenue: Math.round(mrr + projectedMRR) },
    { month: "+6mo", revenue: Math.round((mrr + projectedMRR) * 1.8) },
  ];

  /* ─── ACTIONS ─── */
  const changeTier = async (uid, tier) => {
    const u = users.find(x => x.uid === uid);
    if (!window.confirm(`Change ${u?.name || u?.email || uid} to "${tier}"?`)) return;
    try {
      const data = { tier };
      if (tier === "pro_trial") { const end = new Date(); end.setDate(end.getDate() + 7); data.trialEnd = end.toISOString(); }
      await setDoc(doc(db, "users", uid), data, { merge: true });
      notify(`✅ Tier updated to ${tier}`);
      fetchUsers();
    } catch (e) { notify("❌ Error: " + e.message); }
  };

  const deleteUser = async (uid) => {
    if (!window.confirm("Delete this user permanently?")) return;
    try { await deleteDoc(doc(db, "users", uid)); notify("✅ User deleted"); fetchUsers(); } catch (e) { notify("❌ " + e.message); }
  };

  const exportCSV = () => {
    const headers = "Name,Email,Tier,Trial Status,Signed Up\n";
    const rows = users.map(u => `${u.name || ""},${u.email || ""},${u.tier || "free"},${u.trialEnd ? (new Date(u.trialEnd) > now ? "Active" : "Expired") : "—"},${u.createdAt || ""}`).join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `dxb-users-${now.toISOString().slice(0, 10)}.csv`; a.click();
    notify("✅ CSV exported");
  };

  const notify = (msg) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  /* ─── FILTERED USERS ─── */
  const filteredUsers = users
    .filter(u => {
      const ms = !userSearch || (u.name || "").toLowerCase().includes(userSearch.toLowerCase()) || (u.email || "").toLowerCase().includes(userSearch.toLowerCase());
      let mt = true;
      if (tierFilter === "Free") mt = u.tier === "free" || !u.tier;
      else if (tierFilter === "Pro Trial") mt = u.tier === "pro_trial" && (!u.trialEnd || new Date(u.trialEnd) > now);
      else if (tierFilter === "Pro") mt = u.tier === "pro";
      else if (tierFilter === "Enterprise") mt = u.tier === "enterprise";
      else if (tierFilter === "Expired") mt = u.tier === "pro_trial" && u.trialEnd && new Date(u.trialEnd) <= now;
      return ms && mt;
    })
    .sort((a, b) => {
      if (sortBy === "newest") return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      if (sortBy === "oldest") return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
      if (sortBy === "name") return (a.name || "").localeCompare(b.name || "");
      return 0;
    });

  const timeSince = (d) => {
    try {
      const ms = now - new Date(d); const m = Math.floor(ms / 60000); const h = Math.floor(ms / 3600000); const dy = Math.floor(ms / 86400000);
      if (m < 1) return "Just now"; if (m < 60) return `${m}m ago`; if (h < 24) return `${h}h ago`; return `${dy}d ago`;
    } catch { return "—"; }
  };

  const trialDaysLeft = (u) => {
    if (!u.trialEnd) return null;
    const left = Math.ceil((new Date(u.trialEnd) - now) / 86400000);
    return left > 0 ? left : 0;
  };

  const tierBadge = (u) => {
    const expired = u.tier === "pro_trial" && u.trialEnd && new Date(u.trialEnd) <= now;
    if (expired) return { label: "Expired", bg: "rgba(239,68,68,0.12)", color: T.red };
    if (u.tier === "pro_trial") return { label: "Pro Trial", bg: "rgba(212,168,67,0.12)", color: T.gold };
    if (u.tier === "pro") return { label: "Pro", bg: "rgba(16,185,129,0.12)", color: T.green };
    if (u.tier === "enterprise") return { label: "Enterprise", bg: "rgba(0,191,165,0.12)", color: T.teal };
    return { label: "Free", bg: "rgba(148,163,184,0.1)", color: T.textMuted };
  };

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
    <div style={{ marginBottom: 28 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 16 }}>
        <div style={{ borderLeft: `3px solid ${T.gold}`, paddingLeft: 14 }}>
          <h2 style={{ fontFamily: "'Fraunces',serif", fontSize: 22, fontWeight: 800, color: T.white, lineHeight: 1.2 }}>{title}</h2>
          {sub && <p style={{ fontSize: 12, color: T.textSecondary, marginTop: 3 }}>{sub}</p>}
        </div>
        {action}
      </div>
      {children}
    </div>
  );

  const Chart = ({ title, sub, children }) => (
    <div className="chart-box fade-up" style={{ padding: 20 }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: sub ? 2 : 14 }}>{title}</div>
      {sub && <div style={{ fontSize: 11, color: T.textSecondary, marginBottom: 14 }}>{sub}</div>}
      {children}
    </div>
  );

  /* ─── TABS CONFIG ─── */
  const TABS = [
    { id: "overview", label: "Overview", icon: I.overview },
    { id: "users", label: "Users", icon: I.users },
    { id: "revenue", label: "Revenue", icon: I.revenue },
    { id: "leads", label: "Leads", icon: I.leads },
    { id: "analytics", label: "Analytics", icon: I.analytics },
  ];

  /* ═══════════════════════════════════════
     RENDER
     ═══════════════════════════════════════ */
  return (
    <div style={{ minHeight: "100vh", background: T.bg, fontFamily: "'Outfit',sans-serif", color: T.textPrimary, display: "flex" }}>
      <style>{css}</style>

      {/* Toast */}
      {toast && <div className="fade-up" style={{ position: "fixed", bottom: 24, right: 24, padding: "12px 24px", borderRadius: 10, background: toast.includes("✅") ? T.green : T.red, color: T.white, fontWeight: 700, fontSize: 13, zIndex: 9999, boxShadow: "0 12px 40px rgba(0,0,0,0.4)" }}>{toast}</div>}

      {/* Mobile overlay */}
      <div className={`admin-overlay ${sidebarOpen ? "open" : ""}`} onClick={() => setSidebarOpen(false)} />

      {/* ─── SIDEBAR (matching dashboard) ─── */}
      <aside className={`admin-sidebar ${sidebarOpen ? "open" : ""}`} role="navigation" aria-label="Admin navigation" style={{ width: 220, height: "100vh", position: "sticky", top: 0, borderRight: `1px solid ${T.border}`, display: "flex", flexDirection: "column", background: "rgba(10,22,40,0.4)", flexShrink: 0 }}>
        {/* Logo */}
        <a href="/" style={{ display: "flex", alignItems: "center", gap: 10, padding: "20px 20px 6px", textDecoration: "none" }}>
          <svg width="28" height="28" viewBox="0 0 40 40"><rect x="2" y="2" width="36" height="36" rx="8" fill="none" stroke={T.gold} strokeWidth="2" /><path d="M12 28V12h10l-6 8h8l-12 8z" fill={T.gold} /></svg>
          <div>
            <div style={{ fontFamily: "'Fraunces',serif", fontSize: 15, fontWeight: 800, color: T.gold, lineHeight: 1 }}>DXB Analytics</div>
            <div style={{ fontSize: 8, fontWeight: 700, color: T.textMuted, letterSpacing: 1.5, textTransform: "uppercase", marginTop: 2 }}>ADMIN PANEL</div>
          </div>
        </a>

        {/* Top Bar Info */}
        <div style={{ padding: "12px 20px 16px", borderBottom: `1px solid ${T.border}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: T.textSecondary }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: T.green, animation: "pulse 2s infinite" }} />
            <span>{stats.total} users · {stats.paid} paid</span>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "12px 10px", overflowY: "auto" }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: T.textMuted, letterSpacing: 1.5, padding: "8px 10px 10px", textTransform: "uppercase" }}>Platform</div>
          {TABS.map(t => (
            <button type="button" key={t.id} onClick={() => setTab(t.id)} style={{
              width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10,
              border: "none", cursor: "pointer", fontFamily: "'Outfit',sans-serif", fontSize: 13, fontWeight: tab === t.id ? 600 : 400,
              background: tab === t.id ? T.goldGlow : "transparent",
              color: tab === t.id ? T.gold : T.textSecondary,
              transition: "all 0.15s",
            }}>
              <span style={{ color: tab === t.id ? T.gold : T.textMuted, transition: "color 0.15s" }}>{t.icon}</span>
              {t.label}
            </button>
          ))}

          <div style={{ fontSize: 9, fontWeight: 700, color: T.textMuted, letterSpacing: 1.5, padding: "20px 10px 10px", textTransform: "uppercase" }}>Quick Links</div>
          <a href="/" style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10, color: T.textSecondary, fontSize: 13, textDecoration: "none", transition: "all 0.15s" }}>
            {I.overview} <span>Dashboard</span>
          </a>
          <a href="/manage" style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10, color: T.textSecondary, fontSize: 13, textDecoration: "none", transition: "all 0.15s" }}>
            {I.leads} <span>Project Manager</span>
          </a>
        </nav>

        {/* User Info */}
        <div style={{ padding: "16px 16px", borderTop: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: `linear-gradient(135deg, ${T.gold}, ${T.goldDim})`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 12, color: T.bg }}>
            {(adminUser?.displayName || adminUser?.email || "A")[0].toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: T.white, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{adminUser?.displayName || adminUser?.email?.split("@")[0]}</div>
            <div style={{ fontSize: 10, color: T.gold, fontWeight: 600 }}>Admin</div>
          </div>
          <button type="button" onClick={() => signOut(auth)} title="Logout" style={{ background: "none", border: "none", color: T.textMuted, cursor: "pointer", padding: 4 }}>{I.logout}</button>
        </div>
      </aside>

      {/* ─── MAIN CONTENT ─── */}
      <main className="admin-main" role="main" style={{ flex: 1, height: "100vh", overflowY: "auto", overflowX: "hidden" }}>
        {/* Top header bar */}
        <header style={{ position: "sticky", top: 0, zIndex: 20, background: "rgba(4,9,15,0.9)", backdropFilter: "blur(20px)", borderBottom: `1px solid ${T.border}`, padding: "0 32px", height: 52, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button type="button" className="admin-mobile-btn" onClick={() => setSidebarOpen(!sidebarOpen)} style={{ display: "none", alignItems: "center", justifyContent: "center", width: 32, height: 32, borderRadius: 8, background: T.surfaceAlt, border: "1px solid " + T.border, color: T.textSecondary, cursor: "pointer", marginRight: 8 }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg></button>
            <span style={{ fontFamily: "'Fraunces',serif", fontSize: 14, fontWeight: 700, color: T.white }}>Admin Console</span>
            <span style={{ fontSize: 10, color: T.textMuted }}>·</span>
            <span style={{ fontSize: 11, color: T.textSecondary }}>{new Date().toLocaleDateString("en", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 8, background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.15)" }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: T.green, animation: "pulse 2s infinite" }} />
              <span style={{ fontSize: 11, fontWeight: 600, color: T.green }}>Live</span>
            </div>
            <div style={{ position: "relative", cursor: "pointer", color: T.textMuted }}>
              {I.bell}
              {stats.today > 0 && <div style={{ position: "absolute", top: -2, right: -2, width: 8, height: 8, borderRadius: "50%", background: T.red, border: `2px solid ${T.bg}` }} />}
            </div>
          </div>
        </header>

        <div style={{ padding: "28px 32px 60px" }}>

          {/* ═══════════════════════════════════════
             OVERVIEW TAB
             ═══════════════════════════════════════ */}
          {tab === "overview" && (
            <>
              <Section title="Platform Overview" sub="Real-time platform health & key metrics">
                <div className="kpi-grid-6" style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 12 }}>
                  <KPI label="Total Users" value={stats.total} sub={`+${stats.today} today`} icon="👥" delay={1} />
                  <KPI label="This Week" value={stats.thisWeek} sub={`${stats.thisMonth} this month`} icon="📊" delay={2} />
                  <KPI label="Pro Trial" value={stats.proTrial} sub="Active trials" icon="⭐" color={T.gold} delay={3} />
                  <KPI label="Free / Expired" value={stats.freeExpired} sub={`${stats.expired} expired`} icon="🔓" color={T.textMuted} delay={4} />
                  <KPI label="Paid Users" value={stats.paid} sub={`${stats.pro} Pro · ${stats.enterprise} Ent`} icon="💎" color={T.teal} delay={5} />
                  <KPI label="MRR" value={`AED ${mrr.toLocaleString()}`} sub={`ARR: AED ${arr.toLocaleString()}`} icon="💰" color={T.green} delay={6} />
                </div>
              </Section>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 16, marginBottom: 28 }}>
                <Chart title="Signup Timeline (14 Days)" sub={`${stats.thisWeek} this week`}>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={signupTimeline}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                      <XAxis dataKey="date" tick={{ fill: T.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: T.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="count" fill={T.gold} name="Signups" radius={[4, 4, 0, 0]} barSize={20} />
                    </BarChart>
                  </ResponsiveContainer>
                </Chart>
                <Chart title="Tier Distribution">
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={tierData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value" stroke="none">
                        {tierData.map((d, i) => <Cell key={i} fill={d.color} />)}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center", marginTop: 4 }}>
                    {tierData.map(d => (
                      <div key={d.name} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11 }}>
                        <div style={{ width: 8, height: 8, borderRadius: 2, background: d.color }} />
                        <span style={{ color: T.textSecondary }}>{d.name}: {d.value}</span>
                      </div>
                    ))}
                  </div>
                </Chart>
              </div>

              <Section title="Recent Signups" sub="Latest platform registrations" action={
                <button type="button" onClick={() => setTab("users")} style={{ fontSize: 11, padding: "6px 16px", borderRadius: 8, border: `1px solid ${T.gold}`, background: "transparent", color: T.gold, cursor: "pointer", fontFamily: "'Outfit',sans-serif", fontWeight: 600 }}>View All →</button>
              }>
                <div className="chart-box" style={{ padding: 0, overflow: "hidden" }}>
                  {users.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)).slice(0, 5).map((u, i) => {
                    const badge = tierBadge(u);
                    return (
                      <div key={u.uid} className="fade-up" style={{ display: "flex", alignItems: "center", padding: "14px 20px", borderBottom: i < 4 ? `1px solid ${T.border}` : "none", animationDelay: `${i * 0.05}s`, gap: 14 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: `linear-gradient(135deg, ${badge.color}30, ${badge.color}10)`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 13, color: badge.color, flexShrink: 0 }}>
                          {(u.name || u.email || "?")[0].toUpperCase()}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: T.white }}>{u.name || u.email?.split("@")[0] || "Unknown"}</div>
                          <div style={{ fontSize: 11, color: T.textMuted }}>{u.email}</div>
                        </div>
                        <span style={{ fontSize: 10, fontWeight: 600, padding: "3px 10px", borderRadius: 6, background: badge.bg, color: badge.color }}>{badge.label}</span>
                        <span style={{ fontSize: 11, color: T.textMuted, flexShrink: 0 }}>{timeSince(u.createdAt)}</span>
                      </div>
                    );
                  })}
                </div>
              </Section>
            </>
          )}

          {/* ═══════════════════════════════════════
             USERS TAB
             ═══════════════════════════════════════ */}
          {tab === "users" && (
            <Section title={`All Users (${users.length})`} sub="Manage tiers, view signups, monitor trials" action={
              <div style={{ display: "flex", gap: 8 }}>
                <button type="button" onClick={exportCSV} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, padding: "7px 14px", borderRadius: 8, border: `1px solid ${T.border}`, background: "transparent", color: T.textSecondary, cursor: "pointer", fontFamily: "'Outfit',sans-serif", fontWeight: 600 }}>{I.download} CSV</button>
                <button type="button" onClick={fetchUsers} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, padding: "7px 14px", borderRadius: 8, border: `1px solid ${T.gold}`, background: T.goldGlow, color: T.gold, cursor: "pointer", fontFamily: "'Outfit',sans-serif", fontWeight: 600 }}>{I.refresh} Refresh</button>
              </div>
            }>
              {/* Filters */}
              <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
                <div style={{ position: "relative", flex: "1 1 250px", maxWidth: 350 }}>
                  <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: T.textMuted }}>{I.search}</span>
                  <input value={userSearch} onChange={e => setUserSearch(e.target.value)} placeholder="Search name or email..."
                    style={{ width: "100%", padding: "10px 12px 10px 36px", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, color: T.textPrimary, fontSize: 13, fontFamily: "'Outfit',sans-serif", outline: "none" }} />
                </div>
                {["All", "Free", "Pro Trial", "Pro", "Enterprise", "Expired"].map(f => (
                  <button type="button" key={f} onClick={() => setTierFilter(f)} style={{
                    padding: "7px 14px", borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: "pointer", fontFamily: "'Outfit',sans-serif", transition: "all 0.2s",
                    border: `1px solid ${tierFilter === f ? T.gold : T.border}`,
                    background: tierFilter === f ? T.goldGlow : "transparent",
                    color: tierFilter === f ? T.gold : T.textSecondary,
                  }}>{f}</button>
                ))}
              </div>

              {/* Users Table */}
              <div className="chart-box" style={{ padding: 0, overflow: "hidden" }}>
                {/* Header */}
                <div style={{ display: "grid", gridTemplateColumns: "40px 1.5fr 1.5fr 100px 120px 120px 140px", gap: 8, padding: "12px 20px", borderBottom: `2px solid ${T.border}`, background: T.surfaceAlt }}>
                  {["#", "User", "Email", "Tier", "Trial", "Signed Up", "Actions"].map(h => (
                    <span key={h} style={{ fontSize: 9, fontWeight: 700, color: T.textMuted, letterSpacing: 1, textTransform: "uppercase" }}>{h}</span>
                  ))}
                </div>
                {/* Rows */}
                {filteredUsers.length === 0 ? (
                  <div style={{ textAlign: "center", padding: 40, color: T.textMuted, fontSize: 13 }}>No users found</div>
                ) : filteredUsers.map((u, i) => {
                  const badge = tierBadge(u);
                  const days = trialDaysLeft(u);
                  return (
                    <div key={u.uid} className="fade-up" style={{ display: "grid", gridTemplateColumns: "40px 1.5fr 1.5fr 100px 120px 120px 140px", gap: 8, padding: "12px 20px", borderBottom: `1px solid ${T.border}`, alignItems: "center", animationDelay: `${Math.min(i * 0.02, 0.5)}s`, transition: "background 0.15s" }}
                      onMouseEnter={e => e.currentTarget.style.background = T.surfaceAlt}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                      <span style={{ fontSize: 11, color: T.textMuted }}>{i + 1}</span>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 30, height: 30, borderRadius: 8, background: `linear-gradient(135deg, ${badge.color}30, ${badge.color}10)`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 11, color: badge.color, flexShrink: 0 }}>
                          {(u.name || u.email || "?")[0].toUpperCase()}
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 600, color: T.white, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.name || u.email?.split("@")[0]}</span>
                      </div>
                      <span style={{ fontSize: 12, color: T.textSecondary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.email}</span>
                      <span style={{ fontSize: 10, fontWeight: 600, padding: "3px 10px", borderRadius: 6, background: badge.bg, color: badge.color, textAlign: "center" }}>{badge.label}</span>
                      <div>
                        {days !== null ? (
                          <div>
                            <div style={{ width: "100%", height: 4, borderRadius: 2, background: T.surfaceAlt }}>
                              <div style={{ width: `${(days / 7) * 100}%`, height: "100%", borderRadius: 2, background: days > 3 ? T.green : days > 0 ? T.gold : T.red, transition: "width 0.3s" }} />
                            </div>
                            <span style={{ fontSize: 10, color: days > 0 ? T.green : T.red, fontWeight: 600, marginTop: 2, display: "block" }}>{days > 0 ? `${days}d left` : "Expired"}</span>
                          </div>
                        ) : <span style={{ fontSize: 11, color: T.textMuted }}>—</span>}
                      </div>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 500, color: T.white }}>{(() => { try { return new Date(u.createdAt).toLocaleDateString("en", { day: "numeric", month: "short", year: "numeric" }); } catch { return "—"; } })()}</div>
                        <div style={{ fontSize: 10, color: T.textMuted }}>{timeSince(u.createdAt)}</div>
                      </div>
                      <div style={{ display: "flex", gap: 4 }}>
                        <select value={u.tier || "free"} onChange={e => changeTier(u.uid, e.target.value)}
                          style={{ padding: "4px 6px", background: T.bg, border: `1px solid ${T.border}`, borderRadius: 6, color: T.textPrimary, fontSize: 10, fontFamily: "'Outfit',sans-serif", cursor: "pointer", flex: 1 }}>
                          <option value="free">Free</option>
                          <option value="pro_trial">Trial</option>
                          <option value="pro">Pro</option>
                          <option value="enterprise">Enterprise</option>
                        </select>
                        <button type="button" onClick={() => deleteUser(u.uid)} style={{ width: 28, height: 28, borderRadius: 6, border: `1px solid rgba(239,68,68,0.2)`, background: "rgba(239,68,68,0.06)", color: T.red, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>{I.trash}</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Section>
          )}

          {/* ═══════════════════════════════════════
             REVENUE TAB
             ═══════════════════════════════════════ */}
          {tab === "revenue" && (
            <>
              <Section title="Revenue Intelligence" sub="MRR, ARR, conversion metrics & projections">
                <div className="kpi-grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
                  <KPI label="Monthly Revenue" value={`AED ${mrr.toLocaleString()}`} sub={`${stats.pro} Pro · ${stats.enterprise} Enterprise`} icon="💰" color={T.green} delay={1} />
                  <KPI label="Annual Revenue" value={`AED ${arr.toLocaleString()}`} sub="Projected annualized" icon="📈" color={T.teal} delay={2} />
                  <KPI label="Projected MRR" value={`AED ${projectedMRR.toLocaleString()}`} sub={`30% trial conversion assumption`} icon="🎯" color={T.gold} delay={3} />
                  <KPI label="Trial Conversion" value={`${trialConversion}%`} sub={`${stats.pro} converted · ${stats.expired} expired`} icon="🔄" color={T.blue} delay={4} />
                </div>
              </Section>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 28 }}>
                <Chart title="Revenue Projection (6 Months)">
                  <ResponsiveContainer width="100%" height={240}>
                    <AreaChart data={revenueProjection}>
                      <defs>
                        <linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={T.green} stopOpacity={0.25} />
                          <stop offset="100%" stopColor={T.green} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                      <XAxis dataKey="month" tick={{ fill: T.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: T.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="revenue" stroke={T.green} fill="url(#gRev)" strokeWidth={2.5} name="MRR (AED)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </Chart>
                <Chart title="Conversion Funnel">
                  <div style={{ padding: "10px 0" }}>
                    {[
                      { label: "Total Signups", value: stats.total, pct: 100, color: T.textSecondary, width: 100 },
                      { label: "Started Trial", value: stats.proTrial + stats.pro + stats.expired, pct: stats.total > 0 ? Math.round(((stats.proTrial + stats.pro + stats.expired) / stats.total) * 100) : 0, color: T.gold, width: stats.total > 0 ? ((stats.proTrial + stats.pro + stats.expired) / stats.total) * 100 : 0 },
                      { label: "Converted to Paid", value: stats.paid, pct: stats.total > 0 ? Math.round((stats.paid / stats.total) * 100) : 0, color: T.green, width: stats.total > 0 ? (stats.paid / stats.total) * 100 : 0 },
                    ].map((step, i) => (
                      <div key={i} className="fade-up" style={{ marginBottom: 20, animationDelay: `${i * 0.1}s` }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                          <span style={{ fontSize: 12, fontWeight: 600, color: T.white }}>{step.label}</span>
                          <span style={{ fontSize: 12, fontWeight: 700, color: step.color }}>{step.value} ({step.pct}%)</span>
                        </div>
                        <div style={{ height: 8, borderRadius: 4, background: T.surfaceAlt }}>
                          <div style={{ width: `${Math.max(step.width, 2)}%`, height: "100%", borderRadius: 4, background: step.color, transition: "width 0.6s ease" }} />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={{ padding: "12px 0", borderTop: `1px solid ${T.border}`, marginTop: 8 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      <div>
                        <div style={{ fontSize: 9, fontWeight: 700, color: T.textMuted, letterSpacing: 1, textTransform: "uppercase" }}>ARPU</div>
                        <div style={{ fontSize: 18, fontWeight: 800, color: T.gold, fontFamily: "'Fraunces',serif" }}>AED {stats.total > 0 ? Math.round(mrr / stats.total) : 0}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 9, fontWeight: 700, color: T.textMuted, letterSpacing: 1, textTransform: "uppercase" }}>Lead Value</div>
                        <div style={{ fontSize: 18, fontWeight: 800, color: T.teal, fontFamily: "'Fraunces',serif" }}>AED 125</div>
                        <div style={{ fontSize: 10, color: T.textMuted }}>Per inquiry avg</div>
                      </div>
                    </div>
                  </div>
                </Chart>
              </div>

              <Section title="Revenue Breakdown" sub="Revenue by tier and source">
                <div className="chart-grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                  <div className="chart-box fade-up" style={{ padding: 20 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>Pro Plan Revenue</div>
                    <div style={{ fontFamily: "'Fraunces',serif", fontSize: 24, fontWeight: 900, color: T.green }}>AED {(stats.pro * 99).toLocaleString()}</div>
                    <div style={{ fontSize: 11, color: T.textSecondary, marginTop: 4 }}>{stats.pro} users × AED 99/mo</div>
                  </div>
                  <div className="chart-box fade-up" style={{ padding: 20, animationDelay: "0.05s" }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>Enterprise Revenue</div>
                    <div style={{ fontFamily: "'Fraunces',serif", fontSize: 24, fontWeight: 900, color: T.teal }}>AED {(stats.enterprise * 499).toLocaleString()}</div>
                    <div style={{ fontSize: 11, color: T.textSecondary, marginTop: 4 }}>{stats.enterprise} users × AED 499/mo</div>
                  </div>
                  <div className="chart-box fade-up" style={{ padding: 20, animationDelay: "0.1s" }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>Potential Pipeline</div>
                    <div style={{ fontFamily: "'Fraunces',serif", fontSize: 24, fontWeight: 900, color: T.gold }}>AED {(stats.proTrial * 99).toLocaleString()}</div>
                    <div style={{ fontSize: 11, color: T.textSecondary, marginTop: 4 }}>{stats.proTrial} trials × AED 99 if converted</div>
                  </div>
                </div>
              </Section>
            </>
          )}

          {/* ═══════════════════════════════════════
             LEADS TAB
             ═══════════════════════════════════════ */}
          {tab === "leads" && (
            <>
              <Section title="Lead Tracking" sub="WhatsApp, Email & Call inquiries from Pro users">
                <div className="kpi-grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
                  <KPI label="Total Leads" value="0" sub="Tracking enabled" icon="📞" delay={1} />
                  <KPI label="WhatsApp" value="0" sub="Most popular channel" icon="💬" color={T.green} delay={2} />
                  <KPI label="Email" value="0" sub="Professional inquiries" icon="📧" color={T.blue} delay={3} />
                  <KPI label="Est. Value" value="AED 0" sub="AED 125 per lead avg" icon="💎" color={T.gold} delay={4} />
                </div>
              </Section>

              <div className="chart-box fade-up" style={{ padding: 40, textAlign: "center" }}>
                <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.4 }}>📊</div>
                <h3 style={{ fontFamily: "'Fraunces',serif", fontSize: 20, fontWeight: 700, color: T.white, marginBottom: 8 }}>Lead Tracking Coming Soon</h3>
                <p style={{ color: T.textSecondary, fontSize: 13, maxWidth: 480, margin: "0 auto", lineHeight: 1.6 }}>
                  When Pro users click WhatsApp, Email, or Call buttons on project pages, each inquiry will be logged here automatically. You'll see which projects generate the most interest and track your lead pipeline.
                </p>
              </div>
            </>
          )}

          {/* ═══════════════════════════════════════
             ANALYTICS TAB
             ═══════════════════════════════════════ */}
          {tab === "analytics" && (
            <>
              <Section title="Growth Analytics" sub="Platform growth metrics & milestone tracking">
                <div className="kpi-grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
                  <KPI label="Growth Rate" value={`${stats.total > 0 && stats.thisWeek > 0 ? Math.round((stats.thisWeek / stats.total) * 100) : 0}%`} sub="Week over week" icon="📈" color={T.green} delay={1} />
                  <KPI label="ARPU" value={`AED ${stats.total > 0 ? Math.round(mrr / stats.total) : 0}`} sub="Average per user" icon="💵" delay={2} />
                  <KPI label="Trial Rate" value={`${trialConversion}%`} sub="Trial → Paid conversion" icon="🔄" color={T.blue} delay={3} />
                  <KPI label="Platform Health" value={stats.paid > 0 ? "Strong" : stats.proTrial > 0 ? "Growing" : "Early"} sub={stats.total > 10 ? "Scaling phase" : "Launch phase"} icon="💪" color={T.teal} delay={4} />
                </div>
              </Section>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 28 }}>
                <Chart title="Cumulative User Growth">
                  <ResponsiveContainer width="100%" height={240}>
                    <AreaChart data={cumulativeData}>
                      <defs>
                        <linearGradient id="gGrow" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={T.teal} stopOpacity={0.25} />
                          <stop offset="100%" stopColor={T.teal} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                      <XAxis dataKey="date" tick={{ fill: T.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: T.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="total" stroke={T.teal} fill="url(#gGrow)" strokeWidth={2.5} name="Total Users" dot={{ fill: T.teal, r: 3 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </Chart>
                <Chart title="Signup Source Distribution">
                  <div style={{ padding: "20px 0" }}>
                    {[
                      { label: "Direct (Landing Page)", pct: 65, color: T.gold },
                      { label: "Organic Search", pct: 20, color: T.teal },
                      { label: "Referral", pct: 10, color: T.blue },
                      { label: "Social Media", pct: 5, color: T.purple },
                    ].map((s, i) => (
                      <div key={i} className="fade-up" style={{ marginBottom: 16, animationDelay: `${i * 0.08}s` }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                          <span style={{ fontSize: 12, color: T.textSecondary }}>{s.label}</span>
                          <span style={{ fontSize: 12, fontWeight: 700, color: s.color }}>{s.pct}%</span>
                        </div>
                        <div style={{ height: 6, borderRadius: 3, background: T.surfaceAlt }}>
                          <div style={{ width: `${s.pct}%`, height: "100%", borderRadius: 3, background: s.color, transition: "width 0.6s ease" }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </Chart>
              </div>

              {/* Milestones */}
              <Section title="Growth Milestones" sub="Track your progress towards key goals">
                <div className="kpi-grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
                  {[
                    { label: "Platform Launch", target: 1, current: 1, icon: "🚀", date: "Mar 2026" },
                    { label: "First 10 Users", target: 10, current: stats.total, icon: "👥" },
                    { label: "First 50 Users", target: 50, current: stats.total, icon: "🎯" },
                    { label: "First Paid User", target: 1, current: stats.paid, icon: "💰" },
                    { label: "100 Users", target: 100, current: stats.total, icon: "📊" },
                    { label: "AED 10K MRR", target: 10000, current: mrr, icon: "🏆" },
                    { label: "500 Users", target: 500, current: stats.total, icon: "🌟" },
                    { label: "AED 50K MRR", target: 50000, current: mrr, icon: "👑" },
                  ].map((m, i) => {
                    const done = m.current >= m.target;
                    const pct = Math.min(Math.round((m.current / m.target) * 100), 100);
                    return (
                      <div key={i} className="chart-box fade-up" style={{ padding: 16, animationDelay: `${i * 0.04}s`, opacity: done ? 1 : 0.8 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                          <span style={{ fontSize: 20 }}>{m.icon}</span>
                          {done ? (
                            <span style={{ fontSize: 9, fontWeight: 700, padding: "3px 8px", borderRadius: 6, background: "rgba(16,185,129,0.12)", color: T.green }}>✓ Done</span>
                          ) : (
                            <span style={{ fontSize: 9, fontWeight: 700, color: T.textMuted }}>{pct}%</span>
                          )}
                        </div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: done ? T.white : T.textSecondary, marginBottom: 6 }}>{m.label}</div>
                        <div style={{ height: 4, borderRadius: 2, background: T.surfaceAlt }}>
                          <div style={{ width: `${pct}%`, height: "100%", borderRadius: 2, background: done ? T.green : T.gold, transition: "width 0.5s" }} />
                        </div>
                        {!done && m.target > 1 && <div style={{ fontSize: 10, color: T.textMuted, marginTop: 6 }}>{m.target - m.current} to go</div>}
                        {m.date && <div style={{ fontSize: 10, color: T.green, marginTop: 4 }}>{m.date}</div>}
                      </div>
                    );
                  })}
                </div>
              </Section>
            </>
          )}

        </div>
      </main>
    </div>
  );
}
