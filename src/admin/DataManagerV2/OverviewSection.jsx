import React, { useState, useEffect } from "react";
import { collection, onSnapshot, query, orderBy, limit } from "firebase/firestore";
import { db } from "../../firebase";
import { C, cardStyle } from "./tokens";

export default function OverviewSection({ currentUserId }) {
  const [devs, setDevs] = useState([]);
  const [projects, setProjects] = useState([]);
  const [developers, setDevelopers] = useState([]);
  const [recentAudit, setRecentAudit] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub1 = onSnapshot(collection(db, "developments"), snap => {
      const arr = [];
      snap.forEach(d => arr.push({ id: d.id, ...d.data() }));
      setDevs(arr);
      setLoading(false);
    }, err => { console.error("developments:", err); setLoading(false); });

    const unsub2 = onSnapshot(collection(db, "projects"), snap => {
      const arr = [];
      snap.forEach(d => arr.push({ id: d.id, ...d.data() }));
      setProjects(arr);
    }, err => console.error("projects:", err));

    const unsub3 = onSnapshot(collection(db, "developers"), snap => {
      const arr = [];
      snap.forEach(d => arr.push({ id: d.id, ...d.data() }));
      setDevelopers(arr);
    }, err => console.error("developers:", err));

    return () => { unsub1(); unsub2(); unsub3(); };
  }, []);

  // Stats
  const publishedDevs = devs.filter(d => d.visibility === "published").length;
  const draftDevs = devs.filter(d => d.visibility === "draft").length;
  const archivedDevs = devs.filter(d => d.visibility === "archived").length;

  // Health - devs missing critical fields
  const missingCoords = devs.filter(d => !d.coordinates || !d.coordinates.lat).length;
  const missingDeveloper = devs.filter(d => !d.developerId).length;
  const missingRera = devs.filter(d => d.visibility === "published" && !d.reraProjectNumber).length;
  const missingCover = devs.filter(d => !d.coverImageUrl).length;

  const orphanProjects = projects.filter(p => !p.developmentId || !devs.find(d => d.id === p.developmentId)).length;

  // Completeness score
  const scoreDev = (d) => {
    const fields = ["name", "developerId", "community", "coordinates", "reraProjectNumber", "coverImageUrl", "saleStatus", "launchDate", "expectedHandover"];
    const filled = fields.filter(f => {
      const v = d[f];
      if (f === "coordinates") return v && v.lat && v.lng;
      return v !== null && v !== undefined && v !== "";
    }).length;
    return Math.round((filled / fields.length) * 100);
  };
  const avgCompleteness = devs.length > 0
    ? Math.round(devs.reduce((sum, d) => sum + scoreDev(d), 0) / devs.length)
    : 0;

  const stats = [
    { label: "Total Developments", value: devs.length, color: C.gold, sub: `${publishedDevs} published, ${draftDevs} draft` },
    { label: "Total Projects", value: projects.length, color: C.teal, sub: `across all developments` },
    { label: "Total Developers", value: developers.length, color: C.purple, sub: `registered` },
    { label: "Avg Completeness", value: avgCompleteness + "%", color: avgCompleteness >= 80 ? C.green : avgCompleteness >= 50 ? C.amber : C.red, sub: `data quality score` },
  ];

  const health = [
    { label: "Missing coordinates", count: missingCoords, severity: missingCoords > 0 ? "warn" : "ok" },
    { label: "Missing developer link", count: missingDeveloper, severity: missingDeveloper > 0 ? "warn" : "ok" },
    { label: "Published without RERA #", count: missingRera, severity: missingRera > 0 ? "error" : "ok" },
    { label: "Missing cover image", count: missingCover, severity: missingCover > 0 ? "warn" : "ok" },
    { label: "Orphan projects", count: orphanProjects, severity: orphanProjects > 0 ? "error" : "ok" },
  ];

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: C.t2 }}>
        Loading platform data...
      </div>
    );
  }

  return (
    <div>
      <h2 style={{ margin: "0 0 20px 0", fontSize: 18, color: C.w, fontFamily: "'Fraunces',serif", fontWeight: 600 }}>
        Platform Overview
      </h2>

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 24 }}>
        {stats.map((s, i) => (
          <div key={i} style={cardStyle}>
            <div style={{ fontSize: 11, color: C.t2, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 28, color: s.color, fontWeight: 700, fontFamily: "'Fraunces',serif" }}>{s.value}</div>
            <div style={{ fontSize: 10, color: C.m, marginTop: 4 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Health indicators */}
      <div style={cardStyle}>
        <h3 style={{ margin: "0 0 14px 0", fontSize: 14, color: C.w, fontWeight: 600 }}>Data Health</h3>
        <div style={{ display: "grid", gap: 8 }}>
          {health.map((h, i) => {
            const color = h.severity === "error" ? C.red : h.severity === "warn" ? C.amber : C.green;
            const bg = h.severity === "error" ? C.redD : h.severity === "warn" ? C.amberD : C.greenD;
            return (
              <div key={i} style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 14px",
                background: bg,
                border: `1px solid ${color}30`,
                borderRadius: 6,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ color, fontSize: 14 }}>{h.severity === "ok" ? "✓" : h.severity === "warn" ? "⚠" : "✕"}</span>
                  <span style={{ fontSize: 12, color: C.w }}>{h.label}</span>
                </div>
                <span style={{ fontSize: 13, color, fontWeight: 700 }}>{h.count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {devs.length === 0 && (
        <div style={{ ...cardStyle, marginTop: 16, textAlign: "center", padding: 40 }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>◉</div>
          <div style={{ fontSize: 14, color: C.w, marginBottom: 4, fontWeight: 600 }}>No developments yet</div>
          <div style={{ fontSize: 12, color: C.t2 }}>
            Go to the <strong style={{ color: C.teal }}>Developments</strong> tab to add your first one
          </div>
        </div>
      )}
    </div>
  );
}