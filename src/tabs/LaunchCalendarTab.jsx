/* eslint-disable */
/* ═══════════════════════════════════════════════════════════════════
   DXB ANALYTICS — LAUNCH CALENDAR TAB
   Extracted from EmaarDashboardV2.jsx (lines 5619-5963)
   Upcoming project launches, EOI status, calendar grid, launch cards
   ═══════════════════════════════════════════════════════════════════ */

import React from "react";
import { T } from "../data";
import { SvgIcons } from "../components/Icons";
import SEED_DATA from "../utils/seedData";

/* ── Status config ── */
const LC_STATUS_CFG = {
  "EOI Open":     { color: T.green,  bg: "rgba(16,185,129,0.12)",  dot: T.green  },
  "EOI Closed":   { color: T.red,    bg: "rgba(239,68,68,0.12)",   dot: T.red    },
  "Upcoming":     { color: T.gold,   bg: "rgba(212,168,67,0.12)",  dot: T.gold   },
  "Launched":     { color: T.teal,   bg: "rgba(20,184,166,0.12)",  dot: T.teal   },
  "Sold Out":     { color: T.textMuted, bg: "rgba(255,255,255,0.05)", dot: T.textMuted },
};

const StatusBadge = ({ status }) => {
  const cfg = LC_STATUS_CFG[status] || LC_STATUS_CFG["Upcoming"];
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 20, background: cfg.bg, fontSize: 11, fontWeight: 700, color: cfg.color }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: cfg.dot, display: "inline-block", animation: status === "EOI Open" ? "pulse 2s infinite" : "none" }} />
      {status}
    </span>
  );
};

const daysUntil = (dateStr) => {
  if (!dateStr) return null;
  const diff = Math.ceil((new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return null;
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff <= 7) return `${diff} days`;
  if (diff <= 30) return `${Math.ceil(diff/7)} weeks`;
  return `${Math.ceil(diff/30)} months`;
};

const LaunchCard = ({ l }) => {
  const cfg = LC_STATUS_CFG[l.status] || LC_STATUS_CFG["Upcoming"];
  const days = daysUntil(l.launchDate);
  return (
    <div className="chart-box" style={{ padding: 18, borderLeft: `3px solid ${cfg.color}`, position: "relative" }}>
      {days && <div style={{ position: "absolute", top: 14, right: 14, fontSize: 10, fontWeight: 700, color: cfg.color, background: cfg.bg, padding: "2px 8px", borderRadius: 10 }}>{days}</div>}
      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 4 }}>{l.developer || "Developer TBC"}</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: T.white, fontFamily: "'Fraunces',serif", marginBottom: 6 }}>{l.projectName || "Project Name TBC"}</div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
          <StatusBadge status={l.status || "Upcoming"} />
          {l.community && <span style={{ fontSize: 11, color: T.textMuted }}>{l.community}</span>}
          {l.propertyType && <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 6, background: T.surfaceAlt, color: T.textMuted }}>{l.propertyType}</span>}
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 10 }}>
        <div><div style={{ fontSize: 9, color: T.textMuted, textTransform: "uppercase", marginBottom: 2 }}>Starting</div><div style={{ fontSize: 13, fontWeight: 700, color: T.gold }}>{l.startingPrice ? "AED " + (l.startingPrice/1e6).toFixed(1) + "M" : "TBC"}</div></div>
        <div><div style={{ fontSize: 9, color: T.textMuted, textTransform: "uppercase", marginBottom: 2 }}>Units</div><div style={{ fontSize: 13, fontWeight: 700, color: T.white }}>{l.totalUnits || "TBC"}</div></div>
        <div><div style={{ fontSize: 9, color: T.textMuted, textTransform: "uppercase", marginBottom: 2 }}>Payment</div><div style={{ fontSize: 13, fontWeight: 700, color: T.white }}>{l.paymentPlan || "TBC"}</div></div>
      </div>
      {l.eoiAmount && (
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
          <span style={{ fontSize: 11, color: T.textSecondary }}>EOI: <span style={{ color: T.gold, fontWeight: 700 }}>AED {(l.eoiAmount).toLocaleString()}</span></span>
          {l.eoiRefundable !== undefined && <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 4, background: l.eoiRefundable ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.12)", color: l.eoiRefundable ? T.green : T.red, fontWeight: 600 }}>{l.eoiRefundable ? "Refundable" : "Non-refundable"}</span>}
        </div>
      )}
      {l.notes && <div style={{ fontSize: 11, color: T.textMuted, lineHeight: 1.6, marginTop: 8, padding: "8px 10px", background: T.surfaceAlt, borderRadius: 8 }}>{l.notes}</div>}
      {l.launchDate && <div style={{ fontSize: 10, color: T.textMuted, marginTop: 8 }}>Launch: {new Date(l.launchDate).toLocaleDateString("en-AE", { day: "numeric", month: "short", year: "numeric" })}</div>}
    </div>
  );
};

