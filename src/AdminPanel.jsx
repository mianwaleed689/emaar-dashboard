/* ─── DXB ANALYTICS ADMIN PANEL ─── */
import React, { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { auth, db } from "./firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { collection, getDocs, doc, getDoc, setDoc, deleteDoc } from "firebase/firestore";

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
  .admin-card { background: ${T.surface}; border: 1px solid ${T.border}; border-radius: 14px; padding: 20px; animation: fadeUp 0.5s ease-out both; }
  .admin-kpi { background: ${T.surface}; border: 1px solid ${T.border}; border-radius: 14px; padding: 20px; text-align: center; animation: fadeUp 0.5s ease-out both; }
  .admin-table tr:hover { background: ${T.surfaceAlt}; }
  .tier-badge { padding: 4px 10px; border-radius: 6px; font-size: 10px; font-weight: 700; display: inline-block; }
  .admin-select { padding: 6px 10px; background: ${T.surfaceAlt}; border: 1px solid ${T.border}; border-radius: 8px; color: ${T.textPrimary}; font-size: 12px; font-family: 'Outfit', sans-serif; cursor: pointer; outline: none; }
  .admin-select:focus { border-color: ${T.gold}; }
  .admin-btn { padding: 8px 20px; border-radius: 8px; border: none; font-family: 'Outfit', sans-serif; font-weight: 600; cursor: pointer; transition: all 0.2s; font-size: 12px; }
  .admin-btn:hover { transform: translateY(-1px); }
  .admin-btn-danger { background: rgba(239,68,68,0.15); color: ${T.red}; border: 1px solid rgba(239,68,68,0.2); }
  .admin-btn-danger:hover { background: rgba(239,68,68,0.25); }
  .search-input { width: 100%; padding: 10px 14px 10px 38px; background: ${T.surface}; border: 1px solid ${T.border}; border-radius: 10px; color: ${T.textPrimary}; font-size: 13px; font-family: 'Outfit', sans-serif; outline: none; }
  .search-input:focus { border-color: ${T.gold}; }
  @media (max-width: 768px) {
    .admin-kpi-grid { grid-template-columns: 1fr 1fr !important; }
    .admin-charts-grid { grid-template-columns: 1fr !important; }
    .admin-container { padding: 16px !important; }
  }
`;

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: "10px 14px", boxShadow: "0 8px 32px rgba(0,0,0,0.3)" }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: T.gold, marginBottom: 4 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ fontSize: 12, color: p.color || T.textPrimary }}>{p.name}: {p.value}</div>
      ))}
    </div>
  );
};

export default function AdminPanel() {
  const [authUser, setAuthUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filterTier, setFilterTier] = useState("all");
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setAuthUser(u);
        try {
          const userDoc = await getDoc(doc(db, "users", u.uid));
          if (userDoc.exists() && userDoc.data().role === "admin") {
            setIsAdmin(true);
          } else if (!userDoc.exists()) {
            setIsAdmin(true);
          }
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

  const fetchUsers = async () => {
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
  };

  useEffect(() => { if (isAdmin) fetchUsers(); }, [isAdmin]);

  const handleChangeTier = async (userId, newTier) => {
    try {
      await setDoc(doc(db, "users", userId), { tier: newTier }, { merge: true });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, tier: newTier, status: newTier === "pro_trial" ? "pro_trial" : newTier } : u));
    } catch (err) { console.log("Error:", err); }
  };

  const handleDeleteUser = async (userId, email) => {
    if (!window.confirm(`Delete user ${email}? This removes their Firestore profile.`)) return;
    try {
      await deleteDoc(doc(db, "users", userId));
      setUsers(prev => prev.filter(u => u.id !== userId));
    } catch (err) { console.log("Error:", err); }
  };

  const filtered = users.filter(u => {
    const matchSearch = !search || (u.name || "").toLowerCase().includes(search.toLowerCase()) || (u.email || "").toLowerCase().includes(search.toLowerCase());
    const matchTier = filterTier === "all" || u.tier === filterTier || (filterTier === "expired" && u.status === "expired");
    return matchSearch && matchTier;
  });

  const stats = {
    total: users.length,
    proTrial: users.filter(u => u.status === "pro_trial").length,
    free: users.filter(u => u.tier === "free" || u.status === "expired").length,
    pro: users.filter(u => u.tier === "pro").length,
    enterprise: users.filter(u => u.tier === "enterprise").length,
    expired: users.filter(u => u.status === "expired").length,
    today: users.filter(u => u.createdAt && new Date(u.createdAt).toDateString() === new Date().toDateString()).length,
    thisWeek: users.filter(u => u.createdAt && (new Date() - new Date(u.createdAt)) < 7 * 24 * 60 * 60 * 1000).length,
  };

  const signupsByDay = (() => {
    const days = {};
    users.forEach(u => {
      if (u.createdAt) {
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

  return (
    <div style={{ minHeight: "100vh", background: T.bg, fontFamily: "'Outfit', sans-serif", color: T.textPrimary }}>
      <style>{css}</style>

      {/* TOP BAR */}
      <header style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(4,9,15,0.95)", backdropFilter: "blur(20px)", borderBottom: `1px solid ${T.border}`, padding: "12px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <a href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
            <svg width="28" height="28" viewBox="0 0 40 40"><rect x="2" y="2" width="36" height="36" rx="8" fill="none" stroke={T.gold} strokeWidth="2" /><path d="M12 28V12h10l-6 8h8l-12 8z" fill={T.gold} /></svg>
            <span style={{ fontFamily: "'Fraunces', serif", fontSize: 16, fontWeight: 800, color: T.gold }}>DXB Analytics</span>
          </a>
          <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 6, background: "rgba(239,68,68,0.15)", color: T.red, fontWeight: 700, letterSpacing: 0.5 }}>ADMIN</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ fontSize: 12, color: T.textMuted }}>{time.toLocaleString("en-AE", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
          <a href="/" style={{ fontSize: 12, color: T.textSecondary, textDecoration: "none", padding: "6px 14px", border: `1px solid ${T.border}`, borderRadius: 8 }}>← Dashboard</a>
          <button onClick={() => signOut(auth)} style={{ fontSize: 12, color: T.textMuted, background: "none", border: `1px solid ${T.border}`, borderRadius: 8, padding: "6px 14px", cursor: "pointer", fontFamily: "'Outfit', sans-serif" }}>Logout</button>
        </div>
      </header>

      {/* MAIN */}
      <div className="admin-container" style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 32px" }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 28, fontWeight: 900, color: T.white }}>Admin Panel</h1>
          <p style={{ color: T.textSecondary, fontSize: 13, marginTop: 4 }}>User management, analytics & platform health</p>
        </div>

        {/* KPI CARDS */}
        <div className="admin-kpi-grid" style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 12, marginBottom: 24 }}>
          {[
            { label: "Total Users", value: stats.total, color: T.white, icon: "👥" },
            { label: "Today", value: stats.today, color: T.gold, icon: "📅" },
            { label: "This Week", value: stats.thisWeek, color: T.teal, icon: "📊" },
            { label: "Pro Trial", value: stats.proTrial, color: T.gold, icon: "⭐" },
            { label: "Free / Expired", value: stats.free, color: T.textMuted, icon: "🔓" },
            { label: "Paid (Pro+)", value: stats.pro + stats.enterprise, color: T.green, icon: "💰" },
          ].map((k, i) => (
            <div key={i} className="admin-kpi" style={{ animationDelay: `${i * 0.05}s` }}>
              <div style={{ fontSize: 20, marginBottom: 6 }}>{k.icon}</div>
              <div style={{ fontFamily: "'Fraunces', serif", fontSize: 28, fontWeight: 900, color: k.color }}>{k.value}</div>
              <div style={{ fontSize: 10, color: T.textMuted, marginTop: 2, letterSpacing: 0.5, textTransform: "uppercase" }}>{k.label}</div>
            </div>
          ))}
        </div>

        {/* CHARTS */}
        <div className="admin-charts-grid" style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16, marginBottom: 24 }}>
          <div className="admin-card">
            <h3 style={{ fontSize: 14, fontWeight: 700, color: T.white, marginBottom: 16 }}>📈 Signup Timeline</h3>
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
          <div className="admin-card">
            <h3 style={{ fontSize: 14, fontWeight: 700, color: T.white, marginBottom: 16 }}>🎯 Tier Distribution</h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={tierData} cx="50%" cy="50%" outerRadius={75} innerRadius={45} dataKey="value" paddingAngle={3}
                  label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                  {tierData.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* USER TABLE */}
        <div className="admin-card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: T.white }}>👥 All Users ({filtered.length})</h3>
              <p style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>Manage tiers, view signups, monitor trials</p>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <div style={{ position: "relative" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={T.textMuted} strokeWidth="2" strokeLinecap="round" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <input className="search-input" placeholder="Search name or email..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: 220 }} />
              </div>
              <select className="admin-select" value={filterTier} onChange={e => setFilterTier(e.target.value)}>
                <option value="all">All Tiers</option>
                <option value="free">Free</option>
                <option value="pro_trial">Pro Trial</option>
                <option value="pro">Pro</option>
                <option value="enterprise">Enterprise</option>
                <option value="expired">Expired Trial</option>
              </select>
              <button onClick={fetchUsers} className="admin-btn" style={{ background: T.goldGlow, color: T.gold, border: `1px solid ${T.border}` }}>↻ Refresh</button>
            </div>
          </div>

          {usersLoading ? (
            <div style={{ textAlign: "center", padding: 60 }}>
              <div style={{ width: 24, height: 24, border: `2px solid ${T.border}`, borderTopColor: T.gold, borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto" }} />
              <p style={{ color: T.textMuted, fontSize: 12, marginTop: 12 }}>Loading users...</p>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="admin-table" style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: `2px solid ${T.border}` }}>
                    {["#", "User", "Email", "Tier", "Trial Status", "Signed Up", "Actions"].map(h => (
                      <th key={h} style={{ padding: "12px 16px", textAlign: "left", color: T.textMuted, fontWeight: 600, fontSize: 10, letterSpacing: 1, textTransform: "uppercase" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((u, i) => {
                    const tierColor = u.tier === "pro" || u.tier === "enterprise" ? T.green : u.status === "pro_trial" ? T.gold : u.status === "expired" ? T.red : T.textMuted;
                    const tierLabel = u.tier === "pro" ? "Pro" : u.tier === "enterprise" ? "Enterprise" : u.status === "pro_trial" ? "Pro Trial" : u.status === "expired" ? "Expired" : "Free";
                    const signedUp = u.createdAt ? new Date(u.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—";
                    const timeSince = u.createdAt ? (() => {
                      const diff = Math.floor((new Date() - new Date(u.createdAt)) / (1000 * 60));
                      if (diff < 1) return "Just now";
                      if (diff < 60) return `${diff}m ago`;
                      if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
                      return `${Math.floor(diff / 1440)}d ago`;
                    })() : "";
                    return (
                      <tr key={u.id} style={{ borderBottom: `1px solid ${T.border}`, transition: "background 0.15s" }}>
                        <td style={{ padding: "14px 16px", color: T.textMuted, fontSize: 12 }}>{i + 1}</td>
                        <td style={{ padding: "14px 16px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{ width: 32, height: 32, borderRadius: "50%", background: `linear-gradient(135deg, ${T.gold}, #B8912F)`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 12, color: T.bg, flexShrink: 0 }}>
                              {(u.name || u.email || "?").charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 600, color: T.white }}>{u.name || "—"}</div>
                              {u.role === "admin" && <span style={{ fontSize: 9, color: T.red, fontWeight: 700 }}>ADMIN</span>}
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: "14px 16px", fontSize: 12, color: T.textSecondary }}>{u.email || "—"}</td>
                        <td style={{ padding: "14px 16px" }}>
                          <span className="tier-badge" style={{ background: `${tierColor}15`, color: tierColor, border: `1px solid ${tierColor}30` }}>{tierLabel}</span>
                        </td>
                        <td style={{ padding: "14px 16px", fontSize: 12 }}>
                          {u.status === "pro_trial" ? (
                            <div>
                              <span style={{ color: T.gold, fontWeight: 600 }}>{u.daysLeft}d left</span>
                              <div style={{ width: 60, height: 3, borderRadius: 2, background: T.surfaceAlt, marginTop: 4 }}>
                                <div style={{ width: `${(u.daysLeft / 7) * 100}%`, height: "100%", borderRadius: 2, background: T.gold }} />
                              </div>
                            </div>
                          ) : u.status === "expired" ? (
                            <span style={{ color: T.red, fontWeight: 600 }}>Expired</span>
                          ) : u.tier === "pro" || u.tier === "enterprise" ? (
                            <span style={{ color: T.green, fontWeight: 600 }}>Active ✓</span>
                          ) : <span style={{ color: T.textMuted }}>—</span>}
                        </td>
                        <td style={{ padding: "14px 16px" }}>
                          <div style={{ fontSize: 12, color: T.white }}>{signedUp}</div>
                          <div style={{ fontSize: 10, color: T.textMuted }}>{timeSince}</div>
                        </td>
                        <td style={{ padding: "14px 16px" }}>
                          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                            <select className="admin-select" value={u.tier} onChange={e => handleChangeTier(u.id, e.target.value)} style={{ fontSize: 11, padding: "4px 8px" }}>
                              <option value="free">Free</option>
                              <option value="pro_trial">Pro Trial</option>
                              <option value="pro">Pro</option>
                              <option value="enterprise">Enterprise</option>
                            </select>
                            <button onClick={() => handleDeleteUser(u.id, u.email)} className="admin-btn admin-btn-danger" style={{ padding: "4px 8px", fontSize: 10 }}>✕</button>
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
              <p style={{ color: T.textMuted, fontSize: 13 }}>No users match your search</p>
            </div>
          )}
        </div>

        <div style={{ textAlign: "center", padding: "32px 0", color: T.textMuted, fontSize: 11 }}>
          DXB Analytics Admin · {users.length} registered users · Data live from Firestore
        </div>
      </div>
    </div>
  );
}
