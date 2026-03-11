/* ═══════════════════════════════════════════════════════════════
   DXB ANALYTICS — ADMIN PANEL (SLIM SHELL)
   Session 23: All tabs extracted — shell is ~300 lines
   ═══════════════════════════════════════════════════════════════ */
import React, { useState, useEffect, useCallback } from "react";
import ReactDOM from "react-dom";
import { auth, db, storage, firebaseConfig } from "./firebase";
import { initializeApp, deleteApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import emailjs from "@emailjs/browser";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { onAuthStateChanged, signOut, createUserWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { collection, getDocs, doc, getDoc, setDoc, deleteDoc, onSnapshot, query, orderBy, limit, where, addDoc } from "firebase/firestore";
import { BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { emaarProjects, emaarCommunities, emaarYields, communityROI as defaultCommunityROI, communityIntel as defaultCommunityIntel } from "./data";
import ProjectManager from "./ProjectManager";
import { useI18n, LANGUAGES } from "./i18n";

// ── Extracted Tab Components ──────────────────────────────────────────────────
import AdminOverviewTab      from "./features/admin/tabs/AdminOverviewTab";
import AdminAuditLogTab      from "./features/admin/tabs/AdminAuditLogTab";
import AdminRevenueTab       from "./features/admin/tabs/AdminRevenueTab";
import AdminDataTab          from "./features/admin/tabs/AdminDataTab";
import AdminLeadsTab         from "./features/admin/tabs/AdminLeadsTab";
import AdminVerificationTab  from "./features/admin/tabs/AdminVerificationTab";
import AdminAnalyticsTab     from "./features/admin/tabs/AdminAnalyticsTab";
import AdminCancellationTab  from "./features/admin/tabs/AdminCancellationTab";
import AdminTabControlTab    from "./features/admin/tabs/AdminTabControlTab";
import AdminUsersTab         from "./features/admin/tabs/AdminUsersTab";

// ── Inline tab stubs — Sessions 24-28 will replace these with real components ─
// eslint-disable-next-line no-unused-vars
const UsersTab         = AdminUsersTab;
// eslint-disable-next-line no-unused-vars
import AdminNotificationsTab  from "./features/admin/tabs/AdminNotificationsTab";
const NotificationsTab = AdminNotificationsTab;
// eslint-disable-next-line no-unused-vars
const DigestTab        = (props) => null; // Session 26
// eslint-disable-next-line no-unused-vars
const EiborRatesPanel  = (props) => null; // Session 27
// eslint-disable-next-line no-unused-vars
const SupportTab       = (props) => null; // Session 28

/* ─── THEME ─── */
const T = {
  bg: "#04090F", surface: "#0A1628", surfaceAlt: "#0E1D35", card: "#0D1B30",
  gold: "#D4A843", goldLight: "#E8C96A", goldDim: "#B8912F", goldGlow: "rgba(212,168,67,0.12)",
  teal: "#00BFA5", white: "#FFFFFF",
  textPrimary: "#E2E8F0", textSecondary: "#94A3B8", textMuted: "#64748B",
  border: "rgba(212,168,67,0.08)", borderHover: "rgba(212,168,67,0.2)",
  red: "#EF4444", green: "#10B981", blue: "#3B82F6", purple: "#8B5CF6",
  cyan: "#06B6D4", orange: "#F59E0B",
};

/* ─── ICONS ─── */
const I = {
  overview:  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>,
  users:     <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  revenue:   <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
  leads:     <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>,
  analytics: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  data:      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4.03 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5"/></svg>,
  logout:    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  bell:      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
  verify:    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>,
  refresh:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>,
  download:  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  trash:     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>,
  check:     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>,
  search:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  email:     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22 6 12 13 2 6"/></svg>,
  eibor:     <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
  cancel:    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>,
  support:   <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  tabctrl:   <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="4" rx="1"/><rect x="3" y="10" width="18" height="4" rx="1"/><rect x="3" y="17" width="18" height="4" rx="1"/></svg>,
};

/* ─── CSS ─── */
const css = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700;9..144,900&display=swap');
* { margin: 0; padding: 0; box-sizing: border-box; }
html { font-size: 14px; }
body { background: ${T.bg}; color: ${T.textPrimary}; font-family: 'Outfit', sans-serif; }
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: rgba(212,168,67,0.2); border-radius: 3px; }
* { scrollbar-width: thin; scrollbar-color: rgba(212,168,67,0.15) transparent; }
select option { background: ${T.surface}; color: ${T.textPrimary}; }
@keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
@keyframes spin { to { transform: rotate(360deg); } }
@keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
@keyframes toastIn { 0% { opacity: 0; transform: translateY(20px); } 100% { opacity: 1; transform: translateY(0); } }
@keyframes toastOut { 0% { opacity: 1; } 100% { opacity: 0; transform: translateY(-10px); } }
.fade-up { animation: fadeUp 0.5s ease-out forwards; opacity: 0; }
.toast-notify { animation: toastIn 0.3s ease-out, toastOut 0.4s ease-in 2.4s forwards; }
.kpi-card { background: linear-gradient(135deg, ${T.card} 0%, ${T.surfaceAlt} 100%); border: 1px solid ${T.border}; border-radius: 16px; padding: 20px 16px; position: relative; overflow: hidden; transition: all 0.3s ease; }
.kpi-card:hover { border-color: ${T.borderHover}; transform: translateY(-2px); box-shadow: 0 8px 32px rgba(0,0,0,0.3); }
.chart-box { background: ${T.surface}; border: 1px solid ${T.border}; border-radius: 16px; transition: border-color 0.2s; }
.chart-box:hover { border-color: ${T.borderHover}; }
.sidebar-btn { display: flex; align-items: center; gap: 10px; width: 100%; padding: 9px 14px; border-radius: 10px; border: none; background: transparent; color: ${T.textSecondary}; font-size: 13px; font-weight: 500; cursor: pointer; font-family: 'Outfit',sans-serif; transition: all 0.15s; text-align: left; }
.sidebar-btn:hover { background: ${T.surfaceAlt}; color: ${T.white}; }
.sidebar-btn.active { background: ${T.goldGlow}; color: ${T.gold}; font-weight: 700; border: 1px solid rgba(212,168,67,0.15); }
@media (max-width: 768px) { .admin-sidebar { transform: translateX(-100%); } .admin-sidebar.open { transform: translateX(0); } .admin-main { margin-left: 0 !important; } .admin-mobile-btn { display: flex !important; } .mobile-overlay { display: block; } .kpi-grid-overview { grid-template-columns: repeat(2, 1fr) !important; } .charts-row-overview { grid-template-columns: 1fr !important; } }
.mobile-overlay { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 99; }
.mobile-overlay.open { display: block; }
`;

/* ─── HELPERS ─── */
function plainify(obj) {
  if (obj === null || obj === undefined) return "";
  if (typeof obj === "string" || typeof obj === "number" || typeof obj === "boolean") return obj;
  if (typeof obj.toDate === "function") return obj.toDate().toISOString();
  if (Array.isArray(obj)) return obj.map(plainify);
  if (typeof obj === "object") { const o = {}; Object.keys(obj).forEach(k => { o[k] = plainify(obj[k]); }); return o; }
  return String(obj);
}

async function logAudit(db, payload) {
  try {
    const changedBy = auth.currentUser?.email || "admin";
    const entry = { ...payload, changedBy, changedAt: new Date().toISOString() };
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    await setDoc(doc(db, "auditLog", id), entry);
  } catch (e) { console.error("logAudit:", e); }
}

/* ─── TABS CONFIG ─── */
const TABS = [
  { id: "overview",      label: "Overview",       icon: I.overview },
  { id: "auditlog",      label: "Audit Log",       icon: I.overview },
  { id: "users",         label: "Users",           icon: I.users },
  { id: "revenue",       label: "Revenue",         icon: I.revenue },
  { id: "data",          label: "Data Manager",    icon: I.data },
  { id: "leads",         label: "Leads",           icon: I.leads },
  { id: "notifications", label: "Notifications",   icon: I.bell },
  { id: "verification",  label: "Verification",    icon: I.verify },
  { id: "analytics",     label: "Analytics",       icon: I.analytics },
  { id: "digest",        label: "Email Digest",    icon: I.bell },
  { id: "eibor",         label: "EIBOR Rates",     icon: I.eibor },
  { id: "cancellation",  label: "Cancellations",   icon: I.cancel },
  { id: "support",       label: "Support Inbox",   icon: I.support },
  { id: "tabcontrol",    label: "Tab Control",     icon: I.tabctrl },
];

/* ─── KPI DRILL MODAL ─── */
function KpiDrillModal({ kpiDrill, setKpiDrill, T }) {
  if (!kpiDrill) return null;
  const { title, color, subtitle, items, chart, actions } = kpiDrill;
  return ReactDOM.createPortal(
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 9000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={() => setKpiDrill(null)}>
      <div style={{ background: T.surface, border: `1px solid ${color}40`, borderRadius: 20, padding: 28, width: "100%", maxWidth: 520, maxHeight: "85vh", overflowY: "auto", animation: "slideUp 0.2s ease-out", position: "relative" }} onClick={e => e.stopPropagation()}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${color}, ${color}00)`, borderRadius: "20px 20px 0 0" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 4 }}>{title}</div>
            {subtitle && <div style={{ fontSize: 12, color: T.textSecondary }}>{subtitle}</div>}
          </div>
          <button type="button" onClick={() => setKpiDrill(null)} style={{ background: "none", border: `1px solid ${T.border}`, borderRadius: 8, width: 28, height: 28, cursor: "pointer", color: T.textMuted, fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
        </div>
        {items && items.map((item, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px 0", borderBottom: i < items.length - 1 ? `1px solid ${T.border}` : "none" }}>
            <div>
              <div style={{ fontSize: 12, color: T.textSecondary }}>{item.label}</div>
              {item.note && <div style={{ fontSize: 10, color: T.textMuted, marginTop: 2 }}>{item.note}</div>}
            </div>
            <div style={{ fontSize: 14, fontWeight: 800, color: item.color || color, fontFamily: "'Fraunces',serif" }}>{item.value}</div>
          </div>
        ))}
        {chart && <div style={{ marginTop: 16, padding: "14px 0" }}>{chart}</div>}
        {actions && actions.length > 0 && (
          <div style={{ display: "flex", gap: 8, marginTop: 20, flexWrap: "wrap" }}>
            {actions.map((a, i) => (
              <button key={i} type="button" onClick={() => { a.fn(); setKpiDrill(null); }}
                style={{ flex: 1, padding: "9px 14px", borderRadius: 10, border: `1px solid ${(a.color || color)}40`, background: `${a.color || color}10`, color: a.color || color, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>
                {a.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════ */
export default function AdminPanel() {
  const { lang, setLang, t: i18t, dir, langInfo } = useI18n();
  const [showLangPicker, setShowLangPicker] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [adminUser, setAdminUser] = useState(null);
  const [tab, setTab] = useState(() => { try { return localStorage.getItem("admin_tab") || "overview"; } catch { return "overview"; } });
  const [kpiDrill, setKpiDrill] = useState(null);
  const [toast, setToast] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  // ── Users ────────────────────────────────────────────────────────────────────
  const [users, setUsers] = useState([]);
  const [userSearch, setUserSearch] = useState(() => { try { return localStorage.getItem("admin_userSearch") || ""; } catch { return ""; } });
  const [tierFilter, setTierFilter] = useState(() => { try { return localStorage.getItem("admin_tierFilter") || "All"; } catch { return "All"; } });
  const [sortBy] = useState("newest");
  const [editingUser, setEditingUser] = useState(null);
  const [editUserForm, setEditUserForm] = useState({});
  const [editUserLoading, setEditUserLoading] = useState(false);
  const [showAddUser, setShowAddUser] = useState(false);
  const [addUserForm, setAddUserForm] = useState({ name: "", email: "", password: "", phone: "", country: "", tier: "free", notes: "" });
  const [addUserLoading, setAddUserLoading] = useState(false);
  const [pendingOpenUid, setPendingOpenUid] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [bulkImportData, setBulkImportData] = useState([]);
  const [bulkImportLoading, setBulkImportLoading] = useState(false);

  // ── Collections ──────────────────────────────────────────────────────────────
  const [auditLog, setAuditLog] = useState([]);
  const [verifications, setVerifications] = useState([]);
  const [leads, setLeads] = useState([]);

  // ── Data Manager ─────────────────────────────────────────────────────────────
  const [dataSubTab, setDataSubTab] = useState(() => { try { return localStorage.getItem("admin_dataSubTab") || "projects"; } catch { return "projects"; } });
  const [editingProject, setEditingProject] = useState(null);
  const [editingCommunity, setEditingCommunity] = useState(null);
  const [editingYield, setEditingYield] = useState(null);
  const [liveProjects, setLiveProjects] = useState({});
  const [liveCommunityROI, setLiveCommunityROI] = useState({});
  const [liveYields, setLiveYields] = useState({});
  const [dataSearch, setDataSearch] = useState("");
  const [projectForm, setProjectForm] = useState({});
  const [communityForm, setCommunityForm] = useState({});
  const [yieldForm, setYieldForm] = useState({});
  const [projectCommunityFilter, setProjectCommunityFilter] = useState("All");
  const [projectStatusFilter, setProjectStatusFilter] = useState("All");
  const [bulkSelected, setBulkSelected] = useState([]);
  const [tabDataEdits, setTabDataEdits] = useState({});
  const [tabDataSaving, setTabDataSaving] = useState(false);
  const [tabSettings, setTabSettings] = useState({});

  // ── Analytics ────────────────────────────────────────────────────────────────
  const [analyticsRange, setAnalyticsRange] = useState("30d");
  const [cohortDrilldown, setCohortDrilldown] = useState(null);

  // ── Tab Control ──────────────────────────────────────────────────────────────
  const [tabSearch, setTabSearch] = useState("");
  const [selectedTabControl, setSelectedTabControl] = useState(null);

  // ── Verify ───────────────────────────────────────────────────────────────────
  const [verifyFilter, setVerifyFilter] = useState("all");
  const [verifySearch, setVerifySearch] = useState("");
  const [verifySubTab, setVerifySubTab] = useState("queue");
  const [reviewingUser, setReviewingUser] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  // ── Leads ────────────────────────────────────────────────────────────────────
  const [leadFilter, setLeadFilter] = useState("all");
  const [leadSearch, setLeadSearch] = useState("");
  const [leadDrawer, setLeadDrawer] = useState(null);
  const [showAddLead, setShowAddLead] = useState(false);
  const [addLeadForm, setAddLeadForm] = useState({ name: "", email: "", phone: "", source: "Manual", project: "", notes: "" });
  const [addLeadLoading, setAddLeadLoading] = useState(false);
  const [leadsViewMode, setLeadsViewMode] = useState("table");

  // ── Overview ─────────────────────────────────────────────────────────────────
  const [overviewCompare, setOverviewCompare] = useState("week");

  // ── Audit ────────────────────────────────────────────────────────────────────
  const [auditRetentionDays, setAuditRetentionDays] = useState(0);
  const [auditWebhookUrl, setAuditWebhookUrl] = useState("");
  const [auditAlertThr, setAuditAlertThr] = useState(10);
  const [apiKeys, setApiKeys] = useState([]);

  /* ─── PERSIST TAB ─── */
  const isHydrated = React.useRef(false);
  useEffect(() => { const t = setTimeout(() => { isHydrated.current = true; }, 100); return () => clearTimeout(t); }, []);
  useEffect(() => { if (!isHydrated.current) return; try { localStorage.setItem("admin_tab", tab); } catch {} }, [tab]);
  useEffect(() => { if (!isHydrated.current) return; try { localStorage.setItem("admin_userSearch", userSearch); } catch {} }, [userSearch]);
  useEffect(() => { if (!isHydrated.current) return; try { localStorage.setItem("admin_tierFilter", tierFilter); } catch {} }, [tierFilter]);
  useEffect(() => { if (!isHydrated.current) return; try { localStorage.setItem("admin_dataSubTab", dataSubTab); } catch {} }, [dataSubTab]);

  /* ─── ESCAPE KEY ─── */
  useEffect(() => {
    const h = (e) => { if (e.key === "Escape") setSidebarOpen(false); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  /* ─── AUTH ─── */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setAdminUser(u);
        try {
          const snap = await getDoc(doc(db, "users", u.uid));
          if (snap.exists() && snap.data().role === "admin") {
            setIsAdmin(true);
            logAudit(db, { action: "admin_login", uid: u.uid }).catch(() => {});
          } else setIsAdmin(false);
        } catch { setIsAdmin(false); }
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  /* ─── FETCH FUNCTIONS ─── */
  const fetchUsers = useCallback(async () => {
    try {
      const snap = await getDocs(collection(db, "users"));
      const list = [];
      snap.forEach(d => list.push({ uid: d.id, ...plainify(d.data()) }));
      setUsers(list);
    } catch (e) { console.error("Fetch users:", e); }
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    let unsub;
    try {
      unsub = onSnapshot(collection(db, "users"), (snap) => {
        const list = [];
        snap.forEach(d => list.push({ uid: d.id, ...plainify(d.data()) }));
        setUsers(list);
      });
    } catch { fetchUsers(); }
    return () => { if (unsub) unsub(); };
  }, [isAdmin, fetchUsers]);

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

  const fetchAuditLog = useCallback(async () => {
    try {
      const q = query(collection(db, "auditLog"), orderBy("changedAt", "desc"), limit(100));
      const snap = await getDocs(q);
      const list = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() }));
      setAuditLog(list);
    } catch {
      try {
        const snap = await getDocs(collection(db, "auditLog"));
        const list = [];
        snap.forEach(d => list.push({ id: d.id, ...d.data() }));
        list.sort((a, b) => new Date(b.changedAt || 0) - new Date(a.changedAt || 0));
        setAuditLog(list.slice(0, 100));
      } catch (e2) { console.error("Fetch audit log:", e2); }
    }
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    let unsub;
    (async () => {
      try {
        const q = query(collection(db, "auditLog"), orderBy("changedAt", "desc"), limit(100));
        unsub = onSnapshot(q, (snap) => {
          const list = [];
          snap.forEach(d => list.push({ id: d.id, ...d.data() }));
          setAuditLog(list);
        });
      } catch { fetchAuditLog(); }
    })();
    return () => { if (unsub) unsub(); };
  }, [isAdmin, fetchAuditLog]);

  /* ─── HELPERS ─── */
  const notify = (msg) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  const now = new Date();
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

  const exportCSV = (data, filename) => {
    if (!data?.length) return;
    const headers = Object.keys(data[0]);
    const rows = data.map(r => headers.map(h => JSON.stringify(r[h] ?? "")).join(","));
    const blob = new Blob([headers.join(",") + "\n" + rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  /* ─── USER ACTIONS (passed to UsersTab) ─── */
  const changeTier = async (uid, tier) => {
    try {
      const old = users.find(u => u.uid === uid);
      await setDoc(doc(db, "users", uid), { tier }, { merge: true });
      logAudit(db, { action: "tier_change", uid, from: old?.tier, to: tier });
      notify(`Tier updated to ${tier}`);
    } catch { notify("Error updating tier"); }
  };

  const deleteUser = async (uid) => {
    try {
      await deleteDoc(doc(db, "users", uid));
      logAudit(db, { action: "user_deleted", uid });
      notify("User deleted");
      fetchUsers();
    } catch { notify("Error deleting user"); }
  };

  const suspendUser = async (uid, suspend) => {
    try {
      await setDoc(doc(db, "users", uid), { suspended: suspend }, { merge: true });
      logAudit(db, { action: suspend ? "user_suspended" : "user_unsuspended", uid });
      notify(suspend ? "User suspended" : "User unsuspended");
    } catch { notify("Error"); }
  };

  const sendResetEmail = async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
      notify(`Reset email sent to ${email}`);
    } catch { notify("Error sending reset email"); }
  };

  const extendTrial = async (uid, days) => {
    try {
      const u = users.find(x => x.uid === uid);
      const base = u?.trialEnd ? new Date(u.trialEnd) : new Date();
      const newEnd = new Date(base.getTime() + days * 86400000).toISOString();
      await setDoc(doc(db, "users", uid), { trialEnd: newEnd }, { merge: true });
      logAudit(db, { action: "trial_extended", uid, days });
      notify(`Trial extended by ${days} days`);
    } catch { notify("Error extending trial"); }
  };

  const openEditUser = (u) => { setEditingUser(u); setEditUserForm({ name: u.name || "", email: u.email || "", phone: u.phone || "", country: u.country || "", tier: u.tier || "free", notes: u.notes || "" }); };
  const saveEditUser = async () => {
    if (!editingUser) return;
    setEditUserLoading(true);
    try {
      await setDoc(doc(db, "users", editingUser.uid), editUserForm, { merge: true });
      logAudit(db, { action: "user_edited", uid: editingUser.uid });
      notify("User saved");
      setEditingUser(null);
      fetchUsers();
    } catch { notify("Error saving user"); }
    setEditUserLoading(false);
  };

  const addUserManually = async () => {
    if (!addUserForm.email || !addUserForm.password) { notify("Email and password required"); return; }
    setAddUserLoading(true);
    try {
      const tmp = initializeApp({ ...firebaseConfig, appName: `tmp_${Date.now()}` }, `tmp_${Date.now()}`);
      const tmpAuth = getAuth(tmp);
      const cred = await createUserWithEmailAndPassword(tmpAuth, addUserForm.email, addUserForm.password);
      await setDoc(doc(db, "users", cred.user.uid), { ...addUserForm, createdAt: new Date().toISOString(), role: "user" });
      await deleteApp(tmp);
      logAudit(db, { action: "user_added_manual", uid: cred.user.uid });
      notify("User created");
      setShowAddUser(false);
      setAddUserForm({ name: "", email: "", password: "", phone: "", country: "", tier: "free", notes: "" });
      fetchUsers();
    } catch (e) { notify(`Error: ${e.message}`); }
    setAddUserLoading(false);
  };

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
      else if (tierFilter === "Suspended") mt = !!u.suspended;
      return ms && mt;
    })
    .sort((a, b) => {
      if (sortBy === "newest") return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      if (sortBy === "oldest") return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
      return 0;
    });

  /* Quick stats for topbar */
  const mrr   = users.filter(u => u.tier === "pro").length * 99 + users.filter(u => u.tier === "enterprise").length * 499;
  const paid  = users.filter(u => u.tier === "pro" || u.tier === "enterprise").length;
  const total = users.length;

  /* ─── LOADING / ACCESS GUARDS ─── */
  if (loading) return (
    <div style={{ minHeight: "100vh", background: T.bg, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
      <style>{css}</style>
      <svg width="40" height="40" viewBox="0 0 40 40"><rect x="2" y="2" width="36" height="36" rx="8" fill="none" stroke={T.gold} strokeWidth="2"/><path d="M12 28V12h10l-6 8h8l-12 8z" fill={T.gold}/></svg>
      <div style={{ color: T.gold, fontFamily: "'Fraunces', serif", fontSize: 18, fontWeight: 700 }}>DXB Analytics</div>
      <div style={{ width: 24, height: 24, border: `2px solid ${T.border}`, borderTopColor: T.gold, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
    </div>
  );

  if (!isAdmin) return (
    <div style={{ minHeight: "100vh", background: T.bg, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 20, fontFamily: "'Outfit',sans-serif" }}>
      <style>{css}</style>
      <svg width="48" height="48" viewBox="0 0 40 40"><rect x="2" y="2" width="36" height="36" rx="8" fill="none" stroke={T.gold} strokeWidth="2"/><path d="M12 28V12h10l-6 8h8l-12 8z" fill={T.gold}/></svg>
      <h1 style={{ fontFamily: "'Fraunces',serif", fontSize: 24, fontWeight: 800, color: T.white }}>Admin Access Required</h1>
      <p style={{ color: T.textSecondary, fontSize: 13 }}>You don't have permission to access this page.</p>
      <a href="/" style={{ color: T.gold, fontSize: 13, textDecoration: "none", padding: "10px 24px", border: `1px solid ${T.gold}`, borderRadius: 10, fontWeight: 600 }}>← Back to Dashboard</a>
    </div>
  );

  /* ─── SHARED PROPS BUNDLE — passed into all tab components ─── */
  const sharedProps = {
    users, filteredUsers, auditLog, leads, verifications,
    setTab, setTierFilter, setPendingOpenUid,
    notify, T, I, emailjs, db,
    trialDaysLeft, timeSince, exportCSV,
    fetchUsers, fetchLeads, fetchVerifications, fetchAuditLog,
    logAudit, setKpiDrill,
  };

  /* ═══════════════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════════════ */
  return (
    <div style={{ minHeight: "100vh", background: T.bg, fontFamily: "'Outfit',sans-serif", color: T.textPrimary }}>
      <style>{css}</style>

      {/* ── Modals ── */}
      <KpiDrillModal kpiDrill={kpiDrill} setKpiDrill={setKpiDrill} T={T} />
      {toast && <div key={toast} className="toast-notify" style={{ position: "fixed", bottom: 24, right: 24, padding: "12px 24px", borderRadius: 10, background: (toast.includes("failed") || toast.includes("Error") || toast.includes("required")) ? T.red : T.green, color: T.white, fontWeight: 700, fontSize: 13, zIndex: 99999, boxShadow: "0 12px 40px rgba(0,0,0,0.4)" }}>{toast}</div>}

      {/* ── Mobile overlay ── */}
      <div className={`mobile-overlay ${sidebarOpen ? "open" : ""}`} onClick={() => setSidebarOpen(false)} />

      {/* ── SIDEBAR ── */}
      <aside className={`admin-sidebar ${sidebarOpen ? "open" : ""}`} style={{ position: "fixed", top: 0, left: 0, bottom: 0, width: 240, background: T.surface, borderRight: `1px solid ${T.border}`, display: "flex", flexDirection: "column", zIndex: 100, transition: "transform 0.3s ease" }}>
        <div style={{ padding: "24px 20px 20px", borderBottom: `1px solid ${T.border}` }}>
          <a href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <svg width="32" height="32" viewBox="0 0 40 40"><rect x="2" y="2" width="36" height="36" rx="8" fill="none" stroke={T.gold} strokeWidth="2"/><path d="M12 28V12h10l-6 8h8l-12 8z" fill={T.gold}/></svg>
            <div>
              <div style={{ fontFamily: "'Fraunces',serif", fontSize: 16, fontWeight: 800, color: T.gold }}>DXB Analytics</div>
              <div style={{ fontSize: 9, color: T.textMuted, letterSpacing: 1.5, textTransform: "uppercase" }}>Admin Console</div>
            </div>
          </a>
        </div>
        <nav style={{ flex: 1, padding: "16px 12px", display: "flex", flexDirection: "column", gap: 3, overflowY: "auto" }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: T.textMuted, letterSpacing: 1.5, textTransform: "uppercase", padding: "0 16px 8px" }}>Platform</div>
          {TABS.map(t => (
            <button type="button" key={t.id} className={`sidebar-btn ${tab === t.id ? "active" : ""}`} onClick={() => setTab(t.id)}>
              <span style={{ color: tab === t.id ? T.gold : T.textMuted }}>{t.icon}</span>
              {t.label}
            </button>
          ))}
          <div style={{ fontSize: 9, fontWeight: 700, color: T.textMuted, letterSpacing: 1.5, textTransform: "uppercase", padding: "16px 16px 8px", marginTop: 8, borderTop: `1px solid ${T.border}` }}>Quick Links</div>
          <a href="/" className="sidebar-btn" style={{ textDecoration: "none" }}>{I.overview} <span>Dashboard</span></a>
        </nav>
        <div style={{ padding: "16px 12px", borderTop: `1px solid ${T.border}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 10, background: T.surfaceAlt }}>
            <div style={{ width: 34, height: 34, borderRadius: "50%", background: `linear-gradient(135deg, ${T.gold}, ${T.goldDim})`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 13, color: T.bg }}>
              {(adminUser?.displayName || adminUser?.email || "A")[0].toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.white, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{adminUser?.displayName || adminUser?.email?.split("@")[0]}</div>
              <div style={{ fontSize: 10, color: T.gold, fontWeight: 600 }}>Admin</div>
            </div>
            <button type="button" onClick={() => { logAudit(db, { action: "admin_logout", uid: adminUser?.uid }).finally(() => signOut(auth)); }} title="Logout" style={{ background: "none", border: "none", color: T.textMuted, cursor: "pointer", padding: 4 }}>{I.logout}</button>
          </div>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main dir={dir} className="admin-main" style={{ marginLeft: 240, minHeight: "100vh" }}>

        {/* Topbar */}
        <header className="admin-topbar" style={{ position: "sticky", top: 0, zIndex: 20, height: 60, background: `${T.surface}ee`, backdropFilter: "blur(16px)", borderBottom: `1px solid ${T.border}`, padding: "0 28px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button type="button" className="admin-mobile-btn" onClick={() => setSidebarOpen(!sidebarOpen)} style={{ display: "none", alignItems: "center", justifyContent: "center", width: 34, height: 34, borderRadius: 8, background: T.surfaceAlt, border: `1px solid ${T.border}`, color: T.textSecondary, cursor: "pointer" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            </button>
            <div>
              <h1 style={{ fontSize: 16, fontWeight: 700, color: T.white }}>Admin Console</h1>
              <p style={{ fontSize: 10, color: T.textMuted }}>{new Date().toLocaleDateString("en-AE", { weekday: "short", day: "numeric", month: "short", year: "numeric" })} · {total} users</p>
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
              <span style={{ fontSize: 12, fontWeight: 700, color: T.teal }}>{paid}</span>
            </div>
            {/* Language Picker */}
            <div style={{ position: "relative" }}>
              <button type="button" onClick={() => setShowLangPicker(!showLangPicker)} style={{ background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 10, padding: "6px 10px", cursor: "pointer", color: T.textSecondary, display: "flex", alignItems: "center", gap: 5, fontSize: 11, fontFamily: "'Outfit',sans-serif", fontWeight: 600 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                {langInfo.name}
              </button>
              {showLangPicker && (
                <>
                  <div style={{ position: "fixed", inset: 0, zIndex: 99998 }} onClick={() => setShowLangPicker(false)} />
                  <div style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, width: 280, maxHeight: 420, overflowY: "auto", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, boxShadow: "0 20px 60px rgba(0,0,0,0.5)", zIndex: 9999, padding: 8 }}>
                    {LANGUAGES.map(l => (
                      <button type="button" key={l.code} onClick={() => { setLang(l.code); setShowLangPicker(false); }}
                        style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 8, border: "none", background: lang === l.code ? T.goldGlow : "transparent", cursor: "pointer", fontFamily: "'Outfit',sans-serif", textAlign: "left" }}>
                        <span style={{ fontSize: 18, width: 28, textAlign: "center" }}>{l.flag}</span>
                        <span style={{ fontSize: 12, fontWeight: lang === l.code ? 700 : 500, color: lang === l.code ? T.gold : T.white }}>{l.name}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* ── TAB CONTENT ── */}
        <div style={{ padding: "28px 28px 60px" }}>

          {tab === "overview" && (
            <AdminOverviewTab
              {...sharedProps}
              overviewCompare={overviewCompare}
              setOverviewCompare={setOverviewCompare}
            />
          )}

          {tab === "users" && (
            <UsersTab
              {...sharedProps}
              userSearch={userSearch} setUserSearch={setUserSearch}
              tierFilter={tierFilter} setTierFilter={setTierFilter}
              editingUser={editingUser} setEditingUser={setEditingUser}
              editUserForm={editUserForm} setEditUserForm={setEditUserForm}
              editUserLoading={editUserLoading}
              showAddUser={showAddUser} setShowAddUser={setShowAddUser}
              addUserForm={addUserForm} setAddUserForm={setAddUserForm}
              addUserLoading={addUserLoading}
              pendingOpenUid={pendingOpenUid} setPendingOpenUid={setPendingOpenUid}
              onDrawerChange={setDrawerOpen}
              showBulkImport={showBulkImport} setShowBulkImport={setShowBulkImport}
              bulkImportData={bulkImportData} setBulkImportData={setBulkImportData}
              bulkImportLoading={bulkImportLoading} setBulkImportLoading={setBulkImportLoading}
              changeTier={changeTier} deleteUser={deleteUser} suspendUser={suspendUser}
              sendResetEmail={sendResetEmail} extendTrial={extendTrial}
              openEditUser={openEditUser} saveEditUser={saveEditUser}
              addUserManually={addUserManually}
            />
          )}

          {tab === "auditlog" && (
            <AdminAuditLogTab
              {...sharedProps}
              auditRetentionDays={auditRetentionDays} setAuditRetentionDays={setAuditRetentionDays}
              auditWebhookUrl={auditWebhookUrl} setAuditWebhookUrl={setAuditWebhookUrl}
              auditAlertThr={auditAlertThr} setAuditAlertThr={setAuditAlertThr}
              apiKeys={apiKeys} setApiKeys={setApiKeys}
              emaarProjects={emaarProjects}
            />
          )}

          {tab === "revenue" && (
            <AdminRevenueTab {...sharedProps} />
          )}

          {tab === "data" && (
            <AdminDataTab
              {...sharedProps}
              dataSubTab={dataSubTab} setDataSubTab={setDataSubTab}
              editingProject={editingProject} setEditingProject={setEditingProject}
              editingCommunity={editingCommunity} setEditingCommunity={setEditingCommunity}
              editingYield={editingYield} setEditingYield={setEditingYield}
              liveProjects={liveProjects} setLiveProjects={setLiveProjects}
              liveCommunityROI={liveCommunityROI} setLiveCommunityROI={setLiveCommunityROI}
              liveYields={liveYields} setLiveYields={setLiveYields}
              dataSearch={dataSearch} setDataSearch={setDataSearch}
              projectForm={projectForm} setProjectForm={setProjectForm}
              communityForm={communityForm} setCommunityForm={setCommunityForm}
              yieldForm={yieldForm} setYieldForm={setYieldForm}
              projectCommunityFilter={projectCommunityFilter} setProjectCommunityFilter={setProjectCommunityFilter}
              projectStatusFilter={projectStatusFilter} setProjectStatusFilter={setProjectStatusFilter}
              bulkSelected={bulkSelected} setBulkSelected={setBulkSelected}
              tabDataEdits={tabDataEdits} setTabDataEdits={setTabDataEdits}
              tabDataSaving={tabDataSaving} setTabDataSaving={setTabDataSaving}
              emaarProjects={emaarProjects} emaarCommunities={emaarCommunities}
              emaarYields={emaarYields} defaultCommunityROI={defaultCommunityROI}
              defaultCommunityIntel={defaultCommunityIntel}
              storage={storage} uploadBytes={uploadBytes} getDownloadURL={getDownloadURL}
              plainify={plainify}
            />
          )}

          {tab === "leads" && (
            <AdminLeadsTab
              {...sharedProps}
              leadFilter={leadFilter} setLeadFilter={setLeadFilter}
              leadSearch={leadSearch} setLeadSearch={setLeadSearch}
              leadDrawer={leadDrawer} setLeadDrawer={setLeadDrawer}
              showAddLead={showAddLead} setShowAddLead={setShowAddLead}
              addLeadForm={addLeadForm} setAddLeadForm={setAddLeadForm}
              addLeadLoading={addLeadLoading} setAddLeadLoading={setAddLeadLoading}
              leadsViewMode={leadsViewMode} setLeadsViewMode={setLeadsViewMode}
            />
          )}

          {tab === "notifications" && <NotificationsTab T={T} I={I} db={db} notify={notify} users={users} adminUser={adminUser} />}

          {tab === "verification" && (
            <AdminVerificationTab
              {...sharedProps}
              verifyFilter={verifyFilter} setVerifyFilter={setVerifyFilter}
              verifySearch={verifySearch} setVerifySearch={setVerifySearch}
              verifySubTab={verifySubTab} setVerifySubTab={setVerifySubTab}
              reviewingUser={reviewingUser} setReviewingUser={setReviewingUser}
              rejectReason={rejectReason} setRejectReason={setRejectReason}
            />
          )}

          {tab === "analytics" && (
            <AdminAnalyticsTab
              {...sharedProps}
              analyticsRange={analyticsRange} setAnalyticsRange={setAnalyticsRange}
              cohortDrilldown={cohortDrilldown} setCohortDrilldown={setCohortDrilldown}
            />
          )}

          {tab === "digest" && <DigestTab T={T} db={db} notify={notify} users={users} />}

          {tab === "eibor" && <EiborRatesPanel T={T} db={db} notify={notify} />}

          {tab === "cancellation" && (
            <AdminCancellationTab {...sharedProps} />
          )}

          {tab === "support" && <SupportTab T={T} I={I} db={db} notify={notify} adminUser={adminUser} users={users} setTab={setTab} setPendingOpenUid={setPendingOpenUid} />}

          {tab === "tabcontrol" && (
            <AdminTabControlTab
              {...sharedProps}
              tabSettings={tabSettings} setTabSettings={setTabSettings}
              tabSearch={tabSearch} setTabSearch={setTabSearch}
              selectedTabControl={selectedTabControl} setSelectedTabControl={setSelectedTabControl}
            />
          )}

        </div>
      </main>
    </div>
  );
}
