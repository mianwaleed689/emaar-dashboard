/* ─── DXB ANALYTICS ADMIN PANEL — FULL VERSION ─── */
import React, { useState, useEffect, useCallback } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, LineChart, Line, ComposedChart, Legend } from "recharts";
import { auth, db } from "./firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { collection, getDocs, doc, getDoc, setDoc, deleteDoc, addDoc, query, orderBy, limit } from "firebase/firestore";

const T = {
  bg: "#04090F", surface: "#0A1628", surfaceAlt: "#0E1D35", card: "#0D1B30",
  gold: "#D4A843", goldLight: "#E8C96A", goldGlow: "rgba(212,168,67,0.15)",
  teal: "#00BFA5", white: "#FFFFFF",
  textPrimary: "#E2E8F0", textSecondary: "#94A3B8", textMuted: "#64748B",
  border: "rgba(212,168,67,0.12)",
  red: "#EF4444", green: "#10B981", blue: "#3B82F6", purple: "#8B5CF6", orange: "#F59E0B",
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700;9..144,900&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: ${T.bg}; }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }
  .a-card { background: ${T.surface}; border: 1px solid ${T.border}; border-radius: 14px; padding: 20px; animation: fadeUp 0.5s ease-out both; transition: border-color 0.2s; }
  .a-card:hover { border-color: rgba(212,168,67,0.25); }
  .a-kpi { background: ${T.surface}; border: 1px solid ${T.border}; border-radius: 14px; padding: 20px; text-align: center; animation: fadeUp 0.5s ease-out both; }
  .a-table tr:hover { background: ${T.surfaceAlt}; }
  .a-badge { padding: 4px 10px; border-radius: 6px; font-size: 10px; font-weight: 700; display: inline-block; }
  .a-select { padding: 6px 10px; background: ${T.surfaceAlt}; border: 1px solid ${T.border}; border-radius: 8px; color: ${T.textPrimary}; font-size: 12px; font-family: 'Outfit', sans-serif; cursor: pointer; outline: none; }
  .a-select:focus { border-color: ${T.gold}; }
  .a-btn { padding: 8px 20px; border-radius: 8px; border: none; font-family: 'Outfit', sans-serif; font-weight: 600; cursor: pointer; transition: all 0.2s; font-size: 12px; }
  .a-btn:hover { transform: translateY(-1px); }
  .a-btn-gold { background: linear-gradient(135deg, ${T.gold}, ${T.goldLight}); color: ${T.bg}; }
  .a-btn-outline { background: transparent; color: ${T.gold}; border: 1px solid ${T.gold}; }
  .a-btn-danger { background: rgba(239,68,68,0.15); color: ${T.red}; border: 1px solid rgba(239,68,68,0.2); }
  .a-btn-danger:hover { background: rgba(239,68,68,0.25); }
  .a-btn-teal { background: rgba(0,191,165,0.15); color: ${T.teal}; border: 1px solid rgba(0,191,165,0.2); }
  .a-input { width: 100%; padding: 10px 14px 10px 38px; background: ${T.surface}; border: 1px solid ${T.border}; border-radius: 10px; color: ${T.textPrimary}; font-size: 13px; font-family: 'Outfit', sans-serif; outline: none; }
  .a-input:focus { border-color: ${T.gold}; }
  .a-tab { padding: 10px 20px; border-radius: 8px; border: none; font-family: 'Outfit', sans-serif; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s; color: ${T.textMuted}; background: transparent; }
  .a-tab:hover { color: ${T.textSecondary}; background: ${T.surfaceAlt}; }
  .a-tab.active { color: ${T.bg}; background: ${T.gold}; }
  .a-status-dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; margin-right: 6px; }
  @media (max-width: 768px) {
    .a-kpi-grid { grid-template-columns: 1fr 1fr !important; }
    .a-charts-grid { grid-template-columns: 1fr !important; }
    .a-container { padding: 16px !important; }
    .a-tab-bar { overflow-x: auto !important; }
  }
