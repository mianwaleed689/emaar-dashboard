import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  collection, doc, getDoc, onSnapshot, addDoc, serverTimestamp, query, where
} from "firebase/firestore";
import { auth, db } from "../firebase";
import { T } from "../data";

/**
 * Developer Portal
 * For users with role=developer - browse unclaimed developments, submit claim requests,
 * and manage their verified projects.
 */
export default function DeveloperPortal() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [userDoc, setUserDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [developments, setDevelopments] = useState([]);
  const [claims, setClaims] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedDev, setSelectedDev] = useState(null);
  const [claimForm, setClaimForm] = useState({ reraLicense: "", evidenceUrl: "", notes: "" });
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        navigate("/agency/signup");
        return;
      }
      setUser(u);
      try {
        const snap = await getDoc(doc(db, "users", u.uid));
        if (snap.exists()) {
          const data = snap.data();
          setUserDoc(data);
          if (data.role !== "developer") {
            navigate("/dashboard");
            return;
          }
        }
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    });
    return () => unsub();
  }, [navigate]);

  useEffect(() => {
    if (!user) return;
    const u1 = onSnapshot(collection(db, "developments"), snap => {
      const arr = [];
      snap.forEach(d => arr.push({ id: d.id, ...d.data() }));
      setDevelopments(arr);
    }, err => console.error(err));

    const q = query(collection(db, "developerClaims"), where("developerId", "==", user.uid));
    const u2 = onSnapshot(q, snap => {
      const arr = [];
      snap.forEach(d => arr.push({ id: d.id, ...d.data() }));
      setClaims(arr);
    }, err => console.error(err));

    return () => { u1(); u2(); };
  }, [user]);

  function notify(msg, type = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }

  // Filter unclaimed developments (no claimedByDeveloperId set, and matching search)
  const unclaimed = useMemo(() => {
    return developments.filter(d => !d.claimedByDeveloperId && d.visibility === "published");
  }, [developments]);

  const filtered = useMemo(() => {
    if (!search) return unclaimed;
    const s = search.toLowerCase();
    return unclaimed.filter(d =>
      (d.name || "").toLowerCase().includes(s) ||
      (d.developerName || "").toLowerCase().includes(s) ||
      (d.community || "").toLowerCase().includes(s)
    );
  }, [unclaimed, search]);

  // My approved developments (ones I claimed and got approved)
  const myDevelopments = useMemo(() => {
    if (!user) return [];
    return developments.filter(d => d.claimedByDeveloperId === user.uid);
  }, [developments, user]);

  // Claims I've already submitted (any status)
  const myClaimedDevIds = new Set(claims.map(c => c.developmentId));

  async function submitClaim() {
    if (!selectedDev) return;
    if (!claimForm.reraLicense || !claimForm.evidenceUrl) {
      notify("RERA license and evidence URL are required", "error");
      return;
    }

    // Check if already claimed by this developer
    if (myClaimedDevIds.has(selectedDev.id)) {
      notify("You already submitted a claim for this development", "error");
      return;
    }

    setSubmitting(true);
    try {
      await addDoc(collection(db, "developerClaims"), {
        developerId: user.uid,
        developerEmail: user.email,
        developerName: userDoc?.name || user.email,
        developmentId: selectedDev.id,
        developmentName: selectedDev.name,
        reraLicense: claimForm.reraLicense,
        evidenceUrl: claimForm.evidenceUrl,
        notes: claimForm.notes,
        status: "pending",
        createdAt: serverTimestamp(),
      });
      notify("Claim submitted - admin will review within 48 hours");
      setSelectedDev(null);
      setClaimForm({ reraLicense: "", evidenceUrl: "", notes: "" });
    } catch (e) {
      console.error(e);
      notify("Submission failed: " + e.message, "error");
    }
    setSubmitting(false);
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: T.bg, color: T.white, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Outfit',sans-serif" }}>
        Loading your developer portal...
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: T.bg, color: T.white, fontFamily: "'Outfit',sans-serif" }}>
      {/* Header */}
      <div style={{ padding: "20px 32px", borderBottom: "1px solid " + T.border, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontFamily: "'Fraunces',serif", color: T.gold, fontWeight: 600 }}>Developer Portal</h1>
          <p style={{ margin: "4px 0 0 0", fontSize: 12, color: T.textMuted }}>
            Welcome, {userDoc?.name || user?.email} �� {myDevelopments.length} verified development{myDevelopments.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button onClick={() => signOut(auth).then(() => navigate("/"))} style={{ padding: "8px 16px", background: "transparent", border: "1px solid " + T.border, borderRadius: 8, color: T.textMuted, fontSize: 12, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>
          Sign out
        </button>
      </div>

      <div style={{ padding: 32, maxWidth: 1200, margin: "0 auto" }}>
        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 28 }}>
          <StatCard label="My Developments" value={myDevelopments.length} color={T.green} sub="verified and approved" />
          <StatCard label="Pending Claims" value={claims.filter(c => c.status === "pending").length} color={T.amber} sub="awaiting review" />
          <StatCard label="Rejected" value={claims.filter(c => c.status === "rejected").length} color={T.red} sub="see below" />
          <StatCard label="Available to Claim" value={unclaimed.length} color={T.blue} sub="unclaimed projects" />
        </div>

        {/* My verified developments */}
        {myDevelopments.length > 0 && (
          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 16, fontFamily: "'Fraunces',serif", color: T.white, marginBottom: 14 }}>My Verified Developments</h2>
            <div style={{ display: "grid", gap: 10 }}>
              {myDevelopments.map(d => (
                <div key={d.id} style={{ padding: 14, background: T.surface, border: "1px solid " + T.green + "40", borderRadius: 10, display: "flex", alignItems: "center", gap: 14 }}>
                  <span style={{ fontSize: 18, color: T.green }}>→�S</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, color: T.white, fontWeight: 600 }}>{d.name}</div>
                    <div style={{ fontSize: 11, color: T.textMuted }}>{d.community} �� {d.saleStatus} �� RERA #{d.reraProjectNumber || "-"}</div>
                  </div>
                  <span style={{ fontSize: 10, padding: "4px 10px", background: T.green + "20", color: T.green, borderRadius: 4, fontWeight: 600 }}>VERIFIED</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* My claims (pending or rejected) */}
        {claims.filter(c => c.status !== "approved").length > 0 && (
          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 16, fontFamily: "'Fraunces',serif", color: T.white, marginBottom: 14 }}>My Claim History</h2>
            <div style={{ display: "grid", gap: 10 }}>
              {claims.filter(c => c.status !== "approved").map(c => {
                const statusColor = c.status === "rejected" ? T.red : T.amber;
                return (
                  <div key={c.id} style={{ padding: 14, background: T.surface, border: "1px solid " + T.border, borderRadius: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                      <span style={{ fontSize: 13, color: T.white, fontWeight: 600 }}>{c.developmentName}</span>
                      <span style={{ fontSize: 10, padding: "2px 8px", background: statusColor + "20", color: statusColor, borderRadius: 4, textTransform: "uppercase", fontWeight: 600 }}>{c.status}</span>
                    </div>
                    {c.status === "rejected" && c.rejectionReason && (
                      <div style={{ fontSize: 11, color: T.red, marginTop: 6 }}>
                        Rejected: {c.rejectionReason}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Unclaimed developments - browse and claim */}
        <section>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <h2 style={{ fontSize: 16, fontFamily: "'Fraunces',serif", color: T.white, margin: 0 }}>Browse and Claim Developments</h2>
            <span style={{ fontSize: 11, color: T.textMuted }}>{filtered.length} available</span>
          </div>

          <input
            type="text"
            placeholder="Search developments by name, community, or developer..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: "100%", padding: "10px 14px", background: T.surface, border: "1px solid " + T.border, borderRadius: 8, color: T.white, fontSize: 13, fontFamily: "'Outfit',sans-serif", outline: "none", marginBottom: 14 }}
          />

          {filtered.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", color: T.textMuted, background: T.surface, border: "1px solid " + T.border, borderRadius: 10 }}>
              No unclaimed developments match your search.
            </div>
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              {filtered.slice(0, 50).map(d => {
                const alreadyClaimed = myClaimedDevIds.has(d.id);
                return (
                  <div key={d.id} style={{ padding: 14, background: T.surface, border: "1px solid " + T.border, borderRadius: 10, display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, color: T.white, fontWeight: 600 }}>{d.name}</div>
                      <div style={{ fontSize: 11, color: T.textMuted }}>
                        {d.community || "-"} �� Currently listed as: {d.developerName || "unknown"} �� RERA #{d.reraProjectNumber || "-"}
                      </div>
                    </div>
                    {alreadyClaimed ? (
                      <span style={{ fontSize: 10, padding: "6px 12px", background: T.amber + "20", color: T.amber, borderRadius: 4, fontWeight: 600 }}>CLAIM PENDING</span>
                    ) : (
                      <button onClick={() => setSelectedDev(d)} style={{ padding: "8px 14px", background: "linear-gradient(135deg, " + T.gold + ", #B8922A)", color: "#000", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>
                        Claim Development
                      </button>
                    )}
                  </div>
                );
              })}
              {filtered.length > 50 && (
                <div style={{ textAlign: "center", padding: 12, color: T.textMuted, fontSize: 11 }}>
                  Showing first 50 of {filtered.length} - refine your search to narrow results.
                </div>
              )}
            </div>
          )}
        </section>
      </div>

      {/* Claim submission modal */}
      {selectedDev && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: 20 }} onClick={() => setSelectedDev(null)}>
          <div style={{ background: T.surface, border: "1px solid " + T.gold + "40", borderRadius: 12, padding: 28, maxWidth: 600, width: "100%" }} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: "0 0 8px 0", fontSize: 16, color: T.gold, fontFamily: "'Fraunces',serif", fontWeight: 600 }}>Claim Development</h3>
            <p style={{ margin: "0 0 20px 0", fontSize: 12, color: T.textMuted }}>
              You are claiming <strong style={{ color: T.white }}>{selectedDev.name}</strong>. An admin will review and verify your claim within 48 hours.
            </p>

            <div style={{ display: "grid", gap: 14 }}>
              <div>
                <label style={{ fontSize: 10, color: T.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>RERA Developer License Number *</label>
                <input style={{ width: "100%", padding: "10px 12px", background: T.bg, border: "1px solid " + T.border, borderRadius: 6, color: T.white, fontSize: 13, marginTop: 4, fontFamily: "'Outfit',sans-serif", outline: "none" }} value={claimForm.reraLicense} onChange={e => setClaimForm({ ...claimForm, reraLicense: e.target.value })} placeholder="e.g. 1234" />
              </div>

              <div>
                <label style={{ fontSize: 10, color: T.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>Evidence URL *</label>
                <input style={{ width: "100%", padding: "10px 12px", background: T.bg, border: "1px solid " + T.border, borderRadius: 6, color: T.white, fontSize: 13, marginTop: 4, fontFamily: "'Outfit',sans-serif", outline: "none" }} value={claimForm.evidenceUrl} onChange={e => setClaimForm({ ...claimForm, evidenceUrl: e.target.value })} placeholder="https://yourcompany.com/about or press release URL" />
                <div style={{ fontSize: 10, color: T.textMuted, marginTop: 4 }}>
                  Link to your company website, press release, or any public page that proves you developed this project.
                </div>
              </div>

              <div>
                <label style={{ fontSize: 10, color: T.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>Additional Notes</label>
                <textarea style={{ width: "100%", padding: "10px 12px", background: T.bg, border: "1px solid " + T.border, borderRadius: 6, color: T.white, fontSize: 13, marginTop: 4, fontFamily: "'Outfit',sans-serif", outline: "none", minHeight: 70, resize: "vertical" }} value={claimForm.notes} onChange={e => setClaimForm({ ...claimForm, notes: e.target.value })} placeholder="Anything the admin should know..." />
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 24, paddingTop: 20, borderTop: "1px solid " + T.border }}>
              <button onClick={() => setSelectedDev(null)} disabled={submitting} style={{ padding: "9px 16px", background: "transparent", border: "1px solid " + T.border, borderRadius: 8, color: T.textMuted, fontSize: 12, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>
                Cancel
              </button>
              <button onClick={submitClaim} disabled={submitting} style={{ padding: "9px 16px", background: "linear-gradient(135deg, " + T.gold + ", #B8922A)", color: "#000", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>
                {submitting ? "Submitting..." : "Submit Claim"}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div style={{ position: "fixed", bottom: 20, right: 20, padding: "12px 20px", background: toast.type === "error" ? T.red + "20" : T.green + "20", border: "1px solid " + (toast.type === "error" ? T.red : T.green), borderRadius: 8, color: toast.type === "error" ? T.red : T.green, fontSize: 12, fontWeight: 600, zIndex: 10000 }}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color, sub }) {
  return (
    <div style={{ padding: 18, background: T.surface, border: "1px solid " + T.border, borderRadius: 12 }}>
      <div style={{ fontSize: 10, color: T.textMuted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 28, color, fontWeight: 700, fontFamily: "'Fraunces',serif" }}>{value}</div>
      <div style={{ fontSize: 10, color: T.textMuted, marginTop: 4 }}>{sub}</div>
    </div>
  );
}