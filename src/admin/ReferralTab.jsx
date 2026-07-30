import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { db } from "../firebase";
import { collection, getDocs, doc, getDoc, setDoc, deleteDoc, onSnapshot, query, orderBy, limit, where, addDoc, updateDoc } from "firebase/firestore";
import { BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { T } from "../theme";
import emailjs from "@emailjs/browser";

const ReferralTab = ({ db, T, notify, users, adminUser }) => {
  const [referrals, setReferrals] = React.useState([]);
  const [loading, setLoading]     = React.useState(true);
  const [selectedUser, setSelectedUser] = React.useState(null);
  const [grantLoading, setGrantLoading] = React.useState(false);
  const [stats, setStats] = React.useState({ totalReferrals: 0, totalConversions: 0, totalRewardMonths: 0 });
  const BASE_URL = import.meta.env.VITE_BASE_URL || "https://emaar-dashboard.vercel.app";

  // Load all referrals from Firestore
  React.useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, "referrals"), orderBy("createdAt", "desc"), limit(200)),
      (s) => {
        const list = [];
        s.forEach(d => list.push({ id: d.id, ...d.data() }));
        setReferrals(list);
        setStats({
          totalReferrals:    list.length,
          totalConversions:  list.filter(r => r.status === "converted").length,
          totalRewardMonths: list.filter(r => r.rewardGranted).length,
        });
        setLoading(false);
      },
      () => setLoading(false)
    );
    return () => unsub();
  }, [db]);

  // Generate referral link for a user
  const getReferralLink = (user) => {
    const code = btoa(user.uid || user.id || user.email).replace(/[^a-zA-Z0-9]/g, "").slice(0, 10).toUpperCase();
    return `${BASE_URL}?ref=${code}`;
  };

  // Grant 1 month free to referrer
  const grantReward = async (referral) => {
    setGrantLoading(true);
    try {
      await updateDoc(doc(db, "referrals", referral.id), {
        rewardGranted: true,
        rewardGrantedAt: new Date().toISOString(),
        rewardGrantedBy: adminUser?.email,
      });
      if (referral.referrerUid) {
        const userSnap = await getDoc(doc(db, "users", referral.referrerUid));
        if (userSnap.exists()) {
          const userData = userSnap.data();
          const currentExpiry = userData.subscriptionExpiry ? new Date(userData.subscriptionExpiry) : new Date();
          const newExpiry = new Date(currentExpiry);
          newExpiry.setMonth(newExpiry.getMonth() + 1);
          await updateDoc(doc(db, "users", referral.referrerUid), {
            subscriptionExpiry: newExpiry.toISOString(),
            referralRewardsEarned: (userData.referralRewardsEarned || 0) + 1,
          });
        }
      }
      await addDoc(collection(db, "adminAlerts"), {
        message: `🎁 Referral reward granted: ${referral.referrerEmail} gets 1 month free`,
        type: "referral_reward", severity: "info", read: false,
        createdAt: new Date().toISOString(), source: "admin/referral",
      });
      notify("✅ 1 month free granted to " + (referral.referrerEmail || "referrer"), "success");
    } catch(e) {
      notify("❌ Failed: " + e.message, "error");
    } finally { setGrantLoading(false); }
  };

  // Create manual referral record
  const createReferral = async (referrerUser, convertedEmail) => {
    try {
      await addDoc(collection(db, "referrals"), {
        referrerUid:   referrerUser.uid || referrerUser.id,
        referrerEmail: referrerUser.email,
        referrerName:  referrerUser.name || referrerUser.email?.split("@")[0],
        convertedEmail,
        status:        "converted",
        rewardGranted: false,
        createdAt:     new Date().toISOString(),
        source:        "admin_manual",
      });
      notify("✅ Referral conversion recorded", "success");
    } catch(e) {
      notify("❌ " + e.message, "error");
    }
  };

  // Leaderboard — group by referrer
  const leaderboard = React.useMemo(() => {
    const map = {};
    referrals.forEach(r => {
      const key = r.referrerEmail || r.referrerUid || "unknown";
      if (!map[key]) map[key] = { email: r.referrerEmail, name: r.referrerName, clicks: 0, signups: 0, conversions: 0, rewards: 0 };
      map[key].clicks      += r.clicks || 0;
      map[key].signups     += r.signups || 0;
      if (r.status === "converted") map[key].conversions++;
      if (r.rewardGranted) map[key].rewards++;
    });
    return Object.values(map).sort((a, b) => b.conversions - a.conversions).slice(0, 10);
  }, [referrals]);

  const Card = ({ label, value, color, sub }) => (
    <div style={{ background: T.surface, borderRadius: 12, border: `1px solid ${T.border}`, padding: "16px 20px" }}>
      <div style={{ fontSize: 10, color: T.textMuted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>{label}</div>
      <div style={{ fontFamily: "'Fraunces',serif", fontSize: 28, fontWeight: 800, color: color || T.gold }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: T.textMuted, marginTop: 4 }}>{sub}</div>}
    </div>
  );

  return (
    <div style={{ padding: "28px 32px", display: "flex", flexDirection: "column", gap: 24 }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h2 style={{ fontFamily: "'Fraunces',serif", fontSize: 26, fontWeight: 800, color: T.gold, marginBottom: 4 }}>Referral Program</h2>
          <p style={{ color: T.textMuted, fontSize: 13 }}>Users share their link → friend signs up → converts to paid → referrer gets 1 month free</p>
        </div>
        <div style={{ fontSize: 9, padding: "4px 12px", borderRadius: 8, background: "rgba(16,185,129,0.12)", color: T.green, fontWeight: 700, border: `1px solid rgba(16,185,129,0.2)` }}>● LIVE · Firestore</div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        <Card label="Total Referrals" value={stats.totalReferrals} color={T.blue} sub="All time" />
        <Card label="Conversions" value={stats.totalConversions} color={T.green} sub="Paid upgrades" />
        <Card label="Rewards Granted" value={stats.totalRewardMonths} color={T.gold} sub="Free months given" />
        <Card label="Conversion Rate" value={stats.totalReferrals > 0 ? Math.round((stats.totalConversions / stats.totalReferrals) * 100) + "%" : "—"} color={T.teal} sub="Referral → paid" />
      </div>

      {/* User Referral Link Generator */}
      <div style={{ background: T.surface, borderRadius: 16, border: `1px solid ${T.border}`, padding: "20px 24px" }}>
        <div style={{ fontFamily: "'Fraunces',serif", fontSize: 16, fontWeight: 700, color: T.white, marginBottom: 14 }}>Generate Referral Link for User</div>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <select
            value={selectedUser?.uid || ""}
            onChange={e => setSelectedUser(users.find(u => (u.uid || u.id) === e.target.value) || null)}
            style={{ flex: 1, minWidth: 220, padding: "10px 14px", background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8, color: T.white, fontSize: 13, fontFamily: "'Outfit',sans-serif" }}
          >
            <option value="">— Select a user —</option>
            {users.filter(u => u.email).map(u => (
              <option key={u.uid || u.id} value={u.uid || u.id}>{u.email} ({u.tier || "free"})</option>
            ))}
          </select>
          {selectedUser && (
            <div style={{ flex: 2, display: "flex", alignItems: "center", gap: 8, background: T.surfaceAlt, borderRadius: 8, border: `1px solid ${T.gold}33`, padding: "10px 14px" }}>
              <span style={{ fontSize: 12, color: T.textMuted, flexShrink: 0 }}>Link:</span>
              <span style={{ fontSize: 12, color: T.teal, flex: 1, fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{getReferralLink(selectedUser)}</span>
              <button type="button"
                onClick={() => { navigator.clipboard.writeText(getReferralLink(selectedUser)); notify("✅ Copied to clipboard", "success"); }}
                style={{ padding: "6px 14px", background: T.goldGlow, border: `1px solid ${T.gold}`, borderRadius: 6, color: T.gold, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "'Outfit',sans-serif", flexShrink: 0 }}>
                Copy
              </button>
            </div>
          )}
        </div>
        {selectedUser && (
          <div style={{ marginTop: 12, padding: "10px 14px", borderRadius: 8, background: "rgba(16,185,129,0.06)", border: `1px solid rgba(16,185,129,0.15)`, fontSize: 12, color: T.textMuted }}>
            Referral code: <span style={{ color: T.green, fontWeight: 700, fontFamily: "monospace" }}>
              {btoa(selectedUser.uid || selectedUser.id || selectedUser.email).replace(/[^a-zA-Z0-9]/g, "").slice(0, 10).toUpperCase()}
            </span>
            &nbsp;·&nbsp; Rewards earned so far: <span style={{ color: T.gold, fontWeight: 700 }}>{selectedUser.referralRewardsEarned || 0} month(s) free</span>
          </div>
        )}
      </div>

      {/* Leaderboard + Recent referrals side by side */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

        {/* Referral Leaderboard */}
        <div style={{ background: T.surface, borderRadius: 16, border: `1px solid ${T.border}`, padding: "20px 24px" }}>
          <div style={{ fontFamily: "'Fraunces',serif", fontSize: 16, fontWeight: 700, color: T.white, marginBottom: 14 }}>🏆 Referral Leaderboard</div>
          {loading ? (
            <div style={{ color: T.textMuted, fontSize: 13 }}>Loading...</div>
          ) : leaderboard.length === 0 ? (
            <div style={{ color: T.textMuted, fontSize: 13, textAlign: "center", padding: "20px 0" }}>No referrals yet — share referral links with your users to get started</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {leaderboard.map((r, i) => (
                <div key={r.email} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 10, background: i === 0 ? "rgba(212,168,67,0.06)" : T.surfaceAlt, border: `1px solid ${i === 0 ? T.gold + "33" : T.border}` }}>
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: i === 0 ? `linear-gradient(135deg,${T.gold},#B8912F)` : T.surface, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: i === 0 ? T.bg : T.textMuted, flexShrink: 0 }}>
                    {i + 1}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: T.white, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.name || r.email}</div>
                    <div style={{ fontSize: 10, color: T.textMuted }}>{r.email}</div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.green }}>{r.conversions} paid</div>
                    <div style={{ fontSize: 10, color: T.textMuted }}>{r.rewards} rewarded</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Referral Activity */}
        <div style={{ background: T.surface, borderRadius: 16, border: `1px solid ${T.border}`, padding: "20px 24px" }}>
          <div style={{ fontFamily: "'Fraunces',serif", fontSize: 16, fontWeight: 700, color: T.white, marginBottom: 14 }}>Recent Referral Activity</div>
          {loading ? (
            <div style={{ color: T.textMuted, fontSize: 13 }}>Loading...</div>
          ) : referrals.length === 0 ? (
            <div style={{ color: T.textMuted, fontSize: 13, textAlign: "center", padding: "20px 0" }}>No referral activity yet</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 340, overflowY: "auto" }}>
              {referrals.slice(0, 20).map(r => {
                const statusColor = r.status === "converted" ? T.green : r.status === "signup" ? T.blue : T.textMuted;
                const statusLabel = r.status === "converted" ? "Converted ✓" : r.status === "signup" ? "Signed Up" : "Clicked";
                return (
                  <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 8, background: T.surfaceAlt, border: `1px solid ${T.border}` }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: T.white, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {r.referrerEmail || "Unknown"} → {r.convertedEmail || r.signupEmail || "—"}
                      </div>
                      <div style={{ fontSize: 10, color: T.textMuted }}>{r.createdAt ? new Date(r.createdAt).toLocaleDateString("en-AE") : "—"}</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: statusColor, padding: "2px 8px", borderRadius: 6, background: statusColor + "12", border: `1px solid ${statusColor}33` }}>{statusLabel}</span>
                      {r.status === "converted" && !r.rewardGranted && (
                        <button type="button" onClick={() => grantReward(r)} disabled={grantLoading}
                          style={{ fontSize: 10, padding: "3px 10px", borderRadius: 6, background: "rgba(212,168,67,0.1)", border: `1px solid ${T.gold}`, color: T.gold, fontWeight: 700, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>
                          Grant Month
                        </button>
                      )}
                      {r.rewardGranted && <span style={{ fontSize: 10, color: T.green }}>🎁 Rewarded</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Manual conversion logger */}
      <div style={{ background: T.surface, borderRadius: 16, border: `1px solid ${T.border}`, padding: "20px 24px" }}>
        <div style={{ fontFamily: "'Fraunces',serif", fontSize: 16, fontWeight: 700, color: T.white, marginBottom: 4 }}>Log Manual Conversion</div>
        <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 14 }}>When a referral converts via Stripe or manually — log it here to trigger the reward</div>
        <ManualConversionForm users={users} T={T} onSubmit={createReferral} notify={notify} />
      </div>

      {/* How it works */}
      <div style={{ background: T.surface, borderRadius: 16, border: `1px solid ${T.border}`, padding: "20px 24px" }}>
        <div style={{ fontFamily: "'Fraunces',serif", fontSize: 16, fontWeight: 700, color: T.white, marginBottom: 14 }}>How the Referral Program Works</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
          {[
            ["1. Share", "User copies their referral link from their dashboard widget and shares it", T.blue],
            ["2. Click", "Friend clicks the link — a referral record is created in Firestore automatically", T.teal],
            ["3. Convert", "Friend signs up and upgrades to Pro — status updates to 'converted'", T.green],
            ["4. Reward", "Admin clicks 'Grant Month' — referrer gets 1 month free added to their subscription", T.gold],
          ].map(([step, desc, color]) => (
            <div key={step} style={{ padding: "14px 16px", borderRadius: 10, background: T.surfaceAlt, border: `1px solid ${color}33` }}>
              <div style={{ fontSize: 13, fontWeight: 700, color, marginBottom: 6 }}>{step}</div>
              <div style={{ fontSize: 11, color: T.textMuted, lineHeight: 1.5 }}>{desc}</div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

/* ─── Manual Conversion Form ────────────────────────────────────────────── */
const ManualConversionForm = ({ users, T, onSubmit, notify }) => {
  const [referrer, setReferrer] = React.useState("");
  const [convertedEmail, setConvertedEmail] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  const handleSubmit = async () => {
    if (!referrer || !convertedEmail) { notify("Select referrer and enter converted email", "error"); return; }
    setSubmitting(true);
    const user = users.find(u => (u.uid || u.id) === referrer);
    if (user) await onSubmit(user, convertedEmail);
    setReferrer(""); setConvertedEmail("");
    setSubmitting(false);
  };

  return (
    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1, minWidth: 200 }}>
        <label style={{ fontSize: 10, color: T.textMuted, fontWeight: 700, textTransform: "uppercase" }}>Referrer (who shared the link)</label>
        <select value={referrer} onChange={e => setReferrer(e.target.value)}
          style={{ padding: "10px 14px", background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8, color: T.white, fontSize: 13, fontFamily: "'Outfit',sans-serif" }}>
          <option value="">— Select referrer —</option>
          {users.filter(u => u.email).map(u => <option key={u.uid || u.id} value={u.uid || u.id}>{u.email}</option>)}
        </select>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1, minWidth: 200 }}>
        <label style={{ fontSize: 10, color: T.textMuted, fontWeight: 700, textTransform: "uppercase" }}>Converted User Email</label>
        <input type="email" value={convertedEmail} onChange={e => setConvertedEmail(e.target.value)} placeholder="newuser@email.com"
          style={{ padding: "10px 14px", background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8, color: T.white, fontSize: 13, fontFamily: "'Outfit',sans-serif" }} />
      </div>
      <button type="button" onClick={handleSubmit} disabled={submitting}
        style={{ padding: "10px 24px", background: `linear-gradient(135deg,${T.green},#059669)`, color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: submitting ? "not-allowed" : "pointer", fontFamily: "'Outfit',sans-serif", opacity: submitting ? 0.7 : 1 }}>
        {submitting ? "Saving..." : "Log Conversion"}
      </button>
    </div>
  );
};

/* ─── MARKET DATA EDITOR — S15 GAP FIX ─────────────────────────────────────
   Admin form to update marketData/global in Firestore.
   Covers: ValuStrat/Knight Frank figures, DLD totals, PPSF, YoY growth.
   Renders below AdminDataHealth in the data_health tab.
────────────────────────────────────────────────────────────────────────── */
const MarketDataEditor = ({ db, T, notify }) => {
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [form, setForm] = React.useState({
    period:             "FY 2025",
    totalMarketValue:   "AED 682.5B",
    totalTransactions:  "214,912",
    avgPricePsf:        "AED 1,689",
    avgPpsfNum:         "1689",
    yoyGrowthPct:       "+30.64%",
    /* Defaults refreshed 2026-07-30. These seed an editable admin form, so a
       stale default becomes a stale published figure the moment someone saves
       without checking. Off-plan was 62.6% and cash 87%; May 2026 figures are
       76% off-plan by volume and 64% cash. */
    offPlanShare:       "76%",
    avgPpsfYoy:         "19.8%",
    cashBuyersPct:      "64%",
    source:             "DLD Official + DXBinteract",
    lastVerifiedBy:     "",
  });

  // Load current values from Firestore
  React.useEffect(() => {
    const load = async () => {
      try {
        const snap = await getDoc(doc(db, "marketData", "global"));
        const data = snap.exists() ? snap.data() : null;
        if (data) setForm(prev => ({ ...prev, ...Object.fromEntries(Object.entries(data).filter(([k]) => k in prev)) }));
      } catch (e) { console.error("swallowed@ReferralTab.jsx:337", e); } finally { setLoading(false); }
    };
    load();
  }, [db]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        ...form,
        avgPpsfNum: parseFloat(form.avgPpsfNum) || 1689,
        updatedAt: new Date().toISOString(),
        updatedAtUAE: new Date().toLocaleString("en-AE", { timeZone: "Asia/Dubai" }),
        updatedBy: "admin",
        source: form.source,
      };
      await setDoc(doc(db, "marketData", "global"), payload, { merge: true });
      notify("✅ Market data updated — dashboard will refresh within 30 seconds", "success");
    } catch(e) {
      notify("❌ Save failed: " + e.message, "error");
    } finally { setSaving(false); }
  };

  const Field = ({ label, field, placeholder, hint }) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <label style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</label>
      <input
        type="text"
        value={form[field] || ""}
        onChange={e => setForm(prev => ({ ...prev, [field]: e.target.value }))}
        placeholder={placeholder}
        style={{ padding: "9px 12px", background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8, color: T.white, fontSize: 13, fontFamily: "'Outfit',sans-serif", outline: "none" }}
      />
      {hint && <span style={{ fontSize: 10, color: T.textMuted }}>{hint}</span>}
    </div>
  );

  if (loading) return null;

  return (
    <div style={{ marginTop: 32, background: T.surface, borderRadius: 16, border: `1px solid ${T.border}`, padding: "24px 28px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <div style={{ fontFamily: "'Fraunces',serif", fontSize: 18, fontWeight: 800, color: T.gold }}>Market Data Editor</div>
          <div style={{ fontSize: 12, color: T.textMuted, marginTop: 2 }}>Update marketData/global — ValuStrat · Knight Frank · DLD official figures</div>
        </div>
        <span style={{ fontSize: 9, padding: "3px 10px", borderRadius: 8, background: "rgba(212,168,67,0.1)", color: T.gold, fontWeight: 700, border: `1px solid ${T.border}` }}>ADMIN ONLY</span>
      </div>

      {/* Form grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 20 }}>
        <Field label="Period Label" field="period" placeholder="FY 2025" hint="e.g. FY 2025, H1 2026" />
        <Field label="Total Market Value" field="totalMarketValue" placeholder="AED 682.5B" hint="Shown on Overview + DLD tabs" />
        <Field label="Total Transactions" field="totalTransactions" placeholder="214,912" hint="DLD annual transaction count" />
        <Field label="Avg Price/sqft (display)" field="avgPricePsf" placeholder="AED 1,689" hint="With AED prefix + /sqft label" />
        <Field label="Avg PPSF (number only)" field="avgPpsfNum" placeholder="1689" hint="Used in Price History chart" />
        <Field label="YoY Value Growth" field="yoyGrowthPct" placeholder="+30.64%" hint="Market value growth YoY" />
        <Field label="Off-Plan Share" field="offPlanShare" placeholder="62.6%" hint="% of transactions off-plan" />
        <Field label="Avg PPSF YoY" field="avgPpsfYoy" placeholder="19.8%" hint="Price per sqft YoY growth" />
        <Field label="Cash Buyers %" field="cashBuyersPct" placeholder="64%" hint="% of buyers paying cash — 64% as of May 2026" />
        <Field label="Data Source" field="source" placeholder="DLD + DXBinteract + ValuStrat" hint="Attribution shown on dashboard" />
        <Field label="Verified By" field="lastVerifiedBy" placeholder="Your name" hint="Internal audit trail" />
      </div>

      {/* Warning note */}
      <div style={{ padding: "10px 14px", borderRadius: 8, background: "rgba(212,168,67,0.06)", border: `1px solid rgba(212,168,67,0.15)`, fontSize: 12, color: T.textMuted, marginBottom: 16 }}>
        ⚠️ These values appear on the Overview, DLD Volumes, Competitors, and Market tabs. Verify against DLD official data before saving. Changes take effect immediately for all users.
      </div>

      {/* Save button */}
      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        style={{ padding: "12px 28px", background: saving ? T.surfaceAlt : `linear-gradient(135deg, ${T.gold}, #B8912F)`, color: saving ? T.textMuted : T.bg, border: "none", borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: saving ? "not-allowed" : "pointer", fontFamily: "'Outfit',sans-serif" }}
      >
        {saving ? "Saving..." : "💾 Save to Firestore"}
      </button>
    </div>
  );
};

/* ─── ICONS (matching dashboard SVG style) ─── */
const I = {
  overview: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>,
  users: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  revenue: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
  leads: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>,
  analytics: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  data: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4.03 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5"/></svg>,
  logout: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  search: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  download: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  refresh: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>,
  trash: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>,
  check: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>,
  arrow: <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="18 15 12 9 6 15"/></svg>,
  bell: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
  projects: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>,
  chart: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/></svg>,
  yields: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
  whatsapp: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>,
  email: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22 6 12 13 2 6"/></svg>,
  phone: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>,
  rocket: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/></svg>,
  team: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  trophy: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 22V8a6 6 0 0 0-6-6h16a6 6 0 0 0-6 6v14"/></svg>,
  star: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  verify: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>,
  target: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>,
};

/* ─── CSS (exactly matching main dashboard design DNA) ─── */
const css = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700;9..144,900&display=swap');
* { margin: 0; padding: 0; box-sizing: border-box; }
html { font-size: 14px; }
body { background: ${T.bg}; color: ${T.textPrimary}; font-family: 'Outfit', sans-serif; }
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: rgba(212,168,67,0.2); border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: rgba(212,168,67,0.35); }
* { scrollbar-width: thin; scrollbar-color: rgba(212,168,67,0.15) transparent; }
select option { background: ${T.surface}; color: ${T.textPrimary}; }

@keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
@keyframes spin { to { transform: rotate(360deg); } }
@keyframes livePulse { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.2); opacity: 0.7; } }
@keyframes countUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
.live-pulse { animation: livePulse 2s ease-in-out infinite; }
.count-up { animation: countUp 0.3s ease-out; }
.fade-up { animation: fadeUp 0.5s ease-out forwards; opacity: 0; }
  @keyframes toastIn { 0% { opacity: 0; transform: translateY(20px); } 100% { opacity: 1; transform: translateY(0); } }
  @keyframes toastOut { 0% { opacity: 1; } 100% { opacity: 0; transform: translateY(-10px); } }
  .toast-notify { animation: toastIn 0.3s ease-out, toastOut 0.4s ease-in 2.4s forwards; }

.kpi-card {
  background: linear-gradient(135deg, ${T.card} 0%, ${T.surfaceAlt} 100%);
  border: 1px solid ${T.border};
  border-radius: 16px;
  padding: 20px 16px;
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
}
.kpi-card:hover {
  border-color: ${T.borderHover};
  transform: translateY(-2px);
  box-shadow: 0 8px 32px rgba(0,0,0,0.3), 0 0 0 1px rgba(212,168,67,0.1);
}
.kpi-card::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, ${T.gold}, transparent);
  opacity: 0;
  transition: opacity 0.3s;
}
.kpi-card:hover::before { opacity: 1; }