function LaunchCalendarTab({ lcSearch, setLcSearch, lcDev, setLcDev, lcStatus, setLcStatus, lcType, setLcType, lcView, setLcView, liveMarketData, liveLaunches, handleTabChange }) {
  const rawLaunchesFirestore = liveLaunches?.length > 0 ? liveLaunches : (liveMarketData?.filter?.(d => d.type === "launch") || []);
  const rawLaunches = rawLaunchesFirestore.length > 0 ? rawLaunchesFirestore : SEED_DATA.launches;

  const filtered = rawLaunches.filter(l => {
    if (lcSearch && !JSON.stringify(l).toLowerCase().includes(lcSearch.toLowerCase())) return false;
    if (lcDev !== "All" && l.developer !== lcDev) return false;
    if (lcStatus !== "All" && l.status !== lcStatus) return false;
    if (lcType !== "All" && l.propertyType !== lcType) return false;
    return true;
  }).sort((a, b) => new Date(a.launchDate || 0) - new Date(b.launchDate || 0));

  const developers = ["All", ...new Set(rawLaunches.map(l => l.developer).filter(Boolean))];

  const selStyle = {
    background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8, color: T.white,
    fontFamily: "'Outfit',sans-serif", fontSize: 12, padding: "7px 28px 7px 10px", outline: "none", cursor: "pointer",
    appearance: "none", WebkitAppearance: "none",
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat", backgroundPosition: "right 8px center",
  };

  // Group by month
  const byMonth = {};
  filtered.forEach(l => {
    const d = l.launchDate ? new Date(l.launchDate) : null;
    const key = d ? d.toLocaleDateString("en-AE", { month: "long", year: "numeric" }) : "Date TBC";
    if (!byMonth[key]) byMonth[key] = [];
    byMonth[key].push(l);
  });

  return (
    <div style={{ animation: "fadeUp 0.4s ease-out forwards" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", marginBottom: 20, borderBottom: `1px solid ${T.border}`, flexWrap: "wrap", gap: 8 }}>
        <div>
          <div style={{ fontFamily: "'Fraunces', serif", fontSize: 20, fontWeight: 800, color: T.white }}>Launch Calendar</div>
          <div style={{ fontSize: 11, color: T.textMuted, marginTop: 3 }}>{filtered.length} launches · {filtered.filter(l => l.status === "EOI Open").length} EOI open now</div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {["list", "calendar"].map(v => (
            <button key={v} type="button" onClick={() => setLcView(v)}
              style={{ padding: "6px 14px", borderRadius: 8, border: `1px solid ${lcView === v ? T.gold : T.border}`, background: lcView === v ? "rgba(212,168,67,0.12)" : T.surfaceAlt, color: lcView === v ? T.gold : T.textMuted, fontSize: 11, cursor: "pointer", fontFamily: "'Outfit',sans-serif", fontWeight: lcView === v ? 700 : 400 }}>
              {v === "list" ? "List" : "Calendar"}
            </button>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", flex: "1 1 200px" }}>
          {SvgIcons.Search({ width: 13, height: 13, style: { position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: T.textMuted, pointerEvents: "none" } })}
          <input value={lcSearch} onChange={e => setLcSearch(e.target.value)} placeholder="Search launches..."
            style={{ width: "100%", padding: "7px 10px 7px 32px", background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8, color: T.white, fontFamily: "'Outfit',sans-serif", fontSize: 12, outline: "none" }} />
        </div>
        <select value={lcDev} onChange={e => setLcDev(e.target.value)} style={selStyle}>{developers.map(d => <option key={d} value={d}>{d}</option>)}</select>
        <select value={lcStatus} onChange={e => setLcStatus(e.target.value)} style={selStyle}>{["All","EOI Open","Upcoming","Launched","EOI Closed","Sold Out"].map(s => <option key={s} value={s}>{s}</option>)}</select>
        <select value={lcType} onChange={e => setLcType(e.target.value)} style={selStyle}>{["All","Apartment","Villa","Townhouse"].map(t => <option key={t} value={t}>{t}</option>)}</select>
      </div>

      {/* Status summary */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {Object.entries(LC_STATUS_CFG).map(([status, cfg]) => {
          const count = filtered.filter(l => l.status === status).length;
          if (!count) return null;
          return <div key={status} style={{ padding: "6px 14px", borderRadius: 10, background: cfg.bg, border: `1px solid ${cfg.color}30`, display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: cfg.dot }} />
            <span style={{ fontSize: 12, color: cfg.color, fontWeight: 600 }}>{count} {status}</span>
          </div>;
        })}
      </div>

      {/* List view */}
      {lcView === "list" && (
        <div>
          {Object.entries(byMonth).map(([month, launches]) => (
            <div key={month} style={{ marginBottom: 28 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.gold, fontFamily: "'Fraunces',serif" }}>{month}</div>
                <div style={{ flex: 1, height: 1, background: T.border }} />
                <div style={{ fontSize: 11, color: T.textMuted }}>{launches.length} launch{launches.length > 1 ? "es" : ""}</div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 14 }}>
                {launches.map((l, i) => <LaunchCard key={i} l={l} />)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Calendar view */}
      {lcView === "calendar" && filtered.length > 0 && (
        <div className="chart-box" style={{ padding: 20, marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.white, marginBottom: 16 }}>{new Date().toLocaleDateString("en-AE", { month: "long", year: "numeric" })}</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 8 }}>
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
              <div key={d} style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, textAlign: "center", padding: "4px 0" }}>{d}</div>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
            {(() => {
              const now = new Date();
              const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).getDay();
              const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
              const cells = [];
              for (let i = 0; i < firstDay; i++) cells.push(<div key={`e${i}`} />);
              for (let d = 1; d <= daysInMonth; d++) {
                const dateStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
                const dayLaunches = filtered.filter(l => l.launchDate?.startsWith(dateStr));
                const isToday = d === now.getDate();
                cells.push(
                  <div key={d} style={{ minHeight: 44, borderRadius: 8, padding: "4px 6px", background: dayLaunches.length > 0 ? "rgba(212,168,67,0.1)" : isToday ? "rgba(255,255,255,0.06)" : "transparent", border: `1px solid ${isToday ? "rgba(212,168,67,0.4)" : dayLaunches.length > 0 ? "rgba(212,168,67,0.2)" : T.border}` }}>
                    <div style={{ fontSize: 11, fontWeight: isToday ? 700 : 400, color: isToday ? T.gold : T.textMuted, marginBottom: 2 }}>{d}</div>
                    {dayLaunches.map((l, i) => (
                      <div key={i} style={{ fontSize: 9, fontWeight: 700, color: LC_STATUS_CFG[l.status]?.color || T.gold, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{l.projectName?.substring(0, 10) || "Launch"}</div>
                    ))}
                  </div>
                );
              }
              return cells;
            })()}
          </div>
        </div>
      )}

      {/* Quick nav */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {[{ label: "Browse Projects →", tab: "Projects" }, { label: "Dev Portal →", tab: "Dev Portal" }, { label: "DLD Volumes →", tab: "DLD Volumes" }].map((n, i) => (
          <button key={i} type="button" onClick={() => handleTabChange(n.tab)}
            style={{ padding: "6px 14px", background: "rgba(212,168,67,0.06)", border: `1px solid ${T.border}`, borderRadius: 8, color: T.gold, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>{n.label}</button>
        ))}
      </div>

      {/* Sources */}
      <div style={{ paddingTop: 12, borderTop: `1px solid ${T.border}`, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <span style={{ fontSize: 10, color: T.textMuted }}>Sources:</span>
        {["Developer Portals", "Bayut Launch Radar", "Property Finder", "Admin Manual Entry"].map((s, i) => (
          <span key={i} style={{ fontSize: 10, color: T.textMuted, padding: "2px 8px", borderRadius: 10, border: `1px solid ${T.border}`, background: T.surfaceAlt }}>{s}</span>
        ))}
      </div>
    </div>
  );
}

export default LaunchCalendarTab;
