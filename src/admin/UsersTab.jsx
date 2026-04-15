import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { db } from "../firebase";
import { collection, getDocs, doc, getDoc, setDoc, deleteDoc, onSnapshot, query, orderBy, limit, where, addDoc, updateDoc } from "firebase/firestore";
import { BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { T } from "../theme";
import emailjs from "@emailjs/browser";

function UsersTab({ users, filteredUsers, fetchUsers, changeTier, deleteUser, suspendUser, sendResetEmail, extendTrial, openEditUser, saveEditUser, editingUser, setEditingUser, editUserForm, setEditUserForm, editUserLoading, showAddUser, setShowAddUser, addUserForm, setAddUserForm, addUserManually, addUserLoading, exportCSV, userSearch, setUserSearch, tierFilter, setTierFilter, notify, db, T, I, trialDaysLeft, timeSince, pendingOpenUid, setPendingOpenUid, onDrawerChange, auditLog, showBulkImport, setShowBulkImport, bulkImportData, setBulkImportData, bulkImportLoading, setBulkImportLoading }) {

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
  const [drawerTab,          setDrawerTab]           = useState("details");
  const [showBulkEmailModal, setShowBulkEmailModal]  = useState(false);
  const [bulkEmailTargets,   setBulkEmailTargets]    = useState([]);
  const [bulkEmailSubject,   setBulkEmailSubject]    = useState("");
  const [bulkEmailBody,      setBulkEmailBody]       = useState("");
  const [bulkEmailSending,   setBulkEmailSending]    = useState(false);
  const [bulkEmailProgress,  setBulkEmailProgress]   = useState(0);

  const PAGE_SIZE    = 25;
  const AT_RISK_DAYS = 3; // FIX #6 — single source of truth
  const now          = new Date();

  /* ─── REFS for keyboard nav ─── */
  const pagedUsersRef = React.useRef([]);
  const focusedRowRef = React.useRef(0);
  focusedRowRef.current = focusedRow;

  // Notify parent when drawer opens/closes
  const setDrawerUserWithCallback = (u) => {
    setDrawerUser(u);
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
    { value: "vip",      label: " VIP",        color: "#F59E0B" },
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
        await emailjs.send(import.meta.env.VITE_EMAILJS_SERVICE_ID, import.meta.env.VITE_EMAILJS_TEMPLATE_ID, {
          user_email:   u.email,
          user_name:    u.name || u.email,
          project_name: "DXB Analytics Platform",
          change_type:  days === 0 ? "░ Your Trial Has Expired" : `⚡ Trial Expiring in ${days} Day${days !== 1 ? "s" : ""}`,
          new_value:    days === 0
            ? "Your 7-day trial has ended. Upgrade now to keep full access."
            : `Only ${days} day${days !== 1 ? "s" : ""} left on your free trial. Upgrade before you lose access.`,
          old_value:    "Pro Trial",
          updated_at:   new Date().toLocaleString("en-AE"),
        }, import.meta.env.VITE_EMAILJS_PUBLIC_KEY);
        sent++;
      } catch(e) {}
    }
    setSendingTrialEmails(false);
    notify(sent > 0 ? `[v] Sent ${sent} trial expiry email${sent > 1 ? "s" : ""}` : " No at-risk trials to email");
  };

  /* ─── ACTIONS ─── */
  const handleBulkAction = async () => {
    if (!bulkTier || bulkSel.length === 0) return;
    for (const uid of bulkSel) await changeTier(uid, bulkTier);
    await logAudit(db, { action: "bulk_tier_change", uids: bulkSel, newTier: bulkTier });
    await checkAlerts(db);
    setBulkSel([]); setBulkTier("");
    notify(`Updated ${bulkSel.length} users to ${bulkTier}`);
  };

  const handleTierChange = async (uid, newTier, oldTier) => {
    await changeTier(uid, newTier);
    await logAudit(db, { action: "tier_change", uid, from: oldTier, to: newTier });
    await checkAlerts(db);
    setDrawerUser(prev => prev?.uid === uid ? { ...prev, tier: newTier } : prev);
    setInlineTierUser(null);
  };

  const handleJobRoleChange = async (uid, newRole) => {
    try {
      await setDoc(doc(db, "users", uid), { role: newRole }, { merge: true });
      await logAudit(db, { action: "role_change", uid, to: newRole });
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
      await emailjs.send(import.meta.env.VITE_EMAILJS_SERVICE_ID, import.meta.env.VITE_EMAILJS_TEMPLATE_ID, {
        user_email:   sendEmailUser.email,
        user_name:    sendEmailUser.name || sendEmailUser.email,
        project_name: "DXB Analytics",
        change_type:  emailSubject,
        new_value:    emailBody,
        old_value:    "",
        updated_at:   new Date().toLocaleString("en-AE"),
      }, import.meta.env.VITE_EMAILJS_PUBLIC_KEY);
      notify(`Email sent to ${sendEmailUser.email}`);
      setSendEmailUser(null); setEmailSubject(""); setEmailBody("");
    } catch(e) { notify("Error: Email failed — check EmailJS config"); }
    setEmailSending(false);
  };

  const saveNote = async () => {
    if (!noteUser) return;
    try {
      await setDoc(doc(db, "users", noteUser.uid), { notes: noteText, noteUpdatedAt: new Date().toISOString() }, { merge: true });
      notify("Note saved");
      setNoteUser(null); setNoteText("");
      fetchUsers();
    } catch(e) { notify("Error: Failed to save note"); }
  };

  const saveTag = async (uid, tags) => {
    try {
      await setDoc(doc(db, "users", uid), { tags }, { merge: true });
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
      const id = `notif_${Date.now()}`;
      await setDoc(doc(db, "notifications", id), {
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
    const headers = "Name,Email,Tier,Role,Trial Status,Tags,Country,Last Active,Signed Up
";
    const rows = allFiltered.map(u =>
      `"${u.name || ""}","${u.email || ""}","${u.tier || "free"}","${u.role || ""}","${u.trialEnd ? (new Date(u.trialEnd) > now ? "Active" : "Expired") : "—"}","${(u.tags || []).join("; ")}","${u.country || ""}","${u.lastLoginAt || ""}","${u.createdAt || ""}"`
    ).join("
");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = `dxb-users-${new Date().toISOString().slice(0,10)}.csv`; a.click();
    notify(`Exported ${allFiltered.length} users`);
  };

  /* ─── SHARED STYLE HELPERS ─── */
  const inputStyle = { width: "100%", padding: "10px 12px", background: T.bg, border: "1px solid rgba(212,168,67,0.15)", borderRadius: 9, color: T.textPrimary, fontSize: 13, fontFamily: "'Outfit',sans-serif", outline: "none", boxSizing: "border-box", transition: "border-color 0.2s", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis" };
  const focusIn  = e => e.target.style.borderColor = T.gold;
  const focusOut = e => e.target.style.borderColor = "rgba(212,168,67,0.15)";

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const Modal     = useMemo(() => ({ children, maxWidth = 500, onClose }) => (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 2000, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "40px 20px", overflowY: "auto" }} onClick={onClose}>
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 20, padding: 28, width: "100%", maxWidth, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  ), []); // eslint-disable-line

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const ModalHeader = useMemo(() => ({ title, sub, onClose }) => (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 22 }}>
      <div>
        <div style={{ fontFamily: "'Fraunces',serif", fontSize: 18, fontWeight: 700, color: T.gold }}>{title}</div>
        {sub && <div style={{ fontSize: 12, color: T.textMuted, marginTop: 3 }}>{sub}</div>}
      </div>
      <button type="button" onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${T.border}`, background: T.surfaceAlt, color: T.textMuted, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}></button>
    </div>
  ), []); // eslint-disable-line

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const Field = useMemo(() => ({ label, children, hint }) => (
    <div>
      <label style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 6 }}>{label}{hint && <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0, marginLeft: 6 }}>{hint}</span>}</label>
      {children}
    </div>
  ), []); // eslint-disable-line

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const Btn = useMemo(() => ({ onClick, color, children, disabled, style = {} }) => (
    <button type="button" onClick={onClick} disabled={disabled} style={{ padding: "10px 20px", borderRadius: 9, border: "none", background: color, color: "#fff", fontSize: 13, fontWeight: 700, cursor: disabled ? "not-allowed" : "pointer", fontFamily: "'Outfit',sans-serif", opacity: disabled ? 0.6 : 1, ...style }}>{children}</button>
  ), []); // eslint-disable-line
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const BtnGhost = useMemo(() => ({ onClick, children, style = {} }) => (
    <button type="button" onClick={onClick} style={{ padding: "10px 20px", borderRadius: 9, border: `1px solid ${T.border}`, background: "transparent", color: T.textSecondary, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit',sans-serif", ...style }}>{children}</button>
  ), []); // eslint-disable-line
  const ColHeader = ({ label, field }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 4, cursor: field ? "pointer" : "default", userSelect: "none" }} onClick={() => field && handleSort(field)}>
      <span style={{ fontSize: 9, fontWeight: 700, color: sortField === field ? T.gold : T.textMuted, letterSpacing: 1, textTransform: "uppercase" }}>{label}</span>
      {field && <SortIcon active={sortField === field} dir={sortDir} />}
    </div>
  );

  /* ==============================================
     MODALS
  ============================================== */

  const DeleteConfirmModal = () => confirmDelete && (
    <Modal onClose={() => setConfirmDelete(null)} maxWidth={420}>
      <div style={{ textAlign: "center", padding: "8px 0 16px" }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", color: "#EF4444" }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></div>
        <div style={{ fontFamily: "'Fraunces',serif", fontSize: 20, fontWeight: 700, color: T.red, marginBottom: 8 }}>Delete User?</div>
        <div style={{ fontSize: 13, color: T.textSecondary, marginBottom: 6 }}><strong style={{ color: T.white }}>{confirmDelete.name || confirmDelete.email}</strong></div>
        <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 20, padding: "10px 16px", background: "rgba(239,68,68,0.06)", borderRadius: 10, border: "1px solid rgba(239,68,68,0.15)", lineHeight: 1.6 }}>
          Permanently removes them from Firestore and revokes all access.
          {confirmDelete.tier === "pro"        && <><br /><span style={{ color: T.red, fontWeight: 700 }}>⚡ Active Pro subscription (AED 99/mo) will be cancelled.</span></>}
          {confirmDelete.tier === "enterprise" && <><br /><span style={{ color: T.red, fontWeight: 700 }}>⚡ Active Enterprise account (AED 499/mo) will be cancelled.</span></>}
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
        <div style={{ width: 48, height: 48, borderRadius: 12, background: confirmSuspend?.suspended ? "rgba(16,185,129,0.08)" : "rgba(245,158,11,0.08)", border: "1px solid", borderColor: confirmSuspend?.suspended ? "rgba(16,185,129,0.2)" : "rgba(245,158,11,0.2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", color: confirmSuspend?.suspended ? "#10B981" : "#F59E0B" }}>{confirmSuspend?.suspended ? <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg> : ""}</div>
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
        <div style={{ fontSize: 40, marginBottom: 12 }}>▒</div>
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
  const AddUserModal = () => !showAddUser ? null : ( // rendered as function call, not component
    <Modal onClose={() => setShowAddUser(false)} maxWidth={520}>
      <ModalHeader title="Add New User" sub="Create a new account directly from admin" onClose={() => setShowAddUser(false)} />
      <div style={{ background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.2)", borderRadius: 10, padding: "10px 14px", marginBottom: 18, fontSize: 12, color: "#93C5FD", lineHeight: 1.6 }}>
         <strong>Note:</strong> Creating an account here uses Firebase client-side auth. The new user will receive a verification email. You will remain logged in as admin.
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        {[
          { label: "Full Name *", key: "name", type: "text", placeholder: "John Smith", full: true },
          { label: "Email Address *", key: "email", type: "email", placeholder: "john@company.com", full: true },
          { label: "Password *", key: "password", type: "password", placeholder: "Min 6 characters", full: true },
        ].map(f => (
          <div key={f.key} style={{ gridColumn: f.full ? "1 / -1" : "auto" }}>
            <Field label={f.label}>
              <input type={f.type} placeholder={f.placeholder} value={addUserForm[f.key] || ""} onChange={e => setAddUserForm(p => ({ ...p, [f.key]: e.target.value }))} style={inputStyle} onFocus={focusIn} onBlur={focusOut} />
            </Field>
            {/* FIX #29: password validation */}
            {f.key === "password" && addUserForm.password && addUserForm.password.length < 6 && (
              <div style={{ fontSize: 11, color: T.red, marginTop: 4 }}>⚡ Password must be at least 6 characters</div>
            )}
          </div>
        ))}
        {/* Phone with 190+ country codes */}
        <div style={{ gridColumn: "1/-1" }}>
          <Field label="Phone / WhatsApp">
            <div style={{ display: "flex", gap: 8 }}>
              <select value={addUserForm.phoneCode || "+971"} onChange={e => setAddUserForm(p => ({...p, phoneCode: e.target.value, phone: e.target.value + (p.phoneNum||"").replace(/\s/g,"")}))} style={{...inputStyle, width: 200, flexShrink: 0, cursor: "pointer"}}>
                {PHONE_CODES_LIST.map(([c,n]) => <option key={c+n} value={c}>{n} ({c})</option>)}
              </select>
              <input type="tel" placeholder="50 123 4567" value={addUserForm.phoneNum || ""} onChange={e => { const num=e.target.value.replace(/[^\d\s]/g,""); setAddUserForm(p=>({...p,phoneNum:num,phone:(p.phoneCode||"+971")+num.replace(/\s/g,"")})); }} style={{...inputStyle,flex:1}} onFocus={focusIn} onBlur={focusOut} />
            </div>
          </Field>
        </div>
        {/* Country — 190+ countries with flags */}
        <div>
          <Field label="Country">
            <select value={addUserForm.country || ""} onChange={e => setAddUserForm(p => ({...p, country: e.target.value}))} style={{...inputStyle, cursor:"pointer", color: addUserForm.country?"#E2E8F0":"#64748B"}}>
              <option value="">Select Country...</option>
              {["🇦🇫 Afghanistan","🇦🇱 Albania","🇩🇿 Algeria","🇦🇴 Angola","🇦🇷 Argentina","🇦🇲 Armenia","🇦🇺 Australia","🇦🇹 Austria","🇦🇿 Azerbaijan","🇧🇭 Bahrain","🇧🇩 Bangladesh","🇧🇾 Belarus","🇧🇪 Belgium","🇧🇴 Bolivia","🇧🇦 Bosnia","🇧🇷 Brazil","🇧🇳 Brunei","🇧🇬 Bulgaria","🇰🇭 Cambodia","🇨🇲 Cameroon","🇨🇦 Canada","🇨🇱 Chile","🇨🇳 China","🇨🇴 Colombia","🇭🇷 Croatia","🇨🇺 Cuba","🇨🇾 Cyprus","🇨🇿 Czech Republic","🇩🇰 Denmark","🇪🇬 Egypt","🇪🇹 Ethiopia","🇫🇮 Finland","🇫🇷 France","🇬🇪 Georgia","🇩🇪 Germany","🇬🇭 Ghana","🇬🇷 Greece","🇭🇺 Hungary","🇮🇸 Iceland","🇮🇳 India","🇮🇩 Indonesia","🇮🇷 Iran","🇮🇶 Iraq","🇮🇪 Ireland","🇮🇱 Israel","🇮🇹 Italy","🇯🇵 Japan","🇯🇴 Jordan","🇰🇿 Kazakhstan","🇰🇪 Kenya","🇰🇷 Korea South","🇰🇼 Kuwait","🇰🇬 Kyrgyzstan","🇱🇻 Latvia","🇱🇧 Lebanon","🇱🇾 Libya","🇱🇹 Lithuania","🇲🇾 Malaysia","🇲🇻 Maldives","🇲🇹 Malta","🇲🇽 Mexico","🇲🇩 Moldova","🇲🇳 Mongolia","🇲🇦 Morocco","🇲🇿 Mozambique","🇳🇵 Nepal","🇳🇱 Netherlands","🇳🇿 New Zealand","🇳🇬 Nigeria","🇳🇴 Norway","🇴🇲 Oman","🇵🇰 Pakistan","🇵🇸 Palestine","🇵🇦 Panama","🇵🇪 Peru","🇵🇭 Philippines","🇵🇱 Poland","🇵🇹 Portugal","🇶🇦 Qatar","🇷🇴 Romania","🇷🇺 Russia","🇷🇼 Rwanda","🇸🇦 Saudi Arabia","🇸🇳 Senegal","🇷🇸 Serbia","🇸🇬 Singapore","🇸🇰 Slovakia","🇸🇮 Slovenia","🇸🇴 Somalia","🇿🇦 South Africa","🇸🇸 South Sudan","🇪🇸 Spain","🇱🇰 Sri Lanka","🇸🇩 Sudan","🇸🇪 Sweden","🇨🇭 Switzerland","🇸🇾 Syria","🇹🇼 Taiwan","🇹🇯 Tajikistan","🇹🇿 Tanzania","🇹🇭 Thailand","🇹🇳 Tunisia","🇹🇷 Turkey","🇹🇲 Turkmenistan","🇺🇬 Uganda","🇺🇦 Ukraine","🇦🇪 UAE","🇬🇧 United Kingdom","🇺🇸 United States","🇺🇾 Uruguay","🇺🇿 Uzbekistan","🇻🇪 Venezuela","🇻🇳 Vietnam","🇾🇪 Yemen","🇿🇲 Zambia","🇿🇼 Zimbabwe","🌍 Other"].sort().map(c => <option key={c} value={c.split(" ").slice(1).join(" ")}>{c}</option>)}
            </select>
          </Field>
        </div>
        <div><Field label="Access Tier"><select value={addUserForm.tier || "free"} onChange={e => setAddUserForm(p => ({ ...p, tier: e.target.value }))} style={{ ...inputStyle, cursor: "pointer" }}>
          {BILLING_TIERS.map(r => <option key={r.value} value={r.value}>{r.label}{r.price ? ` · ${r.price}` : ""}</option>)}
        </select></Field></div>
        <div style={{ gridColumn: "1 / -1" }}><Field label="Job Role"><select value={addUserForm.role || "user"} onChange={e => setAddUserForm(p => ({ ...p, role: e.target.value }))} style={{ ...inputStyle, cursor: "pointer" }}>
          <option value="user">— No role assigned —</option>
          {JOB_ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select></Field></div>
        <div style={{ gridColumn: "1 / -1" }}><Field label="Admin Notes"><textarea placeholder="Internal notes..." value={addUserForm.notes || ""} onChange={e => setAddUserForm(p => ({ ...p, notes: e.target.value }))} style={{ ...inputStyle, minHeight: 60, resize: "vertical" }} /></Field></div>
      </div>
      {addUserForm.email && users.some(u => u.email && u.email.toLowerCase() === addUserForm.email.toLowerCase()) && (
        <div style={{ marginTop: 12, padding: "10px 14px", borderRadius: 8, background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.3)", display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 14 }}>⚠️</span>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#F59E0B" }}>Email already exists</div>
            <div style={{ fontSize: 11, color: T.textMuted }}>A user with this email is already registered.</div>
          </div>
        </div>
      )}
      <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
        <BtnGhost onClick={() => setShowAddUser(false)} style={{ flex: 1 }}>Cancel</BtnGhost>
        <Btn onClick={addUserManually} disabled={addUserLoading || (addUserForm.password && addUserForm.password.length < 6)} color={T.gold} style={{ flex: 2, color: T.bg }}>{addUserLoading ? "Creating..." : "Create User"}</Btn>
      </div>
    </Modal>
  );

  /* ── BULK IMPORT MODAL ── */
  const BulkImportModal = () => showBulkImport && (
    <Modal onClose={() => { setShowBulkImport(false); setBulkImportData([]); }} maxWidth={700}>
      <ModalHeader title="Bulk Import Users" sub="Upload a CSV file to import multiple users at once" onClose={() => { setShowBulkImport(false); setBulkImportData([]); }} />
      <div style={{ background: "rgba(20,184,166,0.06)", border: "1px solid rgba(20,184,166,0.2)", borderRadius: 10, padding: "12px 16px", marginBottom: 18 }}>
        <div style={{ fontSize: 12, color: T.teal, fontWeight: 600, marginBottom: 6 }}>CSV Format Required:</div>
        <div style={{ fontSize: 11, color: T.textMuted, fontFamily: "monospace", background: "rgba(0,0,0,0.2)", padding: "8px 12px", borderRadius: 6 }}>
          name,email,phone,tier,country<br/>
          John Smith,john@email.com,+971501234567,pro,UAE<br/>
          Jane Doe,jane@email.com,+971509876543,free,UK
        </div>
        <div style={{ fontSize: 10, color: T.textMuted, marginTop: 8 }}>
          Valid tiers: free, pro_trial, pro, enterprise · Password will be auto-generated and emailed
        </div>
      </div>
      
      {bulkImportData.length === 0 ? (
        <div style={{ border: `2px dashed ${T.border}`, borderRadius: 12, padding: "40px 20px", textAlign: "center", background: T.surfaceAlt }}>
          <input type="file" accept=".csv" id="csvUpload" style={{ display: "none" }} onChange={e => {
            const file = e.target.files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (ev) => {
              const text = ev.target?.result;
              if (!text) return;
              const lines = text.split("
").filter(l => l.trim());
              const headers = lines[0].toLowerCase().split(",").map(h => h.trim());
              const parsed = [];
              for (let i = 1; i < lines.length; i++) {
                const vals = lines[i].split(",").map(v => v.trim().replace(/^"|"$/g, ""));
                if (vals.length < 2) continue;
                const row = {};
                headers.forEach((h, idx) => { row[h] = vals[idx] || ""; });
                if (row.email) parsed.push({ ...row, valid: row.email.includes("@"), imported: false });
              }
              setBulkImportData(parsed);
            };
            reader.readAsText(file);
          }} />
          <label htmlFor="csvUpload" style={{ cursor: "pointer" }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>📄</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: T.white, marginBottom: 4 }}>Drop CSV file or click to upload</div>
            <div style={{ fontSize: 12, color: T.textMuted }}>Supports .csv files up to 1000 rows</div>
          </label>
        </div>
      ) : (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.white }}>{bulkImportData.length} users parsed</div>
            <div style={{ display: "flex", gap: 8 }}>
              <span style={{ fontSize: 11, color: T.green }}>{bulkImportData.filter(r => r.valid && !r.imported).length} valid</span>
              <span style={{ fontSize: 11, color: T.red }}>{bulkImportData.filter(r => !r.valid).length} invalid</span>
              <span style={{ fontSize: 11, color: T.teal }}>{bulkImportData.filter(r => r.imported).length} imported</span>
            </div>
          </div>
          <div style={{ maxHeight: 280, overflowY: "auto", border: `1px solid ${T.border}`, borderRadius: 10 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
              <thead><tr style={{ background: T.surfaceAlt }}>
                <th style={{ padding: "8px 10px", textAlign: "left", color: T.textMuted, fontWeight: 600 }}>Name</th>
                <th style={{ padding: "8px 10px", textAlign: "left", color: T.textMuted, fontWeight: 600 }}>Email</th>
                <th style={{ padding: "8px 10px", textAlign: "left", color: T.textMuted, fontWeight: 600 }}>Tier</th>
                <th style={{ padding: "8px 10px", textAlign: "center", color: T.textMuted, fontWeight: 600 }}>Status</th>
              </tr></thead>
              <tbody>
                {bulkImportData.map((row, i) => (
                  <tr key={i} style={{ borderTop: `1px solid ${T.border}` }}>
                    <td style={{ padding: "8px 10px", color: T.white }}>{row.name || "—"}</td>
                    <td style={{ padding: "8px 10px", color: row.valid ? T.textSecondary : T.red }}>{row.email}</td>
                    <td style={{ padding: "8px 10px" }}><span style={{ padding: "2px 8px", borderRadius: 4, fontSize: 10, fontWeight: 600, background: row.tier === "pro" ? `${T.gold}20` : row.tier === "enterprise" ? `${T.purple}20` : `${T.textMuted}20`, color: row.tier === "pro" ? T.gold : row.tier === "enterprise" ? T.purple : T.textMuted }}>{row.tier || "free"}</span></td>
                    <td style={{ padding: "8px 10px", textAlign: "center" }}>{row.imported ? <span style={{ color: T.green }}>✔</span> : row.valid ? <span style={{ color: T.textMuted }}>—</span> : <span style={{ color: T.red }}></span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
      
      <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
        <BtnGhost onClick={() => { setShowBulkImport(false); setBulkImportData([]); }} style={{ flex: 1 }}>Cancel</BtnGhost>
        {bulkImportData.length > 0 && (
          <BtnGhost onClick={() => setBulkImportData([])} style={{ flex: 1 }}>Clear</BtnGhost>
        )}
        <Btn 
          onClick={async () => {
            if (setBulkImportLoading) setBulkImportLoading(true);
            const validRows = bulkImportData.filter(r => r.valid && !r.imported);
            for (const row of validRows) {
              try {
                const uid = `imported_${Date.now()}_${Math.random().toString(36).slice(2)}`;
                await setDoc(doc(db, "users", uid), {
                  uid, name: row.name || "", email: row.email, phone: row.phone || "",
                  tier: row.tier || "free", country: row.country || "",
                  createdAt: new Date().toISOString(), source: "bulk_import"
                });
                row.imported = true;
                setBulkImportData([...bulkImportData]);
              } catch(e) { console.error("Import error:", e); }
            }
            if (setBulkImportLoading) setBulkImportLoading(false);
            notify(`Imported ${validRows.length} users`);
            fetchUsers();
          }} 
          disabled={bulkImportLoading || bulkImportData.filter(r => r.valid && !r.imported).length === 0} 
          color={T.teal} 
          style={{ flex: 2 }}>
          {bulkImportLoading ? "Importing..." : `Import ${bulkImportData.filter(r => r.valid && !r.imported).length} Users`}
        </Btn>
      </div>
    </Modal>
  );

  const EditUserModal = () => !editingUser ? null : (
    <Modal onClose={() => setEditingUser(null)} maxWidth={520}>
      <ModalHeader title="Edit User" sub={editingUser.email} onClose={() => setEditingUser(null)} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div style={{ gridColumn: "1 / -1" }}><Field label="Full Name"><input type="text" placeholder="Full name" value={editUserForm.name || ""} onChange={e => setEditUserForm(p => ({ ...p, name: e.target.value }))} style={inputStyle} onFocus={focusIn} onBlur={focusOut} /></Field></div>
        <div style={{ gridColumn: "1 / -1" }}><Field label="Phone / WhatsApp">
            <div style={{ display: "flex", gap: 8 }}>
              <select value={editUserForm.phoneCode || "+971"} onChange={e => setEditUserForm(p => ({...p, phoneCode: e.target.value, phone: e.target.value + (p.phoneNum||"").replace(/\s/g,"")}))} style={{...inputStyle, width: 200, flexShrink: 0, cursor: "pointer"}}>
                {PHONE_CODES_LIST.map(([c,n]) => <option key={c+n} value={c}>{n} ({c})</option>)}
              </select>
              <input type="tel" placeholder="50 123 4567" value={editUserForm.phoneNum || ""} onChange={e => { const num=e.target.value.replace(/[^\d\s]/g,""); setEditUserForm(p=>({...p,phoneNum:num,phone:(p.phoneCode||"+971")+num.replace(/\s/g,"")})); }} style={{...inputStyle,flex:1}} onFocus={focusIn} onBlur={focusOut} />
            </div>
          </Field></div>
        <Field label="Country"><select value={editUserForm.country || ""} onChange={e => setEditUserForm(p => ({ ...p, country: e.target.value }))} style={{ ...inputStyle, cursor: "pointer" }}>
          <option value="">Select Country...</option>
          {["🇦🇫 Afghanistan","🇦🇱 Albania","🇩🇿 Algeria","🇦🇴 Angola","🇦🇷 Argentina","🇦🇲 Armenia","🇦🇺 Australia","🇦🇹 Austria","🇦🇿 Azerbaijan","🇧🇭 Bahrain","🇧🇩 Bangladesh","🇧🇾 Belarus","🇧🇪 Belgium","🇧🇴 Bolivia","🇧🇦 Bosnia","🇧🇷 Brazil","🇧🇳 Brunei","🇧🇬 Bulgaria","🇰🇭 Cambodia","🇨🇲 Cameroon","🇨🇦 Canada","🇨🇱 Chile","🇨🇳 China","🇨🇴 Colombia","🇭🇷 Croatia","🇨🇺 Cuba","🇨🇾 Cyprus","🇨🇿 Czech Republic","🇩🇰 Denmark","🇪🇬 Egypt","🇪🇹 Ethiopia","🇫🇮 Finland","🇫🇷 France","🇬🇪 Georgia","🇩🇪 Germany","🇬🇭 Ghana","🇬🇷 Greece","🇭🇺 Hungary","🇮🇸 Iceland","🇮🇳 India","🇮🇩 Indonesia","🇮🇷 Iran","🇮🇶 Iraq","🇮🇪 Ireland","🇮🇱 Israel","🇮🇹 Italy","🇯🇵 Japan","🇯🇴 Jordan","🇰🇿 Kazakhstan","🇰🇪 Kenya","🇰🇷 Korea South","🇰🇼 Kuwait","🇰🇬 Kyrgyzstan","🇱🇻 Latvia","🇱🇧 Lebanon","🇱🇾 Libya","🇱🇹 Lithuania","🇲🇾 Malaysia","🇲🇻 Maldives","🇲🇹 Malta","🇲🇽 Mexico","🇲🇩 Moldova","🇲🇳 Mongolia","🇲🇦 Morocco","🇲🇿 Mozambique","🇳🇵 Nepal","🇳🇱 Netherlands","🇳🇿 New Zealand","🇳🇬 Nigeria","🇳🇴 Norway","🇴🇲 Oman","🇵🇰 Pakistan","🇵🇸 Palestine","🇵🇦 Panama","🇵🇪 Peru","🇵🇭 Philippines","🇵🇱 Poland","🇵🇹 Portugal","🇶🇦 Qatar","🇷🇴 Romania","🇷🇺 Russia","🇷🇼 Rwanda","🇸🇦 Saudi Arabia","🇸🇳 Senegal","🇷🇸 Serbia","🇸🇬 Singapore","🇸🇰 Slovakia","🇸🇮 Slovenia","🇸🇴 Somalia","🇿🇦 South Africa","🇸🇸 South Sudan","🇪🇸 Spain","🇱🇰 Sri Lanka","🇸🇩 Sudan","🇸🇪 Sweden","🇨🇭 Switzerland","🇸🇾 Syria","🇹🇼 Taiwan","🇹🇯 Tajikistan","🇹🇿 Tanzania","🇹🇭 Thailand","🇹🇳 Tunisia","🇹🇷 Turkey","🇹🇲 Turkmenistan","🇺🇬 Uganda","🇺🇦 Ukraine","🇦🇪 UAE","🇬🇧 United Kingdom","🇺🇸 United States","🇺🇾 Uruguay","🇺🇿 Uzbekistan","🇻🇪 Venezuela","🇻🇳 Vietnam","🇾🇪 Yemen","🇿🇲 Zambia","🇿🇼 Zimbabwe","🌍 Other"].sort().map(c => <option key={c} value={c.split(" ").slice(1).join(" ")}>{c}</option>)}
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
            {["","","","[^]","⚡","","[v]","","",""].map(ic => (
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

  /* ==============================================
     PROFILE DRAWER — rebuilt for professional SaaS quality
  ============================================== */

    /* ==============================================
     LOADING SKELETON — FIX #30
  ============================================== */
  const SkeletonRow = () => (
    <div style={{ display: "grid", gridTemplateColumns: "36px 28px minmax(160px,2fr) minmax(150px,1.5fr) 100px 110px 75px 75px 140px", gap: 6, padding: "12px 16px", borderBottom: `1px solid ${T.border}`, alignItems: "center" }}>
      {[36,28,160,150,100,110,75,75,140].map((w,i) => (
        <div key={i} style={{ height: 12, background: `${T.border}`, borderRadius: 6, opacity: 0.5, width: i < 2 ? w : "100%", animation: "pulse 1.5s ease-in-out infinite", animationDelay: `${i*0.05}s` }} />
      ))}
    </div>
  );

  /* ==============================================
     MAIN RENDER
  ============================================== */
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>

      {/* All modals */}
      <DeleteConfirmModal />
      <SuspendConfirmModal />
      <ExtendConfirmModal />
      <EmailModal />
      <NoteModal />
      <TagsModal />
      {showAddUser && AddUserModal()}
      {editingUser && EditUserModal()}
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
        auditLog={auditLog}
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
                  <span style={{ fontSize: 10, color: isCurrent ? r.color : T.textMuted }}>{r.price || (isCurrent ? "✔" : "")}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* == HEADER == */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ fontFamily: "'Fraunces',serif", fontSize: 26, fontWeight: 800, color: T.white, margin: 0 }}>User Management</h2>
          <p style={{ fontSize: 13, color: T.textMuted, margin: "4px 0 0" }}>
            {total} registered · Live Firestore · {allFiltered.length} shown · <span style={{ color: T.green }}>{activeToday} active today</span>
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {/* Refresh button */}
          <button type="button" onClick={() => { fetchUsers(); notify("Users refreshed"); }} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, padding: "8px 14px", borderRadius: 8, border: `1px solid ${T.gold}`, background: T.goldGlow, color: T.gold, cursor: "pointer", fontFamily: "'Outfit',sans-serif", fontWeight: 600 }}>{I.refresh} Refresh</button>
          <div style={{ position: "relative" }} className="risk-btn-wrap">
            <button type="button" onClick={sendTrialExpiryEmails} disabled={sendingTrialEmails || atRiskCount === 0}
              style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, padding: "8px 14px", borderRadius: 8, border: `1px solid ${atRiskCount > 0 ? T.red + "60" : T.border}`, background: atRiskCount > 0 ? "rgba(239,68,68,0.06)" : "transparent", color: atRiskCount > 0 ? T.red : T.textMuted, cursor: atRiskCount > 0 ? "pointer" : "not-allowed", fontFamily: "'Outfit',sans-serif", fontWeight: 600, opacity: sendingTrialEmails ? 0.6 : 1 }}>
              {sendingTrialEmails ? "Sending..." : `Email At-Risk (${atRiskCount})`}
            </button>
            {atRiskCount > 0 && (
              <div style={{ position: "absolute", top: "calc(100% + 6px)", right: 0, background: T.surface, border: `1px solid ${T.red}30`, borderRadius: 8, padding: "8px 12px", fontSize: 11, color: T.textMuted, whiteSpace: "nowrap", zIndex: 50, pointerEvents: "none", boxShadow: "0 8px 24px rgba(0,0,0,0.4)", opacity: 0, transition: "opacity 0.2s" }} className="risk-tooltip">
                Will email: {atRisk.map(u => u.name || u.email).join(", ")} · {AT_RISK_DAYS} days left
              </div>
            )}
          </div>
          <button type="button" onClick={exportFiltered} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, padding: "8px 14px", borderRadius: 8, border: `1px solid ${T.border}`, background: "transparent", color: T.textSecondary, cursor: "pointer", fontFamily: "'Outfit',sans-serif", fontWeight: 600 }}>{I.download} Export ({allFiltered.length})</button>
          <button type="button" onClick={() => setShowBulkImport && setShowBulkImport(true)} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, padding: "8px 14px", borderRadius: 8, border: `1px solid ${T.teal}40`, background: `${T.teal}10`, color: T.teal, cursor: "pointer", fontFamily: "'Outfit',sans-serif", fontWeight: 600 }}>← Import CSV</button>
          <button type="button" onClick={() => setShowAddUser(true)} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, padding: "8px 16px", borderRadius: 8, border: `1px solid ${T.gold}`, background: T.goldGlow, color: T.gold, cursor: "pointer", fontFamily: "'Outfit',sans-serif", fontWeight: 700 }}>+ Add User <span style={{ fontSize: 10, opacity: 0.6 }}>[N]</span></button>
        </div>
      </div>

      {/* == KPI CARDS — FIX #1, #2, #18 == */}
      <div className="users-kpi-grid" style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 10, marginBottom: 16 }}>
        {[
          { label: "Total",        value: total,          color: T.white,     sub: "All accounts",    border: T.border,         filter: "All",      tip: "Show all users" },
          { label: "Paying",       value: paid,           color: "#10B981",   sub: `AED ${mrr}/mo`,   border: "#10B98125",       filter: "Pro",      tip: "Pro + Enterprise" }, // FIX #2
          { label: "Trial",        value: trial,          color: T.gold,      sub: "7-day trial",     border: `${T.gold}25`,    filter: "Pro Trial", tip: "Active trial users" },
          { label: "Free",         value: free,           color: T.textMuted, sub: "To convert",      border: T.border,         filter: "Free",     tip: "Free tier users" },
          { label: "At Risk",      value: atRiskCount,    color: T.red,       sub: `${AT_RISK_DAYS}d left`, border: `${T.red}25`, filter: "AtRisk", tip: `Trial ending in ${AT_RISK_DAYS} days` }, // FIX #1 + #6
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
            {s.filter && <div style={{ fontSize: 10, color: s.color, marginTop: 3, opacity: tierFilter === s.filter ? 1 : 0.5 }}>{tierFilter === s.filter ? "✔ filtered" : "click to filter"}</div>}
          </div>
        ))}
      </div>

      {/* == CONVERSION FUNNEL — FIX #16 (removed duplicate MRR), #26 == */}
      <div style={{ background: T.surfaceAlt, borderRadius: 14, padding: "16px 20px", border: `1px solid ${T.border}`, marginBottom: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div style={{ fontSize: 11, color: T.textMuted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>Conversion Funnel</div>
          {suspended > 0 && <span style={{ color: T.red, fontSize: 11, fontWeight: 700 }}> {suspended} suspended</span>}
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

      {/* == SAVED VIEWS == */}
      <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: 1, marginRight: 4 }}>Quick Views:</span>
        {[
          { label: "At Risk",      tier: "AtRisk" },    // FIX #3
          { label: "Enterprise",   tier: "Enterprise" },
          { label: "Free Users",   tier: "Free" },
          { label: "Suspended",    tier: "Suspended" },
          { label: " Expired",      tier: "Expired" },
        ].map(v => (
          <button key={v.label} type="button" onClick={() => { setTierFilter(v.tier); setPage(1); }}
            style={{ padding: "5px 12px", borderRadius: 20, border: `1px solid ${tierFilter === v.tier ? T.gold : T.border}`, background: tierFilter === v.tier ? T.goldGlow : "transparent", color: tierFilter === v.tier ? T.gold : T.textMuted, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>
            {v.label}
          </button>
        ))}
        {tierFilter !== "All" && (
          <button type="button" onClick={() => { setTierFilter("All"); setPage(1); }}
            style={{ padding: "5px 12px", borderRadius: 20, border: `1px solid ${T.red}30`, background: "transparent", color: T.red, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}> Clear</button>
        )}
        <div style={{ marginLeft: "auto", fontSize: 10, color: T.textMuted, fontStyle: "italic" }}>
          ←↑ J/K · Enter=open · E=edit · N=new
        </div>
      </div>

      {/* == SEARCH + FILTERS — FIX #32 (active sort badge) == */}
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
            style={{ padding: "9px 16px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.surfaceAlt, color: T.textSecondary, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}> Reset All</button>
        </div>
      )}

      {/* ── BULK ACTIONS — FIX #7: billing tiers only ── */}
      {bulkSel.length > 0 && (
        <div style={{ background: "rgba(212,168,67,0.06)", border: "1px solid rgba(212,168,67,0.25)", borderRadius: 10, padding: "10px 16px", marginBottom: 12, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: T.gold }}>✔ {bulkSel.length} users selected</span>
          <select value={bulkTier} onChange={e => setBulkTier(e.target.value)} style={{ padding: "6px 10px", background: T.bg, border: `1px solid ${T.border}`, borderRadius: 7, color: T.textPrimary, fontSize: 12, fontFamily: "'Outfit',sans-serif", cursor: "pointer", outline: "none" }}>
            <option value="">Change access tier to...</option>
            {BILLING_TIERS.map(r => <option key={r.value} value={r.value}>{r.label}{r.price ? ` · ${r.price}` : ""}</option>)}
          </select>
          <button type="button" onClick={handleBulkAction} disabled={!bulkTier} style={{ padding: "6px 14px", borderRadius: 7, border: "none", background: T.gold, color: T.bg, fontSize: 12, fontWeight: 700, cursor: bulkTier ? "pointer" : "not-allowed", fontFamily: "'Outfit',sans-serif", opacity: bulkTier ? 1 : 0.5 }}>Apply</button>
          <button type="button" onClick={() => {
            const selected = users.filter(u => bulkSel.includes(u.uid) && u.email);
            if (selected.length === 0) { notify("No selected users have email addresses"); return; }
            setShowBulkEmailModal(true); setBulkEmailTargets(selected);
          }} style={{ padding: "6px 14px", borderRadius: 7, border: `1px solid ${T.blue}`, background: "rgba(59,130,246,0.08)", color: T.blue, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>
            ✉️ Email ({users.filter(u => bulkSel.includes(u.uid) && u.email).length})
          </button>
          <button type="button" onClick={() => setBulkSel([])} style={{ padding: "6px 10px", borderRadius: 7, border: `1px solid ${T.border}`, background: "transparent", color: T.textMuted, fontSize: 11, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>Clear</button>
        </div>
      )}
      {/* BULK EMAIL MODAL */}
      {showBulkEmailModal && (
        <Modal onClose={() => { if (!bulkEmailSending) setShowBulkEmailModal(false); }} maxWidth={540}>
          <ModalHeader title="Bulk Email" sub={`Sending to ${bulkEmailTargets.length} user${bulkEmailTargets.length !== 1 ? "s" : ""}`} onClose={() => { if (!bulkEmailSending) setShowBulkEmailModal(false); }} />
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 8 }}>Quick Templates</label>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {[
                  { label: "Trial Expiring", subject: "Your DXB Analytics trial is expiring soon", body: "Hi {name},

Your free trial is expiring soon. Upgrade now to keep full access.

Best regards,
DXB Analytics Team" },
                  { label: "New Feature", subject: "New feature available on DXB Analytics", body: "Hi {name},

We just launched a new feature we think you'll love. Log in to check it out!

Best regards,
DXB Analytics Team" },
                  { label: "Check-in", subject: "How is DXB Analytics working for you?", body: "Hi {name},

We wanted to check in on your experience. Any questions or feedback?

Best regards,
DXB Analytics Team" },
                ].map(t => (
                  <button key={t.label} type="button" onClick={() => { setBulkEmailSubject(t.subject); setBulkEmailBody(t.body); }}
                    style={{ fontSize: 11, padding: "5px 10px", borderRadius: 6, border: `1px solid ${T.border}`, background: T.surfaceAlt, color: T.textSecondary, cursor: "pointer" }}>{t.label}</button>
                ))}
              </div>
            </div>
            <Field label="Subject *">
              <input type="text" placeholder="Email subject..." value={bulkEmailSubject} onChange={e => setBulkEmailSubject(e.target.value)} style={inputStyle} onFocus={focusIn} onBlur={focusOut} />
            </Field>
            <Field label="Message * (use {name} for personalization)">
              <textarea placeholder="Write your message..." value={bulkEmailBody} onChange={e => setBulkEmailBody(e.target.value)} rows={6} style={{ ...inputStyle, resize: "vertical" }} onFocus={focusIn} onBlur={focusOut} />
            </Field>
            {bulkEmailSending && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 11, color: T.textMuted }}>Sending...</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: T.gold }}>{bulkEmailProgress} / {bulkEmailTargets.length}</span>
                </div>
                <div style={{ height: 4, borderRadius: 2, background: T.border }}>
                  <div style={{ height: "100%", borderRadius: 2, background: T.gold, width: `${bulkEmailTargets.length > 0 ? (bulkEmailProgress / bulkEmailTargets.length) * 100 : 0}%`, transition: "width 0.3s" }} />
                </div>
              </div>
            )}
            <div style={{ display: "flex", gap: 10 }}>
              <BtnGhost onClick={() => setShowBulkEmailModal(false)} style={{ flex: 1 }}>Cancel</BtnGhost>
              <Btn disabled={bulkEmailSending || !bulkEmailSubject || !bulkEmailBody} color={T.blue} style={{ flex: 2 }} onClick={async () => {
                if (!bulkEmailSubject || !bulkEmailBody) { notify("Subject and message required"); return; }
                setBulkEmailSending(true); setBulkEmailProgress(0);
                let sent = 0;
                for (const user of bulkEmailTargets) {
                  try {
                    const bodyText = bulkEmailBody.replace(/\{name\}/g, user.name || "there");
                    const html = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px"><div style="border-bottom:2px solid #D4A843;padding-bottom:12px;margin-bottom:20px"><h2 style="color:#D4A843;margin:0">DXB Analytics</h2></div><div style="color:#1E293B;font-size:14px;line-height:1.7;white-space:pre-wrap">${bodyText}</div></div>`;
                    await fetch("https://api.resend.com/emails", {
                      method: "POST",
                      headers: { "Authorization": "Bearer import.meta.env.VITE_RESEND_API_KEY", "Content-Type": "application/json" },
                      body: JSON.stringify({ from: "DXB Analytics <onboarding@resend.dev>", to: user.email, subject: bulkEmailSubject, html }),
                    });
                    sent++;
                  } catch(e) {}
                  setBulkEmailProgress(sent);
                }
                setBulkEmailSending(false);
                notify(`✅ Sent ${sent}/${bulkEmailTargets.length} emails`);
                setShowBulkEmailModal(false); setBulkEmailSubject(""); setBulkEmailBody(""); setBulkEmailTargets([]); setBulkSel([]);
              }}>{bulkEmailSending ? `Sending ${bulkEmailProgress}/${bulkEmailTargets.length}...` : `Send to ${bulkEmailTargets.length} users`}</Btn>
            </div>
          </div>
        </Modal>
      )}

      {/* == DESKTOP TABLE == */}
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
                    {u.emailVerified && <span style={{ fontSize: 9, color: T.green, fontWeight: 700, background: "rgba(16,185,129,0.12)", padding: "1px 5px", borderRadius: 4 }}>✓ Verified</span>}
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

              {/* FIX #19: tier badge has  to signal it's clickable */}
              <div>
                <button type="button"
                  onClick={e => { const rect = e.currentTarget.getBoundingClientRect(); setInlineTierUser({ user: u, x: rect.left, y: rect.bottom + 4 }); }}
                  title="Click to change tier"
                  style={{ fontSize: 10, fontWeight: 700, padding: "4px 9px", borderRadius: 7, background: badge.bg, color: badge.color, border: `1px solid ${badge.color}25`, cursor: "pointer", fontFamily: "'Outfit',sans-serif", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 3 }}>
                  {badge.label}{badge.price ? ` · ${badge.price}` : ""}
                  <span style={{ opacity: 0.6, fontSize: 9 }}></span>
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
                ) : u.tier === "pro" ? <span style={{ fontSize: 10, color: T.green, fontWeight: 600 }}>Active ✔</span>
                  : u.tier === "enterprise" ? <span style={{ fontSize: 10, color: T.teal, fontWeight: 600 }}>Enterprise ✔</span>
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

      {/* == MOBILE CARD VIEW — FIX #22: Edit, Tags, Suspend added == */}
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

      {/* == PAGINATION — FIX #4 == */}
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
          <button type="button" onClick={() => setPage(1)} disabled={page === 1} style={{ padding: "5px 10px", borderRadius: 7, border: `1px solid ${T.border}`, background: "transparent", color: page === 1 ? T.textMuted : T.textSecondary, cursor: page === 1 ? "not-allowed" : "pointer", fontSize: 11, fontFamily: "'Outfit',sans-serif" }}>½</button>
          <button type="button" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ padding: "5px 10px", borderRadius: 7, border: `1px solid ${T.border}`, background: "transparent", color: page === 1 ? T.textMuted : T.textSecondary, cursor: page === 1 ? "not-allowed" : "pointer", fontSize: 11, fontFamily: "'Outfit',sans-serif" }}> Prev</button>
          {Array.from({ length: Math.min(5, totalPages) }, (_, idx) => {
            const p = totalPages <= 5 ? idx + 1 : Math.max(1, Math.min(page - 2, totalPages - 4)) + idx;
            return (
              <button key={p} type="button" onClick={() => setPage(p)}
                style={{ width: 30, height: 30, borderRadius: 7, border: `1px solid ${page === p ? T.gold : T.border}`, background: page === p ? T.goldGlow : "transparent", color: page === p ? T.gold : T.textSecondary, cursor: "pointer", fontSize: 11, fontWeight: page === p ? 700 : 400, fontFamily: "'Outfit',sans-serif" }}>
                {p}
              </button>
            );
          })}
          <button type="button" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ padding: "5px 10px", borderRadius: 7, border: `1px solid ${T.border}`, background: "transparent", color: page === totalPages ? T.textMuted : T.textSecondary, cursor: page === totalPages ? "not-allowed" : "pointer", fontSize: 11, fontFamily: "'Outfit',sans-serif" }}>Next </button>
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

/* =======================================================
   CENTRAL AUDIT INFRASTRUCTURE
   - getAdminIP()   : cached IP fetch from ipify
   - _webhookUrl    : module-level webhook target (set from Firestore)
   - logAudit()     : single write point for ALL audit events
   - checkAlerts()  : suspicious-activity email trigger
   ======================================================= */

let _cachedIP = null;
async function getAdminIP() {
  if (_cachedIP) return _cachedIP;
  try {
    const r = await fetch("https://api.ipify.org?format=json");
    const d = await r.json();
    _cachedIP = d.ip;
    return _cachedIP;
  } catch { return "unknown"; }
}

let _webhookUrl = null;
let _alertThreshold = 10; // tier changes in 5 min before alert fires

export default UsersTab;
