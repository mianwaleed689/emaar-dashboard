/**
 * DXB Analytics — S15: Admin Data Health Dashboard
 * File: src/AdminDataHealth.jsx
 *
 * INSTRUCTIONS FOR ADDING TO AdminPanel.jsx:
 * 1. Import this at top of AdminPanel.jsx:
 *    import AdminDataHealth from "./AdminDataHealth";
 * 2. Add tab button in admin sidebar:
 *    { key: "data_health", label: "Data Health", icon: <HeartIcon /> }
 * 3. Add tab render in tab content area:
 *    {adminTab === "data_health" && <AdminDataHealth db={db} T={T} />}
 *
 * S15 SPEC (from master plan):
 * - All data feeds shown: last fetch time, next run, status (green/yellow/red)
 * - Force-refresh button for each feed
 * - Alert log (failed fetches, anomalies from adminAlerts)
 * - Market Data Editor — admin updates globalMarket fields
 * - ValuStrat / Knight Frank update form
 * - The nerve centre of the live data platform
 *
 * ALSO FIXES (from S15 audit):
 * - Mortgage tab EIBOR path fixed in EmaarDashboardV2.jsx
 * - Admin news pin/unpin UI built here
 *
 * Iron Rule: NEVER run npx vercel --prod — use git push only
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  collection, doc, getDoc, getDocs, setDoc, updateDoc,
  onSnapshot, query, orderBy, limit, serverTimestamp
} from "firebase/firestore";

// ── Cron feed definitions — matches vercel.json schedules ──────────────────
const CRON_FEEDS = [
  {
    id:        "eibor",
    name:      "EIBOR Rates",
    icon:      "📊",
    firestorePath: { collection: "marketData", doc: "eibor" },
    schedule:  "Daily 11:30 AM UAE",
    cronExpr:  "30 7 * * *",
    endpoint:  "/api/cron-eibor",
    greenDays: 1,
    yellowDays:7,
    description: "CBUAE EIBOR rates (overnight → 12M) — 4-source waterfall",
  },
  {
    id:        "news",
    name:      "News Feed",
    icon:      "📰",
    firestorePath: { collection: "tabData", doc: "news" },
    schedule:  "Daily 6:30 AM UAE",
    cronExpr:  "30 2 * * *",
    endpoint:  "/api/cron-news",
    greenDays: 1,
    yellowDays:3,
    description: "6 RSS sources — Arabian Business, PropertyNews.ae, Gulf Business, Gulf News, The National, Khaleej Times",
  },
  {
    id:        "yields",
    name:      "Rental Yields",
    icon:      "🏡",
    firestorePath: { collection: "tabData", doc: "yieldSummary" },
    schedule:  "Sunday 7:00 AM UAE",
    cronExpr:  "0 3 * * 0",
    endpoint:  "/api/cron-yields",
    greenDays: 7,
    yellowDays:14,
    description: "Bayut API — 11 Emaar communities × 4 unit types → gross yield",
  },
  {
    id:        "financials",
    name:      "Developer Financials",
    icon:      "💹",
    firestorePath: { collection: "developers", doc: "emaar" },
    schedule:  "Sunday 8:00 AM UAE",
    cronExpr:  "0 4 * * 0",
    endpoint:  "/api/cron-financials",
    greenDays: 7,
    yellowDays:30,
    description: "Yahoo Finance — EMAAR.AE + EMAARDEV.AE — 4-method fallback",
  },
  {
    id:        "dld",
    name:      "DLD Transactions",
    icon:      "🏗️",
    firestorePath: { collection: "marketData", doc: "global" },
    schedule:  "Daily 7:00 AM UAE",
    cronExpr:  "0 3 * * *",
    endpoint:  "/api/cron-dld-daily",
    greenDays: 1,
    yellowDays:7,
    description: "Dubai Pulse DLD API — daily transactions → communityData + marketData/global",
    pending:   true,
    pendingReason: "DLD API keys pending from dubaipulse.gov.ae",
  },
];

// ── Global market fields for editor ───────────────────────────────────────
const GLOBAL_MARKET_FIELDS = [
  { key: "totalMarketValue",  label: "Total Market Value",  placeholder: "e.g. AED 682.5B",  hint: "DLD annual — update Jan each year" },
  { key: "totalTransactions", label: "Total Transactions",  placeholder: "e.g. 214,912",      hint: "DLD annual" },
  { key: "avgPpsf",           label: "Avg Price per sqft",  placeholder: "e.g. AED 1,689",    hint: "ValuStrat monthly VPI" },
  { key: "avgPpsfYoy",        label: "PPSF YoY Change",     placeholder: "e.g. +19.8%",       hint: "ValuStrat YoY" },
  { key: "yoyGrowth",         label: "Market YoY Growth",   placeholder: "e.g. +30.64%",      hint: "DLD annual" },
  { key: "offPlanShare",      label: "Off-Plan Share",       placeholder: "e.g. 60%+",         hint: "DLD annual" },
  { key: "topBuyer",          label: "Top Buyer Nationality",placeholder: "e.g. Indian (22%)", hint: "DLD annual" },
  { key: "cashBuyerPct",      label: "Cash Buyer %",         placeholder: "e.g. 87",           hint: "DLD annual" },
  { key: "avgGrossYield",     label: "City Avg Gross Yield", placeholder: "e.g. 6.9",          hint: "REIDIN/Bayut — monthly" },
  { key: "period",            label: "Data Period",          placeholder: "e.g. FY 2025",      hint: "Update when data changes" },
];

const VALUSTRAT_FIELDS = [
  { key: "valuStratIndex", label: "ValuStrat VPI",      placeholder: "e.g. 158.89" },
  { key: "valuStratYoy",   label: "ValuStrat YoY",      placeholder: "e.g. +19.8%" },
  { key: "valuStratDate",  label: "Report Date",         placeholder: "e.g. Feb 2026" },
];

const KNIGHT_FRANK_FIELDS = [
  { key: "kfAvgPpsf",      label: "KF Avg PPSF",        placeholder: "e.g. 1689" },
  { key: "kfForecast2026", label: "KF 2026 Forecast",   placeholder: "e.g. +3%" },
  { key: "kfReportDate",   label: "KF Report Date",      placeholder: "e.g. Q4 2025" },
];

// ── Helpers ────────────────────────────────────────────────────────────────
function timeAgo(isoStr) {
  if (!isoStr) return "Never";
  const diff = Date.now() - new Date(isoStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  < 2)  return "Just now";
  if (mins  < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

function getFreshnessStatus(isoStr, greenDays, yellowDays) {
  if (!isoStr) return "missing";
  const days = (Date.now() - new Date(isoStr).getTime()) / 86400000;
  if (days <= greenDays)  return "green";
  if (days <= yellowDays) return "yellow";
  return "red";
}

function StatusDot({ status }) {
  const colors = { green: "#10B981", yellow: "#F59E0B", red: "#EF4444", missing: "#64748B" };
  return (
    <span style={{
      display: "inline-block", width: 10, height: 10, borderRadius: "50%",
      background: colors[status] || colors.missing,
      boxShadow: status === "green" ? "0 0 6px #10B981" : status === "red" ? "0 0 6px #EF4444" : "none",
      marginRight: 6, flexShrink: 0,
    }} />
  );
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function AdminDataHealth({ db, T }) {
  const [feedData,      setFeedData]      = useState({});
  const [alerts,        setAlerts]        = useState([]);
  const [globalMarket,  setGlobalMarket]  = useState({});
  const [editGlobal,    setEditGlobal]    = useState({});
  const [editValuStrat, setEditValuStrat] = useState({});
  const [editKF,        setEditKF]        = useState({});
  const [refreshing,    setRefreshing]    = useState({});
  const [saveStatus,    setSaveStatus]    = useState({});
  const [newsArticles,  setNewsArticles]  = useState([]);
  const [activeSection, setActiveSection] = useState("feeds");

  // ── Load all feed statuses from Firestore ────────────────────────────────
  const loadFeedData = useCallback(async () => {
    const results = {};
    await Promise.all(CRON_FEEDS.map(async (feed) => {
      try {
        const snap = await getDoc(doc(db, feed.firestorePath.collection, feed.firestorePath.doc));
        results[feed.id] = snap.exists() ? snap.data() : null;
      } catch { results[feed.id] = null; }
    }));
    setFeedData(results);
  }, [db]);

  // ── Load market global data ───────────────────────────────────────────────
  const loadGlobalMarket = useCallback(async () => {
    try {
      const snap = await getDoc(doc(db, "marketData", "global"));
      if (snap.exists()) {
        const data = snap.data();
        setGlobalMarket(data);
        setEditGlobal(data);
        setEditValuStrat({
          valuStratIndex: data.valuStratIndex || "",
          valuStratYoy:   data.valuStratYoy   || "",
          valuStratDate:  data.valuStratDate  || "",
        });
        setEditKF({
          kfAvgPpsf:      data.kfAvgPpsf      || "",
          kfForecast2026: data.kfForecast2026 || "",
          kfReportDate:   data.kfReportDate   || "",
        });
      }
    } catch (e) { console.error("swallowed@AdminDataHealth.jsx:203", e); }
  }, [db]);

  // ── Live alerts from Firestore ───────────────────────────────────────────
  useEffect(() => {
    loadFeedData();
    loadGlobalMarket();

    const q = query(collection(db, "adminAlerts"), orderBy("createdAt", "desc"), limit(20));
    const unsub = onSnapshot(q, (snap) => {
      const rows = [];
      snap.forEach(d => rows.push({ id: d.id, ...d.data() }));
      setAlerts(rows);
    }, () => {});

    // Live news for pin/unpin
    const unsubNews = onSnapshot(doc(db, "tabData", "news"), (snap) => {
      if (snap.exists() && snap.data().rows) setNewsArticles(snap.data().rows);
    }, () => {});

    return () => { unsub(); unsubNews(); };
  }, [db, loadFeedData, loadGlobalMarket]);

  // ── Force refresh a cron ─────────────────────────────────────────────────
  const forceRefresh = async (feed) => {
    if (feed.pending) return;
    setRefreshing(p => ({ ...p, [feed.id]: true }));
    try {
      const cronSecret = process.env.REACT_APP_CRON_SECRET || "";
      const res = await fetch(feed.endpoint, {
        headers: cronSecret ? { Authorization: `Bearer ${cronSecret}` } : {},
      });
      const json = await res.json();
      console.log(`[S15] ${feed.name} refresh:`, json);
      setTimeout(() => loadFeedData(), 2000);
      setSaveStatus(p => ({ ...p, [feed.id + "_refresh"]: json.ok ? "✅ Refreshed" : "⚠️ Partial" }));
      setTimeout(() => setSaveStatus(p => ({ ...p, [feed.id + "_refresh"]: "" })), 4000);
    } catch (err) {
      setSaveStatus(p => ({ ...p, [feed.id + "_refresh"]: "❌ Failed" }));
      setTimeout(() => setSaveStatus(p => ({ ...p, [feed.id + "_refresh"]: "" })), 4000);
    }
    setRefreshing(p => ({ ...p, [feed.id]: false }));
  };

  // ── Save global market data ──────────────────────────────────────────────
  const saveGlobal = async (fields, editObj, section) => {
    setSaveStatus(p => ({ ...p, [section]: "saving" }));
    try {
      const payload = {};
      fields.forEach(f => { if (editObj[f.key] !== undefined) payload[f.key] = editObj[f.key]; });
      payload.updatedAt  = new Date().toISOString();
      payload.updatedBy  = "admin";
      await setDoc(doc(db, "marketData", "global"), payload, { merge: true });
      setGlobalMarket(prev => ({ ...prev, ...payload }));
      setSaveStatus(p => ({ ...p, [section]: "saved" }));
      setTimeout(() => setSaveStatus(p => ({ ...p, [section]: "" })), 3000);
    } catch {
      setSaveStatus(p => ({ ...p, [section]: "error" }));
      setTimeout(() => setSaveStatus(p => ({ ...p, [section]: "" })), 3000);
    }
  };

  // ── Pin/unpin news article ────────────────────────────────────────────────
  const togglePin = async (articleId) => {
    const updated = newsArticles.map(a =>
      a.id === articleId ? { ...a, pinned: !a.pinned } : a
    );
    setNewsArticles(updated);
    try {
      await updateDoc(doc(db, "tabData", "news"), { rows: updated });
    } catch (e) { console.error("swallowed@AdminDataHealth.jsx:273", e); }
  };

  // ── Mark alert as read ────────────────────────────────────────────────────
  const markAlertRead = async (alertId) => {
    try {
      await updateDoc(doc(db, "adminAlerts", alertId), { read: true });
    } catch (e) { console.error("swallowed@AdminDataHealth.jsx:280", e); }
  };

  // ── Styles ────────────────────────────────────────────────────────────────
  const S = {
    wrap:      { padding: "0 0 60px 0" },
    sectionNav: {
      display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap",
    },
    navBtn: (active) => ({
      padding: "8px 18px", borderRadius: 8, border: "none", cursor: "pointer",
      fontFamily: "inherit", fontSize: 13, fontWeight: 600,
      background: active ? "rgba(212,168,67,0.15)" : "rgba(255,255,255,0.04)",
      color: active ? "#D4A843" : "#94A3B8",
      borderBottom: active ? "2px solid #D4A843" : "2px solid transparent",
      transition: "all 0.2s",
    }),
    card: {
      background: "#0D1B30", border: "1px solid rgba(212,168,67,0.12)",
      borderRadius: 14, padding: 20, marginBottom: 14,
    },
    feedRow: {
      display: "flex", alignItems: "flex-start", gap: 16,
      flexWrap: "wrap",
    },
    feedIcon:  { fontSize: 28, flexShrink: 0, marginTop: 2 },
    feedInfo:  { flex: 1, minWidth: 200 },
    feedName:  { fontSize: 15, fontWeight: 700, color: "#fff", marginBottom: 4 },
    feedDesc:  { fontSize: 12, color: "#64748B", marginBottom: 6 },
    feedMeta:  { display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" },
    badge: (color) => ({
      display: "inline-flex", alignItems: "center",
      padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600,
      background: color + "20", color, border: `1px solid ${color}40`,
    }),
    refreshBtn: (disabled) => ({
      padding: "7px 16px", borderRadius: 8, border: "none",
      cursor: disabled ? "not-allowed" : "pointer",
      background: disabled ? "rgba(255,255,255,0.05)" : "rgba(212,168,67,0.1)",
      color: disabled ? "#64748B" : "#D4A843",
      fontFamily: "inherit", fontSize: 12, fontWeight: 600,
      transition: "all 0.2s", whiteSpace: "nowrap",
      borderColor: disabled ? "transparent" : "rgba(212,168,67,0.2)",
      borderWidth: 1, borderStyle: "solid",
    }),
    label:     { fontSize: 11, color: "#64748B", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 },
    input:     {
      width: "100%", padding: "10px 14px", background: "#0A1628",
      border: "1px solid rgba(212,168,67,0.15)", borderRadius: 8,
      color: "#E2E8F0", fontFamily: "inherit", fontSize: 13, outline: "none",
      boxSizing: "border-box",
    },
    saveBtn: (status) => ({
      padding: "9px 20px", borderRadius: 8, border: "none", cursor: "pointer",
      background: status === "saved" ? "rgba(16,185,129,0.15)" : "rgba(212,168,67,0.12)",
      color: status === "saved" ? "#10B981" : "#D4A843",
      fontFamily: "inherit", fontSize: 13, fontWeight: 700,
      transition: "all 0.2s",
    }),
    sectionTitle: { fontSize: 15, fontWeight: 700, color: "#fff", marginBottom: 16 },
    grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 },
    alertRow: {
      display: "flex", alignItems: "flex-start", gap: 12,
      padding: "12px 16px", borderRadius: 10,
      background: "rgba(255,255,255,0.02)", marginBottom: 8,
      border: "1px solid rgba(255,255,255,0.05)",
    },
    pinBtn: (pinned) => ({
      padding: "4px 10px", borderRadius: 6, border: "none", cursor: "pointer",
      background: pinned ? "rgba(212,168,67,0.15)" : "rgba(255,255,255,0.05)",
      color: pinned ? "#D4A843" : "#64748B",
      fontFamily: "inherit", fontSize: 11, fontWeight: 600,
    }),
  };

  const unreadAlerts = alerts.filter(a => !a.read);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={S.wrap}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: "#fff", marginBottom: 4 }}>
          Data Health Dashboard
        </div>
        <div style={{ fontSize: 13, color: "#64748B" }}>
          Nerve centre of the DXB Analytics live data platform — feed statuses, market data editor, alert log.
        </div>
        {unreadAlerts.length > 0 && (
          <div style={{ marginTop: 12, padding: "8px 14px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, fontSize: 13, color: "#EF4444", fontWeight: 600 }}>
            ⚠️ {unreadAlerts.length} unread alert{unreadAlerts.length > 1 ? "s" : ""}
          </div>
        )}
      </div>

      {/* Section Nav */}
      <div style={S.sectionNav}>
        {[
          { key: "feeds",    label: "📡 Data Feeds" },
          { key: "market",   label: "✏️ Market Data Editor" },
          { key: "external", label: "📋 ValuStrat / KF" },
          { key: "alerts",   label: `🔔 Alerts${unreadAlerts.length ? ` (${unreadAlerts.length})` : ""}` },
          { key: "news",     label: "📰 News Pin/Unpin" },
        ].map(s => (
          <button key={s.key} style={S.navBtn(activeSection === s.key)} onClick={() => setActiveSection(s.key)}>
            {s.label}
          </button>
        ))}
      </div>

      {/* ── SECTION: DATA FEEDS ── */}
      {activeSection === "feeds" && (
        <div>
          <div style={S.sectionTitle}>Live Data Feeds — {CRON_FEEDS.length} configured</div>
          {CRON_FEEDS.map(feed => {
            const data    = feedData[feed.id];
            const updated = data?.updatedAt || data?.lastFetched || data?.updatedAtUAE;
            const status  = feed.pending ? "missing" : getFreshnessStatus(updated, feed.greenDays, feed.yellowDays);
            const statusLabels = { green: "LIVE", yellow: "STALE", red: "OLD", missing: "NO DATA" };
            const statusColors = { green: "#10B981", yellow: "#F59E0B", red: "#EF4444", missing: "#64748B" };

            return (
              <div key={feed.id} style={{ ...S.card, borderLeftColor: statusColors[status], borderLeftWidth: 3 }}>
                <div style={S.feedRow}>
                  <div style={S.feedIcon}>{feed.icon}</div>
                  <div style={S.feedInfo}>
                    <div style={S.feedName}>{feed.name}</div>
                    <div style={S.feedDesc}>{feed.description}</div>
                    <div style={S.feedMeta}>
                      <StatusDot status={status} />
                      <span style={S.badge(statusColors[status])}>{statusLabels[status]}</span>
                      <span style={{ fontSize: 12, color: "#64748B" }}>
                        Last: {updated ? timeAgo(updated) : "Never"}
                      </span>
                      <span style={{ fontSize: 12, color: "#64748B" }}>
                        Schedule: {feed.schedule}
                      </span>
                      {data?.usedFallback && (
                        <span style={S.badge("#F59E0B")}>⚠️ Fallback used</span>
                      )}
                      {feed.pending && (
                        <span style={S.badge("#64748B")}>⏳ {feed.pendingReason}</span>
                      )}
                    </div>
                    {data?.source && (
                      <div style={{ fontSize: 11, color: "#64748B", marginTop: 4 }}>
                        Source: {data.source}
                      </div>
                    )}
                    {data?.fetchError && (
                      <div style={{ fontSize: 11, color: "#EF4444", marginTop: 4 }}>
                        Last error: {data.fetchError}
                      </div>
                    )}
                    {/* Feed-specific data preview */}
                    {feed.id === "eibor" && data && (
                      <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 6, display: "flex", gap: 12, flexWrap: "wrap" }}>
                        {[["ON", data.overnight], ["1M", data.oneMonth], ["3M", data.threeMonth], ["6M", data.sixMonth], ["12M", data.twelveMonth]].map(([label, val]) => val && (
                          <span key={label}>{label}: <strong style={{ color: "#D4A843" }}>{val?.toFixed(4)}%</strong></span>
                        ))}
                      </div>
                    )}
                    {feed.id === "news" && data?.rows && (
                      <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 4 }}>
                        {data.rows.length} articles · Top: {data.rows[0]?.headline?.slice(0, 60)}…
                      </div>
                    )}
                    {feed.id === "financials" && data && (
                      <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 4, display: "flex", gap: 12, flexWrap: "wrap" }}>
                        {data.stockPrice && <span>Price: <strong style={{ color: "#D4A843" }}>AED {data.stockPrice}</strong></span>}
                        {data.netProfit   && <span>Net Profit: <strong style={{ color: "#10B981" }}>AED {data.netProfit}B</strong></span>}
                        {data.latestReportLabel && <span>{data.latestReportLabel}</span>}
                      </div>
                    )}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end" }}>
                    <button
                      style={S.refreshBtn(feed.pending || refreshing[feed.id])}
                      onClick={() => forceRefresh(feed)}
                      disabled={feed.pending || refreshing[feed.id]}
                    >
                      {refreshing[feed.id] ? "⏳ Running…" : feed.pending ? "⏳ Pending" : "▶ Refresh Now"}
                    </button>
                    {saveStatus[feed.id + "_refresh"] && (
                      <span style={{ fontSize: 11, color: "#10B981" }}>{saveStatus[feed.id + "_refresh"]}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Cron schedule summary */}
          <div style={{ ...S.card, marginTop: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#D4A843", marginBottom: 12 }}>📅 Vercel Cron Schedule (UTC)</div>
            <div style={{ fontFamily: "monospace", fontSize: 12, color: "#94A3B8", lineHeight: 2 }}>
              {CRON_FEEDS.map(f => (
                <div key={f.id}>
                  <span style={{ color: "#D4A843", minWidth: 140, display: "inline-block" }}>{f.cronExpr}</span>
                  <span style={{ color: "#64748B" }}>→ </span>
                  <span style={{ color: "#E2E8F0" }}>{f.endpoint}</span>
                  <span style={{ color: "#64748B" }}> ({f.schedule})</span>
                  {f.pending && <span style={{ color: "#F59E0B" }}> ⏳</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── SECTION: MARKET DATA EDITOR ── */}
      {activeSection === "market" && (
        <div>
          <div style={S.sectionTitle}>Market Data Editor — marketData/global</div>
          <div style={{ ...S.card, marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: "#64748B", marginBottom: 16, padding: "8px 12px", background: "rgba(212,168,67,0.06)", borderRadius: 8, borderLeft: "3px solid #D4A843" }}>
              ℹ️ These fields are read by the Overview, Market, and DLD Volumes tabs. Update DLD figures annually (January), ValuStrat monthly, PPSF as needed.
              {globalMarket.updatedAt && <span style={{ marginLeft: 8, color: "#94A3B8" }}>Last saved: {timeAgo(globalMarket.updatedAt)} by {globalMarket.updatedBy || "admin"}</span>}
            </div>
            <div style={S.grid2}>
              {GLOBAL_MARKET_FIELDS.map(field => (
                <div key={field.key}>
                  <div style={S.label}>{field.label}</div>
                  <div style={{ fontSize: 10, color: "#64748B", marginBottom: 4 }}>{field.hint}</div>
                  <input
                    style={S.input}
                    value={editGlobal[field.key] || ""}
                    placeholder={field.placeholder}
                    onChange={e => setEditGlobal(prev => ({ ...prev, [field.key]: e.target.value }))}
                  />
                </div>
              ))}
            </div>
            <div style={{ marginTop: 20, display: "flex", gap: 12, alignItems: "center" }}>
              <button
                style={S.saveBtn(saveStatus.global)}
                onClick={() => saveGlobal(GLOBAL_MARKET_FIELDS, editGlobal, "global")}
              >
                {saveStatus.global === "saving" ? "Saving…" : saveStatus.global === "saved" ? "✅ Saved to Firestore" : "💾 Save Market Data"}
              </button>
              <button
                style={{ ...S.saveBtn(""), background: "rgba(255,255,255,0.04)", color: "#64748B" }}
                onClick={loadGlobalMarket}
              >
                ↺ Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── SECTION: EXTERNAL REPORTS ── */}
      {activeSection === "external" && (
        <div>
          <div style={S.sectionTitle}>External Report Data — ValuStrat & Knight Frank</div>
          <div style={{ fontSize: 12, color: "#64748B", marginBottom: 16 }}>
            Read these reports monthly/quarterly and enter the values below. Takes 2 minutes.
          </div>

          {/* ValuStrat */}
          <div style={S.card}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 4 }}>
              ValuStrat VPI — Monthly
            </div>
            <div style={{ fontSize: 12, color: "#64748B", marginBottom: 14 }}>
              Source: <a href="https://valustrat.com" target="_blank" rel="noopener noreferrer" style={{ color: "#D4A843" }}>valustrat.com</a> → UAE Real Estate Reports → Dubai Residential Capital Values
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
              {VALUSTRAT_FIELDS.map(f => (
                <div key={f.key}>
                  <div style={S.label}>{f.label}</div>
                  <input
                    style={S.input}
                    value={editValuStrat[f.key] || ""}
                    placeholder={f.placeholder}
                    onChange={e => setEditValuStrat(prev => ({ ...prev, [f.key]: e.target.value }))}
                  />
                </div>
              ))}
            </div>
            <div style={{ marginTop: 14, display: "flex", gap: 10, alignItems: "center" }}>
              <button style={S.saveBtn(saveStatus.valustrat)} onClick={() => saveGlobal(VALUSTRAT_FIELDS, editValuStrat, "valustrat")}>
                {saveStatus.valustrat === "saved" ? "✅ Saved" : "💾 Save ValuStrat"}
              </button>
            </div>
          </div>

          {/* Knight Frank */}
          <div style={S.card}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 4 }}>
              Knight Frank — Quarterly
            </div>
            <div style={{ fontSize: 12, color: "#64748B", marginBottom: 14 }}>
              Source: <a href="https://knightfrank.ae" target="_blank" rel="noopener noreferrer" style={{ color: "#D4A843" }}>knightfrank.ae</a> → Insights → Dubai Residential Market Update
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
              {KNIGHT_FRANK_FIELDS.map(f => (
                <div key={f.key}>
                  <div style={S.label}>{f.label}</div>
                  <input
                    style={S.input}
                    value={editKF[f.key] || ""}
                    placeholder={f.placeholder}
                    onChange={e => setEditKF(prev => ({ ...prev, [f.key]: e.target.value }))}
                  />
                </div>
              ))}
            </div>
            <div style={{ marginTop: 14 }}>
              <button style={S.saveBtn(saveStatus.kf)} onClick={() => saveGlobal(KNIGHT_FRANK_FIELDS, editKF, "kf")}>
                {saveStatus.kf === "saved" ? "✅ Saved" : "💾 Save Knight Frank"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── SECTION: ALERTS ── */}
      {activeSection === "alerts" && (
        <div>
          <div style={S.sectionTitle}>Alert Log — adminAlerts collection</div>
          {alerts.length === 0 && (
            <div style={{ ...S.card, textAlign: "center", color: "#64748B", padding: 40 }}>
              ✅ No alerts. All systems operational.
            </div>
          )}
          {alerts.map(alert => (
            <div key={alert.id} style={{
              ...S.alertRow,
              background: alert.read ? "rgba(255,255,255,0.01)" : "rgba(212,168,67,0.05)",
              borderColor: alert.read ? "rgba(255,255,255,0.05)" : "rgba(212,168,67,0.15)",
            }}>
              <div style={{ fontSize: 20, flexShrink: 0 }}>
                {alert.severity === "error" ? "🔴" : alert.severity === "warning" ? "🟡" : "🟢"}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: alert.read ? "#94A3B8" : "#fff", marginBottom: 2 }}>
                  {alert.message}
                </div>
                <div style={{ fontSize: 11, color: "#64748B" }}>
                  {alert.type} · {timeAgo(alert.createdAt)} · {alert.source}
                </div>
                {alert.data && (
                  <div style={{ fontSize: 11, color: "#64748B", marginTop: 4, fontFamily: "monospace" }}>
                    {JSON.stringify(alert.data).slice(0, 120)}…
                  </div>
                )}
              </div>
              {!alert.read && (
                <button
                  onClick={() => markAlertRead(alert.id)}
                  style={{ padding: "4px 10px", borderRadius: 6, border: "none", cursor: "pointer", background: "rgba(255,255,255,0.05)", color: "#64748B", fontFamily: "inherit", fontSize: 11 }}
                >
                  Mark read
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── SECTION: NEWS PIN/UNPIN ── */}
      {activeSection === "news" && (
        <div>
          <div style={S.sectionTitle}>News Pin/Unpin — tabData/news</div>
          <div style={{ fontSize: 12, color: "#64748B", marginBottom: 16 }}>
            Pinned stories always appear at the top of the Overview news section regardless of relevance score.
          </div>
          {newsArticles.length === 0 && (
            <div style={{ ...S.card, textAlign: "center", color: "#64748B", padding: 40 }}>
              No articles loaded. News cron runs daily at 6:30 AM UAE.
            </div>
          )}
          {[...newsArticles].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0)).map(article => (
            <div key={article.id} style={{
              ...S.alertRow,
              borderColor: article.pinned ? "rgba(212,168,67,0.3)" : "rgba(255,255,255,0.05)",
              background:  article.pinned ? "rgba(212,168,67,0.04)" : "rgba(255,255,255,0.02)",
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  {article.pinned && <span style={{ fontSize: 10, fontWeight: 700, color: "#D4A843", background: "rgba(212,168,67,0.12)", padding: "2px 6px", borderRadius: 4 }}>📌 PINNED</span>}
                  <span style={{
                    fontSize: 10, fontWeight: 600, padding: "2px 6px", borderRadius: 4,
                    background: (article.color || "#94A3B8") + "20", color: article.color || "#94A3B8",
                  }}>{article.tag}</span>
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#fff", marginBottom: 2, lineHeight: 1.4 }}>
                  {article.headline}
                </div>
                <div style={{ fontSize: 11, color: "#64748B" }}>
                  {article.source} · {article.date} · Score: {article.relevanceScore}
                </div>
              </div>
              <button style={S.pinBtn(article.pinned)} onClick={() => togglePin(article.id)}>
                {article.pinned ? "📌 Unpin" : "📍 Pin"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