.chart-box {
  background: linear-gradient(180deg, ${T.card} 0%, rgba(4,9,15,0.95) 100%);
  border: 1px solid ${T.border};
  border-radius: 16px;
  padding: 20px;
  transition: border-color 0.3s;
}
.chart-box:hover { border-color: ${T.borderHover}; }

.sidebar-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 11px 16px;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-family: 'Outfit', sans-serif;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s ease;
  color: ${T.textSecondary};
  background: transparent;
  text-align: left;
  position: relative;
}
.sidebar-btn:hover { background: rgba(212,168,67,0.06); color: ${T.white}; }
.sidebar-btn.active {
  background: linear-gradient(135deg, rgba(212,168,67,0.12), rgba(212,168,67,0.04));
  color: ${T.gold};
  font-weight: 600;
}
.sidebar-btn.active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 60%;
  background: ${T.gold};
  border-radius: 0 3px 3px 0;
}

.mobile-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.6);
  backdrop-filter: blur(4px);
  z-index: 90;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.3s;
}
.mobile-overlay.open { opacity: 1; pointer-events: auto; }

@media (max-width: 768px) {
  .admin-sidebar { transform: translateX(-100%); position: fixed !important; z-index: 100; }
  .admin-sidebar.open { transform: translateX(0); }
  .admin-main { margin-left: 0 !important; }
  .admin-topbar { left: 0 !important; }
  .admin-mobile-btn { display: flex !important; }
  .kpi-grid-4 { grid-template-columns: 1fr 1fr !important; }
  .kpi-grid-6 { grid-template-columns: 1fr 1fr !important; }
  .kpi-grid-overview { grid-template-columns: repeat(2, 1fr) !important; }
  .charts-row-overview { grid-template-columns: 1fr !important; }
  .chart-grid-2 { grid-template-columns: 1fr !important; }
  .chart-grid-3 { grid-template-columns: 1fr !important; }
  .table-scroll { overflow-x: auto; -webkit-overflow-scrolling: touch; }
  .data-sub-tabs { flex-direction: column !important; }
  .community-grid { grid-template-columns: 1fr !important; }
  .users-table-desktop { display: none !important; }
  .users-table-mobile { display: flex !important; }
  .users-kpi-grid { grid-template-columns: 1fr 1fr !important; }
}
@media (max-width: 480px) {
  .kpi-grid-4 { grid-template-columns: 1fr !important; }
  .kpi-grid-6 { grid-template-columns: 1fr !important; }
  .kpi-grid-overview { grid-template-columns: 1fr 1fr !important; }
  .charts-row-overview { grid-template-columns: 1fr !important; }
  .edit-grid-3 { grid-template-columns: 1fr !important; }
  .users-kpi-grid { grid-template-columns: 1fr 1fr !important; }
}
@keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
@keyframes fadeBackdrop { from { opacity: 0; } to { opacity: 1; } }
.drawer-panel { animation: slideIn 0.32s cubic-bezier(0.16,1,0.3,1) forwards; }

@keyframes slideUp { from { transform: translateY(16px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
.users-table-mobile { display: none; flex-direction: column; gap: 10px; }
.risk-btn-wrap:hover .risk-tooltip { opacity: 1 !important; pointer-events: auto !important; }

`;

/* ─── CUSTOM TOOLTIP (matching dashboard) ─── */

export default ReferralTab;
