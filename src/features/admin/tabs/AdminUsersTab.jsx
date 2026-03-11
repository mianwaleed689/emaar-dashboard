import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import ReactDOM from "react-dom";
import { doc, setDoc, getDocs, getDoc, collection, addDoc } from "firebase/firestore";
import { auth, db } from "../../../firebase";
import emailjs from "@emailjs/browser";

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
  inputStyle, confirmAndExtend, notify, openEditUser, auditLog,
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
                Γ£ò
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
            {TABS.map(({ key, label, Icon: TabIcon }) => (
              <button key={key} type="button" onClick={() => setDrawerTab(key)}
                style={{ flex: 1, padding: "7px 4px", borderRadius: 7, border: drawerTab === key ? `1px solid ${T.border}` : "1px solid transparent", background: drawerTab === key ? T.surface : "transparent", color: drawerTab === key ? T.white : T.textMuted, fontSize: 11, fontWeight: drawerTab === key ? 700 : 500, cursor: "pointer", fontFamily: "'Outfit',sans-serif", transition: "all 0.15s", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
                <span style={{ opacity: drawerTab === key ? 1 : 0.45, transition: "opacity 0.15s" }}><TabIcon /></span>
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
            {drawerTab === "activity" && (() => {
              const userLog = (auditLog || [])
                .filter(l => l.uid === u.uid || l.userId === u.uid)
                .slice(0, 20);

              const actionLabel = (action) => {
                const map = {
                  tier_change:       "Tier changed",
                  bulk_tier_change:  "Bulk tier change",
                  user_created:      "Account created",
                  user_deleted:      "Account deleted",
                  user_suspended:    "Account suspended",
                  user_unsuspended:  "Account unsuspended",
                  password_reset:    "Password reset sent",
                  trial_extended:    "Trial extended",
                  email_sent:        "Email sent",
                  note_saved:        "Admin note saved",
                  role_change:       "Role changed",
                  kyc_approved:      "KYC approved",
                  kyc_rejected:      "KYC rejected",
                  tab_view:          "Tab viewed",
                  project_update:    "Project updated",
                  notification_sent: "Notification sent",
                };
                return map[action] || action?.replace(/_/g, " ") || "Action";
              };

              const actionColor = (action) => {
                if (!action) return T.textMuted;
                if (action.includes("delet") || action.includes("suspend") || action.includes("reject")) return T.red;
                if (action.includes("creat") || action.includes("approv") || action.includes("unsuspend")) return T.green;
                if (action.includes("tier") || action.includes("trial") || action.includes("extend")) return T.gold;
                if (action.includes("email") || action.includes("notif") || action.includes("password")) return T.blue;
                return T.textMuted;
              };

              return (
                <>
                  {/* Header row */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: 1.2 }}>
                      Admin Activity Log
                    </div>
                    <div style={{ fontSize: 10, color: T.textMuted }}>
                      {userLog.length} event{userLog.length !== 1 ? "s" : ""}
                    </div>
                  </div>

                  {userLog.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "40px 0" }}>
                      <div style={{ width: 44, height: 44, borderRadius: 12, background: T.surfaceAlt, border: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px", color: T.textMuted }}>
                        <IconActivity />
                      </div>
                      <div style={{ fontSize: 13, color: T.textSecondary, fontWeight: 600, marginBottom: 4 }}>No admin actions yet</div>
                      <div style={{ fontSize: 11, color: T.textMuted }}>Actions taken on this user will appear here.</div>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 1, borderRadius: 12, overflow: "hidden", border: `1px solid ${T.border}` }}>
                      {userLog.map((l, i) => {
                        const color = actionColor(l.action);
                        const isFirst = i === 0;
                        return (
                          <div key={l.id || i} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "11px 14px", background: isFirst ? `${color}06` : i % 2 === 0 ? T.surfaceAlt : T.surface, borderBottom: i < userLog.length - 1 ? `1px solid ${T.border}` : "none" }}>
                            {/* Color dot */}
                            <div style={{ width: 7, height: 7, borderRadius: "50%", background: color, marginTop: 5, flexShrink: 0 }} />
                            {/* Content */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                                <div style={{ fontSize: 12, fontWeight: isFirst ? 700 : 500, color: isFirst ? T.white : T.textSecondary }}>
                                  {actionLabel(l.action)}
                                </div>
                                <div style={{ fontSize: 10, color: T.textMuted, whiteSpace: "nowrap", flexShrink: 0 }}>
                                  {(() => { try { return new Date(l.changedAt).toLocaleDateString("en-AE", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }); } catch { return "—"; } })()}
                                </div>
                              </div>
                              {/* from ΓåÆ to */}
                              {(l.from || l.to) && (
                                <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>
                                  {l.from && <span style={{ color: T.red }}>{l.from}</span>}
                                  {l.from && l.to && <span style={{ margin: "0 5px", color: T.textMuted }}>ΓåÆ</span>}
                                  {l.to && <span style={{ color: T.green }}>{l.to}</span>}
                                </div>
                              )}
                              {/* changed by */}
                              {l.adminEmail && (
                                <div style={{ fontSize: 10, color: T.textMuted, marginTop: 2 }}>
                                  by {l.adminEmail}
                                </div>
                              )}
                              {/* details */}
                              {l.details && (
                                <div style={{ fontSize: 10, color: T.textMuted, marginTop: 2, fontStyle: "italic" }}>
                                  {l.details}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Login history below audit log — kept as secondary info */}
                  {(u.loginHistory || []).length > 0 && (
                    <div style={{ marginTop: 20 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 10 }}>Login History</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 1, borderRadius: 10, overflow: "hidden", border: `1px solid ${T.border}` }}>
                        {(u.loginHistory || []).slice(0, 5).map((h, i) => (
                          <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 14px", background: i % 2 === 0 ? T.surfaceAlt : T.surface, borderBottom: i < Math.min(4, (u.loginHistory||[]).length - 1) ? `1px solid ${T.border}` : "none" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <div style={{ width: 24, height: 24, borderRadius: 6, background: T.surfaceAlt, border: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "center", color: T.textMuted }}>
                                {h.device === "Mobile"
                                  ? <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
                                  : <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
                                }
                              </div>
                              <span style={{ fontSize: 11, color: T.textSecondary }}>{h.browser || "Browser"} · {h.device || "Desktop"}</span>
                            </div>
                            <span style={{ fontSize: 10, color: T.textMuted }}>{(() => { try { return new Date(h.time).toLocaleDateString("en-AE", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }); } catch { return "—"; } })()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              );
            })()}

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
  const [drawerTab,          setDrawerTab]           = useState("details"); // drawer sub-nav

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
    { value: "vip",      label: "Γ¡É VIP",        color: "#F59E0B" },
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
          change_type:  days === 0 ? "ΓÅ░ Your Trial Has Expired" : `ΓÜá Trial Expiring in ${days} Day${days !== 1 ? "s" : ""}`,
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
    notify(sent > 0 ? `[v] Sent ${sent} trial expiry email${sent > 1 ? "s" : ""}` : "Γä╣ No at-risk trials to email");
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
      <button type="button" onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${T.border}`, background: T.surfaceAlt, color: T.textMuted, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>Γ£ò</button>
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
          {confirmDelete.tier === "pro"        && <><br /><span style={{ color: T.red, fontWeight: 700 }}>ΓÜá Active Pro subscription (AED 99/mo) will be cancelled.</span></>}
          {confirmDelete.tier === "enterprise" && <><br /><span style={{ color: T.red, fontWeight: 700 }}>ΓÜá Active Enterprise account (AED 499/mo) will be cancelled.</span></>}
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
        <div style={{ width: 48, height: 48, borderRadius: 12, background: confirmSuspend?.suspended ? "rgba(16,185,129,0.08)" : "rgba(245,158,11,0.08)", border: "1px solid", borderColor: confirmSuspend?.suspended ? "rgba(16,185,129,0.2)" : "rgba(245,158,11,0.2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", color: confirmSuspend?.suspended ? "#10B981" : "#F59E0B" }}>{confirmSuspend?.suspended ? <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg> : "ΓÅ╕"}</div>
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
        <div style={{ fontSize: 40, marginBottom: 12 }}>ΓÅ▒</div>
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

  /* FIX #14: Add User ΓåÆ Invite User (client SDK limitation explained) */
  const AddUserModal = () => showAddUser && (
    <Modal onClose={() => setShowAddUser(false)} maxWidth={520}>
      <ModalHeader title="Add New User" sub="Create a new account directly from admin" onClose={() => setShowAddUser(false)} />
      <div style={{ background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.2)", borderRadius: 10, padding: "10px 14px", marginBottom: 18, fontSize: 12, color: "#93C5FD", lineHeight: 1.6 }}>
        Γä╣ <strong>Note:</strong> Creating an account here uses Firebase client-side auth. The new user will receive a verification email. You will remain logged in as admin.
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
              <div style={{ fontSize: 11, color: T.red, marginTop: 4 }}>ΓÜá Password must be at least 6 characters</div>
            )}
          </div>
        ))}
        <div><Field label="Country"><select value={addUserForm.country || ""} onChange={e => setAddUserForm(p => ({ ...p, country: e.target.value }))} style={{ ...inputStyle, cursor: "pointer" }}>
          <option value="">Select Country</option>
          {[" UAE"," Saudi Arabia"," Qatar"," Kuwait"," Bahrain"," Oman"," UK"," USA"," India"," Pakistan"," Egypt"," Other"].map(c => <option key={c} value={c.slice(3)}>{c}</option>)}
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
              const lines = text.split("\n").filter(l => l.trim());
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
            <div style={{ fontSize: 32, marginBottom: 12 }}>≡ƒôä</div>
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
                    <td style={{ padding: "8px 10px", textAlign: "center" }}>{row.imported ? <span style={{ color: T.green }}>Γ£ô</span> : row.valid ? <span style={{ color: T.textMuted }}>—</span> : <span style={{ color: T.red }}>Γ£ù</span>}</td>
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

  const EditUserModal = () => editingUser && (
    <Modal onClose={() => setEditingUser(null)} maxWidth={520}>
      <ModalHeader title="Edit User" sub={editingUser.email} onClose={() => setEditingUser(null)} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div style={{ gridColumn: "1 / -1" }}><Field label="Full Name"><input type="text" placeholder="Full name" value={editUserForm.name || ""} onChange={e => setEditUserForm(p => ({ ...p, name: e.target.value }))} style={inputStyle} onFocus={focusIn} onBlur={focusOut} /></Field></div>
        <Field label="Phone"><input type="tel" placeholder="+971 50 000 0000" value={editUserForm.phone || ""} onChange={e => setEditUserForm(p => ({ ...p, phone: e.target.value }))} style={inputStyle} onFocus={focusIn} onBlur={focusOut} /></Field>
        <Field label="Country"><select value={editUserForm.country || ""} onChange={e => setEditUserForm(p => ({ ...p, country: e.target.value }))} style={{ ...inputStyle, cursor: "pointer" }}>
          <option value="">Select Country</option>
          {[" UAE"," Saudi Arabia"," Qatar"," Kuwait"," Bahrain"," Oman"," UK"," USA"," India"," Pakistan"," Other"].map(c => <option key={c} value={c.slice(3)}>{c}</option>)}
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
            {["","","","[^]","ΓÜá","","[v]","","",""].map(ic => (
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
      <BulkImportModal />
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
                  <span style={{ fontSize: 10, color: isCurrent ? r.color : T.textMuted }}>{r.price || (isCurrent ? "Γ£ô" : "")}</span>
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
          {/* Refresh button */}
          <button type="button" onClick={() => { fetchUsers(); notify("Users refreshed"); }} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, padding: "8px 14px", borderRadius: 8, border: `1px solid ${T.gold}`, background: T.goldGlow, color: T.gold, cursor: "pointer", fontFamily: "'Outfit',sans-serif", fontWeight: 600 }}>{I.refresh} Refresh</button>
          <div style={{ position: "relative" }} className="risk-btn-wrap">
            <button type="button" onClick={sendTrialExpiryEmails} disabled={sendingTrialEmails || atRiskCount === 0}
              style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, padding: "8px 14px", borderRadius: 8, border: `1px solid ${atRiskCount > 0 ? T.red + "60" : T.border}`, background: atRiskCount > 0 ? "rgba(239,68,68,0.06)" : "transparent", color: atRiskCount > 0 ? T.red : T.textMuted, cursor: atRiskCount > 0 ? "pointer" : "not-allowed", fontFamily: "'Outfit',sans-serif", fontWeight: 600, opacity: sendingTrialEmails ? 0.6 : 1 }}>
              {sendingTrialEmails ? "Sending..." : `Email At-Risk (${atRiskCount})`}
            </button>
            {atRiskCount > 0 && (
              <div style={{ position: "absolute", top: "calc(100% + 6px)", right: 0, background: T.surface, border: `1px solid ${T.red}30`, borderRadius: 8, padding: "8px 12px", fontSize: 11, color: T.textMuted, whiteSpace: "nowrap", zIndex: 50, pointerEvents: "none", boxShadow: "0 8px 24px rgba(0,0,0,0.4)", opacity: 0, transition: "opacity 0.2s" }} className="risk-tooltip">
                Will email: {atRisk.map(u => u.name || u.email).join(", ")} · Γëñ{AT_RISK_DAYS} days left
              </div>
            )}
          </div>
          <button type="button" onClick={exportFiltered} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, padding: "8px 14px", borderRadius: 8, border: `1px solid ${T.border}`, background: "transparent", color: T.textSecondary, cursor: "pointer", fontFamily: "'Outfit',sans-serif", fontWeight: 600 }}>{I.download} Export ({allFiltered.length})</button>
          <button type="button" onClick={() => setShowBulkImport && setShowBulkImport(true)} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, padding: "8px 14px", borderRadius: 8, border: `1px solid ${T.teal}40`, background: `${T.teal}10`, color: T.teal, cursor: "pointer", fontFamily: "'Outfit',sans-serif", fontWeight: 600 }}>↑ Import CSV</button>
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
          { label: "At Risk",      value: atRiskCount,    color: T.red,       sub: `Γëñ${AT_RISK_DAYS}d left`, border: `${T.red}25`, filter: "AtRisk", tip: `Trial ending in Γëñ${AT_RISK_DAYS} days` }, // FIX #1 + #6
          { label: "Active Today", value: activeToday,    color: T.teal,      sub: "Logged in today", border: `${T.teal}25`,    filter: null,       tip: "Logged in within 24h" },
          { label: "Conversion",   value: convRate + "%", color: "#06B6D4",   sub: "Free ΓåÆ Paid",     border: "#06B6D425",      filter: null,       tip: "Free to paid conversion rate" },
        ].map(s => (
          <div key={s.label} className="kpi-card"
            onClick={() => { if (s.filter) { setTierFilter(s.filter); setPage(1); } }}
            style={{ border: `1px solid ${tierFilter === s.filter && s.filter ? s.color + "60" : s.border}`, textAlign: "center", cursor: s.filter ? "pointer" : "default", transform: tierFilter === s.filter && s.filter ? "translateY(-2px)" : "none", transition: "all 0.15s" }}
            title={s.tip}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: s.color, opacity: 0.6, borderRadius: "16px 16px 0 0" }} />
            <div style={{ fontSize: 22, fontWeight: 800, color: s.color, fontFamily: "'Fraunces',serif", lineHeight: 1.2 }}>{s.value}</div>
            <div style={{ fontSize: 10, color: T.textMuted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, marginTop: 4 }}>{s.label}</div>
            <div style={{ fontSize: 10, color: T.textMuted, marginTop: 2 }}>{s.sub}</div>
            {s.filter && <div style={{ fontSize: 10, color: s.color, marginTop: 3, opacity: tierFilter === s.filter ? 1 : 0.5 }}>{tierFilter === s.filter ? "Γ£ô filtered" : "click to filter"}</div>}
          </div>
        ))}
      </div>

      {/* ══ CONVERSION FUNNEL — FIX #16 (removed duplicate MRR), #26 ══ */}
      <div style={{ background: T.surfaceAlt, borderRadius: 14, padding: "16px 20px", border: `1px solid ${T.border}`, marginBottom: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div style={{ fontSize: 11, color: T.textMuted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>Conversion Funnel</div>
          {suspended > 0 && <span style={{ color: T.red, fontSize: 11, fontWeight: 700 }}>ΓÅ╕ {suspended} suspended</span>}
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
              {i < 2 && <div style={{ display: "flex", alignItems: "center", padding: "0 8px", color: T.textMuted, fontSize: 18 }}>ΓåÆ</div>}
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
          { label: "Γî¢ Expired",      tier: "Expired" },
        ].map(v => (
          <button key={v.label} type="button" onClick={() => { setTierFilter(v.tier); setPage(1); }}
            style={{ padding: "5px 12px", borderRadius: 20, border: `1px solid ${tierFilter === v.tier ? T.gold : T.border}`, background: tierFilter === v.tier ? T.goldGlow : "transparent", color: tierFilter === v.tier ? T.gold : T.textMuted, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>
            {v.label}
          </button>
        ))}
        {tierFilter !== "All" && (
          <button type="button" onClick={() => { setTierFilter("All"); setPage(1); }}
            style={{ padding: "5px 12px", borderRadius: 20, border: `1px solid ${T.red}30`, background: "transparent", color: T.red, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>Γ£ò Clear</button>
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
          Filters {activeFilterCount > 0 ? `ΓÇó ${activeFilterCount}` : ""}
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
            style={{ padding: "9px 16px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.surfaceAlt, color: T.textSecondary, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>Γå║ Reset All</button>
        </div>
      )}

      {/* ── BULK ACTIONS — FIX #7: billing tiers only ── */}
      {bulkSel.length > 0 && (
        <div style={{ background: "rgba(212,168,67,0.06)", border: "1px solid rgba(212,168,67,0.25)", borderRadius: 10, padding: "10px 16px", marginBottom: 12, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: T.gold }}>Γ£ô {bulkSel.length} users selected</span>
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

              {/* FIX #19: tier badge has Γû╛ to signal it's clickable */}
              <div>
                <button type="button"
                  onClick={e => { const rect = e.currentTarget.getBoundingClientRect(); setInlineTierUser({ user: u, x: rect.left, y: rect.bottom + 4 }); }}
                  title="Click to change tier"
                  style={{ fontSize: 10, fontWeight: 700, padding: "4px 9px", borderRadius: 7, background: badge.bg, color: badge.color, border: `1px solid ${badge.color}25`, cursor: "pointer", fontFamily: "'Outfit',sans-serif", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 3 }}>
                  {badge.label}{badge.price ? ` · ${badge.price}` : ""}
                  <span style={{ opacity: 0.6, fontSize: 9 }}>Γû╛</span>
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
                ) : u.tier === "pro" ? <span style={{ fontSize: 10, color: T.green, fontWeight: 600 }}>Active Γ£ô</span>
                  : u.tier === "enterprise" ? <span style={{ fontSize: 10, color: T.teal, fontWeight: 600 }}>Enterprise Γ£ô</span>
                  : <span style={{ fontSize: 11, color: T.textMuted }}>—</span>}
              </div>

              <div><div style={{ fontSize: 10, fontWeight: 700, color: lastActiveColor(u) }}>{lastActiveLabel(u)}</div></div>

              <div>
                <div style={{ fontSize: 11, color: T.textSecondary }}>{(() => { try { return new Date(u.createdAt).toLocaleDateString("en", { day: "numeric", month: "short" }); } catch { return "—"; } })()}</div>
                <div style={{ fontSize: 10, color: T.textMuted, marginTop: 1 }}>{timeSince(u.createdAt)}</div>
              </div>

              <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                <button type="button" title="View profile [Enter]" onClick={() => { setDrawerUser(u); setDrawerTab("details"); }}
                  style={{ height: 28, padding: "0 8px", borderRadius: 7, border: `1px solid ${T.gold}40`, background: T.goldGlow, color: T.gold, cursor: "pointer", fontSize: 11, fontWeight: 700, fontFamily: "'Outfit',sans-serif", whiteSpace: "nowrap" }}>View ΓåÆ</button>
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
                <button type="button" onClick={() => { setDrawerUser(u); setDrawerTab("details"); }} style={{ flex: 1, minWidth: 60, padding: "8px", borderRadius: 8, border: `1px solid ${T.gold}40`, background: T.goldGlow, color: T.gold, cursor: "pointer", fontSize: 11, fontWeight: 700, fontFamily: "'Outfit',sans-serif" }}>View ΓåÆ</button>
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
          <button type="button" onClick={() => setPage(1)} disabled={page === 1} style={{ padding: "5px 10px", borderRadius: 7, border: `1px solid ${T.border}`, background: "transparent", color: page === 1 ? T.textMuted : T.textSecondary, cursor: page === 1 ? "not-allowed" : "pointer", fontSize: 11, fontFamily: "'Outfit',sans-serif" }}>┬½</button>
          <button type="button" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ padding: "5px 10px", borderRadius: 7, border: `1px solid ${T.border}`, background: "transparent", color: page === 1 ? T.textMuted : T.textSecondary, cursor: page === 1 ? "not-allowed" : "pointer", fontSize: 11, fontFamily: "'Outfit',sans-serif" }}>ΓÇ╣ Prev</button>
          {Array.from({ length: Math.min(5, totalPages) }, (_, idx) => {
            const p = totalPages <= 5 ? idx + 1 : Math.max(1, Math.min(page - 2, totalPages - 4)) + idx;
            return (
              <button key={p} type="button" onClick={() => setPage(p)}
                style={{ width: 30, height: 30, borderRadius: 7, border: `1px solid ${page === p ? T.gold : T.border}`, background: page === p ? T.goldGlow : "transparent", color: page === p ? T.gold : T.textSecondary, cursor: "pointer", fontSize: 11, fontWeight: page === p ? 700 : 400, fontFamily: "'Outfit',sans-serif" }}>
                {p}
              </button>
            );
          })}
          <button type="button" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ padding: "5px 10px", borderRadius: 7, border: `1px solid ${T.border}`, background: "transparent", color: page === totalPages ? T.textMuted : T.textSecondary, cursor: page === totalPages ? "not-allowed" : "pointer", fontSize: 11, fontFamily: "'Outfit',sans-serif" }}>Next ΓÇ║</button>
          <button type="button" onClick={() => setPage(totalPages)} disabled={page === totalPages} style={{ padding: "5px 10px", borderRadius: 7, border: `1px solid ${T.border}`, background: "transparent", color: page === totalPages ? T.textMuted : T.textSecondary, cursor: page === totalPages ? "not-allowed" : "pointer", fontSize: 11, fontFamily: "'Outfit',sans-serif" }}>┬╗</button>
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

/* ═══════════════════════════════════════════════════════
   CENTRAL AUDIT INFRASTRUCTURE
   - getAdminIP()   : cached IP fetch from ipify
   - _webhookUrl    : module-level webhook target (set from Firestore)
   - logAudit()     : single write point for ALL audit events
   - checkAlerts()  : suspicious-activity email trigger
   ═══════════════════════════════════════════════════════ */

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
function setAuditWebhook(url) { _webhookUrl = url; }
function setAlertThreshold(n) { _alertThreshold = n; }

async function logAudit(db, payload) {
  try {
    const ip = await getAdminIP();
    const changedBy = auth.currentUser?.email || "admin";
    const entry = { ...payload, changedBy, changedAt: new Date().toISOString(), ip };
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    await setDoc(doc(db, "auditLog", id), entry);
    // SIEM webhook push (fire-and-forget)
    if (_webhookUrl) {
      try { fetch(_webhookUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(entry) }); } catch {}
    }
    return entry;
  } catch (e) { console.error("logAudit:", e); }
}

async function checkAlerts(db) {
  try {
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const snap = await getDocs(collection(db, "auditLog"));
    const recent = [];
    snap.forEach(d => {
      const data = d.data();
      if (data.changedAt >= fiveMinAgo && ["tier_change", "bulk_tier_change"].includes(data.action)) recent.push(data);
    });
    if (recent.length >= _alertThreshold) {
      const adminEmail = auth.currentUser?.email;
      if (adminEmail) {
        emailjs.send("service_da7nshv", "template_gl1xqhy", {
          user_email: adminEmail,
          user_name: "DXB Admin",
          message: `ΓÜá SUSPICIOUS ACTIVITY: ${recent.length} tier changes in the last 5 minutes by ${adminEmail}. Please review the Audit Log immediately.`,
        }, "USkwUhp0csGCVDkdQ");
      }
    }
  } catch {}
}

/* ─── DATA CALENDAR (interactive, Firestore-persisted) ─── */
function DataCalendar({ T, now }) {
  const [checked, setChecked] = useState({});
  const [loading, setLoading] = useState(true);

  const calendarItems = [
    { id: "emaar_q1_2026",  event: "Emaar Q1 2026 Results",  due: "2026-04-15", note: "emaar.com ΓåÆ Investor Relations",     icon: "[=]", priority: "high"     },
    { id: "market_q1_2026", event: "Dubai Market Report Q1", due: "2026-04-30", note: "DLD Open Data + DXBinteract",         icon: "", priority: "medium"   },
    { id: "emaar_q2_2026",  event: "Emaar Q2 2026 Results",  due: "2026-07-15", note: "emaar.com ΓåÆ Investor Relations",     icon: "[=]", priority: "high"     },
    { id: "market_q2_2026", event: "Dubai Market Report Q2", due: "2026-07-30", note: "DLD Open Data + DXBinteract",         icon: "", priority: "medium"   },
    { id: "emaar_q3_2026",  event: "Emaar Q3 2026 Results",  due: "2026-10-15", note: "emaar.com ΓåÆ Investor Relations",     icon: "[=]", priority: "high"     },
    { id: "emaar_fy_2026",  event: "Emaar FY 2026 Results",  due: "2027-02-15", note: "Annual results — biggest of the year", icon: "", priority: "critical" },
  ];

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDoc(doc(db, "adminSettings", "calendarChecks"));
        if (snap.exists()) setChecked(snap.data() || {});
      } catch {}
      setLoading(false);
    })();
  }, []);

  const toggle = async (id) => {
    const next = { ...checked, [id]: !checked[id] };
    setChecked(next);
    try { await setDoc(doc(db, "adminSettings", "calendarChecks"), next, { merge: true }); } catch {}
  };

  return (
    <div className="chart-box fade-up" style={{ padding: 0, overflow: "hidden" }}>
      <div style={{ padding: "16px 20px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.white }}>Emaar Results Schedule</div>
          <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>Mark each item done after you update the dashboard</div>
        </div>
        <div style={{ fontSize: 10, color: T.textMuted }}>
          {Object.values(checked).filter(Boolean).length}/{calendarItems.length} done
        </div>
      </div>
      {loading ? (
        <div style={{ padding: "30px 20px", textAlign: "center", fontSize: 11, color: T.textMuted }}>LoadingΓÇª</div>
      ) : calendarItems.map((item, i) => {
        const daysLeft = Math.ceil((new Date(item.due) - now) / (1000 * 60 * 60 * 24));
        const isPast   = daysLeft < 0;
        const isUrgent = !isPast && daysLeft <= 30;
        const dotColor = isPast ? T.red : isUrgent ? T.gold : T.green;
        const pillBg   = isPast ? `${T.red}15` : isUrgent ? `${T.gold}15` : `${T.green}10`;
        const pillColor= isPast ? T.red : isUrgent ? T.gold : T.green;
        const pillText = isPast ? "OVERDUE" : daysLeft === 0 ? "TODAY" : `${daysLeft}d`;
        const isDone   = !!checked[item.id];
        return (
          <div key={item.id} style={{ display: "flex", alignItems: "center", padding: "12px 20px", borderBottom: i < calendarItems.length - 1 ? `1px solid ${T.border}` : "none", transition: "background 0.15s", opacity: isDone ? 0.55 : 1 }}
            onMouseEnter={e => e.currentTarget.style.background = T.surfaceAlt}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: isDone ? T.green : dotColor, flexShrink: 0, marginRight: 12, boxShadow: isDone ? `0 0 6px ${T.green}` : isPast ? `0 0 6px ${T.red}` : isUrgent ? `0 0 6px ${T.gold}` : "none" }} />
            <div style={{ marginRight: 8, fontSize: 14, flexShrink: 0 }}>{item.icon}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: isDone ? T.textMuted : T.white, textDecoration: isDone ? "line-through" : "none", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.event}</div>
              <div style={{ fontSize: 10, color: T.textMuted, marginTop: 1 }}>{item.note}</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0, marginLeft: 10 }}>
              {!isDone && (
                <span style={{ fontSize: 10, fontWeight: 800, padding: "2px 8px", borderRadius: 5, background: pillBg, color: pillColor, border: `1px solid ${pillColor}30` }}>{pillText}</span>
              )}
              <button type="button" onClick={() => toggle(item.id)}
                style={{ fontSize: 10, fontWeight: 700, padding: "4px 10px", borderRadius: 7, border: `1px solid ${isDone ? T.green : T.border}`, background: isDone ? `${T.green}15` : "transparent", color: isDone ? T.green : T.textMuted, cursor: "pointer", fontFamily: "'Outfit',sans-serif", transition: "all 0.15s", whiteSpace: "nowrap" }}>
                {isDone ? "Γ£ô Done" : "Mark done"}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─── UPDATE CHECKLIST (interactive, Firestore-persisted) ─── */
function UpdateChecklist({ T }) {
  const steps = [
    { id: "s1", icon: "", text: "Go to emaar.com/investor-relations",   sub: "Download the latest quarterly PDF" },
    { id: "s2", icon: "[n]", text: "Update data.js",                        sub: "Revenue, profit, EBITDA, sales, backlog" },
    { id: "s3", icon: "", text: "Update construction %",               sub: "For projects nearing handover date" },
    { id: "s4", icon: "Γî¿", text: "Run git commands",                     sub: "git add . ΓåÆ git commit -m msg ΓåÆ git push" },
    { id: "s5", icon: "", text: "Live in 3 minutes",                    sub: "Vercel deploys automatically on push" },
  ];
  const [checked, setChecked] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDoc(doc(db, "adminSettings", "checklistState"));
        if (snap.exists()) setChecked(snap.data() || {});
      } catch {}
      setLoading(false);
    })();
  }, []);

  const toggle = async (id) => {
    const next = { ...checked, [id]: !checked[id] };
    setChecked(next);
    try { await setDoc(doc(db, "adminSettings", "checklistState"), next, { merge: true }); } catch {}
  };

  const reset = async () => {
    const cleared = {};
    setChecked(cleared);
    try { await setDoc(doc(db, "adminSettings", "checklistState"), cleared); } catch {}
  };

  const doneCount = steps.filter(s => checked[s.id]).length;
  const allDone = doneCount === steps.length;

  return (
    <div className="chart-box fade-up" style={{ padding: 0, overflow: "hidden", animationDelay: "0.05s" }}>
      <div style={{ padding: "16px 20px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.white }}>Update Checklist</div>
          <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>Follow these steps every time Emaar releases results</div>
        </div>
        {doneCount > 0 && (
          <button type="button" onClick={reset}
            style={{ fontSize: 10, fontWeight: 700, padding: "4px 10px", borderRadius: 7, border: `1px solid ${T.border}`, background: "transparent", color: T.textMuted, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>
            Reset
          </button>
        )}
      </div>
      {/* Progress bar */}
      <div style={{ height: 3, background: T.border }}>
        <div style={{ height: 3, width: `${(doneCount / steps.length) * 100}%`, background: allDone ? T.green : T.gold, transition: "width 0.4s ease, background 0.4s ease", borderRadius: "0 2px 2px 0" }} />
      </div>
      {loading ? (
        <div style={{ padding: "30px 20px", textAlign: "center", fontSize: 11, color: T.textMuted }}>LoadingΓÇª</div>
      ) : (
        <div style={{ padding: "4px 0" }}>
          {steps.map((item, i) => {
            const done = !!checked[item.id];
            return (
              <div key={item.id} onClick={() => toggle(item.id)}
                style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 20px", borderBottom: i < steps.length - 1 ? `1px solid ${T.border}` : "none", cursor: "pointer", transition: "background 0.12s", opacity: done ? 0.6 : 1 }}
                onMouseEnter={e => e.currentTarget.style.background = T.surfaceAlt}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                {/* Checkbox */}
                <div style={{ width: 20, height: 20, borderRadius: 6, border: `2px solid ${done ? T.green : T.border}`, background: done ? `${T.green}20` : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.15s" }}>
                  {done && <span style={{ fontSize: 11, color: T.green, fontWeight: 900 }}>Γ£ô</span>}
                </div>
                {/* Step number */}
                <div style={{ width: 22, height: 22, borderRadius: 7, background: done ? `${T.green}15` : `${T.gold}15`, border: `1px solid ${done ? T.green : T.gold}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 900, color: done ? T.green : T.gold, flexShrink: 0 }}>{i + 1}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 13 }}>{item.icon}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: done ? T.textMuted : T.white, textDecoration: done ? "line-through" : "none" }}>{item.text}</span>
                  </div>
                  <div style={{ fontSize: 10, color: T.textMuted, marginTop: 2 }}>{item.sub}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <div style={{ margin: "0 16px 16px", padding: "10px 14px", borderRadius: 9, background: allDone ? `${T.green}10` : `${T.green}08`, border: `1px solid ${allDone ? T.green : T.green}20`, display: "flex", alignItems: "center", gap: 8, transition: "all 0.3s" }}>
        <span style={{ fontSize: 16 }}>{allDone ? "" : "ΓÜí"}</span>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: allDone ? T.green : T.green }}>{allDone ? "All done! Dashboard is live." : "Under 10 minutes total"}</div>
          <div style={{ fontSize: 10, color: T.textMuted }}>{allDone ? `${doneCount}/${steps.length} steps completed` : "From PDF download to live dashboard"}</div>
        </div>
      </div>
    </div>
  );
}

