/* ═══════════════════════════════════════════════════════════════
   DXB ANALYTICS — ADMIN PANEL  (Clean Rewrite)
   7 tabs: Overview · Users · Data Manager · Revenue · Leads · Broadcast · Settings
   ═══════════════════════════════════════════════════════════════ */
import React, { useState, useEffect, useCallback } from "react";
import { auth, db, storage } from "./firebase";
import emailjs from "@emailjs/browser";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { onAuthStateChanged, signOut, createUserWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { collection, getDocs, doc, getDoc, setDoc, deleteDoc, query, where, orderBy, limit } from "firebase/firestore";
import { BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { emaarProjects, emaarCommunities, emaarYields, communityROI as defaultCommunityROI } from "./data";
import { useI18n, LANGUAGES } from "./i18n";

const T = {
  bg: "#04090F", surface: "#0A1628", surfaceAlt: "#0E1D35", card: "#0D1B30",
  gold: "#D4A843", goldLight: "#E8C96A", goldDim: "#B8912F", goldGlow: "rgba(212,168,67,0.12)",
  teal: "#00BFA5", white: "#FFFFFF",
  textPrimary: "#E2E8F0", textSecondary: "#94A3B8", textMuted: "#64748B",
  border: "rgba(212,168,67,0.08)", borderHover: "rgba(212,168,67,0.2)",
  red: "#EF4444", green: "#10B981", blue: "#3B82F6", purple: "#8B5CF6",
  cyan: "#06B6D4", orange: "#F59E0B",
};

const COUNTRIES = [
  { code: "UAE", label: "🇦🇪 UAE" }, { code: "Saudi Arabia", label: "🇸🇦 Saudi Arabia" },
  { code: "Qatar", label: "🇶🇦 Qatar" }, { code: "Kuwait", label: "🇰🇼 Kuwait" },
  { code: "Bahrain", label: "🇧🇭 Bahrain" }, { code: "Oman", label: "🇴🇲 Oman" },
  { code: "UK", label: "🇬🇧 UK" }, { code: "USA", label: "🇺🇸 USA" },
  { code: "India", label: "🇮🇳 India" }, { code: "Pakistan", label: "🇵🇰 Pakistan" },
  { code: "Egypt", label: "🇪🇬 Egypt" }, { code: "Jordan", label: "🇯🇴 Jordan" },
  { code: "Lebanon", label: "🇱🇧 Lebanon" }, { code: "Russia", label: "🇷🇺 Russia" },
  { code: "China", label: "🇨🇳 China" }, { code: "Germany", label: "🇩🇪 Germany" },
  { code: "France", label: "🇫🇷 France" }, { code: "Canada", label: "🇨🇦 Canada" },
  { code: "Australia", label: "🇦🇺 Australia" }, { code: "Other", label: "🌍 Other" },
];

const I = {
  overview: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>,
  users: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  revenue: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
  leads: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>,
  data: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4.03 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5"/></svg>,
  bell: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
  settings: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  logout: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  search: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  download: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  refresh: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>,
  trash: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>,
  edit: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  check: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>,
  projects: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>,
  chart: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/></svg>,
  yields: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
  verify: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>,
  calendar: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  analytics: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
};

const css = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700;9..144,900&display=swap');
* { margin:0; padding:0; box-sizing:border-box; }
html { font-size:14px; }
body { background:${T.bg}; color:${T.textPrimary}; font-family:'Outfit',sans-serif; }
::-webkit-scrollbar { width:6px; height:6px; }
::-webkit-scrollbar-track { background:transparent; }
::-webkit-scrollbar-thumb { background:rgba(212,168,67,0.2); border-radius:3px; }
select option { background:${T.surface}; color:${T.textPrimary}; }
@keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }
@keyframes spin { to{transform:rotate(360deg)} }
@keyframes toastIn { 0%{opacity:0;transform:translateY(20px)} 100%{opacity:1;transform:translateY(0)} }
@keyframes toastOut { 0%{opacity:1} 100%{opacity:0;transform:translateY(-10px)} }
.fade-up { animation:fadeUp .5s ease-out forwards; opacity:0; }
.toast-notify { animation:toastIn .3s ease-out, toastOut .4s ease-in 2.4s forwards; }
.kpi-card { background:linear-gradient(135deg,${T.card} 0%,${T.surfaceAlt} 100%); border:1px solid ${T.border}; border-radius:16px; padding:20px 16px; position:relative; overflow:hidden; transition:all .3s ease; }
.kpi-card:hover { border-color:${T.borderHover}; transform:translateY(-2px); box-shadow:0 8px 32px rgba(0,0,0,.3); }
.chart-box { background:linear-gradient(180deg,${T.card} 0%,rgba(4,9,15,.95) 100%); border:1px solid ${T.border}; border-radius:16px; padding:20px; transition:border-color .3s; }
.chart-box:hover { border-color:${T.borderHover}; }
.sidebar-btn { display:flex; align-items:center; gap:12px; width:100%; padding:11px 16px; border:none; border-radius:10px; cursor:pointer; font-family:'Outfit',sans-serif; font-size:13px; font-weight:500; transition:all .2s ease; color:${T.textSecondary}; background:transparent; text-align:left; position:relative; }
.sidebar-btn:hover { background:rgba(212,168,67,.06); color:${T.white}; }
.sidebar-btn.active { background:linear-gradient(135deg,rgba(212,168,67,.12),rgba(212,168,67,.04)); color:${T.gold}; font-weight:600; }
.sidebar-btn.active::before { content:''; position:absolute; left:0; top:50%; transform:translateY(-50%); width:3px; height:60%; background:${T.gold}; border-radius:0 3px 3px 0; }
.admin-input { width:100%; padding:9px 12px; background:${T.bg}; border:1px solid ${T.border}; border-radius:8px; color:${T.textPrimary}; font-size:13px; font-family:'Outfit',sans-serif; outline:none; box-sizing:border-box; transition:border-color .2s; }
.admin-input:focus { border-color:${T.gold}; }
.admin-select { width:100%; padding:9px 12px; background:${T.bg}; border:1px solid ${T.border}; border-radius:8px; color:${T.textPrimary}; font-size:13px; font-family:'Outfit',sans-serif; cursor:pointer; outline:none; }
.sub-tab-btn { flex:1; padding:14px 16px; border-radius:12px; cursor:pointer; font-family:'Outfit',sans-serif; text-align:left; transition:all .2s; border:none; }
.mobile-overlay { position:fixed; inset:0; background:rgba(0,0,0,.6); backdrop-filter:blur(4px); z-index:90; opacity:0; pointer-events:none; transition:opacity .3s; }
.mobile-overlay.open { opacity:1; pointer-events:auto; }
@media (max-width:768px) {
  .admin-sidebar { transform:translateX(-100%); position:fixed !important; z-index:100; }
  .admin-sidebar.open { transform:translateX(0); }
  .admin-main { margin-left:0 !important; }
  .admin-topbar { left:0 !important; }
  .admin-mobile-btn { display:flex !important; }
  .kpi-grid-4,.kpi-grid-6 { grid-template-columns:1fr 1fr !important; }
  .chart-grid-2 { grid-template-columns:1fr !important; }
}
@media (max-width:480px) {
  .kpi-grid-4,.kpi-grid-6 { grid-template-columns:1fr !important; }
}
`;

function plainify(obj) {
  if (obj === null || obj === undefined) return "";
  if (typeof obj === "string" || typeof obj === "number" || typeof obj === "boolean") return obj;
  if (typeof obj.toDate === "function") return obj.toDate().toISOString();
  if (Array.isArray(obj)) return obj.map(plainify);
  if (typeof obj === "object") { const o={}; Object.keys(obj).forEach(k=>{o[k]=plainify(obj[k]);}); return o; }
  return String(obj);
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:"rgba(10,22,40,.95)", border:`1px solid ${T.border}`, borderRadius:10, padding:"10px 14px", backdropFilter:"blur(12px)" }}>
      <div style={{ fontSize:11, color:T.textMuted, marginBottom:6, fontWeight:600 }}>{label}</div>
      {payload.map((p,i) => (
        <div key={i} style={{ fontSize:12, color:p.color, fontWeight:600, display:"flex", alignItems:"center", gap:6, marginTop:2 }}>
          <div style={{ width:8, height:8, borderRadius:2, background:p.color }} />
          {p.name}: {typeof p.value==="number" ? p.value.toLocaleString() : p.value}
        </div>
      ))}
    </div>
  );
};

const KPI = ({ label, value, sub, color, delay=0 }) => (
  <div className="kpi-card fade-up" style={{ animationDelay:`${delay*.05}s` }}>
    <div style={{ fontSize:10, fontWeight:700, color:T.textMuted, letterSpacing:1.2, textTransform:"uppercase", marginBottom:10 }}>{label}</div>
    <div style={{ fontFamily:"'Fraunces',serif", fontSize:28, fontWeight:900, color:color||T.gold, lineHeight:1 }}>{value}</div>
    {sub && <div style={{ fontSize:11, color:T.green, marginTop:8, fontWeight:500 }}>{sub}</div>}
  </div>
);

const Section = ({ title, sub, children, action }) => (
  <div style={{ marginBottom:28 }}>
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:16 }}>
      <div style={{ borderLeft:`3px solid ${T.gold}`, paddingLeft:14 }}>
        <h2 style={{ fontFamily:"'Fraunces',serif", fontSize:22, fontWeight:800, color:T.white, lineHeight:1.2 }}>{title}</h2>
        {sub && <p style={{ fontSize:12, color:T.textSecondary, marginTop:3 }}>{sub}</p>}
      </div>
      {action}
    </div>
    {children}
  </div>
);

const Chart = ({ title, sub, children }) => (
  <div className="chart-box fade-up" style={{ padding:20 }}>
    <div style={{ fontSize:10, fontWeight:700, color:T.textMuted, letterSpacing:1.2, textTransform:"uppercase", marginBottom:sub?2:14 }}>{title}</div>
    {sub && <div style={{ fontSize:11, color:T.textSecondary, marginBottom:14 }}>{sub}</div>}
    {children}
  </div>
);

const Label = ({ children }) => (
  <label style={{ display:"block", fontSize:11, fontWeight:600, color:T.textMuted, textTransform:"uppercase", letterSpacing:.5, marginBottom:5 }}>{children}</label>
);

const Modal = ({ title, sub, onClose, children, maxWidth=520 }) => (
  <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.75)", backdropFilter:"blur(8px)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }} onClick={onClose}>
    <div onClick={e=>e.stopPropagation()} style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:18, padding:28, width:"100%", maxWidth, maxHeight:"90vh", overflowY:"auto", boxShadow:"0 30px 100px rgba(0,0,0,.6)" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:22 }}>
        <div>
          <h3 style={{ fontFamily:"'Fraunces',serif", fontSize:19, fontWeight:700, color:T.gold, margin:0 }}>{title}</h3>
          {sub && <p style={{ fontSize:12, color:T.textMuted, margin:"4px 0 0" }}>{sub}</p>}
        </div>
        <button type="button" onClick={onClose} style={{ background:T.surfaceAlt, border:`1px solid ${T.border}`, color:T.textMuted, width:30, height:30, borderRadius:8, cursor:"pointer", fontSize:16, display:"flex", alignItems:"center", justifyContent:"center" }}>✕</button>
      </div>
      {children}
    </div>
  </div>
);

/* ─── BROADCAST TAB COMPONENT ─── */
function BroadcastTab({ notify, adminUser, users }) {
  const [subTab, setSubTab] = React.useState("notifications");
  const [notifForm, setNotifForm] = React.useState({ title:"", message:"", icon:"📢", target:"all" });
  const [notifSending, setNotifSending] = React.useState(false);
  const [sentNotifs, setSentNotifs] = React.useState([]);
  const [digestSending, setDigestSending] = React.useState(false);
  const [digestResult, setDigestResult] = React.useState(null);
  const ICONS = ["📢","🏙️","💰","📈","⚠️","🔥","✅","🎉","📋","🏗️"];
  const proUsers = users.filter(u => ["pro","pro_trial","enterprise","admin"].includes(u.tier));

  React.useEffect(() => {
    getDocs(collection(db,"notifications")).then(snap => {
      const list = [];
      snap.forEach(d => list.push({ id:d.id, ...d.data() }));
      list.sort((a,b) => new Date(b.createdAt||0)-new Date(a.createdAt||0));
      setSentNotifs(list.slice(0,20));
    }).catch(()=>{});
  }, []);

  const sendNotification = async () => {
    if (!notifForm.title || !notifForm.message) { notify("❌ Title and message required"); return; }
    setNotifSending(true);
    try {
      const id = `notif_${Date.now()}`;
      await setDoc(doc(db,"notifications",id), { ...notifForm, userId:notifForm.target, read:false, createdAt:new Date().toISOString(), sentBy:adminUser?.email||"admin" });
      notify("✅ Notification sent!");
      setNotifForm({ title:"", message:"", icon:"📢", target:"all" });
      setSentNotifs(prev => [{ id, ...notifForm, createdAt:new Date().toISOString() }, ...prev]);
    } catch(e) { notify("❌ "+e.message); }
    setNotifSending(false);
  };

  const sendDigest = async () => {
    setDigestSending(true); setDigestResult(null);
    try {
      const res = await fetch("/api/weekly-digest", { method:"GET", headers:{ Authorization:`Bearer ${process.env.REACT_APP_CRON_SECRET||"dxb-cron-2026"}` } });
      const data = await res.json();
      setDigestResult(data);
      notify(data.success ? `✅ Digest sent to ${data.sent} users!` : "❌ Send failed");
    } catch(e) { setDigestResult({ error:e.message }); notify("❌ Error sending digest"); }
    setDigestSending(false);
  };

  return (
    <>
      <div style={{ display:"flex", gap:8, marginBottom:24 }}>
        {[{ id:"notifications", label:"Push Notifications", icon:"📢" },{ id:"digest", label:"Weekly Email Digest", icon:"📧" }].map(st => (
          <button key={st.id} type="button" onClick={()=>setSubTab(st.id)} className="sub-tab-btn"
            style={{ border:`1px solid ${subTab===st.id?T.gold:T.border}`, background:subTab===st.id?T.goldGlow:T.surface }}>
            <div style={{ fontSize:18, marginBottom:4 }}>{st.icon}</div>
            <div style={{ fontSize:13, fontWeight:700, color:subTab===st.id?T.gold:T.white }}>{st.label}</div>
          </button>
        ))}
      </div>

      {subTab==="notifications" && (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
          <Section title="Send Notification" sub="Broadcast an in-app alert to users">
            <div style={{ marginBottom:14 }}>
              <Label>Icon</Label>
              <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                {ICONS.map(ic => (
                  <button key={ic} type="button" onClick={()=>setNotifForm(p=>({...p,icon:ic}))}
                    style={{ padding:"8px 12px", borderRadius:8, border:`1px solid ${notifForm.icon===ic?T.gold:T.border}`, background:notifForm.icon===ic?T.goldGlow:T.surfaceAlt, cursor:"pointer", fontSize:18 }}>{ic}</button>
                ))}
              </div>
            </div>
            <div style={{ marginBottom:14 }}>
              <Label>Title</Label>
              <input className="admin-input" type="text" value={notifForm.title} onChange={e=>setNotifForm(p=>({...p,title:e.target.value}))} placeholder="e.g. New project launched" />
            </div>
            <div style={{ marginBottom:14 }}>
              <Label>Message</Label>
              <textarea className="admin-input" value={notifForm.message} onChange={e=>setNotifForm(p=>({...p,message:e.target.value}))} placeholder="Message body..." rows={3} style={{ resize:"vertical" }} />
            </div>
            <div style={{ padding:14, borderRadius:10, background:"rgba(212,168,67,.06)", border:`1px solid ${T.border}`, marginBottom:14 }}>
              <div style={{ fontSize:10, color:T.textMuted, marginBottom:6, fontWeight:600, textTransform:"uppercase" }}>Preview</div>
              <div style={{ display:"flex", gap:10 }}>
                <span style={{ fontSize:20 }}>{notifForm.icon}</span>
                <div>
                  <div style={{ fontSize:12, fontWeight:700, color:T.white }}>{notifForm.title||"Title here"}</div>
                  <div style={{ fontSize:11, color:T.textMuted, marginTop:2 }}>{notifForm.message||"Message..."}</div>
                </div>
              </div>
            </div>
            <button type="button" onClick={sendNotification} disabled={notifSending}
              style={{ width:"100%", padding:"12px", borderRadius:10, border:"none", background:`linear-gradient(135deg,${T.gold},${T.goldDim})`, color:T.bg, fontWeight:700, fontSize:13, cursor:notifSending?"wait":"pointer", fontFamily:"'Outfit',sans-serif", opacity:notifSending?.7:1 }}>
              {notifSending?"Sending...":"📢 Send to All Users"}
            </button>
          </Section>
          <div>
            <div style={{ fontSize:12, fontWeight:700, color:T.textSecondary, marginBottom:12, textTransform:"uppercase", letterSpacing:.5 }}>Sent History</div>
            {sentNotifs.length===0 ? (
              <div style={{ textAlign:"center", padding:40, color:T.textMuted, fontSize:12 }}>No notifications sent yet</div>
            ) : sentNotifs.map(n => (
              <div key={n.id} style={{ padding:"10px 14px", background:T.surfaceAlt, borderRadius:10, border:`1px solid ${T.border}`, marginBottom:8 }}>
                <div style={{ display:"flex", gap:8 }}>
                  <span style={{ fontSize:16 }}>{n.icon||"📢"}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:12, fontWeight:700, color:T.white }}>{n.title}</div>
                    <div style={{ fontSize:11, color:T.textMuted, marginTop:2 }}>{n.message}</div>
                    <div style={{ fontSize:10, color:T.textMuted, marginTop:4 }}>{n.createdAt?new Date(n.createdAt).toLocaleString("en-AE"):""}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {subTab==="digest" && (
        <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
          <div style={{ background:T.surface, borderRadius:14, border:`1px solid ${T.border}`, padding:28 }}>
            <div style={{ fontFamily:"'Fraunces',serif", fontSize:22, fontWeight:800, color:T.gold, marginBottom:6 }}>Weekly Email Digest</div>
            <div style={{ fontSize:13, color:T.textMuted, marginBottom:24 }}>Auto-sends every Monday at 8:00 AM UAE time to all Pro users.</div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12, marginBottom:24 }}>
              {[["Pro Recipients",proUsers.length,T.gold],["Auto Schedule","Mon 8AM UAE",T.teal],["Sections","5 sections",T.green]].map(([l,v,c])=>(
                <div key={l} style={{ background:T.surfaceAlt, borderRadius:10, padding:"14px 16px", border:`1px solid ${T.border}` }}>
                  <div style={{ fontSize:10, color:T.textMuted, textTransform:"uppercase", letterSpacing:.5, marginBottom:4 }}>{l}</div>
                  <div style={{ fontSize:18, fontWeight:700, color:c }}>{v}</div>
                </div>
              ))}
            </div>
            <div style={{ background:T.surfaceAlt, borderRadius:10, padding:"14px 16px", border:`1px solid ${T.border}`, marginBottom:24 }}>
              <div style={{ fontSize:11, fontWeight:700, color:T.goldLight, marginBottom:10 }}>EMAIL CONTENTS</div>
              {["📊 Market Pulse — Revenue, profit, backlog","🏆 Top 5 Yield Opportunities","⏰ Upcoming Handovers (next 6 months)","🛂 Golden Visa Eligible Projects","🔗 Link back to dashboard"].map((item,i,arr)=>(
                <div key={i} style={{ fontSize:12, color:T.textSecondary, padding:"7px 0", borderBottom:i<arr.length-1?`1px solid ${T.border}`:"none" }}>{item}</div>
              ))}
            </div>
            <button type="button" onClick={sendDigest} disabled={digestSending}
              style={{ padding:"13px 28px", background:digestSending?T.surfaceAlt:`linear-gradient(135deg,${T.gold},#B8912F)`, border:"none", borderRadius:10, color:digestSending?T.textMuted:T.bg, fontWeight:800, fontSize:14, cursor:digestSending?"not-allowed":"pointer", fontFamily:"'Outfit',sans-serif" }}>
              {digestSending?"Sending..."`Send Digest Now → ${proUsers.length} users`}
            </button>
            {digestResult && (
              <div style={{ marginTop:16, padding:"12px 16px", borderRadius:10, background:digestResult.success?"rgba(16,185,129,.08)":"rgba(239,68,68,.08)", border:`1px solid ${digestResult.success?"rgba(16,185,129,.2)":"rgba(239,68,68,.2)"}` }}>
                <div style={{ fontSize:12, color:digestResult.success?T.green:T.red, fontWeight:700 }}>
                  {digestResult.success?`✅ Sent to ${digestResult.sent}/${digestResult.total} users`:`❌ Error: ${digestResult.error}`}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

/* ═══════════════════════════════ MAIN COMPONENT ═══════════════════════════════ */
export default function AdminPanel() {
  const { lang, setLang, t: i18t, dir, langInfo } = useI18n();
  const [showLangPicker, setShowLangPicker] = React.useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [adminUser, setAdminUser] = useState(null);
  const [tab, setTab] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [toast, setToast] = useState({ msg:"", type:"success" });

  /* USERS */
  const [users, setUsers] = useState([]);
  const [userSearch, setUserSearch] = useState("");
  const [tierFilter, setTierFilter] = useState("All");
  const [sortBy, setSortBy] = useState("newest");
  const [expandedUser, setExpandedUser] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [editUserForm, setEditUserForm] = useState({});
  const [editUserLoading, setEditUserLoading] = useState(false);
  const [showAddUser, setShowAddUser] = useState(false);
  const [addUserForm, setAddUserForm] = useState({ name:"", email:"", password:"", phone:"", country:"", tier:"free", notes:"" });
  const [addUserLoading, setAddUserLoading] = useState(false);

  /* DATA MANAGER */
  const [dataSubTab, setDataSubTab] = useState("projects");
  const [editingProject, setEditingProject] = useState(null);
  const [projectForm, setProjectForm] = useState({});
  const [bulkSelected, setBulkSelected] = useState([]);
  const [bulkForm, setBulkForm] = useState({});
  const [priceHistory, setPriceHistory] = useState({});
  const [editingCommunity, setEditingCommunity] = useState(null);
  const [communityForm, setCommunityForm] = useState({});
  const [editingYield, setEditingYield] = useState(null);
  const [yieldForm, setYieldForm] = useState({});
  const [liveProjects, setLiveProjects] = useState({});
  const [liveCommunityROI, setLiveCommunityROI] = useState({});
  const [liveYields, setLiveYields] = useState({});
  const [dataSearch, setDataSearch] = useState("");
  const [dataSaving, setDataSaving] = useState(false);

  /* SETTINGS / KYC */
  const [settingsSubTab, setSettingsSubTab] = useState("verification");
  const [verifications, setVerifications] = useState([]);
  const [verifyFilter, setVerifyFilter] = useState("all");
  const [verifySearch, setVerifySearch] = useState("");
  const [reviewingUser, setReviewingUser] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [auditLog, setAuditLog] = useState([]);

  /* LEADS */
  const [leads, setLeads] = useState([]);

  /* ESC */
  useEffect(() => {
    const fn = e => { if(e.key==="Escape"){ setSidebarOpen(false); setEditingUser(null); setShowAddUser(false); setReviewingUser(null); } };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, []);

  /* AUTH */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async u => {
      if(u) {
        setAdminUser(u);
        try { const snap = await getDoc(doc(db,"users",u.uid)); setIsAdmin(snap.exists() && snap.data().role==="admin"); }
        catch { setIsAdmin(false); }
      }
      setLoading(false);
    });
    return ()=>unsub();
  }, []);

  /* FETCH USERS */
  const fetchUsers = useCallback(async () => {
    try {
      const snap = await getDocs(collection(db,"users"));
      const list = [];
      snap.forEach(d => list.push({ uid:d.id, ...plainify(d.data()) }));
      setUsers(list);
    } catch(e) { console.error(e); }
  }, []);
  useEffect(() => { if(isAdmin) fetchUsers(); }, [isAdmin, fetchUsers]);

  /* FETCH LIVE DATA */
  const fetchLiveData = useCallback(async () => {
    try {
      const [pSnap,rSnap,ySnap] = await Promise.all([
        getDocs(collection(db,"projectData")),
        getDocs(collection(db,"communityROI")),
        getDocs(collection(db,"yieldData")),
      ]);
      const pm={},rm={},ym={};
      pSnap.forEach(d=>{pm[d.id]=plainify(d.data());});
      rSnap.forEach(d=>{rm[d.id]=plainify(d.data());});
      ySnap.forEach(d=>{ym[d.id]=plainify(d.data());});
      setLiveProjects(pm); setLiveCommunityROI(rm); setLiveYields(ym);
    } catch(e) { console.error(e); }
  }, []);
  useEffect(() => { if(isAdmin) fetchLiveData(); }, [isAdmin, fetchLiveData]);

  /* FETCH VERIFICATIONS */
  const fetchVerifications = useCallback(async () => {
    try {
      const snap = await getDocs(collection(db,"verifications"));
      const list = [];
      snap.forEach(d => list.push({ id:d.id, ...plainify(d.data()) }));
      list.sort((a,b)=>new Date(b.submittedAt||0)-new Date(a.submittedAt||0));
      setVerifications(list);
    } catch(e) { console.error(e); }
  }, []);
  useEffect(() => { if(isAdmin) fetchVerifications(); }, [isAdmin, fetchVerifications]);

  /* FETCH LEADS */
  const fetchLeads = useCallback(async () => {
    try {
      const snap = await getDocs(collection(db,"leads"));
      const list = [];
      snap.forEach(d => list.push({ id:d.id, ...plainify(d.data()) }));
      list.sort((a,b)=>new Date(b.createdAt||0)-new Date(a.createdAt||0));
      setLeads(list);
    } catch(e) { console.error(e); }
  }, []);
  useEffect(() => { if(isAdmin) fetchLeads(); }, [isAdmin, fetchLeads]);

  /* FETCH AUDIT LOG */
  const fetchAuditLog = useCallback(async () => {
    try {
      const snap = await getDocs(collection(db,"auditLog"));
      const list = [];
      snap.forEach(d => list.push({ id:d.id, ...d.data() }));
      list.sort((a,b)=>new Date(b.changedAt||0)-new Date(a.changedAt||0));
      setAuditLog(list.slice(0,100));
    } catch(e) { console.error(e); }
  }, []);
  useEffect(() => { if(isAdmin) fetchAuditLog(); }, [isAdmin, fetchAuditLog]);

  /* HELPERS */
  const now = new Date();
  const notify = msg => {
    const type = msg.startsWith("✅")?"success":msg.startsWith("❌")?"error":"info";
    setToast({msg,type});
    setTimeout(()=>setToast({msg:"",type:"success"}),3000);
  };
  const timeSince = d => {
    try {
      const ms=now-new Date(d); const m=Math.floor(ms/60000); const h=Math.floor(ms/3600000); const dy=Math.floor(ms/86400000);
      if(m<1) return"Just now"; if(m<60) return`${m}m ago`; if(h<24) return`${h}h ago`; return`${dy}d ago`;
    } catch { return"—"; }
  };
  const trialDaysLeft = u => { if(!u.trialEnd) return null; const l=Math.ceil((new Date(u.trialEnd)-now)/86400000); return l>0?l:0; };
  const tierBadge = u => {
    const exp = u.tier==="pro_trial"&&u.trialEnd&&new Date(u.trialEnd)<=now;
    if(exp) return{label:"Expired",bg:"rgba(239,68,68,.12)",color:T.red};
    if(u.tier==="pro_trial") return{label:"Pro Trial",bg:"rgba(212,168,67,.12)",color:T.gold};
    if(u.tier==="pro") return{label:"Pro",bg:"rgba(16,185,129,.12)",color:T.green};
    if(u.tier==="enterprise") return{label:"Enterprise",bg:"rgba(0,191,165,.12)",color:T.teal};
    return{label:"Free",bg:"rgba(148,163,184,.1)",color:T.textMuted};
  };
  const getMergedProject = p => ({...p,...(liveProjects[p.id]||{})});
  const getMergedROI = key => ({...(defaultCommunityROI[key]||{}),...(liveCommunityROI[key]||{})});

  /* STATS */
  const stats = {
    total:users.length,
    today:users.filter(u=>{try{return new Date(u.createdAt).toDateString()===now.toDateString();}catch{return false;}}).length,
    thisWeek:users.filter(u=>{try{return(now-new Date(u.createdAt))<7*86400000;}catch{return false;}}).length,
    thisMonth:users.filter(u=>{try{const d=new Date(u.createdAt);return d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear();}catch{return false;}}).length,
    proTrial:users.filter(u=>u.tier==="pro_trial"&&(!u.trialEnd||new Date(u.trialEnd)>now)).length,
    free:users.filter(u=>u.tier==="free"||!u.tier).length,
    expired:users.filter(u=>u.tier==="pro_trial"&&u.trialEnd&&new Date(u.trialEnd)<=now).length,
    pro:users.filter(u=>u.tier==="pro").length,
    enterprise:users.filter(u=>u.tier==="enterprise").length,
  };
  stats.paid=stats.pro+stats.enterprise;
  stats.freeExpired=stats.free+stats.expired;
  const mrr=(stats.pro*99)+(stats.enterprise*499);
  const arr=mrr*12;
  const projectedMRR=mrr+Math.round(stats.proTrial*99*.3);
  const trialConversion=(stats.pro+stats.expired)>0?Math.round((stats.pro/(stats.pro+stats.expired))*100):0;

  /* CHART DATA */
  const signupTimeline=(() => {
    const days=[];
    for(let i=13;i>=0;i--){
      const d=new Date(now); d.setDate(d.getDate()-i);
      const key=d.toDateString();
      const count=users.filter(u=>{try{return new Date(u.createdAt).toDateString()===key;}catch{return false;}}).length;
      days.push({date:`${d.getDate()} ${d.toLocaleString("en",{month:"short"})}`,count});
    }
    return days;
  })();

  const tierData=[
    {name:"Pro Trial",value:stats.proTrial,color:T.gold},
    {name:"Free",value:stats.free,color:T.textMuted},
    {name:"Pro",value:stats.pro,color:T.green},
    {name:"Enterprise",value:stats.enterprise,color:T.teal},
    {name:"Expired",value:stats.expired,color:T.red},
  ].filter(d=>d.value>0);

  const cumulativeData=(() => {
    const sorted=[...users].sort((a,b)=>new Date(a.createdAt||0)-new Date(b.createdAt||0));
    return sorted.map((u,i)=>{const d=new Date(u.createdAt||now);return{date:`${d.getDate()}/${d.getMonth()+1}`,total:i+1};});
  })();

  const revenueProjection=[
    {month:"Now",revenue:mrr},
    {month:"+1mo",revenue:Math.round(mrr+projectedMRR*.3)},
    {month:"+2mo",revenue:Math.round(mrr+projectedMRR*.6)},
    {month:"+3mo",revenue:Math.round(mrr+projectedMRR)},
    {month:"+6mo",revenue:Math.round((mrr+projectedMRR)*1.8)},
  ];

  /* USER ACTIONS */
  const changeTier = async (uid,tier) => {
    try {
      const data={tier};
      if(tier==="pro_trial"){const end=new Date();end.setDate(end.getDate()+7);data.trialEnd=end.toISOString();}
      await setDoc(doc(db,"users",uid),data,{merge:true});
      notify(`✅ Tier updated to ${tier}`); fetchUsers();
    } catch(e){notify("❌ "+e.message);}
  };
  const deleteUser = async uid => {
    const u=users.find(x=>x.uid===uid);
    if(!window.confirm(`DELETE ${u?.email}? This is permanent.`)) return;
    try { await deleteDoc(doc(db,"users",uid)); notify("✅ User deleted"); setExpandedUser(null); fetchUsers(); }
    catch(e){notify("❌ "+e.message);}
  };
  const suspendUser = async uid => {
    const u=users.find(x=>x.uid===uid);
    const isSuspended=u?.suspended;
    if(!window.confirm(`${isSuspended?"UNSUSPEND":"SUSPEND"} ${u?.email}?`)) return;
    try {
      await setDoc(doc(db,"users",uid),{suspended:!isSuspended,suspendedAt:isSuspended?null:new Date().toISOString()},{merge:true});
      notify(`✅ User ${isSuspended?"unsuspended":"suspended"}`); fetchUsers();
    } catch(e){notify("❌ "+e.message);}
  };
  const sendResetEmail = async email => {
    try { await sendPasswordResetEmail(auth,email); notify(`✅ Reset sent to ${email}`); }
    catch { notify("❌ Failed to send reset"); }
  };
  const extendTrial = async (uid,days) => {
    try {
      const end=new Date(); end.setDate(end.getDate()+days);
      await setDoc(doc(db,"users",uid),{tier:"pro_trial",trialEnd:end.toISOString()},{merge:true});
      notify(`✅ Trial extended ${days} days`); fetchUsers();
    } catch(e){notify("❌ "+e.message);}
  };
  const openEditUser = u => {
    setEditingUser(u);
    setEditUserForm({name:u.name||"",phone:u.phone||"",country:u.country||"",tier:u.tier||"free",trialEnd:u.trialEnd?u.trialEnd.slice(0,10):"",notes:u.notes||"",role:u.role||"user"});
  };
  const saveEditUser = async () => {
    if(!editingUser) return;
    setEditUserLoading(true);
    try {
      const data={...editUserForm};
      if(data.trialEnd) data.trialEnd=new Date(data.trialEnd).toISOString();
      await setDoc(doc(db,"users",editingUser.uid),data,{merge:true});
      notify("✅ User updated"); setEditingUser(null); fetchUsers();
    } catch(e){notify("❌ "+e.message);}
    setEditUserLoading(false);
  };
  const addUserManually = async () => {
    if(!addUserForm.name.trim()){notify("❌ Name required");return;}
    if(!addUserForm.email.trim()){notify("❌ Email required");return;}
    if(!addUserForm.password||addUserForm.password.length<6){notify("❌ Password min 6 chars");return;}
    setAddUserLoading(true);
    try {
      const cred=await createUserWithEmailAndPassword(auth,addUserForm.email.trim(),addUserForm.password);
      const trialEnd=new Date(); trialEnd.setDate(trialEnd.getDate()+7);
      await setDoc(doc(db,"users",cred.user.uid),{
        name:addUserForm.name.trim(),email:addUserForm.email.trim(),phone:addUserForm.phone.trim(),
        country:addUserForm.country,tier:addUserForm.tier,notes:addUserForm.notes.trim(),
        createdAt:new Date().toISOString(),
        trialEnd:addUserForm.tier==="pro_trial"?trialEnd.toISOString():null,
        role:"user",createdByAdmin:adminUser?.email,provider:"admin",
      });
      notify(`✅ User "${addUserForm.name}" created`);
      setShowAddUser(false);
      setAddUserForm({name:"",email:"",password:"",phone:"",country:"",tier:"free",notes:""});
      fetchUsers();
    } catch(e) {
      const msgs={"auth/email-already-in-use":"❌ Email already registered","auth/invalid-email":"❌ Invalid email","auth/weak-password":"❌ Password too weak"};
      notify(msgs[e.code]||"❌ "+e.message);
    }
    setAddUserLoading(false);
  };
  const exportCSV = () => {
    const headers="Name,Email,Tier,Trial Status,Signed Up\n";
    const rows=users.map(u=>`${u.name||""},${u.email||""},${u.tier||"free"},${u.trialEnd?(new Date(u.trialEnd)>now?"Active":"Expired"):"—"},${u.createdAt||""}`).join("\n");
    const blob=new Blob([headers+rows],{type:"text/csv"});
    const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`dxb-users-${now.toISOString().slice(0,10)}.csv`;a.click();
    notify("✅ CSV exported");
  };

  /* DATA ACTIONS */
  const uploadProjectImage = async (projectId,file) => {
    if(!file) return;
    if(file.size>5*1024*1024){notify("❌ Image must be under 5MB");return;}
    notify("ℹ️ Uploading...");
    try {
      const fd=new FormData(); fd.append("file",file); fd.append("upload_preset","dxb-analytics"); fd.append("cloud_name","dh9dd5ld0");
      const res=await fetch("https://api.cloudinary.com/v1_1/dh9dd5ld0/auto/upload",{method:"POST",body:fd});
      const data=await res.json();
      await setDoc(doc(db,"projectData",String(projectId)),{imageUrl:data.secure_url,updatedAt:new Date().toISOString(),updatedBy:adminUser?.email},{merge:true});
      notify("✅ Image uploaded!"); fetchLiveData();
    } catch(e){notify("❌ "+e.message);}
  };
  const saveProjectData = async (projectId,data) => {
    setDataSaving(true);
    try {
      const clean={};
      Object.entries(data).forEach(([k,v])=>{ if(v!==""&&v!==undefined&&v!==null) clean[k]=typeof v==="string"&&!isNaN(v)&&v.trim()!==""?Number(v):v; });
      clean.updatedAt=new Date().toISOString(); clean.updatedBy=adminUser?.email||"admin";
      await setDoc(doc(db,"projectData",String(projectId)),clean,{merge:true});
      try {
        const oldDoc=liveProjects[projectId]||{};
        const diff={};
        Object.keys(clean).forEach(k=>{if(k!=="updatedAt"&&k!=="updatedBy"&&clean[k]!==oldDoc[k])diff[k]={old:oldDoc[k]??"—",new:clean[k]};});
        await setDoc(doc(db,"auditLog",Date.now().toString()),{action:"project_update",projectId,diff,changedBy:adminUser?.email,changedAt:new Date().toISOString()});
      } catch {}
      if(clean.price) {
        await setDoc(doc(db,"priceHistory",`${String(projectId)}_${Date.now()}`),{
          projectId:String(projectId),price:Number(clean.price),ppsf:Number(clean.ppsf)||0,
          recordedAt:new Date().toISOString(),recordedBy:adminUser?.email||"admin"
        });
      }
      notify("✅ Saved — live instantly"); setEditingProject(null); setProjectForm({}); fetchLiveData();
    } catch(e){notify("❌ "+e.message);}
    setDataSaving(false);
  };
  const fetchPriceHistory = async projectId => {
    try {
      const q=query(collection(db,"priceHistory"),where("projectId","==",String(projectId)),orderBy("recordedAt","asc"),limit(24));
      const snap=await getDocs(q);
      setPriceHistory(prev=>({...prev,[projectId]:snap.docs.map(d=>d.data())}));
    } catch(e){console.log("priceHistory err:",e);}
  };
  const saveCommunityROI = async (key,data) => {
    setDataSaving(true);
    try {
      const clean={...JSON.parse(JSON.stringify(data)),updatedAt:new Date().toISOString(),updatedBy:adminUser?.email||"admin"};
      await setDoc(doc(db,"communityROI",key),clean,{merge:true});
      notify("✅ Community ROI saved"); setEditingCommunity(null); fetchLiveData();
    } catch(e){notify("❌ "+e.message);}
    setDataSaving(false);
  };
  const saveYieldData = async (yieldKey,data) => {
    setDataSaving(true);
    try {
      const clean={};
      Object.entries(data).forEach(([k,v])=>{ if(v!==""&&v!==undefined&&v!==null) clean[k]=typeof v==="string"&&!isNaN(v)&&v.trim()!==""?Number(v):v; });
      clean.updatedAt=new Date().toISOString();
      await setDoc(doc(db,"yieldData",yieldKey),clean,{merge:true});
      notify("✅ Yield saved"); setEditingYield(null); fetchLiveData();
    } catch(e){notify("❌ "+e.message);}
    setDataSaving(false);
  };
  const saveBulkEdit = async () => {
    if(bulkSelected.length===0){notify("❌ No projects selected");return;}
    setDataSaving(true);
    try {
      for(const id of bulkSelected) await setDoc(doc(db,"projectData",String(id)),{...bulkForm,updatedAt:new Date().toISOString(),updatedBy:adminUser?.email},{merge:true});
      notify(`✅ ${bulkSelected.length} projects updated!`); setBulkSelected([]); setBulkForm({}); fetchLiveData();
    } catch(e){notify("❌ "+e.message);}
    setDataSaving(false);
  };
  const resetProjectData = async projectId => {
    if(!window.confirm(`Reset ${projectId} to defaults?`)) return;
    try { await deleteDoc(doc(db,"projectData",projectId)); notify("✅ Reset"); fetchLiveData(); }
    catch(e){notify("❌ "+e.message);}
  };
  const exportProjectsCSV = () => {
    const headers=["ID","Name","Community","Price","PPSF","Status","Handover","Type"];
    const rows=emaarProjects.map(p=>{const m=getMergedProject(p);return[p.id,p.name,p.community,m.price||"",m.ppsf||"",m.status||"",m.handover||"",m.type||""];});
    const csv=[headers,...rows].map(r=>r.join(",")).join("\n");
    const blob=new Blob([csv],{type:"text/csv"});
    const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`emaar-projects-${now.toISOString().slice(0,10)}.csv`;a.click();
    notify("✅ Exported!");
  };

  /* KYC ACTIONS */
  const approveVerification = async v => {
    if(!window.confirm(`Approve ${v.name||v.email}?`)) return;
    try {
      await setDoc(doc(db,"verifications",v.id),{status:"approved",reviewedAt:new Date().toISOString(),reviewedBy:adminUser?.email||"admin"},{merge:true});
      await setDoc(doc(db,"users",v.uid),{verified:true,verifiedLevel:v.level||"basic",verifiedAt:new Date().toISOString()},{merge:true});
      notify("✅ User verified"); fetchVerifications(); fetchUsers();
    } catch(e){notify("❌ "+e.message);}
  };
  const rejectVerification = async v => {
    if(!rejectReason.trim()){notify("❌ Enter rejection reason");return;}
    if(!window.confirm(`Reject ${v.name||v.email}? Reason: ${rejectReason}`)) return;
    try {
      await setDoc(doc(db,"verifications",v.id),{status:"rejected",rejectReason,reviewedAt:new Date().toISOString(),reviewedBy:adminUser?.email||"admin"},{merge:true});
      await setDoc(doc(db,"users",v.uid),{verified:false,verifiedLevel:null},{merge:true});
      notify("✅ Rejected"); setRejectReason(""); setReviewingUser(null); fetchVerifications(); fetchUsers();
    } catch(e){notify("❌ "+e.message);}
  };

  /* FILTERED USERS */
  const filteredUsers=users
    .filter(u=>{
      const ms=!userSearch||(u.name||"").toLowerCase().includes(userSearch.toLowerCase())||(u.email||"").toLowerCase().includes(userSearch.toLowerCase())||(u.phone||"").toLowerCase().includes(userSearch.toLowerCase());
      let mt=true;
      if(tierFilter==="Free") mt=u.tier==="free"||!u.tier;
      else if(tierFilter==="Pro Trial") mt=u.tier==="pro_trial"&&(!u.trialEnd||new Date(u.trialEnd)>now);
      else if(tierFilter==="Pro") mt=u.tier==="pro";
      else if(tierFilter==="Enterprise") mt=u.tier==="enterprise";
      else if(tierFilter==="Expired") mt=u.tier==="pro_trial"&&u.trialEnd&&new Date(u.trialEnd)<=now;
      else if(tierFilter==="Suspended") mt=!!u.suspended;
      return ms&&mt;
    })
    .sort((a,b)=>{
      if(sortBy==="newest") return new Date(b.createdAt||0)-new Date(a.createdAt||0);
      if(sortBy==="oldest") return new Date(a.createdAt||0)-new Date(b.createdAt||0);
      if(sortBy==="name") return(a.name||"").localeCompare(b.name||"");
      if(sortBy==="tier") return(a.tier||"").localeCompare(b.tier||"");
      return 0;
    });

  /* TABS */
  const TABS=[
    {id:"overview",label:"Overview",icon:I.overview},
    {id:"users",label:"Users",icon:I.users},
    {id:"data",label:"Data Manager",icon:I.data},
    {id:"revenue",label:"Revenue & Analytics",icon:I.revenue},
    {id:"leads",label:"Leads",icon:I.leads},
    {id:"broadcast",label:"Broadcast",icon:I.bell},
    {id:"settings",label:"Settings",icon:I.settings},
  ];

  /* LOADING */
  if(loading) return (
    <div style={{minHeight:"100vh",background:T.bg,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:16}}>
      <style>{css}</style>
      <svg width="40" height="40" viewBox="0 0 40 40"><rect x="2" y="2" width="36" height="36" rx="8" fill="none" stroke={T.gold} strokeWidth="2"/><path d="M12 28V12h10l-6 8h8l-12 8z" fill={T.gold}/></svg>
      <div style={{color:T.gold,fontFamily:"'Fraunces',serif",fontSize:18,fontWeight:700}}>DXB Analytics</div>
      <div style={{width:24,height:24,border:`2px solid ${T.border}`,borderTopColor:T.gold,borderRadius:"50%",animation:"spin .8s linear infinite"}}/>
    </div>
  );

  if(!isAdmin) return (
    <div style={{minHeight:"100vh",background:T.bg,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:20,fontFamily:"'Outfit',sans-serif"}}>
      <style>{css}</style>
      <h1 style={{fontFamily:"'Fraunces',serif",fontSize:24,fontWeight:800,color:T.white}}>Admin Access Required</h1>
      <a href="/" style={{color:T.gold,fontSize:13,textDecoration:"none",padding:"10px 24px",border:`1px solid ${T.gold}`,borderRadius:10,fontWeight:600}}>← Back to Dashboard</a>
    </div>
  );

  /* RENDER */
  return (
    <div style={{minHeight:"100vh",background:T.bg,fontFamily:"'Outfit',sans-serif",color:T.textPrimary}}>
      <style>{css}</style>

      {/* Toast */}
      {toast.msg && (
        <div key={toast.msg} className="toast-notify" style={{position:"fixed",bottom:24,right:24,padding:"12px 24px",borderRadius:10,zIndex:99999,background:toast.type==="success"?T.green:toast.type==="error"?T.red:T.surface,border:toast.type==="info"?`1px solid ${T.border}`:"none",color:T.white,fontWeight:700,fontSize:13,boxShadow:"0 12px 40px rgba(0,0,0,.4)"}}>
          {toast.msg}
        </div>
      )}

      {/* Mobile overlay */}
      <div className={`mobile-overlay ${sidebarOpen?"open":""}`} onClick={()=>setSidebarOpen(false)}/>

      {/* SIDEBAR */}
      <aside className={`admin-sidebar ${sidebarOpen?"open":""}`} style={{position:"fixed",top:0,left:0,bottom:0,width:240,background:T.surface,borderRight:`1px solid ${T.border}`,display:"flex",flexDirection:"column",zIndex:100,transition:"transform .3s ease"}}>
        <div style={{padding:"24px 20px 20px",borderBottom:`1px solid ${T.border}`}}>
          <a href="/" style={{display:"flex",alignItems:"center",gap:10,textDecoration:"none"}}>
            <svg width="32" height="32" viewBox="0 0 40 40"><rect x="2" y="2" width="36" height="36" rx="8" fill="none" stroke={T.gold} strokeWidth="2"/><path d="M12 28V12h10l-6 8h8l-12 8z" fill={T.gold}/></svg>
            <div>
              <div style={{fontFamily:"'Fraunces',serif",fontSize:16,fontWeight:800,color:T.gold}}>DXB Analytics</div>
              <div style={{fontSize:9,color:T.textMuted,letterSpacing:1.5,textTransform:"uppercase"}}>Admin Console</div>
            </div>
          </a>
        </div>
        <nav style={{flex:1,padding:"16px 12px",display:"flex",flexDirection:"column",gap:3,overflowY:"auto"}}>
          <div style={{fontSize:9,fontWeight:700,color:T.textMuted,letterSpacing:1.5,textTransform:"uppercase",padding:"0 16px 8px"}}>Platform</div>
          {TABS.map(t=>(
            <button type="button" key={t.id} className={`sidebar-btn ${tab===t.id?"active":""}`} onClick={()=>{setTab(t.id);setSidebarOpen(false);}}>
              <span style={{color:tab===t.id?T.gold:T.textMuted,flexShrink:0}}>{t.icon}</span>
              {t.label}
              {t.id==="settings"&&verifications.filter(v=>v.status==="pending").length>0&&(
                <span style={{marginLeft:"auto",fontSize:10,fontWeight:700,padding:"2px 6px",borderRadius:8,background:T.orange+"20",color:T.orange}}>{verifications.filter(v=>v.status==="pending").length}</span>
              )}
            </button>
          ))}
          <div style={{fontSize:9,fontWeight:700,color:T.textMuted,letterSpacing:1.5,textTransform:"uppercase",padding:"16px 16px 8px",marginTop:8,borderTop:`1px solid ${T.border}`}}>Quick Links</div>
          <a href="/" className="sidebar-btn" style={{textDecoration:"none"}}>{I.overview}<span>Back to Dashboard</span></a>
        </nav>
        <div style={{padding:"16px 12px",borderTop:`1px solid ${T.border}`}}>
          <div style={{display:"flex",alignItems:"center",gap:10,padding:"8px 12px",borderRadius:10,background:T.surfaceAlt}}>
            <div style={{width:34,height:34,borderRadius:"50%",background:`linear-gradient(135deg,${T.gold},${T.goldDim})`,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:13,color:T.bg,flexShrink:0}}>
              {(adminUser?.displayName||adminUser?.email||"A")[0].toUpperCase()}
            </div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:12,fontWeight:600,color:T.white,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{adminUser?.displayName||adminUser?.email?.split("@")[0]}</div>
              <div style={{fontSize:10,color:T.gold,fontWeight:600}}>Admin</div>
            </div>
            <button type="button" onClick={()=>setShowProfile(true)} style={{background:"none",border:`1px solid ${T.border}`,cursor:"pointer",color:T.gold,padding:"3px 8px",borderRadius:6,fontSize:10,fontWeight:600,fontFamily:"'Outfit',sans-serif"}}>Profile</button>
            <button type="button" onClick={()=>signOut(auth)} title="Logout" style={{background:"none",border:"none",color:T.textMuted,cursor:"pointer",padding:4}}>{I.logout}</button>
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <main dir={dir} className="admin-main" style={{marginLeft:240,minHeight:"100vh"}}>
        {/* Topbar */}
        <header className="admin-topbar" style={{position:"sticky",top:0,zIndex:20,height:60,background:`${T.surface}ee`,backdropFilter:"blur(16px)",borderBottom:`1px solid ${T.border}`,padding:"0 28px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <button type="button" className="admin-mobile-btn" onClick={()=>setSidebarOpen(!sidebarOpen)} style={{display:"none",alignItems:"center",justifyContent:"center",width:34,height:34,borderRadius:8,background:T.surfaceAlt,border:`1px solid ${T.border}`,color:T.textSecondary,cursor:"pointer"}}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            </button>
            <div>
              <h1 style={{fontSize:16,fontWeight:700,color:T.white}}>Admin Console</h1>
              <p style={{fontSize:10,color:T.textMuted,letterSpacing:1}}>{new Date().toLocaleDateString("en-AE",{weekday:"short",day:"numeric",month:"short",year:"numeric"})} · {stats.total} users</p>
            </div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <div style={{background:T.surfaceAlt,borderRadius:10,padding:"6px 12px",border:`1px solid ${T.border}`,display:"flex",alignItems:"center",gap:6}}>
              <div style={{width:6,height:6,borderRadius:"50%",background:T.green,animation:"pulse 2s infinite"}}/>
              <span style={{fontSize:11,fontWeight:600,color:T.green}}>LIVE</span>
            </div>
            <div style={{background:T.surfaceAlt,borderRadius:10,padding:"6px 12px",border:`1px solid ${T.border}`}}>
              <span style={{fontSize:10,color:T.textMuted}}>MRR </span>
              <span style={{fontSize:12,fontWeight:700,color:T.gold,fontFamily:"'Fraunces',serif"}}>AED {mrr.toLocaleString()}</span>
            </div>
            <div style={{background:T.surfaceAlt,borderRadius:10,padding:"6px 12px",border:`1px solid ${T.border}`}}>
              <span style={{fontSize:10,color:T.textMuted}}>PAID </span>
              <span style={{fontSize:12,fontWeight:700,color:T.teal}}>{stats.paid}</span>
            </div>
            {/* Language Picker */}
            <div style={{position:"relative"}}>
              <button type="button" onClick={()=>setShowLangPicker(!showLangPicker)}
                style={{background:T.surfaceAlt,border:`1px solid ${T.border}`,borderRadius:10,padding:"6px 10px",cursor:"pointer",color:T.textSecondary,display:"flex",alignItems:"center",gap:5,fontSize:11,fontFamily:"'Outfit',sans-serif",fontWeight:600}}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                {langInfo.name}
              </button>
              {showLangPicker && (
                <>
                  <div style={{position:"fixed",inset:0,zIndex:99998}} onClick={()=>setShowLangPicker(false)}/>
                  <div style={{position:"absolute",top:"calc(100% + 8px)",right:0,width:280,maxHeight:420,overflowY:"auto",background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,boxShadow:"0 20px 60px rgba(0,0,0,.5)",zIndex:9999,padding:8}}>
                    {LANGUAGES.map(l=>(
                      <button type="button" key={l.code} onClick={()=>{setLang(l.code);setShowLangPicker(false);}}
                        style={{width:"100%",display:"flex",alignItems:"center",gap:10,padding:"8px 12px",borderRadius:8,border:"none",background:lang===l.code?T.goldGlow:"transparent",cursor:"pointer",fontFamily:"'Outfit',sans-serif",textAlign:"left"}}>
                        <span style={{fontSize:18,width:28,textAlign:"center"}}>{l.flag}</span>
                        <span style={{fontSize:12,fontWeight:lang===l.code?700:500,color:lang===l.code?T.gold:T.white}}>{l.name}</span>
                        {lang===l.code&&<span style={{marginLeft:"auto",color:T.gold}}>{I.check}</span>}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* TAB CONTENT */}
        <div style={{padding:"28px 28px 60px"}}>
