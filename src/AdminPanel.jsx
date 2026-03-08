/* ═══════════════════════════════════════════════════════════════
   DXB ANALYTICS — ADMIN PANEL
   Matching dashboard design DNA: sidebar nav, KPI cards, sections
   ═══════════════════════════════════════════════════════════════ */
import React, { useState, useEffect, useCallback } from "react";
import ReactDOM from "react-dom";
import { auth, db, storage, firebaseConfig } from "./firebase";
import { initializeApp, deleteApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import emailjs from "@emailjs/browser";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { onAuthStateChanged, signOut, createUserWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { collection, getDocs, doc, getDoc, setDoc, deleteDoc } from "firebase/firestore";
import { BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { emaarProjects, emaarCommunities, emaarYields, communityROI as defaultCommunityROI } from "./data";
import ProjectManager from "./ProjectManager";
import { useI18n, LANGUAGES } from "./i18n";

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
  data: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4.03 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5"/></svg>,
  logout: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  search: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  download: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  refresh: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>,
  trash: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>,
  check: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>,
  arrow: <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="18 15 12 9 6 15"/></svg>,
  bell: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
  projects: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>,
  chart: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/></svg>,
  yields: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
  whatsapp: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>,
  email: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22 6 12 13 2 6"/></svg>,
  phone: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>,
  rocket: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/></svg>,
  team: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  trophy: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 22V8a6 6 0 0 0-6-6h16a6 6 0 0 0-6 6v14"/></svg>,
  star: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  verify: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>,
  target: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>,
};

/* ─── CSS (exactly matching main dashboard design DNA) ─── */
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
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
@keyframes spin { to { transform: rotate(360deg); } }
.fade-up { animation: fadeUp 0.5s ease-out forwards; opacity: 0; }
  @keyframes toastIn { 0% { opacity: 0; transform: translateY(20px); } 100% { opacity: 1; transform: translateY(0); } }
  @keyframes toastOut { 0% { opacity: 1; } 100% { opacity: 0; transform: translateY(-10px); } }
  .toast-notify { animation: toastIn 0.3s ease-out, toastOut 0.4s ease-in 2.4s forwards; }

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
  .admin-sidebar { transform: translateX(-100%); position: fixed !important; z-index: 100; }
  .admin-sidebar.open { transform: translateX(0); }
  .admin-main { margin-left: 0 !important; }
  .admin-topbar { left: 0 !important; }
  .admin-mobile-btn { display: flex !important; }
  .kpi-grid-4 { grid-template-columns: 1fr 1fr !important; }
  .kpi-grid-6 { grid-template-columns: 1fr 1fr !important; }
  .kpi-grid-overview { grid-template-columns: repeat(2, 1fr) !important; }
  .charts-row-overview { grid-template-columns: 1fr !important; }
  .chart-grid-2 { grid-template-columns: 1fr !important; }
  .chart-grid-3 { grid-template-columns: 1fr !important; }
  .table-scroll { overflow-x: auto; -webkit-overflow-scrolling: touch; }
  .data-sub-tabs { flex-direction: column !important; }
  .community-grid { grid-template-columns: 1fr !important; }
  .users-table-desktop { display: none !important; }
  .users-table-mobile { display: flex !important; }
  .users-kpi-grid { grid-template-columns: 1fr 1fr !important; }
}
@media (max-width: 480px) {
  .kpi-grid-4 { grid-template-columns: 1fr !important; }
  .kpi-grid-6 { grid-template-columns: 1fr !important; }
  .kpi-grid-overview { grid-template-columns: 1fr 1fr !important; }
  .charts-row-overview { grid-template-columns: 1fr !important; }
  .edit-grid-3 { grid-template-columns: 1fr !important; }
  .users-kpi-grid { grid-template-columns: 1fr 1fr !important; }
}
@keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
@keyframes fadeBackdrop { from { opacity: 0; } to { opacity: 1; } }
.drawer-panel { animation: slideIn 0.32s cubic-bezier(0.16,1,0.3,1) forwards; }

@keyframes slideUp { from { transform: translateY(16px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
.users-table-mobile { display: none; flex-direction: column; gap: 10px; }
.risk-btn-wrap:hover .risk-tooltip { opacity: 1 !important; pointer-events: auto !important; }

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

/* ─── REUSABLE COMPONENTS (outside component to prevent re-mount on state change) ─── */
const KPI = ({ label, value, sub, color, delay = 0 }) => (
  <div className="kpi-card fade-up" style={{ animationDelay: `${delay * 0.05}s` }}>
    <div style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 10 }}>{label}</div>
    <div style={{ fontFamily: "'Fraunces',serif", fontSize: 28, fontWeight: 900, color: color || T.gold, lineHeight: 1 }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.green, marginTop: 8, fontWeight: 500 }}>{sub}</div>}
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

/* ═══════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════ */
/* ─── NOTIFICATIONS TAB COMPONENT ─── */
function NotificationsTab({ T, notify, adminUser }) {
  const [notifForm, setNotifForm] = useState({ title: "", message: "", icon: "📢", target: "all" });
  const [notifSending, setNotifSending] = useState(false);
  const [sentNotifs, setSentNotifs] = useState([]);

  useEffect(() => {
    getDocs(collection(db, "notifications")).then(snap => {
      const list = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() }));
      list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      setSentNotifs(list.slice(0, 20));
    }).catch(() => {});
  }, []);

  const sendNotification = async () => {
    if (!notifForm.title || !notifForm.message) { notify("Error: Title and message required"); return; }
    setNotifSending(true);
    try {
      const id = `notif_${Date.now()}`;
      await setDoc(doc(db, "notifications", id), {
        ...notifForm, userId: notifForm.target, read: false,
        createdAt: new Date().toISOString(), sentBy: adminUser?.email || "admin"
      });
      notify("Notification sent to all users!");
      setNotifForm({ title: "", message: "", icon: "bell", target: "all" });
      setSentNotifs(prev => [{ id, ...notifForm, createdAt: new Date().toISOString() }, ...prev]);
    } catch (e) { notify("Error: " + e.message); }
    setNotifSending(false);
  };

  const ICONS = ["📢","🏙️","💰","📈","⚠️","🔥","✅","🎉","📋","🏗️"];

  return (
    <Section title="Send Notification" sub="Broadcast alerts to all users on the dashboard">
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 11, color: T.textMuted, marginBottom: 6, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>Icon</label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {ICONS.map(ic => (
                <button key={ic} type="button" onClick={() => setNotifForm(p => ({ ...p, icon: ic }))} style={{ padding: "8px 12px", borderRadius: 8, border: `1px solid ${notifForm.icon === ic ? T.gold : T.border}`, background: notifForm.icon === ic ? T.goldGlow : T.surfaceAlt, cursor: "pointer", fontSize: 18 }}>{ic}</button>
              ))}
            </div>
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 11, color: T.textMuted, marginBottom: 6, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>Title</label>
            <input type="text" value={notifForm.title} onChange={e => setNotifForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. New project launched in Downtown" style={{ width: "100%", padding: 10, borderRadius: 8, border: `1px solid ${T.border}`, background: T.surfaceAlt, color: T.white, fontSize: 12, fontFamily: "'Outfit',sans-serif", boxSizing: "border-box" }} />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 11, color: T.textMuted, marginBottom: 6, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>Message</label>
            <textarea value={notifForm.message} onChange={e => setNotifForm(p => ({ ...p, message: e.target.value }))} placeholder="e.g. Creek Waters III is now available. Starting from AED 1.2M." rows={3} style={{ width: "100%", padding: 10, borderRadius: 8, border: `1px solid ${T.border}`, background: T.surfaceAlt, color: T.white, fontSize: 12, fontFamily: "'Outfit',sans-serif", resize: "vertical", boxSizing: "border-box" }} />
          </div>
          <div style={{ padding: 14, borderRadius: 10, background: "rgba(212,168,67,0.06)", border: `1px solid ${T.border}`, marginBottom: 14 }}>
            <div style={{ fontSize: 10, color: T.textMuted, marginBottom: 6, fontWeight: 600, textTransform: "uppercase" }}>Preview</div>
            <div style={{ display: "flex", gap: 10 }}>
              <span style={{ fontSize: 20 }}>{notifForm.icon}</span>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.white }}>{notifForm.title || "Title here"}</div>
                <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>{notifForm.message || "Message here..."}</div>
              </div>
            </div>
          </div>
          <button type="button" onClick={sendNotification} disabled={notifSending} style={{ width: "100%", padding: "12px", borderRadius: 10, border: "none", background: `linear-gradient(135deg, ${T.gold}, ${T.goldDim})`, color: T.bg, fontWeight: 700, fontSize: 13, cursor: notifSending ? "wait" : "pointer", fontFamily: "'Outfit',sans-serif" }}>
            {notifSending ? "Sending..." : "Send to All Users"}
          </button>
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.textSecondary, marginBottom: 12, textTransform: "uppercase", letterSpacing: 0.5 }}>Recent Sent</div>
          {sentNotifs.length === 0 ? (
            <div style={{ textAlign: "center", padding: 40, color: T.textMuted, fontSize: 12 }}>No notifications sent yet</div>
          ) : sentNotifs.map((n) => (
            <div key={n.id} style={{ padding: "10px 14px", background: T.surfaceAlt, borderRadius: 10, border: `1px solid ${T.border}`, marginBottom: 8 }}>
              <div style={{ display: "flex", gap: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", fontFamily: "sans-serif" }}>NOTIF</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: T.white }}>{n.title}</div>
                  <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>{n.message}</div>
                  <div style={{ fontSize: 10, color: T.textMuted, marginTop: 4 }}>{n.createdAt ? new Date(n.createdAt).toLocaleDateString("en-AE", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : ""}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}

function EiborRatesPanel({ db, T }) {
  const EIBOR_FALLBACK = { "1m": 3.635, "3m": 3.593, "6m": 3.676, "1y": 3.674, on: 3.473, "1w": 3.577 };
  const [eiborEdit, setEiborEdit] = React.useState({ "1m": "", "3m": "", "6m": "", "1y": "", asOf: "" });
  const [eiborSaving, setEiborSaving] = React.useState(false);
  const [eiborSaved, setEiborSaved] = React.useState(false);
  const [eiborCurrent, setEiborCurrent] = React.useState(null);

  React.useEffect(() => {
    getDoc(doc(db, "tabData", "eiborRates")).then(snap => {
      if (snap.exists()) setEiborCurrent(snap.data());
    }).catch(() => {});
  }, [db]);

  const saveEibor = async () => {
    if (!eiborEdit["3m"]) return;
    setEiborSaving(true);
    try {
      await setDoc(doc(db, "tabData", "eiborRates"), {
        on: parseFloat(eiborEdit.on || eiborCurrent?.on || EIBOR_FALLBACK.on),
        "1w": parseFloat(eiborEdit["1w"] || eiborCurrent?.["1w"] || EIBOR_FALLBACK["1w"]),
        "1m": parseFloat(eiborEdit["1m"] || eiborCurrent?.["1m"] || EIBOR_FALLBACK["1m"]),
        "3m": parseFloat(eiborEdit["3m"]),
        "6m": parseFloat(eiborEdit["6m"] || eiborCurrent?.["6m"] || EIBOR_FALLBACK["6m"]),
        "1y": parseFloat(eiborEdit["1y"] || eiborCurrent?.["1y"] || EIBOR_FALLBACK["1y"]),
        asOf: eiborEdit.asOf || new Date().toLocaleDateString("en-AE", { day: "numeric", month: "short", year: "numeric" }),
        source: "Live · UAE Central Bank",
        updatedAt: Date.now(),
      });
      setEiborSaved(true);
      setEiborEdit({ "1m": "", "3m": "", "6m": "", "1y": "", asOf: "" });
      getDoc(doc(db, "tabData", "eiborRates")).then(snap => { if (snap.exists()) setEiborCurrent(snap.data()); });
      setTimeout(() => setEiborSaved(false), 3000);
    } catch(e) { console.error("EIBOR save error:", e); }
    setEiborSaving(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ fontFamily: "'Fraunces',serif", fontSize: 22, fontWeight: 800, color: T.gold }}>EIBOR Rate Update</div>
      <div style={{ fontSize: 13, color: T.textMuted }}>
        Check latest rates at{" "}
        <a href="https://www.centralbank.ae/en/forex-eibor/eibor-rates/" target="_blank" rel="noopener noreferrer" style={{ color: T.gold }}>centralbank.ae ↗</a>
        {" "}or{" "}
        <a href="https://fcmb.ae/eibor-rate-today" target="_blank" rel="noopener noreferrer" style={{ color: T.gold }}>fcmb.ae ↗</a>
        {" "}then enter below. Rates update instantly for all users on the Mortgage tab.
      </div>
      {eiborCurrent && (
        <div style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.25)", borderRadius: 14, padding: "18px 22px" }}>
          <div style={{ fontSize: 11, color: "#10B981", fontWeight: 700, marginBottom: 12, textTransform: "uppercase", letterSpacing: 1 }}>Currently Live — {eiborCurrent.asOf}</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
            {[["1M", "1m"], ["3M", "3m"], ["6M", "6m"], ["1Y", "1y"]].map(([l, k]) => (
              <div key={k} style={{ background: "rgba(16,185,129,0.04)", borderRadius: 10, padding: "12px 16px", border: "1px solid rgba(16,185,129,0.15)", textAlign: "center" }}>
                <div style={{ fontSize: 10, color: T.textMuted, marginBottom: 6, textTransform: "uppercase" }}>{l} EIBOR {k === "3m" && "⭐"}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: "#10B981", fontFamily: "'Fraunces',serif" }}>{eiborCurrent[k] ? parseFloat(eiborCurrent[k]).toFixed(4) : "—"}%</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 12, fontSize: 11, color: T.textMuted }}>Typical variable rate: <span style={{ color: T.gold, fontWeight: 700 }}>{eiborCurrent["3m"] ? (parseFloat(eiborCurrent["3m"]) + 1.5).toFixed(2) : "—"}%</span> (3M + 1.5% bank spread)</div>
        </div>
      )}
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, padding: "22px 24px" }}>
        <div style={{ fontFamily: "'Fraunces',serif", fontSize: 16, fontWeight: 700, color: T.white, marginBottom: 18 }}>Enter New Rates</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 16 }}>
          {[["1M EIBOR", "1m"], ["3M EIBOR", "3m"], ["6M EIBOR", "6m"], ["1Y EIBOR", "1y"]].map(([label, key]) => (
            <div key={key}>
              <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 6 }}>{label} {key === "3m" && <span style={{ fontSize: 9, fontWeight: 700, color: T.gold, background: "rgba(212,168,67,0.12)", padding: "1px 6px", borderRadius: 4, letterSpacing: 0.3 }}>PRIMARY</span>}</div>
              <input type="number" step="0.0001"
                placeholder={eiborCurrent?.[key] ? parseFloat(eiborCurrent[key]).toFixed(4) : "e.g. 3.5992"}
                value={eiborEdit[key]}
                onChange={e => setEiborEdit(prev => ({ ...prev, [key]: e.target.value }))}
                style={{ width: "100%", padding: "10px 12px", background: T.surfaceAlt, border: `1px solid ${key === "3m" ? T.gold : T.border}`, borderRadius: 8, color: T.white, fontSize: 13, fontFamily: "'Outfit',sans-serif", boxSizing: "border-box" }}
              />
            </div>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 14 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 6 }}>Value Date</div>
            <input type="text" placeholder="e.g. 6 Mar 2026" value={eiborEdit.asOf}
              onChange={e => setEiborEdit(prev => ({ ...prev, asOf: e.target.value }))}
              style={{ width: "100%", padding: "10px 12px", background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8, color: T.white, fontSize: 13, fontFamily: "'Outfit',sans-serif", boxSizing: "border-box" }} />
          </div>
          <button type="button" onClick={saveEibor} disabled={eiborSaving || !eiborEdit["3m"]}
            style={{ padding: "10px 28px", borderRadius: 10, background: eiborSaved ? "#10B981" : T.gold, border: "none", color: "#04090F", fontSize: 14, fontWeight: 700, cursor: eiborEdit["3m"] ? "pointer" : "not-allowed", fontFamily: "'Outfit',sans-serif", whiteSpace: "nowrap" }}>
            {eiborSaved ? "Saved!" : eiborSaving ? "Saving..." : "Save to Firestore →"}
          </button>
        </div>
      </div>
    </div>
  );
}



/* ══════════════════════════════════════════════════════
   USERS TAB COMPONENT — Professional SaaS User Management
   Full rebuild: all 36 audit issues resolved
══════════════════════════════════════════════════════ */

