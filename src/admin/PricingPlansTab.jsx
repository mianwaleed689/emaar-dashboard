import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { db } from "../firebase";
import { collection, getDocs, doc, getDoc, setDoc, deleteDoc, onSnapshot, query, orderBy, limit, where, addDoc, updateDoc } from "firebase/firestore";
import { BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { T } from "../theme";
import { PRICING } from "../config/pricing";
import emailjs from "@emailjs/browser";

const PricingPlansTab = ({ db, T, notify }) => {
  const DEFAULT_PLANS = [
    { name: "Pro", price: String(PRICING.pro), period: "month", features: ["48 Emaar projects вв‚¬вЂќ full data", "AI market insights", "Portfolio ROI tracker", "DXB Estimate AVM", "Yield & STR/LTR analysis", "Mortgage calculator", "Price alerts", "PDF export"], popular: true, note: null, cta: "Upgrade to Pro в†вЂ™", stripeId: "" },
    { name: "Enterprise", price: String(PRICING.enterprise), period: "month", features: ["Everything in Pro", "PDF report generation вЏі", "API data access вЏі", "Custom dashboards вЏі", "Multi-user team accounts вЏі", "Developer-level raw data", "Dedicated account manager", "White-label options вЏі"], popular: false, note: "вЏі = Launching Q3 2026", cta: "Contact Sales в†вЂ™", stripeId: "" },
  ];

  const [plans, setPlans]       = React.useState(DEFAULT_PLANS);
  const [loading, setLoading]   = React.useState(true);
  const [saving, setSaving]     = React.useState(false);
  const [lastSaved, setLastSaved] = React.useState(null);
  const [editIdx, setEditIdx]   = React.useState(0); // which plan is being edited

  // Load from Firestore
  React.useEffect(() => {
    getDoc(doc(db, "pricingPlans", "current")).then(snap => {
      if (snap.exists() && snap.data().plans) setPlans(snap.data().plans);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [db]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, "pricingPlans", "current"), {
        plans,
        updatedAt: new Date().toISOString(),
        updatedBy: "admin",
      });
      setLastSaved(new Date().toLocaleString("en-AE", { timeZone: "Asia/Dubai" }));
      notify("вњвЂ¦ Pricing plans saved вв‚¬вЂќ upgrade modal and landing page updated instantly", "success");
    } catch(e) {
      notify("вќЊ Save failed: " + e.message, "error");
    } finally { setSaving(false); }
  };

  const updatePlan = (idx, field, value) => {
    setPlans(prev => prev.map((p, i) => i === idx ? { ...p, [field]: value } : p));
  };

  const updateFeature = (planIdx, featIdx, value) => {
    setPlans(prev => prev.map((p, i) => i === planIdx ? { ...p, features: p.features.map((f, j) => j === featIdx ? value : f) } : p));
  };

  const addFeature = (planIdx) => {
    setPlans(prev => prev.map((p, i) => i === planIdx ? { ...p, features: [...p.features, "New feature"] } : p));
  };

  const removeFeature = (planIdx, featIdx) => {
    setPlans(prev => prev.map((p, i) => i === planIdx ? { ...p, features: p.features.filter((_, j) => j !== featIdx) } : p));
  };

  

  return (
    <div style={{ padding: "28px 32px", display: "flex", flexDirection: "column", gap: 24 }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ fontFamily: "'Fraunces',serif", fontSize: 26, fontWeight: 800, color: T.gold, marginBottom: 4 }}>Pricing Plan Editor</h2>
          <p style={{ color: T.textMuted, fontSize: 13 }}>Changes save to Firestore instantly вв‚¬вЂќ upgrade modal + landing page update automatically. No code deploy needed.</p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {lastSaved && <span style={{ fontSize: 11, color: T.green }}>вњвЂ¦ Saved {lastSaved}</span>}
          <button type="button" onClick={handleSave} disabled={saving}
            style={{ padding: "10px 24px", background: saving ? T.surfaceAlt : `linear-gradient(135deg,${T.gold},#B8912F)`, color: saving ? T.textMuted : T.bg, border: "none", borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: saving ? "not-allowed" : "pointer", fontFamily: "'Outfit',sans-serif" }}>
            {saving ? "Saving..." : "рџвЂ™ѕ Save & Publish"}
          </button>
        </div>
      </div>

      {/* Warning */}
      <div style={{ padding: "10px 16px", borderRadius: 8, background: "rgba(239,68,68,0.06)", border: `1px solid rgba(239,68,68,0.15)`, fontSize: 12, color: T.textMuted }}>
        вљ пёЏ Price changes take effect immediately for <strong style={{ color: T.white }}>new subscribers only</strong>. Existing paying users keep their current price until they cancel and resubscribe. Update Stripe prices separately if changing billing amounts.
      </div>

      {/* Plan selector */}
      <div style={{ display: "flex", gap: 8 }}>
        {plans.map((p, i) => (
          <button key={i} type="button" onClick={() => setEditIdx(i)}
            style={{ padding: "8px 20px", borderRadius: 8, border: `1px solid ${editIdx === i ? T.gold : T.border}`, background: editIdx === i ? "rgba(212,168,67,0.1)" : T.surfaceAlt, color: editIdx === i ? T.gold : T.textMuted, fontSize: 13, fontWeight: editIdx === i ? 700 : 400, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>
            {p.name} вв‚¬вЂќ AED {p.price}/mo
          </button>
        ))}
      </div>

      {/* Plan editor */}
      {plans[editIdx] && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>

          {/* Left вв‚¬вЂќ edit form */}
          <div style={{ background: T.surface, borderRadius: 16, border: `1px solid ${T.border}`, padding: "20px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ fontFamily: "'Fraunces',serif", fontSize: 15, fontWeight: 700, color: T.white }}>Edit {plans[editIdx].name} Plan</div>

            {[
              { label: "Plan Name", field: "name", type: "text" },
              { label: "Price (AED/month)", field: "price", type: "number" },
              { label: "CTA Button Text", field: "cta", type: "text" },
              { label: "Note (shown below price)", field: "note", type: "text", placeholder: "Optional note" },
              { label: "Stripe Price ID", field: "stripeId", type: "text", placeholder: "price_xxx (from Stripe dashboard)" },
            ].map(f => (
              <div key={f.field} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>{f.label}</label>
                <input type={f.type} value={plans[editIdx][f.field] || ""} placeholder={f.placeholder || ""}
                  onChange={e => updatePlan(editIdx, f.field, e.target.value)}
                  style={{ padding: "9px 12px", background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8, color: T.white, fontSize: 13, fontFamily: "'Outfit',sans-serif", outline: "none" }} />
              </div>
            ))}

            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
              <input type="checkbox" checked={plans[editIdx].popular || false} onChange={e => updatePlan(editIdx, "popular", e.target.checked)}
                style={{ width: 16, height: 16, accentColor: T.gold }} />
              <span style={{ fontSize: 13, color: T.textSecondary }}>Mark as "Most Popular"</span>
            </label>
          </div>

          {/* Right вв‚¬вЂќ features editor */}
          <div style={{ background: T.surface, borderRadius: 16, border: `1px solid ${T.border}`, padding: "20px 24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div style={{ fontFamily: "'Fraunces',serif", fontSize: 15, fontWeight: 700, color: T.white }}>Features ({plans[editIdx].features?.length || 0})</div>
              <button type="button" onClick={() => addFeature(editIdx)}
                style={{ padding: "6px 14px", background: "rgba(16,185,129,0.1)", border: `1px solid ${T.green}44`, borderRadius: 8, color: T.green, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>
                + Add Feature
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 380, overflowY: "auto" }}>
              {(plans[editIdx].features || []).map((feat, j) => (
                <div key={j} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input type="text" value={feat} onChange={e => updateFeature(editIdx, j, e.target.value)}
                    style={{ flex: 1, padding: "8px 10px", background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 6, color: T.white, fontSize: 12, fontFamily: "'Outfit',sans-serif", outline: "none" }} />
                  <button type="button" onClick={() => removeFeature(editIdx, j)}
                    style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(239,68,68,0.1)", border: `1px solid ${T.red}33`, borderRadius: 6, color: T.red, cursor: "pointer", fontSize: 14, flexShrink: 0 }}>
                    ГвЂ”
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* Live preview */}
      <div style={{ background: T.surface, borderRadius: 16, border: `1px solid ${T.border}`, padding: "20px 24px" }}>
        <div style={{ fontFamily: "'Fraunces',serif", fontSize: 15, fontWeight: 700, color: T.white, marginBottom: 14 }}>Live Preview вв‚¬вЂќ Upgrade Modal</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
          {plans.map((p, i) => (
            <div key={i} style={{ padding: "20px", borderRadius: 14, background: T.surfaceAlt, border: `2px solid ${p.popular ? T.gold : T.border}`, position: "relative" }}>
              {p.popular && <div style={{ position: "absolute", top: -10, left: "50%", transform: "translateX(-50%)", background: T.gold, color: T.bg, fontSize: 9, fontWeight: 800, padding: "2px 12px", borderRadius: 10, whiteSpace: "nowrap" }}>MOST POPULAR</div>}
              <div style={{ fontSize: 16, fontWeight: 800, color: T.white, marginBottom: 4 }}>{p.name}</div>
              <div style={{ fontFamily: "'Fraunces',serif", fontSize: 28, fontWeight: 900, color: p.popular ? T.gold : T.white }}>AED {p.price}<span style={{ fontSize: 13, color: T.textMuted, fontFamily: "'Outfit',sans-serif", fontWeight: 400 }}>/mo</span></div>
              {p.note && <div style={{ fontSize: 10, color: T.textMuted, marginBottom: 8 }}>{p.note}</div>}
              <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 4 }}>
                {(p.features || []).slice(0, 5).map((f, j) => <div key={j} style={{ fontSize: 11, color: T.textSecondary }}>вњвЂњ {f}</div>)}
                {(p.features || []).length > 5 && <div style={{ fontSize: 11, color: T.textMuted }}>+{p.features.length - 5} more...</div>}
              </div>
              <div style={{ marginTop: 12, padding: "8px 0", background: p.popular ? T.gold : T.surfaceAlt, borderRadius: 8, textAlign: "center", fontSize: 12, fontWeight: 700, color: p.popular ? T.bg : T.textMuted, border: p.popular ? "none" : `1px solid ${T.border}` }}>{p.cta}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 12, fontSize: 11, color: T.textMuted }}>рџвЂ™Ў This preview matches exactly what users see in the upgrade modal. Save to publish changes instantly.</div>
      </div>

    </div>
  );
};

/* ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ S18: BILLING & INVOICE ENGINE ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬
   Admin tab "billing":
   - Per-user billing history from Firestore payments collection
   - Invoice PDF generation per payment
   - Failed payment handling + retry logic
   - Upcoming renewal alerts (users expiring in 7 days)
   - Revenue breakdown by plan (free/pro/enterprise)
   - MRR chart with 3-month projections
   - Churn predictor (inactive users nearing billing cycle end)
ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ */

export default PricingPlansTab;
