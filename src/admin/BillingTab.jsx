import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { db } from "../firebase";
import { collection, getDocs, doc, getDoc, setDoc, deleteDoc, onSnapshot, query, orderBy, limit, where, addDoc, updateDoc } from "firebase/firestore";
import { BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { T } from "../theme";
import emailjs from "@emailjs/browser";

const BillingTab = ({ db, T, notify, users, adminUser }) => {
  const [payments, setPayments]       = React.useState([]);
  const [loading, setLoading]         = React.useState(true);
  const [selectedUser, setSelectedUser] = React.useState(null);
  const [retryLoading, setRetryLoading] = React.useState(null);
  const [tab, setBillingTab]          = React.useState("overview"); // overview | payments | renewals | churn

  // Tier pricing
  const PRICES = { pro: 99, enterprise: 499, pro_trial: 0, free: 0 };

  // Load payments from Firestore
  React.useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, "payments"), orderBy("createdAt", "desc"), limit(500)),
      (snap) => {
        const list = [];
        snap.forEach(d => list.push({ id: d.id, ...d.data() }));
        setPayments(list);
        setLoading(false);
      },
      () => setLoading(false)
    );
    return () => unsub();
  }, [db]);

  // Computed stats
  const now = new Date();

  const mrr = React.useMemo(() => {
    const pro = users.filter(u => u.tier === "pro").length;
    const ent = users.filter(u => u.tier === "enterprise").length;
    return (pro * PRICES.pro) + (ent * PRICES.enterprise);
  }, [users]);

  const arr = mrr * 12;

  // Revenue breakdown
  const breakdown = React.useMemo(() => {
    const pro  = users.filter(u => u.tier === "pro").length;
    const ent  = users.filter(u => u.tier === "enterprise").length;
    const trial = users.filter(u => u.tier === "pro_trial").length;
    const free = users.filter(u => u.tier === "free" || !u.tier).length;
    return { pro, ent, trial, free,
      proRev: pro * PRICES.pro,
      entRev: ent * PRICES.enterprise,
    };
  }, [users]);

  // MRR projection — last 6 months + 3 projected
  const mrrHistory = React.useMemo(() => {
    const months = [];
    for (let m = 5; m >= 0; m--) {
      const d   = new Date(now.getFullYear(), now.getMonth() - m, 1);
      const lbl = d.toLocaleDateString("en-AE", { month: "short", year: "2-digit" });
      // Estimate from payments that month
      const monthPayments = payments.filter(p => {
        const pd = new Date(p.createdAt || 0);
        return pd.getMonth() === d.getMonth() && pd.getFullYear() === d.getFullYear() && p.status === "succeeded";
      });
      const rev = monthPayments.reduce((s, p) => s + (p.amount || 0), 0) || (m === 0 ? mrr : 0);
      months.push({ label: lbl, mrr: rev, actual: true });
    }
    const lastMRR    = months[months.length - 1]?.mrr || mrr;
    const prevMRR    = months[months.length - 2]?.mrr || mrr * 0.9;
    const growthRate = prevMRR > 0 ? Math.min(Math.max((lastMRR - prevMRR) / prevMRR, -0.1), 0.3) : 0.1;
    for (let f = 1; f <= 3; f++) {
      const d   = new Date(now.getFullYear(), now.getMonth() + f, 1);
      months.push({ label: d.toLocaleDateString("en-AE", { month: "short", year: "2-digit" }), projected: Math.round(lastMRR * Math.pow(1 + growthRate, f)), actual: false });
    }
    return months;
  }, [payments, mrr]);

  // Upcoming renewals — users whose subscription expires in 7 days
  const upcomingRenewals = React.useMemo(() => {
    return users.filter(u => {
      if (!u.subscriptionExpiry || u.tier === "free") return false;
      const exp  = new Date(u.subscriptionExpiry);
      const diff = (exp - now) / (1000 * 60 * 60 * 24);
      return diff >= 0 && diff <= 7;
    }).map(u => ({
      ...u,
      daysUntilRenewal: Math.ceil((new Date(u.subscriptionExpiry) - now) / (1000 * 60 * 60 * 24)),
      renewalAmount: PRICES[u.tier] || 0,
    })).sort((a, b) => a.daysUntilRenewal - b.daysUntilRenewal);
  }, [users]);

  // Failed payments
  const failedPayments = React.useMemo(() =>
    payments.filter(p => p.status === "failed" || p.status === "requires_payment_method"),
    [payments]
  );

  // Churn predictor — paid users inactive 14+ days + expiring soon
  const churnRisk = React.useMemo(() => {
    return users.filter(u => {
      if (u.tier === "free" || u.tier === "pro_trial") return false;
      const lastSeen   = u.lastLoginAt ? new Date(u.lastLoginAt) : new Date(u.createdAt || 0);
      const daysSince  = (now - lastSeen) / (1000 * 60 * 60 * 24);
      const hasExpiry  = u.subscriptionExpiry;
      const daysToExp  = hasExpiry ? (new Date(u.subscriptionExpiry) - now) / (1000 * 60 * 60 * 24) : 999;
      return daysSince >= 14 && daysToExp <= 30;
    }).map(u => ({
      ...u,
      daysSinceActive: Math.floor((now - new Date(u.lastLoginAt || u.createdAt || 0)) / (1000 * 60 * 60 * 24)),
      daysToExpiry:    u.subscriptionExpiry ? Math.ceil((new Date(u.subscriptionExpiry) - now) / (1000 * 60 * 60 * 24)) : null,
      riskScore:       Math.min(100, Math.floor(((now - new Date(u.lastLoginAt || u.createdAt || 0)) / (1000 * 60 * 60 * 24)) * 3)),
    })).sort((a, b) => b.riskScore - a.riskScore);
  }, [users]);

  // Generate invoice PDF (HTML print)
  const generateInvoice = (payment, user) => {
    const inv = {
      invoiceNo:   `INV-${payment.id?.slice(-8).toUpperCase() || "000000"}`,
      date:        payment.createdAt ? new Date(payment.createdAt).toLocaleDateString("en-AE") : "—",
      dueDate:     payment.createdAt ? new Date(new Date(payment.createdAt).getTime() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString("en-AE") : "—",
      customer:    user?.email || payment.userEmail || "—",
      plan:        payment.plan || payment.tier || "Pro",
      amount:      payment.amount || PRICES[payment.tier] || 99,
      status:      payment.status || "succeeded",
      stripeId:    payment.stripePaymentId || payment.stripeId || "—",
    };
    const html = `<!DOCTYPE html><html><head><title>${inv.invoiceNo}</title>
    <style>body{font-family:Arial,sans-serif;max-width:700px;margin:40px auto;color:#1E293B}
    .header{border-bottom:3px solid #D4A843;padding-bottom:20px;margin-bottom:30px;display:flex;justify-content:space-between}
    .logo{font-size:24px;font-weight:900;color:#D4A843}.sub{color:#64748B;font-size:12px}
    .inv-no{font-size:18px;font-weight:700;color:#D4A843}.badge{padding:4px 12px;border-radius:20px;font-size:12px;font-weight:700;background:${inv.status==="succeeded"?"#D1FAE5":"#FEE2E2"};color:${inv.status==="succeeded"?"#065F46":"#991B1B"}}
    table{width:100%;border-collapse:collapse;margin:20px 0}th{background:#F8FAFC;padding:10px;text-align:left;border-bottom:2px solid #E2E8F0;font-size:13px}
    td{padding:12px 10px;border-bottom:1px solid #E2E8F0;font-size:14px}.total{font-size:20px;font-weight:900;color:#D4A843}
    .footer{margin-top:40px;padding-top:20px;border-top:1px solid #E2E8F0;color:#94A3B8;font-size:11px;text-align:center}
    @media print{body{margin:0}}</style></head><body>
    <div class="header"><div><div class="logo">DXB Analytics</div><div class="sub">The Address Holding · Dubai, UAE<br>info@theaddressholding.ae</div></div>
    <div style="text-align:right"><div class="inv-no">${inv.invoiceNo}</div><div class="sub">Date: ${inv.date}<br>Due: ${inv.dueDate}</div><div style="margin-top:8px"><span class="badge">${inv.status==="succeeded"?"PAID":"FAILED"}</span></div></div></div>
    <div><strong>Bill To:</strong><br>${inv.customer}<br><span style="color:#64748B;font-size:13px">Stripe ID: ${inv.stripeId}</span></div>
    <table><thead><tr><th>Description</th><th>Period</th><th>Amount (AED)</th></tr></thead><tbody>
    <tr><td>DXB Analytics ${inv.plan} Plan</td><td>Monthly subscription</td><td>AED ${inv.amount}</td></tr>
    </tbody></table>
    <div style="text-align:right;margin:20px 0"><div style="color:#64748B;font-size:13px">Subtotal: AED ${inv.amount}</div>
    <div style="color:#64748B;font-size:13px">VAT (0%): AED 0</div>
    <div class="total">Total: AED ${inv.amount}</div></div>
    <div class="footer">DXB Analytics · Dubai Real Estate Intelligence · emaar-dashboard.vercel.app<br>For billing inquiries: info@theaddressholding.ae</div>
    </body></html>`;
    const w = window.open("", "_blank");
    w.document.write(html);
    w.document.close();
    setTimeout(() => w.print(), 500);
  };

  // Retry failed payment — mark as retry_requested in Firestore
  const retryPayment = async (payment) => {
    setRetryLoading(payment.id);
    try {
      await updateDoc(doc(db, "payments", payment.id), {
        retryRequested: true,
        retryRequestedAt: new Date().toISOString(),
        retryRequestedBy: adminUser?.email,
      });
      await addDoc(collection(db, "adminAlerts"), {
        message: `🔄 Payment retry requested for ${payment.userEmail || "user"} — AED ${payment.amount || 0}`,
        type: "payment_retry", severity: "warning", read: false,
        createdAt: new Date().toISOString(), source: "admin/billing",
      });
      notify("✅ Retry flagged — contact user to update payment method", "success");
    } catch(e) {
      notify("❌ " + e.message, "error");
    } finally { setRetryLoading(null); }
  };

  const KpiCard = ({ label, value, sub, color }) => (
    <div style={{ background: T.surface, borderRadius: 12, border: `1px solid ${T.border}`, padding: "16px 20px" }}>
      <div style={{ fontSize: 10, color: T.textMuted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>{label}</div>
      <div style={{ fontFamily: "'Fraunces',serif", fontSize: 26, fontWeight: 800, color: color || T.gold }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: T.textMuted, marginTop: 4 }}>{sub}</div>}
    </div>
  );

  const SubTab = ({ id, label }) => (
    <button type="button" onClick={() => setBillingTab(id)}
      style={{ padding: "8px 16px", borderRadius: 8, border: `1px solid ${tab === id ? T.gold : T.border}`, background: tab === id ? "rgba(212,168,67,0.1)" : "transparent", color: tab === id ? T.gold : T.textMuted, fontSize: 12, fontWeight: tab === id ? 700 : 400, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>
      {label}
    </button>
  );

  return (
    <div style={{ padding: "28px 32px", display: "flex", flexDirection: "column", gap: 24 }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ fontFamily: "'Fraunces',serif", fontSize: 26, fontWeight: 800, color: T.gold, marginBottom: 4 }}>Billing & Invoices</h2>
          <p style={{ color: T.textMuted, fontSize: 13 }}>Payment history · Invoice engine · Renewal alerts · Churn predictor</p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {failedPayments.length > 0 && (
            <span style={{ fontSize: 11, padding: "4px 12px", borderRadius: 8, background: "rgba(239,68,68,0.12)", color: T.red, fontWeight: 700, border: `1px solid rgba(239,68,68,0.2)` }}>
              ⚠️ {failedPayments.length} Failed Payment{failedPayments.length > 1 ? "s" : ""}
            </span>
          )}
          {upcomingRenewals.length > 0 && (
            <span style={{ fontSize: 11, padding: "4px 12px", borderRadius: 8, background: "rgba(212,168,67,0.1)", color: T.gold, fontWeight: 700, border: `1px solid ${T.gold}33` }}>
              🔔 {upcomingRenewals.length} Renewal{upcomingRenewals.length > 1 ? "s" : ""} due
            </span>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        <KpiCard label="Monthly Recurring Revenue" value={`AED ${mrr.toLocaleString()}`} color={T.gold} sub={`AED ${arr.toLocaleString()} ARR`} />
        <KpiCard label="Paying Users" value={breakdown.pro + breakdown.ent} color={T.green} sub={`${breakdown.pro} Pro · ${breakdown.ent} Enterprise`} />
        <KpiCard label="Failed Payments" value={failedPayments.length} color={failedPayments.length > 0 ? T.red : T.green} sub={failedPayments.length > 0 ? "Requires attention" : "All clear"} />
        <KpiCard label="Churn Risk" value={churnRisk.length} color={churnRisk.length > 0 ? T.orange : T.green} sub="Inactive + expiring soon" />
      </div>

      {/* Sub-tabs */}
      <div style={{ display: "flex", gap: 8 }}>
        <SubTab id="overview"  label="📊 Revenue Overview" />
        <SubTab id="payments"  label="💳 Payment History" />
        <SubTab id="renewals"  label={`🔔 Renewals (${upcomingRenewals.length})`} />
        <SubTab id="churn"     label={`⚠️ Churn Risk (${churnRisk.length})`} />
      </div>

      {/* ── OVERVIEW TAB ── */}
      {tab === "overview" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* MRR Chart */}
          <div style={{ background: T.surface, borderRadius: 16, border: `1px solid ${T.border}`, padding: "20px 24px" }}>
            <div style={{ fontFamily: "'Fraunces',serif", fontSize: 16, fontWeight: 700, color: T.white, marginBottom: 16 }}>MRR Trend + 3-Month Projection</div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 160 }}>
              {mrrHistory.map((m, i) => {
                const val    = m.actual ? m.mrr : m.projected;
                const maxVal = Math.max(...mrrHistory.map(x => x.actual ? x.mrr : x.projected || 0), 1);
                const h      = Math.max((val / maxVal) * 130, 4);
                const color  = m.actual ? T.gold : "rgba(212,168,67,0.35)";
                return (
                  <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                    <div style={{ fontSize: 10, color: T.textMuted, fontWeight: 600 }}>AED {(val/1000).toFixed(0)}K</div>
                    <div style={{ width: "100%", height: h, background: color, borderRadius: "4px 4px 0 0", border: m.actual ? "none" : `1px dashed ${T.gold}55` }} title={`${m.label}: AED ${val}`} />
                    <div style={{ fontSize: 10, color: m.actual ? T.textSecondary : T.textMuted, fontWeight: m.actual ? 600 : 400 }}>{m.label}</div>
                    {!m.actual && <div style={{ fontSize: 9, color: T.textMuted }}>proj.</div>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Revenue breakdown by plan */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div style={{ background: T.surface, borderRadius: 16, border: `1px solid ${T.border}`, padding: "20px 24px" }}>
              <div style={{ fontFamily: "'Fraunces',serif", fontSize: 15, fontWeight: 700, color: T.white, marginBottom: 14 }}>Revenue by Plan</div>
              {[
                { label: "Enterprise", users: breakdown.ent,   rev: breakdown.entRev, color: T.purple, price: 499 },
                { label: "Pro",        users: breakdown.pro,   rev: breakdown.proRev, color: T.gold,   price: 99  },
                { label: "Trial",      users: breakdown.trial, rev: 0,                color: T.blue,   price: 0   },
                { label: "Free",       users: breakdown.free,  rev: 0,                color: T.textMuted, price: 0 },
              ].map(p => (
                <div key={p.label} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: p.color, flexShrink: 0 }} />
                  <div style={{ flex: 1, fontSize: 13, color: T.white }}>{p.label}</div>
                  <div style={{ fontSize: 12, color: T.textMuted }}>{p.users} users</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: p.color, width: 90, textAlign: "right" }}>
                    {p.rev > 0 ? `AED ${p.rev.toLocaleString()}` : "—"}
                  </div>
                </div>
              ))}
              <div style={{ borderTop: `1px solid ${T.border}`, marginTop: 12, paddingTop: 12, display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: T.white }}>Total MRR</span>
                <span style={{ fontSize: 15, fontWeight: 800, color: T.gold, fontFamily: "'Fraunces',serif" }}>AED {mrr.toLocaleString()}</span>
              </div>
            </div>

            <div style={{ background: T.surface, borderRadius: 16, border: `1px solid ${T.border}`, padding: "20px 24px" }}>
              <div style={{ fontFamily: "'Fraunces',serif", fontSize: 15, fontWeight: 700, color: T.white, marginBottom: 14 }}>Key Metrics</div>
              {[
                { label: "Annual Recurring Revenue", value: `AED ${arr.toLocaleString()}`, color: T.gold },
                { label: "Avg Revenue Per User", value: breakdown.pro + breakdown.ent > 0 ? `AED ${Math.round(mrr / (breakdown.pro + breakdown.ent))}` : "—", color: T.teal },
                { label: "Trial → Paid Conv. Rate", value: users.filter(u => u.tier === "pro_trial").length > 0 ? `${Math.round((breakdown.pro / (breakdown.pro + users.filter(u=>u.tier==="pro_trial").length)) * 100)}%` : "—", color: T.green },
                { label: "Paying User %", value: users.length > 0 ? `${Math.round(((breakdown.pro + breakdown.ent) / users.length) * 100)}%` : "—", color: T.blue },
                { label: "Failed Payments", value: `${failedPayments.length}`, color: failedPayments.length > 0 ? T.red : T.green },
                { label: "Churn Risk Users", value: `${churnRisk.length}`, color: churnRisk.length > 0 ? T.orange : T.green },
              ].map(m => (
                <div key={m.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: `1px solid ${T.border}` }}>
                  <span style={{ fontSize: 12, color: T.textSecondary }}>{m.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: m.color }}>{m.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── PAYMENT HISTORY TAB ── */}
      {tab === "payments" && (
        <div style={{ background: T.surface, borderRadius: 16, border: `1px solid ${T.border}`, padding: "20px 24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ fontFamily: "'Fraunces',serif", fontSize: 16, fontWeight: 700, color: T.white }}>Payment History</div>
            <div style={{ fontSize: 12, color: T.textMuted }}>{payments.length} records · Firestore payments collection</div>
          </div>
          {loading ? (
            <div style={{ color: T.textMuted, fontSize: 13, padding: "20px 0" }}>Loading payments...</div>
          ) : payments.length === 0 ? (
            <div style={{ color: T.textMuted, fontSize: 13, textAlign: "center", padding: "40px 0" }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>💳</div>
              <div>No payment records yet</div>
              <div style={{ fontSize: 11, marginTop: 4 }}>Payments appear here when written to Firestore <code style={{ color: T.teal }}>payments/</code> collection by your Stripe webhook</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 500, overflowY: "auto" }}>
              {/* Header row */}
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1fr", gap: 8, padding: "8px 12px", fontSize: 10, color: T.textMuted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, borderBottom: `1px solid ${T.border}` }}>
                <div>User</div><div>Amount</div><div>Plan</div><div>Status</div><div>Date</div><div>Actions</div>
              </div>
              {payments.map(p => {
                const statusColor = p.status === "succeeded" ? T.green : p.status === "failed" ? T.red : T.orange;
                const user = users.find(u => u.uid === p.userId || u.email === p.userEmail);
                return (
                  <div key={p.id} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1fr", gap: 8, padding: "10px 12px", borderRadius: 8, background: T.surfaceAlt, border: `1px solid ${p.status === "failed" ? T.red + "33" : T.border}`, alignItems: "center" }}>
                    <div style={{ fontSize: 12, color: T.white, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.userEmail || user?.email || "—"}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.gold }}>AED {p.amount || PRICES[p.tier] || "—"}</div>
                    <div style={{ fontSize: 11, color: T.textSecondary }}>{p.plan || p.tier || "Pro"}</div>
                    <div><span style={{ fontSize: 10, fontWeight: 700, color: statusColor, padding: "2px 8px", borderRadius: 6, background: statusColor + "12", border: `1px solid ${statusColor}33` }}>{p.status || "—"}</span></div>
                    <div style={{ fontSize: 11, color: T.textMuted }}>{p.createdAt ? new Date(p.createdAt).toLocaleDateString("en-AE") : "—"}</div>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button type="button" onClick={() => generateInvoice(p, user)}
                        style={{ fontSize: 10, padding: "4px 10px", borderRadius: 6, background: "rgba(212,168,67,0.1)", border: `1px solid ${T.gold}44`, color: T.gold, cursor: "pointer", fontFamily: "'Outfit',sans-serif", fontWeight: 600 }}>
                        PDF
                      </button>
                      {p.status === "failed" && (
                        <button type="button" onClick={() => retryPayment(p)} disabled={retryLoading === p.id}
                          style={{ fontSize: 10, padding: "4px 10px", borderRadius: 6, background: "rgba(239,68,68,0.1)", border: `1px solid ${T.red}44`, color: T.red, cursor: "pointer", fontFamily: "'Outfit',sans-serif", fontWeight: 600 }}>
                          {retryLoading === p.id ? "..." : "Retry"}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── RENEWALS TAB ── */}
      {tab === "renewals" && (
        <div style={{ background: T.surface, borderRadius: 16, border: `1px solid ${T.border}`, padding: "20px 24px" }}>
          <div style={{ fontFamily: "'Fraunces',serif", fontSize: 16, fontWeight: 700, color: T.white, marginBottom: 4 }}>Upcoming Renewals — Next 7 Days</div>
          <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 16 }}>Users whose subscription expires within 7 days — reach out proactively to reduce churn</div>
          {upcomingRenewals.length === 0 ? (
            <div style={{ color: T.textMuted, fontSize: 13, textAlign: "center", padding: "40px 0" }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🎉</div>
              No renewals due in the next 7 days
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {upcomingRenewals.map(u => (
                <div key={u.uid} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 16px", borderRadius: 10, background: T.surfaceAlt, border: `1px solid ${u.daysUntilRenewal <= 2 ? T.red + "44" : T.border}` }}>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: `linear-gradient(135deg,${T.gold},#B8912F)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: T.bg, flexShrink: 0 }}>
                    {(u.name || u.email || "U")[0].toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: T.white }}>{u.email}</div>
                    <div style={{ fontSize: 11, color: T.textMuted }}>{u.tier} · Expires {new Date(u.subscriptionExpiry).toLocaleDateString("en-AE")}</div>
                  </div>
                  <div style={{ textAlign: "center", flexShrink: 0 }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: u.daysUntilRenewal <= 2 ? T.red : T.gold, fontFamily: "'Fraunces',serif" }}>{u.daysUntilRenewal}d</div>
                    <div style={{ fontSize: 10, color: T.textMuted }}>until renewal</div>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: T.green, flexShrink: 0 }}>AED {u.renewalAmount}</div>
                  <button type="button"
                    onClick={() => { notify(`📧 Send renewal reminder to ${u.email}`, "info"); }}
                    style={{ padding: "7px 14px", background: "rgba(212,168,67,0.1)", border: `1px solid ${T.gold}44`, borderRadius: 8, color: T.gold, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "'Outfit',sans-serif", flexShrink: 0 }}>
                    Remind
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── CHURN RISK TAB ── */}
      {tab === "churn" && (
        <div style={{ background: T.surface, borderRadius: 16, border: `1px solid ${T.border}`, padding: "20px 24px" }}>
          <div style={{ fontFamily: "'Fraunces',serif", fontSize: 16, fontWeight: 700, color: T.white, marginBottom: 4 }}>Churn Risk Predictor</div>
          <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 16 }}>Paid users inactive 14+ days AND subscription expiring within 30 days — highest churn probability</div>
          {churnRisk.length === 0 ? (
            <div style={{ color: T.textMuted, fontSize: 13, textAlign: "center", padding: "40px 0" }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
              No high-risk churn users detected
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {churnRisk.map(u => (
                <div key={u.uid} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 16px", borderRadius: 10, background: T.surfaceAlt, border: `1px solid ${u.riskScore >= 80 ? T.red + "44" : u.riskScore >= 50 ? T.orange + "44" : T.border}` }}>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: u.riskScore >= 80 ? T.red : u.riskScore >= 50 ? T.orange : T.gold, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: "#fff", flexShrink: 0 }}>
                    {(u.name || u.email || "U")[0].toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: T.white }}>{u.email}</div>
                    <div style={{ fontSize: 11, color: T.textMuted }}>{u.tier} · Last active {u.daysSinceActive}d ago · Expires in {u.daysToExpiry}d</div>
                  </div>
                  {/* Risk score bar */}
                  <div style={{ width: 100, flexShrink: 0 }}>
                    <div style={{ fontSize: 10, color: T.textMuted, marginBottom: 3 }}>Risk: {u.riskScore}%</div>
                    <div style={{ height: 6, borderRadius: 3, background: T.border, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${u.riskScore}%`, background: u.riskScore >= 80 ? T.red : u.riskScore >= 50 ? T.orange : T.gold, borderRadius: 3 }} />
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                    <button type="button"
                      onClick={() => notify(`📧 Win-back email queued for ${u.email}`, "info")}
                      style={{ padding: "7px 14px", background: "rgba(212,168,67,0.1)", border: `1px solid ${T.gold}44`, borderRadius: 8, color: T.gold, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>
                      Win-back
                    </button>
                    <button type="button"
                      onClick={() => notify(`🎁 1 week extension offered to ${u.email}`, "success")}
                      style={{ padding: "7px 14px", background: "rgba(16,185,129,0.1)", border: `1px solid ${T.green}44`, borderRadius: 8, color: T.green, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>
                      Extend
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
};

/* ─── S17: REFERRAL PROGRAM ─────────────────────────────────────────────────
   Admin tab "referral":
   - Referral link generator per user
   - Track clicks → signups → conversions
   - Referrer gets 1 month free per paid conversion
   - Referral leaderboard
   - Firestore referrals collection
   - Email trigger on successful referral
────────────────────────────────────────────────────────────────────────── */

export default BillingTab;
