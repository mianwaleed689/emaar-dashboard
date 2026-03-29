import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { db } from "../firebase";
import { collection, getDocs, doc, getDoc, setDoc, deleteDoc, onSnapshot, query, orderBy, limit, where, addDoc, updateDoc } from "firebase/firestore";
import { BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { T } from "../theme";
import emailjs from "@emailjs/browser";

function FinancialsEditor({ db, T, notify, adminUser, Section }) {
  const [finRows, setFinRows] = React.useState(null);
  const [finSaving, setFinSaving] = React.useState(false);

  const defaultFinancials = [
    { year:"2020", revenue:14.9, grossProfit:4.8, ebitda:6.2, netProfit:2.7, propertySales:14, backlog:28, recurringRev:5.3, intlSales:0.6, mallRev:3.2, hotelRev:2.1, dividend:0.15, eps:0.24, gm:32.2, em:41.6, nm:14.1 },
    { year:"2021", revenue:27.9, grossProfit:11.6, ebitda:8.5, netProfit:6.6, propertySales:23.9, backlog:32, recurringRev:5.8, intlSales:0.8, mallRev:3.5, hotelRev:2.3, dividend:0.25, eps:0.60, gm:41.6, em:30.5, nm:19.0 },
    { year:"2022", revenue:24.9, grossProfit:12.6, ebitda:9.8, netProfit:8.1, propertySales:30.7, backlog:41.5, recurringRev:7.5, intlSales:1.2, mallRev:4.2, hotelRev:3.3, dividend:0.35, eps:0.77, gm:50.6, em:39.4, nm:27.3 },
    { year:"2023", revenue:26.7, grossProfit:16.9, ebitda:16.0, netProfit:15.1, propertySales:40.3, backlog:71.8, recurringRev:8.6, intlSales:2.9, mallRev:5.8, hotelRev:2.8, dividend:0.50, eps:1.32, gm:63.3, em:59.9, nm:43.4 },
    { year:"2024", revenue:35.5, grossProfit:20.4, ebitda:19.3, netProfit:18.9, propertySales:69.5, backlog:111.5, recurringRev:9.3, intlSales:4.1, mallRev:5.6, hotelRev:3.7, dividend:1.00, eps:1.53, gm:57.5, em:54.4, nm:38.0 },
    { year:"2025", revenue:49.6, grossProfit:28.5, ebitda:25.6, netProfit:25.7, propertySales:80.4, backlog:155, recurringRev:10.5, intlSales:9.3, mallRev:6.3, hotelRev:4.2, dividend:1.00, eps:2.00, gm:57.5, em:51.6, nm:35.5 },
  ];

  React.useEffect(() => {
    const unsub = onSnapshot(doc(db, "tabData", "financials"), (snap) => {
      setFinRows(snap.exists() && snap.data().rows ? snap.data().rows : defaultFinancials);
    });
    return () => unsub();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const resetFinancials = async () => {
    setFinRows(defaultFinancials);
    try {
      await setDoc(doc(db, "tabData", "financials"), { rows: defaultFinancials, updatedAt: new Date().toISOString(), updatedBy: adminUser?.email });
      notify("✅ Reset to default financial data!");
    } catch(e) { notify("Reset failed"); }
  };

  const finFields = [
    { key: "revenue", label: "Revenue (AED B)" },
    { key: "grossProfit", label: "Gross Profit (AED B)" },
    { key: "ebitda", label: "EBITDA (AED B)" },
    { key: "netProfit", label: "Net Profit (AED B)" },
    { key: "propertySales", label: "Property Sales (AED B)" },
    { key: "backlog", label: "Revenue Backlog (AED B)" },
    { key: "recurringRev", label: "Recurring Rev (AED B)" },
    { key: "intlSales", label: "Intl Sales (AED B)" },
    { key: "mallRev", label: "Mall Revenue (AED B)" },
    { key: "hotelRev", label: "Hotel Revenue (AED B)" },
    { key: "dividend", label: "Dividend/Share (AED)" },
    { key: "eps", label: "EPS (AED)" },
    { key: "gm", label: "Gross Margin %" },
    { key: "em", label: "EBITDA Margin %" },
    { key: "nm", label: "Net Margin %" },
  ];

  const saveFinancials = async () => {
    setFinSaving(true);
    try {
      await setDoc(doc(db, "tabData", "financials"), { rows: finRows, updatedAt: new Date().toISOString(), updatedBy: adminUser?.email });
      notify("Financials saved! Dashboard will update on next load.");
    } catch(e) { notify("Save failed"); }
    setFinSaving(false);
  };

  if (!finRows) return <div style={{ padding: 40, textAlign: "center", color: T.textMuted }}>Loading financials...</div>;

  return (
    <Section title="Financials Editor" sub="Update Emaar financial data — changes go live on dashboard immediately">
      <div style={{ padding: "12px 16px", borderRadius: 10, background: "rgba(212,168,67,0.06)", border: `1px solid ${T.border}`, marginBottom: 20, fontSize: 12, color: T.textSecondary, lineHeight: 1.6 }}>
        💡 Edit figures below when Emaar releases new quarterly or annual results. All values in AED Billions unless noted.
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 900 }}>
          <thead>
            <tr style={{ borderBottom: `2px solid ${T.border}` }}>
              <th style={{ padding: "10px 12px", textAlign: "left", fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: 1 }}>Metric</th>
              {finRows.map(r => (
                <th key={r.year} style={{ padding: "10px 12px", textAlign: "center", fontSize: 13, fontWeight: 700, color: r.year === "2025" ? T.gold : T.white }}>{r.year}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {finFields.map((field, fi) => (
              <tr key={field.key} style={{ borderBottom: `1px solid ${T.border}`, background: fi % 2 === 0 ? "transparent" : "rgba(255,255,255,0.015)" }}>
                <td style={{ padding: "8px 12px", fontSize: 12, color: T.textSecondary, fontWeight: 500, whiteSpace: "nowrap" }}>{field.label}</td>
                {finRows.map((row, ri) => (
                  <td key={ri} style={{ padding: "6px 8px", textAlign: "center" }}>
                    <input type="number" step="0.01" value={row[field.key] ?? ""}
                      onChange={e => { const updated = [...finRows]; updated[ri] = { ...updated[ri], [field.key]: parseFloat(e.target.value) || 0 }; setFinRows(updated); }}
                      style={{ width: 80, padding: "6px 8px", background: T.bg, border: `1px solid ${T.border}`, borderRadius: 6, color: ri === finRows.length - 1 ? T.gold : T.textPrimary, fontSize: 12, fontFamily: "'Outfit',sans-serif", textAlign: "center", outline: "none" }} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16, gap: 10 }}>
        <button type="button" onClick={resetFinancials}
          style={{ padding: "10px 20px", borderRadius: 8, border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.06)", color: T.red, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>↺ Reset to Defaults</button>
        <button type="button" onClick={saveFinancials} disabled={finSaving}
          style={{ padding: "10px 24px", borderRadius: 8, border: "none", background: `linear-gradient(135deg, ${T.gold}, ${T.goldLight})`, color: T.bg, fontSize: 13, fontWeight: 700, cursor: finSaving ? "wait" : "pointer", fontFamily: "'Outfit',sans-serif", opacity: finSaving ? 0.7 : 1 }}>
          {finSaving ? "Saving..." : "Save Financials to Firestore"}
        </button>
      </div>
    </Section>
  );
}

/* ─── RISK EDITOR SUB-COMPONENT ─── */
function RiskEditor({ db, T, notify, adminUser, Section }) {
  const defaultRiskFactors = [
    { factor: "Market Risk", score: 6, trend: "stable", desc: "Dubai RE market cyclicality and price correction risk", weight: 15 },
    { factor: "Regulatory Risk", score: 8, trend: "improving", desc: "RERA oversight, DLD regulations, freehold laws", weight: 10 },
    { factor: "Liquidity Risk", score: 5, trend: "stable", desc: "Ability to exit — time to sell, buyer depth", weight: 15 },
    { factor: "Construction Risk", score: 7, trend: "stable", desc: "Developer delivery record, construction delays", weight: 15 },
    { factor: "Interest Rate Risk", score: 5, trend: "improving", desc: "EIBOR sensitivity, mortgage affordability impact", weight: 10 },
    { factor: "Currency Risk", score: 8, trend: "stable", desc: "AED-USD peg stability, forex exposure for expats", weight: 10 },
    { factor: "Geopolitical Risk", score: 7, trend: "stable", desc: "Regional stability, GCC political environment", weight: 10 },
    { factor: "Oversupply Risk", score: 5, trend: "worsening", desc: "Pipeline supply vs demand absorption capacity", weight: 10 },
    { factor: "Legal/Title Risk", score: 9, trend: "stable", desc: "Title deed security, escrow protection, RERA escrow", weight: 5 },
  ];
  const [riskRows, setRiskRows] = React.useState(null);
  const [riskSaving, setRiskSaving] = React.useState(false);

  React.useEffect(() => {
    const unsub = onSnapshot(doc(db, "tabData", "riskFactors"), (snap) => {
      setRiskRows(snap.exists() && snap.data().rows ? snap.data().rows : defaultRiskFactors);
    });
    return () => unsub();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const saveRisk = async () => {
    setRiskSaving(true);
    try {
      await setDoc(doc(db, "tabData", "riskFactors"), { rows: riskRows, updatedAt: new Date().toISOString(), updatedBy: adminUser?.email });
      notify("Risk data saved! Dashboard will update on next load.");
    } catch(e) { notify("Save failed"); }
    setRiskSaving(false);
  };

  const resetRisk = async () => {
    setRiskRows(defaultRiskFactors);
    try {
      await setDoc(doc(db, "tabData", "riskFactors"), { rows: defaultRiskFactors, updatedAt: new Date().toISOString(), updatedBy: adminUser?.email });
      notify("✅ Reset to default risk factors!");
    } catch(e) { notify("Reset failed"); }
  };

  if (!riskRows) return <div style={{ padding: 40, textAlign: "center", color: T.textMuted }}>Loading...</div>;

  return (
    <Section title="Risk Factor Editor" sub="Update the 9-factor risk matrix shown on the Risk tab">
      <div style={{ padding: "12px 16px", borderRadius: 10, background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.15)", marginBottom: 20, fontSize: 12, color: T.textSecondary, lineHeight: 1.6 }}>
        💡 Score is out of 10 (10 = lowest risk). Trend: improving / stable / worsening. Changes save to Firestore and update the Risk tab live.
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {riskRows.map((row, i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "1.5fr 80px 120px 80px 2fr", gap: 10, padding: "12px 16px", background: T.surfaceAlt, borderRadius: 10, border: `1px solid ${T.border}`, alignItems: "center" }}>
            <input value={row.factor} onChange={e => { const u = [...riskRows]; u[i] = { ...u[i], factor: e.target.value }; setRiskRows(u); }}
              style={{ width: "100%", background: "transparent", border: "none", color: T.white, fontSize: 13, fontWeight: 600, fontFamily: "'Outfit',sans-serif", outline: "none" }} />
            <div style={{ textAlign: "center" }}>
              <label style={{ fontSize: 9, color: T.textMuted, display: "block", marginBottom: 2, textTransform: "uppercase" }}>Score /10</label>
              <input type="number" min="1" max="10" value={row.score} onChange={e => { const u = [...riskRows]; u[i] = { ...u[i], score: parseInt(e.target.value) || 0 }; setRiskRows(u); }}
                style={{ width: "100%", padding: "6px", background: T.bg, border: `1px solid ${T.border}`, borderRadius: 6, color: T.gold, fontSize: 14, fontWeight: 700, textAlign: "center", fontFamily: "'Outfit',sans-serif", outline: "none" }} />
            </div>
            <div>
              <label style={{ fontSize: 9, color: T.textMuted, display: "block", marginBottom: 2, textTransform: "uppercase" }}>Trend</label>
              <select value={row.trend} onChange={e => { const u = [...riskRows]; u[i] = { ...u[i], trend: e.target.value }; setRiskRows(u); }}
                style={{ width: "100%", padding: "6px 8px", background: T.bg, border: `1px solid ${T.border}`, borderRadius: 6, color: row.trend === "improving" ? T.green : row.trend === "worsening" ? T.red : T.textSecondary, fontSize: 12, fontFamily: "'Outfit',sans-serif" }}>
                <option value="improving">↑ Improving</option>
                <option value="stable">→ Stable</option>
                <option value="worsening">↓ Worsening</option>
              </select>
            </div>
            <div style={{ textAlign: "center" }}>
              <label style={{ fontSize: 9, color: T.textMuted, display: "block", marginBottom: 2, textTransform: "uppercase" }}>Weight %</label>
              <input type="number" min="1" max="100" value={row.weight} onChange={e => { const u = [...riskRows]; u[i] = { ...u[i], weight: parseInt(e.target.value) || 0 }; setRiskRows(u); }}
                style={{ width: "100%", padding: "6px", background: T.bg, border: `1px solid ${T.border}`, borderRadius: 6, color: T.textPrimary, fontSize: 12, textAlign: "center", fontFamily: "'Outfit',sans-serif", outline: "none" }} />
            </div>
            <div>
              <label style={{ fontSize: 9, color: T.textMuted, display: "block", marginBottom: 2, textTransform: "uppercase" }}>Description</label>
              <input value={row.desc} onChange={e => { const u = [...riskRows]; u[i] = { ...u[i], desc: e.target.value }; setRiskRows(u); }}
                style={{ width: "100%", padding: "6px 8px", background: T.bg, border: `1px solid ${T.border}`, borderRadius: 6, color: T.textSecondary, fontSize: 12, fontFamily: "'Outfit',sans-serif", outline: "none" }} />
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16, gap: 10 }}>
        <button type="button" onClick={resetRisk}
          style={{ padding: "10px 20px", borderRadius: 8, border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.06)", color: T.red, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>↺ Reset to Defaults</button>
        <button type="button" onClick={saveRisk} disabled={riskSaving}
          style={{ padding: "10px 24px", borderRadius: 8, border: "none", background: `linear-gradient(135deg, ${T.gold}, ${T.goldLight})`, color: T.bg, fontSize: 13, fontWeight: 700, cursor: riskSaving ? "wait" : "pointer", fontFamily: "'Outfit',sans-serif", opacity: riskSaving ? 0.7 : 1 }}>
          {riskSaving ? "Saving..." : "Save Risk Data to Firestore"}
        </button>
      </div>
    </Section>
  );
}

/* ─── MARKET EDITOR SUB-COMPONENT ─── */
function MarketEditor({ db, T, notify, adminUser, Section }) {
  const defaultMarketData = [
    { metric: "Avg Price/sqft", value: "AED 1,689", period: "Dec 2025", source: "REIDIN", change: "+12.88%", category: "Pricing" },
    { metric: "Total Transactions", value: "226,000+", period: "FY 2025", source: "DLD", change: "+36%", category: "Volume" },
    { metric: "Transaction Value", value: "AED 761B", period: "FY 2025", source: "DLD", change: "+27%", category: "Volume" },
    { metric: "Off-Plan Share", value: "67%", period: "Q4 2025", source: "DXBinteract", change: "+8pp", category: "Market Mix" },
    { metric: "Rental Yield (avg)", value: "6.2%", period: "Q4 2025", source: "Knight Frank", change: "+0.3pp", category: "Yields" },
    { metric: "New Supply (units)", value: "45,000", period: "FY 2025", source: "ValuStrat", change: "+18%", category: "Supply" },
    { metric: "Foreign Buyer Share", value: "48%", period: "FY 2025", source: "DLD", change: "+5pp", category: "Demand" },
    { metric: "Mortgage LTV (max)", value: "80%", period: "Current", source: "UAE Central Bank", change: "Unchanged", category: "Finance" },
  ];
  const [mktRows, setMktRows] = React.useState(null);
  const [mktSaving, setMktSaving] = React.useState(false);

  React.useEffect(() => {
    const unsub = onSnapshot(doc(db, "tabData", "marketData"), (snap) => {
      setMktRows(snap.exists() && snap.data().rows?.length > 0 ? snap.data().rows : defaultMarketData);
    });
    return () => unsub();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const saveMarket = async () => {
    setMktSaving(true);
    try {
      await setDoc(doc(db, "tabData", "marketData"), { rows: mktRows, updatedAt: new Date().toISOString(), updatedBy: adminUser?.email });
      notify("Market data saved! Dashboard will update on next load.");
    } catch(e) { notify("Save failed"); }
    setMktSaving(false);
  };

  const resetToDefaults = async () => {
    setMktRows(defaultMarketData);
    try {
      await setDoc(doc(db, "tabData", "marketData"), { rows: defaultMarketData, updatedAt: new Date().toISOString(), updatedBy: adminUser?.email });
      notify("✅ Reset to default market data!");
    } catch(e) { notify("Reset failed"); }
  };

  if (!mktRows) return <div style={{ padding: 40, textAlign: "center", color: T.textMuted }}>Loading...</div>;

  return (
    <Section title="Market Data Editor" sub="Update market stats shown on the Market tab — saves to Firestore">
      <div style={{ padding: "12px 16px", borderRadius: 10, background: "rgba(59,130,246,0.05)", border: "1px solid rgba(59,130,246,0.15)", marginBottom: 20, fontSize: 12, color: T.textSecondary, lineHeight: 1.6 }}>
        💡 Update these figures when new DLD, REIDIN, or Knight Frank reports are released.
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 1fr 1fr 1fr 40px", gap: 8, padding: "6px 10px" }}>
          {["Metric", "Value", "Period", "Source", "Change %", "Category", ""].map(h => (
            <div key={h} style={{ fontSize: 9, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: 1 }}>{h}</div>
          ))}
        </div>
        {mktRows.length === 0 && (
          <div style={{ padding: "24px", textAlign: "center", color: T.textMuted, fontSize: 13, background: T.surfaceAlt, borderRadius: 10, border: `1px solid ${T.border}` }}>
            No rows yet. Click "+ Add Row" or "Reset to Defaults" below.
          </div>
        )}
        {mktRows.map((row, i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 1fr 1fr 1fr 40px", gap: 8, padding: "8px 10px", background: T.surfaceAlt, borderRadius: 8, border: `1px solid ${T.border}`, alignItems: "center" }}>
            {["metric", "value", "period", "source", "change", "category"].map(key => (
              <input key={key} value={row[key] || ""} onChange={e => { const u = [...mktRows]; u[i] = { ...u[i], [key]: e.target.value }; setMktRows(u); }}
                style={{ width: "100%", padding: "7px 10px", background: T.bg, border: `1px solid ${T.border}`, borderRadius: 6, color: T.textPrimary, fontSize: 12, fontFamily: "'Outfit',sans-serif", outline: "none" }} />
            ))}
            <button type="button" onClick={() => setMktRows(prev => prev.filter((_, j) => j !== i))}
              style={{ width: 32, height: 32, borderRadius: 6, border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.08)", color: T.red, cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 14, flexWrap: "wrap", gap: 8 }}>
        <div style={{ display: "flex", gap: 8 }}>
          <button type="button" onClick={() => setMktRows(prev => [...prev, { metric: "", value: "", period: "", source: "", change: "", category: "" }])}
            style={{ padding: "9px 18px", borderRadius: 8, border: `1px solid ${T.teal}`, background: "rgba(0,191,165,0.08)", color: T.teal, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>+ Add Row</button>
          <button type="button" onClick={resetToDefaults}
            style={{ padding: "9px 18px", borderRadius: 8, border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.06)", color: T.red, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>↺ Reset to Defaults</button>
        </div>
        <button type="button" onClick={saveMarket} disabled={mktSaving}
          style={{ padding: "10px 24px", borderRadius: 8, border: "none", background: `linear-gradient(135deg, ${T.gold}, ${T.goldLight})`, color: T.bg, fontSize: 13, fontWeight: 700, cursor: mktSaving ? "wait" : "pointer", fontFamily: "'Outfit',sans-serif", opacity: mktSaving ? 0.7 : 1 }}>
          {mktSaving ? "Saving..." : "Save Market Data to Firestore"}
        </button>
      </div>
    </Section>
  );
}

/* ─── LAUNCH RADAR COMPONENT ─── */
function LaunchRadar({ db, T, notify }) {
  const [scanning, setScanning] = React.useState(false);
  const [launches, setLaunches] = React.useState([]);
  const [saved, setSaved] = React.useState([]);
  const [scanLog, setScanLog] = React.useState([]);
  const [lastScan, setLastScan] = React.useState(null);
  const [devFilter, setDevFilter] = React.useState("All");
  const [tierFilter, setTierFilter] = React.useState("All");
  const [adding, setAdding] = React.useState(null);
  const [showAddModal, setShowAddModal] = React.useState(false);
  const [selectedProject, setSelectedProject] = React.useState(null);
  const [modalForm, setModalForm] = React.useState({});
  const [expandedProject, setExpandedProject] = React.useState(null);
  const [scanStats, setScanStats] = React.useState(null);

  const ALL_DEVELOPERS = [
    { id: "emaar", name: "Emaar Properties", shortName: "Emaar" },
    { id: "damac", name: "DAMAC Properties", shortName: "DAMAC" },
    { id: "sobha", name: "Sobha Realty", shortName: "Sobha" },
    { id: "nakheel", name: "Nakheel", shortName: "Nakheel" },
    { id: "meraas", name: "Meraas", shortName: "Meraas" },
    { id: "binghatti", name: "Binghatti Developers", shortName: "Binghatti" },
    { id: "ellington", name: "Ellington Properties", shortName: "Ellington" },
    { id: "azizi", name: "Azizi Developments", shortName: "Azizi" },
    { id: "danube", name: "Danube Properties", shortName: "Danube" },
    { id: "mag", name: "MAG Group", shortName: "MAG" },
    { id: "dubai_properties", name: "Dubai Properties", shortName: "DP" },
    { id: "aldar", name: "Aldar Properties", shortName: "Aldar" },
    { id: "nshama", name: "Nshama", shortName: "Nshama" },
    { id: "imtiaz", name: "Imtiaz Developments", shortName: "Imtiaz" },
    { id: "reportage", name: "Reportage Properties", shortName: "Reportage" },
    { id: "samana", name: "Samana Developers", shortName: "Samana" },
    { id: "taraf", name: "Taraf", shortName: "Taraf" },
    { id: "other", name: "Other Developer", shortName: "Other" },
  ];

  const addLog = (msg, type = "info") => setScanLog(prev => [...prev, { msg, type, ts: new Date().toLocaleTimeString("en-AE") }]);

  React.useEffect(() => {
    const unsub = onSnapshot(collection(db, "radarLaunches"), (snap) => {
      setSaved(snap.docs.map(d => d.data().projectName));
    });
    return () => unsub();
  }, []);

  const getKnownLaunches = () => {
    return [
      // ── EMAAR ──
      { projectName: "Vida Residences Hillside", developer: "Emaar Properties", developerId: "emaar", community: "Dubai Hills Estate", district: "DHE", priceFrom: 1800000, beds: "1-3", type: "Apartments", handover: "Q2 2029", payment: "80/20", construction: 15, branded: true, brand: "Vida Hotels", tier: "Premium", source: "Bayut.com", sourceUrl: "https://www.bayut.com/new-projects/dubai/dubai-hills-estate/", verifiedUrl: "https://properties.emaar.com" },
      { projectName: "Hillsedge", developer: "Emaar Properties", developerId: "emaar", community: "Dubai Hills Estate", district: "DHE", priceFrom: 1840000, beds: "1-3", type: "Apartments", handover: "Q1 2029", payment: "80/20", construction: 10, branded: false, brand: "—", tier: "Premium", source: "Bayut.com", sourceUrl: "https://www.bayut.com/new-projects/dubai/dubai-hills-estate/", verifiedUrl: "https://properties.emaar.com" },
      { projectName: "Address Villas Hillcrest", developer: "Emaar Properties", developerId: "emaar", community: "Dubai Hills Estate", district: "DHE", priceFrom: 21700000, beds: "4-6", type: "Villas", handover: "Q2 2026", payment: "80/20", construction: 85, branded: true, brand: "Address Hotels", tier: "Ultra-Luxury", source: "Bayut.com", sourceUrl: "https://www.bayut.com/new-projects/dubai/dubai-hills-estate/", verifiedUrl: "https://properties.emaar.com" },
      { projectName: "Raya", developer: "Emaar Properties", developerId: "emaar", community: "Arabian Ranches III", district: "AR3", priceFrom: 1950000, beds: "3-4", type: "Townhouses", handover: "Q2 2026", payment: "80/20", construction: 90, branded: false, brand: "—", tier: "Mid-Premium", source: "Bayut.com", sourceUrl: "https://www.bayut.com/new-projects/dubai/arabian-ranches-3/", verifiedUrl: "https://properties.emaar.com" },
      { projectName: "Farm Gardens", developer: "Emaar Properties", developerId: "emaar", community: "The Valley", district: "VAL", priceFrom: 5100000, beds: "4-5", type: "Villas", handover: "Q3 2026", payment: "80/20", construction: 75, branded: false, brand: "—", tier: "Premium", source: "Bayut.com", sourceUrl: "https://www.bayut.com/new-projects/dubai/the-valley-by-emaar/", verifiedUrl: "https://properties.emaar.com" },
      { projectName: "Palace Beach Residence", developer: "Emaar Properties", developerId: "emaar", community: "Emaar Beachfront", district: "EBF", priceFrom: 2970000, beds: "1-4", type: "Apartments", handover: "Q4 2026", payment: "80/20", construction: 80, branded: true, brand: "Palace Hotels", tier: "Premium", source: "Bayut.com", sourceUrl: "https://www.bayut.com/new-projects/dubai/dubai-harbour/emaar-beachfront/", verifiedUrl: "https://properties.emaar.com" },
      { projectName: "Beachgate by Address", developer: "Emaar Properties", developerId: "emaar", community: "Emaar Beachfront", district: "EBF", priceFrom: 2700000, beds: "1-4", type: "Apts & TH", handover: "Q4 2026", payment: "80/20", construction: 80, branded: true, brand: "Address Hotels", tier: "Premium", source: "Bayut.com", sourceUrl: "https://www.bayut.com/new-projects/dubai/dubai-harbour/emaar-beachfront/", verifiedUrl: "https://properties.emaar.com" },
      { projectName: "Golf Meadows", developer: "Emaar Properties", developerId: "emaar", community: "Dubai South", district: "DS", priceFrom: 1100000, beds: "1-3", type: "Apts & TH", handover: "Q3 2029", payment: "80/20", construction: 5, branded: false, brand: "—", tier: "Mid-Market", source: "Bayut.com", sourceUrl: "https://www.bayut.com/new-projects/dubai/dubai-south/emaar-south/", verifiedUrl: "https://properties.emaar.com" },
      // ── DAMAC ──
      { projectName: "ELO 3", developer: "DAMAC Properties", developerId: "damac", community: "DAMAC Hills 2", district: "DH2", priceFrom: 580000, beds: "1-2", type: "Apartments", handover: "Q2 2027", payment: "70/30", construction: 25, branded: false, brand: "—", tier: "Mid-Market", source: "Bayut.com", sourceUrl: "https://www.bayut.com/new-projects/developers/damac-properties/", verifiedUrl: "https://www.damacproperties.com" },
      { projectName: "Utopia", developer: "DAMAC Properties", developerId: "damac", community: "DAMAC Hills", district: "DAH", priceFrom: 18100000, beds: "5-7", type: "Villas", handover: "Q4 2026", payment: "60/40", construction: 70, branded: false, brand: "—", tier: "Ultra-Luxury", source: "Bayut.com", sourceUrl: "https://www.bayut.com/new-projects/dubai/damac-hills/", verifiedUrl: "https://www.damacproperties.com" },
      { projectName: "Safa One", developer: "DAMAC Properties", developerId: "damac", community: "Business Bay", district: "BB", priceFrom: 1620000, beds: "Studio-3", type: "Apartments", handover: "Q1 2026", payment: "90/10", construction: 97, branded: true, brand: "de GRISOGONO", tier: "Ultra-Luxury", source: "Bayut.com", sourceUrl: "https://www.bayut.com/new-projects/developers/damac-properties/", verifiedUrl: "https://www.damacproperties.com" },
      { projectName: "Chic Tower", developer: "DAMAC Properties", developerId: "damac", community: "Business Bay", district: "BB", priceFrom: 823000, beds: "Studio-2", type: "Apartments", handover: "Q2 2026", payment: "80/20", construction: 85, branded: false, brand: "—", tier: "Mid-Market", source: "Bayut.com", sourceUrl: "https://www.bayut.com/new-projects/developers/damac-properties/", verifiedUrl: "https://www.damacproperties.com" },
      { projectName: "DAMAC Bay by Cavalli", developer: "DAMAC Properties", developerId: "damac", community: "Dubai Harbour", district: "DH", priceFrom: 2900000, beds: "1-4", type: "Apartments", handover: "Q3 2027", payment: "60/40", construction: 35, branded: true, brand: "Roberto Cavalli", tier: "Ultra-Luxury", source: "Bayut.com", sourceUrl: "https://www.bayut.com/new-projects/developers/damac-properties/", verifiedUrl: "https://www.damacproperties.com" },
      // ── SOBHA ──
      { projectName: "Sobha One Towers", developer: "Sobha Realty", developerId: "sobha", community: "Sobha Hartland", district: "SH", priceFrom: 1100000, beds: "1-3", type: "Apartments", handover: "Q4 2026", payment: "60/40", construction: 75, branded: false, brand: "—", tier: "Premium", source: "Bayut.com", sourceUrl: "https://www.bayut.com/new-projects/dubai/sobha-hartland/", verifiedUrl: "https://www.sobharealty.com" },
      { projectName: "Sobha Elwood", developer: "Sobha Realty", developerId: "sobha", community: "Dubailand", district: "DL", priceFrom: 1600000, beds: "3-5", type: "Villas", handover: "Q4 2027", payment: "60/40", construction: 20, branded: false, brand: "—", tier: "Premium", source: "sobharealty.com", sourceUrl: "https://www.sobharealty.com", verifiedUrl: "https://www.sobharealty.com" },
      { projectName: "Sobha Estates Villas", developer: "Sobha Realty", developerId: "sobha", community: "Sobha Hartland 2", district: "SH2", priceFrom: 22000000, beds: "5-6", type: "Villas", handover: "Q4 2026", payment: "60/40", construction: 70, branded: false, brand: "—", tier: "Ultra-Luxury", source: "Bayut.com", sourceUrl: "https://www.bayut.com/new-projects/dubai/sobha-hartland/", verifiedUrl: "https://www.sobharealty.com" },
      // ── NAKHEEL ──
      { projectName: "Palm Jebel Ali Villas Phase 2", developer: "Nakheel", developerId: "nakheel", community: "Palm Jebel Ali", district: "PJA", priceFrom: 8500000, beds: "4-7", type: "Villas", handover: "Q4 2027", payment: "80/20", construction: 30, branded: false, brand: "—", tier: "Ultra-Luxury", source: "nakheel.com", sourceUrl: "https://www.nakheel.com", verifiedUrl: "https://www.nakheel.com" },
      // ── BINGHATTI ──
      { projectName: "Mercedes-Benz Places", developer: "Binghatti Developers", developerId: "binghatti", community: "Downtown Dubai", district: "DT", priceFrom: 8800000, beds: "1-4", type: "Apartments", handover: "Q4 2026", payment: "70/30", construction: 70, branded: true, brand: "Mercedes-Benz", tier: "Ultra-Luxury", source: "Bayut.com", sourceUrl: "https://www.bayut.com/new-projects/developers/binghatti-developers/", verifiedUrl: "https://binghatti.com" },
      { projectName: "Burj Binghatti Jacob & Co", developer: "Binghatti Developers", developerId: "binghatti", community: "Business Bay", district: "BB", priceFrom: 8200000, beds: "1-4", type: "Apartments", handover: "Q2 2026", payment: "80/20", construction: 90, branded: true, brand: "Jacob & Co", tier: "Ultra-Luxury", source: "Bayut.com", sourceUrl: "https://www.bayut.com/new-projects/developers/binghatti-developers/", verifiedUrl: "https://binghatti.com" },
      { projectName: "One by Binghatti", developer: "Binghatti Developers", developerId: "binghatti", community: "Business Bay", district: "BB", priceFrom: 1700000, beds: "1-3", type: "Apartments", handover: "Q4 2026", payment: "70/30", construction: 60, branded: false, brand: "—", tier: "Mid-Premium", source: "Bayut.com", sourceUrl: "https://www.bayut.com/new-projects/developers/binghatti-developers/", verifiedUrl: "https://binghatti.com" },
      { projectName: "Binghatti Elite", developer: "Binghatti Developers", developerId: "binghatti", community: "Dubai Production City", district: "IMPZ", priceFrom: 600000, beds: "Studio-2", type: "Apartments", handover: "Q2 2026", payment: "70/30", construction: 85, branded: false, brand: "—", tier: "Mid-Market", source: "Bayut.com", sourceUrl: "https://www.bayut.com/new-projects/developers/binghatti-developers/", verifiedUrl: "https://binghatti.com" },
      // ── ELLINGTON ──
      { projectName: "Ocean House", developer: "Ellington Properties", developerId: "ellington", community: "Palm Jumeirah", district: "PJ", priceFrom: 8370000, beds: "2-4", type: "Apartments", handover: "Q2 2026", payment: "70/30", construction: 85, branded: false, brand: "—", tier: "Ultra-Luxury", source: "Bayut.com", sourceUrl: "https://www.bayut.com/new-projects/developers/ellington-properties/", verifiedUrl: "https://ellingtonproperties.com" },
      { projectName: "Art Bay West", developer: "Ellington Properties", developerId: "ellington", community: "Al Jaddaf", district: "JAD", priceFrom: 1980000, beds: "1-4", type: "Apartments", handover: "Q3 2026", payment: "70/30", construction: 60, branded: false, brand: "—", tier: "Premium", source: "Bayut.com", sourceUrl: "https://www.bayut.com/new-projects/developers/ellington-properties/", verifiedUrl: "https://ellingtonproperties.com" },
      { projectName: "Highgrove by Ellington", developer: "Ellington Properties", developerId: "ellington", community: "Mohammed Bin Rashid City", district: "MBR", priceFrom: 1700000, beds: "1-4", type: "Apts & Villas", handover: "Q4 2027", payment: "70/30", construction: 20, branded: false, brand: "—", tier: "Premium", source: "Bayut.com", sourceUrl: "https://www.bayut.com/new-projects/developers/ellington-properties/", verifiedUrl: "https://ellingtonproperties.com" },
      { projectName: "Hillmont Residences", developer: "Ellington Properties", developerId: "ellington", community: "Jumeirah Village Circle", district: "JVC", priceFrom: 1330000, beds: "1-3", type: "Apartments", handover: "Q4 2026", payment: "70/30", construction: 60, branded: false, brand: "—", tier: "Mid-Premium", source: "Bayut.com", sourceUrl: "https://www.bayut.com/new-projects/developers/ellington-properties/", verifiedUrl: "https://ellingtonproperties.com" },
      // ── AZIZI ──
      { projectName: "Azizi Venice", developer: "Azizi Developments", developerId: "azizi", community: "Dubai South", district: "DS", priceFrom: 480000, beds: "Studio-3", type: "Apartments", handover: "Q1 2026", payment: "50/50", construction: 98, branded: false, brand: "—", tier: "Mid-Market", source: "Bayut.com", sourceUrl: "https://www.bayut.com/new-projects/dubai/dubai-south/", verifiedUrl: "https://www.azizidevelopments.com" },
      // ── DANUBE ──
      { projectName: "Oceanz by Danube", developer: "Danube Properties", developerId: "danube", community: "Dubai Maritime City", district: "DMC", priceFrom: 1100000, beds: "Studio-3", type: "Apartments", handover: "Q1 2027", payment: "64/36", construction: 50, branded: false, brand: "—", tier: "Mid-Premium", source: "Bayut.com", sourceUrl: "https://www.bayut.com/new-projects/uae/", verifiedUrl: "https://www.danubeproperties.ae" },
      // ── ALDAR ──
      { projectName: "Saadiyat Lagoons", developer: "Aldar Properties", developerId: "aldar", community: "Saadiyat Island", district: "SAD", priceFrom: 6400000, beds: "4-6", type: "Villas", handover: "Q2 2026", payment: "40/60", construction: 85, branded: false, brand: "—", tier: "Ultra-Luxury", source: "Bayut.com", sourceUrl: "https://www.bayut.com/new-projects/uae/", verifiedUrl: "https://www.aldar.com" },
      { projectName: "Athlon by Aldar", developer: "Aldar Properties", developerId: "aldar", community: "Dubailand", district: "DL", priceFrom: 2800000, beds: "3-5", type: "Villas", handover: "Q3 2028", payment: "60/40", construction: 20, branded: false, brand: "—", tier: "Premium", source: "Bayut.com", sourceUrl: "https://www.bayut.com/new-projects/uae/", verifiedUrl: "https://www.aldar.com" },
      // ── TARAF ──
      { projectName: "Karl Lagerfeld Villas", developer: "Taraf", developerId: "taraf", community: "Meydan", district: "MYD", priceFrom: 15000000, beds: "5-7", type: "Villas", handover: "Q2 2027", payment: "60/40", construction: 25, branded: true, brand: "Karl Lagerfeld", tier: "Ultra-Luxury", source: "Bayut.com", sourceUrl: "https://www.bayut.com/new-projects/dubai/", verifiedUrl: "" },
    ];
  };

  const runScan = async () => {
    setScanning(true);
    setScanLog([]);
    setLaunches([]);
    setScanStats(null);
    addLog("Scanning all sources via server...", "info");

    try {
      const BASE_URL = window.location.origin;
      addLog(`Calling ${BASE_URL}/api/scan-launches`, "info");
      const res = await fetch(`${BASE_URL}/api/scan-launches`, { signal: AbortSignal.timeout(60000) });
      if (!res.ok) throw new Error(`API ${res.status}`);
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "API error");

      const stats = { bayut: data.breakdown?.bayut || 0, pf: data.breakdown?.propertyfinder || 0, dld: data.breakdown?.dubaiPulse || 0 };
      setScanStats(stats);
      addLog(`Bayut: ${stats.bayut} · PropertyFinder: ${stats.pf} · DLD: ${stats.dld}`, "success");
      if (data.errors?.length) data.errors.forEach(e => addLog(e, "warn"));

      const known = getKnownLaunches();
      const all = [...data.projects, ...known];
      const seen = new Set();
      const deduped = all.filter(p => {
        const k = (p.projectName || "").toLowerCase().replace(/[^a-z0-9]/g, "");
        if (!k || seen.has(k)) return false;
        seen.add(k); return true;
      });
      setLaunches(deduped);
      setLastScan(new Date().toLocaleString("en-AE"));
      addLog(`Done — ${deduped.length} total (${data.projects.length} live + ${known.length} database)`, "success");
      notify(`Launch Radar: ${deduped.length} projects`);
    } catch (err) {
      addLog(`Live scan failed: ${err.message} — loading verified database`, "warn");
      const known = getKnownLaunches();
      setLaunches(known);
      setLastScan(new Date().toLocaleString("en-AE"));
      addLog(`${known.length} verified projects loaded. Deploy api/scan-launches.js for live data.`, "info");
      notify(`${known.length} verified projects (deploy API for live)`);
    }
    setScanning(false);
  };

  const openAddModal = (project) => {
    const detectedDev = ALL_DEVELOPERS.find(d =>
      project.developer && (project.developer.toLowerCase().includes(d.shortName.toLowerCase()) || d.name.toLowerCase().includes(project.developer.toLowerCase()))
    );
    setSelectedProject(project);
    setModalForm({
      developerId: project.developerId || detectedDev?.id || "other",
      developerName: detectedDev?.name || project.developer || "",
      projectName: project.projectName, community: project.community || "",
      district: project.district || "", type: project.type || "Apartments",
      beds: project.beds || "1-3", priceFrom: project.priceFrom || 0,
      handover: project.handover || "Q4 2027", payment: project.payment || "60/40",
      status: "Under Construction", construction: project.construction || 5,
      branded: project.branded || false, brand: project.brand || "—",
      tier: project.tier || "Mid-Market", sourceUrl: project.sourceUrl || "",
      verifiedUrl: project.verifiedUrl || "",
    });
    setShowAddModal(true);
  };

  const confirmAdd = async () => {
    if (!selectedProject || !modalForm.developerId) return;
    setAdding(selectedProject.projectName);
    setShowAddModal(false);
    try {
      const devObj = ALL_DEVELOPERS.find(d => d.id === modalForm.developerId);
      const ppsf = modalForm.priceFrom > 0 ? Math.round(modalForm.priceFrom / 1000) : 0;
      const docKey = `${modalForm.developerId}_${modalForm.projectName.replace(/[^a-zA-Z0-9]/g, "_")}`;
      await setDoc(doc(db, "projects", docKey), {
        name: modalForm.projectName, developer: devObj?.name || modalForm.developerName,
        developerId: modalForm.developerId, community: modalForm.community || "Dubai",
        district: (modalForm.community || "DXB").substring(0, 3).toUpperCase(),
        type: modalForm.type, beds: modalForm.beds, status: modalForm.status,
        handover: modalForm.handover, price: parseInt(modalForm.priceFrom) || 0,
        sizeFrom: 600, sizeTo: 2000, ppsf, payment: modalForm.payment,
        construction: parseInt(modalForm.construction) || 5,
        branded: modalForm.branded, brand: modalForm.brand, tier: modalForm.tier,
        source: selectedProject.source, sourceUrl: selectedProject.sourceUrl || modalForm.sourceUrl,
        verifiedUrl: selectedProject.verifiedUrl || modalForm.verifiedUrl,
        addedViaRadar: true, addedAt: new Date().toISOString(),
      });
      await setDoc(doc(db, "radarLaunches", docKey), {
        projectName: modalForm.projectName, developer: devObj?.name || modalForm.developerName,
        developerId: modalForm.developerId, addedAt: new Date().toISOString(), source: selectedProject.source,
      });
      setSaved(prev => [...prev, selectedProject.projectName]);
      notify(`✅ "${modalForm.projectName}" added under ${devObj?.name || modalForm.developerName}`);
    } catch (err) {
      notify(`❌ Failed: ${err.message}`);
    }
    setAdding(null);
    setSelectedProject(null);
  };

  const TIERS = ["All", "Ultra-Luxury", "Premium", "Mid-Premium", "Mid-Market"];
  const devOptions = ["All", ...new Set(launches.map(l => l.developer).filter(Boolean).filter(d => d !== "—"))];
  const filtered = launches.filter(p => {
    if (devFilter !== "All" && p.developer !== devFilter) return false;
    if (tierFilter !== "All" && p.tier !== tierFilter) return false;
    return true;
  });

  const tierColor = (t) => t === "Ultra-Luxury" ? "#8B5CF6" : t === "Premium" ? T.teal : t === "Mid-Premium" ? T.blue : T.textMuted;
  const sourceBadgeColor = (s) => s?.includes("Bayut") ? T.gold : s?.includes("Dubai Pulse") ? T.green : s?.includes("PropertyFinder") ? T.blue : T.textMuted;

  return (
    <div style={{ padding: "0" }}>

      {/* ── TOP STATS BAR ─────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr auto", gap: 1, background: T.border, borderRadius: 12, overflow: "hidden", marginBottom: 20, border: `1px solid ${T.border}` }}>
        {[
          { label: "Total Projects", value: launches.length || "—", sub: "in radar" },
          { label: "Live Sources", value: scanStats ? `${(scanStats.bayut||0)+(scanStats.pf||0)+(scanStats.dld||0)}` : "3", sub: "Bayut · PF · DLD" },
          { label: "Added to Platform", value: saved.length || 0, sub: "this session" },
          { label: "Last Scan", value: lastScan ? lastScan.split(",")[1]?.trim() || "—" : "—", sub: lastScan ? lastScan.split(",")[0] : "Never" },
        ].map((stat, i) => (
          <div key={i} style={{ padding: "16px 20px", background: T.surface }}>
            <div style={{ fontSize: 10, color: T.textMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6 }}>{stat.label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: T.gold, fontFamily: "'Fraunces',serif", lineHeight: 1 }}>{stat.value}</div>
            <div style={{ fontSize: 10, color: T.textMuted, marginTop: 4 }}>{stat.sub}</div>
          </div>
        ))}
        <div style={{ padding: "16px 20px", background: T.surface, display: "flex", alignItems: "center" }}>
          <button type="button" onClick={runScan} disabled={scanning}
            style={{ padding: "10px 22px", background: scanning ? T.surfaceAlt : `linear-gradient(135deg, ${T.gold} 0%, #B8912F 100%)`, border: "none", borderRadius: 8, color: scanning ? T.textMuted : "#0A0E1A", fontWeight: 700, fontSize: 13, cursor: scanning ? "not-allowed" : "pointer", fontFamily: "'Outfit',sans-serif", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 8, transition: "all 0.2s" }}>
            {scanning ? (
              <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: "spin 1s linear infinite" }}><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>Scanning…</>
            ) : (
              <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>Scan Now</>
            )}
          </button>
        </div>
      </div>

      {/* ── SOURCE STATUS BAR ─────────────────────────────────────── */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {[
          { label: "Bayut.com", count: scanStats?.bayut, icon: "🏠", color: T.gold, desc: "Live listings API" },
          { label: "PropertyFinder.ae", count: scanStats?.pf, icon: "🔍", color: T.blue, desc: "New projects API" },
          { label: "Dubai Pulse / DLD", count: scanStats?.dld, icon: "🏛️", color: T.green, desc: "Registered transactions" },
          { label: "Verified Database", count: getKnownLaunches().length, icon: "✓", color: T.teal, desc: "30 researched projects" },
        ].map((src, i) => (
          <div key={i} style={{ flex: 1, minWidth: 160, padding: "12px 14px", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, display: "flex", gap: 10, alignItems: "center" }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: `${src.color}15`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, flexShrink: 0 }}>{src.icon}</div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.white, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{src.label}</div>
              <div style={{ fontSize: 10, color: T.textMuted }}>{src.count !== undefined ? <span style={{ color: src.color, fontWeight: 700 }}>{src.count} found</span> : src.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── FILTERS + TABLE ───────────────────────────────────────── */}
      {launches.length > 0 && (
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, overflow: "hidden" }}>

          {/* Filter bar */}
          <div style={{ padding: "14px 20px", borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 11, color: T.textMuted, fontWeight: 600 }}>DEVELOPER</span>
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                {["All", "Emaar Properties", "DAMAC Properties", "Sobha Realty", "Binghatti Developers", "Ellington Properties", "Nakheel"].map(d => (
                  <button key={d} type="button" onClick={() => setDevFilter(d)}
                    style={{ fontSize: 10, padding: "4px 10px", borderRadius: 5, border: `1px solid ${devFilter === d ? T.gold : T.border}`, background: devFilter === d ? `${T.gold}15` : "transparent", color: devFilter === d ? T.gold : T.textMuted, cursor: "pointer", fontFamily: "'Outfit',sans-serif", fontWeight: 600, transition: "all 0.15s" }}>
                    {d === "All" ? "All" : d.split(" ")[0]}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 11, color: T.textMuted, fontWeight: 600 }}>TIER</span>
              <div style={{ display: "flex", gap: 4 }}>
                {TIERS.map(t => (
                  <button key={t} type="button" onClick={() => setTierFilter(t)}
                    style={{ fontSize: 10, padding: "4px 10px", borderRadius: 5, border: `1px solid ${tierFilter === t ? tierColor(t) : T.border}`, background: tierFilter === t ? `${tierColor(t)}15` : "transparent", color: tierFilter === t ? tierColor(t) : T.textMuted, cursor: "pointer", fontFamily: "'Outfit',sans-serif", fontWeight: 600 }}>
                    {t === "All" ? "All" : t === "Ultra-Luxury" ? "Ultra" : t === "Mid-Premium" ? "Mid+" : t === "Mid-Market" ? "Mid" : t}
                  </button>
                ))}
              </div>
            </div>
            <span style={{ fontSize: 11, color: T.textMuted }}>{filtered.length} projects</span>
          </div>

          {/* Table header */}
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1.2fr 0.8fr 0.8fr 0.8fr 0.8fr 0.8fr 0.8fr 120px", gap: 0, padding: "8px 20px", borderBottom: `1px solid ${T.border}`, background: T.surfaceAlt }}>
            {["PROJECT", "DEVELOPER", "COMMUNITY", "TYPE", "FROM", "HANDOVER", "PAYMENT", "PROGRESS", "ACTIONS"].map((h, i) => (
              <div key={i} style={{ fontSize: 9, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: 0.8, textAlign: i >= 4 ? "center" : "left" }}>{h}</div>
            ))}
          </div>

          {/* Table rows */}
          <div style={{ maxHeight: 520, overflowY: "auto" }}>
            {filtered.map((p, i) => {
              const isAdded = saved.includes(p.projectName);
              const isAdding = adding === p.projectName;
              const isExpanded = expandedProject === p.projectName;
              return (
                <div key={i}>
                  <div
                    onClick={() => setExpandedProject(isExpanded ? null : p.projectName)}
                    style={{ display: "grid", gridTemplateColumns: "2fr 1.2fr 0.8fr 0.8fr 0.8fr 0.8fr 0.8fr 0.8fr 120px", gap: 0, padding: "12px 20px", borderBottom: `1px solid ${T.border}`, background: isAdded ? "rgba(16,185,129,0.03)" : i % 2 === 0 ? "transparent" : `${T.surfaceAlt}50`, cursor: "pointer", transition: "background 0.15s" }}
                    onMouseEnter={e => { if (!isAdded) e.currentTarget.style.background = `${T.gold}08`; }}
                    onMouseLeave={e => { e.currentTarget.style.background = isAdded ? "rgba(16,185,129,0.03)" : i % 2 === 0 ? "transparent" : `${T.surfaceAlt}50`; }}
                  >
                    {/* Project name + badges */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 4, justifyContent: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: isAdded ? T.green : T.white }}>{p.projectName}</span>
                        {isAdded && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={T.green} strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
                      </div>
                      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                        {p.branded && <span style={{ fontSize: 9, padding: "1px 5px", borderRadius: 3, background: `${T.gold}15`, color: T.gold, fontWeight: 600 }}>🏷 {p.brand}</span>}
                        <span style={{ fontSize: 9, padding: "1px 5px", borderRadius: 3, background: `${tierColor(p.tier)}15`, color: tierColor(p.tier), fontWeight: 600 }}>{p.tier}</span>
                        <span style={{ fontSize: 9, padding: "1px 5px", borderRadius: 3, background: `${sourceBadgeColor(p.source)}10`, color: sourceBadgeColor(p.source), fontWeight: 600 }}>{p.source?.split(".")[0]}</span>
                      </div>
                    </div>
                    {/* Developer */}
                    <div style={{ display: "flex", alignItems: "center" }}>
                      <span style={{ fontSize: 11, color: T.textSecondary }}>{p.developer?.split(" ")[0]}</span>
                    </div>
                    {/* Community */}
                    <div style={{ display: "flex", alignItems: "center" }}>
                      <span style={{ fontSize: 11, color: T.textSecondary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.community}</span>
                    </div>
                    {/* Type */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ fontSize: 10, color: T.textMuted }}>{p.type}</span>
                    </div>
                    {/* Price */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: T.gold }}>{p.priceFrom > 0 ? `${(p.priceFrom/1e6).toFixed(1)}M` : "—"}</span>
                    </div>
                    {/* Handover */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ fontSize: 10, color: T.teal, fontWeight: 600 }}>{p.handover || "—"}</span>
                    </div>
                    {/* Payment */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ fontSize: 10, color: T.textMuted }}>{p.payment || "—"}</span>
                    </div>
                    {/* Construction */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                      <div style={{ width: 32, height: 4, background: T.border, borderRadius: 2, overflow: "hidden" }}>
                        <div style={{ width: `${p.construction || 0}%`, height: "100%", background: p.construction >= 80 ? T.green : p.construction >= 40 ? T.gold : T.blue, borderRadius: 2 }} />
                      </div>
                      <span style={{ fontSize: 10, color: T.textMuted }}>{p.construction || 0}%</span>
                    </div>
                    {/* Actions */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 6 }} onClick={e => e.stopPropagation()}>
                      <a href={p.verifiedUrl || p.sourceUrl} target="_blank" rel="noreferrer"
                        style={{ width: 28, height: 28, borderRadius: 6, border: `1px solid ${T.border}`, background: "transparent", color: T.textMuted, display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none", flexShrink: 0 }}
                        title="View source">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                      </a>
                      {isAdded ? (
                        <div style={{ width: 28, height: 28, borderRadius: 6, background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={T.green} strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                        </div>
                      ) : (
                        <button type="button" onClick={() => openAddModal(p)} disabled={!!isAdding}
                          style={{ height: 28, padding: "0 10px", borderRadius: 6, border: "none", background: isAdding ? T.surfaceAlt : T.green, color: isAdding ? T.textMuted : "#fff", fontWeight: 700, fontSize: 11, cursor: isAdding ? "not-allowed" : "pointer", fontFamily: "'Outfit',sans-serif", whiteSpace: "nowrap" }}>
                          {isAdding ? "…" : "+ Add"}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Expanded row */}
                  {isExpanded && (
                    <div style={{ padding: "16px 20px 20px", background: `${T.gold}06`, borderBottom: `1px solid ${T.border}` }}>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 10 }}>
                        {[
                          { label: "Full Developer", value: p.developer },
                          { label: "Community", value: p.community },
                          { label: "District Code", value: p.district || "—" },
                          { label: "Unit Types", value: p.type },
                          { label: "Bedrooms", value: p.beds || "—" },
                          { label: "Starting Price", value: p.priceFrom > 0 ? `AED ${p.priceFrom.toLocaleString()}` : "—" },
                          { label: "Handover", value: p.handover || "—" },
                          { label: "Payment Plan", value: p.payment || "—" },
                          { label: "Construction", value: `${p.construction || 0}%` },
                          { label: "Branded", value: p.branded ? `Yes — ${p.brand}` : "No" },
                          { label: "Tier", value: p.tier || "—" },
                          { label: "Source", value: p.source },
                        ].map((item, idx) => (
                          <div key={idx} style={{ padding: "8px 10px", background: T.surface, borderRadius: 8, border: `1px solid ${T.border}` }}>
                            <div style={{ fontSize: 9, color: T.textMuted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>{item.label}</div>
                            <div style={{ fontSize: 12, fontWeight: 600, color: T.white }}>{item.value}</div>
                          </div>
                        ))}
                      </div>
                      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                        <a href={p.sourceUrl} target="_blank" rel="noreferrer"
                          style={{ padding: "7px 14px", borderRadius: 7, border: `1px solid ${T.border}`, background: "transparent", color: T.textSecondary, fontSize: 11, fontWeight: 600, textDecoration: "none" }}>
                          📋 View on {p.source?.split(".")[0]}
                        </a>
                        {p.verifiedUrl && (
                          <a href={p.verifiedUrl} target="_blank" rel="noreferrer"
                            style={{ padding: "7px 14px", borderRadius: 7, border: "1px solid rgba(16,185,129,0.3)", background: "rgba(16,185,129,0.06)", color: T.green, fontSize: 11, fontWeight: 600, textDecoration: "none" }}>
                            ✓ Developer Website
                          </a>
                        )}
                        {!saved.includes(p.projectName) && (
                          <button type="button" onClick={() => openAddModal(p)}
                            style={{ padding: "7px 16px", borderRadius: 7, border: "none", background: `linear-gradient(135deg, ${T.green}, #059669)`, color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>
                            + Add to Platform
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── SCAN LOG ──────────────────────────────────────────────── */}
      {scanLog.length > 0 && (
        <div style={{ marginTop: 16, background: "#060A0F", border: `1px solid ${T.border}`, borderRadius: 10, padding: "12px 16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, letterSpacing: 1, textTransform: "uppercase" }}>Scan Log</span>
            <button type="button" onClick={() => setScanLog([])} style={{ fontSize: 10, color: T.textMuted, background: "none", border: "none", cursor: "pointer" }}>Clear</button>
          </div>
          <div style={{ maxHeight: 160, overflowY: "auto", display: "flex", flexDirection: "column", gap: 3 }}>
            {scanLog.map((entry, i) => (
              <div key={i} style={{ display: "flex", gap: 10, fontFamily: "monospace", fontSize: 11 }}>
                <span style={{ color: T.textMuted, flexShrink: 0 }}>{entry.ts}</span>
                <span style={{ color: entry.type === "success" ? T.green : entry.type === "warn" ? T.gold : T.textSecondary }}>{entry.msg}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── ADD TO PLATFORM MODAL ─────────────────────────────────── */}
      {showAddModal && selectedProject && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
          onClick={() => setShowAddModal(false)}>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, width: "100%", maxWidth: 580, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 24px 64px rgba(0,0,0,0.6)" }}
            onClick={e => e.stopPropagation()}>

            {/* Modal header */}
            <div style={{ padding: "20px 24px", borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: T.white, fontFamily: "'Fraunces',serif" }}>Add to Platform</div>
                <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>Confirm project details before publishing</div>
              </div>
              <button type="button" onClick={() => setShowAddModal(false)}
                style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${T.border}`, background: T.surfaceAlt, color: T.textMuted, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>✕</button>
            </div>

            <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>

              {/* Source info */}
              <div style={{ padding: "10px 14px", background: T.surfaceAlt, borderRadius: 8, border: `1px solid ${T.border}`, display: "flex", gap: 10, alignItems: "center" }}>
                <span style={{ fontSize: 18 }}>📡</span>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: T.white }}>{selectedProject.source}</div>
                  <div style={{ fontSize: 10, color: T.textMuted }}>{selectedProject.sourceUrl}</div>
                </div>
                {selectedProject.verifiedUrl && (
                  <a href={selectedProject.verifiedUrl} target="_blank" rel="noreferrer"
                    style={{ marginLeft: "auto", fontSize: 10, padding: "4px 10px", borderRadius: 6, border: "1px solid rgba(16,185,129,0.3)", background: "rgba(16,185,129,0.06)", color: T.green, textDecoration: "none", fontWeight: 600, whiteSpace: "nowrap" }}>
                    ✓ Verify on Developer Site
                  </a>
                )}
              </div>

              {/* Developer — most critical */}
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: T.textSecondary, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>Developer *</label>
                <select value={modalForm.developerId}
                  onChange={e => { const d = ALL_DEVELOPERS.find(x => x.id === e.target.value); setModalForm(f => ({ ...f, developerId: e.target.value, developerName: d?.name || "" })); }}
                  style={{ width: "100%", padding: "10px 14px", background: T.surfaceAlt, border: `2px solid ${T.gold}60`, borderRadius: 10, color: T.white, fontSize: 13, fontFamily: "'Outfit',sans-serif", fontWeight: 600, cursor: "pointer" }}>
                  {ALL_DEVELOPERS.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
                <div style={{ fontSize: 10, color: T.green, marginTop: 4 }}>
                  → Appears in dashboard when user selects <strong>{ALL_DEVELOPERS.find(d => d.id === modalForm.developerId)?.name}</strong>
                </div>
              </div>

              {/* 2-column fields */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {[
                  { label: "Project Name *", key: "projectName" },
                  { label: "Community *", key: "community" },
                  { label: "Starting Price (AED)", key: "priceFrom", type: "number" },
                  { label: "Handover", key: "handover", placeholder: "Q4 2027" },
                  { label: "Payment Plan", key: "payment", placeholder: "60/40" },
                  { label: "Bedrooms", key: "beds", placeholder: "1-3" },
                  { label: "Construction %", key: "construction", type: "number" },
                ].map(({ label, key, type = "text", placeholder }) => (
                  <div key={key}>
                    <label style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, display: "block", marginBottom: 5, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</label>
                    <input type={type} value={modalForm[key] || ""} placeholder={placeholder}
                      onChange={e => setModalForm(f => ({ ...f, [key]: type === "number" ? parseInt(e.target.value) || 0 : e.target.value }))}
                      style={{ width: "100%", padding: "9px 12px", background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8, color: T.white, fontSize: 12, fontFamily: "'Outfit',sans-serif", boxSizing: "border-box" }} />
                  </div>
                ))}
                <div>
                  <label style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, display: "block", marginBottom: 5, textTransform: "uppercase", letterSpacing: 0.5 }}>Type</label>
                  <select value={modalForm.type || "Apartments"} onChange={e => setModalForm(f => ({ ...f, type: e.target.value }))}
                    style={{ width: "100%", padding: "9px 12px", background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8, color: T.white, fontSize: 12, fontFamily: "'Outfit',sans-serif", cursor: "pointer" }}>
                    {["Apartments","Villas","Townhouses","Apts & TH","Mixed"].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              {/* Where it appears */}
              <div style={{ padding: "12px 14px", background: "rgba(16,185,129,0.05)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 8 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.green, marginBottom: 6 }}>Where it will appear</div>
                <div style={{ fontSize: 11, color: T.textMuted, lineHeight: 1.7 }}>
                  • <strong style={{ color: T.white }}>Projects tab</strong> when user selects <strong style={{ color: T.gold }}>{ALL_DEVELOPERS.find(d => d.id === modalForm.developerId)?.name}</strong><br/>
                  • <strong style={{ color: T.white }}>Map tab</strong> — auto-plotted on Dubai map<br/>
                  • <strong style={{ color: T.white }}>Launch Calendar</strong> — listed under {ALL_DEVELOPERS.find(d => d.id === modalForm.developerId)?.name}
                </div>
              </div>
            </div>

            {/* Modal footer */}
            <div style={{ padding: "16px 24px", borderTop: `1px solid ${T.border}`, display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button type="button" onClick={() => setShowAddModal(false)}
                style={{ padding: "10px 20px", background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 9, color: T.textSecondary, cursor: "pointer", fontFamily: "'Outfit',sans-serif", fontWeight: 600, fontSize: 13 }}>
                Cancel
              </button>
              <button type="button" onClick={confirmAdd}
                style={{ padding: "10px 24px", background: `linear-gradient(135deg, ${T.green}, #059669)`, border: "none", borderRadius: 9, color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>
                Publish to Platform
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── LIVE DATA SYNC COMPONENT ─── */
function LiveDataSync({ db, T, notify }) {
  const [syncing, setSyncing] = React.useState(false);
  const [syncLog, setSyncLog] = React.useState([]);
  const [lastSync, setLastSync] = React.useState(null);
  const [results, setResults] = React.useState(null);
  const [liveCount, setLiveCount] = React.useState(0);
  const [benchmarkCount, setBenchmarkCount] = React.useState(0);

  const log = (msg, type = "info") => setSyncLog(prev => [...prev, { msg, type, ts: new Date().toLocaleTimeString("en-AE") }]);

  const fetchDubaiREST = async () => {
    const fallbackPpsf = {
      "Downtown Dubai": 3150, "Dubai Marina": 1940, "Business Bay": 1720,
      "Dubai Hills Estate": 2050, "Jumeirah Village Circle": 1200, "Palm Jumeirah": 4400,
      "Dubai Creek Harbour": 1880, "Sobha Hartland": 2100, "DAMAC Hills": 1150,
      "Dubai Harbour": 2800, "City Walk": 2400, "Meydan": 1600,
      "Al Furjan": 1100, "JBR": 1950, "DAMAC Hills 2": 950,
      "Arabian Ranches III": 1450, "The Valley": 1380, "Emaar Beachfront": 2650,
      "DAMAC Lagoons": 1250, "Sobha Hartland 2": 1950, "Palm Jebel Ali": 2200,
      "Dubai Islands": 2500, "Tilal Al Ghaf": 1550, "Bluewaters Island": 3200,
      "Port de La Mer": 2600, "Mohammed Bin Rashid City": 1800, "District One": 2200,
      "Jumeirah Lake Towers": 1350, "Arjan": 1050, "Motor City": 950,
      "Dubai South": 1000, "Jumeirah Village Triangle": 1100,
      "Yas Island": 1300, "Saadiyat Island": 2400,
      "Arabian Ranches": 1650, "Arabian Ranches 2": 1580,
      "The Springs": 1420, "The Lakes": 1550,
      "Dubai Silicon Oasis": 880, "International City": 620,
      "Town Square": 1050, "Mudon": 1280,
      "Barsha Heights": 1100, "Nad Al Sheba": 1750,
      "Jumeirah": 2200, "Al Barsha": 1050,
      "Dubai Sports City": 900, "Dubailand": 950,
    };
    const results = {};
    Object.entries(fallbackPpsf).forEach(([name, ppsf]) => {
      results[name] = { avgPpsf: ppsf, source: "Q1 2026 Benchmark" };
    });
    return results;
  };

  const runSync = async () => {
    setSyncing(true);
    setSyncLog([]);
    setResults(null);
    setLiveCount(0);
    setBenchmarkCount(0);
    const synced = [];

    log("Starting market data sync...", "info");

    // Try Vercel API for live Bayut prices
    const BASE_URL = window.location.origin;
    let liveApiWorked = false;

    try {
      log(`Calling ${BASE_URL}/api/sync-market-data`, "info");
      const apiRes = await fetch(`${BASE_URL}/api/sync-market-data`, { signal: AbortSignal.timeout(90000) });
      if (apiRes.ok) {
        const apiData = await apiRes.json();
        if (apiData.success && apiData.data?.length > 0) {
          log(`Live Bayut: ${apiData.data.length} communities`, "success");
          if (apiData.errors?.length > 0) log(`${apiData.errors.length} failed`, "warn");
          for (const comm of apiData.data) {
            try {
              await setDoc(doc(db, "liveMarketData", comm.community.replace(/ /g, "_")), { ...comm, source: "Bayut.com (live)" }, { merge: true });
              synced.push(comm);
            } catch {}
          }
          log(`Saved ${synced.length} live prices`, "success");
          setLiveCount(synced.length);
          liveApiWorked = true;
        }
      }
    } catch (err) {
      log(`Vercel API not deployed — using benchmarks (${err.message.slice(0, 50)})`, "warn");
    }

    // Fill remaining with benchmarks
    const dubaiRestData = await fetchDubaiREST();
    let bCount = 0;
    for (const [commName, data] of Object.entries(dubaiRestData)) {
      if (!synced.find(s => s.community === commName)) {
        try {
          await setDoc(doc(db, "liveMarketData", commName.replace(/ /g, "_")), {
            community: commName, avgPpsf: data.avgPpsf, avgPrice: 0,
            listings: 0, source: data.source, bmPpsf: data.avgPpsf,
            syncedAt: new Date().toISOString(),
          }, { merge: true });
          bCount++;
        } catch {}
      }
    }
    setBenchmarkCount(bCount);
    if (bCount > 0) log(`${bCount} benchmark prices applied`, "info");

    const displayResults = synced.length > 0 ? synced
      : Object.entries(dubaiRestData).map(([n, d]) => ({ community: n, avgPpsf: d.avgPpsf, avgPrice: 0, listings: 0, source: d.source }));
    setResults(displayResults);
    setLastSync(new Date().toLocaleString("en-AE"));
    log(`Done — ${synced.length + bCount} communities updated`, "success");
    if (!liveApiWorked) log("Deploy api/sync-market-data.js to Vercel for live prices", "info");
    notify(`Sync complete — ${synced.length + bCount} communities ${liveApiWorked ? "(LIVE)" : "(benchmarks)"}`);
    setSyncing(false);
  };

  return (
    <div style={{ padding: "0" }}>

      {/* ── STATS ROW ────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: 1, background: T.border, borderRadius: 12, overflow: "hidden", marginBottom: 20, border: `1px solid ${T.border}` }}>
        {[
          { label: "Communities", value: 49, sub: "Dubai + Abu Dhabi" },
          { label: "Live Prices", value: liveCount || "—", sub: "from Bayut (API)" },
          { label: "Benchmarks", value: benchmarkCount || (liveCount === 0 ? 49 : 49 - liveCount), sub: "Q1 2026 fallback" },
        ].map((s, i) => (
          <div key={i} style={{ padding: "16px 20px", background: T.surface }}>
            <div style={{ fontSize: 10, color: T.textMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: T.gold, fontFamily: "'Fraunces',serif", lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: 10, color: T.textMuted, marginTop: 4 }}>{s.sub}</div>
          </div>
        ))}
        <div style={{ padding: "16px 20px", background: T.surface, display: "flex", alignItems: "center" }}>
          <button type="button" onClick={runSync} disabled={syncing}
            style={{ padding: "10px 22px", background: syncing ? T.surfaceAlt : `linear-gradient(135deg, ${T.gold}, #B8912F)`, border: "none", borderRadius: 8, color: syncing ? T.textMuted : "#0A0E1A", fontWeight: 700, fontSize: 13, cursor: syncing ? "not-allowed" : "pointer", fontFamily: "'Outfit',sans-serif", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 8 }}>
            {syncing ? (
              <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: "spin 1s linear infinite" }}><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>Syncing…</>
            ) : (
              <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>Sync Now</>
            )}
          </button>
        </div>
      </div>

      {/* ── DATA SOURCES ─────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10, marginBottom: 20 }}>
        {[
          { icon: "🏠", label: "Bayut.com", sub: "Live PPSF per community", status: liveCount > 0 ? "live" : "pending", note: "via Vercel API" },
          { icon: "🏛️", label: "Dubai Pulse / DLD", sub: "Official transaction data", status: "available", note: "Free CSV" },
          { icon: "📊", label: "Q1 2026 Benchmarks", sub: "DXBInteract + ValuStrat", status: "active", note: "Always available" },
          { icon: "⚡", label: "Vercel API Route", sub: "api/sync-market-data.js", status: "deploy", note: "Enables live Bayut" },
        ].map((src, i) => {
          const statusColors = { live: T.green, available: T.teal, active: T.gold, pending: T.textMuted, deploy: "#8B5CF6" };
          const statusLabels = { live: "● Live", available: "● Available", active: "● Active", pending: "○ Pending", deploy: "Deploy" };
          return (
            <div key={i} style={{ padding: "14px 16px", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <span style={{ fontSize: 20 }}>{src.icon}</span>
                <span style={{ fontSize: 9, fontWeight: 700, color: statusColors[src.status], padding: "2px 6px", borderRadius: 4, background: `${statusColors[src.status]}15` }}>
                  {statusLabels[src.status]}
                </span>
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.white, marginBottom: 2 }}>{src.label}</div>
              <div style={{ fontSize: 10, color: T.textMuted }}>{src.sub}</div>
              <div style={{ fontSize: 9, color: T.textMuted, marginTop: 4, fontStyle: "italic" }}>{src.note}</div>
            </div>
          );
        })}
      </div>

      {/* ── RESULTS TABLE ────────────────────────────────────────── */}
      {results && results.length > 0 && (
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, overflow: "hidden", marginBottom: 16 }}>
          <div style={{ padding: "12px 20px", borderBottom: `1px solid ${T.border}`, display: "grid", gridTemplateColumns: "1fr 0.8fr 0.8fr 0.5fr 1fr", background: T.surfaceAlt }}>
            {["COMMUNITY", "AVG PPSF", "AVG PRICE", "LISTINGS", "SOURCE"].map(h => (
              <div key={h} style={{ fontSize: 9, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: 0.8 }}>{h}</div>
            ))}
          </div>
          <div style={{ maxHeight: 400, overflowY: "auto" }}>
            {results.map((r, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 0.8fr 0.8fr 0.5fr 1fr", padding: "10px 20px", borderBottom: i < results.length - 1 ? `1px solid ${T.border}` : "none", background: i % 2 === 0 ? "transparent" : `${T.surfaceAlt}40`, alignItems: "center" }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: T.white }}>{r.community}</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: T.gold, fontFamily: "'Fraunces',serif" }}>AED {r.avgPpsf?.toLocaleString()}</span>
                <span style={{ fontSize: 11, color: T.textSecondary }}>{r.avgPrice > 0 ? `AED ${(r.avgPrice/1e6).toFixed(1)}M` : "—"}</span>
                <span style={{ fontSize: 11, color: T.textMuted }}>{r.listings || "—"}</span>
                <span style={{ fontSize: 10, color: r.source?.includes("live") ? T.green : T.textMuted }}>{r.source}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── LOG ──────────────────────────────────────────────────── */}
      {syncLog.length > 0 && (
        <div style={{ background: "#060A0F", border: `1px solid ${T.border}`, borderRadius: 10, padding: "12px 16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, letterSpacing: 1, textTransform: "uppercase" }}>Sync Log</span>
            <button type="button" onClick={() => setSyncLog([])} style={{ fontSize: 10, color: T.textMuted, background: "none", border: "none", cursor: "pointer" }}>Clear</button>
          </div>
          <div style={{ maxHeight: 140, overflowY: "auto", display: "flex", flexDirection: "column", gap: 3 }}>
            {syncLog.map((entry, i) => (
              <div key={i} style={{ display: "flex", gap: 10, fontFamily: "monospace", fontSize: 11 }}>
                <span style={{ color: T.textMuted, flexShrink: 0 }}>{entry.ts}</span>
                <span style={{ color: entry.type === "success" ? T.green : entry.type === "warn" ? T.gold : T.textSecondary }}>{entry.msg}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── DEVELOPER MANAGER SUB-COMPONENT ─── */
function DeveloperManager({ db, T, notify, adminUser, Section }) {
  const [devs, setDevs] = React.useState(null);
  const [saving, setSaving] = React.useState(null);
  const [editingDev, setEditingDev] = React.useState(null);
  const [form, setForm] = React.useState({});
  const [adding, setAdding] = React.useState(false);

  React.useEffect(() => {
    const unsub = onSnapshot(collection(db, "developers"), (snap) => {
      const list = [];
      snap.forEach(d => list.push({ docId: d.id, ...d.data() }));
      list.sort((a, b) => (a.phase || 1) - (b.phase || 1) || (a.name || "").localeCompare(b.name || ""));
      setDevs(list);
    });
    return () => unsub();
  }, []);

  const saveDev = async (devId, data) => {
    setSaving(devId);
    try {
      await setDoc(doc(db, "developers", devId), data, { merge: true });
      setDevs(prev => prev.map(d => d.docId === devId ? { ...d, ...data } : d));
      setEditingDev(null);
      setForm({});
      notify("✅ Developer saved!");
    } catch(e) { notify("Save failed"); }
    setSaving(null);
  };

  const addDeveloper = async () => {
    if (!form.id || !form.name) { notify("ID and Name are required"); return; }
    setSaving("new");
    try {
      const newDev = {
        id: form.id, name: form.name, shortName: form.shortName || form.name,
        listed: form.listed === "true", exchange: form.exchange || "",
        ticker: form.ticker || "", founded: parseInt(form.founded) || null,
        headquarters: form.headquarters || "Dubai, UAE", description: form.description || "",
        totalProjects: 0, active: false, phase: parseInt(form.phase) || 2,
        addedAt: new Date().toISOString(), addedBy: adminUser?.email,
      };
      await setDoc(doc(db, "developers", form.id), newDev);
      setDevs(prev => [...prev, { docId: form.id, ...newDev }]);
      setForm({});
      setAdding(false);
      notify(`✅ ${form.name} added! Activate when ready.`);
    } catch(e) { notify("Failed to add developer"); }
    setSaving(null);
  };

  if (!devs) return <div style={{ padding: 40, textAlign: "center", color: T.textMuted }}>Loading developers...</div>;

  const activeDev = devs.filter(d => d.active);
  const pendingDev = devs.filter(d => !d.active);

  return (
    <Section title="Developer Manager" sub="Manage all developers on the platform — activate to show in dashboard">
      <div style={{ padding: "12px 16px", borderRadius: 10, background: "rgba(212,168,67,0.06)", border: `1px solid ${T.border}`, marginBottom: 20, fontSize: 12, color: T.textSecondary, lineHeight: 1.6 }}>
        💡 Set a developer to <strong style={{ color: T.green }}>Active</strong> to show it in the dashboard developer selector. Projects with that developer's ID will automatically appear. The platform supports 228+ developers.
      </div>

      {/* Active Developers */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: T.green, letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>✅ Active ({activeDev.length})</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {activeDev.map(dev => (
            <div key={dev.docId} style={{ padding: "14px 16px", background: T.surfaceAlt, borderRadius: 10, border: `1px solid rgba(16,185,129,0.2)` }}>
              {editingDev === dev.docId ? (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                  {[
                    { key: "name", label: "Name" }, { key: "shortName", label: "Short Name" },
                    { key: "ticker", label: "Ticker" }, { key: "exchange", label: "Exchange" },
                    { key: "founded", label: "Founded" }, { key: "totalProjects", label: "Total Projects" },
                    { key: "description", label: "Description" },
                  ].map(f => (
                    <div key={f.key} style={{ gridColumn: f.key === "description" ? "1/-1" : "auto" }}>
                      <label style={{ fontSize: 9, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", display: "block", marginBottom: 4 }}>{f.label}</label>
                      <input value={form[f.key] ?? dev[f.key] ?? ""} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                        style={{ width: "100%", padding: "8px 10px", background: T.bg, border: `1px solid ${T.border}`, borderRadius: 7, color: T.textPrimary, fontSize: 12, fontFamily: "'Outfit',sans-serif", outline: "none" }} />
                    </div>
                  ))}
                  <div style={{ gridColumn: "1/-1", display: "flex", gap: 8, marginTop: 4 }}>
                    <button type="button" onClick={() => saveDev(dev.docId, { ...dev, ...form })} disabled={saving === dev.docId}
                      style={{ padding: "8px 20px", borderRadius: 8, border: "none", background: `linear-gradient(135deg, ${T.gold}, ${T.goldLight})`, color: T.bg, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>
                      {saving === dev.docId ? "Saving..." : "Save"}
                    </button>
                    <button type="button" onClick={() => { setEditingDev(null); setForm({}); }}
                      style={{ padding: "8px 16px", borderRadius: 8, border: `1px solid ${T.border}`, background: "transparent", color: T.textSecondary, fontSize: 12, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>Cancel</button>
                    <button type="button" onClick={() => saveDev(dev.docId, { ...dev, active: false })}
                      style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.06)", color: T.red, fontSize: 12, cursor: "pointer", fontFamily: "'Outfit',sans-serif", marginLeft: "auto" }}>Deactivate</button>
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: T.white }}>{dev.name}</div>
                    <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>
                      {dev.listed ? `${dev.exchange}: ${dev.ticker}` : "Private"} · {dev.totalProjects || 0} projects · Phase {dev.phase || 1}
                    </div>
                  </div>
                  <button type="button" onClick={() => { setEditingDev(dev.docId); setForm({}); }}
                    style={{ padding: "7px 16px", borderRadius: 8, border: `1px solid ${T.border}`, background: "transparent", color: T.textSecondary, fontSize: 12, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>Edit</button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Pending Developers */}
      {pendingDev.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>⏳ Pending / Phase 2+ ({pendingDev.length})</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {pendingDev.map(dev => (
              <div key={dev.docId} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: T.surfaceAlt, borderRadius: 10, border: `1px solid ${T.border}` }}>
                <div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: T.textSecondary }}>{dev.name}</span>
                  <span style={{ marginLeft: 8, fontSize: 10, color: T.textMuted }}>Phase {dev.phase || 2} · {dev.totalProjects || 0} projects</span>
                </div>
                <button type="button" onClick={() => saveDev(dev.docId, { ...dev, active: true })} disabled={saving === dev.docId}
                  style={{ padding: "6px 14px", borderRadius: 8, border: "1px solid rgba(16,185,129,0.4)", background: "rgba(16,185,129,0.08)", color: T.green, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>
                  {saving === dev.docId ? "Activating..." : "Activate"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add New Developer */}
      {adding ? (
        <div style={{ padding: 20, background: T.surfaceAlt, borderRadius: 12, border: `1px solid rgba(16,185,129,0.3)` }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: T.green, marginBottom: 16 }}>+ Add New Developer</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 12 }}>
            {[
              { key: "id", label: "ID (e.g. damac) *", placeholder: "damac" },
              { key: "name", label: "Full Name *", placeholder: "DAMAC Properties" },
              { key: "shortName", label: "Short Name", placeholder: "DAMAC" },
              { key: "phase", label: "Phase", placeholder: "2" },
              { key: "founded", label: "Founded", placeholder: "2002" },
              { key: "headquarters", label: "Headquarters", placeholder: "Dubai, UAE" },
              { key: "exchange", label: "Exchange", placeholder: "DFM / ADX" },
              { key: "ticker", label: "Ticker", placeholder: "EMAAR" },
              { key: "description", label: "Description", placeholder: "Brief description..." },
            ].map(f => (
              <div key={f.key}>
                <label style={{ fontSize: 9, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", display: "block", marginBottom: 4 }}>{f.label}</label>
                <input placeholder={f.placeholder} value={form[f.key] || ""} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                  style={{ width: "100%", padding: "8px 10px", background: T.bg, border: `1px solid ${T.border}`, borderRadius: 7, color: T.textPrimary, fontSize: 12, fontFamily: "'Outfit',sans-serif", outline: "none" }} />
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" onClick={addDeveloper} disabled={saving === "new"}
              style={{ padding: "9px 20px", borderRadius: 8, border: "none", background: `linear-gradient(135deg, ${T.gold}, ${T.goldLight})`, color: T.bg, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>
              {saving === "new" ? "Adding..." : "Add Developer"}
            </button>
            <button type="button" onClick={() => { setAdding(false); setForm({}); }}
              style={{ padding: "9px 16px", borderRadius: 8, border: `1px solid ${T.border}`, background: "transparent", color: T.textSecondary, fontSize: 12, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>Cancel</button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => setAdding(true)}
          style={{ width: "100%", padding: "12px", borderRadius: 10, border: "1px dashed rgba(212,168,67,0.3)", background: "transparent", color: T.gold, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>
          + Add New Developer
        </button>
      )}
    </Section>
  );
}

export default DataManagerTab;
