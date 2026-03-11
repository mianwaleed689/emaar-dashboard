import React from "react";
import { getDocs, collection } from "firebase/firestore";
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import { T } from "../../../styles/theme";

/**
 * AdminRevenueTab — Full revenue dashboard: MRR/ARR, LTV, forecast, trial
 * pipeline, conversion funnel, paying-customers table, milestones, Paddle log.
 *
 * Props:
 *   users, auditLog
 *   stats          — { paid, pro, enterprise, proTrial, total }
 *   mrr, arr, netMRR, newMRRThisMonth, churnedMRR, arpu, arpuAll
 *   trialConversion, everTrialled
 *   churnThisMonth — array of churned users this month
 *   trialDaysLeft  — fn(user) → number
 *   now            — Date
 *   setTab, setTierFilter, setPendingOpenUid
 *   fetchUsers, fetchAuditLog
 *   notify, logAudit, db
 *   CustomTooltip  — recharts tooltip component
 *   I              — icons object
 */
const AdminRevenueTab = ({
  users, auditLog,
  stats,
  mrr, arr, netMRR, newMRRThisMonth, churnedMRR, arpu, arpuAll,
  trialConversion, everTrialled,
  churnThisMonth,
  trialDaysLeft,
  now,
  setTab, setTierFilter, setPendingOpenUid,
  fetchUsers, fetchAuditLog,
  notify, logAudit, db,
  CustomTooltip,
  I,
}) => {
  // ── CHURN RATE ──
  const churnRate = (() => {
    const base = stats.paid + churnThisMonth.length;
    return base > 0 ? parseFloat(((churnThisMonth.length / base) * 100).toFixed(1)) : 0;
  })();

  // ── LTV BY TIER ──
  const proLTV     = churnRate > 0 ? Math.round(99  / (churnRate / 100)) : 99  * 24;
  const entLTV     = churnRate > 0 ? Math.round(499 / (churnRate / 100)) : 499 * 24;
  const blendedLTV = stats.paid > 0 ? Math.round((stats.pro * proLTV + stats.enterprise * entLTV) / stats.paid) : 0;

  // ── MRR HISTORY (6 actual + 3 projected) ──
  const revHistory = (() => {
    const months = [];
    for (let m = 5; m >= 0; m--) {
      const d   = new Date(now.getFullYear(), now.getMonth() - m, 1);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
      const lbl = d.toLocaleDateString("en-AE", { month:"short", year:"2-digit" });
      let pro = 0, ent = 0;
      users.forEach(u => {
        if (new Date(u.createdAt || 0) > end) return;
        const changes = auditLog
          .filter(l => l.uid === u.uid && l.action === "tier_change" && new Date(l.changedAt) <= end)
          .sort((a, b) => new Date(b.changedAt) - new Date(a.changedAt));
        const tier = changes.length > 0 ? changes[0].to : (m === 0 ? u.tier : "free");
        if (tier === "pro") pro++;
        else if (tier === "enterprise") ent++;
      });
      months.push({ label:lbl, mrr:pro*99+ent*499, pro:pro*99, enterprise:ent*499, actual:true });
    }
    const lastMRR    = months[months.length - 1]?.mrr || 0;
    const prevMRR    = months[months.length - 2]?.mrr || 0;
    const growthRate = prevMRR > 0 ? Math.min((lastMRR - prevMRR) / prevMRR, 0.3) : 0.1;
    for (let f = 1; f <= 3; f++) {
      const d   = new Date(now.getFullYear(), now.getMonth() + f, 1);
      const lbl = d.toLocaleDateString("en-AE", { month:"short", year:"2-digit" });
      months.push({ label:lbl, projected:Math.round(lastMRR * Math.pow(1 + growthRate, f)), actual:false });
    }
    return months;
  })();

  const mrrGrowthPct = (() => {
    const actual = revHistory.filter(d => d.actual);
    const curr   = actual[actual.length - 1]?.mrr || 0;
    const prev   = actual[actual.length - 2]?.mrr || 0;
    if (!prev) return null;
    return Math.round(((curr - prev) / prev) * 100);
  })();

  // ── TRIAL PIPELINE BUCKETS ──
  const pipeline = (() => {
    const buckets = [
      { label:"1–2 days", color:T.red,     min:0, max:2,   users:[] },
      { label:"3–5 days", color:"#F59E0B", min:3, max:5,   users:[] },
      { label:"6–7 days", color:T.gold,    min:6, max:7,   users:[] },
      { label:"8+ days",  color:T.teal,    min:8, max:999, users:[] },
    ];
    users.filter(u => u.tier === "pro_trial").forEach(u => {
      const d = trialDaysLeft(u);
      if (d === null || d < 0) return;
      const b = buckets.find(bk => d >= bk.min && d <= bk.max);
      if (b) b.users.push({ ...u, daysLeft:d });
    });
    return buckets.map(b => ({ ...b, count:b.users.length, value:b.users.length * 99 }));
  })();
  const totalPipeline = pipeline.reduce((s, b) => s + b.value, 0);

  // ── PAYING USERS TABLE ──
  const payingUsers = [...users]
    .filter(u => u.tier === "pro" || u.tier === "enterprise")
    .sort((a, b) => new Date(b.createdAt||0) - new Date(a.createdAt||0));

  // ── MILESTONES ──
  const milestones = [1000, 5000, 10000, 50000, 100000].map(target => ({
    target,
    label: `AED ${target >= 1000 ? (target/1000).toFixed(0)+"K" : target}`,
    reached: mrr >= target,
    pct: Math.min(100, Math.round((mrr / target) * 100)),
    usersNeeded: mrr >= target ? 0 : Math.ceil((target - mrr) / (arpu || 99)),
  }));
  const nextMilestone = milestones.find(m => !m.reached);

  return (
    <>
      {/* ══ SECTION 1 — REVENUE HEALTH TOPBAR ══ */}
      <div style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 18px", borderRadius:14, background:T.surface, border:`1px solid ${T.border}`, marginBottom:20, flexWrap:"wrap" }}>
        <button type="button" onClick={() => { fetchUsers(); fetchAuditLog(); window._revenuePaymentsLoaded = false; notify("Revenue refreshed"); }}
          style={{ display:"flex", alignItems:"center", gap:5, fontSize:11, padding:"6px 12px", borderRadius:8, border:`1px solid ${T.gold}`, background:T.goldGlow, color:T.gold, cursor:"pointer", fontFamily:"'Outfit',sans-serif", fontWeight:600, marginRight:8 }}>
          {I.refresh}
        </button>
        <div style={{ display:"flex", alignItems:"center", gap:8, paddingRight:14, borderRight:`1px solid ${T.border}`, flexShrink:0 }}>
          <div style={{ width:8, height:8, borderRadius:"50%", background:mrr>0?T.green:T.textMuted, boxShadow:mrr>0?`0 0 6px ${T.green}`:"none" }} />
          <span style={{ fontSize:12, fontWeight:700, color:mrr>0?T.green:T.textMuted }}>{mrr>0?"Generating Revenue":"Pre-Revenue"}</span>
        </div>
        {[
          { label:"MRR",       value:`AED ${mrr.toLocaleString()}`,                            color:T.green },
          { label:"ARR",       value:`AED ${arr.toLocaleString()}`,                            color:T.teal  },
          { label:"Net MRR",   value:`${netMRR>=0?"+":""}AED ${netMRR.toLocaleString()}`,      color:netMRR>=0?T.green:T.red },
          { label:"Churn Rate",value:`${churnRate}%`,                                           color:churnRate===0?T.green:churnRate<5?T.gold:T.red },
          { label:"ARPU",      value:`AED ${arpu}`,                                             color:T.gold  },
          mrrGrowthPct !== null ? { label:"MoM Growth", value:`${mrrGrowthPct>=0?"+":""}${mrrGrowthPct}%`, color:mrrGrowthPct>=0?T.green:T.red } : null,
        ].filter(Boolean).map((item, i) => (
          <div key={i} style={{ display:"flex", flexDirection:"column", paddingRight:14, borderRight:`1px solid ${T.border}`, flexShrink:0 }}>
            <span style={{ fontSize:9, fontWeight:700, color:T.textMuted, textTransform:"uppercase", letterSpacing:1 }}>{item.label}</span>
            <span style={{ fontSize:13, fontWeight:800, color:item.color, fontFamily:"'Fraunces',serif" }}>{item.value}</span>
          </div>
        ))}
        {nextMilestone && (
          <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:8, flexShrink:0 }}>
            <span style={{ fontSize:10, color:T.textMuted }}>Next milestone:</span>
            <span style={{ fontSize:11, fontWeight:700, color:T.gold }}>{nextMilestone.label}</span>
            <div style={{ width:60, height:4, background:T.surfaceAlt, borderRadius:2, overflow:"hidden" }}>
              <div style={{ width:`${nextMilestone.pct}%`, height:"100%", background:T.gold, borderRadius:2 }} />
            </div>
            <span style={{ fontSize:10, color:T.textMuted }}>{nextMilestone.pct}%</span>
          </div>
        )}
      </div>

      {/* ══ SECTION 2 — MRR MOVEMENT + BREAKDOWN + LTV ══ */}
      <div style={{ fontSize:10, fontWeight:700, color:T.textMuted, textTransform:"uppercase", letterSpacing:1.5, marginBottom:10 }}>Revenue Breakdown</div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:14, marginBottom:20 }}>

        {/* MRR Movement */}
        <div style={{ background:T.surface, borderRadius:14, border:`1px solid ${T.border}`, padding:20 }}>
          <div style={{ fontSize:10, fontWeight:700, color:T.textMuted, textTransform:"uppercase", letterSpacing:1.2, marginBottom:16 }}>MRR Movement — This Month</div>
          {[
            { label:"Starting MRR", value:mrr - netMRR,    color:T.textSecondary },
            { label:"New MRR",      value:newMRRThisMonth,  color:T.green,  arrow:"↑" },
            { label:"Churned MRR",  value:-churnedMRR,      color:T.red,    arrow:"↓" },
            { label:"Net MRR",      value:mrr,              color:netMRR>=0?T.green:T.red, bold:true },
          ].map((row, i) => (
            <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 0", borderBottom:i<3?`1px solid ${T.border}`:"none" }}>
              <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                {row.arrow && <span style={{ fontSize:11, color:row.color, fontWeight:700 }}>{row.arrow}</span>}
                {!row.arrow && <div style={{ width:11 }} />}
                <span style={{ fontSize:12, color:row.bold?T.white:T.textMuted, fontWeight:row.bold?700:400 }}>{row.label}</span>
              </div>
              <span style={{ fontSize:13, fontWeight:700, color:row.color, fontFamily:"'Fraunces',serif" }}>
                {row.value >= 0 ? "+" : ""}AED {Math.abs(row.value).toLocaleString()}
              </span>
            </div>
          ))}
        </div>

        {/* Revenue by Plan */}
        <div style={{ background:T.surface, borderRadius:14, border:`1px solid ${T.border}`, padding:20 }}>
          <div style={{ fontSize:10, fontWeight:700, color:T.textMuted, textTransform:"uppercase", letterSpacing:1.2, marginBottom:16 }}>Revenue by Plan</div>
          {[
            { label:"Pro",        count:stats.pro,       revenue:stats.pro*99,       color:T.green, price:"AED 99/mo"  },
            { label:"Enterprise", count:stats.enterprise, revenue:stats.enterprise*499, color:T.teal,  price:"AED 499/mo" },
          ].map((row, i) => {
            const pct = mrr > 0 ? Math.round((row.revenue / mrr) * 100) : 0;
            return (
              <div key={i} style={{ marginBottom:18 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
                  <div>
                    <span style={{ fontSize:12, fontWeight:600, color:T.white }}>{row.label}</span>
                    <span style={{ fontSize:10, color:T.textMuted, marginLeft:6 }}>{row.price}</span>
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <div style={{ fontSize:13, fontWeight:800, color:row.color, fontFamily:"'Fraunces',serif" }}>AED {row.revenue.toLocaleString()}</div>
                    <div style={{ fontSize:10, color:T.textMuted }}>{row.count} users · {pct}%</div>
                  </div>
                </div>
                <div style={{ height:6, background:T.surfaceAlt, borderRadius:3, overflow:"hidden" }}>
                  <div style={{ width:`${pct}%`, height:"100%", background:row.color, borderRadius:3, transition:"width 0.6s ease" }} />
                </div>
              </div>
            );
          })}
          <div style={{ paddingTop:14, borderTop:`1px solid ${T.border}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <span style={{ fontSize:11, color:T.textMuted }}>Total MRR</span>
            <span style={{ fontSize:15, fontWeight:800, color:T.green, fontFamily:"'Fraunces',serif" }}>AED {mrr.toLocaleString()}</span>
          </div>
          <div style={{ marginTop:10, display:"flex", justifyContent:"space-between" }}>
            <span style={{ fontSize:11, color:T.textMuted, cursor:"pointer" }} onClick={() => { setTab("users"); setTierFilter("Pro"); }}>View Pro users →</span>
            <span style={{ fontSize:11, color:T.textMuted, cursor:"pointer" }} onClick={() => { setTab("users"); setTierFilter("Enterprise"); }}>View Enterprise →</span>
          </div>
        </div>

        {/* LTV */}
        <div style={{ background:T.surface, borderRadius:14, border:`1px solid ${T.border}`, padding:20 }}>
          <div style={{ fontSize:10, fontWeight:700, color:T.textMuted, textTransform:"uppercase", letterSpacing:1.2, marginBottom:4 }}>Lifetime Value</div>
          <div style={{ fontSize:10, color:T.textMuted, marginBottom:16 }}>Estimated revenue per customer</div>
          {[
            { label:"Pro LTV",        value:proLTV,     color:T.green, note:churnRate>0?`Based on ${churnRate}% churn`:"24-mo estimate" },
            { label:"Enterprise LTV", value:entLTV,     color:T.teal,  note:churnRate>0?`Based on ${churnRate}% churn`:"24-mo estimate" },
            { label:"Blended LTV",    value:blendedLTV, color:T.gold,  note:"Weighted average", bold:true },
          ].map((row, i) => (
            <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 0", borderBottom:i<2?`1px solid ${T.border}`:"none" }}>
              <div>
                <div style={{ fontSize:12, color:row.bold?T.white:T.textSecondary, fontWeight:row.bold?700:400 }}>{row.label}</div>
                <div style={{ fontSize:10, color:T.textMuted, marginTop:2 }}>{row.note}</div>
              </div>
              <span style={{ fontSize:14, fontWeight:800, color:row.color, fontFamily:"'Fraunces',serif" }}>AED {row.value.toLocaleString()}</span>
            </div>
          ))}
          {churnRate === 0 && (
            <div style={{ marginTop:12, padding:"8px 10px", borderRadius:8, background:`${T.gold}08`, border:`1px solid ${T.gold}20`, fontSize:10, color:T.textMuted }}>
              No churn data yet — LTV shown as 24-month estimate.
            </div>
          )}
        </div>
      </div>

      {/* ══ SECTION 3 — MRR HISTORY + FORECAST ══ */}
      <div style={{ fontSize:10, fontWeight:700, color:T.textMuted, textTransform:"uppercase", letterSpacing:1.5, marginBottom:10 }}>MRR History & Forecast</div>
      <div style={{ background:T.surface, borderRadius:14, border:`1px solid ${T.border}`, padding:20, marginBottom:20 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:16, flexWrap:"wrap", gap:8 }}>
          <div>
            <div style={{ fontSize:13, fontWeight:700, color:T.white }}>MRR — 6 Months Actual + 3 Month Forecast</div>
            <div style={{ fontSize:11, color:T.textMuted, marginTop:2 }}>Derived from user tier history · Forecast based on current growth rate</div>
          </div>
          <div style={{ display:"flex", gap:14 }}>
            {[["Actual MRR", T.green], ["Projected", T.gold]].map(([name, color]) => (
              <span key={name} style={{ fontSize:10, color:T.textSecondary, display:"flex", alignItems:"center", gap:5 }}>
                <span style={{ width:16, height:2, background:color, display:"inline-block", borderRadius:1 }} />{name}
              </span>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={revHistory} margin={{ left:0, right:10 }}>
            <defs>
              <linearGradient id="gRevAct" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={T.green} stopOpacity={0.2} />
                <stop offset="100%" stopColor={T.green} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gRevProj" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={T.gold} stopOpacity={0.15} />
                <stop offset="100%" stopColor={T.gold} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="label" tick={{ fill:T.textMuted, fontSize:10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill:T.textMuted, fontSize:10 }} axisLine={false} tickLine={false} allowDecimals={false} width={50} />
            <Tooltip content={<CustomTooltip />} formatter={v => v ? [`AED ${v.toLocaleString()}`, ""] : ["-", ""]} />
            <Area type="monotone" dataKey="mrr"       stroke={T.green} fill="url(#gRevAct)"  strokeWidth={2.5} name="Actual MRR" connectNulls={false} />
            <Area type="monotone" dataKey="projected" stroke={T.gold}  fill="url(#gRevProj)" strokeWidth={2} strokeDasharray="5 3" name="Projected" connectNulls={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* ══ SECTION 4 — TRIAL PIPELINE + CONVERSION FUNNEL ══ */}
      <div style={{ fontSize:10, fontWeight:700, color:T.textMuted, textTransform:"uppercase", letterSpacing:1.5, marginBottom:10 }}>Trial Pipeline</div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:20 }}>

        {/* Pipeline by urgency */}
        <div style={{ background:T.surface, borderRadius:14, border:`1px solid ${T.border}`, padding:20 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
            <div>
              <div style={{ fontSize:13, fontWeight:700, color:T.white }}>Active Trial Pipeline</div>
              <div style={{ fontSize:11, color:T.textMuted, marginTop:2 }}>Potential MRR if all convert</div>
            </div>
            <div style={{ textAlign:"right" }}>
              <div style={{ fontSize:18, fontWeight:800, color:T.gold, fontFamily:"'Fraunces',serif" }}>AED {totalPipeline.toLocaleString()}</div>
              <div style={{ fontSize:10, color:T.textMuted }}>{stats.proTrial} active trials</div>
            </div>
          </div>
          {pipeline.map((bucket, i) => (
            <div key={i} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 0", borderBottom:i<pipeline.length-1?`1px solid ${T.border}`:"none" }}>
              <div style={{ width:10, height:10, borderRadius:"50%", background:bucket.color, flexShrink:0 }} />
              <div style={{ flex:1 }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                  <span style={{ fontSize:12, color:T.textSecondary }}>{bucket.label}</span>
                  <span style={{ fontSize:12, fontWeight:700, color:bucket.color }}>{bucket.count} users · AED {bucket.value.toLocaleString()}</span>
                </div>
                <div style={{ height:3, background:T.surfaceAlt, borderRadius:2, overflow:"hidden" }}>
                  <div style={{ width:stats.proTrial>0?`${(bucket.count/stats.proTrial)*100}%`:"0%", height:"100%", background:bucket.color, borderRadius:2, transition:"width 0.6s ease" }} />
                </div>
              </div>
              {bucket.users.slice(0, 2).map((u, ui) => (
                <div key={ui} onClick={() => { setTab("users"); setPendingOpenUid(u.uid||u.id); }}
                  style={{ width:26, height:26, borderRadius:7, background:`${bucket.color}20`, border:`1px solid ${bucket.color}40`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, fontWeight:800, color:bucket.color, cursor:"pointer", flexShrink:0 }}
                  title={u.name||u.email}>
                  {(u.name||u.email||"?")[0].toUpperCase()}
                </div>
              ))}
              {bucket.users.length > 2 && <span style={{ fontSize:10, color:T.textMuted, flexShrink:0 }}>+{bucket.users.length-2}</span>}
            </div>
          ))}
        </div>

        {/* Conversion Funnel */}
        <div style={{ background:T.surface, borderRadius:14, border:`1px solid ${T.border}`, padding:20 }}>
          <div style={{ fontSize:13, fontWeight:700, color:T.white, marginBottom:4 }}>Conversion Funnel</div>
          <div style={{ fontSize:11, color:T.textMuted, marginBottom:16 }}>Signup → Trial → Paid</div>
          {[
            { label:"Total Signups",     value:stats.total,   color:T.textSecondary, filter:null       },
            { label:"Started Trial",     value:everTrialled,  color:T.gold,          filter:"Pro Trial" },
            { label:"Converted to Paid", value:stats.paid,    color:T.green,         filter:"Pro"       },
          ].map((step, i) => {
            const pct  = stats.total > 0 ? Math.round((step.value / stats.total) * 100) : 0;
            const conv = i > 0 ? Math.round((step.value / (i===1 ? stats.total : everTrialled||1)) * 100) : 100;
            return (
              <div key={i} style={{ marginBottom:16 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:7, cursor:step.filter?"pointer":"default" }}
                    onClick={() => step.filter && (setTab("users"), setTierFilter(step.filter))}>
                    <div style={{ width:6, height:6, borderRadius:"50%", background:step.color }} />
                    <span style={{ fontSize:12, color:T.textSecondary }}>{step.label}</span>
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    {i > 0 && <span style={{ fontSize:10, color:conv>=30?T.green:T.red, fontWeight:700 }}>{conv}% from prev</span>}
                    <span style={{ fontSize:13, fontWeight:800, color:step.color, fontFamily:"'Fraunces',serif" }}>{step.value}</span>
                  </div>
                </div>
                <div style={{ height:6, background:T.surfaceAlt, borderRadius:3, overflow:"hidden" }}>
                  <div style={{ width:`${Math.max(pct, step.value>0?2:0)}%`, height:"100%", background:step.color, borderRadius:3, transition:"width 0.8s ease", opacity:0.85 }} />
                </div>
              </div>
            );
          })}
          <div style={{ paddingTop:14, borderTop:`1px solid ${T.border}`, display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <div>
              <div style={{ fontSize:9, color:T.textMuted, textTransform:"uppercase", letterSpacing:1, fontWeight:700 }}>Overall Conv.</div>
              <div style={{ fontSize:18, fontWeight:800, color:stats.paid>0?T.green:T.textMuted, fontFamily:"'Fraunces',serif" }}>
                {stats.total > 0 ? Math.round((stats.paid / stats.total) * 100) : 0}%
              </div>
            </div>
            <div>
              <div style={{ fontSize:9, color:T.textMuted, textTransform:"uppercase", letterSpacing:1, fontWeight:700 }}>Trial → Paid</div>
              <div style={{ fontSize:18, fontWeight:800, color:trialConversion>=25?T.green:T.gold, fontFamily:"'Fraunces',serif" }}>{trialConversion}%</div>
              <div style={{ fontSize:9, color:T.textMuted }}>{trialConversion>=25?"↑ Above":"↓ Below"} 25% SaaS avg</div>
            </div>
          </div>
        </div>
      </div>

      {/* ══ SECTION 5 — PAYING CUSTOMERS TABLE ══ */}
      <div style={{ fontSize:10, fontWeight:700, color:T.textMuted, textTransform:"uppercase", letterSpacing:1.5, marginBottom:10 }}>Paying Customers</div>
      <div style={{ background:T.surface, borderRadius:14, border:`1px solid ${T.border}`, overflow:"hidden", marginBottom:20 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"16px 20px", borderBottom:`1px solid ${T.border}` }}>
          <div>
            <div style={{ fontSize:13, fontWeight:700, color:T.white }}>Revenue per Customer</div>
            <div style={{ fontSize:11, color:T.textMuted, marginTop:2 }}>{payingUsers.length} paying users · AED {mrr.toLocaleString()} total MRR</div>
          </div>
          <div style={{ display:"flex", gap:8, alignItems:"center" }}>
            <button type="button" onClick={() => {
              const rows = [["Name","Email","Plan","MRR (AED)","LTV Est. (AED)","Customer Since"]];
              payingUsers.forEach(u => {
                const isEnt = u.tier === "enterprise";
                rows.push([u.name||"", u.email||"", isEnt?"Enterprise":"Pro", isEnt?499:99, isEnt?entLTV:proLTV, u.createdAt?new Date(u.createdAt).toLocaleDateString("en-AE"):""]);
              });
              const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(",")).join("\n");
              const a   = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv],{type:"text/csv"})); a.download=`paying-customers-${new Date().toISOString().slice(0,10)}.csv`; a.click();
              logAudit(db, { action:"csv_export", exportType:"paying_customers", exportedCount:payingUsers.length }).catch(()=>{});
            }} style={{ fontSize:11, padding:"6px 14px", borderRadius:8, border:`1px solid ${T.teal}`, background:"transparent", color:T.teal, cursor:"pointer", fontFamily:"'Outfit',sans-serif", fontWeight:600 }}>↓ CSV</button>
            <button type="button" onClick={() => { setTab("users"); setTierFilter("Pro"); }}
              style={{ fontSize:11, padding:"6px 14px", borderRadius:8, border:`1px solid ${T.gold}`, background:"transparent", color:T.gold, cursor:"pointer", fontFamily:"'Outfit',sans-serif", fontWeight:600 }}>Manage Users →</button>
          </div>
        </div>
        {payingUsers.length === 0 ? (
          <div style={{ padding:"36px 20px", textAlign:"center" }}>
            <div style={{ fontSize:13, color:T.textMuted }}>No paying customers yet</div>
          </div>
        ) : (
          <>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 100px 80px 90px 90px", padding:"8px 20px", borderBottom:`1px solid ${T.border}` }}>
              {["Customer","Plan","MRR","LTV Est.","Since"].map((h, i) => (
                <div key={i} style={{ fontSize:9, fontWeight:700, color:T.textMuted, textTransform:"uppercase", letterSpacing:1, textAlign:i>0?"right":"left" }}>{h}</div>
              ))}
            </div>
            {payingUsers.map((u, i) => {
              const isEnt   = u.tier === "enterprise";
              const mrrAmt  = isEnt ? 499 : 99;
              const ltvEst  = isEnt ? entLTV : proLTV;
              const daysOld = Math.floor((now - new Date(u.createdAt||0)) / 86400000);
              const color   = isEnt ? T.teal : T.green;
              return (
                <div key={u.uid} onClick={() => { setTab("users"); setPendingOpenUid(u.uid||u.id); }}
                  style={{ display:"grid", gridTemplateColumns:"1fr 100px 80px 90px 90px", padding:"13px 20px", borderBottom:i<payingUsers.length-1?`1px solid ${T.border}`:"none", cursor:"pointer", transition:"background 0.15s" }}
                  onMouseEnter={e => e.currentTarget.style.background = T.surfaceAlt}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <div style={{ display:"flex", alignItems:"center", gap:10, minWidth:0 }}>
                    <div style={{ width:32, height:32, borderRadius:9, background:`${color}18`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:800, color, flexShrink:0 }}>
                      {(u.name||u.email||"?")[0].toUpperCase()}
                    </div>
                    <div style={{ minWidth:0 }}>
                      <div style={{ fontSize:12, fontWeight:600, color:T.white, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{u.name||u.email?.split("@")[0]}</div>
                      <div style={{ fontSize:10, color:T.textMuted, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{u.email}</div>
                    </div>
                  </div>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"flex-end" }}>
                    <span style={{ fontSize:10, fontWeight:700, padding:"3px 8px", borderRadius:6, background:`${color}15`, color, border:`1px solid ${color}30` }}>{isEnt?"Enterprise":"Pro"}</span>
                  </div>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"flex-end" }}>
                    <span style={{ fontSize:13, fontWeight:700, color, fontFamily:"'Fraunces',serif" }}>AED {mrrAmt}</span>
                  </div>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"flex-end" }}>
                    <span style={{ fontSize:12, color:T.textSecondary, fontFamily:"'Fraunces',serif" }}>AED {ltvEst.toLocaleString()}</span>
                  </div>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"flex-end" }}>
                    <span style={{ fontSize:11, color:T.textMuted }}>{daysOld}d ago</span>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* ══ SECTION 6 — REVENUE MILESTONES ══ */}
      <div style={{ fontSize:10, fontWeight:700, color:T.textMuted, textTransform:"uppercase", letterSpacing:1.5, marginBottom:10 }}>Revenue Milestones</div>
      <div style={{ background:T.surface, borderRadius:14, border:`1px solid ${T.border}`, padding:20, marginBottom:20 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:18, flexWrap:"wrap", gap:8 }}>
          <div>
            <div style={{ fontSize:13, fontWeight:700, color:T.white }}>MRR Milestones</div>
            <div style={{ fontSize:11, color:T.textMuted, marginTop:2 }}>
              {nextMilestone ? `Next: ${nextMilestone.label} — ${nextMilestone.usersNeeded} more paying user${nextMilestone.usersNeeded!==1?"s":""} needed` : "All milestones reached 🎉"}
            </div>
          </div>
          <div style={{ fontFamily:"'Fraunces',serif", fontSize:16, fontWeight:800, color:T.green }}>
            AED {mrr.toLocaleString()} <span style={{ fontSize:11, color:T.textMuted, fontFamily:"'Outfit',sans-serif", fontWeight:400 }}>current</span>
          </div>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          {milestones.map((m, i) => (
            <div key={i}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <span style={{ fontSize:14 }}>{m.reached ? "✓" : i===milestones.findIndex(x=>!x.reached) ? "▶" : "○"}</span>
                  <span style={{ fontSize:12, fontWeight:m.reached?700:400, color:m.reached?T.white:T.textMuted }}>{m.label} MRR</span>
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  {!m.reached && <span style={{ fontSize:10, color:T.textMuted }}>{m.usersNeeded} users needed</span>}
                  <span style={{ fontSize:11, fontWeight:700, color:m.reached?T.green:T.textMuted }}>{m.reached?"Reached ✓":`${m.pct}%`}</span>
                </div>
              </div>
              <div style={{ height:5, background:T.surfaceAlt, borderRadius:3, overflow:"hidden" }}>
                <div style={{ width:`${m.pct}%`, height:"100%", background:m.reached?T.green:i===milestones.findIndex(x=>!x.reached)?T.gold:T.textMuted, borderRadius:3, transition:"width 0.8s ease", opacity:m.reached?1:0.7 }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ══ STAGE 2 DIVIDER — PADDLE ══ */}
      <div style={{ display:"flex", alignItems:"center", gap:14, margin:"10px 0 20px" }}>
        <div style={{ flex:1, height:1, background:T.border }} />
        <div style={{ display:"flex", alignItems:"center", gap:8, padding:"6px 16px", borderRadius:20, background:`${T.gold}10`, border:`1px solid ${T.gold}30` }}>
          <span style={{ fontSize:10, fontWeight:700, color:T.gold, letterSpacing:1.5, textTransform:"uppercase" }}>Paddle Payments — Stage 2</span>
          <span style={{ fontSize:9, padding:"2px 8px", borderRadius:6, background:`${T.gold}20`, color:T.gold, fontWeight:700 }}>LIVE WHEN CONNECTED</span>
        </div>
        <div style={{ flex:1, height:1, background:T.border }} />
      </div>

      {/* ══ SECTION 7 — PAYMENT EVENTS LOG ══ */}
      {(() => {
        const payments  = (window._revenuePayments || []);
        const hasPaddle = payments.length > 0;
        return (
          <div style={{ background:T.surface, borderRadius:14, border:`1px solid ${T.border}`, overflow:"hidden", marginBottom:20 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"16px 20px", borderBottom:`1px solid ${T.border}` }}>
              <div>
                <div style={{ fontSize:13, fontWeight:700, color:T.white }}>Payment Events Log</div>
                <div style={{ fontSize:11, color:T.textMuted, marginTop:2 }}>Every payment, renewal, failure and refund from Paddle</div>
              </div>
            </div>
            {!hasPaddle ? (
              <div style={{ padding:"48px 20px", textAlign:"center" }}>
                <div style={{ fontSize:36, marginBottom:12 }}>💳</div>
                <div style={{ fontSize:14, fontWeight:600, color:T.textSecondary, marginBottom:6 }}>Waiting for Paddle Connection</div>
                <div style={{ fontSize:12, color:T.textMuted, maxWidth:360, margin:"0 auto", lineHeight:1.6 }}>
                  Once your Paddle webhook is connected and writing to Firestore, every payment event will appear here in real time.
                </div>
                <div style={{ marginTop:20, display:"inline-flex", alignItems:"center", gap:8, padding:"8px 16px", borderRadius:10, background:`${T.gold}08`, border:`1px solid ${T.gold}20` }}>
                  <span style={{ width:6, height:6, borderRadius:"50%", background:T.gold, opacity:0.5 }} />
                  <span style={{ fontSize:11, color:T.textMuted }}>Firestore collection: <span style={{ color:T.gold, fontFamily:"monospace" }}>payments</span></span>
                </div>
              </div>
            ) : (
              <>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 100px 90px 90px 80px", padding:"8px 20px", borderBottom:`1px solid ${T.border}` }}>
                  {["Customer","Amount","Type","Date","Status"].map((h, i) => (
                    <div key={i} style={{ fontSize:9, fontWeight:700, color:T.textMuted, textTransform:"uppercase", letterSpacing:1, textAlign:i>0?"right":"left" }}>{h}</div>
                  ))}
                </div>
                {payments.map((p, i) => {
                  const statusColor = p.type==="payment_success"?T.green:p.type==="payment_failed"?T.red:T.gold;
                  const statusLabel = p.type==="payment_success"?"Paid":p.type==="payment_failed"?"Failed":p.type==="cancelled"?"Cancelled":"Refunded";
                  const u           = users.find(u => u.uid === p.userId);
                  return (
                    <div key={i} onClick={() => u && (setTab("users"), setPendingOpenUid(p.userId))}
                      style={{ display:"grid", gridTemplateColumns:"1fr 100px 90px 90px 80px", padding:"12px 20px", borderBottom:i<payments.length-1?`1px solid ${T.border}`:"none", cursor:u?"pointer":"default" }}
                      onMouseEnter={e => u && (e.currentTarget.style.background = T.surfaceAlt)}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                      <div style={{ fontSize:12, color:T.white }}>{u?.name||u?.email||p.userId?.slice(0,10)}</div>
                      <div style={{ fontSize:13, fontWeight:700, color:T.green, fontFamily:"'Fraunces',serif", textAlign:"right" }}>AED {p.amount?.toLocaleString()}</div>
                      <div style={{ fontSize:11, color:T.textSecondary, textAlign:"right", textTransform:"capitalize" }}>{p.planId||"Pro"}</div>
                      <div style={{ fontSize:11, color:T.textMuted, textAlign:"right" }}>{new Date(p.date).toLocaleDateString("en-AE",{day:"numeric",month:"short"})}</div>
                      <div style={{ textAlign:"right" }}>
                        <span style={{ fontSize:10, fontWeight:700, padding:"3px 8px", borderRadius:6, background:`${statusColor}15`, color:statusColor, border:`1px solid ${statusColor}30` }}>{statusLabel}</span>
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        );
      })()}

      {/* ══ SECTION 8 — FAILED PAYMENTS + CANCELLATION REASONS ══ */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:20 }}>
        <div style={{ background:T.surface, borderRadius:14, border:`1px solid ${T.border}`, padding:20 }}>
          <div style={{ fontSize:13, fontWeight:700, color:T.white, marginBottom:4 }}>Failed Payments</div>
          <div style={{ fontSize:11, color:T.textMuted, marginBottom:16 }}>Users at risk of churning due to payment failure</div>
          <div style={{ padding:"28px 0", textAlign:"center" }}>
            <div style={{ fontSize:13, color:T.textMuted }}>No failed payments</div>
            <div style={{ fontSize:11, color:T.textMuted, marginTop:4 }}>Will show at-risk users once Paddle is connected</div>
          </div>
        </div>
        <div style={{ background:T.surface, borderRadius:14, border:`1px solid ${T.border}`, padding:20 }}>
          <div style={{ fontSize:13, fontWeight:700, color:T.white, marginBottom:4 }}>Cancellation Reasons</div>
          <div style={{ fontSize:11, color:T.textMuted, marginBottom:16 }}>Why users cancelled their subscription</div>
          {[
            { reason:"Too expensive",       color:T.red,      pct:0 },
            { reason:"Not using it enough", color:T.gold,     pct:0 },
            { reason:"Missing features",    color:T.blue,     pct:0 },
            { reason:"Found alternative",   color:T.teal,     pct:0 },
            { reason:"Other / No reason",   color:T.textMuted,pct:0 },
          ].map((r, i) => (
            <div key={i} style={{ marginBottom:12 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                <span style={{ fontSize:12, color:T.textSecondary }}>{r.reason}</span>
                <span style={{ fontSize:11, fontWeight:700, color:r.pct>0?r.color:T.textMuted }}>{r.pct>0?`${r.pct}%`:"—"}</span>
              </div>
              <div style={{ height:3, background:T.surfaceAlt, borderRadius:2 }} />
            </div>
          ))}
          <div style={{ marginTop:16, padding:"10px 12px", borderRadius:8, background:`${T.gold}08`, border:`1px solid ${T.gold}20`, fontSize:11, color:T.textMuted, lineHeight:1.5 }}>
            Cancellation reasons will populate once Paddle webhook writes cancellation events to Firestore.
          </div>
        </div>
      </div>

      {/* ══ SECTION 9 — REAL REVENUE BY MONTH (PADDLE) ══ */}
      <div style={{ background:T.surface, borderRadius:14, border:`1px solid ${T.border}`, padding:20, marginBottom:20 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:16 }}>
          <div>
            <div style={{ fontSize:13, fontWeight:700, color:T.white }}>Real Revenue by Month</div>
            <div style={{ fontSize:11, color:T.textMuted, marginTop:2 }}>Stage 1 shows calculated MRR · This will show real Paddle amounts</div>
          </div>
          <div style={{ fontSize:10, padding:"4px 10px", borderRadius:8, background:`${T.gold}10`, border:`1px solid ${T.gold}30`, color:T.gold, fontWeight:700 }}>● PENDING PADDLE</div>
        </div>
        <div style={{ padding:"32px 0", textAlign:"center" }}>
          <div style={{ fontSize:11, color:T.textMuted, maxWidth:420, margin:"0 auto", lineHeight:1.7 }}>
            This chart will show real money received via Paddle including partial months, refunds, and actual AED amounts.
          </div>
          <div style={{ marginTop:20, display:"flex", justifyContent:"center", gap:8, flexWrap:"wrap" }}>
            {["Connect Paddle Webhook","→","Firebase Cloud Function","→","payments collection","→","Chart fills automatically"].map((s, i) => (
              <span key={i} style={{ fontSize:11, color:s==="→"?T.gold:T.textMuted, fontWeight:s==="→"?700:400 }}>{s}</span>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminRevenueTab;
