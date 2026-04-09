import React, { useState, useEffect, useMemo } from "react";
import { collection, onSnapshot, collectionGroup, query, orderBy, limit } from "firebase/firestore";
import { db } from "../../firebase";
import { C, cardStyle, inputStyle } from "./tokens";

export default function ComplianceSection() {
  const [audits, setAudits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [fAction, setFAction] = useState("All");
  const [fCollection, setFCollection] = useState("All");

  useEffect(() => {
    // Use collectionGroup to query all auditLog subcollections across all parent docs
    const q = query(collectionGroup(db, "auditLog"), limit(500));
    const u = onSnapshot(q, snap => {
      const arr = [];
      snap.forEach(d => {
        const data = d.data();
        // Extract parent info from ref path: developments/{id}/auditLog/{logId}
        const pathParts = d.ref.path.split("/");
        const parentCollection = pathParts[0];
        const parentId = pathParts[1];
        arr.push({
          id: d.id,
          parentCollection,
          parentId,
          ...data,
        });
      });
      arr.sort((a, b) => {
        const at = a.timestamp?.toMillis?.() || 0;
        const bt = b.timestamp?.toMillis?.() || 0;
        return bt - at;
      });
      setAudits(arr);
      setLoading(false);
    }, err => {
      console.error("audit log fetch:", err);
      setLoading(false);
    });
    return () => u();
  }, []);

  const filtered = useMemo(() => {
    let r = [...audits];
    if (search) {
      const s = search.toLowerCase();
      r = r.filter(a =>
        (a.parentId || "").toLowerCase().includes(s) ||
        (a.userEmail || "").toLowerCase().includes(s) ||
        (a.userId || "").toLowerCase().includes(s) ||
        (a.action || "").toLowerCase().includes(s)
      );
    }
    if (fAction !== "All") r = r.filter(a => a.action === fAction);
    if (fCollection !== "All") r = r.filter(a => a.parentCollection === fCollection);
    return r;
  }, [audits, search, fAction, fCollection]);

  // Stats
  const byCollection = useMemo(() => {
    const m = {};
    audits.forEach(a => { m[a.parentCollection] = (m[a.parentCollection] || 0) + 1; });
    return m;
  }, [audits]);

  const byAction = useMemo(() => {
    const m = {};
    audits.forEach(a => { m[a.action] = (m[a.action] || 0) + 1; });
    return m;
  }, [audits]);

  const uniqueUsers = useMemo(() => {
    const s = new Set();
    audits.forEach(a => s.add(a.userId || a.userEmail || "unknown"));
    return s.size;
  }, [audits]);

  const formatTime = (ts) => {
    if (!ts) return "-";
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleString("en-GB", { day:"2-digit", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit" });
  };

  const actionColor = (action) => {
    if (!action) return C.m;
    if (action.includes("create")) return C.green;
    if (action.includes("update")) return C.blue;
    if (action.includes("archive") || action.includes("delete")) return C.red;
    if (action.includes("enrich") || action.includes("seed")) return C.amber;
    return C.t2;
  };

  if (loading) return <div style={{ padding: 40, color: C.t2 }}>Loading audit log...</div>;

  return (
    <div>
      <h2 style={{ margin: "0 0 20px 0", fontSize: 18, color: C.w, fontFamily: "'Fraunces',serif", fontWeight: 600 }}>
        Compliance & Audit
        <span style={{ fontSize: 12, color: C.t2, fontWeight: 400, marginLeft: 10 }}>
          {filtered.length} of {audits.length} events
        </span>
      </h2>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14, marginBottom: 20 }}>
        <div style={cardStyle}>
          <div style={{ fontSize: 10, color: C.t2, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>Total Events</div>
          <div style={{ fontSize: 24, color: C.gold, fontWeight: 700, fontFamily: "'Fraunces',serif" }}>{audits.length}</div>
          <div style={{ fontSize: 10, color: C.m }}>logged audit entries</div>
        </div>
        <div style={cardStyle}>
          <div style={{ fontSize: 10, color: C.t2, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>Unique Users</div>
          <div style={{ fontSize: 24, color: C.teal, fontWeight: 700, fontFamily: "'Fraunces',serif" }}>{uniqueUsers}</div>
          <div style={{ fontSize: 10, color: C.m }}>actors across events</div>
        </div>
        <div style={cardStyle}>
          <div style={{ fontSize: 10, color: C.t2, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>Creates</div>
          <div style={{ fontSize: 24, color: C.green, fontWeight: 700, fontFamily: "'Fraunces',serif" }}>{byAction.create || 0}</div>
          <div style={{ fontSize: 10, color: C.m }}>new records</div>
        </div>
        <div style={cardStyle}>
          <div style={{ fontSize: 10, color: C.t2, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>Updates</div>
          <div style={{ fontSize: 24, color: C.blue, fontWeight: 700, fontFamily: "'Fraunces',serif" }}>{byAction.update || 0}</div>
          <div style={{ fontSize: 10, color: C.m }}>modifications</div>
        </div>
        <div style={cardStyle}>
          <div style={{ fontSize: 10, color: C.t2, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>Archives</div>
          <div style={{ fontSize: 24, color: C.red, fontWeight: 700, fontFamily: "'Fraunces',serif" }}>{byAction.archive || 0}</div>
          <div style={{ fontSize: 10, color: C.m }}>soft deletes</div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ ...cardStyle, marginBottom: 16, padding: 14 }}>
        <div style={{ display: "grid", gridTemplateColumns: "3fr 1fr 1fr", gap: 10 }}>
          <input type="text" placeholder="Search by record ID, user email, or action..." value={search} onChange={e => setSearch(e.target.value)} style={inputStyle} />
          <select value={fCollection} onChange={e => setFCollection(e.target.value)} style={inputStyle}>
            <option value="All">All Collections</option>
            {Object.keys(byCollection).map(c => <option key={c} value={c}>{c} ({byCollection[c]})</option>)}
          </select>
          <select value={fAction} onChange={e => setFAction(e.target.value)} style={inputStyle}>
            <option value="All">All Actions</option>
            {Object.keys(byAction).map(a => <option key={a} value={a}>{a} ({byAction[a]})</option>)}
          </select>
        </div>
      </div>

      {/* Events list */}
      <div style={{ display: "grid", gap: 6 }}>
        {filtered.length === 0 ? (
          <div style={{ ...cardStyle, textAlign: "center", padding: 40, color: C.t2 }}>
            No audit events found.
          </div>
        ) : filtered.map(a => {
          const color = actionColor(a.action);
          return (
            <div key={a.id} style={{ ...cardStyle, padding: "10px 14px", display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ minWidth: 8, width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 2, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 10, padding: "2px 8px", background: color + "20", color, borderRadius: 4, textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 600 }}>{a.action || "unknown"}</span>
                  <span style={{ fontSize: 11, color: C.w, fontWeight: 500 }}>{a.parentCollection || "?"}/{a.parentId || "?"}</span>
                </div>
                <div style={{ fontSize: 10, color: C.t2, display: "flex", gap: 14, flexWrap: "wrap" }}>
                  <span>by {a.userEmail || a.userId || "unknown"}</span>
                  <span>· {formatTime(a.timestamp)}</span>
                  {a.fieldsChanged && a.fieldsChanged.length > 0 && (
                    <span>· {a.fieldsChanged.length} field{a.fieldsChanged.length !== 1 ? "s" : ""}</span>
                  )}
                  {a.source && <span>· source: {a.source}</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {audits.length === 500 && (
        <div style={{ ...cardStyle, marginTop: 16, textAlign: "center", padding: 16, color: C.amber, fontSize: 11 }}>
          Showing most recent 500 events. Older events exist but are not displayed. Export feature coming soon.
        </div>
      )}
    </div>
  );
}
