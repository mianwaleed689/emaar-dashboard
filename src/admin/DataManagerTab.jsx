/**
 * DXB ANALYTICS — DATA MANAGER TAB (Redesigned)
 * src/admin/DataManagerTab.jsx
 *
 * - All edits write directly to Firestore → dashboard updates instantly via onSnapshot
 * - Communities: 15 Emaar communities (matches data_emaar_complete.js)
 * - Projects: 48 static + Firestore overrides
 * - Clean, professional dark UI matching DXB Analytics theme
 */

import React, { useState, useEffect, useRef } from "react";
import {
  collection, doc, setDoc, updateDoc, deleteDoc,
  onSnapshot, serverTimestamp, writeBatch
} from "firebase/firestore";
import { db } from "../firebase";

// ── Theme ──────────────────────────────────────────────────────────────────────
const T = {
  bg:         "#04090F",
  surface:    "#0A1118",
  surfaceAlt: "#0F1A24",
  border:     "rgba(255,255,255,0.07)",
  borderHover:"rgba(212,168,67,0.35)",
  gold:       "#D4A843",
  goldDim:    "rgba(212,168,67,0.15)",
  green:      "#10B981",
  greenDim:   "rgba(16,185,129,0.12)",
  red:        "#EF4444",
  redDim:     "rgba(239,68,68,0.12)",
  blue:       "#3B82F6",
  blueDim:    "rgba(59,130,246,0.12)",
  teal:       "#14B8A6",
  white:      "#F8FAFC",
  muted:      "#64748B",
  text2:      "#94A3B8",
};

// ── Emaar Communities (matches data_emaar_complete.js) ─────────────────────────
const EMAAR_COMMUNITIES = [
  { id:"DHE",  name:"Dubai Hills Estate",       projects:34, type:"Master Community" },
  { id:"DCH",  name:"Dubai Creek Harbour",      projects:35, type:"Waterfront" },
  { id:"TV",   name:"The Valley",               projects:30, type:"Suburban Villas" },
  { id:"RYM",  name:"Mina Rashid",              projects:22, type:"Marina Heritage" },
  { id:"ES",   name:"Emaar South",              projects:24, type:"Golf & Airport" },
  { id:"AR3",  name:"Arabian Ranches 3",        projects:15, type:"Family Villas" },
  { id:"GPC",  name:"Grand Polo Club & Resort", projects:12, type:"Polo Lifestyle" },
  { id:"EBF",  name:"Emaar Beachfront",         projects:11, type:"Beachfront Island" },
  { id:"TO",   name:"The Oasis",                projects:11, type:"Ultra-Luxury Villas" },
  { id:"DT",   name:"Downtown Dubai",           projects:5,  type:"Iconic CBD" },
  { id:"TH",   name:"The Heights CW",           projects:3,  type:"Wellness Community" },
  { id:"DM",   name:"Dubai Marina",             projects:2,  type:"Waterfront" },
  { id:"EC",   name:"Expo City",                projects:2,  type:"Expo Legacy" },
  { id:"ZB",   name:"Zabeel",                   projects:1,  type:"Urban Luxury" },
  { id:"BB",   name:"Business Bay",             projects:1,  type:"CBD" },
];

const RISK_OPTIONS  = ["Low", "Low-Medium", "Medium", "High"];
const VISA_OPTIONS  = ["Yes", "No"];

// ── Small reusable components ──────────────────────────────────────────────────

function Badge({ children, color = T.gold }) {
  return (
    <span style={{
      fontSize: 9, fontWeight: 700, letterSpacing: 0.8, textTransform: "uppercase",
      padding: "3px 8px", borderRadius: 20,
      background: color + "18", color, border: `1px solid ${color}30`,
    }}>{children}</span>
  );
}