/* ─── PROFILE DRAWER (top-level component — stable reference, portal to root) ─── */
const EditIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);
const CopyIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
  </svg>
);
const ProfileDrawerComponent = ({
  drawerUser, onClose, drawerTab, setDrawerTab,
  T, getTierBadge, getJobRoleBadge, getHealth, trialDaysLeft,
  copyToClipboard, copiedId, TAGS_OPTIONS, BILLING_TIERS, JOB_ROLES,
  handleTierChange, handleJobRoleChange, setNoteUser, setNoteText, setTagUser,
  setConfirmSuspend, setConfirmDelete, sendResetEmail,
  setNotifUser, setNotifTitle, setNotifMessage,
  setSendEmailUser, setEmailSubject, setEmailBody,
  timeSince, lastActiveLabel, lastActiveColor, getUserLTV, AT_RISK_DAYS,
  inputStyle, confirmAndExtend, notify, openEditUser,
}) => {
  if (!drawerUser) return null;
    const u     = drawerUser;
    const badge = getTierBadge(u);
    const job   = getJobRoleBadge(u);
    const health = getHealth(u);
    const days  = trialDaysLeft(u);

    // Clean SVG icons — no emojis
    const IconUser     = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
    const IconTier     = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;
    const IconActivity = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>;
    const IconActions  = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M4.93 4.93a10 10 0 0 0 0 14.14"/></svg>;
    const IconMail     = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>;
    const IconBell     = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>;
    const IconKey      = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>;
    const IconEdit     = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
    const IconNote     = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>;
    const IconTag      = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>;
    const IconPause    = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>;
    const IconPlay     = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>;
    const IconTrash    = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>;
    const IconCheck    = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
    const IconClock    = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;

    const TABS = [
      { key: "details",  label: "Details",    Icon: IconUser },
      { key: "tier",     label: "Tier & Role", Icon: IconTier },
      { key: "activity", label: "Activity",   Icon: IconActivity },
      { key: "actions",  label: "Actions",    Icon: IconActions },
    ];

    return ReactDOM.createPortal(
        <div className="drawer-panel" style={{ position: "fixed", top: 0, right: 0, width: 520, height: "100%", zIndex: 1500, background: T.bg, borderLeft: `1px solid ${T.border}`, boxShadow: "-24px 0 80px rgba(0,0,0,0.5)", display: "flex", flexDirection: "column", overflow: "hidden" }}>

          {/* ── Header ── */}
          <div style={{ padding: "22px 24px 20px", borderBottom: `1px solid ${T.border}`, position: "relative", background: `linear-gradient(160deg, ${badge.color}0a 0%, transparent 60%)` }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${badge.color} 0%, ${badge.color}00 100%)`, borderRadius: "0 0 2px 2px" }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ width: 56, height: 56, borderRadius: 16, background: `linear-gradient(135deg, ${badge.color}22, ${badge.color}08)`, border: `2px solid ${badge.color}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 900, color: badge.color, fontFamily: "'Fraunces',serif", flexShrink: 0 }}>
                  {(u.name || u.email || "?")[0].toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: T.white, fontFamily: "'Fraunces',serif", lineHeight: 1.1, letterSpacing: -0.4, marginBottom: 5 }}>
                    {u.name || "No name"}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 9 }}>
                    <span style={{ fontSize: 12, color: T.textMuted }}>{u.email}</span>
                    <button type="button" onClick={() => copyToClipboard(u.email, "email")} style={{ background: "none", border: "none", cursor: "pointer", color: copiedId === "email" ? T.green : T.textMuted, padding: 0, display: "flex", alignItems: "center" }} title="Copy email">
                      {copiedId === "email" ? <IconCheck /> : <CopyIcon />}
                    </button>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: badge.bg, color: badge.color, border: `1px solid ${badge.color}30` }}>
                      {badge.label}{badge.price ? ` · ${badge.price}` : ""}
                    </span>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20, background: `${health.dot}14`, color: health.dot, border: `1px solid ${health.dot}28`, display: "flex", alignItems: "center", gap: 4 }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: health.dot, flexShrink: 0 }} />{health.label}
                    </span>
                    {job && <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20, background: job.bg, color: job.color, border: `1px solid ${job.color}28` }}>{job.label}</span>}
                    {(u.tags || []).map(tag => { const t = TAGS_OPTIONS.find(x => x.value === tag); return t ? <span key={tag} style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20, background: `${t.color}12`, color: t.color, border: `1px solid ${t.color}28` }}>{t.label}</span> : null; })}
                  </div>
                </div>
              </div>
              <button type="button" onClick={e => { e.stopPropagation(); onClose(); }}
                style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${T.border}`, background: "transparent", color: T.textMuted, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, transition: "all 0.15s", flexShrink: 0 }}
                onMouseEnter={e => { e.currentTarget.style.background = T.surfaceAlt; e.currentTarget.style.color = T.white; }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = T.textMuted; }}>
                ✕
              </button>
            </div>
          </div>

          {/* ── Stats bar — big value, tiny label ── */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", borderBottom: `1px solid ${T.border}`, background: T.surface }}>
            {[
              { label: "Plan",        value: getUserLTV(u),    color: u.tier === "pro" || u.tier === "enterprise" ? T.green : T.textSecondary },
              { label: "Trial",       value: days !== null ? `${days}d left` : u.tier === "pro" ? "Active" : "—", color: days !== null && days <= 3 ? T.red : days !== null ? T.gold : T.textSecondary },
              { label: "Last Active", value: lastActiveLabel(u), color: lastActiveColor(u) },
              { label: "Joined",      value: (() => { try { return new Date(u.createdAt).toLocaleDateString("en", { month: "short", day: "numeric" }); } catch { return "—"; } })(), color: T.white },
            ].map((s, i) => (
              <div key={i} style={{ padding: "14px 8px", textAlign: "center", borderRight: i < 3 ? `1px solid ${T.border}` : "none" }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: s.color, fontFamily: "'Fraunces',serif", lineHeight: 1, letterSpacing: -0.3 }}>{s.value}</div>
                <div style={{ fontSize: 9, color: T.textMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginTop: 6 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* ── Tab nav — pill style, active has solid background ── */}
          <div style={{ display: "flex", background: T.bg, borderBottom: `1px solid ${T.border}`, padding: "6px 8px", gap: 3 }}>
            {TABS.map(({ key, label, Icon }) => (
              <button key={key} type="button" onClick={() => setDrawerTab(key)}
                style={{ flex: 1, padding: "7px 4px", borderRadius: 7, border: drawerTab === key ? `1px solid ${T.border}` : "1px solid transparent", background: drawerTab === key ? T.surface : "transparent", color: drawerTab === key ? T.white : T.textMuted, fontSize: 11, fontWeight: drawerTab === key ? 700 : 500, cursor: "pointer", fontFamily: "'Outfit',sans-serif", transition: "all 0.15s", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
                <span style={{ opacity: drawerTab === key ? 1 : 0.45, transition: "opacity 0.15s" }}><Icon /></span>
                {label}
              </button>
            ))}
          </div>

          {/* ── Tab body ── */}
          <div style={{ padding: "20px 24px", flex: 1, minHeight: 0, overflowY: "auto" }}>

            {/* DETAILS */}
            {drawerTab === "details" && (
              <>
                <div style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 12 }}>Account Details</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 1, borderRadius: 10, overflow: "hidden", border: `1px solid ${T.border}`, marginBottom: 20 }}>
                  {[
                    ["UID",           u.uid || "—",    "uid"],
                    ["Phone",         u.phone || "—",  null],
                    ["Country",       u.country || "—", null],
                    ["Sign-in",       u.provider || "email", null],
                    ["Email Verified", u.emailVerified ? "Verified" : "Not verified", null, u.emailVerified ? T.green : T.red],
                    ["Last Login",    u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString("en-AE", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "Never", null],
                    ["Signed Up",     (() => { try { return new Date(u.createdAt).toLocaleDateString("en", { day: "numeric", month: "long", year: "numeric" }); } catch { return "—"; } })(), null],
                    ["Created By",    u.createdByAdmin ? `Admin (${u.createdByAdmin})` : "Self-signup", null],
                    ["Trial End",     u.trialEnd ? new Date(u.trialEnd).toLocaleDateString("en", { day: "numeric", month: "short", year: "numeric" }) : "—", null],
                  ].map(([label, value, copyKey, valColor], idx, arr) => (
                    <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px 16px", background: "transparent", borderBottom: idx < arr.length - 1 ? `1px solid ${T.border}` : "none", transition: "background 0.1s", cursor: "default" }}
                      onMouseEnter={e => e.currentTarget.style.background = T.surfaceAlt}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                      <span style={{ fontSize: 11, color: T.textMuted, fontWeight: 500, minWidth: 110 }}>{label}</span>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 12, color: valColor || T.white, fontWeight: 600, maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{value}</span>
                        {copyKey && <button type="button" onClick={() => copyToClipboard(u[copyKey], copyKey)} style={{ background: "none", border: "none", cursor: "pointer", color: copiedId === copyKey ? T.green : T.textMuted, padding: 0, display: "flex", alignItems: "center" }} title={`Copy ${label}`}>{copiedId === copyKey ? <IconCheck /> : <CopyIcon />}</button>}
                      </div>
                    </div>
                  ))}
                </div>

                {u.notes && (
                  <div style={{ background: T.surfaceAlt, border: `1px solid ${T.border}`, borderLeft: `3px solid ${T.gold}`, borderRadius: 8, padding: "12px 14px", marginBottom: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <div style={{ fontSize: 10, color: T.gold, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8 }}>Admin Note</div>
                      <button type="button" onClick={() => { setNoteUser(u); setNoteText(u.notes || ""); }} style={{ fontSize: 10, color: T.textMuted, background: "none", border: "none", cursor: "pointer", fontFamily: "'Outfit',sans-serif", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                        <IconEdit /> Edit
                      </button>
                    </div>
                    <div style={{ fontSize: 12, color: T.textSecondary, lineHeight: 1.6 }}>{u.notes}</div>
                  </div>
                )}

                {(u.tags || []).length > 0 && (
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 8 }}>Tags</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {(u.tags || []).map(tag => { const t = TAGS_OPTIONS.find(x => x.value === tag); return t ? <span key={tag} style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 5, background: `${t.color}12`, color: t.color, border: `1px solid ${t.color}25` }}>{t.label}</span> : null; })}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* TIER & ROLE */}
            {drawerTab === "tier" && (
              <>
                <div style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 12 }}>Access Tier</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 24 }}>
                  {BILLING_TIERS.map(r => {
                    const isCurrent = (u.tier || "free") === r.value;
                    return (
                      <button key={r.value} type="button" onClick={() => handleTierChange(u.uid, r.value, u.tier)}
                        style={{ padding: "12px 14px", borderRadius: 10, border: `1.5px solid ${isCurrent ? r.color : T.border}`, background: isCurrent ? `${r.color}10` : "transparent", color: isCurrent ? r.color : T.textSecondary, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit',sans-serif", textAlign: "left", transition: "all 0.15s", position: "relative" }}
                        onMouseEnter={e => { if (!isCurrent) { e.currentTarget.style.borderColor = `${r.color}50`; e.currentTarget.style.color = T.white; }}}
                        onMouseLeave={e => { if (!isCurrent) { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.textSecondary; }}}>
                        <div style={{ fontWeight: 700 }}>{r.label}</div>
                        <div style={{ fontSize: 10, marginTop: 2, opacity: 0.7 }}>{r.price || (r.value === "free" ? "No charge" : r.value === "pro_trial" ? "Limited time" : "")}</div>
                        {isCurrent && <div style={{ position: "absolute", top: 10, right: 12, color: r.color }}><IconCheck /></div>}
                      </button>
                    );
                  })}
                </div>

                <div style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 12 }}>Job Role</div>
                <select value={u.role || "user"} onChange={e => handleJobRoleChange(u.uid, e.target.value)} style={{ ...inputStyle, cursor: "pointer", marginBottom: 16 }}>
                  <option value="user">— No role assigned —</option>
                  {JOB_ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>

                <div style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 12 }}>Extend Trial</div>
                <div style={{ display: "flex", gap: 8 }}>
                  {[7, 14, 30].map(d => (
                    <button key={d} type="button" onClick={() => confirmAndExtend(u, d)}
                      style={{ flex: 1, padding: "10px", borderRadius: 8, border: `1px solid ${T.border}`, background: "transparent", color: T.textSecondary, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit',sans-serif", transition: "all 0.15s", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = T.green; e.currentTarget.style.color = T.green; e.currentTarget.style.background = "rgba(16,185,129,0.05)"; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.textSecondary; e.currentTarget.style.background = "transparent"; }}>
                      <IconClock /> +{d} days
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* ACTIVITY */}
            {drawerTab === "activity" && (
              <>
                {(u.loginHistory || []).length > 0 ? (
                  <div style={{ marginBottom: 24 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 12 }}>Login History</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 1, borderRadius: 10, overflow: "hidden", border: `1px solid ${T.border}` }}>
                      {(u.loginHistory || []).slice(0, 8).map((h, i) => (
                        <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: i === 0 ? "rgba(16,185,129,0.04)" : i % 2 === 0 ? T.surfaceAlt : T.surface, borderBottom: i < Math.min(7, (u.loginHistory||[]).length - 1) ? `1px solid ${T.border}` : "none" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{ width: 28, height: 28, borderRadius: 7, background: T.surfaceAlt, border: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "center", color: i === 0 ? T.green : T.textMuted }}>
                              {h.device === "Mobile" ?
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg> :
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
                              }
                            </div>
                            <div>
                              <div style={{ fontSize: 12, color: i === 0 ? T.white : T.textSecondary, fontWeight: i === 0 ? 600 : 400 }}>{h.browser || "Browser"} · {h.device || "Desktop"}</div>
                              {i === 0 && <div style={{ fontSize: 9, color: T.green, fontWeight: 700, marginTop: 1, textTransform: "uppercase", letterSpacing: 0.5 }}>Most recent</div>}
                            </div>
                          </div>
                          <span style={{ fontSize: 11, color: T.textMuted }}>{(() => { try { return new Date(h.time).toLocaleDateString("en-AE", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }); } catch { return "—"; } })()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: "center", padding: "40px 0" }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: T.surfaceAlt, border: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", color: T.textMuted }}>
                      <IconActivity />
                    </div>
                    <div style={{ fontSize: 13, color: T.textSecondary, fontWeight: 600 }}>No login history yet</div>
                    <div style={{ fontSize: 11, color: T.textMuted, marginTop: 4 }}>Recorded after next login.</div>
                  </div>
                )}

                {(u.recentActivity || []).length > 0 && (
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 12 }}>Tab Activity</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 0, position: "relative", paddingLeft: 20 }}>
                      <div style={{ position: "absolute", left: 7, top: 8, bottom: 8, width: 1, background: T.border }} />
                      {(u.recentActivity || []).slice(0, 10).map((a, i) => (
                        <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 10px 7px 0", position: "relative" }}>
                          <div style={{ position: "absolute", left: -14, width: 7, height: 7, borderRadius: "50%", background: i === 0 ? T.gold : T.border, border: `2px solid ${T.bg}` }} />
                          <span style={{ fontSize: 12, color: i === 0 ? T.white : T.textSecondary, fontWeight: i === 0 ? 600 : 400 }}>{a.tab}</span>
                          <span style={{ fontSize: 10, color: T.textMuted }}>{(() => { try { return timeSince(a.time); } catch { return "—"; } })()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ACTIONS */}
            {drawerTab === "actions" && (
              <>
                {/* Communication */}
                <div style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 10 }}>Communication</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 24 }}>
                  {[
                    { label: "Send Notification", Icon: IconBell,  color: "#F59E0B", action: () => setNotifUser(u) },
                    { label: "Send Email",         Icon: IconMail,  color: "#3B82F6", action: () => { setSendEmailUser(u); setEmailSubject(""); setEmailBody(""); } },
                    { label: "Send Password Reset",Icon: IconKey,   color: T.textSecondary, action: () => { sendResetEmail(u.email); notify(`Password reset sent to ${u.email}`); } },
                  ].map(btn => (
                    <button key={btn.label} type="button" onClick={btn.action}
                      style={{ padding: "10px 14px", borderRadius: 8, border: `1px solid ${T.border}`, background: "transparent", color: T.textSecondary, fontSize: 12, fontWeight: 500, cursor: "pointer", fontFamily: "'Outfit',sans-serif", textAlign: "left", transition: "all 0.15s", display: "flex", alignItems: "center", gap: 10 }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = `${btn.color}50`; e.currentTarget.style.color = btn.color; e.currentTarget.style.background = `${btn.color}06`; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.textSecondary; e.currentTarget.style.background = "transparent"; }}>
                      <span style={{ opacity: 0.7 }}><btn.Icon /></span>
                      {btn.label}
                    </button>
                  ))}
                </div>

                {/* Account */}
                <div style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 10 }}>Account</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 24 }}>
                  {[
                    { label: "Edit User Details", Icon: IconEdit, color: T.teal,    action: () => { openEditUser(u); onClose(); } },
                    { label: "Add / Edit Note",   Icon: IconNote, color: T.gold,    action: () => { setNoteUser(u); setNoteText(u.notes || ""); } },
                    { label: "Manage Tags",        Icon: IconTag,  color: "#8B5CF6", action: () => setTagUser(u) },
                  ].map(btn => (
                    <button key={btn.label} type="button" onClick={btn.action}
                      style={{ padding: "10px 14px", borderRadius: 8, border: `1px solid ${T.border}`, background: "transparent", color: T.textSecondary, fontSize: 12, fontWeight: 500, cursor: "pointer", fontFamily: "'Outfit',sans-serif", textAlign: "left", transition: "all 0.15s", display: "flex", alignItems: "center", gap: 10 }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = `${btn.color}50`; e.currentTarget.style.color = btn.color; e.currentTarget.style.background = `${btn.color}06`; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.textSecondary; e.currentTarget.style.background = "transparent"; }}>
                      <span style={{ opacity: 0.7 }}><btn.Icon /></span>
                      {btn.label}
                    </button>
                  ))}
                </div>

                {/* Danger Zone */}
                <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 20 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: T.red, textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 10, opacity: 0.8 }}>Danger Zone</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <button type="button" onClick={() => setConfirmSuspend(u)}
                      style={{ padding: "10px 14px", borderRadius: 8, border: `1px solid ${T.border}`, background: "transparent", color: T.textSecondary, fontSize: 12, fontWeight: 500, cursor: "pointer", fontFamily: "'Outfit',sans-serif", textAlign: "left", transition: "all 0.15s", display: "flex", alignItems: "center", gap: 10 }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = "#F59E0B50"; e.currentTarget.style.color = "#F59E0B"; e.currentTarget.style.background = "rgba(245,158,11,0.05)"; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.textSecondary; e.currentTarget.style.background = "transparent"; }}>
                      {u.suspended ? <IconPlay /> : <IconPause />}
                      {u.suspended ? "Unsuspend User" : "Suspend User"}
                    </button>
                    <button type="button" onClick={() => { onClose(); setConfirmDelete(u); }}
                      style={{ padding: "10px 14px", borderRadius: 8, border: `1px solid ${T.red}30`, background: "rgba(239,68,68,0.04)", color: T.red, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit',sans-serif", textAlign: "left", transition: "all 0.15s", display: "flex", alignItems: "center", gap: 10 }}
                      onMouseEnter={e => { e.currentTarget.style.background = "rgba(239,68,68,0.08)"; }}
                      onMouseLeave={e => { e.currentTarget.style.background = "rgba(239,68,68,0.04)"; }}>
                      <IconTrash />
                      Delete User Permanently
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      , document.body
    );
};

function UsersTab({ users, filteredUsers, fetchUsers, changeTier, deleteUser, suspendUser, sendResetEmail, extendTrial, openEditUser, saveEditUser, editingUser, setEditingUser, editUserForm, setEditUserForm, editUserLoading, showAddUser, setShowAddUser, addUserForm, setAddUserForm, addUserManually, addUserLoading, exportCSV, userSearch, setUserSearch, tierFilter, setTierFilter, notify, db, T, I, trialDaysLeft, timeSince, pendingOpenUid, setPendingOpenUid, onDrawerChange }) {

  /* ─── STATE ─── */
  const [drawerUser,         setDrawerUser]         = useState(null);
  const [bulkSel,            setBulkSel]            = useState([]);
  const [bulkTier,           setBulkTier]           = useState("");
  const [sendEmailUser,      setSendEmailUser]       = useState(null);
  const [emailSubject,       setEmailSubject]        = useState("");
  const [emailBody,          setEmailBody]           = useState("");
  const [emailSending,       setEmailSending]        = useState(false);
  const [noteUser,           setNoteUser]            = useState(null);
  const [noteText,           setNoteText]            = useState("");
  const [confirmDelete,      setConfirmDelete]       = useState(null);
  const [confirmSuspend,     setConfirmSuspend]      = useState(null);
  const [confirmExtend,      setConfirmExtend]       = useState(null); // { user, days }
  const [sortField,          setSortField]           = useState("newest");
  const [sortDir,            setSortDir]             = useState("desc");
  const [page,               setPage]               = useState(1);
  const [tagUser,            setTagUser]             = useState(null);
  const [hoverRow,           setHoverRow]            = useState(null);
  const [inlineTierUser,     setInlineTierUser]      = useState(null);
  const [showFilters,        setShowFilters]         = useState(false);
  const [filterCountry,      setFilterCountry]       = useState("");
  const [filterRole,         setFilterRole]          = useState("");   // FIX #27
  const [focusedRow,         setFocusedRow]          = useState(0);
  const [sendingTrialEmails, setSendingTrialEmails]  = useState(false);
  const [notifUser,          setNotifUser]           = useState(null);
  const [notifTitle,         setNotifTitle]          = useState("");
  const [notifMessage,       setNotifMessage]        = useState("");
  const [notifIcon,          setNotifIcon]           = useState("bell");
  const [notifSendingUser,   setNotifSendingUser]    = useState(false);
  const [loadingUsers,       setLoadingUsers]        = useState(false); // FIX #30
  const [copiedId,           setCopiedId]            = useState(null);  // FIX #36
  const [drawerTab,          setDrawerTab]           = useState("details"); // drawer sub-nav

  const PAGE_SIZE    = 25;
  const AT_RISK_DAYS = 3; // FIX #6 — single source of truth
  const now          = new Date();

  /* ─── REFS for keyboard nav ─── */
  const pagedUsersRef = React.useRef([]);
  const focusedRowRef = React.useRef(0);
  focusedRowRef.current = focusedRow;

  // Notify parent when drawer opens/closes (for push layout effect)
  const setDrawerUserWithCallback = (u) => {
    setDrawerUserWithCallback(u);
    if (onDrawerChange) onDrawerChange(!!u);
  };

  // Open drawer from external trigger (e.g. Overview activity feed click)
  useEffect(() => {
    if (pendingOpenUid && users.length > 0) {
      const u = users.find(x => x.uid === pendingOpenUid);
      if (u) { setDrawerUserWithCallback(u); setDrawerTab("details"); }
      setPendingOpenUid(null);
    }
  }, [pendingOpenUid, users]);

  /* ─── KEYBOARD NAVIGATION ─── */
  useEffect(() => {
    const handler = (e) => {
      const anyModalOpen = sendEmailUser || noteUser || confirmDelete || confirmSuspend ||
        confirmExtend || tagUser || editingUser || showAddUser || notifUser;
      if (anyModalOpen) return;
      const list = pagedUsersRef.current;
      if (e.key === "j" || e.key === "ArrowDown") { e.preventDefault(); setFocusedRow(r => Math.min(r + 1, list.length - 1)); }
      if (e.key === "k" || e.key === "ArrowUp")   { e.preventDefault(); setFocusedRow(r => Math.max(r - 1, 0)); }
      if (e.key === "Enter" || e.key === "v") { const u = list[focusedRowRef.current]; if (u) { setDrawerUserWithCallback(u); setDrawerTab("details"); } }
      if (e.key === "e") { const u = list[focusedRowRef.current]; if (u) openEditUser(u); }
      if (e.key === "n" || e.key === "N") { setShowAddUser(true); }  // FIX #31
      if (e.key === "Escape") { setDrawerUserWithCallback(null); setInlineTierUser(null); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [sendEmailUser, noteUser, confirmDelete, confirmSuspend, confirmExtend, tagUser, editingUser, showAddUser, notifUser]);

  /* ─── ICONS ─── */
  const EditIcon = () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  );

  const SortIcon = ({ active, dir }) => (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={active ? T.gold : T.textMuted} strokeWidth="2.5" strokeLinecap="round">
      {dir === "asc" || !active ? <polyline points="18 15 12 9 6 15"/> : <polyline points="6 9 12 15 18 9"/>}
    </svg>
  );

  /* ─── FIX #11: Separate billing tiers from job roles ─── */
  const BILLING_TIERS = [
    { value: "free",       label: "Free",       color: "#64748B", bg: "rgba(100,116,139,0.12)", price: "" },
    { value: "pro_trial",  label: "Pro Trial",  color: "#D4A843", bg: "rgba(212,168,67,0.12)",  price: "" },
    { value: "pro",        label: "Pro",        color: "#10B981", bg: "rgba(16,185,129,0.12)",  price: "AED 99" },
    { value: "enterprise", label: "Enterprise", color: "#06B6D4", bg: "rgba(6,182,212,0.12)",   price: "AED 499" },
  ];
  const JOB_ROLES = [
    { value: "agent",            label: "Real Estate Agent", color: "#3B82F6", bg: "rgba(59,130,246,0.12)" },
    { value: "sales_manager",    label: "Sales Manager",     color: "#8B5CF6", bg: "rgba(139,92,246,0.12)" },
    { value: "broker",           label: "Broker",            color: "#F59E0B", bg: "rgba(245,158,11,0.12)" },
    { value: "property_manager", label: "Property Manager",  color: "#14B8A6", bg: "rgba(20,184,166,0.12)" },
    { value: "investor",         label: "Investor",          color: "#10B981", bg: "rgba(16,185,129,0.12)" },
    { value: "developer",        label: "Developer",         color: "#EC4899", bg: "rgba(236,72,153,0.12)" },
    { value: "staff",            label: "Platform Staff",    color: "#94A3B8", bg: "rgba(148,163,184,0.12)" },
    { value: "admin",            label: "Admin",             color: "#D4A843", bg: "rgba(212,168,67,0.2)" },
  ];

  /* ─── FIX #12: Tags = labels only, no overlap with roles ─── */
  const TAGS_OPTIONS = [
    { value: "vip",      label: "⭐ VIP",        color: "#F59E0B" },
    { value: "hot_lead", label: "Hot Lead",    color: "#EF4444" },
    { value: "followup", label: "Follow-up",   color: "#3B82F6" },
    { value: "churning", label: "Churning",    color: "#F97316" },
    { value: "referral", label: "Referral",    color: "#8B5CF6" },
    { value: "partner",  label: "Partner",     color: "#06B6D4" },
  ];

  /* ─── FIX #9+10: Single, clean getRoleBadge ─── */
  const getTierBadge = (u) => {
    const expired = u.tier === "pro_trial" && u.trialEnd && new Date(u.trialEnd) <= now;
    if (expired) return { value: "expired", label: "Expired", color: T.red, bg: "rgba(239,68,68,0.12)", price: "" };
    return BILLING_TIERS.find(r => r.value === (u.tier || "free")) || BILLING_TIERS[0];
  };
  const getJobRoleBadge = (u) => {
    if (!u.role || u.role === "user") return null;
    return JOB_ROLES.find(r => r.value === u.role) || null;
  };

  const getHealth = (u) => {
    if (u.suspended) return { label: "Suspended", color: T.red, dot: "#EF4444", border: "#EF4444" };
    if (u.tier === "enterprise") return { label: "Healthy",  color: T.green,  dot: "#10B981", border: "#10B981" };
    if (u.tier === "pro")        return { label: "Active",   color: T.green,  dot: "#10B981", border: "#10B981" };
    if (u.tier === "pro_trial") {
      const days = trialDaysLeft(u);
      if (days <= 0)             return { label: "Expired",  color: T.red,    dot: "#EF4444", border: "#EF4444" };
      if (days <= AT_RISK_DAYS)  return { label: "At Risk",  color: T.red,    dot: "#EF4444", border: "#EF4444" };
      if (days <= 5)             return { label: "Expiring", color: "#F59E0B", dot: "#F59E0B", border: "#F59E0B" };
      return                            { label: "Trial",    color: T.gold,   dot: "#D4A843", border: "#D4A843" };
    }
    return { label: "Free", color: T.textMuted, dot: "#475569", border: "transparent" };
  };

  /* FIX #23: User's own revenue, not global */
  const getUserLTV = (u) => {
    if (u.tier === "enterprise") return "AED 499/mo";
    if (u.tier === "pro")        return "AED 99/mo";
    if (u.tier === "pro_trial")  return "Trial";
    return "Free";
  };

  const lastActiveLabel = (u) => (!u.lastLoginAt ? "Never" : timeSince(u.lastLoginAt));
  const lastActiveColor = (u) => {
    if (!u.lastLoginAt) return T.textMuted;
    const h = (now - new Date(u.lastLoginAt)) / 3600000;
    return h < 24 ? T.green : h < 72 ? T.gold : T.textMuted;
  };

  /* ─── STATS — FIX #2, #6 ─── */
  const total       = users.length;
  const paid        = users.filter(u => u.tier === "pro" || u.tier === "enterprise").length; // FIX #2
  const trial       = users.filter(u => u.tier === "pro_trial" && u.trialEnd && new Date(u.trialEnd) > now).length;
  const free        = users.filter(u => !u.tier || u.tier === "free").length;
  const atRisk      = users.filter(u => { const d = trialDaysLeft(u); return d !== null && d <= AT_RISK_DAYS && d >= 0; }); // FIX #6
  const atRiskCount = atRisk.length;
  const mrr         = users.filter(u => u.tier === "pro").length * 99 + users.filter(u => u.tier === "enterprise").length * 499;
  const convRate    = total > 0 ? ((paid / total) * 100).toFixed(1) : "0.0";
  const suspended   = users.filter(u => u.suspended).length;
  const activeToday = users.filter(u => u.lastLoginAt && (now - new Date(u.lastLoginAt)) < 86400000).length;

  /* ─── FILTERING + SORTING — FIX #1, #3, #27 ─── */
  const allFiltered = users
    .filter(u => {
      const q = userSearch.toLowerCase();
      const matchSearch = !userSearch ||
        (u.name || "").toLowerCase().includes(q) ||
        (u.email || "").toLowerCase().includes(q) ||
        (u.phone || "").toLowerCase().includes(q) ||
        (u.notes || "").toLowerCase().includes(q) ||
        (u.country || "").toLowerCase().includes(q) ||
        (u.role || "").toLowerCase().includes(q) ||
        (u.tags || []).some(t => t.toLowerCase().includes(q));

      // FIX #1 & #3: AtRisk is its own filter
      let matchTier = true;
      if      (tierFilter === "Free")       matchTier = u.tier === "free" || !u.tier;
      else if (tierFilter === "Pro Trial")  matchTier = u.tier === "pro_trial" && (!u.trialEnd || new Date(u.trialEnd) > now);
      else if (tierFilter === "Pro")        matchTier = u.tier === "pro" || u.tier === "enterprise"; // FIX #2
      else if (tierFilter === "Enterprise") matchTier = u.tier === "enterprise";
      else if (tierFilter === "Expired")    matchTier = u.tier === "pro_trial" && u.trialEnd && new Date(u.trialEnd) <= now;
      else if (tierFilter === "Suspended")  matchTier = !!u.suspended;
      else if (tierFilter === "AtRisk")     matchTier = (() => { const d = trialDaysLeft(u); return d !== null && d <= AT_RISK_DAYS && d >= 0; })(); // FIX #1

      const matchCountry = !filterCountry || (u.country || "").toLowerCase().includes(filterCountry.toLowerCase());
      const matchRole    = !filterRole    || (u.role || "") === filterRole; // FIX #27

      return matchSearch && matchTier && matchCountry && matchRole;
    })
    .sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      if (sortField === "newest")     return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      if (sortField === "oldest")     return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
      if (sortField === "name")       return dir * (a.name || "").localeCompare(b.name || "");
      if (sortField === "tier")       return dir * (a.tier || "").localeCompare(b.tier || "");
      if (sortField === "trial")      return dir * ((trialDaysLeft(a) ?? 999) - (trialDaysLeft(b) ?? 999));
      if (sortField === "lastActive") return dir * (new Date(a.lastLoginAt || 0) - new Date(b.lastLoginAt || 0));
      return 0;
    });

  const totalPages  = Math.max(1, Math.ceil(allFiltered.length / PAGE_SIZE));
  const pagedUsers  = allFiltered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  pagedUsersRef.current = pagedUsers;

  const handleSort = (field) => {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("desc"); }
    setPage(1);
  };

  const activeFilterCount = [filterCountry, filterRole, sortField !== "newest" ? "sort" : ""].filter(Boolean).length; // FIX #32

  /* ─── TRIAL EXPIRY EMAILS — FIX #6 consistent threshold ─── */
  const sendTrialExpiryEmails = async () => {
    setSendingTrialEmails(true);
    let sent = 0;
    for (const u of atRisk) {
      const days = trialDaysLeft(u);
      try {
        await emailjs.send("service_da7nshv", "template_gl1xqhy", {
          user_email:   u.email,
          user_name:    u.name || u.email,
          project_name: "DXB Analytics Platform",
          change_type:  days === 0 ? "⏰ Your Trial Has Expired" : `⚠️ Trial Expiring in ${days} Day${days !== 1 ? "s" : ""}`,
          new_value:    days === 0
            ? "Your 7-day trial has ended. Upgrade now to keep full access."
            : `Only ${days} day${days !== 1 ? "s" : ""} left on your free trial. Upgrade before you lose access.`,
          old_value:    "Pro Trial",
          updated_at:   new Date().toLocaleString("en-AE"),
        }, "USkwUhp0csGCVDkdQ");
        sent++;
      } catch(e) {}
    }
    setSendingTrialEmails(false);
    notify(sent > 0 ? `✅ Sent ${sent} trial expiry email${sent > 1 ? "s" : ""}` : "ℹ️ No at-risk trials to email");
  };

  /* ─── ACTIONS ─── */
  const handleBulkAction = async () => {
    if (!bulkTier || bulkSel.length === 0) return;
    for (const uid of bulkSel) await changeTier(uid, bulkTier);
    try {
      const { setDoc: sd, doc: dc } = await import("firebase/firestore");
      await sd(dc(db, "auditLog", Date.now().toString()), {
        action: "bulk_tier_change", uids: bulkSel, newTier: bulkTier,
        changedBy: "admin", changedAt: new Date().toISOString(),
      });
    } catch(e) {}
    setBulkSel([]); setBulkTier("");
    notify(`Updated ${bulkSel.length} users to ${bulkTier}`);
  };

  const handleTierChange = async (uid, newTier, oldTier) => {
    await changeTier(uid, newTier);
    try {
      const { setDoc: sd, doc: dc } = await import("firebase/firestore");
      await sd(dc(db, "auditLog", Date.now().toString()), {
        action: "tier_change", uid, from: oldTier, to: newTier,
        changedBy: "admin", changedAt: new Date().toISOString(),
      });
    } catch(e) {}
    setDrawerUser(prev => prev?.uid === uid ? { ...prev, tier: newTier } : prev);
    setInlineTierUser(null);
  };

  const handleJobRoleChange = async (uid, newRole) => {
    try {
      const { setDoc: sd, doc: dc } = await import("firebase/firestore");
      await sd(dc(db, "users", uid), { role: newRole }, { merge: true });
      await sd(dc(db, "auditLog", Date.now().toString()), {
        action: "role_change", uid, to: newRole, changedBy: "admin", changedAt: new Date().toISOString(),
      });
      setDrawerUser(prev => prev?.uid === uid ? { ...prev, role: newRole } : prev);
      fetchUsers();
      notify(`Role updated`);
    } catch(e) { notify("Error: " + e.message); }
  };

  const handleSendEmail = async () => {
    if (!emailSubject || !emailBody) { notify("Error: Subject and message required"); return; }
    setEmailSending(true);
    try {
      // FIX #15: correct EmailJS template field names
      await emailjs.send("service_da7nshv", "template_gl1xqhy", {
        user_email:   sendEmailUser.email,
        user_name:    sendEmailUser.name || sendEmailUser.email,
        project_name: "DXB Analytics",
        change_type:  emailSubject,
        new_value:    emailBody,
        old_value:    "",
        updated_at:   new Date().toLocaleString("en-AE"),
      }, "USkwUhp0csGCVDkdQ");
      notify(`Email sent to ${sendEmailUser.email}`);
      setSendEmailUser(null); setEmailSubject(""); setEmailBody("");
    } catch(e) { notify("Error: Email failed — check EmailJS config"); }
    setEmailSending(false);
  };

  const saveNote = async () => {
    if (!noteUser) return;
    try {
      const { setDoc: sd, doc: dc } = await import("firebase/firestore");
      await sd(dc(db, "users", noteUser.uid), { notes: noteText, noteUpdatedAt: new Date().toISOString() }, { merge: true });
      notify("Note saved");
      setNoteUser(null); setNoteText("");
      fetchUsers();
    } catch(e) { notify("Error: Failed to save note"); }
  };

  const saveTag = async (uid, tags) => {
    try {
      const { setDoc: sd, doc: dc } = await import("firebase/firestore");
      await sd(dc(db, "users", uid), { tags }, { merge: true });
      notify("Tags updated"); fetchUsers();
    } catch(e) { notify("Error: Failed to save tags"); }
  };

  // FIX #13: also call fetchUsers after delete
  const handleDelete = async () => {
    if (!confirmDelete) return;
    await deleteUser(confirmDelete.uid);
    fetchUsers();
    setConfirmDelete(null);
    if (drawerUser?.uid === confirmDelete.uid) setDrawerUserWithCallback(null);
  };

  const handleSuspend = async () => {
    if (!confirmSuspend) return;
    await suspendUser(confirmSuspend.uid);
    setConfirmSuspend(null);
    if (drawerUser?.uid === confirmSuspend.uid) setDrawerUserWithCallback(null);
  };

  // FIX #28: confirm before extending trial
  const confirmAndExtend = (u, days) => setConfirmExtend({ user: u, days });
  const handleExtend = async () => {
    if (!confirmExtend) return;
    await extendTrial(confirmExtend.user.uid, confirmExtend.days);
    notify(`Extended trial by ${confirmExtend.days} days`);
    setConfirmExtend(null);
  };

  const sendDirectNotification = async () => {
    if (!notifTitle || !notifMessage) { notify("Error: Title and message required"); return; }
    setNotifSendingUser(true);
    try {
      const { setDoc: sd, doc: dc } = await import("firebase/firestore");
      const id = `notif_${Date.now()}`;
      await sd(dc(db, "notifications", id), {
        userId: notifUser.uid, title: notifTitle, message: notifMessage,
        icon: notifIcon, read: false, createdAt: new Date().toISOString(), sentBy: "admin",
      });
      // FIX #34: log who received it
      notify(`Notification sent to ${notifUser.name || notifUser.email}`);
      setNotifUser(null); setNotifTitle(""); setNotifMessage(""); setNotifIcon("bell");
    } catch(e) { notify("Error: " + e.message); }
    setNotifSendingUser(false);
  };

  // FIX #36: copy to clipboard helper
  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    });
  };

  const exportFiltered = () => {
    const headers = "Name,Email,Tier,Role,Trial Status,Tags,Country,Last Active,Signed Up\n";
    const rows = allFiltered.map(u =>
      `"${u.name || ""}","${u.email || ""}","${u.tier || "free"}","${u.role || ""}","${u.trialEnd ? (new Date(u.trialEnd) > now ? "Active" : "Expired") : "—"}","${(u.tags || []).join("; ")}","${u.country || ""}","${u.lastLoginAt || ""}","${u.createdAt || ""}"`
    ).join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = `dxb-users-${new Date().toISOString().slice(0,10)}.csv`; a.click();
    notify(`Exported ${allFiltered.length} users`);
  };

  /* ─── SHARED STYLE HELPERS ─── */
  const inputStyle = { width: "100%", padding: "10px 12px", background: T.bg, border: "1px solid rgba(212,168,67,0.15)", borderRadius: 9, color: T.textPrimary, fontSize: 13, fontFamily: "'Outfit',sans-serif", outline: "none", boxSizing: "border-box", transition: "border-color 0.2s" };
  const focusIn  = e => e.target.style.borderColor = T.gold;
  const focusOut = e => e.target.style.borderColor = "rgba(212,168,67,0.15)";

  const Modal = ({ children, maxWidth = 500, onClose }) => (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={onClose}>
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 20, padding: 28, width: "100%", maxWidth, maxHeight: "90vh", overflowY: "auto", animation: "slideUp 0.2s ease-out" }} onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );

  const ModalHeader = ({ title, sub, onClose }) => (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 22 }}>
      <div>
        <div style={{ fontFamily: "'Fraunces',serif", fontSize: 18, fontWeight: 700, color: T.gold }}>{title}</div>
        {sub && <div style={{ fontSize: 12, color: T.textMuted, marginTop: 3 }}>{sub}</div>}
      </div>
      <button type="button" onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${T.border}`, background: T.surfaceAlt, color: T.textMuted, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>✕</button>
    </div>
  );

  const Field = ({ label, children, hint }) => (
    <div>
      <label style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 6 }}>{label}{hint && <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0, marginLeft: 6 }}>{hint}</span>}</label>
      {children}
    </div>
  );

  const Btn      = ({ onClick, color, children, disabled, style = {} }) => (
    <button type="button" onClick={onClick} disabled={disabled} style={{ padding: "10px 20px", borderRadius: 9, border: "none", background: color, color: "#fff", fontSize: 13, fontWeight: 700, cursor: disabled ? "not-allowed" : "pointer", fontFamily: "'Outfit',sans-serif", opacity: disabled ? 0.6 : 1, ...style }}>{children}</button>
  );
  const BtnGhost = ({ onClick, children, style = {} }) => (
    <button type="button" onClick={onClick} style={{ padding: "10px 20px", borderRadius: 9, border: `1px solid ${T.border}`, background: "transparent", color: T.textSecondary, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit',sans-serif", ...style }}>{children}</button>
  );
  const ColHeader = ({ label, field }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 4, cursor: field ? "pointer" : "default", userSelect: "none" }} onClick={() => field && handleSort(field)}>
      <span style={{ fontSize: 9, fontWeight: 700, color: sortField === field ? T.gold : T.textMuted, letterSpacing: 1, textTransform: "uppercase" }}>{label}</span>
      {field && <SortIcon active={sortField === field} dir={sortDir} />}
    </div>
  );

  /* ══════════════════════════════════════════════
     MODALS
  ══════════════════════════════════════════════ */

  const DeleteConfirmModal = () => confirmDelete && (
    <Modal onClose={() => setConfirmDelete(null)} maxWidth={420}>
      <div style={{ textAlign: "center", padding: "8px 0 16px" }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", color: "#EF4444" }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></div>
        <div style={{ fontFamily: "'Fraunces',serif", fontSize: 20, fontWeight: 700, color: T.red, marginBottom: 8 }}>Delete User?</div>
        <div style={{ fontSize: 13, color: T.textSecondary, marginBottom: 6 }}><strong style={{ color: T.white }}>{confirmDelete.name || confirmDelete.email}</strong></div>
        <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 20, padding: "10px 16px", background: "rgba(239,68,68,0.06)", borderRadius: 10, border: "1px solid rgba(239,68,68,0.15)", lineHeight: 1.6 }}>
          Permanently removes them from Firestore and revokes all access.
          {confirmDelete.tier === "pro"        && <><br /><span style={{ color: T.red, fontWeight: 700 }}>⚠️ Active Pro subscription (AED 99/mo) will be cancelled.</span></>}
          {confirmDelete.tier === "enterprise" && <><br /><span style={{ color: T.red, fontWeight: 700 }}>⚠️ Active Enterprise account (AED 499/mo) will be cancelled.</span></>}
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <BtnGhost onClick={() => setConfirmDelete(null)} style={{ flex: 1 }}>Cancel</BtnGhost>
          <Btn onClick={handleDelete} color={T.red} style={{ flex: 1 }}>Delete Permanently</Btn>
        </div>
      </div>
    </Modal>
  );

  const SuspendConfirmModal = () => confirmSuspend && (
    <Modal onClose={() => setConfirmSuspend(null)} maxWidth={420}>
      <div style={{ textAlign: "center", padding: "8px 0 16px" }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: confirmSuspend?.suspended ? "rgba(16,185,129,0.08)" : "rgba(245,158,11,0.08)", border: "1px solid", borderColor: confirmSuspend?.suspended ? "rgba(16,185,129,0.2)" : "rgba(245,158,11,0.2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", color: confirmSuspend?.suspended ? "#10B981" : "#F59E0B" }}>{confirmSuspend?.suspended ? <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg> : "⏸"}</div>
        <div style={{ fontFamily: "'Fraunces',serif", fontSize: 20, fontWeight: 700, color: confirmSuspend.suspended ? T.green : "#F59E0B", marginBottom: 8 }}>
          {confirmSuspend.suspended ? "Unsuspend User?" : "Suspend User?"}
        </div>
        <div style={{ fontSize: 13, color: T.textSecondary, marginBottom: 20 }}>
          <strong style={{ color: T.white }}>{confirmSuspend.name || confirmSuspend.email}</strong><br />
          <span style={{ fontSize: 12, color: T.textMuted }}>{confirmSuspend.suspended ? "They will immediately regain full dashboard access." : "They will be blocked from the dashboard immediately."}</span>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <BtnGhost onClick={() => setConfirmSuspend(null)} style={{ flex: 1 }}>Cancel</BtnGhost>
          <Btn onClick={handleSuspend} color={confirmSuspend.suspended ? T.green : "#F59E0B"} style={{ flex: 1 }}>{confirmSuspend.suspended ? "Unsuspend" : "Suspend"}</Btn>
        </div>
      </div>
    </Modal>
  );

  /* FIX #28: Extend trial confirmation */
  const ExtendConfirmModal = () => confirmExtend && (
    <Modal onClose={() => setConfirmExtend(null)} maxWidth={400}>
      <div style={{ textAlign: "center", padding: "8px 0 16px" }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>⏱️</div>
        <div style={{ fontFamily: "'Fraunces',serif", fontSize: 20, fontWeight: 700, color: T.green, marginBottom: 8 }}>Extend Trial?</div>
        <div style={{ fontSize: 13, color: T.textSecondary, marginBottom: 6 }}>
          Add <strong style={{ color: T.white }}>{confirmExtend.days} days</strong> to <strong style={{ color: T.white }}>{confirmExtend.user.name || confirmExtend.user.email}</strong>'s trial
        </div>
        <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 20 }}>This cannot be undone without manually editing the trial end date.</div>
        <div style={{ display: "flex", gap: 10 }}>
          <BtnGhost onClick={() => setConfirmExtend(null)} style={{ flex: 1 }}>Cancel</BtnGhost>
          <Btn onClick={handleExtend} color={T.green} style={{ flex: 1 }}>+{confirmExtend.days} Days</Btn>
        </div>
      </div>
    </Modal>
  );

  const EmailModal = () => sendEmailUser && (
    <Modal onClose={() => setSendEmailUser(null)}>
      <ModalHeader title="Send Email" sub={`To: ${sendEmailUser.name || sendEmailUser.email} · ${sendEmailUser.email}`} onClose={() => setSendEmailUser(null)} />
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <Field label="Subject"><input type="text" placeholder="Email subject..." value={emailSubject} onChange={e => setEmailSubject(e.target.value)} style={inputStyle} onFocus={focusIn} onBlur={focusOut} /></Field>
        <Field label="Message"><textarea placeholder="Write your message..." value={emailBody} onChange={e => setEmailBody(e.target.value)} rows={5} style={{ ...inputStyle, resize: "vertical" }} onFocus={focusIn} onBlur={focusOut} /></Field>
        <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
          <BtnGhost onClick={() => setSendEmailUser(null)} style={{ flex: 1 }}>Cancel</BtnGhost>
          <Btn onClick={handleSendEmail} disabled={emailSending} color={T.gold} style={{ flex: 2, color: T.bg }}>{emailSending ? "Sending..." : "Send Email"}</Btn>
        </div>
      </div>
    </Modal>
  );

  const NoteModal = () => noteUser && (
    <Modal onClose={() => setNoteUser(null)} maxWidth={440}>
      <ModalHeader title={`Note — ${noteUser.name || noteUser.email}`} onClose={() => setNoteUser(null)} />
      <textarea placeholder="Add internal admin notes..." value={noteText} onChange={e => setNoteText(e.target.value)} rows={5} style={{ ...inputStyle, resize: "vertical", marginBottom: 16 }} onFocus={focusIn} onBlur={focusOut} />
      <div style={{ display: "flex", gap: 10 }}>
        <BtnGhost onClick={() => setNoteUser(null)} style={{ flex: 1 }}>Cancel</BtnGhost>
        <Btn onClick={saveNote} color={T.gold} style={{ flex: 2, color: T.bg }}>Save Note</Btn>
      </div>
    </Modal>
  );

  const TagsModal = () => tagUser && (
    <Modal onClose={() => setTagUser(null)} maxWidth={400}>
      <ModalHeader title={`Tags — ${tagUser.name || tagUser.email}`} onClose={() => setTagUser(null)} />
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
        {TAGS_OPTIONS.map(tag => {
          const active = (tagUser.tags || []).includes(tag.value);
          return (
            <button key={tag.value} type="button"
              onClick={() => { const tags = tagUser.tags || []; setTagUser(prev => ({ ...prev, tags: active ? tags.filter(t => t !== tag.value) : [...tags, tag.value] })); }}
              style={{ padding: "7px 16px", borderRadius: 20, border: `1px solid ${active ? tag.color : T.border}`, background: active ? `${tag.color}18` : "transparent", color: active ? tag.color : T.textMuted, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>
              {tag.label}
            </button>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <BtnGhost onClick={() => setTagUser(null)} style={{ flex: 1 }}>Cancel</BtnGhost>
        <Btn onClick={() => { saveTag(tagUser.uid, tagUser.tags || []); setTagUser(null); }} color={T.gold} style={{ flex: 2, color: T.bg }}>Save Tags</Btn>
      </div>
    </Modal>
  );

  /* FIX #14: Add User → Invite User (client SDK limitation explained) */
  const AddUserModal = () => showAddUser && (
    <Modal onClose={() => setShowAddUser(false)} maxWidth={520}>
      <ModalHeader title="Add New User" sub="Create a new account directly from admin" onClose={() => setShowAddUser(false)} />
      <div style={{ background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.2)", borderRadius: 10, padding: "10px 14px", marginBottom: 18, fontSize: 12, color: "#93C5FD", lineHeight: 1.6 }}>
        ℹ️ <strong>Note:</strong> Creating an account here uses Firebase client-side auth. The new user will receive a verification email. You will remain logged in as admin.
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        {[
          { label: "Full Name *", key: "name", type: "text", placeholder: "John Smith", full: true },
          { label: "Email Address *", key: "email", type: "email", placeholder: "john@company.com", full: true },
          { label: "Password *", key: "password", type: "password", placeholder: "Min 6 characters", full: true },
          { label: "Phone", key: "phone", type: "tel", placeholder: "+971 50 000 0000" },
        ].map(f => (
          <div key={f.key} style={{ gridColumn: f.full ? "1 / -1" : "auto" }}>
            <Field label={f.label}>
              <input type={f.type} placeholder={f.placeholder} value={addUserForm[f.key] || ""} onChange={e => setAddUserForm(p => ({ ...p, [f.key]: e.target.value }))} style={inputStyle} onFocus={focusIn} onBlur={focusOut} />
            </Field>
            {/* FIX #29: password validation */}
            {f.key === "password" && addUserForm.password && addUserForm.password.length < 6 && (
              <div style={{ fontSize: 11, color: T.red, marginTop: 4 }}>⚠️ Password must be at least 6 characters</div>
            )}
          </div>
        ))}
        <div><Field label="Country"><select value={addUserForm.country || ""} onChange={e => setAddUserForm(p => ({ ...p, country: e.target.value }))} style={{ ...inputStyle, cursor: "pointer" }}>
          <option value="">Select Country</option>
          {["🇦🇪 UAE","🇸🇦 Saudi Arabia","🇶🇦 Qatar","🇰🇼 Kuwait","🇧🇭 Bahrain","🇴🇲 Oman","🇬🇧 UK","🇺🇸 USA","🇮🇳 India","🇵🇰 Pakistan","🇪🇬 Egypt","🌍 Other"].map(c => <option key={c} value={c.slice(3)}>{c}</option>)}
        </select></Field></div>
        <div><Field label="Access Tier"><select value={addUserForm.tier || "free"} onChange={e => setAddUserForm(p => ({ ...p, tier: e.target.value }))} style={{ ...inputStyle, cursor: "pointer" }}>
          {BILLING_TIERS.map(r => <option key={r.value} value={r.value}>{r.label}{r.price ? ` · ${r.price}` : ""}</option>)}
        </select></Field></div>
        <div style={{ gridColumn: "1 / -1" }}><Field label="Job Role"><select value={addUserForm.role || "user"} onChange={e => setAddUserForm(p => ({ ...p, role: e.target.value }))} style={{ ...inputStyle, cursor: "pointer" }}>
          <option value="user">— No role assigned —</option>
          {JOB_ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select></Field></div>
        <div style={{ gridColumn: "1 / -1" }}><Field label="Admin Notes"><textarea placeholder="Internal notes..." value={addUserForm.notes || ""} onChange={e => setAddUserForm(p => ({ ...p, notes: e.target.value }))} style={{ ...inputStyle, minHeight: 60, resize: "vertical" }} /></Field></div>
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
        <BtnGhost onClick={() => setShowAddUser(false)} style={{ flex: 1 }}>Cancel</BtnGhost>
        <Btn onClick={addUserManually} disabled={addUserLoading || (addUserForm.password && addUserForm.password.length < 6)} color={T.gold} style={{ flex: 2, color: T.bg }}>{addUserLoading ? "Creating..." : "Create User"}</Btn>
      </div>
    </Modal>
  );

  const EditUserModal = () => editingUser && (
    <Modal onClose={() => setEditingUser(null)} maxWidth={520}>
      <ModalHeader title="Edit User" sub={editingUser.email} onClose={() => setEditingUser(null)} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div style={{ gridColumn: "1 / -1" }}><Field label="Full Name"><input type="text" placeholder="Full name" value={editUserForm.name || ""} onChange={e => setEditUserForm(p => ({ ...p, name: e.target.value }))} style={inputStyle} onFocus={focusIn} onBlur={focusOut} /></Field></div>
        <Field label="Phone"><input type="tel" placeholder="+971 50 000 0000" value={editUserForm.phone || ""} onChange={e => setEditUserForm(p => ({ ...p, phone: e.target.value }))} style={inputStyle} onFocus={focusIn} onBlur={focusOut} /></Field>
        <Field label="Country"><select value={editUserForm.country || ""} onChange={e => setEditUserForm(p => ({ ...p, country: e.target.value }))} style={{ ...inputStyle, cursor: "pointer" }}>
          <option value="">Select Country</option>
          {["🇦🇪 UAE","🇸🇦 Saudi Arabia","🇶🇦 Qatar","🇰🇼 Kuwait","🇧🇭 Bahrain","🇴🇲 Oman","🇬🇧 UK","🇺🇸 USA","🇮🇳 India","🇵🇰 Pakistan","🌍 Other"].map(c => <option key={c} value={c.slice(3)}>{c}</option>)}
        </select></Field>
        <Field label="Access Tier"><select value={editUserForm.tier || "free"} onChange={e => setEditUserForm(p => ({ ...p, tier: e.target.value }))} style={{ ...inputStyle, cursor: "pointer" }}>
          {BILLING_TIERS.map(r => <option key={r.value} value={r.value}>{r.label}{r.price ? ` · ${r.price}` : ""}</option>)}
        </select></Field>
        <Field label="Job Role"><select value={editUserForm.role || "user"} onChange={e => setEditUserForm(p => ({ ...p, role: e.target.value }))} style={{ ...inputStyle, cursor: "pointer" }}>
          <option value="user">— No role assigned —</option>
          {JOB_ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select></Field>
        {/* FIX #8: normalize trial date to ISO format */}
        <Field label="Trial End Date"><input type="date" value={editUserForm.trialEnd ? editUserForm.trialEnd.slice(0, 10) : ""} onChange={e => setEditUserForm(p => ({ ...p, trialEnd: e.target.value ? e.target.value + "T00:00:00.000Z" : "" }))} style={inputStyle} onFocus={focusIn} onBlur={focusOut} /></Field>
        <div style={{ gridColumn: "1 / -1" }}><Field label="Admin Notes"><textarea placeholder="Internal notes..." value={editUserForm.notes || ""} onChange={e => setEditUserForm(p => ({ ...p, notes: e.target.value }))} style={{ ...inputStyle, minHeight: 60, resize: "vertical" }} /></Field></div>
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
        <BtnGhost onClick={() => setEditingUser(null)} style={{ flex: 1 }}>Cancel</BtnGhost>
        <Btn onClick={saveEditUser} disabled={editUserLoading} color={T.gold} style={{ flex: 2, color: T.bg }}>{editUserLoading ? "Saving..." : "Save Changes"}</Btn>
      </div>
    </Modal>
  );

  const NotifUserModal = () => notifUser && (
    <Modal onClose={() => setNotifUser(null)} maxWidth={440}>
      <ModalHeader title={`Notify — ${notifUser.name || notifUser.email}`} sub="Appears instantly in their notification bell" onClose={() => setNotifUser(null)} />
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div>
          <label style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 8 }}>Icon</label>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {["📢","🏙️","💰","📈","⚠️","🔥","✅","🎉","📋","🚨"].map(ic => (
              <button key={ic} type="button" onClick={() => setNotifIcon(ic)}
                style={{ padding: "6px 10px", borderRadius: 8, border: `1px solid ${notifIcon === ic ? T.gold : T.border}`, background: notifIcon === ic ? T.goldGlow : T.surfaceAlt, cursor: "pointer", fontSize: 16 }}>{ic}</button>
            ))}
          </div>
        </div>
        <Field label="Title"><input type="text" placeholder="Notification title..." value={notifTitle} onChange={e => setNotifTitle(e.target.value)} style={inputStyle} onFocus={focusIn} onBlur={focusOut} /></Field>
        <Field label="Message"><textarea placeholder="Write the notification message..." value={notifMessage} onChange={e => setNotifMessage(e.target.value)} rows={3} style={{ ...inputStyle, resize: "vertical" }} onFocus={focusIn} onBlur={focusOut} /></Field>
        <div style={{ padding: "10px 14px", background: "rgba(212,168,67,0.05)", borderRadius: 9, border: "1px solid rgba(212,168,67,0.15)" }}>
          <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
            <span style={{ fontSize: 18 }}>{notifIcon}</span>
            <div>
              <div style={{ fontWeight: 700, color: T.white, fontSize: 13, marginBottom: 3 }}>{notifTitle || "Preview title"}</div>
              <div style={{ color: T.textMuted, fontSize: 12, lineHeight: 1.5 }}>{notifMessage || "Preview message..."}</div>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <BtnGhost onClick={() => setNotifUser(null)} style={{ flex: 1 }}>Cancel</BtnGhost>
          <Btn onClick={sendDirectNotification} disabled={notifSendingUser} color={T.gold} style={{ flex: 2, color: T.bg }}>{notifSendingUser ? "Sending..." : "Send"}</Btn>
        </div>
      </div>
    </Modal>
  );

  /* ══════════════════════════════════════════════
     PROFILE DRAWER — rebuilt for professional SaaS quality
  ══════════════════════════════════════════════ */

    /* ══════════════════════════════════════════════
     LOADING SKELETON — FIX #30
  ══════════════════════════════════════════════ */
  const SkeletonRow = () => (
    <div style={{ display: "grid", gridTemplateColumns: "36px 28px minmax(160px,2fr) minmax(150px,1.5fr) 100px 110px 75px 75px 140px", gap: 6, padding: "12px 16px", borderBottom: `1px solid ${T.border}`, alignItems: "center" }}>
      {[36,28,160,150,100,110,75,75,140].map((w,i) => (
        <div key={i} style={{ height: 12, background: `${T.border}`, borderRadius: 6, opacity: 0.5, width: i < 2 ? w : "100%", animation: "pulse 1.5s ease-in-out infinite", animationDelay: `${i*0.05}s` }} />
      ))}
    </div>
  );

  /* ══════════════════════════════════════════════
     MAIN RENDER
  ══════════════════════════════════════════════ */
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>

      {/* All modals */}
      <DeleteConfirmModal />
      <SuspendConfirmModal />
      <ExtendConfirmModal />
      <EmailModal />
      <NoteModal />
      <TagsModal />
      <AddUserModal />
      <EditUserModal />
      <NotifUserModal />
      <ProfileDrawerComponent
        drawerUser={drawerUser}
        onClose={() => setDrawerUserWithCallback(null)}
        drawerTab={drawerTab}
        setDrawerTab={setDrawerTab}
        T={T}
        getTierBadge={getTierBadge}
        getJobRoleBadge={getJobRoleBadge}
        getHealth={getHealth}
        trialDaysLeft={trialDaysLeft}
        copyToClipboard={copyToClipboard}
        copiedId={copiedId}
        TAGS_OPTIONS={TAGS_OPTIONS}
        BILLING_TIERS={BILLING_TIERS}
        JOB_ROLES={JOB_ROLES}
        handleTierChange={handleTierChange}
        setNoteUser={setNoteUser}
        setNoteText={setNoteText}
        setTagUser={setTagUser}
        setConfirmSuspend={setConfirmSuspend}
        setConfirmDelete={setConfirmDelete}
        sendResetEmail={sendResetEmail}
        setNotifUser={setNotifUser}
        setNotifTitle={setNotifTitle}
        setNotifMessage={setNotifMessage}
        setSendEmailUser={setSendEmailUser}
        setEmailSubject={setEmailSubject}
        setEmailBody={setEmailBody}
        timeSince={timeSince}
        lastActiveLabel={lastActiveLabel}
        lastActiveColor={lastActiveColor}
        getUserLTV={getUserLTV}
        AT_RISK_DAYS={AT_RISK_DAYS}
        handleJobRoleChange={handleJobRoleChange}
        inputStyle={inputStyle}
        confirmAndExtend={confirmAndExtend}
        notify={notify}
        openEditUser={openEditUser}
      />

      {/* Inline tier dropdown */}
      {inlineTierUser && (
        <div style={{ position: "fixed", inset: 0, zIndex: 900 }} onClick={() => setInlineTierUser(null)}>
          <div style={{ position: "fixed", top: inlineTierUser.y, left: inlineTierUser.x, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 6, zIndex: 901, minWidth: 180, boxShadow: "0 16px 48px rgba(0,0,0,0.5)", animation: "slideUp 0.15s ease-out" }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 9, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: 1, padding: "4px 10px 8px" }}>Change Tier</div>
            {BILLING_TIERS.map(r => {
              const isCurrent = (inlineTierUser.user.tier || "free") === r.value;
              return (
                <button key={r.value} type="button" onClick={() => handleTierChange(inlineTierUser.user.uid, r.value, inlineTierUser.user.tier)}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: "none", background: isCurrent ? r.bg : "transparent", color: isCurrent ? r.color : T.textSecondary, fontSize: 12, fontWeight: isCurrent ? 700 : 500, cursor: "pointer", fontFamily: "'Outfit',sans-serif", textAlign: "left", display: "flex", justifyContent: "space-between" }}>
                  <span>{r.label}</span>
                  <span style={{ fontSize: 10, color: isCurrent ? r.color : T.textMuted }}>{r.price || (isCurrent ? "✓" : "")}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ══ HEADER ══ */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ fontFamily: "'Fraunces',serif", fontSize: 26, fontWeight: 800, color: T.white, margin: 0 }}>User Management</h2>
          <p style={{ fontSize: 13, color: T.textMuted, margin: "4px 0 0" }}>
            {total} registered · Live Firestore · {allFiltered.length} shown · <span style={{ color: T.green }}>{activeToday} active today</span>
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {/* FIX #6: consistent threshold in tooltip, FIX #17: remove Refresh */}
          <div style={{ position: "relative" }} className="risk-btn-wrap">
            <button type="button" onClick={sendTrialExpiryEmails} disabled={sendingTrialEmails || atRiskCount === 0}
              style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, padding: "8px 14px", borderRadius: 8, border: `1px solid ${atRiskCount > 0 ? T.red + "60" : T.border}`, background: atRiskCount > 0 ? "rgba(239,68,68,0.06)" : "transparent", color: atRiskCount > 0 ? T.red : T.textMuted, cursor: atRiskCount > 0 ? "pointer" : "not-allowed", fontFamily: "'Outfit',sans-serif", fontWeight: 600, opacity: sendingTrialEmails ? 0.6 : 1 }}>
              {sendingTrialEmails ? "Sending..." : `Email At-Risk (${atRiskCount})`}
            </button>
            {atRiskCount > 0 && (
              <div style={{ position: "absolute", top: "calc(100% + 6px)", right: 0, background: T.surface, border: `1px solid ${T.red}30`, borderRadius: 8, padding: "8px 12px", fontSize: 11, color: T.textMuted, whiteSpace: "nowrap", zIndex: 50, pointerEvents: "none", boxShadow: "0 8px 24px rgba(0,0,0,0.4)", opacity: 0, transition: "opacity 0.2s" }} className="risk-tooltip">
                Will email: {atRisk.map(u => u.name || u.email).join(", ")} · ≤{AT_RISK_DAYS} days left
              </div>
            )}
          </div>
          <button type="button" onClick={exportFiltered} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, padding: "8px 14px", borderRadius: 8, border: `1px solid ${T.border}`, background: "transparent", color: T.textSecondary, cursor: "pointer", fontFamily: "'Outfit',sans-serif", fontWeight: 600 }}>{I.download} Export ({allFiltered.length})</button>
          <button type="button" onClick={() => setShowAddUser(true)} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, padding: "8px 16px", borderRadius: 8, border: `1px solid ${T.gold}`, background: T.goldGlow, color: T.gold, cursor: "pointer", fontFamily: "'Outfit',sans-serif", fontWeight: 700 }}>+ Add User <span style={{ fontSize: 10, opacity: 0.6 }}>[N]</span></button>
        </div>
      </div>

      {/* ══ KPI CARDS — FIX #1, #2, #18 ══ */}
      <div className="users-kpi-grid" style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 10, marginBottom: 16 }}>
        {[
          { label: "Total",        value: total,          color: T.white,     sub: "All accounts",    border: T.border,         filter: "All",      tip: "Show all users" },
          { label: "Paying",       value: paid,           color: "#10B981",   sub: `AED ${mrr}/mo`,   border: "#10B98125",       filter: "Pro",      tip: "Pro + Enterprise" }, // FIX #2
          { label: "Trial",        value: trial,          color: T.gold,      sub: "7-day trial",     border: `${T.gold}25`,    filter: "Pro Trial", tip: "Active trial users" },
          { label: "Free",         value: free,           color: T.textMuted, sub: "To convert",      border: T.border,         filter: "Free",     tip: "Free tier users" },
          { label: "At Risk",      value: atRiskCount,    color: T.red,       sub: `≤${AT_RISK_DAYS}d left`, border: `${T.red}25`, filter: "AtRisk", tip: `Trial ending in ≤${AT_RISK_DAYS} days` }, // FIX #1 + #6
          { label: "Active Today", value: activeToday,    color: T.teal,      sub: "Logged in today", border: `${T.teal}25`,    filter: null,       tip: "Logged in within 24h" },
          { label: "Conversion",   value: convRate + "%", color: "#06B6D4",   sub: "Free → Paid",     border: "#06B6D425",      filter: null,       tip: "Free to paid conversion rate" },
        ].map(s => (
          <div key={s.label} className="kpi-card"
            onClick={() => { if (s.filter) { setTierFilter(s.filter); setPage(1); } }}
            style={{ border: `1px solid ${tierFilter === s.filter && s.filter ? s.color + "60" : s.border}`, textAlign: "center", cursor: s.filter ? "pointer" : "default", transform: tierFilter === s.filter && s.filter ? "translateY(-2px)" : "none", transition: "all 0.15s" }}
            title={s.tip}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: s.color, opacity: 0.6, borderRadius: "16px 16px 0 0" }} />
            <div style={{ fontSize: 22, fontWeight: 800, color: s.color, fontFamily: "'Fraunces',serif", lineHeight: 1.2 }}>{s.value}</div>
            <div style={{ fontSize: 10, color: T.textMuted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, marginTop: 4 }}>{s.label}</div>
            <div style={{ fontSize: 10, color: T.textMuted, marginTop: 2 }}>{s.sub}</div>
            {s.filter && <div style={{ fontSize: 10, color: s.color, marginTop: 3, opacity: tierFilter === s.filter ? 1 : 0.5 }}>{tierFilter === s.filter ? "✓ filtered" : "click to filter"}</div>}
          </div>
        ))}
      </div>

      {/* ══ CONVERSION FUNNEL — FIX #16 (removed duplicate MRR), #26 ══ */}
      <div style={{ background: T.surfaceAlt, borderRadius: 14, padding: "16px 20px", border: `1px solid ${T.border}`, marginBottom: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div style={{ fontSize: 11, color: T.textMuted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>Conversion Funnel</div>
          {suspended > 0 && <span style={{ color: T.red, fontSize: 11, fontWeight: 700 }}>⏸ {suspended} suspended</span>}
        </div>
        <div style={{ display: "flex", alignItems: "stretch", gap: 0 }}>
          {[
            { label: "Signed Up",       value: total,        pct: 100, color: T.textSecondary },
            { label: "Activated Trial", value: trial + paid, pct: total > 0 ? Math.round(((trial + paid) / total) * 100) : 0, color: T.gold }, // FIX #26
            { label: "Converted Paid",  value: paid,         pct: total > 0 ? Math.round((paid / total) * 100) : 0, color: "#10B981" },
          ].map((s, i) => (
            <React.Fragment key={i}>
              <div style={{ flex: 1, background: `${s.color}10`, borderRadius: 10, padding: "12px 14px", textAlign: "center", border: `1px solid ${s.color}20`, position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: `${s.pct}%`, background: `${s.color}08` }} />
                <div style={{ fontSize: 22, fontWeight: 800, color: s.color, fontFamily: "'Fraunces',serif", position: "relative" }}>{s.value}</div>
                <div style={{ fontSize: 10, color: T.textMuted, fontWeight: 600, marginTop: 2, position: "relative" }}>{s.label}</div>
                {i > 0 && total > 0 && <div style={{ fontSize: 11, color: s.color, fontWeight: 700, marginTop: 2, position: "relative" }}>{s.pct}% of total</div>}
              </div>
              {i < 2 && <div style={{ display: "flex", alignItems: "center", padding: "0 8px", color: T.textMuted, fontSize: 18 }}>→</div>}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* ══ SAVED VIEWS ══ */}
      <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: 1, marginRight: 4 }}>Quick Views:</span>
        {[
          { label: "At Risk",      tier: "AtRisk" },    // FIX #3
          { label: "Enterprise",   tier: "Enterprise" },
          { label: "Free Users",   tier: "Free" },
          { label: "Suspended",    tier: "Suspended" },
          { label: "⌛ Expired",      tier: "Expired" },
        ].map(v => (
          <button key={v.label} type="button" onClick={() => { setTierFilter(v.tier); setPage(1); }}
            style={{ padding: "5px 12px", borderRadius: 20, border: `1px solid ${tierFilter === v.tier ? T.gold : T.border}`, background: tierFilter === v.tier ? T.goldGlow : "transparent", color: tierFilter === v.tier ? T.gold : T.textMuted, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>
            {v.label}
          </button>
        ))}
        {tierFilter !== "All" && (
          <button type="button" onClick={() => { setTierFilter("All"); setPage(1); }}
            style={{ padding: "5px 12px", borderRadius: 20, border: `1px solid ${T.red}30`, background: "transparent", color: T.red, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>✕ Clear</button>
        )}
        <div style={{ marginLeft: "auto", fontSize: 10, color: T.textMuted, fontStyle: "italic" }}>
          ↑↓ J/K · Enter=open · E=edit · N=new
        </div>
      </div>

      {/* ══ SEARCH + FILTERS — FIX #32 (active sort badge) ══ */}
      <div style={{ display: "flex", gap: 10, marginBottom: 12, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", flex: "1 1 280px", maxWidth: 360 }}>
          <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: T.textMuted }}>{I.search}</span>
          <input value={userSearch} onChange={e => { setUserSearch(e.target.value); setPage(1); }} placeholder="Search name, email, role, notes, country..."
            style={{ ...inputStyle, paddingLeft: 36 }} onFocus={focusIn} onBlur={focusOut} />
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {["All","Free","Pro Trial","Pro","Enterprise","Suspended","Expired"].map(f => (
            <button key={f} type="button" onClick={() => { setTierFilter(f); setPage(1); }}
              style={{ padding: "7px 12px", borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit',sans-serif", border: `1px solid ${tierFilter === f ? T.gold : T.border}`, background: tierFilter === f ? T.goldGlow : "transparent", color: tierFilter === f ? T.gold : T.textSecondary }}>
              {f}
            </button>
          ))}
        </div>
        <button type="button" onClick={() => setShowFilters(p => !p)}
          style={{ padding: "7px 12px", borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit',sans-serif", border: `1px solid ${(showFilters || activeFilterCount > 0) ? T.teal : T.border}`, background: (showFilters || activeFilterCount > 0) ? "rgba(6,182,212,0.08)" : "transparent", color: (showFilters || activeFilterCount > 0) ? T.teal : T.textMuted }}>
          Filters {activeFilterCount > 0 ? `• ${activeFilterCount}` : ""}
        </button>
      </div>

      {/* Advanced filters — FIX #27 (role filter), FIX #32 (sort badge) */}
      {showFilters && (
        <div style={{ background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 12, padding: "14px 16px", marginBottom: 14, display: "flex", gap: 14, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div>
            <Field label="Country" hint="(filled when user completes profile)">
              <input type="text" placeholder="e.g. UAE, Saudi..." value={filterCountry} onChange={e => { setFilterCountry(e.target.value); setPage(1); }} style={{ ...inputStyle, maxWidth: 180 }} onFocus={focusIn} onBlur={focusOut} />
            </Field>
          </div>
          {/* FIX #27: role filter */}
          <div>
            <Field label="Job Role">
              <select value={filterRole} onChange={e => { setFilterRole(e.target.value); setPage(1); }} style={{ ...inputStyle, maxWidth: 180, cursor: "pointer" }}>
                <option value="">All Roles</option>
                {JOB_ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </Field>
          </div>
          <div>
            <Field label="Sort By">
              <select value={sortField} onChange={e => { setSortField(e.target.value); setPage(1); }} style={{ ...inputStyle, cursor: "pointer", maxWidth: 180 }}>
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="name">Name A–Z</option>
                <option value="tier">Tier</option>
                <option value="trial">Trial Days Left</option>
                <option value="lastActive">Last Active</option>
              </select>
            </Field>
          </div>
          <button type="button" onClick={() => { setFilterCountry(""); setFilterRole(""); setSortField("newest"); setSortDir("desc"); setPage(1); }}
            style={{ padding: "9px 16px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.surfaceAlt, color: T.textSecondary, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>↺ Reset All</button>
        </div>
      )}

      {/* ── BULK ACTIONS — FIX #7: billing tiers only ── */}
      {bulkSel.length > 0 && (
        <div style={{ background: "rgba(212,168,67,0.06)", border: "1px solid rgba(212,168,67,0.25)", borderRadius: 10, padding: "10px 16px", marginBottom: 12, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: T.gold }}>✓ {bulkSel.length} users selected</span>
          <select value={bulkTier} onChange={e => setBulkTier(e.target.value)} style={{ padding: "6px 10px", background: T.bg, border: `1px solid ${T.border}`, borderRadius: 7, color: T.textPrimary, fontSize: 12, fontFamily: "'Outfit',sans-serif", cursor: "pointer", outline: "none" }}>
            <option value="">Change access tier to...</option>
            {BILLING_TIERS.map(r => <option key={r.value} value={r.value}>{r.label}{r.price ? ` · ${r.price}` : ""}</option>)}
          </select>
          <button type="button" onClick={handleBulkAction} disabled={!bulkTier} style={{ padding: "6px 14px", borderRadius: 7, border: "none", background: T.gold, color: T.bg, fontSize: 12, fontWeight: 700, cursor: bulkTier ? "pointer" : "not-allowed", fontFamily: "'Outfit',sans-serif", opacity: bulkTier ? 1 : 0.5 }}>Apply</button>
          <button type="button" onClick={() => setBulkSel([])} style={{ padding: "6px 10px", borderRadius: 7, border: `1px solid ${T.border}`, background: "transparent", color: T.textMuted, fontSize: 11, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>Clear</button>
        </div>
      )}

      {/* ══ DESKTOP TABLE ══ */}
      <div className="users-table-desktop" style={{ background: T.surface, borderRadius: 16, border: `1px solid ${T.border}`, overflow: "hidden" }}>
        {/* Header */}
        <div style={{ display: "grid", gridTemplateColumns: "36px 28px 2fr 1.6fr 110px 115px 85px 85px 145px", gap: 6, padding: "10px 16px", borderBottom: `2px solid ${T.border}`, background: T.surfaceAlt, alignItems: "center" }}>
          <div><input type="checkbox" onChange={e => setBulkSel(e.target.checked ? pagedUsers.map(u => u.uid) : [])} checked={bulkSel.length === pagedUsers.length && pagedUsers.length > 0} style={{ cursor: "pointer", accentColor: T.gold }} /></div>
          <ColHeader label="#" />
          <ColHeader label="User" field="name" />
          <ColHeader label="Email" />
          <ColHeader label="Tier" field="tier" />
          <ColHeader label="Trial" field="trial" />
          <ColHeader label="Last Active" field="lastActive" />
          <ColHeader label="Joined" field="newest" />
          <ColHeader label="Actions" />
        </div>

        {/* FIX #30: skeleton on initial load, FIX #24: context-aware empty state */}
        {users.length === 0 && !userSearch && tierFilter === "All" ? (
          // Initial load — data hasn't arrived from Firestore yet
          <div>
            {[...Array(5)].map((_, i) => <SkeletonRow key={i} />)}
          </div>
        ) : pagedUsers.length === 0 ? (
          <div style={{ textAlign: "center", padding: "56px 20px" }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: "rgba(100,116,139,0.1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", color: "#64748B" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: T.white, marginBottom: 6 }}>
              {tierFilter === "Suspended" ? "No suspended users" :
               tierFilter === "Expired"   ? "No expired trials" :
               tierFilter === "AtRisk"    ? `No users expiring within ${AT_RISK_DAYS} days` :
               userSearch ? `No results for "${userSearch}"` : "No users match this filter"}
            </div>
            <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 16 }}>
              {tierFilter === "Suspended" ? "Users you suspend will appear here." :
               tierFilter === "Expired"   ? "Users whose trial has ended will appear here." :
               userSearch ? "Try searching by email, name, role, or country." : "Try a different filter or clear to see all users."}
            </div>
            <button type="button" onClick={() => { setUserSearch(""); setTierFilter("All"); setFilterCountry(""); setFilterRole(""); setPage(1); }}
              style={{ padding: "8px 18px", borderRadius: 8, border: `1px solid ${T.gold}`, background: T.goldGlow, color: T.gold, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>
              Clear All Filters
            </button>
          </div>
        ) : pagedUsers.map((u, i) => {
          const badge   = getTierBadge(u);
          const jobRole = getJobRoleBadge(u);
          const health  = getHealth(u);
          const days    = trialDaysLeft(u);
          const isSelected = bulkSel.includes(u.uid);
          const isFocused  = focusedRow === i;
          const rowNum     = (page - 1) * PAGE_SIZE + i + 1;
          // FIX #5: use actual trial length, not hardcoded 7
          const trialTotal = u.trialEnd && u.createdAt ? Math.max(7, Math.round((new Date(u.trialEnd) - new Date(u.createdAt)) / 86400000)) : 7;
          const trialPct   = days !== null ? Math.max(0, Math.min((days / trialTotal) * 100, 100)) : 0;
          return (
            <div key={u.uid}
              style={{ display: "grid", gridTemplateColumns: "36px 28px 2fr 1.6fr 110px 115px 85px 85px 145px", gap: 6, padding: "10px 16px", borderBottom: `1px solid ${T.border}`, alignItems: "center", background: isFocused ? `${T.gold}08` : isSelected ? "rgba(212,168,67,0.04)" : hoverRow === u.uid ? T.surfaceAlt : u.suspended ? "rgba(239,68,68,0.02)" : "transparent", transition: "background 0.1s", borderLeft: `3px solid ${health.border}`, cursor: "default" }}
              onMouseEnter={() => { setHoverRow(u.uid); setFocusedRow(i); }}
              onMouseLeave={() => setHoverRow(null)}>

              <div><input type="checkbox" checked={isSelected} onChange={e => setBulkSel(p => e.target.checked ? [...p, u.uid] : p.filter(id => id !== u.uid))} style={{ cursor: "pointer", accentColor: T.gold }} /></div>
              <span style={{ fontSize: 11, color: T.textMuted }}>{rowNum}</span>

              <div style={{ display: "flex", alignItems: "center", gap: 9, minWidth: 0 }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: `linear-gradient(135deg, ${badge.color}28, ${badge.color}0a)`, border: `1.5px solid ${badge.color}35`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 14, color: badge.color, flexShrink: 0, fontFamily: "'Fraunces',serif" }}>
                  {(u.name || u.email || "?")[0].toUpperCase()}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: u.suspended ? T.red : T.white, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 5 }}>
                    {u.name || u.email?.split("@")[0]}
                    {u.suspended && <span style={{ fontSize: 9, color: T.red, fontWeight: 700, background: "rgba(239,68,68,0.12)", padding: "1px 5px", borderRadius: 4 }}>SUSPENDED</span>}
                    {u.role === "admin" && <span style={{ fontSize: 9, color: T.gold, fontWeight: 700, background: "rgba(212,168,67,0.12)", padding: "1px 5px", borderRadius: 4 }}>ADMIN</span>}
                    {/* FIX #33: notes badge is clickable */}
                    {u.notes && <button type="button" onClick={() => { setNoteUser(u); setNoteText(u.notes || ""); }} title="Click to view/edit note" style={{ fontSize: 9, color: "#8B5CF6", background: "rgba(139,92,246,0.12)", padding: "1px 5px", borderRadius: 4, border: "none", cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>note</button>}
                  </div>
                  <div style={{ fontSize: 10, color: T.textMuted, marginTop: 2, display: "flex", alignItems: "center", gap: 4, overflow: "hidden" }}>
                    <span style={{ width: 5, height: 5, borderRadius: "50%", background: health.dot, display: "inline-block", flexShrink: 0 }} />
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {health.label}
                      {jobRole && <span style={{ marginLeft: 5, color: jobRole.color, fontWeight: 700 }}>· {jobRole.label}</span>}
                      {(u.tags || []).length > 0 && <span style={{ marginLeft: 5, color: "#8B5CF6" }}>· {(u.tags || []).map(t => TAGS_OPTIONS.find(x => x.value === t)?.label).filter(Boolean).join(", ")}</span>}
                    </span>
                  </div>
                </div>
              </div>

              <span style={{ fontSize: 11, color: T.textSecondary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.email}</span>

              {/* FIX #19: tier badge has ▾ to signal it's clickable */}
              <div>
                <button type="button"
                  onClick={e => { const rect = e.currentTarget.getBoundingClientRect(); setInlineTierUser({ user: u, x: rect.left, y: rect.bottom + 4 }); }}
                  title="Click to change tier"
                  style={{ fontSize: 10, fontWeight: 700, padding: "4px 9px", borderRadius: 7, background: badge.bg, color: badge.color, border: `1px solid ${badge.color}25`, cursor: "pointer", fontFamily: "'Outfit',sans-serif", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 3 }}>
                  {badge.label}{badge.price ? ` · ${badge.price}` : ""}
                  <span style={{ opacity: 0.6, fontSize: 9 }}>▾</span>
                </button>
              </div>

              {/* FIX #5: trial bar uses actual trial length */}
              <div>
                {days !== null ? (
                  <div>
                    <div style={{ width: "100%", height: 4, borderRadius: 2, background: T.surfaceAlt, marginBottom: 3 }}>
                      <div style={{ width: `${trialPct}%`, height: "100%", borderRadius: 2, background: days > AT_RISK_DAYS ? T.green : days > 1 ? T.gold : T.red }} />
                    </div>
                    <span style={{ fontSize: 10, color: days <= AT_RISK_DAYS ? T.red : T.gold, fontWeight: 700 }}>{days > 0 ? `${days}d left` : "Expired"}</span>
                  </div>
                ) : u.tier === "pro" ? <span style={{ fontSize: 10, color: T.green, fontWeight: 600 }}>Active ✓</span>
                  : u.tier === "enterprise" ? <span style={{ fontSize: 10, color: T.teal, fontWeight: 600 }}>Enterprise ✓</span>
                  : <span style={{ fontSize: 11, color: T.textMuted }}>—</span>}
              </div>

              <div><div style={{ fontSize: 10, fontWeight: 700, color: lastActiveColor(u) }}>{lastActiveLabel(u)}</div></div>

              <div>
                <div style={{ fontSize: 11, color: T.textSecondary }}>{(() => { try { return new Date(u.createdAt).toLocaleDateString("en", { day: "numeric", month: "short" }); } catch { return "—"; } })()}</div>
                <div style={{ fontSize: 10, color: T.textMuted, marginTop: 1 }}>{timeSince(u.createdAt)}</div>
              </div>

              <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                <button type="button" title="View profile [Enter]" onClick={() => { setDrawerUser(u); setDrawerTab("details"); }}
                  style={{ height: 28, padding: "0 8px", borderRadius: 7, border: `1px solid ${T.gold}40`, background: T.goldGlow, color: T.gold, cursor: "pointer", fontSize: 11, fontWeight: 700, fontFamily: "'Outfit',sans-serif", whiteSpace: "nowrap" }}>View →</button>
                <button type="button" title="Edit user [E]" onClick={() => openEditUser(u)}
                  style={{ width: 28, height: 28, borderRadius: 7, border: `1px solid ${T.border}`, background: "transparent", color: T.textSecondary, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <EditIcon />
                </button>
                <button type="button" title="Send email" onClick={() => { setSendEmailUser(u); setEmailSubject(""); setEmailBody(""); }}
                  style={{ width: 28, height: 28, borderRadius: 7, border: "1px solid rgba(59,130,246,0.3)", background: "rgba(59,130,246,0.06)", color: "#3B82F6", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg></button>
                <button type="button" title="Delete user" onClick={() => setConfirmDelete(u)}
                  style={{ width: 28, height: 28, borderRadius: 7, border: `1px solid ${T.red}30`, background: `${T.red}06`, color: T.red, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ══ MOBILE CARD VIEW — FIX #22: Edit, Tags, Suspend added ══ */}
      <div className="users-table-mobile" style={{ flexDirection: "column", gap: 10 }}>
        {pagedUsers.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 20px", background: T.surface, borderRadius: 16, border: `1px solid ${T.border}` }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(100,116,139,0.1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", color: "#64748B" }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></div>
            <div style={{ fontSize: 14, color: T.textMuted }}>No users found</div>
          </div>
        ) : pagedUsers.map(u => {
          const badge  = getTierBadge(u);
          const health = getHealth(u);
          const days   = trialDaysLeft(u);
          return (
            <div key={u.uid} style={{ background: T.surface, borderRadius: 14, border: `1px solid ${T.border}`, padding: "16px", borderLeft: `3px solid ${health.border}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: `${badge.color}20`, border: `1.5px solid ${badge.color}40`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 800, color: badge.color, fontFamily: "'Fraunces',serif", flexShrink: 0 }}>
                    {(u.name || u.email || "?")[0].toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: T.white }}>{u.name || u.email?.split("@")[0]}</div>
                    <div style={{ fontSize: 11, color: T.textMuted }}>{u.email}</div>
                  </div>
                </div>
                <span style={{ fontSize: 10, fontWeight: 700, padding: "4px 10px", borderRadius: 7, background: badge.bg, color: badge.color }}>{badge.label}</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
                {[
                  { label: "Status", value: health.label, color: health.dot },
                  { label: "Trial",  value: days !== null ? (days > 0 ? `${days}d left` : "Expired") : (u.tier === "pro" ? "Active" : "—"), color: days !== null ? (days <= AT_RISK_DAYS ? T.red : T.gold) : T.green },
                  { label: "Active", value: lastActiveLabel(u), color: lastActiveColor(u) },
                ].map(s => (
                  <div key={s.label} style={{ background: T.surfaceAlt, borderRadius: 8, padding: "8px 10px" }}>
                    <div style={{ fontSize: 9, color: T.textMuted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 }}>{s.label}</div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: s.color }}>{s.value}</div>
                  </div>
                ))}
              </div>
              {/* FIX #22: all 9 actions available on mobile */}
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                <button type="button" onClick={() => { setDrawerUser(u); setDrawerTab("details"); }} style={{ flex: 1, minWidth: 60, padding: "8px", borderRadius: 8, border: `1px solid ${T.gold}40`, background: T.goldGlow, color: T.gold, cursor: "pointer", fontSize: 11, fontWeight: 700, fontFamily: "'Outfit',sans-serif" }}>View →</button>
                <button type="button" onClick={() => openEditUser(u)} style={{ width: 36, height: 36, borderRadius: 8, border: `1px solid ${T.border}`, background: "transparent", color: T.textSecondary, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }} title="Edit"><EditIcon /></button>
                <button type="button" onClick={() => setTagUser(u)} style={{ width: 36, height: 36, borderRadius: 8, border: "1px solid rgba(139,92,246,0.3)", background: "rgba(139,92,246,0.06)", color: "#8B5CF6", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }} title="Tags"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg></button>
                <button type="button" onClick={() => setConfirmSuspend(u)} style={{ width: 36, height: 36, borderRadius: 8, border: "1px solid rgba(245,158,11,0.3)", background: "rgba(245,158,11,0.06)", color: "#F59E0B", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }} title={u.suspended ? "Unsuspend" : "Suspend"}>{u.suspended ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg> : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>}</button>
                <button type="button" onClick={() => { setSendEmailUser(u); setEmailSubject(""); setEmailBody(""); }} style={{ width: 36, height: 36, borderRadius: 8, border: "1px solid rgba(59,130,246,0.3)", background: "rgba(59,130,246,0.06)", color: "#3B82F6", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg></button>
                <button type="button" onClick={() => setConfirmDelete(u)} style={{ width: 36, height: 36, borderRadius: 8, border: `1px solid ${T.red}30`, background: `${T.red}06`, color: T.red, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ══ PAGINATION — FIX #4 ══ */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14, padding: "0 2px", flexWrap: "wrap", gap: 10 }}>
        {/* FIX #4: handle 0 results gracefully */}
        <span style={{ fontSize: 11, color: T.textMuted }}>
          {allFiltered.length === 0
            ? "No users shown"
            : <>Showing <strong style={{ color: T.white }}>{(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, allFiltered.length)}</strong> of <strong style={{ color: T.white }}>{allFiltered.length}</strong> users</>
          }
          {tierFilter !== "All" && <span style={{ color: T.gold }}> · {tierFilter}</span>}
        </span>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <button type="button" onClick={() => setPage(1)} disabled={page === 1} style={{ padding: "5px 10px", borderRadius: 7, border: `1px solid ${T.border}`, background: "transparent", color: page === 1 ? T.textMuted : T.textSecondary, cursor: page === 1 ? "not-allowed" : "pointer", fontSize: 11, fontFamily: "'Outfit',sans-serif" }}>«</button>
          <button type="button" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ padding: "5px 10px", borderRadius: 7, border: `1px solid ${T.border}`, background: "transparent", color: page === 1 ? T.textMuted : T.textSecondary, cursor: page === 1 ? "not-allowed" : "pointer", fontSize: 11, fontFamily: "'Outfit',sans-serif" }}>‹ Prev</button>
          {Array.from({ length: Math.min(5, totalPages) }, (_, idx) => {
            const p = totalPages <= 5 ? idx + 1 : Math.max(1, Math.min(page - 2, totalPages - 4)) + idx;
            return (
              <button key={p} type="button" onClick={() => setPage(p)}
                style={{ width: 30, height: 30, borderRadius: 7, border: `1px solid ${page === p ? T.gold : T.border}`, background: page === p ? T.goldGlow : "transparent", color: page === p ? T.gold : T.textSecondary, cursor: "pointer", fontSize: 11, fontWeight: page === p ? 700 : 400, fontFamily: "'Outfit',sans-serif" }}>
                {p}
              </button>
            );
          })}
          <button type="button" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ padding: "5px 10px", borderRadius: 7, border: `1px solid ${T.border}`, background: "transparent", color: page === totalPages ? T.textMuted : T.textSecondary, cursor: page === totalPages ? "not-allowed" : "pointer", fontSize: 11, fontFamily: "'Outfit',sans-serif" }}>Next ›</button>
          <button type="button" onClick={() => setPage(totalPages)} disabled={page === totalPages} style={{ padding: "5px 10px", borderRadius: 7, border: `1px solid ${T.border}`, background: "transparent", color: page === totalPages ? T.textMuted : T.textSecondary, cursor: page === totalPages ? "not-allowed" : "pointer", fontSize: 11, fontFamily: "'Outfit',sans-serif" }}>»</button>
          <span style={{ fontSize: 11, color: T.textMuted, marginLeft: 4 }}>Page {page} of {totalPages}</span>
        </div>
        {/* FIX #16: MRR only shown once — here at bottom */}
        <span style={{ fontSize: 11, color: T.textMuted }}>
          MRR <span style={{ color: T.gold, fontWeight: 700 }}>AED {mrr}</span> · Conv <span style={{ color: T.green, fontWeight: 700 }}>{convRate}%</span>
        </span>
      </div>
    </div>
  );
}

export default function AdminPanel() {
  const { lang, setLang, t: i18t, dir, langInfo } = useI18n();
  const [showLangPicker, setShowLangPicker] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [adminUser, setAdminUser] = useState(null);
  const [tab, setTab] = useState("overview");
  const [tabSettings, setTabSettings] = useState({});
  const [tabSettingsSaving, setTabSettingsSaving] = useState(false);
  const [selectedTabControl, setSelectedTabControl] = useState(null);
  const [tabDataEdits, setTabDataEdits] = useState({});
  const [tabDataSaving, setTabDataSaving] = useState(false);
  const [users, setUsers] = useState([]);
  const [userSearch, setUserSearch] = useState("");
  const [tierFilter, setTierFilter] = useState("All");
  const [expandedUser, setExpandedUser] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [editUserForm, setEditUserForm] = useState({});
  const [showAddUser, setShowAddUser] = useState(false);
  const [pendingOpenUid, setPendingOpenUid] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [addUserForm, setAddUserForm] = useState({ name: "", email: "", password: "", phone: "", country: "", tier: "free", notes: "" });
  const [addUserLoading, setAddUserLoading] = useState(false);
  const [editUserLoading, setEditUserLoading] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [sortBy, setSortBy] = useState("newest");
  const [toast, setToast] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  /* ─── DATA MANAGER STATE ─── */
  const [dataSubTab, setDataSubTab] = useState("data"); // projects | communities | yields
  const [editingProject, setEditingProject] = useState(null);
  const [bulkSelected, setBulkSelected] = useState([]);
  const [priceHistory, setPriceHistory] = useState({});
  const [bulkEdit, setBulkEdit] = useState(false);
  const [bulkForm, setBulkForm] = useState({});
  const [auditLog, setAuditLog] = useState([]);
  const [editingCommunity, setEditingCommunity] = useState(null);
  const [editingYield, setEditingYield] = useState(null);
  const [liveProjects, setLiveProjects] = useState({});
  const [liveCommunityROI, setLiveCommunityROI] = useState({});
  const [liveYields, setLiveYields] = useState({});
  const [dataSearch, setDataSearch] = useState("");
  const [dataSaving, setDataSaving] = useState(false);
  const [projectForm, setProjectForm] = useState({});
  const [communityForm, setCommunityForm] = useState({});
  const [yieldForm, setYieldForm] = useState({});

  /* ─── KYC VERIFICATION STATE ─── */
  const [verifications, setVerifications] = useState([]);
  const [leads, setLeads] = useState([]);
  const [verifyFilter, setVerifyFilter] = useState("all"); // all | pending | approved | rejected
  const [verifySearch, setVerifySearch] = useState("");
  const [reviewingUser, setReviewingUser] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

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

  // Real-time listener — auto-updates table when any user doc changes
  useEffect(() => {
    if (!isAdmin) return;
    let unsub;
    const setupListener = async () => {
      try {
        const { onSnapshot, collection: col } = await import("firebase/firestore");
        unsub = onSnapshot(col(db, "users"), (snap) => {
          const list = [];
          snap.forEach(d => list.push({ uid: d.id, ...plainify(d.data()) }));
          setUsers(list);
        });
      } catch(e) { fetchUsers(); }
    };
    setupListener();
    return () => { if (unsub) unsub(); };
  }, [isAdmin]);

  /* ─── FETCH LIVE DATA FROM FIRESTORE ─── */
  const fetchLiveData = useCallback(async () => {
    try {
      // Fetch project overrides
      const projSnap = await getDocs(collection(db, "projectData"));
      const projMap = {};
      projSnap.forEach(d => { projMap[d.id] = plainify(d.data()); });
      setLiveProjects(projMap);

      // Fetch community ROI overrides
      const roiSnap = await getDocs(collection(db, "communityROI"));
      const roiMap = {};
      roiSnap.forEach(d => { roiMap[d.id] = plainify(d.data()); });
      setLiveCommunityROI(roiMap);

      // Fetch yield overrides
      const yieldSnap = await getDocs(collection(db, "yieldData"));
      const yieldMap = {};
      yieldSnap.forEach(d => { yieldMap[d.id] = plainify(d.data()); });
      setLiveYields(yieldMap);
    } catch (e) { console.error("Fetch live data:", e); }
  }, []);

  useEffect(() => { if (isAdmin) fetchLiveData(); }, [isAdmin, fetchLiveData]);

  /* ─── FETCH KYC VERIFICATIONS ─── */
  const fetchVerifications = useCallback(async () => {
    try {
      const snap = await getDocs(collection(db, "verifications"));
      const list = [];
      snap.forEach(d => list.push({ id: d.id, ...plainify(d.data()) }));
      list.sort((a, b) => new Date(b.submittedAt || 0) - new Date(a.submittedAt || 0));
      setVerifications(list);
    } catch (e) { console.error("Fetch verifications:", e); }
  }, []);

  useEffect(() => { if (isAdmin) fetchVerifications(); }, [isAdmin, fetchVerifications]);

  const fetchLeads = useCallback(async () => {
    try {
      const snap = await getDocs(collection(db, "leads"));
      const list = [];
      snap.forEach(d => list.push({ id: d.id, ...plainify(d.data()) }));
      list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      setLeads(list);
    } catch (e) { console.error("Fetch leads:", e); }
  }, []);

  useEffect(() => { if (isAdmin) fetchLeads(); }, [isAdmin, fetchLeads]);

  /* ─── FETCH AUDIT LOG ─── */
  const fetchAuditLog = useCallback(async () => {
    try {
      const { getDocs, collection: col, query, orderBy, limit } = await import("firebase/firestore");
      const q = query(col(db, "auditLog"), orderBy("changedAt", "desc"), limit(100));
      const snap = await getDocs(q);
      const list = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() }));
      setAuditLog(list);
    } catch (e) {
      // fallback without orderBy if index not ready
      try {
        const { getDocs, collection: col } = await import("firebase/firestore");
        const snap = await getDocs(col(db, "auditLog"));
        const list = [];
        snap.forEach(d => list.push({ id: d.id, ...d.data() }));
        list.sort((a, b) => new Date(b.changedAt || 0) - new Date(a.changedAt || 0));
        setAuditLog(list.slice(0, 100));
      } catch (e2) { console.error("Fetch audit log:", e2); }
    }
  }, []);

  useEffect(() => { if (isAdmin) fetchAuditLog(); }, [isAdmin, fetchAuditLog]);

  const approveVerification = async (v) => {
    if (!window.confirm(`⚠️ APPROVE VERIFICATION\n\nUser: ${v.name || v.email}\nLevel: ${v.level || "Basic"}\n\nThis will:\n• Mark this user as verified\n• Update their profile with a verified badge\n• They can access verified-tier features\n\nContinue?`)) return;
    try {
      await setDoc(doc(db, "verifications", v.id), { status: "approved", reviewedAt: new Date().toISOString(), reviewedBy: adminUser?.email || "admin" }, { merge: true });
      await setDoc(doc(db, "users", v.uid), { verified: true, verifiedLevel: v.level || "basic", verifiedAt: new Date().toISOString() }, { merge: true });
      notify("User verified successfully");
      fetchVerifications();
      fetchUsers();
    } catch (e) { notify("Error: " + e.message); }
  };

  const rejectVerification = async (v) => {
    if (!rejectReason.trim()) { notify("Error: Please enter a rejection reason"); return; }
    if (!window.confirm(`⚠️ REJECT VERIFICATION\n\nUser: ${v.name || v.email}\nReason: ${rejectReason}\n\nThis will:\n• Reject their verification request\n• They will be notified to resubmit\n• Documents will be marked as rejected\n\nContinue?`)) return;
    try {
      await setDoc(doc(db, "verifications", v.id), { status: "rejected", rejectReason, reviewedAt: new Date().toISOString(), reviewedBy: adminUser?.email || "admin" }, { merge: true });
      await setDoc(doc(db, "users", v.uid), { verified: false, verifiedLevel: null }, { merge: true });
      notify("Verification rejected");
      setRejectReason("");
      setReviewingUser(null);
      fetchVerifications();
      fetchUsers();
    } catch (e) { notify("Error: " + e.message); }
  };

  /* ─── USER STATS ─── */
  /* ══════════════════════════════════════════════
     DATA FOUNDATION — Single source of truth
     All calculations derived here once, used everywhere
  ══════════════════════════════════════════════ */

  // Single now reference — all time comparisons use this exact moment
  const now = new Date();
  const todayStr = now.toDateString();
  const msPerDay = 86400000;
  const msPerWeek = 7 * msPerDay;

  // ── USER COUNTS ──
  const stats = {
    total:     users.length,
    today:     users.filter(u => { try { return new Date(u.createdAt).toDateString() === todayStr; } catch { return false; } }).length,
    thisWeek:  users.filter(u => { try { return (now - new Date(u.createdAt)) < msPerWeek; } catch { return false; } }).length,
    lastWeek:  users.filter(u => { try { const ms = now - new Date(u.createdAt); return ms >= msPerWeek && ms < msPerWeek * 2; } catch { return false; } }).length,
    thisMonth: users.filter(u => { try { const d = new Date(u.createdAt); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); } catch { return false; } }).length,
    proTrial:  users.filter(u => u.tier === "pro_trial" && (!u.trialEnd || new Date(u.trialEnd) > now)).length,
    free:      users.filter(u => u.tier === "free" || !u.tier).length,
    expired:   users.filter(u => u.tier === "pro_trial" && u.trialEnd && new Date(u.trialEnd) <= now).length,
    pro:       users.filter(u => u.tier === "pro").length,
    enterprise:users.filter(u => u.tier === "enterprise").length,
    suspended: users.filter(u => u.suspended).length,
    activeToday: users.filter(u => u.lastLoginAt && (now - new Date(u.lastLoginAt)) < msPerDay).length,
    activeThisWeek: users.filter(u => u.lastLoginAt && (now - new Date(u.lastLoginAt)) < msPerWeek).length,
  };
  stats.paid        = stats.pro + stats.enterprise;
  stats.freeOnly    = stats.free;   // pure free — never trialled
  stats.atRisk      = users.filter(u => { try { const d = trialDaysLeft(u); return d !== null && d <= 3 && d >= 0; } catch { return false; } }).length;
  stats.atRiskUsers = users.filter(u => { try { const d = trialDaysLeft(u); return d !== null && d <= 3 && d >= 0; } catch { return false; } });

  // ── REVENUE — single calculation, used everywhere ──
  const mrr  = (stats.pro * 99) + (stats.enterprise * 499);
  const arr  = mrr * 12;
  const arpu = stats.paid > 0 ? Math.round(mrr / stats.paid) : 0;       // per paying user
  const arpuAll = stats.total > 0 ? Math.round(mrr / stats.total) : 0;  // per all users

  // ── TRIAL CONVERSION — correct formula ──
  // denominator = everyone who ever started a trial (active + converted + expired)
  const everTrialled = stats.proTrial + stats.pro + stats.expired;
  const trialConversion = everTrialled > 0 ? Math.round((stats.pro / everTrialled) * 100) : 0;

  // ── WEEK-OVER-WEEK TRENDS ──
  // Users who joined in the PREVIOUS 7-day window (7-14 days ago)
  const usersLastWeekTotal = users.filter(u => {
    try { const ms = now - new Date(u.createdAt); return ms >= msPerWeek && ms < msPerWeek * 2; } catch { return false; }
  }).length;
  const paidLastWeek = (() => {
    // approximate: paid users whose createdAt was in last 7 days
    const newPaidThisWeek = users.filter(u => {
      try { return (u.tier === "pro" || u.tier === "enterprise") && (now - new Date(u.createdAt)) < msPerWeek; } catch { return false; }
    }).length;
    const newPaidLastWeek = users.filter(u => {
      try { const ms = now - new Date(u.createdAt); return (u.tier === "pro" || u.tier === "enterprise") && ms >= msPerWeek && ms < msPerWeek * 2; } catch { return false; }
    }).length;
    return { thisWeek: newPaidThisWeek, lastWeek: newPaidLastWeek };
  })();

  const weekTrend = (current, previous) => {
    if (previous === 0 && current === 0) return { pct: 0, dir: "flat", label: "—" };
    if (previous === 0) return { pct: 100, dir: "up", label: `+${current} new` };
    const pct = Math.round(((current - previous) / previous) * 100);
    return { pct: Math.abs(pct), dir: pct > 0 ? "up" : pct < 0 ? "down" : "flat", label: pct > 0 ? `↑${Math.abs(pct)}%` : pct < 0 ? `↓${Math.abs(pct)}%` : "=" };
  };
  const usersTrend  = weekTrend(stats.thisWeek, usersLastWeekTotal);
  const mrrTrend    = weekTrend(paidLastWeek.thisWeek, paidLastWeek.lastWeek);

  // ── CHURN — derived from auditLog ──
  // A churn event = tier_change where from is pro/enterprise and to is free/pro_trial
  const churnEvents = auditLog.filter(l =>
    l.action === "tier_change" &&
    (l.from === "pro" || l.from === "enterprise") &&
    (l.to === "free" || l.to === "pro_trial")
  );
  const churnThisMonth = churnEvents.filter(l => {
    try { const d = new Date(l.changedAt); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); } catch { return false; }
  });
  const churnedMRR = churnThisMonth.reduce((sum, l) => {
    return sum + (l.from === "enterprise" ? 499 : 99);
  }, 0);
  const newMRRThisMonth = users.filter(u => {
    try {
      const d = new Date(u.createdAt);
      return (u.tier === "pro" || u.tier === "enterprise") &&
             d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    } catch { return false; }
  }).reduce((sum, u) => sum + (u.tier === "enterprise" ? 499 : 99), 0);
  const netMRR = newMRRThisMonth - churnedMRR;

  // ── PLATFORM HEALTH SCORE (0–100) ──
  // Based on: conversion rate, at-risk %, active rate, churn
  const healthScore = (() => {
    let score = 100;
    if (stats.total === 0) return 50; // no data
    // penalise at-risk trials
    if (stats.proTrial > 0) score -= Math.min(30, Math.round((stats.atRisk / stats.proTrial) * 30));
    // penalise low conversion (below 20% is bad)
    if (trialConversion < 20 && everTrialled > 2) score -= 20;
    else if (trialConversion < 40 && everTrialled > 2) score -= 10;
    // penalise churn
    if (churnThisMonth.length > 0) score -= Math.min(20, churnThisMonth.length * 10);
    // penalise suspended users
    if (stats.suspended > 0) score -= Math.min(10, stats.suspended * 5);
    return Math.max(0, Math.min(100, score));
  })();
  const healthLabel = healthScore >= 80 ? "Excellent" : healthScore >= 60 ? "Good" : healthScore >= 40 ? "Needs Attention" : "Critical";
  const healthColor = healthScore >= 80 ? T.green : healthScore >= 60 ? T.gold : healthScore >= 40 ? "#F59E0B" : T.red;

  // ── PENDING ITEMS (from other collections) ──
  const pendingVerifications = verifications.filter(v => v.status === "pending").length;
  const newLeadsToday = leads.filter(l => { try { return new Date(l.createdAt).toDateString() === todayStr; } catch { return false; } }).length;
  const newLeadsThisWeek = leads.filter(l => { try { return (now - new Date(l.createdAt)) < msPerWeek; } catch { return false; } }).length;

  // ── SIGNUP TIMELINE — 14 days with last-week comparison ──
  const signupTimeline = (() => {
    const days = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now); d.setDate(d.getDate() - i);
      const dLastWeek = new Date(now); dLastWeek.setDate(dLastWeek.getDate() - i - 7);
      const key = d.toDateString();
      const keyLW = dLastWeek.toDateString();
      const count = users.filter(u => { try { return new Date(u.createdAt).toDateString() === key; } catch { return false; } }).length;
      const countLW = users.filter(u => { try { return new Date(u.createdAt).toDateString() === keyLW; } catch { return false; } }).length;
      days.push({
        date: `${d.getDate()} ${d.toLocaleString("en", { month: "short" })}`,
        count,
        lastWeek: countLW,
      });
    }
    return days;
  })();
  const signupThisWeek = signupTimeline.slice(-7).reduce((s, d) => s + d.count, 0);
  const signupLastWeek = signupTimeline.slice(-7).reduce((s, d) => s + d.lastWeek, 0);
  const signupTrend = weekTrend(signupThisWeek, signupLastWeek);

  // ── TIER DISTRIBUTION ──
  const tierData = [
    { name: "Pro Trial", value: stats.proTrial, color: T.gold },
    { name: "Free",      value: stats.freeOnly, color: T.textMuted },
    { name: "Pro",       value: stats.pro,       color: T.green },
    { name: "Enterprise",value: stats.enterprise,color: T.teal },
    { name: "Expired",   value: stats.expired,   color: T.red },
  ].filter(d => d.value > 0);

  // ── MRR MOVEMENT (for chart) ──
  const mrrMovement = [
    { label: "Start of Month", value: mrr - netMRR },
    { label: "New MRR",        value: newMRRThisMonth },
    { label: "Churned MRR",    value: -churnedMRR },
    { label: "Net MRR",        value: mrr },
  ];

  // ── CUMULATIVE GROWTH — used by Analytics tab ──
  const cumulativeData = (() => {
    const sorted = [...users].sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
    return sorted.map((u, i) => {
      const d = new Date(u.createdAt || now);
      return { date: `${d.getDate()}/${d.getMonth() + 1}`, total: i + 1 };
    });
  })();

  // ── REVENUE PROJECTION — kept for Revenue tab, clearly labelled as estimate ──
  const projectedMRR = mrr + Math.round(stats.proTrial * 99 * (trialConversion / 100 || 0.3));
  const revenueProjection = [
    { month: "Now",   revenue: mrr },
    { month: "+1mo",  revenue: Math.round(mrr + projectedMRR * 0.3) },
    { month: "+2mo",  revenue: Math.round(mrr + projectedMRR * 0.6) },
    { month: "+3mo",  revenue: Math.round(mrr + projectedMRR) },
    { month: "+6mo",  revenue: Math.round((mrr + projectedMRR) * 1.8) },
  ];

  // ── CROSS-PLATFORM ACTIVITY FEED ──
  // Combines users, auditLog, leads, verifications into one sorted feed
  const activityFeed = (() => {
    const items = [];
    // New signups
    [...users]
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .slice(0, 5)
      .forEach(u => items.push({
        type: "signup", uid: u.uid, user: u,
        time: u.createdAt, icon: "user",
        label: `${u.name || u.email?.split("@")[0] || "New user"} signed up`,
        sub: u.tier || "free", color: T.gold,
      }));
    // Tier upgrades & downgrades from auditLog
    auditLog.slice(0, 20).forEach(l => {
      if (l.action !== "tier_change") return;
      const u = users.find(x => x.uid === l.uid);
      const isUpgrade = (l.to === "pro" || l.to === "enterprise") && (l.from === "free" || l.from === "pro_trial");
      const isDowngrade = (l.from === "pro" || l.from === "enterprise") && (l.to === "free" || l.to === "pro_trial");
      if (!isUpgrade && !isDowngrade) return;
      items.push({
        type: isUpgrade ? "upgrade" : "downgrade",
        uid: l.uid, user: u,
        time: l.changedAt, icon: isUpgrade ? "⬆️" : "⬇️",
        label: `${u?.name || u?.email?.split("@")[0] || "User"} ${isUpgrade ? "upgraded to" : "downgraded to"} ${l.to}`,
        sub: isUpgrade ? l.to : l.to, color: isUpgrade ? T.green : T.red,
      });
    });
    // New leads
    leads.slice(0, 3).forEach(l => items.push({
      type: "lead", uid: null, user: null,
      time: l.createdAt, icon: "lead",
      label: `New lead: ${l.name || l.email || "Anonymous"}`,
      sub: l.source || "website", color: T.teal,
    }));
    // Pending verifications
    verifications.filter(v => v.status === "pending").slice(0, 3).forEach(v => items.push({
      type: "verification", uid: v.userId, user: null,
      time: v.submittedAt, icon: "kyc",
      label: `KYC submitted by ${v.name || v.email || "User"}`,
      sub: "Pending review", color: "#F59E0B",
    }));
    // Sort by time descending, take top 10
    return items
      .filter(i => i.time)
      .sort((a, b) => new Date(b.time) - new Date(a.time))
      .slice(0, 10);
  })();

  /* ─── DATA MANAGER ACTIONS ─── */
  
  
  const uploadProjectImage = async (projectId, file) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { notify("Image must be under 5MB"); return; }
    notify("Uploading image...");
    try {
      const storageRef = ref(storage, "projects/" + projectId + "/" + file.name);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      await setDoc(doc(db, "projectData", String(projectId)), { imageUrl: url, updatedAt: new Date().toISOString(), updatedBy: adminUser?.email }, { merge: true });
      notify("Image uploaded!");
      fetchLiveData();
    } catch(e) { notify("Upload error: " + e.message); }
  };

  
  const deleteProject = async (projectId) => {
    if (!window.confirm("Delete this project? This cannot be undone.")) return;
    try {
      const { deleteDoc, doc: dDoc } = await import("firebase/firestore");
      await deleteDoc(dDoc(db, "projectData", String(projectId)));
      notify("Project deleted");
      setEditingProject(null);
      fetchLiveData();
    } catch(e) { notify("Error: " + e.message); }
  };

  
  const exportProjectsExcel = () => {
    const headers = ["ID","Name","Community","Price","PPSF","Status","Handover","Type","Beds","Payment Plan","Construction %","Units Total","Units Available","Image URL","Brochure PDF","Floor Plan PDF","Payment Plan PDF","Video URL","External Link","Notes"];
    const rows = emaarProjects.map(p => {
      const m = getMergedProject(p);
      return [p.id, p.name, p.community, m.price||"", m.ppsf||"", m.status||"", m.handover||"", m.type||"", m.beds||"", m.paymentPlan||"", m.construction||"", m.unitsTotal||"", m.unitsAvail||"", m.imageUrl||"", m.pdfBrochure||"", m.pdfFloorPlan||"", m.pdfPaymentPlan||"", m.videoUrl||"", m.externalLink||"", (m.notes||"").replace(/,/g," ")];
    });
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "emaar-projects-full-" + new Date().toISOString().slice(0,10) + ".csv";
    a.click();
    notify("Full export downloaded!");
  };

  
  const saveBulkEdit = async () => {
    if (bulkSelected.length === 0) { notify("No projects selected"); return; }
    if (Object.keys(bulkForm).length === 0) { notify("No changes to apply"); return; }
    setDataSaving(true);
    try {
      for (const id of bulkSelected) {
        const clean = { ...bulkForm, updatedAt: new Date().toISOString(), updatedBy: adminUser?.email };
        await setDoc(doc(db, "projectData", String(id)), clean, { merge: true });
      }
      notify(bulkSelected.length + " projects updated!");
      setBulkSelected([]);
      setBulkEdit(false);
      setBulkForm({});
      fetchLiveData();
    } catch(e) { notify("Error: " + e.message); }
    setDataSaving(false);
  };

  
  const sendAlertEmail = async (userEmail, userName, projectName, changeType, newValue, oldValue) => {
    try {
      await emailjs.send(
        "service_da7nshv",
        "template_gl1xqhy",
        {
          user_email: userEmail,
          user_name: userName || "Subscriber",
          project_name: projectName,
          change_type: changeType,
          new_value: String(newValue),
          old_value: String(oldValue || "N/A"),
          updated_at: new Date().toLocaleString("en-AE"),
        },
        "USkwUhp0csGCVDkdQ"
      );
      console.log("Alert sent to", userEmail);
    } catch(e) { console.log("Email error:", e); }
  };

  const sendAlertsToAllUsers = async (projectName, changeType, newValue, oldValue) => {
    try {
      const { getDocs, collection: col } = await import("firebase/firestore");
      const snap = await getDocs(col(db, "users"));
      const proUsers = snap.docs.filter(d => d.data().plan === "pro" || d.data().plan === "Pro").map(d => d.data());
      for (const user of proUsers) {
        if (user.email) await sendAlertEmail(user.email, user.name || user.displayName, projectName, changeType, newValue, oldValue);
      }
      if (proUsers.length > 0) notify("Alerts sent to " + proUsers.length + " users!");
    } catch(e) { console.log("Alert error:", e); }
  };

  
  const fetchPriceHistory = async (projectId) => {
    try {
      const { getDocs, collection: col, query, where, orderBy, limit } = await import("firebase/firestore");
      const q = query(col(db, "priceHistory"), where("projectId", "==", String(projectId)), orderBy("recordedAt", "asc"), limit(24));
      const snap = await getDocs(q);
      const data = snap.docs.map(d => d.data());
      setPriceHistory(prev => ({ ...prev, [projectId]: data }));
    } catch(e) { console.log("fetchPriceHistory error:", e); }
  };

  const validateProjectData = (data, isNew = false) => {
    const errors = [];
    if (isNew && !data.name) errors.push("Project name is required");
    if (isNew && !data.community) errors.push("Community is required");
    if (data.price && (isNaN(data.price) || Number(data.price) <= 0)) errors.push("Price must be a positive number");
    if (data.ppsf && (isNaN(data.ppsf) || Number(data.ppsf) <= 0)) errors.push("Price per sqft must be positive");
    if (data.unitsAvail && data.unitsTotal && Number(data.unitsAvail) > Number(data.unitsTotal)) errors.push("Available units cannot exceed total units");
    if (data.construction && (Number(data.construction) < 0 || Number(data.construction) > 100)) errors.push("Construction must be 0-100");
    return errors;
  };

  const saveProjectData = async (projectId, data) => {
    const errors = validateProjectData(data);
    if (errors.length > 0) { notify("Error: " + errors[0]); return; }
    setDataSaving(true);
    try {
      const clean = {};
      Object.entries(data).forEach(([k, v]) => {
        if (v !== "" && v !== undefined && v !== null) {
          clean[k] = typeof v === "string" && !isNaN(v) && v.trim() !== "" ? Number(v) : v;
        }
      });
      clean.updatedAt = new Date().toISOString();
      clean.updatedBy = adminUser?.email || "admin";
      await setDoc(doc(db, "projectData", String(projectId)), clean, { merge: true });
      try {
        const oldDoc = liveProjects[projectId] || {};
        const diff = {};
        Object.keys(clean).forEach(k => { if (k !== "updatedAt" && k !== "updatedBy" && clean[k] !== oldDoc[k]) diff[k] = { old: oldDoc[k] ?? "—", new: clean[k] }; });
        await setDoc(doc(db, "auditLog", Date.now().toString()), { action: "project_update", projectId, changes: clean, diff, changedBy: adminUser?.email, changedAt: new Date().toISOString() });
      } catch(e) {}
      notify("Project data saved");
        if (clean.price) {
          try {
            await setDoc(doc(db, "priceHistory", String(projectId) + "_" + Date.now()), {
              projectId: String(projectId), pid: String(projectId),
              price: Number(clean.price),
              ppsf: Number(clean.ppsf) || 0,
              recordedAt: new Date().toISOString(),
              recordedBy: adminUser?.email || "admin"
            });
          } catch(e) { console.log("Price history error:", e); }
        }
      if (clean.price) sendAlertsToAllUsers(String(projectId), "Price Updated", "AED " + Number(clean.price).toLocaleString(), "");
      else if (clean.status) sendAlertsToAllUsers(String(projectId), "Status Updated", clean.status, "");
      setEditingProject(null);
      fetchLiveData();
    } catch (e) { notify("Error: Error: " + e.message); }
    setDataSaving(false);
  };

  const saveCommunityROI = async (communityKey, data) => {
    setDataSaving(true);
    try {
      const clean = JSON.parse(JSON.stringify(data));
      clean.updatedAt = new Date().toISOString();
      clean.updatedBy = adminUser?.email || "admin";
      await setDoc(doc(db, "communityROI", communityKey), clean, { merge: true });
      try { await setDoc(doc(db, "auditLog", Date.now().toString()), { action: "community_update", communityKey, changedBy: adminUser?.email, changedAt: new Date().toISOString() }); } catch(e) {}
      notify("Community ROI saved");
      setEditingCommunity(null);
      fetchLiveData();
    } catch (e) { notify("Error: Error: " + e.message); }
    setDataSaving(false);
  };

  const saveYieldData = async (yieldKey, data) => {
    setDataSaving(true);
    try {
      const clean = {};
      Object.entries(data).forEach(([k, v]) => {
        if (v !== "" && v !== undefined && v !== null) {
          clean[k] = typeof v === "string" && !isNaN(v) && v.trim() !== "" ? Number(v) : v;
        }
      });
      clean.updatedAt = new Date().toISOString();
      await setDoc(doc(db, "yieldData", yieldKey), clean, { merge: true });
      notify("Yield data saved");
      setEditingYield(null);
      fetchLiveData();
    } catch (e) { notify("Error: Error: " + e.message); }
    setDataSaving(false);
  };

  const resetProjectData = async (projectId) => {
    if (!window.confirm(`⚠️ RESET PROJECT DATA: ${projectId}\n\nThis will:\n• Remove all live Firestore overrides for this project\n• Dashboard will revert to default data.js values\n• Any custom prices, units, or details you edited will be lost\n\nContinue?`)) return;
    try {
      await deleteDoc(doc(db, "projectData", projectId));
      notify("Reset to defaults");
      fetchLiveData();
    } catch (e) { notify("Error: " + e.message); }
  };

  const resetCommunityROI = async (key) => {
    if (!window.confirm(`⚠️ RESET COMMUNITY ROI: ${key}\n\nThis will:\n• Remove all live yield/ROI overrides for this community\n• Dashboard will show default values from data.js\n• Any custom gross/net yield or rental data will be lost\n\nContinue?`)) return;
    try {
      await deleteDoc(doc(db, "communityROI", key));
      notify("Reset to defaults");
      fetchLiveData();
    } catch (e) { notify("Error: " + e.message); }
  };

  /* Merge live data with defaults */
  const getMergedProject = (p) => ({ ...p, ...(liveProjects[p.id] || {}) });
  const getMergedROI = (key) => ({ ...(defaultCommunityROI[key] || {}), ...(liveCommunityROI[key] || {}) });

  /* ─── ACTIONS ─── */
  const changeTier = async (uid, tier) => {
    try {
      const data = { tier };
      if (tier === "pro_trial") { const end = new Date(); end.setDate(end.getDate() + 7); data.trialEnd = end.toISOString(); }
      await setDoc(doc(db, "users", uid), data, { merge: true });
      notify(`Tier updated to ${tier}`);
      fetchUsers();
    } catch (e) { notify("Error: Error: " + e.message); }
  };

  const deleteUser = async (uid) => {
    const u = users.find(x => x.uid === uid);
    if (!window.confirm(`DELETE USER: ${u?.name || u?.email}\n\nThis permanently removes them from the database and revokes all access.\n\nContinue?`)) return;
    try {
      await deleteDoc(doc(db, "users", uid));
      try { await deleteDoc(doc(db, "watchlists", uid)); } catch(e) {}
      notify("User deleted");
      setExpandedUser(null);
      fetchUsers();
    } catch (e) { notify("Error: " + e.message); }
  };

  const suspendUser = async (uid) => {
    const u = users.find(x => x.uid === uid);
    const isSuspended = u?.suspended;
    if (!window.confirm(`${isSuspended ? "UNSUSPEND" : "SUSPEND"} user: ${u?.name || u?.email}?\n\n${isSuspended ? "They will regain full dashboard access." : "They will be blocked from the dashboard immediately."}`)) return;
    try {
      await setDoc(doc(db, "users", uid), { suspended: !isSuspended, suspendedAt: isSuspended ? null : new Date().toISOString() }, { merge: true });
      notify(`User ${isSuspended ? "unsuspended" : "suspended"}`);
      fetchUsers();
    } catch (e) { notify("Error: " + e.message); }
  };

  const sendResetEmail = async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
      notify(`Password reset email sent to ${email}`);
    } catch (e) { notify("Error: Failed to send reset email"); }
  };

  const extendTrial = async (uid, days) => {
    try {
      const end = new Date();
      end.setDate(end.getDate() + days);
      await setDoc(doc(db, "users", uid), { tier: "pro_trial", trialEnd: end.toISOString() }, { merge: true });
      notify(`Trial extended by ${days} days`);
      fetchUsers();
    } catch (e) { notify("Error: " + e.message); }
  };

  const openEditUser = (u) => {
    setEditingUser(u);
    setEditUserForm({
      name: u.name || "",
      phone: u.phone || "",
      country: u.country || "",
      tier: u.tier || "free",
      trialEnd: u.trialEnd ? u.trialEnd.slice(0, 10) : "",
      notes: u.notes || "",
      role: u.role || "user",
    });
  };

  const saveEditUser = async () => {
    if (!editingUser) return;
    setEditUserLoading(true);
    try {
      const data = { ...editUserForm };
      if (data.trialEnd) data.trialEnd = new Date(data.trialEnd).toISOString();
      await setDoc(doc(db, "users", editingUser.uid), data, { merge: true });
      notify("User updated successfully");
      setEditingUser(null);
      fetchUsers();
    } catch (e) { notify("Error: " + e.message); }
    setEditUserLoading(false);
  };

  const addUserManually = async () => {
    if (!addUserForm.name.trim()) { notify("Error: Name is required"); return; }
    if (!addUserForm.email.trim()) { notify("Error: Email is required"); return; }
    if (!addUserForm.password || addUserForm.password.length < 6) { notify("Error: Password must be at least 6 characters"); return; }
    setAddUserLoading(true);
    // FIX #14: Use a secondary Firebase app instance so the admin stays logged in
    let tempApp = null;
    try {
      tempApp = initializeApp(firebaseConfig, "adminCreateUser_" + Date.now());
      const tempAuth = getAuth(tempApp);
      const { createUserWithEmailAndPassword: createTempUser } = await import("firebase/auth");
      const cred = await createTempUser(tempAuth, addUserForm.email.trim(), addUserForm.password);
      const now = new Date();
      const trialEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      await setDoc(doc(db, "users", cred.user.uid), {
        name: addUserForm.name.trim(),
        email: addUserForm.email.trim(),
        phone: (addUserForm.phone || "").trim(),
        country: (addUserForm.country || "").trim(),
        tier: addUserForm.tier || "free",
        role: addUserForm.role || "user",
        notes: (addUserForm.notes || "").trim(),
        createdAt: now.toISOString(),
        trialEnd: addUserForm.tier === "pro_trial" ? trialEnd.toISOString() : null,
        createdByAdmin: adminUser?.email || "admin",
        provider: "admin",
        emailVerified: false,
      });
      notify(`User "${addUserForm.name}" created — admin session preserved`);
      setShowAddUser(false);
      setAddUserForm({ name: "", email: "", password: "", phone: "", country: "", tier: "free", role: "user", notes: "" });
      fetchUsers();
    } catch (e) {
      const msgs = {
        "auth/email-already-in-use": "Email already registered",
        "auth/invalid-email": "Invalid email address",
        "auth/weak-password": "Password too weak (min 6 chars)",
      };
      notify(msgs[e.code] || "Error: " + e.message);
    } finally {
      if (tempApp) { try { await deleteApp(tempApp); } catch(e) {} }
    }
    setAddUserLoading(false);
  };

  
  const saveNewProject = async (form) => {
    const errors = validateProjectData(form, true);
    if (errors.length > 0) { notify("Error: " + errors[0]); return; }
    setDataSaving(true);
    try {
      const newId = "custom_" + Date.now();
      // Write to BOTH collections — projectData for dashboard, projects for reference
      const projectDoc = { ...form, id: newId, createdAt: new Date().toISOString(), createdBy: adminUser?.email, updatedAt: new Date().toISOString(), updatedBy: adminUser?.email, isCustom: true };
      await setDoc(doc(db, "projectData", String(newId)), projectDoc);
      await setDoc(doc(db, "projects", String(newId)), projectDoc);
      await setDoc(doc(db, "auditLog", Date.now().toString()), { action: "project_create", projectId: newId, changes: form, changedBy: adminUser?.email, changedAt: new Date().toISOString() });
      notify("Project added — live on dashboard!");
      setEditingProject(null);
      setProjectForm({});
      fetchLiveData();
    } catch(e) { notify("Error: Error: " + e.message); }
    setDataSaving(false);
  };

  const importCSV = async (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const lines = ev.target.result.split("\n").filter(Boolean);
      const headers = lines[0].split(",").map(h => h.trim());
      const rows = lines.slice(1).map(l => {
        const vals = l.split(",");
        return headers.reduce((o, h, i) => ({ ...o, [h]: vals[i]?.trim() }), {});
      });
      let saved = 0;
      for (const row of rows) {
        if (row.id) {
          await setDoc(doc(db, "projectData", String(row.id)), row, { merge: true });
          saved++;
        }
      }
      notify(saved + " projects updated from CSV!");
      fetchLiveData();
    };
    reader.readAsText(file);
  };

  const exportCSV = () => {
    const headers = "Name,Email,Tier,Trial Status,Signed Up\n";
    const rows = users.map(u => `${u.name || ""},${u.email || ""},${u.tier || "free"},${u.trialEnd ? (new Date(u.trialEnd) > now ? "Active" : "Expired") : "—"},${u.createdAt || ""}`).join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `dxb-users-${now.toISOString().slice(0, 10)}.csv`; a.click();
    notify("CSV exported");
  };

  const notify = (msg) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  /* ─── FILTERED USERS ─── */
  const filteredUsers = users
    .filter(u => {
      const ms = !userSearch || (u.name || "").toLowerCase().includes(userSearch.toLowerCase()) || (u.email || "").toLowerCase().includes(userSearch.toLowerCase()) || (u.phone || "").toLowerCase().includes(userSearch.toLowerCase());
      let mt = true;
      if (tierFilter === "Free") mt = u.tier === "free" || !u.tier;
      else if (tierFilter === "Pro Trial") mt = u.tier === "pro_trial" && (!u.trialEnd || new Date(u.trialEnd) > now);
      else if (tierFilter === "Pro") mt = u.tier === "pro";
      else if (tierFilter === "Enterprise") mt = u.tier === "enterprise";
      else if (tierFilter === "Expired") mt = u.tier === "pro_trial" && u.trialEnd && new Date(u.trialEnd) <= now;
      else if (tierFilter === "Suspended") mt = !!u.suspended;
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
      <a href="/" style={{ color: T.gold, fontSize: 13, textDecoration: "none", padding: "10px 24px", border: `1px solid ${T.gold}`, borderRadius: 10, fontWeight: 600, transition: "all 0.2s" }}>← Back to Dashboard</a>
    </div>
  );

  /* ─── REUSABLE COMPONENTS ─── */
  /* ─── TABS CONFIG ─── */
  const TABS = [
    { id: "overview", label: "Overview", icon: I.overview },
    { id: "auditlog", label: "Audit Log", icon: I.overview },
    { id: "users", label: "Users", icon: I.users },
    { id: "revenue", label: "Revenue", icon: I.revenue },
    { id: "data", label: "Data Manager", icon: I.data },
    { id: "leads", label: "Leads", icon: I.leads },
    { id: "notifications", label: "Notifications", icon: I.bell },
    { id: "verification", label: "Verification", icon: I.verify },
    { id: "analytics", label: "Analytics", icon: I.analytics },
    { id: "digest", label: "Email Digest", icon: I.bell },
    { id: "eibor", label: "EIBOR Rates", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> },
    { id: "tabcontrol", label: "Tab Control", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="4" rx="1"/><rect x="3" y="10" width="18" height="4" rx="1"/><rect x="3" y="17" width="18" height="4" rx="1"/><line x1="7" y1="5" x2="7" y2="5"/><line x1="7" y1="12" x2="7" y2="12"/><line x1="7" y1="19" x2="7" y2="19"/></svg> },
  ];

  /* ═══════════════════════════════════════
     RENDER
     ═══════════════════════════════════════ */
  return (
    <div style={{ minHeight: "100vh", background: T.bg, fontFamily: "'Outfit',sans-serif", color: T.textPrimary }}>
      <style>{css}</style>

      {/* Toast */}
      {toast && <div key={toast} className="toast-notify" style={{ position: "fixed", bottom: 24, right: 24, padding: "12px 24px", borderRadius: 10, background: (toast.includes("failed") || toast.includes("Error") || toast.includes("required") || toast.includes("registered") || toast.includes("weak") || toast.includes("invalid") || toast.includes("Invalid") || toast.startsWith("Error:")) ? T.red : T.green, color: T.white, fontWeight: 700, fontSize: 13, zIndex: 99999, boxShadow: "0 12px 40px rgba(0,0,0,0.4)" }}>{toast}</div>}

      {/* Mobile overlay */}
      <div className={`mobile-overlay ${sidebarOpen ? "open" : ""}`} onClick={() => setSidebarOpen(false)} />

      {/* ─── SIDEBAR (matching dashboard exactly) ─── */}
      <aside className={`admin-sidebar ${sidebarOpen ? "open" : ""}`} style={{ position: "fixed", top: 0, left: 0, bottom: 0, width: 240, background: T.surface, borderRight: `1px solid ${T.border}`, display: "flex", flexDirection: "column", zIndex: 100, transition: "transform 0.3s ease" }}>
        {/* Logo */}
        <div style={{ padding: "24px 20px 20px", borderBottom: `1px solid ${T.border}` }}>
          <a href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <svg width="32" height="32" viewBox="0 0 40 40">
              <rect x="2" y="2" width="36" height="36" rx="8" fill="none" stroke={T.gold} strokeWidth="2" />
              <path d="M12 28V12h10l-6 8h8l-12 8z" fill={T.gold} />
            </svg>
            <div>
              <div style={{ fontFamily: "'Fraunces',serif", fontSize: 16, fontWeight: 800, color: T.gold }}>DXB Analytics</div>
              <div style={{ fontSize: 9, color: T.textMuted, letterSpacing: 1.5, textTransform: "uppercase" }}>{i18t("sidebar", "adminConsole")}</div>
            </div>
          </a>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: "16px 12px", display: "flex", flexDirection: "column", gap: 3, overflowY: "auto" }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: T.textMuted, letterSpacing: 1.5, textTransform: "uppercase", padding: "0 16px 8px" }}>{i18t("sidebar", "platform")}</div>
          {TABS.map(t => (
            <button type="button" key={t.id} className={`sidebar-btn ${tab === t.id ? "active" : ""}`} onClick={() => setTab(t.id)}>
              <span style={{ color: tab === t.id ? T.gold : T.textMuted, transition: "color 0.15s" }}>{t.icon}</span>
              {i18t("adminTabs", t.id) || t.label}
            </button>
          ))}

          <div style={{ fontSize: 9, fontWeight: 700, color: T.textMuted, letterSpacing: 1.5, textTransform: "uppercase", padding: "16px 16px 8px", marginTop: 8, borderTop: `1px solid ${T.border}` }}>{i18t("sidebar", "quickLinks")}</div>
          <a href="/" className="sidebar-btn" style={{ textDecoration: "none" }}>
            {I.overview} <span>{i18t("sidebar", "dashboard")}</span>
          </a>
        </nav>

        {/* User info */}
        <div style={{ padding: "16px 12px", borderTop: `1px solid ${T.border}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 10, background: T.surfaceAlt }}>
            <div style={{ width: 34, height: 34, borderRadius: "50%", background: `linear-gradient(135deg, ${T.gold}, ${T.goldDim})`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 13, color: T.bg }}>
              {(adminUser?.displayName || adminUser?.email || "A")[0].toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.white, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{adminUser?.displayName || adminUser?.email?.split("@")[0]}</div>
              <div style={{ fontSize: 10, color: T.gold, fontWeight: 600 }}>{i18t("sidebar", "admin")}</div>
            </div>
            <button type="button" onClick={() => setShowProfile(true)} style={{ background: "none", border: `1px solid ${T.border}`, cursor: "pointer", color: T.gold, padding: "3px 8px", borderRadius: 6, fontSize: 10, fontWeight: 600, fontFamily: "'Outfit', sans-serif" }}>{i18t("ui", "profile")}</button>
            <button type="button" onClick={() => signOut(auth)} title="Logout" style={{ background: "none", border: "none", color: T.textMuted, cursor: "pointer", padding: 4 }}>{I.logout}</button>
          </div>
        </div>
      </aside>

      {/* ─── MAIN CONTENT ─── */}
      <main dir={dir} className="admin-main" style={{ marginLeft: 240, minHeight: "100vh" }}>
        {/* Top bar (matching dashboard) */}
        <header className="admin-topbar" style={{ position: "sticky", top: 0, zIndex: 20, height: 60, background: `${T.surface}ee`, backdropFilter: "blur(16px)", borderBottom: `1px solid ${T.border}`, padding: "0 28px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <a href="/" style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 34, height: 34, borderRadius: 8, background: T.surfaceAlt, border: `1px solid ${T.border}`, color: T.textSecondary, textDecoration: "none", transition: "all 0.2s" }} title="Back to Dashboard" onClick={(e) => { e.preventDefault(); window.location.href = "/"; }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = T.gold; e.currentTarget.style.color = T.gold; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.textSecondary; }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
            </a>
            <button type="button" className="admin-mobile-btn" onClick={() => setSidebarOpen(!sidebarOpen)} style={{ display: "none", alignItems: "center", justifyContent: "center", width: 34, height: 34, borderRadius: 8, background: T.surfaceAlt, border: `1px solid ${T.border}`, color: T.textSecondary, cursor: "pointer" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            </button>
            <div>
              <h1 style={{ fontSize: 16, fontWeight: 700, color: T.white }}>{i18t("sidebar", "adminConsole")}</h1>
              <p style={{ fontSize: 10, color: T.textMuted, letterSpacing: 1 }}>{new Date().toLocaleDateString("en-AE", { weekday: "short", day: "numeric", month: "short", year: "numeric" })} · {stats.total} users</p>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ background: T.surfaceAlt, borderRadius: 10, padding: "6px 12px", border: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: T.green, animation: "pulse 2s infinite" }} />
              <span style={{ fontSize: 11, fontWeight: 600, color: T.green }}>● LIVE</span>
            </div>
            <div style={{ background: T.surfaceAlt, borderRadius: 10, padding: "6px 12px", border: `1px solid ${T.border}` }}>
              <span style={{ fontSize: 10, color: T.textMuted }}>MRR </span>
              <span style={{ fontSize: 12, fontWeight: 700, color: T.gold, fontFamily: "'Fraunces',serif" }}>AED {mrr.toLocaleString()}</span>
            </div>
            <div style={{ background: T.surfaceAlt, borderRadius: 10, padding: "6px 12px", border: `1px solid ${T.border}` }}>
              <span style={{ fontSize: 10, color: T.textMuted }}>PAID </span>
              <span style={{ fontSize: 12, fontWeight: 700, color: T.teal }}>{stats.paid}</span>
            </div>
            {/* Language Picker */}
            <div style={{ position: "relative" }}>
              <button type="button" onClick={() => setShowLangPicker(!showLangPicker)} style={{ background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 10, padding: "6px 10px", cursor: "pointer", color: T.textSecondary, display: "flex", alignItems: "center", gap: 5, fontSize: 11, fontFamily: "'Outfit',sans-serif", fontWeight: 600, transition: "all 0.2s" }} onMouseEnter={e => e.currentTarget.style.borderColor = T.gold} onMouseLeave={e => e.currentTarget.style.borderColor = T.border}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                {langInfo.name}
              </button>
              {showLangPicker && (
                <>
                  <div style={{ position: "fixed", inset: 0, zIndex: 99998 }} onClick={() => setShowLangPicker(false)} />
                  <div style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, width: 280, maxHeight: 420, overflowY: "auto", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, boxShadow: "0 20px 60px rgba(0,0,0,0.5)", zIndex: 9999, padding: 8 }}>
                    <div style={{ padding: "8px 12px 6px", fontSize: 9, fontWeight: 700, color: T.textMuted, letterSpacing: 1.5, textTransform: "uppercase" }}>{i18t("sections", "language")}</div>
                    {LANGUAGES.map(l => (
                      <button type="button" key={l.code} onClick={() => { setLang(l.code); setShowLangPicker(false); }}
                        style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 8, border: "none", background: lang === l.code ? T.goldGlow : "transparent", cursor: "pointer", fontFamily: "'Outfit',sans-serif", transition: "all 0.15s", textAlign: "left" }}
                        onMouseEnter={e => { if (lang !== l.code) e.currentTarget.style.background = T.surfaceAlt; }}
                        onMouseLeave={e => { if (lang !== l.code) e.currentTarget.style.background = "transparent"; }}>
                        <span style={{ fontSize: 18, width: 28, textAlign: "center" }}>{l.flag}</span>
                        <span style={{ fontSize: 12, fontWeight: lang === l.code ? 700 : 500, color: lang === l.code ? T.gold : T.white }}>{l.name}</span>
                        {l.dir === "rtl" && <span style={{ fontSize: 8, color: T.textMuted, marginLeft: "auto", padding: "2px 6px", borderRadius: 4, background: T.surfaceAlt }}>RTL</span>}
                        {lang === l.code && <span style={{ marginLeft: "auto", color: T.gold }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg></span>}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <div  style={{ padding: "28px 28px 60px" }}>

          {/* ═══════════════════════════════════════
             OVERVIEW TAB
             ═══════════════════════════════════════ */}
          {tab === "overview" && (
            <>

              {/* ══ OVERVIEW TOPBAR — health + alerts + actions in one row ══ */}
              {(() => {
                const urgentAlerts = [
                  stats.atRisk > 0 && { key: "atrisk", color: T.red, icon: "⚠️", label: `${stats.atRisk} at risk`, action: () => {
                    stats.atRiskUsers.forEach(u => {
                      const days = trialDaysLeft(u);
                      emailjs.send("service_da7nshv", "template_gl1xqhy", { user_email: u.email, user_name: u.name || u.email, project_name: "DXB Analytics", change_type: `⚠️ Trial Expiring in ${days} Day${days !== 1 ? "s" : ""}`, new_value: `Only ${days} day${days !== 1 ? "s" : ""} left. Upgrade now.`, old_value: "Pro Trial", updated_at: new Date().toLocaleString("en-AE") }, "USkwUhp0csGCVDkdQ").catch(() => {});
                    });
                    notify(`Sent ${stats.atRisk} at-risk emails`);
                  }},
                  stats.suspended > 0 && { key: "suspended", color: "#F59E0B", icon: "⏸", label: `${stats.suspended} suspended`, action: () => { setTab("users"); setTierFilter("Suspended"); } },
                  stats.expired > 0   && { key: "expired",   color: T.textMuted, icon: "⌛", label: `${stats.expired} expired`,   action: () => { setTab("users"); setTierFilter("Expired"); } },
                  pendingVerifications > 0 && { key: "verif", color: "#8B5CF6", icon: "kyc", label: `${pendingVerifications} KYC`,  action: () => setTab("verification") },
                  newLeadsToday > 0   && { key: "leads",  color: T.teal,    icon: "lead", label: `${newLeadsToday} leads`,     action: () => setTab("leads") },
                ].filter(Boolean);

                return (
                  <div className="fade-up" style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", borderRadius: 14, background: T.surface, border: `1px solid ${T.border}`, marginBottom: 18, flexWrap: "wrap" }}>

                    {/* Health indicator — left */}
                    <div style={{ display: "flex", alignItems: "center", gap: 8, paddingRight: 14, borderRight: `1px solid ${T.border}`, flexShrink: 0 }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: healthColor, boxShadow: `0 0 6px ${healthColor}` }} />
                      <span style={{ fontSize: 12, fontWeight: 700, color: healthColor }}>{healthLabel}</span>
                      <span style={{ fontSize: 11, color: T.textMuted }}>· Score {healthScore}</span>
                    </div>

                    {/* Alert chips — center, only shown if issues exist */}
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flex: 1, flexWrap: "wrap" }}>
                      {urgentAlerts.length === 0 ? (
                        <span style={{ fontSize: 11, color: T.textMuted }}>No urgent items</span>
                      ) : (
                        urgentAlerts.map(a => (
                          <button key={a.key} type="button" onClick={a.action}
                            style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 20, border: `1px solid ${a.color}40`, background: `${a.color}10`, color: a.color, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "'Outfit',sans-serif", whiteSpace: "nowrap" }}>
                            {a.label}
                          </button>
                        ))
                      )}
                    </div>

                    {/* Refresh only — actions belong in their respective tabs */}
                    <button type="button" onClick={() => { fetchUsers(); fetchLeads(); fetchVerifications(); fetchAuditLog(); notify("Refreshed"); }}
                      style={{ width: 30, height: 30, borderRadius: 8, border: `1px solid ${T.border}`, background: "transparent", color: T.textMuted, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
                      title="Refresh all data">
                      ↻
                    </button>

                  </div>
                );
              })()}
              {/* ══ STEP 3 — KPI CARDS WITH TRENDS ══ */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <div style={{ borderLeft: `3px solid ${T.gold}`, paddingLeft: 14 }}>
                    <h2 style={{ fontFamily: "'Fraunces',serif", fontSize: 20, fontWeight: 800, color: T.white, margin: 0 }}>Platform Overview</h2>
                    <p style={{ fontSize: 12, color: T.textSecondary, margin: "3px 0 0" }}>Real-time platform health & key metrics</p>
                  </div>
                </div>
                <div className="kpi-grid-overview" style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 10 }}>

                  {/* 1 — MRR */}
                  <div className="kpi-card fade-up" style={{ animationDelay: "0.00s", cursor: "default" }}>
                    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: T.green, opacity: 0.7, borderRadius: "16px 16px 0 0" }} />
                    <div style={{ fontSize: 9, fontWeight: 700, color: T.textMuted, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 8 }}>MRR</div>
                    <div style={{ fontFamily: "'Fraunces',serif", fontSize: 22, fontWeight: 900, color: T.green, lineHeight: 1 }}>AED {mrr.toLocaleString()}</div>
                    <div style={{ fontSize: 10, color: T.textMuted, marginTop: 6 }}>ARR: AED {arr.toLocaleString()}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 5 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: mrrTrend.dir === "up" ? T.green : mrrTrend.dir === "down" ? T.red : T.textMuted }}>
                        {mrrTrend.dir === "up" ? "↑" : mrrTrend.dir === "down" ? "↓" : "—"} {mrrTrend.label}
                      </span>
                      <span style={{ fontSize: 9, color: T.textMuted }}>vs last week</span>
                    </div>
                  </div>

                  {/* 2 — Total Users */}
                  <div className="kpi-card fade-up" style={{ animationDelay: "0.04s", cursor: "pointer" }} onClick={() => setTab("users")}>
                    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: T.gold, opacity: 0.7, borderRadius: "16px 16px 0 0" }} />
                    <div style={{ fontSize: 9, fontWeight: 700, color: T.textMuted, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 8 }}>Total Users</div>
                    <div style={{ fontFamily: "'Fraunces',serif", fontSize: 22, fontWeight: 900, color: T.gold, lineHeight: 1 }}>{stats.total}</div>
                    <div style={{ fontSize: 10, color: T.textMuted, marginTop: 6 }}>+{stats.today} today</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 5 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: usersTrend.dir === "up" ? T.green : usersTrend.dir === "down" ? T.red : T.textMuted }}>
                        {usersTrend.dir === "up" ? "↑" : usersTrend.dir === "down" ? "↓" : "—"} {usersTrend.label}
                      </span>
                      <span style={{ fontSize: 9, color: T.textMuted }}>vs last week</span>
                    </div>
                    <div style={{ fontSize: 9, color: T.gold, marginTop: 4, opacity: 0.7 }}>click to view →</div>
                  </div>

                  {/* 3 — Paid Users */}
                  <div className="kpi-card fade-up" style={{ animationDelay: "0.08s", cursor: "pointer" }} onClick={() => { setTab("users"); setTierFilter("Pro"); }}>
                    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: T.teal, opacity: 0.7, borderRadius: "16px 16px 0 0" }} />
                    <div style={{ fontSize: 9, fontWeight: 700, color: T.textMuted, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 8 }}>Paid Users</div>
                    <div style={{ fontFamily: "'Fraunces',serif", fontSize: 22, fontWeight: 900, color: T.teal, lineHeight: 1 }}>{stats.paid}</div>
                    <div style={{ fontSize: 10, color: T.textMuted, marginTop: 6 }}>{stats.pro} Pro · {stats.enterprise} Ent</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 5 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: T.teal }}>{stats.total > 0 ? Math.round((stats.paid / stats.total) * 100) : 0}%</span>
                      <span style={{ fontSize: 9, color: T.textMuted }}>conversion rate</span>
                    </div>
                    <div style={{ fontSize: 9, color: T.teal, marginTop: 4, opacity: 0.7 }}>click to view →</div>
                  </div>

                  {/* 4 — Active Trials */}
                  <div className="kpi-card fade-up" style={{ animationDelay: "0.12s", cursor: "pointer" }} onClick={() => { setTab("users"); setTierFilter("Pro Trial"); }}>
                    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: T.gold, opacity: 0.5, borderRadius: "16px 16px 0 0" }} />
                    <div style={{ fontSize: 9, fontWeight: 700, color: T.textMuted, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 8 }}>Active Trials</div>
                    <div style={{ fontFamily: "'Fraunces',serif", fontSize: 22, fontWeight: 900, color: T.gold, lineHeight: 1 }}>{stats.proTrial}</div>
                    <div style={{ fontSize: 10, color: stats.atRisk > 0 ? T.red : T.textMuted, marginTop: 6, fontWeight: stats.atRisk > 0 ? 700 : 400 }}>
                      {stats.atRisk > 0 ? `${stats.atRisk} at risk` : "No at-risk trials"}
                    </div>
                    <div style={{ fontSize: 10, color: T.textMuted, marginTop: 4 }}>{stats.expired} expired</div>
                    <div style={{ fontSize: 9, color: T.gold, marginTop: 4, opacity: 0.7 }}>click to view →</div>
                  </div>

                  {/* 5 — Trial Conversion */}
                  <div className="kpi-card fade-up" style={{ animationDelay: "0.16s", cursor: "default" }}>
                    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "#3B82F6", opacity: 0.7, borderRadius: "16px 16px 0 0" }} />
                    <div style={{ fontSize: 9, fontWeight: 700, color: T.textMuted, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 8 }}>Trial → Paid</div>
                    <div style={{ fontFamily: "'Fraunces',serif", fontSize: 22, fontWeight: 900, color: "#3B82F6", lineHeight: 1 }}>{trialConversion}%</div>
                    <div style={{ fontSize: 10, color: T.textMuted, marginTop: 6 }}>{stats.pro} converted</div>
                    <div style={{ fontSize: 10, color: T.textMuted, marginTop: 4 }}>{stats.expired} expired</div>
                    <div style={{ marginTop: 6, height: 3, borderRadius: 2, background: T.surfaceAlt }}>
                      <div style={{ width: `${trialConversion}%`, height: "100%", borderRadius: 2, background: "#3B82F6", transition: "width 0.6s ease" }} />
                    </div>
                  </div>

                  {/* 6 — ARPU */}
                  <div className="kpi-card fade-up" style={{ animationDelay: "0.20s", cursor: "default" }}>
                    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "#8B5CF6", opacity: 0.7, borderRadius: "16px 16px 0 0" }} />
                    <div style={{ fontSize: 9, fontWeight: 700, color: T.textMuted, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 8 }}>ARPU</div>
                    <div style={{ fontFamily: "'Fraunces',serif", fontSize: 22, fontWeight: 900, color: "#8B5CF6", lineHeight: 1 }}>AED {arpu}</div>
                    <div style={{ fontSize: 10, color: T.textMuted, marginTop: 6 }}>per paying user</div>
                    <div style={{ fontSize: 10, color: T.textMuted, marginTop: 4 }}>AED {arpuAll} all users</div>
                  </div>

                  {/* 7 — Active Today */}
                  <div className="kpi-card fade-up" style={{ animationDelay: "0.24s", cursor: "pointer" }} onClick={() => setTab("users")}>
                    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: T.teal, opacity: 0.5, borderRadius: "16px 16px 0 0" }} />
                    <div style={{ fontSize: 9, fontWeight: 700, color: T.textMuted, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 8 }}>Active Today</div>
                    <div style={{ fontFamily: "'Fraunces',serif", fontSize: 22, fontWeight: 900, color: T.teal, lineHeight: 1 }}>{stats.activeToday}</div>
                    <div style={{ fontSize: 10, color: T.textMuted, marginTop: 6 }}>{stats.activeThisWeek} this week</div>
                    <div style={{ fontSize: 10, color: T.textMuted, marginTop: 4 }}>{stats.total > 0 ? Math.round((stats.activeToday / stats.total) * 100) : 0}% of all users</div>
                    <div style={{ fontSize: 9, color: T.teal, marginTop: 4, opacity: 0.7 }}>click to view →</div>
                  </div>

                </div>
              </div>

              {/* ══ STEP 4 — THREE CHARTS ══ */}

              {/* Row 1: Signup Timeline (wide) + Tier Donut (narrow) */}
              <div className="charts-row-overview" style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 14, marginBottom: 14 }}>

                {/* Chart 1 — Signup Timeline with last-week comparison */}
                <div className="chart-box fade-up" style={{ padding: 20 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: T.white }}>Signup Timeline</div>
                      <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>14 days · vs prior week</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 11 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <div style={{ width: 10, height: 10, borderRadius: 2, background: T.gold }} />
                        <span style={{ color: T.textSecondary }}>This week</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <div style={{ width: 10, height: 3, borderRadius: 2, background: T.textMuted }} />
                        <span style={{ color: T.textMuted }}>Last week</span>
                      </div>
                      <div style={{ padding: "3px 10px", borderRadius: 6, background: signupTrend.dir === "up" ? "rgba(16,185,129,0.1)" : signupTrend.dir === "down" ? "rgba(239,68,68,0.1)" : T.surfaceAlt, fontSize: 11, fontWeight: 700, color: signupTrend.dir === "up" ? T.green : signupTrend.dir === "down" ? T.red : T.textMuted }}>
                        {signupTrend.dir === "up" ? "↑" : signupTrend.dir === "down" ? "↓" : ""} {signupThisWeek} vs {signupLastWeek} last week
                      </div>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={signupTimeline} barGap={2}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                      <XAxis dataKey="date" tick={{ fill: T.textMuted, fontSize: 9 }} axisLine={false} tickLine={false} interval={1} angle={-30} textAnchor="end" height={36} />
                      <YAxis tick={{ fill: T.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} width={24} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="count" fill={T.gold} name="This week" radius={[3, 3, 0, 0]} barSize={14} />
                      <Bar dataKey="lastWeek" fill={T.textMuted} name="Last week" radius={[3, 3, 0, 0]} barSize={14} opacity={0.45} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Chart 2 — Tier Donut with total in centre, clickable slices */}
                <div className="chart-box fade-up" style={{ padding: 20 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.white, marginBottom: 4 }}>Tier Distribution</div>
                  <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 10 }}>Click a slice to filter users</div>
                  <div style={{ position: "relative" }}>
                    <ResponsiveContainer width="100%" height={160}>
                      <PieChart>
                        <Pie
                          data={tierData}
                          cx="50%" cy="50%"
                          innerRadius={48} outerRadius={72}
                          paddingAngle={3} dataKey="value" stroke="none"
                          onClick={(d) => {
                            const map = { "Pro Trial": "Pro Trial", "Free": "Free", "Pro": "Pro", "Enterprise": "Enterprise", "Expired": "Expired" };
                            if (map[d.name]) { setTab("users"); setTierFilter(map[d.name]); }
                          }}
                          style={{ cursor: "pointer" }}
                        >
                          {tierData.map((d, i) => <Cell key={i} fill={d.color} />)}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                    {/* Total in centre */}
                    <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", textAlign: "center", pointerEvents: "none" }}>
                      <div style={{ fontFamily: "'Fraunces',serif", fontSize: 20, fontWeight: 900, color: T.white, lineHeight: 1 }}>{stats.total}</div>
                      <div style={{ fontSize: 9, color: T.textMuted, marginTop: 2 }}>total</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", marginTop: 8 }}>
                    {tierData.map(d => (
                      <div key={d.name} onClick={() => { setTab("users"); setTierFilter(d.name); }}
                        style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10, cursor: "pointer", padding: "3px 8px", borderRadius: 6, background: `${d.color}10`, border: `1px solid ${d.color}30` }}>
                        <div style={{ width: 7, height: 7, borderRadius: 2, background: d.color, flexShrink: 0 }} />
                        <span style={{ color: T.textSecondary }}>{d.name}</span>
                        <span style={{ color: d.color, fontWeight: 700 }}>{d.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Row 2: MRR Movement chart (full width) */}
              <div className="chart-box fade-up" style={{ padding: 20, marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.white }}>MRR Movement — This Month</div>
                    <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>New revenue vs churn vs net</div>
                  </div>
                  <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 9, color: T.textMuted, textTransform: "uppercase", letterSpacing: 1 }}>New MRR</div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: T.green, fontFamily: "'Fraunces',serif" }}>+AED {newMRRThisMonth.toLocaleString()}</div>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 9, color: T.textMuted, textTransform: "uppercase", letterSpacing: 1 }}>Churned</div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: churnedMRR > 0 ? T.red : T.textMuted, fontFamily: "'Fraunces',serif" }}>-AED {churnedMRR.toLocaleString()}</div>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 9, color: T.textMuted, textTransform: "uppercase", letterSpacing: 1 }}>Net MRR</div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: netMRR >= 0 ? T.green : T.red, fontFamily: "'Fraunces',serif" }}>{netMRR >= 0 ? "+" : ""}AED {netMRR.toLocaleString()}</div>
                    </div>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={mrrMovement} layout="vertical" margin={{ left: 20, right: 30 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                    <XAxis type="number" tick={{ fill: T.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `AED ${v}`} />
                    <YAxis type="category" dataKey="label" tick={{ fill: T.textSecondary, fontSize: 11 }} axisLine={false} tickLine={false} width={110} />
                    <Tooltip content={<CustomTooltip />} formatter={v => [`AED ${Math.abs(v).toLocaleString()}`, ""]} />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={22}>
                      {mrrMovement.map((entry, i) => (
                        <Cell key={i} fill={
                          entry.label === "New MRR" ? T.green :
                          entry.label === "Churned MRR" ? T.red :
                          entry.label === "Net MRR" ? (netMRR >= 0 ? T.teal : T.red) :
                          T.textMuted
                        } />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Recent Signups — kept, now with empty state */}
              <div className="chart-box fade-up" style={{ padding: 0, overflow: "hidden", marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: `1px solid ${T.border}` }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.white }}>Recent Signups</div>
                    <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>Latest platform registrations</div>
                  </div>
                  <button type="button" onClick={() => setTab("users")} style={{ fontSize: 11, padding: "6px 14px", borderRadius: 8, border: `1px solid ${T.gold}`, background: "transparent", color: T.gold, cursor: "pointer", fontFamily: "'Outfit',sans-serif", fontWeight: 600 }}>View All →</button>
                </div>
                {users.length === 0 ? (
                  <div style={{ padding: "32px 20px", textAlign: "center", color: T.textMuted, fontSize: 13 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(100,116,139,0.1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", color: "#64748B" }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div>
                    No users yet. <span style={{ color: T.gold, cursor: "pointer" }} onClick={() => setTab("users")}>Add the first user →</span>
                  </div>
                ) : (
                  [...users].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)).slice(0, 5).map((u, i, arr) => {
                    const badge = tierBadge(u);
                    return (
                      <div key={u.uid} className="fade-up" onClick={() => setTab("users")}
                        style={{ display: "flex", alignItems: "center", padding: "13px 20px", borderBottom: i < arr.length - 1 ? `1px solid ${T.border}` : "none", animationDelay: `${i * 0.05}s`, gap: 14, cursor: "pointer", transition: "background 0.15s" }}
                        onMouseEnter={e => e.currentTarget.style.background = T.surfaceAlt}
                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                        <div style={{ width: 34, height: 34, borderRadius: 10, background: `linear-gradient(135deg, ${badge.color}30, ${badge.color}10)`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 13, color: badge.color, flexShrink: 0 }}>
                          {(u.name || u.email || "?")[0].toUpperCase()}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: T.white }}>{u.name || u.email?.split("@")[0] || "Unknown"}</div>
                          <div style={{ fontSize: 11, color: T.textMuted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.email}</div>
                        </div>
                        <span style={{ fontSize: 10, fontWeight: 600, padding: "3px 9px", borderRadius: 6, background: badge.bg, color: badge.color, flexShrink: 0 }}>{badge.label}</span>
                        <span style={{ fontSize: 11, color: T.textMuted, flexShrink: 0 }}>{timeSince(u.createdAt)}</span>
                      </div>
                    );
                  })
                )}
              </div>

              {/* ══ STEP 5 — CROSS-PLATFORM ACTIVITY FEED ══ */}
              <div className="chart-box fade-up" style={{ padding: 0, overflow: "hidden", marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: `1px solid ${T.border}` }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.white }}>Activity Feed</div>
                    <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>Signups · tier changes · leads · verifications</div>
                  </div>
                  <div style={{ fontSize: 10, color: T.textMuted }}>{activityFeed.length} recent events</div>
                </div>

                {activityFeed.length === 0 ? (
                  <div style={{ padding: "36px 20px", textAlign: "center" }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(100,116,139,0.1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", color: "#64748B" }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-6l-2 3H10l-2-3H2"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg></div>
                    <div style={{ fontSize: 13, color: T.textMuted }}>No recent activity yet.</div>
                    <div style={{ fontSize: 11, color: T.textMuted, marginTop: 4 }}>Events will appear here as users sign up, upgrade, and interact.</div>
                  </div>
                ) : (
                  activityFeed.map((item, i) => (
                    <div key={`${item.type}-${i}`}
                      className="fade-up"
                      onClick={() => {
                        if (item.uid) { setTab("users"); setPendingOpenUid(item.uid); }
                        else if (item.type === "lead") setTab("leads");
                        else if (item.type === "verification") setTab("verification");
                      }}
                      style={{
                        display: "flex", alignItems: "center", gap: 14,
                        padding: "12px 20px",
                        borderBottom: i < activityFeed.length - 1 ? `1px solid ${T.border}` : "none",
                        cursor: item.uid || item.type === "lead" || item.type === "verification" ? "pointer" : "default",
                        transition: "background 0.15s",
                        animationDelay: `${i * 0.04}s`,
                      }}
                      onMouseEnter={e => { if (item.uid || item.type === "lead" || item.type === "verification") e.currentTarget.style.background = T.surfaceAlt; }}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                    >
                      {/* Icon bubble */}
                      <div style={{ width: 34, height: 34, borderRadius: 10, background: `${item.color}15`, border: `1px solid ${item.color}25`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, flexShrink: 0 }}>
                        {item.icon}
                      </div>

                      {/* Label + sub */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: T.white, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.label}</div>
                        <div style={{ fontSize: 10, color: T.textMuted, marginTop: 2 }}>{item.sub}</div>
                      </div>

                      {/* Type badge */}
                      <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 5, background: `${item.color}15`, color: item.color, textTransform: "uppercase", letterSpacing: 0.8, flexShrink: 0 }}>
                        {item.type === "signup" ? "New User" : item.type === "upgrade" ? "Upgrade" : item.type === "downgrade" ? "Downgrade" : item.type === "lead" ? "Lead" : "KYC"}
                      </span>

                      {/* Time */}
                      <span style={{ fontSize: 10, color: T.textMuted, flexShrink: 0 }}>{timeSince(item.time)}</span>
                    </div>
                  ))
                )}
              </div>

            </>
          )}

          {/* ═══════════════════════════════════════
             USERS TAB
             ═══════════════════════════════════════ */}
          {tab === "users" && <UsersTab users={users} filteredUsers={filteredUsers} fetchUsers={fetchUsers} changeTier={changeTier} deleteUser={deleteUser} suspendUser={suspendUser} sendResetEmail={sendResetEmail} extendTrial={extendTrial} openEditUser={openEditUser} saveEditUser={saveEditUser} editingUser={editingUser} setEditingUser={setEditingUser} editUserForm={editUserForm} setEditUserForm={setEditUserForm} editUserLoading={editUserLoading} showAddUser={showAddUser} setShowAddUser={setShowAddUser} addUserForm={addUserForm} setAddUserForm={setAddUserForm} addUserManually={addUserManually} addUserLoading={addUserLoading} exportCSV={exportCSV} userSearch={userSearch} setUserSearch={setUserSearch} tierFilter={tierFilter} setTierFilter={setTierFilter} notify={notify} db={db} T={T} I={I} trialDaysLeft={trialDaysLeft} timeSince={timeSince} pendingOpenUid={pendingOpenUid} setPendingOpenUid={setPendingOpenUid} onDrawerChange={setDrawerOpen} />}

          
              {tab === "auditlog" && (
                <>
                  <div className="chart-box fade-up" style={{ padding: 24, marginBottom: 20 }}>
                    <h3 style={{ fontFamily: "'Fraunces',serif", fontSize: 18, fontWeight: 700, color: T.gold, marginBottom: 4 }}>Upcoming Data Updates</h3>
                    <p style={{ fontSize: 12, color: T.textMuted, marginBottom: 20 }}>Scheduled Emaar results and market data refresh dates</p>
                    {[
                      { event: "Emaar Q1 2026 Results", due: "2026-04-15", note: "Download from emaar.com/investor-relations" },
                      { event: "Dubai Market Report Q1", due: "2026-04-30", note: "DLD and DXBinteract" },
                      { event: "Emaar Q2 2026 Results", due: "2026-07-15", note: "Download from emaar.com/investor-relations" },
                      { event: "Dubai Market Report Q2", due: "2026-07-30", note: "DLD and DXBinteract" },
                      { event: "Emaar Q3 2026 Results", due: "2026-10-15", note: "Download from emaar.com/investor-relations" },
                      { event: "Emaar FY 2026 Results", due: "2027-02-15", note: "Annual results — biggest update of the year" },

                      { event: "Emaar Q1 2026 Results", due: "2026-04-15", note: "Download from emaar.com/investor-relations" },
                      { event: "Dubai Market Report Q1", due: "2026-04-30", note: "DLD and DXBinteract" },
                      { event: "Emaar Q2 2026 Results", due: "2026-07-15", note: "Download from emaar.com/investor-relations" },
                      { event: "Dubai Market Report Q2", due: "2026-07-30", note: "DLD and DXBinteract" },
                      { event: "Emaar Q3 2026 Results", due: "2026-10-15", note: "Download from emaar.com/investor-relations" },
                      { event: "Emaar FY 2026 Results", due: "2027-02-15", note: "Annual results — biggest update of the year" },
                    ].map((item, i) => {
                      const daysLeft = Math.ceil((new Date(item.due) - new Date()) / (1000 * 60 * 60 * 24));
                      const isUrgent = daysLeft <= 30;
                      const isPast = daysLeft < 0;
                      return (
                        <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 0", borderBottom: "1px solid rgba(212,168,67,0.1)" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <div style={{ width: 10, height: 10, borderRadius: "50%", background: isPast ? "#EF4444" : isUrgent ? "#D4A843" : "#10B981", flexShrink: 0 }} />
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 600, color: T.white }}>{item.event}</div>
                              <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>{item.note}</div>
                            </div>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: isPast ? "#EF4444" : isUrgent ? "#D4A843" : T.textSecondary }}>{isPast ? "OVERDUE" : daysLeft + " days"}</div>
                            <div style={{ fontSize: 10, color: T.textMuted }}>{new Date(item.due).toLocaleDateString("en-AE", { day: "numeric", month: "short", year: "numeric" })}</div>
                          </div>
                        </div>
                      );
                    })}
                    <div style={{ marginTop: 20, padding: 16, borderRadius: 10, background: "rgba(212,168,67,0.06)", border: "1px solid rgba(212,168,67,0.2)" }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: T.gold, marginBottom: 8 }}>Update Checklist</div>
                      <div style={{ fontSize: 11, color: T.textSecondary, lineHeight: 2 }}>
                        1. Download PDF from emaar.com/investor-relations<br/>
                        2. Update revenue, profit, EBITDA, sales, backlog in data.js<br/>
                        3. Update construction % for projects nearing handover<br/>
                        4. git add . then git commit then git push<br/>
                        5. Live in 3 minutes
                      </div>
                    </div>
                  </div>
                  {/* ── ENHANCED AUDIT LOG ── */}
                  <div className="chart-box fade-up" style={{ padding: 0, overflow: "hidden" }}>
                    <div style={{ padding: "16px 20px", borderBottom: "2px solid rgba(212,168,67,0.1)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
                      <div>
                        <h3 style={{ fontFamily: "'Fraunces',serif", fontSize: 16, fontWeight: 700, color: T.white }}>Audit Log</h3>
                        <p style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>{auditLog.length} events · All admin data changes · Last 100 entries</p>
                      </div>
                      <button onClick={fetchAuditLog} style={{ padding: "6px 14px", background: "rgba(212,168,67,0.1)", border: "1px solid rgba(212,168,67,0.25)", borderRadius: 8, color: T.gold, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>↻ Refresh</button>
                    </div>

                    {/* Summary stats */}
                    {auditLog.length > 0 && (
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 0, borderBottom: "1px solid rgba(212,168,67,0.08)" }}>
                        {[
                          { label: "Total Changes", val: auditLog.length, color: T.gold },
                          { label: "Project Updates", val: auditLog.filter(l => l.action === "project_update").length, color: T.blue },
                          { label: "New Projects", val: auditLog.filter(l => l.action === "project_create").length, color: T.green },
                          { label: "Community Updates", val: auditLog.filter(l => l.action === "community_update").length, color: "#8B5CF6" },
                        ].map((s, i) => (
                          <div key={i} style={{ padding: "12px 16px", borderRight: i < 3 ? "1px solid rgba(255,255,255,0.04)" : "none", textAlign: "center" }}>
                            <div style={{ fontFamily: "'Fraunces',serif", fontSize: 22, fontWeight: 900, color: s.color }}>{s.val}</div>
                            <div style={{ fontSize: 10, color: T.textMuted, marginTop: 2 }}>{s.label}</div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Column headers */}
                    {auditLog.length > 0 && (
                      <div style={{ display: "grid", gridTemplateColumns: "160px 80px 1fr 160px", gap: 8, padding: "8px 20px", background: "rgba(255,255,255,0.02)", borderBottom: "1px solid rgba(212,168,67,0.08)" }}>
                        {["Timestamp", "Action", "Details & Changes", "Admin"].map((h, i) => (
                          <span key={i} style={{ fontSize: 9, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: 1 }}>{h}</span>
                        ))}
                      </div>
                    )}

                    {auditLog.length === 0 && (
                      <div style={{ padding: 48, textAlign: "center" }}>
                        <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(100,116,139,0.1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", color: "#64748B" }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg></div>
                        <div style={{ fontSize: 14, color: T.textSecondary, fontWeight: 600, marginBottom: 6 }}>No audit events yet</div>
                        <div style={{ fontSize: 12, color: T.textMuted }}>Events are recorded automatically when you update projects, communities, or yields.</div>
                      </div>
                    )}

                    <div style={{ maxHeight: 500, overflowY: "auto" }}>
                      {auditLog.map((log, i) => {
                        const actionMeta = {
                          project_update:    { label: "Project Updated",    color: T.blue,    icon: "edit" },
                          project_create:    { label: "Project Created",    color: T.green,   icon: "add" },
                          community_update:  { label: "Community Updated",  color: "#8B5CF6", icon: "community" },
                          tab_visibility:    { label: "Tab Visibility",     color: T.gold,    icon: "eye" },
                          user_tier_change:  { label: "User Tier Changed",  color: T.orange,  icon: "user" },
                          yield_update:      { label: "Yield Updated",      color: T.teal,    icon: "chart" },
                        };
                        const meta = actionMeta[log.action] || { label: log.action || "Unknown", color: T.textMuted, icon: "tool" };
                        const timeAgo = (() => {
                          if (!log.changedAt) return "—";
                          const diff = Date.now() - new Date(log.changedAt).getTime();
                          const mins = Math.floor(diff / 60000);
                          const hrs = Math.floor(diff / 3600000);
                          const days = Math.floor(diff / 86400000);
                          if (mins < 1) return "just now";
                          if (mins < 60) return `${mins}m ago`;
                          if (hrs < 24) return `${hrs}h ago`;
                          return `${days}d ago`;
                        })();
                        const hasDiff = log.diff && Object.keys(log.diff).length > 0;

                        return (
                          <div key={log.id} style={{ display: "grid", gridTemplateColumns: "160px 80px 1fr 160px", gap: 8, padding: "12px 20px", borderBottom: "1px solid rgba(255,255,255,0.04)", alignItems: "flex-start", transition: "background 0.15s" }}
                            onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.02)"}
                            onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                            {/* Time */}
                            <div>
                              <div style={{ fontSize: 11, color: T.textSecondary, fontWeight: 600 }}>{timeAgo}</div>
                              <div style={{ fontSize: 10, color: T.textMuted, marginTop: 2 }}>{log.changedAt ? new Date(log.changedAt).toLocaleString("en-AE", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—"}</div>
                            </div>
                            {/* Action badge */}
                            <div>
                              <span style={{ display: "inline-block", padding: "3px 8px", borderRadius: 6, background: meta.color + "18", border: `1px solid ${meta.color}33`, color: meta.color, fontSize: 10, fontWeight: 700 }}>{meta.icon}</span>
                            </div>
                            {/* Details */}
                            <div>
                              <div style={{ fontSize: 12, fontWeight: 600, color: T.white, marginBottom: 4 }}>
                                {meta.label}{log.projectId ? ` — ${log.projectId}` : ""}{log.communityKey ? ` — ${log.communityKey}` : ""}
                              </div>
                              {hasDiff && (
                                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                                  {Object.entries(log.diff).slice(0, 5).map(([k, v]) => (
                                    <span key={k} style={{ fontSize: 10, background: "rgba(255,255,255,0.04)", padding: "2px 8px", borderRadius: 4, color: T.textMuted }}>
                                      <span style={{ color: T.textSecondary }}>{k}:</span> <span style={{ color: "#EF4444", textDecoration: "line-through" }}>{String(v.old || "—").slice(0, 20)}</span> → <span style={{ color: "#10B981" }}>{String(v.new || "—").slice(0, 20)}</span>
                                    </span>
                                  ))}
                                  {Object.keys(log.diff).length > 5 && <span style={{ fontSize: 10, color: T.textMuted }}>+{Object.keys(log.diff).length - 5} more</span>}
                                </div>
                              )}
                              {!hasDiff && log.changes && (
                                <div style={{ fontSize: 10, color: T.textMuted }}>New record created</div>
                              )}
                            </div>
                            {/* Admin */}
                            <div style={{ fontSize: 11, color: T.textMuted, textAlign: "right" }}>
                              {log.changedBy ? (
                                <span style={{ background: "rgba(212,168,67,0.08)", border: "1px solid rgba(212,168,67,0.15)", borderRadius: 6, padding: "2px 8px", color: T.gold, fontSize: 10, fontWeight: 600 }}>
                                  {log.changedBy.split("@")[0]}
                                </span>
                              ) : "—"}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}

              {tab === "revenue" && (
            <>
              <Section title="Revenue Intelligence" sub="MRR, ARR, conversion metrics & projections">
                <div className="kpi-grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
                  <KPI label="Monthly Revenue" value={`AED ${mrr.toLocaleString()}`} sub={`${stats.pro} Pro · ${stats.enterprise} Enterprise`} color={T.green} delay={1} />
                  <KPI label="Annual Revenue" value={`AED ${arr.toLocaleString()}`} sub="Projected annualized" color={T.teal} delay={2} />
                  <KPI label="Projected MRR" value={`AED ${projectedMRR.toLocaleString()}`} sub={`30% trial conversion assumption`} color={T.gold} delay={3} />
                  <KPI label="Trial Conversion" value={`${trialConversion}%`} sub={`${stats.pro} converted · ${stats.expired} expired`} color={T.blue} delay={4} />
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
             DATA MANAGER TAB
             ═══════════════════════════════════════ */}
          {tab === "data" && (
            <>
              {/* Sub-tab navigation */}
              <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
                {[
                  { id: "projects", label: "Projects", count: emaarProjects.length, icon: I.projects },
                  { id: "communities", label: "Community ROI", count: Object.keys(defaultCommunityROI).length, icon: I.chart },
                  { id: "yields", label: "Yield Table", count: emaarYields.length, icon: I.yields },
                ].map(st => (
                  <button type="button" key={st.id} onClick={() => { setDataSubTab(st.id); setEditingProject(null); setEditingCommunity(null); setEditingYield(null); }}
                    style={{ flex: 1, padding: "14px 16px", borderRadius: 12, border: `1px solid ${dataSubTab === st.id ? T.gold : T.border}`, background: dataSubTab === st.id ? T.goldGlow : T.surface, cursor: "pointer", fontFamily: "'Outfit',sans-serif", textAlign: "left", transition: "all .2s" }}>
                    <div style={{ marginBottom: 6, color: dataSubTab === st.id ? T.gold : T.textMuted }}>{st.icon}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: dataSubTab === st.id ? T.gold : T.white }}>{st.label}</div>
                    <div style={{ fontSize: 11, color: T.textMuted }}>{st.count} items · {Object.keys(st.id === "projects" ? liveProjects : st.id === "communities" ? liveCommunityROI : liveYields).length} live overrides</div>
                  </button>
                ))}
              </div>

              {/* ─── PROJECTS EDITOR ─── */}
              {dataSubTab === "projects" && (
                <Section title="Project Data Manager" sub="Edit prices, PPSF, status — changes go live instantly" action={
                <div style={{ display: "flex", gap: 8 }}>
                    <button type="button" onClick={exportProjectsExcel} style={{display:"flex",alignItems:"center",gap:5,fontSize:11,padding:"7px 14px",borderRadius:8,border:"1px solid rgba(100,116,139,0.3)",background:"transparent",color:T.textSecondary,cursor:"pointer",fontFamily:"'Outfit',sans-serif",fontWeight:600}}>Export</button>
                    <label style={{display:"flex",alignItems:"center",gap:5,fontSize:11,padding:"7px 14px",borderRadius:8,border:"1px solid rgba(100,116,139,0.3)",background:"transparent",color:T.textSecondary,cursor:"pointer",fontFamily:"'Outfit',sans-serif",fontWeight:600}}>
                      Import CSV
                      <input type="file" accept=".csv" style={{display:"none"}} onChange={e => importCSV(e.target.files[0])} />
                    </label>
                    <button type="button" onClick={() => { setEditingProject("new"); setProjectForm({}); }} style={{display:"flex",alignItems:"center",gap:5,fontSize:11,padding:"7px 14px",borderRadius:8,border:"1px solid rgba(16,185,129,0.4)",background:"rgba(16,185,129,0.08)",color:"#10B981",cursor:"pointer",fontFamily:"'Outfit',sans-serif",fontWeight:600}}>+ Add Project</button>
                    <button type="button" onClick={fetchLiveData} style={{display:"flex",alignItems:"center",gap:5,fontSize:11,padding:"7px 14px",borderRadius:8,border:"1px solid rgba(212,168,67,0.4)",background:"rgba(212,168,67,0.08)",color:"#D4A843",cursor:"pointer",fontFamily:"'Outfit',sans-serif",fontWeight:600}}>{I.refresh} Refresh</button>
                  </div>
                }>
                  {/* Search */}
                  <div style={{ position: "relative", maxWidth: 400, marginBottom: 16 }}>
                    <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: T.textMuted }}>{I.search}</span>
                    <input value={dataSearch} onChange={e => setDataSearch(e.target.value)} placeholder="Search projects..."
                      style={{ width: "100%", padding: "10px 12px 10px 36px", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, color: T.textPrimary, fontSize: 13, fontFamily: "'Outfit',sans-serif", outline: "none" }} />
                  </div>

                  {/* Editing form */}
                  {editingProject && (() => {
                    if (editingProject === "new") return (
                      <div className="chart-box fade-up" style={{ padding: 24, marginBottom: 20, border: "1px solid rgba(16,185,129,0.3)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                          <h3 style={{ fontFamily: "'Fraunces',serif", fontSize: 18, fontWeight: 700, color: T.green }}>+ Add New Project</h3>
                          <button type="button" onClick={() => setEditingProject(null)} style={{ fontSize: 11, padding: "6px 14px", borderRadius: 8, border: "1px solid rgba(100,116,139,0.3)", background: "transparent", color: T.textSecondary, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>Cancel</button>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                          {[
                            { key: "name", label: "Project Name", placeholder: "e.g. Golf Heights" },
                            { key: "community", label: "Community", placeholder: "e.g. Dubai Hills Estate" },
                            { key: "price", label: "Price (AED)", placeholder: "e.g. 2500000" },
                            { key: "ppsf", label: "Price/sqft", placeholder: "e.g. 2200" },
                            { key: "handover", label: "Handover", placeholder: "e.g. Q4 2027" },
                            { key: "beds", label: "Bedrooms", placeholder: "e.g. 1-3 BR" },
                            { key: "paymentPlan", label: "Payment Plan", placeholder: "e.g. 80/20" },
                            { key: "type", label: "Type", placeholder: "e.g. Apartments" },
                            { key: "status", label: "Status", placeholder: "e.g. Off-Plan" },
                          ].map(f => (
                            <div key={f.key}>
                              <label style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4, display: "block" }}>{f.label}</label>
                              <input type="text" placeholder={f.placeholder} value={projectForm[f.key] || ""} onChange={e => setProjectForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                                style={{ width: "100%", padding: "10px 12px", background: T.bg, border: "1px solid rgba(212,168,67,0.12)", borderRadius: 8, color: T.textPrimary, fontSize: 13, fontFamily: "'Outfit',sans-serif", outline: "none" }} />
                            </div>
                          ))}
                        </div>
                        <button type="button" disabled={dataSaving} onClick={() => saveNewProject(projectForm)}
                          style={{ marginTop: 20, width: "100%", padding: "12px", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #10B981, #059669)", color: "#FFFFFF", fontSize: 14, fontWeight: 700, cursor: dataSaving ? "wait" : "pointer", fontFamily: "'Outfit',sans-serif", opacity: dataSaving ? 0.6 : 1 }}>
                          {dataSaving ? "Saving..." : "+ Add Project to Firestore"}
                        </button>
                      </div>
                    );
                    const p = emaarProjects.find(x => x.id === editingProject);
                    if (!p) return null;
                    const merged = getMergedProject(p);
                    const hasOverride = !!liveProjects[p.id];
                    const fields = [
                      { key: "price", label: "Price (AED)", type: "number", placeholder: "e.g. 2500000" },
                      { key: "ppsf", label: "Price/sqft (AED)", type: "number", placeholder: "e.g. 2200" },
                      { key: "sqft", label: "Size (sqft)", type: "number", placeholder: "e.g. 1200" },
                      { key: "status", label: "Status", type: "select", options: ["Selling", "Upcoming", "Sold Out", "Ready"] },
                      { key: "handover", label: "Handover", type: "text", placeholder: "e.g. Q4 2027" },
                      { key: "type", label: "Type", type: "select", options: ["Apartment", "Townhouse", "Villa", "Penthouse", "Duplex"] },
                      { key: "beds", label: "Bedrooms", type: "text", placeholder: "e.g. 1-3 BR" },
                      { key: "paymentPlan", label: "Payment Plan", type: "text", placeholder: "e.g. 80/20" },
                      { key: "dldPpsf", label: "DLD PPSF (AED)", type: "number", placeholder: "e.g. 2100" },
                       { key: "dataSource", label: "Data Source", type: "select", options: ["Emaar IR Report", "DLD Portal", "DXBinteract", "Manual Entry", "Agent Verified", "Market Research"] },
                       { key: "lastVerified", label: "Last Verified Date", type: "text", placeholder: "e.g. Mar 2026" },
                       { key: "availability", label: "Availability", type: "select", options: ["Available", "Sold Out", "Limited Units", "Coming Soon"] },
                       { key: "unitsTotal", label: "Total Units", type: "number", placeholder: "e.g. 200" },
                       { key: "unitsAvail", label: "Units Available", type: "number", placeholder: "e.g. 45" },
                       { key: "notes", label: "Admin Notes", type: "text", placeholder: "Internal notes..." },
                    ];
                    return (
                      <div className="chart-box fade-up" style={{ padding: 24, marginBottom: 20, border: `1px solid ${T.gold}30` }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                          <div>
                            <h3 style={{ fontFamily: "'Fraunces',serif", fontSize: 18, fontWeight: 700, color: T.white }}>{p.name}</h3>
                            <span style={{ fontSize: 12, color: T.textMuted }}>{p.community} · ID: {p.id}</span>
                            {hasOverride && <span style={{ marginLeft: 8, fontSize: 10, padding: "2px 8px", borderRadius: 6, background: "rgba(16,185,129,0.12)", color: T.green, fontWeight: 600 }}>LIVE DATA</span>}
                          </div>
                          <div style={{ display: "flex", gap: 8 }}>
                            <button type="button" onClick={() => deleteProject(p.id)} style={{ fontSize: 11, padding: "6px 14px", borderRadius: 8, border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.06)", color: T.red, cursor: "pointer", fontFamily: "'Outfit',sans-serif", fontWeight: 600 }}>Delete Project</button>
                            {hasOverride && <button type="button" onClick={() => resetProjectData(p.id)} style={{ fontSize: 11, padding: "6px 14px", borderRadius: 8, border: `1px solid rgba(239,68,68,0.3)`, background: "rgba(239,68,68,0.06)", color: T.red, cursor: "pointer", fontFamily: "'Outfit',sans-serif", fontWeight: 600 }}>Reset to Default</button>}
                            <button type="button" onClick={() => setEditingProject(null)} style={{ fontSize: 11, padding: "6px 14px", borderRadius: 8, border: `1px solid ${T.border}`, background: "transparent", color: T.textSecondary, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>Cancel</button>
                          </div>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                          {fields.map(f => (
                            <div key={f.key}>
                              <label style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4, display: "block" }}>{f.label}</label>
                              {f.type === "select" ? (
                                <select value={projectForm[f.key] ?? merged[f.key] ?? ""} onChange={e => setProjectForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                                  style={{ width: "100%", padding: "10px 12px", background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, color: T.textPrimary, fontSize: 13, fontFamily: "'Outfit',sans-serif" }}>
                                  <option value="">—</option>
                                  {f.options.map(o => <option key={o} value={o}>{o}</option>)}
                                </select>
                              ) : (
                                <input type={f.type} value={projectForm[f.key] ?? merged[f.key] ?? ""} onChange={e => setProjectForm(prev => ({ ...prev, [f.key]: e.target.value }))} placeholder={f.placeholder}
                                  style={{ width: "100%", padding: "10px 12px", background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, color: T.textPrimary, fontSize: 13, fontFamily: "'Outfit',sans-serif", outline: "none" }} />
                              )}
                              {hasOverride && liveProjects[p.id]?.[f.key] !== undefined && (
                                <div style={{ fontSize: 9, color: T.green, marginTop: 2 }}>Live: {liveProjects[p.id][f.key]} · Default: {p[f.key] ?? "—"}</div>
                              )}
                            </div>
                          ))}
                        </div>
                        <div style={{ marginTop: 16, padding: 16, borderRadius: 10, border: "1px solid rgba(212,168,67,0.12)", background: T.surfaceAlt }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>Project Image</div>
                          {(projectForm.imageUrl || liveProjects[p.id]?.imageUrl) && (
                            <img src={projectForm.imageUrl || liveProjects[p.id]?.imageUrl} alt="Project" style={{ width: "100%", height: 140, objectFit: "cover", borderRadius: 8, marginBottom: 10 }} onError={e => e.target.style.display="none"} />
                          )}
                          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, padding: "10px 16px", borderRadius: 8, border: "1px solid rgba(212,168,67,0.2)", background: T.bg, color: T.textSecondary, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                            {projectForm.imageUploading ? "Uploading..." : "Upload Project Image"}
                            <input type="file" accept="image/*,video/*,.pdf" style={{ display: "none" }} onChange={async e => {
                              const file = e.target.files[0]; if (!file) return;
                              setProjectForm(prev => ({ ...prev, imageUploading: true }));
                              const fd = new FormData();
                              fd.append("file", file);
                              fd.append("upload_preset", "dxb-analytics");
                              fd.append("cloud_name", "dh9dd5ld0");
                              const res = await fetch("https://api.cloudinary.com/v1_1/dh9dd5ld0/auto/upload", { method: "POST", body: fd });
                              const data = await res.json();
                              setProjectForm(prev => ({ ...prev, imageUrl: data.secure_url, imageUploading: false }));
                              notify("Image uploaded!");
                            }} />
                          </label>
                          <div style={{ fontSize: 10, color: T.textMuted, marginTop: 6 }}>Supports images, PDFs, videos up to 25MB</div>
                        </div>
                        
                          <div style={{ marginTop: 12, padding: 16, borderRadius: 10, border: "1px solid rgba(212,168,67,0.12)", background: T.surfaceAlt }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>Project Documents</div>
                          </div>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                            {[
                              { key: "pdfBrochure", label: "Brochure PDF" },
                              { key: "pdfFloorPlan", label: "Floor Plan PDF" },
                              { key: "pdfPaymentPlan", label: "Payment Plan PDF" },
                              { key: "pdfFactSheet", label: "Fact Sheet PDF" },
                            ].map(doc => (
                              <div key={doc.key}>
                                <label style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4, display: "block" }}>{doc.label}</label>
                                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, padding: "8px 12px", borderRadius: 8, border: "1px solid rgba(212,168,67,0.12)", background: T.bg, color: T.textSecondary, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                                  {projectForm[doc.key + "_uploading"] ? "Uploading..." : (projectForm[doc.key] || liveProjects[p.id]?.[doc.key]) ? "Uploaded ✓" : "Upload PDF"}
                                  <input type="file" accept=".pdf,image/*" style={{ display: "none" }} onChange={async e => {
                                    const file = e.target.files[0]; if (!file) return;
                                    setProjectForm(prev => ({ ...prev, [doc.key + "_uploading"]: true }));
                                    const fd = new FormData();
                                    fd.append("file", file);
                                    fd.append("upload_preset", "dxb-analytics");
                                    const res = await fetch("https://api.cloudinary.com/v1_1/dh9dd5ld0/auto/upload", { method: "POST", body: fd });
                                    const data = await res.json();
                                    setProjectForm(prev => ({ ...prev, [doc.key]: data.secure_url, [doc.key + "_uploading"]: false }));
                                    notify(doc.label + " uploaded!");
                                  }} />
                                </label>
                                {(projectForm[doc.key] || liveProjects[p.id]?.[doc.key]) && (
                                  <a href={projectForm[doc.key] || liveProjects[p.id]?.[doc.key]} target="_blank" rel="noreferrer" style={{ fontSize: 10, color: T.gold, textDecoration: "none", marginTop: 3, display: "block" }}>View →</a>
                                )}
                              </div>
                            ))}
                          </div>
                          <div style={{ fontSize: 10, color: T.textMuted, marginTop: 8 }}>Tip: Upload PDFs to Google Drive, set to public, paste the share link here</div>
                          {/* VIDEO + EXTERNAL LINK */}
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 14 }}>
                            <div>
                              <label style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4, display: "block" }}>Video URL</label>
                              <input type="url" placeholder="https://youtube.com/..." value={projectForm.videoUrl ?? liveProjects[p.id]?.videoUrl ?? ""} onChange={e => setProjectForm(prev => ({ ...prev, videoUrl: e.target.value }))}
                                style={{ width: "100%", padding: "8px 12px", background: T.bg, border: "1px solid rgba(212,168,67,0.12)", borderRadius: 8, color: T.textPrimary, fontSize: 12, fontFamily: "'Outfit',sans-serif", outline: "none", boxSizing: "border-box" }} />
                              <div style={{ fontSize: 10, color: T.textMuted, marginTop: 3 }}>MP4 or YouTube link. Plays inline on dashboard.</div>
                            </div>
                            <div>
                              <label style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4, display: "block" }}>External Link</label>
                              <input type="url" placeholder="https://emaar.com/project/..." value={projectForm.externalLink ?? liveProjects[p.id]?.externalLink ?? ""} onChange={e => setProjectForm(prev => ({ ...prev, externalLink: e.target.value }))}
                                style={{ width: "100%", padding: "8px 12px", background: T.bg, border: "1px solid rgba(212,168,67,0.12)", borderRadius: 8, color: T.textPrimary, fontSize: 12, fontFamily: "'Outfit',sans-serif", outline: "none", boxSizing: "border-box" }} />
                              <div style={{ fontSize: 10, color: T.textMuted, marginTop: 3 }}>"Visit Website" button on dashboard.</div>
                            </div>
                          </div>
                          {(() => {
                            const history = priceHistory[p.id];
                            if (!history) return (
                              <div style={{ marginTop: 16, padding: 16, borderRadius: 10, border: "1px solid rgba(212,168,67,0.12)", background: T.surfaceAlt, textAlign: "center" }}>
                                <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, marginBottom: 10 }}>Price History</div>
                                <button type="button" onClick={() => fetchPriceHistory(p.id)} style={{ fontSize: 11, padding: "6px 14px", borderRadius: 8, border: "1px solid rgba(212,168,67,0.3)", background: "transparent", color: T.gold, cursor: "pointer" }}>Load Price History</button>
                              </div>
                            );
                            if (history.length === 0) return (
                              <div style={{ marginTop: 16, padding: 16, borderRadius: 10, background: T.surfaceAlt }}>
                                <div style={{ fontSize: 11, color: T.textMuted }}>No price history yet.</div>
                              </div>
                            );
                            const max = Math.max(...history.map(h => h.price));
                            const min = Math.min(...history.map(h => h.price));
                            const range = max - min || 1;
                            return (
                              <div style={{ marginTop: 16, padding: 16, borderRadius: 10, border: "1px solid rgba(212,168,67,0.12)", background: T.surfaceAlt }}>
                                <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, marginBottom: 12 }}>Price History</div>
                                <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 80 }}>
                                  {history.map((h, i) => (
                                    <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                                      <div style={{ fontSize: 8, color: T.textMuted }}>{Math.round(h.price/1000000*10)/10}M</div>
                                      <div style={{ width: "100%", background: T.gold, borderRadius: 3, height: Math.max(4, ((h.price - min) / range) * 60 + 4) + "px" }} />
                                      <div style={{ fontSize: 7, color: T.textMuted }}>{new Date(h.recordedAt).toLocaleDateString("en-AE", { month: "short", day: "numeric" })}</div>
                                    </div>
                                  ))}
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
                                  <span style={{ fontSize: 10, color: T.textMuted }}>Low: AED {min.toLocaleString()}</span>
                                  <span style={{ fontSize: 10, color: T.gold }}>High: AED {max.toLocaleString()}</span>
                                </div>
                              </div>
                            );
                          })()}

                        <button type="button" disabled={dataSaving} onClick={() => saveProjectData(p.id, projectForm)}
                          style={{ marginTop: 20, width: "100%", padding: "12px", borderRadius: 10, border: "none", background: `linear-gradient(135deg, ${T.gold}, ${T.goldDim})`, color: T.bg, fontSize: 14, fontWeight: 700, cursor: dataSaving ? "wait" : "pointer", fontFamily: "'Outfit',sans-serif", opacity: dataSaving ? 0.6 : 1 }}>
                          {dataSaving ? "Saving..." : "Save to Firestore — Goes Live Instantly"}
                        </button>
                      </div>
                    );
                  })()}

                  {/* Bulk Edit Bar */}
                  {bulkSelected.length > 0 && (
                    <div className="fade-up" style={{ padding: "14px 20px", marginBottom: 12, borderRadius: 10, background: "rgba(212,168,67,0.08)", border: "1px solid rgba(212,168,67,0.2)", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: T.gold }}>{bulkSelected.length} projects selected</span>
                      {[
                        { key: "status", label: "Status", options: ["Selling", "Upcoming", "Sold Out", "Ready"] },
                        { key: "availability", label: "Availability", options: ["Available", "Sold Out", "Limited Units", "Coming Soon"] },
                      ].map(f => (
                        <select key={f.key} value={bulkForm[f.key] || ""} onChange={e => setBulkForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                          style={{ padding: "6px 10px", background: T.bg, border: "1px solid rgba(212,168,67,0.2)", borderRadius: 6, color: T.textPrimary, fontSize: 11, fontFamily: "'Outfit',sans-serif" }}>
                          <option value="">Set {f.label}...</option>
                          {f.options.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                      ))}
                      <input type="number" placeholder="Set Price..." value={bulkForm.price || ""} onChange={e => setBulkForm(prev => ({ ...prev, price: e.target.value }))}
                        style={{ padding: "6px 10px", background: T.bg, border: "1px solid rgba(212,168,67,0.2)", borderRadius: 6, color: T.textPrimary, fontSize: 11, fontFamily: "'Outfit',sans-serif", width: 120 }} />
                      <button type="button" onClick={saveBulkEdit} disabled={dataSaving} style={{ padding: "6px 16px", borderRadius: 6, border: "none", background: T.gold, color: T.bg, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>
                        Apply to All
                      </button>
                      <button type="button" onClick={() => { setBulkSelected([]); setBulkForm({}); }} style={{ padding: "6px 12px", borderRadius: 6, border: "1px solid rgba(100,116,139,0.3)", background: "transparent", color: T.textSecondary, fontSize: 11, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>
                        Clear
                      </button>
                    </div>
                  )}
                  {/* Projects list */}
                  <div className="chart-box" style={{ padding: 0, overflow: "hidden" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "40px 2fr 100px 110px 100px 80px 90px 80px", gap: 8, padding: "12px 20px", borderBottom: `2px solid ${T.border}`, background: T.surfaceAlt }}>
                      {["#", "Project", "Community", "Price", "PPSF", "Status", "Source", ""].map(h => (
                        <span key={h} style={{ fontSize: 9, fontWeight: 700, color: T.textMuted, letterSpacing: 1, textTransform: "uppercase" }}>{h}</span>
                      ))}
                    </div>
                    {(() => {
                        const baseIds = new Set(emaarProjects.map(p => String(p.id)));
                        const firestoreOnly = Object.entries(liveProjects).filter(([id]) => !baseIds.has(id)).map(([id, data]) => ({ id, ...data }));
                        return [...emaarProjects, ...firestoreOnly];
                      })()
                      .filter(p => !dataSearch || (p.name||"").toLowerCase().includes(dataSearch.toLowerCase()) || (p.community || "").toLowerCase().includes(dataSearch.toLowerCase()))
                      .map((p, i) => {
                        const merged = getMergedProject(p);
                        const hasOverride = !!liveProjects[p.id];
                        return (
                          <div key={p.id} className="fade-up" style={{ display: "grid", gridTemplateColumns: "40px 2fr 100px 110px 100px 80px 90px 80px", gap: 8, padding: "10px 20px", borderBottom: `1px solid ${T.border}`, alignItems: "center", animationDelay: `${Math.min(i * 0.02, 0.5)}s`, cursor: "pointer", transition: "background .15s", background: editingProject === p.id ? T.goldGlow : "transparent" }}
                            onMouseEnter={e => { if (editingProject !== p.id) e.currentTarget.style.background = T.surfaceAlt; }}
                            onMouseLeave={e => { if (editingProject !== p.id) e.currentTarget.style.background = "transparent"; }}
                            onClick={() => { setEditingProject(p.id); setProjectForm(liveProjects[p.id] || {}); }}>
                            <input type="checkbox" checked={bulkSelected.includes(String(p.id))} onChange={e => setBulkSelected(prev => e.target.checked ? [...prev, String(p.id)] : prev.filter(x => x !== String(p.id)))}
                               style={{ cursor: "pointer", accentColor: T.gold }} />
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 600, color: T.white }}>{p.name}</div>
                              <div style={{ fontSize: 10, color: T.textMuted }}>{merged.type} · {merged.beds || "—"}</div>
                            </div>
                            <span style={{ fontSize: 11, color: T.textSecondary }}>{p.community}</span>
                            <span style={{ fontSize: 12, fontWeight: 700, color: T.gold }}>{merged.price ? `AED ${(merged.price / 1e6).toFixed(2)}M` : "TBA"}</span>
                            <span style={{ fontSize: 12, color: T.textPrimary }}>{merged.ppsf ? merged.ppsf.toLocaleString() : "—"}</span>
                            <span style={{ fontSize: 10, fontWeight: 600, padding: "3px 8px", borderRadius: 6, background: merged.status === "Selling" ? "rgba(16,185,129,0.12)" : merged.status === "Upcoming" ? "rgba(212,168,67,0.12)" : "rgba(148,163,184,0.1)", color: merged.status === "Selling" ? T.green : merged.status === "Upcoming" ? T.gold : T.textMuted }}>{merged.status || "—"}</span>
                            <span style={{ fontSize: 10, color: hasOverride ? T.green : T.textMuted, fontWeight: hasOverride ? 600 : 400 }}>{hasOverride ? "● Live" : "○ Default"}</span>
                            <span style={{ fontSize: 11, color: T.gold, fontWeight: 600 }}>Edit →</span>
                          </div>
                        );
                      })}
                  </div>
                </Section>
              )}

              {/* ─── COMMUNITY ROI EDITOR ─── */}
              {dataSubTab === "communities" && (
                <Section title="Community ROI Data" sub="Edit yields, rents, appreciation, occupancy per community" action={
                  <button type="button" onClick={fetchLiveData} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, padding: "7px 14px", borderRadius: 8, border: `1px solid ${T.gold}`, background: T.goldGlow, color: T.gold, cursor: "pointer", fontFamily: "'Outfit',sans-serif", fontWeight: 600 }}>{I.refresh} Refresh</button>
                }>
                  {/* Editing form */}
                  {editingCommunity && (() => {
                    const key = editingCommunity;
                    const merged = getMergedROI(key);
                    const hasOverride = !!liveCommunityROI[key];
                    return (
                      <div className="chart-box fade-up" style={{ padding: 24, marginBottom: 20, border: `1px solid ${T.gold}30` }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                          <div>
                            <h3 style={{ fontFamily: "'Fraunces',serif", fontSize: 18, fontWeight: 700, color: T.white }}>{key}</h3>
                            {hasOverride && <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 6, background: "rgba(16,185,129,0.12)", color: T.green, fontWeight: 600 }}>LIVE DATA</span>}
                          </div>
                          <div style={{ display: "flex", gap: 8 }}>
                            {hasOverride && <button type="button" onClick={() => resetCommunityROI(key)} style={{ fontSize: 11, padding: "6px 14px", borderRadius: 8, border: `1px solid rgba(239,68,68,0.3)`, background: "rgba(239,68,68,0.06)", color: T.red, cursor: "pointer", fontFamily: "'Outfit',sans-serif", fontWeight: 600 }}>Reset</button>}
                            <button type="button" onClick={() => setEditingCommunity(null)} style={{ fontSize: 11, padding: "6px 14px", borderRadius: 8, border: `1px solid ${T.border}`, background: "transparent", color: T.textSecondary, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>Cancel</button>
                          </div>
                        </div>

                        {/* Gross Yields */}
                        <div style={{ marginBottom: 16 }}>
                          <div style={{ fontSize: 10, fontWeight: 700, color: T.gold, letterSpacing: 1, marginBottom: 8, textTransform: "uppercase" }}>Gross Yield (%)</div>
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
                            {["apt1", "apt2", "apt3", "th", "villa"].filter(k => merged.grossYield?.[k] !== undefined || merged.estRent?.[k]).map(k => (
                              <div key={k}>
                                <label style={{ fontSize: 9, color: T.textMuted, textTransform: "uppercase" }}>{k}</label>
                                <input type="number" step="0.1" value={communityForm.grossYield?.[k] ?? merged.grossYield?.[k] ?? ""} onChange={e => setCommunityForm(prev => ({ ...prev, grossYield: { ...(prev.grossYield || merged.grossYield || {}), [k]: Number(e.target.value) } }))}
                                  style={{ width: "100%", padding: "8px", background: T.bg, border: `1px solid ${T.border}`, borderRadius: 6, color: T.textPrimary, fontSize: 12, fontFamily: "'Outfit',sans-serif" }} />
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Net Yields */}
                        <div style={{ marginBottom: 16 }}>
                          <div style={{ fontSize: 10, fontWeight: 700, color: T.green, letterSpacing: 1, marginBottom: 8, textTransform: "uppercase" }}>Net Yield (%)</div>
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
                            {["apt1", "apt2", "apt3", "th", "villa"].filter(k => merged.netYield?.[k] !== undefined || merged.estRent?.[k]).map(k => (
                              <div key={k}>
                                <label style={{ fontSize: 9, color: T.textMuted, textTransform: "uppercase" }}>{k}</label>
                                <input type="number" step="0.1" value={communityForm.netYield?.[k] ?? merged.netYield?.[k] ?? ""} onChange={e => setCommunityForm(prev => ({ ...prev, netYield: { ...(prev.netYield || merged.netYield || {}), [k]: Number(e.target.value) } }))}
                                  style={{ width: "100%", padding: "8px", background: T.bg, border: `1px solid ${T.border}`, borderRadius: 6, color: T.textPrimary, fontSize: 12, fontFamily: "'Outfit',sans-serif" }} />
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Est Rents */}
                        <div style={{ marginBottom: 16 }}>
                          <div style={{ fontSize: 10, fontWeight: 700, color: T.blue, letterSpacing: 1, marginBottom: 8, textTransform: "uppercase" }}>Est. Annual Rent (AED)</div>
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
                            {["apt1", "apt2", "apt3", "apt4", "th", "villa", "penthouse"].filter(k => merged.estRent?.[k] !== undefined).map(k => (
                              <div key={k}>
                                <label style={{ fontSize: 9, color: T.textMuted, textTransform: "uppercase" }}>{k}</label>
                                <input type="number" value={communityForm.estRent?.[k] ?? merged.estRent?.[k] ?? ""} onChange={e => setCommunityForm(prev => ({ ...prev, estRent: { ...(prev.estRent || merged.estRent || {}), [k]: Number(e.target.value) } }))}
                                  style={{ width: "100%", padding: "8px", background: T.bg, border: `1px solid ${T.border}`, borderRadius: 6, color: T.textPrimary, fontSize: 12, fontFamily: "'Outfit',sans-serif" }} />
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Key metrics */}
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 16 }}>
                          {[
                            { key: "appreciation5yr", label: "5Y Appreciation %", type: "number" },
                            { key: "appreciationYoY", label: "YoY Growth %", type: "number" },
                            { key: "serviceCharge", label: "Service Charge (AED/sqft)", type: "number" },
                            { key: "occupancy", label: "Occupancy %", type: "number" },
                            { key: "avgDaysToLease", label: "Avg Days to Lease", type: "number" },
                            { key: "riskLevel", label: "Risk Level", type: "text" },
                            { key: "shortTermPremium", label: "Short-term Premium %", type: "number" },
                            { key: "capitalGrowthDriver", label: "Growth Driver", type: "text" },
                          ].map(f => (
                            <div key={f.key} style={f.key === "capitalGrowthDriver" ? { gridColumn: "span 4" } : {}}>
                              <label style={{ fontSize: 9, fontWeight: 700, color: T.textMuted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4, display: "block" }}>{f.label}</label>
                              {f.key === "capitalGrowthDriver" ? (
                                <textarea value={communityForm[f.key] ?? merged[f.key] ?? ""} onChange={e => setCommunityForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                                  style={{ width: "100%", padding: "8px 12px", background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, color: T.textPrimary, fontSize: 12, fontFamily: "'Outfit',sans-serif", minHeight: 60, resize: "vertical" }} />
                              ) : (
                                <input type={f.type} step={f.type === "number" ? "0.1" : undefined} value={communityForm[f.key] ?? merged[f.key] ?? ""} onChange={e => setCommunityForm(prev => ({ ...prev, [f.key]: f.type === "number" ? Number(e.target.value) : e.target.value }))}
                                  style={{ width: "100%", padding: "8px 12px", background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, color: T.textPrimary, fontSize: 12, fontFamily: "'Outfit',sans-serif" }} />
                              )}
                            </div>
                          ))}
                        </div>

                        <button type="button" disabled={dataSaving} onClick={() => saveCommunityROI(key, communityForm)}
                          style={{ width: "100%", padding: "12px", borderRadius: 10, border: "none", background: `linear-gradient(135deg, ${T.gold}, ${T.goldDim})`, color: T.bg, fontSize: 14, fontWeight: 700, cursor: dataSaving ? "wait" : "pointer", fontFamily: "'Outfit',sans-serif", opacity: dataSaving ? 0.6 : 1 }}>
                          {dataSaving ? "Saving..." : "Save Community ROI — Goes Live Instantly"}
                        </button>
                      </div>
                    );
                  })()}

                  {/* Community list */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
                    {Object.entries(defaultCommunityROI).map(([key, roi]) => {
                      const merged = getMergedROI(key);
                      const hasOverride = !!liveCommunityROI[key];
                      const comm = emaarCommunities.find(c => c.district === key);
                      return (
                        <div key={key} className="chart-box fade-up" style={{ padding: 18, cursor: "pointer", border: editingCommunity === key ? `1px solid ${T.gold}` : `1px solid ${T.border}`, transition: "all .2s" }}
                          onClick={() => { setEditingCommunity(key); setCommunityForm(liveCommunityROI[key] || {}); }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                            <div>
                              <div style={{ fontSize: 14, fontWeight: 700, color: T.white }}>{comm?.name || key}</div>
                              <div style={{ fontSize: 11, color: T.textMuted }}>{key}</div>
                            </div>
                            <span style={{ fontSize: 9, fontWeight: 700, padding: "3px 8px", borderRadius: 6, background: hasOverride ? "rgba(16,185,129,0.12)" : "rgba(148,163,184,0.08)", color: hasOverride ? T.green : T.textMuted }}>{hasOverride ? "● Live" : "○ Default"}</span>
                          </div>
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                            <div>
                              <div style={{ fontSize: 9, color: T.textMuted }}>GROSS YIELD</div>
                              <div style={{ fontSize: 16, fontWeight: 700, color: T.gold }}>{merged.grossYield?.apt2 || merged.grossYield?.apt1 || merged.grossYield?.th || "—"}%</div>
                            </div>
                            <div>
                              <div style={{ fontSize: 9, color: T.textMuted }}>YoY GROWTH</div>
                              <div style={{ fontSize: 16, fontWeight: 700, color: T.green }}>{merged.appreciationYoY || "—"}%</div>
                            </div>
                            <div>
                              <div style={{ fontSize: 9, color: T.textMuted }}>OCCUPANCY</div>
                              <div style={{ fontSize: 16, fontWeight: 700, color: T.blue }}>{merged.occupancy || "—"}%</div>
                            </div>
                          </div>
                          {merged.updatedAt && <div style={{ fontSize: 9, color: T.textMuted, marginTop: 8 }}>Updated: {new Date(merged.updatedAt).toLocaleDateString("en", { day: "numeric", month: "short", year: "numeric" })} by {merged.updatedBy || "—"}</div>}
                          <div style={{ textAlign: "right", marginTop: 8 }}><span style={{ fontSize: 11, color: T.gold, fontWeight: 600 }}>Edit →</span></div>
                        </div>
                      );
                    })}
                  </div>
                </Section>
              )}

              {/* ─── YIELD TABLE EDITOR ─── */}
              {dataSubTab === "yields" && (
                <Section title="Yield Table Data" sub="Edit yield table entries shown in the Yields tab" action={
                  <button type="button" onClick={fetchLiveData} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, padding: "7px 14px", borderRadius: 8, border: `1px solid ${T.gold}`, background: T.goldGlow, color: T.gold, cursor: "pointer", fontFamily: "'Outfit',sans-serif", fontWeight: 600 }}>{I.refresh} Refresh</button>
                }>
                  {/* Editing form */}
                  {editingYield !== null && (() => {
                    const y = emaarYields[editingYield];
                    if (!y) return null;
                    const yieldKey = `${y.community}_${y.unit}`.replace(/\s+/g, "_");
                    const merged = { ...y, ...(liveYields[yieldKey] || {}) };
                    const hasOverride = !!liveYields[yieldKey];
                    const fields = [
                      { key: "rent", label: "Annual Rent (AED)", type: "number" },
                      { key: "price", label: "Unit Price (AED)", type: "number" },
                      { key: "gross", label: "Gross Yield %", type: "number" },
                      { key: "net", label: "Net Yield %", type: "number" },
                      { key: "demand", label: "Demand", type: "select", options: ["Very High", "High", "Moderate-High", "Moderate", "Growing"] },
                      { key: "visa", label: "Golden Visa", type: "select", options: ["Yes", "No", "Some"] },
                    ];
                    return (
                      <div className="chart-box fade-up" style={{ padding: 24, marginBottom: 20, border: `1px solid ${T.gold}30` }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                          <div>
                            <h3 style={{ fontFamily: "'Fraunces',serif", fontSize: 18, fontWeight: 700, color: T.white }}>{y.unit} — {y.community}</h3>
                            {hasOverride && <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 6, background: "rgba(16,185,129,0.12)", color: T.green, fontWeight: 600 }}>LIVE DATA</span>}
                          </div>
                          <button type="button" onClick={() => setEditingYield(null)} style={{ fontSize: 11, padding: "6px 14px", borderRadius: 8, border: `1px solid ${T.border}`, background: "transparent", color: T.textSecondary, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>Cancel</button>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                          {fields.map(f => (
                            <div key={f.key}>
                              <label style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4, display: "block" }}>{f.label}</label>
                              {f.type === "select" ? (
                                <select value={yieldForm[f.key] ?? merged[f.key] ?? ""} onChange={e => setYieldForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                                  style={{ width: "100%", padding: "10px 12px", background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, color: T.textPrimary, fontSize: 13, fontFamily: "'Outfit',sans-serif" }}>
                                  {f.options.map(o => <option key={o} value={o}>{o}</option>)}
                                </select>
                              ) : (
                                <input type={f.type} step="0.1" value={yieldForm[f.key] ?? merged[f.key] ?? ""} onChange={e => setYieldForm(prev => ({ ...prev, [f.key]: e.target.value }))} placeholder={`e.g. ${merged[f.key] || ""}`}
                                  style={{ width: "100%", padding: "10px 12px", background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, color: T.textPrimary, fontSize: 13, fontFamily: "'Outfit',sans-serif", outline: "none" }} />
                              )}
                            </div>
                          ))}
                        </div>
                        <button type="button" disabled={dataSaving} onClick={() => saveYieldData(yieldKey, yieldForm)}
                          style={{ marginTop: 20, width: "100%", padding: "12px", borderRadius: 10, border: "none", background: `linear-gradient(135deg, ${T.gold}, ${T.goldDim})`, color: T.bg, fontSize: 14, fontWeight: 700, cursor: dataSaving ? "wait" : "pointer", fontFamily: "'Outfit',sans-serif", opacity: dataSaving ? 0.6 : 1 }}>
                          {dataSaving ? "Saving..." : "Save Yield Data"}
                        </button>
                      </div>
                    );
                  })()}

                  {/* Yields table */}
                  <div className="chart-box" style={{ padding: 0, overflow: "hidden" }}>
                    <div className="table-scroll">
                      <div style={{ display: "grid", gridTemplateColumns: "40px 1.5fr 1fr 100px 110px 80px 80px 80px 70px", gap: 8, padding: "12px 20px", borderBottom: `2px solid ${T.border}`, background: T.surfaceAlt, minWidth: 800 }}>
                        {["#", "Unit Type", "Community", "Rent", "Price", "Gross", "Net", "Demand", ""].map(h => (
                          <span key={h} style={{ fontSize: 9, fontWeight: 700, color: T.textMuted, letterSpacing: 1, textTransform: "uppercase" }}>{h}</span>
                        ))}
                      </div>
                      {emaarYields.map((y, i) => {
                        const yieldKey = `${y.community}_${y.unit}`.replace(/\s+/g, "_");
                        const hasOverride = !!liveYields[yieldKey];
                        const merged = { ...y, ...(liveYields[yieldKey] || {}) };
                        return (
                          <div key={i} style={{ display: "grid", gridTemplateColumns: "40px 1.5fr 1fr 100px 110px 80px 80px 80px 70px", gap: 8, padding: "10px 20px", borderBottom: `1px solid ${T.border}`, alignItems: "center", cursor: "pointer", transition: "background .15s", minWidth: 800, background: editingYield === i ? T.goldGlow : "transparent" }}
                            onMouseEnter={e => { if (editingYield !== i) e.currentTarget.style.background = T.surfaceAlt; }}
                            onMouseLeave={e => { if (editingYield !== i) e.currentTarget.style.background = "transparent"; }}
                            onClick={() => { setEditingYield(i); setYieldForm(liveYields[yieldKey] || {}); }}>
                            <span style={{ fontSize: 11, color: T.textMuted }}>{i + 1}</span>

                            <span style={{ fontSize: 13, fontWeight: 600, color: T.white }}>{merged.unit}</span>
                            <span style={{ fontSize: 11, color: T.textSecondary }}>{merged.community}</span>
                            <span style={{ fontSize: 12, color: T.textPrimary }}>AED {(merged.rent / 1000).toFixed(0)}K</span>
                            <span style={{ fontSize: 12, color: T.gold, fontWeight: 600 }}>AED {(merged.price / 1e6).toFixed(2)}M</span>
                            <span style={{ fontSize: 12, fontWeight: 700, color: T.green }}>{merged.gross}%</span>
                            <span style={{ fontSize: 12, color: T.teal }}>{merged.net}%</span>
                            <span style={{ fontSize: 10, color: merged.demand === "Very High" ? T.gold : T.textSecondary }}>{merged.demand}</span>
                            <span style={{ fontSize: 10, color: hasOverride ? T.green : T.textMuted, fontWeight: hasOverride ? 600 : 400 }}>{hasOverride ? "●" : "—"}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </Section>
              )}

              {/* Data sync info */}
              <div className="chart-box fade-up" style={{ padding: 16, marginTop: 8, display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ fontSize: 24 }}>ℹ️</div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: T.white }}>How Live Data Works</div>
                  <div style={{ fontSize: 11, color: T.textSecondary, lineHeight: 1.6 }}>
                    Data saved here goes to Firestore and overrides default values from data.js. The main dashboard reads Firestore first, falls back to defaults if no override exists. Click "Reset to Default" on any item to remove the live override. Last updated timestamps are tracked per entry.
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ═══════════════════════════════════════
             LEADS TAB
             ═══════════════════════════════════════ */}
          {tab === "leads" && (
            <>
              <Section title={`Lead Tracking (${leads.length})`} sub="WhatsApp, Email & Call inquiries — auto-logged from dashboard"
                action={<button type="button" onClick={fetchLeads} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.surfaceAlt, color: T.gold, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>{I.refresh} Refresh</button>}>
                <div className="kpi-grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
                  <KPI label="Total Leads" value={leads.length} sub="All time" color={T.gold} delay={1} />
                  <KPI label="WhatsApp" value={leads.filter(l => l.source === "WhatsApp").length} sub="Clicks" color={T.green} delay={2} />
                  <KPI label="Email" value={leads.filter(l => l.source === "Email Inquiry").length} sub="Inquiries" color={T.blue} delay={3} />
                  <KPI label="This Week" value={leads.filter(l => { const d = new Date(l.createdAt); const now = new Date(); return (now - d) < 7 * 24 * 60 * 60 * 1000; }).length} sub="7 days" color={T.teal} delay={4} />
                </div>
                {leads.length === 0 ? (
                  <div style={{ textAlign: "center", padding: 60, color: T.textMuted }}>
                    <div style={{ width: 56, height: 56, borderRadius: 14, background: "rgba(100,116,139,0.08)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", color: "#64748B", opacity: 0.5 }}><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-6l-2 3H10l-2-3H2"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg></div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: T.textSecondary, marginBottom: 8 }}>No leads yet</div>
                    <div style={{ fontSize: 12, color: T.textMuted }}>Leads are captured when Pro users click WhatsApp or Email on any project.</div>
                  </div>
                ) : (
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                      <thead>
                        <tr style={{ borderBottom: `2px solid ${T.border}` }}>
                          {["Name", "Email", "Project", "Community", "Source", "Status", "Date", "Action"].map(h => (
                            <th key={h} style={{ padding: "10px 12px", textAlign: "left", color: T.gold, fontWeight: 600, fontSize: 10, letterSpacing: 0.5, textTransform: "uppercase" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {leads.map((lead, i) => (
                          <tr key={lead.id} style={{ borderBottom: `1px solid ${T.border}` }}
                            onMouseEnter={e => e.currentTarget.style.background = T.surfaceAlt}
                            onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                            <td style={{ padding: "10px 12px", color: T.white, fontWeight: 600 }}>{lead.name || "—"}</td>
                            <td style={{ padding: "10px 12px", color: T.textSecondary }}>{lead.email || "—"}</td>
                            <td style={{ padding: "10px 12px", color: T.gold }}>{lead.project || "—"}</td>
                            <td style={{ padding: "10px 12px", color: T.textSecondary }}>{lead.community || "—"}</td>
                            <td style={{ padding: "10px 12px" }}>
                              <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 6,
                                background: lead.source === "WhatsApp" ? "rgba(37,211,102,0.15)" : "rgba(59,130,246,0.12)",
                                color: lead.source === "WhatsApp" ? T.green : T.blue }}>
                                {lead.source || "—"}
                              </span>
                            </td>
                            <td style={{ padding: "10px 12px" }}>
                              <select value={lead.status || "New"}
                                onChange={async e => {
                                  await setDoc(doc(db, "leads", lead.id), { status: e.target.value }, { merge: true });
                                  fetchLeads();
                                }}
                                style={{ background: T.surfaceAlt, border: `1px solid ${T.border}`, color: lead.status === "Converted" ? T.green : lead.status === "Contacted" ? T.gold : T.blue, borderRadius: 6, padding: "3px 8px", fontSize: 10, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>
                                <option>New</option>
                                <option>Contacted</option>
                                <option>Converted</option>
                                <option>Lost</option>
                              </select>
                            </td>
                            <td style={{ padding: "10px 12px", color: T.textMuted, fontSize: 10 }}>
                              {lead.createdAt ? new Date(lead.createdAt).toLocaleDateString("en-AE", { day: "2-digit", month: "short" }) : "—"}
                            </td>
                            <td style={{ padding: "10px 12px" }}>
                              <a href={`https://wa.me/${lead.email ? "" : "971542410599"}?text=${encodeURIComponent(`Hi ${lead.name || ""}, following up on your interest in ${lead.project || "the property"}. Are you still looking?`)}`}
                                target="_blank" rel="noreferrer"
                                style={{ fontSize: 10, padding: "4px 10px", borderRadius: 6, background: "rgba(37,211,102,0.15)", color: T.green, textDecoration: "none", fontWeight: 600 }}>
                                Follow Up
                              </a>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Section>
            </>
          )}

          {/* ═══════════════════════════════════════
             NOTIFICATIONS TAB
             ═══════════════════════════════════════ */}
          {tab === "notifications" && <NotificationsTab T={T} notify={notify} adminUser={adminUser} />}

          {/* ═══════════════════════════════════════
             VERIFICATION TAB (Binance-style KYC)
             ═══════════════════════════════════════ */}
          {tab === "verification" && (() => {
            const vPending = verifications.filter(v => v.status === "pending");
            const vApproved = verifications.filter(v => v.status === "approved");
            const vRejected = verifications.filter(v => v.status === "rejected");
            const filtered = verifications.filter(v => {
              if (verifyFilter !== "all" && v.status !== verifyFilter) return false;
              if (verifySearch && !((v.name || "").toLowerCase().includes(verifySearch.toLowerCase()) || (v.email || "").toLowerCase().includes(verifySearch.toLowerCase()))) return false;
              return true;
            });
            const statusColor = { pending: T.orange, approved: T.green, rejected: T.red };
            const statusLabel = { pending: "Pending Review", approved: "Approved", rejected: "Rejected" };

            return <>
              <Section title="Identity Verification" sub="KYC document review · Binance-style verification">
                <div className="kpi-grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
                  <KPI label="Total Requests" value={verifications.length} sub="All submissions" delay={1} />
                  <KPI label="Pending Review" value={vPending.length} sub="Awaiting your review" color={T.orange} delay={2} />
                  <KPI label="Approved" value={vApproved.length} sub="Verified users" color={T.green} delay={3} />
                  <KPI label="Rejected" value={vRejected.length} sub="Need resubmission" color={T.red} delay={4} />
                </div>
              </Section>

              {/* Verification Levels Explainer */}
              <Section title="Verification Levels" sub="3-tier identity verification system">
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
                  {[
                    { level: "Basic", color: T.blue, icon: "1", features: ["Email verified", "Basic profile info", "Name & phone number", "View 10 projects"], badge: "Level 1" },
                    { level: "Intermediate", color: T.gold, icon: "2", features: ["Government ID upload", "Selfie verification", "Proof of address", "Full project access + Analytics"], badge: "Level 2" },
                    { level: "Advanced", color: T.green, icon: "3", features: ["Video call verification", "Bank statement / income proof", "Priority support", "Enterprise features + API access"], badge: "Level 3" },
                  ].map((tier, i) => (
                    <div key={i} className="fade-up" style={{ background: T.surfaceAlt, borderRadius: 14, padding: 24, border: `1px solid ${T.border}`, animationDelay: `${i * 0.08}s`, position: "relative", overflow: "hidden" }}>
                      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: tier.color }} />
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                        <div style={{ width: 36, height: 36, borderRadius: "50%", background: `${tier.color}20`, border: `2px solid ${tier.color}`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 16, color: tier.color }}>{tier.icon}</div>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: T.white }}>{tier.level}</div>
                          <div style={{ fontSize: 10, color: tier.color, fontWeight: 600 }}>{tier.badge}</div>
                        </div>
                      </div>
                      {tier.features.map((f, j) => (
                        <div key={j} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0" }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={tier.color} strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                          <span style={{ fontSize: 12, color: T.textSecondary }}>{f}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </Section>

              {/* Verification Queue */}
              <Section title="Verification Queue" sub={`${vPending.length} pending · ${filtered.length} total shown`}>
                {/* Filters */}
                <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
                  {["all", "pending", "approved", "rejected"].map(f => (
                    <button key={f} type="button" onClick={() => setVerifyFilter(f)}
                      style={{ padding: "6px 14px", borderRadius: 8, border: `1px solid ${verifyFilter === f ? T.gold : T.border}`, background: verifyFilter === f ? T.goldGlow : "transparent", color: verifyFilter === f ? T.gold : T.textMuted, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit',sans-serif", textTransform: "capitalize" }}>
                      {f} {f === "pending" && vPending.length > 0 ? `(${vPending.length})` : ""}
                    </button>
                  ))}
                  <div style={{ flex: 1 }} />
                  <div style={{ position: "relative" }}>
                    <div style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: T.textMuted }}>{I.search}</div>
                    <input value={verifySearch} onChange={e => setVerifySearch(e.target.value)} placeholder="Search users..." style={{ padding: "8px 12px 8px 32px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface, color: T.white, fontSize: 12, fontFamily: "'Outfit',sans-serif", outline: "none", width: 200 }} />
                  </div>
                  <button type="button" onClick={fetchVerifications} style={{ padding: "8px 12px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.surfaceAlt, color: T.textMuted, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontFamily: "'Outfit',sans-serif" }}>{I.refresh} Refresh</button>
                </div>

                {/* Table */}
                {filtered.length === 0 ? (
                  <div style={{ textAlign: "center", padding: 60 }}>
                    <div style={{ color: T.gold, opacity: 0.3, marginBottom: 16 }}>{I.verify}</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: T.textSecondary, marginBottom: 6 }}>{verifications.length === 0 ? "No verification requests yet" : "No matching results"}</div>
                    <div style={{ fontSize: 12, color: T.textMuted }}>{verifications.length === 0 ? "Users will submit verification documents from their dashboard profile" : "Try adjusting filters"}</div>
                  </div>
                ) : (
                  <div style={{ borderRadius: 12, border: `1px solid ${T.border}`, overflow: "hidden" }}>
                    {/* Header */}
                    <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1.5fr", padding: "10px 16px", background: T.surfaceAlt, borderBottom: `1px solid ${T.border}` }}>
                      {["User", "Level", "Status", "Submitted", "Actions"].map(h => (
                        <span key={h} style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: 1 }}>{h}</span>
                      ))}
                    </div>
                    {/* Rows */}
                    {filtered.map((v, i) => (
                      <div key={v.id} className="fade-up" style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1.5fr", padding: "12px 16px", borderBottom: `1px solid ${T.border}`, alignItems: "center", animationDelay: `${i * 0.03}s`, transition: "background 0.15s" }}
                        onMouseEnter={e => e.currentTarget.style.background = T.surfaceAlt} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                        {/* User */}
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ width: 32, height: 32, borderRadius: "50%", background: `${statusColor[v.status] || T.blue}20`, border: `1.5px solid ${statusColor[v.status] || T.blue}`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 12, color: statusColor[v.status] || T.blue }}>
                            {(v.name || v.email || "?")[0].toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: T.white }}>{v.name || "No name"}</div>
                            <div style={{ fontSize: 10, color: T.textMuted }}>{v.email || v.uid?.slice(0, 12)}</div>
                          </div>
                        </div>
                        {/* Level */}
                        <span style={{ fontSize: 12, fontWeight: 600, color: v.level === "advanced" ? T.green : v.level === "intermediate" ? T.gold : T.blue }}>{v.level || "Basic"}</span>
                        {/* Status */}
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, color: statusColor[v.status] || T.textMuted, background: `${statusColor[v.status] || T.blue}15`, padding: "3px 10px", borderRadius: 6, width: "fit-content" }}>
                          <span style={{ width: 6, height: 6, borderRadius: "50%", background: statusColor[v.status] || T.blue }} />
                          {statusLabel[v.status] || v.status}
                        </span>
                        {/* Date */}
                        <span style={{ fontSize: 11, color: T.textSecondary }}>{v.submittedAt ? new Date(v.submittedAt).toLocaleDateString("en-AE", { day: "numeric", month: "short" }) : "—"}</span>
                        {/* Actions */}
                        <div style={{ display: "flex", gap: 6 }}>
                          {v.status === "pending" && (
                            <>
                              <button type="button" onClick={() => approveVerification(v)} style={{ padding: "5px 12px", borderRadius: 6, border: "none", background: "rgba(16,185,129,0.15)", color: T.green, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>Approve</button>
                              <button type="button" onClick={() => setReviewingUser(v)} style={{ padding: "5px 12px", borderRadius: 6, border: "none", background: "rgba(239,68,68,0.1)", color: T.red, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>Reject</button>
                            </>
                          )}
                          {v.status === "approved" && <span style={{ fontSize: 11, color: T.green, fontWeight: 600 }}>{I.check} Verified</span>}
                          {v.status === "rejected" && <span style={{ fontSize: 11, color: T.textMuted }}>{v.rejectReason || "Rejected"}</span>}
                          <button type="button" onClick={() => setReviewingUser(v)} style={{ padding: "5px 10px", borderRadius: 6, border: `1px solid ${T.border}`, background: "transparent", color: T.textMuted, fontSize: 11, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>View</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Section>

              {/* Review Modal */}
              {reviewingUser && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)", zIndex: 9000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={() => { setReviewingUser(null); setRejectReason(""); }}>
                  <div onClick={e => e.stopPropagation()} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 20, width: "100%", maxWidth: 600, maxHeight: "85vh", overflow: "auto", boxShadow: "0 30px 100px rgba(0,0,0,0.6)" }}>
                    {/* Header */}
                    <div style={{ padding: "20px 24px", borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <h3 style={{ fontFamily: "'Fraunces',serif", fontSize: 18, fontWeight: 800, color: T.gold }}>Verification Review</h3>
                        <p style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>{reviewingUser.name || reviewingUser.email} · {statusLabel[reviewingUser.status]}</p>
                      </div>
                      <button type="button" onClick={() => { setReviewingUser(null); setRejectReason(""); }} style={{ background: "none", border: "none", color: T.textMuted, fontSize: 20, cursor: "pointer" }}>&times;</button>
                    </div>
                    {/* Content */}
                    <div style={{ padding: 24 }}>
                      {/* User Info */}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
                        {[
                          { label: "Full Name", value: reviewingUser.name || "—" },
                          { label: "Email", value: reviewingUser.email || "—" },
                          { label: "Phone", value: reviewingUser.phone || "—" },
                          { label: "Nationality", value: reviewingUser.nationality || "—" },
                          { label: "Verification Level", value: reviewingUser.level || "Basic" },
                          { label: "Date of Birth", value: reviewingUser.dob || "—" },
                          { label: "Address", value: reviewingUser.address || "—" },
                          { label: "Submitted", value: reviewingUser.submittedAt ? new Date(reviewingUser.submittedAt).toLocaleString() : "—" },
                        ].map((item, i) => (
                          <div key={i} style={{ padding: "10px 12px", borderRadius: 8, background: T.surfaceAlt }}>
                            <div style={{ fontSize: 9, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>{item.label}</div>
                            <div style={{ fontSize: 13, color: T.white, fontWeight: 500 }}>{item.value}</div>
                          </div>
                        ))}
                      </div>

                      {/* Documents */}
                      <div style={{ marginBottom: 20 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Submitted Documents</div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                          {[
                            { type: "Government ID", key: "idDoc", desc: "Passport, Emirates ID, or National ID" },
                            { type: "Selfie", key: "selfieDoc", desc: "Photo holding ID document" },
                            { type: "Proof of Address", key: "addressDoc", desc: "Utility bill or bank statement" },
                          ].map((d, i) => (
                            <div key={i} style={{ background: T.surfaceAlt, borderRadius: 10, padding: 16, border: `1px solid ${T.border}`, textAlign: "center" }}>
                              <div style={{ width: 48, height: 48, borderRadius: 10, background: reviewingUser[d.key] ? "rgba(16,185,129,0.12)" : "rgba(100,116,139,0.12)", margin: "0 auto 10px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                {reviewingUser[d.key] ? (
                                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={T.green} strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><polyline points="9 15 11 17 15 13"/></svg>
                                ) : (
                                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={T.textMuted} strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
                                )}
                              </div>
                              <div style={{ fontSize: 12, fontWeight: 600, color: reviewingUser[d.key] ? T.white : T.textMuted }}>{d.type}</div>
                              <div style={{ fontSize: 10, color: T.textMuted, marginTop: 2 }}>{reviewingUser[d.key] ? "Submitted" : "Not uploaded"}</div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Review History */}
                      {reviewingUser.reviewedAt && (
                        <div style={{ padding: "12px 16px", borderRadius: 10, background: `${statusColor[reviewingUser.status]}10`, border: `1px solid ${statusColor[reviewingUser.status]}25`, marginBottom: 20 }}>
                          <div style={{ fontSize: 11, fontWeight: 600, color: statusColor[reviewingUser.status] }}>{statusLabel[reviewingUser.status]} on {new Date(reviewingUser.reviewedAt).toLocaleDateString()}</div>
                          {reviewingUser.reviewedBy && <div style={{ fontSize: 10, color: T.textMuted, marginTop: 2 }}>Reviewed by: {reviewingUser.reviewedBy}</div>}
                          {reviewingUser.rejectReason && <div style={{ fontSize: 12, color: T.textSecondary, marginTop: 6 }}>Reason: {reviewingUser.rejectReason}</div>}
                        </div>
                      )}

                      {/* Action Buttons */}
                      {reviewingUser.status === "pending" && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                          <div>
                            <label style={{ fontSize: 11, fontWeight: 600, color: T.textMuted, textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 6 }}>Rejection Reason (required to reject)</label>
                            <input value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="e.g. Blurry document, name mismatch, expired ID..." style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.surfaceAlt, color: T.white, fontSize: 13, fontFamily: "'Outfit',sans-serif", outline: "none", boxSizing: "border-box" }} />
                          </div>
                          <div style={{ display: "flex", gap: 12 }}>
                            <button type="button" onClick={() => approveVerification(reviewingUser)} style={{ flex: 1, padding: "12px 0", borderRadius: 10, border: "none", background: `linear-gradient(135deg, ${T.green}, #059669)`, color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>Approve Verification</button>
                            <button type="button" onClick={() => rejectVerification(reviewingUser)} style={{ flex: 1, padding: "12px 0", borderRadius: 10, border: "none", background: "rgba(239,68,68,0.15)", color: T.red, fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>Reject</button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </>;
          })()}

          {/* ═══════════════════════════════════════
             ANALYTICS TAB
             ═══════════════════════════════════════ */}
          {/* ─── EMAIL DIGEST TAB ─── */}
          {tab === "digest" && (() => {
            const DigestTab = () => {
              const [sending, setSending] = React.useState(false);
              const [lastResult, setLastResult] = React.useState(null);
              const [proUsers, setProUsers] = React.useState([]);

              React.useEffect(() => {
                setProUsers(users.filter(u => ["pro", "pro_trial", "enterprise", "admin"].includes(u.tier)));
              }, []);

              const sendDigest = async () => {
                setSending(true);
                setLastResult(null);
                try {
                  const res = await fetch("/api/weekly-digest", {
                    method: "GET",
                    headers: { Authorization: `Bearer ${process.env.REACT_APP_CRON_SECRET || "dxb-cron-2026"}` },
                  });
                  const data = await res.json();
                  setLastResult(data);
                  notify(data.success ? `Digest sent to ${data.sent} users!` : "Send failed — check logs");
                } catch (e) {
                  setLastResult({ error: e.message });
                  notify("Error sending digest");
                } finally {
                  setSending(false);
                }
              };

              return (
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  <div style={{ background: T.surface, borderRadius: 14, border: `1px solid ${T.border}`, padding: 24 }}>
                    <div style={{ fontFamily: "'Fraunces',serif", fontSize: 18, fontWeight: 800, color: T.gold, marginBottom: 6 }}>Weekly Email Digest</div>
                    <div style={{ fontSize: 13, color: T.textMuted, marginBottom: 20 }}>Automatically sends every Monday at 8:00 AM UAE time to all Pro users. You can also trigger it manually below.</div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 24 }}>
                      {[
                        ["Pro Users", proUsers.length, T.gold],
                        ["Schedule", "Mon 8AM UAE", T.teal],
                        ["Content", "5 sections", T.green],
                      ].map(([l, v, c]) => (
                        <div key={l} style={{ background: T.surfaceAlt, borderRadius: 10, padding: "14px 16px", border: `1px solid ${T.border}` }}>
                          <div style={{ fontSize: 10, color: T.textMuted, textTransform: "uppercase", marginBottom: 4 }}>{l}</div>
                          <div style={{ fontSize: 18, fontWeight: 700, color: c }}>{v}</div>
                        </div>
                      ))}
                    </div>

                    <div style={{ background: T.surfaceAlt, borderRadius: 10, padding: "14px 16px", border: `1px solid ${T.border}`, marginBottom: 20 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: T.goldLight, marginBottom: 10 }}>EMAIL CONTENTS</div>
                      {["Market Pulse — Revenue, profit, backlog", "Top 5 Yield Opportunities", "Upcoming Handovers (next 6 months)", "Golden Visa Eligible Projects", "Link back to dashboard"].map((item, i) => (
                        <div key={i} style={{ fontSize: 12, color: T.textSecondary, padding: "6px 0", borderBottom: i < 4 ? `1px solid ${T.border}` : "none" }}>{item}</div>
                      ))}
                    </div>

                    <button type="button" onClick={sendDigest} disabled={sending} style={{ padding: "12px 28px", background: sending ? T.surfaceAlt : `linear-gradient(135deg,${T.gold},#B8912F)`, border: "none", borderRadius: 10, color: sending ? T.textMuted : T.bg, fontWeight: 800, fontSize: 14, cursor: sending ? "not-allowed" : "pointer", fontFamily: "'Outfit',sans-serif", display: "flex", alignItems: "center", gap: 8 }}>
                      {sending ? "Sending..." : `Send Digest Now → ${proUsers.length} users`}
                    </button>

                    {lastResult && (
                      <div style={{ marginTop: 16, padding: "12px 16px", borderRadius: 10, background: lastResult.success ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.08)", border: `1px solid ${lastResult.success ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)"}` }}>
                        <div style={{ fontSize: 12, color: lastResult.success ? T.green : "#EF4444", fontWeight: 700 }}>
                          {lastResult.success ? `Sent to ${lastResult.sent}/${lastResult.total} users` : `Error: ${lastResult.error}`}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Pro users list */}
                  <div style={{ background: T.surface, borderRadius: 14, border: `1px solid ${T.border}`, padding: 20 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: T.goldLight, letterSpacing: 1, textTransform: "uppercase", marginBottom: 14 }}>Who Will Receive the Digest ({proUsers.length})</div>
                    {proUsers.length === 0 ? (
                      <div style={{ fontSize: 13, color: T.textMuted, textAlign: "center", padding: 20 }}>No Pro users yet — upgrade some users to Pro to test</div>
                    ) : (
                      proUsers.map((u, i) => (
                        <div key={u.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", borderRadius: 8, marginBottom: 4, background: T.surfaceAlt }}>
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 600, color: T.white }}>{u.name || u.email}</div>
                            <div style={{ fontSize: 10, color: T.textMuted }}>{u.email}</div>
                          </div>
                          <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 6, background: "rgba(212,168,67,0.1)", color: T.gold, fontWeight: 700 }}>{u.tier?.toUpperCase()}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            };
            return <DigestTab />;
          })()}

          {tab === "analytics" && (() => {
            /* ── per-tab computed data ── */
            const weeklySignups = (() => {
              const weeks = [];
              for (let i = 7; i >= 0; i--) {
                const start = new Date(now); start.setDate(start.getDate() - i * 7 - 6);
                const end   = new Date(now); end.setDate(end.getDate() - i * 7);
                const label = `W${8 - i}`;
                const count = users.filter(u => { try { const d = new Date(u.createdAt); return d >= start && d <= end; } catch { return false; } }).length;
                const paid  = users.filter(u => { try { const d = new Date(u.createdAt); return d >= start && d <= end && (u.tier === "pro" || u.tier === "enterprise"); } catch { return false; } }).length;
                weeks.push({ label, signups: count, paid });
              }
              return weeks;
            })();

            const mrrHistory = (() => {
              const months = [];
              for (let i = 5; i >= 0; i--) {
                const d = new Date(now); d.setMonth(d.getMonth() - i);
                const label = d.toLocaleString("en", { month: "short" });
                const proCount = users.filter(u => { try { return u.tier === "pro" && new Date(u.createdAt) <= d; } catch { return false; } }).length;
                const entCount = users.filter(u => { try { return u.tier === "enterprise" && new Date(u.createdAt) <= d; } catch { return false; } }).length;
                months.push({ label, mrr: proCount * 99 + entCount * 499, pro: proCount * 99, enterprise: entCount * 499 });
              }
              months.push({ label: "Now", mrr, pro: stats.pro * 99, enterprise: stats.enterprise * 499 });
              return months;
            })();

            const topProjects = (() => {
              const counts = {};
              leads.forEach(l => { const k = l.project || l.projectName || "Unknown"; counts[k] = (counts[k] || 0) + 1; });
              return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([name, count]) => ({ name, count }));
            })();

            const funnelData = [
              { label: "Total Users", value: stats.total, color: T.textSecondary },
              { label: "Pro Trial", value: stats.proTrial, color: T.gold },
              { label: "Paid (Pro)", value: stats.pro, color: T.green },
              { label: "Enterprise", value: stats.enterprise, color: T.teal },
            ];

            const weeklyRetention = (() => {
              const cohorts = {};
              users.forEach(u => {
                try {
                  const d = new Date(u.createdAt);
                  const week = `${d.getFullYear()}-W${Math.ceil(d.getDate() / 7)}`;
                  if (!cohorts[week]) cohorts[week] = { total: 0, retained: 0 };
                  cohorts[week].total++;
                  if (u.tier === "pro" || u.tier === "enterprise" || u.tier === "pro_trial") cohorts[week].retained++;
                } catch {}
              });
              return Object.entries(cohorts).slice(-6).map(([week, d]) => ({
                label: week.replace(/.*-W/, "Wk "),
                retention: d.total > 0 ? Math.round((d.retained / d.total) * 100) : 0,
                total: d.total,
              }));
            })();

            const growthRate = stats.total > 0 && stats.thisWeek > 0 ? Math.round((stats.thisWeek / stats.total) * 100) : 0;
            const ltv = stats.paid > 0 ? Math.round((mrr / stats.paid) * 12) : 0;

            return (
            <>
              {/* ── KPI Row ── */}
              <Section title="Growth Analytics" sub="Platform growth metrics — live from Firestore">
                <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 12 }}>
                  <KPI label="Weekly Growth" value={`${growthRate}%`} sub={`${stats.thisWeek} signups this week`} color={T.green} delay={1} />
                  <KPI label="MRR" value={`AED ${mrr.toLocaleString()}`} sub={`ARR AED ${arr.toLocaleString()}`} color={T.gold} delay={2} />
                  <KPI label="Proj. MRR" value={`AED ${projectedMRR.toLocaleString()}`} sub="If 30% trials convert" color={T.teal} delay={3} />
                  <KPI label="Trial → Paid" value={`${trialConversion}%`} sub={`${stats.pro} paid · ${stats.expired} expired`} color={T.blue} delay={4} />
                  <KPI label="ARPU" value={`AED ${stats.total > 0 ? Math.round(mrr / stats.total) : 0}`} sub="Per active user" delay={5} />
                  <KPI label="LTV (Est.)" value={`AED ${ltv.toLocaleString()}`} sub="12-month paid LTV" color={T.purple} delay={6} />
                </div>
              </Section>

              {/* ── Revenue + Weekly Signups ── */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
                <Chart title="MRR History (6 Months)" sub="Monthly Recurring Revenue growth">
                  <ResponsiveContainer width="100%" height={230}>
                    <AreaChart data={mrrHistory}>
                      <defs>
                        <linearGradient id="gMRR" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={T.gold} stopOpacity={0.3} />
                          <stop offset="100%" stopColor={T.gold} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                      <XAxis dataKey="label" tick={{ fill: T.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: T.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} formatter={(v) => [`AED ${v}`, "MRR"]} />
                      <Area type="monotone" dataKey="mrr" stroke={T.gold} fill="url(#gMRR)" strokeWidth={2.5} name="MRR (AED)" dot={{ fill: T.gold, r: 3 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </Chart>

                <Chart title="Weekly Signups vs Paid" sub="Last 8 weeks">
                  <ResponsiveContainer width="100%" height={230}>
                    <BarChart data={weeklySignups} barGap={4}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                      <XAxis dataKey="label" tick={{ fill: T.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: T.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="signups" name="Signups" fill={T.teal} radius={[4, 4, 0, 0]} barSize={14} opacity={0.7} />
                      <Bar dataKey="paid" name="Paid" fill={T.gold} radius={[4, 4, 0, 0]} barSize={14} />
                    </BarChart>
                  </ResponsiveContainer>
                </Chart>
              </div>

              {/* ── Funnel + Cumulative + Retention ── */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 20 }}>
                <Chart title="Conversion Funnel">
                  <div style={{ padding: "8px 0" }}>
                    {funnelData.map((row, i) => {
                      const maxVal = funnelData[0].value || 1;
                      const pct = Math.round((row.value / maxVal) * 100);
                      return (
                        <div key={i} style={{ marginBottom: 14 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                            <span style={{ fontSize: 12, color: T.textSecondary }}>{row.label}</span>
                            <span style={{ fontSize: 12, fontWeight: 700, color: row.color }}>{row.value} <span style={{ fontSize: 10, color: T.textMuted }}>({pct}%)</span></span>
                          </div>
                          <div style={{ height: 8, borderRadius: 4, background: T.surfaceAlt }}>
                            <div style={{ width: `${pct}%`, height: "100%", borderRadius: 4, background: row.color, transition: "width 0.7s ease" }} />
                          </div>
                        </div>
                      );
                    })}
                    <div style={{ marginTop: 16, padding: "10px 12px", borderRadius: 8, background: "rgba(16,185,129,0.07)", border: "1px solid rgba(16,185,129,0.2)" }}>
                      <div style={{ fontSize: 10, color: T.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>Free → Paid Rate</div>
                      <div style={{ fontSize: 20, fontWeight: 900, color: T.green, fontFamily: "'Fraunces',serif", marginTop: 2 }}>
                        {stats.total > 0 ? Math.round((stats.paid / stats.total) * 100) : 0}%
                      </div>
                    </div>
                  </div>
                </Chart>

                <Chart title="Cumulative User Growth">
                  <ResponsiveContainer width="100%" height={230}>
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

                <Chart title="Weekly Retention by Cohort" sub="% active (trial/pro) by signup week">
                  <div style={{ padding: "8px 0" }}>
                    {weeklyRetention.length === 0 ? (
                      <div style={{ textAlign: "center", color: T.textMuted, fontSize: 12, padding: 32 }}>No cohort data yet</div>
                    ) : weeklyRetention.map((row, i) => (
                      <div key={i} style={{ marginBottom: 14 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                          <span style={{ fontSize: 12, color: T.textSecondary }}>{row.label} <span style={{ color: T.textMuted }}>({row.total} users)</span></span>
                          <span style={{ fontSize: 12, fontWeight: 700, color: row.retention >= 50 ? T.green : row.retention >= 20 ? T.gold : T.textMuted }}>{row.retention}%</span>
                        </div>
                        <div style={{ height: 8, borderRadius: 4, background: T.surfaceAlt }}>
                          <div style={{ width: `${row.retention}%`, height: "100%", borderRadius: 4, background: row.retention >= 50 ? T.green : row.retention >= 20 ? T.gold : T.textMuted, transition: "width 0.7s ease" }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </Chart>
              </div>

              {/* ── Top Projects by Lead Interest ── */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
                <Section title="Top Projects by Lead Interest" sub={`${leads.length} total leads captured`}>
                  {topProjects.length === 0 ? (
                    <div style={{ padding: 24, textAlign: "center", color: T.textMuted, fontSize: 13 }}>No leads captured yet — leads are logged when users click WhatsApp/email on project cards.</div>
                  ) : (
                    <div>
                      {topProjects.map((p, i) => {
                        const maxCount = topProjects[0]?.count || 1;
                        return (
                          <div key={i} className="fade-up" style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: i < topProjects.length - 1 ? `1px solid ${T.border}` : "none", animationDelay: `${i * 0.04}s` }}>
                            <div style={{ width: 24, height: 24, borderRadius: 6, background: T.surfaceAlt, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: i < 3 ? T.gold : T.textMuted, flexShrink: 0 }}>#{i + 1}</div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 13, fontWeight: 600, color: T.white, marginBottom: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</div>
                              <div style={{ height: 4, borderRadius: 2, background: T.surfaceAlt }}>
                                <div style={{ width: `${Math.round((p.count / maxCount) * 100)}%`, height: "100%", borderRadius: 2, background: i < 3 ? T.gold : T.teal }} />
                              </div>
                            </div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: T.gold, flexShrink: 0 }}>{p.count}</div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </Section>

                {/* Revenue projection */}
                <Chart title="Revenue Projection (If Trials Convert)" sub="Based on 30% trial-to-paid assumption">
                  <ResponsiveContainer width="100%" height={240}>
                    <AreaChart data={revenueProjection}>
                      <defs>
                        <linearGradient id="gRevProj" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={T.green} stopOpacity={0.3} />
                          <stop offset="100%" stopColor={T.green} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                      <XAxis dataKey="month" tick={{ fill: T.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: T.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} formatter={(v) => [`AED ${v}`, "MRR"]} />
                      <Area type="monotone" dataKey="revenue" stroke={T.green} fill="url(#gRevProj)" strokeWidth={2.5} name="Projected MRR" dot={{ fill: T.green, r: 4 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </Chart>
              </div>

              {/* ── Milestones ── */}
              <Section title="Growth Milestones" sub="Track your progress towards key goals">
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
                  {[
                    { label: "Platform Launch", target: 1, current: 1, icon: "launch", date: "Mar 2026" },
                    { label: "First 10 Users", target: 10, current: stats.total, icon: "users" },
                    { label: "First 50 Users", target: 50, current: stats.total, icon: "target" },
                    { label: "First Paid User", target: 1, current: stats.paid, icon: "card" },
                    { label: "100 Users", target: 100, current: stats.total, icon: "hundred" },
                    { label: "AED 10K MRR", target: 10000, current: mrr, icon: "trophy" },
                    { label: "500 Users", target: 500, current: stats.total, icon: "⭐" },
                    { label: "AED 50K MRR", target: 50000, current: mrr, icon: "trophy" },
                  ].map((m, i) => {
                    const done = m.current >= m.target;
                    const pct = Math.min(Math.round((m.current / m.target) * 100), 100);
                    return (
                      <div key={i} className="chart-box fade-up" style={{ padding: 16, animationDelay: `${i * 0.04}s`, border: done ? `1px solid rgba(16,185,129,0.3)` : `1px solid ${T.border}` }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                          <span style={{ fontSize: 10, fontWeight: 800, color: T.gold, fontFamily: "'Outfit',sans-serif", letterSpacing: 0.5 }}>{m.icon === "trophy" ? "MRR" : m.icon === "launch" ? "GO" : m.icon === "users" || m.icon === "user" ? "USR" : m.icon === "target" ? "50" : m.icon === "card" ? "PAY" : m.icon === "hundred" ? "100" : m.label.slice(0,3).toUpperCase()}</span>
                          {done
                            ? <span style={{ fontSize: 9, fontWeight: 700, padding: "3px 8px", borderRadius: 6, background: "rgba(16,185,129,0.12)", color: T.green }}>✓ Done</span>
                            : <span style={{ fontSize: 9, fontWeight: 700, color: T.textMuted }}>{pct}%</span>
                          }
                        </div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: done ? T.white : T.textSecondary, marginBottom: 6 }}>{m.label}</div>
                        <div style={{ height: 4, borderRadius: 2, background: T.surfaceAlt }}>
                          <div style={{ width: `${pct}%`, height: "100%", borderRadius: 2, background: done ? T.green : T.gold, transition: "width 0.5s" }} />
                        </div>
                        {!done && m.target > 1 && <div style={{ fontSize: 10, color: T.textMuted, marginTop: 5 }}>{(m.target - m.current).toLocaleString()} to go</div>}
                        {m.date && <div style={{ fontSize: 10, color: T.green, marginTop: 4 }}>{m.date}</div>}
                      </div>
                    );
                  })}
                </div>
              </Section>
            </>
            );
          })()}

          {tab === "tabcontrol" && (() => {
            const ALL_TABS = [
              "Overview", "Financials", "Projects", "Handover", "Launch Calendar",
              "Neighbourhoods", "Service Charges", "STR vs LTR", "Developer Health",
              "DLD Volumes", "DXB Estimate", "Portfolio", "Competitors", "Yields",
              "Mortgage", "Map", "Risk", "Market", "Currency", "Golden Visa", "Flip"
            ];

            const TIERS = ["free", "pro", "enterprise"];
            const TIER_COLORS = { free: T.textSecondary, pro: T.gold, enterprise: T.purple };
            const TIER_LABELS = { free: "Free", pro: "Pro", enterprise: "Enterprise" };

            const getTabSetting = (tabKey) => tabSettings[tabKey] || { visible: true, minTier: "free" };

            const updateTabSetting = async (tabKey, field, value) => {
              const current = getTabSetting(tabKey);
              const updated = { ...tabSettings, [tabKey]: { ...current, [field]: value } };
              setTabSettings(updated);
              setTabSettingsSaving(true);
              try { await setDoc(doc(db, "platformSettings", "tabs"), updated); } catch(e) {}
              setTimeout(() => setTabSettingsSaving(false), 800);
            };

            // ── Per-tab default data ──
            const TAB_DATA = {
              "Yields": {
                fields: ["community","grossYield","netYield","avgRent","trend"],
                labels: { community:"Community", grossYield:"Gross Yield %", netYield:"Net Yield %", avgRent:"Avg Annual Rent (AED)", trend:"Trend" },
                rows: liveCommunityROI && Object.keys(liveCommunityROI).length > 0
                  ? Object.entries(liveCommunityROI).map(([k,v]) => ({ community: k, grossYield: v.grossYield || "", netYield: v.netYield || "", avgRent: v.avgRent || "", trend: v.trend || "" }))
                  : [
                    { community:"Dubai Marina", grossYield:"5.8", netYield:"4.9", avgRent:"110000", trend:"stable" },
                    { community:"Downtown Dubai", grossYield:"5.2", netYield:"4.3", avgRent:"155000", trend:"rising" },
                    { community:"JVC", grossYield:"8.2", netYield:"6.8", avgRent:"62000", trend:"rising" },
                    { community:"Business Bay", grossYield:"6.4", netYield:"5.3", avgRent:"98000", trend:"stable" },
                    { community:"Palm Jumeirah", grossYield:"5.0", netYield:"4.1", avgRent:"420000", trend:"stable" },
                    { community:"Dubai Hills", grossYield:"5.5", netYield:"4.6", avgRent:"185000", trend:"rising" },
                    { community:"Creek Harbour", grossYield:"6.1", netYield:"5.0", avgRent:"125000", trend:"rising" },
                    { community:"Emaar Beachfront", grossYield:"5.7", netYield:"4.7", avgRent:"195000", trend:"stable" },
                  ],
                firestoreKey: "yieldData",
              },
              "Developer Health": {
                fields: ["developer","revenue","profit","backlog","score","rating"],
                labels: { developer:"Developer", revenue:"Revenue (AED B)", profit:"Profit (AED B)", backlog:"Backlog (AED B)", score:"Score /100", rating:"Rating" },
                rows: [
                  { developer:"Emaar", revenue:"49.6", profit:"25.7", backlog:"155", score:"95", rating:"AAA" },
                  { developer:"DAMAC", revenue:"21.8", profit:"6.2", backlog:"85", score:"72", rating:"BB+" },
                  { developer:"Nakheel/Dubai Holding", revenue:"17.2", profit:"4.8", backlog:"62", score:"79", rating:"AA-" },
                  { developer:"Aldar", revenue:"16.4", profit:"3.9", backlog:"48", score:"76", rating:"A+" },
                  { developer:"Sobha", revenue:"8.1", profit:"1.9", backlog:"31", score:"68", rating:"BBB" },
                  { developer:"Meraas", revenue:"12.1", profit:"3.2", backlog:"44", score:"82", rating:"A" },
                ],
                firestoreKey: "developerHealth",
              },
              "DLD Volumes": {
                fields: ["community","deals","value","avgPrice","yoyChange"],
                labels: { community:"Community", deals:"Deals (2025)", value:"Value (AED B)", avgPrice:"Avg Price (AED)", yoyChange:"YoY Change %" },
                rows: [
                  { community:"Business Bay", deals:"29950", value:"89.2", avgPrice:"1850000", yoyChange:"+18" },
                  { community:"JVC", deals:"13676", value:"28.4", avgPrice:"780000", yoyChange:"+22" },
                  { community:"Dubai Marina", deals:"10400", value:"45.6", avgPrice:"2100000", yoyChange:"+15" },
                  { community:"Downtown Dubai", deals:"5800", value:"38.9", avgPrice:"3200000", yoyChange:"+12" },
                  { community:"Dubai Hills Estate", deals:"4100", value:"29.7", avgPrice:"3850000", yoyChange:"+19" },
                  { community:"Creek Harbour", deals:"3150", value:"18.2", avgPrice:"2890000", yoyChange:"+44" },
                  { community:"Palm Jumeirah", deals:"1680", value:"42.8", avgPrice:"7640000", yoyChange:"+11" },
                  { community:"Emaar Beachfront", deals:"1520", value:"12.4", avgPrice:"3200000", yoyChange:"+28" },
                  { community:"Arabian Ranches III", deals:"1200", value:"8.9", avgPrice:"2950000", yoyChange:"+16" },
                  { community:"The Valley", deals:"970", value:"5.8", avgPrice:"1890000", yoyChange:"+41" },
                ],
                firestoreKey: "dldVolumes",
              },
              "STR vs LTR": {
                fields: ["community","strYield","ltrYield","occupancy","avgNightly","verdict"],
                labels: { community:"Community", strYield:"STR Yield %", ltrYield:"LTR Yield %", occupancy:"STR Occupancy %", avgNightly:"Avg Nightly (AED)", verdict:"Verdict" },
                rows: [
                  { community:"Dubai Marina", strYield:"7.2", ltrYield:"5.8", occupancy:"74", avgNightly:"650", verdict:"STR wins" },
                  { community:"Downtown Dubai", strYield:"6.8", ltrYield:"5.2", occupancy:"71", avgNightly:"820", verdict:"STR wins" },
                  { community:"Palm Jumeirah", strYield:"5.9", ltrYield:"5.0", occupancy:"68", avgNightly:"1450", verdict:"STR slight edge" },
                  { community:"JVC", strYield:"6.1", ltrYield:"8.2", occupancy:"55", avgNightly:"380", verdict:"LTR wins" },
                  { community:"Business Bay", strYield:"7.0", ltrYield:"6.4", occupancy:"70", avgNightly:"590", verdict:"STR wins" },
                  { community:"Dubai Hills", strYield:"4.8", ltrYield:"5.5", occupancy:"58", avgNightly:"920", verdict:"LTR wins" },
                  { community:"Creek Harbour", strYield:"6.5", ltrYield:"6.1", occupancy:"65", avgNightly:"710", verdict:"STR slight edge" },
                ],
                firestoreKey: "strLtrData",
              },
              "Service Charges": {
                fields: ["community","chargePerSqft","totalFor1BR","totalFor2BR","mollakReg","trend"],
                labels: { community:"Community", chargePerSqft:"AED/sqft/yr", totalFor1BR:"1BR Total (AED)", totalFor2BR:"2BR Total (AED)", mollakReg:"Mollak Reg", trend:"Trend" },
                rows: [
                  { community:"Dubai Marina", chargePerSqft:"18", totalFor1BR:"15800", totalFor2BR:"26500", mollakReg:"Yes", trend:"stable" },
                  { community:"Downtown Dubai", chargePerSqft:"22", totalFor1BR:"20200", totalFor2BR:"34800", mollakReg:"Yes", trend:"rising" },
                  { community:"Palm Jumeirah", chargePerSqft:"28", totalFor1BR:"29400", totalFor2BR:"52200", mollakReg:"Yes", trend:"rising" },
                  { community:"JVC", chargePerSqft:"13", totalFor1BR:"9100", totalFor2BR:"15600", mollakReg:"Yes", trend:"stable" },
                  { community:"Business Bay", chargePerSqft:"16", totalFor1BR:"13200", totalFor2BR:"22800", mollakReg:"Yes", trend:"stable" },
                  { community:"Dubai Hills", chargePerSqft:"19", totalFor1BR:"17100", totalFor2BR:"30400", mollakReg:"Yes", trend:"stable" },
                  { community:"Creek Harbour", chargePerSqft:"21", totalFor1BR:"18900", totalFor2BR:"33200", mollakReg:"Yes", trend:"rising" },
                ],
                firestoreKey: "serviceCharges",
              },
              "Competitors": {
                fields: ["developer","sales2025","marketShare","projects","avgPriceSqft","strength"],
                labels: { developer:"Developer", sales2025:"2025 Sales (AED B)", marketShare:"Market Share %", projects:"Active Projects", avgPriceSqft:"Avg AED/sqft", strength:"Strength" },
                rows: [
                  { developer:"Emaar", sales2025:"80.4", marketShare:"11.8", projects:"42", avgPriceSqft:"2100", strength:"Brand + scale" },
                  { developer:"DAMAC", sales2025:"32.0", marketShare:"4.7", projects:"28", avgPriceSqft:"1850", strength:"Luxury + speed" },
                  { developer:"Nakheel", sales2025:"24.5", marketShare:"3.6", projects:"18", avgPriceSqft:"1620", strength:"Land bank" },
                  { developer:"Sobha", sales2025:"18.2", marketShare:"2.7", projects:"12", avgPriceSqft:"1980", strength:"Quality build" },
                  { developer:"Aldar", sales2025:"16.4", marketShare:"2.4", projects:"15", avgPriceSqft:"1740", strength:"Abu Dhabi expand" },
                  { developer:"Meraas", sales2025:"14.8", marketShare:"2.2", projects:"11", avgPriceSqft:"2250", strength:"Lifestyle projects" },
                ],
                firestoreKey: "competitorData",
              },
              "Mortgage": {
                fields: ["bank","rate","maxLTV","processingFee","minSalary","notes"],
                labels: { bank:"Bank", rate:"Rate (EIBOR+%)", maxLTV:"Max LTV %", processingFee:"Processing Fee", minSalary:"Min Salary (AED)", notes:"Notes" },
                rows: [
                  { bank:"Emirates NBD", rate:"4.99", maxLTV:"80", processingFee:"1%", minSalary:"15000", notes:"Variable only" },
                  { bank:"ADCB", rate:"4.89", maxLTV:"80", processingFee:"0.95%", minSalary:"12000", notes:"Fixed 3yr option" },
                  { bank:"Mashreq", rate:"4.75", maxLTV:"75", processingFee:"1%", minSalary:"10000", notes:"Best for expats" },
                  { bank:"FAB", rate:"4.99", maxLTV:"80", processingFee:"0.5%", minSalary:"15000", notes:"Low proc fee" },
                  { bank:"DIB", rate:"4.49", maxLTV:"80", processingFee:"1%", minSalary:"12000", notes:"Islamic only" },
                  { bank:"ENBD Islamic", rate:"4.59", maxLTV:"80", processingFee:"1%", minSalary:"12000", notes:"Murabaha" },
                ],
                firestoreKey: "mortgageRates",
              },
              "Neighbourhoods": {
                fields: ["community","score","priceGrowth","rentalDemand","infraRating","recommended"],
                labels: { community:"Community", score:"Overall Score", priceGrowth:"Price Growth %", rentalDemand:"Rental Demand", infraRating:"Infra Rating", recommended:"Recommended For" },
                rows: [
                  { community:"Dubai Marina", score:"88", priceGrowth:"12.5", rentalDemand:"Very High", infraRating:"5/5", recommended:"Investors, Expats" },
                  { community:"Downtown Dubai", score:"91", priceGrowth:"14.2", rentalDemand:"Very High", infraRating:"5/5", recommended:"Premium buyers" },
                  { community:"JVC", score:"74", priceGrowth:"11.8", rentalDemand:"High", infraRating:"3/5", recommended:"First-time buyers" },
                  { community:"Dubai Hills", score:"85", priceGrowth:"15.1", rentalDemand:"High", infraRating:"4/5", recommended:"Families" },
                  { community:"Creek Harbour", score:"82", priceGrowth:"18.4", rentalDemand:"High", infraRating:"4/5", recommended:"Long-term investors" },
                  { community:"Palm Jumeirah", score:"90", priceGrowth:"11.2", rentalDemand:"Medium", infraRating:"5/5", recommended:"Ultra-luxury" },
                  { community:"Business Bay", score:"80", priceGrowth:"13.6", rentalDemand:"Very High", infraRating:"4/5", recommended:"Young professionals" },
                ],
                firestoreKey: "neighbourhoodScores",
              },
              "Market": {
                fields: ["metric","value","period","source","change"],
                labels: { metric:"Metric", value:"Value", period:"Period", source:"Source", change:"YoY Change" },
                rows: [
                  { metric:"Total Transactions", value:"214,912", period:"FY2025", source:"DLD", change:"+18.82%" },
                  { metric:"Total Volume", value:"AED 682.5B", period:"FY2025", source:"DLD", change:"+30.64%" },
                  { metric:"Avg Price/sqft", value:"AED 1,689", period:"Dec 2025", source:"REIDIN", change:"+12.88%" },
                  { metric:"Off-plan Share", value:"68%", period:"FY2025", source:"DXB Interact", change:"+5pp" },
                  { metric:"Apartment Growth", value:"+12.52%", period:"FY2025", source:"ValuStrat", change:"+12.52%" },
                  { metric:"Villa Growth", value:"+15.16%", period:"FY2025", source:"ValuStrat", change:"+15.16%" },
                  { metric:"Rental Yield Avg", value:"6.9%", period:"Dec 2025", source:"REIDIN", change:"+0.4pp" },
                ],
                firestoreKey: "marketData",
              },
            };

            const activeTabData = selectedTabControl ? TAB_DATA[selectedTabControl] : null;

            // Get editable rows for selected tab
            const getEditableRows = () => {
              if (!activeTabData) return [];
              const edited = tabDataEdits[selectedTabControl];
              return edited || activeTabData.rows;
            };

            const updateCell = (rowIdx, field, value) => {
              const rows = getEditableRows().map((r, i) => i === rowIdx ? { ...r, [field]: value } : r);
              setTabDataEdits(prev => ({ ...prev, [selectedTabControl]: rows }));
            };

            const addRow = () => {
              if (!activeTabData) return;
              const emptyRow = {};
              activeTabData.fields.forEach(f => { emptyRow[f] = ""; });
              const rows = [...getEditableRows(), emptyRow];
              setTabDataEdits(prev => ({ ...prev, [selectedTabControl]: rows }));
            };

            const deleteRow = (idx) => {
              const rows = getEditableRows().filter((_, i) => i !== idx);
              setTabDataEdits(prev => ({ ...prev, [selectedTabControl]: rows }));
            };

            const saveTabData = async () => {
              if (!activeTabData || !selectedTabControl) return;
              setTabDataSaving(true);
              const rows = getEditableRows();
              try {
                await setDoc(doc(db, "tabData", activeTabData.firestoreKey), { rows, updatedAt: new Date().toISOString() });
                setTabSettingsSaving(true);
                setTimeout(() => { setTabSettingsSaving(false); setTabDataSaving(false); }, 1000);
              } catch(e) {
                console.error("Save failed:", e);
                setTabDataSaving(false);
              }
            };

            const hiddenCount = ALL_TABS.filter(t => !getTabSetting(t).visible).length;
            const proCount = ALL_TABS.filter(t => getTabSetting(t).minTier === "pro").length;
            const entCount = ALL_TABS.filter(t => getTabSetting(t).minTier === "enterprise").length;
            const hasData = (t) => !!TAB_DATA[t];

            return (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

                {/* Header */}
                <div style={{ background: T.surface, borderRadius: 14, border: `1px solid ${T.border}`, padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                  <div>
                    <div style={{ fontFamily: "'Fraunces', serif", fontSize: 20, fontWeight: 800, color: T.gold }}>Tab Control</div>
                    <div style={{ fontSize: 12, color: T.textMuted, marginTop: 2 }}>Toggle visibility, set tier access, and edit tab data · All saved to Firestore instantly</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {tabSettingsSaving && <div style={{ fontSize: 11, color: T.green, display: "flex", alignItems: "center", gap: 5 }}><div style={{ width: 6, height: 6, borderRadius: "50%", background: T.green }} />Saved ✓</div>}
                    <div style={{ fontSize: 11, color: T.textMuted, padding: "5px 10px", background: T.surfaceAlt, borderRadius: 8, border: `1px solid ${T.border}` }}>
                      {hiddenCount} hidden · {proCount} Pro · {entCount} Ent
                    </div>
                    <button type="button" onClick={async () => {
                      const u = {}; ALL_TABS.forEach(t => { u[t] = { visible: true, minTier: "free" }; });
                      setTabSettings(u); setTabSettingsSaving(true);
                      await setDoc(doc(db, "platformSettings", "tabs"), u);
                      setTimeout(() => setTabSettingsSaving(false), 800);
                    }} style={{ padding: "5px 12px", borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: "pointer", border: `1px solid ${T.border}`, background: T.surfaceAlt, color: T.textMuted, fontFamily: "'Outfit',sans-serif" }}>Reset All</button>
                  </div>
                </div>

                {/* Stacked layout */}
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

                  {/* TOP — Tab list (horizontal scrollable cards) */}
                  <div style={{ background: T.surface, borderRadius: 14, border: `1px solid ${T.border}`, overflow: "hidden" }}>
                    <div style={{ padding: "10px 16px", borderBottom: `1px solid ${T.border}`, display: "grid", gridTemplateColumns: "1fr 44px", gap: 8, alignItems: "center" }}>
                      <span style={{ fontSize: 9, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: 1 }}>Tab</span>
                      <span style={{ fontSize: 9, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: 1, textAlign: "center" }}>On</span>
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, padding: "12px 16px" }}>
                      {ALL_TABS.map((tabKey) => {
                        const setting = getTabSetting(tabKey);
                        const isVisible = setting.visible !== false;
                        const minTier = setting.minTier || "free";
                        const isSelected = selectedTabControl === tabKey;
                        const editable = hasData(tabKey);
                        return (
                          <div key={tabKey} onClick={() => setSelectedTabControl(isSelected ? null : tabKey)} style={{
                            display: "flex", alignItems: "center", gap: 8,
                            padding: "8px 14px",
                            borderRadius: 10,
                            background: isSelected ? "rgba(212,168,67,0.1)" : T.surfaceAlt,
                            border: `1px solid ${isSelected ? T.gold : T.border}`,
                            cursor: "pointer", transition: "all 0.15s",
                          }}>
                            {/* Visibility dot */}
                            <div style={{ width: 7, height: 7, borderRadius: "50%", flexShrink: 0,
                              background: !isVisible ? T.textMuted : minTier === "enterprise" ? T.purple : minTier === "pro" ? T.gold : T.green }} />
                            {/* Name */}
                            <span style={{ fontSize: 12, fontWeight: isSelected ? 700 : 500, color: isVisible ? T.white : T.textMuted, whiteSpace: "nowrap" }}>{tabKey}</span>
                            {/* Tier badge */}
                            {minTier !== "free" && <span style={{ fontSize: 9, fontWeight: 700, color: TIER_COLORS[minTier], padding: "1px 5px", borderRadius: 4, background: `${TIER_COLORS[minTier]}15` }}>{TIER_LABELS[minTier].toUpperCase()}</span>}
                            {/* Data badge */}
                            {editable && <span style={{ fontSize: 9, color: T.blue, padding: "1px 5px", borderRadius: 4, background: "rgba(59,130,246,0.1)" }}>DATA</span>}
                            {/* Toggle */}
                            <div onClick={e => e.stopPropagation()}>
                              <button type="button" onClick={() => updateTabSetting(tabKey, "visible", !isVisible)} style={{
                                width: 32, height: 18, borderRadius: 9,
                                background: isVisible ? T.green : "rgba(255,255,255,0.08)",
                                border: "none", cursor: "pointer", position: "relative", transition: "background 0.2s", display: "block"
                              }}>
                                <div style={{ position: "absolute", top: 2, left: isVisible ? 16 : 2, width: 14, height: 14, borderRadius: "50%", background: T.white, transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.3)" }} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* BOTTOM — Selected tab config (full width) */}
                  {!selectedTabControl ? (
                    <div style={{ background: T.surface, borderRadius: 14, border: `1px solid ${T.border}`, padding: "32px 24px", textAlign: "center" }}>
                      
                      <div style={{ fontSize: 14, fontWeight: 600, color: T.white, marginBottom: 6 }}>Select a tab above to configure</div>
                      <div style={{ fontSize: 12, color: T.textMuted }}>Click any tab card to set tier access or edit its data table in full width</div>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        {/* Tier control for selected tab */}
                        <div style={{ background: T.surface, borderRadius: 14, border: `1px solid ${T.border}`, padding: "16px 20px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                            <div>
                              <div style={{ fontSize: 16, fontWeight: 700, color: T.white, fontFamily: "'Fraunces', serif" }}>{selectedTabControl}</div>
                              <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>Access control · Who can see this tab</div>
                            </div>
                            <button type="button" onClick={() => setSelectedTabControl(null)} style={{ background: "none", border: "none", color: T.textMuted, fontSize: 18, cursor: "pointer" }}>✕</button>
                          </div>
                          <div style={{ display: "flex", gap: 8 }}>
                            {TIERS.map(tier => {
                              const setting = getTabSetting(selectedTabControl);
                              const minTier = setting.minTier || "free";
                              return (
                                <button key={tier} type="button" onClick={() => updateTabSetting(selectedTabControl, "minTier", tier)} style={{
                                  flex: 1, padding: "10px 0", borderRadius: 10, fontSize: 12, fontWeight: 700,
                                  cursor: "pointer", border: `1px solid ${minTier === tier ? TIER_COLORS[tier] : T.border}`,
                                  background: minTier === tier ? `${TIER_COLORS[tier]}18` : T.surfaceAlt,
                                  color: minTier === tier ? TIER_COLORS[tier] : T.textMuted,
                                  transition: "all 0.15s", fontFamily: "'Outfit',sans-serif"
                                }}>
                                  {tier === "free" ? "Free" : tier === "pro" ? "Pro" : "Enterprise"}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Data table editor */}
                        {activeTabData ? (
                          <div style={{ background: T.surface, borderRadius: 14, border: `1px solid ${T.border}`, overflow: "hidden" }}>
                            <div style={{ padding: "14px 20px", borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <div>
                                <div style={{ fontSize: 13, fontWeight: 700, color: T.white }}>Data Table — {selectedTabControl}</div>
                                <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>Edit any cell · Changes saved to Firestore → live on dashboard</div>
                              </div>
                              <div style={{ display: "flex", gap: 8 }}>
                                <button type="button" onClick={addRow} style={{ padding: "6px 14px", borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: "pointer", border: `1px solid ${T.border}`, background: T.surfaceAlt, color: T.textSecondary, fontFamily: "'Outfit',sans-serif" }}>+ Add Row</button>
                                <button type="button" onClick={saveTabData} disabled={tabDataSaving} style={{ padding: "6px 14px", borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: "pointer", border: `1px solid ${T.gold}`, background: "rgba(212,168,67,0.1)", color: T.gold, fontFamily: "'Outfit',sans-serif" }}>
                                  {tabDataSaving ? "Saving…" : "Save"}
                                </button>
                              </div>
                            </div>
                            <div style={{ overflowX: "auto" }}>
                              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                                <thead>
                                  <tr style={{ background: T.surfaceAlt }}>
                                    {activeTabData.fields.map(f => (
                                      <th key={f} style={{ padding: "10px 12px", textAlign: "left", fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: 0.8, whiteSpace: "nowrap", borderBottom: `1px solid ${T.border}` }}>
                                        {activeTabData.labels[f]}
                                      </th>
                                    ))}
                                    <th style={{ padding: "10px 12px", borderBottom: `1px solid ${T.border}` }} />
                                  </tr>
                                </thead>
                                <tbody>
                                  {getEditableRows().map((row, rowIdx) => (
                                    <tr key={rowIdx} style={{ borderBottom: `1px solid ${T.border}` }}
                                      onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.02)"}
                                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                                    >
                                      {activeTabData.fields.map(f => (
                                        <td key={f} style={{ padding: "6px 8px" }}>
                                          <input
                                            value={row[f] ?? ""}
                                            onChange={e => updateCell(rowIdx, f, e.target.value)}
                                            style={{
                                              width: "100%", minWidth: 80, background: "rgba(255,255,255,0.04)",
                                              border: `1px solid ${T.border}`, borderRadius: 6,
                                              padding: "5px 8px", color: T.white, fontSize: 12,
                                              fontFamily: "'Outfit', sans-serif", outline: "none",
                                              transition: "border-color 0.15s"
                                            }}
                                            onFocus={e => e.target.style.borderColor = T.gold}
                                            onBlur={e => e.target.style.borderColor = "rgba(212,168,67,0.08)"}
                                          />
                                        </td>
                                      ))}
                                      <td style={{ padding: "6px 8px" }}>
                                        <button type="button" onClick={() => deleteRow(rowIdx)} style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 6, color: "#EF4444", fontSize: 11, padding: "4px 8px", cursor: "pointer" }}>✕</button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                            <div style={{ padding: "10px 20px", fontSize: 11, color: T.textMuted, borderTop: `1px solid ${T.border}` }}>
                              Saved to Firestore: <code style={{ color: T.gold, fontSize: 10 }}>tabData/{activeTabData.firestoreKey}</code> · Dashboard reads this collection on load
                            </div>
                          </div>
                        ) : (
                          <div style={{ background: T.surface, borderRadius: 14, border: `1px solid ${T.border}`, padding: "32px 24px", textAlign: "center" }}>
                            <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(100,116,139,0.1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", color: "#64748B" }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: T.white, marginBottom: 6 }}>No editable data for this tab</div>
                            <div style={{ fontSize: 12, color: T.textMuted }}>This tab renders dynamic or user-specific data (Portfolio, Map, DXB Estimate, etc.) that can't be edited here.</div>
                          </div>
                        )}
                    </div>
                  )}
                </div>

                {/* Quick actions */}
                <div style={{ background: T.surface, borderRadius: 14, border: `1px solid ${T.border}`, padding: "14px 20px", display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                  <span style={{ fontSize: 11, color: T.textMuted, marginRight: 4 }}>Quick:</span>
                  {[
                    { label: "Show All", color: T.green, action: async () => { const u = {}; ALL_TABS.forEach(t => { u[t] = { ...getTabSetting(t), visible: true }; }); setTabSettings(u); setTabSettingsSaving(true); await setDoc(doc(db, "platformSettings", "tabs"), u); setTimeout(() => setTabSettingsSaving(false), 800); } },
                    { label: "Lock All to Pro+", color: T.gold, action: async () => { const u = {}; ALL_TABS.forEach(t => { if (!["Overview","Projects"].includes(t)) u[t] = { ...getTabSetting(t), minTier: "pro" }; }); const f = { ...tabSettings, ...u }; setTabSettings(f); setTabSettingsSaving(true); await setDoc(doc(db, "platformSettings", "tabs"), f); setTimeout(() => setTabSettingsSaving(false), 800); } },
                    { label: "Hide Analytics Tabs", color: T.textMuted, action: async () => { const hide = ["DLD Volumes","Developer Health","Competitors","Risk","Market"]; const u = { ...tabSettings }; hide.forEach(t => { u[t] = { ...getTabSetting(t), visible: false }; }); setTabSettings(u); setTabSettingsSaving(true); await setDoc(doc(db, "platformSettings", "tabs"), u); setTimeout(() => setTabSettingsSaving(false), 800); } },
                  ].map(({ label, action, color }) => (
                    <button key={label} type="button" onClick={action} style={{ padding: "6px 14px", borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: "pointer", border: `1px solid ${color}40`, background: `${color}10`, color, fontFamily: "'Outfit',sans-serif" }}>{label}</button>
                  ))}
                </div>

                <div style={{ fontSize: 11, color: T.textMuted, padding: "8px 14px", borderRadius: 8, background: T.surfaceAlt, border: `1px solid ${T.border}` }}>
                  Tip: Tabs marked <span style={{ color: T.blue }}>DATA</span> have editable tables. Click to open. Data saved to <code style={{ fontSize: 10 }}>Firestore/tabData/</code>. Note: dashboard must read from Firestore for edits to reflect live — hook this into each tab's data source for full live control.
                </div>
              </div>
            );
          })()}

          {tab === "eibor" && <EiborRatesPanel db={db} T={T} />}

        </div>
      </main>

      {/* ─── PROFILE MODAL ─── */}
      {showProfile && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)", zIndex: 9000, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setShowProfile(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 20, width: "100%", maxWidth: 400, padding: 32, boxShadow: "0 25px 80px rgba(0,0,0,0.5)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <h3 style={{ fontFamily: "'Fraunces',serif", fontSize: 20, fontWeight: 800, color: T.gold }}>{i18t("ui", "profile")}</h3>
              <button type="button" onClick={() => setShowProfile(false)} style={{ background: "none", border: "none", color: T.textMuted, fontSize: 20, cursor: "pointer" }}>&times;</button>
            </div>
            {/* Avatar */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, marginBottom: 24 }}>
              <div style={{ width: 72, height: 72, borderRadius: "50%", background: `linear-gradient(135deg, ${T.gold}, #B8912F)`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 28, color: T.bg }}>
                {(adminUser?.displayName || adminUser?.email || "A")[0].toUpperCase()}
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: T.white }}>{adminUser?.displayName || adminUser?.email?.split("@")[0]}</div>
                <div style={{ fontSize: 12, color: T.textMuted, marginTop: 2 }}>{adminUser?.email}</div>
                <div style={{ display: "inline-block", marginTop: 8, padding: "4px 12px", borderRadius: 6, background: "rgba(212,168,67,0.12)", border: `1px solid ${T.gold}33`, fontSize: 11, fontWeight: 700, color: T.gold, letterSpacing: 0.5 }}>{i18t("sidebar", "admin")}</div>
              </div>
            </div>
            {/* Info rows */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 12px", borderRadius: 8, background: T.surfaceAlt }}>
                <span style={{ fontSize: 12, color: T.textMuted }}>UID</span>
                <span style={{ fontSize: 11, color: T.textSecondary, fontFamily: "monospace" }}>{adminUser?.uid?.slice(0, 16)}...</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 12px", borderRadius: 8, background: T.surfaceAlt }}>
                <span style={{ fontSize: 12, color: T.textMuted }}>{i18t("ui", "email")}</span>
                <span style={{ fontSize: 12, color: T.white }}>{adminUser?.email}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 12px", borderRadius: 8, background: T.surfaceAlt }}>
                <span style={{ fontSize: 12, color: T.textMuted }}>Role</span>
                <span style={{ fontSize: 12, color: T.gold, fontWeight: 600 }}>{i18t("sidebar", "admin")}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 12px", borderRadius: 8, background: T.surfaceAlt }}>
                <span style={{ fontSize: 12, color: T.textMuted }}>Total Users</span>
                <span style={{ fontSize: 12, color: T.white, fontWeight: 600 }}>{users.length}</span>
              </div>
            </div>
            {/* Sign Out */}
            <button type="button" onClick={() => { signOut(auth); setShowProfile(false); }} style={{ width: "100%", marginTop: 20, padding: "10px 0", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, color: "#EF4444", fontWeight: 600, fontSize: 12, cursor: "pointer", fontFamily: "'Outfit', sans-serif" }}>{i18t("ui", "signOut")}</button>
          </div>
        </div>
      )}
    </div>
  );
}