`;

const SearchIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={T.textMuted} strokeWidth="2" strokeLinecap="round" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: "10px 14px", boxShadow: "0 8px 32px rgba(0,0,0,0.3)" }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: T.gold, marginBottom: 4 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ fontSize: 12, color: p.color || T.textPrimary, display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ width: 8, height: 8, borderRadius: 2, background: p.color, display: "inline-block" }} />
          {p.name}: {typeof p.value === "number" ? p.value.toLocaleString() : p.value}
        </div>
      ))}
    </div>
  );
};

export default function AdminPanel() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("overview");
  const [users, setUsers] = useState([]);
  const [leads, setLeads] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filterTier, setFilterTier] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [time, setTime] = useState(new Date());
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [bulkAction, setBulkAction] = useState("");

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

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  // Fetch users
  const fetchUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const snap = await getDocs(collection(db, "users"));
      const list = [];
      snap.forEach(d => {
        const data = d.data();
        let status = data.tier || "free";
        let daysLeft = 0;
        if (status === "pro_trial" && data.trialEnd) {
          const end = new Date(data.trialEnd);
          daysLeft = Math.ceil((end - new Date()) / (1000 * 60 * 60 * 24));
          if (daysLeft <= 0) { status = "expired"; daysLeft = 0; }
        }
        list.push({ id: d.id, ...data, status, daysLeft });
      });
      list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      setUsers(list);
    } catch (err) { console.log("Error:", err); }
    setUsersLoading(false);
  }, []);

  // Fetch leads
  const fetchLeads = useCallback(async () => {
    try {
      const snap = await getDocs(collection(db, "leads"));
      const list = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() }));
      list.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
      setLeads(list);
    } catch (err) { console.log("Leads:", err); }
  }, []);

  useEffect(() => {
    if (isAdmin) { fetchUsers(); fetchLeads(); }
  }, [isAdmin, fetchUsers, fetchLeads]);

  // Actions
  const handleChangeTier = async (userId, newTier) => {
    try {
      const updates = { tier: newTier };
      if (newTier === "pro_trial") {
        const now = new Date();
        updates.trialStart = now.toISOString();
        updates.trialEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
      }
      await setDoc(doc(db, "users", userId), updates, { merge: true });
      fetchUsers();
    } catch (err) { console.log("Error:", err); }
  };

  const handleDeleteUser = async (userId, email) => {
    if (!window.confirm(`Delete ${email}? This removes their Firestore profile.`)) return;
    try {
      await deleteDoc(doc(db, "users", userId));
      setUsers(prev => prev.filter(u => u.id !== userId));
      setSelectedUsers(prev => prev.filter(id => id !== userId));
    } catch (err) { console.log("Error:", err); }
  };

  const handleBulkAction = async () => {
    if (!bulkAction || selectedUsers.length === 0) return;
    if (bulkAction === "delete") {
      if (!window.confirm(`Delete ${selectedUsers.length} users?`)) return;
      for (const id of selectedUsers) {
        try { await deleteDoc(doc(db, "users", id)); } catch {}
      }
    } else {
      for (const id of selectedUsers) {
        try { await setDoc(doc(db, "users", id), { tier: bulkAction }, { merge: true }); } catch {}
      }
    }
    setSelectedUsers([]);
    setBulkAction("");
    fetchUsers();
  };

  const toggleSelectUser = (id) => {
    setSelectedUsers(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (selectedUsers.length === filtered.length) setSelectedUsers([]);
    else setSelectedUsers(filtered.map(u => u.id));
  };

  // CSV Export
  const exportCSV = () => {
    const headers = ["Name", "Email", "Tier", "Status", "Trial Days Left", "Signed Up"];
    const rows = users.map(u => [
      u.name || "", u.email || "", u.tier || "", u.status || "", u.daysLeft || 0,
      u.createdAt ? new Date(u.createdAt).toLocaleDateString() : ""
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `dxb-analytics-users-${new Date().toISOString().split("T")[0]}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  // Filter & Sort
  const filtered = users.filter(u => {
    const matchSearch = !search || (u.name || "").toLowerCase().includes(search.toLowerCase()) || (u.email || "").toLowerCase().includes(search.toLowerCase());
    const matchTier = filterTier === "all" || u.tier === filterTier || (filterTier === "expired" && u.status === "expired");
    return matchSearch && matchTier;
  }).sort((a, b) => {
    if (sortBy === "newest") return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    if (sortBy === "oldest") return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
    if (sortBy === "name") return (a.name || "").localeCompare(b.name || "");
    if (sortBy === "tier") return (a.tier || "").localeCompare(b.tier || "");
    return 0;
  });

  // ─── STATS ───
  const now = new Date();
  const stats = {
    total: users.length,
    proTrial: users.filter(u => u.status === "pro_trial").length,
    free: users.filter(u => u.tier === "free" || u.status === "expired").length,
    pro: users.filter(u => u.tier === "pro").length,
    enterprise: users.filter(u => u.tier === "enterprise").length,
    expired: users.filter(u => u.status === "expired").length,
    today: users.filter(u => u.createdAt && new Date(u.createdAt).toDateString() === now.toDateString()).length,
    thisWeek: users.filter(u => u.createdAt && (now - new Date(u.createdAt)) < 7 * 24 * 60 * 60 * 1000).length,
    thisMonth: users.filter(u => u.createdAt && new Date(u.createdAt).getMonth() === now.getMonth() && new Date(u.createdAt).getFullYear() === now.getFullYear()).length,
  };

  // Revenue
  const mrr = (stats.pro * 99) + (stats.enterprise * 499);
  const arr = mrr * 12;
  const projectedMRR = Math.round(mrr + (stats.proTrial * 99 * 0.3)); // 30% conversion assumption
  const trialConversionRate = stats.expired > 0 ? Math.round((stats.pro / (stats.pro + stats.expired)) * 100) : 0;
  const avgRevenuePerUser = stats.total > 0 ? Math.round(mrr / stats.total) : 0;
  const leadValue = leads.length * 125; // AED 125 avg per lead

  // Chart data
  const signupsByDay = (() => {
    const days = {};
    const last14 = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    users.forEach(u => {
      if (u.createdAt && new Date(u.createdAt) >= last14) {
        const d = new Date(u.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
        days[d] = (days[d] || 0) + 1;
      }
    });
    return Object.entries(days).map(([date, count]) => ({ date, signups: count }));
  })();

  const tierData = [
    { name: "Free", value: stats.free, color: T.textMuted },
    { name: "Pro Trial", value: stats.proTrial, color: T.gold },
    { name: "Pro", value: stats.pro, color: T.green },
    { name: "Enterprise", value: stats.enterprise, color: T.blue },
  ].filter(d => d.value > 0);

  const revenueProjection = [
    { month: "Now", actual: mrr, projected: mrr },
    { month: "+1mo", actual: 0, projected: Math.round(mrr + (stats.thisMonth * 99 * 0.3)) },
    { month: "+2mo", actual: 0, projected: Math.round(mrr * 1.4 + (stats.thisMonth * 2 * 99 * 0.3)) },
    { month: "+3mo", actual: 0, projected: Math.round(mrr * 1.8 + (stats.thisMonth * 3 * 99 * 0.25)) },
    { month: "+6mo", actual: 0, projected: Math.round(mrr * 3 + (stats.thisMonth * 6 * 99 * 0.2)) },
  ];

  // Loading / Access
  if (loading) return (
    <div style={{ minHeight: "100vh", background: T.bg, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
      <style>{css}</style>
      <svg width="40" height="40" viewBox="0 0 40 40"><rect x="2" y="2" width="36" height="36" rx="8" fill="none" stroke={T.gold} strokeWidth="2" /><path d="M12 28V12h10l-6 8h8l-12 8z" fill={T.gold} /></svg>
      <div style={{ color: T.gold, fontFamily: "'Fraunces', serif", fontSize: 18, fontWeight: 700 }}>DXB Analytics</div>
      <div style={{ width: 24, height: 24, border: `2px solid ${T.border}`, borderTopColor: T.gold, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
    </div>
  );

  if (!isAdmin) return (
    <div style={{ minHeight: "100vh", background: T.bg, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16, fontFamily: "'Outfit', sans-serif" }}>
      <style>{css}</style>
      <div style={{ fontSize: 48 }}>🔒</div>
      <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 24, color: T.white }}>Admin Access Only</h1>
      <p style={{ color: T.textSecondary, fontSize: 14 }}>You don't have permission to view this page.</p>
      <a href="/" style={{ color: T.gold, fontSize: 13, textDecoration: "none" }}>← Back to Dashboard</a>
    </div>
  );

  const TABS = [
    { key: "overview", label: "Overview", icon: "📊" },
    { key: "users", label: "Users", icon: "👥" },
    { key: "revenue", label: "Revenue", icon: "💰" },
    { key: "leads", label: "Leads", icon: "📞" },
    { key: "analytics", label: "Analytics", icon: "📈" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: T.bg, fontFamily: "'Outfit', sans-serif", color: T.textPrimary }}>
      <style>{css}</style>

      {/* ─── TOP BAR ─── */}
      <header style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(4,9,15,0.95)", backdropFilter: "blur(20px)", borderBottom: `1px solid ${T.border}`, padding: "0 32px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 56 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <a href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
              <svg width="28" height="28" viewBox="0 0 40 40"><rect x="2" y="2" width="36" height="36" rx="8" fill="none" stroke={T.gold} strokeWidth="2" /><path d="M12 28V12h10l-6 8h8l-12 8z" fill={T.gold} /></svg>
              <span style={{ fontFamily: "'Fraunces', serif", fontSize: 16, fontWeight: 800, color: T.gold }}>DXB Analytics</span>
            </a>
            <span style={{ fontSize: 10, padding: "3px 10px", borderRadius: 6, background: "rgba(239,68,68,0.15)", color: T.red, fontWeight: 700, letterSpacing: 0.5 }}>ADMIN</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 12px", borderRadius: 8, background: T.surfaceAlt }}>
              <span className="a-status-dot" style={{ background: T.green, animation: "pulse 2s infinite" }} />
              <span style={{ fontSize: 11, color: T.textSecondary }}>Live</span>
            </div>
            <span style={{ fontSize: 11, color: T.textMuted }}>{time.toLocaleString("en-AE", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
            <a href="/" className="a-btn a-btn-outline" style={{ padding: "5px 14px", fontSize: 11 }}>← Dashboard</a>
            <button onClick={() => signOut(auth)} className="a-btn" style={{ padding: "5px 14px", fontSize: 11, background: T.surfaceAlt, color: T.textMuted, border: `1px solid ${T.border}` }}>Logout</button>
          </div>
        </div>
        {/* Tabs */}
        <div className="a-tab-bar" style={{ display: "flex", gap: 4, paddingBottom: 12 }}>
          {TABS.map(t => (
            <button key={t.key} className={`a-tab ${tab === t.key ? "active" : ""}`} onClick={() => setTab(t.key)}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </header>

      {/* ─── CONTENT ─── */}
      <div className="a-container" style={{ maxWidth: 1280, margin: "0 auto", padding: "24px 32px" }}>

        {/* ═══ OVERVIEW TAB ═══ */}
        {tab === "overview" && <>
          <div style={{ marginBottom: 24 }}>
            <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 26, fontWeight: 900, color: T.white }}>Dashboard Overview</h1>
            <p style={{ color: T.textSecondary, fontSize: 13, marginTop: 4 }}>Real-time platform health & key metrics</p>
          </div>

          {/* KPIs */}
          <div className="a-kpi-grid" style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 12, marginBottom: 24 }}>
            {[
              { label: "Total Users", value: stats.total, color: T.white, icon: "👥", sub: `+${stats.today} today` },
              { label: "This Week", value: stats.thisWeek, color: T.teal, icon: "📊", sub: `${stats.thisMonth} this month` },
              { label: "Pro Trial", value: stats.proTrial, color: T.gold, icon: "⭐", sub: "Active trials" },
              { label: "Free / Expired", value: stats.free, color: T.textMuted, icon: "🔓", sub: `${stats.expired} expired` },
              { label: "Paid Users", value: stats.pro + stats.enterprise, color: T.green, icon: "💎", sub: `${stats.pro} Pro · ${stats.enterprise} Ent` },
              { label: "MRR", value: `AED ${mrr.toLocaleString()}`, color: T.gold, icon: "💰", sub: `ARR: AED ${arr.toLocaleString()}` },
            ].map((k, i) => (
              <div key={i} className="a-kpi" style={{ animationDelay: `${i * 0.05}s` }}>
                <div style={{ fontSize: 20, marginBottom: 4 }}>{k.icon}</div>
                <div style={{ fontFamily: "'Fraunces', serif", fontSize: 24, fontWeight: 900, color: k.color }}>{k.value}</div>
                <div style={{ fontSize: 10, color: T.textMuted, marginTop: 2, letterSpacing: 0.5, textTransform: "uppercase" }}>{k.label}</div>
                <div style={{ fontSize: 10, color: T.textSecondary, marginTop: 4 }}>{k.sub}</div>
              </div>
            ))}
          </div>

          {/* Charts */}
          <div className="a-charts-grid" style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16, marginBottom: 24 }}>
            <div className="a-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: T.white }}>📈 Signup Timeline (14 days)</h3>
                <span style={{ fontSize: 11, color: T.textMuted }}>{stats.thisWeek} this week</span>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={signupsByDay}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="date" tick={{ fill: T.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: T.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="signups" fill={T.gold} name="Signups" radius={[6, 6, 0, 0]} barSize={28} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="a-card">
              <h3 style={{ fontSize: 14, fontWeight: 700, color: T.white, marginBottom: 16 }}>🎯 Tier Distribution</h3>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={tierData} cx="50%" cy="50%" outerRadius={70} innerRadius={40} dataKey="value" paddingAngle={3}>
                    {tierData.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", marginTop: 8 }}>
                {tierData.map((d, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: T.textSecondary }}>
                    <span style={{ width: 8, height: 8, borderRadius: 2, background: d.color, display: "inline-block" }} />
                    {d.name}: {d.value}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent signups */}
          <div className="a-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: T.white }}>🕐 Recent Signups</h3>
              <button onClick={() => setTab("users")} className="a-btn a-btn-outline" style={{ padding: "4px 12px", fontSize: 11 }}>View All →</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {users.slice(0, 5).map((u, i) => {
                const timeSince = u.createdAt ? (() => { const d = Math.floor((now - new Date(u.createdAt)) / 60000); if (d < 1) return "Just now"; if (d < 60) return `${d}m ago`; if (d < 1440) return `${Math.floor(d/60)}h ago`; return `${Math.floor(d/1440)}d ago`; })() : "";
                return (
                  <div key={u.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 10, background: T.surfaceAlt }}>
                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: `linear-gradient(135deg, ${T.gold}, #B8912F)`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 12, color: T.bg, flexShrink: 0 }}>
                      {(u.name || u.email || "?").charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: T.white }}>{u.name || "—"}</span>
                      <span style={{ fontSize: 11, color: T.textMuted, marginLeft: 8 }}>{u.email}</span>
                    </div>
                    <span className="a-badge" style={{ background: `${u.status === "pro_trial" ? T.gold : u.tier === "pro" ? T.green : T.textMuted}15`, color: u.status === "pro_trial" ? T.gold : u.tier === "pro" ? T.green : T.textMuted }}>{u.status === "pro_trial" ? "Pro Trial" : u.tier === "pro" ? "Pro" : "Free"}</span>
                    <span style={{ fontSize: 11, color: T.textMuted, minWidth: 60, textAlign: "right" }}>{timeSince}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </>}

        {/* ═══ USERS TAB ═══ */}
        {tab === "users" && <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
            <div>
              <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 26, fontWeight: 900, color: T.white }}>User Management</h1>
              <p style={{ color: T.textSecondary, fontSize: 13, marginTop: 4 }}>{users.length} total users · {stats.proTrial} on trial · {stats.pro + stats.enterprise} paid</p>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={exportCSV} className="a-btn a-btn-teal" style={{ padding: "6px 16px" }}>📥 Export CSV</button>
              <button onClick={fetchUsers} className="a-btn a-btn-outline" style={{ padding: "6px 16px" }}>↻ Refresh</button>
            </div>
          </div>

          {/* Filters */}
          <div className="a-card" style={{ padding: "12px 16px", marginBottom: 16 }}>
            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ position: "relative", flex: "1 1 200px", maxWidth: 280 }}>
                <SearchIcon />
                <input className="a-input" placeholder="Search name or email..." value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <select className="a-select" value={filterTier} onChange={e => setFilterTier(e.target.value)}>
                <option value="all">All Tiers ({users.length})</option>
                <option value="free">Free ({stats.free})</option>
                <option value="pro_trial">Pro Trial ({stats.proTrial})</option>
                <option value="pro">Pro ({stats.pro})</option>
                <option value="enterprise">Enterprise ({stats.enterprise})</option>
                <option value="expired">Expired ({stats.expired})</option>
              </select>
              <select className="a-select" value={sortBy} onChange={e => setSortBy(e.target.value)}>
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="name">By Name</option>
                <option value="tier">By Tier</option>
              </select>
              {selectedUsers.length > 0 && (
                <div style={{ display: "flex", gap: 6, alignItems: "center", padding: "4px 10px", borderRadius: 8, background: "rgba(212,168,67,0.08)", border: `1px solid ${T.border}` }}>
                  <span style={{ fontSize: 11, color: T.gold, fontWeight: 600 }}>{selectedUsers.length} selected</span>
                  <select className="a-select" value={bulkAction} onChange={e => setBulkAction(e.target.value)} style={{ fontSize: 11, padding: "3px 6px" }}>
                    <option value="">Bulk Action...</option>
                    <option value="free">Set Free</option>
                    <option value="pro">Set Pro</option>
                    <option value="pro_trial">Set Pro Trial</option>
                    <option value="delete">Delete</option>
                  </select>
                  <button onClick={handleBulkAction} className="a-btn a-btn-gold" style={{ padding: "3px 10px", fontSize: 10 }}>Apply</button>
                </div>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="a-card" style={{ padding: 0, overflow: "hidden" }}>
            {usersLoading ? (
              <div style={{ textAlign: "center", padding: 60 }}>
                <div style={{ width: 24, height: 24, border: `2px solid ${T.border}`, borderTopColor: T.gold, borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto" }} />
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table className="a-table" style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: `2px solid ${T.border}` }}>
                      <th style={{ padding: "12px 16px", textAlign: "left", width: 40 }}>
                        <input type="checkbox" checked={selectedUsers.length === filtered.length && filtered.length > 0} onChange={toggleSelectAll} style={{ accentColor: T.gold }} />
                      </th>
                      {["#", "User", "Email", "Tier", "Trial", "Signed Up", "Actions"].map(h => (
                        <th key={h} style={{ padding: "12px 14px", textAlign: "left", color: T.textMuted, fontWeight: 600, fontSize: 10, letterSpacing: 1, textTransform: "uppercase" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((u, i) => {
                      const tierColor = u.tier === "pro" || u.tier === "enterprise" ? T.green : u.status === "pro_trial" ? T.gold : u.status === "expired" ? T.red : T.textMuted;
                      const tierLabel = u.tier === "pro" ? "Pro" : u.tier === "enterprise" ? "Enterprise" : u.status === "pro_trial" ? "Pro Trial" : u.status === "expired" ? "Expired" : "Free";
                      const signedUp = u.createdAt ? new Date(u.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—";
                      const timeSince = u.createdAt ? (() => { const d = Math.floor((now - new Date(u.createdAt)) / 60000); if (d < 1) return "Just now"; if (d < 60) return `${d}m ago`; if (d < 1440) return `${Math.floor(d/60)}h ago`; return `${Math.floor(d/1440)}d ago`; })() : "";
                      return (
                        <tr key={u.id} style={{ borderBottom: `1px solid ${T.border}`, background: selectedUsers.includes(u.id) ? T.surfaceAlt : "transparent" }}>
                          <td style={{ padding: "12px 16px" }}><input type="checkbox" checked={selectedUsers.includes(u.id)} onChange={() => toggleSelectUser(u.id)} style={{ accentColor: T.gold }} /></td>
                          <td style={{ padding: "12px 14px", color: T.textMuted, fontSize: 12 }}>{i + 1}</td>
                          <td style={{ padding: "12px 14px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <div style={{ width: 30, height: 30, borderRadius: "50%", background: `linear-gradient(135deg, ${T.gold}, #B8912F)`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 11, color: T.bg, flexShrink: 0 }}>
                                {(u.name || u.email || "?").charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div style={{ fontSize: 13, fontWeight: 600, color: T.white }}>{u.name || "—"}</div>
                                {u.role === "admin" && <span style={{ fontSize: 9, color: T.red, fontWeight: 700 }}>ADMIN</span>}
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: "12px 14px", fontSize: 12, color: T.textSecondary }}>{u.email || "—"}</td>
                          <td style={{ padding: "12px 14px" }}>
                            <span className="a-badge" style={{ background: `${tierColor}15`, color: tierColor, border: `1px solid ${tierColor}30` }}>{tierLabel}</span>
                          </td>
                          <td style={{ padding: "12px 14px", fontSize: 12 }}>
                            {u.status === "pro_trial" ? (
                              <div>
                                <span style={{ color: T.gold, fontWeight: 600 }}>{u.daysLeft}d left</span>
                                <div style={{ width: 50, height: 3, borderRadius: 2, background: T.surfaceAlt, marginTop: 3 }}>
                                  <div style={{ width: `${Math.max((u.daysLeft / 7) * 100, 5)}%`, height: "100%", borderRadius: 2, background: u.daysLeft <= 2 ? T.red : T.gold }} />
                                </div>
                              </div>
                            ) : u.status === "expired" ? <span style={{ color: T.red }}>Expired</span>
                              : u.tier === "pro" || u.tier === "enterprise" ? <span style={{ color: T.green }}>Active ✓</span>
                              : <span style={{ color: T.textMuted }}>—</span>}
                          </td>
                          <td style={{ padding: "12px 14px" }}>
                            <div style={{ fontSize: 12, color: T.white }}>{signedUp}</div>
                            <div style={{ fontSize: 10, color: T.textMuted }}>{timeSince}</div>
                          </td>
                          <td style={{ padding: "12px 14px" }}>
                            <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                              <select className="a-select" value={u.tier} onChange={e => handleChangeTier(u.id, e.target.value)} style={{ fontSize: 10, padding: "3px 6px" }}>
                                <option value="free">Free</option>
                                <option value="pro_trial">Trial</option>
                                <option value="pro">Pro</option>
                                <option value="enterprise">Enterprise</option>
                              </select>
                              <button onClick={() => handleDeleteUser(u.id, u.email)} className="a-btn a-btn-danger" style={{ padding: "3px 6px", fontSize: 9 }}>✕</button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            {!usersLoading && filtered.length === 0 && (
              <div style={{ textAlign: "center", padding: 60 }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>🔍</div>
                <p style={{ color: T.textMuted, fontSize: 13 }}>No users match your filters</p>
              </div>
            )}
          </div>
        </>}

        {/* ═══ REVENUE TAB ═══ */}
        {tab === "revenue" && <>
          <div style={{ marginBottom: 24 }}>
            <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 26, fontWeight: 900, color: T.white }}>Revenue & Monetization</h1>
            <p style={{ color: T.textSecondary, fontSize: 13, marginTop: 4 }}>MRR tracking, conversion rates & revenue projections</p>
          </div>

          {/* Revenue KPIs */}
          <div className="a-kpi-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
            {[
              { label: "Monthly Revenue", value: `AED ${mrr.toLocaleString()}`, color: T.gold, icon: "💰", sub: `${stats.pro} Pro × AED 99 + ${stats.enterprise} Ent × AED 499` },
              { label: "Annual Revenue", value: `AED ${arr.toLocaleString()}`, color: T.green, icon: "📊", sub: "Projected yearly" },
              { label: "Projected MRR", value: `AED ${projectedMRR.toLocaleString()}`, color: T.teal, icon: "🔮", sub: "If 30% of trials convert" },
              { label: "Lead Revenue", value: `AED ${leadValue.toLocaleString()}`, color: T.orange, icon: "📞", sub: `${leads.length} leads × AED 125 avg` },
            ].map((k, i) => (
              <div key={i} className="a-kpi" style={{ animationDelay: `${i * 0.05}s` }}>
                <div style={{ fontSize: 20, marginBottom: 4 }}>{k.icon}</div>
                <div style={{ fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 900, color: k.color }}>{k.value}</div>
                <div style={{ fontSize: 10, color: T.textMuted, marginTop: 2, letterSpacing: 0.5, textTransform: "uppercase" }}>{k.label}</div>
                <div style={{ fontSize: 10, color: T.textSecondary, marginTop: 4 }}>{k.sub}</div>
              </div>
            ))}
          </div>

          {/* Revenue Charts */}
          <div className="a-charts-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
            <div className="a-card">
              <h3 style={{ fontSize: 14, fontWeight: 700, color: T.white, marginBottom: 16 }}>📈 Revenue Projection (6 months)</h3>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={revenueProjection}>
                  <defs>
                    <linearGradient id="gProj" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={T.gold} stopOpacity={0.3} />
                      <stop offset="100%" stopColor={T.gold} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="month" tick={{ fill: T.textMuted, fontSize: 11 }} axisLine={false} />
                  <YAxis tick={{ fill: T.textMuted, fontSize: 11 }} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="projected" stroke={T.gold} fill="url(#gProj)" strokeWidth={2.5} name="Projected MRR (AED)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="a-card">
              <h3 style={{ fontSize: 14, fontWeight: 700, color: T.white, marginBottom: 16 }}>🎯 Conversion Funnel</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 20 }}>
                {[
                  { label: "Visitors → Signup", value: "—", pct: "—", color: T.blue, note: "Connect analytics" },
                  { label: "Signup → Trial", value: `${stats.proTrial + stats.pro + stats.expired}`, pct: "100%", color: T.gold, note: "All signups get trial" },
                  { label: "Trial → Paid", value: `${stats.pro}`, pct: `${trialConversionRate}%`, color: T.green, note: trialConversionRate > 0 ? "Conversion rate" : "No conversions yet" },
                  { label: "Churn (Expired)", value: `${stats.expired}`, pct: `${stats.expired > 0 ? Math.round((stats.expired / (stats.expired + stats.pro)) * 100) : 0}%`, color: T.red, note: "Trial expired" },
                ].map((f, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 120, fontSize: 11, color: T.textSecondary }}>{f.label}</div>
                    <div style={{ flex: 1, height: 24, borderRadius: 6, background: T.surfaceAlt, overflow: "hidden", position: "relative" }}>
                      <div style={{ height: "100%", width: f.pct === "—" ? "0%" : f.pct, background: `${f.color}40`, borderRadius: 6, transition: "width 0.5s" }} />
                      <span style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", fontSize: 10, fontWeight: 700, color: f.color }}>{f.value} ({f.pct})</span>
                    </div>
                    <span style={{ fontSize: 10, color: T.textMuted, width: 100 }}>{f.note}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Revenue breakdown */}
          <div className="a-card">
            <h3 style={{ fontSize: 14, fontWeight: 700, color: T.white, marginBottom: 16 }}>💎 Revenue Breakdown</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
              {[
                { tier: "Pro", price: "AED 99/mo", users: stats.pro, revenue: stats.pro * 99, color: T.green },
                { tier: "Enterprise", price: "AED 499/mo", users: stats.enterprise, revenue: stats.enterprise * 499, color: T.blue },
                { tier: "Leads", price: "AED 125/lead", users: leads.length, revenue: leadValue, color: T.orange },
              ].map((r, i) => (
                <div key={i} style={{ padding: 16, borderRadius: 10, background: T.surfaceAlt, border: `1px solid ${T.border}` }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: r.color, marginBottom: 8 }}>{r.tier}</div>
                  <div style={{ fontFamily: "'Fraunces', serif", fontSize: 20, fontWeight: 900, color: T.white }}>AED {r.revenue.toLocaleString()}</div>
                  <div style={{ fontSize: 11, color: T.textMuted, marginTop: 4 }}>{r.users} × {r.price}</div>
                </div>
              ))}
            </div>
          </div>
        </>}

        {/* ═══ LEADS TAB ═══ */}
        {tab === "leads" && <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div>
              <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 26, fontWeight: 900, color: T.white }}>Lead Tracker</h1>
              <p style={{ color: T.textSecondary, fontSize: 13, marginTop: 4 }}>WhatsApp, Email & Call inquiries from the dashboard</p>
            </div>
          </div>

          <div className="a-kpi-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
            {[
              { label: "Total Leads", value: leads.length, color: T.white, icon: "📋" },
              { label: "WhatsApp", value: leads.filter(l => l.type === "whatsapp").length, color: T.green, icon: "💬" },
              { label: "Email", value: leads.filter(l => l.type === "email").length, color: T.gold, icon: "📧" },
              { label: "Est. Value", value: `AED ${leadValue.toLocaleString()}`, color: T.orange, icon: "💰" },
            ].map((k, i) => (
              <div key={i} className="a-kpi" style={{ animationDelay: `${i * 0.05}s` }}>
                <div style={{ fontSize: 20, marginBottom: 4 }}>{k.icon}</div>
                <div style={{ fontFamily: "'Fraunces', serif", fontSize: 24, fontWeight: 900, color: k.color }}>{k.value}</div>
                <div style={{ fontSize: 10, color: T.textMuted, marginTop: 2, letterSpacing: 0.5, textTransform: "uppercase" }}>{k.label}</div>
              </div>
            ))}
          </div>

          <div className="a-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: T.white }}>📞 All Inquiries</h3>
              <span style={{ fontSize: 11, color: T.textMuted }}>Leads auto-tracked when Pro users click WhatsApp/Email/Call</span>
            </div>
            {leads.length === 0 ? (
              <div style={{ textAlign: "center", padding: 60 }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
                <p style={{ color: T.textSecondary, fontSize: 14, fontWeight: 600 }}>No leads yet</p>
                <p style={{ color: T.textMuted, fontSize: 12, marginTop: 4, maxWidth: 400, margin: "8px auto 0" }}>
                  When Pro users click WhatsApp, Email or Call buttons on projects, leads will appear here automatically. To enable lead tracking, the inquiry buttons need to log to Firestore.
                </p>
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table className="a-table" style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: `2px solid ${T.border}` }}>
                      {["#", "Type", "Project", "User", "Date", "Status"].map(h => (
                        <th key={h} style={{ padding: "12px 16px", textAlign: "left", color: T.textMuted, fontWeight: 600, fontSize: 10, letterSpacing: 1, textTransform: "uppercase" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {leads.map((l, i) => (
                      <tr key={l.id} style={{ borderBottom: `1px solid ${T.border}` }}>
                        <td style={{ padding: "12px 16px", fontSize: 12, color: T.textMuted }}>{i + 1}</td>
                        <td style={{ padding: "12px 16px" }}>
                          <span className="a-badge" style={{ background: l.type === "whatsapp" ? "rgba(37,211,102,0.15)" : l.type === "email" ? "rgba(212,168,67,0.15)" : "rgba(0,191,165,0.15)", color: l.type === "whatsapp" ? T.green : l.type === "email" ? T.gold : T.teal }}>
                            {l.type === "whatsapp" ? "💬 WhatsApp" : l.type === "email" ? "📧 Email" : "📞 Call"}
                          </span>
                        </td>
                        <td style={{ padding: "12px 16px", fontSize: 12, color: T.white }}>{l.project || "—"}</td>
                        <td style={{ padding: "12px 16px", fontSize: 12, color: T.textSecondary }}>{l.userEmail || "—"}</td>
                        <td style={{ padding: "12px 16px", fontSize: 12, color: T.textSecondary }}>{l.timestamp ? new Date(l.timestamp).toLocaleString() : "—"}</td>
                        <td style={{ padding: "12px 16px" }}>
                          <span className="a-badge" style={{ background: "rgba(16,185,129,0.15)", color: T.green }}>New</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>}

        {/* ═══ ANALYTICS TAB ═══ */}
        {tab === "analytics" && <>
          <div style={{ marginBottom: 24 }}>
            <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 26, fontWeight: 900, color: T.white }}>Platform Analytics</h1>
            <p style={{ color: T.textSecondary, fontSize: 13, marginTop: 4 }}>Growth metrics, user insights & platform performance</p>
          </div>

          {/* Growth KPIs */}
          <div className="a-kpi-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
            {[
              { label: "Growth Rate", value: stats.thisWeek > 0 ? `${Math.round((stats.thisWeek / Math.max(stats.total - stats.thisWeek, 1)) * 100)}%` : "0%", color: T.green, icon: "🚀", sub: "Week over week" },
              { label: "Avg Revenue/User", value: `AED ${avgRevenuePerUser}`, color: T.gold, icon: "💵", sub: "ARPU monthly" },
              { label: "Trial Conversion", value: `${trialConversionRate}%`, color: T.teal, icon: "🎯", sub: `${stats.pro} of ${stats.pro + stats.expired} converted` },
              { label: "Platform Health", value: stats.total > 0 ? "Active" : "New", color: T.green, icon: "💚", sub: `${stats.proTrial} active trials` },
            ].map((k, i) => (
              <div key={i} className="a-kpi" style={{ animationDelay: `${i * 0.05}s` }}>
                <div style={{ fontSize: 20, marginBottom: 4 }}>{k.icon}</div>
                <div style={{ fontFamily: "'Fraunces', serif", fontSize: 24, fontWeight: 900, color: k.color }}>{k.value}</div>
                <div style={{ fontSize: 10, color: T.textMuted, marginTop: 2, letterSpacing: 0.5, textTransform: "uppercase" }}>{k.label}</div>
                <div style={{ fontSize: 10, color: T.textSecondary, marginTop: 4 }}>{k.sub}</div>
              </div>
            ))}
          </div>

          <div className="a-charts-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
            {/* User Growth */}
            <div className="a-card">
              <h3 style={{ fontSize: 14, fontWeight: 700, color: T.white, marginBottom: 16 }}>📊 Cumulative Users</h3>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={(() => {
                  const sorted = [...users].sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
                  let cumulative = 0;
                  const data = {};
                  sorted.forEach(u => {
                    if (u.createdAt) {
                      const d = new Date(u.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
                      cumulative++;
                      data[d] = cumulative;
                    }
                  });
                  return Object.entries(data).map(([date, total]) => ({ date, total }));
                })()}>
                  <defs>
                    <linearGradient id="gCum" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={T.teal} stopOpacity={0.3} />
                      <stop offset="100%" stopColor={T.teal} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="date" tick={{ fill: T.textMuted, fontSize: 10 }} axisLine={false} />
                  <YAxis tick={{ fill: T.textMuted, fontSize: 10 }} axisLine={false} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="total" stroke={T.teal} fill="url(#gCum)" strokeWidth={2.5} name="Total Users" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Tier History */}
            <div className="a-card">
              <h3 style={{ fontSize: 14, fontWeight: 700, color: T.white, marginBottom: 16 }}>🗓️ Key Milestones</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 8 }}>
                {[
                  { milestone: "Platform launched", date: "Mar 2026", icon: "🚀", done: true },
                  { milestone: "First 10 users", date: `${stats.total >= 10 ? "✓" : `${10 - stats.total} to go`}`, icon: "👥", done: stats.total >= 10 },
                  { milestone: "First 50 users", date: `${stats.total >= 50 ? "✓" : `${50 - stats.total} to go`}`, icon: "📈", done: stats.total >= 50 },
                  { milestone: "First paid user", date: `${stats.pro > 0 ? "✓" : "Pending"}`, icon: "💰", done: stats.pro > 0 },
                  { milestone: "AED 10K MRR", date: `${mrr >= 10000 ? "✓" : `AED ${(10000 - mrr).toLocaleString()} to go`}`, icon: "🏆", done: mrr >= 10000 },
                  { milestone: "100 users", date: `${stats.total >= 100 ? "✓" : `${100 - stats.total} to go`}`, icon: "🎯", done: stats.total >= 100 },
                  { milestone: "500 users", date: `${stats.total >= 500 ? "✓" : `${500 - stats.total} to go`}`, icon: "⭐", done: stats.total >= 500 },
                  { milestone: "AED 50K MRR", date: `${mrr >= 50000 ? "✓" : `AED ${(50000 - mrr).toLocaleString()} to go`}`, icon: "💎", done: mrr >= 50000 },
                ].map((m, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 12px", borderRadius: 8, background: m.done ? "rgba(16,185,129,0.06)" : T.surfaceAlt, border: `1px solid ${m.done ? "rgba(16,185,129,0.15)" : T.border}` }}>
                    <span style={{ fontSize: 16 }}>{m.icon}</span>
                    <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: m.done ? T.green : T.textSecondary }}>{m.milestone}</span>
                    <span style={{ fontSize: 11, color: m.done ? T.green : T.textMuted, fontWeight: m.done ? 700 : 400 }}>{m.date}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>}

        {/* Footer */}
        <div style={{ textAlign: "center", padding: "32px 0", color: T.textMuted, fontSize: 11 }}>
          DXB Analytics Admin · {users.length} users · {stats.pro + stats.enterprise} paid · AED {mrr.toLocaleString()} MRR · Live from Firestore
        </div>
      </div>
    </div>
  );
}