function Btn({ children, onClick, variant = "ghost", size = "sm", danger, style = {} }) {
  const base = {
    cursor: "pointer", fontFamily: "'Outfit',sans-serif", fontWeight: 600,
    borderRadius: 8, transition: "all 0.15s", border: "1px solid",
    fontSize: size === "sm" ? 11 : 13,
    padding: size === "sm" ? "6px 14px" : "9px 20px",
  };
  const variants = {
    primary: { background: T.gold, color: "#000", borderColor: T.gold },
    ghost:   { background: "transparent", color: T.text2, borderColor: T.border },
    danger:  { background: T.redDim, color: T.red, borderColor: T.red + "40" },
    success: { background: T.greenDim, color: T.green, borderColor: T.green + "40" },
  };
  const v = danger ? variants.danger : variants[variant] || variants.ghost;
  return (
    <button type="button" onClick={onClick} style={{ ...base, ...v, ...style }}
      onMouseEnter={e => { e.currentTarget.style.opacity = "0.8"; e.currentTarget.style.transform = "translateY(-1px)"; }}
      onMouseLeave={e => { e.currentTarget.style.opacity = "1";  e.currentTarget.style.transform = "translateY(0)"; }}>
      {children}
    </button>
  );
}

function Input({ label, value, onChange, type = "text", placeholder, min, max, step }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {label && <label style={{ fontSize: 9, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: 0.8 }}>{label}</label>}
      <input
        type={type} value={value ?? ""} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} min={min} max={max} step={step}
        style={{
          padding: "8px 12px", background: T.surfaceAlt, border: `1px solid ${T.border}`,
          borderRadius: 8, color: T.white, fontSize: 13, fontFamily: "'Outfit',sans-serif",
          outline: "none", width: "100%", boxSizing: "border-box",
        }}
        onFocus={e => { e.currentTarget.style.borderColor = T.gold; }}
        onBlur={e =>  { e.currentTarget.style.borderColor = T.border; }}
      />
    </div>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {label && <label style={{ fontSize: 9, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: 0.8 }}>{label}</label>}
      <select
        value={value ?? ""} onChange={e => onChange(e.target.value)}
        style={{
          padding: "8px 12px", background: T.surfaceAlt, border: `1px solid ${T.border}`,
          borderRadius: 8, color: T.white, fontSize: 13, fontFamily: "'Outfit',sans-serif",
          outline: "none", width: "100%", cursor: "pointer",
        }}
        onFocus={e => { e.currentTarget.style.borderColor = T.gold; }}
        onBlur={e =>  { e.currentTarget.style.borderColor = T.border; }}>
        {options.map(o => (
          <option key={o.value ?? o} value={o.value ?? o} style={{ background: T.surfaceAlt }}>
            {o.label ?? o}
          </option>
        ))}
      </select>
    </div>
  );
}

function StatCard({ label, value, sub, color = T.gold }) {
  return (
    <div style={{
      background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12,
      padding: "16px 18px", display: "flex", flexDirection: "column", gap: 4,
    }}>
      <div style={{ fontSize: 9, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: 0.8 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 900, color, fontFamily: "'Fraunces',serif" }}>{value}</div>
      {sub && <div style={{ fontSize: 10, color: T.muted }}>{sub}</div>}
    </div>
  );
}

