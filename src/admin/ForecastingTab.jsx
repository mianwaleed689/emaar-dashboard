import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { db } from "../firebase";
import { collection, getDocs, doc, getDoc, setDoc, deleteDoc, onSnapshot, query, orderBy, limit, where, addDoc, updateDoc } from "firebase/firestore";
import { BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { T } from "../theme";
import emailjs from "@emailjs/browser";
import { PRICING } from "../config/pricing";

const ForecastingTab = ({ db, T, notify, users }) => {
  const [growthRate, setGrowthRate] = React.useState(10); // % monthly growth
  const [churnRate,  setChurnRate]  = React.useState(5);  // % monthly churn
  const [months,     setMonths]     = React.useState(12); // forecast horizon

  const PRICES = { pro: PRICING.pro, enterprise: PRICING.enterprise };
  const now = new Date();

  // Current MRR
  const currentMRR = React.useMemo(() => {
    const pro = users.filter(u => u.tier === "pro").length;
    const ent = users.filter(u => u.tier === "enterprise").length;
    return (pro * PRICES.pro) + (ent * PRICES.enterprise);
  }, [users]);

  const currentPaid = users.filter(u => u.tier === "pro" || u.tier === "enterprise").length;
  const currentARR  = currentMRR * 12;

  // Forecast model: MRR(t) = MRR(0) Ã— (1 + growth - churn)^t
  const netGrowth = (growthRate - churnRate) / 100;

  const forecast = React.useMemo(() => {
    const data = [];
    for (let m = 0; m <= months; m++) {
      const d = new Date(now.getFullYear(), now.getMonth() + m, 1);
      const mrr = Math.round(currentMRR * Math.pow(1 + netGrowth, m));
      const arr = mrr * 12;
      const users_est = Math.round(currentPaid * Math.pow(1 + netGrowth, m));
      data.push({
        label: m === 0 ? "Now" : d.toLocaleDateString("en-AE", { month: "short", year: "2-digit" }),
        mrr: Math.max(mrr, 0),
        arr: Math.max(arr, 0),
        users: Math.max(users_est, 0),
        month: m,
      });
    }
    return data;
  }, [currentMRR, currentPaid, netGrowth, months]);

  const finalMRR  = forecast[forecast.length - 1]?.mrr || 0;
  const finalARR  = finalMRR * 12;
  const mrrGrowth = currentMRR > 0 ? Math.round(((finalMRR - currentMRR) / currentMRR) * 100) : 0;
  const maxMRR    = Math.max(...forecast.map(f => f.mrr), 1);

  // Scenarios
  const scenarios = [
    { label: "Conservative", growth: 5,  churn: 8,  color: T.orange },
    { label: "Base Case",    growth: 10, churn: 5,  color: T.gold   },
    { label: "Optimistic",   growth: 20, churn: 3,  color: T.green  },
  ].map(s => ({
    ...s,
    mrrIn12: Math.round(currentMRR * Math.pow(1 + (s.growth - s.churn) / 100, 12)),
    arrIn12: Math.round(currentMRR * Math.pow(1 + (s.growth - s.churn) / 100, 12) * 12),
  }));

  const Slider = ({ label, value, setValue, min, max, color, unit = "%" }) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <label style={{ fontSize: 12, color: T.textSecondary, fontWeight: 600 }}>{label}</label>
        <span style={{ fontSize: 14, fontWeight: 800, color, fontFamily: "'Fraunces',serif" }}>{value}{unit}</span>
      </div>
      <input type="range" min={min} max={max} value={value} onChange={e => setValue(Number(e.target.value))}
        style={{ width: "100%", accentColor: color, cursor: "pointer" }} />
    </div>
  );

  return (
    <div style={{ padding: "28px 32px", display: "flex", flexDirection: "column", gap: 24 }}>

      {/* Header */}
      <div>
        <h2 style={{ fontFamily: "'Fraunces',serif", fontSize: 26, fontWeight: 800, color: T.gold, marginBottom: 4 }}>Revenue Forecasting</h2>
        <p style={{ color: T.textMuted, fontSize: 13 }}>MRR growth model Â· Churn-adjusted ARR Â· Scenario analysis</p>
      </div>

      {/* Current state KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
        {[
          { label: "Current MRR", value: `AED ${currentMRR.toLocaleString()}`, color: T.gold },
          { label: "Current ARR", value: `AED ${currentARR.toLocaleString()}`, color: T.teal },
          { label: "Paying Users", value: currentPaid, color: T.green },
          { label: "ARPU", value: currentPaid > 0 ? `AED ${Math.round(currentMRR/currentPaid)}` : "â€”", color: T.blue },
        ].map(k => (
          <div key={k.label} style={{ background: T.surface, borderRadius: 12, border: `1px solid ${T.border}`, padding: "16px 20px" }}>
            <div style={{ fontSize: 10, color: T.textMuted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>{k.label}</div>
            <div style={{ fontFamily: "'Fraunces',serif", fontSize: 22, fontWeight: 800, color: k.color }}>{k.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 20 }}>

        {/* Controls */}
        <div style={{ background: T.surface, borderRadius: 16, border: `1px solid ${T.border}`, padding: "20px 24px", display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontFamily: "'Fraunces',serif", fontSize: 15, fontWeight: 700, color: T.white }}>Model Parameters</div>
          <Slider label="Monthly Growth Rate" value={growthRate} setValue={setGrowthRate} min={0} max={50} color={T.green} />
          <Slider label="Monthly Churn Rate" value={churnRate} setValue={setChurnRate} min={0} max={30} color={T.red} />
          <Slider label="Forecast Horizon" value={months} setValue={setMonths} min={3} max={36} color={T.gold} unit=" mo" />

          <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 16 }}>
            <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 8 }}>Net Monthly Growth: <span style={{ color: netGrowth >= 0 ? T.green : T.red, fontWeight: 700 }}>{netGrowth >= 0 ? "+" : ""}{(netGrowth * 100).toFixed(1)}%</span></div>
            <div style={{ fontSize: 11, color: T.textMuted }}>Projected MRR in {months}mo: <span style={{ color: T.gold, fontWeight: 700 }}>AED {finalMRR.toLocaleString()}</span></div>
            <div style={{ fontSize: 11, color: T.textMuted }}>Projected ARR: <span style={{ color: T.gold, fontWeight: 700 }}>AED {finalARR.toLocaleString()}</span></div>
            <div style={{ fontSize: 11, color: T.textMuted }}>MRR Growth: <span style={{ color: mrrGrowth >= 0 ? T.green : T.red, fontWeight: 700 }}>{mrrGrowth >= 0 ? "+" : ""}{mrrGrowth}%</span></div>
          </div>
        </div>

        {/* Chart */}
        <div style={{ background: T.surface, borderRadius: 16, border: `1px solid ${T.border}`, padding: "20px 24px" }}>
          <div style={{ fontFamily: "'Fraunces',serif", fontSize: 15, fontWeight: 700, color: T.white, marginBottom: 16 }}>MRR Forecast â€” {months} Month Projection</div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 180, marginBottom: 8 }}>
            {forecast.filter((_, i) => i % Math.max(1, Math.floor(months/12)) === 0 || i === forecast.length - 1).map((f, i, arr) => {
              const h = Math.max((f.mrr / maxMRR) * 160, 4);
              const isNow = f.month === 0;
              return (
                <div key={f.label} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, minWidth: 0 }}>
                  <div style={{ fontSize: 9, color: T.textMuted, textAlign: "center" }}>AED {(f.mrr/1000).toFixed(0)}K</div>
                  <div style={{ width: "80%", height: h, background: isNow ? T.blue : `linear-gradient(180deg,${T.gold},${T.gold}88)`, borderRadius: "3px 3px 0 0", transition: "height 0.4s" }} title={`${f.label}: AED ${f.mrr.toLocaleString()}`} />
                  <div style={{ fontSize: 9, color: isNow ? T.blue : T.textMuted, fontWeight: isNow ? 700 : 400, textAlign: "center", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%" }}>{f.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Scenarios */}
      <div style={{ background: T.surface, borderRadius: 16, border: `1px solid ${T.border}`, padding: "20px 24px" }}>
        <div style={{ fontFamily: "'Fraunces',serif", fontSize: 15, fontWeight: 700, color: T.white, marginBottom: 14 }}>12-Month Scenario Analysis</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
          {scenarios.map(s => (
            <div key={s.label} style={{ padding: "16px 18px", borderRadius: 12, background: T.surfaceAlt, border: `1px solid ${s.color}33` }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: s.color, marginBottom: 8 }}>{s.label}</div>
              <div style={{ fontSize: 10, color: T.textMuted, marginBottom: 10 }}>Growth: +{s.growth}% Â· Churn: {s.churn}% Â· Net: {s.growth - s.churn > 0 ? "+" : ""}{s.growth - s.churn}%</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: s.color, fontFamily: "'Fraunces',serif" }}>AED {s.mrrIn12.toLocaleString()}</div>
              <div style={{ fontSize: 11, color: T.textMuted }}>MRR in 12 months</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: T.textSecondary, marginTop: 6 }}>ARR: AED {s.arrIn12.toLocaleString()}</div>
              <div style={{ marginTop: 8, height: 4, borderRadius: 2, background: T.border, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${Math.min((s.mrrIn12 / Math.max(...scenarios.map(x => x.mrrIn12))) * 100, 100)}%`, background: s.color, borderRadius: 2 }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Churn Impact */}
      <div style={{ background: T.surface, borderRadius: 16, border: `1px solid ${T.border}`, padding: "20px 24px" }}>
        <div style={{ fontFamily: "'Fraunces',serif", fontSize: 15, fontWeight: 700, color: T.white, marginBottom: 14 }}>Churn Impact Analysis</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
          {[2, 5, 10, 15].map(ch => {
            const mrrAt12 = Math.round(currentMRR * Math.pow(1 + (growthRate - ch) / 100, 12));
            return (
              <div key={ch} style={{ padding: "12px 14px", borderRadius: 10, background: T.surfaceAlt, border: `1px solid ${ch <= 3 ? T.green : ch <= 7 ? T.gold : ch <= 12 ? T.orange : T.red}33`, textAlign: "center" }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: ch <= 3 ? T.green : ch <= 7 ? T.gold : ch <= 12 ? T.orange : T.red, fontFamily: "'Fraunces',serif" }}>{ch}%</div>
                <div style={{ fontSize: 10, color: T.textMuted, marginBottom: 8 }}>Churn Rate</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.white }}>AED {mrrAt12.toLocaleString()}</div>
                <div style={{ fontSize: 10, color: T.textMuted }}>MRR @ 12mo</div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};

/* â”€â”€â”€ S19: PRICING PLANS EDITOR â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   Admin edits plan prices/features â†’ saves to Firestore pricingPlans/current
   Dashboard upgrade modal + landing page read from Firestore automatically
   No code deploy needed for price changes
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

export default ForecastingTab;