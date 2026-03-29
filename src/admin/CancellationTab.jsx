import React from "react";
import { collection, getDocs } from "firebase/firestore";

export default function CancellationTab({ T, I, db, notify, users }) {
  if (!window._cancelLoaded) {
    window._cancelLoaded = true;
    getDocs(collection(db, "cancellations"))
      .then(snap => { const list = []; snap.forEach(d => list.push({ id: d.id, ...d.data() })); list.sort((a, b) => new Date(b.cancelledAt||0) - new Date(a.cancelledAt||0)); window._cancelData = list; })
      .catch(() => { window._cancelData = []; });
  }
  const realCancellations = window._cancelData || [];
  const reasonMap = { too_expensive: { reason: "Too expensive", color: T.red }, not_using: { reason: "Not using enough", color: T.orange }, missing_features: { reason: "Missing features", color: T.purple }, found_alternative: { reason: "Found alternative", color: T.blue }, technical_issues: { reason: "Technical issues", color: T.teal }, other: { reason: "Other", color: T.textMuted } };
  const reasonCounts = {};
  realCancellations.forEach(c => { const key = c.reason || "other"; reasonCounts[key] = (reasonCounts[key] || 0) + 1; });
  const totalReal = realCancellations.length;
  const reasons = Object.entries(reasonMap).map(([key, meta]) => ({ ...meta, count: reasonCounts[key] || 0, percent: totalReal > 0 ? Math.round(((reasonCounts[key]||0)/totalReal)*100) : 0 })).filter(r => r.count > 0);
  const now = new Date();
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonth = new Date(now.getFullYear(), now.getMonth()-1, 1);
  const churnedThisMonth = realCancellations.filter(c => new Date(c.cancelledAt||0) >= thisMonth).length;
  const churnedLastMonth = realCancellations.filter(c => { const d = new Date(c.cancelledAt||0); return d >= lastMonth && d < thisMonth; }).length;
  const totalPaid = users.filter(u => ["pro","enterprise","pro_trial"].includes(u.tier)).length;
  const churnRate = totalPaid > 0 ? ((churnedThisMonth/totalPaid)*100).toFixed(1) : 0;
  const fourteenDaysAgo = new Date(now.getTime() - 14*24*60*60*1000);
  const atRiskUsers = users.filter(u => { if (!["pro","enterprise"].includes(u.tier)) return false; if (!u.lastLoginAt) return true; return new Date(u.lastLoginAt) < fourteenDaysAgo; });
  const churnTrend = [];
  for (let m = 5; m >= 0; m--) {
    const start = new Date(now.getFullYear(), now.getMonth()-m, 1);
    const end = new Date(now.getFullYear(), now.getMonth()-m+1, 0, 23, 59, 59);
    const label = start.toLocaleDateString("en-AE", { month: "short" });
    const churned = realCancellations.filter(c => { const d = new Date(c.cancelledAt||0); return d >= start && d <= end; }).length;
    churnTrend.push({ month: label, churned });
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div className="fade-up" style={{ display: "flex", alignItems: "center", borderRadius: 14, background: T.surface, border: `1px solid ${T.border}`, overflow: "hidden" }}>
        <button type="button" onClick={() => { window._cancelLoaded = false; window._cancelData = null; notify("Refreshing..."); setTimeout(() => window.location.reload(), 300); }} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, padding: "14px 16px", background: T.goldGlow, border: "none", borderRight: `1px solid ${T.border}`, color: T.gold, cursor: "pointer", fontFamily: "'Outfit',sans-serif", fontWeight: 600, flexShrink: 0 }}>{I.refresh}</button>
        {[
          { label: "Total Cancellations", value: totalReal, color: T.textSecondary },
          { label: "This Month", value: churnedThisMonth, color: churnedThisMonth > 0 ? T.red : T.green },
          { label: "Last Month", value: churnedLastMonth, color: T.textSecondary },
          { label: "Churn Rate", value: `${churnRate}%`, color: parseFloat(churnRate) > 5 ? T.red : T.green },
          { label: "At Risk (14d)", value: atRiskUsers.length, color: atRiskUsers.length > 3 ? T.orange : T.green },
        ].map((item, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", padding: "10px 18px", borderRight: `1px solid ${T.border}`, flexShrink: 0 }}>
            <span style={{ fontSize: 9, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: 1 }}>{item.label}</span>
            <span style={{ fontSize: 18, fontWeight: 900, color: item.color, fontFamily: "'Fraunces',serif", lineHeight: 1.2 }}>{item.value}</span>
          </div>
        ))}
      </div>
      {totalReal === 0 ? (
        <div style={{ padding: 48, textAlign: "center", background: T.surface, borderRadius: 14, border: `1px solid ${T.border}` }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: T.green, marginBottom: 8 }}>No Cancellations Yet</div>
          <div style={{ fontSize: 13, color: T.textMuted, lineHeight: 1.6, maxWidth: 400, margin: "0 auto" }}>When users cancel their subscription via the profile modal, their exit survey responses will appear here automatically.</div>
          {atRiskUsers.length > 0 && <div style={{ marginTop: 20, padding: "12px 20px", background: T.surfaceAlt, borderRadius: 10, border: `1px solid ${T.border}`, display: "inline-block", fontSize: 12, color: T.textSecondary }}>At-risk paid users with no login in 14+ days: <strong style={{ color: T.orange }}>{atRiskUsers.length}</strong></div>}
        </div>
      ) : (<>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <div style={{ background: T.surface, borderRadius: 14, border: `1px solid ${T.border}`, padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: T.white, marginBottom: 4 }}>Exit Survey Reasons</div>
            <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 16 }}>{totalReal} real responses</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {reasons.sort((a,b) => b.count - a.count).map((r, i) => (
                <div key={i}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}><span style={{ fontSize: 12, color: T.textSecondary }}>{r.reason}</span><span style={{ fontSize: 12, fontWeight: 700, color: r.color }}>{r.count} ({r.percent}%)</span></div>
                  <div style={{ height: 6, borderRadius: 3, background: T.surfaceAlt }}><div style={{ height: "100%", width: `${r.percent}%`, background: r.color, borderRadius: 3 }} /></div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ background: T.surface, borderRadius: 14, border: `1px solid ${T.border}`, padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: T.white, marginBottom: 4 }}>Monthly Churn</div>
            <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 16 }}>Last 6 months</div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 100 }}>
              {churnTrend.map((m, i) => {
                const maxVal = Math.max(...churnTrend.map(x => x.churned), 1);
                return (
                  <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                    <div style={{ fontSize: 10, color: T.textMuted }}>{m.churned || ""}</div>
                    <div style={{ width: "100%", height: `${Math.max((m.churned/maxVal)*100, 4)}%`, background: m.churned > 0 ? T.red : T.surfaceAlt, borderRadius: "4px 4px 0 0", minHeight: 4 }} />
                    <div style={{ fontSize: 9, color: T.textMuted }}>{m.month}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <div style={{ background: T.surface, borderRadius: 14, border: `1px solid ${T.border}`, padding: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: T.white, marginBottom: 16 }}>Recent Cancellations</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {realCancellations.slice(0, 10).map((c, i) => (
              <div key={i} style={{ padding: "12px 16px", background: T.surfaceAlt, borderRadius: 10, border: `1px solid ${T.border}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: c.feedback ? 6 : 0 }}>
                  <div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: T.white }}>{c.userEmail || c.userId || "Anonymous"}</span>
                    <span style={{ marginLeft: 8, fontSize: 10, padding: "2px 8px", borderRadius: 6, background: "rgba(239,68,68,0.12)", color: T.red, fontWeight: 700 }}>{reasonMap[c.reason]?.reason || c.reason || "Unknown"}</span>
                    <span style={{ marginLeft: 6, fontSize: 10, color: T.textMuted }}>was {c.previousTier || "-"}</span>
                  </div>
                  <span style={{ fontSize: 11, color: T.textMuted }}>{c.cancelledAt ? new Date(c.cancelledAt).toLocaleDateString("en-AE") : "-"}</span>
                </div>
                {c.feedback && <div style={{ fontSize: 12, color: T.textSecondary, fontStyle: "italic" }}>"{c.feedback}"</div>}
              </div>
            ))}
          </div>
        </div>
      </>)}
      {atRiskUsers.length > 0 && (
        <div style={{ background: T.surface, borderRadius: 14, border: "1px solid rgba(245,158,11,0.3)", padding: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: T.orange, marginBottom: 4 }}>At-Risk Users ({atRiskUsers.length})</div>
          <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 14 }}>Paid users with no login in 14+ days</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {atRiskUsers.slice(0, 5).map((u, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: T.surfaceAlt, borderRadius: 8, border: `1px solid ${T.border}` }}>
                <div><div style={{ fontSize: 13, fontWeight: 600, color: T.white }}>{u.name || u.email}</div><div style={{ fontSize: 11, color: T.textMuted }}>{u.tier}</div></div>
                <div style={{ fontSize: 11, color: T.orange }}>{u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString("en-AE") : "Never logged in"}</div>
              </div>
            ))}
            {atRiskUsers.length > 5 && <div style={{ fontSize: 11, color: T.textMuted, textAlign: "center" }}>+{atRiskUsers.length - 5} more</div>}
          </div>
        </div>
      )}
    </div>
  );
}