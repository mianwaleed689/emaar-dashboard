import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { db } from "../firebase";
import { collection, getDocs, doc, getDoc, setDoc, deleteDoc, onSnapshot, query, orderBy, limit, where, addDoc, updateDoc } from "firebase/firestore";
import { BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { T } from "../theme";
import emailjs from "@emailjs/browser";

function EiborRatesPanel({ db, T, I, notify }) {
  const EIBOR_FALLBACK = { "1m": 4.635, "3m": 4.593, "6m": 4.676, "1y": 4.674 };
  const [eiborEdit, setEiborEdit] = React.useState({ "1m": "", "3m": "", "6m": "", "1y": "", asOf: "" });
  const [eiborSaving, setEiborSaving] = React.useState(false);
  const [eiborCurrent, setEiborCurrent] = React.useState(null);
  const [eiborHistory, setEiborHistory] = React.useState([]);
  
  // Mortgage Calculator State
  const [loanAmount, setLoanAmount] = React.useState(2000000);
  const [loanYears, setLoanYears] = React.useState(25);
  const [bankSpread, setBankSpread] = React.useState(1.5);
  const [selectedTenor, setSelectedTenor] = React.useState("3m");

  const fetchEibor = React.useCallback(async () => {
    try {
      const snap = await getDoc(doc(db, "tabData", "eiborRates"));
      if (snap.exists()) setEiborCurrent(snap.data());
      // Fetch history
      const histSnap = await getDocs(collection(db, "eiborHistory"));
      const hist = histSnap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
      setEiborHistory(hist);
      notify("EIBOR data refreshed");
    } catch (e) { console.error(e); }
  }, [db, notify]);

  React.useEffect(() => {
    // Real-time listener for current EIBOR rates
    const unsubRates = onSnapshot(doc(db, "tabData", "eiborRates"), (snap) => {
      if (snap.exists()) setEiborCurrent(snap.data());
    });
    // Real-time listener for EIBOR history
    const unsubHistory = onSnapshot(collection(db, "eiborHistory"), (snap) => {
      const hist = snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
      setEiborHistory(hist);
    });
    return () => { unsubRates(); unsubHistory(); };
  }, [db]);

  const saveEibor = async () => {
    if (!eiborEdit["3m"]) { notify("3M rate is required"); return; }
    setEiborSaving(true);
    try {
      const newRates = {
        "1m": parseFloat(eiborEdit["1m"] || eiborCurrent?.["1m"] || EIBOR_FALLBACK["1m"]),
        "3m": parseFloat(eiborEdit["3m"]),
        "6m": parseFloat(eiborEdit["6m"] || eiborCurrent?.["6m"] || EIBOR_FALLBACK["6m"]),
        "1y": parseFloat(eiborEdit["1y"] || eiborCurrent?.["1y"] || EIBOR_FALLBACK["1y"]),
        asOf: eiborEdit.asOf || new Date().toLocaleDateString("en-AE", { day: "numeric", month: "short", year: "numeric" }),
        source: "UAE Central Bank",
        updatedAt: new Date().toISOString(),
        updatedBy: "admin",
      };
      // Save current
      await setDoc(doc(db, "tabData", "eiborRates"), newRates);
      // Save to history
      await addDoc(collection(db, "eiborHistory"), { ...newRates, previousRates: eiborCurrent ? { "1m": eiborCurrent["1m"], "3m": eiborCurrent["3m"], "6m": eiborCurrent["6m"], "1y": eiborCurrent["1y"] } : null });
      // Audit log
      await logAudit(db, { action: "eibor_update", from: eiborCurrent ? `3M: ${eiborCurrent["3m"]}%` : "N/A", to: `3M: ${newRates["3m"]}%` });
      notify("EIBOR rates updated!");
      setEiborEdit({ "1m": "", "3m": "", "6m": "", "1y": "", asOf: "" });
      fetchEibor();
    } catch (e) { notify("Error: " + e.message); }
    setEiborSaving(false);
  };

  // Push notification to users
  const pushRateUpdate = async () => {
    if (!eiborCurrent) return;
    try {
      await addDoc(collection(db, "notifications"), {
        title: "EIBOR Rate Update",
        body: `3M EIBOR is now ${eiborCurrent["3m"]}% (as of ${eiborCurrent.asOf}). Check the mortgage calculator for updated payments.`,
        type: "rate_update",
        targetTier: "pro",
        createdAt: new Date().toISOString(),
        createdBy: "admin",
      });
      await logAudit(db, { action: "eibor_notification_sent" });
      notify("Notification sent to Pro users!");
    } catch (e) { notify("Error: " + e.message); }
  };

  // Mortgage Calculator
  const calculateMortgage = () => {
    const rate = eiborCurrent?.[selectedTenor] || EIBOR_FALLBACK[selectedTenor];
    const annualRate = (parseFloat(rate) + bankSpread) / 100;
    const monthlyRate = annualRate / 12;
    const numPayments = loanYears * 12;
    const monthlyPayment = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / (Math.pow(1 + monthlyRate, numPayments) - 1);
    const totalPayment = monthlyPayment * numPayments;
    const totalInterest = totalPayment - loanAmount;
    return { monthlyPayment, totalPayment, totalInterest, effectiveRate: parseFloat(rate) + bankSpread };
  };
  const mortgage = calculateMortgage();

  // Check for rate change > 0.25%
  const rateAlert = eiborHistory.length > 1 && eiborHistory[0].previousRates ? 
    Math.abs(parseFloat(eiborHistory[0]["3m"]) - parseFloat(eiborHistory[0].previousRates["3m"])) > 0.25 : false;

  // Comparison calculations
  const compareData = React.useMemo(() => {
    if (eiborHistory.length < 2) return null;
    const weekAgo = eiborHistory.find(h => {
      const d = new Date(h.updatedAt);
      return (Date.now() - d.getTime()) >= 7 * 24 * 60 * 60 * 1000;
    });
    const monthAgo = eiborHistory.find(h => {
      const d = new Date(h.updatedAt);
      return (Date.now() - d.getTime()) >= 30 * 24 * 60 * 60 * 1000;
    });
    return { weekAgo, monthAgo };
  }, [eiborHistory]);
  
  const [eiborCompareMode, setEiborCompareMode] = React.useState(false);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* === KPI TOPBAR === */}
      <div className="fade-up" style={{ display: "flex", alignItems: "center", gap: 0, borderRadius: 14, background: T.surface, border: `1px solid ${T.border}`, overflow: "hidden" }}>
        <button type="button" onClick={fetchEibor} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, padding: "14px 16px", background: "rgba(212,168,67,0.06)", border: "none", borderRight: `1px solid ${T.border}`, color: T.gold, cursor: "pointer", fontFamily: "'Outfit',sans-serif", fontWeight: 600, flexShrink: 0 }}>{I?.refresh || "\u21BB"}</button>
        {[
          { label: "1M EIBOR", value: eiborCurrent?.["1m"] ? `${parseFloat(eiborCurrent["1m"]).toFixed(3)}%` : "—", color: T.blue },
          { label: "3M EIBOR", value: eiborCurrent?.["3m"] ? `${parseFloat(eiborCurrent["3m"]).toFixed(3)}%` : "—", color: T.gold, primary: true },
          { label: "6M EIBOR", value: eiborCurrent?.["6m"] ? `${parseFloat(eiborCurrent["6m"]).toFixed(3)}%` : "—", color: T.teal },
          { label: "1Y EIBOR", value: eiborCurrent?.["1y"] ? `${parseFloat(eiborCurrent["1y"]).toFixed(3)}%` : "—", color: T.purple },
        ].map((item, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", padding: "10px 20px", borderRight: `1px solid ${T.border}`, flexShrink: 0, background: item.primary ? "rgba(212,168,67,0.04)" : "transparent" }}>
            <span style={{ fontSize: 9, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: 1 }}>{item.label}</span>
            <span style={{ fontSize: 20, fontWeight: 900, color: item.color, fontFamily: "'Fraunces',serif", lineHeight: 1.2 }}>{item.value}</span>
          </div>
        ))}
        <div style={{ marginLeft: "auto", padding: "10px 16px", display: "flex", gap: 8 }}>
          <button type="button" onClick={() => setEiborCompareMode(!eiborCompareMode)} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, padding: "8px 14px", borderRadius: 8, border: `1px solid ${eiborCompareMode ? T.blue : T.border}`, background: eiborCompareMode ? `${T.blue}15` : "transparent", color: eiborCompareMode ? T.blue : T.textMuted, cursor: "pointer", fontFamily: "'Outfit',sans-serif", fontWeight: 600 }}>{eiborCompareMode ? "✔ Compare" : "Compare"}</button>
          <button type="button" onClick={pushRateUpdate} disabled={!eiborCurrent} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, padding: "8px 14px", borderRadius: 8, border: `1px solid ${T.teal}`, background: "rgba(20,184,166,0.08)", color: T.teal, cursor: eiborCurrent ? "pointer" : "not-allowed", fontFamily: "'Outfit',sans-serif", fontWeight: 600 }}>Push to Users</button>
        </div>
      </div>

      {/* === COMPARISON PANEL === */}
      {eiborCompareMode && compareData && (
        <div className="fade-up" style={{ background: T.surface, border: `1px solid ${T.blue}40`, borderRadius: 14, padding: "16px 20px" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.blue, textTransform: "uppercase", letterSpacing: 1, marginBottom: 14 }}>Historical Comparison</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
            {[
              { label: "Current", data: eiborCurrent, color: T.gold },
              { label: "1 Week Ago", data: compareData.weekAgo, color: T.teal },
              { label: "1 Month Ago", data: compareData.monthAgo, color: T.purple },
            ].map((period, i) => (
              <div key={i} style={{ background: T.surfaceAlt, borderRadius: 10, padding: "14px 16px", border: `1px solid ${T.border}` }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: period.color, marginBottom: 10 }}>{period.label}</div>
                {period.data ? (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    {["1m", "3m", "6m", "1y"].map(tenor => {
                      const val = parseFloat(period.data[tenor] || 0);
                      const currentVal = eiborCurrent ? parseFloat(eiborCurrent[tenor] || 0) : null;
                      const diff = currentVal !== null && i > 0 ? currentVal - val : null;
                      return (
                        <div key={tenor} style={{ textAlign: "center" }}>
                          <div style={{ fontSize: 9, color: T.textMuted }}>{tenor.toUpperCase()}</div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: T.white }}>{val.toFixed(3)}%</div>
                          {diff !== null && (
                            <div style={{ fontSize: 9, color: diff > 0 ? T.red : diff < 0 ? T.green : T.textMuted }}>{diff > 0 ? "+" : ""}{diff.toFixed(3)}</div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ fontSize: 11, color: T.textMuted, textAlign: "center" }}>No data</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* === RATE ALERT === */}
      {rateAlert && (
        <div className="fade-up" style={{ padding: "14px 20px", borderRadius: 12, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 18 }}>⚡</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.red }}>Significant Rate Change Detected</div>
            <div style={{ fontSize: 11, color: T.textMuted }}>3M EIBOR changed by more than 0.25% from the previous update. Consider notifying users.</div>
          </div>
        </div>
      )}

      {/* === CURRENT RATES + COMPARISON === */}
      {eiborCurrent && (
        <div className="fade-up" style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, padding: "20px 24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 11, color: T.green, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>Live Rates — {eiborCurrent.asOf}</div>
              <div style={{ fontSize: 10, color: T.textMuted }}>Source: {eiborCurrent.source || "UAE Central Bank"}</div>
            </div>
            <a href="https://www.centralbank.ae/en/forex-eibor/eibor-rates/" target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: T.gold, textDecoration: "none" }}>View Source \u2197</a>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
            {[
              { label: "1M", key: "1m", color: T.blue },
              { label: "3M", key: "3m", color: T.gold, primary: true },
              { label: "6M", key: "6m", color: T.teal },
              { label: "1Y", key: "1y", color: T.purple },
            ].map(r => {
              const current = parseFloat(eiborCurrent[r.key] || 0);
              const previous = eiborHistory[0]?.previousRates?.[r.key] ? parseFloat(eiborHistory[0].previousRates[r.key]) : null;
              const change = previous !== null ? current - previous : null;
              return (
                <div key={r.key} style={{ background: r.primary ? "rgba(212,168,67,0.06)" : T.surfaceAlt, borderRadius: 12, padding: "16px 18px", border: `1px solid ${r.primary ? T.gold + "40" : T.border}`, textAlign: "center" }}>
                  <div style={{ fontSize: 10, color: T.textMuted, marginBottom: 6, textTransform: "uppercase" }}>{r.label} EIBOR {r.primary && <span style={{ color: T.gold }}>\u2605</span>}</div>
                  <div style={{ fontSize: 28, fontWeight: 900, color: r.color, fontFamily: "'Fraunces',serif" }}>{current.toFixed(3)}%</div>
                  {change !== null && (
                    <div style={{ fontSize: 10, color: change > 0 ? T.red : change < 0 ? T.green : T.textMuted, marginTop: 4 }}>
                      {change > 0 ? "\u2191" : change < 0 ? "\u2193" : "\u2014"} {Math.abs(change).toFixed(3)}%
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* === RATE HISTORY CHART (12-month SVG) === */}
      {eiborHistory.length > 1 && (
        <div className="fade-up" style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, padding: "20px 24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <div style={{ fontFamily: "'Fraunces',serif", fontSize: 16, fontWeight: 700, color: T.white }}>Rate History</div>
              <div style={{ fontSize: 11, color: T.textMuted }}>All 4 tenors over time — color coded</div>
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              {[{ label: "1M", color: T.blue }, { label: "3M", color: T.gold }, { label: "6M", color: T.teal }, { label: "1Y", color: T.purple }].map(l => (
                <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <div style={{ width: 10, height: 3, borderRadius: 2, background: l.color }} />
                  <span style={{ fontSize: 10, color: T.textMuted }}>{l.label}</span>
                </div>
              ))}
            </div>
          </div>
          {(() => {
            // Prepare chart data (last 12 entries, oldest first)
            const chartData = eiborHistory.slice(0, 12).reverse().map(h => ({
              date: h.asOf || (h.updatedAt ? new Date(h.updatedAt).toLocaleDateString("en-AE", { day: "numeric", month: "short" }) : ""),
              "1m": parseFloat(h["1m"] || 0),
              "3m": parseFloat(h["3m"] || 0),
              "6m": parseFloat(h["6m"] || 0),
              "1y": parseFloat(h["1y"] || 0),
            }));
            // Add current rates as last point
            if (eiborCurrent) {
              chartData.push({
                date: eiborCurrent.asOf || "Now",
                "1m": parseFloat(eiborCurrent["1m"] || 0),
                "3m": parseFloat(eiborCurrent["3m"] || 0),
                "6m": parseFloat(eiborCurrent["6m"] || 0),
                "1y": parseFloat(eiborCurrent["1y"] || 0),
              });
            }
            if (chartData.length < 2) return <div style={{ padding: 40, textAlign: "center", color: T.textMuted }}>Not enough history data yet</div>;
            
            // SVG Chart dimensions
            const width = 700, height = 200, padding = { top: 20, right: 20, bottom: 30, left: 45 };
            const chartW = width - padding.left - padding.right;
            const chartH = height - padding.top - padding.bottom;
            
            // Find min/max
            const allValues = chartData.flatMap(d => [d["1m"], d["3m"], d["6m"], d["1y"]]).filter(v => v > 0);
            const minVal = Math.floor(Math.min(...allValues) * 10) / 10 - 0.2;
            const maxVal = Math.ceil(Math.max(...allValues) * 10) / 10 + 0.2;
            const range = maxVal - minVal || 1;
            
            // Scale functions
            const xScale = (i) => padding.left + (i / (chartData.length - 1)) * chartW;
            const yScale = (v) => padding.top + chartH - ((v - minVal) / range) * chartH;
            
            // Generate path
            const makePath = (key) => chartData.map((d, i) => `${i === 0 ? "M" : "L"} ${xScale(i)} ${yScale(d[key])}`).join(" ");
            
            const tenors = [
              { key: "1m", color: T.blue },
              { key: "3m", color: T.gold },
              { key: "6m", color: T.teal },
              { key: "1y", color: T.purple },
            ];
            
            return (
              <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: "visible" }}>
                {/* Grid lines */}
                {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
                  const y = padding.top + chartH * (1 - pct);
                  const val = minVal + range * pct;
                  return (
                    <g key={i}>
                      <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                      <text x={padding.left - 8} y={y + 4} fill={T.textMuted} fontSize="10" textAnchor="end">{val.toFixed(2)}%</text>
                    </g>
                  );
                })}
                {/* X axis labels */}
                {chartData.map((d, i) => (
                  <text key={i} x={xScale(i)} y={height - 8} fill={T.textMuted} fontSize="9" textAnchor="middle">{d.date}</text>
                ))}
                {/* Lines */}
                {tenors.map(t => (
                  <path key={t.key} d={makePath(t.key)} fill="none" stroke={t.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                ))}
                {/* Dots */}
                {tenors.map(t => chartData.map((d, i) => (
                  <circle key={`${t.key}-${i}`} cx={xScale(i)} cy={yScale(d[t.key])} r="4" fill={t.color} stroke={T.surface} strokeWidth="1.5" />
                )))}
              </svg>
            );
          })()}
        </div>
      )}

      {/* === MORTGAGE CALCULATOR === */}
      <div className="fade-up" style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, padding: "20px 24px" }}>
        <div style={{ fontFamily: "'Fraunces',serif", fontSize: 16, fontWeight: 700, color: T.white, marginBottom: 16 }}>Mortgage Impact Calculator</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 16 }}>
          <div>
            <label style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", marginBottom: 4, display: "block" }}>Loan Amount (AED)</label>
            <input type="number" value={loanAmount} onChange={e => setLoanAmount(Number(e.target.value))} style={{ width: "100%", padding: "10px 12px", background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8, color: T.white, fontSize: 13, fontFamily: "'Outfit',sans-serif", boxSizing: "border-box" }} />
          </div>
          <div>
            <label style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", marginBottom: 4, display: "block" }}>Term (Years)</label>
            <input type="number" value={loanYears} onChange={e => setLoanYears(Number(e.target.value))} style={{ width: "100%", padding: "10px 12px", background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8, color: T.white, fontSize: 13, fontFamily: "'Outfit',sans-serif", boxSizing: "border-box" }} />
          </div>
          <div>
            <label style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", marginBottom: 4, display: "block" }}>Bank Spread (%)</label>
            <input type="number" step="0.1" value={bankSpread} onChange={e => setBankSpread(Number(e.target.value))} style={{ width: "100%", padding: "10px 12px", background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8, color: T.white, fontSize: 13, fontFamily: "'Outfit',sans-serif", boxSizing: "border-box" }} />
          </div>
          <div>
            <label style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", marginBottom: 4, display: "block" }}>EIBOR Tenor</label>
            <select value={selectedTenor} onChange={e => setSelectedTenor(e.target.value)} style={{ width: "100%", padding: "10px 12px", background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8, color: T.white, fontSize: 13, fontFamily: "'Outfit',sans-serif" }}>
              <option value="1m">1 Month</option>
              <option value="3m">3 Month</option>
              <option value="6m">6 Month</option>
              <option value="1y">1 Year</option>
            </select>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, padding: "16px 0", borderTop: `1px solid ${T.border}` }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 10, color: T.textMuted, marginBottom: 4 }}>EFFECTIVE RATE</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: T.gold, fontFamily: "'Fraunces',serif" }}>{mortgage.effectiveRate.toFixed(2)}%</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 10, color: T.textMuted, marginBottom: 4 }}>MONTHLY PAYMENT</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: T.green, fontFamily: "'Fraunces',serif" }}>AED {Math.round(mortgage.monthlyPayment).toLocaleString()}</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 10, color: T.textMuted, marginBottom: 4 }}>TOTAL INTEREST</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: T.red, fontFamily: "'Fraunces',serif" }}>AED {Math.round(mortgage.totalInterest).toLocaleString()}</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 10, color: T.textMuted, marginBottom: 4 }}>TOTAL COST</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: T.white, fontFamily: "'Fraunces',serif" }}>AED {Math.round(mortgage.totalPayment).toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* === UPDATE FORM === */}
      <div className="fade-up" style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, padding: "20px 24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ fontFamily: "'Fraunces',serif", fontSize: 16, fontWeight: 700, color: T.white }}>Update Rates</div>
          <a href="https://www.centralbank.ae/en/forex-eibor/eibor-rates/" target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: T.gold, textDecoration: "none", padding: "6px 12px", borderRadius: 6, border: `1px solid ${T.gold}40`, background: "rgba(212,168,67,0.06)" }}>Open Central Bank \u2197</a>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 14 }}>
          {[
            { label: "1M EIBOR", key: "1m" },
            { label: "3M EIBOR", key: "3m", primary: true },
            { label: "6M EIBOR", key: "6m" },
            { label: "1Y EIBOR", key: "1y" },
          ].map(r => (
            <div key={r.key}>
              <div style={{ fontSize: 10, color: T.textMuted, marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}>{r.label} {r.primary && <span style={{ fontSize: 8, fontWeight: 700, color: T.gold, background: "rgba(212,168,67,0.12)", padding: "1px 6px", borderRadius: 4 }}>REQUIRED</span>}</div>
              <input type="number" step="0.001" placeholder={eiborCurrent?.[r.key] ? `${parseFloat(eiborCurrent[r.key]).toFixed(3)}` : "e.g. 4.593"} value={eiborEdit[r.key]} onChange={e => setEiborEdit(prev => ({ ...prev, [r.key]: e.target.value }))} style={{ width: "100%", padding: "10px 12px", background: T.surfaceAlt, border: `1px solid ${r.primary ? T.gold + "60" : T.border}`, borderRadius: 8, color: T.white, fontSize: 13, fontFamily: "'Outfit',sans-serif", boxSizing: "border-box" }} />
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "flex-end" }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, color: T.textMuted, marginBottom: 4 }}>Value Date</div>
            <input type="text" placeholder="e.g. 9 Mar 2026" value={eiborEdit.asOf} onChange={e => setEiborEdit(prev => ({ ...prev, asOf: e.target.value }))} style={{ width: "100%", padding: "10px 12px", background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8, color: T.white, fontSize: 13, fontFamily: "'Outfit',sans-serif", boxSizing: "border-box" }} />
          </div>
          <button type="button" onClick={saveEibor} disabled={eiborSaving || !eiborEdit["3m"]} style={{ padding: "10px 24px", borderRadius: 10, background: eiborEdit["3m"] ? `linear-gradient(135deg, ${T.gold}, #B8972E)` : T.surfaceAlt, border: "none", color: eiborEdit["3m"] ? "#04090F" : T.textMuted, fontSize: 13, fontWeight: 700, cursor: eiborEdit["3m"] ? "pointer" : "not-allowed", fontFamily: "'Outfit',sans-serif" }}>
            {eiborSaving ? "Saving..." : "Save Rates"}
          </button>
        </div>
      </div>

      {/* === UPDATE HISTORY === */}
      <div className="fade-up" style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontFamily: "'Fraunces',serif", fontSize: 16, fontWeight: 700, color: T.white }}>Update History</div>
          <span style={{ fontSize: 11, color: T.textMuted }}>{eiborHistory.length} updates</span>
        </div>
        {eiborHistory.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: T.textMuted, fontSize: 12 }}>No rate history yet</div>
        ) : (
          <div style={{ maxHeight: 300, overflowY: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                  {["Date", "1M", "3M", "6M", "1Y", "Change", "Updated By"].map(h => (
                    <th key={h} style={{ padding: "10px 14px", textAlign: "left", color: T.gold, fontWeight: 600, fontSize: 10, textTransform: "uppercase", background: T.surfaceAlt }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {eiborHistory.slice(0, 20).map((h, i) => {
                  const change = h.previousRates ? parseFloat(h["3m"]) - parseFloat(h.previousRates["3m"]) : null;
                  return (
                    <tr key={h.id} style={{ borderBottom: `1px solid ${T.border}` }}>
                      <td style={{ padding: "10px 14px", color: T.textSecondary }}>{h.asOf || (h.updatedAt ? new Date(h.updatedAt).toLocaleDateString("en-AE", { day: "numeric", month: "short" }) : "—")}</td>
                      <td style={{ padding: "10px 14px", color: T.blue }}>{h["1m"] ? `${parseFloat(h["1m"]).toFixed(3)}%` : "—"}</td>
                      <td style={{ padding: "10px 14px", color: T.gold, fontWeight: 600 }}>{h["3m"] ? `${parseFloat(h["3m"]).toFixed(3)}%` : "—"}</td>
                      <td style={{ padding: "10px 14px", color: T.teal }}>{h["6m"] ? `${parseFloat(h["6m"]).toFixed(3)}%` : "—"}</td>
                      <td style={{ padding: "10px 14px", color: T.purple }}>{h["1y"] ? `${parseFloat(h["1y"]).toFixed(3)}%` : "—"}</td>
                      <td style={{ padding: "10px 14px" }}>
                        {change !== null ? (
                          <span style={{ color: change > 0 ? T.red : change < 0 ? T.green : T.textMuted, fontWeight: 600 }}>
                            {change > 0 ? "+" : ""}{change.toFixed(3)}%
                          </span>
                        ) : "—"}
                      </td>
                      <td style={{ padding: "10px 14px", color: T.textMuted }}>{h.updatedBy || "admin"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}



/* ======================================================
   USERS TAB COMPONENT — Professional SaaS User Management
   Full rebuild: all 36 audit issues resolved
====================================================== */

/* ─── PROFILE DRAWER (top-level component — stable reference, portal to root) ─── */
const EditIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);
const CopyIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
  </svg>
);

export default EiborRatesPanel;
