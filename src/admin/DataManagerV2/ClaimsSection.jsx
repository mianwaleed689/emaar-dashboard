import React, { useState, useEffect, useMemo } from "react";
import {
  collection, doc, setDoc, onSnapshot, serverTimestamp, addDoc, deleteDoc
} from "firebase/firestore";
import { db } from "../../firebase";
import { C, cardStyle, btnStyles, inputStyle } from "./tokens";

export default function ClaimsSection({ currentUserId, currentUserEmail }) {
  const [claims, setClaims] = useState([]);
  const [developments, setDevelopments] = useState([]);
  const [developers, setDevelopers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fStatus, setFStatus] = useState("pending");
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const u1 = onSnapshot(collection(db, "developerClaims"), snap => {
      const arr = [];
      snap.forEach(d => arr.push({ id: d.id, ...d.data() }));
      setClaims(arr);
      setLoading(false);
    }, err => { console.error(err); setLoading(false); });

    const u2 = onSnapshot(collection(db, "developments"), snap => {
      const arr = [];
      snap.forEach(d => arr.push({ id: d.id, ...d.data() }));
      setDevelopments(arr);
    });

    const u3 = onSnapshot(collection(db, "developers"), snap => {
      const arr = [];
      snap.forEach(d => arr.push({ id: d.id, ...d.data() }));
      setDevelopers(arr);
    });

    return () => { u1(); u2(); u3(); };
  }, []);

  function notify(msg, type = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }

  const filtered = useMemo(() => {
    let r = [...claims];
    if (fStatus !== "all") r = r.filter(c => c.status === fStatus);
    if (search) {
      const s = search.toLowerCase();
      r = r.filter(c =>
        (c.developerName || "").toLowerCase().includes(s) ||
        (c.developmentName || "").toLowerCase().includes(s) ||
        (c.developerEmail || "").toLowerCase().includes(s)
      );
    }
    r.sort((a, b) => {
      const at = a.createdAt?.toMillis?.() || 0;
      const bt = b.createdAt?.toMillis?.() || 0;
      return bt - at;
    });
    return r;
  }, [claims, fStatus, search]);

  async function approve(claim) {
    if (!window.confirm("Approve claim? " + claim.developerName + " will become the verified owner of " + claim.developmentName + ".")) return;
    try {
      // 1. Update claim status
      await setDoc(doc(db, "developerClaims", claim.id), {
        status: "approved",
        approvedBy: currentUserId || "unknown",
        approvedByEmail: currentUserEmail || "unknown",
        approvedAt: serverTimestamp(),
      }, { merge: true });

      // 2. Mark development as claimed by this developer
      await setDoc(doc(db, "developments", claim.developmentId), {
        claimedByDeveloperId: claim.developerId,
        claimedByDeveloperEmail: claim.developerEmail,
        claimedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        updatedBy: currentUserId || "unknown",
      }, { merge: true });

      // 3. Audit log
      await addDoc(collection(db, "developments", claim.developmentId, "auditLog"), {
        action: "claim-approved",
        userId: currentUserId || "unknown",
        userEmail: currentUserEmail || "unknown",
        developerEmail: claim.developerEmail,
        timestamp: serverTimestamp(),
      });

      notify("Claim approved - " + claim.developerName + " is now verified owner");
    } catch (e) {
      console.error(e);
      notify("Approval failed: " + e.message, "error");
    }
  }

  async function reject(claim) {
    const reason = window.prompt("Reason for rejection (required):");
    if (!reason) return;
    try {
      await setDoc(doc(db, "developerClaims", claim.id), {
        status: "rejected",
        rejectedBy: currentUserId || "unknown",
        rejectedByEmail: currentUserEmail || "unknown",
        rejectedAt: serverTimestamp(),
        rejectionReason: reason,
      }, { merge: true });
      notify("Claim rejected");
    } catch (e) {
      notify("Rejection failed: " + e.message, "error");
    }
  }

  const pendingCount = claims.filter(c => c.status === "pending").length;
  const approvedCount = claims.filter(c => c.status === "approved").length;
  const rejectedCount = claims.filter(c => c.status === "rejected").length;

  if (loading) return <div style={{ padding: 40, color: C.t2 }}>Loading claims...</div>;

  return (
    <div>
      <h2 style={{ margin: "0 0 20px 0", fontSize: 18, color: C.w, fontFamily: "'Fraunces',serif", fontWeight: 600 }}>
        Developer Claim Queue
        <span style={{ fontSize: 12, color: C.t2, fontWeight: 400, marginLeft: 10 }}>
          {filtered.length} of {claims.length} claims
        </span>
      </h2>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14, marginBottom: 20 }}>
        <div style={cardStyle}>
          <div style={{ fontSize: 10, color: C.t2, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>Pending Review</div>
          <div style={{ fontSize: 24, color: C.amber, fontWeight: 700, fontFamily: "'Fraunces',serif" }}>{pendingCount}</div>
          <div style={{ fontSize: 10, color: C.m }}>awaiting admin action</div>
        </div>
        <div style={cardStyle}>
          <div style={{ fontSize: 10, color: C.t2, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>Approved</div>
          <div style={{ fontSize: 24, color: C.green, fontWeight: 700, fontFamily: "'Fraunces',serif" }}>{approvedCount}</div>
          <div style={{ fontSize: 10, color: C.m }}>verified claims</div>
        </div>
        <div style={cardStyle}>
          <div style={{ fontSize: 10, color: C.t2, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>Rejected</div>
          <div style={{ fontSize: 24, color: C.red, fontWeight: 700, fontFamily: "'Fraunces',serif" }}>{rejectedCount}</div>
          <div style={{ fontSize: 10, color: C.m }}>declined claims</div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ ...cardStyle, marginBottom: 16, padding: 14 }}>
        <div style={{ display: "grid", gridTemplateColumns: "3fr 1fr", gap: 10 }}>
          <input type="text" placeholder="Search developer or development..." value={search} onChange={e => setSearch(e.target.value)} style={inputStyle} />
          <select value={fStatus} onChange={e => setFStatus(e.target.value)} style={inputStyle}>
            <option value="pending">Pending ({pendingCount})</option>
            <option value="approved">Approved ({approvedCount})</option>
            <option value="rejected">Rejected ({rejectedCount})</option>
            <option value="all">All Statuses</option>
          </select>
        </div>
      </div>

      {/* Claims list */}
      <div style={{ display: "grid", gap: 10 }}>
        {filtered.length === 0 ? (
          <div style={{ ...cardStyle, textAlign: "center", padding: 40, color: C.t2 }}>
            {claims.length === 0 ? "No claims yet. Developers can claim projects from their developer portal." : "No results match your filters."}
          </div>
        ) : filtered.map(claim => {
          const statusColor = claim.status === "approved" ? C.green : claim.status === "rejected" ? C.red : C.amber;
          const createdAt = claim.createdAt?.toDate ? claim.createdAt.toDate().toLocaleString("en-GB") : "-";
          return (
            <div key={claim.id} style={cardStyle}>
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 10 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                    <span style={{ fontSize: 14, color: C.w, fontWeight: 600 }}>{claim.developerName || "(unknown)"}</span>
                    <span style={{ fontSize: 10, padding: "2px 8px", background: statusColor + "20", color: statusColor, borderRadius: 4, textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 600 }}>{claim.status || "unknown"}</span>
                  </div>
                  <div style={{ fontSize: 11, color: C.t2, marginBottom: 2 }}>
                    Claiming: <strong style={{ color: C.teal }}>{claim.developmentName || "(unknown development)"}</strong>
                  </div>
                  <div style={{ fontSize: 10, color: C.m, display: "flex", gap: 14, flexWrap: "wrap" }}>
                    <span>Email: {claim.developerEmail || "-"}</span>
                    <span>· RERA: {claim.reraLicense || "-"}</span>
                    <span>· Submitted: {createdAt}</span>
                  </div>
                </div>
                {claim.status === "pending" && (
                  <div style={{ display: "flex", gap: 6 }}>
                    <button style={{ ...btnStyles("teal"), padding: "8px 14px" }} onClick={() => approve(claim)}>✓ Approve</button>
                    <button style={{ ...btnStyles("red"), padding: "8px 14px" }} onClick={() => reject(claim)}>✕ Reject</button>
                  </div>
                )}
              </div>
              {claim.evidenceUrl && (
                <div style={{ fontSize: 11, color: C.t2, marginTop: 8, padding: 8, background: C.s2, borderRadius: 6 }}>
                  <strong style={{ color: C.w }}>Evidence:</strong> <a href={claim.evidenceUrl} target="_blank" rel="noreferrer" style={{ color: C.blue }}>{claim.evidenceUrl}</a>
                </div>
              )}
              {claim.notes && (
                <div style={{ fontSize: 11, color: C.t2, marginTop: 8, padding: 8, background: C.s2, borderRadius: 6 }}>
                  <strong style={{ color: C.w }}>Developer notes:</strong> {claim.notes}
                </div>
              )}
              {claim.status === "rejected" && claim.rejectionReason && (
                <div style={{ fontSize: 11, color: C.red, marginTop: 8, padding: 8, background: C.redD, borderRadius: 6 }}>
                  <strong>Rejection reason:</strong> {claim.rejectionReason}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {toast && (
        <div style={{ position: "fixed", bottom: 20, right: 20, padding: "12px 20px", background: toast.type === "error" ? C.redD : C.greenD, border: "1px solid " + (toast.type === "error" ? C.red : C.green), borderRadius: 8, color: toast.type === "error" ? C.red : C.green, fontSize: 12, fontWeight: 600, zIndex: 10000 }}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}