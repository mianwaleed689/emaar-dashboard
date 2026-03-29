import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { db } from "../firebase";
import { collection, getDocs, doc, getDoc, setDoc, deleteDoc, onSnapshot, query, orderBy, limit, where, addDoc, updateDoc } from "firebase/firestore";
import { BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { T } from "../theme";
import emailjs from "@emailjs/browser";

const MarketIntelligenceTab = ({ db, T, notify, users }) => {
  const [marketGlobal, setMarketGlobal] = React.useState(null);
  const [eiborData,    setEiborData]    = React.useState(null);
  const [eiborHistory, setEiborHistory] = React.useState([]);
  const [alerts,       setAlerts]       = React.useState([]);
  const [communities,  setCommunities]  = React.useState([]);
  const [developers,   setDevelopers]   = React.useState([]);
  const [loading,      setLoading]      = React.useState(true);

  // Load all data
  React.useEffect(() => {
    const unsubs = [];

    // marketData/global
    unsubs.push(onSnapshot(doc(db, "marketData", "global"), snap => {
      if (snap.exists()) setMarketGlobal(snap.data());
    }));

    // marketData/eibor
    unsubs.push(onSnapshot(doc(db, "marketData", "eibor"), snap => {
      if (snap.exists()) setEiborData(snap.data());
    }));

    // eiborHistory — last 30 days
    getDocs(query(collection(db, "eiborHistory"), orderBy("fetchedAt", "desc"), limit(30))).then(snap => {
      const list = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() }));
      setEiborHistory(list.reverse());
    }).catch(() => {});

    // adminAlerts — last 20
    unsubs.push(onSnapshot(
      query(collection(db, "adminAlerts"), orderBy("createdAt", "desc"), limit(20)),
      snap => {
        const list = [];
        snap.forEach(d => list.push({ id: d.id, ...d.data() }));
        setAlerts(list);
        setLoading(false);
      },
      () => setLoading(false)
    ));

    // communityData — all communities
    getDocs(collection(db, "communityData")).then(snap => {
      const list = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() }));
      setCommunities(list.sort((a, b) => (b.transactionCount30d || 0) - (a.transactionCount30d || 0)));
    }).catch(() => {});

    // developers — for launch alerts
    getDocs(query(collection(db, "developers"), orderBy("seededAt", "desc"), limit(20))).then(snap => {
      const list = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() }));
      setDevelopers(list);
    }).catch(() => {});

    return () => unsubs.forEach(u => u());
  }, [db]);

  // Data feed statuses
  const FEEDS = [
    { name: "EIBOR Rates",       key: "eibor",       icon: "📈", schedule: "Daily 11:30AM UAE", lastUpdate: eiborData?.updatedAt,    status: eiborData ? "live" : "no_data",    value: eiborData ? `3M: ${eiborData.threeMonth || eiborData["3m"] || "—"}%` : "—" },
    { name: "Market Data",       key: "global",      icon: "🏙️", schedule: "Admin updated",     lastUpdate: marketGlobal?.updatedAt, status: marketGlobal ? "live" : "no_data", value: marketGlobal ? marketGlobal.totalMarketValue || "—" : "—" },
    { name: "DLD Transactions",  key: "dld",         icon: "📋", schedule: "Daily 7AM UAE",     lastUpdate: marketGlobal?.dldUpdatedAt, status: marketGlobal?.lastDLDFetchDate ? "live" : "pending", value: marketGlobal?.lastDLDTxnCount ? `${marketGlobal.lastDLDTxnCount} txns` : "Pending API keys" },
    { name: "Developer Registry",key: "developers",  icon: "🏗️", schedule: "One-time seeded",   lastUpdate: developers[0]?.seededAt, status: developers.length > 0 ? "live" : "no_data", value: `${developers.length} developers` },
  ];

  const statusColor = (s) => s === "live" ? T.green : s === "pending" ? T.orange : T.textMuted;
  const statusLabel = (s) => s === "live" ? "LIVE" : s === "pending" ? "PENDING" : "NO DATA";

  // Anomaly alerts
  const anomalyAlerts = alerts.filter(a => a.type === "price_anomaly" || a.type === "financial_update" || a.type === "referral_reward" || a.type === "payment_retry");
  const launchAlerts  = alerts.filter(a => a.type === "developer_launch" || a.message?.toLowerCase().includes("new") || a.message?.toLowerCase().includes("launch"));

  // EIBOR mini chart
  const eiborMax = Math.max(...eiborHistory.map(h => parseFloat(h["3m"] || h.threeMonth || 0)), 5);
  const eiborMin = Math.min(...eiborHistory.map(h => parseFloat(h["3m"] || h.threeMonth || 100)), 3);

  const now = new Date();
  const timeSince = (iso) => {
    if (!iso) return "Never";
    const d = (now - new Date(iso)) / 1000;
    if (d < 60) return `${Math.round(d)}s ago`;
    if (d < 3600) return `${Math.round(d/60)}m ago`;
    if (d < 86400) return `${Math.round(d/3600)}h ago`;
    return `${Math.round(d/86400)}d ago`;
  };

  return (
    <div style={{ padding: "28px 32px", display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h2 style={{ fontFamily: "'Fraunces',serif", fontSize: 26, fontWeight: 800, color: T.gold, marginBottom: 4 }}>Market Intelligence</h2>
          <p style={{ color: T.textMuted, fontSize: 13 }}>Admin Bloomberg Terminal — live data feeds · DLD anomalies · EIBOR trend · Developer alerts</p>
        </div>
        <div style={{ fontSize: 12, color: T.green, fontWeight: 700, padding: "4px 12px", borderRadius: 8, background: "rgba(16,185,129,0.1)", border: `1px solid rgba(16,185,129,0.2)` }}>
          ● LIVE · {new Date().toLocaleString("en-AE", { timeZone: "Asia/Dubai", hour: "2-digit", minute: "2-digit" })} UAE
        </div>
      </div>

      {/* Data Feed Statuses */}
      <div style={{ background: T.surface, borderRadius: 16, border: `1px solid ${T.border}`, padding: "20px 24px" }}>
        <div style={{ fontFamily: "'Fraunces',serif", fontSize: 15, fontWeight: 700, color: T.white, marginBottom: 14 }}>📡 Data Feed Status</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 10 }}>
          {FEEDS.map(f => (
            <div key={f.key} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderRadius: 10, background: T.surfaceAlt, border: `1px solid ${statusColor(f.status)}22` }}>
              <span style={{ fontSize: 20 }}>{f.icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: T.white }}>{f.name}</span>
                  <span style={{ fontSize: 9, fontWeight: 700, color: statusColor(f.status), padding: "1px 7px", borderRadius: 5, background: statusColor(f.status) + "15", border: `1px solid ${statusColor(f.status)}33` }}>{statusLabel(f.status)}</span>
                </div>
                <div style={{ fontSize: 11, color: T.textMuted }}>Schedule: {f.schedule} · Last: {timeSince(f.lastUpdate)}</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: statusColor(f.status), marginTop: 2 }}>{f.value}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

        {/* EIBOR Trend */}
        <div style={{ background: T.surface, borderRadius: 16, border: `1px solid ${T.border}`, padding: "20px 24px" }}>
          <div style={{ fontFamily: "'Fraunces',serif", fontSize: 15, fontWeight: 700, color: T.white, marginBottom: 4 }}>📈 EIBOR Trend — Last 30 Days</div>
          <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 14 }}>3-Month rate · UAE Central Bank</div>

          {/* Current rates */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginBottom: 16 }}>
            {[
              { label: "Overnight", key: "overnight" },
              { label: "1 Month",   key: "oneMonth" },
              { label: "3 Month",   key: "threeMonth" },
              { label: "12 Month",  key: "twelveMonth" },
            ].map(r => (
              <div key={r.key} style={{ textAlign: "center", padding: "8px", background: T.surfaceAlt, borderRadius: 8, border: `1px solid ${T.border}` }}>
                <div style={{ fontSize: 9, color: T.textMuted, textTransform: "uppercase", marginBottom: 3 }}>{r.label}</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: T.gold, fontFamily: "'Fraunces',serif" }}>{eiborData?.[r.key] || eiborData?.[r.key.replace("Month","m").replace("oneM","1m").replace("threeM","3m").replace("twelveM","12m").replace("overnight","on")] || "—"}%</div>
              </div>
            ))}
          </div>

          {/* Mini line chart */}
          {eiborHistory.length > 0 ? (
            <div style={{ height: 80, display: "flex", alignItems: "flex-end", gap: 3, padding: "8px 0" }}>
              {eiborHistory.slice(-20).map((h, i) => {
                const val = parseFloat(h["3m"] || h.threeMonth || 0);
                const range = eiborMax - eiborMin || 1;
                const height = Math.max(((val - eiborMin) / range) * 60 + 10, 4);
                return (
                  <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                    <div style={{ width: "80%", height: `${height}px`, background: `linear-gradient(180deg,${T.gold},${T.gold}66)`, borderRadius: "2px 2px 0 0" }} title={`${val}%`} />
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ height: 80, display: "flex", alignItems: "center", justifyContent: "center", color: T.textMuted, fontSize: 12, background: T.surfaceAlt, borderRadius: 8 }}>
              EIBOR history will populate after first cron run
            </div>
          )}
          {eiborData?.asOf && <div style={{ fontSize: 10, color: T.textMuted, marginTop: 6 }}>As of: {eiborData.asOf} · Source: UAE Central Bank</div>}
        </div>

        {/* Top Communities by Volume */}
        <div style={{ background: T.surface, borderRadius: 16, border: `1px solid ${T.border}`, padding: "20px 24px" }}>
          <div style={{ fontFamily: "'Fraunces',serif", fontSize: 15, fontWeight: 700, color: T.white, marginBottom: 4 }}>🏙️ Top Communities — Transaction Volume</div>
          <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 14 }}>30-day rolling count · DLD data</div>
          {communities.length === 0 ? (
            <div style={{ color: T.textMuted, fontSize: 12, textAlign: "center", padding: "20px 0" }}>
              Community data will populate when DLD API keys are active
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {communities.slice(0, 8).map((c, i) => {
                const maxVol = communities[0]?.transactionCount30d || 1;
                const pct = ((c.transactionCount30d || 0) / maxVol) * 100;
                return (
                  <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 20, fontSize: 11, color: i === 0 ? T.gold : T.textMuted, fontWeight: i === 0 ? 700 : 400, flexShrink: 0 }}>#{i+1}</div>
                    <div style={{ width: 130, fontSize: 11, color: T.white, flexShrink: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.areaName || c.id}</div>
                    <div style={{ flex: 1, height: 6, borderRadius: 3, background: T.border, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: i === 0 ? T.gold : T.teal, borderRadius: 3 }} />
                    </div>
                    <div style={{ width: 60, textAlign: "right", fontSize: 11, fontWeight: 600, color: i === 0 ? T.gold : T.textSecondary, flexShrink: 0 }}>{(c.transactionCount30d || 0).toLocaleString()}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Market Pulse KPIs */}
      <div style={{ background: T.surface, borderRadius: 16, border: `1px solid ${T.border}`, padding: "20px 24px" }}>
        <div style={{ fontFamily: "'Fraunces',serif", fontSize: 15, fontWeight: 700, color: T.white, marginBottom: 14 }}>🌍 Dubai Market Pulse</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 10 }}>
          {[
            { label: "Market Value", value: marketGlobal?.totalMarketValue || "AED 682.5B", color: T.gold },
            { label: "Transactions", value: marketGlobal?.totalTransactions || "214,912", color: T.green },
            { label: "Avg PPSF", value: marketGlobal?.avgPricePsf || "AED 1,689", color: T.teal },
            { label: "YoY Growth", value: marketGlobal?.yoyGrowthPct || "+30.6%", color: T.blue },
            { label: "Off-Plan %", value: marketGlobal?.offPlanShare || "62.6%", color: T.purple },
            { label: "EIBOR 3M", value: eiborData?.threeMonth ? `${eiborData.threeMonth}%` : "3.64%", color: T.orange },
          ].map(k => (
            <div key={k.label} style={{ textAlign: "center", padding: "12px 8px", background: T.surfaceAlt, borderRadius: 10, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 9, color: T.textMuted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>{k.label}</div>
              <div style={{ fontSize: 13, fontWeight: 800, color: k.color, fontFamily: "'Fraunces',serif" }}>{k.value}</div>
            </div>
          ))}
        </div>
        {marketGlobal?.updatedAt && <div style={{ fontSize: 10, color: T.textMuted, marginTop: 10 }}>Last updated: {timeSince(marketGlobal.updatedAt)} · by {marketGlobal.updatedBy || "admin"}</div>}
      </div>

      {/* Alerts + Developer Registry */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

        {/* DLD Anomaly Alerts */}
        <div style={{ background: T.surface, borderRadius: 16, border: `1px solid ${T.border}`, padding: "20px 24px" }}>
          <div style={{ fontFamily: "'Fraunces',serif", fontSize: 15, fontWeight: 700, color: T.white, marginBottom: 4 }}>⚠️ Transaction Anomalies & Alerts</div>
          <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 14 }}>Price spikes, financial updates, system events</div>
          {loading ? (
            <div style={{ color: T.textMuted, fontSize: 12 }}>Loading...</div>
          ) : alerts.length === 0 ? (
            <div style={{ color: T.textMuted, fontSize: 12, textAlign: "center", padding: "20px 0" }}>
              <div style={{ fontSize: 24, marginBottom: 6 }}>✅</div>
              No anomalies detected
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 300, overflowY: "auto" }}>
              {alerts.map(a => {
                const isAnomaly = a.type === "price_anomaly";
                const isFinancial = a.type === "financial_update";
                const color = isAnomaly ? T.red : isFinancial ? T.green : T.gold;
                return (
                  <div key={a.id} style={{ padding: "10px 12px", borderRadius: 8, background: T.surfaceAlt, border: `1px solid ${color}22` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                      <div style={{ fontSize: 12, color: T.white, flex: 1 }}>{a.message}</div>
                      <div style={{ fontSize: 9, color: T.textMuted, flexShrink: 0 }}>{timeSince(a.createdAt)}</div>
                    </div>
                    <div style={{ fontSize: 10, color: color, marginTop: 3, fontWeight: 600 }}>{a.type?.replace(/_/g, " ").toUpperCase()} · {a.severity?.toUpperCase() || "INFO"}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Developer Registry — Launch Alerts */}
        <div style={{ background: T.surface, borderRadius: 16, border: `1px solid ${T.border}`, padding: "20px 24px" }}>
          <div style={{ fontFamily: "'Fraunces',serif", fontSize: 15, fontWeight: 700, color: T.white, marginBottom: 4 }}>🏗️ Developer Registry — {developers.length} Registered</div>
          <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 14 }}>Latest developer registrations · DLD seeded data</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 300, overflowY: "auto" }}>
            {developers.slice(0, 12).map((d, i) => (
              <div key={d.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 8, background: T.surfaceAlt, border: `1px solid ${T.border}` }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: d.color || T.gold, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: "#fff", flexShrink: 0 }}>
                  {(d.name || "D")[0]}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: T.white, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.name}</div>
                  <div style={{ fontSize: 10, color: T.textMuted }}>{d.tier} · {d.projects || 0} projects · AED {d.salesValue2025 || 0}B sales</div>
                </div>
                <div style={{ fontSize: 10, fontWeight: 700, color: d.tier === "T1" ? T.gold : d.tier === "T2" ? T.teal : T.textMuted, flexShrink: 0 }}>{d.tier}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 10, fontSize: 11, color: T.textMuted }}>T1: {developers.filter(d=>d.tier==="T1").length} · T2: {developers.filter(d=>d.tier==="T2").length} · T3: {developers.filter(d=>d.tier==="T3").length}</div>
        </div>
      </div>

    </div>
  );
};

/* ─── S19: REVENUE FORECASTING TAB ──────────────────────────────────────────
   MRR forecast model · Churn-adjusted ARR · Growth scenario modelling
────────────────────────────────────────────────────────────────────────── */

export default MarketIntelligenceTab;
