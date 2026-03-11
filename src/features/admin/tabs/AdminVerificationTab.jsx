import React, { useState, useEffect, useRef, useCallback } from "react";
import { collection, getDocs, doc, getDoc, setDoc, query, where } from "firebase/firestore";
import { auth } from "../../../firebase";

function AdminVerificationTab({ verifications = [], users = [], T, I, notify, db, timeSince = () => '—', logAudit, fetchVerifications = () => {}, verifyFilter = 'all', setVerifyFilter = () => {}, verifySearch = '', setVerifySearch = () => {}, verifySubTab = 'queue', setVerifySubTab = () => {}, reviewingUser, setReviewingUser = () => {}, rejectReason = '', setRejectReason = () => {}, setTab, setPendingOpenUid }) {

  // ── Verification action functions ────────────────────────────────
  const approveVerification = async (v) => {
    if (approveLoading) return;
    setApproveLoading(true);
    try {
      const { setDoc, doc } = await import("firebase/firestore");
      const { db: firedb } = await import("../../../firebase");
      await setDoc(doc(firedb || db, "kyc", v.id), {
        status: "approved",
        reviewedAt: new Date().toISOString(),
        reviewedBy: "admin",
      }, { merge: true });
      notify("Verification approved");
      if (fetchVerifications) fetchVerifications();
      setReviewingUser(null);
    } catch (err) {
      notify("Error approving verification");
    }
    setApproveLoading(false);
  };

  const rejectVerification = async (v, reason) => {
    if (rejectLoading) return;
    setRejectLoading(true);
    try {
      const { setDoc, doc } = await import("firebase/firestore");
      const { db: firedb } = await import("../../../firebase");
      await setDoc(doc(firedb || db, "kyc", v.id), {
        status: "rejected",
        rejectReason: reason || rejectReason || "Does not meet requirements",
        reviewedAt: new Date().toISOString(),
        reviewedBy: "admin",
      }, { merge: true });
      notify("Verification rejected");
      if (fetchVerifications) fetchVerifications();
      setReviewingUser(null);
    } catch (err) {
      notify("Error rejecting verification");
    }
    setRejectLoading(false);
  };
  // ─────────────────────────────────────────────────────────────────

  const [verifyBatchMode, setVerifyBatchMode] = React.useState(false);
  const [verifyBatchSelected, setVerifyBatchSelected] = React.useState([]);
  const [batchProcessing, setBatchProcessing] = React.useState(false);
  const [rejectLoading, setRejectLoading] = React.useState(false);
  const [approveLoading, setApproveLoading] = React.useState(false);

            /* ─── KYC VERIFICATION TAB ─── */
            const todayStart = new Date(); todayStart.setHours(0,0,0,0);
            const vPending = verifications.filter(v => v.status === "pending");
            const vApproved = verifications.filter(v => v.status === "approved");
            const vRejected = verifications.filter(v => v.status === "rejected");
            const approvedToday = vApproved.filter(v => v.reviewedAt && new Date(v.reviewedAt) >= todayStart).length;
            const rejectedToday = vRejected.filter(v => v.reviewedAt && new Date(v.reviewedAt) >= todayStart).length;
            
            // Avg review time (hours)
            const reviewed = verifications.filter(v => v.reviewedAt && v.submittedAt);
            const avgReviewHrs = reviewed.length > 0 
              ? Math.round(reviewed.reduce((sum, v) => sum + (new Date(v.reviewedAt) - new Date(v.submittedAt)), 0) / reviewed.length / 1000 / 60 / 60)
              : null;

            // Filter + sort (FIFO - oldest pending first)
            const filtered = verifications.filter(v => {
              if (verifySubTab === "history" && v.status === "pending") return false;
              if (verifySubTab === "queue" && v.status !== "pending" && verifyFilter === "all") return v.status === "pending";
              if (verifyFilter !== "all" && v.status !== verifyFilter) return false;
              if (verifySearch && !((v.name || "").toLowerCase().includes(verifySearch.toLowerCase()) || (v.email || "").toLowerCase().includes(verifySearch.toLowerCase()))) return false;
              return true;
            }).sort((a, b) => {
              // Pending: oldest first (FIFO). Others: newest first
              if (a.status === "pending" && b.status === "pending") return new Date(a.submittedAt || 0) - new Date(b.submittedAt || 0);
              return new Date(b.submittedAt || 0) - new Date(a.submittedAt || 0);
            });

            const statusColor = { pending: T.orange, approved: T.green, rejected: T.red };
            const statusLabel = { pending: "Pending", approved: "Approved", rejected: "Rejected" };
            const levelColors = { basic: T.blue, intermediate: T.gold, advanced: T.green, institutional: T.purple };

            // Check if pending > 24h (urgent)
            const isUrgent = (v) => {
              if (v.status !== "pending" || !v.submittedAt) return false;
              return (Date.now() - new Date(v.submittedAt).getTime()) > 24 * 60 * 60 * 1000;
            };

            // Get user context
            const getUserContext = (uid) => users.find(u => u.uid === uid || u.id === uid);


  return (
    <>
            
              {/* ═══ KPI TOPBAR ═══ */}
              <div className="fade-up" style={{ display: "flex", alignItems: "center", gap: 0, borderRadius: 14, background: T.surface, border: `1px solid ${T.border}`, marginBottom: 20, overflow: "hidden" }}>
                <button type="button" onClick={() => { fetchVerifications(); notify("Refreshed"); }} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, padding: "14px 16px", background: T.goldGlow, border: "none", borderRight: `1px solid ${T.border}`, color: T.gold, cursor: "pointer", fontFamily: "'Outfit',sans-serif", fontWeight: 600, flexShrink: 0 }}>{I.refresh}</button>
                {[
                  { label: "Pending", value: vPending.length, color: T.orange },
                  { label: "Approved Today", value: approvedToday, color: T.green },
                  { label: "Rejected Today", value: rejectedToday, color: T.red },
                  { label: "Avg Review", value: avgReviewHrs !== null ? `${avgReviewHrs}h` : "—", color: T.teal },
                  { label: "Total", value: verifications.length, color: T.textSecondary },
                ].map((item, i) => (
                  <div key={i} style={{ display: "flex", flexDirection: "column", padding: "10px 20px", borderRight: `1px solid ${T.border}`, flexShrink: 0 }}>
                    <span style={{ fontSize: 9, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: 1 }}>{item.label}</span>
                    <span style={{ fontSize: 18, fontWeight: 900, color: item.color, fontFamily: "'Fraunces',serif", lineHeight: 1.2 }}>{item.value}</span>
                  </div>
                ))}
              </div>

              {/* ═══ VERIFICATION LEVELS ═══ */}
              <div className="fade-up" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 20 }}>
                {[
                  { level: "Basic", id: "basic", color: T.blue, icon: "1", desc: "Email verified", features: ["Email confirmation", "Basic profile", "Limited access"] },
                  { level: "Enhanced", id: "intermediate", color: T.gold, icon: "2", desc: "ID + Selfie", features: ["Government ID", "Selfie verification", "Full project access"] },
                  { level: "Institutional", id: "advanced", color: T.green, icon: "3", desc: "Business docs", features: ["Company registration", "Director ID", "Enterprise features"] },
                ].map((tier, i) => (
                  <div key={i} style={{ background: T.surface, borderRadius: 12, padding: "16px 18px", border: `1px solid ${T.border}`, position: "relative" }}>
                    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: tier.color, opacity: 0.7 }} />
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                      <div style={{ width: 28, height: 28, borderRadius: "50%", background: `${tier.color}20`, border: `2px solid ${tier.color}`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 13, color: tier.color }}>{tier.icon}</div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: T.white }}>{tier.level}</div>
                        <div style={{ fontSize: 10, color: T.textMuted }}>{tier.desc}</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {tier.features.map((f, j) => (
                        <span key={j} style={{ fontSize: 10, padding: "3px 8px", borderRadius: 6, background: `${tier.color}10`, color: tier.color }}>{f}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* ═══ SUB-TABS: Queue | History ═══ */}
              <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                {[
                  { id: "queue", label: `Review Queue (${vPending.length})` },
                  { id: "history", label: "History" },
                ].map(t => (
                  <button key={t.id} type="button" onClick={() => setVerifySubTab(t.id)}
                    style={{ padding: "8px 16px", borderRadius: 8, border: `1px solid ${verifySubTab === t.id ? T.gold : T.border}`, background: verifySubTab === t.id ? T.goldGlow : "transparent", color: verifySubTab === t.id ? T.gold : T.textMuted, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>{t.label}</button>
                ))}
              </div>

              {/* ═══ FILTERS + BATCH MODE ═══ */}
              <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
                {(verifySubTab === "history" ? ["all", "approved", "rejected"] : ["all", "pending"]).map(f => (
                  <button key={f} type="button" onClick={() => setVerifyFilter(f)}
                    style={{ padding: "6px 14px", borderRadius: 8, border: `1px solid ${verifyFilter === f ? T.gold : T.border}`, background: verifyFilter === f ? T.goldGlow : "transparent", color: verifyFilter === f ? T.gold : T.textMuted, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit',sans-serif", textTransform: "capitalize" }}>
                    {f}
                  </button>
                ))}
                <div style={{ height: 20, width: 1, background: T.border }} />
                <button type="button" onClick={() => { setVerifyBatchMode(!verifyBatchMode); setVerifyBatchSelected([]); }}
                  style={{ padding: "6px 14px", borderRadius: 8, border: `1px solid ${verifyBatchMode ? T.purple : T.border}`, background: verifyBatchMode ? `${T.purple}15` : "transparent", color: verifyBatchMode ? T.purple : T.textMuted, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>
                  {verifyBatchMode ? `Γ£ô Batch Mode (${verifyBatchSelected.length})` : "Batch Mode"}
                </button>
                {verifyBatchMode && verifyBatchSelected.length > 0 && (
                  <>
                    <button type="button" onClick={async () => {
                      for (const id of verifyBatchSelected) {
                        const v = filtered.find(x => x.id === id);
                        if (v) await approveVerification(v);
                      }
                      setVerifyBatchSelected([]);
                      notify(`Approved ${verifyBatchSelected.length} verifications`);
                    }} style={{ padding: "6px 14px", borderRadius: 8, border: "none", background: T.green, color: T.bg, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                      Approve Selected ({verifyBatchSelected.length})
                    </button>
                  </>
                )}
                <div style={{ flex: 1 }} />
                {/* SLA Warning */}
                {vPending.filter(v => isUrgent(v)).length > 0 && (
                  <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 8, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)" }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: T.red }}>ΓÜá {vPending.filter(v => isUrgent(v)).length} past SLA</span>
                    <span style={{ fontSize: 9, color: T.textMuted }}>&gt;24h</span>
                  </div>
                )}
                <input value={verifySearch} onChange={e => setVerifySearch(e.target.value)} placeholder="Search name or email..." 
                  style={{ padding: "8px 14px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface, color: T.white, fontSize: 12, fontFamily: "'Outfit',sans-serif", outline: "none", width: 200 }} />
              </div>

              {/* ═══ VERIFICATION TABLE ═══ */}
              <div style={{ background: T.surface, borderRadius: 14, border: `1px solid ${T.border}`, overflow: "hidden" }}>
                {filtered.length === 0 ? (
                  <div style={{ textAlign: "center", padding: 60 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: T.textSecondary, marginBottom: 6 }}>{verifySubTab === "queue" ? "No pending verifications" : "No verification history"}</div>
                    <div style={{ fontSize: 12, color: T.textMuted }}>Users submit verification from their profile settings</div>
                  </div>
                ) : (
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                      <thead>
                        <tr style={{ borderBottom: `2px solid ${T.border}` }}>
                          {verifyBatchMode && (
                            <th style={{ padding: "12px 10px", textAlign: "center", background: T.surfaceAlt, width: 40 }}>
                              <input type="checkbox" checked={verifyBatchSelected.length === filtered.filter(v => v.status === "pending").length && filtered.filter(v => v.status === "pending").length > 0} onChange={e => {
                                if (e.target.checked) setVerifyBatchSelected(filtered.filter(v => v.status === "pending").map(v => v.id));
                                else setVerifyBatchSelected([]);
                              }} style={{ cursor: "pointer" }} />
                            </th>
                          )}
                          {["User", "Level", "Status", "Submitted", "Wait Time", "Actions"].map(h => (
                            <th key={h} style={{ padding: "12px 14px", textAlign: "left", color: T.gold, fontWeight: 600, fontSize: 10, letterSpacing: 0.5, textTransform: "uppercase", background: T.surfaceAlt }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.map((v, i) => {
                          const urgent = isUrgent(v);
                          const waitHrs = v.submittedAt ? Math.round((Date.now() - new Date(v.submittedAt).getTime()) / 1000 / 60 / 60) : 0;
                          const userCtx = getUserContext(v.uid);
                          return (
                            <tr key={v.id} style={{ borderBottom: `1px solid ${T.border}`, background: urgent ? "rgba(239,68,68,0.03)" : verifyBatchSelected.includes(v.id) ? `${T.purple}08` : "transparent", cursor: "pointer" }}
                              onMouseEnter={e => e.currentTarget.style.background = urgent ? "rgba(239,68,68,0.06)" : verifyBatchSelected.includes(v.id) ? `${T.purple}12` : T.surfaceAlt}
                              onMouseLeave={e => e.currentTarget.style.background = urgent ? "rgba(239,68,68,0.03)" : verifyBatchSelected.includes(v.id) ? `${T.purple}08` : "transparent"}
                              onClick={() => !verifyBatchMode && setReviewingUser(v)}>
                              {verifyBatchMode && (
                                <td style={{ padding: "12px 10px", textAlign: "center" }} onClick={e => e.stopPropagation()}>
                                  {v.status === "pending" && (
                                    <input type="checkbox" checked={verifyBatchSelected.includes(v.id)} onChange={e => {
                                      if (e.target.checked) setVerifyBatchSelected([...verifyBatchSelected, v.id]);
                                      else setVerifyBatchSelected(verifyBatchSelected.filter(x => x !== v.id));
                                    }} style={{ cursor: "pointer" }} />
                                  )}
                                </td>
                              )}
                              <td style={{ padding: "12px 14px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: `${statusColor[v.status]}20`, border: `1.5px solid ${statusColor[v.status]}`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 12, color: statusColor[v.status] }}>
                                    {(v.name || v.email || "?")[0].toUpperCase()}
                                  </div>
                                  <div>
                                    <div style={{ fontSize: 13, fontWeight: 600, color: T.white }}>{v.name || "No name"}</div>
                                    <div style={{ fontSize: 10, color: T.textMuted }}>{v.email || "—"}</div>
                                    {userCtx && <div style={{ fontSize: 9, color: T.teal }}>{userCtx.tier} · joined {userCtx.createdAt ? new Date(userCtx.createdAt).toLocaleDateString("en-AE", { month: "short", year: "numeric" }) : "—"}</div>}
                                  </div>
                                </div>
                              </td>
                              <td style={{ padding: "12px 14px" }}>
                                <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 6, background: `${levelColors[v.level] || T.blue}15`, color: levelColors[v.level] || T.blue, textTransform: "capitalize" }}>{v.level || "Basic"}</span>
                              </td>
                              <td style={{ padding: "12px 14px" }}>
                                <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, color: statusColor[v.status], background: `${statusColor[v.status]}15`, padding: "3px 10px", borderRadius: 6 }}>
                                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: statusColor[v.status] }} />
                                  {statusLabel[v.status]}
                                </span>
                              </td>
                              <td style={{ padding: "12px 14px", fontSize: 11, color: T.textSecondary }}>
                                {v.submittedAt ? new Date(v.submittedAt).toLocaleDateString("en-AE", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—"}
                              </td>
                              <td style={{ padding: "12px 14px" }}>
                                {v.status === "pending" ? (
                                  <span style={{ fontSize: 11, fontWeight: 600, color: urgent ? T.red : waitHrs > 12 ? T.orange : T.textMuted }}>
                                    {waitHrs}h {urgent && <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, background: "rgba(239,68,68,0.15)", color: T.red, marginLeft: 4 }}>URGENT</span>}
                                  </span>
                                ) : (
                                  <span style={{ fontSize: 10, color: T.textMuted }}>{v.reviewedAt ? `Reviewed ${new Date(v.reviewedAt).toLocaleDateString("en-AE", { day: "numeric", month: "short" })}` : "—"}</span>
                                )}
                              </td>
                              <td style={{ padding: "12px 14px" }} onClick={e => e.stopPropagation()}>
                                <div style={{ display: "flex", gap: 6 }}>
                                  {v.status === "pending" && (
                                    <>
                                      <button type="button" onClick={() => approveVerification(v)} style={{ padding: "5px 12px", borderRadius: 6, border: "none", background: "rgba(16,185,129,0.15)", color: T.green, fontSize: 10, fontWeight: 600, cursor: "pointer" }}>Approve</button>
                                      <button type="button" onClick={() => setReviewingUser(v)} style={{ padding: "5px 12px", borderRadius: 6, border: "none", background: "rgba(239,68,68,0.1)", color: T.red, fontSize: 10, fontWeight: 600, cursor: "pointer" }}>Reject</button>
                                    </>
                                  )}
                                  <button type="button" onClick={() => setReviewingUser(v)} style={{ padding: "5px 10px", borderRadius: 6, border: `1px solid ${T.border}`, background: "transparent", color: T.textMuted, fontSize: 10, cursor: "pointer" }}>View</button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* ═══ REVIEW DRAWER ═══ */}
              {reviewingUser && (
                <div style={{ position: "fixed", inset: 0, zIndex: 8000 }} onClick={() => { setReviewingUser(null); setRejectReason(""); }}>
                  <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: "100%", maxWidth: 540, background: T.surface, borderLeft: `1px solid ${T.gold}30`, display: "flex", flexDirection: "column", animation: "slideIn 0.2s ease-out" }} onClick={e => e.stopPropagation()}>
                    {/* Header */}
                    <div style={{ padding: "20px 24px", borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <div style={{ fontFamily: "'Fraunces',serif", fontSize: 20, fontWeight: 700, color: T.white }}>{reviewingUser.name || "Verification Review"}</div>
                        <div style={{ fontSize: 12, color: T.textMuted, marginTop: 4 }}>{reviewingUser.email}</div>
                        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                          <span style={{ fontSize: 10, padding: "3px 10px", borderRadius: 6, background: `${statusColor[reviewingUser.status]}15`, color: statusColor[reviewingUser.status], fontWeight: 600 }}>{statusLabel[reviewingUser.status]}</span>
                          <span style={{ fontSize: 10, padding: "3px 10px", borderRadius: 6, background: `${levelColors[reviewingUser.level] || T.blue}15`, color: levelColors[reviewingUser.level] || T.blue, fontWeight: 600, textTransform: "capitalize" }}>{reviewingUser.level || "Basic"}</span>
                        </div>
                      </div>
                      <button type="button" onClick={() => { setReviewingUser(null); setRejectReason(""); }} style={{ background: "none", border: "none", color: T.textMuted, cursor: "pointer", fontSize: 24, lineHeight: 1 }}>x</button>
                    </div>

                    {/* User Context */}
                    {(() => {
                      const userCtx = getUserContext(reviewingUser.uid);
                      if (!userCtx) return null;
                      return (
                        <div style={{ padding: "12px 24px", borderBottom: `1px solid ${T.border}`, background: T.surfaceAlt }}>
                          <div style={{ fontSize: 10, fontWeight: 700, color: T.teal, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>User Context</div>
                          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                            <div><span style={{ fontSize: 10, color: T.textMuted }}>Tier: </span><span style={{ fontSize: 11, color: T.white, fontWeight: 600 }}>{userCtx.tier}</span></div>
                            <div><span style={{ fontSize: 10, color: T.textMuted }}>Joined: </span><span style={{ fontSize: 11, color: T.white }}>{userCtx.createdAt ? new Date(userCtx.createdAt).toLocaleDateString("en-AE") : "—"}</span></div>
                            <div><span style={{ fontSize: 10, color: T.textMuted }}>Last Active: </span><span style={{ fontSize: 11, color: T.white }}>{userCtx.lastLoginAt ? new Date(userCtx.lastLoginAt).toLocaleDateString("en-AE") : "—"}</span></div>
                            <div><span style={{ fontSize: 10, color: T.textMuted }}>Country: </span><span style={{ fontSize: 11, color: T.white }}>{userCtx.country || "—"}</span></div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Scrollable Content */}
                    <div style={{ flex: 1, overflowY: "auto", padding: 24 }}>
                      {/* Personal Info */}
                      <div style={{ marginBottom: 20 }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: T.gold, letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>Personal Information</div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                          {[
                            { label: "Full Name", value: reviewingUser.name || "—" },
                            { label: "Email", value: reviewingUser.email || "—" },
                            { label: "Phone", value: reviewingUser.phone || "—" },
                            { label: "Nationality", value: reviewingUser.nationality || "—" },
                            { label: "Date of Birth", value: reviewingUser.dob || "—" },
                            { label: "Address", value: reviewingUser.address || "—" },
                          ].map((item, i) => (
                            <div key={i} style={{ padding: "8px 12px", borderRadius: 8, background: T.surfaceAlt }}>
                              <div style={{ fontSize: 9, fontWeight: 600, color: T.textMuted, textTransform: "uppercase", marginBottom: 2 }}>{item.label}</div>
                              <div style={{ fontSize: 12, color: T.white }}>{item.value}</div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Documents */}
                      <div style={{ marginBottom: 20 }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: T.gold, letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>Submitted Documents</div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                          {[
                            { type: "Government ID", key: "idDoc", desc: "Passport / Emirates ID" },
                            { type: "Selfie", key: "selfieDoc", desc: "Photo holding ID" },
                            { type: "Address Proof", key: "addressDoc", desc: "Utility / Bank statement" },
                          ].map((d, i) => {
                            const docUrl = reviewingUser[d.key];
                            return (
                              <div key={i} style={{ background: T.surfaceAlt, borderRadius: 10, padding: 12, border: `1px solid ${docUrl ? T.green : T.border}30`, textAlign: "center" }}>
                                {docUrl ? (
                                  <a href={docUrl} target="_blank" rel="noreferrer" style={{ display: "block" }}>
                                    <img src={docUrl} alt={d.type} style={{ width: "100%", height: 80, objectFit: "cover", borderRadius: 8, marginBottom: 8, border: `1px solid ${T.border}` }} onError={e => { e.target.style.display = "none"; }} />
                                  </a>
                                ) : (
                                  <div style={{ width: "100%", height: 80, borderRadius: 8, background: T.bg, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 8 }}>
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={T.textMuted} strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
                                  </div>
                                )}
                                <div style={{ fontSize: 11, fontWeight: 600, color: docUrl ? T.white : T.textMuted }}>{d.type}</div>
                                <div style={{ fontSize: 9, color: T.textMuted }}>{docUrl ? "Click to view" : "Not uploaded"}</div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Review History */}
                      {reviewingUser.reviewedAt && (
                        <div style={{ padding: "12px 16px", borderRadius: 10, background: `${statusColor[reviewingUser.status]}08`, border: `1px solid ${statusColor[reviewingUser.status]}25`, marginBottom: 20 }}>
                          <div style={{ fontSize: 11, fontWeight: 600, color: statusColor[reviewingUser.status] }}>{statusLabel[reviewingUser.status]} on {new Date(reviewingUser.reviewedAt).toLocaleDateString("en-AE", { day: "numeric", month: "short", year: "numeric" })}</div>
                          {reviewingUser.reviewedBy && <div style={{ fontSize: 10, color: T.textMuted, marginTop: 2 }}>By: {reviewingUser.reviewedBy}</div>}
                          {reviewingUser.rejectReason && <div style={{ fontSize: 11, color: T.textSecondary, marginTop: 6 }}>Reason: {reviewingUser.rejectReason}</div>}
                        </div>
                      )}

                      {/* Timestamps */}
                      <div style={{ display: "flex", gap: 16, fontSize: 10, color: T.textMuted, marginBottom: 20 }}>
                        <span>Submitted: {reviewingUser.submittedAt ? new Date(reviewingUser.submittedAt).toLocaleString("en-AE") : "—"}</span>
                        <span>UID: {reviewingUser.uid?.slice(0, 12)}...</span>
                      </div>

                      {/* Action Buttons */}
                      {reviewingUser.status === "pending" && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                          <div>
                            <label style={{ fontSize: 10, fontWeight: 600, color: T.textMuted, textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 6 }}>Rejection Reason (required to reject)</label>
                            <input value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="e.g. Blurry document, name mismatch, expired ID..."
                              style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.surfaceAlt, color: T.white, fontSize: 12, fontFamily: "'Outfit',sans-serif", outline: "none", boxSizing: "border-box" }} />
                          </div>
                          <div style={{ display: "flex", gap: 12 }}>
                            <button type="button" onClick={() => approveVerification(reviewingUser)} style={{ flex: 1, padding: "12px 0", borderRadius: 10, border: "none", background: `linear-gradient(135deg, ${T.green}, #059669)`, color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>Approve</button>
                            <button type="button" onClick={() => rejectVerification(reviewingUser)} disabled={!rejectReason.trim()} style={{ flex: 1, padding: "12px 0", borderRadius: 10, border: "none", background: rejectReason.trim() ? "rgba(239,68,68,0.15)" : "rgba(100,116,139,0.1)", color: rejectReason.trim() ? T.red : T.textMuted, fontWeight: 700, fontSize: 13, cursor: rejectReason.trim() ? "pointer" : "not-allowed", fontFamily: "'Outfit',sans-serif" }}>Reject</button>
                          </div>
                        </div>
                      )}

                      {/* View User Button */}
                      {reviewingUser.uid && (
                        <button type="button" onClick={() => { setTab("users"); setPendingOpenUid(reviewingUser.uid); setReviewingUser(null); }}
                          style={{ marginTop: 16, width: "100%", padding: "10px", borderRadius: 8, border: `1px solid ${T.gold}`, background: "transparent", color: T.gold, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>View Full User Profile ΓåÆ</button>
                      )}
                    </div>
                  </div>
                </div>
              )}
    </>
  );
}

export default AdminVerificationTab;