function Toast({ msg, type }) {
  if (!msg) return null;
  const color = type === "error" ? T.red : T.green;
  return (
    <div style={{
      position: "fixed", bottom: 24, right: 24, zIndex: 9999,
      background: T.surface, border: `1px solid ${color}50`,
      borderRadius: 10, padding: "12px 20px", display: "flex", alignItems: "center", gap: 10,
      boxShadow: `0 8px 32px ${color}20`, fontSize: 13, color: T.white,
      animation: "fadeIn 0.2s ease",
    }}>
      <span style={{ color }}>{type === "error" ? "✕" : "✓"}</span>
      {msg}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function DataManagerTab({ emaarProjects = [], T: themeOverride }) {
  const [activeTab, setActiveTab] = useState("projects");
  const [liveOverrides, setLiveOverrides]   = useState({});
  const [communityData, setCommunityData]   = useState({});
  const [saving, setSaving]   = useState(false);
  const [toast, setToast]     = useState({ msg: "", type: "success" });
  const [search, setSearch]   = useState("");
  const [filterCommunity, setFilterCommunity] = useState("All");
  const [editProject, setEditProject] = useState(null);
  const [editCommunity, setEditCommunity] = useState(null);
  const [editForm, setEditForm] = useState({});
  const toastTimer = useRef(null);

  // ── Firestore listeners ────────────────────────────────────────────────────
  useEffect(() => {
    const u1 = onSnapshot(collection(db, "projectData"), snap => {
      const map = {};
      snap.forEach(d => { map[d.id] = d.data(); });
      setLiveOverrides(map);
    });
    const u2 = onSnapshot(collection(db, "communityROI"), snap => {
      const map = {};
      snap.forEach(d => { map[d.id] = d.data(); });
      setCommunityData(map);
    });
    return () => { u1(); u2(); };
  }, []);

  function notify(msg, type = "success") {
    setToast({ msg, type });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast({ msg: "", type: "success" }), 3000);
  }

  // ── Merged project list ────────────────────────────────────────────────────
  const mergedProjects = emaarProjects.map(p => {
    const ov = liveOverrides[p.id] || {};
    return { ...p, ...ov, _hasOverride: Object.keys(ov).length > 0 };
  });

  const filtered = mergedProjects.filter(p => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
    const matchComm   = filterCommunity === "All" || p.community === filterCommunity;
    return matchSearch && matchComm;
  });

  // ── Save project override to Firestore ────────────────────────────────────
  async function saveProject(projectId, data) {
    setSaving(true);
    try {
      await setDoc(doc(db, "projectData", String(projectId)), {
        ...data,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      notify(`✓ ${data.name || projectId} saved — dashboard updated`);
      setEditProject(null);
    } catch (e) {
      notify("Save failed: " + e.message, "error");
    }
    setSaving(false);
  }

  // ── Save community data to Firestore ─────────────────────────────────────
  async function saveCommunity(communityId, data) {
    setSaving(true);
    try {
      await setDoc(doc(db, "communityROI", communityId), {
        ...data,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      notify(`✓ ${communityId} community data saved — dashboard updated`);
      setEditCommunity(null);
    } catch (e) {
      notify("Save failed: " + e.message, "error");
    }
    setSaving(false);
  }

  // ── Stats ─────────────────────────────────────────────────────────────────
  const liveCount   = Object.keys(liveOverrides).length;
  const commCount   = Object.keys(communityData).length;
  const avgYield    = EMAAR_COMMUNITIES.reduce((s, c) => {
    const d = communityData[c.id];
    return s + (d?.grossYield?.apt1 || 6);
  }, 0) / EMAAR_COMMUNITIES.length;

  // ── Project Edit Modal ─────────────────────────────────────────────────────
  function openProjectEdit(p) {
    setEditProject(p);
    setEditForm({
      name:         p.name,
      price:        p.price,
      ppsf:         p.ppsf,
      construction: p.construction,
      status:       p.status,
      handover:     p.handover,
      payment:      p.payment,
    });
  }

  // ── Community Edit Modal ───────────────────────────────────────────────────
  function openCommunityEdit(c) {
    const d = communityData[c.id] || {};
    setEditCommunity(c);
    setEditForm({
      grossYield_apt1:    d.grossYield?.apt1   || 6,
      grossYield_apt2:    d.grossYield?.apt2   || 5.5,
      grossYield_apt3:    d.grossYield?.apt3   || 5,
      grossYield_th:      d.grossYield?.th     || 5,
      grossYield_villa:   d.grossYield?.villa  || 4.5,
      netYield_apt1:      d.netYield?.apt1     || 5,
      netYield_apt2:      d.netYield?.apt2     || 4.5,
      netYield_apt3:      d.netYield?.apt3     || 4,
      netYield_th:        d.netYield?.th       || 4,
      netYield_villa:     d.netYield?.villa    || 3.8,
      estRent_apt1:       d.estRent?.apt1      || 100000,
      estRent_apt2:       d.estRent?.apt2      || 145000,
      estRent_apt3:       d.estRent?.apt3      || 195000,
      estRent_th:         d.estRent?.th        || 160000,
      estRent_villa:      d.estRent?.villa     || 280000,
      appreciationYoY:    d.appreciationYoY    || 12,
      appreciation5yr:    d.appreciation5yr    || 38,
      occupancy:          d.occupancy          || 94,
      riskLevel:          d.riskLevel          || "Low",
      serviceCharge:      d.serviceCharge      || 18,
      avgDaysToLease:     d.avgDaysToLease     || 12,
      shortTermPremium:   d.shortTermPremium   || 35,
      goldenVisa:         d.goldenVisa         || "Yes",
      capitalGrowthDriver: d.capitalGrowthDriver || "",
    });
  }

  async function submitCommunityEdit() {
    if (!editCommunity) return;
    const f = editForm;
    const payload = {
      grossYield:   { apt1: +f.grossYield_apt1, apt2: +f.grossYield_apt2, apt3: +f.grossYield_apt3, th: +f.grossYield_th, villa: +f.grossYield_villa },
      netYield:     { apt1: +f.netYield_apt1,   apt2: +f.netYield_apt2,   apt3: +f.netYield_apt3,   th: +f.netYield_th,   villa: +f.netYield_villa },
      estRent:      { apt1: +f.estRent_apt1,     apt2: +f.estRent_apt2,   apt3: +f.estRent_apt3,   th: +f.estRent_th,    villa: +f.estRent_villa },
      appreciationYoY:   +f.appreciationYoY,
      appreciation5yr:   +f.appreciation5yr,
      occupancy:         +f.occupancy,
      riskLevel:          f.riskLevel,
      serviceCharge:     +f.serviceCharge,
      avgDaysToLease:    +f.avgDaysToLease,
      shortTermPremium:  +f.shortTermPremium,
      goldenVisa:         f.goldenVisa,
      capitalGrowthDriver: f.capitalGrowthDriver,
    };
    await saveCommunity(editCommunity.id, payload);
  }

  const TABS = [
    { id: "projects",    label: "Projects", count: mergedProjects.length },
    { id: "communities", label: "Communities", count: EMAAR_COMMUNITIES.length },
  ];

  return (
    <div style={{ fontFamily: "'Outfit',sans-serif", color: T.white, minHeight: "100vh", padding: "0 0 40px" }}>
      <style>{`
        @keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(212,168,67,0.3); border-radius: 2px; }
      `}</style>

      <Toast msg={toast.msg} type={toast.type} />

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 900, fontFamily: "'Fraunces',serif", color: T.white, margin: 0 }}>
              Data Manager
            </h1>
            <p style={{ fontSize: 12, color: T.muted, margin: "4px 0 0" }}>
              All changes publish instantly to the dashboard via Firestore
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, color: T.green,
            background: T.greenDim, padding: "6px 14px", borderRadius: 20, border: `1px solid ${T.green}30` }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: T.green, display: "inline-block" }} />
            Live — changes publish instantly
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 10, marginBottom: 20 }}>
          <StatCard label="Total Projects"   value={mergedProjects.length} sub="Emaar curated"           color={T.gold} />
          <StatCard label="Communities"      value={EMAAR_COMMUNITIES.length} sub="Active areas"         color={T.teal} />
          <StatCard label="Live Overrides"   value={liveCount}             sub="Firestore updates"       color={T.green} />
          <StatCard label="Avg Gross Yield"  value={avgYield.toFixed(1) + "%"} sub="Portfolio average"  color={T.blue} />
        </div>

        {/* Tab switcher */}
        <div style={{ display: "flex", gap: 4, borderBottom: `1px solid ${T.border}`, marginBottom: 20 }}>
          {TABS.map(t => (
            <button key={t.id} type="button" onClick={() => setActiveTab(t.id)} style={{
              padding: "10px 18px", background: "none", border: "none",
              borderBottom: activeTab === t.id ? `2px solid ${T.gold}` : "2px solid transparent",
              color: activeTab === t.id ? T.gold : T.muted,
              fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit',sans-serif",
              display: "flex", alignItems: "center", gap: 8,
            }}>
              {t.label}
              <span style={{
                fontSize: 10, fontWeight: 700, background: activeTab === t.id ? T.goldDim : "rgba(255,255,255,0.05)",
                color: activeTab === t.id ? T.gold : T.muted,
                padding: "2px 7px", borderRadius: 10,
              }}>{t.count}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Projects Tab ──────────────────────────────────────────────────── */}
      {activeTab === "projects" && (
        <div>
          {/* Search + Filter */}
          <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
            <input
              type="text" placeholder="🔍  Search projects..."
              value={search} onChange={e => setSearch(e.target.value)}
              style={{
                flex: 1, minWidth: 200, padding: "9px 14px",
                background: T.surface, border: `1px solid ${T.border}`,
                borderRadius: 8, color: T.white, fontSize: 13,
                fontFamily: "'Outfit',sans-serif", outline: "none",
              }}
            />
            <select
              value={filterCommunity} onChange={e => setFilterCommunity(e.target.value)}
              style={{
                padding: "9px 14px", background: T.surface, border: `1px solid ${T.border}`,
                borderRadius: 8, color: T.white, fontSize: 13,
                fontFamily: "'Outfit',sans-serif", outline: "none", cursor: "pointer",
              }}>
              <option value="All">All Communities</option>
              {EMAAR_COMMUNITIES.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
            <div style={{ fontSize: 12, color: T.muted, display: "flex", alignItems: "center" }}>
              Showing {filtered.length} of {mergedProjects.length}
            </div>
          </div>

          {/* Project Table */}
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, overflow: "hidden" }}>
            {/* Table header */}
            <div style={{
              display: "grid", gridTemplateColumns: "1fr 160px 90px 90px 100px 100px 80px",
              padding: "10px 16px", borderBottom: `1px solid ${T.border}`,
              fontSize: 9, fontWeight: 700, color: T.muted, letterSpacing: 0.8, textTransform: "uppercase",
            }}>
              <span>Project</span><span>Community</span><span>Price</span><span>PPSF</span>
              <span>Status</span><span>Handover</span><span style={{ textAlign: "right" }}>Edit</span>
            </div>

            {/* Rows */}
            <div style={{ maxHeight: 520, overflowY: "auto" }}>
              {filtered.map((p, i) => (
                <div key={p.id} style={{
                  display: "grid", gridTemplateColumns: "1fr 160px 90px 90px 100px 100px 80px",
                  padding: "11px 16px", borderBottom: `1px solid ${T.border}`,
                  background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)",
                  alignItems: "center", transition: "background 0.1s",
                }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(212,168,67,0.04)"}
                  onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)"}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: T.white }}>{p.name}</span>
                    {p._hasOverride && <Badge color={T.green}>LIVE</Badge>}
                    {p.branded && <Badge color={T.gold}>{p.brand}</Badge>}
                  </div>
                  <span style={{ fontSize: 12, color: T.text2 }}>{p.community}</span>
                  <span style={{ fontSize: 12, color: T.gold, fontWeight: 600 }}>
                    {p.price ? "AED " + (p.price / 1e6).toFixed(2) + "M" : "—"}
                  </span>
                  <span style={{ fontSize: 12, color: T.text2 }}>{p.ppsf?.toLocaleString() || "—"}</span>
                  <span>
                    <Badge color={p.status === "Ready" ? T.green : p.status?.includes("Off") ? T.blue : T.gold}>
                      {p.status === "Under Construction" ? "U/C" : p.status || "—"}
                    </Badge>
                  </span>
                  <span style={{ fontSize: 12, color: T.text2 }}>{p.handover}</span>
                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <Btn onClick={() => openProjectEdit(p)}>Edit →</Btn>
                  </div>
                </div>
              ))}
              {filtered.length === 0 && (
                <div style={{ padding: 40, textAlign: "center", color: T.muted, fontSize: 13 }}>
                  No projects match your search
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Communities Tab ───────────────────────────────────────────────── */}
      {activeTab === "communities" && (
        <div>
          <p style={{ fontSize: 12, color: T.muted, marginBottom: 16 }}>
            Edit investment data (yields, rents, appreciation) for each community. All changes reflect instantly on the dashboard ROI calculator.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 10 }}>
            {EMAAR_COMMUNITIES.map(c => {
              const d = communityData[c.id] || {};
              const hasData = !!communityData[c.id];
              const yield1 = d.grossYield?.apt1;
              return (
                <div key={c.id} style={{
                  background: T.surface, border: `1px solid ${hasData ? T.green + "30" : T.border}`,
                  borderRadius: 12, padding: "16px 18px", cursor: "pointer",
                  transition: "all 0.15s", position: "relative", overflow: "hidden",
                }}
                  onClick={() => openCommunityEdit(c)}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = T.gold + "50"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = hasData ? T.green + "30" : T.border; e.currentTarget.style.transform = "translateY(0)"; }}
                >
                  {/* Top accent */}
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2,
                    background: hasData ? `linear-gradient(90deg,${T.green},${T.teal})` : `linear-gradient(90deg,${T.gold},${T.gold}40)` }} />

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: T.white }}>{c.name}</div>
                      <div style={{ fontSize: 10, color: T.muted, marginTop: 2 }}>{c.type} · {c.projects} projects</div>
                    </div>
                    <Badge color={hasData ? T.green : T.muted}>{hasData ? "LIVE" : "DEFAULT"}</Badge>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
                    {[
                      { label: "Gross Yield", value: yield1 ? yield1 + "%" : "—" },
                      { label: "Occupancy",   value: d.occupancy ? d.occupancy + "%" : "—" },
                      { label: "5yr Growth",  value: d.appreciation5yr ? "+" + d.appreciation5yr + "%" : "—" },
                    ].map(k => (
                      <div key={k.label} style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 8, color: T.muted, textTransform: "uppercase", letterSpacing: 0.5 }}>{k.label}</div>
                        <div style={{ fontSize: 15, fontWeight: 800, color: hasData ? T.gold : T.muted, fontFamily: "'Fraunces',serif" }}>{k.value}</div>
                      </div>
                    ))}
                  </div>

                  <Btn size="sm" variant="ghost" style={{ width: "100%", textAlign: "center" }}>
                    {hasData ? "Edit Investment Data →" : "Set Investment Data →"}
                  </Btn>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Project Edit Modal ─────────────────────────────────────────────── */}
      {editProject && (
        <Modal title={`Edit: ${editProject.name}`} onClose={() => setEditProject(null)}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Input label="Starting Price (AED)" type="number" value={editForm.price}
              onChange={v => setEditForm(f => ({ ...f, price: +v }))} />
            <Input label="Price/sqft (AED)" type="number" value={editForm.ppsf}
              onChange={v => setEditForm(f => ({ ...f, ppsf: +v }))} />
            <Select label="Status" value={editForm.status}
              onChange={v => setEditForm(f => ({ ...f, status: v }))}
              options={["Off-Plan", "Off Plan", "Under Construction", "Ready", "Delivered"]} />
            <Input label="Handover" value={editForm.handover} placeholder="e.g. Q4 2027"
              onChange={v => setEditForm(f => ({ ...f, handover: v }))} />
            <Input label="Payment Plan" value={editForm.payment} placeholder="e.g. 80/20"
              onChange={v => setEditForm(f => ({ ...f, payment: v }))} />
            <Input label="Construction %" type="number" min={0} max={100} value={editForm.construction}
              onChange={v => setEditForm(f => ({ ...f, construction: +v }))} />
          </div>

          {/* Construction progress bar */}
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 10, color: T.muted, marginBottom: 6 }}>Construction Progress Preview</div>
            <div style={{ background: T.surfaceAlt, borderRadius: 4, height: 6, overflow: "hidden" }}>
              <div style={{ width: `${editForm.construction}%`, height: "100%",
                background: `linear-gradient(90deg, ${T.gold}, ${T.green})`, borderRadius: 4, transition: "width 0.3s" }} />
            </div>
            <div style={{ fontSize: 11, color: T.gold, marginTop: 4, fontWeight: 700 }}>{editForm.construction}%</div>
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 20, justifyContent: "flex-end" }}>
            <Btn onClick={() => setEditProject(null)}>Cancel</Btn>
            <Btn variant="primary" onClick={() => saveProject(editProject.id, editForm)} style={{ opacity: saving ? 0.7 : 1 }}>
              {saving ? "Saving…" : "Publish → Live"}
            </Btn>
          </div>
        </Modal>
      )}

      {/* ── Community Edit Modal ───────────────────────────────────────────── */}
      {editCommunity && (
        <Modal title={`${editCommunity.name} — Investment Data`} onClose={() => setEditCommunity(null)} wide>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10, marginBottom: 16 }}>
            {["apt1","apt2","apt3","th","villa"].map((k, i) => (
              <div key={k} style={{ background: T.surfaceAlt, borderRadius: 10, padding: 12 }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: T.gold, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 }}>
                  {["1BR","2BR","3BR","TH","Villa"][i]}
                </div>
                <Input label="Gross %" type="number" step="0.1" value={editForm[`grossYield_${k}`]}
                  onChange={v => setEditForm(f => ({ ...f, [`grossYield_${k}`]: v }))} />
                <div style={{ marginTop: 8 }}>
                  <Input label="Net %" type="number" step="0.1" value={editForm[`netYield_${k}`]}
                    onChange={v => setEditForm(f => ({ ...f, [`netYield_${k}`]: v }))} />
                </div>
                <div style={{ marginTop: 8 }}>
                  <Input label="Rent AED/yr" type="number" value={editForm[`estRent_${k}`]}
                    onChange={v => setEditForm(f => ({ ...f, [`estRent_${k}`]: v }))} />
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 16 }}>
            <Input label="5-yr Appreciation %" type="number" value={editForm.appreciation5yr}
              onChange={v => setEditForm(f => ({ ...f, appreciation5yr: v }))} />
            <Input label="YoY Growth %" type="number" value={editForm.appreciationYoY}
              onChange={v => setEditForm(f => ({ ...f, appreciationYoY: v }))} />
            <Input label="Occupancy %" type="number" value={editForm.occupancy}
              onChange={v => setEditForm(f => ({ ...f, occupancy: v }))} />
            <Select label="Risk Level" value={editForm.riskLevel}
              onChange={v => setEditForm(f => ({ ...f, riskLevel: v }))} options={RISK_OPTIONS} />
            <Input label="Service Charge (AED/sqft)" type="number" value={editForm.serviceCharge}
              onChange={v => setEditForm(f => ({ ...f, serviceCharge: v }))} />
            <Input label="Avg Days to Lease" type="number" value={editForm.avgDaysToLease}
              onChange={v => setEditForm(f => ({ ...f, avgDaysToLease: v }))} />
            <Input label="Short-Term Premium %" type="number" value={editForm.shortTermPremium}
              onChange={v => setEditForm(f => ({ ...f, shortTermPremium: v }))} />
            <Select label="Golden Visa Eligible" value={editForm.goldenVisa}
              onChange={v => setEditForm(f => ({ ...f, goldenVisa: v }))} options={VISA_OPTIONS} />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 9, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: 0.8, display: "block", marginBottom: 6 }}>
              Capital Growth Driver
            </label>
            <textarea value={editForm.capitalGrowthDriver}
              onChange={e => setEditForm(f => ({ ...f, capitalGrowthDriver: e.target.value }))}
              rows={2} placeholder="e.g. Metro expansion, new mall, limited supply..."
              style={{
                width: "100%", padding: "10px 12px", background: T.surfaceAlt,
                border: `1px solid ${T.border}`, borderRadius: 8, color: T.white,
                fontSize: 13, fontFamily: "'Outfit',sans-serif", resize: "vertical", outline: "none",
              }}
            />
          </div>

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <Btn onClick={() => setEditCommunity(null)}>Cancel</Btn>
            <Btn variant="primary" onClick={submitCommunityEdit} style={{ opacity: saving ? 0.7 : 1 }}>
              {saving ? "Saving…" : "Publish → Live"}
            </Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── Modal wrapper ──────────────────────────────────────────────────────────────
function Modal({ title, children, onClose, wide = false }) {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
    }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        background: "#0A1118", border: "1px solid rgba(212,168,67,0.2)",
        borderRadius: 16, padding: 28, width: "100%",
        maxWidth: wide ? 900 : 560, maxHeight: "90vh", overflowY: "auto",
        animation: "fadeIn 0.2s ease",
        boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <h2 style={{ fontFamily: "'Fraunces',serif", fontSize: 18, fontWeight: 900, color: "#F8FAFC", margin: 0 }}>{title}</h2>
          <button type="button" onClick={onClose} style={{
            background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 8, color: "#94A3B8", fontSize: 16, cursor: "pointer",
            padding: "4px 10px", fontFamily: "'Outfit',sans-serif",
          }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}