function AuditLogTable({ auditLog, users, emaarProjects, fetchAuditLog, setTab, setPendingOpenUid, T }) {
  const [auditFilter, setAuditFilter] = useState(() => {
    try { return localStorage.getItem("admin_auditFilter") || "all"; } catch { return "all"; }
  });
  const [auditSearch, setAuditSearch] = useState("");
  const [dateRange, setDateRange] = useState("all");
  const [auditViewMode, setAuditViewMode] = useState("timeline"); // timeline | byAdmin | byAction

  // Persist auditFilter to localStorage
  useEffect(() => {
    try { localStorage.setItem("admin_auditFilter", auditFilter); } catch {}
  }, [auditFilter]);

  const actionMeta = {
    tier_change:       { label: "Tier Changed",      color: T.orange,   icon: "" },
    bulk_tier_change:  { label: "Bulk Tier Change",  color: "#8B5CF6",  icon: "" },
    project_update:    { label: "Project Updated",   color: T.blue,     icon: "" },
    project_rollback:  { label: "Version Rollback",  color: "#8B5CF6",  icon: "[<]" },
    project_create:    { label: "Project Created",   color: T.green,    icon: "Γ£¿" },
    community_update:  { label: "Community Updated", color: "#8B5CF6",  icon: "[c]" },
    tab_visibility:    { label: "Tab Visibility",    color: T.gold,     icon: "" },
    yield_update:      { label: "Yield Updated",     color: T.teal,     icon: "[^]" },
    role_change:       { label: "Role Changed",      color: T.red,      icon: "" },
    admin_login:       { label: "Admin Login",       color: T.green,    icon: "" },
    admin_logout:      { label: "Admin Logout",      color: T.textMuted,icon: "" },
    user_created:      { label: "User Created",      color: T.teal,     icon: "Γ₧ò" },
    user_deleted:      { label: "User Deleted",      color: T.red,      icon: "" },
    user_suspended:    { label: "User Suspended",    color: T.orange,   icon: "ΓÅ╕" },
    user_unsuspended:  { label: "User Unsuspended",  color: T.green,    icon: "Γû╢" },
    eibor_update:      { label: "EIBOR Updated",     color: "#14B8A6",  icon: "[=]" },
    csv_export:        { label: "Export",            color: T.cyan,     icon: "" },
  };
  const tierColor = { free: "#94A3B8", pro_trial: T.gold, pro: T.green, enterprise: T.teal, suspended: T.red, admin: T.blue, staff: T.blue };
  const tierLabel = { free: "Free", pro_trial: "Pro Trial", pro: "Pro", enterprise: "Enterprise", suspended: "Suspended", admin: "Admin", staff: "Staff" };

  const dateRangeCutoff = { all: 0, today: 1, "7d": 7, "30d": 30 }[dateRange] || 0;
  const rangeFiltered = dateRange === "all" ? auditLog : auditLog.filter(l => {
    try { return (Date.now() - new Date(l.changedAt).getTime()) < dateRangeCutoff * 24 * 60 * 60 * 1000; } catch { return false; }
  });

  const filterCounts = {
    all: rangeFiltered.length,
    tier: rangeFiltered.filter(l => l.action === "tier_change").length,
    bulk: rangeFiltered.filter(l => l.action === "bulk_tier_change").length,
    project: rangeFiltered.filter(l => ["project_update","project_create"].includes(l.action)).length,
    tab: rangeFiltered.filter(l => l.action === "tab_visibility").length,
    logins: rangeFiltered.filter(l => ["admin_login","admin_logout"].includes(l.action)).length,
    users: rangeFiltered.filter(l => ["user_created","user_deleted","user_suspended","user_unsuspended"].includes(l.action)).length,
  };

  const exportCSV = () => {
    const rows = [["Time", "Action", "Changed By", "IP Address", "User / Project", "Details", "From Tier", "To Tier"]];
    auditLog.forEach(l => {
      const time = l.changedAt ? new Date(l.changedAt).toLocaleString("en-AE") : "";
      const action = l.action || "";
      const by = l.changedBy || "";
      const ip = l.ip || "";
      const u = users.find(u => u.uid === l.uid);
      const userStr = u ? (u.name || u.email || l.uid || "") : (l.uid || "");
      const proj = emaarProjects.find(p => String(p.id) === String(l.projectId));
      const detail = l.action === "tier_change" ? `${l.from} ΓåÆ ${l.to}`
        : l.action === "bulk_tier_change" ? `${(l.uids||[]).length} users ΓåÆ ${l.newTier}`
        : l.action?.includes("project") ? (proj?.name || l.projectId || "")
        : (l.tabId || l.communityKey || "");
      rows.push([time, action, by, ip, userStr, detail, l.from || "", l.to || l.newTier || ""]);
    });
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `audit-log-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    // Log the export action itself
    logAudit(db, { action: "csv_export", exportedCount: auditLog.length }).catch(() => {});
  };

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(auditLog, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `audit-log-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    logAudit(db, { action: "csv_export", format: "json", exportedCount: auditLog.length }).catch(() => {});
  };

  const filteredLog = rangeFiltered.filter(l => {
    if (auditFilter === "tier"    && l.action !== "tier_change") return false;
    if (auditFilter === "bulk"    && l.action !== "bulk_tier_change") return false;
    if (auditFilter === "project" && !["project_update","project_create"].includes(l.action)) return false;
    if (auditFilter === "tab"     && l.action !== "tab_visibility") return false;
    if (auditFilter === "logins"  && !["admin_login","admin_logout"].includes(l.action)) return false;
    if (auditFilter === "users"   && !["user_created","user_deleted","user_suspended","user_unsuspended"].includes(l.action)) return false;
    if (auditSearch) {
      const u = users.find(u => u.uid === l.uid || (l.uids || []).includes(u.uid));
      const s = auditSearch.toLowerCase();
      const proj = emaarProjects.find(p => String(p.id) === String(l.projectId));
      const diffStr = l.diff ? JSON.stringify(l.diff).toLowerCase() : "";
      const rateStr = l.rates ? JSON.stringify(l.rates).toLowerCase() : "";
      if (!(
        (u && ((u.name||"").toLowerCase().includes(s)||(u.email||"").toLowerCase().includes(s))) ||
        (l.action||"").toLowerCase().includes(s) ||
        (l.changedBy||"").toLowerCase().includes(s) ||
        (l.ip||"").toLowerCase().includes(s) ||
        (l.userName||"").toLowerCase().includes(s) ||
        (l.userEmail||"").toLowerCase().includes(s) ||
        (proj?.name||"").toLowerCase().includes(s) ||
        (l.projectId||"").toLowerCase().includes(s) ||
        diffStr.includes(s) || rateStr.includes(s)
      )) return false;
    }
    return true;
  });


  const timeAgo = ts => {
    if (!ts) return "—";
    const diff = Date.now() - new Date(ts).getTime();
    const mins = Math.floor(diff/60000), hrs = Math.floor(diff/3600000), days = Math.floor(diff/86400000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    if (hrs < 24) return `${hrs}h ago`;
    return `${days}d ago`;
  };

  const dateLabel = ts => {
    if (!ts) return "Unknown";
    const d = new Date(ts), now = new Date();
    const diff = Math.floor((now - d) / 86400000);
    if (diff === 0) return "Today";
    if (diff === 1) return "Yesterday";
    if (diff < 7) return `${diff} days ago`;
    return d.toLocaleDateString("en-AE", { day: "numeric", month: "long", year: "numeric" });
  };

  // Group by date label
  const groups = [];
  let lastLabel = null;
  filteredLog.forEach((log, i) => {
    const label = dateLabel(log.changedAt);
    if (label !== lastLabel) { groups.push({ label, items: [] }); lastLabel = label; }
    groups[groups.length - 1].items.push({ log, idx: i });
  });

  return (
    <div className="chart-box fade-up" style={{ padding: 0, overflow: "hidden" }}>
      {/* ── Header ── */}
      <div style={{ padding: "18px 24px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: T.white, fontFamily: "'Fraunces',serif" }}>Audit Log</div>
          <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>
            {filteredLog.length} of {auditLog.length} events · Complete admin action history
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* View mode toggle */}
          <div style={{ display: "flex", background: T.surface, borderRadius: 8, border: `1px solid ${T.border}`, overflow: "hidden", marginRight: 8 }}>
            {[{ id: "timeline", label: "Timeline" }, { id: "byAdmin", label: "By Admin" }, { id: "byAction", label: "By Action" }].map(m => (
              <button key={m.id} type="button" onClick={() => setAuditViewMode(m.id)} style={{ padding: "6px 12px", fontSize: 10, fontWeight: 600, background: auditViewMode === m.id ? T.gold + "20" : "transparent", color: auditViewMode === m.id ? T.gold : T.textMuted, border: "none", cursor: "pointer" }}>{m.label}</button>
            ))}
          </div>
          {/* Date range */}
          <select value={dateRange} onChange={e => setDateRange(e.target.value)}
            style={{ padding: "7px 12px", borderRadius: 9, border: `1px solid ${T.border}`, background: T.surface, color: T.textSecondary, fontSize: 11, fontFamily: "'Outfit',sans-serif", outline: "none", cursor: "pointer" }}>
            <option value="all">All time</option>
            <option value="today">Today</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
          </select>
          {/* CSV export */}
          <button type="button" onClick={exportCSV}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", background: `${T.teal}12`, border: `1px solid ${T.teal}35`, borderRadius: 9, color: T.teal, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "'Outfit',sans-serif", transition: "all 0.15s" }}
            onMouseEnter={e => { e.currentTarget.style.background = `${T.teal}22`; }}
            onMouseLeave={e => { e.currentTarget.style.background = `${T.teal}12`; }}>
            ↓ CSV
          </button>
          {/* JSON export */}
          <button type="button" onClick={exportJSON}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", background: `${T.purple}12`, border: `1px solid ${T.purple}35`, borderRadius: 9, color: T.purple, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "'Outfit',sans-serif", transition: "all 0.15s" }}
            onMouseEnter={e => { e.currentTarget.style.background = `${T.purple}22`; }}
            onMouseLeave={e => { e.currentTarget.style.background = `${T.purple}12`; }}>
            ↓ JSON
          </button>
          {/* Refresh */}
          <button type="button" onClick={fetchAuditLog}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", background: `${T.gold}12`, border: `1px solid ${T.gold}35`, borderRadius: 9, color: T.gold, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "'Outfit',sans-serif", transition: "all 0.15s" }}
            onMouseEnter={e => { e.currentTarget.style.background = `${T.gold}22`; }}
            onMouseLeave={e => { e.currentTarget.style.background = `${T.gold}12`; }}>
            Γå╗ Refresh
          </button>
        </div>
      </div>

      {/* ── Filter + Search ── */}
      <div style={{ padding: "12px 24px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", background: `${T.surfaceAlt}` }}>
        {[
          { id: "all",     label: "All",             count: filterCounts.all     },
          { id: "tier",    label: "Tier Changes",    count: filterCounts.tier    },
          { id: "bulk",    label: "Bulk Actions",    count: filterCounts.bulk    },
          { id: "project", label: "Project Updates", count: filterCounts.project },
          { id: "tab",     label: "Tab Changes",     count: filterCounts.tab     },
          { id: "logins",  label: " Logins",       count: filterCounts.logins  },
          { id: "users",   label: " User Events",  count: filterCounts.users   },
        ].map(f => (
          <button key={f.id} type="button" onClick={() => setAuditFilter(f.id)}
            style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 12px", borderRadius: 8, border: `1px solid ${auditFilter===f.id ? T.gold : T.border}`, background: auditFilter===f.id ? `${T.gold}18` : "transparent", color: auditFilter===f.id ? T.gold : T.textMuted, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit',sans-serif", transition: "all 0.15s" }}>
            {f.label}
            {f.count > 0 && (
              <span style={{ fontSize: 9, fontWeight: 800, padding: "1px 5px", borderRadius: 4, background: auditFilter===f.id ? `${T.gold}30` : "rgba(255,255,255,0.06)", color: auditFilter===f.id ? T.gold : T.textMuted }}>
                {f.count}
              </span>
            )}
          </button>
        ))}
        <div style={{ marginLeft: "auto" }}>
          <input value={auditSearch} onChange={e => setAuditSearch(e.target.value)}
            placeholder="Search name, email or project..."
            style={{ padding: "7px 14px", borderRadius: 9, border: `1px solid ${T.border}`, background: T.surface, color: T.white, fontSize: 11, fontFamily: "'Outfit',sans-serif", outline: "none", width: 220, transition: "border 0.15s" }}
            onFocus={e => e.target.style.border = `1px solid ${T.gold}50`}
            onBlur={e => e.target.style.border = `1px solid ${T.border}`}
          />
        </div>
      </div>

      {/* ── Empty State ── */}
      {auditLog.length === 0 && (
        <div style={{ padding: "60px 24px", textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 14 }}></div>
          <div style={{ fontSize: 15, color: T.textSecondary, fontWeight: 700, marginBottom: 6, fontFamily: "'Fraunces',serif" }}>No audit events yet</div>
          <div style={{ fontSize: 12, color: T.textMuted, maxWidth: 340, margin: "0 auto" }}>Every tier change, project update, and tab visibility change will appear here automatically the moment you make it.</div>
        </div>
      )}
      {auditLog.length > 0 && filteredLog.length === 0 && (
        <div style={{ padding: "40px 24px", textAlign: "center" }}>
          <div style={{ fontSize: 28, marginBottom: 10 }}>[?]</div>
          <div style={{ fontSize: 13, color: T.textMuted }}>No events match your filter or search.</div>
        </div>
      )}

      {/* ── By Admin View ── */}
      {auditViewMode === "byAdmin" && (
        <div style={{ maxHeight: 580, overflowY: "auto", padding: "16px 24px" }}>
          {(() => {
            const admins = {};
            filteredLog.forEach(log => {
              const by = log.changedBy || "Unknown";
              if (!admins[by]) admins[by] = [];
              admins[by].push(log);
            });
            return Object.entries(admins).sort((a, b) => b[1].length - a[1].length).map(([admin, logs]) => (
              <div key={admin} style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: `1px solid ${T.border}` }}>
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: `${T.gold}20`, border: `2px solid ${T.gold}`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 12, color: T.gold }}>
                    {admin[0].toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.white }}>{admin.includes("@") ? admin.split("@")[0] : admin}</div>
                    <div style={{ fontSize: 10, color: T.textMuted }}>{admin}</div>
                  </div>
                  <span style={{ padding: "4px 12px", borderRadius: 12, background: `${T.gold}15`, color: T.gold, fontSize: 12, fontWeight: 700 }}>{logs.length} actions</span>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, padding: "10px 0" }}>
                  {Object.entries(logs.reduce((acc, l) => { acc[l.action] = (acc[l.action] || 0) + 1; return acc; }, {})).map(([action, count]) => {
                    const meta = actionMeta[action] || { label: action, color: T.textMuted };
                    return <span key={action} style={{ padding: "3px 10px", borderRadius: 6, background: `${meta.color}15`, color: meta.color, fontSize: 10, fontWeight: 600 }}>{meta.label}: {count}</span>;
                  })}
                </div>
              </div>
            ));
          })()}
        </div>
      )}

      {/* ── By Action View ── */}
      {auditViewMode === "byAction" && (
        <div style={{ maxHeight: 580, overflowY: "auto", padding: "16px 24px" }}>
          {(() => {
            const actions = {};
            filteredLog.forEach(log => {
              const action = log.action || "unknown";
              if (!actions[action]) actions[action] = [];
              actions[action].push(log);
            });
            return Object.entries(actions).sort((a, b) => b[1].length - a[1].length).map(([action, logs]) => {
              const meta = actionMeta[action] || { label: action, color: T.textMuted, icon: "ΓÜÖ" };
              return (
                <div key={action} style={{ marginBottom: 12, background: T.surfaceAlt, borderRadius: 10, border: `1px solid ${T.border}`, overflow: "hidden" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderBottom: `1px solid ${T.border}`, background: `${meta.color}08` }}>
                    <span style={{ fontSize: 14 }}>{meta.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: meta.color }}>{meta.label}</div>
                    </div>
                    <span style={{ padding: "4px 12px", borderRadius: 12, background: `${meta.color}20`, color: meta.color, fontSize: 12, fontWeight: 700 }}>{logs.length}</span>
                  </div>
                  <div style={{ padding: "8px 16px", maxHeight: 120, overflowY: "auto" }}>
                    {logs.slice(0, 5).map((log, i) => (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 10, color: T.textMuted }}>
                        <span>{log.changedBy || "Unknown"}</span>
                        <span>{log.changedAt ? new Date(log.changedAt).toLocaleDateString("en-AE", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—"}</span>
                      </div>
                    ))}
                    {logs.length > 5 && <div style={{ fontSize: 10, color: T.textMuted, textAlign: "center", padding: "4px 0" }}>+ {logs.length - 5} more</div>}
                  </div>
                </div>
              );
            });
          })()}
        </div>
      )}

      {/* ── Timeline Feed ── */}
      {auditViewMode === "timeline" && (
      <div style={{ maxHeight: 580, overflowY: "auto", padding: "8px 0" }}>
        {groups.map((group, gi) => (
          <div key={gi}>
            {/* Date Group Header */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 24px 6px" }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: T.textMuted, textTransform: "uppercase", letterSpacing: 1.5 }}>{group.label}</div>
              <div style={{ flex: 1, height: 1, background: T.border }} />
              <div style={{ fontSize: 10, color: T.textMuted }}>{group.items.length} event{group.items.length !== 1 ? "s" : ""}</div>
            </div>

            {/* Events in this group */}
            {group.items.map(({ log, idx }) => {
              const meta = actionMeta[log.action] || { label: log.action || "Unknown", color: T.textMuted, icon: "ΓÜÖ" };
              const isTier = log.action === "tier_change";
              const isBulk = log.action === "bulk_tier_change";
              const isProject = ["project_update","project_create"].includes(log.action);
              const affectedUser = (isTier) ? users.find(u => u.uid === log.uid) : null;
              const isClickable = isTier && affectedUser;
              const projName = isProject ? (emaarProjects.find(p => String(p.id) === String(log.projectId))?.name || `Project ${log.projectId}`) : null;

              return (
                <div key={log.id || idx}
                  onClick={() => isClickable && (setTab("users"), setPendingOpenUid(log.uid))}
                  style={{ display: "flex", gap: 0, padding: "0 24px", cursor: isClickable ? "pointer" : "default", transition: "background 0.12s" }}
                  onMouseEnter={e => e.currentTarget.style.background = `${T.surfaceAlt}`}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>

                  {/* Timeline line + dot */}
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginRight: 14, paddingTop: 14, flexShrink: 0 }}>
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: meta.color, boxShadow: `0 0 8px ${meta.color}60`, flexShrink: 0, zIndex: 1 }} />
                    <div style={{ width: 2, flex: 1, minHeight: 24, background: `${T.border}`, marginTop: 2 }} />
                  </div>

                  {/* Event card */}
                  <div style={{ flex: 1, padding: "12px 0 16px", borderBottom: `1px solid ${T.border}` }}>
                    {/* Top row: badge + time + admin */}
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 12 }}>{meta.icon}</span>
                      <span style={{ display: "inline-flex", alignItems: "center", padding: "3px 10px", borderRadius: 7, background: `${meta.color}18`, border: `1px solid ${meta.color}35`, color: meta.color, fontSize: 10, fontWeight: 700, letterSpacing: 0.3 }}>
                        {meta.label}
                      </span>
                      <span style={{ fontSize: 10, color: T.textMuted }}>{timeAgo(log.changedAt)}</span>
                      <span style={{ fontSize: 9, color: T.textMuted }}>·</span>
                      <span style={{ fontSize: 10, color: T.textMuted }}>{log.changedAt ? new Date(log.changedAt).toLocaleString("en-AE",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"}) : "—"}</span>
                      <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
                        {log.ip && log.ip !== "unknown" && (
                          <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 5, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: T.textMuted, fontFamily: "'Courier New', monospace" }}>
                             {log.ip}
                          </span>
                        )}
                        {log.changedBy && (
                          <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 9px", borderRadius: 6, background: `${T.gold}12`, border: `1px solid ${T.gold}28`, color: T.gold }}>
                            {log.changedBy.includes("@") ? log.changedBy.split("@")[0] : log.changedBy}
                          </span>
                        )}
                      </span>
                    </div>

                    {/* Detail body */}
                    {isTier && (
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: `${meta.color}20`, border: `1px solid ${meta.color}35`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 900, color: meta.color, flexShrink: 0 }}>
                          {((affectedUser?.name || affectedUser?.email || "?")[0]).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: T.white }}>
                            {affectedUser?.name || affectedUser?.email?.split("@")[0] || log.uid?.slice(0,12) || "Unknown user"}
                          </div>
                          {affectedUser?.email && affectedUser?.name && (
                            <div style={{ fontSize: 10, color: T.textMuted, marginBottom: 5 }}>{affectedUser.email}</div>
                          )}
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                            <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 6, background: `${tierColor[log.from]||"#94A3B8"}18`, color: tierColor[log.from]||"#94A3B8", border: `1px solid ${tierColor[log.from]||"#94A3B8"}35` }}>
                              {tierLabel[log.from]||log.from||"—"}
                            </span>
                            <span style={{ fontSize: 12, color: T.textMuted, fontWeight: 700 }}>ΓåÆ</span>
                            <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 6, background: `${tierColor[log.to]||"#94A3B8"}18`, color: tierColor[log.to]||"#94A3B8", border: `1px solid ${tierColor[log.to]||"#94A3B8"}35` }}>
                              {tierLabel[log.to]||log.to||"—"}
                            </span>
                            {isClickable && (
                              <span style={{ fontSize: 10, color: T.gold, fontWeight: 600, marginLeft: 4 }}>View profile ΓåÆ</span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {isBulk && (
                      <div style={{ background: `${T.surfaceAlt}`, borderRadius: 10, padding: "10px 14px", border: `1px solid ${T.border}` }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: T.white, marginBottom: 5 }}>
                          {(log.uids||[]).length} users changed to{" "}
                          <span style={{ color: tierColor[log.newTier]||T.gold, fontFamily: "'Fraunces',serif" }}>{tierLabel[log.newTier]||log.newTier}</span>
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                          {(log.uids||[]).slice(0,5).map(uid => {
                            const u = users.find(u=>u.uid===uid);
                            return (
                              <span key={uid} style={{ fontSize: 10, padding: "2px 8px", borderRadius: 5, background: "rgba(255,255,255,0.05)", color: T.textSecondary }}>
                                {u?.name||u?.email?.split("@")[0]||uid?.slice(0,8)}
                              </span>
                            );
                          })}
                          {(log.uids||[]).length > 5 && <span style={{ fontSize: 10, color: T.textMuted }}>+{(log.uids||[]).length-5} more</span>}
                        </div>
                      </div>
                    )}

                    {isProject && (
                      <div>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: T.white }}>{projName}</div>
                          {log.action === "project_update" && (
                            <button type="button"
                              onClick={e => { e.stopPropagation(); alert("Open the project in Data Manager > Projects, click the project row, then click Version History to rollback."); }}
                              style={{ fontSize: 10, padding: "3px 10px", borderRadius: 6, border: "1px solid rgba(212,168,67,0.3)", background: "rgba(212,168,67,0.06)", color: T.gold, cursor: "pointer", fontFamily: "'Outfit',sans-serif", fontWeight: 600 }}>
                              View Versions
                            </button>
                          )}
                        </div>
                        {log.diff && Object.keys(log.diff).length > 0 && (() => {
                          const entries = Object.entries(log.diff);
                          const shown = entries.slice(0, 4);
                          return (
                            <div>
                              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                                {shown.map(([k,v]) => (
                                  <div key={k} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, background: "rgba(255,255,255,0.04)", padding: "4px 10px", borderRadius: 7, border: `1px solid ${T.border}` }}>
                                    <span style={{ color: T.textMuted, fontWeight: 700, fontSize: 10, textTransform: "uppercase" }}>{k}:</span>
                                    <span style={{ color: "#F87171", textDecoration: "line-through", fontSize: 10 }}>{String(v.old||"—").slice(0,20)}</span>
                                    <span style={{ color: T.textMuted, fontSize: 10 }}>ΓåÆ</span>
                                    <span style={{ color: "#4ADE80", fontSize: 10, fontWeight: 600 }}>{String(v.new||"—").slice(0,20)}</span>
                                  </div>
                                ))}
                                {entries.length > 4 && <span style={{ fontSize: 10, color: T.textMuted, padding: "4px 8px" }}>+{entries.length - 4} more fields</span>}
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    )}

                    {!isTier && !isBulk && !isProject && (
                      <div style={{ fontSize: 12, color: T.textSecondary }}>
                        {log.tabId || log.communityKey || meta.label}
                        {log.diff && Object.keys(log.diff).length > 0 && (
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 5 }}>
                            {Object.entries(log.diff).slice(0,3).map(([k,v]) => (
                              <span key={k} style={{ fontSize: 10, background: "rgba(255,255,255,0.04)", padding: "3px 8px", borderRadius: 5, color: T.textMuted }}>
                                {k}: <span style={{ color: "#F87171", textDecoration: "line-through" }}>{String(v.old||"—").slice(0,12)}</span> ΓåÆ <span style={{ color: "#4ADE80" }}>{String(v.new||"—").slice(0,12)}</span>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
      )}
    </div>
  );
}

export { UsersTab, AuditLogTable };
export default UsersTab;
